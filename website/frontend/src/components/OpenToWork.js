import { useEffect, useRef, useState } from 'react';
import { useApp } from '../App';
import './OpenToWork.css';

const BOOK_LINK = 'mailto:khadme9@gmail.com?subject=Let%27s Connect — Saw Your Portfolio';

const OpenToWork = () => {
  const { lang } = useApp();
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem('otw-dismissed'));
  const intervalRef = useRef(null);

  const labels = {
    en: {
      open: "Open to full-time & freelance",
      openSub: "Available now — Backend & full-stack roles",
      busy: "Currently Busy",
      busySub: "Limited availability — but open to great fits",
      cta: "Let's talk →",
      book: "Book a Call 📅",
      badge: "Available for hire",
    },
    ar: {
      open: "متاح للدوام الكامل والمستقل",
      openSub: "متاح الآن — أدوار باك-إند وفول-ستاك",
      busy: "مشغول حالياً",
      busySub: "إتاحة محدودة — لكن منفتح على الفرص المناسبة",
      cta: 'لنتحدث →',
      book: "احجز مكالمة 📅",
      badge: "متاح للتوظيف",
    },
  }[lang] || {};

  // Format today's date bilingually
  const todayLabel = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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

  const isOpen = status === 'open';
  const isBusy = status === 'busy';
  const showBanner = !dismissed && status !== null && status !== 'closed';
  // Floating badge: show when banner is dismissed but still open/busy
  const showBadge = dismissed && status !== null && status !== 'closed';

  return (
    <>
      {showBanner && (
        <div
          className={`otw-banner ${isBusy ? 'otw-busy' : 'otw-open'}`}
          role="banner"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Animated gradient overlay */}
          <div className="otw-gradient-overlay" aria-hidden="true" />

          <div className="otw-inner">
            {/* Left: status indicator */}
            <div className="otw-status-group">
              <span className="otw-dot" aria-hidden="true">
                <span className="otw-dot-ring" />
              </span>
              <div className="otw-text-block">
                <span className="otw-headline">
                  {isBusy ? labels.busy : labels.open}
                </span>
                <span className="otw-sub">
                  {isBusy ? labels.busySub : labels.openSub}
                </span>
              </div>
            </div>

            {/* Center: date pill */}
            <div className="otw-date-pill" aria-hidden="true">
              {todayLabel}
            </div>

            {/* Right: CTAs + dismiss */}
            <div className="otw-actions">
              <button className="otw-cta" onClick={scrollToContact}>
                {labels.cta}
              </button>
              <a
                className="otw-book"
                href={BOOK_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                {labels.book}
              </a>
              <button
                className="otw-dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {showBadge && (
        <button
          className={`otw-badge ${isBusy ? 'otw-badge-busy' : 'otw-badge-open'}`}
          onClick={scrollToContact}
          aria-label={labels.badge}
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <span className="otw-badge-dot" aria-hidden="true">
            <span className="otw-badge-dot-ring" />
          </span>
          <span className="otw-badge-label">{labels.badge}</span>
        </button>
      )}
    </>
  );
};

export default OpenToWork;
