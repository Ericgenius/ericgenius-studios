/* ═══════════════════════════════════════════════════
   ERICGENIUS STUDIOS — script.js
═══════════════════════════════════════════════════ */

/* ── PAGE TRANSITIONS ── */
function showPage(id) {
  const pages = document.querySelectorAll('.page');
  const target = document.getElementById(id);
  if (!target || target.classList.contains('active')) return;

  pages.forEach(p => {
    if (p.classList.contains('active')) {
      p.classList.remove('active');
      p.classList.add('exit-up');
      setTimeout(() => p.classList.remove('exit-up'), 600);
    }
  });

  setTimeout(() => {
    target.classList.add('active');
    target.scrollTo({ top: 0, behavior: 'instant' });
  }, 80);
}

function openPage2()      { showPage('page-main'); }
function openPortfolio()  { showPage('page-portfolio'); }

function scrollToContact() {
  showPage('page-main');
  setTimeout(() => {
    const el = document.getElementById('contact-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 350);
}

function openYT(url) { window.open(url, '_blank', 'noopener'); }


/* ── DRAWER 1 ── */
const ham1     = document.getElementById('hamburger');
const drw1     = document.getElementById('drawer');
const drwOvl1  = document.getElementById('drawer-overlay');
const drwCls1  = document.getElementById('drawer-close');

function openDrw()  { drw1.classList.add('open'); drwOvl1.classList.add('visible'); }
function closeDrw() { drw1.classList.remove('open'); drwOvl1.classList.remove('visible'); }

if (ham1)    ham1.addEventListener('click', openDrw);
if (drwCls1) drwCls1.addEventListener('click', closeDrw);


/* ── DRAWER 2 ── */
const ham2     = document.getElementById('hamburger2');
const drw2     = document.getElementById('drawer2');
const drwOvl2  = document.getElementById('drawer-overlay2');
const drwCls2  = document.getElementById('drawer-close2');

function openDrw2()  { drw2.classList.add('open'); drwOvl2.classList.add('visible'); }
function closeDrw2() { drw2.classList.remove('open'); drwOvl2.classList.remove('visible'); }

if (ham2)    ham2.addEventListener('click', openDrw2);
if (drwCls2) drwCls2.addEventListener('click', closeDrw2);


/* ── DRAWER 3 ── */
const ham3     = document.getElementById('hamburger3');
const drw3     = document.getElementById('drawer3');
const drwOvl3  = document.getElementById('drawer-overlay3');
const drwCls3  = document.getElementById('drawer-close3');

function openDrw3()  { drw3.classList.add('open'); drwOvl3.classList.add('visible'); }
function closeDrw3() { drw3.classList.remove('open'); drwOvl3.classList.remove('visible'); }

if (ham3)    ham3.addEventListener('click', openDrw3);
if (drwCls3) drwCls3.addEventListener('click', closeDrw3);


/* ── PARTICLE CANVAS (landing page) ── */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const COLORS = ['#a855f7', '#7c3aed', '#c084fc', '#818cf8', '#6b21a8'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function Particle() {
    this.reset = function() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.6 + 0.15;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.life  = 0;
      this.maxLife = Math.random() * 400 + 200;
    };
    this.reset();
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(Math.floor((W * H) / 8000), 120);
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

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      const fade = Math.sin((p.life / p.maxLife) * Math.PI);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * fade;
      ctx.fill();
    });

    /* subtle connecting lines */
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
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

  window.addEventListener('resize', () => { resize(); });
  init();
  draw();
})();


/* ── SCROLL-REVEAL (IntersectionObserver) ── */
(function initReveal() {
  const style = document.createElement('style');
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);

  const targets = [
    '.about-body p',
    '.service-card',
    '.contact-card',
    '.portfolio-card',
    '.stats-strip .stat',
    '.section-title',
    '.section-badge',
  ];

  document.querySelectorAll(targets.join(',')).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = (i % 6) * 0.07 + 's';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();
