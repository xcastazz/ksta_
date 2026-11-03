import { CATS, CAT_ORDER } from './plans.js';
import { cop } from './pricing.js';
import { icons } from './icons.js';
import { recommend } from './budget.js';
import { supabase } from './supabase.js';
import { bookingHTML, setupBooking } from './booking.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const SVC_NAMES = { branding: 'Diseño y marca', web: 'Desarrollo web', audiovisual: 'Fotografía y video', marketing: 'Marketing digital', print: 'Publicidad física' };

// ---------- UI ----------
export function initPlanner(root, onQuote) {
  const MIN = 200000, MAX = 6000000, STEP = 50000;
  let budget = 1500000;
  let prio = ['web'];

  root.innerHTML = `
    <div class="pl-grid">
      <div class="pl-controls vision">
        <p class="eyebrow">tu dinero</p>
        <label class="pl-label" for="plRange">¿Cuánta plata tienes para empezar?</label>
        <div class="pl-amount"><span>$</span><input id="plInput" inputmode="numeric" value="${budget.toLocaleString('es-CO')}" aria-label="Presupuesto en pesos" /><small>COP</small></div>
        <input type="range" id="plRange" min="${MIN}" max="${MAX}" step="${STEP}" value="${budget}" />
        <div class="pl-ticks"><span>${cop(MIN)}</span><span>${cop(MAX)}+</span></div>
        <div class="pl-quick">${[500000, 1000000, 2000000, 3500000].map((v) => `<button type="button" data-v="${v}">${cop(v)}</button>`).join('')}</div>
        <p class="pl-label">¿Qué es lo que más te interesa?</p>
        <div class="pl-prio">${CAT_ORDER.map((k) => `<button type="button" class="${prio.includes(k) ? 'on' : ''}" data-k="${k}"><i>${icons[CATS[k].icon]}</i>${CATS[k].label}</button>`).join('')}</div>
        <small class="muted pl-note">Contamos lo que pagarías para empezar: el trabajo completo más el primer mes.</small>
      </div>
      <div class="pl-result" id="plResult" aria-live="polite"></div>
    </div>`;

  const input = root.querySelector('#plInput'), range = root.querySelector('#plRange'), out = root.querySelector('#plResult');
  const paint = () => range.style.setProperty('--p', `${((budget - MIN) / (MAX - MIN)) * 100}%`);
  let shown = 0, raf;
  const countTo = (el, to) => {
    cancelAnimationFrame(raf);
    const from = shown, t0 = performance.now();
    const tick = (t) => { const k = Math.min(1, (t - t0) / 700); shown = from + (to - from) * (1 - Math.pow(1 - k, 3)); el.textContent = cop(shown); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
  };

  let lastKey = '';
  function render() {
    paint();
    if (out.querySelector('#plOrder:not([hidden])')) {
      // Order panel open: changing the budget restarts the suggestion
      if (out.querySelector('.pl-done')) return; // already submitted: keep the confirmation
    }
    const { best, up, cheapest } = recommend(budget, prio);
    const key = best ? JSON.stringify(best.pick) : 'none';
    const changed = key !== lastKey; lastKey = key;
    if (!best) {
      out.innerHTML = `<div class="pl-card vision pl-empty"><b>Con ${cop(budget)} todavía no nos alcanza para algo completo.</b>
        <p class="muted">Lo más económico que tenemos empieza en <b>${cop(cheapest.start)}</b> (${cheapest.tiers.map((t) => t.name).join(' + ')}).</p>
        <button class="btn btn-ghost" data-set="${cheapest.start}">Usar ${cop(cheapest.start)}</button></div>`;
      out.querySelector('[data-set]').addEventListener('click', (e) => setBudget(+e.currentTarget.dataset.set));
      return;
    }
    const left = budget - best.start;
    const used = Math.min(100, (best.start / budget) * 100);
    const n = Object.keys(best.pick).length;
    out.innerHTML = `
      <div class="pl-card vision ${changed ? 'pop-in' : ''}">
        <div class="pl-head"><span class="pill">Esto te recomendamos</span>${n > 1 ? `<span class="pill premium">${n} cosas juntas</span>` : ''}</div>
        <div class="pl-tiers">${Object.entries(best.pick).map(([k, t], i) => { const tier = CATS[k].tiers[t]; return `
          <div class="pl-tier" style="--i:${i}"><span class="pl-ic">${icons[CATS[k].icon]}</span>
            <div><small>${CATS[k].label}</small><b>${tier.name}</b><ul>${tier.items.slice(0, 3).map((x) => `<li>${icons.check}${x}</li>`).join('')}</ul></div></div>`; }).join('')}
        </div>
        <div class="pl-meter"><span class="pl-fill" style="width:${used}%"></span></div>
        <div class="pl-sum">
          <div><small>Pagas para empezar</small><b class="pl-total">${cop(shown)}</b></div>
          <div><small>${left >= 0 ? 'Te sobra' : 'Te falta'}</small><b class="${left >= 0 ? 'ok' : ''}">${cop(Math.abs(left))}</b></div>
          ${best.q.monthly ? `<div><small>Después, cada mes</small><b>${cop(best.q.monthly)}</b></div>` : ''}
        </div>
        <div class="pl-ctas"><button class="btn btn-lg pl-go" data-want>¡Quiero esto!</button><button class="pl-link" data-go>Prefiero cambiar algunas cosas</button></div>
        <div class="pl-order" id="plOrder" hidden></div>
      </div>
      ${up ? `<div class="pl-up vision ${changed ? 'pop-in' : ''}"><span class="pl-ic">${icons.bolt}</span><p>Con <b>${cop(up.start)}</b> podrías tener <b>${up.tiers.map((t) => t.name).join(' + ')}</b>.</p><button class="btn btn-sm btn-ghost" data-set="${up.start}">Ver</button></div>` : ''}`;
    countTo(out.querySelector('.pl-total'), best.start);
    out.querySelector('[data-go]').addEventListener('click', () => {
      const tiers = {}; Object.entries(best.pick).forEach(([k, t]) => { tiers[k] = CATS[k].tiers[t].id; });
      onQuote({ cats: CAT_ORDER.filter((k) => k in best.pick), tiers });
    });
    out.querySelector('[data-set]')?.addEventListener('click', (e) => setBudget(+e.currentTarget.dataset.set));
    out.querySelector('[data-want]').addEventListener('click', () => openOrder(best));
  }

  // ---------- Request the suggested plan directly (no full wizard) ----------
  function openOrder(best) {
    const box = out.querySelector('#plOrder');
    const q = best.q;
    const tiers = Object.entries(best.pick).map(([k, t]) => [k, CATS[k].tiers[t]]);
    box.hidden = false;
    out.querySelector('[data-want]').hidden = true;
    box.innerHTML = `
      <div class="pl-detail">
        <h4>Esto es todo lo que te hacemos</h4>
        ${tiers.map(([k, t]) => `<div class="pl-dt"><b>${icons[CATS[k].icon]}${t.name}</b><ul>${t.items.map((x) => `<li>${icons.check}${esc(x)}</li>`).join('')}</ul></div>`).join('')}
        <div class="pl-bill">
          <div><span>Precio del trabajo</span><b>${cop(q.subtotal)}</b></div>
          ${q.combo ? `<div><span>Coordinación de todo (+${Math.round(q.comboRate * 100)}%)</span><b>+ ${cop(q.combo)}</b></div>` : ''}
          <div class="tot"><span>Total a pagar</span><b>${cop(q.total)}</b></div>
          ${q.monthly ? `<div><span>Cada mes (para mantener todo funcionando${q.services ? ' y tus redes' : ''})</span><b>${cop(q.monthly)} /mes</b></div>` : ''}
          <div><span>Para empezar pagas la mitad</span><b>${cop(q.deposit)}</b></div>
        </div>
      </div>
      <form class="pl-form" novalidate>
        <h4>¿A quién le escribimos?</h4>
        <div class="pl-fields">
          <label>Tu nombre<input name="name" required maxlength="100" autocomplete="name" /></label>
          <label>WhatsApp<input name="phone" required maxlength="30" inputmode="tel" autocomplete="tel" placeholder="+57 300 000 0000" /></label>
          <label>Correo<input name="email" type="email" required maxlength="150" autocomplete="email" /></label>
          <label>¿Cómo se llama tu negocio?<input name="business" maxlength="120" placeholder="Opcional" /></label>
        </div>
        <p class="pl-legal muted">Usamos tus datos solo para escribirte sobre tu pedido. No se los damos a nadie (Ley 1581 de 2012).</p>
        <button class="btn btn-lg" type="submit">${icons.send} Enviar mi pedido</button>
        <p class="pl-err" role="alert"></p>
      </form>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const form = box.querySelector('form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(form));
      const err = form.querySelector('.pl-err');
      if (!fd.name?.trim() || (fd.phone || '').replace(/\D/g, '').length < 7 || !/^\S+@\S+\.\S+$/.test(fd.email || '')) { err.textContent = 'Nos falta tu nombre, tu WhatsApp o tu correo.'; return; }
      const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Enviando…'; err.textContent = '';
      const cats = CAT_ORDER.filter((k) => k in best.pick);
      const tierIds = Object.fromEntries(tiers.map(([k, t]) => [k, t.id]));
      const services = ['branding', 'web', 'audiovisual', 'marketing', 'print'].filter((s) => tiers.some(([, t]) => t.services.includes(s)));
      const details = Object.assign({}, ...tiers.map(([, t]) => structuredClone(t.details)));
      const planName = tiers.map(([, t]) => t.name).join(' + ');
      const lead = {
        id: crypto.randomUUID(), created_at: new Date().toISOString(),
        name: fd.name.trim(), phone: fd.phone.trim(), email: fd.email.trim(), business: fd.business?.trim() || null,
        service: planName, template: null,
        message: [`• Origen: Planificador por presupuesto (${cop(budget)})`, `• Plan: ${planName}`, `• Servicios: ${services.map((s) => SVC_NAMES[s]).join(', ')}`, `• Total: ${cop(q.total)}${q.monthly ? ` + ${cop(q.monthly)}/mes` : ''}`].join('\n'),
        details: { plan: `cats-${cats.length}`, cats, tiers: tierIds, services, details, source: 'presupuesto', budget, priorities: prio, business: { name: fd.business?.trim() || '' } },
        quote: q, quote_total: q.total,
      };
      const { error } = await supabase.from('leads').insert(lead);
      if (error) { console.error(error); err.textContent = 'Algo falló al enviar. Inténtalo otra vez, por favor.'; btn.disabled = false; btn.innerHTML = `${icons.send} Enviar mi pedido`; return; }
      box.innerHTML = `
        <div class="pl-done">
          <span class="pl-done-badge">${icons.check}</span>
          <h4>¡Listo, ${esc(lead.name.split(' ')[0])}! Tu plan ${esc(planName)} ya está pedido.</h4>
          <p class="muted">Muy pronto te escribimos a tu WhatsApp <b>${esc(lead.phone)}</b> y a <b>${esc(lead.email)}</b> con todos los detalles.</p>
        </div>
        <div id="plBooking">${bookingHTML()}</div>`;
      setupBooking(box.querySelector('#plBooking .booking'), lead, (m) => { const p = box.querySelector('.pl-done p'); if (p) p.textContent = m; });
      out.querySelector('.pl-ctas')?.remove();
      dispatchEvent(new Event('scene:kick'));
    });
  }

  const setBudget = (v) => {
    budget = Math.max(MIN, Math.min(20000000, Math.round(v / STEP) * STEP || MIN));
    range.value = Math.min(MAX, budget); input.value = budget.toLocaleString('es-CO');
    render();
  };
  range.addEventListener('input', () => { budget = +range.value; input.value = budget.toLocaleString('es-CO'); render(); });
  input.addEventListener('input', () => { const v = Number(input.value.replace(/\D/g, '')) || 0; input.value = v ? v.toLocaleString('es-CO') : ''; });
  input.addEventListener('change', () => setBudget(Number(input.value.replace(/\D/g, ''))));
  root.querySelectorAll('[data-v]').forEach((b) => b.addEventListener('click', () => setBudget(+b.dataset.v)));
  root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k;
    prio = prio.includes(k) ? prio.filter((x) => x !== k) : [...prio, k];
    b.classList.toggle('on');
    render();
  }));
  render();
}
