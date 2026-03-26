import { useState, useEffect, useCallback } from 'react';
import './FuturesMarket.css';

/* ── Constants ──────────────────────────────────────────────── */
const STORAGE_KEY  = 'km-futures-voted';
const NOTIFY_KEY   = 'km-futures-notify';

/* ── Seed data — makes the market look active ─────────────────
   These are the "prior" votes already in the system.
   User's vote adds 1 on top.
─────────────────────────────────────────────────────────────── */
const SEED_VOTES = {
  companyType: { enterprise: 847, scaleup: 1123, startup: 521 },
  country:     { germany: 1290, netherlands: 698, sweden: 501 },
  role:        { ic: 945, lead: 1198, staff: 351 },
};

/* ── Market definitions ─────────────────────────────────────── */
const MARKETS = [
  {
    id: 'companyType',
    question: 'Where will Khaled land?',
    ticker: 'KM-CO',
    options: [
      { key: 'enterprise',  label: 'Enterprise (500+)', emoji: '🏢', baseOdds: 2.1 },
      { key: 'scaleup',     label: 'Scale-up (50–200)', emoji: '🚀', baseOdds: 1.8 },
      { key: 'startup',     label: 'Startup (<50)',      emoji: '🌱', baseOdds: 3.2 },
    ],
  },
  {
    id: 'country',
    question: 'Which country?',
    ticker: 'KM-GEO',
    options: [
      { key: 'germany',     label: 'Germany',      emoji: '🇩🇪', baseOdds: 1.6 },
      { key: 'netherlands', label: 'Netherlands',  emoji: '🇳🇱', baseOdds: 2.8 },
      { key: 'sweden',      label: 'Sweden',       emoji: '🇸🇪', baseOdds: 3.5 },
    ],
  },
  {
    id: 'role',
    question: 'Role type?',
    ticker: 'KM-ROLE',
    options: [
      { key: 'ic',    label: 'IC (Senior Eng)', emoji: '👨‍💻', baseOdds: 2.2 },
      { key: 'lead',  label: 'Team Lead',       emoji: '🎯', baseOdds: 1.7 },
      { key: 'staff', label: 'Staff Engineer',  emoji: '🏗️', baseOdds: 4.1 },
    ],
  },
];

/* ── Commentary templates ───────────────────────────────────── */
const COMMENTARY_TEMPLATES = {
  enterprise_germany_ic:
    'Enterprise demand for structured Java architects meets relocation intent. Market prices in a high-conviction play.',
  enterprise_germany_lead:
    'The combination of German enterprise + team lead mirrors his Robochat trajectory. Strong consensus build.',
  enterprise_germany_staff:
    'Contrarian bet. High risk, high reward — market assigns thin probability here.',
  enterprise_netherlands_ic:
    'Netherlands enterprise sector is underrated. Tech hubs in Amsterdam and Eindhoven driving this line.',
  enterprise_netherlands_lead:
    'Moderate consensus. Dutch enterprise prefers internal promotions, but external senior hires are rising.',
  enterprise_netherlands_staff:
    'Low probability outcome. Market sees this as a multi-year path, not immediate.',
  enterprise_sweden_ic:
    'Swedish enterprise (Spotify, Klarna, Ericsson) runs strong IC tracks. Plausible.',
  enterprise_sweden_lead:
    'Interesting signal — Swedish leadership culture aligns with his background, but liquidity is thin.',
  enterprise_sweden_staff:
    'Very contrarian. Market does not price this in at all.',
  scaleup_germany_ic:
    'Scale-up IC in Germany is the market consensus. His backend depth and AI work map perfectly to Berlin-stage companies.',
  scaleup_germany_lead:
    'Smart money: his Robochat team leadership experience + EU relocation intent makes Germany / Team Lead the consensus play.',
  scaleup_germany_staff:
    'Interesting long — scale-ups rarely hire direct-to-staff but his breadth could flip that.',
  scaleup_netherlands_ic:
    'Amsterdam / Rotterdam scale-up scene is hot. Solid probability on this book.',
  scaleup_netherlands_lead:
    'Dutch scale-ups love player-coaches. Strong signal from his Robotack lead tenure.',
  scaleup_netherlands_staff:
    'Low float. Market is pricing 3–4 year horizon for this outcome.',
  scaleup_sweden_ic:
    'Sweden scale-up IC is a quiet dark horse. Klarna-tier companies are aggressively hiring.',
  scaleup_sweden_lead:
    'Emerging position. Swedish engineering culture values pragmatism — a match.',
  scaleup_sweden_staff:
    'Very long odds. Thin market, few precedents.',
  startup_germany_ic:
    'Berlin startup scene remains the most likely EU destination for early-career leaders pivoting to IC depth.',
  startup_germany_lead:
    'Early-stage CTO / Tech Lead reads possible. High upside, illiquid market.',
  startup_germany_staff:
    'Startup staff engineer is an unusual title. Market is skeptical.',
  startup_netherlands_ic:
    'Netherlands startup ecosystem is lean but growing. Reasonable flier.',
  startup_netherlands_lead:
    'CTO-track bet at a Dutch early-stage. Fits the profile. Thin but non-trivial.',
  startup_netherlands_staff:
    'Nobody is pricing this. Dark pool only.',
  startup_sweden_ic:
    'Sweden startup density is rising. Stockholm seed ecosystem is undervalued by the market.',
  startup_sweden_lead:
    'First-time engineering lead at a Swedish seed stage. Wild card position.',
  startup_sweden_staff:
    'De minimis. Carry cost exceeds expected return.',
};

function getCommentaryKey(votes) {
  if (!votes) return null;
  return `${votes.companyType}_${votes.country}_${votes.role}`;
}

function getLeadingOption(marketId, currentVotes) {
  const seedMarket = SEED_VOTES[marketId];
  const extra      = currentVotes?.[marketId];
  let best = null, bestCount = -1;
  for (const [key, count] of Object.entries(seedMarket)) {
    const total = count + (extra === key ? 1 : 0);
    if (total > bestCount) { bestCount = total; best = key; }
  }
  return best;
}

/* ── Percentage calculation ─────────────────────────────────── */
function calcPcts(marketId, userVoteForMarket) {
  const seed  = SEED_VOTES[marketId];
  const totals = {};
  let grand = 0;
  for (const [key, count] of Object.entries(seed)) {
    const v    = count + (userVoteForMarket === key ? 1 : 0);
    totals[key] = v;
    grand += v;
  }
  const pcts = {};
  for (const [key, v] of Object.entries(totals)) {
    pcts[key] = grand > 0 ? Math.round((v / grand) * 100) : 0;
  }
  return pcts;
}

/* ── Bar component ──────────────────────────────────────────── */
function VoteBar({ pct, isLeading, isVoted, animate }) {
  return (
    <div className="fm-bar-track" aria-label={`${pct}%`}>
      <div
        className={`fm-bar-fill ${isLeading ? 'fm-bar-fill--leading' : ''} ${isVoted ? 'fm-bar-fill--voted' : ''} ${animate ? 'fm-bar-fill--animate' : ''}`}
        style={{ '--bar-pct': `${pct}%` }}
      />
    </div>
  );
}

/* ── Market Card ──────────────────────────────────────────────── */
function MarketCard({ market, userVotes, onVote, hasVotedAll }) {
  const voted    = userVotes?.[market.id] ?? null;
  const didVote  = voted !== null;
  const pcts     = calcPcts(market.id, voted);
  const leader   = getLeadingOption(market.id, userVotes);

  const totalVotes = Object.values(SEED_VOTES[market.id]).reduce((a, b) => a + b, 0) + (didVote ? 1 : 0);

  return (
    <div className={`fm-market-card ${didVote ? 'fm-market-card--voted' : ''}`}>
      {/* Card header */}
      <div className="fm-card-header">
        <div className="fm-card-header-left">
          <span className="fm-ticker fm-mono">{market.ticker}</span>
          <h3 className="fm-card-question">{market.question}</h3>
        </div>
        <div className="fm-card-vol fm-mono">
          <span className="fm-muted">VOL</span>{' '}
          <span className="fm-green">{totalVotes.toLocaleString()}</span>
        </div>
      </div>

      {/* Options */}
      <div className="fm-options">
        {market.options.map((opt) => {
          const pct       = pcts[opt.key] ?? 0;
          const isLeading = opt.key === leader;
          const isVoted   = voted === opt.key;

          return (
            <div
              key={opt.key}
              className={`fm-option ${isLeading ? 'fm-option--leading' : ''} ${isVoted ? 'fm-option--voted' : ''} ${didVote ? 'fm-option--post-vote' : ''}`}
              onClick={() => !didVote && onVote(market.id, opt.key)}
              role={didVote ? undefined : 'button'}
              tabIndex={didVote ? undefined : 0}
              onKeyDown={didVote ? undefined : (e) => e.key === 'Enter' && onVote(market.id, opt.key)}
              aria-label={`Vote for ${opt.label}`}
            >
              <div className="fm-option-row">
                <span className="fm-option-emoji">{opt.emoji}</span>
                <span className="fm-option-label">{opt.label}</span>

                <div className="fm-option-right">
                  {didVote ? (
                    <span className={`fm-pct fm-mono ${isLeading ? 'fm-green' : 'fm-muted'}`}>
                      {pct}%
                    </span>
                  ) : (
                    <span className="fm-odds fm-mono">{opt.baseOdds}x</span>
                  )}
                  {isLeading && didVote && (
                    <span className="fm-leading-badge fm-mono">LEADING</span>
                  )}
                  {isVoted && (
                    <span className="fm-voted-badge fm-mono">YOUR BET</span>
                  )}
                </div>
              </div>

              {/* Bar — always shown, filled after vote */}
              <VoteBar
                pct={pct}
                isLeading={isLeading}
                isVoted={isVoted}
                animate={didVote}
              />
            </div>
          );
        })}
      </div>

      {!didVote && (
        <div className="fm-vote-prompt fm-mono fm-muted">
          Click an option to place your prediction
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
const FuturesMarket = ({ onBack }) => {
  /* ── State ── */
  const [userVotes, setUserVotes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [notifyEmail, setNotifyEmail]   = useState('');
  const [notifyStored, setNotifyStored] = useState(() => !!localStorage.getItem(NOTIFY_KEY));
  const [notifyMsg, setNotifyMsg]       = useState('');
  const [ticker, setTicker]             = useState(0);

  /* ── Ticker animation ── */
  useEffect(() => {
    const t = setInterval(() => setTicker((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  /* ── Vote handler ── */
  const handleVote = useCallback((marketId, optionKey) => {
    setUserVotes((prev) => {
      if (prev[marketId]) return prev; // already voted this market
      const next = { ...prev, [marketId]: optionKey };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    // XP event
    window.dispatchEvent(new CustomEvent('km-xp', { detail: { amount: 30, reason: 'futures-vote' } }));
  }, []);

  /* ── Notify handler ── */
  const handleNotify = (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    try { localStorage.setItem(NOTIFY_KEY, notifyEmail.trim()); } catch {}
    setNotifyStored(true);
    setNotifyMsg('Saved locally — no data sent to any server.');
    setNotifyEmail('');
  };

  /* ── Derived ── */
  const votedCount = Object.keys(userVotes).length;
  const hasVotedAll = votedCount === MARKETS.length;

  // Commentary
  const commentaryKey = getCommentaryKey(hasVotedAll ? userVotes : null);
  const commentary    = commentaryKey ? COMMENTARY_TEMPLATES[commentaryKey] : null;

  // Summary labels
  const summaryParts = MARKETS.map((m) => {
    const voted = userVotes[m.id];
    if (!voted) return null;
    const opt = m.options.find((o) => o.key === voted);
    return opt ? `${opt.emoji} ${opt.label}` : null;
  }).filter(Boolean);

  // Simulated weekly predictors (static, looks live)
  const weeklyPredictors = 87 + (ticker % 3);

  /* ── Render ── */
  return (
    <div className="fm-root">
      {/* Back button */}
      <button className="fm-back" onClick={onBack}>
        ← Back
      </button>

      {/* Header */}
      <header className="fm-header">
        <div className="fm-header-inner">
          <div className="fm-header-left">
            <div className="fm-header-badge fm-mono">
              <span className="fm-live-dot" />
              LIVE MARKET
            </div>
            <h1 className="fm-header-title">Hire Me Futures Market</h1>
            <p className="fm-header-sub">
              Trade predictions on Khaled's next role. Consensus drives the odds.
            </p>
          </div>
          <div className="fm-header-right fm-mono">
            <div className="fm-ticker-strip">
              <span className="fm-green">KM-CO ▲ 0.4%</span>
              <span className="fm-muted"> · </span>
              <span className="fm-green">KM-GEO ▲ 1.1%</span>
              <span className="fm-muted"> · </span>
              <span className="fm-red">KM-ROLE ▼ 0.2%</span>
            </div>
            <div className="fm-header-vol fm-muted">
              Total predictions:{' '}
              <span className="fm-green">
                {(
                  Object.values(SEED_VOTES.companyType).reduce((a, b) => a + b, 0) +
                  Object.values(SEED_VOTES.country).reduce((a, b) => a + b, 0) +
                  Object.values(SEED_VOTES.role).reduce((a, b) => a + b, 0) +
                  votedCount
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="fm-body">

        {/* ── User summary banner (after all votes) ── */}
        {hasVotedAll && summaryParts.length === 3 && (
          <div className="fm-summary-banner">
            <span className="fm-summary-icon">✓</span>
            <span className="fm-mono fm-summary-text">
              You voted: {summaryParts[0]} in {summaryParts[1]} as {summaryParts[2]}
            </span>
          </div>
        )}

        {/* ── Markets ── */}
        <div className="fm-markets">
          {MARKETS.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              userVotes={userVotes}
              onVote={handleVote}
              hasVotedAll={hasVotedAll}
            />
          ))}
        </div>

        {/* ── Market Analysis ── */}
        <div className="fm-analysis-card">
          <div className="fm-analysis-header fm-mono">
            <span className="fm-green">📊 Market Analysis</span>
            <span className="fm-muted fm-analysis-time">— Updated just now</span>
          </div>

          {commentary ? (
            <p className="fm-analysis-body">
              {commentary}
            </p>
          ) : (
            <p className="fm-analysis-body">
              {(() => {
                const leadCo      = getLeadingOption('companyType', userVotes);
                const leadGeo     = getLeadingOption('country', userVotes);
                const leadRole    = getLeadingOption('role', userVotes);
                const coOpt   = MARKETS[0].options.find((o) => o.key === leadCo);
                const geoOpt  = MARKETS[1].options.find((o) => o.key === leadGeo);
                const roleOpt = MARKETS[2].options.find((o) => o.key === leadRole);
                return `The market strongly favours a ${coOpt?.label ?? '—'} in ${geoOpt?.label ?? '—'} as ${roleOpt?.label ?? '—'}. Smart money: his Robochat team leadership experience + EU relocation intent makes the ${geoOpt?.label ?? '—'} / ${roleOpt?.label ?? '—'} combination the consensus play.`;
              })()}
            </p>
          )}

          <div className="fm-analysis-stats fm-mono fm-muted">
            <span className="fm-green">{weeklyPredictors}</span> engineers have placed predictions this week.
            {!hasVotedAll && (
              <span> Cast your {3 - votedCount} remaining prediction{3 - votedCount !== 1 ? 's' : ''} above to unlock personalised commentary.</span>
            )}
          </div>
        </div>

        {/* ── Resolution section ── */}
        <div className="fm-resolve-card">
          <div className="fm-resolve-header fm-mono">
            <span className="fm-yellow">⏳ Market Resolution</span>
          </div>
          <p className="fm-resolve-body">
            These markets will resolve when Khaled announces his next role. Subscribe to be notified the moment the market closes.
          </p>

          {notifyStored ? (
            <div className="fm-notify-stored fm-mono">
              <span className="fm-green">✓ Registered</span>
              {notifyMsg && <span className="fm-muted fm-notify-note"> — {notifyMsg}</span>}
            </div>
          ) : (
            <form className="fm-notify-form" onSubmit={handleNotify}>
              <input
                type="email"
                className="fm-notify-input fm-mono"
                placeholder="engineer@company.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                aria-label="Email address for market resolution notification"
                required
              />
              <button type="submit" className="fm-notify-btn fm-mono">
                Notify Me
              </button>
            </form>
          )}

          <p className="fm-resolve-note fm-mono fm-muted">
            Note: email stored locally in your browser only. No data is sent to any server.
          </p>
        </div>

        {/* ── Disclaimer ── */}
        <div className="fm-disclaimer fm-mono fm-muted">
          This is a creative portfolio feature. Markets are not real financial instruments.
          All data is stored locally in your browser and seeded for display purposes.
          Predictions are anonymous and aggregate.
        </div>

      </div>
    </div>
  );
};

export default FuturesMarket;
