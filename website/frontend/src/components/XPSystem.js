import { useState, useEffect, useRef, useCallback } from 'react';
import './XPSystem.css';

const MAX_XP = 500;
const STORAGE_KEY = 'km-xp';
const SECTIONS_KEY = 'km-xp-sections';

function loadXP() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? Math.min(n, MAX_XP) : 0;
}

function saveXP(xp) {
  localStorage.setItem(STORAGE_KEY, String(Math.min(xp, MAX_XP)));
}

export default function XPSystem() {
  const [xp, setXP] = useState(loadXP);
  const [showModal, setShowModal] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [tooltip, setTooltip] = useState(false);
  const [gainLabel, setGainLabel] = useState(null); // { amount, id }
  const gainTimerRef = useRef(null);
  const seenSectionsRef = useRef(new Set(JSON.parse(localStorage.getItem(SECTIONS_KEY) || '[]')));
  const prevXPRef = useRef(loadXP());

  const addXP = useCallback((amount) => {
    setXP((prev) => {
      const next = Math.min(prev + amount, MAX_XP);
      saveXP(next);
      // Trigger level-up animation when crossing MAX_XP
      if (prev < MAX_XP && next === MAX_XP) {
        setTimeout(() => setShowModal(true), 800);
        setLevelUp(true);
        setTimeout(() => setLevelUp(false), 1800);
      }
      return next;
    });

    // Flash gain label
    clearTimeout(gainTimerRef.current);
    const id = Date.now();
    setGainLabel({ amount, id });
    gainTimerRef.current = setTimeout(() => setGainLabel(null), 1600);
  }, []);

  // Listen for km-xp events
  useEffect(() => {
    const handler = (e) => {
      const { amount } = e.detail || {};
      if (amount > 0) addXP(amount);
    };
    window.addEventListener('km-xp', handler);
    return () => window.removeEventListener('km-xp', handler);
  }, [addXP]);

  // +10 XP on page load (once per session)
  useEffect(() => {
    const seen = sessionStorage.getItem('km-xp-load');
    if (!seen) {
      sessionStorage.setItem('km-xp-load', '1');
      addXP(10);
    }
  }, [addXP]);

  // +5 XP per section entering viewport (once each)
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (!seenSectionsRef.current.has(id)) {
              seenSectionsRef.current.add(id);
              localStorage.setItem(SECTIONS_KEY, JSON.stringify([...seenSectionsRef.current]));
              addXP(5);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [addXP]);

  // Keep prevXPRef in sync (for animations)
  useEffect(() => {
    prevXPRef.current = xp;
  }, [xp]);

  const pct = (xp / MAX_XP) * 100;
  const isMax = xp >= MAX_XP;

  return (
    <>
      {/* XP Bar */}
      <div
        className={`xp-bar-wrap${levelUp ? ' xp-levelup' : ''}${isMax ? ' xp-maxed' : ''}`}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        aria-label={`Exploration XP: ${xp} of ${MAX_XP}`}
        role="progressbar"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={MAX_XP}
      >
        <div className="xp-track">
          <div className="xp-fill" style={{ width: `${pct}%` }}>
            {pct > 2 && <span className="xp-dot" />}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="xp-tooltip">
            {isMax ? 'MAX LEVEL — you unlocked the secret' : `Exploration XP: ${xp} / ${MAX_XP}`}
          </div>
        )}

        {/* Gain flash */}
        {gainLabel && (
          <div className="xp-gain-flash" key={gainLabel.id}>
            +{gainLabel.amount} XP
          </div>
        )}
      </div>

      {/* Max Level Modal */}
      {showModal && (
        <div className="xp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="xp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="xp-modal-badge">MAX LEVEL 🔓</div>
            <h2 className="xp-modal-title">You've unlocked Khaled's direct line.</h2>
            <p className="xp-modal-msg">
              If you explored this far, you're exactly who I want to work with.
            </p>
            <div className="xp-modal-email">khadme9@gmail.com</div>
            <button className="xp-modal-close" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
