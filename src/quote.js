import { icons } from './icons.js';
import { supabase } from './supabase.js';
import { WHATSAPP_NUMBER } from './config.js';

const SERVICES = {
  branding: { label: 'Branding e identidad', icon: 'brand' },
  web: { label: 'Web y software', icon: 'code' },
  audiovisual: { label: 'Fotografía y video', icon: 'video' },
  marketing: { label: 'Marketing digital', icon: 'megaphone' },
  print: { label: 'Publicidad física', icon: 'sign' },
};

const PLANS = [
  { id: 'emprendimiento', label: 'Paquete Emprendimiento', desc: 'Estoy empezando mi negocio', icon: 'rocket', services: ['branding', 'web', 'marketing'] },
  { id: 'presencia', label: 'Paquete Presencia Digital', desc: 'Quiero destacar en internet', icon: 'globe', services: ['branding', 'web', 'audiovisual', 'marketing'] },
  { id: 'integral', label: 'Paquete Negocio Integral', desc: 'Quiero una imagen completa', icon: 'building', services: ['branding', 'web', 'audiovisual', 'marketing', 'print'] },
  { id: 'custom', label: 'Plan a mi medida', desc: 'Elijo yo los servicios', icon: 'sparkles', services: [] },
];

// Question sets per service (single = one choice, multi = several)
const DETAILS = {
  branding: [
    { key: 'logo', q: '¿Cómo está tu logo hoy?', type: 'single', opts: ['No tengo logo', 'Tengo, quiero rediseñarlo', 'Tengo, solo necesito la identidad'] },
    { key: 'piezas', q: '¿Qué piezas necesitas?', type: 'multi', opts: ['Logo', 'Manual de marca', 'Tarjetas y papelería', 'Empaques / etiquetas', 'Piezas para redes', 'Mockups'] },
  ],
  web: [
    { key: 'tipo', q: '¿Qué tipo de sitio necesitas?', type: 'single', opts: ['Landing page', 'Web corporativa', 'Portafolio', 'Catálogo', 'Tienda virtual', 'Sistema / software a medida'] },
    { key: 'funciones', q: '¿Qué funciones debe tener?', type: 'multi', opts: ['Formulario de contacto', 'Botón de WhatsApp', 'Reservas / citas', 'Pagos en línea', 'Blog', 'Panel administrativo'] },
    { key: 'dominio', q: '¿Tienes dominio (tunegocio.com)?', type: 'single', opts: ['Sí, ya tengo', 'No, necesito uno', 'No sé qué es'] },
    { key: 'demo', q: '¿Quieres ver primero una demo con plantilla?', type: 'single', opts: ['Sí, quiero ver una demo', 'No, directo al proyecto'] },
  ],
  audiovisual: [
    { key: 'contenido', q: '¿Qué contenido necesitas?', type: 'multi', opts: ['Fotografía de producto', 'Fotografía corporativa', 'Video publicitario', 'Reels para redes', 'Video institucional', 'Cobertura de evento'] },
    { key: 'frecuencia', q: '¿Con qué frecuencia?', type: 'single', opts: ['Una sola vez', 'Mensual', 'Por campaña'] },
  ],
  marketing: [
    { key: 'acciones', q: '¿Qué te gustaría hacer?', type: 'multi', opts: ['Contenido para redes', 'Campañas en Meta Ads', 'Lanzamiento de marca/producto', 'Promociones y ventas', 'Estrategia completa'] },
    { key: 'pauta', q: 'Presupuesto mensual para anuncios', type: 'single', opts: ['Aún no sé', 'Bajo', 'Medio', 'Alto'] },
  ],
  print: [
    { key: 'impresos', q: '¿Qué material físico necesitas?', type: 'multi', opts: ['Letrero / aviso', 'Afiches', 'Pendones / banners', 'Vinilos y adhesivos', 'Señalización', 'Tarjetas y material promocional', 'Branding del local'] },
  ],
};

const STYLES = ['Minimalista', 'Elegante', 'Moderno', 'Divertido', 'Corporativo', 'Natural', 'Atrevido', 'Clásico'];
const TIMING = ['Lo antes posible', 'En 2–4 semanas', 'En 1–2 meses', 'Sin prisa'];
const BUDGET = ['Aún no lo sé', 'Básico', 'Intermedio', 'Completo / premium'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initQuote({ onStep }) {
  const root = document.createElement('div');
  root.className = 'quote';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Cotizador guiado');
  root.innerHTML = `
    <div class="quote-top">
      <span class="logo">Ksta<span class="cursor">_</span> <small class="mono muted">cotizador</small></span>
      <div class="quote-dots" id="qDots"></div>
      <button class="quote-close" id="qClose" aria-label="Cerrar">✕</button>
    </div>
    <div class="quote-stage" id="qStage"></div>
    <div class="quote-nav">
      <button class="btn btn-ghost" id="qBack">← Atrás</button>
      <span class="mono muted" id="qCount"></span>
      <button class="btn" id="qNext">Continuar →</button>
    </div>`;
  document.body.appendChild(root);

  const $ = (id) => root.querySelector(id);
  const stage = $('#qStage'), dots = $('#qDots'), back = $('#qBack'), next = $('#qNext'), count = $('#qCount');
  let state, steps, idx, busy = false;

  const reset = () => {
    state = { plan: null, services: [], details: {}, business: {}, style: [], timing: null, budget: null, contact: {} };
    idx = 0;
  };

  function buildSteps() {
    steps = ['plan', 'services', ...state.services.map((s) => `detail:${s}`), 'business', 'style', 'timing', 'contact', 'summary'];
  }

  // ---------- step renderers ----------
  const choice = (name, opts, selected, multi, withIcons) => `
    <div class="choices ${withIcons ? 'big' : ''}">${opts.map((o, i) => {
      const val = typeof o === 'string' ? o : o.id;
      const on = multi ? selected.includes(val) : selected === val;
      return `<button type="button" class="choice glass ${on ? 'on' : ''}" data-name="${name}" data-val="${esc(val)}" data-multi="${multi ? 1 : 0}" style="--i:${i}">
        ${withIcons ? `<span class="icon">${icons[o.icon]}</span><b>${esc(o.label)}</b><small>${esc(o.desc || '')}</small>` : `<span class="tick">${icons.check}</span>${esc(val)}`}
      </button>`;
    }).join('')}</div>`;

  const head = (eyebrow, title, sub = '') =>
    `<p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${sub ? `<p class="muted q-sub">${sub}</p>` : ''}`;

  const R = {
    plan: () => head('// paso 1', '¿Qué estás buscando?', 'Elige un paquete o arma tu plan a la medida.') +
      choice('plan', PLANS, state.plan, false, true),
    services: () => head('// servicios', 'Arma tu combinación.', state.plan === 'custom' ? 'Selecciona todo lo que necesites.' : 'Ya marcamos lo que incluye tu paquete. Agrega o quita lo que quieras.') +
      choice('services', Object.entries(SERVICES).map(([id, s]) => ({ id, ...s, desc: '' })), state.services, true, true),
    detail: (svc) => head(`// ${SERVICES[svc].label.toLowerCase()}`, `Cuéntanos sobre ${SERVICES[svc].label.toLowerCase()}.`) +
      DETAILS[svc].map((d) => `<div class="q-block"><h3>${d.q}</h3>${choice(`d:${svc}:${d.key}`, d.opts, (state.details[svc] || {})[d.key] ?? (d.type === 'multi' ? [] : null), d.type === 'multi')}</div>`).join(''),
    business: () => head('// tu negocio', 'Preséntanos tu negocio.') + `
      <div class="fields">
        <label>Nombre del negocio<input data-f="business.name" value="${esc(state.business.name)}" maxlength="120" placeholder="Ej: Café Aurora" /></label>
        <label>¿A qué se dedica?<input data-f="business.sector" value="${esc(state.business.sector)}" maxlength="120" placeholder="Ej: cafetería de especialidad" /></label>
        <label>Ciudad<input data-f="business.city" value="${esc(state.business.city)}" maxlength="80" /></label>
        <label>Instagram o web actual (si tienes)<input data-f="business.link" value="${esc(state.business.link)}" maxlength="200" placeholder="@tunegocio" /></label>
      </div>`,
    style: () => head('// estilo', '¿Cómo quieres que se sienta tu marca?', 'Elige hasta 3 estilos.') +
      choice('style', STYLES, state.style, true) + `
      <div class="fields one"><label>Colores o referencias que te gusten<textarea data-f="business.refs" rows="3" maxlength="600" placeholder="Ej: tonos tierra, me gusta la marca X…">${esc(state.business.refs)}</textarea></label></div>`,
    timing: () => head('// tiempos', '¿Para cuándo y con qué presupuesto?') +
      `<div class="q-block"><h3>¿Para cuándo lo necesitas?</h3>${choice('timing', TIMING, state.timing, false)}</div>
       <div class="q-block"><h3>Presupuesto aproximado</h3>${choice('budget', BUDGET, state.budget, false)}</div>`,
    contact: () => head('// último paso', '¿A quién le enviamos la cotización?') + `
      <div class="fields">
        <label>Tu nombre<input data-f="contact.name" value="${esc(state.contact.name)}" maxlength="100" required /></label>
        <label>WhatsApp<input data-f="contact.phone" value="${esc(state.contact.phone)}" maxlength="30" inputmode="tel" required /></label>
        <label class="span2">Email<input data-f="contact.email" type="email" value="${esc(state.contact.email)}" maxlength="150" required /></label>
        <label class="span2">¿Algo más que debamos saber?<textarea data-f="contact.notes" rows="3" maxlength="1500">${esc(state.contact.notes)}</textarea></label>
      </div>`,
    summary: () => head('// resumen', 'Así quedó tu plan.', 'Revisa y envíalo. Te escribiremos por WhatsApp con tu cotización.') +
      `<div class="summary glass">${summaryLines().map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`,
  };

  function planLabel() { return PLANS.find((p) => p.id === state.plan)?.label || ''; }

  function summaryLines() {
    const lines = [['Plan', planLabel()], ['Servicios', state.services.map((s) => SERVICES[s].label).join(', ')]];
    state.services.forEach((s) => {
      DETAILS[s].forEach((d) => {
        const v = (state.details[s] || {})[d.key];
        if (v && (!Array.isArray(v) || v.length)) lines.push([d.q.replace(/[¿?]/g, ''), Array.isArray(v) ? v.join(', ') : v]);
      });
    });
    const b = state.business;
    lines.push(['Negocio', [b.name, b.sector, b.city].filter(Boolean).join(' · ')]);
    if (b.link) lines.push(['Redes / web', b.link]);
    if (state.style.length) lines.push(['Estilo', state.style.join(', ')]);
    if (b.refs) lines.push(['Referencias', b.refs]);
    lines.push(['Tiempo', state.timing], ['Presupuesto', state.budget]);
    lines.push(['Contacto', `${state.contact.name} · ${state.contact.phone} · ${state.contact.email}`]);
    if (state.contact.notes) lines.push(['Notas', state.contact.notes]);
    return lines.filter(([, v]) => v);
  }

  // ---------- validation ----------
  function validate() {
    const s = steps[idx];
    const need = (ok, msg) => { if (!ok) toast(msg); return ok; };
    if (s === 'plan') return need(state.plan, 'Elige una opción para continuar');
    if (s === 'services') return need(state.services.length, 'Selecciona al menos un servicio');
    if (s.startsWith('detail:')) {
      const svc = s.split(':')[1];
      return need(DETAILS[svc].every((d) => { const v = (state.details[svc] || {})[d.key]; return d.type === 'multi' ? v?.length : v; }), 'Responde las preguntas para continuar');
    }
    if (s === 'business') return need(state.business.name && state.business.sector, 'Cuéntanos el nombre y a qué se dedica tu negocio');
    if (s === 'timing') return need(state.timing && state.budget, 'Elige tiempo y presupuesto');
    if (s === 'contact') {
      const c = state.contact;
      return need(c.name && c.phone && /^\S+@\S+\.\S+$/.test(c.email || ''), 'Completa nombre, WhatsApp y un email válido');
    }
    return true;
  }

  let toastTimer;
  function toast(msg) {
    let t = root.querySelector('.q-toast');
    if (!t) { t = document.createElement('div'); t.className = 'q-toast glass-strong'; root.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- render with 3D transition ----------
  function render(dir = 1) {
    const s = steps[idx];
    const [name, arg] = s.split(':');
    const panel = document.createElement('div');
    panel.className = `q-panel enter-${dir > 0 ? 'fwd' : 'back'}`;
    panel.innerHTML = R[name](arg);

    const old = stage.querySelector('.q-panel:not(.leaving)');
    if (old) {
      old.classList.add('leaving', `leave-${dir > 0 ? 'fwd' : 'back'}`);
      setTimeout(() => old.remove(), 700);
    }
    stage.appendChild(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('on')));
    stage.scrollTop = 0;

    dots.innerHTML = steps.map((_, i) => `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}"></span>`).join('');
    count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
    back.style.visibility = idx ? 'visible' : 'hidden';
    next.innerHTML = s === 'summary' ? `Enviar por WhatsApp ${icons.whatsapp}` : 'Continuar →';
    onStep(idx);
    const first = panel.querySelector('input');
    if (first && matchMedia('(hover: hover)').matches) setTimeout(() => first.focus({ preventScroll: true }), 500);
  }

  function go(dir) {
    if (busy) return;
    if (dir > 0 && !validate()) { stage.querySelector('.q-panel.on')?.classList.add('shake'); setTimeout(() => stage.querySelector('.shake')?.classList.remove('shake'), 500); return; }
    if (dir > 0 && steps[idx] === 'summary') return submit();
    if (steps[idx] === 'services' || steps[idx] === 'plan') buildSteps();
    const n = idx + dir;
    if (n < 0 || n >= steps.length) return;
    idx = n;
    busy = true; setTimeout(() => { busy = false; }, 450);
    render(dir);
  }

  // ---------- input handling ----------
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.choice');
    if (!b) return;
    const { name, val } = b.dataset, multi = b.dataset.multi === '1';
    const toggle = (arr) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

    if (name === 'plan') {
      state.plan = val;
      state.services = [...PLANS.find((p) => p.id === val).services];
    } else if (name === 'services') state.services = toggle(state.services);
    else if (name === 'style') {
      if (!state.style.includes(val) && state.style.length >= 3) return toast('Máximo 3 estilos');
      state.style = toggle(state.style);
    } else if (name === 'timing' || name === 'budget') state[name] = val;
    else if (name.startsWith('d:')) {
      const [, svc, key] = name.split(':');
      const d = (state.details[svc] ||= {});
      d[key] = multi ? toggle(d[key] || []) : val;
    }

    const group = b.parentElement.querySelectorAll('.choice');
    if (multi) b.classList.toggle('on');
    else group.forEach((x) => x.classList.toggle('on', x === b));
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');

    // Auto-advance on the first single-choice step for a snappier flow
    if (name === 'plan') setTimeout(() => go(1), 380);
  });

  stage.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const [group, key] = f.split('.');
    state[group][key] = e.target.value.trim();
  });

  back.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  $('#qClose').addEventListener('click', close);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); go(1); }
  });

  // ---------- submit ----------
  async function submit() {
    busy = true;
    next.disabled = true; next.textContent = 'Enviando…';
    const lines = summaryLines();
    const text = lines.map(([k, v]) => `• ${k}: ${v}`).join('\n');
    try {
      if (supabase) {
        const { error } = await supabase.from('leads').insert({
          name: state.contact.name, email: state.contact.email, phone: state.contact.phone,
          business: state.business.name, service: planLabel(), message: text,
          details: { plan: state.plan, services: state.services, details: state.details, business: state.business, style: state.style, timing: state.timing, budget: state.budget, notes: state.contact.notes },
        });
        if (error) throw error;
      }
    } catch (err) { console.error(err); } // WhatsApp still goes out even if saving fails

    const msg = `¡Hola Ksta_! 👋 Quiero una cotización:\n\n${text}`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    showDone(url);
    window.open(url, '_blank', 'noopener');
  }

  function showDone(url) {
    const old = stage.querySelector('.q-panel:not(.leaving)');
    old?.classList.add('leaving', 'leave-fwd'); setTimeout(() => old?.remove(), 700);
    const panel = document.createElement('div');
    panel.className = 'q-panel enter-fwd done';
    panel.innerHTML = `
      <div class="done-badge">${icons.check}</div>
      <p class="eyebrow">// solicitud enviada</p>
      <h2>¡Gracias, ${esc(state.contact.name.split(' ')[0])}!</h2>
      <p class="muted q-sub">Abrimos WhatsApp con tu resumen. Solo dale enviar y te responderemos con tu cotización personalizada.</p>
      <a class="btn" href="${url}" target="_blank" rel="noopener">${icons.whatsapp} Abrir WhatsApp</a>`;
    stage.appendChild(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('on')));
    dots.querySelectorAll('span').forEach((d) => (d.className = 'done'));
    root.querySelector('.quote-nav').classList.add('gone');
    onStep(99); // celebratory pose
  }

  // ---------- open / close ----------
  function open(preset) {
    reset();
    if (preset) {
      const p = PLANS.find((x) => x.label === preset || x.id === preset);
      if (p) { state.plan = p.id; state.services = [...p.services]; }
    }
    buildSteps();
    if (state.plan) idx = 1;
    stage.innerHTML = '';
    root.querySelector('.quote-nav').classList.remove('gone');
    next.disabled = false; busy = false;
    document.body.classList.add('quote-open');
    root.classList.add('open');
    render(1);
  }

  function close() {
    root.classList.remove('open');
    document.body.classList.remove('quote-open');
    onStep(-1);
  }

  return { open, close };
}
