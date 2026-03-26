import { useState, useEffect } from 'react';
import './ReturnVisitorBanner.css';

function timeAgo(isoString) {
  const past = new Date(isoString);
  const now = new Date();
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMonth >= 2) return `${diffMonth} months ago`;
  if (diffMonth === 1) return 'a month ago';
  if (diffWeek >= 2) return `${diffWeek} weeks ago`;
  if (diffWeek === 1) return 'a week ago';
  if (diffDay >= 2) return `${diffDay} days ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffHr >= 2) return `${diffHr} hours ago`;
  if (diffHr === 1) return 'an hour ago';
  if (diffMin >= 2) return `${diffMin} minutes ago`;
  return 'a few minutes ago';
}

export default function ReturnVisitorBanner() {
  const [visible, setVisible] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [ago, setAgo] = useState('');

  useEffect(() => {
    const now = new Date().toISOString();
    const last = localStorage.getItem('km-last-visit');

    if (last) {
      const diffMs = new Date() - new Date(last);
      const diffHr = diffMs / (1000 * 60 * 60);
      if (diffHr > 1) {
        setAgo(timeAgo(last));
        setSliding(true);
        setVisible(true);

        // Auto-dismiss after 6 seconds
        const timer = setTimeout(() => dismiss(), 6000);
        return () => {
          clearTimeout(timer);
          localStorage.setItem('km-last-visit', now);
        };
      }
    }

    localStorage.setItem('km-last-visit', now);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setSliding(false);
    setTimeout(() => setVisible(false), 400);
  }

  if (!visible) return null;

  return (
    <div className={`rvb-banner${sliding ? ' rvb-in' : ' rvb-out'}`} role="status" aria-live="polite">
      <span className="rvb-wave">👋</span>
      <p className="rvb-text">
        Welcome back. You were here <strong>{ago}</strong>.{' '}
        Khaled has shipped updates since your last visit.
      </p>
      <button className="rvb-dismiss" onClick={dismiss} aria-label="Dismiss banner">×</button>
    </div>
  );
}
