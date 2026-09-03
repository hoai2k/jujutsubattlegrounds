// THE SWARM, GLUTTONY AND GROWTH — Kurourushi's three systems.
//
// PERFORMANCE IS THE DESIGN CONSTRAINT HERE, and it is worth stating plainly
// because it shaped every decision in this file:
//
//   · There is ONE InstancedMesh for every roach on the map, ever. One draw
//     call, one material, a buffer allocated at the cap and never resized.
//   · The cap is HARD. `SWARM_CAP` roaches exist at most; releasing more culls
//     the OLDEST, so a player mashing RB and an Infestation running at the
//     same time cost exactly what one wave costs.
//   · Roaches are PLAIN OBJECTS in a flat array, not entities in the effects
//     list. They do not allocate per tick, they do not raycast, they do not
//     consult the bounds, and their damage is applied on a shared interval
//     rather than per roach.
//   · Their pursuit is deliberately dumb: steer toward the nearest opponent
//     with a per-roach wander offset. A swarm does not need pathfinding; it
//     needs to LOOK like a swarm, and 200 objects doing something simple beat
//     20 doing something clever.
//
// GLUTTONY is the second resource. It fills from swarm contact and from
// DEVOUR, it never decays inside a round, and at each threshold he GROWS.
// Growth changes the model's scale, his hurt capsule, his reach, his damage,
// his maximum health and his speed — and deliberately changes NOTHING about
// navigation. That is Mahoraga's ruling reused wholesale: his body radius and
// his wall probe stay human at every stage, so there is no interior in the
// game he can get stuck in, by construction rather than by testing.
import { v3, rand, flatDist } from '../../core/math.js';
import { RoachSwarm } from '../../art/legacy/models/roach.js';

// The single number the whole feature's cost is bounded by. 220 roaches is
// ~19k triangles in one draw call; measured on the heaviest map it does not
// move the frame time (see the report).
export const SWARM_CAP = 220;
// How often the swarm as a whole deals damage, and how many roaches on one
// body can contribute to a single tick. Together these are the hard ceiling on
// swarm dps: MAX_BITERS x tickDmg / SWARM_TICK. At the shipped 6 x 0.9 / 0.55
// that is 9.8 hp/s against a fighter standing in the middle of the whole thing.
export const SWARM_TICK = 0.55;
export const MAX_BITERS = 6;

export class SwarmSystem {
  constructor(match) {
    this.match = match;
    this.roaches = [];
    this.swarm = new RoachSwarm(SWARM_CAP);
    match.root.add(this.swarm.mesh);
    this.infest = null;          // {owner, t, dur, def} while the ultimate holds
    this.obscure = 0;            // 0..1 screen crawl, read by the HUD
    this._tick = 0;
  }

  // ---- RELEASE ------------------------------------------------------------
  // `at` is where they come out of him. They spread first and pursue after, so
  // a wave reads as a wave rather than as a homing missile swarm.
  release(owner, def, opts = {}) {
    const n = opts.count ?? def.count ?? 20;
    const at = opts.at || owner.pos.clone().addScaledVector(owner.forward(), 0.9);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = (def.speed ?? 3.4) * rand(0.75, 1.25);
      this.roaches.push({
        owner,
        x: at.x + Math.cos(a) * rand(0, 0.4),
        y: at.y + 0.03,
        z: at.z + Math.sin(a) * rand(0, 0.4),
        vx: Math.cos(a) * sp, vz: Math.sin(a) * sp,
        yaw: a, sp,
        spread: (def.spread ?? 2.2) / sp,   // seconds of scatter before they hunt
        life: (opts.life ?? def.life ?? 9) * rand(0.85, 1.15),
        wander: rand(-1, 1), ph: rand(0, 6.3),
        def
      });
    }
    // THE CULL. Oldest first, so a fresh wave always fully lands and the cost
    // is fixed. Reported to the HUD rather than done silently.
    let dropped = 0;
    while (this.roaches.length > SWARM_CAP) { this.roaches.shift(); dropped++; }
    if (dropped > 0) this.match.hud.toast(owner, 'SWARM CAPPED — ' + dropped + ' CULLED');
    return n;
  }

  countFor(owner) {
    let n = 0;
    for (const r of this.roaches) if (r.owner === owner) n++;
    return n;
  }

  // SELF-DEVOUR: he eats his own swarm. Converts up to `max` live roaches into
  // Gluttony and removes them — a small amount, but it means a Kurourushi who
  // cannot reach you is still getting bigger.
  devourOwn(owner, max, per) {
    let eaten = 0;
    for (let i = this.roaches.length - 1; i >= 0 && eaten < max; i--) {
      if (this.roaches[i].owner !== owner) continue;
      const r = this.roaches[i];
      this.match.fx._spawn(v3(r.x, r.y + 0.1, r.z), {
        color: 0xd8a02a, size: 0.14, life: 0.3,
        vel: v3(owner.pos.x - r.x, 1.6, owner.pos.z - r.z).multiplyScalar(1.4)
      });
      this.roaches.splice(i, 1);
      eaten++;
    }
    if (eaten) this.feed(owner, eaten * per);
    return eaten;
  }

  // ---- INFESTATION --------------------------------------------------------
  beginInfestation(owner, def) {
    this.infest = { owner, t: def.duration, dur: def.duration, def, tick: 0 };
    this.release(owner, owner.cfg.ct1, {
      count: def.floodCount, life: def.floodLife,
      at: owner.pos.clone()
    });
    this.match.stage.flash(0.4);
    this.match.cam.shake(0.8);
  }

  // ---- GLUTTONY + GROWTH --------------------------------------------------
  feed(f, amount) {
    const g = f.cfg.gluttony;
    if (!g || !f.alive) return;
    const before = f.gluttony;
    f.gluttony = Math.min(g.max, f.gluttony + amount);
    if (f.gluttony === before) return;
    // one stage per crossing, and the loop handles a tick that crosses two —
    // Infestation is specifically allowed to push him through several at once
    while (f.growthStage < g.thresholds.length
      && f.gluttony >= g.thresholds[f.growthStage]) {
      this._advance(f);
    }
  }

  _advance(f) {
    const g = f.cfg.gluttony, p = g.perStage;
    f.growthStage++;
    // the health he gains is GIVEN to him, not just added to the ceiling — a
    // growth stage that leaves him at the same absolute HP would read as a
    // downgrade on the bar
    f.growthHpBonus = (f.growthHpBonus ?? 0) + p.hp;
    f.res.hp += p.hp;
    f.model.setStage?.(f.growthStage);
    f.model.setGrowth?.(1 + f.growthStage * p.scale);
    f.model.setWings?.(1);
    f._wingT = 1.1;
    f.emit('growth', { stage: f.growthStage, of: g.thresholds.length });
    if (!f.busy) f.anim.play('growth', { fade: 0.1, restart: true });
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt) {
    const m = this.match;
    const targets = m.activeFighters.filter(f => f.alive);

    // INFESTATION: continuous damage anywhere on the map, and it feeds him.
    if (this.infest) {
      const inf = this.infest;
      inf.t -= dt;
      inf.tick -= dt;
      if (inf.tick <= 0) {
        inf.tick = inf.def.tickEvery ?? 0.5;
        for (const t of targets) {
          if (t === inf.owner) continue;
          t.takeChip(inf.def.dps * (inf.def.tickEvery ?? 0.5), 'summon');
          m.fx._spawn(t.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.2, 1.6), rand(-0.4, 0.4))), {
            color: 0x2b303b, size: rand(0.09, 0.18), life: 0.35,
            vel: v3(rand(-1, 1), rand(0.4, 1.6), rand(-1, 1))
          });
        }
        this.feed(inf.owner, (inf.def.perInfestationSecond
          ?? inf.owner.cfg.gluttony.perInfestationSecond) * (inf.def.tickEvery ?? 0.5));
      }
      // it keeps topping the field up while it holds
      if (this.roaches.length < SWARM_CAP * 0.8 && Math.random() < dt * 3) {
        this.release(inf.owner, inf.owner.cfg.ct1, { count: 12, life: 4, at: inf.owner.pos.clone() });
      }
      if (inf.t <= 0) {
        m.hud.toast(inf.owner, 'INFESTATION ENDS');
        this.infest = null;
      }
    }

    // ---- the roaches ------------------------------------------------------
    let obscure = 0;
    const s = this.swarm;
    const biters = new Map();     // victim -> {n, owner, def}
    s.begin();
    for (let i = this.roaches.length - 1; i >= 0; i--) {
      const r = this.roaches[i];
      r.life -= dt;
      if (r.life <= 0 || !r.owner.alive) { this.roaches.splice(i, 1); continue; }

      // pursuit: after the scatter beat they steer at the nearest opponent
      r.spread -= dt;
      if (r.spread <= 0) {
        let best = null, bd = Infinity;
        for (const t of targets) {
          if (t === r.owner) continue;
          const d = flatDist(t.pos, r);
          if (d < bd) { bd = d; best = t; }
        }
        if (best) {
          const dx = best.pos.x - r.x, dz = best.pos.z - r.z;
          const d = Math.hypot(dx, dz) || 1;
          // the wander is what stops 200 roaches converging into one line
          const wob = Math.sin(r.ph + r.life * 5) * r.wander * 0.7;
          const tx = (dx / d) * Math.cos(wob) - (dz / d) * Math.sin(wob);
          const tz = (dx / d) * Math.sin(wob) + (dz / d) * Math.cos(wob);
          r.vx += (tx * r.sp - r.vx) * Math.min(1, dt * 3.2);
          r.vz += (tz * r.sp - r.vz) * Math.min(1, dt * 3.2);
        }
      }
      r.x += r.vx * dt;
      r.z += r.vz * dt;
      r.yaw = Math.atan2(r.vx, r.vz);
      // they crawl on whatever surface is under them — no physics, one query
      const g = m.arena?.bounds?.floorAt(r.x, r.z, r.y + 1.2);
      if (g != null) r.y += (g + 0.03 - r.y) * Math.min(1, dt * 8);

      // ---- contact ------------------------------------------------------
      // COUNTED, NOT APPLIED. Each roach only reports that it is touching
      // somebody; the damage is resolved once per victim below.
      //
      // The first pass had every roach apply its own tick, and measured that
      // is roughly 65 damage per second with forty of them on you — Kurourushi
      // killed a passive opponent faster than any character in the game, which
      // is the exact opposite of "the attrition monster who never gets a clean
      // knockout". Aggregating lets the swarm stay VISUALLY overwhelming while
      // its damage stays capped at something a fight can survive, and it costs
      // one loop instead of two hundred.
      const cr = r.def.contactRadius ?? 0.85;
      for (const t of targets) {
        if (t === r.owner) continue;
        if (Math.abs(t.pos.y - r.y) > 1.6) continue;
        if (flatDist(t.pos, r) > cr) continue;
        const b = biters.get(t);
        if (b) { b.n++; } else biters.set(t, { n: 1, owner: r.owner, def: r.def });
        break;
      }

      // ---- the obscure --------------------------------------------------
      // How much of the SCREEN they are worth. Read by the HUD as a crawling
      // overlay; capped hard so it can never become an unplayable brownout.
      const me = m.fighters[0];
      if (me && flatDist(me.pos, r) < 3.0) obscure += r.def.obscurePerRoach ?? 0.02;

      s.write(r.x, r.y, r.z, r.yaw, 0.10, r.life * 9 + r.ph);
    }
    s.commit();

    // ---- the swarm's damage, once per victim -------------------------------
    // One shared tick clock rather than one per roach, and the number of
    // roaches that can bite you at once is CAPPED. More roaches past the cap
    // still obscure your vision and still look like the map has been lost —
    // they just cannot stack their damage, which is what keeps his ultimate
    // survivable and keeps him an attrition character rather than a burst one.
    this._tick -= dt;
    const tickNow = this._tick <= 0;
    if (tickNow) this._tick = SWARM_TICK;
    if (tickNow) {
      for (const [victim, b] of biters) {
        // NO DOUBLE-DIPPING DURING INFESTATION. While the ultimate holds, its
        // own map-wide tick IS the swarm's damage — the roaches on the floor
        // still crawl, still obscure vision and still look like the map has
        // been lost, they just stop billing separately.
        //
        // Measured without this: 224 damage over sixteen seconds, which killed
        // every character in the game from full and made "it should be
        // possible to survive" a comment rather than a fact.
        if (this.infest && this.infest.owner === b.owner) continue;
        const n = Math.min(b.n, MAX_BITERS);
        victim.takeChip((b.def.tickDmg ?? 0.9) * n, 'summon');
        this.feed(b.owner, (b.owner.cfg.gluttony?.perSwarmTick ?? 0.8) * n);
        if (Math.random() < 0.5) m.sfx.swarmHiss?.(Math.min(1, n / MAX_BITERS));
      }
    }

    const cap = this.infest ? (this.infest.def.obscure ?? 0.42) : 0.34;
    this.obscure += (Math.min(cap, obscure) - this.obscure) * Math.min(1, dt * 4);

    // the wing flare after a growth stage
    for (const f of m.activeFighters) {
      if (f._wingT > 0) {
        f._wingT -= dt;
        if (f._wingT <= 0) f.model.setWings?.(0);
      }
    }
  }

  // ---- HUD ----------------------------------------------------------------
  snapshot(f) {
    const g = f.cfg.gluttony;
    if (!g) return null;
    return {
      value: f.gluttony ?? 0, max: g.max,
      stage: f.growthStage ?? 0, stages: g.thresholds.length,
      thresholds: g.thresholds,
      next: g.thresholds[f.growthStage ?? 0] ?? null,
      roaches: this.countFor(f),
      cap: SWARM_CAP,
      infesting: !!(this.infest && this.infest.owner === f),
      infestT: this.infest && this.infest.owner === f ? this.infest.t : 0
    };
  }

  resetRound() {
    this.roaches.length = 0;
    this.swarm.begin();
    this.swarm.commit();
    this.infest = null;
    this.obscure = 0;
    for (const f of this.match.fighters) {
      if (!f.cfg.gluttony) continue;
      f.gluttony = 0;
      f.growthStage = 0;
      f.growthHpBonus = 0;
      f.model.setStage?.(0);
      f.model.setGrowth?.(1);
      f.model.setWings?.(0);
      f.model.setMaw?.(0);
    }
  }
  clear() { this.resetRound(); this.swarm.dispose(); }
}
