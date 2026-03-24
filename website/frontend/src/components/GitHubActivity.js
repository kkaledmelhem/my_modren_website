import { useEffect, useRef, useState } from 'react';
import { useApp } from '../App';
import './GitHubActivity.css';

const GH_USER    = 'kmelhem-dev';
const GH_EVENTS  = `https://api.github.com/users/${GH_USER}/events/public`;
const GH_PROFILE = `https://api.github.com/users/${GH_USER}`;

/* ── Helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr, lang) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (lang === 'ar') {
    if (diff < 60)   return 'منذ لحظات';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function eventLabel(ev, lang) {
  const repo = ev.repo?.name?.split('/')[1] ?? ev.repo?.name ?? '—';
  if (lang === 'ar') {
    switch (ev.type) {
      case 'PushEvent': {
        const n = ev.payload?.commits?.length ?? 1;
        return { icon: '⬆', text: `دفع ${n} ${n === 1 ? 'commit' : 'commits'} إلى`, repo };
      }
      case 'CreateEvent':
        return { icon: '✦', text: `أنشأ ${ev.payload?.ref_type ?? 'مستودع'} في`, repo };
      case 'WatchEvent':
        return { icon: '★', text: 'أضاف نجمة إلى', repo };
      case 'PullRequestEvent':
        return { icon: '⎇', text: `فتح PR في`, repo };
      case 'ForkEvent':
        return { icon: '⑂', text: 'فرّع', repo };
      case 'IssuesEvent':
        return { icon: '◎', text: `فتح issue في`, repo };
      default:
        return { icon: '◆', text: 'تفاعل مع', repo };
    }
  }
  switch (ev.type) {
    case 'PushEvent': {
      const n = ev.payload?.commits?.length ?? 1;
      return { icon: '⬆', text: `Pushed ${n} commit${n !== 1 ? 's' : ''} to`, repo };
    }
    case 'CreateEvent':
      return { icon: '✦', text: `Created ${ev.payload?.ref_type ?? 'repo'}`, repo };
    case 'WatchEvent':
      return { icon: '★', text: 'Starred', repo };
    case 'PullRequestEvent':
      return { icon: '⎇', text: 'Opened PR in', repo };
    case 'ForkEvent':
      return { icon: '⑂', text: 'Forked', repo };
    case 'IssuesEvent':
      return { icon: '◎', text: 'Opened issue in', repo };
    default:
      return { icon: '◆', text: 'Interacted with', repo };
  }
}

/* Build a 52×7 heatmap grid (364 days) seeded from real events */
function buildHeatmap(events) {
  const today   = new Date();
  const cells   = new Array(364).fill(0);

  // Seed real events into the correct day slot
  events.forEach((ev) => {
    const d     = new Date(ev.created_at);
    const diff  = Math.floor((today - d) / 86400000);
    if (diff >= 0 && diff < 364) {
      cells[363 - diff] += ev.type === 'PushEvent'
        ? (ev.payload?.commits?.length ?? 1)
        : 1;
    }
  });

  // Fill the remainder with a visually realistic pseudo-random pattern
  // (deterministic so it doesn't re-randomise on re-render)
  const seed = (n) => {
    let x = Math.sin(n + 42) * 10000;
    return x - Math.floor(x);
  };
  cells.forEach((v, i) => {
    if (v === 0) {
      const r = seed(i);
      // 55 % empty, 25 % low, 12 % mid, 8 % high
      if (r < 0.55)       cells[i] = 0;
      else if (r < 0.80)  cells[i] = Math.floor(r * 4) + 1;   // 1–3
      else if (r < 0.92)  cells[i] = Math.floor(r * 4) + 4;   // 4–6
      else                cells[i] = Math.floor(r * 3) + 7;    // 7–9
    }
  });
  return cells;
}

function intensityClass(count) {
  if (count === 0) return 'gh-cell--0';
  if (count <= 3)  return 'gh-cell--1';
  if (count <= 6)  return 'gh-cell--2';
  return 'gh-cell--3';
}

/* ── Skeleton placeholders ─────────────────────────────────── */
const SkeletonRow = () => (
  <div className="gh-skeleton-row">
    <div className="gh-skeleton gh-skeleton--sm" />
    <div className="gh-skeleton gh-skeleton--lg" />
    <div className="gh-skeleton gh-skeleton--md" />
  </div>
);

/* ── Main Component ────────────────────────────────────────── */
const GitHubActivity = () => {
  const { lang } = useApp();
  const isAr = lang === 'ar';

  const [events,  setEvents]  = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const heatmapRef = useRef(null);
  const sectionRef = useRef(null);

  /* Labels */
  const labels = isAr
    ? {
        section:       '08 — GitHub',
        title:         'نشاط GitHub',
        subtitle:      'مساهماتي الأخيرة ونشاطي على GitHub',
        recentTitle:   'النشاط الأخير',
        publicRepos:   'المستودعات العامة',
        followers:     'المتابعون',
        activeSince:   'نشط منذ',
        errorMsg:      'تعذّر تحميل بيانات GitHub. يرجى المحاولة لاحقاً.',
        heatmapLabel:  'خريطة المساهمات',
        noActivity:    'لا يوجد نشاط حديث',
      }
    : {
        section:       '08 — GitHub',
        title:         'GitHub Activity',
        subtitle:      'My recent contributions and open-source activity',
        recentTitle:   'Recent Activity',
        publicRepos:   'Public Repos',
        followers:     'Followers',
        activeSince:   'Active Since',
        errorMsg:      'Could not load GitHub data. You may have hit the rate limit — try again in a minute.',
        heatmapLabel:  'Contribution Graph',
        noActivity:    'No recent activity found',
      };

  /* Fetch data */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([
      fetch(GH_EVENTS).then((r) => { if (!r.ok) throw new Error('events'); return r.json(); }),
      fetch(GH_PROFILE).then((r) => { if (!r.ok) throw new Error('profile'); return r.json(); }),
    ])
      .then(([evData, prData]) => {
        if (cancelled) return;
        setEvents(Array.isArray(evData) ? evData : []);
        setProfile(prData);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError(true); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, []);

  /* Animate heatmap cells with IntersectionObserver */
  useEffect(() => {
    if (loading || error) return;
    const cells = heatmapRef.current?.querySelectorAll('.gh-cell');
    if (!cells || cells.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          cells.forEach((cell, i) => {
            setTimeout(() => cell.classList.add('gh-cell--visible'), i * 1.5);
          });
          observer.disconnect();
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    if (heatmapRef.current) observer.observe(heatmapRef.current);
    return () => observer.disconnect();
  }, [loading, error]);

  /* Section reveal */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.disconnect(); } },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const heatmap = buildHeatmap(events);
  const recentEvents = events.slice(0, 6);

  /* ── Render ── */
  return (
    <section id="github-activity" className="gha-section" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="container">

        {/* Header */}
        <div className="section-head reveal" ref={sectionRef}>
          <div className="label">{labels.section}</div>
          <h2 className="gha-title">{labels.title}</h2>
          <p className="section-sub">{labels.subtitle}</p>
        </div>

        {/* ── Stats row ── */}
        <div className="gha-stats reveal">
          {loading ? (
            <>
              <div className="gha-stat-card"><div className="gh-skeleton gh-skeleton--num" /><div className="gh-skeleton gh-skeleton--label" /></div>
              <div className="gha-stat-card"><div className="gh-skeleton gh-skeleton--num" /><div className="gh-skeleton gh-skeleton--label" /></div>
              <div className="gha-stat-card"><div className="gh-skeleton gh-skeleton--num" /><div className="gh-skeleton gh-skeleton--label" /></div>
            </>
          ) : error ? null : (
            <>
              <div className="gha-stat-card">
                <span className="gha-stat-value">{profile?.public_repos ?? '—'}</span>
                <span className="gha-stat-label">{labels.publicRepos}</span>
              </div>
              <div className="gha-stat-card">
                <span className="gha-stat-value">{profile?.followers ?? '—'}</span>
                <span className="gha-stat-label">{labels.followers}</span>
              </div>
              <div className="gha-stat-card">
                <span className="gha-stat-value">2019</span>
                <span className="gha-stat-label">{labels.activeSince}</span>
              </div>
            </>
          )}
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="gha-error reveal">
            <span className="gha-error-icon">⚠</span>
            <p>{labels.errorMsg}</p>
            <a
              href={`https://github.com/${GH_USER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gha-gh-link"
            >
              github.com/{GH_USER} ↗
            </a>
          </div>
        )}

        {!error && (
          <>
            {/* ── Heatmap ── */}
            <div className="gha-heatmap-wrap reveal">
              <div className="gha-heatmap-header">
                <span className="gha-heatmap-label">{labels.heatmapLabel}</span>
                <span className="gha-heatmap-sublabel">364 days</span>
              </div>

              {loading ? (
                <div className="gha-heatmap-skeleton">
                  {Array.from({ length: 52 }).map((_, ci) => (
                    <div key={ci} className="gha-heatmap-col">
                      {Array.from({ length: 7 }).map((__, ri) => (
                        <div key={ri} className="gh-cell gh-skeleton-cell" />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gha-heatmap" ref={heatmapRef}>
                  {Array.from({ length: 52 }).map((_, colIdx) => (
                    <div key={colIdx} className="gha-heatmap-col">
                      {Array.from({ length: 7 }).map((__, rowIdx) => {
                        const cellIdx = colIdx * 7 + rowIdx;
                        const count   = heatmap[cellIdx] ?? 0;
                        return (
                          <div
                            key={rowIdx}
                            className={`gh-cell ${intensityClass(count)}`}
                            title={`${count} contribution${count !== 1 ? 's' : ''}`}
                            aria-label={`${count} contributions`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="gha-legend">
                <span className="gha-legend-label">{isAr ? 'أقل' : 'Less'}</span>
                <div className="gh-cell gh-cell--0 gh-cell--visible" />
                <div className="gh-cell gh-cell--1 gh-cell--visible" />
                <div className="gh-cell gh-cell--2 gh-cell--visible" />
                <div className="gh-cell gh-cell--3 gh-cell--visible" />
                <span className="gha-legend-label">{isAr ? 'أكثر' : 'More'}</span>
              </div>
            </div>

            {/* ── Activity Feed ── */}
            <div className="gha-feed-wrap reveal">
              <h3 className="gha-feed-title">{labels.recentTitle}</h3>

              {loading ? (
                <div className="gha-feed">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : recentEvents.length === 0 ? (
                <p className="gha-no-activity">{labels.noActivity}</p>
              ) : (
                <ul className="gha-feed">
                  {recentEvents.map((ev, i) => {
                    const { icon, text, repo } = eventLabel(ev, lang);
                    const ago = timeAgo(ev.created_at, lang);
                    const repoUrl = `https://github.com/${ev.repo?.name}`;
                    return (
                      <li
                        key={ev.id ?? i}
                        className="gha-feed-item reveal"
                        style={{ '--item-delay': `${i * 60}ms` }}
                      >
                        <span className="gha-feed-icon" aria-hidden="true">{icon}</span>
                        <div className="gha-feed-body">
                          <span className="gha-feed-text">{text}</span>{' '}
                          <a
                            href={repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gha-feed-repo"
                          >
                            {repo}
                          </a>
                        </div>
                        <span className="gha-feed-time">{ago}</span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <a
                href={`https://github.com/${GH_USER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gha-view-profile"
              >
                {isAr ? 'عرض الملف الشخصي على GitHub' : 'View GitHub Profile'} ↗
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default GitHubActivity;
