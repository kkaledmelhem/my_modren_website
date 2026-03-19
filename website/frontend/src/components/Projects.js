const Projects = () => (
  <section id="projects">
    <div className="container">
      <div className="section-head reveal">
        <div className="label">04 — Projects</div>
        <h2 className="section-title">
          What I've <em>shipped</em>
        </h2>
      </div>
      <div className="projects-grid">

        {/* Featured: Robochat */}
        <div className="project-card featured reveal">
          <div>
            <div className="project-icon">🤖</div>
            <div className="project-type">AI Platform · Flagship</div>
            <div className="project-name">Robochat</div>
            <p className="project-desc" style={{ marginTop: '0.6rem' }}>
              A WhatsApp-integrated AI chatbot platform enabling businesses to
              manage products, orders, and customer conversations at scale. Full
              integration with WhatsApp Business API including catalog
              management, order flows with tokens, Meta App Review, and
              real-time notification systems.
            </p>
            <div className="project-tags" style={{ marginTop: '1.2rem' }}>
              <span className="tag accent">Java</span>
              <span className="tag accent">Spring Boot</span>
              <span className="tag coral">WhatsApp API</span>
              <span className="tag coral">Meta APIs</span>
              <span className="tag">JPA</span>
              <span className="tag">AJAX</span>
              <span className="tag">Thymeleaf</span>
            </div>
          </div>
          <div>
            <ul className="project-highlights">
              <li>WhatsApp catalog management — products, categories, variants</li>
              <li>Order processing with flow tokens and state management</li>
              <li>Real-time order notification system via AJAX polling</li>
              <li>Custom HTML email notification templates with SQL-deployed updates</li>
              <li>Meta App Review submission and verification</li>
              <li>QR code image upload via SMB — resolved latency via connection pooling fix</li>
              <li>Fixed production GROUP BY violations in DataTables order management UI</li>
              <li>Resolved @SqlResultSetMapping issues in JPA native queries</li>
            </ul>
          </div>
        </div>

        {/* MFLP */}
        <div className="project-card reveal">
          <div className="project-icon">🏦</div>
          <div className="project-type">Fintech Backend</div>
          <div className="project-name">MFLP</div>
          <p className="project-desc">
            Microfinance Lending Platform — a fintech backend built for real
            money and real accountability. Airtight transaction logic, data
            integrity, and zero tolerance for bugs that affect financial
            records.
          </p>
          <ul className="project-highlights">
            <li>Loan lifecycle management with state machine patterns</li>
            <li>Transaction integrity and audit trail design</li>
            <li>Complex financial queries with JPA + native SQL</li>
          </ul>
          <div className="project-tags">
            <span className="tag accent">Java</span>
            <span className="tag accent">Spring Boot</span>
            <span className="tag teal">PostgreSQL</span>
            <span className="tag">JPA</span>
            <span className="tag">Fintech</span>
          </div>
        </div>

        {/* IDHPlatform CI/CD */}
        <div className="project-card reveal">
          <div className="project-icon">🔧</div>
          <div className="project-type">DevOps / Platform</div>
          <div className="project-name">IDHPlatform CI/CD</div>
          <p className="project-desc">
            Multi-phase CI/CD pipeline for a multi-module Maven project with
            smart module detection, two approval gates, and Azure deployment.
          </p>
          <ul className="project-highlights">
            <li>Smart module detection — rebuilds only what changed</li>
            <li>UAT approval gate with manual sign-off</li>
            <li>Production gate with rollback capability</li>
            <li>Modules: generic.jar, auth.jar, business.jar, CMS, mobile-app</li>
          </ul>
          <div className="project-tags">
            <span className="tag blue">Azure DevOps</span>
            <span className="tag blue">Bitbucket</span>
            <span className="tag">Maven</span>
            <span className="tag">Multi-module</span>
          </div>
        </div>

      </div>
    </div>
  </section>
);

export default Projects;
