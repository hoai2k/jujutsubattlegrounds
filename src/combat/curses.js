// CURSED SPIRIT MANIPULATION — 呪霊操術. Geto's stable.
//
// ===========================================================================
// THE ASSET REUSE, WHICH IS THE POINT OF THIS FILE
// ===========================================================================
// Four of the six curses in Geto's stable ALREADY EXIST in this game as fully
// playable characters. Nothing about them is rebuilt here:
//
//   MODEL      buildJogo / buildHanami / buildMahito / buildKurourushi are
//              called directly, unchanged, from art/models/*.js. These are the
//              same functions the character select screen and the viewer call.
//   RIG        comes with the model — the shared 20-bone skeleton, built by
//              the same buildHumanoid pass.
//   CLIPS      makeClips('jogo') etc., unchanged, from art/anim/index.js. The
//              full playable clip set, including their technique clips.
//   PLAYER     the same AnimPlayer class a Fighter drives its skeleton with.
//
// So a summoned Jogo is, visually and animation-wise, THE PLAYABLE JOGO. Same
// geometry, same skeleton, same idle, same walk, same ct1 cast. What is new is
// only the ~180 lines of AI brain below and a stat line that cuts him down.
//
// See the reuse ledger in the delivery notes for the exact accounting. In
// short: 100% of model, rig and animation reused for the four special grades;
// 0% reused for the two low grades, which correspond to no playable character
// and are original geometry in art/models/lowcurses.js.
//
// ===========================================================================
// WHY THIS IS NOT combat/shikigami.js
// ===========================================================================
// Megumi's system and Geto's system look superficially alike (a summoner, a
// permanence rule, a wheel) and they are deliberately NOT shared code, because
// the two characters are built to feel opposite:
//
//   MEGUMI     a personal wheel of six shikigami. He binds two at a time, they
//              are HIS, and losing one is losing a limb. His domain gives them
//              all back. He fights alongside them.
//   GETO       an ARMY of borrowed monsters. He holds many, he deploys them,
//              he hides behind them, and he can CASH THE ENTIRE STABLE IN at
//              once for Maximum: Uzumaki. Nothing gives them back — not a
//              domain, because he does not have one.
//
// Concretely, three things here have no analogue in shikigami.js: REABSORB
// (pull a wounded curse out and get some of the cost back), the SLOT RULE that
// counts low grades and special grades differently, and the fact that the
// stable is a spendable pool whose SIZE feeds an ultimate's damage.
//
// Both systems run on the same field at the same time and are tested doing so.
// So does Mahito's transfigured human. See `_crossCheck` for the three-way.
// ===========================================================================
import * as THREE from 'three';
import { v3, rand, flatDist, yawBetween } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import { SPECIAL } from './balance.js';
import { AnimPlayer } from '../art/anim/player.js';
import { makeClips } from '../art/anim/index.js';
import { buildJogo } from '../art/models/jogo.js';
import { buildHanami } from '../art/models/hanami.js';
import { buildMahito } from '../art/models/mahito.js';
import { buildKurourushi } from '../art/models/kurourushi.js';
import { buildGapingMaw, buildTendrilWisp } from '../art/models/lowcurses.js';
import {
  buildCentipede, buildDecoyEye, buildFleshEater, buildKoGuy,
  buildFungusHead, buildDaruma, buildPillarCurse,
  buildMantaRay, buildRainbowDragon, buildHookworm
} from '../art/models/getocurses.js';
// The canonical table, imported so a BORROWED curse (Yuta's Copy) can be built
// without its owner having a `curses` block in their config — the same trick
// combat/shikigami.js uses for the copied Divine Dog.
import { CURSE_DEFS as BORROWED_DEFS } from '../characters/geto.js';

const VIOLET = 0x6b2fa0;
const VIOLET_HI = 0xa878e0;
const EMERGE_TIME = 0.5;
const DISSOLVE_TIME = 0.6;

// ---------------------------------------------------------------------------
// BODY ADAPTERS
// ---------------------------------------------------------------------------
// Two kinds of body end up on the field and the Curse entity must not care
// which it has. A REUSED body is a full CharacterModel with a skeleton and a
// clip set; a LOW-GRADE body is a small procedural prop with a tick(). Both
// are wrapped to the same four calls: group, height, setReveal, tick.
function riggedBody(build, clipId, height) {
  const model = build();
  const clips = makeClips(clipId);
  const anim = new AnimPlayer(model.bones, clips);
  anim.play('idle', { fade: 0, restart: true });
  let cur = 'idle';
  return {
    group: model.group, height, radius: 0.5, rigged: true, model, anim,
    // reveal by SCALE. The reused models have no reveal hook of their own —
    // adding one would mean touching four playable character files, which is
    // exactly what this addition must not do.
    setReveal(k) {
      const s = Math.max(0.001, k);
      model.group.scale.setScalar(s);
      model.group.visible = k > 0.001;
    },
    play(name, opts = {}) {
      if (name === cur && !opts.restart) return;
      if (!clips.has(name)) return;
      cur = name;
      anim.play(name, { fade: opts.fade ?? 0.10, speed: opts.speed ?? 1, restart: true });
    },
    current() { return cur; },
    tick(dt) { anim.update(dt); model.update(dt); }
  };
}

const BUILDERS = {
  // THE FOUR REUSED PLAYABLE CURSES. Heights match their own configs so the
  // health bar and the strike origin sit where they should.
  jogo: () => riggedBody(buildJogo, 'jogo', 1.72),
  hanami: () => riggedBody(buildHanami, 'hanami', 2.15),
  mahito: () => riggedBody(buildMahito, 'mahito', 1.76),
  kurourushi: () => riggedBody(buildKurourushi, 'kurourushi', 2.30),
  // THE ORIGINAL BODIES. Two were already here; the ten below are new, and all
  // of them are curses Geto or Kenjaku is actually drawn using — see the
  // reference sheet at the top of art/models/getocurses.js for the quote each
  // one is built from.
  lowMaw: () => buildGapingMaw(),
  lowWisp: () => buildTendrilWisp(),
  lowCentipede: () => buildCentipede(),
  lowEye: () => buildDecoyEye(),
  lowEater: () => buildFleshEater(),
  midKoGuy: () => buildKoGuy(),
  midFungus: () => buildFungusHead(),
  midDaruma: () => buildDaruma(),
  midPillar: () => buildPillarCurse(),
  spManta: () => buildMantaRay(),
  spDragon: () => buildRainbowDragon(),
  spHookworm: () => buildHookworm()
};

// Heights, so the health bar and the strike origin sit where they should. The
// reused playable curses declare theirs in `riggedBody`; the original bodies
// carry their own `height`, and this is only the fallback for anything that
// does not.
function bodyHeightFallback(def) { return def.specialGrade ? 2.4 : 1.0; }

// ---------------------------------------------------------------------------
// ONE CURSE ON THE FIELD
// ---------------------------------------------------------------------------
class Curse {
  constructor(sys, owner, def, opts = {}) {
    this.sys = sys;
    this.match = sys.match;
    this.owner = owner;
    this.def = def;
    this.key = def.key;
    this.body = BUILDERS[def.body]();
    this.hp = this.maxHp = def.hp;
    this.life = def.life;
    this.pos = (opts.at || owner.pos.clone()).clone();
    this.pos.y = 0;
    this.facing = owner.facing;
    this.state = 'emerge';
    this.t = 0;
    this.reveal = 0;
    this.dead = false;
    this.destroyed = false;         // killed => struck from the stable
    this.recalled = false;          // reabsorbed => back in the stable
    this.swingT = def.swingEvery * rand(0.3, 0.7);
    this.hurtT = 0;
    this.speed = 0;
    this.anim = {};
    this.smokeT = 0;
    this.blockT = rand(1.5, 3.5);
    this.blocking = false;
    // per-role scratch, kept off `anim` because the models never read it
    this.latched = null;        // FLESH-EATER: who it is attached to
    this.latchT = 0;
    this.swallowT = 0;          // HOOKWORM: how long it is holding them for
    this.eruptT = rand(2, 5);   // HOOKWORM: when it next submerges and relocates
    this.carryT = rand(3, 6);   // MANTA: when it next offers Geto a ride
    this.flyY = 0;              // MANTA / DRAGON: current altitude

    // floating health bar, same language Mahito's minion and Megumi's
    // shikigami already use, in Geto's violet so three summon systems on one
    // field stay tellable apart at a glance
    const barG = new THREE.Group();
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.08),
      new THREE.MeshBasicMaterial({ color: 0x0b0710, transparent: true, opacity: 0.8, depthWrite: false }));
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.052),
      new THREE.MeshBasicMaterial({ color: VIOLET_HI, transparent: true, opacity: 0.95, depthWrite: false }));
    fill.position.z = 0.002;
    barG.add(back, fill);
    barG.userData.billboard = true;   // camera-facing, aimed per eye in core/stage.js
    barG.position.y = this.body.height + 0.38;
    this.body.group.add(barG);
    this.barG = barG;
    this.barFill = fill;

    this.body.setReveal(0);
    this.body.group.position.copy(this.pos);
    this.match.root.add(this.body.group);
  }

  get alive() { return !this.dead && this.hp > 0; }
  get targetable() { return this.alive && this.state !== 'emerge'; }
  get special() { return !!this.def.specialGrade; }

  hurt(dmg, attacker, opts = {}) {
    if (this.dead || this.state === 'emerge') return;
    // ARMOUR. Only the Rainbow Dragon has it, and it is the one thing the
    // reference says about the creature — "the HARDEST SKIN out of all of
    // Geto's cursed spirits". A flat multiplier rather than extra health,
    // because health makes a body last longer and armour makes it feel
    // different to hit, and the second is what the description is describing.
    if (this.def.armour) dmg *= this.def.armour;
    this.hp -= dmg;
    this.hurtT = 0.26;
    if (attacker) {
      const kb = v3(this.pos.x - attacker.pos.x, 0, this.pos.z - attacker.pos.z).normalize();
      this.pos.addScaledVector(kb, opts.kb ?? 0.32);
    }
    this.match.fx.hitSpark(this.pos.clone().add(v3(0, this.body.height * 0.6, 0)), 'light');
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die('killed');
  }

  // THE PERMANENCE RULE. `how` decides whether the stable loses this curse:
  //   'killed'    — struck from the stable FOR THE REST OF THE MATCH. Same
  //                 rule Megumi's shikigami play by, deliberately.
  //   'recalled'  — REABSORB. It goes back in the stable and part of the cost
  //                 is refunded. This is the decision the character is built
  //                 around: pulling a wounded curse out is the correct play
  //                 and it costs tempo to make.
  //   'consumed'  — spent by Maximum: Uzumaki. Gone, and it made the ultimate
  //                 bigger on the way out.
  //   'expired'   — the life timer, the owner going down, a round reset. No
  //                 loss: it simply is not on the field any more.
  die(how = 'expired') {
    if (this.dead) return;
    this.dead = true;
    this.destroyed = how === 'killed' || how === 'consumed';
    this.recalled = how === 'recalled';
    this.state = 'dying';
    this.t = how === 'consumed' ? 0.25 : DISSOLVE_TIME;

    const p = this.pos.clone().add(v3(0, this.body.height * 0.45, 0));
    const n = this.special ? 26 : 14;
    for (let i = 0; i < n; i++) {
      this.match.fx._spawn(p.clone().add(v3(rand(-0.5, 0.5), rand(-0.3, 0.5), rand(-0.5, 0.5))), {
        color: i % 3 === 0 ? VIOLET_HI : 0x140b1e, size: rand(0.16, 0.44), life: rand(0.3, 0.7),
        vel: how === 'recalled'
          // a recall is an IMPLOSION — it falls back toward Geto rather than
          // bursting, so the two outcomes never look alike
          ? this.owner.pos.clone().sub(p).normalize().multiplyScalar(rand(4, 9))
          : v3(rand(-2.4, 2.4), rand(0.5, 4), rand(-2.4, 2.4)),
        gravity: how === 'recalled' ? 0 : 3
      });
    }

    if (how === 'killed') {
      this.match.sfx.curseLost?.();
      this.match.hud.toast(this.owner, this.def.short + ' DESTROYED — GONE FOR THE MATCH');
      this.sys._recordLoss(this.owner, this.key);
    } else if (how === 'recalled') {
      this.match.sfx.curseRecall?.();
      this.match.hud.toast(this.owner, this.def.short + ' REABSORBED');
    } else if (how === 'consumed') {
      this.sys._recordLoss(this.owner, this.key);
    }
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt) {
    const m = this.match;
    const g = this.body.group;

    if (this.state === 'dying') {
      this.t -= dt;
      this.reveal = Math.max(0, this.t / DISSOLVE_TIME);
      this.body.setReveal(this.reveal);
      this.barG.visible = false;
      if (this.t <= 0) { m.root.remove(g); return false; }
      this.body.tick(dt, this.anim);
      return true;
    }

    this.life -= dt;
    if (!this.owner.alive || this.owner.eliminated) { this.die('expired'); return true; }
    if (this.life <= 0) { this.die('expired'); return true; }

    // ---- HOSTILE DOMAINS ----------------------------------------------------
    // A borrowed monster standing in someone else's world. The rulings mirror
    // the ones combat/shikigami.js already makes, with one change that follows
    // from what these things ARE:
    //
    //   UNLIMITED VOID   — the link severs, exactly as it does for Megumi. But
    //                      Geto's curses DISMISS rather than die, for the same
    //                      reason: an infinity of information is not a weapon,
    //                      and it must not cost him his whole stable.
    //   IRON MOUNTAIN    — Jogo's furnace. THE ONE PLACE THIS DIFFERS: a
    //                      summoned JOGO is immune to it (he is the fire), and
    //                      a summoned HANAMI cooks faster, because his config
    //                      declares fireVulnerability and that ruling should
    //                      not evaporate just because he is on a leash. Both
    //                      fall straight out of reading the curse's own key,
    //                      and both are the answer a player would predict.
    //   SELF-EMBODIMENT  — Idle Transfiguration reshapes SOULS, and a cursed
    //                      spirit is made of cursed energy rather than a body
    //                      with a soul in it. They keep fighting. This is the
    //                      same ruling Megumi's shadow constructs get and it
    //                      is right for the same reason.
    const d = m.domains.state;
    const hostile = d && d.phase === 'active' && d.caster !== this.owner;
    if (hostile) {
      const eff = d.def.sureHit.effect;
      if (eff === 'void_lock') { this.die('expired'); return true; }
      if (eff === 'iron_mountain' && this.key !== 'jogo') {
        const heat = (d.def.heat?.dps ?? 2.6) * (this.key === 'hanami' ? 1.5 : 1.05);
        this.hp -= heat * dt;
        if (this.hp <= 0) { this.die('killed'); return true; }
      }
    }

    if (this.state === 'emerge') {
      this.t += dt;
      this.reveal = Math.min(1, this.t / (this.special ? EMERGE_TIME * 1.6 : EMERGE_TIME));
      this.body.setReveal(this.reveal);
      if (this.reveal >= 1) { this.state = 'chase'; this.t = 0; }
    }

    if (this.hurtT > 0) this.hurtT -= dt;
    const target = this._pickTarget();
    if (this.state !== 'emerge' && target) this._behave(dt, target);

    // the family tell: violet smoke off the silhouette. Deliberately a
    // different colour and a different density from Megumi's shadow-blue wisps
    // so two summoners' fields never blur together.
    this.smokeT -= dt;
    if (this.smokeT <= 0) {
      this.smokeT = rand(0.10, 0.24);
      m.fx._spawn(this.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.2, 1) * this.body.height, rand(-0.4, 0.4))), {
        color: Math.random() < 0.4 ? VIOLET : 0x140b1e, size: rand(0.12, 0.30),
        life: rand(0.3, 0.65), opacity: 0.5, vel: v3(rand(-0.3, 0.3), rand(0.4, 1.2), rand(-0.3, 0.3))
      });
    }

    const bounds = m.arena.bounds;
    if (bounds) bounds.clampXZ(this.pos, 0.4);

    // ---- FLIGHT --------------------------------------------------------------
    // The manta and the Rainbow Dragon are the two curses in the stable that
    // fly, and both are described that way in the reference. Altitude is eased
    // rather than snapped so a dive genuinely reads as a descent, and it drops
    // to nothing while the manta is carrying Geto (it has to come down to pick
    // him up).
    if (this.def.flyHeight != null) {
      const want = this.carrying > 0 ? 1.2
        : (this.state === 'act' ? this.def.flyHeight * 0.25 : this.def.flyHeight);
      this.pos.y += (want - this.pos.y) * Math.min(1, dt * 2.6);
    }

    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    // same outline LOD the shikigami take — see art/builders/bake.js
    this._lodT = (this._lodT ?? 0) - dt;
    if (this._lodT <= 0 && this.body.setLOD) {
      this._lodT = 0.2;
      this.body.setLOD(this.pos.distanceTo(m.stage.camera.position));
    }
    this.anim.speed = this.speed;
    this.anim.hurt = this.hurtT > 0;
    // REUSED BODIES DRIVE THEMSELVES OFF THEIR OWN CLIP SET. This is the whole
    // reuse payoff in two lines: a summoned Hanami walks with Hanami's walk
    // cycle and casts with Hanami's ct1 clip, because those clips are right
    // there in the model's own AnimPlayer.
    if (this.body.rigged) {
      if (this.state === 'act') this.body.play(this.def.clip ?? 'ct1');
      else if (this.hurtT > 0) this.body.play('hitLight');
      else if (this.speed > 0.4) this.body.play(this.speed > 3.4 ? 'run' : 'walk');
      else this.body.play('idle');
    }
    this.body.tick(dt, this.anim);

    this.barFill.scale.x = Math.max(0.02, this.hp / this.maxHp);
    this.barFill.material.color.setHex(this.hp < this.maxHp * 0.35 ? 0xd85a4a : VIOLET_HI);
    return true;
  }

  // ---- targeting ----------------------------------------------------------
  // "Decide whether summons fight each other and implement it." They do, and
  // the rule is simple and symmetric: a curse prefers the opposing FIGHTER,
  // but a hostile summon standing between it and that fighter is worth
  // clearing first. That produces the behaviour a player expects — the curses
  // and the shikigami tangle in the middle while the two summoners circle —
  // without any of them ever losing sight of the actual win condition.
  _pickTarget() {
    const m = this.match;
    const foe = m.other(this.owner);
    const here = flatDist(this.pos, foe?.pos ?? this.pos);
    let best = foe?.alive ? { actor: foe, kind: 'fighter', d: here } : null;
    const consider = (actor, kind) => {
      const dd = flatDist(this.pos, actor.pos);
      // only divert for something genuinely in the way and genuinely close
      if (dd > 3.0) return;
      if (!best || dd < best.d * 0.55) best = { actor, kind, d: dd };
    };
    for (const s of (m.shikigami?.list ?? [])) {
      if (s.targetable && s.owner !== this.owner) consider(s, 'summon');
    }
    for (const mn of (m.minions?.list ?? [])) {
      if (mn.alive && mn.owner !== this.owner) consider(mn, 'summon');
    }
    for (const c of this.sys.list) {
      if (c !== this && c.targetable && c.owner !== this.owner) consider(c, 'summon');
    }
    return best;
  }

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
  _face(p, dt, rate = 8) {
    const want = yawBetween(this.pos, p);
    let diff = want - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing += diff * Math.min(1, rate * dt);
  }

  // Everything a curse does to a FIGHTER goes through the normal damage
  // pipeline, so blocking, i-frames, juggles, adaptation and the CE economy
  // behave exactly as they do for a hit thrown by hand.
  //
  // TWO TAGS MATTER AND BOTH ARE DELIBERATE:
  //   src: 'summon'  — the adaptation category. Adapting to Geto's hands does
  //                    nothing about his curses, and adapting to his curses
  //                    blunts ALL of them at once (they are one technique).
  //                    It is also what makes them share a bucket with Megumi's
  //                    shikigami, which is correct: they are the same kind of
  //                    thing arriving from two different men.
  //   curse: key     — read by combat/freeze.js. THIS IS WHAT STOPS A CURSE
  //                    TRIGGERING NAOYA'S FREEZE. Geto's whole game against
  //                    Naoya is to never touch him personally, and the tag is
  //                    what makes that a real plan rather than a hope.
  _strike(target, { dmg, kb, kbY = 0, hitstun, type = 'light', elem = null }) {
    const m = this.match;
    const { dmg: out } = computeDamage(this.owner, dmg, { canCrit: false });
    const r = target.applyHit({
      dmg: out, kb, kbY, hitstun, type, attacker: this.owner, isCT: false,
      src: 'summon', curse: this.key, elem,
      dir: v3(target.pos.x - this.pos.x, 0, target.pos.z - this.pos.z).normalize()
    }, m.ctxFor(this.owner));
    hitFeedback(m, this.owner, target, r, { heavy: type !== 'light' });
    if (r === 'hit' || r === 'otg') {
      // Curses feed REDUCED MAX_CE growth. Geto has to land his own hits to
      // keep the army on the field — that is the resource loop the brief asked
      // for, and this multiplier is where it lives.
      this.owner.gainMaxCE(this.owner.cfg.stats.ceGainPerPunch * (this.def.ceFeed ?? 0.25));
    }
    return r;
  }

  // hitting a non-fighter (another summon) — no damage pipeline, just HP
  _strikeSummon(actor, dmg) {
    actor.hurt(dmg, this.owner, { kb: 0.4 });
  }

  // ---- ROLE BEHAVIOURS -----------------------------------------------------
  // "No two summons in the stable should play the same. Give each a single
  // clear role — chase, zone, block, grab, harass, burst — legible within two
  // seconds of it hitting the field."
  //
  // Most of a role is expressed in the DEF (preferRange, blockChance, speed,
  // swingEvery) and in the one signature move. What needs code is the handful
  // of behaviours that are not "walk somewhere and hit something": the ones
  // below run BEFORE the shared chase logic and can take the frame entirely.
  //
  // Every one of them is the canon description of that specific curse, not a
  // generic archetype — the flesh-eaters "work together to suck a person's
  // flesh apart", the manta "has enough size to support Suguru and one other
  // person", the hookworm "always appears suddenly from the ground".
  _roleTick(dt, tgt) {
    const def = this.def, m = this.match;

    // ---- FLESH-EATER: LATCHED ON -------------------------------------------
    // Once it lands it stops being a fighter and becomes a condition. It rides
    // the target, drains, and slows them, until the timer runs out or it dies.
    if (this.latched) {
      const v = this.latched;
      this.latchT -= dt;
      if (!v.alive || this.latchT <= 0) { this.latched = null; this.state = 'recover'; this.t = 0.6; return false; }
      // it is ON them, so it moves with them
      this.pos.set(v.pos.x, 0, v.pos.z).addScaledVector(v3(Math.sin(this.facing), 0, Math.cos(this.facing)), -0.55);
      this.pos.y = 0.9;
      this.speed = 0;
      this.anim.action = 'bite';
      this.anim.actionK = 0.5 + Math.sin(this.latchT * 9) * 0.5;
      this.drainT = (this.drainT ?? 0) - dt;
      if (this.drainT <= 0) {
        this.drainT = 0.25;
        this._strike(v, { dmg: def.latch.dps * 0.25, kb: 0, hitstun: 2, type: 'light' });
        v.vel.multiplyScalar(1 - def.latch.slow);
        m.fx._spawn(this.pos.clone().add(v3(0, 0.3, 0)), {
          color: 0x8e3a48, size: rand(0.08, 0.18), life: 0.3,
          vel: v3(rand(-1.5, 1.5), rand(0.5, 2), rand(-1.5, 1.5)), gravity: 5
        });
      }
      return true;
    }

    // ---- HOOKWORM: SWALLOWING ----------------------------------------------
    // It does not knock them away, it holds them inside itself. Canon ate Toji
    // whole and canon also had him cut his way out from the inside, so the hold
    // is short and it is damage-over-time rather than a kill.
    if (this.swallowT > 0) {
      const v = tgt.kind === 'fighter' ? tgt.actor : null;
      this.swallowT -= dt;
      this.speed = 0;
      this.anim.action = 'grab';
      this.anim.actionK = 0.6 + Math.sin(this.swallowT * 7) * 0.4;
      if (v?.alive) {
        v.pos.x += (this.pos.x - v.pos.x) * Math.min(1, dt * 9);
        v.pos.z += (this.pos.z - v.pos.z) * Math.min(1, dt * 9);
        v.vel.set(0, 0, 0);
        v.rootT = Math.max(v.rootT, 0.15);
        this.drainT = (this.drainT ?? 0) - dt;
        if (this.drainT <= 0) {
          this.drainT = 0.3;
          this._strike(v, { dmg: def.swallow.dps * 0.3, kb: 0, hitstun: 4, type: 'light' });
        }
      }
      if (this.swallowT <= 0) { this.state = 'recover'; this.t = 0.9; }
      return true;
    }

    // ---- HOOKWORM: ERUPTION ------------------------------------------------
    // "It always appears suddenly FROM THE GROUND." It is far too slow to walk
    // anywhere (0.9 m/s), so it does not: it submerges and comes up somewhere
    // useful. That is its mobility and it is also its telegraph.
    if (def.erupt && this.state === 'chase') {
      this.eruptT -= dt;
      const d = flatDist(this.pos, tgt.actor.pos);
      if (this.eruptT <= 0 && d > def.reach + 1.5 && d < def.erupt.range) {
        this.eruptT = def.erupt.every * rand(0.85, 1.2);
        const at = tgt.actor.pos.clone().setY(0)
          .addScaledVector(v3(this.pos.x - tgt.actor.pos.x, 0, this.pos.z - tgt.actor.pos.z).normalize(), 1.8);
        m.arena.bounds?.clampXZ(at, 0.6);
        // it goes down here...
        m.fx._ring(this.pos.clone().setY(0.05), 0x6a4a4e, { size: 0.8, growRate: -2.4, life: 0.35 });
        for (let i = 0; i < 12; i++) {
          m.fx._spawn(this.pos.clone().add(v3(rand(-0.7, 0.7), 0.1, rand(-0.7, 0.7))), {
            color: i % 2 ? 0x6a4a4e : 0x2a1a1e, size: rand(0.2, 0.5), life: 0.4,
            vel: v3(rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5)), gravity: 8
          });
        }
        // ...and comes up there
        this.pos.copy(at);
        this.reveal = 0.15;
        this.body.setReveal(0.15);
        m.fx._ring(at.clone().setY(0.05), 0xa0606a, { size: 0.6, growRate: 14, life: 0.5 });
        m.arena.destruct?.damageAt(at, 2.2, 16);
        m.cam.shake(0.3);
        m.sfx.curseSummon?.('hookworm');
        return true;
      }
    }

    // ---- MANTA: THE CARRY --------------------------------------------------
    // The only summon in the game that moves its OWNER. Canon: it has "enough
    // size to support Suguru and one other person", and he escapes on it. Here
    // it periodically swoops to Geto and hauls him a long way, fast — an
    // escape he does not have to spend stamina on and cannot be hit out of.
    if (def.carry) {
      this.carryT -= dt;
      if (this.carrying > 0) {
        this.carrying -= dt;
        const o = this.owner;
        const away = v3(o.pos.x - tgt.actor.pos.x, 0, o.pos.z - tgt.actor.pos.z).normalize();
        o.pos.addScaledVector(away, def.carry.speed * dt);
        o.pos.y = Math.max(o.pos.y, Math.sin((1 - this.carrying / def.carry.dur) * Math.PI) * def.carry.height);
        o.vel.set(0, 0, 0);
        o.iFrames = Math.max(o.iFrames ?? 0, 2);
        m.arena.bounds?.clampXZ(o.pos, 0.6);
        this.pos.set(o.pos.x, 0, o.pos.z);
        this.flyY = o.pos.y + 1.2;
        this.anim.carry = 1;
        this.speed = def.carry.speed;
        if (this.carrying <= 0) { o.pos.y = 0; this.anim.carry = 0; }
        return true;
      }
      if (this.carryT <= 0 && flatDist(this.owner.pos, tgt.actor.pos) < 6.0 && this.owner.res.hp < this.owner.cfg.stats.hp * 0.7) {
        this.carryT = def.carry.every * rand(0.9, 1.2);
        this.carrying = def.carry.dur;
        m.hud.toast(this.owner, '飛行呪霊 — CARRIED');
        m.sfx.curseSummon?.('manta');
        return true;
      }
    }

    // ---- DECOY EYE: PULLING AGGRO -------------------------------------------
    // Its whole job. Every hostile summon inside its radius is redirected onto
    // it, so Geto's real bodies get to keep working. Implemented by writing a
    // flag the other systems' targeting already reads, rather than by editing
    // their files.
    if (def.decoy) {
      this.decoyPulse = (this.decoyPulse ?? 0) - dt;
      if (this.decoyPulse <= 0) {
        this.decoyPulse = 0.4;
        for (const s of (m.shikigami?.list ?? [])) {
          if (!s.targetable || s.owner === this.owner) continue;
          if (flatDist(s.pos, this.pos) < def.decoy.radius) s._decoyLure = this;
        }
        for (const mn of (m.minions?.list ?? [])) {
          if (!mn.alive || mn.owner === this.owner) continue;
          if (flatDist(mn.pos, this.pos) < def.decoy.radius) mn._decoyLure = this;
        }
        m.fx._ring(this.pos.clone().add(v3(0, this.body.height * 0.6, 0)), 0xc8a020,
          { size: 0.3, growRate: 5, life: 0.4, flat: false });
      }
    }
    return false;
  }

  // ---- per-curse AI --------------------------------------------------------
  // Each special grade gets ONE signature move off its playable kit, not the
  // whole thing. That is the brief and it is also what keeps them legible: a
  // summoned Jogo does one recognisable thing, so you learn what a summoned
  // Jogo means the first time you see one.
  _behave(dt, tgt) {
    // the role behaviours run first and can own the whole frame
    if (this._roleTick(dt, tgt)) return;
    if (this.state === 'hit') {
      this.t -= dt;
      if (this.t <= 0) this.state = 'chase';
      return;
    }
    if (this.state === 'act') {
      this.t -= dt;
      this.anim.actionK = 1 - Math.max(0, this.t / (this.def.actTime ?? 0.4));
      this._face(tgt.actor.pos, dt, this.def.turnRate ?? 8);
      this.speed = 0;
      if (!this.fired && this.t <= (this.def.hitAt ?? 0.12)) {
        this.fired = true;
        this._signature(tgt);
      }
      if (this.t <= 0) { this.state = 'recover'; this.t = this.def.recoverTime ?? 0.5; }
      return;
    }
    if (this.state === 'recover') {
      this.t -= dt;
      this.anim.action = null;
      this.speed = 0;
      if (this.t <= 0) { this.state = 'chase'; this.fired = false; }
      return;
    }

    // ---- chase / body-block --------------------------------------------
    // The body-block behaviour is lifted straight off Mahito's transfigured
    // human (combat/minion.js), as the brief asked — the plan timer, the 30%
    // chance and the lerp-to-halfway goal are the same shape. What is layered
    // on top is per-curse: a ranged curse holds its preferred distance instead
    // of closing, and a special grade blocks for Geto more willingly than
    // chaff does, because it is worth more and it knows it.
    this.blockT -= dt;
    if (this.blockT <= 0) {
      this.blockT = rand(1.4, 2.8);
      this.blocking = Math.random() < (this.def.blockChance ?? 0.28);
    }
    this.swingT -= dt;

    const prefer = this.def.preferRange ?? 1.4;
    let goal, stop;
    if (this.blocking) {
      goal = this.owner.pos.clone().lerp(tgt.actor.pos, 0.55);
      stop = 0.4;
    } else {
      goal = tgt.actor.pos;
      stop = prefer * 0.85;
    }
    const dist = this._moveTo(goal, this.def.speed, dt, stop);
    this._face(tgt.actor.pos, dt, this.def.turnRate ?? 8);

    const inRange = flatDist(this.pos, tgt.actor.pos) < (this.def.reach ?? prefer) + 0.4;
    if (!this.blocking && inRange && this.swingT <= 0) {
      this.swingT = this.def.swingEvery * rand(0.85, 1.25);
      this.state = 'act';
      this.t = this.def.actTime ?? 0.4;
      this.fired = false;
      this.anim.action = this.def.animAction ?? 'bite';
      this.anim.actionK = 0;
      this.match.sfx.curseAttack?.(this.key);
    }
  }

  // the one signature move per curse
  _signature(tgt) {
    const m = this.match, def = this.def;
    const isFighter = tgt.kind === 'fighter';
    const at = tgt.actor.pos.clone().setY(0);

    switch (this.key) {
      // JOGO — EMBER INSECTS. Reused straight off his ct1: a spray of burning
      // motes that arrive at the target. Ranged pressure, and the only curse
      // in the stable that can touch someone standing away from Geto.
      case 'jogo': {
        m.sfx.embers?.();
        const from = this.pos.clone().add(v3(0, this.body.height * 0.7, 0));
        for (let i = 0; i < 16; i++) {
          const k = i / 15;
          m.fx._spawn(from.clone().lerp(at.clone().setY(1.0), k).add(v3(rand(-0.3, 0.3), rand(-0.2, 0.3), rand(-0.3, 0.3))), {
            color: i % 3 === 0 ? 0xffd27a : 0xff5a1f, size: rand(0.10, 0.26), life: rand(0.2, 0.45),
            vel: at.clone().sub(from).normalize().multiplyScalar(rand(5, 12)), gravity: 2
          });
        }
        m.fx._ring(at.clone().setY(0.06), 0xff5a1f, { size: 0.4, growRate: 9, life: 0.3 });
        if (isFighter) {
          this._strike(tgt.actor, {
            dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light', elem: 'fire'
          });
        } else this._strikeSummon(tgt.actor, def.dmg * 1.4);
        break;
      }

      // HANAMI — ROOT ERUPTION. Reused off his ct1: spikes out of the ground
      // under the target after a short delay. AREA DENIAL — the marker is the
      // move, and a curse that makes ground unsafe is worth more to a man
      // standing still than one that chases.
      case 'hanami': {
        m.sfx.roots?.();
        // the telegraph, then the eruption on a timer entity
        m.fx._ring(at.clone().setY(0.05), 0x9ec46a, { size: 0.4, growRate: 5, life: def.delay ?? 0.6 });
        this.sys.pending.push({
          t: def.delay ?? 0.6, at, radius: def.radius ?? 2.4, owner: this.owner, curse: this,
          dmg: def.dmg, kb: def.kb, kbY: def.kbY ?? 8.0, hitstun: def.hitstun, kind: 'roots'
        });
        break;
      }

      // MAHITO — SOUL TOUCH. Reused off his ct1, WITHOUT the transfiguration
      // gauge (the brief is explicit, and it is right: transfiguration is a
      // second resource that belongs to the man, not to the borrowed hand).
      // What is left is a close-range palm that hits hard for a summon.
      case 'mahito': {
        m.sfx.soulTouch?.();
        const chest = (isFighter ? tgt.actor.pos : tgt.actor.pos).clone().add(v3(0, 1.1, 0));
        for (let i = 0; i < 14; i++) {
          const a = rand(0, Math.PI * 2);
          m.fx._spawn(chest, {
            color: i % 2 ? 0x9fb0c4 : 0xd8c0e8, size: rand(0.12, 0.30), life: rand(0.2, 0.4),
            vel: v3(Math.cos(a) * rand(2, 6), rand(-1, 4), Math.sin(a) * rand(2, 6))
          });
        }
        m.fx._ring(chest, 0x9fb0c4, { size: 0.4, growRate: 8, life: 0.3, flat: false });
        if (isFighter) {
          this._strike(tgt.actor, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'heavy' });
        } else this._strikeSummon(tgt.actor, def.dmg * 1.4);
        break;
      }

      // KUROUROSHI — A REDUCED SWARM. Reused off his roach wave, cut down to a
      // short chip cloud around him with no gluttony stages and no devour.
      // Attrition: it is the curse you leave out when you want the opponent to
      // bleed while Geto does nothing at all.
      case 'kurourushi': {
        m.sfx.swarm?.();
        for (let i = 0; i < 20; i++) {
          const a = rand(0, Math.PI * 2), r = rand(0.4, def.radius ?? 2.8);
          m.fx._spawn(this.pos.clone().add(v3(Math.cos(a) * r, rand(0.1, 0.9), Math.sin(a) * r)), {
            color: i % 4 === 0 ? 0xd8a02a : 0x2a2016, size: rand(0.08, 0.20), life: rand(0.3, 0.6),
            vel: v3(rand(-2, 2), rand(0.2, 1.4), rand(-2, 2))
          });
        }
        // chips everything hostile inside the cloud, not just the target
        const R = def.radius ?? 2.8;
        for (const f of m.activeFighters) {
          if (f === this.owner || !f.alive) continue;
          if (flatDist(f.pos, this.pos) > R) continue;
          this._strike(f, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
        }
        this.sys.hurtOtherSummonsAt(this.pos, R, def.dmg * 1.2, this.owner);
        break;
      }

      // ---- FLESH-EATER — IT ATTACHES ---------------------------------------
      // "Work together to SUCK A PERSON'S FLESH APART." It does not knock you
      // back, it gets on you. Landing the hit starts the latch; from then on
      // it is a status the player has to shake by killing it.
      case 'fleshEater': {
        if (isFighter) {
          const r = this._strike(tgt.actor, { dmg: def.dmg, kb: 0, hitstun: def.hitstun, type: 'light' });
          if (r === 'hit' || r === 'otg') {
            this.latched = tgt.actor;
            this.latchT = def.latch.duration;
            m.hud.toast(tgt.actor, 'LATCHED');
            m.sfx.curseAttack?.('fleshEater');
          }
        } else this._strikeSummon(tgt.actor, def.dmg * 1.6);
        break;
      }

      // ---- KO-GUY — BLACK MUCUS ---------------------------------------------
      // Canon: "he can SHOOT BLACK MUCUS from his mouth". A ranged spit that
      // slows, so a grasshopper that is otherwise a pure melee body has a
      // reason to exist at range and a reason to be annoying.
      case 'koguy': {
        const d = flatDist(this.pos, at);
        this.spitT = (this.spitT ?? 0) - 0;
        if (isFighter && d > def.reach && d < def.spit.range) {
          m.sfx.embers?.();
          const from = this.pos.clone().add(v3(0, this.body.height * 0.85, 0));
          for (let i = 0; i < 14; i++) {
            const k = i / 13;
            m.fx._spawn(from.clone().lerp(at.clone().setY(1.0), k).add(v3(rand(-0.25, 0.25), rand(-0.2, 0.3), rand(-0.25, 0.25))), {
              color: i % 4 === 0 ? 0x6f8f34 : 0x171a10, size: rand(0.10, 0.30), life: rand(0.25, 0.5),
              vel: at.clone().sub(from).normalize().multiplyScalar(rand(7, 14)), gravity: 5
            });
          }
          m.fx._ring(at.clone().setY(0.06), 0x171a10, { size: 0.4, growRate: 7, life: 0.5 });
          const r = this._strike(tgt.actor, { dmg: def.spit.dmg, kb: 0.4, hitstun: def.hitstun, type: 'light' });
          if (r === 'hit' || r === 'otg') {
            tgt.actor.vel.multiplyScalar(1 - def.spit.slow);
            m.hud.toast(tgt.actor, 'FOULED');
          }
        } else if (isFighter) {
          this._strike(tgt.actor, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
        } else this._strikeSummon(tgt.actor, def.dmg * 1.4);
        break;
      }

      // ---- FUNGUS HEADS — CAPTURE, THEN THE KISS -----------------------------
      // "Capable of CAPTURING Suguru's targets. Upon doing so the LARGEST HEAD
      // will attempt to KISS whoever is captive." The capture is the value: it
      // roots them, which is the only reliable setup Geto has.
      case 'fungus': {
        m.sfx.roots?.();
        if (isFighter) {
          const r = this._strike(tgt.actor, { dmg: def.dmg, kb: 0, hitstun: def.hitstun, type: 'heavy' });
          if (r === 'hit' || r === 'otg') {
            tgt.actor.vel.set(0, 0, 0);
            tgt.actor.rootT = Math.max(tgt.actor.rootT, def.hold);
            if (!['knockdown', 'launched', 'getup', 'ko'].includes(tgt.actor.state)) {
              tgt.actor.setState('rooted', { clip: 'stunned' });
            }
            m.hud.toast(tgt.actor, 'CAPTURED');
            // the kiss: a wet violet bloom at head height
            const head = tgt.actor.pos.clone().add(v3(0, 1.5, 0));
            m.fx._ring(head, 0xa8506a, { size: 0.3, growRate: 7, life: 0.4, flat: false });
            for (let i = 0; i < 12; i++) {
              m.fx._spawn(head, {
                color: i % 2 ? 0xa8506a : 0x7a4a68, size: rand(0.1, 0.26), life: 0.35,
                vel: v3(rand(-3, 3), rand(-1, 3), rand(-3, 3))
              });
            }
          }
        } else this._strikeSummon(tgt.actor, def.dmg * 1.3);
        break;
      }

      // ---- DARUMA — THE CRUSH ------------------------------------------------
      // "Summoned by Suguru to CRUSH Shigeru Sonoda to death." It rears and
      // drops its whole mass. Slow, obvious, and it hurts — but the reason it
      // is in the stable is the 92% block chance on the def, not this.
      case 'daruma': {
        m.cam.shake(0.5);
        m.sfx.rootBurst?.();
        m.fx._ring(this.pos.clone().setY(0.06), 0x42639f, { size: 0.6, growRate: 16, life: 0.45 });
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2;
          m.fx._spawn(this.pos.clone().add(v3(Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9)), {
            color: i % 3 === 0 ? 0x6f8fd0 : 0x1c3260, size: rand(0.18, 0.44), life: rand(0.3, 0.6),
            vel: v3(Math.cos(a) * 5, rand(1, 4), Math.sin(a) * 5), gravity: 9
          });
        }
        m.arena.destruct?.damageAt(this.pos, 2.4, 22);
        for (const f of m.activeFighters) {
          if (f === this.owner || !f.alive) continue;
          if (flatDist(f.pos, this.pos) > def.reach + 0.6) continue;
          this._strike(f, { dmg: def.dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: 'knockdown' });
        }
        this.sys.hurtOtherSummonsAt(this.pos, def.reach + 0.6, def.dmg * 0.8, this.owner);
        break;
      }

      // ---- PILLAR CURSE — LIGHT FROM ABOVE -----------------------------------
      // "Fire DESTRUCTIVE PILLARS OF LIGHT down on a target by pointing its
      // index and middle finger on either hand upwards." Delayed and marked,
      // like Hanami's roots, but from FOURTEEN METRES — it is the only thing in
      // the stable that threatens the far side of the arena.
      case 'pillar': {
        m.sfx.embers?.();
        m.fx._ring(at.clone().setY(0.05), 0xdfe8ff, { size: 0.4, growRate: 4, life: def.delay });
        this.sys.pending.push({
          t: def.delay, at, radius: def.radius, owner: this.owner, curse: this,
          dmg: def.dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, kind: 'pillar'
        });
        break;
      }

      // ---- MANTA — THE DIVE --------------------------------------------------
      // Between carries it is a dive-bomber: it drops out of the sky along its
      // own line and hits everything under it.
      case 'manta': {
        m.sfx.nueDive?.();
        m.cam.shake(0.4);
        const from = this.pos.clone().setY(this.body.height);
        for (let i = 0; i < 22; i++) {
          const k = i / 21;
          m.fx._spawn(from.clone().lerp(at.clone().setY(0.6), k).add(v3(rand(-0.6, 0.6), 0, rand(-0.6, 0.6))), {
            color: i % 3 === 0 ? 0x8a4ad0 : 0x3c4a5e, size: rand(0.16, 0.42), life: rand(0.2, 0.4),
            vel: at.clone().sub(from).normalize().multiplyScalar(rand(6, 13))
          });
        }
        m.fx._ring(at.clone().setY(0.06), 0x8a4ad0, { size: 0.6, growRate: 15, life: 0.4 });
        if (isFighter) {
          this._strike(tgt.actor, { dmg: def.dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: 'heavy' });
        } else this._strikeSummon(tgt.actor, def.dmg * 1.3);
        break;
      }

      // ---- RAINBOW DRAGON — THE SMASH ----------------------------------------
      // "Able to SMASH INTO AND DESTROY STONE STRUCTURES." The biggest single
      // hit in the stable, and it takes the level with it.
      case 'dragon': {
        m.sfx.uzumaki?.();
        m.cam.shake(0.9);
        m.cam.fovKick(8);
        m.stage.flash(0.18);
        const from = this.pos.clone().add(v3(0, this.body.height * 0.7, 0));
        for (let i = 0; i < 30; i++) {
          const k = i / 29;
          m.fx._spawn(from.clone().lerp(at.clone().setY(0.8), k).add(v3(rand(-0.8, 0.8), rand(-0.4, 0.6), rand(-0.8, 0.8))), {
            color: i % 4 === 0 ? 0xc060d0 : 0xe6e2d8, size: rand(0.2, 0.55), life: rand(0.25, 0.5),
            vel: at.clone().sub(from).normalize().multiplyScalar(rand(8, 16)), gravity: 4
          });
        }
        m.fx._ring(at.clone().setY(0.06), 0xe6e2d8, { size: 0.8, growRate: 20, life: 0.5 });
        m.arena.destruct?.damageAt(at, 3.4, def.destruct ?? 45);
        for (const f of m.activeFighters) {
          if (f === this.owner || !f.alive) continue;
          if (flatDist(f.pos, at) > def.reach) continue;
          this._strike(f, { dmg: def.dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: 'knockdown' });
        }
        this.sys.hurtOtherSummonsAt(at, def.reach, def.dmg * 0.7, this.owner);
        break;
      }

      // ---- HOOKWORM — SWALLOW ------------------------------------------------
      // "Innards large enough to CAPTURE AND SWALLOW." Landing it starts the
      // hold; `_roleTick` runs it from there.
      case 'hookworm': {
        m.cam.shake(0.5);
        m.sfx.toadGrab?.();
        if (isFighter && flatDist(this.pos, at) < def.swallow.range) {
          const r = this._strike(tgt.actor, { dmg: def.dmg, kb: 0, hitstun: def.hitstun, type: 'heavy' });
          if (r === 'hit' || r === 'otg') {
            this.swallowT = def.swallow.hold;
            tgt.actor.rootT = Math.max(tgt.actor.rootT, def.swallow.hold);
            if (!['knockdown', 'launched', 'getup', 'ko'].includes(tgt.actor.state)) {
              tgt.actor.setState('rooted', { clip: 'stunned' });
            }
            m.hud.toast(tgt.actor, 'SWALLOWED');
          }
        } else if (!isFighter) this._strikeSummon(tgt.actor, def.dmg * 1.5);
        break;
      }

      // THE REMAINING LOW GRADES — a bite and a lash. Almost no damage; the
      // value is that they are in the way and they will not stop.
      default: {
        if (isFighter) {
          this._strike(tgt.actor, { dmg: def.dmg, kb: def.kb, hitstun: def.hitstun, type: 'light' });
        } else this._strikeSummon(tgt.actor, def.dmg * 1.5);
        m.fx._spawn(this.pos.clone().add(v3(0, this.body.height * 0.5, 0)), {
          color: VIOLET, size: 0.2, life: 0.2, vel: v3(rand(-1, 1), rand(0, 2), rand(-1, 1))
        });
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// THE MANAGER: the stable ledger, slots, cooldowns, reabsorb, and Uzumaki.
// ---------------------------------------------------------------------------
export class CurseSystem {
  constructor(match) {
    this.match = match;
    this.list = [];
    this.pending = [];           // delayed area effects (Hanami's roots)
    this.owners = new Map();     // fighter -> {lost:Set, cd:Map, sel}
  }

  stateFor(owner) {
    let s = this.owners.get(owner);
    if (!s) {
      const cfg = owner.cfg.curses;
      s = {
        lost: new Set(), cd: new Map(),
        sel: cfg?.defaultSpecial ?? (cfg?.specialOrder?.[0] ?? null)
      };
      this.owners.set(owner, s);
    }
    return s;
  }

  defsFor(owner) { return owner.cfg.curses?.defs || {}; }
  stableOf(owner) { return owner.cfg.curses?.stable || []; }
  specialOrder(owner) { return owner.cfg.curses?.specialOrder || []; }
  lowOrder(owner) { return owner.cfg.curses?.lowOrder || []; }
  midOrder(owner) { return owner.cfg.curses?.midOrder || []; }
  // WHAT THE WHEEL OFFERS: mid grades and special grades together. Falls back
  // to the special list so any other config using this system is unaffected.
  wheelOrder(owner) { return owner.cfg.curses?.wheelOrder || this.specialOrder(owner); }

  isLost(owner, key) { return this.stateFor(owner).lost.has(key); }

  // A DESTROYED CURSE DOES NOT GET TO KEEP HOLDING RT. Exactly the rule
  // Megumi's shikigami slots now play by (see ShikigamiSystem._rebindLost), and
  // for the same reason: permanence is the interesting part of both characters,
  // a DEAD BUTTON is not. If the special grade the wheel had selected is
  // destroyed, RT would otherwise report "JOGO IS GONE" forever until the
  // player stopped mid-fight to open the wheel.
  //
  // CT1 never needed this — it already picks the first available piece of chaff
  // at press time rather than holding a binding, which is why the low grades
  // are interchangeable in the first place.
  //
  // If every special grade is gone the selection is left alone: there is
  // nothing to move it to, and at that point "they are all gone" is the honest
  // message. Uzumaki consuming the whole stable goes through here too, and that
  // case correctly ends with no reselection.
  _recordLoss(owner, key) {
    const s = this.stateFor(owner);
    s.lost.add(key);
    if (s.sel !== key) return;
    const next = this.wheelOrder(owner).find(k => !s.lost.has(k));
    if (!next) return;
    s.sel = next;
    this.match.hud?.toast(owner, 'RT · ' + (this.defsFor(owner)[next]?.short ?? next));
    owner.emit?.('curseReselected', { key: next, replaced: key });
  }
  cooldownOf(owner, key) { return this.stateFor(owner).cd.get(key) || 0; }

  selected(owner) { return this.stateFor(owner).sel; }
  select(owner, key) { this.stateFor(owner).sel = key; return key; }

  aliveFor(owner) { return this.list.filter(c => c.owner === owner && c.alive); }

  // ---- THE SLOT RULE ------------------------------------------------------
  // "Only a limited number can be active at once — start at two low-grades OR
  // one special-grade." Expressed as a budget rather than two counters: low
  // grades cost 1 slot, special grades cost the whole allowance. So the config
  // sets `activeLimit: 2`, a special grade declares `slots: 2`, and "two chaff
  // OR one monster" falls out with no special-casing — and the tuning knob for
  // "let him hold a special grade AND one low grade" is one number.
  usedSlots(owner) {
    let n = 0;
    for (const c of this.list) {
      if (c.owner !== owner || !c.alive) continue;
      n += c.def.slots ?? 1;
    }
    return n;
  }

  // Everything that can refuse a summon, in one readable place. Returns null
  // on success or a short HUD string.
  blockReason(owner, key) {
    const def = this.defsFor(owner)[key];
    if (!def) return 'NO CURSE SELECTED';
    if (this.isLost(owner, key)) return def.short + ' IS GONE';
    if (this.cooldownOf(owner, key) > 0) return def.short + ' RECOVERING';
    const limit = owner.cfg.curses?.activeLimit ?? 2;
    if (this.usedSlots(owner) + (def.slots ?? 1) > limit) {
      return def.slots >= limit ? 'NO ROOM FOR A SPECIAL GRADE' : 'STABLE IS DEPLOYED';
    }
    // only ONE special grade at a time, stated separately from the slot budget
    // so the HUD message is the true reason rather than a generic "full"
    if (def.specialGrade && this.list.some(c => c.owner === owner && c.alive && c.special)) {
      return 'ONE SPECIAL GRADE AT A TIME';
    }
    return null;
  }

  summon(owner, key, opts = {}) {
    const def = this.defsFor(owner)[key];
    if (!def) return null;
    const s = this.stateFor(owner);
    s.cd.set(key, def.cooldown);
    const at = (opts.at || owner.pos.clone().addScaledVector(owner.forward(), def.specialGrade ? 2.2 : 1.6));
    at.y = 0;
    const c = new Curse(this, owner, def, { at });
    this.list.push(c);

    // the arrival read: a violet tear in the air, bigger for a special grade
    const m = this.match;
    const big = def.specialGrade;
    m.fx._ring(at.clone().setY(0.05), VIOLET_HI, { size: big ? 0.9 : 0.5, growRate: big ? 12 : 8, life: 0.5 });
    m.fx._ring(at.clone().setY(0.05), 0x140b1e, { size: big ? 0.6 : 0.3, growRate: big ? 8 : 5, life: 0.6 });
    for (let i = 0; i < (big ? 24 : 12); i++) {
      const a = (i / (big ? 24 : 12)) * Math.PI * 2;
      m.fx._spawn(at.clone().add(v3(Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6)), {
        color: i % 3 === 0 ? VIOLET_HI : 0x140b1e, size: rand(0.16, 0.44), life: rand(0.3, 0.7),
        vel: v3(Math.cos(a) * 2.4, rand(1, 4), Math.sin(a) * 2.4), gravity: 5
      });
    }
    if (big) { m.cam.shake(0.5); m.stage.flash(0.12); }
    m.sfx.curseSummon?.(key);
    m.hud.toast(owner, def.jp + ' ' + def.name);
    return c;
  }

  // A curse summoned by someone who is NOT Geto — Yuta's Copy. It reads its
  // stats off the canonical table rather than the owner's config (Yuta has no
  // `curses` block), never costs a slot, never goes on cooldown, and can never
  // be recorded as a loss against anybody. Exactly the shape
  // ShikigamiSystem.summonBorrowed already established for the copied Divine
  // Dog, and for the same reason: a borrowed thing is not a spent thing.
  summonBorrowedLow(owner, opts = {}) {
    const base = BORROWED_DEFS[opts.key ?? 'maw1'];
    if (!base) return null;
    const def = { ...base, life: opts.life ?? 10, hp: base.hp * (opts.hpMult ?? 0.7) };
    if (opts.dmg != null) def.dmg = opts.dmg;
    const at = (opts.at || owner.pos.clone().addScaledVector(owner.forward(), 1.4));
    at.y = 0;
    const c = new Curse(this, owner, def, { at });
    // a borrowed body is not part of anybody's stable, so it is excluded from
    // the ledger by never being written to it — `_recordLoss` is keyed on the
    // owner, and Yuta has no stable for the key to land in
    this.list.push(c);
    const m = this.match;
    m.fx._ring(at.clone().setY(0.05), owner.model.palette?.accent ?? VIOLET_HI,
      { size: 0.5, growRate: 8, life: 0.4 });
    m.sfx.curseSummon?.(def.key);
    m.hud.toast(owner, def.jp + ' ' + def.name);
    return c;
  }

  // ---- REABSORB -----------------------------------------------------------
  // Pull the most valuable active curse back into the stable before it dies,
  // and refund part of what it cost. Prefers the SPECIAL GRADE if one is out
  // (that is the one worth saving), otherwise the most wounded body — which is
  // what a player pressing the button actually means.
  //
  // The refund scales with REMAINING HEALTH, so recalling a corpse-in-waiting
  // gets you almost nothing back and recalling a healthy special grade to make
  // room gets you most of it. That gradient is what turns this into a decision
  // instead of a free undo.
  reabsorb(owner) {
    const mine = this.aliveFor(owner);
    if (!mine.length) return null;
    let pick = mine.find(c => c.special);
    if (!pick) pick = mine.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
    const frac = pick.hp / pick.maxHp;
    const refund = pick.def.cost * (pick.def.refund ?? 0.5) * (0.35 + 0.65 * frac);
    owner.res.curCE = Math.min(owner.res.maxCE, owner.res.curCE + refund);
    // the cooldown is CUT but not cleared: a recalled curse is available again
    // sooner than a fresh one, which is the reward for managing them
    const s = this.stateFor(owner);
    s.cd.set(pick.key, Math.max(0, (pick.def.cooldown ?? 6) * 0.4));
    pick.die('recalled');
    this.match.fx._ring(owner.pos.clone().setY(0.06), VIOLET_HI, { size: 1.4, growRate: -3.2, life: 0.45 });
    return { key: pick.key, refund };
  }

  // ---- MAXIMUM: UZUMAKI ---------------------------------------------------
  // 極ノ番・うずまき. Verified in research: the name is correct, and the
  // technique is exactly what the brief described — every cursed spirit the
  // manipulator is holding is COMBINED INTO ONE and fired as a single
  // condensed attack. (Canon adds that spirits of semi-grade-1 and above have
  // their innate techniques extracted permanently on the way through; that is
  // a between-fights consequence with nowhere to live in a round-based fighter,
  // so it is deliberately not modelled.)
  //
  // THE SCALING. Damage is base + per-curse, and a special grade is worth
  // several low grades. This counts the WHOLE REMAINING STABLE — everything
  // not already destroyed, whether it is standing on the field right now or
  // still held. That is the correct reading and it is also the more
  // interesting one: it means keeping curses in reserve is worth exactly as
  // much as keeping them alive on the field, so the tension is about SPENDING
  // them, not about hiding them.
  uzumakiCount(owner) {
    const defs = this.defsFor(owner);
    let low = 0, special = 0, weight = 0;
    for (const key of this.stableOf(owner)) {
      if (this.isLost(owner, key)) continue;
      const d = defs[key];
      if (!d) continue;
      if (d.specialGrade) special++; else low++;
      weight += d.uzumakiWeight ?? (d.specialGrade ? 4 : 1);
    }
    return { low, special, total: low + special, weight };
  }

  // The projected damage, live, for the HUD. Same function the effect
  // dispatcher calls when it actually fires, so the number on the bar is not
  // an estimate of the number in the fight — it IS the number in the fight.
  // THE FORMULA, and it changed shape when the stable doubled.
  //
  //     raw = baseDmg + dmgPerWeight * weight ^ weightExp
  //
  // It used to be linear, which was correct for an eight-curse stable
  // (weight 20) and catastrophic for a sixteen-curse one (weight 41): the old
  // numbers would have delivered 369 against a 235-point health bar, i.e. an
  // unanswerable instant kill for pressing one button. The exponent is tuned
  // so a FULL stable still lands on the 189 delivered that was already the
  // right number, while a half stable is worth proportionally more than it was
  // — which matters now that there are enough curses for "kill four of them"
  // to be a cheap answer. The full derivation is in characters/geto.js.
  //
  // `weightExp` defaults to 1 so any other config using this system keeps the
  // old linear behaviour untouched.
  uzumakiDamage(owner) {
    const u = owner.cfg.ultimate;
    const { weight } = this.uzumakiCount(owner);
    const e = u.weightExp ?? 1;
    return (u.baseDmg ?? 18) + (u.dmgPerWeight ?? 8) * Math.pow(weight, e);
  }

  // WHAT THE HUD ACTUALLY PRINTS, and it is not the number above.
  //
  // `uzumakiDamage` is the value handed to the damage pipeline, and the
  // pipeline then multiplies it twice on the way to a health bar: once by the
  // caster's `damageScale` (computeDamage) and once by the global SPECIAL dial
  // (combat/balance.js, applied in Fighter._applyHit). For Geto that is
  // 0.82 x 1.30 = 1.066, so a "176" projection actually removes 188 points.
  //
  // Printing the raw figure would make the HUD a 6% lie, and the whole point of
  // the readout is that the player can decide whether the ultimate is still
  // worth holding for. So the display applies the same two multipliers the
  // fight will — one function, both numbers, no drift. Measured against a live
  // fight: projected 188, dealt 188.
  uzumakiDelivered(owner) {
    return this.uzumakiDamage(owner) * (owner.cfg.stats.damageScale ?? 1) * SPECIAL;
  }

  // Spend the stable. Everything not already destroyed is consumed — the ones
  // on the field dissolve and the ones still held are struck off. After this
  // he has his weak normals and nothing else, for the rest of the ROUND.
  consumeStable(owner) {
    const before = this.uzumakiCount(owner);
    for (const c of this.list) if (c.owner === owner && c.alive) c.die('consumed');
    const s = this.stateFor(owner);
    for (const key of this.stableOf(owner)) s.lost.add(key);
    s.cd.clear();
    return before;
  }

  // ---- cross-system contact ------------------------------------------------
  // Fighters' melee swings connect with curses. One tag per swing, and the
  // flag is `curseHit` — deliberately its own name, so a single swing can hit
  // a fighter AND a shikigami AND a curse without any of the three systems
  // consuming another's tag. That is the actual three-summoner-field bug this
  // avoids and it is why nothing in shikigami.js or minion.js had to change.
  meleeCheck() {
    for (const f of this.match.activeFighters) {
      const win = f.activeHit;
      if (!win || win.frames <= 0 || win.curseHit) continue;
      for (const c of this.list) {
        if (!c.targetable || c.owner === f) continue;
        const fwd = f.forward();
        const origin = f.pos.clone().addScaledVector(fwd, win.def.reach * 0.7);
        if (flatDist(origin, c.pos) < 0.9 + 0.5) {
          win.curseHit = true;
          c.hurt(win.def.dmg, f, { kb: win.def.kb * 0.16 });
          break;
        }
      }
    }
  }

  // The other half of "summons fight each other": hostile shikigami and
  // transfigured humans swing back at curses. Implemented HERE, reading their
  // lists, rather than by editing their files — the brief's rule that no
  // existing character changes behaviour is easier to guarantee if the new
  // system owns every interaction it is party to.
  _crossCheck(dt) {
    for (const s of (this.match.shikigami?.list ?? [])) {
      if (!s.targetable) continue;
      s._curseT = (s._curseT ?? 0) - dt;
      if (s._curseT > 0) continue;
      for (const c of this.list) {
        if (!c.targetable || c.owner === s.owner) continue;
        if (flatDist(s.pos, c.pos) < (s.def.reach ?? 1.4) + 0.6) {
          s._curseT = s.def.swingEvery ?? 1.6;
          c.hurt(s.def.dmg * 1.2, null, { kb: 0.25 });
          break;
        }
      }
    }
    for (const mn of (this.match.minions?.list ?? [])) {
      if (!mn.alive) continue;
      mn._curseT = (mn._curseT ?? 0) - dt;
      if (mn._curseT > 0) continue;
      for (const c of this.list) {
        if (!c.targetable || c.owner === mn.owner) continue;
        if (flatDist(mn.pos, c.pos) < (mn.def.reach ?? 1.3) + 0.6) {
          mn._curseT = mn.def.swingEvery ?? 1.6;
          c.hurt(mn.def.dmg * 1.2, null, { kb: 0.2 });
          break;
        }
      }
    }
  }

  // area damage from techniques (eruptions, burning ground, torrents)
  hurtAt(pos, radius, dmg, attacker) {
    for (const c of this.list) {
      if (!c.targetable || c.owner === attacker) continue;
      if (flatDist(c.pos, pos) < radius + 0.5) c.hurt(dmg, attacker);
    }
  }

  // a curse's own AoE reaching into the OTHER summon systems
  hurtOtherSummonsAt(pos, radius, dmg, owner) {
    this.match.shikigami?.hurtAt(pos, radius, dmg, owner);
    this.match.minions?.hurtAt(pos, radius, dmg, owner);
    for (const c of this.list) {
      if (!c.targetable || c.owner === owner) continue;
      if (flatDist(c.pos, pos) < radius + 0.5) c.hurt(dmg, null);
    }
  }

  update(dt) {
    for (const [, s] of this.owners) {
      for (const [k, v] of s.cd) if (v > 0) s.cd.set(k, Math.max(0, v - dt));
    }
    this.meleeCheck();
    this._crossCheck(dt);

    // delayed area effects (Hanami's root eruption)
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      if (p.t > 0) continue;
      this.pending.splice(i, 1);
      const m = this.match;
      m.sfx.rootBurst?.();
      m.fx._ring(p.at.clone().setY(0.06), 0x9ec46a, { size: 0.5, growRate: 14, life: 0.4 });
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        m.fx._spawn(p.at.clone().add(v3(Math.cos(a) * rand(0.2, p.radius), 0.1, Math.sin(a) * rand(0.2, p.radius))), {
          color: k % 3 === 0 ? 0xc8d89a : 0x6f8a52, size: rand(0.14, 0.38), aspect: 0.35,
          life: rand(0.25, 0.5), vel: v3(0, rand(6, 12), 0), gravity: 14
        });
      }
      m.cam.shake(0.35);
      for (const f of m.activeFighters) {
        if (f === p.owner || !f.alive) continue;
        if (flatDist(f.pos, p.at) > p.radius) continue;
        if (p.curse && !p.curse.dead) {
          p.curse._strike(f, { dmg: p.dmg, kb: p.kb, kbY: p.kbY, hitstun: p.hitstun, type: 'launcher' });
        }
      }
      this.hurtOtherSummonsAt(p.at, p.radius, p.dmg * 0.7, p.owner);
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      if (!this.list[i].update(dt)) this.list.splice(i, 1);
    }

    // feed the owner's model its stable-aura level (art/models/geto.js)
    for (const [owner] of this.owners) {
      if (!owner.model.setStable) continue;
      const total = this.stableOf(owner).length || 1;
      owner.model.setStable(this.uzumakiCount(owner).total / total);
    }
  }

  dismissAll(owner) {
    for (const c of this.list) if (!owner || c.owner === owner) c.die('expired');
  }

  clear() {
    for (const c of this.list) this.match.root.remove(c.body.group);
    this.list.length = 0;
    this.pending.length = 0;
  }

  // A NEW ROUND GIVES THE STABLE BACK. This is the one place Geto's permanence
  // rule differs from Megumi's, and it is a deliberate call rather than an
  // oversight:
  //
  //   Megumi's shikigami are HIS, permanently, and a match-scoped ledger makes
  //   a long set genuinely attritional for him.
  //
  //   Geto's ultimate EATS HIS ENTIRE STABLE. If that carried across rounds,
  //   throwing Uzumaki in round one would leave him with weak normals and
  //   literally nothing else for the rest of the match — not a trade-off, a
  //   forfeit. Round-scoped is what makes spending the stable a real decision
  //   every round instead of a decision he makes once and regrets.
  //
  // Within a round the permanence is absolute: a curse killed at second five
  // is not coming back at second forty, and Geto has no domain to restore it
  // with, which is what makes him play more carefully than Megumi does.
  resetRound() {
    this.clear();
    for (const [, s] of this.owners) {
      s.cd.clear();
      s.lost.clear();
    }
  }

  resetMatch() { this.resetRound(); }

  // everything the HUD stable strip and the curse wheel need in one shot
  snapshot(owner) {
    const defs = this.defsFor(owner);
    const st = this.stateFor(owner);
    const onField = new Set(this.aliveFor(owner).map(c => c.key));
    return this.stableOf(owner).map(key => ({
      key, def: defs[key],
      lost: st.lost.has(key),
      out: onField.has(key),
      cd: st.cd.get(key) || 0,
      cdMax: defs[key]?.cooldown ?? 1,
      affordable: owner.res.curCE >= (defs[key]?.cost ?? 0),
      selected: st.sel === key
    }));
  }
}
