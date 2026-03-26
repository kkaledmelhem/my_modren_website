import { useApp } from '../App';
import { useRef, useState } from 'react';

const TiltCard = ({ children, className, style }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
    el.style.boxShadow = `${-x * 2}px ${y * 2}px 60px rgba(139,124,248,0.28), 0 0 0 1px rgba(139,124,248,0.18)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
  };

  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
};

const FeaturedCard = ({ proj }) => {
  return (
    <TiltCard className="proj-featured reveal">
      {/* Ambient glow orb */}
      <div className="proj-featured-glow" />

      {/* Badge */}
      <div className="proj-featured-badge">✦ FEATURED</div>

      <div className="proj-featured-inner">
        {/* Monospace tag label */}
        <div className="project-tag-mono">{proj.tag}</div>

        {/* Title */}
        <h3 className="proj-featured-name">{proj.name}</h3>

        {/* Description */}
        <p className="project-desc">{proj.desc}</p>

        {/* Metric strip */}
        <div className="proj-metrics">
          <span>10K+ daily interactions</span>
          <span className="proj-metrics-dot">·</span>
          <span>4 engineers led</span>
          <span className="proj-metrics-dot">·</span>
          <span>2 platforms</span>
        </div>

        {/* Tech tags */}
        <div className="project-tech">
          {proj.tech.map((tech) => (
            <span className="tag" key={tech}>{tech}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="proj-actions">
          <a href="#case-studies" className="btn-primary-sm">
            View Case Study →
          </a>
          <a
            href="https://github.com/kmelhem-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-sm"
          >
            ↗ GitHub
          </a>
        </div>
      </div>
    </TiltCard>
  );
};

const RegularCard = ({ proj, accentColor }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`proj-regular reveal${hovered ? ' proj-regular-hovered' : ''}`}
      style={{ '--card-accent-color': accentColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent line */}
      <div className="proj-card-accent" />

      <div className="proj-regular-body">
        {/* Tag + title */}
        <div className="proj-regular-header">
          <div className="project-tag-mono">{proj.tag}</div>
          <h3 className="proj-regular-name">{proj.name}</h3>
        </div>

        {/* Description */}
        <p className="project-desc">{proj.desc}</p>

        {/* Tech tags */}
        <div className="project-tech">
          {proj.tech.map((tech) => (
            <span className="tag" key={tech}>{tech}</span>
          ))}
        </div>

        {/* Hover CTA */}
        <a
          href="https://github.com/kmelhem-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="proj-explore-btn"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          ↗ Explore
        </a>
      </div>
    </div>
  );
};

const Projects = () => {
  const { t } = useApp();
  const p = t.projects;

  const featuredProj = p.items.find((item) => item.featured);
  const regularProjs = p.items.filter((item) => !item.featured);
  const accentColors = ['var(--teal)', 'var(--blue)'];

  return (
    <section id="projects">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{p.section}</div>
          <h2>{p.title}</h2>
        </div>

        {featuredProj && <FeaturedCard proj={featuredProj} />}

        <div className="proj-regular-grid">
          {regularProjs.map((proj, i) => (
            <RegularCard
              key={i}
              proj={proj}
              accentColor={accentColors[i % accentColors.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
