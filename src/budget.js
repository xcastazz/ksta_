import { CATS, CAT_ORDER } from './plans.js';
import { buildQuote, cop } from './pricing.js';

// =========================================================
//  PLANIFICADOR POR PRESUPUESTO
//  Prueba todas las combinaciones de planes (ninguno / básico / pro / completo
//  por categoría) y elige la que más valor da sin pasarse del presupuesto.
// =========================================================

/** Price of a combination: one-time total + first month (what the client pays to start). */
function priceCombo(pick) {
  const cats = Object.keys(pick);
  const tiers = cats.map((k) => CATS[k].tiers[pick[k]]);
  const services = [...new Set(tiers.flatMap((t) => t.services))];
  const details = Object.assign({}, ...tiers.map((t) => structuredClone(t.details)));
  const q = buildQuote({ plan: `cats-${cats.length}`, services, details, template: null, timing: '' });
  return { q, start: q.total + q.monthly, tiers };
}

function allCombos() {
  const out = [];
  const rec = (i, pick) => {
    if (i === CAT_ORDER.length) { if (Object.keys(pick).length) out.push({ ...pick }); return; }
    const k = CAT_ORDER[i];
    rec(i + 1, pick); // category not included
    CATS[k].tiers.forEach((_, t) => rec(i + 1, { ...pick, [k]: t }));
  };
  rec(0, {});
  return out.map((pick) => ({ pick, ...priceCombo(pick) }));
}

let COMBOS = null;
const combos = () => (COMBOS ||= allCombos());

/** Score: priorities weigh 3x, higher tiers add value, using the budget well adds a little. */
function score(c, prio, budget) {
  return Object.entries(c.pick).reduce((s, [k, t]) => s + (t + 1) * (prio.includes(k) ? 3 : 1), 0) + (c.start / budget) * 0.5;
}

export function recommend(budget, prio) {
  const all = combos();
  // Must include the client's top priorities when possible
  const fits = (c) => c.start <= budget && prio.every((k) => k in c.pick);
  let pool = all.filter(fits);
  if (!pool.length) pool = all.filter((c) => c.start <= budget && (!prio.length || prio.some((k) => k in c.pick)));
  if (!pool.length) pool = all.filter((c) => c.start <= budget);
  const best = pool.sort((a, b) => score(b, prio, budget) - score(a, prio, budget) || a.start - b.start)[0] || null;
  // Upsell: best option up to +40% that is clearly better
  const up = all.filter((c) => c.start > budget && c.start <= budget * 1.4 && (!best || score(c, prio, budget) > score(best, prio, budget) + 1))
    .sort((a, b) => a.start - b.start)[0] || null;
  const cheapest = all.reduce((m, c) => (c.start < m.start ? c : m), all[0]);
  return { best, up, cheapest };
}

