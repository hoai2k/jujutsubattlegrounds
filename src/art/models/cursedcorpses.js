// CURSED CORPSES 呪骸 — Yaga's four quality tiers, as four separate designs.
//
// ======================== REFERENCE SHEET ================================
// Researched 2026-08-20 against CBR's "Masamichi Yaga's Unique Cursed Corpse
// Technique, Explained", Looper's explainer, Gamerant's technique piece and
// the ORICON profile. (jujutsu-kaisen.fandom.com is blocked from this
// session's proxy — see the delivery report. Everything below is either quoted
// from those, or is a stated design decision.)
//
// WHAT THE SOURCE ACTUALLY GIVES, and each clause is a modelling instruction:
//
//   · "A normal Cursed Corpse is usually an INANIMATE OBJECT that is
//     PROGRAMMED to complete a set list of given tasks and LACKS
//     SELF-AWARENESS or its own cursed energy."
//       -> It is an OBJECT first and a body second. Every one of the four
//          below is built out of things a workshop contains — sawn timber,
//          lashing cord, sailcloth, iron banding, dowel pins — rather than out
//          of anatomy. Nothing here has muscle, skin, veins or a mouth.
//
//   · "They feel no pain or fear, and DO NOT FLINCH WHEN STRUCK."
//       -> The faces are BLANK. There is no expression to read on any of the
//          four, and the two upper tiers do not even have eyes, only a
//          maker's mark burnt into the faceplate. The one thing a viewer must
//          never be able to do is wonder what it is thinking.
//
//   · Panda is the exception that proves the rule: THREE souls in one core
//          producing its own cursed energy after three months. So the CORE is
//          the one part of a corpse that is not carpentry — a sealed vessel in
//          the chest with something burning inside it, and its brightness is
//          the tier's whole colour story.
//
// HEIGHTS, against the roster (Yaga is 1.99 m, the students ~1.72-1.80):
//   SCRAP 1.42  ·  STANDARD 1.72  ·  REFINED 1.88  ·  MASTERWORK 2.16
// so the escalation is legible in SILHOUETTE from across the arena before any
// surface detail resolves. That is the payoff of the whole mechanic — the
// opponent must be able to SEE what they let him build — and it is why the
// four are four models rather than one model on a scale slider.
//
// PALETTE (hex), a single family so the four read as one maker's work:
//   raw timber      #6a6154   worked timber   #7d7263   seasoned #8a7c66
//   finished oak    #968a72   lashing cord    #8a7a5e   sailcloth #b8ab90
//   iron banding    #3f4149   pin / rivet     #6b6f78
//   core, per tier  #8a7a5e -> #b59a68 -> #d8c08a -> #f0dca8 (dull to hot)
//
// HOW EACH TIER READS, which is the actual brief:
//   SCRAP       barely held together. Asymmetric limbs, one arm visibly
//               shorter, a head lashed on crooked, cord ends hanging loose, no
//               banding at all, gaps at every joint. It should look like it
//               will fail before it is killed.
//   STANDARD    finished. Symmetrical, sealed at the joints, banded at the
//               shoulders and hips, a sailcloth wrap over the torso, a plain
//               oval faceplate. Competent work by a man in a hurry.
//   REFINED     deliberate. Tapered limbs, iron banding everywhere, a shaped
//               chest plate with the core showing through a slot, a hood of
//               sailcloth, and the first sign of ORNAMENT — a burnt maker's
//               mark on the faceplate.
//   MASTERWORK  finished furniture. Every seam closed, every band inlaid flush,
//               a carved chest cowl, a full mantle, shoulder pauldrons and a
//               core that lights the ground under it. Nothing hanging, nothing
//               loose, nothing improvised.
//
// WHAT SEPARATES THEM FROM THE OTHER FOUR SUMMON FAMILIES — checked against all
// four before committing, as the brief requires:
//   vs MEGUMI'S SHIKIGAMI   those are ANIMALS made of shadow, with fur, scale
//     and feather textures and organic silhouettes. These are furniture.
//   vs GETO'S CURSES        those are CURSED SPIRITS — asymmetric flesh, wrong
//     numbers of eyes, malformed anatomy. These have no anatomy at all.
//   vs MAHITO'S TRANSFIGURED HUMANS  those are the closest call and the most
//     important separation: they are FLESH with SEAMS. A stitched join in
//     skin. These have LASHED JOINTS in TIMBER — a cord binding, not a suture
//     — and the shared vocabulary word ("seam") means two entirely different
//     surfaces. Mahito's read WRONG; Yaga's read UNFINISHED. Different
//     material, different texture family (no `fleshTex` is imported here at
//     all), different failure mode: a transfigured human bursts, a corpse
//     comes apart into planks.
//   vs DAGON'S SEA SHIKIGAMI  those are wet, finned and scaled. These are dry.
//
// All geometry and animation below is original and procedural.
// =========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, roundBox, tGeo, latheY } from '../builders/geo.js';
import { v3, rand, clamp } from '../../core/mathutil.js';
import { toonMaterial } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';
import { projectUV, glow, tex } from '../textures/creature.js';

const CORPSE_RIM = 0xd8c8a8;

// ---------------------------------------------------------------------------
// THE SURFACE — sawn timber, not skin
// ---------------------------------------------------------------------------
// A grain texture built out of long parallel strokes with occasional knots.
// Deliberately NOT a member of the flesh family: it has direction, which skin
// does not, and a viewer reads directional grain as MANUFACTURED before they
// consciously identify the material.
function grainTex(key, { base, dark, knot }) {
  return tex('corpse:' + key, 256, (g, s) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      const y = rand(0, s);
      g.strokeStyle = dark + (Math.random() < 0.4 ? '55' : '28');
      g.lineWidth = rand(0.5, 2.4);
      g.beginPath();
      g.moveTo(0, y);
      // a long shallow arc — grain is never straight and never wavy
      g.bezierCurveTo(s * 0.33, y + rand(-3, 3), s * 0.66, y + rand(-3, 3), s, y + rand(-5, 5));
      g.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const x = rand(0, s), y = rand(0, s), r = rand(4.5, 9);
      g.strokeStyle = knot + '88'; g.lineWidth = 1.6;
      // A knot is a set of NESTED rings, so each one is smaller than the last —
      // and the inner ones have to stop before the radius goes negative, which
      // canvas throws on rather than clamping.
      for (let k = 0; k < 4; k++) {
        const rr = r - k * 1.1;
        if (rr <= 0.4) break;
        g.beginPath(); g.ellipse(x, y, rr, rr * 0.55, rand(-0.4, 0.4), 0, Math.PI * 2); g.stroke();
      }
    }
  });
}

function timberMat(key, colors, o = {}) {
  return toonMaterial({
    // `vertexColors: false` on every material in this file. The character
    // models carry their colour in vertex attributes (see builders/rig.js);
    // these are entity meshes built out of raw geometry with no colour
    // attribute at all, so leaving the default on multiplies everything by
    // black — which is exactly what the first bench pass showed.
    vertexColors: false, color: 0xffffff,
    map: grainTex(key, colors),
    steps: [70, 148, 232, 255], rim: 0.22, rimStart: 0.72, gloss: 0.10,
    rimColor: CORPSE_RIM, warm: 0x2a2016, cool: 0x121826, ...o
  });
}
const ironMat = () => toonMaterial({
  vertexColors: false,
  steps: [38, 112, 200, 255], rim: 0.5, rimStart: 0.62, gloss: 0.62,
  color: 0x3f4149, rimColor: 0xcfd8e8, warm: 0x1a1712, cool: 0x0c1220
});
const cordMat = (c = 0x8a7a5e) => toonMaterial({
  vertexColors: false,
  steps: [72, 150, 255], rim: 0.3, rimStart: 0.68, color: c, rimColor: CORPSE_RIM
});
const clothMat = (c = 0xb8ab90) => toonMaterial({
  vertexColors: false,
  steps: [64, 140, 255], rim: 0.28, rimStart: 0.70, color: c, rimColor: CORPSE_RIM
});

// ---------------------------------------------------------------------------
// helpers, shared across the four plans (same shapes transfigured.js uses, so
// the two files read alike even though they share no material)
// ---------------------------------------------------------------------------
function joint(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function part(parent, geo, mat, { outline = false, thickness = 0.012, uv = 'auto', uvScale = [1, 1] } = {}) {
  if (uv !== 'keep') {
    if (uv === 'auto') { if (!geo.getAttribute('uv')) projectUV(geo, 'cylY', { scale: uvScale }); }
    else projectUV(geo, uv, { scale: uvScale });
  }
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  if (outline) parent.add(makeOutline(mesh, { color: 0x120e0a, thickness }));
  return mesh;
}

// A LASHING — the cord binding that holds one timber to another, and the
// single most characteristic detail of the whole family. `turns` is how many
// times the cord goes round; a SCRAP gets two sloppy turns with the ends left
// hanging, a MASTERWORK gets six tight ones under an inlaid band.
function lashing(host, r, w, turns, mat, { loose = 0, y = 0 } = {}) {
  for (let i = 0; i < turns; i++) {
    const t = turns === 1 ? 0 : i / (turns - 1) - 0.5;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r * (1 + Math.abs(t) * loose * 0.4), w, 5, 12), mat);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = rand(-loose, loose);
    ring.position.y = y + t * w * 2.6;
    host.add(ring);
  }
  // the loose ends — SCRAP only. Two short lengths hanging off the wrap.
  if (loose > 0.05) {
    for (const s of [1, -1]) {
      const end = new THREE.Mesh(tubeBetween(v3(0, y, 0), v3(s * r * 0.5, y - r * 1.6, r * 0.4),
        [w * 0.8, w * 0.4], { radial: 4, hSeg: 2 }), mat);
      host.add(end);
    }
  }
}

// THE CORE — the one part that is not carpentry. A sealed vessel with
// something burning in it, visible through a slot in the chest. Its brightness
// IS the tier.
function core(host, r, color, heat) {
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), ironMat());
  host.add(shell);
  const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.78, 1), glow(color, 0.30 + heat * 0.55));
  host.add(lamp);
  return lamp;
}

// A BAND — flat iron strapping round a joint. STANDARD and up.
function band(host, r, w, mat, { y = 0, inlaid = false } = {}) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(r * (inlaid ? 0.99 : 1.04), w, 4, 14), mat);
  t.rotation.x = Math.PI / 2;
  t.position.y = y;
  t.scale.set(1, 1, 0.92);
  host.add(t);
}

// ---------------------------------------------------------------------------
// THE SHARED CONTRACT
// ---------------------------------------------------------------------------
// Same small interface combat/minion.js drives Mahito's five variants through:
// { group, height, radius, setReveal, setLOD, revealOffset, tick }.
// combat/construction.js needs nothing else, which is why a corpse and a
// transfigured human can stand on the same field with neither system knowing
// the other exists.
//
// THE ONE DIFFERENCE, and it is deliberate: the REVEAL is not an emergence out
// of the floor. Mahito's things CLAW THEIR WAY UP because they were people who
// are now somewhere they should not be. Yaga's are ASSEMBLED — the pieces are
// already standing where they will stand and they PULL TOGETHER, so the reveal
// is a convergence rather than a lift. `assemble(k)` on each plan does that.
function finish(group, { height, radius, tick, assemble, tierKey }) {
  bakeStatic(group);
  const hulls = collectOutlines(group);
  let reveal = 0;
  const api = {
    group, height, radius, tierKey, hulls,
    setLOD(dist) { applyLOD(hulls, dist); },
    // No vertical offset at all: it is built where it stands.
    revealOffset: 0,
    setReveal(k) {
      reveal = clamp(k, 0, 1);
      const e = reveal * reveal * (3 - 2 * reveal);
      assemble(e);
      group.visible = reveal > 0.001;
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// ===========================================================================
// 1 — SCRAP 屑骸 : crude, misshapen, barely fastened
// ===========================================================================
// Every proportion is WRONG and wrong on purpose: the left arm is a third
// longer than the right, the shoulders are at different heights, the head is
// lashed on off-axis, the legs are different thicknesses. No banding anywhere,
// two sloppy cord turns per joint with the ends hanging, and a core so dull it
// barely reads as lit. It should look like it will fail before it is killed.
function buildScrap(S) {
  const g = new THREE.Group();
  const wood = timberMat('scrapA', { base: '#6a6154', dark: '#463f36', knot: '#332d26' });
  const wood2 = timberMat('scrapB', { base: '#5d564b', dark: '#3c362e', knot: '#2b2620' });
  const cord = cordMat(0x8a7a5e);

  const root = joint(g, 0, 0.62 * S, 0);
  const torso = joint(root, 0, 0, 0);
  // a lashed bundle of three staves rather than a body — you can see between them
  for (let i = -1; i <= 1; i++) {
    part(torso, tGeo(roundBox(0.075 * S, 0.42 * S, 0.062 * S, 0.012 * S),
      { rot: [0, 0, i * 5], pos: [i * 0.085 * S, 0, i * 0.012 * S] }), i === 0 ? wood : wood2,
      { outline: i === 0, uvScale: [1, 3] });
  }
  lashing(torso, 0.145 * S, 0.014 * S, 2, cord, { loose: 0.22, y: 0.14 * S });
  lashing(torso, 0.135 * S, 0.014 * S, 2, cord, { loose: 0.22, y: -0.13 * S });
  const lamp = core(joint(torso, 0, 0.05 * S, 0.055 * S), 0.045 * S, 0x8a7a5e, 0.15);

  // THE HEAD, lashed on crooked. A sawn block with a single burnt slot for a
  // face — no eyes, because there is nothing behind them.
  const neck = joint(torso, 0.018 * S, 0.24 * S, 0);
  neck.rotation.z = -0.16; neck.rotation.y = 0.22;
  const head = joint(neck, 0, 0.10 * S, 0);
  part(head, roundBox(0.135 * S, 0.16 * S, 0.125 * S, 0.018 * S), wood, { outline: true, uvScale: [2, 2] });
  part(head, tGeo(roundBox(0.10 * S, 0.016 * S, 0.006 * S, 0.002 * S),
    { rot: [0, 0, 6], pos: [0, 0.005 * S, 0.064 * S] }), cordMat(0x2b241c));
  lashing(neck, 0.05 * S, 0.010 * S, 2, cord, { loose: 0.3, y: 0.03 * S });

  // ARMS — DIFFERENT LENGTHS, and that asymmetry is the whole read.
  const arms = [];
  for (const s of [1, -1]) {
    const long = s === 1;
    const sh = joint(torso, s * 0.135 * S, (long ? 0.19 : 0.215) * S, 0);
    sh.rotation.z = s * (long ? -0.18 : -0.05);
    const l1 = (long ? 0.26 : 0.19) * S;
    part(sh, tubeBetween(v3(0, 0, 0), v3(0, -l1, 0.01 * S), [0.042 * S, 0.034 * S], { radial: 5, hSeg: 2 }),
      long ? wood : wood2, { uv: 'cylY', uvScale: [1, 2] });
    lashing(sh, 0.046 * S, 0.010 * S, 2, cord, { loose: 0.25 });
    const el = joint(sh, 0, -l1, 0.01 * S);
    const l2 = (long ? 0.24 : 0.17) * S;
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -l2, 0), [0.034 * S, 0.026 * S], { radial: 5, hSeg: 2 }),
      long ? wood2 : wood, { uv: 'cylY', uvScale: [1, 2] });
    lashing(el, 0.037 * S, 0.009 * S, 2, cord, { loose: 0.28 });
    const wr = joint(el, 0, -l2, 0);
    // a lashed bundle of dowels for a hand — it does not have fingers, it has
    // sticks that happen to point the right way
    for (let f = -1; f <= 1; f++) {
      part(wr, tubeBetween(v3(f * 0.018 * S, 0, 0), v3(f * 0.030 * S, -0.075 * S, 0.024 * S),
        [0.011 * S, 0.008 * S], { radial: 4, hSeg: 2 }), wood, { uv: 'cylZ' });
    }
    arms.push({ sh, el, wr, side: s, long });
  }

  // LEGS — different thicknesses, and the knees do not line up
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * 0.075 * S, -0.22 * S, 0);
    const thick = s === 1 ? 1.18 : 0.86;
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.22 * S, 0), [0.048 * S * thick, 0.040 * S * thick],
      { radial: 5, hSeg: 2 }), wood2, { uv: 'cylY', uvScale: [1, 2] });
    lashing(hip, 0.052 * S * thick, 0.011 * S, 2, cord, { loose: 0.24 });
    const kn = joint(hip, 0, -0.22 * S, 0);
    part(kn, tubeBetween(v3(0, 0, 0), v3(0, -0.20 * S, 0.01 * S), [0.040 * S * thick, 0.034 * S * thick],
      { radial: 5, hSeg: 2 }), wood, { uv: 'cylY', uvScale: [1, 2] });
    const ft = joint(kn, 0, -0.20 * S, 0);
    part(ft, tGeo(roundBox(0.075 * S, 0.030 * S, 0.13 * S, 0.008 * S), { pos: [0, -0.012 * S, 0.028 * S] }), wood2);
    legs.push({ hip, kn, ft, side: s });
  }

  const pieces = [torso, neck, ...arms.map(a => a.sh), ...legs.map(l => l.hip)];
  const rest = pieces.map(p => p.position.clone());
  const assemble = e => {
    // the pieces drift in from a scatter and snap together. A SCRAP's scatter
    // is the widest and its snap is the loosest — it barely converges.
    pieces.forEach((p, i) => {
      const off = v3(Math.sin(i * 2.1) * 0.55, Math.cos(i * 1.7) * 0.45, Math.sin(i * 3.3) * 0.5).multiplyScalar(S * (1 - e));
      p.position.copy(rest[i]).add(off);
    });
    lamp.material.opacity = 0.45 * e;
  };

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 3);
    t += dt * (2.2 + run * 5);
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // THE GAIT IS BROKEN. The two legs are different lengths, so it limps —
    // one long stride and one short shuffle, and the torso lurches with it.
    legs.forEach((L, i) => {
      const ph = t * 1.5 + i * Math.PI;
      const amp = L.side === 1 ? 0.42 : 0.24;
      L.hip.rotation.x = Math.sin(ph) * amp * (0.35 + run);
      L.kn.rotation.x = Math.max(0, -Math.sin(ph)) * 0.7;
      L.ft.rotation.x = 0.12;
    });
    root.position.y = 0.62 * S + Math.sin(t * 3) * 0.018 * S;
    torso.rotation.z = Math.sin(t * 1.5) * 0.10;
    torso.rotation.x = 0.10 + Math.sin(t * 3) * 0.05;
    neck.rotation.x = Math.sin(t * 1.1) * 0.10;
    arms.forEach((A, i) => {
      const ph = t * 1.5 + (i ? 0 : Math.PI);
      A.sh.rotation.x = Math.sin(ph) * 0.30 * (0.3 + run) - swing * (A.side === 1 ? 2.2 : 0.3);
      A.el.rotation.x = -0.35 - swing * 0.4;
    });
    if (st.hurt) { torso.rotation.x -= 0.4; torso.rotation.z += 0.25; }
    if (st.collapse) {
      // it does not fall over, it COMES APART: the lashings let go and the
      // pieces spread
      const c = st.collapse;
      pieces.forEach((p, i) => {
        p.position.copy(rest[i]).add(v3(Math.sin(i * 2.1), -0.6 - i * 0.1, Math.cos(i * 1.7)).multiplyScalar(S * c * 0.8));
      });
    }
  };

  return finish(g, { height: 1.42 * S, radius: 0.34 * S, tick, assemble, tierKey: 'scrap' });
}

// ===========================================================================
// 2 — STANDARD 呪骸 : a functional cursed corpse
// ===========================================================================
// Symmetrical, sealed, banded at the shoulders and hips, a sailcloth wrap over
// the torso and a plain oval faceplate. Competent work by a man in a hurry:
// there is nothing wrong with it and nothing considered about it.
function buildStandard(S) {
  const g = new THREE.Group();
  const wood = timberMat('stdA', { base: '#7d7263', dark: '#544b3f', knot: '#3c342b' });
  const wood2 = timberMat('stdB', { base: '#6f6557', dark: '#4a4237', knot: '#332d25' });
  const cord = cordMat(0x9a8a68);
  const iron = ironMat();
  const canvas = clothMat(0xb8ab90);

  const root = joint(g, 0, 0.86 * S, 0);
  const torso = joint(root, 0, 0, 0);
  // ONE sealed barrel rather than a bundle of staves — it is closed
  part(torso, latheY([
    [0.115 * S, -0.24 * S], [0.145 * S, -0.10 * S], [0.155 * S, 0.08 * S], [0.128 * S, 0.24 * S]
  ], 14, 0.80), wood, { outline: true, uvScale: [3, 2] });
  band(torso, 0.150 * S, 0.011 * S, iron, { y: 0.16 * S });
  band(torso, 0.150 * S, 0.011 * S, iron, { y: -0.14 * S });
  lashing(torso, 0.152 * S, 0.010 * S, 3, cord, { loose: 0.04, y: 0.01 * S });
  // sailcloth wrap over one shoulder — the first thing that reads as intent
  part(torso, tGeo(roundBox(0.30 * S, 0.20 * S, 0.012 * S, 0.008 * S),
    { rot: [4, 0, 22], pos: [0.02 * S, 0.06 * S, 0.11 * S] }), canvas);
  const lamp = core(joint(torso, 0, 0.06 * S, 0.10 * S), 0.052 * S, 0xb59a68, 0.4);

  const neck = joint(torso, 0, 0.27 * S, 0);
  const head = joint(neck, 0, 0.115 * S, 0);
  part(head, latheY([[0.10 * S, -0.10 * S], [0.115 * S, 0], [0.095 * S, 0.10 * S]], 12, 0.86),
    wood, { outline: true, uvScale: [2, 2] });
  // A PLAIN OVAL FACEPLATE. No eyes. There is nothing to read.
  part(head, tGeo(new THREE.CircleGeometry(0.062 * S, 14),
    { scale: [0.82, 1.15, 1], pos: [0, 0, 0.086 * S] }), iron);
  band(neck, 0.052 * S, 0.009 * S, iron, { y: 0.045 * S });

  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(torso, s * 0.155 * S, 0.20 * S, 0);
    sh.rotation.z = s * -0.10;
    part(sh, tubeBetween(v3(0, 0, 0), v3(0, -0.28 * S, 0.008 * S), [0.052 * S, 0.042 * S], { radial: 7, hSeg: 3 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(sh, 0.055 * S, 0.009 * S, iron, { y: -0.02 * S });
    const el = joint(sh, 0, -0.28 * S, 0.008 * S);
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -0.26 * S, 0), [0.042 * S, 0.034 * S], { radial: 6, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    band(el, 0.045 * S, 0.008 * S, iron, { y: -0.02 * S });
    const wr = joint(el, 0, -0.26 * S, 0);
    part(wr, tGeo(roundBox(0.062 * S, 0.055 * S, 0.045 * S, 0.010 * S), { pos: [0, -0.028 * S, 0.008 * S] }), wood);
    for (let f = -1; f <= 1; f++) {
      part(wr, tubeBetween(v3(f * 0.020 * S, -0.048 * S, 0.010 * S), v3(f * 0.026 * S, -0.088 * S, 0.038 * S),
        [0.012 * S, 0.009 * S], { radial: 4, hSeg: 2 }), wood2, { uv: 'cylZ' });
    }
    arms.push({ sh, el, wr, side: s });
  }

  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * 0.085 * S, -0.26 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.26 * S, 0), [0.058 * S, 0.048 * S], { radial: 7, hSeg: 3 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(hip, 0.060 * S, 0.010 * S, iron, { y: -0.03 * S });
    const kn = joint(hip, 0, -0.26 * S, 0);
    part(kn, tubeBetween(v3(0, 0, 0), v3(0, -0.25 * S, 0.012 * S), [0.048 * S, 0.040 * S], { radial: 6, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    const ft = joint(kn, 0, -0.25 * S, 0.012 * S);
    part(ft, tGeo(roundBox(0.086 * S, 0.036 * S, 0.155 * S, 0.010 * S), { pos: [0, -0.015 * S, 0.032 * S] }), wood);
    legs.push({ hip, kn, ft, side: s });
  }

  const pieces = [torso, neck, ...arms.map(a => a.sh), ...legs.map(l => l.hip)];
  const rest = pieces.map(p => p.position.clone());
  const assemble = e => {
    pieces.forEach((p, i) => {
      const off = v3(Math.sin(i * 2.1) * 0.32, Math.cos(i * 1.7) * 0.26, Math.sin(i * 3.3) * 0.3).multiplyScalar(S * (1 - e));
      p.position.copy(rest[i]).add(off);
    });
    lamp.material.opacity = 0.62 * e;
  };

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 4.5);
    t += dt * (2.6 + run * 6.5);
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // A CORRECT WALK, and that is the whole difference from the SCRAP: even
    // strides, level shoulders, no lurch. It is not graceful; it is REGULAR.
    legs.forEach((L, i) => {
      const ph = t * 1.6 + i * Math.PI;
      L.hip.rotation.x = Math.sin(ph) * 0.40 * (0.35 + run);
      L.kn.rotation.x = Math.max(0, -Math.sin(ph)) * 0.72;
      L.ft.rotation.x = 0.10;
    });
    root.position.y = 0.86 * S + Math.abs(Math.sin(t * 1.6)) * 0.016 * S;
    torso.rotation.x = 0.06 + Math.sin(t * 3.2) * 0.02;
    neck.rotation.x = -0.04;
    arms.forEach((A, i) => {
      const ph = t * 1.6 + (i ? 0 : Math.PI);
      A.sh.rotation.x = Math.sin(ph) * 0.34 * (0.3 + run) - swing * 2.4;
      A.el.rotation.x = -0.30 - swing * 0.5;
    });
    // NOTE: no hurt reaction on the body. It does not flinch (canon) — the
    // only thing a hit does is knock the loose sailcloth.
    if (st.commanded) lamp.material.opacity = 0.62 + Math.sin(t * 9) * 0.2;
    if (st.collapse) {
      const c = st.collapse;
      pieces.forEach((p, i) => {
        p.position.copy(rest[i]).add(v3(Math.sin(i * 2.1), -0.5 - i * 0.08, Math.cos(i * 1.7)).multiplyScalar(S * c * 0.7));
      });
    }
  };

  return finish(g, { height: 1.72 * S, radius: 0.36 * S, tick, assemble, tierKey: 'standard' });
}

// ===========================================================================
// 3 — REFINED 精骸 : deliberate work
// ===========================================================================
// Tapered limbs, banding everywhere, a shaped chest plate with the core showing
// through a cut slot, a sailcloth hood, and the first ORNAMENT — a maker's mark
// burnt into the faceplate. It is longer-limbed than the STANDARD as well as
// taller, which is what sells the LUNGE.
function buildRefined(S) {
  const g = new THREE.Group();
  const wood = timberMat('refA', { base: '#8a7c66', dark: '#5e5342', knot: '#42392d' });
  const wood2 = timberMat('refB', { base: '#7a6d59', dark: '#524839', knot: '#393226' });
  const iron = ironMat();
  const cord = cordMat(0xa89468);
  const hood = clothMat(0xa1957c);

  const root = joint(g, 0, 0.98 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, latheY([
    [0.100 * S, -0.26 * S], [0.140 * S, -0.12 * S], [0.162 * S, 0.06 * S], [0.132 * S, 0.26 * S]
  ], 16, 0.78), wood, { outline: true, uvScale: [3, 2] });
  // A SHAPED CHEST PLATE with a cut slot. Not a strap over a barrel — a fitted
  // panel that was made for this body.
  part(torso, tGeo(latheY([[0.10 * S, -0.10 * S], [0.128 * S, 0.02 * S], [0.104 * S, 0.14 * S]], 14, 0.42),
    { pos: [0, 0.04 * S, 0.075 * S] }), iron);
  const lamp = core(joint(torso, 0, 0.04 * S, 0.115 * S), 0.048 * S, 0xd8c08a, 0.72);
  for (const y of [0.20, -0.06, -0.22]) band(torso, 0.156 * S, 0.009 * S, iron, { y: y * S, inlaid: true });
  // the hood — sailcloth over the shoulders and the back of the head
  part(torso, tGeo(latheY([[0.19 * S, 0], [0.15 * S, 0.14 * S], [0.09 * S, 0.24 * S]], 14, 0.9),
    { pos: [0, 0.20 * S, -0.02 * S] }), hood, { outline: true, uvScale: [2, 1] });

  const neck = joint(torso, 0, 0.29 * S, 0);
  const head = joint(neck, 0, 0.12 * S, 0);
  part(head, latheY([[0.088 * S, -0.11 * S], [0.112 * S, -0.01 * S], [0.086 * S, 0.10 * S]], 14, 0.88),
    wood, { outline: true, uvScale: [2, 2] });
  // faceplate + MAKER'S MARK. Three burnt strokes; the only ornament on the
  // model, and the point where the tier stops being merely functional.
  part(head, tGeo(new THREE.CircleGeometry(0.062 * S, 16), { scale: [0.84, 1.18, 1], pos: [0, 0, 0.084 * S] }), iron);
  for (let i = 0; i < 3; i++) {
    part(head, tGeo(roundBox(0.042 * S, 0.006 * S, 0.004 * S, 0.001 * S),
      { rot: [0, 0, -18 + i * 18], pos: [0, (i - 1) * 0.017 * S, 0.088 * S] }), cordMat(0x2a2018));
  }
  band(neck, 0.050 * S, 0.008 * S, iron, { y: 0.05 * S, inlaid: true });

  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(torso, s * 0.163 * S, 0.21 * S, 0);
    sh.rotation.z = s * -0.12;
    // TAPERED: the upper arm is noticeably fatter at the shoulder than at the
    // elbow, which reads as shaped stock rather than as a cut length of dowel
    part(sh, tubeBetween(v3(0, 0, 0), v3(0, -0.315 * S, 0.008 * S), [0.056 * S, 0.038 * S], { radial: 8, hSeg: 4 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(sh, 0.058 * S, 0.008 * S, iron, { y: -0.01 * S, inlaid: true });
    // a shoulder cap — the silhouette change that reads at distance
    part(sh, tGeo(latheY([[0.072 * S, 0], [0.058 * S, 0.05 * S]], 10, 0.9), { pos: [0, 0.01 * S, 0] }), iron);
    const el = joint(sh, 0, -0.315 * S, 0.008 * S);
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -0.295 * S, 0), [0.040 * S, 0.028 * S], { radial: 7, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    band(el, 0.042 * S, 0.007 * S, iron, { y: -0.02 * S, inlaid: true });
    const wr = joint(el, 0, -0.295 * S, 0);
    part(wr, tGeo(roundBox(0.058 * S, 0.052 * S, 0.044 * S, 0.010 * S), { pos: [0, -0.026 * S, 0.008 * S] }), wood);
    for (let f = -1; f <= 1; f++) {
      const fj = joint(wr, f * 0.020 * S, -0.046 * S, 0.012 * S);
      part(fj, tubeBetween(v3(0, 0, 0), v3(f * 0.010 * S, -0.048 * S, 0.030 * S), [0.011 * S, 0.007 * S],
        { radial: 4, hSeg: 2 }), wood2, { uv: 'cylZ' });
      // an iron claw cap on each dowel — this one is built to hit things
      part(fj, tGeo(coneSpike(0.010 * S, 0.030 * S, v3(0, 0, 0.012 * S), { radial: 4, hSeg: 2 }),
        { rot: [110, 0, 0], pos: [f * 0.012 * S, -0.052 * S, 0.036 * S] }), iron);
    }
    arms.push({ sh, el, wr, side: s });
  }

  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * 0.090 * S, -0.28 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.29 * S, 0), [0.062 * S, 0.044 * S], { radial: 8, hSeg: 3 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(hip, 0.064 * S, 0.009 * S, iron, { y: -0.02 * S, inlaid: true });
    const kn = joint(hip, 0, -0.29 * S, 0);
    part(kn, tubeBetween(v3(0, 0, 0), v3(0, -0.275 * S, 0.014 * S), [0.046 * S, 0.036 * S], { radial: 7, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    const ft = joint(kn, 0, -0.275 * S, 0.014 * S);
    part(ft, tGeo(roundBox(0.088 * S, 0.034 * S, 0.170 * S, 0.010 * S), { pos: [0, -0.014 * S, 0.036 * S] }), wood);
    part(ft, tGeo(roundBox(0.090 * S, 0.010 * S, 0.030 * S, 0.003 * S), { pos: [0, -0.030 * S, 0.100 * S] }), iron);
    legs.push({ hip, kn, ft, side: s });
  }

  const pieces = [torso, neck, ...arms.map(a => a.sh), ...legs.map(l => l.hip)];
  const rest = pieces.map(p => p.position.clone());
  const assemble = e => {
    pieces.forEach((p, i) => {
      const off = v3(Math.sin(i * 2.1) * 0.22, Math.cos(i * 1.7) * 0.18, Math.sin(i * 3.3) * 0.2).multiplyScalar(S * (1 - e));
      p.position.copy(rest[i]).add(off);
    });
    lamp.material.opacity = 0.80 * e;
  };

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 5.5);
    t += dt * (3.0 + run * 7.5);
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    const lunge = st.action === 'lunge' ? 1 : 0;
    legs.forEach((L, i) => {
      const ph = t * 1.75 + i * Math.PI;
      L.hip.rotation.x = Math.sin(ph) * 0.48 * (0.35 + run) - lunge * 0.5;
      L.kn.rotation.x = Math.max(0, -Math.sin(ph)) * 0.8 + lunge * 0.3;
      L.ft.rotation.x = 0.08;
    });
    root.position.y = 0.98 * S + Math.abs(Math.sin(t * 1.75)) * 0.018 * S - lunge * 0.10 * S;
    torso.rotation.x = 0.05 + Math.sin(t * 3.4) * 0.02 + lunge * 0.45;
    neck.rotation.x = -0.05 - lunge * 0.2;
    arms.forEach((A, i) => {
      const ph = t * 1.75 + (i ? 0 : Math.PI);
      A.sh.rotation.x = Math.sin(ph) * 0.36 * (0.3 + run) - swing * 2.6 - lunge * 1.9;
      A.el.rotation.x = -0.26 - swing * 0.6 - lunge * 0.5;
    });
    lamp.material.opacity = 0.80 + (st.commanded ? Math.sin(t * 10) * 0.18 : Math.sin(t * 2.4) * 0.06);
    if (st.collapse) {
      const c = st.collapse;
      pieces.forEach((p, i) => {
        p.position.copy(rest[i]).add(v3(Math.sin(i * 2.1), -0.45 - i * 0.07, Math.cos(i * 1.7)).multiplyScalar(S * c * 0.6));
      });
    }
  };

  return finish(g, { height: 1.88 * S, radius: 0.38 * S, tick, assemble, tierKey: 'refined' });
}

// ===========================================================================
// 4 — MASTERWORK 傑作 : finished furniture
// ===========================================================================
// Every seam closed, every band inlaid flush, a carved chest cowl, a full
// mantle, shoulder pauldrons and a core bright enough to light the ground under
// it. NOTHING HANGS, NOTHING IS LOOSE, NOTHING IS IMPROVISED — which is the
// exact inverse of the SCRAP, and the pair of them at either end of the meter
// is the visual argument for the whole mechanic.
function buildMasterwork(S) {
  const g = new THREE.Group();
  const wood = timberMat('mwA', { base: '#968a72', dark: '#665b48', knot: '#4a4133' });
  const wood2 = timberMat('mwB', { base: '#877b64', dark: '#5c5241', knot: '#413a2d' });
  const iron = ironMat();
  const mantle = clothMat(0xc4b696);

  const root = joint(g, 0, 1.16 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, latheY([
    [0.105 * S, -0.30 * S], [0.152 * S, -0.14 * S], [0.178 * S, 0.06 * S], [0.146 * S, 0.30 * S]
  ], 20, 0.76), wood, { outline: true, uvScale: [3, 2] });
  // THE CARVED COWL — a fitted, shaped chest piece with the core recessed into
  // it. The single most "made" object on any of the four models.
  part(torso, tGeo(latheY([
    [0.104 * S, -0.14 * S], [0.140 * S, -0.02 * S], [0.132 * S, 0.10 * S], [0.096 * S, 0.19 * S]
  ], 18, 0.46), { pos: [0, 0.03 * S, 0.086 * S] }), iron);
  const lamp = core(joint(torso, 0, 0.02 * S, 0.135 * S), 0.058 * S, 0xf0dca8, 1.0);
  // a pool of light on the ground under it — it is bright enough to matter
  const pool = new THREE.Mesh(new THREE.CircleGeometry(0.55 * S, 20), glow(0xf0dca8, 0.16));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = -1.15 * S + 0.02;
  torso.add(pool);
  for (const y of [0.24, 0.02, -0.18, -0.28]) band(torso, 0.172 * S, 0.010 * S, iron, { y: y * S, inlaid: true });
  // THE MANTLE — a full sailcloth cape off both shoulders, the silhouette
  // signature of the tier
  part(torso, tGeo(latheY([[0.22 * S, 0], [0.24 * S, -0.20 * S], [0.20 * S, -0.42 * S]], 18, 0.92),
    { pos: [0, 0.22 * S, -0.05 * S] }), mantle, { outline: true, uvScale: [2, 2] });

  const neck = joint(torso, 0, 0.33 * S, 0);
  const head = joint(neck, 0, 0.13 * S, 0);
  part(head, latheY([[0.090 * S, -0.12 * S], [0.120 * S, -0.01 * S], [0.092 * S, 0.11 * S]], 16, 0.90),
    wood, { outline: true, uvScale: [2, 2] });
  // a CROWN band and a full faceplate with the maker's mark inlaid in iron
  // rather than burnt — the difference between a signature and a brand
  band(head, 0.098 * S, 0.010 * S, iron, { y: 0.055 * S });
  part(head, tGeo(new THREE.CircleGeometry(0.068 * S, 18), { scale: [0.86, 1.20, 1], pos: [0, 0, 0.088 * S] }), iron);
  for (let i = 0; i < 3; i++) {
    part(head, tGeo(roundBox(0.048 * S, 0.007 * S, 0.005 * S, 0.001 * S),
      { rot: [0, 0, -18 + i * 18], pos: [0, (i - 1) * 0.019 * S, 0.093 * S] }), glow(0xf0dca8, 0.7));
  }

  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(torso, s * 0.180 * S, 0.23 * S, 0);
    sh.rotation.z = s * -0.13;
    // PAULDRON — a shaped iron shoulder plate. The tier's other silhouette cue.
    part(sh, tGeo(latheY([[0.088 * S, 0.03 * S], [0.096 * S, -0.02 * S], [0.070 * S, -0.07 * S]], 12, 0.92),
      { pos: [0, 0.02 * S, 0] }), iron, { outline: true, thickness: 0.014 });
    part(sh, tubeBetween(v3(0, 0, 0), v3(0, -0.345 * S, 0.008 * S), [0.062 * S, 0.042 * S], { radial: 9, hSeg: 4 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(sh, 0.064 * S, 0.008 * S, iron, { y: -0.16 * S, inlaid: true });
    const el = joint(sh, 0, -0.345 * S, 0.008 * S);
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -0.320 * S, 0), [0.044 * S, 0.032 * S], { radial: 8, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    band(el, 0.046 * S, 0.007 * S, iron, { y: -0.02 * S, inlaid: true });
    const wr = joint(el, 0, -0.320 * S, 0);
    part(wr, tGeo(roundBox(0.068 * S, 0.060 * S, 0.050 * S, 0.012 * S), { pos: [0, -0.030 * S, 0.008 * S] }), wood);
    for (let f = -1; f <= 1; f++) {
      const fj = joint(wr, f * 0.022 * S, -0.052 * S, 0.012 * S);
      part(fj, tubeBetween(v3(0, 0, 0), v3(f * 0.010 * S, -0.056 * S, 0.034 * S), [0.013 * S, 0.008 * S],
        { radial: 5, hSeg: 2 }), wood2, { uv: 'cylZ' });
      part(fj, tGeo(coneSpike(0.012 * S, 0.036 * S, v3(0, 0, 0.014 * S), { radial: 5, hSeg: 2 }),
        { rot: [110, 0, 0], pos: [f * 0.013 * S, -0.060 * S, 0.042 * S] }), iron);
    }
    arms.push({ sh, el, wr, side: s });
  }

  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * 0.100 * S, -0.32 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.33 * S, 0), [0.070 * S, 0.050 * S], { radial: 9, hSeg: 3 }),
      wood, { uv: 'cylY', uvScale: [1, 2] });
    band(hip, 0.072 * S, 0.009 * S, iron, { y: -0.02 * S, inlaid: true });
    const kn = joint(hip, 0, -0.33 * S, 0);
    part(kn, tubeBetween(v3(0, 0, 0), v3(0, -0.315 * S, 0.016 * S), [0.052 * S, 0.040 * S], { radial: 8, hSeg: 3 }),
      wood2, { uv: 'cylY', uvScale: [1, 2] });
    band(kn, 0.054 * S, 0.008 * S, iron, { y: -0.02 * S, inlaid: true });
    const ft = joint(kn, 0, -0.315 * S, 0.016 * S);
    part(ft, tGeo(roundBox(0.100 * S, 0.040 * S, 0.190 * S, 0.012 * S), { pos: [0, -0.016 * S, 0.040 * S] }), wood);
    part(ft, tGeo(roundBox(0.102 * S, 0.012 * S, 0.036 * S, 0.004 * S), { pos: [0, -0.036 * S, 0.112 * S] }), iron);
    legs.push({ hip, kn, ft, side: s });
  }

  const pieces = [torso, neck, ...arms.map(a => a.sh), ...legs.map(l => l.hip)];
  const rest = pieces.map(p => p.position.clone());
  const assemble = e => {
    // THE TIGHTEST CONVERGENCE OF THE FOUR. It barely scatters at all — the
    // pieces are already almost where they belong, which is the read: this one
    // was made, not assembled in a panic.
    pieces.forEach((p, i) => {
      const off = v3(Math.sin(i * 2.1) * 0.12, Math.cos(i * 1.7) * 0.10, Math.sin(i * 3.3) * 0.11).multiplyScalar(S * (1 - e));
      p.position.copy(rest[i]).add(off);
    });
    lamp.material.opacity = 0.92 * e;
    pool.material.opacity = 0.16 * e;
  };

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 6);
    t += dt * (2.9 + run * 7);
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    const lunge = st.action === 'lunge' ? 1 : 0;
    const slam = st.action === 'slam' ? (st.actionK ?? 0) : 0;
    legs.forEach((L, i) => {
      const ph = t * 1.65 + i * Math.PI;
      L.hip.rotation.x = Math.sin(ph) * 0.46 * (0.35 + run) - lunge * 0.5 + slam * 0.3;
      L.kn.rotation.x = Math.max(0, -Math.sin(ph)) * 0.78 + lunge * 0.3 + slam * 0.55;
      L.ft.rotation.x = 0.06;
    });
    root.position.y = 1.16 * S + Math.abs(Math.sin(t * 1.65)) * 0.020 * S - lunge * 0.10 * S - slam * 0.22 * S;
    torso.rotation.x = 0.04 + Math.sin(t * 3.1) * 0.015 + lunge * 0.42 + slam * 0.5;
    neck.rotation.x = -0.06 - lunge * 0.18;
    arms.forEach((A, i) => {
      const ph = t * 1.65 + (i ? 0 : Math.PI);
      // THE SLAM is BOTH arms overhead and down together — the only two-handed
      // action in the family, and the reason it reads as a different move
      // rather than as a bigger swipe.
      A.sh.rotation.x = Math.sin(ph) * 0.32 * (0.3 + run) - swing * 2.7 - lunge * 2.0
        - (slam < 0.55 ? slam * 5.4 : (1 - slam) * 6.6);
      A.el.rotation.x = -0.24 - swing * 0.6 - lunge * 0.5 - slam * 0.4;
    });
    lamp.material.opacity = 0.92 + (st.commanded ? Math.sin(t * 11) * 0.08 : Math.sin(t * 2.2) * 0.05);
    pool.material.opacity = 0.16 + Math.sin(t * 2.2) * 0.03;
    if (st.collapse) {
      const c = st.collapse;
      pieces.forEach((p, i) => {
        p.position.copy(rest[i]).add(v3(Math.sin(i * 2.1), -0.4 - i * 0.06, Math.cos(i * 1.7)).multiplyScalar(S * c * 0.55));
      });
    }
  };

  return finish(g, { height: 2.16 * S, radius: 0.42 * S, tick, assemble, tierKey: 'masterwork' });
}

const BUILDERS = {
  scrap: buildScrap, standard: buildStandard, refined: buildRefined, masterwork: buildMasterwork
};
export const CORPSE_IDS = Object.keys(BUILDERS);

export function buildCursedCorpse(tierKey, { scale = 1 } = {}) {
  const b = BUILDERS[tierKey] || BUILDERS.standard;
  return b(scale);
}
