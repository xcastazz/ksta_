import { PROJECTS } from './projects.js';
import { icons } from './icons.js';

// Sticky scroll scene: live sites inside browser windows fly through 3D space as you scroll
export function initShowcase() {
  const section = document.getElementById('proyectos');
  const stage = document.getElementById('scStage');
  const info = document.getElementById('scInfo');
  const dotsEl = document.getElementById('scDots');
  const n = PROJECTS.length;
  section.style.setProperty('--n', n);

  stage.innerHTML = PROJECTS.map((p, i) => `
    <a class="sc-device vision" href="${p.url}" target="_blank" rel="noopener" data-i="${i}" aria-label="Visitar ${p.name}">
      <div class="sc-bar"><i></i><i></i><i></i><span>${p.domain}</span><b>Visitar ↗</b></div>
      <div class="sc-screen"><iframe src="${p.url}" loading="lazy" tabindex="-1" title="${p.name}"></iframe><div class="sc-glare"></div></div>
    </a>`).join('') + '<div class="sc-floor"></div>';

  info.innerHTML = PROJECTS.map((p, i) => `
    <div class="sc-item" data-i="${i}">
      <span class="pill">${p.type}</span>
      <h3>${p.name}</h3>
      <p class="muted">${p.desc}</p>
      <div class="sc-tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      <a class="btn btn-ghost btn-sm" href="${p.url}" target="_blank" rel="noopener">Ver la página</a>
    </div>`).join('');
  dotsEl.innerHTML = PROJECTS.map(() => '<span></span>').join('');

  const devices = [...stage.querySelectorAll('.sc-device')];
  const items = [...info.querySelectorAll('.sc-item')];
  const dots = [...dotsEl.children];
  const mobile = matchMedia('(max-width: 960px)').matches;
  let ticking = false;

  function update() {
    ticking = false;
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));     // 0..1 through the section
    const f = p * n - 0.5;                                   // focus index (float)
    const active = Math.min(n - 1, Math.max(0, Math.round(f)));

    devices.forEach((d, i) => {
      let o = i - f;                                         // <0 passed, 0 focused, >0 upcoming
      if (i === 0) o = Math.min(0, o); if (i === n - 1) o = Math.max(0, o); // first starts open, last stays
      // "Portal": the next project opens as a circle of light from the center and
      // settles in; the current one rushes toward you, blurs and dissolves (you pass through it)
      const ease = (t) => t * t * (3 - 2 * t);
      const inT = ease(1 - Math.max(0, Math.min(1, o)));    // 0 → closed, 1 → fully open
      const outT = ease(Math.max(0, Math.min(1, -o)));       // 0 → here, 1 → gone past you
      d.style.clipPath = o > 0 ? `circle(${inT * 75}% at 50% 50%)` : 'none';
      d.style.transform = `scale(${o > 0 ? 1.12 - inT * 0.12 : 1 + outT * 0.35})`;
      d.style.filter = outT > 0.01 ? `blur(${outT * 14}px)` : 'none';
      d.style.opacity = String(o > 0 ? Math.min(1, inT * 1.6) : 1 - outT);
      d.style.pointerEvents = Math.abs(o) < 0.5 ? 'auto' : 'none';
      d.style.zIndex = String(o > 0 ? 20 + i : 10 + i);
      d.style.setProperty('--ring', String(o > 0 ? inT : 1));
      d.classList.toggle('opening', o > 0.02 && o < 0.98);
      d.style.setProperty('--glare', '50%');
      d.classList.toggle('is-active', i === active);
    });
    items.forEach((it, i) => it.classList.toggle('on', i === active));
    dots.forEach((dt, i) => dt.classList.toggle('on', i === active));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}
