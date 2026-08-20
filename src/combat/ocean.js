// OCEAN SHIKIGAMI — Dagon's creatures, and the engine behind DEATH SWARM.
// ===========================================================================
// One system, two customers:
//
//   THE SPECIAL   one persistent, weakened ally outside the domain. Standard
//                 cooldown, standard HUD icon, one at a time.
//   THE DOMAIN    HORIZON OF THE CAPTIVATING SKANDHA's sure-hit payload: a
//                 continuous, escalating, never-ending spawn for the whole 20
//                 seconds, routed through the existing sure-hit path so
//                 blocking mitigates but never prevents.
//
// It is deliberately ONE system rather than two. The creature that turns up
// when he presses B is the same creature the domain spawns, with two
// multipliers on it and the guarantee switched off — which means the domain
// is visibly "the thing he already does, without a limit" rather than a second
// unrelated mechanic bolted to the same character.
//
// ---------------------------------------------------------------------------
// WHAT A SHIKIGAMI IS HERE (and what it is not)
// ---------------------------------------------------------------------------
// An ENTITY, not a Fighter — the same call combat/minion.js makes for Mahito's
// transfigured human and for the same reasons. It has a position, a health
// pool, a small state machine and its own model animator; it does not have a
// cursed-energy bar, a stance, a combo counter or a domain relationship. That
// keeps twenty-two of them cheap and keeps every existing system that iterates
// `match.fighters` completely unaware of them.
//
// ---------------------------------------------------------------------------
// PERFORMANCE — the honest list of what keeps 22 of these affordable
// ---------------------------------------------------------------------------
//   1. HARD SLOT CAP. `swarm.maxSlots`, counted in SLOTS (a shark is 3, a
//      piranha shoal is 1 and carries fifteen bodies). At the cap the OLDEST
//      living creature is culled rather than the spawn being skipped, so the
//      count is bounded above by construction and the pressure never stalls.
//   2. THE SHOAL. The piranhas are one entity, one model, one animator and one
//      AI. Fifteen fish for the cost of one.
//   3. LOD, on a 5-per-second stagger. Every creature's outline hulls drop at
//      range through the same `setLOD` the Ten Shadows already use, and the
//      calls are spread across frames rather than all landing on one.
//   4. STAGGERED THINK. Pathing and target selection run on a per-creature
//      ~7 Hz clock, not per frame. Movement is still per frame; only the
//      DECISIONS are staggered, so nothing visibly stutters.
//   5. NO PER-CREATURE PARTICLES at the cap. The emergence splash is skipped
//      once more than `FX_BUDGET` creatures are alive, which is the single
//      biggest saving and the least visible one.
//   6. MODEL POOLING. Killed creatures return their built model to a per-type
//      pool instead of being rebuilt, so a 20-second domain builds at most a
//      handful of each body rather than one per spawn. Building a shark is by
//      far the most expensive thing in this file and it should happen once.
import * as THREE from 'three';
import { v3, rand, yawBetween, flatDist, clamp } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import { OCEAN_BUILDERS } from '../art/models/oceanshikigami.js';

// Above this many live creatures, per-creature cosmetic particles stop.
const FX_BUDGET = 9;
// How often a creature re-decides. 7 Hz, jittered per creature so they do not
// all think on the same frame.
const THINK_MIN = 0.12, THINK_MAX = 0.18;

// ---------------------------------------------------------------------------
// THE MODEL POOL
// ---------------------------------------------------------------------------
// Building a Great Shark is ~9000 vertices of geometry plus three canvas
// textures. Doing that on the frame a shark spawns, at the point in the domain
// where the spawn rate is already at its fastest, is exactly the wrong moment
// for it. Models are returned here on death and handed back out on the next
// spawn of that type.
const POOL = new Map();
function takeModel(type) {
  const list = POOL.get(type);
  if (list && list.length) return list.pop();
  return OCEAN_BUILDERS[type]();
}
function giveModel(type, model) {
  if (!POOL.has(type)) POOL.set(type, []);
  const list = POOL.get(type);
  // a small pool per type is plenty — at the cap there are never more than a
  // handful of any one species dead at once
  if (list.length < 6) { model.setReveal(0); list.push(model); }
}

// ---------------------------------------------------------------------------
// THE SPAWN TABLE
// ---------------------------------------------------------------------------
// Both halves of the escalation live here so the curve can be read at a
// glance: `spawnGap` is how long until the next one, `rollType` is what it is.

// Seconds until the next spawn, at normalized domain progress `t` (0..1).
// Piecewise-linear across `rateCurve`, so the curve in the config IS the curve
// in the game and there is no second place to keep in step.
export function spawnGap(sw, t) {
  const c = sw.rateCurve;
  const k = clamp(t, 0, 1) * (c.length - 1);
  const i = Math.min(c.length - 2, Math.floor(k));
  const f = k - i;
  return c[i] + (c[i + 1] - c[i]) * f;
}

// Which wave row is in force at `t`.
function waveAt(sw, t) {
  let row = sw.waves[0];
  for (const w of sw.waves) if (t >= w.at) row = w;
  return row;
}

// Roll a creature type. `state` carries the two shark guards so an unlucky
// early roll cannot put one on the beach in the opening seconds.
export function rollType(sw, t, state, rng = Math.random) {
  const weights = { ...waveAt(sw, t).weights };
  const sharkOk = t >= (sw.sharkNotBefore ?? 0)
    && (state.sinceShark ?? 99) >= (sw.sharkMinGap ?? 0);
  if (!sharkOk) weights.shark = 0;
  let total = 0;
  for (const k in weights) total += weights[k];
  if (total <= 0) return 'piranha';
  let r = rng() * total;
  for (const k in weights) { r -= weights[k]; if (r <= 0) return k; }
  return 'piranha';
}

// ---------------------------------------------------------------------------
// ONE CREATURE
// ---------------------------------------------------------------------------
class Sea {
  constructor(sys, owner, def, opts = {}) {
    this.sys = sys;
    this.match = sys.match;
    this.owner = owner;
    this.def = def;
    this.type = def.key;
    this.sure = !!opts.sure;
    this.domain = !!opts.domain;
    const hpMult = opts.hpMult ?? 1;
    this.dmgMult = opts.dmgMult ?? 1;
    this.maxHp = def.hp * hpMult;
    this.hp = this.maxHp;
    this.life = def.life;
    this.slots = def.slots;
    this.born = sys.clock;

    this.model = takeModel(this.type);
    this.pos = (opts.at || owner.pos.clone()).clone();
    this.facing = owner.facing;
    this.vel = v3();
    this.state = 'emerge';
    this.t = def.emergeTime;
    this.reveal = 0;
    this.swingT = def.swingEvery * rand(0.4, 0.9);
    this.thinkT = rand(0, THINK_MAX);
    this.anim = {};
    this.animT = rand(0, 5);
    this.dead = false;
    this.action = null;
    this.actionK = 0;
    // per-creature clocks for the two that have a scripted move
    this.spitT = def.spit ? def.spit.every * rand(0.5, 1.0) : 0;
    this.ramT = def.ramEvery ? def.ramEvery * rand(0.5, 1.0) : 0;
    this.lungeT = def.lungeEvery ? def.lungeEvery * rand(0.5, 1.0) : 0;
    this._lodT = rand(0, 0.2);

    this.model.setReveal(0);
    this.model.group.position.copy(this.pos);
    this.match.root.add(this.model.group);
  }

  get alive() { return !this.dead && this.hp > 0; }

  // Its own target. Normally the owner's opponent; the domain's canon
  // "divide the guaranteed hits among multiple opponents" clause assigns
  // different creatures to different people in a free-for-all.
  get target() {
    if (this._pinned?.alive) return this._pinned;
    return this.match.other(this.owner);
  }

  hurt(dmg, attacker, opts = {}) {
    if (this.dead) return;
    // ARMOUR. The crab and the shark do not flinch off a light hit — they take
    // the damage and keep coming, which is most of what makes them feel
    // different from the piranhas.
    const flinch = !this.def.armor || (opts.heavy || dmg >= this.maxHp * 0.25);
    this.hp -= dmg;
    if (flinch) { this.state = 'hit'; this.t = 0.26; }
    if (attacker) {
      const kb = v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z);
      if (kb.lengthSq() > 1e-6) this.pos.addScaledVector(kb.normalize(), opts.kb ?? 0.4);
    }
    if (this.sys.list.length <= FX_BUDGET) {
      this.match.fx.hitSpark(this.pos.clone().add(v3(0, this.model.height * 0.6, 0)), 'light');
    }
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die();
  }

  die(silent = false) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dying';
    this.t = 0.5;
    if (!silent && this.sys.list.length <= FX_BUDGET) {
      this.match.sfx.seaDie?.();
      const p = this.pos.clone().add(v3(0, this.model.height * 0.45, 0));
      for (let i = 0; i < 10; i++) {
        this.match.fx._spawn(p, {
          color: i % 3 === 0 ? 0xdff0f4 : this.def.color, size: rand(0.10, 0.26),
          life: rand(0.25, 0.5), opacity: 0.8,
          vel: v3(rand(-3, 3), rand(1, 4), rand(-3, 3)), gravity: 9
        });
      }
    }
  }

  // Deliver a hit. THE ONE PLACE the domain's sure-hit reaches the opponent —
  // `sureHit` rides on the hit itself, so it goes through exactly the same
  // guard in Fighter._applyHit that every other domain payload in the game
  // uses. Simple Domain, Falling Blossom, the Inverted Spear and Miwa's circle
  // therefore all answer it without a line of code here knowing they exist.
  _strike(t, dmg, opts = {}) {
    const m = this.match;
    if (!t?.alive) return;
    const { dmg: d } = computeDamage(this.owner, dmg * this.dmgMult, { canCrit: false });
    const dir = v3(t.pos.x - this.pos.x, 0, t.pos.z - this.pos.z);
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    const r = t.applyHit({
      dmg: d, kb: opts.kb ?? this.def.kb, kbY: opts.kbY ?? this.def.kbY ?? 0,
      hitstun: opts.hitstun ?? this.def.hitstun, type: opts.type ?? 'light',
      attacker: this.owner, isCT: false, minion: true,
      // ADAPTATION CATEGORY. `summon` — the same bucket Megumi's shikigami and
      // Geto's curses already feed. That is the correct ruling and it is
      // deliberately NOT a new category: they are the same KIND of thing (a
      // body somebody else sent), and Mahoraga adapting to being bitten by
      // something that is not the sorcerer should cover all three.
      src: 'summon',
      // THE GUARANTEE. Set only inside the domain — his own SPECIAL never
      // carries it. `otgOk` rides with it because a sure-hit that refused a
      // downed target would let the opponent opt out of the domain by lying on
      // the floor, which is the one thing an attrition domain cannot allow.
      sureHit: this.sure || undefined,
      otgOk: this.sure || undefined,
      dir: dir.normalize()
    }, m.ctxFor(this.owner));
    hitFeedback(m, this.owner, t, r, { heavy: opts.heavy });
    if (r === 'hit' || r === 'otg') {
      this.owner.gainMaxCE(this.owner.cfg.stats.ceGainPerPunch * 0.25);
    }
    return r;
  }

  update(dt) {
    const m = this.match;
    const g = this.model.group;

    if (this.state === 'dying') {
      this.t -= dt;
      this.reveal = Math.max(0, this.t / 0.5);
      this.model.setReveal(this.reveal);
      this.animT += dt;
      this.anim.hurt = true;
      this.anim.speed = 0;
      this.model.tick(dt, this.anim);
      g.position.set(this.pos.x, this.pos.y, this.pos.z);
      if (this.t <= 0) { m.root.remove(g); giveModel(this.type, this.model); return false; }
      return true;
    }

    // lifetime, owner death, and the domain coming down
    this.life -= dt;
    if (this.life <= 0 || !this.owner.alive || this.owner.eliminated) { this.die(); return true; }

    // EMERGENCE. It comes up out of the water before it can act — the window
    // in which killing it is free, and the reason the spawn is fair.
    if (this.state === 'emerge') {
      this.t -= dt;
      this.reveal = 1 - Math.max(0, this.t / this.def.emergeTime);
      this.model.setReveal(this.reveal);
      if (this.t <= 0) { this.state = 'chase'; this.reveal = 1; }
    } else if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 2.2);
      this.model.setReveal(this.reveal);
    }

    const t = this.target;
    const dist = t ? flatDist(this.pos, t.pos) : 99;

    // ---- THINK, on a staggered clock ---------------------------------------
    this.thinkT -= dt;
    if (this.thinkT <= 0) {
      this.thinkT = rand(THINK_MIN, THINK_MAX);
      this._plan(t, dist);
    }

    // ---- ACT ---------------------------------------------------------------
    if (this.state === 'hit') {
      this.t -= dt;
      if (this.t <= 0) this.state = 'chase';
    } else if (this.state === 'windup') {
      this.t -= dt;
      this.actionK = 1 - Math.max(0, this.t / this._windDur);
      if (this.t <= 0) this._release(t);
    } else if (this.state === 'recover') {
      this.t -= dt;
      this.actionK = Math.max(0, this.t / 0.4);
      if (this.t <= 0) { this.state = 'chase'; this.action = null; this.actionK = 0; }
    } else if (this.state === 'charge') {
      // the crab's ram and the shark's lunge share one committed-travel state
      this.t -= dt;
      this.actionK = 1 - Math.max(0, this.t / this._chargeDur);
      this.pos.addScaledVector(this._chargeDir, this._chargeSpeed * dt);
      if (t?.alive && !this._chargeHit && flatDist(this.pos, t.pos) < this.def.reach + 0.6) {
        this._chargeHit = true;
        this._strike(t, this._chargeDmg, {
          kb: this._chargeKb, kbY: 1.4, type: 'heavy', heavy: true, hitstun: this.def.hitstun + 6
        });
        m.cam.shake(0.3);
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.4; }
    } else if (this.state === 'chase' && t?.alive) {
      this._move(t, dist, dt);
    }

    // ---- WORLD -------------------------------------------------------------
    const bd = m.arena?.bounds;
    if (bd) {
      bd.resolveWalls(this.pos, 0.34);
      const floor = bd.floorAt(this.pos.x, this.pos.z, this.pos.y + 0.8);
      if (this.model.swim) {
        // A SWIMMER DOES NOT WALK. The three aquatic bodies hold a hover above
        // whatever surface is under them and bob; only the crab is pinned.
        const want = floor + (this.def.swimHeight ?? 0.55);
        this.pos.y += (want - this.pos.y) * Math.min(1, 6 * dt);
      } else {
        this.pos.y = floor;
      }
    }
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > this.owner.arenaRadius) { const s = this.owner.arenaRadius / r; this.pos.x *= s; this.pos.z *= s; }

    // ---- DRIVE THE MODEL ---------------------------------------------------
    this.animT += dt;
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    this.anim.speed = this.state === 'chase' || this.state === 'charge'
      ? Math.hypot(this.vel.x, this.vel.z) : 0;
    this.anim.hurt = this.state === 'hit';
    this.anim.action = this.action;
    this.anim.actionK = this.actionK;
    this._lodT -= dt;
    if (this._lodT <= 0 && this.model.setLOD) {
      this._lodT = 0.2;
      this.model.setLOD(this.pos.distanceTo(m.stage.camera.position));
    }
    this.model.tick(dt, this.anim);
    return true;
  }

  // ---- the decision, on the staggered clock -------------------------------
  _plan(t, dist) {
    if (!t?.alive || this.state !== 'chase') return;
    const d = this.def;
    // THE EEL — hold `standoff` and spit from there.
    if (d.spit) {
      this.spitT -= 0.15;
      if (this.spitT <= 0 && dist < d.spit.range && dist > 2.0) {
        this.spitT = d.spit.every * rand(0.85, 1.25);
        this.state = 'windup';
        this.action = 'spit';
        this._windDur = d.spit.windup;
        this.t = this._windDur;
        return;
      }
    }
    // THE CRAB — ram on its own clock, from mid range.
    if (d.ramEvery) {
      this.ramT -= 0.15;
      if (this.ramT <= 0 && dist > 2.4 && dist < 9) {
        this.ramT = d.ramEvery * rand(0.85, 1.3);
        this._beginCharge(t, d.ramSpeed, d.ramDmg, d.ramKb, 0.7, 'ram');
        return;
      }
    }
    // THE SHARK — lunge, and it covers most of the arena doing it.
    if (d.lungeEvery) {
      this.lungeT -= 0.15;
      if (this.lungeT <= 0 && dist > 3.0 && dist < d.lungeRange) {
        this.lungeT = d.lungeEvery * rand(0.85, 1.25);
        this._beginCharge(t, d.lungeSpeed, d.dmg * 1.25, d.kb, 0.62, 'bite');
        return;
      }
    }
    // everything bites in range
    this.swingT -= 0.15;
    if (dist < d.reach && this.swingT <= 0) {
      this.swingT = d.swingEvery * rand(0.8, 1.25);
      this.state = 'windup';
      this.action = d.key === 'crab' ? 'snap' : 'bite';
      this._windDur = d.key === 'shark' ? 0.42 : 0.26;
      this.t = this._windDur;
    }
  }

  _beginCharge(t, speed, dmg, kb, dur, action) {
    this.state = 'charge';
    this.action = action;
    this.t = this._chargeDur = dur;
    this._chargeSpeed = speed;
    this._chargeDmg = dmg;
    this._chargeKb = kb;
    this._chargeHit = false;
    this._chargeDir = v3(t.pos.x - this.pos.x, 0, t.pos.z - this.pos.z);
    if (this._chargeDir.lengthSq() < 1e-6) this._chargeDir.set(0, 0, 1);
    this._chargeDir.normalize();
    this.facing = Math.atan2(this._chargeDir.x, this._chargeDir.z);
  }

  _release(t) {
    const d = this.def;
    this.state = 'recover';
    this.t = 0.4;
    if (this.action === 'spit' && d.spit) {
      // the jet is a real travelling entity in the effect system, so it can be
      // walked out of, blocked, and — pointedly — REFLECTED by Uro, which is
      // the correct answer: it is a projectile and it travels.
      const dir = v3(t.pos.x - this.pos.x, 0, t.pos.z - this.pos.z).normalize();
      this.match.effects.entities.push({
        type: 'seaSpit', caster: this.owner, sure: this.sure,
        pos: this.pos.clone().add(v3(0, this.model.height * 0.8, 0)).addScaledVector(dir, 0.4),
        dir, spd: d.spit.speed, dmg: d.spit.dmg * this.dmgMult,
        kb: d.spit.kb, kbY: 0, hitstun: d.spit.hitstun,
        range: d.spit.range, travelled: 0, fxT: 0,
        hitOpts: { attacker: this.owner, isCT: false, minion: true, src: 'summon', sureHit: this.sure || undefined }
      });
      this.match.sfx.seaSpit?.();
      return;
    }
    if (t?.alive && flatDist(this.pos, t.pos) < d.reach + 0.5) {
      this._strike(t, d.dmg, { heavy: d.key === 'shark' });
    }
  }

  _move(t, dist, dt) {
    const d = this.def;
    let goal;
    if (d.blocker) {
      // THE CRAB PUTS ITSELF IN THE WAY. Between Dagon and the target, biased
      // toward the target — which is what "body-blocks" has to mean for a
      // creature that is also trying to bite.
      goal = this.owner.pos.clone().lerp(t.pos, 0.68);
    } else if (d.standoff) {
      // THE EEL KEEPS ITS DISTANCE. Backs off if the target closes.
      const away = v3(this.pos.x - t.pos.x, 0, this.pos.z - t.pos.z);
      if (away.lengthSq() < 1e-6) away.set(0, 0, 1);
      goal = t.pos.clone().addScaledVector(away.normalize(), d.standoff);
    } else {
      goal = t.pos;
    }
    const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
    const gd = Math.hypot(dx, dz);
    const stop = d.blocker ? 0.5 : d.standoff ? 1.2 : d.reach * 0.75;
    if (gd > stop) {
      const sp = d.speed * (gd > 6 ? 1.25 : 1);
      this.vel.x = (dx / gd) * sp;
      this.vel.z = (dz / gd) * sp;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
    } else { this.vel.x = 0; this.vel.z = 0; }
    // it always LOOKS at the target even while backing off, which is what
    // makes the eel read as keeping you at range rather than as fleeing
    this.facing = yawBetween(this.pos, t.pos);
  }
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
export class OceanSystem {
  constructor(match) {
    this.match = match;
    this.list = [];
    this.clock = 0;
    // per-domain spawn state, rebuilt on cast
    this.swarm = null;
  }

  // ---- the SPECIAL: one weakened persistent ally --------------------------
  summonFor(owner, type, at = null) {
    const cfg = owner.cfg;
    const sp = cfg.special;
    const def = cfg.ocean.defs[type];
    if (!def) return null;
    if (this.countFor(owner) >= (sp.maxOutside ?? 1)) return null;
    const pos = at || owner.pos.clone()
      .addScaledVector(owner.forward(), 1.8)
      .add(v3(rand(-0.5, 0.5), 0, rand(-0.5, 0.5)));
    const s = new Sea(this, owner, def, {
      at: pos, sure: false, domain: false,
      hpMult: sp.outsideHpMult ?? 1, dmgMult: sp.outsideDmgMult ?? 1
    });
    this.list.push(s);
    this._splash(pos);
    return s;
  }

  // ---- the DOMAIN: DEATH SWARM --------------------------------------------
  // Called by domains.js on activation. Nothing spawns until `update` runs.
  beginSwarm(caster, def) {
    const sw = def.swarm;
    this.swarm = {
      caster, def, sw,
      t: 0, dur: def.duration,
      next: sw.firstDelay ?? 1.0,
      sinceShark: 99,
      spawned: 0, culled: 0, peakSlots: 0
    };
  }

  endSwarm({ kill = true } = {}) {
    const s = this.swarm;
    this.swarm = null;
    if (!s) return null;
    // *** WHAT HAPPENS TO THE CREATURES ALREADY ON THE FIELD. ***
    // They all die, immediately, and that is a deliberate ruling rather than a
    // convenience. The shikigami are the domain's SURE-HIT PAYLOAD — they are
    // not summons he paid for separately, they are the thing the barrier is
    // producing. When the barrier stops existing, so does what it was making.
    //
    // It is also the only answer that makes the anti-domain tools mean
    // anything: if breaking the barrier left twenty sharks standing, breaking
    // the barrier would not be a counter. See the audit in the delivery
    // report for Simple Domain, the Inverted Spear, Miwa's circle and the
    // domain clash, all four of which route through here.
    if (kill) for (const s2 of this.list) if (s2.domain) s2.die(true);
    return { spawned: s.spawned, culled: s.culled, peakSlots: s.peakSlots };
  }

  slotsInUse() {
    let n = 0;
    for (const s of this.list) if (s.alive) n += s.slots;
    return n;
  }

  countFor(owner) {
    let n = 0;
    for (const s of this.list) if (s.owner === owner && s.alive) n++;
    return n;
  }

  aliveFor(owner) { return this.list.filter(s => s.owner === owner && s.alive); }

  _splash(pos) {
    if (this.list.length > FX_BUDGET) return;
    const m = this.match;
    m.arena?.splash?.(pos.x, pos.z, 1.1);
    m.fx._ring(pos.clone().setY(pos.y + 0.05), 0xbfe8ff, { size: 0.4, growRate: 5.5, life: 0.4, flat: true });
    for (let i = 0; i < 7; i++) {
      const a = rand(0, Math.PI * 2);
      m.fx._spawn(pos.clone().setY(pos.y + 0.1), {
        color: i % 2 ? 0xdff0f4 : 0x7fc8d8, size: rand(0.08, 0.20), life: rand(0.25, 0.5), opacity: 0.7,
        vel: v3(Math.cos(a) * rand(1, 3), rand(1.5, 3.5), Math.sin(a) * rand(1, 3)), gravity: 11
      });
    }
    m.sfx.seaEmerge?.();
  }

  // Where the next one comes out of the water.
  _spawnPoint(sw, target, caster) {
    const m = this.match;
    const fromSea = Math.random() < (sw.fromSea ?? 0.5);
    const band = fromSea ? sw.seaDist : sw.surfDist;
    const a = rand(0, Math.PI * 2);
    const r = rand(band[0], band[1]);
    const p = (target?.pos ?? caster.pos).clone().add(v3(Math.cos(a) * r, 0, Math.sin(a) * r));
    // never inside the target's guard on arrival
    if (target) {
      const d = flatDist(p, target.pos);
      const min = sw.minSpawnDist ?? 2.0;
      if (d < min) {
        const away = v3(p.x - target.pos.x, 0, p.z - target.pos.z);
        if (away.lengthSq() < 1e-6) away.set(1, 0, 0);
        p.copy(target.pos).addScaledVector(away.normalize(), min);
      }
    }
    const bd = m.arena?.bounds;
    if (bd) {
      bd.clampXZ(p, 1.0);
      p.y = bd.floorAt(p.x, p.z, (target?.pos.y ?? 0) + 2.0);
    } else {
      const lim = caster.arenaRadius - 1.0;
      const rr = Math.hypot(p.x, p.z);
      if (rr > lim) { p.x *= lim / rr; p.z *= lim / rr; }
      p.y = 0;
    }
    return p;
  }

  // ---- THE SPAWN TICK -----------------------------------------------------
  _tickSwarm(dt) {
    const s = this.swarm;
    if (!s) return;
    s.t += dt;
    s.sinceShark += dt;
    const prog = clamp(s.t / s.dur, 0, 1);
    s.next -= dt;
    if (s.next > 0) return;
    s.next = spawnGap(s.sw, prog);

    const m = this.match;
    const caster = s.caster;
    // canon: the guarantee can be DIVIDED among several opponents. In a 1v1
    // this picks the only opponent every time.
    const foes = (m.activeFighters ?? []).filter(f => f !== caster && f.alive);
    if (!foes.length) return;
    const target = s.def.splitSureHit
      ? foes[(Math.random() * foes.length) | 0]
      : m.other(caster);

    const type = rollType(s.sw, prog, s, Math.random);
    const def = caster.cfg.ocean.defs[type];
    if (!def) return;

    // *** THE HARD CAP. *** Cull the oldest until the new one fits.
    const cap = s.sw.maxSlots;
    if (s.sw.cullOldest !== false) {
      let guard = 0;
      while (this.slotsInUse() + def.slots > cap && guard++ < 40) {
        let oldest = null;
        for (const c of this.list) {
          if (!c.alive || !c.domain) continue;
          if (!oldest || c.born < oldest.born) oldest = c;
        }
        if (!oldest) break;
        oldest.die(true);
        s.culled++;
      }
    } else if (this.slotsInUse() + def.slots > cap) return;

    const at = this._spawnPoint(s.sw, target, caster);
    const c = new Sea(this, caster, def, { at, sure: true, domain: true });
    c._pinned = target;
    this.list.push(c);
    s.spawned++;
    if (type === 'shark') { s.sinceShark = 0; m.cam.shake(0.35); m.sfx.sharkRise?.(); }
    s.peakSlots = Math.max(s.peakSlots, this.slotsInUse());
    this._splash(at);
  }

  // ---- melee against them --------------------------------------------------
  // Same shape as Minions.meleeCheck: a swing can hit a fighter AND a
  // creature, and it tags each swing once so one swing cannot mow the swarm.
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.seaHit) continue;
      const fwd = f.forward();
      const origin = f.pos.clone().addScaledVector(fwd, win.def.reach * 0.7);
      for (const s of this.list) {
        if (!s.alive || s.owner === f) continue;
        // DAGON IS IMMUNE TO HIS OWN, in both directions: they never target
        // him and he cannot cut them. Anyone else can.
        if (flatDist(origin, s.pos) > 1.0 + s.model.radius * 0.5) continue;
        win.seaHit = true;
        s.hurt(win.def.dmg, f, { kb: win.def.kb * 0.18, heavy: win.def.type !== 'light' });
        break;
      }
    }
  }

  // area damage from techniques — the same signature Minions.hurtAt uses, so
  // every existing AoE site can reach them by adding one call
  hurtAt(pos, radius, dmg, attacker) {
    for (const s of this.list) {
      if (!s.alive || s.owner === attacker) continue;
      if (flatDist(s.pos, pos) < radius + s.model.radius * 0.5) s.hurt(dmg, attacker, { heavy: true });
    }
  }

  update(dt) {
    this.clock += dt;
    this._tickSwarm(dt);
    this.meleeCheck();
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i].update(dt)) this.list.splice(i, 1);
    }
  }

  clear() {
    for (const s of this.list) {
      this.match.root.remove(s.model.group);
      giveModel(s.type, s.model);
    }
    this.list.length = 0;
    this.swarm = null;
  }

  // telemetry for the debug overlay and the performance report
  stats() {
    return {
      alive: this.list.filter(s => s.alive).length,
      slots: this.slotsInUse(),
      spawned: this.swarm?.spawned ?? 0,
      culled: this.swarm?.culled ?? 0,
      peak: this.swarm?.peakSlots ?? 0,
      pooled: [...POOL.entries()].map(([k, v]) => k + ':' + v.length).join(' ')
    };
  }
}
