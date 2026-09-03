// Cloth helpers shared by hair and garments: spring-driven flaps and strands.
import * as THREE from 'three';
import { makeOutline } from '../shaders/outline.js';

// Tapered flap pointing -Y from its origin, with vertex colours for the toon materials.
export function flapGeo(w0, w1, len, thick, color = 0xffffff, curl = 0) {
  const geo = new THREE.BufferGeometry();
  const hw0 = w0 / 2, hw1 = w1 / 2, ht = thick / 2;
  const posArr = [
    -hw0, 0, ht, hw0, 0, ht, hw0, 0, -ht, -hw0, 0, -ht,
    -hw1, -len, ht + curl, hw1, -len, ht + curl, hw1, -len, -ht + curl, -hw1, -len, -ht + curl
  ];
  const idx = [0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 6, 2, 6, 3, 3, 6, 7, 3, 7, 0, 0, 7, 4, 4, 7, 5, 5, 7, 6, 0, 1, 2, 0, 2, 3];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  geo.setIndex(idx);
  const g = geo.toNonIndexed();
  g.computeVertexNormals();
  return colorize(g, color);
}

export function colorize(geo, color) {
  const n = geo.getAttribute('position').count;
  const c = new THREE.Color(color);
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function flapMesh(geo, material, outline) {
  const grp = new THREE.Group();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  grp.add(mesh);
  if (outline) grp.add(makeOutline(mesh, outline));
  return grp;
}

// A chain of flaps hanging from `bone` — the standard secondary-motion unit.
// segs: number of segments, len per segment, widths from w0 to w1.
export function hangingChain(ctx, { bone, offset, restDir = [0, -1, 0], segs = 3, len, w0, w1, thick = 0.008, color, slot = 'cloth', stiffness = 70, damping = 0.84, gravity = 7, wind = 0, curl = 0 }) {
  const segments = [];
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const geo = flapGeo(w0 + (w1 - w0) * t0, w0 + (w1 - w0) * t1, len * 1.04, thick * (1 - t0 * 0.5), color, curl * t1);
    segments.push({ len, mesh: flapMesh(geo, ctx.materials[slot], ctx.outline) });
  }
  ctx.springs.push({ bone, localOffset: new THREE.Vector3(...offset), restDir: new THREE.Vector3(...restDir), segments, stiffness, damping, gravity, wind });
}
