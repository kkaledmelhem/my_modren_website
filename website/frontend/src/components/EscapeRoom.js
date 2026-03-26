import { useState, useEffect, useRef, useCallback } from 'react';
import './EscapeRoom.css';

/* ─── Puzzle definitions ──────────────────────────────── */

const PUZZLES = [
  {
    id: 1,
    label: 'PUZZLE 1/3',
    title: 'The Rate Limiter',
    icon: '🧩',
    type: 'radio',
    options: [
      { id: 'a', text: 'Request 4 only' },
      { id: 'b', text: 'Requests 4 and 5' },
      { id: 'c', text: 'Requests 4, 5 and none after' },
      { id: 'd', text: 'None — all requests pass' },
    ],
    correctId: 'a',
    explanation:
      'Correct. Request 5 arrives at 12:01:05 — more than 60 seconds after 12:00:01 — so the window resets. Only request 4 exceeds the limit.',
  },
  {
    id: 2,
    label: 'PUZZLE 2/3',
    title: 'Fix the Query',
    icon: '🧩',
    type: 'text',
    placeholder: 'HAVING COUNT(*) > 5',
    hint: 'Column aliases defined in SELECT cannot be referenced in HAVING — you need to repeat the aggregate function.',
    checkAnswer: (input) => {
      const norm = input.toLowerCase().replace(/\s+/g, ' ').trim();
      return norm.includes('count(*)') && norm.includes('> 5');
    },
    explanation: 'Correct. SQL evaluates HAVING before resolving SELECT aliases, so `msg_count` is not yet available. Use `HAVING COUNT(*) > 5`.',
  },
  {
    id: 3,
    label: 'PUZZLE 3/3',
    title: 'Design Question',
    icon: '🧩',
    type: 'multiselect',
    options: [
      { id: 'poll',    text: 'REST polling every 100ms' },
      { id: 'ws',      text: 'WebSocket connections with a message broker' },
      { id: 'redis',   text: 'Redis Pub/Sub for message routing' },
      { id: 'db-poll', text: 'Store-and-forward via database polling' },
      { id: 'lp',      text: 'Long-polling HTTP requests' },
    ],
    correctIds: ['ws', 'redis'],
    explanation:
      'Correct. WebSockets provide persistent bidirectional connections; Redis Pub/Sub handles fan-out across server instances efficiently at scale.',
  },
];

/* ─── Helpers ─────────────────────────────────────────── */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function getPercentile(seconds) {
  if (seconds < 60)  return 5;
  if (seconds < 120) return 15;
  if (seconds < 180) return 30;
  if (seconds < 300) return 50;
  return 70;
}

const ASCII_LOCK = `
 ██████████████
 █            █
 █   ██████   █
 █   █    █   █
 █   ██████   █
 █    ████    █
 ██████████████
`.trim();

/* ─── Sub-components ──────────────────────────────────── */

function Puzzle1({ onCorrect }) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked]   = useState(false);
  const puzzle = PUZZLES[0];

  const handleCheck = () => {
    if (!selected) return;
    setChecked(true);
    if (selected === puzzle.correctId) {
      setTimeout(onCorrect, 1100);
    }
  };

  const isCorrect = checked && selected === puzzle.correctId;
  const isWrong   = checked && selected !== puzzle.correctId;

  return (
    <>
      <p className="er-puzzle-label">{puzzle.label}</p>
      <h2 className="er-puzzle-title">{puzzle.icon} {puzzle.title}</h2>

      <div className="er-code-block">
        <pre>{`A system receives requests. Apply these rules:
• Allow max 3 requests per minute per IP
• If limit exceeded, return 429
• After 60 seconds, reset the counter

Given this request log:
  12:00:01  IP: 192.168.1.1  ← request 1
  12:00:15  IP: 192.168.1.1  ← request 2
  12:00:30  IP: 192.168.1.1  ← request 3
  12:00:45  IP: 192.168.1.1  ← request 4
  12:01:05  IP: 192.168.1.1  ← request 5

Which requests return 429?`}</pre>
      </div>

      <div className="er-options">
        {puzzle.options.map((opt) => {
          let cls = 'er-option';
          if (selected === opt.id) cls += ' selected';
          if (checked && opt.id === puzzle.correctId) cls += ' correct';
          if (checked && selected === opt.id && opt.id !== puzzle.correctId) cls += ' wrong';

          return (
            <div
              key={opt.id}
              className={cls}
              onClick={() => !checked && setSelected(opt.id)}
              role="radio"
              aria-checked={selected === opt.id}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !checked && setSelected(opt.id)}
            >
              <span className="er-option-radio">
                <span className="er-option-radio-inner" />
              </span>
              {opt.text}
            </div>
          );
        })}
      </div>

      {checked && (
        <div className={`er-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? `✓ ${puzzle.explanation}` : '✗ Not quite. Think about the sliding window reset timing.'}
        </div>
      )}

      {!checked && (
        <button className="er-btn primary" onClick={handleCheck} disabled={!selected}>
          Submit →
        </button>
      )}
      {isWrong && (
        <button className="er-btn" style={{ marginLeft: 10 }} onClick={() => { setSelected(null); setChecked(false); }}>
          Try again
        </button>
      )}
    </>
  );
}

function Puzzle2({ onCorrect }) {
  const [answer, setAnswer]     = useState('');
  const [checked, setChecked]   = useState(false);
  const [showHint, setShowHint] = useState(false);
  const puzzle = PUZZLES[1];

  const handleCheck = () => {
    if (!answer.trim()) return;
    setChecked(true);
    if (puzzle.checkAnswer(answer)) {
      setTimeout(onCorrect, 1100);
    }
  };

  const isCorrect = checked && puzzle.checkAnswer(answer);
  const isWrong   = checked && !puzzle.checkAnswer(answer);

  return (
    <>
      <p className="er-puzzle-label">{puzzle.label}</p>
      <h2 className="er-puzzle-title">{puzzle.icon} {puzzle.title}</h2>

      <div className="er-code-block">
        <pre>{`This query should return users who sent more
than 5 messages in the last 24 hours.
Find and fix the bug:\n\nSELECT user_id, COUNT(*) as msg_count\nFROM messages\nWHERE created_at > NOW() - INTERVAL '24 hours'\nGROUP BY user_id\n`}<span style={{color:'#f87171',textDecoration:'underline wavy #f87171'}}>HAVING msg_count &gt; 5   ← BUG IS HERE</span>{`\nORDER BY msg_count DESC;`}</pre>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--er-muted)', marginBottom: 10 }}>
        Type only the corrected HAVING clause:
      </p>

      <input
        className="er-text-input"
        type="text"
        placeholder={puzzle.placeholder}
        value={answer}
        onChange={(e) => { setAnswer(e.target.value); setChecked(false); }}
        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
        autoComplete="off"
        spellCheck={false}
      />

      <div>
        <button className="er-hint-btn" onClick={() => setShowHint((v) => !v)}>
          {showHint ? '▾ Hide hint' : '▸ Hint'}
        </button>
        {showHint && <div className="er-hint-box">{puzzle.hint}</div>}
      </div>

      {checked && (
        <div className={`er-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? `✓ ${puzzle.explanation}` : '✗ Not quite. Make sure you use the aggregate function directly.'}
        </div>
      )}

      {!checked && (
        <button className="er-btn primary" onClick={handleCheck} disabled={!answer.trim()}>
          Submit →
        </button>
      )}
      {isWrong && checked && (
        <button className="er-btn" style={{ marginLeft: 10 }} onClick={() => { setAnswer(''); setChecked(false); }}>
          Try again
        </button>
      )}
    </>
  );
}

function Puzzle3({ onCorrect }) {
  const [selected, setSelected] = useState(new Set());
  const [checked, setChecked]   = useState(false);
  const puzzle = PUZZLES[2];

  const toggle = (id) => {
    if (checked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCheck = () => {
    if (selected.size === 0) return;
    setChecked(true);
    const correct = puzzle.correctIds.every((id) => selected.has(id)) &&
                    selected.size === puzzle.correctIds.length;
    if (correct) setTimeout(onCorrect, 1100);
  };

  const isCorrect = checked &&
    puzzle.correctIds.every((id) => selected.has(id)) &&
    selected.size === puzzle.correctIds.length;
  const isWrong = checked && !isCorrect;

  return (
    <>
      <p className="er-puzzle-label">{puzzle.label}</p>
      <h2 className="er-puzzle-title">{puzzle.icon} {puzzle.title}</h2>

      <div className="er-code-block">
        <pre>{`You're building a chat system for 10,000
concurrent users. Messages must be delivered
in real-time.

Which architecture would you choose?
(Select all that apply)`}</pre>
      </div>

      <div className="er-options">
        {puzzle.options.map((opt) => {
          let cls = 'er-option';
          if (selected.has(opt.id)) cls += ' selected';
          if (checked && puzzle.correctIds.includes(opt.id)) cls += ' correct';
          if (checked && selected.has(opt.id) && !puzzle.correctIds.includes(opt.id)) cls += ' wrong';

          return (
            <div
              key={opt.id}
              className={cls}
              onClick={() => toggle(opt.id)}
              role="checkbox"
              aria-checked={selected.has(opt.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggle(opt.id)}
            >
              <span className="er-option-check">
                {selected.has(opt.id) && <span style={{ color: 'var(--er-green)', fontSize: '0.7rem', lineHeight: 1 }}>✓</span>}
              </span>
              {opt.text}
            </div>
          );
        })}
      </div>

      {checked && (
        <div className={`er-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? `✓ ${puzzle.explanation}` : '✗ Not quite. Think about what handles persistent connections vs. message routing.'}
        </div>
      )}

      {!checked && (
        <button className="er-btn primary" onClick={handleCheck} disabled={selected.size === 0}>
          Submit →
        </button>
      )}
      {isWrong && (
        <button className="er-btn" style={{ marginLeft: 10 }} onClick={() => { setSelected(new Set()); setChecked(false); }}>
          Try again
        </button>
      )}
    </>
  );
}

/* ─── Completion screen ───────────────────────────────── */
function Complete({ elapsed, onBack }) {
  const [copied, setCopied] = useState(false);
  const percentile = getPercentile(elapsed);

  const copyEmail = () => {
    navigator.clipboard.writeText('khadme9@gmail.com').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="er-complete">
      <div className="er-complete-banner">🔓 ACCESS GRANTED</div>
      <div className="er-complete-meta">
        <span>Solve time: {formatTime(elapsed)}</span>
        <span>Rank: Top {percentile}% of solvers</span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--er-muted)', marginBottom: 16 }}>
        You've earned Khaled's direct contact:
      </p>

      <div className="er-contact-box">
        <hr className="er-contact-divider" />
        <div className="er-contact-line">
          <span className="er-contact-icon">📧</span>
          khadme9@gmail.com
        </div>
        <div className="er-contact-line">
          <span className="er-contact-icon">💼</span>
          LinkedIn: /in/khaled-melhem
        </div>
        <hr className="er-contact-divider" />
      </div>

      <p className="er-complete-quote">
        "If you got here, you actually understand the systems I work with every day. Let's talk."
      </p>

      <div className="er-complete-actions">
        <button className="er-btn primary" onClick={copyEmail}>
          {copied ? '✓ Copied!' : 'Copy Email'}
        </button>
        <a
          href="https://linkedin.com/in/khaled-melhem"
          target="_blank"
          rel="noopener noreferrer"
          className="er-btn"
          style={{ textDecoration: 'none' }}
        >
          Open LinkedIn ↗
        </a>
        <button className="er-btn" onClick={onBack}>
          Back to Portfolio
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────── */
export default function EscapeRoom({ onBack }) {
  // step: 0 = intro, 1/2/3 = puzzles, 4 = complete
  const [step, setStep]       = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef              = useRef(null);
  const startTimeRef          = useRef(null);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleStart = () => {
    startTimer();
    setStep(1);
  };

  const handleNext = useCallback((nextStep) => {
    if (nextStep > 3) {
      clearInterval(timerRef.current);
    }
    setStep(nextStep);
  }, []);

  const progressPct = step === 0 ? 0 : step >= 4 ? 100 : ((step - 1) / 3) * 100 + (100 / 3) * 0.5;

  return (
    <div className="er-page">
      {/* Header */}
      <header className="er-header">
        <button className="er-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>
        <span className="er-header-title">
          {step > 0 && step < 4 && (
            <span className="er-timer">⏱ {formatTime(elapsed)}</span>
          )}
          {step === 0 && 'THE HIRING ESCAPE ROOM'}
          {step === 4 && 'ACCESS GRANTED'}
        </span>
      </header>

      {/* Progress */}
      {step > 0 && step <= 3 && (
        <div className="er-progress-wrap">
          <p className="er-progress-label">Progress — puzzle {step} of 3</p>
          <div className="er-progress-bar">
            <div
              className="er-progress-fill"
              style={{ width: `${Math.round((step / 3) * 100)}%` }}
            />
          </div>
          <div className="er-steps-indicator">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`er-step-dot${s < step ? ' done' : s === step ? ' current' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="er-body">
        {step === 0 && (
          <>
            <div className="er-intro-art">
              <pre>{ASCII_LOCK}</pre>
            </div>
            <h1 className="er-intro-title">The Hiring Escape Room</h1>
            <p className="er-intro-desc">
              To unlock Khaled's direct contact information, you need to solve
              3 engineering puzzles. The faster you solve, the higher your rank.
            </p>
            <ul className="er-intro-rules">
              <li>3 puzzles — logic, SQL, and system design</li>
              <li>Timer starts when you click Begin</li>
              <li>No external resources needed — just your knowledge</li>
              <li>Solve all 3 to unlock direct contact details</li>
            </ul>
            <button className="er-btn primary" onClick={handleStart}>
              Begin →
            </button>
          </>
        )}

        {step === 1 && (
          <Puzzle1 onCorrect={() => handleNext(2)} />
        )}
        {step === 2 && (
          <Puzzle2 onCorrect={() => handleNext(3)} />
        )}
        {step === 3 && (
          <Puzzle3 onCorrect={() => handleNext(4)} />
        )}
        {step === 4 && (
          <Complete elapsed={elapsed} onBack={onBack} />
        )}
      </div>
    </div>
  );
}
