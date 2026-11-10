import { PROJECTS } from './projects.js';

// Cuadrícula de proyectos: cada página dentro de su marco de navegador, sin transiciones
export function initShowcase() {
  const grid = document.getElementById('scGrid');
  if (!grid) return;
  const ext = (u) => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '';
  grid.innerHTML = PROJECTS.map((p) => `
    <article class="pj">
      <a class="sc-device vision" href="${p.url}"${ext(p.url)} aria-label="Ver ${p.name}">
        <div class="sc-bar"><i></i><i></i><i></i><span>${p.domain}</span></div>
        <div class="sc-screen"><img src="${p.shot}" alt="Página de ${p.name}" loading="lazy" width="1280" height="800" /></div>
      </a>
      <div class="pj-info">
        <div class="pj-top"><h3>${p.name}</h3><span class="pill">${p.type}</span></div>
        <p class="muted">${p.desc}</p>
        <div class="pj-foot">
          <div class="sc-tags">${p.tags.map((t) => `<span>${t}</span>`).join('')}</div>
          <div class="pj-links">${(p.links || [['Ver la página', p.url]]).map(([l, u]) => `<a class="btn btn-ghost btn-sm" href="${u}"${ext(u)}>${l} ↗</a>`).join('')}</div>
        </div>
      </div>
    </article>`).join('');
}
