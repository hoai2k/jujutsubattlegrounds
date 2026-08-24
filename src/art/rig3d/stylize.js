// ANIME PASS — making an imported model look like it belongs in this game.
// ===========================================================================
// A .glb arrives with PBR materials baked for a renderer that is not this one:
// physically-lit, low contrast, desaturated next to a roster that is entirely
// hard-banded cel shading with a rim light and a heavy ink outline. Dropping
// it in unchanged reads as a photograph standing next to a drawing.
//
// So the imported model is re-shaded through THE GAME'S OWN toon material —
// the same `toonMaterial` every character uses, carrying the model's texture
// as its `map` — and given the same inverted-hull outline. Three dials sit on
// top, because a texture authored for PBR is usually a touch dark and flat
// once the lighting stops doing the work:
//
//   saturation  pushes the map toward its own hues (1 = untouched)
//   brightness  scales it (the banding does the rest)
//   contrast    pivots around mid grey, so shadows stay in the darkest band
//
// All three are injected into the fragment shader after the map is sampled, so
// they cost nothing and never touch the source texture.
import * as THREE from 'three';
import { toonMaterial } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';

export const TOON_DEFAULTS = {
  saturation: 1.6,
  brightness: 1.5,
  contrast: 1.05,
  // THE DARKEST BAND IS THE ONE THAT MATTERS. A PBR texture carries its own
  // shading, so multiplying it by a 34%-grey shadow band lands the whole
  // costume in near-black — which is exactly how the first pass looked next
  // to the procedural roster. Lifting the low band to 47% keeps the cel step
  // readable while letting the colour through.
  steps: [120, 196, 255],
  rim: 0.34,
  rimColor: 0xbfd9ff,
  rimStart: 0.68,
  outline: 0.011,
  outlineColor: 0x07080e
};

const GRADE = /* glsl */ `
  {
    vec3 c = diffuseColor.rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    c = (c - 0.5) * uContrast + 0.5;
    diffuseColor.rgb = clamp(c * uBrightness, 0.0, 1.0);
  }
`;

// Re-shade every mesh under `root`, and hang an outline hull off each.
// Returns a restore() that puts the original materials back — the bench
// toggles it, so it has to be reversible.
export function stylizeToon(root, opts = {}) {
  const o = { ...TOON_DEFAULTS, ...opts };
  const originals = [];
  const hulls = [];
  const targets = [];
  root.traverse(m => { if (m.isMesh || m.isSkinnedMesh) targets.push(m); });

  for (const mesh of targets) {
    if (mesh.name.endsWith('_outline')) continue;
    const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    originals.push({ mesh, material: mesh.material });

    const mat = toonMaterial({
      // the model's own texture and tint carry the character; the grade and
      // the banding are what make it read as drawn
      map: src?.map ?? null,
      color: src?.color?.getHex?.() ?? 0xffffff,
      vertexColors: !!mesh.geometry.getAttribute('color'),
      transparent: !!src?.transparent,
      opacity: src?.opacity ?? 1,
      side: src?.side ?? THREE.FrontSide,
      steps: o.steps, rim: o.rim, rimColor: o.rimColor, rimStart: o.rimStart
    });
    // ride on top of toonMaterial's own onBeforeCompile rather than replacing
    // it — the rim light is that hook, and clobbering it loses the rim
    const base = mat.onBeforeCompile;
    mat.onBeforeCompile = shader => {
      base?.(shader);
      shader.uniforms.uSaturation = { value: o.saturation };
      shader.uniforms.uBrightness = { value: o.brightness };
      shader.uniforms.uContrast = { value: o.contrast };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>',
          '#include <common>\nuniform float uSaturation;uniform float uBrightness;uniform float uContrast;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + GRADE);
      mat.userData.gradeShader = shader;
    };
    mat.userData.grade = o;
    mesh.material = mat;

    if (o.outline > 0.0001) {
      const hull = makeOutline(mesh, { color: o.outlineColor, thickness: o.outline });
      // the hull must sit beside the mesh in the SAME parent, or it inherits a
      // different transform than the thing it is outlining
      mesh.parent.add(hull);
      hulls.push(hull);
    }
  }

  return {
    hulls,
    restore() {
      for (const h of hulls) h.parent?.remove(h);
      for (const { mesh, material } of originals) {
        const m = mesh.material;
        mesh.material = material;
        if (Array.isArray(m)) m.forEach(x => x.dispose()); else m?.dispose();
      }
    },
    // live dial changes, no rebuild
    set(next) {
      Object.assign(o, next);
      for (const { mesh } of originals) {
        const sh = mesh.material?.userData?.gradeShader;
        if (!sh) continue;
        sh.uniforms.uSaturation.value = o.saturation;
        sh.uniforms.uBrightness.value = o.brightness;
        sh.uniforms.uContrast.value = o.contrast;
      }
    }
  };
}
