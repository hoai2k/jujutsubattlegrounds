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
//       "joints": {"DEF-upper_armL": [0, 0.023, 0]},  // pivot fixes: move
//                              // where a bone ROTATES without moving the mesh
//                              // (inverse-binds are rebuilt) — the fix for a
//                              // shoulder that sits too low. Values are an
//                              // offset in the model's own axes as A FRACTION
//                              // OF ITS HEIGHT, so they survive re-exporting
//                              // or decimating the model. Authored on
//                              // /workbench/?edit=rig.
//       "lift": {"ambient": 0.22, "saturation": 1.18},
//                              // a small lighting lift so the model reads in
//                              // this scene: `ambient` adds a fraction of the
//                              // model's OWN texture back as light (lifting
//                              // shadows without greying the hue), and
//                              // `saturation` gives it a gentle push. The
//                              // file's own PBR materials are kept. false or
//                              // {"ambient":0,"saturation":1} = untouched.
//       "pose": {"LeftArm": [0, 0, 62]},   // rest-pose calibration: local
//                              // XYZ euler degrees per NODE NAME, applied at
//                              // load before anything is measured — how a
//                              // model that ships in some arbitrary pose is
//                              // stood up into a proper T/A bind. Authored on
//                              // the /workbench/?edit=models bench.
//       "weights": [{"at": [0.01, 0.30, 0.04], "rigid": "HandR"},
//                   {"at": [0.00, 0.45, 0.06], "drop": ["LoArmL"]}],
//                              // skin repairs, per MESH ISLAND: `rigid` binds
//                              // a held prop to one bone so it stops bending,
//                              // `drop` takes a bone's bled influence off a
//                              // piece of clothing. `at` is a point in the
//                              // model's own axes as a fraction of height.
//                              // Authored by clicking on /workbench/?edit=rig.
//       "skinning": "dual",    // "dual" (default) blends bone ROTATIONS, so a
//                              // bent elbow keeps its thickness; "linear" is
//                              // three.js's matrix averaging, which pinches
//                              // every joint. See dqs.js.
//       "rotOffset": {"UpArmL": [0, 0, -8]},              // degrees, world
//       "keepProps": true,     // procedural weapons stay in hand (default)
//       "hideSprings": true,   // procedural hair/coat physics hidden (default)
//       "propSlot": {"playful_cloud": "twoHand"},
//                              // pick a different attachment slot for a prop
//                              // on this model — how an imported body that
//                              // should carry a weapon differently says so
//                              // without touching the character's own art.
//       "grips": {"playful_cloud": {"bone": "HandL", "at": [0, 0.42, 0],
//                                   "to": [0, 0.66, 0]}},
//                              // TWO-HANDED. The off hand is re-solved onto
//                              // this point in the WEAPON'S own space after
//                              // retargeting (see grip.js) — because rotation
//                              // transfer alone leaves it floating off the
//                              // haft by whatever the two bodies' proportions
//                              // differ by. `to` makes it a segment the hand
//                              // may slide along. Overrides whatever the
//                              // attachment authored; authored by clicking on
//                              // /workbench/?edit=models.
//       "props": {"playful_cloud": {"url": "./maki_polearm.glb"}}
//                              // swap the PROCEDURAL weapon for an imported
//                              // one. It is parented inside the procedural
//                              // prop's node, so it inherits the attachment
//                              // transform, the adoption onto the imported
//                              // hand and the grip maths unchanged, and it is
//                              // auto-sized to the weapon it replaces.
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
import { applyJointEdits, collectSkeletons, modelBindHeight } from './joints.js';
import { liftMaterials } from './lift.js';
import { GripSolver } from './grip.js';
import { applyWeightOps } from './weights.js';
import { setDualQuaternionSkinning } from './dqs.js';
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

// Triangle count, reported at load. This is a SANITY CHECK, not a standard to
// hold models to: the supplied characters arrive already decimated, in the
// 120k–300k range, and that is simply what they cost. The number worth
// hearing about is the one that says a model was never optimised at all — the
// first Yuji arrived at 2.0M — because the symptom, a frame rate that
// collapses the moment a second fighter spawns, otherwise looks like a bug in
// the renderer rather than a fact about the file. The threshold is set well
// clear of the normal range so it only fires on that case.
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
export const TRI_BUDGET = 500000;

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
  // skin repairs read rest positions, so they run after the pivots settle and
  // before the pose calibration moves anything
  applyWeightOps(scene, src.weights, map);
  applyRestPose(scene, src.pose);
  const wrapper = new THREE.Group();
  wrapper.name = 'render3d';
  fitInto(wrapper, scene, model.H, src);

  scene.traverse(o => {
    if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; }
  });
  // a small lighting lift, unless opted out — see lift.js
  if (src.lift !== false) {
    liftMaterials(scene, typeof src.lift === 'object' ? src.lift : {});
  }
  // ...and dual-quaternion skinning on top, AFTER the lift: it rides on the
  // material, and the lift swaps materials out from under it
  if (src.skinning !== 'linear') setDualQuaternionSkinning(scene, true);
  model.group.add(wrapper);
  const retargeter = new Retargeter(model, srcRest, wrapper, map, {
    rotOffset: src.rotOffset
  });
  const stats = meshStats(scene);
  console.info(`[render3d] ${pick}: ${src.url.split('/').pop()} — ${report}, ` +
    `${(stats.tris / 1000).toFixed(0)}k tris`);
  if (stats.tris > TRI_BUDGET) {
    console.warn(`[render3d] ${pick}: ${(stats.tris / 1000).toFixed(0)}k triangles — well past the ` +
      `${TRI_BUDGET / 1000}k where a model looks un-decimated. Expect frame drops with several on ` +
      `screen; tools/decimate.mjs shrinks it without touching the skeleton.`);
  }

  // ORDER MATTERS. Hiding first, adopting second: hideProcedural decides what
  // to hide by whether a node sits under the imported wrapper, and adoption
  // moves props there — so adopting first would make `keepProps: false` a
  // no-op. Visibility is untouched by the move, so hidden props stay hidden.
  hideProcedural(model, wrapper, src);
  adoptAttachments(model, wrapper, map, retargeter, src);

  // ...and keep them hidden. hideProcedural runs ONCE, but `attachProp` ends
  // with `p.node.visible = true` and the fighter calls it every frame for any
  // prop whose slot depends on state — which is every one of Nobara's. So a
  // model that says `keepProps: false` because its weapon is modelled into the
  // mesh got the procedural one back one frame after load, and shipped with
  // two hammers. The flag has to be durable, not a single pass.
  if (src.keepProps === false && model.attachProp) {
    const base = model.attachProp.bind(model);
    model.attachProp = (name, slot) => {
      base(name, slot);
      const p = model.props?.get(name);
      if (p?.node) p.node.visible = false;
    };
    for (const p of model.props?.values() ?? []) if (p.node) p.node.visible = false;
  }

  // TWO-HANDED WEAPONS. Rotation transfer puts the dominant hand on the
  // weapon (the weapon is parented to it) and leaves the off hand wherever
  // this body's proportions land it, which for a hand that should be closed
  // around a haft is a visible miss. grip.js re-solves that arm onto a point
  // in the weapon's own space, after the pose is final. Costs nothing on the
  // characters that have no grips authored.
  const grips = new GripSolver(model, map, src.grips || {});
  // slot pick: a weapon this body should carry differently
  for (const [name, slot] of Object.entries(src.propSlot || {})) model.attachProp(name, slot);
  // re-read the specs whenever a clip changes hands — a weapon on the back
  // is not being gripped at all
  const attach = model.attachProp.bind(model);
  model.attachProp = (name, slot) => { attach(name, slot); grips.refresh(); };
  grips.refresh();

  // run the transfer after every model update (fighter and viewer both call
  // model.update right after anim.update, so the pose is fresh)
  const orig = model.update.bind(model);
  model.update = dt => {
    orig(dt);
    retargeter.apply();
    // the grip target is measured off the weapon, which hangs from a bone the
    // retargeter has just moved, so the world matrices have to be current
    // before it is read — and only when there is a grip to solve.
    if (grips.active) { model.group.updateMatrixWorld(true); grips.apply(); }
  };
  retargeter.apply();
  model.render3d = { wrapper, retargeter, grips, url: src.url };

  // an imported weapon, if the entry names one, replacing the procedural
  // shape inside the node that already carries the attachment
  if (src.props) swapPropModels(model, src, pick);
}

// ---- IMPORTED WEAPONS -----------------------------------------------------
// A character's weapon is procedural, authored in code (toji_weapons.js and
// friends) and shared — Maki imports Toji's builders unchanged and only
// re-solves where they hang. That sharing is worth keeping, so an imported
// weapon does not REPLACE the prop; it goes INSIDE it.
//
// The procedural prop's node is the thing that carries the attachment
// transform, the adoption onto the imported hand, and the space the grip
// point is measured in. Parent the loaded weapon under that node and it
// inherits all three for free, and the grip maths does not know or care that
// the shape it is measuring against came from a file.
//
// Size comes from the weapon it stands in for: the procedural staff is 1.25 m
// because that is what reads right on this body, so an imported one is fitted
// to the same longest dimension. `scale`/`pos`/`rot` trim from there.
function swapPropModels(model, src, pick) {
  for (const [name, raw] of Object.entries(src.props || {})) {
    const spec = typeof raw === 'string' ? { url: raw } : raw;
    const p = model.props?.get(name);
    if (!p?.node) { console.warn(`[render3d] ${pick}: no prop named "${name}"`); continue; }
    if (!spec.url) continue;
    const url = new URL(spec.url, modelsUrl('manifest.json')).href;
    loadScene(url).then(weapon => {
      const want = longestSide(localBox(p.node));
      const have = longestSide(localBox(weapon, true));
      if (!(have > 1e-6) || !(want > 1e-6)) throw new Error('weapon has no size');
      const k = (spec.scale ?? 1) * want / have;
      weapon.scale.setScalar(k);
      if (spec.pos) weapon.position.fromArray(spec.pos);
      if (spec.rot) {
        weapon.rotation.set(spec.rot[0] * DEG, spec.rot[1] * DEG, spec.rot[2] * DEG);
      }
      weapon.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false; });
      if (spec.lift !== false) liftMaterials(weapon, typeof spec.lift === 'object' ? spec.lift : {});
      // hide the procedural shape, keep its node — that node IS the attachment
      for (const child of [...p.node.children]) child.visible = false;
      p.node.add(weapon);
      console.info(`[render3d] ${pick}: ${name} <- ${spec.url.split('/').pop()} ` +
        `(fitted ${have.toFixed(2)} -> ${want.toFixed(2)} m)`);
    }).catch(err => console.warn(`[render3d] ${pick}: ${name} model failed —`, err?.message ?? err));
  }
}

// Bounding box of a subtree in its OWN local space — the world box would be
// an axis-aligned box around a rotated weapon, which over-measures a diagonal
// blade badly. `fresh` forces a matrix update for a subtree not yet in a scene.
function localBox(node, fresh = false) {
  if (fresh) node.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(node.matrixWorld).invert();
  const box = new THREE.Box3(), sub = new THREE.Box3(), m = new THREE.Matrix4();
  node.traverse(o => {
    const g = o.geometry;
    if (!g?.attributes?.position) return;
    g.computeBoundingBox();
    sub.copy(g.boundingBox).applyMatrix4(m.copy(inv).multiply(o.matrixWorld));
    box.union(sub);
  });
  return box;
}

const longestSide = box => {
  if (box.isEmpty()) return 0;
  const s = box.getSize(new THREE.Vector3());
  return Math.max(s.x, s.y, s.z);
};

// ---- ATTACHMENTS: props and effects follow the body they belong to --------
// Everything a character hangs off a bone — Toji's spear, Nobara's hammer,
// and the live particle emitters like the fire venting from Jogo's head — is
// parented to the PROCEDURAL skeleton. That skeleton keeps running as the
// drive rig, so those nodes keep updating; but it is now invisible, and its
// bones sit wherever the procedural body's proportions put them, which is not
// where the imported body is. Left alone, Jogo's fire burns in mid-air beside
// his head.
//
// So each one is re-parented onto the imported bone, with the transform that
// makes it land in the same place relative to the new body:
//
//   the retargeter drives  importedWorld = srcWorld ∘ align
//   we want the node at    srcWorld · v  from the imported bone's origin
//   so its local offset is align⁻¹ · v, and its local scale undoes the
//   wrapper's model-units-to-metres scale.
//
// Uniform scale commutes with rotation, so the two cancel exactly and the
// node ends up with the procedural world orientation on the imported body.
function adoptAttachments(model, wrapper, map, retargeter, src) {
  const s = wrapper.scale.x || 1;
  const skip = new Set();
  // spring chains drive their own pivots against their parent bone's frame,
  // and are hidden by default anyway — moving them would only break the maths
  for (const chain of model.springs ?? []) for (const p of chain.pivots ?? []) skip.add(p.pivot);

  // A prop's OWN scale, from before the first adoption.
  //
  // Position and rotation are safe to transform in place because attachProp
  // rewrites both from the attachment every time it is called — and the
  // fighter calls it EVERY FRAME for anything whose slot depends on state
  // (Maki's weapon toggle, Toji's arsenal, Nobara's hammer, Miwa's saya). It
  // does not touch scale. So dividing the CURRENT scale by the wrapper's
  // factor compounded once per frame: a weapon shrank by ~1.7x per frame and
  // was gone inside a second. Nobody caught it because the benches attach a
  // prop once and the game's cameras are far enough out that a weapon
  // vanishing looks like a character who never drew one.
  const baseScale = new WeakMap();
  const adopt = node => {
    const bone = node.parent;
    if (!bone?.isBone || skip.has(node) || node.isBone) return false;
    const target = map[bone.name];
    const align = retargeter.alignOf(bone.name);
    if (!target || !align) return false;
    if (!baseScale.has(node)) baseScale.set(node, node.scale.clone());
    const inv = align.clone().invert();
    node.position.applyQuaternion(inv).divideScalar(s);
    node.quaternion.premultiply(inv);
    node.scale.copy(baseScale.get(node)).divideScalar(s);
    target.add(node);
    return true;
  };

  let n = 0;
  for (const bone of model.boneList) {
    for (const child of [...bone.children]) if (adopt(child)) n++;
  }
  // attachProp re-parents onto the drive rig every time a clip changes hands,
  // so the adoption has to ride along with it rather than happen once
  if (model.attachProp) {
    const orig = model.attachProp.bind(model);
    model.attachProp = (name, slot) => {
      orig(name, slot);
      const node = model.props?.get(name)?.node;
      if (node?.parent?.isBone) adopt(node);
    };
    // re-seat whatever is already attached, now that the wrapper exists
    for (const [name, p] of model.props ?? []) {
      if (p.node?.parent?.isBone && adopt(p.node)) n++;
    }
  }
  if (n) console.info(`[render3d] ${n} attachment(s) moved onto the imported body`);
  return n;
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
