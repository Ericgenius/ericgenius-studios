/* ═══════════════════════════════════════════════════
   ERICGENIUS STUDIOS — script.js v4
   Animated wallpaper engine + scroll interaction
═══════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════
   SCENE CONFIGURATION
   (mapped from actual frame inspection)
══════════════════════════════════════════════ */
const SCENES = [
  { id: 'intro',   startFrame:   1, endFrame:  50, veil: 0.40 },
  { id: 'digital', startFrame:  51, endFrame: 100, veil: 0.48 },
  { id: 'design',  startFrame: 101, endFrame: 160, veil: 0.38 },
  { id: 'media',   startFrame: 161, endFrame: 220, veil: 0.44 },
  { id: 'ai',      startFrame: 221, endFrame: 270, veil: 0.52 },
  { id: 'cta',     startFrame: 271, endFrame: 300, veil: 0.40 },
];

const TOTAL_FRAMES   = 300;
const FRAME_BASE     = 'frames/ezgif-frame-';
const FRAME_EXT      = '.jpg';
const PRELOAD_FIRST  = 30;   /* load before revealing site */
const BATCH_SIZE     = 20;   /* batch size for background loading */

/* ══════════════════════════════════════════════
   WALLPAPER ENGINE
══════════════════════════════════════════════ */
class WallpaperEngine {
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.frames      = new Array(TOTAL_FRAMES + 2).fill(null);
    this.loadedCount = 0;
    this.displayFrame  = 1;   /* currently drawn frame */
    this.targetFrame   = 1;   /* frame we're animating toward */
    this.rafId         = null;
    this.mouseX        = 0.5;
    this.mouseY        = 0.5;
    this.parallaxX     = 0;
    this.parallaxY     = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  framePath(n) {
    return `${FRAME_BASE}${String(n).padStart(3,'0')}${FRAME_EXT}`;
  }

  loadFrame(n) {
    return new Promise(resolve => {
      if (n < 1 || n > TOTAL_FRAMES) { resolve(null); return; }
      if (this.frames[n]) { resolve(this.frames[n]); return; }
      const img = new Image();
      img.onload  = () => { this.frames[n] = img; this.loadedCount++; resolve(img); };
      img.onerror = () => resolve(null); /* fail silently — keep last good frame */
      img.src = this.framePath(n);
    });
  }

  /* Load first N frames, then progressively load the rest */
  async initialLoad(onProgress) {
    const batch1 = [];
    for (let i = 1; i <= PRELOAD_FIRST; i++) batch1.push(this.loadFrame(i));
    let done = 0;
    for (const p of batch1) {
      await p;
      done++;
      if (onProgress) onProgress(done / PRELOAD_FIRST);
    }
    this.startLoop();
    this.loadRestInBackground();
  }

  async loadRestInBackground() {
    for (let i = PRELOAD_FIRST + 1; i <= TOTAL_FRAMES; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE - 1, TOTAL_FRAMES);
      const batch = [];
      for (let j = i; j <= end; j++) batch.push(this.loadFrame(j));
      await Promise.allSettled(batch);
      /* Small yield so the main thread stays responsive */
      await new Promise(r => setTimeout(r, 30));
    }
  }

  /* Snap to a frame immediately (no interpolation) — used for init */
  snapTo(n) {
    this.targetFrame  = this.clamp(n);
    this.displayFrame = this.clamp(n);
    this.drawFrame(this.displayFrame);
  }

  /* Smooth animated transition to target frame */
  goTo(n) {
    this.targetFrame = this.clamp(n);
  }

  clamp(n) {
    return Math.max(1, Math.min(TOTAL_FRAMES, Math.round(n)));
  }

  /* Find the nearest loaded frame to n */
  nearestLoaded(n) {
    if (this.frames[n]) return this.frames[n];
    for (let d = 1; d < 60; d++) {
      if (n - d >= 1           && this.frames[n - d]) return this.frames[n - d];
      if (n + d <= TOTAL_FRAMES && this.frames[n + d]) return this.frames[n + d];
    }
    return null;
  }

  startLoop() {
    if (this.rafId) return;
    const tick = () => {
      /* Smooth frame interpolation */
      const diff = this.targetFrame - this.displayFrame;
      if (Math.abs(diff) > 0.5) {
        this.displayFrame += diff * 0.18;
      } else {
        this.displayFrame = this.targetFrame;
      }

      /* Smooth parallax */
      this.parallaxX += (this.mouseX - 0.5 - this.parallaxX) * 0.04;
      this.parallaxY += (this.mouseY - 0.5 - this.parallaxY) * 0.04;

      this.drawFrame(Math.round(this.displayFrame));
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  drawFrame(n) {
    const img = this.nearestLoaded(n);
    if (!img) return;

    const cv  = this.canvas;
    const ctx = this.ctx;
    const cw  = cv.width;
    const ch  = cv.height;

    /* Cover-fit scaling */
    const iw = img.naturalWidth  || 518;
    const ih = img.naturalHeight || 360;
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;

    /* Parallax offset (max ±12px) */
    const ox = (cw - sw) / 2 + this.parallaxX * 12;
    const oy = (ch - sh) / 2 + this.parallaxY * 12;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, ox, oy, sw, sh);
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setMouse(nx, ny) {
    this.mouseX = nx;
    this.mouseY = ny;
  }
}


/* ══════════════════════════════════════════════
   APP
══════════════════════════════════════════════ */
const canvas     = document.getElementById('wallpaper');
const veil       = document.getElementById('scene-veil');
const loadScreen = document.getElementById('loading-screen');
const loadBar    = document.getElementById('loading-bar');
const loadLabel  = document.getElementById('loading-label');
const journeyEl  = document.getElementById('animation-journey');
const barEl      = document.getElementById('journey-bar');
const scrollHint = document.getElementById('scroll-hint');
const ballHot    = document.getElementById('ball-hotspot');
const cursorGlow = document.getElementById('cursor-glow');

const engine = new WallpaperEngine(canvas);

let currentSceneId = 'intro';
let hasScrolled    = false;
let isHidden       = false;

/* ── SCENE HELPERS ── */
function getSceneByFrame(frame) {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    if (frame >= SCENES[i].startFrame) return SCENES[i];
  }
  return SCENES[0];
}

function getSceneById(id) {
  return SCENES.find(s => s.id === id) || SCENES[0];
}

function getSceneProgress(scene, frame) {
  return Math.max(0, Math.min(1,
    (frame - scene.startFrame) / (scene.endFrame - scene.startFrame)
  ));
}

/* ── UPDATE SCENE UI ── */
function updateScene(scene) {
  if (scene.id === currentSceneId) return;
  currentSceneId = scene.id;

  /* Captions */
  document.querySelectorAll('.scene-caption').forEach(el => {
    el.classList.toggle('active', el.dataset.scene === scene.id);
  });

  /* Dots */
  document.querySelectorAll('.scene-dot').forEach(el => {
    el.classList.toggle('active', el.dataset.scene === scene.id);
  });

  /* Veil opacity */
  veil.style.background = `rgba(0,0,0,${scene.veil})`;

  /* Ball visibility — show after intro starts */
  if (scene.id !== 'intro') {
    ballHot.classList.add('visible');
  }
}

/* ── SCROLL HANDLER ── */
function onScroll() {
  if (!journeyEl) return;

  const journeyTop    = journeyEl.offsetTop;
  const journeyHeight = journeyEl.offsetHeight - window.innerHeight;
  const scrollY       = window.scrollY;
  const progress      = Math.max(0, Math.min(1, (scrollY - journeyTop) / journeyHeight));
  const frame         = Math.round(1 + progress * (TOTAL_FRAMES - 1));

  /* Drive the wallpaper */
  engine.goTo(frame);

  /* Progress bar */
  if (barEl) barEl.style.width = (progress * 100) + '%';

  /* Scene detection */
  const scene = getSceneByFrame(frame);
  updateScene(scene);

  /* Hide scroll hint after first meaningful scroll */
  if (!hasScrolled && scrollY > 80) {
    hasScrolled = true;
    if (scrollHint) scrollHint.classList.add('hidden');
  }

  /* Nav background */
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('scrolled', scrollY > 20);
}

/* ── JUMP TO SCENE ── */
window.jumpToScene = function(sceneId) {
  const scene    = getSceneById(sceneId);
  const midFrame = Math.round((scene.startFrame + scene.endFrame) / 2);
  const progress = (midFrame - 1) / (TOTAL_FRAMES - 1);
  const journeyTop    = journeyEl.offsetTop;
  const journeyHeight = journeyEl.offsetHeight - window.innerHeight;
  const targetY       = journeyTop + progress * journeyHeight;
  window.scrollTo({ top: targetY, behavior: 'smooth' });
};

/* ── BALL CLICK — advance to next scene ── */
let ballSceneIndex = 0;
function onBallClick() {
  ballSceneIndex = (ballSceneIndex + 1) % SCENES.length;
  jumpToScene(SCENES[ballSceneIndex].id);
}
if (ballHot) {
  ballHot.addEventListener('click', onBallClick);
  /* Show initial scene index based on current scene */
  ballHot.addEventListener('click', () => {
    const current = SCENES.findIndex(s => s.id === currentSceneId);
    if (current !== -1) ballSceneIndex = (current + 1) % SCENES.length;
  });
}

/* ── MOUSE PARALLAX ── */
document.addEventListener('mousemove', e => {
  const nx = e.clientX / window.innerWidth;
  const ny = e.clientY / window.innerHeight;
  engine.setMouse(nx, ny);

  /* Cursor glow */
  if (cursorGlow) {
    cursorGlow.style.left    = e.clientX + 'px';
    cursorGlow.style.top     = e.clientY + 'px';
    cursorGlow.style.opacity = '1';
  }
}, { passive: true });

document.addEventListener('mouseleave', () => {
  if (cursorGlow) cursorGlow.style.opacity = '0';
});

/* Mobile pointer: coarse — disable cursor glow */
if (window.matchMedia('(pointer: coarse)').matches) {
  if (cursorGlow) cursorGlow.style.display = 'none';
}

/* ── SCROLL TO TOP ── */
window.scrollToTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ── PAGE VISIBILITY — pause when hidden ── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    engine.stopLoop();
    isHidden = true;
  } else if (isHidden) {
    engine.startLoop();
    isHidden = false;
    onScroll(); /* sync frame to current scroll position */
  }
});

/* ── RESIZE ── */
window.addEventListener('resize', () => {
  engine.resize();
}, { passive: true });

/* ── DRAWERS ── */
const ham     = document.getElementById('hamburger');
const drw     = document.getElementById('drawer');
const drwOvl  = document.getElementById('drawer-overlay');
const drwCls  = document.getElementById('drawer-close');

window.closeDrw = function() {
  drw.classList.remove('open');
  drwOvl.classList.remove('visible');
  document.body.style.overflow = '';
};
if (ham)    ham.addEventListener('click', () => {
  drw.classList.add('open');
  drwOvl.classList.add('visible');
  document.body.style.overflow = 'hidden';
});
if (drwCls) drwCls.addEventListener('click', window.closeDrw);

/* ── SCROLL REVEAL (for content sections below journey) ── */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.transitionDelay = e.target.dataset.delay || '0s';
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.dataset.delay = (i % 6 * 0.07) + 's';
    observer.observe(el);
  });
}

/* ── CARD TILT (desktop only) ── */
function initTilt() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  document.querySelectorAll('.proj-card, .portfolio-card, .svc-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left)  / r.width  - 0.5;
      const y  = (e.clientY - r.top)   / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x*6}deg) rotateX(${-y*6}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ════════════════════════════════════════════════
   BOOT SEQUENCE
════════════════════════════════════════════════ */
async function boot() {
  /* Snap to frame 1 while loading */
  engine.snapTo(1);

  /* Show loading screen */
  if (loadScreen) loadScreen.style.display = 'flex';

  /* Load first batch with progress */
  await engine.initialLoad(p => {
    if (loadBar) loadBar.style.width = (p * 100) + '%';
    if (loadLabel) loadLabel.textContent = `Loading… ${Math.round(p*100)}%`;
  });

  /* Brief hold so progress bar reaches 100% visually */
  if (loadBar) loadBar.style.width = '100%';
  if (loadLabel) loadLabel.textContent = 'Ready!';
  await new Promise(r => setTimeout(r, 400));

  /* Hide loading screen */
  if (loadScreen) {
    loadScreen.classList.add('hidden');
    setTimeout(() => { loadScreen.style.display = 'none'; }, 900);
  }

  /* Activate first scene UI */
  updateScene(SCENES[0]);
  veil.style.background = `rgba(0,0,0,${SCENES[0].veil})`;

  /* Sync to current scroll (in case user scrolled during load) */
  onScroll();

  /* Attach scroll listener */
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Init other features */
  initReveal();
  initTilt();

  /* Show ball hotspot after short delay */
  setTimeout(() => {
    if (ballHot) ballHot.classList.add('visible');
  }, 1800);
}

boot();
