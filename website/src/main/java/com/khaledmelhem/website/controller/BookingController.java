package com.khaledmelhem.website.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class BookingController {

    private static final Logger log = LoggerFactory.getLogger(BookingController.class);

    private static final ZoneId JORDAN_ZONE = ZoneId.of("Asia/Amman");
    private static final int[] SLOT_HOURS = {9, 11, 14, 16};
    private static final int MAX_SLOTS = 20;
    private static final DateTimeFormatter ISO_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssxxx");

    private final ConcurrentHashMap<String, String> bookings = new ConcurrentHashMap<>();

    public static class BookingRequest {
        public String name;
        public String email;
        public String message;
        public String slot;
    }

    @GetMapping("/availability")
    public ResponseEntity<List<Map<String, String>>> getAvailability() {
        List<Map<String, String>> slots = new ArrayList<>();
        ZonedDateTime now = ZonedDateTime.now(JORDAN_ZONE);
        ZonedDateTime cutoff = now.plusHours(48);

        LocalDate startDate = now.toLocalDate();
        LocalDate endDate = startDate.plusDays(14);

        for (LocalDate date = startDate; !date.isAfter(endDate) && slots.size() < MAX_SLOTS; date = date.plusDays(1)) {
            DayOfWeek dow = date.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;

            for (int hour : SLOT_HOURS) {
                ZonedDateTime slotTime = ZonedDateTime.of(date, LocalTime.of(hour, 0), JORDAN_ZONE);
                if (!slotTime.isAfter(cutoff)) continue;
                if (bookings.containsKey(slotTime.format(ISO_FORMATTER))) continue;

                Map<String, String> slotMap = new LinkedHashMap<>();
                slotMap.put("slot", slotTime.format(ISO_FORMATTER));
                slotMap.put("label", buildLabel(slotTime));
                slots.add(slotMap);

                if (slots.size() >= MAX_SLOTS) break;
            }
        }

        return ResponseEntity.ok(slots);
    }

    @PostMapping("/book")
    public ResponseEntity<Map<String, Object>> book(@RequestBody BookingRequest request) {
        if (isBlank(request.name) || isBlank(request.email) || isBlank(request.slot)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("ok", false, "message", "name, email, and slot are required"));
        }

        String existing = bookings.putIfAbsent(request.slot, request.name + " <" + request.email + ">");
        if (existing == null) {
            log.info("Booking confirmed: {} for slot {}", request.name, request.slot);
            return ResponseEntity.ok(Map.of("ok", true, "message", "Booking confirmed!"));
        } else {
            return ResponseEntity.ok(Map.of("ok", false, "message", "Slot already taken"));
        }
    }

    private String buildLabel(ZonedDateTime slot) {
        String dayName = slot.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        String monthName = slot.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        int day = slot.getDayOfMonth();
        int hour = slot.getHour();
        String ampm = hour < 12 ? "AM" : "PM";
        int displayHour = hour % 12 == 0 ? 12 : hour % 12;
        return String.format("%s, %s %d · %d:00 %s", dayName, monthName, day, displayHour, ampm);
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
