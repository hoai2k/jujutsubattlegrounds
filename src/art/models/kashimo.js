// HAJIME KASHIMO — 禪院甚壱 / 羂索が用意した器. THE GOD OF LIGHTNING.
// The Culling Game body (the young vessel Kenjaku prepared), not the
// four-hundred-year-old original and not the fully transformed Mythical Beast.
//
// ============================ REFERENCE SHEET ============================
// RESEARCH, AND WHAT I COULD AND COULD NOT DO (2026-08-13). I ran web research
// and read the character descriptions out of the Jujutsu Kaisen Wiki mirrors,
// the Minus One wiki, the Villains Wiki, Gamerant's technique explainer and a
// profile aggregator. I could NOT study reference IMAGES: the in-app browser
// pane is not displayed in this session, so it composites no frames and every
// screenshot attempt timed out. So this sheet is built from TEXT descriptions
// of the design, cross-checked across five sources, and NOT from looking at
// front / 3-4 / side / back art. Everything below that a text source states is
// marked ACCURATE; everything I had to infer is marked INFERRED, and the
// delivery notes say the same thing in the same words.
//
// BUILD    ACCURATE(lean) / INFERRED(height). 1.79 m — tall and WIRY. Shoulder
//          0.104·H (the narrowest male shoulder in the roster after Megumi),
//          muscle 0.90, bulk 0.88. He is a whip, not a hammer: every existing
//          fast character in this game is fast AND slim, and he has to out-read
//          Naoya's 1.83 lean frame at a glance, so he is shorter, narrower and
//          longer-limbed. MEASURED reference points off the model files:
//          Gojo 1.92, Toji 1.88, Nanami 1.845, Naoya 1.83, Choso 1.81,
//          KASHIMO 1.79, Megumi 1.75, Yuji 1.75, Yuta 1.73. He is the
//          shortest adult male on the roster and the narrowest-shouldered,
//          which is the point — verified in shots/lineup2.png next to Naoya.
// HEAD     INFERRED. Youthful and open — the vessel is a teenager and the
//          sources call the face "noticeably more youthful". Softer jaw than
//          Naoya (jaw 0.96, chin 0.94), wide-set eyes, THICK BROWS (accurate:
//          "thick eyebrows" is stated in two sources and is a real identity
//          cue — they are the one heavy line on an otherwise light face).
// HAIR     ACCURATE, and it IS the silhouette. Long CYAN #58e2e8, "deliberately
//          left in a tousled state". Three distinct masses, and all three have
//          to be present or he reads as generic:
//            1 TWO FRONT BUNS, one on each side of the head, set high and
//              forward. Sources: "a pair of buns set on either side", "feminine
//              Nezha-style hair buns". These are the single most identifiable
//              thing about him and they are built as real spheroids with a
//              wrapped band, not as lumps in the shell.
//            2 A LOW GATHERED TAIL at the back, held by ONE tie, falling to
//              just past the neck. Sources: "gathered at the back with a lone
//              tie", "reaching just beyond his neck". Built as a spring chain
//              so it swings — the only long hair on him, and the thing that
//              sells his speed in motion.
//            3 LOOSE FRONT BANGS framing the face, messy, uneven lengths.
// FACE     ACCURATE — LIGHTNING-SHAPED LINES trailing from his LOWER EYELIDS,
//          one under each eye. Stated in two independent sources. They are the
//          second identity cue after the buns and they are built as real
//          zig-zag geometry rather than a painted quad, because they have to
//          survive the 3/4 view and they are where the CHARGE TIER glow lives.
// EYES     ACCURATE(colour) — cyan, matching the hair. Bright, open, and set
//          under those heavy brows.
// GARMENTS ACCURATE. Everything is WHITE and everything is LOOSE:
//            1 ROBE — "a roomy robe topped by a bunched collar", plain white
//              #f2f2ee. Wide body, deep sleeves, hem to mid-thigh. The COLLAR
//              is bunched/gathered at the throat rather than flat, and that
//              gather is what stops the white reading as a lab coat.
//            2 SLEEVES PUSHED UP, exposing FOREARMS WOUND IN BANDAGES
//              #e2ddd0. Stated explicitly ("sleeves nudged up", "forearms
//              wound in bandages") and it is the detail that makes the arms
//              read at fighting distance against all that white.
//            3 TROUSERS — white, loose, gathered at the ankle.
//            4 SHOES — white. (Sources say white shoes; he is NOT barefoot.)
// PROP     THE NYOI STAFF 如意棒. ACCURATE in function, INFERRED in detail: the
//          sources agree it is an iron rod-type cursed tool that acts as a
//          LIGHTNING ROD — he plants it to earth a circuit, and he can send it
//          away and call it back at lightning speed. So it is built as a long
//          dark-iron rod (1.72 m — taller than he is when planted) with:
//            · a segmented shaft with raised iron collars every third
//            · a CONDUCTOR TIP at the top: a four-pronged open cage in bright
//              brass that the arcs actually spawn inside
//            · a spiked ferrule at the bottom, for planting it
//          It is on screen every single frame, so it gets more geometry than
//          any other prop in the project except Higuruma's sword.
// PALETTE  hair #58e2e8 / hi #9df6f8 · skin #f6e6da · robe #f2f2ee / shade
//          #d5d7d4 · bandage #e2ddd0 · staff iron #3a3f4c / collar #b9863a ·
//          eyes #46d8e0 · LIGHTNING #a46bff with white-violet cores #f4ecff
//
//          THE LIGHTNING COLOUR IS THE ONE DELIBERATE DEPARTURE FROM CANON,
//          AND IT IS A LEGIBILITY DECISION. Checked against every energy
//          colour already in the game, as the brief requires:
//            Gojo      #7fd0ff  pale sky blue      — Kashimo's canon blue-white
//                                                    lands ON this. Rejected.
//            Yuta      #9ff5c9  mint green-white
//            Choso     #c4142c  crimson
//            Hakari    #ffc93c  gold
//            Naoya     #e8c85a  pale gold
//            Geto      #6b2fa0  DARK plum, low value
//            Todo      #ff5fc8  magenta-pink
//          #a46bff is a high-value electric VIOLET: it is two steps of hue off
//          Geto's and three steps of value above it, it is bluer than Todo's
//          magenta, and it shares nothing with Gojo's blue. His CYAN stays on
//          the model (hair, eyes, the eyelid lines) so the character is still
//          the cyan-haired one — the arcs are violet, the man is cyan, and the
//          two together are nobody else in the roster.
// IDENTITY 1) the two high front buns over a gathered cyan tail
//          2) the lightning-bolt lines under both eyes
//          3) a long dark iron rod carried by a boy dressed entirely in white
// MOTION   He never settles. The model's contribution is the CHARGE RIG below
//          — arcs that grow across the body in four discrete tiers, an eye
//          glow that steps with them, and a conductor tip that crackles — so
//          the opponent can read his tier from across the arena without ever
//          looking at the HUD, which the brief requires.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const HAIR = 0x58e2e8;
const HAIR_HI = 0x9df6f8;
const HAIR_DK = 0x2f9fa8;
const SKIN = 0xf6e6da;
const ROBE = 0xf2f2ee;
const ROBE_SH = 0xd5d7d4;
// PASS 2 — THREE WHITES, NOT ONE. Canon is "his clothes are all white" and the
// first pass took that literally: robe, trousers and shoes were the same hex
// and the render was a single white column with a head on it, with no leg, no
// hem and no shoe visible at fighting distance. These are all still white — the
// steps are 6% and 8% of value, far too small to read as "grey trousers" — but
// they are enough for the eye to find the garment boundaries, which is the
// whole job. Compare Higuruma, whose suit is one colour and gets away with it
// because it is DARK and reads on its outline instead.
const TROUSER = 0xe0e0d8;
const SHOE = 0xcfcfc6;
// PASS 4 — the bandage went from #e2ddd0 to #d8ccb2. At the lighter value it
// was within 4% of the robe and the forearms VANISHED, leaving the wrap rings
// floating in space like a stack of washers. A bandage is unbleached; making it
// visibly warmer and darker than the robe is both more accurate and the only
// way the arms read against all that white.
const BAND = 0xd8ccb2;
const IRON = 0x3a3f4c;
const IRON_HI = 0x5c6474;
const BRASS = 0xb9863a;
const EYE = 0x46d8e0;
export const BOLT = 0xa46bff;        // the lightning. See the palette note.
export const BOLT_CORE = 0xf4ecff;

export function buildKashimo() {
  const spec = {
    id: 'kashimo', name: 'Kashimo', H: 1.79, headScale: 0.99,
    shoulder: 0.104, hip: 0.047, muscle: 0.90, bulk: 0.88,
    legBulk: 1.22,                        // loose white trousers
    skinTone: SKIN, clothColor: ROBE, pantColor: TROUSER, shoeColor: SHOE,
    // THE SLEEVES ARE PUSHED UP, so the builder's arm tubes are BANDAGE, not
    // robe. The robe sleeve is added separately below and stops at the elbow —
    // which is the whole point of the detail and it cannot be expressed by
    // colouring the builder's arm.
    sleeveColor: BAND,
    armSlot: 'cloth',
    // PASS 4 — THE BUILDER'S SHOULDER CAP IS OFF. It reads `spec.sleeveColor`,
    // which on him is the BANDAGE colour (because the sleeves are pushed up and
    // the builder's arm tubes have to be bandage), so the shared cap put two
    // tan domes on top of a white robe and they rendered as leather epaulettes.
    // A robe-coloured cap is added by hand below instead.
    shoulderCap: false,
    torsoShape: { chest: 0.96, waist: 0.94, hip: 0.98 },
    face: { jaw: 0.96, chin: 0.94, width: 1.02 },
    shoe: { len: 0.110, hgt: 0.044 },
    palette: {
      rim: 0xd8f6ff, hairRim: 0xbdfbff, outline: 0x0a0a12,
      accent: BOLT, energy: BOLT
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE ---------------------------------------------------------------
  // Open and young, and then two heavy black brows sitting on top of it. The
  // contrast between the light face and the thick brows is the read.
  addFace(ctx, {
    eyeColor: EYE, eyeW: 0.54, eyeH: 0.34, browColor: 0x1b2430,
    browTilt: 5, browUp: 1.12, lashColor: 0x14202c, mouthW: 0.20
  });
  // THICK BROWS — a second, heavier bar laid over the shared one. Canon calls
  // them out and they are the only weight on the upper face.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.40;
    bag.add('flat', tGeo(roundBox(headR * 0.50, headR * 0.075, 0.004, 0.002),
      { rot: [0, 0, s * 6], pos: [ex, eyeY + headR * 0.36, faceZ + headR * 0.022] }),
      { bone: 'Head', color: 0x1b2430 });
  }

  // ---- THE LIGHTNING LINES UNDER THE EYES ---------------------------------
  // Canon, and identity cue #2. A real zig-zag, three segments, running from
  // the inner corner of the lower lid down and out across the cheek. Built as
  // geometry rather than a texture quad so it holds its shape in the 3/4 view,
  // and kept in a group the CHARGE RIG can brighten.
  {
    const seg = (x, yy, len, rot, wid) => tGeo(roundBox(wid, len, 0.004, 0.0015),
      { rot: [0, 0, rot], pos: [x, yy, faceZ + headR * 0.030] });
    for (const s of [1, -1]) {
      const ex = s * headR * 0.40;
      bag.add('flat', seg(ex + s * headR * 0.05, eyeY - headR * 0.20, headR * 0.20, s * 34, headR * 0.055), { bone: 'Head', color: EYE });
      bag.add('flat', seg(ex + s * headR * 0.14, eyeY - headR * 0.32, headR * 0.17, s * -30, headR * 0.050), { bone: 'Head', color: EYE });
      bag.add('flat', seg(ex + s * headR * 0.21, eyeY - headR * 0.44, headR * 0.15, s * 26, headR * 0.045), { bone: 'Head', color: EYE });
    }
  }

  // ---- HAIR ---------------------------------------------------------------
  // Three masses, built in the order they occlude: shell, bangs, buns, tail.
  // The shell is deliberately SMALL — it only has to cover the skull, because
  // the silhouette is carried by the buns and the tail, and a big shell would
  // swallow both.
  // PASS 2 — THE WHOLE HAIR BLOCK WAS REBUILT, AND THE LESSON IS WORTH
  // WRITING DOWN BECAUSE IT IS NOT OBVIOUS FROM THE CODE.
  //
  // Pass 1 placed the bangs the way every other character's crown bands are
  // placed — at y = +0.60·headR with a small tiltX — and reasoned that a small
  // tilt would let them hang. It does not. `band` builds a box whose LENGTH is
  // its LOCAL Y, so an untilted band extends HALF ITS LENGTH ABOVE its centre:
  // at y = +0.60·headR with len 0.8·headR the top of every bang was a full
  // headR above the crown. The render was unambiguous — he had a cyan crown of
  // spikes standing straight up and a pale plate across his eyes, and none of
  // the three hair masses read at all.
  //
  // The fix is not a tilt. It is that A FRINGE'S CENTRE MUST SIT AT THE MIDDLE
  // OF THE FRINGE, which for hair falling from the hairline (+0.55) to the brow
  // (+0.02) is y = +0.28·headR — half a headR lower than pass 1 had it. Naoya's
  // crown bands can sit high because they are SWEPT BACK at tiltX -62, i.e.
  // nearly flat along the skull; a hanging fringe is a different construction
  // and copying the placement without copying the tilt produced neither.
  const FACE_GAP = 1.30;
  bag.add('hair', tGeo(sphereShell(headR * 0.99, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.72, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.01, headC.z - headR * 0.03] }),
    { bone: 'Head', color: HAIR });

  const band = (x, yOff, z, len, wid, tiltX, roll, color = HAIR, thick = 0.11) => {
    bag.add('hair', tGeo(roundBox(wid, len, headR * thick, headR * 0.026, 2),
      { rot: [tiltX, 0, roll], pos: [x, headC.y + yOff, headC.z + z] }), { bone: 'Head', color });
  };

  // 3 BANGS — a FRINGE, and pass 3 is the one that actually made it one.
  //
  // PASS 2 hung seven short narrow bands off the forehead at y ≈ +0.28·headR
  // with a small positive tilt. The head shot was decisive: they rendered as a
  // row of separate rectangular tabs with visible gaps between them, sitting
  // across his forehead like a tiara, and the SKULL SHOWED PINK ABOVE THEM —
  // because the hair shell's `phiStart` gap is cut all the way to the pole, so
  // the front of the crown is bare by construction and it is the FRINGE's job
  // to cover it. Nothing at +0.28 reaches the crown.
  //
  // THE GEOMETRY, worked out rather than eyeballed, because a fringe has three
  // constraints at once and guessing satisfies at most two:
  //   · rotating a band about +X by θ sends its top to (0, cosθ, sinθ), so a
  //     NEGATIVE tilt puts the top BACK on the skull and swings the tip
  //     FORWARD — which is what hair falling over a forehead does. Pass 2's
  //     positive tilt did the exact opposite and laid them on his cheeks.
  //   · at centre y +0.50·headR, len 0.85·headR and tilt -30, the top lands at
  //     y +0.87 / z +0.21 (on the crown) and the tip at y +0.13 / z +0.63
  //     (at the brow, just proud of the face plane at 0.615). That is the whole
  //     span a fringe has to cover and it is why the centre is HALF A headR
  //     higher than pass 2 had it.
  //   · the shell's face gap is 1.30 rad, so it exposes x ∈ ±0.61·headR. Seven
  //     bands at 0.25 spacing span ±0.75 and each is 0.30 wide, so they OVERLAP
  //     by a fifth of their width. Gaps were the other half of the tiara read.
  // PASS 3 ADDED THE CROWN LAYER, AND IT IS THE PIECE THE FIRST TWO PASSES
  // WERE MISSING. A hanging fringe cannot also cover the top of the skull: at
  // any tilt steep enough for the tip to reach the brow, the band's TOP is
  // inside the head sphere and therefore invisible — which is exactly what the
  // pass-2 shot showed, a bare pink crown with hair hanging below it. Naoya's
  // file has the same two layers for the same reason; his are just both swept
  // back because his hair is short.
  //
  // PASS 4 — AND THE CROWN IS A SECOND SHELL, NOT BANDS.
  //
  // Pass 3 tried swept-back bands at tilt -62, copying Naoya's construction.
  // The shot was again bare pink on top, and the arithmetic says why: a band
  // centred at y +0.66·headR / z +0.02 with a -62 tilt runs from (y 0.87,
  // z -0.38) to (y 0.45, z +0.42), and the skull's own surface at those
  // heights is at |z| 0.49 and 0.89 respectively. EVERY POINT OF EVERY BAND WAS
  // INSIDE THE HEAD. Naoya's work because his are hung off a shell whose gap is
  // narrower and whose thetaLength is shorter; transplanting the numbers
  // without re-deriving the radius put them all in the skull.
  //
  // A CAP SHELL CANNOT HAVE THIS BUG. It is generated at a radius by
  // construction, it has no phi gap, and it covers the crown from the pole down
  // to 61 degrees — which is exactly the band the main shell's face gap leaves
  // bare. Two shells and a fringe, and the fringe is now only responsible for
  // the forehead. Cheaper in geometry than six bands, too.
  bag.add('hair', tGeo(sphereShell(headR * 1.005, {
    thetaLength: Math.PI * 0.34, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.01, headC.z - headR * 0.03] }),
    { bone: 'Head', color: HAIR });
  // one darker parting laid over the cap, so the crown is not a bald cyan dome
  bag.add('hair', tGeo(roundBox(headR * 0.11, headR * 0.09, headR * 1.30, headR * 0.02),
    { rot: [-6, 0, 0], pos: [headR * 0.10, headC.y + headR * 0.90, headC.z - headR * 0.08] }),
    { bone: 'Head', color: HAIR_DK });

  const bangs = [
    { x: 0.72, len: 0.52, w: 0.27, roll: -22, tilt: -14, y: 0.34 },
    { x: 0.48, len: 0.68, w: 0.30, roll: -12, tilt: -20, y: 0.29 },
    { x: 0.24, len: 0.56, w: 0.28, roll: -4, tilt: -16, y: 0.33 },
    { x: 0.00, len: 0.72, w: 0.29, roll: 3, tilt: -22, y: 0.28 },
    { x: -0.24, len: 0.54, w: 0.28, roll: 10, tilt: -15, y: 0.33 },
    { x: -0.48, len: 0.66, w: 0.30, roll: 17, tilt: -21, y: 0.29 },
    { x: -0.72, len: 0.50, w: 0.27, roll: 25, tilt: -13, y: 0.34 }
  ];
  for (const b of bangs) {
    band(headR * b.x, headR * b.y, headR * 0.56, headR * b.len, headR * b.w,
      b.tilt, b.roll, Math.abs(b.x) < 0.30 ? HAIR_HI : HAIR, 0.10);
  }

  // 1 THE TWO FRONT BUNS. Identity cue #1, and PASS 2 MOVED THEM. At
  // x ±0.78 / y +0.70 they sat on top of the skull like ears and were lost the
  // moment the shell grew; they now sit at ±0.86 / +0.46 — OUT to the sides at
  // temple height and forward of centre, which is where the Nezha-style buns
  // actually are and, more usefully, is the only placement that breaks the head
  // silhouette from the front, the 3/4 AND the back. They are also 15% bigger,
  // because at 0.34·headR they read as knots and at 0.39 they read as buns.
  for (const s of [1, -1]) {
    const bx = s * headR * 0.86, by = headC.y + headR * 0.46, bz = headC.z + headR * 0.20;
    bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.39, 12, 10),
      { scale: [1.0, 0.90, 0.96], pos: [bx, by, bz] }), { bone: 'Head', color: HAIR });
    // the wrap: a darker torus band round the base, facing outward
    bag.add('hair', tGeo(new THREE.TorusGeometry(headR * 0.30, headR * 0.060, 6, 14),
      { rot: [8, s * 74, 0], pos: [bx - s * headR * 0.13, by, bz] }),
      { bone: 'Head', color: HAIR_DK });
    // two escaping ends off the top of each bun
    band(bx + s * headR * 0.14, headR * 0.72, headR * 0.16, headR * 0.30, headR * 0.10,
      -34, s * 46, HAIR_HI, 0.08);
    band(bx + s * headR * 0.06, headR * 0.76, headR * 0.06, headR * 0.24, headR * 0.08,
      -22, s * 66, HAIR, 0.07);
  }

  // sides and nape shell, tight — the tail does the work behind
  for (const s of [1, -1]) {
    band(s * headR * 0.92, -headR * 0.06, -headR * 0.16, headR * 0.44, headR * 0.22, -84, s * 6);
    band(s * headR * 0.60, -headR * 0.26, -headR * 0.64, headR * 0.36, headR * 0.26, -102, s * 4, HAIR_DK);
  }
  // 2 THE TIE. One band, low at the nape — "a lone tie" — and it has to be
  // VISIBLE, because it is what makes the tail read as gathered rather than as
  // long hair.
  bag.add('hair', tGeo(new THREE.TorusGeometry(headR * 0.20, headR * 0.055, 6, 12),
    { rot: [96, 0, 0], pos: [0, headC.y - headR * 0.38, headC.z - headR * 0.86] }),
    { bone: 'Head', color: 0x2a3038 });

  // ---- GARMENTS -----------------------------------------------------------
  // 1 THE ROBE. Roomy: the body shell is wider than the torso underneath at
  // every height, which is what "roomy" has to mean geometrically.
  bag.add('cloth', tGeo(latheY([
    [0.096 * H, 0.395 * H], [0.098 * H, 0.470 * H], [0.096 * H, 0.560 * H],
    [0.094 * H, 0.660 * H], [0.092 * H, 0.745 * H], [0.084 * H, 0.800 * H]
  ], 20, 0.88), {}), { bone: 'Hips', color: ROBE });
  // the crossed front, left over right, shallow — the collar is the feature,
  // not the V
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.030 * H, 0.150 * H, 0.010 * H, 0.005),
      { rot: [4, s * -10, s * 15], pos: [s * 0.032 * H, 0.700 * H, 0.050 * H] }),
      { bone: 'Chest', color: s > 0 ? ROBE : ROBE_SH });
  }
  // THE BUNCHED COLLAR. Canon says "topped by a bunched collar", so it is
  // built as a ring of overlapping rolls rather than a clean lathe — gathered
  // fabric standing up around the throat and higher at the back.
  //
  // PASS 2 — NINE SMALL ROLLS, NOT FIVE BIG ONES. At 0.026·H radius and five
  // of them the gaps between the spheres were as wide as the spheres and the
  // whole thing rendered as a string of pearls round his neck. Gathered fabric
  // has no gaps in it: the count went up, the radius came down to 0.017·H, and
  // the ring radius came in so they OVERLAP. Two alternating values are kept so
  // the gather still reads as folds rather than as a tube.
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.5 + (i / 8) * Math.PI * 1.62;
    const r = 0.040 * H;
    const back = Math.max(0, -Math.cos(a));
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.017 * H, 8, 6), {
      scale: [1.15, 1.05, 1.3],
      pos: [Math.sin(a) * r, y.neck + 0.004 * H + back * 0.022 * H, Math.cos(a) * r * 0.92]
    }), { bone: 'Neck', color: i % 2 ? ROBE : ROBE_SH });
  }
  // shoulder yoke
  bag.add('cloth', tGeo(latheY([
    [0.090 * H, 0.790 * H], [0.086 * H, 0.826 * H]
  ], 20, 0.88), {}), { bone: 'Chest', color: ROBE_SH });
  // PASS 2 — THE HEM BAND. A robe with no hem is a sack: this is the single
  // horizontal line that tells the eye where the garment ENDS and the trousers
  // begin, and without it the whole lower two thirds of the model was one
  // unbroken white shape. Profiles ascend in y, like every latheY in the
  // project — a descending one inverts the winding and renders as backfaces.
  bag.add('cloth', tGeo(latheY([
    [0.098 * H, 0.386 * H], [0.101 * H, 0.400 * H], [0.098 * H, 0.416 * H]
  ], 20, 0.88), {}), { bone: 'Hips', color: ROBE_SH });
  // and the front seam, so the crossed opening is visible head-on rather than
  // only in the 3/4 where the two lapels overlap
  bag.add('cloth', tGeo(roundBox(0.007 * H, 0.180 * H, 0.010 * H, 0.003),
    { rot: [2, 0, 6], pos: [0.006 * H, 0.520 * H, 0.086 * H] }),
    { bone: 'Hips', color: ROBE_SH });

  // 2 SLEEVES PUSHED UP — a DEEP robe sleeve that ends at the elbow, bunched
  // at its hem, over a bandaged forearm. The bunch is what says "pushed up"
  // rather than "short-sleeved".
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    // Rotating a +Y cylinder about +Z carries its top toward -X and the arm
    // hangs along (m·sin13, -cos13), so the LEFT arm wants a POSITIVE tilt.
    const tilt = (s === 'L' ? 1 : -1);
    // the robe's own shoulder cap, replacing the builder's (see `shoulderCap`)
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.038 * H, 10, 8),
      { scale: [1, 0.92, 1], pos: [sh.x, sh.y + 0.004 * H, sh.z] }),
      { bone: 'UpArm' + s, color: ROBE });
    const upMid = sh.clone().lerp(el, 0.46);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.047 * H, 0.140 * H, 12),
      { rot: [4, 0, tilt * 13], pos: [upMid.x, upMid.y, upMid.z] }),
      { chain: armChain, color: ROBE, blend: 0.09 });
    // the bunched hem at the elbow
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.040 * H, 0.013 * H, 6, 14),
      { rot: [76, 0, tilt * 13], pos: [el.x, el.y + 0.010 * H, el.z] }),
      { chain: armChain, color: ROBE_SH, blend: 0.09 });
    // 3 BANDAGE WRAPS on the forearm: five raised rings over the bandage-
    // coloured arm tube the builder already made
    for (let i = 0; i < 5; i++) {
      const p = el.clone().lerp(wr, 0.12 + i * 0.19);
      bag.add('cloth', tGeo(new THREE.TorusGeometry(0.0225 * H, 0.0042 * H, 5, 12),
        { rot: [76 + i * 2, 0, tilt * 9], pos: [p.x, p.y, p.z] }),
        { chain: armChain, color: i % 2 ? 0xefe7d2 : 0xc2b598, blend: 0.09 });
    }
  }

  // a narrow white sash at the waist, tied off short
  bag.add('cloth', tGeo(latheY([
    [0.093 * H, 0.500 * H], [0.096 * H, 0.524 * H], [0.093 * H, 0.548 * H]
  ], 18, 0.88), {}), { bone: 'Hips', color: ROBE_SH });

  // 4 ANKLE GATHERS on the loose trousers
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s), kn = joints.get('Shin' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.028 * H, 0.036 * H, 0.032 * H, 10),
      { pos: [an.x, an.y + 0.058 * H, an.z * 0.6 + kn.z * 0.4] }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: 0xc8c8c0, blend: 0.06 });
  }

  // ---- SPRINGS ------------------------------------------------------------
  // THE TAIL is the important one. Loose and long-swinging: he is the fastest
  // sustained mover in the game and the tail is the thing that shows it. Note
  // the restDir — a spring segment's mesh points down its OWN restDir, and a
  // tail hanging back and down is (0, -1, -0.55) normalized, not -Y.
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  springs.push({
    bone: 'Head', localOffset: v3(0, -headR * 0.34, -headR * 0.86),
    restDir: v3(0, -1, -0.55).normalize(),
    stiffness: 84, damping: 0.60, gravity: 8,
    segments: [
      { len: 0.062 * H, mesh: makeFlapMesh(0.052 * H, 0.046 * H, 0.062 * H, 0.030 * H, hairMat, HAIR, oOpts) },
      { len: 0.052 * H, mesh: makeFlapMesh(0.046 * H, 0.032 * H, 0.052 * H, 0.024 * H, hairMat, HAIR, oOpts) },
      { len: 0.040 * H, mesh: makeFlapMesh(0.032 * H, 0.014 * H, 0.040 * H, 0.016 * H, hairMat, HAIR_DK, oOpts) }
    ]
  });
  // ROBE HEM PANELS. PASS 2 — hung from the HEM (y -0.116·H, level with the
  // hem band added above) instead of from -0.092·H, and pulled inboard to
  // ±0.038·H. At the first pass's offsets they started a centimetre proud of
  // the garment and a centimetre above its edge, and rendered as two floating
  // white rectangles stuck to his thighs. A cloth panel has to START where the
  // cloth ends; that is the entire fix and it is the same note the Naoya file
  // already carries about his kimono panels.
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.038 * H, -0.116 * H, 0.062 * H),
      restDir: v3(s * 0.06, -1, 0.12).normalize(),
      stiffness: 96, damping: 0.62, gravity: 8,
      segments: [
        { len: 0.070 * H, mesh: makeFlapMesh(0.048 * H, 0.046 * H, 0.070 * H, 0.009, clothMat, ROBE, oOpts) },
        { len: 0.046 * H, mesh: makeFlapMesh(0.046 * H, 0.038 * H, 0.046 * H, 0.008, clothMat, ROBE_SH, oOpts) }
      ]
    });
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.044 * H, -0.116 * H, -0.062 * H),
      restDir: v3(s * 0.06, -1, -0.12).normalize(),
      stiffness: 92, damping: 0.62, gravity: 8,
      segments: [
        { len: 0.066 * H, mesh: makeFlapMesh(0.046 * H, 0.040 * H, 0.066 * H, 0.009, clothMat, ROBE, oOpts) }
      ]
    });
  }

  // ---- THE NYOI STAFF 如意棒 ----------------------------------------------
  // On screen every frame, so it is built properly. Assembled at the origin
  // pointing +Y and attached to the right hand; the `planted` attachment is
  // what Discharge Strike and the taunt use.
  const staff = new THREE.Group();
  {
    const L = 1.72;
    const metalMat = MAT.metal({ rimColor: 0xdfe8ff });
    const add = (geo, color, mat = metalMat) => {
      const n = geo.getAttribute('position').count;
      const c = new THREE.Color(color);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mesh = new THREE.Mesh(geo, mat);
      staff.add(mesh);
      return mesh;
    };
    // the shaft, very slightly tapered toward the tip
    add(tGeo(new THREE.CylinderGeometry(0.019, 0.023, L, 10), { pos: [0, L * 0.5 - 0.42, 0] }), IRON);
    // raised iron collars every third — the segmentation that makes it read as
    // a cursed tool and not a broom handle
    for (const t of [0.16, 0.34, 0.52, 0.70]) {
      add(tGeo(new THREE.CylinderGeometry(0.030, 0.030, 0.030, 10), { pos: [0, t * L - 0.42, 0] }), IRON_HI);
      add(tGeo(new THREE.TorusGeometry(0.029, 0.006, 5, 12), { rot: [90, 0, 0], pos: [0, t * L - 0.42, 0] }), BRASS);
    }
    // THE CONDUCTOR TIP: a four-pronged open cage in brass. Arcs are spawned
    // INSIDE it by the charge rig, so it has to be open rather than solid.
    const tipY = L - 0.42;
    add(tGeo(new THREE.CylinderGeometry(0.034, 0.026, 0.070, 10), { pos: [0, tipY - 0.02, 0] }), BRASS);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      add(tGeo(roundBox(0.012, 0.155, 0.012, 0.004),
        { rot: [Math.cos(a) * 15, 0, -Math.sin(a) * 15], pos: [Math.sin(a) * 0.036, tipY + 0.084, Math.cos(a) * 0.036] }), BRASS);
    }
    // a small floating core between the prongs — the thing that lights up
    const core = add(new THREE.SphereGeometry(0.030, 10, 8), BOLT_CORE,
      new THREE.MeshBasicMaterial({ color: BOLT_CORE, transparent: true, opacity: 0.25 }));
    core.position.set(0, tipY + 0.088, 0);
    staff.userData.core = core;
    // the spiked ferrule, for planting it
    add(tGeo(new THREE.ConeGeometry(0.024, 0.115, 8), { pos: [0, -0.475, 0] }), IRON_HI);
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.010, outlineHairScale: 1.05,
    props: {
      staff: {
        node: staff,
        default: 'hand',
        attachments: {
          // PASS 2 — ROTATION FOUND BY SHOOTING CANDIDATES, NOT BY REASONING,
          // exactly as the Playful Cloud comment in toji.js warns. The first
          // pass used rot [12, 0, -8] on the assumption that the hand's local
          // +Y still points up; it does not. Under the stance pose the right
          // arm carries UpArmR -18 and LoArmR -84, so the hand's local +Y has
          // been rotated about a hundred degrees about X and points nearly
          // straight FORWARD — which meant a 1.72 m rod was aimed at the
          // camera and rendered as a 25 cm microphone. -100 brings it back
          // across the body, and the -34 roll is what makes it read as carried
          // at an angle rather than levelled like a bar.
          // FINAL VALUE AFTER FOUR SHOT ROUNDS, and the two earlier ones are
          // recorded because each was wrong in a different, instructive way:
          //   [12, 0, -8]     the rod pointed at the camera and rendered as a
          //                   25 cm microphone (the hand's local +Y is NOT up).
          //   [-100, 0, -34]  it swung up ACROSS HIS FACE and the brass cage
          //                   sat where his head should be.
          // [-8, 0, -10] only works because the STANCE changed with it: with
          // the elbow dropped to -34 the rod continues the forearm down and
          // out, so it hangs beside the silhouette instead of bisecting it.
          hand: { bone: 'HandR', pos: [0, -0.055, 0.015], rot: [-8, 0, -10] },
          // planted, butt into the floor: Discharge Strike's chamber and the
          // taunt both lean on it
          planted: { bone: 'HandR', pos: [0, -0.055, 0.015], rot: [-172, 0, -8] },
          // thrown / away — the rod is not in his hand this frame
          away: null
        }
      }
    }
  });

  // ---- THE CHARGE RIG -----------------------------------------------------
  // "The opponent should read his Charge level from across the arena without
  // looking at the HUD." Four discrete tiers, and each of them adds a visible
  // LAYER rather than turning a dial:
  //
  //   TIER 0  nothing at all. He is a boy with a stick, and he should look it.
  //   TIER 1  the conductor tip lights; the eyelid lines brighten.
  //   TIER 2  six short arcs snap between the staff, both hands and the chest;
  //           the eyes glow.
  //   TIER 3  fourteen arcs covering the whole body, a ground ring, and the
  //           whole rig flickers on a 24 Hz step rather than fading.
  //
  // Arcs are ZIG-ZAG LINE GEOMETRY that is REBUILT on a step clock, never
  // interpolated — lightning does not tween, and a smooth-moving arc reads as
  // a ribbon rather than a discharge.
  const arcs = new THREE.Group();
  arcs.renderOrder = 3;
  model.group.add(arcs);
  const ARC_MAX = 14;
  const ARC_SEG = 6;                 // 7 points, 6 segments
  const arcList = [];
  {
    // PASS 4 — RIBBONS, NOT LINES. The first version drew each arc as a
    // THREE.Line, which is correct in principle and useless in practice: WebGL
    // ignores `linewidth` on every desktop driver, so every arc rendered at
    // exactly one pixel and the tier-3 shot showed a man standing inside a
    // faint violet scribble. Electricity that the opponent is supposed to read
    // from across the arena cannot be one pixel wide.
    //
    // So each segment is TWO CROSSED QUADS — one in the model's XY plane and
    // one in ZY — which is the cheapest thing that has real width from every
    // horizontal angle without needing a billboard update per frame. 14 arcs x
    // 6 segments x 2 quads is 336 triangles, which is nothing next to the body.
    // TWO BLENDS, DELIBERATELY. The white-hot cores are ADDITIVE, because a
    // core is light. The violet arcs are NORMAL, because additive violet over a
    // white robe is just white — the first ribbon pass made every arc read as a
    // colourless glare against his own clothes, and the whole point of choosing
    // violet over Kashimo's canon blue-white was that the colour is legible.
    const matCore = new THREE.MeshBasicMaterial({
      color: BOLT_CORE, transparent: true, opacity: 0.95, depthWrite: false,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const matDim = new THREE.MeshBasicMaterial({
      color: BOLT, transparent: true, opacity: 0.88, depthWrite: false,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < ARC_MAX; i++) {
      const verts = new Float32Array(ARC_SEG * 2 * 4 * 3);
      const idx = [];
      for (let q = 0; q < ARC_SEG * 2; q++) {
        const b = q * 4;
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      geo.setIndex(idx);
      const mesh = new THREE.Mesh(geo, i % 4 === 0 ? matCore : matDim);
      mesh.frustumCulled = false;
      mesh.visible = false;
      arcs.add(mesh);
      arcList.push(mesh);
    }
  }
  // the ground ring at tier 3
  const ring = new THREE.Group();
  {
    const mat = new THREE.MeshBasicMaterial({
      color: BOLT, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide
    });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.22), mat);
      t.position.set(Math.cos(a) * 0.78, 0.03, Math.sin(a) * 0.78);
      t.rotation.set(-Math.PI / 2, 0, -a);
      ring.add(t);
    }
    ring.visible = false;
    model.group.add(ring);
  }

  // Anchors the arcs jump between, in the model's local space. Chosen so the
  // set GROWS outward with the tier: staff first, then hands and chest, then
  // the head, hips and feet.
  const anchorsFor = tier => {
    const a = [
      v3(0.30, 1.30, 0.10),      // staff tip (right hand, roughly)
      v3(0.24, 1.10, 0.06)       // right hand
    ];
    if (tier >= 2) a.push(
      v3(-0.24, 1.08, 0.04),     // left hand
      v3(0, 1.22, 0.10),         // chest
      v3(0.18, 1.42, 0.02)
    );
    if (tier >= 3) a.push(
      v3(0, 1.60, 0.06),         // head
      v3(0, 0.92, 0),            // hips
      v3(0.16, 0.16, 0.04),      // right foot
      v3(-0.16, 0.16, 0.04)      // left foot
    );
    return a;
  };

  // THE FACE GLOW. Parented to the HEAD BONE (not to model.group) so it tracks
  // every turn of the head — an eye glow that stayed put while he looked away
  // would be worse than none. The bone's local space is offset from the space
  // the bag geometry was authored in, so the group is shifted by
  // (headCentre - head joint) once, here, rather than being guessed per quad.
  const faceGlow = new THREE.Group();
  {
    const hj = joints.get('Head');
    faceGlow.position.set(headC.x - hj.x, headC.y - hj.y, headC.z - hj.z);
    const mat = new THREE.MeshBasicMaterial({
      color: BOLT_CORE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
    });
    const fz = headR * 0.615 + headR * 0.045;
    for (const s of [1, -1]) {
      const ex = s * headR * 0.40;
      // over the iris
      const e = new THREE.Mesh(new THREE.PlaneGeometry(headR * 0.34, headR * 0.24), mat);
      e.position.set(ex, -headR * 0.10, fz);
      faceGlow.add(e);
      // over the three lightning segments under the lid
      for (const [dx, dy, rot] of [[0.05, -0.20, 34], [0.14, -0.32, -30], [0.21, -0.44, 26]]) {
        const q = new THREE.Mesh(new THREE.PlaneGeometry(headR * 0.075, headR * 0.22), mat);
        q.position.set(ex + s * headR * dx, -headR * 0.10 + headR * dy, fz);
        q.rotation.z = s * rot * Math.PI / 180;
        faceGlow.add(q);
      }
    }
    faceGlow.userData.mat = mat;
    model.getBone('Head')?.add(faceGlow);
  }

  let tier = 0, frac = 0, stepT = 0;
  model.setCharge = (t, f = 0) => {
    tier = Math.max(0, Math.min(3, t | 0));
    frac = f;
    faceGlow.userData.mat.opacity = [0, 0.28, 0.62, 0.95][tier];
  };
  model.chargeTier = () => tier;

  const tipCore = staff.userData.core;
  const rebuildArcs = () => {
    const count = tier <= 0 ? 0 : tier === 1 ? 2 : tier === 2 ? 6 : ARC_MAX;
    const anchors = anchorsFor(tier);
    for (let i = 0; i < ARC_MAX; i++) {
      const line = arcList[i];
      if (i >= count) { line.visible = false; continue; }
      line.visible = true;
      const a = anchors[(Math.random() * anchors.length) | 0];
      const b = anchors[(Math.random() * anchors.length) | 0];
      // an arc from a point to a point, jittered — if the two anchors are the
      // same it becomes a short spit off that anchor, which is also correct
      const to = a === b
        ? a.clone().add(v3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5))
        : b;
      // the zig-zag spine
      const pts = [];
      for (let k = 0; k <= ARC_SEG; k++) {
        const u = k / ARC_SEG;
        const j = (k === 0 || k === ARC_SEG) ? 0 : 1;
        pts.push(v3(
          a.x + (to.x - a.x) * u + (Math.random() - 0.5) * 0.20 * j,
          a.y + (to.y - a.y) * u + (Math.random() - 0.5) * 0.20 * j,
          a.z + (to.z - a.z) * u + (Math.random() - 0.5) * 0.14 * j));
      }
      // ...expanded into two crossed quads per segment
      const w = tier >= 3 ? 0.030 : 0.022;
      const pos = line.geometry.getAttribute('position');
      let vi = 0;
      const put = (p, sx, sy, sz) => {
        pos.setXYZ(vi++, p.x + sx, p.y + sy, p.z + sz);
      };
      for (let k = 0; k < ARC_SEG; k++) {
        const p0 = pts[k], p1 = pts[k + 1];
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
        // side vector for the XY-facing quad: perpendicular to the segment in
        // the XY plane. Degenerate segments fall back to +X, which cannot
        // happen with the jitter above but costs one branch to be certain.
        let ax = -dy, ay = dx, al = Math.hypot(ax, ay);
        if (al < 1e-5) { ax = 1; ay = 0; al = 1; }
        ax = ax / al * w; ay = ay / al * w;
        put(p0, ax, ay, 0); put(p1, ax, ay, 0); put(p1, -ax, -ay, 0); put(p0, -ax, -ay, 0);
        // ...and for the ZY-facing one
        let bz = -dy, by = dz, bl = Math.hypot(bz, by);
        if (bl < 1e-5) { bz = 1; by = 0; bl = 1; }
        bz = bz / bl * w; by = by / bl * w;
        put(p0, 0, by, bz); put(p1, 0, by, bz); put(p1, 0, -by, -bz); put(p0, 0, -by, -bz);
      }
      pos.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    }
    ring.visible = tier >= 3;
    // the conductor core and the eye marks step with the tier
    const lit = [0.12, 0.45, 0.75, 1.0][tier];
    if (tipCore) {
      tipCore.material.opacity = 0.12 + lit * 0.8;
      const s = 0.7 + lit * 0.9;
      tipCore.scale.setScalar(s);
    }
  };
  rebuildArcs();

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (tier <= 0) {
      if (arcList[0].visible) rebuildArcs();
      return;
    }
    // 24 Hz for tiers 1-2, 30 Hz at tier 3 — the top tier visibly crackles
    // faster, which is a second, cheaper read on top of the count.
    stepT += dt;
    const rate = tier >= 3 ? 1 / 30 : 1 / 24;
    if (stepT >= rate) { stepT = 0; rebuildArcs(); }
    if (ring.visible) {
      ring.rotation.y += dt * 1.4;
      // inside the top tier the ring still reports how deep in it he is, so a
      // Kashimo who has just crossed 85% and one sitting at 100% are not the
      // same picture
      ring.children[0].material.opacity = 0.35 + frac * 0.45;
    }
  };

  // Used by the effect dispatcher when the rod is thrown and recalled.
  model.setStaff = key => model.attachProp('staff', key);

  return model;
}
