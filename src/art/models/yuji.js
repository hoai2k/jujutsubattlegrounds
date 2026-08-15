// YUJI — shorter and stockier than Gojo: athletic teenage build, spiked pink
// hair, Jujutsu Tech gakuran with a hood bundle and red zip trim. Reads as a
// wedge-shouldered black shape crowned pink at fighting distance.
// Sukuna form is a toggleable overlay on the same mesh: face/neck markings,
// a second pair of eye slits, red-glow irises (model.setSukuna).
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox, almondEye } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const NAVY = 0x1c2130;
const NAVY_DK = 0x151a26;
// THE HOOD IS RED (2026-08-14). Canon Yuji is "a black long-sleeve shirt
// resembling a gakuran over a RED HOODIE, black pants, and red shoes" — the
// hoodie bundled at his neck is the only warm mass on an otherwise black
// uniform, and building it in navy (0x252c40) threw away the one piece of
// colour that separates him from Megumi in a dark arena.
const HOOD = 0xa8323c;      // the red hoodie showing above the collar
const HOOD_DK = 0x74222b;   // its shaded roll / the tail at the upper back
const TRIM = 0xc23b4a;      // red zip / drawstring accents
const HAIR = 0xef9c96;      // salmon pink
const SKIN = 0xf0d2b2;      // warmer than the others
const MARK = 0x2a1016;      // sukuna engraving lines

// VARIANTS. `opts.aged` builds the MODULO version — sixty-eight years on,
// half cursed spirit. Defaults reproduce the shipped model exactly.
export function buildYuji(opts = {}) {
  const { aged = false, shinjuku = false } = opts;
  const HAIR_C = aged ? 0xb8a8a4 : HAIR;      // the pink has gone out of it
  // SHINJUKU SHOWDOWN: the uniform is filthy and half destroyed by the end of
  // the fight — the navy is dragged down toward soot rather than recoloured,
  // so it still reads as the same jacket.
  const TOP_C = aged ? 0x2a2028 : shinjuku ? 0x1a1d28 : NAVY;
  const BOT_C = aged ? 0x1c1620 : shinjuku ? 0x12141c : NAVY_DK;
  const spec = {
    id: 'yuji', name: 'Yuji', H: 1.75, headScale: 1.05,
    shoulder: aged ? 0.110 : 0.102, hip: 0.053,
    muscle: aged ? 1.22 : shinjuku ? 1.16 : 1.10, bulk: aged ? 1.12 : shinjuku ? 1.08 : 1.05, legBulk: 1.02,
    // red shoes are canon too, and they are the only warm note below the waist.
    // The aged/Shinjuku versions keep dark footwear: Modulo is out of uniform
    // entirely and the Shinjuku one is caked in soot.
    skinTone: aged ? 0xe0c0a6 : SKIN, clothColor: TOP_C, pantColor: BOT_C,
    shoeColor: (aged || shinjuku) ? 0x0f1016 : 0x9c2f38,
    torsoShape: { chest: aged ? 1.14 : 1.07, waist: 0.99, hip: 0.95 },
    face: { jaw: aged ? 1.08 : 1.02, chin: 0.94, width: 1.03 },
    shoe: { len: 0.115, hgt: 0.052 },
    palette: aged
      ? { rim: 0xd8a8a0, hairRim: 0xe8d8d4, outline: 0x120a0e, accent: 0xb04a5a, energy: 0xc0505e }
      : shinjuku
        ? { rim: 0xffa8a0, hairRim: 0xffd0c4, outline: 0x0e0810, accent: 0xff2038, energy: 0xff2038 }
        : { rim: 0xffbcae, hairRim: 0xffd8cc, outline: 0x140b10, accent: 0xff9fb4, energy: 0xff5a6a }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- gakuran details -----------------------------------------------------
  // MODULO wears no school uniform at all — he is pushing eighty. The entire
  // gakuran kit (collar, hood bundle, zip trim, drawstrings, hem, cuffs) is
  // SKIPPED for him and replaced by the civilian layer built further down, the
  // same way Shinjuku Gojo skips his. Before this pass `aged` only recoloured
  // these pieces, which left an eighty-year-old special grade wearing a
  // repainted school jacket — a palette swap wearing a reference sheet's
  // clothes, and exactly what Part 2 of the brief is about.
  if (!aged) {
  // high collar
  bag.add('cloth', latheY([
    [0.038 * H, y.neck - 0.013 * H], [0.044 * H, y.neck + 0.013 * H], [0.048 * H, y.headBase + 0.02 * H]
  ], 16, 0.87), { bone: 'Neck', color: NAVY });
  // hood bundle: chunky folded crescent over the shoulders
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.06 * H, 0.03 * H, 8, 14, Math.PI * 1.15),
    { rot: [80, 0, 180], pos: [0, 0.822 * H, -0.058 * H] }), { bone: 'Chest', color: HOOD });
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.043 * H, 0.022 * H, 8, 12, Math.PI),
    { rot: [68, 0, 180], pos: [0, 0.845 * H, -0.05 * H] }), { bone: 'Chest', color: HOOD_DK });
  // zip line down the front — muted red so it reads as trim, not stripes
  const ZIP = 0x7e2833;
  for (const [cy, cz, ch] of [[0.77 * H, 0.055 * H, 0.09 * H], [0.68 * H, 0.048 * H, 0.09 * H], [0.595 * H, 0.042 * H, 0.08 * H]]) {
    bag.add('cloth', tGeo(roundBox(0.009 * H, ch, 0.005 * H, 0.002),
      { pos: [0, cy, cz] }), { chain: torsoChain, color: ZIP, blend: 0.05 });
  }
  // hood drawstrings hanging from the collar
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.006 * H, 0.075 * H, 0.006 * H, 0.002),
      { rot: [6, 0, s * 5], pos: [s * 0.022 * H, 0.775 * H, 0.062 * H] }), { bone: 'Chest', color: TRIM });
  }
  // jacket hem over the hips
  bag.add('cloth', latheY([
    [0.078 * H, 0.42 * H], [0.0765 * H, 0.465 * H], [0.073 * H, 0.505 * H]
  ], 20, 0.79), { bone: 'Hips', color: NAVY });
  // sleeve cuffs
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.022 * H, 0.0245 * H, 0.04 * H, 10),
      { pos: [wr.x, wr.y + 0.02 * H, wr.z] }), { bone: 'LoArm' + s, color: NAVY_DK });
  }
  }

  // =========================================================================
  // MODULO — THE CIVILIAN LAYER (authored geometry, not a recolour)
  // =========================================================================
  // Sixty-eight years on, half cursed spirit, and long past wearing a school
  // uniform. What replaces it is a heavy ribbed roll-neck under a long open
  // coat, which is both a different silhouette and a genuinely different set of
  // meshes: the coat's front panels hang past the hip as spring flaps, so the
  // read at fighting distance is a long dark shape that MOVES, where the
  // first-year is a short boxy one that does not.
  if (aged) {
    const KNIT = 0x322a34, COAT = 0x201a24, COAT_DK = 0x171320, TRIMA = 0x6a4550;
    // the roll-neck: a tall ribbed collar swallowing the jaw line
    bag.add('cloth', latheY([
      [0.043 * H, y.neck - 0.020 * H], [0.048 * H, y.neck + 0.010 * H],
      [0.049 * H, y.headBase + 0.008 * H], [0.046 * H, y.headBase + 0.034 * H]
    ], 18, 0.90), { bone: 'Neck', color: KNIT });
    for (let i = 0; i < 3; i++) {
      bag.add('cloth', latheY([
        [0.0505 * H, y.neck + 0.004 * H + i * 0.013 * H],
        [0.0495 * H, y.neck + 0.011 * H + i * 0.013 * H]
      ], 16, 0.90), { bone: 'Neck', color: COAT_DK });
    }
    // the coat: two lapel panels down the chest, standing proud of the torso
    for (const s of [1, -1]) {
      bag.add('cloth', tGeo(roundBox(0.036 * H, 0.230 * H, 0.014 * H, 0.005 * H),
        { rot: [0, s * -14, s * 4], pos: [s * 0.040 * H, 0.680 * H, 0.062 * H] }),
        { chain: torsoChain, color: COAT, blend: 0.06 });
      // the turned lapel edge, in the dried-blood trim
      bag.add('cloth', tGeo(roundBox(0.011 * H, 0.190 * H, 0.010 * H, 0.003 * H),
        { rot: [0, s * -14, s * 6], pos: [s * 0.056 * H, 0.700 * H, 0.066 * H] }),
        { chain: torsoChain, color: TRIMA, blend: 0.06 });
    }
    // shoulder yoke — the coat sits ON him rather than being painted on
    bag.add('cloth', latheY([
      [0.070 * H, 0.760 * H], [0.079 * H, 0.792 * H], [0.074 * H, 0.822 * H]
    ], 20, 0.86), { bone: 'Chest', color: COAT });
    // a wide belt at the waist, cinching the coat
    bag.add('cloth', latheY([
      [0.0745 * H, 0.545 * H], [0.0790 * H, 0.560 * H],
      [0.0790 * H, 0.596 * H], [0.0740 * H, 0.612 * H]
    ], 18, 0.84), { chain: torsoChain, color: COAT_DK, blend: 0.05 });
    bag.add('cloth', tGeo(roundBox(0.030 * H, 0.026 * H, 0.020 * H, 0.005 * H),
      { pos: [0, 0.578 * H, 0.070 * H] }), { chain: torsoChain, color: TRIMA, blend: 0.05 });
    // heavy cuffs at the wrist, folded back
    for (const s of ['L', 'R']) {
      const wr = joints.get('Hand' + s);
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.027 * H, 0.030 * H, 0.058 * H, 10),
        { pos: [wr.x, wr.y + 0.030 * H, wr.z] }), { bone: 'LoArm' + s, color: COAT });
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.031 * H, 0.031 * H, 0.014 * H, 10),
        { pos: [wr.x, wr.y + 0.006 * H, wr.z] }), { bone: 'LoArm' + s, color: COAT_DK });
    }
  }

  // =========================================================================
  // SHINJUKU — THE DAMAGE, AS GEOMETRY
  // =========================================================================
  // Pass 1 claimed the uniform was "filthy and half destroyed" and then built
  // it fully intact and recoloured, with four hanging shreds for movement. Half
  // destroyed has to be visible in the SILHOUETTE from any angle, so: the jacket
  // is torn open across the chest and stomach with skin showing through, the
  // right sleeve is gone below the shoulder, and the hem is ragged rather than
  // a clean lathe. Same treatment Shinjuku Gojo already gets, for the reason
  // that made it right there — a tear you can only see face-on is a texture.
  if (shinjuku) {
    // TORN OPENINGS. Each one is TWO pieces: a dark ragged frame sitting a
    // hair proud of the jacket, and the skin showing through inside it. Pass 1
    // used a bare skin-coloured box and the result read as a sticking plaster
    // stuck ON the uniform rather than a hole through it — the dark edge is
    // what flips the read, because a tear is defined by its border and a
    // patch is not. Fewer and larger than pass 1, for the same reason.
    for (const [sx, cy, w, h, rz] of [
      [1, 0.740, 0.046, 0.062, 0.34],
      [-1, 0.698, 0.038, 0.078, -0.26],
      [0.4, 0.600, 0.052, 0.048, 0.18]
    ]) {
      bag.add('cloth', tGeo(roundBox((w + 0.014) * H, (h + 0.014) * H, 0.008 * H, 0.004),
        { rot: [0, 0, rz * 57.3], pos: [sx * 0.030 * H, cy * H, 0.048 * H] }),
        { chain: torsoChain, color: 0x0a0b10, blend: 0.05 });
      bag.add('skin', tGeo(roundBox(w * H, h * H, 0.012 * H, 0.004),
        { rot: [0, 0, rz * 57.3], pos: [sx * 0.030 * H, cy * H, 0.050 * H] }),
        { chain: torsoChain, color: SKIN, blend: 0.05 });
    }
    // THE RIGHT SLEEVE IS GONE below the shoulder — a ragged stub of cones
    // around the bicep and bare skin from there down. This is the single
    // biggest silhouette change and it reads from behind as well as in front.
    {
      const sh = joints.get('UpArmR'), el = joints.get('LoArmR');
      const stub = sh.clone().lerp(el, 0.40);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        bag.add('cloth', tGeo(new THREE.ConeGeometry(0.009 * H, 0.034 * H, 4), {
          rot: [180, 0, 0],
          pos: [stub.x + Math.cos(a) * 0.031 * H, stub.y, stub.z + Math.sin(a) * 0.024 * H]
        }), { bone: 'UpArmR', color: TOP_C });
      }
      // bare forearm over the (now exposed) arm
      bag.add('skin', tGeo(new THREE.CylinderGeometry(0.026 * H, 0.021 * H, 0.10 * H, 10),
        { pos: [(stub.x + el.x) / 2, (stub.y + el.y) / 2 - 0.03 * H, (stub.z + el.z) / 2] }),
        { bone: 'LoArmR', color: SKIN });
    }
    // the hem torn into points instead of a clean skirt
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      bag.add('cloth', tGeo(new THREE.ConeGeometry(0.012 * H, 0.042 * H, 4), {
        rot: [180, 0, 0],
        pos: [Math.sin(a) * 0.074 * H, 0.418 * H, Math.cos(a) * 0.060 * H]
      }), { bone: 'Hips', color: BOT_C });
    }
  }

  // ---- face: steady brown eyes, heavy brows, blank set mouth ---------------
  addFace(ctx, {
    eyeW: 0.5, eyeH: 0.3, eyeColor: 0x7a4a34, browTilt: 14, browUp: 1.15,
    browColor: 0x8f5a54, lashColor: 0x181018, mouthW: 0.2
  });

  // ---- spiked pink hair: short, dense, swept up and back -------------------
  const spikes = [];
  const addSpike = (dir, len, rBase, bendUp = 0.35) => {
    const d = dir.clone().normalize();
    const pos = headC.clone().addScaledVector(d, headR * 0.88);
    const geo = coneSpike(rBase, len, new THREE.Vector3(0, len * bendUp, 0), { radial: 6, hSeg: 4 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(pos.x, pos.y, pos.z);
    geo.computeVertexNormals();
    spikes.push(geo);
  };
  if (aged) {
    // ---- MODULO: SWEPT BACK, NOT SPIKED -----------------------------------
    // Different geometry, not a recoloured spike set. An eighty-year-old does
    // not wear a first-year's crown of upright tufts: the volume comes off the
    // top entirely, the hairline moves back, and what is left is combed
    // backward in long low strokes with a deliberate gap at the temples. The
    // silhouette change is the point — from front, the head reads narrower and
    // taller, which is most of what makes him look old at fighting distance.
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      // shallow, long, and bent BACKWARD (negative z bend) rather than up
      addSpike(v3(Math.sin(a) * 0.30, 0.94, Math.cos(a) * 0.30 - 0.22),
        headR * (0.52 + (i % 2) * 0.08), headR * 0.30, -0.42);
    }
    // the receded hairline: two short strokes only, set well back off the brow
    addSpike(v3(0.30, 0.62, 0.74), headR * 0.34, headR * 0.24, -0.30);
    addSpike(v3(-0.34, 0.60, 0.72), headR * 0.32, headR * 0.22, -0.30);
    // long strokes down the back of the skull to the nape
    for (const [sx, len] of [[0, 0.62], [0.46, 0.56], [-0.46, 0.56], [0.78, 0.46], [-0.78, 0.46]]) {
      addSpike(v3(sx * 0.9, 0.30, -0.86), headR * len, headR * 0.28, -0.50);
    }
    // and the temples stay BARE — no spike here at all, which is the actual
    // difference between an old man's head and a teenager's
  } else {
  // crown: fat upright tufts — Gojo's construction at two-thirds length so it
  // reads spiky-but-short at distance
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    addSpike(v3(Math.sin(a) * 0.36, 1, Math.cos(a) * 0.32), headR * (0.58 + (i % 2) * 0.12), headR * 0.4, 0.22);
  }
  // mid ring: flared out
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.6;
    addSpike(v3(Math.sin(a) * 0.82, 0.82, Math.cos(a) * 0.78), headR * (0.44 + (i % 2) * 0.12), headR * 0.36, 0.32);
  }
  // jagged fringe pushed down toward the brows — no bald band
  addSpike(v3(0.14, 0.34, 1), headR * 0.42, headR * 0.32, 0.6);
  addSpike(v3(-0.2, 0.32, 0.96), headR * 0.4, headR * 0.3, 0.6);
  addSpike(v3(0.52, 0.3, 0.82), headR * 0.38, headR * 0.28, 0.55);
  addSpike(v3(-0.55, 0.3, 0.8), headR * 0.38, headR * 0.28, 0.55);
  // temples + nape, angled down to close the hairline all the way around
  for (const s of [1, -1]) {
    addSpike(v3(s * 0.98, 0.18, 0.2), headR * 0.36, headR * 0.3, 0.25);
    addSpike(v3(s * 0.55, 0.05, -0.9), headR * 0.4, headR * 0.32, -0.3);
  }
  addSpike(v3(0, 0.08, -1), headR * 0.44, headR * 0.34, -0.35);
  }
  // scalp cap: shallow in front (brows stay clear), deep at the back — a
  // second tilted shell closes the nape
  bag.add('hair', tGeo(sphereShell(headR * 1.07, { thetaLength: Math.PI * 0.46, scale: [1, 0.96, 1.03] }),
    { pos: [headC.x, headC.y + headR * 0.08, headC.z - headR * 0.05] }), { bone: 'Head', color: HAIR_C });
  bag.add('hair', tGeo(sphereShell(headR * 1.07, { thetaLength: Math.PI * 0.52, scale: [1, 1.04, 1] }),
    { rot: [-62, 0, 0], pos: [headC.x, headC.y - headR * 0.10, headC.z - headR * 0.30] }), { bone: 'Head', color: HAIR_C });
  for (const s of spikes) bag.add('hair', s, { bone: 'Head', color: HAIR_C });

  // ---- springs: hem flaps + hood tail --------------------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  // SHINJUKU: hanging shreds of the jacket, each on its own chain so the
  // damage MOVES — the same treatment Shinjuku Gojo gets, for the same reason.
  if (shinjuku) {
    for (const [bone, ox, oy, oz, w, len] of [
      ['Chest', 0.052, -0.050, 0.028, 0.028, 0.070],
      ['Chest', -0.046, -0.064, 0.032, 0.022, 0.058],
      ['Hips', 0.054, -0.028, -0.046, 0.032, 0.084],
      ['Hips', -0.050, -0.034, -0.042, 0.026, 0.072]
    ]) {
      springs.push({
        bone, localOffset: v3(ox * H, oy * H, oz * H),
        restDir: v3(ox * 0.4, -1, oz * 0.3).normalize(),
        stiffness: 56, damping: 0.78, gravity: 9,
        segments: [{ len: len * H, mesh: makeFlapMesh(w * H, w * 0.45 * H, len * H, 0.007, clothMat, TOP_C, oOpts) }]
      });
    }
  }

  if (aged) {
    // MODULO: the coat's two long front panels and its back vent. These are
    // what change his read at distance — a long dark shape trailing behind him
    // where the first-year has a short boxy jacket. Three chained segments each
    // (the base's hem flaps use two), so they genuinely swing.
    const COATC = 0x201a24;
    for (const s of [1, -1]) {
      springs.push({
        bone: 'Hips', localOffset: v3(s * 0.055 * H, -0.02 * H, 0.030 * H),
        restDir: v3(s * 0.10, -1, 0.06).normalize(), stiffness: 44, damping: 0.83, gravity: 10,
        segments: [
          { len: 0.085 * H, mesh: makeFlapMesh(0.062 * H, 0.058 * H, 0.085 * H, 0.009, clothMat, COATC, oOpts) },
          { len: 0.078 * H, mesh: makeFlapMesh(0.058 * H, 0.052 * H, 0.078 * H, 0.008, clothMat, COATC, oOpts) },
          { len: 0.068 * H, mesh: makeFlapMesh(0.052 * H, 0.040 * H, 0.068 * H, 0.007, clothMat, COATC, oOpts) }
        ]
      });
    }
    springs.push({
      bone: 'Hips', localOffset: v3(0, -0.02 * H, -0.062 * H),
      restDir: v3(0, -1, -0.10).normalize(), stiffness: 46, damping: 0.83, gravity: 10,
      segments: [
        { len: 0.090 * H, mesh: makeFlapMesh(0.100 * H, 0.090 * H, 0.090 * H, 0.010, clothMat, COATC, oOpts) },
        { len: 0.080 * H, mesh: makeFlapMesh(0.090 * H, 0.070 * H, 0.080 * H, 0.009, clothMat, COATC, oOpts) }
      ]
    });
  } else {
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.05 * H, -0.10 * H, -0.05 * H),
      restDir: v3(s * 0.06, -1, -0.12).normalize(), stiffness: 65, damping: 0.8, gravity: 7,
      segments: [
        { len: 0.055 * H, mesh: makeFlapMesh(0.058 * H, 0.05 * H, 0.055 * H, 0.008, clothMat, NAVY, oOpts) },
        { len: 0.05 * H, mesh: makeFlapMesh(0.05 * H, 0.04 * H, 0.05 * H, 0.007, clothMat, NAVY, oOpts) }
      ]
    });
  }
  // hood tail bouncing at the upper back
  springs.push({
    bone: 'Chest', localOffset: v3(0, 0.822 * H - joints.get('Chest').y, -0.08 * H),
    restDir: v3(0, -1, -0.3).normalize(), stiffness: 80, damping: 0.78, gravity: 6,
    segments: [{ len: 0.05 * H, mesh: makeFlapMesh(0.075 * H, 0.055 * H, 0.05 * H, 0.01, clothMat, HOOD, oOpts) }]
  });
  }

  // hair outline off — per-spike hulls turn short spikes into black burrs
  const model = finalizeModel(ctx, { springs, outlineThickness: 0.012, outlineHairScale: 0 });

  // ---- Sukuna overlay: markings + second eyes on the same mesh -------------
  // parented to the Head/Neck bones in bone-local space, hidden by default
  const head = model.getBone('Head');
  const headJ = joints.get('Head');
  const marks = new THREE.Group();
  marks.name = 'sukunaMarks';
  const flat = new THREE.MeshBasicMaterial({ color: MARK });
  const faceZ = headC.z + headR * 0.615 - headJ.z;
  const eyeY = headC.y - headR * 0.10 - headJ.y;
  const cy = headC.y - headJ.y;
  const addMark = (geo, p, rotZ = 0) => {
    const mesh = new THREE.Mesh(geo, flat);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.rotation.z = rotZ;
    marks.add(mesh);
  };
  for (const s of [1, -1]) {
    // cursed engraving across each cheek, just under the second eye
    addMark(roundBox(headR * 0.4, headR * 0.05, 0.004, 0.002),
      [s * headR * 0.46, eyeY - headR * 0.62, faceZ + headR * 0.02], s * -0.18);
    // temple line dropping toward the jaw
    addMark(roundBox(headR * 0.05, headR * 0.34, 0.004, 0.002),
      [s * headR * 0.74, eyeY + headR * 0.02, faceZ - headR * 0.16], s * 0.22);
    // second eye: dark slit + red iris on the cheekbone BELOW the natural eye
    const slit = new THREE.Mesh(tGeo(almondEye(headR * 0.32, headR * 0.15, s * 4)), flat);
    slit.position.set(s * headR * 0.42, eyeY - headR * 0.36, faceZ + headR * 0.028);
    marks.add(slit);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.05, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2038 }));
    iris.position.set(s * headR * 0.40, eyeY - headR * 0.335, faceZ + headR * 0.034);
    marks.add(iris);
    // red glow over the natural iris — the vessel's eyes turn
    const glow = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.30 * 0.42, 10),
      new THREE.MeshBasicMaterial({ color: 0xff2038, transparent: true, opacity: 0.85 }));
    glow.scale.set(0.82, 1.15, 1);
    glow.position.set(s * headR * 0.40 - s * headR * 0.5 * 0.06, eyeY + headR * 0.3 * 0.05, faceZ + headR * 0.026);
    marks.add(glow);
  }
  // chin line
  addMark(roundBox(headR * 0.05, headR * 0.22, 0.004, 0.002), [0, cy - headR * 0.72, faceZ - headR * 0.02]);
  head.add(marks);
  marks.visible = false;

  // neck stripes riding the Neck bone
  const neckJ = joints.get('Neck');
  const neckMarks = new THREE.Group();
  for (const s of [1, -1]) {
    const line = new THREE.Mesh(roundBox(headR * 0.3, headR * 0.045, 0.004, 0.002), flat);
    line.position.set(s * 0.021 * H, (y.neck + 0.006 * H) - neckJ.y, 0.024 * H);
    line.rotation.z = s * -0.35;
    neckMarks.add(line);
  }
  model.getBone('Neck').add(neckMarks);
  neckMarks.visible = false;

  model.setSukuna = on => { marks.visible = on; neckMarks.visible = on; };
  // SHINJUKU: by the final fight the markings are simply THERE — he has spent
  // the whole arc sharing the body. They start on rather than being toggled by
  // the ultimate, and the ultimate no longer owns them.
  if (shinjuku) { marks.visible = true; neckMarks.visible = true; }
  // MODULO: half human and half cursed spirit after the Death Paintings, so
  // the curse markings never go away. They are simply on, permanently, and
  // `setSukuna` becomes a no-op rather than a toggle that could turn them off.
  if (aged) {
    marks.visible = true; neckMarks.visible = true;
    model.setSukuna = () => { };
  }
  return model;
}
