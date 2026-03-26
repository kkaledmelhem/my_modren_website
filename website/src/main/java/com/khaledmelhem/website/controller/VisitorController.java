package com.khaledmelhem.website.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class VisitorController {

    private static final Logger log = LoggerFactory.getLogger(VisitorController.class);

    private static final String VISITOR_COUNT_KEY = "visitor:count";

    @Autowired(required = false)
    private StringRedisTemplate redis;

    @PostMapping("/visit")
    public ResponseEntity<Map<String, Object>> recordVisit() {
        long count = 0;
        if (redis != null) {
            try {
                String weekKey = buildWeekKey();
                Long total = redis.opsForValue().increment(VISITOR_COUNT_KEY);
                redis.opsForValue().increment(weekKey);
                count = total != null ? total : 0;
            } catch (Exception e) {
                log.warn("Redis increment failed: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long visitors = 0;
        long week = 0;
        if (redis != null) {
            try {
                String totalStr = redis.opsForValue().get(VISITOR_COUNT_KEY);
                if (totalStr != null) {
                    visitors = Long.parseLong(totalStr);
                }
                String weekKey = buildWeekKey();
                String weekStr = redis.opsForValue().get(weekKey);
                if (weekStr != null) {
                    week = Long.parseLong(weekStr);
                }
            } catch (Exception e) {
                log.warn("Redis read failed: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("visitors", visitors, "week", week));
    }

    private String buildWeekKey() {
        LocalDate now = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int weekNumber = now.get(weekFields.weekOfWeekBasedYear());
        int year = now.get(weekFields.weekBasedYear());
        return String.format("visitor:week:%d-W%02d", year, weekNumber);
    }
}
