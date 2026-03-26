import { useState, useEffect } from 'react';
import './QuestionPage.css';

const FALLBACK_RESPONSES = [
  {
    text: "You can — but only if you stay curious enough to keep learning alongside your team.",
    author: "Engineer, Berlin",
  },
  {
    text: "Leadership IS craft. The best leads I've had were still writing code on Fridays.",
    author: "Senior Dev, London",
  },
  {
    text: "The craft becomes your communication language. You lose it, you lose credibility.",
    author: "CTO, Amman",
  },
  {
    text: "I think you have to choose eventually. The question is whether you're at peace with that choice.",
    author: "Staff Eng, Remote",
  },
];

const ARCHIVE = [
  {
    month: "February 2026",
    question: "What's the most dangerous assumption a software team can make?",
  },
  {
    month: "January 2026",
    question: "When does 'good enough' become a liability?",
  },
];

export default function QuestionPage({ onBack }) {
  const [perspective, setPerspective] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchResponses = async () => {
      try {
        const res = await fetch('/api/question/responses');
        if (!res.ok) throw new Error('non-200');
        const data = await res.json();
        if (!cancelled) setResponses(data);
      } catch {
        if (!cancelled) setResponses(FALLBACK_RESPONSES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResponses();
    return () => { cancelled = true; };
  }, []);

  const displayResponses = responses ?? FALLBACK_RESPONSES;

  const handleSubmit = () => {
    if (!perspective.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="qp-page">
      <header className="qp-header">
        <button className="qp-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          Back
        </button>
      </header>

      <main className="qp-body">
        <p className="qp-label">Monthly reflection</p>
        <h1 className="qp-title">The Question I Can't Answer</h1>
        <p className="qp-month">Month: March 2026</p>

        <hr className="qp-rule" />

        <div className="qp-question-block">
          <p className="qp-question-text">
            Is it possible to be a great engineering leader without sacrificing the craft that
            made you love engineering in the first place?
          </p>
          <p className="qp-attribution">— Khaled Melhem, Team Lead @ Robotack</p>
        </div>

        <hr className="qp-rule" />

        <div className="qp-submit-block">
          <p className="qp-prompt-label">What do you think?</p>
          <textarea
            className="qp-textarea"
            placeholder="Share your perspective..."
            value={perspective}
            onChange={(e) => setPerspective(e.target.value)}
            disabled={submitted}
            rows={4}
          />
          <br />
          {!submitted ? (
            <button
              className="qp-submit"
              onClick={handleSubmit}
              disabled={!perspective.trim()}
            >
              Submit anonymously →
            </button>
          ) : (
            <p className="qp-thanks">Thank you. Your perspective has been noted.</p>
          )}
        </div>

        <hr className="qp-rule" />

        <p className="qp-perspectives-title">Perspectives from the community</p>
        <div className="qp-perspective-list">
          {loading ? (
            <p style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: '0.82rem' }}>
              Loading responses…
            </p>
          ) : (
            displayResponses.slice(0, 8).map((r, i) => (
              <div className="qp-perspective" key={i}>
                <p className="qp-perspective-text">"{r.text}"</p>
                <p className="qp-perspective-author">— {r.author}</p>
              </div>
            ))
          )}
        </div>

        <hr className="qp-rule" />

        <div className="qp-nav">
          <button className="qp-nav-btn">← Previous question</button>
          <button className="qp-nav-btn">Next question →</button>
        </div>

        <hr className="qp-rule" />

        <p className="qp-archive-title">Archive</p>
        <ul className="qp-archive-list">
          {ARCHIVE.map((item, i) => (
            <li key={i}>
              <strong>{item.month}:</strong> "{item.question}"
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
