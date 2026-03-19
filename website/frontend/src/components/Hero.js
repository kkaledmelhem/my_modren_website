const Hero = () => (
  <section id="hero">
    <div className="hero-glow"></div>
    <div className="hero-grid"></div>
    <div className="container">
      <div className="hero-inner">
        <div>
          <div className="hero-badge">Open to opportunities</div>
          <h1 className="hero-h1">
            Khaled
            <br />
            <em>Melhem</em>
          </h1>
          <p className="hero-sub">
            Lead Backend Engineer based in <strong>Amman, Jordan</strong>. I
            build production-grade microservices, AI-powered platforms, and
            systems that hold up under real pressure.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">
              Get in touch →
            </a>
            <a href="#projects" className="btn-ghost">
              View my work
            </a>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-stat-card">
            <div className="stat-icon">⚡</div>
            <div>
              <div className="stat-num" style={{ color: 'var(--accent)' }}>
                2.5
                <span style={{ fontSize: '1.1rem', opacity: 0.6 }}>yr</span>
              </div>
              <div className="stat-desc">Professional experience</div>
            </div>
          </div>
          <div className="hero-stat-card">
            <div className="stat-icon">🤖</div>
            <div>
              <div className="stat-num" style={{ color: 'var(--teal)' }}>
                2+
              </div>
              <div className="stat-desc">Major products shipped</div>
            </div>
          </div>
          <div className="hero-stat-card">
            <div className="stat-icon">👥</div>
            <div>
              <div className="stat-num" style={{ color: 'var(--blue)' }}>
                4
              </div>
              <div className="stat-desc">Engineers led</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Hero;
