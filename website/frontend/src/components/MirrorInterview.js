import { useState, useEffect, useRef, useCallback } from 'react';
import './MirrorInterview.css';

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */

const BOOT_LINES = [
  '> Initializing compatibility analysis...',
  '> Hello. Before I tell you about Khaled, I\'d like to understand what YOU are looking for.',
  '> This will take 3 quick questions. Ready?',
];

const QUESTIONS = [
  {
    id: 'teamSize',
    text: "What's the size of your engineering team?",
    options: [
      { label: 'Solo / startup', value: 'Solo/startup (<10)' },
      { label: 'Growing (10–50)', value: 'Growing (10-50)' },
      { label: 'Scale-up (50–200)', value: 'Scale-up (50-200)' },
      { label: 'Enterprise (200+)', value: 'Enterprise (200+)' },
    ],
  },
  {
    id: 'stack',
    text: "What's your primary backend stack?",
    options: [
      { label: 'Java / Spring', value: 'Java/Spring' },
      { label: 'Node.js', value: 'Node.js' },
      { label: 'Python / Django', value: 'Python/Django' },
      { label: '.NET', value: '.NET' },
      { label: 'Go', value: 'Go' },
      { label: 'Mixed / Other', value: 'Mixed/Other' },
    ],
  },
  {
    id: 'priority',
    text: "What's most important to you in this hire?",
    options: [
      { label: 'Technical depth', value: 'Technical depth' },
      { label: 'Leadership ability', value: 'Leadership ability' },
      { label: 'Speed to deliver', value: 'Speed to deliver' },
      { label: 'System design', value: 'System design' },
      { label: 'Team culture fit', value: 'Team culture fit' },
    ],
  },
];

const FALLBACK_RESULT = {
  analysis:
    "Khaled brings a rare combination of hands-on backend engineering depth and proven team leadership. His track record with high-traffic distributed systems, combined with his experience scaling teams and owning architecture decisions end-to-end, makes him a strong candidate across a wide range of engineering environments.",
  score: 82,
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

function buildPrompt(answers) {
  return `You are an AI representing Khaled Melhem's portfolio. A recruiter just answered these questions:
Team size: ${answers[0]}
Stack: ${answers[1]}
Priority: ${answers[2]}

Generate a personalized "Compatibility Report" for this recruiter. Be specific, confident, and use Khaled's profile:
- Khaled is a Team Lead & Backend Engineer with 2.5+ years at Robotack
- Built Robochat: AI chatbot platform handling 10K+ daily interactions
- Led team of 4 engineers
- Stack: Java 21, Spring Boot, Spring Security, PostgreSQL, Redis, Meta API
- Experienced with distributed systems, WebSocket, CI/CD, Docker
- Currently open to senior backend or team lead roles, prefers remote/EU

Write 3-4 sentences analyzing fit based on their answers. End with a "Match Score" from 60-98 as a percentage. Format:
ANALYSIS: [your analysis]
MATCH_SCORE: [number]

Keep it direct, no fluff, confident tone.`;
}

function parseResult(reply) {
  const analysisMatch = reply.match(/ANALYSIS:\s*([\s\S]*?)(?=MATCH_SCORE:|$)/i);
  const scoreMatch = reply.match(/MATCH_SCORE:\s*(\d+)/i);
  const analysis = analysisMatch ? analysisMatch[1].trim() : reply.trim();
  const score = scoreMatch ? Math.min(98, Math.max(60, parseInt(scoreMatch[1], 10))) : 82;
  return { analysis, score };
}

function scoreColor(score) {
  if (score >= 90) return 'var(--mi-green)';
  if (score >= 75) return 'var(--teal, #2dd4bf)';
  return 'var(--mi-yellow)';
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */

/* Animated SVG score ring */
const ScoreRing = ({ score, color }) => {
  const [animScore, setAnimScore] = useState(0);
  const radius = 48;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (animScore / 100) * circ;

  useEffect(() => {
    let frame;
    let current = 0;
    const target = score;
    const step = () => {
      current = Math.min(current + 1.4, target);
      setAnimScore(Math.round(current));
      if (current < target) frame = requestAnimationFrame(step);
    };
    const t = setTimeout(() => { frame = requestAnimationFrame(step); }, 200);
    return () => { clearTimeout(t); cancelAnimationFrame(frame); };
  }, [score]);

  return (
    <div className="mi-ring-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120" className="mi-ring-svg">
        {/* Track */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '60px 60px',
            transition: 'stroke-dashoffset 0.05s linear',
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>
      <div className="mi-ring-label">
        <span className="mi-ring-score" style={{ color }}>{animScore}%</span>
        <span className="mi-ring-sub">Match</span>
      </div>
    </div>
  );
};

/* Character-by-character typing effect */
const TypedText = ({ text, speed = 18, onDone }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    if (!text) return;
    const interval = setInterval(() => {
      idx.current += 1;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) {
        clearInterval(interval);
        onDone && onDone();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  return <span>{displayed}<span className="mi-cursor" aria-hidden="true">▋</span></span>;
};

/* Terminal boot sequence */
const BootSequence = ({ onReady }) => {
  const [lines, setLines] = useState([]);
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const delays = [400, 1400, 2600];
    delays.forEach((delay, i) => {
      setTimeout(() => {
        if (!cancelled) setLines((prev) => [...prev, BOOT_LINES[i]]);
      }, delay);
    });
    setTimeout(() => {
      if (!cancelled) setShowBtn(true);
    }, 3600);
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mi-boot">
      <div className="mi-terminal-lines">
        {lines.map((line, i) => (
          <div key={i} className="mi-terminal-line" style={{ animationDelay: `${i * 0.05}s` }}>
            {line}
          </div>
        ))}
      </div>
      {showBtn && (
        <button className="mi-primary-btn mi-boot-btn" onClick={onReady}>
          Start Interview
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}
    </div>
  );
};

/* Single question step */
const QuestionStep = ({ question, index, total, onAnswer }) => {
  const [selected, setSelected] = useState(null);
  const [committed, setCommitted] = useState(false);

  const pick = (value) => {
    if (committed) return;
    setSelected(value);
    setCommitted(true);
    setTimeout(() => onAnswer(value), 420);
  };

  return (
    <div className="mi-question-wrap">
      <div className="mi-q-counter">
        Question {index + 1} <span className="mi-q-counter-of">of {total}</span>
      </div>
      <p className="mi-q-text">{question.text}</p>
      <div className="mi-options">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            className={`mi-option-btn${selected === opt.value ? ' mi-option-btn--selected' : ''}${committed && selected !== opt.value ? ' mi-option-btn--faded' : ''}`}
            onClick={() => pick(opt.value)}
            disabled={committed}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Progress bar */}
      <div className="mi-progress-track">
        <div
          className="mi-progress-fill"
          style={{ width: `${((index + (committed ? 1 : 0)) / total) * 100}%` }}
        />
      </div>
    </div>
  );
};

/* Loading state while AI thinks */
const ThinkingState = () => (
  <div className="mi-thinking">
    <div className="mi-thinking-dots">
      <span /><span /><span />
    </div>
    <p className="mi-thinking-text">Analyzing compatibility...</p>
  </div>
);

/* Result card */
const ResultCard = ({ analysis, score, onRetake, onContact }) => {
  const color = scoreColor(score);
  const [typingDone, setTypingDone] = useState(false);

  return (
    <div className="mi-result">
      <div className="mi-result-header">
        <ScoreRing score={score} color={color} />
        <div className="mi-result-meta">
          <div className="mi-result-title">Compatibility Report</div>
          <div className="mi-result-badge" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
            {score >= 90 ? 'Excellent Fit' : score >= 75 ? 'Strong Fit' : 'Good Fit'}
          </div>
        </div>
      </div>

      <div className="mi-result-analysis">
        <TypedText text={analysis} speed={16} onDone={() => setTypingDone(true)} />
      </div>

      {typingDone && (
        <div className="mi-result-actions">
          <button className="mi-primary-btn mi-contact-btn" onClick={onContact}>
            Contact Khaled Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button className="mi-ghost-btn" onClick={onRetake}>
            Retake
          </button>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */

const MirrorInterview = () => {
  const [open, setOpen] = useState(false);
  const [btnVisible, setBtnVisible] = useState(false);
  /* step: 'boot' | 'questions' | 'thinking' | 'result' */
  const [step, setStep] = useState('boot');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const modalRef = useRef(null);

  /* Delay button entrance by 3s */
  useEffect(() => {
    const t = setTimeout(() => setBtnVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  /* Trap focus inside modal when open */
  useEffect(() => {
    if (open) {
      const el = modalRef.current;
      el?.focus();
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const reset = () => {
    setStep('boot');
    setQIndex(0);
    setAnswers([]);
    setResult(null);
  };

  const closeModal = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const openModal = () => {
    reset();
    setOpen(true);
  };

  const handleAnswer = useCallback(async (value) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (qIndex < QUESTIONS.length - 1) {
      /* Fade out, move to next question */
      setTransitioning(true);
      setTimeout(() => {
        setQIndex((i) => i + 1);
        setTransitioning(false);
      }, 280);
    } else {
      /* All answered — call AI */
      setStep('thinking');
      try {
        const prompt = buildPrompt(newAnswers);
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prompt, lang: 'en' }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const parsed = parseResult(data.reply || '');
        setResult(parsed);
      } catch {
        setResult(FALLBACK_RESULT);
      } finally {
        setStep('result');
      }
    }
  }, [answers, qIndex]);

  const handleContact = () => {
    closeModal();
    setTimeout(() => {
      const el = document.getElementById('contact');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 320);
  };

  return (
    <>
      {/* Trigger button */}
      {btnVisible && (
        <button
          className="mi-fab"
          onClick={openModal}
          aria-label="Open Recruiter Compatibility Scanner"
        >
          <span className="mi-fab-icon" aria-hidden="true">🤖</span>
          <span className="mi-fab-text">Recruiter Scanner</span>
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <div
          className="mi-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          role="presentation"
        >
          <div
            className="mi-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Recruiter Compatibility Scanner"
            ref={modalRef}
            tabIndex={-1}
          >
            {/* Terminal title bar */}
            <div className="mi-title-bar">
              <div className="mi-title-dots">
                <span className="mi-dot mi-dot--red" onClick={closeModal} role="button" aria-label="Close" tabIndex={0} />
                <span className="mi-dot mi-dot--yellow" />
                <span className="mi-dot mi-dot--green" />
              </div>
              <span className="mi-title-text">Recruiter Compatibility Scanner v1.0</span>
              <button className="mi-close-btn" onClick={closeModal} aria-label="Close modal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Gradient top stripe */}
            <div className="mi-stripe" aria-hidden="true" />

            {/* Content area */}
            <div className="mi-content">
              {step === 'boot' && (
                <BootSequence onReady={() => {
                  setTransitioning(true);
                  setTimeout(() => { setStep('questions'); setTransitioning(false); }, 260);
                }} />
              )}

              {step === 'questions' && (
                <div className={`mi-step${transitioning ? ' mi-step--out' : ' mi-step--in'}`}>
                  <QuestionStep
                    key={qIndex}
                    question={QUESTIONS[qIndex]}
                    index={qIndex}
                    total={QUESTIONS.length}
                    onAnswer={handleAnswer}
                  />
                </div>
              )}

              {step === 'thinking' && <ThinkingState />}

              {step === 'result' && result && (
                <div className="mi-step mi-step--in">
                  <ResultCard
                    analysis={result.analysis}
                    score={result.score}
                    onRetake={() => {
                      setTransitioning(true);
                      setTimeout(() => { reset(); setTransitioning(false); }, 260);
                    }}
                    onContact={handleContact}
                  />
                </div>
              )}
            </div>

            {/* Subtle footer */}
            <div className="mi-footer">
              Powered by Khaled's AI — answers are personalized in real-time
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MirrorInterview;
