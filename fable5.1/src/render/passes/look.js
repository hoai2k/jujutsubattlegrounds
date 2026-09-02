// THE LOOK PASS — one full-screen shader that does everything the old grade
// pass did plus the readability effects: vignette, tint/lift/saturation,
// hit flash, chromatic aberration and radial blur from a screen-space origin,
// a zoom pulse, and the IMPACT FRAME (a two-tone ink treatment for 2-4 frames
// on heavy hits and finishers). All of it is uniforms; nothing allocates.
import * as THREE from 'three';

export const LookShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.45 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uLift: { value: 0.0 },
    uSat: { value: 1.0 },
    uContrast: { value: 1.0 },
    uFlash: { value: 0.0 },          // additive white
    uFlashColor: { value: new THREE.Color(1, 1, 1) },
    uAberration: { value: 0.0 },     // 0..1 — px offset scaled by resolution
    uRadial: { value: 0.0 },         // 0..1 radial blur strength
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uZoom: { value: 0.0 },           // 0..0.1 zoom pulse toward center
    uImpact: { value: 0.0 },         // 0..1 ink frame
    uInk: { value: new THREE.Color(0.02, 0.02, 0.04) },
    uPaper: { value: new THREE.Color(1.0, 0.96, 0.9) },
    uDesat: { value: 0.0 },          // KO / pause desaturation on top of sat
    uTime: { value: 0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uVignette, uLift, uSat, uContrast, uFlash, uAberration, uRadial, uZoom, uImpact, uDesat, uTime;
    uniform vec3 uTint, uFlashColor, uInk, uPaper;
    uniform vec2 uCenter;
    varying vec2 vUv;

    float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    vec3 sampleScene(vec2 uv) {
      // zoom pulse toward the impact centre
      vec2 d = uv - uCenter;
      uv = uCenter + d * (1.0 - uZoom);
      if (uAberration <= 0.0001 && uRadial <= 0.0001) return texture2D(tDiffuse, uv).rgb;
      vec2 dir = d;
      float dist = length(dir);
      vec2 n = dist > 0.0001 ? dir / dist : vec2(0.0);
      // chromatic aberration grows toward the edges, along the radial
      float ab = uAberration * (0.004 + dist * 0.012);
      vec3 c;
      if (uRadial > 0.0001) {
        // 8-tap radial blur toward the centre
        vec3 acc = vec3(0.0);
        float step = uRadial * 0.035 * dist;
        for (int i = 0; i < 8; i++) {
          float k = float(i) / 7.0;
          vec2 p = uv - n * step * k * 2.0;
          acc += vec3(texture2D(tDiffuse, p + n * ab).r, texture2D(tDiffuse, p).g, texture2D(tDiffuse, p - n * ab).b);
        }
        c = acc / 8.0;
      } else {
        c = vec3(texture2D(tDiffuse, uv + n * ab).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - n * ab).b);
      }
      return c;
    }

    void main() {
      vec3 c = sampleScene(vUv);
      // grade
      c = c * uTint + uLift;
      float g = lum(c);
      c = mix(vec3(g), c, uSat * (1.0 - uDesat));
      c = (c - 0.5) * uContrast + 0.5;
      // vignette
      float d = distance(vUv * vec2(1.0, uResolution.y / uResolution.x) , uCenter * vec2(1.0, uResolution.y / uResolution.x));
      float vig = 1.0 - smoothstep(0.30, 0.85, d * 1.35) * uVignette;
      c *= vig;
      // IMPACT FRAME: two-tone ink with a luminance edge
      if (uImpact > 0.001) {
        vec2 px = 1.5 / uResolution;
        float l0 = lum(texture2D(tDiffuse, vUv).rgb);
        float lx = lum(texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb) - lum(texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb);
        float ly = lum(texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb) - lum(texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb);
        float edge = smoothstep(0.08, 0.35, length(vec2(lx, ly)) * 2.5);
        float tone = smoothstep(0.28, 0.34, l0);
        vec3 ink = mix(uPaper, uInk, 1.0 - tone);
        ink = mix(ink, uInk, edge);
        c = mix(c, ink, uImpact);
      }
      c += uFlashColor * uFlash;
      gl_FragColor = vec4(c, 1.0);
    }`
};
