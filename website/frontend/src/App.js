import { createContext, useContext, useEffect, useState } from 'react';
import tr from './translations';
import './blog.css';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Cursor from './components/Cursor';
import SocialBar from './components/SocialBar';
import Stats from './components/Stats';
import AIChat from './components/AIChat';
import OpenToWork from './components/OpenToWork';
import Testimonials from './components/Testimonials';
import SkillsRadar from './components/SkillsRadar';
import CaseStudies from './components/CaseStudies';
import CaseStudyDetail from './components/CaseStudyDetail';
import Blog from './components/Blog';
import BlogPost from './components/BlogPost';
import GitHubActivity from './components/GitHubActivity';
import TechMarquee from './components/TechMarquee';
import HackerTerminal from './components/HackerTerminal';
import JDAnalyzer from './components/JDAnalyzer';
import blogPosts from './data/blogPosts';
import caseStudies from './data/caseStudies';

export const AppCtx = createContext();
export const useApp = () => useContext(AppCtx);

function App() {
  const [theme, setTheme]       = useState(() => localStorage.getItem('km-theme') || 'dark');
  const [lang, setLang]         = useState(() => localStorage.getItem('km-lang') || 'en');
  const [scrollPct, setScrollPct] = useState(0);
  const [showTop, setShowTop]   = useState(false);
  const [loaded, setLoaded]     = useState(false);
  // null = home, 'list' = blog list, string = post id
  const [blogView, setBlogView] = useState(null);
  // null = home, 'list' = case study list, string = study id
  const [caseStudyView, setCaseStudyView] = useState(null);
  // Hacker terminal easter egg
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [showTerminalHint, setShowTerminalHint] = useState(false);

  const t = tr[lang];

  const toggleTheme = () =>
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('km-theme', next);
      return next;
    });

  const toggleLang = () =>
    setLang((prev) => {
      const next = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('km-lang', next);
      return next;
    });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(Math.min(pct, 100));
      setShowTop(el.scrollTop > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach((el) => el.classList.remove('visible'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = Number(entry.target.dataset.delay) || 0;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );
    revealEls.forEach((el, i) => {
      el.dataset.delay = (i % 4) * 80;
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [lang, loaded, blogView, caseStudyView]);

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [blogView, caseStudyView]);

  // ── Hacker terminal: open on "/" keypress (when not typing in an input) ──
  useEffect(() => {
    const onKey = (e) => {
      if (terminalOpen && e.key === 'Escape') { setTerminalOpen(false); return; }
      if (e.key !== '/') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
      e.preventDefault();
      setTerminalOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [terminalOpen]);

  // Show the "/" hint toast once after the loader finishes
  useEffect(() => {
    if (!loaded) return;
    const seen = sessionStorage.getItem('km-terminal-hint');
    if (seen) return;
    const timer = setTimeout(() => {
      setShowTerminalHint(true);
      sessionStorage.setItem('km-terminal-hint', '1');
      setTimeout(() => setShowTerminalHint(false), 3800);
    }, 3000);
    return () => clearTimeout(timer);
  }, [loaded]);

  const currentPost = typeof blogView === 'string'
    ? blogPosts.find((p) => p.id === blogView) || null
    : null;

  const currentStudy = typeof caseStudyView === 'string'
    ? caseStudies.find((s) => s.id === caseStudyView) || null
    : null;

  return (
    <AppCtx.Provider value={{ theme, lang, t, toggleTheme, toggleLang, blogView, setBlogView, caseStudyView, setCaseStudyView }}>
      <Cursor />
      <SocialBar />
      <AIChat />
      <OpenToWork />

      {/* Hacker Terminal easter egg */}
      {terminalOpen && <HackerTerminal onClose={() => setTerminalOpen(false)} />}

      {/* Hint toast — shown once after load */}
      {showTerminalHint && (
        <div className="ht-hint-toast">
          Press <kbd style={{ fontFamily: 'var(--mono)', background: 'rgba(255,255,255,0.08)', padding: '0 5px', borderRadius: '4px' }}>/</kbd> to open the developer terminal
        </div>
      )}

      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      {/* Scroll progress bar */}
      <div style={{
        position: 'fixed', top: 0, insetInlineStart: 0,
        height: '3px', width: `${scrollPct}%`,
        background: 'linear-gradient(90deg, var(--accent), var(--teal))',
        zIndex: 200, transition: 'width 0.1s linear',
      }} />

      <Navbar />

      {blogView === null && caseStudyView === null && (
        <main>
          <Hero />
          <Stats />
          <TechMarquee />
          <About />
          <Skills />
          <SkillsRadar />
          <Experience />
          <Projects />
          <CaseStudies onStudyClick={(id) => setCaseStudyView(id)} />
          <Testimonials />
          <GitHubActivity />
          <JDAnalyzer />
          <Contact />
        </main>
      )}

      {blogView === 'list' && (
        <main>
          <Blog onPostClick={(id) => setBlogView(id)} />
        </main>
      )}

      {currentPost && (
        <main>
          <BlogPost
            post={currentPost}
            onBack={() => setBlogView('list')}
          />
        </main>
      )}

      {caseStudyView === 'list' && (
        <main>
          <CaseStudies onStudyClick={(id) => setCaseStudyView(id)} />
        </main>
      )}

      {currentStudy && (
        <main>
          <CaseStudyDetail
            study={currentStudy}
            onBack={() => setCaseStudyView('list')}
          />
        </main>
      )}

      <Footer />

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed', bottom: '2rem', insetInlineEnd: '2rem',
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'var(--accent)', color: '#fff', fontSize: '1.2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(139,124,248,0.4)', border: 'none',
          cursor: 'pointer',
          opacity: showTop ? 1 : 0,
          transform: showTop ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.3s, transform 0.3s',
          pointerEvents: showTop ? 'auto' : 'none', zIndex: 150,
        }}
        aria-label="Back to top"
      >↑</button>
    </AppCtx.Provider>
  );
}

export default App;
