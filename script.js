// Nav scroll behavior
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// Mobile menu
if (navToggle) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// Active nav link
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-up');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

// ── Lightbox for expertise visuals ───────────────────────────────────────────
(function () {
  const visuals = document.querySelectorAll('.expertise-detail-visual');
  if (!visuals.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Expanded view');
  overlay.innerHTML = `
    <button class="lightbox-close-btn" aria-label="Close">&#x2715;</button>
    <div class="lightbox-inner-content"></div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.lightbox-close-btn');
  const innerContent = overlay.querySelector('.lightbox-inner-content');
  let lastFocused;

  function open(visual) {
    lastFocused = document.activeElement;
    const src = visual.querySelector('.expertise-detail-visual-inner');
    innerContent.innerHTML = src ? src.innerHTML : '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  visuals.forEach(v => {
    v.setAttribute('tabindex', '0');
    v.setAttribute('role', 'button');
    v.setAttribute('aria-haspopup', 'dialog');
    v.addEventListener('click', () => open(v));
    v.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(v); }
    });
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}());

// ── Hero particle background ──────────────────────────────────────────────────
(function () {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Honour reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext('2d');
  const isMobile = () => window.innerWidth < 768;
  let particles = [];
  let raf;

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  function Particle(initial) {
    this.reset(initial);
  }

  Particle.prototype.reset = function (initial) {
    this.x       = Math.random() * canvas.width;
    this.y       = initial ? Math.random() * canvas.height : canvas.height + 10;
    this.r       = Math.random() * 1.6 + 0.4;       // radius 0.4–2px
    this.speed   = Math.random() * 0.35 + 0.08;     // slow upward drift
    this.drift   = (Math.random() - 0.5) * 0.25;    // slight horizontal sway
    this.alpha   = Math.random() * 0.38 + 0.08;     // very subtle
    this.glow    = this.r > 1.2;                    // larger particles glow
  };

  Particle.prototype.update = function () {
    this.y -= this.speed;
    this.x += this.drift;
    if (this.y < -10) this.reset(false);
  };

  Particle.prototype.draw = function () {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    if (this.glow) {
      ctx.shadowColor = '#C4A35A';
      ctx.shadowBlur  = this.r * 5;
    }
    ctx.fillStyle = '#C4A35A';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  function init() {
    resize();
    const count = isMobile() ? 35 : 70;
    particles = Array.from({ length: count }, () => new Particle(true));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(animate);
  }

  // Pause when hero scrolls out of view (performance)
  const heroObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!raf) raf = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }, { threshold: 0 });
  heroObserver.observe(hero);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      raf = null;
      init();
      raf = requestAnimationFrame(animate);
    }, 200);
  });

  init();
  raf = requestAnimationFrame(animate);
}());

// Contact form — POST to backend API
// After deploying the backend, replace this URL with your live API URL.
const BACKEND_URL = 'http://localhost:3000';

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const original = btn.textContent;

    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    contactForm.name.value,
          email:   contactForm.email.value,
          phone:   contactForm.phone.value,
          company: contactForm.company.value,
          service: contactForm.service.value,
          details: contactForm.details.value,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        btn.textContent = 'Enquiry Sent';
        btn.style.background = '#1A1714';
        btn.style.color = '#C4A35A';
        const msg = document.createElement('p');
        msg.textContent = data.message;
        msg.style.cssText = 'color:#C4A35A;margin-top:1rem;font-size:0.875rem;';
        contactForm.appendChild(msg);
        contactForm.reset();
      } else {
        const errors = data.errors || [data.error || 'Something went wrong.'];
        alert(Array.isArray(errors) ? errors.join('\n') : errors);
        btn.textContent = original;
        btn.disabled = false;
      }
    } catch {
      alert('Network error — please check your connection and try again.');
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}
