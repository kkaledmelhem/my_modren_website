package com.khaledmelhem.website.controller;

import com.khaledmelhem.website.model.AnalyticsEvent;
import com.khaledmelhem.website.repository.AnalyticsRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin("*")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private static final String KEY_PREFIX = "analytics:";

    @Autowired(required = false)
    private AnalyticsRepository analyticsRepository;

    @Autowired(required = false)
    private StringRedisTemplate redis;

    // POST /api/analytics/event
    // Body: {"type": "page_view", "data": "optional string"}
    @PostMapping("/event")
    public ResponseEntity<Map<String, Object>> trackEvent(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String type = body.getOrDefault("type", "").trim();
        String data = body.getOrDefault("data", null);

        if (type.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "type is required"));
        }

        // Truncate to column limits
        if (type.length() > 50) {
            type = type.substring(0, 50);
        }
        if (data != null && data.length() > 500) {
            data = data.substring(0, 500);
        }

        String ip = request.getRemoteAddr();
        String userAgent = request.getHeader("User-Agent");
        if (userAgent != null && userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }

        // Persist to DB (non-fatal)
        if (analyticsRepository != null) {
            try {
                AnalyticsEvent event = new AnalyticsEvent();
                event.setEventType(type);
                event.setEventData(data);
                event.setIpAddress(ip);
                event.setUserAgent(userAgent);
                analyticsRepository.save(event);
            } catch (Exception e) {
                log.warn("Failed to persist analytics event: {}", e.getMessage());
            }
        }

        // Increment Redis counter (non-fatal)
        try {
            if (redis != null) {
                redis.opsForValue().increment(KEY_PREFIX + type);
            }
        } catch (Exception e) {
            log.warn("Failed to increment Redis counter for event type '{}': {}", type, e.getMessage());
        }

        return ResponseEntity.ok(Map.of("tracked", true));
    }

    // GET /api/analytics/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long pageViews      = getCount("page_view");
        long resumeDownloads = getCount("resume_download");
        long projectClicks  = getCount("project_click");
        long sectionViews   = getCount("section_view");
        long jdAnalyze      = getCount("jd_analyze");
        long contactSubmit  = getCount("contact_submit");

        long totalEvents = pageViews + resumeDownloads + projectClicks + sectionViews + jdAnalyze + contactSubmit;

        Map<String, Object> stats = new HashMap<>();
        stats.put("pageViews",       pageViews);
        stats.put("resumeDownloads", resumeDownloads);
        stats.put("projectClicks",   projectClicks);
        stats.put("sectionViews",    sectionViews);
        stats.put("totalEvents",     totalEvents);

        return ResponseEntity.ok(stats);
    }

    // Try Redis first, fall back to DB count
    private long getCount(String eventType) {
        // Try Redis
        if (redis != null) {
            try {
                String value = redis.opsForValue().get(KEY_PREFIX + eventType);
                if (value != null) {
                    return Long.parseLong(value);
                }
            } catch (Exception e) {
                log.warn("Redis read failed for key '{}{}': {}", KEY_PREFIX, eventType, e.getMessage());
            }
        }

        // Fall back to DB
        if (analyticsRepository != null) {
            try {
                return analyticsRepository.countByEventType(eventType);
            } catch (Exception e) {
                log.warn("DB count failed for event type '{}': {}", eventType, e.getMessage());
            }
        }

        return 0L;
    }
}
