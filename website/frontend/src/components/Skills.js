import { useApp } from '../App';
import Marquee from './Marquee';

const CATEGORY_COLORS = ['#8b7cf8', '#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa'];

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
          {s.cats.map((cat, i) => {
            const color = CATEGORY_COLORS[i] || CATEGORY_COLORS[0];
            return (
              <div
                className="skill-card reveal"
                key={i}
                data-delay={i * 60}
                style={{ '--cat-color': color }}
              >
                <div className="skill-icon-wrap">
                  <span className="skill-icon-emoji">{cat.icon}</span>
                </div>
                <div className="skill-name-themed">{cat.name}</div>
                <div className="skill-tags">
                  {cat.tags.map((tag) => (
                    <span className="skill-tag-themed" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Marquee />
    </section>
  );
};

export default Skills;
