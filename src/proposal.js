import { jsPDF } from 'jspdf';
import { cop, PRICES } from './pricing.js';
import { quoteNumber, drawLogo } from './pdf.js';

// =========================================================
//  PROPUESTA Y PLAN DE TRABAJO (PDF automático por cliente)
//  Texto base de referencia. Recomendado: revisarlo con un abogado
//  antes de usarlo como contrato definitivo.
// =========================================================
const BRAND = 'KstaStudio_';
const OWNER = 'Jerónimo Castañeda Velásquez';
const CONTACT_EMAIL = 'cotizaciones@kstastudio.com';
const SITE = 'kstastudio.com';

const PURPLE = [124, 58, 237], DARK = [12, 6, 24], INK = [30, 22, 48], MUTED = [105, 96, 130], LINE = [230, 225, 240], SOFT = [246, 242, 255];

// ---------- Scope per service (what we do, what we deliver, what we need) ----------
function scopeFor(svc, ans = {}, lead) {
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  switch (svc) {
    case 'web': return {
      title: 'Tu página web',
      what: [
        `Diseño y desarrollo de: ${ans.tipo || 'sitio web'}${lead.template ? `, tomando como base el estilo "${lead.template}"` : ''}.`,
        `Funciones incluidas: ${list(ans.funciones).join(', ') || 'las acordadas en la cotización'}.`,
        'Se ve bien en el celular, la tableta y el computador.',
        'La preparamos para que Google la encuentre más fácil y para que cargue rápido.',
        'Con candado de seguridad (https) y publicada en internet.',
        ans.dominio === 'Sí, ya tengo' ? 'La conectamos a la dirección en internet que ya tienes.' : 'Te ayudamos a sacar tu dirección en internet (tunegocio.com) a tu nombre.',
        'Botones a redes sociales y enlace a WhatsApp.',
        'Política de privacidad y aviso de tratamiento de datos para el sitio, en versión base (ver sección de datos personales).',
      ],
      deliver: ['Sitio web publicado y funcionando.', 'Tu usuario y clave para cambiar cosas tú mismo (si lo pediste).', 'Guía corta de uso.', 'Puedes pedirnos cambios 2 veces.'],
      req: ['Que la dirección en internet y el espacio donde vive la página estén a tu nombre (nosotros te ayudamos).', 'Funciona en los navegadores de siempre: Chrome, Safari, Edge y Firefox.', 'Para cobrar por internet necesitas una cuenta en Wompi, Mercado Pago u otra parecida (te ayudamos a abrirla).'],
    };
    case 'branding': return {
      title: 'Tu logo e imagen',
      what: [
        ans.logo ? `Punto de partida: ${ans.logo.toLowerCase()}.` : 'Construcción de la identidad visual de la marca.',
        `Piezas incluidas: ${list(ans.piezas).join(', ') || 'las acordadas en la cotización'}.`,
        'Te mostramos 2 o 3 ideas y terminamos la que más te guste.',
        'Escogemos los colores y el tipo de letra de tu negocio.',
      ],
      deliver: ['Tu logo en todos los formatos que vas a necesitar (para redes, para imprimir, para avisos).', 'Versiones a color, blanco y negro.', 'Manual o guía de marca en PDF (si está incluido).', 'Hasta 2 rondas de ajustes por pieza.'],
      req: [],
    };
    case 'audiovisual': return {
      title: 'Tus fotos y videos',
      what: [
        `Producción de: ${list(ans.contenido).join(', ') || 'el contenido acordado'}.`,
        `Frecuencia: ${ans.frecuencia || 'según lo acordado'}.`,
        'Planeamos qué vamos a grabar, lo grabamos y lo dejamos bonito.',
        'Arreglamos los colores y ponemos música que se puede usar sin problemas.',
      ],
      deliver: ['Fotos editadas en alta resolución (JPG).', 'Videos listos para el celular (verticales) y/o para pantalla (horizontales).', 'Hasta 2 rondas de ajustes de edición por pieza.', 'El material en bruto (sin editar) no se entrega salvo acuerdo previo.'],
      req: ['Espacio, productos y personas disponibles el día de la sesión.', 'Autorización de uso de imagen firmada por cada persona que aparezca (te damos el formato).'],
    };
    case 'marketing': return {
      title: 'Tu publicidad en redes',
      what: [
        `Acciones: ${list(ans.acciones).join(', ') || 'las acordadas'}.`,
        'Calendario de publicaciones y diseño de piezas para redes.',
        'Montamos y cuidamos tus anuncios en Facebook e Instagram (si lo pediste).',
        'Cada mes te contamos cuánta gente vio y escribió.',
      ],
      deliver: ['Piezas gráficas listas para publicar.', 'Informe mensual.'],
      req: ['Que nos des acceso a tu Facebook e Instagram para poder publicar (te explicamos cómo).', `El presupuesto de pauta (lo que se paga a Meta) lo paga el cliente directamente y no está incluido. Referencia indicada: ${ans.pauta || 'por definir'}.`],
    };
    case 'print': return {
      title: 'Publicidad física e impresos',
      what: [`Diseño y coordinación de producción de: ${list(ans.impresos).join(', ') || 'las piezas acordadas'}.`, 'Diseño adaptado a las medidas y materiales finales.'],
      deliver: ['Archivos listos para impresión (PDF de alta calidad).', 'Producción con nuestra aliada de impresión, según lo cotizado.'],
      req: ['Medidas exactas del espacio de instalación.', 'Permisos de instalación del local o de la administración (cuando apliquen).'],
    };
    default: return null;
  }
}

function timeline(services, timing) {
  const phases = [['Arranque', 'Reunión inicial, recepción de información y anticipo.', 2]];
  if (services.includes('branding')) phases.push(['Marca', 'Propuestas de logo e identidad, ajustes y aprobación.', 7]);
  if (services.includes('web')) phases.push(['Web', 'Estructura, diseño, desarrollo, pruebas y publicación.', 12]);
  if (services.includes('audiovisual')) phases.push(['Producción', 'Planeación, sesión de fotos/video y edición.', 7]);
  if (services.includes('print')) phases.push(['Impresos', 'Diseño final, aprobación y producción.', 6]);
  if (services.includes('marketing')) phases.push(['Lanzamiento', 'Calendario de contenido y activación de campañas.', 5]);
  phases.push(['Entrega', 'Entrega final, capacitación corta y cierre.', 2]);
  const factor = timing === 'Lo antes posible' ? 0.75 : timing === 'En 1–2 meses' || timing === 'Sin prisa' ? 1.2 : 1;
  return phases.map(([n, d, days]) => [n, d, Math.max(1, Math.round(days * factor))]);
}

// part: 'propuesta' (alcance, lo que necesito, cronograma) | 'contrato' (partes, pagos, derechos, datos, condiciones, firmas)
function buildPDF(lead, part) {
  const isContract = part === 'contrato';
  const d = lead.details || {};
  const q = lead.quote || {};
  const services = d.services || [];
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 50, CW = W - M * 2;
  const num = quoteNumber(lead).replace('KSTA-', isContract ? 'CONT-' : 'PLAN-');
  const date = new Date(lead.created_at || Date.now());
  const fmt = (x) => x.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  let y = 0, page = 1, sec = 0;

  // ---------- primitives ----------
  const footer = () => {
    doc.setDrawColor(...LINE); doc.line(M, H - 46, W - M, H - 46);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(`${BRAND} · ${isContract ? 'Contrato de prestación de servicios' : 'Propuesta y plan de trabajo'} · ${num}`, M, H - 30);
    doc.text(`Página ${page}`, W - M, H - 30, { align: 'right' });
  };
  const newPage = () => { footer(); doc.addPage(); page++; y = M; };
  const ensure = (h) => { if (y + h > H - 70) newPage(); };
  const h1 = (t) => {
    ensure(60); sec++;
    y += 10;
    doc.setFillColor(...PURPLE); doc.roundedRect(M, y - 13, 26, 18, 4, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
    doc.text(String(sec).padStart(2, '0'), M + 13, y, { align: 'center' });
    doc.setFontSize(14); doc.setTextColor(...INK); doc.text(t, M + 36, y);
    y += 18;
  };
  const h2 = (t) => { ensure(34); y += 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...PURPLE); doc.text(t, M, y); y += 15; };
  const p = (t, size = 9.5, color = INK) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(t, CW);
    lines.forEach((l) => { ensure(14); doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color); doc.text(l, M, y); y += size * 1.45; });
    y += 4;
  };
  const bullets = (arr, size = 9.3) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...INK);
    arr.filter(Boolean).forEach((t) => {
      const lines = doc.splitTextToSize(t, CW - 16);
      ensure(lines.length * 13 + 2);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...INK);
      doc.setFillColor(...PURPLE); doc.circle(M + 4, y - 3, 1.8, 'F');
      lines.forEach((l, i) => { doc.text(l, M + 14, y + i * 13.2); });
      y += lines.length * 13.2 + 3;
    });
    y += 4;
  };
  const kv = (rows) => {
    rows.filter(([, v]) => v).forEach(([k, v]) => {
      const lines = doc.splitTextToSize(String(v), CW - 150);
      ensure(lines.length * 13 + 6);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text(k, M, y);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(lines, M + 150, y);
      y += lines.length * 13 + 5;
    });
    y += 4;
  };

  // ---------- Cover ----------
  doc.setFillColor(...DARK); doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(...PURPLE); doc.circle(W + 20, 120, 230, 'F');
  doc.setFillColor(168, 85, 247); doc.circle(W - 120, 330, 60, 'F');
  doc.setFillColor(232, 121, 249); doc.circle(W - 60, 420, 12, 'F');
  drawLogo(doc, M, 95, 24);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(34); doc.setTextColor(255, 255, 255);
  doc.text(isContract ? ['Contrato de', 'prestación de servicios'] : ['Propuesta y', 'plan de trabajo'], M, 420);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(210, 200, 235);
  doc.text(doc.splitTextToSize(`Preparado para ${lead.name}${lead.business ? ` · ${lead.business}` : ''}`, CW), M, 490);
  doc.setFontSize(10); doc.setTextColor(170, 160, 200);
  doc.text(`${lead.service || ''}`, M, 512);
  doc.setFont('courier', 'normal'); doc.text(`${num} · ${fmt(date)}`, M, 532);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(150, 140, 180);
  doc.text(doc.splitTextToSize(isContract
    ? `Acuerdo entre ${lead.name || 'el cliente'} y ${BRAND} para el proyecto descrito en la propuesta ${quoteNumber(lead).replace('KSTA-', 'PLAN-')} y la cotización ${quoteNumber(lead)}: valor, forma de pago, plazos, derechos sobre lo que se crea, tus derechos como consumidor y el tratamiento de tus datos.`
    : 'Este documento describe el proyecto: lo que voy a hacer, lo que vas a recibir, lo que necesito de ti y en cuánto tiempo estará listo. Las condiciones legales van en el contrato, que es un documento aparte.', CW), M, H - 110);
  doc.addPage(); page++; y = M;

  const b = d.business || {};
  if (!isContract) {
  // ---------- 1. Resumen ----------
  h1('Resumen del proyecto');
  kv([
    ['Cliente', lead.name], ['Negocio', [b.name || lead.business, b.sector].filter(Boolean).join(' · ')], ['Ciudad', b.city],
    ['Plan elegido', lead.service], ['Cliente ideal', b.audience], ['Estilo de marca', (d.style || []).join(', ')],
    ['Referencias', b.refs], ['Tiempo deseado', d.timing], ['Contacto', `${lead.phone || ''} · ${lead.email || ''}`],
  ]);
  if (q.total) {
    h2('Inversión (según cotización ' + quoteNumber(lead) + ')');
    kv([['Pago único', cop(q.total)], ['Mensualidad', q.monthly ? `${cop(q.monthly)} /mes (incluye mantenimiento del ${Math.round((q.maintenanceRate ?? PRICES.mantenimiento) * 100)}%)` : ''], ['Anticipo para iniciar', cop(q.deposit)]]);
  }

  // ---------- 2. Alcance ----------
  h1('Alcance: lo que haremos');
  p('A continuación se detalla, por cada servicio contratado, el trabajo que realizaremos, lo que recibirás y los requisitos técnicos. Cualquier trabajo no descrito aquí se considera adicional y se cotiza por aparte.', 9.3, MUTED);
  services.forEach((s) => {
    const sc = scopeFor(s, (d.details || {})[s], lead);
    if (!sc) return;
    h2(sc.title);
    bullets(sc.what);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...MUTED); ensure(16); doc.text('Entregables', M, y); y += 13;
    bullets(sc.deliver);
    if (sc.req.length) { ensure(16); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...MUTED); doc.text('Requisitos técnicos', M, y); y += 13; bullets(sc.req); }
  });

  // ---------- 3. Lo que necesitamos de ti ----------
  h1('Lo que necesitamos de ti');
  bullets([
    'Información del negocio: textos, servicios/productos, precios y datos de contacto.',
    services.includes('branding') ? null : 'Tu logo y colores de marca en la mejor calidad disponible.',
    'Fotos o material propio que quieras usar (con derechos para usarlo).',
    'Una persona de contacto que apruebe avances y responda en máximo 3 días hábiles.',
    'Pago del anticipo para iniciar el proyecto.',
    'Si la entrega de información o las aprobaciones se demoran, el cronograma se corre el mismo tiempo.',
  ]);

  // ---------- 4. Cronograma ----------
  h1('Cronograma estimado');
  const tl = timeline(services, d.timing);
  let day = 0;
  tl.forEach(([n, desc, days]) => {
    ensure(34);
    doc.setFillColor(...SOFT); doc.roundedRect(M, y - 12, CW, 28, 6, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...PURPLE); doc.text(n, M + 10, y + 5);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...INK); doc.text(doc.splitTextToSize(desc, CW - 210)[0], M + 95, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...MUTED); doc.text(`días ${day + 1}–${day + days}`, W - M - 10, y + 5, { align: 'right' });
    day += days; y += 34;
  });
  p(`Duración total estimada: ${day} días hábiles desde la recepción del anticipo y la información completa. Las etapas pueden avanzar en paralelo.`, 9, MUTED);

  h1('Siguiente paso');
  bullets([
    'Si estás de acuerdo con esta propuesta, te mando el contrato para que lo revises y lo firmes (puede ser por correo o WhatsApp).',
    `Con el contrato firmado y el anticipo de ${q.deposit ? cop(q.deposit) : 'la mitad del valor'}, arrancamos.`,
    `Esta propuesta es válida por ${PRICES.vigenciaDias} días.`,
  ]);
  footer();
  return doc;
  }

  // ================= CONTRATO =================
  const tlC = timeline(services, d.timing);
  const totalDays = tlC.reduce((s, [, , n]) => s + n, 0);
  h1('Las partes');
  kv([
    ['Contratante (cliente)', lead.name], ['Negocio', [b.name || lead.business, b.sector].filter(Boolean).join(' · ')], ['Ciudad', b.city],
    ['Contacto', [lead.phone, lead.email].filter(Boolean).join(' · ')], ['Documento de identidad', 'C.C. / NIT ____________________'],
  ]);
  kv([['Contratista', `${OWNER} (${BRAND})`], ['Contacto', CONTACT_EMAIL + ' · Instagram @kstastudio_'], ['Documento de identidad', 'C.C. ____________________']]);
  p('Las partes acuerdan celebrar este contrato de prestación de servicios, que se rige por las cláusulas siguientes.', 9.3, MUTED);

  h1('Objeto');
  p(`El contratista realizará para el cliente: ${services.map((s) => scopeFor(s, (d.details || {})[s], lead)?.title.replace(/^Tu |^Tus /, '').toLowerCase()).filter(Boolean).join(', ') || lead.service}, con el alcance, los entregables y los requisitos descritos en la propuesta ${quoteNumber(lead).replace('KSTA-', 'PLAN-')}, que hace parte de este contrato. Lo que no esté descrito allí se considera trabajo adicional y se cotiza por aparte.`);

  h1('Valor y forma de pago');
  kv([
    ['Valor total', q.total ? cop(q.total) : 'Según cotización'],
    ['Anticipo (al firmar)', q.deposit ? cop(q.deposit) : ''],
    ['Saldo (contra entrega)', q.total && q.deposit ? cop(q.total - q.deposit) : ''],
    ['Cuota mensual', q.monthly ? `${cop(q.monthly)} /mes, desde la publicación o entrega` : ''],
  ]);
  p('Valores en pesos colombianos, sin IVA. Los pagos se hacen por transferencia, Nequi o Daviplata a la cuenta que indique el contratista. La cuota mensual cubre que la página siga en internet, segura y funcionando, soporte y ajustes menores.');

  h1('Plazo');
  p(`El proyecto se entrega en un plazo estimado de ${totalDays} días hábiles, contados desde que el cliente paga el anticipo y entrega la información completa. Si el cliente se demora en enviar información o en aprobar avances, el plazo se corre el mismo tiempo.`);

  h1('Obligaciones de las partes');
  h2('Del contratista');
  bullets(['Hacer el trabajo descrito en la propuesta con calidad y en el plazo acordado.', 'Mostrar avances al cliente y atender hasta 2 rondas de ajustes por pieza.', 'Entregar los archivos finales y los accesos cuando se pague el valor total.', 'Guardar reserva sobre la información del negocio del cliente.']);
  h2('Del cliente');
  bullets(['Pagar el anticipo, el saldo y la cuota mensual en las fechas acordadas.', 'Entregar la información, fotos y textos necesarios, con derechos para usarlos.', 'Revisar y responder los avances en máximo 3 días hábiles.', services.includes('branding') ? null : 'Entregar su logo y colores en la mejor calidad disponible.']);

  // ---------- Propiedad intelectual ----------
  h1('Propiedad intelectual y uso de lo que creamos');
  p('En Colombia los derechos de autor se rigen por la Ley 23 de 1982 y la Decisión Andina 351 de 1993. Para este proyecto se acuerda lo siguiente:');
  bullets([
    'Una vez pagado el valor total del proyecto, el cliente recibe los derechos patrimoniales de uso, reproducción y modificación sobre los entregables finales aprobados (logo, diseños, textos y piezas creadas para él), sin límite de tiempo ni territorio.',
    services.includes('web') ? 'Página web: el dominio y el contenido son del cliente. El código desarrollado a la medida se entrega al cliente al finalizar el pago. Las plantillas base de terceros (por ejemplo HTML5 UP, licencia CC BY 3.0), librerías y tipografías mantienen sus propias licencias, que permiten su uso comercial.' : null,
    services.includes('audiovisual') ? 'Fotos y videos: los archivos editados entregados son de uso libre para el cliente en sus canales (redes, web, publicidad). El material en bruto queda en poder de KstaStudio_ salvo que se acuerde su entrega. La música usada tiene licencia libre o comercial; si el cliente desea otra canción, debe tener sus derechos.' : null,
    services.includes('audiovisual') ? 'Uso de imagen: las personas que aparezcan en fotos o videos deben firmar una autorización de uso de imagen. El cliente es responsable de obtenerla de sus empleados o clientes.' : null,
    services.includes('branding') ? 'Diseños y marca: se entregan los archivos finales y editables (vectoriales). Las propuestas descartadas no se ceden y pueden no ser reutilizadas por el cliente. Recomendamos registrar la marca ante la Superintendencia de Industria y Comercio (SIC); el registro no está incluido salvo acuerdo.' : null,
    'Material que aporte el cliente (fotos, textos, logos): el cliente declara tener los derechos para usarlo y responde por ello.',
    'Portafolio: KstaStudio_ podrá mostrar el proyecto terminado en su portafolio y redes, salvo que el cliente solicite por escrito que no se haga.',
    'Hasta que no se pague el valor total, los derechos sobre los entregables permanecen en KstaStudio_.',
  ]);

  // ---------- 6. Derechos del consumidor ----------
  h1('Tus derechos como consumidor');
  p('Como consumidor estás protegido por el Estatuto del Consumidor, Ley 1480 de 2011. En particular tienes derecho a:');
  bullets([
    'Recibir información clara, veraz, suficiente y oportuna sobre los servicios, precios, tiempos y condiciones (este documento y la cotización cumplen ese fin).',
    'Que los servicios cumplan las condiciones de calidad e idoneidad ofrecidas.',
    'Garantía: durante los 30 días siguientes a la entrega corregimos sin costo errores o fallas atribuibles a nuestro trabajo (por ejemplo, un formulario de la web que no funcione). La garantía no cubre cambios de diseño, contenido nuevo ni daños causados por terceros o por modificaciones hechas por el cliente.',
    'Derecho de retracto (art. 47, ventas a distancia): puedes retractarte dentro de los 5 días hábiles siguientes a la contratación. Este derecho no aplica a servicios que ya hayan empezado a ejecutarse con tu acuerdo, ni a trabajos personalizados según tus especificaciones. Si te retractas antes de iniciar, devolvemos el dinero pagado en máximo 30 días calendario.',
    'Presentar peticiones, quejas o reclamos (PQR) y recibir respuesta en máximo 15 días hábiles, escribiendo a ' + CONTACT_EMAIL + '.',
    'Acudir a la Superintendencia de Industria y Comercio (www.sic.gov.co) si consideras que tus derechos no fueron respetados.',
  ]);

  // ---------- 7. Datos personales ----------
  h1('Tratamiento de datos personales');
  p(`De acuerdo con la Ley 1581 de 2012 (Habeas Data) y el Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015), ${BRAND}, representado por ${OWNER}, es el responsable del tratamiento de los datos que nos compartiste en el cotizador (nombre, teléfono, correo, datos del negocio y preferencias).`);
  h2('Finalidades');
  bullets(['Contactarte y enviarte esta propuesta y la cotización.', 'Ejecutar el proyecto contratado, facturar y dar soporte.', 'Enviarte información de nuestros servicios (puedes pedir que no lo hagamos en cualquier momento).']);
  h2('Tus derechos como titular');
  bullets(['Conocer, actualizar y rectificar tus datos.', 'Pedir prueba de la autorización que nos diste.', 'Ser informado sobre el uso que les damos.', 'Revocar la autorización y pedir que los eliminemos, cuando no exista un deber legal o contractual de conservarlos.', 'Presentar quejas ante la Superintendencia de Industria y Comercio.']);
  p(`Para ejercer estos derechos escribe a ${CONTACT_EMAIL}. Responderemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles. Tus datos se guardan en servidores seguros de proveedores tecnológicos (Supabase y Cloudflare), que pueden estar fuera de Colombia, con medidas de seguridad adecuadas. No vendemos ni compartimos tus datos con terceros para fines comerciales.`);
  if (services.includes('web')) {
    h2('Datos que recogerá tu propia página');
    p('Si tu sitio recoge datos de tus clientes (formularios, reservas, pagos), tú serás el responsable de esos datos ante la ley. Incluiremos en tu sitio un aviso de privacidad y una política de tratamiento de datos en versión base, que debes revisar y ajustar a tu negocio. Si el sitio usa cookies o analítica, se informará a los visitantes.');
  }

  // ---------- 8. Condiciones ----------
  h1('Condiciones comerciales y legales');
  bullets([
    `Pagos: ${Math.round(PRICES.anticipo * 100)}% de anticipo para iniciar y el saldo contra entrega, antes de publicar o entregar los archivos finales. Valores en pesos colombianos, sin IVA.`,
    'Ajustes: incluye hasta 2 rondas de ajustes por pieza. Cambios adicionales o cambios de alcance se cotizan por aparte.',
    `Mantenimiento: la mensualidad cubre soporte, actualizaciones, copias de seguridad y ajustes menores. Se puede cancelar avisando con 30 días de anticipación.`,
    'Cancelación: si el cliente cancela con el proyecto en curso, el anticipo cubre el trabajo realizado hasta ese momento y no es reembolsable, salvo el derecho de retracto descrito arriba.',
    'Abandono: si el cliente no responde durante 30 días calendario, el proyecto se pausa; reactivarlo puede tener un costo adicional.',
    'Servicios de terceros: dominio, hosting, pasarelas de pago, pauta publicitaria y licencias especiales se pagan a sus proveedores y dependen de sus condiciones.',
    'Confidencialidad: ambas partes guardan reserva sobre la información del negocio compartida durante el proyecto.',
    'Responsabilidad: KstaStudio_ no garantiza resultados específicos de ventas o seguidores, ya que dependen de factores externos; sí garantiza la calidad del trabajo descrito.',
    'Ley aplicable: este acuerdo se rige por las leyes de la República de Colombia. Las diferencias se intentarán resolver primero de forma directa y amistosa.',
    'Este contrato, la propuesta y la cotización conforman el acuerdo completo entre las partes.',
  ]);

  // ---------- Firmas ----------
  h1('Firmas');
  p(`Las partes firman este contrato en señal de aceptación${b.city ? `, en ${b.city}` : ''}. También se entiende aceptado si el cliente lo confirma por escrito por correo o WhatsApp (Ley 527 de 1999).`, 9.3, MUTED);
  ensure(110); y += 50;
  const half = (CW - 40) / 2;
  [[lead.name || 'Cliente', 'El cliente'], [OWNER, BRAND]].forEach(([n, r], i) => {
    const x = M + i * (half + 40);
    doc.setDrawColor(...INK); doc.line(x, y, x + half, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...INK); doc.text(n, x, y + 15);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED); doc.text(`${r} · Fecha: ____ / ____ / ________`, x, y + 28);
  });
  y += 50;
  p('Nota: documento de referencia generado automáticamente. No reemplaza la asesoría de un abogado.', 7.5, MUTED);
  footer();
  return doc;
}

export const proposalPDF = (lead) => buildPDF(lead, 'propuesta');
export const contractPDF = (lead) => buildPDF(lead, 'contrato');
const fileName = (lead, prefix, tag) => `${prefix}-${quoteNumber(lead).replace('KSTA-', tag)}-${(lead.business || lead.name || 'KstaStudio').replace(/[^\w-]+/g, '_')}.pdf`;
export function downloadProposal(lead) { proposalPDF(lead).save(fileName(lead, 'Propuesta', 'PLAN-')); }
export function downloadContract(lead) { contractPDF(lead).save(fileName(lead, 'Contrato', 'CONT-')); }
