import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function initHeroScene(canvas) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const root = new THREE.Group();
  scene.add(root);

  // Central glass object
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xc4a5ff, metalness: 0, roughness: 0.08, transmission: 1, thickness: 1.4,
    ior: 1.45, iridescence: 0.6, iridescenceIOR: 1.3, clearcoat: 1,
  });
  const core = new THREE.Mesh(new THREE.TorusKnotGeometry(1.05, 0.36, 220, 32, 2, 3), glass);
  root.add(core);

  // Wireframe shell
  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.3, 1)),
    new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35 })
  );
  root.add(shell);

  // Minimal floating objects
  const chrome = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 1, roughness: 0.2 });
  const matte = new THREE.MeshStandardMaterial({ color: 0x1a0f2e, metalness: 0.3, roughness: 0.5 });
  const pieces = [
    [new THREE.SphereGeometry(0.32, 48, 48), chrome, [-2.6, 1.4, 0.5]],
    [new THREE.TorusGeometry(0.4, 0.12, 32, 64), chrome, [2.5, -1.3, 0.8]],
    [new THREE.BoxGeometry(0.5, 0.5, 0.5), matte, [2.3, 1.7, -0.6]],
    [new THREE.ConeGeometry(0.3, 0.6, 4), glass, [-2.2, -1.7, 0.2]],
    [new THREE.OctahedronGeometry(0.28), chrome, [0.4, 2.6, -1]],
  ].map(([g, m, p], i) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...p);
    mesh.userData = { base: mesh.position.clone(), speed: 0.6 + i * 0.15, phase: i * 1.3 };
    root.add(mesh);
    return mesh;
  });

  // Particles
  const count = 300, pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 14;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xc084fc, size: 0.025, transparent: true, opacity: 0.7 }));
  scene.add(particles);

  // Lights
  const key = new THREE.PointLight(0xa855f7, 40, 20); key.position.set(3, 3, 4); scene.add(key);
  const rim = new THREE.PointLight(0xe879f9, 30, 20); rim.position.set(-4, -2, -2); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.2));

  // Interaction
  const mouse = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth - 0.5) * 2;
    target.y = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = reduced ? 0 : clock.getElapsedTime();
    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;
    const scroll = Math.min(scrollY / innerHeight, 1.5);

    core.rotation.set(t * 0.25 + scroll, t * 0.35, 0);
    shell.rotation.set(-t * 0.08, -t * 0.12 + scroll * 0.6, 0);
    pieces.forEach((m) => {
      const { base, speed, phase } = m.userData;
      m.position.y = base.y + Math.sin(t * speed + phase) * 0.18;
      m.rotation.x = t * speed * 0.6; m.rotation.y = t * speed * 0.4;
    });
    particles.rotation.y = t * 0.02;
    root.rotation.y = mouse.x * 0.35;
    root.rotation.x = mouse.y * 0.25;
    root.position.y = scroll * 1.2;
    root.scale.setScalar(1 - scroll * 0.2);
    renderer.render(scene, camera);
  });
}
