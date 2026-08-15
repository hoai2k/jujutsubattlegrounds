// HIGURUMA HIROMI 日車寛見
//
// ======================== REFERENCE SHEET ================================
// Researched before modelling (web search; the Fandom wiki itself returns 402
// to the fetch tool, so this is built from the description text those results
// surfaced plus the Culling Game arc summaries — see the deliverable
// write-up, and the "APPROXIMATED / KNOWN GAPS" list at the bottom).
//
// WHAT THE REFERENCE SAYS
//   Build      "a man of AVERAGE HEIGHT with a SLENDER build", lightly tanned.
//              NOT a tall man. The design brief for this project asked for
//              tall-and-gaunt; the compromise modelled here is 1.86 m — a
//              shade over Nanami's 1.845 so he does not read as small, with
//              every width dialled down hard (see BUILD below) so the
//              silhouette reads "thin", which is the actual intent.
//   Hair       Short-to-mid DARK BROWN, "well-kept with a STRINGY TEXTURE
//              styled to flow toward the BACK of the head". By the Culling
//              Game he is unshaven and dishevelled, and that is the version
//              modelled: the same back-swept stringy shape, but broken —
//              strands escaped forward over the brow, the nape gone shaggy.
//   Face       LARGE NOSE. Brown eyes with VERY SMALL PUPILS. An almost
//              permanently tired, bored expression from overwork. Heavy
//              shadow under the eyes; stubble.
//   Dress      A lawyer's black suit and tie, dress shirt, dress shoes — and
//              a SUNFLOWER PIN on the LEFT lapel, the badge every Japanese
//              attorney wears. That pin is the single most identifying object
//              on him and it is modelled as its own little sunflower.
//
// THE THREE THINGS THAT MAKE HIM READ AT A GLANCE
//   1. The gold sunflower pin on a black lapel — the only saturated colour on
//      the whole model.
//   2. The suit is WRECKED. Not tailored: slept in. Modelled with the jacket
//      hanging OPEN off a frame too narrow for it, an asymmetric hem, a
//      collar standing up on one side, wrinkle ridges cut across the chest,
//      sleeves and thighs, and a tie yanked down off an unbuttoned collar.
//      Nanami is the control here — squared shoulder pads, closed jacket,
//      crisp cuffs, tie knotted at the throat. Put the two side by side and
//      nothing about them is the same silhouette.
//   3. The face: big nose, pinprick pupils, and two dark smudges under the
//      eyes of a man who has not slept in weeks.
//
// BUILD vs THE ROSTER (H, shoulder half-width, muscle, bulk)
//   Todo     2.00  0.135  1.45  1.30      Nanami  1.845  0.113  1.14  1.10
//   Gojo     1.90  0.112  1.00  1.00      HIGURUMA 1.86  0.098  0.80  0.84
//   Yuta     1.78  0.107  0.94  0.96      Megumi  1.75   0.104  0.92  0.94
//   He is the SECOND TALLEST human on the roster and comfortably the
//   NARROWEST — 13% inside Gojo's shoulders and 27% inside Nanami's mass.
//   That gap is the character: he should look like he should not be here.
//
// PALETTE (hex)
//   suit          #23252d   suit shadow  #191b21   suit lining  #2c2f39
//   shirt (dingy) #ccc8bc   collar       #d8d4c8   tie          #2a2e3a
//   hair          #2f2721   hair shadow  #221c17   stubble      #3b332b
//   skin          #d9b48e   eye brown    #6b5236   under-eye    #9b7f68
//   sunflower     #e8b62c   pin centre   #6b4a1c
//   gavel energy  #d8c78a   sword steel  #cfd6e2   sword edge   #f2f6ff
//   accent (HUD)  #d8c78a
//
// APPROXIMATED / KNOWN GAPS
//   · Height: the reference says average; modelled slightly tall on the
//     project's brief. Flagged rather than silently split.
//   · The stubble is a value shift on the jaw, not geometry.
//   · His shirt is canonically clean white; it is dulled here to sell "worn
//     for three days", which is a reading of the arc rather than a colour
//     anyone published.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude, coneSpike } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { v3, DEG } from '../../core/mathutil.js';

// PASS 2. The first pass rendered as a silhouette: at #23252d against a dark
// stage every wrinkle, lapel and fold vanished and he read as a black cutout
// with a briefcase. Everything cloth is lifted ~8 values and the three suit
// tones are spread further apart, so the tailoring (or the lack of it) is
// actually legible at gameplay distance. He is still the darkest costume on
// the roster by a wide margin.
const SUIT = 0x2e3140;
const SUIT_DK = 0x212430;
const LINING = 0x3a3f52;
const SHIRT = 0xb9b5a6;
const COLLAR = 0xc6c2b4;
// The tie has to be a DIFFERENT OBJECT at a glance or it disappears into the
// jacket entirely (pass 2). A desaturated navy is both canon-plausible and
// two clear values off the suit.
const TIE = 0x434b66;
const HAIR = 0x2f2721;
const HAIR_DK = 0x221c17;
const STUBBLE = 0x3b332b;
const SKIN = 0xd9b48e;
const UNDER_EYE = 0x9b7f68;
const PIN = 0xe8b62c;
const PIN_CORE = 0x6b4a1c;

export function buildHiguruma() {
  const spec = {
    id: 'higuruma', name: 'Higuruma', H: 1.86, headScale: 0.99,
    // NARROW. Everything here is below the roster floor on purpose.
    shoulder: 0.098, hip: 0.048, muscle: 0.80, bulk: 0.84, legBulk: 0.88,
    skinTone: SKIN, clothColor: SUIT, pantColor: 0x24262f, shoeColor: 0x16171d,
    // a chest that does not fill the jacket and a waist with nothing on it
    torsoShape: { chest: 0.88, waist: 0.84, hip: 0.90 },
    shoulderCap: false,
    // long face, narrow jaw, pronounced chin — a gaunt head, not a round one
    face: { jaw: 1.28, chin: 1.18, width: 0.95 },
    shoe: { len: 0.122, hgt: 0.044 },
    palette: {
      rim: 0xa8b4c8, hairRim: 0x8c93a4, outline: 0x0a0b10,
      metalRim: 0xdfe8ff, accent: 0xd8c78a, energy: 0xd8c78a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- the shirt: dingy, half-untucked ------------------------------------
  // A narrow strip of shirt down the sternum. The first pass made this a wide
  // slab and the model read as a tuxedo — the jacket is open, but it is open
  // on a thin man, so what shows through is a strip, not a shirt front.
  bag.add('cloth', tGeo(shapeExtrude([
    [-0.028 * H, 0.070 * H], [0.028 * H, 0.070 * H], [0.020 * H, -0.115 * H], [-0.020 * H, -0.115 * H]
  ], 0.008 * H), { pos: [0, 0.730 * H, 0.050 * H] }), { chain: torsoChain, color: SHIRT, blend: 0.05 });
  // COLLAR: two small points hanging DOWN either side of the open neck, one
  // longer than the other. Pass 1 had these swept outward and level, which
  // read unmistakably as a bow tie — the single worst thing on the model.
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0.010 * H], [s * 0.017 * H, 0.004 * H], [s * 0.009 * H, -(s > 0 ? 0.042 : 0.032) * H]
    ], 0.005 * H), { rot: [18, 0, s * -4], pos: [s * 0.010 * H, 0.808 * H, 0.044 * H] }),
      { bone: 'Neck', color: COLLAR });
  }
  // the collar band around the back of the neck, so it is a shirt and not two
  // triangles glued to a chest
  bag.add('cloth', tGeo(latheY([
    [0.0295 * H, 0.806 * H], [0.0300 * H, 0.828 * H]
  ], 14, 0.9), { rot: [3, 0, 0] }), { bone: 'Neck', color: COLLAR });

  // ---- the jacket ---------------------------------------------------------
  // Built as PANELS hanging off the frame rather than a closed shell, so the
  // gap down the middle is real geometry and the body inside is visibly
  // narrower than the coat around it.
  for (const s of [1, -1]) {
    // notched lapel — the left one (s = 1, his own left) carries the pin
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0.105 * H], [s * 0.050 * H, 0.082 * H], [s * 0.064 * H, 0.030 * H],
      [s * 0.046 * H, 0.044 * H], [s * 0.026 * H, -0.075 * H], [s * 0.008 * H, -0.070 * H]
    ], 0.005 * H), { rot: [14, 0, s * -3], pos: [0, 0.712 * H, 0.046 * H] }),
      { chain: torsoChain, color: LINING, blend: 0.04 });
    // front panel: the coat itself, hanging past the hip and swinging away
    // from the body. Note the different rotations per side — it does not hang
    // straight because it has not been hung up in a month.
    bag.add('cloth', tGeo(shapeExtrude([
      [s * 0.012 * H, 0.10 * H], [s * 0.082 * H, 0.075 * H],
      [s * 0.090 * H, -0.14 * H], [s * 0.014 * H, -0.155 * H]
    ], 0.010 * H), { rot: [7, 0, s * (s > 0 ? 2 : -5)], pos: [0, 0.660 * H, 0.038 * H] }),
      { chain: torsoChain, color: SUIT, blend: 0.05 });
  }
  // back of the jacket + a hem that sits LOW and uneven
  bag.add('cloth', latheY([
    [0.079 * H, 0.395 * H], [0.083 * H, 0.445 * H], [0.078 * H, 0.50 * H], [0.070 * H, 0.545 * H]
  ], 20, 0.80), { bone: 'Hips', color: SUIT });
  bag.add('cloth', tGeo(latheY([
    [0.081 * H, 0.375 * H], [0.084 * H, 0.415 * H]
  ], 18, 0.78), { rot: [1.5, 0, 2.5] }), { bone: 'Hips', color: SUIT_DK });
  // belt line showing through the open front — the trousers are a size loose
  bag.add('cloth', latheY([
    [0.0645 * H, 0.500 * H], [0.0655 * H, 0.520 * H]
  ], 18, 0.78), { bone: 'Hips', color: 0x14151a });

  // ---- WRINKLES -----------------------------------------------------------
  // The single most important pass on this model. Thin ridges laid across the
  // chest, the back, both sleeves and both thighs at irregular angles and
  // irregular lengths. Regular spacing reads as corduroy, so every value here
  // is deliberately off the grid.
  // Pass 1 cut these at 0.0055H thick and they stood proud of the cloth as
  // visible fins, especially down the back of the sleeves. They are ridges,
  // not slats: thin enough to be a shading break and nothing more.
  const crease = (chainOrBone, w, len, rot, pos, color = SUIT_DK) => {
    const g = tGeo(roundBox(w, 0.0032 * H, len, 0.0012), { rot, pos });
    if (typeof chainOrBone === 'string') bag.add('cloth', g, { bone: chainOrBone, color });
    else bag.add('cloth', g, { chain: chainOrBone, color, blend: 0.05 });
  };
  // chest / stomach: diagonals pulling from the fastened button that isn't
  crease(torsoChain, 0.070 * H, 0.010 * H, [12, 0, 24], [0.026 * H, 0.665 * H, 0.052 * H]);
  crease(torsoChain, 0.055 * H, 0.009 * H, [12, 0, -31], [-0.030 * H, 0.640 * H, 0.050 * H]);
  crease(torsoChain, 0.062 * H, 0.008 * H, [10, 0, 9], [0.006 * H, 0.596 * H, 0.050 * H]);
  crease(torsoChain, 0.048 * H, 0.008 * H, [8, 0, -14], [-0.020 * H, 0.566 * H, 0.048 * H]);
  // back: two long horizontal fold lines where he has been sitting in it
  crease(torsoChain, 0.086 * H, 0.010 * H, [-6, 0, 4], [0, 0.612 * H, -0.048 * H]);
  crease(torsoChain, 0.074 * H, 0.009 * H, [-5, 0, -7], [0.004 * H, 0.570 * H, -0.046 * H]);
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    // sleeve concertina at the elbow — the classic "never taken off" tell
    for (let i = 0; i < 3; i++) {
      const t = 0.18 + i * 0.16;
      const p = el.clone().lerp(wr, t - 0.35);
      crease('UpArm' + s, 0.036 * H, 0.008 * H, [0, m * 8, m * (72 + i * 6)],
        [p.x, p.y + 0.055 * H, p.z + 0.004 * H]);
    }
    for (let i = 0; i < 2; i++) {
      const p = el.clone().lerp(wr, 0.30 + i * 0.30);
      crease('LoArm' + s, 0.030 * H, 0.007 * H, [0, m * -6, m * (74 + i * 8)], [p.x, p.y, p.z + 0.004 * H]);
    }
    // the sleeve is too long: a cuff of jacket swallowing the wrist, with no
    // shirt cuff showing at all (Nanami's white cuffs are the counterpoint)
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0215 * H, 0.0245 * H, 0.036 * H, 10),
      { rot: [8, 0, m * -4], pos: [wr.x, wr.y + 0.022 * H, wr.z] }),
      { bone: 'LoArm' + s, color: SUIT });
    // thigh creases
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s);
    for (let i = 0; i < 2; i++) {
      const p = hp.clone().lerp(kn, 0.35 + i * 0.34);
      crease('Thigh' + s, 0.046 * H, 0.008 * H, [0, m * 10, m * (80 + i * 5)],
        [p.x, p.y, p.z + 0.006 * H], 0x14151a);
    }
    // shoulder: a soft rolled seam, NOT a pad. This one line is most of the
    // difference between his silhouette and Nanami's — so it is a thin flat
    // cap sitting ON the deltoid, not the hemisphere pass 1 put there (which
    // rendered as exactly the shoulder pad it was supposed to replace).
    const sh = joints.get('UpArm' + s);
    bag.add('cloth', tGeo(sphereShell(0.034 * H, { thetaLength: Math.PI * 0.44, scale: [1.05, 0.30, 1.10] }),
      { rot: [0, 0, m * -14], pos: [sh.x + m * 0.001 * H, sh.y + 0.014 * H, sh.z] }),
      { bone: 'UpArm' + s, color: SUIT });
  }

  // ---- THE SUNFLOWER PIN 向日葵バッジ --------------------------------------
  // Left lapel. The only saturated colour on the model, and the thing that
  // says "attorney" without a word of UI.
  {
    const px = 0.052 * H, py = 0.742 * H, pz = 0.058 * H;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      bag.add('metal', tGeo(roundBox(0.0055 * H, 0.0026 * H, 0.0095 * H, 0.0012),
        { rot: [12, (a / DEG), 0], pos: [px + Math.cos(a) * 0.0072 * H, py + Math.sin(a) * 0.0072 * H, pz] }),
        { chain: torsoChain, color: PIN, blend: 0.02 });
    }
    bag.add('metal', tGeo(new THREE.CylinderGeometry(0.0062 * H, 0.0062 * H, 0.0028 * H, 12),
      { rot: [78, 0, 0], pos: [px, py, pz + 0.0016 * H] }),
      { chain: torsoChain, color: PIN_CORE, blend: 0.02 });
  }

  // ---- face ---------------------------------------------------------------
  // Half-lidded, low heavy brows angled DOWN at the outer edge (tired, not
  // angry), a wide flat mouth line.
  addFace(ctx, {
    eyeW: 0.50, eyeH: 0.20, eyeColor: 0x6b5236,
    browTilt: -7, browUp: 1.30, browColor: 0x241d16,
    lashColor: 0x14100c, lashTilt: 3, eyeTilt: 2,
    mouthW: 0.30, mouthTilt: -2, mouthColor: 0x6b4038
  });
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;
  // VERY SMALL PUPILS over the brown iris addFace laid down. Pinpricks — the
  // single feature that makes the stare read as vacant rather than intense.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.40;
    bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.020, 8),
      { pos: [ex - s * headR * 0.03, eyeY + headR * 0.012, faceZ + headR * 0.030] }),
      { bone: 'Head', color: 0x120e0a });
    // the smudge under the eye — two soft bands, the lower one fainter
    bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.055, 0.004, 0.002),
      { rot: [0, 0, s * -4], pos: [ex, eyeY - headR * 0.135, faceZ + headR * 0.012] }),
      { bone: 'Head', color: UNDER_EYE });
    bag.add('flat', tGeo(roundBox(headR * 0.24, headR * 0.035, 0.004, 0.002),
      { rot: [0, 0, s * -3], pos: [ex - s * headR * 0.01, eyeY - headR * 0.195, faceZ + headR * 0.006] }),
      { bone: 'Head', color: 0xb99a80 });
  }
  // LARGE NOSE — the reference calls it out explicitly, so it gets a real
  // bridge and a real ball on top of the base wedge addFace provides.
  bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.085, 8, 6),
    { scale: [0.85, 0.8, 1.1], pos: [0, eyeY - headR * 0.30, faceZ + headR * 0.055] }),
    { bone: 'Head', color: SKIN });
  bag.add('skin', tGeo(roundBox(headR * 0.075, headR * 0.30, headR * 0.075, headR * 0.03),
    { rot: [-9, 0, 0], pos: [0, eyeY - headR * 0.155, faceZ + headR * 0.012] }),
    { bone: 'Head', color: SKIN });
  // STUBBLE: a value shift wrapped around the jaw and upper lip, sitting just
  // off the skin so it darkens the plane without becoming a beard.
  // Pass 3 note: at thetaStart 0.52*PI this band came up over the mouth and
  // read as a bandana. It starts lower and stops shorter — jaw and chin only.
  bag.add('flat', tGeo(sphereShell(headR * 1.005, {
    thetaStart: Math.PI * 0.62, thetaLength: Math.PI * 0.22,
    phiStart: Math.PI * 0.16, phiLength: Math.PI * 0.68, scale: [0.94, 1.02, 0.98]
  }), { pos: [headC.x, headC.y + headR * 0.04, headC.z + headR * 0.02] }),
    { bone: 'Head', color: STUBBLE });
  // the moustache shadow: a thin band under the nose, well clear of the mouth
  bag.add('flat', tGeo(roundBox(headR * 0.26, headR * 0.045, 0.005, 0.002),
    { pos: [0, headC.y - headR * 0.44, faceZ - headR * 0.015] }), { bone: 'Head', color: STUBBLE });

  // ---- hair: stringy, swept back, coming apart ----------------------------
  // Skull cap first, then BACK-SWEPT strands (the canonical shape), then the
  // strands that have escaped forward over the brow (the Culling Game state).
  // PASS 2 REWRITE. Pass 1 produced a bowl cut with two horns: the cap sat
  // too high and too short so it read as a helmet, the swept cards were buried
  // inside the nape mass and contributed nothing, and the coneSpike tails
  // stuck out sideways at temple height like antlers. The shape is rebuilt
  // here as one continuous back-swept mass — skull, crown, nape — with the
  // cards laid ON TOP of it where they can actually be seen.
  //
  // PASS 3. Pass 2 over-corrected into a full helmet — the shells wrapped the
  // front of the skull and the face disappeared entirely. The rule the rest of
  // the roster follows (see nanami.js) is that a hair shell only ever covers
  // the BACK arc: three.js puts +Z at phi = 0.5*PI, so anything front-facing
  // has to be excluded by phi range, never trimmed by theta. The mass is
  // sculpted from three shells inside that rule and the cards are demoted to
  // surface detail, which is all they were ever good for.
  //
  // 1. scalp — full circle, but stopping WELL above the eye line
  bag.add('hair', tGeo(sphereShell(headR * 1.045, { thetaLength: Math.PI * 0.40, scale: [1.03, 1.00, 1.08] }),
    { pos: [headC.x, headC.y + headR * 0.03, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  // 2. the mass carried BACKWARD off the crown — back arc only. This is what
  //    gives the head its swept direction in profile.
  bag.add('hair', tGeo(sphereShell(headR * 1.00, {
    thetaStart: Math.PI * 0.02, thetaLength: Math.PI * 0.62,
    phiStart: Math.PI * 0.80, phiLength: Math.PI * 1.40, scale: [1.02, 1.10, 1.08]
  }), { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.26] }),
    { bone: 'Head', color: HAIR });
  // 3. the nape — shaggy, hanging past the collar line
  bag.add('hair', tGeo(sphereShell(headR * 0.96, {
    thetaStart: Math.PI * 0.40, thetaLength: Math.PI * 0.34,
    phiStart: Math.PI * 0.86, phiLength: Math.PI * 1.28, scale: [1.04, 1.50, 1.12]
  }), { pos: [headC.x, headC.y - headR * 0.12, headC.z - headR * 0.28] }),
    { bone: 'Head', color: HAIR_DK });
  // STRINGY: the texture the reference calls out, as narrow dark grooves
  // riding the surface of that mass from the hairline to the nape. Seven of
  // them at uneven spacing — separation of strands, not extra volume.
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const x = (t - 0.5) * 1.34 * headR + Math.sin(i * 2.3) * 0.05 * headR;
    const long = 0.90 + ((i * 5) % 3) * 0.10;
    bag.add('hair', ribbonShell([
      v3(headC.x + x * 0.66, headC.y + headR * 0.86, headC.z + headR * 0.40),
      v3(headC.x + x * 0.96, headC.y + headR * 0.94, headC.z - headR * 0.14),
      // pushed out past the back mass — at 1.02 they sat inside it and the
      // whole back of the head rendered as a smooth helmet
      v3(headC.x + x * 1.06, headC.y + headR * 0.50, headC.z - headR * 1.00),
      v3(headC.x + x * 1.06, headC.y + headR * (0.14 - 0.26 * long), headC.z - headR * (1.14 * long))
    ], u => headR * 0.11 * (1 - u * 0.35), 0.007,
      { seg: 9, normalHint: v3(x * 0.6, 0.8, -0.3) }),
      { bone: 'Head', color: i % 2 ? HAIR_DK : 0x3a302a });
  }
  // ESCAPED FORELOCKS. Four uneven strands fallen forward off the swept mass.
  // SHORT: pass 1 hung them to the jaw and they curtained the whole face off,
  // which cost the two features that make him readable (the pinprick pupils
  // and the shadows under the eyes). They stop at the brow now.
  // Pulled INBOARD from pass 2: at |x| 0.62 they cleared the temple and read
  // as a second pair of horns from three-quarter. They belong on the brow.
  const fore = [
    { x: -0.46, len: 0.62, tilt: -0.10 },
    { x: -0.16, len: 0.80, tilt: -0.02 },
    { x: 0.20, len: 0.52, tilt: 0.07 },
    { x: 0.48, len: 0.72, tilt: 0.13 }
  ];
  for (const f of fore) {
    bag.add('hair', ribbonShell([
      v3(headC.x + f.x * headR * 0.72, headC.y + headR * 0.88, headC.z + headR * 0.34),
      v3(headC.x + f.x * headR * 0.98, headC.y + headR * 0.70, headC.z + headR * 0.70),
      v3(headC.x + (f.x + f.tilt) * headR, headC.y + headR * (0.66 - f.len * 0.42), headC.z + headR * 0.80),
      v3(headC.x + (f.x + f.tilt * 1.7) * headR, headC.y + headR * (0.58 - f.len * 0.66), headC.z + headR * 0.74)
    ], u => headR * 0.15 * (1 - u * 0.5), 0.010, { seg: 7, normalHint: v3(0.1, 0.3, 1) }),
      { bone: 'Head', color: HAIR });
  }
  // and the tails that have come loose at the back of the neck — hanging
  // DOWN behind the collar, which is where pass 1's "horns" were supposed to
  // be all along
  for (let i = 0; i < 4; i++) {
    const x = (i / 3 - 0.5) * 1.05 * headR;
    bag.add('hair', tGeo(
      coneSpike(headR * 0.085, headR * (0.44 + (i % 2) * 0.20),
        v3(0, 0, -headR * 0.12), { radial: 5, hSeg: 4 }),
      {
        rot: [176, 0, (i - 1.5) * 6],
        pos: [headC.x + x, headC.y - headR * 0.28, headC.z - headR * 1.06]
      }), { bone: 'Head', color: HAIR_DK });
  }
  // sideburns, uneven
  for (const s of [1, -1]) {
    bag.add('hair', ribbonShell([
      v3(headC.x + s * headR * 0.86, headC.y + headR * 0.42, headC.z + headR * 0.16),
      v3(headC.x + s * headR * 0.90, headC.y + headR * 0.06, headC.z + headR * 0.20),
      v3(headC.x + s * headR * 0.86, headC.y - headR * (s > 0 ? 0.26 : 0.16), headC.z + headR * 0.18)
    ], u => headR * 0.13 * (1 - u * 0.4), 0.008, { seg: 5, normalHint: v3(s, 0.2, 0.4) }),
      { bone: 'Head', color: HAIR_DK });
  }

  // ---- props --------------------------------------------------------------
  const briefcase = buildBriefcase(H, spec.palette);
  const sword = buildExecutionersSword(H, spec.palette);

  // ---- springs: the tie and the jacket vents -------------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  // TIE: the knot is pulled DOWN off an unbuttoned collar and sits on the
  // chest, not at the throat, and the tail is longer and looser than Nanami's.
  bag.add('cloth', tGeo(roundBox(0.024 * H, 0.030 * H, 0.016 * H, 0.005),
    { rot: [10, 0, 8], pos: [0.008 * H, 0.760 * H, 0.056 * H] }),
    { chain: torsoChain, color: TIE, blend: 0.05 });
  springs.push({
    bone: 'Chest', localOffset: v3(0.008 * H, 0.052 * H, 0.060 * H),
    restDir: v3(0.06, -1, 0.14).normalize(), stiffness: 62, damping: 0.84, gravity: 9,
    segments: [
      { len: 0.070 * H, mesh: makeFlapMesh(0.026 * H, 0.034 * H, 0.070 * H, 0.010, clothMat, TIE, oOpts) },
      { len: 0.066 * H, mesh: makeFlapMesh(0.034 * H, 0.032 * H, 0.066 * H, 0.009, clothMat, TIE, oOpts) },
      { len: 0.052 * H, mesh: makeFlapMesh(0.032 * H, 0.010 * H, 0.052 * H, 0.008, clothMat, TIE, oOpts) }
    ]
  });
  // JACKET VENTS: three of them, not two, and the middle one is off-centre —
  // the coat has lost its shape entirely.
  for (const v of [{ x: 0.048, w: 1.0 }, { x: -0.002, w: 0.82 }, { x: -0.052, w: 1.0 }]) {
    springs.push({
      bone: 'Hips', localOffset: v3(v.x * H, -0.075 * H, -0.058 * H),
      restDir: v3(v.x * 2, -1, -0.18).normalize(), stiffness: 58, damping: 0.86, gravity: 8,
      segments: [
        { len: 0.066 * H, mesh: makeFlapMesh(0.052 * H * v.w, 0.048 * H * v.w, 0.066 * H, 0.009, clothMat, SUIT, oOpts) },
        { len: 0.058 * H, mesh: makeFlapMesh(0.048 * H * v.w, 0.038 * H * v.w, 0.058 * H, 0.008, clothMat, SUIT_DK, oOpts) }
      ]
    });
  }

  return finalizeModel(ctx, {
    springs, outlineThickness: 0.0125,
    props: {
      // He CARRIES the briefcase. It is in his hand in neutral and it is what
      // he hits people with — see fighter._props.
      case: {
        node: briefcase, default: 'hand',
        attachments: {
          hand: { bone: 'HandR', pos: [0, -0.055 * H, 0.004 * H], rot: [0, 0, 0] },
          // parked under the world, the way the rest of the roster stows props
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      // The Executioner's Sword exists only inside the domain.
      sword: {
        node: sword, default: 'away',
        attachments: {
          // POINT-UP. The old 150 carried it tip-down "trailing near the
          // ground" — and a 1.37 m blade angled down out of a standing hand
          // does not trail near the ground, it goes THROUGH it, which is what
          // the bench sheet showed. Held up it clears the floor by its whole
          // length and it is also how he actually carries it.
          // Solved against his own STANCE rather than copied — see the note on
          // Toji's split_soul for why an attachment rotation never transfers
          // between characters.
          hand: { bone: 'HandR', pos: [0, -0.048 * H, 0.014 * H], rot: [23, -5, -25] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      }
    }
  });
}

// ---------------------------------------------------------------------------
// THE BRIEFCASE — a real modelled prop, not a box. Hard-sided, scuffed, with
// two latches, a stitched handle and a corner that has been dropped one time
// too many.
function buildBriefcase(H, palette) {
  const g = new THREE.Group();
  const w = 0.20 * H, h = 0.145 * H, d = 0.048 * H;
  const leather = MAT.cloth({ vertexColors: false, color: 0x2a211a, rimColor: palette.rim });
  const trim = MAT.cloth({ vertexColors: false, color: 0x1a1410, rimColor: palette.rim });
  const brass = MAT.metal({ vertexColors: false, color: 0x8a7444 });

  const shell = new THREE.Mesh(roundBox(w, h, d, 0.010 * H, 2), leather);
  g.add(shell);
  // the seam where the two halves meet, and a scuffed lower edge
  const seam = new THREE.Mesh(roundBox(w * 1.01, 0.008 * H, d * 1.02, 0.002), trim);
  seam.position.y = h * 0.10;
  g.add(seam);
  const scuff = new THREE.Mesh(roundBox(w * 0.98, 0.014 * H, d * 1.01, 0.003), trim);
  scuff.position.y = -h * 0.46;
  g.add(scuff);
  // latches
  for (const s of [1, -1]) {
    const latch = new THREE.Mesh(roundBox(0.024 * H, 0.018 * H, d * 1.08, 0.003), brass);
    latch.position.set(s * w * 0.28, h * 0.10, 0);
    g.add(latch);
  }
  // handle: a flattened arch on the top edge
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.030 * H, 0.0075 * H, 6, 14, Math.PI),
    trim);
  handle.position.y = h * 0.5;
  handle.rotation.z = 0;
  g.add(handle);
  for (const s of [1, -1]) {
    const mount = new THREE.Mesh(roundBox(0.012 * H, 0.010 * H, 0.014 * H, 0.002), brass);
    mount.position.set(s * 0.030 * H, h * 0.49, 0);
    g.add(mount);
  }
  g.add(makeOutline(shell, { color: 0x0a0b10, thickness: 0.008 }));
  return g;
}

// ---------------------------------------------------------------------------
// THE EXECUTIONER'S SWORD 死刑執行の剣
//
// Researched: the blade Deadly Sentencing hands him to carry out the verdict.
// The consistent read across every reference image and every prop replica is
// a CEREMONIAL EXECUTIONER'S SWORD, not a fighting sword — enormously broad,
// straight-sided, and finished with a SQUARED-OFF CHISEL TIP rather than a
// point, because a headsman's sword never needed one. Prop makers repeatedly
// note printing it in clear filament with a black edge line, which matches the
// pale, almost glassy way it renders in the manga; that is the finish here —
// near-white steel with a hot bright edge and a dark spine, rather than a grey
// metal blade.
//
// It is 1.42 m of sword on a 1.86 m man. That is the point: it changes his
// silhouette completely, and it is the only object in his entire kit that
// looks like it belongs to somebody dangerous.
function buildExecutionersSword(H, palette) {
  const g = new THREE.Group();
  const len = 0.60 * H;          // blade length
  const wide = 0.115 * H;        // blade width — enormous

  // Pulled down from near-white: the bloom pass turned a pale blade into a
  // lightsaber, which is the wrong weapon entirely. It reads as cold polished
  // steel now and the EDGE is the only bright line on it.
  const steel = MAT.metal({ vertexColors: false, color: 0xa8b2c4, rimColor: 0xdde4ee });
  const edge = MAT.metal({ vertexColors: false, color: 0xd6dde8, rimColor: 0xf2f6ff });
  const dark = MAT.cloth({ vertexColors: false, color: 0x171a22, rimColor: palette.rim });
  const gold = MAT.metal({ vertexColors: false, color: 0xa88b46, rimColor: 0xffe9b0 });

  // BLADE: straight-sided, squared chisel tip. Modelled as a slab with a
  // slight widening toward the tip (a headsman's sword is heaviest where it
  // lands) and a bevel plate on each face rather than a rounded profile.
  const blade = new THREE.Mesh(roundBox(wide, len, 0.020 * H, 0.004 * H, 2), steel);
  blade.position.y = len / 2 + 0.10 * H;
  blade.scale.set(1, 1, 1);
  g.add(blade);
  // the tip: a chisel bevel, squared off flat across the end
  const tip = new THREE.Mesh(roundBox(wide * 1.02, 0.030 * H, 0.021 * H, 0.003 * H), steel);
  tip.position.y = len + 0.10 * H;
  g.add(tip);
  const tipEdge = new THREE.Mesh(roundBox(wide * 1.03, 0.008 * H, 0.008 * H, 0.002), edge);
  tipEdge.position.y = len + 0.114 * H;
  g.add(tipEdge);
  // the two long cutting edges, kept bright so the blade reads as sharp
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(roundBox(0.010 * H, len * 1.005, 0.010 * H, 0.002), edge);
    e.position.set(s * wide * 0.5, len / 2 + 0.10 * H, 0);
    g.add(e);
  }
  // FULLER: a long groove down the centre of each face, dark so it reads as
  // depth. Two of them, close together — the classic executioner's twin fuller.
  for (const s of [1, -1]) {
    for (const z of [1, -1]) {
      const f = new THREE.Mesh(roundBox(0.014 * H, len * 0.80, 0.004 * H, 0.001), dark);
      f.position.set(s * 0.020 * H, len * 0.48 + 0.10 * H, z * 0.0105 * H);
      g.add(f);
    }
  }
  // ricasso block where the blade meets the guard
  const ricasso = new THREE.Mesh(roundBox(wide * 0.55, 0.040 * H, 0.024 * H, 0.004), dark);
  ricasso.position.y = 0.085 * H;
  g.add(ricasso);

  // GUARD: a wide straight crossbar with turned-down quillon tips — formal,
  // symmetrical, courtroom furniture rather than a weapon fitting.
  const guard = new THREE.Mesh(roundBox(0.175 * H, 0.020 * H, 0.028 * H, 0.005), gold);
  guard.position.y = 0.055 * H;
  g.add(guard);
  for (const s of [1, -1]) {
    const q = new THREE.Mesh(roundBox(0.020 * H, 0.034 * H, 0.026 * H, 0.005), gold);
    q.position.set(s * 0.082 * H, 0.040 * H, 0);
    q.rotation.z = s * -0.35;
    g.add(q);
    // a small scale-pan motif on each quillon: the balance, carried into the
    // blade that settles it
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * H, 0.013 * H, 0.006 * H, 10), gold);
    pan.position.set(s * 0.095 * H, 0.022 * H, 0);
    g.add(pan);
  }

  // GRIP: long enough for two hands, wrapped, with a heavy disc pommel.
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.0125 * H, 0.0145 * H, 0.135 * H, 10), dark);
  grip.position.y = -0.022 * H;
  g.add(grip);
  for (let i = 0; i < 6; i++) {
    const wrap = new THREE.Mesh(roundBox(0.030 * H, 0.011 * H, 0.030 * H, 0.004), gold);
    wrap.position.y = 0.028 * H - i * 0.021 * H;
    wrap.rotation.y = (i % 2 ? 1 : -1) * 0.22;
    wrap.scale.setScalar(0.92);
    g.add(wrap);
  }
  const pommel = new THREE.Mesh(new THREE.CylinderGeometry(0.030 * H, 0.030 * H, 0.016 * H, 14), gold);
  pommel.position.y = -0.096 * H;
  g.add(pommel);
  const pommelCap = new THREE.Mesh(new THREE.SphereGeometry(0.014 * H, 10, 8), gold);
  pommelCap.position.y = -0.108 * H;
  g.add(pommelCap);

  // OUTLINE TRANSFORMS. makeOutline clones geometry and material only — it
  // does NOT carry the source mesh's position — so an outline taken from a
  // mesh that has been moved renders back at the group origin. On a blade
  // offset half a metre up its own group that showed up as an enormous black
  // slab floating behind him. Copy the transform across.
  for (const src of [blade, guard]) {
    const hull = makeOutline(src, { color: 0x0a0b10, thickness: src === blade ? 0.010 : 0.008 });
    hull.position.copy(src.position);
    hull.rotation.copy(src.rotation);
    hull.scale.copy(src.scale);
    g.add(hull);
  }

  // Re-origin the whole sword on the MIDDLE OF THE GRIP, so the attachment
  // point in the hand is the part a hand actually holds. Without this the
  // group origin sits at the guard and he carries it by the crossbar with a
  // foot of pommel sticking up past his wrist.
  for (const c of g.children) c.position.y += 0.022 * H;
  return g;
}
