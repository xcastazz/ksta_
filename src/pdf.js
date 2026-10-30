import { jsPDF } from 'jspdf';
import { cop, PRICES } from './pricing.js';

const PURPLE = [124, 58, 237], DARK = [12, 6, 24], INK = [30, 22, 48], MUTED = [110, 100, 135], LINE = [230, 225, 240], SOFT = [246, 242, 255];

export const quoteNumber = (lead) => {
  const d = new Date(lead.created_at || Date.now());
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `KSTA-${ymd}-${String(lead.id || '').replace(/-/g, '').slice(0, 4).toUpperCase() || 'NUEVA'}`;
};

/**
 * @param {{name,email,phone,business,service,template,quote,id,created_at}} lead
 * @returns {jsPDF}
 */
export function quotePDF(lead) {
  const q = lead.quote;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 44;
  const num = quoteNumber(lead);
  const date = new Date(lead.created_at || Date.now());
  const until = new Date(date.getTime() + PRICES.vigenciaDias * 864e5);
  const fmt = (d) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  let y;

  // ---- Header band
  doc.setFillColor(...DARK); doc.rect(0, 0, W, 170, 'F');
  doc.setFillColor(...PURPLE); doc.circle(W - 30, 10, 100, 'F');
  doc.setFillColor(168, 85, 247); doc.circle(W - 150, 120, 34, 'F');
  doc.setFillColor(232, 121, 249); doc.circle(W - 95, 150, 8, 'F');
  doc.setFont('courier', 'bold'); doc.setFontSize(30); doc.setTextColor(255, 255, 255);
  doc.text('KstaStudio', M, 70);
  doc.setTextColor(192, 132, 252); doc.text('_', M + doc.getTextWidth('KstaStudio'), 70);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(200, 190, 225);
  doc.text('Estudio creativo · Branding · Web · Audiovisual · Publicidad', M, 90);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
  doc.text('Cotización', M, 140);
  doc.setFont('courier', 'normal'); doc.setFontSize(10); doc.setTextColor(200, 190, 225);
  doc.text(num, M + 125, 140);

  // ---- Meta row
  y = 205;
  const meta = [['Cliente', lead.name || '—'], ['Negocio', lead.business || '—'], ['Fecha', fmt(date)], ['Válida hasta', fmt(until)]];
  const colW = (W - M * 2) / 4;
  meta.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(k.toUpperCase(), M + i * colW, y);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK);
    doc.text(doc.splitTextToSize(String(v), colW - 10), M + i * colW, y + 15);
  });
  y += 42;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text(`${lead.service || ''}${lead.template ? `  ·  Plantilla web: ${lead.template}` : ''}  ·  ${lead.phone || ''}  ·  ${lead.email || ''}`, M, y);
  y += 22;

  // ---- Items table
  const tableHead = () => {
    doc.setFillColor(...SOFT); doc.roundedRect(M, y, W - M * 2, 26, 6, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...PURPLE);
    doc.text('CONCEPTO', M + 14, y + 17); doc.text('VALOR', W - M - 14, y + 17, { align: 'right' });
    y += 42;
  };
  const ensure = (h, head = true) => { if (y + h > H - 90) { footer(); doc.addPage(); y = M + 10; if (head) tableHead(); } };
  tableHead();

  const groups = [...new Set(q.items.map((i) => i.group))];
  groups.forEach((g) => {
    ensure(40);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK);
    doc.text(g, M + 14, y); y += 6;
    doc.setDrawColor(...LINE); doc.line(M + 14, y, W - M - 14, y); y += 14;
    q.items.filter((i) => i.group === g).forEach((it) => {
      const lines = doc.splitTextToSize(it.concept + (it.monthly ? '  (mensual)' : ''), W - M * 2 - 150);
      ensure(lines.length * 13 + 6);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...INK);
      doc.text(lines, M + 24, y);
      doc.setFont('helvetica', 'bold');
      doc.text(cop(it.price) + (it.monthly ? ' /mes' : ''), W - M - 14, y, { align: 'right' });
      y += lines.length * 13 + 6;
    });
    y += 8;
  });

  // ---- Totals
  ensure(170, false);
  const tx = W - M - 230, row = (k, v, bold = false, color = INK) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 11 : 10); doc.setTextColor(...color);
    doc.text(k, tx, y); doc.text(v, W - M - 14, y, { align: 'right' }); y += 18;
  };
  y += 4;
  row('Subtotal', cop(q.subtotal));
  if (q.discount) row(`Descuento paquete (${Math.round(q.discountRate * 100)}%)`, '- ' + cop(q.discount), false, [22, 140, 80]);
  if (q.rush) row(`Entrega prioritaria (+${Math.round(q.rushRate * 100)}%)`, '+ ' + cop(q.rush));
  y += 4;
  doc.setFillColor(...PURPLE); doc.roundedRect(tx - 14, y - 4, W - M - tx + 14, 44, 10, 10, 'F');
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(230, 220, 255);
  doc.text('TOTAL INVERSIÓN', tx, y + 13);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(255, 255, 255);
  doc.text(cop(q.total), W - M - 14, y + 30, { align: 'right' });
  y += 58;
  if (q.maintenance) row(`Mantenimiento mensual (${Math.round(q.maintenanceRate * 100)}%)`, cop(q.maintenance) + ' /mes', false, PURPLE);
  if (q.services) row('Servicios mensuales', cop(q.services) + ' /mes', false, PURPLE);
  if (q.monthly) row('Total mensual', cop(q.monthly) + ' /mes', true, PURPLE);
  row(`Anticipo para iniciar (${Math.round(PRICES.anticipo * 100)}%)`, cop(q.deposit), true);

  // ---- Terms
  ensure(110, false);
  y += 10;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK);
  doc.text('Condiciones', M, y); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...MUTED);
  const terms = [
    `Valores en pesos colombianos (COP), no incluyen IVA. Cotización válida por ${PRICES.vigenciaDias} días.`,
    `Forma de pago: ${Math.round(PRICES.anticipo * 100)}% de anticipo para iniciar y el saldo contra entrega.`,
    'Incluye hasta 2 rondas de ajustes por pieza. Cambios adicionales se cotizan aparte.',
    `Mantenimiento mensual (${Math.round(PRICES.mantenimiento * 100)}% del valor total): soporte, actualizaciones, copias de seguridad y ajustes menores.`,
    'La pauta publicitaria (lo que se paga a Meta por los anuncios) no está incluida en estos valores.',
    'Impresión y producción física sujetas a medidas y materiales finales.',
  ];
  terms.forEach((t) => { const l = doc.splitTextToSize('•  ' + t, W - M * 2); doc.text(l, M, y); y += l.length * 12; });

  footer();
  function footer() {
    doc.setDrawColor(...LINE); doc.line(M, H - 60, W - M, H - 60);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MUTED);
    doc.text('KstaStudio_ · Jerónimo Castañeda Velásquez · Hecho en Colombia', M, H - 42);
    doc.text('ksta.jc-casta00.workers.dev', W - M, H - 42, { align: 'right' });
  }
  return doc;
}

export function downloadQuote(lead) {
  quotePDF(lead).save(`Cotizacion-${quoteNumber(lead)}-${(lead.business || lead.name || 'KstaStudio').replace(/[^\w-]+/g, '_')}.pdf`);
}
