const blogPosts = [
  {
    id: 'spring-boot-3-migration',
    title: 'Migrating from Spring 5 / Java 8 to Spring Boot 3 / Java 21: Real-World Lessons',
    date: 'January 2025',
    readTime: '14 min read',
    tags: ['Spring Boot', 'Java 21', 'Migration', 'Hibernate', 'Jakarta EE'],
    excerpt:
      'Between August 2024 and January 2025, I led the migration of a production Spring 5 / Java 8 application at Robotack to Spring Boot 3 and Java 21. What started as a straightforward dependency upgrade turned into a deep dive through namespace changes, broken Hibernate queries, and a full view-layer replacement — and every hard lesson is documented here.',
    content: [
      {
        type: 'p',
        text: 'When our team at Robotack decided to modernise the legacy backend powering our chatbot platform, the initial estimate was "two or three sprints." Six months later, after wrestling with Jakarta EE namespace migrations, Hibernate 6 query rewrites, and a JSP-to-Thymeleaf rewrite, the application was finally running on Spring Boot 3.2 and Java 21. This post is the guide I wish had existed before we started.',
      },
      {
        type: 'h2',
        text: 'Why Migrate at All?',
      },
      {
        type: 'p',
        text: 'The short answer: Spring 5 reached end-of-life in November 2024, and Java 8 had been out of free public updates for years. The longer answer involves real pain points we were living with every day. Our chatbot infrastructure was processing over 10,000 WhatsApp and Instagram messages daily, and the old stack was struggling with thread contention under load. Java 21\'s virtual threads (Project Loom) offered a compelling path to handling that concurrency without a full architectural rewrite. Spring Boot 3\'s native compilation support via GraalVM was also on our radar for container startup times. Security vulnerabilities in old transitive dependencies were piling up on our audit reports. The business case wrote itself.',
      },
      {
        type: 'h2',
        text: 'Step 1: The Jakarta EE Namespace Change',
      },
      {
        type: 'p',
        text: 'Spring Boot 3 requires Jakarta EE 9+ APIs, which means every import that used to say javax.* now says jakarta.*. This sounds trivial until you realise it touches servlet filters, JPA annotations, validation constraints, and bean validation — essentially every layer of a typical enterprise application. We had over 340 files to update.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// BEFORE — Spring Boot 2.x / Spring 5 (javax namespace)
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.validation.constraints.NotBlank;
import javax.servlet.http.HttpServletRequest;

@Entity
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String phoneNumber;

    // ...
}

// AFTER — Spring Boot 3.x (jakarta namespace)
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;

@Entity
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String phoneNumber;

    // ...
}`,
      },
      {
        type: 'tip',
        text: 'Use the OpenRewrite migration recipe `org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_2` to automate the javax → jakarta rename across your entire codebase. It saved us roughly two days of manual search-and-replace work, though you still need to verify the output carefully.',
      },
      {
        type: 'h2',
        text: 'Step 2: Dropping JSP in Favour of Thymeleaf',
      },
      {
        type: 'p',
        text: 'Spring Boot 3 still technically supports JSP but with significant caveats: it cannot be used with embedded servers in JAR packaging, and there is zero support when using native images. Since we wanted the option of GraalVM compilation down the road, and since our JSP templates were a maintenance burden already, we took the opportunity to migrate to Thymeleaf. The cognitive shift is real — JSP is imperative, Thymeleaf is declarative — but the result is cleaner, testable templates that respect the separation of concerns.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// BEFORE — JSP-based controller returning a view name resolved to .jsp
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private ChatSessionService chatSessionService;

    @GetMapping
    public String showDashboard(Model model, HttpSession session) {
        String botId = (String) session.getAttribute("activeBotId");
        List<ChatSession> sessions = chatSessionService.getRecentSessions(botId, 50);
        model.addAttribute("sessions", sessions);
        model.addAttribute("totalToday", chatSessionService.countToday(botId));
        return "dashboard/index"; // resolves to /WEB-INF/views/dashboard/index.jsp
    }
}

// AFTER — Thymeleaf controller (virtually identical Java side)
@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    private final ChatSessionService chatSessionService;

    public DashboardController(ChatSessionService chatSessionService) {
        this.chatSessionService = chatSessionService;
    }

    @GetMapping
    public String showDashboard(Model model,
                                @SessionAttribute("activeBotId") String botId) {
        List<ChatSession> sessions = chatSessionService.getRecentSessions(botId, 50);
        model.addAttribute("sessions", sessions);
        model.addAttribute("totalToday", chatSessionService.countToday(botId));
        return "dashboard/index"; // resolves to /templates/dashboard/index.html
    }
}`,
      },
      {
        type: 'p',
        text: 'The Thymeleaf template itself replaces JSTL tags with HTML attributes prefixed with `th:`. The biggest productivity win is that Thymeleaf templates are valid HTML files — you can open them in a browser without a running server and see a reasonable preview, which is impossible with JSP.',
      },
      {
        type: 'h2',
        text: 'Step 3: Hibernate 6 — The Silent Breaking Changes',
      },
      {
        type: 'p',
        text: 'Hibernate 6 is bundled with Spring Boot 3 and it contains several breaking changes that will not throw a compile-time error — they only blow up at runtime. The most painful ones we hit were: implicit joins in HQL now require explicit JOIN syntax, the `@Type` annotation was redesigned, and implicit polymorphism handling changed for inheritance hierarchies.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// BEFORE — Hibernate 5 HQL with implicit association path traversal
// This worked in Hibernate 5 but silently produces wrong SQL or throws in Hibernate 6
@Query("SELECT s FROM ChatSession s WHERE s.bot.ownerId = :ownerId AND s.status = 'ACTIVE'")
List<ChatSession> findActiveByOwner(@Param("ownerId") Long ownerId);

// AFTER — Hibernate 6 requires an explicit JOIN
@Query("""
    SELECT s FROM ChatSession s
    JOIN s.bot b
    WHERE b.ownerId = :ownerId
    AND s.status = 'ACTIVE'
    ORDER BY s.createdAt DESC
    """)
List<ChatSession> findActiveByOwner(@Param("ownerId") Long ownerId);

// BEFORE — Hibernate 5 @Type for storing JSON as text
@Column(columnDefinition = "TEXT")
@Type(type = "com.vladmihalcea.hibernate.type.json.JsonStringType")
private Map<String, Object> metadata;

// AFTER — Hibernate 6 + hypersistence-utils 3.x
@Column(columnDefinition = "TEXT")
@Type(JsonType.class)
private Map<String, Object> metadata;`,
      },
      {
        type: 'tip',
        text: 'Enable Hibernate\'s SQL logging during the migration (`spring.jpa.show-sql=true` and `logging.level.org.hibernate.SQL=DEBUG`) and compare the generated queries before and after. Hibernate 6 generates noticeably different SQL for the same HQL in many cases, and a query that returns correct results on Hibernate 5 may return different results on Hibernate 6 without any exception being thrown.',
      },
      {
        type: 'h2',
        text: 'Step 4: Enabling Java 21 Virtual Threads',
      },
      {
        type: 'p',
        text: 'This was the easiest step and also the most rewarding. With Spring Boot 3.2+, enabling Project Loom virtual threads across the entire Tomcat thread pool is a single property change. Under our chatbot workload — many concurrent webhook calls each doing a short database read and an outbound HTTP call to the Meta API — the improvement was immediate. We went from needing a pool of 200 platform threads to handle peak load down to the default 8, with better throughput and dramatically lower memory usage.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// application.properties — one line to enable virtual threads for the web layer
spring.threads.virtual.enabled=true

// If you need programmatic control over a specific executor (e.g., for async tasks)
@Configuration
public class AsyncConfig {

    @Bean
    public Executor virtualThreadExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }

    // Before: a traditional fixed-size thread pool
    // @Bean
    // public Executor taskExecutor() {
    //     ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    //     executor.setCorePoolSize(20);
    //     executor.setMaxPoolSize(100);
    //     executor.setQueueCapacity(500);
    //     executor.initialize();
    //     return executor;
    // }
}`,
      },
      {
        type: 'h2',
        text: 'What Went Wrong (Honest Lessons)',
      },
      {
        type: 'ul',
        items: [
          'We underestimated the Hibernate 6 migration. Budget at least one full sprint just for auditing and fixing HQL queries. Write a query-level integration test suite before you start — we did not, and we paid for it.',
          'Spring Security\'s configuration DSL changed significantly between 5.x and 6.x. The old `WebSecurityConfigurerAdapter` approach is gone. Budget time to rewrite every security configuration class using the new component-based approach.',
          'Several third-party libraries we depended on had not yet released Hibernate 6 / Jakarta-compatible versions as of mid-2024. We had to fork two of them. Check your dependency compatibility matrix before committing to a timeline.',
          'Flyway migration scripts referencing database-specific features (we use MySQL) needed updates because of column type changes Hibernate 6 prefers for mapping certain Java types.',
          'Testing the migration on a staging environment with production-scale data is non-negotiable. We found two performance regressions that only appeared at volume, caused by different index usage in the Hibernate 6 generated SQL.',
        ],
      },
      {
        type: 'h2',
        text: 'The Outcome',
      },
      {
        type: 'p',
        text: 'Six months after we started, the production system runs on Spring Boot 3.2.5 and Java 21. Memory consumption per pod dropped by roughly 35% thanks to virtual threads replacing a large platform thread pool. Startup time improved by about 40% after we enabled Spring AOT processing. The codebase is now on a supported dependency track, and our vulnerability audit backlog went from 23 open items to zero. The migration was painful, but the platform is measurably better for it.',
      },
    ],
  },

  {
    id: 'whatsapp-chatbot-spring-boot',
    title: 'Building a WhatsApp Chatbot with Spring Boot and the Meta Cloud API',
    date: 'October 2024',
    readTime: '16 min read',
    tags: ['Spring Boot', 'WhatsApp', 'Meta API', 'Redis', 'Chatbot'],
    excerpt:
      'At Robotack I built the backend for a WhatsApp chatbot handling over 10,000 daily interactions for Umniah, spanning both WhatsApp and Instagram Messenger. This post is a complete technical walkthrough: webhook verification, parsing inbound messages, sending replies, handling media, and managing conversation sessions with Redis so the bot can remember context across turns.',
    content: [
      {
        type: 'p',
        text: 'The Meta Cloud API (formerly the WhatsApp Business Platform) is powerful but its documentation is sprawling and inconsistent. When I built the Umniah chatbot at Robotack — which handles customer service queries over WhatsApp and Instagram at more than 10,000 interactions per day — I had to piece together the real implementation from official docs, community threads, and a lot of trial and error in the sandbox. This post gives you the complete picture.',
      },
      {
        type: 'h2',
        text: 'Architecture Overview',
      },
      {
        type: 'p',
        text: 'The system receives inbound webhook events from Meta, routes them to the correct flow based on the sender\'s current conversation state stored in Redis, executes the appropriate response logic, and calls the Meta Send API to deliver the reply. A MySQL database stores the conversation flows, session history, and analytics. The Spring Boot application is stateless — all per-user state lives in Redis with a configurable TTL — which lets us scale horizontally without sticky sessions.',
      },
      {
        type: 'h2',
        text: 'Step 1: Webhook Verification',
      },
      {
        type: 'p',
        text: 'Before Meta will start delivering events to your endpoint, it sends a GET request to verify that you own the URL. You need to respond with the `hub.challenge` value if the `hub.verify_token` matches what you configured in your Meta App dashboard. This must happen over HTTPS — Meta will not send events to a plain HTTP endpoint.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@RestController
@RequestMapping("/webhook")
public class WhatsAppWebhookController {

    @Value("\${meta.webhook.verify-token}")
    private String verifyToken;

    private final WhatsAppMessageService messageService;
    private final WebhookSignatureValidator signatureValidator;

    public WhatsAppWebhookController(WhatsAppMessageService messageService,
                                     WebhookSignatureValidator signatureValidator) {
        this.messageService = messageService;
        this.signatureValidator = signatureValidator;
    }

    // Meta calls this GET endpoint to verify your webhook URL
    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam("hub.mode") String mode,
            @RequestParam("hub.verify_token") String token,
            @RequestParam("hub.challenge") String challenge) {

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification failed");
    }

    // Meta sends all inbound events to this POST endpoint
    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader("X-Hub-Signature-256") String signature) {

        // Always validate the HMAC signature before processing
        if (!signatureValidator.isValid(rawBody, signature)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
        }

        messageService.processAsync(rawBody);

        // Meta requires a fast 200 OK — do the heavy work asynchronously
        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}`,
      },
      {
        type: 'h2',
        text: 'Step 2: Validating the HMAC Signature',
      },
      {
        type: 'p',
        text: 'Every POST from Meta includes an `X-Hub-Signature-256` header containing an HMAC-SHA256 of the raw request body signed with your app secret. You must verify this before trusting the payload — otherwise any party can forge events to your endpoint. The key implementation detail is that you must compute the HMAC over the raw bytes of the body before any JSON parsing occurs.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Component
public class WebhookSignatureValidator {

    @Value("\${meta.app.secret}")
    private String appSecret;

    public boolean isValid(String rawBody, String signatureHeader) {
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            return false;
        }
        String receivedHmac = signatureHeader.substring("sha256=".length());
        String computedHmac = computeHmacSha256(rawBody, appSecret);
        // Use MessageDigest.isEqual for constant-time comparison to prevent timing attacks
        return MessageDigest.isEqual(
            hexToBytes(receivedHmac),
            hexToBytes(computedHmac)
        );
    }

    private String computeHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC computation failed", e);
        }
    }

    private byte[] hexToBytes(String hex) {
        return HexFormat.of().parseHex(hex);
    }
}`,
      },
      {
        type: 'h2',
        text: 'Step 3: Parsing Inbound Messages',
      },
      {
        type: 'p',
        text: 'The webhook payload Meta sends is a nested JSON structure. A single webhook POST can contain multiple entries and multiple changes within each entry. Each change\'s value object contains the actual message events. The message type can be `text`, `image`, `audio`, `video`, `document`, `location`, `interactive` (button replies, list replies), or `button`. You need to handle all of these gracefully.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// The incoming JSON structure from Meta looks like this:
// {
//   "object": "whatsapp_business_account",
//   "entry": [{
//     "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
//     "changes": [{
//       "value": {
//         "messaging_product": "whatsapp",
//         "contacts": [{ "profile": { "name": "User Name" }, "wa_id": "9627XXXXXXXX" }],
//         "messages": [{
//           "from": "9627XXXXXXXX",
//           "id": "wamid.XXXXX",
//           "timestamp": "1698765432",
//           "type": "text",
//           "text": { "body": "Hello" }
//         }]
//       },
//       "field": "messages"
//     }]
//   }]
// }

@Service
public class WhatsAppMessageParser {

    public List<InboundMessage> parse(String rawJson) {
        List<InboundMessage> messages = new ArrayList<>();
        JsonNode root = objectMapper.readTree(rawJson);

        for (JsonNode entry : root.path("entry")) {
            for (JsonNode change : entry.path("changes")) {
                JsonNode value = change.path("value");
                if (!"messages".equals(change.path("field").asText())) continue;

                for (JsonNode msg : value.path("messages")) {
                    String type = msg.path("type").asText();
                    String from = msg.path("from").asText();
                    String messageId = msg.path("id").asText();

                    InboundMessage inbound = switch (type) {
                        case "text" -> new TextMessage(from, messageId,
                            msg.path("text").path("body").asText());
                        case "interactive" -> parseInteractive(from, messageId, msg);
                        case "image", "audio", "video", "document" ->
                            parseMedia(from, messageId, type, msg);
                        default -> new UnknownMessage(from, messageId, type);
                    };
                    messages.add(inbound);
                }
            }
        }
        return messages;
    }

    private InboundMessage parseInteractive(String from, String id, JsonNode msg) {
        String interactiveType = msg.path("interactive").path("type").asText();
        if ("button_reply".equals(interactiveType)) {
            String buttonId = msg.path("interactive")
                                  .path("button_reply").path("id").asText();
            String buttonTitle = msg.path("interactive")
                                    .path("button_reply").path("title").asText();
            return new ButtonReplyMessage(from, id, buttonId, buttonTitle);
        }
        // list_reply handling...
        return new UnknownMessage(from, id, "interactive/" + interactiveType);
    }
}`,
      },
      {
        type: 'h2',
        text: 'Step 4: Managing Conversation Sessions with Redis',
      },
      {
        type: 'p',
        text: 'A chatbot without memory is just a command parser. Real conversational experiences require knowing where in a flow a user currently is, what they\'ve answered in previous steps, and what context they\'ve provided (like an account number or order ID). We store this in Redis with a key structured as `chatbot:session:{phoneNumber}` and a TTL of 30 minutes (reset on each message). If the key has expired, the user is treated as a new conversation.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Service
public class SessionService {

    private static final String SESSION_KEY_PREFIX = "chatbot:session:";
    private static final Duration SESSION_TTL = Duration.ofMinutes(30);

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public SessionService(RedisTemplate<String, String> redisTemplate,
                          ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public Optional<ConversationSession> getSession(String phoneNumber) {
        String key = SESSION_KEY_PREFIX + phoneNumber;
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) return Optional.empty();

        try {
            return Optional.of(objectMapper.readValue(json, ConversationSession.class));
        } catch (JsonProcessingException e) {
            // Corrupted session — treat as new
            redisTemplate.delete(key);
            return Optional.empty();
        }
    }

    public void saveSession(ConversationSession session) {
        String key = SESSION_KEY_PREFIX + session.getPhoneNumber();
        try {
            String json = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(key, json, SESSION_TTL);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize session", e);
        }
    }

    public void clearSession(String phoneNumber) {
        redisTemplate.delete(SESSION_KEY_PREFIX + phoneNumber);
    }
}

// The session object itself
public class ConversationSession {
    private String phoneNumber;
    private String currentNodeId;     // which step in the flow the user is at
    private String flowId;            // which flow is active
    private Map<String, String> collectedData; // e.g., {"accountNumber": "12345"}
    private Instant startedAt;
    private Instant lastActivityAt;
    // getters, setters, constructor...
}`,
      },
      {
        type: 'h2',
        text: 'Step 5: Sending Replies via the Meta Send API',
      },
      {
        type: 'p',
        text: 'Sending a message means making a POST to `https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages` with a Bearer token (your permanent system user token). The payload structure differs by message type. Interactive messages — buttons and lists — are the most engaging and are heavily used in customer service flows because they guide the user to valid responses instead of relying on free text parsing.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Service
public class WhatsAppSendService {

    @Value("\${meta.api.url}")
    private String apiUrl;

    @Value("\${meta.phone-number-id}")
    private String phoneNumberId;

    @Value("\${meta.access-token}")
    private String accessToken;

    private final RestClient restClient;

    public WhatsAppSendService(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public void sendTextMessage(String to, String text) {
        Map<String, Object> body = Map.of(
            "messaging_product", "whatsapp",
            "recipient_type", "individual",
            "to", to,
            "type", "text",
            "text", Map.of("preview_url", false, "body", text)
        );
        post(body);
    }

    public void sendButtonMessage(String to, String bodyText, List<QuickReplyButton> buttons) {
        List<Map<String, Object>> buttonList = buttons.stream()
            .map(b -> Map.<String, Object>of(
                "type", "reply",
                "reply", Map.of("id", b.getId(), "title", b.getTitle())
            ))
            .toList();

        Map<String, Object> body = Map.of(
            "messaging_product", "whatsapp",
            "to", to,
            "type", "interactive",
            "interactive", Map.of(
                "type", "button",
                "body", Map.of("text", bodyText),
                "action", Map.of("buttons", buttonList)
            )
        );
        post(body);
    }

    private void post(Map<String, Object> body) {
        String url = apiUrl + "/" + phoneNumberId + "/messages";
        restClient.post()
            .uri(url)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }
}`,
      },
      {
        type: 'tip',
        text: 'Always mark incoming messages as "read" by calling the messages endpoint with `{"messaging_product": "whatsapp", "status": "read", "message_id": "<wamid>"}`. This shows the double blue checkmark to the user and dramatically improves the perceived responsiveness of your bot — users stop resending messages because they can see their message was received.',
      },
      {
        type: 'h2',
        text: 'Handling Scale: 10K+ Daily Interactions',
      },
      {
        type: 'p',
        text: 'At peak load — typically between 9am and 12pm Amman time — the Umniah chatbot receives several hundred messages per minute. A few architectural decisions made this manageable. First, the webhook controller returns 200 immediately and processes everything asynchronously via a Spring `@Async` executor backed by virtual threads in Java 21. Second, all Redis session reads and writes are performed in the same async task, never on the web thread. Third, we implemented idempotency checks using the Meta message ID stored in Redis (30-minute TTL) — Meta sometimes delivers the same webhook twice, and processing a message twice in a customer service flow can cause serious problems.',
      },
      {
        type: 'ul',
        items: [
          'Return HTTP 200 from the webhook endpoint immediately — Meta will retry delivery if you do not respond within 5 seconds, creating duplicate processing.',
          'Deduplicate using the `wamid` message ID from the payload. Store processed IDs in Redis with a TTL equal to your expected processing window.',
          'Implement exponential backoff when calling the Meta Send API. Rate limits apply per phone number, and the 429 response needs to be handled gracefully.',
          'Log the raw inbound JSON payload to a separate audit log before any processing. When something goes wrong (and it will), you need to be able to replay the exact bytes Meta sent.',
          'Monitor your Redis memory usage closely. At 10K daily sessions, each with potentially several KB of collected form data, the memory adds up quickly without proper TTL management.',
        ],
      },
    ],
  },

  {
    id: 'chatbot-flow-builder-architecture',
    title: 'How I Architected a Visual Chatbot Flow Builder: Backend Design Decisions',
    date: 'December 2024',
    readTime: '13 min read',
    tags: ['System Design', 'Spring Boot', 'MySQL', 'Graph Data', 'REST API'],
    excerpt:
      'The Advanced Dynamic Chatbot Builder I developed at Robotack lets non-technical operators drag and drop conversation flows on a canvas, defining exactly how the bot responds to any message. This post walks through the most interesting backend design decisions: how to store an arbitrary directed graph in a relational database, how the REST API exposes it, and how the runtime engine traverses it efficiently during live conversations.',
    content: [
      {
        type: 'p',
        text: 'A chatbot flow is fundamentally a directed graph: nodes represent states (show a message, collect input, call an API, branch on a condition), and edges represent transitions between them triggered by user actions or evaluated conditions. Designing a system that lets a non-engineer build these graphs visually while allowing a backend engine to execute them reliably at scale involves several interesting engineering tradeoffs. Here is how I approached it.',
      },
      {
        type: 'h2',
        text: 'The Core Data Model',
      },
      {
        type: 'p',
        text: 'The key insight is that a flow is a graph, and graphs have two fundamental entities: nodes (vertices) and edges. A relational database can represent this cleanly with three tables: `chatbot_flows`, `flow_nodes`, and `flow_edges`. The `flow_nodes` table stores what a node does (its type and configuration payload). The `flow_edges` table stores how nodes connect to each other (and under what condition the edge is taken). The configuration for each node type is stored as JSON in a `config` column — this avoids the need for a new table every time we add a new node type.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `-- The three core tables for the flow graph

CREATE TABLE chatbot_flows (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    bot_id      BIGINT NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT FALSE,
    trigger_type ENUM('ANY_MESSAGE', 'KEYWORD', 'ENTRY_POINT') NOT NULL,
    trigger_value VARCHAR(500),           -- e.g., the keyword to match
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bot_id) REFERENCES chatbots(id)
);

CREATE TABLE flow_nodes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    flow_id     BIGINT NOT NULL,
    node_key    VARCHAR(100) NOT NULL,    -- stable identifier used by edges, e.g. "node_abc123"
    type        ENUM(
                    'SEND_TEXT',
                    'SEND_BUTTONS',
                    'SEND_LIST',
                    'COLLECT_INPUT',
                    'CONDITION',
                    'API_CALL',
                    'SET_VARIABLE',
                    'END_FLOW'
                ) NOT NULL,
    config      JSON NOT NULL,           -- type-specific configuration
    position_x  INT,                     -- canvas X coordinate for the visual builder
    position_y  INT,                     -- canvas Y coordinate for the visual builder
    UNIQUE KEY uq_flow_node (flow_id, node_key),
    FOREIGN KEY (flow_id) REFERENCES chatbot_flows(id) ON DELETE CASCADE
);

CREATE TABLE flow_edges (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    flow_id         BIGINT NOT NULL,
    source_node_key VARCHAR(100) NOT NULL,
    target_node_key VARCHAR(100) NOT NULL,
    condition_type  ENUM('ALWAYS', 'BUTTON_REPLY', 'KEYWORD_MATCH', 'VARIABLE_EQUALS') NOT NULL DEFAULT 'ALWAYS',
    condition_value VARCHAR(500),         -- e.g., button ID, keyword, or "variableName=expectedValue"
    priority        INT DEFAULT 0,        -- evaluated in ascending order for CONDITION nodes
    FOREIGN KEY (flow_id) REFERENCES chatbot_flows(id) ON DELETE CASCADE
);`,
      },
      {
        type: 'tip',
        text: 'Store the canvas position (position_x, position_y) directly on the node row rather than in a separate table or in the config JSON. The visual builder frontend always needs this data when loading a flow, so having it as first-class columns makes it trivially easy to fetch and avoids JSON parsing overhead on the read path.',
      },
      {
        type: 'h2',
        text: 'The JPA Entity Layer',
      },
      {
        type: 'p',
        text: 'The JPA entities closely mirror the database schema. The interesting design choice is how to handle the `config` JSON column. Rather than mapping it to a raw `String`, we use a type-safe approach: a sealed interface `NodeConfig` with a concrete implementation for each node type, serialised and deserialised via Jackson. This gives us compile-time safety when working with node configurations in the runtime engine.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Entity
@Table(name = "flow_nodes")
public class FlowNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flow_id", nullable = false)
    private ChatbotFlow flow;

    @Column(name = "node_key", nullable = false)
    private String nodeKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NodeType type;

    // Stored as JSON via hypersistence-utils @Type(JsonType.class)
    @Type(JsonType.class)
    @Column(columnDefinition = "JSON", nullable = false)
    private Map<String, Object> config;

    @Column(name = "position_x")
    private Integer positionX;

    @Column(name = "position_y")
    private Integer positionY;

    // Convenience method: extract a type-safe config view
    public SendTextConfig asSendTextConfig() {
        if (type != NodeType.SEND_TEXT) {
            throw new IllegalStateException("Node " + nodeKey + " is not SEND_TEXT");
        }
        return objectMapper.convertValue(config, SendTextConfig.class);
    }

    public SendButtonsConfig asSendButtonsConfig() {
        if (type != NodeType.SEND_BUTTONS) {
            throw new IllegalStateException("Node " + nodeKey + " is not SEND_BUTTONS");
        }
        return objectMapper.convertValue(config, SendButtonsConfig.class);
    }
}

// Example config POJO for a SEND_BUTTONS node
public record SendButtonsConfig(
    String bodyText,
    List<ButtonOption> buttons
) {
    public record ButtonOption(String id, String label) {}
}

// Example config POJO for a COLLECT_INPUT node
public record CollectInputConfig(
    String promptText,
    String variableName,    // the session variable to store the answer in
    String validationRegex, // optional regex to validate the input
    String invalidMessage   // message to send if validation fails
) {}`,
      },
      {
        type: 'h2',
        text: 'REST API Design for the Flow Builder',
      },
      {
        type: 'p',
        text: 'The visual builder frontend (a React + React Flow canvas) needs to load and save entire flows atomically. We expose three main operations: fetch the complete flow graph (nodes + edges in one response), save the entire graph (replacing all nodes and edges in a single transaction), and publish a flow (making it the active flow for the bot). The save operation uses a full-replace strategy rather than a diff-and-patch strategy — it is simpler and for flows that rarely exceed 50 nodes, the performance overhead is negligible.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@RestController
@RequestMapping("/api/v1/flows")
@RequiredArgsConstructor
public class FlowController {

    private final FlowService flowService;

    @GetMapping("/{flowId}")
    public ResponseEntity<FlowGraphDto> getFlow(@PathVariable Long flowId) {
        return ResponseEntity.ok(flowService.loadFlowGraph(flowId));
    }

    // Save (or create) the complete graph — all nodes and edges
    @PutMapping("/{flowId}/graph")
    @Transactional
    public ResponseEntity<FlowGraphDto> saveFlowGraph(
            @PathVariable Long flowId,
            @RequestBody @Valid FlowGraphDto graphDto) {
        return ResponseEntity.ok(flowService.saveFlowGraph(flowId, graphDto));
    }

    @PostMapping("/{flowId}/publish")
    @Transactional
    public ResponseEntity<Void> publishFlow(@PathVariable Long flowId) {
        flowService.publishFlow(flowId);
        return ResponseEntity.noContent().build();
    }
}

// The DTO structure mirrors what React Flow uses on the frontend
public record FlowGraphDto(
    Long flowId,
    String name,
    List<NodeDto> nodes,
    List<EdgeDto> edges
) {}

public record NodeDto(
    String id,              // maps to node_key
    String type,            // maps to NodeType enum
    Map<String, Object> data,   // maps to config JSON
    PositionDto position
) {}

public record EdgeDto(
    String id,
    String source,          // source node_key
    String target,          // target node_key
    String conditionType,
    String conditionValue,
    int priority
) {}

public record PositionDto(int x, int y) {}`,
      },
      {
        type: 'h2',
        text: 'The Flow Runtime Engine',
      },
      {
        type: 'p',
        text: 'When a message arrives, the runtime engine loads the user\'s session from Redis, determines the current node, and executes it. Execution means: perform the node\'s action (send a message, call an external API, evaluate a condition), then determine which edge to follow next based on the user\'s reply and the edge conditions, advance the session to the next node, and save the session back to Redis. The engine is a simple loop; it processes "silent" nodes (like SET_VARIABLE and CONDITION) immediately and only pauses when it reaches a node that requires user input.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Service
@RequiredArgsConstructor
public class FlowEngineService {

    private final FlowRepository flowRepository;
    private final FlowNodeRepository nodeRepository;
    private final FlowEdgeRepository edgeRepository;
    private final SessionService sessionService;
    private final WhatsAppSendService sendService;
    private final ApiCallExecutor apiCallExecutor;

    public void processMessage(String phoneNumber, InboundMessage message) {
        ConversationSession session = sessionService.getSession(phoneNumber)
            .orElseGet(() -> startNewSession(phoneNumber, message));

        FlowNode currentNode = nodeRepository
            .findByFlowIdAndNodeKey(session.getFlowId(), session.getCurrentNodeId())
            .orElseThrow(() -> new FlowEngineException("Node not found: " + session.getCurrentNodeId()));

        // Advance the session based on the inbound message
        FlowNode nextNode = resolveNextNode(currentNode, message, session);
        if (nextNode == null) {
            sessionService.clearSession(phoneNumber);
            return;
        }

        // Execute nodes in a loop until we reach one that waits for user input
        while (nextNode != null && !requiresUserInput(nextNode)) {
            nextNode = executeNode(nextNode, session, phoneNumber);
        }

        if (nextNode != null) {
            executeNode(nextNode, session, phoneNumber);
            session.setCurrentNodeId(nextNode.getNodeKey());
            sessionService.saveSession(session);
        } else {
            sessionService.clearSession(phoneNumber);
        }
    }

    private FlowNode executeNode(FlowNode node, ConversationSession session, String phone) {
        return switch (node.getType()) {
            case SEND_TEXT -> {
                SendTextConfig cfg = node.asSendTextConfig();
                String text = interpolate(cfg.text(), session.getCollectedData());
                sendService.sendTextMessage(phone, text);
                yield resolveNextNodeAlways(node, session);
            }
            case SEND_BUTTONS -> {
                SendButtonsConfig cfg = node.asSendButtonsConfig();
                sendService.sendButtonMessage(phone, cfg.bodyText(), cfg.buttons());
                yield null; // pause and wait for user's button selection
            }
            case SET_VARIABLE -> {
                Map<String, Object> cfg = node.getConfig();
                session.getCollectedData().put(
                    (String) cfg.get("variableName"),
                    interpolate((String) cfg.get("value"), session.getCollectedData())
                );
                yield resolveNextNodeAlways(node, session);
            }
            case API_CALL -> {
                Map<String, Object> result = apiCallExecutor.execute(node.getConfig(), session);
                session.getCollectedData().putAll(result);
                yield resolveNextNodeAlways(node, session);
            }
            case END_FLOW -> null;
            default -> throw new FlowEngineException("Unhandled node type: " + node.getType());
        };
    }

    private String interpolate(String template, Map<String, String> variables) {
        // Replace {{variableName}} placeholders with values from the session
        String result = template;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }
}`,
      },
      {
        type: 'h2',
        text: 'Loading Flows Efficiently: Caching the Graph',
      },
      {
        type: 'p',
        text: 'Fetching the entire flow graph from MySQL on every inbound message would be prohibitively slow at 10K daily interactions, especially since flows change infrequently. We cache the complete resolved flow graph (all nodes and edges indexed by node_key for O(1) lookup) in Spring\'s cache abstraction backed by Redis. The cache is evicted whenever a flow is published. This means the runtime engine never touches MySQL during normal operation — the critical path is Redis session read → Redis flow cache read → send API call → Redis session write.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `@Service
public class FlowCacheService {

    private final FlowNodeRepository nodeRepository;
    private final FlowEdgeRepository edgeRepository;

    @Cacheable(value = "flow-graphs", key = "#flowId")
    public ResolvedFlowGraph loadGraph(Long flowId) {
        List<FlowNode> nodes = nodeRepository.findAllByFlowId(flowId);
        List<FlowEdge> edges = edgeRepository.findAllByFlowId(flowId);

        Map<String, FlowNode> nodeIndex = nodes.stream()
            .collect(Collectors.toMap(FlowNode::getNodeKey, n -> n));

        // Index edges by source node key for fast outbound-edge lookup
        Map<String, List<FlowEdge>> edgeIndex = edges.stream()
            .collect(Collectors.groupingBy(FlowEdge::getSourceNodeKey));

        return new ResolvedFlowGraph(flowId, nodeIndex, edgeIndex);
    }

    @CacheEvict(value = "flow-graphs", key = "#flowId")
    public void evict(Long flowId) {
        // Called when a flow is published or updated
    }
}`,
      },
      {
        type: 'h2',
        text: 'Lessons Learned',
      },
      {
        type: 'ul',
        items: [
          'Storing the canvas layout (x/y positions) in the database rather than only in the frontend state was the right call. It means the flow definition is fully portable — export as JSON, import on another bot, and the canvas renders correctly.',
          'The full-replace save strategy (delete all nodes and edges, insert fresh) is simpler to implement correctly than a diff-and-patch approach, and it eliminates an entire class of stale-data bugs. For graphs under a few hundred nodes, the performance difference is undetectable.',
          'Variable interpolation using `{{variableName}}` syntax in message text is a feature operators reach for almost immediately. Design it in from day one — retrofitting it into an existing node config schema is painful.',
          'The CONDITION node type is what unlocks real conversational intelligence: branch to one path if the user\'s account is of type X, to another if it is type Y. Designing the condition evaluation logic to be data-driven (stored in the edge\'s condition_type and condition_value columns) rather than hard-coded in Java lets operators build complex logic without any code changes.',
          'Always log the node execution path for a given session to your audit log. When an operator reports "the bot gave the wrong answer," being able to replay the exact node sequence they went through is what separates a debuggable system from an opaque one.',
        ],
      },
    ],
  },
];

export default blogPosts;
