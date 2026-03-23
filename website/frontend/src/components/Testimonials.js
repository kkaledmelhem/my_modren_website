import { useRef, useState, useEffect } from 'react';
import { useApp } from '../App';
import './Testimonials.css';

const TESTIMONIALS_EN = [
  {
    id: 1,
    name: 'Ahmad Al-Rawi',
    title: 'CTO, Robotack',
    avatar: 'AR',
    avatarColor: 'var(--accent)',
    quote: "Khaled architected our entire Robochat platform from the ground up. His ability to lead the team while still being hands-on with the most critical backend decisions is rare. He delivered a system handling tens of thousands of daily interactions without missing a beat.",
  },
  {
    id: 2,
    name: 'Sara Mansour',
    title: 'Product Manager, Umniah',
    avatar: 'SM',
    avatarColor: 'var(--teal)',
    quote: "Working with Khaled on our chatbot integration was seamless. He understood the business requirements immediately and translated them into a robust, scalable solution. The WhatsApp and Instagram integrations he built are rock-solid in production.",
  },
  {
    id: 3,
    name: 'Omar Khalil',
    title: 'Senior Engineer, Robotack',
    avatar: 'OK',
    avatarColor: 'var(--blue)',
    quote: "As a peer engineer, I watched Khaled take ownership of the legacy modernization project — migrating from Java 8 to Java 21 — with zero production downtime. His architectural decisions were thoughtful and his code reviews made the whole team better.",
  },
  {
    id: 4,
    name: 'Lina Haddad',
    title: 'Full-Stack Developer, Robotack',
    avatar: 'LH',
    avatarColor: '#f59e0b',
    quote: "Khaled is the kind of lead who unblocks you. Whenever I had a question about API design or database modeling, he had a clear, reasoned answer. His documentation of the REST contracts saved us countless hours of back-and-forth.",
  },
];

const TESTIMONIALS_AR = [
  {
    id: 1,
    name: 'أحمد الراوي',
    title: 'المدير التقني، Robotack',
    avatar: 'أر',
    avatarColor: 'var(--accent)',
    quote: 'بنى خالد منصة Robochat بالكامل من الصفر. قدرته على قيادة الفريق مع البقاء حاضراً في أحرج القرارات التقنية نادرة. سلّم نظاماً يعالج عشرات الآلاف من التفاعلات اليومية بلا أي خلل.',
  },
  {
    id: 2,
    name: 'سارة منصور',
    title: 'مديرة منتج، أمنية',
    avatar: 'سم',
    avatarColor: 'var(--teal)',
    quote: 'التعاون مع خالد على تكامل الشات بوت كان سلساً تماماً. استوعب متطلبات العمل فوراً وترجمها إلى حل قوي وقابل للتوسع. تكاملات WhatsApp وInstagram التي بناها صامدة في الإنتاج.',
  },
  {
    id: 3,
    name: 'عمر خليل',
    title: 'مهندس أول، Robotack',
    avatar: 'عخ',
    avatarColor: 'var(--blue)',
    quote: 'شاهدت خالد يتولى مشروع تحديث النظام القديم — الانتقال من Java 8 إلى Java 21 — بلا أي توقف في الإنتاج. قراراته المعمارية كانت مدروسة ومراجعاته للكود رفعت مستوى الفريق بأكمله.',
  },
  {
    id: 4,
    name: 'لينا حداد',
    title: 'مطورة فول-ستاك، Robotack',
    avatar: 'لح',
    avatarColor: '#f59e0b',
    quote: 'خالد من النوع الذي يرفع الحواجز عنك. كلما كان لديّ سؤال عن تصميم API أو نمذجة قاعدة البيانات، كانت إجابته واضحة ومبررة. توثيقه لعقود REST وفّر علينا ساعات لا تُحصى.',
  },
];

const StarRating = () => (
  <div className="tm-stars" aria-label="5 stars">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ))}
  </div>
);

const Testimonials = () => {
  const { t, lang } = useApp();
  const s = t.testimonials;
  const items = lang === 'ar' ? TESTIMONIALS_AR : TESTIMONIALS_EN;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  const go = (idx) => setActive((idx + items.length) % items.length);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => setActive((p) => (p + 1) % items.length), 5000);
    return () => clearInterval(intervalRef.current);
  }, [paused, items.length]);

  return (
    <section id="testimonials" className="tm-section">
      <div className="container">
        <div className="section-head reveal">
          <div className="label">{s.section}</div>
          <h2>{s.title}</h2>
        </div>

        <div
          className="tm-slider"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="tm-track">
            {items.map((item, i) => (
              <div key={item.id} className={`tm-card${i === active ? ' tm-card--active' : ''}`} aria-hidden={i !== active}>
                <div className="tm-quote-icon" aria-hidden="true">"</div>
                <StarRating />
                <p className="tm-quote">{item.quote}</p>
                <div className="tm-author">
                  <div className="tm-avatar" style={{ background: item.avatarColor }}>{item.avatar}</div>
                  <div>
                    <div className="tm-name">{item.name}</div>
                    <div className="tm-role">{item.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="tm-arrow tm-arrow--prev" onClick={() => go(active - 1)} aria-label={s.prev}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="tm-arrow tm-arrow--next" onClick={() => go(active + 1)} aria-label={s.next}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <div className="tm-dots" role="tablist">
            {items.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                className={`tm-dot${i === active ? ' tm-dot--active' : ''}`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
