import { services } from './data.js';
import { CATS, CAT_ORDER, CAT_SOON, COMBO, tierPrice, priceHTML } from './plans.js';
import { cop } from './pricing.js';
import { icons } from './icons.js';
import { initQuote } from './quote.js';
import { supabase } from './supabase.js';
import { initShowcase } from './showcase.js';
import { initPlanner } from './planner.js';
import { WHATSAPP_NUMBER, HAS_WHATSAPP, EMAIL, INSTAGRAM } from './config.js';

// Render services & packages
document.getElementById('services').innerHTML = services.filter((s) => ['code', 'brand', 'search'].includes(s.icon)).sort((x, y) => ['code', 'brand', 'search'].indexOf(x.icon) - ['code', 'brand', 'search'].indexOf(y.icon)).map((s, i) => `
  <article class="service glass reveal ${['code', 'brand', 'search'].includes(s.icon) ? '' : 'soon'}" style="--d:${i * 90}ms">
    <div class="icon">${icons[s.icon]}</div>${['code', 'brand', 'search'].includes(s.icon) ? '<span class="soon-tag on">Disponible</span>' : '<span class="soon-tag">Próximamente</span>'}
    <h3>${s.title}</h3>
    <ul>${s.items.map((it) => `<li>${it}</li>`).join('')}</ul>${s.price ? `<p class="svc-price"><b>${s.price}</b> pago único</p>` : ''}${s.sample ? `<a class="svc-sample" href="${s.sample}" target="_blank" rel="noopener">Ver ejemplo en PDF</a>` : ''}
  </article>`).join('');

// Plans by category (tabs) + combo
const PLAN_TABS = CAT_ORDER.length > 1 ? [...CAT_ORDER, 'combo'] : CAT_ORDER;
const pkgEl = document.getElementById('packages');
function renderPlans(active = 'web') {
  const tabs = `<div class="plan-tabs vision" role="tablist">${PLAN_TABS.map((k) => `<button role="tab" class="${k === active ? 'on' : ''}" data-tab="${k}">${k === 'combo' ? `${icons.sparkles}Varias cosas juntas` : `${icons[CATS[k].icon]}${CATS[k].label}`}</button>`).join('')}</div>`;
  let body;
  if (active === 'combo') {
    const mid = CAT_ORDER.map((k) => CATS[k].tiers.find((t) => t.featured));
    const sum = mid.reduce((s, t) => s + tierPrice(t).total, 0);
    body = `<div class="combo-grid">
      ${[[2, 'Dos cosas juntas', 'Por ejemplo, página web y logo', 'Una sola persona se encarga de que todo combine.'], [3, 'Todo junto', 'Página, logo y publicidad', 'Nos encargamos de todo tu negocio, de principio a fin.']].filter(([n]) => n <= CAT_ORDER.length).map(([n, name, sub, ex], i) => `
        <article class="package glass reveal ${n === 3 ? 'featured' : ''}" style="--d:${i * 120}ms">
          <div class="package-top"><div class="icon">${icons[n === 3 ? 'sparkles' : 'layers']}</div><span class="tag">Premium</span></div>
          <h3>${name}</h3><p class="muted">${sub}. ${ex}</p>
          ${n === CAT_ORDER.length ? `<p class="combo-example">Ej: ${mid.map((t) => t.name).join(' + ')}<br><b>${cop(sum * (1 + COMBO[n]))}</b> con la coordinación incluida</p>` : ''}
          <a href="#contacto" class="btn ${n === 3 ? '' : 'btn-ghost'}" data-pkg="combo">Quiero varias cosas</a>
        </article>`).join('')}
    </div>`;
  } else {
    body = `<p class="plan-cat-desc muted">${CATS[active].desc}</p><div class="packages-grid">${CATS[active].tiers.map((t, i) => { const p = tierPrice(t); return `
      <article class="package glass reveal ${t.featured ? 'featured' : ''}" style="--d:${i * 120}ms">
        <div class="package-top"><div class="icon">${icons[CATS[active].icon]}</div><span class="tag">${t.tag}</span></div>
        <h3>${t.name}</h3>
        <p class="price">${priceHTML(p, cop)}</p>
        <ul>${t.items.map((it) => `<li>${icons.check}${it}</li>`).join('')}</ul>
        <a href="#contacto" class="btn ${t.featured ? '' : 'btn-ghost'}" data-pkg="${t.id}">Quiero este</a>
      </article>`; }).join('')}</div>`;
  }
  pkgEl.innerHTML = tabs + `<div class="plan-body">${body}</div>`;
  pkgEl.querySelectorAll('.reveal').forEach((el) => requestAnimationFrame(() => el.classList.add('in')));
  pkgEl.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => renderPlans(b.dataset.tab)));
}
renderPlans();
document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icons[el.dataset.icon]; });
// Guided quote wizard: every "Cotizar" button opens it
let quoteStep = -1;
const quote = initQuote({ onStep: (i) => { quoteStep = i; dispatchEvent(new Event('scene:kick')); } });
initPlanner(document.getElementById('planner'), (preset) => quote.open(preset));
// Direct link: /#cotizar opens the quote wizard (also /#cotizar=web-pro to preselect a plan)
const openFromHash = () => { const m = location.hash.match(/^#cotizar(?:=([\w-]+))?$/); if (m) quote.open(m[1]); };
addEventListener('hashchange', openFromHash);
setTimeout(openFromHash, 300);
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-quote], [data-pkg]');
  if (!t) return;
  e.preventDefault();
  nav.classList.remove('open');
  quote.open(t.dataset.pkg);
});

// Phones get a lighter, calmer experience: no 3D, no reveal/scroll animations
const LITE = matchMedia('(max-width: 720px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('lite', LITE);

initShowcase();

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal, .reveal-scale, .mask').forEach((el) => io.observe(el));

// Chapters: rail + active tracking
const chapters = [...document.querySelectorAll('.chapter')];
const rail = document.getElementById('rail');
const RAIL_ICONS = { inicio: 'home', proyectos: 'monitor', manifiesto: 'sparkles', servicios: 'layers', plantillas: 'code', paquetes: 'globe', presupuesto: 'target', proceso: 'file', auditoria: 'search', faq: 'chat', nosotros: 'user', contacto: 'send' };
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
// On phones the guided pill only shows when scrolling stops, so it never covers buttons while reading
if (matchMedia('(max-width: 720px)').matches) {
  let idle;
  addEventListener('scroll', () => {
    nextBtn.classList.add('scrolling');
    clearTimeout(idle);
    idle = setTimeout(() => nextBtn.classList.remove('scrolling'), 900);
  }, { passive: true });
}
document.body.dataset.chapter = active;
onScroll();

// 3D scene (lazy so the page paints first)
if (!LITE) import('./scene.js').then(({ initScene }) => initScene(document.getElementById('scene3d'), () => (quoteStep >= 0 ? `q${quoteStep}` : active)));

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

// Contact buttons + floating WhatsApp (only the ones with real data)
{
  const wa = HAS_WHATSAPP ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola Jerónimo! Vi tu página y quiero saber más.')}` : '';
  const links = [
    wa && `<a class="glass" href="${wa}" target="_blank" rel="noopener"><i>${icons.whatsapp}</i>WhatsApp</a>`,
    INSTAGRAM && `<a class="glass" href="https://instagram.com/${INSTAGRAM}" target="_blank" rel="noopener"><i>${icons.instagram}</i>@${INSTAGRAM}</a>`,
    EMAIL && `<a class="glass" href="mailto:${EMAIL}"><i>${icons.mail}</i>${EMAIL}</a>`,
  ].filter(Boolean);
  const el = document.getElementById('contactLinks');
  if (el) el.innerHTML = links.join('');
  if (wa) document.body.insertAdjacentHTML('beforeend', `<a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="Escríbeme por WhatsApp">${icons.whatsapp}<span>¿Hablamos?</span></a>`);
}

// ---------- Pestañas: el inicio muestra solo lo necesario, el resto va en su propia vista ----------
{
  const VIEWS = {
    inicio: ['inicio', 'servicios', 'auditoria', 'proyectos'],
    precios: ['paquetes', 'presupuesto'],
    ejemplos: ['plantillas'],
    'como-trabajo': ['proceso', 'faq'],
    'quien-soy': ['nosotros'],
  };
  const ALWAYS = ['contacto'];
  const viewOf = (id) => Object.keys(VIEWS).find((v) => VIEWS[v].includes(id)) || 'inicio';
  let current = null;
  function show(view) {
    if (view === current) return false;
    current = view;
    chapters.forEach((c) => c.classList.toggle('view-off', !(VIEWS[view].includes(c.id) || ALWAYS.includes(c.id))));
    document.querySelectorAll('.nav-links a[href^="#/"]').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === `#/${view === 'inicio' ? '' : view}`));
    document.body.dataset.view = view;
    dispatchEvent(new Event('resize'));
    return true;
  }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (/^cotizar/.test(h)) return;                          // lo maneja el cotizador
    if (h.startsWith('/') || !h) { show(VIEWS[h.slice(1)] ? h.slice(1) : 'inicio'); scrollTo({ top: 0 }); return; }
    const el = document.getElementById(h);
    if (!el || !el.classList.contains('chapter')) return;
    const changed = show(viewOf(h));
    if (changed && !ALWAYS.includes(h) && VIEWS[viewOf(h)][0] === h) scrollTo({ top: 0 });
    else requestAnimationFrame(() => el.scrollIntoView({ behavior: changed ? 'auto' : 'smooth', block: 'start' }));
  }
  addEventListener('hashchange', route);
  route();
}

// Pedido de auditoría → llega como solicitud al panel
{
  const form = document.getElementById('auditForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    const msg = form.querySelector('.audit-msg');
    if (!fd.name?.trim() || (fd.phone || '').replace(/\D/g, '').length < 7 || !fd.url?.trim()) { msg.textContent = 'Me falta tu nombre, tu WhatsApp o la dirección de tu página.'; return; }
    if (!fd.consent) { msg.textContent = 'Marca la casilla de privacidad para poder enviarlo.'; return; }
    const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Enviando…';
    const url = fd.url.trim();
    const lead = {
      id: crypto.randomUUID(), created_at: new Date().toISOString(),
      name: fd.name.trim().slice(0, 100), email: '', phone: fd.phone.trim().slice(0, 30), business: (fd.business || '').trim().slice(0, 120),
      service: 'Auditoría web', template: null, details: null,
      message: [`• Página: ${url}`, fd.business && `• Negocio: ${fd.business}`, fd.notes && `• Qué le preocupa: ${fd.notes}`].filter(Boolean).join('\n'),
    };
    try {
      if (!supabase) throw new Error('Supabase no configurado');
      const { error } = await supabase.from('leads').insert(lead);
      if (error) throw error;
      form.innerHTML = `<div class="audit-done"><b>¡Listo, ${lead.name.split(' ')[0]}!</b><p>Ya tengo tu pedido. Reviso tu página y te escribo a tu WhatsApp con la auditoría.</p></div>`;
    } catch (err) {
      console.error(err); msg.textContent = 'Uy, algo falló. ¿Lo intentas otra vez?'; btn.disabled = false; btn.textContent = 'Pedir mi auditoría · $100.000';
    }
  });
}
