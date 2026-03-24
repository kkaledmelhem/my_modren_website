import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';

const KmLogo = () => (
  <svg
    className="km-logo-svg"
    width="36"
    height="36"
    viewBox="0 0 36 36"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', transition: 'transform 0.2s ease' }}
  >
    <defs>
      <linearGradient id="km-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent)" />
        <stop offset="100%" stopColor="var(--teal)" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="17" fill="url(#km-grad)" />
    <circle
      className="km-ring"
      cx="18"
      cy="18"
      r="17"
      fill="none"
      stroke="rgba(255,255,255,0.4)"
      strokeWidth="1.5"
    />
    <text
      x="11.5"
      y="18"
      fontFamily="var(--font)"
      fontWeight="700"
      fontSize="15"
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
    >K</text>
    <text
      x="24.5"
      y="18"
      fontFamily="var(--font)"
      fontWeight="700"
      fontSize="15"
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
    >M</text>
  </svg>
);

const Navbar = () => {
  const { theme, lang, t, toggleTheme, toggleLang, blogView, setBlogView } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const sectionIds = ['about', 'skills', 'experience', 'projects'];
  const navLabels = [t.nav.about, t.nav.skills, t.nav.experience, t.nav.projects];

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 30);
    const navAs = document.querySelectorAll('.nav-links a.nav-sec');
    let current = '';
    [...sectionIds, 'contact'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 140) current = id;
    });
    navAs.forEach((a) => {
      const href = a.getAttribute('href');
      a.style.color = href === '#' + current ? 'var(--accent)' : '';
    });
  }, [lang]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const close = () => setMenuOpen(false);

  const themeIcon = theme === 'dark' ? '☀️' : '🌙';
  const langLabel = lang === 'en' ? 'عربي' : 'EN';

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            <KmLogo />
          </a>

          <ul className="nav-links">
            {blogView === null && sectionIds.map((id, i) => (
              <li key={id}>
                <a className="nav-sec" href={`#${id}`}>{navLabels[i]}</a>
              </li>
            ))}
            {blogView === null && (
              <li>
                <a href="#contact" className="nav-cta">{t.nav.contact}</a>
              </li>
            )}
            <li>
              <button
                className={`nav-toggle nav-blog-btn${blogView !== null ? ' nav-blog-active' : ''}`}
                onClick={() => setBlogView(blogView !== null ? null : 'list')}
              >
                {blogView !== null ? '← Home' : (lang === 'ar' ? 'المدوّنة' : 'Blog')}
              </button>
            </li>
          </ul>

          <div className="nav-controls">
            <button className="nav-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {themeIcon}
            </button>
            <button className="nav-toggle" onClick={toggleLang} aria-label="Toggle language">
              {langLabel}
            </button>
          </div>

          <button
            className={`nav-burger${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div className={`nav-mobile${menuOpen ? ' open' : ''}`}>
        {blogView === null && sectionIds.map((id, i) => (
          <a key={id} href={`#${id}`} onClick={close}>{navLabels[i]}</a>
        ))}
        {blogView === null && <a href="#contact" onClick={close}>{t.nav.contact}</a>}
        <button
          className="nav-toggle"
          style={{ textAlign: 'start', padding: '0.6rem 0' }}
          onClick={() => { setBlogView(blogView !== null ? null : 'list'); close(); }}
        >
          {blogView !== null ? '← Home' : (lang === 'ar' ? 'المدوّنة' : 'Blog')}
        </button>
        <div className="mob-controls">
          <button className="nav-toggle" onClick={() => { toggleTheme(); close(); }}>{themeIcon}</button>
          <button className="nav-toggle" onClick={() => { toggleLang(); close(); }}>{langLabel}</button>
        </div>
      </div>
    </>
  );
};

export default Navbar;