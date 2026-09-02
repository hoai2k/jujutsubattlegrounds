// PHASE 1 SCAFFOLD — a lit test scene so the render stack can be measured
// before any character exists. Replaced by the real screen router in Phase 3.
import * as THREE from 'three';
import { createStage } from '../render/stage.js';
import { archetype } from '../art/shaders/toon.js';
import { makeOutline } from '../art/shaders/outline.js';
import { ContactShadow } from '../render/contact.js';
import { cycleQuality, quality } from '../render/quality.js';

export function startGame() {
  const stage = createStage();
  const { scene } = stage;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), archetype('stone', { color: 0x565a68 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const bodies = [];
  const cols = [0xff5f74, 0x7fd0ff, 0xf2b23c, 0x9ff5c9];
  cols.forEach((c, i) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 6, 16), archetype(i % 2 ? 'skin' : 'cloth', { color: c }));
    m.position.set(-3 + i * 2, 0.9, 0); m.castShadow = m.receiveShadow = true;
    scene.add(m); scene.add(makeOutline(m));
    const cs = new ContactShadow(0.5); scene.add(cs.mesh);
    bodies.push({ m, cs });
  });
  stage.camera.position.set(0, 2.2, 7);
  stage.camera.lookAt(0, 1, 0);
  let t = 0, last = performance.now();
  addEventListener('keydown', e => { if (e.code === 'F4') console.log(cycleQuality().name); if (e.code === 'KeyH') { stage.punch(1, { x: 0.5, y: 0.5 }); stage.impactFrame(4); stage.flash(0.6); } });
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    bodies.forEach((b, i) => { b.m.position.y = 0.9 + Math.abs(Math.sin(t * 2 + i)) * (i === 1 ? 1.5 : 0); b.cs.update(b.m.position.clone().setY(b.m.position.y - 0.9), 0); });
    stage.render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__f51 = { stage, quality };
}
