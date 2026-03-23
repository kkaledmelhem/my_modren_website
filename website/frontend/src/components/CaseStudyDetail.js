import { useEffect } from 'react';
import { useApp } from '../App';

const CaseStudyDetail = ({ study, onBack }) => {
  const { t } = useApp();
  const cs = t.caseStudies;

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const renderSection = (section, index) => {
    if (section.type === 'code') {
      return (
        <div key={index} className="bp-code-block">
          {section.lang && <div className="bp-code-lang">{section.lang}</div>}
          <pre className="bp-code-body"><code>{section.text}</code></pre>
        </div>
      );
    }
    return (
      <div key={index} className="cs-detail-section">
        {section.heading && <h2 className="cs-detail-h2">{section.heading}</h2>}
        {section.body    && <p  className="cs-detail-p">{section.body}</p>}
      </div>
    );
  };

  return (
    <>
      <button className="bp-back" onClick={onBack}>
        <span>←</span>
        <span>{cs.backBtn}</span>
      </button>

      <section id="case-study-detail" className="cs-detail-wrap">
        <div className="container">

          <header className="cs-detail-header">
            <div className="cs-detail-tags">
              <span className="cs-tag">{study.tag}</span>
              <span className="cs-duration">{study.duration}</span>
            </div>
            <h1 className="cs-detail-h1">{study.title}</h1>
            <p className="cs-detail-subtitle">{study.subtitle}</p>
            <div className="cs-detail-meta-row">
              <div className="cs-detail-meta-item">
                <span className="cs-detail-meta-label">{cs.roleLabel}</span>
                <span className="cs-detail-meta-val">{study.role}</span>
              </div>
              <div className="cs-detail-meta-item">
                <span className="cs-detail-meta-label">{cs.teamLabel}</span>
                <span className="cs-detail-meta-val">{study.team}</span>
              </div>
              <div className="cs-detail-meta-item">
                <span className="cs-detail-meta-label">{cs.durationLabel}</span>
                <span className="cs-detail-meta-val">{study.duration}</span>
              </div>
            </div>
          </header>

          <div className="cs-detail-metrics-bar">
            {study.metrics.map((m) => (
              <div key={m.label} className="cs-detail-metric">
                <span className="cs-detail-metric-value">{m.value}</span>
                <span className="cs-detail-metric-label">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="bp-divider" />

          <div className="cs-detail-overview">
            <p className="cs-detail-p">{study.overview}</p>
          </div>

          <div className="cs-detail-tech-row">
            {study.tech.map((tech) => (
              <span key={tech} className="cs-tech-tag">{tech}</span>
            ))}
          </div>

          <div className="bp-divider" />

          <article className="cs-detail-body">
            {study.sections.map((section, index) => renderSection(section, index))}
          </article>

          <div className="bp-bottom">
            <button className="btn-ghost" onClick={onBack}>← {cs.backBtn}</button>
          </div>

        </div>
      </section>
    </>
  );
};

export default CaseStudyDetail;
