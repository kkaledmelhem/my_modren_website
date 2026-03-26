package com.khaledmelhem.website.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin("*")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

    @PostMapping("/event")
    public ResponseEntity<Map<String, Object>> trackEvent(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String type = body.getOrDefault("type", "").trim();
        if (type.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "type is required"));
        }
        if (type.length() > 50) type = type.substring(0, 50);

        counters.computeIfAbsent(type, k -> new AtomicLong(0)).incrementAndGet();
        log.debug("Analytics event: {} from {}", type, request.getRemoteAddr());

        return ResponseEntity.ok(Map.of("tracked", true));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pageViews",       getCount("page_view"));
        stats.put("resumeDownloads", getCount("resume_download"));
        stats.put("projectClicks",   getCount("project_click"));
        stats.put("sectionViews",    getCount("section_view"));
        stats.put("totalEvents",     counters.values().stream().mapToLong(AtomicLong::get).sum());
        return ResponseEntity.ok(stats);
    }

    private long getCount(String eventType) {
        AtomicLong c = counters.get(eventType);
        return c != null ? c.get() : 0L;
    }
}
