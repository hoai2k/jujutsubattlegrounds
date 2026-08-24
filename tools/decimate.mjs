// DECIMATE — shrink an imported .glb without breaking its manifest entry.
//
// A model authored for rendering arrives with two orders of magnitude more
// geometry than a fighter should cost (Yuji shipped at 2.0M triangles). This
// simplifies the MESH and leaves the SKELETON completely alone, which is the
// property everything in public/models/manifest.json depends on:
//
//   boneMap / joints / pose  are keyed by BONE NAME, and `joints` and `pose`
//                            carry values in the bones' own local frames
//   the automatic passes     (bone mapping, hierarchy rerig, twist alignment,
//                            height fit) are all re-derived at load from the
//                            skeleton
//
// So as long as bone names and bone local transforms survive, every fix made
// on the workbench keeps applying to the new file. This tool asserts exactly
// that after writing, and refuses to claim success if anything drifted.
//
// Skin weights ride along per-vertex through the simplifier, so a decimated
// mesh keeps its binding; the weight-derived joint MEASUREMENT on the rig
// bench will shift slightly (fewer vertices in each band), but pivots already
// applied are unaffected.
//
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions \
//                   @gltf-transform/functions meshoptimizer
//
//   node tools/decimate.mjs public/models/yuji_rigged_optimized.glb \
//        public/models/yuji_rigged.glb --tris 120000
//   node tools/decimate.mjs --check a.glb b.glb        # compare only
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { weld, simplify } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { statSync } from 'node:fs';

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });

const argv = process.argv.slice(2);
const flag = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i < 0 ? def : argv[i + 1];
};
const checkOnly = argv.includes('--check');
const files = argv.filter(a => !a.startsWith('--') && /\.(glb|gltf)$/i.test(a));

const triCount = doc => doc.getRoot().listMeshes()
  .flatMap(m => m.listPrimitives())
  .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0);

// The skeleton, as the manifest sees it: every skin joint's name and its
// LOCAL transform. This is the whole compatibility contract.
function skeletonOf(doc) {
  const out = new Map();
  for (const skin of doc.getRoot().listSkins()) {
    for (const j of skin.listJoints()) {
      out.set(j.getName(), {
        t: j.getTranslation().map(v => +v.toFixed(6)),
        r: j.getRotation().map(v => +v.toFixed(6)),
        s: j.getScale().map(v => +v.toFixed(6)),
        parent: j.getParentNode()?.getName() ?? null
      });
    }
  }
  return out;
}

function compare(a, b) {
  const problems = [];
  for (const [name, ta] of a) {
    const tb = b.get(name);
    if (!tb) { problems.push(`bone dropped: ${name}`); continue; }
    for (const k of ['t', 'r', 's']) {
      const d = Math.max(...ta[k].map((v, i) => Math.abs(v - tb[k][i])));
      if (d > 1e-5) problems.push(`bone moved: ${name}.${k} by ${d.toExponential(1)}`);
    }
    if (ta.parent !== tb.parent) problems.push(`bone reparented: ${name} (${ta.parent} -> ${tb.parent})`);
  }
  for (const name of b.keys()) if (!a.has(name)) problems.push(`bone added: ${name}`);
  return problems;
}

function verdict(problems, nA, nB) {
  if (!problems.length) {
    console.log(`\n✅ SKELETON IDENTICAL — ${nA} bones, same names, same local transforms.`);
    console.log('   Every manifest fix (boneMap, joints, pose, rotOffset) still applies:');
    console.log('   point the manifest url at the new file and change nothing else.');
    return 0;
  }
  console.log(`\n⚠️  SKELETON CHANGED — ${problems.length} difference(s), ${nA} -> ${nB} bones:`);
  for (const p of problems.slice(0, 25)) console.log('   ' + p);
  if (problems.length > 25) console.log(`   …and ${problems.length - 25} more`);
  console.log('\n   Manifest entries keyed to a dropped/renamed bone will warn at load and be');
  console.log('   skipped. Re-check the model on /workbench/?edit=rig before shipping it.');
  return 1;
}

if (checkOnly) {
  const [a, b] = await Promise.all(files.map(f => io.read(f)));
  console.log(`${files[0]}: ${Math.round(triCount(a) / 1000)}k tris`);
  console.log(`${files[1]}: ${Math.round(triCount(b) / 1000)}k tris`);
  const sa = skeletonOf(a), sb = skeletonOf(b);
  process.exit(verdict(compare(sa, sb), sa.size, sb.size));
}

const [input, output] = files;
if (!input || !output) {
  console.error('usage: node tools/decimate.mjs <in.glb> <out.glb> [--tris 120000] [--ratio 0.06] [--error 0.02]');
  process.exit(2);
}

const doc = await io.read(input);
const before = triCount(doc);
const beforeSkel = skeletonOf(doc);
const wantTris = Number(flag('tris', 0));
const ratio = Number(flag('ratio', wantTris ? Math.min(1, wantTris / before) : 0.1));
const error = Number(flag('error', 0.02));

console.log(`${input}: ${Math.round(before / 1000)}k tris, ${beforeSkel.size} bones, ` +
  `${(statSync(input).size / 1e6).toFixed(1)} MB`);
console.log(`simplifying to ratio ${ratio.toFixed(4)} (error ${error})…`);

await doc.transform(
  // weld first or the simplifier sees a triangle soup and can barely reduce it
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false })
);
// keep the file meshopt-compressed, the way it arrived
doc.createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write(output, doc);

const after = await io.read(output);
const afterTris = triCount(after);
console.log(`${output}: ${Math.round(afterTris / 1000)}k tris ` +
  `(${(100 * afterTris / before).toFixed(1)}% of original), ` +
  `${(statSync(output).size / 1e6).toFixed(1)} MB`);
const afterSkel = skeletonOf(after);
process.exit(verdict(compare(beforeSkel, afterSkel), beforeSkel.size, afterSkel.size));
