// SHIKIGAMI FUSIONS — Divine Dog: Totality, Merged Beast Agito, and the
// winged toads of The Well's Unknown Abyss.
//
// ======================== SHARED REFERENCE SHEET =========================
// The Ten Shadows Technique has three published ways of combining shikigami,
// and they are three DIFFERENT mechanisms, not one repeated:
//
//   DIVINE DOG: TOTALITY 玉犬「渾」 (Gyokuken・Kon) — INHERITANCE.
//     "When a shikigami of the Ten Shadows Technique gets killed or destroyed
//     in battle, it can't be summoned or manifested ever again, but its energy
//     is inherited or passed on to the other shikigami. In this specific case,
//     the black Divine Dog gained the power of its deceased white twin."
//     Design: "a stronger, larger, BI-PEDAL, BICOLORED WEREWOLF-LIKE version
//     of the black Divine Dog. It is a WELL-BALANCED shikigami with the
//     ability to attack, defend, and provide support... its notable traits are
//     its IMMENSE SPEED and POWERFUL CLAWS capable of damaging special grade
//     cursed spirits."
//     So this is not a summon of two live bodies — it is what the SURVIVING
//     twin becomes once the other is dead, which is a genuinely different rule
//     from the one Agito plays by, and combat/shikigami.js implements it as
//     such: it UNLOCKS when exactly one Divine Dog has been permanently lost.
//
//   NUE: TOTALITY — MERGED BEAST AGITO 鵺「渾」嵌合獣 顎吐
//     (Nue・Kon - Kangō Jū Agito) — COMBINATION.
//     "Nue combined with Great Serpent, Tiger Funeral, and Round Deer."
//     FOUR COMPONENTS, verified: Nue, Great Serpent, Round Deer, Tiger Funeral.
//     Design, quoted almost item by item because every clause is a modelling
//     instruction: "a TOWERING and MUSCULAR HUMANOID shikigami with a
//     FEATHERED MANE, a MASK over its face THAT RESEMBLES NUE'S, FEATHERED
//     ARMS THAT END IN CLAWS, BLACK ANTLERS that protrude from its head, a
//     FEMININE TORSO WITH BLACK STRIPES, TIGER-LIKE FEET, and a TAIL THAT ENDS
//     IN A SNAKE'S HEAD. It also sports BLACK HAKAMA bottoms."
//     Every one of those maps onto a component: the mane/mask/arms are Nue,
//     the antlers are Round Deer, the stripes and the feet are Tiger Funeral,
//     the tail is Great Serpent. Built that way deliberately, so a player can
//     look at it and see what they spent.
//     Abilities: "its ability to produce NUE'S ELECTRICITY and REGENERATE with
//     Round Deer's REVERSE CURSED TECHNIQUE." Both are modelled.
//
//   THE WELL'S UNKNOWN ABYSS 不知井底 (Seiteishirazu) — EXTENSION.
//     "Creating the shadows of both Nue and the Toad in subsequence allows
//     Megumi to create a temporary fusion of both in the form of WINGED TOADS.
//     These toads can FLY with increased mobility, as well as use their
//     TONGUES to RESTRAIN opponents or CATCH PROJECTILE ATTACKS. Unlike their
//     parent shikigami, these toads are relatively weaker yet CAN BE DESTROYED
//     WITHOUT ANY CONSEQUENCE, and can be summoned SO LONG AS NUE AND THE TOAD
//     ARE ALIVE."
//     That last clause is the mechanic: it is the one fusion in the game that
//     does NOT consume its components — it requires them alive and leaves them
//     alive, and the toads themselves are free to lose. It is Megumi's own
//     invention in canon, and it is the answer to "is every fusion the same
//     bet?" — no, and this is the counterexample.
// =========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, roundBox, tGeo } from '../builders/geo.js';
import { v3, rand } from '../../../core/math.js';
import { joint, part, ellipsoid, markDecal, finish, sigilTex } from './shikigami.js';
import {
  pelt, scaleMat, dermis, boneMat, glow, voidMat,
  furTex, scaleTex, amphibianTex, featherTex, stripeTex, maskTex
} from '../textures/creature.js';

// ===========================================================================
// DIVINE DOG: TOTALITY 玉犬「渾」 : the bipedal, bicoloured werewolf
// ===========================================================================
export function buildDivineDogTotality() {
  const S = 1.35;                       // "larger" — half again the twins' scale
  const body = new THREE.Group();

  // BICOLOURED, and the split is the point: this is one dog carrying two dogs'
  // power, so the coat is literally divided down the sagittal plane — black on
  // the left, white on the right — with the three forehead dots appearing in
  // BOTH colours, one set on each half. That is the most direct way to draw
  // "it inherited its twin" without inventing anything.
  const black = pelt(furTex('totalityBlack', {
    base: '#22242b', tip: '#474c58', under: '#111318', dorsal: '#0d0f13', density: 2400
  }));
  const white = pelt(furTex('totalityWhite', {
    base: '#e4e0d6', tip: '#ffffff', under: '#98999c', dorsal: '#b6b3ab', density: 2400
  }));
  const claw = boneMat(maskTex('totalityClaw', { base: '#cfd6e0', crack: '#8e97a4', stain: '#a9b2bf' }));
  const dotsW = sigilTex('threeDots', '#e8e4da');
  const dotsB = sigilTex('threeDots', '#1b1d24');

  // Split-material helper: builds the same mass twice, mirrored, so each side
  // carries its own coat. Cheap, and it makes the divide dead straight.
  const half = (host, geoFn, opts = {}) => {
    for (const [s, mat] of [[1, white], [-1, black]]) {
      const g = geoFn(s);
      part(host, g, mat, opts);
    }
  };

  const root = joint(body, 0, 1.32 * S, 0);
  // UPRIGHT. A werewolf stance: chest thrown forward over bent digitigrade
  // legs, shoulders high and wide, head low between them.
  const pelvis = joint(root, 0, -0.10 * S, 0);
  const chest = joint(pelvis, 0, 0.38 * S, 0.02 * S);
  half(pelvis, s => tGeo(ellipsoid(0.17 * S, 0.20 * S, 0.16 * S, 12), { pos: [s * 0.085 * S, 0, 0] }),
    { outline: true, uvScale: [2, 2] });
  half(chest, s => tGeo(ellipsoid(0.23 * S, 0.28 * S, 0.20 * S, 14), { pos: [s * 0.11 * S, 0, 0] }),
    { outline: true, uvScale: [2, 2] });
  half(chest, s => tGeo(ellipsoid(0.14 * S, 0.13 * S, 0.11 * S, 9), { pos: [s * 0.16 * S, -0.20 * S, 0.03 * S] }));
  // a heavy ruff across the shoulders
  half(chest, s => tGeo(ellipsoid(0.22 * S, 0.14 * S, 0.17 * S, 10), { pos: [s * 0.11 * S, 0.22 * S, 0.02 * S] }));

  const neck = joint(chest, 0, 0.30 * S, 0.04 * S);
  half(neck, s => tGeo(ellipsoid(0.10 * S, 0.11 * S, 0.10 * S, 9), { pos: [s * 0.05 * S, 0.04 * S, 0] }));
  const head = joint(neck, 0, 0.13 * S, 0.06 * S);
  half(head, s => tGeo(ellipsoid(0.115 * S, 0.125 * S, 0.145 * S, 12), { pos: [s * 0.055 * S, 0, 0] }),
    { outline: true, thickness: 0.012, uvScale: [2, 2] });
  half(head, s => tGeo(ellipsoid(0.062 * S, 0.058 * S, 0.13 * S, 9), { pos: [s * 0.045 * S, -0.055 * S, 0.16 * S] }));
  const jaw = joint(head, 0, -0.085 * S, 0.06 * S);
  half(jaw, s => tGeo(ellipsoid(0.055 * S, 0.038 * S, 0.115 * S, 9), { pos: [s * 0.042 * S, 0, 0.10 * S] }));
  const maw = new THREE.Mesh(new THREE.CircleGeometry(0.085 * S, 12), voidMat(0x1a0e12));
  maw.position.set(0, 0.02 * S, 0.09 * S);
  maw.rotation.x = -1.4;
  jaw.add(maw);
  for (const s of [1, -1]) {
    part(jaw, tGeo(coneSpike(0.019 * S, 0.085 * S, v3(), { radial: 5, hSeg: 2 }),
      { rot: [178, 0, 0], pos: [s * 0.050 * S, 0.048 * S, 0.15 * S] }), claw, { uv: 'cylY' });
    part(head, tGeo(coneSpike(0.017 * S, 0.070 * S, v3(), { radial: 5, hSeg: 2 }),
      { rot: [2, 0, 0], pos: [s * 0.050 * S, -0.105 * S, 0.16 * S] }), claw, { uv: 'cylY' });
    // ears
    part(head, tGeo(coneSpike(0.048 * S, 0.17 * S, v3(s * 0.03 * S, 0, -0.04 * S), { radial: 4, hSeg: 3, zScale: 0.4 }),
      { pos: [s * 0.075 * S, 0.085 * S, -0.03 * S], rot: [-14, 0, s * 15] }), s > 0 ? white : black, { uv: 'cylY' });
    // eyes: the same cool blue on both halves, so the face still reads as ONE
    // animal rather than as two half-faces
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.050 * S, 0.020 * S), glow(0xbfe0ff, 0.85));
    e.position.set(s * 0.062 * S, 0.020 * S, 0.105 * S);
    e.rotation.set(0, s * 0.5, s * -0.24);
    head.add(e);
  }
  // BOTH sets of dots, one per half — the inheritance, drawn
  markDecal(head, 0.11 * S, dotsB, { pos: [0.048 * S, 0.095 * S, 0.095 * S], rot: [-0.7, 0, 0] });
  markDecal(head, 0.11 * S, dotsW, { pos: [-0.048 * S, 0.095 * S, 0.095 * S], rot: [-0.7, 0, 0] });

  // ARMS — long, and they end in THE CLAWS, which are the creature's weapon.
  const arms = [];
  for (const s of [1, -1]) {
    const mat = s > 0 ? white : black;
    const shoulder = joint(chest, s * 0.235 * S, 0.20 * S, 0);
    part(shoulder, tubeBetween(v3(0, 0, 0), v3(s * 0.05 * S, -0.34 * S, 0), [0.085 * S, 0.062 * S], { radial: 8, hSeg: 3 }),
      mat, { outline: true, thickness: 0.011, uv: 'cylY', uvScale: [1, 2] });
    const elbow = joint(shoulder, s * 0.05 * S, -0.34 * S, 0);
    part(elbow, tubeBetween(v3(0, 0, 0), v3(s * 0.02 * S, -0.31 * S, 0.02 * S), [0.062 * S, 0.048 * S], { radial: 7, hSeg: 3 }),
      mat, { uv: 'cylY', uvScale: [1, 2] });
    const hand = joint(elbow, s * 0.02 * S, -0.31 * S, 0.02 * S);
    part(hand, tGeo(ellipsoid(0.062 * S, 0.048 * S, 0.075 * S, 9), { pos: [0, -0.04 * S, 0.01 * S] }), mat);
    const claws = [];
    for (let i = -1; i <= 1; i++) {
      const c = joint(hand, i * 0.038 * S, -0.075 * S, 0.02 * S);
      part(c, tGeo(coneSpike(0.014 * S, 0.16 * S, v3(0, 0, 0.05 * S), { radial: 4, hSeg: 3 }), { rot: [172, 0, 0] }),
        claw, { outline: i === 0, thickness: 0.009, uv: 'cylY' });
      claws.push(c);
    }
    arms.push({ shoulder, elbow, hand, claws, side: s });
  }

  // LEGS — digitigrade: thigh, shin, a long metatarsal, then the foot. That
  // third segment is what makes a biped read as a wolf standing up rather than
  // as a man in a suit.
  const legs = [];
  for (const s of [1, -1]) {
    const mat = s > 0 ? white : black;
    const hip = joint(pelvis, s * 0.115 * S, -0.10 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, -0.04 * S), [0.095 * S, 0.070 * S], { radial: 8, hSeg: 3 }),
      mat, { outline: true, thickness: 0.011, uv: 'cylY', uvScale: [1, 2] });
    const knee = joint(hip, 0, -0.34 * S, -0.04 * S);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.30 * S, 0.08 * S), [0.068 * S, 0.048 * S], { radial: 7, hSeg: 3 }),
      mat, { uv: 'cylY', uvScale: [1, 2] });
    const hock = joint(knee, 0, -0.30 * S, 0.08 * S);
    part(hock, tubeBetween(v3(0, 0, 0), v3(0, -0.22 * S, -0.03 * S), [0.048 * S, 0.040 * S], { radial: 6, hSeg: 2 }),
      mat, { uv: 'cylY' });
    const foot = joint(hock, 0, -0.22 * S, -0.03 * S);
    part(foot, tGeo(roundBox(0.085 * S, 0.045 * S, 0.16 * S, 0.018 * S), { pos: [0, -0.018 * S, 0.045 * S] }), mat);
    legs.push({ hip, knee, hock, foot, side: s });
  }

  // tail
  const tailLinks = [];
  {
    let host = joint(pelvis, 0, -0.02 * S, -0.14 * S);
    for (let i = 0; i < 4; i++) {
      part(host, tubeBetween(v3(0, 0, 0), v3(0, -0.04 * S, -0.19 * S), [(0.058 - i * 0.010) * S, (0.050 - i * 0.010) * S],
        { radial: 7, hSeg: 2 }), i % 2 ? white : black, { uv: 'cylZ' });
      host = joint(host, 0, -0.04 * S, -0.19 * S);
      tailLinks.push(host);
    }
  }

  // ---- BIPEDAL PROWL ------------------------------------------------------
  // Not the twins' trot and not a human walk: a low, wide, loping stride with
  // heavy counter-rotation through the shoulders, and a rush that drops the
  // whole body forward onto the claws.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 9);
    t += dt * (2.4 + run * 7.5);
    const slash = st.action === 'slash' ? st.actionK : 0;
    const step = Math.sin(t);
    legs.forEach((L, i) => {
      const ph = t + (i ? Math.PI : 0);
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = 0.22 + sw * (0.34 + run * 0.40);
      L.knee.rotation.x = -0.50 - lift * (0.55 + run * 0.35);
      L.hock.rotation.x = 0.42 + lift * 0.55;
      L.foot.rotation.x = -0.14 - lift * 0.28;
    });
    root.position.y = 1.32 * S + Math.abs(step) * 0.035 * (0.4 + run) - run * 0.10 * S;
    pelvis.rotation.y = step * 0.12 * run;
    chest.rotation.y = -step * 0.20 * run + slash * 0.5;
    chest.rotation.x = 0.22 + run * 0.20 - slash * 0.30;
    neck.rotation.x = -0.28 - run * 0.12 + slash * 0.25;
    head.rotation.x = 0.10 - slash * 0.30;
    jaw.rotation.x = 0.06 + (st.action === 'bite' ? Math.sin((st.actionK ?? 0) * Math.PI) * 0.85 : 0) + slash * 0.35;
    arms.forEach((A, i) => {
      const ph = t + (i ? 0 : Math.PI);
      // the leading arm drives the slash; the other counterswings
      const lead = (i === 0);
      A.shoulder.rotation.x = -0.35 + Math.sin(ph) * (0.30 + run * 0.35)
        + (lead ? (-1.5 + slash * 2.8) * (slash > 0 ? 1 : 0) : 0);
      A.shoulder.rotation.z = A.side * (0.30 + run * 0.10 - slash * 0.4);
      A.elbow.rotation.x = -0.65 - Math.max(0, Math.sin(ph)) * 0.35 + slash * 0.5;
      for (const c of A.claws) c.rotation.x = -slash * 0.35;
    });
    tailLinks.forEach((l, i) => {
      l.rotation.y = Math.sin(t * 0.9 - i * 0.6) * (0.18 + i * 0.08);
      l.rotation.x = 0.10 + Math.sin(t * 0.8 - i * 0.5) * (0.10 + i * 0.05);
    });
    if (st.hurt) { chest.rotation.x -= 0.3; head.rotation.x += 0.4; }
  };

  return finish(body, { height: 2.55 * S, radius: 0.62 * S, poolR: 0.85 * S, tick });
}

// ===========================================================================
// MERGED BEAST AGITO 嵌合獣 顎吐 : the fusion of four, built clause by clause
// ===========================================================================
export function buildMergedBeastAgito() {
  const S = 1.55;
  const body = new THREE.Group();

  // FOUR PALETTES, one per component, deliberately kept distinguishable so the
  // player can read what went into it:
  //   NUE           — orange plumage (mane, arms) and the bone mask
  //   ROUND DEER    — black antlers, and the gold RCT bloom when it regenerates
  //   TIGER FUNERAL — the pale black-striped torso and the heavy paws
  //   GREAT SERPENT — the white-and-tan scaled tail with a snake's head
  const plume = pelt(featherTex('agitoPlume', { base: '#b8621f', tip: '#dd8f3c', shaft: '#6f3410', rows: 13 }));
  const plumeDk = pelt(featherTex('agitoPlumeDk', { base: '#7d3d12', tip: '#a85e26', shaft: '#4a2208', rows: 10 }));
  const torso = pelt(stripeTex('agitoTorso', { base: '#ded8cc', stripe: '#16151a', under: '#f2ede2', bars: 11 }));
  const paw = pelt(stripeTex('agitoPaw', { base: '#c6c0b4', stripe: '#16151a', under: '#ded8cc', bars: 7 }));
  const MASK = boneMat(maskTex('agitoMask', { base: '#e8e2d2', crack: '#a89880', stain: '#c8b898' }));
  const antler = boneMat(maskTex('agitoAntler', { base: '#26232a', crack: '#121014', stain: '#3c3742' }));
  const claw = boneMat(maskTex('agitoClaw', { base: '#d4dae4', crack: '#8d95a3', stain: '#a8b0be' }));
  const serp = scaleMat(scaleTex('agitoTail', {
    base: '#ded9cd', edge: '#a9a396', dark: '#6f6a5e', band: '#1b1d22', bandEvery: 4, rows: 20
  }));
  const serpBelly = scaleMat(scaleTex('agitoTailBelly', {
    base: '#cdae66', edge: '#a2884c', dark: '#7a6432', rows: 26
  }));
  // BLACK HAKAMA — the one piece of CLOTHING on any creature in this overhaul,
  // and it is in the reference, so it is here.
  const hakama = pelt(featherTex('agitoHakama', { base: '#1a181e', tip: '#33303a', shaft: '#0c0b0f', rows: 8 }));
  const markSig = sigilTex('mitsudomoe', '#3b2a1a');

  const root = joint(body, 0, 1.62 * S, 0);
  const pelvis = joint(root, 0, 0, 0);
  const waist = joint(pelvis, 0, 0.22 * S, 0);
  const chestJ = joint(waist, 0, 0.30 * S, 0);

  // ---- THE BLACK HAKAMA ---------------------------------------------------
  // A wide pleated skirt over the hips, split into two legs, so the lower half
  // is cloth rather than anatomy — which is exactly what the reference has and
  // what keeps a "feminine torso" from needing to be drawn below the waist.
  part(pelvis, tGeo(ellipsoid(0.30 * S, 0.22 * S, 0.24 * S, 14), { pos: [0, -0.02 * S, 0] }), hakama,
    { outline: true, thickness: 0.014, uvScale: [2, 2] });
  const skirts = [];
  for (const s of [1, -1]) {
    const sk = joint(pelvis, s * 0.13 * S, -0.14 * S, 0);
    part(sk, tubeBetween(v3(0, 0, 0), v3(s * 0.05 * S, -0.72 * S, 0), [0.20 * S, 0.26 * S], { radial: 10, hSeg: 4 }),
      hakama, { outline: true, thickness: 0.013, uv: 'cylY', uvScale: [2, 3] });
    skirts.push(sk);
  }
  // the sash
  part(pelvis, tGeo(ellipsoid(0.32 * S, 0.055 * S, 0.26 * S, 14), { pos: [0, 0.16 * S, 0] }), plumeDk);

  // ---- THE FEMININE TORSO WITH BLACK STRIPES ------------------------------
  // Narrow waist, broad ribcage, striped from Tiger Funeral. "Muscular" and
  // "feminine" together means a strong hourglass rather than a slab.
  part(waist, tGeo(ellipsoid(0.22 * S, 0.20 * S, 0.17 * S, 14), { pos: [0, 0, 0] }), torso,
    { outline: true, thickness: 0.014, uvScale: [2, 2] });
  part(chestJ, tGeo(ellipsoid(0.34 * S, 0.30 * S, 0.24 * S, 16), { pos: [0, 0, 0] }), torso,
    { outline: true, thickness: 0.016, uvScale: [2, 2] });
  part(chestJ, tGeo(ellipsoid(0.28 * S, 0.14 * S, 0.19 * S, 12), { pos: [0, -0.14 * S, 0.06 * S] }), torso, { uvScale: [2, 2] });

  // ---- THE FEATHERED MANE -------------------------------------------------
  // A ruff of orange plumage around the shoulders and up the back of the neck.
  // It is the biggest single mass on the creature and it is what makes the
  // silhouette read as Nue's from a distance.
  const mane = joint(chestJ, 0, 0.22 * S, -0.02 * S);
  part(mane, tGeo(ellipsoid(0.42 * S, 0.24 * S, 0.34 * S, 14), { pos: [0, 0, -0.04 * S] }), plume,
    { outline: true, thickness: 0.015, uvScale: [2, 2] });
  const maneQuills = [];
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI * 0.92 + (i / 12) * Math.PI * 1.84;
    const q = joint(mane, Math.sin(a) * 0.34 * S, 0.06 * S, Math.cos(a) * 0.28 * S - 0.04 * S);
    q.rotation.set(-0.6 + Math.abs(Math.sin(a)) * 0.3, a, 0);
    part(q, tGeo(coneSpike(0.055 * S, (0.34 + Math.cos(a) * 0.14) * S, v3(0, 0, -0.10 * S),
      { radial: 4, hSeg: 3, zScale: 0.30 }), {}), i % 2 ? plumeDk : plume, { uv: 'cylY', uvScale: [1, 2] });
    maneQuills.push(q);
  }

  // ---- THE HEAD: NUE'S MASK, ROUND DEER'S ANTLERS -------------------------
  const neck = joint(chestJ, 0, 0.28 * S, 0.02 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, 0.16 * S, 0.02 * S), [0.115 * S, 0.10 * S], { radial: 9, hSeg: 2 }),
    plumeDk, { uv: 'cylY' });
  const head = joint(neck, 0, 0.18 * S, 0.02 * S);
  part(head, ellipsoid(0.19 * S, 0.20 * S, 0.19 * S, 14), plumeDk, { outline: true, thickness: 0.013, uvScale: [2, 2] });
  const mask = joint(head, 0, 0.005 * S, 0.155 * S);
  part(mask, ellipsoid(0.185 * S, 0.195 * S, 0.10 * S, 16), MASK, { outline: true, thickness: 0.012 });
  for (const s of [1, -1]) {
    const pit = new THREE.Mesh(new THREE.CircleGeometry(0.058 * S, 12), voidMat(0x22190e));
    pit.position.set(s * 0.075 * S, 0.050 * S, 0.092 * S);
    mask.add(pit);
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.040 * S, 12), glow(0xd8a04c, 0.75));
    e.position.set(s * 0.075 * S, 0.050 * S, 0.096 * S);
    mask.add(e);
  }
  const gum = new THREE.Mesh(new THREE.PlaneGeometry(0.22 * S, 0.05 * S), voidMat(0x1a1208));
  gum.position.set(0, -0.11 * S, 0.086 * S);
  mask.add(gum);
  for (let i = -3; i <= 3; i++) {
    part(mask, tGeo(roundBox(0.024 * S, 0.034 * S, 0.013 * S, 0.004),
      { pos: [i * 0.028 * S, -0.11 * S, 0.090 * S] }), MASK);
  }
  markDecal(mask, 0.14 * S, markSig, { pos: [0, 0.125 * S, 0.078 * S], rot: [-0.55, 0, 0] });
  // THE BLACK ANTLERS, Round Deer's, protruding from the head
  const antlers = [];
  for (const s of [1, -1]) {
    const beam = joint(head, s * 0.10 * S, 0.145 * S, -0.02 * S);
    beam.rotation.set(-0.30, 0, s * 0.48);
    part(beam, tubeBetween(v3(0, 0, 0), v3(0, 0.40 * S, 0), [0.026 * S, 0.013 * S], { radial: 6, hSeg: 3 }),
      antler, { uv: 'cylY' });
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const tine = joint(beam, 0, (0.09 + k * 0.29) * S, 0);
      tine.rotation.set(i % 2 ? 0.75 : -0.55, 0, s * (0.45 + k * 0.55));
      part(tine, tubeBetween(v3(0, 0, 0), v3(0, (0.19 - k * 0.07) * S, 0), [0.013 * S, 0.004 * S], { radial: 5, hSeg: 2 }),
        antler, { uv: 'cylY' });
    }
    antlers.push(beam);
  }

  // ---- THE FEATHERED ARMS THAT END IN CLAWS -------------------------------
  const arms = [];
  for (const s of [1, -1]) {
    const shoulder = joint(chestJ, s * 0.34 * S, 0.16 * S, 0);
    part(shoulder, tubeBetween(v3(0, 0, 0), v3(s * 0.10 * S, -0.44 * S, 0), [0.115 * S, 0.080 * S], { radial: 8, hSeg: 3 }),
      plume, { outline: true, thickness: 0.013, uv: 'cylY', uvScale: [1, 2] });
    // feather vanes trailing off the upper arm — this is what makes it a
    // FEATHERED arm rather than an orange one
    const vanes = [];
    for (let i = 0; i < 4; i++) {
      const vn = joint(shoulder, s * (0.02 + i * 0.03) * S, -(0.10 + i * 0.10) * S, -0.02 * S);
      vn.rotation.set(0.2, 0, s * (0.9 + i * 0.15));
      part(vn, tGeo(coneSpike(0.042 * S, (0.34 - i * 0.04) * S, v3(0, 0, -0.06 * S),
        { radial: 4, hSeg: 3, zScale: 0.22 }), {}), i % 2 ? plumeDk : plume, { uv: 'cylY', uvScale: [1, 2] });
      vanes.push(vn);
    }
    const elbow = joint(shoulder, s * 0.10 * S, -0.44 * S, 0);
    part(elbow, tubeBetween(v3(0, 0, 0), v3(s * 0.04 * S, -0.40 * S, 0.03 * S), [0.080 * S, 0.058 * S], { radial: 7, hSeg: 3 }),
      plume, { uv: 'cylY', uvScale: [1, 2] });
    for (let i = 0; i < 3; i++) {
      const vn = joint(elbow, s * 0.02 * S, -(0.10 + i * 0.11) * S, -0.02 * S);
      vn.rotation.set(0.15, 0, s * (1.0 + i * 0.12));
      part(vn, tGeo(coneSpike(0.034 * S, (0.28 - i * 0.04) * S, v3(0, 0, -0.05 * S),
        { radial: 4, hSeg: 3, zScale: 0.22 }), {}), i % 2 ? plume : plumeDk, { uv: 'cylY', uvScale: [1, 2] });
      vanes.push(vn);
    }
    const hand = joint(elbow, s * 0.04 * S, -0.40 * S, 0.03 * S);
    part(hand, tGeo(ellipsoid(0.075 * S, 0.060 * S, 0.090 * S, 10), { pos: [0, -0.05 * S, 0.01 * S] }), paw);
    const claws = [];
    for (let i = -1; i <= 1; i++) {
      const c = joint(hand, i * 0.048 * S, -0.095 * S, 0.02 * S);
      part(c, tGeo(coneSpike(0.018 * S, 0.22 * S, v3(0, 0, 0.07 * S), { radial: 5, hSeg: 3 }), { rot: [170, 0, 0] }),
        claw, { outline: i === 0, thickness: 0.010, uv: 'cylY' });
      claws.push(c);
    }
    arms.push({ shoulder, elbow, hand, claws, vanes, side: s });
  }

  // THE ELECTRICITY. Nue's, and Agito's signature move in the manga is
  // generating "a current of electricity BETWEEN ITS PALMS" — so the arc lives
  // between the two hands, not on the wings of a bird that is no longer here.
  const bolt = new THREE.Group();
  bolt.position.set(0, 0.05 * S, 0.55 * S);
  chestJ.add(bolt);
  const boltSegs = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.30 * S, 0.05 * S), glow(0xc8a8ff, 0));
    b.position.set(rand(-0.3, 0.3) * S, rand(-0.2, 0.2) * S, rand(-0.1, 0.1) * S);
    b.rotation.z = rand(-1.2, 1.2);
    bolt.add(b);
    boltSegs.push(b);
  }

  // ---- TIGER-LIKE FEET ----------------------------------------------------
  // Digitigrade, heavy, striped, and they show BELOW the hakama, which is the
  // only place the lower body is visible at all.
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(pelvis, s * 0.155 * S, -0.16 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.46 * S, -0.04 * S), [0.11 * S, 0.085 * S], { radial: 8, hSeg: 3 }),
      paw, { uv: 'cylY', uvScale: [1, 2] });
    const knee = joint(hip, 0, -0.46 * S, -0.04 * S);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, 0.10 * S), [0.085 * S, 0.062 * S], { radial: 7, hSeg: 3 }),
      paw, { uv: 'cylY', uvScale: [1, 2] });
    const hock = joint(knee, 0, -0.34 * S, 0.10 * S);
    part(hock, tubeBetween(v3(0, 0, 0), v3(0, -0.26 * S, -0.04 * S), [0.062 * S, 0.052 * S], { radial: 7, hSeg: 2 }),
      paw, { uv: 'cylY' });
    const foot = joint(hock, 0, -0.26 * S, -0.04 * S);
    part(foot, tGeo(ellipsoid(0.105 * S, 0.055 * S, 0.155 * S, 10), { pos: [0, -0.03 * S, 0.055 * S] }), paw,
      { outline: true, thickness: 0.012 });
    for (let i = -1; i <= 1; i++) {
      part(foot, tGeo(coneSpike(0.017 * S, 0.085 * S, v3(0, 0, 0.03 * S), { radial: 4, hSeg: 2 }),
        { rot: [96, 0, 0], pos: [i * 0.052 * S, -0.045 * S, 0.16 * S] }), claw, { uv: 'cylY' });
    }
    legs.push({ hip, knee, hock, foot, side: s });
  }

  // ---- THE TAIL THAT ENDS IN A SNAKE'S HEAD -------------------------------
  // Great Serpent's, and it is a genuinely independent limb: it tracks and
  // strikes on its own timing rather than trailing the body, because in the
  // fight it is the thing that grabs while the arms are busy.
  const tailLinks = [];
  let tailHost = joint(pelvis, 0, 0.02 * S, -0.22 * S);
  for (let i = 0; i < 8; i++) {
    const r = (0.075 - i * 0.005) * S;
    part(tailHost, tubeBetween(v3(0, 0, 0), v3(0, 0, -0.26 * S), [r, r * 0.94], { radial: 8, hSeg: 2 }),
      serp, { uv: 'cylZ', uvScale: [1, 0.30], uvOffset: [0, i * 0.30] });
    part(tailHost, tGeo(ellipsoid(r * 0.70, r * 0.30, 0.13 * S, 7), { pos: [0, -r * 0.72, -0.13 * S] }), serpBelly);
    tailHost = joint(tailHost, 0, 0, -0.26 * S);
    tailLinks.push(tailHost);
  }
  const snakeHead = joint(tailHost, 0, 0, 0);
  part(snakeHead, tGeo(ellipsoid(0.075 * S, 0.055 * S, 0.115 * S, 10), { pos: [0, 0, -0.09 * S] }), serp,
    { outline: true, thickness: 0.010 });
  const snakeJaw = joint(snakeHead, 0, -0.025 * S, -0.06 * S);
  part(snakeJaw, tGeo(ellipsoid(0.062 * S, 0.022 * S, 0.085 * S, 9), { pos: [0, 0, -0.06 * S] }), serpBelly);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.020 * S, 8), glow(0xd8b06a, 0.8));
    e.position.set(s * 0.050 * S, 0.020 * S, -0.115 * S);
    e.rotation.y = Math.PI + s * 0.85;
    snakeHead.add(e);
    part(snakeJaw, tGeo(coneSpike(0.010 * S, 0.045 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [-176, 0, 0], pos: [s * 0.026 * S, 0.020 * S, -0.115 * S] }), claw, { uv: 'cylY' });
  }

  // THE RCT REGENERATION BLOOM. Round Deer's, and canonically the reason Gojo
  // prioritised destroying Agito over Mahoraga — it heals SUKUNA, not just
  // itself. Driven by `st.heal`.
  const halo = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry((0.7 + i * 0.30) * S, 0.024 * S, 6, 28), glow(0xffd98a, 0));
    r.rotation.x = Math.PI / 2;
    r.position.y = (0.2 + i * 0.55) * S;
    body.add(r);
    halo.push(r);
  }

  // ---- ANIMATION ----------------------------------------------------------
  // Heavy, deliberate, and BIPEDAL — nothing else in the shikigami set walks on
  // two legs except Totality, and Agito is twice its mass so it moves at half
  // the rate with twice the follow-through.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 5);
    t += dt * (1.5 + run * 4.0);
    const grab = st.action === 'grab' ? st.actionK : 0;
    const zap = Math.max(st.charge ?? 0, st.action === 'zap' ? st.actionK : 0);
    const heal = st.heal ?? 0;
    const step = Math.sin(t);
    legs.forEach((L, i) => {
      const ph = t + (i ? Math.PI : 0);
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = 0.18 + sw * (0.30 + run * 0.28);
      L.knee.rotation.x = -0.44 - lift * (0.48 + run * 0.30);
      L.hock.rotation.x = 0.38 + lift * 0.46;
      L.foot.rotation.x = -0.12 - lift * 0.24;
    });
    root.position.y = 1.62 * S + Math.abs(step) * 0.045 * (0.4 + run);
    pelvis.rotation.y = step * 0.10 * run;
    waist.rotation.y = -step * 0.08 * run;
    chestJ.rotation.y = -step * 0.16 * run + grab * 0.1;
    chestJ.rotation.x = 0.08 + run * 0.12 - grab * 0.16;
    neck.rotation.x = -0.14 - run * 0.08 + grab * 0.10;
    head.rotation.x = 0.06 - zap * 0.12;
    head.rotation.y = Math.sin(t * 0.5) * 0.16 * (1 - grab - zap);
    // the mane breathes and flares on the discharge
    maneQuills.forEach((q, i) => {
      q.rotation.x = -0.6 + Math.abs(Math.sin(t * 0.9 + i * 0.4)) * 0.10 - zap * 0.35;
    });
    // ARMS: they reach for the grab, and come together palm-to-palm for the arc
    arms.forEach((A, i) => {
      const ph = t + (i ? 0 : Math.PI);
      const reach = Math.max(grab, zap);
      A.shoulder.rotation.x = -0.20 + Math.sin(ph) * (0.24 + run * 0.28) - reach * 1.15;
      A.shoulder.rotation.z = A.side * (0.34 + run * 0.08 - reach * 0.24);
      A.elbow.rotation.x = -0.50 - Math.max(0, Math.sin(ph)) * 0.30 - reach * 0.55;
      A.hand.rotation.z = -A.side * zap * 0.9;
      for (const c of A.claws) c.rotation.x = -grab * 0.5;
      A.vanes.forEach((v, k) => { v.rotation.x = 0.2 + Math.sin(t * 1.6 + k * 0.7) * 0.05 - reach * 0.2; });
    });
    bolt.visible = zap > 0.02;
    boltSegs.forEach((b, i) => {
      b.material.opacity = zap * (0.4 + 0.5 * Math.abs(Math.sin(t * 26 + i * 1.7)));
      b.scale.set(0.5 + zap * (0.8 + Math.sin(t * 19 + i) * 0.35), 1, 1);
      b.rotation.z += dt * (i % 2 ? 7 : -7);
    });
    // the hakama swings a beat behind the hips
    skirts.forEach((sk, i) => {
      sk.rotation.x = Math.sin(t - 0.5) * 0.10 * run * (i ? -1 : 1) + 0.04;
      sk.rotation.z = (i ? 1 : -1) * (0.05 + Math.sin(t * 0.8 - 0.6) * 0.05 * run);
    });
    // THE TAIL HUNTS ON ITS OWN. A slow independent sweep with the head kept
    // level, and a lunge on the grab.
    tailLinks.forEach((l, i) => {
      const k = i / 7;
      l.rotation.y = Math.sin(t * 0.85 - i * 0.45) * (0.10 + k * 0.26) * (1 - grab * 0.6);
      l.rotation.x = 0.06 + Math.cos(t * 0.7 - i * 0.35) * (0.05 + k * 0.10) - grab * 0.14;
    });
    snakeHead.rotation.x = -0.2 + Math.sin(t * 1.4) * 0.14 + grab * 0.3;
    snakeHead.rotation.y = Math.sin(t * 1.1) * 0.30;
    snakeJaw.rotation.x = -(0.08 + (grab > 0 ? Math.sin(grab * Math.PI) * 0.8 : Math.sin(t * 1.6) * 0.06));
    halo.forEach((r, i) => {
      r.material.opacity = heal * (0.34 - i * 0.07);
      r.scale.setScalar(1 + heal * 0.18 + Math.sin(t * 2.4 - i * 0.8) * 0.05 * heal);
      r.rotation.z += dt * (0.5 + i * 0.3);
    });
    if (st.hurt) { chestJ.rotation.x -= 0.18; head.rotation.x += 0.22; }
  };

  return finish(body, {
    height: 3.9 * S / 1.55, radius: 1.05 * S, poolR: 1.5 * S, tick,
    extras: { halo, bolt, snakeHead }
  });
}

// ===========================================================================
// THE WELL'S UNKNOWN ABYSS 不知井底 : winged toads, in numbers
// ===========================================================================
// A Nue/Toad chimera: the Toad's body and tongue with a pair of Nue's wings.
// Small, weak, expendable, and there are several. Built as ONE model holding
// `count` bodies so a flight of them costs one entity rather than four, which
// matches how the technique is used — they are placed AROUND Megumi and act as
// a set, not as individuals.
export function buildWingedToads(count = 3) {
  const S = 0.62;
  const body = new THREE.Group();

  const skin = dermis(amphibianTex('wtoad', {
    base: '#5f7f3e', mottle: '#33502a', wart: '#7c9a4e', belly: '#d6cf9e'
  }));
  const skinDk = dermis(amphibianTex('wtoadDk', {
    base: '#3d5a2a', mottle: '#22381c', wart: '#4e6c33', belly: '#8f9a63'
  }));
  const plume = pelt(featherTex('wtoadWing', { base: '#b8621f', tip: '#dd8f3c', shaft: '#6f3410', rows: 9 }));
  const tongueMat = dermis(amphibianTex('wtongue', {
    base: '#b8595f', mottle: '#8e3a44', wart: '#c97078', belly: '#d99098'
  }));

  const toads = [];
  for (let n = 0; n < count; n++) {
    const unit = joint(body, 0, 0, 0);
    const torsoJ = joint(unit, 0, 0, 0);
    part(torsoJ, ellipsoid(0.34 * S, 0.24 * S, 0.36 * S, 12), skin, { outline: true, thickness: 0.011, uvScale: [2, 2] });
    const headJ = joint(torsoJ, 0, 0.04 * S, 0.26 * S);
    part(headJ, ellipsoid(0.25 * S, 0.17 * S, 0.17 * S, 12), skin, { uvScale: [2, 2] });
    const jawJ = joint(headJ, 0, -0.07 * S, -0.02 * S);
    part(jawJ, tGeo(ellipsoid(0.23 * S, 0.075 * S, 0.16 * S, 10), { pos: [0, 0, 0.02 * S] }), skinDk);
    for (const s of [1, -1]) {
      const eye = joint(headJ, s * 0.13 * S, 0.125 * S, 0.02 * S);
      part(eye, new THREE.SphereGeometry(0.062 * S, 8, 6), skinDk);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.038 * S, 10),
        new THREE.MeshBasicMaterial({ color: 0xd8b83c, side: THREE.DoubleSide }));
      iris.position.set(s * 0.026 * S, 0.016 * S, 0.052 * S);
      iris.rotation.y = s * 0.4;
      eye.add(iris);
      const pupil = new THREE.Mesh(new THREE.PlaneGeometry(0.044 * S, 0.012 * S), voidMat(0x0e1408));
      pupil.position.set(s * 0.028 * S, 0.016 * S, 0.056 * S);
      pupil.rotation.y = s * 0.4;
      eye.add(pupil);
    }
    // THE WINGS — Nue's, in miniature, two segments a side
    // A TOAD CANNOT FLY ON SMALL WINGS and it must not look as if it could.
    // The half-span is deliberately about twice the body width — grotesquely
    // oversized for the mass hanging off it, which is the joke the design is
    // making and also the only way the wings read at all on a 0.6 m creature.
    const wings = [];
    for (const s of [1, -1]) {
      const sh = joint(torsoJ, s * 0.24 * S, 0.14 * S, -0.02 * S);
      part(sh, tubeBetween(v3(0, 0, 0), v3(s * 0.62 * S, 0.10 * S, 0), [0.070 * S, 0.048 * S], { radial: 6, hSeg: 3 }),
        plume, { outline: true, thickness: 0.009, uv: 'cylY' });
      part(sh, tGeo(ellipsoid(0.40 * S, 0.028 * S, 0.34 * S, 10), { pos: [s * 0.34 * S, 0.03 * S, -0.06 * S] }),
        plume, { uv: 'planarXZ', uvScale: [2, 2] });
      const wr = joint(sh, s * 0.62 * S, 0.10 * S, 0);
      for (let i = 0; i < 5; i++) {
        const k = i / 4;
        const f = joint(wr, 0, 0, 0);
        f.rotation.y = s * (-0.32 + k * 1.1);
        part(f, tGeo(coneSpike(0.052 * S, (0.72 - k * 0.20) * S, v3(), { radial: 4, hSeg: 3, zScale: 0.18 }),
          { rot: [0, 0, s * -92] }), i % 2 ? plume : skinDk, { uv: 'cylY', uvScale: [1, 2] });
      }
      wings.push({ sh, wr, side: s });
    }
    // legs, tucked
    for (const s of [1, -1]) {
      part(torsoJ, tGeo(ellipsoid(0.06 * S, 0.05 * S, 0.13 * S, 7), { pos: [s * 0.17 * S, -0.19 * S, -0.06 * S] }), skinDk);
      part(torsoJ, tGeo(ellipsoid(0.05 * S, 0.04 * S, 0.10 * S, 7), { pos: [s * 0.15 * S, -0.18 * S, 0.16 * S] }), skinDk);
    }
    // THE TONGUE — the whole reason the technique exists: it RESTRAINS and it
    // CATCHES PROJECTILES, and both need visible reach.
    const links = [];
    let host = joint(jawJ, 0, 0.02 * S, 0.13 * S);
    const tongueRoot = host;
    for (let i = 0; i < 8; i++) {
      const r = (0.036 - i * 0.0026) * S;
      part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, 0.28 * S), [r, r * 0.94], { radial: 5, hSeg: 2 }),
        tongueMat, { uv: 'cylZ' });
      host = joint(host, 0, 0, 0.28 * S);
      links.push(host);
    }
    part(host, ellipsoid(0.045 * S, 0.024 * S, 0.052 * S, 7), tongueMat);

    toads.push({
      unit, torsoJ, headJ, jawJ, wings, links, tongueRoot,
      phase: (n / count) * Math.PI * 2, orbit: (n / count) * Math.PI * 2, alive: true
    });
  }

  // ---- FLIGHT -------------------------------------------------------------
  // They orbit their summoner at head height on staggered phases, with the fast
  // shallow wingbeat of something too heavy to be flying. Any one of them can
  // fire its tongue independently — `st.tongue` is an array when the caller
  // wants them to act separately, or a scalar for all of them at once.
  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const reachAll = typeof st.tongue === 'number' ? st.tongue : 0;
    toads.forEach((T, n) => {
      if (!T.alive) { T.unit.visible = false; return; }
      T.unit.visible = true;
      T.orbit += dt * 0.9;
      const r = 1.5 + Math.sin(t * 0.6 + T.phase) * 0.25;
      T.unit.position.set(Math.sin(T.orbit) * r, 1.5 + Math.sin(t * 1.7 + T.phase) * 0.18, Math.cos(T.orbit) * r);
      T.unit.rotation.y = T.orbit + Math.PI / 2;
      const flap = Math.sin(t * 13 + T.phase);
      for (const w of T.wings) {
        w.sh.rotation.z = w.side * (flap * 0.62 + 0.14);
        w.sh.rotation.x = Math.sin(t * 13 + T.phase - 0.4) * 0.16;
        w.wr.rotation.z = w.side * Math.sin(t * 13 + T.phase - 0.7) * 0.36;
      }
      T.torsoJ.rotation.x = 0.10 + Math.sin(t * 13 + T.phase) * 0.06;
      const reach = Array.isArray(st.tongue) ? (st.tongue[n] ?? 0) : reachAll;
      T.tongueRoot.visible = reach > 0.02;
      T.links.forEach((l, i) => {
        l.position.z = 0.28 * S * (0.02 + reach * 0.98);
        l.rotation.y = Math.sin(t * 6 + i * 0.5) * 0.06 * reach;
        l.visible = reach > 0.02;
      });
      T.jawJ.rotation.x = reach > 0.02 ? 0.7 : 0.05 + Math.sin(t * 2 + T.phase) * 0.05;
      if (st.hurt) T.torsoJ.rotation.z = Math.sin(t * 40 + T.phase) * 0.14;
      else T.torsoJ.rotation.z *= 0.85;
    });
  };

  return finish(body, { height: 2.0, radius: 1.9, poolR: 1.2, tick, extras: { toads } });
}
