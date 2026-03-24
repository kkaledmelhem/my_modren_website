import './TechMarquee.css';

const ROW1 = [
  { icon: '☕', label: 'Java', color: '#f89820' },
  { icon: '🍃', label: 'Spring Boot', color: '#6db33f' },
  { icon: '🔒', label: 'Spring Security', color: '#6db33f' },
  { icon: '🗄️', label: 'MySQL', color: '#00758f' },
  { icon: '🔴', label: 'Redis', color: '#dc382d' },
  { icon: '🐘', label: 'PostgreSQL', color: '#336791' },
  { icon: '🐳', label: 'Docker', color: '#2496ed' },
  { icon: '⚡', label: 'GitHub Actions', color: '#8b7cf8' },
  { icon: '🤖', label: 'Dialogflow', color: '#ff9800' },
  { icon: '📱', label: 'WhatsApp API', color: '#25d366' },
];

const ROW2 = [
  { icon: '⚛️', label: 'React', color: '#61dafb' },
  { icon: '🌐', label: 'REST APIs', color: '#8b7cf8' },
  { icon: '🔗', label: 'Hibernate', color: '#59666c' },
  { icon: '📦', label: 'Maven', color: '#c71a36' },
  { icon: '🐧', label: 'Linux', color: '#34d399' },
  { icon: '🔧', label: 'Nginx', color: '#009639' },
  { icon: '🧠', label: 'OpenAI API', color: '#10a37f' },
  { icon: '💬', label: 'ActiveMQ', color: '#e47911' },
  { icon: '🗂️', label: 'Liquibase', color: '#2962ff' },
  { icon: '📊', label: 'JPA', color: '#59666c' },
];

const TechMarquee = () => (
  <div className="tech-marquee">
    <div className="tech-marquee-inner">
      {[ROW1, ROW2].map((items, ri) => (
        <div key={ri} className="tech-row-wrap">
          <div className={`tech-row tech-row--${ri === 0 ? 'left' : 'right'}`}>
            {[...items, ...items].map((item, i) => (
              <div key={i} className="tech-pill" style={{ '--pill-color': item.color }}>
                <span className="tech-pill-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TechMarquee;
