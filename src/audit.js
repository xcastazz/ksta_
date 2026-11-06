// =========================================================
//  AUDITORÍA WEB: preguntas que responde el administrador
//  → hallazgos, notas por categoría y documento listo para PDF
// =========================================================

// Each check: `bad` is the answer that means there is a problem.
// sev: alta (resta 3) · media (resta 2) · baja (resta 1)
export const AUDIT_CATS = [
  { id: 'func', name: 'Funcionalidad', checks: [
    { id: 'solo_wa', q: '¿Casi todos los botones llevan solo a WhatsApp?', bad: true, sev: 'alta', title: 'Todo lleva a WhatsApp, y nada más funciona', why: 'Quien no quiere escribir por WhatsApp no tiene otra forma de contactar, y no queda registro ordenado de lo que necesita.', fix: 'Un formulario corto que organice la solicitud y la entregue ya escrita, además de WhatsApp como opción.' },
    { id: 'form', q: '¿Tiene un formulario de contacto que funcione?', bad: false, sev: 'media', title: 'No hay formulario de contacto', why: 'Muchas personas prefieren dejar sus datos y esperar a que las contacten.', fix: 'Agregar un formulario con nombre, celular y lo que necesita, con casilla de tratamiento de datos.' },
    { id: 'roto', q: '¿Hay cosas rotas o que no funcionan (contadores en cero, enlaces muertos, botones sin acción)?', bad: true, sev: 'alta', title: 'Hay elementos que no funcionan', why: 'Un contador en cero o un enlace roto hace que la página parezca abandonada o poco seria.', fix: 'Quitar o arreglar todo lo que no funciona y revisar cada enlace.' },
    { id: 'pago', q: '¿Se puede pagar, reservar o agendar en línea cuando la página lo promete?', bad: false, sev: 'media', title: 'Promete algo que no se puede hacer en la página', why: 'Mostrar medios de pago o reservas sin un botón para usarlos genera frustración.', fix: 'Un enlace de pago (Wompi, Mercado Pago) o un agendador, o explicar claramente cómo hacerlo.' },
    { id: 'movil', q: '¿Se ve y funciona bien en el celular?', bad: false, sev: 'alta', title: 'No funciona bien en el celular', why: 'La mayoría de las visitas llegan desde el celular.', fix: 'Rediseñar pensando primero en el celular: textos legibles, botones grandes, nada cortado.' },
  ]},
  { id: 'conf', name: 'Confianza', checks: [
    { id: 'quien', q: '¿Muestra quién está detrás (nombres, fotos reales, equipo)?', bad: false, sev: 'alta', title: 'No se sabe quién está detrás', why: 'La gente compra a personas. Sin nombres ni fotos reales, cuesta confiar.', fix: 'Una sección "Quién te atiende" con nombre, foto profesional y experiencia.' },
    { id: 'testim', q: '¿Tiene opiniones o testimonios reales de clientes?', bad: false, sev: 'alta', title: 'Sin opiniones de clientes', why: 'Las opiniones de otros clientes son lo que más convence a alguien nuevo.', fix: '3 testimonios reales, con el permiso de cada cliente, y conectar las opiniones de Google.' },
    { id: 'datos', q: '¿La información es consistente (cifras, años, precios, datos de redes)?', bad: false, sev: 'media', title: 'Datos que no cuadran', why: 'Cifras distintas, años viejos o precios sin contexto hacen dudar de todo lo demás.', fix: 'Unificar la información en la página, Google y redes sociales.' },
    { id: 'contacto', q: '¿Muestra horario, correo y ubicación o mapa?', bad: false, sev: 'media', title: 'Faltan horario, correo o mapa', why: 'El cliente quiere saber cuándo y dónde lo atienden antes de escribir.', fix: 'Horario de atención, un correo profesional y el mapa del local u oficina.' },
    { id: 'privacidad', q: '¿Tiene aviso de privacidad o tratamiento de datos (Ley 1581)?', bad: false, sev: 'baja', title: 'Sin aviso de tratamiento de datos', why: 'En Colombia es obligatorio si la página recoge datos personales, y da tranquilidad al cliente.', fix: 'Agregar un aviso de privacidad sencillo y una casilla de aceptación en los formularios.' },
  ]},
  { id: 'pers', name: 'Personalidad', checks: [
    { id: 'plantilla', q: '¿Se ve genérica, como una plantilla?', bad: true, sev: 'media', title: 'Luce como una plantilla', why: 'Una página genérica no se recuerda y no transmite lo que hace especial al negocio.', fix: 'Menos adornos, más espacio, una tipografía con carácter y fotos propias.' },
    { id: 'coherente', q: '¿Colores, letras y logo son coherentes con la marca?', bad: false, sev: 'baja', title: 'La identidad visual no es coherente', why: 'Colores o letras que cambian de una parte a otra restan profesionalismo.', fix: 'Definir una paleta y dos tipografías y usarlas en toda la página.' },
    { id: 'tono', q: '¿Los textos le hablan al cliente (y no solo de la empresa)?', bad: false, sev: 'baja', title: 'Los textos hablan de la empresa, no del cliente', why: 'Misión, visión y valores casi no se leen; la gente busca saber si le pueden ayudar.', fix: 'Escribir desde el problema del cliente y dejar la misión en una línea.' },
  ]},
  { id: 'cone', name: 'Conexión con el cliente', checks: [
    { id: 'claro', q: '¿En 5 segundos se entiende qué ofrecen y para quién?', bad: false, sev: 'alta', title: 'No se entiende rápido qué ofrecen', why: 'Si el visitante no entiende en segundos, se va.', fix: 'Un título claro que diga qué hacen, para quién y cuál es el siguiente paso.' },
    { id: 'lenguaje', q: '¿Usa palabras sencillas que entiende cualquiera?', bad: false, sev: 'media', title: 'Lenguaje técnico o difícil', why: 'Las palabras técnicas alejan al cliente común.', fix: 'Explicar cada servicio con las palabras que usaría el cliente.' },
    { id: 'faq', q: '¿Responde las dudas de siempre (precios, tiempos, cómo funciona)?', bad: false, sev: 'media', title: 'Sin respuestas a las dudas frecuentes', why: 'Cada duda sin responder es una razón para no escribir.', fix: 'Una sección corta de preguntas frecuentes.' },
    { id: 'una_pagina', q: '¿Está todo amontonado en una sola página larga?', bad: true, sev: 'baja', title: 'Todo está en una sola página', why: 'Es difícil encontrar la información y Google tiene menos páginas para mostrar.', fix: 'Organizar el contenido en secciones o páginas por servicio.' },
  ]},
  { id: 'tec', name: 'Técnico y Google', checks: [
    { id: 'https', q: '¿Tiene candado de seguridad (https)?', bad: false, sev: 'alta', title: 'Sin candado de seguridad', why: 'Los navegadores marcan la página como "no segura".', fix: 'Activar el certificado de seguridad (https).' },
    { id: 'seo', q: '¿Tiene título y descripción para Google?', bad: false, sev: 'media', title: 'Sin título ni descripción para Google', why: 'Google no sabe bien qué mostrar cuando la página aparece en búsquedas.', fix: 'Escribir título y descripción con las palabras que la gente busca.' },
    { id: 'maps', q: '¿Tiene Perfil de Empresa en Google Maps, verificado y completo?', bad: false, sev: 'alta', title: 'Sin perfil en Google Maps', why: 'Es lo primero que aparece cuando alguien busca un negocio cerca.', fix: 'Crear y verificar el Perfil de Empresa de Google, con fotos, horario y opiniones.' },
    { id: 'rapida', q: '¿Carga rápido (menos de 3 segundos en el celular)?', bad: false, sev: 'media', title: 'La página carga lento', why: 'Cada segundo extra hace que más personas se vayan.', fix: 'Optimizar imágenes y videos y quitar lo que no se usa.' },
    { id: 'accesible', q: '¿Las imágenes y botones tienen texto alternativo y nombres claros?', bad: false, sev: 'baja', title: 'Imágenes y botones sin descripción', why: 'Afecta a personas con lectores de pantalla y a cómo Google entiende la página.', fix: 'Agregar texto alternativo y etiquetas claras.' },
  ]},
];

export const RECOS = {
  reforma: { label: 'Reforma completa', text: 'Una <b>reforma de la página</b>, no un parche: mantener lo que ya identifica al negocio y reorganizar todo alrededor de lo que el cliente necesita.' },
  mejoras: { label: 'Mejoras puntuales', text: 'La página tiene una buena base. Recomendamos <b>mejoras puntuales</b> en los puntos de prioridad alta antes de invertir en publicidad.' },
  visibilidad: { label: 'Visibilidad en Google', text: 'La página cumple. El siguiente paso es <b>ganar visibilidad</b>: Perfil de Empresa de Google, opiniones y anuncios en búsquedas.' },
};

const PEN = { alta: 3, media: 2, baja: 1 };
export function auditFindings(a) {
  const out = [];
  for (const c of AUDIT_CATS) for (const k of c.checks) {
    const v = a.answers?.[k.id];
    if (v === undefined || v === null) continue;
    if (v === k.bad) out.push({ cat: c.id, catName: c.name, ...k, note: a.notes?.[k.id] || '' });
  }
  return out;
}
export function auditScores(a) {
  const f = auditFindings(a);
  return Object.fromEntries(AUDIT_CATS.map((c) => {
    const auto = Math.max(1, 10 - f.filter((x) => x.cat === c.id).reduce((s, x) => s + PEN[x.sev], 0));
    const o = Number(a.scoreOverride?.[c.id]);
    return [c.id, o >= 1 && o <= 10 ? o : auto];
  }));
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

// Full printable document (same look as the audit made by hand)
export function buildAuditHTML(a, { origin = location.origin, owner = 'Jerónimo Castañeda Velásquez', phone = '', email = '', instagram = 'kstastudio_' } = {}) {
  const f = auditFindings(a);
  const sc = auditScores(a);
  const order = { alta: 0, media: 1, baja: 2 };
  const date = new Date(a.date || Date.now()).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const client = esc(a.client || 'Tu empresa');
  const site = esc((a.url || '').replace(/^https?:\/\//, '').replace(/\/$/, ''));
  const cls = (n) => (n <= 4 ? 'bad' : n <= 6 ? 'mid' : 'ok');
  const reco = RECOS[a.reco] || RECOS.reforma;
  const altas = f.filter((x) => x.sev === 'alta').length;
  const pages = [];
  let pageNo = 1;
  const page = (inner) => { pageNo++; pages.push(`<section class="page">${inner}<div class="foot"><span>KstaStudio_ · Auditoría web · ${client}</span><span>${pageNo}</span></div></section>`); };
  const findingHTML = (x) => `<div class="finding"><h4><i class="${x.sev}">${x.sev.toUpperCase()}</i>${esc(x.title)}</h4><p>${x.note ? esc(x.note) + ' ' : esc(x.why) + ' '}<b>Propuesta:</b> ${esc(x.fix)}</p></div>`;

  // Resumen
  page(`<p class="eyebrow">01 · Resumen</p><h2>Lo que encontramos, en una página.</h2>
    ${lines(a.summary).map((p) => `<p>${esc(p)}</p>`).join('') || `<p>Revisamos <b>${site || 'la página'}</b> pensando en lo que vive un cliente nuevo cuando llega: si entiende qué ofrecen, si confía y si es fácil dar el siguiente paso. Encontramos <b>${f.length} oportunidades de mejora</b>${altas ? `, <b>${altas} de prioridad alta</b>` : ''}.</p>`}
    <div class="score">${AUDIT_CATS.map((c) => `<div class="${cls(sc[c.id])}"><b>${sc[c.id]}/10</b><small>${c.name}</small></div>`).join('')}</div>
    <h3>Nuestra recomendación</h3><p>${reco.text}</p>${f.filter((x) => x.sev === 'alta').length ? `<h3>Lo más urgente</h3><div class="card"><ul>${f.filter((x) => x.sev === 'alta').slice(0, 6).map((x) => `<li><b style="color:var(--ink)">${esc(x.title)}.</b> ${esc(x.fix)}</li>`).join('')}</ul></div>` : ''}
    ${a.shotDesk || a.shotMob ? `<div class="shots">${a.shotDesk ? `<img class="shot" src="${a.shotDesk}" alt="" />` : '<span></span>'}${a.shotMob ? `<img class="shot" src="${a.shotMob}" alt="" />` : ''}</div><p class="muted" style="font-size:8.5pt">Página actual${site ? ` (${site})` : ''}, capturas del ${date}.</p>` : ''}`);

  // Hallazgos, grouped by category, paginated (~7 per page)
  const sorted = AUDIT_CATS.flatMap((c) => f.filter((x) => x.cat === c.id).sort((x, y) => order[x.sev] - order[y.sev]));
  if (sorted.length) {
    for (let i = 0; i < sorted.length; i += 7) {
      const chunk = sorted.slice(i, i + 7);
      let html = i ? '' : '<p class="eyebrow">02 · Hallazgos</p><h2>Qué le está costando clientes.</h2>';
      let last = '';
      chunk.forEach((x) => { if (x.cat !== last) { html += `<h3${!html ? ' style="margin-top:0"' : ''}>${x.catName}</h3>`; last = x.cat; } html += findingHTML(x); });
      page(html);
    }
  } else {
    page('<p class="eyebrow">02 · Hallazgos</p><h2>Una base sólida.</h2><p>No encontramos problemas importantes en los puntos revisados. Abajo están las recomendaciones para crecer.</p>');
  }

  // Lo que conservaríamos + extra notes
  const keep = lines(a.keep), extra = lines(a.extra);
  const palette = (a.colors || []).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c));
  if (keep.length || extra.length || palette.length) {
    page(`<p class="eyebrow">03 · Lo que vale la pena</p><h2>Lo que conservaríamos.</h2>
      ${keep.length ? `<div class="card"><ul>${keep.map((k) => `<li>${esc(k)}</li>`).join('')}</ul></div>` : ''}
      ${palette.length ? `<h3>Colores de la marca</h3><div class="palette">${palette.map((c) => `<span style="background:${c};color:${luma(c) > 160 ? '#2a2210' : '#fff'}">${c.toUpperCase()}</span>`).join('')}</div>` : ''}
      ${extra.length ? `<h3>Observaciones adicionales</h3>${extra.map((p) => `<p>${esc(p)}</p>`).join('')}` : ''}
      ${a.previewUrl ? `<div class="card" style="margin-top:12pt"><h4>Vista previa de la nueva versión</h4><p style="margin:0">Preparamos una vista previa que se puede abrir en el celular o el computador:<br /><b>${esc(a.previewUrl)}</b></p></div>` : ''}`);
  }

  // Plan + CTA
  const plan = a.reco === 'visibilidad'
    ? [['1. Reunión', 'Revisamos juntos esta auditoría y los objetivos del negocio.', '1 día'], ['2. Google', 'Perfil de Empresa de Google verificado y completo, con fotos y horario.', '3 a 10 días'], ['3. Medición', 'Instalamos la medición de contactos (WhatsApp, llamadas y formularios).', '1 día'], ['4. Anuncios', 'Campaña de búsqueda en Google Ads enfocada en los servicios principales.', '2 días'], ['5. Seguimiento', 'Ajustes semanales e informe mensual de resultados.', 'Mensual']]
    : a.reco === 'mejoras'
      ? [['1. Reunión', 'Priorizamos los hallazgos de esta auditoría.', '1 día'], ['2. Ajustes', 'Corregimos los puntos de prioridad alta y media.', '5 a 7 días'], ['3. Google', 'Título, descripción y Perfil de Empresa de Google.', '2 días'], ['4. Entrega', 'Revisión final y acompañamiento.', '1 día']]
      : [['1. Reunión', 'Revisamos juntos la auditoría y recogemos los datos reales del negocio.', '1 día'], ['2. Contenido', 'Ajustamos los textos de cada servicio pensando en el cliente.', '3 días'], ['3. Desarrollo', 'Construimos la página completa, rápida y adaptada al celular.', '7 a 10 días'], ['4. Google', 'Perfil de Empresa de Google y preparación para búsquedas.', '2 días'], ['5. Entrega', 'Publicación en su dominio, capacitación corta y acompañamiento.', '1 día']];
  page(`<p class="eyebrow">${keep.length || extra.length || palette.length ? '04' : '03'} · Cómo lo haríamos</p><h2>El siguiente paso.</h2>
    <table><tr><th style="width:24%">Etapa</th><th>Qué pasa</th><th style="width:16%">Tiempo</th></tr>${plan.map(([s, d, t]) => `<tr><td><b>${s}</b></td><td>${d}</td><td>${t}</td></tr>`).join('')}</table>
    ${a.price ? `<p>Inversión estimada: <b>${esc(a.price)}</b>. El detalle va en la cotización.</p>` : '<p>La inversión se presenta en una cotización aparte, según lo que el negocio decida incluir.</p>'}
    <div class="cta"><p style="font-family:'Cormorant Garamond',serif;font-size:21pt;line-height:1.15;margin-bottom:6pt">¿Hablamos 20 minutos esta semana?</p>
      <p style="margin:0;color:#d9ccf5">Te mostramos todo en vivo y resolvemos tus dudas. Sin compromiso.<br />${[phone && `WhatsApp ${esc(phone)}`, email && esc(email), instagram && `Instagram @${esc(instagram)}`, esc(origin.replace(/^https?:\/\//, ''))].filter(Boolean).join(' · ')}</p></div>
    <div class="sign"><img src="${origin}/logo-mark.svg" alt="" /><div><b>${esc(owner)}</b><br /><span class="muted">Fundador · KstaStudio_ · Medellín, Colombia</span></div></div>`);

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8" /><title>Auditoría web · ${client} · KstaStudio_</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${CSS}</style></head><body>
<div class="bar"><span>Revisa el documento y guárdalo como PDF</span><button onclick="print()">Guardar como PDF</button></div>
<section class="page cover">
  <div class="brand"><img src="${origin}/logo-mark.svg" alt="" /><span>Ksta<em>Studio</em>_</span></div>
  <div><p class="eyebrow" style="color:#c9b3ff">Auditoría de sitio web</p>
    <h1>${client}:<br /><span>${esc(a.headline || 'tu página puede ganar más clientes.')}</span></h1>
    <p style="margin-top:16pt;max-width:120mm;color:#cbbfe6">Revisión de ${site || 'la página web'}: qué funciona, qué le está costando clientes al negocio y qué haríamos para mejorarlo.</p></div>
  <div class="meta"><div><b>Preparado para</b>${client}${a.city ? ` · ${esc(a.city)}` : ''}</div><div><b>Preparado por</b>${esc(owner)} · KstaStudio_</div><div><b>Fecha</b>${date}</div></div>
</section>
${pages.join('\n')}
<script>document.fonts.ready.then(()=>{ if (location.hash === '#print') setTimeout(()=>print(), 300); });</script>
</body></html>`;
}

function luma(hex) {
  let h = hex.slice(1); if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

const CSS = `
@page { size: A4; margin: 0; }
:root { --ink: #16131f; --muted: #6b6580; --line: #e7e3ef; --purple: #7b2ff0; --purple-2: #b57bff; --soft: #f6f3fc; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Manrope', system-ui, sans-serif; color: var(--ink); background: #ece9f2; line-height: 1.5; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.bar { position: sticky; top: 0; z-index: 5; display: flex; justify-content: center; align-items: center; gap: 14px; padding: 10px; background: #0c0618; color: #fff; font-size: 13px; }
.bar button { font: 600 13px 'Manrope', sans-serif; padding: 8px 16px; border-radius: 99px; border: 0; background: var(--purple); color: #fff; cursor: pointer; }
.page { width: 210mm; height: 297mm; margin: 10mm auto; background: #fff; padding: 18mm 20mm 22mm; position: relative; page-break-after: always; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.08); }
.page:last-child { page-break-after: auto; }
@media print { body { background: #fff; } .bar { display: none; } .page { margin: 0; box-shadow: none; } }
h1, h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 500; letter-spacing: -.01em; line-height: 1.05; }
h2 { font-size: 28pt; margin-bottom: 8pt; }
h3 { font-size: 12pt; margin: 14pt 0 5pt; }
p { margin-bottom: 8pt; }
.muted { color: var(--muted); }
.eyebrow { font-size: 8pt; letter-spacing: .16em; text-transform: uppercase; color: var(--purple); font-weight: 700; margin-bottom: 8pt; }
.foot { position: absolute; left: 20mm; right: 20mm; bottom: 12mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: var(--muted); border-top: 1px solid var(--line); padding-top: 6pt; }
.cover { background: radial-gradient(90% 60% at 100% 0%, #3b1a7a 0%, transparent 60%), radial-gradient(70% 50% at 0% 100%, #1f0e44 0%, transparent 60%), #0c0618; color: #fff; display: flex; flex-direction: column; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10pt; font-weight: 700; font-size: 15pt; letter-spacing: -.02em; }
.brand img { height: 22pt; }
.brand em { font-style: normal; color: var(--purple-2); }
.cover h1 { font-size: 50pt; }
.cover h1 span { color: #cbb5ff; }
.cover .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; font-size: 9pt; color: #cbbfe6; border-top: 1px solid rgba(255,255,255,.15); padding-top: 12pt; }
.cover .meta b { display: block; color: #fff; font-weight: 600; }
.score { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6pt; margin: 12pt 0 14pt; }
.score div { border: 1px solid var(--line); border-radius: 10pt; padding: 10pt 6pt; text-align: center; }
.score b { font-family: 'Cormorant Garamond', serif; font-size: 24pt; font-weight: 600; display: block; line-height: 1; }
.score small { font-size: 7.5pt; color: var(--muted); }
.bad b { color: #c2410c; } .mid b { color: #b45309; } .ok b { color: #15803d; }
img.shot { width: 100%; display: block; border-radius: 10pt; border: 1px solid var(--line); }
.shots { display: grid; grid-template-columns: 2.6fr 1fr; gap: 10pt; align-items: start; margin-top: 8pt; max-height: 105mm; overflow: hidden; }
.finding { border: 1px solid var(--line); border-radius: 12pt; padding: 8pt 12pt; margin-bottom: 6pt; break-inside: avoid; }
.finding h4 { font-size: 10.5pt; display: flex; gap: 8pt; align-items: baseline; margin-bottom: 3pt; }
.finding h4 i { font-style: normal; font-size: 7pt; font-weight: 700; letter-spacing: .08em; padding: 2pt 6pt; border-radius: 99pt; }
.alta { background: #fee2e2; color: #b91c1c; } .media { background: #fef3c7; color: #92400e; } .baja { background: #e0f2fe; color: #075985; }
.finding p { margin: 0; font-size: 9.5pt; color: var(--muted); }
.finding p b { color: var(--ink); }
.card { background: var(--soft); border-radius: 12pt; padding: 12pt 14pt; }
.card h4 { font-size: 10.5pt; margin-bottom: 4pt; }
.card ul { padding-left: 14pt; color: var(--muted); }
.palette { display: flex; gap: 8pt; margin: 6pt 0 12pt; }
.palette span { flex: 1; border-radius: 10pt; padding: 26pt 8pt 8pt; font-size: 7.5pt; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6pt 0 12pt; }
td, th { text-align: left; padding: 7pt 6pt; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 8pt; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.cta { margin-top: 14pt; padding: 16pt 18pt; border-radius: 14pt; background: linear-gradient(120deg, #0c0618, #3b1a7a); color: #fff; }
.sign { margin-top: 26pt; display: flex; gap: 12pt; align-items: center; }
.sign img { height: 26pt; }
`;
