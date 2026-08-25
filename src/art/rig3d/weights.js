// SKIN-WEIGHT REPAIR — fixing what a bone should not be driving.
// ===========================================================================
// Two defects turn up in nearly every imported character, and neither is a
// rigging mistake exactly — they are what automatic weighting does when two
// pieces of geometry happen to be near each other in the bind pose:
//
//   BLED WEIGHTS  Nobara's arms hang beside her hips, so an automatic bind
//                 gives the skirt a share of the forearm. It looks fine at
//                 rest and wrong the moment she moves: her dress swings when
//                 her arm does.
//   SOFT PROPS    a hammer held in a fist is one mesh with the body, so it
//                 gets blended across the hand and forearm like flesh and
//                 BENDS. A tool is rigid; it should ride exactly one bone.
//
// Neither can be fixed by distance alone — the skirt really is closer to the
// forearm than to anything else while the arm hangs beside it — so the unit
// of repair here is the MESH ISLAND: a connected component of the geometry.
// A skirt is not connected to a sleeve, and a hammer is not connected to a
// hand, so "this island should not be driven by the arm" and "this island is
// one rigid object" are both exactly expressible, and both are things a
// person can point at.
//
// Ops are authored by clicking on /workbench/?edit=rig and stored in the
// manifest as `weights`, identified by a POINT in normalized model space
// rather than by vertex index, so they survive the model being re-exported:
//
//   "weights": [
//     { "bleed": ["hand", "forearm"] },
//     { "at": [0.01, 0.30, 0.04], "rigid": "HandR" },
//     { "at": [0.00, 0.45, 0.06], "drop": ["UpArmL", "LoArmL", "HandL"] }
//   ]
//
// `rigid` binds the whole island 100% to one bone; `drop` removes the named
// bones' influence from one island and renormalizes what is left.
//
// `bleed` is the same idea stated as a RULE rather than as a list of places,
// and it is the one that generalises: remove the named bones' influence from
// every island that does not belong to their own LIMB. A skirt is dominated
// by the thigh and the pelvis, so the 15% of it the forearm had acquired —
// purely because the arm hangs beside the hip in the bind pose — comes off.
// No anchors, nothing to re-derive when the model is exported again, and it
// reads as the statement it is: "an arm does not move a dress".
//
// LIMB, not bone, and that distinction is the whole correctness of it. The
// first version protected only islands the dropped bones DOMINATED, which
// sounds equivalent and is not: an arm is usually one island dominated by the
// upper arm, with the forearm holding a third of it. Dropping "forearm" from
// an island dominated by "upper_arm" therefore tore the forearm off the arm
// it belongs to — the elbow stopped bending and the mesh came apart, which is
// what put holes in Nobara's sleeves and cut up Yuji's hand. So the guard is
// the limb chain: taking a bone's influence off geometry that belongs to that
// bone's own limb is never the repair being asked for.
//
// All of it is non-destructive to the file: the in-memory skin attributes are
// rewritten at load, and the bench replays them from a pristine baseline.
import * as THREE from 'three';

// The chains a bone can belong to. A `bleed` naming any member protects every
// member, so "drop the forearm off things that are not the arm" cannot be
// misread as "drop the forearm off the arm".
const LIMB_GROUPS = [
  ['hand', 'finger', 'thumb', 'forearm', 'upper_arm', 'uparm', 'arm', 'shoulder', 'clav'],
  ['foot', 'toe', 'shin', 'calf', 'leg', 'thigh'],
  ['head', 'neck', 'jaw', 'eye'],
  ['spine', 'chest', 'hips', 'pelvis', 'torso', 'waist']
];

// the protective pattern for a set of dropped-bone patterns: every limb group
// any of them touches, in full
function protectPattern(dropPatterns) {
  const words = new Set(dropPatterns.map(p => String(p).toLowerCase()));
  for (const group of LIMB_GROUPS) {
    if (group.some(g => [...words].some(w => g.includes(w) || w.includes(g)))) {
      for (const g of group) words.add(g);
    }
  }
  return new RegExp([...words].join('|'), 'i');
}

// ---------------------------------------------------------------- islands --
// Connected components over the index buffer. Union-find with path halving:
// 60k vertices resolve in a few milliseconds.
export function meshIslands(mesh) {
  const g = mesh.geometry;
  const n = g.getAttribute('position').count;
  const par = new Int32Array(n);
  for (let i = 0; i < n; i++) par[i] = i;
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[b] = a; };
  const idx = g.index?.array;
  if (idx) for (let i = 0; i < idx.length; i += 3) { uni(idx[i], idx[i + 1]); uni(idx[i + 1], idx[i + 2]); }
  const labels = new Int32Array(n);
  const of = new Map();
  const islands = [];
  for (let i = 0; i < n; i++) {
    const r = find(i);
    let k = of.get(r);
    if (k === undefined) { k = islands.length; of.set(r, k); islands.push([]); }
    labels[i] = k;
    islands[k].push(i);
  }
  return { labels, islands };
}

// Vertex positions as the mesh actually renders at rest — the skinning maths
// has to be run, because an exporter may bake its dequantization into the
// inverse-binds and leave `position` in a space of its own.
export function restPositions(mesh) {
  const g = mesh.geometry, sk = mesh.skeleton;
  const pos = g.getAttribute('position'), si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const n = pos.count;
  const out = new Float32Array(n * 3);
  const post = new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse);
  const skin = sk.bones.map((b, i) =>
    new THREE.Matrix4().multiplyMatrices(post,
      new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i])));
  const v = new THREE.Vector3(), acc = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mesh.bindMatrix);
    acc.set(0, 0, 0);
    let any = false;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w <= 0) continue;
      acc.addScaledVector(t.copy(v).applyMatrix4(skin[si.getComponent(i, k)]), w);
      any = true;
    }
    if (!any) acc.copy(v);
    out[i * 3] = acc.x; out[i * 3 + 1] = acc.y; out[i * 3 + 2] = acc.z;
  }
  return out;
}

// What drives an island, as a share of its total weight — the readout the
// bench shows and the thing an op is decided from.
export function islandBones(mesh, verts) {
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const tally = new Map();
  let total = 0;
  for (const i of verts) {
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w <= 0) continue;
      const b = si.getComponent(i, k);
      tally.set(b, (tally.get(b) ?? 0) + w);
      total += w;
    }
  }
  return [...tally]
    .map(([b, w]) => ({ index: b, name: mesh.skeleton.bones[b]?.name ?? '#' + b, share: w / (total || 1) }))
    .sort((a, b) => b.share - a.share);
}

// ------------------------------------------------------------------- ops ---
export function rigidify(mesh, verts, boneIndex) {
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  for (const i of verts) {
    si.setXYZW(i, boneIndex, 0, 0, 0);
    sw.setXYZW(i, 1, 0, 0, 0);
  }
  si.needsUpdate = sw.needsUpdate = true;
  return verts.length;
}

// Remove the named bones' influence and renormalize.
//
// BLEED IS A MINORITY, BY DEFINITION — and that has to be judged per VERTEX,
// not per island. A jacket is often one island covering the torso AND the
// sleeves: it is dominated by the spine, so it is fair game for the rule, but
// the vertices at the cuff are genuinely 80% forearm. Taking that away
// renormalizes them onto whatever scrap of torso weight they had, they snap to
// the spine while their neighbours follow the arm, and the sleeve opens up.
// That is what put holes in Naoya's arms when a clip stretched them out.
//
// So a vertex is only cleaned when the bones being dropped hold no more than
// `maxShare` of it. Above that the bone owns the vertex, whatever the island
// as a whole is doing, and the vertex is left exactly as authored. `fallback`
// survives only for the pathological case of a vertex with no weight at all.
export function dropInfluence(mesh, verts, boneIndices, fallback, maxShare = 0.5) {
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const drop = new Set(boneIndices);
  let touched = 0, skipped = 0;
  const before = [0, 0, 0, 0];
  for (const i of verts) {
    let keep = 0, lost = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      before[k] = w;
      if (w <= 0) continue;
      if (drop.has(si.getComponent(i, k))) lost += w; else keep += w;
    }
    if (lost <= 0) continue;
    // the bone owns this vertex — leave it exactly as authored
    if (lost > maxShare * (lost + keep) || keep <= 1e-6) { skipped++; continue; }
    for (let k = 0; k < 4; k++) {
      if (drop.has(si.getComponent(i, k))) sw.setComponent(i, k, 0);
    }
    touched++;
    for (let k = 0; k < 4; k++) sw.setComponent(i, k, sw.getComponent(i, k) / keep);
  }
  si.needsUpdate = sw.needsUpdate = true;
  dropInfluence.lastSkipped = skipped;
  return touched;
}

// --------------------------------------------------------------- manifest --
// Each op names a point; the island containing the vertex nearest that point
// is the target. `at` is measured from the mesh's own rest bounding box and
// divided by that box's HEIGHT — not by any external unit. That makes it
// scale- and space-invariant, which matters because the bench measures a
// fitted model in metres while the game applies ops before the fit, in
// whatever units the file shipped in. Both land on the same island.
export function anchorFrame(P) {
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 3) box.expandByPoint(v.set(P[i], P[i + 1], P[i + 2]));
  return { box, h: Math.max(1e-6, box.max.y - box.min.y) };
}

export function applyWeightOps(root, ops, map = {}) {
  if (!Array.isArray(ops) || !ops.length) return [];
  const meshes = [];
  root.traverse(o => { if (o.isSkinnedMesh && o.geometry?.getAttribute('skinIndex')) meshes.push(o); });
  if (!meshes.length) return [];
  const report = [];

  const cache = meshes.map(mesh => {
    const P = restPositions(mesh);
    const { labels, islands } = meshIslands(mesh);
    return { mesh, P, labels, islands, ...anchorFrame(P) };
  });

  const boneIndexOf = (mesh, name) => {
    const node = map[name] ?? null;                    // canonical first
    const wanted = node?.name ?? name;
    return mesh.skeleton.bones.findIndex(b => b.name === wanted);
  };

  for (const op of ops) {
    // ---- rule form: drop bones from every island they do not dominate ----
    if (Array.isArray(op?.bleed) && op.bleed.length) {
      const re = new RegExp(op.bleed.join('|'), 'i');
      // what may NOT be cleaned: anything the dropped bones share a limb with
      const guard = Array.isArray(op.protect) && op.protect.length
        ? new RegExp(op.protect.join('|'), 'i') : protectPattern(op.bleed);
      const cap = op.maxShare ?? 0.6;
      let islandsTouched = 0, vertsTouched = 0, vertsKept = 0;
      for (const c of cache) {
        for (const verts of c.islands) {
          if (verts.length < 8) continue;
          const bones = islandBones(c.mesh, verts);
          if (!bones.length || guard.test(bones[0].name)) continue;   // its own limb
          const share = bones.filter(b => re.test(b.name)).reduce((a, b) => a + b.share, 0);
          if (share <= 1e-4 || share > cap) continue;
          const idxs = bones.filter(b => re.test(b.name)).map(b => b.index);
          const keep = bones.find(b => !idxs.includes(b.index));
          vertsTouched += dropInfluence(c.mesh, verts, idxs, keep?.index ?? 0, op.maxVertexShare);
          vertsKept += dropInfluence.lastSkipped;
          islandsTouched++;
        }
      }
      report.push({ bleed: op.bleed, islands: islandsTouched, changed: vertsTouched, kept: vertsKept });
      continue;
    }
    if (!Array.isArray(op?.at)) continue;
    // nearest vertex, across every skinned mesh
    let best = null, bestD = Infinity;
    for (const c of cache) {
      const target = new THREE.Vector3(
        c.box.min.x + op.at[0] * c.h, c.box.min.y + op.at[1] * c.h, c.box.min.z + op.at[2] * c.h);
      for (let i = 0; i < c.P.length / 3; i++) {
        const d = (c.P[i * 3] - target.x) ** 2 + (c.P[i * 3 + 1] - target.y) ** 2 +
          (c.P[i * 3 + 2] - target.z) ** 2;
        if (d < bestD) { bestD = d; best = { c, i }; }
      }
    }
    if (!best) continue;
    const { c, i } = best;
    const verts = c.islands[c.labels[i]];
    const bones = islandBones(c.mesh, verts);
    const entry = { at: op.at, verts: verts.length, dominant: bones[0]?.name ?? null };

    if (op.rigid) {
      const bi = boneIndexOf(c.mesh, op.rigid);
      if (bi < 0) { console.warn(`[render3d] weights: no bone "${op.rigid}"`); continue; }
      entry.rigid = c.mesh.skeleton.bones[bi].name;
      entry.changed = rigidify(c.mesh, verts, bi);
    } else if (Array.isArray(op.drop) && op.drop.length) {
      const idxs = op.drop.map(nm => boneIndexOf(c.mesh, nm)).filter(x => x >= 0);
      const keep = bones.find(b => !idxs.includes(b.index));
      entry.drop = op.drop;
      entry.changed = dropInfluence(c.mesh, verts, idxs, keep?.index ?? 0);
    }
    report.push(entry);
  }
  if (report.length) {
    console.info('[render3d] weight ops:', report.map(r =>
      r.bleed ? `bleed ${r.bleed.join('/')} off ${r.islands} islands (${r.changed}v cleaned, ${r.kept}v left to their own bone)`
        : `${r.rigid ? 'rigid→' + r.rigid : 'drop ' + (r.drop ?? []).join('/')} on ${r.verts}v`
    ).join('; '));
  }
  return report;
}
