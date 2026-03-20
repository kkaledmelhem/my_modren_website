import { useApp } from '../App';
import Marquee from './Marquee';

const Skills = () => {
  const { t } = useApp();
  const s = t.skills;

  return (
    <section id="skills">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{s.section}</div>
          <h2>{s.title}</h2>
        </div>
        <div className="skills-grid">
          {s.cats.map((cat, i) => (
            <div className="skill-card reveal" key={i} data-delay={i * 60}>
              <div className="skill-icon">{cat.icon}</div>
              <div className="skill-name">{cat.name}</div>
              <div className="skill-tags">
                {cat.tags.map((tag) => (
                  <span className="tag" key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Marquee />
    </section>
  );
};

export default Skills;
