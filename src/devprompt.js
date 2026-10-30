// =========================================================
//  PROMPT DE DESARROLLO POR CLIENTE
//  Genera un brief listo para pegar en Claude Code y empezar el proyecto
//  con el stack de KstaStudio_: Vite + Supabase + Cloudflare (Wrangler).
// =========================================================
import { cop } from './pricing.js';

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const bullets = (arr) => arr.filter(Boolean).map((x) => `- ${x}`).join('\n');
const slug = (s) => String(s || 'cliente').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente';

// Supabase tables we suggest depending on the site's functions
function dataModel(web) {
  const f = list(web.funciones);
  const t = ['`contact_messages` (formulario de contacto: nombre, email, teléfono, mensaje, created_at) — RLS: el público solo inserta.'];
  if (web.tipo === 'Tienda virtual' || web.tipo === 'Catálogo' || f.includes('Panel administrativo')) t.push('`products` (nombre, slug, descripción, precio, imágenes, categoría, stock, activo) y `categories` — RLS: lectura pública, escritura solo admin.');
  if (web.tipo === 'Tienda virtual' || f.includes('Pagos en línea')) t.push('`orders` y `order_items` (cliente, total, estado del pago, referencia de la pasarela) — RLS: inserción pública vía función/endpoint, lectura solo admin.');
  if (f.includes('Reservas / citas')) t.push('`bookings` (servicio, fecha/hora, nombre, teléfono, estado) con índice único por franja para evitar dobles reservas + función `booked_slots()` security definer.');
  if (f.includes('Blog')) t.push('`posts` (título, slug, extracto, contenido, portada, publicado_en, publicado) — lectura pública solo de publicados.');
  if (f.includes('Panel administrativo')) t.push('`admins` (email) + función `is_admin()` para las políticas; login por enlace mágico (Supabase Auth OTP).');
  if (web.tipo === 'Portafolio') t.push('`projects` (título, cliente, descripción, imágenes, enlace, orden).');
  if (web.tipo === 'Sistema / software a medida') t.push('Definir el modelo con el cliente en la reunión inicial; documentarlo en `supabase/schema.sql` antes de programar.');
  return t;
}

export function buildDevPrompt(lead) {
  const d = lead.details || {};
  const det = d.details || {};
  const b = d.business || {};
  const q = lead.quote || {};
  const services = d.services || [];
  const web = det.web || {};
  const brand = det.branding || {};
  const av = det.audiovisual || {};
  const mk = det.marketing || {};
  const pr = det.print || {};
  const name = b.name || lead.business || lead.name;
  const project = slug(name);
  const tpl = d.template && d.template !== 'custom' ? d.template : null;

  const sections = [];

  sections.push(`# Proyecto: ${name} — desarrollado por KstaStudio_

Eres mi copiloto de desarrollo. Soy Jerónimo Castañeda Velásquez (KstaStudio_), desarrollador full stack. Vamos a construir el proyecto de este cliente desde cero. Lee todo este brief antes de escribir código, hazme las preguntas que bloqueen decisiones importantes y luego trabaja por fases.

## 1. Cliente
${bullets([
  `Contacto: ${lead.name} · WhatsApp ${lead.phone || '—'} · ${lead.email || '—'}`,
  `Negocio: ${name}${b.sector ? ` — ${b.sector}` : ''}${b.city ? ` (${b.city})` : ''}`,
  b.audience && `Cliente ideal: ${b.audience}`,
  b.link && `Presencia actual: ${b.link}`,
  `Plan contratado: ${lead.service || '—'}`,
  q.total && `Inversión: ${cop(q.total)}${q.monthly ? ` + ${cop(q.monthly)}/mes` : ''}`,
  d.timing && `Tiempo esperado: ${d.timing}`,
  d.notes && `Notas del cliente: ${d.notes}`,
  lead.notes && `Notas internas: ${lead.notes}`,
])}

## 2. Identidad y estilo
${bullets([
  list(d.style).length && `Estilo deseado: ${list(d.style).join(', ')}`,
  b.refs && `Colores / referencias: ${b.refs}`,
  services.includes('branding') ? `Branding incluido en el proyecto (${brand.logo || 'por definir'}). Piezas: ${list(brand.piezas).join(', ') || '—'}. Mientras el logo final no esté aprobado, usa un logotipo tipográfico temporal y centraliza colores/tipos en variables CSS para cambiarlos en un solo lugar.` : 'El cliente ya tiene marca: pídeme el logo (SVG/PNG) y sus colores antes de definir el diseño final.',
  tpl ? `Plantilla de referencia elegida: "${lead.template}" (HTML5 UP, licencia CC BY 3.0). Úsala como referencia de estructura y estilo, reescrita a nuestro stack; conserva el crédito de HTML5 UP en el pie si se reutiliza su diseño.` : d.template === 'custom' ? 'Diseño 100% personalizado (sin plantilla base).' : null,
  'Tipografía por defecto: Geist / Geist Mono (Google Fonts) salvo que la marca defina otra.',
  'Diseño moderno, limpio y con animaciones sutiles; versión ligera en celular (sin animaciones pesadas ni 3D, respetar prefers-reduced-motion).',
])}
`);

  if (services.includes('web')) {
    sections.push(`## 3. Alcance web
${bullets([
  `Tipo de sitio: ${web.tipo || 'por definir'}`,
  `Funciones: ${list(web.funciones).join(', ') || 'por definir'}`,
  `Dominio: ${web.dominio || 'por definir'}`,
  'Responsive (celular primero), accesible (contraste AA, textos alternativos, navegación con teclado).',
  'SEO on-page: title/description por página, Open Graph, sitemap.xml, robots.txt, datos estructurados (LocalBusiness) y URLs limpias.',
  'Rendimiento: Lighthouse ≥ 90 en celular; imágenes optimizadas (WebP/AVIF, lazy loading), sin dependencias innecesarias.',
  'Botón flotante de WhatsApp del cliente y enlaces a sus redes.',
  'Formularios con validación en el navegador, honeypot anti-spam y mensajes de éxito/error claros.',
])}
`);
  }

  const other = [
    services.includes('audiovisual') && `Fotografía y video: ${list(av.contenido).join(', ')} (${av.frecuencia || '—'}). Deja espacios preparados para ese material (hero con video, galerías) y usa placeholders mientras llega.`,
    services.includes('marketing') && `Marketing: ${list(mk.acciones).join(', ')}. Instala Meta Pixel y Google Analytics 4 SOLO con consentimiento de cookies; deja eventos de conversión (clic en WhatsApp, envío de formulario, compra).`,
    services.includes('print') && `Impresos: ${list(pr.impresos).join(', ')}. No es parte del código, pero mantén la coherencia visual con la web.`,
  ].filter(Boolean);
  if (other.length) sections.push(`## 4. Otros servicios contratados (impactan la web)\n${bullets(other)}\n`);

  sections.push(`## 5. Stack obligatorio (siempre el mismo en KstaStudio_)
${bullets([
  '**Frontend:** Vite (vanilla JS + CSS moderno) o Vite + React solo si la interactividad lo justifica. Multi-página con `build.rollupOptions.input` si hay varias páginas.',
  '**Base de datos y auth:** Supabase (Postgres + RLS en TODAS las tablas + Auth con enlace mágico para el panel admin + Realtime si hay notificaciones).',
  '**Hosting y deploy:** Cloudflare Workers con assets estáticos, usando Wrangler. `wrangler.toml` con `[assets] directory = "./dist"` y `not_found_handling = "single-page-application"`. Script `"deploy": "vite build && wrangler deploy"`.',
  '**Lógica de servidor (si se necesita):** un Worker de Cloudflare (webhooks de pagos, envío de correos, secretos). Nunca exponer la service_role key de Supabase en el navegador; secretos con `wrangler secret put`.',
  '**Variables:** `.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (excluido de git) + `.env.example` versionado.',
  '**Repositorio:** GitHub, commits pequeños y descriptivos en español.',
])}

### Configuración inicial
\`\`\`bash
npm create vite@latest ${project} -- --template vanilla
cd ${project}
npm i @supabase/supabase-js
npm i -D wrangler
npx wrangler login
# Supabase: crear proyecto "${project}", ejecutar supabase/schema.sql y copiar URL + anon key al .env
npm run deploy
\`\`\`
`);

  if (services.includes('web')) {
    sections.push(`## 6. Modelo de datos sugerido (Supabase)
${bullets(dataModel(web))}
- Todo el SQL en \`supabase/schema.sql\`, idempotente (\`if not exists\`, \`drop policy if exists\`).
- Restricciones de longitud en textos y políticas RLS mínimas necesarias (principio de menor privilegio).
`);
  }

  sections.push(`## 7. Requisitos legales (Colombia)
${bullets([
  'Página de **Política de tratamiento de datos personales** (Ley 1581 de 2012 y Decreto 1377 de 2013) con el cliente como responsable: finalidades, derechos del titular (conocer, actualizar, rectificar, suprimir, revocar), canal de contacto y plazos (10 días hábiles consultas, 15 reclamos).',
  'Casilla de autorización de tratamiento de datos en cada formulario, con enlace a la política.',
  'Aviso de cookies si se usa analítica o píxeles (cargarlos solo tras aceptar).',
  (web.tipo === 'Tienda virtual' || list(web.funciones).includes('Pagos en línea')) && 'Tienda: Términos y condiciones, políticas de envío, cambios y devoluciones, garantía y **derecho de retracto** (Ley 1480 de 2011, art. 47) visibles antes de pagar; precios con IVA indicado.',
  'Pie de página con razón social / nombre del negocio, contacto y enlaces legales.',
  'Créditos de recursos de terceros que lo requieran (p. ej. HTML5 UP CC BY 3.0).',
])}

## 8. Plan de trabajo
1. **Arranque:** crear repo, Vite, Supabase y Wrangler; deploy de un "hola mundo" en Cloudflare para validar el pipeline.
2. **Estructura:** mapa del sitio, componentes base, variables de diseño (colores, tipografías, espaciados) y layout responsive.
3. **Contenido:** secciones con textos reales del negocio (pídeme los que falten; no inventes datos de contacto, precios ni testimonios).
4. **Funciones:** formularios y tablas en Supabase con RLS${list(web.funciones).length ? `, luego: ${list(web.funciones).join(', ')}` : ''}.
5. **Legal y SEO:** páginas legales, metadatos, sitemap y analítica con consentimiento.
6. **QA:** probar en celular (iPhone/Safari y Android), formularios de punta a punta contra Supabase, Lighthouse y accesibilidad.
7. **Entrega:** conectar dominio en Cloudflare, SSL, guía corta de uso para el cliente y checklist de mantenimiento mensual.

## 9. Reglas para ti
${bullets([
  'Antes de cada fase, dime qué vas a hacer en 3–5 líneas; al terminar, qué quedó hecho y cómo lo verificaste.',
  'No inventes información del cliente: si falta, déjalo marcado como TODO y pregúntame.',
  'Código claro y comentado en español donde aporte; sin dependencias pesadas sin justificar.',
  'Nunca subas `.env`, contraseñas ni claves a git.',
  'Si algo del stack no encaja con lo pedido, propón la alternativa y espera mi confirmación.',
])}

Empieza confirmándome que entendiste el proyecto en un resumen corto y con las preguntas pendientes para el cliente.`);

  return sections.join('\n');
}

export const devPromptFilename = (lead) => `prompt-${slug(lead.details?.business?.name || lead.business || lead.name)}.md`;
