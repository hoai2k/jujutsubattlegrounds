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
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { guessBoneMap } from './bonemap.js';
import { Retargeter, captureSourceRest } from './retarget.js';
import { DEG } from '../../core/mathutil.js';

const MANIFEST_URL = 'models/manifest.json';

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
  _manifest ??= fetch(MANIFEST_URL)
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
  const url = new URL(entry.url, new URL(MANIFEST_URL, document.baseURI)).href;
  return { ...entry, url };
}

// ---- load cache: parse each URL once, clone per fighter --------------------
let _loader = null;
const _cache = new Map();
function loadScene(url) {
  if (!_cache.has(url)) {
    _loader ??= new GLTFLoader();
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

function attach(model, srcRest, scene, src, pick) {
  // measure the raw model in its own space — geometry bounds plus every node
  // origin, so even a mesh-light export still measures its skeleton
  const temp = new THREE.Group();
  temp.add(scene);
  temp.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  const _p = new THREE.Vector3();
  scene.traverse(o => box.expandByPoint(_p.setFromMatrixPosition(o.matrixWorld)));
  const size = box.getSize(new THREE.Vector3());
  if (!(size.y > 1e-4)) throw new Error('model has no height');

  // normalize: height to the character's H, feet on y=0, centred, facing +Z
  const wrapper = new THREE.Group();
  wrapper.name = 'render3d';
  const s = (src.scale ?? 1) * model.H / size.y;
  wrapper.scale.setScalar(s);
  wrapper.rotation.y = (src.faceYaw ?? 0) * DEG;
  temp.remove(scene);
  wrapper.add(scene);
  const c = box.getCenter(new THREE.Vector3());
  // centre x/z and ground the feet, in wrapper units (pre-rotation is fine —
  // the yaw spins the model about the very axis the offsets are measured on)
  scene.position.x -= c.x;
  scene.position.z -= c.z;
  scene.position.y -= box.min.y;
  scene.position.y += (src.yOffset ?? 0) / s;

  scene.traverse(o => {
    if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; }
  });

  // map bones and build the retargeter before touching visibility, so a
  // mapping failure leaves the procedural model exactly as it was
  const { map, missing, report } = guessBoneMap(scene, src.boneMap || {});
  if (!map.Hips || missing.length > 8) {
    throw new Error(`unusable rig (${report})`);
  }
  model.group.add(wrapper);
  const retargeter = new Retargeter(model, srcRest, wrapper, map, {
    rotOffset: src.rotOffset
  });
  console.info(`[render3d] ${pick}: ${src.url.split('/').pop()} — ${report}`);

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
