import { useApp } from '../App';
import caseStudies from '../data/caseStudies';

const CaseStudies = ({ onStudyClick }) => {
  const { t } = useApp();
  const cs = t.caseStudies;

  return (
    <section id="case-studies" className="cs-section">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{cs.section}</div>
          <h2>{cs.title}</h2>
          <p className="section-sub reveal">{cs.sub}</p>
        </div>

        <div className="cs-grid">
          {caseStudies.map((study, i) => (
            <article
              key={study.id}
              className={`cs-card reveal${i === 0 ? ' cs-card--featured' : ''}`}
              data-delay={i * 100}
              onClick={() => onStudyClick(study.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onStudyClick(study.id)}
            >
              <div className="cs-card-top">
                <span className="cs-tag">{study.tag}</span>
                <span className="cs-duration">{study.duration}</span>
              </div>

              <h3 className="cs-card-title">{study.title}</h3>
              <p className="cs-card-subtitle">{study.subtitle}</p>

              <div className="cs-metrics">
                {study.metrics.map((m) => (
                  <div key={m.label} className="cs-metric">
                    <span className="cs-metric-value">{m.value}</span>
                    <span className="cs-metric-label">{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="cs-tech-row">
                {study.tech.slice(0, 5).map((tech) => (
                  <span key={tech} className="cs-tech-tag">{tech}</span>
                ))}
                {study.tech.length > 5 && (
                  <span className="cs-tech-tag cs-tech-more">+{study.tech.length - 5}</span>
                )}
              </div>

              <div className="cs-card-footer">
                <div className="cs-meta">
                  <span>{study.role}</span>
                  <span className="cs-meta-sep">·</span>
                  <span>{study.team}</span>
                </div>
                <button
                  className="cs-read-btn"
                  onClick={(e) => { e.stopPropagation(); onStudyClick(study.id); }}
                  tabIndex={-1}
                >
                  {cs.readBtn} →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
