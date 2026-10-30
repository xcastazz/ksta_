// =========================================================
//  LISTA DE PRECIOS KstaStudio_ (COP, sin IVA)
//  Edita aquí los valores: todo el sitio y los PDF se recalculan solos.
// =========================================================
export const PRICES = {
  branding: {
    logo: { 'No tengo logo': 150000, 'Tengo, quiero rediseñarlo': 120000, 'Tengo, solo necesito la identidad': 80000 },
    piezas: {
      'Logo': 0, // incluido en el punto anterior
      'Manual de marca': 130000,
      'Tarjetas y papelería': 50000,
      'Empaques / etiquetas': 110000,
      'Piezas para redes': 60000,
      'Mockups': 40000,
    },
  },
  web: {
    tipo: {
      'Landing page': 320000,
      'Web corporativa': 600000,
      'Portafolio': 390000,
      'Catálogo': 490000,
      'Tienda virtual': 910000,
      'Sistema / software a medida': 1540000,
    },
    funciones: {
      'Formulario de contacto': 0,
      'Botón de WhatsApp': 0,
      'Reservas / citas': 180000,
      'Pagos en línea': 210000,
      'Blog': 80000,
      'Panel administrativo': 280000,
    },
    dominio: { 'Sí, ya tengo': 0, 'No, necesito uno': 50000, 'No sé qué es': 50000 },
    disenoPersonalizado: 180000, // si elige "Diseño 100% personalizado" en vez de plantilla
  },
  audiovisual: {
    contenido: {
      'Fotografía de producto': 140000,
      'Fotografía corporativa': 160000,
      'Video publicitario': 390000,
      'Reels para redes': 180000,
      'Video institucional': 460000,
      'Cobertura de evento': 280000,
    },
  },
  marketing: {
    acciones: {
      'Contenido para redes': 240000,
      'Campañas en Meta Ads': 210000,
      'Lanzamiento de marca/producto': 350000,
      'Promociones y ventas': 110000,
      'Estrategia completa': 460000,
    },
    mensual: ['Contenido para redes', 'Campañas en Meta Ads', 'Estrategia completa'],
  },
  print: {
    impresos: {
      'Letrero / aviso': 220000,
      'Afiches': 40000,
      'Pendones / banners': 80000,
      'Vinilos y adhesivos': 80000,
      'Señalización': 110000,
      'Tarjetas y material promocional': 60000,
      'Branding del local': 600000,
    },
  },
  // Descuento por paquete (sobre los servicios de pago único)
  descuentos: { 'cats-1': 0, 'cats-2': 0.05, 'cats-3': 0.08, 'solo-web': 0, emprendimiento: 0.10, presencia: 0.12, integral: 0.15, custom: 0 },
  urgencia: { 'Lo antes posible': 0.10 }, // recargo
  mantenimiento: 0.17, // mensualidad de mantenimiento = 17% del valor total
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
  const maintenanceRate = q.maintenanceRate ?? PRICES.mantenimiento;
  const maintenance = Math.round((total * maintenanceRate) / 1000) * 1000;
  return { ...q, subtotal: once, discountRate, discount, rushRate, rush, total, maintenanceRate, maintenance, services: monthly, monthly: monthly + maintenance, deposit: Math.round(total * PRICES.anticipo) };
}
