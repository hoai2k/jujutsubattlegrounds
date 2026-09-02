// Inverted-hull ink line. One ShaderMaterial for skinned and static meshes;
// thickness scales with distance so far silhouettes stay a touch heavier and
// near ones do not turn into marker pen. Cached by (colour, thickness).
import * as THREE from 'three';

const VERT = /* glsl */ `
uniform float uThickness;
#include <common>
#include <skinning_pars_vertex>
void main() {
  #include <skinbase_vertex>
  vec3 objectNormal = vec3( normal );
  #include <skinnormal_vertex>
  vec3 transformed = vec3( position );
  #include <skinning_vertex>
  vec4 mvTmp = modelViewMatrix * vec4( transformed, 1.0 );
  float distScale = clamp( -mvTmp.z / 6.5, 0.7, 1.9 );
  transformed += normalize( objectNormal ) * uThickness * distScale;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
}`;
const FRAG = /* glsl */ `
uniform vec3 uColor;
void main() { gl_FragColor = vec4( uColor, 1.0 ); }`;

const _cache = new Map();
export function outlineMaterial({ color = 0x06070c, thickness = 0.012 } = {}) {
  const key = color + ':' + thickness;
  if (_cache.has(key)) return _cache.get(key);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: { uThickness: { value: thickness }, uColor: { value: new THREE.Color(color) } },
    side: THREE.BackSide
  });
  mat.toneMapped = false;
  _cache.set(key, mat);
  return mat;
}

export function makeOutline(src, opts = {}) {
  const mat = outlineMaterial(opts);
  let hull;
  if (src.isSkinnedMesh) { hull = new THREE.SkinnedMesh(src.geometry, mat); hull.bind(src.skeleton, src.bindMatrix); }
  else hull = new THREE.Mesh(src.geometry, mat);
  hull.frustumCulled = false;
  hull.name = src.name + '_outline';
  hull.castShadow = false;
  return hull;
}
