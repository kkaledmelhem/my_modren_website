package com.khaledmelhem.website.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.khaledmelhem.website.model.AnalyticsEvent;
import com.khaledmelhem.website.repository.AnalyticsRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin("*")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);

    // --- Resume download tracker (existing) ---

    private static final String EVENT_TYPE = "resume_download";
    private static final String REDIS_KEY  = "analytics:resume_download";

    @Autowired(required = false)
    private AnalyticsRepository analyticsRepository;

    @Autowired(required = false)
    private StringRedisTemplate redis;

    // GET /api/resume/track
    // Fire-and-forget tracker; actual PDF is served from /Khaled_Melhem_Resume.pdf (static)
    @GetMapping("/resume/track")
    public ResponseEntity<Map<String, Object>> trackDownload(HttpServletRequest request) {
        String ip        = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }

        // Persist to DB (non-fatal)
        if (analyticsRepository != null) {
            try {
                AnalyticsEvent event = new AnalyticsEvent();
                event.setEventType(EVENT_TYPE);
                event.setIpAddress(ip);
                event.setUserAgent(userAgent);
                analyticsRepository.save(event);
            } catch (Exception e) {
                log.warn("Failed to persist resume_download event: {}", e.getMessage());
            }
        }

        // Increment Redis counter (non-fatal)
        try {
            if (redis != null) {
                redis.opsForValue().increment(REDIS_KEY);
            }
        } catch (Exception e) {
            log.warn("Failed to increment Redis counter for resume_download: {}", e.getMessage());
        }

        return ResponseEntity.ok(Map.of("tracked", true));
    }

    // --- Resume tailoring via Groq (new) ---

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    private static final String RESUME_SYSTEM_PROMPT =
        "You are an expert resume writer. Given Khaled Melhem's profile and a job description, rewrite his experience bullet points to maximize keyword alignment and relevance.\n\n" +
        "Khaled's profile:\n" +
        "- Team Lead & Backend Engineer at Robotack (Aug 2023–Present): Led 4-engineer team. Built WhatsApp/Instagram chatbot platform processing 10K+ daily interactions using Spring Boot, Java 21, Redis, PostgreSQL, Groq AI, Meta Graph API. Architected visual flow-builder (drag-and-drop, no-code). Migrated Java 8→21, Spring 5→Boot 3 (340 files, 17 CVEs fixed, -34% cold start).\n" +
        "- Backend Developer at JUST (Sep 2019–Jun 2023): Built REST APIs, NLP pipelines, Dialogflow CX bots, ActiveMQ integrations.\n" +
        "- Skills: Java 17+, Spring Boot 3, Spring Security, REST APIs, PostgreSQL, MySQL, Redis, Docker, GitHub Actions, React, Groq/OpenAI APIs, Dialogflow.\n\n" +
        "Return ONLY valid JSON (no markdown, no code fences) in this exact shape:\n" +
        "{\n" +
        "  \"name\": \"Khaled Melhem\",\n" +
        "  \"title\": \"<role title tailored to JD>\",\n" +
        "  \"summary\": \"<2-sentence professional summary tailored to JD>\",\n" +
        "  \"experiences\": [\n" +
        "    {\n" +
        "      \"company\": \"Robotack\",\n" +
        "      \"role\": \"Team Lead & Backend Engineer\",\n" +
        "      \"period\": \"Aug 2023 – Present\",\n" +
        "      \"bullets\": [\"<tailored bullet 1>\", \"<tailored bullet 2>\", \"<tailored bullet 3>\", \"<tailored bullet 4>\"]\n" +
        "    },\n" +
        "    {\n" +
        "      \"company\": \"JUST\",\n" +
        "      \"role\": \"Backend Developer\",\n" +
        "      \"period\": \"Sep 2019 – Jun 2023\",\n" +
        "      \"bullets\": [\"<tailored bullet 1>\", \"<tailored bullet 2>\", \"<tailored bullet 3>\"]\n" +
        "    }\n" +
        "  ],\n" +
        "  \"skills\": [\"<top 10 skills most relevant to JD>\"],\n" +
        "  \"education\": \"B.Sc. Computer Engineering · Jordan University of Science and Technology · 2019\"\n" +
        "}";

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @PostMapping("/tailor-resume")
    public ResponseEntity<Object> tailorResume(@RequestBody Map<String, String> body) {
        String jobDescription = body.getOrDefault("jobDescription", "").trim();
        if (jobDescription.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "jobDescription is required"));
        }

        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set — returning hardcoded fallback resume");
            return ResponseEntity.ok(buildFallbackResume());
        }

        try {
            String rawJson = callGroqForResume(jobDescription);
            JsonNode parsed = objectMapper.readTree(rawJson);
            return ResponseEntity.ok(parsed);
        } catch (Exception e) {
            log.error("Resume tailoring failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(buildFallbackResume());
        }
    }

    // ---- Groq integration ----

    private String callGroqForResume(String jobDescription) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", MODEL);
        requestBody.put("max_tokens", 1200);
        requestBody.put("temperature", 0.4);

        ArrayNode messages = requestBody.putArray("messages");

        ObjectNode systemMsg = messages.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", RESUME_SYSTEM_PROMPT);

        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", "Job description:\n\n" + jobDescription);

        String requestJson = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Groq returned HTTP {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Groq API error: HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText().trim();

        // Strip markdown code fences just in case
        if (content.startsWith("```")) {
            content = content.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
        }

        return content;
    }

    // ---- Fallback ----

    private Map<String, Object> buildFallbackResume() {
        return Map.of(
            "name", "Khaled Melhem",
            "title", "Backend Engineer & Team Lead",
            "summary", "Experienced backend engineer with 4+ years building scalable Java/Spring Boot systems and AI-powered integrations. " +
                       "Proven team lead who has delivered enterprise-grade chatbot platforms processing 10K+ daily interactions.",
            "experiences", List.of(
                Map.of(
                    "company", "Robotack",
                    "role", "Team Lead & Backend Engineer",
                    "period", "Aug 2023 – Present",
                    "bullets", List.of(
                        "Led a 4-engineer team to design and ship Robochat, a multi-channel AI chatbot platform serving 10K+ daily interactions for enterprise clients including Umniah.",
                        "Built WhatsApp & Instagram chatbot backend using Spring Boot 3, Java 21, Redis, PostgreSQL, and Meta Graph API.",
                        "Architected a visual drag-and-drop flow builder enabling non-technical users to create chatbot conversations without code.",
                        "Led migration of 340 files from Java 8/Spring 5 to Java 21/Spring Boot 3, fixing 17 CVEs and reducing cold-start time by 34%."
                    )
                ),
                Map.of(
                    "company", "JUST",
                    "role", "Backend Developer",
                    "period", "Sep 2019 – Jun 2023",
                    "bullets", List.of(
                        "Developed REST APIs and NLP data-management pipelines for the MFLP multilingual corpus platform used by researchers.",
                        "Built Dialogflow CX conversational bots and integrated them with ActiveMQ for async event-driven processing.",
                        "Delivered backend services in Java/Spring Boot supporting real-time linguistic annotation workflows."
                    )
                )
            ),
            "skills", List.of(
                "Java 17+", "Spring Boot 3", "Spring Security", "REST APIs",
                "PostgreSQL", "Redis", "Docker", "GitHub Actions", "React", "Groq/OpenAI APIs"
            ),
            "education", "B.Sc. Computer Engineering · Jordan University of Science and Technology · 2019"
        );
    }
}
