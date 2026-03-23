package com.khaledmelhem.website.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * GET  /api/status        → { "status": "open" | "busy" | "closed" }
 * POST /api/status/toggle → cycles open → busy → closed → open
 * PUT  /api/status        → { "status": "open" } to set explicitly
 */
@RestController
@RequestMapping("/api/status")
@CrossOrigin(origins = "*")
public class StatusController {

    private final AtomicReference<String> status = new AtomicReference<>("open");

    @GetMapping
    public ResponseEntity<Map<String, Object>> getStatus() {
        return ResponseEntity.ok(Map.of("status", status.get()));
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggle() {
        String next = switch (status.get()) {
            case "open"   -> "busy";
            case "busy"   -> "closed";
            default       -> "open";
        };
        status.set(next);
        return ResponseEntity.ok(Map.of("status", next));
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> setStatus(@RequestBody Map<String, String> body) {
        String value = body.get("status");
        if (value == null || !value.matches("open|busy|closed")) {
            return ResponseEntity.badRequest().body(Map.of("error", "status must be: open | busy | closed"));
        }
        status.set(value);
        return ResponseEntity.ok(Map.of("status", value));
    }
}
