// ===========================================================================
// DAGON'S OCEAN SHIKIGAMI — REFERENCE SHEET
// ===========================================================================
// The four creatures that fill HORIZON OF THE CAPTIVATING SKANDHA. Built to
// the same standard as Megumi's Ten Shadows (art/models/shikigami.js): real
// bodies, a hierarchy shaped like the animal rather than the humanoid rig, and
// an animator per body plan. They share that file's construction helpers
// deliberately — `joint`, `part`, `ellipsoid`, `markDecal` and the creature
// texture library — so the two summoners' menageries are visibly one system.
//
// ---------------------------------------------------------------------------
// RESEARCH — ALL FOUR ARE CANON, AND THE ROLES FELL OUT OF THE RESEARCH
// ---------------------------------------------------------------------------
// The brief SUGGESTED four roles (a fast darting swarm, a heavy body-blocker,
// a ranged spitter, and a large rare late threat) and asked what he actually
// summons. Researched against the Jujutsu Kaisen Wiki's Dagon and Horizon of
// the Captivating Skandha entries and the surrounding coverage of the Shibuya
// sequence. The answer, quoted: he conjures "a broad range of man-eating
// shikigami, eel-like sea serpents, piranha swarms, small sharks, and tough
// crustaceans", scaling "from medium-sized fish to gigantic sea beasts".
//
// So NO GAPS HAD TO BE FILLED. The four here are the four canon families, and
// each one landed on a suggested role without being pushed:
//
//   PIRANHA SHOAL   canon "piranha swarms"    -> the fast darting swarm
//   ARMOURED CRAB   canon "tough crustaceans" -> the heavy body-blocker
//   EEL-SERPENT     canon "eel-like sea       -> the ranged one
//                   serpents"
//   GREAT SHARK     canon "small sharks", and -> the large, rare, late threat
//                   the "gigantic sea beasts"
//
// The extension technique that produces them inside the domain is named in the
// research as DEATH SWARM (死累累湧軍) — "a virtually endless swarm of fish
// monster shikigami [attacking] from all sides", which is the sure-hit payload
// the brief asks for, described in the source almost word for word.
//
// ---------------------------------------------------------------------------
// THEY ARE NOT ONE MODEL RESCALED — the thing the brief is most worried about
// ---------------------------------------------------------------------------
// Four different body plans, four different silhouettes, four different gaits:
//
//   PIRANHA   0.34 m. A deep, laterally-flattened disc with an underslung jaw
//             — nearly as tall as it is long, which is the piranha read. Comes
//             in a SHOAL of one mesh with many instanced bodies, because
//             fifteen separate fish is fifteen draw calls and the whole point
//             of them is that there are a lot. Gait: a fast, twitchy tail beat
//             with the whole shoal weaving as a unit.
//   CRAB      1.05 m across. WIDE and low, a hexagonal carapace on eight legs
//             with two heavy claws. The only one of the four that touches the
//             ground, and the only one that walks. Gait: an eight-legged
//             sideways scuttle with the carapace rocking.
//   EEL       2.4 m. A 14-link chain, thin, with a long dorsal fin ribbon and
//             a blunt tubular head. Gait: a travelling sine down the whole
//             body, which is a completely different animation problem from the
//             other three and is why it gets its own link array.
//   SHARK     3.6 m. The big one. A proper fusiform torpedo with a tall
//             dorsal, a crescent tail, pectorals, and a jaw that OPENS — the
//             only rigged jaw in the set. Gait: slow, powerful, wide-amplitude
//             tail sweep, and it barely turns.
//
// ---------------------------------------------------------------------------
// PALETTE — the one place they deliberately agree
// ---------------------------------------------------------------------------
// All four are the DEEP-SEA counter-shade: a dark blue-grey dorsal fading to a
// pale belly, with one warm accent per species so they can be told apart in a
// swarm at distance. That warm accent is doing real gameplay work — at peak
// spawn there can be 22 bodies on screen and the player has to know which one
// is the shark.
//   piranha  dorsal #2f4b5c  belly #cfd8d4  accent #d9483c  (the red gill/eye)
//   crab     shell  #4a5f63  belly #d2cdb8  accent #e0a03c  (the claw tips)
//   eel      dorsal #26414f  belly #b9c6c2  accent #7fe0c8  (the lure glow)
//   shark    dorsal #38505e  belly #dbe2dd  accent #c8503e  (the gums)
// Deliberately COLD against Dagon's own crimson: he should never be mistaken
// for one of his own creatures, and in his domain he is the only warm thing on
// the beach.
//
// ---------------------------------------------------------------------------
// WET, AND THE SAME WET AS HIM
// ---------------------------------------------------------------------------
// Every one of them shades through `seaMat` below, which is the same high
// gloss / wide cold rim combination art/models/dagon.js uses for his skin. The
// creatures and the summoner are made of the same substance and it should be
// visible; it is also what separates them at a glance from the Ten Shadows,
// whose fur and scale materials are matte.
//
// ---------------------------------------------------------------------------
// PERFORMANCE — designed for the cap, not trimmed down to it afterwards
// ---------------------------------------------------------------------------
// The domain's spawn escalates to a hard cap of 22 concurrent bodies, so every
// decision here was made against that number:
//   · the PIRANHA is a SHOAL — one model, `count` bodies, one animator, and it
//     counts as ONE against the concurrent cap. That is what makes the late
//     game read as a swarm without costing twenty entities.
//   · every rigid mesh is merged by `bakeStatic` before the model is handed
//     out, exactly as the Ten Shadows are.
//   · only the silhouette masses get outline hulls, and `setLOD` drops them at
//     range — the same call the shikigami system already makes per frame.
//   · no creature carries a decal, a canvas texture larger than 256, or a
//     second material it does not need.
// Measured cost at the cap is in the delivery report.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the source shows these creatures in motion, in bulk, at speed, and
//     mostly mid-devour. There is no character sheet for any of them. Their
//     PROPORTIONS are real-animal proportions (piranha, portunid crab, moray,
//     requiem shark) pushed toward the source's blunt, heavy, wrong-looking
//     read, rather than traced from a panel.
//   · the "gigantic sea beasts as large as a low-rise building" are NOT built.
//     The shark stands in for the top of the scale at 3.6 m, which is the
//     largest thing that can move around a 12 m interior without the domain
//     becoming unplayable indoors.
//   · the crab's leg count is eight plus two claws (a real portunid); the
//     source's crustaceans are not clearly countable.
// ===========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, tGeo, mergeGeos, roundBox } from '../builders/geo.js';
import { v3, rand } from '../../core/mathutil.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';
import { joint, part, ellipsoid } from './shikigami.js';
import { toonMaterial } from '../shaders/toon.js';
import { scaleTex, voidMat, glow, chitinTex } from '../textures/creature.js';

// ---------------------------------------------------------------------------
// THE SHARED SURFACE — the same wet response Dagon's own skin uses
// ---------------------------------------------------------------------------
const _matCache = new Map();
function seaMat(map) {
  if (!_matCache.has(map)) {
    _matCache.set(map, toonMaterial({
      map, vertexColors: false, steps: [58, 132, 255],
      gloss: 0.66, rim: 0.54, rimStart: 0.54, rimColor: 0xbfe8ff,
      warm: 0x14202a, cool: 0x0a1826
    }));
  }
  return _matCache.get(map);
}

// ---------------------------------------------------------------------------
// THE SURFACE POOL — this family's answer to the Ten Shadows' shadow pool
// ---------------------------------------------------------------------------
// Megumi's creatures rise out of a disc of shadow. Dagon's rise out of WATER,
// so the emergence marker is a pale ring of disturbed surface with a foam edge
// rather than a black hole. Same contract: it scales and fades with `reveal`,
// so the summon system's existing emergence handling drives it unmodified.
function surfacePool(r) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 20),
    new THREE.MeshBasicMaterial({ color: 0x2e6f80, transparent: true, opacity: 0.34, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.012;
  const foam = new THREE.Mesh(new THREE.RingGeometry(r * 0.86, r * 1.06, 22),
    new THREE.MeshBasicMaterial({ color: 0xe8f4f6, transparent: true, opacity: 0.5, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.018;
  g.add(disc, foam);
  g.renderOrder = 2;
  return g;
}

// Same shape as shikigami.js `finish`, with the water pool in place of the
// shadow pool and a `swim` flag so the summon system knows this body has no
// business being pinned to the floor.
function finishSea(body, { height, radius, poolR, tick, swim = true, extras = null }) {
  const group = new THREE.Group();
  const pool = surfacePool(poolR ?? radius * 1.2);
  group.add(pool, body);
  bakeStatic(body);
  const hulls = collectOutlines(body);
  let reveal = 0;
  const api = {
    group, body, pool, height, radius, hulls, swim, extras: extras || {},
    setLOD(dist) { applyLOD(hulls, dist); },
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      body.position.y = (e - 1) * height * 1.05;
      const s = 0.62 + e * 0.38;
      body.scale.setScalar(s);
      pool.scale.setScalar(0.5 + e * 0.8);
      pool.children[0].material.opacity = 0.34 * (1 - e * 0.4);
      pool.children[1].material.opacity = 0.12 + (1 - e) * 0.55;
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// A fin membrane: a flat triangular-ish blade, used for dorsals, pectorals and
// tails across all four species so the family reads as one.
function finBlade(len, base, tip, thick = 0.012, sweep = 0.35) {
  const pts = [];
  const idx = [];
  const rows = 5;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const w = (base + (tip - base) * t) * 0.5;
    const y = len * t;
    const back = -sweep * len * t * t;
    for (const s of [-1, 1]) {
      pts.push(s * w, y, back + thick * 0.5, s * w, y, back - thick * 0.5);
    }
  }
  for (let i = 0; i < rows; i++) {
    const a = i * 4, b = (i + 1) * 4;
    idx.push(a, a + 2, b, a + 2, b + 2, b);
    idx.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
    idx.push(a, b, a + 1, a + 1, b, b + 1);
    idx.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ===========================================================================
// 1 — PIRANHA SHOAL 群魚 : the fast darting swarm
// ===========================================================================
// Canon: "piranha swarms". ONE model, `count` bodies, ONE animator, and it
// occupies ONE slot against the domain's concurrent cap — see the performance
// note in the header. Each fish is a deep laterally-flattened disc: at 0.34 m
// long it is 0.26 m tall, which is the proportion that says piranha rather
// than minnow, plus an underslung jaw and a red gill flash.
export function buildPiranhaShoal(count = 14) {
  const S = 1.0;
  const body = new THREE.Group();
  const hide = scaleTex('piranha', {
    base: '#2f4b5c', edge: '#1b2f3c', dark: '#152430', band: '#d9483c', bandEvery: 3, rows: 14
  });
  const M = seaMat(hide);
  const bellyTex = scaleTex('piranhaBelly', {
    base: '#cfd8d4', edge: '#a8b4b2', dark: '#8fa09e', rows: 12
  });
  const MB = seaMat(bellyTex);

  const fish = [];
  for (let i = 0; i < count; i++) {
    // scattered through a loose ball; the animator keeps them in it
    const a = rand(0, Math.PI * 2), r = rand(0.25, 1.15) * S;
    const g = joint(body, Math.cos(a) * r, rand(0.25, 1.15) * S, Math.sin(a) * r);
    g.rotation.y = rand(0, Math.PI * 2);
    const sc = rand(0.82, 1.18);
    g.scale.setScalar(sc);
    // the disc — tall, thin, short
    part(g, ellipsoid(0.055 * S, 0.130 * S, 0.170 * S, 9), M, { outline: i < 4, thickness: 0.008 });
    part(g, tGeo(ellipsoid(0.048 * S, 0.062 * S, 0.130 * S, 8), { pos: [0, -0.070 * S, 0.010 * S] }), MB);
    // the underslung jaw — the piranha read, and it is a separate joint so it
    // can champ
    const jaw = joint(g, 0, -0.038 * S, 0.128 * S);
    part(jaw, tGeo(ellipsoid(0.044 * S, 0.036 * S, 0.056 * S, 7), { pos: [0, -0.014 * S, 0.020 * S] }), M);
    // teeth: one merged sawtooth strip rather than eight cones
    const teeth = [];
    for (let k = -2; k <= 2; k++) {
      teeth.push(tGeo(coneSpike(0.007 * S, 0.024 * S, v3(0, 0, 0), { radial: 4 }),
        { rot: [186, 0, 0], pos: [k * 0.014 * S, 0.004 * S, 0.052 * S] }));
    }
    part(jaw, mergeGeos(teeth), MB);
    // the tail, and the eye
    const tail = joint(g, 0, 0, -0.155 * S);
    part(tail, tGeo(finBlade(0.105 * S, 0.020 * S, 0.115 * S, 0.006 * S, 0.55),
      { rot: [90, 0, 0] }), M);
    for (const s of [1, -1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.019 * S, 6, 5), voidMat(0x1a0a0c));
      eye.position.set(s * 0.048 * S, 0.030 * S, 0.108 * S);
      g.add(eye);
      const glint = new THREE.Mesh(new THREE.CircleGeometry(0.011 * S, 6), glow(0xd9483c, 0.85));
      glint.position.set(s * 0.056 * S, 0.032 * S, 0.116 * S);
      glint.rotation.y = s * 1.3;
      g.add(glint);
    }
    fish.push({ g, jaw, tail, phase: rand(0, 6.28), rate: rand(9, 13), orbit: rand(0.6, 1.4), a, r });
  }

  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const drive = 0.4 + (st.speed ?? 0) * 0.10;
    const bite = st.action === 'bite' ? (st.actionK ?? 0) : 0;
    for (const f of fish) {
      // tail beat, and the whole fish yaws with it
      const beat = Math.sin(t * f.rate * drive + f.phase);
      f.tail.rotation.y = beat * 0.7;
      f.g.rotation.z = beat * 0.10;
      // the shoal WEAVES — each fish orbits its own slot, so the ball churns
      // rather than translating rigidly
      const w = t * f.orbit + f.phase;
      f.g.position.x = Math.cos(f.a) * f.r + Math.sin(w) * 0.12 * S;
      f.g.position.y = Math.max(0.12 * S, f.g.position.y * 0 + (0.25 + f.r * 0.6) * S + Math.cos(w * 1.3) * 0.14 * S);
      f.g.position.z = Math.sin(f.a) * f.r + Math.cos(w * 0.8) * 0.12 * S;
      f.jaw.rotation.x = 0.10 + bite * 0.75 + Math.abs(beat) * 0.05;
      if (st.hurt) f.g.rotation.x = 0.4;
      else f.g.rotation.x = beat * 0.05;
    }
  };

  return finishSea(body, { height: 1.30 * S, radius: 1.20 * S, poolR: 1.30 * S, tick, extras: { count } });
}

// ===========================================================================
// 2 — ARMOURED CRAB 甲殻 : the heavy body-blocker
// ===========================================================================
// Canon: "tough crustaceans". The only one of the four that walks on the
// ground, and the only wide silhouette in the set — 1.05 m across against
// 0.34 m of piranha, which is what makes it read as cover from across the
// arena. Eight legs, two heavy claws, a hexagonal carapace with a hard chitin
// surface (the one place this family departs from fish skin, deliberately, so
// "armoured" is a material claim and not just a stat).
export function buildArmouredCrab() {
  const S = 1.0;
  const body = new THREE.Group();
  const shell = chitinTex('crabShell', { base: '#4a5f63', plate: '#35474b', rim: '#7f9a9c', bands: 10 });
  const M = seaMat(shell);
  const under = scaleTex('crabUnder', { base: '#d2cdb8', edge: '#b0a992', dark: '#95907c', rows: 10 });
  const MU = seaMat(under);
  const claw = chitinTex('crabClaw', { base: '#5b6f6e', plate: '#e0a03c', rim: '#f0c878', bands: 6 });
  const MC = seaMat(claw);

  const root = joint(body, 0, 0.42 * S, 0);
  const carapace = joint(root, 0, 0, 0);
  // the shell: wide, low, hexagonal in plan. A scaled sphere plus a rim ridge.
  part(carapace, ellipsoid(0.52 * S, 0.20 * S, 0.38 * S, 14), M, { outline: true, thickness: 0.016, uvScale: [2, 2] });
  part(carapace, tGeo(new THREE.TorusGeometry(0.50 * S, 0.035 * S, 6, 18), { rot: [90, 0, 0], pos: [0, -0.02 * S, 0] }), M);
  // spines along the front edge — a real portunid has them and they are what
  // stops the carapace reading as a pebble
  for (let i = -3; i <= 3; i++) {
    part(carapace, tGeo(coneSpike(0.030 * S, 0.090 * S, v3(0, 0, 0.03 * S), { radial: 5 }),
      { rot: [72, i * 9, 0], pos: [i * 0.13 * S, 0.02 * S, 0.30 * S] }), M);
  }
  // the underside plate
  part(carapace, tGeo(ellipsoid(0.42 * S, 0.09 * S, 0.30 * S, 12), { pos: [0, -0.15 * S, 0] }), MU);

  // eyes on stalks — the detail that makes it alive rather than a rock
  const stalks = [];
  for (const s of [1, -1]) {
    const st = joint(carapace, s * 0.13 * S, 0.14 * S, 0.28 * S);
    part(st, tubeBetween(v3(0, 0, 0), v3(0, 0.13 * S, 0.02 * S), [0.022 * S, 0.019 * S], { radial: 6, hSeg: 2 }), MU);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.038 * S, 8, 6), voidMat(0x120a0a));
    e.position.set(0, 0.15 * S, 0.025 * S);
    st.add(e);
    stalks.push(st);
  }

  // the mouthparts — a churning cluster, animated
  const maw = joint(carapace, 0, -0.10 * S, 0.30 * S);
  const mandibles = [];
  for (const s of [1, -1]) {
    const md = joint(maw, s * 0.05 * S, 0, 0);
    part(md, tGeo(ellipsoid(0.045 * S, 0.055 * S, 0.070 * S, 7), { pos: [0, 0, 0.02 * S] }), MC);
    mandibles.push({ md, s });
  }

  // EIGHT LEGS, four a side, in a real crab's fore-to-aft fan.
  const legs = [];
  for (const s of [1, -1]) {
    for (let i = 0; i < 4; i++) {
      const spread = -0.55 + i * 0.42;
      const hip = joint(carapace, s * 0.42 * S, -0.10 * S, (0.18 - i * 0.15) * S);
      hip.rotation.y = s * spread;
      part(hip, tubeBetween(v3(0, 0, 0), v3(s * 0.24 * S, 0.10 * S, 0), [0.070 * S, 0.052 * S], { radial: 7, hSeg: 2 }), M);
      const knee = joint(hip, s * 0.24 * S, 0.10 * S, 0);
      // PASS 2: 0.032 -> 0.052 at the knee. At the old radius the eight legs
      // rendered as spider wire and the creature read as an arachnid, which is
      // the one thing a crab must not look like.
      part(knee, tubeBetween(v3(0, 0, 0), v3(s * 0.18 * S, -0.28 * S, 0), [0.052 * S, 0.026 * S], { radial: 7, hSeg: 3 }), M);
      const foot = joint(knee, s * 0.18 * S, -0.28 * S, 0);
      part(foot, tGeo(coneSpike(0.018 * S, 0.10 * S, v3(s * 0.02 * S, 0, 0), { radial: 5 }), { rot: [180, 0, 0] }), MU);
      legs.push({ hip, knee, foot, s, i, phase: (i * 0.5 + (s > 0 ? 0 : 0.25)) * Math.PI });
    }
  }

  // TWO HEAVY CLAWS. Asymmetric, as a real crab is — the right is the crusher.
  const claws = [];
  for (const s of [1, -1]) {
    const k = s > 0 ? 1.18 : 0.92;
    const sh = joint(carapace, s * 0.40 * S, -0.02 * S, 0.26 * S);
    part(sh, tubeBetween(v3(0, 0, 0), v3(s * 0.26 * S, -0.02 * S, 0.14 * S), [0.058 * S * k, 0.046 * S * k], { radial: 7, hSeg: 2 }), M);
    const el = joint(sh, s * 0.26 * S, -0.02 * S, 0.14 * S);
    part(el, tubeBetween(v3(0, 0, 0), v3(s * 0.16 * S, 0.04 * S, 0.20 * S), [0.048 * S * k, 0.056 * S * k], { radial: 7, hSeg: 2 }), M);
    const hand = joint(el, s * 0.16 * S, 0.04 * S, 0.20 * S);
    // the palm of the claw
    part(hand, tGeo(ellipsoid(0.075 * S * k, 0.075 * S * k, 0.145 * S * k, 9), { pos: [0, 0, 0.10 * S] }), MC, { outline: true, thickness: 0.012 });
    // the fixed finger, and the moving one on its own joint
    part(hand, tGeo(ellipsoid(0.030 * S * k, 0.028 * S * k, 0.115 * S * k, 7), { pos: [0, -0.042 * S, 0.235 * S] }), MC);
    const pincer = joint(hand, 0, 0.020 * S, 0.185 * S);
    part(pincer, tGeo(ellipsoid(0.030 * S * k, 0.028 * S * k, 0.110 * S * k, 7), { pos: [0, 0.014 * S, 0.075 * S] }), MC);
    claws.push({ sh, el, hand, pincer, s, k });
  }

  let t = 0, gait = 0;
  const tick = (dt, st) => {
    t += dt;
    const sp = st.speed ?? 0;
    gait += dt * (2.4 + sp * 1.4);
    // the carapace rocks — a crab's body does not stay level over eight legs
    carapace.rotation.z = Math.sin(gait) * 0.06 * Math.min(1, sp);
    carapace.position.y = Math.abs(Math.sin(gait * 2)) * 0.035 * S * Math.min(1, sp);
    for (const L of legs) {
      const ph = gait + L.phase;
      const lift = Math.max(0, Math.sin(ph));
      L.hip.rotation.z = L.s * (Math.cos(ph) * 0.26 * Math.min(1, sp));
      L.knee.rotation.z = -L.s * lift * 0.44 * Math.min(1, sp);
      L.foot.rotation.z = L.s * lift * 0.22;
    }
    for (const st2 of stalks) st2.rotation.x = Math.sin(t * 1.7) * 0.12;
    for (const md of mandibles) md.md.rotation.y = md.s * (0.10 + Math.sin(t * 6) * 0.10);
    // THE RAM / SNAP. `action: 'snap'` closes both claws hard; `ram` tucks the
    // whole body down and drives the carapace forward, which is the body-block.
    const snap = st.action === 'snap' ? (st.actionK ?? 0) : 0;
    const ram = st.action === 'ram' ? (st.actionK ?? 0) : 0;
    for (const c of claws) {
      c.pincer.rotation.x = 0.42 - snap * 0.42;
      c.sh.rotation.x = -0.10 - snap * 0.35 + ram * 0.25;
      c.el.rotation.x = 0.14 + snap * 0.25;
    }
    root.rotation.x = ram * 0.22;
    root.position.z = ram * 0.20 * S;
    // PASS 2 BUG: the hurt branch wrote an ABSOLUTE y of -0.06, which is not a
    // flinch — it dropped the whole crab through the floor for the duration of
    // every hit reaction. It is a dip relative to its standing height.
    if (st.hurt) { carapace.rotation.x = -0.22; root.position.y = 0.36 * S; }
    else root.position.y = 0.42 * S;
  };

  return finishSea(body, { height: 0.72 * S, radius: 0.58 * S, poolR: 0.80 * S, tick, swim: false });
}

// ===========================================================================
// 3 — EEL-SERPENT 鰻蛇 : the ranged one
// ===========================================================================
// Canon: "eel-like sea serpents". A 14-link chain, so it moves by a travelling
// sine rather than by limbs — the same construction the Ten Shadows' Great
// Serpent uses, at a quarter of the mass and with a completely different
// profile: this is THIN, and it carries a dorsal fin ribbon down its whole
// length that the serpent does not have.
//
// It is the RANGED member: it rears back, the throat swells visibly, and it
// spits a pressurised jet. The swell is a real scale animation on two links so
// the wind-up is readable from any angle — a spit with no tell would be
// unfair coming out of a swarm.
export function buildEelSerpent() {
  const S = 1.0;
  const LINKS = 14;
  const body = new THREE.Group();
  const hide = scaleTex('eel', {
    base: '#26414f', edge: '#162a34', dark: '#101f28', band: '#0d1a22', bandEvery: 5, rows: 26
  });
  const M = seaMat(hide);
  const belly = scaleTex('eelBelly', { base: '#b9c6c2', edge: '#93a19e', dark: '#7d8a88', rows: 22 });
  const MB = seaMat(belly);

  const root = joint(body, 0, 0.90 * S, 0);
  const links = [];
  let host = root;
  for (let i = 0; i < LINKS; i++) {
    const k = i / (LINKS - 1);
    // thin, thickest a third of the way back, tapering to a whip
    const r = (0.108 - 0.066 * Math.pow(k, 1.4)) * S * (1 + 0.22 * Math.sin(k * Math.PI));
    const len = 0.185 * S;
    part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, -len), [r, r * 0.94], { radial: 8, hSeg: 2 }), M, { uv: 'cylZ', uvScale: [1, 2] });
    part(host, tGeo(ellipsoid(r * 0.52, r * 0.34, len * 0.48, 7), { pos: [0, -r * 0.62, -len * 0.5] }), MB);
    // the dorsal ribbon — one blade per link, which is what makes the whole
    // body read as an eel rather than as a snake
    // PASS 2: at a blade width of 0.9 x link length there was a visible gap
    // between consecutive links and the fin read as a row of separate sails
    // rather than as one continuous ribbon. Overlapped (1.25x) and lowered, so
    // adjacent blades share an edge down the whole animal.
    part(host, tGeo(finBlade(r * 0.95, len * 1.25, len * 1.15, 0.006 * S, 0.04),
      { rot: [0, 90, 0], pos: [0, r * 0.72, -len * 0.5] }), M);
    const nxt = joint(host, 0, 0, -len);
    links.push(nxt);
    host = nxt;
  }

  // the head: blunt, tubular, with a hinged lower jaw and a small lure
  const head = joint(root, 0, 0, 0.10 * S);
  part(head, tGeo(ellipsoid(0.095 * S, 0.098 * S, 0.175 * S, 10), { pos: [0, 0, 0.08 * S] }), M, { outline: true, thickness: 0.010 });
  const jaw = joint(head, 0, -0.045 * S, 0.06 * S);
  part(jaw, tGeo(ellipsoid(0.082 * S, 0.045 * S, 0.150 * S, 9), { pos: [0, -0.010 * S, 0.085 * S] }), MB);
  const fangs = [];
  for (let i = -2; i <= 2; i++) {
    fangs.push(tGeo(coneSpike(0.010 * S, 0.048 * S, v3(0, 0, 0), { radial: 4 }),
      { rot: [180, 0, 0], pos: [i * 0.026 * S, 0.030 * S, 0.140 * S] }));
  }
  part(head, mergeGeos(fangs), MB);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.024 * S, 7, 6), voidMat(0x0a1418));
    e.position.set(s * 0.062 * S, 0.038 * S, 0.135 * S);
    head.add(e);
  }
  // THE LURE. A small cold-green glow on a stalk over the snout — the warm
  // accent this species is told apart by in a swarm, and it brightens on the
  // spit wind-up so the tell has a colour as well as a shape.
  const lureStalk = joint(head, 0, 0.085 * S, 0.130 * S);
  part(lureStalk, tubeBetween(v3(0, 0, 0), v3(0, 0.055 * S, 0.035 * S), [0.010 * S, 0.008 * S], { radial: 5, hSeg: 1 }), M);
  const lure = new THREE.Mesh(new THREE.SphereGeometry(0.028 * S, 8, 6), glow(0x7fe0c8, 0.75));
  lure.position.set(0, 0.062 * S, 0.040 * S);
  lureStalk.add(lure);

  // the two links whose scale swells on the wind-up
  const throat = [links[0], links[1]];

  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const sp = st.speed ?? 0;
    const drive = 1.1 + sp * 0.34;
    // the travelling sine: each link lags the one in front, which is the whole
    // animation and is why this body plan is a chain
    links.forEach((l, i) => {
      l.rotation.y = Math.sin(t * 3.2 * drive - i * 0.52) * (0.22 + sp * 0.03);
      l.rotation.x = Math.cos(t * 2.1 * drive - i * 0.34) * 0.055;
    });
    root.position.y = 0.90 * S + Math.sin(t * 1.6) * 0.12 * S;
    head.rotation.x = Math.sin(t * 1.9) * 0.08;
    jaw.rotation.x = 0.10 + Math.sin(t * 2.4) * 0.05;

    // THE SPIT. `action: 'spit'`, actionK 0..1 across the wind-up: the body
    // recoils S-shaped, the throat swells, the lure brightens, and the jaw
    // opens on the release.
    const k = st.action === 'spit' ? (st.actionK ?? 0) : 0;
    const wind = Math.min(1, k / 0.7);
    const fire = Math.max(0, (k - 0.7) / 0.3);
    for (let i = 0; i < 4; i++) links[i].rotation.x -= wind * 0.26 * (1 - i / 4);
    for (const th of throat) th.scale.set(1 + wind * 0.65, 1 + wind * 0.65, 1);
    lure.material.opacity = 0.75 + wind * 0.25;
    lure.scale.setScalar(1 + wind * 0.8 - fire * 0.5);
    jaw.rotation.x = 0.10 + wind * 0.15 + fire * 0.95;
    head.rotation.x += fire * 0.3;
    if (st.hurt) { root.rotation.z = 0.3; head.rotation.x -= 0.3; }
    else root.rotation.z = 0;
  };

  return finishSea(body, { height: 1.15 * S, radius: 0.55 * S, poolR: 0.85 * S, tick, extras: { links } });
}

// ===========================================================================
// 4 — GREAT SHARK 大鮫 : the large, rare, late threat
// ===========================================================================
// Canon: "small sharks", and the "gigantic sea beasts" at the top of the
// scale. 3.6 m — ten times a piranha and three times the crab — and it arrives
// late, so the moment it surfaces is meant to change what the player is doing.
// The only rigged JAW in the set, and the only creature with a real bite arc.
//
// SIZE IS THE WHOLE DESIGN. Everything about it is built to be legible at a
// glance from the far side of the arena: a tall dorsal that breaks the
// waterline first, a very wide crescent tail, and a pale belly that flashes
// when it rolls.
export function buildGreatShark() {
  const S = 1.0;
  const body = new THREE.Group();
  const hide = scaleTex('shark', {
    base: '#38505e', edge: '#243743', dark: '#1a2a34', rows: 30
  });
  const M = seaMat(hide);
  const belly = scaleTex('sharkBelly', { base: '#dbe2dd', edge: '#b6c0bd', dark: '#9aa5a3', rows: 26 });
  const MB = seaMat(belly);
  const gums = seaMat(scaleTex('sharkGum', { base: '#c8503e', edge: '#9c3a2c', dark: '#7c2c22', rows: 8 }));

  const root = joint(body, 0, 1.25 * S, 0);
  // FUSIFORM. Four masses along the axis rather than one ellipsoid, so the
  // profile actually has a shoulder and a peduncle.
  const trunk = joint(root, 0, 0, 0);
  part(trunk, tGeo(ellipsoid(0.30 * S, 0.34 * S, 0.62 * S, 16), { pos: [0, 0, 0.28 * S] }), M, { outline: true, thickness: 0.020, uvScale: [2, 3] });
  part(trunk, tGeo(ellipsoid(0.34 * S, 0.36 * S, 0.55 * S, 16), { pos: [0, 0, -0.28 * S] }), M, { uvScale: [2, 3] });
  part(trunk, tGeo(ellipsoid(0.26 * S, 0.20 * S, 0.70 * S, 14), { pos: [0, -0.16 * S, 0.05 * S] }), MB, { uvScale: [2, 3] });

  const waist = joint(trunk, 0, 0, -0.72 * S);
  part(waist, tGeo(ellipsoid(0.22 * S, 0.24 * S, 0.42 * S, 12), { pos: [0, 0, -0.20 * S] }), M, { uvScale: [2, 2] });
  const peduncle = joint(waist, 0, 0, -0.58 * S);
  part(peduncle, tGeo(ellipsoid(0.10 * S, 0.15 * S, 0.30 * S, 10), { pos: [0, 0, -0.14 * S] }), M);

  // THE CRESCENT TAIL — the big upper lobe and the small lower one
  const tail = joint(peduncle, 0, 0, -0.28 * S);
  part(tail, tGeo(finBlade(0.72 * S, 0.20 * S, 0.06 * S, 0.030 * S, 0.62), { rot: [0, 90, -14] }), M, { outline: true, thickness: 0.016 });
  part(tail, tGeo(finBlade(0.36 * S, 0.16 * S, 0.05 * S, 0.026 * S, 0.50), { rot: [180, 90, -12] }), M);

  // THE DORSAL — tall, and the first thing that breaks the surface
  part(trunk, tGeo(finBlade(0.62 * S, 0.34 * S, 0.06 * S, 0.032 * S, 0.55), { rot: [0, 90, 0], pos: [0, 0.30 * S, 0.02 * S] }), M, { outline: true, thickness: 0.016 });
  // second dorsal and anal fin — small, but their absence reads as "unfinished"
  part(waist, tGeo(finBlade(0.16 * S, 0.13 * S, 0.03 * S, 0.018 * S, 0.5), { rot: [0, 90, 0], pos: [0, 0.22 * S, -0.24 * S] }), M);
  part(waist, tGeo(finBlade(0.13 * S, 0.11 * S, 0.03 * S, 0.018 * S, 0.5), { rot: [180, 90, 0], pos: [0, -0.20 * S, -0.26 * S] }), M);

  // PECTORALS, on their own joints so they bank
  const pecs = [];
  for (const s of [1, -1]) {
    const p = joint(trunk, s * 0.26 * S, -0.10 * S, 0.22 * S);
    part(p, tGeo(finBlade(0.52 * S, 0.24 * S, 0.05 * S, 0.026 * S, 0.60), { rot: [96, 0, s * 74] }), M, { outline: true, thickness: 0.014 });
    pecs.push({ p, s });
  }

  // THE HEAD, and the jaw that opens
  const head = joint(trunk, 0, 0, 0.82 * S);
  part(head, tGeo(ellipsoid(0.24 * S, 0.24 * S, 0.34 * S, 14), { pos: [0, 0.02 * S, 0.10 * S] }), M, { outline: true, thickness: 0.016 });
  // the snout: a blunt cone over the mouth, which is what makes the jaw read
  // as underslung
  part(head, tGeo(ellipsoid(0.16 * S, 0.13 * S, 0.24 * S, 12), { pos: [0, 0.10 * S, 0.34 * S] }), M);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.048 * S, 8, 6), voidMat(0x0a0f12));
    e.position.set(s * 0.20 * S, 0.10 * S, 0.26 * S);
    head.add(e);
    // gill slits
    for (let i = 0; i < 5; i++) {
      part(head, tGeo(roundBox(0.010 * S, 0.13 * S, 0.010 * S, 0.004 * S),
        { rot: [0, 0, 10], pos: [s * 0.21 * S, -0.02 * S, -0.02 * S - i * 0.055 * S] }), MB);
    }
  }
  const jaw = joint(head, 0, -0.02 * S, 0.16 * S);
  part(jaw, tGeo(ellipsoid(0.19 * S, 0.10 * S, 0.28 * S, 12), { pos: [0, -0.05 * S, 0.14 * S] }), MB);
  // gums and teeth, upper and lower
  part(head, tGeo(ellipsoid(0.165 * S, 0.05 * S, 0.22 * S, 10), { pos: [0, -0.005 * S, 0.24 * S] }), gums);
  part(jaw, tGeo(ellipsoid(0.155 * S, 0.045 * S, 0.20 * S, 10), { pos: [0, 0.010 * S, 0.20 * S] }), gums);
  const upperTeeth = [], lowerTeeth = [];
  for (let i = -4; i <= 4; i++) {
    const x = i * 0.032 * S;
    const z = 0.30 * S - Math.abs(i) * 0.014 * S;
    upperTeeth.push(tGeo(coneSpike(0.017 * S, 0.058 * S, v3(0, 0, 0), { radial: 4 }), { rot: [180, 0, 0], pos: [x, -0.020 * S, z] }));
    lowerTeeth.push(tGeo(coneSpike(0.016 * S, 0.052 * S, v3(0, 0, 0), { radial: 4 }), { pos: [x, 0.020 * S, z - 0.03 * S] }));
  }
  part(head, mergeGeos(upperTeeth), MB);
  part(jaw, mergeGeos(lowerTeeth), MB);

  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const sp = st.speed ?? 0;
    // SLOW AND POWERFUL. Half the beat rate of the eel and twice the
    // amplitude — the whole read of the species is that it does not hurry and
    // does not need to.
    const beat = 1.05 + sp * 0.16;
    trunk.rotation.y = Math.sin(t * beat) * 0.09;
    waist.rotation.y = Math.sin(t * beat - 0.6) * 0.24;
    peduncle.rotation.y = Math.sin(t * beat - 1.1) * 0.34;
    tail.rotation.y = Math.sin(t * beat - 1.5) * 0.46;
    head.rotation.y = Math.sin(t * beat + 0.4) * 0.06;
    root.position.y = 1.25 * S + Math.sin(t * 0.75) * 0.16 * S;
    root.rotation.z = Math.sin(t * 0.62) * 0.10;
    for (const pc of pecs) pc.p.rotation.z = pc.s * (0.06 + Math.sin(t * 0.9) * 0.10);

    // THE BITE. A wide, slow open followed by a hard close, plus a lunge of
    // the whole body — a shark bite is the animal arriving, not the jaw
    // moving.
    const k = st.action === 'bite' ? (st.actionK ?? 0) : 0;
    const open = Math.min(1, k / 0.65);
    const close = Math.max(0, (k - 0.65) / 0.35);
    jaw.rotation.x = 0.06 + open * 1.05 - close * 1.02;
    head.rotation.x = -open * 0.20 + close * 0.28;
    root.position.z = (open * 0.20 - close * 0.05) * S;
    if (st.hurt) { root.rotation.z += 0.34; trunk.rotation.x = -0.2; }
    else trunk.rotation.x = 0;
  };

  return finishSea(body, { height: 1.90 * S, radius: 1.05 * S, poolR: 1.60 * S, tick });
}

// ---------------------------------------------------------------------------
// THE REGISTRY the summon system and the model bench both read.
// ---------------------------------------------------------------------------
export const OCEAN_BUILDERS = {
  piranha: () => buildPiranhaShoal(),
  crab: buildArmouredCrab,
  eel: buildEelSerpent,
  shark: buildGreatShark
};
