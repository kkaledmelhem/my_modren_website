package com.khaledmelhem.website.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class VisitorController {

    private final AtomicLong totalVisitors = new AtomicLong(0);
    private final ConcurrentHashMap<String, AtomicLong> weekCounts = new ConcurrentHashMap<>();

    @PostMapping("/visit")
    public ResponseEntity<Map<String, Object>> recordVisit() {
        long count = totalVisitors.incrementAndGet();
        weekCounts.computeIfAbsent(buildWeekKey(), k -> new AtomicLong(0)).incrementAndGet();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        long visitors = totalVisitors.get();
        long week = weekCounts.getOrDefault(buildWeekKey(), new AtomicLong(0)).get();
        return ResponseEntity.ok(Map.of("visitors", visitors, "week", week));
    }

    private String buildWeekKey() {
        LocalDate now = LocalDate.now();
        WeekFields weekFields = WeekFields.of(Locale.getDefault());
        int weekNumber = now.get(weekFields.weekOfWeekBasedYear());
        int year = now.get(weekFields.weekBasedYear());
        return String.format("%d-W%02d", year, weekNumber);
    }
}
