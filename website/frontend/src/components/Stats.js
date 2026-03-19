const Stats = () => (
  <section id="stats">
    <div className="container">
      <div className="bento-grid">

        <div className="bento-card bc-1 reveal">
          <div className="bc-label">Experience</div>
          <div className="bc-big" style={{ color: 'var(--accent)' }}>
            2.5<span style={{ fontSize: '1.4rem', opacity: 0.5 }}>yr</span>
          </div>
          <div className="bc-sub">Lead backend engineer</div>
        </div>

        <div className="bento-card bc-2 reveal">
          <div className="bc-label">Team</div>
          <div className="bc-big" style={{ color: 'var(--teal)' }}>4</div>
          <div className="bc-sub">Developers led</div>
        </div>

        <div className="bento-card bc-3 reveal">
          <div className="bc-label">Products</div>
          <div className="bc-big" style={{ color: 'var(--blue)' }}>2+</div>
          <div className="bc-sub">In production at scale</div>
        </div>

        <div className="bento-card bc-4 reveal">
          <div
            className="bc-label"
            style={{ color: 'var(--accent)', opacity: 0.6 }}
          >
            Next destination
          </div>
          <div
            className="bc-big"
            style={{ color: 'var(--accent)', fontSize: '2.2rem' }}
          >
            🇩🇪 Germany
          </div>
          <div
            className="bc-sub"
            style={{ color: 'var(--accent)', opacity: 0.6 }}
          >
            EU Blue Card · Chancenkarte · Job offer route
          </div>
        </div>

        <div className="bento-card bc-5 reveal">
          <div className="bc-label">Primary stack</div>
          <div
            className="bc-big"
            style={{ color: 'var(--coral)', fontSize: '1.8rem' }}
          >
            Java ☕
          </div>
          <div className="bc-sub">Spring Boot · JPA · REST</div>
        </div>

        <div className="bento-card bc-6 reveal">
          <div className="bc-label">Education</div>
          <div
            className="bc-big"
            style={{ color: 'var(--text2)', fontSize: '1.4rem' }}
          >
            JUST
          </div>
          <div className="bc-sub">Computer Engineering, Jordan</div>
        </div>

      </div>
    </div>
  </section>
);

export default Stats;
