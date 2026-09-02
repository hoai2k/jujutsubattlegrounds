// GARMENTS. Each piece is a generator (ctx, opts) that adds geometry to a
// material slot over the body, and hangs spring chains for anything that
// should move. Pieces are ordered by the spec; later pieces draw over earlier
// ones by being built slightly larger, so a jacket over a shirt reads as two
// layers at the collar and the hem.
import * as THREE from 'three';
import { latheY, tubeBetween, roundBox, tGeo, shapeExtrude, sphereShell, mergeGeos } from '../geo.js';
import { hangingChain } from './cloth.js';
import { skinPoint } from './head.js';
import { v3 } from '../../core/math.js';

const tint = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

// torso shell profile, slightly outside the body — the base of every top
function torsoShell(ctx, { top = 0.82, bottom = 0.44, grow = 1.06, flare = 1, zScale = 0.76, collarR = 1 } = {}) {
  const { H, B, bulk } = ctx.m;
  const hipR = 0.070 * H * B.hipR * bulk * grow, waistR = 0.056 * H * B.waist * bulk * grow, chestR = 0.076 * H * B.chest * bulk * grow;
  const pts = [
    [hipR * 0.98 * flare, bottom * H], [hipR * 0.99, 0.50 * H], [hipR, 0.535 * H], [waistR * 1.02, 0.60 * H],
    [chestR * 0.95, 0.66 * H], [chestR * 1.02, 0.72 * H], [chestR * 0.97, 0.775 * H], [0.056 * H * bulk * grow, top * H], [0.034 * H * collarR, (top + 0.01) * H]
  ].filter(p => p[1] >= bottom * H - 1e-6);
  return latheY(pts, 24, zScale);
}

function sleeves(ctx, color, slot, { len = 1, grow = 1.12, cuff = 0 } = {}) {
  const { H, joints, armChains, muscle } = ctx.m;
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const chain = armChains[s];
    const m = s === 'L' ? 1 : -1;
    // deltoid cap
    ctx.bag.add(slot, tGeo(new THREE.SphereGeometry(0.0345 * H * muscle * grow, 12, 9), { scale: [0.98, 1.22, 0.94], rot: [0, 0, m * 13], pos: [sh.x + m * 0.002 * H, sh.y, sh.z] }), { bone: 'UpArm' + s, color });
    if (len >= 0.5) ctx.bag.add(slot, tubeBetween(sh.clone().add(v3(0, 0.012 * H, 0)), el, [0.032 * H * muscle * grow, 0.0245 * H * grow], { bulge: 0.12, bulgeAt: 0.42, hSeg: 6 }), { chain, color, blend: 0.09 });
    else ctx.bag.add(slot, tubeBetween(sh.clone().add(v3(0, 0.012 * H, 0)), sh.clone().lerp(el, len * 2), [0.033 * H * muscle * grow, 0.029 * H * grow], { hSeg: 3 }), { chain, color, blend: 0.09 });
    if (len >= 1) {
      const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.006 * H);
      ctx.bag.add(slot, tubeBetween(el, wrExt, [0.0245 * H * grow, (0.0175 + cuff * 0.008) * H * grow], { bulge: 0.10, bulgeAt: 0.28, hSeg: 6 }), { chain, color, blend: 0.09 });
      ctx.bag.add(slot, tGeo(new THREE.SphereGeometry(0.0255 * H * muscle * grow, 10, 8), { pos: [el.x, el.y, el.z] }), { chain, color, blend: 0.09 });
    } else if (len > 0.5) {
      ctx.bag.add(slot, tubeBetween(el, el.clone().lerp(wr, (len - 0.5) * 2), [0.0245 * H * grow, 0.021 * H * grow], { hSeg: 3 }), { chain, color, blend: 0.09 });
      ctx.bag.add(slot, tGeo(new THREE.SphereGeometry(0.0255 * H * muscle * grow, 10, 8), { pos: [el.x, el.y, el.z] }), { chain, color, blend: 0.09 });
    }
  }
}

function legs(ctx, color, slot, { len = 1, grow = 1.08, wide = 1 } = {}) {
  const { H, joints, legChains, B } = ctx.m;
  const lb = B.legBulk;
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const chain = legChains[s];
    ctx.bag.add(slot, tubeBetween(hp.clone().add(v3(0, 0.04 * H, 0)), len >= 0.5 ? kn : hp.clone().lerp(kn, len * 2), [0.050 * H * lb * grow * wide, 0.032 * H * lb * grow * wide], { bulge: 0.06, bulgeAt: 0.4, hSeg: 6 }), { chain, color, blend: 0.07 });
    if (len >= 0.5) {
      ctx.bag.add(slot, tGeo(new THREE.SphereGeometry(0.0335 * H * lb * grow, 10, 8), { scale: [1, 1.08, 0.96], pos: [kn.x, kn.y, kn.z] }), { chain, color, blend: 0.07 });
      const end = len >= 1 ? an.clone().add(v3(0, 0.02 * H, 0)) : kn.clone().lerp(an, (len - 0.5) * 2);
      ctx.bag.add(slot, tubeBetween(kn, end, [0.032 * H * lb * grow * wide, 0.021 * H * grow * wide], { bulge: 0.08, bulgeAt: 0.3, hSeg: 6 }), { chain, color, blend: 0.07 });
    }
  }
}

function collar(ctx, color, { height = 0.03, r = 1.0, open = 0 } = {}) {
  const { H, y } = ctx.m;
  const base = y.neck - 0.012 * H;
  if (open) {
    // lapels: two wedges on the chest
    for (const s of [1, -1]) {
      ctx.bag.add('cloth', tGeo(shapeExtrude([[0, 0], [s * 0.045 * H, -0.02 * H], [s * 0.02 * H, -0.11 * H], [0, -0.06 * H]], 0.008 * H), { pos: [s * 0.006 * H, y.neck, 0.052 * H] }), { chain: ctx.m.torsoChain, color, blend: 0.05 });
    }
    return;
  }
  ctx.bag.add('cloth', latheY([[0.036 * H * r, base], [0.041 * H * r, base + height * 0.5 * H], [0.046 * H * r, base + height * H]], 16, 0.86), { bone: 'Neck', color });
}

function hemSkirt(ctx, color, { top = 0.505, bottom = 0.40, grow = 1.02, flare = 1.06, split = false, slot = 'cloth' } = {}) {
  const { H, B, bulk } = ctx.m;
  const hipR = 0.070 * H * B.hipR * bulk * grow;
  if (!split) {
    ctx.bag.add(slot, latheY([[hipR * flare * 1.08, bottom * H], [hipR * 1.02, (top + bottom) / 2 * H], [hipR * 0.99, top * H]], 22, 0.8), { bone: 'Hips', color });
  } else {
    // front/back panels on springs — a coat that moves
    const L = (top - bottom) * H;
    for (const [x, z, dir] of [[0, -0.6, -1], [0.55, 0, 0], [-0.55, 0, 0]]) {
      hangingChain(ctx, { bone: 'Hips', offset: [x * hipR * 1.2, (top - 0.515) * H, z * hipR * 1.4 * 0.8], restDir: [0, -1, dir * 0.12], segs: 3, len: L / 3, w0: hipR * 1.3, w1: hipR * 1.45, thick: 0.012 * H, color, slot, stiffness: 90, damping: 0.86, gravity: 9 });
    }
  }
}

export const GARMENTS = {
  // fitted shirt / top: recolours the torso shell
  shirt(ctx, o) {
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.84, bottom: 0.47, grow: 1.05 }), { chain: ctx.m.torsoChain, color: o.color, blend: 0.05 });
    sleeves(ctx, o.color, 'cloth', { len: o.sleeves ?? 1, grow: 1.08 });
    if (o.collar) collar(ctx, o.collarColor ?? o.color, { height: 0.02 });
    if (o.vneck) ctx.bag.add('skin', tGeo(shapeExtrude([[-0.04 * ctx.m.H, 0], [0.04 * ctx.m.H, 0], [0, -0.07 * ctx.m.H]], 0.004 * ctx.m.H), { pos: [0, 0.82 * ctx.m.H, 0.058 * ctx.m.H] }), { chain: ctx.m.torsoChain, color: ctx.m.skinTone, blend: 0.05 });
  },
  tank(ctx, o) {
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.80, bottom: 0.46, grow: 1.04, collarR: 0.7 }), { chain: ctx.m.torsoChain, color: o.color, blend: 0.05 });
  },
  // JACKET: uniform jacket, high collar by default (Tokyo Jujutsu High)
  jacket(ctx, o) {
    const { H, y, torsoChain } = ctx.m;
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.835, bottom: o.hem ?? 0.44, grow: 1.10, zScale: 0.78 }), { chain: torsoChain, color: o.color, blend: 0.05 });
    sleeves(ctx, o.sleeveColor ?? o.color, 'cloth', { len: o.sleeves ?? 1, grow: 1.10, cuff: 0.4 });
    if (o.collar !== 'none') collar(ctx, o.collarColor ?? o.color, { height: o.collar === 'high' ? 0.045 : 0.025, r: o.collar === 'high' ? 1.06 : 1.0, open: o.collar === 'open' });
    hemSkirt(ctx, o.color, { top: 0.51, bottom: o.hem ?? 0.42, grow: 1.05, flare: o.flare ?? 1.05 });
    // zip / button placket
    if (o.placket !== false) for (const [cy, cz, ch] of [[0.775, 0.056, 0.09], [0.685, 0.05, 0.09], [0.60, 0.044, 0.08]]) {
      ctx.bag.add('cloth', tGeo(roundBox(0.010 * H, ch * H, 0.006 * H, 0.002), { pos: [0, cy * H, cz * H * (ctx.m.B.chest)] }), { chain: torsoChain, color: o.trim ?? tint(o.color, 1.6), blend: 0.05 });
    }
    if (o.buttons) for (let i = 0; i < o.buttons; i++) ctx.bag.add('metal', tGeo(new THREE.SphereGeometry(0.008 * H, 8, 6), { pos: [0, (0.78 - i * 0.055) * H, 0.058 * H] }), { chain: torsoChain, color: o.buttonColor ?? 0xd8c070, blend: 0.05 });
    if (o.hood) GARMENTS.hood(ctx, { color: o.hoodColor ?? o.color, down: true });
  },
  // GAKURAN: the stand-collar school jacket with a button column
  gakuran(ctx, o) { GARMENTS.jacket(ctx, { ...o, collar: 'high', buttons: o.buttons ?? 5, placket: false }); },
  // HOODIE
  hoodie(ctx, o) { GARMENTS.jacket(ctx, { ...o, collar: 'none', hood: true, placket: o.placket ?? true }); },
  hood(ctx, o) {
    const { H, headR, headC, y } = ctx.m;
    if (o.down) {
      // a hood lying on the shoulders/back
      const g = sphereShell(0.075 * H, { thetaLength: Math.PI * 0.6, seg: 16, rings: 8, scale: [1.3, 0.7, 1.1] });
      ctx.bag.add('cloth', tGeo(g, { rot: [200, 0, 0], pos: [0, y.neck - 0.02 * H, -0.055 * H] }), { bone: 'Chest', color: o.color });
    } else {
      const g = sphereShell(headR * 1.22, { thetaLength: Math.PI * 0.78, seg: 20, rings: 10, scale: [1.0, 1.05, 1.02] });
      ctx.bag.add('cloth', tGeo(g, { rot: [-30, 0, 0], pos: [headC.x, headC.y + headR * 0.05, headC.z - headR * 0.25] }), { bone: 'Head', color: o.color });
    }
  },
  // COAT / ROBE: long hem on springs
  coat(ctx, o) {
    const { torsoChain } = ctx.m;
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.835, bottom: 0.50, grow: 1.12, zScale: 0.8 }), { chain: torsoChain, color: o.color, blend: 0.05 });
    sleeves(ctx, o.sleeveColor ?? o.color, 'cloth', { len: o.sleeves ?? 1, grow: 1.2, cuff: 1 });
    if (o.collar !== 'none') collar(ctx, o.collarColor ?? o.color, { height: 0.035, r: 1.08, open: o.collar === 'open' });
    hemSkirt(ctx, o.color, { top: 0.515, bottom: o.hem ?? 0.22, split: true });
    if (o.belt) GARMENTS.belt(ctx, { color: o.belt });
  },
  // KIMONO: crossed V collar, wide sleeves, obi
  kimono(ctx, o) {
    const { H, y, torsoChain } = ctx.m;
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.83, bottom: 0.50, grow: 1.12, zScale: 0.8, collarR: 0.9 }), { chain: torsoChain, color: o.color, blend: 0.05 });
    // crossed collar bands
    for (const s of [1, -1]) {
      ctx.bag.add('cloth', tGeo(roundBox(0.03 * H, 0.16 * H, 0.012 * H, 0.003), { rot: [0, 0, s * 26], pos: [s * 0.032 * H, 0.745 * H, 0.06 * H] }), { chain: torsoChain, color: o.collarColor ?? tint(o.color, 0.8), blend: 0.05 });
    }
    // wide sleeves: a box hanging from the elbow
    sleeves(ctx, o.color, 'cloth', { len: o.sleeves ?? 1, grow: 1.35, cuff: 2.5 });
    if (o.sleeveDrop) for (const s of ['L', 'R']) {
      const el = ctx.m.joints.get('LoArm' + s);
      hangingChain(ctx, { bone: 'LoArm' + s, offset: [0, -0.01 * H, 0], segs: 2, len: o.sleeveDrop * H / 2, w0: 0.09 * H, w1: 0.1 * H, thick: 0.01 * H, color: o.color, stiffness: 80, damping: 0.85, gravity: 8 });
    }
    hemSkirt(ctx, o.color, { top: 0.515, bottom: o.hem ?? 0.12, split: true });
    GARMENTS.belt(ctx, { color: o.obi ?? 0x1a1a22, wide: 1.8 });
  },
  // HAKAMA: wide pleated trousers
  hakama(ctx, o) {
    const { H } = ctx.m;
    legs(ctx, o.color, 'cloth', { len: 0.9, grow: 1.35, wide: 1.25 });
    ctx.bag.add('cloth', latheY([[0.105 * H, 0.10 * H], [0.09 * H, 0.30 * H], [0.078 * H, 0.50 * H]], 22, 0.78), { bone: 'Hips', color: o.color });
    GARMENTS.belt(ctx, { color: o.obi ?? 0x1a1a22, wide: 1.4 });
  },
  pants(ctx, o) {
    legs(ctx, o.color, 'cloth', { len: o.len ?? 1, grow: o.grow ?? 1.08, wide: o.wide ?? 1 });
    ctx.bag.add('cloth', latheY([[0.071 * ctx.m.H * ctx.m.B.hipR * ctx.m.bulk, 0.40 * ctx.m.H], [0.0725 * ctx.m.H * ctx.m.B.hipR * ctx.m.bulk, 0.47 * ctx.m.H], [0.070 * ctx.m.H * ctx.m.B.hipR * ctx.m.bulk, 0.53 * ctx.m.H]], 22, 0.78), { chain: ctx.m.torsoChain, color: o.color, blend: 0.05 });
    if (o.belt) GARMENTS.belt(ctx, { color: o.belt });
  },
  shorts(ctx, o) { GARMENTS.pants(ctx, { ...o, len: 0.45, grow: 1.12 }); },
  skirt(ctx, o) {
    const { H, B, bulk } = ctx.m;
    const hipR = 0.070 * H * B.hipR * bulk;
    ctx.bag.add('cloth', latheY([[hipR * 1.5, (o.hem ?? 0.30) * H], [hipR * 1.15, 0.44 * H], [hipR * 1.02, 0.52 * H]], 22, 0.85), { bone: 'Hips', color: o.color });
  },
  belt(ctx, o) {
    const { H, B, bulk, torsoChain } = ctx.m;
    const r = 0.0705 * H * B.hipR * bulk * 1.06;
    const w = 0.022 * (o.wide ?? 1);
    ctx.bag.add(o.slot ?? 'leather', latheY([[r, 0.505 * H], [r * 1.03, (0.505 + w / 2) * H], [r, (0.505 + w) * H]], 22, 0.8), { chain: torsoChain, color: o.color, blend: 0.05 });
    if (o.buckle !== false && !o.wide) ctx.bag.add('metal', tGeo(roundBox(0.03 * H, 0.022 * H, 0.008 * H, 0.002), { pos: [0, 0.516 * H, r * 0.8] }), { chain: torsoChain, color: 0xc8c0a8, blend: 0.05 });
  },
  sash(ctx, o) {
    const { H } = ctx.m;
    GARMENTS.belt(ctx, { color: o.color, wide: 2.2, slot: 'cloth' });
    hangingChain(ctx, { bone: 'Hips', offset: [o.side ?? 0.06 * H, 0, -0.02 * H], segs: 3, len: 0.09 * H, w0: 0.04 * H, w1: 0.05 * H, thick: 0.006 * H, color: o.color, stiffness: 90, damping: 0.85, gravity: 9 });
  },
  tie(ctx, o) {
    const { H, y } = ctx.m;
    ctx.bag.add('cloth', tGeo(roundBox(0.024 * H, 0.03 * H, 0.014 * H, 0.004), { pos: [0, y.neck - 0.02 * H, 0.056 * H] }), { bone: 'Chest', color: o.color });
    hangingChain(ctx, { bone: 'Chest', offset: [0, y.neck - 0.035 * H - ctx.m.joints.get('Chest').y, 0.062 * H], restDir: [0, -1, 0.02], segs: 2, len: 0.08 * H, w0: 0.026 * H, w1: 0.038 * H, thick: 0.008 * H, color: o.color, stiffness: 120, damping: 0.86, gravity: 9 });
  },
  vest(ctx, o) {
    ctx.bag.add('cloth', torsoShell(ctx, { top: 0.80, bottom: 0.46, grow: 1.09, collarR: 0.8 }), { chain: ctx.m.torsoChain, color: o.color, blend: 0.05 });
  },
  // SCARF / HIGH COLLAR (Inumaki): a thick roll around the neck up to the mouth
  scarf(ctx, o) {
    const { H, y, headR, headC } = ctx.m;
    const top = o.high ? headC.y - headR * 0.45 : y.headBase + 0.02 * H;
    ctx.bag.add('cloth', latheY([[0.05 * H, y.neck - 0.03 * H], [0.062 * H, y.neck + 0.01 * H], [0.058 * H, top - 0.01 * H], [0.052 * H, top]], 18, 0.9), { bone: 'Neck', color: o.color });
  },
  blindfold(ctx, o) {
    const { headR, headC } = ctx.m;
    const bfY = headC.y - headR * 0.06;
    ctx.bag.add('cloth', latheY([[headR * 1.0, bfY - headR * 0.20], [headR * 1.075, bfY], [headR * 1.0, bfY + headR * 0.20]], 22, 0.97), { bone: 'Head', color: o.color });
    ctx.bag.add('cloth', tGeo(roundBox(headR * 0.22, headR * 0.18, headR * 0.14, 0.004), { pos: [0, bfY, headC.z - headR * 1.02] }), { bone: 'Head', color: o.color });
    hangingChain(ctx, { bone: 'Head', offset: [0, bfY - ctx.m.joints.get('Head').y, headC.z - headR * 1.08], restDir: [0, -1, -0.3], segs: 2, len: headR * 0.35, w0: headR * 0.2, w1: headR * 0.14, thick: 0.004, color: o.color, stiffness: 100, damping: 0.85, gravity: 8, wind: 1 });
  },
  glasses(ctx, o) {
    const { headR } = ctx.m;
    for (const s of [1, -1]) {
      const p = skinPoint(ctx, [s * 0.40, -0.06, 0.92], 0.09);
      const g = o.round ? new THREE.TorusGeometry(headR * 0.24, headR * 0.03, 6, 16) : tGeo(roundBox(headR * 0.5, headR * 0.3, headR * 0.03, 0.003), {});
      ctx.bag.add(o.dark ? 'flat' : 'metal', tGeo(g, { rot: [0, s * 12, 0], pos: [p.x, p.y, p.z] }), { bone: 'Head', color: o.dark ? 0x0c0c12 : (o.color ?? 0x222226) });
      if (o.dark) ctx.bag.add('flat', tGeo(roundBox(headR * 0.46, headR * 0.26, 0.002, 0.002), { rot: [0, s * 12, 0], pos: [p.x, p.y, p.z + 0.001] }), { bone: 'Head', color: 0x101018 });
    }
    const b = skinPoint(ctx, [0, -0.04, 0.98], 0.10);
    ctx.bag.add('metal', tGeo(roundBox(headR * 0.24, headR * 0.03, headR * 0.03, 0.002), { pos: [b.x, b.y, b.z] }), { bone: 'Head', color: o.color ?? 0x222226 });
  },
  goggles(ctx, o) {
    // NANAMI: goggles pushed up on the forehead
    const { headR } = ctx.m;
    const p = skinPoint(ctx, [0, 0.36, 0.9], 0.1);
    ctx.bag.add('cloth', latheY([[headR * 1.0, p.y - headR * 0.1], [headR * 1.06, p.y], [headR * 1.0, p.y + headR * 0.1]], 22, 0.97), { bone: 'Head', color: o.strap ?? 0x1a1a1e });
    for (const s of [1, -1]) ctx.bag.add('metal', tGeo(roundBox(headR * 0.36, headR * 0.24, headR * 0.12, 0.01), { pos: [p.x + s * headR * 0.3, p.y, p.z] }), { bone: 'Head', color: o.color ?? 0x3a3a3f });
  },
  // MASK (Ino) / face wraps
  mask(ctx, o) {
    const { headR, headC } = ctx.m;
    const full = o.full;
    const g = sphereShell(headR * 1.05, { thetaStart: full ? 0.2 : Math.PI * 0.45, thetaLength: full ? Math.PI * 0.7 : Math.PI * 0.4, phiStart: Math.PI * 1.25, phiLength: Math.PI * 0.5, seg: 20, rings: 10 });
    ctx.bag.add('cloth', tGeo(g, { rot: [0, 90, 0], pos: [headC.x, headC.y - (full ? 0 : headR * 0.02), headC.z + headR * 0.02] }), { bone: 'Head', color: o.color });
  },
  cap(ctx, o) {
    const { headR, headC } = ctx.m;
    ctx.bag.add('cloth', tGeo(sphereShell(headR * 1.14, { thetaLength: Math.PI * 0.5, seg: 20, rings: 8 }), { pos: [headC.x, headC.y + headR * 0.05, headC.z - headR * 0.05] }), { bone: 'Head', color: o.color });
    ctx.bag.add('cloth', tGeo(roundBox(headR * 1.0, headR * 0.06, headR * 0.7, 0.01), { rot: [-8, 0, 0], pos: [headC.x, headC.y + headR * 0.3, headC.z + headR * 1.1] }), { bone: 'Head', color: o.color });
  },
  gloves(ctx, o) {
    const { H, joints } = ctx.m;
    for (const s of ['L', 'R']) {
      const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
      const d = wr.clone().sub(el).normalize();
      ctx.bag.add('leather', tubeBetween(wr.clone().addScaledVector(d, -0.03 * H), wr.clone().addScaledVector(d, 0.012 * H), [0.021 * H, 0.024 * H], { hSeg: 2 }), { bone: 'Hand' + s, color: o.color });
    }
  },
  wristbands(ctx, o) { GARMENTS.gloves(ctx, o); },
  // CAPE / jacket on the shoulders (Hakari's look): a shell on the back, spring tails
  cape(ctx, o) {
    const { H, y } = ctx.m;
    const g = sphereShell(0.11 * H, { thetaLength: Math.PI * 0.5, seg: 18, rings: 8, scale: [1.25, 0.6, 1.0] });
    ctx.bag.add('cloth', tGeo(g, { pos: [0, y.shoulder - 0.005 * H, -0.01 * H] }), { bone: 'Chest', color: o.color });
    for (const x of [-0.6, 0, 0.6]) hangingChain(ctx, { bone: 'Chest', offset: [x * 0.09 * H, y.shoulder - 0.02 * H - ctx.m.joints.get('Chest').y, -0.07 * H], restDir: [0, -1, -0.1], segs: 4, len: (o.length ?? 0.42) * H / 4, w0: 0.08 * H, w1: 0.1 * H, thick: 0.01 * H, color: o.color, stiffness: 70, damping: 0.86, gravity: 9, wind: 0.5 });
  },
  // KASAYA / monk's sash (Geto): a band across one shoulder
  kasaya(ctx, o) {
    const { H, torsoChain } = ctx.m;
    // a full ring laid flat round the chest, then tilted so it runs from the
    // right shoulder down to the left hip
    const g = tGeo(new THREE.TorusGeometry(0.092 * H, 0.028 * H, 8, 28), { rot: [90, 0, 0], scale: [1, 1, 0.82] });
    ctx.bag.add('cloth', tGeo(g, { rot: [0, 0, -42], pos: [0.0, 0.66 * H, 0.0] }), { chain: torsoChain, color: o.color, blend: 0.05 });
  },
  // bandage wraps on forearms
  wraps(ctx, o) {
    const { H, joints, armChains } = ctx.m;
    for (const s of ['L', 'R']) {
      const el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
      ctx.bag.add('cloth', tubeBetween(el.clone().lerp(wr, 0.2), wr.clone().add(v3(0, 0.01 * H, 0)), [0.0245 * H, 0.0185 * H], { hSeg: 4 }), { chain: armChains[s], color: o.color ?? 0xe8e2d2, blend: 0.09 });
    }
  },
  apron(ctx, o) {
    const { H, torsoChain } = ctx.m;
    ctx.bag.add('cloth', tGeo(roundBox(0.11 * H, 0.22 * H, 0.008 * H, 0.004), { pos: [0, 0.58 * H, 0.075 * H] }), { chain: torsoChain, color: o.color, blend: 0.05 });
  },
  // a sword or staff on the back is a prop; see build.js props
};

export function addGarment(ctx, g) {
  const fn = GARMENTS[g.piece];
  if (!fn) { console.warn('[garments] unknown piece', g.piece); return; }
  fn(ctx, g);
}
