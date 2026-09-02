// PAINTED CEL. MeshToonMaterial with an authored ramp (band positions AND
// softness, so skin gets a soft terminator and cloth a hard one), extended via
// onBeforeCompile with: a tinted dark band (shadows are coloured, never black),
// a fresnel rim from the opposite side of the key, a tight gloss band, and a
// warm/cool ambient split on the up axis. Materials are cached by archetype +
// colour key so the whole roster shares a few dozen programs.
import * as THREE from 'three';

const rampCache = new Map();
// bands: [{at, value, soft}] dark -> light. `at` is the dotNL position 0..1,
// `soft` the width of the transition in dotNL units.
export function rampTexture(bands) {
  const key = JSON.stringify(bands);
  if (rampCache.has(key)) return rampCache.get(key);
  const W = 64;
  const data = new Uint8Array(W * 4);
  for (let i = 0; i < W; i++) {
    const x = (i + 0.5) / W;
    let v = bands[0].value;
    for (let b = 1; b < bands.length; b++) {
      const bb = bands[b];
      const s = Math.max(0.002, bb.soft ?? 0.01);
      const t = Math.min(1, Math.max(0, (x - (bb.at - s / 2)) / s));
      const sm = t * t * (3 - 2 * t);
      v = v + (bb.value - v) * sm;
    }
    const c = Math.round(v * 255);
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = c; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, W, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  rampCache.set(key, tex);
  return tex;
}

const CHUNK = /* glsl */ `
{
  vec3 tvDir = normalize( vViewPosition );
  float tNdv = clamp( dot( normal, tvDir ), 0.0, 1.0 );
  float tRim = smoothstep( uRimStart, uRimStart + 0.10, 1.0 - tNdv );
  // rim only where the key light is NOT — it is a back light
  vec3 tKey = normalize( uKeyDirView );
  float tAway = 1.0 - clamp( dot( normal, tKey ) * 0.5 + 0.5, 0.0, 1.0 );
  tRim *= 0.35 + 0.65 * tAway;
  float tGloss = smoothstep( 0.90, 0.985, 1.0 - tNdv ) * uGloss;
  float tUp = clamp( normal.y * 0.55 + 0.5, 0.0, 1.0 );
  // tinted dark band: where direct light is low, pull toward the shade colour
  float tLit = clamp( dot( normal, tKey ), 0.0, 1.0 );
  vec3 tShade = mix( uShadeTint, vec3(1.0), smoothstep( 0.05, 0.45, tLit ) );
  outgoingLight *= tShade;
  outgoingLight += diffuseColor.rgb * mix( uCoolTint, uWarmTint, tUp );
  outgoingLight += uRimColor * ( tRim * uRimStrength + tGloss );
  outgoingLight += uEnergy * uEnergyColor;
}
#include <opaque_fragment>`;

// shared uniforms written once per frame by the stage: key light direction in view space
export const SHARED = { keyDirView: { value: new THREE.Vector3(0.4, 0.8, 0.4) } };

export function toonMaterial(opts = {}) {
  const {
    color = 0xffffff, map = null,
    bands = [{ value: 0.34 }, { at: 0.5, value: 1.0, soft: 0.02 }],
    rim = 0.30, rimColor = 0xbfd9ff, rimStart = 0.70, gloss = 0.0,
    warm = 0x2a1d12, cool = 0x101828, shade = 0x8a7aa8,
    vertexColors = false, side = THREE.FrontSide, transparent = false, opacity = 1,
    emissive = 0x000000, emissiveIntensity = 1, energy = 0, energyColor = 0xffffff
  } = opts;
  const mat = new THREE.MeshToonMaterial({
    color, map, gradientMap: rampTexture(bands), vertexColors, transparent, opacity, emissive, emissiveIntensity, side
  });
  const U = {
    uRimColor: { value: new THREE.Color(rimColor) },
    uRimStrength: { value: rim },
    uRimStart: { value: rimStart },
    uGloss: { value: gloss },
    uWarmTint: { value: new THREE.Color(warm) },
    uCoolTint: { value: new THREE.Color(cool) },
    uShadeTint: { value: new THREE.Color(shade) },
    uKeyDirView: SHARED.keyDirView,
    uEnergy: { value: energy },
    uEnergyColor: { value: new THREE.Color(energyColor) }
  };
  mat.userData.u = U;
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        '#include <common>\nuniform vec3 uRimColor;uniform float uRimStrength;uniform float uRimStart;uniform float uGloss;uniform vec3 uWarmTint;uniform vec3 uCoolTint;uniform vec3 uShadeTint;uniform vec3 uKeyDirView;uniform float uEnergy;uniform vec3 uEnergyColor;')
      .replace('#include <opaque_fragment>', CHUNK);
  };
  mat.customProgramCacheKey = () => 'f51toon';
  return mat;
}

// Archetypes: a shading RESPONSE, not a hue.
export const ARCH = {
  skin: { bands: [{ value: 0.46 }, { at: 0.42, value: 0.78, soft: 0.16 }, { at: 0.62, value: 1.0, soft: 0.06 }], rim: 0.18, rimStart: 0.76, warm: 0x3a2418, cool: 0x16203a, shade: 0xd8b8c8 },
  cloth: { bands: [{ value: 0.40 }, { at: 0.44, value: 0.72, soft: 0.03 }, { at: 0.66, value: 1.0, soft: 0.02 }], rim: 0.28, rimStart: 0.70, warm: 0x2a1d12, cool: 0x0e1626, shade: 0xc0b0e0 },
  hair: { bands: [{ value: 0.34 }, { at: 0.45, value: 0.70, soft: 0.02 }, { at: 0.70, value: 1.0, soft: 0.02 }], rim: 0.46, rimStart: 0.64, gloss: 0.40, warm: 0x2a2016, cool: 0x121a30, shade: 0xb8a8e0 },
  metal: { bands: [{ value: 0.18 }, { at: 0.35, value: 0.55, soft: 0.02 }, { at: 0.72, value: 1.0, soft: 0.01 }], rim: 0.6, rimStart: 0.58, gloss: 0.85, warm: 0x1c1812, cool: 0x0c1220, shade: 0xa0a8c8 },
  fur: { bands: [{ value: 0.42 }, { at: 0.3, value: 0.6, soft: 0.2 }, { at: 0.6, value: 0.85, soft: 0.2 }, { at: 0.85, value: 1.0, soft: 0.1 }], rim: 0.55, rimStart: 0.5, gloss: 0, warm: 0x33261a, cool: 0x14192a, shade: 0xc8c0d8 },
  leather: { bands: [{ value: 0.22 }, { at: 0.5, value: 0.62, soft: 0.05 }, { at: 0.75, value: 1.0, soft: 0.02 }], rim: 0.4, rimStart: 0.62, gloss: 0.5, warm: 0x2a1d12, cool: 0x0e1626, shade: 0xb0a0c8 },
  stone: { bands: [{ value: 0.36 }, { at: 0.48, value: 0.72, soft: 0.05 }, { at: 0.72, value: 1.0, soft: 0.04 }], rim: 0.2, rimStart: 0.72, warm: 0x2a2420, cool: 0x101826, shade: 0xc0bcd0 }
};

const matCache = new Map();
export function archetype(name, o = {}) {
  const key = name + ':' + JSON.stringify(o);
  if (matCache.has(key)) return matCache.get(key);
  const m = toonMaterial({ ...ARCH[name], ...o });
  m.name = name;
  matCache.set(key, m);
  return m;
}

// flat, unlit: eyes, brows, mouths — the one place the cel is broken so faces always read
export const flatMaterial = (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, ...o });

// ENERGY: additive, unlit, fresnel-bright — cursed energy, auras, projectile cores
export function energyMaterial({ color = 0x8fd4ff, opacity = 0.9, additive = true, fresnel = 1.4, pulse = 0 } = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uFresnel: { value: fresnel }, uTime: { value: 0 }, uPulse: { value: pulse } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uFresnel, uTime, uPulse;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), uFresnel);
        float p = 1.0 + uPulse * sin(uTime * 14.0);
        vec3 c = uColor * (0.55 + f * 1.4) * p + vec3(f * f * 0.6);
        gl_FragColor = vec4(c, uOpacity * (0.45 + f * 0.7));
      }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide
  });
  mat.toneMapped = false;
  return mat;
}
