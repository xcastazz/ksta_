import { buildQuote } from './pricing.js';

// =========================================================
//  PLANES POR CATEGORÍA
//  Cada nivel (tier) define qué servicios incluye y deja respuestas pre-llenadas
//  en el cotizador. El precio "desde" se calcula solo con la lista de precios.
// =========================================================
export const CATS = {
  web: {
    label: 'Desarrollo web', icon: 'code',
    desc: 'Páginas, tiendas y sistemas que venden por ti las 24 horas.',
    services: ['web'],
    tiers: [
      { id: 'web-basica', name: 'Web Básica', tag: 'Para empezar', services: ['web'],
        items: ['Landing page de una sección', 'Botón de WhatsApp', 'Formulario de contacto', 'Adaptada a celular', 'Basada en plantilla profesional'],
        details: { web: { tipo: 'Landing page', funciones: ['Botón de WhatsApp', 'Formulario de contacto'], dominio: 'Sí, ya tengo' } } },
      { id: 'web-pro', name: 'Web Pro', tag: 'Más popular', featured: true, services: ['web'],
        items: ['Web corporativa de varias páginas', 'Blog para publicar novedades', 'WhatsApp y formularios', 'Dominio incluido (1 año)', 'Adaptada a celular'],
        details: { web: { tipo: 'Web corporativa', funciones: ['Botón de WhatsApp', 'Formulario de contacto', 'Blog'], dominio: 'No, necesito uno' } } },
      { id: 'web-tienda', name: 'Tienda Online', tag: 'Vende 24/7', services: ['web'],
        items: ['Tienda virtual con carrito', 'Pagos en línea', 'Panel para editar productos', 'Dominio incluido (1 año)', 'Botón de WhatsApp'],
        details: { web: { tipo: 'Tienda virtual', funciones: ['Pagos en línea', 'Panel administrativo', 'Botón de WhatsApp'], dominio: 'No, necesito uno' } } },
    ],
  },
  diseno: {
    label: 'Diseño y marca', icon: 'brand',
    desc: 'Logo e identidad para que tu marca se vea profesional en todo lado.',
    services: ['branding'],
    tiers: [
      { id: 'marca-inicial', name: 'Marca Inicial', tag: 'Lo esencial', services: ['branding'],
        items: ['Logo desde cero', 'Paleta de colores y tipografías', 'Tarjetas de presentación'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Tarjetas y papelería'] } } },
      { id: 'marca-pro', name: 'Marca Pro', tag: 'Más popular', featured: true, services: ['branding'],
        items: ['Logo desde cero', 'Manual de marca', 'Tarjetas y papelería', 'Plantillas para redes sociales'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Manual de marca', 'Tarjetas y papelería', 'Piezas para redes'] } } },
      { id: 'marca-completa', name: 'Marca Completa', tag: 'Todo incluido', services: ['branding'],
        items: ['Todo lo de Marca Pro', 'Diseño de empaques / etiquetas', 'Mockups realistas de tu marca'],
        details: { branding: { logo: 'No tengo logo', piezas: ['Logo', 'Manual de marca', 'Tarjetas y papelería', 'Piezas para redes', 'Empaques / etiquetas', 'Mockups'] } } },
    ],
  },
  publicidad: {
    label: 'Publicidad y contenido', icon: 'megaphone',
    desc: 'Fotos, videos, redes y anuncios para que más gente te compre.',
    services: ['marketing', 'audiovisual', 'print'],
    tiers: [
      { id: 'redes-basico', name: 'Redes Básico', tag: 'Mensual', services: ['marketing'],
        items: ['Diseño de contenido para redes', 'Posts e historias cada mes', 'Calendario de publicaciones'],
        details: { marketing: { acciones: ['Contenido para redes'], pauta: 'Aún no sé' } } },
      { id: 'redes-pro', name: 'Redes Pro', tag: 'Más popular', featured: true, services: ['marketing', 'audiovisual'],
        items: ['Contenido para redes', 'Gestión de anuncios en Meta Ads', 'Reels para redes cada mes'],
        details: { marketing: { acciones: ['Contenido para redes', 'Campañas en Meta Ads'], pauta: 'Bajo' }, audiovisual: { contenido: ['Reels para redes'], frecuencia: 'Mensual' } } },
      { id: 'lanzamiento-360', name: 'Lanzamiento 360', tag: 'Digital + físico', services: ['marketing', 'audiovisual', 'print'],
        items: ['Estrategia de lanzamiento', 'Video publicitario y fotos', 'Campañas en Meta Ads', 'Pendones y afiches impresos'],
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
