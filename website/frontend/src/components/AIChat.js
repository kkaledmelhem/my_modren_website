import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import './AIChat.css';

const WELCOME = {
  en: "Hi! I'm Khaled's AI assistant. Ask me anything about his experience, skills, or projects.",
  ar: 'مرحباً! أنا المساعد الذكي لخالد. اسألني أي شيء عن خبرته أو مهاراته أو مشاريعه.',
};

const ERROR_MSG = {
  en: "Sorry, I couldn't reach the server right now. Try emailing khadme9@gmail.com directly.",
  ar: 'عذراً، تعذّر الوصول إلى الخادم الآن. يمكنك مراسلة khadme9@gmail.com مباشرة.',
};

const SUGGESTIONS = {
  en: [
    'What does Khaled do?',
    'What are his main skills?',
    'What projects has he built?',
  ],
  ar: [
    'ما هو عمل خالد؟',
    'ما هي مهاراته الرئيسية؟',
    'ما المشاريع التي بناها؟',
  ],
};

/* ── Icons ── */
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const MicIcon = ({ recording }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: recording ? '#ef4444' : 'currentColor' }}>
    <rect x="9" y="1" width="6" height="11" rx="3"/>
    <path d="M19 10a7 7 0 0 1-14 0"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
);

/* ── Web Speech API helpers ── */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

const speak = (text, lang) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
  utt.rate = 1.05;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
};

const AIChat = () => {
  const { lang } = useApp();
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: WELCOME[lang] }]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const recRef     = useRef(null);

  useEffect(() => { setMessages([{ role: 'assistant', text: WELCOME[lang] }]); }, [lang]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  /* Stop synthesis when chat closes */
  useEffect(() => { if (!open) window.speechSynthesis?.cancel(); }, [open]);

  const send = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      if (voiceOn) speak(data.reply, lang);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: ERROR_MSG[lang] }]);
    } finally {
      setLoading(false);
    }
  }, [input, lang, loading, voiceOn]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  /* ── Voice input ── */
  const toggleRecording = () => {
    if (!SpeechRec) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SpeechRec();
    rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput('');
      send(transcript);
    };
    rec.onerror = () => setRecording(false);
    rec.onend   = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const isRtl = lang === 'ar';
  const showSuggestions = messages.length === 1;

  return (
    <>
      {!open && <span className="aichat-pulse-ring" />}

      <button
        className={`aichat-fab${open ? ' aichat-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open
          ? (lang === 'ar' ? 'إغلاق' : 'Close chat')
          : (lang === 'ar' ? 'اسأل عن خالد' : 'Ask about Khaled')}
      >
        {open ? (
          <CloseIcon />
        ) : (
          <>
            <SparkleIcon />
            <span className="aichat-fab-label">
              {lang === 'ar' ? 'اسأل عن خالد' : 'Ask about Khaled'}
            </span>
            <span className="aichat-fab-dot" aria-hidden="true" />
          </>
        )}
      </button>

      <div
        className={`aichat-window${open ? ' aichat-window--open' : ''}${isRtl ? ' aichat-window--rtl' : ''}`}
        role="dialog"
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="aichat-top-bar" aria-hidden="true" />

        <div className="aichat-header">
          <div className="aichat-header-avatar">KM</div>
          <div className="aichat-header-info">
            <span className="aichat-header-title">
              {lang === 'ar' ? 'مساعد خالد' : "Khaled's Assistant"}
            </span>
            <span className="aichat-header-sub">
              <span className="aichat-online-dot" aria-hidden="true" />
              {lang === 'ar' ? 'اسألني أي شيء عن خالد' : 'Ask me anything about Khaled'}
            </span>
          </div>

          <div className="aichat-header-actions">
            {/* Voice toggle */}
            {window.speechSynthesis && (
              <button
                className={`aichat-icon-btn${voiceOn ? ' aichat-icon-btn--active' : ''}`}
                onClick={() => { setVoiceOn((v) => !v); if (voiceOn) window.speechSynthesis.cancel(); }}
                aria-label={voiceOn ? 'Mute voice responses' : 'Enable voice responses'}
                title={voiceOn ? 'Voice: ON' : 'Voice: OFF'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  {voiceOn
                    ? <><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></>
                    : <line x1="23" y1="9" x2="17" y2="15"/>
                  }
                </svg>
              </button>
            )}
            {/* Clear */}
            <button
              className="aichat-icon-btn"
              onClick={() => { window.speechSynthesis?.cancel(); setMessages([{ role: 'assistant', text: WELCOME[lang] }]); }}
              aria-label="Clear conversation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
            {/* Close */}
            <button className="aichat-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="aichat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`aichat-msg aichat-msg--${msg.role}`}>
              {msg.role === 'assistant' && <div className="aichat-msg-avatar">K</div>}
              <div className="aichat-msg-bubble">{msg.text}</div>
            </div>
          ))}

          {showSuggestions && !loading && (
            <div className="aichat-suggestions">
              {SUGGESTIONS[lang].map((s) => (
                <button key={s} className="aichat-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {loading && (
            <div className="aichat-msg aichat-msg--assistant">
              <div className="aichat-msg-avatar">K</div>
              <div className="aichat-msg-bubble aichat-msg-bubble--typing">
                <span className="aichat-dot"/><span className="aichat-dot"/><span className="aichat-dot"/>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div className="aichat-input-row">
          {/* Voice mic button */}
          {SpeechRec && (
            <button
              className={`aichat-mic-btn${recording ? ' aichat-mic-btn--recording' : ''}`}
              onClick={toggleRecording}
              aria-label={recording ? 'Stop recording' : 'Speak your question'}
              title={recording ? 'Listening...' : 'Click to speak'}
              disabled={loading}
            >
              <MicIcon recording={recording} />
            </button>
          )}
          <textarea
            ref={inputRef}
            className="aichat-input"
            rows={1}
            placeholder={recording
              ? (lang === 'ar' ? '🎤 أستمع…' : '🎤 Listening…')
              : (lang === 'ar' ? 'اسأل عن خالد…' : 'Ask about Khaled…')
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading || recording}
          />
          <button
            className="aichat-send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim() || recording}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChat;
