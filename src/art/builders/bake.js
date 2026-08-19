// STATIC BAKE + LOD — the two things that make thirty summoned bodies on one
// field affordable.
//
// ========================== WHY THIS FILE EXISTS ==========================
// The creature models in art/models/ are built as HIERARCHIES OF JOINTS with
// individual meshes hung off them, because that is what makes them animatable
// without a skeleton: a joint rotates and everything parented to it follows.
// It is the right authoring model and it has one bad consequence — a single
// creature can be a hundred separate meshes, and a hundred meshes is a hundred
// draw calls.
//
// Measured before this pass: eighteen summoned bodies on one field cost 4,347
// draw calls, against 236 for the arena and two fighters. That is the kind of
// number that is fine on a desktop GPU and ruinous on anything else, and it is
// entirely avoidable, because MOST OF THOSE MESHES NEVER MOVE RELATIVE TO EACH
// OTHER. Max Elephant's seven teeth, the Rainbow Dragon's antler tines, a
// centipede's twenty-two legs, every outline hull in the game — all of them
// are rigidly parented to a joint that moves as one.
//
// So: BAKE. For every node in the hierarchy, take its DIRECT mesh children,
// group them by material, and merge each group into one mesh with the local
// transforms folded into the vertices. The joints survive untouched, so every
// animator still works exactly as written; what disappears is the per-mesh
// overhead of things that were never going to move apart.
//
// WHAT IS DELIBERATELY NOT BAKED:
//   · Anything with a MeshBasicMaterial. That is the whole unlit vocabulary —
//     eyes, cursed-energy glows, marking decals, mouth interiors, the Ox's
//     charge embers, Nue's electric arcs, the manta's underglow — and the
//     builders keep live references to those so they can animate opacity and
//     scale. Merging one away would silently orphan the reference. The rule is
//     mechanical rather than a list, so a new glowing part cannot forget it.
//   · SkinnedMeshes. The playable characters' bodies are skinned and their
//     vertices genuinely do move independently; this pass never touches them.
//   · Any mesh explicitly flagged `userData.noBake`.
// =========================================================================
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export const bakeStats = { calls: 0, meshesBefore: 0, meshesAfter: 0 };

// mergeGeometries refuses a set whose attributes disagree, so every geometry is
// normalised to the same three attributes first. Unlike builders/geo.js's
// `mergeGeos` this KEEPS the uv — these creatures are textured and stripping it
// would flatten every one of them to a solid colour.
function normalise(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (!g.getAttribute('uv')) {
    const n = g.getAttribute('position').count;
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  }
  for (const k of Object.keys(g.attributes)) {
    if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
  }
  return g;
}

export function bakeStatic(root) {
  const nodes = [];
  root.traverse(n => nodes.push(n));
  let before = 0, after = 0;
  for (const node of nodes) {
    const groups = new Map();
    for (const c of node.children) {
      if (!c.isMesh || c.isSkinnedMesh || c.isInstancedMesh) continue;
      if (c.userData.noBake) continue;
      // the unlit vocabulary is animated by reference — never merge it away
      if (c.material?.isMeshBasicMaterial) continue;
      let list = groups.get(c.material);
      if (!list) groups.set(c.material, (list = []));
      list.push(c);
    }
    for (const [material, list] of groups) {
      before += list.length;
      if (list.length < 2) { after += list.length; continue; }
      const geos = [];
      for (const mesh of list) {
        mesh.updateMatrix();
        geos.push(normalise(mesh.geometry).applyMatrix4(mesh.matrix));
      }
      let merged = null;
      try { merged = BufferGeometryUtils.mergeGeometries(geos, false); } catch (e) { merged = null; }
      if (!merged) { after += list.length; continue; }
      merged.computeVertexNormals();
      for (const mesh of list) node.remove(mesh);
      const baked = new THREE.Mesh(merged, material);
      // the merged mesh sits in the joint's own space, so its transform is
      // identity by construction
      baked.name = (list[0].name || 'baked') + '_baked';
      node.add(baked);
      after += 1;
    }
  }
  bakeStats.calls++;
  bakeStats.meshesBefore += before;
  bakeStats.meshesAfter += after;
  return root;
}

// ---------------------------------------------------------------------------
// LOD
// ---------------------------------------------------------------------------
// The other half. A creature's OUTLINE HULLS are a second full pass over its
// geometry and they exist to read the silhouette against the arena — which is
// something you only need when you can actually see the silhouette. Past a
// dozen metres they are two or three pixels wide and cost exactly as much as
// they do up close, so they are the first thing to go.
//
// This is deliberately a coarse two-step rather than a proper LOD chain: the
// bodies are already cheap after baking, the swarms are already instanced, and
// a real geometric LOD chain would mean authoring every creature twice. Turning
// off the pass that is invisible at range is most of the win for none of that
// cost.
//
// Hulls are also marked frustumCulled — `makeOutline` clears the flag so a
// skinned character's hull cannot pop when its bind pose leaves the frustum,
// which is right for a skinned mesh and pointless for a rigid one.
export function collectOutlines(root) {
  const hulls = [];
  root.traverse(n => {
    if (n.isMesh && /_outline$|_baked$/.test(n.name) && n.material?.isShaderMaterial) {
      n.frustumCulled = true;
      hulls.push(n);
    }
  });
  return hulls;
}

export const LOD_OUTLINE_DIST = 13;

// Called per frame by the summon systems with the camera-to-body distance.
export function applyLOD(hulls, dist) {
  const on = dist < LOD_OUTLINE_DIST;
  for (const h of hulls) if (h.visible !== on) h.visible = on;
}
