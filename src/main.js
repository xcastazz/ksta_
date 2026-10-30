import { services, packages } from './data.js';
import { icons } from './icons.js';
import { initQuote } from './quote.js';
import { initShowcase } from './showcase.js';
import { WHATSAPP_NUMBER } from './config.js';

// Render services & packages
document.getElementById('services').innerHTML = services.map((s, i) => `
  <article class="service glass reveal" style="--d:${i * 90}ms">
    <div class="icon">${icons[s.icon]}</div>
    <h3>${s.title}</h3>
    <ul>${s.items.map((it) => `<li>${it}</li>`).join('')}</ul>
  </article>`).join('');

document.getElementById('packages').innerHTML = packages.map((p, i) => `
  <article class="package glass reveal ${p.featured ? 'featured' : ''}" style="--d:${i * 120}ms">
    <div class="package-top"><div class="icon">${icons[p.icon]}</div><span class="tag">${p.tag}</span></div>
    <h3>${p.pkg || `Paquete ${p.name}`}</h3>
    <p class="muted">${p.desc}</p>
    <ul>${p.items.map((it) => `<li>${icons.check}${it}</li>`).join('')}</ul>
    <a href="#contacto" class="btn ${p.featured ? '' : 'btn-ghost'}" data-pkg="${p.pkg || `Paquete ${p.name}`}">Cotizar paquete</a>
  </article>`).join('');

document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icons[el.dataset.icon]; });
// Guided quote wizard: every "Cotizar" button opens it
let quoteStep = -1;
const quote = initQuote({ onStep: (i) => { quoteStep = i; dispatchEvent(new Event('scene:kick')); } });
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-quote], [data-pkg]');
  if (!t) return;
  e.preventDefault();
  nav.classList.remove('open');
  quote.open(t.dataset.pkg);
});

initShowcase();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-scale, .mask').forEach((el) => io.observe(el));

// Chapters: rail + active tracking
const chapters = [...document.querySelectorAll('.chapter')];
const rail = document.getElementById('rail');
const RAIL_ICONS = { inicio: 'home', proyectos: 'monitor', manifiesto: 'sparkles', servicios: 'layers', plantillas: 'code', paquetes: 'globe', proceso: 'file', nosotros: 'user', contacto: 'send' };
rail.className = 'dock vision';
rail.innerHTML = chapters.map((c) =>
  `<a href="#${c.id}" data-id="${c.id}" aria-label="${c.dataset.title}"><span class="dock-icon">${icons[RAIL_ICONS[c.id]]}</span><span class="dock-tip">${c.dataset.title}</span></a>`
).join('');
const railLinks = [...rail.querySelectorAll('a')];
const nextBtn = document.getElementById('nextBtn');
const nextTitle = document.getElementById('nextTitle');
let active = 'inicio';

function setActive(id) {
  if (id === active) return;
  active = id;
  document.body.dataset.chapter = id;
  chapters.forEach((c) => c.classList.toggle('is-active', c.id === id));
  railLinks.forEach((a) => a.classList.toggle('active', a.dataset.id === id));
  const idx = chapters.findIndex((c) => c.id === id);
  const next = chapters[idx + 1];
  nextBtn.classList.toggle('hidden', !next);
  if (next) { nextBtn.href = `#${next.id}`; nextTitle.textContent = next.dataset.title; }
}

// Scroll-driven bits in one rAF
const scrub = document.getElementById('scrub');
scrub.innerHTML = scrub.textContent.split(' ').map((w) => `<span>${w}</span>`).join(' ');
const words = scrub.querySelectorAll('span');
const nav = document.getElementById('nav');
const bar = document.getElementById('progressBar');
const timeline = document.querySelector('.process');
const timelineFill = document.getElementById('timelineFill');
let ticking = false;

function onScroll() {
  const y = scrollY;
  nav.classList.toggle('scrolled', y > 20);
  bar.style.transform = `scaleX(${y / (document.documentElement.scrollHeight - innerHeight)})`;

  let current = chapters[0].id;
  for (const c of chapters) if (c.getBoundingClientRect().top < innerHeight * 0.5) current = c.id;
  setActive(current);

  // Per-chapter depth transition: sections tilt in/out like cards in 3D space
  chapters.forEach((c) => {
    const r = c.getBoundingClientRect();
    const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
    c.style.setProperty('--p', p.toFixed(3));
  });

  const r = scrub.getBoundingClientRect();
  const sp = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.4)));
  const lit = Math.floor(sp * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < lit));

  const tr = timeline.getBoundingClientRect();
  timelineFill.style.transform = `scaleX(${Math.min(1, Math.max(0, (innerHeight * 0.8 - tr.top) / tr.height))})`;
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
document.body.dataset.chapter = active;
onScroll();

// 3D scene (lazy so the page paints first)
import('./scene.js').then(({ initScene }) => initScene(document.getElementById('scene3d'), () => (quoteStep >= 0 ? `q${quoteStep}` : active)));

// 3D tilt + glare on cards
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

// Use the configured WhatsApp number everywhere
document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => { a.href = `https://wa.me/${WHATSAPP_NUMBER}`; });

document.getElementById('year').textContent = new Date().getFullYear();
