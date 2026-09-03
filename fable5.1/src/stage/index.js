// MAP REGISTRY + arena build. Each map file exports DEF and build(kit).
import * as THREE from 'three';
import { MapBuilder } from './kit.js';
import { GRADES } from '../render/stage.js';
import { FX } from '../fx/index.js';
import * as ShibuyaCrossing from './maps/shibuya_crossing.js';
import * as ShibuyaUnderground from './maps/shibuya_underground.js';
import * as SendaiSchool from './maps/sendai_school.js';
import * as JujutsuHigh from './maps/jujutsu_high.js';
import * as Detention from './maps/detention.js';
import * as Shinjuku from './maps/shinjuku.js';
import * as KyotoGrounds from './maps/kyoto_grounds.js';
import * as StarTomb from './maps/star_tomb.js';
import * as YasohachiBridge from './maps/yasohachi_bridge.js';
import * as SewerLair from './maps/sewer_lair.js';

const MODULES = [ShibuyaUnderground, ShibuyaCrossing, SendaiSchool, JujutsuHigh, Detention, Shinjuku, KyotoGrounds, StarTomb, YasohachiBridge, SewerLair];
export const MAPS = {}; export const MAP_IDS = [];
for (const m of MODULES) { MAPS[m.DEF.id] = m; MAP_IDS.push(m.DEF.id); }
export const randomMapId = () => MAP_IDS[(Math.random() * MAP_IDS.length) | 0];

export function buildArena(id, stage) {
  const mod = MAPS[id] || MAPS[MAP_IDS[0]];
  const kit = new MapBuilder(mod.DEF);
  mod.build(kit);
  const arena = kit.finish();
  stage.scene.add(arena.group);
  // lighting identity
  const L = mod.DEF.lights || {};
  const s = stage.lights;
  if (L.key) { s.key.color.setHex(L.key.color); s.key.intensity = L.key.intensity; }
  if (L.rim) { s.rim.color.setHex(L.rim.color); s.rim.intensity = L.rim.intensity; s.rim.position.set(...(L.rim.pos || [-7, 7, -8])); }
  if (L.hemi) { s.hemi.color.setHex(L.hemi.sky); s.hemi.groundColor.setHex(L.hemi.ground); s.hemi.intensity = L.hemi.intensity; }
  if (L.fill) { s.fill.color.setHex(L.fill.color); s.fill.intensity = L.fill.intensity; }
  stage.scene.background = new THREE.Color(mod.DEF.background ?? 0x0b0e18);
  stage.scene.fog = mod.DEF.fog ? new THREE.Fog(mod.DEF.fog.color, mod.DEF.fog.near, mod.DEF.fog.far) : null;
  GRADES['map:' + mod.DEF.id] = mod.DEF.grade || GRADES.neutral;
  stage.setGrade('map:' + mod.DEF.id);
  arena.fx = new FX(stage);
  arena.def = mod.DEF;
  arena.update = (dt, t) => { for (const d of arena.dynamic) d.update?.(d.node, dt, t); };
  arena.dispose = () => { stage.scene.remove(arena.group); stage.scene.remove(arena.fx.root); arena.group.traverse(o => { o.geometry?.dispose?.(); }); stage.scene.fog = null; };
  return arena;
}
