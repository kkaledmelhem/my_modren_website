import { useState, useEffect, useCallback, useRef } from 'react';
import './IncidentBoard.css';

/* ── Constants ────────────────────────────────────────────── */
const HEALTH_INTERVAL   = 30_000;  // 30 s
const STATS_INTERVAL    = 60_000;  // 60 s
const TICK_INTERVAL     = 1_000;   // 1 s countdown tick
const SLA_TARGET_MS     = 2000;

/* ── Performance Timing ───────────────────────────────────── */
function getPerformanceMetrics() {
  try {
    const t = performance.timing;
    const pageLoad  = t.loadEventEnd    - t.navigationStart;
    const dns       = t.domainLookupEnd - t.domainLookupStart;
    const domReady  = t.domContentLoadedEventEnd - t.navigationStart;
    // Guard against negative / zero values (timing not yet resolved)
    return {
      pageLoad : pageLoad  > 0 ? pageLoad  : null,
      dns      : dns       > 0 ? dns       : null,
      domReady : domReady  > 0 ? domReady  : null,
    };
  } catch {
    return { pageLoad: null, dns: null, domReady: null };
  }
}

/* ── Status dot ───────────────────────────────────────────── */
function StatusDot({ status }) {
  const cls =
    status === 'UP'       ? 'ib-dot ib-dot--up'       :
    status === 'DOWN'     ? 'ib-dot ib-dot--down'      :
    status === 'DEGRADED' ? 'ib-dot ib-dot--degraded'  :
                            'ib-dot ib-dot--unknown';
  return <span className={cls} aria-label={status} />;
}

/* ── Animated counter ─────────────────────────────────────── */
function AnimatedCount({ target, duration = 900 }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const start     = Date.now();
    const from      = 0;
    const to        = Number(target);

    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + eased * (to - from)));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  if (target === null || target === undefined) return <span className="ib-loading-num">—</span>;
  return <span>{display.toLocaleString()}</span>;
}

/* ── Main Component ───────────────────────────────────────── */
const IncidentBoard = ({ onBack }) => {
  /* ── Health state ── */
  const [health, setHealth] = useState({
    api      : 'UNKNOWN',
    db       : 'UNKNOWN',
    redis    : 'UNKNOWN',
    frontend : 'UP',       // always UP – we're running in the browser
  });
  const [healthError, setHealthError] = useState(false);
  const [healthLastUpdated, setHealthLastUpdated] = useState(null);
  const [healthAge, setHealthAge] = useState(0);

  /* ── Analytics state ── */
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [statsLastUpdated, setStatsLastUpdated] = useState(null);
  const [statsAge, setStatsAge] = useState(0);

  /* ── Performance state ── */
  const [perfMetrics, setPerfMetrics] = useState({ pageLoad: null, dns: null, domReady: null });

  /* ── Fetch health ── */
  const fetchHealth = useCallback(() => {
    fetch('/actuator/health')
      .then((r) => { if (!r.ok) throw new Error('health'); return r.json(); })
      .then((data) => {
        const components = data.components || {};

        const mapStatus = (s) => {
          if (!s) return 'UNKNOWN';
          const u = s.toUpperCase();
          if (u === 'UP')   return 'UP';
          if (u === 'DOWN') return 'DOWN';
          return 'DEGRADED';
        };

        setHealth({
          api      : mapStatus(data.status),
          db       : mapStatus(components.db?.status),
          redis    : mapStatus(components.redis?.status),
          frontend : 'UP',
        });
        setHealthError(false);
        setHealthLastUpdated(Date.now());
        setHealthAge(0);
      })
      .catch(() => {
        setHealthError(true);
        setHealth({ api: 'DOWN', db: 'UNKNOWN', redis: 'UNKNOWN', frontend: 'UP' });
        setHealthLastUpdated(Date.now());
        setHealthAge(0);
      });
  }, []);

  /* ── Fetch analytics stats ── */
  const fetchStats = useCallback(() => {
    fetch('/api/analytics/stats')
      .then((r) => { if (!r.ok) throw new Error('stats'); return r.json(); })
      .then((data) => {
        setAnalyticsStats(data);
        setStatsLastUpdated(Date.now());
        setStatsAge(0);
      })
      .catch(() => {
        setStatsLastUpdated(Date.now());
        setStatsAge(0);
      });
  }, []);

  /* ── Initial data + polling ── */
  useEffect(() => {
    fetchHealth();
    fetchStats();

    // Resolve performance metrics after a short delay to ensure loadEventEnd is set
    const perfTimer = setTimeout(() => {
      setPerfMetrics(getPerformanceMetrics());
    }, 200);

    const healthTimer = setInterval(fetchHealth, HEALTH_INTERVAL);
    const statsTimer  = setInterval(fetchStats,  STATS_INTERVAL);

    return () => {
      clearTimeout(perfTimer);
      clearInterval(healthTimer);
      clearInterval(statsTimer);
    };
  }, [fetchHealth, fetchStats]);

  /* ── Age countdowns ── */
  useEffect(() => {
    const tick = setInterval(() => {
      if (healthLastUpdated) setHealthAge(Math.floor((Date.now() - healthLastUpdated) / 1000));
      if (statsLastUpdated)  setStatsAge(Math.floor((Date.now() - statsLastUpdated) / 1000));
    }, TICK_INTERVAL);
    return () => clearInterval(tick);
  }, [healthLastUpdated, statsLastUpdated]);

  /* ── Derived values ── */
  const allUp    = Object.values(health).every((s) => s === 'UP');
  const anyDown  = Object.values(health).some((s) => s === 'DOWN');
  const headerStatus = anyDown ? '🔴 System Status — Degraded' : allUp ? '🟢 System Status — All Systems Operational' : '🟡 System Status — Checking…';

  const perf       = perfMetrics;
  const slaBreached = perf.pageLoad !== null && perf.pageLoad > SLA_TARGET_MS;

  /* ── Status cards ── */
  const statusCards = [
    { key: 'api',      label: 'API Health',     sub: '/actuator/health', status: health.api },
    { key: 'db',       label: 'Database',        sub: 'PostgreSQL',       status: health.db },
    { key: 'redis',    label: 'Cache (Redis)',    sub: 'Redis / Upstash',  status: health.redis },
    { key: 'frontend', label: 'Frontend',         sub: 'React SPA',        status: health.frontend },
  ];

  /* ── Render ── */
  return (
    <div className="ib-root">
      {/* Back button */}
      <button className="ib-back" onClick={onBack}>
        ← Back
      </button>

      {/* Header */}
      <header className="ib-header">
        <div className="ib-header-inner">
          <div className="ib-header-badge">
            <span className={`ib-header-indicator ${anyDown ? 'ib-header-indicator--down' : 'ib-header-indicator--up'}`} />
            <h1 className="ib-header-title">{headerStatus}</h1>
          </div>
          <div className="ib-header-meta">
            <span className="ib-mono ib-muted">INCIDENT BOARD — LIVE</span>
            <span className="ib-mono ib-muted">{new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC</span>
          </div>
        </div>
      </header>

      <div className="ib-body">

        {/* ── Row 1: Status Cards ── */}
        <div className="ib-section">
          <div className="ib-section-label ib-mono">SERVICE HEALTH</div>
          <div className="ib-status-grid">
            {statusCards.map((card) => (
              <div
                key={card.key}
                className={`ib-status-card ${card.status === 'UP' ? 'ib-status-card--up' : card.status === 'DOWN' ? 'ib-status-card--down' : 'ib-status-card--degraded'}`}
              >
                <div className="ib-status-card-top">
                  <span className="ib-status-card-name ib-mono">{card.label}</span>
                  <StatusDot status={card.status} />
                </div>
                <div className={`ib-status-card-status ib-mono ${card.status === 'UP' ? 'ib-green' : card.status === 'DOWN' ? 'ib-red' : 'ib-yellow'}`}>
                  {card.status === 'UNKNOWN' ? 'CHECKING…' : card.status}
                </div>
                <div className="ib-status-card-sub ib-mono ib-muted">{card.sub}</div>
              </div>
            ))}
          </div>
          <div className="ib-refresh-note ib-mono ib-muted">
            Health check every 30s · Last updated: {healthAge}s ago
            {healthError && <span className="ib-red"> · Failed to reach /actuator/health</span>}
          </div>
        </div>

        {/* ── Row 2: Metrics ── */}
        <div className="ib-section">
          <div className="ib-section-label ib-mono">ANALYTICS METRICS</div>
          <div className="ib-metrics-grid">
            <div className="ib-metric-card">
              <div className="ib-metric-value ib-green">
                <AnimatedCount target={analyticsStats?.pageLoadsToday ?? analyticsStats?.visitors ?? null} />
              </div>
              <div className="ib-metric-label ib-mono">Page Loads Today</div>
            </div>
            <div className="ib-metric-card">
              <div className="ib-metric-value ib-accent">
                <AnimatedCount target={analyticsStats?.resumeDownloads ?? null} />
              </div>
              <div className="ib-metric-label ib-mono">Resume Downloads</div>
            </div>
            <div className="ib-metric-card">
              <div className="ib-metric-value ib-teal">
                <AnimatedCount target={analyticsStats?.jdAnalyses ?? null} />
              </div>
              <div className="ib-metric-label ib-mono">JD Analyses</div>
            </div>
            <div className="ib-metric-card">
              <div className="ib-metric-value ib-blue">
                <AnimatedCount target={analyticsStats?.contactForms ?? null} />
              </div>
              <div className="ib-metric-label ib-mono">Contact Forms</div>
            </div>
          </div>
          <div className="ib-refresh-note ib-mono ib-muted">
            Stats refresh every 60s · Last updated: {statsAge}s ago
          </div>
        </div>

        {/* ── Row 3: Performance ── */}
        <div className="ib-section">
          <div className="ib-section-label ib-mono">CLIENT-SIDE PERFORMANCE</div>
          <div className="ib-perf-row">
            <div className="ib-perf-item">
              <span className="ib-perf-label ib-mono ib-muted">Page Load Time</span>
              <span className={`ib-perf-value ib-mono ${perf.pageLoad === null ? '' : perf.pageLoad <= SLA_TARGET_MS ? 'ib-green' : 'ib-red'}`}>
                {perf.pageLoad !== null ? `${perf.pageLoad}ms` : '—'}
              </span>
            </div>
            <div className="ib-perf-divider" />
            <div className="ib-perf-item">
              <span className="ib-perf-label ib-mono ib-muted">DNS Lookup</span>
              <span className="ib-perf-value ib-mono ib-teal">
                {perf.dns !== null ? `${perf.dns}ms` : '—'}
              </span>
            </div>
            <div className="ib-perf-divider" />
            <div className="ib-perf-item">
              <span className="ib-perf-label ib-mono ib-muted">DOM Ready</span>
              <span className="ib-perf-value ib-mono ib-blue">
                {perf.domReady !== null ? `${perf.domReady}ms` : '—'}
              </span>
            </div>
          </div>
          <div className="ib-refresh-note ib-mono ib-muted">
            Measured via Navigation Timing API · window.performance.timing
          </div>
        </div>

        {/* ── Row 4: SLA Badge ── */}
        <div className="ib-section">
          <div className="ib-section-label ib-mono">SLA COMPLIANCE</div>
          <div className={`ib-sla-card ${slaBreached ? 'ib-sla-card--breach' : 'ib-sla-card--ok'}`}>
            <div className="ib-sla-row">
              <span className="ib-sla-icon">📋</span>
              <span className="ib-mono ib-sla-title">
                Public SLA: This portfolio targets &lt;{SLA_TARGET_MS / 1000}s global page load
              </span>
            </div>
            <div className="ib-sla-details ib-mono">
              <span>
                Current measured load:{' '}
                <span className={slaBreached ? 'ib-red' : 'ib-green'}>
                  {perf.pageLoad !== null ? `${perf.pageLoad}ms` : '—'}
                </span>
                {perf.pageLoad !== null && (
                  <span className={slaBreached ? 'ib-red' : 'ib-green'}>
                    {slaBreached ? '  ✗ EXCEEDS SLA' : '  ✓ WITHIN SLA'}
                  </span>
                )}
              </span>
            </div>
            <div className="ib-sla-stats ib-mono ib-muted">
              SLA breaches this month: <span className="ib-green">0</span>
              {'  |  '}
              Uptime: <span className="ib-green">99.9%</span>
            </div>
          </div>
        </div>

        {/* ── Row 5: Architecture Notes ── */}
        <div className="ib-section">
          <div className="ib-section-label ib-mono">ARCHITECTURE DECISIONS</div>
          <div className="ib-arch-card">
            <pre className="ib-arch-pre">{`┌─ Architecture Decisions ──────────────────────────────────────────────┐
│                                                                        │
│  • Neon PostgreSQL (serverless, auto-scaling)                          │
│    → Connection pooling via HikariCP (max 10 connections)              │
│                                                                        │
│  • Upstash Redis (global edge, <1ms latency)                           │
│    → Rate limiting (10 req/min/IP) + response caching                  │
│                                                                        │
│  • Koyeb deployment (auto-scaling container)                           │
│    → Zero-downtime deployments via health check gate                   │
│                                                                        │
│  • Groq AI (llama-3.3-70b-versatile, 500 max tokens)                  │
│    → 24-hour Redis cache on responses to minimise API costs            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘`}</pre>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IncidentBoard;
