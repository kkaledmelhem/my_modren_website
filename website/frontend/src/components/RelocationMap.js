import { useState } from 'react';
import './RelocationMap.css';

const STATIC_EXAMPLES = [
  { text: "Cairo → Amsterdam. 3 years of paperwork. Worth every form.", author: "Backend Dev" },
  { text: "Jordan → Canada. Different continent, same Arabic jokes.", author: "Staff Engineer" },
];

const COST_CARDS = [
  {
    icon: "💰",
    title: "Financial Reality",
    lines: [
      ["Visa application", "€75"],
      ["Language course", "€1,200"],
      ["Relocation budget", "€3,000–5,000"],
      ["First month rent (Berlin)", "€1,200–1,800"],
      ["Total preparation", "~€8,000+"],
    ],
  },
  {
    icon: "🗓️",
    title: "Time Investment",
    lines: [
      ["German language learning", "6–12 months"],
      ["Job search from abroad", "2–4 months"],
      ["Visa processing", "2–3 months"],
      ["Total timeline", "10–18 months"],
    ],
  },
  {
    icon: "❤️",
    title: "Human Cost",
    lines: [
      ["Distance from family", "2,847 km"],
      ["Time zone difference", "+1 hour"],
      ["Missed holidays", "Eid, family gatherings"],
      ["Last hug before departure", "unknown"],
    ],
  },
  {
    icon: "🌍",
    title: "The Upside",
    lines: [
      ["Avg backend salary", "€65,000–85,000/yr"],
      ["Work-life balance ranking", "Top 10 globally"],
      ["Engineering culture", "World-class"],
      ["Visa path to EU citizenship", "5 years"],
    ],
  },
];

function MapSVG() {
  /*
   * Simplified geographic positions within a 700×340 viewBox.
   * Amman (Jordan) ~ 72% x, 52% y  → x=504, y=177
   * Berlin (Germany) ~ 46% x, 22% y → x=322, y=75
   * Arc midpoint offset upward for a smooth flight path.
   */
  const amman  = { x: 504, y: 192 };
  const berlin = { x: 322, y: 82 };
  const cx     = (amman.x + berlin.x) / 2;       // 413
  const cy     = Math.min(amman.y, berlin.y) - 90; // -8 → clamp to 10
  const controlY = Math.max(cy, 10);

  const arcD = `M ${amman.x} ${amman.y} Q ${cx} ${controlY} ${berlin.x} ${berlin.y}`;

  // Plane position at ~50% along the quadratic bezier
  const t = 0.5;
  const px = (1 - t) * (1 - t) * amman.x + 2 * (1 - t) * t * cx + t * t * berlin.x;
  const py = (1 - t) * (1 - t) * amman.y + 2 * (1 - t) * t * controlY + t * t * berlin.y;

  // Angle of the tangent at t=0.5
  const dx = 2 * (1 - t) * (cx - amman.x) + 2 * t * (berlin.x - cx);
  const dy = 2 * (1 - t) * (controlY - amman.y) + 2 * t * (berlin.y - controlY);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <svg
      className="rm-map-svg"
      viewBox="0 0 700 340"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Map showing flight path from Amman to Berlin"
    >
      {/* Background */}
      <rect width="700" height="340" fill="var(--bg2)" rx="10" />

      {/* Subtle continent outlines — very simplified Europe/Middle East blobs */}
      <g fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.35">
        {/* rough Europe blob */}
        <ellipse cx="310" cy="120" rx="130" ry="80" />
        {/* rough Middle East blob */}
        <ellipse cx="500" cy="210" rx="90" ry="55" />
      </g>

      {/* Dashed arc */}
      <path
        d={arcD}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        opacity="0.7"
      />

      {/* City dots — animated pulse via CSS */}
      {/* Amman */}
      <circle cx={amman.x} cy={amman.y} r="6" fill="var(--teal)" className="rm-city-dot" />
      <circle cx={amman.x} cy={amman.y} r="12" fill="var(--teal)" opacity="0.18" />
      {/* Berlin */}
      <circle cx={berlin.x} cy={berlin.y} r="6" fill="var(--accent)" className="rm-city-dot delay" />
      <circle cx={berlin.x} cy={berlin.y} r="12" fill="var(--accent)" opacity="0.18" />

      {/* City labels */}
      <text x={amman.x + 12} y={amman.y + 4} fill="var(--teal)" fontSize="11" fontFamily="DM Mono, monospace" fontWeight="600">Amman, Jordan</text>
      <text x={berlin.x - 90} y={berlin.y - 12} fill="var(--accent)" fontSize="11" fontFamily="DM Mono, monospace" fontWeight="600">Berlin, Germany</text>

      {/* Plane icon at midpoint */}
      <g transform={`translate(${px}, ${py}) rotate(${angle})`}>
        <text
          x="-9"
          y="6"
          fontSize="18"
          textAnchor="middle"
          style={{ userSelect: 'none' }}
        >✈</text>
      </g>

      {/* Distance label */}
      <text
        x={cx + 8}
        y={controlY + 28}
        fill="var(--muted)"
        fontSize="10"
        fontFamily="DM Mono, monospace"
        textAnchor="middle"
      >
        2,847 km
      </text>
    </svg>
  );
}

export default function RelocationMap({ onBack }) {
  const [storyInput, setStoryInput] = useState('');
  const [userStories, setUserStories] = useState([]);

  const handleAddStory = () => {
    const trimmed = storyInput.trim();
    if (!trimmed) return;
    const newStory = trimmed;
    const updated = [newStory, ...userStories];
    setUserStories(updated);
    try {
      localStorage.setItem('km-reloc-stories', JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    setStoryInput('');
  };

  return (
    <div className="rm-page">
      {/* Header */}
      <header className="rm-header">
        <button className="rm-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>
      </header>

      {/* Section 1 — Map */}
      <section className="rm-section">
        <p className="rm-section-label">The journey</p>
        <h2 className="rm-section-title">The Relocation Map</h2>
        <div className="rm-map-wrap">
          <MapSVG />
        </div>
      </section>

      {/* Section 2 — Real Cost */}
      <section className="rm-section">
        <p className="rm-section-label">The numbers</p>
        <h2 className="rm-section-title">The Real Cost</h2>
        <div className="rm-cards">
          {COST_CARDS.map((card) => (
            <div className="rm-card" key={card.title}>
              <div className="rm-card-icon">{card.icon}</div>
              <p className="rm-card-title">{card.title}</p>
              <ul className="rm-card-lines">
                {card.lines.map(([label, value]) => (
                  <li key={label}>{label}: <strong>{value}</strong></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Why Germany */}
      <section className="rm-section">
        <p className="rm-section-label">In my own words</p>
        <h2 className="rm-section-title">Why Germany Specifically</h2>
        <div className="rm-quote-block">
          <p className="rm-quote-text">{`"I've been asking this question for 2 years now. Why Germany?

Not just the salary — though that matters. It's the engineering culture.
Germany builds things to last. I want to work in an environment where
'good enough' isn't acceptable, where documentation matters, where
senior engineers are still writing code at 45.

My Arabic and my Jordan experience aren't baggage. They're a lens
that most European teams don't have. That's valuable.

The real answer: because I'm ready. And ready doesn't wait."`}</p>
        </div>
      </section>

      {/* Section 4 — Add Your Story */}
      <section className="rm-section">
        <p className="rm-section-label">Community</p>
        <h2 className="rm-section-title">Add Your Story</h2>
        <p className="rm-story-subtitle">Are you on a similar journey? Share one line:</p>

        <div className="rm-story-examples">
          {STATIC_EXAMPLES.map((ex, i) => (
            <div className="rm-story-example" key={i}>
              <span>"{ex.text}"</span> — {ex.author}
            </div>
          ))}
          {userStories.map((s, i) => (
            <div className="rm-user-story" key={`user-${i}`}>"{s}"</div>
          ))}
        </div>

        <div className="rm-story-form">
          <input
            className="rm-story-input"
            type="text"
            placeholder="Your city → Your destination. One line."
            value={storyInput}
            onChange={(e) => setStoryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStory()}
            maxLength={140}
          />
          <button
            className="rm-story-submit"
            onClick={handleAddStory}
            disabled={!storyInput.trim()}
          >
            →
          </button>
        </div>
      </section>
    </div>
  );
}
