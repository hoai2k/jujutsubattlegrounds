// THE BODY. A shared humanoid built from a BUILD PRESET (lean / athletic /
// heavy / slight / massive / wiry) and a height, on the shared skeleton.
// Character specs never place a vertex: they name a build, a height, a skin
// and a face, and the rest of the authoring layer (hair.js, garments.js)
// dresses what this makes.
import * as THREE from 'three';
import { createRig, PartBag } from '../rig.js';
import { latheY, tubeBetween, roundBox, tGeo, mergeGeos } from '../geo.js';
import { sculptHead, addFace2 } from './head.js';
import { v3, DEG } from '../../core/math.js';

// Proportion presets. Everything is a multiplier over the 7.5-head base.
export const BUILDS = {
  lean:     { shoulder: 0.104, hip: 0.050, muscle: 0.96, bulk: 0.94, legBulk: 0.92, neck: 0.98, chest: 1.00, waist: 0.90, hipR: 0.94 },
  athletic: { shoulder: 0.115, hip: 0.052, muscle: 1.06, bulk: 1.00, legBulk: 1.00, neck: 1.04, chest: 1.06, waist: 0.92, hipR: 0.98 },
  heavy:    { shoulder: 0.128, hip: 0.056, muscle: 1.22, bulk: 1.12, legBulk: 1.12, neck: 1.22, chest: 1.14, waist: 1.02, hipR: 1.04 },
  massive:  { shoulder: 0.140, hip: 0.060, muscle: 1.38, bulk: 1.26, legBulk: 1.22, neck: 1.35, chest: 1.22, waist: 1.10, hipR: 1.10 },
  slight:   { shoulder: 0.098, hip: 0.052, muscle: 0.88, bulk: 0.88, legBulk: 0.88, neck: 0.90, chest: 0.94, waist: 0.86, hipR: 1.00 },
  wiry:     { shoulder: 0.110, hip: 0.048, muscle: 1.00, bulk: 0.90, legBulk: 0.94, neck: 1.00, chest: 1.02, waist: 0.84, hipR: 0.90 },
  feminine: { shoulder: 0.098, hip: 0.056, muscle: 0.86, bulk: 0.90, legBulk: 0.96, neck: 0.86, chest: 0.98, waist: 0.80, hipR: 1.10 }
};

export const SKIN = {
  fair: 0xf3dcc8, light: 0xf0d2b8, warm: 0xe8c39e, tan: 0xd8a882, olive: 0xcfa27e, deep: 0x8f5d3d,
  pale: 0xf6e6dc, grey: 0xb9bfc8, blue: 0x8ea6c4, wood: 0x8c6a48, patch: 0xd9c2c2, ash: 0x5b5560
};

export function buildBody(spec) {
  const H = spec.height ?? 1.8;
  const B = { ...BUILDS[spec.build || 'athletic'], ...(spec.buildOverride || {}) };
  const headH = (H / 7.5) * (spec.headScale ?? 1);
  const headR = headH * 0.52;
  const sw = B.shoulder * H, hw = B.hip * H;
  const muscle = B.muscle, bulk = B.bulk;

  const y = {
    crotch: 0.44 * H, hips: 0.515 * H, spine: 0.60 * H, chest: 0.70 * H,
    neck: 0.845 * H, headBase: 0.872 * H, shoulder: 0.800 * H,
    hipSock: 0.495 * H, knee: 0.272 * H, ankle: 0.05 * H
  };
  const headC = v3(0, H - headR * 1.04, 0.012 * H);

  const joints = new Map();
  const J = (n, p) => joints.set(n, p);
  J('Hips', v3(0, y.hips, 0)); J('Spine', v3(0, y.spine, 0.004 * H)); J('Chest', v3(0, y.chest, 0.006 * H));
  J('Neck', v3(0, y.neck, 0.004 * H)); J('Head', v3(0, y.headBase, 0.008 * H));
  const armOut = Math.sin(13 * DEG), armDown = -Math.cos(13 * DEG);
  const upperLen = 0.158 * H * (spec.armLen ?? 1), foreLen = 0.148 * H * (spec.armLen ?? 1);
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
  // second arm pair (Sukuna)
  const a2 = spec.arms2;
  let extraBones = null;
  if (a2) {
    const sw2 = (a2.shoulder ?? 0.092) * H, y2 = (a2.shoulderY ?? 0.706) * H, k = a2.scale ?? 0.9;
    const out2 = Math.sin((a2.spread ?? 22) * DEG), down2 = -Math.cos((a2.spread ?? 22) * DEG);
    extraBones = [];
    for (const s of ['L', 'R']) {
      const m = s === 'L' ? 1 : -1;
      const sh = v3(m * sw2, y2, (a2.back ?? -0.026) * H);
      const el = sh.clone().add(v3(m * out2 * upperLen * k, down2 * upperLen * k, 0.004 * H));
      const wr = el.clone().add(v3(m * out2 * 0.55 * foreLen * k, down2 * foreLen * k, 0.026 * H));
      J('Clav' + s + '2', v3(m * 0.026 * H, y2 + 0.012 * H, (a2.back ?? -0.026) * H + 0.006 * H));
      J('UpArm' + s + '2', sh); J('LoArm' + s + '2', el); J('Hand' + s + '2', wr);
      extraBones.push({ name: 'Clav' + s + '2', parent: 'Chest' }, { name: 'UpArm' + s + '2', parent: 'Clav' + s + '2' },
        { name: 'LoArm' + s + '2', parent: 'UpArm' + s + '2' }, { name: 'Hand' + s + '2', parent: 'LoArm' + s + '2' });
    }
  }

  const rig = createRig(joints, extraBones);
  const bag = new PartBag(rig.boneIndex);
  const group = new THREE.Group();
  group.name = spec.id || 'humanoid';
  const skinTone = typeof spec.skin === 'string' ? (SKIN[spec.skin] ?? 0xf0d2b8) : (spec.skin ?? 0xf0d2b8);

  const torsoChain = [
    { bone: 'Hips', point: v3(0, y.crotch, 0) }, { bone: 'Spine', point: joints.get('Spine') },
    { bone: 'Chest', point: joints.get('Chest') }, { bone: 'Neck', point: joints.get('Neck') }
  ];
  const m = { H, headH, headR, headC, y, sw, hw, joints, upperLen, foreLen, torsoChain, B, skinTone, muscle, bulk };
  const ctx = { spec, m, rig, bag, group, springs: [], props: {}, slots: {} };

  // ---- torso: the naked body is always built; garments layer on top --------
  const bodySlot = spec.bodySlot ?? 'skin';
  const hipR = 0.070 * H * B.hipR * bulk, waistR = 0.056 * H * B.waist * bulk, chestR = 0.076 * H * B.chest * bulk;
  const bust = spec.bust ?? 0;
  const profile = [
    [hipR * 0.62, y.crotch], [hipR * 0.94, 0.47 * H], [hipR, 0.515 * H],
    [waistR, 0.60 * H], [chestR * (0.94 + bust * 0.06), 0.66 * H], [chestR * (1 + bust * 0.08), 0.72 * H],
    [chestR * 0.96, 0.775 * H], [0.052 * H * bulk, 0.822 * H], [0.026 * H, y.neck + 0.004 * H]
  ];
  bag.add(bodySlot, latheY(profile, 24, 0.74), { chain: torsoChain, color: spec.torsoColor ?? skinTone, blend: 0.05 });
  // pecs / chest plates: two shallow ellipsoids that give the chest a front
  if (spec.pecs && bodySlot === 'skin') {
    for (const s of [1, -1]) bag.add('skin', tGeo(new THREE.SphereGeometry(0.040 * H * muscle, 12, 8), { scale: [1.15, 0.7, 0.5], pos: [s * 0.036 * H, 0.715 * H, chestR * 0.74 * 0.74 + 0.012 * H] }), { chain: torsoChain, color: skinTone, blend: 0.05 });
  }
  // neck
  const nk = B.neck * (spec.neck ?? 1);
  bag.add('skin', tubeBetween(v3(0, y.neck - 0.012 * H, 0.004 * H), v3(0, y.headBase + 0.015 * H, 0.009 * H), [0.023 * H * nk, 0.021 * H * nk], { radial: 10, hSeg: 2 }), { bone: 'Neck', color: skinTone });

  // head
  const face = spec.face || {};
  if (spec.head?.kind && spec.head.kind !== 'human') {
    // non-human heads are generated by the feature library; leave a socket
    m.customHead = true;
  } else {
    bag.add('skin', tGeo(sculptHead(headR, face), { pos: [headC.x, headC.y, headC.z] }), { bone: 'Head', color: skinTone });
    addFace2({ ...ctx, spec: { ...spec, skinTone, face } }, spec.eyes || {});
  }

  // arms
  const armSlot = spec.armSlot ?? 'skin', foreSlot = spec.foreArmSlot ?? armSlot;
  const armColor = spec.armColor ?? skinTone, foreColor = spec.foreColor ?? armColor;
  const armChains = {};
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [{ bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }];
    armChains[s] = armChain;
    bag.add(armSlot, tubeBetween(sh.clone().add(v3(0, 0.012 * H, 0)), el, [0.031 * H * muscle, 0.0235 * H], { bulge: 0.14, bulgeAt: 0.42, hSeg: 7 }), { chain: armChain, color: armColor, blend: 0.09 });
    const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.014 * H);
    bag.add(foreSlot, tubeBetween(el, wrExt, [0.0235 * H * muscle, 0.0165 * H], { bulge: 0.11, bulgeAt: 0.28, hSeg: 7 }), { chain: armChain, color: foreColor, blend: 0.09 });
    bag.add(armSlot, tGeo(new THREE.SphereGeometry(0.0245 * H * muscle, 10, 8), { scale: [1, 1.05, 0.96], pos: [el.x, el.y, el.z] }), { chain: armChain, color: armColor, blend: 0.09 });
    const mm = s === 'L' ? 1 : -1;
    bag.add(armSlot, tGeo(new THREE.SphereGeometry(0.034 * H * muscle, 12, 9), { scale: [0.97, 1.22, 0.92], rot: [0, 0, mm * 13], pos: [sh.x + mm * 0.002 * H, sh.y - 0.001 * H, sh.z] }), { bone: 'UpArm' + s, color: armColor });
    bag.add(spec.handSlot ?? 'skin', buildHand(H * 1.06, s, wr, el), { bone: 'Hand' + s, color: spec.handColor ?? skinTone });
  }
  if (a2) {
    const k = a2.scale ?? 0.9;
    for (const s of ['L', 'R']) {
      const sh = joints.get('UpArm' + s + '2'), el = joints.get('LoArm' + s + '2'), wr = joints.get('Hand' + s + '2');
      const armChain = [{ bone: 'UpArm' + s + '2', point: sh }, { bone: 'LoArm' + s + '2', point: el }, { bone: 'Hand' + s + '2', point: wr }];
      bag.add(armSlot, tubeBetween(sh.clone().add(v3(0, 0.008 * H, 0)), el, [0.030 * H * muscle * k, 0.0225 * H * k], { bulge: 0.13, hSeg: 5 }), { chain: armChain, color: armColor, blend: 0.09 });
      const wrExt = wr.clone().addScaledVector(wr.clone().sub(el).normalize(), 0.012 * H);
      bag.add(armSlot, tubeBetween(el, wrExt, [0.0225 * H * muscle * k, 0.0158 * H * k], { bulge: 0.08, hSeg: 5 }), { chain: armChain, color: armColor, blend: 0.09 });
      bag.add(armSlot, tGeo(new THREE.SphereGeometry(0.028 * H * muscle * k, 10, 8), { pos: [sh.x, sh.y + 0.004 * H, sh.z] }), { bone: 'UpArm' + s + '2', color: armColor });
      bag.add('skin', buildHand(H * k, s, wr, el), { bone: 'Hand' + s + '2', color: spec.handColor ?? skinTone });
    }
  }
  m.armChains = armChains;

  // legs
  const legSlot = spec.legSlot ?? 'skin', legColor = spec.legColor ?? skinTone, lb = B.legBulk;
  const legChains = {};
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s), kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const legChain = [{ bone: 'Thigh' + s, point: hp }, { bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }];
    legChains[s] = legChain;
    bag.add(legSlot, tubeBetween(hp.clone().add(v3(0, 0.03 * H, 0)), kn, [0.049 * H * lb, 0.031 * H * lb], { bulge: 0.07, bulgeAt: 0.40, hSeg: 7 }), { chain: legChain, color: legColor, blend: 0.07 });
    bag.add(legSlot, tubeBetween(kn, an.clone().add(v3(0, 0.008 * H, 0)), [0.031 * H * lb, 0.019 * H], { bulge: 0.10, bulgeAt: 0.30, hSeg: 7 }), { chain: legChain, color: legColor, blend: 0.07 });
    bag.add(legSlot, tGeo(new THREE.SphereGeometry(0.0325 * H * lb, 10, 8), { scale: [1, 1.08, 0.96], pos: [kn.x, kn.y, kn.z] }), { chain: legChain, color: legColor, blend: 0.07 });
    if (spec.shoe !== false) bag.add(spec.shoeSlot ?? 'leather', buildShoe(H, an, spec.shoe || {}), { bone: 'Foot' + s, color: spec.shoeColor ?? 0x14151c });
  }
  m.legChains = legChains;
  return ctx;
}

function buildHand(H, side, wrist, elbow) {
  const dir = wrist.clone().sub(elbow).normalize();
  const parts = [];
  const tx = side === 'L' ? 1 : -1;
  const pitch = 0.0090 * H;
  parts.push(tGeo(roundBox(0.036 * H, 0.040 * H, 0.021 * H, 0.007 * H), { pos: [0, -0.022 * H, 0.001 * H] }));
  {
    const g = roundBox(0.037 * H, 0.024 * H, 0.017 * H, 0.004 * H, 6);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), yy = pos.getY(i), z = pos.getZ(i);
      const k = Math.cos(2 * Math.PI * (x / pitch - 0.5));
      const top = Math.max(0, Math.min(1, (yy - 0.004 * H) / (0.008 * H)));
      const back = Math.max(0, Math.min(1, (z - 0.003 * H) / (0.005 * H)));
      pos.setY(i, yy + 0.0030 * H * Math.max(0, k) * top);
      pos.setZ(i, z - 0.0016 * H * Math.max(0, -k) * back);
    }
    parts.push(tGeo(g, { rot: [26, 0, 0], pos: [0, -0.049 * H, -0.001 * H] }));
  }
  parts.push(tGeo(roundBox(0.036 * H, 0.015 * H, 0.013 * H, 0.004 * H, 3), { rot: [82, 0, 0], pos: [0, -0.0635 * H, -0.0105 * H] }));
  parts.push(tGeo(roundBox(0.011 * H, 0.024 * H, 0.012 * H, 0.004 * H), { rot: [10, 0, tx * 35], pos: [tx * 0.020 * H, -0.030 * H, 0.004 * H] }));
  parts.push(tGeo(roundBox(0.017 * H, 0.010 * H, 0.011 * H, 0.004 * H), { rot: [0, 0, tx * 12], pos: [tx * 0.009 * H, -0.050 * H, -0.011 * H] }));
  const geo = mergeGeos(parts);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
  geo.translate(wrist.x, wrist.y, wrist.z);
  geo.computeVertexNormals();
  return geo;
}

export function buildShoe(H, ankle, style) {
  const len = (style.len ?? 0.115) * H, wid = (style.wid ?? 0.046) * H, hgt = (style.hgt ?? 0.052) * H;
  const geo = roundBox(wid, hgt, len, 0.012 * H, 2);
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
  if (style.boot) {
    const shaft = new THREE.CylinderGeometry(0.030 * H, 0.033 * H, (style.boot === true ? 0.12 : style.boot) * H, 12);
    shaft.translate(ankle.x, ankle.y + 0.05 * H, ankle.z);
    return mergeGeos([geo, shaft]);
  }
  return geo;
}
