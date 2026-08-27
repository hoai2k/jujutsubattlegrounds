// LANDMARKS — score a verification-bench decisions file, and apply the part
// of it that is a measurement.
//
// The bench (`/workbench/?edit=verification`) hands back where a person says
// each joint is. This is what turns that into a manifest entry, and — more
// importantly — what refuses to.
//
// WHY IT IS NOT JUST "MOVE THE BONES TO THE MARKS". Nobara's first export
// asked for pivot moves of up to 22% of body height, and applying it whole
// would have been a disaster. Reading it against the model showed why, and
// each of these is now a rule:
//
// · A MARK'S HEIGHT IS A MEASUREMENT; ITS DEPTH IS A GUESS. A tap is a ray,
//   and the bench puts the point inside the body with a heuristic that is
//   wrong by centimetres ALONG THE LINE OF SIGHT. On that first export every
//   one of seventeen marks was 2.7% of height to one side and 3-6 cm behind
//   the bones — on a model whose mesh and bones both centre on x = 0.000. So
//   only the vertical component is taken, unless the mark was properly
//   triangulated (`qualityPct`, the conditioning of the ray intersection),
//   which removes the depth error outright. Note what that is NOT: two taps
//   from opposite sides. Those are the same line and settle nothing along it —
//   a quarter turn is the angle that works, measured at 0.6-1.4 cm against
//   3-6 cm for 180°.
// · SMALL DISAGREEMENTS ARE NOISE. Under ~2% of height (3 cm on a 1.6 m
//   fighter) a mark and a bone agree as well as a person can point. Applying
//   those made every already-correct joint slightly worse.
// · A SYMMETRIC RIG DESERVES A SYMMETRIC FIX. Two independent taps at the two
//   thighs differed by 0.5 cm, which is fine as aim and unacceptable as a
//   rig: modelcheck's symmetry gate rejected it, correctly. L/R pairs are
//   averaged.
// · THE SCORE IS AGAINST THE DRIVE RIG. What "better" means here is: closer
//   to where the procedural character the model stands in for keeps that
//   joint, because that is what the retargeter aims at. Both numbers are
//   reported — joint height, and the bone directions the bind alignment reads
//   — and a rule that improves one while wrecking the other is visible.
//
//     node tools/landmarks.mjs decisions.json           # score it, write nothing
//     node tools/landmarks.mjs decisions.json --write   # merge into the manifest
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.self = globalThis;
class StubImage { constructor() { this.width = 1; this.height = 1; } }
globalThis.Image = StubImage;
globalThis.document = { createElement: () => new StubImage(), createElementNS: () => new StubImage() };

const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
const { ROSTER } = await import('../src/characters/index.js');
const { captureSourceRest, rerigHierarchy } = await import('../src/art/rig3d/retarget.js');
const { guessBoneMap } = await import('../src/art/rig3d/bonemap.js');
const { applyJointEdits } = await import('../src/art/rig3d/joints.js');

const MODELS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const MANIFEST = path.join(MODELS, 'manifest.json');
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const FILE = args.find(a => !a.startsWith('-'));
if (!FILE) { console.error('usage: node tools/landmarks.mjs <decisions.json> [--write]'); process.exit(2); }

// Below this a mark and a bone agree as well as a person can point.
const NOISE_PT = 2.0;
// How well the rays have to pin a landmark before its sideways and front-back
// components are worth anything. This is the CONDITIONING of the intersection
// (RigSession.landmarkQuality), not the angle: 175° is a wide angle and a
// useless one, because two opposite rays are the same line.
const TRIANGULATED_Q = 50;

const decisions = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const id = Object.keys(manifest).find(k => {
  const src = typeof manifest[k] === 'string' ? { url: manifest[k] } : manifest[k];
  return src.url.replace('./', '') === (decisions.model || '');
}) ?? decisions.reference;
const raw = manifest[id];
if (!raw) { console.error(`no manifest entry for "${decisions.model}"`); process.exit(2); }
const src = typeof raw === 'string' ? { url: raw } : raw;
const charId = (decisions.reference || id).split(':')[0];
if (!ROSTER[charId]) { console.error(`"${charId}" is not a roster character`); process.exit(2); }

const model = ROSTER[charId].buildModel();
const rest = captureSourceRest(model);
const H = model.H;
const buf = fs.readFileSync(path.join(MODELS, src.url.replace('./', '')));
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const KEYS = [['hips', 'Hips'], ['waist', 'Spine'], ['chest', 'Chest'], ['neckBase', 'Neck'],
  ['headCentre', 'Head'], ['shoulderL', 'UpArmL'], ['shoulderR', 'UpArmR'],
  ['elbowL', 'LoArmL'], ['elbowR', 'LoArmR'], ['wristL', 'HandL'], ['wristR', 'HandR'],
  ['hipL', 'ThighL'], ['hipR', 'ThighR'], ['kneeL', 'ShinL'], ['kneeR', 'ShinR'],
  ['ankleL', 'FootL'], ['ankleR', 'FootR']];
const MIRROR = [['DEF-thighL', 'DEF-thighR'], ['DEF-shinL', 'DEF-shinR']];
const PAIRS = [['UpArmL', 'LoArmL'], ['LoArmL', 'HandL'], ['UpArmR', 'LoArmR'], ['LoArmR', 'HandR'],
  ['ThighL', 'ShinL'], ['ShinL', 'FootL'], ['ThighR', 'ShinR'], ['ShinR', 'FootR'],
  ['Hips', 'Spine'], ['Spine', 'Chest'], ['Chest', 'Neck'], ['Neck', 'Head']];

const byKey = {};
for (const a of decisions.answers ?? []) if (a.kind === 'point') byKey[a.key] = a;

// TWO NAMES, ONE ANSWER. Nobara's pelvis and waist marks landed 2 mm apart,
// which is not two joints — it is one point answered twice, because the pelvis
// question used to ask for "the top of the hip bones" and that reads at the
// navel. A pair like that cannot both be right and there is no way to tell
// from the file which one is wrong, so neither is applied and both are named.
const CHAIN = ['hips', 'waist', 'chest', 'neckBase', 'headCentre'];
const contradictory = new Set();
for (let i = 0; i + 1 < CHAIN.length; i++) {
  const a = byKey[CHAIN[i]], b = byKey[CHAIN[i + 1]];
  if (!a || !b) continue;
  const gap = Math.abs(a.model[1] - b.model[1]) / (decisions.modelHeightM || 1) * 100;
  if (gap < NOISE_PT) { contradictory.add(CHAIN[i]); contradictory.add(CHAIN[i + 1]); }
}

/** The imported rig, with a given `joints`, as fractions of its own height. */
async function state(joints) {
  const gltf = await new Promise((res, rej) => loader.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
  const scene = gltf.scene;
  const { map } = guessBoneMap(scene, src.boneMap || {});
  rerigHierarchy(scene, map);
  applyJointEdits(scene, joints);
  scene.updateMatrixWorld(true);
  const toModel = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  let lo = Infinity, hi = -Infinity;
  scene.traverse(o => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone()
      .applyMatrix4(new THREE.Matrix4().copy(o.matrixWorld).premultiply(toModel));
    lo = Math.min(lo, b.min.y); hi = Math.max(hi, b.max.y);
  });
  const mh = hi - lo;
  const out = { _lo: lo, _mh: mh };
  for (const [, bone] of KEYS) {
    if (!map[bone]) continue;
    const p = new THREE.Vector3().setFromMatrixPosition(map[bone].matrixWorld).applyMatrix4(toModel);
    out[bone] = { x: p.x / mh, y: (p.y - lo) / mh, z: p.z / mh, node: map[bone].name };
  }
  return out;
}

/** Both numbers that matter, against the procedural rig the retargeter aims at. */
function score(st) {
  let sh = 0, n = 0;
  for (const [, bone] of KEYS) {
    const r = rest.get(bone);
    if (!r || !st[bone]) continue;
    sh += Math.abs(st[bone].y - r.worldPos.y / H) * 100; n++;
  }
  let sd = 0, m = 0, worst = 0, worstAt = '';
  for (const [a, b] of PAIRS) {
    const ra = rest.get(a), rb = rest.get(b);
    if (!ra || !rb || !st[a] || !st[b]) continue;
    const pd = rb.worldPos.clone().sub(ra.worldPos).normalize();
    const idr = new THREE.Vector3(st[b].x - st[a].x, st[b].y - st[a].y, st[b].z - st[a].z).normalize();
    const deg = Math.acos(Math.max(-1, Math.min(1, pd.dot(idr)))) * 180 / Math.PI;
    sd += deg; m++;
    if (deg > worst) { worst = deg; worstAt = `${a}->${b}`; }
  }
  return { height: sh / n, dir: sd / m, worst, worstAt };
}

const before = await state(src.joints);
const line = (label, s) => console.log(`  ${label.padEnd(30)} joint height ${s.height.toFixed(2)} pt   ` +
  `bone direction ${s.dir.toFixed(1)}° mean, ${s.worst.toFixed(1)}° worst (${s.worstAt})`);

console.log(`\n${FILE}\n  ${decisions.model} standing in for ${charId}, ` +
  `${Object.keys(byKey).length} marks, ` +
  `${Object.values(byKey).filter(a => (a.qualityPct ?? 0) >= TRIANGULATED_Q).length} triangulated`);

console.log('\nWHAT THE MARKS SAY  (points of body height; + means the mark is above the bone)');
const rows = [];
for (const [k, bone] of KEYS) {
  const a = byKey[k], b = before[bone];
  if (!a || !b) continue;
  const markY = (a.model[1] - before._lo) / before._mh;
  const dPt = (markY - b.y) * 100;
  const tri = (a.qualityPct ?? 0) >= TRIANGULATED_Q;
  const clash = contradictory.has(k);
  const use = !clash && Math.abs(dPt) >= NOISE_PT;
  rows.push({ k, bone, node: b.node, dPt, tri, use });
  console.log(`  ${k.padEnd(11)} ${bone.padEnd(8)} ${dPt.toFixed(1).padStart(6)} pt ` +
    `${(a.qualityPct == null ? '   ?' : a.qualityPct + '%').padStart(5)}  ` +
    `${clash ? 'CONTRADICTS its neighbour — skipped'
      : use ? (tri ? 'apply (triangulated)' : 'apply (height only)') : 'noise — left alone'}`);
}

// the candidate: height only, past the noise floor, L/R averaged
const joints = { ...(src.joints || {}) };
for (const r of rows) {
  if (!r.use) continue;
  const prev = joints[r.node] ?? [0, 0, 0];
  joints[r.node] = [prev[0], +(prev[1] + r.dPt / 100).toFixed(6), prev[2]];
}
for (const [l, rr] of MIRROR) {
  if (joints[l] && joints[rr]) {
    const y = +((joints[l][1] + joints[rr][1]) / 2).toFixed(6);
    joints[l] = [joints[l][0], y, joints[l][2]];
    joints[rr] = [joints[rr][0], y, joints[rr][2]];
  }
}
const after = await state(joints);

console.log('\nSCORE  (against the procedural rig the retargeter aims at)');
line('as shipped', score(before));
line('with these marks applied', score(after));

const b = score(before), a = score(after);
const better = a.height < b.height - 0.1 && a.dir <= b.dir + 0.5;
console.log(`\n  ${better ? 'WORTH APPLYING' : 'NOT worth applying'} — joint height ` +
  `${b.height.toFixed(2)} -> ${a.height.toFixed(2)} pt, direction ${b.dir.toFixed(1)} -> ${a.dir.toFixed(1)}°`);

// Re-running a file that has already been applied is the normal case — the
// entry is in git and the decisions file next to it — and it must read as
// "nothing to do" rather than as a refusal.
const applied = JSON.stringify(joints) === JSON.stringify(src.joints ?? {});
if (applied) {
  console.log('\nthese marks are already in the manifest — nothing to do.');
} else if (!WRITE) {
  console.log('\ndry run — nothing written. Re-run with --write to merge into the manifest.');
} else if (!better) {
  console.log('\nrefusing to write: this would not improve the rig.');
  process.exit(1);
} else {
  // provenance, so the entry says where its numbers came from and what they
  // bought — a `joints` block nobody can reproduce is a block nobody can
  // safely touch
  const note = `${Object.values(rows).filter(r => r.use).length} pivots from the landmark queue ` +
    `(${path.basename(FILE)}), height only, L/R averaged. Joint height against the drive rig ` +
    `${b.height.toFixed(2)} -> ${a.height.toFixed(2)} pt. Reproduce: node tools/landmarks.mjs <file> --write`;
  manifest[id] = typeof raw === 'string'
    ? { url: raw, joints, _joints: note }
    : { ...raw, joints, _joints: note };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nwrote joints for ${id} — now run tools/modelcheck.mjs ${id}`);
}
