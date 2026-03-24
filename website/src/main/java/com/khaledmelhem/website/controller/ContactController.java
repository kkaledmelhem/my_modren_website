package com.khaledmelhem.website.controller;

import com.khaledmelhem.website.model.ContactRequest;
import com.khaledmelhem.website.model.ContactSubmission;
import com.khaledmelhem.website.repository.ContactRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ContactController {

    private static final Logger logger = LoggerFactory.getLogger(ContactController.class);
    private final List<Map<String, Object>> messages = new ArrayList<>();

    @Autowired(required = false)
    private ContactRepository contactRepository;

    @PostMapping("/contact")
    public ResponseEntity<Map<String, Object>> submitContact(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest) {
        logger.info("New contact message from: {} <{}>", request.getName(), request.getEmail());

        if (contactRepository != null) {
            ContactSubmission sub = new ContactSubmission();
            sub.setName(request.getName());
            sub.setEmail(request.getEmail());
            sub.setSubject(request.getSubject());
            sub.setMessage(request.getMessage());
            sub.setPhone(request.getPhone());
            sub.setIpAddress(httpRequest.getRemoteAddr());
            contactRepository.save(sub);
            logger.info("Saved contact submission to PostgreSQL, id: {}", sub.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thank you, " + request.getName() + "! Your message has been received. I'll get back to you shortly.",
                    "id", sub.getId()
            ));
        }

        Map<String, Object> saved = Map.of(
                "id", messages.size() + 1,
                "name", request.getName(),
                "email", request.getEmail(),
                "subject", request.getSubject(),
                "message", request.getMessage(),
                "phone", request.getPhone() != null ? request.getPhone() : "",
                "receivedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
        messages.add(saved);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thank you, " + request.getName() + "! Your message has been received. I'll get back to you shortly.",
                "id", saved.get("id")
        ));
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        return ResponseEntity.ok(Map.of(
                "name", "Khaled Melhem",
                "title", "Full Stack Developer",
                "specialization", List.of("Spring Boot", "React", "Java", "MySQL", "Docker"),
                "experience", "8+ Years",
                "projectsCompleted", 200,
                "clientsSatisfied", 50,
                "email", "khaled@example.com",
                "location", "Available Worldwide"
        ));
    }

    @GetMapping("/projects")
    public ResponseEntity<List<Map<String, Object>>> getProjects() {
        List<Map<String, Object>> projects = List.of(
                Map.of("id", 1, "title", "Bot Platform", "category", "web",
                        "description", "Enterprise chatbot platform supporting Facebook, WhatsApp & Web",
                        "tech", List.of("Spring Boot", "React", "MySQL", "ActiveMQ"),
                        "color", "#6366f1"),
                Map.of("id", 2, "title", "E-Commerce Suite", "category", "web",
                        "description", "Full-featured e-commerce solution with real-time inventory",
                        "tech", List.of("Spring Boot", "React", "PostgreSQL", "Redis"),
                        "color", "#06b6d4"),
                Map.of("id", 3, "title", "Admin Portal", "category", "web",
                        "description", "Secure role-based admin dashboard with analytics",
                        "tech", List.of("Spring Security", "Thymeleaf", "Chart.js"),
                        "color", "#a855f7"),
                Map.of("id", 4, "title", "WhatsApp Integration", "category", "api",
                        "description", "WhatsApp Business API integration with broadcast system",
                        "tech", List.of("Spring Boot", "WhatsApp API", "REST"),
                        "color", "#10b981"),
                Map.of("id", 5, "title", "Live Agent System", "category", "api",
                        "description", "Real-time live chat agent management with ticket system",
                        "tech", List.of("WebSocket", "Spring Boot", "React", "STOMP"),
                        "color", "#f59e0b"),
                Map.of("id", 6, "title", "Analytics Dashboard", "category", "mobile",
                        "description", "Data analytics dashboard with real-time charts & reports",
                        "tech", List.of("React", "D3.js", "Spring Boot", "MySQL"),
                        "color", "#ef4444")
        );
        return ResponseEntity.ok(projects);
    }
}
