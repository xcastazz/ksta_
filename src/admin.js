import { supabase } from './supabase.js';
import { icons } from './icons.js';
import { buildQuote, totals, cop } from './pricing.js';
import { MEET_LINK } from './config.js';

const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUSES = [
  ['nuevo', 'Nuevo'], ['contactado', 'Contactado'], ['cotizado', 'Cotizado'], ['negociacion', 'En negociación'],
  ['anticipo', 'Anticipo pagado'], ['desarrollo', 'En desarrollo'], ['revision', 'En revisión'], ['entregado', 'Entregado'],
  ['cerrado', 'Finalizado'], ['pausado', 'Pausado'], ['perdido', 'Perdido'],
];
// Stage groups used by metrics
const SALES = ['nuevo', 'contactado', 'cotizado', 'negociacion'];          // still selling
const WON = ['anticipo', 'desarrollo', 'revision', 'entregado', 'cerrado'];  // paid the deposit → it's a sale
const INACTIVE = ['cerrado', 'perdido'];                                     // no follow-up needed
const PRIORITIES = [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']];
const statusLabel = (s) => (STATUSES.find(([k]) => k === s) || [, s])[1];
const VIEWS = [
  ['dashboard', 'Inicio', 'grid'], ['solicitudes', 'Solicitudes', 'inbox'], ['tablero', 'Tablero', 'layers'],
  ['agenda', 'Agenda', 'teams'], ['seguimientos', 'Seguimientos', 'calendar'], ['ajustes', 'Ajustes', 'list'],
];

let leads = [];
let meetings = [];
let view = 'dashboard';
let filter = 'todos';
let query = '';
let selectedId = null;
let unread = 0;
let me = null;
let booted = null;   // email of the session already booted (avoid double boot)
let channel = null;  // single realtime channel

// ---------- Auth ----------
async function boot() {
  if (!supabase) { app.innerHTML = '<p class="admin-msg">Supabase no está configurado.</p>'; return; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return renderLogin();
  const { data: ok } = await supabase.rpc('is_admin');
  if (!ok) return renderLogin(`La cuenta ${esc(session.user.email)} no tiene acceso al panel.`, true);
  if (booted === session.user.email) return; // INITIAL_SESSION + SIGNED_IN both fire on load
  booted = session.user.email;
  me = session.user;
  renderShell();
  await Promise.all([loadLeads(), loadMeetings()]);
  subscribe();
}

supabase?.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') { booted = null; if (channel) { supabase.removeChannel(channel); channel = null; } boot(); }
  else if (event === 'SIGNED_IN') boot();
});

function renderLogin(error = '', signedIn = false) {
  app.innerHTML = `
    <div class="login-wrap">
      <form class="login vision" id="loginForm">
        <a href="/" class="logo">KstaStudio<span class="cursor">_</span></a>
        <p class="eyebrow">// panel de asesores</p>
        <h1>Inicia sesión</h1>
        <p class="muted">Te enviaremos un enlace mágico a tu correo. Sin contraseñas.</p>
        ${signedIn ? '' : `<label>Correo<input type="email" name="email" required autocomplete="email" placeholder="tu@correo.com" /></label>
        <button class="btn" type="submit">Enviarme el enlace ${icons.send}</button>`}
        ${signedIn ? '<button class="btn btn-ghost" type="button" id="logoutBtn">Cerrar sesión</button>' : ''}
        <p class="login-status ${error ? 'err' : ''}" id="loginStatus">${error}</p>
      </form>
    </div>`;
  document.getElementById('logoutBtn')?.addEventListener('click', () => supabase.auth.signOut());
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    const st = document.getElementById('loginStatus');
    st.className = 'login-status'; st.textContent = 'Enviando…';
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${location.origin}/admin` } });
    if (error) { st.className = 'login-status err'; st.textContent = error.message; return; }
    st.className = 'login-status ok';
    st.textContent = '¡Listo! Revisa tu correo y abre el enlace en este navegador.';
  });
}

// ---------- Shell ----------
function renderShell() {
  app.innerHTML = `
    <aside class="a-rail vision">
      <a href="/" class="a-rail-logo" title="Ver sitio">K_</a>
      ${VIEWS.map(([k, label, ic]) => `<button data-view="${k}" title="${label}" aria-label="${label}">${icons[ic]}<span class="a-tip">${label}</span></button>`).join('')}
      <span class="a-rail-sep"></span>
      <button id="notifBtn" title="Activar notificaciones">${icons.bell}<span class="a-tip">Notificaciones</span></button>
      <button id="logout" title="Cerrar sesión">${icons.logout}<span class="a-tip">Salir</span></button>
    </aside>
    <div class="a-main">
      <header class="a-top vision">
        <div class="a-user"><span class="avatar">${esc(me.email[0].toUpperCase())}</span><span>Hola, <b>${esc(me.email.split('@')[0])}</b></span></div>
        <div class="a-search"><input id="search" placeholder="Buscar cliente, negocio, teléfono…" /></div>
        <div class="a-live" id="live"><span class="dot"></span><span id="liveText">Conectando…</span></div>
        <button class="a-bell" id="bell" title="Nuevas solicitudes">${icons.bell}<span class="badge" id="badge" hidden>0</span></button>
      </header>
      <section class="a-window vision" id="view"></section>
    </div>
    <div class="a-toasts" id="toasts"></div>`;

  app.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => go(b.dataset.view)));
  document.getElementById('logout').addEventListener('click', () => supabase.auth.signOut());
  document.getElementById('search').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); if (view !== 'solicitudes' && view !== 'tablero') view = 'solicitudes'; renderAll(); });
  document.getElementById('notifBtn').addEventListener('click', async () => {
    if (!('Notification' in window)) return toast('Tu navegador no soporta notificaciones');
    const p = await Notification.requestPermission();
    toast(p === 'granted' ? 'Notificaciones activadas' : 'Notificaciones bloqueadas en el navegador');
    updateNotifBtn();
  });
  document.getElementById('bell').addEventListener('click', () => { unread = 0; updateBadge(); filter = 'nuevo'; go('solicitudes'); });
  updateNotifBtn();
}

addEventListener('keydown', (e) => { if (e.key === 'Escape' && view === 'solicitudes' && selectedId) { selectedId = null; renderAll(); } });

function go(v, id) {
  view = v;
  if (id) selectedId = id;
  renderAll();
}

function updateNotifBtn() {
  const b = document.getElementById('notifBtn');
  if (b && 'Notification' in window) b.classList.toggle('on', Notification.permission === 'granted');
}

// ---------- Data ----------
async function loadMeetings() {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await supabase.from('meetings').select('*').gte('starts_at', since).order('starts_at');
  if (!error) meetings = data;
}

async function loadLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) { toast('Error cargando solicitudes'); console.error(error); return; }
  leads = data;
  renderAll();
}

function subscribe() {
  if (channel) return;
  channel = supabase.channel('leads-admin')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, ({ new: lead }) => {
      leads.unshift(lead);
      unread++; updateBadge();
      renderAll(lead.id);
      notify(lead);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, ({ new: lead }) => {
      const i = leads.findIndex((l) => l.id === lead.id);
      if (i >= 0) leads[i] = lead;
      if (view !== 'solicitudes' || lead.id !== selectedId) renderAll();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, async ({ eventType, new: m }) => {
      await loadMeetings();
      if (eventType === 'INSERT') {
        unread++; updateBadge(); chime();
        const when = fmtMeeting(m.starts_at);
        toast(`Nueva asesoría: ${m.name} · ${when}`, true);
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification('Nueva asesoría por Google Meet', { body: `${m.name} — ${when}`, icon: '/favicon.svg', tag: m.id });
          n.onclick = () => { focus(); go('agenda'); };
        }
      }
      if (view === 'agenda' || view === 'dashboard') renderAll();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, ({ old }) => {
      leads = leads.filter((l) => l.id !== old.id);
      if (selectedId === old.id) selectedId = null;
      renderAll();
    })
    .subscribe((status, err) => {
      if (err) console.warn('Realtime:', status, err);
      const ok = status === 'SUBSCRIBED';
      document.getElementById('live')?.classList.toggle('on', ok);
      const t = document.getElementById('liveText');
      if (t) t.textContent = ok ? 'En vivo' : status === 'CLOSED' ? 'Desconectado' : 'Reconectando…';
      // Supabase retries on its own after CHANNEL_ERROR / TIMED_OUT
    });
}

async function update(id, patch, event) {
  const { error } = await supabase.from('leads').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { toast('No se pudo guardar'); console.error(error); return false; }
  Object.assign(leads.find((l) => l.id === id), patch);
  if (event) logEvent(id, ...event);
  return true;
}

async function logEvent(lead_id, type, text) {
  await supabase.from('lead_events').insert({ lead_id, type, text, actor: me?.email });
  if (lead_id === selectedId) loadEvents(lead_id);
}

// ---------- Notifications ----------
function notify(lead) {
  toast(`Nueva solicitud: ${lead.name} · ${lead.service || ''}`, true);
  chime();
  document.title = `(${unread}) Panel · KstaStudio_`;
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification('Nueva cotización en KstaStudio_', { body: `${lead.name} — ${lead.business || ''}\n${lead.service || ''}`, icon: '/favicon.svg', tag: lead.id });
    n.onclick = () => { focus(); go('solicitudes', lead.id); };
  }
}

function chime() {
  try {
    const ctx = new AudioContext();
    [[880, 0], [1320, 0.12]].forEach(([f, t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.4);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.45);
    });
  } catch { /* audio blocked until user interacts */ }
}

function updateBadge() {
  const b = document.getElementById('badge');
  if (!b) return;
  b.hidden = !unread; b.textContent = unread;
  if (!unread) document.title = 'Panel · KstaStudio_';
}

function toast(msg, highlight = false) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `a-toast vision ${highlight ? 'hl' : ''}`;
  t.innerHTML = `${highlight ? `<span class="a-toast-icon">${icons.bell}</span>` : ''}<span>${esc(msg)}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 5000);
}

// ---------- Helpers ----------
const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const quoteOf = (l) => l.quote_total || 0;
const monthlyOf = (l) => l.quote?.monthly || 0;
const visible = () => leads.filter((l) => (filter === 'todos' || l.status === filter) &&
  (!query || [l.name, l.business, l.phone, l.email, l.service].join(' ').toLowerCase().includes(query)));
const prio = (p) => `<span class="pr pr-${esc(p || 'media')}">${esc((PRIORITIES.find(([k]) => k === p) || PRIORITIES[1])[1])}</span>`;
const followTag = (l) => {
  if (!l.follow_up) return '';
  const t = todayISO();
  const cls = l.follow_up < t ? 'late' : l.follow_up === t ? 'today' : '';
  return `<span class="fu ${cls}">${icons.calendar}${new Date(l.follow_up + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>`;
};

// ---------- Rendering ----------
function renderAll(flashId) {
  app.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  const el = document.getElementById('view');
  if (!el) return;
  ({ dashboard: viewDashboard, solicitudes: viewLeads, tablero: viewBoard, agenda: viewAgenda, seguimientos: viewFollow, ajustes: viewSettings })[view](el, flashId);
}

// ===== Dashboard =====
function viewDashboard(el) {
  const count = (s) => leads.filter((l) => l.status === s).length;
  const sum = (arr, f) => arr.reduce((s, l) => s + f(l), 0);
  const open = leads.filter((l) => SALES.includes(l.status));
  const won = leads.filter((l) => WON.includes(l.status));
  const inProgress = leads.filter((l) => ['anticipo', 'desarrollo', 'revision'].includes(l.status));
  const decided = won.length + count('perdido');
  const rate = decided ? Math.round((won.length / decided) * 100) : 0;
  const today = leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const late = leads.filter((l) => l.follow_up && l.follow_up <= todayISO() && !INACTIVE.includes(l.status));

  // Leads per day, last 14 days (single series → one hue, no legend)
  const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return d; });
  const perDay = days.map((d) => leads.filter((l) => new Date(l.created_at).toDateString() === d.toDateString()).length);
  const max = Math.max(1, ...perDay);
  const bars = perDay.map((n, i) => `<div class="bar-col" title="${days[i].toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}: ${n} solicitud${n === 1 ? '' : 'es'}">
      <span class="bar-v">${n || ''}</span><span class="bar" style="height:${(n / max) * 100}%"></span><span class="bar-x">${days[i].getDate()}</span></div>`).join('');

  // Pipeline by status (magnitude bars with value labels)
  const pipe = STATUSES.map(([k, lab]) => [k, lab, leads.filter((l) => l.status === k)]);
  const pmax = Math.max(1, ...pipe.map(([, , a]) => a.length));

  // Interest by category
  const catCount = { web: 0, branding: 0, marketing: 0, audiovisual: 0, print: 0 };
  leads.forEach((l) => (l.details?.services || []).forEach((s) => { if (s in catCount) catCount[s]++; }));
  const catNames = { web: 'Web', branding: 'Diseño y marca', marketing: 'Marketing', audiovisual: 'Foto y video', print: 'Impresos' };
  const cmax = Math.max(1, ...Object.values(catCount));

  el.innerHTML = `
    <div class="a-head"><div><h1>Inicio</h1><p class="muted">Resumen de tu negocio en tiempo real.</p></div>
      <div class="a-head-btns"><button class="btn btn-sm btn-ghost" id="goAgenda">${icons.teams} Agenda (${upcoming().length})</button><button class="btn btn-sm" id="goNew">${icons.inbox} Ver nuevas (${count('nuevo')})</button></div></div>
    <div class="a-stats">
      ${[
        ['Solicitudes', leads.length, `${today} hoy`, 'inbox'],
        ['En venta', cop(sum(open, quoteOf)), `${open.length} oportunidades abiertas`, 'target'],
        ['Vendido', cop(sum(won, quoteOf)), `${won.length} clientes con anticipo`, 'check'],
        ['En producción', inProgress.length, 'Anticipo, desarrollo o revisión', 'bolt'],
        ['Ingreso mensual', cop(sum(won, monthlyOf)), 'Mensualidades de clientes cerrados', 'calendar'],
        ['Tasa de cierre', `${rate}%`, 'Ventas sobre decididas', 'target'],
        ['Seguimientos', late.length, 'Para hoy o atrasados', 'bell'],
        ['Asesorías', upcoming().length, 'Próximas por Google Meet', 'teams'],
      ].map(([k, v, s, ic]) => `<div class="a-stat vision"><div class="a-stat-top"><span class="a-stat-icon">${icons[ic]}</span>${k}</div><b>${v}</b><small>${s}</small></div>`).join('')}
    </div>
    <div class="a-dash">
      <section class="a-panel vision span2"><h3>Solicitudes últimos 14 días</h3><div class="bars">${bars}</div></section>
      <section class="a-panel vision"><h3>Embudo de ventas</h3>
        <div class="hbars">${pipe.map(([k, lab, a]) => `<div class="hbar" title="${lab}: ${a.length} · ${cop(sum(a, quoteOf))}"><span class="hbar-l">${lab}</span><span class="hbar-t"><span class="hbar-f" style="width:${(a.length / pmax) * 100}%"></span></span><b>${a.length}</b></div>`).join('')}</div>
      </section>
      <section class="a-panel vision"><h3>Servicios más pedidos</h3>
        <div class="hbars">${Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="hbar" title="${catNames[k]}: ${n}"><span class="hbar-l">${catNames[k]}</span><span class="hbar-t"><span class="hbar-f" style="width:${(n / cmax) * 100}%"></span></span><b>${n}</b></div>`).join('')}</div>
      </section>
      <section class="a-panel vision"><h3>Seguimientos pendientes</h3>
        ${late.length ? `<div class="mini-list">${late.slice(0, 6).map((l) => `<button data-open="${l.id}">${followTag(l)}<b>${esc(l.name)}</b><small>${esc(l.business || '')}</small></button>`).join('')}</div>` : '<p class="muted small">Nada pendiente. ¡Bien!</p>'}
      </section>
      <section class="a-panel vision"><h3>Próximas asesorías</h3>
        ${upcoming().length ? `<div class="mini-list">${upcoming().slice(0, 5).map((m) => `<button data-agenda="${m.id}"><span class="mt mt-${m.status}">${m.status}</span><b>${esc(m.name)}</b><small>${fmtMeeting(m.starts_at)}</small></button>`).join('')}</div>` : '<p class="muted small">No hay asesorías agendadas.</p>'}
      </section>
      <section class="a-panel vision"><h3>Últimas solicitudes</h3>
        <div class="mini-list">${leads.slice(0, 6).map((l) => `<button data-open="${l.id}"><span class="st st-${esc(l.status)}">${statusLabel(l.status)}</span><b>${esc(l.name)}</b><small>${ago(l.created_at)}</small></button>`).join('') || '<p class="muted small">Aún no hay solicitudes.</p>'}</div>
      </section>
    </div>`;
  el.querySelector('#goNew').addEventListener('click', () => { filter = 'nuevo'; go('solicitudes'); });
  el.querySelector('#goAgenda').addEventListener('click', () => go('agenda'));
  el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => go('solicitudes', b.dataset.open)));
  el.querySelectorAll('[data-agenda]').forEach((b) => b.addEventListener('click', () => go('agenda')));
}

// ===== Agenda (Teams meetings) =====
const MT_STATUS = [['pendiente', 'Pendiente'], ['confirmada', 'Confirmada'], ['realizada', 'Realizada'], ['cancelada', 'Cancelada']];
const fmtMeeting = (iso) => new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' });
const upcoming = () => meetings.filter((m) => new Date(m.starts_at).getTime() > Date.now() - 3600e3 && !['cancelada', 'realizada'].includes(m.status));
// Google Calendar event template: client invited, Meet is added on save → Google emails the invite
const calendarLink = (m) => {
  const t = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const start = new Date(m.starts_at), end = new Date(start.getTime() + (m.duration_min || 30) * 60e3);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `Asesoría KstaStudio_ · ${m.name}`, dates: `${t(start)}/${t(end)}`, ctz: 'America/Bogota',
    details: `Asesoría sobre tu plan con KstaStudio_.${m.topic ? '\nTema: ' + m.topic : ''}\n\nÚnete por Google Meet con el enlace de esta invitación.`, add: m.email || '' });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};
const waMeeting = (m) => {
  const msg = `¡Hola ${(m.name || '').split(' ')[0]}! 👋 Te escribe tu asesor de KstaStudio_. Tu asesoría por Google Meet quedó confirmada para el ${fmtMeeting(m.starts_at)} (hora de Colombia).${m.teams_link ? `\n\nÚnete por Google Meet aquí: ${m.teams_link}` : '\n\nTe enviamos la invitación de Google Calendar a tu correo.'}\n\n¡Nos vemos!`;
  return `https://wa.me/${(m.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
};

const isMeet = (u) => /meet\.google\.com\//.test(u || '');
const mailMeeting = (m) => {
  const subject = `Tu asesoría con KstaStudio_ · ${fmtMeeting(m.starts_at)}`;
  const body = `Hola ${(m.name || '').split(' ')[0]},\n\nTu asesoría con KstaStudio_ quedó confirmada:\n\n📅 ${fmtMeeting(m.starts_at)} (hora de Colombia)\n⏱ ${m.duration_min} minutos\n🔗 Enlace: ${m.teams_link || '(te lo enviaremos pronto)'}\n\nTe adjuntamos la invitación para tu calendario.\n\n¡Nos vemos!\nJerónimo Castañeda Velásquez\nKstaStudio_`;
  return `mailto:${encodeURIComponent(m.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
function downloadICS(m) {
  const t = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = new Date(new Date(m.starts_at).getTime() + (m.duration_min || 30) * 60e3);
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KstaStudio_//Agenda//ES', 'METHOD:REQUEST', 'BEGIN:VEVENT',
    `UID:${m.id}@kstastudio`, `DTSTAMP:${t(Date.now())}`, `DTSTART:${t(m.starts_at)}`, `DTEND:${t(end)}`,
    `SUMMARY:Asesoría KstaStudio_ · ${m.name}`, `DESCRIPTION:Asesoría sobre tu plan con KstaStudio_.${m.teams_link ? '\\nEnlace: ' + m.teams_link : ''}`,
    `LOCATION:${m.teams_link || 'Videollamada'}`, m.email ? `ATTENDEE;CN=${m.name}:mailto:${m.email}` : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = `asesoria-${(m.name || 'cliente').replace(/\W+/g, '_')}.ics`;
  a.click();
}

// Renders the action block for one meeting (used in Agenda and in the lead detail)
function meetingHTML(m) {
  return `
    <article class="mtg vision ${m.status}" data-m="${m.id}">
      <div class="mtg-time"><b>${new Date(m.starts_at).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })}</b><small>${new Date(m.starts_at).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Bogota' })}</small><small>${m.duration_min} min</small></div>
      <div class="mtg-main">
        <div class="mtg-top"><b>${esc(m.name)}</b><span class="mt mt-${m.status}">${(MT_STATUS.find(([k]) => k === m.status) || [, m.status])[1]}</span></div>
        <small>${esc(m.email || '')} · ${esc(m.phone || '')}</small>
        ${m.topic ? `<p class="mtg-topic">“${esc(m.topic)}”</p>` : ''}
        ${m.teams_link
          ? `<div class="mtg-ready">${icons.check}<span>Reunión lista</span><a href="${esc(m.teams_link)}" target="_blank" rel="noopener">${esc(m.teams_link)}</a></div>`
          : `<div class="mtg-genbox"><button class="btn mtg-gen" data-gen>${icons.teams} Generar reunión de Google Meet</button>
            ${MEET_LINK ? '' : `<div class="mtg-link" data-pastebox hidden><input placeholder="Pega aquí el enlace meet.google.com/…" data-link2 /><button class="btn btn-sm" data-save2>Guardar enlace</button></div>`}</div>`}
        <div class="mtg-actions">
          ${m.teams_link ? `
            <a class="btn btn-sm" href="${waMeeting(m)}" target="_blank" rel="noopener" data-wa>${icons.whatsapp} Enviar por WhatsApp</a>
            <a class="btn btn-sm" href="${mailMeeting(m)}" data-mail>${icons.mail} Enviar por correo</a>
            <button class="btn btn-sm btn-ghost" data-ics>${icons.calendar} Invitación .ics</button>
            <button class="btn btn-sm btn-ghost" data-copy>Copiar enlace</button>
            <a class="btn btn-sm btn-ghost" href="${esc(m.teams_link)}" target="_blank" rel="noopener">Unirme</a>` : ''}
          ${m.lead_id && view !== 'solicitudes' ? `<button class="btn btn-sm btn-ghost" data-lead>Ver solicitud</button>` : ''}
          <select data-st>${MT_STATUS.map(([k, lab]) => `<option value="${k}" ${m.status === k ? 'selected' : ''}>${lab}</option>`).join('')}</select>
        </div>
        <details class="mtg-more"><summary>Usar otro enlace</summary>
          <div class="mtg-link"><input placeholder="Pega un enlace de Google Meet" value="${esc(m.teams_link || '')}" data-link /><button class="btn btn-sm btn-ghost" data-save>Guardar</button></div>
          <a class="small" href="${calendarLink(m)}" target="_blank" rel="noopener">Crear evento en Google Calendar ↗</a> · <a class="small" href="https://meet.google.com/new" target="_blank" rel="noopener">Abrir un Meet nuevo ↗</a>
        </details>
      </div>
    </article>`;
}

function bindMeetings(root, rerender) {
  root.querySelectorAll('[data-m]').forEach((art) => {
    const m = meetings.find((x) => x.id === art.dataset.m);
    if (!m) return;
    const q = (s) => art.querySelector(s);
    q('[data-gen]')?.addEventListener('click', async () => {
      if (MEET_LINK) {
        if (await updateMeeting(m, { teams_link: MEET_LINK, status: m.status === 'pendiente' ? 'confirmada' : m.status }, 'Reunión de Google Meet generada')) { toast('Reunión de Google Meet lista. Ya puedes enviarla.'); rerender(); }
        return;
      }
      // No fixed link: open Google Calendar with the event ready; Google adds Meet and emails the client
      window.open(calendarLink(m), '_blank', 'noopener');
      if (m.status === 'pendiente') updateMeeting(m, { status: 'confirmada' }, 'Evento creado en Google Calendar');
      const pb = q('[data-pastebox]'); if (pb) { pb.hidden = false; q('[data-link2]').focus(); }
      toast('Guarda el evento en Google Calendar (con Meet) y pega aquí el enlace para enviarlo por WhatsApp');
    });
    q('[data-save2]')?.addEventListener('click', async () => {
      const v = q('[data-link2]').value.trim();
      if (!isMeet(v)) return toast('Pega un enlace de Google Meet (meet.google.com/…)');
      if (await updateMeeting(m, { teams_link: v, status: 'confirmada' }, 'Enlace de Google Meet guardado')) { toast('Enlace de Meet guardado. Ya puedes enviarlo.'); rerender(); }
    });
    q('[data-save]').addEventListener('click', async () => {
      const v = q('[data-link]').value.trim() || null;
      if (await updateMeeting(m, { teams_link: v, status: v && m.status === 'pendiente' ? 'confirmada' : m.status }, 'Enlace de reunión actualizado')) { toast('Enlace guardado'); rerender(); }
    });
    q('[data-wa]')?.addEventListener('click', () => logEvent(m.lead_id, 'envio', 'Envió el enlace de la asesoría por WhatsApp'));
    q('[data-mail]')?.addEventListener('click', () => { downloadICS(m); toast('Adjunta la invitación .ics en el correo'); logEvent(m.lead_id, 'envio', 'Envió el enlace de la asesoría por correo'); });
    q('[data-ics]')?.addEventListener('click', () => downloadICS(m));
    q('[data-copy]')?.addEventListener('click', async () => { await navigator.clipboard.writeText(m.teams_link); toast('Enlace copiado'); });
    q('[data-lead]')?.addEventListener('click', () => go('solicitudes', m.lead_id));
    q('[data-st]').addEventListener('change', async (e) => { if (await updateMeeting(m, { status: e.target.value }, `Asesoría: ${e.target.value}`)) { toast('Estado actualizado'); rerender(); } });
  });
}

async function updateMeeting(m, patch, msg) {
  const { error } = await supabase.from('meetings').update(patch).eq('id', m.id);
  if (error) { toast('No se pudo guardar'); console.error(error); return false; }
  Object.assign(m, patch);
  if (m.lead_id && msg) logEvent(m.lead_id, 'seguimiento', msg);
  return true;
}

function viewAgenda(el) {
  const now = Date.now();
  const future = meetings.filter((m) => new Date(m.starts_at).getTime() > now - 3600e3);
  const past = meetings.filter((m) => new Date(m.starts_at).getTime() <= now - 3600e3).reverse();
  const byDay = {};
  future.forEach((m) => { const k = new Date(m.starts_at).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' }); (byDay[k] ||= []).push(m); });
  const card = meetingHTML;
  el.innerHTML = `
    <div class="a-head"><div><h1>Agenda</h1><p class="muted">Asesorías por Google Meet que agendan tus clientes al terminar el cotizador. Hora de Colombia.</p></div></div>
    ${Object.keys(byDay).length ? Object.entries(byDay).map(([d, arr]) => `<h3 class="day-h">${d}</h3><div class="mtgs">${arr.map(card).join('')}</div>`).join('') : `<div class="a-empty">${icons.teams}<p>No hay asesorías próximas.</p></div>`}
    ${past.length ? `<details class="past"><summary>Asesorías pasadas (${past.length})</summary><div class="mtgs">${past.map(card).join('')}</div></details>` : ''}`;

  bindMeetings(el, renderAll);
}

// ===== Leads list + detail =====
function viewLeads(el, flashId) {
  el.innerHTML = `
    <div class="a-head"><div><h1>Solicitudes</h1><p class="muted">Todo lo que llega del cotizador, en tiempo real.</p></div>
      <button class="btn btn-sm btn-ghost" id="csv">${icons.file} Exportar CSV</button></div>
    <div class="a-seg" id="seg">${[['todos', 'Todas'], ...STATUSES].map(([k, l]) => {
      const n = k === 'todos' ? leads.length : leads.filter((x) => x.status === k).length;
      return `<button class="${filter === k ? 'on' : ''}" data-f="${k}">${l} <span>${n}</span></button>`;
    }).join('')}</div>
    <div class="a-body">
      <div class="a-list" id="list"></div>
      <div class="a-detail vision" id="detail"></div>
    </div>`;
  el.querySelectorAll('#seg button').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; renderAll(); }));
  el.querySelector('#csv').addEventListener('click', exportCSV);
  renderList(flashId);
  renderDetail();
}

function renderList(flashId) {
  const list = document.getElementById('list');
  if (!list) return;
  const rows = visible();
  list.innerHTML = rows.length ? rows.map((l, i) => {
    const parts = (l.service || 'Sin plan').split(' + ');
    const hasMeet = meetings.some((m) => m.lead_id === l.id && m.status !== 'cancelada');
    return `
    <button class="a-row lead st-edge-${esc(l.status)} ${l.id === selectedId ? 'sel' : ''} ${l.id === flashId ? 'flash' : ''}" data-id="${l.id}" style="--i:${i}">
      <span class="lc-top">
        <span class="avatar">${esc((l.name || '?')[0].toUpperCase())}</span>
        <span class="lc-who"><b>${esc(l.name)}</b><small>${esc(l.business || 'Sin negocio')}</small></span>
        <span class="st st-${esc(l.status)}">${esc(statusLabel(l.status))}</span>
      </span>
      <span class="lc-plan">${parts.map((p) => `<span>${esc(p)}</span>`).join('')}</span>
      <span class="lc-foot">
        <span class="lc-total">${l.quote_total ? `<small>Total</small><b>${cop(l.quote_total)}</b>` : '<small>Total</small><b class="muted">—</b>'}</span>
        <span class="lc-meta">${l.priority === 'alta' ? prio('alta') : ''}${hasMeet ? `<span class="fu teams-tag">${icons.teams}Meet</span>` : ''}${followTag(l)}<small>${ago(l.created_at)}</small></span>
      </span>
    </button>`;
  }).join('') : `<div class="a-empty small">${icons.inbox}<p>No hay solicitudes aquí.</p></div>`;
  list.querySelectorAll('.a-row').forEach((r) => r.addEventListener('click', () => { selectedId = r.dataset.id; renderList(); renderDetail(); }));
}

// ===== Kanban board (drag & drop between statuses) =====
function viewBoard(el) {
  const rows = leads.filter((l) => !query || [l.name, l.business, l.phone, l.email, l.service].join(' ').toLowerCase().includes(query));
  el.innerHTML = `
    <div class="a-head"><div><h1>Tablero</h1><p class="muted">Arrastra las tarjetas para cambiar el estado de cada cliente.</p></div></div>
    <div class="board" style="--cols:${STATUSES.length}">${STATUSES.map(([k, lab]) => {
      const col = rows.filter((l) => l.status === k);
      return `<div class="col" data-col="${k}">
        <div class="col-head"><span class="st st-${k}">${lab}</span><small>${col.length} · ${cop(col.reduce((s, l) => s + quoteOf(l), 0))}</small></div>
        <div class="col-body">${col.map((l) => `
          <div class="kcard" draggable="true" data-id="${l.id}">
            <div class="kcard-top"><b>${esc(l.name)}</b>${prio(l.priority)}</div>
            <small>${esc(l.business || '')}</small>
            <small class="muted">${esc(l.service || '')}</small>
            <div class="kcard-foot">${l.quote_total ? `<b>${cop(l.quote_total)}</b>` : '<span></span>'}${followTag(l)}</div>
          </div>`).join('') || '<p class="col-empty">Suelta aquí</p>'}</div>
      </div>`;
    }).join('')}</div>`;
  let dragId = null;
  el.querySelectorAll('.kcard').forEach((c) => {
    c.addEventListener('dragstart', (e) => { dragId = c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    c.addEventListener('dragend', () => c.classList.remove('dragging'));
    c.addEventListener('click', () => go('solicitudes', c.dataset.id));
  });
  el.querySelectorAll('.col').forEach((col) => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
    col.addEventListener('dragleave', () => col.classList.remove('over'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault(); col.classList.remove('over');
      const l = leads.find((x) => x.id === dragId);
      const st = col.dataset.col;
      if (!l || l.status === st) return;
      const from = l.status;
      if (await update(l.id, { status: st }, ['estado', `${statusLabel(from)} → ${statusLabel(st)}`])) { toast(`${l.name}: ${statusLabel(st)}`); renderAll(); }
    });
  });
}

// ===== Follow-ups =====
function viewFollow(el) {
  const t = todayISO();
  const active = leads.filter((l) => !INACTIVE.includes(l.status));
  const groups = [
    ['Atrasados', active.filter((l) => l.follow_up && l.follow_up < t), 'late'],
    ['Hoy', active.filter((l) => l.follow_up === t), 'today'],
    ['Próximos', active.filter((l) => l.follow_up && l.follow_up > t).sort((a, b) => a.follow_up.localeCompare(b.follow_up)), ''],
    ['Sin fecha de seguimiento', active.filter((l) => !l.follow_up), 'none'],
  ];
  el.innerHTML = `
    <div class="a-head"><div><h1>Seguimientos</h1><p class="muted">A quién escribirle y cuándo. Asigna fechas desde el detalle de cada solicitud.</p></div></div>
    <div class="follow">${groups.map(([title, arr, cls]) => `
      <section class="a-panel vision ${cls}"><h3>${title} <span class="count">${arr.length}</span></h3>
        ${arr.length ? `<div class="mini-list">${arr.map((l) => `<button data-open="${l.id}">${followTag(l)}<b>${esc(l.name)}</b><small>${esc(l.business || '')} · ${statusLabel(l.status)}</small>${prio(l.priority)}</button>`).join('')}</div>` : '<p class="muted small">Nada por aquí.</p>'}
      </section>`).join('')}</div>`;
  el.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => go('solicitudes', b.dataset.open)));
}

// ===== Settings =====
async function viewSettings(el) {
  el.innerHTML = `
    <div class="a-head"><div><h1>Ajustes</h1><p class="muted">Equipo, exportación y preferencias.</p></div></div>
    <div class="a-dash">
      <section class="a-panel vision"><h3>Administradores</h3>
        <p class="muted small">Estas personas pueden entrar al panel con su correo.</p>
        <div class="mini-list" id="admins"><p class="muted small">Cargando…</p></div>
        <form class="inline-form" id="addAdmin"><input type="email" required placeholder="correo@ejemplo.com" /><button class="btn btn-sm">Agregar</button></form>
      </section>
      <section class="a-panel vision"><h3>Exportar</h3>
        <p class="muted small">Descarga todas las solicitudes en un archivo CSV para Excel o Google Sheets.</p>
        <button class="btn btn-sm" id="csv2">${icons.file} Exportar ${leads.length} solicitudes</button>
      </section>
      <section class="a-panel vision"><h3>Notificaciones</h3>
        <p class="muted small">Recibe una alerta en el escritorio cuando llegue una solicitud (con el panel abierto).</p>
        <button class="btn btn-sm btn-ghost" id="notif2">${icons.bell} ${'Notification' in window && Notification.permission === 'granted' ? 'Activadas ✓' : 'Activar notificaciones'}</button>
      </section>
      <section class="a-panel vision"><h3>Precios y documentos</h3>
        <p class="muted small">La lista de precios está en <code>src/pricing.js</code> y los planes en <code>src/plans.js</code>. Los PDF de cotización y de propuesta se generan solos con esos valores.</p>
      </section>
    </div>`;
  el.querySelector('#csv2').addEventListener('click', exportCSV);
  el.querySelector('#notif2').addEventListener('click', () => document.getElementById('notifBtn').click());
  const loadAdmins = async () => {
    const { data, error } = await supabase.from('admins').select('email').order('email');
    const box = el.querySelector('#admins');
    if (error) { box.innerHTML = '<p class="muted small">No se pudo cargar.</p>'; return; }
    box.innerHTML = data.map(({ email }) => `<div class="adm"><span class="avatar">${esc(email[0].toUpperCase())}</span><b>${esc(email)}</b>${email === me.email ? '<small>tú</small>' : `<button class="aq-del" data-rm="${esc(email)}" title="Quitar">✕</button>`}</div>`).join('');
    box.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm(`¿Quitar el acceso de ${b.dataset.rm}?`)) return;
      const { error: e } = await supabase.from('admins').delete().eq('email', b.dataset.rm);
      toast(e ? 'No se pudo quitar' : 'Acceso quitado'); loadAdmins();
    }));
  };
  el.querySelector('#addAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value.trim().toLowerCase();
    const { error } = await supabase.from('admins').insert({ email });
    toast(error ? 'No se pudo agregar' : `${email} ahora tiene acceso`); e.target.reset(); loadAdmins();
  });
  loadAdmins();
}

function exportCSV() {
  const cols = [['Fecha', (l) => new Date(l.created_at).toLocaleString('es-CO')], ['Nombre', (l) => l.name], ['Negocio', (l) => l.business], ['WhatsApp', (l) => l.phone], ['Email', (l) => l.email],
    ['Plan', (l) => l.service], ['Plantilla', (l) => l.template], ['Estado', (l) => statusLabel(l.status)], ['Prioridad', (l) => l.priority], ['Seguimiento', (l) => l.follow_up],
    ['Total', (l) => l.quote_total], ['Mensual', (l) => l.quote?.monthly], ['Notas', (l) => l.notes]];
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [cols.map(([h]) => cell(h)).join(';'), ...leads.map((l) => cols.map(([, f]) => cell(f(l))).join(';'))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `solicitudes-kstastudio-${todayISO()}.csv`;
  a.click();
  toast('CSV descargado');
}

function waLink(lead) {
  const phone = (lead.phone || '').replace(/\D/g, '');
  const msg = `¡Hola ${lead.name.split(' ')[0]}! 👋 Te escribe tu asesor de KstaStudio_. Recibimos tu solicitud de ${lead.service || 'plan'} para ${lead.business || 'tu negocio'} y ya estamos preparando tu cotización.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// ---------- Structured answers (grouped cards with chips) ----------
const SVC = {
  branding: ['Branding e identidad', 'brand'], web: ['Web y software', 'code'], audiovisual: ['Fotografía y video', 'video'],
  marketing: ['Marketing digital', 'megaphone'], print: ['Publicidad física', 'sign'],
};
const KEY_LABELS = {
  logo: 'Logo actual', piezas: 'Piezas', tipo: 'Tipo de sitio', funciones: 'Funciones', dominio: 'Dominio', demo: 'Demo con plantilla',
  contenido: 'Contenido', frecuencia: 'Frecuencia', acciones: 'Acciones', pauta: 'Presupuesto en anuncios', impresos: 'Material',
};
const chips = (v) => (Array.isArray(v) ? v : [v]).filter(Boolean).map((x) => `<span class="chip">${esc(x)}</span>`).join('');
const field = (label, value, asChips = false) => (value && (!Array.isArray(value) || value.length))
  ? `<div class="a-f"><span>${esc(label)}</span>${asChips || Array.isArray(value) ? `<div class="chips">${chips(value)}</div>` : `<b>${esc(value)}</b>`}</div>` : '';
const card = (title, icon, body) => body.trim() ? `<section class="a-card"><h4><i>${icons[icon]}</i>${esc(title)}</h4><div class="a-card-body">${body}</div></section>` : '';

function answersHTML(l) {
  const d = l.details;
  if (!d) { // older submissions: fall back to the plain summary
    return `<div class="a-card"><div class="a-card-body">${(l.message || '').split('\n').filter(Boolean)
      .map((s) => { const t = s.replace(/^•\s*/, ''); const i = t.indexOf(':'); return field(t.slice(0, i), t.slice(i + 1).trim()); }).join('')}</div></div>`;
  }
  const b = d.business || {};
  let html = card('Plan', 'sparkles',
    field('Plan', l.service) + field('Servicios', (d.services || []).map((s) => SVC[s]?.[0] || s)) + field('Plantilla web', l.template));
  for (const s of d.services || []) {
    const ans = (d.details || {})[s] || {};
    html += card(SVC[s]?.[0] || s, SVC[s]?.[1] || 'layers', Object.entries(ans).map(([k, v]) => field(KEY_LABELS[k] || k, v)).join(''));
  }
  html += card('Negocio', 'building',
    field('Nombre', b.name) + field('Sector', b.sector) + field('Ciudad', b.city) + field('Redes / web', b.link) + field('Cliente ideal', b.audience));
  html += card('Estilo y referencias', 'brand', field('Estilo', d.style) + field('Colores / referencias', b.refs));
  html += card('Tiempos y presupuesto', 'file', field('Para cuándo', d.timing, true) + field('Presupuesto', d.budget, true));
  if (d.notes) html += card('Notas del cliente', 'mail', `<p class="a-note">${esc(d.notes)}</p>`);
  return html;
}

// ---------- Quote editor (auto-priced, editable, PDF + WhatsApp) ----------
function ensureQuote(l) {
  if (l.quote?.items) return l.quote;
  if (!l.details) return null;
  return buildQuote({ plan: l.details.plan, services: l.details.services, details: l.details.details, template: l.details.template, timing: l.details.timing });
}

function bindQuote(l) {
  const box = document.getElementById('aQuote');
  let q = ensureQuote(l);
  if (!q) { box.innerHTML = '<p class="muted">Esta solicitud no tiene datos suficientes para cotizar automáticamente.</p>'; return; }
  q = totals(q);
  const draw = () => {
    box.innerHTML = `
      <div class="aq-lines">${q.items.map((it, i) => `
        <div class="aq-line"><span><small>${esc(it.group)}</small>${esc(it.concept)}${it.monthly ? ' <em>/mes</em>' : ''}</span>
          <input type="number" min="0" step="10000" value="${it.price}" data-i="${i}" aria-label="Precio" />
          <button class="aq-del" data-del="${i}" title="Quitar">✕</button></div>`).join('')}
        <button class="aq-add" id="aqAdd">+ Agregar concepto</button>
      </div>
      <div class="aq-totals">
        <div><span>Subtotal</span><b>${cop(q.subtotal)}</b></div>
        <div><span>Descuento <input type="number" min="0" max="100" value="${Math.round(q.discountRate * 100)}" id="aqDisc" />%</span><b class="ok">- ${cop(q.discount)}</b></div>
        ${q.combo ? `<div><span>Gestión integral combo (+${Math.round(q.comboRate * 100)}%)</span><b>+ ${cop(q.combo)}</b></div>` : ''}
        ${q.rush ? `<div><span>Urgencia (+${Math.round(q.rushRate * 100)}%)</span><b>+ ${cop(q.rush)}</b></div>` : ''}
        <div class="aq-total"><span>Total</span><b>${cop(q.total)}</b></div>
        ${q.maintenance ? `<div><span>Mantenimiento (${Math.round(q.maintenanceRate * 100)}%)</span><b>${cop(q.maintenance)} /mes</b></div>` : ''}
        ${q.services ? `<div><span>Servicios mensuales</span><b>${cop(q.services)} /mes</b></div>` : ''}
        ${q.monthly ? `<div><span>Total mensual</span><b>${cop(q.monthly)} /mes</b></div>` : ''}
        <div><span>Anticipo</span><b>${cop(q.deposit)}</b></div>
      </div>
      <div class="aq-actions">
        <button class="btn btn-sm" id="aqPdf">${icons.file} Cotización PDF</button>
        <button class="btn btn-sm" id="aqPlan">${icons.list} Propuesta y plan PDF</button>
        <a class="btn btn-sm btn-ghost" id="aqWa" target="_blank" rel="noopener">${icons.whatsapp} Enviar por WhatsApp</a>
        <a class="btn btn-sm btn-ghost" id="aqMail">${icons.mail} Enviar por correo</a>
        <button class="btn btn-sm btn-ghost" id="aqSave">Guardar cambios</button>
        <button class="btn btn-sm btn-ghost" id="aqReset" title="Recalcular con la lista de precios">↻ Recalcular</button>
      </div>`;
    box.querySelector('#aqWa').href = waQuoteLink(l, q);
    box.querySelector('#aqMail').href = mailQuoteLink(l, q);
    box.querySelectorAll('input[data-i]').forEach((inp) => inp.addEventListener('change', () => { q.items[+inp.dataset.i].price = Math.max(0, Number(inp.value) || 0); q = totals(q); draw(); }));
    box.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => { q.items.splice(+b.dataset.del, 1); q = totals(q); draw(); }));
    box.querySelector('#aqDisc').addEventListener('change', (e) => { q.discountRate = Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100; q = totals(q); draw(); });
    box.querySelector('#aqAdd').addEventListener('click', () => {
      const concept = prompt('Concepto:'); if (!concept) return;
      const price = Number(prompt('Valor (COP):', '0')) || 0;
      q.items.push({ group: 'Adicionales', concept, price, monthly: false }); q = totals(q); draw();
    });
    box.querySelector('#aqReset').addEventListener('click', () => { l.quote = null; q = totals(ensureQuote(l)); draw(); toast('Recalculado con la lista de precios'); });
    box.querySelector('#aqSave').addEventListener('click', async () => { if (await update(l.id, { quote: q, quote_total: q.total }, ['cotizacion', `Cotización actualizada: ${cop(q.total)}`])) toast('Cotización guardada'); });
    box.querySelector('#aqPdf').addEventListener('click', async () => {
      const { downloadQuote } = await import('./pdf.js');
      downloadQuote({ ...l, quote: q }); logEvent(l.id, 'pdf', 'Descargó la cotización en PDF');
    });
    box.querySelector('#aqPlan').addEventListener('click', async () => {
      const { downloadProposal } = await import('./proposal.js');
      downloadProposal({ ...l, quote: q }); logEvent(l.id, 'pdf', 'Descargó la propuesta y plan de trabajo');
    });
    const sent = async (via) => {
      await update(l.id, { quote: q, quote_total: q.total, status: ['nuevo', 'contactado'].includes(l.status) ? 'cotizado' : l.status }, ['envio', `Cotización enviada por ${via}: ${cop(q.total)}`]);
      const [{ downloadQuote }, { downloadProposal }] = await Promise.all([import('./pdf.js'), import('./proposal.js')]);
      downloadQuote({ ...l, quote: q }); downloadProposal({ ...l, quote: q });
      toast(`PDFs descargados: adjúntalos en ${via}`);
    };
    box.querySelector('#aqWa').addEventListener('click', () => sent('WhatsApp'));
    box.querySelector('#aqMail').addEventListener('click', () => sent('correo'));
  };
  draw();
}

function waQuoteLink(l, q) {
  const phone = (l.phone || '').replace(/\D/g, '');
  const msg = `¡Hola ${(l.name || '').split(' ')[0]}! 👋 Te escribe tu asesor de KstaStudio_.\n\nYa tenemos lista tu cotización para *${l.business || 'tu negocio'}* (${l.service || 'plan'}):\n\n💜 *Total: ${cop(q.total)}*${q.monthly ? `\n🔁 Mensual: ${cop(q.monthly)}` : ''}\n✅ Anticipo para iniciar: ${cop(q.deposit)}\n\nTe adjunto el PDF con la cotización y la propuesta con el plan de trabajo, tus derechos y condiciones. ¿Te parece si lo revisamos juntos?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

function mailQuoteLink(l, q) {
  const subject = `Tu cotización de KstaStudio_ · ${l.business || l.name}`;
  const body = `Hola ${(l.name || '').split(' ')[0]},\n\nGracias por confiar en KstaStudio_. Te compartimos la cotización y la propuesta con el plan de trabajo para ${l.business || 'tu negocio'} (${l.service || ''}).\n\nTotal: ${cop(q.total)}${q.monthly ? `\nMensualidad: ${cop(q.monthly)}` : ''}\nAnticipo para iniciar: ${cop(q.deposit)}\n\nEn los archivos adjuntos encontrarás el detalle, el cronograma, tus derechos como consumidor y el tratamiento de tus datos.\n\nQuedamos atentos,\nJerónimo Castañeda Velásquez\nKstaStudio_`;
  return `mailto:${encodeURIComponent(l.email || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ---------- Detail ----------
function renderDetail() {
  const box = document.getElementById('detail');
  if (!box) return;
  const l = leads.find((x) => x.id === selectedId);
  box.closest('.a-body')?.classList.toggle('has-sel', !!l);
  document.getElementById('view')?.classList.toggle('lead-open', !!l);
  if (l) scrollTo({ top: 0, behavior: 'smooth' });
  if (!l) { box.innerHTML = `<div class="a-empty">${icons.inbox}<p>Selecciona una solicitud para ver el detalle.</p></div>`; return; }

  box.innerHTML = `
    <button class="a-back" id="back">← Volver a solicitudes</button>
    <div class="a-d-head">
      <span class="avatar lg">${esc((l.name || '?')[0].toUpperCase())}</span>
      <div><h2>${esc(l.name)}</h2><p class="muted">${esc(l.business || '')} · ${new Date(l.created_at).toLocaleString('es')}</p></div>
    </div>
    <div class="a-d-actions">
      <a class="btn" href="${waLink(l)}" target="_blank" rel="noopener" id="waHello">${icons.whatsapp} Escribir por WhatsApp</a>
      <a class="btn btn-ghost" href="mailto:${esc(l.email)}">${icons.mail} Email</a>
      <button class="btn btn-ghost" id="copy">${icons.file} Copiar resumen</button>
    </div>
    <div class="a-d-status">${STATUSES.map(([k, lab], i) => `<button class="${l.status === k ? 'on' : ''} ${STATUSES.findIndex(([s]) => s === l.status) > i && !['pausado', 'perdido'].includes(k) ? 'past' : ''}" data-st="${k}">${lab}</button>`).join('')}</div>
    <label class="a-d-status-m">Estado <select id="stSel">${STATUSES.map(([k, lab]) => `<option value="${k}" ${l.status === k ? 'selected' : ''}>${lab}</option>`).join('')}</select></label>
    <div class="a-d-grid">
      <div><span>WhatsApp</span><b>${esc(l.phone || '—')}</b></div>
      <div><span>Email</span><b>${esc(l.email)}</b></div>
      <div><span>Prioridad</span><select id="prio">${PRIORITIES.map(([k, lab]) => `<option value="${k}" ${(l.priority || 'media') === k ? 'selected' : ''}>${lab}</option>`).join('')}</select></div>
      <div><span>Próximo seguimiento</span><input type="date" id="fu" value="${esc(l.follow_up || '')}" /></div>
    </div>
    <div class="a-d-cols">
    <div class="a-d-col">
    <h3>Cotización</h3>
    <div class="a-quote" id="aQuote"></div>
    <h3>Notas internas</h3>
    <textarea id="notes" rows="4" placeholder="Ej: le envié la cotización el martes, quiere demo…">${esc(l.notes || '')}</textarea>
    <div class="a-d-foot"><button class="btn btn-sm" id="saveNotes">Guardar notas</button><button class="btn btn-sm btn-ghost danger" id="del">${icons.trash} Eliminar</button></div>
    </div>
    <div class="a-d-col">
    ${meetings.some((m) => m.lead_id === l.id) ? `<h3>Asesoría agendada</h3><div class="mtgs" id="leadMeetings">${meetings.filter((m) => m.lead_id === l.id).map(meetingHTML).join('')}</div>` : ''}
    <h3>Respuestas del cotizador</h3>
    <div class="a-cards">${answersHTML(l)}</div>
    ${l.template && l.details?.template && l.details.template !== 'custom' ? `<a class="a-d-tpl" href="/templates/${esc(l.details.template)}/index.html" target="_blank" rel="noopener">Ver plantilla elegida (${esc(l.template)}) ↗</a>` : ''}
    <h3>Historial</h3>
    <div class="timeline-list" id="events"><p class="muted small">Cargando…</p></div>
    </div>
    </div>`;

  const setStatus = async (st) => {
    const from = l.status;
    if (from === st) return;
    if (await update(l.id, { status: st }, ['estado', `${statusLabel(from)} → ${statusLabel(st)}`])) { toast(`Marcada como ${statusLabel(st)}`); renderList(); renderDetail(); }
  };
  box.querySelector('#stSel').addEventListener('change', (e) => setStatus(e.target.value));
  box.querySelectorAll('.a-d-status [data-st]').forEach((b) => b.addEventListener('click', async () => {
    const from = l.status, st = b.dataset.st;
    if (from === st) return;
    if (await update(l.id, { status: st }, ['estado', `${statusLabel(from)} → ${statusLabel(st)}`])) { toast(`Marcada como ${statusLabel(st)}`); renderList(); renderDetail(); }
  }));
  box.querySelector('#prio').addEventListener('change', async (e) => { if (await update(l.id, { priority: e.target.value }, ['prioridad', `Prioridad: ${e.target.value}`])) { toast('Prioridad actualizada'); renderList(); } });
  box.querySelector('#fu').addEventListener('change', async (e) => { const v = e.target.value || null; if (await update(l.id, { follow_up: v }, ['seguimiento', v ? `Seguimiento para el ${v}` : 'Seguimiento quitado'])) { toast('Seguimiento guardado'); renderList(); } });
  box.querySelector('#waHello').addEventListener('click', () => { if (l.status === 'nuevo') update(l.id, { status: 'contactado' }, ['estado', 'Nuevo → Contactado (WhatsApp)']).then(() => renderList()); else logEvent(l.id, 'contacto', 'Escribió por WhatsApp'); });
  box.querySelector('#back').addEventListener('click', () => { selectedId = null; renderList(); renderDetail(); });
  box.querySelector('#copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(`${l.name} · ${l.business || ''}\n${l.phone || ''} · ${l.email || ''}\n${l.service || ''}\n\n${l.message || ''}`);
    toast('Resumen copiado');
  });
  bindQuote(l);
  const lm = box.querySelector('#leadMeetings'); if (lm) bindMeetings(lm, renderDetail);
  box.querySelector('#saveNotes').addEventListener('click', async () => {
    if (await update(l.id, { notes: box.querySelector('#notes').value }, ['nota', 'Actualizó las notas internas'])) toast('Notas guardadas');
  });
  box.querySelector('#del').addEventListener('click', async () => {
    if (!confirm(`¿Eliminar la solicitud de ${l.name}? No se puede deshacer.`)) return;
    const { error } = await supabase.from('leads').delete().eq('id', l.id);
    if (error) return toast('No se pudo eliminar');
    leads = leads.filter((x) => x.id !== l.id); selectedId = null; renderAll(); toast('Solicitud eliminada');
  });
  loadEvents(l.id);
}

const EVENT_ICONS = { estado: 'layers', nota: 'file', cotizacion: 'target', envio: 'send', pdf: 'file', prioridad: 'bolt', seguimiento: 'calendar', contacto: 'chat' };
async function loadEvents(id) {
  const { data } = await supabase.from('lead_events').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(50);
  const box = document.getElementById('events');
  if (!box || selectedId !== id) return;
  const l = leads.find((x) => x.id === id);
  const items = [...(data || []), { type: 'creado', text: 'Llegó la solicitud desde el cotizador', created_at: l?.created_at, actor: 'cliente' }];
  box.innerHTML = items.map((e) => `<div class="ev"><span class="ev-i">${icons[EVENT_ICONS[e.type] || 'sparkles']}</span><div><b>${esc(e.text)}</b><small>${ago(e.created_at)} · ${esc(e.actor || '')}</small></div></div>`).join('');
}

boot();
