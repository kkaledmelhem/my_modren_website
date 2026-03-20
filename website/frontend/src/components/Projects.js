import { useApp } from '../App';
import { useRef } from 'react';

const TiltCard = ({ children, className }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    el.style.transform = `perspective(800px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
    el.style.boxShadow = `${-x * 1.5}px ${y * 1.5}px 40px rgba(139,124,248,0.18)`;
  };

  const onLeave = (e) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
  };

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
};

const Projects = () => {
  const { t } = useApp();
  const p = t.projects;

  return (
    <section id="projects">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{p.section}</div>
          <h2>{p.title}</h2>
        </div>
        <div className="projects-grid">
          {p.items.map((proj, i) => (
            <TiltCard
              className={`project-card reveal${proj.featured ? ' featured' : ''}`}
              key={i}
            >
              <div className="project-tag">{proj.tag}</div>
              <div className="project-name">{proj.name}</div>
              <p className="project-desc">{proj.desc}</p>
              <div className="project-tech">
                {proj.tech.map((tech) => (
                  <span className="tag" key={tech}>{tech}</span>
                ))}
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
