// TRANSFIGURED HUMAN — Mahito's summoned ally. One weak, fragile, independent
// AI body: it chases, swipes, and occasionally body-blocks for Mahito. Its
// value is pressure, not damage. Every summon's proportions, limb count and
// mass are randomized so no two are identical — misshapen, asymmetrical,
// unsettling. It is an entity, not a Fighter: domains treat it as scenery
// with two exceptions (a hostile domain stuns it; Jogo's heat cooks it), and
// Boogie Woogie ignores it entirely (the swap trades sorcerer positions —
// a transfigured lump is not a valid anchor, see the integration notes).
import * as THREE from 'three';
import { toonMaterial } from '../art/shaders/toon.js';
import { v3, rand, yawBetween, flatDist } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';

const FLESH = [0xb8a9a0, 0xcbb6a6, 0x9a8f92, 0xc4a8b0, 0xa8b0a0];

// one randomized misshapen body; returns {group, parts} for procedural anim
function buildMinionModel() {
  const g = new THREE.Group();
  const tone = FLESH[(Math.random() * FLESH.length) | 0];
  const tone2 = FLESH[(Math.random() * FLESH.length) | 0];
  const mat = toonMaterial({ vertexColors: false, color: tone, steps: [70, 150, 255], rim: 0.4, rimColor: 0x8b9bab });
  const mat2 = toonMaterial({ vertexColors: false, color: tone2, steps: [70, 150, 255], rim: 0.4, rimColor: 0x8b9bab });

  const H = rand(1.15, 1.75);            // mass varies per summon
  const wide = rand(0.75, 1.5);
  const lean = rand(-0.22, 0.22);        // permanent sideways slump

  // torso: stacked squashed lumps
  const torso = new THREE.Group();
  const lumps = 2 + ((Math.random() * 2) | 0);
  for (let i = 0; i < lumps; i++) {
    const r = (0.16 + rand(-0.03, 0.05)) * wide * H;
    const lump = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), i % 2 ? mat2 : mat);
    lump.scale.set(rand(0.8, 1.3), rand(0.7, 1.1), rand(0.8, 1.2));
    lump.position.set(rand(-0.05, 0.05), H * (0.35 + 0.16 * i), rand(-0.04, 0.04));
    torso.add(lump);
  }
  torso.rotation.z = lean;
  g.add(torso);

  // head: too small or too big, off-center, one dark eye pit
  const headR = H * rand(0.07, 0.16);
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 10, 8), mat);
  head.scale.set(rand(0.8, 1.3), rand(0.8, 1.5), rand(0.8, 1.2));
  head.position.set(rand(-0.1, 0.1) * H, H * (0.38 + 0.17 * lumps), rand(-0.03, 0.06) * H);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.28, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0x14090c }));
  eye.position.set(rand(-0.35, 0.35) * headR, rand(-0.1, 0.3) * headR, headR * 0.85);
  head.add(eye);
  torso.add(head);

  // arms: 1 to 4, mismatched lengths and girths
  const arms = [];
  const nArms = 1 + ((Math.random() * 4) | 0);
  for (let i = 0; i < nArms; i++) {
    const side = i % 2 ? 1 : -1;
    const len = H * rand(0.28, 0.62);
    const r = H * rand(0.028, 0.06);
    const arm = new THREE.Group();
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, len, 7), i % 2 ? mat : mat2);
    seg.position.y = -len / 2;
    const fist = new THREE.Mesh(new THREE.SphereGeometry(r * rand(1.2, 2.4), 7, 6), mat);
    fist.position.y = -len;
    arm.add(seg, fist);
    arm.position.set(side * H * 0.16 * wide, H * (0.42 + rand(0.1, 0.3)), rand(-0.05, 0.08) * H);
    arm.rotation.z = side * rand(0.25, 0.8);
    torso.add(arm);
    arms.push(arm);
  }

  // legs: sometimes two, sometimes a single trunk it hops on
  const legs = [];
  const nLegs = Math.random() < 0.25 ? 1 : 2;
  for (let i = 0; i < nLegs; i++) {
    const side = nLegs === 1 ? 0 : (i ? 1 : -1);
    const len = H * 0.4;
    const r = H * (nLegs === 1 ? 0.09 : rand(0.04, 0.065));
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r * 1.15, len, 7), i % 2 ? mat2 : mat);
    leg.position.set(side * H * 0.08 * wide, len / 2, 0);
    g.add(leg);
    legs.push(leg);
  }

  // floating health bar (camera-facing; aimed per eye in core/stage.js)
  const barG = new THREE.Group();
  const back = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.07),
    new THREE.MeshBasicMaterial({ color: 0x14161f, transparent: true, opacity: 0.75, depthWrite: false }));
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.045),
    new THREE.MeshBasicMaterial({ color: 0x9fd08a, transparent: true, opacity: 0.95, depthWrite: false }));
  fill.position.z = 0.002;
  barG.add(back, fill);
  barG.userData.billboard = true;   // camera-facing, aimed per eye in core/stage.js
  barG.position.y = head.position.y + headR * 2 + 0.25;
  g.add(barG);

  return { group: g, torso, head, arms, legs, barG, barFill: fill, H, hopper: nLegs === 1 };
}

class Minion {
  constructor(owner, match) {
    this.owner = owner;
    this.match = match;
    const def = owner.cfg.special.minion;
    this.def = def;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.life = def.duration;
    this.model = buildMinionModel();
    this.pos = owner.pos.clone().addScaledVector(owner.forward(), 1.2);
    this.pos.y = 0;
    this.facing = owner.facing;
    this.state = 'chase';       // chase | windup | recover | hit | block | dying
    this.t = 0;
    this.swingT = def.swingEvery * 0.5;
    this.planT = 0;
    this.blocking = false;
    this.animT = rand(0, 5);
    this.dead = false;
    match.root.add(this.model.group);
    // arrival: it claws its way up out of the floor
    this.model.group.position.copy(this.pos);
    this.model.group.scale.setScalar(0.01);
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
      g.scale.multiplyScalar(Math.max(0.01, 1 - dt * 3));
      g.position.y -= dt * 0.8;
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

    // grow in on arrival
    if (g.scale.x < 1) g.scale.setScalar(Math.min(1, g.scale.x + dt * 4));

    const target = m.other(this.owner);
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

    // ---- procedural animation: lurching, wrong, alive ----------------------
    this.animT += dt;
    const mm = this.model;
    g.position.set(this.pos.x, this.pos.y, this.pos.z);
    g.rotation.y = this.facing;
    const lurch = Math.sin(this.animT * (mm.hopper ? 9 : 6));
    g.position.y += mm.hopper ? Math.abs(lurch) * 0.12 : Math.abs(lurch) * 0.05;
    mm.torso.rotation.x = 0.15 + lurch * 0.06;
    mm.torso.rotation.z += ((Math.sin(this.animT * 1.7) * 0.12) - mm.torso.rotation.z) * 0.1;
    mm.head.rotation.z = Math.sin(this.animT * 2.3) * 0.25;
    mm.head.rotation.y = Math.sin(this.animT * 1.1) * 0.5;
    mm.arms.forEach((a, i) => {
      const base = (i % 2 ? 1 : -1) * 0.5;
      if (this.state === 'windup') a.rotation.x = -2.2 + (0.38 - this.t) * 2;
      else if (this.state === 'recover') a.rotation.x = Math.min(0.6, a.rotation.x + dt * 8);
      else a.rotation.x = Math.sin(this.animT * 5 + i * 1.7) * 0.4;
      a.rotation.z = base + Math.sin(this.animT * 3 + i) * 0.15;
    });
    if (this.state === 'hit') mm.torso.rotation.x = -0.3;

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

  spawn(owner) {
    this.list.push(new Minion(owner, this.match));
  }

  aliveFor(owner) {
    return this.list.some(mn => mn.owner === owner && mn.alive);
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
