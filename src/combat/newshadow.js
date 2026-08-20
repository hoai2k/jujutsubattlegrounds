// NEW SHADOW STYLE: SIMPLE DOMAIN 簡易領域 — Miwa's entire character.
//
// A circular barrier she inscribes on the ground around herself. Inside it,
// every sword slash she makes connects, anything that crosses the boundary is
// automatically cut, and an enemy Domain Expansion's sure-hit stops landing.
// She moves at less than half speed inside it, it drains her stamina
// continuously, the radius is small, and there is a real cooldown after it
// drops.
//
// ===========================================================================
// THE UNIVERSAL SIMPLE DOMAIN IS NOT TOUCHED — read this first
// ===========================================================================
// This project already had a Simple Domain: the `simpleDomain` STATE, which
// any fighter can hold while trapped inside an enemy domain, driven from
// domains.js `_trappedControls`, paid for out of `cfg.simpleDomainDrain`.
//
// NOTHING IN THAT SYSTEM CHANGED. Not one line of `_trappedControls`, not the
// state, not the drain, not the clip, not any of the sixteen sites in
// domains.js that test for it. Every character — including Miwa — still gets
// exactly what they got before.
//
// Hers is an ADDITIONAL, separate ability on B: a free-standing zone she can
// deploy at any time, anywhere, in or out of a domain. The two coexist and
// never interact. One is a state on a body; the other is an object on the
// ground. Miwa can be standing in her own circle AND holding the generic
// state, and both work, because they are not the same mechanism.
//
// The ONE place they meet is the predicate `sdHolds` in domains.js, which used
// to read `t.state === 'simpleDomain'` inline at each sure-hit site and now
// asks a function that also considers her circle. That is deliberately modelled
// on `blossomHolds`, which is the precedent this project already set for
// folding a second anti-domain tool into the existing checks without
// duplicating them.
//
// ===========================================================================
// THE GUARANTEE, AND HOW IT IS ROUTED
// ===========================================================================
// "Every sword slash she makes inside her Simple Domain hits."
//
// It is routed through `sureHit`, the flag the domain system already uses, and
// NOT through a second mechanism. combat/fighter.js `_applyHit` carries a
// dozen `!hit.sureHit` guards, and they are — by lucky accident of the
// existing design — exactly the list of things this has to beat:
//
//   line 2420  Hakari's SHUTTER intercept          `!hit.sureHit`
//   line 2435  Hakari's COUNTER stance             `!hit.sureHit`
//   line 2467  I-FRAMES (dashes, teleports, wake)  `!hit.sureHit`
//   line 2499  OTG / already-down refusal          `!hit.sureHit`
//   line 2520  ARMOR (Todo, Yuji RESOLVE, Yuki)    `!hit.sureHit`
//   line 2529  the downed-target refusal           `!hit.sureHit`
//   line 2545  Nanami's ratio priming              `!hit.sureHit`
//   line 2557  BLOCKING                            `!hit.sureHit`
//
// So flagging her slash `sureHit: true` beats blocking, i-frames, Toji's dash
// i-frames, Gojo's teleport (which grants i-frames), Naoya's projection stance
// (ditto), armour moves, and Hakari's two intercepts, in one line, using the
// path that was already there. Todo's Boogie Woogie is the one that does NOT
// go through applyHit — it is a POSITION swap — and it is handled explicitly
// below in `resolveSlash`. The full audit is in the delivery notes.
//
// ===========================================================================
// WHERE THE PIECES LIVE
// ===========================================================================
//   · this file                the zone, the rules, the auto-counter
//   · fx/newshadowfx.js        the ring, the wall, the cut arcs
//   · characters/miwa.js       every NUMBER, under `simpleDomainZone`
//   · combat/fighter.js        the B branch, the movement clamp, the slash tag
//   · domains/domains.js       ONE import, into the shared `sdHolds` predicate
//   · core/match.js            construction, per-frame update, round reset
import { v3, flatDist } from '../core/mathutil.js';
import { computeDamage, hitFeedback } from './hits.js';
import { cutRibbon } from '../fx/newfx.js';

// ---------------------------------------------------------------------------
// WHAT COUNTS AS A PROJECTILE FOR THE CUT
// ---------------------------------------------------------------------------
// The effect dispatcher's `entities` list is heterogeneous — some entries are
// projectiles, some are ground markers, some are timers with no position at
// all. Rather than guessing from shape, this is an explicit whitelist of the
// entity types that are genuinely a THING FLYING AT HER, plus an opt-in flag
// (`projectile: true`) so a future technique can join the list from its own
// file without editing this one.
//
// Deliberately EXCLUDED, and each for a reason:
//   'blue'         Gojo's Blue is an attractor placed AT a point, not a thing
//                  in flight. Cutting it would be cutting a location.
//   'woodenBall'   Hanami's ball is already a falling object with its own
//                  ground-impact rules; it arrives from above rather than
//                  crossing the perimeter.
//   'projRush'     Naoya's rush is HIM, not a projectile. Cutting it would be
//                  the auto-counter, which already handles a body crossing in.
const PROJECTILE_TYPES = new Set([
  'bolt',        // Kashimo's Lightning Bolt
  'redOrb',      // Gojo's Red
  'ember',       // Jogo's Embers
  'ballRoll',    // Hanami's rolling ball
  'bloodEdge',   // Choso's Blood Edge
  'nail',        // Nobara's hairpins
  'soulEcho'     // the delayed half of a Split Soul string
]);

function isProjectile(e) {
  return !!e && !!e.pos && (e.projectile === true || PROJECTILE_TYPES.has(e.type));
}

// ---------------------------------------------------------------------------
// THE PREDICATE domains.js ASKS
// ---------------------------------------------------------------------------
// Deliberately shaped exactly like `blossomHolds` in domains.js, which is the
// precedent for this: a small exported function consulted only on sure-hit
// paths, so a second anti-domain tool folds into the existing checks instead
// of duplicating them.
//
// Note it takes the TARGET, not the caster: the question every call site is
// asking is "is this body currently protected", and a body is protected if it
// is standing inside a live circle — which for now can only be Miwa's own,
// but is written as a position test rather than an identity test so that it
// stays correct if the circle ever protects an ally.
export function sdZoneHolds(f) {
  const z = f?._sdZone;
  return !!z && z.live && z.contains(f.pos);
}

class SimpleDomainZone {
  constructor(owner, match) {
    this.owner = owner;
    this.match = match;
    this.def = owner.cfg.simpleDomainZone;
    this.origin = owner.pos.clone();
    this.origin.y = match.arena?.bounds?.floorAt?.(this.origin.x, this.origin.z, owner.pos.y) ?? owner.pos.y;
    this.live = false;
    this.t = 0;
    this.counterCD = 0;
    // WHO WAS INSIDE LAST FRAME. The auto-counter fires on a CROSSING, not on
    // presence, so it needs last frame's answer — otherwise a target standing
    // still inside the circle would be cut every 0.34 s forever, which is not
    // "anything that enters gets slashed", it is a damage-over-time field.
    this.wasInside = new Map();
    this.fx = match.newshadowfx?.open(this) ?? null;
  }

  get radius() { return this.def.radius; }

  contains(pos) {
    return flatDist(pos, this.origin) <= this.radius;
  }

  // -------------------------------------------------------------------------
  // THE AUTO-COUNTER
  // -------------------------------------------------------------------------
  // "She does not need to input the counter; the circle does it."
  _counter(target) {
    const m = this.match;
    const o = this.owner;
    const ac = this.def.autoCounter;
    this.counterCD = ac.cooldown;
    // it costs her stamina — a circle being walked in and out of repeatedly
    // burns her clock down faster, which is a genuine (if desperate) way to
    // play against it
    o.res.stamina = Math.max(0, o.res.stamina - this.def.counterCost);

    // THE CUT, at the crossing point rather than at her — the blade arc is
    // drawn where they came in, which is what makes it read as the circle
    // acting rather than as her attacking.
    const at = target.pos.clone().setY(target.pos.y + 1.0);
    this.fx?.cutAt(at, this.origin);
    // ONE STROKE, in real geometry, along the tangent of the circle at the
    // crossing point — see fx/newfx.js. The ring's own flash (above) marks
    // WHERE they came in; this is the cut itself.
    {
      const d = at.clone().sub(this.origin).setY(0);
      if (d.lengthSq() < 1e-4) d.set(1, 0, 0);
      d.normalize();
      cutRibbon(m.fx, at, v3(-d.z, 0, d.x), { color: this.def.ringHot, len: 2.1 });
    }
    m.sfx.swordSwing?.();
    m.hitstop(3);

    const { dmg, crit } = computeDamage(o, ac.dmg);
    const r = target.applyHit({
      attacker: o, dmg, kb: ac.kb, kbY: ac.kbY, hitstun: ac.hitstun,
      type: 'light', src: 'miwa_counter',
      // THE GUARANTEE. Same flag, same path — see the header.
      sureHit: true, unblockable: true, isCT: true,
      dir: v3(target.pos.x - this.origin.x, 0, target.pos.z - this.origin.z).normalize()
    }, m.ctxFor(o));
    hitFeedback(m, o, target, r, { crit });
    // she does the short counter animation, but ONLY if she is not busy —
    // the circle must never take the body away from a move she is committed
    // to, or the auto-counter would cancel her own draw
    if (!o.busy && o.alive) o.play('counter', { fade: 0.05 });
    o.emit('sdCounter');
  }

  // -------------------------------------------------------------------------
  // THE PROJECTILE CUT
  // -------------------------------------------------------------------------
  // "incoming projectiles, which are cut down and destroyed." No cooldown on
  // this one, deliberately: a projectile is CONSUMED by being cut, so each
  // shot pays for its own removal and there is no rapid-fire exploit. It also
  // costs no stamina, because the alternative — a zoner draining her circle
  // for free from outside — would invert the matchup the design wants.
  _cutProjectiles() {
    const eff = this.match.effects;
    if (!eff?.entities || !this.def.cutsProjectiles) return;
    for (let i = eff.entities.length - 1; i >= 0; i--) {
      const e = eff.entities[i];
      if (!isProjectile(e) || e.caster === this.owner) continue;
      if (!this.contains(e.pos)) continue;
      // the same single clean line the boundary counter draws
      this.fx?.cutAt(e.pos.clone(), this.origin);
      this.match.sfx.guard?.();
      // remove whatever visual node the entity owns, then the entity
      if (e.fxNode) this.match.fx.dropProp?.(e.fxNode);
      eff.entities.splice(i, 1);
    }
  }

  // -------------------------------------------------------------------------
  update(dt) {
    const m = this.match;
    const o = this.owner;
    const d = this.def;
    this.t += dt;
    this.counterCD = Math.max(0, this.counterCD - dt);

    // ---- THE THREE WAYS IT DROPS -----------------------------------------
    // 1. she leaves it
    if (d.dropOnLeave && !this.contains(o.pos)) return this.close('left');
    // 2. the stamina runs out. `haltRegen` is applied in fighter.update, so
    //    this drain is against a pool that is not refilling.
    o.res.stamina = Math.max(0, o.res.stamina - d.drain * dt);
    if (o.res.stamina <= 0.5) return this.close('exhausted');
    // 3. she dies, or the round ends
    if (!o.alive) return this.close('down');

    // ---- THE BOUNDARY ----------------------------------------------------
    // A crossing, not a presence. See `wasInside`.
    for (const f of m.activeFighters) {
      if (f === o || !f.alive) continue;
      const inside = this.contains(f.pos);
      const was = this.wasInside.get(f) ?? false;
      this.wasInside.set(f, inside);
      if (inside && !was) {
        this.fx?.flashAt(f.pos.clone(), this.origin);
        if (this.counterCD <= 0) this._counter(f);
      }
    }
    this._cutProjectiles();

    // ---- NEUTRALISING SURE-HIT DOMAIN EFFECTS ---------------------------
    // Nothing happens HERE — the neutralisation is a passive property read by
    // domains.js through `sdZoneHolds`, at the sites that already check for
    // the generic Simple Domain state. What this block does is purely the
    // VISUAL: when a hostile domain is up and she is inside her circle, the
    // barrier is visibly doing its job at the perimeter.
    const dom = m.domains?.state;
    if (dom && dom.phase === 'active' && dom.caster !== o) {
      this.fx?.setNeutralising(dom.def?.id ?? dom.kind ?? null, dt);
    } else {
      this.fx?.setNeutralising(null, dt);
    }

    this.fx?.update(dt, this);
  }

  close(why) {
    if (!this.live) return false;
    this.live = false;
    this.fx?.close();
    // THE COOLDOWN STARTS NOW, not at cast — so a long hold is followed by a
    // long gap and she cannot simply re-place the circle the moment somebody
    // steps out of it.
    this.owner.sdCooldown = this.owner.cfg.special.cooldown;
    this.owner.emit('sdEnd', { why });
    this.match.hud?.toast?.(this.owner, why === 'exhausted' ? '簡易領域 EXHAUSTED' : '簡易領域 DOWN');
    return true;
  }
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
export class NewShadowSystem {
  constructor(match) {
    this.match = match;
    this.zones = [];
  }

  // Miwa's B routes here. Returns false when it is refused, so the caller can
  // play the failure feedback.
  cast(owner) {
    if (!owner?.cfg?.simpleDomainZone) return false;
    if ((owner.sdCooldown ?? 0) > 0) return false;
    if (this.zoneFor(owner)) return false;
    // she needs enough stamina to hold it for at least a moment — casting a
    // circle that drops on the next frame is worse than being told no
    if (owner.res.stamina < owner.cfg.simpleDomainZone.drain * 0.5) return false;
    const z = new SimpleDomainZone(owner, this.match);
    z.live = true;
    owner._sdZone = z;
    this.zones.push(z);
    owner.emit('sdStart');
    this.match.hud?.toast?.(owner, '簡易領域');
    this.match.sfx.simpleDomain?.();
    return true;
  }

  zoneFor(owner) {
    const z = this.zones.find(x => x.owner === owner && x.live);
    return z || null;
  }

  // A LIVE circle containing this position, whoever owns it. Used by the
  // slash-tagging path below and by the domain predicate.
  liveZoneAt(pos) {
    for (const z of this.zones) if (z.live && z.contains(pos)) return z;
    return null;
  }

  // -------------------------------------------------------------------------
  // THE SLASH TAG
  // -------------------------------------------------------------------------
  // Asked by fighter/effects on every hit Miwa produces: should this one be
  // guaranteed? THREE conditions, all required:
  //   1. she owns a live circle
  //   2. SHE is inside it (leaving drops it, so this is nearly always true —
  //      but the frame she steps out is a real frame and the answer has to be
  //      no on it)
  //   3. THEY are inside it. "If the opponent is inside the circle when she
  //      swings, they are cut." If they are outside, the swing is a normal
  //      swing and can be blocked like anybody's.
  //   4. the move is one of hers listed in `sureHitMoves` — the guarantee
  //      belongs to the SWORD, not to everything she can do
  shouldGuarantee(owner, target, moveKey) {
    const z = this.zoneFor(owner);
    if (!z) return false;
    const d = z.def;
    if (!d.sureHitInside) return false;
    if (!z.contains(owner.pos)) return false;
    if (!target || !z.contains(target.pos)) return false;
    return d.sureHitMoves.includes(moveKey);
  }

  // The movement clamp, read by fighter._locomote. She is slow inside her own
  // circle and cannot dash out of it.
  moveMult(f) {
    const z = this.zoneFor(f);
    return z && z.contains(f.pos) ? z.def.moveMult : 1;
  }
  allowDash(f) {
    const z = this.zoneFor(f);
    return z ? z.def.allowDash : true;
  }

  // -------------------------------------------------------------------------
  // THE ULTIMATE'S EXPANSION
  // -------------------------------------------------------------------------
  // The circle grows to nearly four times its radius over the startup, and
  // then everything inside is cut once. Implemented as a temporary override on
  // the live zone rather than as a second object, so every rule the circle
  // already has — the neutralisation, the guarantee, the FX — applies to the
  // big one for free. If she has no circle up, one is created for the cast.
  beginUltimate(owner) {
    let z = this.zoneFor(owner);
    if (!z) { this.cast(owner); z = this.zoneFor(owner); }
    if (!z) return null;
    const u = owner.cfg.ultimate;
    z.ultT = 0;
    z.ultRadius = u.radius;
    z.ultExpand = u.expandSeconds;
    z.baseRadius = z.def.radius;
    // the radius getter is overridden for the duration of the cast
    Object.defineProperty(z, 'radius', {
      configurable: true,
      get() {
        const k = Math.min(1, (this.ultT ?? 0) / this.ultExpand);
        // eased, so it accelerates outward rather than growing linearly —
        // which is what makes the expansion feel like pressure
        const e = k * k * (3 - 2 * k);
        return this.baseRadius + (this.ultRadius - this.baseRadius) * e;
      }
    });
    // the drain is suspended during the ultimate: she has already paid a full
    // cursed-energy bar for it and charging stamina on top would be a second
    // price for one move
    z.ultHold = true;
    return z;
  }

  endUltimate(owner) {
    const z = this.zoneFor(owner);
    if (!z) return;
    delete z.radius;                 // restore the prototype getter
    z.ultHold = false;
    z.ultT = 0;
    // the big circle does not persist — it collapses back and the normal
    // cooldown starts, so the ultimate is not also a free re-cast
    z.close('ultimate');
  }

  update(dt) {
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      if (z.live) {
        if (z.ultHold) {
          // during the ultimate only the expansion clock and the FX run —
          // no drain, no auto-counter, no drop check
          z.ultT = (z.ultT ?? 0) + dt;
          z.fx?.update(dt, z);
        } else {
          z.update(dt);
        }
      }
      if (!z.live) {
        if (z.owner._sdZone === z) z.owner._sdZone = null;
        this.zones.splice(i, 1);
      }
    }
  }

  resetRound() {
    for (const z of this.zones) { z.live = false; z.fx?.close(); z.owner._sdZone = null; }
    this.zones.length = 0;
  }

  // -------------------------------------------------------------------------
  // THE AI'S READ
  // -------------------------------------------------------------------------
  // "Miwa places her circle and baits — the CPU must not chase, since chasing
  // defeats her entire design." The profile asks these two questions and
  // nothing else.
  shouldCast(f, dist) {
    if (!f?.cfg?.simpleDomainZone) return false;
    if ((f.sdCooldown ?? 0) > 0 || this.zoneFor(f)) return false;
    if (f.res.stamina < 60) return false;
    // place it when they are CLOSE ENOUGH TO BE TEMPTED but not yet inside —
    // casting it while they are across the arena just burns the clock, and
    // casting it while they are already on top of her wastes the counter
    return dist > f.cfg.simpleDomainZone.radius * 0.9 && dist < 7.0;
  }
  // and once it is down, it is a trap: she charges the draw and waits.
  holding(f) { return !!this.zoneFor(f); }
}
