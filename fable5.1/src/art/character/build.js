// THE ASSEMBLER. spec -> CharacterModel. Order: materials, body, features,
// hair, garments (in spec order), then finalize: merge slots into skinned
// meshes, outline hulls, spring chains, props.
import * as THREE from 'three';
import { buildBody } from './body.js';
import { addHair } from './hair.js';
import { addGarment } from './garments.js';
import { addFeature } from './features.js';
import { archetype, flatMaterial } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { SpringChain } from '../springs.js';
import { DEG } from '../../core/math.js';

const glowCache = new Map();
function glowMaterial() {
  if (!glowCache.has('g')) {
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    m.color.setRGB(1.9, 1.9, 1.9);
    glowCache.set('g', m);
  }
  return glowCache.get('g');
}

export function materialsFor(palette = {}) {
  const rimColor = palette.rim ?? 0xbfd9ff;
  const vc = { vertexColors: true };
  return {
    skin: archetype('skin', { rimColor, ...vc }),
    cloth: archetype('cloth', { rimColor, ...vc }),
    hair: archetype('hair', { rimColor: palette.hairRim ?? rimColor, ...vc }),
    metal: archetype('metal', { rimColor: palette.metalRim ?? 0xdfe8ff, ...vc }),
    fur: archetype('fur', { rimColor: palette.furRim ?? 0xfff4e2, ...vc }),
    leather: archetype('leather', { rimColor, ...vc }),
    stone: archetype('stone', { rimColor, ...vc }),
    flat: flatMaterial(),
    glow: glowMaterial()
  };
}

export class CharacterModel {
  constructor(ctx, built) {
    this.id = ctx.spec.id;
    this.spec = ctx.spec;
    this.group = ctx.group;
    this.bones = ctx.rig.bones;
    this.boneList = ctx.rig.boneList;
    this.skeleton = built.skeleton;
    this.meshes = built.meshes;
    this.springs = built.springs;
    this.props = built.props;
    this.palette = { accent: 0xffffff, energy: 0xffffff, ...(ctx.spec.palette || {}) };
    this.H = ctx.spec.height ?? 1.8;
    this.m = ctx.m;
    this.materials = ctx.materials;
    this.time = 0;
    this.springsOn = true;
  }
  update(dt) { this.time += dt; if (this.springsOn) for (const s of this.springs) s.update(dt, this.time); }
  resetSprings() { for (const s of this.springs) s.reset(); }
  getBone(n) { return this.bones.get(n); }
  attachProp(name, slotKey) {
    const p = this.props.get(name);
    if (!p) return;
    const at = p.attachments[slotKey];
    p.slot = slotKey;
    if (!at) { p.node.visible = false; return; }
    this.bones.get(at.bone).add(p.node);
    p.node.position.fromArray(at.pos || [0, 0, 0]);
    p.node.rotation.set((at.rot?.[0] || 0) * DEG, (at.rot?.[1] || 0) * DEG, (at.rot?.[2] || 0) * DEG);
    p.node.visible = true;
  }
  setVisible(v) { this.group.visible = v; }
  // energy glow on every toon material (charged, awakened, domain cast)
  setEnergy(k, color) {
    for (const slot of ['skin', 'cloth', 'hair', 'fur', 'leather', 'stone']) {
      const u = this.materials[slot]?.userData.u; if (!u) continue;
      u.uEnergy.value = k; if (color) u.uEnergyColor.value.set(color);
    }
  }
  dispose() { for (const m of Object.values(this.meshes)) m.geometry.dispose(); }
  // Hooks the legacy combat runtime calls on the old hand-built models. The
  // described models answer the ones that have a visual meaning here; the
  // rest are accepted and ignored so ported systems never branch on them.
  setSubmerged(k) { this.group.visible = k < 0.95; this.group.position.y = -k * 1.2; }
  projectionStep() {}
  setStance() {} setMask() {} setSukuna(on) { this.setEnergy(on ? 0.6 : 0, 0xff2f45); } setRedScale(on) { this.setEnergy(on ? 0.4 : 0, 0xd0202c); }
  setOverheat(on) { this.setEnergy(on ? 0.4 : 0, 0xff6a2a); } setMaw() {} setCharge(tier) { this.setEnergy(Math.min(0.5, (tier || 0) * 0.15), 0xa8e0ff); } setAllCores() {}
  projectionClear() {} setWings() {} setStrain() {} setStock() {} setStage() {} setStable() {} setMarks() {} setJackpot(on) { this.setEnergy(on ? 0.5 : 0, 0xffd040); }
  setGrowth() {} setCollar() {} setAmber(on) { this.setEnergy(on ? 0.5 : 0, 0xa8e8ff); } clearStrain() {} setSeal() {} spinWheel() {} lockWheel() {} setWeapon() {} setMass() {} setProjectionStance() {} projectionAttach() {}
}

export function buildCharacter(spec) {
  const ctx = buildBody(spec);
  // per-character materials: the archetype cache keys on the palette, so two
  // characters with the same rim share programs and materials
  ctx.materials = materialsFor(spec.palette);
  ctx.outline = { color: spec.palette?.outline ?? 0x07080e, thickness: spec.outline ?? 0.0125 };
  for (const f of spec.features || []) addFeature(ctx, f);
  addHair(ctx, spec.hair);
  for (const g of spec.outfit || []) addGarment(ctx, g);
  return finalize(ctx, spec);
}

function finalize(ctx, spec) {
  const { rig, bag, group } = ctx;
  group.add(rig.root);
  rig.root.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(rig.boneList);
  const meshes = bag.buildMeshes(s => ctx.materials[s] || ctx.materials.cloth, skeleton, group, rig.bones);
  const oth = ctx.outline.thickness;
  for (const slot of ['skin', 'cloth', 'hair', 'fur', 'leather', 'stone', 'metal']) {
    if (!meshes[slot]) continue;
    const t = slot === 'hair' ? oth * 1.2 : slot === 'metal' ? oth * 0.7 : oth;
    group.add(makeOutline(meshes[slot], { color: ctx.outline.color, thickness: t }));
  }
  const springs = ctx.springs.map(def => new SpringChain(rig.bones.get(def.bone), def));
  const props = new Map();
  for (const [name, def] of Object.entries(ctx.props || {})) props.set(name, { node: def.node, attachments: def.attachments, slot: null });
  const model = new CharacterModel(ctx, { skeleton, meshes, springs, props });
  for (const [name, p] of props) model.attachProp(name, ctx.props[name].default || Object.keys(p.attachments)[0]);
  return model;
}
