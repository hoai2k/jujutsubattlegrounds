// Headless check of every model in public/models/manifest.json.
//
// `?render3d` fails quietly by design — a rig it cannot map leaves the
// procedural body standing and writes one console line nobody is watching. So
// the claim "these models play the whole clip library" was only ever checked
// by loading each one in a browser and paging through clips by hand.
//
// This runs the REAL pipeline on the REAL files, headless: the same
// guessBoneMap -> rerigHierarchy -> applyJointEdits -> applyRestPose -> fitInto
// -> Retargeter sequence render3d.js runs at load, driven by the character's
// own procedural model playing its own compiled clips through the real
// AnimPlayer. What it cannot judge is how a model LOOKS — for that, shoot it
// on the viewer bench (`?render3d#viewer`, tools/shoot.mjs). What it does
// judge is everything that has actually gone wrong here:
//
//   · a rig whose bones the mapper cannot name
//   · a hierarchy that leaves limbs behind when the hips move (the Rigify
//     flat-parenting case rerigHierarchy exists for)
//   · a limb that stops tracking the drive rig part-way through some clip
//     nobody thought to open
//   · NaN anywhere in the imported skeleton
//   · a model that floats or sinks instead of standing on y = 0
//   · a triangle count that will cost the frame rate once two are on screen
//
//     node tools/modelcheck.mjs              # every manifest entry
//     node tools/modelcheck.mjs jogo         # one
//
// Exits non-zero if anything fails, so it can gate a model landing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// GLTFLoader reaches for browser globals while parsing materials. Textures are
// irrelevant to a skeleton check, so stub enough for the parse to finish.
globalThis.self = globalThis;
class StubImage { constructor() { this.width = 1; this.height = 1; } }
globalThis.Image = StubImage;
globalThis.document = { createElement: () => new StubImage(), createElementNS: () => new StubImage() };

const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { MeshoptDecoder } = await import('three/addons/libs/meshopt_decoder.module.js');
const { ROSTER } = await import('../src/characters/index.js');
const { makeClips } = await import('../src/art/anim/index.js');
const { AnimPlayer } = await import('../src/art/anim/player.js');
const { guessBoneMap } = await import('../src/art/rig3d/bonemap.js');
const { Retargeter, captureSourceRest, rerigHierarchy } = await import('../src/art/rig3d/retarget.js');
const { applyRestPose, fitInto, meshStats, TRI_BUDGET } = await import('../src/art/rig3d/render3d.js');
const { applyJointEdits } = await import('../src/art/rig3d/joints.js');

const MODELS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'models');
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};
const worldPos = (top, node) => {
  top.updateMatrixWorld(true);
  return new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
};
const dir = (a, b) => b.clone().sub(a).normalize();

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
async function loadScene(file) {
  const buf = fs.readFileSync(path.join(MODELS, file));
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await new Promise((res, rej) => loader.parse(ab, '', res, rej));
  return { scene: gltf.scene, bytes: buf.length };
}

// The limbs whose direction must agree with the drive rig's, everywhere.
const PAIRS = [
  ['UpArmL', 'LoArmL'], ['LoArmL', 'HandL'], ['UpArmR', 'LoArmR'], ['LoArmR', 'HandR'],
  ['ThighL', 'ShinL'], ['ShinL', 'FootL'], ['ThighR', 'ShinR'], ['ShinR', 'FootR'],
  ['Hips', 'Spine'], ['Spine', 'Chest'], ['Chest', 'Neck'], ['Neck', 'Head']
];

const manifest = JSON.parse(fs.readFileSync(path.join(MODELS, 'manifest.json'), 'utf8'));
const entries = Object.entries(manifest).filter(([k]) => !only.length || only.includes(k.split(':')[0]));
if (!entries.length) {
  console.log(only.length ? `nothing in the manifest matches ${only.join(', ')}` : 'manifest is empty');
  process.exit(1);
}

for (const [pick, raw] of entries) {
  const src = typeof raw === 'string' ? { url: raw } : { ...raw };
  const file = src.url.replace(/^\.\//, '');
  console.log(`\n=== ${pick} -> ${file} ===`);

  // '*' catch-all and variant picks both drive off the base character's model
  const id = pick === '*' ? 'yuji' : pick.split(':')[0];
  const entry = ROSTER[id];
  if (!entry) { check(`"${pick}" names a roster character`, false); continue; }

  // the drive rig, captured in bind exactly as render3d.js captures it
  const model = entry.buildModel();
  const srcRest = captureSourceRest(model);

  let scene, bytes;
  try { ({ scene, bytes } = await loadScene(file)); }
  catch (e) { check(`${file} loads`, false, e.message); continue; }

  const { map, missing, report } = guessBoneMap(scene, src.boneMap || {});
  check('the rig maps', !!map.Hips && missing.length <= 8,
    `${report}${missing.length ? `, missing ${missing.join(' ')}` : ''}`);
  if (!map.Hips) continue;

  const moved = rerigHierarchy(scene, map);
  applyJointEdits(scene, src.joints);
  applyRestPose(scene, src.pose);
  const wrapper = new THREE.Group();
  fitInto(wrapper, scene, model.H, src);
  model.group.add(wrapper);

  const stats = meshStats(scene);
  check(`not un-decimated (under ${TRI_BUDGET / 1000}k triangles)`, stats.tris <= TRI_BUDGET,
    `${(stats.tris / 1000).toFixed(0)}k tris, ${(bytes / 1048576).toFixed(1)} MB, ` +
    `${moved} bone${moved === 1 ? '' : 's'} reparented`);

  const rt = new Retargeter(model, srcRest, wrapper, map, { rotOffset: src.rotOffset });
  const clips = makeClips(id);
  const player = new AnimPlayer(model.bones, clips);
  const driveJoint = name => worldPos(model.group, model.getBone(name));

  // ---- every clip, every mapped limb ---------------------------------------
  let worst = 1, worstAt = '';
  for (const clip of clips.keys()) {
    player.play(clip, { fade: 0, restart: true });
    for (let f = 0; f < 30; f++) {
      player.update(1 / 60);
      model.update?.(1 / 60, 0);
      rt.apply();
      if (f % 10) continue;
      for (const [a, b] of PAIRS) {
        if (!map[a] || !map[b]) continue;
        const d = dir(driveJoint(a), driveJoint(b))
          .dot(dir(worldPos(model.group, map[a]), worldPos(model.group, map[b])));
        if (d < worst) { worst = d; worstAt = `${clip}: ${a}->${b}`; }
      }
    }
  }
  check(`every mapped limb tracks the drive rig across all ${clips.size} clips`, worst > 0.99,
    `worst dot=${worst.toFixed(4)}${worstAt ? ` at ${worstAt}` : ''}`);

  let nan = null;
  wrapper.traverse(n => {
    for (const v of [...n.position.toArray(), ...n.quaternion.toArray()]) {
      if (!Number.isFinite(v)) nan = n.name;
    }
  });
  check('no NaN anywhere in the imported skeleton', !nan, nan || '');

  // ---- standing, and going down --------------------------------------------
  player.play('idle', { fade: 0, restart: true });
  player.update(0.01);
  model.update?.(0.01, 0);
  rt.apply();
  const box = new THREE.Box3().setFromObject(wrapper);
  check('stands on the floor at idle', Math.abs(box.min.y) < 0.12,
    `feet y=${box.min.y.toFixed(3)}, ${(box.max.y - box.min.y).toFixed(2)} m tall ` +
    `(character H=${model.H.toFixed(2)})`);

  const standing = worldPos(model.group, map.Hips).y;
  player.play('knockdown', { fade: 0, restart: true });
  for (let f = 0; f < 40; f++) { player.update(1 / 60); model.update?.(1 / 60, 0); }
  rt.apply();
  const down = worldPos(model.group, map.Hips).y;
  check('a knockdown puts the hips on the floor', down < standing * 0.45,
    `hips ${standing.toFixed(2)} -> ${down.toFixed(2)}`);
}

console.log(failures ? `\n${failures} check${failures === 1 ? '' : 's'} FAILED` : '\nall models pass');
process.exit(failures ? 1 : 0);
