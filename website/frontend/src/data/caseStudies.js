const caseStudies = [
  {
    id: 'umniah-chatbot',
    title: 'Umniah Enterprise Chatbot',
    subtitle: 'Scaling a production AI chatbot to 10,000+ daily interactions',
    tag: 'Flagship Client',
    duration: '8 months',
    role: 'Lead Backend Engineer',
    team: '4 engineers',
    outcome: '10K+ daily interactions · 20% engagement uplift · 99.7% uptime',
    tech: ['Java 21', 'Spring Boot 3', 'MySQL', 'Hibernate', 'Redis', 'WhatsApp API', 'Instagram API', 'Docker'],
    overview:
      "Umniah, one of Jordan's largest telecom operators, needed a production-grade AI chatbot capable of handling customer support, service inquiries, and order processing across WhatsApp and Instagram simultaneously. I led the backend architecture and delivery from initial design through to production go-live.",
    sections: [
      {
        heading: 'The Problem',
        body: "Umniah's customer service team was handling tens of thousands of inbound messages daily through manual agents. Response times were slow, agent burnout was high, and there was no unified way to track conversation state across channels. They needed automation that felt human, integrated with their existing CRM, and could fall back to a live agent instantly when required.",
      },
      {
        heading: 'Architecture Decisions',
        body: "I designed a stateless microservice core where each chatbot session's state is persisted in MySQL with a Redis cache layer for sub-millisecond reads on active conversations. The channel adapters for WhatsApp Business API and Instagram Graph API are isolated behind a unified inbound event bus, meaning the conversation engine never needs to know which channel it is serving.",
      },
      {
        type: 'code',
        lang: 'java',
        text: `// Unified inbound event — channel-agnostic conversation engine
@Service
public class InboundEventProcessor {

    private final ConversationEngine engine;
    private final SessionRepository sessionRepository;
    private final RedisTemplate<String, ChatSession> cache;

    public void process(InboundEvent event) {
        String cacheKey = "session:" + event.getChannelUserId();

        ChatSession session = cache.opsForValue().get(cacheKey);
        if (session == null) {
            session = sessionRepository
                .findActiveByChannelUserId(event.getChannelUserId())
                .orElseGet(() -> sessionRepository.save(
                    ChatSession.newSession(event)
                ));
            cache.opsForValue().set(cacheKey, session, 30, TimeUnit.MINUTES);
        }

        engine.advance(session, event.getText());
    }
}`,
      },
      {
        heading: 'Multi-Step Conversational Flows',
        body: 'Conversation logic is modelled as a directed graph stored in the database. Each node defines a prompt, expected user intents matched via Dialogflow ES, and transition rules. This lets the Umniah product team reconfigure flows without any code deployment — they use the internal chatbot builder UI I also built.',
      },
      {
        heading: 'Results',
        body: 'After a four-week soft launch, the platform was handling over 10,000 messages per day with a 99.7% uptime record. First-response time dropped from an average of 4 minutes to under 2 seconds. User engagement rose by 20%. The platform is still live and scaling.',
      },
    ],
    metrics: [
      { label: 'Daily Interactions', value: '10K+' },
      { label: 'Response Time',      value: '<2s'  },
      { label: 'Uptime',             value: '99.7%'},
      { label: 'Engagement Uplift',  value: '+20%' },
    ],
  },
  {
    id: 'chatbot-builder',
    title: 'Visual Chatbot Builder',
    subtitle: 'A no-code flow editor that lets non-engineers build chatbot logic',
    tag: 'Internal Platform',
    duration: '3 months',
    role: 'Lead Backend Engineer',
    team: '2 engineers',
    outcome: 'Reduced deployment cycle from days to hours · Used by 3 client teams',
    tech: ['Spring Boot', 'Java', 'Hibernate', 'REST APIs', 'MySQL', 'JavaScript'],
    overview:
      'The engineering team was the bottleneck every time a client needed a new chatbot flow. I built a visual builder that lets non-technical teams design, test, and publish flows themselves — without touching code.',
    sections: [
      {
        heading: 'The Problem',
        body: 'Every chatbot flow change required a backend developer to write code, open a pull request, and wait for a deployment. With three active clients and growing, the team was spending more time on configuration than on engineering.',
      },
      {
        heading: 'Flow Graph Data Model',
        body: 'I modelled each chatbot as a directed graph of nodes and edges in MySQL. A node represents a step in the conversation. An edge represents a transition condition. The REST API exposes CRUD operations on this graph, which the frontend renders as a drag-and-drop canvas.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// Flow node — polymorphic with Hibernate SINGLE_TABLE strategy
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "node_type")
public abstract class FlowNode {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private ChatbotFlow flow;

    @OneToMany(mappedBy = "source", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FlowEdge> outgoingEdges = new ArrayList<>();

    public abstract OutboundMessage execute(ChatSession session, String userInput);
}`,
      },
      {
        heading: 'Outcome',
        body: 'The deployment cycle for flow changes dropped from two days to under two hours. Three client teams now manage their own flows independently. Engineering time on configuration work fell by roughly 70%.',
      },
    ],
    metrics: [
      { label: 'Deploy Cycle',      value: '2d → 2h' },
      { label: 'Client Teams',      value: '3'       },
      { label: 'Config Work Saved', value: '~70%'    },
      { label: 'Node Types',        value: '8'       },
    ],
  },
  {
    id: 'legacy-modernization',
    title: 'Legacy System Modernization',
    subtitle: 'Migrating a production platform from Java 8 / Spring 5 to Java 21 / Spring Boot 3',
    tag: 'Architecture',
    duration: '6 months',
    role: 'Lead Backend Engineer',
    team: '4 engineers',
    outcome: 'Zero downtime migration · 17 CVEs cleared · -34% cold start time',
    tech: ['Java 21', 'Spring Boot 3', 'Hibernate 6', 'Thymeleaf', 'Maven', 'Docker', 'GitHub Actions'],
    overview:
      'The production chatbot platform at Robotack was built on Spring 5 and Java 8 — a stack that had reached end-of-life. I planned and executed a full modernization across 340+ source files with zero unplanned downtime.',
    sections: [
      {
        heading: 'Why It Had to Happen',
        body: "Spring 5 reached end-of-life. Java 8 public updates were years gone. Security audit reports were accumulating CVEs we couldn't patch without upgrading. Beyond compliance, Java 21's virtual threads were a direct answer to thread contention we were seeing under peak WhatsApp message load.",
      },
      {
        heading: 'The Jakarta EE Namespace Migration',
        body: 'Spring Boot 3 requires Jakarta EE 9+ APIs — every javax.* import becomes jakarta.*. This sounds trivial until you have 340 files to touch. We scripted the bulk rename but manually verified every file where reflection was involved.',
      },
      {
        type: 'code',
        lang: 'java',
        text: `// BEFORE — javax namespace (Spring Boot 2.x / Spring 5)
import javax.persistence.Entity;
import javax.validation.constraints.NotBlank;
import javax.servlet.http.HttpServletRequest;

// AFTER — jakarta namespace (Spring Boot 3 / Jakarta EE 10)
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;

// Hibernate 6: explicit column mapping now required in some configs
@Column(name = "phone_number")
private String phoneNumber;`,
      },
      {
        heading: 'Zero-Downtime Strategy',
        body: 'We ran the new stack in a shadow environment for three weeks, routing a copy of live traffic to both old and new systems and comparing response payloads. Once parity was confirmed across 50,000 real message events, we performed a blue-green switch with a 5-minute rollback window. The switch took 40 seconds. No rollback was needed.',
      },
      {
        heading: 'Results',
        body: 'The platform is now fully compliant with Jakarta EE 10, running on Java 21 with virtual threads enabled. Cold-start time in Docker dropped by 34%. The security audit went from 17 high-severity CVEs to zero.',
      },
    ],
    metrics: [
      { label: 'Files Updated', value: '340+' },
      { label: 'CVEs Cleared',  value: '17 → 0'},
      { label: 'Cold Start',    value: '-34%' },
      { label: 'Downtime',      value: '0 min'},
    ],
  },
];

export default caseStudies;
