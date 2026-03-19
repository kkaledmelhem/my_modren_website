import { useState, useEffect } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      const sections = document.querySelectorAll('section[id]');
      const navAs = document.querySelectorAll('.nav-links a:not(.nav-cta)');
      let current = '';
      sections.forEach((s) => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
      });
      navAs.forEach((a) => {
        a.style.color =
          a.getAttribute('href') === '#' + current ? 'var(--accent)' : '';
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav id="nav" className={scrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a className="nav-logo" href="#hero">
            K<span>.</span>Melhem
          </a>
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#experience">Experience</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#germany">Germany</a></li>
            <li>
              <a href="#contact" className="nav-cta">
                Let's talk
              </a>
            </li>
          </ul>
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
        <a href="#about" onClick={close}>About</a>
        <a href="#skills" onClick={close}>Skills</a>
        <a href="#experience" onClick={close}>Experience</a>
        <a href="#projects" onClick={close}>Projects</a>
        <a href="#germany" onClick={close}>Germany</a>
        <a href="#contact" onClick={close}>Let's talk →</a>
      </div>
    </>
  );
};

export default Navbar;
