// Reusable humanoid base: heroic anime proportions (~7.5 heads), shared bone
// hierarchy, chain-weighted skinning. Character files differentiate build,
// height, silhouette and outfit on top of this.
import * as THREE from 'three';
import { createRig, PartBag } from '../rig/rig.js';
import { latheY, tubeBetween, roundBox, animeHead, almondEye, tGeo, mergeGeos } from './geo.js';
import { sculptHead } from './head2.js';
import { MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { SpringChain } from '../rig/springs.js';
import { GripSolver } from '../rig3d/grip.js';
import { v3, DEG } from '../../core/mathutil.js';

export function buildHumanoid(spec) {
  const H = spec.H;
  const headH = (H / 7.5) * (spec.headScale ?? 1);
  const headR = headH * 0.52;
  const sw = (spec.shoulder ?? 0.115) * H;   // shoulder half-width
  const hw = (spec.hip ?? 0.052) * H;        // hip socket half-width
  const muscle = spec.muscle ?? 1;
  const bulk = spec.bulk ?? 1;               // torso radii multiplier

  // Shoulder sockets sit low and inboard so the deltoid mass overlaps the
  // chest lathe instead of floating beside it — no gap at the armpit.
  const y = {
    crotch: 0.44 * H, hips: 0.515 * H, spine: 0.60 * H, chest: 0.70 * H,
    neck: 0.845 * H, headBase: 0.872 * H, shoulder: 0.800 * H,
    hipSock: 0.495 * H, knee: 0.272 * H, ankle: 0.05 * H
  };
  const headC = v3(0, H - headR * 1.04, 0.012 * H);

  // ---- joint layout (bind pose: relaxed A-pose, facing +Z) ----------------
  const joints = new Map();
  const J = (n, p) => joints.set(n, p);
  J('Hips', v3(0, y.hips, 0));
  J('Spine', v3(0, y.spine, 0.004 * H));
  J('Chest', v3(0, y.chest, 0.006 * H));
  J('Neck', v3(0, y.neck, 0.004 * H));
  J('Head', v3(0, y.headBase, 0.008 * H));
  const armOut = Math.sin(13 * DEG), armDown = -Math.cos(13 * DEG);
  const upperLen = 0.158 * H, foreLen = 0.148 * H;
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const sh = v3(m * sw, y.shoulder, 0);
    const el = sh.clone().add(v3(m * armOut * upperLen, armDown * upperLen, 0.006 * H));
    const wr = el.clone().add(v3(m * armOut * 0.5 * foreLen, armDown * foreLen, 0.03 * H));
    J('Clav' + s, v3(m * 0.030 * H, 0.794 * H, 0.012 * H));
    J('UpArm' + s, sh); J('LoArm' + s, el); J('Hand' + s, wr);
    J('Thigh' + s, v3(m * hw, y.hipSock, 0));
    J('Shin' + s, v3(m * hw * 1.08, y.knee, 0.012 * H));
    J('Foot' + s, v3(m * hw * 1.16, y.ankle, -0.006 * H));
  }

  // ---- SECOND ARM PAIR (Sukuna) -------------------------------------------
  // A four-armed body plan, declared by the spec rather than assumed by the
  // builder. The lower shoulders hang off the Chest below and behind the real
  // ones — inboard and back, so the four deltoids stack instead of sprouting
  // sideways in a row — and the whole limb is scaled down a touch so the upper
  // pair still reads as the dominant one.
  const a2 = spec.arms2;
  let extraBones = null;
  if (a2) {
    const sw2 = (a2.shoulder ?? 0.092) * H;
    const y2 = (a2.shoulderY ?? 0.706) * H;
    const k = a2.scale ?? 0.9;
    const out2 = Math.sin((a2.spread ?? 22) * DEG), down2 = -Math.cos((a2.spread ?? 22) * DEG);
    extraBones = [];
    for (const s of ['L', 'R']) {
      const m = s === 'L' ? 1 : -1;
      const sh = v3(m * sw2, y2, (a2.back ?? -0.026) * H);
      const el = sh.clone().add(v3(m * out2 * upperLen * k, down2 * upperLen * k, 0.004 * H));
      const wr = el.clone().add(v3(m * out2 * 0.55 * foreLen * k, down2 * foreLen * k, 0.026 * H));
      J('Clav' + s + '2', v3(m * 0.026 * H, y2 + 0.012 * H, (a2.back ?? -0.026) * H + 0.006 * H));
      J('UpArm' + s + '2', sh); J('LoArm' + s + '2', el); J('Hand' + s + '2', wr);
      extraBones.push(
        { name: 'Clav' + s + '2', parent: 'Chest' },
        { name: 'UpArm' + s + '2', parent: 'Clav' + s + '2' },
        { name: 'LoArm' + s + '2', parent: 'UpArm' + s + '2' },
        { name: 'Hand' + s + '2', parent: 'LoArm' + s + '2' }
      );
    }
  }

  const rig = createRig(joints, extraBones);
  const bag = new PartBag(rig.boneIndex);
  const group = new THREE.Group();
  group.name = spec.name || 'humanoid';

  const m = { H, headH, headR, headC, y, sw, hw, joints, upperLen, foreLen };

  // ---- core body ----------------------------------------------------------
  const torsoChain = [
    { bone: 'Hips', point: v3(0, y.crotch, 0) },
    { bone: 'Spine', point: joints.get('Spine') },
    { bone: 'Chest', point: joints.get('Chest') },
    { bone: 'Neck', point: joints.get('Neck') }
  ];
  m.torsoChain = torsoChain;

  // Which material archetype the torso and arms belong to. Everyone on the
  // roster is dressed, so 'cloth' is the default and nothing changes; a
  // bare-chested build asks for 'skin' and gets skin shading on the body
  // rather than fabric banding.
  const bodySlot = spec.bodySlot ?? 'cloth';
  // ARMS SEPARATELY. A dressed torso does not imply dressed arms: Toji wears a
  // tight SHORT-SLEEVED shirt, so his torso is fabric and his arms are bare
  // skin, and shading them out of the same slot bands the biceps like cloth.
  // Defaults to `bodySlot`, so every existing character is bit-identical.
  const armSlot = spec.armSlot ?? bodySlot;
  // FOREARM SEPARATELY AGAIN. A sleeve that stops at the forearm is a real
  // costume feature, not a shading detail: Yuta's uniform jacket and Kashimo's
  // robe both end mid-forearm and leave the arm bare below. Splitting the
  // forearm tube off the upper-arm tube is the only way to say that without
  // each character hand-building two arm tubes. Defaults to the upper arm, so
  // every existing model is bit-identical.
  const foreSlot = spec.foreArmSlot ?? armSlot;
  const foreColor = spec.foreSleeveColor ?? spec.sleeveColor ?? spec.clothColor ?? 0x333333;

  if (spec.torso !== false) {
    const t = spec.torsoShape || {};
    const hipR = 0.070 * H * (t.hip ?? 1) * bulk;
    const waistR = 0.056 * H * (t.waist ?? 1) * bulk;
    const chestR = 0.076 * H * (t.chest ?? 1) * bulk;
    const profile = [
      [hipR * 0.62, y.crotch], [hipR * 0.94, 0.47 * H], [hipR, 0.515 * H],
      [waistR, 0.60 * H], [chestR * 0.94, 0.66 * H], [chestR, 0.72 * H],
      [chestR * 0.96, 0.775 * H], [0.052 * H * bulk, 0.822 * H], [0.026 * H, y.neck + 0.004 * H]
    ];
    bag.add(bodySlot, latheY(profile, 22, 0.74), {
      chain: torsoChain, color: spec.torsoColorFn || spec.clothColor || 0x333333, blend: 0.05
    });
  }

  // neck. `neck` scales the radius: a thick-necked build (Yuji, Todo) says so
  // here instead of hiding it under a collar.
  const nk = spec.neck ?? 1;
  bag.add('skin', tubeBetween(v3(0, y.neck - 0.012 * H, 0.004 * H), v3(0, y.headBase + 0.015 * H, 0.009 * H),
    [0.023 * H * nk, 0.021 * H * nk], { radial: 10, hSeg: 2 }), { bone: 'Neck', color: spec.skinTone });

  // head. `head: 'sculpt'` opts into the second-generation head (head2.js):
  // brow ridge, sockets, cheekbones and nose in the mesh, with the face then
  // placed ON the skin by addFace2. It draws its own ears.
  const sculpt = spec.head === 'sculpt';
  bag.add('skin', tGeo(sculpt ? sculptHead(headR, spec.face || {}) : animeHead(headR, spec.face || {}), { pos: [headC.x, headC.y, headC.z] }),
    { bone: 'Head', color: spec.skinTone });
  // ears
  if (spec.ears !== false && !sculpt) {
    for (const s of [1, -1]) {
      bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.16, 8, 6), {
        scale: [0.45, 1, 0.7], pos: [s * headR * 0.94 * (spec.face?.width ?? 1), headC.y - headR * 0.08, headC.z - headR * 0.12]
      }), { bone: 'Head', color: spec.skinTone });
    }
  }

  // arms (full-arm chain so elbows/wrists blend inside each tube)
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    const armColor = spec.sleeveColor ?? spec.clothColor ?? 0x333333;
    // MUSCLE, NOT SAUSAGE. The swell of each tube peaks where the muscle
    // belly sits — bicep above mid-arm, forearm just under the elbow — rather
    // than dead centre, which is what made every limb read as a balloon.
    bag.add(armSlot, tubeBetween(sh.clone().add(v3(0, 0.012 * H, 0)), el, [0.031 * H * muscle, 0.0235 * H], { bulge: 0.12, bulgeAt: 0.42, hSeg: 7 }),
      { chain: armChain, color: armColor, blend: 0.09 });
    // forearm sleeve runs slightly past the wrist so the hand tucks into it
    const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.014 * H);
    bag.add(foreSlot, tubeBetween(el, wrExt, [0.0235 * H * muscle, 0.0165 * H], { bulge: 0.10, bulgeAt: 0.28, hSeg: 7 }),
      { chain: armChain, color: foreColor, blend: 0.09 });
    // ELBOW. A ball on the joint, weighted half to each bone by the chain, so
    // a bent arm has a rounded elbow instead of two tube ends shearing past
    // each other with the upper-arm cap poking out of the crook. Colour of
    // the upper sleeve: a sleeve that stops mid-forearm still covers it.
    if (spec.jointBalls !== false) {
      bag.add(armSlot, tGeo(new THREE.SphereGeometry(0.0245 * H * muscle, 10, 8), { scale: [1, 1.05, 0.96], pos: [el.x, el.y, el.z] }),
        { chain: armChain, color: armColor, blend: 0.09 });
    }
    // DELTOID, not a pad. An ellipsoid laid along the upper arm and tucked
    // onto the joint reads as the muscle that wraps the shoulder; the sphere
    // it replaces sat ON the shoulder like an epaulette.
    if (spec.shoulderCap !== false) {
      const m = s === 'L' ? 1 : -1;
      bag.add(armSlot, tGeo(new THREE.SphereGeometry(0.034 * H * muscle, 12, 9),
        { scale: [0.97, 1.22, 0.92], rot: [0, 0, m * 13], pos: [sh.x + m * 0.002 * H, sh.y - 0.001 * H, sh.z] }),
        { bone: 'UpArm' + s, color: armColor });
    }
    // hand
    bag.add('skin', buildHand(H, s, wr, el), { bone: 'Hand' + s, color: spec.handColor ?? spec.skinTone });
  }

  // second arm pair: same construction, scaled down, no shoulder cap (the
  // upper pair's deltoid already covers that shoulder line)
  if (a2) {
    const k = a2.scale ?? 0.9;
    for (const s of ['L', 'R']) {
      const sh = joints.get('UpArm' + s + '2'), el = joints.get('LoArm' + s + '2'), wr = joints.get('Hand' + s + '2');
      const armChain = [
        { bone: 'UpArm' + s + '2', point: sh }, { bone: 'LoArm' + s + '2', point: el }, { bone: 'Hand' + s + '2', point: wr }
      ];
      const armColor = a2.color ?? spec.sleeveColor ?? spec.clothColor ?? 0x333333;
      bag.add(a2.slot ?? bodySlot, tubeBetween(sh.clone().add(v3(0, 0.008 * H, 0)), el,
        [0.030 * H * muscle * k, 0.0225 * H * k], { bulge: 0.13, hSeg: 5 }),
        { chain: armChain, color: armColor, blend: 0.09 });
      const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.012 * H);
      bag.add(a2.slot ?? bodySlot, tubeBetween(el, wrExt, [0.0225 * H * muscle * k, 0.0158 * H * k],
        { bulge: 0.08, hSeg: 5 }), { chain: armChain, color: armColor, blend: 0.09 });
      bag.add(a2.slot ?? bodySlot, tGeo(new THREE.SphereGeometry(0.028 * H * muscle * k, 10, 8),
        { pos: [sh.x, sh.y + 0.004 * H, sh.z] }), { bone: 'UpArm' + s + '2', color: armColor });
      bag.add('skin', buildHand(H * k, s, wr, el), { bone: 'Hand' + s + '2', color: spec.handColor ?? spec.skinTone });
    }
  }

  // legs
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const legChain = [
      { bone: 'Thigh' + s, point: hp }, { bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }
    ];
    const legColor = spec.pantColor ?? spec.clothColor ?? 0x22242e;
    const lb = spec.legBulk ?? 1;
    // LEGS SEPARATELY, for the same reason `armSlot` and `foreArmSlot` above
    // exist: a dressed torso does not imply dressed legs. Uro is bare-legged
    // and barefoot, and shading a bare thigh out of the cloth slot bands it
    // like fabric. Defaults to 'cloth', so every existing model is
    // bit-identical.
    const legSlot = spec.legSlot ?? 'cloth';
    bag.add(legSlot, tubeBetween(hp.clone().add(v3(0, 0.03 * H, 0)), kn, [0.049 * H * lb, 0.031 * H * lb], { bulge: 0.06, bulgeAt: 0.40, hSeg: 7 }),
      { chain: legChain, color: legColor, blend: 0.07 });
    // the calf sits high on the shin; the straight taper this replaces made
    // every lower leg a cone
    bag.add(legSlot, tubeBetween(kn, an.clone().add(v3(0, 0.008 * H, 0)), [0.031 * H * lb, 0.019 * H], { bulge: 0.09, bulgeAt: 0.30, hSeg: 7 }),
      { chain: legChain, color: legColor, blend: 0.07 });
    // KNEE — see the elbow above; the same fault, more visible, because every
    // stance in the roster has the knees bent
    if (spec.jointBalls !== false) {
      bag.add(legSlot, tGeo(new THREE.SphereGeometry(0.0325 * H * lb, 10, 8), { scale: [1, 1.08, 0.96], pos: [kn.x, kn.y, kn.z] }),
        { chain: legChain, color: legColor, blend: 0.07 });
    }
    // SHOE. `shoe: false` omits it entirely — the barefoot case, where the
    // block under a bare ankle reads as a sock however small it is scaled.
    if (spec.shoe !== false) {
      bag.add(spec.shoeSlot ?? 'cloth', buildShoe(H, an, spec.shoe || {}),
        { bone: 'Foot' + s, color: spec.shoeColor ?? 0x14151c });
    }
  }

  return { spec, m, rig, bag, group };
}

// THE FIST. Was a palm block, a finger block and a thumb block — three boxes,
// and the seam between the first two was visible from behind at fighting
// distance. Now the finger block is SCULPTED rather than assembled: one
// surface with four knuckles raised along its top edge and three grooves
// pressed into its face, a second block folded under for the middle
// phalanges, and a thumb in two segments whose tip lies across the fingers.
//
// One surface, not four fingers, on purpose. The outline pass is an inverted
// hull grown ~12 mm along every normal, and a hand built from separate
// fingers puts each finger's hull inside its neighbour and paints black
// speckle across the whole fist — that was tried first and shot. Displacing
// one block gives the silhouette the knuckle ridge and the shading the
// grooves with nothing to poke through anything else.
//
// Same frame and footprint as the mitt (fingers end at the same depth, thumb
// on the same side, curl toward -Z), so every weapon attachment authored
// against the old hand still lands in the grip.
function buildHand(H, side, wrist, elbow) {
  const dir = wrist.clone().sub(elbow).normalize();
  const parts = [];
  const tx = side === 'L' ? 1 : -1;            // thumb side, unchanged from the mitt
  const pitch = 0.0090 * H;                    // finger spacing
  // palm
  parts.push(tGeo(roundBox(0.036 * H, 0.040 * H, 0.021 * H, 0.007 * H), { pos: [0, -0.022 * H, 0.001 * H] }));
  // proximal phalanges: one block, knuckles raised on the top edge, grooves
  // pressed into the back of the hand between them
  {
    const g = roundBox(0.037 * H, 0.024 * H, 0.017 * H, 0.004 * H, 6);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const k = Math.cos(2 * Math.PI * (x / pitch - 0.5));   // +1 on a knuckle, -1 between
      const top = Math.max(0, Math.min(1, (y - 0.004 * H) / (0.008 * H)));
      const back = Math.max(0, Math.min(1, (z - 0.003 * H) / (0.005 * H)));
      pos.setY(i, y + 0.0030 * H * Math.max(0, k) * top);
      pos.setZ(i, z - 0.0016 * H * Math.max(0, -k) * back);
    }
    parts.push(tGeo(g, { rot: [26, 0, 0], pos: [0, -0.049 * H, -0.001 * H] }));
  }
  // middle phalanges folded under toward the palm
  parts.push(tGeo(roundBox(0.036 * H, 0.015 * H, 0.013 * H, 0.004 * H, 3), { rot: [82, 0, 0], pos: [0, -0.0635 * H, -0.0105 * H] }));
  // thumb: base down the side of the palm, tip folded across the fingers
  parts.push(tGeo(roundBox(0.011 * H, 0.024 * H, 0.012 * H, 0.004 * H), { rot: [10, 0, tx * 35], pos: [tx * 0.020 * H, -0.030 * H, 0.004 * H] }));
  parts.push(tGeo(roundBox(0.017 * H, 0.010 * H, 0.011 * H, 0.004 * H), { rot: [0, 0, tx * 12], pos: [tx * 0.009 * H, -0.050 * H, -0.011 * H] }));
  const geo = mergeGeos(parts);
  // orient down the forearm axis and place at the wrist
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
  geo.translate(wrist.x, wrist.y, wrist.z);
  geo.computeVertexNormals();
  return geo;
}

function buildShoe(H, ankle, style) {
  const len = (style.len ?? 0.115) * H, wid = (style.wid ?? 0.045) * H, hgt = (style.hgt ?? 0.052) * H;
  const geo = roundBox(wid, hgt, len, 0.012 * H, 2);
  // taper the toe
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z > len * 0.1) {
      const t = (z - len * 0.1) / (len * 0.4);
      pos.setX(i, pos.getX(i) * (1 - 0.28 * t));
      pos.setY(i, pos.getY(i) * (1 - 0.34 * t) - hgt * 0.08 * t);
    }
  }
  geo.computeVertexNormals();
  geo.translate(ankle.x, ankle.y - 0.012 * H + hgt * 0.28, ankle.z + len * 0.16);
  return geo;
}

// Stylized anime face: sclera + iris + lash line + brows + mouth (flat slot),
// nose wedge (skin slot). Opts control shape/color per character.
export function addFace(ctx, o = {}) {
  const { bag } = ctx;
  const { headR, headC } = ctx.m;
  const faceZ = headC.z + headR * 0.615; // proud of the flattened face plane
  const eyeY = headC.y - headR * 0.10;
  const skin = ctx.spec.skinTone;
  const eyeW = headR * (o.eyeW ?? 0.52), eyeH = headR * (o.eyeH ?? 0.30);
  const white = 0xf2f4f8;
  for (const s of o.noEyes ? [] : [1, -1]) {
    const ex = s * headR * 0.40;
    // lash line: bold dark stroke above the eye
    bag.add('flat', tGeo(roundBox(eyeW * 1.06, eyeH * 0.24, 0.004, 0.002),
      { rot: [0, 0, s * (o.lashTilt ?? 8)], pos: [ex, eyeY + eyeH * 0.42, faceZ + headR * 0.028] }),
      { bone: 'Head', color: o.lashColor ?? 0x11131c });
    // sclera
    bag.add('flat', tGeo(almondEye(eyeW, eyeH, s * (o.eyeTilt ?? 6) * (s > 0 ? 1 : -1)),
      { scale: [1, 1, 1], pos: [ex - (s > 0 ? 0 : -eyeW * 0.0), eyeY, faceZ + headR * 0.02], rot: [0, 0, s > 0 ? 0 : 0] }),
      { bone: 'Head', color: white });
    // iris
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.42, 12),
      { scale: [0.82, 1.15, 1], pos: [ex - s * eyeW * 0.06, eyeY + eyeH * 0.05, faceZ + headR * 0.024] }),
      { bone: 'Head', color: o.eyeColor ?? 0x2a6cc8 });
    // pupil glint
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.12, 8),
      { pos: [ex - s * eyeW * 0.02, eyeY + eyeH * 0.16, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0xffffff });
    // brow
    bag.add('flat', tGeo(roundBox(eyeW * 0.94, eyeH * 0.16, 0.004, 0.002),
      { rot: [0, 0, s * (o.browTilt ?? 10)], pos: [ex, eyeY + eyeH * (o.browUp ?? 1.05), faceZ + headR * 0.02] }),
      { bone: 'Head', color: o.browColor ?? 0x1a1c26 });
  }
  // nose: small wedge
  bag.add('skin', tGeo(new THREE.ConeGeometry(headR * 0.055, headR * 0.16, 4),
    { rot: [96, 0, 0], pos: [0, eyeY - headR * 0.24, faceZ + headR * 0.02] }),
    { bone: 'Head', color: skin });
  // mouth line
  bag.add('flat', tGeo(roundBox(headR * (o.mouthW ?? 0.24), headR * 0.045, 0.004, 0.002),
    { rot: [0, 0, o.mouthTilt ?? 0], pos: [0, headC.y - headR * 0.60, faceZ - headR * 0.045] }),
    { bone: 'Head', color: o.mouthColor ?? 0x552e33 });
}

// ---- finalize: materials, skeleton bind, outlines, springs, props ---------
export class CharacterModel {
  constructor(ctx, built) {
    this.id = ctx.spec.id;
    this.group = ctx.group;
    this.bones = ctx.rig.bones;
    this.boneList = ctx.rig.boneList;
    this.skeleton = built.skeleton;
    this.meshes = built.meshes;
    this.springs = built.springs;
    this.props = built.props;
    this.palette = ctx.spec.palette || {};
    this.H = ctx.spec.H;
    this.m = ctx.m;
  }
  update(dt) { for (const s of this.springs) s.update(dt); }
  resetSprings() { for (const s of this.springs) s.reset(); }
  getBone(n) { return this.bones.get(n); }
  attachProp(name, slotKey) {
    const p = this.props.get(name);
    if (!p) return;
    const at = p.attachments[slotKey];
    // WHICH SLOT IS LIVE, recorded. A weapon in a hand and the same weapon
    // slung on the back are the same node in different places, and anything
    // reading the attachment afterwards — the two-handed grip solver in
    // rig3d/grip.js is the one that does — has to know which of the two it
    // is looking at. Set even when the slot is missing, so `slot` always
    // says what was last asked for.
    p.slot = slotKey;
    if (!at) { p.node.visible = false; return; }
    const bone = this.bones.get(at.bone);
    bone.add(p.node);
    p.node.position.fromArray(at.pos || [0, 0, 0]);
    p.node.rotation.set((at.rot?.[0] || 0) * DEG, (at.rot?.[1] || 0) * DEG, (at.rot?.[2] || 0) * DEG);
    p.node.visible = true;
  }
  setVisible(v) { this.group.visible = v; }
}

export function finalizeModel(ctx, opts = {}) {
  const { rig, bag, group, spec } = ctx;
  group.add(rig.root);
  rig.root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.boneList);

  const pal = spec.palette || {};
  const rimColor = pal.rim ?? 0xbfd9ff;
  const materials = {
    skin: MAT.skin({ rimColor }),
    cloth: MAT.cloth({ rimColor }),
    hair: MAT.hair({ rimColor: pal.hairRim ?? rimColor }),
    metal: MAT.metal({ rimColor: pal.metalRim ?? 0xdfe8ff }),
    // FUR — the fifth archetype (see shaders/toon.js). Present by default so a
    // model can put geometry in the `fur` slot without also having to hand in a
    // material; Panda overrides it to tune the rim, and nobody else uses it, so
    // the cost to the existing roster is one unused material per model.
    fur: MAT.fur({ rimColor: pal.furRim ?? 0xfff4e2 }),
    flat: MAT.flat(),
    ...(opts.materials || {})
  };
  const meshes = bag.buildMeshes(s => materials[s], skeleton, group, rig.bones);

  // outlines (inverted hull) for the main body slots
  const oColor = pal.outline ?? 0x07080e;
  const oth = opts.outlineThickness ?? 0.012;
  const hairScale = opts.outlineHairScale ?? 1.2;
  // `outlineSlots` defaults to exactly the three slots this loop always
  // covered, so nothing on the roster changes. Panda passes `fur` as well —
  // he is a big rounded mass with almost no internal detail and his whole
  // readability at distance is the outline, so a fur slot without one
  // dissolves into the arena.
  for (const slot of (opts.outlineSlots || ['skin', 'cloth', 'hair'])) {
    if (!meshes[slot]) continue;
    const t = slot === 'hair' ? oth * hairScale : oth;
    if (t > 0.0001) group.add(makeOutline(meshes[slot], { color: oColor, thickness: t }));
  }

  // props: {name: {node, attachments:{key:{bone,pos,rot}}, default}}
  const props = new Map();
  for (const [name, def] of Object.entries(opts.props || {})) {
    props.set(name, { node: def.node, attachments: def.attachments, slot: null });
  }

  // springs from defs: {bone, localOffset, restDir, segments:[{len, mesh}], ...}
  const springs = [];
  for (const def of (opts.springs || [])) {
    springs.push(new SpringChain(rig.bones.get(def.bone), def));
  }

  const model = new CharacterModel(ctx, { skeleton, meshes, springs, props });
  for (const [name, p] of props) {
    const defKey = (opts.props[name].default) || Object.keys(p.attachments)[0];
    model.attachProp(name, defKey);
  }

  // ---- TWO-HANDED WEAPONS, ON THIS BODY TOO -------------------------------
  // A `grip` on an attachment says where the OFF hand belongs on the weapon.
  // rig3d/grip.js was written to hold an IMPORTED body's hand there, on the
  // argument that the procedural body needs no help — its clips were authored
  // against its own proportions.
  //
  // That argument does not survive a weapon whose attachment is SOLVED rather
  // than drawn. Maki's staff and naginata are laid through her hands by a
  // transform computed from one settled pose; every other frame — the idle's
  // own breathing bob included — moves the leading hand and swings the far
  // end, and the rear hand is then as approximate here as it is on an import.
  // So the same solver runs on the drive rig, over the drive rig's own bones,
  // and the authored angles become the pose it starts from rather than the
  // only thing holding the hand on.
  //
  // Costs nothing for the characters that declare no grip: the solver reports
  // itself inactive and the update hook is never installed.
  const grips = new GripSolver(model, Object.fromEntries(model.bones));
  if (grips.active) {
    model.grips = grips;
    const baseUpdate = model.update.bind(model);
    model.update = dt => {
      baseUpdate(dt);
      model.group.updateMatrixWorld(true);
      grips.apply();
    };
    const baseAttach = model.attachProp.bind(model);
    model.attachProp = (name, slot) => { baseAttach(name, slot); grips.refresh(); };
  }
  return model;
}

// convenience: cloth flap mesh (tapered box) for spring segments, pointing -Y
export function makeFlapMesh(w0, w1, len, thick, material, color = 0xffffff, outlineOpts) {
  const geo = new THREE.BufferGeometry();
  const hw0 = w0 / 2, hw1 = w1 / 2, ht = thick / 2;
  const posArr = [
    -hw0, 0, ht, hw0, 0, ht, hw0, 0, -ht, -hw0, 0, -ht,
    -hw1, -len, ht, hw1, -len, ht, hw1, -len, -ht, -hw1, -len, -ht
  ];
  const idx = [0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 6, 2, 6, 3, 3, 6, 7, 3, 7, 0, 0, 7, 4, 4, 7, 5, 5, 7, 6, 0, 1, 2, 0, 2, 3];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const nonIdx = geo.toNonIndexed();
  // vertex colors expected by shared toon materials
  const n = nonIdx.getAttribute('position').count;
  const c = new THREE.Color(color);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  nonIdx.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const grp = new THREE.Group();
  const mesh = new THREE.Mesh(nonIdx, material);
  grp.add(mesh);
  if (outlineOpts) grp.add(makeOutline(mesh, outlineOpts));
  return grp;
}
