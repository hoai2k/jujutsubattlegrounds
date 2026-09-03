// ===========================================================================
// REGGIE STAR — レジィ・スター
// ===========================================================================
// REFERENCE SHEET. Written from the anime character design sheet (JJK season
// 3, Culling Game arc) plus the Jujutsu Kaisen Wiki entry, the villains-wiki
// entry and the Japanese アニメイトタイムズ / 攻略大百科 write-ups. Studied
// front, three-quarter, side and back off the design sheet before a line of
// this was written; every measurement below is stated relative to the roster
// so it can be checked in a lineup render rather than argued about.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, AGAINST THE ROSTER
// ---------------------------------------------------------------------------
// Canon: "a muscular middle-aged man of relatively average height and build
// with a toned physique". He is a Heian-era curse user incarnated into a
// modern body, and the body he got is a gym body — visible definition, wide
// back, no bulk.
//
//   H = 1.86  — level with Geto (1.86), Higuruma (1.86) and Ryu (1.86), a
//               shade under Toji (1.88), well under Gojo (1.92) and nowhere
//               near Todo (2.00). "Average height" for this cast is 1.80-1.86.
//   muscle 1.22 / bulk 1.06 — between Toji's wiry 1.18 and Todo's slab 1.38.
//               The distinction that matters: he is CUT, not BROAD. His
//               shoulder half-width is 0.121 against Todo's 0.132 and Gojo's
//               0.115, so from the front he reads as a fit man rather than a
//               heavyweight, and the definition does the work instead.
//   legBulk 1.10 — the legs are the only part of him fully on show, and a
//               bare leg on a default-bulk tube reads as a stick.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
//   · Long face, straight jaw, prominent chin. `face: { jaw: 1.06, chin: 1.10,
//     width: 0.98 }` — narrower than Todo, longer than Yuji.
//   · GREEN EYES (0x6faa5e). Canon states them explicitly, and they are the
//     one colour on his head that is not blond, brown or skin.
//   · The eyes are half-lidded and the mouth is a small asymmetric smirk.
//     This is the single most important read on the face: he is enjoying
//     himself, permanently. `mouthTilt: -9` and a lash line dropped low.
//   · DARK EYEBROWS. Canon: the hair is "likely dyed since his eyebrows and
//     goatee are both darker coloured". The brows are 0x4a3a26 against hair at
//     0xe4cf86, and that mismatch is a real identifier — it is why the
//     character reads as bleached rather than naturally fair.
//   · GOATEE. A chin patch plus a thin moustache line, same dark brown as the
//     brows. Small: it sits inside the chin, it does not frame the mouth.
//
// ---------------------------------------------------------------------------
// HAIR — FROM EVERY ANGLE, because it is half the silhouette
// ---------------------------------------------------------------------------
//   FRONT  centre-left parting, two heavy curtains falling either side of the
//          face to just below the jaw, the left one longer and swept across
//          the brow. No fringe across the forehead — the forehead is visible.
//   3/4    the mass reads as a single sheet, not as spikes. This is the one
//          hairstyle in the roster with NO tufting: it is straight, flat and
//          heavy, and building it out of coneSpikes the way Todo's crop is
//          built would be wrong at every angle.
//   SIDE   falls to roughly the top of the shoulder blade. The back mass is
//          longer than the front curtains by about a third of a head radius.
//   BACK   one broad sheet with a soft centre seam and a slightly ragged hem.
//          It does NOT taper to a point and it is not tied.
//   Colour 0xe4cf86 base, 0xf2e3af highlight band, 0xc4ab63 in the shadow
//          under the mass. Bleached blond reads warm, not white — a white
//          would put him next to Gojo on the select screen, which he is not.
//
// ---------------------------------------------------------------------------
// GARMENTS — and there is essentially one
// ---------------------------------------------------------------------------
// Canon: "Reggie doesn't wear conventional clothing other than black boxer
// briefs. Instead, he attaches numerous paper tags to his body, enough so to
// cover his entire torso all the way down to his upper thighs."
//
//   1 BOXER BRIEFS — black (0x14161c), high-cut, the only actual clothing.
//     Barefoot, bare-legged, bare-armed, bare-chested underneath.
//   2 THE RECEIPT COAT — FOUR TIERS of paper tags, each tier a ring of
//     overlapping strips hanging point-down, shingled so the tier below is
//     half-covered by the one above:
//       tier 0  COLLAR/SHOULDER — the widest flare, standing off the deltoids.
//               This is the one the design sheet leads with and the one that
//               makes the silhouette read at distance.
//       tier 1  CHEST
//       tier 2  WAIST
//       tier 3  THIGH — ends at the upper thigh, above the knee, and its hem
//               is the raggedest.
//     Paper is 0xf4f2ea with a 0xe2e0d6 shadow face. Roughly one strip in five
//     carries a MINT PRINT MARK (0xb8d8c0) — thermal-receipt printing seen
//     edge-on. That green fleck is straight off the design sheet and it is the
//     detail that stops the coat reading as feathers.
//   3 THE HEM MOVES. The bottom tier and the two shoulder flares are spring
//     chains, so a man wearing four hundred loose paper tags does not stand
//     there like a statue.
//
// ---------------------------------------------------------------------------
// PROPS AND MARKS
// ---------------------------------------------------------------------------
//   · 不屈 — "INDOMITABLE", canon, tattooed on his LEFT arm. Two glyphs on the
//     outer upper arm, dark ink, sized to be legible in a 3/4 bench shot and
//     to read as a mark at fighting distance.
//   · No weapon, no accessory, no footwear. Everything he ever holds is
//     materialised — see art/models/receiptobjects.js.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin        0xe8bf98   warm, a shade lighter than Todo's 0xd9a878
//   hair        0xe4cf86   bleached blond, warm
//   hair hi     0xf2e3af
//   hair shadow 0xc4ab63
//   brow/goatee 0x4a3a26   deliberately NOT the hair colour
//   eye         0x6faa5e   green, canon
//   paper       0xf4f2ea
//   paper dark  0xe2e0d6
//   print       0xb8d8c0   mint thermal print
//   briefs      0x14161c
//   ink         0x22242c   the tattoo
//   ACCENT      0xf2e3af   — see the audit in characters/reggie.js
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in the order a player will notice them
// ---------------------------------------------------------------------------
//   1. The paper coat. Nothing else in the game has that silhouette.
//   2. Long straight bleached hair with dark brows.
//   3. Bare feet and bare legs — the only barefoot human on the roster
//      alongside Uro.
//   4. The goatee.
//   5. The smirk.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, mergeGeos } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3, rand } from '../../../core/math.js';

const SKIN = 0xe8bf98;
const HAIR = 0xd6c184;
const HAIR_HI = 0xeeddab;
const HAIR_DK = 0xac9257;
// One step between HAIR and HAIR_DK. Pass 5: the two-value hair banded into
// stripes at head-close range; a third value in the middle is what turns a
// stripe into a shade.
const HAIR_MID = 0xc2ad72;
const DARK = 0x4a3a26;          // brows + goatee — canon says they are darker
const EYE = 0x6faa5e;           // canon: green
const PAPER = 0xf4f2ea;
const PAPER_DK = 0xe2e0d6;
const PRINT = 0xb8d8c0;         // thermal print, seen as a mint fleck
const BRIEFS = 0x14161c;
const INK = 0x22242c;
const ACCENT = 0xf2e3af;

// ---------------------------------------------------------------------------
// ONE RECEIPT TAG
// ---------------------------------------------------------------------------
// A tapered strip with a RAGGED BOTTOM EDGE — the tear line where it came off
// the till roll. The raggedness is what separates this from a feather: a
// feather tapers to a point, a torn receipt ends in a flat edge with a notch
// in it. Built pointing -Y from its own origin so a tier can just place and
// rotate it.
//
// `print` adds one mint bar across the strip. It is a separate quad rather
// than a vertex colour because the strips are merged per tier and a colour
// function on merged geometry would have to know where each strip started.
function receiptTag(w, len, print = false) {
  const parts = [];
  const t = w * 0.055;
  // the body of the tag, tapering slightly toward the torn end
  const body = roundBox(w, len, t, t * 0.4, 1);
  const pos = body.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < 0) pos.setX(i, pos.getX(i) * (1 - 0.18 * (-y / (len * 0.5))));
  }
  body.computeVertexNormals();
  body.translate(0, -len * 0.5, 0);
  parts.push(body);
  // the tear: two small notches cut INTO the bottom edge by adding two little
  // blocks that overhang it, so the hem silhouette is broken rather than flat
  for (const [dx, dw, dh] of [[-0.24, 0.30, 0.16], [0.28, 0.24, 0.10]]) {
    parts.push(tGeo(roundBox(w * dw, len * dh, t, t * 0.3, 1),
      { pos: [w * dx, -len * (1 + dh * 0.42), 0] }));
  }
  const geo = mergeGeos(parts);
  if (!print) return { geo, print: null };
  // one printed bar, floated a hair proud of the face so it never z-fights
  const bar = tGeo(roundBox(w * 0.58, len * 0.10, t * 0.35, t * 0.15, 1),
    { pos: [0, -len * 0.42, t * 0.62] });
  return { geo, print: bar };
}

// ---------------------------------------------------------------------------
// ONE TIER OF THE COAT
// ---------------------------------------------------------------------------
// A ring of tags around the body at height `y`, radius `r`, each hanging
// point-down and leaning out by `flare` degrees. Tags are yaw-jittered and
// length-jittered so the hem is uneven — a tier of identical strips reads as a
// machined skirt, which is exactly what this must not look like.
function coatTier(bag, chain, opts) {
  const { n, r, y, len, w, flare, seed, zScale = 0.82 } = opts;
  let k = seed;
  const rnd = () => { k = (k * 1103515245 + 12345) & 0x7fffffff; return (k / 0x7fffffff); };
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.14;
    const L = len * (0.80 + rnd() * 0.42);
    const printed = rnd() < 0.22;
    const { geo, print } = receiptTag(w, L, printed);
    // lean out from the body, then yaw into place
    const lean = (flare + (rnd() - 0.5) * 10) * Math.PI / 180;
    const mtx = new THREE.Matrix4()
      .makeRotationY(a)
      .multiply(new THREE.Matrix4().makeTranslation(0, 0, 0))
      .multiply(new THREE.Matrix4().makeRotationX(-lean));
    geo.applyMatrix4(mtx);
    geo.translate(Math.sin(a) * r, y, Math.cos(a) * r * zScale);
    geo.computeVertexNormals();
    bag.add('cloth', geo, { chain, color: rnd() < 0.34 ? PAPER_DK : PAPER, blend: 0.06 });
    if (print) {
      print.applyMatrix4(mtx);
      print.translate(Math.sin(a) * r, y, Math.cos(a) * r * zScale);
      print.computeVertexNormals();
      bag.add('flat', print, { chain, color: PRINT, blend: 0.06 });
    }
  }
}

export function buildReggie() {
  const spec = {
    id: 'reggie', name: 'Reggie', H: 1.86, headScale: 0.94,
    // CUT, NOT BROAD — see the reference sheet. 0.121 shoulder sits between
    // Gojo's 0.115 and Todo's 0.132.
    shoulder: 0.121, hip: 0.054, muscle: 1.22, bulk: 1.06, legBulk: 1.10,
    skinTone: SKIN,
    // He is bare everywhere. Every slot that would normally be fabric is skin,
    // which is what makes the toon shader band him as a body instead of as a
    // shirt — the same call Toji's bare arms already make, taken further.
    bodySlot: 'skin', armSlot: 'skin', legSlot: 'skin',
    clothColor: SKIN, sleeveColor: SKIN, pantColor: SKIN,
    shoe: false,                       // BAREFOOT, canon
    torsoShape: { chest: 1.10, waist: 0.86, hip: 0.92 },
    face: { jaw: 1.06, chin: 1.10, width: 0.98 },
    palette: { rim: 0xffd8b8, hairRim: 0xfff4c8, outline: 0x0e0a08, accent: ACCENT, energy: ACCENT }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- BOXER BRIEFS -------------------------------------------------------
  // The only real garment. High-cut, so the hip line is visible above it and
  // the leg reads as a leg rather than as a trouser that stops.
  bag.add('cloth', latheY([
    [0.070 * H, 0.406 * H], [0.075 * H, 0.432 * H],
    [0.078 * H, 0.472 * H], [0.074 * H, 0.522 * H], [0.068 * H, 0.545 * H]
  ], 20, 0.82), { chain: torsoChain, color: BRIEFS, blend: 0.05 });
  // the waistband — one darker ring, because a solid black block with no
  // internal line on it reads as a hole at fighting distance
  bag.add('cloth', latheY([
    [0.0795 * H, 0.516 * H], [0.0795 * H, 0.538 * H]
  ], 20, 0.82), { chain: torsoChain, color: 0x2a2d38, blend: 0.05 });

  // ---- THE RECEIPT COAT ---------------------------------------------------
  // FOUR TIERS, shingled. Read the radii down the list: the shoulder tier
  // stands furthest off the body and every tier below it hugs closer, which is
  // what makes the silhouette a bell rather than a cylinder.
  //
  // Tier 0 is bound to the CHEST rather than to the torso chain so the shoulder
  // flare rides the upper body; the rest ride the full chain so the coat bends
  // when he does.
  const chestChain = [
    { bone: 'Chest', point: joints.get('Chest') },
    { bone: 'Neck', point: joints.get('Neck') }
  ];
  // tier 0 — SHOULDER / COLLAR. The widest flare and the loudest read.
  coatTier(bag, torsoChain, { n: 26, r: 0.096 * H, y: 0.792 * H, len: 0.115 * H, w: 0.036 * H, flare: 46, seed: 7717 });
  coatTier(bag, torsoChain, { n: 22, r: 0.086 * H, y: 0.812 * H, len: 0.088 * H, w: 0.034 * H, flare: 58, seed: 4231 });
  // tier 1 — CHEST
  coatTier(bag, torsoChain, { n: 24, r: 0.086 * H, y: 0.706 * H, len: 0.108 * H, w: 0.034 * H, flare: 22, seed: 9091 });
  // tier 2 — WAIST
  coatTier(bag, torsoChain, { n: 22, r: 0.080 * H, y: 0.612 * H, len: 0.106 * H, w: 0.033 * H, flare: 16, seed: 3313 });
  // tier 3 — THIGH. Ends above the knee. The raggedest hem: longest jitter.
  coatTier(bag, torsoChain, { n: 22, r: 0.082 * H, y: 0.520 * H, len: 0.124 * H, w: 0.033 * H, flare: 11, seed: 6607 });

  // A few tags stuck on the ARMS and the shoulders themselves — canon says
  // they cover him, and a coat that stops dead at the deltoid reads as a
  // garment he put on rather than as tags he stuck to himself.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s);
    for (let i = 0; i < 3; i++) {
      const f = 0.20 + i * 0.26;
      const p = sh.clone().lerp(el, f);
      const { geo } = receiptTag(0.030 * H, 0.062 * H, false);
      geo.applyMatrix4(new THREE.Matrix4().makeRotationZ((s === 'L' ? 1 : -1) * (0.5 + i * 0.2)));
      geo.translate(p.x + (s === 'L' ? 1 : -1) * 0.028 * H, p.y, p.z + 0.012 * H);
      geo.computeVertexNormals();
      bag.add('cloth', geo, {
        chain: [{ bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }],
        color: i === 1 ? PAPER_DK : PAPER, blend: 0.09
      });
    }
  }

  // ---- 不屈 — "INDOMITABLE", LEFT ARM, canon -------------------------------
  // Two glyphs stacked down the outer upper arm. Built as flat strokes rather
  // than as extruded kanji because fx/kanji.js's extruder is for glyphs that
  // FLY; a tattoo is ink on skin and wants to be a decal.
  //
  // *** TRANSFORM ORDER. *** Every stroke is built at the ORIGIN, rotated to
  // face outward, and only THEN translated onto the arm — the order `tGeo`
  // itself uses. Doing it the other way round (translate, then rotate) spins
  // the piece about the world origin instead of about itself, which threw the
  // whole tattoo two metres into the air beside him. Found in the first
  // viewer pass; the same bug was in the hair below.
  {
    const sh = joints.get('UpArmL'), el = joints.get('LoArmL');
    const armChain = [{ bone: 'UpArmL', point: sh }, { bone: 'LoArmL', point: el }];
    const G = 0.026 * H;                       // glyph half-size
    // the outward normal of the arm's outer face, in the bind pose
    const stroke = (gx, gy, w, h, rotZ, at) => {
      const p = sh.clone().lerp(el, at);
      const geo = tGeo(roundBox(w, h, 0.005, 0.0015), {
        rot: [0, 62, rotZ],
        pos: [p.x + 0.030 * H + gx * 0.42, p.y + gy, p.z + gx * 0.80]
      });
      bag.add('flat', geo, { chain: armChain, color: INK, blend: 0.09 });
    };
    // 不 — a top bar, a descending stem, two splayed legs
    stroke(0, G * 0.70, G * 1.30, G * 0.16, 0, 0.28);
    stroke(0, -G * 0.06, G * 0.16, G * 1.28, 0, 0.28);
    stroke(-G * 0.40, -G * 0.34, G * 0.70, G * 0.14, 34, 0.28);
    stroke(G * 0.38, -G * 0.30, G * 0.58, G * 0.14, -40, 0.28);
    // 屈 — the 尸 hood and the 出 under it
    stroke(-G * 0.08, G * 0.72, G * 1.16, G * 0.15, 0, 0.60);
    stroke(-G * 0.60, G * 0.06, G * 0.15, G * 1.30, 0, 0.60);
    stroke(-G * 0.08, G * 0.16, G * 0.90, G * 0.13, 0, 0.60);
    stroke(0, -G * 0.28, G * 0.78, G * 0.13, 0, 0.60);
    stroke(0, -G * 0.70, G * 0.90, G * 0.14, 0, 0.60);
  }

  // ---- FACE ---------------------------------------------------------------
  // HALF-LIDDED AND SMIRKING. The lash line is dropped and the brows are only
  // slightly tilted — a hard brow tilt would read as anger, and he is never
  // angry, he is amused. `mouthTilt: -9` is the smirk; it is asymmetric
  // because the mouth quad is rotated rather than mirrored.
  addFace(ctx, {
    eyeW: 0.50, eyeH: 0.23, eyeColor: EYE, eyeTilt: 4, lashTilt: 5,
    browTilt: 7, browUp: 1.22, browColor: DARK,
    mouthW: 0.30, mouthTilt: -9, mouthColor: 0x8a4a44
  });
  // the heavy upper lid that makes him look permanently unimpressed
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.50, headR * 0.10, 0.004, 0.002),
      { rot: [0, 0, s * 4], pos: [s * headR * 0.40, headC.y - headR * 0.10 + headR * 0.23 * 0.60, headC.z + headR * 0.645] }),
      { bone: 'Head', color: SKIN });
  }

  // ---- GOATEE -------------------------------------------------------------
  // A chin patch and a thin moustache, both in the dark brow colour. It is
  // SMALL: at bench distance it is a beard, at fighting distance it is a
  // shadow under the mouth, which is the weight the design sheet gives it.
  //
  // *** PASS 3. *** The first version was a 0.30 x 0.26 R block in 0x4a3a26
  // sitting where the mouth is, and at head-close range it read as a bar of
  // dark wood glued to his face — it covered the mouth line entirely. It is
  // now half the size, one value lighter than the brows, sits BELOW the mouth
  // rather than over it, and is broken into a patch plus two thin corner
  // strokes so it has an edge instead of being a rectangle.
  const BEARD = 0x5c4a30;
  // the chin patch, under the lower lip
  bag.add('hair', tGeo(roundBox(headR * 0.21, headR * 0.17, headR * 0.13, headR * 0.05),
    { pos: [0, headC.y - headR * 0.755, headC.z + headR * 0.505] }), { bone: 'Head', color: BEARD });
  // the thin moustache line, well above it and much narrower than the mouth
  bag.add('hair', tGeo(roundBox(headR * 0.29, headR * 0.045, headR * 0.075, headR * 0.02),
    { pos: [0, headC.y - headR * 0.505, headC.z + headR * 0.575] }), { bone: 'Head', color: BEARD });
  // and the two strokes running down past the mouth corners, which is what
  // turns a patch and a line into a goatee
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.045, headR * 0.22, headR * 0.075, headR * 0.018),
      { rot: [0, 0, s * 5], pos: [s * headR * 0.145, headC.y - headR * 0.635, headC.z + headR * 0.545] }),
      { bone: 'Head', color: BEARD });
  }

  // ---- HAIR ---------------------------------------------------------------
  // STRAIGHT, HEAVY, SHEET-LIKE. No tufts, no spikes, no cones. See the
  // reference sheet: the whole point of this hairstyle is that it is ONE MASS,
  // and the roster's usual coneSpike vocabulary would destroy it.
  //
  // *** PASS 2 REBUILD. *** The first pass read as a gold helmet from every
  // angle. Two things were wrong and both are worth writing down:
  //   1. TRANSFORM ORDER. Every panel was translated into place and THEN
  //      rotated, which rotates about the WORLD ORIGIN rather than about the
  //      panel — so the back sheet and both front curtains were flung away
  //      from the head and ended up inside/behind the skull. Everything below
  //      now goes through `tGeo`, which does scale, then rotate, then
  //      translate, in that order.
  //   2. NOT ENOUGH LENGTH OR SEPARATION. The curtains were 1.2-1.5 head radii
  //      and started at the temple, so they never cleared the jaw.
  //
  // *** PASS 3. *** Pass 2 fixed the transform order and it still read as a
  // BOB: everything stopped at the jaw and the back was a smooth dome with no
  // hem. The measurements were the problem and they are worth stating, because
  // "long hair" is a number rather than an opinion. One head radius on this
  // body is 12.1 cm; his crown sits at 1.79 m and his shoulder line at 1.49 m.
  // So hair that reaches the SHOULDER BLADE has to be about 3.4 R, and pass 2's
  // back sheet was 2.3 R — it ended exactly at the shoulder, which is a bob.
  // Everything below is now 3.0-3.6 R, the curtains are 35% wider so they meet
  // the back mass instead of hanging as two separate slabs, and the sheets are
  // half again as thick front-to-back so the mass has volume from the side.
  //
  // Built as: a skull cap, a highlight band, a BACK SHEET to the shoulder
  // blade, two FRONT CURTAINS either side of the face, and the swept parting.
  //
  // skull cap — sits high and back, leaving the forehead visible (no fringe)
  bag.add('hair', tGeo(sphereShell(headR * 1.05, { thetaLength: Math.PI * 0.50, scale: [1.02, 0.90, 1.04] }),
    { rot: [-14, 0, 0], pos: [headC.x, headC.y + headR * 0.12, headC.z - headR * 0.10] }), { bone: 'Head', color: HAIR });
  // the highlight band across the crown — one lighter sheet, which is how
  // straight anime hair gets its shine without a texture
  bag.add('hair', tGeo(sphereShell(headR * 1.068, { thetaLength: Math.PI * 0.17, scale: [1.00, 0.60, 1.02] }),
    { rot: [-40, 0, 0], pos: [headC.x, headC.y + headR * 0.18, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR_HI });

  // A FALL OF HAIR, the one primitive this whole hairstyle is made of.
  //
  // *** PASS 4. *** Pass 3 got the LENGTH right and the SHAPE wrong: a linear
  // taper on a box gives a slab with square corners, and at head-close range
  // the silhouette read as a rigid headdress rather than as hair. Three
  // changes, and each is a thing real long hair does that a tapered box does
  // not:
  //   · THE HEM IS ROUNDED, not cut. The last fifth of the length pulls in on
  //     BOTH axes on a curve, so the bottom corners are radiused away.
  //   · THE PROFILE BOWS. It is widest about a third of the way down rather
  //     than at the very top, because hair leaves the scalp narrow, swells
  //     over the skull and then falls.
  //   · IT LEANS IN. The whole sheet drifts toward the centre line as it
  //     descends, which is what stops two curtains reading as two planks.
  const hairSheet = (w0, w1, len, thick, inward = 0.10) => {
    const g = roundBox(w0, len, thick, thick * 0.30, 1);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const yy = p.getY(i);
      const f = (len * 0.5 - yy) / len;              // 0 at the top, 1 at the hem
      // the bow: narrow at the scalp, widest at f = 0.33, falling away after
      const bow = 1 + 0.16 * Math.sin(Math.min(1, f / 0.33) * Math.PI * 0.5) - 0.10 * f;
      // the linear taper toward the hem
      let k = (1 - (1 - w1 / w0) * f) * bow;
      // and the rounded hem: the last fifth pulls in hard on a quarter-circle
      if (f > 0.80) {
        const e = (f - 0.80) / 0.20;
        k *= Math.sqrt(Math.max(0, 1 - e * e * 0.86));
      }
      p.setX(i, p.getX(i) * k + w0 * inward * f * f);  // the inward lean
      p.setZ(i, p.getZ(i) * (1 - 0.34 * f) * (f > 0.80 ? Math.sqrt(Math.max(0.05, 1 - ((f - 0.80) / 0.20) ** 2 * 0.7)) : 1));
    }
    g.computeVertexNormals();
    g.translate(0, -len * 0.5, 0);                   // hang from the origin
    return g;
  };

  // BACK SHEET — one broad mass down to the shoulder blade, five panels so the
  // hem can be ragged and the sheet can wrap the skull. This is the angle the
  // first pass lost completely.
  // SEVEN panels, FANNED around the back of the skull on a real arc — pass 3's
  // five wide panels met edge to edge in a straight line and made a wall.
  //
  // *** PASS 5, AND IT IS A COLOUR NOTE RATHER THAN A SHAPE ONE. *** The
  // measured extent was right from pass 3 onward (the mass reaches y = 1.35 on
  // a 1.86 body, which is below the shoulder line at 1.49 and nearly at the
  // chest) — what made it read as a rigid headdress was that adjacent panels
  // ALTERNATED between HAIR and HAIR_DK. At head-close range that produced a
  // row of hard vertical stripes, i.e. a picket fence, and the eye read the
  // stripes as the object's edges rather than as shading.
  //
  // They are now all one value with only the two OUTERMOST panels dropped,
  // which is where a real head of hair actually shades — the sides curving
  // away from the light — and the panels overlap by a third of their width so
  // the mass is continuous. The inverted-hull outline gives the silhouette its
  // edge; it does not need help from the interior.
  for (let i = 0; i < 7; i++) {
    const f = (i - 3) / 3;                            // -1 .. 1 across the back
    const a = f * 1.05;                               // the arc, in radians
    const len = headR * (3.50 - Math.abs(f) * 0.72);  // longest at the centre
    bag.add('hair', tGeo(hairSheet(headR * 0.74, headR * 0.42, len, headR * 0.34, 0.16), {
      rot: [7 - Math.abs(f) * 5, f * -34, f * 11],
      pos: [
        Math.sin(a) * headR * 0.86,
        headC.y + headR * (0.30 - Math.abs(f) * 0.10),
        headC.z - Math.cos(a) * headR * 0.74
      ]
    }), { bone: 'Head', color: Math.abs(f) > 0.66 ? HAIR_DK : HAIR });
  }
  // the nape mass, filling the gap between the cap and the sheet
  bag.add('hair', tGeo(hairSheet(headR * 1.46, headR * 1.30, headR * 0.72, headR * 0.52, 0), {
    rot: [14, 0, 0], pos: [headC.x, headC.y + headR * 0.34, headC.z - headR * 0.44]
  }), { bone: 'Head', color: HAIR });

  // FRONT CURTAINS — two heavy locks either side of the face, the LEFT one
  // longer and swept across the brow. This asymmetry IS the parting.
  //
  // *** PASS 6, AND THIS IS THE ONE THAT FIXED IT. *** Passes 3-5 all read as
  // a headdress, and the diagnosis only arrived after shooting the model with
  // `HAIR` temporarily set to pure red so that every piece carrying that value
  // could be picked out of the render. What it showed was unambiguous and was
  // not what any of the previous passes had guessed:
  //
  //   THE CURTAINS WERE THE RIGHT LENGTH AND THE WRONG WIDTH AND PLACE. At
  //   0.58-0.80 R wide and sitting at x = ±0.94 R with z pushed BEHIND the
  //   face plane, they rendered as two narrow posts standing away from the
  //   head with a visible gap between each post and the cheek. Long hair does
  //   not do that. It touches the face.
  //
  // So: 1.06 R wide (nearly half the head), pulled IN to ±0.76 R, and brought
  // FORWARD to sit against the cheek rather than behind the ear. The result is
  // that the mass is continuous from the crown down past the jaw, which is
  // what the reference sheet actually shows and what every previous pass was
  // missing while getting the measurements technically correct.
  for (const [side, len, lean, twist] of [[1, 3.30, 6, -9], [-1, 2.85, 4, 6]]) {
    bag.add('hair', tGeo(hairSheet(headR * 1.06, headR * 0.50, headR * len, headR * 0.52, 0.16), {
      rot: [3, side * twist, side * lean],
      pos: [side * headR * 0.76, headC.y + headR * 0.40, headC.z + headR * 0.10]
    }), { bone: 'Head', color: HAIR });
    // a second thinner lock behind it, one value down, so the mass has depth
    // from the three-quarter angle instead of reading as a single card
    bag.add('hair', tGeo(hairSheet(headR * 0.70, headR * 0.40, headR * (len - 0.70), headR * 0.40, 0.14), {
      rot: [2, side * (twist + 20), side * (lean + 6)],
      pos: [side * headR * 0.92, headC.y + headR * 0.34, headC.z - headR * 0.36]
    }), { bone: 'Head', color: HAIR_MID });
    // and the TEMPLE BRIDGE — a short wedge tying the curtain to the skull cap
    // above the ear. Without it the curtain starts in mid-air and the whole
    // hairstyle reads as a wig sitting on him rather than as growing out of him.
    bag.add('hair', tGeo(hairSheet(headR * 0.62, headR * 0.52, headR * 0.66, headR * 0.50, 0), {
      rot: [4, side * 14, side * 26],
      pos: [side * headR * 0.66, headC.y + headR * 0.66, headC.z + headR * 0.06]
    }), { bone: 'Head', color: HAIR });
  }

  // THE SWEPT STRAND across the brow — the parting, made visible from the front
  bag.add('hair', tGeo(roundBox(headR * 0.94, headR * 0.22, headR * 0.24, headR * 0.06), {
    rot: [6, 0, -19], pos: [headR * 0.14, headC.y + headR * 0.46, headC.z + headR * 0.58]
  }), { bone: 'Head', color: HAIR_HI });
  // and the shorter counter-strand on the other side of the part
  bag.add('hair', tGeo(roundBox(headR * 0.52, headR * 0.18, headR * 0.22, headR * 0.05), {
    rot: [6, 0, 26], pos: [-headR * 0.44, headC.y + headR * 0.50, headC.z + headR * 0.54]
  }), { bone: 'Head', color: HAIR });

  // sideburn wisps in front of the ears, so the curtains attach to a head
  for (const side of [1, -1]) {
    bag.add('hair', tGeo(hairSheet(headR * 0.18, headR * 0.11, headR * 0.78, headR * 0.16), {
      rot: [0, 0, side * 4], pos: [side * headR * 0.94, headC.y + headR * 0.14, headC.z + headR * 0.10]
    }), { bone: 'Head', color: HAIR_DK });
  }

  // ---- SPRINGS ------------------------------------------------------------
  // The hem of the bottom tier and the two shoulder flares. A man wearing four
  // hundred loose paper tags cannot stand still, and this is the cheapest way
  // to say so — three chains, no animation code.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.007 };
  const springs = [];
  for (const [bx, bz] of [[-0.052, 0.048], [0.052, 0.048], [-0.048, -0.052], [0.048, -0.052]]) {
    springs.push({
      bone: 'Hips', localOffset: v3(bx * H, -0.055 * H, bz * H),
      restDir: v3(bx * 0.5, -1, bz * 0.5).normalize(), stiffness: 62, damping: 0.80, gravity: 9,
      segments: [
        { len: 0.058 * H, mesh: makeFlapMesh(0.052 * H, 0.040 * H, 0.058 * H, 0.006, clothMat, PAPER, oOpts) },
        { len: 0.042 * H, mesh: makeFlapMesh(0.040 * H, 0.028 * H, 0.042 * H, 0.005, clothMat, PAPER_DK, oOpts) }
      ]
    });
  }
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Chest', localOffset: v3(s * 0.086 * H, 0.010 * H, 0.030 * H),
      restDir: v3(s * 0.55, -0.82, 0.16).normalize(), stiffness: 74, damping: 0.78, gravity: 8,
      segments: [
        { len: 0.052 * H, mesh: makeFlapMesh(0.046 * H, 0.034 * H, 0.052 * H, 0.006, clothMat, PAPER, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.011, outlineHairScale: 1.1 });

  // ---- THE COAT THINS AS HE SPENDS ----------------------------------------
  // Gameplay hook, read by combat/receipts.js. As the stock empties the loose
  // tags on his arms and the sprung hem fade out, so a broke Reggie is
  // VISIBLY broke from across the arena without a glance at the HUD. It is a
  // material fade rather than geometry removal: rebuilding the coat mid-round
  // would hitch, and the tiers are merged into one mesh anyway.
  //
  // Clamped to a 0.34 floor. At zero the coat would vanish and he would read
  // as a different character; at 0.34 he reads as a man who has spent most of
  // what he had, which is the actual state.
  let stockView = 1;
  // *** `makeFlapMesh` RETURNS A GROUP, NOT A MESH. *** It builds the flap and
  // its outline hull and hands back the pair, so `.material` on it is
  // undefined — which threw once per frame for the whole match the first time
  // this ran in the playtest harness, silently, because a material write in a
  // model hook has nobody to report to. Collected by traversal instead, which
  // also picks up the outline hulls so the coat's EDGE fades with it rather
  // than being left behind as a black outline round nothing.
  const flapMats = [];
  for (const sp2 of springs) {
    for (const seg of sp2.segments) {
      seg.mesh.traverse?.(o => { if (o.material) flapMats.push(o.material); });
    }
  }
  model.setStock = v => {
    stockView = Math.max(0, Math.min(1, v));
    const o = 0.34 + 0.66 * stockView;
    for (const mm of flapMats) { mm.transparent = o < 0.995; mm.opacity = o; }
  };
  model.stockView = () => stockView;
  return model;
}
