// ===========================================================================
// THE RECEIPT STOCK — 再契象の控え. Reggie's second resource.
// ===========================================================================
// He does not spend cursed energy to attack. He spends TAGS. Cursed energy is
// what burns them, and burning is cheap; the tag is the expensive part, which
// is why every object below costs a few points of the bar and a lot of stock.
//
// ---------------------------------------------------------------------------
// WHY THIS IS A FILE AND NOT FOUR LINES IN fighter.js
// ---------------------------------------------------------------------------
// Three of the roster's second resources (Choso's blood, Nobara's essence,
// Kashimo's charge) live in their own module for the same reason: the resource
// has RULES — it earns, it locks, it is read by the wheel to decide what is
// selectable, it is read by the HUD to decide what to print, it is read by the
// CPU to decide what to save for, and it is taken away by a mechanic in
// somebody else's kit. Spreading that across the fighter would put five
// unrelated `if (cfg.receipts)` blocks into a 5,600-line file.
//
// ---------------------------------------------------------------------------
// THE WATER RULE, AND IT IS THE WHOLE CHARACTER'S WEAKNESS
// ---------------------------------------------------------------------------
// *** A WET RECEIPT CANNOT BE BURNED. *** This is canon and it is how he dies:
// Megumi drops them both into a school swimming pool and every tag on him
// dissolves at once.
//
// So anything in this game that soaks him LOCKS THE STOCK. He keeps the
// number — the tags are still there, they are just useless — and he cannot
// spend a point of it, and it does not regenerate, for `waterLock` seconds.
//
// `WET_SOURCES` below is the complete list and it is deliberately SHORT AND
// SPECIFIC rather than "anything blue". The test is whether the fiction says
// the thing is WATER:
//
//   dagon_*        Dagon IS the ocean. His whole domain is standing in it.
//   ocean          the sea shikigami's spray and the toads' tongues.
//   ino_reiki      Ino's 霊亀 coats him in cursed WATER and he glides on it —
//                  and it comes off him when he strikes. Two characters
//                  shipping in the same change, and one of them happens to be
//                  the hardest counter in the game to the other. That is not a
//                  coincidence I engineered; it is what the research produced,
//                  and it is the best matchup either of them has.
//   takaba_hose    the fire hose. It is a joke, and it is water.
//
// EXPLICITLY NOT ON THE LIST, and each for a stated reason:
//   uraume ICE     — ice is not water. A frozen floor does not wet paper, and
//                    Uraume's kit is already the strongest movement lock in the
//                    game; handing them a technique lock as well would make one
//                    matchup unplayable rather than hard.
//   miwa's circle  — it is a barrier, not a puddle. It is not blue because it
//                    is wet, it is blue because that is her accent.
//   jogo, ryu      — obviously not, but worth writing down: FIRE does not stop
//                    him. He is already burning the tags himself.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { v3, rand, flatDist, yawBetween } from '../../core/math.js';
import { computeDamage, hitFeedback } from './hits.js';
import { buildDrone, buildVendingWreck, buildReceipt } from '../../art/legacy/models/receiptobjects.js';

// ---------------------------------------------------------------------------
// *** WHAT COUNTS AS WATER — AND THE FIRST ANSWER WAS A LOCKOUT ***
// ---------------------------------------------------------------------------
// The first version tested the hit's ADAPTATION SOURCE against a set that
// included `ino_reiki`. That reads well and it was measured as unplayable:
// every punch Ino throws in the 霊亀 stance carries `src: 'ino_reiki'` — the
// source tag is per-BEAST, which is what makes Mahoraga's rotation puzzle work
// — so every jab soaked Reggie for 3.2 seconds. Instrumented over one match he
// took SIXTEEN soaks in forty-five seconds and fired his technique button ZERO
// times. That is not a counter, it is a deletion.
//
// So it is an explicit `water: true` FLAG on the hit rather than an inference
// from the source, and only the things that are actually a volume of water
// carry it:
//
//   INO'S GLIDE      he crosses nine metres ON the water and it sprays.
//   INO'S SHELL      it bursts outward. That is the moment it drenches you.
//   INO'S NORMALS    *** DO NOT. *** He has a film of cursed water on his
//                    skin; being punched by a wet man is not being soaked, and
//                    the fiction survives that reading far better than the
//                    matchup survives the other one.
//   DAGON            all of it. His domain IS the sea and standing in it is
//                    being in the sea.
//   OCEAN SHIKIGAMI  the spray and the tongues.
//   TAKABA'S HOSE    it is a joke, and it is a fire hose.
//
// EXPLICITLY NOT WATER, and each for a stated reason:
//   URAUME'S ICE     ice is not water. A frozen floor does not wet paper, and
//                    their kit is already the strongest movement lock in the
//                    game; a technique lock on top would make one matchup
//                    unplayable rather than hard.
//   MIWA'S CIRCLE    it is a barrier, not a puddle. It is blue because that is
//                    her accent.
//   JOGO, RYU        obviously not, but worth writing down: FIRE does not stop
//                    him. He is already burning the tags himself.
//
// The SOURCE set is kept as well, for the things whose every hit genuinely is
// water — that is Dagon and his shikigami, and nobody else.
export const WET_SOURCES = new Set([
  'dagon_water', 'dagon_wave', 'dagon_domain', 'ocean'
]);

// The one predicate. A hit soaks him if it declares itself water OR comes from
// a source that is entirely made of water.
export function isWater(hit) {
  return !!hit?.water || (!!hit?.src && WET_SOURCES.has(hit.src));
}

// ---------------------------------------------------------------------------
// THE RESOURCE
// ---------------------------------------------------------------------------
export function initReceipts(f) {
  const c = f.cfg.receipts;
  if (!c) return;
  f.stock = c.start;
  f.stockWet = 0;          // seconds of water lock remaining
  f.stockLock = 0;         // seconds of post-ultimate regeneration halt
  f.stockFlash = 0;        // HUD: seconds since the last earn, for the tick-up
  f.stockEarned = 0;       // HUD: how much the last earn was
}

export function resetReceipts(f) { initReceipts(f); }

export function stockOf(f) { return f.cfg.receipts ? (f.stock ?? 0) : 0; }
export function stockMax(f) { return f.cfg.receipts?.max ?? 0; }
export function stockFrac(f) { return f.cfg.receipts ? (f.stock ?? 0) / f.cfg.receipts.max : 0; }

// *** THE ONE GATE. *** Everything that wants to spend stock asks this, and
// nothing else decides. A wet Reggie fails here with everything he owns.
export function canAfford(f, cost) {
  const c = f.cfg.receipts;
  if (!c) return true;                       // not him — never blocked
  if (f.stockWet > 0) return false;          // canon: a wet tag will not burn
  return (f.stock ?? 0) >= cost - 1e-6;
}

export function spendStock(f, cost) {
  if (!f.cfg.receipts) return true;
  if (!canAfford(f, cost)) return false;
  f.stock = Math.max(0, f.stock - cost);
  f.model?.setStock?.(stockFrac(f));
  return true;
}

// Earning. Called from the hit pipeline — see the hook in Fighter.applyHit's
// attacker side — and from nowhere else, so the ledger cannot drift.
export function earn(f, amount, { blocked = false } = {}) {
  const c = f.cfg.receipts;
  if (!c || f.stockLock > 0) return;
  const add = amount * (blocked ? c.blockedMult : 1);
  const before = f.stock ?? 0;
  f.stock = Math.min(c.max, before + add);
  const gained = f.stock - before;
  if (gained > 0.01) {
    f.stockEarned = gained;
    f.stockFlash = 0.9;
    f.emit?.('stockEarn', { amount: gained, total: f.stock });
    f.model?.setStock?.(stockFrac(f));
  }
}

// Soak him. Called from the hit pipeline when the incoming hit's `src` is in
// WET_SOURCES, and from the ocean/water volumes in Dagon's domain.
export function soak(f, seconds = null) {
  const c = f.cfg.receipts;
  if (!c) return false;
  const dur = seconds ?? c.waterLock;
  if (f.stockWet >= dur) return false;       // never shorten an existing lock
  const fresh = f.stockWet <= 0;
  f.stockWet = dur;
  if (fresh) f.emit?.('stockSoaked', { duration: dur });
  return fresh;
}

// The ultimate's aftermath: he keeps nothing and earns nothing for a while.
export function burnEverything(f) {
  const c = f.cfg.receipts;
  if (!c) return 0;
  const spent = f.stock ?? 0;
  f.stock = 0;
  f.stockLock = f.cfg.ultimate?.stockLock ?? 6;
  f.model?.setStock?.(0);
  return spent;
}

export function tickReceipts(f, dt) {
  const c = f.cfg.receipts;
  if (!c) return;
  if (f.stockWet > 0) f.stockWet = Math.max(0, f.stockWet - dt);
  if (f.stockLock > 0) f.stockLock = Math.max(0, f.stockLock - dt);
  if (f.stockFlash > 0) f.stockFlash = Math.max(0, f.stockFlash - dt);
  // regeneration halts while wet AND while locked. Both are total halts rather
  // than slow-downs, because "your technique is off" is the point of each.
  if (f.stockWet <= 0 && f.stockLock <= 0 && f.stock < c.max) {
    f.stock = Math.min(c.max, f.stock + c.regen * dt);
    f.model?.setStock?.(stockFrac(f));
  }
}

// What the wheel is allowed to show as selectable. The ring is the readout of
// what he can afford — see the note on `special` in characters/reggie.js.
export function affordableObjects(f) {
  const o = f.cfg.objects;
  if (!o) return [];
  return o.order.filter(k => canAfford(f, o.defs[k].cost));
}

// ===========================================================================
// THE DRONE AND THE WRECK
// ===========================================================================
// The two objects that OUTLIVE their materialisation, which is why they are a
// system and the other five are entities in the effect dispatcher.
//
// THE DRONE IS A BODY, NOT A PROJECTILE. It has health, it can be hit, it
// pathfinds, and it dies. That places it in the same category as Megumi's
// shikigami, Geto's curses, Mahito's transfigured human, Yuki's Garuda,
// Dagon's ocean shikigami and Yaga's corpses — the seventh ally family on the
// field — and it means Uro CANNOT reflect it (combat/reflect.js: summons are
// bodies) and Mahoraga adapts to it as `reggie_drone` rather than as a
// projectile. Both rulings are the existing ones applied unchanged.
//
// THE WRECK IS SCENERY. No health, no AI, no damage. It is a collider and a
// sight-blocker for fourteen seconds and then it is gone.
class Drone {
  constructor(owner, match, def) {
    this.owner = owner; this.match = match; this.def = def;
    this.hp = def.hp; this.maxHp = def.hp;
    this.life = def.life;
    this.dropT = def.dropEvery * 0.55;
    this.dead = false;
    this.spin = 0;
    this.model = buildDrone();
    this.pos = owner.pos.clone()
      .addScaledVector(owner.forward(), 0.9)
      .add(v3(0, def.hover, 0));
    match.root.add(this.model);
    this.model.position.copy(this.pos);
    // the reveal: it unfolds out of a burning receipt rather than appearing
    this.reveal = 0;
    this.model.scale.setScalar(0.01);
  }
  get alive() { return !this.dead && this.hp > 0; }

  hurt(dmg, attacker) {
    if (this.dead) return;
    this.hp -= dmg;
    this.match.fx.hitSpark(this.pos.clone(), 'light');
    this.match.sfx.hit(false);
    if (this.hp <= 0) this.die();
  }
  die(silent = false) {
    if (this.dead) return;
    this.dead = true;
    if (!silent) {
      this.match.sfx.hit?.(true);
      for (let i = 0; i < 12; i++) {
        this.match.fx._spawn(this.pos.clone(), {
          color: i % 3 ? 0x3a3f4a : 0xf2622a, size: rand(0.06, 0.16), life: rand(0.25, 0.55),
          vel: v3(rand(-3, 3), rand(-1, 3), rand(-3, 3)), gravity: 12
        });
      }
    }
    this.model.removeFromParent();
    this.model.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }

  update(dt) {
    if (this.dead) return;
    const m = this.match;
    this.life -= dt;
    if (this.life <= 0) { this.die(); return; }
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt * 4.5);
      const s = this.reveal * this.reveal * (3 - 2 * this.reveal);
      this.model.scale.setScalar(s);
    }
    const foe = m.other(this.owner);
    // hold station above and slightly behind the target — close enough to
    // drop on them, far enough that a jumping punch is a real read rather
    // than a formality
    if (foe?.alive) {
      const want = foe.pos.clone()
        .addScaledVector(v3(foe.pos.x - this.owner.pos.x, 0, foe.pos.z - this.owner.pos.z).normalize(), 1.1)
        .setY(foe.pos.y + this.def.hover);
      const d = want.clone().sub(this.pos);
      const step = Math.min(d.length(), this.def.speed * dt);
      if (step > 1e-4) this.pos.addScaledVector(d.normalize(), step);
      this.model.rotation.y = yawBetween(this.pos, foe.pos);
    }
    // bob, so it never reads as a static decal
    this.model.position.copy(this.pos).add(v3(0, Math.sin(m.clock * 3.4) * 0.06, 0));
    // rotors
    this.spin += dt * 46;
    for (const b of (this.model.rotors ?? [])) b.rotation.y = this.spin;

    this.dropT -= dt;
    if (this.dropT <= 0 && foe?.alive && this.reveal >= 1) {
      this.dropT = this.def.dropEvery;
      this._drop(foe);
    }
  }

  _drop(foe) {
    const m = this.match;
    const at = this.pos.clone();
    m.fx._spawn(at, { color: 0xf2622a, size: 0.2, life: 0.2, vel: v3(0, -2, 0), gravity: 18 });
    m.sfx.hit?.(false);
    // resolved immediately below the drone, so it is dodged by moving rather
    // than by reacting — the same grammar every marker in this game uses
    if (flatDist(foe.pos, at) > this.def.radius + (foe.hurtBox?.pad ?? 0)) return;
    const { dmg, crit } = computeDamage(this.owner, this.def.dmg);
    const r = foe.applyHit({
      attacker: this.owner, isCT: true, src: 'reggie_drone', dmg,
      kb: this.def.kb, kbY: this.def.kbY, hitstun: this.def.hitstun,
      type: 'light', dir: v3(0, -1, 0)
    }, m.ctxFor(this.owner));
    hitFeedback(m, this.owner, foe, r, { crit });
  }
}

export class ReceiptSystem {
  constructor(match) {
    this.match = match;
    this.drones = [];
    this.wrecks = [];
  }

  // ONE DRONE AT A TIME, per owner. A second materialisation replaces the
  // first — same one-at-a-time rule Mahito's transfigured human has, and for
  // the same reason: two of them is not twice the pressure, it is a different
  // and much worse character.
  spawnDrone(owner, def) {
    for (const d of this.drones) if (d.owner === owner) d.die(true);
    this.drones = this.drones.filter(d => d.alive);
    const d = new Drone(owner, this.match, def);
    this.drones.push(d);
    return d;
  }

  dronesFor(owner) { return this.drones.filter(d => d.alive && d.owner === owner); }

  // The wreck. Registered with the arena's destructible grid so it can itself
  // be broken, and dropped out of the Bounds when it expires — the same
  // lifecycle Uraume's ice walls have, and for the same reason: a collider
  // that outlives its owner grows the spatial grid across a long session.
  spawnWreck(owner, at, def) {
    const m = this.match;
    const node = buildVendingWreck();
    node.position.copy(at);
    node.rotation.y = Math.random() * Math.PI * 2;
    m.root.add(node);
    // A REAL OBSTACLE, not a decoration: four walls and a walkable top, built
    // through the same `wall()` / `platform()` pair Takaba's THE SET uses for
    // runtime scenery, and torn down with `drop()` for exactly the reason that
    // method exists — a collider that outlives its owner grows both spatial
    // grids across a long session.
    const b = m.arena?.bounds ?? null;
    const R = def.wreckRadius, TOP = 1.05;
    const colliders = [];
    if (b) {
      const y0 = at.y, y1 = at.y + TOP;
      colliders.push(
        b.wall(at.x - R, at.z - R, at.x + R, at.z - R, y0, y1),
        b.wall(at.x - R, at.z + R, at.x + R, at.z + R, y0, y1),
        b.wall(at.x - R, at.z - R, at.x - R, at.z + R, y0, y1),
        b.wall(at.x + R, at.z - R, at.x + R, at.z + R, y0, y1),
        // and you can stand on it, which is what makes it cover rather than a
        // wall you shuffle around
        b.platform(at.x - R, at.z - R, at.x + R, at.z + R, y1)
      );
    }
    const w = { owner, node, colliders, t: def.wreckLife, radius: def.wreckRadius, at: at.clone() };
    this.wrecks.push(w);
    return w;
  }

  // Sight-blocking, for the CPU and for the gas cloud's occlusion test. A
  // wreck between two fighters is genuine cover.
  blocksSight(a, b) {
    for (const w of this.wrecks) {
      const abx = b.x - a.x, abz = b.z - a.z;
      const L2 = abx * abx + abz * abz;
      if (L2 < 1e-6) continue;
      let t = ((w.at.x - a.x) * abx + (w.at.z - a.z) * abz) / L2;
      t = Math.max(0, Math.min(1, t));
      const px = a.x + abx * t, pz = a.z + abz * t;
      if (Math.hypot(w.at.x - px, w.at.z - pz) < w.radius) return true;
    }
    return false;
  }

  update(dt) {
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      d.update(dt);
      if (!d.alive) this.drones.splice(i, 1);
    }
    for (let i = this.wrecks.length - 1; i >= 0; i--) {
      const w = this.wrecks[i];
      w.t -= dt;
      if (w.t <= 0) { this._dropWreck(w); this.wrecks.splice(i, 1); continue; }
      // the last second: it sinks and fades, so it never simply blinks out
      if (w.t < 1) {
        w.node.position.y = w.at.y - (1 - w.t) * 0.7;
        w.node.traverse(o => {
          if (o.material) { o.material.transparent = true; o.material.opacity = Math.max(0, w.t); }
        });
      }
    }
  }

  _dropWreck(w) {
    if (w.colliders?.length) this.match.arena?.bounds?.drop?.(w.colliders);
    w.node.removeFromParent();
    w.node.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }

  clear() {
    for (const d of this.drones) d.die(true);
    this.drones = [];
    for (const w of this.wrecks) this._dropWreck(w);
    this.wrecks = [];
  }
  resetRound() { this.clear(); }
}

// ===========================================================================
// THE BURNING RECEIPT — the visual that makes every attack legible
// ===========================================================================
// *** THIS PLAYS BEFORE EVERY SINGLE MATERIALISATION, WITHOUT EXCEPTION. ***
// Including the instant ones, including the ultimate's barrage, including the
// object that appears in his third punch.
//
// It is the most important 0.28 s in the character. Without it a car simply
// appears in mid-air and the player has no idea where it came from; with it,
// the source of every attack he has is stated in the picture every time. That
// is worth playing even when the technique it precedes is 9 frames long, so
// the burn is authored to run UNDERNEATH the move rather than in front of it —
// it never adds a frame to any move's startup.
export function burnFX(match, at, { scale = 1, up = 0.5 } = {}) {
  const node = buildReceipt(0.52 * scale, 0.13 * scale);
  node.position.copy(at);
  node.scale.set(1, 0.02, 1);
  match.fx.prop(node, 0.30, (n, k) => {
    // 0.00-0.35  unfurl downward
    // 0.35-1.00  the burn eats up from the bottom, curling as it goes
    if (k < 0.35) {
      const u = k / 0.35;
      n.scale.set(1, u * u * (3 - 2 * u), 1);
    } else {
      const b = (k - 0.35) / 0.65;
      n.scale.set(1, 1 - b * 0.9, 1);
      n.rotation.z = b * 0.9;
      n.position.y = at.y + b * up;
      if (n.paperMat) { n.paperMat.transparent = true; n.paperMat.opacity = 1 - b * 0.85; }
      if (n.inkMat) { n.inkMat.transparent = true; n.inkMat.opacity = 1 - b; }
    }
  });
  // the ember line eating up the strip
  for (let i = 0; i < 7; i++) {
    match.fx._spawn(at.clone().add(v3(rand(-0.07, 0.07) * scale, rand(-0.4, 0.05) * scale, rand(-0.03, 0.03))), {
      color: i % 2 ? 0xff9a3c : 0xffe0a0, size: rand(0.03, 0.09) * scale,
      life: rand(0.18, 0.42), gravity: -2.2,
      vel: v3(rand(-0.5, 0.5), rand(0.8, 2.4), rand(-0.5, 0.5))
    });
  }
  // and a curl of ash going the other way
  for (let i = 0; i < 4; i++) {
    match.fx._spawn(at.clone().add(v3(rand(-0.09, 0.09) * scale, rand(-0.3, 0.1) * scale, 0)), {
      color: 0x4a4640, size: rand(0.04, 0.10) * scale, aspect: 0.6,
      life: rand(0.4, 0.9), gravity: 1.4, opacity: 0.6,
      vel: v3(rand(-0.8, 0.8), rand(0.2, 1.0), rand(-0.8, 0.8))
    });
  }
  return node;
}
