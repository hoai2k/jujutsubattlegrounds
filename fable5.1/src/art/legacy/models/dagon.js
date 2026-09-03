// ===========================================================================
// DAGON 陀艮 — REFERENCE SHEET
// ===========================================================================
// SOURCE OF THE REFERENCE. Built from the OFFICIAL CHARACTER SHEET supplied
// with the brief — a full-body front view of his MATURE form, line-art with
// flats. That image is the authority for everything below. Written detail
// (the domain's name and reading, the shikigami, the evolution from cursed
// womb) cross-checked against the Jujutsu Kaisen Wiki's Dagon and Horizon of
// the Captivating Skandha entries by search-result extraction — the fandom
// host answers 402 to WebFetch from this environment, the caveat
// models/miwa.js already records. ONLY A FRONT VIEW WAS AVAILABLE: the back,
// the profile of the skull and the shape of the flank fins are EXTRAPOLATED
// and are listed again in the APPROXIMATED block at the bottom.
//
// ---------------------------------------------------------------------------
// THE CORRECTION TO THE BRIEF, UP FRONT — AND IT IS THE WHOLE PALETTE
// ---------------------------------------------------------------------------
// The brief specifies "pale sea greens and greys, sickly and bloodless". THE
// REFERENCE IS NOT THAT AT ALL. He is:
//     DEEP CRIMSON RED   on every dorsal / outer surface — skull, mantle,
//                        shoulders, the outside of both arms, the fronts of
//                        both thighs and shins, the tops of both feet
//     WARM TAN-BEIGE     on every ventral / inner surface — the belly and its
//                        heavy fold structure, the insides of the arms, the
//                        inner thighs, the soles
//     HARD BLACK         a single long shield plate running from the sternum
//                        down the centre of the abdomen and between the legs
// with PALE PINK-RED barbels and near-black flank fins. That is a red-and-tan
// creature, not a grey-green one, and the difference is not a shade — it is
// the entire silhouette read at distance. He is built to the sheet. This note
// exists so the departure from the brief is deliberate and visible.
//
// The brief IS right about the surface treatment, and that survives the
// palette change intact: he is WET. See the material note below.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// H = 2.30, and he is HUNCHED, so his standing eye-line is lower than the
// number suggests while his shoulder mass is the widest in the game.
//     Hanami 2.15 · Kurourushi 2.25 · >>> DAGON 2.30 <<< · Mahoraga 3.6
// so he is the third-largest body in the project and the largest that is not a
// summon. He sits in `bodyClass` 'large' (the 2.06-2.60 band), which means the
// finisher system performs the HUMAN move set on him, scaled — correct, since
// his proportions are a person's, exaggerated, rather than Mahoraga's.
//   shoulder 0.158  the widest on the roster (Todo 0.132, Panda 0.140)
//   bulk     1.52   heaviest torso in the game
//   muscle   1.95   arm mass; the forearms on the sheet are thicker than the
//                   upper arms, which is unusual and is authored explicitly
//   legBulk  1.40
//   hip      0.062
// PROPORTION NOTE FROM THE SHEET: his arms are LONG. The hands hang level with
// the middle of the thigh, not with the hip. That plus the hunch is most of
// what makes him read as not-a-person from the far side of the arena.
//
// ---------------------------------------------------------------------------
// THE HEAD, FROM EVERY ANGLE
// ---------------------------------------------------------------------------
// FRONT  a smooth, elongated, mask-like skull with no nose and no visible
//        mouth. A hard brow ridge runs across it. The eyes are NARROW DARK
//        HORIZONTAL SLITS set wide apart and low-lidded — there is no sclera,
//        no iris and no pupil, which is why this model asks `addFace` for
//        `noEyes` and authors them itself.
//        A DARK CAP sits over the crown: a small textured scute, near-black,
//        speckled, running from the brow back over the top of the skull.
// 3/4    the skull tapers backward and the mantle rises behind it, so from
//        three-quarters the head reads as sunk INTO the shoulders rather than
//        sitting on a neck. There is no neck. (EXTRAPOLATED.)
// SIDE   long snout-to-occiput axis, roughly 1.5x as deep as it is wide.
//        (EXTRAPOLATED.)
// BACK   the mantle closes over where a neck would be. (EXTRAPOLATED.)
// THE BARBELS — the single most recognisable feature. A hanging cluster of
//        thick pale pink-red tentacles from the underside of the jaw, roughly
//        ten of them, the longest reaching the middle of the chest. They are
//        NOT a beard shape: they are separate, round-sectioned, and they taper
//        to blunt tips. Every one of them is a SPRING CHAIN here, because a
//        rigid cluster on a slow drifting body is the single most obvious way
//        this model could look dead.
//
// ---------------------------------------------------------------------------
// THE BODY
// ---------------------------------------------------------------------------
// MANTLE   a cowl of red muscle flaring from the skull over both shoulders,
//          like a hood that is part of him. It is what removes the neck.
// SHOULDERS enormous, rolled FORWARD, each capped with its own mass.
// ARMS     red outside, tan inside, forearms heavier than the upper arms,
//          hanging long. Heavy wrinkle/fold lines are drawn all over them on
//          the sheet — modelled here as a few raised ridges rather than as
//          surface detail, which is what the poly budget can carry.
// BELLY    tan, and DEEPLY FOLDED: three heavy horizontal creases across the
//          abdomen and a soft overhang at the bottom. This is the only part of
//          him that reads as soft and it is what makes the rest read as armour.
// PLATE    a single black shield running sternum-to-crotch, narrow at the top,
//          widest across the stomach, tapering to a point between the legs.
// FINS     two small dark membranous flank fins, one at each side toward the
//          back, ribbed and bat-like. They are SMALL — they are not wings and
//          he does not fly. (Shape EXTRAPOLATED; only their silhouette from
//          the front is visible on the sheet.)
// HANDS    three thick digits and a thumb, with one heavy dark CLAW on the
//          outer digit of each hand.
// FEET     broad, flat, webbed, THREE toes, red on top and tan underneath.
//
// ---------------------------------------------------------------------------
// MATERIAL — THE THING THAT HAD TO BE DIFFERENT
// ---------------------------------------------------------------------------
// The brief asks for wet, translucent, slightly iridescent, and genuinely
// distinct from Kurourushi's chitin, Hanami's bark and Jogo's stone. The skin
// material is overridden here rather than in shaders/toon.js so nobody else's
// surface moves:
//     gloss 0.72     a real specular lift — chitin is 0.0, stone is 0.0
//     rim   0.60 starting at 0.50 — a WIDE wet rim that wraps most of the way
//           round the silhouette, in a cold blue-white (#bfe8ff), which is
//           what "just pulled out of the water" actually looks like: the sky
//           reflected off a film of water over a warm-coloured body
//     steps [58, 132, 255] — a harder terminator than skin's [96,176,255], so
//           the wet highlight has an edge instead of a gradient
// Nothing else in the project uses that combination.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   red     #b8323a   redDk  #8b2530   redLt  #cf4a4e
//   tan     #d9c3a4   tanDk  #b9a184
//   plate   #17181c   fin    #46161d   finRib #2a0f14
//   barbel  #e08a92   barbelDk #c4707a
//   cap     #2a1a1c   eye    #14100f
//   rim     #bfe8ff   outline #0a0b10   accent #b8323a
// The accent is his own red. It is close to Sukuna's #ff2f45 and Choso's
// #c4142c in hue and DELIBERATELY much darker and browner than either — the
// select screen is where the three reds sit near each other, and the
// separation available is value, not hue.
//
// ---------------------------------------------------------------------------
// THE EARLIER FORM, AND THE RECOMMENDATION THE BRIEF ASKS FOR
// ---------------------------------------------------------------------------
// He has two forms: the CURSED WOMB (a small, pale, foetal thing with no arms
// that Naobito and company find in Shibuya) and this mature form. The brief
// asks whether the earlier one is distinct enough to propose as a variant.
//   IT IS DISTINCT — completely, structurally, differently sized — AND I
//   RECOMMEND AGAINST IT, as a GAMEPLAY variant. The womb form cannot throw a
//   punch, cannot walk, and has no arms to build a 3-hit tentacle string on;
//   shipping it as a playable variant would mean authoring a second complete
//   kit for a body whose canon behaviour is "does not fight". As a COSMETIC
//   variant it is worse still, because a cosmetic variant shares the gameplay
//   config and the womb visibly cannot perform it.
//   THE RECOMMENDATION: leave it out of the variant system, and use it where
//   it actually belongs — as the opening beat of his DOMAIN CAST, which is
//   exactly the beat it has in the source. Not built in this pass; noted here
//   so the decision is on the record rather than silently skipped.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the hanging barbel cluster under the jaw
//   2. red outside / tan inside, split down every limb
//   3. the black shield plate down the centre of the body
//   4. the mantle, and the total absence of a neck
//   5. the narrow dark eye slits with no eyes in them
//   6. long arms, hunched shoulders, three webbed toes
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the entire back, the profile of the skull and the shape of the flank
//     fins. One front view was available.
//   · the wrinkle/fold detail covering his arms and belly on the sheet is
//     reduced to a handful of modelled ridges; at this budget real folds band
//     into noise.
//   · the exact barbel count (ten here) and their taper.
//   · the hands are the shared mitt, widened, with a claw added. The sheet
//     draws real digits.
//   · the cursed womb form is NOT built — see the recommendation above.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import {
  latheY, tGeo, roundBox, sphereShell, tubeBetween, coneSpike, mergeGeos, shapeExtrude
} from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const RED = 0xb8323a;
const RED_DK = 0x8b2530;
const RED_LT = 0xcf4a4e;
const TAN = 0xd9c3a4;
const TAN_DK = 0xb9a184;
const PLATE = 0x17181c;
const FIN = 0x46161d;
const FIN_RIB = 0x2a0f14;
// PASS 5: #e08a92 under a 0.60 wet rim came out near-white and the cluster
// read as a bundle of bone. Both tones pulled down and warmed.
const BARBEL = 0xc4707a;
const BARBEL_DK = 0x9e5460;
const CAP = 0x2a1a1c;
const EYE = 0x14100f;

// THE WET SURFACE. Declared once, used by the model's own skin material and by
// the barbels, so the whole creature shades as one substance.
export const WET_SKIN = () => MAT.skin({
  steps: [58, 132, 255], gloss: 0.72, rim: 0.60, rimStart: 0.50,
  rimColor: 0xbfe8ff, warm: 0x2a1216, cool: 0x0c1826
});

// One barbel: a round-sectioned tentacle tapering to a blunt tip, built along
// -Y so it can hang off a spring pivot.
// PASS 4: this used to stack five separate one-segment tubes, each of which
// SEALS ITS OWN ENDS — so every barbel rendered as a ribbed stack of little
// cones with a hard dark ring at each join, and the cluster read as a bundle
// of drinking straws. One tube with real height segments, plus a tip cap.
function barbelMesh(len, r0, r1, mat, color) {
  const parts = [
    tubeBetween(v3(0, 0, 0), v3(0, -len, 0), [r0, r1], { radial: 9, hSeg: 6, bulge: 0.10 }),
    tGeo(new THREE.SphereGeometry(r1, 8, 6), { pos: [0, -len, 0] })
  ];
  const geo = mergeGeos(parts);
  const n = geo.getAttribute('position').count;
  const c = new THREE.Color(color);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(geo, mat));
  return grp;
}

// Broad webbed three-toed foot, red on top and tan on the sole.
function webbedFoot(H, ankle, bag, side) {
  const len = 0.150 * H, wid = 0.088 * H, hgt = 0.038 * H;
  const sole = tGeo(roundBox(wid, hgt, len, 0.012 * H, 2), { pos: [0, -0.004 * H, len * 0.10] });
  bag.add('skin', tGeo(sole, { pos: [ankle.x, ankle.y - 0.008 * H, ankle.z] }),
    { bone: 'Foot' + side, color: RED });
  // three toes, splayed, each a flattened lobe; the webbing between them is a
  // low wedge that fills the gap rather than a separate membrane
  for (let i = -1; i <= 1; i++) {
    const toe = mergeGeos([
      tGeo(new THREE.SphereGeometry(0.026 * H, 8, 6), { scale: [1, 0.52, 1.9], pos: [0, 0, 0] })
    ]);
    bag.add('skin', tGeo(toe, {
      rot: [0, i * 17, 0],
      pos: [ankle.x + i * 0.032 * H, ankle.y - 0.012 * H, ankle.z + len * 0.56]
    }), { bone: 'Foot' + side, color: RED });
  }
  // webbing: one low flat wedge spanning the toe fan
  bag.add('skin', tGeo(roundBox(wid * 1.10, 0.010 * H, len * 0.42, 0.006 * H, 1), {
    pos: [ankle.x, ankle.y - 0.016 * H, ankle.z + len * 0.44]
  }), { bone: 'Foot' + side, color: RED_DK });
  // the sole, tan
  bag.add('skin', tGeo(roundBox(wid * 0.88, 0.008 * H, len * 0.92, 0.006 * H, 1), {
    pos: [ankle.x, ankle.y - 0.026 * H, ankle.z + len * 0.10]
  }), { bone: 'Foot' + side, color: TAN });
}

export function buildDagon() {
  const spec = {
    id: 'dagon', name: 'Dagon', H: 2.30, headScale: 1.16,
    shoulder: 0.158, hip: 0.062, muscle: 1.95, bulk: 1.52, legBulk: 1.40,
    skinTone: RED,
    // ALL FLESH. Nothing on him is fabric.
    bodySlot: 'skin', armSlot: 'skin', foreArmSlot: 'skin', legSlot: 'skin',
    clothColor: RED, sleeveColor: RED, foreSleeveColor: RED, handColor: RED,
    pantColor: RED,
    shoe: false,                     // webbed feet, built below
    // the builder's own deltoid cap is switched off — two authored lobes per
    // shoulder replace it below, and stacking all three made a beach ball
    shoulderCap: false,
    // NO EARS on the reference — the skull is smooth.
    ears: false,
    torsoShape: { chest: 1.10, waist: 1.06, hip: 1.02 },
    face: { jaw: 1.14, chin: 0.86, width: 1.02, faceFlat: 0.30 },
    palette: {
      rim: 0xbfe8ff, outline: 0x0a0b10,
      accent: RED, energy: 0x7fd8c8, metalRim: 0xbfe8ff
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;

  // NO EYES from the shared face builder, and no nose or mouth either: this
  // skull has none of the three. `addFace` is called with everything switched
  // off rather than skipped, so if the builder ever grows a feature every
  // model gets, this one is still on the list.
  addFace(ctx, { noEyes: true, mouthW: 0.001, mouthColor: RED, mouthTilt: 0 });

  // Set AFTER the snout below, from its real front surface — see the note
  // there. Declared with `let` because the snout has to be built first.
  let faceZ = headC.z + headR * 0.560;

  // =========================================================================
  // THE SKULL
  // =========================================================================
  // The shared anime head is a sphere with a flattened face; his is longer
  // front-to-back and flatter on top, so a second lathe is laid over it to
  // pull the snout forward and the occiput back. It carries the same colour,
  // so the two read as one form.
  // PASS 4: at a z-scale of 1.42 this reached 1.33 head-radii forward of the
  // head centre, while `faceZ` — where every flat feature is placed — is only
  // 0.56 forward. The snout therefore covered the eye slits completely and he
  // rendered as a featureless red ball. The skull is shorter now, and `faceZ`
  // below is derived FROM its actual front rather than from the shared head's,
  // so the two can never disagree again.
  const SNOUT_Z = 1.16;
  bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.94, 16, 12), {
    scale: [0.94, 0.82, SNOUT_Z], pos: [headC.x, headC.y - headR * 0.06, headC.z + headR * 0.06]
  }), { bone: 'Head', color: RED });

  // The front of the snout, less a hair, so every flat feature sits ON the
  // surface rather than inside it.
  faceZ = headC.z + headR * (0.06 + 0.94 * SNOUT_Z) - headR * 0.10;

  // THE BROW RIDGE — a hard bar across the skull above the eye slits. It is
  // the only sharp edge on the head and it is what stops the face reading as
  // a smooth egg.
  // PASS 5: 1.30 head-radii wide and 0.30 deep put a slab across the face
  // wider than the skull, sticking out over the eye slits like a visor. It is
  // a RIDGE — it should read as a raised brow line, not as headgear.
  bag.add('skin', tGeo(roundBox(headR * 1.04, headR * 0.10, headR * 0.16, headR * 0.04, 2), {
    rot: [-14, 0, 0], pos: [0, headC.y + headR * 0.20, faceZ - headR * 0.16]
  }), { bone: 'Head', color: RED_LT });

  // THE EYE SLITS. Narrow, dark, horizontal, set WIDE and low-lidded. Two
  // flats each: the slit itself, and a slightly larger recess behind it so the
  // slit sits in a socket rather than being painted on.
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.46, headR * 0.10, 0.004, 0.002), {
      rot: [0, s * -12, s * 7],
      pos: [s * headR * 0.44, headC.y - headR * 0.02, faceZ + headR * 0.02]
    }), { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(roundBox(headR * 0.56, headR * 0.19, 0.004, 0.002), {
      rot: [0, s * -12, s * 7],
      pos: [s * headR * 0.44, headC.y - headR * 0.02, faceZ + headR * 0.008]
    }), { bone: 'Head', color: RED_DK });
  }

  // THE DARK CAP. A speckled near-black scute over the crown, running from the
  // brow back over the top. The speckling is six small raised nubs — on the
  // sheet it is a dotted texture, and dots at this scale have to be geometry
  // or they vanish.
  bag.add('skin', tGeo(sphereShell(headR * 0.90, { thetaLength: Math.PI * 0.40, seg: 16, rings: 8 }), {
    scale: [1.00, 0.90, SNOUT_Z * 0.94], pos: [0, headC.y + headR * 0.16, headC.z + headR * 0.06]
  }), { bone: 'Head', color: CAP });
  for (let i = 0; i < 8; i++) {
    const col = (i % 2) - 0.5, row = Math.floor(i / 2);
    bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.055, 6, 5), {
      pos: [col * headR * 0.34, headC.y + headR * (0.76 - row * 0.05),
      headC.z + headR * (0.40 - row * 0.30)]
    }), { bone: 'Head', color: 0x120b0c });
  }

  // =========================================================================
  // THE MANTLE — the cowl of muscle that removes his neck
  // =========================================================================
  // PASS 4: the mantle used to start 3 cm BELOW the neck joint and the skull
  // sits above it, so there was a visible gap and the head appeared to float.
  // It starts ABOVE the neck joint now and closes onto the base of the skull —
  // which is the whole job of this piece, since he has no neck to hide.
  // *** PROFILE ORDER MATTERS. *** `latheY` takes its profile BOTTOM TO TOP
  // and winds the surface from it; handed a descending profile it builds the
  // lathe inside out, and an inside-out cowl renders as a black hole across
  // the whole chest — which is exactly what pass 4 looked like. Written
  // ascending here, and it is the reason this comment exists.
  bag.add('skin', tGeo(latheY([
    [0.134 * H, y.neck - 0.180 * H],
    [0.144 * H, y.neck - 0.150 * H],
    [0.134 * H, y.neck - 0.104 * H],
    [0.108 * H, y.neck - 0.048 * H],
    [0.078 * H, y.neck + 0.004 * H],
    [0.056 * H, y.neck + 0.036 * H]
  ], 20, 0.92), { pos: [0, 0, -0.006 * H] }), { chain: torsoChain, color: RED, blend: 0.06 });
  // The mantle rises BEHIND the skull as well, closing the back of the head
  // in. PASS 2: at 0.086*H sitting at y.neck + 0.010 this was a sphere the
  // size of his head parked directly on top of his head — from the front the
  // skull disappeared into it entirely and he read as a red ball on a red
  // body. It is smaller, lower, and pushed BACK, so it closes the nape and
  // leaves the face clear.
  bag.add('skin', tGeo(new THREE.SphereGeometry(0.062 * H, 12, 9), {
    scale: [1.20, 0.72, 0.86], pos: [0, y.neck - 0.026 * H, -0.062 * H]
  }), { chain: torsoChain, color: RED_DK, blend: 0.05 });

  // =========================================================================
  // THE BARBELS — ten spring chains under the jaw
  // =========================================================================
  const wetMat = WET_SKIN();
  const springs = [];
  // Laid out in two arcs under the jaw: an inner row of four longer ones and
  // an outer row of six shorter ones, so the cluster has depth from the side
  // rather than being a single curtain.
  //
  // PASS 3 — FORWARD AND LONGER. Pass 2's cluster was invisible in every one
  // of the four views, and the reason was geometric rather than aesthetic:
  // the anchors sat at z ~0.10 m and the mantle's own lathe reaches 0.27 m
  // forward, so the whole cluster hung INSIDE his chest. They are pushed out
  // to the front of the jaw, and roughly doubled in length — the reference has
  // the longest of them reaching the middle of the chest, which is about
  // 0.5 m on this body, not the 0.3 m pass 2 had.
  const BARBELS = [
    { x: -0.18, z: 1.05, len: [1.55, 1.15], r: 0.085 },
    { x: -0.06, z: 1.15, len: [1.75, 1.30], r: 0.095 },
    { x: 0.06, z: 1.15, len: [1.75, 1.30], r: 0.095 },
    { x: 0.18, z: 1.05, len: [1.55, 1.15], r: 0.085 },
    { x: -0.34, z: 0.86, len: [1.25, 0.92], r: 0.072 },
    { x: 0.34, z: 0.86, len: [1.25, 0.92], r: 0.072 },
    { x: -0.28, z: 0.62, len: [1.05, 0.78], r: 0.066 },
    { x: 0.28, z: 0.62, len: [1.05, 0.78], r: 0.066 },
    { x: -0.10, z: 0.70, len: [1.40, 1.02], r: 0.078 },
    { x: 0.10, z: 0.70, len: [1.40, 1.02], r: 0.078 }
  ];
  // *** BONE-LOCAL, NOT WORLD. *** See the identical note in models/uro.js:
  // `bag.add` takes world coordinates and a SpringChain takes bone-local ones,
  // and mixing them up hangs the whole barbel cluster two metres above his
  // head. `headJ` is the Head bone's world position and every anchor is an
  // offset from it.
  const headJ = joints.get('Head');
  for (const b of BARBELS) {
    const l0 = headR * b.len[0], l1 = headR * b.len[1];
    // PASS 4 — THICKNESS. At `b.r` the widest barbel was 1.8 cm across on a
    // 2.3 m body: they rendered as pale threads, and the reference draws them
    // as thick round-sectioned tentacles. Multiplied by 2.2, and the taper
    // pulled in so they still come to a blunt point rather than a stump.
    const rk = 2.2;
    const r0 = headR * b.r * rk, r1 = headR * b.r * rk * 0.78, r2 = headR * b.r * rk * 0.42;
    springs.push({
      bone: 'Head',
      localOffset: v3(headR * b.x * 1.3, headC.y - headR * 0.72, headC.z + headR * b.z * 1.1)
        .sub(headJ),
      // PASS 5: at 0.35 the whole cluster hung dead straight and parallel and
      // read as one solid mass. Fanned out to 1.15, so ten separate tentacles
      // are legible instead of a cone.
      restDir: v3(b.x * 1.15, -1, 0.16 + b.z * 0.28).normalize(),
      segments: [
        { len: l0, mesh: barbelMesh(l0, r0, r1, wetMat, BARBEL) },
        { len: l1, mesh: barbelMesh(l1, r1, r2, wetMat, BARBEL_DK) }
      ],
      // HEAVY AND SLOW. The loosest chains in the project: 22 stiffness
      // against Miwa's hair at 54, damping 0.90, and full gravity. They should
      // swing like wet rope on a body that is barely bearing its own weight —
      // this is the single biggest contributor to "drifting, buoyant" and it
      // costs no animation at all.
      stiffness: 22, damping: 0.90, gravity: 9.5
    });
  }

  // =========================================================================
  // THE TORSO — tan belly, folds, and the black plate
  // =========================================================================
  // The tan ventral mass, laid over the front of the torso lathe. Built as a
  // half-lathe pushed forward so it bulges, which is what gives the overhang.
  // PASS 2: this was BURIED. The torso lathe under it runs to 0.116*H radius
  // at a zScale of 0.74 — 0.086*H of depth — and the tan mass was authored at
  // 0.118*H radius x 0.62 zScale = 0.073*H, so it sat entirely INSIDE the red
  // body and the only tan visible from the front was a patch at the crotch.
  // Wider, deeper, and pushed further forward.
  bag.add('skin', tGeo(latheY([
    [0.076 * H, 0.466 * H], [0.114 * H, 0.508 * H], [0.128 * H, 0.560 * H],
    [0.130 * H, 0.612 * H], [0.122 * H, 0.664 * H], [0.106 * H, 0.710 * H],
    [0.080 * H, 0.748 * H]
  ], 20, 0.78), { pos: [0, 0, 0.030 * H] }), { chain: torsoChain, color: TAN, blend: 0.06 });

  // THREE HEAVY BELLY FOLDS. Flattened torus sections across the front, each a
  // little wider than the one above it.
  for (let i = 0; i < 3; i++) {
    const yy = 0.680 * H - i * 0.058 * H;
    const r = (0.098 + i * 0.008) * H;
    bag.add('skin', tGeo(new THREE.TorusGeometry(r, 0.0125 * H, 6, 18, Math.PI * 1.15), {
      rot: [0, 0, 180 - 33], pos: [0, yy, 0.044 * H], scale: [1, 1, 0.70]
    }), { chain: torsoChain, color: TAN_DK, blend: 0.05 });
  }
  // the overhang at the bottom of the belly
  bag.add('skin', tGeo(new THREE.SphereGeometry(0.086 * H, 14, 10), {
    scale: [1.18, 0.62, 0.72], pos: [0, 0.492 * H, 0.040 * H]
  }), { chain: torsoChain, color: TAN, blend: 0.05 });

  // THE BLACK PLATE. Narrow at the sternum, widest across the stomach, tapering
  // to a point between the legs. Built as an extruded profile so the silhouette
  // is authored rather than approximated by stacked boxes.
  // PASS 3: the belly lathe grew forward to 0.13*H and swallowed the bottom
  // two thirds of the plate, so from the front it read as a black BAND across
  // the chest rather than a shield down the body — the exact opposite of the
  // reference. It is narrower (0.042 against 0.050 at the widest) and sits
  // proud of the new belly surface.
  bag.add('skin', tGeo(shapeExtrude([
    [0.000, 0.000],
    [0.030 * H, -0.040 * H],
    [0.042 * H, -0.120 * H],
    [0.034 * H, -0.206 * H],
    [0.012 * H, -0.272 * H],
    [-0.012 * H, -0.272 * H],
    [-0.034 * H, -0.206 * H],
    [-0.042 * H, -0.120 * H],
    [-0.030 * H, -0.040 * H]
  ], 0.030 * H), { pos: [0, 0.752 * H, 0.132 * H] }),
    { chain: torsoChain, color: PLATE, blend: 0.04 });

  // =========================================================================
  // THE ARMS — tan on the inside, extra forearm mass, ridges
  // =========================================================================
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    // SHOULDER MASS, rolled forward. Two overlapping lobes rather than the
    // builder's single cap, which is switched off for him.
    // PASS 2: 0.062*H spheres either side of a 0.158 shoulder made two beach
    // balls that swallowed the head between them. They are 0.048/0.036 now and
    // pulled INBOARD and DOWN, so the deltoid mass overlaps the chest instead
    // of standing beside it — the same note the builder's own comment makes
    // about socket placement, applied to the authored version.
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.048 * H, 12, 9), {
      scale: [1.02, 1.06, 1.14], pos: [sh.x - m * 0.008 * H, sh.y + 0.004 * H, sh.z + 0.014 * H]
    }), { bone: 'UpArm' + s, color: RED });
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.036 * H, 10, 8), {
      scale: [1.0, 0.92, 1.06], pos: [sh.x + m * 0.006 * H, sh.y - 0.034 * H, sh.z + 0.022 * H]
    }), { bone: 'UpArm' + s, color: RED_LT });
    // FOREARM HEAVIER THAN THE UPPER ARM — the unusual proportion on the sheet.
    const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.020 * H);
    bag.add('skin', tubeBetween(el, wrExt, [0.058 * H, 0.044 * H], { bulge: 0.22, hSeg: 6 }),
      { chain: armChain, color: RED, blend: 0.09 });
    // the tan inner face of both segments: a narrower tube offset inboard
    const inb = v3(-m * 0.020 * H, 0, 0.010 * H);
    bag.add('skin', tubeBetween(sh.clone().add(inb), el.clone().add(inb), [0.030 * H, 0.026 * H], { hSeg: 4 }),
      { chain: armChain, color: TAN, blend: 0.09 });
    bag.add('skin', tubeBetween(el.clone().add(inb), wrExt.clone().add(inb), [0.028 * H, 0.022 * H], { hSeg: 4 }),
      { chain: armChain, color: TAN, blend: 0.09 });
    // three raised ridges down the outside of the forearm, standing in for the
    // sheet's dense wrinkle hatching
    for (let i = 0; i < 3; i++) {
      const k = 0.30 + i * 0.22;
      const p = el.clone().lerp(wrExt, k);
      bag.add('skin', tGeo(new THREE.TorusGeometry(0.050 * H, 0.0060 * H, 5, 12, Math.PI * 1.1), {
        rot: [90, 0, 200], pos: [p.x + m * 0.006 * H, p.y, p.z]
      }), { chain: armChain, color: RED_DK, blend: 0.06 });
    }
    // THE CLAW — one heavy dark hook on the outer digit.
    bag.add('skin', tGeo(coneSpike(0.014 * H, 0.062 * H, v3(0, 0, 0.030 * H), { radial: 6 }), {
      rot: [148, 0, 0], pos: [wr.x + m * 0.028 * H, wr.y - 0.062 * H, wr.z + 0.012 * H]
    }), { bone: 'Hand' + s, color: 0x1b1a1e });
  }

  // =========================================================================
  // THE LEGS — tan inner faces
  // =========================================================================
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const legChain = [
      { bone: 'Thigh' + s, point: hp }, { bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }
    ];
    const inb = v3(-m * 0.028 * H, 0, 0.006 * H);
    bag.add('skin', tubeBetween(hp.clone().add(inb).add(v3(0, 0.02 * H, 0)), kn.clone().add(inb),
      [0.044 * H, 0.030 * H], { hSeg: 4 }), { chain: legChain, color: TAN, blend: 0.08 });
    bag.add('skin', tubeBetween(kn.clone().add(inb), an.clone().add(inb),
      [0.030 * H, 0.022 * H], { hSeg: 4 }), { chain: legChain, color: TAN, blend: 0.08 });
    webbedFoot(H, an, bag, s);
  }

  // =========================================================================
  // THE FLANK FINS
  // =========================================================================
  // Small, dark, membranous, ribbed, set toward the back at the bottom of the
  // ribcage. They are NOT wings — they read as fins on a body that spends its
  // life in water, and they should never be big enough to suggest flight.
  for (const s of [1, -1]) {
    const fin = shapeExtrude([
      [0, 0],
      [s * 0.052 * H, -0.030 * H],
      [s * 0.086 * H, -0.086 * H],
      [s * 0.062 * H, -0.100 * H],
      [s * 0.056 * H, -0.062 * H],
      [s * 0.030 * H, -0.084 * H],
      [s * 0.020 * H, -0.048 * H]
    ], 0.008 * H);
    bag.add('skin', tGeo(fin, { rot: [0, s * -30, 0], pos: [s * 0.098 * H, 0.652 * H, -0.048 * H] }),
      { chain: torsoChain, color: FIN, blend: 0.04 });
    // two ribs across the membrane
    for (let i = 0; i < 2; i++) {
      bag.add('skin', tGeo(roundBox(0.006 * H, 0.070 * H, 0.006 * H, 0.002 * H), {
        rot: [0, s * -30, s * (26 + i * 16)],
        pos: [s * (0.122 * H + i * 0.020 * H), 0.618 * H, -0.052 * H]
      }), { chain: torsoChain, color: FIN_RIB, blend: 0.03 });
    }
  }

  const model = finalizeModel(ctx, {
    springs,
    // THE WET SURFACE — see the material note in the reference sheet.
    materials: { skin: WET_SKIN() },
    outlineThickness: 0.016
  });

  // -------------------------------------------------------------------------
  // THE DOMAIN TELL
  // -------------------------------------------------------------------------
  // While Horizon of the Captivating Skandha stands, the cursed seal he draws
  // on his own stomach stays visible on the plate. One node, hidden by
  // default, toggled by the domain — nothing else on the model changes, which
  // is deliberate: the domain is the spectacle and he should not compete with
  // it.
  const seal = new THREE.Group();
  {
    const mat = MAT.flat({ vertexColors: false, color: 0x7fd8c8 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.042 * spec.H, 0.0055 * spec.H, 6, 20), mat);
    seal.add(ring);
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.052 * spec.H, 0.005 * spec.H, 0.005 * spec.H), mat);
      bar.rotation.z = (i / 4) * Math.PI;
      seal.add(bar);
    }
    seal.position.set(0, 0.612 * spec.H, 0.108 * spec.H);
    seal.visible = false;
    const chest = model.bones.get('Chest');
    if (chest) {
      // parented to the Chest, so it rides the torso rather than floating
      seal.position.set(0, -0.088 * spec.H, 0.108 * spec.H);
      chest.add(seal);
    } else {
      model.group.add(seal);
    }
  }
  model.setSeal = on => { seal.visible = !!on; };

  return model;
}
