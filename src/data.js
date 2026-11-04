const allServices = [
  {
    icon: 'search', title: 'Auditoría de tu página',
    items: ['Reviso tu página como lo haría un cliente nuevo', 'Te digo qué funciona y qué te está haciendo perder clientes', 'Notas claras en 5 temas: funcionamiento, confianza, personalidad, conexión y Google', 'Te entrego un documento en PDF con lo que haría para mejorarla', 'Sin compromiso: tú decides qué hacer con eso'],
  },
  {
    icon: 'brand', title: 'Logo e imagen de tu negocio',
    items: ['Te creo tu logo o te mejoro el que tienes', 'Escojo tus colores y letras', 'Una guía para que tu logo siempre se vea igual', 'Tarjetas de presentación', 'Empaques y etiquetas para tus productos', 'Diseños para tus redes sociales'],
  },
  {
    icon: 'code', title: 'Páginas web',
    items: ['Tu negocio en internet, visible desde el celular', 'Catálogo con tus productos y precios', 'Tienda para vender y cobrar por internet', 'Que tus clientes pidan citas o te escriban', 'Programas a la medida de tu negocio', 'Te la mantengo siempre funcionando'],
  },
  {
    icon: 'video', title: 'Fotos y videos',
    items: ['Fotos bonitas de tus productos', 'Fotos de ti, tu equipo y tu local', 'Videos tipo comercial', 'Videos cortos para redes', 'Un video que cuente tu historia', 'Grabo tus eventos'],
  },
  {
    icon: 'megaphone', title: 'Publicidad en redes',
    items: ['Te hago las publicaciones de Facebook e Instagram', 'Anuncios para que te vea gente nueva de tu zona', 'Anuncio tus promociones', 'Te ayudo a lanzar algo nuevo', 'Te digo qué publicar y cuándo'],
  },
  {
    icon: 'sign', title: 'Avisos e impresos',
    items: ['El aviso de la entrada de tu local', 'Afiches y volantes', 'Pendones para ferias o la entrada', 'Calcomanías para vitrinas y carros', 'Letreros dentro del local', 'Decoro tu local con tu marca'],
  },
];
// Páginas web primero (lo que ya ofrecemos); el resto sale como 'Próximamente'
export const services = [...allServices.filter((s) => ['code', 'brand', 'search'].includes(s.icon)), ...allServices.filter((s) => !['code', 'brand', 'search'].includes(s.icon))];

export const packages = [
  {
    name: 'Solo Página Web', pkg: 'Plan Solo Página Web', icon: 'code', tag: 'Solo web',
    desc: 'Ya tienes tu marca y solo necesitas tu página.',
    items: ['Landing, web corporativa, catálogo o tienda', 'Diseño a partir de plantilla o personalizado', 'Adaptada a celular', 'Botón de WhatsApp y formularios', 'Publicación en tu dominio'],
  },
  {
    name: 'Emprendimiento', icon: 'rocket', tag: 'Para empezar',
    desc: 'Para quien está arrancando su negocio.',
    items: ['Logo e identidad visual básica', 'Tarjetas de presentación', 'Piezas para redes sociales', 'Landing page'],
  },
  {
    name: 'Presencia Digital', icon: 'globe', tag: 'Más popular', featured: true,
    desc: 'Para negocios que quieren destacar en internet.',
    items: ['Rediseño o adaptación de marca', 'Página web', 'Fotografía comercial', 'Videos publicitarios', 'Piezas para campañas digitales'],
  },
  {
    name: 'Negocio Integral', icon: 'building', tag: 'Todo incluido',
    desc: 'Una imagen completa, digital y física.',
    items: ['Identidad visual corporativa', 'Página web funcional', 'Fotos y videos', 'Publicidad digital', 'Letreros y publicidad física', 'Material promocional'],
  },
];
