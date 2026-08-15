// NAOYA ZENIN — 禪院直哉. Built to a researched reference pass over the MAPPA
// design (Shibuya / Culling Game human form, not the vengeful-curse form).
//
// ============================ REFERENCE SHEET ============================
// Sources consulted (web, 2026-08-13): Jujutsu Kaisen Wiki character sheet
// ("tall and slim", brown eyes, "dyed blond hair accented with his dark green
// roots", "three piercings in his left ear, one in his ear lobe and two along
// the upper cartilage", "a white long-sleeved shirt that buttons the collar
// underneath his teal kimono", "light-coloured hakama bottoms and waraji
// sandals", age 27, arrogant grin), the Villains Wiki entry, and the
// Jujutsu Kaisen character-profile aggregators. Geometry here is ORIGINAL and
// procedural — nothing imported, nothing traced.
//
// BUILD    183 cm (H 1.83). Deliberately a near-match for Gojo's frame
//          (1.90) at slightly shorter — same long lean athletic proportions,
//          same narrow waist, and then CARRIED COMPLETELY DIFFERENTLY. Gojo
//          stands square and open; Naoya's stance puts the weight back on the
//          rear foot, the front shoulder dropped, one hand loose at his side
//          and the chin up. Shoulder 0.108·H, muscle 0.96, bulk 0.94 — he is
//          fast, not strong, and the model has to say so before he moves.
// HEAD     Sharp. Narrow jaw with a hard chin point, high cheekbones, a long
//          face. Every contour on Geto is continuous; every contour here has
//          a corner in it. jaw 1.08, chin 1.10, width 0.94 — the narrowest
//          head in the roster.
// HAIR     Dyed blond #d9bf74, styled and NEAT — the opposite of both Megumi's
//          spike mass and Geto's gathered length. Short, swept back off a
//          high forehead, with a clean side part on his LEFT (screen +X) and
//          a small lifted quiff at the front. The sides are tight to the
//          skull and taper into the nape.
//          THE DETAIL THAT MAKES IT HIM: DARK GREEN ROOTS #33402f. Canon
//          calls them out explicitly, and they are why the hair cannot be a
//          single flat colour — the shell under the swept bands is green and
//          the bands themselves are blond, so the roots show at every parting
//          and along the whole hairline. Get this wrong and he reads as a
//          generic blond.
// EYES     BROWN #6b4a2e, not gold. Narrow, hard, sharply tilted, with the
//          upper lash line kinked at the outer third and the brow driven DOWN
//          at the inner end — a permanent look-down-the-nose. Both irises sit
//          HIGH in the sclera with white showing beneath, which is the single
//          cheapest way to draw contempt.
// MOUTH    THE GRIN. Not a smile: an asymmetric open smirk, higher on his
//          left, with a visible tooth line. It is present in the neutral face
//          and it never leaves. "The most punchable character in the roster"
//          is a modelling instruction, and this is where it is paid.
// EARS     THREE PIERCINGS, LEFT EAR ONLY: one stud in the lobe, two smaller
//          along the upper cartilage. Real geometry, and deliberately absent
//          from the right ear — the asymmetry is canon and it is a free
//          identity cue in the 3/4 view.
// GARMENTS Outside in:
//            1 KIMONO — dark TEAL #1e3a3d, worn open-fronted over the shirt,
//              crossed left over right, sleeves moderate (NOT Geto's bells —
//              they stop at the wrist, because he needs the hands). Hem at
//              mid-thigh where it meets the hakama.
//            2 SHIRT — white #eceef2, long-sleeved, with a BUTTONED STAND
//              COLLAR closing at the throat and showing above the kimono. The
//              white at the neck is the brightest value on the model and it
//              is what makes the head read at silhouette size.
//            3 HAKAMA — light warm grey #b8ae9c, wide-legged and PLEATED:
//              five vertical pleat ridges down the front, which is what makes
//              it hakama and not trousers. Gathered at the ankle.
//            4 WARAJI — flat woven straw sandals #8f7f5c over white tabi,
//              with the cord lacing crossing the instep.
// PALETTE  hair #d9bf74 / roots #33402f · skin #f4e3d6 · kimono #1e3a3d /
//          trim #16292b · shirt #eceef2 · hakama #b8ae9c · waraji #8f7f5c ·
//          eyes #6b4a2e
//          PROJECTION VFX: pale gold #e8c85a. Pale-and-gold against dark
//          clothing, and deliberately NOT Gojo's white-and-black or his cyan.
// IDENTITY 1) the neat blond side-part with DARK GREEN ROOTS
//          2) the permanent open asymmetric grin under narrow hard brown eyes
//          3) white buttoned collar inside a dark teal kimono over pale
//             pleated hakama
// MOTION   Nothing about this model interpolates. See art/anim/naoya.js: the
//          clips are authored with 'snap' on every impact key and near-zero
//          transition time, so the body arrives at poses instead of moving to
//          them. The model's contribution is the AFTERIMAGE RIG below — a set
//          of frozen copies of the silhouette that are placed and left, never
//          lerped.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const HAIR = 0xd9bf74;
const HAIR_HI = 0xf0dc9e;
const ROOTS = 0x33402f;          // the dark green under-colour. Canon.
const SKIN = 0xf4e3d6;
const KIMONO = 0x1e3a3d;
const KIMONO_DK = 0x16292b;
const SHIRT = 0xeceef2;
const HAKAMA = 0xb8ae9c;
const HAKAMA_DK = 0x9a917f;
const WARAJI = 0x8f7f5c;
const EYE = 0x6b4a2e;
const GOLD = 0xe8c85a;

export function buildNaoya() {
  const spec = {
    id: 'naoya', name: 'Naoya', H: 1.83, headScale: 0.96,
    shoulder: 0.108, hip: 0.049, muscle: 0.96, bulk: 0.94,
    legBulk: 1.34,                       // wide hakama legs
    skinTone: SKIN, clothColor: SHIRT, pantColor: HAKAMA, shoeColor: WARAJI,
    // PASS 2 — the sleeve slot is KIMONO, not SHIRT. The builder's shoulder cap
    // reads this colour, and with SHIRT it produced two bright white domes
    // sitting on top of a dark teal kimono that reads as shoulder pads on a
    // sports jersey. The white shirt still shows exactly where it should — at
    // the collar and at the cuffs, both added explicitly below.
    sleeveColor: KIMONO,
    torsoShape: { chest: 1.0, waist: 0.92, hip: 0.96 },
    // the sharpest head in the roster
    face: { jaw: 1.08, chin: 1.10, width: 0.94 },
    shoe: { len: 0.116, hgt: 0.030 },
    palette: {
      rim: 0xffe9b8, hairRim: 0xffe08a, outline: 0x08070c,
      accent: GOLD, energy: GOLD
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE: narrow hard brown eyes, driven-down brows, THE GRIN -----------
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.48, eyeH = headR * 0.26;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.40;
    bag.add('flat', tGeo(hardEye(eyeW, eyeH, s),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf6f7fa });
    // IRIS HIGH IN THE SOCKET, with white showing under it. This is the whole
    // "looking down at you" read and it costs one offset.
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.44, 12),
      { scale: [0.80, 1.08, 1], pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.20, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.19, 10),
      { pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.20, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x1a1108 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.09, 8),
      { pos: [ex - s * eyeW * 0.13, eyeY + eyeH * 0.34, faceZ + headR * 0.030] }),
      { bone: 'Head', color: 0xffffff });
    // upper lash: a hard straight bar, and then a SECOND short bar kinked
    // downward at the outer third. The kink is what makes the eye look narrowed
    // rather than just small.
    bag.add('flat', tGeo(roundBox(eyeW * 0.86, eyeH * 0.26, 0.004, 0.002),
      { rot: [0, 0, s * 9], pos: [ex - s * eyeW * 0.10, eyeY + eyeH * 0.42, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x100c14 });
    bag.add('flat', tGeo(roundBox(eyeW * 0.38, eyeH * 0.22, 0.004, 0.002),
      { rot: [0, 0, s * 26], pos: [ex + s * eyeW * 0.40, eyeY + eyeH * 0.30, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x100c14 });
    // BROW: driven DOWN hard at the inner end and lifted at the outer — the
    // exact opposite of Geto's high level brow, on the same skull.
    bag.add('flat', tGeo(roundBox(eyeW * 1.00, eyeH * 0.19, 0.004, 0.002),
      { rot: [0, 0, s * 17], pos: [ex - s * eyeW * 0.06, eyeY + eyeH * 1.08, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x4a3a1e });
  }

  // THE GRIN. Asymmetric, open, higher on his left. Built from an upper lip
  // line, a dark mouth interior, and a tooth bar — because a single curved
  // stroke cannot show teeth, and the teeth are the point.
  {
    const my = headC.y - headR * 0.58;
    // the dark aperture
    bag.add('flat', tGeo(mouthShape(headR * 0.36, headR * 0.13),
      { pos: [headR * 0.03, my, faceZ - headR * 0.040] }), { bone: 'Head', color: 0x3a1c20 });
    // teeth: a pale bar filling the upper half of the aperture
    bag.add('flat', tGeo(roundBox(headR * 0.28, headR * 0.045, 0.004, 0.002),
      { rot: [0, 0, 6], pos: [headR * 0.03, my + headR * 0.030, faceZ - headR * 0.034] }),
      { bone: 'Head', color: 0xf4f2ee });
    // upper lip stroke, tilted so the LEFT corner (screen +X) rides higher
    bag.add('flat', tGeo(roundBox(headR * 0.42, headR * 0.030, 0.004, 0.002),
      { rot: [0, 0, 9], pos: [headR * 0.02, my + headR * 0.062, faceZ - headR * 0.030] }),
      { bone: 'Head', color: 0x5c3238 });
    // and a crease at the raised corner — the sneer line
    bag.add('flat', tGeo(roundBox(headR * 0.055, headR * 0.026, 0.004, 0.002),
      { rot: [0, 0, 58], pos: [headR * 0.22, my + headR * 0.086, faceZ - headR * 0.052] }),
      { bone: 'Head', color: 0x5c3238 });
  }

  // ---- EAR PIERCINGS: LEFT EAR ONLY, THREE OF THEM -------------------------
  // Canon, asymmetric, and free identity in the 3/4 view. Lobe stud first,
  // then two smaller ones up the cartilage.
  {
    const ex = headR * 0.98, ez = headC.z - headR * 0.12;
    const stud = (yOff, r) => {
      bag.add('metal', tGeo(new THREE.SphereGeometry(headR * r, 6, 5),
        { pos: [ex, headC.y + yOff, ez] }), { bone: 'Head', color: 0xd8d2c4 });
    };
    stud(-headR * 0.30, 0.050);   // lobe
    stud(-headR * 0.02, 0.036);   // lower cartilage
    stud(headR * 0.12, 0.034);    // upper cartilage
  }

  // ---- HAIR ----------------------------------------------------------------
  // PASS 2 — THE ORDERING IS INVERTED FROM THE FIRST ATTEMPT, AND IT MATTERS.
  //
  // Pass 1 laid a full GREEN shell and put blond bands on top of it, reasoning
  // that the green would then show through at every parting. What actually
  // happened is that the shell won: the bands were small, they sat inside the
  // shell's silhouette, and the character rendered as a DARK GREEN-HAIRED man
  // with a couple of gold slivers on his crown. Canon is "dyed blond hair
  // accented with his dark green roots" and pass 1 got the ratio exactly
  // backwards.
  //
  // So: THE SHELL IS BLOND and carries the whole mass and the whole
  // silhouette, and the green is applied as three small, deliberate,
  // HIGH-CONTRAST accents in the places roots actually show — the hairline,
  // the parting, and the nape. That is both what the reference shows and, more
  // usefully, the only version that survives being looked at from four metres.
  const FACE_GAP = 1.34;
  bag.add('hair', tGeo(sphereShell(headR * 0.985, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.66, scale: [1.01, 1.0, 1.03]
  }), { pos: [headC.x, headC.y + headR * 0.015, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 0.965, {
    phiStart: Math.PI / 2 + 1.0, phiLength: Math.PI * 2 - 2.0,
    thetaLength: Math.PI * 0.42, scale: [1, 1.0, 1]
  }), { rot: [-60, 0, 0], pos: [headC.x, headC.y - headR * 0.16, headC.z - headR * 0.20] }),
    { bone: 'Head', color: HAIR });
  // ROOT ACCENT 1 — the parting. A narrow green wedge running back from the
  // hairline along the part line at x = +0.22 headR (his left).
  bag.add('hair', tGeo(roundBox(headR * 0.12, headR * 0.06, headR * 1.10, headR * 0.02),
    { rot: [-16, 0, 0], pos: [headR * 0.22, headC.y + headR * 0.90, headC.z + headR * 0.06] }),
    { bone: 'Head', color: ROOTS });
  // ROOT ACCENT 2 — the nape, where regrowth is always most obvious
  bag.add('hair', tGeo(roundBox(headR * 1.10, headR * 0.20, headR * 0.10, headR * 0.03),
    { rot: [18, 0, 0], pos: [0, headC.y - headR * 0.30, headC.z - headR * 0.88] }),
    { bone: 'Head', color: ROOTS });

  // BLOND BANDS. Flat slabs swept BACK off the forehead and down the sides,
  // each standing just proud of the green shell (1.04–1.08 headR) so a thin
  // dark line of root shows between every pair.
  const band = (x, yOff, z, len, wid, tiltX, roll, color = HAIR) => {
    bag.add('hair', tGeo(roundBox(wid, len, headR * 0.11, headR * 0.028, 2),
      { rot: [tiltX, 0, roll], pos: [x, headC.y + yOff, headC.z + z] }), { bone: 'Head', color });
  };
  // crown, swept back: the part sits at x = +0.22 headR (his left), so the
  // left-hand bands are longer and sweep across
  const crown = [
    { x: 0.62, len: 1.06, w: 0.34, roll: -14 },
    { x: 0.34, len: 1.14, w: 0.32, roll: -8 },
    { x: 0.10, len: 1.02, w: 0.26, roll: -3 },     // just left of the part
    { x: -0.14, len: 0.88, w: 0.26, roll: 5 },     // just right of it: shorter
    { x: -0.40, len: 0.92, w: 0.30, roll: 11 },
    { x: -0.64, len: 0.86, w: 0.32, roll: 18 }
  ];
  for (const c of crown) {
    band(headR * c.x, headR * 0.62, -headR * 0.16, headR * c.len, headR * c.w,
      -62, c.roll, Math.abs(c.x) > 0.5 ? HAIR : HAIR_HI);
  }
  // THE QUIFF: one short band at the front lifted UP and forward off the
  // hairline. Small, and it is the difference between "styled" and "flat".
  band(headR * 0.30, headR * 0.80, headR * 0.36, headR * 0.44, headR * 0.30, -24, -10, HAIR_HI);
  band(headR * 0.02, headR * 0.78, headR * 0.38, headR * 0.36, headR * 0.24, -20, -2, HAIR);
  // sides: tight to the skull, tapering into the nape, covering the top of the
  // right ear and leaving the left lobe (and its piercings) clear
  for (const s of [1, -1]) {
    band(s * headR * 0.86, headR * 0.16, -headR * 0.10, headR * 0.60, headR * 0.26, -80, s * 6);
    band(s * headR * 0.78, -headR * 0.12, -headR * 0.30, headR * 0.44, headR * 0.22, -86, s * 4, HAIR);
  }
  // nape: short, tapered, hugging. He has no length anywhere.
  for (const n of [{ x: 0, w: 0.40 }, { x: 0.44, w: 0.32 }, { x: -0.44, w: 0.32 }]) {
    band(headR * n.x, -headR * 0.24, -headR * 0.80, headR * 0.42, headR * n.w, -104, 0);
  }
  // ROOT ACCENT 3 — the hairline. A thin green strip along the forehead edge,
  // laid UNDER the blond crown bands so it shows as a dark line where the hair
  // meets the skin. This is the accent that does the most work, because it is
  // the one visible from the front, and the front is where the character is
  // read.
  bag.add('hair', tGeo(roundBox(headR * 1.20, headR * 0.13, headR * 0.12, headR * 0.02),
    { rot: [-14, 0, 0], pos: [headR * 0.02, headC.y + headR * 0.58, headC.z + headR * 0.66] }),
    { bone: 'Head', color: ROOTS });

  // ---- GARMENTS ------------------------------------------------------------
  // 2 SHIRT FIRST — the white buttoned stand collar. Brightest value on him.
  bag.add('cloth', tGeo(latheY([
    [0.036 * H, y.neck - 0.032 * H], [0.040 * H, y.neck + 0.004 * H], [0.0395 * H, y.neck + 0.046 * H]
  ], 16, 0.93), {}), { bone: 'Neck', color: SHIRT });
  // collar points folding down at the front
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.026 * H, 0.040 * H, 0.008 * H, 0.003),
      { rot: [12, s * -18, s * 16], pos: [s * 0.020 * H, y.neck - 0.010 * H, 0.034 * H] }),
      { bone: 'Neck', color: SHIRT });
  }
  // three buttons down the visible placket
  for (let i = 0; i < 3; i++) {
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.0055 * H, 6, 5),
      { pos: [0, 0.762 * H - i * 0.028 * H, 0.058 * H] }), { bone: 'Chest', color: 0xc8ccd4 });
  }

  // 1 KIMONO — open-fronted, crossed left over right, teal. Two big lapel
  // slabs plus a body shell that stops at mid-thigh.
  // Profile ascends in y — a descending one inverts the lathe's winding and
  // the garment renders as its own backfaces (a black hole where the kimono
  // should be). Every latheY in this file ascends, for that reason.
  bag.add('cloth', tGeo(latheY([
    [0.094 * H, 0.400 * H], [0.092 * H, 0.500 * H], [0.090 * H, 0.600 * H],
    [0.089 * H, 0.700 * H], [0.086 * H, 0.790 * H]
  ], 20, 0.84), {}), { bone: 'Hips', color: KIMONO });
  // The V: two crossed lapels leaving the white shirt showing between them.
  // PASS 2 — pulled IN to z = 0.052·H (from 0.070) and narrowed. At the
  // previous depth they stood clear of the chest as two floating slabs and
  // read as a bib rather than as the edges of a garment; a lapel has to touch
  // the body it is folded over.
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.032 * H, 0.175 * H, 0.011 * H, 0.005),
      { rot: [4, s * -12, s * 19], pos: [s * 0.036 * H, 0.688 * H, 0.052 * H] }),
      { bone: 'Chest', color: s > 0 ? KIMONO : KIMONO_DK });
  }
  // shoulder yoke and hem trim in the darker teal
  bag.add('cloth', tGeo(latheY([
    [0.088 * H, 0.786 * H], [0.084 * H, 0.828 * H]
  ], 20, 0.86), {}), { bone: 'Chest', color: KIMONO_DK });
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.095 * H, 0.095 * H, 0.018 * H, 20, 1, true),
    { scale: [1, 1, 0.85], pos: [0, 0.406 * H, 0] }), { bone: 'Hips', color: KIMONO_DK });

  // kimono sleeves: moderate, ending AT the wrist. He needs his hands free and
  // the silhouette has to stay clean at speed — the opposite call from Geto's
  // bells, made for exactly that reason.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    // Rotating a +Y cylinder about +Z carries its top toward -X, and the arm
    // hangs along (m·sin13, -cos13) — so the LEFT arm (m = +1) wants a
    // POSITIVE tilt. The inverse of this sign splays both sleeves off the
    // shoulders like epaulettes.
    const tilt = (s === 'L' ? 1 : -1);
    const upMid = sh.clone().lerp(el, 0.48);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.042 * H, 0.148 * H, 12),
      { rot: [4, 0, tilt * 13], pos: [upMid.x, upMid.y, upMid.z] }),
      { chain: armChain, color: KIMONO, blend: 0.09 });
    const loMid = el.clone().lerp(wr, 0.44);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.042 * H, 0.036 * H, 0.130 * H, 12),
      { rot: [4, 0, tilt * 9], pos: [loMid.x, loMid.y, loMid.z] }),
      { chain: armChain, color: KIMONO, blend: 0.09 });
    // white shirt cuff showing at the wrist under the kimono sleeve
    const cuffP = wr.clone().lerp(el, 0.10);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0215 * H, 0.0205 * H, 0.024 * H, 10),
      { pos: [cuffP.x, cuffP.y, cuffP.z] }), { bone: 'Hand' + s, color: SHIRT });
  }

  // OBI: a narrow dark sash — narrower than Geto's, because his silhouette
  // wants a waist and Geto's wants a column
  bag.add('cloth', tGeo(latheY([
    [0.088 * H, 0.498 * H], [0.091 * H, 0.520 * H], [0.088 * H, 0.542 * H]
  ], 18, 0.84), {}), { bone: 'Hips', color: KIMONO_DK });

  // 3 HAKAMA — wide, pale, and PLEATED. The five front ridges are what make
  // it hakama; without them this is just baggy trousers in a light colour.
  bag.add('cloth', tGeo(latheY([
    [0.100 * H, 0.110 * H], [0.104 * H, 0.200 * H], [0.100 * H, 0.300 * H],
    [0.092 * H, 0.400 * H], [0.084 * H, 0.470 * H]
  ], 20, 0.90), {}), { bone: 'Hips', color: HAKAMA });
  // PASS 2 — the pleats now span ±0.076·H rather than ±0.048·H, and they are
  // pushed out to sit ON the garment's surface at each x. At the narrower
  // spread the five ridges huddled in a strip down the middle of a wide plain
  // column and read as a single decorative panel; hakama pleating goes edge to
  // edge, and it is the ONLY thing distinguishing hakama from loose trousers.
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.038 * H;
    // follow the barrel: the surface is nearer the camera at the centre
    const z = 0.094 * H * Math.sqrt(Math.max(0, 1 - (x / (0.108 * H)) ** 2)) * 0.90 + 0.006 * H;
    bag.add('cloth', tGeo(roundBox(0.009 * H, 0.320 * H, 0.010 * H, 0.003),
      { rot: [0, i * -7, i * 2.2], pos: [x, 0.290 * H, z] }),
      { bone: 'Hips', color: HAKAMA_DK });
  }
  // and two at the back, so the pleating survives a turn
  for (const i of [-1, 1]) {
    bag.add('cloth', tGeo(roundBox(0.008 * H, 0.300 * H, 0.010 * H, 0.003),
      { pos: [i * 0.030 * H, 0.290 * H, -0.090 * H] }), { bone: 'Hips', color: HAKAMA_DK });
  }
  // ankle gathers
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s), kn = joints.get('Shin' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.030 * H, 0.038 * H, 0.036 * H, 10),
      { pos: [an.x, an.y + 0.060 * H, an.z * 0.6 + kn.z * 0.4] }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: HAKAMA_DK, blend: 0.06 });
  }

  // 4 WARAJI over white tabi
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('cloth', tGeo(roundBox(0.042 * H, 0.034 * H, 0.096 * H, 0.012 * H, 2),
      { pos: [an.x, an.y + 0.014 * H, an.z + 0.022 * H] }), { bone: 'Foot' + s, color: 0xe6e2da });
    // the woven sole
    bag.add('cloth', tGeo(roundBox(0.048 * H, 0.012 * H, 0.122 * H, 0.006 * H, 2),
      { pos: [an.x, an.y - 0.011 * H, an.z + 0.020 * H] }), { bone: 'Foot' + s, color: WARAJI });
    // cord lacing crossing the instep
    for (const t of [1, -1]) {
      bag.add('cloth', tGeo(roundBox(0.006 * H, 0.005 * H, 0.062 * H, 0.002),
        { rot: [0, t * 26, 0], pos: [t * 0.012 * H + an.x, an.y + 0.032 * H, an.z + 0.028 * H] }),
        { bone: 'Foot' + s, color: 0x6a5c40 });
    }
  }

  // ---- SPRINGS -------------------------------------------------------------
  // DELIBERATELY THE STIFFEST SET IN THE ROSTER, and that is the design.
  // Geto's cloth is loose so it keeps moving after he stops; Naoya's is tight
  // so it STOPS WHEN HE STOPS. Secondary motion that trails him would read as
  // motion blur, and the brief for this character is that nothing about him
  // smears. High stiffness, low gravity, heavy damping: the cloth arrives with
  // the body and holds.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.007 };
  const springs = [];
  for (const s of [1, -1]) {
    // KIMONO FRONT PANELS. PASS 2 — narrower and longer (0.066 → 0.048 wide,
    // 0.106 → 0.132 total drop) and hung closer in at z 0.052·H. As short wide
    // flaps standing off the hip they read as two pockets rather than as the
    // hanging front of a garment; a panel needs to be taller than it is wide
    // or the eye files it as an object rather than as cloth.
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.046 * H, -0.096 * H, 0.052 * H),
      restDir: v3(s * 0.05, -1, 0.08).normalize(),
      stiffness: 168, damping: 0.72, gravity: 5,
      segments: [
        { len: 0.078 * H, mesh: makeFlapMesh(0.048 * H, 0.044 * H, 0.078 * H, 0.009, clothMat, KIMONO, oOpts) },
        { len: 0.054 * H, mesh: makeFlapMesh(0.044 * H, 0.036 * H, 0.054 * H, 0.008, clothMat, KIMONO_DK, oOpts) }
      ]
    });
    // HAKAMA SIDE VENTS. Pulled inboard from 0.086·H to 0.072·H so they sit
    // against the garment instead of floating a centimetre off its side, which
    // was clearly visible in the side view.
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.072 * H, -0.062 * H, -0.006 * H),
      restDir: v3(s * 0.07, -1, -0.03).normalize(),
      stiffness: 150, damping: 0.74, gravity: 6,
      segments: [
        { len: 0.070 * H, mesh: makeFlapMesh(0.044 * H, 0.048 * H, 0.070 * H, 0.008, clothMat, HAKAMA, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.010, outlineHairScale: 0.85
  });

  // ---- THE AFTERIMAGE RIG --------------------------------------------------
  // "Discrete afterimages that snap between positions rather than smearing."
  //
  // Implemented as a pool of eight frozen silhouettes — flat unlit slabs in
  // pale gold, roughly the size and shape of his standing volume — that are
  // PLACED and then LEFT. They do not move once placed, they do not fade
  // continuously (they step down through four discrete opacity levels), and
  // they are never interpolated toward anything. That is the entire visual
  // thesis of the character and it is why this is geometry rather than a
  // particle emitter: particles drift, and nothing about him drifts.
  //
  // The combat side calls model.projectionStep(pos, facing) once per discrete
  // position. A Naoya standing in the viewer never calls it, so the rig costs
  // nothing until he actually moves like himself.
  const ghosts = new THREE.Group();
  ghosts.renderOrder = 2;
  const GHOSTS = 8;
  const ghostList = [];
  {
    const mkMat = () => new THREE.MeshBasicMaterial({
      color: GOLD, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
    });
    for (let i = 0; i < GHOSTS; i++) {
      const g = new THREE.Group();
      const mat = mkMat();
      // a crude standing silhouette: torso slab, head, two leg slabs. Flat and
      // unlit on purpose — an afterimage is a shape, not a body.
      const torso = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.72), mat);
      torso.position.y = 1.12;
      const head = new THREE.Mesh(new THREE.CircleGeometry(0.15, 10), mat);
      head.position.y = 1.62;
      const legs = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.78), mat);
      legs.position.y = 0.40;
      g.add(torso, head, legs);
      g.visible = false;
      g.userData = { mat, life: 0 };
      ghosts.add(g);
      ghostList.push(g);
    }
  }
  let ghostN = 0;
  model.projectionAttach = parent => { if (ghosts.parent !== parent) parent.add(ghosts); };
  model.projectionStep = (pos, facing) => {
    const g = ghostList[ghostN % GHOSTS];
    ghostN++;
    g.position.set(pos.x, pos.y, pos.z);
    g.rotation.y = facing;
    g.visible = true;
    g.userData.life = 1;
    g.userData.mat.opacity = 0.55;
  };
  model.projectionClear = () => {
    for (const g of ghostList) { g.visible = false; g.userData.life = 0; }
  };

  // ---- PROJECTION STANCE TELL ---------------------------------------------
  // "A clear visual so the opponent knows the trap is armed." A hard-edged
  // gold ring at his feet plus a second at chest height, both of which STEP
  // through 24 discrete angular positions per second rather than rotating —
  // the arming tell is itself drawn at 24 fps.
  const stance = new THREE.Group();
  stance.visible = false;
  {
    const mat = new THREE.MeshBasicMaterial({
      color: GOLD, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide
    });
    for (const [r, yy] of [[0.72, 0.04], [0.52, 1.15]]) {
      const ring = new THREE.Group();
      // twelve ticks, not a torus: a solid ring reads as a smooth rotation and
      // that is the one thing this character must never do
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.16), mat);
        tick.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        tick.rotation.set(-Math.PI / 2, 0, -a);
        ring.add(tick);
      }
      ring.position.y = yy;
      stance.add(ring);
    }
  }
  model.group.add(stance);
  let stanceOn = false, stanceT = 0, stanceStep = 0;
  model.setProjectionStance = on => { stanceOn = !!on; stance.visible = !!on; };

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    // ghosts: step DOWN through discrete opacity levels, never a smooth fade
    for (const g of ghostList) {
      if (!g.visible) continue;
      g.userData.life -= dt * 2.4;
      if (g.userData.life <= 0) { g.visible = false; continue; }
      // four levels: 0.55 / 0.38 / 0.22 / 0.10, and nothing in between
      const step = Math.ceil(g.userData.life * 4);
      g.userData.mat.opacity = [0, 0.10, 0.22, 0.38, 0.55][step] ?? 0;
    }
    if (!stanceOn) return;
    // the rings advance in 24ths of a second — a hard step, then a hold
    stanceT += dt;
    const want = Math.floor(stanceT * 24);
    if (want !== stanceStep) {
      stanceStep = want;
      const a = (stanceStep % 24) / 24 * (Math.PI * 2 / 12);
      stance.children[0].rotation.y = a;
      stance.children[1].rotation.y = -a;
    }
  };
  return model;
}

// A harder eye than the shared almond: straight top edge, hard outer corner
// driven up, inner corner low. `s` = 1 for his left (screen +X).
function hardEye(w, h, s) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 * s, -h * 0.14);
  sh.lineTo(-w * 0.10 * s, h * 0.46);
  sh.lineTo(w * 0.34 * s, h * 0.40);
  sh.lineTo(w / 2 * s, h * 0.16);
  sh.lineTo(w * 0.30 * s, -h * 0.34);
  sh.quadraticCurveTo(-w * 0.10 * s, -h * 0.48, -w / 2 * s, -h * 0.14);
  return new THREE.ShapeGeometry(sh, 6);
}

// The open asymmetric grin aperture: wider and higher on the +X side.
function mouthShape(w, h) {
  const sh = new THREE.Shape();
  sh.moveTo(-w * 0.44, h * 0.10);
  sh.quadraticCurveTo(0, h * 0.44, w * 0.56, h * 0.34);
  sh.quadraticCurveTo(w * 0.10, -h * 0.70, -w * 0.44, h * 0.10);
  return new THREE.ShapeGeometry(sh, 8);
}
