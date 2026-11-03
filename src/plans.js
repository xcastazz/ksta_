import { buildQuote } from './pricing.js';

// =========================================================
//  PLANES POR CATEGORÍA
//  Cada nivel (tier) define qué servicios incluye y deja respuestas pre-llenadas
//  en el cotizador. El precio "desde" se calcula solo con la lista de precios.
// =========================================================
export const CATS = {
  web: {
    label: 'Página web', icon: 'code',
    desc: 'Tu negocio abierto en internet las 24 horas, para que te encuentren desde el celular.',
    services: ['web'],
    tiers: [
      { id: 'web-basica', name: 'Página sencilla', tag: 'Para empezar', services: ['web'],
        items: ['Una página con lo más importante de tu negocio', 'Botón para que te escriban por WhatsApp', 'Un espacio para que te dejen sus datos', 'Se ve bien en el celular', 'Diseño bonito y profesional'],
        details: { web: { tipo: 'Landing page', funciones: ['Botón de WhatsApp', 'Formulario de contacto'], dominio: 'Sí, ya tengo' } } },
      { id: 'web-pro', name: 'Página completa', tag: 'La más pedida', featured: true, services: ['web'],
        items: ['Varias secciones: inicio, quiénes somos, servicios y contacto', 'Un espacio para publicar noticias y novedades', 'WhatsApp y formulario de contacto', 'Tu propia dirección en internet (tunegocio.com) por 1 año', 'Se ve bien en el celular'],
        details: { web: { tipo: 'Web corporativa', funciones: ['Botón de WhatsApp', 'Formulario de contacto', 'Blog'], dominio: 'No, necesito uno' } } },
      { id: 'web-tienda', name: 'Tienda en internet', tag: 'Vende de día y de noche', services: ['web'],
        items: ['Tus productos con fotos y precios', 'Tus clientes pagan con tarjeta o PSE', 'Tú mismo cambias productos y precios fácilmente', 'Tu propia dirección en internet por 1 año', 'Botón de WhatsApp'],
        details: { web: { tipo: 'Tienda virtual', funciones: ['Pagos en línea', 'Panel administrativo', 'Botón de WhatsApp'], dominio: 'No, necesito uno' } } },
    ],
  },
  diseno: {
    label: 'Logo e imagen', icon: 'brand',
    desc: 'Tu logo y tus colores, para que la gente reconozca tu negocio en todas partes.',
    services: ['branding'],
    tiers: [
      { id: 'marca-inicial', name: 'Logo básico', tag: 'Lo esencial', services: ['branding'],
        items: ['Te creamos tu logo', 'Escogemos los colores y letras de tu negocio', 'Tarjetas de presentación'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Tarjetas y papelería'] } } },
      { id: 'marca-pro', name: 'Imagen completa', tag: 'La más pedida', featured: true, services: ['branding'],
        items: ['Te creamos tu logo', 'Una guía para usar tu logo siempre igual', 'Tarjetas y hojas con tu logo', 'Diseños listos para tus redes sociales'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Manual de marca', 'Tarjetas y papelería', 'Piezas para redes'] } } },
      { id: 'marca-completa', name: 'Imagen + empaques', tag: 'Todo incluido', services: ['branding'],
        items: ['Todo lo de Imagen completa', 'Diseño de tus empaques y etiquetas', 'Fotos de muestra de cómo se ve tu marca en productos reales'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Manual de marca', 'Tarjetas y papelería', 'Piezas para redes', 'Empaques / etiquetas', 'Mockups'] } } },
    ],
  },
  publicidad: {
    label: 'Publicidad y redes', icon: 'megaphone',
    desc: 'Fotos, videos y publicaciones en Facebook e Instagram para que más gente te conozca y te compre.',
    services: ['marketing', 'audiovisual', 'print'],
    tiers: [
      { id: 'redes-basico', name: 'Redes al día', tag: 'Cada mes', services: ['marketing'],
        items: ['Publicaciones bonitas para tu Facebook e Instagram', 'Te las hacemos cada mes', 'Te decimos qué publicar y cuándo'],
        details: { marketing: { acciones: ['Contenido para redes'], pauta: 'Aún no sé' } } },
      { id: 'redes-pro', name: 'Redes que venden', tag: 'La más pedida', featured: true, services: ['marketing', 'audiovisual'],
        items: ['Publicaciones para tus redes cada mes', 'Anuncios pagados en Facebook e Instagram para llegar a más gente', 'Videos cortos para tus redes cada mes'],
        details: { marketing: { acciones: ['Contenido para redes', 'Campañas en Meta Ads'], pauta: 'Bajo' }, audiovisual: { contenido: ['Reels para redes'], frecuencia: 'Mensual' } } },
      { id: 'lanzamiento-360', name: 'Gran lanzamiento', tag: 'Internet + calle', services: ['marketing', 'audiovisual', 'print'],
        items: ['Un plan para darte a conocer con fuerza', 'Un video comercial y fotos de tus productos', 'Anuncios en Facebook e Instagram', 'Pendones y afiches impresos para tu local'],
        details: { marketing: { acciones: ['Lanzamiento de marca/producto', 'Campañas en Meta Ads'], pauta: 'Medio' }, audiovisual: { contenido: ['Video publicitario', 'Fotografía de producto'], frecuencia: 'Una sola vez' }, print: { impresos: ['Pendones / banners', 'Afiches'] } } },
    ],
  },
};

export const CAT_ORDER = ['web', 'diseno', 'publicidad'];
export const COMBO = { 1: 0, 2: 0.15, 3: 0.25 }; // recargo de gestión integral // descuento por cantidad de categorías

export const findTier = (id) => {
  for (const [cat, c] of Object.entries(CATS)) {
    const t = c.tiers.find((x) => x.id === id);
    if (t) return { cat, tier: t };
  }
  return null;
};

/** "$450.000" or "$350.000 /mes" (+ monthly extra when both) — HTML */
export const priceHTML = (p, cop) => (p.total ? cop(p.total) + (p.monthly ? ` <small>+ ${cop(p.monthly)}/mes</small>` : '') : `${cop(p.monthly)}<small class="per">/mes</small>`);
export const fromValue = (p) => p.total || p.monthly;

/** Price for a single tier (no combo discount), used for "desde $X" labels. */
export const tierPrice = (t) => buildQuote({ plan: 'cats-1', services: t.services, details: t.details, template: null, timing: '' });
