// GARUDA ガルダ — Yuki's permanent shikigami partner.
//
// The first ally in this project that is ALWAYS ON THE FIELD. It is not
// summoned, it is not spent, and it cannot be permanently lost. That single
// property is what makes it a different thing from everything else here, and
// it is worth stating what it is deliberately NOT:
//
//   MEGUMI'S SHIKIGAMI   summoned, bound to a slot, and LOST FOR THE ROUND
//                        when destroyed. Losing one is the cost of the
//                        technique and the whole tension of the character.
//   GETO'S STABLE        same: summoned from a finite jar, and a body that
//                        dies is gone until the round resets.
//   MAHITO'S MINION      summoned, has health, dies, and has a duration.
//
//   GARUDA               on the field at round start, no health bar, no
//                        duration, no summon cost. Hitting it knocks it away
//                        and stuns it for `stunSeconds`, and then it comes
//                        back. Every round, every time, without exception.
//
// The reason that matters mechanically is that Yuki's kit assumes it. Her
// special is a COMMAND rather than a summon, her mass management covers two
// bodies, and a version of this where a zoner could delete the partner would
// delete a third of the character. `returnAlways` in her config is that ruling
// written down.
//
// WHERE THE PIECES LIVE
//   · this file             the entity, its AI, and the system that owns it
//   · characters/yuki.js    every NUMBER, under `garuda`
//   · art/models/garuda.js  the body and `setMass`
//   · art/anim/garuda.js    the procedural animator
//   · core/match.js         construction, per-frame update, and round reset
//
// ---------------------------------------------------------------------------
// IT IS AN ENTITY, NOT A FIGHTER
// ---------------------------------------------------------------------------
// Same architectural call combat/minion.js makes, for the same reasons: it has
// no cursed energy, no stamina, no state machine, no domain interaction and no
// hurt box in the fighter sense. Domains treat it as scenery. Boogie Woogie
// ignores it — the swap trades SORCERER positions and a shikigami is not a
// valid anchor, which is the identical ruling minion.js records.
import { v3, rand, yawBetween, flatDist } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import { buildGaruda } from '../art/models/garuda.js';
import { spendMass, massOnEvent, massFrac, hasMass } from './mass.js';

class Garuda {
  constructor(owner, match) {
    this.owner = owner;
    this.match = match;
    this.def = owner.cfg.garuda;
    this.model = buildGaruda();
    // the animator ships attached to the model (see art/models/garuda.js), so
    // the bench and the game drive the identical one
    this.tick = this.model.tick;

    this.pos = owner.pos.clone();
    this.pos.y += this.def.hoverHeight;
    this.vel = v3();
    this.facing = owner.facing;

    // state: hover | fly | dive | hurt | recover
    this.state = 'hover';
    this.t = 0;
    this.actionK = 0;
    this.speed = 0;
    // the mass the CURRENT dive is carrying, captured at command time
    this.diveMass = null;
    // cooldowns for the two autonomous behaviours
    this.interceptCD = 0;
    this.idleStrikeCD = this.def.idleStrike.cooldown * 0.5;
    // the stun, and the immunity that follows it so a zoner cannot pin it
    this.stunT = 0;
    this.stunImmT = 0;

    match.root.add(this.model.group);
    this.model.group.position.copy(this.pos);
  }

  // IT IS ALWAYS ALIVE. There is no other answer and the getter exists so
  // that any caller written against the minion/shikigami shape gets a truthful
  // one rather than `undefined`.
  get alive() { return true; }
  get stunned() { return this.stunT > 0; }

  // -------------------------------------------------------------------------
  // THE COMMAND (Yuki's B)
  // -------------------------------------------------------------------------
  // Refused while stunned — which is the only thing knocking it away actually
  // buys the opponent, and it is enough: 2.2 seconds without her best
  // approach tool is a real window.
  command(target) {
    if (this.stunned || this.state === 'dive') return false;
    this.state = 'dive';
    this.t = 0;
    this.actionK = 0;
    this.diveTarget = target ? target.pos.clone() : null;
    // HER MASS RIDES IT. Spent from the SAME pool as her own techniques, so
    // commanding Garuda is a genuine alternative use of the resource rather
    // than a free second damage source. This is what "her mass management
    // covers two bodies" means mechanically.
    this.diveMass = this.def.dive.massSpend ? spendMass(this.owner) : null;
    this.model.setMass(this.diveMass ? this.diveMass.k : 0);
    return true;
  }

  // -------------------------------------------------------------------------
  // BEING HIT
  // -------------------------------------------------------------------------
  // No health, no death. Knocked back and stunned, and then it returns.
  knockAway(from, dmg = 0) {
    if (this.stunImmT > 0 || this.stunned) return false;
    this.state = 'hurt';
    this.t = 0;
    this.stunT = this.def.stunSeconds;
    this.stunImmT = this.def.stunSeconds + this.def.stunImmunity;
    const dir = from
      ? v3(this.pos.x - from.x, 0.25, this.pos.z - from.z).normalize()
      : v3(0, 1, 0);
    this.vel.copy(dir).multiplyScalar(this.def.knockDist * 2.4);
    this.model.hurt();
    const m = this.match;
    m.fx.hitSpark(this.pos.clone(), 'heavy');
    m.sfx.hit?.(true);
    // bone chips, not blood — it is a construct made of bone
    for (let i = 0; i < 10; i++) {
      m.fx._spawn(this.pos.clone(), {
        color: i % 3 ? 0xece6d6 : 0xc2b9a4, size: rand(0.10, 0.24), life: rand(0.3, 0.6),
        vel: v3(rand(-4, 4), rand(0.5, 4), rand(-4, 4)), gravity: 7
      });
    }
    m.hud?.toast?.(this.owner, 'ガルダ STUNNED');
    return true;
  }

  // -------------------------------------------------------------------------
  // THE INTERCEPT
  // -------------------------------------------------------------------------
  // "it hovers near her, intercepts occasionally". Called by the projectile
  // path when something would reach Yuki. Deliberately a ROLL rather than a
  // guarantee, and on a long cooldown, so it reads as the partner happening to
  // be there rather than as a second guard she can rely on. If it were
  // reliable it would be a permanent 30% damage reduction, which is not a
  // partner, it is a stat.
  tryIntercept() {
    const ic = this.def.intercept;
    if (this.stunned || this.interceptCD > 0) return false;
    // The owner's own seeded stream, not Math.random: whether the intercept
    // happened is a gameplay outcome, and online every client has to roll the
    // same one. Same rule combat/hits.js `computeDamage` follows for crits.
    const roll = this.owner.rng ? this.owner.rng() : Math.random();
    if (roll >= ic.chance) return false;
    this.interceptCD = ic.cooldown;
    this.state = 'hurt';
    this.t = 0;
    this.stunT = ic.stunSeconds;
    this.model.hurt();
    this.match.fx.guardSpark(this.pos.clone());
    this.match.sfx.guard?.();
    this.match.hud?.toast?.(this.owner, 'ガルダ INTERCEPT');
    return true;
  }

  // -------------------------------------------------------------------------
  update(dt) {
    const m = this.match;
    const o = this.owner;
    const foe = m.other(o) ?? null;

    this.interceptCD = Math.max(0, this.interceptCD - dt);
    this.idleStrikeCD = Math.max(0, this.idleStrikeCD - dt);
    this.stunT = Math.max(0, this.stunT - dt);
    this.stunImmT = Math.max(0, this.stunImmT - dt);
    this.model.tickHurt(dt);

    // If the owner is gone (KO, round end) it simply hovers where it is. It
    // does NOT despawn — see the header.
    const home = o.pos.clone()
      .addScaledVector(o.forward(), -this.def.followDist * 0.5)
      .setY(o.pos.y + this.def.hoverHeight);

    switch (this.state) {
      // ---- HURT: knocked away, tumbling, stunned ------------------------
      case 'hurt': {
        this.t += dt;
        this.pos.addScaledVector(this.vel, dt);
        this.vel.multiplyScalar(1 - dt * 2.6);
        this.vel.y -= dt * 2.0;
        this.speed = 0;
        if (this.stunT <= 0) { this.state = 'recover'; this.t = 0; }
        break;
      }
      // ---- RECOVER: it comes back. Always. -------------------------------
      // The wings resynchronise over about a second (see anim/garuda.js) and
      // it flies home. This is the visual promise that it is not gone, and it
      // is the reason the opponent's answer to Garuda has to be "time it",
      // not "kill it".
      case 'recover': {
        this.t += dt;
        const to = home.clone().sub(this.pos);
        const d = to.length();
        this.speed = Math.min(1, d / 4);
        if (d > 0.05) this.pos.addScaledVector(to.normalize(), Math.min(d, this.def.followSpeed * 1.5 * dt));
        if (this.t > 1.0 && d < 1.2) { this.state = 'hover'; this.t = 0; }
        break;
      }
      // ---- DIVE: the commanded attack ------------------------------------
      case 'dive': {
        const dv = this.def.dive;
        this.t += dt;
        if (this.t < dv.windup) {
          // THE TELL. The body straightens and it aims. Long enough to react
          // to, which is what makes the command a read rather than a
          // guaranteed hit.
          this.actionK = this.t / dv.windup;
          this.speed = 0.3;
          if (foe) this.diveTarget = foe.pos.clone().setY(foe.pos.y + 1.1);
          const aim = (this.diveTarget || home).clone().sub(this.pos);
          if (aim.lengthSq() > 1e-4) this.facing = yawBetween(v3(), aim);
          break;
        }
        this.actionK = 1;
        this.speed = 1;
        const tgt = this.diveTarget || home;
        const to = tgt.clone().sub(this.pos);
        const d = to.length();
        this.pos.addScaledVector(to.normalize(), Math.min(d, dv.speed * dt));
        // arrival: the hit resolves once, and then it pulls out
        if (d < 1.0 || this.t > dv.windup + 1.1) {
          this._resolveDive(foe);
          this.state = 'recover';
          this.t = 0;
          this.diveMass = null;
          this.model.setMass(hasMass(o) ? massFrac(o) : 0);
        }
        break;
      }
      // ---- HOVER / FLY: the default, which is most of every round --------
      default: {
        const to = home.clone().sub(this.pos);
        const d = to.length();
        this.speed = Math.min(1, d / 3.5);
        if (d > 0.12) {
          this.pos.addScaledVector(to.normalize(), Math.min(d, this.def.followSpeed * dt));
        }
        // face roughly where she is facing, or the opponent when close
        const look = foe && flatDist(this.pos, foe.pos) < 6
          ? foe.pos.clone().sub(this.pos)
          : o.forward();
        if (look.lengthSq() > 1e-4) {
          const want = yawBetween(v3(), look);
          let dz = want - this.facing;
          while (dz > Math.PI) dz -= Math.PI * 2;
          while (dz < -Math.PI) dz += Math.PI * 2;
          this.facing += dz * Math.min(1, dt * 4);
        }
        // ---- THE UNPROMPTED PECK ---------------------------------------
        // So it never reads as scenery. Tiny damage — it is presence, not a
        // damage source, and the number in the config says so.
        const is = this.def.idleStrike;
        if (this.idleStrikeCD <= 0 && foe?.alive && flatDist(this.pos, foe.pos) < is.range) {
          this.idleStrikeCD = is.cooldown;
          const { dmg } = computeDamage(o, is.dmg);
          const r = foe.applyHit({
            attacker: o, dmg, kb: 1.2, kbY: 0, hitstun: is.hitstun,
            type: 'light', src: 'garuda',
            dir: v3(foe.pos.x - this.pos.x, 0, foe.pos.z - this.pos.z).normalize()
          }, m.ctxFor(o));
          hitFeedback(m, o, foe, r, {});
          if (r === 'hit') massOnEvent(o, 'garuda');
        }
        break;
      }
    }

    // keep it inside the arena and off the floor
    const g = this.model.group;
    this.pos.y = Math.max(this.pos.y, (m.arena?.bounds?.floorAt?.(this.pos.x, this.pos.z, this.pos.y) ?? 0) + 0.8);
    g.position.copy(this.pos);
    g.rotation.y = this.facing;

    // STAR RAGE, poured through the bone. When it is not carrying a dive it
    // still shows HER current mass at a reduced level — the partner is part of
    // the technique, so it glows when she is heavy.
    if (this.state !== 'dive') {
      this.model.setMass(hasMass(o) ? massFrac(o) * 0.55 : 0);
    }

    this.tick(dt, {
      state: this.state, speed: this.speed, actionK: this.actionK,
      mass: this.model.mass
    });
  }

  _resolveDive(foe) {
    const m = this.match;
    const o = this.owner;
    const dv = this.def.dive;
    const ms = this.diveMass;
    const scale = ms || { dmg: 1, kb: 1, shake: 1, destruct: 1, k: 0 };
    m.cam.shake(0.4 * scale.shake);
    m.arena?.destruct?.damageAt(this.pos.clone(), 2.0, (dv.destruct ?? 30) * scale.destruct);
    m.sfx.impact?.();
    if (!foe?.alive || flatDist(this.pos, foe.pos) > dv.radius + 1.2) return;
    const { dmg, crit } = computeDamage(o, dv.dmg * scale.dmg);
    const r = foe.applyHit({
      attacker: o, dmg, kb: dv.kb * scale.kb, kbY: dv.kbY,
      hitstun: dv.hitstun, type: dv.type, src: 'garuda',
      dir: v3(foe.pos.x - this.pos.x, 0, foe.pos.z - this.pos.z).normalize()
    }, m.ctxFor(o));
    hitFeedback(m, o, foe, r, { crit, heavy: true });
    if (r === 'hit' || r === 'armor') massOnEvent(o, 'garuda');
  }
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
// One Garuda per Yuki, created when she enters the match and kept for its
// whole life. `resetRound` does NOT destroy it — it puts it back beside her,
// which is the round-scoped equivalent of "it always returns".
export class GarudaSystem {
  constructor(match) {
    this.match = match;
    this.list = [];
  }

  // Called from the match's fighter setup. Idempotent: a second call for the
  // same owner returns the existing one rather than fielding two.
  ensure(owner) {
    if (!owner?.cfg?.garuda) return null;
    const found = this.list.find(g => g.owner === owner);
    if (found) return found;
    const g = new Garuda(owner, this.match);
    this.list.push(g);
    return g;
  }

  forOwner(owner) { return this.list.find(g => g.owner === owner) || null; }

  // Yuki's B routes here.
  command(owner, target) {
    return this.forOwner(owner)?.command(target) ?? false;
  }

  // A projectile heading for Yuki asks this first. Returns true if Garuda ate
  // it — see `tryIntercept` for why it is a roll.
  intercept(owner) {
    return this.forOwner(owner)?.tryIntercept() ?? false;
  }

  // Area damage and melee both route here. Note it does NOT take a damage
  // number: nothing damages Garuda, because Garuda has no health. Everything
  // that hits it knocks it away instead, and the config's `hp: 0` plus
  // `returnAlways: true` is that ruling declared rather than implied.
  hurtAt(pos, radius, _dmg, attacker) {
    for (const g of this.list) {
      if (g.owner === attacker) continue;
      if (flatDist(g.pos, pos) < radius + 1.0) g.knockAway(pos);
    }
  }

  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.garudaHit) continue;
      for (const g of this.list) {
        if (g.owner === f) continue;
        const origin = f.pos.clone().addScaledVector(f.forward(), win.def.reach * 0.7);
        // it hovers, so the test has to be genuinely 3D — a flat distance
        // check would let a ground sweep swat a creature three metres up
        if (origin.distanceTo(g.pos) < 1.5) {
          win.garudaHit = true;
          g.knockAway(f.pos);
        }
      }
    }
  }

  update(dt) {
    this.meleeCheck();
    for (const g of this.list) g.update(dt);
  }

  // ROUND RESET. It is NOT removed and NOT rebuilt — it is put back beside
  // her with its timers cleared. Rebuilding it would be cheap and would also
  // be a lie about what the object is.
  resetRound() {
    for (const g of this.list) {
      g.state = 'hover';
      g.t = 0;
      g.stunT = 0;
      g.stunImmT = 0;
      g.interceptCD = 0;
      g.diveMass = null;
      g.vel.set(0, 0, 0);
      g.pos.copy(g.owner.pos).setY(g.owner.pos.y + g.def.hoverHeight);
      g.model.setMass(0);
      g.model.setVisible(true);
    }
  }

  clear() {
    for (const g of this.list) this.match.root.remove(g.model.group);
    this.list.length = 0;
  }
}
