const allTech = [
  'Java 17+', 'Spring Boot', 'Spring MVC', 'Spring Security', 'Hibernate',
  'REST APIs', 'MySQL', 'PostgreSQL', 'Redis', 'Docker', 'GitHub Actions',
  'CI/CD', 'Nginx', 'Linux', 'Maven', 'React', 'WhatsApp API', 'Meta Graph API',
  'Dialogflow', 'OpenAI API', 'ActiveMQ', 'Microservices', 'JPA', 'Liquibase',
];

const Row = ({ items, reverse }) => (
  <div className={`marquee-row${reverse ? ' marquee-reverse' : ''}`}>
    <div className="marquee-track">
      {[...items, ...items].map((t, i) => (
        <span className="marquee-tag" key={i}>{t}</span>
      ))}
    </div>
  </div>
);

const Marquee = () => (
  <div className="marquee-wrap">
    <Row items={allTech.slice(0, 13)} reverse={false} />
    <Row items={allTech.slice(11)} reverse={true} />
  </div>
);

export default Marquee;
