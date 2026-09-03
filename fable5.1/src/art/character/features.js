// FEATURES: everything that is neither hair nor cloth — non-human heads,
// markings, scars, horns, beards, glowing eyes, tails. Same generator shape
// as the garments.
import * as THREE from 'three';
import { latheY, tGeo, roundBox, coneSpike, sphereShell, mergeGeos, tubeBetween } from '../geo.js';
import { skinPoint } from './head.js';
import { hangingChain } from './cloth.js';
import { v3 } from '../../core/math.js';

function line(ctx, dir, w, h, rot, color, out = 0.025) {
  const p = skinPoint(ctx, dir, out);
  ctx.bag.add('flat', tGeo(roundBox(ctx.m.headR * w, ctx.m.headR * h, 0.002, 0.001), { rot, pos: [p.x, p.y, p.z] }), { bone: 'Head', color });
}

export const FEATURES = {
  // SUKUNA: the four-line markings on cheeks and brow, and the second eyes
  sukunaMarks(ctx, o) {
    const c = o.color ?? 0x1a1214;
    for (const s of [1, -1]) {
      line(ctx, [s * 0.55, -0.32, 0.8], 0.04, 0.46, [0, s * 30, 0], c);
      line(ctx, [s * 0.72, -0.28, 0.65], 0.04, 0.42, [0, s * 45, 0], c);
      line(ctx, [s * 0.3, 0.32, 0.9], 0.30, 0.04, [0, s * 12, s * 8], c);
      // second pair of eyes under the first
      const p = skinPoint(ctx, [s * 0.40, -0.36, 0.86], 0.03);
      ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(ctx.m.headR * 0.09, 10), { scale: [1.5, 0.7, 1], rot: [0, s * 14, 0], pos: [p.x, p.y, p.z] }), { bone: 'Head', color: 0xf3f5f9 });
      ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(ctx.m.headR * 0.05, 8), { rot: [0, s * 14, 0], pos: [p.x, p.y, p.z + 0.002] }), { bone: 'Head', color: o.eye ?? 0xc0202a });
    }
  },
  // MAHITO: stitched patchwork — coloured patches and cross-lines
  patchwork(ctx, o) {
    const c = o.patch ?? 0x8c96a8, st = o.stitch ?? 0x2a2a30;
    for (const [dir, w, h, rot] of [[[0.5, 0.2, 0.85], 0.5, 0.42, [0, 25, 12]], [[-0.55, -0.35, 0.75], 0.42, 0.4, [0, -35, -8]], [[0.1, -0.55, 0.85], 0.3, 0.28, [0, 5, 0]], [[-0.7, 0.3, 0.55], 0.36, 0.5, [0, -50, 0]]]) {
      const p = skinPoint(ctx, dir, 0.015);
      ctx.bag.add('flat', tGeo(roundBox(ctx.m.headR * w, ctx.m.headR * h, 0.002, 0.004), { rot, pos: [p.x, p.y, p.z] }), { bone: 'Head', color: c });
      for (let i = -1; i <= 1; i++) line(ctx, [dir[0] + i * 0.05, dir[1] + (i * 0.12), dir[2]], 0.02, 0.1, [0, rot[1], 90 + rot[2]], st, 0.02);
    }
    // body patches
    const { H, torsoChain } = ctx.m;
    for (const [x, y, w, h] of [[0.03, 0.66, 0.05, 0.07], [-0.035, 0.58, 0.045, 0.05]]) ctx.bag.add('flat', tGeo(roundBox(w * H, h * H, 0.002, 0.003), { pos: [x * H, y * H, 0.062 * H] }), { chain: torsoChain, color: c, blend: 0.05 });
  },
  // scars: TOJI's mouth scar, others
  scar(ctx, o) {
    const [dir, w, h, rot] = o.at ?? [[0.32, -0.62, 0.82], 0.28, 0.035, [0, 10, 20]];
    line(ctx, dir, w, h, rot, o.color ?? 0xc98d84, 0.03);
  },
  beard(ctx, o) {
    const { headR } = ctx.m;
    const p = skinPoint(ctx, [0, -0.78, 0.6], 0.02);
    const g = sphereShell(headR * 1.02, { thetaStart: Math.PI * 0.58, thetaLength: Math.PI * 0.42, phiStart: Math.PI * 1.3, phiLength: Math.PI * 0.4, seg: 20, rings: 8 });
    ctx.bag.add('hair', tGeo(g, { rot: [0, 90, 0], pos: [ctx.m.headC.x, ctx.m.headC.y - headR * 0.02, ctx.m.headC.z + headR * 0.02] }), { bone: 'Head', color: o.color });
  },
  stubble(ctx, o) { FEATURES.beard(ctx, { color: o.color ?? 0x5a5048 }); },
  mustache(ctx, o) {
    const { headR } = ctx.m;
    for (const s of [1, -1]) { const p = skinPoint(ctx, [s * 0.16, -0.48, 0.9], 0.03); ctx.bag.add('hair', tGeo(roundBox(headR * 0.2, headR * 0.06, headR * 0.03, 0.003), { rot: [0, s * 10, s * 8], pos: [p.x, p.y, p.z] }), { bone: 'Head', color: o.color }); }
  },
  // JOGO: the volcano skull — the top of the head is a cone with a lava mouth; one eye
  volcanoHead(ctx, o) {
    const { headR, headC } = ctx.m;
    ctx.bag.add('stone', tGeo(latheY([[headR * 1.02, headC.y - headR * 0.4], [headR * 1.05, headC.y + headR * 0.3], [headR * 0.7, headC.y + headR * 1.2], [headR * 0.42, headC.y + headR * 1.9], [headR * 0.3, headC.y + headR * 2.0]], 20, 1), {}), { bone: 'Head', color: o.color ?? 0x6e5d58 });
    ctx.bag.add('glow', tGeo(new THREE.CylinderGeometry(headR * 0.26, headR * 0.3, headR * 0.12, 12), { pos: [headC.x, headC.y + headR * 1.98, headC.z] }), { bone: 'Head', color: 0xff7a1a });
    // stitched mouth, one big eye in the middle
    const e = skinPoint(ctx, [0, -0.05, 0.95], 0.04);
    ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.22, 14), { pos: [e.x, e.y, e.z] }), { bone: 'Head', color: 0xf5eee0 });
    ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.11, 10), { pos: [e.x, e.y, e.z + 0.002] }), { bone: 'Head', color: 0x1a1210 });
    for (let i = -2; i <= 2; i++) line(ctx, [i * 0.12, -0.6, 0.9], 0.03, 0.12, [0, 0, 0], 0x2a1a16);
  },
  // HANAMI: a wooden face with branch horns and a flower eye
  woodHead(ctx, o) {
    const { headR, headC } = ctx.m;
    for (const s of [1, -1]) {
      const b = skinPoint(ctx, [s * 0.55, 0.75, 0.1], 0.02);
      const g = coneSpike(headR * 0.16, headR * 1.3, v3(s * headR * 0.35, headR * 0.2, -headR * 0.2), { radial: 7 });
      g.translate(b.x, b.y, b.z);
      ctx.bag.add('stone', g, { bone: 'Head', color: o.branch ?? 0x4a3a2a });
    }
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, e = skinPoint(ctx, [-0.42 + Math.cos(a) * 0.12, -0.08 + Math.sin(a) * 0.12, 0.9], 0.03);
      ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.06, 8), { pos: [e.x, e.y, e.z] }), { bone: 'Head', color: o.flower ?? 0xf0a0c8 });
    }
    line(ctx, [0.42, -0.08, 0.9], 0.2, 0.05, [0, 0, 0], 0x201a14, 0.03);
  },
  // PANDA: round ears, muzzle, eye patches; the body is fur via slots
  pandaHead(ctx, o) {
    const { headR, headC } = ctx.m;
    for (const s of [1, -1]) ctx.bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.36, 12, 10), { pos: [headC.x + s * headR * 0.75, headC.y + headR * 0.8, headC.z - headR * 0.1] }), { bone: 'Head', color: 0x111114 });
    const mz = skinPoint(ctx, [0, -0.3, 0.9], 0.15);
    ctx.bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.42, 14, 10), { scale: [1.2, 0.75, 0.8], pos: [mz.x, mz.y, mz.z] }), { bone: 'Head', color: 0xf0ece4 });
    ctx.bag.add('flat', tGeo(new THREE.SphereGeometry(headR * 0.14, 10, 8), { scale: [1.2, 0.8, 0.6], pos: [mz.x, mz.y + headR * 0.08, mz.z + headR * 0.32] }), { bone: 'Head', color: 0x0c0c10 });
    for (const s of [1, -1]) { const p = skinPoint(ctx, [s * 0.42, -0.02, 0.9], 0.012); ctx.bag.add('fur', tGeo(new THREE.CircleGeometry(headR * 0.3, 14), { scale: [1, 1.3, 1], rot: [0, s * 14, s * 20], pos: [p.x, p.y, p.z] }), { bone: 'Head', color: 0x111114 }); }
  },
  // DAGON: fish head — a wide flat skull, fin crest, barbels on springs
  fishHead(ctx, o) {
    const { headR, headC } = ctx.m;
    ctx.bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 1.05, 20, 14), { scale: [1.35, 0.75, 1.2], pos: [headC.x, headC.y - headR * 0.15, headC.z + headR * 0.1] }), { bone: 'Head', color: o.color ?? 0x6f8f96 });
    const crest = coneSpike(headR * 0.5, headR * 1.1, v3(0, 0, -headR * 0.5), { radial: 6, zScale: 0.3 });
    crest.translate(headC.x, headC.y + headR * 0.5, headC.z - headR * 0.2);
    ctx.bag.add('cloth', crest, { bone: 'Head', color: o.fin ?? 0x3e5e6a });
    for (const s of [1, -1]) for (let i = 0; i < 2; i++) hangingChain(ctx, { bone: 'Head', offset: [s * headR * (0.5 + i * 0.4), headC.y - ctx.m.joints.get('Head').y - headR * 0.4, headC.z + headR * 0.7], restDir: [s * 0.3, -1, 0.3], segs: 3, len: headR * 0.4, w0: headR * 0.1, w1: headR * 0.04, thick: headR * 0.08, color: o.color ?? 0x6f8f96, slot: 'skin', stiffness: 50, damping: 0.85, gravity: 5, wind: 1 });
    for (const s of [1, -1]) { const p = skinPoint(ctx, [s * 0.75, 0.1, 0.62], 0.16); ctx.bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.16, 12), { rot: [0, s * 40, 0], pos: [p.x, p.y, p.z] }), { bone: 'Head', color: 0xffe28a }); }
  },
  // KUROURUSHI: a chitin helmet with antennae and mandibles
  roachHead(ctx, o) {
    const { headR, headC } = ctx.m;
    ctx.bag.add('metal', tGeo(sphereShell(headR * 1.12, { thetaLength: Math.PI * 0.62, seg: 20, rings: 10, scale: [1.05, 1.1, 1.15] }), { pos: [headC.x, headC.y + headR * 0.05, headC.z - headR * 0.08] }), { bone: 'Head', color: o.color ?? 0x3a2a14 });
    for (const s of [1, -1]) {
      hangingChain(ctx, { bone: 'Head', offset: [s * headR * 0.35, headC.y - ctx.m.joints.get('Head').y + headR * 0.95, headC.z + headR * 0.3], restDir: [s * 0.4, 0.6, 0.7], segs: 3, len: headR * 0.55, w0: headR * 0.06, w1: headR * 0.03, thick: headR * 0.05, color: 0x241808, slot: 'metal', stiffness: 40, damping: 0.85, gravity: 1, wind: 2 });
      const m = skinPoint(ctx, [s * 0.3, -0.66, 0.8], 0.06);
      const g = coneSpike(headR * 0.08, headR * 0.35, v3(-s * headR * 0.12, -headR * 0.1, headR * 0.1), { radial: 5 });
      g.rotateX(Math.PI * 0.5); g.translate(m.x, m.y, m.z);
      ctx.bag.add('metal', g, { bone: 'Head', color: 0x241808 });
    }
  },
  horns(ctx, o) {
    const { headR } = ctx.m;
    for (const s of [1, -1]) {
      const b = skinPoint(ctx, [s * (o.spread ?? 0.5), 0.8, 0.15], 0.0);
      const g = coneSpike(headR * (o.r ?? 0.14), headR * (o.length ?? 0.8), v3(s * headR * 0.2, headR * 0.2, -headR * 0.1), { radial: 7 });
      g.translate(b.x, b.y, b.z);
      ctx.bag.add('stone', g, { bone: 'Head', color: o.color ?? 0x3a3038 });
    }
  },
  // glowing eyes (spirits, Sukuna's vessel, Mahoraga): replace the iris colour with an HDR disc
  glowEyes(ctx, o) {
    for (const s of [1, -1]) { const p = skinPoint(ctx, [s * 0.40, -0.06, 0.92], 0.032); ctx.bag.add('glow', tGeo(new THREE.CircleGeometry(ctx.m.headR * 0.09, 10), { rot: [0, s * 14, 0], pos: [p.x - s * ctx.m.headR * 0.02, p.y, p.z] }), { bone: 'Head', color: o.color ?? 0xff4040 }); }
  },
  // body markings (Sukuna's torso lines, tattoos)
  bodyLines(ctx, o) {
    const { H, torsoChain } = ctx.m;
    const c = o.color ?? 0x1a1214;
    for (const [x, y, w, h, rz] of [[0.0, 0.74, 0.12, 0.012, 0], [0.0, 0.64, 0.10, 0.012, 0], [0.04, 0.69, 0.012, 0.1, 0], [-0.04, 0.69, 0.012, 0.1, 0]]) ctx.bag.add('flat', tGeo(roundBox(w * H, h * H, 0.002, 0.001), { rot: [0, 0, rz], pos: [x * H, y * H, 0.064 * H] }), { chain: torsoChain, color: c, blend: 0.05 });
    for (const s of ['L', 'R']) { const sh = ctx.m.joints.get('UpArm' + s), el = ctx.m.joints.get('LoArm' + s); const p = sh.clone().lerp(el, 0.5); ctx.bag.add('flat', tGeo(new THREE.TorusGeometry(0.031 * H, 0.004 * H, 4, 16), { rot: [90, 0, 0], pos: [p.x, p.y, p.z] }), { chain: ctx.m.armChains[s], color: c, blend: 0.09 }); }
  },
  tail(ctx, o) {
    hangingChain(ctx, { bone: 'Hips', offset: [0, -0.02 * ctx.m.H, -0.06 * ctx.m.H], restDir: [0, -0.5, -1], segs: 4, len: (o.length ?? 0.5) * ctx.m.H / 4, w0: 0.05 * ctx.m.H, w1: 0.02 * ctx.m.H, thick: 0.04 * ctx.m.H, color: o.color, slot: o.slot ?? 'skin', stiffness: 40, damping: 0.86, gravity: 6 });
  },
  earrings(ctx, o) {
    for (const s of [1, -1]) { const ep = skinPoint(ctx, [s * 0.98, -0.22, -0.10], 0.04); ctx.bag.add('metal', tGeo(new THREE.TorusGeometry(ctx.m.headR * 0.06, ctx.m.headR * 0.015, 5, 10), { pos: [ep.x, ep.y - ctx.m.headR * 0.1, ep.z] }), { bone: 'Head', color: o.color ?? 0xd8c070 }); }
  }
};

export function addFeature(ctx, f) {
  const fn = FEATURES[f.kind];
  if (!fn) { console.warn('[features] unknown feature', f.kind); return; }
  fn(ctx, f);
}
