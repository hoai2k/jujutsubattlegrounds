// ===========================================================================
// YUKI TSUKUMO 九十九由基 — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-19 from the Jujutsu Kaisen Wiki's Appearance section
// (search-result extraction; the fandom host answers 402 to WebFetch in this
// environment, so NO IMAGE WAS VIEWED — the same caveat models/maki.js and
// models/miwa.js record, and the same APPROXIMATED list at the bottom).
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// Wiki: "a very tall young woman with a slender yet athletic build and light
// skin." No official figure is published. "Very tall" for a woman drawn beside
// Yuji (173) and Todo (190) puts her around 180; H = 1.82 here. Against the
// shipped cast:
//     Miwa 1.66 · Maki 1.74 · Kashimo 1.79 · >>> YUKI 1.82 <<< · Naoya 1.83 ·
//     Nanami 1.845 · Higuruma/Geto 1.86 · Toji 1.88 · Gojo 1.92 · Todo 2.00
// so she is the tallest woman in the game by 8 cm and stands eye to eye with
// the adult men — which is the read the reference asks for.
//
// THE BRIEF'S NOTE — "physically imposing without Todo's bulk" — is exactly
// the wiki's "slender YET athletic", and the two numbers that say it are
// `muscle: 1.12` (real arm and shoulder mass, above Nanami's 1.10, well under
// Todo's 1.38) against `bulk: 0.92` (a NARROW torso). Wide shoulders, long
// limbs, no thickness through the middle. She is imposing because of scale and
// posture, not because of mass — and the posture half of that lives in
// art/anim/yuki.js, which is where the swagger is.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Wiki: "wide brown (pink in the manga) eyes with thin eyebrows and pronounced
// eyelashes."
//   EYES     WIDE — the second-widest aperture on the roster after Miwa's, and
//            the two are doing opposite things with it: Miwa's width is worry,
//            Yuki's is openness. What separates them is the LID LINE and the
//            brow. Colour: the wiki gives brown for the anime and pink for the
//            manga. Taken as a warm rose-brown (#a86a68) which is legitimately
//            both, and which is far more distinctive on screen than a plain
//            brown would be. This is a judgement call and it is stated so.
//   LASHES   "pronounced" is called out explicitly, so they are real geometry:
//            a heavy upper lash line plus three separate flicks at the outer
//            corner of each eye. Nobody else on the roster gets flicks.
//   BROWS    thin, and set at a relaxed near-level angle with a slight outer
//            drop — the "amused" read. Distinct from Naoya's inner-down sneer
//            and from Gojo's high arch.
//   MOUTH    the important one. The brief wants "confident, casual, amused —
//            relaxed in a way that reads as earned rather than arrogant,
//            distinct from Gojo's smugness and Naoya's contempt." The solve is
//            geometric: Gojo's smirk is ASYMMETRIC (one corner up, the other
//            flat) which reads as "I know something you don't"; Naoya's is a
//            downturned line. Yuki's is a SYMMETRIC, gently upturned line —
//            an easy open half-smile with both corners lifted the same amount.
//            Symmetry is the whole difference: a symmetric smile is relaxed,
//            an asymmetric one is superior.
//
// ---------------------------------------------------------------------------
// HAIR, FROM EVERY ANGLE — this is her silhouette and it gets the most budget
// ---------------------------------------------------------------------------
// Wiki: "long blonde hair that extends well down her back with two tufts in
// front of each side of her face."
// FRONT: a centre-parted fringe that opens away from the forehead, plus THE
//   TWO TUFTS — the named feature. These are thick, distinct locks hanging in
//   front of each shoulder, well forward of the rest of the mass, and they are
//   what makes her recognisable in a silhouette test. They are built noticeably
//   heavier than any hair card elsewhere in the project.
// 3/4: real volume at the crown — unlike Maki's and Miwa's flat scalps, Yuki's
//   hair has body, so the shell is scaled up and the cards start proud of it.
// SIDE: the mass falls behind the shoulder and past the shoulder blade.
// BACK: long, to roughly the small of the back, widening as it falls (a
//   triangular back silhouette rather than a straight sheet) and breaking into
//   three or four distinct heavy locks at the ends rather than a single blunt
//   cut. That widening is the "volume" note and it is what separates her back
//   view from Miwa's.
// SPRINGS: the two face tufts AND the two heaviest back locks are all spring
//   chains. Four chains is the most of any model in the project and it is
//   justified — she is the heavy character, every animation has enormous
//   follow-through, and hair that keeps moving after she stops is most of what
//   sells mass.
// COLOUR: a warm mid blonde #e8c877 over a deeper #c9a352 underlayer. NOT the
//   pale platinum Gojo's white sits at and not Nanami's amber; a real yellow
//   blonde with warmth in it.
//
// ---------------------------------------------------------------------------
// GARMENTS
// ---------------------------------------------------------------------------
// Wiki: "a sleeveless, heather indigo top reminiscent of female Chinese
// martial artists' attire with a gold mandarin collar. The vest is tucked into
// high-waisted stone blue jeans. Most of her stomach area is covered with a
// buttoned grey bodice."
// Three layers, and all three are load-bearing for the silhouette:
//   · TOP      sleeveless, heather indigo #4a5270 — a desaturated blue-grey
//              violet, which is what "heather" means and is why it must not be
//              a flat navy. Bare arms, so `armSlot: 'skin'`, the same builder
//              feature Toji's short sleeves and Maki's sleeveless top use.
//   · COLLAR   GOLD MANDARIN — a standing band collar, #c8a44e. Small, and the
//              single most distinctive colour note on the model: it is the
//              only warm value above the waist and it frames the face.
//              A Chinese-style closure runs down from it — frog fastenings,
//              built as four small toggle pairs.
//   · BODICE   the buttoned grey panel over the midriff #7c8290, worn OVER the
//              top and under the belt line, with a visible run of buttons up
//              the centre. This is the layer most easily missed and it is
//              explicitly in the reference, so it gets real geometry and its
//              own value.
//   · JEANS    high-waisted, stone blue #6b7a92. HIGH-waisted matters — the
//              waistband sits above the natural waist, which is what makes the
//              legs read as long, which is most of "very tall".
//   · BOOTS    plain and dark #232630.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin      #f2d8bc      hair       #e8c877      hairDk  #c9a352
//   top       #4a5270      collar     #c8a44e      bodice  #7c8290
//   jeans     #6b7a92      boots      #232630      button  #4a4f5a
//   eyes      #a86a68      brows      #b89050      lash    #3a2a24
//   rim       #ffe4c0      outline    #0b0a12      accent  #6f7fd0
// THE ACCENT IS INDIGO-VIOLET, not gold, and that is deliberate. The obvious
// pick for a blonde is amber — but Nanami is already #f2b23c and Hakari
// #ffc93c, and a third amber on the select screen would be indefensible. The
// indigo comes off the top and off STAR RAGE itself: her mass effects, her
// gravitational shimmer and her black hole all render in this hue, and the
// character's colour should be her technique's colour. It also puts her a
// clear distance from Kashimo's #a46bff (a true purple) on the same screen.
//
// ---------------------------------------------------------------------------
// THE MASS TELLS — what `setMass(f)` drives
// ---------------------------------------------------------------------------
// `f` is 0..1, the fraction of her mass meter, written every tick from
// combat/mass.js. Three things move, all built once here:
//   1. SHIMMER — a faint refractive shell standing off her whole body,
//      opacity and scale rising with f. Space bending, not energy glowing.
//   2. DUST — motes drawn INWARD toward her rather than radiating out. This
//      is the one that actually communicates gravity, because every other
//      effect in the game moves outward and this one is the only thing on
//      screen travelling the wrong way.
//   3. WEIGHT — at f > 0.55 the shimmer gains a visible dark core; the ground
//      cracking at maximum is the arena's job (see combat/mass.js, which calls
//      destruct) rather than the model's.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the two heavy face tufts       4. the grey buttoned bodice
//   2. the gold mandarin collar       5. very tall, long-legged silhouette
//   3. bare arms over the indigo top  6. the easy symmetric half-smile
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the top's exact cut and how the frog fastenings run. "Reminiscent of
//     female Chinese martial artists' attire" is the whole reference.
//   · the bodice's button count and panel shape.
//   · the hair's exact lock breakdown at the ends.
//   · her hands. The shared mitt, unchanged.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, ribbonShell } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const SKIN = 0xf2d8bc;
const HAIR = 0xe8c877;
const HAIR_DK = 0xc9a352;
const TOP = 0x4a5270;
const COLLAR = 0xc8a44e;
const BODICE = 0x7c8290;
const JEANS = 0x6b7a92;
const BOOT = 0x232630;
const BUTTON = 0x4a4f5a;
const EYE = 0xa86a68;
const STAR = 0x6f7fd0;

export function buildYuki() {
  const spec = {
    id: 'yuki', name: 'Yuki', H: 1.82, headScale: 0.97,
    // WIDE SHOULDERS, NARROW EVERYTHING ELSE. 0.110 is broad — between Nanami
    // and Toji — over a `bulk` of 0.92, which is narrower than Nobara's torso.
    // That combination is precisely "slender yet athletic".
    shoulder: 0.110, hip: 0.052, muscle: 1.12, bulk: 0.92, legBulk: 0.96,
    skinTone: SKIN,
    clothColor: TOP,
    // ---- SLEEVELESS: THE SLOT AND THE COLOUR ARE TWO SEPARATE THINGS -----
    // PASS 2 FIX. `armSlot: 'skin'` only changes which MATERIAL the arm tubes
    // shade through; the arm's vertex colour still comes from `sleeveColor`,
    // which defaults to `clothColor`. With only the slot set she came out with
    // skin-shaded arms painted indigo — a sleeveless top with sleeves. Toji's
    // model gets this right (`armSlot: 'skin', sleeveColor: SKIN, handColor:
    // SKIN`) and this now matches it.
    armSlot: 'skin', foreArmSlot: 'skin',
    sleeveColor: SKIN, foreSleeveColor: SKIN, handColor: SKIN,
    pantColor: JEANS, shoeColor: BOOT,
    torsoShape: { chest: 0.97, waist: 0.82, hip: 0.94 },
    face: { jaw: 0.92, chin: 1.00, width: 1.00 },
    shoe: { len: 0.108, wid: 0.044, hgt: 0.056 },
    palette: {
      rim: 0xffe4c0, hairRim: 0xfff0c0, outline: 0x0b0a12,
      accent: 0x6f7fd0, energy: 0x8f9fe8, metalRim: 0xffe8b8
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE ---------------------------------------------------------------
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.56, eyeH = headR * 0.33;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.395;
    // PRONOUNCED LASHES — the reference calls them out, so they are built,
    // and they are the only ones on the roster with separate flicks.
    bag.add('flat', tGeo(roundBox(eyeW * 1.08, eyeH * 0.22, 0.004, 0.002),
      { rot: [0, 0, s * 9], pos: [ex, eyeY + eyeH * 0.46, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x3a2a24 });
    for (let k = 0; k < 3; k++) {
      bag.add('flat', tGeo(new THREE.ConeGeometry(eyeH * 0.055, eyeW * (0.26 - k * 0.05), 3),
        { rot: [0, 0, s * (-68 - k * 12)], pos: [ex + s * eyeW * (0.46 + k * 0.09), eyeY + eyeH * (0.50 - k * 0.06), faceZ + headR * 0.028] }),
        { bone: 'Head', color: 0x3a2a24 });
    }
    bag.add('flat', tGeo(roundBox(eyeW, eyeH, 0.004, eyeH * 0.44),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xfbf8f6 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.46, 14),
      { scale: [0.88, 1.06, 1], pos: [ex - s * eyeW * 0.04, eyeY, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.20, 10),
      { pos: [ex - s * eyeW * 0.04, eyeY, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x2a1414 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.14, 8),
      { pos: [ex - s * eyeW * 0.16, eyeY + eyeH * 0.18, faceZ + headR * 0.031] }),
      { bone: 'Head', color: 0xffffff });
    // BROW: thin, near level, dropping slightly at the OUTER end. Relaxed.
    bag.add('flat', tGeo(roundBox(eyeW * 0.90, eyeH * 0.11, 0.004, 0.002),
      { rot: [0, 0, s * 6], pos: [ex, eyeY + eyeH * 1.22, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0xb89050 });
  }
  // ---- THE MOUTH: THE SYMMETRIC HALF-SMILE -------------------------------
  // Both corners lifted by the SAME amount. See the header: symmetry is the
  // entire difference between "relaxed" and "superior", and it is the one
  // thing that has to separate her from Gojo on a screen where both of them
  // are grinning.
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.115, headR * 0.036, 0.004, 0.002),
      { rot: [0, 0, s * 11], pos: [s * headR * 0.055, headC.y - headR * 0.585, faceZ - headR * 0.045] }),
      { bone: 'Head', color: 0x9c5054 });
  }

  // ---- HAIR ---------------------------------------------------------------
  // VOLUME. The shell is scaled UP (1.09) rather than hugging the skull, which
  // is the opposite of Maki's and Miwa's flat scalps and is where "her
  // silhouette" starts.
  const FACE_GAP = 1.06;
  bag.add('hair', tGeo(sphereShell(headR * 1.09, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.74, scale: [1.06, 1.06, 1.10]
  }), { pos: [headC.x, headC.y + headR * 0.05, headC.z - headR * 0.03] }), { bone: 'Head', color: HAIR });

  const card = (from, mid, to, w0, w1, hint, color = HAIR) => {
    const geo = ribbonShell([from, mid, to], t => w0 + (w1 - w0) * t, headR * 0.095,
      { seg: 9, normalHint: hint.clone().normalize(), taperThick: false });
    bag.add('hair', geo, { bone: 'Head', color });
  };

  // FRINGE: centre-parted, opening AWAY from the forehead on both sides. The
  // parting is dead centre — unlike Miwa's, whose asymmetry is her whole cut.
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;                       // the part itself is a gap
    const a = i * 0.28;
    const sx = Math.sin(a) * headR * 0.90;
    const sz = Math.cos(a) * headR * 0.84;
    const out = Math.sign(i) * 0.20;             // sweeps outward, not down
    // PASS 2 FIX — THE FRINGE WAS OVER HER EYES. The end height now depends on
    // how far OUT the card sits: near the centre parting it stops above the
    // brow, and only the outermost cards reach the cheek. A constant end
    // height put a curtain across the face from every angle, which is the
    // single most common way procedural hair goes wrong and it went wrong here.
    // PASS 3: the falloff starts at |i| = 1 rather than 0. At pass 2 the
    // innermost cards ended a hair above the eye line and, being 0.30·headR
    // wide, still covered it. Only the outermost pair reaches the cheek now.
    const outness = Math.max(0, Math.min(1, (Math.abs(i) - 1) / 2));
    const endY = headC.y + headR * (0.30 - outness * 0.86);
    card(
      v3(sx * 0.86, headC.y + headR * 0.66, sz * 0.86),
      v3(sx * 1.06 + out * headR, headC.y + headR * 0.36, sz * 1.02),
      v3(sx * 1.16 + out * 2.4 * headR, endY, sz * 0.90),
      headR * 0.30, headR * 0.19,
      v3(sx, headR * 0.30, sz)
    );
  }

  // ---- SIDES AND BACK: LONG, AND WIDENING AS IT FALLS --------------------
  // The triangular back silhouette. Each card's endpoint is pushed OUTWARD in
  // proportion to how far back it sits, so the mass spreads on the way down
  // instead of hanging as a straight sheet. That spread is the difference
  // between her back view and Miwa's.
  // PASS 2 FIX — this ring used to run from 0.20pi to 1.80pi, a 288-degree
  // sweep that includes the FRONT of the skull, so the longest cards in the
  // set hung straight down over her face. It is now the back hemisphere plus
  // a little, 0.46pi to 1.54pi, and nothing long starts in front of the ears.
  for (let i = 0; i < 15; i++) {
    const a = Math.PI * 0.46 + (i / 14) * Math.PI * 1.08;
    const sx = Math.sin(a), sz = Math.cos(a);
    const back = Math.max(0, -sz);
    const len = headR * (2.35 + back * 0.75);
    const spread = 1.02 + back * 0.55;           // <- the widening
    card(
      v3(sx * headR * 0.88, headC.y + headR * 0.46, sz * headR * 0.88),
      v3(sx * headR * 1.10, headC.y - headR * 0.62, sz * headR * 1.14),
      v3(sx * headR * spread * 1.20, headC.y - len, sz * headR * 1.22),
      headR * 0.34, headR * 0.26,
      v3(sx, 0.20, sz),
      i % 3 === 1 ? HAIR_DK : HAIR
    );
  }

  // =========================================================================
  // THE GARMENTS
  // =========================================================================
  // ---- THE GOLD MANDARIN COLLAR ------------------------------------------
  // A standing band, and the only warm value above the waist. Small piece of
  // geometry, disproportionately large share of the character's read.
  bag.add('cloth', tGeo(latheY([
    [0.045 * H, y.neck - 0.030 * H], [0.043 * H, y.neck + 0.004 * H],
    [0.042 * H, y.neck + 0.032 * H], [0.042 * H, y.neck + 0.046 * H]
  ], 18, 0.84), { pos: [0, 0, 0.004 * H] }), { bone: 'Neck', color: COLLAR });
  // the gold trim continues a short way down the front opening
  bag.add('cloth', tGeo(roundBox(0.016 * H, 0.120 * H, 0.010 * H, 0.004 * H),
    { rot: [0, 0, -6], pos: [0.014 * H, 0.706 * H, 0.058 * H] }),
    { chain: torsoChain, color: COLLAR, blend: 0.04 });
  // ---- FROG FASTENINGS ----------------------------------------------------
  // The Chinese-style closure. Four toggle pairs down the front opening — a
  // small detail, but it is what makes the top read as the martial-arts
  // garment the reference describes rather than as a plain tank.
  for (let i = 0; i < 4; i++) {
    const yy = 0.752 * H - i * 0.036 * H;
    for (const s of [1, -1]) {
      bag.add('cloth', tGeo(roundBox(0.020 * H, 0.007 * H, 0.008 * H, 0.003 * H),
        { rot: [0, 0, s * 8], pos: [0.014 * H + s * 0.016 * H, yy, 0.060 * H] }),
        { chain: torsoChain, color: COLLAR, blend: 0.03 });
    }
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.0075 * H, 7, 6),
      { pos: [0.014 * H, yy, 0.062 * H] }), { chain: torsoChain, color: COLLAR, blend: 0.02 });
  }

  // ---- THE BODICE ---------------------------------------------------------
  // The buttoned grey panel over the midriff, worn OVER the top. Explicitly in
  // the reference and easy to miss, so it gets its own lathe and its own
  // value. It also does real silhouette work: a lighter band across the waist
  // is what stops a tall narrow figure reading as a single column.
  bag.add('cloth', tGeo(latheY([
    [0.056 * H, 0.560 * H], [0.060 * H, 0.582 * H], [0.061 * H, 0.616 * H],
    [0.060 * H, 0.648 * H], [0.057 * H, 0.672 * H]
  ], 22, 0.78)), { chain: torsoChain, color: BODICE, blend: 0.05 });
  // its buttons, up the centre front
  for (let i = 0; i < 5; i++) {
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0068 * H, 0.0068 * H, 0.005 * H, 8),
      { rot: [90, 0, 0], pos: [0, 0.578 * H + i * 0.024 * H, 0.050 * H] }),
      { chain: torsoChain, color: BUTTON, blend: 0.02 });
  }

  // ---- THE HIGH WAISTBAND -------------------------------------------------
  // Sits ABOVE the natural waist. This is what makes the legs read long, which
  // is most of what makes her read tall.
  bag.add('cloth', tGeo(latheY([
    [0.062 * H, 0.512 * H], [0.065 * H, 0.526 * H],
    [0.065 * H, 0.556 * H], [0.062 * H, 0.566 * H]
  ], 20, 0.80)), { chain: torsoChain, color: JEANS, blend: 0.04 });
  // belt loops and a small stud, to say "jeans" rather than "trousers"
  for (const s of [1, -1, 0]) {
    bag.add('cloth', tGeo(roundBox(0.010 * H, 0.026 * H, 0.008 * H, 0.003 * H),
      { pos: [s * 0.036 * H, 0.538 * H, 0.052 * H * (s === 0 ? 1 : 0.7)] }),
      { chain: torsoChain, color: 0x56637a, blend: 0.02 });
  }

  // =========================================================================
  // THE HAIR SPRINGS — four chains, the most of any model in the project
  // =========================================================================
  const hairMat = MAT.hair({ vertexColors: false, color: HAIR, rimColor: 0xfff0c0 });
  const hairDkMat = MAT.hair({ vertexColors: false, color: HAIR_DK, rimColor: 0xffe0a0 });
  const springs = [];
  // ---- THE TWO FACE TUFTS ------------------------------------------------
  // THE named feature — "two tufts in front of each side of her face" — and
  // the thing a silhouette test recognises her by. Built heavier than any hair
  // card elsewhere in the project: wide at the root, barely tapering, and hung
  // WELL FORWARD of the shoulder so they sit in front of the body rather than
  // beside it.
  for (const s of [1, -1]) {
    const seg1 = makeFlapMesh(headR * 0.46, headR * 0.44, headR * 1.20, headR * 0.13,
      hairMat, HAIR, { color: 0x0b0a12, thickness: 0.014 });
    const seg2 = makeFlapMesh(headR * 0.44, headR * 0.34, headR * 1.05, headR * 0.11,
      hairMat, HAIR, { color: 0x0b0a12, thickness: 0.014 });
    springs.push({
      bone: 'Head',
      // PASS 2 FIX: pushed OUT to 1.02 and BACK to +0.06 (from 0.78 / +0.40).
      // At the old offset the tufts hung down the front of her cheeks and met
      // the fringe in a solid curtain. The reference has them in front of the
      // SHOULDERS, outboard of the jaw — so they frame the face rather than
      // covering it, and the `restDir` now leans outward as well as down.
      localOffset: v3(s * headR * 1.02, headC.y - headR * 0.10, headC.z + headR * 0.06),
      restDir: v3(s * 0.30, -1, 0.06).normalize(),
      segments: [{ len: headR * 1.20, mesh: seg1 }, { len: headR * 1.05, mesh: seg2 }],
      stiffness: 46, damping: 0.82, gravity: 7.0
    });
  }
  // ---- THE TWO HEAVY BACK LOCKS ------------------------------------------
  // Longer, slower and heavier than the tufts. These are the ones that are
  // still travelling when a Mass Slam has already landed, which is the whole
  // reason a heavyweight gets four spring chains.
  for (const s of [1, -1]) {
    const seg1 = makeFlapMesh(headR * 0.40, headR * 0.42, headR * 1.40, headR * 0.12,
      hairDkMat, HAIR_DK, { color: 0x0b0a12, thickness: 0.014 });
    const seg2 = makeFlapMesh(headR * 0.42, headR * 0.30, headR * 1.30, headR * 0.10,
      hairDkMat, HAIR_DK, { color: 0x0b0a12, thickness: 0.014 });
    springs.push({
      bone: 'Head',
      localOffset: v3(s * headR * 0.44, headC.y - headR * 0.24, headC.z - headR * 0.86),
      restDir: v3(s * 0.16, -1, -0.20).normalize(),
      segments: [{ len: headR * 1.40, mesh: seg1 }, { len: headR * 1.30, mesh: seg2 }],
      // the lowest stiffness and the highest damping in the project: heavy
      // things start late and stop late
      stiffness: 26, damping: 0.88, gravity: 8.0
    });
  }

  // =========================================================================
  // STAR RAGE — THE MASS TELLS
  // =========================================================================
  // Built once, driven every tick by `setMass(f)`. See the header for what
  // each of the three layers is doing and why the dust travels INWARD.
  const shimmerMat = new THREE.MeshBasicMaterial({
    color: STAR, transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide
  });
  const shimmer = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), shimmerMat);
  shimmer.position.y = H * 0.52;
  shimmer.scale.set(1, 1.55, 1);

  // THE DARK CORE — appears past f 0.55. A black hole is not a glow, and the
  // one honest way to draw enormous mass is to make the middle of it DARKER
  // than the world behind it.
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x0a0a16, transparent: true, opacity: 0, depthWrite: false
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.30, 16, 12), coreMat);
  core.position.y = H * 0.52;
  core.scale.set(1, 1.35, 1);

  // THE INFALLING DUST. 24 motes on their own radii and phases, each running
  // from an outer radius toward her centre and respawning outward. Every other
  // particle effect in this game travels outward; these are the only things on
  // screen moving the wrong way, and that is what reads as gravity.
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0xb8c4f0, transparent: true, opacity: 0, depthWrite: false
  });
  const dustGeo = new THREE.SphereGeometry(0.030, 5, 4);
  const dust = [];
  const dustGroup = new THREE.Group();
  dustGroup.position.y = H * 0.50;
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(dustGeo, dustMat);
    dust.push({
      mesh: m,
      // deterministic layout — no Math.random in a model builder, because the
      // online path builds the same model on every client
      ang: (i / 24) * Math.PI * 2 * 3.7,
      yy: ((i * 7) % 24) / 24 - 0.5,
      r: 0.6 + ((i * 13) % 24) / 24 * 1.5,
      speed: 0.55 + ((i * 5) % 24) / 24 * 0.75,
      t: (i / 24)
    });
    dustGroup.add(m);
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0130, outlineHairScale: 0.95
  });

  // the three mass layers hang off the root group, not off a bone: they are
  // world-space phenomena around her, and parenting them to the chest would
  // make the singularity lean when she does
  model.group.add(shimmer, core, dustGroup);

  let massF = 0;
  model.setMass = f => { massF = Math.max(0, Math.min(1, f || 0)); };

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    const f = massF;
    // 1 — THE SHIMMER: space bending. Grows and thickens with the meter.
    shimmerMat.opacity = f * 0.20;
    const s = 1 + f * 0.34;
    shimmer.scale.set(s, 1.55 * s, s);
    shimmer.rotation.y += dt * (0.4 + f * 1.6);
    // 2 — THE CORE: past the halfway mark only, and it goes DARK.
    const cf = Math.max(0, (f - 0.55) / 0.45);
    coreMat.opacity = cf * 0.55;
    core.visible = cf > 0.001;
    core.scale.setScalar(0.7 + cf * 0.9);
    core.scale.y *= 1.35;
    // 3 — THE DUST: inward. `t` runs 1 -> 0 and the mote sits at radius r*t,
    // so it accelerates visually as it falls (constant dt, shrinking radius).
    dustMat.opacity = f * 0.85;
    dustGroup.visible = f > 0.02;
    if (dustGroup.visible) {
      for (const d of dust) {
        d.t -= dt * d.speed * (0.4 + f * 1.4);
        if (d.t <= 0) d.t += 1;
        const r = d.r * d.t * (0.6 + f * 0.9);
        d.mesh.position.set(Math.cos(d.ang) * r, d.yy * r * 1.4, Math.sin(d.ang) * r);
        // motes shrink as they fall in, which sells the acceleration
        d.mesh.scale.setScalar(0.5 + d.t * 0.9);
      }
      dustGroup.rotation.y += dt * (0.3 + f * 0.9);
    }
  };
  model.setMass(0);
  return model;
}
