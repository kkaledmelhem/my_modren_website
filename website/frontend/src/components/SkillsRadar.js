import { useEffect, useRef } from 'react';
import { useApp } from '../App';
import './SkillsRadar.css';

const RADAR_DATA = [
  { key: 'backend',      labelEn: 'Backend',      labelAr: 'الباك-إند',         value: 95 },
  { key: 'data',         labelEn: 'Data',          labelAr: 'قواعد البيانات',    value: 85 },
  { key: 'devops',       labelEn: 'DevOps',        labelAr: 'DevOps',            value: 78 },
  { key: 'integrations', labelEn: 'Integrations',  labelAr: 'التكاملات',         value: 88 },
  { key: 'frontend',     labelEn: 'Frontend',      labelAr: 'الفرونت-إند',       value: 65 },
  { key: 'ai',           labelEn: 'AI & Tooling',  labelAr: 'الذكاء الاصطناعي', value: 72 },
];

const RINGS   = 5;
const PADDING = 56;

function getThemeColors(theme) {
  if (theme === 'light') {
    return {
      ring:   'rgba(0,0,0,0.08)',
      axis:   'rgba(0,0,0,0.12)',
      fill:   'rgba(108,92,231,0.18)',
      stroke: '#6c5ce7',
      dot:    '#6c5ce7',
      label:  '#12122a',
      muted:  'rgba(18,18,42,0.45)',
    };
  }
  return {
    ring:   'rgba(255,255,255,0.06)',
    axis:   'rgba(255,255,255,0.10)',
    fill:   'rgba(139,124,248,0.18)',
    stroke: '#8b7cf8',
    dot:    '#34d399',
    label:  '#e8e8f0',
    muted:  'rgba(232,232,240,0.40)',
  };
}

function drawRadar(canvas, data, theme, lang) {
  const dpr  = window.devicePixelRatio || 1;
  const size = canvas.offsetWidth;
  canvas.width  = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const cx     = size / 2;
  const cy     = size / 2;
  const radius = (size / 2) - PADDING;
  const sides  = data.length;
  const colors = getThemeColors(theme);
  const angleStep  = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2;

  function pt(axisIndex, fraction) {
    const angle = startAngle + axisIndex * angleStep;
    return {
      x: cx + Math.cos(angle) * radius * fraction,
      y: cy + Math.sin(angle) * radius * fraction,
    };
  }

  // Rings
  for (let ring = 1; ring <= RINGS; ring++) {
    const frac = ring / RINGS;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const p = pt(i, frac);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = colors.ring;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // Axes
  for (let i = 0; i < sides; i++) {
    const outer = pt(i, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(outer.x, outer.y);
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // Filled polygon
  ctx.beginPath();
  data.forEach((d, i) => {
    const p = pt(i, d.value / 100);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fillStyle   = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Dots
  data.forEach((d, i) => {
    const p = pt(i, d.value / 100);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
    ctx.fillStyle = colors.dot;
    ctx.fill();
  });

  // Ring % labels
  for (let ring = 1; ring <= RINGS; ring++) {
    const p = pt(0, ring / RINGS);
    ctx.font      = `500 10px 'DM Mono', monospace`;
    ctx.fillStyle = colors.muted;
    ctx.textAlign = 'center';
    ctx.fillText(`${ring * 20}%`, p.x + 14, p.y - 4);
  }

  // Axis labels
  data.forEach((d, i) => {
    const angle = startAngle + i * angleStep;
    const lx    = cx + Math.cos(angle) * (radius + 20);
    const ly    = cy + Math.sin(angle) * (radius + 20);
    const text  = lang === 'ar' ? d.labelAr : d.labelEn;

    if (Math.cos(angle) > 0.2)       ctx.textAlign = 'left';
    else if (Math.cos(angle) < -0.2) ctx.textAlign = 'right';
    else                              ctx.textAlign = 'center';

    let yOff = Math.sin(angle) > 0.2 ? 14 : (Math.sin(angle) < -0.2 ? -4 : 5);

    ctx.font      = `600 12px 'Inter', sans-serif`;
    ctx.fillStyle = colors.label;
    ctx.fillText(text, lx, ly + yOff);

    ctx.font      = `500 10px 'DM Mono', monospace`;
    ctx.fillStyle = colors.stroke;
    ctx.fillText(`${d.value}%`, lx, ly + yOff + 13);
  });
}

const SkillsRadar = () => {
  const { theme, lang, t } = useApp();
  const s = t.skillsRadar;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawRadar(canvas, RADAR_DATA, theme, lang);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [theme, lang]);

  return (
    <section id="skills-radar">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{s.section}</div>
          <h2>{s.title}</h2>
        </div>
        <div className="radar-wrap reveal">
          <div className="radar-card">
            <canvas ref={canvasRef} className="radar-canvas" aria-label="Skills radar chart" />
            <ul className="radar-legend">
              {RADAR_DATA.map((d) => (
                <li key={d.key} className="radar-legend-item">
                  <span className="radar-legend-dot" />
                  <span className="radar-legend-label">{lang === 'ar' ? d.labelAr : d.labelEn}</span>
                  <span className="radar-legend-pct">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsRadar;
