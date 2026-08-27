// HOW SHARP IS EVERY JOINT? — the defect that only shows in motion.
//
// A limb bends where two bones swap influence. If the swap takes half the limb,
// nothing bends AT the joint: the whole limb curves, and the eye reads an arm
// that is too long and made of rubber. At rest it looks perfect, which is why
// it survived four passes of looking at these models and one wrong diagnosis
// (I blamed the missing ink outline).
//
// It is not the rigger's fault. Rigify splits every limb into a bone and a
// TWIST bone that is a rigid child, automatic weighting spreads influence
// smoothly across all four, and the constraints that drive the twists in
// Blender cannot travel in a `.glb`. So this measures GROUPS — everything that
// rides with the parent against everything that rides with the child — and
// reports where the child's share crosses 10% and 90%, as a fraction of the
// whole limb.
//
// Read it against the two clean models: Maki and Mahito land at 13-21%, which
// is what this pipeline produces when it goes right. Past about 30% (or 9 cm)
// the joint is smeared, and `weights: [{ "tighten": "limbs" }]` is the repair.
//
//     node tools/bands.mjs              # every manifest entry
//     node tools/bands.mjs nobara       # one
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
const { applyJointEdits } = await import('../src/art/rig3d/joints.js');
const { applyWeightOps, handoverBand, restPositions, LIMB_JOINTS } =
  await import('../src/art/rig3d/weights.js');

const MODELS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const manifest = JSON.parse(fs.readFileSync(path.join(MODELS, 'manifest.json'), 'utf8'));
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const RAW = process.argv.includes('--raw');       // before the manifest's own repairs
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

console.log(RAW ? '\nAs the files ship, before any weight op:' :
  '\nAs the game loads them, weight ops applied:');
console.log('\n  model      joint     hand-over          band            ');
let smeared = 0;
for (const [id, rawEntry] of Object.entries(manifest)) {
  if (only.length && !only.includes(id)) continue;
  const src = typeof rawEntry === 'string' ? { url: rawEntry } : rawEntry;
  const buf = fs.readFileSync(path.join(MODELS, src.url.replace(/^\.\//, '')));
  const gltf = await new Promise((res, rej) => loader.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej));
  const scene = gltf.scene;
  const { map } = guessBoneMap(scene, src.boneMap || {});
  if (!map.Hips) { console.log(`  ${id}: unmappable`); continue; }
  rerigHierarchy(scene, map);
  applyJointEdits(scene, src.joints);
  if (!RAW) applyWeightOps(scene, src.weights, map);
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  const mesh = meshes.sort((a, b) =>
    b.geometry.attributes.position.count - a.geometry.attributes.position.count)[0];
  const P = restPositions(mesh);
  for (const j of LIMB_JOINTS) {
    const r = handoverBand(mesh, P, map, j);
    if (!r) { console.log(`  ${id.padEnd(10)} ${j.padEnd(8)} —`); continue; }
    const cm = r.band * r.limbCm;
    const bad = r.band > 0.30 || cm > 9;
    if (bad) smeared++;
    console.log(`  ${id.padEnd(10)} ${j.padEnd(8)} ` +
      `${r.lo.toFixed(2)}..${r.hi.toFixed(2)} (joint ${r.jointT.toFixed(2)})  ` +
      `${(r.band * 100).toFixed(0)}% of the limb = ${cm.toFixed(0)} cm` +
      `${bad ? '   <-- smeared' : ''}`);
  }
}
console.log(smeared
  ? `\n${smeared} joint(s) smeared — \`weights: [{ "tighten": "limbs" }]\` in the entry.`
  : '\nevery joint is sharp.');
