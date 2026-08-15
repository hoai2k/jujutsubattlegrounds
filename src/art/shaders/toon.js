// Cel/toon shading: MeshToonMaterial + hard-step gradient map, extended via
// onBeforeCompile with a fresnel rim light and a warm/cool ambient split.
// Material archetypes (skin / cloth / hair / metal) differ in band count,
// band floor, rim strength and gloss — shading response, not just hue.
import * as THREE from 'three';

const gradientCache = new Map();

// steps: array of 0..255 luminance values, dark -> light. NearestFilter = hard bands.
export function bandTexture(steps) {
  const key = steps.join(',');
  if (gradientCache.has(key)) return gradientCache.get(key);
  const data = new Uint8Array(steps.length * 4);
  for (let i = 0; i < steps.length; i++) {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = steps[i];
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  gradientCache.set(key, tex);
  return tex;
}

const RIM_CHUNK = /* glsl */ `
{
  vec3 tvDir = normalize( vViewPosition );
  float tNdv = clamp( dot( normal, tvDir ), 0.0, 1.0 );
  float tRim = smoothstep( uRimStart, uRimStart + 0.09, 1.0 - tNdv );
  // gloss: tight view-dependent band (hair sheen / metal glint)
  float tGloss = smoothstep( 0.92, 0.98, 1.0 - tNdv ) * uGloss;
  // warm/cool ambient split on the view-space up axis
  float tUp = clamp( normal.y * 0.55 + 0.5, 0.0, 1.0 );
  outgoingLight += diffuseColor.rgb * mix( uCoolTint, uWarmTint, tUp );
  outgoingLight += uRimColor * ( tRim * uRimStrength + tGloss );
}
#include <opaque_fragment>`;

export function toonMaterial(opts = {}) {
  const {
    color = 0xffffff,
    // Diffuse texture. The character models never use one (they carry their
    // values in vertex colours), but the environment surfaces are all
    // canvas-textured, and without this passthrough every one of them renders
    // as flat `color` — which is exactly what happened on the first pass.
    map = null,
    steps = [72, 150, 255],
    rim = 0.30,
    rimColor = 0xbfd9ff,
    rimStart = 0.70,
    gloss = 0.0,
    warm = 0x2a1d12,
    cool = 0x101828,
    vertexColors = true,
    transparent = false,
    opacity = 1,
    emissive = 0x000000,
    emissiveIntensity = 1
  } = opts;

  const mat = new THREE.MeshToonMaterial({
    color, map, gradientMap: bandTexture(steps), vertexColors, transparent, opacity,
    emissive, emissiveIntensity
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(rimColor) };
    shader.uniforms.uRimStrength = { value: rim };
    shader.uniforms.uRimStart = { value: rimStart };
    shader.uniforms.uGloss = { value: gloss };
    shader.uniforms.uWarmTint = { value: new THREE.Color(warm) };
    shader.uniforms.uCoolTint = { value: new THREE.Color(cool) };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>',
        '#include <common>\nuniform vec3 uRimColor;uniform float uRimStrength;uniform float uRimStart;uniform float uGloss;uniform vec3 uWarmTint;uniform vec3 uCoolTint;')
      .replace('#include <opaque_fragment>', RIM_CHUNK);
    mat.userData.shader = shader;
  };
  return mat;
}

// Archetype factories — consistent shading language across the roster.
export const MAT = {
  skin: (o = {}) => toonMaterial({ steps: [96, 176, 255], rim: 0.16, rimStart: 0.78, warm: 0x38221a, cool: 0x141c2c, ...o }),
  cloth: (o = {}) => toonMaterial({ steps: [64, 140, 255], rim: 0.26, rimStart: 0.70, warm: 0x2a1d12, cool: 0x0e1626, ...o }),
  hair: (o = {}) => toonMaterial({ steps: [70, 148, 255], rim: 0.42, rimStart: 0.66, gloss: 0.35, warm: 0x2a2016, cool: 0x121a30, ...o }),
  metal: (o = {}) => toonMaterial({ steps: [40, 120, 255], rim: 0.55, rimStart: 0.60, gloss: 0.8, warm: 0x1c1812, cool: 0x0c1220, ...o }),
  // ---- FUR ------------------------------------------------------------------
  // The fifth archetype, added for Panda, and it is a genuine shading response
  // rather than a hue — which is what this file's own opening paragraph demands
  // of an archetype and what the brief demands of his surface.
  //
  // THREE THINGS MAKE IT FUR, and each is measured against `cloth`, which is
  // what the whole rest of the roster is wearing:
  //
  //   FIVE BANDS, NOT THREE, and a HIGH FLOOR (100 against cloth's 64). A cel
  //   shader's hard terminator is exactly what makes a uniform read as fabric —
  //   one abrupt step from lit to unlit across a crease. Fur has no terminator:
  //   it is a mass of fibres at every angle at once, so the transition smears.
  //   Five steps at a raised floor is that smear, expressed in the one
  //   mechanism this shader has. The high floor also stops him going black in
  //   shadow, which real fur does not — it scatters.
  //
  //   A WIDE, EARLY RIM (rimStart 0.52 against cloth's 0.70, strength 0.54
  //   against 0.26). Light passes THROUGH the outer millimetre of fur and
  //   lights it from within, so the bright edge is a broad halo rather than the
  //   thin highlight you get off a sleeve. This is the single most visible
  //   difference at fighting distance and it is why he reads as a different
  //   surface from across the arena rather than only in a close-up.
  //
  //   NO GLOSS AT ALL (0.0 against hair's 0.35). Hair is the nearest existing
  //   archetype and it was the obvious thing to reuse, but hair has SHEEN — a
  //   tight view-dependent band — and that one term is precisely what would
  //   have made him look like a man in a costume made of Gojo's hair. Fur is
  //   matte. Removing the gloss is what separates the two.
  fur: (o = {}) => toonMaterial({
    steps: [100, 142, 182, 220, 255], rim: 0.54, rimStart: 0.52, gloss: 0.0,
    warm: 0x33261a, cool: 0x14192a, ...o
  }),
  // flat, unlit: anime face features (eyes, brows, mouth)
  flat: (o = {}) => new THREE.MeshBasicMaterial({ vertexColors: true, ...o })
};
