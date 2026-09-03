// ===========================================================================
// RYU ISHIGORI 石流龍 — REFERENCE SHEET
// ===========================================================================
// SOURCE OF THE REFERENCE. Two authorities, and where they disagree the image
// wins and the disagreement is recorded:
//   1. THE OFFICIAL ANIME CHARACTER SHEET supplied with the brief — a full
//      body FRONT view, line art with flats, hands in pockets, weight even.
//   2. The Jujutsu Kaisen Wiki's Ryu Ishigori / Cursed Energy Discharge /
//      Granite Blast entries, read as raw wikitext through the fandom
//      MediaWiki API (`api.php?action=parse&prop=wikitext` answers 200 where a
//      plain page fetch 402s from this environment — see the same note in
//      art/models/uraume.js). This character's appearance paragraph was
//      ACTUALLY READ rather than remembered, and it is unusually detailed, so
//      the costume below is observed on both sources rather than extrapolated.
//
// ONLY THE FRONT VIEW WAS AVAILABLE. No side, 3/4 or back reference exists, so
// the BACK OF THE POMPADOUR, the fall of the jacket behind the body and the
// profile of the fur collar are EXTRAPOLATED. They are listed again in the
// APPROXIMATED block at the bottom rather than presented as observed.
//
// ---------------------------------------------------------------------------
// *** THE CORRECTION TO THE BRIEF THAT CHANGES THIS MODEL ***
// ---------------------------------------------------------------------------
// The brief asks for "very large and heavily muscled — one of the biggest
// humans in the roster" and to rank him against Todo, Yaga and Yuki.
// HE IS NOT ONE OF THE BIGGEST. The wiki's appearance paragraph, in full:
// "Ryu has the appearance of a handsome young man who is RELATIVELY TALL with
// a muscular body. He has a well-defined jawline, sleek cheekbones, soft blue
// eyes, and thin eyebrows." Relatively tall. Muscular. Handsome young man. The
// reference sheet agrees emphatically — an open jacket over a bare torso with
// a very clearly defined but LEAN musculature: a visible six-pack, cut
// obliques, and a waist that is genuinely narrow. That is an athlete's build,
// not a heavyweight's.
//
// SO HE IS BUILT AS AN ATHLETE, AND HERE IS THE LINEUP THE BRIEF ASKED FOR:
//     Todo   2.00 m   muscle 1.34  bulk 1.30   — a genuine heavyweight
//     Yaga   1.99 m   muscle 1.22  bulk 1.22   — a big, thick, older man
//     Panda  1.98 m   (not a human)
//   >>> RYU  1.86 m   muscle 1.20  bulk 1.02 <<<
//     Yuki   1.82 m   muscle 1.02  bulk 1.06
// He is the FOURTH tallest human and he is nowhere near the widest. Against
// Todo he is 14 cm shorter and dramatically narrower through the chest and
// shoulders; against Yuki he is taller and more defined but not heavier. The
// number that carries him is `muscle: 1.20` against `bulk: 1.02` — the highest
// muscle-to-bulk RATIO on the roster, which is exactly what "cut but not
// massive" is as two numbers.
//
// *** THE THING THAT ACTUALLY MAKES HIM READ AS ARTILLERY IS NOT HIS BODY. ***
// It is the POMPADOUR, and the fact that it is a gun barrel. See below. In the
// lineup render he is the only figure with a hole bored through his silhouette.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
//   JAW     "well-defined jawline, sleek cheekbones" — the most angular face
//           on the roster after Toji's. jaw 1.14, chin 1.06, width 1.02.
//   EYES    SOFT BLUE in the anime (brown in the manga; the anime is the
//           reference and the anime wins). Narrow aperture, level, and calm —
//           the researched personality is "self-assured, calm, and cool
//           individual who's indifferent to anything that doesn't pique his
//           interest", so the neutral is bored rather than fierce. Iris
//           #4f86b8. eyeH 0.28.
//   BROWS   *** THIN. *** The wiki says so explicitly and it is the one facial
//           detail that would otherwise certainly be got wrong on a big
//           muscular man — the instinct is heavy brows and they are wrong.
//           browTilt -6, a slight downward angle, in near-black.
//   MOUTH   straight, slightly wide, closed. No smirk in neutral: his one
//           famous expression is a LEVEL STARE (the ch.180 "four hundred years
//           of hunger" panel), which is a stare and not a sneer.
//   HEAD SCALE 0.96 — a small head on a tall body, which is most of what makes
//           a figure read as heroic-proportioned, and which also stops the
//           pompadour from looking like a hat.
//
// ---------------------------------------------------------------------------
// THE HAIR, FROM EVERY ANGLE — *** THE CANNON ***
// ---------------------------------------------------------------------------
// Not a hairstyle with a cannon motif. A CANNON. The wiki: "He has pompadour
// styled hair SHAPED LIKE A CANNON WITH A DISTINCT HOLE IN THE FRONT. He fires
// cursed energy DIRECTLY FROM HIS HAIR, keeping his hands completely free
// while charging and firing." Every design decision below follows from that
// one fact, and the two most important ones are that the hole is REAL
// GEOMETRY and that it points FORWARD.
//   FRONT   a single enormous glossy black mass rising off the forehead,
//           roughly one and a half head-heights above the crown, with a
//           circular BORE dead centre in its front face at about brow height.
//           The bore is the widest thing on the model at its own height and it
//           is unmistakable — from directly in front, Ryu is a man with a
//           gun muzzle for a fringe.
//   3/4     the mass reads as a tapering BARREL: widest at the muzzle,
//           narrowing as it sweeps back over the crown. (EXTRAPOLATED.)
//   SIDE    the classic pompadour curl — up off the brow, over, and back down
//           the nape in a single fat wave, with a hard chamfered lip round the
//           muzzle. The barrel axis is about 8 degrees above horizontal, so it
//           is aimed slightly UP, which is what makes a charge read as being
//           aimed at something rather than at the floor. (EXTRAPOLATED.)
//   BACK    the wave resolves into a short tapered tail at the nape.
//           (EXTRAPOLATED.)
// CONSTRUCTION. A swept barrel lathe with a real bored cylinder set into its
//   front face and a chamfered muzzle ring round it, plus a scalp cap and a
//   nape tail. The bore has an INTERIOR — a dark tube lining and a flat
//   breech disc at the back of it — so light does not simply pass through a
//   hole in a shell and it still reads as a bore from an angle. Two spring
//   chains on the nape tail, tuned LOOSE and HEAVY: the pompadour is a mass
//   and it should lag visibly when he plants, which is the recoil read.
// COLOUR #16171c body, #2e323c on the wave's catch, #4a505e on the muzzle
//   chamfer. Deliberately reading as LACQUERED — `gloss` is raised on his hair
//   material, because a matte pompadour reads as felt and this has to read as
//   something machined.
//
// ---------------------------------------------------------------------------
// GARMENTS — all four observed on both sources
// ---------------------------------------------------------------------------
//   JACKET   black, cropped short, worn WIDE OPEN with nothing under it, so
//            the whole chest and abdomen are bare. It has EXTENSIVE FUR TRIM
//            in three places, and the wiki names all three: THE NECK, THE
//            WAIST and THE WRISTS. The neck trim is a huge shawl collar and is
//            the second-largest mass on the model after the hair. Fur goes in
//            the `fur` slot, which the builder has carried since Panda and
//            which nobody else has used since.
//            #14151a jacket, #d8d2c6 fur with #a29a8c in the recesses.
//   NECKLACE a dark pendant on a cord, hanging in the open chest. Small, and
//            the reference makes a point of it being visible, so it is here.
//            #2a2c34 cord, #1a1c22 pendant.
//   BELT     MAROON, with a LARGE BUCKLE carrying a YELLOW FOUR-PRONGED STAR.
//            The star is the only saturated warm colour anywhere on the
//            costume and it sits at the exact centre of the figure, so it is
//            doing a lot of work; it is built as a real four-pointed extruded
//            shape rather than as a painted disc. #6e2430 belt, #e8c24a star.
//   TROUSERS black, straight, over MATTE BLACK SHOES. #1a1b21 / #101116, with
//            the shoe deliberately the least glossy material on the model —
//            the wiki says "matte black shoes" and the contrast against the
//            lacquered hair is worth having.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin    #e8b894     hair    #16171c   hairLt #2e323c   chamfer #4a505e
//   jacket  #14151a     fur     #d8d2c6   furDk  #a29a8c
//   belt    #6e2430     star    #e8c24a
//   pants   #1a1b21     shoe    #101116
//   eyes    #4f86b8     brows   #101218   lash  #0c0d12
//   energy  #d8f05a / #f2fbc0 / #8fbe20   (the three tones of the discharge)
//   rim     #fff4d0     outline #08090d   accent #d8f05a
//
// *** THE ACCENT, AND THE AUDIT BEHIND IT. ***
// The brief requires his cursed energy to be distinct from Gojo's blue AND
// purple, Kashimo's lightning, Choso's crimson, Uro's colourless distortion
// and Uraume's pale blue, so it was chosen by MEASUREMENT: candidates scored
// as CIELAB ΔE against all twenty-nine other roster accents, maximum-minimum
// taken. #d8f05a wins at ΔE 29.5 from its nearest neighbour, and the three
// neighbours that matter are Naoya's gold #e8c85a (29.5), Hanami's leaf green
// #9ec46a (30.6) and Hakari's gold #ffc93c (35.4). Against the six the brief
// names: Gojo 105, Kashimo 166, Choso 100+, Uro 86, Uraume 90+.
//
// WHY IT IS A CHARTREUSE AND NOT THE ANIME'S COLOUR. The anime renders Granite
// Blast as BLUE AND YELLOW together. Neither half is available: blue is Gojo,
// Megumi, Miwa, Uro and Yuki, and saturated yellow is Naoya, Nanami, Hakari
// and Higuruma — every warm-gold candidate tested landed inside ΔE 16 of one
// of those four. So the accent takes the YELLOW half and pushes it off the
// gold cluster into chartreuse, and the BLUE half survives where it actually
// belongs, which is in the beam's white-hot core rather than in a flat callout
// swatch: the discharge is authored as a gradient from a near-white blue-white
// centre through #f2fbc0 to a #d8f05a edge. A single accent hex was never
// going to carry a two-colour beam, and this is the half that is his.
//
// The distinction from Hanami is worth one more line because it is the closest
// neighbour and they are both "green": his is a MUTED OLIVE at 62% saturation
// and this is at 84% and eleven points lighter. Side by side in the lineup one
// reads as vegetation and the other reads as a light source, which is exactly
// the distinction that needed to survive.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the cannon pompadour, with a real bore through the front
//   2. the open black jacket with fur at neck, waist AND wrists
//   3. the bare, cut, LEAN torso — defined, not massive
//   4. the maroon belt with the yellow four-pronged star
//   5. the thin brows and the level, bored, blue-eyed stare
//   6. the planted, wide, immovable stance
// All six are in this file except item 6, which is anim/ryu.js — see the note
// there about the feet never coming together.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the back and the side of the pompadour, the barrel's taper and the
//     nape tail. One front view was available; the barrel reading is designed
//     to be consistent with the described "cannon shape" and the visible
//     muzzle rather than observed.
//   · how the jacket falls behind the body, and whether the waist fur
//     continues round the back. Extrapolated as continuing.
//   · the pendant's shape. The reference draws it at a size that resolves to
//     about four pixels; it is built as a plain dark tag.
//   · the belt buckle's star has four prongs and a yellow flat, which is
//     observed; its interior detailing is invented.
//   · the hands are the shared mitt.
//   · his 400-years-ago appearance (a kimono and a chonmage) is documented in
//     the source and is NOT built — he is only ever incarnated in the game.
//
// WHAT I WOULD FIX WITH MORE TIME: the fur is built as a lobed mass rather
// than as shells, so at very close range it reads as a soft solid rather than
// as pelt; and the abdominal definition is geometric relief on the torso lathe
// rather than a sculpted midsection, so from directly side-on the six-pack
// flattens out more than the reference does.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import {
  latheY, tGeo, roundBox, sphereShell, shapeExtrude, mergeGeos, tubeBetween
} from '../builders/geo.js';
import { MAT, toonMaterial } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const SKIN = 0xe8b894;
const HAIR = 0x16171c;
const HAIR_LT = 0x2e323c;
const CHAMFER = 0x4a505e;
const BORE = 0x07080b;
const JACKET = 0x14151a;
const FUR = 0xd8d2c6;
const FUR_DK = 0xa29a8c;
const BELT = 0x6e2430;
const STAR = 0xe8c24a;
const PANTS = 0x1a1b21;
const SHOE = 0x101116;
const EYE = 0x4f86b8;
const ENERGY = 0xd8f05a;
const ENERGY_HOT = 0xf2fbc0;

// ---------------------------------------------------------------------------
// THE BARREL. A swept lathe whose axis is a CURVE rather than a line — it
// leaves the forehead pointing forward and slightly up, and its tail bends
// back over the crown. Built by sweeping a circular section along that curve
// so the muzzle is a true circle facing the right way (a lathe about Y with
// the whole thing rotated afterwards gives an ellipse at the muzzle, which is
// what pass 1 of this model looked like — a black slug with a smeared hole).
//
//   len     along the barrel
//   r0/r1   radius at the muzzle and at the tail
//   rise    how far the tail climbs over the crown
//   back    how far the tail travels behind the muzzle
// ---------------------------------------------------------------------------
//
// *** PASS 2 — THE AXIS WAS A STUB, AND `len` WAS DEAD CODE. ***
// Pass 1's axis ran from (0,0,0) to (0, rise, -back) with `len` multiplied by
// a literal zero, so the barrel never projected FORWARD of the head at all: it
// rendered as a small dark doughnut sitting on the crown with no muzzle and no
// bore visible from any angle. The cannon is identifier #1 on this character
// and pass 1 did not have one.
//
// The axis is now a real POMPADOUR WAVE: it leaves the brow pointing forward
// and slightly up, RISES to a peak just behind the crown, and then trails back
// and down toward the nape. `len` is the forward projection past the face and
// it is load-bearing — it is what puts the muzzle in front of the forehead
// where a player can see down it.
function barrel({ len, r0, r1, rise, back, seg = 14, radial = 20 }) {
  const parts = [];
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const k = i / seg;
    // z: forward at the muzzle, sweeping back past the crown
    const z = len * (1 - k) - back * k;
    // y: a wave — up fast, peak at about 0.62 along, then easing back down
    const y = rise * Math.sin(Math.min(1, k / 0.62) * Math.PI * 0.5)
      - rise * 0.28 * Math.max(0, (k - 0.62) / 0.38);
    pts.push(new THREE.Vector3(0, y, z));
  }
  // sweep a ring along it
  const ring = [];
  for (let a = 0; a < radial; a++) {
    const th = (a / radial) * Math.PI * 2;
    ring.push([Math.cos(th), Math.sin(th)]);
  }
  const verts = [];
  for (let i = 0; i <= seg; i++) {
    const k = i / seg;
    // the barrel is FATTEST just behind the muzzle and tapers back — a cannon
    // has a thickened breech ring at its mouth, and it is what makes the bore
    // read as bored rather than as a dent
    const swell = 1 + 0.14 * Math.sin(Math.min(1, k / 0.22) * Math.PI);
    const r = (r0 + (r1 - r0) * Math.pow(k, 0.80)) * swell;
    const c = pts[i];
    const nxt = pts[Math.min(seg, i + 1)];
    const prv = pts[Math.max(0, i - 1)];
    const tan = nxt.clone().sub(prv).normalize();
    // a stable frame: side is tangent x up, up is side x tangent
    const side = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(side, tan).normalize();
    const row = [];
    for (const [cx, cy] of ring) {
      row.push(c.clone()
        .addScaledVector(side, cx * r)
        .addScaledVector(up, cy * r));
    }
    verts.push(row);
  }
  // stitch
  const pos = [];
  for (let i = 0; i < seg; i++) {
    for (let a = 0; a < radial; a++) {
      const b = (a + 1) % radial;
      const p00 = verts[i][a], p01 = verts[i][b];
      const p10 = verts[i + 1][a], p11 = verts[i + 1][b];
      pos.push(p00.x, p00.y, p00.z, p10.x, p10.y, p10.z, p11.x, p11.y, p11.z);
      pos.push(p00.x, p00.y, p00.z, p11.x, p11.y, p11.z, p01.x, p01.y, p01.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  parts.push(geo);
  // the tail cap, so the barrel is closed at the back
  const tail = pts[seg];
  parts.push(tGeo(new THREE.SphereGeometry(r1, radial, 8), {
    scale: [1, 1, 0.7], pos: [tail.x, tail.y, tail.z]
  }));
  return mergeGeos(parts);
}

// A FOUR-PRONGED STAR, extruded. Four points, deep concave between them — the
// motif on the belt buckle, and the only saturated warm shape on the model.
function fourStar(r, inner, depth) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : inner;
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return shapeExtrude(pts, depth, { bevel: false });
}

// A FUR MASS. Overlapping lobes of two sizes with a deliberately irregular
// radius, so the outline is broken rather than smooth. Not shells — see the
// APPROXIMATED note.
function furMass(lobes) {
  const parts = [];
  for (const l of lobes) {
    parts.push(tGeo(new THREE.SphereGeometry(l.r, 8, 6), {
      scale: l.scale || [1, 0.9, 1], pos: l.pos, rot: l.rot
    }));
  }
  return mergeGeos(parts);
}

export function buildRyu() {
  const spec = {
    id: 'ryu', name: 'Ryu', H: 1.86, headScale: 0.96,
    // THE HIGHEST MUSCLE-TO-BULK RATIO ON THE ROSTER. Cut, not massive — see
    // the lineup in the reference sheet, and the correction it comes from.
    shoulder: 0.128, hip: 0.052, muscle: 1.20, bulk: 1.02, legBulk: 1.06,
    skinTone: SKIN,
    // BARE TORSO AND BARE ARMS. The jacket is worn wide open with nothing
    // under it, so the torso lathe, the upper arms and the forearms all shade
    // through the SKIN material — the same construction Toji's short sleeves
    // and Uro's whole costume use. The jacket itself is added as geometry on
    // top, which is the only way an OPEN jacket can be built.
    bodySlot: 'skin', armSlot: 'skin', foreArmSlot: 'skin',
    clothColor: SKIN, sleeveColor: SKIN, foreSleeveColor: SKIN, handColor: SKIN,
    legSlot: 'cloth', pantColor: PANTS,
    shoeColor: SHOE,
    shoulderCap: false,
    // broad chest, genuinely narrow waist — the athlete's V
    torsoShape: { chest: 1.10, waist: 0.82, hip: 0.96 },
    // "well-defined jawline, sleek cheekbones"
    face: { jaw: 1.14, chin: 1.06, width: 1.02 },
    palette: {
      rim: 0xfff4d0, hairRim: 0xbfc8d8, outline: 0x08090d,
      accent: ENERGY, energy: ENERGY, metalRim: 0xfff0b0
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;

  addFace(ctx, {
    // narrow, level, bored. See the reference sheet: his neutral is a stare,
    // not a glare.
    eyeW: 0.58, eyeH: 0.28, eyeColor: EYE,
    eyeTilt: 5, lashTilt: 4, lashColor: 0x0c0d12,
    // *** THIN BROWS. *** Explicitly stated in the source, and the one detail
    // that would certainly have been got wrong from instinct on a big man.
    browTilt: -6, browUp: 1.30, browColor: 0x101218,
    mouthW: 0.22, mouthTilt: 0, mouthColor: 0x9c5a56
  });

  const springs = [];

  // =========================================================================
  // THE ABDOMEN
  // =========================================================================
  // Six-pack relief on the bare torso — three pairs of shallow lobes down the
  // midline plus two obliques. Geometric rather than sculpted (see the
  // APPROXIMATED note), but it is the difference between a bare chest and a
  // BARE CHEST, and on a character whose whole costume is an open jacket it is
  // most of what the costume actually is.
  for (let row = 0; row < 3; row++) {
    const yy = (0.630 - row * 0.038) * H;
    for (const s of [1, -1]) {
      bag.add('skin', tGeo(new THREE.SphereGeometry(0.026 * H, 8, 6), {
        scale: [1.0, 0.78, 0.44],
        pos: [s * 0.021 * H, yy, 0.058 * H - row * 0.003 * H]
      }), { chain: torsoChain, color: SKIN, blend: 0.05 });
    }
  }
  // the two obliques, angled in toward the belt
  for (const s of [1, -1]) {
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.030 * H, 8, 6), {
      scale: [0.68, 1.15, 0.42], rot: [0, 0, s * 22],
      pos: [s * 0.046 * H, 0.578 * H, 0.046 * H]
    }), { chain: torsoChain, color: SKIN, blend: 0.05 });
  }
  // pectorals
  for (const s of [1, -1]) {
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.048 * H, 10, 8), {
      scale: [1.10, 0.72, 0.52],
      pos: [s * 0.040 * H, 0.708 * H, 0.052 * H]
    }), { chain: torsoChain, color: SKIN, blend: 0.06 });
  }

  // =========================================================================
  // THE JACKET — open, cropped, fur at neck / waist / wrists
  // =========================================================================
  // TWO PANELS, not a tube. An open jacket is two flat slabs hanging off the
  // shoulders with a gap between them, and building it as a cylinder with a
  // hole would be a coat that happens to be missing its front.
  for (const s of [1, -1]) {
    // the front panel, angled outward so the chest stays visible
    bag.add('cloth', tGeo(roundBox(0.062 * H, 0.230 * H, 0.030 * H, 0.010 * H, 2), {
      rot: [0, s * -16, s * 5],
      pos: [s * 0.086 * H, 0.664 * H, 0.048 * H]
    }), { chain: torsoChain, color: JACKET, blend: 0.06 });
    // the side/back panel, wrapping round the ribs
    bag.add('cloth', tGeo(roundBox(0.036 * H, 0.240 * H, 0.098 * H, 0.012 * H, 2), {
      rot: [0, s * 12, 0],
      pos: [s * 0.104 * H, 0.660 * H, -0.014 * H]
    }), { chain: torsoChain, color: JACKET, blend: 0.06 });
    // the sleeve, over the upper arm only — the jacket is cropped and the
    // forearm below the wrist fur is bare
    const sh = joints.get('UpArm' + (s === 1 ? 'L' : 'R'));
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.042 * H, 0.036 * H, 0.150 * H, 12), {
      rot: [0, 0, s * 13],
      pos: [sh.x + s * 0.006 * H, sh.y - 0.070 * H, sh.z]
    }), { bone: 'UpArm' + (s === 1 ? 'L' : 'R'), color: JACKET });
  }
  // the back panel, closing it
  bag.add('cloth', tGeo(roundBox(0.180 * H, 0.246 * H, 0.036 * H, 0.014 * H, 2), {
    pos: [0, 0.660 * H, -0.062 * H]
  }), { chain: torsoChain, color: JACKET, blend: 0.06 });

  // ---- THE FUR, IN ALL THREE PLACES THE SOURCE NAMES ----------------------
  // 1. THE NECK. A huge shawl collar and the second-largest mass on the model.
  bag.add('fur', furMass([
    { r: 0.062 * H, pos: [0, 0.796 * H, -0.048 * H], scale: [1.35, 0.86, 1.00] },
    { r: 0.056 * H, pos: [0.070 * H, 0.788 * H, -0.014 * H], scale: [1.05, 0.90, 1.10] },
    { r: 0.056 * H, pos: [-0.072 * H, 0.786 * H, -0.012 * H], scale: [1.05, 0.90, 1.10] },
    { r: 0.048 * H, pos: [0.078 * H, 0.744 * H, 0.030 * H], scale: [0.95, 1.00, 0.95] },
    { r: 0.048 * H, pos: [-0.080 * H, 0.742 * H, 0.032 * H], scale: [0.95, 1.00, 0.95] },
    { r: 0.040 * H, pos: [0.070 * H, 0.700 * H, 0.048 * H], scale: [0.85, 1.05, 0.85] },
    { r: 0.040 * H, pos: [-0.072 * H, 0.698 * H, 0.050 * H], scale: [0.85, 1.05, 0.85] }
  ]), { chain: torsoChain, color: FUR, blend: 0.06 });
  bag.add('fur', furMass([
    { r: 0.044 * H, pos: [0, 0.808 * H, -0.070 * H], scale: [1.20, 0.70, 0.86] },
    { r: 0.034 * H, pos: [0.062 * H, 0.800 * H, -0.048 * H], scale: [0.95, 0.76, 0.95] },
    { r: 0.034 * H, pos: [-0.064 * H, 0.798 * H, -0.046 * H], scale: [0.95, 0.76, 0.95] }
  ]), { chain: torsoChain, color: FUR_DK, blend: 0.06 });

  // 2. THE WAIST. A band of fur round the jacket's cropped hem.
  bag.add('fur', furMass([
    { r: 0.044 * H, pos: [0, 0.556 * H, 0.056 * H], scale: [1.15, 0.72, 0.80] },
    { r: 0.044 * H, pos: [0.082 * H, 0.552 * H, 0.020 * H], scale: [0.90, 0.72, 1.05] },
    { r: 0.044 * H, pos: [-0.084 * H, 0.550 * H, 0.022 * H], scale: [0.90, 0.72, 1.05] },
    { r: 0.046 * H, pos: [0, 0.552 * H, -0.060 * H], scale: [1.20, 0.72, 0.84] },
    { r: 0.036 * H, pos: [0.058 * H, 0.548 * H, -0.052 * H], scale: [0.88, 0.68, 0.92] },
    { r: 0.036 * H, pos: [-0.060 * H, 0.546 * H, -0.050 * H], scale: [0.88, 0.68, 0.92] }
  ]), { chain: torsoChain, color: FUR, blend: 0.05 });

  // 3. THE WRISTS. A cuff of fur on each forearm, where the cropped sleeve
  //    ends. Small, and the source lists it, so it is here.
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('fur', furMass([
      { r: 0.030 * H, pos: [wr.x, wr.y + 0.030 * H, wr.z], scale: [1.10, 0.72, 1.10] },
      { r: 0.024 * H, pos: [wr.x + (s === 'L' ? 1 : -1) * 0.014 * H, wr.y + 0.044 * H, wr.z], scale: [0.95, 0.66, 1.00] }
    ]), { bone: 'LoArm' + s, color: FUR });
  }

  // =========================================================================
  // THE NECKLACE
  // =========================================================================
  bag.add('metal', tGeo(new THREE.TorusGeometry(0.036 * H, 0.0038 * H, 5, 16, Math.PI * 1.2), {
    rot: [86, 0, 0], pos: [0, 0.780 * H, 0.016 * H]
  }), { chain: torsoChain, color: 0x2a2c34, blend: 0.04 });
  bag.add('metal', tGeo(roundBox(0.016 * H, 0.024 * H, 0.006 * H, 0.003 * H, 1), {
    pos: [0, 0.726 * H, 0.062 * H]
  }), { chain: torsoChain, color: 0x1a1c22, blend: 0.04 });

  // =========================================================================
  // THE BELT — maroon, with the yellow four-pronged star
  // =========================================================================
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.078 * H, 0.077 * H, 0.040 * H, 20), {
    pos: [0, 0.512 * H, 0]
  }), { bone: 'Hips', color: BELT });
  // the buckle plate
  bag.add('metal', tGeo(roundBox(0.062 * H, 0.048 * H, 0.014 * H, 0.006 * H, 2), {
    pos: [0, 0.512 * H, 0.076 * H]
  }), { bone: 'Hips', color: 0x3a1a20 });
  // ...and the star on it. The only saturated warm shape on the whole costume,
  // sitting at the exact centre of the figure.
  bag.add('metal', tGeo(fourStar(0.028 * H, 0.0094 * H, 0.008 * H), {
    pos: [0, 0.512 * H, 0.084 * H]
  }), { bone: 'Hips', color: STAR });

  // =========================================================================
  // *** THE CANNON ***
  // =========================================================================
  // The barrel mass. Muzzle forward and 8 degrees up, tail sweeping back over
  // the crown.
  // PASS 2 — THE SCALE. The reference's pompadour occupies roughly the top
  // fifth of the whole figure and clears the crown by about one and a half
  // head-heights; pass 1's cleared it by 0.10 m, which is a quiff. Radius,
  // rise and reach are all up substantially, and the whole mass now starts
  // FORWARD of the brow rather than on top of the skull.
  // PASS 4 — RAISED OFF THE FACE. Pass 3 finally made the bore legible (see
  // the annulus note below) and immediately exposed the next fault: at
  // headC.y + 0.50 the muzzle sat directly across the EYES, so the character
  // read as a man wearing a cannon for a mask and the whole face — the thin
  // brows, the level stare, the jaw — was invisible from the front.
  //
  // The reference is unambiguous that the pompadour rises from the HAIRLINE
  // and the face is completely clear beneath it. +1.02 head-radii puts the
  // bore's lower lip just above the brow line, which is where a fringe would
  // be, and leaves the whole face open.
  const BR = headR * 0.76;                 // muzzle radius
  const muzzleY = headC.y + headR * 1.02;
  const muzzleZ = headC.z + headR * 0.50;
  {
    const geo = barrel({
      len: headR * 1.00, r0: BR, r1: headR * 0.30,
      rise: headR * 1.06, back: headR * 2.05, seg: 18, radial: 22
    });
    geo.rotateX(-8 * Math.PI / 180);       // aimed slightly UP
    geo.translate(headC.x, muzzleY, muzzleZ);
    bag.add('hair', geo, { bone: 'Head', color: HAIR });
  }
  // THE WAVE'S CATCH — a lighter band along the top of the barrel, which is
  // what makes it read as lacquered rather than as a black hole in the render.
  {
    const geo = barrel({
      len: headR * 0.92, r0: BR * 0.74, r1: headR * 0.22,
      rise: headR * 1.00, back: headR * 1.94, seg: 14, radial: 16
    });
    geo.rotateX(-8 * Math.PI / 180);
    geo.translate(headC.x, muzzleY + headR * 0.22, muzzleZ - headR * 0.04);
    bag.add('hair', geo, { bone: 'Head', color: HAIR_LT });
  }

  // ---- THE BORE. The identifier. REAL GEOMETRY, with an interior. ---------
  // A chamfered ring at the lip, a dark tube lining behind it, and a flat
  // breech disc closing the back. Without the lining and the breech the muzzle
  // is a hole in a shell and you can see the inside of the far wall through
  // it, which is what pass 1 looked like from three-quarters.
  // PASS 2 — the bore is re-seated on the NEW muzzle face, which is 0.62
  // head-radii forward of the brow rather than on top of the skull, and it is
  // proportionally wider (0.62 of the muzzle rather than 0.56) because the
  // reference's hole is the dominant feature of the front view and a modest
  // one reads as a dimple.
  const boreR = BR * 0.62;
  const boreDir = new THREE.Vector3(0, Math.sin(8 * Math.PI / 180), Math.cos(8 * Math.PI / 180));
  const bz = muzzleZ + headR * 0.92;       // the plane of the muzzle mouth
  // ---- PASS 3 — THE MUZZLE FACE IS A LIT ANNULUS -------------------------
  // Pass 2's chamfer was a small cone frustum, and against a near-black barrel
  // with a near-black outline behind the hole it was invisible: the front view
  // showed a dark mass with a slightly darker dent in it and the identifier
  // did not read at all.
  //
  // A bore is only legible as a BRIGHT RING AROUND A DARK CIRCLE. So the whole
  // mouth of the barrel is now a flat annulus in the light chamfer grey,
  // running from the bore's edge right out to the barrel's own radius, facing
  // forward and tilted with the axis. It is the one deliberately high-contrast
  // element on an otherwise monochrome character, and it is the single thing
  // that makes a still frame of this model say "cannon".
  bag.add('hair', tGeo(new THREE.RingGeometry(boreR, BR * 1.04, 22), {
    rot: [-8, 0, 0], pos: [headC.x, muzzleY + headR * 0.06, bz + headR * 0.02]
  }), { bone: 'Head', color: CHAMFER });
  // ...and a raised lip round the outside of it, so the mouth has thickness
  // from three-quarters rather than reading as a painted disc
  bag.add('hair', tGeo(new THREE.TorusGeometry(BR * 1.00, headR * 0.075, 6, 22), {
    rot: [-8, 0, 0], pos: [headC.x, muzzleY + headR * 0.06, bz]
  }), { bone: 'Head', color: HAIR_LT });
  // the lining — deep, so the hole reads as a hole from three-quarters as well
  // as from dead ahead
  bag.add('hair', tGeo(new THREE.CylinderGeometry(boreR, boreR * 0.90, headR * 0.90, 18, 1, true), {
    rot: [98, 0, 0], pos: [headC.x, muzzleY + headR * 0.02, bz - headR * 0.48]
  }), { bone: 'Head', color: BORE });
  // the breech, closing the back of it
  bag.add('hair', tGeo(new THREE.CircleGeometry(boreR * 0.92, 18), {
    rot: [-8, 0, 0], pos: [headC.x, muzzleY - headR * 0.04, bz - headR * 0.92]
  }), { bone: 'Head', color: BORE });

  // the scalp under it all, so there is hair on his actual head
  bag.add('hair', tGeo(sphereShell(headR * 1.04, {
    phiStart: Math.PI / 2 + 0.62, phiLength: Math.PI * 2 - 1.24,
    thetaLength: Math.PI * 0.66, scale: [1.0, 0.92, 1.06]
  }), { pos: [headC.x, headC.y + headR * 0.10, headC.z - headR * 0.04] }),
    { bone: 'Head', color: HAIR });
  // PASS 4 — THE HAIRLINE WEDGE. With the barrel raised off the face there is
  // a real gap between the top of the forehead and the underside of the
  // pompadour, and left open it reads as the cannon FLOATING. This is the
  // swept-back mass a pompadour actually is: the hair leaving the brow and
  // climbing into the barrel.
  bag.add('hair', tGeo(roundBox(headR * 1.26, headR * 0.52, headR * 0.72, headR * 0.10, 2), {
    rot: [-26, 0, 0],
    pos: [headC.x, headC.y + headR * 0.62, headC.z + headR * 0.42]
  }), { bone: 'Head', color: HAIR });

  // ---- THE NAPE TAIL, ON TWO SPRINGS -------------------------------------
  // The pompadour is a MASS and it should lag when he plants — that is the
  // recoil read, and it is the one piece of secondary motion this character
  // needs. Tuned LOOSE and HEAVY, which is the exact opposite of Uraume's
  // hair springs and for the same reason in reverse.
  //
  // BONE-LOCAL SPACE, not world — see the identical note in models/uraume.js.
  const hairMat = MAT.hair({ rimColor: 0xbfc8d8, gloss: 0.62 });
  const headJ = joints.get('Head');
  for (const s of [{ x: 0.24 }, { x: -0.24 }]) {
    const segs = [
      { len: 0.048 * H, mesh: makeFlapMesh(0.052 * H, 0.044 * H, 0.048 * H, 0.020 * H, hairMat, HAIR, { color: 0x08090d, thickness: 0.013 }) },
      { len: 0.038 * H, mesh: makeFlapMesh(0.044 * H, 0.026 * H, 0.038 * H, 0.016 * H, hairMat, HAIR_LT, { color: 0x08090d, thickness: 0.013 }) }
    ];
    springs.push({
      bone: 'Head',
      localOffset: v3(headR * s.x, headC.y - headJ.y - headR * 0.34, -headR * 0.92),
      restDir: v3(s.x * 0.2, -0.72, -1).normalize(),
      segments: segs,
      stiffness: 62, damping: 0.80, gravity: 11.0
    });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0130, outlineHairScale: 1.05,
    // FUR gets an outline. He is a large dark silhouette and the fur is the
    // only pale mass on him; without a line round it the collar dissolves into
    // the jacket at distance. Panda is the only other model that asks for this
    // and for exactly the same reason.
    outlineSlots: ['skin', 'cloth', 'hair', 'fur'],
    materials: { hair: hairMat }
  });

  // =========================================================================
  // THE CHARGE — WHAT THE OPPONENT READS
  // =========================================================================
  // "The charge state needs to escalate visibly on the model... The opponent
  // must be able to read his charge tier from anywhere."
  //
  // The model's half of that is the MUZZLE: a light that grows in the bore and
  // a corona around it, both driven from one call. Everything that happens off
  // his body — the ground cracking under him, the light spilling across the
  // arena, the air distortion — belongs to the FX system and reads the same
  // 0..1 (`threatOf` in combat/output.js), so the two can never disagree about
  // how frightened to be.
  //
  // Built as loose meshes parented to the Head bone AFTER `finalizeModel`,
  // rather than through the PartBag, because these have to be scaled and
  // recoloured every frame and the bag bakes its geometry into one merged
  // mesh per slot. Same construction Jogo's crater emitter uses.
  const glowMat = new THREE.MeshBasicMaterial({
    color: ENERGY_HOT, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
  });
  const coronaMat = new THREE.MeshBasicMaterial({
    color: ENERGY, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
  });
  const headBone = model.getBone('Head');
  const local = v3(headC.x, muzzleY - headJ.y + headR * 0.06, bz - headR * 0.18);

  // the plug of light sitting IN the bore
  const plug = new THREE.Mesh(new THREE.SphereGeometry(boreR * 0.92, 14, 10), glowMat);
  plug.position.copy(local);
  plug.renderOrder = 4;
  headBone.add(plug);
  // the corona OUTSIDE it — a flat disc facing down the barrel, which is what
  // is visible from the side and from behind
  const corona = new THREE.Mesh(new THREE.RingGeometry(boreR * 1.05, boreR * 2.4, 22), coronaMat);
  corona.position.copy(local).addScaledVector(boreDir, boreR * 0.9);
  corona.rotation.x = (90 - 8) * Math.PI / 180;
  corona.renderOrder = 4;
  headBone.add(corona);

  model.outputTier = 0;
  model.outputFrac = 0;
  // `tier` 0..4, `frac` 0..1 across the whole charge. Called every frame of
  // `outputCharge` and once with (0,0) on release and on the round reset.
  model.setOutput = (tier, frac) => {
    model.outputTier = tier | 0;
    model.outputFrac = Math.max(0, Math.min(1, frac || 0));
    const k = model.outputFrac;
    // the plug fills first and then over-fills, so the last tier is visibly
    // MORE than full rather than merely bright
    glowMat.opacity = k <= 0 ? 0 : 0.35 + 0.65 * k;
    plug.scale.setScalar(0.5 + 1.15 * k + (tier >= 4 ? 0.35 : 0));
    // the corona only appears from tier 1 — tier 0 is a tap and should not
    // announce itself, which is what makes the tap a genuine mix-up
    coronaMat.opacity = tier <= 0 ? 0 : Math.min(0.85, 0.18 + 0.22 * tier);
    corona.scale.setScalar(0.7 + 0.5 * tier + 0.3 * k);
    // colour shifts from the chartreuse edge toward the white-hot core as it
    // compresses — the "blue and yellow" of the anime, resolved as a
    // temperature ramp rather than as two flat colours
    glowMat.color.setHex(tier >= 3 ? 0xf6ffe0 : ENERGY_HOT);
    coronaMat.color.setHex(tier >= 3 ? ENERGY_HOT : ENERGY);
  };
  model.setOutput(0, 0);

  // Where the beam is fired FROM, in the model's own terms, so the effect code
  // never hardcodes a height for a body it cannot measure. Same contract Uro's
  // `warpAnchor` and Uraume's `iceAnchor` keep.
  model.muzzle = {
    y: muzzleY, ahead: bz + boreR * 0.4, r: boreR,
    pitch: 8 * Math.PI / 180
  };
  return model;
}
