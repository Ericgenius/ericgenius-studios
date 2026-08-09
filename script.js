/* ═══════════════════════════════════════════════════════
   ERICGENIUS STUDIOS — script.js v3
   Adobe-infused cinematic upgrade
═══════════════════════════════════════════════════════ */

/* ── PAGE TRANSITIONS ── */
function showPage(id) {
  const pages  = document.querySelectorAll('.page');
  const target = document.getElementById(id);
  if (!target || target.classList.contains('active')) return;

  pages.forEach(p => {
    if (p.classList.contains('active')) {
      p.classList.remove('active');
      p.classList.add('exit-up');
      setTimeout(() => p.classList.remove('exit-up'), 500);
    }
  });

  setTimeout(() => {
    target.classList.add('active');
    target.scrollTo({ top: 0, behavior: 'instant' });
  }, 80);
}

function openPage2()     { showPage('page-main'); }
function openPortfolio() { showPage('page-portfolio'); }

function scrollToContact() {
  showPage('page-main');
  setTimeout(() => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 380);
}

function openYT(url) { window.open(url, '_blank', 'noopener'); }


/* ── DRAWER 1 ── */
const ham1    = document.getElementById('hamburger');
const drw1    = document.getElementById('drawer');
const ovl1    = document.getElementById('drawer-overlay');
const cls1    = document.getElementById('drawer-close');

function openDrw()  { drw1.classList.add('open'); ovl1.classList.add('visible'); document.body.style.overflow = 'hidden'; }
function closeDrw() { drw1.classList.remove('open'); ovl1.classList.remove('visible'); document.body.style.overflow = ''; }

if (ham1) ham1.addEventListener('click', openDrw);
if (cls1) cls1.addEventListener('click', closeDrw);


/* ── DRAWER 2 ── */
const ham2    = document.getElementById('hamburger2');
const drw2    = document.getElementById('drawer2');
const ovl2    = document.getElementById('drawer-overlay2');
const cls2    = document.getElementById('drawer-close2');

function openDrw2()  { drw2.classList.add('open'); ovl2.classList.add('visible'); document.body.style.overflow = 'hidden'; }
function closeDrw2() { drw2.classList.remove('open'); ovl2.classList.remove('visible'); document.body.style.overflow = ''; }

if (ham2) ham2.addEventListener('click', openDrw2);
if (cls2) cls2.addEventListener('click', closeDrw2);


/* ── DRAWER 3 ── */
const ham3    = document.getElementById('hamburger3');
const drw3    = document.getElementById('drawer3');
const ovl3    = document.getElementById('drawer-overlay3');
const cls3    = document.getElementById('drawer-close3');

function openDrw3()  { drw3.classList.add('open'); ovl3.classList.add('visible'); document.body.style.overflow = 'hidden'; }
function closeDrw3() { drw3.classList.remove('open'); ovl3.classList.remove('visible'); document.body.style.overflow = ''; }

if (ham3) ham3.addEventListener('click', openDrw3);
if (cls3) cls3.addEventListener('click', closeDrw3);


/* ── CURSOR GLOW (desktop only) ── */
(function initCursor() {
  const glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(pointer: coarse)').matches) return;

  let mx = 0, my = 0, cx = 0, cy = 0;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!visible) { glow.style.opacity = '1'; visible = true; }
  });
  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; visible = false; });

  function raf() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(raf);
  }
  raf();
})();


/* ── PARTICLE CANVAS ── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const COLORS = ['#a855f7', '#7c3aed', '#c084fc', '#818cf8', '#6b21a8', '#e879f9'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset = function () {
      this.x       = Math.random() * W;
      this.y       = Math.random() * H;
      this.r       = Math.random() * 1.6 + 0.3;
      this.vx      = (Math.random() - 0.5) * 0.30;
      this.vy      = (Math.random() - 0.5) * 0.30;
      this.alpha   = Math.random() * 0.55 + 0.10;
      this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.life    = 0;
      this.maxLife = Math.random() * 500 + 250;
    };
    this.reset();
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(Math.floor((W * H) / 7000), 130);
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.life++;
      if (p.life > p.maxLife) p.reset();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

      const fade = Math.sin((p.life / p.maxLife) * Math.PI);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * fade;
      ctx.fill();
    });

    /* connecting lines */
    ctx.globalAlpha = 0.035;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        if (dx * dx + dy * dy < 14400) { /* 120² */
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();


/* ── NAV BLUR ON SCROLL ── */
(function initNavScroll() {
  document.querySelectorAll('.page').forEach(page => {
    page.addEventListener('scroll', () => {
      const nav = page.querySelector('.nav');
      if (!nav) return;
      if (page.scrollTop > 20) {
        nav.style.background = 'rgba(6,4,16,0.92)';
        nav.style.boxShadow  = '0 1px 0 rgba(168,85,247,0.15)';
      } else {
        nav.style.background = 'rgba(6,4,16,0.72)';
        nav.style.boxShadow  = 'none';
      }
    });
  });
})();


/* ── SCROLL REVEAL ── */
(function initReveal() {
  const targets = [
    '.about-body p',
    '.service-card',
    '.contact-card',
    '.portfolio-card',
    '.proj-card',
    '.stats-strip .stat',
    '.section-title',
    '.section-badge',
  ];

  document.querySelectorAll(targets.join(',')).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 7) * 0.07 + 's';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.10 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ── CARD TILT (subtle 3-D on hover, desktop) ── */
(function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.proj-card, .portfolio-card, .service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = (e.clientX - r.left) / r.width  - 0.5;
      const y  = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();
