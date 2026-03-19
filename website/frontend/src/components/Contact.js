import { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [feedback, setFeedback] = useState('');

  const update = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('error');
      setFeedback('Please fill in your name, email, and message.');
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
        setFeedback(data.message || 'Message sent! I\'ll get back to you soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Server error');
      }
    } catch {
      // Fallback: open mailto
      window.location.href = `mailto:khaled@melhem.dev?subject=${encodeURIComponent(
        form.subject || 'Website Contact'
      )}&body=${encodeURIComponent(
        'Name: ' + form.name + '\nEmail: ' + form.email + '\n\n' + form.message
      )}`;
      setStatus('success');
      setFeedback('Opening your email client...');
    }
  };

  return (
    <section id="contact">
      <div className="container">
        <div className="contact-inner">

          <div className="reveal">
            <div className="label" style={{ marginBottom: '0.8rem' }}>
              06 — Contact
            </div>
            <h2 className="contact-title">
              Let's build
              <br />
              something <em>great</em>
            </h2>
            <p className="contact-body">
              Whether you're a company in Germany looking for a backend
              engineer, a team that needs Java expertise, or just want to talk
              architecture — I'd love to hear from you.
            </p>
            <div className="contact-cards">
              <a className="contact-card" href="mailto:khaled@melhem.dev">
                <div className="cc-icon">✉️</div>
                <div>
                  <div className="cc-label">Email</div>
                  <div className="cc-value">khaled@melhem.dev</div>
                </div>
              </a>
              <a
                className="contact-card"
                href="https://linkedin.com/in/khaledmelhem"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cc-icon">💼</div>
                <div>
                  <div className="cc-label">LinkedIn</div>
                  <div className="cc-value">linkedin.com/in/khaledmelhem</div>
                </div>
              </a>
              <a
                className="contact-card"
                href="https://github.com/khaledmelhem"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cc-icon">🐙</div>
                <div>
                  <div className="cc-label">GitHub</div>
                  <div className="cc-value">github.com/khaledmelhem</div>
                </div>
              </a>
            </div>
          </div>

          <form className="contact-form reveal" onSubmit={submit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="c-name">Name</label>
              <input
                className="form-input"
                id="c-name"
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={update}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-email">Email</label>
              <input
                className="form-input"
                id="c-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-subject">Subject</label>
              <input
                className="form-input"
                id="c-subject"
                name="subject"
                type="text"
                placeholder="Backend Engineer role in Berlin"
                value={form.subject}
                onChange={update}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-msg">Message</label>
              <textarea
                className="form-textarea"
                id="c-msg"
                name="message"
                placeholder="Tell me about the opportunity..."
                value={form.message}
                onChange={update}
              />
            </div>

            {status === 'success' && (
              <div className="form-success">{feedback}</div>
            )}
            {status === 'error' && (
              <div className="form-error">{feedback}</div>
            )}

            <button
              className="form-submit"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Sending…' : 'Send message →'}
            </button>
          </form>

        </div>
      </div>
    </section>
  );
};

export default Contact;
