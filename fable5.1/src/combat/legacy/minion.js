// TRANSFIGURED HUMAN — Mahito's summoned ally. One weak, fragile, independent
// AI body: it chases, swipes, and occasionally body-blocks for Mahito. Its
// value is pressure, not damage. Every summon's proportions, limb count and
// mass are randomized so no two are identical — misshapen, asymmetrical,
// unsettling. It is an entity, not a Fighter: domains treat it as scenery
// with two exceptions (a hostile domain stuns it; Jogo's heat cooks it), and
// Boogie Woogie ignores it entirely (the swap trades sorcerer positions —
// a transfigured lump is not a valid anchor, see the integration notes).
import * as THREE from 'three';
import { v3, rand, yawBetween, flatDist } from '../../core/math.js';
import { computeDamage, hitFeedback } from './hits.js';
import { buildTransfigured, TRANSFIGURED_IDS } from '../../art/legacy/models/transfigured.js';

// ---------------------------------------------------------------------------
// THE BODY
// ---------------------------------------------------------------------------
// This used to build one procedural lump here — a stack of spheres with one to
// four cylinders for arms, randomized per summon. Every result was the same
// silhouette at a different size, which is not what "no two are identical"
// meant and is nowhere near what a transfigured human looks like.
//
// It now picks one of FIVE HAND-AUTHORED BODY PLANS from
// art/models/transfigured.js, each with its own rig, its own animator and its
// own procedural skin. The randomization is unchanged in SPIRIT and completely
// changed in EFFECT: the variance is now between designs rather than inside
// one. See that file's reference sheet for what each variant is and why.
//
// NOTHING ABOUT THE GAMEPLAY BELOW CHANGED. Same stats off `cfg.special.minion`,
// same chase-and-swipe plan, same body-block, same one-at-a-time rule, same
// interactions with domains, shikigami and curses. This is an asset overhaul.
function buildMinionModel(variant) {
  const model = buildTransfigured(variant);

  // floating health bar (camera-facing; aimed per eye in core/stage.js)
  const barG = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x14161f, transparent: true, opacity: 0.75, depthWrite: false }));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.045),
    new THREE.MeshBasicMaterial({ color: 0x9fd08a, transparent: true, opacity: 0.95, depthWrite: false }));
  fill.position.z = 0.002;
  barG.add(back, fill);
  barG.userData.billboard = true;   // camera-facing, aimed per eye in core/stage.js
  barG.position.y = model.height + 0.30;
  model.group.add(barG);

  model.barG = barG;
  model.barFill = fill;
  // `H` is read by the hit-spark and death-burst heights below; it used to be
  // the randomized mass and is now simply the variant's height.
  model.H = model.height;
  return model;
}

class Minion {
  constructor(owner, match, variant = null) {
    this.owner = owner;
    this.match = match;
    const def = owner.cfg.special.minion;
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.life = def.duration;
    this.model = buildMinionModel(variant);
    this.variant = this.model.variant;
    this.pos = owner.pos.clone().addScaledVector(owner.forward(), 1.2);
    // on the floor under the spot he called it out of, not on a hardcoded 0
    this.pos.y = match.arena?.bounds?.floorAt(this.pos.x, this.pos.z, owner.pos.y + 0.55) ?? 0;
    this.facing = owner.facing;
    this.state = 'chase';       // chase | windup | recover | hit | block | dying
    this.t = 0;
    this.swingT = def.swingEvery * 0.5;
    this.planT = 0;
    this.blocking = false;
    this.animT = rand(0, 5);
    this.dead = false;
    this.reveal = 0;
    // THE SURFACING BEAT. Canon: "the 'sweat' of a human's soul 'trickles out'
    // every now and then, causing them to partially regain consciousness and
    // cry, plead for help, or ask for death." Every so often the creature stops
    // fighting, the wrong anatomy goes slack, and the person inside gets to the
    // surface for a second. It is the most upsetting thing about them and it is
    // free: it costs one float and it does not touch the AI.
    this.surface = 0;
    this.surfaceT = rand(2, this.model.surfaceRate);
    this.anim = {};
    match.root.add(this.model.group);
    // arrival: it claws its way up out of the floor
    this.model.group.position.copy(this.pos);
    this.model.setReveal(0);
  }

  get alive() { return !this.dead && this.hp > 0; }

  hurt(dmg, attacker, opts = {}) {
    if (this.dead) return;
    this.hp -= dmg;
    this.state = 'hit';
    this.t = 0.28;
    const kb = attacker ? v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z).normalize() : v3();
    this.pos.addScaledVector(kb, (opts.kb ?? 0.5));
    this.match.fx.hitSpark(this.pos.clone().add(v3(0, this.model.H * 0.7, 0)), 'light');
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die();
  }

  die(silent = false) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dying';
    this.t = 0.8;
    if (!silent) {
      this.match.sfx.minionDie();
      const p = this.pos.clone().add(v3(0, this.model.H * 0.5, 0));
      for (let i = 0; i < 14; i++) {
        this.match.fx._spawn(p, {
          color: i % 2 ? 0xb8a9a0 : 0x8b9bab, size: rand(0.12, 0.3), life: rand(0.3, 0.6),
          vel: v3(rand(-3, 3), rand(1, 5), rand(-3, 3)), gravity: 8
        });
      }
    }
  }

  update(dt) {
    const m = this.match;
    const g = this.model.group;

    if (this.state === 'dying') {
      this.t -= dt;
      // it sinks back into the floor it came out of rather than shrinking to a
      // point — the same emergence, reversed, which is what the reveal hook on
      // each variant is for
      this.reveal = Math.max(0, this.t / 0.8);
      this.model.setReveal(this.reveal);
      this.model.barG.visible = false;
      this.animT += dt;
      this.anim.hurt = true;
      this.anim.speed = 0;
      this.model.tick(dt, this.anim);
      g.position.y = this.pos.y + this.model.revealOffset;
      if (this.t <= 0) { m.root.remove(g); return false; }
      return true;
    }

    // lifetime + owner death
    this.life -= dt;
    if (this.life <= 0 || !this.owner.alive || this.owner.eliminated) { this.die(); return true; }

    // hostile domain: the sure-hit environment overwhelms it. It stands
    // twitching (stunned); inside Jogo's furnace it also cooks.
    const d = m.domains.state;
    const hostileDomain = d && d.phase === 'active' && d.caster !== this.owner;
    if (hostileDomain && d.def.sureHit.effect === 'iron_mountain') {
      this.hp -= (d.def.heat?.dps ?? 2.6) * dt;
      if (this.hp <= 0) { this.die(); return true; }
    }

    // haul itself up out of the floor on arrival
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 2.6);
      this.model.setReveal(this.reveal);
    }

    // GETO'S DECOY EYE writes `_decoyLure` onto hostile summons; while it is
    // alive and close, that is what this thing chases instead. Same
    // substitution the shikigami take, done here rather than in the curse
    // system so no existing file's behaviour is rewritten to add it.
    let target = m.other(this.owner);
    if (this._decoyLure) {
      const lure = this._decoyLure;
      if (lure.alive && flatDist(this.pos, lure.pos) < (lure.def.decoy?.radius ?? 9)) target = lure;
      else this._decoyLure = null;
    }
    const distT = target ? flatDist(this.pos, target.pos) : 99;

    if (!hostileDomain && target?.alive) {
      // simple plan: mostly chase-and-swipe, occasionally body-block
      this.planT -= dt;
      if (this.planT <= 0) {
        this.planT = rand(1.2, 2.6);
        this.blocking = Math.random() < 0.3;
      }
      this.swingT -= dt;

      if (this.state === 'hit') {
        this.t -= dt;
        if (this.t <= 0) this.state = 'chase';
      } else if (this.state === 'windup') {
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'recover';
          this.t = 0.5;
          // the swipe lands: low damage, reduced MAX_CE feed to Mahito,
          // reduced transfiguration drain inside his domain
          if (flatDist(this.pos, target.pos) < this.def.reach + 0.4) {
            const { dmg } = computeDamage(this.owner, this.def.dmg, { canCrit: false });
            // a decoy curse is not a Fighter and has no `applyHit` — see the
            // `_decoyLure` substitution above
            if (!target.applyHit) {
              target.hurt?.(dmg * 1.3, this.owner, { kb: 0.3 });
            } else {
              const r = target.applyHit({
                dmg, kb: this.def.kb, kbY: 0, hitstun: this.def.hitstun, type: 'light',
                attacker: this.owner, isCT: false, minion: true, src: 'summon',
                dir: v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize()
              }, m.ctxFor(this.owner));
              hitFeedback(m, this.owner, target, r, {});
              if (r === 'hit' || r === 'otg') {
                this.owner.gainMaxCE(this.owner.cfg.stats.ceGainPerPunch * this.def.ceFeedMult);
                m.domains.transfigChunk(this.owner, target, 'minion', false);
              } else if (r === 'block') {
                m.domains.transfigChunk(this.owner, target, 'minion', true);
              }
            }
          }
        }
      } else if (this.state === 'recover') {
        this.t -= dt;
        if (this.t <= 0) this.state = 'chase';
      } else {
        // chase / body-block movement
        let goal;
        if (this.blocking) {
          // put itself between Mahito and the opponent
          goal = this.owner.pos.clone().lerp(target.pos, 0.55);
        } else {
          goal = target.pos;
        }
        const dx = goal.x - this.pos.x, dz = goal.z - this.pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > (this.blocking ? 0.4 : this.def.reach * 0.8)) {
          const sp = this.def.speed * (dist > 4 ? 1.4 : 1);
          this.pos.x += (dx / dist) * sp * dt;
          this.pos.z += (dz / dist) * sp * dt;
        }
        this.facing = yawBetween(this.pos, target.pos);
        if (!this.blocking && distT < this.def.reach && this.swingT <= 0) {
          this.swingT = this.def.swingEvery * rand(0.85, 1.3);
          this.state = 'windup';
          this.t = 0.38;
          // lunge into the swipe
          const fw = v3(Math.sin(this.facing), 0, Math.cos(this.facing));
          this.pos.addScaledVector(fw, 0.25);
        }
      }
    }

    // stay in the arena
    const r = Math.hypot(this.pos.x, this.pos.z);
    if (r > this.owner.arenaRadius) { const s = this.owner.arenaRadius / r; this.pos.x *= s; this.pos.z *= s; }

    // ---- THE SURFACING -----------------------------------------------------
    // On its own timer, unrelated to the fight. It ramps up over half a second,
    // holds for about a second, and drops — and while it holds, every variant's
    // animator slackens its wrong anatomy and pushes a human face up through
    // the flesh. Deliberately NOT gated on the AI state: the person inside does
    // not wait for a convenient moment.
    this.surfaceT -= dt;
    if (this.surfaceT <= 0) {
      this.surfaceT = rand(this.model.surfaceRate * 0.7, this.model.surfaceRate * 1.5);
      this.surfaceHold = 1.4;
    }
    if (this.surfaceHold > 0) {
      this.surfaceHold -= dt;
      this.surface = Math.min(1, this.surface + dt * 2.2);
      // one wet mote per surfacing beat — the "sweat of the soul", which is
      // the phrase the reference actually uses
      if (Math.random() < 0.25) {
        m.fx._spawn(this.pos.clone().add(v3(rand(-0.3, 0.3), this.model.height * rand(0.5, 0.9), rand(-0.3, 0.3))), {
          color: 0xc8d4e0, size: rand(0.05, 0.12), life: rand(0.4, 0.8), opacity: 0.55,
          vel: v3(rand(-0.3, 0.3), rand(-0.4, 0.2), rand(-0.3, 0.3)), gravity: 2
        });
      }
    } else {
      this.surface = Math.max(0, this.surface - dt * 1.6);
    }

    // ---- drive the variant's own animator ----------------------------------
    // Each of the five body plans owns its gait; this hands it the state and
    // gets out of the way. Nothing here knows how many arms the thing has,
    // which is exactly the point of splitting the models out.
    // ---- the ground under it ------------------------------------------------
    // It walks in x/z and used to be pinned to the y it was summoned at, which
    // was a hardcoded 0: summon on a mezzanine and the thing appeared on the
    // ground floor, and anywhere with terrain it waded through the map. It
    // takes the floor under it, and the walls turn it, the same as a fighter —
    // it just does not fall, because a summon has no weight to speak of.
    const bd = m.arena?.bounds;
    if (bd) {
      bd.resolveWalls(this.pos, 0.36);
      this.pos.y = bd.floorAt(this.pos.x, this.pos.z, this.pos.y + 0.55);
    }

    this.animT += dt;
    const mm = this.model;
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    this.anim.speed = this.state === 'chase' ? this.def.speed * (distT > 4 ? 1.4 : 1) : 0;
    this.anim.hurt = this.state === 'hit';
    this.anim.surface = this.surface;
    if (this.state === 'windup') {
      this.anim.action = 'swipe';
      this.anim.actionK = Math.max(0, Math.min(1, 1 - this.t / 0.38));
    } else if (this.state === 'recover') {
      this.anim.action = 'swipe';
      this.anim.actionK = Math.max(0, this.t / 0.5);
    } else {
      this.anim.action = null;
      this.anim.actionK = 0;
    }
    this._lodT = (this._lodT ?? 0) - dt;
    if (this._lodT <= 0 && mm.setLOD) {
      this._lodT = 0.2;
      mm.setLOD(this.pos.distanceTo(m.stage.camera.position));
    }
    mm.tick(dt, this.anim);
    // the emergence sinks the whole body into the floor; the variant's own
    // animator does the bobbing on an inner joint, so the two never fight
    g.position.y = this.pos.y + mm.revealOffset;

    mm.barFill.scale.x = Math.max(0.02, this.hp / this.maxHp);
    mm.barFill.material.color.setHex(this.hp < this.maxHp * 0.35 ? 0xd85a4a : 0x9fd08a);
    return true;
  }
}

export class Minions {
  constructor(match) {
    this.match = match;
    this.list = [];
  }

  // `variant` is optional and only ever passed by the model bench and the
  // verification harness; the game always lets it pick at random.
  spawn(owner, variant = null) {
    this.list.push(new Minion(owner, this.match, variant));
    return this.list[this.list.length - 1];
  }

  aliveFor(owner) {
    return this.list.some(mn => mn.owner === owner && mn.alive);
  }

  // How many of his are standing. The summon is capped on this rather than on
  // "is one out", so Mahito can field a crew as long as he can pay for it.
  countFor(owner) {
    let n = 0;
    for (const mn of this.list) if (mn.owner === owner && mn.alive) n++;
    return n;
  }

  // area damage from techniques (eruptions, burning ground)
  hurtAt(pos, radius, dmg, attacker) {
    for (const mn of this.list) {
      if (!mn.alive || mn.owner === attacker) continue;
      if (flatDist(mn.pos, pos) < radius) mn.hurt(dmg, attacker);
    }
  }

  // melee swings connect with minions too — checked per active window, and a
  // swing can hit a fighter AND the minion (each swing tags it once)
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.minionHit) continue;
      for (const mn of this.list) {
        if (!mn.alive || mn.owner === f) continue;
        const fwd = f.forward();
        const origin = f.pos.clone().addScaledVector(fwd, win.def.reach * 0.7);
        if (flatDist(origin, mn.pos) < 0.9) {
          win.minionHit = true;
          mn.hurt(win.def.dmg, f, { kb: win.def.kb * 0.2 });
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
    for (const mn of this.list) this.match.root.remove(mn.model.group);
    this.list.length = 0;
  }
}
