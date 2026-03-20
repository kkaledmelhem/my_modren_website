import { useApp } from '../App';

const Footer = () => {
  const { t } = useApp();
  const f = t.footer;

  const hrefs = ['#about', '#skills', '#experience', '#projects', '#contact'];

  return (
    <footer>
      <div className="container">
        <div className="footer-inner">
          <p className="footer-copy">{f.copy}</p>
          <nav className="footer-links">
            {f.links.map((label, i) => (
              <a key={i} href={hrefs[i]}>{label}</a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;