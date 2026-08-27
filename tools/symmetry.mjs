// SYMMETRY PASS — the one bone-placement correction that needs no human.
//
// A humanoid rig should be a mirror of itself. Where the left and right bones
// of a pair are NOT mirror images about the model's own mid-plane, one of them
// is in the wrong place — and unlike every other rigging fault, that can be
// said without knowing anything about anatomy, without trusting the skin
// weights, and without anybody looking at it.
//
// That last part is what makes it worth automating. The weight-band estimator
// (joints.js analyzeJoints) can only tell you where the MESH thinks a joint
// is, which is useless when the mesh is the thing that is wrong — and on a
// model with a smeared elbow it will confidently point 18 cm up the forearm.
// Asymmetry has no such failure mode: it is a fact about two numbers.
//
// WHAT IT CANNOT DO. A model whose BIND POSE is asymmetric — one arm forward,
// one back, as a fighting stance — has legitimately unmirrored bones, and
// averaging them would destroy the pose rather than repair the rig. Those are
// detected and refused rather than quietly mangled: see the stance check
// below, which measures the mesh itself rather than taking anyone's word.
//
//     node tools/symmetry.mjs                 # dry run, every manifest entry
//     node tools/symmetry.mjs maki megumi     # named entries only
//     node tools/symmetry.mjs --write         # merge the fixes into the manifest
//
// The fix is written as `joints` entries, which move where a bone ROTATES
// without moving the mesh — inverse-binds are rebuilt — so nothing has to be
// re-exported and the numbers survive the model being re-exported later.
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
const { guessBoneMap } = await import('../src/art/rig3d/bonemap.js');
const { rerigHierarchy } = await import('../src/art/rig3d/retarget.js');
const { symmetryGaps, applyJointEdits, POSED_CM, MIRRORED_CM } = await import('../src/art/rig3d/joints.js');

const MODELS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const MANIFEST = path.join(MODELS, 'manifest.json');
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const only = args.filter(a => !a.startsWith('-'));

// Below this the pair is already a mirror and there is nothing to repair —
// half a centimetre on a 1.75 m body is inside the noise of any exporter.
const FLOOR_CM = MIRRORED_CM;
// Above this, the pair is not mis-rigged, it is POSED. The measured split is
// unusually clean: across the seven models shipped so far every pair is either
// under 1.7 cm or over 20 cm, with nothing whatever in between. A rigger's
// slip is a centimetre; a fighting stance with one foot forward is half a
// metre. Anything past this and the model is refused rather than averaged,
// because mirroring a stance destroys the pose instead of repairing the rig.
const POSE_CM = POSED_CM;

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const mirror = v => new THREE.Vector3(-v.x, v.y, v.z);

/**
 * Measure one model. Everything is in MODEL space (the armature root's own
 * frame) and reported in centimetres at the character's shipped height, so
 * the numbers mean the same thing across models of different export scales.
 */
async function measure(file, boneMap, joints) {
  const buf = fs.readFileSync(path.join(MODELS, file));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
  const scene = gltf.scene;
  const { map } = guessBoneMap(scene, boneMap || {});
  if (!map.Hips) return null;
  rerigHierarchy(scene, map);
  // measure what is LEFT after the entry's existing joints, so a second run
  // reports "already symmetric" instead of re-deriving the same correction
  applyJointEdits(scene, joints);
  return symmetryGaps(scene, map, THREE);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Object.entries(manifest).filter(([k]) => !only.length || only.includes(k));
const fixes = {};
let anyRefused = false;

for (const [id, raw] of entries) {
  const src = typeof raw === 'string' ? { url: raw } : raw;
  const file = src.url.replace(/^\.\//, '');
  const m = await measure(file, src.boneMap, src.joints);
  if (!m) { console.log(`${id}: unmappable, skipped`); continue; }

  const posed = m.worstCm > POSE_CM;
  console.log(`\n=== ${id} (${file}) ===`);
  if (posed) {
    console.log(`  worst pair differs by ${m.worstCm.toFixed(1)} cm — this bind pose is ` +
      'POSED, not a rest. Refusing: mirroring it would average the stance away.');
  }
  for (const p of m.pairs) {
    const flag = p.cm < FLOOR_CM ? 'already mirrored' : `${(p.cm / 2).toFixed(1)} cm each`;
    console.log(`  ${(p.l + '/' + p.r).padEnd(15)} pair differs by ${p.cm.toFixed(1).padStart(5)} cm   ${flag}`);
  }
  if (posed) { anyRefused = true; continue; }
  if (m.worstCm < FLOOR_CM) { console.log('  -> already symmetric, nothing to do'); continue; }

  const joints = { ...(src.joints || {}) };
  let n = 0;
  for (const p of m.pairs) {
    if (p.cm < FLOOR_CM) continue;
    // `joints` is an offset in the model's own axes as a FRACTION OF HEIGHT
    const enc = v => [v.x / m.H, v.y / m.H, v.z / m.H].map(x => +x.toFixed(5));
    joints[p.nodeL] = enc(p.dL);
    joints[p.nodeR] = enc(p.dR);
    n += 2;
  }
  console.log(`  -> ${n} joint offsets`);
  fixes[id] = joints;
}

if (!WRITE) {
  console.log('\ndry run — nothing written. Re-run with --write to merge into the manifest.');
  if (anyRefused) console.log('one or more models were refused: their bind pose is a stance, not a rest.');
} else if (Object.keys(fixes).length) {
  for (const [id, joints] of Object.entries(fixes)) {
    const raw = manifest[id];
    manifest[id] = typeof raw === 'string' ? { url: raw, joints } : { ...raw, joints };
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\nwrote joints for ${Object.keys(fixes).join(', ')}`);
} else {
  console.log('\nnothing to write.');
}
