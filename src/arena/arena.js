// Arena: Jujutsu High courtyard at dusk. Foreground stone plaza (bounded,
// visible edge), midground school buildings + lanterns + trees, background
// mountain silhouettes, gradient sky dome, fog for depth separation.
import * as THREE from 'three';
import { toonMaterial } from '../art/shaders/toon.js';
import { rand, v3, DEG } from '../core/mathutil.js';

export const ARENA_RADIUS = 10.5;

function flagstoneTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#565d6e';
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const px = x * 64 + rand(3, 9), py = y * 64 + rand(3, 9);
      const w = 58 - rand(0, 10), h = 58 - rand(0, 10);
      const shade = 88 + rand(-14, 14);
      g.fillStyle = `rgb(${shade},${shade + 4},${shade + 14})`;
      g.fillRect(px, py, w, h);
      g.strokeStyle = 'rgba(20,22,30,0.55)';
      g.lineWidth = 3;
      g.strokeRect(px, py, w, h);
    }
  }
  // grime
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${30 + rand(0, 40)},${34 + rand(0, 40)},${44 + rand(0, 40)},0.16)`;
    g.fillRect(rand(0, 512), rand(0, 512), rand(2, 8), rand(2, 8));
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function skyDome() {
  const geo = new THREE.SphereGeometry(150, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x1a2350) },
      uMid: { value: new THREE.Color(0x53527e) },
      uHorizon: { value: new THREE.Color(0xd8845e) }
    },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; varying vec3 vP;
      void main(){
        float h = normalize(vP).y;
        vec3 c = mix(uHorizon, uMid, smoothstep(-0.02, 0.24, h));
        c = mix(c, uTop, smoothstep(0.2, 0.75, h));
        gl_FragColor = vec4(c, 1.0);
      }`
  });
  return new THREE.Mesh(geo, mat);
}

function building(w, h, d, color, roofColor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
    toonMaterial({ vertexColors: false, color, steps: [60, 130, 255], rim: 0.12 }));
  body.position.y = h / 2;
  // hipped roof
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, w * 0.78, h * 0.36, 4),
    toonMaterial({ vertexColors: false, color: roofColor, steps: [50, 120, 255], rim: 0.2 }));
  roof.scale.z = d / w * 1.15;
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + h * 0.18;
  g.add(body, roof);
  // lit windows
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffc873 });
  for (let i = 0; i < Math.floor(w * 1.2); i++) {
    if (Math.random() < 0.45) continue;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.6), winMat);
    win.position.set(-w / 2 + 0.8 + i * 0.8, h * rand(0.3, 0.7), d / 2 + 0.02);
    g.add(win);
  }
  return g;
}

function lanternPost(h = 2.6) {
  const g = new THREE.Group();
  const stone = toonMaterial({ vertexColors: false, color: 0x4b4f5e, steps: [60, 140, 255] });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, h, 6), stone);
  post.position.y = h / 2;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.3, 0.28, 4), stone);
  cap.position.y = h + 0.32;
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34),
    new THREE.MeshBasicMaterial({ color: 0xffc36a }));
  box.position.y = h + 0.12;
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), makeGlowMat(0xffb45e, 0.5));
  halo.position.y = h + 0.12;
  halo.userData.billboard = true;
  g.add(post, cap, box, halo);
  return g;
}

let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}
export function makeGlowMat(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    map: glowTexture(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
}

function tree(scale = 1) {
  const g = new THREE.Group();
  const trunkMat = toonMaterial({ vertexColors: false, color: 0x3a2c22, steps: [60, 140, 255] });
  const leafMat = toonMaterial({ vertexColors: false, color: 0x2c4432, steps: [50, 120, 255], rim: 0.15, rimColor: 0xd8845e });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, 1.6 * scale, 6), trunkMat);
  trunk.position.y = 0.8 * scale;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(rand(0.7, 1.1) * scale, 8, 6), leafMat);
    blob.position.set(rand(-0.6, 0.6) * scale, (1.7 + i * 0.5 + rand(-0.2, 0.2)) * scale, rand(-0.6, 0.6) * scale);
    blob.scale.y = 0.8;
    g.add(blob);
  }
  return g;
}

export function buildArena() {
  const group = new THREE.Group();
  group.name = 'arena';

  const sky = skyDome();
  group.add(sky);

  // sun disc low on the horizon
  const sun = new THREE.Mesh(new THREE.CircleGeometry(7, 24), makeGlowMat(0xffd9a8, 0.9));
  sun.position.set(-60, 9, -120);
  sun.lookAt(0, 6, 0);
  group.add(sun);

  // ---- plaza (foreground) -------------------------------------------------
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(ARENA_RADIUS + 1.6, 48),
    new THREE.MeshStandardMaterial({ map: flagstoneTexture(), roughness: 0.95, color: 0x9aa0b4 }));
  ground.rotation.x = -Math.PI / 2;
  group.add(ground);

  // border ring + guard stones
  const rim = new THREE.Mesh(new THREE.TorusGeometry(ARENA_RADIUS + 1.4, 0.22, 8, 60),
    toonMaterial({ vertexColors: false, color: 0x585d70, steps: [60, 140, 255] }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.08;
  group.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const l = lanternPost(2.4 + (i % 2) * 0.3);
    l.position.set(Math.sin(a) * (ARENA_RADIUS + 2.2), 0, Math.cos(a) * (ARENA_RADIUS + 2.2));
    group.add(l);
  }

  // outer grass apron
  const apron = new THREE.Mesh(new THREE.RingGeometry(ARENA_RADIUS + 1.6, 40, 48),
    toonMaterial({ vertexColors: false, color: 0x33443a, steps: [60, 130, 255] }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -0.03;
  group.add(apron);

  // ---- midground ----------------------------------------------------------
  // torii-style gate at the back
  const gate = new THREE.Group();
  const gateMat = toonMaterial({ vertexColors: false, color: 0x6e2430, steps: [60, 140, 255], rim: 0.2, rimColor: 0xffb080 });
  for (const s of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 7.4, 10), gateMat);
    pillar.position.set(s * 3.4, 3.7, 0);
    pillar.rotation.z = -s * 0.05;
    gate.add(pillar);
  }
  const beamTop = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.55, 0.8), gateMat);
  beamTop.position.y = 7.3;
  const beamTop2 = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.35, 0.6), gateMat);
  beamTop2.position.y = 7.9;
  beamTop2.rotation.z = 0.0;
  const beamMid = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.4, 0.55), gateMat);
  beamMid.position.y = 5.9;
  gate.add(beamTop, beamTop2, beamMid);
  gate.position.set(0, 0, -19);
  group.add(gate);

  // school buildings (dark silhouette layer with lit windows)
  const b1 = building(14, 6.5, 6, 0x2c3040, 0x1d2029);
  b1.position.set(-14, 0, -26);
  b1.rotation.y = 0.28;
  const b2 = building(18, 9, 7, 0x272b3a, 0x191c26);
  b2.position.set(13, 0, -30);
  b2.rotation.y = -0.2;
  const b3 = building(10, 5, 5, 0x303448, 0x1d2029);
  b3.position.set(26, 0, -12);
  b3.rotation.y = -0.75;
  group.add(b1, b2, b3);

  // trees scattered around the apron
  for (let i = 0; i < 11; i++) {
    const a = rand(0, Math.PI * 2);
    const r = rand(ARENA_RADIUS + 5, ARENA_RADIUS + 16);
    if (Math.abs(a - Math.PI) < 0.5) continue; // keep the gate sightline
    const t = tree(rand(1.1, 2.0));
    t.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
    group.add(t);
  }

  // ---- background: mountain silhouettes -----------------------------------
  const mountainMat = toonMaterial({ vertexColors: false, color: 0x252b47, steps: [255], rim: 0 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const h = rand(14, 30);
    const mtn = new THREE.Mesh(new THREE.ConeGeometry(rand(18, 30), h, 5), mountainMat);
    mtn.position.set(Math.sin(a) * rand(75, 100), h * 0.32, Math.cos(a) * rand(75, 100));
    mtn.rotation.y = rand(0, 2);
    group.add(mtn);
  }

  // drifting ambient motes (cursed energy in the air)
  const moteGeo = new THREE.BufferGeometry();
  const N = 130;
  const mp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    mp[i * 3] = rand(-16, 16); mp[i * 3 + 1] = rand(0.3, 7); mp[i * 3 + 2] = rand(-16, 16);
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    map: glowTexture(), color: 0x9fb8ff, size: 0.09, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  group.add(motes);

  const billboards = [];
  group.traverse(o => { if (o.userData.billboard) billboards.push(o); });

  let t = 0;
  return {
    group,
    radius: ARENA_RADIUS,
    fog: new THREE.Fog(0x3c3f5e, 26, 110),
    update(dt, camera) {
      t += dt;
      const pos = motes.geometry.getAttribute('position');
      for (let i = 0; i < N; i++) {
        pos.array[i * 3 + 1] += Math.sin(t * 0.6 + i) * 0.0016;
        pos.array[i * 3] += Math.cos(t * 0.4 + i * 2.1) * 0.0012;
      }
      pos.needsUpdate = true;
      for (const b of billboards) b.quaternion.copy(camera.quaternion);
    }
  };
}
