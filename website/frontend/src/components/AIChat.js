import { useState, useRef, useEffect } from 'react';
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

const AIChat = () => {
  const { lang } = useApp();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: WELCOME[lang] }]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([{ role: 'assistant', text: WELCOME[lang] }]);
  }, [lang]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  const send = async () => {
    const text = input.trim();
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
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: ERROR_MSG[lang] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isRtl = lang === 'ar';

  return (
    <>
      <button
        className={`aichat-fab${open ? ' aichat-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? (lang === 'ar' ? 'إغلاق' : 'Close chat') : (lang === 'ar' ? 'تحدث مع AI' : 'Chat with AI')}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      <div
        className={`aichat-window${open ? ' aichat-window--open' : ''}${isRtl ? ' aichat-window--rtl' : ''}`}
        role="dialog"
        aria-modal="true"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="aichat-header">
          <div className="aichat-header-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div className="aichat-header-info">
            <span className="aichat-header-title">{lang === 'ar' ? 'AI خالد' : "Khaled's AI"}</span>
            <span className="aichat-header-sub">{lang === 'ar' ? 'اسألني أي شيء' : 'Ask me anything'}</span>
          </div>
          <div className="aichat-header-actions">
            <button className="aichat-icon-btn" onClick={() => setMessages([{ role: 'assistant', text: WELCOME[lang] }])} aria-label="Clear">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
            <button className="aichat-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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
          <textarea
            ref={inputRef}
            className="aichat-input"
            rows={1}
            placeholder={lang === 'ar' ? 'اسأل عن خالد…' : 'Ask about Khaled…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button className="aichat-send-btn" onClick={send} disabled={loading || !input.trim()} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChat;