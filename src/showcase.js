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
      const o = i - f;                                       // <0 passed, 0 focused, >0 upcoming
      // Minimal "stack" reveal: the next window wipes up over the current one,
      // the previous one steps back a little and dims
      const up = Math.max(0, Math.min(1, o));                // 1 → hidden below, 0 → fully shown
      const back = Math.max(0, Math.min(1, -o));             // how far it has been covered
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const cover = 1 - ease(1 - up);
      d.style.clipPath = `inset(${cover * 100}% 0 0 0 round 22px)`;
      d.style.transform = `translate3d(0, ${cover * (mobile ? 30 : 60)}px, 0) scale(${1 - back * 0.06})`;
      d.style.opacity = String(o < -1 ? 0 : 1 - back * 0.55);
      d.style.pointerEvents = Math.abs(o) < 0.5 ? 'auto' : 'none';
      d.style.zIndex = String(10 + i);
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
