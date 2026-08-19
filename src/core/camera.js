// Fight camera: behind-P1 soft lock on the opponent, right-stick orbit that
// eases back, FOV punch on heavy hits, trauma shake, cinematic sweeps.
import * as THREE from 'three';
import { damp, angleDamp, clamp, yawBetween } from './mathutil.js';

// scratch: the shot's anchor, rebuilt every frame (see the collision block)
const _anchor = new THREE.Vector3();

export class FightCamera {
  constructor(camera, mode = 'follow') {
    this.cam = camera;
    this.mode = mode;       // 'follow' = behind P1 soft-lock; 'shared' = local-VS broadcast framing
    this.yawOffset = 0;
    this.pitch = 0.22;
    this.dist = 4.6;
    this.distScale = 1;   // split-screen halves are narrow — pull in a little
    this.pos = new THREE.Vector3(0, 2.4, 8);
    this.look = new THREE.Vector3();
    this.baseFov = 50;
    this.fovKickV = 0;
    this.trauma = 0;
    this.cine = null; // {around, t, dur, radius, height}
    this._noise = Math.random() * 100;
    this._sharedSide = 1; // sticky side of the fight line to avoid flips
    // Split screen: the P1 camera one-way drives its siblings so shakes, FOV
    // punches and cinematics land on every view from a single call site.
    this.links = [];
    this.bounds = null;     // map collision (set by Match) — null = open field
    // OPPONENT LOCK. Locked (default) frames the fight line and eases the
    // orbit back to behind-the-player. Unlocked, the right stick owns the yaw
    // outright and the camera simply trails whoever it belongs to.
    this.locked = true;
    this.freeYaw = 0;
    this.yaw = 0;          // the yaw actually used this frame (the rig's bearing)
    // ---- SUBJECT SCALE ----------------------------------------------------
    // A camera tuned for a 1.8 m fighter frames a 3.6 m one at the waist. When
    // a seat's fighter is replaced by something much larger (Mahoraga), these
    // pull the rig back, raise the look target and tilt the frame down. They
    // EASE rather than snap, so the transformation is a move, not a cut, and
    // they default to 1/0/0 so nothing on the roster is affected.
    this.subjDist = 1; this.subjDistTo = 1;
    this.subjHeight = 0; this.subjHeightTo = 0;
    this.subjPitch = 0; this.subjPitchTo = 0;
    // ---- DECK HEIGHT ------------------------------------------------------
    // The height the rig is measured FROM. It used to be the world origin: the
    // framing height was a bare `1.55 + sin(pitch) * dist`, with no term for
    // where the fighter actually was, so the camera sat at knee height above
    // y = 0 no matter what the fighter was standing on. That is invisible on a
    // flat arena and catastrophic on ten multi-level maps — a fight on the
    // Shinjuku overpass, the Shibuya concourse, a school roof or a bridge deck
    // was shot from UNDER the slab, looking up through it.
    //
    // It follows the FLOOR under the subject rather than the subject, so a jump
    // does not heave the whole frame up with it, and it eases, so stepping off
    // a ledge is a move rather than a cut.
    this.deckY = 0;
    this._deckInit = false;
  }

  // The surface the followed fighter is standing on, eased. Falls back to their
  // own feet when the map has no collision (the preview and the model viewer).
  _deck(pos, dt) {
    const g = this.bounds ? this.bounds.floorAt(pos.x, pos.z, pos.y + 0.8) : pos.y;
    if (!this._deckInit) { this.deckY = g; this._deckInit = true; }
    else this.deckY = damp(this.deckY, g, 4.5, dt);
    return this.deckY;
  }

  // Point the framing at whatever this seat is now following. Reads the
  // character's `size` block; a config without one resets to the human frame.
  applySubject(fighter) {
    const s = fighter?.cfg?.size;
    this.subjDistTo = s?.camDist ?? 1;
    this.subjHeightTo = s?.camHeight ?? 0;
    this.subjPitchTo = s?.camPitch ?? 0;
    for (const c of this.links) c.applySubject(fighter);
  }

  // THE HEADING THE PLAYER IS LOOKING ALONG — which is NOT `yaw`.
  //
  // `yaw` is the bearing of the CAMERA FROM its subject: the rig sits at
  // `pos + (sin yaw, cos yaw) * dist`, so the view runs the OTHER way, along
  // `yaw + PI`. Unlocked movement is camera-relative, and `_moveVec` treats the
  // yaw it is handed as a FORWARD heading — so feeding it `yaw` put "stick up"
  // straight back into the lens and flipped strafe with it. Both stick axes
  // came out reversed, which is exactly what a 180-degree error looks like.
  //
  // Anything that wants "the direction the player is facing on screen" reads
  // this, not `yaw`. `yaw` stays as it is because the rig placement, the orbit
  // and setLocked's carry-over all want the camera's own bearing.
  get moveYaw() { return this.yaw + Math.PI; }

  // legacy single-sibling accessor (2P split)
  get link() { return this.links[0] || null; }
  set link(c) { this.links = c ? [c] : []; }

  shake(amount) {
    this.trauma = Math.min(1.2, this.trauma + amount);
    for (const c of this.links) c.trauma = Math.min(1.2, c.trauma + amount);
  }
  fovKick(amount) {
    this.fovKickV = Math.min(14, this.fovKickV + amount);
    for (const c of this.links) c.fovKickV = Math.min(14, c.fovKickV + amount);
  }

  // Toggle without a snap: carry whatever yaw is on screen into the new mode.
  setLocked(on) {
    if (on === this.locked) return;
    if (!on) this.freeYaw = this.yaw;   // unlocking: keep the current framing
    else this.yawOffset = 0;            // locking: swing back to the fight line
    this.locked = on;
  }

  cinematic(aroundPos, dur = 1.8, radius = 3.2, height = 1.6) {
    this.cine = { around: aroundPos.clone(), t: 0, dur, radius, height };
    for (const c of this.links) c.cine = { around: aroundPos.clone(), t: 0, dur, radius: radius * 1.1, height };
  }

  // CANCEL a sweep that is still running. A cinematic normally expires on its
  // own `dur`, which is fine for a shot with a known length — but a shot held
  // open across an INTERACTIVE sequence has to be booked with a duration long
  // enough to cover the worst case (Deadly Sentencing's execution duel asks
  // for 30 s to cover a timer that usually resolves in five), and without a
  // cancel the camera keeps orbiting for the whole remainder once the sequence
  // ends. That is a soft-lock in everything but name: the player is alive and
  // accepting input while the view sails around them.
  //
  // Anything that opens a long cinematic MUST close it on every exit path.
  endCinematic() {
    this.cine = null;
    for (const c of this.links) c.cine = null;
  }

  update(dt, p1Pos, p2Pos, camInput) {
    // orbit input eases back to the soft-lock frame — but only while locked.
    // Unlocked, letting go of the stick must NOT drag the camera back to the
    // opponent, or the toggle does nothing.
    //
    // SIGN. `yaw` is the angle of the camera FROM its subject, so the view
    // heading is yaw + PI: winding yaw up swings the camera to the player's
    // right and therefore points the view LEFT. Stick-right must turn the view
    // right, so the input is subtracted, not added.
    const stickX = camInput?.x || 0;
    this.yawOffset = clamp(this.yawOffset - stickX * dt * 2.6, -Math.PI, Math.PI);
    this.freeYaw -= stickX * dt * 2.6;
    this.pitch = clamp(this.pitch + (camInput?.y || 0) * dt * 1.6, -0.05, 0.85);
    if (this.locked && Math.abs(stickX) < 0.05) {
      this.yawOffset = damp(this.yawOffset, 0, 1.6, dt);
    }

    // ease the subject framing (see applySubject) — ~0.9 s to settle
    this.subjDist = damp(this.subjDist, this.subjDistTo, 3.2, dt);
    this.subjHeight = damp(this.subjHeight, this.subjHeightTo, 3.2, dt);
    this.subjPitch = damp(this.subjPitch, this.subjPitchTo, 3.2, dt);

    let targetPos = new THREE.Vector3(), targetLook = new THREE.Vector3();
    if (this.cine) {
      const c = this.cine;
      c.t += dt;
      const a = c.t / c.dur;
      const ang = a * Math.PI * 0.9 + 0.6;
      targetPos.set(
        c.around.x + Math.sin(ang) * c.radius,
        c.around.y + c.height - a * 0.5,
        c.around.z + Math.cos(ang) * c.radius);
      targetLook.copy(c.around).setY(c.around.y + 1.2);
      if (c.t >= c.dur) this.cine = null;
      this.pos.lerp(targetPos, 1 - Math.exp(-6 * dt));
    } else if (this.mode === 'shared') {
      // broadcast framing: stay perpendicular to the fight line, keep both
      // fighters on screen, stick to one side of the line to avoid flips
      const mid = p1Pos.clone().add(p2Pos).multiplyScalar(0.5);
      const between = yawBetween(p1Pos, p2Pos);
      const sep = p1Pos.distanceTo(p2Pos);
      const c1 = between + Math.PI / 2, c2 = between - Math.PI / 2;
      const curYaw = Math.atan2(this.pos.x - mid.x, this.pos.z - mid.z);
      const dv = a => { let d = (a - curYaw) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return Math.abs(d); };
      const yaw = (dv(c1) <= dv(c2) ? c1 : c2) + this.yawOffset;
      const dist = clamp(3.4 + sep * 0.8, 5.2, 10.5);
      const deck = this._deck(p1Pos.y >= p2Pos.y ? p1Pos : p2Pos, dt);
      const h = deck + 1.7 + dist * 0.16 + Math.sin(this.pitch) * dist * 0.5;
      targetPos.set(
        mid.x + Math.sin(yaw) * dist * Math.cos(this.pitch * 0.6),
        h,
        mid.z + Math.cos(yaw) * dist * Math.cos(this.pitch * 0.6));
      targetLook.set(mid.x, deck + (Math.max(p1Pos.y, p2Pos.y) - deck) * 0.45 + 1.05, mid.z);
      this.pos.x = damp(this.pos.x, targetPos.x, 6, dt);
      this.pos.y = damp(this.pos.y, targetPos.y, 6, dt);
      this.pos.z = damp(this.pos.z, targetPos.z, 6, dt);
    } else if (this.locked) {
      const mid = p1Pos.clone().add(p2Pos).multiplyScalar(0.5);
      const yaw = yawBetween(p2Pos, p1Pos) + this.yawOffset; // behind P1 axis
      this.yaw = yaw;
      const sep = p1Pos.distanceTo(p2Pos);
      const dist = (this.dist + clamp(sep - 3, 0, 6) * 0.42) * this.distScale * this.subjDist;
      const pitch = this.pitch + this.subjPitch;
      const deck = this._deck(p1Pos, dt);
      const h = deck + 1.55 + this.subjHeight * 0.62 + Math.sin(pitch) * dist * 0.8;
      targetPos.set(
        p1Pos.x + Math.sin(yaw) * dist * Math.cos(pitch) * 0.85,
        h,
        p1Pos.z + Math.cos(yaw) * dist * Math.cos(pitch) * 0.85);
      // ORBIT AROUND THE PLAYER, NOT THE OPPONENT. The rig position already
      // swings by yawOffset; spin the look target around the player by the
      // same angle so the pair moves as one rigid body. The player therefore
      // holds its exact spot in the frame while the world turns past it, and
      // the opponent slides off to the side — "look to the right of the
      // target". Offset 0 leaves the classic fight-line framing untouched.
      const s = Math.sin(this.yawOffset), c = Math.cos(this.yawOffset);
      const lx = mid.x - p1Pos.x, lz = mid.z - p1Pos.z;
      targetLook.set(
        p1Pos.x + lx * c + lz * s,
        deck + (Math.max(p1Pos.y, p2Pos.y) - deck) * 0.4 + 1.15 + this.subjHeight,
        p1Pos.z - lx * s + lz * c);
      this.pos.x = damp(this.pos.x, targetPos.x, 7, dt);
      this.pos.y = damp(this.pos.y, targetPos.y, 7, dt);
      this.pos.z = damp(this.pos.z, targetPos.z, 7, dt);
    } else {
      // UNLOCKED: a plain trailing camera. The yaw is whatever the right stick
      // has wound it to, the frame is centred on its own fighter, and the
      // opponent is no longer part of the composition.
      const yaw = this.freeYaw;
      this.yaw = yaw;
      const dist = this.dist * this.distScale * this.subjDist;
      const pitch = this.pitch + this.subjPitch;
      const deck = this._deck(p1Pos, dt);
      const h = deck + 1.55 + this.subjHeight * 0.62 + Math.sin(pitch) * dist * 0.8;
      targetPos.set(
        p1Pos.x + Math.sin(yaw) * dist * Math.cos(pitch) * 0.85,
        h,
        p1Pos.z + Math.cos(yaw) * dist * Math.cos(pitch) * 0.85);
      targetLook.set(p1Pos.x, p1Pos.y * 0.4 + 1.3 + this.subjHeight, p1Pos.z);
      this.pos.x = damp(this.pos.x, targetPos.x, 7, dt);
      this.pos.y = damp(this.pos.y, targetPos.y, 7, dt);
      this.pos.z = damp(this.pos.z, targetPos.z, 7, dt);
    }
    this.look.lerp(targetLook, 1 - Math.exp(-9 * dt));

    // trauma shake (persists through hitstop on purpose)
    this.trauma = Math.max(0, this.trauma - dt * 2.2);
    const t2 = this.trauma * this.trauma;
    this._noise += dt * 40;
    const sx = (Math.sin(this._noise * 1.7) + Math.sin(this._noise * 3.1)) * 0.5;
    const sy = (Math.sin(this._noise * 2.3 + 5) + Math.sin(this._noise * 4.1)) * 0.5;

    // INTERIOR COLLISION. Interiors, corridors and the space under a mezzanine
    // will happily put a chase camera inside a wall. Sweep from the look
    // target out to the desired position and pull the camera in to the first
    // thing it would have entered; the small floor clamp stops it dropping
    // through the surface the fighter is standing on.
    if (this.bounds) {
      // FLOORS COUNT, not just walls (bounds.sweepClear). Most of what a camera
      // actually sinks into is not a wall: a river trench, a bank, the body of
      // a plateau. Under one of those the rig is inside the world, the screen
      // fills with the underside of the ground, and the only thing keeping the
      // fighter visible at all is the x-ray cutting a hole in it.
      //
      // THE ANCHOR IS THE FIGHTER, not the look target. The look target is a
      // framing device — with one fighter up on the plateau and one on the lawn
      // below it, the point it aims at is inside the cliff between them, and a
      // sweep measured from there starts inside a rock. The fighter is standing
      // on his own floor by definition, which makes him the one point in the
      // shot guaranteed to be in the space the camera is supposed to share.
      _anchor.set(p1Pos.x, p1Pos.y + 1.15, p1Pos.z);
      const hit = this.bounds.sweepClear(_anchor, this.pos, p1Pos, 14);
      if (hit < 1) {
        // The minimum pull-in scales with the subject: at 0.18 of a 9 m rig
        // the camera ends up INSIDE a 3.6 m fighter, which reads far worse
        // than clipping a wall corner. Big subject -> keep more distance and
        // let the geometry lose the argument.
        const floorFrac = Math.min(0.5, 0.18 * this.subjDist);
        this.pos.lerpVectors(_anchor, this.pos, Math.max(floorFrac, hit * 0.94));
      }
      // AND A FLOOR UNDER THE RIG ITSELF, as a backstop. The ceiling on this
      // query used to be the camera's OWN height, which made it blind exactly
      // when it mattered: once the rig had dipped under a slab that slab was
      // above the query and stopped existing, so nothing ever pushed it back
      // out — which is how a camera ends up inside a river bank. It is measured
      // from the fighter's own deck now: everything he could step onto counts,
      // and a walkway well over his head does not, so a fight under one still
      // gets a camera under it.
      const floor = this.bounds.floorAt(this.pos.x, this.pos.z, this.deckY + 2.6);
      if (this.pos.y < floor + 0.45) this.pos.y = floor + 0.45;
    }

    // HARD STANDOFF. The wall sweep can still pull the rig in far enough to
    // end up inside the subject when the subject is 3.6 m of body — a corner
    // behind him and a close opponent is enough. Whatever the geometry says,
    // never sit closer than this to the fighter being followed: shove the
    // camera back out along its own axis. Scales with the subject, so at 1.0
    // it is 1.1 m and nothing on the roster ever trips it.
    if (this.subjDist > 1.001) {
      const minR = 1.1 * this.subjDist;
      const dx = this.pos.x - p1Pos.x, dz = this.pos.z - p1Pos.z;
      const d = Math.hypot(dx, dz);
      if (d < minR) {
        const k = d > 1e-4 ? minR / d : 0;
        this.pos.x = d > 1e-4 ? p1Pos.x + dx * k : p1Pos.x;
        this.pos.z = d > 1e-4 ? p1Pos.z + dz * k : p1Pos.z + minR;
        this.pos.y = Math.max(this.pos.y, p1Pos.y + 1.0);
      }
    }

    this.cam.position.copy(this.pos);
    this.cam.position.x += sx * t2 * 0.22;
    this.cam.position.y += sy * t2 * 0.16;
    this.cam.lookAt(this.look);
    this.cam.rotation.z += sx * t2 * 0.02;

    this.fovKickV = damp(this.fovKickV, 0, 6, dt);
    this.cam.fov = this.baseFov + this.fovKickV;
    this.cam.updateProjectionMatrix();
  }
}
