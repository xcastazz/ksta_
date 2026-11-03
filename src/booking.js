import { supabase } from './supabase.js';
import { icons } from './icons.js';
import { MEETING } from './config.js';

// =========================================================
//  Agendador de asesorías por Google Meet (hora de Colombia)
// =========================================================
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Booking widget markup (shared by the quote wizard and the budget planner). */
export const bookingHTML = () => `
  <section class="booking vision">
    <div class="bk-head"><span class="bk-logo">${icons.teams}</span><div><b>¿Quieres hablar con nosotros por videollamada? Es gratis</b><small>${MEETING.durationMin} minutos para resolver tus dudas. Te mandamos un enlace y solo tienes que tocarlo para entrar. Hora de Colombia.</small></div></div>
    <div class="bk-days" id="bkDays"><p class="muted small">Cargando horarios…</p></div>
    <div class="bk-hours" id="bkHours"></div>
    <label class="bk-topic">¿Quieres preguntarnos algo en especial? <input id="bkTopic" maxlength="300" placeholder="Opcional" /></label>
    <button class="btn" id="bkGo" disabled>${icons.teams} Apartar mi cita</button>
  </section>`;
// Slot as an absolute instant in Colombia time (UTC-5, no DST)
const slotISO = (d, h) => `${d}T${String(h).padStart(2, '0')}:00:00-05:00`;
const coDate = (dt) => new Date(dt.getTime() - 5 * 3600e3).toISOString().slice(0, 10);
const prettyDay = (d) => new Date(d + 'T12:00:00-05:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Bogota' });
const prettyHour = (h) => `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'a. m.' : 'p. m.'}`;

export async function setupBooking(box, lead, toast) {
  if (!box) return;
  const daysEl = box.querySelector('#bkDays'), hoursEl = box.querySelector('#bkHours'), btn = box.querySelector('#bkGo');
  let taken = new Set();
  try { const { data } = await supabase.rpc('booked_slots'); taken = new Set((data || []).map((t) => new Date(t).getTime())); } catch { /* show all slots */ }
  const minTime = Date.now() + MEETING.minNoticeHours * 3600e3;
  const days = [];
  for (let i = 0, d = new Date(); days.length < MEETING.days && i < 30; i++, d = new Date(d.getTime() + 864e5)) {
    const ds = coDate(d);
    const dow = new Date(ds + 'T12:00:00-05:00').getUTCDay();
    if (!MEETING.workDays.includes(dow)) continue;
    const free = MEETING.hours.filter((h) => { const t = new Date(slotISO(ds, h)).getTime(); return t > minTime && !taken.has(t); });
    if (free.length) days.push([ds, free]);
  }
  let day = null, hour = null;
  if (!days.length) { daysEl.innerHTML = '<p class="muted small">Por ahora no hay horas libres. Te escribimos para buscar una que te sirva.</p>'; btn.remove(); return; }
  const drawHours = () => {
    const free = (days.find(([d]) => d === day) || [, []])[1];
    hoursEl.innerHTML = free.map((h) => `<button type="button" class="${h === hour ? 'on' : ''}" data-h="${h}">${prettyHour(h)}</button>`).join('');
    hoursEl.querySelectorAll('[data-h]').forEach((b) => b.addEventListener('click', () => { hour = +b.dataset.h; drawHours(); btn.disabled = false; }));
  };
  daysEl.innerHTML = days.map(([d]) => `<button type="button" data-d="${d}">${prettyDay(d)}</button>`).join('');
  daysEl.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
    day = b.dataset.d; hour = null; btn.disabled = true;
    daysEl.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('on', x === b));
    drawHours();
  }));
  daysEl.querySelector('[data-d]').click();

  btn.addEventListener('click', async () => {
    if (!day || hour == null) return;
    btn.disabled = true; btn.textContent = 'Apartando…';
    const { error } = await supabase.from('meetings').insert({
      lead_id: lead.id, starts_at: slotISO(day, hour), duration_min: MEETING.durationMin,
      name: lead.name, email: lead.email, phone: lead.phone, topic: box.querySelector('#bkTopic').value.trim() || null,
    });
    if (error) {
      console.error(error);
      toast(error.code === '23505' ? 'Ese horario acaba de ocuparse. Elige otro.' : 'No pudimos agendar. Intenta de nuevo.');
      btn.disabled = false; btn.innerHTML = `${icons.teams} Apartar mi cita`;
      if (error.code === '23505') setupBooking(box, lead, toast);
      return;
    }
    box.classList.add('booked');
    box.innerHTML = `<div class="bk-done"><span class="bk-logo">${icons.teams}</span>
      <div><b>¡Listo, tu cita quedó apartada!</b><p>${prettyDay(day)} a las ${prettyHour(hour)} (hora de Colombia), por videollamada. Te mandamos el enlace para entrar a <b>${esc(lead.email)}</b> y a tu WhatsApp.</p></div></div>`;
    dispatchEvent(new Event('scene:kick'));
  });
}
