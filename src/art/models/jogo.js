// JOGO — Disaster Curse. Rebuilt against the official anime character art
// supplied by the user (full-body key visual, MAPPA design).
//
// ============================ REFERENCE SHEET ============================
// From the provided key visual (pose ignored, design followed):
//
// BUILD    Short and squat: big round head ≈ a third of his height, narrow
//          sloped shoulders, skinny pale arms, wide stance. In this game he
//          FLOATS (established gameplay direction) — the dangling legs keep
//          the squat silhouette.
// HEAD     A large, ROUND, pale blue-grey head — NOT a full cone. The
//          volcano is a small truncated BROWN CRATER SPOUT sitting on top of
//          the skull, with dark-brown lava drips running down the upper
//          skull like a spill (irregular blob edge). Smoke/embers vent from
//          the spout (live emitter; follows CE, flares on Overheat).
// FACE     One big round eye, dead center: white sclera, RED iris, dark
//          pupil. Wide open grin below it — dark mouth interior with a
//          purple tint, pale upper-lip curve. No nose.
// EARS     Round brown cork plugs on both sides.
// RUFF     A huge WHITE FUR RUFF that frames the entire head like a mane /
//          hood — it wraps from under the chin up around the sides and back
//          of the skull, open at the face.
// CLOTHES  Chartreuse (yellow-green) short CAPELET over the shoulders with
//          large black blotches, reaching about elbow depth. Under it a
//          charcoal-navy loose top and BAGGY knee-length trousers gathered
//          below the knee. Dark-brown boots/leggings from knee to foot,
//          shoes with RED SOLES. Hands bare, pale grey.
// PALETTE  skin #c6ccd2 (pale blue-grey) · crater/drips #6b4226, spout rim
//          #4a2c18 · eye iris #b02020 · mouth interior #3a2340 (purple) ·
//          ruff #f2efe6 · capelet #c9d44e, blotches #16181c · under-clothes
//          #232833 · boots #4e3222 · soles #a3271f · corks #8a5a36
// IDENTITY 1) round pale head with the small dripping crater spout
//          2) white mane-ruff + blotched chartreuse capelet
//          3) single red-irised eye + wide dark grin.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, finalizeModel } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell } from '../builders/geo.js';
import { v3 } from '../../core/mathutil.js';

const SKIN = 0xc6ccd2;
const CLOTH = 0x232833;
const CAPE = 0xc9d44e;
const BLOTCH = 0x16181c;
const RUFF = 0xf2efe6;
const CRATER = 0x6b4226;
const CRATER_DK = 0x4a2c18;
const BOOT = 0x4e3222;
const CORK = 0x8a5a36;
const MOLTEN_HOT = 0xffb03a;

export function buildJogo() {
  // capelet blotches: big, sparse, irregular
  const cCape = new THREE.Color(CAPE), cBlotch = new THREE.Color(BLOTCH);
  const blotchFn = (x, y, z) => {
    // low-frequency so the blobs are coherent patches, chartreuse-dominant
    const n = Math.sin(x * 12.7 + y * 6.3) * Math.sin(y * 8.1 + z * 13.9) * Math.sin(z * 8.7 + x * 5.1);
    return n > 0.3 ? cBlotch : cCape;
  };

  const spec = {
    id: 'jogo', name: 'Jogo', H: 1.42, headScale: 1.6,
    // squat: narrow sloped shoulders, thick middle, skinny arms
    shoulder: 0.115, hip: 0.06, muscle: 0.8, bulk: 1.22, legBulk: 1.05,
    skinTone: SKIN, clothColor: CLOTH, pantColor: CLOTH, shoeColor: BOOT,
    sleeveColor: CLOTH,
    torsoShape: { chest: 1.06, waist: 1.16, hip: 1.12 },
    face: { jaw: 0.8, chin: 0.6, width: 1.1, faceFlat: 0.42 },
    shoe: { len: 0.1, hgt: 0.045 },
    ears: false, // corked funnels instead
    palette: { rim: 0xd8e2ea, hairRim: 0xff8a5a, outline: 0x14161c, accent: 0xff5a1f, energy: 0xff5a1f }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;

  // ---- THE CRATER SPOUT ----------------------------------------------------
  // a small truncated volcano mouth on TOP of the round skull, flared lip,
  // open bowl. Brown rock, dark rim.
  const cCrater = new THREE.Color(CRATER), cRim = new THREE.Color(CRATER_DK);
  const spoutBase = headC.y + headR * 0.72;
  const spoutTop = headC.y + headR * 1.5;
  const spoutFn = (x, yy) => {
    const t = Math.min(1, Math.max(0, (yy - spoutBase) / (spoutTop - spoutBase)));
    return t > 0.75 ? cRim : cCrater;
  };
  bag.add('skin', tGeo(latheY([
    [headR * 0.52, spoutBase],
    [headR * 0.38, spoutBase + (spoutTop - spoutBase) * 0.55],
    [headR * 0.36, spoutBase + (spoutTop - spoutBase) * 0.8],
    [headR * 0.46, spoutTop],                 // flared lip
    [headR * 0.40, spoutTop + headR * 0.02],  // over the lip
    [headR * 0.28, spoutTop - headR * 0.28]   // down the inner bowl
  ], 18, 1), { pos: [headC.x, 0, headC.z] }), { bone: 'Head', color: spoutFn });
  // molten glow inside the bowl
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.28, 14),
    { rot: [-90, 0, 0], pos: [headC.x, spoutTop - headR * 0.2, headC.z] }),
    { bone: 'Head', color: MOLTEN_HOT });

  // ---- LAVA DRIPS: the dark spill running down the upper skull -------------
  // brown cap over the crown with an irregular blob edge
  bag.add('skin', tGeo(sphereShell(headR * 1.045, { thetaLength: Math.PI * 0.3, scale: [1, 1, 1] }),
    { pos: [headC.x, headC.y, headC.z] }), { bone: 'Head', color: CRATER });
  // hanging drip blobs around the cap rim, uneven lengths
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    const drop = headR * (0.14 + (i % 3) * 0.1);
    const rimY = headC.y + headR * Math.cos(Math.PI * 0.3);
    const rr = headR * Math.sin(Math.PI * 0.3) * 1.02;
    bag.add('skin', tGeo(new THREE.SphereGeometry(headR * (0.1 + (i % 2) * 0.05), 7, 6),
      { scale: [1, 1.9, 1], pos: [headC.x + Math.sin(a) * rr, rimY - drop, headC.z + Math.cos(a) * rr] }),
      { bone: 'Head', color: CRATER });
  }

  // ---- FACE: one red eye, the wide grin ------------------------------------
  const fz = faceZ + headR * 0.08;
  const eyeY = headC.y + headR * 0.02;
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.3, 18),
    { pos: [0, eyeY, fz] }), { bone: 'Head', color: 0xf2f4f8 });
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.16, 14),
    { pos: [0, eyeY, fz + headR * 0.008] }), { bone: 'Head', color: 0xb02020 });
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.07, 8),
    { pos: [0, eyeY, fz + headR * 0.014] }), { bone: 'Head', color: 0x180c0c });
  // the grin: wide open dark mouth, purple interior, pale upper-lip curve
  const mouthY = headC.y - headR * 0.42;
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.3, 16),
    { scale: [1.5, 0.85, 1], pos: [0, mouthY, fz - headR * 0.02] }), { bone: 'Head', color: 0x1a1218 });
  bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.22, 14),
    { scale: [1.45, 0.7, 1], pos: [0, mouthY - headR * 0.03, fz - headR * 0.014] }), { bone: 'Head', color: 0x3a2340 });
  // upper lip line kicked into the smile
  bag.add('flat', tGeo(roundBox(headR * 0.95, headR * 0.05, 0.004, 0.002),
    { pos: [0, mouthY + headR * 0.24, fz - headR * 0.01] }), { bone: 'Head', color: 0x8a9098 });

  // ---- ear corks -----------------------------------------------------------
  for (const s of [1, -1]) {
    bag.add('skin', tGeo(new THREE.CylinderGeometry(headR * 0.17, headR * 0.14, headR * 0.26, 8),
      { rot: [0, 0, s * 90], pos: [s * headR * 1.02, headC.y - headR * 0.08, headC.z - headR * 0.12] }),
      { bone: 'Head', color: CORK });
    bag.add('skin', tGeo(new THREE.CylinderGeometry(headR * 0.1, headR * 0.1, headR * 0.06, 8),
      { rot: [0, 0, s * 90], pos: [s * headR * 1.16, headC.y - headR * 0.08, headC.z - headR * 0.12] }),
      { bone: 'Head', color: 0x6a4226 });
  }

  // ---- THE MANE RUFF -------------------------------------------------------
  // white fur framing the whole head: an arc of fat puffs wrapping the sides
  // and back of the skull (open over the face), plus a chin-level collar row.
  // main arc: sides and back only — the face stays completely open. 0 = +z
  // (facing), so the sweep runs 90°..270° with a slight backward bias.
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.5 + (i / 8) * 1.0); // 90°..270°
    const rr = headR * 1.04;
    bag.add('cloth', tGeo(new THREE.SphereGeometry(headR * (0.36 + (i % 2) * 0.1), 8, 6),
      { pos: [headC.x + Math.sin(a) * rr, headC.y + headR * (0.1 + (i % 3) * 0.12), headC.z + Math.cos(a) * rr - headR * 0.08] }),
      { bone: 'Head', color: RUFF });
  }
  // under-chin puffs at the jaw corners only (the mane closing forward
  // without crossing the mouth)
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(new THREE.SphereGeometry(headR * 0.3, 8, 6),
      { pos: [s * headR * 0.78, headC.y - headR * 0.66, headC.z + headR * 0.28] }),
      { bone: 'Head', color: RUFF });
    bag.add('cloth', tGeo(new THREE.SphereGeometry(headR * 0.32, 8, 6),
      { pos: [s * headR * 0.95, headC.y - headR * 0.35, headC.z + headR * 0.05] }),
      { bone: 'Head', color: RUFF });
  }

  // ---- capelet: chartreuse with black blotches -----------------------------
  // a short cape flaring from the neck to elbow depth over the shoulders
  bag.add('cloth', tGeo(latheY([
    [0.158 * H, 0.665 * H], [0.155 * H, 0.69 * H], [0.15 * H, 0.72 * H],
    [0.135 * H, 0.755 * H], [0.115 * H, 0.79 * H], [0.09 * H, 0.815 * H], [0.055 * H, 0.845 * H]
  ], 36, 0.85), {}), { chain: torsoChain, color: blotchFn, blend: 0.05 });

  // ---- baggy knee-length trousers + brown boots ----------------------------
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const legChain = [
      { bone: 'Thigh' + s, point: hp }, { bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }
    ];
    // balloon thigh: fat tube from hip to just below the knee, gathered
    // (latheY profiles run bottom -> top)
    bag.add('cloth', tGeo(latheY([
      [0.036 * H, kn.y - 0.035 * H], [0.045 * H, kn.y - 0.015 * H], [0.062 * H, (hp.y + kn.y) / 2], [0.052 * H, hp.y + 0.03 * H]
    ], 14, 1), { pos: [hp.x, 0, hp.z] }), { chain: legChain, color: CLOTH, blend: 0.07 });
    // brown boot leg from below the knee to the shoe
    bag.add('cloth', tGeo(latheY([
      [0.024 * H, an.y + 0.01 * H], [0.026 * H, (kn.y + an.y) / 2], [0.032 * H, kn.y - 0.03 * H]
    ], 12, 1), { pos: [an.x * 0.7 + kn.x * 0.3, 0, an.z * 0.5 + kn.z * 0.5] }),
      { chain: legChain, color: BOOT, blend: 0.07 });
    // red sole under the shoe
    bag.add('cloth', tGeo(roundBox(0.05 * H, 0.014 * H, 0.115 * H, 0.004),
      { pos: [an.x, an.y - 0.02 * H, an.z + 0.018 * H] }), { bone: 'Foot' + s, color: 0xa3271f });
  }

  const model = finalizeModel(ctx, { outlineThickness: 0.011, outlineHairScale: 0 });

  // ---- LIVE CRATER EMITTER -------------------------------------------------
  // smoke + embers venting from the spout, parented to the Head bone.
  // Intensity follows his cursed energy (fighter sets setCraterLevel each
  // tick) and flares hard during Overheat.
  const head = model.getBone('Head');
  const headJ = joints.get('Head');
  const N = 60;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const seeds = [];
  const craterLocal = v3(headC.x - headJ.x, spoutTop - headJ.y - headR * 0.12, headC.z - headJ.z);
  for (let i = 0; i < N; i++) {
    seeds.push({
      ember: i % 3 === 0, t: Math.random(), sp: 0.5 + Math.random() * 0.9,
      dx: (Math.random() - 0.5) * 0.4, dz: (Math.random() - 0.5) * 0.4
    });
    pos[i * 3] = craterLocal.x; pos[i * 3 + 1] = craterLocal.y; pos[i * 3 + 2] = craterLocal.z;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: MOLTEN_HOT, size: 0.05, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const emitter = new THREE.Points(geo, mat);
  emitter.frustumCulled = false;
  head.add(emitter);

  let craterLevel = 0.4, overheat = false;
  model.setCraterLevel = v => { craterLevel = v; };
  model.setOverheat = on => { overheat = on; };
  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    const level = Math.min(1.6, craterLevel + (overheat ? 0.7 : 0));
    const attr = emitter.geometry.getAttribute('position');
    const height = headR * (1.8 + level * 2.0);
    for (let i = 0; i < N; i++) {
      const s = seeds[i];
      s.t += dt * s.sp * (0.5 + level * 0.8) * (s.ember ? 1.5 : 0.8);
      if (s.t > 1) { s.t = 0; s.dx = (Math.random() - 0.5) * 0.4; s.dz = (Math.random() - 0.5) * 0.4; }
      const spread = 0.12 + s.t * (s.ember ? 0.4 : 0.9);
      attr.array[i * 3] = craterLocal.x + s.dx * spread * headR * 2.6;
      attr.array[i * 3 + 1] = craterLocal.y + s.t * height;
      attr.array[i * 3 + 2] = craterLocal.z + s.dz * spread * headR * 2.6;
    }
    attr.needsUpdate = true;
    mat.opacity = 0.55 + level * 0.35;
    mat.size = 0.042 + level * 0.028;
    mat.color.setHex(overheat ? 0xffd23a : MOLTEN_HOT);
  };
  return model;
}
