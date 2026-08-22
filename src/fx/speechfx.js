// CURSED SPEECH — THE FOUR-PART EFFECT.
//
// Every command Inumaki says is the same four beats, in the same order, and
// the whole point of building it this way is that the OPPONENT can read all
// four of them:
//
//   1. THE UTTERANCE   cursed energy gathers at his throat and collar. The
//                      collar drops, the markings on his cheeks light, the air
//                      in front of his mouth distorts. This runs for the whole
//                      utterance window, which is also the whole window in
//                      which he can be hit out of it.
//   2. THE WORD        the kanji leave his mouth as extruded geometry
//                      (fx/kanji.js) and cross the room, tumbling, dragging a
//                      wake of smaller characters behind them.
//   3. THE OVERLAY     simultaneously, ui/commandcard.js slams the word across
//                      the screen as a title card.
//   4. THE IMPACT      the glyphs reach the target, WRAP AROUND THEM AND
//                      CONSTRICT for half a beat — "the word has them" — and
//                      only then does the effect fire and the glyphs shatter.
//
// That half-beat in step 4 is the most important timing in the character. It
// is what makes a command read as a sentence being carried out rather than as
// a projectile connecting, and it is why the payload is fired from HERE, on
// arrival, rather than from the effect dispatcher on the cast frame.
//
// WHY THIS IS ITS OWN SYSTEM AND NOT METHODS ON FXSystem: a command in flight
// owns real scene objects with real lifetimes and a callback that has to fire
// at the right instant. That is the same shape DomainFX has, and it gets the
// same treatment — its own class, its own update, ticked from Match.
import * as THREE from 'three';
import { makeWord, makeGlyph, disposeWord } from './kanji.js';
import { v3, rand } from '../core/mathutil.js';

// The three phases of a word in flight, in seconds. Travel is computed from
// distance so a command fired at two metres and one fired at twelve both feel
// like the same move.
const SPEED = 26;            // m/s the glyphs cross the room at
const TRAVEL_MIN = 0.14;
const TRAVEL_MAX = 0.52;
export const CONSTRICT = 0.16;   // the half-beat before the effect fires
const SHATTER = 0.42;

export class SpeechFX {
  constructor(scene, camera, fx) {
    this.scene = scene;
    this.camera = camera;
    this.fx = fx;
    this.words = [];
    this.gathers = [];
  }

  // ---- 1. THE UTTERANCE ---------------------------------------------------
  // Called every frame of the utterance window with `k` running 0 -> 1, so the
  // build is continuous and a player watching him can judge how far through it
  // he is. `weight` scales everything: a light command is a flicker at the
  // collar, a heavy one is a visible gather the size of his head.
  //
  // Nothing here is a one-shot: interrupt him and it simply stops, which is
  // the correct read, because what the opponent should see is the gather
  // VANISHING rather than an explosion.
  utterance(fighter, k, color, weight = 'light') {
    const heavy = weight === 'heavy';
    const g = fighter.model.group;
    const throat = this._throatPoint(fighter);
    const fwd = v3(Math.sin(fighter.facing), 0, Math.cos(fighter.facing));
    // the gather: motes falling INWARD to the throat, denser as it builds
    const n = heavy ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (heavy ? 0.85 : 0.55) * (1.1 - k * 0.7);
      const from = throat.clone().add(v3(Math.cos(a) * r, rand(-0.25, 0.45), Math.sin(a) * r));
      const p = this.fx._spawn(from, {
        color: i === 0 ? 0xffffff : color,
        size: rand(0.05, 0.13) * (heavy ? 1.5 : 1),
        aspect: 0.6, life: 0.16 + k * 0.1,
        vel: throat.clone().sub(from).multiplyScalar(4.5 + k * 4)
      });
      p.mesh.material.opacity = 0.5 + k * 0.5;
    }
    // the distortion in front of the mouth — a thin ring, growing with the
    // build, pushed forward so it sits between him and the camera
    if (k > 0.25 && Math.random() < (heavy ? 0.5 : 0.28)) {
      this.fx._ring(throat.clone().addScaledVector(fwd, 0.34 + k * 0.2), color, {
        size: (heavy ? 0.16 : 0.10) * (0.6 + k), growRate: heavy ? 2.6 : 1.6,
        life: 0.16, flat: false
      });
    }
    // the collar itself. 0 -> 1 as the word builds; the model eases it.
    fighter.model.setCollar?.(Math.min(1, k * 1.4));
    fighter.model.setMarks?.(k > 0.2);
    // on the last beat the throat flares white — the frame the word is born
    if (k >= 0.98) {
      this.fx._ring(throat.clone(), 0xffffff, { size: 0.18, growRate: 9, life: 0.2, flat: false });
    }
    void g;
  }

  // ---- 2. THE WORD ---------------------------------------------------------
  // `onArrive` fires after the glyphs reach the target AND finish constricting,
  // which is where the gameplay payload lives.
  speak(caster, target, cmd, { scale = 0.62, onArrive = null, shake = 1 } = {}) {
    const from = this._throatPoint(caster);
    const to = this._chestPoint(target);
    const dist = from.distanceTo(to);
    const travel = Math.min(TRAVEL_MAX, Math.max(TRAVEL_MIN, dist / SPEED));
    const node = makeWord(cmd.kanji, {
      color: cmd.color, scale,
      // shallower than the first pass: at 0.22 the side walls were most of
      // what the camera saw and every glyph read as a brick
      depth: cmd.weight === 'heavy' ? 0.13 : 0.09,
      glow: cmd.weight === 'heavy' ? 1.15 : 0.95
    });
    node.position.copy(from);
    this.scene.add(node);
    // a light travelling with the word, so it actually illuminates the room it
    // crosses — this is most of why the effect survives a dark domain
    const light = new THREE.PointLight(cmd.color, cmd.weight === 'heavy' ? 6.5 : 3.4,
      cmd.weight === 'heavy' ? 9 : 6, 2);
    light.position.copy(from);
    this.scene.add(light);

    this.words.push({
      node, light, cmd, caster, target,
      from: from.clone(), to: to.clone(),
      phase: 'fly', t: 0, travel, shake,
      wakeT: 0, wake: [], onArrive, fired: false,
      // THE TUMBLE IS SMALL ON PURPOSE. The brief asks for "tumbling
      // slightly", and it has to stay slight: a word spinning at five radians
      // a second is a word nobody can read, and being able to read it is the
      // entire point of building the glyphs rather than throwing particles.
      tumble: 0,
      // per-glyph wobble amplitudes, signed so neighbours lean opposite ways
      rot: node.userData.glyphs.map(() => v3(rand(-1, 1), rand(-1, 1), rand(-1, 1)))
    });
    return this.words[this.words.length - 1];
  }

  // THE WHIFF. Nobody was in range, so the word flies out to the limit of that
  // command's reach and comes apart on empty air. It gets the full flight and
  // the full shatter deliberately: a command that was simply swallowed would
  // read as a dropped input, and the player needs to see that they said it and
  // it found nobody — including seeing HOW FAR it got, which is the range
  // number made visible.
  speakInto(caster, cmd, range) {
    const from = this._throatPoint(caster);
    const fw = v3(Math.sin(caster.facing), 0, Math.cos(caster.facing));
    const to = from.clone().addScaledVector(fw, range).setY(from.y + 0.4);
    const ghost = {
      alive: true, pos: to.clone(),
      model: { group: { position: to.clone() } },
      hurtBox: { center: 0, radius: 0 }
    };
    return this.speak(caster, ghost, cmd, { scale: 0.78, onArrive: null });
  }

  // ---------------------------------------------------------------------------
  // THE WORD FACES THE CAMERA, NOT THE TARGET
  // ---------------------------------------------------------------------------
  // The first version pointed each word along its flight path (`node.lookAt`),
  // which is what a projectile does and is exactly wrong here. The fight camera
  // sits behind or beside the caster, so a word aimed at the opponent was seen
  // edge-on or from behind, every single time — three extruded slabs crossing
  // the screen with no readable face on them. All that work tracing 潰 and it
  // was never once pointed at the player.
  //
  // So the glyphs YAW-BILLBOARD: they turn to face the camera about the
  // vertical axis only, which keeps them upright (a full billboard would tip
  // them and lose the sense that they are objects in the room) while
  // guaranteeing the word is legible from wherever the fight is being watched.
  // The per-glyph tumble stays, applied on top as a local wobble, so they still
  // read as physical things rather than as a decal pasted to the screen.
  _faceCamera(node, at) {
    const c = this.camera.position;
    node.rotation.set(0, Math.atan2(c.x - at.x, c.z - at.z), 0);
  }

  update(dt) {
    for (let i = this.words.length - 1; i >= 0; i--) {
      const w = this.words[i];
      w.t += dt;
      if (w.phase === 'fly') this._fly(w, dt);
      else if (w.phase === 'constrict') this._constrict(w, dt);
      else if (this._shatter(w, dt)) { this._retire(i); }
    }
    // the follow-through marks (cages, brands, the slam glyph, fragments) run
    // on the same clock — one `update` call from Match drives the whole system
    this.updateMarks(dt);
  }

  // ---- FLIGHT --------------------------------------------------------------
  _fly(w, dt) {
    const k = Math.min(1, w.t / w.travel);
    // THE TARGET IS RE-READ EVERY FRAME. A command chases: the opponent can
    // still be moving, and a word that flew to where they used to be would
    // make every command a whiff against anybody who walks. It arrives — the
    // dodge window is the UTTERANCE, not the flight.
    if (w.target?.alive) w.to.copy(this._chestPoint(w.target));
    const p = w.from.clone().lerp(w.to, k);
    // a shallow arc, so the word rises out of his mouth rather than sliding
    p.y += Math.sin(k * Math.PI) * 0.55;
    w.node.position.copy(p);
    w.light.position.copy(p);
    this._faceCamera(w.node, p);
    // The tumble is a WOBBLE around the readable pose, not a free spin: each
    // glyph oscillates a few degrees on its own phase. A word that rotates
    // through ninety degrees is a word nobody can read, and the whole reason
    // these are traced glyphs rather than particles is that they are read.
    w.tumble += dt;
    w.node.userData.glyphs.forEach((g, gi) => {
      const r = w.rot[gi];
      g.rotation.set(
        Math.sin(w.tumble * 5.5 + gi) * 0.20 * r.x,
        Math.sin(w.tumble * 4.2 + gi * 1.7) * 0.26 * r.y,
        g.userData.rest + Math.sin(w.tumble * 6.4 + gi * 0.9) * 0.14 * r.z
      );
    });
    // THE WAKE — smaller characters shedding off the back of the word. Built
    // from the same command's own glyphs, so what trails a 潰れろ is bits of
    // 潰れろ rather than generic sparkle.
    w.wakeT -= dt;
    if (w.wakeT <= 0) {
      w.wakeT = 0.028;
      const chars = [...w.cmd.kanji];
      const ch = chars[(Math.random() * chars.length) | 0];
      const small = makeGlyph(ch, {
        color: w.cmd.color, scale: rand(0.10, 0.20), depth: 0.05, outline: false, glow: 0.8
      });
      small.position.copy(p).add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3)));
      small.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      this.scene.add(small);
      w.wake.push({
        node: small, life: 0.34, max: 0.34,
        vel: v3(rand(-1.2, 1.2), rand(-0.6, 1.4), rand(-1.2, 1.2)),
        spin: v3(rand(-6, 6), rand(-6, 6), rand(-6, 6))
      });
    }
    this._tickWake(w, dt);
    if (k >= 1) {
      w.phase = 'constrict';
      w.t = 0;
      // the glyphs stop tumbling and take their stations around the body
      w.ring = w.node.userData.glyphs.map((g, gi) => {
        const a = (gi / w.node.userData.glyphs.length) * Math.PI * 2;
        g.userData.a0 = a;
        return a;
      });
    }
  }

  // ---- THE CONSTRICT — the half-beat where the word HAS them ---------------
  _constrict(w, dt) {
    const k = Math.min(1, w.t / CONSTRICT);
    const c = w.target?.alive ? this._chestPoint(w.target) : w.to;
    const radius = 1.35 * (1 - k * 0.72);          // closes in on the body
    w.node.position.copy(c);
    // the GROUP faces the camera; the glyphs orbit inside it, so the ring
    // reads as characters circling the body from wherever it is watched
    this._faceCamera(w.node, c);
    w.light.position.copy(c);
    w.light.intensity = (w.cmd.weight === 'heavy' ? 6.5 : 3.4) * (1 + k * 1.6);
    const spin = k * 3.2;
    w.node.userData.glyphs.forEach(g => {
      const a = g.userData.a0 + spin;
      // The orbit is in the group's XY plane — the plane the camera is looking
      // at — with a shallow Z so it still has depth. An orbit in XZ (which is
      // what the first version did) put half the glyphs behind the body where
      // nobody could see the constrict happen at all.
      g.position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.62, Math.sin(a * 1.3) * 0.30);
      g.rotation.set(0, 0, g.userData.rest + Math.sin(a) * 0.22);
      g.scale.setScalar(1 + k * 0.35);
    });
    this._tickWake(w, dt);
    if (k >= 1 && !w.fired) {
      w.fired = true;
      w.onArrive?.(w);
      w.phase = 'shatter';
      w.t = 0;
    }
  }

  // ---- THE SHATTER ---------------------------------------------------------
  // The glyphs break into fragments and dissolve. Each one throws a burst of
  // its own smaller copies outward, so the word visibly comes apart into
  // characters rather than into sparks.
  _shatter(w, dt) {
    if (w.t <= dt) {
      const c = w.target?.alive ? this._chestPoint(w.target) : w.to;
      const chars = [...w.cmd.kanji];
      const heavy = w.cmd.weight === 'heavy';
      for (let i = 0; i < (heavy ? 16 : 10); i++) {
        const ch = chars[(Math.random() * chars.length) | 0];
        const frag = makeGlyph(ch, {
          color: i % 4 === 0 ? 0xffffff : w.cmd.color,
          scale: rand(0.08, 0.22), depth: 0.04, outline: false, glow: 1.1
        });
        frag.position.copy(c).add(v3(rand(-0.5, 0.5), rand(-0.4, 0.9), rand(-0.5, 0.5)));
        this.scene.add(frag);
        const a = Math.random() * Math.PI * 2, up = rand(0.5, 4.2);
        w.wake.push({
          node: frag, life: rand(0.3, 0.55), max: 0.55,
          vel: v3(Math.cos(a) * rand(2, 7), up, Math.sin(a) * rand(2, 7)),
          spin: v3(rand(-9, 9), rand(-9, 9), rand(-9, 9)), gravity: 7
        });
      }
    }
    const k = Math.min(1, w.t / SHATTER);
    const c2 = w.target?.alive ? this._chestPoint(w.target) : w.to;
    w.node.position.copy(c2);
    this._faceCamera(w.node, c2);
    w.node.userData.glyphs.forEach((g, gi) => {
      const a = g.userData.a0;
      g.position.addScaledVector(v3(Math.cos(a), Math.sin(a) * 0.6 + 0.3, 0), 7 * dt);
      g.scale.setScalar(Math.max(0.001, 1.35 * (1 - k)));
      g.rotation.z += (gi % 2 ? 8 : -8) * dt;
    });
    w.light.intensity *= Math.max(0, 1 - dt * 6);
    this._tickWake(w, dt);
    return k >= 1 && w.wake.length === 0;
  }

  _tickWake(w, dt) {
    for (let i = w.wake.length - 1; i >= 0; i--) {
      const s = w.wake[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.node);
        disposeWord(s.node);
        w.wake.splice(i, 1);
        continue;
      }
      if (s.gravity) s.vel.y -= s.gravity * dt;
      s.node.position.addScaledVector(s.vel, dt);
      s.node.rotation.x += s.spin.x * dt;
      s.node.rotation.y += s.spin.y * dt;
      s.node.rotation.z += s.spin.z * dt;
      const a = s.life / s.max;
      s.node.scale.multiplyScalar(1 - dt * 0.8);
      s.node.traverse(o => { if (o.isMesh && o.material.opacity !== undefined) o.material.opacity = a; });
    }
  }

  _retire(i) {
    const w = this.words[i];
    this.scene.remove(w.node);
    this.scene.remove(w.light);
    disposeWord(w.node);
    for (const s of w.wake) { this.scene.remove(s.node); disposeWord(s.node); }
    this.words.splice(i, 1);
  }

  // ---- THE FOLLOW-THROUGHS -------------------------------------------------
  // One per command, so the consequence reads as belonging to that word rather
  // than to "a technique landed". These fire AFTER the constrict, from the
  // effect dispatcher.

  // DON'T MOVE — a cage of characters standing up around them, locked in place
  // for as long as the root lasts.
  cage(target, cmd, seconds) {
    const c = this._chestPoint(target);
    const chars = [...cmd.kanji];
    const bars = [];
    for (let i = 0; i < 8; i++) {
      const ch = chars[i % chars.length];
      const g = makeGlyph(ch, { color: cmd.color, scale: 0.34, depth: 0.06, outline: false, glow: 1.0 });
      const a = (i / 8) * Math.PI * 2;
      g.position.set(Math.cos(a) * 1.0, (i % 2) * 0.55 - 0.1, Math.sin(a) * 1.0);
      g.lookAt(0, g.position.y, 0);
      g.rotateY(Math.PI);
      bars.push(g);
    }
    const cage = new THREE.Group();
    cage.position.copy(c);
    bars.forEach(b => cage.add(b));
    this.scene.add(cage);
    this.gathers.push({ kind: 'cage', node: cage, target, t: seconds, max: seconds });
    this.fx._ring(target.pos.clone().setY(0.06), cmd.color, { size: 0.6, growRate: 4, life: 0.7 });
    this.fx._ring(target.pos.clone().setY(0.06), 0xffffff, { size: 0.35, growRate: 2.6, life: 1.0 });
  }

  // GET CRUSHED — one enormous glyph driven down onto them from above.
  slam(target, cmd) {
    const c = target.pos.clone().setY(target.pos.y + 5.2);
    const g = makeGlyph([...cmd.kanji][0], { color: cmd.color, scale: 2.3, depth: 0.3, glow: 1.3 });
    g.rotation.x = -Math.PI / 2;
    g.position.copy(c);
    this.scene.add(g);
    this.gathers.push({ kind: 'slam', node: g, target, t: 0.34, max: 0.34, y0: c.y, y1: target.pos.y + 0.3 });
  }

  // BLAST AWAY — the word detonates outward through the body.
  detonate(target, cmd, radius = 3.0) {
    const c = this._chestPoint(target);
    this.fx._ring(c, cmd.color, { size: 0.4, growRate: radius * 9, life: 0.34, flat: false });
    this.fx._ring(c, 0xffffff, { size: 0.25, growRate: radius * 6, life: 0.26, flat: false });
    this.fx._ring(target.pos.clone().setY(0.06), cmd.color, { size: 0.5, growRate: radius * 7, life: 0.5 });
    const chars = [...cmd.kanji];
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const frag = makeGlyph(chars[i % chars.length], {
        color: i % 3 === 0 ? 0xffffff : cmd.color, scale: rand(0.14, 0.3),
        depth: 0.05, outline: false, glow: 1.2
      });
      frag.position.copy(c);
      this.scene.add(frag);
      this.gathers.push({
        kind: 'frag', node: frag, t: rand(0.35, 0.6), max: 0.6,
        vel: v3(Math.cos(a) * rand(7, 15), rand(1, 7), Math.sin(a) * rand(7, 15)),
        spin: v3(rand(-12, 12), rand(-12, 12), rand(-12, 12))
      });
    }
  }

  // RUN AWAY / COME HERE — an arrow of characters on the ground showing which
  // way the body is about to be taken. Both players need to read the direction
  // instantly, and this is the readable half of a mechanic that would
  // otherwise be invisible until it happened.
  arrow(target, cmd, from, outward, seconds) {
    const dir = target.pos.clone().sub(from).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, 1);
    dir.normalize().multiplyScalar(outward ? 1 : -1);
    const chars = [...cmd.kanji];
    for (let i = 0; i < 5; i++) {
      const g = makeGlyph(chars[i % chars.length], {
        color: cmd.color, scale: 0.30, depth: 0.05, outline: false, glow: 1.0
      });
      g.position.copy(target.pos).setY(0.12).addScaledVector(dir, 0.9 + i * 0.95);
      g.rotation.x = -Math.PI / 2;
      g.rotation.z = -Math.atan2(dir.x, dir.z);
      this.scene.add(g);
      this.gathers.push({ kind: 'mark', node: g, t: seconds * 0.7, max: seconds * 0.7, rise: 0.6 });
    }
  }

  // SLEEP / GET TWISTED — a slow mark that stays on the body for the duration,
  // so the debuff has a presence the opponent can see expiring.
  brand(target, cmd, seconds) {
    const g = makeGlyph([...cmd.kanji][0], {
      color: cmd.color, scale: 0.5, depth: 0.06, outline: false, glow: 1.0
    });
    this.scene.add(g);
    this.gathers.push({ kind: 'brand', node: g, target, t: seconds, max: seconds });
  }

  updateMarks(dt) {
    for (let i = this.gathers.length - 1; i >= 0; i--) {
      const m = this.gathers[i];
      m.t -= dt;
      const dead = m.t <= 0 || (m.target && !m.target.alive);
      if (m.kind === 'cage' && m.target) {
        m.node.position.copy(this._chestPoint(m.target));
        m.node.rotation.y += dt * 0.9;
      } else if (m.kind === 'brand' && m.target) {
        m.node.position.copy(this._chestPoint(m.target)).add(v3(0, 0.95, 0));
        m.node.quaternion.copy(this.camera.quaternion);
        m.node.position.y += Math.sin(performance.now() * 0.004) * 0.06;
      } else if (m.kind === 'slam') {
        const k = 1 - Math.max(0, m.t) / m.max;
        m.node.position.y = m.y0 + (m.y1 - m.y0) * (k * k);
        m.node.position.x = m.target.pos.x;
        m.node.position.z = m.target.pos.z;
        m.node.scale.setScalar(1 + k * 0.5);
      } else if (m.kind === 'frag') {
        m.vel.y -= 9 * dt;
        m.node.position.addScaledVector(m.vel, dt);
        m.node.rotation.x += m.spin.x * dt;
        m.node.rotation.y += m.spin.y * dt;
        m.node.rotation.z += m.spin.z * dt;
      } else if (m.kind === 'mark') {
        m.node.position.y = 0.12 + (1 - m.t / m.max) * m.rise;
      }
      const a = Math.max(0, Math.min(1, m.t / Math.max(0.001, m.max * 0.35)));
      m.node.traverse(o => {
        if (o.isMesh && o.material.opacity !== undefined) { o.material.transparent = true; o.material.opacity = a; }
      });
      if (dead) { this.scene.remove(m.node); disposeWord(m.node); this.gathers.splice(i, 1); }
    }
  }

  clear() {
    while (this.words.length) this._retire(this.words.length - 1);
    for (const m of this.gathers) { this.scene.remove(m.node); disposeWord(m.node); }
    this.gathers.length = 0;
  }

  _throatPoint(f) {
    const g = f.model.group;
    const fwd = v3(Math.sin(f.facing), 0, Math.cos(f.facing));
    const h = (f.cfg.size?.height ?? 1.70);
    return v3(g.position.x, g.position.y + h * 0.82, g.position.z).addScaledVector(fwd, 0.18);
  }

  _chestPoint(f) {
    const g = f.model.group;
    return v3(g.position.x, g.position.y + (f.hurtBox?.center ?? 1.15), g.position.z);
  }
}
