// Shared bench scene: stage + floor + a turntable of built characters.
import * as THREE from 'three';
import { createStage } from '../render/stage.js';
import { archetype } from '../art/shaders/toon.js';
import { ContactShadow } from '../render/contact.js';
import { makeCharacter, ROSTER_IDS, allPicks } from '../roster/index.js';
import { AnimPlayer } from '../art/anim/player.js';

export function benchScene() {
  const stage = createStage();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), archetype('stone', { color: 0x5c6070 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  stage.scene.add(floor);
  stage.scene.background = new THREE.Color(0x232840);
  return stage;
}

export function placeCharacter(stage, pick, x = 0, z = 0, clip = 'idle') {
  const c = makeCharacter(pick);
  c.model.group.position.set(x, 0, z);
  stage.scene.add(c.model.group);
  const cs = new ContactShadow(0.5); stage.scene.add(cs.mesh);
  cs.update(c.model.group.position, 0);
  const anim = new AnimPlayer(c.model.bones, c.clips);
  anim.play(clip);
  return { ...c, anim, cs, pick };
}
export { ROSTER_IDS, allPicks };

// ---- previews used by the front end ------------------------------------------
import { archetype as _arch } from '../art/shaders/toon.js';
// A pair of fighters slowly orbiting behind the title.
export function benchSceneInto(stage, picks, { orbit = true } = {}) {
  const grp = new THREE.Group(); stage.scene.add(grp);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), _arch('stone', { color: 0x2a2e40 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; grp.add(floor);
  const chars = picks.map((p, i) => { const c = makeCharacter(p); c.model.group.position.set(i === 0 ? -1.1 : 1.1, 0, 0); c.model.group.rotation.y = i === 0 ? 0.6 : -0.6; grp.add(c.model.group); const anim = new AnimPlayer(c.model.bones, c.clips); anim.play('idle'); return { ...c, anim }; });
  stage.scene.background = new THREE.Color(0x07080d); stage.scene.fog = null;
  stage.focus.set(0, 1, 0);
  let t = 0;
  return {
    update(dt) { t += dt; for (const c of chars) { c.anim.update(dt); c.model.group.updateMatrixWorld(true); c.model.update(dt); } const a = orbit ? t * 0.12 : 0; stage.camera.position.set(Math.sin(a) * 5.2, 1.7, Math.cos(a) * 5.2); stage.camera.lookAt(0, 1.0, 0); stage.camera.fov = 40; stage.camera.updateProjectionMatrix(); },
    dispose() { stage.scene.remove(grp); for (const c of chars) c.model.dispose?.(); }
  };
}
// The character-select turntable: one pick at a time, swapped on focus.
export class PreviewStage {
  constructor(stage) { this.stage = stage; this.grp = new THREE.Group(); stage.scene.add(this.grp); const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 40), _arch('stone', { color: 0x262a3a })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.grp.add(floor); this.ch = null; this.pick = null; this.t = 0; stage.scene.background = new THREE.Color(0x07080d); stage.scene.fog = null; stage.focus.set(0, 1, 0); this.cache = new Map(); }
  show(pick) {
    if (this.ch) { this.grp.remove(this.ch.model.group); }
    this.pick = pick;
    let c = this.cache.get(pick);
    if (!c) { c = makeCharacter(pick); c.anim = new AnimPlayer(c.model.bones, c.clips); this.cache.set(pick, c); }
    c.model.group.position.set(0, 0, 0); c.model.group.rotation.y = 0.35; this.grp.add(c.model.group); this.ch = c; c.anim.play('idle', { restart: true }); this.t = 0;
  }
  play(clip) { if (this.ch && this.ch.anim.has(clip)) { this.ch.anim.play(clip, { restart: true }); this._back = 2.5; } }
  update(dt) {
    this.t += dt; if (!this.ch) return;
    this.ch.anim.update(dt); this.ch.model.group.updateMatrixWorld(true); this.ch.model.update(dt);
    if (this._back > 0) { this._back -= dt; if (this._back <= 0 || this.ch.anim.done) { this._back = 0; this.ch.anim.play('idle'); } }
    // the character stands on the RIGHT third of the frame, beside the hero panel
    const a = 0.35 + Math.sin(this.t * 0.4) * 0.35;
    this.stage.camera.position.set(Math.sin(a) * 4.4 - 1.6, 1.5, Math.cos(a) * 4.4); this.stage.camera.lookAt(-1.6, 1.05, 0); this.stage.camera.fov = 38; this.stage.camera.updateProjectionMatrix();
  }
  dispose() { this.stage.scene.remove(this.grp); for (const c of this.cache.values()) c.model.dispose?.(); this.cache.clear(); }
}
