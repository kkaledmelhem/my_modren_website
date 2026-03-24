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
    private static final String MODEL = "llama-3.1-8b-instant";

    private static final String SYSTEM_PROMPT =
        "You are the personal AI assistant embedded in Khaled Melhem's portfolio website. " +
        "Answer questions about Khaled accurately and concisely. " +
        "Only answer about Khaled — if asked something unrelated, politely redirect.\n\n" +
        "Facts about Khaled Melhem:\n" +
        "- Full name: Khaled Melhem\n" +
        "- Current location: Amman, Jordan\n" +
        "- Role: Team Lead & Software Engineer at Robotack (since August 2023, present)\n" +
        "- University major: Software Engineering (Bachelor of Science) at Jordan University of Science and Technology (JUST)\n" +
        "- GPA: 3.21\n" +
        "- Years of experience: 2.5+ years professional experience\n" +
        "- Previous: Backend Developer at JUST research lab (2019–2023), built MFLP platform for NLP datasets\n" +
        "- Skills: Java 17+, Spring Boot 3, Spring MVC, Spring Security, Hibernate/JPA, REST APIs, MySQL, PostgreSQL, " +
        "Redis, Liquibase, Docker, GitHub Actions, CI/CD, Linux, Nginx, Maven, React, JavaScript, " +
        "Meta Graph API, WhatsApp Business API, Dialogflow, OpenAI API, ActiveMQ\n" +
        "- At Robotack: architected Robochat — a multi-channel AI chatbot platform (Facebook Messenger, WhatsApp Business, " +
        "Twitter DMs, web chat). Led team of 4 engineers. Flagship client: Umniah chatbot handling 10,000+ daily interactions.\n" +
        "- Languages: Arabic (native), English (professional)\n" +
        "- Email: khadme9@gmail.com\n" +
        "- Phone: +962 78 170 9179\n" +
        "- LinkedIn: linkedin.com/in/khaledmelhem\n" +
        "- GitHub: github.com/kmelhem-dev\n" +
        "- Open to: full-time backend roles, remote and on-site\n" +
        "- Portfolio website: built with Java (Spring Boot) + React, deployed on Railway\n\n" +
        "If the user writes in Arabic, respond in Arabic. If in English, respond in English.\n" +
        "Keep answers short and friendly (2-4 sentences max unless detail is asked).";

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
        Map.entry("email",          "You can reach Khaled at khadme9@gmail.com."),
        Map.entry("contact",        "You can reach Khaled at khadme9@gmail.com or by phone at +962 78 170 9179."),
        Map.entry("phone",          "Khaled's phone number is +962 78 170 9179."),
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
        Map.entry("تواصل",      "يمكنك التواصل مع خالد عبر البريد khadme9@gmail.com أو هاتفياً على +962 78 170 9179."),
        Map.entry("هاتف",       "رقم هاتف خالد هو +962 78 170 9179."),
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

        // Use fallback if API key is not configured
        if (groqApiKey == null || groqApiKey.isBlank()) {
            log.warn("GROQ_API_KEY is not set — using keyword fallback.");
            return ResponseEntity.ok(Map.of("reply", buildFallbackReply(message, lang)));
        }

        try {
            String reply = callGroq(message);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            log.error("Groq API call failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("reply", buildFallbackReply(message, lang)));
        }
    }

    // ---------- Groq (free) integration ----------

    private String callGroq(String userMessage) throws Exception {
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", MODEL);
        requestBody.put("max_tokens", 300);
        requestBody.put("temperature", 0.7);

        ArrayNode messages = requestBody.putArray("messages");

        ObjectNode systemMsg = messages.addObject();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_PROMPT);

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
}
