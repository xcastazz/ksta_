import { icons } from './icons.js';
import { supabase } from './supabase.js';
import { TEMPLATES } from './templates.js';

const SERVICES = {
  branding: { label: 'Branding e identidad', icon: 'brand', desc: 'Logo, colores, tipografías y todo lo que hace reconocible a tu marca.' },
  web: { label: 'Web y software', icon: 'code', desc: 'Tu página, tienda o sistema para vender y atender clientes 24/7.' },
  audiovisual: { label: 'Fotografía y video', icon: 'video', desc: 'Fotos y videos profesionales que muestran tu producto como merece.' },
  marketing: { label: 'Marketing digital', icon: 'megaphone', desc: 'Contenido y anuncios para que más personas te encuentren y te compren.' },
  print: { label: 'Publicidad física', icon: 'sign', desc: 'Letreros, pendones, vinilos y todo lo impreso, con nuestra aliada de impresión.' },
};

const PLANS = [
  { id: 'emprendimiento', label: 'Paquete Emprendimiento', desc: 'Estoy empezando y necesito lo esencial para salir al mercado con buena imagen.', icon: 'rocket', services: ['branding', 'web', 'marketing'] },
  { id: 'presencia', label: 'Paquete Presencia Digital', desc: 'Ya tengo negocio y quiero verme profesional y vender más en internet.', icon: 'globe', services: ['branding', 'web', 'audiovisual', 'marketing'] },
  { id: 'integral', label: 'Paquete Negocio Integral', desc: 'Quiero todo: marca, web, contenido, publicidad digital y física.', icon: 'building', services: ['branding', 'web', 'audiovisual', 'marketing', 'print'] },
  { id: 'custom', label: 'Plan a mi medida', desc: 'Sé exactamente lo que necesito y quiero elegir servicio por servicio.', icon: 'sparkles', services: [] },
];

// Each option: [value, short explanation]
const DETAILS = {
  branding: {
    intro: 'Tu marca es la primera impresión. Estas respuestas nos dicen si partimos de cero o si mejoramos lo que ya tienes.',
    qs: [
      { key: 'logo', q: '¿Cómo está tu logo hoy?', help: 'Así sabemos si creamos desde cero o evolucionamos tu marca actual.', type: 'single', opts: [
        ['No tengo logo', 'Creamos tu marca desde cero.'],
        ['Tengo, quiero rediseñarlo', 'Lo modernizamos conservando su esencia.'],
        ['Tengo, solo necesito la identidad', 'Construimos colores, tipografías y aplicaciones alrededor de tu logo.'],
      ] },
      { key: 'piezas', q: '¿Qué piezas necesitas?', help: 'Elige todas las que quieras. Cada una suma a la cotización.', type: 'multi', opts: [
        ['Logo', 'El símbolo y nombre de tu marca.'],
        ['Manual de marca', 'Guía con reglas de uso: colores, tipografías, tamaños.'],
        ['Tarjetas y papelería', 'Tarjetas, hojas membretadas, facturas.'],
        ['Empaques / etiquetas', 'Diseño del empaque de tus productos.'],
        ['Piezas para redes', 'Plantillas para posts e historias.'],
        ['Mockups', 'Imágenes realistas de tu marca aplicada.'],
      ] },
    ],
  },
  web: {
    intro: 'Tu web trabaja por ti las 24 horas. Cuéntanos qué debe hacer para recomendarte la mejor solución.',
    qs: [
      { key: 'tipo', q: '¿Qué tipo de sitio necesitas?', help: 'Si no estás seguro, elige la más cercana; un asesor te orienta después.', type: 'single', opts: [
        ['Landing page', 'Una sola página enfocada en vender o captar clientes.'],
        ['Web corporativa', 'Varias páginas: inicio, nosotros, servicios, contacto.'],
        ['Portafolio', 'Muestra tus trabajos o proyectos.'],
        ['Catálogo', 'Lista de productos sin pago en línea.'],
        ['Tienda virtual', 'Vende y cobra en línea.'],
        ['Sistema / software a medida', 'Una herramienta hecha para tu operación.'],
      ] },
      { key: 'funciones', q: '¿Qué funciones debe tener?', help: 'Marca todas las que te imaginas usando.', type: 'multi', opts: [
        ['Formulario de contacto', 'Recibe mensajes de clientes.'],
        ['Botón de WhatsApp', 'Te escriben con un clic.'],
        ['Reservas / citas', 'Agenda en línea.'],
        ['Pagos en línea', 'Tarjeta, PSE, transferencias.'],
        ['Blog', 'Publica noticias y artículos.'],
        ['Panel administrativo', 'Edita contenido tú mismo.'],
      ] },
      { key: 'dominio', q: '¿Tienes dominio?', help: 'El dominio es tu dirección en internet, por ejemplo tunegocio.com.', type: 'single', opts: [
        ['Sí, ya tengo', 'Lo conectamos a tu nueva web.'],
        ['No, necesito uno', 'Te ayudamos a registrarlo.'],
        ['No sé qué es', 'Tranquilo, te lo explicamos.'],
      ] },
    ],
  },
  audiovisual: {
    intro: 'Las fotos y videos son lo que más vende en redes. Esto nos ayuda a planear la producción.',
    qs: [
      { key: 'contenido', q: '¿Qué contenido necesitas?', help: 'Elige todo lo que te interese producir.', type: 'multi', opts: [
        ['Fotografía de producto', 'Fondos limpios o ambientadas, para catálogo y redes.'],
        ['Fotografía corporativa', 'Equipo, instalaciones, retratos.'],
        ['Video publicitario', 'Comercial para anuncios y lanzamientos.'],
        ['Reels para redes', 'Videos cortos verticales.'],
        ['Video institucional', 'Quiénes son y qué hacen.'],
        ['Cobertura de evento', 'Fotos y video de tu evento.'],
      ] },
      { key: 'frecuencia', q: '¿Con qué frecuencia?', help: 'Los planes mensuales suelen tener mejor precio por pieza.', type: 'single', opts: [
        ['Una sola vez', 'Una producción puntual.'],
        ['Mensual', 'Contenido constante cada mes.'],
        ['Por campaña', 'Cuando lances algo nuevo.'],
      ] },
    ],
  },
  marketing: {
    intro: 'Una buena estrategia convierte seguidores en clientes. Cuéntanos qué te gustaría lograr.',
    qs: [
      { key: 'acciones', q: '¿Qué te gustaría hacer?', help: 'Puedes elegir varias.', type: 'multi', opts: [
        ['Contenido para redes', 'Diseño de posts e historias.'],
        ['Campañas en Meta Ads', 'Anuncios pagados en Facebook e Instagram.'],
        ['Lanzamiento de marca/producto', 'Estrategia para salir con fuerza.'],
        ['Promociones y ventas', 'Creatividades para ofertas.'],
        ['Estrategia completa', 'Planeamos todo contigo.'],
      ] },
      { key: 'pauta', q: 'Presupuesto mensual para anuncios', help: 'Es lo que se paga a Meta por mostrar tus anuncios, aparte de nuestro servicio.', type: 'single', opts: [
        ['Aún no sé', 'Te recomendamos uno.'], ['Bajo', 'Para empezar a probar.'], ['Medio', 'Para crecer de forma constante.'], ['Alto', 'Para escalar rápido.'],
      ] },
    ],
  },
  print: {
    intro: 'Con nuestra aliada de impresión llevamos tu marca a la calle. Dinos qué necesitas producir.',
    qs: [
      { key: 'impresos', q: '¿Qué material físico necesitas?', help: 'Diseñamos y coordinamos la producción e instalación.', type: 'multi', opts: [
        ['Letrero / aviso', 'Para la fachada de tu local.'],
        ['Afiches', 'Para promociones y eventos.'],
        ['Pendones / banners', 'Portátiles, para ferias y puntos de venta.'],
        ['Vinilos y adhesivos', 'Vitrinas, vehículos, paredes.'],
        ['Señalización', 'Orientación dentro del negocio.'],
        ['Tarjetas y material promocional', 'Volantes, stickers, tarjetas.'],
        ['Branding del local', 'Ambientación completa del espacio.'],
      ] },
    ],
  },
};

const STYLES = [['Minimalista', 'Limpio, mucho espacio'], ['Elegante', 'Sobrio y premium'], ['Moderno', 'Actual y tecnológico'], ['Divertido', 'Colorido y cercano'], ['Corporativo', 'Serio y confiable'], ['Natural', 'Orgánico, tonos tierra'], ['Atrevido', 'Contraste y personalidad'], ['Clásico', 'Atemporal y tradicional']];
const TIMING = [['Lo antes posible', 'Priorizamos tu proyecto'], ['En 2–4 semanas', 'Tiempo ideal'], ['En 1–2 meses', 'Planeación con calma'], ['Sin prisa', 'Cuando esté listo']];
const BUDGET = [['Aún no lo sé', 'Te proponemos opciones'], ['Básico', 'Lo esencial'], ['Intermedio', 'Buen balance'], ['Completo / premium', 'Lo mejor para tu marca']];

const INFO = {
  plan: 'Los paquetes combinan servicios con mejor precio que contratarlos por separado. Si eliges “a mi medida”, armas tu plan servicio por servicio.',
  services: 'Cada servicio que marques añade unas preguntas cortas para entender exactamente lo que necesitas. Puedes cambiar lo que viene en tu paquete.',
  template: 'Partir de una plantilla profesional reduce tiempo y costo. La personalizamos con tu logo, colores, textos y fotos, y te mostramos una demo antes de construir la versión final.',
  business: 'Con esto entendemos tu mercado y tu competencia para proponerte algo que de verdad funcione para tu negocio.',
  style: 'El estilo guía todas las decisiones de diseño: colores, tipografías, fotos y tono. No te preocupes por acertar; es un punto de partida.',
  timing: 'Los tiempos y el presupuesto nos ayudan a armar una propuesta realista. Es solo una referencia, no un compromiso.',
  contact: 'Un asesor de Ksta_ te escribirá por WhatsApp con tu cotización personalizada. No compartimos tus datos con nadie.',
  summary: 'Revisa que todo esté bien. Puedes volver atrás para cambiar cualquier respuesta antes de enviar.',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initQuote({ onStep }) {
  const root = document.createElement('div');
  root.className = 'quote';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Cotizador guiado');
  root.innerHTML = `
    <div class="quote-window vision">
      <div class="quote-top">
        <span class="logo">Ksta<span class="cursor">_</span> <small class="mono muted">cotizador</small></span>
        <div class="quote-dots" id="qDots"></div>
        <button class="quote-close" id="qClose" aria-label="Cerrar">✕</button>
      </div>
      <div class="quote-stage" id="qStage"></div>
      <div class="quote-nav">
        <button class="btn btn-ghost" id="qBack">← Atrás</button>
        <span class="seg mono" id="qCount"></span>
        <button class="btn" id="qNext">Continuar →</button>
      </div>
    </div>
    <div class="tpl-modal" id="tplModal">
      <div class="tpl-modal-bar vision"><b id="tplModalName"></b><span class="muted" id="tplModalTag"></span>
        <button class="btn btn-sm" id="tplModalUse">Usar esta plantilla</button>
        <button class="quote-close" id="tplModalClose" aria-label="Cerrar vista previa">✕</button></div>
      <iframe id="tplModalFrame" title="Vista previa de plantilla"></iframe>
    </div>`;
  document.body.appendChild(root);

  const $ = (id) => root.querySelector(id);
  const stage = $('#qStage'), dots = $('#qDots'), back = $('#qBack'), next = $('#qNext'), count = $('#qCount');
  const modal = $('#tplModal');
  let state, steps, idx, busy = false;

  const reset = () => {
    state = { plan: null, services: [], details: {}, template: null, business: {}, style: [], timing: null, budget: null, contact: {} };
    idx = 0;
  };

  function buildSteps() {
    const svc = state.services.map((s) => `detail:${s}`);
    if (state.services.includes('web')) svc.splice(svc.indexOf('detail:web') + 1, 0, 'template');
    steps = ['plan', 'services', ...svc, 'business', 'style', 'timing', 'contact', 'summary'];
  }

  // ---------- building blocks ----------
  const info = (key, text) => `<aside class="q-info vision"><span class="q-info-icon">i</span><div><b>¿Para qué es esto?</b><p>${text || INFO[key]}</p></div></aside>`;
  const head = (eyebrow, title, sub = '') =>
    `<p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${sub ? `<p class="muted q-sub">${sub}</p>` : ''}`;

  const choice = (name, opts, selected, multi) => `
    <div class="choices">${opts.map(([val, desc], i) => {
      const on = multi ? selected.includes(val) : selected === val;
      return `<button type="button" class="choice vision ${on ? 'on' : ''}" data-name="${name}" data-val="${esc(val)}" data-multi="${multi ? 1 : 0}" style="--i:${i}">
        <span class="tick">${icons.check}</span><span class="choice-txt"><b>${esc(val)}</b>${desc ? `<small>${esc(desc)}</small>` : ''}</span>
      </button>`;
    }).join('')}</div>`;

  const bigChoice = (name, opts, selected, multi) => `
    <div class="choices big">${opts.map((o, i) => {
      const on = multi ? selected.includes(o.id) : selected === o.id;
      return `<button type="button" class="choice vision ${on ? 'on' : ''}" data-name="${name}" data-val="${o.id}" data-multi="${multi ? 1 : 0}" style="--i:${i}">
        <span class="icon">${icons[o.icon]}</span><b>${esc(o.label)}</b><small>${esc(o.desc)}</small><span class="tick corner">${icons.check}</span>
      </button>`;
    }).join('')}</div>`;

  const R = {
    plan: () => head('// paso 1 · tu objetivo', '¿Qué estás buscando?', 'Elige el punto de partida que más se parezca a tu situación.') +
      info('plan') + bigChoice('plan', PLANS, state.plan, false),
    services: () => head('// servicios', 'Arma tu combinación.', state.plan === 'custom' ? 'Selecciona todo lo que necesites.' : 'Ya marcamos lo que incluye tu paquete. Agrega o quita lo que quieras.') +
      info('services') + bigChoice('services', Object.entries(SERVICES).map(([id, s]) => ({ id, ...s })), state.services, true),
    detail: (svc) => head(`// ${SERVICES[svc].label.toLowerCase()}`, SERVICES[svc].label) + info(null, DETAILS[svc].intro) +
      DETAILS[svc].qs.map((d) => `<div class="q-block"><h3>${d.q}${d.type === 'multi' ? ' <span class="pill">varias</span>' : ''}</h3><p class="q-help">${d.help}</p>${choice(`d:${svc}:${d.key}`, d.opts, (state.details[svc] || {})[d.key] ?? (d.type === 'multi' ? [] : null), d.type === 'multi')}</div>`).join(''),
    template: () => head('// diseño web', 'Elige un estilo base para tu web.', 'Toca “Vista previa” para navegarla completa. Luego la adaptamos a tu marca.') + info('template') + `
      <div class="tpl-grid">${TEMPLATES.map((t, i) => `
        <div class="tpl vision ${state.template === t.id ? 'on' : ''}" data-tpl="${t.id}" style="--i:${i}">
          <div class="tpl-thumb"><iframe src="/templates/${t.id}/index.html" loading="lazy" tabindex="-1" title="${t.name}" aria-hidden="true"></iframe></div>
          <div class="tpl-body"><div><b>${t.name}</b><span class="pill">${t.tag}</span></div><p>${t.desc}</p>
            <div class="tpl-actions"><button type="button" class="btn btn-sm btn-ghost" data-preview="${t.id}">Vista previa</button><button type="button" class="btn btn-sm" data-pick="${t.id}">${state.template === t.id ? '✓ Elegida' : 'Elegir'}</button></div></div>
        </div>`).join('')}
        <div class="tpl vision tpl-custom ${state.template === 'custom' ? 'on' : ''}" data-tpl="custom">
          <div class="icon">${icons.sparkles}</div><b>Diseño 100% personalizado</b><p>Prefiero un diseño único desde cero, hecho solo para mi marca.</p>
          <button type="button" class="btn btn-sm" data-pick="custom">${state.template === 'custom' ? '✓ Elegido' : 'Elegir'}</button>
        </div>
      </div>
      <p class="q-credit mono muted">Plantillas base por <a href="https://html5up.net" target="_blank" rel="noopener">HTML5 UP</a> (CC BY 3.0).</p>`,
    business: () => head('// tu negocio', 'Preséntanos tu negocio.') + info('business') + `
      <div class="fields">
        <label>Nombre del negocio *<input data-f="business.name" value="${esc(state.business.name)}" maxlength="120" placeholder="Ej: Café Aurora" /><small>Como quieres que aparezca en tu marca.</small></label>
        <label>¿A qué se dedica? *<input data-f="business.sector" value="${esc(state.business.sector)}" maxlength="120" placeholder="Ej: cafetería de especialidad" /><small>En pocas palabras, qué vendes u ofreces.</small></label>
        <label>Ciudad<input data-f="business.city" value="${esc(state.business.city)}" maxlength="80" /><small>Nos ayuda con la publicidad local.</small></label>
        <label>Instagram o web actual<input data-f="business.link" value="${esc(state.business.link)}" maxlength="200" placeholder="@tunegocio" /><small>Si ya tienes, para ver de dónde partimos.</small></label>
        <label class="span2">¿Quién es tu cliente ideal?<input data-f="business.audience" value="${esc(state.business.audience)}" maxlength="200" placeholder="Ej: jóvenes de 20 a 35 que trabajan cerca" /><small>Diseñamos pensando en las personas a las que les quieres vender.</small></label>
      </div>`,
    style: () => head('// estilo', '¿Cómo quieres que se sienta tu marca?', 'Elige hasta 3 estilos.') + info('style') +
      choice('style', STYLES, state.style, true) + `
      <div class="fields one"><label>Colores o marcas que te gusten<textarea data-f="business.refs" rows="3" maxlength="600" placeholder="Ej: tonos tierra, me gusta cómo se ve la marca X…">${esc(state.business.refs)}</textarea><small>Opcional, pero nos ayuda muchísimo.</small></label></div>`,
    timing: () => head('// tiempos', '¿Para cuándo y con qué presupuesto?') + info('timing') +
      `<div class="q-block"><h3>¿Para cuándo lo necesitas?</h3>${choice('timing', TIMING, state.timing, false)}</div>
       <div class="q-block"><h3>Presupuesto aproximado</h3>${choice('budget', BUDGET, state.budget, false)}</div>`,
    contact: () => head('// último paso', '¿A quién le enviamos la cotización?') + info('contact') + `
      <div class="fields">
        <label>Tu nombre *<input data-f="contact.name" value="${esc(state.contact.name)}" maxlength="100" /></label>
        <label>WhatsApp *<input data-f="contact.phone" value="${esc(state.contact.phone)}" maxlength="30" inputmode="tel" placeholder="+57 300 000 0000" /><small>Aquí te escribirá tu asesor.</small></label>
        <label class="span2">Email *<input data-f="contact.email" type="email" value="${esc(state.contact.email)}" maxlength="150" /></label>
        <label class="span2">¿Algo más que debamos saber?<textarea data-f="contact.notes" rows="3" maxlength="1500">${esc(state.contact.notes)}</textarea></label>
      </div>`,
    summary: () => head('// resumen', 'Así quedó tu plan.') + info('summary') +
      `<div class="summary vision">${summaryLines().map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`,
  };

  const planLabel = () => PLANS.find((p) => p.id === state.plan)?.label || '';
  const templateLabel = () => (state.template === 'custom' ? 'Diseño personalizado' : TEMPLATES.find((t) => t.id === state.template)?.name || '');

  function summaryLines() {
    const lines = [['Plan', planLabel()], ['Servicios', state.services.map((s) => SERVICES[s].label).join(', ')]];
    state.services.forEach((s) => {
      DETAILS[s].qs.forEach((d) => {
        const v = (state.details[s] || {})[d.key];
        if (v && (!Array.isArray(v) || v.length)) lines.push([d.q.replace(/[¿?]/g, ''), Array.isArray(v) ? v.join(', ') : v]);
      });
      if (s === 'web' && state.template) lines.push(['Plantilla web', templateLabel()]);
    });
    const b = state.business;
    lines.push(['Negocio', [b.name, b.sector, b.city].filter(Boolean).join(' · ')]);
    if (b.link) lines.push(['Redes / web', b.link]);
    if (b.audience) lines.push(['Cliente ideal', b.audience]);
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
    if (s === 'template') return need(state.template, 'Elige una plantilla o diseño personalizado');
    if (s.startsWith('detail:')) {
      const svc = s.split(':')[1];
      return need(DETAILS[svc].qs.every((d) => { const v = (state.details[svc] || {})[d.key]; return d.type === 'multi' ? v?.length : v; }), 'Responde las preguntas para continuar');
    }
    if (s === 'business') return need(state.business.name && state.business.sector, 'Cuéntanos el nombre y a qué se dedica tu negocio');
    if (s === 'timing') return need(state.timing && state.budget, 'Elige tiempo y presupuesto');
    if (s === 'contact') {
      const c = state.contact;
      return need(c.name && (c.phone || '').replace(/\D/g, '').length >= 7 && /^\S+@\S+\.\S+$/.test(c.email || ''), 'Completa nombre, un WhatsApp válido y tu email');
    }
    return true;
  }

  let toastTimer;
  function toast(msg) {
    let t = root.querySelector('.q-toast');
    if (!t) { t = document.createElement('div'); t.className = 'q-toast vision'; root.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- render with 3D transition ----------
  function swap(html, dir, extraClass = '') {
    const panel = document.createElement('div');
    panel.className = `q-panel enter-${dir > 0 ? 'fwd' : 'back'} ${extraClass}`;
    panel.innerHTML = html;
    const old = stage.querySelector('.q-panel:not(.leaving)');
    if (old) { old.classList.add('leaving', `leave-${dir > 0 ? 'fwd' : 'back'}`); setTimeout(() => old.remove(), 700); }
    stage.appendChild(panel);
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('on')));
    stage.scrollTop = 0;
    return panel;
  }

  function render(dir = 1) {
    const [name, arg] = steps[idx].split(':');
    const panel = swap(R[name](arg), dir);
    dots.innerHTML = steps.map((_, i) => `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}"></span>`).join('');
    count.textContent = `Paso ${idx + 1} de ${steps.length}`;
    back.style.visibility = idx ? 'visible' : 'hidden';
    next.innerHTML = steps[idx] === 'summary' ? `Enviar solicitud ${icons.send}` : 'Continuar →';
    onStep(idx);
    const first = panel.querySelector('input');
    if (first && matchMedia('(hover: hover)').matches) setTimeout(() => first.focus({ preventScroll: true }), 500);
  }

  function go(dir) {
    if (busy) return;
    if (dir > 0 && !validate()) { const p = stage.querySelector('.q-panel.on'); p?.classList.add('shake'); setTimeout(() => p?.classList.remove('shake'), 500); return; }
    if (dir > 0 && steps[idx] === 'summary') return submit();
    if (steps[idx] === 'services' || steps[idx] === 'plan') buildSteps();
    const n = idx + dir;
    if (n < 0 || n >= steps.length) return;
    idx = n;
    busy = true; setTimeout(() => { busy = false; }, 450);
    render(dir);
  }

  // ---------- template picking & preview ----------
  function pickTemplate(id) {
    state.template = id;
    stage.querySelectorAll('.tpl').forEach((el) => {
      const on = el.dataset.tpl === id;
      el.classList.toggle('on', on);
      const b = el.querySelector('[data-pick]');
      b.textContent = on ? (id === 'custom' ? '✓ Elegido' : '✓ Elegida') : 'Elegir';
    });
  }
  function openPreview(id) {
    const t = TEMPLATES.find((x) => x.id === id);
    $('#tplModalName').textContent = t.name;
    $('#tplModalTag').textContent = t.tag;
    $('#tplModalUse').dataset.id = id;
    $('#tplModalFrame').src = `/templates/${id}/index.html`;
    modal.classList.add('open');
  }
  const closePreview = () => { modal.classList.remove('open'); setTimeout(() => { $('#tplModalFrame').src = 'about:blank'; }, 500); };
  $('#tplModalClose').addEventListener('click', closePreview);
  $('#tplModalUse').addEventListener('click', (e) => { pickTemplate(e.currentTarget.dataset.id); closePreview(); toast('¡Plantilla elegida!'); });

  // ---------- input handling ----------
  stage.addEventListener('click', (e) => {
    const pv = e.target.closest('[data-preview]');
    if (pv) return openPreview(pv.dataset.preview);
    const pk = e.target.closest('[data-pick]');
    if (pk) return pickTemplate(pk.dataset.pick);

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

    if (multi) b.classList.toggle('on');
    else b.parentElement.querySelectorAll('.choice').forEach((x) => x.classList.toggle('on', x === b));
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
    if (name === 'plan') setTimeout(() => go(1), 420);
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
    if (e.key === 'Escape') return modal.classList.contains('open') ? closePreview() : close();
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); go(1); }
  });

  // ---------- submit: the sale closes here ----------
  async function submit() {
    busy = true;
    next.disabled = true; next.textContent = 'Enviando…';
    const text = summaryLines().map(([k, v]) => `• ${k}: ${v}`).join('\n');
    try {
      if (!supabase) throw new Error('Supabase no configurado');
      const { error } = await supabase.from('leads').insert({
        name: state.contact.name, email: state.contact.email, phone: state.contact.phone,
        business: state.business.name, service: planLabel(), message: text, template: templateLabel() || null,
        details: { plan: state.plan, services: state.services, details: state.details, template: state.template, business: state.business, style: state.style, timing: state.timing, budget: state.budget, notes: state.contact.notes },
      });
      if (error) throw error;
      showDone();
    } catch (err) {
      console.error(err);
      toast('No pudimos enviar tu solicitud. Intenta de nuevo.');
      next.disabled = false; next.innerHTML = `Reintentar ${icons.send}`; busy = false;
    }
  }

  function showDone() {
    const first = esc(state.contact.name.split(' ')[0]);
    swap(`
      <div class="done-badge">${icons.check}</div>
      <p class="eyebrow">// solicitud recibida</p>
      <h2>¡Listo, ${first}!</h2>
      <p class="q-sub">Recibimos tu solicitud del <b>${esc(planLabel())}</b>. Nuestros asesores te contactarán muy pronto a tu WhatsApp <b>${esc(state.contact.phone)}</b> con tu cotización personalizada.</p>
      <div class="done-steps">
        <div class="vision"><span>01</span><b>Revisamos tu plan</b><small>Un asesor analiza tus respuestas.</small></div>
        <div class="vision"><span>02</span><b>Te escribimos</b><small>Por WhatsApp, en horario hábil.</small></div>
        <div class="vision"><span>03</span><b>Recibes tu cotización</b><small>${state.template && state.template !== 'custom' ? 'Y una demo con tu plantilla.' : 'Clara y sin compromiso.'}</small></div>
      </div>
      <button class="btn" data-close>Volver al sitio</button>`, 1, 'done');
    dots.querySelectorAll('span').forEach((d) => (d.className = 'done'));
    root.querySelector('.quote-nav').classList.add('gone');
    onStep(99); // celebratory pose
  }
  stage.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });

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
    closePreview();
    root.classList.remove('open');
    document.body.classList.remove('quote-open');
    onStep(-1);
  }

  return { open, close };
}
