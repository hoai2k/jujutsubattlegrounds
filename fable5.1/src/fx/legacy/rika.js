// RIKA — spectral apparition manifested behind Yuta. Not a fighter: a ghost
// of banded toon + additive glow, huge jaw, hollow eyes, trailing body.
import * as THREE from 'three';
import { animeHead, tGeo, coneSpike, latheY, shapeExtrude } from '../../art/geo.js';
import { toonMaterial } from '../../art/shaders/toon.js';
import { v3 } from '../../core/math.js';

export function buildRika() {
  const g = new THREE.Group();
  const ghost = toonMaterial({
    vertexColors: false, color: 0xdff8ec, steps: [90, 170, 255],
    rim: 0.9, rimColor: 0xa8ffd4, rimStart: 0.5, transparent: true, opacity: 0.85,
    emissive: 0x1c4436, emissiveIntensity: 0.8
  });
  const dark = toonMaterial({ vertexColors: false, color: 0x101822, steps: [60, 255], transparent: true, opacity: 0.9 });

  const S = 1.9; // overall scale
  // head: swollen anime skull with a huge underbite jaw
  const head = new THREE.Mesh(tGeo(animeHead(0.34 * S, { jaw: 0.4, width: 1.15, faceFlat: 0.5 }), { scale: [1, 0.92, 1] }), ghost);
  head.position.set(0, 1.35 * S, 0);
  g.add(head);
  // jaw slab with zigzag teeth
  const jawPts = [[-0.30, 0], [0.30, 0], [0.34, -0.16], [-0.34, -0.16]].map(p => [p[0] * S, p[1] * S]);
  const jaw = new THREE.Mesh(shapeExtrude(jawPts, 0.24 * S), ghost);
  jaw.position.set(0, 1.22 * S, 0.10 * S);
  jaw.rotation.x = 0.25;
  g.add(jaw);
  const teeth = [];
  for (let i = 0; i < 7; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.035 * S, 0.09 * S, 4), dark);
    t.position.set((i - 3) * 0.085 * S, 1.28 * S, 0.28 * S);
    t.rotation.x = Math.PI; // fangs point down
    g.add(t); teeth.push(t);
  }
  // hollow eyes
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.085 * S, 12), dark);
    eye.position.set(s * 0.14 * S, 1.44 * S, 0.30 * S);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.02 * S, 8),
      new THREE.MeshBasicMaterial({ color: 0xc0ffe0 }));
    pupil.position.set(s * 0.14 * S, 1.44 * S, 0.305 * S);
    g.add(pupil);
  }
  // flowing body: tapered lathe trailing to a wisp
  const body = new THREE.Mesh(latheY([
    [0.02 * S, -0.4 * S], [0.16 * S, 0.0], [0.30 * S, 0.5 * S], [0.26 * S, 0.9 * S], [0.12 * S, 1.1 * S]
  ], 14, 0.85), ghost);
  g.add(body);
  // arms: long tubes ending in 3-clawed hands
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(latheY([[0.028 * S, 0], [0.06 * S, 0.5 * S], [0.075 * S, 0.9 * S]], 8), ghost);
    arm.position.set(s * 0.34 * S, 0.95 * S, 0.05 * S);
    arm.rotation.z = s * 2.45;
    arm.rotation.x = -0.3;
    g.add(arm);
    const hand = new THREE.Group();
    for (let f = 0; f < 3; f++) {
      const claw = new THREE.Mesh(tGeo(coneSpike(0.035 * S, 0.22 * S, v3(0, 0, 0.05 * S)), {}), ghost);
      claw.position.set((f - 1) * 0.055 * S, 0, 0);
      claw.rotation.x = -0.5 - f * 0.1;
      hand.add(claw);
    }
    hand.position.set(s * 0.86 * S, 0.62 * S, 0.28 * S);
    g.add(hand);
  }
  // hair wisps
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const wisp = new THREE.Mesh(tGeo(coneSpike(0.05 * S, 0.35 * S, v3(Math.sin(a) * 0.2 * S, -0.1 * S, Math.cos(a) * 0.2 * S)), {}), ghost);
    wisp.position.set(Math.sin(a) * 0.26 * S, 1.62 * S, Math.cos(a) * 0.24 * S - 0.05 * S);
    wisp.rotation.x = 0.3;
    g.add(wisp);
  }

  let t = 0;
  return {
    group: g,
    materials: { ghost, dark },
    update(dt) {
      t += dt;
      g.position.y = Math.sin(t * 1.7) * 0.08;
      g.rotation.z = Math.sin(t * 1.1) * 0.03;
      const breathe = 1 + Math.sin(t * 2.2) * 0.02;
      head.scale.setScalar(breathe);
    },
    setOpacity(o) {
      ghost.opacity = 0.85 * o; dark.opacity = 0.9 * o;
      g.visible = o > 0.02;
    }
  };
}
