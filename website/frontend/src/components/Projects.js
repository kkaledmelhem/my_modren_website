import { useApp } from '../App';
import { useRef, useState } from 'react';
import ProjectModal from './ProjectModal';

/* ─────────────────────────────────────────
   Rich project data for the detail modal
───────────────────────────────────────── */
const PROJECT_DETAILS = {
  'Umniah Chat Bot': {
    tagline: 'Multi-channel AI chatbot serving 10K+ daily interactions',
    status: 'Live',
    description: [
      'A production-grade multi-channel AI chatbot platform built at Robotack for Umniah, one of Jordan\'s leading telecom providers. It handles real-time conversations across WhatsApp and Instagram simultaneously, serving over 10,000 daily interactions.',
      'The platform uses a microservices-inspired architecture with Spring Boot as the core, WebSocket for real-time bidirectional communication, and a comprehensive CMS for client operations and reporting.',
      'I led a team of 4 engineers building and scaling this system, establishing coding standards, conducting code reviews, and driving architecture decisions end-to-end.',
    ],
    techGroups: {
      Backend: ['Java', 'Spring Boot', 'Spring Security', 'WebSocket'],
      Data: ['MySQL', 'Hibernate / JPA', 'REST APIs', 'ORM'],
      Integrations: ['WhatsApp Business API', 'Instagram API', 'OpenAI'],
    },
    features: [
      'Real-time multi-channel message routing (WhatsApp, Instagram)',
      'Multi-step conversational flows with branching logic',
      'AI-powered response generation with keyword fallback matching',
      'Admin CMS dashboard with live conversation monitoring',
      'Horizontal scaling with stateless session design',
    ],
    metrics: [
      { label: 'Daily Interactions', value: '10K+' },
      { label: 'Team Size', value: '4 Engineers' },
      { label: 'Uptime', value: '99.9%' },
    ],
    github: null,
    demo: null,
  },
  'Advanced Chatbot Builder': {
    tagline: 'Drag-and-drop visual bot flow designer for non-technical users',
    status: 'Live',
    description: [
      'An interactive visual chatbot builder UI that allows non-technical users to design complex conversational flows using an intuitive interface supporting branching scenarios.',
      'Built with JavaScript on the frontend and Spring Boot REST APIs on the backend, enabling real-time flow updates and seamless deployment to the Robochat production platform.',
    ],
    techGroups: {
      Frontend: ['JavaScript', 'HTML5', 'CSS3'],
      Backend: ['Spring Boot', 'Java', 'REST APIs'],
      Data: ['Hibernate', 'PostgreSQL', 'ORM'],
    },
    features: [
      'Visual drag-and-drop flow editor with branching nodes',
      'Real-time preview of conversation flows before deployment',
      'One-click deployment to production messaging channels',
      'Flexible flow structures for evolving business requirements',
    ],
    metrics: [
      { label: 'Bot Templates', value: '20+' },
      { label: 'Deploy Time', value: '<30s' },
      { label: 'Internal Users', value: '50+' },
    ],
    github: null,
    demo: null,
  },
  'Legacy System Modernization': {
    tagline: 'Full Spring 5 / Java 8 to Spring Boot 3 / Java 21 platform migration',
    status: 'Archived',
    description: [
      'A comprehensive modernization of a large-scale production system at Robotack, migrating from Java 8 / Spring 5 to Java 21 / Spring Boot 3, eliminating years of accumulated technical debt.',
      'The migration included replacing JSP with Thymeleaf templates, refactoring all Hibernate ORM mappings for complex entity relationships, and optimizing the CI/CD pipeline using Maven and Docker.',
    ],
    techGroups: {
      Backend: ['Java 21', 'Spring Boot 3', 'Spring Security'],
      Frontend: ['Thymeleaf', 'HTML5', 'CSS3'],
      DevOps: ['Maven', 'Docker', 'CI/CD'],
    },
    features: [
      'Full Java 8 to Java 21 runtime upgrade with modern language features',
      'Spring 5 to Spring Boot 3 migration with auto-configuration',
      'JSP replaced with Thymeleaf for maintainable server-side templates',
      'Refactored Hibernate ORM mappings improving query performance',
      'Dockerized deployment pipeline with GitHub Actions CI/CD',
    ],
    metrics: [
      { label: 'Tech Debt', value: 'Eliminated' },
      { label: 'Query Perf', value: '+40%' },
      { label: 'Java Version', value: '8 → 21' },
    ],
    github: null,
    demo: null,
  },
};

/* ─────────────────────────────────────────
   TiltCard wrapper
───────────────────────────────────────── */
const TiltCard = ({ children, className, style }) => {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    el.style.transform = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg) translateY(-6px)`;
    el.style.boxShadow = `${-x * 2}px ${y * 2}px 60px rgba(139,124,248,0.28), 0 0 0 1px rgba(139,124,248,0.18)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.boxShadow = '';
  };

  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
};

/* ─────────────────────────────────────────
   Featured card
───────────────────────────────────────── */
const FeaturedCard = ({ proj, onClick }) => {
  return (
    <TiltCard
      className="proj-featured reveal"
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      {/* Ambient glow orb */}
      <div className="proj-featured-glow" />

      {/* Badge */}
      <div className="proj-featured-badge">✦ FEATURED</div>

      <div className="proj-featured-inner">
        {/* Monospace tag label */}
        <div className="project-tag-mono">{proj.tag}</div>

        {/* Title */}
        <h3 className="proj-featured-name">{proj.name}</h3>

        {/* Description */}
        <p className="project-desc">{proj.desc}</p>

        {/* Metric strip */}
        <div className="proj-metrics">
          <span>10K+ daily interactions</span>
          <span className="proj-metrics-dot">·</span>
          <span>4 engineers led</span>
          <span className="proj-metrics-dot">·</span>
          <span>2 platforms</span>
        </div>

        {/* Tech tags */}
        <div className="project-tech">
          {proj.tech.map((tech) => (
            <span className="tag" key={tech}>{tech}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="proj-actions">
          <button
            className="btn-primary-sm"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            View Details →
          </button>
          <a
            href="https://github.com/kmelhem-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost-sm"
            onClick={(e) => e.stopPropagation()}
          >
            ↗ GitHub
          </a>
        </div>
      </div>
    </TiltCard>
  );
};

/* ─────────────────────────────────────────
   Regular card
───────────────────────────────────────── */
const RegularCard = ({ proj, accentColor, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`proj-regular reveal${hovered ? ' proj-regular-hovered' : ''}`}
      style={{ '--card-accent-color': accentColor, cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Top accent line */}
      <div className="proj-card-accent" />

      <div className="proj-regular-body">
        {/* Tag + title */}
        <div className="proj-regular-header">
          <div className="project-tag-mono">{proj.tag}</div>
          <h3 className="proj-regular-name">{proj.name}</h3>
        </div>

        {/* Description */}
        <p className="project-desc">{proj.desc}</p>

        {/* Tech tags */}
        <div className="project-tech">
          {proj.tech.map((tech) => (
            <span className="tag" key={tech}>{tech}</span>
          ))}
        </div>

        {/* Hover CTA */}
        <span
          className="proj-explore-btn"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          ↗ View Details
        </span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   Projects section
───────────────────────────────────────── */
const Projects = () => {
  const { t } = useApp();
  const p = t.projects;

  const [selectedProject, setSelectedProject] = useState(null);

  const featuredProj = p.items.find((item) => item.featured);
  const regularProjs = p.items.filter((item) => !item.featured);
  const accentColors = ['var(--teal)', 'var(--blue)'];

  const openModal = (projName) => {
    const detail = PROJECT_DETAILS[projName];
    if (detail) setSelectedProject({ name: projName, ...detail });
  };

  const closeModal = () => setSelectedProject(null);

  return (
    <section id="projects">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{p.section}</div>
          <h2>{p.title}</h2>
        </div>

        {featuredProj && (
          <FeaturedCard
            proj={featuredProj}
            onClick={() => openModal(featuredProj.name)}
          />
        )}

        <div className="proj-regular-grid">
          {regularProjs.map((proj, i) => (
            <RegularCard
              key={i}
              proj={proj}
              accentColor={accentColors[i % accentColors.length]}
              onClick={() => openModal(proj.name)}
            />
          ))}
        </div>
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={closeModal} />
      )}
    </section>
  );
};

export default Projects;
