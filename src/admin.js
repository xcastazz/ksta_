import { supabase } from './supabase.js';
import { icons } from './icons.js';

const app = document.getElementById('app');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUSES = [
  ['nuevo', 'Nuevo'], ['contactado', 'Contactado'], ['cotizado', 'Cotizado'], ['cerrado', 'Cerrado'], ['perdido', 'Perdido'],
];
const statusLabel = (s) => (STATUSES.find(([k]) => k === s) || [, s])[1];

let leads = [];
let filter = 'todos';
let query = '';
let selectedId = null;
let unread = 0;

// ---------- Auth ----------
async function boot() {
  if (!supabase) { app.innerHTML = '<p class="admin-msg">Supabase no está configurado.</p>'; return; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return renderLogin();
  const { data: ok } = await supabase.rpc('is_admin');
  if (!ok) return renderLogin(`La cuenta ${esc(session.user.email)} no tiene acceso al panel.`, true);
  renderShell(session.user);
  await loadLeads();
  subscribe();
}

supabase?.auth.onAuthStateChange((event) => { if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') boot(); });

function renderLogin(error = '', signedIn = false) {
  app.innerHTML = `
    <div class="login-wrap">
      <form class="login vision" id="loginForm">
        <a href="/" class="logo">Ksta<span class="cursor">_</span></a>
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
function renderShell(user) {
  app.innerHTML = `
    <aside class="a-rail vision">
      <a href="/" class="a-rail-logo" title="Ver sitio">K_</a>
      <button class="active" title="Solicitudes">${icons.inbox}</button>
      <button id="notifBtn" title="Activar notificaciones">${icons.bell}</button>
      <button id="logout" title="Cerrar sesión">${icons.logout}</button>
    </aside>
    <div class="a-main">
      <header class="a-top vision">
        <div class="a-user"><span class="avatar">${esc(user.email[0].toUpperCase())}</span><span>Hola, <b>${esc(user.email.split('@')[0])}</b></span></div>
        <div class="a-live" id="live"><span class="dot"></span><span id="liveText">Conectando…</span></div>
        <button class="a-bell" id="bell" title="Notificaciones">${icons.bell}<span class="badge" id="badge" hidden>0</span></button>
      </header>

      <section class="a-window vision">
        <div class="a-head">
          <div><h1>Solicitudes</h1><p class="muted">Cotizaciones que llegan desde el cotizador guiado, en tiempo real.</p></div>
          <div class="a-search"><input id="search" placeholder="Buscar por nombre, negocio, teléfono…" /></div>
        </div>
        <div class="a-stats" id="stats"></div>
        <div class="a-seg" id="seg"></div>
        <div class="a-body">
          <div class="a-list" id="list"></div>
          <div class="a-detail vision" id="detail"><div class="a-empty">${icons.inbox}<p>Selecciona una solicitud para ver el detalle.</p></div></div>
        </div>
      </section>
    </div>
    <div class="a-toasts" id="toasts"></div>`;

  document.getElementById('logout').addEventListener('click', () => supabase.auth.signOut());
  document.getElementById('search').addEventListener('input', (e) => { query = e.target.value.toLowerCase(); renderList(); });
  const askNotif = async () => {
    if (!('Notification' in window)) return toast('Tu navegador no soporta notificaciones');
    const p = await Notification.requestPermission();
    toast(p === 'granted' ? 'Notificaciones activadas' : 'Notificaciones bloqueadas en el navegador');
    updateNotifBtn();
  };
  document.getElementById('notifBtn').addEventListener('click', askNotif);
  document.getElementById('bell').addEventListener('click', () => { unread = 0; updateBadge(); filter = 'nuevo'; renderAll(); });
  updateNotifBtn();
}

function updateNotifBtn() {
  const b = document.getElementById('notifBtn');
  if (b && 'Notification' in window) b.classList.toggle('on', Notification.permission === 'granted');
}

// ---------- Data ----------
async function loadLeads() {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) { toast('Error cargando solicitudes'); console.error(error); return; }
  leads = data;
  renderAll();
}

function subscribe() {
  supabase.removeAllChannels(); // boot() can run twice (initial load + SIGNED_IN)
  supabase.channel('leads-admin')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, ({ new: lead }) => {
      leads.unshift(lead);
      unread++; updateBadge();
      renderAll(lead.id);
      notify(lead);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, ({ new: lead }) => {
      const i = leads.findIndex((l) => l.id === lead.id);
      if (i >= 0) leads[i] = lead;
      renderAll();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'leads' }, ({ old }) => {
      leads = leads.filter((l) => l.id !== old.id);
      if (selectedId === old.id) selectedId = null;
      renderAll();
    })
    .subscribe((status) => {
      const live = document.getElementById('live');
      const ok = status === 'SUBSCRIBED';
      live?.classList.toggle('on', ok);
      const t = document.getElementById('liveText');
      if (t) t.textContent = ok ? 'En vivo' : 'Reconectando…';
    });
}

async function update(id, patch) {
  const { error } = await supabase.from('leads').update(patch).eq('id', id);
  if (error) { toast('No se pudo guardar'); console.error(error); return false; }
  Object.assign(leads.find((l) => l.id === id), patch);
  return true;
}

// ---------- Notifications ----------
function notify(lead) {
  toast(`Nueva solicitud: ${lead.name} · ${lead.service || ''}`, true);
  chime();
  document.title = `(${unread}) Panel · Ksta_`;
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification('Nueva cotización en Ksta_', { body: `${lead.name} — ${lead.business || ''}\n${lead.service || ''}`, icon: '/favicon.svg', tag: lead.id });
    n.onclick = () => { focus(); selectedId = lead.id; renderAll(); };
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
  if (!unread) document.title = 'Panel · Ksta_';
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

// ---------- Rendering ----------
function renderAll(flashId) {
  renderStats(); renderSeg(); renderList(flashId); renderDetail();
}

function renderStats() {
  const count = (s) => leads.filter((l) => l.status === s).length;
  const today = leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const closed = count('cerrado');
  const rate = leads.length ? Math.round((closed / leads.length) * 100) : 0;
  document.getElementById('stats').innerHTML = [
    ['Total', leads.length, `${today} hoy`, 'inbox'],
    ['Nuevas', count('nuevo'), 'Sin contactar', 'bell'],
    ['En proceso', count('contactado') + count('cotizado'), 'Contactadas o cotizadas', 'file'],
    ['Cierre', `${rate}%`, `${closed} ventas cerradas`, 'check'],
  ].map(([k, v, s, ic]) => `<div class="a-stat vision"><div class="a-stat-top"><span class="a-stat-icon">${icons[ic]}</span>${k}</div><b>${v}</b><small>${s}</small></div>`).join('');
}

function renderSeg() {
  const opts = [['todos', 'Todas'], ...STATUSES];
  document.getElementById('seg').innerHTML = opts.map(([k, l]) => {
    const n = k === 'todos' ? leads.length : leads.filter((x) => x.status === k).length;
    return `<button class="${filter === k ? 'on' : ''}" data-f="${k}">${l} <span>${n}</span></button>`;
  }).join('');
  document.querySelectorAll('#seg button').forEach((b) => b.addEventListener('click', () => { filter = b.dataset.f; renderAll(); }));
}

function visible() {
  return leads.filter((l) => (filter === 'todos' || l.status === filter) &&
    (!query || [l.name, l.business, l.phone, l.email, l.service].join(' ').toLowerCase().includes(query)));
}

const ago = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(d).toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

function renderList(flashId) {
  const list = document.getElementById('list');
  const rows = visible();
  list.innerHTML = rows.length ? rows.map((l) => `
    <button class="a-row ${l.id === selectedId ? 'sel' : ''} ${l.id === flashId ? 'flash' : ''}" data-id="${l.id}">
      <span class="avatar">${esc((l.name || '?')[0].toUpperCase())}</span>
      <span class="a-row-main"><b>${esc(l.name)}</b><small>${esc(l.business || '—')} · ${esc(l.service || '')}</small></span>
      <span class="a-row-side"><span class="st st-${esc(l.status)}">${esc(statusLabel(l.status))}</span><small>${ago(l.created_at)}</small></span>
    </button>`).join('') : `<div class="a-empty small">${icons.inbox}<p>No hay solicitudes aquí todavía.</p></div>`;
  list.querySelectorAll('.a-row').forEach((r) => r.addEventListener('click', () => { selectedId = r.dataset.id; renderList(); renderDetail(); }));
}

function waLink(lead) {
  const phone = (lead.phone || '').replace(/\D/g, '');
  const msg = `¡Hola ${lead.name.split(' ')[0]}! 👋 Te escribe tu asesor de Ksta_. Recibimos tu solicitud del ${lead.service || 'plan'} para ${lead.business || 'tu negocio'} y ya estamos preparando tu cotización.`;
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
    field('Paquete', l.service) + field('Servicios', (d.services || []).map((s) => SVC[s]?.[0] || s)) + field('Plantilla web', l.template));
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

function renderDetail() {
  const box = document.getElementById('detail');
  const l = leads.find((x) => x.id === selectedId);
  if (!l) { box.innerHTML = `<div class="a-empty">${icons.inbox}<p>Selecciona una solicitud para ver el detalle.</p></div>`; return; }

  box.innerHTML = `
    <div class="a-d-head">
      <span class="avatar lg">${esc((l.name || '?')[0].toUpperCase())}</span>
      <div><h2>${esc(l.name)}</h2><p class="muted">${esc(l.business || '')} · ${new Date(l.created_at).toLocaleString('es')}</p></div>
    </div>
    <div class="a-d-actions">
      <a class="btn" href="${waLink(l)}" target="_blank" rel="noopener">${icons.whatsapp} Escribir por WhatsApp</a>
      <a class="btn btn-ghost" href="mailto:${esc(l.email)}">${icons.mail} Email</a>
    </div>
    <div class="a-d-status">${STATUSES.map(([k, lab]) => `<button class="${l.status === k ? 'on' : ''}" data-st="${k}">${lab}</button>`).join('')}</div>
    <div class="a-d-grid">
      <div><span>WhatsApp</span><b>${esc(l.phone || '—')}</b></div>
      <div><span>Email</span><b>${esc(l.email)}</b></div>
      <div><span>Plan</span><b>${esc(l.service || '—')}</b></div>
      <div><span>Plantilla</span><b>${esc(l.template || '—')}</b></div>
    </div>
    <h3>Respuestas del cotizador</h3>
    <div class="a-cards">${answersHTML(l)}</div>
    ${l.template && l.details?.template && l.details.template !== 'custom' ? `<a class="a-d-tpl" href="/templates/${esc(l.details.template)}/index.html" target="_blank" rel="noopener">Ver plantilla elegida (${esc(l.template)}) ↗</a>` : ''}
    <h3>Notas internas</h3>
    <textarea id="notes" rows="4" placeholder="Ej: le envié la cotización el martes, quiere demo…">${esc(l.notes || '')}</textarea>
    <div class="a-d-foot"><button class="btn btn-sm" id="saveNotes">Guardar notas</button><button class="btn btn-sm btn-ghost danger" id="del">${icons.trash} Eliminar</button></div>`;

  box.querySelectorAll('[data-st]').forEach((b) => b.addEventListener('click', async () => {
    if (await update(l.id, { status: b.dataset.st })) { toast(`Marcada como ${statusLabel(b.dataset.st)}`); renderAll(); }
  }));
  box.querySelector('#saveNotes').addEventListener('click', async () => {
    if (await update(l.id, { notes: box.querySelector('#notes').value })) toast('Notas guardadas');
  });
  box.querySelector('#del').addEventListener('click', async () => {
    if (!confirm(`¿Eliminar la solicitud de ${l.name}? No se puede deshacer.`)) return;
    const { error } = await supabase.from('leads').delete().eq('id', l.id);
    if (error) return toast('No se pudo eliminar');
    leads = leads.filter((x) => x.id !== l.id); selectedId = null; renderAll(); toast('Solicitud eliminada');
  });
}

boot();
