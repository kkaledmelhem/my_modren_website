import { useState, useEffect } from 'react';
import './BookingCalendar.css';

export default function BookingCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/api/availability')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        setSlots(Array.isArray(data) ? data : data.slots || []);
        setLoading(false);
      })
      .catch(() => {
        setFetchError(true);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setBooking(true);
    setResult(null);
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, slot: selected }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: data.message || 'Booking confirmed! Check your email for the Meet link.' });
        setSelected(null);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setResult({ ok: false, message: data.message || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again later.' });
    } finally {
      setBooking(false);
    }
  };

  return (
    <section className="booking-section reveal" id="schedule">
      <div className="container">
        <div className="section-head">
          <p className="section-tag">09 — Schedule</p>
          <h2>Book a 30-min Call</h2>
          <p className="section-sub">Pick a slot that works for you. I'll send a Google Meet link.</p>
        </div>

        <div className="booking-wrap">
          <div className="booking-slots">
            {loading && (
              <p className="booking-loading">Loading available slots…</p>
            )}
            {!loading && fetchError && (
              <p className="booking-empty">Unable to load slots right now.</p>
            )}
            {!loading && !fetchError && slots.length === 0 && (
              <p className="booking-empty">No slots available at the moment.</p>
            )}
            {!loading && !fetchError && slots.map((slot, i) => {
              const value = typeof slot === 'object' ? slot.slot : slot;
              const display = typeof slot === 'object' ? slot.label : slot;
              return (
                <button
                  key={i}
                  className={`booking-slot-btn${selected === value ? ' active' : ''}`}
                  onClick={() => { setSelected(value); setResult(null); }}
                >
                  {display}
                </button>
              );
            })}
          </div>

          <form className="booking-form" onSubmit={handleSubmit}>
            <input
              className="bk-input"
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="bk-input"
              type="email"
              placeholder="Your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <textarea
              className="bk-input bk-textarea"
              placeholder="Optional message or topic…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="bk-submit"
              type="submit"
              disabled={booking || !selected}
            >
              {booking ? 'Confirming…' : selected ? `Confirm Booking` : 'Select a slot first'}
            </button>
            {result && (
              <div className={`bk-result${result.ok ? ' success' : ' error'}`}>
                {result.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
