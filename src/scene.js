import * as THREE from 'three';

// Minimal 3D background: an undulating field of fine dots + a few hairline rings.
// Each section (and each quote step) tweaks wave, color and camera.
const POSES = {
  inicio:     { amp: 0.55, freq: 0.9, speed: 0.5, color: 0xa855f7, camY: 2.2, tilt: 0.0,  ring: 1 },
  proyectos:  { amp: 0.35, freq: 0.6, speed: 0.4, color: 0xc084fc, camY: 3.4, tilt: -0.15, ring: 0 },
  manifiesto: { amp: 0.25, freq: 0.5, speed: 0.3, color: 0xe879f9, camY: 3.2, tilt: 0.25, ring: 0 },
  servicios:  { amp: 0.4,  freq: 1.3, speed: 0.6, color: 0x8b5cf6, camY: 2.6, tilt: -0.2, ring: 0.4 },
  plantillas: { amp: 0.7,  freq: 0.7, speed: 0.4, color: 0xc084fc, camY: 1.8, tilt: 0.3,  ring: 0.6 },
  paquetes:   { amp: 0.3,  freq: 1.0, speed: 0.5, color: 0xa78bfa, camY: 3.6, tilt: 0.0,  ring: 0 },
  proceso:    { amp: 0.5,  freq: 1.6, speed: 0.8, color: 0xd946ef, camY: 2.4, tilt: -0.3, ring: 0.3 },
  nosotros:   { amp: 0.45, freq: 0.6, speed: 0.35, color: 0xf0abfc, camY: 2.8, tilt: 0.35, ring: 0.8 },
  contacto:   { amp: 0.6,  freq: 0.8, speed: 0.5, color: 0xa855f7, camY: 2.0, tilt: 0.15, ring: 1 },
};
const QUIZ = [
  { amp: 0.4, freq: 1.0, speed: 0.6, color: 0xa855f7, camY: 2.6, tilt: 0.25,  ring: 0.5 },
  { amp: 0.6, freq: 0.7, speed: 0.5, color: 0xc084fc, camY: 2.2, tilt: -0.25, ring: 0.5 },
  { amp: 0.3, freq: 1.4, speed: 0.7, color: 0xe879f9, camY: 3.0, tilt: 0.1,   ring: 0.5 },
  { amp: 0.5, freq: 0.9, speed: 0.5, color: 0x8b5cf6, camY: 2.4, tilt: -0.1,  ring: 0.5 },
];
const DONE = { amp: 0.9, freq: 0.6, speed: 1.2, color: 0xe879f9, camY: 2.0, tilt: 0, ring: 1 };
const poseFor = (key) => {
  if (POSES[key]) return POSES[key];
  const n = Number(String(key).slice(1));
  if (!Number.isFinite(n)) return POSES.inicio; // unknown section: never crash the loop
  return n >= 20 ? DONE : QUIZ[n % QUIZ.length];
};

export function initScene(canvas, getActive) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  // Dot field
  const cols = mobile ? 90 : 160, rows = mobile ? 60 : 90, w = 26, d = 16;
  const pos = new Float32Array(cols * rows * 3);
  for (let i = 0, k = 0; i < cols; i++) for (let j = 0; j < rows; j++, k += 3) {
    pos[k] = (i / (cols - 1) - 0.5) * w; pos[k + 1] = 0; pos[k + 2] = (j / (rows - 1) - 0.5) * d;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const uniforms = {
    uTime: { value: 0 }, uAmp: { value: 0.5 }, uFreq: { value: 1 },
    uColor: { value: new THREE.Color(0xa855f7) }, uMouse: { value: new THREE.Vector2() },
    uPx: { value: renderer.getPixelRatio() },
  };
  const dots = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uAmp, uFreq, uPx; uniform vec2 uMouse;
      varying float vH; varying float vFade;
      void main() {
        vec3 p = position;
        float r = length(p.xz - uMouse * vec2(10.0, 6.0));
        p.y = sin(p.x * 0.35 * uFreq + uTime) * cos(p.z * 0.45 * uFreq + uTime * 0.8) * uAmp
            + sin(r * 0.9 - uTime * 2.0) * 0.18 * exp(-r * 0.25);
        vH = p.y;
        vFade = smoothstep(13.0, 4.0, abs(p.x)) * smoothstep(8.0, 2.0, abs(p.z));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = uPx * 2.2 * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vH; varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * vFade * (0.35 + vH * 0.6);
        gl_FragColor = vec4(mix(uColor, vec3(1.0), clamp(vH, 0.0, 0.6)), a * 0.55);
      }`,
  }));
  scene.add(dots);

  // Hairline rings floating above the field
  const ringMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.25 });
  const rings = [1.6, 2.3, 3.0].map((r, i) => {
    const pts = new THREE.EllipseCurve(0, 0, r, r).getPoints(128).map((v) => new THREE.Vector3(v.x, v.y, 0));
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), ringMat);
    line.position.set(4.5, 2.6, -3);
    line.userData.speed = 0.15 + i * 0.07;
    scene.add(line);
    return line;
  });

  // Minimal wireframe objects floating in the side margins (attached to the camera so they frame the content)
  scene.add(camera);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.35 });
  const shapes = [
    new THREE.IcosahedronGeometry(0.55, 0), new THREE.TorusGeometry(0.45, 0.14, 8, 24), new THREE.OctahedronGeometry(0.5),
    new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.TetrahedronGeometry(0.5), new THREE.DodecahedronGeometry(0.45),
    new THREE.TorusKnotGeometry(0.32, 0.09, 48, 6), new THREE.ConeGeometry(0.4, 0.7, 5),
  ].map((g, i) => {
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(g, 1), wireMat);
    const side = i % 2 ? 1 : -1;
    m.userData = { side, base: (i / 8) * 2 - 1, depth: -7 - (i % 3) * 1.5, spin: 0.2 + (i % 4) * 0.12, sc: 0.8 + (i % 3) * 0.25 };
    camera.add(m);
    return m;
  });
  const target = { x: 0, y: 0 }, mouse = new THREE.Vector2();
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  const cur = { amp: 0.5, freq: 1, speed: 0.5, camY: 2.2, tilt: 0, ring: 1, kick: 0, t: 0 };
  const tmp = new THREE.Color();
  addEventListener('scene:kick', () => { cur.kick = 1; });
  const clock = new THREE.Clock();
  const damp = (a, b, k) => a + (b - a) * k;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const p = poseFor(getActive());
    const k = 1 - Math.pow(0.03, dt);
    for (const key of ['amp', 'freq', 'speed', 'camY', 'tilt', 'ring']) cur[key] = damp(cur[key], p[key], k);
    cur.kick = damp(cur.kick, 0, k * 0.8);
    if (!reduced) cur.t += dt * (cur.speed + cur.kick * 3);

    uniforms.uTime.value = cur.t;
    uniforms.uAmp.value = cur.amp + cur.kick * 0.4;
    uniforms.uFreq.value = cur.freq;
    uniforms.uColor.value.lerp(tmp.set(p.color), k);
    ringMat.color.lerp(tmp.set(p.color), k);
    ringMat.opacity = 0.22 * cur.ring;

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;
    uniforms.uMouse.value.set(mouse.x, mouse.y);

    camera.position.set(Math.sin(cur.tilt) * 8 + mouse.x * 0.6, cur.camY - mouse.y * 0.3, Math.cos(cur.tilt) * 8);
    camera.lookAt(0, -0.5, 0);

    rings.forEach((r, i) => {
      r.rotation.x = cur.t * r.userData.speed + i;
      r.rotation.y = cur.t * r.userData.speed * 0.7;    });
    // Side objects: drift up with scroll, wrap around, keep to the margins
    const vh = Math.tan(THREE.MathUtils.degToRad(25));
    const scrollF = scrollY / innerHeight;
    shapes.forEach((m) => {
      const u = m.userData, h = vh * -u.depth, w = h * camera.aspect;
      let y = ((u.base + scrollF * 0.35 * u.sc) % 2 + 2) % 2 - 1;     // -1..1 wrapped
      m.position.set(u.side * w * (mobile ? 0.95 : 0.86), y * h * 1.1, u.depth);
      m.rotation.x = cur.t * u.spin + scrollF * 0.8;
      m.rotation.y = cur.t * u.spin * 1.3;
      m.scale.setScalar(u.sc * (1 + cur.kick * 0.3));
    });
    wireMat.color.lerp(tmp.set(p.color), k);
    wireMat.opacity = damp(wireMat.opacity, String(getActive()).startsWith('q') ? 0.15 : 0.4, k);

    renderer.render(scene, camera);
  });
}
