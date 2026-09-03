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
// and it is the one that generalises. What it rests on:
//
//   A BONE DRIVES ONE PIECE OF SURFACE, NOT TWO.
//
// The forearm's real territory is a band of sleeve running down the arm — one
// connected patch. When an automatic bind also hands it a piece of skirt, that
// piece is somewhere else entirely on the surface: to walk from the sleeve to
// the skirt you have to cross the torso, and the forearm has no weight there.
// So the bone's influence arrives as TWO disconnected blobs, and the one that
// does not contain the bone is the bleed. Drop it, keep the other, renormalize.
//
// No thresholds, no anchors, no list of parts, and nothing to re-derive when
// the model is exported again — it reads as the statement it is: "an arm does
// not move a dress", and it says it in the only terms that separate a dress
// from a sleeve when the two are touching in the bind pose.
//
// Two earlier versions got this wrong in instructive ways, and both are why
// the test suite checks the connectivity directly. Dropping the bone from
// every island it did not DOMINATE tore the forearm off the arm (an arm is
// one island dominated by the upper arm), which put holes in Nobara's sleeves
// and cut up Yuji's hand. Guarding that per VERTEX instead — keep the vertices
// the bone owns outright — stopped the tearing but only for geometry that was
// mostly right already: on the skirt it cleaned the weak vertices and kept the
// strong ones, so one continuous panel ended up half on the hip and half on
// the wrist, and shards of it flew off with her hand. Connectivity has no such
// halfway state: a blob goes or it stays, whole.
//
// The unit here is the SURFACE, so vertices are welded by position first.
// Every UV seam duplicates the vertices along it, which chops the index buffer
// into charts — 46 of them on Nobara — and blobs that are visibly one piece
// would otherwise count as several.
//
// All of it is non-destructive to the file: the in-memory skin attributes are
// rewritten at load, and the bench replays them from a pristine baseline.
import * as THREE from 'three';

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

// --------------------------------------------------------------- surface ---
// The mesh as a graph a flood fill can walk. Vertices are WELDED by position
// first: an exporter duplicates the vertices along every UV seam, hard edge
// and material break, so the index buffer alone reports one continuous body as
// dozens of disconnected charts. Seam duplicates are bit-identical — the
// exporter copies the position and varies only the attribute that had to split
// — so an exact hash finds them.
//
// `rep[i]` is the representative vertex of i's welded position; edges are
// stored as CSR (`start` indexes into `list`) because this is walked once per
// bone and a Map of arrays is an order of magnitude slower to build.
export function surfaceGraph(mesh, P) {
  const g = mesh.geometry;
  const pos = g.getAttribute('position');
  const n = pos.count;
  const at = P
    ? i => P[i * 3] + ',' + P[i * 3 + 1] + ',' + P[i * 3 + 2]
    : i => pos.getX(i) + ',' + pos.getY(i) + ',' + pos.getZ(i);
  const rep = new Int32Array(n);
  const first = new Map();
  for (let i = 0; i < n; i++) {
    const key = at(i);
    const f = first.get(key);
    if (f === undefined) { first.set(key, i); rep[i] = i; } else rep[i] = f;
  }
  const idx = g.index?.array;
  const start = new Int32Array(n + 1);
  if (!idx) return { rep, start, list: new Int32Array(0) };
  const count = new Int32Array(n);
  const bump = (a, b) => { count[a]++; count[b]++; };
  for (let i = 0; i < idx.length; i += 3) {
    const a = rep[idx[i]], b = rep[idx[i + 1]], c = rep[idx[i + 2]];
    bump(a, b); bump(b, c); bump(c, a);
  }
  for (let i = 0; i < n; i++) start[i + 1] = start[i] + count[i];
  const list = new Int32Array(start[n]);
  const fill = new Int32Array(n);
  const put = (a, b) => { list[start[a] + fill[a]++] = b; list[start[b] + fill[b]++] = a; };
  for (let i = 0; i < idx.length; i += 3) {
    const a = rep[idx[i]], b = rep[idx[i + 1]], c = rep[idx[i + 2]];
    put(a, b); put(b, c); put(c, a);
  }
  return { rep, start, list };
}

// Remove one bone's influence from every patch of surface that is not the
// patch the bone actually sits on, and renormalize what is left.
//
// The bone's own patch is the one containing the vertex it holds hardest —
// not the largest, which would be wrong exactly when a bind is at its worst
// (a whole skirt outweighing a cuff).
export function bleedOff(mesh, boneIndex, graph) {
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const { rep, start, list } = graph;
  const n = si.count;

  const held = [];
  let anchor = -1, most = 0;
  for (let i = 0; i < n; i++) {
    let w = 0;
    for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === boneIndex) w += sw.getComponent(i, k);
    if (w <= 1e-6) continue;
    held.push(i);
    if (w > most) { most = w; anchor = i; }
  }
  // FIELD NAME. This early-out returned `blobs`, which nothing reads, so the
  // caller's `orphans` came back undefined and poisoned the sum to NaN — and
  // a bone with no weight at all is the ordinary case (Yuji's hands), so the
  // report read "NaNv left to their own bone" on nearly every load.
  if (anchor < 0) return { changed: 0, orphans: 0 };

  // flood the bone's own patch, walking only through vertices it influences
  const mine = new Uint8Array(n);          // 1 = influenced, 2 = reached
  for (const i of held) mine[rep[i]] = 1;
  const stack = [rep[anchor]];
  mine[rep[anchor]] = 2;
  while (stack.length) {
    const v = stack.pop();
    for (let e = start[v]; e < start[v + 1]; e++) {
      const u = list[e];
      if (mine[u] === 1) { mine[u] = 2; stack.push(u); }
    }
  }

  let changed = 0, orphans = 0;
  for (const i of held) {
    if (mine[rep[i]] === 2) continue;      // the bone's own geometry
    orphans++;
    let keep = 0;
    for (let k = 0; k < 4; k++) {
      if (si.getComponent(i, k) === boneIndex) continue;
      keep += sw.getComponent(i, k);
    }
    if (keep <= 1e-6) continue;            // nothing else holds it — leave it be
    for (let k = 0; k < 4; k++) {
      if (si.getComponent(i, k) === boneIndex) sw.setComponent(i, k, 0);
    }
    for (let k = 0; k < 4; k++) sw.setComponent(i, k, sw.getComponent(i, k) / keep);
    changed++;
  }
  if (changed) si.needsUpdate = sw.needsUpdate = true;
  return { changed, orphans };
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

// Remove the named bones' influence from one island and renormalize.
//
// This is the HAND-AUTHORED form: someone clicked an island in the bench and
// named the bones that have no business driving it, so it is applied as asked,
// whole. `maxShare` can hold back the vertices a dropped bone owns outright —
// useful when aiming a `drop` at an island that is partly legitimate — but the
// default is to honour the op, because a half-applied drop leaves one surface
// split between two bones, which tears. The rule form (`bleed`) decides that
// question by connectivity instead and never needs the dial.
export function dropInfluence(mesh, verts, boneIndices, fallback, maxShare = 1) {
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

// --------------------------------------------------------------- tighten ---
// A THIRD DEFECT, and the one that shows in motion rather than at rest: the
// hand-over between two bones spread along most of the limb.
//
// A bend happens where two bones swap influence. If that swap takes 15 cm of a
// 30 cm forearm, the arm does not bend at the elbow — it curves along its whole
// length, and the eye reads that as an arm that is too long and made of rubber.
// It is invisible in a bind pose and unmissable in a punch.
//
// It is not a rigging mistake either. Rigify splits every limb into a bone and
// a TWIST bone that is a rigid child of it, automatic weighting spreads the
// influence smoothly across all four, and in Blender the twists are driven by
// constraints that a `.glb` cannot carry. Measured across the seven models
// shipped here the hand-over runs from 13% of the limb (Maki, Mahito — which
// is what it should look like) to 51% and 64% (Nobara's elbows, Yuji's right).
//
// WHAT THIS DOES NOT DO. It does not touch the split WITHIN a group: how the
// upper arm shares a vertex with its own twist bone is what keeps a shoulder
// from collapsing, and it is left exactly as authored. Only the parent group's
// total against the child group's total is re-ramped, over a band centred on
// the joint. So a vertex 2 cm past the elbow ends up driven by the forearm and
// its twist in the proportions the exporter chose, and simply stops being
// driven by the upper arm.
const JOINT_CHAINS = {
  LoArmL: ['UpArmL', 'LoArmL', 'HandL'], LoArmR: ['UpArmR', 'LoArmR', 'HandR'],
  ShinL: ['ThighL', 'ShinL', 'FootL'], ShinR: ['ThighR', 'ShinR', 'FootR']
};
export const LIMB_JOINTS = Object.keys(JOINT_CHAINS);

const _wp = new THREE.Vector3();
const worldOf = n => { n.updateWorldMatrix(true, false); return new THREE.Vector3().setFromMatrixPosition(n.matrixWorld); };

/**
 * The frame one joint's hand-over happens in: which bones ride with the parent,
 * which with the child, and where along the limb each vertex sits. Shared by
 * the measurement and the repair so they cannot disagree about what a "band" is.
 */
function jointFrame(mesh, map, joint) {
  const chain = JOINT_CHAINS[joint];
  if (!chain) return null;
  const [pn, cn, tn] = chain;
  if (!map[pn] || !map[cn] || !map[tn]) return null;
  const bones = mesh.skeleton.bones;
  const mapped = new Set(Object.values(map));
  // a mapped bone plus every descendant that is NOT itself mapped: Rigify's
  // twists, which are rigid children and so move exactly as their parent does
  const groupOf = canon => {
    const set = new Set();
    (function walk(n) {
      const i = bones.indexOf(n);
      if (i >= 0) set.add(i);
      for (const ch of n.children) if (!mapped.has(ch)) walk(ch);
    })(map[canon]);
    return set;
  };
  const G1 = groupOf(pn), G2 = groupOf(cn);
  if (!G1.size || !G2.size) return null;
  const A = worldOf(map[pn]), B = worldOf(map[cn]), C = worldOf(map[tn]);
  const l1 = A.distanceTo(B), l2 = B.distanceTo(C);
  const len = l1 + l2;
  if (len < 1e-6) return null;
  // ALONG THE BONES, not along the straight line between their ends. On a
  // model whose bind pose is a fighting stance the arm is ALREADY bent, and a
  // chord from shoulder to wrist passes outside it: every projection is then
  // wrong, the band lands somewhere unintended, and on Yuji it reached the
  // hand and tore it into shards. Arclength along shoulder->elbow->wrist is
  // right whatever the bind pose is doing.
  return { G1, G2, A, B, C, l1, l2, len, jointT: l1 / len,
    lead1: bones.indexOf(map[pn]), lead2: bones.indexOf(map[cn]) };
}

/** Where a point sits along the bone polyline, 0 at the parent, 1 at the tip. */
const _q = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3();
function alongChain(f, p) {
  let bestD = Infinity, bestS = 0;
  for (const [P0, P1, base] of [[f.A, f.B, 0], [f.B, f.C, f.l1]]) {
    _d.copy(P1).sub(P0);
    const L2 = _d.lengthSq();
    if (L2 < 1e-12) continue;
    const t = Math.max(0, Math.min(1, _r.copy(p).sub(P0).dot(_d) / L2));
    _q.copy(P0).addScaledVector(_d, t);
    const dist = _q.distanceTo(p);
    if (dist < bestD) { bestD = dist; bestS = (base + t * Math.sqrt(L2)) / f.len; }
  }
  return { t: bestS, radius: bestD };
}

/** Per-vertex: how far along the limb, and the two group weights. */
function* limbVerts(mesh, P, f, minShare = 0.55) {
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const v = new THREE.Vector3();
  for (let i = 0; i < si.count; i++) {
    let w1 = 0, w2 = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w <= 0) continue;
      const b = si.getComponent(i, k);
      if (f.G1.has(b)) w1 += w; else if (f.G2.has(b)) w2 += w;
    }
    if (w1 + w2 < minShare) continue;
    v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    const { t, radius } = alongChain(f, v);
    if (t < f.jointT - 0.28 || t > f.jointT + 0.28) continue;
    // and stay on the limb: a sleeve hanging away from a bent arm is nearer
    // this chain than to anything else, and is not part of the joint
    if (radius > 0.22 * f.len) continue;
    yield { i, t, w1, w2 };
  }
}

/**
 * How wide the hand-over is, as a fraction of the limb: where the child's
 * share of the pair passes 10% and where it passes 90%, smoothed. Null when
 * too little of the limb is dominated by the pair to say.
 */
export function handoverBand(mesh, P, map, joint) {
  const f = jointFrame(mesh, map, joint);
  if (!f) return null;
  const pts = [...limbVerts(mesh, P, f)].map(v => ({ t: v.t, s: v.w2 / (v.w1 + v.w2) }));
  if (pts.length < 40) return null;
  pts.sort((a, b) => a.t - b.t);
  const W = Math.max(8, Math.round(pts.length / 40));
  const cross = target => {
    for (let i = 0; i < pts.length; i++) {
      const lo = Math.max(0, i - W), hi = Math.min(pts.length, i + W);
      let sum = 0;
      for (let j = lo; j < hi; j++) sum += pts[j].s;
      if (sum / (hi - lo) >= target) return pts[i].t;
    }
    return null;
  };
  const lo = cross(0.1), mid = cross(0.5), hi = cross(0.9);
  if (lo == null || hi == null) return null;
  return { joint, n: pts.length, lo, mid, hi, jointT: f.jointT, band: hi - lo, limbCm: f.len * 100 };
}

/**
 * Re-ramp one joint's hand-over to `band` (a fraction of the limb), centred on
 * the joint. Returns the number of vertices changed.
 */
export function tightenJoint(mesh, P, map, joint, band = 0.28) {
  const f = jointFrame(mesh, map, joint);
  if (!f) return 0;
  const g = mesh.geometry;
  const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
  const half = Math.max(0.015, band / 2);
  let changed = 0;
  for (const { i, t, w1, w2 } of limbVerts(mesh, P, f)) {
    let u = (t - (f.jointT - half)) / (2 * half);
    u = u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);          // smoothstep
    const total = w1 + w2;
    const n1 = total * (1 - u), n2 = total * u;
    if (Math.abs(n1 - w1) < 0.01) continue;
    // rebuild this vertex's influences: everything outside the pair untouched,
    // each group rescaled as a whole so its internal split survives
    const acc = new Map();
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w <= 0) continue;
      const b = si.getComponent(i, k);
      const scaled = f.G1.has(b) ? (w1 > 1e-6 ? w * n1 / w1 : 0)
        : f.G2.has(b) ? (w2 > 1e-6 ? w * n2 / w2 : 0) : w;
      if (scaled > 0) acc.set(b, (acc.get(b) ?? 0) + scaled);
    }
    // a vertex past the joint with no child influence at all has to gain some
    if (w1 <= 1e-6 && n1 > 0) acc.set(f.lead1, (acc.get(f.lead1) ?? 0) + n1);
    if (w2 <= 1e-6 && n2 > 0) acc.set(f.lead2, (acc.get(f.lead2) ?? 0) + n2);
    const top = [...acc].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const sum = top.reduce((s, x) => s + x[1], 0) || 1;
    for (let k = 0; k < 4; k++) {
      si.setComponent(i, k, top[k] ? top[k][0] : 0);
      sw.setComponent(i, k, top[k] ? top[k][1] / sum : 0);
    }
    changed++;
  }
  if (changed) { si.needsUpdate = true; sw.needsUpdate = true; }
  return changed;
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
    // ---- rule form: a bone drives one patch of surface, not two ----
    if (Array.isArray(op?.bleed) && op.bleed.length) {
      const re = new RegExp(op.bleed.join('|'), 'i');
      let bones = 0, vertsTouched = 0, orphans = 0;
      for (const c of cache) {
        c.graph ??= surfaceGraph(c.mesh, c.P);
        c.mesh.skeleton.bones.forEach((b, bi) => {
          if (!re.test(b.name)) return;
          const r = bleedOff(c.mesh, bi, c.graph);
          bones++;
          vertsTouched += r.changed;
          orphans += r.orphans;
        });
      }
      report.push({ bleed: op.bleed, bones, changed: vertsTouched, stranded: orphans - vertsTouched });
      continue;
    }
    // ---- tighten a joint's hand-over ----
    if (op?.tighten) {
      const joints = op.tighten === 'limbs' ? LIMB_JOINTS
        : Array.isArray(op.tighten) ? op.tighten : [op.tighten];
      // The smoothstep's width, which measures out at roughly 0.6 of itself on
      // the 10-90 crossing this reports — so 0.28 lands at the 17% the two
      // cleanly-exported models (Maki, Mahito) already have. Deliberately not
      // tighter: a hard edge at an elbow creases.
      const band = op.band ?? 0.28;
      const done = [];
      for (const c of cache) {
        for (const j of joints) {
          // measured for the log only — a joint the measurement cannot read
          // (too little of the limb dominated by the pair, which on Nobara is
          // a skirt over a thigh) is still repaired, on the same vertices the
          // measurement would have used
          const was = handoverBand(c.mesh, c.P, map, j);
          const n = tightenJoint(c.mesh, c.P, map, j, band);
          if (!n) continue;
          const now = handoverBand(c.mesh, c.P, map, j);
          const pct = r => r ? (r.band * 100).toFixed(0) + '%' : '?';
          done.push(`${j} ${pct(was)}->${pct(now)} (${n}v)`);
        }
      }
      report.push({ tighten: joints, band, done });
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
      entry.changed = dropInfluence(c.mesh, verts, idxs, keep?.index ?? 0, op.maxShare);
    }
    report.push(entry);
  }
  if (report.length) {
    console.info('[render3d] weight ops:', report.map(r =>
      // FIELD NAMES, matched to what the bleed branch actually pushes. It
      // reported `r.islands` and `r.kept`, neither of which is set, so every
      // load logged "undefined islands (Nv cleaned, undefinedv left)" — the
      // one number a reader would use to tell a no-op from a repair was the
      // one that read as broken.
      r.bleed ? `bleed ${r.bleed.join('/')} off ${r.bones} bone(s) (${r.changed}v cleaned, ` +
        `${r.stranded}v left to their own bone)`
        : r.tighten ? `tighten to ${(r.band * 100).toFixed(0)}%: ${r.done.join(', ')}`
          : `${r.rigid ? 'rigid→' + r.rigid : 'drop ' + (r.drop ?? []).join('/')} on ${r.verts}v`
    ).join('; '));
  }
  return report;
}
