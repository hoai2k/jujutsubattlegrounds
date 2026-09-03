// ===========================================================================
// TOJI FUSHIGURO 伏黒甚爾 — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-05. IMAGE REFERENCE WAS VIEWED, which is a first for this
// project: the fandom host still answers 402 to WebFetch, but the in-app
// browser loads it, and the official anime character sheet plus the coloured
// manga illustration were downloaded and read directly. Text is from the wiki's
// Appearance / Personality / Cursed Restrictions / Equipment sections.
// Weapons have their own sheet — see models/toji_weapons.js.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// Canon puts him around 188 cm, so H = 1.88. Against the shipped cast that
// lands him:
//     Yuta 1.73 · Yuji/Megumi/Mahito 1.75 · Nanami 1.845 · Higuruma 1.86 ·
//     >>> TOJI 1.88 <<< · Gojo 1.92 · Sukuna 1.94 · Hakari 1.95 · Todo 2.00
// which satisfies the brief exactly: bigger than Yuji, smaller than Todo.
// MASS is where he actually places, though. `muscle: 1.30` puts him second only
// to Todo's 1.38 and above Hakari (1.28) and Sukuna (1.24) — the wiki calls the
// arms, shoulders and chest "bulky and defined" with a firm cored midsection,
// and the character sheet shows a genuinely thick athlete rather than a
// bodybuilder, so the bulk multiplier stays moderate (1.12) while the LIMB
// muscle multiplier goes high. That combination is what reads as "athletic and
// dangerous" instead of "inflated".
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Wiki: "mid-length straight black hair that reaches to his ears... thin black
// eyebrows and a scar across the right corner of his lips." Eyes GREEN in the
// manga, dark blue in the anime — the wiki leads with green and it is the
// detail he shares with Megumi, so green it is (#5f9068, desaturated so it
// survives the toon banding).
// The sheet shows a hard, narrow face: low straight brows set close over the
// eyes, a long jaw, a wide flat mouth usually pulled into a lopsided grin.
// Eye aperture is narrow (eyeH 0.21) — nobody else on the roster except Nanami
// and Higuruma reads this half-lidded, and on him it is boredom rather than
// exhaustion.
//
// THE SCAR is modelled as real geometry, per the brief: a small raised wedge of
// slightly darker skin sitting on the RIGHT corner of his mouth (the model's
// -X side, since the rig faces +Z), plus a shorter tick above it. Trivia says
// the Zenin clan gave it to him by throwing him into a pit of grade 2 cursed
// spirits as a child. It is roughly 1/8 of the mouth's width — small enough to
// be right, large enough to survive the outline pass.
//
// ---------------------------------------------------------------------------
// HAIR, FROM EVERY ANGLE
// ---------------------------------------------------------------------------
// FRONT: a heavy fringe parted well off-centre and swept across the forehead
// toward his left, ending in three or four blunt points just above the brow.
// 3/4: the sweep continues into a longer point in front of each ear.
// SIDE: it stops AT the ear — this is the length note the wiki actually gives,
// and it is what separates him from the Zenin-era long hair.
// BACK: straight, flat and untextured, falling to the top of the neck with a
// slight outward flick at the nape. No spikes, no volume, no crown ring.
// So the construction here is deliberately NOT the Gojo/Yuji spike treatment —
// it is a flattened scalp shell plus swept hair CARDS angled down and back.
// Colour is a blue-black (#1b1e2a): the anime sheet is closer to dark navy than
// to true black, and true black kills the rim light entirely.
//
// ---------------------------------------------------------------------------
// GARMENTS (the fighting outfit, which is what he is in for every fight)
// ---------------------------------------------------------------------------
// Wiki: "a tight-fitting black shirt, sports white baggy training pants with a
// black belt weaved through the waist and black martial arts slippers."
//   · SHIRT   tight, SHORT-SLEEVED, hem tucked in. The sleeves end mid-bicep,
//             so the forearms and most of the upper arm are bare — which is why
//             the shared builder gained `armSlot` (skin arms under a cloth
//             torso). #22242a, a charcoal that is not quite black.
//   · PANTS   VERY baggy — the character sheet's most distinctive silhouette
//             note. Built as real over-geometry: a flared lathe volume per leg
//             from the hip to the ankle, gathered at the cuff. #cac7bf, a warm
//             off-white rather than pure white so the toon bands read.
//   · BELT    a dark navy sash woven through the waist, tied front-centre with
//             TWO HANGING TAILS — on spring chains, so they move with him.
//             #2f3950. The wiki says black; the sheet is clearly navy.
//   · FEET    low black slip-on martial arts slippers, almost flat.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin      #edc9a4      hair       #1b1e2a      shirt   #22242a
//   pants     #cac7bf      belt       #2f3950      shoes   #14151a
//   eyes      #5f9068      brows      #171922      scar    #c98a78
//   rim       #cfe0d6      outline    #0a0c10      accent  #6ea88a
// The accent is a deep jade taken off the eyes. It is deliberately not red
// (Sukuna, Yuji), not mint (Yuta 0x9ff5c9) and not blue (Megumi) — and jade
// against a roster of saturated cursed-energy colours reads as the one
// character who has none.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the mouth scar             4. the baggy white pants silhouette
//   2. bare, heavily muscled arms 5. black hair to the ears, swept, flat
//   3. the black tee              6. the loose, completely unbothered posture
// Items 1-5 are geometry and are in this file. Item 6 is animation and lives in
// art/anim/toji.js — see the notes there.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the exact cut and drape of the pants below the knee. The sheet shows
//     genuine cloth simulation; this is a lathe.
//   · the fold pattern of the shirt over the abdomen, which the sheet draws as
//     line art. Modelled as a shallow crease rather than as separate ab lobes,
//     for the reason recorded in the sukuna-four-arm memo: at this poly budget
//     with cel shading, separately modelled torso lobes always band wrong.
//   · his hands. The shared mitt is used unchanged.
//   · the Zenin-era haori/yukata and the Ogami-vessel sweater are NOT built —
//     he ships in the fighting outfit only.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, ribbonShell, mergeGeos, tubeBetween } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';
import {
  buildPlayfulCloud, buildInvertedSpear, buildSplitSoulKatana, buildChain,
  buildInventoryCurse
} from './toji_weapons.js';

const SKIN = 0xedc9a4;
const HAIR = 0x1b1e2a;
const SHIRT = 0x22242a;
const SHIRT_DK = 0x191b21;
const PANTS = 0xcac7bf;
const PANTS_DK = 0xb4b1a8;
const BELT = 0x2f3950;
const SHOE = 0x14151a;
const SCAR = 0xc98a78;

export function buildToji() {
  const spec = {
    id: 'toji', name: 'Toji', H: 1.88, headScale: 0.96,
    // second-heaviest limbs on the roster, moderate torso bulk
    shoulder: 0.126, hip: 0.055, muscle: 1.30, bulk: 1.12, legBulk: 1.10,
    skinTone: SKIN,
    clothColor: SHIRT,
    // the shirt is short-sleeved: the arms are BARE SKIN under a cloth torso
    armSlot: 'skin', sleeveColor: SKIN, handColor: SKIN,
    pantColor: PANTS, shoeColor: SHOE,
    // broad chest over a hard waist — the "V" is the read, and pass 3 was too
    // narrow up top against the volume of the trousers
    torsoShape: { chest: 1.18, waist: 0.92, hip: 0.96 },
    // hard narrow face, long jaw
    face: { jaw: 1.10, chin: 1.02, width: 0.99 },
    // low flat slippers
    shoe: { len: 0.112, hgt: 0.034, wid: 0.044 },
    palette: {
      rim: 0xcfe0d6, hairRim: 0x8fa8c0, outline: 0x0a0c10,
      accent: 0x6ea88a, energy: 0x6ea88a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- the shirt -----------------------------------------------------------
  // Tight, so there is no jacket volume over the torso lathe — only a crew
  // neckline, the short sleeve ends, and one shallow crease down the sternum.
  bag.add('cloth', latheY([
    [0.040 * H, y.neck - 0.016 * H], [0.043 * H, y.neck - 0.004 * H]
  ], 18, 0.90), { bone: 'Neck', color: SHIRT_DK });
  // SHORT SLEEVES. One CONTINUOUS cone of fabric from the shoulder ball down
  // to mid-bicep, not a ring — pass 1 built the deltoid cap and the hem as two
  // separate pieces with bare skin between them, and it read as a pair of
  // armbands rather than a t-shirt. The bare arm continues out of the hem
  // because the arm slot is skin.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s);
    const top = sh.clone().lerp(el, -0.22);   // just over the deltoid
    const hem = sh.clone().lerp(el, 0.46);    // mid-bicep
    // The top radius has to CLEAR the bare deltoid underneath it (the shared
    // builder's shoulder ball is 0.034·H·muscle = 0.044·H here) without going
    // so far past it that the sleeve becomes a pauldron. Pass 2 used 0.038 and
    // sank inside the shoulder; pass 3 used 0.056 and built shoulder armour.
    bag.add('cloth', tubeBetween(top, hem, [0.0475 * H, 0.0445 * H],
      { radial: 14, hSeg: 5, bulge: 0.04, capA: false }),
      { bone: 'UpArm' + s, color: SHIRT });
    // the thicker rolled hem at the end of the sleeve
    bag.add('cloth', tubeBetween(sh.clone().lerp(el, 0.40), sh.clone().lerp(el, 0.49),
      [0.0468 * H, 0.0464 * H], { radial: 14, hSeg: 2 }),
      { bone: 'UpArm' + s, color: SHIRT_DK });
  }
  // sternum crease — drawn, not modelled as separate pectoral lobes (see the
  // note in the header, and the sukuna-four-arm lesson it comes from)
  bag.add('flat', tGeo(roundBox(0.006 * H, 0.115 * H, 0.004 * H, 0.0015 * H),
    { pos: [0, 0.700 * H, 0.079 * H] }), { chain: torsoChain, color: SHIRT_DK, blend: 0.05 });
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(0.004 * H, 0.052 * H, 0.004 * H, 0.001 * H),
      { rot: [0, 0, s * 16], pos: [s * 0.030 * H, 0.605 * H, 0.074 * H] }),
      { chain: torsoChain, color: SHIRT_DK, blend: 0.05 });
  }

  // ---- THE BAGGY PANTS -----------------------------------------------------
  // The single most identifying silhouette note after the scar, so it is real
  // volume rather than a fatter leg tube: a flared lathe per leg that balloons
  // out below the knee and cinches hard at the ankle, plus a shared seat volume
  // over the hips so the two legs read as one garment at rest.
  // The SEAT is a lathe (it genuinely is one volume across both hips). The LEGS
  // are not: pass 1 lathed them too, and a lathe is built around the world Y
  // axis, so both legs landed on top of each other at x=0 and the whole garment
  // read as a single skirt. They are oriented tubes down the actual joint chain
  // now, which is the only construction that can separate them.
  bag.add('cloth', latheY([
    [0.070 * H, 0.415 * H], [0.079 * H, 0.455 * H], [0.082 * H, 0.505 * H],
    [0.079 * H, 0.545 * H], [0.072 * H, 0.572 * H]
  ], 20, 0.88), { bone: 'Hips', color: PANTS });
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const legChain = [
      { bone: 'Thigh' + s, point: hp }, { bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }
    ];
    const m = s === 'L' ? 1 : -1;
    // thigh: wide at the top and widening — the fabric hangs off the hip
    // capB off at the knee: a capped tube end there draws a hard ring across
    // both legs where the thigh meets the shin volume.
    bag.add('cloth', tubeBetween(hp.clone().add(v3(0, 0.020 * H, 0)), kn,
      [0.060 * H, 0.068 * H], { radial: 14, hSeg: 4, bulge: 0.10, capB: false }),
      { chain: legChain, color: PANTS, blend: 0.08 });
    // shin: the BALLOON. Bulges hard below the knee and then collapses into the
    // ankle gather — this pair of numbers is the whole silhouette.
    const cuffY = an.clone().add(v3(0, 0.048 * H, 0));
    bag.add('cloth', tubeBetween(kn, cuffY, [0.068 * H, 0.032 * H],
      { radial: 14, hSeg: 6, bulge: 0.42, capA: false }),
      { chain: legChain, color: PANTS, blend: 0.08 });
    // the cuff gather itself, sitting proud of the balloon so it reads as a
    // separate cinched band rather than as the end of the taper
    bag.add('cloth', tubeBetween(cuffY, an.clone().add(v3(0, 0.018 * H, 0)),
      [0.036 * H, 0.034 * H], { radial: 12, hSeg: 2 }),
      { chain: legChain, color: PANTS_DK, blend: 0.06 });
    // two vertical drape folds down the outside of each leg
    for (const [t0, t1] of [[0.18, 0.72], [0.34, 0.86]]) {
      const a = hp.clone().lerp(an, t0), b = hp.clone().lerp(an, t1);
      bag.add('flat', tubeBetween(
        a.clone().add(v3(m * 0.040 * H, 0, 0.036 * H)),
        b.clone().add(v3(m * 0.046 * H, 0, 0.030 * H)),
        [0.0035 * H, 0.0030 * H], { radial: 5, hSeg: 2 }),
        { chain: legChain, color: PANTS_DK, blend: 0.08 });
    }
  }

  // ---- the belt ------------------------------------------------------------
  // Woven through the waist of the pants, tied front-centre. The two hanging
  // tails are springs (below) so they swing.
  // Radii here must clear the pants seat above (0.079 at y=0.545) or the sash
  // ends up buried inside the trousers, which is what pass 1 did.
  bag.add('cloth', latheY([
    [0.0800 * H, 0.518 * H], [0.0865 * H, 0.534 * H],
    [0.0870 * H, 0.570 * H], [0.0805 * H, 0.588 * H]
  ], 18, 0.88), { chain: torsoChain, color: BELT, blend: 0.05 });
  // the knot: a wrapped bundle sitting proud of the sash, front-centre
  bag.add('cloth', tGeo(roundBox(0.046 * H, 0.038 * H, 0.030 * H, 0.008 * H),
    { rot: [0, 0, 10], pos: [-0.004 * H, 0.552 * H, 0.082 * H] }),
    { chain: torsoChain, color: BELT, blend: 0.05 });
  bag.add('cloth', tGeo(roundBox(0.020 * H, 0.046 * H, 0.034 * H, 0.006 * H),
    { rot: [0, 0, -6], pos: [-0.004 * H, 0.550 * H, 0.084 * H] }),
    { chain: torsoChain, color: 0x263048, blend: 0.05 });

  // ---- face ----------------------------------------------------------------
  // Narrow half-lidded green eyes, thin low brows, wide flat mouth.
  addFace(ctx, {
    eyeW: 0.50, eyeH: 0.21, eyeColor: 0x5f9068, eyeTilt: 8, lashTilt: 10,
    browTilt: 5, browUp: 1.34, browColor: 0x171922, lashColor: 0x141620,
    mouthW: 0.30, mouthTilt: -5, mouthColor: 0x6a3c3c
  });

  // ---- THE SCAR ------------------------------------------------------------
  // Right corner of the mouth. The rig faces +Z, so the model's RIGHT is -X.
  // Two pieces: the main wedge running up out of the lip corner, and a shorter
  // tick crossing it — enough to read as damage rather than as a smudge.
  {
    const faceZ = headC.z + headR * 0.615;
    const mouthY = headC.y - headR * 0.60;
    bag.add('flat', tGeo(roundBox(headR * 0.038, headR * 0.19, 0.004, 0.0012),
      { rot: [0, 0, -22], pos: [-headR * 0.185, mouthY + headR * 0.055, faceZ - headR * 0.032] }),
      { bone: 'Head', color: SCAR });
    bag.add('flat', tGeo(roundBox(headR * 0.075, headR * 0.030, 0.004, 0.0010),
      { rot: [0, 0, -14], pos: [-headR * 0.205, mouthY + headR * 0.115, faceZ - headR * 0.040] }),
      { bone: 'Head', color: SCAR });
  }

  // ---- hair: flat, swept, ear-length ---------------------------------------
  // Cards, not spikes. Each is a ribbon following a short curve so it lies
  // ALONG the skull instead of standing off it, which is the whole difference
  // between his silhouette and Yuji's.
  const cards = [];
  const card = (pts, w0, w1, thick = 0.010) => {
    cards.push(ribbonShell(
      pts.map(p => new THREE.Vector3(p[0] * headR, p[1] * headR + headC.y, p[2] * headR + headC.z)),
      t => headR * (w0 + (w1 - w0) * t), headR * thick,
      { seg: 7, normalHint: new THREE.Vector3(0, 1, 0) }));
  };
  // THE FRINGE: parted off-centre, sweeping across the forehead toward his
  // left (model +X), ending in blunt points above the brow.
  // Pass 3: every card is pulled tighter to the skull and every fringe tip is
  // raised. Pass 2's fringe ended level with the eyes and the whole mass stood
  // off the head, which together made a rounded bob — the reference lies FLAT
  // and leaves the brow and most of the forehead visible.
  card([[-0.28, 0.84, 0.28], [-0.05, 0.72, 0.72], [0.32, 0.58, 0.78], [0.58, 0.44, 0.66]], 0.28, 0.13);
  card([[-0.32, 0.82, 0.22], [-0.16, 0.66, 0.70], [0.12, 0.50, 0.80], [0.30, 0.38, 0.74]], 0.25, 0.11);
  card([[-0.26, 0.86, 0.14], [-0.28, 0.66, 0.66], [-0.24, 0.48, 0.78], [-0.16, 0.36, 0.72]], 0.22, 0.10);
  card([[-0.38, 0.82, 0.08], [-0.54, 0.62, 0.56], [-0.60, 0.44, 0.66], [-0.56, 0.28, 0.60]], 0.20, 0.09);
  // TEMPLES: a single narrow point in front of each ear, stopping AT ear level.
  // Pass 1 ran two wide cards per side down past the jaw and the result was a
  // bowl cut that swallowed the ears and half the cheek — the reference stops
  // well short of that, and the exposed jawline is most of what makes the face
  // read as hard.
  for (const s of [1, -1]) {
    card([[s * 0.58, 0.76, 0.34], [s * 0.86, 0.52, 0.26], [s * 0.90, 0.24, 0.16], [s * 0.84, 0.02, 0.10]], 0.20, 0.07);
  }
  // BACK: straight and flat to the nape with a slight outward flick. The
  // outermost pair is pulled inboard so the silhouette stays narrow from front.
  for (const [sx, flick] of [[0, -0.08], [0.40, -0.14], [-0.40, -0.14], [0.64, -0.20], [-0.64, -0.20]]) {
    card([
      [sx * 0.6, 0.86, -0.28], [sx * 0.78, 0.60, -0.68], [sx * 0.84, 0.30, -0.80],
      [sx * 0.82, 0.04, -0.74 + flick]
    ], 0.23, 0.10);
  }
  // the scalp: a low shell, deliberately flatter than the roster's spiky heads.
  // The back shell is generous (0.62π) and pulled up, because at 0.50π it left
  // a visible notch of bare skull at the crown from behind. Both are close to
  // the skull (1.02-1.03·headR) — the volume is the cards, not the cap.
  // THE HAIRLINE IS ARITHMETIC, not taste, and getting it wrong cost three
  // passes. The shell's lower edge sits at
  //     centreY + r·yScale·cos(thetaLength)
  // and the eyes sit at headC.y - 0.10·headR. At 0.52π and 0.56π that edge
  // lands AT or BELOW the eye line and the cap renders as a blindfold — which
  // on this roster is very much somebody else's silhouette. At 0.47π
  // (cos ≈ 0.094) it lands at about headC.y + 0.14·headR, level with the brow,
  // which is where a hairline belongs. The forehead above it is covered by the
  // fringe cards, so there is no bare wedge either.
  bag.add('hair', tGeo(sphereShell(headR * 1.025, { thetaLength: Math.PI * 0.47, scale: [1, 0.88, 1.01] }),
    { pos: [headC.x, headC.y + headR * 0.055, headC.z - headR * 0.015] }),
    { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 1.03, { thetaLength: Math.PI * 0.62, scale: [1, 0.98, 0.98] }),
    { rot: [-58, 0, 0], pos: [headC.x, headC.y - headR * 0.06, headC.z - headR * 0.22] }), { bone: 'Head', color: HAIR });
  bag.add('hair', mergeGeos(cards), { bone: 'Head', color: HAIR });

  // ---- springs: the two belt tails -----------------------------------------
  const clothMat = MAT.cloth({ vertexColors: false, color: BELT, rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.016 * H, 0.040 * H, 0.070 * H),
      restDir: v3(s * 0.10, -1, 0.16).normalize(), stiffness: 62, damping: 0.80, gravity: 8,
      segments: [
        { len: 0.060 * H, mesh: makeFlapMesh(0.026 * H, 0.024 * H, 0.060 * H, 0.007, clothMat, BELT, oOpts) },
        { len: 0.052 * H, mesh: makeFlapMesh(0.024 * H, 0.020 * H, 0.052 * H, 0.006, clothMat, BELT, oOpts) }
      ]
    });
  }

  // hair outline stays ON: these are flat cards, not the short burrs that made
  // Yuji's per-spike hulls read as a black crust
  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0135, outlineHairScale: 0.9,
    props: {
      // ---- THE ARSENAL -----------------------------------------------------
      // All four tools exist as separate props on the same model and exactly
      // one of them is ever in hand. The stow slot is under the world, which is
      // how the rest of the roster parks a prop it is not holding — a weapon he
      // is not carrying is INSIDE the inventory curse, so it should not be
      // visible on his back either.
      playful_cloud: {
        node: buildPlayfulCloud(spec.H), default: 'away',
        attachments: {
          hand: { bone: 'HandR', pos: [0, -0.052 * spec.H, 0.010 * spec.H], rot: [-19, 32, -144] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      inverted_spear: {
        node: buildInvertedSpear(spec.H), default: 'away',
        attachments: {
          // POINTY END UP. See the note on split_soul below — the same
          // solve, aimed a little more forward because this is a dagger held
          // out in front rather than a blade carried at the shoulder.
          hand: { bone: 'HandR', pos: [0, -0.058 * spec.H, 0.012 * spec.H], rot: [62, 8, -143] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      split_soul: {
        node: buildSplitSoulKatana(spec.H), default: 'away',
        attachments: {
          // BLADE UP. -96 was copied off Nanami, and copying an attachment
          // rotation between characters does not work: the number has to undo
          // the OWNER'S stance, and Toji's right arm sits nothing like
          // Nanami's (his hand's local +Y already points up-and-back at
          // (0.28, 0.75, -0.60), hers points down-and-back). The same -96 that
          // stands her blade up hung his katana straight at the floor.
          //
          // These are solved, not guessed: take the hand's world quaternion
          // under the character's own STANCE (Hips→Spine→Chest→Clav→UpArm→
          // LoArm→Hand, XYZ Euler, exactly as compileClip builds it), invert
          // it, and ask for the minimal rotation that lands the prop's local
          // +Y on the direction the blade should point. Verified with
          // `__viewer.armSheet` afterwards, because a solve can still be right
          // about the axis and wrong about the roll.
          hand: { bone: 'HandR', pos: [0, -0.055 * spec.H, 0.012 * spec.H], rot: [-140, -38, 23] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      chain: {
        node: buildChain(spec.H), default: 'away',
        attachments: {
          hand: { bone: 'HandR', pos: [0, -0.050 * spec.H, 0.008 * spec.H], rot: [0, 0, 0] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      // THE INVENTORY CURSE. Only visible during a swap, held out at chest
      // height on the off hand while he reaches into its mouth.
      curse: {
        node: buildInventoryCurse(spec.H), default: 'away',
        attachments: {
          // pitched back so the MOUTH gapes up and outward at the camera: the
          // draw animation reaches into it, and a swap that shows the back of
          // a purple lump communicates nothing at all
          // Rolled over so the MOUTH gapes out toward the camera. Verified by
          // shooting three candidate rotations rather than reasoned about: the
          // hand's local axes under the arsenal pose are not what they look
          // like on paper, and a swap that shows the back of a purple lump
          // communicates nothing at all.
          hand: { bone: 'HandL', pos: [0, -0.095 * spec.H, 0.030 * spec.H], rot: [180, -35, 0] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      }
    }
  });

  // The curse's jaw is driven by the swap clip's progress, not by a bone —
  // it is a prop, so it has no skin weights to animate it with.
  const curseNode = model.props.get('curse').node;
  model.setCurseOpen = t => curseNode.userData.openMouth?.(Math.max(0, Math.min(1, t)));
  model.setCurseOpen(0);

  // NO CURSED ENERGY, so none of the roster's energy hooks apply to him. They
  // are stubbed rather than left undefined so that any system which optional-
  // chains one of them gets a defined no-op instead of silently doing nothing
  // for a reason nobody can find later.
  model.setSukuna = () => { };
  model.setOverheat = () => { };
  model.setFingers = () => { };
  return model;
}
