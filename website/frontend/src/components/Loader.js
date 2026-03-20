import { useEffect, useState } from 'react';

const Loader = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(tick);
        setProgress(100);
        setTimeout(() => {
          setHiding(true);
          setTimeout(onDone, 700);
        }, 300);
      }
      setProgress(Math.min(p, 100));
    }, 60);
    return () => clearInterval(tick);
  }, [onDone]);

  return (
    <div className={`loader${hiding ? ' loader-hide' : ''}`}>
      <div className="loader-inner">
        <div className="loader-logo">
          K<span>.</span>M
        </div>
        <div className="loader-bar-wrap">
          <div className="loader-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-pct">{Math.floor(progress)}%</div>
      </div>
    </div>
  );
};

export default Loader;
