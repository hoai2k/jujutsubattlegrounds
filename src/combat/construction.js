// CONSTRUCTION 呪骸製作 — Yaga's B button, and the only summon in this game
// that is MANUFACTURED rather than called.
//
// ===========================================================================
// WHAT THIS FILE OWNS
// ===========================================================================
//   · the CONSTRUCTION METER — one per Yaga, filled by holding B, billed in
//     CURRENT_CE per second, damaged by being hit, decaying when abandoned
//   · the DEPLOY — reading the meter into one of four quality tiers
//   · the CORPSES themselves — bodies with health, a task list and a clock
//   · COMMAND (RB) — overwriting every live corpse's task list at once
//
// It is deliberately shaped like combat/minion.js (Mahito's transfigured
// human): an entity list on the match, a `spawn`, a `meleeCheck`, an `update`,
// a `hurtAt`. Everything Minions taught the codebase about "a body that is not
// a Fighter" is reused rather than re-derived, and the two systems do not know
// about each other. See the anti-summon audit at the bottom for what it took to
// put a FIFTH summon family on the field.
//
// ===========================================================================
// THE MECHANIC, AND WHY IT IS A HOLD
// ===========================================================================
// The research note in characters/yaga.js is the argument in full; the short
// version is that his technique is AUTHORSHIP. It has an input, a duration and
// a quality. A button that spawns a fixed creature would be every other
// summoner in the game wearing his coat.
//
// So: HOLD B, the meter fills, RELEASE to finish. What comes out is a readout
// of how long the other player let him work.
//
//   VULNERABLE THROUGHOUT.  No attacking, no blocking, no dashing, no jumping.
//                           He shuffles at a third of walk speed.
//   BEING HIT COSTS WORK.   A light hit takes 22% of the bar. A heavy hit, a
//                           launcher, a knockdown or a guard break destroys the
//                           work in progress OUTRIGHT.
//   CANCELLING IS CHEAP.    Let go and the progress sits for three seconds
//                           before it starts bleeding at 42%/s. Building in two
//                           bites around their pressure is a real plan.
//
// ===========================================================================
// THE UNUSUAL-STATE AUDIT — what interrupts a build, and what each does
// ===========================================================================
// The brief asks for this explicitly, and the answers are enforced by ONE
// function (`interrupt`) with one `severity` argument, rather than by six
// call sites each deciding for themselves:
//
//   INUMAKI'S CURSED SPEECH        'break'  — the build ends, progress KEPT.
//       A command takes hold in a body and makes it do something else. DON'T
//       MOVE, SLEEP, CRUMBLE and the rest all put him in a state that is not
//       `building`, so the hold ends — but nothing has HAPPENED to the work.
//       He was interrupted, not hit. The partial sits and decays normally.
//   NAOYA'S FREEZE                 'break'  — same. His body stops; the
//       half-built corpse in his hands does not un-build itself.
//   TODO'S BOOGIE WOOGIE           'break'  — same, and it is the cleanest
//       case: he is somewhere else now, still holding it.
//   NOBARA'S RESONANCE             'chip'   — 6% per tick. It reaches through
//       a straw effigy to hurt him at range; it is damage, it is small and
//       repeated, so it is priced as chip rather than as a hit.
//   PULLED INTO A DOMAIN           'break' on the cast, then 'chip' per
//       sure-hit tick. Being enclosed does not smash what he is holding; the
//       barrier's payload then eats it a bit at a time, which is what every
//       other sure-hit already does to every other resource.
//   A LIGHT HIT                    'light'  — 22% off.
//   A HEAVY / LAUNCHER / KNOCKDOWN / GUARD BREAK   'heavy' — destroyed.
//
// The rule underneath, stated once so a seventh case answers itself: A BUILD
// IS DESTROYED BY FORCE AND ONLY BY FORCE. Anything that merely takes his body
// away from him ends the hold and leaves the work alone.
import * as THREE from 'three';
import { v3, rand, yawBetween, flatDist, clamp } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import { buildCursedCorpse } from '../art/models/cursedcorpses.js';

// The tiers a build can land in, read off the config so the data lives with
// the character. Highest-first, so `tierFor` is a linear scan that stops.
function tiersOf(owner) { return owner.cfg.special?.tiers ?? []; }

export function tierFor(owner, progress) {
  const tiers = tiersOf(owner);
  for (let i = tiers.length - 1; i >= 0; i--) if (progress >= tiers[i].at - 1e-6) return tiers[i];
  return null;
}

// ---------------------------------------------------------------------------
// THE METER
// ---------------------------------------------------------------------------
// Lives on the Fighter as `f.build`, created lazily, so nothing that iterates
// fighters has to know it exists. Shape:
//   { p, holding, idleT, tier }
// `p` is 0..1. `idleT` counts down the grace window after a cancel.
export function ensureBuild(f) {
  if (!f.build) f.build = { p: 0, holding: false, idleT: 0, worked: 0 };
  return f.build;
}

export function buildProgress(f) { return f.build?.p ?? 0; }

// Called every frame by the fighter's `building` state while B is held.
export function tickBuilding(f, dt, match) {
  const sp = f.cfg.special;
  const b = ensureBuild(f);
  b.holding = true;
  b.idleT = sp.holdAfterCancel;
  // THE BILL. Continuous, not a lump sum — a corpse runs off HIS energy (see
  // the research note), so it costs while it is being made. Running dry does
  // not destroy the work; it simply stops the meter, which is the honest
  // reading and gives him a reason to release rather than a punishment.
  const cost = sp.ceDrain * dt;
  if (f.res.curCE < cost) { f.emit('constructStalled'); return false; }
  f.res.curCE -= cost;
  const before = b.p;
  b.p = Math.min(1, b.p + dt / sp.buildTime);
  b.worked += dt;
  // announce each tier as it is crossed — the OPPONENT has to be able to see
  // what they are letting him build, which is the entire point of the mechanic
  const tb = tierFor(f, before), ta = tierFor(f, b.p);
  if (ta && ta !== tb) f.emit('constructTier', { tier: ta });
  return true;
}

// Cancelled or ended without deploying. The work survives its grace window.
export function releaseBuild(f) {
  const b = ensureBuild(f);
  b.holding = false;
  b.idleT = f.cfg.special.holdAfterCancel;
}

// The decay, ticked from the fighter's per-frame update whether or not he is
// building — a partial that is not being worked on is always losing.
export function tickBuildDecay(f, dt) {
  const b = f.build;
  if (!b || b.p <= 0) return;
  // ---- ANYTHING THAT TAKES HIS BODY AWAY ENDS THE HOLD -------------------
  // This one line is what makes the interruption audit true rather than
  // aspirational. Inumaki's commands, Naoya's freeze, Boogie Woogie and being
  // pulled into a domain all move him into a state that is not `building`
  // WITHOUT going through the release path — and without this the `holding`
  // flag would stay set, the grace window would never start, and a partial
  // build would sit at full value for the rest of the round.
  //
  // The work is not damaged by any of them. It simply starts its clock.
  if (b.holding && f.state !== 'building') {
    b.holding = false;
    b.idleT = f.cfg.special?.holdAfterCancel ?? 3;
  }
  if (b.holding) return;
  if (b.idleT > 0) { b.idleT -= dt; return; }
  b.p = Math.max(0, b.p - f.cfg.special.decayRate * dt);
}

// ---------------------------------------------------------------------------
// INTERRUPTION — the single door, per the audit above
// ---------------------------------------------------------------------------
// `severity` is 'break' | 'chip' | 'light' | 'heavy'. Returns what happened so
// the caller can toast it.
export function interruptBuild(f, severity = 'break') {
  const b = f.build;
  if (!b || b.p <= 0) return null;
  const loss = f.cfg.special?.hitLoss ?? {};
  let took = 0;
  if (severity === 'heavy') took = 1;
  else if (severity === 'light') took = loss.light ?? 0.22;
  else if (severity === 'chip') took = loss.chip ?? 0.06;
  if (took > 0) b.p = Math.max(0, b.p - took);
  b.holding = false;
  b.idleT = f.cfg.special?.holdAfterCancel ?? 3;
  const res = { severity, remaining: b.p, destroyed: b.p <= 0 && took > 0 };
  f.emit('constructHit', res);
  return res;
}

// ---------------------------------------------------------------------------
// A CORPSE
// ---------------------------------------------------------------------------
// Not a Fighter. Like Mahito's minion it is scenery to the domain system with
// the same two exceptions (a hostile domain stuns it, Jogo's heat cooks it),
// and Boogie Woogie ignores it — a constructed object is not a valid anchor for
// a technique that trades two sorcerers' positions.
class Corpse {
  constructor(owner, match, tier, opts = {}) {
    this.owner = owner;
    this.match = match;
    this.tier = tier;
    this.key = tier.key;
    const hpMult = opts.hpMult ?? 1;
    this.maxHp = tier.hp * hpMult;
    this.hp = this.maxHp;
    this.dmgMult = opts.dmgMult ?? 1;
    this.life = tier.life * (opts.lifeMult ?? 1);
    this.maxLife = this.life;
    this.model = buildCorpseModel(tier, opts.scale ?? 1);
    this.pos = owner.pos.clone().addScaledVector(owner.forward(), 1.5);
    this.pos.y = match.arena?.bounds?.floorAt(this.pos.x, this.pos.z, owner.pos.y + 0.55) ?? owner.pos.y;
    this.facing = owner.facing;
    this.state = 'chase';       // chase | windup | recover | hit | lunge | slam | dying
    this.t = 0;
    this.swingT = tier.swingEvery * 0.6;
    this.lungeT = tier.lunge ? tier.lunge.every * 0.7 : Infinity;
    this.slamT = tier.slam ? tier.slam.every * 0.8 : Infinity;
    this.planT = 0;
    this.guarding = false;
    this.animT = rand(0, 5);
    this.dead = false;
    this.reveal = 0;
    this.anim = {};
    // ---- THE TASK LIST ------------------------------------------------------
    // A normal cursed corpse "is programmed to complete a set list of given
    // tasks and lacks self-awareness" (canon). So its default plan is exactly
    // that — a short list, not a personality — and COMMAND overwrites it.
    this.order = null;          // { point, until, speedMult, dmgMult }
    match.root.add(this.model.group);
    this.model.group.position.copy(this.pos);
    this.model.setReveal(0);
    this.emergeT = tier.emergeTime;
  }

  get alive() { return !this.dead && this.hp > 0; }
  get H() { return this.model.height; }

  hurt(dmg, attacker, opts = {}) {
    if (this.dead) return;
    this.hp -= dmg;
    // ---- IT DOES NOT FLINCH -------------------------------------------------
    // Canon, and the single most important thing about fighting one: cursed
    // corpses "feel no pain or fear, and do not flinch when struck." Only SCRAP
    // flinches, because a SCRAP is barely fastened together and the hit
    // genuinely moves it.
    if (!this.tier.noFlinch) { this.state = 'hit'; this.t = 0.26; }
    const kb = attacker ? v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z).normalize() : v3();
    this.pos.addScaledVector(kb, (opts.kb ?? 0.4) * (this.tier.noFlinch ? 0.25 : 1));
    this.match.fx.hitSpark(this.pos.clone().add(v3(0, this.H * 0.7, 0)), 'light');
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die();
  }

  die(silent = false) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dying';
    this.t = 0.9;
    this.owner?.emit?.('corpseLost', { tier: this.tier });
    if (!silent) {
      this.match.sfx.corpseCollapse?.(this.tier.key) ?? this.match.sfx.minionDie?.();
      const p = this.pos.clone().add(v3(0, this.H * 0.5, 0));
      // it comes APART rather than bursting — planks, lashings and dust, which
      // is what a constructed object does when it fails
      for (let i = 0; i < 18; i++) {
        this.match.fx._spawn(p, {
          color: i % 3 === 0 ? this.tier.accent : this.tier.color,
          size: rand(0.10, 0.32), life: rand(0.35, 0.8),
          vel: v3(rand(-3.5, 3.5), rand(1, 5.5), rand(-3.5, 3.5)), gravity: 9
        });
      }
    }
  }

  // COMMAND: the overwrite. Everything live gets the same point and the same
  // clock; when it runs out they fall back to their own programming.
  command(point, dur, speedMult, dmgMult) {
    this.order = { point: point.clone(), until: dur, speedMult, dmgMult };
    this.state = 'chase';
    this.t = 0;
  }

  update(dt) {
    const m = this.match;
    const g = this.model.group;

    if (this.state === 'dying') {
      this.t -= dt;
      this.reveal = Math.max(0, this.t / 0.9);
      this.model.setReveal(this.reveal);
      this.model.barG.visible = false;
      this.animT += dt;
      this.anim.hurt = true; this.anim.speed = 0; this.anim.collapse = 1 - this.reveal;
      this.model.tick(dt, this.anim);
      g.position.y = this.pos.y + this.model.revealOffset;
      if (this.t <= 0) { m.root.remove(g); return false; }
      return true;
    }

    this.life -= dt;
    if (this.life <= 0 || !this.owner.alive || this.owner.eliminated) { this.die(); return true; }

    // A hostile domain overwhelms it, exactly as it does a transfigured human.
    const d = m.domains.state;
    const hostileDomain = d && d.phase === 'active' && d.caster !== this.owner;
    if (hostileDomain && d.def.sureHit.effect === 'iron_mountain') {
      this.hp -= (d.def.heat?.dps ?? 2.6) * dt;
      if (this.hp <= 0) { this.die(); return true; }
    }

    // EMERGENCE — it does not claw out of the floor the way Mahito's does. It
    // is ASSEMBLED: the pieces settle into place and the lashings pull tight.
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt / Math.max(0.1, this.emergeT));
      this.model.setReveal(this.reveal);
      this.anim.speed = 0;
      this.animT += dt;
      this.model.tick(dt, this.anim);
      g.position.set(this.pos.x, this.pos.y + this.model.revealOffset, this.pos.z);
      g.rotation.y = this.facing;
      this._bar();
      return true;
    }

    // Geto's decoy eye lures constructed bodies exactly as it lures every other
    // summon family. Same substitution, done here rather than in curses.js.
    let target = m.other(this.owner);
    if (this._decoyLure) {
      const lure = this._decoyLure;
      if (lure.alive && flatDist(this.pos, lure.pos) < (lure.def?.decoy?.radius ?? 9)) target = lure;
      else this._decoyLure = null;
    }

    if (this.order) {
      this.order.until -= dt;
      if (this.order.until <= 0) this.order = null;
    }
    const speedMult = this.order?.speedMult ?? 1;
    const dmgMult = (this.order?.dmgMult ?? 1) * this.dmgMult;
    const distT = target ? flatDist(this.pos, target.pos) : 99;

    if (!hostileDomain && target?.alive) {
      this.planT -= dt;
      if (this.planT <= 0) {
        this.planT = rand(1.4, 2.8);
        // THE MASTERWORK'S OWN BEHAVIOUR: it interposes. Not a coin flip on
        // "should I block" like Mahito's minion — a real judgement, taken only
        // when Yaga is actually the one under pressure.
        this.guarding = !!this.tier.guardFor && !this.order
          && flatDist(this.owner.pos, target.pos) < 5.0;
      }
      this.swingT -= dt; this.lungeT -= dt; this.slamT -= dt;

      if (this.state === 'hit') {
        this.t -= dt; if (this.t <= 0) this.state = 'chase';
      } else if (this.state === 'lunge') {
        this.t -= dt;
        const lg = this.tier.lunge;
        const fw = v3(Math.sin(this.facing), 0, Math.cos(this.facing));
        this.pos.addScaledVector(fw, lg.speed * dt);
        if (flatDist(this.pos, target.pos) < this.tier.reach + 0.5) {
          this._connect(target, lg.dmg * dmgMult, lg.kb, lg.hitstun, 'heavy');
          this.state = 'recover'; this.t = 0.45;
        } else if (this.t <= 0) { this.state = 'recover'; this.t = 0.35; }
      } else if (this.state === 'slam') {
        this.t -= dt;
        if (this.t <= 0) {
          const sl = this.tier.slam;
          if (flatDist(this.pos, target.pos) < sl.range) {
            this._connect(target, sl.dmg * dmgMult, sl.kb, sl.hitstun, 'knockdown');
          }
          m.fx._ring(this.pos.clone().setY(this.pos.y + 0.05), this.tier.accent,
            { size: 0.5, growRate: 12, life: 0.4 });
          m.cam.shake(0.3);
          this.state = 'recover'; this.t = 0.7;
        }
      } else if (this.state === 'windup') {
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'recover'; this.t = 0.42;
          if (flatDist(this.pos, target.pos) < this.tier.reach + 0.4) {
            this._connect(target, this.tier.dmg * dmgMult, this.tier.kb, this.tier.hitstun, 'light');
          }
        }
      } else if (this.state === 'recover') {
        this.t -= dt; if (this.t <= 0) this.state = 'chase';
      } else {
        // ---- CHASE / EXECUTE THE TASK LIST -----------------------------------
        let goal;
        if (this.order) goal = this.order.point;
        else if (this.guarding) goal = this.owner.pos.clone().lerp(target.pos, 0.55);
        else goal = target.pos;
        const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
        const dist = Math.hypot(dx, dz);
        const stopAt = (this.order || this.guarding) ? 0.5 : this.tier.reach * 0.82;
        if (dist > stopAt) {
          const sp = this.tier.speed * speedMult * (dist > 5 ? 1.25 : 1);
          this.pos.x += (dx / dist) * sp * dt;
          this.pos.z += (dz / dist) * sp * dt;
        }
        this.facing = yawBetween(this.pos, target.pos);
        // pick an attack: SLAM if it has one and they are close, LUNGE if it
        // has one and they are far, otherwise the swipe
        if (!this.guarding) {
          if (this.tier.slam && this.slamT <= 0 && distT < this.tier.slam.range) {
            this.slamT = this.tier.slam.every * rand(0.85, 1.25);
            this.state = 'slam'; this.t = 0.55;
          } else if (this.tier.lunge && this.lungeT <= 0
            && distT > this.tier.reach + 1.5 && distT < this.tier.lunge.range) {
            this.lungeT = this.tier.lunge.every * rand(0.85, 1.25);
            this.state = 'lunge'; this.t = 0.55;
          } else if (distT < this.tier.reach && this.swingT <= 0) {
            this.swingT = this.tier.swingEvery * rand(0.85, 1.25);
            this.state = 'windup'; this.t = 0.34;
            const fw = v3(Math.sin(this.facing), 0, Math.cos(this.facing));
            this.pos.addScaledVector(fw, 0.22);
          }
        }
      }
    }

    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > this.owner.arenaRadius) { const s = this.owner.arenaRadius / r; this.pos.x *= s; this.pos.z *= s; }
    const bd = m.arena?.bounds;
    if (bd) {
      bd.resolveWalls(this.pos, 0.34);
      this.pos.y = bd.floorAt(this.pos.x, this.pos.z, this.pos.y + 0.55);
    }

    this.animT += dt;
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    this.anim.speed = this.state === 'chase' ? this.tier.speed * speedMult : 0;
    this.anim.hurt = this.state === 'hit';
    this.anim.commanded = !!this.order;
    if (this.state === 'windup') { this.anim.action = 'swipe'; this.anim.actionK = clamp(1 - this.t / 0.34, 0, 1); }
    else if (this.state === 'lunge') { this.anim.action = 'lunge'; this.anim.actionK = 1; }
    else if (this.state === 'slam') { this.anim.action = 'slam'; this.anim.actionK = clamp(1 - this.t / 0.55, 0, 1); }
    else if (this.state === 'recover') { this.anim.action = 'swipe'; this.anim.actionK = clamp(this.t / 0.42, 0, 1); }
    else { this.anim.action = null; this.anim.actionK = 0; }
    this._lodT = (this._lodT ?? 0) - dt;
    if (this._lodT <= 0 && this.model.setLOD) {
      this._lodT = 0.2;
      this.model.setLOD(this.pos.distanceTo(m.stage.camera.position));
    }
    this.model.tick(dt, this.anim);
    g.position.y = this.pos.y + this.model.revealOffset;
    this._bar();
    return true;
  }

  _bar() {
    const mm = this.model;
    mm.barFill.scale.x = Math.max(0.02, this.hp / this.maxHp);
    mm.barFill.material.color.setHex(this.hp < this.maxHp * 0.35 ? 0xd85a4a : this.tier.accent);
    // the lifespan strip under the health bar — a corpse is on a clock and the
    // opponent should be able to see how long they have to survive it
    if (mm.lifeFill) mm.lifeFill.scale.x = Math.max(0.02, this.life / this.maxLife);
  }

  _connect(target, dmg, kb, hitstun, type) {
    const m = this.match;
    if (!target.applyHit) { target.hurt?.(dmg * 1.2, this.owner, { kb: 0.3 }); return; }
    const { dmg: d } = computeDamage(this.owner, dmg, { canCrit: false });
    const r = target.applyHit({
      dmg: d, kb, kbY: type === 'knockdown' ? 0 : 0, hitstun, type,
      attacker: this.owner, isCT: false, minion: true, src: 'summon',
      dir: v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize()
    }, m.ctxFor(this.owner));
    hitFeedback(m, this.owner, target, r, {});
    if (r === 'hit' || r === 'otg') {
      this.owner.gainMaxCE(this.owner.cfg.stats.ceGainPerPunch * 0.35);
      m.domains.transfigChunk(this.owner, target, 'minion', false);
    } else if (r === 'block') {
      m.domains.transfigChunk(this.owner, target, 'minion', true);
    }
  }
}

// ---------------------------------------------------------------------------
// THE BODY — health bar + lifespan strip bolted onto the tier's model
// ---------------------------------------------------------------------------
function buildCorpseModel(tier, scale = 1) {
  const model = buildCursedCorpse(tier.key, { scale });
  const barG = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 0.075),
    new THREE.MeshBasicMaterial({ color: 0x14161f, transparent: true, opacity: 0.78, depthWrite: false }));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.046),
    new THREE.MeshBasicMaterial({ color: tier.accent, transparent: true, opacity: 0.95, depthWrite: false }));
  fill.position.set(0, 0.011, 0.002);
  const lifeBack = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.016),
    new THREE.MeshBasicMaterial({ color: 0x20232c, transparent: true, opacity: 0.7, depthWrite: false }));
  lifeBack.position.set(0, -0.024, 0.002);
  const lifeFill = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x9fb0c4, transparent: true, opacity: 0.9, depthWrite: false }));
  lifeFill.position.set(0, -0.024, 0.003);
  barG.add(back, fill, lifeBack, lifeFill);
  barG.userData.billboard = true;
  barG.position.y = model.height + 0.32;
  model.group.add(barG);
  model.barG = barG;
  model.barFill = fill;
  model.lifeFill = lifeFill;
  return model;
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
export class ConstructionSystem {
  constructor(match) {
    this.match = match;
    this.list = [];
  }

  countFor(owner) {
    let n = 0;
    for (const c of this.list) if (c.owner === owner && c.alive) n++;
    return n;
  }

  aliveFor(owner) { return this.list.filter(c => c.owner === owner && c.alive); }

  // BLOCKED, NOT REPLACED — see the ruling in characters/yaga.js. The one
  // exception is the ultimate, which passes `force` and retires his oldest by
  // his own hand.
  canBuild(owner) { return this.countFor(owner) < (owner.cfg.special?.maxCorpses ?? 2); }

  deploy(owner, tier, opts = {}) {
    if (!tier) return null;
    if (!this.canBuild(owner)) {
      if (!opts.force) { owner.emit('constructCapped'); return null; }
      const oldest = this.aliveFor(owner)[0];
      oldest?.die();
    }
    const c = new Corpse(owner, this.match, tier, opts);
    this.list.push(c);
    owner.emit('corpseDeployed', { tier, ultimate: !!opts.force });
    return c;
  }

  commandAll(owner, point, dur, speedMult, dmgMult) {
    const live = this.aliveFor(owner);
    for (const c of live) c.command(point, dur, speedMult, dmgMult);
    return live.length;
  }

  hurtAt(pos, radius, dmg, attacker) {
    for (const c of this.list) {
      if (!c.alive || c.owner === attacker) continue;
      if (flatDist(c.pos, pos) < radius) c.hurt(dmg, attacker);
    }
  }

  // Melee swings connect with corpses, tagged once per swing — identical to
  // Minions.meleeCheck, and the two run independently so a swing can tag one of
  // each without either system knowing about the other.
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.corpseHit) continue;
      for (const c of this.list) {
        if (!c.alive || c.owner === f) continue;
        const fwd = f.forward();
        const origin = f.pos.clone().addScaledVector(fwd, win.def.reach * 0.7);
        if (flatDist(origin, c.pos) < 1.0) {
          win.corpseHit = true;
          c.hurt(win.def.dmg, f, { kb: win.def.kb * 0.2 });
        }
      }
    }
  }

  update(dt) {
    this.meleeCheck();
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i].update(dt)) this.list.splice(i, 1);
    }
  }

  // ---- THE FINISHER'S CORPSE ----------------------------------------------
  // Same affordance combat/ocean.js exposes for Dagon's cinematic: a corpse
  // placed at a stated point, outside the cap and outside the meter, for a
  // scene rather than for a fight. It is a real Corpse with a real animator —
  // the finisher needs it to walk, swing and be hit — but it does not count
  // against `maxCorpses` and it is cleared with everything else at the end.
  spawnCinematic(owner, tierKey, pos, opts = {}) {
    const tier = (owner.cfg.special?.tiers ?? []).find(t => t.key === tierKey);
    if (!tier) return null;
    const c = new Corpse(owner, this.match, tier, opts);
    if (pos) { c.pos.copy(pos); c.model.group.position.copy(pos); }
    c.cinematic = true;
    this.list.push(c);
    return c;
  }

  // HUD snapshot: what he has standing, for the construction strip.
  snapshot(owner) {
    return this.aliveFor(owner).map(c => ({
      key: c.key, short: c.tier.short, color: c.tier.accent,
      hp: c.hp / c.maxHp, life: c.life / c.maxLife, commanded: !!c.order
    }));
  }

  clear() {
    for (const c of this.list) this.match.root.remove(c.model.group);
    this.list.length = 0;
  }
}

// ===========================================================================
// THE ANTI-SUMMON AUDIT — a FIFTH summon family on the field
// ===========================================================================
// The brief asks specifically whether targeting and AI survive another family
// arriving. They do, and the reason is structural rather than lucky: every
// summon system in this game already treats every OTHER summon system as
// scenery, and none of them enumerate each other.
//
//   MEGUMI'S SHIKIGAMI (combat/shikigami.js)  target `match.other(owner)`, a
//     FIGHTER. A corpse is not a fighter and never enters their target set.
//     Their melee check walks `match.activeFighters`, same as this file's.
//   GETO'S CURSES (combat/curses.js)          same, plus the DECOY EYE, which
//     writes `_decoyLure` onto hostile summons by duck-typing. This file reads
//     that field in `update`, so Geto's decoy works on Yaga's corpses on the
//     day it was written, with no change to curses.js.
//   MAHITO'S MINION (combat/minion.js)        same shape. It ignores corpses
//     and corpses ignore it; the two lists never meet.
//   YUKI'S GARUDA (combat/garuda.js)          always-on ally, same rule.
//   DAGON'S OCEAN (combat/ocean.js)           same, including the sure-hit
//     path, which resolves against fighters only.
//
// So a Yaga vs Geto match with two corpses, four curses and a decoy on the
// field has every body chasing a FIGHTER and nothing chasing another summon —
// which is the pre-existing behaviour for every pair of families already in the
// game and is correct: none of these techniques were ever a way to attack
// somebody else's summon. The ONE thing that reaches across is a melee swing or
// an area technique, and both go through `hurtAt` / `meleeCheck`, which every
// family implements identically.
