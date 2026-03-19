const skills = [
  {
    icon: '☕',
    title: 'Backend Core',
    sub: 'Java-first stack with deep Spring Boot expertise, from monoliths to distributed microservices.',
    tags: [
      { label: 'Java 21', cls: 'accent' },
      { label: 'Spring Boot', cls: 'accent' },
      { label: 'JPA / Hibernate', cls: '' },
      { label: 'Maven', cls: '' },
      { label: 'REST APIs', cls: '' },
      { label: 'Microservices', cls: '' },
    ],
  },
  {
    icon: '🗄️',
    title: 'Data & Persistence',
    sub: 'Relational databases, ORM mappings, native queries, and complex SQL — built to be reliable in production.',
    tags: [
      { label: 'PostgreSQL', cls: 'teal' },
      { label: 'MySQL', cls: 'teal' },
      { label: 'SQL', cls: '' },
      { label: 'JPA Mappings', cls: '' },
      { label: 'Native Queries', cls: '' },
    ],
  },
  {
    icon: '⚙️',
    title: 'DevOps & CI/CD',
    sub: 'End-to-end pipeline design with UAT and production approval gates. Smart module detection for multi-module Maven builds.',
    tags: [
      { label: 'Azure DevOps', cls: 'blue' },
      { label: 'Bitbucket Pipelines', cls: 'blue' },
      { label: 'GitHub', cls: '' },
      { label: 'Maven Multi-module', cls: '' },
    ],
  },
  {
    icon: '🤖',
    title: 'Integrations & APIs',
    sub: 'Deep experience with WhatsApp Business API, Meta App Review, and complex third-party system integrations.',
    tags: [
      { label: 'WhatsApp Business API', cls: 'coral' },
      { label: 'Meta APIs', cls: 'coral' },
      { label: 'Flow Tokens', cls: '' },
      { label: 'Webhooks', cls: '' },
    ],
  },
  {
    icon: '🌐',
    title: 'Frontend (Supporting)',
    sub: 'Full-stack awareness with Thymeleaf, JSP, jQuery, and Bootstrap — enough to own the whole feature end to end.',
    tags: [
      { label: 'Thymeleaf', cls: '' },
      { label: 'JSP', cls: '' },
      { label: 'jQuery', cls: '' },
      { label: 'Bootstrap', cls: '' },
      { label: 'AJAX', cls: '' },
    ],
  },
  {
    icon: '🧠',
    title: 'AI & Tooling',
    sub: 'Building an AI-first workspace with Claude Code in IntelliJ, and MCP integrations across Jira, Notion, and Slack.',
    tags: [
      { label: 'Claude Code', cls: 'accent' },
      { label: 'IntelliJ IDEA', cls: '' },
      { label: 'Jira MCP', cls: '' },
      { label: 'Notion MCP', cls: '' },
    ],
  },
];

const Skills = () => (
  <section id="skills">
    <div className="container">
      <div className="section-head reveal">
        <div className="label">02 — Skills</div>
        <h2 className="section-title">
          What I <em>build with</em>
        </h2>
      </div>
      <div className="skills-grid">
        {skills.map((s) => (
          <div key={s.title} className="skill-card reveal">
            <div className="skill-card-icon">{s.icon}</div>
            <div className="skill-card-title">{s.title}</div>
            <div className="skill-card-sub">{s.sub}</div>
            <div className="skill-tags">
              {s.tags.map((t) => (
                <span key={t.label} className={`tag${t.cls ? ' ' + t.cls : ''}`}>
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Skills;
