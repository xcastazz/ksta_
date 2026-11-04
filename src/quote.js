import { icons } from './icons.js';
import { plain } from './plain.js';
import { supabase } from './supabase.js';
import { TEMPLATES } from './templates.js';
import { bookingHTML, setupBooking } from './booking.js';
import { buildQuote, cop } from './pricing.js';
import { CATS, CAT_ORDER, CAT_SOON, COMBO, findTier, tierPrice, priceHTML, fromValue } from './plans.js';

export const SERVICES = {
  branding: { label: 'Logo e imagen', icon: 'brand', desc: 'Tu logo, tus colores y todo lo que hace que la gente reconozca tu negocio.' },
  web: { label: 'Página web', icon: 'code', desc: 'Tu negocio en internet, abierto las 24 horas, para que te encuentren desde el celular.' },
  audiovisual: { label: 'Fotos y videos', icon: 'video', desc: 'Fotos y videos bonitos de tus productos o de tu negocio.' },
  marketing: { label: 'Publicidad en redes', icon: 'megaphone', desc: 'Publicaciones y anuncios en Facebook e Instagram para que más gente te conozca.' },
  print: { label: 'Avisos e impresos', icon: 'sign', desc: 'Letreros, pendones, volantes y todo lo que va impreso para tu local.' },
};


// Each option: [value, short explanation]
export const DETAILS = {
  branding: {
    intro: 'El logo es como la cara de tu negocio: es lo primero que la gente ve y recuerda.',
    qs: [
      { key: 'logo', q: '¿Tienes logo?', help: 'El logo es el dibujo o las letras que identifican tu negocio.', type: 'single', opts: [
        ['No tengo logo', 'Te lo creo desde cero.'],
        ['Tengo, quiero rediseñarlo', 'Lo arreglo para que se vea más moderno.'],
        ['Tengo, solo necesito la identidad', 'Lo uso tal cual y le doy colores y estilo.'],
      ] },
      { key: 'piezas', q: '¿Qué más quieres con tu logo?', help: 'Puedes tocar varias. Cada una suma al precio.', type: 'multi', opts: [
        ['Logo', 'El dibujo o letras de tu negocio.'],
        ['Manual de marca', 'Unas reglas para que tu logo siempre se vea igual.'],
        ['Tarjetas y papelería', 'Tarjetas para entregar a tus clientes.'],
        ['Empaques / etiquetas', 'El diseño de tus bolsas, cajas o etiquetas.'],
        ['Piezas para redes', 'Diseños listos para publicar en Facebook e Instagram.'],
        ['Mockups', 'Imágenes de cómo se ve tu logo en camisetas, vasos, etc.'],
      ] },
    ],
  },
  web: {
    intro: 'Una página web es como tener tu local abierto en internet todo el día. La gente entra desde el celular, ve lo que vendes y te escribe.',
    qs: [
      { key: 'tipo', q: '¿Qué quieres que tenga tu página?', help: 'Si no estás seguro, toca la que más se parezca. Yo te ayudo después.', type: 'single', opts: [
        ['Landing page', 'Una sola página con lo más importante de tu negocio.'],
        ['Web corporativa', 'Varias partes: inicio, quiénes somos, servicios y contacto.'],
        ['Portafolio', 'Para mostrar fotos de lo que has hecho.'],
        ['Catálogo', 'Para mostrar tus productos con fotos y precios.'],
        ['Tienda virtual', 'Para que te compren y te paguen por internet.'],
        ['Sistema / software a medida', 'Un programa hecho a la medida de tu negocio.'],
      ] },
      { key: 'funciones', q: '¿Qué quieres que la gente pueda hacer en tu página?', help: 'Toca todo lo que te gustaría.', type: 'multi', opts: [
        ['Formulario de contacto', 'Que te dejen su nombre y teléfono.'],
        ['Botón de WhatsApp', 'Que te escriban al WhatsApp con un toque.'],
        ['Reservas / citas', 'Que pidan una cita y escojan la hora.'],
        ['Pagos en línea', 'Que te paguen con tarjeta o PSE.'],
        ['Blog', 'Que puedas publicar noticias y novedades.'],
        ['Panel administrativo', 'Que tú mismo cambies textos, fotos y precios.'],
      ] },
      { key: 'dominio', q: '¿Ya tienes tu dirección en internet?', help: 'Es el nombre que la gente escribe para encontrarte, por ejemplo: tunegocio.com', type: 'single', opts: [
        ['Sí, ya tengo', 'La uso para tu nueva página.'],
        ['No, necesito uno', 'Te ayudo a sacarla.'],
        ['No sé qué es', 'Tranquilo, yo me encargo.'],
      ] },
    ],
  },
  audiovisual: {
    intro: 'Las fotos y videos bonitos son lo que más hace que la gente se antoje y compre.',
    qs: [
      { key: 'contenido', q: '¿Qué fotos o videos quieres?', help: 'Toca todo lo que te interese.', type: 'multi', opts: [
        ['Fotografía de producto', 'Fotos bonitas de lo que vendes.'],
        ['Fotografía corporativa', 'Fotos de ti, tu equipo y tu local.'],
        ['Video publicitario', 'Un video tipo comercial de televisión.'],
        ['Reels para redes', 'Videos cortos para Instagram, TikTok o Facebook.'],
        ['Video institucional', 'Un video contando la historia de tu negocio.'],
        ['Cobertura de evento', 'Voy a tu evento y lo grabo.'],
      ] },
      { key: 'frecuencia', q: '¿Cada cuánto los necesitas?', help: 'Si es cada mes, cada foto o video te sale más barato.', type: 'single', opts: [
        ['Una sola vez', 'Solo esta vez.'],
        ['Mensual', 'Fotos y videos nuevos cada mes.'],
        ['Por campaña', 'Cuando vayas a sacar algo nuevo.'],
      ] },
    ],
  },
  marketing: {
    intro: 'Tener redes no basta: hay que publicar seguido y mostrarse a la gente correcta para que te compren.',
    qs: [
      { key: 'acciones', q: '¿En qué te ayudo con tus redes?', help: 'Puedes tocar varias.', type: 'multi', opts: [
        ['Contenido para redes', 'Te hago las publicaciones de Facebook e Instagram.'],
        ['Campañas en Meta Ads', 'Pago anuncios para que te vea gente nueva de tu zona.'],
        ['Lanzamiento de marca/producto', 'Un plan para que mucha gente se entere de algo nuevo.'],
        ['Promociones y ventas', 'Diseños para anunciar tus ofertas.'],
        ['Estrategia completa', 'Te digo qué hacer y me encargo de todo.'],
      ] },
      { key: 'pauta', q: '¿Cuánto podrías poner al mes para anuncios?', help: 'Es la plata que se le paga a Facebook para mostrar tus anuncios. Va aparte de nuestro trabajo.', type: 'single', opts: [
        ['Aún no sé', 'Te aconsejo cuánto.'], ['Bajo', 'Poquito, para empezar a probar.'], ['Medio', 'Algo más, para crecer.'], ['Alto', 'Bastante, para crecer rápido.'],
      ] },
    ],
  },
  print: {
    intro: 'Lo impreso hace que te vean en la calle. Yo lo diseño y lo mando a imprimir.',
    qs: [
      { key: 'impresos', q: '¿Qué necesitas imprimir?', help: 'Lo diseño, lo imprimo y te ayudo a instalarlo.', type: 'multi', opts: [
        ['Letrero / aviso', 'El aviso grande de la entrada de tu local.'],
        ['Afiches', 'Para pegar y anunciar promociones.'],
        ['Pendones / banners', 'Los que se paran en el piso, para ferias o la entrada.'],
        ['Vinilos y adhesivos', 'Para vitrinas, carros o paredes.'],
        ['Señalización', 'Letreros dentro del local (baños, salida, caja).'],
        ['Tarjetas y material promocional', 'Volantes, stickers y tarjetas.'],
        ['Branding del local', 'Decoro tu local con tu marca.'],
      ] },
    ],
  },
};

export const STYLES = [['Minimalista', 'Limpio y ordenado'], ['Elegante', 'Fino y de lujo'], ['Moderno', 'Actual y fresco'], ['Divertido', 'Alegre y de colores'], ['Corporativo', 'Formal y confiable'], ['Natural', 'Tonos de tierra y plantas'], ['Atrevido', 'Llamativo y diferente'], ['Clásico', 'Tradicional, de toda la vida']];
export const TIMING = [['Lo antes posible', 'Lo necesito ya'], ['En 2–4 semanas', 'En unas semanas'], ['En 1–2 meses', 'Con calma'], ['Sin prisa', 'Cuando esté listo']];
export const BUDGET = [['Aún no lo sé', 'Ayúdenme a decidir'], ['Básico', 'Lo justo y necesario'], ['Intermedio', 'Algo bueno sin exagerar'], ['Completo / premium', 'Quiero lo mejor']];

const INFO = {
  cats: 'Puedes escoger una sola cosa o varias. Si escoges varias, una sola persona se encarga de todo para que tu página, tu logo y tu publicidad se vean iguales. Eso tiene un costo extra pequeño por la coordinación.',
  tiers: 'Te dejo listas las opciones que más recomiendo. Más adelante puedes cambiar lo que quieras.',
  plan: 'Los paquetes juntan varias cosas a mejor precio.',
  services: 'Por cada cosa que toques te haré unas preguntas cortas. No te preocupes si no sabes algo: puedes tocar "No sé" y te ayudo.',
  template: 'Escoger un diseño ya hecho hace que tu página esté lista más rápido y cueste menos. Le pongo tu nombre, tus fotos y tus colores.',
  business: 'Con esto entiendo tu negocio para hacerte algo que de verdad te sirva.',
  style: 'Es como escoger la ropa de tu negocio: ¿cómo quieres que se vea? No hay respuestas malas.',
  timing: 'Esto me ayuda a organizarme. No es un compromiso.',
  contact: 'Te escribiré a este WhatsApp con el precio. Tus datos son solo para eso, no se los doy a nadie.',
  summary: 'Revisa que todo esté bien. Si algo no te gusta, toca "Atrás" y lo cambias.',
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initQuote({ onStep }) {
  const lite = () => document.documentElement.classList.contains('lite');
  // Desktop scrolls the inner stage; phones scroll the whole wizard (iOS Safari-safe)
  const scroller = () => (lite() ? root : stage);
  const root = document.createElement('div');
  root.className = 'quote';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Cotizador guiado');
  root.innerHTML = `
    <div class="quote-window vision">
      <div class="quote-top">
        <span class="logo">KstaStudio<span class="cursor">_</span> <small class="mono muted">pide tu precio</small></span>
        <div class="quote-dots" id="qDots"></div>
        <button class="quote-close" id="qClose" aria-label="Cerrar">✕</button>
      </div>
      <div class="quote-stage" id="qStage"></div>
      <div class="quote-nav">
        <button class="btn btn-ghost" id="qBack">Atrás</button>
        <span class="seg mono" id="qCount"></span>
        <button class="btn" id="qNext">Continuar</button>
      </div>
    </div>
    <div class="tpl-modal" id="tplModal">
      <div class="tpl-modal-bar vision"><b id="tplModalName"></b><span class="muted" id="tplModalTag"></span>
        <button class="btn btn-sm" id="tplModalUse">Me gusta este</button>
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
        <span class="tick">${icons.check}</span><span class="choice-txt"><b>${esc(plain(val))}</b>${desc ? `<small>${esc(desc)}</small>` : ''}</span>
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
    cats: () => head('paso 1', '¡Hola! ¿Qué necesitas?', 'Toca una o varias. ¿Tienes dudas? Tranqui, más adelante te explico todo.') + info('cats') + `
      <div class="choices big cats">${CAT_ORDER.map((k, i) => {
        const c = CATS[k], cheapest = c.tiers.map((t) => tierPrice(t)).sort((a, b) => fromValue(a) - fromValue(b))[0];
        return `<button type="button" class="choice vision ${state.cats.includes(k) ? 'on' : ''}" data-name="cats" data-val="${k}" data-multi="1" style="--i:${i}">
          <span class="icon">${icons[c.icon]}</span><b>${esc(c.label)}</b><small>${esc(c.desc)}</small><span class="from">desde <b>${priceHTML({ ...cheapest, monthly: cheapest.total ? 0 : cheapest.monthly }, cop)}</b></span><span class="tick corner">${icons.check}</span></button>`;
      }).join('')}${CAT_SOON.map((k) => `<div class="choice vision soon" aria-disabled="true"><span class="icon">${icons[CATS[k].icon]}</span><b>${esc(CATS[k].label)}</b><small>Muy pronto podrás pedirnos esto también.</small><span class="pill">Próximamente</span></div>`).join('')}</div>
      ${CAT_ORDER.length > 1 ? `<div class="combo-meter vision" id="comboMeter">${comboMeter()}</div>` : ''}`,
    tiers: () => head('tu plan', state.cats.length > 1 ? 'Escoge una de cada una.' : '¿Cuál te late más?', 'Cada opción ya trae lo que más recomiendo. Después cambias lo que quieras, sin lío.') + info('tiers') +
      state.cats.map((k) => `<div class="q-block"><h3 class="tier-head"><i>${icons[CATS[k].icon]}</i>${esc(CATS[k].label)}</h3>
        <div class="choices tiers">${CATS[k].tiers.map((t, i) => { const tp = tierPrice(t); return `
          <button type="button" class="choice vision tier ${state.tiers[k] === t.id ? 'on' : ''} ${t.featured ? 'feat' : ''}" data-name="tier:${k}" data-val="${t.id}" data-multi="0" style="--i:${i}">
            <span class="tier-top"><b>${esc(t.name)}</b><span class="pill">${esc(t.tag)}</span></span>
            <span class="tier-price">${priceHTML(tp, cop)}</span>
            <ul>${t.items.map((x) => `<li>${icons.check}${esc(x)}</li>`).join('')}</ul>
            <span class="tick corner">${icons.check}</span>
          </button>`; }).join('')}
          <button type="button" class="choice vision tier tier-custom ${state.tiers[k] === 'custom' ? 'on' : ''}" data-name="tier:${k}" data-val="custom" data-multi="0" style="--i:3">
            <span class="tier-top"><b>Quiero escoger yo</b></span><small>Prefiero ir escogiendo cada cosa en las siguientes preguntas.</small><span class="tick corner">${icons.check}</span>
          </button>
        </div></div>`).join(''),
    services: () => head('revisa', '¿Así está bien?', 'Ya te marqué lo que trae tu plan. Toca para quitar o agregar.') +
      info('services') + bigChoice('services', Object.entries(SERVICES).filter(([id]) => ['web', 'branding'].includes(id)).map(([id, s]) => ({ id, ...s })), state.services, true),
    detail: (svc) => head(`// ${SERVICES[svc].label.toLowerCase()}`, SERVICES[svc].label) + info(null, DETAILS[svc].intro) +
      DETAILS[svc].qs.map((d) => `<div class="q-block"><h3>${d.q}${d.type === 'multi' ? ' <span class="pill">varias</span>' : ''}</h3><p class="q-help">${d.help}</p>${choice(`d:${svc}:${d.key}`, d.opts, (state.details[svc] || {})[d.key] ?? (d.type === 'multi' ? [] : null), d.type === 'multi')}</div>`).join(''),
    template: () => head('ejemplos de páginas', '¿Cuál te enamora más?', 'Toca “Ver cómo se ve” para mirarlo completo. Después le pongo tu nombre, tus fotos y tus colores.') + info('template') + `
      <div class="tpl-grid">${TEMPLATES.map((t, i) => `
        <div class="tpl vision ${state.template === t.id ? 'on' : ''}" data-tpl="${t.id}" style="--i:${i}">
          <div class="tpl-thumb"><iframe src="/templates/${t.id}/index.html" loading="lazy" tabindex="-1" title="${t.name}" aria-hidden="true"></iframe></div>
          <div class="tpl-body"><div><b>${t.name}</b><span class="pill">${t.tag}</span></div><p>${t.desc}</p>
            <div class="tpl-actions"><button type="button" class="btn btn-sm btn-ghost" data-preview="${t.id}">Ver cómo se ve</button><button type="button" class="btn btn-sm" data-pick="${t.id}">${state.template === t.id ? '✓ Elegida' : 'Elegir'}</button></div></div>
        </div>`).join('')}
        <div class="tpl vision tpl-custom ${state.template === 'custom' ? 'on' : ''}" data-tpl="custom">
          <div class="icon">${icons.sparkles}</div><b>Quiero un diseño único</b><p>Prefiero que me hagan algo desde cero, solo para mi negocio.</p>
          <button type="button" class="btn btn-sm" data-pick="custom">${state.template === 'custom' ? '✓ Elegido' : 'Elegir'}</button>
        </div>
      </div>
      <p class="q-credit mono muted">Plantillas base por <a href="https://html5up.net" target="_blank" rel="noopener">HTML5 UP</a> (CC BY 3.0).</p>`,
    business: () => head('tu negocio', 'Cuéntame de tu negocio, quiero conocerlo.') + info('business') + `
      <div class="fields">
        <label>¿Cómo se llama tu negocio? *<input data-f="business.name" value="${esc(state.business.name)}" maxlength="120" placeholder="Ej: Café Aurora" /><small>Tal como quieres que aparezca.</small></label>
        <label>¿Qué vendes o a qué te dedicas? *<input data-f="business.sector" value="${esc(state.business.sector)}" maxlength="120" placeholder="Ej: cafetería de especialidad" /><small>Con tus palabras, por ejemplo: “vendo tortas para cumpleaños”.</small></label>
        <label>Ciudad<input data-f="business.city" value="${esc(state.business.city)}" maxlength="80" /><small>Para mostrarte a la gente de tu zona.</small></label>
        <label>¿Tienes Instagram o Facebook?<input data-f="business.link" value="${esc(state.business.link)}" maxlength="200" placeholder="@tunegocio" /><small>Si tienes, escríbelo. Si no, déjalo vacío.</small></label>
        <label class="span2">¿Quiénes te compran normalmente?<input data-f="business.audience" value="${esc(state.business.audience)}" maxlength="200" placeholder="Ej: jóvenes de 20 a 35 que trabajan cerca" /><small>Así hago algo que le guste a tus clientes.</small></label>
      </div>`,
    style: () => head('estilo', '¿Qué estilo va contigo?', 'Toca hasta 3. Aquí no hay respuestas malas.') + info('style') +
      choice('style', STYLES, state.style, true) + `
      <div class="fields one"><label>¿Hay colores o negocios que te gusten?<textarea data-f="business.refs" rows="3" maxlength="600" placeholder="Ej: tonos tierra, me gusta cómo se ve la marca X…">${esc(state.business.refs)}</textarea><small>No es obligatorio, pero me ayuda mucho.</small></label></div>`,
    timing: () => head('tiempo y plata', '¿Para cuándo y con cuánta plata?') + info('timing') +
      `<div class="q-block"><h3>¿Para cuándo lo necesitas?</h3>${choice('timing', TIMING, state.timing, false)}</div>
       <div class="q-block"><h3>¿Cuánto quieres gastar más o menos?</h3>${choice('budget', BUDGET, state.budget, false)}</div>`,
    contact: () => head('último pasito', '¿A dónde te mando el precio?') + info('contact') + `
      <div class="fields">
        <label>Tu nombre *<input data-f="contact.name" value="${esc(state.contact.name)}" maxlength="100" /></label>
        <label>WhatsApp *<input data-f="contact.phone" value="${esc(state.contact.phone)}" maxlength="30" inputmode="tel" placeholder="+57 300 000 0000" /><small>Aquí te escribo con el precio.</small></label>
        <label class="span2">Email *<input data-f="contact.email" type="email" value="${esc(state.contact.email)}" maxlength="150" /></label>
        <label class="span2">¿Quieres contarnos algo más?<textarea data-f="contact.notes" rows="3" maxlength="1500">${esc(state.contact.notes)}</textarea></label>
        <label class="span2 consent"><input type="checkbox" id="qConsent" ${state.contact.consent ? 'checked' : ''} /> <span>Acepto que KstaStudio_ use mis datos solo para responderme sobre mi pedido. <a href="/privacidad.html" target="_blank" rel="noopener">Leer el aviso de privacidad</a></span></label>
      </div>`,
    summary: () => head('casi, casi', 'Mira, esto es lo que me pediste.') + info('summary') +
      `<div class="summary vision">${summaryLines().map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`,
  };

  const planLabel = () => state.cats.map((k) => (state.tiers[k] === 'custom' ? `${CATS[k].label} a medida` : findTier(state.tiers[k])?.tier.name || CATS[k].label)).join(' + ');
  const planId = () => `cats-${Math.max(1, state.cats.length)}`;
  function comboMeter() {
    const n = state.cats.length, off = COMBO[n] || 0;
    return `<div class="cm-steps">${[1, 2, 3].map((i) => `<span class="${n >= i ? 'on' : ''}">${i}</span>`).join('<i></i>')}</div>
      <p>${n === 0 ? 'Toca al menos una opción.' : n === 1 ? 'Si quieres, puedes tocar otra opción más.' : n === 2 ? 'Escogiste 2 cosas: una sola persona se encarga de todo (+15% por la coordinación).' : 'Escogiste las 3: me encargo de todo tu negocio (+25% por la coordinación).'}</p>
      ${off ? `<span class="cm-badge">Premium</span>` : ''}`;
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
        if (v && (!Array.isArray(v) || v.length)) lines.push([d.q.replace(/[¿?]/g, ''), Array.isArray(v) ? v.map(plain).join(', ') : plain(v)]);
      });
      if (s === 'web' && state.template) lines.push(['Plantilla web', templateLabel()]);
    });
    const b = state.business;
    lines.push(['Negocio', [b.name, b.sector, b.city].filter(Boolean).join(' · ')]);
    if (b.link) lines.push(['Redes / web', b.link]);
    if (b.audience) lines.push(['Cliente ideal', b.audience]);
    if (state.style.length) lines.push(['Estilo', state.style.map(plain).join(', ')]);
    if (b.refs) lines.push(['Referencias', b.refs]);
    lines.push(['¿Para cuándo?', state.timing], ['Presupuesto', plain(state.budget)]);
    lines.push(['Contacto', `${state.contact.name} · ${state.contact.phone} · ${state.contact.email}`]);
    if (state.contact.notes) lines.push(['Notas', state.contact.notes]);
    return lines.filter(([, v]) => v);
  }

  // ---------- validation ----------
  function validate() {
    const s = steps[idx];
    const need = (ok, msg) => { if (!ok) toast(msg); return ok; };
    if (s === 'cats') return need(state.cats.length, 'Toca al menos una opción para seguir');
    if (s === 'tiers') return need(state.cats.every((k) => state.tiers[k]), 'Escoge un plan y seguimos');
    if (s === 'services') return need(state.services.length, 'Ups, toca al menos una opción');
    if (s === 'template') return need(state.template, 'Escoge un diseño, ¡o pide uno a tu medida!');
    if (s.startsWith('detail:')) {
      const svc = s.split(':')[1];
      return need(DETAILS[svc].qs.every((d) => { const v = (state.details[svc] || {})[d.key]; return d.type === 'multi' ? v?.length : v; }), 'Te faltan unas preguntitas');
    }
    if (s === 'business') return need(state.business.name && state.business.sector, 'Cuéntame cómo se llama tu negocio y a qué se dedica');
    if (s === 'timing') return need(state.timing && state.budget, 'Te falta decirnos para cuándo y con cuánta plata');
    if (s === 'contact') {
      const c = state.contact;
      return need(c.name && (c.phone || '').replace(/\D/g, '').length >= 7 && /^\S+@\S+\.\S+$/.test(c.email || ''), 'Revisa tu nombre, tu WhatsApp y tu correo, porfa') && need(state.contact.consent, 'Marca la casilla de privacidad para poder enviarlo');
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
    scroller().scrollTop = 0;
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
      if (lite()) {
        // Phones: the whole wizard scrolls; bring the next question just under the header
        if (bIdx > 0) root.scrollTo({ top: Math.max(0, cur.getBoundingClientRect().top + root.scrollTop - 90), behavior: 'smooth' });
      } else {
        const top = cur.offsetTop - stage.clientHeight / 2 + Math.min(cur.offsetHeight, stage.clientHeight * 0.7) / 2;
        stage.scrollTo({ top: bIdx === 0 ? 0 : top, behavior: 'smooth' });
      }
    }
    const input = cur.querySelector('input, textarea');
    if (input && matchMedia('(hover: hover)').matches) setTimeout(() => input.focus({ preventScroll: true }), 350);
    updateNav();
  }

  function updateNav() {
    const lastBlock = bIdx >= blocks.length - 1;
    back.style.visibility = idx || bIdx ? 'visible' : 'hidden';
    back.textContent = bIdx > 0 && !lite() ? 'Anterior' : 'Atrás';
    next.innerHTML = steps[idx] === 'summary' ? `Enviar solicitud ${icons.send}` : !lastBlock && !lite() ? 'Siguiente' : 'Continuar';
    if (lite()) back.style.visibility = idx ? 'visible' : 'hidden';
  }

  function render(dir = 1) {
    const [name, arg] = steps[idx].split(':');
    panelEl = swap(R[name](arg), dir);
    blocks = [...panelEl.querySelectorAll(':scope > .choices, .q-block, :scope > .tpl-grid, .fields > label, :scope > .summary')];
    blocks.forEach((b) => b.classList.add('q-focus'));
    panelEl.classList.toggle('focus-mode', blocks.length > 1 && !lite());
    dots.innerHTML = steps.map((_, i) => `<span class="${i < idx ? 'done' : i === idx ? 'cur' : ''}"></span>`).join('');
    count.textContent = `Paso ${idx + 1} de ${steps.length}`;
    onStep(idx);
    setTimeout(() => setBlock(dir < 0 ? blocks.length - 1 : 0), dir < 0 ? 350 : 0);
    if (dir >= 0) setBlock(0, false);
  }

  // Move one question; at the edges, move one whole step
  function nextBlock() {
    if (bIdx < blocks.length - 1) {
      if (!blockAnswered(blocks[bIdx])) { shakeBlock(); return toast('Respóndeme esta y seguimos'); }
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
  $('#tplModalUse').addEventListener('click', (e) => { pickTemplate(e.currentTarget.dataset.id); closePreview(); toast('¡Buena elección!'); });

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
      if (!state.style.includes(val) && state.style.length >= 3) return toast('Hasta 3 no más, ¡no te emociones!');
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

  // Info boxes collapse to 2 lines on phones; tap to expand
  stage.addEventListener('click', (e) => { const i = e.target.closest('.q-info'); if (i) i.classList.toggle('open'); });

  stage.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (!f) return;
    const [group, key] = f.split('.');
    state[group][key] = e.target.value.trim();
  });

  // On phones the bottom buttons move whole steps (questions are just scrolled)
  back.addEventListener('click', () => (lite() ? go(-1) : prevBlock()));
  next.addEventListener('click', () => (lite() ? go(1) : nextBlock()));
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
      toast('Uy, algo falló. ¿Lo intentas otra vez?');
      next.disabled = false; next.innerHTML = `Reintentar ${icons.send}`; busy = false;
    }
  }

  function showDone(lead) {
    const first = esc(state.contact.name.split(' ')[0]);
    swap(`
      <div class="done-badge">${icons.check}</div>
      <p class="eyebrow">¡me llegó!</p>
      <h2>¡Listo, ${first}! Ya estoy en esas.</h2>
      <p class="q-sub">Ya tengo tu pedido de <b>${esc(planLabel())}</b>. Prepárate, que muy pronto te escribo al WhatsApp y al correo con tu precio y todo explicado.</p>
      <div class="done-send vision">
        <div><span class="ds-icon">${icons.whatsapp}</span><span><small>WhatsApp</small><b>${esc(state.contact.phone)}</b></span></div>
        <div><span class="ds-icon">${icons.mail}</span><span><small>Correo electrónico</small><b>${esc(state.contact.email)}</b></span></div>
      </div>
      <div class="done-steps">
        <div class="vision"><span>01</span><b>¡Me llegó!</b><small>Ya lo estoy mirando.</small></div>
        <div class="vision"><span>02</span><b>Hago cuentas</b><small>Miro lo que necesitas y armo tu precio.</small></div>
        <div class="vision"><span>03</span><b>Te escribo</b><small>Por WhatsApp y correo, con todo clarito.</small></div>
      </div>
      <div id="booking">${bookingHTML()}</div>
      <button class="btn btn-ghost" data-close>Volver a la página</button>`, 1, 'done');
    setupBooking(stage.querySelector('#booking .booking'), lead, toast);
    dots.querySelectorAll('span').forEach((d) => (d.className = 'done'));
    root.querySelector('.quote-nav').classList.add('gone'); root.classList.add('finished');
    onStep(99); // celebratory pose
  }

  stage.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  stage.addEventListener('change', (e) => { if (e.target.id === 'qConsent') state.contact.consent = e.target.checked; });

  // ---------- motion-graphics intro ----------
  const INTRO = [
    { icon: 'target', sats: ['code', 'rocket', 'building'], t: 'Toca lo que necesitas', d: 'Una página, un logo o las dos. Solo tocas y ya.' },
    { icon: 'list', sats: ['brand', 'code', 'video'], t: 'Preguntas facilitas', d: 'Todo explicado en palabras normales. ¿No sabes algo? Tranqui, te ayudo.' },
    { icon: 'palette', sats: ['images', 'code', 'sparkles'], t: 'Cuéntame tu estilo', d: 'Mira ejemplos de páginas y dime cómo te sueñas tu negocio.' },
    { icon: 'handshake', sats: ['whatsapp', 'chat', 'calendar'], t: 'Te escribo', d: 'Te mando el precio por WhatsApp. Preguntar es gratis, de verdad.' },
  ];
  const SCENE_MS = 3200;
  let introTimer = null, introIdx = 0;

  function playIntro() {
    root.classList.add('intro');
    const panel = swap(`
      <div class="intro-stories">${INTRO.map(() => '<span><i></i></span>').join('')}</div>
      <p class="eyebrow intro-eyebrow">así de fácil · 2 minuticos</p>
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
        <button type="button" class="btn btn-ghost btn-sm" data-skip>Ya entendí, saltar</button>
        <button type="button" class="btn btn-lg" data-start>Empezar</button>
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
    if (preset && typeof preset === 'object') { state.cats = [...preset.cats]; state.tiers = { ...preset.tiers }; }
    else if (preset === 'combo') state.cats = [...CAT_ORDER];
    else if (CATS[preset]) state.cats = [preset];
    else if (findTier(preset)) { const { cat } = findTier(preset); state.cats = [cat]; state.tiers[cat] = preset; }
    buildSteps();
    if (state.cats.length) idx = 1;
    stage.innerHTML = '';
    root.querySelector('.quote-nav').classList.remove('gone'); root.classList.remove('finished');
    next.disabled = false; busy = false;
    document.body.classList.add('quote-open');
    root.classList.add('open');
    if (lite()) render(1); else playIntro();
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
