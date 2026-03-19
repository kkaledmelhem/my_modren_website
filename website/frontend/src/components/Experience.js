const Experience = () => (
  <section id="experience">
    <div className="container">
      <div className="section-head reveal">
        <div className="label">03 — Experience</div>
        <h2 className="section-title">
          Where I've <em>worked</em>
        </h2>
      </div>
      <div className="exp-timeline">

        {/* Robotack */}
        <div className="exp-item reveal">
          <div className="exp-dot"></div>
          <div className="exp-meta">
            <div>
              <div className="exp-company">Robotack</div>
              <div className="exp-role">Lead Backend Engineer</div>
            </div>
            <div className="exp-date">2023 — Present · Amman, JO</div>
          </div>
          <p className="exp-desc">
            Leading backend engineering across two flagship products — Robochat
            (AI chatbot platform) and MFLP (Microfinance Lending Platform).
            Managing a team of four while staying hands-on with architecture,
            code reviews, and production debugging.
          </p>
          <ul className="exp-achievements">
            <li>Architected WhatsApp Business API integration with catalog management, order flows, and real-time AJAX notifications</li>
            <li>Diagnosed and resolved SMB connection latency for QR code uploads — traced to connection pooling misconfiguration</li>
            <li>Fixed production SQL GROUP BY violations in DataTables-based order management interface</li>
            <li>Designed multi-phase CI/CD pipeline for IDHPlatform (multi-module Maven) with UAT + production approval gates and smart module detection</li>
            <li>Led Spring 5 → Spring Boot 4, Java 8 → Java 21, JSP → Thymeleaf migration across two Bitbucket repositories</li>
            <li>Submitted and managed Meta App Review for WhatsApp Business API verification</li>
            <li>Resolved JPA native query mapping issues with @SqlResultSetMapping in production</li>
          </ul>
          <div className="exp-tags">
            <span className="tag accent">Java 21</span>
            <span className="tag accent">Spring Boot</span>
            <span className="tag">JPA</span>
            <span className="tag teal">Microservices</span>
            <span className="tag blue">Azure DevOps</span>
            <span className="tag coral">WhatsApp API</span>
            <span className="tag">PostgreSQL</span>
            <span className="tag">Thymeleaf</span>
          </div>
        </div>

        {/* JUST */}
        <div className="exp-item reveal">
          <div
            className="exp-dot"
            style={{
              background: 'var(--teal)',
              boxShadow: '0 0 0 4px var(--bg2), 0 0 12px #52c99e50',
            }}
          ></div>
          <div className="exp-meta">
            <div>
              <div className="exp-company">
                Jordan University of Science &amp; Technology
              </div>
              <div className="exp-role" style={{ color: 'var(--teal)' }}>
                B.Sc. Computer Engineering
              </div>
            </div>
            <div className="exp-date">Graduated · Irbid, Jordan</div>
          </div>
          <p className="exp-desc">
            Built the technical foundation in software engineering, algorithms,
            data structures, and systems design that underpins all backend work
            since graduation.
          </p>
          <ul className="exp-achievements">
            <li>Strong foundation in algorithms, data structures, and systems programming</li>
            <li>Software engineering projects with team collaboration and real-world application</li>
          </ul>
          <div className="exp-tags">
            <span className="tag">Computer Engineering</span>
            <span className="tag">Algorithms</span>
            <span className="tag">Systems Design</span>
          </div>
        </div>

      </div>
    </div>
  </section>
);

export default Experience;
