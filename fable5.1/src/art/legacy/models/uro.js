// ===========================================================================
// TAKAKO URO 烏鷺 亨子 — REFERENCE SHEET
// ===========================================================================
// SOURCE OF THE REFERENCE. Built from the OFFICIAL CHARACTER SHEET supplied
// with the brief — a full-body front view, line-art with flats. That image is
// the authority for everything below; where the brief's own description and
// the sheet disagree, the sheet wins and the disagreement is written down.
// Written technique/appearance detail cross-checked against the Jujutsu Kaisen
// Wiki's Sky Manipulation and Thin Ice Breaker entries (search-result
// extraction — the fandom host answers 402 to WebFetch from this environment,
// the same caveat models/miwa.js and models/maki.js already record). NO SIDE,
// 3/4 OR BACK VIEW WAS AVAILABLE: the front sheet is the only image, so the
// back of the hair, the profile of the crest and the wrap of the sky-cloth are
// EXTRAPOLATED, and they are listed again in the APPROXIMATED block at the
// bottom rather than presented as observed.
//
// ---------------------------------------------------------------------------
// TWO CORRECTIONS TO THE BRIEF, UP FRONT
// ---------------------------------------------------------------------------
// 1. "PERIOD-APPROPRIATE CLOTHING / HEIAN ROBES." She is not wearing robes.
//    On the reference she is essentially unclothed, and what covers her is
//    PALE BLUE CLOUD-FORM SKY — three irregular, torn-edged masses across the
//    bust, the midriff and the hips, drawn like a cut-out of daytime sky. The
//    accessories are the whole rest of the costume: gold disc earrings, a
//    black choker, and a dark band on each wrist. Building her in a jūnihitoe
//    would be the single most visible possible miss on this model, so she is
//    built to the sheet and this note exists so the departure is deliberate.
// 2. "HEADWEAR — research it." There is no headwear. The distinctive
//    silhouette the brief is reaching for is HER HAIR, which is enormous.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// No official height is published. The sheet reads as a tall-average adult
// woman with a lean, athletic, long-limbed build — visible abdominal
// definition, narrow waist, no bulk anywhere. H = 1.72.
//     Nobara 1.62 · Miwa 1.66 · Inumaki 1.68 · >>> URO 1.72 <<< ·
//     Yuta 1.73 · Maki 1.74 · Yuji 1.75 · Yuki 1.82
// so she sits mid-roster on height and LOW on mass: `muscle: 0.92`,
// `bulk: 0.88`. Shoulders 0.100 — narrower than Yuki's 0.110, wider than
// Miwa's 0.094. She is not a heavyweight and should never read as one.
//
// *** THE SILHOUETTE NUMBER THAT MATTERS: TOTAL SILHOUETTE HEIGHT. ***
// With the crest she is 2.28 m tall in the lineup while her BODY is 1.72 m.
// That gap is the character. From across the arena she is a small pale figure
// under a very large pink shape, and nothing else in the roster reads like it.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Narrow face, high cheekbones, pointed chin. The expression on the sheet is a
// closed-mouth SMIRK with the head very slightly tipped — amused, unhurried,
// not looking at you very hard. That is the neutral this model is built to.
//   EYES    small aperture for a woman on this roster (eyeH 0.24 against
//           Miwa's 0.36) with a HEAVY dark upper lash line and long outer
//           lashes flicking up — the sheet's most emphatic face detail. Iris a
//           dark violet-brown #43314e.
//   BROWS   thin, dark, and angled DOWN toward the nose — the arrogant read.
//   MOUTH   small, corners up on the model's left, drawn narrow.
//   HEAD SCALE 0.99 — an adult proportion, not a student one.
//
// ---------------------------------------------------------------------------
// THE HAIR, FROM EVERY ANGLE — the entire silhouette
// ---------------------------------------------------------------------------
// The single identifier. Pale pink shading to lilac, swept UP and BACK off the
// forehead into a spray of large tapering blades, each one CURLING at the tip
// into a hook or a spiral. It is not spiky (Yuji), not a mane (Todo), not a
// sheet (Miwa): it is a crest of ribbons that have been blown upward and
// frozen there, and every tip resolves in a curl.
//   FRONT   the hairline sits high and the mass leaves it almost VERTICALLY.
//           Seven blades are legible on the sheet: two short ones forward of
//           the crown over the brow, three tall central ones clearing the
//           crown by about a third of a body, and two that sweep out sideways
//           and curl back inward. Widest point is roughly two head-widths.
//   3/4     the mass is DEEPER than it is wide — it goes back as well as up,
//           so from three-quarters the crest reads as a wave breaking off the
//           back of the skull rather than as a flat fan. (EXTRAPOLATED.)
//   SIDE    strong backward rake. The whole crest leans about 18 degrees off
//           vertical toward the back, and the two rearmost blades trail
//           furthest. Small amount of hair on the nape; the sides above the
//           ear are close-cropped, which is what makes the earrings read.
//           (EXTRAPOLATED.)
//   BACK    three trailing blades, the longest reaching the shoulder line,
//           each ending in an outward curl. (EXTRAPOLATED.)
// CONSTRUCTION. A close, FLATTENED scalp cap + NINE authored blades built as
//   broad tapered ribbons with a curled tip, PLUS a two-segment SPRING CHAIN
//   on each of three trailing strands so the crest lags and settles. Nine
//   rather than the sheet's seven because two extra rear blades are what close
//   the back of the silhouette, which no reference view showed. That lag matters more on this
//   character than on anyone else in the project: she is airborne for most of
//   a round, so the hair is doing the job the feet normally do — it is the
//   thing that tells the player she just changed direction.
// COLOUR #eeafdc over #b07fc8 in the recesses, with #f7d0ec on the topmost
//   catch. Deliberately PINK-LILAC, not magenta: Todo's accent is #ff5fc8 and
//   the two must not collide on the select screen.
//
// ---------------------------------------------------------------------------
// GARMENTS — THE SKY, AND FOUR PIECES OF JEWELLERY
// ---------------------------------------------------------------------------
//   SKY-CLOTH  three irregular masses of pale blue with torn, feathered
//              edges: a band across the bust, a diagonal wrap across the lower
//              ribs and navel, and a short wrap over the hips. Built as
//              layered cloud lobes (overlapping flattened spheres) rather than
//              as fabric panels, because the edge is the read — a hemmed edge
//              anywhere on this costume would turn it into a bikini and lose
//              the whole idea. #aee2f4 with #86c8e4 underneath.
//   EARRINGS   large flat GOLD DISCS, one per ear, hanging just clear of the
//              jaw. #e6c04e. On the sheet these are the brightest thing on
//              the model and they should stay that way.
//   CHOKER     a plain black band at the throat. #241d21.
//   WRIST BANDS a wide dark band on each wrist, the right sitting slightly
//              higher than the left on the sheet. #2e2320.
//   NAILS      lilac, fingers and toes both. #b184cc. She is BAREFOOT — no
//              shoe geometry at all, which is unique on the roster and is why
//              `shoe` is replaced with a modelled foot below.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin    #f6ddc8      hair    #eeafdc   hairDk #b07fc8   hairLt #f7d0ec
//   sky     #aee2f4      skyDk   #86c8e4   gold   #e6c04e
//   choker  #241d21      band    #2e2320   nail   #b184cc
//   eyes    #43314e      brows   #6c4a68   lash   #201724
//   rim     #dfe9ff      outline #0b0a12   accent #cfe8f5
// THE ACCENT IS DELIBERATELY NOT HER HAIR COLOUR. #cfe8f5 is a near-white
// pale blue — the colour of the sky-cloth, not of the crest. The brief asks
// for her warp effects to be NEAR-COLOURLESS distortion rather than a hue, and
// the accent drives the select card, the HUD cut-in and every callout, so
// picking the pink would have promised an energy colour the effects
// deliberately do not have. It is also the widest separation available from
// Miwa's #a8d8e8 while staying in the pale-blue family: hers is a saturated
// ice blue, this is almost white.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the pink crest — up, back, every tip curled
//   2. the gold disc earrings
//   3. pale blue cloud-form covering, torn edges, no hems
//   4. barefoot, lilac nails
//   5. the black choker and the two wrist bands
//   6. the amused, half-lidded, tipped-head neutral
// All six are in this file. Item 6 leans on anim/uro.js — see the note there
// about the head never quite levelling.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the back and side of the hair. One front view was available; the rake,
//     the depth and the three trailing blades are designed to be consistent
//     with the front rather than observed.
//   · how the sky-cloth wraps around the back. Extrapolated as continuing
//     round with the same torn edge.
//   · her hands and feet are the shared mitt and a simple modelled foot; the
//     sheet draws real fingers and toes and this budget does not carry them.
//   · the exact earring diameter and hang.
//   · the sheet's line-art shading of the hair is flattened to three tones.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import {
  latheY, tGeo, roundBox, sphereShell, ribbonShell, mergeGeos, tubeBetween
} from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const SKIN = 0xf6ddc8;
const HAIR = 0xeeafdc;
const HAIR_DK = 0xb07fc8;
const HAIR_LT = 0xf7d0ec;
const SKY = 0xaee2f4;
const SKY_DK = 0x86c8e4;
const GOLD = 0xe6c04e;
const CHOKER = 0x241d21;
const BAND = 0x2e2320;
const NAIL = 0xb184cc;
const EYE = 0x43314e;

// ---------------------------------------------------------------------------
// ONE HAIR BLADE. A tapered ribbon that rises, rakes back, and CURLS at the
// tip. The curl is the whole reason this is a swept path rather than a cone:
// every tip on the reference resolves in a hook, and a straight spike reads as
// a different character entirely.
//
//   len    length along the blade
//   w0/w1  width at root and just before the curl
//   rake   how far back the blade leans, in radians, accumulated along it
//   curl   how tight the tip hooks (0 = straight, 1 = a full half-turn)
//   twist  roll about the blade's own axis, so the ribbon presents an edge
// ---------------------------------------------------------------------------
function hairBlade({ len, w0, w1, rake = 0.3, curl = 0.7, side = 0, seg = 9 }) {
  const pts = [];
  let p = new THREE.Vector3(0, 0, 0);
  // start pointing up and slightly back, then integrate the rake and the curl
  let ang = 0.12 + rake * 0.25;
  for (let i = 0; i <= seg; i++) {
    pts.push(p.clone());
    const k = i / seg;
    // the curl accelerates over the last third — a hook, not an arc
    const bend = rake * 0.10 + curl * 0.42 * Math.pow(Math.max(0, k - 0.42) / 0.58, 1.7);
    ang += bend;
    const step = len / seg;
    p = p.clone().add(new THREE.Vector3(
      Math.sin(side * 0.55) * step * Math.sin(ang) * 0.55,
      Math.cos(ang) * step,
      -Math.sin(ang) * step
    ));
  }
  // `ribbonShell`'s widthFn takes the normalized parameter, NOT an index —
  // getting that wrong yields undefined widths and a collapsed ribbon, which
  // is exactly what pass 1 of this model looked like from the side.
  const widthAt = t => {
    const belly = 1 + 0.18 * Math.sin(t * Math.PI);   // slight swell mid-blade
    return (w0 + (w1 - w0) * t) * belly * (1 - t * t * 0.55);
  };
  // NORMAL HINT MATTERS MORE THAN ANY OTHER ARGUMENT HERE. `ribbonShell`
  // derives its side vector as tangent x normalHint, so with a hint of +X and
  // a blade running up +Y the width lands along Z — the ribbon presents its
  // EDGE to a camera in front of the character, which is exactly what pass 2
  // looked like: eleven pink spikes and no blades at all. A hint of +Z puts
  // the width along X, so the broad face is what the player sees.
  return ribbonShell(pts, widthAt, Math.max(0.004, w0 * 0.22), {
    seg: 14, normalHint: new THREE.Vector3(0, 0, 1)
  });
}

// A torn cloud lobe: overlapping flattened spheres with no hemmed edge
// anywhere. Built as one merged geometry so the whole mass shades as a unit.
function cloudMass(lobes) {
  const parts = [];
  for (const l of lobes) {
    parts.push(tGeo(new THREE.SphereGeometry(l.r, 9, 7), {
      scale: l.scale || [1, 0.62, 0.72], pos: l.pos, rot: l.rot
    }));
  }
  return mergeGeos(parts);
}

// A bare foot with toes, because she has no shoes and the shared shoe block
// under a bare ankle reads as a sock.
function bareFoot(H, ankle, side) {
  const parts = [];
  const len = 0.108 * H, wid = 0.040 * H, hgt = 0.034 * H;
  const sole = roundBox(wid, hgt, len, 0.010 * H, 2);
  parts.push(tGeo(sole, { pos: [0, -0.004 * H, len * 0.14] }));
  // toes: five small caps across the front edge, largest inboard
  for (let i = 0; i < 5; i++) {
    const k = i / 4;
    const r = (0.0086 - 0.0026 * k) * H;
    parts.push(tGeo(new THREE.SphereGeometry(r, 6, 5), {
      scale: [1, 0.8, 1.35],
      pos: [(side === 'L' ? -1 : 1) * (wid * 0.44 - wid * 0.92 * k) * (side === 'L' ? -1 : 1),
      -hgt * 0.30, len * 0.62 - k * 0.010 * H]
    }));
  }
  // heel
  parts.push(tGeo(new THREE.SphereGeometry(wid * 0.62, 8, 6), {
    scale: [1, 0.86, 0.9], pos: [0, -hgt * 0.05, -len * 0.30]
  }));
  const geo = mergeGeos(parts);
  geo.translate(ankle.x, ankle.y - 0.010 * H, ankle.z);
  geo.computeVertexNormals();
  return geo;
}

export function buildUro() {
  const spec = {
    id: 'uro', name: 'Uro', H: 1.72, headScale: 0.99,
    // LEAN AND LONG. Low mass, narrow waist, athletic rather than slight —
    // she is a Heian sorcerer who fights, not a student.
    shoulder: 0.100, hip: 0.050, muscle: 0.92, bulk: 0.88, legBulk: 0.94,
    skinTone: SKIN,
    // EVERYTHING IS SKIN. The costume is three cloud masses added below, so
    // the torso lathe, both arms and both legs shade through the skin
    // material and carry the skin colour. Same construction Toji and Yuki use
    // for bare arms, taken all the way.
    bodySlot: 'skin', armSlot: 'skin', foreArmSlot: 'skin', legSlot: 'skin',
    clothColor: SKIN, sleeveColor: SKIN, foreSleeveColor: SKIN, handColor: SKIN,
    pantColor: SKIN,
    shoulderCap: false,
    torsoShape: { chest: 0.95, waist: 0.78, hip: 0.92 },
    face: { jaw: 0.88, chin: 0.94, width: 0.97 },
    // NO SHOE AT ALL. She is barefoot on the reference, and a scaled-down shoe
    // block under a bare ankle reads as a sock — see the `shoe: false` note in
    // builders/humanoid.js, which is the one line the builder needed for this.
    shoe: false,
    palette: {
      rim: 0xdfe9ff, hairRim: 0xffe0f6, outline: 0x0b0a12,
      accent: 0xcfe8f5, energy: 0xdff2ff, metalRim: 0xfff0c0
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;

  addFace(ctx, {
    // SMALL APERTURE, HEAVY LASH. The narrowest female eye on the roster.
    eyeW: 0.54, eyeH: 0.24, eyeColor: EYE,
    eyeTilt: 11, lashTilt: 14, lashColor: 0x201724,
    // brows angled DOWN toward the nose: the arrogant read
    browTilt: -13, browUp: 1.32, browColor: 0x6c4a68,
    mouthW: 0.20, mouthTilt: 5, mouthColor: 0x8a4a58
  });

  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // OUTER LASHES. Two small flicks off the outer corner of each eye, angled
  // up. On the sheet these are as heavy as the lash line itself and they are
  // most of what makes the expression read at distance.
  for (const s of [1, -1]) {
    for (let i = 0; i < 2; i++) {
      bag.add('flat', tGeo(roundBox(headR * 0.13, headR * 0.028, 0.004, 0.002), {
        rot: [0, 0, s * (26 + i * 16)],
        pos: [s * headR * (0.63 + i * 0.04), eyeY + headR * (0.10 + i * 0.05), faceZ + headR * 0.01]
      }), { bone: 'Head', color: 0x201724 });
    }
  }

  // =========================================================================
  // THE CREST
  // =========================================================================
  const hairMat = MAT.hair({ rimColor: 0xffe0f6 });
  const springs = [];

  // scalp: a shell that stops high on the forehead, because the hairline sits
  // high and the mass leaves it almost vertically
  // PASS 3 — THE FACE GAP. Pass 2 wrapped a full 104-degree cap all the way
  // round the skull and it came down OVER HER EYES: the front render showed a
  // pink helmet with a mouth under it and no face at all. The project's own
  // idiom for this is a phi wedge cut out of the shell where the face is (see
  // models/miwa.js and models/nobara.js) and it is used here, opened WIDER
  // than either of theirs — 1.25 rad against Nobara's 1.16 — because Uro has
  // no fringe: her hairline is high and her whole forehead is bare.
  const FACE_GAP = 1.25;
  bag.add('hair', tGeo(sphereShell(headR * 1.02, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.66, scale: [1.0, 0.88, 1.06]
  }), { pos: [headC.x, headC.y + headR * 0.04, headC.z - headR * 0.03] }),
    { bone: 'Head', color: HAIR });
  // nape: a SMALL amount of hair at the back of the neck. Pass 2 had this at
  // 0.52 head-radii and it read as a bun stuck to her occiput; the sheet has
  // barely anything there, and the sides above the ear must stay bare or the
  // earrings stop reading.
  bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.34, 10, 8), {
    scale: [1.10, 0.58, 0.62], pos: [0, headC.y - headR * 0.60, headC.z - headR * 0.78]
  }), { bone: 'Head', color: HAIR_DK });

  // THE ELEVEN BLADES.
  //   x  lateral position on the crown, in head radii
  //   z  fore/aft position on the crown
  //   len/w  size
  //   rake   backward lean — the rear blades trail furthest
  //   curl   tip hook
  // Two short forward blades, three tall central, two sweeping side pairs,
  // and three trailing at the back.
  //
  // PASS 2 — SIZE. Pass 1 topped out at 2.04 m total silhouette against a
  // 1.72 m body: a crest 32 cm above the crown, which next to the reference is
  // a fringe. On the sheet the hair occupies roughly the top quarter of the
  // whole figure, so it should clear the crown by about a THIRD of the body —
  // 0.55 m — and span a little over two head-widths. Lengths went up 1.55x,
  // the lateral placement 1.3x, and the curl on the three central blades came
  // DOWN (a tight hook on a long blade spends the length going backwards
  // instead of up, which is what capped pass 1's height even before the
  // lengths were wrong).
  //
  // PASS 3 — WIDTH AND COUNT. With the ribbons finally facing the right way
  // (see `hairBlade`), pass 2's widths were exposed as far too narrow: a blade
  // 0.42 head-radii wide and 5.2 long is a 12:1 needle, and eleven needles is
  // a pineapple. Widths roughly TRIPLED, and the count came down from eleven
  // to NINE — the reference is a small number of big shapes, and eleven
  // overlapping ribbons at this width is a solid mass with no gaps to read the
  // individual curls through.
  const BLADES = [
    // forward pair, over the brow, short, curling back over the crown
    { x: 0.26, z: 0.52, len: 2.00, w0: 0.86, w1: 0.52, rake: 0.55, curl: 0.95, col: HAIR_LT },
    { x: -0.26, z: 0.52, len: 1.90, w0: 0.80, w1: 0.48, rake: 0.60, curl: 1.00, col: HAIR_LT },
    // the three tall central blades — the top of the silhouette
    { x: 0.00, z: 0.10, len: 5.20, w0: 1.22, w1: 0.66, rake: 0.24, curl: 0.42, col: HAIR },
    { x: 0.46, z: 0.16, len: 4.75, w0: 1.02, w1: 0.56, rake: 0.30, curl: 0.50, col: HAIR },
    { x: -0.48, z: 0.14, len: 4.60, w0: 1.02, w1: 0.56, rake: 0.32, curl: 0.54, col: HAIR },
    // the sweeping side pair — out, then curling back inward
    { x: 0.84, z: -0.10, len: 3.80, w0: 0.90, w1: 0.46, rake: 0.42, curl: 0.88, side: 1.5, col: HAIR_DK },
    { x: -0.86, z: -0.12, len: 3.72, w0: 0.90, w1: 0.46, rake: 0.44, curl: 0.92, side: -1.5, col: HAIR_DK },
    // trailing back pair (the third trailing blade is a spring chain below)
    { x: 0.30, z: -0.76, len: 3.25, w0: 0.84, w1: 0.44, rake: 0.95, curl: 0.90, col: HAIR_DK },
    { x: -0.32, z: -0.78, len: 3.18, w0: 0.84, w1: 0.44, rake: 0.98, curl: 0.92, col: HAIR_DK }
  ];
  for (const b of BLADES) {
    const geo = hairBlade({
      len: headR * b.len, w0: headR * b.w0, w1: headR * b.w1,
      rake: b.rake, curl: b.curl, side: b.side ?? 0
    });
    bag.add('hair', tGeo(geo, {
      // a small outward roll so the ribbons present an edge rather than a face
      rot: [0, b.x * 22, -b.x * 30],
      pos: [headC.x + headR * b.x * 1.05, headC.y + headR * 0.72, headC.z + headR * b.z * 0.72]
    }), { bone: 'Head', color: b.col });
  }

  // THE THREE SPRING BLADES. The longest central blade and the two rearmost
  // trailing ones hang off spring chains so the crest LAGS. On a character who
  // spends the round in the air this is the primary motion cue — see the note
  // in the reference sheet.
  const SPRUNG = [
    { x: 0.00, z: -0.94, len: [0.92, 0.74], w: [0.30, 0.22], rest: v3(0, -0.25, -1) },
    { x: 0.52, z: -0.88, len: [0.80, 0.62], w: [0.26, 0.18], rest: v3(0.34, -0.28, -1) },
    { x: -0.54, z: -0.90, len: [0.80, 0.62], w: [0.26, 0.18], rest: v3(-0.34, -0.28, -1) }
  ];
  // *** THE COORDINATE SPACE, WHICH IS NOT THE ONE THE REST OF THIS FILE USES.
  // Every `bag.add` above authors geometry in WORLD space and lets the skin
  // bind sort it out. A SpringChain does not: its `localOffset` is parented
  // straight onto the bone, so it is in BONE-LOCAL space, and handing it a
  // world Y puts the chain a whole body-height into the sky. (That is exactly
  // the bug this pass found on the shipped Miwa model — see the note in
  // models/miwa.js.) `headJ` is the Head bone's own world position, and every
  // spring anchor below is expressed as an offset FROM it.
  const headJ = joints.get('Head');
  for (const s of SPRUNG) {
    const seg1 = makeFlapMesh(headR * s.w[0], headR * s.w[1], headR * s.len[0], headR * 0.07,
      hairMat, HAIR_DK, { color: 0x0b0a12, thickness: 0.011 });
    const seg2 = makeFlapMesh(headR * s.w[1], headR * s.w[1] * 0.45, headR * s.len[1], headR * 0.055,
      hairMat, HAIR_DK, { color: 0x0b0a12, thickness: 0.011 });
    springs.push({
      bone: 'Head',
      localOffset: v3(headC.x + headR * s.x * 0.8, headC.y + headR * 0.50, headC.z + headR * s.z * 0.7)
        .sub(headJ),
      restDir: s.rest.clone().normalize(),
      segments: [{ len: headR * s.len[0], mesh: seg1 }, { len: headR * s.len[1], mesh: seg2 }],
      // LOOSER AND LIGHTER THAN ANY OTHER HAIR IN THE PROJECT. Miwa's is
      // 54/0.80/6.5; this is 34/0.88/2.4. Low gravity because it is hair that
      // is standing UP rather than hanging down, and low stiffness because
      // "carried by drift" is the whole animation note for this character.
      stiffness: 34, damping: 0.88, gravity: 2.4
    });
  }

  // =========================================================================
  // THE JEWELLERY
  // =========================================================================
  // GOLD DISC EARRINGS. The brightest thing on the model, and they hang clear
  // of the jaw so they swing against the bare side of the head.
  for (const s of [1, -1]) {
    // the post
    bag.add('metal', tGeo(new THREE.CylinderGeometry(headR * 0.03, headR * 0.03, headR * 0.10, 6), {
      rot: [0, 0, 90], pos: [s * headR * 0.96, headC.y - headR * 0.14, headC.z - headR * 0.10]
    }), { bone: 'Head', color: GOLD });
    // the disc
    bag.add('metal', tGeo(new THREE.CylinderGeometry(headR * 0.30, headR * 0.30, headR * 0.045, 14), {
      rot: [90, 0, 0], pos: [s * headR * 1.00, headC.y - headR * 0.44, headC.z - headR * 0.10]
    }), { bone: 'Head', color: GOLD });
    // an inner ring cut, so the disc does not read as a coin
    bag.add('metal', tGeo(new THREE.TorusGeometry(headR * 0.19, headR * 0.030, 5, 14), {
      rot: [0, 0, 0], pos: [s * headR * 1.00, headC.y - headR * 0.44, headC.z - headR * 0.075]
    }), { bone: 'Head', color: 0xf4dc90 });
  }

  // CHOKER
  bag.add('cloth', tGeo(latheY([
    [0.026 * H, y.neck - 0.010 * H], [0.028 * H, y.neck - 0.002 * H],
    [0.028 * H, y.neck + 0.014 * H], [0.026 * H, y.neck + 0.020 * H]
  ], 14, 0.94)), { bone: 'Neck', color: CHOKER });

  // WRIST BANDS. The right sits slightly higher than the left, as drawn.
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const up = wr.clone().sub(el).normalize();
    const drop = s === 'R' ? 0.030 * H : 0.018 * H;
    const a = wr.clone().addScaledVector(up, -drop);
    const b = wr.clone().addScaledVector(up, -drop + 0.026 * H);
    bag.add('cloth', tubeBetween(a, b, [0.0215 * H, 0.0215 * H], { radial: 10, hSeg: 1 }),
      { bone: 'LoArm' + s, color: BAND });
  }

  // NAILS. Lilac, on the fingers and on the toes. Small, but they are on the
  // reference and they are the one warm-cool accent the hands have.
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const dir = wr.clone().sub(el).normalize();
    // PASS 3: 0.062*H put the nail block a full centimetre past the end of
    // the mitt, so it read as a small cube floating beside the hand in the
    // side view. It sits on the knuckle line now, and it is half the size.
    const tip = wr.clone().addScaledVector(dir, 0.046 * H);
    bag.add('flat', tGeo(roundBox(0.020 * H, 0.005 * H, 0.007 * H, 0.002 * H), {
      pos: [tip.x, tip.y, tip.z + 0.010 * H]
    }), { bone: 'Hand' + s, color: NAIL });
  }

  // =========================================================================
  // THE SKY-CLOTH — three cloud masses, no hems anywhere
  // =========================================================================
  // BUST BAND. Wraps the chest with a torn upper edge; the lobes are
  // deliberately different sizes and offset in Z so the outline is ragged from
  // every angle rather than only from the front.
  bag.add('cloth', cloudMass([
    // PASS 3: the outer lobes were at x +/-0.048*H with a 1.0 x-scale, which
    // put cloud out at 5.6 cm either side of centre — level with the deltoid,
    // so from the front it read as a pair of armbands rather than as a band
    // across the chest. Everything is pulled inboard and DOWN 2 cm.
    { r: 0.058 * H, pos: [0.000, 0.700 * H, 0.030 * H], scale: [1.16, 0.50, 0.90] },
    { r: 0.044 * H, pos: [0.036 * H, 0.708 * H, 0.026 * H], scale: [0.96, 0.46, 0.94] },
    { r: 0.044 * H, pos: [-0.038 * H, 0.704 * H, 0.024 * H], scale: [0.96, 0.44, 0.94] },
    { r: 0.036 * H, pos: [0.014 * H, 0.724 * H, 0.034 * H], scale: [0.90, 0.36, 0.80] },
    { r: 0.034 * H, pos: [-0.022 * H, 0.686 * H, 0.038 * H], scale: [0.88, 0.40, 0.74] },
    // and round the back, so it is a wrap rather than a front panel
    { r: 0.052 * H, pos: [0.000, 0.702 * H, -0.028 * H], scale: [1.10, 0.46, 0.82] },
    { r: 0.034 * H, pos: [0.034 * H, 0.694 * H, -0.034 * H], scale: [0.88, 0.42, 0.74] },
    { r: 0.034 * H, pos: [-0.036 * H, 0.698 * H, -0.032 * H], scale: [0.88, 0.42, 0.74] }
  ]), { chain: torsoChain, color: SKY, blend: 0.05 });
  // a darker under-layer just below the band, which is what stops it reading
  // as a flat sticker
  bag.add('cloth', cloudMass([
    { r: 0.048 * H, pos: [0.014 * H, 0.694 * H, 0.030 * H], scale: [1.02, 0.34, 0.76] },
    { r: 0.036 * H, pos: [-0.040 * H, 0.690 * H, 0.026 * H], scale: [0.94, 0.32, 0.72] }
  ]), { chain: torsoChain, color: SKY_DK, blend: 0.05 });

  // MIDRIFF WRAP. A diagonal across the lower ribs and the navel — on the
  // sheet this one is the most torn and the least symmetrical of the three.
  bag.add('cloth', cloudMass([
    { r: 0.044 * H, pos: [-0.030 * H, 0.624 * H, 0.032 * H], scale: [1.10, 0.40, 0.72], rot: [0, 0, -14] },
    { r: 0.038 * H, pos: [0.024 * H, 0.640 * H, 0.030 * H], scale: [1.00, 0.36, 0.70], rot: [0, 0, -14] },
    { r: 0.030 * H, pos: [0.058 * H, 0.652 * H, 0.020 * H], scale: [0.90, 0.32, 0.66] },
    { r: 0.030 * H, pos: [-0.056 * H, 0.612 * H, 0.020 * H], scale: [0.90, 0.32, 0.66] },
    { r: 0.036 * H, pos: [0.000, 0.628 * H, -0.032 * H], scale: [1.00, 0.34, 0.62] }
  ]), { chain: torsoChain, color: SKY, blend: 0.06 });

  // HIP WRAP. Short, sits on the pelvis, torn at the bottom edge. Hung off the
  // Hips bone rather than the torso chain so it moves with the pelvis.
  bag.add('cloth', cloudMass([
    { r: 0.062 * H, pos: [0.000, 0.508 * H, 0.010 * H], scale: [1.08, 0.52, 0.94] },
    { r: 0.046 * H, pos: [0.052 * H, 0.520 * H, 0.014 * H], scale: [0.96, 0.46, 0.88] },
    { r: 0.046 * H, pos: [-0.054 * H, 0.516 * H, 0.012 * H], scale: [0.96, 0.46, 0.88] },
    { r: 0.038 * H, pos: [0.020 * H, 0.482 * H, 0.030 * H], scale: [0.90, 0.40, 0.74] },
    { r: 0.038 * H, pos: [-0.026 * H, 0.486 * H, -0.030 * H], scale: [0.90, 0.40, 0.74] },
    { r: 0.050 * H, pos: [0.000, 0.512 * H, -0.030 * H], scale: [1.02, 0.48, 0.82] }
  ]), { bone: 'Hips', color: SKY, blend: 0.04 });
  bag.add('cloth', cloudMass([
    { r: 0.042 * H, pos: [0.018 * H, 0.472 * H, 0.014 * H], scale: [1.00, 0.30, 0.80] },
    { r: 0.034 * H, pos: [-0.038 * H, 0.468 * H, 0.010 * H], scale: [0.92, 0.28, 0.74] }
  ]), { bone: 'Hips', color: SKY_DK, blend: 0.04 });

  // =========================================================================
  // BARE FEET
  // =========================================================================
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('skin', bareFoot(H, an, s), { bone: 'Foot' + s, color: SKIN });
    // toe nails
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const sgn = s === 'L' ? 1 : -1;
      // PASS 4: the x term forgot `an.x`, so all ten toenails were laid out
      // down the CENTRELINE of the body and rendered as a stray lilac stick on
      // the floor between her feet. Every other axis was already anchored to
      // the joint; this one was not.
      bag.add('flat', tGeo(new THREE.CircleGeometry((0.0062 - 0.0018 * k) * H, 6), {
        rot: [-70, 0, 0],
        pos: [an.x + sgn * (0.0176 * H - 0.0368 * H * k), an.y + 0.0022 * H,
        an.z + 0.0715 * H - k * 0.010 * H]
      }), { bone: 'Foot' + s, color: NAIL });
    }
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0105, outlineHairScale: 1.15
  });

  // -------------------------------------------------------------------------
  // THE HAZE HOOK
  // -------------------------------------------------------------------------
  // The brief asks for "a faint constant heat-haze around her body so she reads
  // as slightly displaced even when idle". The DISTORTION itself is a screen
  // effect and lives in fx/warpfx.js — the model's only job is to expose how
  // strong it should be, so the warp system has one number to read and does not
  // have to know anything about her anatomy.
  //
  // 0.35 idle, driven up to 1 by the warp techniques and by hovering.
  model.warpHaze = 0.35;
  model.setWarpHaze = k => { model.warpHaze = Math.max(0.35, Math.min(1, k)); };

  // Where the reflect surface stands and where a fold opens, in metres off her
  // own origin. Declared on the model so the effect code never hardcodes a
  // height for a body it cannot measure.
  model.warpAnchor = { y: 1.06 * spec.H * 0.62, ahead: 0.95 };
  return model;
}
