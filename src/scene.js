import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// One pose per section: where the core sits (x as fraction of half-width), which shape, color, how pieces behave
const POSES = {
  inicio:     { x: 0.45, y: 0,    z: 0,  s: 1,    shape: 0, color: 0xc4a5ff, spread: 1,   orbit: 0.15 },
  manifiesto: { x: 0,    y: 0,    z: -3, s: 1.6,  shape: 1, color: 0xe879f9, spread: 1.8, orbit: 0.05 },
  servicios:  { x: 0.7,  y: 0.45, z: -2, s: 0.75, shape: 2, color: 0xa78bfa, spread: 1.3, orbit: 0.3 },
  plantillas: { x: -0.6, y: -0.2, z: -1, s: 0.8,  shape: 3, color: 0x8b5cf6, spread: 0.8, orbit: 0.2 },
  paquetes:   { x: 0,    y: 0,    z: -4, s: 1.4,  shape: 1, color: 0xc084fc, spread: 2.2, orbit: 0.4 },
  proceso:    { x: 0.6,  y: 0.4,  z: -1, s: 0.7,  shape: 0, color: 0xd946ef, spread: 1.1, orbit: 0.6 },
  contacto:   { x: -0.55,y: -0.35,z: 0,  s: 0.85, shape: 2, color: 0xa855f7, spread: 0.6, orbit: 0.1 },
};

export function initScene(canvas, getActive) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 720px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();
  scene.add(root);

  // Morphing core: several glass shapes, crossfaded by scale
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc4a5ff, roughness: 0.06, transmission: 1, thickness: 1.5, ior: 1.45,
    iridescence: 0.7, iridescenceIOR: 1.3, clearcoat: 1,
  });
  const shapes = [
    new THREE.TorusKnotGeometry(1.05, 0.36, 220, 32, 2, 3),
    new THREE.IcosahedronGeometry(1.4, 12),
    new THREE.TorusGeometry(1.15, 0.45, 64, 128),
    new THREE.OctahedronGeometry(1.5, 0),
  ].map((g) => { const m = new THREE.Mesh(g, glass); m.scale.setScalar(0); root.add(m); return m; });

  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.3, 1)),
    new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.3 })
  );
  root.add(shell);

  // Orbiting minimal pieces
  const chrome = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 1, roughness: 0.18 });
  const matte = new THREE.MeshStandardMaterial({ color: 0x1a0f2e, metalness: 0.3, roughness: 0.5 });
  const orbit = new THREE.Group();
  root.add(orbit);
  const pieces = [
    [new THREE.SphereGeometry(0.32, 48, 48), chrome, [-2.6, 1.4, 0.5]],
    [new THREE.TorusGeometry(0.4, 0.12, 32, 64), chrome, [2.5, -1.3, 0.8]],
    [new THREE.BoxGeometry(0.5, 0.5, 0.5), matte, [2.3, 1.7, -0.6]],
    [new THREE.ConeGeometry(0.3, 0.6, 4), glass, [-2.2, -1.7, 0.2]],
    [new THREE.OctahedronGeometry(0.28), chrome, [0.4, 2.6, -1]],
    [new THREE.CapsuleGeometry(0.15, 0.5, 8, 16), chrome, [-0.6, -2.5, 0.6]],
  ].map(([g, m, p], i) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.userData = { base: new THREE.Vector3(...p), speed: 0.6 + i * 0.15, phase: i * 1.3 };
    orbit.add(mesh);
    return mesh;
  });

  // Particles
  const count = mobile ? 150 : 400, pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 18;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc084fc, size: 0.025, transparent: true, opacity: 0.7 }));
  scene.add(particles);

  const key = new THREE.PointLight(0xa855f7, 40, 20); key.position.set(3, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0xe879f9, 30, 20); rim.position.set(-4, -2, -2); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  const mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let halfW = 5;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    halfW = Math.tan(THREE.MathUtils.degToRad(17.5)) * 9 * camera.aspect;
  }
  addEventListener('resize', resize);
  resize();

  // Smoothed state
  const cur = { x: POSES.inicio.x, y: 0, z: 0, s: 1, spread: 1, orbit: 0.15, spin: 0 };
  const col = new THREE.Color(0xc4a5ff), tmpCol = new THREE.Color();
  let lastScroll = scrollY;
  const clock = new THREE.Clock();
  const damp = (a, b, k) => a + (b - a) * k;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = reduced ? 0 : clock.elapsedTime;
    const p = POSES[getActive()] || POSES.inicio;
    const k = 1 - Math.pow(0.02, dt); // frame-rate independent ease

    // Scroll velocity gives a little "kick" spin during transitions
    const vel = (scrollY - lastScroll) / innerHeight; lastScroll = scrollY;
    cur.spin = damp(cur.spin, vel * 6, 0.1);

    const px = mobile ? p.x * 0.3 : p.x;
    cur.x = damp(cur.x, px * halfW, k);
    cur.y = damp(cur.y, p.y * 2.8, k);
    cur.z = damp(cur.z, p.z, k);
    cur.s = damp(cur.s, mobile ? p.s * 0.7 : p.s, k);
    cur.spread = damp(cur.spread, p.spread, k);
    cur.orbit = damp(cur.orbit, p.orbit, k);
    col.lerp(tmpCol.set(p.color), k);
    glass.color.copy(col); glass.attenuationColor = col;
    key.color.lerp(tmpCol.set(p.color), k);

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    root.position.set(cur.x, cur.y, cur.z);
    root.rotation.y = mouse.x * 0.35;
    root.rotation.x = mouse.y * 0.25;

    shapes.forEach((m, i) => {
      const s = damp(m.scale.x, i === p.shape ? cur.s : 0, k * 1.4);
      m.scale.setScalar(s);
      m.rotation.x += 0.004 + cur.spin * 0.3; m.rotation.y += 0.006 + cur.spin * 0.3;
      m.visible = s > 0.01;
    });
    shell.scale.setScalar(cur.s);
    shell.rotation.set(-t * 0.08, -t * 0.12 + cur.spin, 0);

    orbit.rotation.y += cur.orbit * dt + cur.spin * 0.2;
    pieces.forEach((m) => {
      const { base, speed, phase } = m.userData;
      m.position.copy(base).multiplyScalar(cur.spread * cur.s);
      m.position.y += Math.sin(t * speed + phase) * 0.18;
      m.rotation.x = t * speed * 0.6; m.rotation.y = t * speed * 0.4;
    });
    particles.rotation.y = t * 0.02;
    particles.position.y = scrollY * 0.0015;
    renderer.render(scene, camera);
  });
}
