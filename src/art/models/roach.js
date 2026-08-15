// THE SWARM — Kurourushi's cursed cockroaches.
//
// One tiny model, rendered EN MASSE through a single InstancedMesh. This is
// flagged in the brief as the biggest performance risk in the addition and it
// is treated as one: there is exactly one geometry, exactly one material and
// exactly one draw call for every roach on the map, however many that is, and
// the caller is handed a hard capacity it cannot exceed.
//
// The individual is deliberately cheap — roughly 90 triangles — because the
// read is never one roach, it is a thousand of them moving as a sheet. What
// the geometry has to get right at that size is only the SILHOUETTE: a flat
// teardrop body, a pronotum shield with a paler rim, and two long antennae
// sweeping forward. Legs are two thin outriggers per side rather than six
// separate limbs; at swarm scale nobody counts them and six would triple the
// vertex cost of the single heaviest object in the game.
import * as THREE from 'three';
import { tGeo, mergeGeos } from '../builders/geo.js';
import { toonMaterial } from '../shaders/toon.js';

const BODY = 0x141519;
const SHIELD = 0x2b2f36;
const RIM = 0x6b5a3a;

function roachGeo() {
  const parts = [];
  const col = [];
  const push = (g, c) => { parts.push(g); col.push(c); };

  // MEASURED: the first pass came in at 206 triangles a roach, which is 45k
  // in the draw call at the cap. These segment counts halve that and cost
  // nothing visible — at swarm scale a roach is eight pixels across.
  // body: a flattened teardrop, long axis +Z
  push(tGeo(new THREE.SphereGeometry(0.5, 6, 4), { scale: [0.62, 0.26, 1.0], pos: [0, 0.13, -0.10] }), BODY);
  // pronotum shield over the front third
  push(tGeo(new THREE.SphereGeometry(0.34, 5, 3), { scale: [0.86, 0.30, 0.72], pos: [0, 0.17, 0.26] }), SHIELD);
  // head
  push(tGeo(new THREE.SphereGeometry(0.16, 4, 3), { scale: [1.0, 0.7, 0.9], pos: [0, 0.13, 0.50] }), BODY);
  // antennae: two long thin slivers sweeping forward and out
  for (const s of [1, -1]) {
    push(tGeo(new THREE.BoxGeometry(0.03, 0.03, 0.62), { rot: [-6, s * 22, 0], pos: [s * 0.09, 0.15, 0.82] }), RIM);
    // legs, two outriggers a side
    push(tGeo(new THREE.BoxGeometry(0.42, 0.025, 0.05), { rot: [0, s * 26, 0], pos: [s * 0.26, 0.05, 0.16] }), BODY);
    push(tGeo(new THREE.BoxGeometry(0.42, 0.025, 0.05), { rot: [0, s * -22, 0], pos: [s * 0.26, 0.05, -0.20] }), BODY);
  }

  // bake the colours in as vertex colours so the whole swarm is one material
  const flat = parts.map((g, i) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of ['uv', 'uv1', 'uv2']) if (n.getAttribute(k)) n.deleteAttribute(k);
    const cnt = n.getAttribute('position').count;
    const c = new THREE.Color(col[i]);
    const arr = new Float32Array(cnt * 3);
    for (let v = 0; v < cnt; v++) { arr[v * 3] = c.r; arr[v * 3 + 1] = c.g; arr[v * 3 + 2] = c.b; }
    n.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    n.computeVertexNormals();
    return n;
  });
  return mergeGeos(flat);
}

let _geo = null;

export class RoachSwarm {
  // `cap` is a HARD ceiling on instances. The buffer is allocated once at this
  // size and never grows; the swarm system culls its oldest roaches to stay
  // under it, so the renderer's cost is fixed no matter what happens in the
  // fight (see combat/swarm.js).
  constructor(cap = 220) {
    this.cap = cap;
    if (!_geo) _geo = roachGeo();
    this.material = toonMaterial({
      steps: [30, 96, 200], rim: 0.5, rimStart: 0.62, gloss: 0.6,
      rimColor: 0x8fd0a0, warm: 0x141018, cool: 0x0a1420
    });
    this.mesh = new THREE.InstancedMesh(_geo, this.material, cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.name = 'roachSwarm';
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._n = 0;
  }

  begin() { this._n = 0; }

  // One roach. `wobble` is the scuttle: a fast roll+squash that makes a static
  // instance look like it is running rather than sliding.
  write(x, ypos, z, yaw, scale, wobble = 0) {
    if (this._n >= this.cap) return false;
    this._e.set(Math.sin(wobble) * 0.22, yaw, Math.cos(wobble * 1.7) * 0.26);
    this._q.setFromEuler(this._e);
    this._p.set(x, ypos, z);
    const sq = 1 + Math.sin(wobble * 2) * 0.12;
    this._s.set(scale, scale / sq, scale * sq);
    this._m.compose(this._p, this._q, this._s);
    this.mesh.setMatrixAt(this._n++, this._m);
    return true;
  }

  commit() {
    this.mesh.count = this._n;
    if (this._n > 0) this.mesh.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.mesh.removeFromParent();
    this.material.dispose();
  }
}
