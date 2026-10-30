import { services, packages } from './data.js';
import { supabase } from './supabase.js';

// Render services & packages
document.getElementById('services').innerHTML = services.map((s, i) => `
  <article class="service glass reveal" style="--d:${i * 80}ms">
    <div class="service-icon">${s.icon}</div>
    <h3>${s.title}</h3>
    <ul>${s.items.map((it) => `<li>${it}</li>`).join('')}</ul>
  </article>`).join('');

document.getElementById('packages').innerHTML = packages.map((p, i) => `
  <article class="package glass reveal ${p.featured ? 'featured' : ''}" style="--d:${i * 100}ms">
    <span class="tag">${p.tag}</span>
    <h3>Paquete ${p.name}</h3>
    <p class="muted">${p.desc}</p>
    <ul>${p.items.map((it) => `<li>${it}</li>`).join('')}</ul>
    <a href="#contacto" class="btn ${p.featured ? '' : 'btn-ghost'}" data-pkg="Paquete ${p.name}">Cotizar paquete</a>
  </article>`).join('');

document.querySelectorAll('[data-pkg]').forEach((a) =>
  a.addEventListener('click', () => { document.querySelector('select[name=service]').value = a.dataset.pkg; })
);

// Reveal on scroll (Apple-style ease)
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-scale').forEach((el) => io.observe(el));

// Scroll-scrubbed text (word by word highlight)
const scrub = document.getElementById('scrub');
scrub.innerHTML = scrub.textContent.split(' ').map((w) => `<span>${w}</span>`).join(' ');
const words = scrub.querySelectorAll('span');

// Nav state + scrub + parallax in one rAF loop
const nav = document.getElementById('nav');
const orbs = document.querySelectorAll('.orb');
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 20);
  const r = scrub.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4)));
  const lit = Math.floor(p * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  orbs.forEach((o, i) => { o.style.translate = `0 ${y * (0.1 + i * 0.06)}px`; });
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
onScroll();

// 3D hero (lazy-loaded so the page paints first)
import('./scene.js').then(({ initHeroScene }) => initHeroScene(document.getElementById('hero3d')));

// 3D tilt on cards
if (matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.service, .package, .step, .device').forEach((el) => {
    el.classList.add('tilt');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${-y * 10}deg`);
      el.style.setProperty('--ry', `${x * 12}deg`);
      el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
}

// Mobile menu
const burger = document.getElementById('burger');
burger.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

// Form -> Supabase
const form = document.getElementById('quoteForm');
const status = document.getElementById('formStatus');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (data.website) return; // honeypot
  delete data.website;
  const btn = form.querySelector('button');
  btn.disabled = true; status.textContent = 'Enviando…'; status.className = 'form-status';
  try {
    if (!supabase) throw new Error('Supabase no configurado');
    const { error } = await supabase.from('leads').insert(data);
    if (error) throw error;
    form.reset();
    status.textContent = '¡Listo! Te contactaremos muy pronto.'; status.classList.add('ok');
  } catch (err) {
    console.error(err);
    status.textContent = 'No se pudo enviar. Escríbenos por WhatsApp.'; status.classList.add('err');
  } finally { btn.disabled = false; }
});

document.getElementById('year').textContent = new Date().getFullYear();
