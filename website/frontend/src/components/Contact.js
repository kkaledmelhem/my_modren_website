import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../App';

/* ── Email validation helper ── */
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Contact = () => {
  const { t } = useApp();
  const c = t.contact;
  const f = c.form;

  const [form, setForm]           = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus]       = useState(null); // null | 'loading' | 'success' | 'error'
  const [feedback, setFeedback]   = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  /* ── Inline validation state ── */
  const [nameError, setNameError]       = useState('');
  const [emailValid, setEmailValid]     = useState(null); // null | true | false
  const [msgError, setMsgError]         = useState('');

  /* ── Email debounce ref ── */
  const emailDebounceRef = useRef(null);

  /* ── Character counter ── */
  const msgLen = form.message.length;
  const msgCountColor =
    msgLen >= 4800 ? '#f87171' :
    msgLen >= 4000 ? '#fb923c' :
    'var(--muted)';

  /* ── Field change handler ── */
  const update = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    /* Live email validation with 500 ms debounce */
    if (name === 'email') {
      setEmailValid(null);
      clearTimeout(emailDebounceRef.current);
      emailDebounceRef.current = setTimeout(() => {
        if (value.trim()) setEmailValid(isValidEmail(value));
      }, 500);
    }
  }, []);

  /* ── Blur validators ── */
  const handleNameBlur = () => {
    if (form.name.trim().length > 0 && form.name.trim().length < 2)
      setNameError('Name must be at least 2 characters.');
    else
      setNameError('');
  };

  const handleMsgBlur = () => {
    if (form.message.trim().length > 0 && form.message.trim().length < 10)
      setMsgError('Message must be at least 10 characters.');
    else
      setMsgError('');
  };

  /* ── Cleanup debounce on unmount ── */
  useEffect(() => {
    return () => clearTimeout(emailDebounceRef.current);
  }, []);

  /* ── Submit ── */
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      setFeedback(f.errorMsg);
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setFeedback(data.message || f.successMsg);
        setShowSuccess(true);
        setForm({ name: '', email: '', subject: '', message: '' });
        setEmailValid(null);
        /* Fire-and-forget analytics */
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'contact_submit', data: 'contact_form' }),
        });
        setTimeout(() => setStatus(null), 3000);
      } else {
        throw new Error('Server error');
      }
    } catch {
      window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(
        form.subject || 'Website Contact'
      )}&body=${encodeURIComponent(
        'Name: ' + form.name + '\nEmail: ' + form.email + '\n\n' + form.message
      )}`;
      setStatus('success');
      setFeedback(f.fallbackMsg);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  /* ── Derived button label & style ── */
  const btnLabel = (() => {
    if (status === 'loading') return f.sending;
    if (status === 'success') return 'Sent! ✓';
    if (status === 'error')   return 'Failed — Try Again';
    return f.send;
  })();

  const btnStyle = (() => {
    if (status === 'success') return { background: '#34d399' };
    if (status === 'error')   return { background: '#f87171' };
    return {};
  })();

  return (
    <section id="contact" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="contact-section-bg" />
      <div className="container">
        <div className="contact-inner">
          <div className="reveal">
            <div className="label" style={{ marginBottom: '0.8rem' }}>{c.section}</div>
            <h2 className="contact-title">
              {c.title.split('\n')[0]}
              <br />
              {c.title.split('\n')[1]}
            </h2>
            <p className="contact-response-time">&#9679; Usually responds within 24h</p>
            <p className="contact-body">{c.body}</p>
            <div className="contact-cards">
              <a className="contact-card" href={`mailto:${c.email}`}>
                <div className="cc-icon-wrap" style={{ '--cc-color': '#8b7cf8' }}>
                  <span className="cc-icon">✉️</span>
                </div>
                <div>
                  <div className="cc-label">Email</div>
                  <div className="cc-value">{c.email}</div>
                </div>
              </a>
              <a
                className="contact-card"
                href={`https://${c.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cc-icon-wrap" style={{ '--cc-color': '#25d366' }}>
                  <span className="cc-icon">💬</span>
                </div>
                <div>
                  <div className="cc-label">WhatsApp</div>
                  <div className="cc-value">{c.phone}</div>
                </div>
              </a>
              <a
                className="contact-card"
                href={`tel:${c.phone.replace(/\s/g, '')}`}
              >
                <div className="cc-icon-wrap" style={{ '--cc-color': '#34d399' }}>
                  <span className="cc-icon">📞</span>
                </div>
                <div>
                  <div className="cc-label">Phone</div>
                  <div className="cc-value">{c.phone}</div>
                </div>
              </a>
              <a
                className="contact-card"
                href={`https://${c.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cc-icon-wrap" style={{ '--cc-color': '#0077b5' }}>
                  <span className="cc-icon">💼</span>
                </div>
                <div>
                  <div className="cc-label">LinkedIn</div>
                  <div className="cc-value">{c.linkedin}</div>
                </div>
              </a>
              <a
                className="contact-card"
                href={`https://${c.github}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cc-icon-wrap" style={{ '--cc-color': '#6e7681' }}>
                  <span className="cc-icon">🐙</span>
                </div>
                <div>
                  <div className="cc-label">GitHub</div>
                  <div className="cc-value">{c.github}</div>
                </div>
              </a>
            </div>
          </div>

          <div className="contact-form-wrap reveal">
            <form className="contact-form" onSubmit={submit} noValidate>
              <div className="form-row">
                {/* Name field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="c-name">{f.name}</label>
                  <input
                    className={`form-input${nameError ? ' form-input--err' : ''}`}
                    id="c-name"
                    name="name"
                    type="text"
                    placeholder={f.namePh}
                    value={form.name}
                    onChange={update}
                    onBlur={handleNameBlur}
                  />
                  {nameError && <span className="field-error">{nameError}</span>}
                </div>

                {/* Email field with inline indicator */}
                <div className="form-group">
                  <label className="form-label" htmlFor="c-email">{f.email}</label>
                  <div className="input-indicator-wrap">
                    <input
                      className={`form-input${emailValid === false ? ' form-input--err' : emailValid === true ? ' form-input--ok' : ''}`}
                      id="c-email"
                      name="email"
                      type="email"
                      placeholder={f.emailPh}
                      value={form.email}
                      onChange={update}
                    />
                    {emailValid === true  && <span className="input-indicator input-indicator--ok"  aria-label="Valid email">✓</span>}
                    {emailValid === false && <span className="input-indicator input-indicator--err" aria-label="Invalid email">✗</span>}
                  </div>
                  {emailValid === false && (
                    <span className="field-error">Please enter a valid email address.</span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="form-label" htmlFor="c-subject">{f.subject}</label>
                <input
                  className="form-input"
                  id="c-subject"
                  name="subject"
                  type="text"
                  placeholder={f.subjectPh}
                  value={form.subject}
                  onChange={update}
                />
              </div>

              {/* Message with character counter */}
              <div className="form-group">
                <label className="form-label" htmlFor="c-msg">{f.message}</label>
                <textarea
                  className={`form-textarea${msgError ? ' form-input--err' : ''}`}
                  id="c-msg"
                  name="message"
                  placeholder={f.messagePh}
                  value={form.message}
                  onChange={update}
                  onBlur={handleMsgBlur}
                  maxLength={5000}
                />
                <div className="msg-counter" style={{ color: msgCountColor }}>
                  {msgLen}/5000
                </div>
                {msgError && <span className="field-error">{msgError}</span>}
              </div>

              {status === 'error' && <div className="f-err">{feedback}</div>}

              <button
                className="form-submit"
                type="submit"
                disabled={status === 'loading'}
                style={btnStyle}
              >
                {status === 'loading' && (
                  <span className="form-spinner" aria-hidden="true" />
                )}
                <span>{btnLabel}</span>
                {status !== 'loading' && status !== 'success' && status !== 'error' && (
                  <span className="form-submit-arrow">&#8594;</span>
                )}
              </button>
            </form>

            {/* Success card */}
            {showSuccess && (
              <div className="contact-success-card" role="status">
                <span className="contact-success-icon">🎉</span>
                <div className="contact-success-text">
                  <strong>Message received!</strong>
                  <span> I'll get back to you within 24 hours.</span>
                </div>
                <button
                  className="contact-success-dismiss"
                  onClick={() => setShowSuccess(false)}
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
