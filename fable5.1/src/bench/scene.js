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
