// Map registry + the light-rig / grade application that makes each location
// feel like a different place.
//
// Adding a map is one file in ./maps that exports DEF (metadata + lighting +
// grade + fog) and build(quality) returning a MapBuilder; then one line here.
import * as THREE from 'three';
import { GRADES } from '../core/stage.js';
import * as ShibuyaUnderground from './maps/shibuya_underground.js';
import * as ShibuyaCrossing from './maps/shibuya_crossing.js';
import * as SendaiSchool from './maps/sendai_school.js';
import * as JujutsuHigh from './maps/jujutsu_high.js';
import * as Detention from './maps/detention.js';
import * as Shinjuku from './maps/shinjuku.js';
import * as KyotoGrounds from './maps/kyoto_grounds.js';
import * as StarTomb from './maps/star_tomb.js';
import * as YasohachiBridge from './maps/yasohachi_bridge.js';
import * as SewerLair from './maps/sewer_lair.js';

const MODULES = [
  ShibuyaUnderground, ShibuyaCrossing, SendaiSchool,
  JujutsuHigh, Detention, Shinjuku, KyotoGrounds,
  StarTomb, YasohachiBridge, SewerLair
];

export const MAPS = {};
export const MAP_IDS = [];
for (const m of MODULES) {
  MAPS[m.DEF.id] = { def: m.DEF, build: m.build };
  MAP_IDS.push(m.DEF.id);
}

export function randomMapId() {
  return MAP_IDS[(Math.random() * MAP_IDS.length) | 0];
}

// Build a map ready to drop into a scene. `ctx` carries the systems the
// destruction needs (fx / sfx / cam) — a preview can pass stubs.
export function buildMap(id, ctx = {}) {
  const entry = MAPS[id] || MAPS[MAP_IDS[0]];
  const builder = entry.build(ctx.quality || DEFAULT_QUALITY);
  const map = builder.finish(ctx);
  map.def = entry.def;
  return map;
}

// Per-map lighting identity. The stage owns one light rig; a map re-points it
// rather than adding its own, so we never end up with seven maps' worth of
// lights in the scene at once.
export function applyMapLighting(stage, map) {
  const rig = map.lightRig;
  const L = stage.lights;
  if (!rig) return;
  if (rig.key) {
    L.key.color.setHex(rig.key.color);
    L.key.intensity = rig.key.intensity;
    L.key.position.set(...rig.key.pos);
  }
  if (rig.rim) {
    L.rim.color.setHex(rig.rim.color);
    L.rim.intensity = rig.rim.intensity;
    L.rim.position.set(...rig.rim.pos);
  }
  if (rig.hemi) {
    L.hemi.color.setHex(rig.hemi.sky);
    L.hemi.groundColor.setHex(rig.hemi.ground);
    L.hemi.intensity = rig.hemi.intensity;
  }
}

// Each map's colour grade is registered under its own id so the existing
// setGrade(name) path works unchanged, and a domain can still override it.
export function registerMapGrade(map) {
  if (!map.grade) return 'neutral';
  const key = 'map:' + map.id;
  GRADES[key] = map.grade;
  return key;
}

// ---------------------------------------------------------------------------
// GRAPHICS QUALITY
// ---------------------------------------------------------------------------
// The brief's requirement: cut the *settings*, never the art. Every level
// builds the same geometry; what changes is destruction detail, how much
// debris persists, shadow/particle density and the post stack.
export const QUALITY_LEVELS = [
  {
    name: 'LOW', debrisBudget: 60, destructionDetail: 0, particleScale: 0.35,
    post: 0, pixelRatioCap: 1.0, detailRange: 26
  },
  {
    name: 'MEDIUM', debrisBudget: 140, destructionDetail: 0.6, particleScale: 0.7,
    post: 1, pixelRatioCap: 1.35, detailRange: 44
  },
  {
    name: 'HIGH', debrisBudget: 260, destructionDetail: 1, particleScale: 1,
    post: 2, pixelRatioCap: 1.75, detailRange: 70
  },
  {
    name: 'ULTRA', debrisBudget: 420, destructionDetail: 1.5, particleScale: 1.35,
    post: 2, pixelRatioCap: 2.0, detailRange: 110
  }
];
export const DEFAULT_QUALITY = QUALITY_LEVELS[2];

let _qi = 2;
export function currentQuality() { return QUALITY_LEVELS[_qi]; }
export function setQualityIndex(i) {
  _qi = Math.max(0, Math.min(QUALITY_LEVELS.length - 1, i));
  return QUALITY_LEVELS[_qi];
}
export function cycleQuality() {
  _qi = (_qi + 1) % QUALITY_LEVELS.length;
  return QUALITY_LEVELS[_qi];
}
