// THE TEN SHADOWS — shikigami as a real system rather than three reskinned
// projectiles. Six creatures, each with its own body plan, its own animator
// (see art/models/shikigami.js) and its own way of taking up space.
//
// THE RULE THAT MAKES IT MEGUMI: PERMANENT LOSS. A shikigami that is killed in
// combat is gone for the rest of the match — it cannot be re-summoned, it is
// greyed out on the wheel, and Megumi is measurably weaker for the rest of the
// fight. Nothing else in the roster spends a resource that never comes back.
// The one exception is the domain: Chimera Shadow Garden restores everything
// he has lost, but only while it holds.
//
// Loss is tracked PER OWNER, so Yuta's copied Divine Dog dying costs Megumi
// nothing — and a shikigami that is dismissed (rather than destroyed) is not
// lost either. That distinction is the whole risk/reward: retreating a hurt
// dog by letting the domain lapse is a real decision.
import * as THREE from 'three';
import { v3, rand, flatDist, yawBetween } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import {
  buildDivineDog, buildNue, buildToad, buildGreatSerpent,
  buildMaxElephant, buildRabbitSwarm
} from '../art/models/shikigami.js';
import {
  buildRoundDeer, buildPiercingOx, buildTigerFuneral
} from '../art/models/shikigami_beasts.js';
import {
  buildDivineDogTotality, buildMergedBeastAgito, buildWingedToads
} from '../art/models/shikigami_fusions.js';

const BUILDERS = {
  divineDogs: opts => buildDivineDog(!!opts.white),
  nue: () => buildNue(),
  toad: () => buildToad(),
  serpent: () => buildGreatSerpent(),
  elephant: () => buildMaxElephant(),
  rabbits: def => buildRabbitSwarm(def.swarm ?? 20),
  roundDeer: () => buildRoundDeer(),
  piercingOx: () => buildPiercingOx(),
  tigerFuneral: () => buildTigerFuneral(),
  totality: () => buildDivineDogTotality(),
  agito: () => buildMergedBeastAgito(),
  wellsAbyss: def => buildWingedToads(def.count ?? 3)
};

const EMERGE_TIME = 0.42;
const DISSOLVE_TIME = 0.55;

// The canonical table, imported so a borrowed shikigami (Yuta's Copy) can be
// built without its owner having a shikigami block in their config.
import { SHIKIGAMI_DEFS as BORROWED_DEFS } from '../characters/megumi.js';

// ---------------------------------------------------------------------------
// One shikigami body. `pairIndex` is only meaningful for the Divine Dogs: the
// pair is ONE summon (one slot, one cost, one cooldown) with two independent
// bodies, and killing one leaves the other on the field exactly as it was.
// ---------------------------------------------------------------------------
class Shiki {
  constructor(sys, owner, def, opts = {}) {
    this.sys = sys;
    this.match = sys.match;
    this.owner = owner;
    this.def = def;
    this.key = def.key;
    this.temp = !!opts.temp;          // a borrowed copy — never counts as a loss
    this.pairIndex = opts.pairIndex ?? 0;
    this.group = opts.group ?? null;   // shared summon record for paired bodies

    this.model = BUILDERS[def.key](def.key === 'divineDogs' ? { white: this.pairIndex === 0 } : def);
    // per-species scratch state that does not belong on `anim`
    this.charge = 0;            // Piercing Ox: metres of runway already eaten
    this.chargeFrom = null;     // Piercing Ox: where this charge started
    this.healT = 0;             // Round Deer / Agito: heal tick accumulator
    this.grabbedActor = null;   // Agito: who the snake tail is holding
    this.intercepts = def.intercepts ?? 0;   // Winged Toads: projectiles left to catch
    this.hp = this.maxHp = def.hp * (opts.hpMult ?? 1);
    this.life = def.life;
    this.pos = (opts.at || owner.pos.clone()).clone();
    this.pos.y = 0;
    this.facing = owner.facing;
    this.state = 'emerge';
    this.t = 0;
    this.reveal = 0;
    this.dead = false;
    this.destroyed = false;            // died to damage => permanent loss
    this.swingT = def.swingEvery * rand(0.25, 0.6);
    this.actionK = 0;
    this.hurtT = 0;
    this.speed = 0;
    this.anim = {};                    // per-type animator state handed to model.tick
    this.guardCharges = def.guard ? 1 : 0;
    this.smokeT = 0;

    // floating health bar, same language as Mahito's transfigured human
    const barG = new THREE.Group();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.075),
      new THREE.MeshBasicMaterial({ color: 0x0a0c14, transparent: true, opacity: 0.8, depthWrite: false }));
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x8fb6d8, transparent: true, opacity: 0.95, depthWrite: false }));
    fill.position.z = 0.002;
    barG.add(back, fill);
    barG.userData.billboard = true;   // camera-facing, aimed per eye in core/stage.js
    barG.position.y = this.model.height + 0.34;
    this.model.group.add(barG);
    this.barG = barG;
    this.barFill = fill;

    this.model.group.position.copy(this.pos);
    this.match.root.add(this.model.group);
  }

  get alive() { return !this.dead && this.hp > 0; }
  // Rabbit Escape is a hazard field, not a fighter: swings pass through it.
  get targetable() { return this.alive && this.key !== 'rabbits' && this.state !== 'emerge'; }
  // Round Deer never attacks anything, ever — the canon description is a pure
  // support shikigami and `support` is what every AI branch reads to stay out
  // of the targeting code entirely.
  get support() { return !!this.def.support; }

  hurt(dmg, attacker, opts = {}) {
    if (this.dead || this.state === 'emerge') return;
    this.hp -= dmg;
    this.hurtT = 0.24;
    if (attacker) {
      const kb = v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z).normalize();
      this.pos.addScaledVector(kb, opts.kb ?? 0.35);
    }
    this.match.fx.hitSpark(this.pos.clone().add(v3(0, this.model.height * 0.6, 0)), 'light');
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die(true);
  }

  // destroyed = true means it was KILLED (permanent loss). Dismissed shikigami
  // (domain collapse, owner KO, timer expiry) pass false and stay available.
  // destroyed = true means it was KILLED, and that is permanent for the REST
  // OF THE MATCH (it survives round resets). Dismissed shikigami — domain
  // collapse, the timer running out, the owner going down, the Toad spending
  // itself on a block — pass false and stay available.
  die(destroyed) {
    if (this.dead) return;
    this.dead = true;
    // `expendable` is The Well's Unknown Abyss and it is canon, not a
    // concession: the winged toads "can be destroyed without any consequence".
    // They are the one thing Megumi can put on the field and lose for free.
    this.destroyed = !!destroyed && !this.temp && !this.def.expendable;
    this.state = 'dying';
    this.t = DISSOLVE_TIME;
    const p = this.pos.clone().add(v3(0, this.model.height * 0.45, 0));
    for (let i = 0; i < 16; i++) {
      this.match.fx._spawn(p.clone().add(v3(rand(-0.4, 0.4), rand(-0.2, 0.4), rand(-0.4, 0.4))), {
        color: i % 3 === 0 ? 0x8fb6d8 : 0x0a0c14, size: rand(0.14, 0.4), life: rand(0.3, 0.65),
        vel: v3(rand(-2, 2), rand(0.5, 3.5), rand(-2, 2)), gravity: 3
      });
    }
    if (this.destroyed) {
      this.match.sfx.shikigamiLost?.();
      this.match.hud.toast(this.owner, this.def.short + ' LOST FOR THE MATCH');
      this.sys._recordLoss(this.owner, this.key);
    } else {
      this.match.sfx.shikigamiDismiss?.();
    }
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt) {
    const m = this.match;
    const g = this.model.group;

    if (this.state === 'dying') {
      this.t -= dt;
      this.reveal = Math.max(0, this.t / DISSOLVE_TIME);
      this.model.setReveal(this.reveal);
      this.barG.visible = false;
      if (this.t <= 0) { m.root.remove(g); return false; }
      this.model.tick(dt, this.anim);
      return true;
    }

    // owner gone, or timed out
    this.life -= dt;
    if (!this.owner.alive || this.owner.eliminated) { this.die(false); return true; }
    if (this.life <= 0) { this.die(false); return true; }

    // ---- hostile domains -------------------------------------------------
    // A domain is the caster's world; a shikigami standing in someone else's
    // is on borrowed ground. Each one that has a defined interaction:
    //   UNLIMITED VOID  — Megumi is locked out of his own head, so the link
    //                     severs. Everything DISMISSES (no loss): brutal, but
    //                     it does not cost him the match's worth of summons.
    //   IRON MOUNTAIN   — Jogo's heat cooks them like it cooks Mahito's
    //                     minion. They can genuinely die in there, and that
    //                     death IS a permanent loss.
    //   SELF-EMBODIMENT — Idle Transfiguration reshapes souls. Shadow
    //                     constructs do not have one, so they keep fighting
    //                     while Megumi's own gauge drains. This is his best
    //                     matchup into Mahito and it should be.
    const d = m.domains.state;
    const hostile = d && d.phase === 'active' && d.caster !== this.owner;
    if (hostile) {
      const eff = d.def.sureHit.effect;
      if (eff === 'void_lock') { this.die(false); return true; }
      if (eff === 'iron_mountain') {
        this.hp -= (d.def.heat?.dps ?? 2.6) * 1.1 * dt;
        if (this.hp <= 0) { this.die(true); return true; }
      }
    }

    // emerge out of the shadow pool
    if (this.state === 'emerge') {
      this.t += dt;
      this.reveal = Math.min(1, this.t / EMERGE_TIME);
      this.model.setReveal(this.reveal);
      if (this.t >= EMERGE_TIME) { this.state = 'chase'; this.t = 0; }
    } else if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 3);
      this.model.setReveal(this.reveal);
    }

    if (this.hurtT > 0) this.hurtT -= dt;
    let target = m.other(this.owner);
    // ---- GETO'S DECOY EYE ---------------------------------------------------
    // A decoy curse standing nearby writes `_decoyLure` onto this shikigami
    // (see CurseSystem's role tick), and while that lure is alive and close it
    // becomes the thing this shikigami is fighting. Implemented HERE as a
    // target substitution rather than by rewriting every per-species AI: each
    // of them already chases whatever it is handed.
    //
    // The support shikigami are exempt. Round Deer has no aggression to
    // redirect, and a decoy that could pull Megumi's healer off him would be
    // doing something the reference never claims for it.
    if (this._decoyLure && !this.support) {
      const lure = this._decoyLure;
      if (lure.alive && flatDist(this.pos, lure.pos) < (lure.def.decoy?.radius ?? 9)) target = lure;
      else this._decoyLure = null;
    }
    if (this.state !== 'emerge' && target?.alive) this._behave(dt, target);

    // smoke wisping off the silhouette — the shared family tell
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = rand(0.10, 0.22);
      m.fx._spawn(this.pos.clone().add(v3(rand(-0.3, 0.3) * this.model.radius, rand(0.2, 1) * this.model.height, rand(-0.3, 0.3) * this.model.radius)), {
        color: Math.random() < 0.35 ? 0x8fb6d8 : 0x0d1018, size: rand(0.1, 0.26),
        life: rand(0.3, 0.6), opacity: 0.55, vel: v3(rand(-0.3, 0.3), rand(0.4, 1.2), rand(-0.3, 0.3))
      });
    }

    // stay inside the map
    const bounds = m.arena.bounds;
    if (bounds) bounds.clampXZ(this.pos, this.model.radius * 0.4);

    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    // LOD: the outline hulls are a second full pass over the geometry and they
    // are two pixels wide past a dozen metres. Cheap to check, and with a full
    // field of summons it is a third of the draw calls.
    this._lodT = (this._lodT ?? 0) - dt;
    if (this._lodT <= 0 && this.model.setLOD) {
      this._lodT = 0.2;
      this.model.setLOD(this.pos.distanceTo(m.stage.camera.position));
    }
    this.anim.speed = this.speed;
    this.anim.hurt = this.hurtT > 0;
    this.model.tick(dt, this.anim);

    this.barG.visible = this.key !== 'rabbits';
    this.barFill.scale.x = Math.max(0.02, this.hp / this.maxHp);
    this.barFill.material.color.setHex(this.hp < this.maxHp * 0.35 ? 0xd85a4a : 0x8fb6d8);
    return true;
  }

  // ---- movement helper ----------------------------------------------------
  _moveTo(goal, speed, dt, stopAt = 0) {
    const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist <= stopAt) { this.speed = 0; return dist; }
    const step = Math.min(dist - stopAt, speed * dt);
    this.pos.x += (dx / dist) * step;
    this.pos.z += (dz / dist) * step;
    this.speed = speed;
    return dist;
  }
  _face(p, dt, rate = 9) {
    const want = yawBetween(this.pos, p);
    let diff = want - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing += diff * Math.min(1, rate * dt);
  }

  // apply a hit to the opponent, routed through the normal damage pipeline so
  // blocking, i-frames, juggles and the CE economy all behave exactly as they
  // do for a hit thrown by a fighter
  _strike(target, { dmg, kb, kbY = 0, hitstun, type = 'light', unblockable = false }) {
    const m = this.match;
    // A DECOY IS NOT A FIGHTER. Geto's decoy eye can substitute itself for the
    // opponent in every per-species AI above (see `_decoyLure`), and a curse
    // has no `applyHit` — it has HP and a `hurt`. Routing it here means none of
    // the eleven behaviours had to learn the difference.
    if (!target.applyHit) { target.hurt?.(dmg * 1.3, this.owner, { kb: 0.4 }); return 'summon'; }
    const { dmg: out } = computeDamage(this.owner, dmg, { canCrit: false });
    const r = target.applyHit({
      dmg: out, kb, kbY, hitstun, type, attacker: this.owner, isCT: false,
      shikigami: this.key, unblockable,
      // adaptation category: every shikigami bite, dive, tongue and torrent is
      // the same source — SUMMONS. Adapting to Megumi's hands does nothing
      // about his dogs, and vice versa.
      src: 'summon',
      dir: v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize()
    }, m.ctxFor(this.owner));
    hitFeedback(m, this.owner, target, r, { heavy: type !== 'light' });
    if (r === 'hit' || r === 'otg') {
      // shikigami feed REDUCED MAX_CE growth — they pressure, they do not
      // build his bar for him
      this.owner.gainMaxCE(this.owner.cfg.stats.ceGainPerPunch * (this.def.ceFeed ?? 0.3));
    }
    return r;
  }

  // ---- STUNS, SAFELY -------------------------------------------------------
  // Five of the eleven behaviours above follow a landed hit with a STUN — Nue's
  // shock, the Serpent's coil, Agito's grab and discharge, the winged toads'
  // tongue. All of them used to reach straight into `rootT`, `vel` and
  // `setState`, which is fine for a Fighter and a crash for anything else.
  //
  // It stopped being hypothetical when Geto's DECOY EYE arrived: it substitutes
  // itself for the opponent in every one of those behaviours (see
  // `_decoyLure`), and a curse has none of those three. This is the one place
  // that difference is handled, so no behaviour has to know about it.
  _stun(target, dur, label) {
    if (!target || !target.setState) return false;      // a summon, not a fighter
    target.rootT = Math.max(target.rootT, dur);
    target.vel?.set(0, 0, 0);
    if (!['knockdown', 'launched', 'getup', 'ko'].includes(target.state)) {
      target.setState('rooted', { clip: 'stunned' });
    }
    if (label) this.match.hud.toast(target, label);
    return true;
  }

  // a shikigami will maul Mahito's transfigured human if one wanders in — the
  // two summoners' pets genuinely fight each other rather than passing through
  _nearestHostileMinion(range) {
    const list = this.match.minions?.list;
    if (!list?.length) return null;
    let best = null, bd = range;
    for (const mn of list) {
      if (!mn.alive || mn.owner === this.owner) continue;
      const d = flatDist(this.pos, mn.pos);
      if (d < bd) { bd = d; best = mn; }
    }
    return best;
  }

  // ---- per-species AI -----------------------------------------------------
  _behave(dt, target) {
    switch (this.key) {
      case 'divineDogs': return this._dog(dt, target);
      case 'nue': return this._nue(dt, target);
      case 'toad': return this._toad(dt, target);
      case 'serpent': return this._serpent(dt, target);
      case 'elephant': return this._elephant(dt, target);
      case 'rabbits': return this._rabbits(dt, target);
      case 'roundDeer': return this._deer(dt, target);
      case 'piercingOx': return this._ox(dt, target);
      case 'tigerFuneral': return this._tiger(dt, target);
      case 'totality': return this._totality(dt, target);
      case 'agito': return this._agito(dt, target);
      case 'wellsAbyss': return this._abyss(dt, target);
    }
  }

  // ROUND DEER — the only shikigami in the game that never attacks. It shadows
  // Megumi at a short offset, stays out of his lane, and pours reverse cursed
  // technique into him for as long as it survives. The second half of the canon
  // description — "counteract the cursed energy of their opponent" — is the CE
  // drain: standing in the deer's field costs the OPPONENT cursed energy, which
  // is a far more interesting effect in a fighter than another heal.
  _deer(dt, target) {
    const def = this.def, h = def.heal;
    this.anim.action = null;
    // hold station just behind and beside the owner, never between him and the
    // fight — it is fragile and walking it into the pocket is how it dies
    const back = v3(this.owner.pos.x - target.pos.x, 0, this.owner.pos.z - target.pos.z).normalize();
    const post = this.owner.pos.clone().addScaledVector(back, 1.6)
      .add(v3(back.z, 0, -back.x).multiplyScalar(0.9));
    this._moveTo(post, def.speed, dt, 0.35);
    this._face(this.owner.pos, dt, 5);

    this.healT -= dt;
    const inRange = flatDist(this.pos, this.owner.pos) <= h.radius;
    // the aura reads 0..1 so the model can bloom while it is actually working
    this.anim.heal = Math.max(0, Math.min(1, (this.anim.heal ?? 0) + (inRange ? dt * 3 : -dt * 3)));
    if (this.healT > 0 || !inRange) return;
    this.healT = h.tick;
    const m = this.match;
    const before = this.owner.res.hp;
    this.owner.res.hp = Math.min(this.owner.res.maxHp ?? this.owner.cfg.stats.hp,
      this.owner.res.hp + h.rate * h.tick);
    const gained = this.owner.res.hp - before;
    // NEUTRALISE: the opponent's cursed energy is eaten if they stand in it
    if (target?.res && target.alive && flatDist(target.pos, this.pos) <= h.radius) {
      target.res.curCE = Math.max(0, target.res.curCE - h.ceDrain * h.tick);
    }
    if (gained > 0.01) {
      // positive energy motes drifting from the deer's muzzle to Megumi — the
      // only way a player can tell the summon is doing anything at all
      const from = this.pos.clone().add(v3(0, this.model.height * 0.72, 0));
      const to = this.owner.pos.clone().add(v3(0, 1.1, 0));
      for (let i = 0; i < 2; i++) {
        m.fx._spawn(from.clone().add(v3(rand(-0.2, 0.2), rand(-0.1, 0.2), rand(-0.2, 0.2))), {
          color: i % 2 ? 0xffd98a : 0xfff2d0, size: rand(0.08, 0.18), life: 0.36, opacity: 0.8,
          vel: to.clone().sub(from).multiplyScalar(2.4)
        });
      }
    }
  }

  // PIERCING OX — the runway. Three states and the middle one is the creature:
  //   BACK UP    retreat away from the target to buy distance
  //   CHARGE     commit in a straight line, accumulating `charge` metres
  //   OVERRUN    it does not stop on contact; canon has Yorozu grabbing its
  //              horns to stop it after the hit landed
  // Damage is chargeMin + metres * dmgPerMetre, capped. The number is computed
  // from POSITION, not from a timer, so a charge that gets body-blocked early
  // genuinely does less.
  _ox(dt, target) {
    const def = this.def;
    if (this.state === 'act') {
      // committed. It can barely steer — the straight line is the counterplay.
      this.t -= dt;
      const from = this.pos.clone();
      this._face(target.pos, dt, def.chargeTurnRate);
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.chargeSpeed * dt);
      this.speed = def.chargeSpeed;
      this.charge += flatDist(from, this.pos);
      this.anim.charge = Math.min(1, this.charge / def.runwayMax);
      // dust off the hooves, scaling with how bad this is about to be
      if (Math.random() < 0.55 + this.anim.charge * 0.4) {
        this.match.fx._spawn(this.pos.clone().add(v3(rand(-0.5, 0.5), 0.08, rand(-0.5, 0.5))), {
          color: this.anim.charge > 0.6 ? 0xd8c24a : 0x2a2620,
          size: rand(0.2, 0.5 + this.anim.charge * 0.5), life: 0.45, opacity: 0.55,
          vel: v3(rand(-1.4, 1.4), rand(0.6, 2.4), rand(-1.4, 1.4))
        });
      }
      if (!this.hitThisRush && flatDist(this.pos, target.pos) < def.reach) {
        this.hitThisRush = true;
        const dmg = Math.min(def.chargeMax, def.chargeMin + this.charge * def.dmgPerMetre);
        const r = this._strike(target, {
          dmg, kb: def.kb * (0.5 + this.anim.charge), kbY: def.kbY,
          hitstun: def.hitstun, type: 'knockdown'
        });
        if (r === 'hit' || r === 'otg') {
          this.match.cam.shake(0.35 + this.anim.charge * 0.75);
          this.match.hitstop(4 + Math.round(this.anim.charge * 8));
          this.match.hud.toast(this.owner, 'PIERCED — ' + Math.round(this.charge) + 'm · ' + Math.round(dmg));
          this.match.sfx.oxImpact?.();
          this.match.arena.destruct?.damageAt(this.pos, 2.0, 18 + this.anim.charge * 30);
        }
        // OVERRUN: it keeps going past them
        this.t = Math.min(this.t, def.overrun / def.chargeSpeed);
      }
      const mn = this._nearestHostileMinion(def.reach);
      if (mn) mn.hurt(def.chargeMin + this.charge * def.dmgPerMetre * 0.5, this.owner, { kb: 1.2 });
      if (this.t <= 0) {
        this.state = 'recover'; this.t = 1.1;
        this.charge = 0; this.anim.charge = 0; this.hitThisRush = false;
      }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.speed = 0;
      this.anim.charge = Math.max(0, (this.anim.charge ?? 0) - dt * 3);
      this._face(target.pos, dt, 3);
      if (this.t <= 0) this.state = 'chase';
      return;
    }
    // BACKING UP. It walks AWAY to buy runway, and it will not commit until it
    // has `runwayWant` metres — which is why the summon telegraphs so loudly.
    this.swingT -= dt;
    const d = flatDist(this.pos, target.pos);
    this._face(target.pos, dt, 4);
    if (d < def.runwayWant) {
      const away = v3(this.pos.x - target.pos.x, 0, this.pos.z - target.pos.z).normalize();
      this.pos.addScaledVector(away, def.runwaySpeed * dt);
      this.speed = def.runwaySpeed;
      // pawing the ground while it lines up — pure telegraph
      this.anim.charge = Math.min(0.35, (this.anim.charge ?? 0) + dt * 0.5);
    } else {
      this._moveTo(target.pos, def.speed, dt, def.runwayWant * 0.95);
    }
    if (this.swingT <= 0 && d >= def.runwayWant * 0.9 && d < def.runwayMax) {
      this.swingT = def.swingEvery * rand(0.9, 1.2);
      this.state = 'act';
      // enough time to cross the whole runway plus the overrun
      this.t = (d + def.overrun) / def.chargeSpeed;
      this.charge = 0;
      this.hitThisRush = false;
      this.match.sfx.oxCharge?.();
      this.match.hud.toast(this.owner, 'OX — ' + Math.round(d) + 'm RUNWAY');
    }
  }

  // TIGER FUNERAL — *** ORIGINAL INTERPRETATION, NOT CANON. ***
  // Deliberately the least surprising AI in the file, because "no standout
  // strength and no standout weakness" is the whole design: it closes, it
  // swipes on a mid-length timer, and every so often it covers ground with a
  // pounce. Nothing it does needs to be learned.
  _tiger(dt, target) {
    const def = this.def;
    this.anim.action = null;
    const mn = this._nearestHostileMinion(2.4);
    const goalActor = mn || target;
    const goal = goalActor.pos;

    if (this.state === 'pounce') {
      this.t -= dt;
      this.anim.action = 'pounce';
      this.anim.actionK = 1 - Math.max(0, this.t / 0.42);
      this._face(goal, dt, 7);
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.lungeSpeed * 1.3 * dt);
      this.pos.y = Math.max(0, Math.sin((1 - this.t / 0.42) * Math.PI) * 1.1);
      this.speed = def.lungeSpeed;
      if (this.t <= 0) {
        this.pos.y = 0;
        this.state = 'recover'; this.t = 0.45;
        if (flatDist(this.pos, goal) < def.reach + 0.8) {
          if (mn) mn.hurt(def.pounceDmg, this.owner, { kb: 0.8 });
          else this._strike(target, { dmg: def.pounceDmg, kb: def.kb * 1.4, hitstun: def.hitstun + 8, type: 'heavy' });
          this.match.cam.shake(0.28);
          this.match.sfx.shikigamiBite?.();
        }
      }
      return;
    }
    if (this.state === 'wind') {
      this.t -= dt;
      this.anim.action = 'swipe';
      this.anim.actionK = 1 - Math.max(0, this.t / 0.26);
      this._face(goal, dt, 13);
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.lungeSpeed * 0.7 * dt);
      this.speed = def.lungeSpeed * 0.7;
      if (this.t <= 0) {
        this.state = 'recover'; this.t = 0.32;
        if (flatDist(this.pos, goal) < def.reach + 0.5) {
          if (mn) mn.hurt(def.dmg * 1.6, this.owner, { kb: 0.6 });
          else this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
          this.match.sfx.shikigamiBite?.();
        }
      }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      const away = v3(this.pos.x - goal.x, 0, this.pos.z - goal.z).normalize();
      this.pos.addScaledVector(away, def.speed * 0.4 * dt);
      this.speed = def.speed * 0.4;
      this._face(goal, dt, 6);
      if (this.t <= 0) this.state = 'chase';
      return;
    }

    this.swingT -= dt;
    this.pounceT = (this.pounceT ?? def.pounceEvery * 0.6) - dt;
    const d = flatDist(this.pos, goal);
    this._moveTo(goal, def.speed, dt, def.reach * 0.75);
    this._face(goal, dt, 8);
    if (this.pounceT <= 0 && d > def.reach + 1.6 && d < def.pounceRange) {
      this.pounceT = def.pounceEvery * rand(0.85, 1.25);
      this.state = 'pounce'; this.t = 0.42;
      return;
    }
    if (d < def.reach + 0.4 && this.swingT <= 0) {
      this.swingT = def.swingEvery * rand(0.85, 1.2);
      this.state = 'wind'; this.t = 0.26;
    }
  }

  // DIVINE DOG: TOTALITY — the Dogs' behaviour with the numbers of something
  // that ate its twin. It does not weave (there is no pair to weave WITH); it
  // closes in a straight line at nine and a half metres a second and opens with
  // the claws. "Immense speed" is the canon phrase and it is what this is.
  _totality(dt, target) {
    const def = this.def;
    this.anim.action = null;
    const mn = this._nearestHostileMinion(2.4);
    const goalActor = mn || target;
    const goal = goalActor.pos;

    if (this.state === 'wind') {
      this.t -= dt;
      this.anim.action = 'slash';
      this.anim.actionK = 1 - Math.max(0, this.t / 0.20);
      this._face(goal, dt, 16);
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.lungeSpeed * dt);
      this.speed = def.lungeSpeed;
      if (this.t <= 0) {
        this.state = 'recover'; this.t = 0.26;
        if (flatDist(this.pos, goal) < def.reach + 0.6) {
          if (mn) mn.hurt(def.dmg * 1.8, this.owner, { kb: 0.9 });
          else this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'heavy' });
          // the claw read: three parallel slashes
          const p = this.pos.clone().add(v3(0, 1.2, 0));
          for (let i = 0; i < 12; i++) {
            this.match.fx._spawn(p.clone().add(v3(rand(-0.5, 0.5), rand(-0.4, 0.4), rand(-0.2, 0.6))), {
              color: i % 3 === 0 ? 0xbfe0ff : 0xe8f2ff, size: rand(0.10, 0.28), aspect: 0.28, life: 0.22,
              vel: v3(rand(-5, 5), rand(-2, 3), rand(2, 7))
            });
          }
          this.match.cam.shake(0.22);
          this.match.sfx.shikigamiBite?.();
        }
      }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this._face(goal, dt, 8);
      this.speed = 0;
      if (this.t <= 0) this.state = 'chase';
      return;
    }
    this.swingT -= dt;
    this._moveTo(goal, def.speed, dt, def.reach * 0.7);
    this._face(goal, dt, 10);
    if (flatDist(this.pos, goal) < def.reach + 0.4 && this.swingT <= 0) {
      this.swingT = def.swingEvery * rand(0.85, 1.15);
      this.state = 'wind'; this.t = 0.20;
    }
  }

  // MERGED BEAST AGITO — three tools on three independent timers, which is
  // what "attack, defend, and provide support" means in practice:
  //   GRAB   the snake tail catches and holds them in place
  //   ZAP    the electricity between its palms, wide and stunning
  //   REGEN  it repairs itself AND Megumi, continuously, for free
  // Canon has it working in tandem with Mahoraga by following up every attack
  // and trying to pin Gojo, so grabbing is its primary and the damage is a
  // by-product.
  _agito(dt, target) {
    const def = this.def;
    this.anim.action = null;

    // ---- REGENERATION, always on -------------------------------------------
    // "regenerate with Round Deer's reverse cursed technique" — it healed a
    // Black Flash through the abdomen and a severed tail head. It is why Gojo
    // killed it before Mahoraga.
    this.hp = Math.min(this.maxHp, this.hp + def.regen * dt);
    this.healT -= dt;
    if (this.healT <= 0) {
      this.healT = 0.3;
      if (flatDist(this.pos, this.owner.pos) < def.healRadius) {
        this.owner.res.hp = Math.min(this.owner.res.maxHp ?? this.owner.cfg.stats.hp,
          this.owner.res.hp + def.ownerHeal * 0.3);
      }
    }
    this.anim.heal = 0.35 + Math.sin(this.life * 2.2) * 0.15;

    if (this.state === 'zap') {
      this.t -= dt;
      // a long, visible charge — this is the biggest hit it has and the
      // opponent has to be given the chance to leave
      const k = 1 - Math.max(0, this.t / (def.zapCharge + 0.35));
      this.anim.charge = Math.min(1, k * 1.6);
      this._face(target.pos, dt, 4);
      this.speed = 0;
      if (!this.fired && this.t <= 0.35) {
        this.fired = true;
        this._agitoZap(target);
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.7; this.anim.charge = 0; }
      return;
    }
    if (this.state === 'grab') {
      this.t -= dt;
      this.anim.action = 'grab';
      this.anim.actionK = Math.min(1, 1 - this.t / def.grabHold);
      this._face(target.pos, dt, 8);
      this.speed = 0;
      if (this.grabbedActor === target) {
        // held: pinned in place while Megumi does whatever he likes
        this._stun(target, 0.12, null);
      } else if (!this.fired) {
        this.fired = true;
        if (flatDist(this.pos, target.pos) < def.grabRange) {
          const r = this._strike(target, {
            dmg: def.grabDmg, kb: 0, hitstun: def.hitstun, type: 'heavy'
          });
          if (r === 'hit' || r === 'otg') {
            this.grabbedActor = target;
            this._stun(target, def.grabHold, 'SEIZED');
            this.match.cam.shake(0.4);
            this.match.sfx.serpentCoil?.();
          }
        }
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.6; this.grabbedActor = null; }
      return;
    }
    if (this.state === 'wind') {
      this.t -= dt;
      this.anim.action = 'grab';
      this.anim.actionK = 1 - Math.max(0, this.t / 0.3);
      this._face(target.pos, dt, 10);
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.speed * 1.4 * dt);
      this.speed = def.speed * 1.4;
      if (this.t <= 0) {
        this.state = 'recover'; this.t = 0.4;
        if (flatDist(this.pos, target.pos) < def.reach + 0.7) {
          this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'heavy' });
          this.match.cam.shake(0.3);
        }
      }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.speed = 0;
      this.anim.charge = Math.max(0, (this.anim.charge ?? 0) - dt * 3);
      if (this.t <= 0) { this.state = 'chase'; this.fired = false; }
      return;
    }

    this.swingT -= dt;
    this.grabT = (this.grabT ?? def.grabEvery * 0.4) - dt;
    this.zapT = (this.zapT ?? def.zapEvery * 0.7) - dt;
    const d = this._moveTo(target.pos, def.speed, dt, def.reach * 0.8);
    this._face(target.pos, dt, 5);
    if (this.zapT <= 0 && d < def.zapRange) {
      this.zapT = def.zapEvery * rand(0.9, 1.15);
      this.state = 'zap'; this.t = def.zapCharge + 0.35; this.fired = false;
      this.match.hud.toast(this.owner, '顎吐 — DISCHARGE');
      this.match.sfx.nueDive?.();
      return;
    }
    if (this.grabT <= 0 && d < def.grabRange + 0.6) {
      this.grabT = def.grabEvery * rand(0.9, 1.2);
      this.state = 'grab'; this.t = def.grabHold; this.fired = false;
      return;
    }
    if (d < def.reach + 0.5 && this.swingT <= 0) {
      this.swingT = def.swingEvery * rand(0.85, 1.2);
      this.state = 'wind'; this.t = 0.3;
    }
  }

  _agitoZap(target) {
    const m = this.match, def = this.def;
    const from = this.pos.clone().add(v3(0, this.model.height * 0.55, 0));
    m.sfx.nueShock?.();
    m.cam.shake(0.7);
    m.cam.fovKick(6);
    m.stage.flash(0.24);
    // a forked discharge crossing the gap
    for (let i = 0; i < 34; i++) {
      const k = i / 33;
      const p = from.clone().lerp(target.pos.clone().setY(1.1), k)
        .add(v3(rand(-0.7, 0.7), rand(-0.5, 0.7), rand(-0.7, 0.7)));
      m.fx._spawn(p, {
        color: i % 3 === 0 ? 0xe8d8ff : 0xa878e0, size: rand(0.14, 0.4), aspect: 0.3,
        life: rand(0.14, 0.3), vel: v3(rand(-5, 5), rand(-2, 5), rand(-5, 5))
      });
    }
    m.fx._ring(from, 0xc8a8ff, { size: 0.7, growRate: 18, life: 0.35, flat: false });
    for (const f of m.activeFighters) {
      if (f === this.owner || !f.alive) continue;
      if (flatDist(f.pos, this.pos) > def.zapRange) continue;
      const r = this._strike(f, {
        dmg: def.zapDmg, kb: 4.5, kbY: 1.0, hitstun: def.hitstun + 10, type: 'heavy'
      });
      if (r === 'hit' || r === 'otg') this._stun(f, def.zapStun, 'SHOCKED');
    }
    m.minions?.hurtAt(this.pos, def.zapRange, def.zapDmg * 0.7, this.owner);
    m.curses?.hurtAt(this.pos, def.zapRange, def.zapDmg * 0.7, this.owner);
  }

  // THE WELL'S UNKNOWN ABYSS — a flight of winged toads that orbits Megumi.
  // Canon gives them exactly two jobs and they do exactly those two:
  //   RESTRAIN            a tongue out to root the opponent briefly
  //   CATCH PROJECTILES   `intercepts` incoming projectiles are eaten outright,
  //                       which nothing else in the game does. See
  //                       ShikigamiSystem.tryCatchProjectile.
  // The model rides ON Megumi rather than standing on the ground, so the entity
  // tracks him instead of chasing.
  _abyss(dt, target) {
    const def = this.def;
    // the flight stays with its summoner — its value is the screen AROUND him
    this._moveTo(this.owner.pos, def.speed, dt, 0.2);
    this._face(target.pos, dt, 6);
    this.anim.tongue = this.anim.tongue ?? 0;

    if (this.state === 'act') {
      this.t -= dt;
      const k = 1 - Math.max(0, this.t / 0.6);
      this.anim.tongue = Math.sin(Math.min(1, k * 1.35) * Math.PI * 0.85);
      if (!this.fired && k > 0.4 && flatDist(this.pos, target.pos) < def.tongueRange) {
        this.fired = true;
        const r = this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
        if (r === 'hit' || r === 'otg') {
          this._stun(target, def.rootTime, 'HELD');
          this.match.sfx.toadGrab?.();
        }
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.4; this.fired = false; }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.anim.tongue = Math.max(0, this.anim.tongue - dt * 4);
      if (this.t <= 0) this.state = 'chase';
      return;
    }
    this.anim.tongue = Math.max(0, this.anim.tongue - dt * 4);
    this.swingT -= dt;
    if (this.swingT <= 0 && flatDist(this.pos, target.pos) < def.tongueRange) {
      this.swingT = def.swingEvery * rand(0.85, 1.2);
      this.state = 'act'; this.t = 0.6; this.fired = false;
      this.match.sfx.toadTongue?.();
    }
  }

  // DIVINE DOGS — relentless, independent, and they weave. Each dog picks its
  // own approach angle so the pair pincer rather than stacking on one line.
  _dog(dt, target) {
    const def = this.def;
    this.anim.action = null;
    // a stray transfigured human is worth killing on the way past
    const mn = this._nearestHostileMinion(2.2);
    const goalActor = mn || target;
    const goal = goalActor.pos;

    if (this.state === 'wind') {
      this.t -= dt;
      this.anim.action = 'bite';
      this.anim.actionK = 1 - Math.max(0, this.t / 0.22);
      this._face(goal, dt, 14);
      // lunge into the bite
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.lungeSpeed * dt);
      this.speed = def.lungeSpeed;
      if (this.t <= 0) {
        this.state = 'recover';
        this.t = 0.34;
        if (flatDist(this.pos, goal) < def.reach + 0.5) {
          if (mn) mn.hurt(def.dmg * 1.6, this.owner, { kb: 0.5 });
          else this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
          this.match.sfx.shikigamiBite?.();
        }
      }
      return;
    }
    if (this.state === 'recover') {
      // back off along the approach angle — this is what keeps the pair moving
      this.t -= dt;
      const away = v3(this.pos.x - goal.x, 0, this.pos.z - goal.z).normalize();
      this.pos.addScaledVector(away, def.speed * 0.55 * dt);
      this.speed = def.speed * 0.55;
      this._face(goal, dt, 6);
      if (this.t <= 0) this.state = 'chase';
      return;
    }

    // chase on an offset angle so the twins do not share a lane
    this.swingT -= dt;
    const off = (this.pairIndex ? 1 : -1) * 0.6;
    const approach = v3(
      goal.x + Math.sin(yawBetween(goal, this.pos) + off) * def.reach * 0.9, 0,
      goal.z + Math.cos(yawBetween(goal, this.pos) + off) * def.reach * 0.9);
    const dist = this._moveTo(approach, def.speed, dt, 0.1);
    this._face(goal, dt, 8);
    if (flatDist(this.pos, goal) < def.reach + 0.35 && this.swingT <= 0) {
      this.swingT = def.swingEvery * rand(0.8, 1.25);
      this.state = 'wind';
      this.t = 0.22;
    }
  }

  // NUE — circles overhead out of reach, then commits to a diving electric
  // strike. Landing it applies a short stun, which is what makes it the
  // rushdown partner for the Dogs.
  _nue(dt, target) {
    const def = this.def;
    this.anim.action = null;
    if (this.state === 'act') {
      this.t -= dt;
      this.anim.action = 'dive';
      this.anim.actionK = Math.min(1, 1 - this.t / 0.5);
      // drive down and forward at the target
      const to = v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z);
      const d = to.length() || 1;
      this.pos.x += (to.x / d) * def.speed * 2.1 * dt;
      this.pos.z += (to.z / d) * def.speed * 2.1 * dt;
      this.pos.y = Math.max(0.4, this.pos.y - def.flyHeight * 2.4 * dt);
      this._face(target.pos, dt, 12);
      if (this.t <= 0) {
        this.state = 'recover';
        this.t = 0.5;
        if (flatDist(this.pos, target.pos) < def.reach + 0.7) {
          const r = this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'heavy' });
          if (r === 'hit' || r === 'otg') {
            // the electric wings: a brief stun, not a knockdown
            this._stun(target, def.stun, 'SHOCKED');
          }
          this.match.fx._ring(this.pos.clone().add(v3(0, 0.8, 0)), 0xb98a3c,
            { size: 0.5, growRate: 12, life: 0.3, flat: false });
          for (let i = 0; i < 10; i++) {
            this.match.fx._spawn(this.pos.clone().add(v3(0, 0.8, 0)), {
              color: i % 2 ? 0xc8a8ff : 0xe8d8ff, size: rand(0.1, 0.26), aspect: 0.3, life: 0.25,
              vel: v3(rand(-6, 6), rand(-2, 5), rand(-6, 6))
            });
          }
          this.match.sfx.nueShock?.();
        }
        return;
      }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.pos.y += (def.flyHeight - this.pos.y) * Math.min(1, dt * 2.4);
      const away = v3(this.pos.x - target.pos.x, 0, this.pos.z - target.pos.z).normalize();
      this.pos.addScaledVector(away, def.speed * 0.5 * dt);
      this.speed = def.speed * 0.5;
      if (this.t <= 0) this.state = 'chase';
      return;
    }

    // orbit above at altitude, closing gradually
    this.swingT -= dt;
    this.orbit = (this.orbit ?? rand(0, 6.28)) + dt * 1.1;
    const r = 3.0;
    const want = v3(target.pos.x + Math.sin(this.orbit) * r, 0, target.pos.z + Math.cos(this.orbit) * r);
    this._moveTo(want, def.speed, dt, 0.2);
    this.pos.y += (def.flyHeight - this.pos.y) * Math.min(1, dt * 2.2);
    this._face(target.pos, dt, 5);
    if (this.swingT <= 0 && flatDist(this.pos, target.pos) < 6.5) {
      this.swingT = def.swingEvery * rand(0.85, 1.2);
      this.state = 'act';
      this.t = 0.5;
      this.match.sfx.nueDive?.();
    }
  }

  // TOAD — the control piece. It sits between Megumi and the fight, shoots the
  // tongue to drag the opponent in, and bodies one incoming hit for him.
  _toad(dt, target) {
    const def = this.def;
    this.anim.tongue = this.anim.tongue ?? 0;
    if (this.state === 'act') {
      // tongue out, then drag
      this.t -= dt;
      const k = 1 - Math.max(0, this.t / 0.75);
      this.anim.tongue = Math.sin(Math.min(1, k * 1.3) * Math.PI * 0.85);
      this._face(target.pos, dt, 10);
      if (this.grabbed) {
        // haul them toward Megumi along the tongue
        const to = v3(this.owner.pos.x - target.pos.x, 0, this.owner.pos.z - target.pos.z);
        const d = to.length() || 1;
        // `vel` only exists on a Fighter — a decoy curse standing in for the
        // opponent has no velocity to drag
        if (target.vel) {
          target.vel.x += (to.x / d) * def.dragSpeed * dt * 8;
          target.vel.z += (to.z / d) * def.dragSpeed * dt * 8;
        }
      } else if (k > 0.35 && flatDist(this.pos, target.pos) < def.tongueRange) {
        const r = this._strike(target, { dmg: def.dmg, kb: 0, hitstun: def.hitstun, type: 'light' });
        this.grabbed = (r === 'hit' || r === 'otg');
        if (this.grabbed) {
          this.match.hud.toast(target, 'CAUGHT');
          this.match.sfx.toadGrab?.();
        } else this.t = Math.min(this.t, 0.2);
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.6; this.grabbed = false; }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.anim.tongue = Math.max(0, this.anim.tongue - dt * 4);
      if (this.t <= 0) this.state = 'chase';
      return;
    }

    // hold station between owner and opponent — that placement IS the block
    this.swingT -= dt;
    const post = this.owner.pos.clone().lerp(target.pos, 0.35);
    this._moveTo(post, def.speed, dt, 0.4);
    this._face(target.pos, dt, 5);
    this.anim.tongue = Math.max(0, this.anim.tongue - dt * 4);
    const d = flatDist(this.pos, target.pos);
    if (this.swingT <= 0 && d < def.tongueRange && d > 1.4) {
      this.swingT = def.swingEvery * rand(0.85, 1.2);
      this.state = 'act';
      this.t = 0.75;
      this.match.sfx.toadTongue?.();
    }
  }

  // GREAT SERPENT — erupts, travels along the ground, coils and PINS. Slow,
  // loud, and the single most punishing thing he can land.
  _serpent(dt, target) {
    const def = this.def;
    this.anim.rush = this.anim.rush ?? 0;
    this.anim.coil = this.anim.coil ?? 0;
    if (this.state === 'act') {
      // the ground rush: fast, straight, committed
      this.t -= dt;
      this.anim.rush = 1;
      this.anim.coil = 0;
      this._face(target.pos, dt, 3.5);       // it cannot turn well — that is the out
      this.pos.addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), def.travelSpeed * dt);
      this.speed = def.travelSpeed;
      // dust plume off the ground as it goes
      if (Math.random() < 0.6) {
        this.match.fx._spawn(this.pos.clone().add(v3(rand(-0.4, 0.4), 0.1, rand(-0.4, 0.4))), {
          color: 0x1a1f2a, size: rand(0.2, 0.5), life: 0.4, opacity: 0.5, vel: v3(rand(-1, 1), rand(0.5, 2), rand(-1, 1))
        });
      }
      if (!this.hitThisRush && flatDist(this.pos, target.pos) < def.reach) {
        this.hitThisRush = true;
        this.anim.action = 'bite';
        this.anim.actionK = 0;
        const r = this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'heavy' });
        if (r === 'hit' || r === 'otg') {
          // COILED: pinned in place, and Megumi gets a free approach
          this._stun(target, def.pin, 'COILED');
          this.match.cam.shake(0.5);
          this.match.sfx.serpentCoil?.();
          this.state = 'coil';
          this.t = def.pin;
          return;
        }
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.9; this.anim.rush = 0; }
      return;
    }
    if (this.state === 'coil') {
      // wrapped around them: hold the pin, then unwind
      this.t -= dt;
      this.anim.rush = 0;
      this.anim.coil = Math.min(1, this.anim.coil + dt * 4);
      this._moveTo(target.pos, 5, dt, 0.5);
      this._face(target.pos, dt, 8);
      if (this.t <= 0) { this.state = 'recover'; this.t = 0.9; this.hitThisRush = false; }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.anim.rush = Math.max(0, this.anim.rush - dt * 3);
      this.anim.coil = Math.max(0, this.anim.coil - dt * 3);
      this.anim.action = null;
      this.speed = 0;
      if (this.t <= 0) { this.state = 'chase'; this.hitThisRush = false; }
      return;
    }

    this.swingT -= dt;
    this.anim.rush = Math.max(0, this.anim.rush - dt * 3);
    this.anim.coil = Math.max(0, this.anim.coil - dt * 3);
    this._moveTo(target.pos, def.speed, dt, 3.0);
    this._face(target.pos, dt, 4);
    if (this.swingT <= 0 && flatDist(this.pos, target.pos) < 9) {
      this.swingT = def.swingEvery * rand(0.85, 1.15);
      this.state = 'act';
      this.t = 1.1;
      this.hitThisRush = false;
      this.match.sfx.serpentRush?.();
      // the telegraph: a line of shadow tearing along the ground ahead of it
      const fw = v3(Math.sin(this.facing), 0, Math.cos(this.facing));
      for (let i = 1; i < 9; i++) {
        this.match.fx._ring(this.pos.clone().addScaledVector(fw, i * 1.1).setY(0.05), 0x8fb6d8,
          { size: 0.3, growRate: 1.4, life: 0.35 + i * 0.03 });
      }
    }
  }

  // MAX ELEPHANT — plods forward and periodically floods the area. The torrent
  // is telegraphed by the trunk going up, and it hits wide.
  _elephant(dt, target) {
    const def = this.def;
    this.anim.torrent = this.anim.torrent ?? 0;
    if (this.state === 'act') {
      this.t -= dt;
      this.anim.torrent = Math.min(1, this.anim.torrent + dt * 4);
      this._face(target.pos, dt, 3);
      this.speed = 0;
      if (!this.fired && this.t <= def.torrentDelay) {
        this.fired = true;
        this._torrent(target);
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = 1.0; }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.anim.torrent = Math.max(0, this.anim.torrent - dt * 2.5);
      this.speed = 0;
      if (this.t <= 0) { this.state = 'chase'; this.fired = false; }
      return;
    }
    this.swingT -= dt;
    this._moveTo(target.pos, def.speed, dt, def.reach);
    this._face(target.pos, dt, 2.5);
    if (this.swingT <= 0 && flatDist(this.pos, target.pos) < 10) {
      this.swingT = def.torrentEvery * rand(0.9, 1.1);
      this.state = 'act';
      this.t = def.torrentDelay + 0.5;
      this.fired = false;
      this.match.sfx.elephantRear?.();
    }
  }

  _torrent(target) {
    const m = this.match, def = this.def;
    const head = this.pos.clone().add(v3(0, this.model.height * 0.8, 0));
    const at = target.pos.clone().setY(0);
    m.sfx.elephantTorrent?.();
    m.cam.shake(0.8);
    m.cam.fovKick(7);
    m.stage.flash(0.2);
    // the water column: a dense arc of particles from trunk to ground
    for (let i = 0; i < 46; i++) {
      const k = i / 45;
      const p = head.clone().lerp(at, k).add(v3(rand(-0.5, 0.5), Math.sin(k * Math.PI) * 1.2, rand(-0.5, 0.5)));
      m.fx._spawn(p, {
        color: i % 3 === 0 ? 0xdfeaf6 : 0x6f9fc8, size: rand(0.2, 0.6), life: rand(0.25, 0.5),
        vel: at.clone().sub(head).normalize().multiplyScalar(rand(6, 14)).add(v3(rand(-2, 2), rand(-1, 2), rand(-2, 2))),
        gravity: 10
      });
    }
    m.fx._ring(at.clone().setY(0.06), 0x8fc8e8, { size: 0.8, growRate: 22, life: 0.55 });
    m.fx._ring(at.clone().setY(0.06), 0xdfeaf6, { size: 0.5, growRate: 15, life: 0.65 });
    for (const f of m.activeFighters) {
      if (f === this.owner || !f.alive) continue;
      if (flatDist(f.pos, at) > def.torrentRadius) continue;
      this._strike(f, {
        dmg: def.dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: 'knockdown'
      });
    }
    m.minions?.hurtAt(at, def.torrentRadius, def.dmg * 0.7, this.owner);
    // ...and Geto's curses, which stand in the same field as the transfigured
    // human and take area damage from exactly the same sources.
    m.curses?.hurtAt(at, def.torrentRadius, def.dmg * 0.7, this.owner);
    // and it hits the level: heavy water is a destruction source
    m.arena.destruct?.damageAt(at, def.torrentRadius, 26, { kind: 'water' });
  }

  // RABBIT ESCAPE — the panic button. Barely damages anything; it fills the
  // screen with bodies, shoves whoever is close, and buys him two seconds.
  _rabbits(dt, target) {
    const def = this.def;
    this.anim.spread = 1;
    this.speed = 0;
    this.tickT = (this.tickT ?? 0) - dt;
    const d = flatDist(this.pos, target.pos);
    if (d < def.pushRadius) {
      // shove them out of the swarm — the opponent is forced to back off
      const away = v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize();
      if (target.vel) {
        target.vel.x += away.x * def.pushForce * dt;
        target.vel.z += away.z * def.pushForce * dt;
      }
      if (this.tickT <= 0) {
        this.tickT = def.swingEvery;
        this._strike(target, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
      }
    }
    // the visual cover: a low bank of shadow the opponent has to see through
    if (Math.random() < 0.5) {
      const a = rand(0, Math.PI * 2), r = rand(0, def.pushRadius);
      this.match.fx._spawn(this.pos.clone().add(v3(Math.cos(a) * r, rand(0.1, 1.1), Math.sin(a) * r)), {
        color: 0x0d1018, size: rand(0.4, 0.9), life: rand(0.4, 0.8), opacity: 0.5,
        vel: v3(rand(-0.6, 0.6), rand(0.1, 0.5), rand(-0.6, 0.6))
      });
    }
  }
}

// ---------------------------------------------------------------------------
// The manager: bindings, cooldowns, the loss ledger, and the active limit.
// ---------------------------------------------------------------------------
export class ShikigamiSystem {
  constructor(match) {
    this.match = match;
    this.list = [];
    this.owners = new Map();     // fighter -> {bind, lost:Set, cd:Map, summons:[]}
  }

  stateFor(owner) {
    let s = this.owners.get(owner);
    if (!s) {
      const cfg = owner.cfg.shikigami;
      s = {
        bind: { ...(cfg?.defaults || { ct1: null, ct2: null }) },
        lost: new Set(), cd: new Map(), summons: []
      };
      this.owners.set(owner, s);
    }
    return s;
  }

  defsFor(owner) { return owner.cfg.shikigami?.defs || {}; }
  orderFor(owner) { return owner.cfg.shikigami?.order || []; }

  bind(owner, slot, key) {
    const s = this.stateFor(owner);
    // binding a shikigami that is already in the other slot swaps them, so the
    // wheel can never leave him holding the same summon twice
    const other = slot === 'ct1' ? 'ct2' : 'ct1';
    if (s.bind[other] === key) s.bind[other] = s.bind[slot];
    s.bind[slot] = key;
    return s.bind;
  }
  bindingOf(owner, slot) { return this.stateFor(owner).bind[slot]; }
  isLost(owner, key) {
    // inside Chimera Shadow Garden nothing is lost — everything comes back
    if (this._gardenFor(owner)) return false;
    return this.stateFor(owner).lost.has(key);
  }
  lostSet(owner) { return this.stateFor(owner).lost; }
  cooldownOf(owner, key) { return this.stateFor(owner).cd.get(key) || 0; }
  _recordLoss(owner, key) {
    this.stateFor(owner).lost.add(key);
    this._rebindLost(owner);
  }

  // ---- A DEAD SHIKIGAMI DOES NOT GET TO KEEP HOLDING A BUTTON --------------
  // Permanent loss is the point of the character; a DEAD BUTTON is not. Before
  // this, killing whatever was bound to RB left RB pointing at a corpse, and
  // the only feedback was "DOGS IS GONE" every time it was pressed — so Megumi
  // lost the shikigami AND the slot, and getting the slot back meant stopping
  // to open the wheel in the middle of the fight that had just gone badly
  // enough to cost him a summon.
  //
  // Now any slot pointing at something destroyed is immediately re-bound to the
  // best surviving shikigami, so the button always does SOMETHING. The loss is
  // still permanent and still hurts — he is down a creature and the wheel entry
  // stays greyed out — but his hands are never empty.
  //
  // PICKING THE REPLACEMENT. Walk `order` (the fixed wheel order, so the choice
  // is predictable rather than clever) and take the first entry that is not
  // lost and is not already in the other slot. Cost is deliberately NOT
  // considered: an unaffordable binding still reports "not enough cursed
  // energy" and is recoverable in a second or two, whereas an empty slot is
  // not recoverable at all without opening the wheel.
  //
  // If EVERYTHING is gone the slot is left as it was — there is nothing to put
  // in it, and at that point the honest message really is that it is gone.
  _rebindLost(owner) {
    const s = this.stateFor(owner);
    const order = this.orderFor(owner);
    const defs = this.defsFor(owner);
    for (const slot of ['ct1', 'ct2']) {
      const cur = s.bind[slot];
      if (!cur || !s.lost.has(cur)) continue;
      const other = slot === 'ct1' ? 'ct2' : 'ct1';
      // only ever rebind onto something the wheel itself would accept: the
      // ritual-only Mahoraga entry and a fusion whose components are gone are
      // not valid destinations, and landing a slot on one would recreate the
      // dead-button problem this whole routine exists to prevent
      const live = this.selectable(owner);
      const pick = live.find(k => k !== s.bind[other]);
      if (!pick) continue;
      s.bind[slot] = pick;
      this.match.hud?.toast(owner,
        (slot === 'ct1' ? 'RB · ' : 'RT · ') + (defs[pick]?.short ?? pick));
      owner.emit?.('shikiRebound', { slot, key: pick, replaced: cur });
    }
  }

  // the caster's own shadow garden, if it is standing
  _gardenFor(owner) {
    const d = this.match.domains.state;
    return d && d.phase === 'active' && d.caster === owner
      && d.def.sureHit.effect === 'shadow_garden' ? d : null;
  }

  aliveFor(owner) { return this.list.filter(s => s.owner === owner && s.alive); }
  // active-limit accounting is in SLOTS, not bodies: the Divine Dogs put two
  // wolves on the field for one slot
  usedSlots(owner) {
    const seen = new Set();
    let n = 0;
    for (const s of this.list) {
      if (s.owner !== owner || !s.alive || s.temp) continue;
      if (s.group && seen.has(s.group)) continue;
      if (s.group) seen.add(s.group);
      n += s.def.slots ?? 1;
    }
    return n;
  }

  // ---- THE FUSIONS --------------------------------------------------------
  // Three fusions, three DIFFERENT rules, all read off the def rather than
  // branched on a key:
  //
  //   agito       parts: nue + serpent + roundDeer + tigerFuneral
  //               requireAlive, consume — the expensive one. All four must be
  //               un-destroyed; fusing strikes all four off for the match.
  //   totality    parts: divineDogs, consume, unlockOnLoss: divineDogs
  //               either spend the pair OR have already lost them. Canon is
  //               the second reading (the black dog inherits its dead twin's
  //               power); the first is the same trade Agito makes, offered so
  //               the player does not have to lose a summon to reach it.
  //   wellsAbyss  parts: nue + toad, requireAlive, consume: FALSE
  //               canon says outright it "can be summoned so long as Nue and
  //               the Toad are alive" and that the toads themselves are lost
  //               without consequence. It costs nothing but CE.
  //
  // Returns the full picture the HUD needs, not just a yes/no, because the
  // brief is explicit that the tradeoff has to be legible BEFORE committing.
  fusionInfo(owner, key) {
    const def = this.defsFor(owner)[key];
    if (!def?.fusion) return null;
    const f = def.fusion;
    const s = this.stateFor(owner);
    const defs = this.defsFor(owner);
    const garden = !!this._gardenFor(owner);
    const parts = f.parts.map(k => ({
      key: k, short: defs[k]?.short ?? k,
      // inside Chimera Shadow Garden nothing counts as lost, so the components
      // are all "alive" in there — see the note on `summon` for what that means
      lost: !garden && s.lost.has(k)
    }));
    const missing = parts.filter(p => p.lost);
    // the unlock-on-loss path: losing the named component is itself the key
    const unlocked = f.unlockOnLoss && !garden && s.lost.has(f.unlockOnLoss);
    const ready = unlocked || !(f.requireAlive !== false && missing.length);
    return {
      key, def, parts, missing, ready, unlocked,
      // what pressing it will actually cost, which is the number the HUD
      // prints next to the button
      consumes: (f.consume && !unlocked) ? parts.map(p => p.short) : []
    };
  }

  // Everything the wheel is allowed to land on. Fusions whose components are
  // gone, and the ritual-only Mahoraga entry, are holes in the ring rather than
  // options that refuse at release — the same discipline
  // Fighter._openWheel already documents for dead shikigami.
  selectable(owner) {
    const defs = this.defsFor(owner);
    return this.orderFor(owner).filter(k => {
      const d = defs[k];
      if (!d || d.ritualOnly) return false;
      if (this.isLost(owner, k)) return false;
      if (d.fusion) return !!this.fusionInfo(owner, k)?.ready;
      return true;
    });
  }

  // Why a summon can or cannot happen. Returns null on success, or a short
  // HUD string on failure — all the gating in one readable place.
  blockReason(owner, key) {
    const def = this.defsFor(owner)[key];
    if (!def) return 'NO SHIKIGAMI BOUND';
    if (def.ritualOnly) return def.short + ' — RITUAL ONLY';
    const garden = this._gardenFor(owner);
    if (this.stateFor(owner).lost.has(key) && !garden) return def.short + ' IS GONE';
    // A FUSION IS GATED ON ITS PARTS, and the refusal names them rather than
    // saying "no": a player who is told "AGITO NEEDS DEER + TIGER" learns the
    // rule, and one who is told "unavailable" does not.
    if (def.fusion) {
      const info = this.fusionInfo(owner, key);
      if (!info.ready) return def.short + ' NEEDS ' + info.missing.map(p => p.short).join(' + ');
    }
    if (garden) return null;                                   // free and instant
    if (this.cooldownOf(owner, key) > 0) return def.short + ' ON COOLDOWN';
    const limit = owner.cfg.shikigami?.activeLimit ?? 2;
    // STATE THE CAP AS A NUMBER. "The shadow is full" is flavour that tells a
    // player nothing they can plan around; the limit itself does.
    if (this.usedSlots(owner) + (def.slots ?? 1) > limit) return 'MAX SHIKIGAMI: ' + limit;
    if (owner.res.curCE < def.cost) return null;               // CE is checked by the caller
    return null;
  }

  // Put a summon on the field. `at` lets the domain erupt one anywhere in the
  // shadow (including directly under the opponent).
  summon(owner, key, opts = {}) {
    const def = this.defsFor(owner)[key];
    if (!def) return null;
    const s = this.stateFor(owner);
    const garden = this._gardenFor(owner);
    if (!garden && !opts.temp) s.cd.set(key, def.cooldown);
    // NOTE: a shikigami re-summoned inside the garden is deliberately NOT
    // removed from the loss ledger. It is on loan for the domain's duration
    // and goes back down when the shadow does (domains._collapse) — `isLost`
    // and `blockReason` read through the garden instead.

    const record = { key, t: 0 };
    s.summons.push(record);
    const at = (opts.at || owner.pos.clone().addScaledVector(owner.forward(), 1.5));
    at.y = 0;

    // ---- FUSION: SPEND THE COMPONENTS ---------------------------------------
    // This happens BEFORE the body arrives, so the convergence cinematic below
    // can show the four shikigami being pulled in and the ledger already agrees
    // with what the screen says.
    //
    // INSIDE CHIMERA SHADOW GARDEN, and this is the ruling the brief asks for:
    // the garden restores every destroyed shikigami while it holds, so YES,
    // Agito can be re-fused inside the domain — the components read as alive in
    // there and `fusionInfo` says ready. But the consumption is still WRITTEN
    // TO THE LEDGER, exactly as a death would be. So a player who re-fuses
    // three times inside the shadow gets three Agitos and then, the moment the
    // domain lapses, discovers he has no Nue, no Serpent, no Deer and no Tiger
    // for the rest of the match. The domain lets him borrow against the debt;
    // it does not forgive it. That is the same shape as every other thing the
    // garden does (see the note in `summon` on re-summoned shikigami staying on
    // the loss ledger) and it keeps the fusion a decision rather than a freebie.
    if (def.fusion) {
      const info = this.fusionInfo(owner, key);
      if (def.fusion.consume && !info?.unlocked) {
        this._fusionCinematic(owner, at, def, info);
        for (const partKey of def.fusion.parts) {
          // pull any live component bodies off the field first — they are being
          // eaten, not killed, so they dissolve rather than counting as a death
          for (const e of this.list) {
            if (e.owner === owner && e.key === partKey && !e.dead) e.die(false);
          }
          s.lost.add(partKey);
        }
        this._rebindLost(owner);
        this.match.hud.toast(owner, 'FUSED — ' + info.parts.map(p => p.short).join(' + ') + ' CONSUMED');
      }
    }
    const made = [];
    const bodies = def.pair ? 2 : 1;
    for (let i = 0; i < bodies; i++) {
      const spot = at.clone().add(v3(rand(-0.9, 0.9), 0, rand(-0.9, 0.9)));
      const e = new Shiki(this, owner, def, {
        at: spot, pairIndex: i, group: def.pair ? record : null,
        temp: opts.temp, hpMult: opts.hpMult
      });
      this.list.push(e);
      made.push(e);
    }
    // the emergence read: a shadow pool tearing open at the spot
    const m = this.match;
    m.fx._ring(at.clone().setY(0.05), 0x8fb6d8, { size: 0.5, growRate: 8, life: 0.45 });
    m.fx._ring(at.clone().setY(0.05), 0x0a0c14, { size: 0.3, growRate: 5, life: 0.55 });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      m.fx._spawn(at.clone().add(v3(Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5)), {
        color: i % 3 === 0 ? 0x8fb6d8 : 0x0a0c14, size: rand(0.15, 0.4), life: rand(0.3, 0.6),
        vel: v3(Math.cos(a) * 2, rand(1, 3.5), Math.sin(a) * 2), gravity: 5
      });
    }
    m.sfx.shikigamiSummon?.(key);
    m.hud.toast(owner, def.jp + ' ' + def.name);
    return made;
  }

  // ---- THE FUSION CINEMATIC ------------------------------------------------
  // "The four shikigami converge and merge. This should be the visual highlight
  // of Megumi's kit." Built in three beats so it reads as a sequence rather
  // than as one particle burst:
  //
  //   1. FOUR SHADOW PILLARS erupt at the compass points around the fusion
  //      spot, each in its component's own colour, so the player can SEE which
  //      four are being spent.
  //   2. THEY CONVERGE — each pillar's motes are fired inward along its own
  //      line, arriving together.
  //   3. THE COLLAPSE — a hard ring, a screen flash, a hitstop and a shockwave
  //      that scours the ground.
  //
  // Component colours come off the defs, so adding a fourth fusion later needs
  // nothing here.
  _fusionCinematic(owner, at, def, info) {
    const m = this.match;
    const defs = this.defsFor(owner);
    const parts = def.fusion.parts;
    const n = Math.max(1, parts.length);
    const R = 4.2;

    m.sfx.shikigamiSummon?.('fusion');
    m.cam.shake(0.5);
    m.stage.flash(0.18);

    parts.forEach((k, i) => {
      const color = defs[k]?.color ?? 0x8fb6d8;
      const a = (i / n) * Math.PI * 2 + 0.4;
      const from = at.clone().add(v3(Math.cos(a) * R, 0, Math.sin(a) * R));
      // 1 — the pillar
      m.fx._ring(from.clone().setY(0.05), color, { size: 0.4, growRate: 7, life: 0.5 });
      m.fx._ring(from.clone().setY(0.05), 0x0a0c14, { size: 0.25, growRate: 4, life: 0.6 });
      for (let j = 0; j < 16; j++) {
        m.fx._spawn(from.clone().add(v3(rand(-0.5, 0.5), rand(0, 0.4), rand(-0.5, 0.5))), {
          color: j % 3 === 0 ? color : 0x0a0c14, size: rand(0.2, 0.5), life: rand(0.35, 0.6),
          vel: v3(rand(-0.5, 0.5), rand(5, 11), rand(-0.5, 0.5)), gravity: 6
        });
      }
      // 2 — the convergence, a dense line of motes travelling inward
      for (let j = 0; j < 26; j++) {
        const k2 = j / 25;
        const p = from.clone().lerp(at.clone().setY(1.4), k2)
          .add(v3(rand(-0.4, 0.4), rand(0.2, 2.4) * (1 - k2 * 0.5), rand(-0.4, 0.4)));
        m.fx._spawn(p, {
          color: j % 4 === 0 ? 0xffffff : color, size: rand(0.14, 0.38), aspect: 0.4,
          life: rand(0.25, 0.5),
          vel: at.clone().setY(1.4).sub(p).multiplyScalar(rand(2.4, 4.2))
        });
      }
    });

    // 3 — the collapse
    const core = at.clone().setY(1.4);
    m.fx._ring(core, 0xffffff, { size: 0.4, growRate: 20, life: 0.45, flat: false });
    m.fx._ring(at.clone().setY(0.06), 0x8fb6d8, { size: 0.6, growRate: 26, life: 0.55 });
    m.fx._ring(at.clone().setY(0.06), 0x0a0c14, { size: 0.4, growRate: 18, life: 0.7 });
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      m.fx._spawn(core.clone(), {
        color: i % 5 === 0 ? 0xffffff : (defs[parts[i % n]]?.color ?? 0x8fb6d8),
        size: rand(0.2, 0.6), life: rand(0.3, 0.7),
        vel: v3(Math.cos(a) * rand(4, 12), rand(-1, 5), Math.sin(a) * rand(4, 12)), gravity: 7
      });
    }
    m.cam.fovKick(10);
    m.hitstop(9);
    m.arena.destruct?.damageAt(at, 3.4, 22);
    m.hud.toast(owner, (def.jpFull ?? def.jp) + ' ' + (def.fullName ?? def.name));
  }

  // ---- THE WELL'S UNKNOWN ABYSS: CATCHING PROJECTILES ----------------------
  // Canon: the winged toads "use their tongues to restrain opponents or CATCH
  // PROJECTILE ATTACKS", and Megumi used them exactly that way against
  // Noritoshi's manipulated arrows. Nothing else in this game eats a
  // projectile outright, which is what makes the technique worth its slot.
  //
  // Called from the projectile systems before a shot resolves against a
  // fighter. Each flight has a finite number of catches (`intercepts`) and
  // spends one per catch — an infinite screen would be oppressive and it is
  // not what the technique does.
  tryCatchProjectile(defender, at) {
    for (const s of this.list) {
      if (s.owner !== defender || !s.alive || s.key !== 'wellsAbyss') continue;
      if (s.intercepts <= 0) continue;
      if (flatDist(s.pos, at ?? defender.pos) > (s.def.tongueRange ?? 6)) continue;
      s.intercepts--;
      const m = this.match;
      const p = (at ?? defender.pos).clone().setY(1.3);
      m.fx._ring(p, 0x9ec46a, { size: 0.5, growRate: 10, life: 0.3, flat: false });
      for (let i = 0; i < 10; i++) {
        m.fx._spawn(p, {
          color: i % 2 ? 0xb8595f : 0x9ec46a, size: rand(0.1, 0.26), life: 0.25,
          vel: v3(rand(-4, 4), rand(0, 4), rand(-4, 4))
        });
      }
      m.sfx.toadGrab?.();
      m.hud.toast(defender, 'CAUGHT — ' + s.intercepts + ' LEFT');
      s.anim.tongue = 1;
      if (s.intercepts <= 0) s.die(false);   // spent, not killed
      return true;
    }
    return false;
  }

  // A shikigami summoned by someone who is NOT Megumi — Yuta's Copy. It reads
  // its stats off the canonical table rather than the owner's config (Yuta has
  // no shikigami block), never costs a slot, never goes on cooldown and can
  // never be recorded as a loss.
  summonBorrowed(owner, key, opts = {}) {
    const base = BORROWED_DEFS[key];
    if (!base) return null;
    const def = { ...base, pair: opts.single ? false : base.pair, life: opts.life ?? 10 };
    if (opts.dmg != null) def.dmg = opts.dmg;
    const at = (opts.at || owner.pos.clone()).clone();
    at.y = 0;
    const e = new Shiki(this, owner, def, { at, temp: true, hpMult: opts.hpMult ?? 0.7 });
    this.list.push(e);
    const m = this.match;
    m.fx._ring(at.clone().setY(0.05), owner.model.palette.accent ?? 0x8fb6d8,
      { size: 0.5, growRate: 8, life: 0.4 });
    m.sfx.shikigamiSummon?.(key);
    m.hud.toast(owner, def.jp + ' ' + def.name);
    return [e];
  }

  // TOAD's body-block: it eats exactly one incoming hit aimed at its owner,
  // then despawns (dismissed, not destroyed — it did its job). Called from
  // Fighter.applyHit before anything else resolves.
  tryIntercept(defender, hit) {
    if (hit.sureHit) return false;
    for (const s of this.list) {
      if (s.owner !== defender || !s.alive || s.guardCharges <= 0) continue;
      if (flatDist(s.pos, defender.pos) > 3.2) continue;
      s.guardCharges = 0;
      const m = this.match;
      m.fx._ring(defender.pos.clone().add(v3(0, 1.1, 0)), 0x6f8a72, { size: 0.7, growRate: 9, life: 0.35, flat: false });
      m.fx.armorFlash(s.pos.clone().setY(0.9));
      m.sfx.armor();
      m.hud.toast(defender, s.def.short + ' TOOK IT');
      m.hitstop(6);
      s.die(false);        // spent, not killed: it can be summoned again
      return true;
    }
    return false;
  }

  hurtAt(pos, radius, dmg, attacker) {
    for (const s of this.list) {
      if (!s.targetable || s.owner === attacker) continue;
      if (flatDist(s.pos, pos) < radius + s.model.radius * 0.5) s.hurt(dmg, attacker);
    }
  }

  // melee swings connect with shikigami too — one tag per swing, and a swing
  // can hit both a fighter and a shikigami
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.shikiHit) continue;
      for (const s of this.list) {
        if (!s.targetable || s.owner === f) continue;
        const fwd = f.forward();
        const origin = f.pos.clone().addScaledVector(fwd, win.def.reach * 0.7);
        if (flatDist(origin, s.pos) < 0.9 + s.model.radius * 0.6) {
          win.shikiHit = true;
          s.hurt(win.def.dmg, f, { kb: win.def.kb * 0.16 });
          break;
        }
      }
    }
  }

  // Mahito's transfigured human swings back at whatever is mauling it.
  minionCheck(dt) {
    const list = this.match.minions?.list;
    if (!list?.length) return;
    for (const mn of list) {
      if (!mn.alive) continue;
      mn._shikiT = (mn._shikiT ?? 0) - dt;
      if (mn._shikiT > 0) continue;
      for (const s of this.list) {
        if (!s.targetable || s.owner === mn.owner) continue;
        if (flatDist(mn.pos, s.pos) < (mn.def.reach ?? 1.3) + s.model.radius * 0.6) {
          mn._shikiT = mn.def.swingEvery ?? 1.6;
          s.hurt(mn.def.dmg * 1.2, null, { kb: 0.2 });
          break;
        }
      }
    }
  }

  update(dt) {
    // per-shikigami cooldowns
    for (const [, s] of this.owners) {
      for (const [k, v] of s.cd) if (v > 0) s.cd.set(k, Math.max(0, v - dt));
    }
    this.meleeCheck();
    this.minionCheck(dt);
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i].update(dt)) this.list.splice(i, 1);
    }
  }

  // domain collapse / round reset: dismiss without loss
  dismissAll(owner) {
    for (const s of this.list) if (!owner || s.owner === owner) s.die(false);
  }

  clear() {
    for (const s of this.list) this.match.root.remove(s.model.group);
    this.list.length = 0;
  }

  // A fresh round clears the field and the cooldowns but DELIBERATELY KEEPS
  // THE LOSS LEDGER. A destroyed shikigami is gone for the whole MATCH, not
  // just the round it died in — that is what makes spending one a real
  // decision instead of a per-round rental, and it is why a long match sees
  // Megumi get measurably weaker. Chimera Shadow Garden is the only thing
  // that brings them back, and only while it holds (see `isLost`).
  resetRound() {
    this.clear();
    for (const [, s] of this.owners) {
      s.cd.clear();
      s.summons.length = 0;
    }
  }

  // a whole new match: this is the only thing that wipes the ledger
  resetMatch() {
    this.resetRound();
    for (const [, s] of this.owners) s.lost.clear();
  }

  // debug/HUD: everything the wheel and the plate need in one shot
  snapshot(owner) {
    const st = this.stateFor(owner);
    const defs = this.defsFor(owner);
    const garden = !!this._gardenFor(owner);
    return this.orderFor(owner).map(key => {
      const def = defs[key];
      // FUSIONS CARRY THEIR WHOLE STORY INTO THE HUD. `fusion` here is what the
      // wheel and the plate print: which components are still alive, which are
      // missing, whether it is ready, and what pressing it will cost. The brief
      // is explicit that the tradeoff has to be legible BEFORE the player
      // commits, and a boolean cannot say "this will cost you the Deer".
      const fusion = def.fusion ? this.fusionInfo(owner, key) : null;
      return {
        key, def,
        lost: !garden && st.lost.has(key),
        ritualOnly: !!def.ritualOnly,
        fusion,
        blocked: !!def.ritualOnly || (!!fusion && !fusion.ready),
        cd: garden ? 0 : (st.cd.get(key) || 0),
        cdMax: def.cooldown || 1,
        affordable: garden || owner.res.curCE >= (def.cost ?? 0),
        bound: st.bind.ct1 === key ? 'ct1' : st.bind.ct2 === key ? 'ct2' : null
      };
    });
  }
}
