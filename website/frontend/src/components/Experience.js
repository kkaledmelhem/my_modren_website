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

        <div className="tl-wrap">
          {e.items.map((item, i) => (
            <div
              className={`tl-item reveal${i % 2 === 0 ? ' tl-left' : ' tl-right'}`}
              key={i}
              data-delay={i * 120}
            >
              {/* Center node — always column 1 on mobile, center on desktop */}
              <div className="tl-center">
                <div className="tl-node" />
              </div>

              {/* Card — always column 2 on mobile */}
              <div className="tl-card">
                <div className="tl-date">{item.period}</div>
                <div className="tl-role">{item.role}</div>
                <div className="tl-company">{item.company}</div>
                <div className="tl-bullets">
                  {item.bullets.map((b, j) => (
                    <div className="tl-bullet" key={j}>{b}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
