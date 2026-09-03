// AMBIENT LIFT — making an imported model read in this game's lighting,
// without restyling it.
// ===========================================================================
// A .glb authored for an offline render arrives lit for a room that has an
// environment in it. Dropped into this scene — three lights, no envmap — the
// dark half of every surface falls to near-black and a navy uniform reads as
// a black one. The colour is in the texture; nothing is reaching it.
//
// The fix is deliberately small, and it is NOT a restyle: the materials stay
// the PBR materials the file shipped with, and two dials sit on top.
//
//   ambient     extra light on THIS MODEL ONLY, applied as emissive fed by
//               the model's own base texture. That last part is the whole
//               point — an ambient LIGHT adds grey and washes the hue out,
//               while adding a fraction of the surface's own colour lifts
//               the shadows and makes the blue MORE blue. It is also per
//               material rather than per scene, so two fighters do not
//               double each other's lighting the way two ambient lights in
//               one scene would.
//   saturation  a gentle push, because a texture baked for a neutral render
//               is usually a little grey for a fighting game.
//
// Both are cheap, both are reversible, and with `saturation: 1` no shader is
// touched at all. Nothing here bands, outlines, or otherwise imposes a look:
// an earlier pass re-shaded imports through the game's cel material and it
// was far too much — the model should look like itself, only lit.
import * as THREE from 'three';

export const LIFT_DEFAULTS = {
  ambient: 0.22,      // 0 = off; ~0.4 is as far as it goes before flattening
  saturation: 1.18,   // 1 = off (and then no shader is compiled)
  brightness: 1.0
};

const PARS = /* glsl */ `
uniform float uSat;
uniform float uBright;
vec3 liftGrade(vec3 c) {
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  return max(vec3(0.0), mix(vec3(l), c, uSat) * uBright);
}
`;

// Returns a handle with restore() and set(), so the workbench can toggle and
// dial it live. Materials are CLONED, never mutated, so restore is exact.
export function liftMaterials(root, opts = {}) {
  const o = { ...LIFT_DEFAULTS, ...opts };
  const swapped = [];
  const shaded = [];

  root.traverse(mesh => {
    if (!mesh.isMesh && !mesh.isSkinnedMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (!list[0]) return;
    swapped.push({ mesh, material: mesh.material });
    const next = list.map(src => {
      const m = src.clone();
      // the model's own colour, added back as light
      if (m.emissive) {
        m.emissiveMap = m.map ?? null;
        m.emissive.setHex(0xffffff);
        m.emissiveIntensity = o.ambient;
      }
      if (o.saturation !== 1 || o.brightness !== 1) {
        const base = m.onBeforeCompile;
        m.onBeforeCompile = shader => {
          base?.(shader);
          shader.uniforms.uSat = { value: o.saturation };
          shader.uniforms.uBright = { value: o.brightness };
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\n' + PARS)
            .replace('#include <map_fragment>',
              '#include <map_fragment>\ndiffuseColor.rgb = liftGrade(diffuseColor.rgb);')
            // the lift is fed by the same texture, so it grades with it
            .replace('#include <emissivemap_fragment>',
              '#include <emissivemap_fragment>\ntotalEmissiveRadiance = liftGrade(totalEmissiveRadiance);');
          m.userData.liftShader = shader;
        };
      }
      m.needsUpdate = true;
      shaded.push(m);
      return m;
    });
    mesh.material = Array.isArray(mesh.material) ? next : next[0];
  });

  return {
    opts: o,
    restore() {
      for (const { mesh, material } of swapped) {
        const cur = mesh.material;
        mesh.material = material;
        for (const m of [].concat(cur)) m?.dispose();
      }
    },
    // live: intensity needs no recompile, the grade rides its uniforms
    set(next) {
      Object.assign(o, next);
      for (const m of shaded) {
        if (m.emissive) m.emissiveIntensity = o.ambient;
        const sh = m.userData.liftShader;
        if (sh) { sh.uniforms.uSat.value = o.saturation; sh.uniforms.uBright.value = o.brightness; }
      }
    }
  };
}
