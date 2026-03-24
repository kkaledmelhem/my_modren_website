import { useEffect, useState, useRef } from 'react';
import './Loader.css';

const LINES = [
  { prefix: '[INFO]',    prefixColor: '#34d399', text: '  Booting portfolio.jar ...' },
  { prefix: '[BUILD]',   prefixColor: '#8b7cf8', text: ' Compiling KhaledMelhem.java ...' },
  { prefix: '[INFO]',    prefixColor: '#34d399', text: '  Loading Spring Boot context ...' },
  { prefix: '[BUILD]',   prefixColor: '#8b7cf8', text: ' Wiring 42 beans ... done' },
  { prefix: '[INFO]',    prefixColor: '#34d399', text: '  Connecting to skills database ...' },
  { prefix: '[INFO]',    prefixColor: '#34d399', text: '  Loaded: Java 21 · Spring Boot 3 · Redis · Docker' },
  { prefix: '[BUILD]',   prefixColor: '#8b7cf8', text: ' Building React frontend ... done (1.2s)' },
  { prefix: '[INFO]',    prefixColor: '#34d399', text: '  Running experience tests ... 6/6 passed ✓' },
  { prefix: '[SUCCESS]', prefixColor: '#28c840', text: ' Portfolio ready. Welcome!' },
  { prefix: '$',         prefixColor: '#8b7cf8', text: ' _' },
];

const CHAR_SPEED = 18;
const LINE_GAP   = 120;

const Loader = ({ onDone }) => {
  const [lines, setLines]       = useState([]);
  const [current, setCurrent]   = useState('');
  const [lineIdx, setLineIdx]   = useState(0);
  const [progress, setProgress] = useState(0);
  const [fading, setFading]     = useState(false);
  const charIdxRef              = useRef(0);
  const doneRef                 = useRef(false);

  useEffect(() => {
    if (lineIdx >= LINES.length) {
      // All lines typed — animate progress bar then fade out
      let p = 0;
      const step = 100 / (600 / 16);
      const fill = setInterval(() => {
        p += step;
        if (p >= 100) {
          p = 100;
          clearInterval(fill);
          setProgress(100);
          setTimeout(() => {
            setFading(true);
            setTimeout(() => {
              if (!doneRef.current) {
                doneRef.current = true;
                onDone();
              }
            }, 500);
          }, 100);
        } else {
          setProgress(p);
        }
      }, 16);
      return () => clearInterval(fill);
    }

    const line = LINES[lineIdx];
    const fullText = line.prefix + line.text;
    charIdxRef.current = 0;
    setCurrent('');

    const typeChar = () => {
      charIdxRef.current += 1;
      const typed = fullText.slice(0, charIdxRef.current);
      setCurrent(typed);

      if (charIdxRef.current < fullText.length) {
        timer = setTimeout(typeChar, CHAR_SPEED);
      } else {
        // Line done — push to completed lines and move to next after gap
        setTimeout(() => {
          setLines(prev => [...prev, line]);
          setCurrent('');
          setLineIdx(idx => idx + 1);
        }, LINE_GAP);
      }
    };

    let timer = setTimeout(typeChar, CHAR_SPEED);
    return () => clearTimeout(timer);
  }, [lineIdx, onDone]);

  const allDone = lineIdx >= LINES.length;

  return (
    <div className={`loader-overlay${fading ? ' fading' : ''}`}>
      <div className="loader-win">
        <div className="loader-bar">
          <div className="loader-dots">
            <span className="loader-dot" style={{ background: '#ff5f57' }} />
            <span className="loader-dot" style={{ background: '#febc2e' }} />
            <span className="loader-dot" style={{ background: '#28c840' }} />
          </div>
          <span className="loader-title">portfolio.jar</span>
        </div>

        <div className="loader-body">
          {lines.map((line, i) => (
            <div key={i} className="loader-line">
              <span className="loader-prefix" style={{ color: line.prefixColor }}>
                {line.prefix}
              </span>
              <span className="loader-text">{line.text}</span>
            </div>
          ))}

          {!allDone && current.length > 0 && (
            <div className="loader-line">
              <span className="loader-text">{current}</span>
              <span className="loader-cursor">█</span>
            </div>
          )}

          {allDone && (
            <div className="loader-progress-wrap">
              <div
                className="loader-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Loader;
