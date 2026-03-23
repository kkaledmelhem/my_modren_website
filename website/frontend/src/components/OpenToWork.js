import { useEffect, useRef, useState } from 'react';
import { useApp } from '../App';
import './OpenToWork.css';

const OpenToWork = () => {
  const { lang } = useApp();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem('otw-dismissed'));
  const intervalRef = useRef(null);

  const labels = {
    en: {
      open: "Currently Open to Work — Available for full-time backend roles & freelance projects.",
      busy: "Currently Busy — Limited availability, but open to exciting opportunities.",
      cta: "Let's talk →",
    },
    ar: {
      open: 'متاح للعمل حالياً — مفتوح لأدوار باك-إند بدوام كامل ومشاريع حرة.',
      busy: 'مشغول حالياً — إتاحة محدودة، لكن منفتح على الفرص المثيرة.',
      cta: 'لنتحدث →',
    },
  }[lang] || {};

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('non-ok');
      const data = await res.json();
      setStatus(data.status || (data.openToWork ? 'open' : 'closed'));
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 60_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('otw-dismissed', '1');
    setDismissed(true);
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (dismissed || status === null || status === 'closed') return null;

  return (
    <div className={`otw-banner ${status === 'busy' ? 'otw-busy' : 'otw-open'}`} role="banner">
      <span className="otw-dot" />
      <span className="otw-text">{status === 'busy' ? labels.busy : labels.open}</span>
      <button className="otw-cta" onClick={scrollToContact}>{labels.cta}</button>
      <button className="otw-dismiss" onClick={handleDismiss} aria-label="Dismiss">×</button>
    </div>
  );
};

export default OpenToWork;
