import { useState, useRef, useEffect, useCallback } from 'react';
import './GestureNav.css';

/* ─────────────────────────────────────────
   MediaPipe CDN Loader
───────────────────────────────────────── */
const loadMediaPipe = () => {
  return new Promise((resolve, reject) => {
    if (window.HandLandmarker) { resolve(); return; }
    // Check if vision bundle is already loading
    if (window.__mpLoading) {
      window.__mpLoadCallbacks = window.__mpLoadCallbacks || [];
      window.__mpLoadCallbacks.push(resolve);
      return;
    }
    window.__mpLoading = true;
    window.__mpLoadCallbacks = [resolve];
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/vision_bundle.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.__mpLoading = false;
      (window.__mpLoadCallbacks || []).forEach(cb => cb());
      window.__mpLoadCallbacks = [];
    };
    script.onerror = () => {
      window.__mpLoading = false;
      reject(new Error('Failed to load MediaPipe'));
    };
    document.head.appendChild(script);
  });
};

/* ─────────────────────────────────────────
   Gesture Detection Helpers
───────────────────────────────────────── */
const isPinch = (landmarks) => {
  const dx = landmarks[4].x - landmarks[8].x;
  const dy = landmarks[4].y - landmarks[8].y;
  return Math.sqrt(dx * dx + dy * dy) < 0.05;
};

const isOpenPalm = (landmarks) => {
  // All four fingertips (8,12,16,20) y < their MCP joints (5,9,13,17)
  return [0, 1, 2, 3].every(i => landmarks[8 + i * 4].y < landmarks[5 + i * 4].y);
};

const isFist = (landmarks) => {
  // All four fingertips y > their PIP joints (6,10,14,18)
  return [0, 1, 2, 3].every(i => landmarks[8 + i * 4].y > landmarks[6 + i * 4].y);
};

/* ─────────────────────────────────────────
   Navigation Helpers
───────────────────────────────────────── */
const getSections = () => Array.from(document.querySelectorAll('section[id]'));

const getCurrentSectionIndex = (sections) =>
  sections.findIndex(s => {
    const rect = s.getBoundingClientRect();
    return rect.top >= -100 && rect.top < window.innerHeight / 2;
  });

const navigateNext = () => {
  const sections = getSections();
  const idx = getCurrentSectionIndex(sections);
  const next = sections[Math.min(idx + 1, sections.length - 1)];
  next?.scrollIntoView({ behavior: 'smooth' });
};

const navigatePrev = () => {
  const sections = getSections();
  const idx = getCurrentSectionIndex(sections);
  const prev = sections[Math.max(idx - 1, 0)];
  prev?.scrollIntoView({ behavior: 'smooth' });
};

/* ─────────────────────────────────────────
   Draw hand skeleton on canvas
───────────────────────────────────────── */
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

const drawSkeleton = (ctx, landmarks, color, w, h) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  CONNECTIONS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  });
  landmarks.forEach(lm => {
    ctx.beginPath();
    ctx.arc(lm.x * w, lm.y * h, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
};

const GESTURE_COLORS = {
  pinch: '#a78bfa',
  openPalm: '#34d399',
  fist: '#f87171',
  swipeLeft: '#60a5fa',
  swipeRight: '#fb923c',
  idle: '#94a3b8',
};

/* ─────────────────────────────────────────
   Icons
───────────────────────────────────────── */
const HandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V7a2 2 0 0 0-4 0v4"/>
    <path d="M14 10V5a2 2 0 0 0-4 0v5"/>
    <path d="M10 9.9V4a2 2 0 0 0-4 0v10"/>
    <path d="M6 14v1a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6V8a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const Spinner = () => (
  <svg className="gesture-spinner" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

/* ─────────────────────────────────────────
   Gesture Guide Card
───────────────────────────────────────── */
const GESTURE_GUIDE = [
  { icon: '🤏', label: 'Pinch', desc: 'Thumb + index finger close → Click' },
  { icon: '👋', label: 'Swipe Left', desc: 'Open hand moving left → Next section' },
  { icon: '👋', label: 'Swipe Right', desc: 'Open hand moving right → Previous section' },
  { icon: '🖐', label: 'Open Palm', desc: 'All fingers up, hand still → Pause animations' },
  { icon: '✊', label: 'Fist', desc: 'All fingers down → Scroll down' },
];

const GestureGuide = ({ onDismiss }) => (
  <div className="gesture-guide" role="dialog" aria-label="Gesture navigation guide">
    <div className="gesture-guide__header">
      <span className="gesture-guide__title">Gesture Controls</span>
      <button className="gesture-guide__close" onClick={onDismiss} aria-label="Dismiss guide">
        <CloseIcon />
      </button>
    </div>
    <ul className="gesture-guide__list">
      {GESTURE_GUIDE.map(({ icon, label, desc }) => (
        <li key={label} className="gesture-guide__item">
          <span className="gesture-guide__icon">{icon}</span>
          <span className="gesture-guide__text">
            <strong>{label}</strong>
            <span>{desc}</span>
          </span>
        </li>
      ))}
    </ul>
    <p className="gesture-guide__privacy">
      <span className="gesture-guide__privacy-dot" /> Local only &bull; No data sent
    </p>
  </div>
);

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
const GestureNav = () => {
  const [active, setActive]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [gesture, setGesture]         = useState(null);
  const [feedback, setFeedback]       = useState('');
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [previewHidden, setPreviewHidden]     = useState(false);
  const [showGuide, setShowGuide]     = useState(false);
  const [guideShown, setGuideShown]   = useState(false);

  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const handLandmarkerRef = useRef(null);
  const streamRef        = useRef(null);
  const rafRef           = useRef(null);
  const wristHistoryRef  = useRef([]);   // last 10 wrist x positions
  const lastGestureRef   = useRef(null); // debounce repeated gestures
  const gestureTimeRef   = useRef(0);
  const feedbackTimerRef = useRef(null);
  const pausedRef        = useRef(false);

  /* ── Show feedback overlay for 1.5s ── */
  const showFeedback = useCallback((text) => {
    setFeedback(text);
    setFeedbackVisible(true);
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedbackVisible(false), 1500);
  }, []);

  /* ── Debounce gesture actions (500ms cooldown) ── */
  const canTrigger = (gestureKey) => {
    const now = Date.now();
    if (lastGestureRef.current === gestureKey && now - gestureTimeRef.current < 500) return false;
    lastGestureRef.current = gestureKey;
    gestureTimeRef.current = now;
    return true;
  };

  /* ── Handle a detected gesture ── */
  const handleGesture = useCallback((detectedGesture, landmarks) => {
    setGesture(detectedGesture);

    if (detectedGesture === 'openPalm') {
      if (canTrigger('openPalm')) {
        if (!pausedRef.current) {
          pausedRef.current = true;
          document.dispatchEvent(new CustomEvent('gesture-pause'));
          showFeedback('🖐 Open Palm — Animations Paused');
        } else {
          pausedRef.current = false;
          document.dispatchEvent(new CustomEvent('gesture-resume'));
          showFeedback('🖐 Open Palm — Animations Resumed');
        }
      }
      return;
    }

    if (detectedGesture === 'fist') {
      if (canTrigger('fist')) {
        window.scrollBy({ top: 200, behavior: 'smooth' });
        showFeedback('✊ Fist — Scrolling Down');
      }
      return;
    }

    if (detectedGesture === 'pinch') {
      if (canTrigger('pinch') && landmarks) {
        // Simulate a click at the index fingertip position
        const tip = landmarks[8];
        const el = document.elementFromPoint(
          tip.x * window.innerWidth,
          tip.y * window.innerHeight
        );
        if (el && el !== document.body && el !== document.documentElement) {
          el.click();
        }
        showFeedback('🤏 Pinch — Click');
      }
      return;
    }

    if (detectedGesture === 'swipeLeft') {
      if (canTrigger('swipeLeft')) {
        navigateNext();
        showFeedback('← Swipe Left — Next Section');
      }
      return;
    }

    if (detectedGesture === 'swipeRight') {
      if (canTrigger('swipeRight')) {
        navigatePrev();
        showFeedback('→ Swipe Right — Previous Section');
      }
    }
  }, [showFeedback]);

  /* ── Detect swipe from wrist history ── */
  const detectSwipe = (wristX) => {
    const history = wristHistoryRef.current;
    history.push(wristX);
    if (history.length > 10) history.shift();
    if (history.length < 6) return null;
    const delta = history[history.length - 1] - history[0];
    if (delta < -0.12) return 'swipeLeft';
    if (delta > 0.12) return 'swipeRight';
    return null;
  };

  /* ── Main detection loop ── */
  const runDetection = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const now = performance.now();
    let result;
    try {
      result = landmarker.detectForVideo(video, now);
    } catch {
      rafRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      const wristX = landmarks[0].x;

      // Determine gesture priority: swipe > pinch > openPalm > fist
      const swipe = detectSwipe(wristX);
      let detected = null;
      let color = GESTURE_COLORS.idle;

      if (swipe) {
        detected = swipe;
        color = swipe === 'swipeLeft' ? GESTURE_COLORS.swipeLeft : GESTURE_COLORS.swipeRight;
      } else if (isPinch(landmarks)) {
        detected = 'pinch';
        color = GESTURE_COLORS.pinch;
      } else if (isOpenPalm(landmarks)) {
        detected = 'openPalm';
        color = GESTURE_COLORS.openPalm;
      } else if (isFist(landmarks)) {
        detected = 'fist';
        color = GESTURE_COLORS.fist;
      }

      // Draw skeleton on preview
      drawSkeleton(ctx, landmarks, color, canvas.width, canvas.height);

      if (detected) {
        handleGesture(detected, landmarks);
      } else {
        setGesture(null);
      }
    } else {
      wristHistoryRef.current = [];
      setGesture(null);
    }

    rafRef.current = requestAnimationFrame(runDetection);
  }, [handleGesture]);

  /* ── Start gesture navigation ── */
  const startGestureNav = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load MediaPipe
      await loadMediaPipe();

      const { HandLandmarker, FilesetResolver } = window;
      if (!HandLandmarker || !FilesetResolver) {
        throw new Error('MediaPipe tasks-vision not available');
      }

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      handLandmarkerRef.current = landmarker;
      setActive(true);
      setLoading(false);

      // Show guide on first activation
      if (!guideShown) {
        setShowGuide(true);
        setGuideShown(true);
      }

      rafRef.current = requestAnimationFrame(runDetection);
    } catch (err) {
      setLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access needed for gesture navigation');
      } else if (err.message.includes('MediaPipe') || err.message.includes('Failed to load')) {
        setError('Gesture nav unavailable in this browser');
      } else {
        setError('Could not start gesture navigation');
      }
    }
  }, [runDetection, guideShown]);

  /* ── Stop gesture navigation ── */
  const stopGestureNav = useCallback(() => {
    cancelAnimationFrame(rafRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (handLandmarkerRef.current) {
      try { handLandmarkerRef.current.close(); } catch {}
      handLandmarkerRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    wristHistoryRef.current = [];
    lastGestureRef.current = null;
    pausedRef.current = false;
    setActive(false);
    setGesture(null);
    setFeedback('');
    setFeedbackVisible(false);
    setError('');
  }, []);

  /* ── Toggle ── */
  const handleToggle = useCallback(() => {
    if (active) {
      stopGestureNav();
    } else {
      startGestureNav();
    }
  }, [active, startGestureNav, stopGestureNav]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(feedbackTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (handLandmarkerRef.current) {
        try { handLandmarkerRef.current.close(); } catch {}
      }
    };
  }, []);

  /* ─────────────────────────────────────────
     Render
  ───────────────────────────────────────── */
  return (
    <>
      {/* ── Webcam Preview (bottom-left) ── */}
      {active && (
        <div
          className={`gesture-preview${previewHidden ? ' gesture-preview--hidden' : ''}${gesture ? ' gesture-preview--active' : ''}`}
          aria-label="Webcam preview for gesture navigation"
        >
          <video
            ref={videoRef}
            className="gesture-preview__video"
            muted
            playsInline
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            className="gesture-preview__canvas"
            width={120}
            height={90}
          />
          <div className="gesture-preview__footer">
            <span className="gesture-preview__privacy">
              <span className="gesture-preview__dot" /> Local only &bull; No data sent
            </span>
            <button
              className="gesture-preview__toggle"
              onClick={() => setPreviewHidden(h => !h)}
              aria-label={previewHidden ? 'Show webcam preview' : 'Hide webcam preview'}
            >
              {previewHidden ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
          {gesture && (
            <div className={`gesture-preview__badge gesture-preview__badge--${gesture}`}>
              {gesture === 'pinch'      && '🤏'}
              {gesture === 'openPalm'   && '🖐'}
              {gesture === 'fist'       && '✊'}
              {gesture === 'swipeLeft'  && '←'}
              {gesture === 'swipeRight' && '→'}
            </div>
          )}
        </div>
      )}

      {/* Hidden video for when preview is not yet mounted but camera starts */}
      {!active && (
        <video
          ref={videoRef}
          className="gesture-video-hidden"
          muted
          playsInline
          aria-hidden="true"
        />
      )}

      {/* ── Gesture Feedback Overlay (center-bottom) ── */}
      <div
        className={`gesture-feedback${feedbackVisible ? ' gesture-feedback--visible' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </div>

      {/* ── Gesture Guide ── */}
      {showGuide && (
        <GestureGuide onDismiss={() => setShowGuide(false)} />
      )}

      {/* ── Error Message ── */}
      {error && (
        <div className="gesture-error" role="alert">
          <span>{error}</span>
          <button
            className="gesture-error__close"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* ── Activation Button (fixed bottom-right) ── */}
      <button
        className={`gesture-fab${active ? ' gesture-fab--active' : ''}${loading ? ' gesture-fab--loading' : ''}`}
        onClick={handleToggle}
        disabled={loading}
        aria-label={active ? 'Disable gesture navigation' : 'Enable gesture navigation'}
        aria-pressed={active}
        title="Gesture Navigation"
      >
        {loading ? (
          <>
            <Spinner />
            <span className="gesture-fab__label">Loading…</span>
          </>
        ) : (
          <>
            <HandIcon />
            <span className="gesture-fab__label">
              {active ? 'Gesture On' : 'Gesture Mode'}
            </span>
            {active && <span className="gesture-fab__dot" aria-hidden="true" />}
          </>
        )}
      </button>
    </>
  );
};

export default GestureNav;
