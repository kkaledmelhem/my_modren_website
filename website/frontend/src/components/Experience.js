import { useApp } from '../App';

const Experience = () => {
  const { t } = useApp();
  const e = t.exp;

  return (
    <section id="experience">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{e.section}</div>
          <h2>{e.title}</h2>
        </div>
        <div className="exp-list">
          {e.items.map((item, i) => (
            <div className="exp-item reveal" key={i} data-delay={i * 100}>
              <div className="exp-dot"></div>
              <div className="exp-period">{item.period}</div>
              <div className="exp-role">{item.role}</div>
              <div className="exp-company">{item.company}</div>
              <div className="exp-bullets">
                {item.bullets.map((b, j) => (
                  <div className="exp-bullet" key={j}>{b}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;