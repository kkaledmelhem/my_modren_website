import { useState, useEffect, useRef, useCallback } from 'react';
import './HackerTerminal.css';

/* ── Command responses ── */
const COMMANDS = {
  help: () => [
    '  Available commands:',
    '  whoami          — Who is Khaled?',
    '  ls              — List skills & tools',
    '  ls projects     — Show all projects',
    '  cat resume      — Print résumé summary',
    '  skills          — Skill tree',
    '  experience      — Work timeline',
    '  contact         — All contact methods',
    '  stack           — Deep dive into tech stack',
    '  open            — Open to work status',
    '  weather         — Check the vibe ☀️',
    '  matrix          — ???',
    '  banner          — Show ASCII banner',
    '  hire khaled     — 🎉 You know you want to',
    '  ping khaled     — Check availability',
    '  sudo <cmd>      — Nice try',
    '  clear           — Clear terminal',
    '  exit            — Close terminal',
  ],

  whoami: () => [
    '  Khaled Melhem',
    '  ─────────────────────────────────────',
    '  Role    : Team Lead · Software Engineer',
    '  Company : Robotack, Amman Jordan',
    '  Stack   : Java 21 · Spring Boot · React',
    '  Built   : AI chatbot platform → 10K+ daily interactions',
    '  Led     : Team of 4 engineers',
    '  Target  : Senior backend / team lead roles (remote & on-site)',
    '  Email   : khadme9@gmail.com',
  ],

  ls: () => [
    '  drwxr-xr-x  backend/    Java · Spring Boot · Spring Security · JPA',
    '  drwxr-xr-x  data/       PostgreSQL · MySQL · Redis · Liquibase',
    '  drwxr-xr-x  devops/     Docker · GitHub Actions · CI/CD · Linux',
    '  drwxr-xr-x  integrations/ Meta API · WhatsApp Business · OpenAI',
    '  drwxr-xr-x  frontend/   React · JavaScript · HTML5 · CSS3',
    '  drwxr-xr-x  ai/         Groq · Dialogflow · NLP pipelines',
  ],

  skills: () => [
    '  ┌─ Backend Core ──────────────── ████████████████░░░░ 95% ─┐',
    '  │  Java 17+  Spring Boot  Spring Security  Hibernate       │',
    '  ├─ Integrations ──────────────── ██████████████████░░ 88% ─┤',
    '  │  Meta Graph API  WhatsApp Business  OpenAI  SMTP         │',
    '  ├─ Data ──────────────────────── █████████████████░░░ 85% ─┤',
    '  │  PostgreSQL  MySQL  Redis  Liquibase  JPQL               │',
    '  ├─ AI & Tooling ─────────────── ██████████████░░░░░░ 72% ─┤',
    '  │  Groq  Dialogflow ES/CX  NLP pipelines  OpenAI           │',
    '  ├─ DevOps ───────────────────── █████████████░░░░░░░ 78% ─┤',
    '  │  Docker  GitHub Actions  CI/CD  Linux  Nginx  Maven      │',
    '  └─ Frontend ─────────────────── ████████████░░░░░░░░ 65% ─┘',
  ],

  cat_resume: () => [
    '  ╔══════════════════════════════════════════════════════╗',
    '  ║           KHALED MELHEM — résumé.pdf                ║',
    '  ╠══════════════════════════════════════════════════════╣',
    '  ║  Education  : BSc Software Engineering, JUST (3.21) ║',
    '  ║  Experience : 2.5+ years backend engineering        ║',
    '  ║  Current    : Team Lead @ Robotack (Aug 2023–now)   ║',
    '  ║  Previous   : Backend Dev @ JUST Lab (2019–2023)    ║',
    '  ║  Highlight  : Built Robochat — 10K+ daily AI chats  ║',
    '  ║  Languages  : Arabic (native) · English (pro)       ║',
    '  ║  Goal       : Relocate to Germany 🇩🇪                ║',
    '  ╚══════════════════════════════════════════════════════╝',
    '  → Downloading... done. Check /public/Khaled_Melhem_Resume.pdf',
  ],

  'ls projects': () => [
    '  [1] Robochat Platform    — Multi-channel AI chatbot (WhatsApp, FB, Twitter)',
    '       ↳ Java · Spring Boot · WebSocket · Redis · PostgreSQL',
    '  [2] Chatbot Builder      — Drag-and-drop bot flow designer',
    '       ↳ React · Spring Boot · REST APIs',
    '  [3] MFLP                 — Multilingual NLP dataset platform',
    '       ↳ Spring Boot · MySQL · Python scripts',
    '  [4] Admin Portal         — Multi-tenant SaaS dashboard',
    '       ↳ Thymeleaf · Spring Security · Bootstrap',
    '  [5] WhatsApp Integration — Real-time messaging gateway',
    '       ↳ Meta Graph API · Spring Boot · WebSocket',
    '  [6] Analytics Dashboard  — Real-time chatbot performance metrics',
    '       ↳ PostgreSQL · Redis · React · Chart.js',
  ],

  ping: () => {
    const times = [12, 8, 15, 11, 9];
    const t = times[Math.floor(Math.random() * times.length)];
    return [
      `  PING khaled@portfolio ~ ${t}ms`,
      '  Status  : 🟢 Online',
      '  Uptime  : 2.5+ years of production experience',
      '  Latency : Responds to messages within 2 hours',
      '  Note    : Currently open to full-time backend roles',
    ];
  },

  experience: () => [
    '  ┌─ Work Timeline ─────────────────────────────────────────┐',
    '  │  2023–now  Team Lead & Software Engineer @ Robotack     │',
    '  │            └─ Built Robochat: 10K+ daily AI interactions │',
    '  │            └─ Led team of 4 engineers                    │',
    '  │            └─ Java 21 · Spring Boot · Redis · Meta API   │',
    '  │                                                          │',
    '  │  2019–2023 Backend Developer @ JUST Research Lab         │',
    '  │            └─ Multilingual NLP platform (MFLP)          │',
    '  │            └─ Spring Boot · MySQL · Python               │',
    '  │                                                          │',
    '  │  Education: BSc Software Engineering, JUST (GPA 3.21)   │',
    '  └──────────────────────────────────────────────────────────┘',
  ],

  contact: () => [
    '  📧  Email     khadme9@gmail.com',
    '  💼  LinkedIn  linkedin.com/in/khaled-melhem',
    '  🐙  GitHub    github.com/kmelhem-dev',
    '  📱  WhatsApp  Available on request',
    '  📍  Location  Amman, Jordan (Open to relocate)',
  ],

  stack: () => [
    '  ╔══ BACKEND CORE ══════════════════════════════════════════╗',
    '  ║  Java 21  ·  Spring Boot  ·  Spring Security  ·  JPA    ║',
    '  ║  Hibernate  ·  Maven  ·  REST APIs  ·  WebSocket        ║',
    '  ╠══ DATA LAYER ════════════════════════════════════════════╣',
    '  ║  PostgreSQL  ·  MySQL  ·  Redis  ·  Liquibase  ·  JPQL  ║',
    '  ╠══ INTEGRATIONS ══════════════════════════════════════════╣',
    '  ║  Meta Graph API  ·  WhatsApp Business  ·  OpenAI        ║',
    '  ║  Groq  ·  Dialogflow  ·  SMTP                           ║',
    '  ╠══ DEVOPS ════════════════════════════════════════════════╣',
    '  ║  Docker  ·  GitHub Actions  ·  CI/CD  ·  Linux  ·  Nginx║',
    '  ╠══ FRONTEND ══════════════════════════════════════════════╣',
    '  ║  React  ·  JavaScript  ·  HTML5  ·  CSS3                ║',
    '  ╚══════════════════════════════════════════════════════════╝',
  ],

  open: () => [
    '  🟢 STATUS: Open to Work',
    '  ─────────────────────────────────────',
    '  Looking for    : Senior Backend / Team Lead roles',
    '  Preferred      : Remote · Hybrid · On-site (EU/MENA)',
    '  Notice period  : 2–4 weeks',
    '  Visa           : Open to relocation (Germany 🇩🇪 preferred)',
    '  Response time  : Within 24 hours',
    '  ─────────────────────────────────────',
    '  → Type "hire khaled" to start the process 🚀',
  ],

  weather: () => [
    '  Checking weather in Amman, Jordan...',
    '  ─────────────────────────────────────',
    '  ☀️  Sunny · 24°C · Perfect coding weather',
    '  💡  Khaled\'s productivity: ████████████ 110%',
    '  ⚡  Coffee level: ████████░░░░ 73%',
    '  🚀  Lines of code today: ' + (Math.floor(Math.random() * 150) + 180),
  ],

  matrix: () => [
    '  01001011 01101000 01100001 01101100 01100101 01100100',
    '  10110100 11010010 01001011 10110100 11010010 01001011',
    '  ██ SYSTEM ACCESS GRANTED ██ WELCOME TO KHALED\'S MATRIX',
    '  10110100 11010010 01001011 10110100 11010010 01001011',
    '  01001011 01101000 01100001 01101100 01100101 01100100',
  ],

  banner: () => [
    '  ██╗  ██╗██╗  ██╗ █████╗ ██╗     ███████╗██████╗ ',
    '  ██║ ██╔╝██║  ██║██╔══██╗██║     ██╔════╝██╔══██╗',
    '  █████╔╝ ███████║███████║██║     █████╗  ██║  ██║',
    '  ██╔═██╗ ██╔══██║██╔══██║██║     ██╔══╝  ██║  ██║',
    '  ██║  ██╗██║  ██║██║  ██║███████╗███████╗██████╔╝',
    '  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ',
    '  ─────────────────────────────────────────────────',
    '  Team Lead · Backend Engineer · Amman, Jordan',
  ],

  'hire khaled': () => [
    '  ██╗  ██╗██╗██████╗ ███████╗██████╗ ██╗',
    '  ██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║',
    '  ███████║██║██████╔╝█████╗  ██║  ██║██║',
    '  ██╔══██║██║██╔══██╗██╔══╝  ██║  ██║╚═╝',
    '  ██║  ██║██║██║  ██║███████╗██████╔╝██╗',
    '  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝',
    '',
    '  Excellent decision! 🎉 Redirecting to contact form...',
  ],
};

const SUDO_RESPONSES = [
  'Permission denied: only Khaled has root access.',
  'sudo: you are not in the sudoers file. This incident will be reported.',
  'Nice try. Root privileges reserved for the owner.',
  'Access denied. Have you tried hiring him instead?',
];

const UNKNOWN_CMD = (cmd) => [
  `  bash: ${cmd}: command not found`,
  '  Type "help" to see available commands.',
];

/* ── Resolve a command string to its output lines ── */
const resolveCmd = (raw) => {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === 'clear') return '__clear__';
  if (trimmed === 'exit') return '__exit__';
  if (trimmed.startsWith('sudo')) {
    return [SUDO_RESPONSES[Math.floor(Math.random() * SUDO_RESPONSES.length)]];
  }
  if (trimmed === 'cat resume' || trimmed === 'cat resume.pdf') return COMMANDS.cat_resume();
  if (trimmed === 'ls projects') return COMMANDS['ls projects']();
  if (COMMANDS[trimmed]) return COMMANDS[trimmed]();
  return UNKNOWN_CMD(trimmed);
};

/* ── Confetti burst ── */
const spawnConfetti = () => {
  const colors = ['#8b7cf8', '#34d399', '#60a5fa', '#f472b6', '#fbbf24'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('span');
    el.style.cssText = `
      position:fixed; top:50%; left:50%; pointer-events:none; z-index:99999;
      width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px;
      background:${colors[i % colors.length]}; border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      transform:translate(-50%,-50%);
    `;
    document.body.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 250;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    el.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(0,0,0.3,1)' })
      .onfinish = () => el.remove();
  }
};

/* ── Main component ── */
const HackerTerminal = ({ onClose }) => {
  const [history, setHistory] = useState([
    { type: 'system', lines: [
      '  Welcome to Khaled\'s Portfolio Terminal v1.0.0',
      '  Type "help" for available commands.',
      '',
    ]},
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const histIdxRef = useRef(-1);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const submit = useCallback(() => {
    const cmd = input.trim();
    if (!cmd) return;

    setCmdHistory((prev) => [cmd, ...prev]);
    histIdxRef.current = -1;
    setInput('');

    const result = resolveCmd(cmd);

    if (result === '__clear__') {
      setHistory([]);
      return;
    }

    if (result === '__exit__') {
      onClose();
      return;
    }

    setHistory((prev) => [
      ...prev,
      { type: 'prompt', cmd },
      { type: 'output', lines: result },
    ]);

    /* Special side-effects */
    if (cmd.trim().toLowerCase() === 'hire khaled') {
      spawnConfetti();
      setTimeout(() => {
        const el = document.getElementById('contact');
        if (el) { el.scrollIntoView({ behavior: 'smooth' }); onClose(); }
      }, 1800);
    }
    if (cmd.trim().toLowerCase() === 'cat resume' || cmd.trim().toLowerCase() === 'cat resume.pdf') {
      setTimeout(() => {
        window.open('/Khaled_Melhem_Resume.pdf', '_blank');
      }, 800);
    }
  }, [input, onClose]);

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); return; }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdxRef.current + 1, cmdHistory.length - 1);
      histIdxRef.current = next;
      setInput(cmdHistory[next] ?? '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdxRef.current - 1, -1);
      histIdxRef.current = next;
      setInput(next === -1 ? '' : cmdHistory[next] ?? '');
    }
    if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="ht-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ht-window" role="dialog" aria-label="Developer terminal">
        {/* Title bar */}
        <div className="ht-titlebar">
          <div className="ht-dots">
            <button className="ht-dot ht-dot--red"   onClick={onClose} aria-label="Close" />
            <button className="ht-dot ht-dot--yellow" aria-label="Minimise" />
            <button className="ht-dot ht-dot--green"  aria-label="Maximise" />
          </div>
          <span className="ht-title">khaled@portfolio:~</span>
          <span />
        </div>

        {/* Output area */}
        <div className="ht-body" onClick={() => inputRef.current?.focus()}>
          {history.map((entry, i) => {
            if (entry.type === 'prompt') {
              return (
                <div key={i} className="ht-prompt-line">
                  <span className="ht-ps1">khaled@portfolio:~$ </span>
                  <span className="ht-cmd-echo">{entry.cmd}</span>
                </div>
              );
            }
            return (
              <div key={i} className="ht-output-block">
                {(entry.lines || []).map((line, j) => (
                  <div key={j} className={`ht-line${line.includes('█') ? ' ht-line--ascii' : ''}`}>
                    {line}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Active input line */}
          <div className="ht-prompt-line">
            <span className="ht-ps1">khaled@portfolio:~$ </span>
            <input
              ref={inputRef}
              className="ht-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal input"
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default HackerTerminal;
