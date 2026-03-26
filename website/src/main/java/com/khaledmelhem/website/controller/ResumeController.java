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

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
@CrossOrigin("*")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);

    private static final String EVENT_TYPE   = "resume_download";
    private static final String REDIS_KEY    = "analytics:resume_download";

    @Autowired(required = false)
    private AnalyticsRepository analyticsRepository;

    @Autowired(required = false)
    private StringRedisTemplate redis;

    // GET /api/resume/track
    // Fire-and-forget tracker; actual PDF is served from /Khaled_Melhem_Resume.pdf (static)
    @GetMapping("/track")
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
}
