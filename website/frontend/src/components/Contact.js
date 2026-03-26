import { useState } from 'react';
import { useApp } from '../App';

const Contact = () => {
  const { t } = useApp();
  const c = t.contact;
  const f = c.form;

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');

  const update = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
        setForm({ name: '', email: '', subject: '', message: '' });
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
    }
  };

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

          <form className="contact-form reveal" onSubmit={submit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="c-name">{f.name}</label>
                <input
                  className="form-input"
                  id="c-name"
                  name="name"
                  type="text"
                  placeholder={f.namePh}
                  value={form.name}
                  onChange={update}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="c-email">{f.email}</label>
                <input
                  className="form-input"
                  id="c-email"
                  name="email"
                  type="email"
                  placeholder={f.emailPh}
                  value={form.email}
                  onChange={update}
                />
              </div>
            </div>
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
            <div className="form-group">
              <label className="form-label" htmlFor="c-msg">{f.message}</label>
              <textarea
                className="form-textarea"
                id="c-msg"
                name="message"
                placeholder={f.messagePh}
                value={form.message}
                onChange={update}
              />
            </div>

            {status === 'success' && <div className="f-ok">{feedback}</div>}
            {status === 'error' && <div className="f-err">{feedback}</div>}

            <button
              className="form-submit"
              type="submit"
              disabled={status === 'loading'}
            >
              <span>{status === 'loading' ? f.sending : f.send}</span>
              <span className="form-submit-arrow">&#8594;</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
