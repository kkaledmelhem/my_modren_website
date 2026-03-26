package com.khaledmelhem.website.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    private static final String SYSTEM_PROMPT =
        "You are the personal AI assistant on Khaled Melhem's portfolio website. Your only job is to answer questions about Khaled.\n\n" +

        "LANGUAGE RULE — THIS IS CRITICAL:\n" +
        "- If the user's message contains ANY Arabic text, you MUST reply ENTIRELY in Arabic.\n" +
        "- If the user's message is in English, reply ENTIRELY in English.\n" +
        "- Never mix languages in the same reply.\n\n" +

        "SCOPE RULE:\n" +
        "- Only answer questions about Khaled. If asked something unrelated (politics, coding help, general knowledge), politely say you can only talk about Khaled.\n\n" +

        "PROFESSIONAL PROFILE OF KHALED MELHEM:\n\n" +

        "Education:\n" +
        "- Degree: Bachelor of Science in Software Engineering\n" +
        "- University: Jordan University of Science and Technology (JUST)\n" +
        "- GPA: 3.21\n\n" +

        "Current Role:\n" +
        "- Title: Team Lead & Software Engineer at Robotack (since August 2023)\n" +
        "- Leading a team of 4 engineers\n" +
        "- Architected Robochat: a multi-channel AI chatbot platform (Facebook Messenger, WhatsApp Business, Twitter DMs, web chat)\n" +
        "- Flagship client: Umniah chatbot handling 10,000+ daily interactions\n" +
        "- Led full migration from Java 8/Spring 5 to Java 21/Spring Boot 3\n" +
        "- Increased user engagement by 20% through dynamic multi-step chatbot flows\n\n" +

        "Previous Experience:\n" +
        "- Backend Developer at JUST research lab (2019–2023)\n" +
        "- Built MFLP: multilingual NLP dataset management platform used by researchers\n\n" +

        "Technical Skills:\n" +
        "- Backend: Java 17+, Spring Boot 3, Spring MVC, Spring Security, Hibernate/JPA, REST APIs\n" +
        "- Databases: MySQL, PostgreSQL, Redis, Liquibase\n" +
        "- DevOps: Docker, GitHub Actions, CI/CD, Linux, Nginx, Maven\n" +
        "- Integrations: Meta Graph API, WhatsApp Business API, Dialogflow ES/CX, OpenAI API, ActiveMQ\n" +
        "- Frontend: React, JavaScript, HTML5, CSS3, Thymeleaf\n" +
        "- Tools: Git, IntelliJ IDEA, Postman\n\n" +

        "Key Projects:\n" +
        "- Robochat: multi-channel AI chatbot platform (flagship at Robotack)\n" +
        "- Umniah Chatbot: enterprise WhatsApp + Instagram bot, 10K+ daily interactions\n" +
        "- Advanced Chatbot Builder: visual flow builder for chatbot conversations\n" +
        "- Legacy System Modernization: Java 8 → Java 21, Spring 5 → Spring Boot 3\n" +
        "- MFLP: multilingual corpus platform (JUST research)\n\n" +

        "Professional Links:\n" +
        "- LinkedIn: linkedin.com/in/khaledmelhem\n" +
        "- GitHub: github.com/kmelhem-dev\n\n" +

        "Availability: Open to full-time Software Engineering / Team Lead roles, remote and on-site.\n\n" +

        "Style: Be warm, professional, and concise. 2–5 sentences unless more detail is asked. Never share personal information like phone or address.";

    // Fallback keyword responses (English)
    private static final Map<String, String> FALLBACK_EN = Map.ofEntries(
        Map.entry("location",       "Khaled is based in Amman, Jordan."),
        Map.entry("where",          "Khaled is based in Amman, Jordan."),
        Map.entry("major",          "Khaled studied Software Engineering (B.Sc.) at Jordan University of Science and Technology (JUST)."),
        Map.entry("university",     "Khaled studied Software Engineering (B.Sc.) at Jordan University of Science and Technology (JUST)."),
        Map.entry("just",           "Khaled studied Software Engineering (B.Sc.) at Jordan University of Science and Technology (JUST)."),
        Map.entry("gpa",            "Khaled's GPA is 3.21."),
        Map.entry("role",           "Khaled is a Team Lead & Software Engineer at Robotack (since August 2023)."),
        Map.entry("job",            "Khaled is a Team Lead & Software Engineer at Robotack (since August 2023)."),
        Map.entry("work",           "Khaled is a Team Lead & Software Engineer at Robotack (since August 2023)."),
        Map.entry("robotack",       "At Robotack, Khaled architected Robochat — a multi-channel AI chatbot platform supporting Facebook Messenger, WhatsApp Business, Twitter DMs, and web chat. He leads a team of 4 engineers."),
        Map.entry("robochat",       "Robochat is Khaled's flagship project at Robotack — a multi-channel AI chatbot platform. The Umniah chatbot built on it handles 10,000+ daily interactions."),
        Map.entry("skill",          "Khaled's main skills include Java 17+, Spring Boot 3, Spring Security, Hibernate/JPA, MySQL, PostgreSQL, Redis, Docker, GitHub Actions, React, and integrations like WhatsApp Business API, Dialogflow, and OpenAI API."),
        Map.entry("experience",     "Khaled has 2.5+ years of professional experience, including his current role at Robotack and prior work as a Backend Developer at JUST's research lab (2019–2023)."),
        Map.entry("email",          "You can reach Khaled via the contact form on this website or on LinkedIn at linkedin.com/in/khaledmelhem."),
        Map.entry("contact",        "You can reach Khaled via the contact form on this website or on LinkedIn at linkedin.com/in/khaledmelhem."),
        Map.entry("linkedin",       "Khaled's LinkedIn profile is at linkedin.com/in/khaledmelhem."),
        Map.entry("github",         "Khaled's GitHub is github.com/kmelhem-dev."),
        Map.entry("language",       "Khaled speaks Arabic (native) and English (professional)."),
        Map.entry("available",      "Khaled is open to full-time backend roles, both remote and on-site."),
        Map.entry("open",           "Khaled is open to full-time backend roles, both remote and on-site."),
        Map.entry("portfolio",      "This portfolio website is built with Java (Spring Boot) + React and deployed on Railway.")
    );

    // Fallback keyword responses (Arabic)
    private static final Map<String, String> FALLBACK_AR = Map.ofEntries(
        Map.entry("مكان",       "خالد يقيم في عمّان، الأردن."),
        Map.entry("أين",        "خالد يقيم في عمّان، الأردن."),
        Map.entry("تخصص",       "تخصص خالد هندسة البرمجيات (بكالوريوس) من جامعة العلوم والتكنولوجيا الأردنية."),
        Map.entry("جامعة",      "تخصص خالد هندسة البرمجيات (بكالوريوس) من جامعة العلوم والتكنولوجيا الأردنية."),
        Map.entry("معدل",       "معدل خالد التراكمي هو 3.21."),
        Map.entry("عمل",        "خالد يعمل قائد فريق ومهندس برمجيات في شركة Robotack منذ أغسطس 2023."),
        Map.entry("وظيفة",      "خالد يعمل قائد فريق ومهندس برمجيات في شركة Robotack منذ أغسطس 2023."),
        Map.entry("مهارات",     "تشمل مهارات خالد: Java, Spring Boot, Spring Security, Hibernate, MySQL, PostgreSQL, Redis, Docker, React، وتكاملات مثل WhatsApp Business API و OpenAI API."),
        Map.entry("خبرة",       "لدى خالد أكثر من 2.5 سنة من الخبرة المهنية في تطوير البرمجيات."),
        Map.entry("بريد",       "يمكنك التواصل مع خالد عبر البريد الإلكتروني: khadme9@gmail.com."),
        Map.entry("تواصل",      "يمكنك التواصل مع خالد عبر نموذج التواصل في الموقع أو عبر LinkedIn: linkedin.com/in/khaledmelhem."),
        Map.entry("لغة",        "خالد يتحدث العربية (لغة أم) والإنجليزية (مستوى احترافي)."),
        Map.entry("متاح",       "خالد منفتح على فرص عمل كاملة في تطوير الواجهة الخلفية، سواء عن بُعد أو حضورياً.")
    );

    @Value("${groq.api.key:}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @PostMapping("/ai-chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "").trim();
        String lang    = body.getOrDefault("lang", "en").trim();

        if (message.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("reply", "Please provide a message."));
        }

        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set — using keyword fallback.");
            return ResponseEntity.ok(Map.of("reply", buildFallbackReply(message, lang)));
        }

        try {
            String reply = callGroq(message, lang);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("reply", buildFallbackReply(message, lang)));
        }
    }

    // ---------- Groq (free) integration ----------

    private String callGroq(String userMessage, String lang) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", MODEL);
        requestBody.put("max_tokens", 500);
        requestBody.put("temperature", 0.7);

        ArrayNode messages = requestBody.putArray("messages");

        // Inject language hint into system prompt
        String langHint = "ar".equalsIgnoreCase(lang)
            ? "\n\nIMPORTANT: The user's interface is set to Arabic. Respond in Arabic."
            : "\n\nIMPORTANT: The user's interface is set to English. Respond in English.";

        ObjectNode systemMsg = messages.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_PROMPT + langHint);

        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);

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

        // Parse response: choices[0].message.content
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode content = root.path("choices").path(0).path("message").path("content");

        if (content.isMissingNode() || content.isNull()) {
            throw new RuntimeException("Unexpected Groq response structure");
        }

        return content.asText().trim();
    }

    // ---------- Keyword-based fallback ----------

    private String buildFallbackReply(String message, String lang) {
        String lower = message.toLowerCase();

        boolean isArabic = "ar".equalsIgnoreCase(lang) || containsArabic(message);

        if (isArabic) {
            for (Map.Entry<String, String> entry : FALLBACK_AR.entrySet()) {
                if (lower.contains(entry.getKey()) || message.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
            // Check English keywords too (user might mix languages)
            for (Map.Entry<String, String> entry : FALLBACK_EN.entrySet()) {
                if (lower.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
            return "مرحباً! أنا المساعد الذكي لخالد ملحم. يمكنني الإجابة على أسئلتك حول خبرته، مهاراته، وطرق التواصل معه.";
        } else {
            for (Map.Entry<String, String> entry : FALLBACK_EN.entrySet()) {
                if (lower.contains(entry.getKey())) {
                    return entry.getValue();
                }
            }
            return "Hi! I'm Khaled's AI assistant. I can answer questions about his experience, skills, and how to get in touch. What would you like to know?";
        }
    }

    private boolean containsArabic(String text) {
        for (char c : text.toCharArray()) {
            if (c >= '\u0600' && c <= '\u06FF') {
                return true;
            }
        }
        return false;
    }

    // ---------- Job Description Analyzer ----------

    private static final String JD_SYSTEM_PROMPT =
        "You are an expert technical recruiter and career coach. Analyze the provided job description against Khaled Melhem's profile and return a JSON object.\n\n" +
        "KHALED'S FULL PROFILE:\n" +
        "Skills: Java 17+, Spring Boot 3, Spring MVC, Spring Security, Hibernate/JPA, REST APIs, " +
        "MySQL, PostgreSQL, Redis, Liquibase, Docker, GitHub Actions, CI/CD, Linux, Nginx, Maven, " +
        "Meta Graph API, WhatsApp Business API, Dialogflow ES/CX, OpenAI API, ActiveMQ, SMTP, " +
        "React, JavaScript, HTML5, CSS3, Thymeleaf, Git, IntelliJ IDEA, Postman\n" +
        "Experience: 2.5+ years. Team Lead & Software Engineer at Robotack (Aug 2023–present). " +
        "Backend Developer at JUST research lab (2019–2023).\n" +
        "Projects: Robochat (multi-channel AI chatbot, 10K+ daily interactions), " +
        "Umniah enterprise chatbot, Chatbot Builder, Legacy modernization Java 8→Java 21, MFLP NLP platform.\n" +
        "Education: BSc Software Engineering, JUST, GPA 3.21.\n" +
        "Languages: Arabic (native), English (professional).\n\n" +
        "TASK: Respond with ONLY a valid JSON object, no markdown, no explanation:\n" +
        "{\n" +
        "  \"score\": <integer 0-100>,\n" +
        "  \"headline\": \"<one sentence why he's a strong/weak fit>\",\n" +
        "  \"matched\": [\"<skill/experience 1>\", \"<skill/experience 2>\", ...],\n" +
        "  \"gaps\": [\"<missing requirement 1>\", ...],\n" +
        "  \"talking_points\": [\"<strong talking point 1>\", \"<strong talking point 2>\", \"<strong talking point 3>\"]\n" +
        "}\n\n" +
        "Keep matched and gaps arrays to 3-6 items each. talking_points must be exactly 3 items. Be honest and precise.";

    @PostMapping("/analyze-jd")
    public ResponseEntity<Map<String, Object>> analyzeJd(@RequestBody Map<String, String> body,
                                                          HttpServletRequest httpRequest) {
        String jd = body.getOrDefault("jobDescription", "").trim();
        if (jd.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "jobDescription is required"));
        }
        if (jd.length() > 5000) {
            jd = jd.substring(0, 5000);
        }

        // Fallback result if Groq is unavailable
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return ResponseEntity.ok(buildFallbackJdResult());
        }

        try {
            String jsonReply = callGroqForJd(jd);
            // Parse the JSON returned by the model
            JsonNode node = objectMapper.readTree(jsonReply);
            int score = node.path("score").asInt(70);
            String headline = node.path("headline").asText("Strong backend engineering fit.");

            java.util.List<String> matched = new java.util.ArrayList<>();
            node.path("matched").forEach(n -> matched.add(n.asText()));

            java.util.List<String> gaps = new java.util.ArrayList<>();
            node.path("gaps").forEach(n -> gaps.add(n.asText()));

            java.util.List<String> talkingPoints = new java.util.ArrayList<>();
            node.path("talking_points").forEach(n -> talkingPoints.add(n.asText()));

            return ResponseEntity.ok(Map.of(
                "score", score,
                "headline", headline,
                "matched", matched,
                "gaps", gaps,
                "talkingPoints", talkingPoints
            ));
        } catch (Exception e) {
            log.error("JD analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(buildFallbackJdResult());
        }
    }

    private String callGroqForJd(String jobDescription) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", MODEL);
        requestBody.put("max_tokens", 600);
        requestBody.put("temperature", 0.3);

        ArrayNode messages = requestBody.putArray("messages");

        ObjectNode systemMsg = messages.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", JD_SYSTEM_PROMPT);

        ObjectNode userMsg = messages.addObject();
        userMsg.put("role", "user");
        userMsg.put("content", "Job description to analyze:\n\n" + jobDescription);

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
            throw new RuntimeException("Groq API error: HTTP " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText().trim();

        // Strip markdown code fences if model wrapped the JSON
        if (content.startsWith("```")) {
            content = content.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").trim();
        }
        return content;
    }

    private Map<String, Object> buildFallbackJdResult() {
        return Map.of(
            "score", 85,
            "headline", "Strong backend engineering fit — Java & Spring Boot expertise aligns well.",
            "matched", java.util.List.of("Java 17+ / Spring Boot", "REST API design", "PostgreSQL & Redis", "Docker & CI/CD", "AI integrations (OpenAI, Dialogflow)"),
            "gaps", java.util.List.of("Could not reach AI service — this is an estimate"),
            "talkingPoints", java.util.List.of(
                "Led architecture of Robochat platform handling 10K+ daily AI interactions at Umniah.",
                "Drove full Java 8 → Java 21 / Spring 5 → Spring Boot 3 migration, eliminating legacy debt.",
                "Team Lead experience managing 4 engineers with full ownership from DB design to API contracts."
            )
        );
    }
}
