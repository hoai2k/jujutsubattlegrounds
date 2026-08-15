// X-RAY OCCLUSION — anything standing between the camera and the fighter it is
// following dissolves out of the way.
//
// WHY THIS AND NOT A PULL-IN. The chase camera already pulls itself toward the
// look target when it would enter a wall (camera.js `raySweep`), and that is
// the right answer for the camera ending up INSIDE geometry. It is the wrong
// answer for geometry standing in the middle of the shot: on the multi-level
// maps a mezzanine pillar, a standing train, a colonnade or the underside of a
// walkway sits between the rig and the fighter with clear space at both ends,
// and pulling in just puts the camera on the near side of the same pillar. The
// fight goes on behind it either way.
//
// WHY A SHADER AND NOT PER-OBJECT FADING. The maps merge their static geometry
// into ONE mesh per material (kit.js `_flushStatics`) — that is what keeps a
// 400-piece level at a handful of draw calls. There is no per-pillar object
// left to fade: raycasting and turning a hit mesh transparent would fade the
// entire map. So the cut has to be per-FRAGMENT, and it has to live in the
// shared materials.
//
// HOW. Every fragment knows its own view-space position. The subject's position
// is uploaded in view space too, so the camera is the origin and the test is a
// cone: a fragment inside the cone from the camera to the subject, and nearer
// than the subject, is in the way. Fragments in the way are dropped on an
// ordered dither pattern, which gives a screen-door fade with no transparency
// sorting, no second render pass and no change to how anything is batched.
//
// The cut is a CONE rather than a cylinder so it holds a constant size on
// screen: close to the camera a wall is cut over a wide area, close to the
// subject over a narrow one, and the hole always frames the fighter rather than
// ballooning as you back into a corner.
import * as THREE from 'three';

// Tunables. `radius` is measured in metres AT THE SUBJECT, which is the only
// place the hole's size is intuitive: 1.5 m is a bit wider than a fighter.
export const XRAY = {
  enabled: true,
  radius: 1.55,
  // The dither ladder has 16 rungs and tops out at 15/16, so anything at or
  // above 0.9375 removes the occluder completely. 0.86 keeps roughly one pixel
  // in sixteen, which reads as a ghost of the wall rather than a hole in the map.
  strength: 0.92,
  nearClip: 0.35,   // ignore fragments right on the lens
  backOff: 1.20     // stop cutting this far in front of the subject, so the
                    // floor he is standing on is never punched through
};

// SCOPE. This is applied to the MAP's materials only (see kit.js) and
// deliberately not to the roster's. Cutting level geometry is the feature;
// cutting a fighter would mean the subject's own body dissolving whenever the
// camera got close, and a large character (Mahoraga's 3.6 m) reaches far enough
// toward the lens to trip it however the back-off is tuned.

// ONE set of uniform objects, shared by reference with every patched material,
// so a single write per view updates the whole scene. The alternative — a
// uniform per material — would mean walking every material in the map every
// frame, twice per view in split screen.
const U = {
  uXrayN: { value: 0 },
  uXrayA: { value: new THREE.Vector3() },
  uXrayB: { value: new THREE.Vector3() },
  uXrayR: { value: XRAY.radius },
  uXrayK: { value: XRAY.strength },
  uXrayNear: { value: XRAY.nearClip },
  uXrayBack: { value: XRAY.backOff }
};

const VERT_HEAD = 'varying vec3 vXrayVP;\n';
const VERT_BODY = '\nvXrayVP = mvPosition.xyz;';

const FRAG_HEAD = /* glsl */`
varying vec3 vXrayVP;
uniform float uXrayN; uniform vec3 uXrayA; uniform vec3 uXrayB;
uniform float uXrayR; uniform float uXrayK; uniform float uXrayNear; uniform float uXrayBack;
// how much of this fragment is inside the cone from the camera to the subject
float xrayCut( vec3 p, vec3 f ) {
  float L = length( f );
  if ( L < 0.001 ) return 0.0;
  vec3 dir = f / L;
  float t = dot( p, dir );                       // depth along the sightline
  if ( t <= uXrayNear || t >= L - uXrayBack ) return 0.0;
  float off = length( p - dir * t );             // how far off that line it sits
  float lim = uXrayR / L;                        // the cone's half-angle
  float ang = off / max( t, 0.001 );
  float k = 1.0 - smoothstep( lim * 0.55, lim, ang );
  // soften the cut back in at both ends: hard edges where a wall enters the
  // cone read as a hole punched in the world, a gradient reads as a fade
  k *= smoothstep( uXrayNear, uXrayNear + 0.9, t );
  k *= smoothstep( 0.0, 1.4, L - uXrayBack - t );
  return k;
}
// 4x4 ordered (Bayer) dither — a stable screen-door pattern, so a partly-cut
// surface holds still under the camera instead of fizzing the way noise would.
//
// Written on the pixel coordinate REDUCED MOD 4 first. The compact
// fract(x*0.5 + y*y*0.75) formulation is the usual way to write this and it is
// wrong here: fragment shaders run at mediump by default, y*y at the bottom of
// a 1080-line frame is ~10^6, and a mediump float that large has no fractional
// bits left at all — fract() comes back as a constant and the whole pattern
// collapses. Everything below stays inside 0..15.
float xrayDither( vec2 c ) {
  vec2 p = mod( floor( c ), 4.0 );
  float x0 = mod( p.x, 2.0 ), x1 = floor( p.x * 0.5 );
  float y0 = mod( p.y, 2.0 ), y1 = floor( p.y * 0.5 );
  float b0 = mod( y0 + x0, 2.0 );
  float b2 = mod( y1 + x1, 2.0 );
  return ( b0 * 8.0 + x0 * 4.0 + b2 * 2.0 + x1 ) / 16.0;
}
`;

const FRAG_BODY = /* glsl */`
{
  float xk = 0.0;
  if ( uXrayN > 0.5 ) xk = xrayCut( vXrayVP, uXrayA );
  if ( uXrayN > 1.5 ) xk = max( xk, xrayCut( vXrayVP, uXrayB ) );
  if ( xk > 0.002 && xrayDither( gl_FragCoord.xy ) < xk * uXrayK ) discard;
}
`;

// Patch a material so its fragments can be cut away. Safe to call twice, and
// safe on materials that already have their own onBeforeCompile — the existing
// hook is kept and run first.
export function xrayable(material) {
  if (!material || material.userData.xray) return material;
  material.userData.xray = true;
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    if (prev) prev.call(this, shader, renderer);
    Object.assign(shader.uniforms, U);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_HEAD)
      .replace('#include <project_vertex>', '#include <project_vertex>' + VERT_BODY);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_HEAD)
      // as early in main() as there is a chunk to hang off: discarding before
      // the lighting maths is done is the whole point of doing it this way
      .replace('#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>' + FRAG_BODY);
  };
  // The injected source is identical for every patched material, so they can
  // and should share a compiled program — but a material that already had a
  // hook gets DIFFERENT code from one that did not, and the two must not be
  // handed the same program. (Uniform values stay per-material either way;
  // three only shares the program object.)
  material.customProgramCacheKey = () => 'xray' + (prev ? '+base' : '');
  material.needsUpdate = true;
  return material;
}

// ---------------------------------------------------------------------------
// per-view focus
// ---------------------------------------------------------------------------
// Each eye follows a different fighter, and split screen renders the same
// materials once per eye, so the focus cannot live on the material. It is
// registered against the CAMERA and uploaded immediately before that eye draws.
const _focus = new Map();   // camera -> Vector3 (world) | null
const _v = new THREE.Vector3();

export function setXrayFocus(camera, worldPos) {
  if (!camera) return;
  if (!worldPos) _focus.delete(camera);
  else _focus.set(camera, (_focus.get(camera) || new THREE.Vector3()).copy(worldPos));
}
export function clearXrayFocus() { _focus.clear(); }

// Called by the stage immediately before each eye renders.
export function applyXray(camera) {
  U.uXrayR.value = XRAY.radius;
  U.uXrayK.value = XRAY.strength;
  U.uXrayNear.value = XRAY.nearClip;
  U.uXrayBack.value = XRAY.backOff;
  const f = XRAY.enabled ? _focus.get(camera) : null;
  if (!f) { U.uXrayN.value = 0; return; }
  // The fight camera writes its transform with `lookAt` and never updates the
  // matrices itself — the renderer does that later, on its way in. Do it here
  // so the view-space conversion below is this frame's and not last frame's.
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  _v.copy(f).applyMatrix4(camera.matrixWorldInverse);
  U.uXrayA.value.copy(_v);
  U.uXrayN.value = 1;
}
