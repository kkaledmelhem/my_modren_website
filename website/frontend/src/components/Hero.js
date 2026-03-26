import { useApp } from '../App';
import { useEffect, useRef, useState } from 'react';

const CountUp = ({ value, color }) => {
  const [display, setDisplay] = useState('0');
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => { started.current = false; setDisplay('0'); }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const match = value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
                       .match(/^([+]?)(\d+\.?\d*)([+]?)(.*)$/);
    if (!match) { setDisplay(value); return; }
    const prefix = match[1] || '';
    const num = parseFloat(match[2]);
    const suffix = match[3] || match[4] || '';
    const isFloat = value.includes('.');
    const steps = 40;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          const eased = 1 - Math.pow(1 - step / steps, 3);
          setDisplay(prefix + (isFloat ? (num * eased).toFixed(1) : Math.floor(num * eased)) + suffix);
          if (step >= steps) { clearInterval(timer); setDisplay(value); }
        }, 1200 / steps);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return <div ref={ref} className="stat-num" style={{ color }}>{display}</div>;
};

const Typed = ({ strings, speed = 75, pause = 2000 }) => {
  const [text, setText] = useState('');
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = strings[idx % strings.length];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) setTimeout(() => setDeleting(true), pause);
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length - 1 === 0) { setDeleting(false); setIdx((i) => i + 1); }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, idx, strings, speed, pause]);

  return <span className="typed-text">{text}<span className="typed-cursor">|</span></span>;
};

/* Magnetic button — drifts toward cursor */
const MagneticBtn = ({ href, className, children }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
    const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const onLeave = () => { ref.current.style.transform = ''; };

  return (
    <a ref={ref} href={href} className={className}
       onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </a>
  );
};

const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('section');
    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = section?.offsetHeight || window.innerHeight);

    const COLORS = ['139,124,248', '52,211,153', '96,165,250'];
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      o: Math.random() * 0.3 + 0.07,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.o})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = canvas.closest('section')?.offsetHeight || window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  );
};

const CodeWindow = () => (
  <div className="code-window">
    <div className="cw-bar">
      <span className="cw-dot" style={{ background: '#ff5f57' }} />
      <span className="cw-dot" style={{ background: '#febc2e' }} />
      <span className="cw-dot" style={{ background: '#28c840' }} />
      <span className="cw-file">RobochatController.java</span>
    </div>
    <div className="cw-body">
      <div className="cw-line"><span className="cw-anno">@RestController</span></div>
      <div className="cw-line"><span className="cw-anno">@RequestMapping</span><span className="cw-punc">(</span><span className="cw-str">"/api/chat"</span><span className="cw-punc">)</span></div>
      <div className="cw-line"><span className="cw-kw">public class </span><span className="cw-cls">RobochatController</span><span className="cw-punc"> {'{'}</span></div>
      <div className="cw-line cw-indent"><span className="cw-anno">@Autowired</span></div>
      <div className="cw-line cw-indent"><span className="cw-kw">private </span><span className="cw-cls">BotService </span><span className="cw-var">botService</span><span className="cw-punc">;</span></div>
      <div className="cw-line"> </div>
      <div className="cw-line cw-indent"><span className="cw-anno">@PostMapping</span><span className="cw-punc">(</span><span className="cw-str">"/webhook"</span><span className="cw-punc">)</span></div>
      <div className="cw-line cw-indent"><span className="cw-kw">public </span><span className="cw-cls">ResponseEntity</span><span className="cw-punc">{'<?>'} </span><span className="cw-fn">handleMessage</span><span className="cw-punc">(</span></div>
      <div className="cw-line cw-indent2"><span className="cw-anno">@RequestBody </span><span className="cw-cls">WebhookPayload </span><span className="cw-var">payload</span><span className="cw-punc">) {'{'}</span></div>
      <div className="cw-line cw-indent2"><span className="cw-kw">return </span><span className="cw-var">botService</span></div>
      <div className="cw-line cw-indent3"><span className="cw-punc">.</span><span className="cw-fn">process</span><span className="cw-punc">(</span><span className="cw-var">payload</span><span className="cw-punc">)</span></div>
      <div className="cw-line cw-indent3"><span className="cw-punc">.</span><span className="cw-fn">toResponse</span><span className="cw-punc">();</span></div>
      <div className="cw-line cw-indent"><span className="cw-punc">{'}'}</span></div>
      <div className="cw-line"><span className="cw-punc">{'}'}</span></div>
    </div>
    <div className="cw-status-bar">
      <span className="cw-status-dot" />
      Spring Boot 3 &middot; Java 21 &middot; Running on :8080
    </div>
  </div>
);

const Hero = () => {
  const { t, lang } = useApp();
  const h = t.hero;
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(id);
  }, []);

  // Cursor-tracking radial glow (Awwwards #1 pattern)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onMove = (e) => {
      el.style.setProperty('--mx', e.clientX + 'px');
      el.style.setProperty('--my', e.clientY + 'px');
    };
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  const roles = lang === 'ar'
    ? ['قائد فريق', 'مهندس برمجيات', 'متخصص Java', 'مهندس منصات AI']
    : ['Team Lead', 'Software Engineer', 'Java Specialist', 'AI Platform Builder'];

  return (
    <section id="hero" ref={sectionRef}>
      <ParticleCanvas />
      <div className="hero-aurora" />
      <div className="hero-aurora hero-aurora-2" />
      <div className="hero-grid" />
      <div className="hero-noise" />
      <div className="container">
        <div className="hero-inner">
          <div>
            <div className={`hero-line hero-line-1${loaded ? ' in' : ''}`}>
              <div className="hero-badge-new">
                <span className="hero-badge-dot" />
                {h.badge}
              </div>
            </div>
            <div className={`hero-line hero-line-2${loaded ? ' in' : ''}`}>
              <h1 className="hero-h1">
                {h.firstName}
                <br />
                <em style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--teal))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{h.lastName}</em>
              </h1>
            </div>
            <div className={`hero-line hero-line-3${loaded ? ' in' : ''}`}>
              <p className="hero-role">
                <Typed strings={roles} /> &mdash; {h.location}
              </p>
            </div>
            <div className={`hero-line hero-line-4${loaded ? ' in' : ''}`}>
              <p className="hero-sub">{h.sub}</p>
            </div>
            <div className={`hero-line hero-line-5${loaded ? ' in' : ''}`}>
              <div className="hero-actions">
                <MagneticBtn href="#contact" className="btn-primary">{h.cta}</MagneticBtn>
                <MagneticBtn href="#projects" className="btn-ghost">{h.work}</MagneticBtn>
                <a href="/Khaled_Melhem_Resume.pdf" download className="btn-cv">↓ CV</a>
              </div>
            </div>
          </div>

          <div className={`hero-line hero-line-6${loaded ? ' in' : ''}`}>
            <div className="hero-right">
              <CodeWindow />
              <div className="hero-stats-row">
                <div className="hero-stat-card" style={{ backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <div className="stat-icon">⚡</div>
                  <div>
                    <CountUp value={h.stat1Num} color="var(--accent)" />
                    <div className="stat-desc">{h.stat1Label}</div>
                  </div>
                </div>
                <div className="hero-stat-card" style={{ backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <div className="stat-icon">🚀</div>
                  <div>
                    <CountUp value={h.stat2Num} color="var(--teal)" />
                    <div className="stat-desc">{h.stat2Label}</div>
                  </div>
                </div>
                <div className="hero-stat-card" style={{ backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                  <div className="stat-icon">👥</div>
                  <div>
                    <CountUp value={h.stat3Num} color="var(--blue)" />
                    <div className="stat-desc">{h.stat3Label}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-scroll-hint">
        <div className="hero-scroll-line" />
        <span>scroll</span>
      </div>
    </section>
  );
};

export default Hero;
