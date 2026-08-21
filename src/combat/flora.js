// DISASTER PLANTS — Hanami's three persistent systems, in one place.
//
//   NATURE'S EMBRACE   the terrain-scaled regeneration that is his identity
//   ROOT FIELD         patches of ground he converts to natural terrain
//   CURSED BUD         the parasitic seed that drains the opponent's meter
//
// All three are OWNED BY THE MATCH rather than by the fighter, for the same
// reason the shikigami and the transfigured humans are: a root field outlives
// the technique that made it, a bud outlives the frame it landed on, and both
// have to survive their owner being knocked into the air.
//
// The map knows nothing about any of this. `arena/terrain.js` classifies the
// static world; a Root Field is a COMBAT effect layered on top of it, and the
// only place the two meet is `terrainFor()` below.
import * as THREE from 'three';
import { v3, rand, flatDist } from '../core/mathutil.js';
import { NATURAL, ARTIFICIAL } from '../arena/terrain.js';
import { toonMaterial } from '../art/shaders/toon.js';
import { mergeGeos } from '../art/builders/geo.js';

// the third terrain state: ground he MADE. Better than real soil, because it
// cost him a technique and a cooldown and the real thing is free.
export const FIELD = 'field';

const GRASS = 0x4e7a3a;
const GRASS_HI = 0x76a352;
const ROOT = 0x6a4f34;

// ---------------------------------------------------------------------------
// the visual: one instanced tuft mesh per field, plus a ground disc
// ---------------------------------------------------------------------------
let _tuftGeo = null;
function tuftGeo() {
  if (_tuftGeo) return _tuftGeo;
  // three blades leaning different ways — about 40 triangles, and one of them
  // is drawn a few hundred times per field, so it stays this cheap
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.ConeGeometry(0.055, 0.42 + i * 0.06, 3);
    g.translate(0, 0.21 + i * 0.03, 0);
    g.rotateZ((i - 1) * 0.38);
    g.rotateY(i * 1.9);
    parts.push(g);
  }
  _tuftGeo = mergeGeos(parts);
  return _tuftGeo;
}

class FieldVisual {
  constructor(parent, x, y, z, r, permanent) {
    this.group = new THREE.Group();
    this.group.position.set(x, y + 0.02, z);
    // the ground disc: roots and turf breaking through whatever was there
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 30),
      new THREE.MeshBasicMaterial({
        color: permanent ? 0x3f6b30 : GRASS, transparent: true,
        opacity: 0.62, depthWrite: false
      }));
    disc.rotation.x = -Math.PI / 2;
    this.group.add(disc);
    this.disc = disc;
    // the rim: a ring of exposed root
    const rim = new THREE.Mesh(new THREE.RingGeometry(r * 0.93, r, 30),
      new THREE.MeshBasicMaterial({ color: ROOT, transparent: true, opacity: 0.85, depthWrite: false }));
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.006;
    this.group.add(rim);
    // the grass: one instanced draw for the whole patch
    const n = Math.min(150, Math.round(r * r * 5));
    const mat = toonMaterial({
      vertexColors: false, color: GRASS_HI, steps: [64, 138, 232],
      rim: 0.3, rimStart: 0.68, rimColor: 0xa8d08a
    });
    const inst = new THREE.InstancedMesh(tuftGeo(), mat, n);
    inst.frustumCulled = false;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), rr = Math.sqrt(Math.random()) * r * 0.96;
      e.set(0, rand(0, 6.3), 0);
      q.setFromEuler(e);
      const sc = rand(0.6, 1.35);
      s.set(sc, sc * rand(0.8, 1.4), sc);
      m4.compose(new THREE.Vector3(Math.sin(a) * rr, 0, Math.cos(a) * rr), q, s);
      inst.setMatrixAt(i, m4);
    }
    inst.instanceMatrix.needsUpdate = true;
    this.group.add(inst);
    this.inst = inst;
    this.grow = 0;
    parent.add(this.group);
  }
  update(dt, health) {
    // it grows in over a beat, and it VISIBLY dies back as it takes damage —
    // both players need to be able to see a field that is nearly gone
    this.grow = Math.min(1, this.grow + dt * 3.2);
    const k = this.grow * (0.35 + health * 0.65);
    this.group.scale.set(1, k, 1);
    this.disc.material.opacity = 0.28 + health * 0.38;
    this.inst.visible = health > 0.12;
  }
  dispose() {
    this.group.removeFromParent();
    this.inst.material.dispose();
  }
}

// ---------------------------------------------------------------------------
export class FloraSystem {
  constructor(match) {
    this.match = match;
    this.fields = [];     // {x, z, y, r, t, dur, hp, maxHp, owner, permanent, vis}
    this.buds = [];       // {victim, owner, t, dur, def, hits}
    this.root = new THREE.Group();
    this.root.name = 'flora';
    match.root.add(this.root);
  }

  // ---- TERRAIN ------------------------------------------------------------
  // The one place the static map and the combat layer meet. A live Root Field
  // wins over whatever the map says, which is the entire point of the special.
  fieldAt(pos) {
    for (const f of this.fields) {
      if (f.hp <= 0) continue;
      // fields are FLAT patches at a height, so a fighter on the mezzanine
      // above one on the concourse floor is not standing in it
      if (Math.abs(pos.y - f.y) > 1.2) continue;
      const dx = pos.x - f.x, dz = pos.z - f.z;
      if (dx * dx + dz * dz < f.r * f.r) return f;
    }
    return null;
  }

  terrainFor(fighter) { return this.terrainForPos(fighter.pos); }

  // The same question about an arbitrary point — Root Eruption asks it about
  // where the spikes are coming up, not about where Hanami is standing.
  //
  // ---- WHAT ICE DOES TO NATURE'S EMBRACE, AND WHY NO CODE CHANGED --------
  // arena/terrain.js grew a third class (ICE) for Uraume, so this call can now
  // return 'ice'. Hanami's rate table is keyed natural / artificial / field
  // and has no `ice` key — and that is the ANSWER rather than an oversight,
  // because the lookup a few lines into `_tickRegen` has always ended in
  // `?? fl.regen.artificial`. A sheet of ice over soil is not soil you can put
  // roots into, so he gets the dead-ground rate on it, exactly as he does on
  // concrete. The safe-default this file already had turns out to be the
  // correct ruling, so HANAMI'S REGENERATION CODE IS UNTOUCHED: no branch, no
  // new key, no new number. What he does see is the HUD saying FROZEN GROUND
  // instead of DEAD GROUND, which is more information than he had before.
  //
  // The order of the two lines below is the other half of the ruling and it is
  // load-bearing: `fieldAt` is consulted FIRST, so a live Root Field under the
  // ice still answers FIELD and still feeds him at his maximum rate. Uraume
  // can freeze the surface of Hanami's garden; they cannot freeze the garden.
  terrainForPos(pos) {
    if (this.fieldAt(pos)) return FIELD;
    const a = this.match.arena;
    return a?.terrainAt ? a.terrainAt(pos.x, pos.z, pos.y) : ARTIFICIAL;
  }

  // ---- ROOT FIELD ---------------------------------------------------------
  plantField(owner, opts = {}) {
    const sp = owner.cfg.special;
    const f = {
      x: opts.x ?? owner.pos.x, z: opts.z ?? owner.pos.z, y: opts.y ?? owner.pos.y,
      r: opts.radius ?? sp.radius, t: opts.duration ?? sp.duration,
      dur: opts.duration ?? sp.duration,
      hp: opts.hp ?? sp.hp, maxHp: opts.hp ?? sp.hp,
      owner, permanent: !!opts.permanent
    };
    f.vis = new FieldVisual(this.root, f.x, f.y, f.z, f.r, f.permanent);
    this.fields.push(f);
    this.match.sfx.rootField?.();
    return f;
  }

  // Heavy attacks tear a field up and FIRE burns it out — the two counters the
  // brief asks for, and both are routed through here so the numbers live in
  // one place. `kind` is 'heavy' | 'fire'.
  damageFieldsAt(pos, radius, kind) {
    let hit = 0;
    for (const f of this.fields) {
      if (f.hp <= 0) continue;
      if (Math.abs(pos.y - f.y) > 2.0) continue;
      if (flatDist(pos, v3(f.x, f.y, f.z)) > radius + f.r) continue;
      const sp = f.owner.cfg.special;
      // ---- THE THIRD COUNTER: ICE --------------------------------------
      // Uraume freezing ground that is already Hanami's garden. It is the
      // WEAKEST of the three on purpose (24 against fire's 55 and a heavy
      // swing's 34), and the reasoning is the matchup rather than the number:
      // ice does not BURN a field, it seals it, so a frozen field is a field
      // that is being slowly starved rather than one that is being destroyed.
      // The immediate half of that interaction — Uraume taking the FOOTING
      // while Hanami keeps the SOIL — is not here at all; it falls out of
      // `terrainForPos` consulting `fieldAt` first, so a live field keeps
      // feeding him straight through the sheet. See the ruling written where
      // the freeze happens, in IceSystem.freeze (combat/frost.js).
      f.hp -= kind === 'fire' ? (sp.fireDamage ?? 55)
        : kind === 'ice' ? (sp.iceDamage ?? 24)
          : (sp.heavyDamage ?? 34);
      hit++;
      for (let i = 0; i < 6; i++) {
        this.match.fx._spawn(v3(f.x + rand(-f.r, f.r), f.y + 0.2, f.z + rand(-f.r, f.r)), {
          color: kind === 'fire' ? 0xff8a3a : kind === 'ice' ? 0xcfeaf6 : GRASS,
          size: rand(0.1, 0.26), life: 0.4,
          vel: v3(rand(-1, 1), rand(1, 3), rand(-1, 1)), gravity: 5
        });
      }
    }
    return hit;
  }

  // ---- CURSED BUD ---------------------------------------------------------
  // ONE bud per victim. Re-landing it refreshes rather than stacking, so the
  // drain rate is a constant a player can learn instead of a spiral.
  plantBud(owner, victim, def) {
    const live = this.buds.find(b => b.victim === victim);
    if (live) { live.t = def.duration; live.hits = 0; return live; }
    const b = { victim, owner, t: def.duration, dur: def.duration, def, hits: 0, fxT: 0 };
    this.buds.push(b);
    this.match.hud.toast(victim, '呪詛の芽 CURSED BUD');
    return b;
  }

  budOn(fighter) { return this.buds.find(b => b.victim === fighter) || null; }

  // The victim landed a clean hit on Hanami — that is how the bud comes off.
  // Called from the damage pipeline via match.
  noteCleanse(attacker) {
    const i = this.buds.findIndex(x => x.victim === attacker);
    if (i < 0) return;
    const b = this.buds[i];
    if (++b.hits < (b.def.cleanseHits ?? 4)) return;
    // removed HERE rather than left for the tick to notice: a bud that is
    // gone should be gone on the frame it was torn out, or the HUD reports a
    // seed the player has already earned their way out of.
    this.buds.splice(i, 1);
    this.match.hud.toast(attacker, '摘出 — BUD TORN OUT');
    this.match.sfx.techReveal?.(520);
  }

  // ---- THE INVERTED SPEAR OF HEAVEN ---------------------------------------
  // Toji's forced cancellation, applied to this system. Called from
  // domains.nullify so the two never drift.
  //
  // WHAT IT TAKES: a Cursed Bud the target is feeding (a parasite being
  // sustained on a body IS an active cursed technique), and every Root Field
  // they own (cursed energy holding a forest up through concrete is the same).
  // WHAT IT DOES NOT TAKE: ground the WOODEN BALL made. That field is what is
  // left after a technique has already gone off and been paid for, exactly as
  // Jackpot is — there is nothing still running for the blade to touch.
  nullify(target) {
    let n = 0;
    for (let i = this.buds.length - 1; i >= 0; i--) {
      if (this.buds[i].owner !== target) continue;
      this.match.hud.toast(this.buds[i].victim, 'BUD KILLED');
      this.buds.splice(i, 1);
      n++;
    }
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      if (f.owner !== target || f.permanent) continue;
      f.vis.dispose();
      this.fields.splice(i, 1);
      n++;
    }
    return n;
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt) {
    const m = this.match;

    // ---- fields ----------------------------------------------------------
    for (let i = this.fields.length - 1; i >= 0; i--) {
      const f = this.fields[i];
      if (!f.permanent) f.t -= dt;
      f.vis.update(dt, Math.max(0, f.hp / f.maxHp));
      if (f.t <= 0 || f.hp <= 0) {
        f.vis.dispose();
        this.fields.splice(i, 1);
      }
    }

    // ---- the passive, per fighter that has one ---------------------------
    for (const fighter of m.activeFighters) {
      const fl = fighter.cfg.flora;
      if (!fl || !fighter.alive) continue;
      const kind = this.terrainFor(fighter);
      // a short settle so walking along a kerb does not strobe the readout
      if (kind !== fighter.terrainRaw) {
        fighter.terrainRaw = kind;
        fighter.terrainSettle = fl.settle ?? 0.35;
      } else if (fighter.terrainSettle > 0) {
        fighter.terrainSettle -= dt;
        if (fighter.terrainSettle <= 0 && fighter.terrain !== kind) {
          fighter.terrain = kind;
          fighter.emit('terrainChange', { kind });
        }
      }
      if (!fighter.terrain) fighter.terrain = kind;
      const rate = fl.regen[fighter.terrain] ?? fl.regen.artificial;
      fighter.floraRate = rate;
      // REGEN. Halted during backlash exactly like cursed-energy regen, and it
      // cannot exceed his starting health — this heals, it does not buff.
      if (fighter.backlash <= 0 && fighter.state !== 'ko' && fighter.state !== 'intro') {
        // `maxHP`, not `cfg.stats.hp`: for Panda the ceiling is the ACTIVE CORE's
        // pool, so Nature's Embrace repairs the body that is out and stops there.
        // Identical to the old value for every other fighter in the game.
        fighter.res.hp = Math.min(fighter.maxHP, fighter.res.hp + rate * dt);
      }
      // and the model shows it
      const best = fl.regen.field || 1;
      fighter.model.setVitality?.(Math.min(1, rate / best));
    }

    // ---- the slow, for everyone standing in someone else's field ---------
    for (const t of m.activeFighters) {
      const f = this.fieldAt(t.pos);
      const own = f && f.owner === t;
      const want = (f && !own) ? (f.owner.cfg.special.slowMult ?? 0.75) : 1;
      if (t.floraSlow !== want) {
        t.floraSlow = want;
        if (want < 1) m.hud.toast(t, '花畑 — SLOWED');
      }
    }

    // ---- buds ------------------------------------------------------------
    for (let i = this.buds.length - 1; i >= 0; i--) {
      const b = this.buds[i];
      b.t -= dt;
      const { victim, owner, def } = b;
      if (b.t <= 0 || !victim.alive || !owner.alive) {
        this.buds.splice(i, 1);
        continue;
      }
      // ---- THE DRAIN, and the two fighters it cannot drain ---------------
      // TOJI has no cursed energy at all (Heavenly Restriction) and MAHORAGA
      // has no cursed-energy SYSTEM. Reading their empty bars literally would
      // make the seed a no-op against two of the hardest things in the game,
      // which is backwards — the bud is a parasite that lives on cursed
      // energy, and against a body that has none it simply feeds on the body
      // instead. So it converts to a flat, honest damage-over-time at a rate
      // declared on the move, it says so on screen, and Hanami gets NOTHING
      // back: there is no energy there to take, so there is none to give him.
      // The two rulings are the same ruling and it is written once, here.
      const st = victim.cfg.stats;
      const hasCE = !victim.noCE && (st.startMaxCE > 0 || st.ceGainPerPunch > 0);
      if (!hasCE) {
        victim.takeChip((def.flatVsNoCE?.dps ?? 3.4) * dt, 'ct2');
        if (!b._noCEToast) {
          b._noCEToast = true;
          m.hud.toast(victim, 'NO CURSED ENERGY — IT EATS ANYWAY');
        }
      } else {
        const take = Math.min(victim.res.curCE, def.drainPerSec * dt);
        victim.res.curCE -= take;
        victim.takeChip(def.drainPerSec * 0.10 * dt, 'ct2');
        if (!owner.noCE) {
          owner.res.curCE = Math.min(owner.res.maxCE,
            owner.res.curCE + take * (def.feedMult ?? 0.85));
        }
      }
      // the seed itself, visible on the victim's model
      b.fxT -= dt;
      if (b.fxT <= 0) {
        b.fxT = 0.16;
        const p = victim.pos.clone().add(v3(rand(-0.2, 0.2), 1.25 + rand(-0.15, 0.15), rand(-0.2, 0.2)));
        m.fx._spawn(p, {
          color: Math.random() < 0.4 ? HEART_C : GRASS, size: rand(0.07, 0.15), life: 0.5,
          vel: v3(rand(-0.3, 0.3), rand(0.3, 0.9), rand(-0.3, 0.3))
        });
      }
    }
  }

  // ---- HUD ----------------------------------------------------------------
  snapshot(fighter) {
    const bud = this.budOn(fighter);
    return {
      terrain: fighter.terrain || ARTIFICIAL,
      rate: fighter.floraRate ?? 0,
      fields: this.fields.length,
      bud: bud ? { t: bud.t, dur: bud.dur, hits: bud.hits, need: bud.def.cleanseHits ?? 4 } : null
    };
  }

  resetRound() {
    for (const f of this.fields) f.vis.dispose();
    this.fields.length = 0;
    this.buds.length = 0;
    for (const f of this.match.fighters) {
      f.terrain = null; f.terrainRaw = null; f.terrainSettle = 0; f.floraSlow = 1;
    }
  }
  clear() { this.resetRound(); this.root.removeFromParent(); }
}

const HEART_C = 0xe8bcc6;
export { NATURAL, ARTIFICIAL };
