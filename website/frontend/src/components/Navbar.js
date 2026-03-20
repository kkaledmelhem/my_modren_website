import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';

const Navbar = () => {
  const { theme, lang, t, toggleTheme, toggleLang } = useApp();
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
            K<span>.</span>Melhem
          </a>

          <ul className="nav-links">
            {sectionIds.map((id, i) => (
              <li key={id}>
                <a className="nav-sec" href={`#${id}`}>{navLabels[i]}</a>
              </li>
            ))}
            <li>
              <a href="#contact" className="nav-cta">{t.nav.contact}</a>
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
        {sectionIds.map((id, i) => (
          <a key={id} href={`#${id}`} onClick={close}>{navLabels[i]}</a>
        ))}
        <a href="#contact" onClick={close}>{t.nav.contact}</a>
        <div className="mob-controls">
          <button className="nav-toggle" onClick={() => { toggleTheme(); close(); }}>{themeIcon}</button>
          <button className="nav-toggle" onClick={() => { toggleLang(); close(); }}>{langLabel}</button>
        </div>
      </div>
    </>
  );
};

export default Navbar;