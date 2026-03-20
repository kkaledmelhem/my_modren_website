import { useApp } from '../App';

const Terminal = ({ data }) => (
  <div className="terminal">
    <div className="terminal-bar">
      <span className="t-dot" style={{ background: '#ff5f57' }} />
      <span className="t-dot" style={{ background: '#febc2e' }} />
      <span className="t-dot" style={{ background: '#28c840' }} />
      <span className="t-title">khaled@melhem ~ profile.json</span>
    </div>
    <div className="terminal-body">
      <span className="t-brace">{'{'}</span>
      {data.map(([key, val], i) => (
        <div className="t-line" key={i}>
          <span className="t-key">{'  '}&ldquo;{key}&rdquo;</span>
          <span className="t-colon">: </span>
          <span className="t-val">&ldquo;{val}&rdquo;</span>
          {i < data.length - 1 && <span className="t-comma">,</span>}
        </div>
      ))}
      <span className="t-brace">{'}'}</span>
    </div>
  </div>
);

const Avatar = () => (
  <div className="avatar-wrap">
    <div className="avatar">
      <span className="avatar-initials">KM</span>
    </div>
    <div className="avatar-ring" />
    <div className="avatar-status">
      <span className="avatar-status-dot" />
      Available
    </div>
  </div>
);

const About = () => {
  const { t } = useApp();
  const a = t.about;

  const termData = [
    [a.dRole,      a.dRoleVal],
    [a.dCompany,   a.dCompanyVal],
    [a.dLocation,  a.dLocationVal],
    [a.dEducation, a.dEducationVal],
    [a.dLangs,     a.dLangsVal],
    [a.dOpen,      a.dOpenVal],
    [a.dEmail,     a.dEmailVal],
  ];

  return (
    <section id="about">
      <div className="container">
        <div className="about-inner">
          <div className="reveal">
            <Avatar />
            <div className="label" style={{ marginBottom: '0.6rem', marginTop: '2rem' }}>{a.section}</div>
            <h2 style={{
              fontSize: 'clamp(2rem,5vw,3rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              whiteSpace: 'pre-line',
              marginBottom: '2rem',
            }}>
              {a.title}
            </h2>
            <div className="about-bio">
              <p>{a.p1}</p>
              <p>{a.p2}</p>
              <p>{a.p3}</p>
            </div>
          </div>

          <div className="reveal" data-delay="120">
            <Terminal data={termData} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
