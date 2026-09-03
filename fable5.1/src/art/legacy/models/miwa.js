// ===========================================================================
// KASUMI MIWA 三輪霞 — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-19 from the Jujutsu Kaisen Wiki's Appearance section
// (search-result extraction; the fandom host answers 402 to WebFetch here, so
// NO IMAGE WAS VIEWED — same caveat models/maki.js records, and the same
// APPROXIMATED list at the bottom).
//
// ---------------------------------------------------------------------------
// ONE CORRECTION TO THE BRIEF, UP FRONT
// ---------------------------------------------------------------------------
// The brief says "dark hair in a specific cut — research it". The research
// says otherwise and the research wins: Kasumi has LIGHT BLUE hair. The wiki's
// Appearance section opens "Kasumi has long, light blue hair that extends past
// her shoulders and frames her forehead, with blue eyes, thin eyebrows and
// asymmetric bangs." It is graded a pale ice-blue in the anime and drawn light
// in the manga colour pages. Building her dark-haired would be the single most
// visible possible miss on this model, so she is built light-blue (#b9d4e6)
// and this note exists so the departure from the brief is deliberate and
// visible rather than silent.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// No official height is published for her. The brief's requirement — "average
// height, slim, teenage build, the least physically imposing character in the
// roster and it should show" — is the spec, and it is consistent with how she
// is drawn next to the Kyoto second-years. H = 1.66. Against the shipped cast:
//     Nobara 1.62 · >>> MIWA 1.66 <<< · Inumaki 1.68 · Yuta 1.73 · Maki 1.74
// so she is the second-shortest human on the roster. Height is not what makes
// her unimposing, though — MASS is. `muscle: 0.80` and `bulk: 0.86` are the
// LOWEST NUMBERS ON THE ROSTER, under Nobara's 0.86/0.90. Narrow shoulders
// (0.094, also the lowest), a narrow waist, thin limbs. Standing her next to
// Todo in the lineup render should be faintly alarming, which is the point:
// she is a student with a sword and no cursed technique.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Blue eyes, thin eyebrows. She is drawn wide-eyed and worried far more often
// than not — the eye aperture here is the LARGEST on the roster (eyeH 0.36),
// which is the opposite end of the same dial Toji and Maki sit at the narrow
// end of, and it does most of the work of "anxious". The brows are thin and
// set high and slightly raised at the inner corner, which is the standard
// anime worry read.
// Mouth: small, and set very slightly down at the corners in the neutral pose.
// The head scale is 1.07 — the largest on the roster alongside Nobara's 1.06,
// a fractionally more youthful proportion.
//
// ---------------------------------------------------------------------------
// HAIR, FROM EVERY ANGLE
// ---------------------------------------------------------------------------
// The reference: "long, light blue hair that extends past her shoulders and
// frames her forehead, with ... asymmetric bangs."
// FRONT: a full fringe with an ASYMMETRIC parting — this is the specific cut
//   the brief asks about and it is the detail people recognise her by. The
//   bangs are longer on the model's LEFT and sweep across to the right, with
//   the parting well off centre. Two longer framing pieces come down past the
//   jaw on either side of the face.
// 3/4: the mass hangs; there is no crown volume and no spikes anywhere.
// SIDE: straight, falling past the shoulder, with a slight inward curve at the
//   tip. It clears the shoulder line by roughly a head radius.
// BACK: a single straight sheet, blunt at the end, no layering. The flattest
//   back-of-head in the project.
// Construction: scalp shell + long hanging CARDS, plus a SPRING CHAIN pair for
//   the two longest back strands so the hair lags when she moves. That lag is
//   worth the cost on this character specifically: her signature clip is an
//   iai draw that is one frame of blur and a held follow-through, and hair
//   that arrives late is most of what sells the stillness at the end of it.
// COLOUR #b9d4e6 with a cooler #9dbdd4 for the under-layer.
//
// ---------------------------------------------------------------------------
// GARMENTS — THE KYOTO UNIFORM, WHICH IS NOT THE TOKYO ONE
// ---------------------------------------------------------------------------
// The brief is right that it differs and that the existing students' uniform
// must not be reused. The reference: "a black, long-sleeved jacket over a
// light-coloured button-down shirt and a black tie, pants, socks, shoes, and a
// belt that she uses to hold her sword."
// The differences from the Tokyo uniform the shipped students wear:
//   · it is a JACKET OVER A SHIRT AND TIE — a two-layer collared look, where
//     the Tokyo uniform is a single high-collared top
//   · the shirt is LIGHT and visibly present at the collar and the front
//     opening, which is the fastest read
//   · she wears TROUSERS, not the skirt the Tokyo girls' version has
//   · the BELT is functional: it carries the sword
// Layers, outermost first:
//   · JACKET   #14161b, long-sleeved, open at the front, notch collar.
//   · SHIRT    #dfe4ea, a warm off-white, visible as a wedge at the chest and
//              as the collar standing inside the jacket's.
//   · TIE      #1a1c22, narrow, knotted at the throat.
//   · TROUSERS #191b21.
//   · BELT     #23252c with a plain steel buckle, plus the SAYA HANGER — the
//              cord loop the scabbard actually rides in.
//   · SHOES    #14151a, flat and plain.
//
// ---------------------------------------------------------------------------
// THE SWORD AND THE SHEATH — a showpiece prop, and the sheath is rigged
// ---------------------------------------------------------------------------
// Built here rather than reused: Toji's Split Soul Katana is a different
// weapon with a different fitting and no scabbard at all, and Miwa's whole kit
// is an iai draw, which cannot exist without a saya.
//   BLADE  a shinogi-zukuri katana. Straight-ish with a shallow sori, a real
//          ridge line, a chisel-ground kissaki, 0.62·H of exposed edge.
//   HABAKI a brass collar at the base of the blade.
//   TSUBA  a plain round iron guard — she is a student, not an heirloom
//          carrier, so it is unornamented.
//   TSUKA  black ito wrapped over pale same, drawn as alternating diamonds.
//   SAYA   gloss black lacquer, with a kurikata (the cord knob) and a
//          sageo (the cord) — and it is ITS OWN PROP with its own attachment,
//          so the draw animation can hold the saya on the LEFT hip while the
//          blade leaves it in the right hand. That split is the entire reason
//          the sheath is modelled separately instead of being a decoration on
//          the sword.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin      #f0d2b6      hair       #b9d4e6      hairDk  #9dbdd4
//   jacket    #14161b      shirt      #dfe4ea      tie     #1a1c22
//   pants     #191b21      belt       #23252c      shoes   #14151a
//   eyes      #5b9fd4      brows      #a8c4d8
//   blade     #dde6ee      saya       #101218      tsuka   #16181e
//   habaki    #c8a860      tsuba      #4a4f58
//   rim       #dfeaf5      outline    #0a0d14      accent  #a8d8e8
// The accent is a pale ice blue taken off the hair. Deliberately PALER and
// COLDER than Megumi's #8fb6d8 — the two are the closest pair on the select
// screen and the separation is that his is a mid slate blue and hers is almost
// white. It also has to survive being drawn on top of every domain colour
// grade in the game, which is why it sits so light: see the note in
// combat/newshadow.js about reading her circle inside Jogo's furnace.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. pale blue hair, asymmetric bangs   4. the black tie over a light shirt
//   2. the katana + saya on the left hip  5. small, slight frame
//   3. the Kyoto jacket-over-shirt        6. the worried, wide-eyed neutral
// All six are in this file. Item 6 is helped enormously by anim/miwa.js —
// see the note there about the two postures.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the jacket's exact cut, lapel shape and button placement. The reference
//     says "black, long-sleeved jacket" and no more.
//   · the sword's fittings. Nothing canon is published about her blade beyond
//     that she has one; this is a plausible school-issue katana.
//   · the ito wrap is drawn as alternating diamonds rather than modelled as
//     real crossed cord — at this poly budget real wrap bands into mush.
//   · her hands. The shared mitt, unchanged.
//   · the dark blue tracksuit training outfit is NOT built.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import {
  latheY, tGeo, roundBox, sphereShell, ribbonShell, shapeExtrude, mergeGeos
} from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3 } from '../../../core/math.js';

const SKIN = 0xf0d2b6;
const HAIR = 0xb9d4e6;
const HAIR_DK = 0x9dbdd4;
const JACKET = 0x14161b;
const SHIRT = 0xdfe4ea;
const TIE = 0x1a1c22;
const PANTS = 0x191b21;
const BELT = 0x23252c;
const SHOE = 0x14151a;
const EYE = 0x5b9fd4;

const SW = {
  blade: 0xdde6ee, edge: 0xf4f8fc, saya: 0x101218, sayaRim: 0x2a3040,
  tsuka: 0x16181e, same: 0xd8d2c4, habaki: 0xc8a860, tsuba: 0x4a4f58,
  sageo: 0x3a3f4a
};
const OUT = { color: 0x0a0d14, thickness: 0.007 };

// ---------------------------------------------------------------------------
// THE KATANA. Built blade-up along +Y with the tsuka below the origin, which
// is the convention every other bladed prop in the project uses so the
// attachment rotations are solvable the same way.
// ---------------------------------------------------------------------------
export function buildMiwaKatana(H = 1.66) {
  const g = new THREE.Group();
  g.name = 'miwaKatana';
  const bladeMat = MAT.metal({ vertexColors: false, color: SW.blade, rimColor: 0xffffff });
  const edgeMat = MAT.metal({ vertexColors: false, color: SW.edge, rimColor: 0xffffff });
  const habakiMat = MAT.metal({ vertexColors: false, color: SW.habaki, rimColor: 0xffe8b0 });
  const tsubaMat = MAT.metal({ vertexColors: false, color: SW.tsuba });
  const tsukaMat = MAT.cloth({ vertexColors: false, color: SW.tsuka, rimColor: 0x8f98a8 });
  const sameMat = MAT.cloth({ vertexColors: false, color: SW.same });

  // PASS 5: 0.62·H dragged the tip along the floor when worn — on a 1.66 m
  // body that is a 1.03 m blade, which is a nodachi, not a katana. 0.52·H is
  // 86 cm, which is a real katana's nagasa at her scale and clears the ground
  // by a comfortable margin in the worn position.
  const L = 0.52 * H;            // exposed blade length
  const W = 0.021 * H;           // blade width at the habaki
  const T = 0.0072 * H;          // blade thickness at the spine

  // ---- BLADE --------------------------------------------------------------
  // SHINOGI-ZUKURI: the cross-section is a wedge with a RIDGE LINE about a
  // third of the way down from the spine, not a lens. Built as a 6-point
  // extruded profile so the ridge is real geometry and catches the rim light
  // as a hard line down the whole blade — which is the single thing that makes
  // a procedural katana read as a katana instead of as a metal ruler.
  //
  //        spine
  //       ___
  //      |   \        <- shinogi-ji (the flat above the ridge)
  //      |    >       <- shinogi (THE RIDGE)
  //      |   /        <- ji / ha (the ground bevel down to the edge)
  //       ---
  //        edge
  const half = W / 2;
  const prof = [
    [-T / 2, half],            // spine, back face
    [T / 2, half],             // spine, front face
    [T / 2 * 0.92, half * 0.16],  // ridge, front
    [0, -half],                // the EDGE — a single point, both faces meet
    [-T / 2 * 0.92, half * 0.16], // ridge, back
  ];
  const blade = new THREE.Mesh(shapeExtrude(prof, L, { bevel: false }), bladeMat);
  // extruded along +Z by shapeExtrude; stand it up along +Y
  blade.rotation.x = -Math.PI / 2;
  blade.position.y = L / 2;
  // SORI — the shallow curve. Applied by displacing the vertices along the
  // spine direction as a function of height rather than by bending the whole
  // mesh, so the edge stays a straight line in cross-section.
  {
    const pos = blade.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getZ(i) + L / 2) / L;             // 0 at habaki, 1 at tip
      // a shallow arc, deepest toward the tip, ~1.6% of the length
      pos.setX(i, pos.getX(i) + Math.pow(Math.max(0, t), 1.6) * L * 0.016);
      // KISSAKI: chisel the last 6% into a point
      if (t > 0.94) {
        const u = (t - 0.94) / 0.06;
        pos.setY(i, pos.getY(i) * (1 - u * 0.94) - half * u * 0.80);
      }
    }
    pos.needsUpdate = true;
    blade.geometry.computeVertexNormals();
  }
  blade.add(makeOutline(blade, OUT));
  g.add(blade);
  // the HA — a brighter strip along the cutting edge, which is what a
  // hamon reads as at this distance
  const ha = new THREE.Mesh(
    new THREE.BoxGeometry(T * 0.30, L * 0.96, W * 0.16), edgeMat);
  ha.position.set(L * 0.008, L * 0.50, -half * 0.86);
  g.add(ha);

  // ---- HABAKI -------------------------------------------------------------
  const hab = new THREE.Mesh(
    new THREE.BoxGeometry(T * 1.5, 0.026 * H, W * 1.16), habakiMat);
  hab.position.y = 0.010 * H;
  g.add(hab);

  // ---- TSUBA --------------------------------------------------------------
  // Plain, round, iron. A student's fitting.
  const tsuba = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036 * H, 0.036 * H, 0.006 * H, 18), tsubaMat);
  tsuba.rotation.x = Math.PI / 2;
  tsuba.rotation.z = Math.PI / 2;
  tsuba.position.y = -0.004 * H;
  tsuba.scale.set(1, 1, 0.80);
  tsuba.add(makeOutline(tsuba, OUT));
  g.add(tsuba);

  // ---- TSUKA --------------------------------------------------------------
  // Pale same (ray skin) underneath, black ito over it as alternating
  // diamonds. Real crossed wrap bands into mush at this poly budget, so the
  // diamonds are flat plates alternating side to side — which is exactly what
  // the wrap reads as from more than a metre away.
  const tsukaL = 0.155 * H;
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(T * 1.9, tsukaL, W * 1.05), sameMat);
  core.position.y = -0.010 * H - tsukaL / 2;
  g.add(core);
  for (let i = 0; i < 7; i++) {
    const yy = -0.016 * H - (i + 0.5) * (tsukaL / 7);
    const s = i % 2 ? 1 : -1;
    const d = new THREE.Mesh(
      new THREE.BoxGeometry(T * 2.15, tsukaL / 7 * 0.62, W * 1.18), tsukaMat);
    d.position.set(0, yy, s * W * 0.06);
    d.rotation.x = s * 0.34;
    g.add(d);
  }
  // kashira — the pommel cap
  const kashira = new THREE.Mesh(
    new THREE.BoxGeometry(T * 2.2, 0.014 * H, W * 1.24), tsubaMat);
  kashira.position.y = -0.010 * H - tsukaL - 0.005 * H;
  g.add(kashira);
  // menuki — the small ornament under the wrap, one per side
  for (const s of [1, -1]) {
    const mn = new THREE.Mesh(
      new THREE.SphereGeometry(0.006 * H, 6, 5), habakiMat);
    mn.scale.set(0.6, 1.6, 1);
    mn.position.set(s * T * 1.05, -0.010 * H - tsukaL * 0.42, 0);
    g.add(mn);
  }
  return g;
}

// ---------------------------------------------------------------------------
// THE SAYA. Its own prop, its own attachments — the draw needs the scabbard to
// stay on the hip while the blade goes to the hand, and that is only possible
// if the two are separate nodes.
// ---------------------------------------------------------------------------
export function buildMiwaSaya(H = 1.66) {
  const g = new THREE.Group();
  g.name = 'miwaSaya';
  const lacMat = MAT.metal({ vertexColors: false, color: SW.saya, rimColor: SW.sayaRim });
  const cordMat = MAT.cloth({ vertexColors: false, color: SW.sageo, rimColor: 0x8f98a8 });
  const hornMat = MAT.cloth({ vertexColors: false, color: 0x2a2f38 });

  const L = 0.545 * H;             // a shade longer than the blade
  const W = 0.026 * H, T = 0.0115 * H;
  // The body: a flattened box with the same shallow sori as the blade, so the
  // sword actually looks like it came out of THIS scabbard.
  const body = new THREE.Mesh(roundBox(T, L, W, T * 0.34, 2), lacMat);
  {
    const pos = body.geometry.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + L / 2) / L;
      pos.setX(i, pos.getX(i) + Math.pow(Math.max(0, t), 1.6) * L * 0.016);
      // KOJIRI: taper the closed end
      if (t > 0.90) {
        const u = (t - 0.90) / 0.10;
        pos.setZ(i, pos.getZ(i) * (1 - u * 0.30));
        pos.setX(i, pos.getX(i) * (1 - u * 0.24));
      }
    }
    pos.needsUpdate = true;
    body.geometry.computeVertexNormals();
  }
  body.position.y = L / 2;
  body.add(makeOutline(body, OUT));
  g.add(body);
  // KOIGUCHI — the mouth collar the blade enters through
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(T * 1.18, 0.016 * H, W * 1.14), hornMat);
  mouth.position.y = 0.008 * H;
  g.add(mouth);
  // KURIKATA — the cord knob, a third of the way down the outboard face
  const kuri = new THREE.Mesh(
    new THREE.BoxGeometry(T * 0.9, 0.020 * H, W * 0.46), hornMat);
  kuri.position.set(T * 0.72, 0.11 * L, 0);
  g.add(kuri);
  // SAGEO — the cord, looped once off the kurikata. Two short segments so it
  // reads as cord rather than as a wire.
  for (const [dy, dz, rot] of [[0.02, 0.020, 0.5], [0.055, 0.006, -0.3]]) {
    const c = new THREE.Mesh(
      new THREE.TorusGeometry(0.020 * H, 0.0028 * H, 5, 12, Math.PI * 1.4), cordMat);
    c.position.set(T * 0.9, 0.11 * L - dy * H, dz * H);
    c.rotation.set(0, Math.PI / 2, rot);
    g.add(c);
  }
  return g;
}

export function buildMiwa() {
  const spec = {
    id: 'miwa', name: 'Miwa', H: 1.66, headScale: 1.07,
    // THE SMALLEST NUMBERS ON THE ROSTER. Narrow shoulders, narrow everything.
    // She is not short so much as SLIGHT, and these are what say so.
    shoulder: 0.094, hip: 0.053, muscle: 0.80, bulk: 0.86, legBulk: 0.88,
    skinTone: SKIN,
    clothColor: JACKET, sleeveColor: JACKET,
    pantColor: PANTS, shoeColor: SHOE,
    torsoShape: { chest: 0.92, waist: 0.84, hip: 0.98 },
    face: { jaw: 0.88, chin: 1.06, width: 1.00 },
    shoe: { len: 0.098, wid: 0.038, hgt: 0.042 },
    palette: {
      rim: 0xdfeaf5, hairRim: 0xeaf6ff, outline: 0x0a0d14,
      accent: 0xa8d8e8, energy: 0xcfe8f5, metalRim: 0xffffff
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE ---------------------------------------------------------------
  // THE WIDEST EYES IN THE GAME. eyeH 0.36 against Toji's 0.21 and Maki's
  // 0.235 — she is at the far end of the same dial they anchor, and almost
  // everything about "anxious student" comes out of that one number plus the
  // brow tilt below. Big round irises, a big glint, and a lot of visible
  // sclera above the iris, which is the classic worry read.
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.54, eyeH = headR * 0.36;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.385;
    // a SOFT lash line — thin, and lifted at the outer corner rather than
    // hooded. A heavy lash on this face would read as glamour.
    bag.add('flat', tGeo(roundBox(eyeW * 1.02, eyeH * 0.16, 0.004, 0.002),
      { rot: [0, 0, s * 10], pos: [ex, eyeY + eyeH * 0.48, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x2a3646 });
    bag.add('flat', tGeo(roundBox(eyeW, eyeH, 0.004, eyeH * 0.44),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xfafcff });
    // iris set LOW in the aperture so sclera shows above it
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.44, 14),
      { scale: [0.92, 1.02, 1], pos: [ex - s * eyeW * 0.03, eyeY - eyeH * 0.07, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.20, 10),
      { pos: [ex - s * eyeW * 0.03, eyeY - eyeH * 0.07, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x14202e });
    // TWO glints, not one — the doubled catchlight is what makes an anime eye
    // read as wet, and wet reads as worried
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.15, 8),
      { pos: [ex - s * eyeW * 0.15, eyeY + eyeH * 0.12, faceZ + headR * 0.031] }),
      { bone: 'Head', color: 0xffffff });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.07, 6),
      { pos: [ex + s * eyeW * 0.13, eyeY - eyeH * 0.24, faceZ + headR * 0.031] }),
      { bone: 'Head', color: 0xffffff });
    // BROW: thin, HIGH, and tilted UP at the inner end (toward the nose).
    // That inner lift is the single most legible worry cue there is.
    bag.add('flat', tGeo(roundBox(eyeW * 0.86, eyeH * 0.10, 0.004, 0.002),
      { rot: [0, 0, s * 14], pos: [ex + s * eyeW * 0.04, eyeY + eyeH * 1.16, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0xa8c4d8 });
  }
  // MOUTH: small, and turned very slightly DOWN. Two short segments angled
  // toward each other rather than one line, which gives the corners somewhere
  // to go without modelling lips.
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.095, headR * 0.032, 0.004, 0.002),
      { rot: [0, 0, s * -7], pos: [s * headR * 0.048, headC.y - headR * 0.60, faceZ - headR * 0.045] }),
      { bone: 'Head', color: 0xb0666a });
  }

  // ---- HAIR ---------------------------------------------------------------
  const FACE_GAP = 1.02;
  bag.add('hair', tGeo(sphereShell(headR * 1.02, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.72, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.03, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });

  const card = (from, mid, to, w0, w1, hint, color = HAIR) => {
    const geo = ribbonShell([from, mid, to], t => w0 + (w1 - w0) * t, headR * 0.075,
      { seg: 9, normalHint: hint.clone().normalize(), taperThick: false });
    bag.add('hair', geo, { bone: 'Head', color });
  };

  // ---- THE ASYMMETRIC BANGS ----------------------------------------------
  // THE identifying feature, and the thing the brief specifically asks to get
  // right. The parting sits well off centre toward the model's RIGHT (-X), and
  // the whole fringe sweeps from there ACROSS the forehead to the left. So:
  //   · the cards left of the part are LONG and angled hard across
  //   · the cards right of it are SHORT and nearly vertical
  // A symmetric fringe would make her generic; this one is specifically her.
  const PART = -0.42;                      // radians, off centre to the model's right
  for (let i = -4; i <= 4; i++) {
    const a = PART + i * 0.26;
    const sx = Math.sin(a) * headR * 0.86;
    const sz = Math.cos(a) * headR * 0.80;
    // the sweep: everything LEFT of the part (i > 0) grows longer and leans
    const leftOfPart = i > 0;
    const lean = leftOfPart ? 0.30 : 0.06;
    // PASS 2 FIX — THE BANGS WERE OVER HER EYES. Same solve as Yuki's fringe:
    // the end height depends on how far OUT the card sits, so the sweep stays
    // above the brow across the middle of the forehead and only the outermost
    // cards come down past the cheekbone. The asymmetry is preserved by
    // letting the left side hang lower than the right at the same outness,
    // which is what the reference's off-centre parting actually looks like.
    // PASS 3: the falloff now starts at |i| = 1 rather than 0, so the two
    // cards either side of the parting still end ABOVE the brow. At pass 2 the
    // innermost pair ended just above the eye line, and a card is 0.28·headR
    // WIDE, so "just above" still covered it.
    const outness = Math.max(0, Math.min(1, (Math.abs(i) - 1) / 3));
    const endY = headC.y + headR * (0.34 - outness * (leftOfPart ? 0.96 : 0.72));
    card(
      v3(sx * 0.84, headC.y + headR * 0.62, sz * 0.84),
      v3(sx * 1.00 + lean * headR, headC.y + headR * 0.30, sz * 1.00),
      v3(sx * 1.06 + lean * 2.2 * headR, endY, sz * 0.90),
      headR * 0.28, headR * 0.17,
      v3(sx, headR * 0.30, sz)
    );
  }
  // FACE-FRAMING PIECES: two longer strands past the jaw, one each side. The
  // left one is longer than the right, matching the asymmetry above.
  for (const s of [1, -1]) {
    const extra = s > 0 ? 0.30 : 0;
    card(
      v3(s * headR * 0.86, headC.y + headR * 0.46, headR * 0.48),
      v3(s * headR * 0.98, headC.y - headR * 0.36, headR * 0.52),
      v3(s * headR * 0.92, headC.y - headR * (1.24 + extra), headR * 0.38),
      headR * 0.24, headR * 0.13,
      v3(s * 1, 0.1, 0.7)
    );
  }
  // ---- SIDES AND BACK: PAST THE SHOULDERS --------------------------------
  // Long, straight, blunt at the end, with a slight inward curve at the tip.
  // The flattest back-of-head in the project — no layering at all.
  // PASS 2 FIX — same failure Yuki's ring had. This used to sweep 281 degrees
  // starting at the front-right, so the longest cards on the model hung down
  // over her face and she came out as a mop with no features at all. Back
  // hemisphere only now.
  for (let i = 0; i < 13; i++) {
    const a = Math.PI * 0.46 + (i / 12) * Math.PI * 1.08;
    const sx = Math.sin(a), sz = Math.cos(a);
    // shorter at the sides, longest down the centre back
    const back = Math.max(0, -sz);
    const len = headR * (1.85 + back * 0.55);
    card(
      v3(sx * headR * 0.82, headC.y + headR * 0.40, sz * headR * 0.82),
      v3(sx * headR * 1.02, headC.y - headR * 0.55, sz * headR * 1.06),
      // the inward curve at the tip: the ends pull back toward the spine
      v3(sx * headR * 0.86, headC.y - len, sz * headR * 1.14),
      headR * 0.30, headR * 0.24,
      v3(sx, 0.20, sz),
      back > 0.5 ? HAIR_DK : HAIR
    );
  }

  // ---- THE TWO SPRUNG STRANDS --------------------------------------------
  // The longest pair of back strands hang off a spring chain instead of being
  // welded to the skull. Cheap (two chains, two segments each) and it buys the
  // thing this character needs more than any other: hair that ARRIVES LATE.
  // Her signature clip is an iai draw — one frame of blur and a long held
  // follow-through — and the follow-through only reads as stillness if
  // something is still catching up when she stops.
  const hairMat = MAT.hair({ vertexColors: false, color: HAIR_DK, rimColor: 0xeaf6ff });
  const springs = [];
  for (const s of [1, -1]) {
    const seg1 = makeFlapMesh(headR * 0.30, headR * 0.28, headR * 1.05, headR * 0.08,
      hairMat, HAIR_DK, { color: 0x0a0d14, thickness: 0.012 });
    const seg2 = makeFlapMesh(headR * 0.28, headR * 0.20, headR * 0.90, headR * 0.07,
      hairMat, HAIR_DK, { color: 0x0a0d14, thickness: 0.012 });
    springs.push({
      bone: 'Head',
      // BUG FIX, found while building models/uro.js. A SpringChain's
      // `localOffset` is parented straight onto the bone, so it is in
      // BONE-LOCAL space — but every `bag.add` in this file authors geometry
      // in WORLD space, and this line was written in the world convention like
      // its neighbours. `headC.y` is 1.54 m and the Head bone already sits at
      // 1.45 m, so the two stacked: both of her sprung back strands hung in
      // the air 1.5 m above her head, visible in any render framed wide enough
      // to include them (which the bench's default framing is not — which is
      // why it shipped). Subtracting the Head joint's own position puts them
      // on the back of her head, where the rest of the hair is.
      localOffset: v3(s * headR * 0.56, headC.y - headR * 0.16, headC.z - headR * 0.92)
        .sub(joints.get('Head')),
      restDir: v3(s * 0.10, -1, -0.16).normalize(),
      segments: [{ len: headR * 1.05, mesh: seg1 }, { len: headR * 0.90, mesh: seg2 }],
      // stiffer and lighter than Maki's cape: this is hair, so it should
      // whip and settle quickly rather than swing
      stiffness: 54, damping: 0.80, gravity: 6.5
    });
  }

  // =========================================================================
  // THE KYOTO UNIFORM
  // =========================================================================
  // ---- THE SHIRT ----------------------------------------------------------
  // Built FIRST and slightly inboard, so the jacket's opening reveals it. A
  // light wedge down the chest plus a standing collar inside the jacket's.
  // PASS 3: narrowed from 0.072·H to 0.044·H and shortened. At the old size
  // the light panel read as a bib rather than as a shirt showing through an
  // open jacket — the jacket's lapels only cover its edges, so the wedge has
  // to be narrow enough to sit BETWEEN them.
  bag.add('cloth', tGeo(roundBox(0.044 * H, 0.120 * H, 0.010 * H, 0.006 * H),
    { pos: [0, 0.700 * H, 0.052 * H] }), { chain: torsoChain, color: SHIRT, blend: 0.05 });
  // shirt collar: two small flats standing either side of the throat
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.038 * H, 0.036 * H, 0.008 * H, 0.004 * H),
      { rot: [10, s * -22, s * 14], pos: [s * 0.024 * H, 0.782 * H, 0.048 * H] }),
      { chain: torsoChain, color: SHIRT, blend: 0.03 });
  }
  // ---- THE TIE ------------------------------------------------------------
  // Narrow, knotted at the throat, hanging to the belt. The knot is its own
  // small block — a tie without a visible knot reads as a painted stripe.
  bag.add('cloth', tGeo(roundBox(0.024 * H, 0.026 * H, 0.012 * H, 0.005 * H),
    { pos: [0, 0.772 * H, 0.058 * H] }), { chain: torsoChain, color: TIE, blend: 0.02 });
  bag.add('cloth', tGeo(roundBox(0.026 * H, 0.115 * H, 0.008 * H, 0.004 * H),
    { rot: [3, 0, 0], pos: [0, 0.696 * H, 0.058 * H] }), { chain: torsoChain, color: TIE, blend: 0.04 });
  // ---- THE JACKET ---------------------------------------------------------
  // Open at the front with a notch collar. Built as two lapel slabs that leave
  // a wedge of shirt showing between them, plus a standing collar behind the
  // neck. This is the layer that separates the Kyoto uniform from the Tokyo
  // one at a glance, so it is the one that gets real geometry.
  for (const s of [1, -1]) {
    // lapel: a long slab angled away from centre, widening downward
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0], [0.052 * H, -0.020 * H], [0.058 * H, -0.170 * H], [0.014 * H, -0.170 * H]
    ], 0.010 * H), { rot: [0, 0, 0], pos: [s * 0.030 * H, 0.786 * H, 0.056 * H], scale: [s, 1, 1] }),
      { chain: torsoChain, color: JACKET, blend: 0.05 });
  }
  // standing collar around the back of the neck
  bag.add('cloth', tGeo(latheY([
    [0.043 * H, y.neck - 0.020 * H], [0.041 * H, y.neck + 0.014 * H],
    [0.040 * H, y.neck + 0.034 * H]
  ], 16, 0.86), { pos: [0, 0, -0.004 * H] }), { bone: 'Neck', color: JACKET });
  // jacket hem — a short skirt of fabric below the belt line, which is what
  // stops the jacket reading as a painted-on shirt
  bag.add('cloth', tGeo(latheY([
    [0.062 * H, 0.500 * H], [0.066 * H, 0.530 * H], [0.064 * H, 0.560 * H]
  ], 20, 0.80)), { chain: torsoChain, color: JACKET, blend: 0.05 });

  // ---- THE BELT AND THE SWORD HANGER -------------------------------------
  bag.add('cloth', tGeo(latheY([
    [0.060 * H, 0.556 * H], [0.063 * H, 0.566 * H],
    [0.063 * H, 0.588 * H], [0.060 * H, 0.598 * H]
  ], 20, 0.80)), { chain: torsoChain, color: BELT, blend: 0.04 });
  bag.add('metal', tGeo(roundBox(0.040 * H, 0.030 * H, 0.012 * H, 0.004 * H),
    { pos: [0, 0.577 * H, 0.050 * H] }), { chain: torsoChain, color: 0x8f98a8, blend: 0.02 });
  // THE HANGER — the cord loop on the LEFT hip that the saya actually rides
  // in. Small, but the whole draw animation is built around the sword being
  // on the left, and a scabbard floating with nothing holding it is the kind
  // of miss that only shows up in the viewer's side view.
  for (let i = 0; i < 2; i++) {
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.020 * H, 0.0040 * H, 5, 12),
      { rot: [0, 90, 8], pos: [0.058 * H, 0.572 * H - i * 0.030 * H, -0.008 * H] }),
      { chain: torsoChain, color: SW.sageo, blend: 0.02 });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0115, outlineHairScale: 1.0,
    props: {
      // ---- THE KATANA -----------------------------------------------------
      // THREE attachments, and the third is the reason this prop set exists:
      //   sheathed  inside the saya on the left hip. The default, and where
      //             she is in idle, in walk, in block and in the stance.
      //   hand      in the right hand, blade up. Where she is after a draw.
      //   away      under the world, for the frames of the ultimate cinematic
      //             where the blade is drawn by an effect rather than by her.
      katana: {
        node: buildMiwaKatana(spec.H), default: 'sheathed',
        attachments: {
          // SHEATHED: parented to the Hips so it rides with the body rather
          // than with the arm, angled up and back the way a worn sword sits.
          // The position matches the saya's exactly — they have to occupy the
          // same space or the blade floats out of its own scabbard.
          // PASS 3, SOLVED. Pass 1 ([-16, 0, -74]) stood the blade out
          // HORIZONTALLY from her hip like a rifle; pass 2 ([26, 14, -128])
          // swung it out behind her knees like a broom. Both were guesses, and
          // both were only visible from the side — which is exactly the
          // failure the viewer's four-side sheet exists to catch.
          //
          // This one is derived rather than guessed: take the Hips bone's world
          // quaternion under her own stance, invert it, and solve for the local
          // rotation that lands the scabbard's local +Y on (0.18, -0.90, -0.40)
          // — down the thigh, tipped back, hilt forward at the waist, which is
          // how a katana is actually worn.
          sheathed: { bone: 'Hips', pos: [0.058 * spec.H, 0.010 * spec.H, -0.020 * spec.H], rot: [-1, 5, -154] },
          // IN HAND, blade up. Solved against HER stance — see the note in
          // models/toji.js about why an attachment rotation cannot be copied
          // between characters.
          hand: { bone: 'HandR', pos: [0, -0.050 * spec.H, 0.010 * spec.H], rot: [-5, 22, -155] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      },
      // ---- THE SAYA -------------------------------------------------------
      // Its own prop with its own attachments, so the draw can leave the
      // scabbard on the hip while the blade goes to the hand. It also has a
      // `hand` slot of its own: the classic iai draw grips the saya in the
      // LEFT hand and pulls it back as the right draws, and the noto (the
      // sheathing) reverses that. Without a left-hand slot the sheath cannot
      // participate in its own animation.
      saya: {
        node: buildMiwaSaya(spec.H), default: 'hip',
        attachments: {
          // identical to the katana's `sheathed` slot — the two have to occupy
          // the same space or the blade floats out of its own scabbard
          hip: { bone: 'Hips', pos: [0.058 * spec.H, 0.010 * spec.H, -0.020 * spec.H], rot: [-1, 5, -154] },
          hand: { bone: 'HandL', pos: [0, -0.046 * spec.H, 0.010 * spec.H], rot: [-105, 36, -28] }
        }
      }
    }
  });

  // Whether the blade is in the scabbard or in her hand. One call, because the
  // two props always move together and letting a caller set them
  // independently is how a sword ends up in two places at once.
  model.setDrawn = drawn => {
    model.attachProp('katana', drawn ? 'hand' : 'sheathed');
  };
  // The left hand takes the saya for the draw and the sheathe, and gives it
  // back to the hip for everything else.
  model.setSayaHeld = held => model.attachProp('saya', held ? 'hand' : 'hip');
  model.setDrawn(false);

  return model;
}
