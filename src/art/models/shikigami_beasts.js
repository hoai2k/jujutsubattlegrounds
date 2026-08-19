// SHIKIGAMI — THE THREE NEW BEASTS: Round Deer, Piercing Ox, Tiger Funeral.
//
// These are the Ten Shadows the game did not have. Two are canon with a
// published design; the third is canon by NAME ONLY and is marked as such
// everywhere it appears.
//
// ======================== SHARED REFERENCE SHEET =========================
// They inherit the family language established in art/models/shikigami.js —
// the shadow pool emergence, the cool #8fb6d8 rim, the toon archetypes, and
// magatama-based markings drawn from the Ten Sacred Treasures. What is new is
// three body plans the roster did not have: a tall cervid, a low heavy bovine,
// and a big cat.
//
// ROUND DEER 円鹿 (Madoka) — CANON DESIGN.
//   Wiki: "a tall, deer-like shikigami that can output positive energy from
//   reverse cursed technique", healing its user and counteracting the
//   opponent's cursed energy. Of the design specifically: "Sukuna's version is
//   MUSCULAR and has FOUR EYES similar to his own. Its EARS ARE CLOSE TO THE
//   TOP OF ITS HEAD, ABOVE ITS FINE-PRONGED ANTLERS. The symbol on the LEFT
//   SIDE OF ITS NECK resembles the Jewel of Resuscitation."
//   NOTE ON WHOSE VERSION THIS IS: Round Deer has only ever been shown as
//   SUKUNA summoned it — Megumi has not been drawn using it. The four eyes are
//   explicitly described as being "similar to his own", i.e. they are a
//   Sukuna-flavoured trait. It is built to the shown design because that is
//   the only design that exists, and the four eyes are kept: an invented
//   two-eyed "Megumi version" would be less accurate, not more.
//   Palette: a pale fawn coat over a cream underbelly, black legs, dark
//   antlers, and a warm gold RCT bloom at the muzzle — Sukuna heals himself by
//   touching his hand to its NOSE, so the nose is where the positive energy
//   visibly lives.
//
// PIERCING OX 貫牛 (Kangyū) — CANON DESIGN.
//   Wiki: "a large, robust ox with SHORT CURVED HORNS, WHITE FUR AROUND ITS
//   MOUTH, and a LONG THIN TAIL. On its forehead is a symbol that resembles
//   the Cloth of the Bees." Function: "attacks by ramming into its target head
//   first. Piercing Ox can only charge IN A STRAIGHT LINE, but THE LONGER THE
//   CHARGE, THE MORE POWERFUL ITS ATTACK." That last clause is the whole
//   creature and it is implemented as such in combat/shikigami.js.
//   Palette: a dark slate-brown hide, a hard white muzzle band, pale horns.
//   Built LOW and FORWARD-WEIGHTED: the mass sits over the shoulders so the
//   silhouette reads as something aimed at you even standing still.
//
// TIGER FUNERAL 虎葬 (Kosō) — ***ORIGINAL INTERPRETATION. NOT CANON.***
//   Everything about this creature's APPEARANCE and KIT below is invented.
//   What is canon: the name, the kanji, that it is a Ten Shadows shikigami,
//   and that Sukuna fused it into Merged Beast Agito during the Gojo fight.
//   The wiki states outright: "Tiger Funeral's appearance has not yet been
//   shown" and "Tiger Funeral's capabilities are unknown, as it has yet to be
//   summoned outright."
//   The design here follows fan consensus — that a shikigami named for a tiger
//   and contributing the striped torso and TIGER-LIKE FEET to Agito is an
//   all-purpose melee beast in the mould of the Divine Dogs — and the one
//   genuine inference available: Agito's own description names "a feminine
//   torso with BLACK STRIPES" and "TIGER-LIKE FEET", so the striping and the
//   heavy paws are at least anchored to something drawn. The white-and-black
//   funeral palette (白黒, the colours of a Japanese funeral) is the invented
//   part, chosen so the name means something on screen without contradicting
//   anything, since no colour has ever been published.
// =========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, roundBox, tGeo } from '../builders/geo.js';
import { v3, rand } from '../../core/mathutil.js';
import { joint, part, ellipsoid, markDecal, finish, sigilTex } from './shikigami.js';
import { pelt, boneMat, glow, voidMat, furTex, stripeTex, maskTex } from '../textures/creature.js';

// ===========================================================================
// ROUND DEER 円鹿 : the healer. Tall, four-eyed, gold at the muzzle.
// ===========================================================================
export function buildRoundDeer() {
  const S = 1.15;
  const body = new THREE.Group();

  const coat = pelt(furTex('deer', {
    base: '#c9b391', tip: '#e2d2b4', under: '#8f7a5c', dorsal: '#9a8161', density: 2200
  }));
  const belly = pelt(furTex('deerBelly', {
    base: '#e6dcc6', tip: '#f6efdd', under: '#b3a68b', density: 1200
  }));
  const dark = pelt(furTex('deerLeg', {
    base: '#3a3128', tip: '#5c4f3f', under: '#221c16', density: 1000
  }));
  const antler = boneMat(maskTex('antler', { base: '#4a4038', crack: '#2a231d', stain: '#6b5c4c' }));
  const neckSig = sigilTex('resuscitation', '#c8952c');

  const root = joint(body, 0, 1.02 * S, 0);
  // MUSCULAR, as described — the chest is deep and the shoulder mass is real,
  // which is what separates this from an ordinary deer silhouette.
  const chest = joint(root, 0, 0, 0.22 * S);
  const waist = joint(root, 0, 0, -0.04 * S);
  const hips = joint(waist, 0, 0, -0.26 * S);
  part(chest, ellipsoid(0.24 * S, 0.26 * S, 0.32 * S, 14), coat, { outline: true, uvScale: [2, 2] });
  part(chest, tGeo(ellipsoid(0.20 * S, 0.15 * S, 0.24 * S, 10), { pos: [0, -0.14 * S, 0.06 * S] }), belly);
  part(waist, ellipsoid(0.19 * S, 0.20 * S, 0.26 * S, 12), coat, { uvScale: [2, 2] });
  part(hips, ellipsoid(0.21 * S, 0.22 * S, 0.24 * S, 12), coat, { outline: true, uvScale: [2, 2] });
  for (const s of [1, -1]) {
    part(chest, tGeo(ellipsoid(0.10 * S, 0.16 * S, 0.16 * S, 8), { pos: [s * 0.19 * S, -0.02 * S, 0.05 * S] }), coat);
  }

  // NECK — long and upright, and it carries the Jewel of Resuscitation on its
  // LEFT SIDE, exactly as the reference places it.
  const neck = joint(chest, 0, 0.20 * S, 0.24 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, 0.42 * S, 0.14 * S), [0.115 * S, 0.085 * S], { radial: 10, hSeg: 4 }),
    coat, { uv: 'cylY', uvScale: [2, 2] });
  markDecal(neck, 0.19 * S, neckSig, { pos: [0.105 * S, 0.20 * S, 0.06 * S], rot: [0, Math.PI / 2, 0.3] });

  const head = joint(neck, 0, 0.44 * S, 0.16 * S);
  part(head, ellipsoid(0.095 * S, 0.105 * S, 0.135 * S, 12), coat, { outline: true, thickness: 0.011, uvScale: [2, 2] });
  // long cervid muzzle with a pale band
  part(head, tubeBetween(v3(0, -0.01 * S, 0.07 * S), v3(0, -0.055 * S, 0.24 * S), [0.062 * S, 0.040 * S],
    { radial: 8, hSeg: 3 }), coat, { uv: 'cylZ', uvScale: [2, 2] });
  part(head, tGeo(ellipsoid(0.048 * S, 0.042 * S, 0.045 * S, 8), { pos: [0, -0.056 * S, 0.245 * S] }), belly);
  // THE NOSE — the healing contact point. Sukuna touches his hand to it to
  // repair himself, so it is the one part of the animal that glows.
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052 * S, 10, 8), glow(0xffd98a, 0.0));
  nose.position.set(0, -0.056 * S, 0.252 * S);
  head.add(nose);
  const noseTip = part(head, tGeo(ellipsoid(0.030 * S, 0.024 * S, 0.020 * S, 7), { pos: [0, -0.062 * S, 0.268 * S] }),
    voidMat(0x241d16));

  // FOUR EYES, in two stacked pairs — the trait the reference names first and
  // the single strangest thing about the design. Red, like Sukuna's.
  const eyes = [];
  for (const s of [1, -1]) {
    for (const [ey, er] of [[0.030, 0.030], [-0.030, 0.022]]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(er * S, 8, 6), voidMat(0x141014));
      e.position.set(s * 0.078 * S, ey * S, 0.070 * S);
      head.add(e);
      const iris = new THREE.Mesh(new THREE.CircleGeometry(er * 0.68 * S, 10), glow(0xd4483c, 0.8));
      iris.position.set(s * 0.088 * S, ey * S, 0.078 * S);
      iris.rotation.y = s * 0.7;
      head.add(iris);
      eyes.push(iris);
    }
  }

  // ANTLERS — FINE-PRONGED, and the EARS SIT ABOVE THEM, close to the top of
  // the head. That inversion (ears above antlers rather than below) is called
  // out explicitly in the reference and it is the detail that makes the head
  // read as wrong-but-deliberate rather than as a stag.
  const antlers = [];
  for (const s of [1, -1]) {
    const beam = joint(head, s * 0.055 * S, 0.085 * S, -0.01 * S);
    beam.rotation.set(-0.35, 0, s * 0.42);
    part(beam, tubeBetween(v3(0, 0, 0), v3(0, 0.30 * S, 0), [0.019 * S, 0.011 * S], { radial: 6, hSeg: 3 }),
      antler, { uv: 'cylY' });
    // six fine tines off each beam, alternating fore and aft
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      const t = joint(beam, 0, (0.07 + k * 0.23) * S, 0);
      t.rotation.set((i % 2 ? 0.7 : -0.5), 0, s * (0.5 + k * 0.5));
      part(t, tubeBetween(v3(0, 0, 0), v3(0, (0.13 - k * 0.05) * S, 0), [0.010 * S, 0.003 * S], { radial: 5, hSeg: 2 }),
        antler, { uv: 'cylY' });
    }
    antlers.push(beam);
    // THE EARS, above the antler bases and tight to the crown
    const ear = joint(head, s * 0.052 * S, 0.115 * S, -0.045 * S);
    part(ear, tGeo(coneSpike(0.036 * S, 0.115 * S, v3(s * 0.03 * S, 0, -0.02 * S), { radial: 5, hSeg: 3, zScale: 0.42 }),
      { rot: [-18, 0, s * 26] }), coat, { uv: 'cylY' });
  }

  // LEGS — long, thin, black below the knee. Cervid stance: hocks angled back.
  const legs = [];
  for (const s of [1, -1]) {
    for (const [host, z, up, lo] of [[chest, 0.10 * S, 0.34, 0.32], [hips, -0.04 * S, 0.36, 0.34]]) {
      const hip = joint(host, s * 0.115 * S, -0.14 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -up * S, 0), [0.055 * S, 0.032 * S], { radial: 7, hSeg: 3 }),
        coat, { uv: 'cylY', uvScale: [1, 2] });
      const knee = joint(hip, 0, -up * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -lo * S, 0), [0.030 * S, 0.020 * S], { radial: 6, hSeg: 3 }),
        dark, { uv: 'cylY', uvScale: [1, 2] });
      const hoof = joint(knee, 0, -lo * S, 0);
      part(hoof, tGeo(roundBox(0.044 * S, 0.048 * S, 0.060 * S, 0.010 * S), { pos: [0, -0.020 * S, 0.010 * S] }),
        antler);
      legs.push({ hip, knee, hoof, front: host === chest, side: s });
    }
  }
  const tail = joint(hips, 0, 0.14 * S, -0.20 * S);
  part(tail, tubeBetween(v3(0, 0, 0), v3(0, -0.10 * S, -0.14 * S), [0.032 * S, 0.020 * S], { radial: 6, hSeg: 2 }),
    belly, { uv: 'cylZ' });

  // THE RCT AURA — a halo of positive energy around the whole animal, driven
  // by `st.heal`. This is the readable tell that Round Deer is doing its job:
  // it never attacks, so if it did not visibly glow while healing, a player
  // would have no idea what they had spent the summon on.
  const halo = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry((0.5 + i * 0.22) * S, 0.018 * S, 6, 26), glow(0xffd98a, 0));
    r.rotation.x = Math.PI / 2;
    r.position.y = (0.10 + i * 0.16) * S;
    body.add(r);
    halo.push(r);
  }

  // ---- GAIT ---------------------------------------------------------------
  // A high, light, prancing walk — long stride, high knee lift, almost no body
  // roll. Deliberately nothing like the Divine Dogs' low trot or the Ox's
  // pound: the three quadrupeds must not share a locomotion feel.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 5);
    t += dt * (2.2 + run * 7);
    const heal = st.heal ?? 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const swing = Math.sin(ph);
      const lift = Math.max(0, Math.sin(ph)) * (0.5 + run * 0.6);
      L.hip.rotation.x = swing * (0.34 + run * 0.30) * (L.front ? 1 : -0.8);
      L.knee.rotation.x = -lift * (L.front ? 1.3 : 1.5) - 0.10;
      L.hoof.rotation.x = lift * 0.7;
    }
    root.position.y = 1.02 * S + Math.abs(Math.sin(t)) * 0.030 * (0.4 + run);
    chest.rotation.x = -0.03 + Math.sin(t * 2) * 0.025;
    hips.rotation.x = 0.03 - Math.sin(t * 2) * 0.02;
    // the head lowers and the muzzle reaches out while it heals — the pose
    // Sukuna's panel has, and the only "attack animation" it owns
    neck.rotation.x = -0.10 + Math.sin(t * 1.6) * 0.05 + heal * 0.55;
    neck.rotation.z = Math.sin(t * 0.8) * 0.04;
    head.rotation.x = 0.06 - heal * 0.35;
    head.rotation.y = Math.sin(t * 0.5) * 0.22 * (1 - heal);
    nose.material.opacity = heal * 0.85;
    nose.scale.setScalar(1 + heal * (0.5 + Math.sin(t * 9) * 0.18));
    eyes.forEach((e, i) => { e.material.opacity = 0.55 + heal * 0.35 + Math.sin(t * 3 + i) * 0.06; });
    halo.forEach((r, i) => {
      r.material.opacity = heal * (0.30 - i * 0.06);
      r.scale.setScalar(1 + heal * 0.16 + Math.sin(t * 2.2 - i * 0.8) * 0.05 * heal);
      r.rotation.z += dt * (0.4 + i * 0.25);
    });
    tail.rotation.x = 0.2 + Math.sin(t * 1.7) * 0.25;
    if (st.hurt) { chest.rotation.x -= 0.28; neck.rotation.x += 0.45; }
  };

  return finish(body, { height: 2.05 * S, radius: 0.55 * S, poolR: 0.72 * S, tick, extras: { nose: noseTip, halo } });
}

// ===========================================================================
// PIERCING OX 貫牛 : the runway. Everything about it points forward.
// ===========================================================================
export function buildPiercingOx() {
  const S = 1.25;
  const body = new THREE.Group();

  const hide = pelt(furTex('ox', {
    base: '#4c433c', tip: '#6b5f54', under: '#2c2622', dorsal: '#332c27', density: 2600
  }));
  const hideDk = pelt(furTex('oxDk', {
    base: '#332c28', tip: '#4c433c', under: '#1b1714', density: 1400
  }));
  // THE WHITE FUR AROUND ITS MOUTH — called out in the reference, and the one
  // bright value on an otherwise dark animal, so it is what the eye tracks
  // through a charge.
  const muzzle = pelt(furTex('oxMuzzle', {
    base: '#ddd7c9', tip: '#f2eee2', under: '#a8a294', density: 1600
  }));
  const horn = boneMat(maskTex('oxHorn', { base: '#cfc6ae', crack: '#9a9078', stain: '#b0a68c' }));
  const beesSig = sigilTex('bees', '#d8c24a');

  const root = joint(body, 0, 0.86 * S, 0);
  // FORWARD-WEIGHTED. The shoulder hump is the tallest point of the animal and
  // sits ahead of the mid-line, so even at rest the whole silhouette leans at
  // whatever it is looking at.
  const chest = joint(root, 0, 0, 0.26 * S);
  const waist = joint(root, 0, 0, -0.06 * S);
  const hips = joint(waist, 0, 0, -0.30 * S);
  part(chest, ellipsoid(0.34 * S, 0.33 * S, 0.40 * S, 16), hide, { outline: true, thickness: 0.016, uvScale: [2, 2] });
  // the hump
  part(chest, tGeo(ellipsoid(0.24 * S, 0.20 * S, 0.26 * S, 12), { pos: [0, 0.26 * S, 0.02 * S] }), hide, { uvScale: [2, 2] });
  part(waist, ellipsoid(0.30 * S, 0.29 * S, 0.30 * S, 14), hide, { uvScale: [2, 2] });
  part(hips, ellipsoid(0.28 * S, 0.28 * S, 0.26 * S, 14), hide, { outline: true, thickness: 0.014, uvScale: [2, 2] });
  part(waist, tGeo(ellipsoid(0.26 * S, 0.16 * S, 0.30 * S, 10), { pos: [0, -0.20 * S, 0] }), hideDk);

  // HEAD — carried LOW, which is how an ox that intends to ram stands.
  const neck = joint(chest, 0, 0.06 * S, 0.34 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, -0.02 * S, 0.20 * S), [0.22 * S, 0.17 * S], { radial: 10, hSeg: 3 }),
    hide, { uv: 'cylZ', uvScale: [2, 2] });
  const head = joint(neck, 0, -0.02 * S, 0.22 * S);
  part(head, ellipsoid(0.16 * S, 0.17 * S, 0.22 * S, 14), hide, { outline: true, thickness: 0.013, uvScale: [2, 2] });
  part(head, tGeo(ellipsoid(0.125 * S, 0.115 * S, 0.13 * S, 12), { pos: [0, -0.055 * S, 0.20 * S] }), muzzle,
    { outline: true, thickness: 0.010, uvScale: [2, 2] });
  for (const s of [1, -1]) {
    const nostril = new THREE.Mesh(new THREE.CircleGeometry(0.022 * S, 8), voidMat(0x14100e));
    nostril.position.set(s * 0.048 * S, -0.030 * S, 0.312 * S);
    head.add(nostril);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.034 * S, 8, 6), voidMat(0x14100e));
    e.position.set(s * 0.145 * S, 0.045 * S, 0.055 * S);
    head.add(e);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.022 * S, 8), glow(0xd8823c, 0.7));
    iris.position.set(s * 0.162 * S, 0.045 * S, 0.062 * S);
    iris.rotation.y = s * 1.0;
    head.add(iris);
    // THE SHORT CURVED HORNS — short, and curving out then forward, so they
    // present their points to whatever is ahead
    const hornRoot = joint(head, s * 0.115 * S, 0.115 * S, -0.02 * S);
    hornRoot.rotation.set(-0.15, 0, s * 1.05);
    part(hornRoot, tGeo(coneSpike(0.042 * S, 0.24 * S, v3(0, 0, 0.16 * S), { radial: 7, hSeg: 4 }), {}),
      horn, { uv: 'cylY', uvScale: [1, 2] });
    // ears, tucked under the horns
    part(head, tGeo(coneSpike(0.038 * S, 0.10 * S, v3(s * 0.04 * S, 0, -0.03 * S), { radial: 5, hSeg: 2, zScale: 0.5 }),
      { pos: [s * 0.145 * S, 0.055 * S, -0.06 * S], rot: [-10, 0, s * 70] }), hideDk, { uv: 'cylY' });
  }
  // THE FOREHEAD SYMBOL — the Cloth of the Bees
  markDecal(head, 0.20 * S, beesSig, { pos: [0, 0.098 * S, 0.155 * S], rot: [-0.55, 0, 0] });

  // LEGS — short, thick, no visible articulation. Mass, not agility.
  const legs = [];
  for (const s of [1, -1]) {
    for (const [host, z, up, lo] of [[chest, 0.14 * S, 0.24, 0.22], [hips, -0.04 * S, 0.25, 0.23]]) {
      const hip = joint(host, s * 0.21 * S, -0.22 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -up * S, 0), [0.10 * S, 0.078 * S], { radial: 8, hSeg: 3 }),
        hide, { uv: 'cylY', uvScale: [1, 2] });
      const knee = joint(hip, 0, -up * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -lo * S, 0), [0.075 * S, 0.062 * S], { radial: 8, hSeg: 3 }),
        hideDk, { uv: 'cylY', uvScale: [1, 2] });
      const hoof = joint(knee, 0, -lo * S, 0);
      part(hoof, tGeo(roundBox(0.10 * S, 0.055 * S, 0.12 * S, 0.016 * S), { pos: [0, -0.024 * S, 0.014 * S] }), horn);
      legs.push({ hip, knee, hoof, front: host === chest, side: s });
    }
  }
  // THE LONG THIN TAIL, with a tuft — named in the reference and the only
  // delicate thing on the animal
  const tailLinks = [];
  {
    let host = joint(hips, 0, 0.20 * S, -0.24 * S);
    for (let i = 0; i < 4; i++) {
      part(host, tubeBetween(v3(0, 0, 0), v3(0, -0.17 * S, -0.02 * S), [(0.022 - i * 0.003) * S, (0.019 - i * 0.003) * S],
        { radial: 5, hSeg: 2 }), hideDk, { uv: 'cylY' });
      host = joint(host, 0, -0.17 * S, -0.02 * S);
      tailLinks.push(host);
    }
    part(host, ellipsoid(0.045 * S, 0.075 * S, 0.045 * S, 7), hideDk);
  }

  // THE CHARGE TELL. `st.charge` is 0..1 — how much runway the ox has already
  // eaten — and it drives dust at the hooves, a lowering head and a growing
  // ember at the horn tips. The opponent has to be able to SEE how dangerous
  // this particular charge has become, because the damage is entirely that
  // number and a flat-looking charge would be unreadable.
  const chargeGlow = [];
  for (const s of [1, -1]) {
    const gmesh = new THREE.Mesh(new THREE.SphereGeometry(0.09 * S, 8, 6), glow(0xff9a3c, 0));
    gmesh.position.set(s * 0.20 * S, 0.20 * S, 0.20 * S);
    head.add(gmesh);
    chargeGlow.push(gmesh);
  }

  // ---- GAIT ---------------------------------------------------------------
  // A heavy pound with a long ground-contact phase and a hard settle on every
  // footfall. Through a charge the legs blur into a much faster four-beat and
  // the whole body drops and stiffens.
  let t = 0;
  const tick = (dt, st) => {
    const ch = st.charge ?? 0;
    const run = Math.min(1, (st.speed ?? 0) / 9);
    t += dt * (1.9 + run * 8 + ch * 5);
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = sw * (0.30 + run * 0.34) * (L.front ? 1 : -0.9);
      L.knee.rotation.x = -lift * (0.5 + run * 0.5);
      L.hoof.rotation.x = lift * 0.3;
    }
    root.position.y = 0.86 * S - Math.abs(Math.sin(t)) * 0.032 * S - ch * 0.10 * S;
    chest.rotation.x = -0.04 + Math.sin(t * 2) * 0.03 + ch * 0.16;
    waist.rotation.z = Math.sin(t) * 0.045 * (1 - ch * 0.7);
    hips.rotation.x = 0.03 - Math.sin(t * 2) * 0.025;
    // head DOWN and horns FORWARD as the charge builds
    neck.rotation.x = 0.10 + ch * 0.42 + Math.sin(t * 2) * 0.03;
    head.rotation.x = 0.06 + ch * 0.30;
    head.rotation.y = Math.sin(t * 0.6) * 0.16 * (1 - ch);
    for (const gm of chargeGlow) {
      gm.material.opacity = ch * (0.45 + Math.sin(t * 14) * 0.15);
      gm.scale.setScalar(0.6 + ch * 1.0);
    }
    tailLinks.forEach((l, i) => {
      l.rotation.z = Math.sin(t * 1.6 - i * 0.6) * (0.14 + i * 0.06);
      l.rotation.x = Math.sin(t * 1.2 - i * 0.5) * 0.10 - ch * 0.12;
    });
    if (st.hurt) { chest.rotation.x -= 0.16; head.rotation.x -= 0.25; }
  };

  return finish(body, { height: 1.55 * S, radius: 0.75 * S, poolR: 0.95 * S, tick, extras: { chargeGlow } });
}

// ===========================================================================
// TIGER FUNERAL 虎葬 : ***ORIGINAL INTERPRETATION — NOT CANON***
// ===========================================================================
// SAY IT AGAIN HERE, because this is the function somebody will read in
// isolation: NOTHING BELOW IS CANON except the name, the kanji and the fact
// that this shikigami exists and was fused into Merged Beast Agito. Its
// appearance has never been published and its abilities have never been shown.
// The design is an inference from Agito's striped torso and tiger-like feet
// plus fan consensus that it is an all-rounder; the funeral white-and-black
// palette is invented outright.
export function buildTigerFuneral() {
  const S = 1.05;
  const body = new THREE.Group();

  // THE INVENTED PALETTE: a white tiger with black striping and ash-grey
  // shading — 白黒, the two colours of a Japanese funeral, which is the one
  // thing the name gives to work from.
  const coat = pelt(stripeTex('tiger', {
    base: '#e2ded6', stripe: '#1c1a1d', under: '#f6f3ec', bars: 10
  }));
  const coatDk = pelt(stripeTex('tigerDk', {
    base: '#a49e94', stripe: '#141215', under: '#c6c0b6', bars: 11
  }));
  const paleFur = pelt(furTex('tigerPale', {
    base: '#f0ece2', tip: '#ffffff', under: '#bdb6aa', density: 1400
  }));
  const clawMat = boneMat(maskTex('tigerClaw', { base: '#2a2529', crack: '#151216', stain: '#3d363c' }));

  const root = joint(body, 0, 0.72 * S, 0);
  const chest = joint(root, 0, 0, 0.26 * S);
  const waist = joint(root, 0, 0, -0.06 * S);
  const hips = joint(waist, 0, 0, -0.28 * S);
  part(chest, ellipsoid(0.24 * S, 0.24 * S, 0.36 * S, 16), coat, { outline: true, uvScale: [2, 2] });
  part(waist, ellipsoid(0.21 * S, 0.21 * S, 0.30 * S, 14), coat, { uvScale: [2, 2] });
  part(hips, ellipsoid(0.23 * S, 0.24 * S, 0.28 * S, 14), coat, { outline: true, uvScale: [2, 2] });
  part(chest, tGeo(ellipsoid(0.20 * S, 0.13 * S, 0.26 * S, 10), { pos: [0, -0.15 * S, 0.06 * S] }), paleFur);
  for (const s of [1, -1]) {
    part(chest, tGeo(ellipsoid(0.11 * S, 0.16 * S, 0.17 * S, 9), { pos: [s * 0.19 * S, 0.02 * S, 0.06 * S] }), coat);
    part(hips, tGeo(ellipsoid(0.12 * S, 0.17 * S, 0.16 * S, 9), { pos: [s * 0.18 * S, 0.01 * S, -0.02 * S] }), coat);
  }

  const neck = joint(chest, 0, 0.10 * S, 0.30 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, 0.04 * S, 0.16 * S), [0.165 * S, 0.145 * S], { radial: 10, hSeg: 3 }),
    coat, { uv: 'cylZ', uvScale: [2, 2] });
  const head = joint(neck, 0, 0.05 * S, 0.18 * S);
  part(head, ellipsoid(0.155 * S, 0.145 * S, 0.155 * S, 14), coat, { outline: true, thickness: 0.012, uvScale: [2, 2] });
  // the broad flat feline muzzle and the pale mask around it
  part(head, tGeo(ellipsoid(0.115 * S, 0.085 * S, 0.095 * S, 12), { pos: [0, -0.045 * S, 0.135 * S] }), paleFur);
  part(head, tGeo(ellipsoid(0.032 * S, 0.026 * S, 0.024 * S, 7), { pos: [0, -0.020 * S, 0.222 * S] }), clawMat);
  const jaw = joint(head, 0, -0.075 * S, 0.045 * S);
  part(jaw, tGeo(ellipsoid(0.095 * S, 0.045 * S, 0.115 * S, 10), { pos: [0, 0, 0.075 * S] }), paleFur);
  const maw = new THREE.Mesh(new THREE.CircleGeometry(0.085 * S, 12), voidMat(0x2a1418));
  maw.position.set(0, 0.020 * S, 0.075 * S);
  maw.rotation.x = -1.4;
  jaw.add(maw);
  const fang = boneMat(maskTex('tigerFang', { base: '#f4f0e6', crack: '#c0b8a8', stain: '#d6cec0' }));
  for (const s of [1, -1]) {
    part(jaw, tGeo(coneSpike(0.020 * S, 0.085 * S, v3(0, 0, 0.012 * S), { radial: 5, hSeg: 2 }),
      { rot: [178, 0, 0], pos: [s * 0.052 * S, 0.055 * S, 0.115 * S] }), fang, { uv: 'cylY' });
    part(head, tGeo(coneSpike(0.018 * S, 0.070 * S, v3(0, 0, 0.010 * S), { radial: 5, hSeg: 2 }),
      { rot: [4, 0, 0], pos: [s * 0.052 * S, -0.095 * S, 0.150 * S] }), fang, { uv: 'cylY' });
    // rounded feline ears, set wide
    part(head, tGeo(ellipsoid(0.052 * S, 0.058 * S, 0.020 * S, 8),
      { pos: [s * 0.115 * S, 0.135 * S, -0.020 * S], rot: [0, s * -22, s * 18] }), coatDk);
    part(head, tGeo(ellipsoid(0.032 * S, 0.036 * S, 0.014 * S, 7),
      { pos: [s * 0.115 * S, 0.132 * S, -0.004 * S], rot: [0, s * -22, s * 18] }), paleFur);
    // the eyes: pale gold, narrow, level — a predator's, not a wolf's
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.052 * S, 0.030 * S), glow(0xe8d26a, 0.85));
    e.position.set(s * 0.078 * S, 0.030 * S, 0.128 * S);
    e.rotation.set(0, s * 0.42, s * -0.10);
    head.add(e);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.011 * S, 0.030 * S), voidMat(0x14120e));
    p.position.set(s * 0.082 * S, 0.030 * S, 0.132 * S);
    p.rotation.set(0, s * 0.42, s * -0.10);
    head.add(p);
  }
  // a heavy cheek ruff, which is what stops a big cat head reading as a house
  // cat blown up
  for (const s of [1, -1]) {
    part(head, tGeo(ellipsoid(0.075 * S, 0.10 * S, 0.055 * S, 9),
      { pos: [s * 0.145 * S, -0.045 * S, 0.030 * S] }), paleFur);
  }

  // LEGS — heavy digitigrade limbs ending in the TIGER-LIKE FEET that Agito's
  // description names, with claws that extend on the swipe.
  const legs = [];
  for (const s of [1, -1]) {
    for (const [host, z, up, lo] of [[chest, 0.12 * S, 0.26, 0.24], [hips, -0.04 * S, 0.28, 0.26]]) {
      const hip = joint(host, s * 0.135 * S, -0.13 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -up * S, 0), [0.078 * S, 0.052 * S], { radial: 8, hSeg: 3 }),
        coat, { uv: 'cylY', uvScale: [1, 2] });
      const knee = joint(hip, 0, -up * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -lo * S, 0), [0.052 * S, 0.042 * S], { radial: 7, hSeg: 3 }),
        coat, { uv: 'cylY', uvScale: [1, 2] });
      const paw = joint(knee, 0, -lo * S, 0);
      part(paw, tGeo(ellipsoid(0.070 * S, 0.042 * S, 0.085 * S, 9), { pos: [0, -0.020 * S, 0.020 * S] }), paleFur);
      const claws = [];
      for (let i = -1; i <= 1; i++) {
        const c = joint(paw, i * 0.035 * S, -0.030 * S, 0.075 * S);
        part(c, tGeo(coneSpike(0.010 * S, 0.055 * S, v3(0, 0, 0.020 * S), { radial: 4, hSeg: 2 }), { rot: [95, 0, 0] }),
          clawMat, { uv: 'cylY' });
        claws.push(c);
      }
      legs.push({ hip, knee, paw, claws, front: host === chest, side: s });
    }
  }
  // a long heavy banded tail — five links, and it counterweights every turn
  const tailLinks = [];
  {
    let host = joint(hips, 0, 0.10 * S, -0.24 * S);
    for (let i = 0; i < 5; i++) {
      part(host, tubeBetween(v3(0, 0, 0), v3(0, 0.01 * S, -0.19 * S), [(0.048 - i * 0.005) * S, (0.044 - i * 0.005) * S],
        { radial: 7, hSeg: 2 }), coat, { uv: 'cylZ', uvScale: [1, 0.5], uvOffset: [0, i * 0.5] });
      host = joint(host, 0, 0.01 * S, -0.19 * S);
      tailLinks.push(host);
    }
    part(host, ellipsoid(0.048 * S, 0.048 * S, 0.075 * S, 8), coatDk);
  }

  // ---- GAIT ---------------------------------------------------------------
  // A feline stalk that opens into a bound. The distinguishing feature against
  // the Divine Dogs' trot is that the spine FLEXES: chest and hips counter-
  // rotate about X through the stride, which is what gives a cat its gather.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 7);
    t += dt * (2.4 + run * 8.5);
    const swipe = st.action === 'swipe' ? st.actionK : 0;
    const pounce = st.action === 'pounce' ? st.actionK : 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI * 0.75) + (L.side > 0 ? 0 : Math.PI));
      const swing = Math.sin(ph);
      const lift = Math.max(0, Math.sin(ph)) * (0.4 + run * 0.6);
      L.hip.rotation.x = swing * (0.40 + run * 0.38) * (L.front ? 1 : -0.9) - pounce * 0.7;
      L.knee.rotation.x = -lift * (L.front ? 1.0 : 1.35) - 0.14 + pounce * 0.5;
      L.paw.rotation.x = lift * 0.55;
      // claws bared through a swipe and a pounce, sheathed otherwise
      for (const c of L.claws) c.rotation.x = -Math.max(swipe, pounce) * 0.55;
    }
    // THE SPINE FLEX
    const gather = Math.sin(t * 2) * (0.05 + run * 0.09);
    root.position.y = 0.72 * S + Math.abs(Math.sin(t)) * 0.030 * (0.4 + run) + pounce * 0.30 * S;
    chest.rotation.x = -0.04 - gather - swipe * 0.20;
    hips.rotation.x = 0.04 + gather;
    waist.rotation.y = Math.sin(t) * 0.09 * run;
    root.rotation.z = Math.sin(t) * 0.05 * run;
    neck.rotation.x = -0.12 + Math.sin(t * 2 + 1) * 0.04 + swipe * 0.28 - pounce * 0.35;
    head.rotation.x = 0.08 - swipe * 0.30;
    jaw.rotation.x = 0.04 + Math.max(
      st.action === 'bite' ? Math.sin((st.actionK ?? 0) * Math.PI) * 0.85 : 0, pounce * 0.5);
    // the front paws lead the swipe — the animator's one asymmetry
    if (swipe > 0) {
      const lead = legs.find(L => L.front && L.side > 0);
      if (lead) { lead.hip.rotation.x = -1.5 + swipe * 2.6; lead.knee.rotation.x = -0.8 + swipe * 1.1; }
    }
    tailLinks.forEach((l, i) => {
      l.rotation.y = Math.sin(t * 1.15 - i * 0.55) * (0.16 + i * 0.07);
      l.rotation.x = -0.18 + Math.sin(t * 0.95 - i * 0.45) * (0.10 + i * 0.05);
    });
    if (st.hurt) { chest.rotation.x -= 0.3; head.rotation.x += 0.35; }
  };

  return finish(body, { height: 1.30 * S, radius: 0.62 * S, poolR: 0.78 * S, tick });
}
