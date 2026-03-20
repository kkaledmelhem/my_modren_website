import { useEffect, useRef } from 'react';

const isTouch = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const Cursor = () => {
  const dot  = useRef(null);
  const ring = useRef(null);
  const mouse   = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const raf     = useRef(null);
  const visible = useRef(false);

  useEffect(() => {
    if (isTouch()) return;

    const DOT_SIZE  = 8;
    const RING_SIZE = 36;
    const LERP      = 0.18;   // ring follow speed — higher = snappier

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // dot snaps instantly — no lag
      if (dot.current) {
        dot.current.style.transform =
          `translate(${e.clientX - DOT_SIZE / 2}px, ${e.clientY - DOT_SIZE / 2}px)`;
      }

      // reveal on first move
      if (!visible.current) {
        visible.current = true;
        if (dot.current)  dot.current.style.opacity  = '1';
        if (ring.current) ring.current.style.opacity = '1';
        ringPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const loop = () => {
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * LERP;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * LERP;
      if (ring.current) {
        ring.current.style.transform =
          `translate(${ringPos.current.x - RING_SIZE / 2}px, ${ringPos.current.y - RING_SIZE / 2}px)`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    // grow on interactive elements — use event delegation (works for dynamic DOM)
    const onEnter = (e) => {
      if (e.target.closest('a, button, .skill-card, .project-card, .contact-card')) {
        ring.current?.classList.add('cursor-grow');
      }
    };
    const onLeave = (e) => {
      if (e.target.closest('a, button, .skill-card, .project-card, .contact-card')) {
        ring.current?.classList.remove('cursor-grow');
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover',  onEnter);
    document.addEventListener('mouseout',   onLeave);
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover',  onEnter);
      document.removeEventListener('mouseout',   onLeave);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (isTouch()) return null;

  return (
    <>
      <div ref={dot}  className="cursor-dot"  style={{ opacity: 0 }} />
      <div ref={ring} className="cursor-ring" style={{ opacity: 0 }} />
    </>
  );
};

export default Cursor;
