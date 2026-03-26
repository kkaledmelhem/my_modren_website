package com.khaledmelhem.website.controller;

import com.khaledmelhem.website.model.VisitorWord;
import com.khaledmelhem.website.repository.VisitorWordRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wall")
@CrossOrigin("*")
public class WallController {

    private static final Logger logger = LoggerFactory.getLogger(WallController.class);

    private static final String WORD_PATTERN = "^[a-zA-Z\\u0600-\\u06FF]+$";
    private static final String REDIS_KEY    = "wall:words";

    // In-memory fallback when JPA/DB is unavailable
    private final List<Map<String, Object>> inMemoryWords = new ArrayList<>();
    private final Set<String>               inMemoryIpHashes = new HashSet<>();

    @Autowired(required = false)
    private VisitorWordRepository wordRepository;

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // ── POST /api/wall/word ────────────────────────────────────

    @PostMapping("/word")
    public ResponseEntity<Map<String, Object>> submitWord(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        try {
            String word = body.getOrDefault("word", "").trim();

            // Validation: 1–30 chars, letters only (Latin + Arabic)
            if (word.isEmpty() || word.length() > 30 || !word.matches(WORD_PATTERN)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error",   "invalid_word",
                        "message", "Word must be 1–30 letters only (no numbers or symbols)."
                ));
            }

            String ip     = resolveClientIp(request);
            String ipHash = sha256(ip);

            // Duplicate IP check
            boolean alreadySubmitted = (wordRepository != null)
                    ? wordRepository.existsByIpHash(ipHash)
                    : inMemoryIpHashes.contains(ipHash);

            if (alreadySubmitted) {
                return ResponseEntity.ok(Map.of(
                        "error",   "already_submitted",
                        "message", "You've already left your word."
                ));
            }

            // Persist
            long total;
            Map<String, Object> savedDto;

            if (wordRepository != null) {
                VisitorWord entity = new VisitorWord();
                entity.setWord(word);
                entity.setIpHash(ipHash);
                entity.setApproved(true);
                VisitorWord saved = wordRepository.save(entity);
                total    = wordRepository.countByApprovedTrue();
                savedDto = Map.of("word", saved.getWord(), "id", saved.getId());
                // Invalidate Redis cache so next GET reflects the new word
                evictRedisCache();
            } else {
                // In-memory fallback
                long id = inMemoryWords.size() + 1L;
                savedDto = new LinkedHashMap<>();
                savedDto.put("word", word);
                savedDto.put("id",   id);
                inMemoryWords.add(0, savedDto);
                inMemoryIpHashes.add(ipHash);
                total = inMemoryWords.size();
            }

            logger.info("Wall: new word '{}' added (total: {})", word, total);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "word",    savedDto,
                    "total",   total
            ));

        } catch (Exception ex) {
            logger.error("Wall POST error: {}", ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body(Map.of(
                    "error",   "server_error",
                    "message", "Something went wrong. Please try again."
            ));
        }
    }

    // ── GET /api/wall/words ────────────────────────────────────

    @GetMapping("/words")
    public ResponseEntity<List<Map<String, Object>>> getWords() {
        try {
            // Try Redis cache first
            if (redisTemplate != null) {
                try {
                    String cached = redisTemplate.opsForValue().get(REDIS_KEY);
                    if (cached != null) {
                        // Deserialize manually to avoid extra Jackson dependency coupling
                        List<Map<String, Object>> parsed = parseJsonWordList(cached);
                        if (parsed != null) {
                            return ResponseEntity.ok(parsed);
                        }
                    }
                } catch (Exception redisEx) {
                    logger.warn("Redis read failed, falling back to DB: {}", redisEx.getMessage());
                }
            }

            // Query DB or in-memory
            List<Map<String, Object>> result;
            if (wordRepository != null) {
                result = wordRepository.findByApprovedTrueOrderByCreatedAtDesc()
                        .stream()
                        .limit(500)
                        .map(w -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("word", w.getWord());
                            m.put("id",   w.getId());
                            return m;
                        })
                        .collect(Collectors.toList());
            } else {
                result = inMemoryWords.stream()
                        .limit(500)
                        .collect(Collectors.toList());
            }

            // Store in Redis (60 seconds TTL)
            if (redisTemplate != null) {
                try {
                    String json = serializeWordList(result);
                    redisTemplate.opsForValue().set(REDIS_KEY, json, 60, TimeUnit.SECONDS);
                } catch (Exception redisEx) {
                    logger.warn("Redis write failed: {}", redisEx.getMessage());
                }
            }

            return ResponseEntity.ok(result);

        } catch (Exception ex) {
            logger.error("Wall GET error: {}", ex.getMessage(), ex);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    // ── Helpers ───────────────────────────────────────────────

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is always available in the JDK
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }

    private void evictRedisCache() {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(REDIS_KEY);
            } catch (Exception ex) {
                logger.warn("Redis eviction failed: {}", ex.getMessage());
            }
        }
    }

    /** Minimal JSON serializer — avoids pulling in ObjectMapper directly. */
    private String serializeWordList(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            Map<String, Object> m = list.get(i);
            sb.append("{\"word\":\"")
              .append(((String) m.get("word")).replace("\"", "\\\""))
              .append("\",\"id\":")
              .append(m.get("id"))
              .append("}");
            if (i < list.size() - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }

    /** Minimal JSON parser for the format produced by serializeWordList. */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseJsonWordList(String json) {
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            // Strip outer brackets
            String inner = json.trim();
            if (!inner.startsWith("[") || !inner.endsWith("]")) return null;
            inner = inner.substring(1, inner.length() - 1).trim();
            if (inner.isEmpty()) return result;

            // Split by },{
            String[] entries = inner.split("\\},\\s*\\{");
            for (String entry : entries) {
                entry = entry.replaceAll("^\\{|\\}$", "");
                Map<String, Object> m = new LinkedHashMap<>();
                // Parse "word":"VALUE","id":NUMBER
                java.util.regex.Matcher wordMatcher =
                    java.util.regex.Pattern.compile("\"word\":\"([^\"]+)\"").matcher(entry);
                java.util.regex.Matcher idMatcher =
                    java.util.regex.Pattern.compile("\"id\":(\\d+)").matcher(entry);
                if (wordMatcher.find() && idMatcher.find()) {
                    m.put("word", wordMatcher.group(1));
                    m.put("id",   Long.parseLong(idMatcher.group(1)));
                    result.add(m);
                }
            }
            return result;
        } catch (Exception ex) {
            logger.warn("Redis cache parse failed, will re-query DB: {}", ex.getMessage());
            return null;
        }
    }
}
