// ?render3d — swap a character's procedural model for a rigged 3D humanoid.
//
// OPT-IN, OFF BY DEFAULT. Nothing here runs unless the URL carries the param,
// so the shipped game keeps its all-procedural contract; this is the one
// sanctioned door for external model files, and they are loaded at runtime
// from public/models/ (or any URL) rather than imported into the bundle.
//
//   ?render3d              use public/models/manifest.json (per-character)
//   ?render3d=<url>        use one .glb/.gltf for every fighter (quick test)
//
// manifest.json maps character ids (or picks like "gojo:shinjuku", or "*" as
// a catch-all) to either a plain URL string or an entry object:
//
//   {
//     "yuji": "./yuji.glb",
//     "gojo": {
//       "url": "./gojo.glb",
//       "scale": 1.0,          // extra multiplier on the height-normalized fit
//       "yOffset": 0,          // metres, after the feet are grounded
//       "faceYaw": 0,          // degrees, if the model doesn't face +Z
//       "boneMap": {"Chest": "Spine03", "HandL": null},   // override/drop
//       "joints": {"DEF-upper_armL": [0.118, 0.29, 0.06]},  // pivot fixes:
//                              // a bone's corrected LOCAL position. Moves
//                              // where the bone ROTATES without moving the
//                              // mesh (inverse-binds are rebuilt) — the fix
//                              // for a shoulder that sits too low. Authored
//                              // on /workbench/?edit=rig.
//       "toon": true,          // re-shade with the game's cel material +
//                              // outline (default). false = keep the file's
//                              // own PBR materials. An object overrides the
//                              // grade: {"saturation":1.6,"brightness":1.3}
//       "pose": {"LeftArm": [0, 0, 62]},   // rest-pose calibration: local
//                              // XYZ euler degrees per NODE NAME, applied at
//                              // load before anything is measured — how a
//                              // model that ships in some arbitrary pose is
//                              // stood up into a proper T/A bind. Authored on
//                              // the /workbench/?edit=models bench.
//       "rotOffset": {"UpArmL": [0, 0, -8]},              // degrees, world
//       "keepProps": true,     // procedural weapons stay in hand (default)
//       "hideSprings": true    // procedural hair/coat physics hidden (default)
//     }
//   }
//
// URLs resolve relative to the manifest itself, so a model dropped next to it
// in public/models/ is just its filename.
//
// The swap replaces only what the player SEES. The procedural skeleton keeps
// running underneath as the drive rig — combat, springs, prop attachment and
// every existing pose/clip stay authoritative — and retarget.js maps that
// pose onto the imported skeleton every frame. See retarget.js for how new
// models inherit every pose the game has.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// gltfpack-optimized models (the recommended way to shrink one) require the
// meshopt decoder or GLTFLoader refuses the file outright
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { guessBoneMap } from './bonemap.js';
import { Retargeter, captureSourceRest, rerigHierarchy } from './retarget.js';
import { applyJointEdits, collectSkeletons } from './joints.js';
import { stylizeToon } from './stylize.js';
import { DEG } from '../../core/mathutil.js';

// public/models/ resolved from ANY page — the game at the site root and the
// workbench one level down both land on the same folder. Lazy (a function,
// not a const) so importing this module in node never touches `location`.
export function modelsUrl(rel) {
  const root = new URL(/\/workbench\/(index\.html)?$/.test(location.pathname) ? '../' : './',
    document.baseURI);
  return new URL(rel, new URL('models/', root)).href;
}

// ---- request parsing (once) ------------------------------------------------
let _request;   // undefined = unparsed, null = off, {url|manifest} = on
function request() {
  if (_request !== undefined) return _request;
  _request = null;
  try {
    if (typeof location === 'undefined') return _request;   // node (tests)
    const sp = new URLSearchParams(location.search);
    if (!sp.has('render3d')) return _request;
    const v = (sp.get('render3d') || '').trim();
    _request = v ? { url: v } : { manifest: true };
  } catch { /* off */ }
  return _request;
}
export function render3dEnabled() { return !!request(); }

let _manifest = null;
function loadManifest() {
  _manifest ??= fetch(modelsUrl('manifest.json'))
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return _manifest;
}

// pick 'gojo:shinjuku' → entry for the pick, else the base id, else '*'
async function resolveSource(pick) {
  const req = request();
  if (!req) return null;
  const base = pick.split(':')[0];
  const m = req.manifest ? await loadManifest() : {};
  let entry = m[pick] ?? m[base] ?? m['*'] ?? null;
  if (typeof entry === 'string') entry = { url: entry };
  if (req.url) entry = { ...(entry || {}), url: req.url };
  if (!entry?.url) return null;
  // relative manifest URLs resolve against the manifest's own directory
  const url = new URL(entry.url, modelsUrl('manifest.json')).href;
  return { ...entry, url };
}

// ---- load cache: parse each URL once, clone per fighter --------------------
// Exported for the workbench, which loads the same way (including blob: URLs
// for a file dragged in before it is ever committed anywhere).
let _loader = null;
const _cache = new Map();
export function loadScene(url) {
  if (!_cache.has(url)) {
    if (!_loader) {
      _loader = new GLTFLoader();
      _loader.setMeshoptDecoder(MeshoptDecoder);
    }
    _cache.set(url, _loader.loadAsync(url).then(g => g.scene));
  }
  return _cache.get(url).then(scene => cloneSkeleton(scene));
}

// ---- the swap --------------------------------------------------------------
// Called synchronously right after a CharacterModel is built (bind pose still
// intact — the rest capture depends on that), then finishes async when the
// file arrives. Until it does, the procedural model shows; on failure it
// simply stays, with one warning.
export function maybeAttachRender3D(model, pick) {
  if (!render3dEnabled() || !model?.boneList || !model.group) return;
  const srcRest = captureSourceRest(model);
  resolveSource(pick)
    .then(src => src && loadScene(src.url).then(scene => attach(model, srcRest, scene, src, pick)))
    .catch(err => console.warn(`[render3d] ${pick}: failed —`, err?.message ?? err));
}

// Rest-pose calibration: local XYZ euler degrees per node name, applied to
// the loaded model's joints before anything measures or aligns against it.
// This is how a model that ships in an arbitrary pose (most do) is stood up
// into a proper bind — the retargeter then treats the calibrated pose as the
// model's rest. Authored on /workbench/?edit=models, stored in the manifest.
export function applyRestPose(root, pose) {
  if (!pose) return;
  const byName = new Map();
  root.traverse(o => { if (o.name && !byName.has(o.name)) byName.set(o.name, o); });
  for (const [name, e] of Object.entries(pose)) {
    const n = byName.get(name);
    if (!n) { console.warn(`[render3d] pose names no node "${name}"`); continue; }
    _e2.set(e[0] * DEG, e[1] * DEG, e[2] * DEG, 'XYZ');
    n.quaternion.setFromEuler(_e2);
  }
}
const _e2 = new THREE.Euler();

// Triangle budget. A model authored for a render is routinely two orders of
// magnitude heavier than one authored for a game, and the symptom — a frame
// rate that collapses the moment a second fighter spawns — looks like a bug
// in the renderer rather than a fact about the file. So it is counted and
// said out loud, once, at load.
export function meshStats(root) {
  let tris = 0, verts = 0, meshes = 0;
  root.traverse(o => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    if (o.name.endsWith('_outline')) return;
    const g = o.geometry;
    if (!g?.attributes?.position) return;
    meshes++;
    verts += g.attributes.position.count;
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return { tris: Math.round(tris), verts, meshes };
}
export const TRI_BUDGET = 150000;

// measure the model in its own space — geometry bounds plus every node
// origin, so even a mesh-light export still measures its skeleton
export function measureScene(scene) {
  const temp = new THREE.Group();
  const parent = scene.parent;
  temp.add(scene);
  temp.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const _p = new THREE.Vector3();
  scene.traverse(o => box.expandByPoint(_p.setFromMatrixPosition(o.matrixWorld)));
  temp.remove(scene);
  if (parent) parent.add(scene);
  return box;
}

// normalize: height to the character's H, feet on y=0, centred, facing +Z.
// Re-entrant — the bench calls it again after re-posing a model.
export function fitInto(wrapper, scene, H, src = {}) {
  scene.position.set(0, 0, 0);
  const box = measureScene(scene);
  const size = box.getSize(new THREE.Vector3());
  if (!(size.y > 1e-4)) throw new Error('model has no height');
  const s = (src.scale ?? 1) * H / size.y;
  wrapper.scale.setScalar(s);
  wrapper.rotation.y = (src.faceYaw ?? 0) * DEG;
  if (scene.parent !== wrapper) wrapper.add(scene);
  const c = box.getCenter(new THREE.Vector3());
  // centre x/z and ground the feet, in wrapper units (pre-rotation is fine —
  // the yaw spins the model about the very axis the offsets are measured on)
  scene.position.set(-c.x, -box.min.y + (src.yOffset ?? 0) / s, -c.z);
  return s;
}

function attach(model, srcRest, scene, src, pick) {
  // map bones and build the retargeter before touching visibility, so a
  // mapping failure leaves the procedural model exactly as it was
  const { map, missing, report } = guessBoneMap(scene, src.boneMap || {});
  if (!map.Hips || missing.length > 8) {
    throw new Error(`unusable rig (${report})`);
  }
  // THE LOAD ORDER. The workbench runs exactly this sequence, which is what
  // makes a bench export replay identically in the game:
  //   rerig  — normalize the hierarchy off the map
  //   joints — move pivots (rebuilds inverse-binds; must precede any posing,
  //            because it reads and rewrites children's local transforms)
  //   pose   — the rest-pose calibration (absolute local rotations)
  //   fit    — measure and normalize height/ground/facing
  rerigHierarchy(scene, map);
  applyJointEdits(scene, src.joints);
  applyRestPose(scene, src.pose);
  const wrapper = new THREE.Group();
  wrapper.name = 'render3d';
  fitInto(wrapper, scene, model.H, src);

  scene.traverse(o => {
    if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; }
  });
  // the anime pass: the game's own cel shader + outline, unless opted out
  if (src.toon !== false) {
    stylizeToon(scene, typeof src.toon === 'object' ? src.toon : {});
  }
  model.group.add(wrapper);
  const retargeter = new Retargeter(model, srcRest, wrapper, map, {
    rotOffset: src.rotOffset
  });
  const stats = meshStats(scene);
  console.info(`[render3d] ${pick}: ${src.url.split('/').pop()} — ${report}, ` +
    `${(stats.tris / 1000).toFixed(0)}k tris`);
  if (stats.tris > TRI_BUDGET) {
    console.warn(`[render3d] ${pick}: ${(stats.tris / 1000).toFixed(0)}k triangles is far over the ` +
      `~${TRI_BUDGET / 1000}k a fighter should cost — expect frame drops with several on screen. ` +
      `Decimate the source (gltfpack -si, or Blender's Decimate) before shipping it.`);
  }

  hideProcedural(model, wrapper, src);

  // run the transfer after every model update (fighter and viewer both call
  // model.update right after anim.update, so the pose is fresh)
  const orig = model.update.bind(model);
  model.update = dt => { orig(dt); retargeter.apply(); };
  retargeter.apply();
  model.render3d = { wrapper, retargeter, url: src.url };
}

// Hide what the imported model replaces: the merged body meshes, their
// outline hulls, the spring-chain flaps (hair, coats, ties) and the rigid
// PartBag props baked onto bones. GAMEPLAY props (weapons in model.props)
// stay visible by default — they attach to the drive rig's hands, which the
// retargeter keeps in the same place as the imported model's hands.
function hideProcedural(model, wrapper, src) {
  const keepRoots = new Set([wrapper]);
  if (src.keepProps !== false) {
    for (const p of model.props?.values() ?? []) keepRoots.add(p.node);
  }
  if (src.hideSprings === false) {
    for (const sp of model.springs ?? []) for (const pv of sp.pivots) keepRoots.add(pv.pivot);
  }
  const kept = o => {
    for (let n = o; n; n = n.parent) {
      if (keepRoots.has(n)) return true;
      if (n === model.group) return false;
    }
    return false;
  };
  model.group.traverse(o => {
    if ((o.isMesh || o.isSkinnedMesh) && o.visible && !kept(o)) o.visible = false;
  });
}
