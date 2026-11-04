// Cloudflare Worker: serves the static site and one private API route for the admin panel.
// POST /api/interpretar  → turns a free-text client description into the quote wizard's answers.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/interpretar') return interpretar(request, env);
    return env.ASSETS.fetch(request);
  },
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

// Only signed-in admins (same Supabase session the panel uses) may call the API.
async function isAdmin(token, env) {
  if (!token) return false;
  const headers = { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/is_admin`, { method: 'POST', headers, body: '{}' });
  return r.ok && (await r.json()) === true;
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['contact', 'business', 'services', 'answers', 'template', 'style', 'timing', 'budget', 'notes', 'summary', 'missing'],
  properties: {
    contact: {
      type: 'object', additionalProperties: false, required: ['name', 'phone', 'email'],
      properties: { name: { type: 'string' }, phone: { type: 'string' }, email: { type: 'string' } },
    },
    business: {
      type: 'object', additionalProperties: false, required: ['name', 'sector', 'city', 'link', 'audience', 'refs'],
      properties: { name: { type: 'string' }, sector: { type: 'string' }, city: { type: 'string' }, link: { type: 'string' }, audience: { type: 'string' }, refs: { type: 'string' } },
    },
    services: { type: 'array', items: { type: 'string' } },
    answers: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['service', 'key', 'values'],
        properties: { service: { type: 'string' }, key: { type: 'string' }, values: { type: 'array', items: { type: 'string' } } },
      },
    },
    template: { type: 'string' },
    style: { type: 'array', items: { type: 'string' } },
    timing: { type: 'string' },
    budget: { type: 'string' },
    notes: { type: 'string' },
    summary: { type: 'string' },
    missing: { type: 'array', items: { type: 'string' } },
  },
};

const SYSTEM = `Eres el asistente de KstaStudio_, un estudio en Medellín que hace páginas web y logos.
Jerónimo te pega, tal cual, lo que un cliente le contó (por WhatsApp, en una llamada o en persona). Tu trabajo es llenar el formulario de cotización con esa información.

Reglas:
- Usa SOLO las opciones del catálogo que viene en el mensaje, copiando el texto de la opción exactamente igual. Si nada encaja, no inventes una opción.
- "services" solo puede tener ids del catálogo. Incluye un servicio solo si el cliente lo pidió o es claramente necesario para lo que pidió.
- En "answers" pon una entrada por cada pregunta de los servicios escogidos. En las preguntas de una sola respuesta, "values" lleva una sola opción. Si el texto no dice nada, escoge la opción más razonable para ese negocio y anótalo en "missing".
- "template": un id de plantilla del catálogo, "custom" si pidió un diseño único, o "" si no aplica.
- "timing", "budget" y cada elemento de "style": opciones exactas del catálogo, o "" / [] si no hay pistas.
- Contacto y negocio: copia lo que diga el texto. Lo que no esté, déjalo como "".
- "summary": 2 o 3 frases en español sencillo con lo que el cliente quiere, para que Jerónimo lo revise.
- "missing": lista corta de datos que faltan o que supusiste, para que Jerónimo los confirme con el cliente.
- "notes": cualquier detalle útil del texto que no cupo en otra parte.`;

// Gratis: Workers AI de Cloudflare (cupo diario sin costo). Si falla o se acaba el cupo, el panel usa su lector local.
const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

async function interpretar(request, env) {
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!(await isAdmin(token, env))) return json({ error: 'No autorizado' }, 401);
  if (!env.AI) return json({ error: 'Workers AI no está activado', fallback: true }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const text = String(body.text || '').trim().slice(0, 12000);
  if (text.length < 10) return json({ error: 'Escribe un poco más sobre lo que quiere el cliente' }, 400);

  try {
    const out = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM + '\nResponde únicamente con el JSON pedido.' },
        { role: 'user', content: `<catalogo>\n${JSON.stringify(body.catalog || {})}\n</catalogo>\n\n<lo_que_dijo_el_cliente>\n${text}\n</lo_que_dijo_el_cliente>` },
      ],
      response_format: { type: 'json_schema', json_schema: SCHEMA },
      max_tokens: 2048,
      temperature: 0.1,
    });
    let result = out?.response ?? out;
    if (typeof result === 'string') result = JSON.parse(result.slice(result.indexOf('{'), result.lastIndexOf('}') + 1));
    if (!result || typeof result !== 'object') throw new Error('respuesta vacía');
    return json({ result, engine: 'workers-ai' });
  } catch (err) {
    console.error('interpretar', err);
    return json({ error: 'La IA gratuita no pudo responder ahora (quizás se acabó el cupo del día).', fallback: true }, 503);
  }
}