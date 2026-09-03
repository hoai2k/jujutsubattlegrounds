// HANAMI — 花御. Special-grade cursed spirit, Disaster Plants.
//
// ============================ REFERENCE SHEET ============================
// RESEARCHED from the JJK wiki character description, the Disaster Plants
// technique page and MAPPA S1 key art (see the report accompanying this
// change). Original geometry throughout — nothing imported.
//
// BUILD    TALL AND BROAD — the biggest thing on the roster short of
//          Mahoraga. H 2.15 against Todo's 2.00, Gojo's 1.92, Yuji's 1.75.
//          Enormously wide shoulders, a thick trunk of a torso, short heavy
//          legs. He does not read as a large man; he reads as a standing tree
//          that has decided to walk. From the SIDE the silhouette is a
//          forward-leaning wedge — chest out, head low and thrust forward on
//          almost no neck; from BEHIND it is a slab of plated back with the
//          branch crown breaking the outline above and vines hanging off the
//          shoulders.
//
// SKIN     Not skin: BARK. Tan-beige (#c8b489) with vertical grain and BLACK
//          BANDS running across the whole body — the wiki's exact read. They
//          are RINGS of geometry standing proud of the trunk and the limbs, so
//          they survive the cel bands and read at silhouette distance, which a
//          painted stripe would not.
//
// HEAD     The identifier, and it has five parts:
//          1. A HELMET-LIKE wooden dome over the whole upper skull with a
//             HARD LOWER RIM. The wiki is explicit that the helm "doesn't
//             cover their teeth", so that rim is the most important edge on
//             the model — everything below it is mouth.
//          2. BIG BLUNT TEETH, uppers hanging off the rim and lowers rising
//             off the jaw, PROUD OF THE FACE so they catch light, over a dark
//             recess. They are permanently bared.
//          3. BRANCHES INSTEAD OF EYES: two woody growths out of the sockets,
//             sprouting forward and up. ASYMMETRIC — the left is long and
//             forks three ways, the right is stubbier and forks twice. Canon
//             makes these his weak point and gets them destroyed, so they are
//             deliberately large, obvious and targetable.
//          4. TWO BLACK LINES that ZIG ZAG down the face, one per side.
//          5. A crown of branch growths sweeping BACK off the skull, with
//             flowering matter woven through them.
//
// ARMS     Disproportionately large and CLUB-LIKE: the forearm swells into a
//          rounded mass and caps off blunt. Canon asymmetry, kept exactly —
//          the LEFT arm is entirely BLACK with WHITE fingers; the RIGHT arm is
//          bark-tan with BLACK fingers. It is the fastest way to tell which
//          hand is coming and it is straight off the reference.
//
// CLOTH    A coarse undyed wrap over the shoulders and a heavy drape from the
//          waist to the knee. Woven, not tailored.
//
// GROWTH   Moss packed into the crevices — joint seams, plate edges, the
//          insides of the shoulder shells. Flowers and vines are REAL GEOMETRY
//          on spring chains (shoulders and crown) so they lag and swing when
//          he moves; nothing about him is a decal.
//
// PALETTE  bark #c8b489 · bark shadow #a08a63 · grain #8e774f ·
//          black bands / left arm #1b1a18 · white fingers #ece5d2 ·
//          teeth #ddd2b2 · mouth interior #241d16 ·
//          branch #6a4f34 · branch tip #513a26 · moss #4a6b3a ·
//          leaf #3d6b38 · flower #f2ead8 · flower heart #e8bcc6 ·
//          cloth #8f8467
//          Deliberately EARTHY AND DESATURATED — it has to sit dead against
//          Jogo's molten orange (#ff5a1f) and Mahito's sickly blue-grey
//          (#8b9bab) with no hue in common with either.
//
// IDENTITY 1) the branch-eyed wooden helm with the teeth bared under its rim
//          2) the one black club arm with white fingers
//          3) the mass — broad, banded, rooted, slower than anything else.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tubeBetween, tGeo, roundBox, coneSpike, sphereShell, mergeGeos } from '../builders/geo.js';
import { toonMaterial } from '../../shaders/toon.js';
import { v3, rand, DEG } from '../../../core/math.js';

const BARK = 0xc8b489;
const BARK_DK = 0xa08a63;
const GRAIN = 0x8e774f;
const BLACK = 0x1b1a18;
const PALE = 0xece5d2;
const TEETH = 0xddd2b2;
const MOUTH = 0x241d16;
const BRANCH = 0x6a4f34;
const BRANCH_TIP = 0x513a26;
const MOSS = 0x4a6b3a;
const LEAF = 0x3d6b38;
const FLOWER = 0xf2ead8;
const HEART = 0xe8bcc6;
const CLOTH = 0x8f8467;

// BARK GRAIN. Fine vertical striation with a slow horizontal wobble, so the
// trunk reads as timber rather than as a painted cylinder. Kept low-contrast:
// the cel bands do the heavy lifting and a loud grain fights them.
function grainFn(base, dark) {
  const a = new THREE.Color(base), b = new THREE.Color(dark), c = new THREE.Color(GRAIN);
  return (x, y, z) => {
    const n = Math.sin(y * 46 + Math.sin(x * 7 + z * 5) * 2.2);
    const knot = Math.sin(x * 13 + y * 3.1) * Math.sin(z * 11 - y * 2.4);
    if (knot > 0.72) return c;
    return n > 0.35 ? b : a;
  };
}

// One woody branch: a tapered tube from `at` along `dir`, forking `depth`
// times. The head's whole identity, so it is authored recursively rather than
// as a stack of cones — the forks have to be irregular and they have to be
// different on each side.
function branchGeo(at, dir, len, r, depth, seed = 0) {
  const parts = [];
  const end = at.clone().addScaledVector(dir, len);
  end.y -= len * 0.08;                        // nothing on him grows straight
  parts.push(tubeBetween(at, end, [r, r * 0.66], { radial: 6, hSeg: 3 }));
  if (depth <= 0) {
    parts.push(tGeo(new THREE.SphereGeometry(r * 1.2, 6, 5), { pos: [end.x, end.y, end.z] }));
    return parts;
  }
  const forks = depth >= 2 ? 3 : 2;
  for (let i = 0; i < forks; i++) {
    const a = (i - (forks - 1) / 2) * 0.66 + Math.sin(seed * 3.7 + i) * 0.22;
    const t = Math.cos(seed * 2.3 + i * 1.9) * 0.36;
    const d2 = dir.clone()
      .applyAxisAngle(v3(0, 1, 0), a)
      .applyAxisAngle(v3(1, 0, 0), t - 0.10)
      .normalize();
    parts.push(...branchGeo(end, d2, len * (0.66 + (i % 2) * 0.1), r * 0.66, depth - 1, seed + i + 1));
  }
  return parts;
}

export function buildHanami() {
  const spec = {
    id: 'hanami', name: 'Hanami', H: 2.15,
    // a BIG head: the helm is the character, and at the roster's usual head
    // ratio on a 2.15 m body it disappeared entirely
    headScale: 1.34,
    shoulder: 0.150, hip: 0.062, muscle: 1.34, bulk: 1.26, legBulk: 1.24,
    skinTone: BARK,
    // his BODY is bark, so the torso and arms come out of the skin slot (which
    // this file re-materials as bark below) rather than the cloth slot
    bodySlot: 'skin', armSlot: 'skin',
    // canon: "Hanami wears BLACK, baggy pants secured by a white sash". The
    // legs were bark-shadow, which left them reading as more trunk and lost
    // the dark base the whole tan figure sits on.
    clothColor: CLOTH, pantColor: BLACK, sleeveColor: BARK, shoeColor: BRANCH,
    torsoShape: { chest: 1.14, waist: 1.08, hip: 1.06 },
    // a blunt, wide, barely-tapered skull: this is a helm, not a jaw
    face: { jaw: 0.40, chin: 0.14, width: 1.14, faceFlat: 0.50 },
    shoe: { len: 0.13, hgt: 0.05, wid: 0.055 },
    ears: false,
    shoulderCap: false,           // the plate shells below replace it
    handColor: BARK,
    palette: {
      rim: 0xd8e0b8, hairRim: 0xa8d08a, outline: 0x14120c,
      accent: 0x9ec46a, energy: 0x7fc46a, metalRim: 0xc8d8a8
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, torsoChain, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const grain = grainFn(BARK, BARK_DK);
  const R = headR;   // the head drives most of the numbers below

  // =========================================================================
  // BARK PLATING
  // =========================================================================
  // Overlapping shells over the chest, back and thighs, and a much SMALLER
  // shoulder plate than the first pass carried — an oversized dome there
  // turned the silhouette into two balloons and buried everything else.
  bag.add('skin', tGeo(sphereShell(0.108 * H, { thetaLength: Math.PI * 0.50, scale: [1.30, 0.92, 0.78] }),
    { rot: [86, 0, 0], pos: [0, 0.700 * H, 0.030 * H] }), { chain: torsoChain, color: grain, blend: 0.05 });
  bag.add('skin', tGeo(sphereShell(0.110 * H, { thetaLength: Math.PI * 0.48, scale: [1.26, 1.16, 0.66] }),
    { rot: [-92, 0, 0], pos: [0, 0.678 * H, -0.030 * H] }), { chain: torsoChain, color: grain, blend: 0.05 });
  // belly bands — three overlapping rings, widest at the top
  for (let i = 0; i < 3; i++) {
    const yy = 0.600 * H - i * 0.045 * H;
    bag.add('skin', tGeo(latheY([
      [0.082 * H - i * 0.004 * H, yy], [0.090 * H - i * 0.005 * H, yy + 0.016 * H], [0.076 * H - i * 0.004 * H, yy + 0.034 * H]
    ], 18, 0.82), {}), { chain: torsoChain, color: grain, blend: 0.06 });
  }
  bag.add('skin', tGeo(latheY([
    [0.084 * H, 0.480 * H], [0.098 * H, 0.505 * H], [0.088 * H, 0.535 * H]
  ], 18, 0.84), {}), { chain: torsoChain, color: grain, blend: 0.06 });

  // BARK RIBS. Vertical raised ridges running the height of the trunk, front
  // and back, in the darker tone. Without them the torso lathe reads as bare
  // skin however good the grain is — a tree is made of LINES going up, and
  // this is the cheapest way to say so at silhouette distance.
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.15;
    const rr = 0.088 * H, zs = 0.80;
    const x0 = Math.sin(a) * rr, z0 = Math.cos(a) * rr * zs;
    const wob = Math.sin(i * 2.7) * 0.012 * H;
    bag.add('skin', tubeBetween(
      v3(x0, 0.500 * H, z0), v3(x0 + wob, 0.760 * H, z0 * 0.92),
      [0.0090 * H, 0.0062 * H], { radial: 5, hSeg: 4 }),
      { chain: torsoChain, color: i % 3 === 0 ? GRAIN : BARK_DK, blend: 0.06 });
  }

  // shoulder plates: flat, tucked, layered — bark, not armour
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const sh = joints.get('UpArm' + s);
    bag.add('skin', tGeo(sphereShell(0.052 * H, { thetaLength: Math.PI * 0.58, scale: [1.20, 0.62, 1.10] }),
      { rot: [14, 0, m * -26], pos: [sh.x + m * 0.004 * H, sh.y + 0.014 * H, sh.z] }),
      { bone: 'UpArm' + s, color: grain });
    bag.add('skin', tGeo(sphereShell(0.044 * H, { thetaLength: Math.PI * 0.52, scale: [1.15, 0.55, 1.05] }),
      { rot: [22, 0, m * -36], pos: [sh.x + m * 0.016 * H, sh.y - 0.014 * H, sh.z - 0.003 * H] }),
      { bone: 'UpArm' + s, color: BARK_DK });
    // moss packed into the seam between the two plates
    for (let i = 0; i < 6; i++) {
      const a = -0.7 + i * 0.28;
      bag.add('hair', tGeo(new THREE.SphereGeometry(0.017 * H * rand(0.8, 1.35), 6, 5), {
        scale: [1.6, 0.55, 1.2],
        pos: [sh.x + m * 0.026 * H, sh.y - 0.004 * H, sh.z + Math.sin(a) * 0.046 * H]
      }), { bone: 'UpArm' + s, color: i % 2 ? MOSS : LEAF });
    }
  }

  // thigh plates + shin cuffs
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s);
    bag.add('skin', tGeo(sphereShell(0.058 * H, { thetaLength: Math.PI * 0.5, scale: [1.02, 1.45, 0.74] }),
      { rot: [84, 0, 0], pos: [hp.x, (hp.y * 0.62 + kn.y * 0.38), hp.z + 0.028 * H] }),
      { bone: 'Thigh' + s, color: grain });
    bag.add('skin', tGeo(latheY([
      [0.030 * H, kn.y - 0.10 * H], [0.040 * H, kn.y - 0.05 * H], [0.034 * H, kn.y - 0.008 * H]
    ], 12, 0.9), { pos: [kn.x, 0, kn.z] }), { bone: 'Shin' + s, color: BARK_DK });
  }

  // =========================================================================
  // THE BLACK BANDS
  // =========================================================================
  // The wiki's "black lines running across their entire body". The first pass
  // authored them as surface-hugging tubes and every one of them ended up
  // INSIDE the torso lathe, invisible. They are RINGS now — a torus standing
  // proud of the body at a given height, tilted so they are never symmetrical.
  // A ring cannot sink into the thing it encircles, which is the whole reason
  // for the change, and it reads as a line running across him from any angle.
  const band = (yy, r, tube, tilt, chain, bone) => {
    const g = tGeo(new THREE.TorusGeometry(r, tube, 6, 24), {
      rot: [90 + tilt[0], tilt[1], 0], scale: [1, 1, 0.80], pos: [0, yy, 0]
    });
    bag.add('skin', g, chain ? { chain, color: BLACK, blend: 0.06 } : { bone, color: BLACK });
  };
  band(0.742 * H, 0.098 * H, 0.0062 * H, [6, 0], torsoChain);
  band(0.664 * H, 0.108 * H, 0.0058 * H, [-5, 0], torsoChain);
  band(0.582 * H, 0.100 * H, 0.0055 * H, [7, 0], torsoChain);
  band(0.506 * H, 0.098 * H, 0.0052 * H, [-4, 0], torsoChain);

  // =========================================================================
  // THE ARMS — club-like, and the canon black/white asymmetry
  // =========================================================================
  // s === 'L' is his left (screen +x with the bind pose facing +Z): entirely
  // black limb, WHITE fingers. The right stays bark with BLACK fingers.
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const dark = s === 'L';
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    const limbColor = dark ? BLACK : grain;
    const axis = wr.clone().sub(el).normalize();
    // THE CLUB. The first pass ran a straight taper out to the fist and the
    // result was a megaphone; this swells to its widest just short of the end
    // and then caps ROUND, which is what makes it read as a club of wood
    // rather than as a cone.
    const clubMid = wr.clone().addScaledVector(axis, 0.026 * H);
    const clubEnd = wr.clone().addScaledVector(axis, 0.050 * H);
    bag.add('skin', tubeBetween(el, clubMid, t => (0.030 + 0.034 * Math.pow(t, 1.5)) * H,
      { radial: 12, hSeg: 6 }), { chain: armChain, color: limbColor, blend: 0.10 });
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.064 * H, 12, 9),
      { scale: [1, 0.86, 1], pos: [clubMid.x, clubMid.y, clubMid.z] }),
      { bone: 'Hand' + s, color: limbColor });
    // upper arm mass over the builder's tube — heavier, and knotted
    bag.add('skin', tubeBetween(sh.clone().add(v3(0, 0.010 * H, 0)), el,
      t => (0.044 - 0.010 * t) * H, { radial: 12, hSeg: 5, bulge: 0.16 }),
      { chain: armChain, color: limbColor, blend: 0.10 });
    // the fingers: four blunt digits off the club face, in the OPPOSITE tone
    // to the limb — the single loudest identifier on the model
    for (let i = 0; i < 4; i++) {
      const a0 = clubEnd.clone().add(v3(m * (-0.036 + i * 0.024) * H, 0.006 * H, 0.030 * H));
      const a1 = a0.clone().addScaledVector(axis, 0.040 * H).add(v3(0, 0, 0.018 * H));
      bag.add('skin', tubeBetween(a0, a1, [0.014 * H, 0.010 * H], { radial: 6, hSeg: 2 }),
        { bone: 'Hand' + s, color: dark ? PALE : BLACK });
      bag.add('skin', tGeo(new THREE.SphereGeometry(0.010 * H, 6, 5), { pos: [a1.x, a1.y, a1.z] }),
        { bone: 'Hand' + s, color: dark ? PALE : BLACK });
    }
    // black bands round the arm (both arms carry them; on the black limb they
    // invert to bark so the banding still reads)
    for (const t of [0.30, 0.62]) {
      const p = sh.clone().lerp(el, t);
      const g = tGeo(new THREE.TorusGeometry(0.042 * H, 0.0058 * H, 6, 16), {
        rot: [90, 0, m * 78], pos: [p.x, p.y, p.z]
      });
      bag.add('skin', g, { chain: armChain, color: dark ? BARK_DK : BLACK, blend: 0.10 });
    }
    // moss in the elbow crease
    for (let i = 0; i < 4; i++) {
      bag.add('hair', tGeo(new THREE.SphereGeometry(0.016 * H * rand(0.75, 1.25), 6, 5), {
        scale: [1.4, 0.55, 1.2],
        pos: [el.x + m * rand(-0.018, 0.018) * H, el.y + rand(-0.008, 0.008) * H, el.z - 0.030 * H]
      }), { chain: armChain, color: i % 2 ? MOSS : LEAF, blend: 0.1 });
    }
  }

  // =========================================================================
  // THE HEAD
  // =========================================================================
  // Built around ONE hard edge: the helm's lower rim. Everything above it is
  // wooden dome, everything below it is mouth, and the rim itself is a raised
  // ring in a darker tone so the two halves never merge into one tan egg —
  // which is exactly what the first pass did.
  const rimY = headC.y - R * 0.16;           // where the helm stops
  const jawY = headC.y - R * 0.62;           // where the jaw begins

  // WHERE THE FACE ACTUALLY IS. `animeHead` FLATTENS the front of the skull,
  // so the surface is nowhere near a sphere and anything placed on a nominal
  // radius sinks straight into it — which is exactly what happened to the
  // branch eyes and the zig-zag lines on the previous pass: they were authored
  // at a plausible z, ended up INSIDE the head, and the branches emerged
  // wherever they happened to exit it, which was up by the crown. This
  // reproduces the builder's flattening so every feature below sits ON the
  // face, and there is no separate helm dome at all — the skull IS the helm,
  // and the brow beam and the rim are what say so.
  const faceZAt = (xr, yr) => {
    const w = spec.face.width;
    const q = 1 - Math.min(0.985, (xr / w) * (xr / w) + yr * yr);
    const zz = Math.sqrt(Math.max(0.015, q));
    const fz = spec.face.faceFlat;
    return headC.z + R * (zz > fz ? fz + (zz - fz) * 0.30 : zz);
  };

  // 1. THE BROW BEAM. A heavy horizontal ridge across the top of the face — the
  // upper edge of the helm, and the thing that makes the branch sockets read as
  // sockets rather than as antlers rooted in a bald head.
  bag.add('skin', tGeo(roundBox(R * 1.34, R * 0.26, R * 0.22, R * 0.07),
    { rot: [-14, 0, 0], pos: [0, headC.y + R * 0.40, faceZAt(0, 0.40) - R * 0.02] }),
    { bone: 'Head', color: BARK_DK });
  // and its two cheek returns, sweeping back and down round the sockets
  for (const s of [1, -1]) {
    bag.add('skin', tGeo(roundBox(R * 0.20, R * 0.44, R * 0.20, R * 0.06),
      { rot: [0, s * -26, s * 10], pos: [s * R * 0.72, headC.y + R * 0.16, faceZAt(0.72, 0.16) - R * 0.06] }),
      { bone: 'Head', color: BARK_DK });
  }

  // 2. THE RIM — the most important edge on the model
  // z-scaled to 0.68 because the FACE IS FLAT: a circular ring on a flattened
  // skull sits flush at the temples and floats a finger's width off the nose.
  bag.add('skin', tGeo(new THREE.TorusGeometry(R * 1.00, R * 0.080, 7, 26), {
    rot: [90, 0, 0], scale: [1.10, 1, 0.68], pos: [0, rimY, headC.z - R * 0.02]
  }), { bone: 'Head', color: BARK_DK });

  // 3. THE MOUTH RECESS — a wide dark hollow between rim and jaw
  bag.add('skin', tGeo(new THREE.SphereGeometry(R * 0.78, 14, 10), {
    scale: [1.10, 0.42, 0.72], pos: [0, (rimY + jawY) / 2, headC.z + R * 0.12]
  }), { bone: 'Head', color: MOUTH });

  // 4. THE TEETH — big, blunt, PROUD of the face plane so they take light.
  // Nine uppers hanging off the rim, eight lowers rising off the jaw, offset
  // so they interlock. This is the read the wiki's "the helmet doesn't cover
  // their teeth" is describing and it has to be unmissable.
  const toothZ = faceZ + R * 0.02;
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * R * 0.185;
    const w = R * (0.145 + (i % 2) * 0.022);
    const lean = (i - 4) * 2.2;
    bag.add('skin', tGeo(roundBox(w, R * 0.30, R * 0.15, R * 0.028),
      { rot: [4, 0, lean], pos: [x, rimY - R * 0.16, toothZ - R * 0.04] }),
      { bone: 'Head', color: TEETH });
    if (i < 8) {
      bag.add('skin', tGeo(roundBox(w * 0.88, R * 0.24, R * 0.14, R * 0.026),
        { rot: [-4, 0, lean], pos: [x + R * 0.092, jawY + R * 0.12, toothZ - R * 0.05] }),
        { bone: 'Head', color: TEETH });
    }
  }

  // 5. THE JAW — a separate blunt block, so the head has a bottom
  bag.add('skin', tGeo(sphereShell(R * 0.72, { thetaLength: Math.PI * 0.52, scale: [1.16, 0.66, 0.94] }),
    { rot: [180, 0, 0], pos: [0, jawY + R * 0.10, headC.z + R * 0.06] }),
    { bone: 'Head', color: grain });

  // 6. THE BRANCH EYES. Two woody growths out of the sockets where eyes should
  // be. ASYMMETRIC on purpose — the left is long and forks three ways, the
  // right is stubbier and forks twice. Nothing else on the roster looks like
  // this and it has to read from across the arena, so they are LONG: the left
  // one reaches most of a head-radius clear of the face.
  const socket = [
    { s: 1, xr: 0.44, yr: 0.10, len: R * 1.15, r: R * 0.150, depth: 2, out: 0.30, up: 0.40, seed: 0.7 },
    { s: -1, xr: 0.42, yr: 0.06, len: R * 0.82, r: R * 0.130, depth: 1, out: 0.26, up: 0.24, seed: 2.1 }
  ];
  for (const k of socket) {
    const zs = faceZAt(k.xr, k.yr);
    const at = v3(k.s * R * k.xr, headC.y + R * k.yr, zs - R * 0.04);
    // THE SOCKET: a dark hollow sitting ON the face, so the branch is visibly
    // growing out of an eye rather than out of the top of his skull
    bag.add('skin', tGeo(new THREE.SphereGeometry(R * 0.26, 12, 9),
      { scale: [1.15, 0.95, 0.34], pos: [at.x, at.y, zs - R * 0.02] }),
      { bone: 'Head', color: MOUTH });
    const dir = v3(k.s * k.out, k.up, 0.88).normalize();
    const geo = mergeGeos(branchGeo(at, dir, k.len, k.r, k.depth, k.seed));
    const tipC = new THREE.Color(BRANCH_TIP), baseC = new THREE.Color(BRANCH);
    const zSplit = at.z + k.len * 0.5;
    bag.add('skin', geo, { bone: 'Head', color: (x, y, z) => (z > zSplit ? tipC : baseC) });
  }

  // 7. THE TWO BLACK ZIG-ZAG LINES down the face, one per side. Four segments
  // each, alternating, laid ON the face surface rather than at a fixed depth —
  // the whole reason the first pass lost them.
  for (const s of [1, -1]) {
    const pts = [[0.58, 0.72], [0.84, 0.48], [0.60, 0.26], [0.86, 0.02], [0.62, -0.22]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const p = v3(s * R * ax, headC.y + R * ay, faceZAt(ax, ay) + R * 0.02);
      const q = v3(s * R * bx, headC.y + R * by, faceZAt(bx, by) + R * 0.02);
      bag.add('skin', tubeBetween(p, q, [R * 0.072, R * 0.062], { radial: 5, hSeg: 2 }),
        { bone: 'Head', color: BLACK });
    }
  }

  // 8. THE CROWN. Branch growths sweeping BACK off the skull — they finish the
  // side and back silhouettes, which a front-only design always forgets.
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.3;
    const base = v3(Math.sin(a) * R * 0.70, headC.y + R * 0.76, Math.cos(a) * R * 0.40 - R * 0.40);
    const dir = v3(Math.sin(a) * 0.62, 0.52, -0.72).normalize();
    const geo = mergeGeos(branchGeo(base, dir, R * (0.52 + (i % 3) * 0.20), R * 0.085, i % 2, i * 1.3));
    bag.add('skin', geo, { bone: 'Head', color: i % 2 ? BRANCH : BRANCH_TIP });
  }

  // =========================================================================
  // CLOTH — the shoulder wrap and the waist drape
  // =========================================================================
  bag.add('cloth', tGeo(latheY([
    [0.142 * H, 0.640 * H], [0.138 * H, 0.690 * H], [0.126 * H, 0.740 * H],
    [0.096 * H, 0.786 * H], [0.060 * H, 0.820 * H]
  ], 24, 0.84), {}), { chain: torsoChain, color: CLOTH, blend: 0.05 });
  // the waist drape IS the baggy trousers — black, per canon, so the tan trunk
  // reads against it instead of the whole figure being one undyed mass
  bag.add('cloth', tGeo(latheY([
    [0.118 * H, 0.300 * H], [0.112 * H, 0.360 * H], [0.100 * H, 0.430 * H], [0.090 * H, 0.492 * H]
  ], 20, 0.90), {}), { chain: torsoChain, color: BLACK, blend: 0.05 });
  // ...and the sash that secures them is WHITE, which is the only reason the
  // black/tan boundary at the waist reads as a garment rather than as shadow
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.092 * H, 0.014 * H, 6, 20),
    { rot: [90, 0, 0], scale: [1, 1, 0.88], pos: [0, 0.498 * H, 0] }),
    { chain: torsoChain, color: PALE, blend: 0.05 });

  // =========================================================================
  // MOSS IN THE CREVICES
  // =========================================================================
  const mossSpots = [
    [0.02, 0.735, 0.082], [-0.06, 0.688, 0.078], [0.07, 0.610, 0.074],
    [-0.03, 0.545, 0.080], [0.05, 0.500, -0.078], [-0.07, 0.640, -0.080],
    [0.00, 0.790, -0.058], [-0.05, 0.470, 0.076], [0.06, 0.700, -0.076]
  ];
  for (const [mx, my, mz] of mossSpots) {
    for (let i = 0; i < 3; i++) {
      bag.add('hair', tGeo(new THREE.SphereGeometry(0.019 * H * rand(0.7, 1.3), 6, 5), {
        scale: [1.6, 0.5, 1.4],
        pos: [(mx + rand(-0.020, 0.020)) * H, (my + rand(-0.014, 0.014)) * H, (mz + rand(-0.008, 0.008)) * H]
      }), { chain: torsoChain, color: i % 2 ? MOSS : LEAF, blend: 0.06 });
    }
  }

  const model = finalizeModel(ctx, {
    outlineThickness: 0.014,
    outlineHairScale: 0.65,
    materials: {
      // BARK, not skin: matte, more bands, no gloss at all, and a green-tinted
      // rim so his edge light reads as daylight through leaves. This is what
      // stops him sharing a shading language with any sorcerer on the roster.
      skin: toonMaterial({
        steps: [58, 118, 186, 255], rim: 0.14, rimStart: 0.80, gloss: 0,
        rimColor: 0xd8e0b8, warm: 0x3a2c14, cool: 0x16201a
      }),
      // living plant matter: flatter, greener, a touch of translucency
      hair: toonMaterial({
        steps: [64, 138, 232], rim: 0.34, rimStart: 0.68, gloss: 0.05,
        rimColor: 0xa8d08a, warm: 0x22300f, cool: 0x0e1a1c
      }),
      cloth: toonMaterial({
        steps: [60, 132, 226], rim: 0.18, rimStart: 0.74,
        rimColor: 0xcbd0a8, warm: 0x2c2412, cool: 0x121a1e
      })
    },
    springs: hanamiSprings(ctx)
  });

  // =========================================================================
  // VITALITY — the model's read on the terrain passive
  // =========================================================================
  // The HUD says which ground he is standing on; the MODEL says how much it is
  // doing for him. On natural ground the flowers open and a slow drift of
  // pollen comes off him; on dead ground they close and it stops. fighter.js
  // pushes `setVitality` every tick from the regen rate it actually computed,
  // so the two can never disagree.
  const petals = [];
  model.group.traverse(o => { if (o.userData.petal) petals.push(o); });
  const pollenN = 26;
  const pgeo = new THREE.BufferGeometry();
  const ppos = new Float32Array(pollenN * 3);
  const pseed = [];
  for (let i = 0; i < pollenN; i++) {
    pseed.push({ t: Math.random(), sp: rand(0.25, 0.6), a: rand(0, 6.3), r: rand(0.2, 0.6) });
  }
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const pmat = new THREE.PointsMaterial({
    color: 0xe8f0c0, size: 0.05, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const pollen = new THREE.Points(pgeo, pmat);
  pollen.frustumCulled = false;
  model.group.add(pollen);

  let vitality = 0.5, vShown = 0.5;
  model.setVitality = v => { vitality = Math.max(0, Math.min(1, v)); };
  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    vShown += (vitality - vShown) * Math.min(1, dt * 2.2);
    const open = 0.5 + vShown * 0.7;
    for (const p of petals) p.scale.setScalar(open);
    pmat.opacity = vShown * 0.55;
    const attr = pgeo.getAttribute('position');
    for (let i = 0; i < pollenN; i++) {
      const s = pseed[i];
      s.t += dt * s.sp * (0.4 + vShown);
      if (s.t > 1) s.t = 0;
      attr.array[i * 3] = Math.sin(s.a + s.t * 2.4) * s.r;
      attr.array[i * 3 + 1] = 0.4 + s.t * 1.9;
      attr.array[i * 3 + 2] = Math.cos(s.a + s.t * 1.8) * s.r;
    }
    attr.needsUpdate = true;
  };
  return model;
}

// ---------------------------------------------------------------------------
// SPRING CHAINS: vines and flowers with real secondary motion
// ---------------------------------------------------------------------------
// Two hanging vines per shoulder and a short spray off the crown. Every chain
// carries actual flower geometry rather than a flat card, so the blossoms are
// still blossoms when the camera swings round behind him — but they are SMALL.
// The first pass authored 30 cm blooms and they read as dinner plates hanging
// off his elbows; these are the size of a real flower on a body this big.
function hanamiSprings(ctx) {
  const H = ctx.spec.H;
  const vineMat = toonMaterial({
    steps: [64, 138, 232], rim: 0.34, rimStart: 0.68,
    rimColor: 0xa8d08a, warm: 0x22300f, cool: 0x0e1a1c
  });
  const outline = { color: 0x14120c, thickness: 0.010 };

  const flower = (r) => {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const p = new THREE.Mesh(
        tGeo(new THREE.SphereGeometry(r, 6, 5), { scale: [1, 0.30, 1.35] }),
        new THREE.MeshBasicMaterial({ color: FLOWER }));
      p.position.set(Math.sin(a) * r * 1.05, 0, Math.cos(a) * r * 1.05);
      p.rotation.y = -a;
      g.add(p);
    }
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 6, 5),
      new THREE.MeshBasicMaterial({ color: HEART })));
    g.userData.petal = 1;   // tagged so setVitality opens and closes it
    return g;
  };

  // one vine: three tapered segments, a leaf on the middle, a small flower
  // cluster at the tip
  const vineSegs = (len, w, flowerR) => {
    const segs = [];
    for (let i = 0; i < 3; i++) {
      const mesh = makeFlapMesh(w * (1 - i * 0.24), w * (1 - (i + 1) * 0.24), len, 0.009 * H,
        vineMat, i % 2 ? LEAF : MOSS, outline);
      if (i === 1) {
        const leaf = new THREE.Mesh(
          tGeo(new THREE.SphereGeometry(w * 1.1, 6, 5), { scale: [1, 0.22, 1.8] }),
          new THREE.MeshBasicMaterial({ color: LEAF }));
        leaf.position.set(w * 1.1, -len * 0.5, 0);
        leaf.rotation.z = 0.5;
        mesh.add(leaf);
      }
      if (i === 2) {
        const f = flower(flowerR);
        f.position.y = -len * 0.94;
        mesh.add(f);
      }
      segs.push({ len, mesh });
    }
    return segs;
  };

  const defs = [];
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    for (let i = 0; i < 2; i++) {
      defs.push({
        bone: 'UpArm' + s,
        localOffset: v3(m * (0.020 + i * 0.016) * H, -0.014 * H, (i ? -0.030 : 0.028) * H),
        restDir: v3(m * 0.14, -1, 0).normalize(),
        segments: vineSegs(0.062 * H, 0.024 * H, 0.020 * H),
        stiffness: 46, damping: 0.80, gravity: 7
      });
    }
  }
  // the crown spray: shorter, stiffer, hanging back off the skull
  for (const m of [1, -1]) {
    defs.push({
      bone: 'Head',
      localOffset: v3(m * 0.028 * H, 0.048 * H, -0.040 * H),
      restDir: v3(m * 0.30, -0.70, -0.65).normalize(),
      segments: vineSegs(0.040 * H, 0.017 * H, 0.016 * H),
      stiffness: 62, damping: 0.78, gravity: 5
    });
  }
  return defs;
}
