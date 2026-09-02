// HAIR STYLES. Every style is a generator (ctx, opts) that adds geometry to
// the `hair` slot on the Head bone and, for anything long, spring chains.
// The silhouette rule: the hair mass is one of the three things that make a
// character readable at 6 m, so every style has a deliberate mass and edge.
import * as THREE from 'three';
import { coneSpike, sphereShell, tGeo, ribbonShell, roundBox } from '../geo.js';
import { skinPoint } from './head.js';
import { hangingChain } from './cloth.js';
import { v3, rand, mulberry32 } from '../../core/math.js';

const rngFor = ctx => mulberry32((ctx.spec.id || 'x').split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0);

// skull cap — the base every style sits on. `low` pulls the hairline down.
function cap(ctx, color, { low = 0, thick = 1.11, back = 1.02, sides = 1.0 } = {}) {
  const { headR, headC } = ctx.m;
  const th = Math.PI * (0.52 + low * 0.3);
  const g = sphereShell(headR * thick, { thetaLength: th, seg: 28, rings: 14, scale: [sides, 1.0, back] });
  // pull the front edge up a touch so the cap never reads as a helmet over the brow
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (z > headR * 0.35 && y < headR * 0.45) pos.setY(i, y + (headR * 0.45 - y) * 0.55 * Math.min(1, (z - headR * 0.35) / (headR * 0.4)));
  }
  g.computeVertexNormals();
  ctx.bag.add('hair', tGeo(g, { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.03] }), { bone: 'Head', color });
}

function spike(ctx, color, dir, len, r, bend, opts = {}) {
  const { headR, headC } = ctx.m;
  const n = v3(...dir).normalize();
  const base = skinPoint(ctx, dir, opts.inset ?? 0.02);
  const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), n);
  const g = coneSpike(r, len, v3(...bend), { radial: 7, hSeg: 5 });
  g.applyQuaternion(q);
  g.translate(base.x, base.y, base.z);
  g.computeVertexNormals();
  ctx.bag.add('hair', g, { bone: 'Head', color });
}

// ---- styles ---------------------------------------------------------------
export const HAIR = {
  bald() {},

  buzz(ctx, o) { cap(ctx, o.color, { thick: 1.035, low: 0.05 }); },

  // GOJO / YUJI: a crown of spikes pointing up and out
  spikesUp(ctx, o) {
    const { headR } = ctx.m;
    const R = rngFor(ctx);
    cap(ctx, o.color, { low: 0.08, thick: 1.10 });
    const n = o.count ?? 16, len = headR * (o.length ?? 1.0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R() * 0.3;
      const ring = i % 2 ? 0.55 : 0.85;
      const dir = [Math.sin(a) * ring, 1.0, Math.cos(a) * ring * 0.9 + 0.15];
      const up = o.wild ? R() * 0.5 : 0.2;
      spike(ctx, o.color, dir, len * (0.75 + R() * 0.5), headR * 0.28, [Math.sin(a) * headR * 0.25, headR * up, Math.cos(a) * headR * 0.2]);
    }
    // fringe over the brow
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [i * 0.28, 0.55, 0.85], len * 0.75, headR * 0.22, [i * headR * 0.08, -headR * 0.35, headR * 0.15]);
    // a second, lower ring gives the mass a base
    for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * Math.PI * 2; spike(ctx, o.color, [Math.sin(a) * 0.95, 0.35, Math.cos(a) * 0.95], len * 0.55, headR * 0.24, [Math.sin(a) * headR * 0.15, headR * 0.05, Math.cos(a) * headR * 0.1]); }
  },

  // MEGUMI / INO / TOJI: short, dark, spikes swept back and down
  messy(ctx, o) {
    const { headR } = ctx.m;
    const R = rngFor(ctx);
    cap(ctx, o.color, { low: 0.12, thick: 1.10 });
    const n = o.count ?? 14, len = headR * (o.length ?? 0.8);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const dir = [Math.sin(a) * 0.9, 0.75 + R() * 0.3, Math.cos(a) * 0.9];
      spike(ctx, o.color, dir, len * (0.6 + R() * 0.6), headR * 0.24, [Math.sin(a) * headR * 0.3, -headR * (0.1 + R() * 0.25), Math.cos(a) * headR * 0.2 - headR * 0.15]);
    }
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [i * 0.3, 0.5, 0.85], len * 0.7, headR * 0.15, [i * headR * 0.1, -headR * 0.45, headR * 0.1]);
  },

  // NANAMI / NAOYA / HAKARI: side part, fringe swept to one side
  sideSwept(ctx, o) {
    const { headR, headC } = ctx.m;
    const s = o.side ?? 1;
    cap(ctx, o.color, { low: 0.14, thick: 1.08 });
    // fringe: a ribbon across the brow, dipping on the swept side
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, a = (t - 0.5) * 1.9;
      const p = skinPoint(ctx, [Math.sin(a), 0.52 - t * s * 0.55 - 0.1, Math.cos(a)], 0.08);
      pts.push(p);
    }
    const rib = ribbonShell(pts, t => headR * (0.36 + Math.sin(t * Math.PI) * 0.16), headR * 0.05, { seg: 12, normalHint: v3(0, 0, 1) });
    ctx.bag.add('hair', rib, { bone: 'Head', color: o.color });
    // a few strands over the ear on the swept side
    for (let i = 0; i < 3; i++) spike(ctx, o.color, [s * 0.8, 0.2 - i * 0.15, 0.55], headR * 0.55, headR * 0.12, [s * headR * 0.1, -headR * 0.4, 0]);
    if (o.nape) for (let i = -1; i <= 1; i++) spike(ctx, o.color, [i * 0.4, -0.2, -0.9], headR * 0.45, headR * 0.13, [0, -headR * 0.35, -headR * 0.1]);
  },

  // SUKUNA / NAOYA: pulled straight back off the brow in ridges
  slick(ctx, o) {
    const { headR } = ctx.m;
    cap(ctx, o.color, { low: 0.06, thick: 1.09, back: 1.08 });
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.32;
      spike(ctx, o.color, [Math.sin(a) * 0.5, 0.95, 0.4], headR * 0.75, headR * 0.15, [Math.sin(a) * headR * 0.15, -headR * 0.15, -headR * 0.75]);
    }
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [Math.sin(i * 0.45) * 0.7, 0.35, -0.9], headR * 0.5, headR * 0.14, [0, -headR * 0.45, -headR * 0.2]);
  },

  // NOBARA / URAUME: a bob to the jaw, straight fringe
  bob(ctx, o) {
    const { headR, headC } = ctx.m;
    cap(ctx, o.color, { low: 0.45, thick: 1.12, back: 1.12, sides: 1.08 });
    // fringe curtain
    for (let i = -3; i <= 3; i++) {
      const a = i * 0.26;
      spike(ctx, o.color, [Math.sin(a) * 0.9, 0.35, 0.9], headR * (0.62 + (o.fringe ?? 0)), headR * 0.16, [Math.sin(a) * headR * 0.05, -headR * 0.9, headR * 0.05]);
    }
    // side falls on springs, both sides
    for (const s of [1, -1]) {
      hangingChain(ctx, { bone: 'Head', offset: [s * headR * 0.92, headC.y - ctx.m.joints.get('Head').y + headR * 0.1, headC.z - headR * 0.1], segs: 2, len: headR * (o.length ?? 0.45), w0: headR * 0.6, w1: headR * 0.5, thick: headR * 0.22, color: o.color, slot: 'hair', stiffness: 110, damping: 0.86, gravity: 8 });
    }
  },

  // GETO / YUKI / URO / KASHIMO / MIWA: long, on springs down the back, with a fringe or a centre part
  long(ctx, o) {
    const { headR, headC } = ctx.m;
    cap(ctx, o.color, { low: 0.3, thick: 1.11, back: 1.1 });
    const hy = headC.y - ctx.m.joints.get('Head').y;
    const L = headR * (o.length ?? 2.2);
    // three back falls
    for (const x of [-0.45, 0, 0.45]) {
      hangingChain(ctx, { bone: 'Head', offset: [x * headR, hy + headR * 0.25, headC.z - headR * 0.85], restDir: [0, -1, -0.15], segs: 4, len: L / 4, w0: headR * 0.55, w1: headR * 0.35, thick: headR * 0.2, color: o.color, slot: 'hair', stiffness: 60, damping: 0.85, gravity: 8, wind: o.wind ?? 0.6 });
    }
    // side falls
    for (const s of [1, -1]) {
      hangingChain(ctx, { bone: 'Head', offset: [s * headR * 0.9, hy + headR * 0.05, headC.z - headR * 0.2], segs: 3, len: L * 0.22, w0: headR * 0.45, w1: headR * 0.3, thick: headR * 0.18, color: o.color, slot: 'hair', stiffness: 90, damping: 0.86, gravity: 8 });
    }
    if (o.part === 'centre') {
      for (const s of [1, -1]) for (let i = 0; i < 3; i++) spike(ctx, o.color, [s * (0.25 + i * 0.25), 0.5, 0.85], headR * 0.7, headR * 0.16, [s * headR * 0.25, -headR * 0.7, headR * 0.05]);
    } else if (o.part !== 'none') {
      for (let i = -3; i <= 3; i++) spike(ctx, o.color, [i * 0.28, 0.42, 0.88], headR * 0.6, headR * 0.15, [i * headR * 0.06, -headR * 0.7, headR * 0.08]);
    }
    if (o.halfUp) {
      // GETO: half tied up in a bun at the crown
      ctx.bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.4, 12, 10), { pos: [headC.x, headC.y + headR * 0.85, headC.z - headR * 0.35] }), { bone: 'Head', color: o.color });
    }
  },

  // MAKI / CHOSO(twin) : a tail on a spring
  ponytail(ctx, o) {
    const { headR, headC } = ctx.m;
    cap(ctx, o.color, { low: 0.2, thick: 1.1, back: 1.08 });
    const hy = headC.y - ctx.m.joints.get('Head').y;
    const tails = o.twin ? [[-0.75, 0.3, -0.45], [0.75, 0.3, -0.45]] : [[0, o.high ? 0.9 : 0.35, -0.85]];
    for (const t of tails) {
      const knot = skinPoint(ctx, t, 0.08);
      ctx.bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.26, 10, 8), { pos: [knot.x, knot.y, knot.z] }), { bone: 'Head', color: o.color });
      if (o.tie) ctx.bag.add('cloth', tGeo(new THREE.TorusGeometry(headR * 0.2, headR * 0.05, 6, 12), { rot: [0, 0, 0], pos: [knot.x, knot.y, knot.z] }), { bone: 'Head', color: o.tie });
      hangingChain(ctx, { bone: 'Head', offset: [knot.x, knot.y - ctx.m.joints.get('Head').y, knot.z - headC.z], restDir: [0, -1, -0.3], segs: 4, len: headR * (o.length ?? 2.0) / 4, w0: headR * 0.4, w1: headR * 0.2, thick: headR * 0.3, color: o.color, slot: 'hair', stiffness: 55, damping: 0.85, gravity: 9, wind: 0.8 });
    }
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [i * 0.3, 0.45, 0.88], headR * 0.55, headR * 0.15, [i * headR * 0.08, -headR * 0.55, headR * 0.05]);
  },

  // INUMAKI: bowl cut with a curtain fringe covering the eyes
  bowl(ctx, o) {
    const { headR } = ctx.m;
    cap(ctx, o.color, { low: 0.42, thick: 1.13, back: 1.1, sides: 1.08 });
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.24;
      spike(ctx, o.color, [Math.sin(a) * 0.95, 0.3, 0.92], headR * (o.fringe ?? 0.75), headR * 0.15, [Math.sin(a) * headR * 0.04, -headR * 1.1, headR * 0.02]);
    }
  },

  // RYU: the pompadour
  pompadour(ctx, o) {
    const { headR, headC } = ctx.m;
    cap(ctx, o.color, { low: 0.15, thick: 1.1, back: 1.15 });
    const g = new THREE.SphereGeometry(headR * 0.72, 16, 12);
    g.scale(1.05, 0.85, 1.35);
    ctx.bag.add('hair', tGeo(g, { rot: [-18, 0, 0], pos: [headC.x, headC.y + headR * 0.78, headC.z + headR * 0.45] }), { bone: 'Head', color: o.color });
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [i * 0.35, 0.95, 0.15], headR * 0.6, headR * 0.16, [i * headR * 0.1, headR * 0.1, -headR * 0.7]);
  },

  // TAKABA / HIGURUMA: curls — a cap dressed in small spheres
  curly(ctx, o) {
    const { headR, headC } = ctx.m;
    const R = rngFor(ctx);
    cap(ctx, o.color, { low: 0.2, thick: 1.12, back: 1.1, sides: 1.06 });
    for (let i = 0; i < (o.count ?? 26); i++) {
      const a = R() * Math.PI * 2, e = 0.15 + R() * 0.85;
      const dir = [Math.sin(a) * Math.sqrt(1 - e * e), e, Math.cos(a) * Math.sqrt(1 - e * e)];
      if (dir[2] > 0.6 && dir[1] < 0.35) continue;
      const p = skinPoint(ctx, dir, 0.10);
      ctx.bag.add('hair', tGeo(new THREE.SphereGeometry(headR * (0.16 + R() * 0.1), 8, 6), { pos: [p.x, p.y, p.z] }), { bone: 'Head', color: i % 5 === 0 && o.streak ? o.streak : o.color });
    }
  },

  // HAKARI / TODO: an undercut — shaved sides, a mass on top pushed forward
  undercut(ctx, o) {
    const { headR, headC } = ctx.m;
    cap(ctx, o.shaved ?? 0x2a2320, { low: 0.1, thick: 1.03 });
    const g = sphereShell(headR * 1.12, { thetaLength: Math.PI * 0.36, seg: 20, rings: 8, scale: [0.82, 1, 1.05] });
    ctx.bag.add('hair', tGeo(g, { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.05] }), { bone: 'Head', color: o.color });
    for (let i = -2; i <= 2; i++) spike(ctx, o.color, [i * 0.25, 0.8, 0.6], headR * 0.75, headR * 0.16, [i * headR * 0.08, -headR * 0.35, headR * 0.3]);
  }
};

export function addHair(ctx, h) {
  if (!h) return;
  const fn = HAIR[h.style] || HAIR.messy;
  fn(ctx, h);
}
