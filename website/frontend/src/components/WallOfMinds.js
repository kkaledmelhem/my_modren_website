/*
 * WallOfMinds.js
 *
 * USAGE: Add this component to App.js inside the home <main> section,
 *        between <GitHubActivity /> and <JDAnalyzer />.
 *
 *   import WallOfMinds from './components/WallOfMinds';
 *   ...
 *   <GitHubActivity />
 *   <WallOfMinds />
 *   <JDAnalyzer />
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './WallOfMinds.css';

const API_BASE       = '/api/wall';
const LS_KEY         = 'km-wall-submitted';
const WORD_REGEX     = /^[a-zA-Z\u0600-\u06FF]+$/;
const CLOUD_COLORS   = ['var(--accent)', 'var(--teal)', 'var(--blue)', 'var(--text)', 'var(--muted)'];
const MAX_FONT       = 36;
const MIN_FONT       = 12;

/* ── Deterministic-ish layout seeded by word content ───────── */
function seedRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return Math.abs(h) / 0x7fffffff;
  };
}

function buildLayout(words) {
  return words.map((item, idx) => {
    const rng   = seedRandom(item.word + idx);
    const left  = 2 + rng() * 86;                     // 2% – 88%
    const top   = 2 + rng() * 86;                     // 2% – 88%
    const size  = MAX_FONT - (idx / Math.max(words.length - 1, 1)) * (MAX_FONT - MIN_FONT);
    const color = CLOUD_COLORS[Math.floor(rng() * CLOUD_COLORS.length)];
    const delay = rng() * 4;                           // 0–4s float delay
    const dur   = 3 + rng() * 4;                       // 3–7s float duration
    const dist  = 4 + rng() * 10;                      // vertical float distance
    return { ...item, left, top, size, color, delay, dur, dist, idx };
  });
}

/* ═══════════════════════════════════════════════════════════ */
export default function WallOfMinds() {
  const sectionRef  = useRef(null);
  const inputRef    = useRef(null);

  const [words, setWords]             = useState([]);
  const [total, setTotal]             = useState(0);
  const [layout, setLayout]           = useState([]);

  const [hasSubmitted, setHasSubmitted] = useState(
    () => !!localStorage.getItem(LS_KEY)
  );
  const [alreadyOnWall, setAlreadyOnWall] = useState(false);

  const [inputVal, setInputVal]       = useState('');
  const [inputError, setInputError]   = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [justAdded, setJustAdded]     = useState(null);   // word string that just flew in

  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState(false);

  /* ── Fetch words on mount ────────────────────────────────── */
  const fetchWords = useCallback(async () => {
    try {
      setFetchError(false);
      const res  = await fetch(`${API_BASE}/words`);
      const data = await res.json();
      setWords(data);
      setLayout(buildLayout(data));
      setTotal(data.length);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  /* ── Section reveal via IntersectionObserver ─────────────── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('wom-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Input validation ────────────────────────────────────── */
  function handleInputChange(e) {
    const val = e.target.value;
    setInputVal(val);
    if (val && !WORD_REGEX.test(val)) {
      setInputError('Letters only — no numbers or symbols.');
    } else if (val.length > 30) {
      setInputError('Max 30 characters.');
    } else {
      setInputError('');
    }
  }

  /* ── Submit word ─────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    const word = inputVal.trim();

    if (!word)                          { setInputError('Please enter a word.'); return; }
    if (!WORD_REGEX.test(word))         { setInputError('Letters only.'); return; }
    if (word.length > 30)               { setInputError('Max 30 characters.'); return; }

    setSubmitting(true);
    setInputError('');

    try {
      const res  = await fetch(`${API_BASE}/word`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ word }),
      });
      const data = await res.json();

      if (data.error === 'already_submitted') {
        localStorage.setItem(LS_KEY, '1');
        setHasSubmitted(true);
        setAlreadyOnWall(true);
        return;
      }

      if (data.error) {
        setInputError(data.message || 'Something went wrong.');
        return;
      }

      if (data.success) {
        // Add to cloud with fly-in animation
        const newWord = { word, id: data.word?.id ?? Date.now() };
        const newWords = [newWord, ...words];
        setWords(newWords);
        setLayout(buildLayout(newWords));
        setTotal(data.total ?? newWords.length);
        setJustAdded(word);
        setTimeout(() => setJustAdded(null), 1200);

        localStorage.setItem(LS_KEY, '1');
        setHasSubmitted(true);
        setInputVal('');
      }
    } catch {
      setInputError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <section id="wall-of-minds" className="wom-section" ref={sectionRef}>
      <div className="container">

        {/* Header */}
        <div className="section-head wom-head reveal">
          <div className="label">The Wall of Minds</div>
          <h2 className="wom-title">
            Every visitor leaves <span>one word.</span><br />They stay forever.
          </h2>
        </div>

        {/* Input zone */}
        {!hasSubmitted ? (
          <div className="wom-input-zone reveal">
            <p className="wom-prompt">
              You've read about Khaled. One word:
            </p>
            <form className="wom-form" onSubmit={handleSubmit} noValidate>
              <div className="wom-field-wrap">
                <input
                  ref={inputRef}
                  className={`wom-input${inputError ? ' wom-input--error' : ''}`}
                  type="text"
                  placeholder="brilliant, creative, solid…"
                  value={inputVal}
                  onChange={handleInputChange}
                  maxLength={30}
                  disabled={submitting}
                  autoComplete="off"
                  spellCheck={false}
                />
                <span className="wom-char-count">{inputVal.length}/30</span>
              </div>
              {inputError && <p className="wom-error">{inputError}</p>}
              <button
                className="wom-btn"
                type="submit"
                disabled={submitting || !!inputError || !inputVal.trim()}
              >
                {submitting ? 'Adding…' : 'Leave it →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="wom-submitted-banner reveal">
            {alreadyOnWall
              ? 'Your word is already on the wall ✓'
              : `Your word "${localStorage.getItem(LS_KEY) === '1' && justAdded
                   ? justAdded
                   : 'your word'
                 }" is now part of this wall forever ✓`
            }
          </div>
        )}

        {/* Counter */}
        <div className="wom-counter reveal">
          {loading ? (
            <span className="wom-counter-skeleton" />
          ) : (
            <>{total} {total === 1 ? 'mind has' : 'minds have'} left their mark</>
          )}
        </div>

        {/* Word cloud */}
        <div className="wom-cloud-wrap reveal">
          {loading && (
            <div className="wom-loading">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="wom-skeleton-word" style={{ '--i': i }} />
              ))}
            </div>
          )}

          {!loading && fetchError && (
            <div className="wom-fetch-error">
              Could not load the wall. <button className="wom-retry" onClick={fetchWords}>Retry</button>
            </div>
          )}

          {!loading && !fetchError && words.length === 0 && (
            <div className="wom-empty">
              No words yet — be the first to leave yours.
            </div>
          )}

          {!loading && !fetchError && words.length > 0 && (
            <div className="wom-cloud" aria-label="Word cloud of visitor words">
              {layout.map((item) => (
                <span
                  key={item.id}
                  className={`wom-word${item.word === justAdded && item.idx === 0 ? ' wom-word--new' : ''}`}
                  style={{
                    left:              `${item.left}%`,
                    top:               `${item.top}%`,
                    fontSize:          `${item.size}px`,
                    color:             item.color,
                    animationDelay:    `${item.delay}s`,
                    animationDuration: `${item.dur}s`,
                    '--float-dist':    `${item.dist}px`,
                  }}
                  title={`word #${item.id}`}
                  aria-label={`${item.word}, word number ${item.id}`}
                >
                  {item.word}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
