import { useEffect, useRef, useState } from 'react';
import './ProjectModal.css';

/* ── Check icon SVG ── */
const CheckIcon = () => (
  <svg viewBox="0 0 12 12" aria-hidden="true">
    <polyline points="2,6 5,9 10,3" />
  </svg>
);

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const cls =
    status === 'Live'
      ? 'pm-status--live'
      : status === 'In Progress'
      ? 'pm-status--inprogress'
      : 'pm-status--archived';
  return <span className={`pm-status ${cls}`}>{status}</span>;
};

/* ── Main modal ── */
const ProjectModal = ({ project, onClose }) => {
  const overlayRef = useRef(null);
  const [closing, setClosing] = useState(false);

  /* Animated close helper */
  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 170);
  };

  /* Escape key */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Click outside (on overlay) */
  const onOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose();
  };

  if (!project) return null;

  const {
    name,
    tagline,
    status,
    description,
    techGroups,
    features,
    metrics,
    github,
    demo,
  } = project;

  return (
    <div
      ref={overlayRef}
      className={`pm-overlay${closing ? ' pm-closing' : ''}`}
      onClick={onOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div className="pm-window">
        {/* Ambient glow */}
        <div className="pm-glow-orb" aria-hidden="true" />

        {/* ── Title bar ── */}
        <div className="pm-titlebar">
          <span className="pm-titlebar-label">Project Detail</span>
          <button
            className="pm-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pm-body">

          {/* ── Header ── */}
          <div className="pm-header">
            <div className="pm-header-top">
              <h2 className="pm-title">{name}</h2>
              <StatusBadge status={status} />
            </div>
            <p className="pm-tagline">{tagline}</p>
          </div>

          <div className="pm-divider" />

          {/* ── Overview ── */}
          <div className="pm-section">
            <div className="pm-section-label">Overview</div>
            <div className="pm-description">
              {description.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          <div className="pm-divider" />

          {/* ── Tech Stack ── */}
          <div className="pm-section">
            <div className="pm-section-label">Tech Stack</div>
            <div className="pm-tech-groups">
              {Object.entries(techGroups).map(([group, tags]) => (
                <div className="pm-tech-group" key={group}>
                  <span className="pm-tech-group-label">{group}</span>
                  <div className="pm-tech-tags">
                    {tags.map((tag) => (
                      <span className="pm-tag" key={tag}>
                        <span className="pm-tag-dot" aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pm-divider" />

          {/* ── Key Features ── */}
          <div className="pm-section">
            <div className="pm-section-label">Key Features</div>
            <ul className="pm-features-list">
              {features.map((feat, i) => (
                <li key={i}>
                  <span className="pm-feature-check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          <div className="pm-divider" />

          {/* ── Metrics ── */}
          <div className="pm-section">
            <div className="pm-section-label">Impact &amp; Metrics</div>
            <div className="pm-metrics-grid">
              {metrics.map((m) => (
                <div className="pm-metric-card" key={m.label}>
                  <div className="pm-metric-value">{m.value}</div>
                  <div className="pm-metric-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pm-divider" />

          {/* ── Links ── */}
          <div className="pm-section" style={{ marginBottom: 0 }}>
            <div className="pm-section-label">Links</div>
            <div className="pm-links">
              {github ? (
                <a
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-btn pm-btn-ghost"
                >
                  ↗ GitHub
                </a>
              ) : (
                <span className="pm-btn pm-btn-ghost pm-btn-disabled" title="Private repository">
                  ↗ GitHub (Private)
                </span>
              )}
              {demo ? (
                <a
                  href={demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pm-btn pm-btn-primary"
                >
                  ↗ Live Demo
                </a>
              ) : (
                <span className="pm-btn pm-btn-primary pm-btn-disabled" title="No public demo available">
                  ↗ Live Demo
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
