// =========================================================
//  LISTA DE PRECIOS Ksta_ (COP, sin IVA)
//  Edita aquí los valores: todo el sitio y los PDF se recalculan solos.
// =========================================================
export const PRICES = {
  branding: {
    logo: { 'No tengo logo': 450000, 'Tengo, quiero rediseñarlo': 350000, 'Tengo, solo necesito la identidad': 250000 },
    piezas: {
      'Logo': 0, // incluido en el punto anterior
      'Manual de marca': 400000,
      'Tarjetas y papelería': 150000,
      'Empaques / etiquetas': 350000,
      'Piezas para redes': 200000,
      'Mockups': 120000,
    },
  },
  web: {
    tipo: {
      'Landing page': 900000,
      'Web corporativa': 1800000,
      'Portafolio': 1200000,
      'Catálogo': 1500000,
      'Tienda virtual': 2800000,
      'Sistema / software a medida': 4500000,
    },
    funciones: {
      'Formulario de contacto': 0,
      'Botón de WhatsApp': 0,
      'Reservas / citas': 600000,
      'Pagos en línea': 700000,
      'Blog': 300000,
      'Panel administrativo': 900000,
    },
    dominio: { 'Sí, ya tengo': 0, 'No, necesito uno': 90000, 'No sé qué es': 90000 },
    disenoPersonalizado: 600000, // si elige "Diseño 100% personalizado" en vez de plantilla
  },
  audiovisual: {
    contenido: {
      'Fotografía de producto': 450000,
      'Fotografía corporativa': 500000,
      'Video publicitario': 1200000,
      'Reels para redes': 600000,
      'Video institucional': 1500000,
      'Cobertura de evento': 900000,
    },
  },
  marketing: {
    acciones: {
      'Contenido para redes': 800000,
      'Campañas en Meta Ads': 700000,
      'Lanzamiento de marca/producto': 1200000,
      'Promociones y ventas': 400000,
      'Estrategia completa': 1500000,
    },
    mensual: ['Contenido para redes', 'Campañas en Meta Ads', 'Estrategia completa'],
  },
  print: {
    impresos: {
      'Letrero / aviso': 650000,
      'Afiches': 150000,
      'Pendones / banners': 220000,
      'Vinilos y adhesivos': 250000,
      'Señalización': 350000,
      'Tarjetas y material promocional': 180000,
      'Branding del local': 1800000,
    },
  },
  // Descuento por paquete (sobre los servicios de pago único)
  descuentos: { 'solo-web': 0, emprendimiento: 0.10, presencia: 0.12, integral: 0.15, custom: 0 },
  urgencia: { 'Lo antes posible': 0.15 }, // recargo
  anticipo: 0.5,
  vigenciaDias: 15,
};

const SVC_NAMES = { branding: 'Branding e identidad', web: 'Web y software', audiovisual: 'Fotografía y video', marketing: 'Marketing digital', print: 'Publicidad física' };

export const cop = (n) => '$' + Math.round(n).toLocaleString('es-CO');

/**
 * Builds a quote from the wizard answers.
 * @param {{plan:string, services:string[], details:Object, template:string|null, timing:string}} a
 * @returns {{items:Array, subtotal:number, discount:number, rush:number, total:number, monthly:number, ...}}
 */
export function buildQuote(a) {
  const items = [];
  const add = (group, concept, price, monthly = false) => { if (price > 0) items.push({ group, concept, price, monthly }); };
  const d = a.details || {};
  const pick = (table, v) => (Array.isArray(v) ? v : [v]).filter(Boolean).map((x) => [x, table[x] ?? 0]);

  for (const s of a.services || []) {
    const ans = d[s] || {};
    const g = SVC_NAMES[s];
    if (s === 'branding') {
      pick(PRICES.branding.logo, ans.logo).forEach(([k, p]) => add(g, k === 'No tengo logo' ? 'Creación de logo e identidad básica' : k === 'Tengo, quiero rediseñarlo' ? 'Rediseño de logo' : 'Identidad visual sobre logo existente', p));
      pick(PRICES.branding.piezas, ans.piezas).forEach(([k, p]) => add(g, k, p));
    }
    if (s === 'web') {
      pick(PRICES.web.tipo, ans.tipo).forEach(([k, p]) => add(g, `Desarrollo: ${k}`, p));
      pick(PRICES.web.funciones, ans.funciones).forEach(([k, p]) => add(g, `Función: ${k}`, p));
      pick(PRICES.web.dominio, ans.dominio).forEach(([, p]) => add(g, 'Registro de dominio (1 año)', p));
      if (a.template === 'custom') add(g, 'Diseño 100% personalizado', PRICES.web.disenoPersonalizado);
    }
    if (s === 'audiovisual') {
      const monthly = ans.frecuencia === 'Mensual';
      pick(PRICES.audiovisual.contenido, ans.contenido).forEach(([k, p]) => add(g, k, p, monthly));
    }
    if (s === 'marketing') {
      pick(PRICES.marketing.acciones, ans.acciones).forEach(([k, p]) => add(g, k, p, PRICES.marketing.mensual.includes(k)));
    }
    if (s === 'print') {
      pick(PRICES.print.impresos, ans.impresos).forEach(([k, p]) => add(g, `${k} (diseño + producción)`, p));
    }
  }
  return totals({ items, plan: a.plan, timing: a.timing });
}

/** Recomputes totals (used after manual edits in the admin panel). */
export function totals(q) {
  const once = q.items.filter((i) => !i.monthly).reduce((s, i) => s + Number(i.price || 0), 0);
  const monthly = q.items.filter((i) => i.monthly).reduce((s, i) => s + Number(i.price || 0), 0);
  const discountRate = q.discountRate ?? PRICES.descuentos[q.plan] ?? 0;
  const rushRate = q.rushRate ?? PRICES.urgencia[q.timing] ?? 0;
  const discount = Math.round(once * discountRate);
  const rush = Math.round((once - discount) * rushRate);
  const total = once - discount + rush;
  return { ...q, subtotal: once, discountRate, discount, rushRate, rush, total, monthly, deposit: Math.round(total * PRICES.anticipo) };
}
