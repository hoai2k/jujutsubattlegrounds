// JUDGEMAN — Higuruma's shikigami, and the whole reason his pre-domain game
// exists.
//
// It does not attack. It does not block. It follows him around and FILES
// EVIDENCE, and everything it files makes his one gamble a better bet:
//
//   · evidence lowers the cast gate on Deadly Sentencing, so a patient player
//     opens the courtroom noticeably earlier (fighter.castThresholdOverride);
//   · evidence shortens the execution sequence inside the duel, which is the
//     difference between a coin flip and a favourite.
//
// It gathers passively while it is alive, and MUCH faster while Higuruma is
// the one taking the beating — the case is being made against the person
// beating him up, and the character's entire pitch is "survive long enough".
//
// It is FRAGILE (22 hp — two clean hits from anyone) and it is a legitimate
// target: killing it turns the tap off until he spends another 18 CE and ten
// seconds of cooldown putting it back. That is the counterplay to the whole
// character, and it is why the CPU is taught to go and break it (ai.js).
//
// Like Mahito's transfigured human this is an ENTITY, not a Fighter: nothing
// in the domain framework knows about it, hostile domains do not stun it (it
// has no mind to overload — the eyes are sewn shut), and Boogie Woogie cannot
// use it as a swap anchor.
import { buildJudgeman } from '../../art/legacy/models/judgeman.js';
import { v3, rand, yawBetween, flatDist } from '../../core/math.js';

class Judgeman {
  constructor(owner, match) {
    this.owner = owner;
    this.match = match;
    this.def = owner.cfg.special.judgeman;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.model = buildJudgeman();
    this.pos = owner.pos.clone().addScaledVector(owner.forward(), -1.4);
    this.pos.y = 0;
    this.facing = owner.facing;
    this.dead = false;
    this.reveal = 0;
    this.hurtT = 0;
    this.t = 0;
    match.root.add(this.model.group);
    this.model.group.position.copy(this.pos);
  }

  get alive() { return !this.dead && this.hp > 0; }
  // the CPU's summon-clearing logic reads this the same way it reads a
  // shikigami's — see ai._pickSummon
  get targetable() { return this.alive && this.reveal > 0.4; }

  hurt(dmg, attacker) {
    if (this.dead) return;
    this.hp -= dmg;
    this.hurtT = 0.3;
    const p = this.pos.clone().add(v3(0, 1.0, 0));
    this.match.fx.hitSpark(p, 'light');
    this.match.sfx.hit(false);
    if (attacker) {
      const away = v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z).normalize();
      this.pos.addScaledVector(away, 0.45);
    }
    if (this.hp <= 0) this.die();
    else this.match.hud.toast(this.owner, 'JUDGEMAN STRUCK');
  }

  die(silent = false) {
    if (this.dead) return;
    this.dead = true;
    this.dyingT = 0.55;
    if (!silent) {
      this.match.sfx.judgemanBreak?.();
      const p = this.pos.clone().add(v3(0, 0.9, 0));
      for (let i = 0; i < 16; i++) {
        this.match.fx._spawn(p, {
          color: i % 4 === 0 ? 0xaab4c4 : 0x171b28, size: rand(0.10, 0.30),
          life: rand(0.3, 0.7), vel: v3(rand(-3, 3), rand(0.5, 4), rand(-3, 3)), gravity: 7
        });
      }
      this.match.hud.toast(this.owner, '審判 JUDGEMAN DESTROYED');
    }
  }

  update(dt) {
    const m = this.match;
    const g = this.model.group;
    this.t += dt;
    if (this.hurtT > 0) this.hurtT -= dt;

    if (this.dead) {
      // it sinks back into its own shadow rather than exploding
      this.dyingT -= dt;
      this.reveal = Math.max(0, this.reveal - dt * 3);
      this.model.setReveal(this.reveal);
      if (this.dyingT <= 0) { m.root.remove(g); return false; }
      return true;
    }
    if (!this.owner.alive || this.owner.eliminated) { this.die(true); return true; }

    // rise out of the floor on arrival
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 2.2);
      this.model.setReveal(this.reveal);
    }

    // ---- station-keeping ---------------------------------------------------
    // It holds a post BEHIND and slightly beside its summoner — out of the
    // fight, watching it. It never advances on the opponent, which is what
    // makes "go and break it" a real decision for them rather than a free one.
    const foe = m.other(this.owner);
    const back = this.owner.forward().multiplyScalar(-this.def.follow);
    const goal = this.owner.pos.clone().add(back).add(v3(Math.sin(this.t * 0.5) * 0.5, 0, 0));
    goal.y = 0;
    const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.25) {
      const sp = this.def.speed * (d > 5 ? 1.9 : 1);
      this.pos.x += (dx / d) * sp * dt;
      this.pos.z += (dz / d) * sp * dt;
    }
    // it faces the ACCUSED, not its summoner
    if (foe) this.facing = yawBetween(this.pos, foe.pos);

    // ---- EVIDENCE ----------------------------------------------------------
    gainEvidence(this.owner, this.def.gatherRate * dt);

    // ---- presentation ------------------------------------------------------
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    // the balance tips toward the accused as the case builds
    this.model.tick(dt, {
      tilt: (this.owner.evidence ?? 0) / (this.def.max || 100),
      hurt: this.hurtT > 0
    });
    // a slow drip of shadow off the hem, so it never reads as a static prop
    if (Math.random() < 0.10) {
      m.fx._spawn(this.pos.clone().add(v3(rand(-0.2, 0.2), rand(0.15, 0.5), rand(-0.2, 0.2))), {
        color: 0x171b28, size: rand(0.08, 0.18), life: rand(0.3, 0.6),
        vel: v3(rand(-0.3, 0.3), rand(-0.8, -0.2), rand(-0.3, 0.3))
      });
    }
    return true;
  }
}

// ---------------------------------------------------------------------------
// The one place evidence MOVES, so the cap and the derived cast gate can never
// drift apart from each other. Amounts may now be negative: domains became
// re-castable, and a lost execution duel spends half the case (see
// domains/sentencing.js `_escape`). A zero amount is still a no-op.
export function gainEvidence(f, amount) {
  if (!f?.cfg?.evidence || !amount) return;
  const max = f.cfg.special?.judgeman?.max ?? 100;
  const before = f.evidence ?? 0;
  f.evidence = Math.max(0, Math.min(max, before + amount));
  // THE CAST GATE. At zero evidence this is exactly 1 — the standard full-bar
  // ultimate gate every other domain caster pays. At full evidence it is
  // `gateAtFull`, and `Fighter.ultReady` reads it through
  // castThresholdOverride, so nothing about the shared gate had to change.
  const k = f.evidence / max;
  f.castThresholdOverride = 1 - (1 - (f.cfg.evidence.gateAtFull ?? 0.84)) * k;
}

export class Judgemen {
  constructor(match) {
    this.match = match;
    this.list = [];
  }

  spawn(owner) {
    // only ever one — the special refuses earlier if one is already up
    this.list.push(new Judgeman(owner, this.match));
  }
  aliveFor(owner) { return this.list.some(j => j.owner === owner && j.alive); }
  forOwner(owner) { return this.list.find(j => j.owner === owner && j.alive) || null; }

  // Higuruma took one. This is the accelerant: the worse the fight is going
  // for him, the faster the case against them writes itself.
  evidenceFromHit(victim, blocked) {
    const j = this.forOwner(victim);
    if (!j) return;
    const d = victim.cfg.special?.judgeman;
    if (!d) return;
    gainEvidence(victim, blocked ? d.onBlockedTaken : d.onHitTaken);
  }

  // area damage (eruptions, burning ground, sweeps)
  hurtAt(pos, radius, dmg, attacker) {
    for (const j of this.list) {
      if (!j.alive || j.owner === attacker) continue;
      if (flatDist(j.pos, pos) < radius) j.hurt(dmg, attacker);
    }
  }

  // melee swings connect with it too — one tag per swing, exactly like the
  // transfigured human (combat/minion.js)
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.judgemanHit) continue;
      for (const j of this.list) {
        if (!j.alive || j.owner === f) continue;
        const origin = f.pos.clone().addScaledVector(f.forward(), win.def.reach * 0.7);
        if (flatDist(origin, j.pos) < 1.0) {
          win.judgemanHit = true;
          j.hurt(win.def.dmg, f);
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

  clear() {
    for (const j of this.list) this.match.root.remove(j.model.group);
    this.list.length = 0;
  }
}
