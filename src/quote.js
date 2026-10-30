import { icons } from './icons.js';
import { supabase } from './supabase.js';
import { TEMPLATES } from './templates.js';
import { buildQuote, cop } from './pricing.js';
import { CATS, CAT_ORDER, COMBO, findTier, tierPrice, priceHTML, fromValue } from './plans.js';

const SERVICES = {
  branding: { label: 'Branding e identidad', icon: 'brand', desc: 'Logo, colores, tipografías y todo lo que hace reconocible a tu marca.' },
  web: { label: 'Web y software', icon: 'code', desc: 'Tu página, tienda o sistema para vender y atender clientes 24/7.' },
  audiovisual: { label: 'Fotografía y video', icon: 'video', desc: 'Fotos y videos profesionales que muestran tu producto como merece.' },
  marketing: { label: 'Marketing digital', icon: 'megaphone', desc: 'Contenido y anuncios para que más personas te encuentren y te compren.' },
  print: { label: 'Publicidad física', icon: 'sign', desc: 'Letreros, pendones, vinilos y todo lo impreso, con nuestra aliada de impresión.' },
};


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
  cats: 'Puedes contratar una sola categoría o combinarlas. Al elegir 2 ahorras 5% y con las 3 ahorras 8% sobre el total.',
  tiers: 'Cada plan es un punto de partida con lo que más recomendamos. En los siguientes pasos puedes ajustar todo y el precio final se calcula con tus respuestas.',
  plan: 'Los paquetes combinan servicios con mejor precio que contratarlos por separado. Si eliges “a mi medida”, armas tu plan servicio por servicio.',
  services: 'Cada servicio que marques añade unas preguntas cortas para entender exactamente lo que necesitas. Puedes cambiar lo que viene en tu paquete.',
  template: 'Partir de una plantilla profesional reduce tiempo y costo. La personalizamos con tu logo, colores, textos y fotos, y te mostramos una demo antes de construir la versión final.',
  business: 'Con esto entendemos tu mercado y tu competencia para proponerte algo que de verdad funcione para tu negocio.',
  style: 'El estilo guía todas las decisiones de diseño: colores, tipografías, fotos y tono. No te preocupes por acertar; es un punto de partida.',
  timing: 'Los tiempos y el presupuesto nos ayudan a armar una propuesta realista. Es solo una referencia, no un compromiso.',
  contact: 'Un asesor de KstaStudio_ te escribirá por WhatsApp con tu cotización personalizada. No compartimos tus datos con nadie.',
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
        <span class="logo">KstaStudio<span class="cursor">_</span> <small class="mono muted">cotizador</small></span>
        <div class="quote-dots" id="qDots"></div>
        <button class="quote-close" id="qClose" aria-label="Cerrar">✕</button>
      </div>
      <div class="quote-stage" id="qStage"></div>
      <div class="q-arrows">
        <button type="button" id="qUp" aria-label="Pregunta anterior">↑</button>
        <button type="button" id="qDown" aria-label="Siguiente pregunta">↓</button>
      </div>
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
    state = { cats: [], tiers: {}, applied: '', services: [], details: {}, template: null, business: {}, style: [], timing: null, budget: null, contact: {} };
    idx = 0;
  };

  function buildSteps() {
    const svc = state.services.map((s) => `detail:${s}`);
    if (state.services.includes('web')) svc.splice(svc.indexOf('detail:web') + 1, 0, 'template');
    steps = ['cats', 'tiers', 'services', ...svc, 'business', 'style', 'timing', 'contact', 'summary'];
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
    cats: () => head('// paso 1 · qué necesitas', '¿En qué te ayudamos?', 'Elige una, dos o las tres. Combinando categorías ahorras.') + info('cats') + `
      <div class="choices big cats">${CAT_ORDER.map((k, i) => {
        const c = CATS[k], cheapest = c.tiers.map((t) => tierPrice(t)).sort((a, b) => fromValue(a) - fromValue(b))[0];
        return `<button type="button" class="choice vision ${state.cats.includes(k) ? 'on' : ''}" data-name="cats" data-val="${k}" data-multi="1" style="--i:${i}">
          <span class="icon">${icons[c.icon]}</span><b>${esc(c.label)}</b><small>${esc(c.desc)}</small><span class="from">desde <b>${priceHTML({ ...cheapest, monthly: cheapest.total ? 0 : cheapest.monthly }, cop)}</b></span><span class="tick corner">${icons.check}</span></button>`;
      }).join('')}</div>
      <div class="combo-meter vision" id="comboMeter">${comboMeter()}</div>`,
    tiers: () => head('// tu plan', state.cats.length > 1 ? 'Elige un plan para cada categoría.' : 'Elige tu plan.', 'Cada plan ya trae lo recomendado. En los siguientes pasos puedes ajustarlo.') + info('tiers') +
      state.cats.map((k) => `<div class="q-block"><h3 class="tier-head"><i>${icons[CATS[k].icon]}</i>${esc(CATS[k].label)}</h3>
        <div class="choices tiers">${CATS[k].tiers.map((t, i) => { const tp = tierPrice(t); return `
          <button type="button" class="choice vision tier ${state.tiers[k] === t.id ? 'on' : ''} ${t.featured ? 'feat' : ''}" data-name="tier:${k}" data-val="${t.id}" data-multi="0" style="--i:${i}">
            <span class="tier-top"><b>${esc(t.name)}</b><span class="pill">${esc(t.tag)}</span></span>
            <span class="tier-price">${priceHTML(tp, cop)}</span>
            <ul>${t.items.map((x) => `<li>${icons.check}${esc(x)}</li>`).join('')}</ul>
            <span class="tick corner">${icons.check}</span>
          </button>`; }).join('')}
          <button type="button" class="choice vision tier tier-custom ${state.tiers[k] === 'custom' ? 'on' : ''}" data-name="tier:${k}" data-val="custom" data-multi="0" style="--i:3">
            <span class="tier-top"><b>A mi medida</b></span><small>Prefiero elegir yo cada cosa en las siguientes preguntas.</small><span class="tick corner">${icons.check}</span>
          </button>
        </div></div>`).join(''),
    services: () => head('// servicios', 'Arma tu combinación.', 'Ya marcamos lo que incluye tu plan. Agrega o quita lo que quieras.') +
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

  const planLabel = () => state.cats.map((k) => (state.tiers[k] === 'custom' ? `${CATS[k].label} a medida` : findTier(state.tiers[k])?.tier.name || CATS[k].label)).join(' + ');
  const planId = () => `cats-${Math.max(1, state.cats.length)}`;
  function comboMeter() {
    const n = state.cats.length, off = COMBO[n] || 0;
    return `<div class="cm-steps">${[1, 2, 3].map((i) => `<span class="${n >= i ? 'on' : ''}">${i}</span>`).join('<i></i>')}</div>
      <p>${n === 0 ? 'Elige al menos una categoría.' : n === 1 ? 'Agrega otra categoría y ahorra <b>5%</b>.' : n === 2 ? '¡Combo! Ahorras <b>5%</b>. Con las 3 ahorras <b>8%</b>.' : '¡Combo completo! Ahorras <b>8%</b> en todo.'}</p>
      ${off ? `<span class="cm-badge">-${Math.round(off * 100)}%</span>` : ''}`;
  }
  // When leaving the plan step: chosen tiers → services + pre-filled answers
  function applyTiers() {
    const key = JSON.stringify(state.tiers);
    if (key === state.applied) return;
    state.applied = key;
    const svc = new Set();
    state.cats.forEach((k) => {
      const t = state.tiers[k];
      if (t === 'custom' || !t) return CATS[k].services.slice(0, k === 'publicidad' ? 2 : 1).forEach((s) => svc.add(s));
      const { tier } = findTier(t);
      tier.services.forEach((s) => svc.add(s));
      Object.entries(tier.details).forEach(([s, d]) => { state.details[s] = structuredClone(d); });
    });
    state.services = ['branding', 'web', 'audiovisual', 'marketing', 'print'].filter((s) => svc.has(s));
  }
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
    if (s === 'cats') return need(state.cats.length, 'Elige al menos una categoría');
    if (s === 'tiers') return need(state.cats.every((k) => state.tiers[k]), 'Elige un plan para cada categoría');
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

  // ---------- focus mode: one question at a time inside each step ----------
  let blocks = [], bIdx = 0, panelEl = null;

  function setBlock(i, scroll = true) {
    if (!blocks.length) return;
    bIdx = Math.max(0, Math.min(blocks.length - 1, i));
    blocks.forEach((b, j) => {
      b.classList.toggle('is-focus', j === bIdx);
      b.classList.toggle('is-past', j < bIdx);
    });
    const cur = blocks[bIdx];
    cur.classList.remove('focus-in'); void cur.offsetWidth; cur.classList.add('focus-in');
    panelEl.classList.toggle('head-dim', bIdx > 0);
    if (scroll) {
      const top = cur.offsetTop - stage.clientHeight / 2 + Math.min(cur.offsetHeight, stage.clientHeight * 0.7) / 2;
      stage.scrollTo({ top: bIdx === 0 ? 0 : top, behavior: 'smooth' });
    }
    const input = cur.querySelector('input, textarea');
    if (input && matchMedia('(hover: hover)').matches) setTimeout(() => input.focus({ preventScroll: true }), 350);
    updateNav();
  }

  function updateNav() {
    const lastBlock = bIdx >= blocks.length - 1;
    back.style.visibility = idx || bIdx ? 'visible' : 'hidden';
    back.textContent = bIdx > 0 ? '↑ Anterior' : '← Paso anterior';
    next.innerHTML = !lastBlock ? 'Siguiente ↓' : steps[idx] === 'summary' ? `Enviar solicitud ${icons.send}` : 'Continuar →';
    $('#qUp').disabled = !idx && !bIdx;
    $('#qDown').disabled = steps[idx] === 'summary' && lastBlock;
  }

  function render(dir = 1) {
    const [name, arg] = steps[idx].split(':');
    panelEl = swap(R[name](arg), dir);
    blocks = [...panelEl.querySelectorAll(':scope > .choices, .q-block, :scope > .tpl-grid, .fields > label, :scope > .summary')];
    blocks.forEach((b) => b.classList.add('q-focus'));
    panelEl.classList.toggle('focus-mode', blocks.length > 1);
    dots.innerHTML = steps.map((_, i) => `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}"></span>`).join('');
    count.textContent = `Paso ${idx + 1} de ${steps.length}`;
    onStep(idx);
    setTimeout(() => setBlock(dir < 0 ? blocks.length - 1 : 0), dir < 0 ? 350 : 0);
    if (dir >= 0) setBlock(0, false);
  }

  // Move one question; at the edges, move one whole step
  function nextBlock() {
    if (bIdx < blocks.length - 1) {
      if (!blockAnswered(blocks[bIdx])) { shakeBlock(); return toast('Responde esta pregunta para seguir'); }
      return setBlock(bIdx + 1);
    }
    go(1);
  }
  function prevBlock() { if (bIdx > 0) setBlock(bIdx - 1); else go(-1); }
  function shakeBlock() { const b = blocks[bIdx]; b?.classList.add('shake'); setTimeout(() => b?.classList.remove('shake'), 500); }
  function blockAnswered(b) {
    const group = b.querySelector('.choice');
    if (!group || b.querySelector('[data-name="style"]')) return true;
    return !!b.querySelector('.choice.on');
  }

  function go(dir) {
    if (busy) return;
    if (dir > 0 && !validate()) { const p = stage.querySelector('.q-panel.on'); p?.classList.add('shake'); setTimeout(() => p?.classList.remove('shake'), 500); return; }
    if (dir > 0 && steps[idx] === 'summary') return submit();
    if (dir > 0 && steps[idx] === 'tiers') applyTiers();
    if (['cats', 'tiers', 'services'].includes(steps[idx])) buildSteps();
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

    if (name === 'cats') {
      state.cats = CAT_ORDER.filter((k) => (k === val ? !state.cats.includes(k) : state.cats.includes(k)));
      const m = stage.querySelector('#comboMeter');
      if (m) { m.innerHTML = comboMeter(); m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); }
    } else if (name.startsWith('tier:')) state.tiers[name.slice(5)] = val;
    else if (name === 'services') state.services = toggle(state.services);
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
    // Single choice → auto-advance to the next question (or next step)
    if (!multi) setTimeout(nextBlock, 450);
  });

  stage.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const [group, key] = f.split('.');
    state[group][key] = e.target.value.trim();
  });

  back.addEventListener('click', prevBlock);
  next.addEventListener('click', nextBlock);
  $('#qUp').addEventListener('click', prevBlock);
  $('#qDown').addEventListener('click', nextBlock);
  // Clicking a dimmed question brings it into focus
  stage.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.q-focus');
    if (b && !b.classList.contains('is-focus')) { const i = blocks.indexOf(b); if (i >= 0) setBlock(i); }
  });
  $('#qClose').addEventListener('click', close);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return modal.classList.contains('open') ? closePreview() : close();
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); nextBlock(); }
  });

  // ---------- submit: the sale closes here ----------
  async function submit() {
    busy = true;
    next.disabled = true; next.textContent = 'Calculando tu cotización…';
    const text = summaryLines().map(([k, v]) => `• ${k}: ${v}`).join('\n');
    const quote = buildQuote({ plan: planId(), services: state.services, details: state.details, template: state.template, timing: state.timing });
    const lead = {
      id: crypto.randomUUID(), created_at: new Date().toISOString(),
      name: state.contact.name, email: state.contact.email, phone: state.contact.phone,
      business: state.business.name, service: planLabel(), message: text, template: templateLabel() || null,
      details: { plan: planId(), cats: state.cats, tiers: state.tiers, services: state.services, details: state.details, template: state.template, business: state.business, style: state.style, timing: state.timing, budget: state.budget, notes: state.contact.notes },
      quote, quote_total: quote.total,
    };
    try {
      if (!supabase) throw new Error('Supabase no configurado');
      const { error } = await supabase.from('leads').insert(lead);
      if (error) throw error;
      showDone(lead);
    } catch (err) {
      console.error(err);
      toast('No pudimos enviar tu solicitud. Intenta de nuevo.');
      next.disabled = false; next.innerHTML = `Reintentar ${icons.send}`; busy = false;
    }
  }

  function showDone(lead) {
    const first = esc(state.contact.name.split(' ')[0]);
    swap(`
      <div class="done-badge">${icons.check}</div>
      <p class="eyebrow">// solicitud recibida</p>
      <h2>¡Listo, ${first}!</h2>
      <p class="q-sub">Recibimos tu solicitud de <b>${esc(planLabel())}</b>. Tu cotización personalizada será enviada a tu WhatsApp y a tu correo apenas nuestros asesores sean notificados.</p>
      <div class="done-send vision">
        <div><span class="ds-icon">${icons.whatsapp}</span><span><small>WhatsApp</small><b>${esc(state.contact.phone)}</b></span></div>
        <div><span class="ds-icon">${icons.mail}</span><span><small>Correo electrónico</small><b>${esc(state.contact.email)}</b></span></div>
      </div>
      <div class="done-steps">
        <div class="vision"><span>01</span><b>Te notificamos</b><small>Un asesor recibe tu solicitud al instante.</small></div>
        <div class="vision"><span>02</span><b>Revisamos tu plan</b><small>Validamos tus respuestas y armamos tu cotización.</small></div>
        <div class="vision"><span>03</span><b>La recibes</b><small>Por WhatsApp y correo, con el detalle en PDF.</small></div>
      </div>
      <button class="btn" data-close>Volver al sitio</button>`, 1, 'done');
    dots.querySelectorAll('span').forEach((d) => (d.className = 'done'));
    root.querySelector('.quote-nav').classList.add('gone'); root.classList.add('finished');
    onStep(99); // celebratory pose
  }

  stage.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });

  // ---------- motion-graphics intro ----------
  const INTRO = [
    { icon: 'target', sats: ['code', 'rocket', 'building'], t: 'Elige qué necesitas', d: 'Web, diseño, publicidad… o las tres. Combinando ahorras hasta 8%.' },
    { icon: 'list', sats: ['brand', 'code', 'video'], t: 'Responde preguntas rápidas', d: 'Solo sobre lo que elegiste. Cada paso te explica para qué sirve.' },
    { icon: 'palette', sats: ['images', 'code', 'sparkles'], t: 'Define tu estilo', d: 'Mira plantillas web reales y cuéntanos cómo quieres que se sienta tu marca.' },
    { icon: 'handshake', sats: ['whatsapp', 'chat', 'calendar'], t: 'Un asesor te contacta', d: 'Te escribimos por WhatsApp con tu cotización personalizada. Sin compromiso.' },
  ];
  const SCENE_MS = 3200;
  let introTimer = null, introIdx = 0;

  function playIntro() {
    root.classList.add('intro');
    const panel = swap(`
      <div class="intro-stories">${INTRO.map(() => '<span><i></i></span>').join('')}</div>
      <p class="eyebrow intro-eyebrow">// así funciona · toma 2 minutos</p>
      <div class="intro-stage">${INTRO.map((s, i) => `
        <div class="intro-scene" data-i="${i}">
          <div class="mg">
            <span class="mg-num">0${i + 1}</span>
            <svg class="mg-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" /><circle class="r2" cx="100" cy="100" r="70" /></svg>
            <div class="mg-core">${icons[s.icon]}</div>
            ${s.sats.map((k, j) => `<div class="mg-sat" style="--a:${j * 120}deg"><span>${icons[k] || icons.sparkles}</span></div>`).join('')}
            <span class="mg-spark s1"></span><span class="mg-spark s2"></span><span class="mg-spark s3"></span>
          </div>
          <h2 class="mg-title">${s.t.split(' ').map((w, j) => `<span style="--w:${j}">${w}</span>`).join(' ')}</h2>
          <p class="mg-desc">${s.d}</p>
        </div>`).join('')}
      </div>
      <div class="intro-track">${INTRO.map((s, i) => `<button type="button" data-scene="${i}"><b>${icons[s.icon]}</b><span>${s.t}</span></button>`).join('<i class="intro-link"></i>')}</div>
      <div class="intro-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-skip>Saltar intro</button>
        <button type="button" class="btn btn-lg" data-start>Empezar ahora →</button>
      </div>`, 1, 'q-intro');
    panel.querySelector('[data-skip]').addEventListener('click', endIntro);
    panel.querySelector('[data-start]').addEventListener('click', endIntro);
    panel.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', () => scene(+b.dataset.scene)));
    dots.innerHTML = '';
    count.textContent = '';
    onStep(0);
    scene(0);
  }

  function scene(i) {
    clearTimeout(introTimer);
    introIdx = i;
    const p = stage.querySelector('.q-intro');
    if (!p) return;
    p.querySelectorAll('.intro-scene').forEach((s, j) => {
      s.classList.toggle('on', j === i);
      s.classList.toggle('past', j < i);
    });
    p.querySelectorAll('.intro-stories span').forEach((s, j) => {
      s.className = j < i ? 'done' : j === i ? 'run' : '';
      s.style.setProperty('--dur', `${SCENE_MS}ms`);
    });
    p.querySelectorAll('.intro-track button').forEach((b, j) => { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i); });
    p.querySelectorAll('.intro-link').forEach((l, j) => l.classList.toggle('on', j < i));
    p.classList.toggle('last', i === INTRO.length - 1);
    dispatchEvent(new Event('scene:kick'));
    onStep(i);
    if (i < INTRO.length - 1) introTimer = setTimeout(() => scene(i + 1), SCENE_MS);
  }

  function endIntro() {
    clearTimeout(introTimer);
    root.classList.remove('intro');
    render(1);
  }

  // ---------- open / close ----------
  function open(preset) {
    reset();
    if (preset === 'combo') state.cats = [...CAT_ORDER];
    else if (CATS[preset]) state.cats = [preset];
    else if (findTier(preset)) { const { cat } = findTier(preset); state.cats = [cat]; state.tiers[cat] = preset; }
    buildSteps();
    if (state.cats.length) idx = 1;
    stage.innerHTML = '';
    root.querySelector('.quote-nav').classList.remove('gone'); root.classList.remove('finished');
    next.disabled = false; busy = false;
    document.body.classList.add('quote-open');
    root.classList.add('open');
    playIntro();
  }

  function close() {
    clearTimeout(introTimer); root.classList.remove('intro');
    closePreview();
    root.classList.remove('open');
    document.body.classList.remove('quote-open');
    onStep(-1);
  }

  return { open, close };
}
