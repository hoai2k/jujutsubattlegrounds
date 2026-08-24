// Fight camera: behind-P1 soft lock on the opponent, right-stick orbit that
// eases back, FOV punch on heavy hits, trauma shake, cinematic sweeps.
import * as THREE from 'three';
import { damp, angleDamp, clamp, yawBetween } from './mathutil.js';

// scratch: the shot's anchor, rebuilt every frame (see the collision block)
const _anchor = new THREE.Vector3();

// HOW CLOSE THE LENS MAY EVER GET to the fighter it is following, in metres
// from his chest, at human scale. Everything that shortens the shot — the wall
// sweep, the floor clamp, the map edge — bottoms out here. Below about a metre
// and a half a 50-degree lens is inside the body and the frame is one shoulder,
// which is worse than any amount of wall clipping.
const MIN_LENS = 1.5;

// HOW FAR THE AIM MAY CLIMB toward a fighter who is higher up, in metres. See
// the locked branch: past this the camera is looking at a rooftop and its own
// fighter is off the bottom of the frame.
const AIM_RISE_CAP = 1.6;

// HOW FAR THE RIG WILL CLIMB to see over something, in metres, tried in order.
// Four metres is a high shot and about the limit before the frame stops
// reading as a chase camera and starts reading as a map.
const RISE_LADDER = [0.8, 1.6, 2.5, 3.4, 4.2];

// scratch for the along-axis cap and the rise search below
const _ray = new THREE.Vector3();
const _rel = new THREE.Vector3();
const _cand = new THREE.Vector3();

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
    // ---- THE LIFT ---------------------------------------------------------
    // How far the rig is currently riding ABOVE the shot its branch asked for,
    // so it can see over whatever is in the way. Eased rather than switched —
    // see the rise search in `update`.
    this.rise = 0;
  }

  // The surface the followed fighter is standing on, eased. Falls back to their
  // own feet when the map has no collision (the preview and the model viewer).
  //
  // `ground` IS THE FIGHTER'S OWN ANSWER, and it is the one to use when there
  // is one. The rig used to re-derive the floor with `floorAt(x, z, y + 0.8)`,
  // and that query is wrong in exactly the place a chase camera cannot afford
  // to be wrong: standing UNDER something. The 0.8 m of headroom is there so a
  // step up is picked up early, but it also means that jumping under a
  // mezzanine, an awning or a gallery lifts the ceiling of the query past the
  // slab overhead — so the slab becomes "the floor", the whole frame heaves up
  // by its height, and the rig's floor backstop below shoves the camera out on
  // TOP of the thing the fighter is standing under. combat/fighter.js already
  // tracks the real surface (`groundY`, swept and grounded-aware), so take it.
  _deck(pos, dt, ground) {
    const g = Number.isFinite(ground) ? ground
      : this.bounds ? this.bounds.floorAt(pos.x, pos.z, pos.y + 0.8) : pos.y;
    if (!this._deckInit) { this.deckY = g; this._deckInit = true; }
    else this.deckY = damp(this.deckY, g, 4.5, dt);
    return this.deckY;
  }

  // ---- IS THE OTHER FIGHTER IN THE WAY? -----------------------------------
  // The x-ray dissolves LEVEL geometry standing between the lens and the
  // subject, and deliberately never touches the roster (art/shaders/xray.js):
  // cutting a fighter would mean the subject's own body dissolving whenever the
  // camera came close. That leaves one occluder nothing handles — the OTHER
  // fighter — and at Mahoraga's 3.6 m of body it is an opaque wall two metres
  // wide, close to the lens, exactly where the fight is.
  //
  // It is rarer than it sounds and that is what makes moving the camera the
  // right answer rather than a twitchy one: the locked rig sits behind its own
  // fighter looking down the fight line, so the opponent is normally BEYOND the
  // subject, never between. It takes the orbit swung round, the free camera, or
  // the two shoving past each other to put a body in front of the lens — and
  // when that happens the shot is genuinely blind and worth moving for.
  //
  // Treated as an upright cylinder, and only counted when it sits between the
  // two ends rather than at either of them.
  _bodyBlocks(from, to, foePos, opts) {
    const h = opts?.foeH ?? 0;
    if (!(h > 0) || !foePos) return false;
    // SILHOUETTE WIDTH, not the collision radius. `size.bodyRadius` is held at
    // the human 0.36 for everybody on purpose (see characters/mahoraga.js) so
    // that navigation behaves the same at every scale, which makes it exactly
    // the wrong number here — Mahoraga does not occlude like a 0.36 m post.
    // The hurt capsule is the other candidate and it is too generous the other
    // way. Scale a normal shoulder width by how tall the thing actually is.
    const r = 0.42 * (h / 1.8);
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const len2 = dx * dx + dz * dz;
    if (len2 < 1e-6) return false;
    let t = ((foePos.x - from.x) * dx + (foePos.z - from.z) * dz) / len2;
    if (t <= 0.08 || t >= 0.94) return false;              // at one end, not between
    const cx = from.x + dx * t, cz = from.z + dz * t;
    if (Math.hypot(cx - foePos.x, cz - foePos.z) > r) return false;
    // and the sightline has to pass through the body's HEIGHT there, not over
    // his head or under his feet
    const y = from.y + dy * t;
    return y > foePos.y + 0.15 && y < foePos.y + h;
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

  // `opts` is what the match knows and the rig cannot work out for itself:
  //   ground  the surface the followed fighter's own physics settled on
  //   foeH    the other fighter's standing height, metres. Absent = do not
  //           test the other body at all (the preview and the model viewer).
  // Everything is optional; the preview and the model viewer pass none of it.
  update(dt, p1Pos, p2Pos, camInput, opts) {
    const subjGround = opts?.ground;
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

    // EVERY BRANCH BELOW WRITES A TARGET AND NOTHING ELSE. The rig's own
    // position is moved once, after the collision pass — see THE ORDER OF
    // OPERATIONS below for why that separation is load-bearing rather than
    // tidiness. `rate` is the branch's damping speed.
    let targetPos = new THREE.Vector3(), targetLook = new THREE.Vector3();
    let rate = 7;
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
      // keep the deck tracking through the sweep, or the floor backstop below
      // spends the whole shot working from wherever the fighter was standing
      // when the cinematic opened
      this._deck(p1Pos, dt, subjGround);
      rate = 6;
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
      const deck = this._deck(p1Pos.y >= p2Pos.y ? p1Pos : p2Pos, dt, p1Pos.y >= p2Pos.y ? subjGround : undefined);
      const h = deck + 1.7 + dist * 0.16 + Math.sin(this.pitch) * dist * 0.5;
      targetPos.set(
        mid.x + Math.sin(yaw) * dist * Math.cos(this.pitch * 0.6),
        h,
        mid.z + Math.cos(yaw) * dist * Math.cos(this.pitch * 0.6));
      targetLook.set(mid.x, deck + (Math.max(p1Pos.y, p2Pos.y) - deck) * 0.45 + 1.05, mid.z);
      rate = 6;
    } else if (this.mode === 'corridor') {
      // ---- THE SET'S CAMERA -------------------------------------------------
      // A fixed-bearing platformer camera, looking straight down the corridor
      // Takaba's ultimate builds (world +X). It exists because that ultimate is
      // the only thing in the game where the stick has to mean "toward the
      // exit" rather than "toward the opponent" — the contestant is running
      // AWAY from the other fighter, and the fight-line camera below would
      // point their forward input at exactly the wrong end of the room.
      //
      // The yaw is -PI/2 and that number is load-bearing: `_moveVec` turns a
      // stick-up into `v3(sin(camYaw), 0, cos(camYaw))` where `camYaw` is this
      // rig's `moveYaw`, i.e. `yaw + PI`. At yaw = -PI/2 that is exactly +X.
      const yaw = -Math.PI / 2;
      this.yaw = yaw;
      // PULLED WELL BACK, and that is tuned rather than taste: at the first
      // pass's 1.25x the contestant was standing on top of the door bank in
      // PICK A DOOR and could not see which one was lit, and could not see the
      // gaps ahead on DO NOT LOOK DOWN. A course you cannot read is not a
      // course. It is also raised and pitched down, because everything the
      // player has to judge in here is on the floor.
      const dist = this.dist * this.distScale * 1.75;
      const pitch = this.pitch + 0.22;
      const deck = this._deck(p1Pos, dt, subjGround);
      const h = deck + 2.9 + Math.sin(pitch) * dist * 0.9;
      targetPos.set(
        p1Pos.x + Math.sin(yaw) * dist * Math.cos(pitch),
        h,
        p1Pos.z + Math.cos(yaw) * dist * Math.cos(pitch) - 1.2);
      targetLook.set(p1Pos.x + 4.4, deck + 1.30, p1Pos.z * 0.45);
      rate = 6;
    } else if (this.locked) {
      const mid = p1Pos.clone().add(p2Pos).multiplyScalar(0.5);
      const yaw = yawBetween(p2Pos, p1Pos) + this.yawOffset; // behind P1 axis
      this.yaw = yaw;
      const sep = p1Pos.distanceTo(p2Pos);
      const dist = (this.dist + clamp(sep - 3, 0, 6) * 0.42) * this.distScale * this.subjDist;
      const pitch = this.pitch + this.subjPitch;
      const deck = this._deck(p1Pos, dt, subjGround);
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
      // AND THE AIM RISES WITH THE HIGHER FIGHTER — BUT NOT WITHOUT LIMIT.
      // The blend toward whoever is higher is what keeps an opponent on a crate
      // or halfway through a jump in the frame, and it used to be uncapped. A
      // ten-metre gap is not a jump, it is a roof: the aim climbed four metres,
      // the rig stayed on its own deck, and the fighter the camera BELONGS to
      // dropped off the bottom of the picture. Measured on Shinjuku, with the
      // opponent directly overhead: on screen at six metres of separation, off
      // it at ten, three screen-heights gone at twenty-four.
      //
      // Capped, the opponent is the one who leaves frame instead, which is the
      // right way round — an opponent that far above is not in the fight yet,
      // and the HUD still tracks them. The cap is stated as a height rather
      // than a ratio so it means the same thing on every map.
      targetLook.set(
        p1Pos.x + lx * c + lz * s,
        deck + Math.min((Math.max(p1Pos.y, p2Pos.y) - deck) * 0.4, AIM_RISE_CAP)
          + 1.15 + this.subjHeight,
        p1Pos.z - lx * s + lz * c);
      rate = 7;
    } else {
      // UNLOCKED: a plain trailing camera. The yaw is whatever the right stick
      // has wound it to, the frame is centred on its own fighter, and the
      // opponent is no longer part of the composition.
      const yaw = this.freeYaw;
      this.yaw = yaw;
      const dist = this.dist * this.distScale * this.subjDist;
      const pitch = this.pitch + this.subjPitch;
      const deck = this._deck(p1Pos, dt, subjGround);
      const h = deck + 1.55 + this.subjHeight * 0.62 + Math.sin(pitch) * dist * 0.8;
      targetPos.set(
        p1Pos.x + Math.sin(yaw) * dist * Math.cos(pitch) * 0.85,
        h,
        p1Pos.z + Math.cos(yaw) * dist * Math.cos(pitch) * 0.85);
      // FROM THE DECK, exactly as the locked branch above does it. This line
      // used to read `p1Pos.y * 0.4 + 1.3`, which measures the framing height
      // from the WORLD ORIGIN — the same bug the `deckY` block at the top of
      // this file was written to kill, left behind in the one branch that did
      // not exist yet when it was fixed. On flat ground the two agree and it
      // is invisible. Everywhere else it is not subtle: on a roof at 10 m the
      // rig aims 4 m below the fighter's feet and he leaves the top of the
      // frame, and in the sewer's sump at -4.2 m it aims above his head and he
      // leaves the bottom of it. Toggling the lock off anywhere but the ground
      // plane simply lost the character.
      targetLook.set(
        p1Pos.x,
        deck + (p1Pos.y - deck) * 0.4 + 1.15 + this.subjHeight,
        p1Pos.z);
      rate = 7;
    }

    // trauma shake (persists through hitstop on purpose)
    this.trauma = Math.max(0, this.trauma - dt * 2.2);
    const t2 = this.trauma * this.trauma;
    this._noise += dt * 40;
    const sx = (Math.sin(this._noise * 1.7) + Math.sin(this._noise * 3.1)) * 0.5;
    const sy = (Math.sin(this._noise * 2.3 + 5) + Math.sin(this._noise * 4.1)) * 0.5;

    // ---- THE ORDER OF OPERATIONS -------------------------------------------
    // COLLISION IS APPLIED TO THE TARGET, NOT TO THE RIG. It used to be the
    // other way round: every branch damped `this.pos` toward its target and the
    // sweep below then pulled `this.pos` in from wherever it had landed. That
    // is a RATCHET, and it is the single worst thing the camera did.
    //
    // The sweep runs from the fighter out to the position it is handed, so once
    // the rig has been pulled in a metre the NEXT frame sweeps that shorter ray
    // — still blocked, because the obstacle is still there — and multiplies the
    // remaining distance down again. The damping only claws back about a tenth
    // of the gap per frame, the clamp takes at least six per cent (and 82 per
    // cent when it bottoms out on `floorFrac`), so the two settle at a fixed
    // point far closer than either intended. Measured on the ten shipping maps
    // it converged to 0.71 m from the fighter's chest — the lens inside his
    // head, one shoulder filling the screen — anywhere a wall, a pillar or the
    // edge of the map sat behind him. Backing into a corner blanked the frame.
    //
    // Clamping the TARGET instead makes the fixed point the clamp's own answer,
    // because the target is rebuilt from the fighter's position every frame and
    // nothing accumulates. The rig then eases toward a spot that is already
    // clear.
    //
    // Sweep from the shot's anchor out to where the rig wants to be, pull the
    // target in to the first thing it would have entered, and keep it off the
    // floor the fighter is standing on.
    _anchor.set(p1Pos.x, p1Pos.y + 1.15, p1Pos.z);
    let clamped = false;
    const want = _anchor.distanceTo(targetPos);   // the shot's full length
    // THE RISE RUNS WITH OR WITHOUT MAP COLLISION. The sweep half of it needs
    // `bounds`; the other-body test does not, and gating the whole thing on a
    // map would mean the one occluder the x-ray cannot touch went unhandled
    // anywhere collision is absent.
    const swept = (from, to) => !this.bounds || this.bounds.sweepClear(from, to, p1Pos, 14) === 1;
    if (this.bounds || opts?.foeH) {
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
      let hit = this.bounds ? this.bounds.sweepClear(_anchor, targetPos, p1Pos, 14) : 1;
      if (hit < 1 || this._bodyBlocks(_anchor, targetPos, p2Pos, opts)) {
        // ---- GO OVER IT FIRST ---------------------------------------------
        // Pulling the lens toward the fighter is the last resort, not the
        // first: it is what makes a corner or a colonnade collapse the shot to
        // arm's length. The first thing to try is what a camera operator would
        // do, and what every third-person game with a wall behind the player
        // does — RAISE THE RIG AND LOOK DOWN OVER THE TOP. A high shot keeps
        // the full stand-off distance, keeps the fighter and the ground around
        // him in frame, and reads as a deliberate angle rather than a failure.
        //
        // Straight up rather than by re-pitching the orbit, because the bearing
        // is already correct — it is only the height that is wrong — and
        // because a vertical lift needs nothing from the branch that built the
        // shot, so it works the same for the locked rig, the free one and the
        // broadcast framing.
        //
        // The ladder is coarse and the RESULT is eased (`this.rise`), not the
        // choice: easing the height means walking past a pillar lifts and
        // settles the camera smoothly instead of stepping between rungs. The
        // search is bounded and only runs on a frame that is actually blocked,
        // so an open-field fight never pays for it.
        //
        // `_sameSpace` inside the sweep is what stops this from being a way
        // through the ceiling: in an interior, a lift that would poke up
        // through a gallery the fighter is not standing on comes back blocked,
        // so the ladder simply finds no rung and the pull-in takes over.
        let want = 0;
        for (const lift of RISE_LADDER) {
          _cand.set(targetPos.x, targetPos.y + lift, targetPos.z);
          if (swept(_anchor, _cand)
            && !this._bodyBlocks(_anchor, _cand, p2Pos, opts)) { want = lift; break; }
        }
        this.rise = damp(this.rise, want, 5, dt);
        targetPos.y += this.rise;
        if (this.bounds) hit = this.bounds.sweepClear(_anchor, targetPos, p1Pos, 14);
      } else {
        this.rise = damp(this.rise, 0, 3, dt);
        targetPos.y += this.rise;
      }
      if (hit < 1) {
        clamped = true;
        // THE PULL-IN FLOOR IS A DISTANCE, NOT A FRACTION. It used to be
        // `0.18 * subjDist` of whatever the ray happened to be, which is a
        // different answer every frame — 0.83 m behind a close opponent, 1.3 m
        // behind a far one — and all of them too close: at arm's length a
        // 50-degree lens is looking at a shoulder. Stated in metres it is one
        // number that means what it says, and it still scales with the subject
        // so a 3.6 m fighter keeps proportionally more room.
        const floorFrac = want > 1e-3 ? Math.min(0.9, (MIN_LENS * this.subjDist) / want) : 1;
        targetPos.lerpVectors(_anchor, targetPos, Math.max(floorFrac, hit * 0.94));
      }
      // AND A FLOOR UNDER THE RIG ITSELF, as a backstop. The ceiling on this
      // query used to be the camera's OWN height, which made it blind exactly
      // when it mattered: once the rig had dipped under a slab that slab was
      // above the query and stopped existing, so nothing ever pushed it back
      // out — which is how a camera ends up inside a river bank. It is measured
      // from the fighter's own deck now: everything he could step onto counts,
      // and a walkway well over his head does not, so a fight under one still
      // gets a camera under it.
      if (this.bounds) {
        const floor = this.bounds.floorAt(targetPos.x, targetPos.z, this.deckY + 2.6);
        if (targetPos.y < floor + 0.45) targetPos.y = floor + 0.45;
      }
    }

    // ---- A SHORTENED SHOT HAS TO RE-AIM ------------------------------------
    // The locked framing points at a spot on the fight line, roughly two metres
    // IN FRONT of the fighter, and that is right at full length: it is what
    // puts him at the near edge of frame with the opponent opposite. It stops
    // being right the moment the geometry shortens the shot. With the lens a
    // metre and a half behind him, a target two metres past him is most of a
    // right angle away — so the rig looks over his head, or past his hip, and
    // the frame ends up not containing him at all. The probe caught the chest
    // projecting eight screen-heights below the bottom of the picture with the
    // camera close enough to touch him.
    //
    // So as the shot is cut, walk the aim back onto the fighter himself. At
    // full length nothing changes; by the time the shot is down to about half
    // its length the rig is looking at him and nothing else, which is the only
    // composition available at that range and the one that keeps him on screen.
    //
    // NOT FOR THE COMPOSED SHOTS. A cinematic and THE SET's corridor camera are
    // both authored framings — one orbits a point that is not the fighter at
    // all, the other deliberately aims down the course rather than at the
    // contestant — and re-pointing either at the subject because a wall came
    // close would be overriding the shot, not saving it.
    if (want > 1e-3 && !this.cine && this.mode !== 'corridor') {
      const tight = clamp((want - _anchor.distanceTo(targetPos)) / (want * 0.55), 0, 1);
      if (tight > 0) {
        const e = tight * tight * (3 - 2 * tight);
        targetLook.x += (p1Pos.x - targetLook.x) * e;
        targetLook.z += (p1Pos.z - targetLook.z) * e;
        targetLook.y += (this.deckY + (p1Pos.y - this.deckY) * 0.4 + 1.15 + this.subjHeight - targetLook.y) * e;
      }
    }

    // ---- AND ONLY NOW DOES THE RIG MOVE ------------------------------------
    this.look.lerp(targetLook, 1 - Math.exp(-9 * dt));
    this.pos.x = damp(this.pos.x, targetPos.x, rate, dt);
    this.pos.y = damp(this.pos.y, targetPos.y, rate, dt);
    this.pos.z = damp(this.pos.z, targetPos.z, rate, dt);

    // PULL IN NOW, EASE OUT LATER. Damping is symmetric and collision is not:
    // running behind a pillar has to shorten the shot on the frame it happens,
    // while coming back out into the open should breathe. So when — and only
    // when — the geometry shortened the target, stop the rig from sitting
    // further out than the target does.
    //
    // ALONG THE SHOT'S OWN AXIS, not as a radius. A radius is the obvious
    // reading and it is wrong in the one case that matters: while the rig is
    // swinging round to the far side of the fighter — the fighters trading
    // places, a stick flick, the camera catching up after a throw — it is
    // briefly out in FRONT of him, and a radial cap re-projects it onto that
    // wrong bearing at the safe distance every frame, so the damping can never
    // walk it back round. It parks in front of the fighter looking away from
    // him, permanently. Projected onto the axis instead, being on the wrong
    // side gives a negative distance, the cap does not fire, and the swing
    // completes. Idempotent either way, so it cannot become the ratchet again.
    if (clamped) {
      _ray.subVectors(targetPos, _anchor);
      const safe = _ray.length();
      if (safe > 1e-4) {
        _ray.multiplyScalar(1 / safe);
        _rel.subVectors(this.pos, _anchor);
        const along = _rel.dot(_ray);
        if (along > safe) this.pos.addScaledVector(_ray, safe - along);
      }
    }

    // HARD STANDOFF, FOR EVERY SUBJECT. Whatever the geometry says, never sit
    // closer than this to the fighter being followed: shove the camera back out
    // along its own axis.
    //
    // This used to be gated on `subjDist > 1.001` — i.e. it protected Mahoraga
    // and nobody else, on the reasoning that at 1.0 it is 1.1 m and nothing on
    // the roster ever trips it. Nothing on the roster trips it because of its
    // OWN size; the geometry trips it constantly. A wall, a pillar or the edge
    // of the map behind a normal fighter is exactly the case the sweep above
    // answers by moving the lens toward him, and with the gate on there was
    // then no floor under how far it could go. Ungated it costs a clipped wall
    // corner in the tightest spots and buys a frame that always has a fighter
    // in it, which is not a close trade.
    //
    // AND ONLY WHEN THE SHOT ITSELF IS THIS SHORT. The rig is damped in a
    // straight line, so any move to the far side of the fighter goes through
    // him — the fight line flipping when the two swap ends, Boogie Woogie, a
    // spectator hand-off, the stick whipped round. Enforced unconditionally the
    // standoff is a wall around him that a straight-line move cannot get past:
    // the damping walks the rig inward, the shove puts it back on the side it
    // came from, and the two deadlock at exactly `minR` with the camera parked
    // in front of the fighter looking away from the fight, for good. (That is
    // live today for Mahoraga, the one subject the gate let through.) If the
    // TARGET is further out than `minR`, the rig is in transit and is allowed
    // to cross: a couple of frames clipping the model beats never arriving.
    {
      const minR = 1.1 * this.subjDist;
      const dx = this.pos.x - p1Pos.x, dz = this.pos.z - p1Pos.z;
      const d = Math.hypot(dx, dz);
      const tr = Math.hypot(targetPos.x - p1Pos.x, targetPos.z - p1Pos.z);
      if (d < minR && tr < minR + 1e-4) {
        const k = d > 1e-4 ? minR / d : 0;
        this.pos.x = d > 1e-4 ? p1Pos.x + dx * k : p1Pos.x;
        this.pos.z = d > 1e-4 ? p1Pos.z + dz * k : p1Pos.z + minR;
        this.pos.y = Math.max(this.pos.y, p1Pos.y + 1.0);
      }
    }

    // AND THE FLOOR UNDER THE RIG, LAST. The same backstop the target already
    // got, re-run on the position the rig actually ended up at. It has to be
    // last and it has to be here: the damping lags the target, the standoff
    // above shoves the rig sideways, and either one can leave it under a
    // surface the target itself cleared. Idempotent — it only ever raises y —
    // so unlike the sweep it cannot compound.
    if (this.bounds) {
      const floor = this.bounds.floorAt(this.pos.x, this.pos.z, this.deckY + 2.6);
      if (this.pos.y < floor + 0.45) this.pos.y = floor + 0.45;
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
