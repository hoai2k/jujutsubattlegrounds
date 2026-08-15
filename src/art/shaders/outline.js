// Inverted-hull outline pass. One ShaderMaterial serves both skinned and
// static meshes: the skinning chunks are guarded by USE_SKINNING, which the
// renderer defines automatically when the object is a SkinnedMesh.
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
  // slight growth with distance so the far silhouette stays a touch heavier
  vec4 mvTmp = modelViewMatrix * vec4( transformed, 1.0 );
  float distScale = clamp( -mvTmp.z / 7.0, 0.75, 1.7 );
  transformed += normalize( objectNormal ) * uThickness * distScale;
  vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
void main() { gl_FragColor = vec4( uColor, 1.0 ); }`;

export function outlineMaterial({ color = 0x06070c, thickness = 0.0135 } = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) }
    },
    side: THREE.BackSide
  });
}

// Clone a SkinnedMesh (or Mesh) as its outline hull, sharing geometry + skeleton.
export function makeOutline(src, opts = {}) {
  const mat = outlineMaterial(opts);
  let hull;
  if (src.isSkinnedMesh) {
    hull = new THREE.SkinnedMesh(src.geometry, mat);
    hull.bind(src.skeleton, src.bindMatrix);
  } else {
    hull = new THREE.Mesh(src.geometry, mat);
  }
  hull.frustumCulled = false;
  hull.name = src.name + '_outline';
  return hull;
}
