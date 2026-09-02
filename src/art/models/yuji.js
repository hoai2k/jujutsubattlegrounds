// YUJI — shorter and stockier than Gojo: athletic teenage build, spiked pink
// hair, Jujutsu Tech gakuran with a hood bundle and red zip trim. Reads as a
// wedge-shouldered black shape crowned pink at fighting distance.
// Sukuna form is a toggleable overlay on the same mesh: face/neck markings,
// a second pair of eye slits, red-glow irises (model.setSukuna).
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { addFace2, skinPoint } from '../builders/head2.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox, almondEye, tubeBetween } from '../builders/geo.js';
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
const HAIR = 0xe9968e;      // salmon pink
const HAIR_DK = 0x2c1b20;   // the shaved undercut showing below the pink
const SKIN = 0xf1cfae;      // warmer than the others
const GOLD = 0xd8a840;      // the hood and jacket buttons
const SOCK = 0x17181f;
const SNEAKER = 0xefeeea;   // white high-tops, as on the canon idle sheet
const SOLE = 0xb9b6ad;
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
  // THE BASE MODEL IS REBUILT AGAINST THE CANON IDLE SHEET (2026-09). Head on
  // the sculpted builder (brow, sockets, cheekbones, nose in the mesh), a
  // boxy gakuran that hangs straight to the hip instead of a fitted lathe,
  // the hood as a real buttoned collar mass, sleeves with the red hoodie cuff
  // showing, trousers cropped over black socks, white high-tops. Proportions
  // hold at ~7 heads, 173 cm, thick neck, broad shoulders.
  const spec = {
    id: 'yuji', name: 'Yuji', H: 1.75, headScale: 1.05, neck: 1.12,
    shoulder: aged ? 0.112 : 0.106, hip: 0.054,
    muscle: aged ? 1.22 : shinjuku ? 1.16 : 1.14, bulk: aged ? 1.12 : shinjuku ? 1.08 : 1.06, legBulk: 1.10,
    // the base wears the jacket built below; the variants keep the fitted lathe
    torso: !(aged || shinjuku) ? false : true,
    // footwear: the canon idle sheet has white high-tops over black socks. The
    // aged/Shinjuku versions keep dark footwear: Modulo is out of uniform
    // entirely and the Shinjuku one is caked in soot.
    skinTone: aged ? 0xe0c0a6 : SKIN, clothColor: TOP_C, pantColor: BOT_C,
    shoeColor: (aged || shinjuku) ? 0x0f1016 : SNEAKER,
    torsoShape: { chest: aged ? 1.14 : 1.07, waist: 0.99, hip: 0.95 },
    // the face: a teenager's rounder jaw, a strong brow, small chin
    face: { jaw: aged ? 1.0 : 0.92, chin: 0.85, width: 0.98, brow: 1.2, cheek: 0.9, nose: 1.0, socket: 1.0 },
    shoe: { len: 0.125, hgt: 0.070, wid: 0.048 },
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
  if (!aged && !shinjuku) {
  // ---- THE GAKURAN, as a garment rather than a body -----------------------
  // A jacket does not follow the waist. It hangs from the shoulders, straight
  // down past the hip, and the only shaping is the slight drape outward at
  // the hem. Built on the torso chain so it still bends with the spine.
  const jk = 1.0;
  bag.add('cloth', latheY([
    [0.086 * H * jk, 0.425 * H], [0.084 * H * jk, 0.47 * H], [0.082 * H * jk, 0.53 * H],
    [0.081 * H * jk, 0.60 * H], [0.084 * H * jk, 0.68 * H], [0.088 * H * jk, 0.74 * H],
    [0.086 * H * jk, 0.785 * H], [0.072 * H, 0.822 * H], [0.040 * H, 0.845 * H], [0.030 * H, y.neck + 0.004 * H]
  ], 26, 0.72), { chain: torsoChain, color: NAVY, blend: 0.05 });
  // the hem is open: a dark disc closes it so the inside never shows from below
  bag.add('cloth', tGeo(new THREE.CircleGeometry(0.086 * H, 24), { scale: [1, 0.72, 1], rot: [90, 0, 0], pos: [0, 0.426 * H, 0] }), { bone: 'Hips', color: NAVY_DK });
  // the trousers under it — the tube the jacket hangs over, so the hem reads
  // as a hem and not as a skirt on a thigh
  bag.add('cloth', latheY([
    [0.062 * H, 0.40 * H], [0.070 * H, 0.44 * H], [0.074 * H, 0.50 * H], [0.070 * H, 0.54 * H]
  ], 20, 0.78), { chain: torsoChain, color: BOT_C, blend: 0.05 });
  // front closure: the gakuran fastens off-centre on the wearer's right, a
  // raised placket edge with one gold button at the chest
  bag.add('cloth', tGeo(roundBox(0.010 * H, 0.33 * H, 0.006 * H, 0.002), { pos: [-0.018 * H, 0.61 * H, 0.062 * H] }),
    { chain: torsoChain, color: NAVY_DK, blend: 0.05 });
  bag.add('metal', tGeo(new THREE.SphereGeometry(0.0065 * H, 8, 6), { scale: [1, 1, 0.5], pos: [-0.012 * H, 0.745 * H, 0.068 * H] }),
    { chain: torsoChain, color: GOLD, blend: 0.05 });
  // stand collar of the jacket, inside the hood
  bag.add('cloth', latheY([
    [0.040 * H, y.neck - 0.010 * H], [0.044 * H, y.neck + 0.014 * H], [0.046 * H, y.headBase + 0.016 * H]
  ], 16, 0.87), { bone: 'Neck', color: NAVY });
  // ---- THE HOOD: a big soft collar around the neck, buttoned at the front --
  // Canon wears the hoodie under the jacket and its hood bunches outside the
  // collar as one rounded mass, thickest at the back, with two gold buttons
  // where the halves meet under the chin.
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.058 * H, 0.036 * H, 10, 18), { scale: [1, 1, 0.92], rot: [84, 0, 0], pos: [0, 0.826 * H, -0.012 * H] }),
    { bone: 'Chest', color: HOOD });
  // the hood proper, folded at the back of the neck
  bag.add('cloth', tGeo(new THREE.SphereGeometry(0.060 * H, 14, 10), { scale: [1.15, 0.72, 0.85], pos: [0, 0.832 * H, -0.060 * H] }),
    { bone: 'Chest', color: HOOD });
  bag.add('cloth', tGeo(new THREE.SphereGeometry(0.046 * H, 12, 9), { scale: [1.1, 0.6, 0.8], pos: [0, 0.858 * H, -0.052 * H] }),
    { bone: 'Chest', color: HOOD_DK });
  // the two front buttons
  for (const [bx, by] of [[0.004, 0.842], [0.004, 0.818]]) {
    bag.add('metal', tGeo(new THREE.SphereGeometry(0.0072 * H, 8, 6), { scale: [1, 1, 0.5], pos: [bx * H, by * H, 0.062 * H] }), { bone: 'Chest', color: GOLD });
  }
  // sleeves: the jacket cuff, and the red hoodie cuff showing under it
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const d = wr.clone().sub(el).normalize();
    const c0 = wr.clone().addScaledVector(d, -0.055 * H), c1 = wr.clone().addScaledVector(d, -0.012 * H);
    const c2 = wr.clone().addScaledVector(d, 0.002 * H);
    bag.add('cloth', tubeBetween(c0, c1, [0.0262 * H, 0.0255 * H], { radial: 12, hSeg: 1 }), { bone: 'LoArm' + s, color: NAVY_DK });
    bag.add('cloth', tubeBetween(c1, c2, [0.0215 * H, 0.0205 * H], { radial: 12, hSeg: 1 }), { bone: 'LoArm' + s, color: HOOD });
  }
  // trousers: loose to the shin, cropped above the ankle over a black sock
  for (const s of ['L', 'R']) {
    const kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const d = an.clone().sub(kn).normalize();
    const hem = kn.clone().addScaledVector(d, 0.145 * H);
    bag.add('cloth', tubeBetween(kn.clone().addScaledVector(d, -0.02 * H), hem, [0.036 * H, 0.033 * H], { radial: 14, hSeg: 3 }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: BOT_C, blend: 0.05 });
    bag.add('cloth', tubeBetween(hem, an.clone().add(v3(0, 0.012 * H, 0)), [0.0215 * H, 0.020 * H], { radial: 10, hSeg: 2 }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: SOCK, blend: 0.05 });
    // sneaker: sole strip and toe cap over the base shoe block
    bag.add('cloth', tGeo(roundBox(0.050 * H, 0.012 * H, 0.128 * H, 0.004 * H), { pos: [an.x, an.y - 0.006 * H, an.z + 0.02 * H] }), { bone: 'Foot' + s, color: SOLE });
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.024 * H, 10, 8), { scale: [1, 0.55, 0.9], pos: [an.x, an.y + 0.004 * H, an.z + 0.070 * H] }), { bone: 'Foot' + s, color: SOLE });
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
    // the old uniform kit: collar, hood crescent, hem and cuffs (the base
    // model now builds a different jacket above)
    bag.add('cloth', latheY([
      [0.038 * H, y.neck - 0.013 * H], [0.044 * H, y.neck + 0.013 * H], [0.048 * H, y.headBase + 0.02 * H]
    ], 16, 0.87), { bone: 'Neck', color: NAVY });
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.06 * H, 0.03 * H, 8, 14, Math.PI * 1.15),
      { rot: [80, 0, 180], pos: [0, 0.822 * H, -0.058 * H] }), { bone: 'Chest', color: HOOD });
    bag.add('cloth', latheY([
      [0.078 * H, 0.42 * H], [0.0765 * H, 0.465 * H], [0.073 * H, 0.505 * H]
    ], 20, 0.79), { bone: 'Hips', color: NAVY });
    for (const s of ['L', 'R']) {
      const wr = joints.get('Hand' + s);
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.022 * H, 0.0245 * H, 0.04 * H, 10),
        { pos: [wr.x, wr.y + 0.02 * H, wr.z] }), { bone: 'LoArm' + s, color: NAVY_DK });
    }
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
  // Canon: narrow, sharp-cornered eyes under a heavy brow set low and angled
  // in, brown irises, a small set mouth. Brows the colour of the hair's
  // shadow, not black.
  addFace2(ctx, {
    eyeW: 0.50, eyeH: 0.25, eyeColor: 0x6e4530, limbalColor: 0x2a1610, eyeTilt: 3, eyeWrap: 14,
    browTilt: 14, browUp: 0.05, browW: 1.05, browH: 0.60, browColor: 0x5a3038, lashColor: 0x16121a,
    mouthW: 0.19, mouthCorner: -8, noseShadow: 0xd4ab8e
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
  // ---- CANON HAIR: a dense pink mass of short spikes over a dark undercut --
  // The reference has the pink as one body of hair — many short, fat spikes
  // pushed up and back from a fringe that sits just off the brow — and a
  // shaved dark band showing under it at the temples and the nape. Spikes are
  // seeded from the sculpted skin (`skinPoint`), so they grow out of the head
  // rather than out of a sphere that no longer exists.
  const rnd = (i, k) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1;   // deterministic jitter
  let si = 0;
  const seed = (dir, len, rBase, bend, jitter = 0.10) => {
    const d = v3(dir[0] + (rnd(si, 1) - 0.5) * jitter, dir[1] + (rnd(si, 2) - 0.5) * jitter, dir[2] + (rnd(si, 3) - 0.5) * jitter).normalize();
    const base = skinPoint(ctx, [d.x, d.y, d.z], -0.06);
    const L = headR * len * (0.9 + 0.2 * rnd(si, 4));
    const geo = coneSpike(headR * rBase, L, new THREE.Vector3(bend[0] * L, bend[1] * L, bend[2] * L), { radial: 6, hSeg: 4 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(base.x, base.y, base.z);
    geo.computeVertexNormals();
    geo.userData.shade = rnd(si, 9) < 0.45;
    spikes.push(geo);
    si++;
  };
  // crown: upright, leaning back
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.2;
    seed([Math.sin(a) * 0.30, 1, Math.cos(a) * 0.30 - 0.1], 0.46 + (i % 2) * 0.10, 0.38, [0, 0.25, -0.30]);
  }
  seed([0, 1, -0.05], 0.50, 0.38, [0, 0.2, -0.2]);
  // upper ring: flared, still leaning back
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.35;
    seed([Math.sin(a) * 0.70, 0.78, Math.cos(a) * 0.70], 0.42 + (i % 3) * 0.06, 0.36, [Math.sin(a) * 0.15, 0.30, Math.cos(a) * 0.1 - 0.25]);
  }
  // lower ring: the side and back mass, pointing outward and down-back
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.1;
    const back = Math.cos(a) < 0;
    seed([Math.sin(a) * 0.92, 0.42, Math.cos(a) * 0.92], back ? 0.38 : 0.32, 0.34, [Math.sin(a) * 0.1, -0.15, Math.cos(a) * 0.2]);
  }
  // fringe: short tufts across the forehead, pushed up off the brow, the
  // middle one splitting the hairline
  seed([0.05, 0.46, 1], 0.36, 0.32, [0.15, 0.55, 0.2]);
  seed([0.34, 0.44, 0.92], 0.34, 0.30, [0.25, 0.45, 0.2]);
  seed([-0.30, 0.44, 0.94], 0.34, 0.30, [-0.25, 0.45, 0.2]);
  seed([0.62, 0.38, 0.76], 0.32, 0.30, [0.35, 0.3, 0.2]);
  seed([-0.60, 0.38, 0.78], 0.32, 0.30, [-0.35, 0.3, 0.2]);
  // nape: down and back
  for (const sx of [-0.5, 0, 0.5]) seed([sx, 0.10, -0.95], 0.34, 0.32, [sx * 0.2, -0.45, -0.2]);
  // THE MASS. The rings above are the silhouette; this is the body of the
  // hair — a Fibonacci field of short, fat clumps over the whole upper skull,
  // dense enough that the cap under them is only glimpsed between clumps.
  // Canon and the imported model both read as spikes all the way down to the
  // hairline, never as a smooth dome with spikes on it.
  {
    const N = 64, gr = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const yy = 0.30 + (i / (N - 1)) * 0.68;            // n.y from the hairline to the crown
      const rr = Math.sqrt(1 - yy * yy), th = i * gr;
      const d = [Math.cos(th) * rr, yy, Math.sin(th) * rr];
      if (d[2] > 0.55 && yy < 0.50) continue;            // the face is bare
      const outward = [d[0] * 0.25, 0.12 - yy * 0.25, d[2] * 0.25 - 0.18];
      seed(d, 0.34 + 0.12 * rnd(i, 7), 0.30, outward, 0.06);
    }
  }
  // the undercut: a dark band below the pink from the temples round the nape
  // (SphereGeometry's phi starts at -X and passes the FRONT at pi/2, so the
  // open gap has to be centred there: 0.18pi..0.82pi leaves the face clear)
  bag.add('hair', tGeo(sphereShell(headR * 1.02, { phiStart: Math.PI * 0.92, phiLength: Math.PI * 1.16, thetaStart: Math.PI * 0.44, thetaLength: Math.PI * 0.12, scale: [1.0, 1, 1.06] }),
    { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.05] }), { bone: 'Head', color: HAIR_DK });
  }
  // scalp cap: shallow in front (brows stay clear), deep at the back — a
  // second tilted shell closes the nape
  // (the base variant's cap is tilted back: the front edge sits high on the
  // forehead where the fringe seeds take over, the back reaches the undercut)
  bag.add('hair', tGeo(sphereShell(headR * 1.07, { thetaLength: Math.PI * (aged ? 0.46 : 0.47), scale: [1, 0.96, 1.03] }),
    { rot: [aged ? 0 : -14, 0, 0], pos: [headC.x, headC.y + headR * 0.08, headC.z - headR * 0.05] }), { bone: 'Head', color: HAIR_C });
  bag.add('hair', tGeo(sphereShell(headR * 1.07, { thetaLength: Math.PI * 0.52, scale: [1, 1.04, 1] }),
    { rot: [-62, 0, 0], pos: [headC.x, headC.y - headR * 0.10, headC.z - headR * 0.30] }), { bone: 'Head', color: HAIR_C });
  const HAIR_SH = aged ? 0xa89694 : 0xd98680;
  for (const s of spikes) bag.add('hair', s, { bone: 'Head', color: s.userData.shade ? HAIR_SH : HAIR_C });

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
  // hair outline off: even a third-weight hull on the clump field shows
  // through the cap as a black hexagon per clump base (shot, discarded).
  // The clumps separate by a two-tone vertex colour instead.
  const model = finalizeModel(ctx, { springs, outlineThickness: 0.012, outlineHairScale: 0,
    materials: { metal: MAT.metal({ rimColor: 0xfff0c0 }) } });

  // ---- Sukuna overlay: markings + second eyes on the same mesh -------------
  // parented to the Head/Neck bones in bone-local space, hidden by default
  const head = model.getBone('Head');
  const headJ = joints.get('Head');
  const marks = new THREE.Group();
  marks.name = 'sukunaMarks';
  const flat = new THREE.MeshBasicMaterial({ color: MARK });
  // every mark sits ON the sculpted skin (skinPoint), then into Head-bone
  // space; the old flat-plane offsets floated off a face that now has cheeks
  const onSkin = (dir, out = 0.012) => { const p = skinPoint(ctx, dir, out); return [p.x - headJ.x, p.y - headJ.y, p.z - headJ.z]; };
  const cy = headC.y - headJ.y;
  const addMark = (geo, p, rotZ = 0, rotY = 0) => {
    const mesh = new THREE.Mesh(geo, flat);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.rotation.set(0, rotY, rotZ);
    marks.add(mesh);
  };
  for (const s of [1, -1]) {
    // cursed engraving across each cheek, just under the second eye
    addMark(roundBox(headR * 0.36, headR * 0.05, 0.004, 0.002), onSkin([s * 0.50, -0.56, 0.80]), s * -0.18, s * 0.35);
    // temple line dropping toward the jaw
    addMark(roundBox(headR * 0.05, headR * 0.32, 0.004, 0.002), onSkin([s * 0.86, -0.02, 0.42]), s * 0.22, s * 0.9);
    // second eye: dark slit + red iris on the cheekbone BELOW the natural eye
    const sp = onSkin([s * 0.44, -0.36, 0.86], 0.014);
    const slit = new THREE.Mesh(tGeo(almondEye(headR * 0.30, headR * 0.14, s * 4)), flat);
    slit.position.set(sp[0], sp[1], sp[2]); slit.rotation.y = s * 0.28;
    marks.add(slit);
    const ip = onSkin([s * 0.42, -0.35, 0.88], 0.020);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.045, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2038 }));
    iris.position.set(ip[0], ip[1], ip[2]); iris.rotation.y = s * 0.28;
    marks.add(iris);
    // red glow over the natural iris — the vessel's eyes turn
    const gp = onSkin([s * 0.40, -0.06, 0.92], 0.026);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.25 * 0.44, 10),
      new THREE.MeshBasicMaterial({ color: 0xff2038, transparent: true, opacity: 0.85 }));
    glow.scale.set(0.82, 1.12, 1);
    glow.position.set(gp[0] - s * headR * 0.02, gp[1], gp[2]); glow.rotation.y = s * 0.24;
    marks.add(glow);
  }
  // chin line
  addMark(roundBox(headR * 0.05, headR * 0.20, 0.004, 0.002), onSkin([0, -0.80, 0.80]));
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
