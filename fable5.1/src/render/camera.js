// FIGHT CAMERA — behind-the-player soft lock on the opponent, right-stick
// orbit that eases back, deck-following height, FOV punches, trauma shake,
// KO / domain / intro sweeps. Split-screen siblings are driven one-way.
import * as THREE from 'three';
import { damp, angleDamp, clamp, yawBetween } from '../core/math.js';

const MIN_LENS = 1.5;
const _anchor = new THREE.Vector3(), _dir = new THREE.Vector3();

export class FightCamera {
  constructor(camera, mode = 'follow') {
    this.cam = camera; this.mode = mode;
    this.yawOffset = 0; this.pitch = 0.20; this.dist = 4.8; this.distScale = 1;
    this.pos = new THREE.Vector3(0, 2.4, 8); this.look = new THREE.Vector3();
    this.baseFov = 48; this.fovKickV = 0; this.trauma = 0;
    this.cine = null; this._noise = Math.random() * 100;
    this._sharedSide = 1; this.links = []; this.bounds = null;
    this.locked = true; this.freeYaw = 0; this.yaw = 0;
    this.deckY = 0; this._deckInit = false;
    this.zoomBias = 0; this.zoomTarget = 0;   // director-driven push-in
    this.reducedMotion = false;
  }
  shake(t) { this.trauma = Math.min(1, this.trauma + t); for (const l of this.links) l.trauma = Math.min(1, l.trauma + t); }
  fovKick(deg) { this.fovKickV = Math.max(this.fovKickV, deg); for (const l of this.links) l.fovKickV = Math.max(l.fovKickV, deg); }
  cinematic(around, dur = 2.2, radius = 4.0, height = 1.8, opts = {}) { this.cine = { around: around.clone(), t: 0, dur, radius, height, ...opts }; for (const l of this.links) l.cine = { ...this.cine, around: around.clone() }; }
  pushIn(k, seconds = 0.6) { this.zoomTarget = k; this._zoomT = seconds; }
  _deck(pos, dt, ground) {
    const g = Number.isFinite(ground) ? ground : this.bounds ? this.bounds.floorAt(pos.x, pos.z, pos.y + 0.8) : pos.y;
    if (!this._deckInit) { this.deckY = g; this._deckInit = true; } else this.deckY = damp(this.deckY, g, 4.5, dt);
    return this.deckY;
  }
  update(dt, me, opp, input, others = []) {
    dt = Math.max(0, Math.min(0.1, dt));
    this._noise += dt * 26;
    this.trauma = Math.max(0, this.trauma - dt * 1.9);
    this.fovKickV = damp(this.fovKickV, 0, 7, dt);
    if (this._zoomT > 0) { this._zoomT -= dt; if (this._zoomT <= 0) this.zoomTarget = 0; }
    this.zoomBias = damp(this.zoomBias, this.zoomTarget, 5, dt);
    const cam = this.cam;
    if (this.cine) {
      const c = this.cine; c.t += dt;
      const k = clamp(c.t / c.dur, 0, 1);
      const a = (c.startAngle ?? 0) + k * (c.sweep ?? 1.4);
      const r = c.radius * (1 - k * (c.closeIn ?? 0.25));
      const p = new THREE.Vector3(c.around.x + Math.sin(a) * r, c.around.y + c.height - k * (c.drop ?? 0.4), c.around.z + Math.cos(a) * r);
      this.pos.lerp(p, 1 - Math.exp(-6 * dt));
      this.look.lerp(new THREE.Vector3(c.around.x, c.around.y + (c.lookY ?? 1.1), c.around.z), 1 - Math.exp(-6 * dt));
      cam.position.copy(this.pos); cam.lookAt(this.look);
      cam.fov = damp(cam.fov, (c.fov ?? 40) + this.fovKickV, 6, dt); cam.updateProjectionMatrix();
      if (c.t >= c.dur + (c.hold ?? 0.4)) this.cine = null;
      this._applyShake(dt);
      return;
    }
    if (input && this.locked) { this.yawOffset += input.cam.x * 2.6 * dt; this.pitch = clamp(this.pitch - input.cam.y * 1.4 * dt, 0.0, 0.7); }
    if (input && !this.locked) { this.freeYaw -= input.cam.x * 2.6 * dt; this.pitch = clamp(this.pitch - input.cam.y * 1.4 * dt, -0.2, 0.7); }
    if (!input || Math.abs(input.cam.x) < 0.1) { this.yawOffset = damp(this.yawOffset, 0, 1.6, dt); this.pitch = damp(this.pitch, 0.20, 1.2, dt); }
    const deck = this._deck(me.pos, dt, me.groundY);
    let yaw, lookP, dist;
    if (this.mode === 'shared' && opp) {
      // LOCAL VS broadcast: side-on to the fight line, framing both bodies
      const mid = me.pos.clone().add(opp.pos).multiplyScalar(0.5);
      const line = yawBetween(me.pos, opp.pos);
      const sep = Math.hypot(me.pos.x - opp.pos.x, me.pos.z - opp.pos.z);
      const side = Math.sin(line - this.yaw) >= 0 ? 1 : -1;
      if (Math.abs(Math.sin(line - this.yaw)) > 0.25) this._sharedSide = side;
      yaw = line + this._sharedSide * Math.PI / 2 + this.yawOffset;
      dist = clamp(3.6 + sep * 0.85, 4.2, 12) * this.distScale;
      lookP = mid.setY(deck + 1.15 + Math.max(0, (me.pos.y + opp.pos.y) / 2 - deck) * 0.5);
    } else if (this.locked && opp) {
      const line = yawBetween(opp.pos, me.pos);   // from opponent through me
      yaw = line + this.yawOffset;
      const sep = Math.hypot(me.pos.x - opp.pos.x, me.pos.z - opp.pos.z);
      dist = clamp(this.dist + sep * 0.22, 3.6, 8.5) * this.distScale * (1 - this.zoomBias * 0.35);
      const aimY = deck + 1.25 + clamp(opp.pos.y - deck, 0, 1.6) * 0.35;
      lookP = me.pos.clone().lerp(opp.pos, 0.42 - this.zoomBias * 0.2).setY(aimY);
    } else {
      yaw = this.freeYaw + (this._freeInit ? 0 : (this._freeInit = true, this.freeYaw = me.facing + Math.PI, this.freeYaw));
      dist = this.dist * this.distScale; lookP = me.pos.clone().setY(deck + 1.2);
    }
    this.yaw = this.locked ? angleDamp(this.yaw, yaw, 5.5, dt) : yaw;
    const h = Math.sin(this.pitch) * dist;
    const target = new THREE.Vector3(lookP.x + Math.sin(this.yaw) * Math.cos(this.pitch) * dist, lookP.y + h + 0.35, lookP.z + Math.cos(this.yaw) * Math.cos(this.pitch) * dist);
    // never below the deck, never inside a wall (cheap: pull in along the ray)
    target.y = Math.max(target.y, deck + 0.55);
    if (this.bounds?.raySweep) { const d = this.bounds.raySweep(lookP, target, 0.3); if (d < 1) target.copy(lookP.clone().lerp(target, Math.max(d, MIN_LENS / dist))); }
    this.pos.lerp(target, 1 - Math.exp(-(this._snap ? 60 : 9) * dt)); this._snap = false;
    this.look.lerp(lookP, 1 - Math.exp(-12 * dt));
    cam.position.copy(this.pos); cam.lookAt(this.look);
    cam.fov = damp(cam.fov, this.baseFov + this.fovKickV + this.zoomBias * -6, 8, dt); cam.updateProjectionMatrix();
    this._applyShake(dt);
    for (const l of this.links) l.reducedMotion = this.reducedMotion;
  }
  _applyShake(dt) {
    if (this.trauma <= 0 || this.reducedMotion) return;
    const s = this.trauma * this.trauma;
    const n = this._noise;
    this.cam.position.x += Math.sin(n * 1.7) * 0.12 * s; this.cam.position.y += Math.sin(n * 2.3 + 1) * 0.10 * s;
    this.cam.rotation.z += Math.sin(n * 2.9) * 0.02 * s;
  }
  snap() { this._snap = true; }
  reset(me, opp) { this._deckInit = false; this.cine = null; this.trauma = 0; if (opp) this.yaw = yawBetween(opp.pos, me.pos); this._snap = true; this.yawOffset = 0; this.pitch = 0.2; }
}
