// THE SUMMON RITUAL — 布瑠部 由良由良
//
// Megumi interrupts his own Domain Expansion cast to call the one shikigami
// that cannot be summoned with a hand sign alone. This file is the whole
// cutscene: its own clock, its own camera, its own shot list, its own sound,
// and its own overlay. It does not use the gameplay camera at any point.
//
// STRUCTURE. `BEATS` below is the timeline in seconds and it is the single
// source of truth — the shot list, the audio cues, the subtitles and the
// emergence curve all read their times out of it, so re-timing the sequence is
// editing one object rather than hunting through the file.
//
// WHILE IT RUNS: match._logicTick is not called at all, so the opponent is
// frozen solid and cannot act. This is a cinematic, not a mixup.
import * as THREE from 'three';
import { Fighter } from '../combat/fighter.js';
import { makeSummon } from '../characters/index.js';
import { SIGN_TIMES, SIGN_NAMES, SIGN_COUNT } from '../art/anim/ritual.js';
import { v3, rand, clamp, smoothstep, yawBetween } from './mathutil.js';
import { makeGlowMat } from '../arena/arena.js';

// Once the player has watched it through once, a HOLD on the special button
// (B — see input/input.js) skips it. Never on the first viewing.
const SEEN_KEY = 'ca_ritual_seen';
const seenBefore = () => { try { return !!localStorage.getItem(SEEN_KEY); } catch (e) { return false; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { } };

const SIGN_START = 1.10;
export const BEATS = {
  // 1 — time slows, music cuts out, the camera pushes in from a low angle
  open: 0.00,
  signStart: SIGN_START,
  // 2 — the eight signs, accelerating. Absolute times.
  signs: SIGN_TIMES.map(t => SIGN_START + t),        // last lands at 4.00
  // 3 — the incantation, subtitled
  line1: SIGN_START + 2.00,                          // 3.10  布瑠部 由良由良
  line2: SIGN_START + 2.50,                          // 3.60  この宝をもって
  // the hard flash on the final sign, and the hold frame after it
  flash: SIGN_START + 2.90,                          // 4.00
  holdEnd: SIGN_START + 3.25,                        // 4.35
  // 4 — the call, then the shadow floods out and the gate opens
  call: 4.35,
  gate: 5.21,
  line3: 5.30,                                       // 八握剣異戒神将魔虚羅
  // the silence: the drone stops dead and nothing happens for a beat
  silence: 5.70,
  // 5 — THE WHEEL RISES FIRST, alone, and the shot holds on it
  wheel: 6.40,
  wheelHold: 8.00,
  // 6 — silhouette, then the full emergence with the camera tilting up past
  //     where it ought to stop
  silhouette: 8.00,
  rise: 9.00,
  // 7 — impact: ground crack, dust, bass, shake, the music slams back in
  impact: 10.15,
  // 8 — the held hero shot, then control
  hero: 10.15,
  end: 12.10
};

// The emergence curve, sampled by time. k=0 is fully below the floor; the
// wheel clears the ground at about k=0.09 and the head at about k=0.42, which
// is what lets the wheel be the only thing visible for a second and a half.
function emergeAt(t) {
  if (t < BEATS.wheel) return 0.045;
  if (t < BEATS.wheelHold) return 0.045 + smoothstep((t - BEATS.wheel) / (BEATS.wheelHold - BEATS.wheel)) * 0.115;
  if (t < BEATS.rise) return 0.16 + smoothstep((t - BEATS.silhouette) / (BEATS.rise - BEATS.silhouette)) * 0.34;
  if (t < BEATS.impact) return 0.50 + smoothstep((t - BEATS.rise) / (BEATS.impact - BEATS.rise)) * 0.50;
  return 1;
}

export class Ritual {
  constructor(match, uiRoot) {
    this.match = match;
    this.uiRoot = uiRoot;
    this.active = null;      // {caster, mah, t, ...}
    this.skipHold = 0;
    this.el = null;
  }

  // The gate. Available only while Megumi is actually mid-cast, only for a
  // config that declares the ritual, and only once per match.
  canStart(f) {
    return !this.active && !!f.cfg.ritual && !f.ritualUsed && f.alive;
  }

  // ---- start --------------------------------------------------------------
  begin(caster) {
    const m = this.match;
    caster.ritualUsed = true;

    // The domain cast is CONSUMED either way — the bar was already spent when
    // castDomain fired. Tear the pending domain down silently: this is not an
    // interrupt, so there is no interrupt backlash and no failure sting.
    if (m.domains.active && m.domains.active.caster === caster) {
      m.domainfx.hide();
      m.stage.setGrade(m.mapGrade || 'neutral');
      m.domains.active = null;
    }
    // Nothing is holding his shikigami up any more.
    m.shikigami.dismissAll(caster);

    // WHERE IT OPENS. Not under his feet: with the gate directly beneath him
    // he stands between the camera and the reveal, and the wheel-rises-first
    // beat ends up framing the back of his head. Two and a half metres forward
    // also means Mahoraga arrives BETWEEN Megumi and the opponent, which is
    // where he wants to be standing when control comes back.
    const fwd = caster.forward();
    const right = v3(fwd.z, 0, -fwd.x);
    const origin = caster.pos.clone().addScaledVector(fwd, 2.6).addScaledVector(right, 0.5).setY(0);
    // keep it inside the map — a wall two metres in front of him is normal
    m.arena.bounds?.clampXZ(origin, 1.2);

    // Build the body now so it can be revealed, and sink it under the floor.
    const mah = this._makeMahoraga(caster, origin);
    mah.model.setEmerge(0);
    mah.model.group.visible = true;
    m.root.add(mah.model.group);

    // the shadow gate: a spreading black disc with a burning rim
    const gate = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 48),
      new THREE.MeshBasicMaterial({ color: 0x04050a, transparent: true, opacity: 0 }));
    disc.rotation.x = -Math.PI / 2;
    const rimA = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 56), makeGlowMat(0xc6ac72, 0));
    const rimB = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.028, 6, 48), makeGlowMat(0x8fb6d8, 0));
    rimA.rotation.x = rimB.rotation.x = -Math.PI / 2;
    gate.add(disc, rimA, rimB);
    gate.position.copy(origin).setY(0.035);
    gate.visible = false;
    m.root.add(gate);

    this.active = {
      caster, mah, gate, disc, rimA, rimB,
      t: 0, origin,
      fwd, right,
      lastSign: -1, hold: 0, cut: 0, gateFx: 0, riseFx: 0,
      grade: m.mapGrade || 'neutral',
      skippable: seenBefore(), done: false, fired: {}
    };

    this._buildOverlay();
    m.sfx.stopDrone();
    m.sfx.stopWind();
    m.music?.duck(0.02, BEATS.impact + 0.4);
    m.sfx.ritualOpen();
    m.sfx.startRitualDrone();
    m.stage.setGrade('void');
    caster.vel.set(0, 0, 0);
    caster.activeHit = null;
    caster.move = null;
    caster.setState('castDomain', {});          // inert: no state logic runs
    caster.anim.play('idle', { fade: 0.18, restart: true });
    // freeze every other fighter mid-pose
    for (const f of m.fighters) {
      if (f === caster) continue;
      f.vel.set(0, 0, 0);
      f.activeHit = null;
    }
    return true;
  }

  _makeMahoraga(megumi, at) {
    const m = this.match;
    const c = makeSummon('mahoraga');
    const f = new Fighter({
      config: c.config, model: c.model, clips: c.clips,
      index: megumi.index, arenaRadius: m.arena.radius, bounds: m.arena.bounds,
      spawn: at.clone(), facing: megumi.facing
    });
    // ---- THE COST: Megumi's health carries over, untouched -----------------
    f.res.hp = megumi.res.hp;
    f.res.maxCE = 0;
    f.res.curCE = 0;
    f.lives = megumi.lives;
    f.maxLives = megumi.maxLives;
    f.summonedFrom = megumi;
    f.ritualUsed = true;
    f.setState('intro', {});
    f.anim.play('emerge', { fade: 0, restart: true });
    f.anim.speed = 0;                 // the director drives the clip by hand
    return f;
  }

  // ---- per-frame ----------------------------------------------------------
  // Runs on REAL frame time, not the logic tick: the cutscene owns its own
  // clock so hitstop, slow motion and the fixed 60 Hz step cannot touch it.
  update(dt) {
    const a = this.active;
    if (!a) return false;
    const m = this.match;

    // SKIP — a hold, not a tap, and only once you have seen it through
    if (a.skippable && !a.done) {
      const frames = m.input.frames;
      const held = frames.some(f => f && (f.copy || f.start));
      this.skipHold = held ? this.skipHold + dt : 0;
      this._el('.rit-skip').classList.toggle('on', true);
      this._el('.rit-skip i').style.width = Math.min(100, this.skipHold / 0.6 * 100) + '%';
      if (this.skipHold >= 0.6) { this._finish(); return false; }
    }

    // HOLD FRAMES. A real freeze: the clock stops, so the pose on screen is
    // genuinely held rather than eased through.
    if (a.hold > 0) {
      a.hold -= dt;
      this._render(a, 0);
      return true;
    }

    const prev = a.t;
    a.t += dt;
    const t = a.t;

    this._cues(a, prev, t);
    this._visuals(a, t, dt);
    this._render(a, dt);

    if (t >= BEATS.end) { this._finish(); return false; }
    return true;
  }

  // one-shot cues that fire the frame they are crossed
  _cues(a, prev, t) {
    const m = this.match;
    const crossed = x => prev < x && t >= x;

    // --- the eight signs -------------------------------------------------
    if (crossed(BEATS.signStart)) {
      a.caster.anim.play('ritualSigns', { fade: 0.05, restart: true });
      a.caster.anim.speed = 1;
    }
    for (let i = 0; i < SIGN_COUNT; i++) {
      if (!crossed(BEATS.signs[i])) continue;
      a.lastSign = i;
      a.cut = 1;                              // hard cut -> smear frame
      m.sfx.ritualSign(i, SIGN_COUNT);
      this._sign(i);
      // the rhythm accelerates, so the hold on each sign shortens with it
      if (i < SIGN_COUNT - 1) a.hold = 0.05 + (SIGN_COUNT - i) * 0.008;
    }

    // --- the incantation --------------------------------------------------
    if (crossed(BEATS.line1)) this._sub('布瑠部 由良由良', 'FURUBE  YURA YURA');
    if (crossed(BEATS.line2)) this._sub('この宝をもって', 'WITH THIS TREASURE, I SUMMON —');
    if (crossed(BEATS.line3)) {
      this._sub('八握剣異戒神将魔虚羅',
        'EIGHT-HANDLED SWORD DIVERGENT SILA DIVINE GENERAL — MAHORAGA', true);
    }

    // --- the hard flash on the final sign ---------------------------------
    if (crossed(BEATS.flash)) {
      m.stage.flash(1.0);
      m.sfx.ritualFlash();
      this._impact(0.22);
      a.hold = 0.32;                          // the biggest hold-frame in it
      this._el('.rit-signs').classList.remove('on');
    }

    // --- the call ---------------------------------------------------------
    if (crossed(BEATS.call)) {
      a.caster.anim.play('ritualCall', { fade: 0.08, restart: true });
      a.cut = 1;
      m.sfx.ritualCall();
    }

    // --- the gate opens ---------------------------------------------------
    if (crossed(BEATS.gate)) {
      a.gate.visible = true;
      m.sfx.shadowGate();
      m.cam.shake(0.5);
      a.cut = 1;
      for (let i = 0; i < 40; i++) {
        const ang = rand(0, Math.PI * 2);
        m.fx._spawn(a.origin.clone().add(v3(Math.cos(ang) * rand(0, 2), 0.05, Math.sin(ang) * rand(0, 2))), {
          color: i % 5 === 0 ? 0x8fb6d8 : 0x05060c, size: rand(0.4, 1.1), life: rand(0.5, 1.1),
          opacity: 0.85, vel: v3(Math.cos(ang) * rand(1, 4), rand(1, 5), Math.sin(ang) * rand(1, 4))
        });
      }
    }

    // --- THE SILENCE BEAT -------------------------------------------------
    if (crossed(BEATS.silence)) {
      m.sfx.stopRitualDrone();                // dead air. Nothing under it.
      a.cut = 1;
    }

    // --- the wheel comes up first -----------------------------------------
    if (crossed(BEATS.wheel)) {
      m.sfx.wheelRise();
      a.mah.model.spinWheel(0.28);            // slow, deliberate rotation
      a.cut = 1;
    }
    if (crossed(BEATS.silhouette)) {
      m.sfx.startRitualDrone(0.55);           // it comes back, lower
      a.cut = 1;
      a.caster.anim.play('ritualWatch', { fade: 0.2, restart: true });
    }
    if (crossed(BEATS.rise)) { a.cut = 1; m.sfx.mahoragaRise(); }

    // --- IMPACT -----------------------------------------------------------
    if (crossed(BEATS.impact)) {
      m.sfx.stopRitualDrone();
      m.sfx.mahoragaImpact();
      m.sfx.startDrone(26);                   // the sustained rumble under the hero shot
      m.music?.duck(1, 0.2);
      m.stage.flash(0.7);
      m.cam.shake(1.2);
      m.cam.fovKick(12);
      this._impact(0.16);
      a.hold = 0.14;
      a.mah.model.spinWheel(1.4);
      // the ground gives out under him
      const p = a.origin.clone();
      m.arena?.destruct?.damageAt(p.clone().setY(0.4), 6.0, 220, { kind: 'body' });
      m.arena?.splash?.(p.x, p.z, 3.2);
      for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2 + rand(-0.05, 0.05);
        const r = rand(1.2, 4.5);
        m.fx._spawn(p.clone().add(v3(Math.cos(ang) * r, 0.06, Math.sin(ang) * r)), {
          color: i % 4 === 0 ? 0xc6ac72 : 0x9a968c, size: rand(0.5, 1.6), life: rand(0.7, 1.6),
          opacity: 0.6, vel: v3(Math.cos(ang) * rand(4, 12), rand(1, 6), Math.sin(ang) * rand(4, 12)),
          gravity: 5
        });
      }
      m.fx._ring(p.clone().setY(0.06), 0xc6ac72, { size: 1.4, growRate: 34, life: 0.8 });
      m.fx._ring(p.clone().setY(0.06), 0xdfe6f2, { size: 0.9, growRate: 22, life: 0.6 });
      this._el('.rit-name').classList.add('on');
      this.match.stage.setGrade(a.grade);
    }
  }

  // continuous visual state
  _visuals(a, t, dt) {
    const m = this.match;
    // the gate grows, then holds under him
    if (a.gate.visible) {
      const g = clamp((t - BEATS.gate) / 1.1, 0, 1);
      const r = 0.5 + smoothstep(g) * 4.2;
      a.gate.scale.setScalar(r);
      a.disc.material.opacity = Math.min(1, g * 2.2);
      a.rimA.material.opacity = (0.9 - g * 0.35) * (t < BEATS.impact ? 1 : Math.max(0, 1 - (t - BEATS.impact)));
      a.rimB.material.opacity = a.rimA.material.opacity * 0.7;
      a.rimA.rotation.z += dt * 0.5;
      a.rimB.rotation.z -= dt * 0.8;
      // things coming up out of it
      a.gateFx -= dt;
      if (a.gateFx <= 0 && t < BEATS.impact) {
        a.gateFx = 0.05;
        const ang = rand(0, Math.PI * 2), rr = rand(0, r * 0.9);
        m.fx._spawn(a.origin.clone().add(v3(Math.cos(ang) * rr, 0.05, Math.sin(ang) * rr)), {
          color: Math.random() < 0.25 ? 0x8fb6d8 : 0x06070e, size: rand(0.3, 0.9),
          life: rand(0.4, 0.9), opacity: 0.7, vel: v3(0, rand(2, 7), 0)
        });
      }
    }
    // the emergence
    const k = emergeAt(t);
    a.mah.model.setEmerge(k);
    // his clip is scrubbed by the same curve, so the body unfolds exactly in
    // step with how much of it is above the floor
    const clip = a.mah.anim.current;
    if (clip) a.mah.anim.time = clamp((k - 0.045) / 0.955, 0, 1) * clip.dur;
    // dust pouring off him on the way up
    if (t > BEATS.silhouette && t < BEATS.impact) {
      a.riseFx -= dt;
      if (a.riseFx <= 0) {
        a.riseFx = 0.04;
        const ang = rand(0, Math.PI * 2);
        m.fx._spawn(a.origin.clone().add(v3(Math.cos(ang) * rand(0.5, 2.4), rand(0.1, 3.2), Math.sin(ang) * rand(0.5, 2.4))), {
          color: Math.random() < 0.3 ? 0x8fb6d8 : 0x0a0c14, size: rand(0.4, 1.2),
          life: rand(0.4, 0.9), opacity: 0.55, vel: v3(rand(-1, 1), rand(-2.5, -0.5), rand(-1, 1))
        });
      }
    }
    // the smear that lands on every hard cut, decaying fast
    a.cut = Math.max(0, a.cut - dt * 9);
    const dof = this._dofAt(t);
    this._el('.rit-dof').style.opacity = dof;
    this._el('.rit-smear').style.opacity = a.cut;
    // speed lines during the sign chain and again on the rise
    const speed = (t > BEATS.signs[3] && t < BEATS.flash) ? 0.75
      : (t > BEATS.rise && t < BEATS.impact) ? 0.5 : 0;
    this._el('.rit-speed').style.opacity = speed;
    // letterbox: in at the top, out over the last half second
    const bars = t < 0.4 ? t / 0.4 : t > BEATS.end - 0.5 ? Math.max(0, (BEATS.end - t) / 0.5) : 1;
    this.el.style.setProperty('--bar', (bars * 11) + 'vh');
  }

  // DOF is on for the close work and off for the wides
  _dofAt(t) {
    if (t < BEATS.signStart) return 0.15;
    if (t < BEATS.flash) return 0.95;          // every sign is a close-up
    if (t < BEATS.gate) return 0.4;
    if (t < BEATS.silhouette) return 0.7;      // the wheel, isolated
    return 0.1;                                // the reveal is a wide: all sharp
  }

  // ---- the camera ---------------------------------------------------------
  // Real cinematography: nine shots, hard cuts between them, and not one of
  // them is the gameplay camera. Low angles, close-ups on the hands and the
  // eyes, a dolly-in, and a crane that tilts up past where it should stop.
  _shot(a, t) {
    const c = a.caster;
    const o = a.origin, fwd = a.fwd, right = a.right;
    const bone = n => {
      const b = c.model.bones.get(n);
      return b ? b.getWorldPosition(new THREE.Vector3()) : c.pos.clone().add(v3(0, 1.2, 0));
    };
    const hands = () => bone('HandL').lerp(bone('HandR'), 0.5);
    const head = () => bone('Head');
    const at = (p, l, fov) => ({ pos: p, look: l, fov });

    // 1 — LOW DOLLY IN on Megumi. Starts wide and low and closes.
    if (t < BEATS.signStart) {
      const k = smoothstep(clamp(t / BEATS.signStart, 0, 1));
      const d = 4.4 - k * 1.9;
      return at(c.pos.clone().addScaledVector(fwd, d).addScaledVector(right, 0.9).setY(0.42 + k * 0.16),
        c.pos.clone().setY(1.28), 44 - k * 5);
    }

    // 2 — THE SIGNS. One shot per sign, hard-cut, all of them tight. The
    // pattern deliberately alternates hands / eyes / hands-from-below so the
    // chain never settles into a rhythm the eye can predict.
    if (t < BEATS.holdEnd) {
      const i = Math.max(0, a.lastSign);
      const h = hands(), hd = head();
      const k = smoothstep(clamp((t - BEATS.signs[i]) / 0.45, 0, 1));
      switch (i % 8) {
        case 0:  // hands, straight on
          return at(h.clone().addScaledVector(fwd, 1.35 - k * 0.16).addScaledVector(right, 0.14).setY(h.y + 0.06),
            h, 38);
        case 1:  // hands from his left, raking across
          return at(h.clone().addScaledVector(fwd, 0.92).addScaledVector(right, 1.20 - k * 0.16).setY(h.y + 0.22),
            h, 40);
        case 2:  // from BELOW the hands, looking up through them at his face
          return at(h.clone().addScaledVector(fwd, 1.15).setY(h.y - 0.62),
            h.clone().lerp(hd, 0.45), 42);
        case 3:  // THE EYES. Held on the treasure sign.
          return at(hd.clone().addScaledVector(fwd, 1.05 - k * 0.10).addScaledVector(right, -0.22).setY(hd.y + 0.02),
            hd, 34);
        case 4:  // over his right shoulder, down onto the hands
          return at(hd.clone().addScaledVector(fwd, -0.70).addScaledVector(right, -1.05).setY(hd.y + 0.42),
            h, 44);
        case 5:  // hands from his right, mirrored
          return at(h.clone().addScaledVector(fwd, 0.86).addScaledVector(right, -1.15 + k * 0.16).setY(h.y + 0.14),
            h, 40);
        case 6:  // ground level, looking up the length of him
          return at(c.pos.clone().addScaledVector(fwd, 2.05).addScaledVector(right, 0.5).setY(0.30),
            c.pos.clone().setY(1.40), 44);
        default: // the clap, dead on, pushing in
          return at(h.clone().addScaledVector(fwd, 1.25 - k * 0.20).setY(h.y + 0.04), h, 36);
      }
    }

    // 3 — THE CALL. Cut wide and LOW: he is suddenly very small in frame.
    if (t < BEATS.wheel) {
      const k = smoothstep(clamp((t - BEATS.holdEnd) / (BEATS.wheel - BEATS.holdEnd), 0, 1));
      const d = 6.6 + k * 1.4;
      const mid = c.pos.clone().lerp(o, 0.45);
      return at(mid.clone().addScaledVector(fwd, d).addScaledVector(right, -2.6).setY(0.40),
        mid.clone().setY(0.9 + k * 0.4), 48);
    }

    // 4 — THE WHEEL, ALONE. Camera on the deck, almost touching the floor,
    // looking straight at the gate. Nothing else is in frame.
    if (t < BEATS.silhouette) {
      // FRONT-ON, not side-on. The wheel is raked close to vertical on the
      // skull, so from the side it is a line; from in front it is a ring. And
      // because the gate opens 2.6 m ahead of Megumi, "in front of the gate"
      // now points AWAY from him — he is behind the camera, out of the shot.
      const k = smoothstep(clamp((t - BEATS.wheel) / (BEATS.silhouette - BEATS.wheel), 0, 1));
      return at(o.clone().addScaledVector(fwd, 3.6 - k * 0.9).addScaledVector(right, -0.7).setY(0.30),
        o.clone().setY(0.36 + k * 0.55), 32 - k * 3);
    }

    // 5 — SILHOUETTE, in profile, still low. The shoulders come out.
    if (t < BEATS.rise) {
      const k = smoothstep(clamp((t - BEATS.silhouette) / (BEATS.rise - BEATS.silhouette), 0, 1));
      return at(o.clone().addScaledVector(right, 7.6).addScaledVector(fwd, 1.6 + k * 0.8).setY(0.45 + k * 0.25),
        o.clone().setY(1.1 + k * 1.2), 40);
    }

    // 6 — THE CRANE. The camera drops to the floor and tilts UP, and it keeps
    // tilting past the point the shot has taught you to expect it to stop.
    if (t < BEATS.impact) {
      const k = smoothstep(clamp((t - BEATS.rise) / (BEATS.impact - BEATS.rise), 0, 1));
      const d = 6.2 + k * 2.4;
      // look target climbs from his knees to well ABOVE the wheel
      const ly = 0.6 + k * k * 5.6;
      return at(o.clone().addScaledVector(fwd, d).addScaledVector(right, 1.6 - k * 0.8).setY(0.34),
        o.clone().setY(ly), 44 + k * 8);
    }

    // 7 — THE HERO SHOT. Held, three-quarter, low, pushing in slowly. Megumi
    // is not in it: he is gone.
    const k = smoothstep(clamp((t - BEATS.hero) / (BEATS.end - BEATS.hero), 0, 1));
    const d = 10.4 - k * 1.5;
    return at(o.clone().addScaledVector(fwd, d * 0.86).addScaledVector(right, d * 0.5).setY(0.55 + k * 0.5),
      o.clone().setY(2.5 + k * 0.35), 46);
  }

  // ---- render -------------------------------------------------------------
  _render(a, dt) {
    const m = this.match;
    // advance the two models by hand — nothing else in the match is ticking
    a.caster.model.group.position.copy(a.caster.pos);
    a.caster.model.group.rotation.y = a.caster.facing;
    a.caster.anim.update(dt);
    a.caster.model.update(dt);
    a.caster.model.group.updateMatrixWorld(true);

    a.mah.model.group.position.copy(a.origin);
    a.mah.model.group.rotation.y = a.caster.facing;
    a.mah.model.update(dt);
    a.mah.pos.copy(a.origin);
    a.mah.prevPos.copy(a.origin);
    a.mah.facing = a.caster.facing;

    const s = this._shot(a, a.t);
    // every seat watches the same cut
    for (const c of m.cams) {
      c.cam.position.copy(s.pos);
      c.cam.lookAt(s.look);
      c.cam.fov = s.fov;
      c.cam.updateProjectionMatrix();
      // keep the follow camera's internal state in step so it does not whip
      // when the cutscene hands control back
      c.pos.copy(s.pos);
      c.look.copy(s.look);
    }
    m.fx.update(dt);
    m.arena.update(dt, m.stage.camera);
  }

  // ---- teardown -----------------------------------------------------------
  _finish() {
    const a = this.active;
    if (!a || a.done) return;
    a.done = true;
    const m = this.match;
    const megumi = a.caster, mah = a.mah;

    markSeen();
    m.root.remove(a.gate);
    a.disc.geometry.dispose();
    a.rimA.geometry.dispose();
    a.rimB.geometry.dispose();

    // ---- THE SWAP --------------------------------------------------------
    mah.model.setEmerge(1);
    mah.pos.copy(a.origin);
    mah.prevPos.copy(mah.pos);
    mah.facing = megumi.facing;
    mah.prevFacing = mah.facing;
    mah.anim.speed = 1;
    mah.setState('idle', { clip: 'idle' });

    const i = m.fighters.indexOf(megumi);
    if (i >= 0) m.fighters[i] = mah;
    if (m.p1 === megumi) m.p1 = mah;
    if (m.p2 === megumi) m.p2 = mah;
    m.root.remove(megumi.model.group);
    megumi.model.group.visible = false;
    // he is out of the match for the rest of the round, but he is not dead:
    // his stock and his health went with the thing standing where he was
    megumi.transformedInto = mah;

    // every system that holds a fighter reference
    for (const s of m.fx.shadows) if (s.fighter === megumi) s.fighter = mah;
    const aura = m.chargedAuras.get(megumi);
    if (aura) { m.fx.removeAura(aura); m.chargedAuras.delete(megumi); }
    m.hud.setFighters(m.fighters);
    m.hud.setAdaptation(mah);
    m.inputs.delete(megumi);
    if (m.cpu) m.cpu.retarget?.(m);
    m.setCameraMode('follow');

    // hand the camera back on the hero framing rather than snapping
    for (const c of m.cams) c.applySubject?.(mah);

    m.hud.cutin(mah, '八握剣異戒神将', 'MAHORAGA  魔虚羅');
    m.hud.message('MAHORAGA', 1.4);
    this._destroyOverlay();
    this.active = null;
    this.skipHold = 0;
    m.sfx.startWind();
  }

  abort() {
    if (!this.active) return;
    const a = this.active;
    this.match.root.remove(a.gate);
    this._finish();
  }

  // ---- overlay ------------------------------------------------------------
  _el(sel) { return this.el.querySelector(sel); }

  _buildOverlay() {
    const el = document.createElement('div');
    el.className = 'ritual';
    el.innerHTML = `
      <div class="rit-dof"></div>
      <div class="rit-smear"></div>
      <div class="rit-speed"></div>
      <div class="rit-impact"></div>
      <div class="rit-bar top"></div>
      <div class="rit-bar bot"></div>
      <div class="rit-signs"><b></b><i></i><u></u></div>
      <div class="rit-sub"><i></i><b></b></div>
      <div class="rit-name"><i>八握剣異戒神将魔虚羅</i><b>MAHORAGA</b></div>
      <div class="rit-skip">HOLD B TO SKIP<i></i></div>`;
    this.uiRoot.appendChild(el);
    this.el = el;
  }

  _destroyOverlay() { this.el?.remove(); this.el = null; }

  _sign(i) {
    const box = this._el('.rit-signs');
    const [jp, name] = SIGN_NAMES[i];
    box.querySelector('b').textContent = jp;
    box.querySelector('i').textContent = name;
    box.querySelector('u').textContent = (i + 1) + ' / ' + SIGN_COUNT;
    box.classList.remove('on');
    void box.offsetWidth;          // restart the CSS animation
    box.classList.add('on');
  }

  _sub(jp, en, big = false) {
    const box = this._el('.rit-sub');
    box.querySelector('i').textContent = jp;
    box.querySelector('b').textContent = en;
    box.classList.toggle('big', big);
    box.classList.remove('on');
    void box.offsetWidth;
    box.classList.add('on');
  }

  _impact(dur) {
    const f = this._el('.rit-impact');
    f.classList.remove('on');
    void f.offsetWidth;
    f.style.setProperty('--imp', dur + 's');
    f.classList.add('on');
  }
}
