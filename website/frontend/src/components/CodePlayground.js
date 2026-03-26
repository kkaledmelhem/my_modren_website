import { useState } from 'react';
import './CodePlayground.css';

const TABS = [
  {
    label: 'Spring Controller',
    lang: 'java',
    code: `@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final RateLimiter rateLimiter;

    @PostMapping("/send")
    public ResponseEntity<MessageResponse> send(
            @Valid @RequestBody MessageRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();
        if (!rateLimiter.tryAcquire(ip)) {
            return ResponseEntity.status(429)
                .body(MessageResponse.error("Rate limit exceeded"));
        }

        MessageResponse response = messageService.process(request);
        return ResponseEntity.ok(response);
    }
}`,
  },
  {
    label: 'Redis Cache',
    lang: 'java',
    code: `@Service
@RequiredArgsConstructor
public class ChatCacheService {

    private final StringRedisTemplate redis;
    private static final Duration TTL = Duration.ofHours(24);

    public Optional<String> getCached(String key) {
        String val = redis.opsForValue().get("chat:" + key);
        return Optional.ofNullable(val);
    }

    public void cache(String key, String response) {
        redis.opsForValue().set("chat:" + key, response, TTL);
    }

    public void invalidate(String key) {
        redis.delete("chat:" + key);
    }
}`,
  },
  {
    label: 'JPA Query',
    lang: 'java',
    code: `@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.sessionId = :sessionId
          AND c.createdAt > :since
        ORDER BY c.createdAt DESC
        """)
    List<Conversation> findRecent(
        @Param("sessionId") String sessionId,
        @Param("since") LocalDateTime since
    );

    @Modifying
    @Query("UPDATE Conversation c SET c.archived = true WHERE c.createdAt < :cutoff")
    int archiveOlderThan(@Param("cutoff") LocalDateTime cutoff);
}`,
  },
  {
    label: 'React Hook',
    lang: 'javascript',
    code: `function useIntersectionReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}`,
  },
];

export default function CodePlayground() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(TABS[activeTab].code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="cp-section reveal" id="code-proof">
      <div className="container">
        <div className="cp-header section-head">
          <div className="label">08 — Code Proof</div>
          <h2>Real production patterns from my work</h2>
        </div>

        <div className="cp-tabs">
          {TABS.map((tab, i) => (
            <button
              key={i}
              className={`cp-tab${activeTab === i ? ' active' : ''}`}
              onClick={() => { setActiveTab(i); setCopied(false); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="cp-code-wrap">
          <button
            className={`cp-copy-btn${copied ? ' copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <pre className="cp-pre">
            <code className="cp-code">{TABS[activeTab].code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
