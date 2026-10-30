import { CATS, CAT_ORDER } from './plans.js';
import { cop } from './pricing.js';
import { icons } from './icons.js';
import { recommend } from './budget.js';

// ---------- UI ----------
export function initPlanner(root, onQuote) {
  const MIN = 200000, MAX = 6000000, STEP = 50000;
  let budget = 1500000;
  let prio = ['web'];

  root.innerHTML = `
    <div class="pl-grid">
      <div class="pl-controls vision">
        <p class="eyebrow">// tu presupuesto</p>
        <label class="pl-label" for="plRange">¿Cuánto quieres invertir para empezar?</label>
        <div class="pl-amount"><span>$</span><input id="plInput" inputmode="numeric" value="${budget.toLocaleString('es-CO')}" aria-label="Presupuesto en pesos" /><small>COP</small></div>
        <input type="range" id="plRange" min="${MIN}" max="${MAX}" step="${STEP}" value="${budget}" />
        <div class="pl-ticks"><span>${cop(MIN)}</span><span>${cop(MAX)}+</span></div>
        <div class="pl-quick">${[500000, 1000000, 2000000, 3500000].map((v) => `<button type="button" data-v="${v}">${cop(v)}</button>`).join('')}</div>
        <p class="pl-label">¿Qué es lo más importante para ti?</p>
        <div class="pl-prio">${CAT_ORDER.map((k) => `<button type="button" class="${prio.includes(k) ? 'on' : ''}" data-k="${k}"><i>${icons[CATS[k].icon]}</i>${CATS[k].label}</button>`).join('')}</div>
        <small class="muted pl-note">Calculamos con lo que pagas para arrancar: el valor del proyecto más el primer mes de servicios.</small>
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
    const { best, up, cheapest } = recommend(budget, prio);
    const key = best ? JSON.stringify(best.pick) : 'none';
    const changed = key !== lastKey; lastKey = key;
    if (!best) {
      out.innerHTML = `<div class="pl-card vision pl-empty"><b>Con ${cop(budget)} aún no alcanzamos un plan completo.</b>
        <p class="muted">El plan más accesible arranca desde <b>${cop(cheapest.start)}</b> (${cheapest.tiers.map((t) => t.name).join(' + ')}).</p>
        <button class="btn btn-ghost" data-set="${cheapest.start}">Usar ${cop(cheapest.start)}</button></div>`;
      out.querySelector('[data-set]').addEventListener('click', (e) => setBudget(+e.currentTarget.dataset.set));
      return;
    }
    const left = budget - best.start;
    const used = Math.min(100, (best.start / budget) * 100);
    const n = Object.keys(best.pick).length;
    out.innerHTML = `
      <div class="pl-card vision ${changed ? 'pop-in' : ''}">
        <div class="pl-head"><span class="pill">Tu plan recomendado</span>${n > 1 ? `<span class="pill premium">Combo ${n === 3 ? 'Total' : 'Dúo'} Premium</span>` : ''}</div>
        <div class="pl-tiers">${Object.entries(best.pick).map(([k, t], i) => { const tier = CATS[k].tiers[t]; return `
          <div class="pl-tier" style="--i:${i}"><span class="pl-ic">${icons[CATS[k].icon]}</span>
            <div><small>${CATS[k].label}</small><b>${tier.name}</b><ul>${tier.items.slice(0, 3).map((x) => `<li>${icons.check}${x}</li>`).join('')}</ul></div></div>`; }).join('')}
        </div>
        <div class="pl-meter"><span class="pl-fill" style="width:${used}%"></span></div>
        <div class="pl-sum">
          <div><small>Para arrancar</small><b class="pl-total">${cop(shown)}</b></div>
          <div><small>${left >= 0 ? 'Te sobran' : 'Te faltan'}</small><b class="${left >= 0 ? 'ok' : ''}">${cop(Math.abs(left))}</b></div>
          ${best.q.monthly ? `<div><small>Luego, cada mes</small><b>${cop(best.q.monthly)}</b></div>` : ''}
        </div>
        <button class="btn btn-lg pl-go" data-go>Cotizar este plan →</button>
      </div>
      ${up ? `<div class="pl-up vision ${changed ? 'pop-in' : ''}"><span class="pl-ic">${icons.bolt}</span><p>Con <b>${cop(up.start)}</b> tendrías <b>${up.tiers.map((t) => t.name).join(' + ')}</b>.</p><button class="btn btn-sm btn-ghost" data-set="${up.start}">Ver</button></div>` : ''}`;
    countTo(out.querySelector('.pl-total'), best.start);
    out.querySelector('[data-go]').addEventListener('click', () => {
      const tiers = {}; Object.entries(best.pick).forEach(([k, t]) => { tiers[k] = CATS[k].tiers[t].id; });
      onQuote({ cats: CAT_ORDER.filter((k) => k in best.pick), tiers });
    });
    out.querySelector('[data-set]')?.addEventListener('click', (e) => setBudget(+e.currentTarget.dataset.set));
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
