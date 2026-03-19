const cards = [
  {
    icon: '💳',
    title: 'EU Blue Card',
    sub: 'Primary route — qualified engineer salary threshold',
  },
  {
    icon: '🎯',
    title: 'Chancenkarte',
    sub: 'Points-based opportunity card — researched in detail',
  },
  {
    icon: '📋',
    title: 'Job Offer Route',
    sub: 'Direct employment visa with company sponsorship',
  },
  {
    icon: '🗣️',
    title: 'German Language Prep',
    sub: 'Actively studying — certification in progress',
  },
  {
    icon: '🎓',
    title: 'Qualification Recognition',
    sub: 'JUST degree assessment for German recognition',
  },
];

const Germany = () => (
  <section id="germany">
    <div className="container">
      <div className="germany-inner">

        <div className="reveal">
          <div className="germany-badge">🇩🇪 Next chapter</div>
          <h2 className="germany-title">
            Heading to
            <br />
            <em>Germany</em>
          </h2>
          <p className="germany-body">
            I'm actively planning my relocation to Germany, where demand for
            backend Java engineers is strong. I've researched the visa pathways
            in depth and I'm preparing both professionally and linguistically
            for the transition.
          </p>
          <p className="germany-body">
            My profile — Lead Backend Engineer with Spring Boot, microservices,
            and CI/CD depth — maps well to the German tech market, particularly
            fintech, enterprise software, and platform engineering companies.
          </p>
          <a
            href="#contact"
            className="btn-primary"
            style={{ marginTop: '1.2rem' }}
          >
            Let's connect →
          </a>
        </div>

        <div className="germany-cards reveal">
          {cards.map((c) => (
            <div key={c.title} className="germany-card">
              <div className="gc-icon">{c.icon}</div>
              <div>
                <div className="gc-title">{c.title}</div>
                <div className="gc-sub">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  </section>
);

export default Germany;
