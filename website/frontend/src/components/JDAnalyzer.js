import { useState } from 'react';
import { useApp } from '../App';
import './JDAnalyzer.css';

const LABELS = {
  en: {
    section: '07 — Fit Checker',
    title: "Paste a Job\nDescription",
    sub: "Powered by Groq AI — get an instant analysis of how well Khaled fits any role.",
    placeholder: "Paste the full job description here...",
    btn: "Analyze Fit →",
    analyzing: "Analyzing…",
    matchScore: "Match Score",
    headline: "Summary",
    matched: "✅ Strong Matches",
    gaps: "⚠️ Gaps",
    talking: "💬 Talking Points",
    tryAnother: "Try Another →",
    disclaimer: "AI-powered analysis · Results are indicative",
  },
  ar: {
    section: '07 — مطابقة الوظائف',
    title: "الصق وصف الوظيفة",
    sub: "مدعوم بـ Groq AI — احصل على تحليل فوري لمدى ملاءمة خالد لأي دور.",
    placeholder: "الصق وصف الوظيفة الكامل هنا...",
    btn: "تحليل المطابقة ←",
    analyzing: "جارٍ التحليل…",
    matchScore: "نسبة المطابقة",
    headline: "ملخص",
    matched: "✅ نقاط القوة",
    gaps: "⚠️ الفجوات",
    talking: "💬 نقاط النقاش",
    tryAnother: "جرّب وظيفة أخرى ←",
    disclaimer: "تحليل بالذكاء الاصطناعي · النتائج تقديرية",
  },
};

const ScoreRing = ({ score }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#8b7cf8' : '#f59e0b';

  return (
    <div className="jda-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="jda-ring-label">
        <span className="jda-ring-score" style={{ color }}>{score}</span>
        <span className="jda-ring-pct">/ 100</span>
      </div>
    </div>
  );
};

const JDAnalyzer = () => {
  const { lang } = useApp();
  const l = LABELS[lang] || LABELS.en;

  const [jd, setJd]         = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  const analyze = async () => {
    if (!jd.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setResult(data);
    } catch {
      setError(lang === 'ar' ? 'فشل التحليل. حاول مرة أخرى.' : 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResume = async () => {
    setResumeLoading(true);
    try {
      const res = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd }),
      });
      const data = await res.json();
      // Build HTML resume
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${data.name} — Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', serif; color: #1a1a1a; padding: 48px; max-width: 800px; margin: auto; }
  h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.5px; }
  .title { font-size: 1.1rem; color: #5b21b6; margin: 4px 0 24px; font-family: monospace; }
  .summary { font-size: 0.95rem; line-height: 1.7; color: #374151; border-left: 3px solid #8b7cf8; padding-left: 16px; margin-bottom: 32px; }
  h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; color: #8b7cf8; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 16px; margin-top: 28px; }
  .job { margin-bottom: 20px; }
  .job-header { display: flex; justify-content: space-between; align-items: baseline; }
  .company { font-weight: 700; font-size: 1rem; }
  .role { color: #6b7280; font-size: 0.9rem; }
  .period { font-size: 0.85rem; color: #9ca3af; font-family: monospace; }
  ul { margin-top: 8px; padding-left: 20px; }
  li { font-size: 0.9rem; line-height: 1.6; color: #374151; margin-bottom: 4px; }
  .skills { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill { background: #f3f0ff; color: #5b21b6; border-radius: 4px; padding: 4px 10px; font-size: 0.8rem; font-family: monospace; }
  .edu { font-size: 0.9rem; color: #374151; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <h1>${data.name}</h1>
  <div class="title">${data.title}</div>
  <div class="summary">${data.summary}</div>
  <h2>Experience</h2>
  ${(data.experiences || []).map(exp => `
    <div class="job">
      <div class="job-header">
        <div><span class="company">${exp.company}</span> · <span class="role">${exp.role}</span></div>
        <span class="period">${exp.period}</span>
      </div>
      <ul>${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}</ul>
    </div>
  `).join('')}
  <h2>Skills</h2>
  <div class="skills">${(data.skills || []).map(s => `<span class="skill">${s}</span>`).join('')}</div>
  <h2>Education</h2>
  <div class="edu">${data.education}</div>
</body>
</html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Khaled_Melhem_Resume_Tailored.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setResumeLoading(false);
    }
  };

  return (
    <section id="jd-analyzer" className="jda-section">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{l.section}</div>
          <h2>{l.title}</h2>
          <p className="jda-sub">{l.sub}</p>
        </div>

        {!result ? (
          <div className="jda-form-wrap reveal">
            <div className="jda-textarea-wrap">
              <textarea
                className="jda-textarea"
                rows={9}
                placeholder={l.placeholder}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                disabled={loading}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
              <div className="jda-char-count">{jd.length} / 5000</div>
            </div>

            {error && <p className="jda-error">{error}</p>}

            <button
              className={`jda-btn${loading ? ' jda-btn--loading' : ''}`}
              onClick={analyze}
              disabled={loading || !jd.trim()}
            >
              {loading ? (
                <>
                  <span className="jda-spinner" />
                  {l.analyzing}
                </>
              ) : l.btn}
            </button>
          </div>
        ) : (
          <div className="jda-result reveal">
            {/* Score ring */}
            <div className="jda-score-col">
              <ScoreRing score={result.score} />
              <div className="jda-score-label">{l.matchScore}</div>
              {result.headline && (
                <p className="jda-headline">{result.headline}</p>
              )}
            </div>

            {/* Details */}
            <div className="jda-details-col">
              {result.matched?.length > 0 && (
                <div className="jda-block">
                  <h4 className="jda-block-title">{l.matched}</h4>
                  <div className="jda-tags">
                    {result.matched.map((m, i) => (
                      <span key={i} className="jda-tag jda-tag--match">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.gaps?.length > 0 && (
                <div className="jda-block">
                  <h4 className="jda-block-title">{l.gaps}</h4>
                  <div className="jda-tags">
                    {result.gaps.map((g, i) => (
                      <span key={i} className="jda-tag jda-tag--gap">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.talkingPoints?.length > 0 && (
                <div className="jda-block">
                  <h4 className="jda-block-title">{l.talking}</h4>
                  <ol className="jda-talking-list">
                    {result.talkingPoints.map((tp, i) => (
                      <li key={i}>{tp}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="jda-result-footer">
              <span className="jda-disclaimer">{l.disclaimer}</span>
              <button className="jda-try-again" onClick={() => { setResult(null); setJd(''); }}>
                {l.tryAnother}
              </button>
            </div>

            {result && (
              <button className="jda-pdf-btn" onClick={downloadResume} disabled={resumeLoading}>
                {resumeLoading ? 'Generating…' : '⬇ Download Tailored Resume'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default JDAnalyzer;
