const About = () => (
  <section id="about">
    <div className="container">
      <div className="section-head reveal">
        <div className="label">01 — About</div>
        <h2 className="section-title">
          Who I <em>am</em>
        </h2>
      </div>
      <div className="about-grid">
        <div className="about-body reveal">
          <p>
            I'm a Lead Backend Engineer at <strong>Robotack</strong> in Amman,
            Jordan, with a focus on building robust, scalable backend systems
            using <strong>Java, Spring Boot, and microservices</strong>.
          </p>
          <p>
            My work spans AI-powered chatbot platforms (Robochat), microfinance
            systems (MFLP), and WhatsApp Business API integrations — all
            requiring careful architecture, clean code, and zero tolerance for
            production bugs.
          </p>
          <p>
            I graduated from{' '}
            <strong>
              Jordan University of Science and Technology (JUST)
            </strong>{' '}
            and have been pushing the boundaries of what backend engineering
            looks like at fast-moving product companies. I lead a team of four
            developers while staying deeply hands-on with the code.
          </p>
          <p>
            I'm actively planning a move to <strong>Germany</strong>, where I'm
            excited to bring my skills to a new engineering culture and
            larger-scale systems.
          </p>
        </div>
        <div className="about-details reveal">
          <div className="detail-row">
            <div className="detail-label">Role</div>
            <div className="detail-value">Lead Backend Engineer</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Company</div>
            <div className="detail-value">Robotack</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Location</div>
            <div className="detail-value">Amman, Jordan 🇯🇴</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Education</div>
            <div className="detail-value">B.Sc. — JUST</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Languages</div>
            <div className="detail-value">
              Arabic (native) · English (fluent) · German (learning)
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Open to</div>
            <div className="detail-value">Backend roles in Germany 🇩🇪</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Email</div>
            <div className="detail-value">
              <a href="mailto:khaled@melhem.dev">khaled@melhem.dev</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default About;
