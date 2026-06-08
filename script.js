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
