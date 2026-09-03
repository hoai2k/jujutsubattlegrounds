// ===========================================================================
// THE FOUR AUSPICIOUS BEASTS 瑞獣 — Ino's 来訪瑞獣
// ===========================================================================
// ======================== SHARED REFERENCE SHEET =========================
// Researched 2026-08-22 against the Jujutsu Kaisen Wiki's Auspicious Beasts
// Summon page, the Gamerant explainer, the Japanese アニヲタWiki / entame-life
// / comic-mate write-ups (which carry the technique's real name and kanji),
// and — for the creatures themselves, which the manga barely draws — the
// standing East Asian iconography of each: Xiezhi/獬豸, the spirit turtle/
// 霊亀, the Qilin/麒麟 and the Chinese dragon/龍.
//
// All geometry, texture and animation below is original and procedural.
//
// ---------------------------------------------------------------------------
// *** WHAT CANON ACTUALLY SAYS, AND IT MATTERS MORE HERE THAN ANYWHERE ***
// ---------------------------------------------------------------------------
// Ino is a SPIRITUAL MEDIUM (降霊術 — "spirit summoning"), NOT a summoner. The
// beasts do not walk out of a portal and fight beside him; he becomes the
// vessel and their power manifests THROUGH HIS OWN BODY. The wiki is explicit
// and the Gamerant piece says it in as many words: "rather than summoning
// separate creatures... the abilities manifest through his body rather than
// appearing as independent entities."
//
// SO WHAT ARE THESE MODELS? They are the beast PARTIALLY ARRIVING. The design
// brief asks for a visible spirit and the character needs one to be legible in
// a fighting game, and the honest way to give it one is not to make it a pet:
// each beast manifests as a half-present body BONDED TO INO — it moves where
// he moves, it strikes when he strikes, and it never walks off to do its own
// thing the way a shikigami or a curse does. That single rule is what keeps
// him from being another summoner, and it is what canon supports.
//
// ---------------------------------------------------------------------------
// THE MATERIAL FAMILY, MEASURED AGAINST ALL FIVE EXISTING SUMMON FAMILIES
// ---------------------------------------------------------------------------
// The brief asks for these to be clearly distinct from Megumi's shikigami,
// Geto's curses, Yaga's corpses, Mahito's transfigured humans and Dagon's sea
// shikigami. Compared against each before committing:
//
//   MEGUMI'S SHIKIGAMI    opaque, fully-coloured real animals that rise out of
//                         a black SHADOW POOL. Solid bodies with fur values.
//   GETO'S CURSES         opaque grotesques; wrong anatomy, saturated flesh.
//   YAGA'S CORPSES        built out of WORKSHOP MATERIALS — sawn timber,
//                         cord, sailcloth. Objects, not bodies.
//   MAHITO'S TRANSFIGURED opaque, human-derived, asymmetric, skin-toned.
//   DAGON'S SEA SHIKIGAMI opaque sea creatures, wet and dark.
//
// Every one of those five is OPAQUE and every one of them is a BODY. So this
// family is neither:
//
//   *** THEY ARE TRANSLUCENT SHRINE CARVINGS THAT HAVE HALF ARRIVED. ***
//
//   1. GENUINELY SEE-THROUGH, and more so at the edges than at the core. The
//      material carries `opacity` in the 0.44-0.62 band with a very wide,
//      very early rim (rimStart 0.30) — so the silhouette GLOWS and the middle
//      of the body is a suggestion. Nothing else in the game is transparent.
//   2. NO SHADOW POOL AND NO GROUND CONTACT ON ARRIVAL. They do not come up
//      out of anything. They FORM IN PLACE, from the extremities inward — see
//      `setReveal` below, which scales each limb group from its own tip rather
//      than lifting the body out of the floor. That is the single clearest
//      read that separates them from Megumi's summons in one frame.
//   3. ORNAMENTAL, NOT ANATOMICAL. Every one of them carries carved-looking
//      spiral and scale ornament in a bright second colour, the way a temple
//      guardian does. They are auspicious beasts — objects of veneration —
//      and they should look designed rather than evolved.
//   4. ONE HUE EACH, hard. A shikigami is a coloured animal; one of these is a
//      colour with an animal in it.
//
// ---------------------------------------------------------------------------
// THE FOUR, WITH THE ICONOGRAPHY EACH IS BUILT TO
// ---------------------------------------------------------------------------
//   獬豸 KAICHI  (Xiezhi) — "a one-horned creature resembling an ox or goat
//     with thick dark fur", the beast of DIVINE JUSTICE, which gores the
//     guilty party with its single horn. Canon-in-JJK: it produces a spiral-
//     patterned HORN, coated in cursed energy, which "will not stop until it
//     hits the desired target".
//     BUILT AS: a heavy-shouldered horned quadruped, head low, with ONE long
//     spiralled horn angled forward off the brow. The horn is oversized on
//     purpose — it is the technique, so it has to be the silhouette.
//     COLOUR: 0x6ea8ff, a cold judicial blue.
//
//   霊亀 REIKI (the spirit turtle) — "a tortoise exceeding ten thousand years
//     in age, revered as a numinous being", a symbol of LONGEVITY and one of
//     the four guardians. Canon-in-JJK: it covers Ino in cursed WATER, which
//     protects him and lets him GLIDE with reduced friction.
//     BUILT AS: a broad low turtle with a deeply carved hexagonal shell, a
//     long neck, and TRAILING WEED off the back of the shell (the minogame,
//     the Japanese "straw-raincoat turtle" that has lived long enough to grow
//     a tail of algae). The water is not on the model — it is on INO — so the
//     creature itself is the source rather than the effect.
//     COLOUR: 0x3fd0b8, a deep water teal.
//
//   麒麟 KIRIN (Qilin) — "a deer-shaped body, the hooves of a horse, the tail
//     of an ox, the scales and flowing mane of a Chinese dragon across its
//     body, and antlers on its head". A symbol of prosperity that appears at
//     the arrival or passing of a sage. Canon-in-JJK: it NULLIFIES INO'S PAIN
//     — an intracerebral doping — and it drains him badly.
//     BUILT AS: the full chimera. Deer body, scaled hide, horse hooves,
//     antlers AND a single forward horn, a mane of flame-shaped plates, and an
//     ox tail. The most ornate of the four and it should be.
//     COLOUR: 0xffc24a, a hot votive gold.
//
//   龍 RYU (the dragon) — canon-in-JJK gives ALMOST NOTHING, and that absence
//     is the most important research finding about this character: Ino tries
//     to use it in Shibuya and his mask is torn off before he can, and the
//     line that survives is that NOBODY WHO HAS SEEN THE DRAGON HAS LIVED TO
//     DESCRIBE IT.
//     So the dragon is NOT a stance. It is the ULTIMATE, and this is the
//     model for it. Building it as a fourth swappable mask would have flatly
//     contradicted the one thing the source says about it.
//     BUILT AS: a long serpentine Chinese dragon — no wings, four short
//     clawed legs, a whiskered head with antlers, and a body of segmented
//     rings that lets it be driven as a chain.
//     COLOUR: 0xd8e4ff, near-white — it is the only one of the four that is
//     not a hue, because the thing nobody has survived should not be
//     colour-coded like the ones you can.
// ===========================================================================
import * as THREE from 'three';
import { toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { joint, part, ellipsoid } from './shikigami.js';
import { tGeo, roundBox, latheY, coneSpike } from '../builders/geo.js';
import { rand } from '../../../core/math.js';

// ---------------------------------------------------------------------------
// THE MATERIAL — the thing that makes them a family
// ---------------------------------------------------------------------------
// One cached material per (colour, role). See rule 1 in the reference sheet:
// the body is genuinely see-through and the rim is very wide and very early,
// so the silhouette is the brightest thing about the creature.
const _bmats = new Map();
function beastMat(color, role = 'body') {
  const k = role + ':' + color;
  if (_bmats.has(k)) return _bmats.get(k);
  const common = { vertexColors: false, transparent: true, depthWrite: false };
  const m = role === 'ornament'
    // the carved spiral/scale work: brighter, more opaque, and emissive, so
    // the ornament reads through the body from any angle
    ? toonMaterial({
      ...common, color, opacity: 0.86, steps: [180, 220, 255],
      rim: 0.9, rimStart: 0.34, rimColor: 0xffffff, emissive: color, emissiveIntensity: 0.55
    })
    : role === 'core'
      // the deepest mass — chest, shell, skull. The only part approaching solid.
      ? toonMaterial({
        ...common, color, opacity: 0.62, steps: [70, 150, 255],
        rim: 0.85, rimStart: 0.30, rimColor: 0xffffff, gloss: 0.2,
        emissive: color, emissiveIntensity: 0.16
      })
      // ordinary body mass — limbs, neck, tail. The thinnest.
      : toonMaterial({
        ...common, color, opacity: 0.44, steps: [70, 150, 255],
        rim: 0.80, rimStart: 0.30, rimColor: 0xffffff,
        emissive: color, emissiveIntensity: 0.12
      });
  m.renderOrder = 2;
  _bmats.set(k, m);
  return m;
}

// A part that is NOT baked and NOT outlined in the ordinary way: these bodies
// are translucent, so an inverted-hull outline would draw a black shell
// through the creature. The rim IS the outline for this family, which is the
// second half of rule 1.
function bp(parent, geo, color, role = 'body') {
  const mesh = new THREE.Mesh(geo, beastMat(color, role));
  mesh.renderOrder = role === 'ornament' ? 3 : 2;
  parent.add(mesh);
  return mesh;
}

// ---- THE CARVED ORNAMENT ---------------------------------------------------
// Rule 3. A ring of raised spiral bosses around a limb or a body — the
// vocabulary every one of the four shares, so they read as a matched set of
// ritual objects rather than as four unrelated animals.
function spiralBand(parent, r, n, size, color, { y = 0, tilt = 0 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // *** NO `lookAt`. *** The first version called `mesh.lookAt(0, y, 0)`
    // after building, which rotates the MESH about its parent's origin — and
    // `bp` hands back a mesh whose geometry is already baked into place, so
    // every ring was swung across the body and ended up hanging in the air
    // beside it. The bench caught it on Reiki, where a dozen teal arcs were
    // floating above the shell like sparks.
    //
    // The rotation is baked into the geometry by `tGeo` instead, in the order
    // scale-rotate-translate, so a ring is oriented before it is placed and
    // nothing moves it afterwards.
    const g = new THREE.TorusGeometry(size, size * 0.34, 5, 9, Math.PI * 1.6);
    bp(parent, tGeo(g, {
      rot: [90, a * 180 / Math.PI, tilt],
      pos: [Math.sin(a) * r, y, Math.cos(a) * r]
    }), color, 'ornament');
  }
}

// ---------------------------------------------------------------------------
// THE SHARED FINISH — and it is deliberately NOT shikigami.js's `finish`
// ---------------------------------------------------------------------------
// Rule 2. Megumi's creatures rise out of a shadow pool: `finish` lifts the
// body up through the floor and fades a black disc under it. These do not
// touch the floor at all — they FORM FROM THE EXTREMITIES INWARD, each
// registered limb group scaling up from its own root on its own slight delay,
// so at half reveal the creature is a core with ghosts of limbs around it.
//
// A `manifest` also never fully dies. See combat/beasts.js: knocking one away
// suppresses it (reveal falls to 0 and it stops acting) and it comes back,
// because it was never a separate body to kill. `setReveal` is therefore the
// ONLY lifecycle this family has — there is no death animation, because there
// is no death.
function manifest(body, { height, radius, color, tick, limbs = [], extras = {} }) {
  const group = new THREE.Group();
  group.add(body);
  // remember every limb's authored scale so the reveal can restore it exactly
  const L = limbs.map((g, i) => ({ g, delay: (i % 4) * 0.10, base: g.scale.clone() }));
  let reveal = 0;
  const api = {
    group, body, height, radius, color, extras,
    limbs: L,
    // outline hulls: this family has none (see `bp`), so LOD is a no-op that
    // exists only so the summon systems can call it uniformly
    setLOD() {},
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      // the CORE arrives first and the limbs follow, each on its own delay
      body.scale.setScalar(0.55 + e * 0.45);
      for (const l of L) {
        const t = Math.max(0, Math.min(1, (e - l.delay) / Math.max(0.05, 1 - l.delay)));
        const s = t * t * (3 - 2 * t);
        l.g.scale.set(l.base.x * s, l.base.y * s, l.base.z * s);
      }
      // and the whole thing is more transparent the less of it has arrived
      body.traverse(o => {
        if (o.material?.transparent && o.material.userData.baseOpacity == null) {
          o.material.userData.baseOpacity = o.material.opacity;
        }
        if (o.material?.transparent) o.material.opacity = o.material.userData.baseOpacity * (0.15 + e * 0.85);
      });
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// ===========================================================================
// 1 — 獬豸 KAICHI : the horned beast of judgement
// ===========================================================================
export function buildKaichi() {
  const C = 0x6ea8ff;
  const S = 1.0;
  const body = new THREE.Group();
  const limbs = [];

  // the barrel — heavy at the shoulder and tapering to the haunch, which is
  // what makes an ox read as an ox rather than as a horse
  const core = joint(body, 0, 0.86 * S, 0);
  bp(core, ellipsoid(0.42 * S, 0.40 * S, 0.72 * S, 12), C, 'core');
  bp(core, ellipsoid(0.46 * S, 0.44 * S, 0.30 * S, 12).translate(0, 0.04 * S, 0.30 * S), C, 'core');
  // THE THICK DARK FUR the iconography insists on, as a mantle of carved
  // plates over the shoulders rather than as fibres — rule 3
  for (let i = 0; i < 9; i++) {
    const a = (i / 9 - 0.5) * 2.4;
    bp(core, tGeo(roundBox(0.13 * S, 0.30 * S, 0.09 * S, 0.03 * S),
      { rot: [22, a * 40, a * 26], pos: [Math.sin(a) * 0.40 * S, 0.22 * S, 0.28 * S - Math.abs(a) * 0.10 * S] }), C, 'ornament');
  }
  spiralBand(core, 0.44 * S, 7, 0.055 * S, C, { y: -0.10 * S });

  // NECK AND HEAD — carried LOW, the way a charging ox carries it. The head is
  // level with the shoulder, not above it.
  const neck = joint(core, 0, 0.02 * S, 0.44 * S);
  limbs.push(neck);
  bp(neck, ellipsoid(0.19 * S, 0.19 * S, 0.30 * S, 10).translate(0, -0.02 * S, 0.20 * S), C);
  const head = joint(neck, 0, -0.06 * S, 0.44 * S);
  bp(head, ellipsoid(0.17 * S, 0.17 * S, 0.30 * S, 10), C, 'core');
  // the goat muzzle
  bp(head, ellipsoid(0.11 * S, 0.11 * S, 0.18 * S, 9).translate(0, -0.05 * S, 0.28 * S), C);
  // eyes — two hard bright slits, the only fully opaque thing on the creature
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(
      tGeo(roundBox(0.10 * S, 0.035 * S, 0.02 * S, 0.008 * S), { rot: [0, 0, s * 12], pos: [s * 0.11 * S, 0.05 * S, 0.24 * S] }),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    e.renderOrder = 4;
    head.add(e);
  }
  // small back-swept ears
  for (const s of [1, -1]) {
    bp(head, tGeo(roundBox(0.05 * S, 0.13 * S, 0.10 * S, 0.02 * S),
      { rot: [-30, s * 30, s * 20], pos: [s * 0.15 * S, 0.13 * S, -0.06 * S] }), C);
  }

  // *** THE HORN. *** One, long, spiralled, angled forward off the brow. It is
  // the technique itself, so it is deliberately oversized — 0.95 units on a
  // 0.30 head — and it is the whole silhouette from every angle.
  const horn = joint(head, 0, 0.16 * S, 0.10 * S);
  limbs.push(horn);
  {
    // *** IT POINTED BACKWARDS. *** The first version baked `rot: [-58, 0, 0]`
    // into the cone's geometry, and a −58° rotation about X takes (0,1,0) to
    // (0, 0.53, −0.85) — up and BEHIND him. The beast of judgement was carrying
    // its horn over its own back like a radio mast, and the spiral rings were
    // placed by hand-computed trigonometry that inherited the same sign, so
    // they trailed off into the air behind it.
    //
    // Both are fixed by construction rather than by flipping a number: the horn
    // is now a JOINT with a rotation, and everything on it is a child at a
    // LOCAL offset up its own axis. There is no trigonometry left to get wrong,
    // and the beast can now be animated to lower its horn (`extras.horn`)
    // without recomputing anything.
    horn.rotation.x = 58 * Math.PI / 180;   // up and FORWARD, over the muzzle
    const L = 0.95 * S;
    const g = new THREE.ConeGeometry(0.075 * S, L, 7);
    g.translate(0, L * 0.5, 0);
    bp(horn, g, C, 'core');
    // the spiral — nine rings climbing it, which is the wiki's "spiral patterns
    // on it" and is what makes it read as a horn rather than as a spike
    for (let i = 0; i < 9; i++) {
      const f = 0.06 + i * 0.105;
      const r = 0.075 * S * (1 - f) + 0.010 * S;
      bp(horn, tGeo(new THREE.TorusGeometry(r * 1.20, r * 0.32, 5, 10),
        { rot: [90, 0, 0], pos: [0, f * L, 0] }), C, 'ornament');
    }
    // the tip, so the point is a point
    bp(horn, tGeo(new THREE.ConeGeometry(0.020 * S, 0.14 * S, 6), { pos: [0, L + 0.05 * S, 0] }), C, 'ornament');
  }

  // FOUR LEGS — short, thick, cloven. Each is its own group so it forms
  // separately in `setReveal`.
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const leg = joint(core, sx * 0.30 * S, -0.30 * S, sz * 0.36 * S);
    limbs.push(leg);
    bp(leg, ellipsoid(0.15 * S, 0.28 * S, 0.16 * S, 8).translate(0, -0.24 * S, 0), C, 'core');
    bp(leg, ellipsoid(0.115 * S, 0.20 * S, 0.125 * S, 8).translate(0, -0.62 * S, 0.02 * S), C, 'core');
    // the cloven hoof — two blocks, which reads as cloven at any distance
    for (const h of [-1, 1]) {
      bp(leg, tGeo(roundBox(0.055 * S, 0.09 * S, 0.13 * S, 0.02 * S),
        { pos: [h * 0.032 * S, -0.84 * S, 0.02 * S] }), C, 'ornament');
    }
    leg.userData.phase = (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5);
  }
  // TAIL — a short ox tail with a tuft
  const tail = joint(core, 0, 0.10 * S, -0.68 * S);
  limbs.push(tail);
  bp(tail, ellipsoid(0.05 * S, 0.05 * S, 0.26 * S, 7).translate(0, -0.10 * S, -0.20 * S), C);
  bp(tail, ellipsoid(0.09 * S, 0.13 * S, 0.09 * S, 8).translate(0, -0.22 * S, -0.38 * S), C, 'ornament');

  const legs = limbs.filter(l => l.userData.phase !== undefined);
  let T = 0;
  return manifest(body, {
    height: 1.44 * S, radius: 0.60 * S, color: C, limbs,
    extras: { horn, head, neck },
    // A HEAVY, GROUNDED IDLE. He plants, breathes, and the head swings a
    // little. Everything about the animation says weight, because the beast of
    // judgement should not look nimble.
    // SIGNATURE MATCHES THE CREATURE FAMILY: `(dt, st)`, with the clock
    // accumulated internally — the same contract every shikigami and every sea
    // shikigami keeps, so the viewer's bench and combat/beasts.js can drive
    // all three families through one call.
    tick(dt, st = {}) {
      const { gait = 0, strike = 0 } = st;
      T += dt;
      const t = T;
      core.position.y = 0.86 * S + Math.sin(t * 1.6) * 0.022 * S;
      neck.rotation.x = 0.10 + Math.sin(t * 1.3) * 0.05 - strike * 0.5;
      head.rotation.x = -0.06 + Math.sin(t * 1.1 + 1) * 0.05 + strike * 0.8;
      head.rotation.y = Math.sin(t * 0.7) * 0.12 * (1 - gait);
      for (const l of legs) {
        l.rotation.x = Math.sin(t * 5.2 + l.userData.phase) * 0.34 * gait;
      }
      tail.rotation.x = Math.sin(t * 1.9) * 0.16;
      tail.rotation.z = Math.sin(t * 1.4) * 0.10;
    }
  });
}

// ===========================================================================
// 2 — 霊亀 REIKI : the ten-thousand-year turtle
// ===========================================================================
export function buildReiki() {
  const C = 0x3fd0b8;
  const S = 1.0;
  const body = new THREE.Group();
  const limbs = [];

  const core = joint(body, 0, 0.52 * S, 0);
  // THE SHELL. Broad, low, and DEEPLY CARVED — the hexagonal scute pattern is
  // the read, and it is built as real raised plates rather than as a texture.
  bp(core, ellipsoid(0.72 * S, 0.34 * S, 0.86 * S, 14), C, 'core');
  bp(core, ellipsoid(0.74 * S, 0.10 * S, 0.88 * S, 14).translate(0, -0.12 * S, 0), C);
  // the scutes: a central ridge of five, and a ring of ten around the rim
  for (let i = 0; i < 5; i++) {
    const z = (i - 2) * 0.28 * S;
    bp(core, tGeo(new THREE.CylinderGeometry(0.17 * S, 0.20 * S, 0.10 * S, 6),
      { pos: [0, 0.29 * S - Math.abs(z) * 0.08, z] }), C, 'ornament');
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    bp(core, tGeo(new THREE.CylinderGeometry(0.13 * S, 0.15 * S, 0.09 * S, 6),
      { rot: [Math.cos(a) * 26, 0, -Math.sin(a) * 26],
        pos: [Math.sin(a) * 0.50 * S, 0.16 * S, Math.cos(a) * 0.60 * S] }), C, 'ornament');
  }
  spiralBand(core, 0.70 * S, 12, 0.045 * S, C, { y: -0.06 * S });

  // NECK AND HEAD — long, and it EXTENDS, which is the turtle's one bit of
  // theatre. The neck is three segments so it can telescope.
  const neckSegs = [];
  let parent = joint(core, 0, 0.02 * S, 0.60 * S);
  limbs.push(parent);
  for (let i = 0; i < 3; i++) {
    const seg = joint(parent, 0, 0.03 * S, 0.20 * S);
    bp(seg, ellipsoid(0.17 * S - i * 0.014 * S, 0.16 * S - i * 0.014 * S, 0.15 * S, 9), C, 'core');
    neckSegs.push(seg);
    parent = seg;
  }
  const head = joint(parent, 0, 0.02 * S, 0.20 * S);
  // HALF AGAIN AS BIG as the first pass. A ten-thousand-year-old turtle whose
  // head is a bead on the end of a neck reads as a caterpillar; the head has to
  // be a real mass or the shell is the only thing on screen.
  bp(head, ellipsoid(0.20 * S, 0.18 * S, 0.28 * S, 10), C, 'core');
  bp(head, ellipsoid(0.13 * S, 0.10 * S, 0.17 * S, 9).translate(0, -0.04 * S, 0.28 * S), C, 'core');
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(
      tGeo(new THREE.CircleGeometry(0.048 * S, 8), { pos: [s * 0.115 * S, 0.05 * S, 0.22 * S] }),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    e.renderOrder = 4;
    head.add(e);
  }
  // the whiskers of a very old turtle
  for (const s of [1, -1]) {
    bp(head, tGeo(ellipsoid(0.012 * S, 0.012 * S, 0.14 * S, 5), { rot: [10, s * 22, 0], pos: [s * 0.07 * S, -0.06 * S, 0.22 * S] }), C, 'ornament');
  }

  // FOUR FLIPPER-LEGS, splayed
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const leg = joint(core, sx * 0.52 * S, -0.16 * S, sz * 0.46 * S);
    limbs.push(leg);
    bp(leg, ellipsoid(0.20 * S, 0.13 * S, 0.25 * S, 8).translate(sx * 0.10 * S, -0.10 * S, sz * 0.06 * S), C, 'core');
    bp(leg, ellipsoid(0.18 * S, 0.09 * S, 0.21 * S, 8).translate(sx * 0.24 * S, -0.22 * S, sz * 0.10 * S), C, 'core');
    // three claws
    for (let k = 0; k < 3; k++) {
      bp(leg, tGeo(new THREE.ConeGeometry(0.022 * S, 0.09 * S, 5),
        { rot: [sz > 0 ? -100 : 100, 0, 0], pos: [sx * (0.20 + k * 0.05) * S, -0.28 * S, sz * 0.20 * S] }), C, 'ornament');
    }
    leg.userData.phase = (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5);
  }

  // *** THE MINOGAME TAIL. *** The Japanese spirit turtle has lived so long
  // that WEED GROWS OFF ITS SHELL and trails behind it like a straw raincoat.
  // It is the single most identifying feature of the Japanese version of this
  // creature and it is what stops the model reading as a generic tortoise.
  const weed = joint(core, 0, -0.02 * S, -0.82 * S);
  limbs.push(weed);
  const strands = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11 - 0.5) * 2.0;
    const st = joint(weed, Math.sin(a) * 0.26 * S, 0.06 * S - Math.abs(a) * 0.04 * S, 0);
    bp(st, ellipsoid(0.030 * S, 0.030 * S, rand(0.22, 0.42) * S, 5).translate(0, -0.06 * S, -0.26 * S), C);
    st.userData.phase = i * 0.5;
    strands.push(st);
  }

  const legs = limbs.filter(l => l.userData.phase !== undefined);
  let T = 0;
  return manifest(body, {
    height: 1.05 * S, radius: 0.80 * S, color: C, limbs,
    extras: { head, neckSegs, weed },
    // THE SLOWEST IDLE OF THE FOUR, and the neck does most of it. Everything
    // moves late and settles slowly — ten thousand years old.
    // SIGNATURE MATCHES THE CREATURE FAMILY: `(dt, st)`, with the clock
    // accumulated internally — the same contract every shikigami and every sea
    // shikigami keeps, so the viewer's bench and combat/beasts.js can drive
    // all three families through one call.
    tick(dt, st = {}) {
      const { gait = 0, strike = 0 } = st;
      T += dt;
      const t = T;
      core.position.y = 0.52 * S + Math.sin(t * 0.9) * 0.030 * S;
      core.rotation.z = Math.sin(t * 0.7) * 0.03;
      neckSegs.forEach((seg, i) => {
        seg.rotation.x = Math.sin(t * 0.8 - i * 0.4) * 0.10 - strike * 0.22;
        seg.position.z = 0.20 * S * (1 + strike * 0.7);
      });
      head.rotation.y = Math.sin(t * 0.5) * 0.20;
      head.rotation.x = Math.sin(t * 0.6 + 1) * 0.08;
      for (const l of legs) l.rotation.x = Math.sin(t * 3.0 + l.userData.phase) * 0.26 * gait;
      // the weed drags. It trails a beat BEHIND everything else, which is what
      // makes it read as something growing on him rather than as a tail.
      for (const st of strands) {
        // NEGATIVE. The weed hangs DOWN and back off the shell; a positive X
        // rotation on a -Z strand lifts it, and the first pass had the algae
        // standing up off his back like a crest.
        st.rotation.x = -0.45 - Math.sin(t * 1.4 + st.userData.phase) * 0.14 - gait * 0.30;
        st.rotation.z = Math.sin(t * 1.1 + st.userData.phase) * 0.14;
      }
    }
  });
}

// ===========================================================================
// 3 — 麒麟 KIRIN : the chimera of prosperity
// ===========================================================================
export function buildKirin() {
  const C = 0xffc24a;
  const S = 1.0;
  const body = new THREE.Group();
  const limbs = [];

  // DEER BODY — narrow chest, deep flank, high haunch. It is the lightest
  // barrel of the four and it should be: this is a deer wearing dragon scales.
  const core = joint(body, 0, 1.02 * S, 0);
  bp(core, ellipsoid(0.30 * S, 0.34 * S, 0.62 * S, 12), C, 'core');
  bp(core, ellipsoid(0.32 * S, 0.36 * S, 0.26 * S, 12).translate(0, 0.06 * S, -0.34 * S), C, 'core');
  // *** THE DRAGON SCALES ACROSS THE BODY. *** The iconography is explicit
  // that a qilin is scaled, not furred, and it is the feature that separates
  // it from a deer at a glance. Four rows of overlapping plates down the flank.
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 7; i++) {
      const a = (i / 7 - 0.5) * 2.6;
      const z = 0.34 * S - row * 0.24 * S;
      // ON the flank, not floating beside it: the body's half-width at this
      // yaw is 0.30 * cos(a) in x and the scale sits a hair proud of it. The
      // first pass placed them at a fixed 0.30 regardless of yaw, so every
      // scale off the centre line hung in the air.
      const rx = 0.30 * S, rz = 0.62 * S;
      bp(core, tGeo(roundBox(0.13 * S, 0.13 * S, 0.03 * S, 0.012 * S),
        { rot: [16, a * 57, a * 30 + 45],
          pos: [Math.sin(a) * rx * 1.02, 0.12 * S - Math.abs(a) * 0.10 * S, z * (1 - Math.abs(a) * 0.10)] }), C, 'ornament');
    }
  }
  spiralBand(core, 0.33 * S, 8, 0.045 * S, C, { y: -0.16 * S });

  // NECK — long, arched, and carrying THE MANE
  const neck = joint(core, 0, 0.22 * S, 0.44 * S);
  limbs.push(neck);
  bp(neck, ellipsoid(0.15 * S, 0.16 * S, 0.34 * S, 10).translate(0, 0.16 * S, 0.20 * S), C);
  // *** THE FLOWING MANE, as FLAME-SHAPED PLATES. *** The iconography calls
  // for "the flowing mane of a Chinese dragon"; drawn as fibres it would be
  // invisible at fighting distance, so it is nine carved flame plates climbing
  // the neck — which is also how it is actually drawn on temple carvings.
  const maneP = [];
  for (let i = 0; i < 9; i++) {
    const f = i / 8;
    const m = joint(neck, 0, 0.10 * S + f * 0.30 * S, -0.02 * S + f * 0.34 * S);
    const g = coneSpike(0.055 * S, (0.34 - f * 0.10) * S, new THREE.Vector3(0, 0, -0.16 * S), { radial: 5, hSeg: 3 });
    bp(m, tGeo(g, { rot: [-26 - f * 20, 0, 0] }), C, 'ornament');
    m.userData.phase = i * 0.42;
    maneP.push(m);
  }

  const head = joint(neck, 0, 0.42 * S, 0.42 * S);
  // BIGGER. The first pass's head disappeared under the antlers entirely.
  bp(head, ellipsoid(0.19 * S, 0.20 * S, 0.30 * S, 10), C, 'core');
  bp(head, ellipsoid(0.12 * S, 0.12 * S, 0.24 * S, 9).translate(0, -0.06 * S, 0.30 * S), C, 'core');
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(
      tGeo(roundBox(0.075 * S, 0.032 * S, 0.02 * S, 0.008 * S), { rot: [0, 0, s * 16], pos: [s * 0.095 * S, 0.045 * S, 0.19 * S] }),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    e.renderOrder = 4;
    head.add(e);
  }
  // *** ANTLERS AND A HORN, BOTH. *** The iconography gives the qilin antlers
  // AND a single forehead horn, and building only one of them makes it a deer
  // or a unicorn rather than a qilin.
  //
  // *** PASS 2. *** The first version built each tine as a baked `tGeo`
  // rotation on a shared parent and they came out of the bench as a BUNDLE OF
  // VERTICAL SPIKES — a wheat sheaf on his head rather than antlers. Antlers
  // read as antlers because the tines SPLAY OUTWARD AND BACKWARD off a beam
  // that itself leans out; a fan of near-parallel spikes reads as a crown.
  //
  // So each beam is now a real joint with its own rotation, and each tine is a
  // child joint with its own — which means the splay is expressed as a
  // hierarchy of angles rather than as one baked matrix, and it can be read
  // off the code.
  const antlers = joint(head, 0, 0.10 * S, -0.06 * S);
  limbs.push(antlers);
  for (const side of [1, -1]) {
    const beam = joint(antlers, side * 0.09 * S, 0.02 * S, 0);
    beam.rotation.z = side * -0.42;          // the beam leans OUT
    beam.rotation.x = -0.34;                 // and BACK
    const BL = 0.42 * S;
    bp(beam, ellipsoid(0.030 * S, BL * 0.5, 0.030 * S, 6).translate(0, BL * 0.5, 0), C, 'ornament');
    // three tines, each splaying further out and further back the higher it is
    for (const [f, len, out, back] of [[0.34, 0.20, 0.85, 0.30], [0.66, 0.17, 1.15, 0.50], [0.96, 0.14, 0.55, 0.75]]) {
      const tine = joint(beam, 0, BL * f, 0);
      tine.rotation.z = side * -out;
      tine.rotation.x = -back;
      bp(tine, ellipsoid(0.020 * S, len * S * 0.5, 0.020 * S, 5).translate(0, len * S * 0.5, 0), C, 'ornament');
      bp(tine, tGeo(new THREE.ConeGeometry(0.016 * S, 0.05 * S, 5), { pos: [0, len * S + 0.02 * S, 0] }), C, 'ornament');
    }
  }
  // THE FOREHEAD HORN — forward over the muzzle, as its own joint for the same
  // reason Kaichi's is: a baked negative rotation put his backwards.
  {
    const fh = joint(head, 0, 0.10 * S, 0.10 * S);
    fh.rotation.x = 44 * Math.PI / 180;
    const L = 0.34 * S;
    const g = new THREE.ConeGeometry(0.045 * S, L, 7);
    g.translate(0, L * 0.5, 0);
    bp(fh, g, C, 'core');
    for (let i = 0; i < 4; i++) {
      const r = 0.045 * S * (1 - i * 0.2) + 0.008 * S;
      bp(fh, tGeo(new THREE.TorusGeometry(r * 1.2, r * 0.3, 5, 9), { rot: [90, 0, 0], pos: [0, (0.12 + i * 0.22) * L, 0] }), C, 'ornament');
    }
  }

  // FOUR LEGS with HORSE HOOVES — the third clause of the chimera
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const leg = joint(core, sx * 0.22 * S, -0.26 * S, sz * 0.34 * S);
    limbs.push(leg);
    bp(leg, ellipsoid(0.085 * S, 0.26 * S, 0.10 * S, 8).translate(0, -0.22 * S, 0), C);
    bp(leg, ellipsoid(0.055 * S, 0.28 * S, 0.062 * S, 8).translate(0, -0.68 * S, 0.02 * S), C);
    // the hoof: ONE solid block, not two — that is what makes it a horse
    bp(leg, tGeo(new THREE.CylinderGeometry(0.075 * S, 0.085 * S, 0.10 * S, 8),
      { pos: [0, -0.96 * S, 0.02 * S] }), C, 'ornament');
    // and a fetlock tuft, because a qilin is drawn with them
    bp(leg, tGeo(coneSpike(0.05 * S, 0.16 * S, new THREE.Vector3(0, 0, -0.06 * S), { radial: 5 }),
      { rot: [200, 0, 0], pos: [0, -0.84 * S, -0.05 * S] }), C, 'ornament');
    leg.userData.phase = (sx > 0 ? 0 : Math.PI) + (sz > 0 ? 0 : Math.PI * 0.5);
  }

  // THE OX TAIL — the fourth clause. A long switch with a heavy tuft.
  const tail = joint(core, 0, 0.20 * S, -0.56 * S);
  limbs.push(tail);
  const tailSegs = [];
  let tp = tail;
  for (let i = 0; i < 3; i++) {
    const seg = joint(tp, 0, -0.02 * S, -0.16 * S);
    bp(seg, ellipsoid(0.035 * S - i * 0.005 * S, 0.035 * S, 0.10 * S, 6), C);
    tailSegs.push(seg);
    tp = seg;
  }
  for (let i = 0; i < 5; i++) {
    bp(tp, tGeo(coneSpike(0.04 * S, 0.24 * S, new THREE.Vector3(0, 0, -0.10 * S), { radial: 5 }),
      { rot: [190 + i * 4, (i - 2) * 24, 0], pos: [0, -0.04 * S, -0.14 * S] }), C, 'ornament');
  }

  const legs = limbs.filter(l => l.userData.phase !== undefined);
  let T = 0;
  return manifest(body, {
    height: 1.86 * S, radius: 0.52 * S, color: C, limbs,
    extras: { head, neck, antlers },
    // THE MOST ALIVE IDLE OF THE FOUR. The mane RIPPLES continuously — a qilin
    // is a creature of good fortune and it should look like it is burning
    // quietly — and the head is never still.
    // SIGNATURE MATCHES THE CREATURE FAMILY: `(dt, st)`, with the clock
    // accumulated internally — the same contract every shikigami and every sea
    // shikigami keeps, so the viewer's bench and combat/beasts.js can drive
    // all three families through one call.
    tick(dt, st = {}) {
      const { gait = 0, strike = 0 } = st;
      T += dt;
      const t = T;
      core.position.y = 1.02 * S + Math.sin(t * 2.1) * 0.026 * S;
      neck.rotation.x = -0.14 + Math.sin(t * 1.7) * 0.07 + strike * 0.4;
      head.rotation.x = 0.10 + Math.sin(t * 1.4 + 0.8) * 0.09 - strike * 0.6;
      head.rotation.y = Math.sin(t * 0.9) * 0.16 * (1 - gait);
      maneP.forEach((mn, i) => {
        mn.rotation.x = Math.sin(t * 3.4 - i * 0.4) * 0.16;
        mn.rotation.z = Math.sin(t * 2.6 - i * 0.3) * 0.12;
      });
      for (const l of legs) l.rotation.x = Math.sin(t * 6.0 + l.userData.phase) * 0.42 * gait;
      tailSegs.forEach((s, i) => {
        s.rotation.y = Math.sin(t * 1.8 - i * 0.5) * 0.20;
        s.rotation.x = Math.sin(t * 1.3 - i * 0.4) * 0.14;
      });
    }
  });
}

// ===========================================================================
// 4 — 龍 RYU : the one nobody has described
// ===========================================================================
// THE ULTIMATE'S BEAST. Built as a CHAIN so it can be driven like a serpent
// through the air — `extras.segments` is the whole body in order, and
// combat/beasts.js walks it with a follow-the-leader solve.
export function buildRyuDragon(segCount = 14) {
  const C = 0xd8e4ff;
  const S = 1.0;
  const body = new THREE.Group();
  const limbs = [];
  const segments = [];

  // HEAD — long, whiskered, antlered. A Chinese dragon's head is mostly SNOUT
  // and MANE; the skull itself is small.
  const head = joint(body, 0, 0, 0);
  segments.push(head);
  // 1.5x the first pass. The dragon is the ULTIMATE's beast and it is seen
  // from further away than any other model in the game; a head that reads at
  // bench distance and not at arena distance is not finished.
  bp(head, ellipsoid(0.30 * S, 0.30 * S, 0.48 * S, 11), C, 'core');
  bp(head, ellipsoid(0.19 * S, 0.18 * S, 0.42 * S, 10).translate(0, -0.06 * S, 0.48 * S), C, 'core');
  // the brow ridge and the jaw
  bp(head, tGeo(roundBox(0.30 * S, 0.07 * S, 0.20 * S, 0.03 * S), { pos: [0, 0.16 * S, 0.16 * S] }), C, 'ornament');
  bp(head, ellipsoid(0.11 * S, 0.06 * S, 0.26 * S, 9).translate(0, -0.14 * S, 0.34 * S), C);
  // teeth
  for (let i = 0; i < 5; i++) {
    for (const s of [1, -1]) {
      bp(head, tGeo(new THREE.ConeGeometry(0.022 * S, 0.09 * S, 5),
        { rot: [180, 0, 0], pos: [s * 0.085 * S, -0.09 * S, (0.18 + i * 0.10) * S] }), C, 'ornament');
    }
  }
  // eyes — the brightest thing in the model
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(
      tGeo(new THREE.SphereGeometry(0.048 * S, 9, 7), { pos: [s * 0.14 * S, 0.09 * S, 0.20 * S] }),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    e.renderOrder = 4;
    head.add(e);
  }
  // antlers
  for (const s of [1, -1]) {
    const beam = joint(head, s * 0.11 * S, 0.20 * S, -0.04 * S);
    limbs.push(beam);
    bp(beam, tGeo(ellipsoid(0.026 * S, 0.20 * S, 0.026 * S, 6), { rot: [-24, 0, s * 26], pos: [0, 0.18 * S, 0] }), C, 'ornament');
    for (const [f, len, spread] of [[0.5, 0.14, 48], [0.85, 0.12, 20]]) {
      bp(beam, tGeo(ellipsoid(0.019 * S, len * S, 0.019 * S, 5),
        { rot: [-14, 0, s * spread], pos: [s * 0.07 * S * f, 0.14 * S + f * 0.24 * S, 0] }), C, 'ornament');
    }
  }
  // *** THE WHISKERS. *** Long, trailing, and they are the single most
  // identifying feature of a Chinese dragon's head. Segmented so they drag.
  const whiskers = [];
  for (const s of [1, -1]) {
    let wp = joint(head, s * 0.10 * S, -0.06 * S, 0.52 * S);
    limbs.push(wp);
    for (let i = 0; i < 5; i++) {
      const seg = joint(wp, s * 0.05 * S, 0.01 * S, 0.20 * S);
      bp(seg, ellipsoid(0.016 * S, 0.016 * S, 0.12 * S, 5), C, 'ornament');
      whiskers.push({ seg, s, i });
      wp = seg;
    }
  }
  // the chin beard
  for (let i = 0; i < 3; i++) {
    bp(head, tGeo(coneSpike(0.030 * S, 0.22 * S, new THREE.Vector3(0, 0, 0.06 * S), { radial: 5 }),
      { rot: [186, (i - 1) * 24, 0], pos: [(i - 1) * 0.05 * S, -0.20 * S, 0.44 * S] }), C, 'ornament');
  }

  // THE BODY — a chain of ringed segments, tapering to the tail. Each is its
  // own joint parented to the PREVIOUS one, so a follow-the-leader solve in
  // combat/beasts.js makes the whole thing move like a serpent for free.
  let prev = head;
  for (let i = 0; i < segCount; i++) {
    const f = i / (segCount - 1);
    const r = (0.20 - f * 0.15) * S;
    const seg = joint(prev, 0, 0, -0.36 * S);
    bp(seg, ellipsoid(r, r, 0.22 * S, 9), C, i < 4 ? 'core' : 'body');
    // the dorsal ridge — a fin plate on every segment, which is what makes a
    // tube read as a dragon
    bp(seg, tGeo(coneSpike(r * 0.44, r * 1.5, new THREE.Vector3(0, 0, -r * 0.7), { radial: 5 }),
      { pos: [0, r * 0.8, 0] }), C, 'ornament');
    // and a scale band every third segment
    if (i % 3 === 0) spiralBand(seg, r * 1.05, 6, r * 0.22, C);
    segments.push(seg);
    limbs.push(seg);
    prev = seg;
    // FOUR SHORT CLAWED LEGS, at segments 2 and 8 — a Chinese dragon has legs
    // and they are small and they matter
    if (i === 2 || i === 8) {
      for (const s of [1, -1]) {
        const leg = joint(seg, s * r * 0.9, -r * 0.5, 0);
        limbs.push(leg);
        bp(leg, ellipsoid(0.05 * S, 0.15 * S, 0.055 * S, 7).translate(s * 0.06 * S, -0.13 * S, 0), C);
        for (let k = 0; k < 3; k++) {
          bp(leg, tGeo(new THREE.ConeGeometry(0.024 * S, 0.11 * S, 5),
            { rot: [150, 0, s * (k - 1) * 30], pos: [s * (0.10 + k * 0.02) * S, -0.26 * S, (k - 1) * 0.05 * S] }), C, 'ornament');
        }
      }
    }
  }
  // the tail fan
  for (let i = 0; i < 5; i++) {
    bp(prev, tGeo(coneSpike(0.035 * S, 0.30 * S, new THREE.Vector3(0, 0, -0.10 * S), { radial: 5 }),
      { rot: [96, (i - 2) * 26, 0], pos: [0, 0, -0.18 * S] }), C, 'ornament');
  }

  let T = 0;
  return manifest(body, {
    height: 0.9 * S, radius: 0.4 * S, color: C, limbs,
    extras: { head, segments, whiskers },
    // The idle is a SLOW COIL. Every segment lags the one in front of it by a
    // fixed phase, which is the cheapest possible serpent and is completely
    // convincing at fighting distance.
    // SIGNATURE MATCHES THE CREATURE FAMILY: `(dt, st)`, with the clock
    // accumulated internally — the same contract every shikigami and every sea
    // shikigami keeps, so the viewer's bench and combat/beasts.js can drive
    // all three families through one call.
    tick(dt, st = {}) {
      const { gait = 0, strike = 0 } = st;
      T += dt;
      const t = T;
      segments.forEach((seg, i) => {
        if (i === 0) return;
        const p = t * 2.2 - i * 0.42;
        // *** GENTLE. *** The first pass used 0.16 rad per segment on a
        // fourteen-segment chain, and because each segment is a CHILD of the
        // one in front the rotations COMPOUND: fourteen segments at 0.16 is
        // 2.2 radians of accumulated bend, so `swim` folded the dragon into a
        // knot on the floor. Per-segment amplitude has to be divided by the
        // chain length, not chosen for how one joint looks.
        seg.rotation.y = Math.sin(p) * (0.105 + strike * 0.05);
        seg.rotation.x = Math.cos(p * 0.8) * (0.060 + gait * 0.03);
      });
      for (const w of whiskers) {
        w.seg.rotation.y = Math.sin(t * 2.6 - w.i * 0.5) * 0.22 * w.s;
        w.seg.rotation.x = Math.sin(t * 2.0 - w.i * 0.4) * 0.16;
      }
      head.rotation.z = Math.sin(t * 1.2) * 0.08;
    }
  });
}

export const BEAST_BUILDERS = {
  kaichi: buildKaichi,
  reiki: buildReiki,
  kirin: buildKirin,
  ryu: buildRyuDragon
};

export function buildBeast(key) {
  const fn = BEAST_BUILDERS[key];
  return fn ? fn() : null;
}
