// Domain Expansion: innate barrier + manifested inner world, sure-hit that
// bypasses hitbox resolution entirely, enormous cost + backlash, 20s duration,
// and counters (clash by refinement, barrier break, simple domain).
import { mulberry32, weightedPick, v3, rand, flatDist } from '../core/mathutil.js';
import { SwordRain } from './swordrain.js';
import { Sentencing } from './sentencing.js';
import { commitInstantKO, finishInstantKO } from '../combat/instantko.js';
import { applyBurn } from '../combat/burn.js';
import { cleaveDamage, fingerDmg } from '../combat/effects.js';
import { SPECIAL } from '../combat/balance.js';
// The circle half of `sdHolds` below, and the only line in this file that the
// new characters required. Miwa's Simple Domain is a separate object from the
// universal `simpleDomain` STATE this file owns — see combat/newshadow.js.
import { sdZoneHolds } from '../combat/newshadow.js';

// Length of the clash contest window: both domains are suspended and the
// sorcerer who takes the least damage over these seconds wins the exchange.
export const CONTEST_SECONDS = 5;

// ---------------------------------------------------------------------------
// FALLING BLOSSOM EMOTION 落花の情 (Shinjuku Gojo)
// ---------------------------------------------------------------------------
// A secret art of the Big Three Families and the roster's only UNIVERSAL
// domain counter — it needs neither a domain of your own nor a barrier to
// break. While the shroud is up, a domain's sure-hit is nullified at the point
// of contact and answered.
//
// It is deliberately wired as a SECOND ANSWER at every site that already asks
// about Simple Domain, rather than as a new special case bolted on beside
// them. That is what makes "verify it against every domain" a structural claim
// instead of a list of six patches: if a payload respects Simple Domain, it
// respects this too, and if a future domain adds a payload it only has to ask
// the one predicate both of them share.
//
// The documented weakness of the real technique is that it does nothing
// against ordinary physical attacks, and that is exactly what it does here:
// `blossomHolds` is only ever consulted on sure-hit paths.
export function blossomHolds(f) { return !!f && f.blossomT > 0 && f.state === 'blossom'; }

// ---------------------------------------------------------------------------
// SIMPLE DOMAIN, BOTH KINDS — the one predicate every sure-hit site asks
// ---------------------------------------------------------------------------
// There are now TWO ways a body can be holding a Simple Domain:
//
//   THE STATE  `simpleDomain` — the universal defensive option every fighter
//              gets while trapped inside an enemy domain, driven by
//              `_trappedControls` below and paid for out of
//              `cfg.simpleDomainDrain`. COMPLETELY UNCHANGED.
//   THE ZONE   Miwa's New Shadow Style circle, a free-standing object on the
//              ground she can place at any time. See combat/newshadow.js.
//
// Every site in this file that used to read `t.state === 'simpleDomain'`
// inline now asks this instead. That is deliberately the same move
// `blossomHolds` above already represents: fold a second anti-domain tool
// into the checks that exist rather than duplicating sixteen of them.
//
// NOTE WHAT THIS DOES NOT CHANGE. For every character who is not Miwa,
// `sdZoneHolds` is always false, so `sdHolds` is exactly the expression that
// was there before, character for character. The universal Simple Domain is
// untouched — including for Miwa, who can still hold the state like anybody
// else, and whose `simpleDomainDrain` is the best number on the roster.
export function sdHolds(f) {
  return !!f && (f.state === 'simpleDomain' || sdZoneHolds(f));
}

// The shroud answers back. Called from each nullification site so the counter
// is uniform no matter which domain was stopped.
export function blossomCounter(m, victim, caster) {
  victim.blossomHits = (victim.blossomHits ?? 0) + 1;
  // GLOBAL BALANCE. The other of the two damage sites that bypass `applyHit`
  // and so have to apply the scalar by hand — see combat/balance.js.
  const dmg = (victim.cfg.special?.counterDmg ?? 9) * SPECIAL;
  if (caster && caster !== victim && caster.alive) {
    caster.res.hp -= dmg;
    m.fx._ring(caster.pos.clone().setY(1.2), 0xffd8f0, { size: 0.4, growRate: 10, life: 0.3, flat: false });
  }
  m.fx._ring(victim.pos.clone().setY(1.2), 0xffc0e8, { size: 0.5, growRate: 8, life: 0.35, flat: false });
  for (let i = 0; i < 8; i++) {
    const a = rand(0, Math.PI * 2);
    m.fx._spawn(victim.pos.clone().setY(rand(0.6, 2.0)), {
      color: i % 2 ? 0xffd8f0 : 0xe0a8ff, size: rand(0.14, 0.30), life: rand(0.3, 0.6),
      vel: v3(Math.cos(a) * rand(1, 4), rand(0.5, 3), Math.sin(a) * rand(1, 4))
    });
  }
  if (!victim._blossomToast) { victim._blossomToast = true; m.hud.toast(victim, '落花の情'); }
}

// ---------------------------------------------------------------------------
// THE CLASH TALLY AND PANDA'S THREE CORES
// ---------------------------------------------------------------------------
// A Domain Clash is decided by WHO TOOK THE LEAST DAMAGE over its window, which
// it measures by snapshotting health at the start and subtracting at the end.
// That is exactly the wrong shape for a fighter with three health pools, and it
// was exploitable rather than merely inaccurate:
//
//   `res.hp` is Panda's ACTIVE CORE. If a core is destroyed during the clash he
//   is forced into a fresh one, so `res.hp` JUMPS UP — from 0 to as much as
//   141 — and the subtraction goes negative, is clamped to 0 by the
//   `Math.max(0, …)` already there, and records him as having taken NO DAMAGE
//   AT ALL. Losing a core mid-clash would have been the single best way to win
//   one in the game.
//
// So the clash measures his TOTAL across every pool, which is the honest answer
// to "how much damage did this fighter take" and is also monotonic, so the
// exploit cannot exist. Returns plain `res.hp` for everybody else, so no
// existing clash changes by a single point.
function clashHP(f) { return f.cores ? f.cores.reduce((a, c) => a + Math.max(0, c.hp), 0) : f.res.hp; }
function clashMax(f) { return f.cores ? f.cores.reduce((a, c) => a + c.max, 0) : (f.maxHP || f.cfg.stats.hp); }

export class DomainSystem {
  constructor(match) {
    this.match = match;
    this.active = null;
    // {caster, target, def, phase:'cast'|'active', castF, timer, integrity, sureT}
    this.contest = null;
    // {a, b, hpA, hpB, t, dur} — the 5s clash window; no domain holds during it
    this.swords = null;      // SwordRain manager while AML is active
    this.sentencing = null;  // Sentencing manager while Deadly Sentencing is active
    // The same manager AFTER the courtroom falls, once the sword has been won
    // out of the trial. Not barrier-scoped, so it is ticked below regardless of
    // whether any domain stands — the Jackpot split, applied to the blade.
    this.swordCarry = null;
    this.swordRoll = null;   // {seed, rng, last} — seeded roll stream
    this.forcedRoll = null;  // debug: force every roll to this table key (F6)
  }

  get state() { return this.active; }

  other(f) { return this.match.other(f); }

  // Everyone the caster has trapped inside their barrier: with two fighters
  // that is just the opponent, with three or four the domain catches them all.
  trapped(caster) {
    return this.match.fighters.filter(f => f !== caster && !f.eliminated);
  }

  // is this fighter the caster of a currently-standing domain?
  isMyDomain(f) {
    return !!this.active && this.active.caster === f && this.active.phase === 'active';
  }

  // voluntary early release (second press of the domain button). The bar was
  // already spent on the cast, so the backlash is still owed.
  dismiss(f) {
    if (!this.isMyDomain(f)) return false;
    this.match.hud.toast(f, 'DOMAIN RELEASED');
    this._collapse(false);
    return true;
  }

  // ---- CHIMERA SHADOW GARDEN (Megumi) -------------------------------------
  // The incomplete domain. Everything below exists because it has NO BARRIER
  // and NO SURE-HIT, and the rest of this file assumes both. Public helpers
  // live together here so the special-casing is in one readable block instead
  // of scattered through the lifecycle.
  gardenFor(f) {
    const a = this.active;
    return a && a.phase === 'active' && a.caster === f
      && a.def.sureHit.effect === 'shadow_garden' ? a : null;
  }
  isShadowGarden(f) { return !!this.gardenFor(f); }
  get garden() {
    const a = this.active;
    return a && a.phase === 'active' && a.def.sureHit.effect === 'shadow_garden' ? a : null;
  }

  // Is this world point covered by the sea of shadow? Dents (see pushShadow)
  // punch local holes in it, and those holes are the opponent's safe ground.
  shadowContains(pos) {
    const a = this.garden;
    if (!a) return false;
    if (flatDist(pos, a.shadowOrigin) > a.shadowR) return false;
    for (const d of a.dents) if (flatDist(pos, d) < d.r) return false;
    return true;
  }
  // 0 = safely outside, 1 = dead centre. Drives the opponent's HUD exposure
  // read, so they can always see how much trouble they are standing in.
  shadowExposure(f) {
    const a = this.garden;
    if (!a || a.caster === f) return 0;
    if (!this.shadowContains(f.pos)) return 0;
    const d = flatDist(f.pos, a.shadowOrigin);
    return Math.max(0.05, 1 - d / Math.max(0.001, a.shadowR));
  }
  // pull a point back inside the shadow (summon placement)
  clampToShadow(v) {
    const a = this.garden;
    if (!a) return v;
    const d = flatDist(v, a.shadowOrigin);
    if (d > a.shadowR * 0.92) {
      const k = (a.shadowR * 0.92) / d;
      v.x = a.shadowOrigin.x + (v.x - a.shadowOrigin.x) * k;
      v.z = a.shadowOrigin.z + (v.z - a.shadowOrigin.z) * k;
    }
    return v;
  }
  // Megumi dashing while standing on his own shadow travels THROUGH it.
  shadowTravel(f) {
    const a = this.gardenFor(f);
    if (!a) return null;
    return this.shadowContains(f.pos) ? a.def.shadow : null;
  }
  // COUNTERPLAY: a heavy swing shoves the shadow back locally, opening a hole
  // the attacker can stand in. There is no barrier to break, so this is the
  // move that replaces Barrier Break inside his domain.
  pushShadow(pos, by) {
    const a = this.garden;
    if (!a || a.caster === by) return false;
    const cfg = a.def.shadow.dent;
    if (!this.shadowContains(pos)) return false;
    a.dents.push(Object.assign(pos.clone(), { r: cfg.radius, t: cfg.duration, max: cfg.duration }));
    while (a.dents.length > cfg.max) a.dents.shift();
    const m = this.match;
    m.fx._ring(pos.clone().setY(0.06), 0x8fb6d8, { size: cfg.radius * 0.5, growRate: 9, life: 0.5 });
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      m.fx._spawn(pos.clone().add(v3(Math.cos(ang) * 0.6, 0.1, Math.sin(ang) * 0.6)), {
        color: 0x0a0c14, size: rand(0.3, 0.7), life: 0.5, opacity: 0.7,
        vel: v3(Math.cos(ang) * 5, rand(0.5, 2), Math.sin(ang) * 5)
      });
    }
    m.hud.toast(by, 'SHADOW PUSHED BACK');
    m.sfx.barrierChip();
    return true;
  }

  // ---- MALEVOLENT SHRINE (Sukuna) ------------------------------------------
  // The other open domain, and the opposite trade to Megumi's. Chimera Shadow
  // Garden has no barrier AND no sure-hit. Malevolent Shrine has no barrier
  // and KEEPS the sure-hit — the asymmetry is the character. What replaces the
  // barrier as a limit is the radius: the influence radiates out from where
  // the shrine came up and stops, and anyone who leaves is simply out of it.
  //
  // The origin is FIXED at the cast position and does not follow him. A shrine
  // that walked around with its owner would be a barrier with extra steps; a
  // fixed one means fleeing genuinely works and he has to go and re-engage.
  get shrine() {
    const a = this.active;
    return a && a.phase === 'active' && a.def.sureHit.effect === 'malevolent_shrine' ? a : null;
  }
  // Read by the HUD (the radius meter and the edge warning) and by the CPU.
  shrineState() {
    const a = this.shrine;
    if (!a) return null;
    const t = this.other(a.caster);
    const d = t ? flatDist(t.pos, a.shrineOrigin) : Infinity;
    return {
      caster: a.caster, origin: a.shrineOrigin, radius: a.shrineR, target: a.shrineTarget,
      dist: d, inside: d < a.shrineR, timer: a.timer,
      // 0 outside, 1 dead centre — the same read Megumi's exposure gives
      exposure: d >= a.shrineR ? 0 : Math.max(0.05, 1 - d / Math.max(0.001, a.shrineR))
    };
  }
  // Is this fighter being cut right now?
  inShrine(f) {
    const a = this.shrine;
    if (!a || a.caster === f) return false;
    return flatDist(f.pos, a.shrineOrigin) < a.shrineR;
  }

  _updateShrine(a, dt) {
    const m = this.match;
    const sh = a.def.shrine;
    // the shrine rises and its influence spreads out to the tuned radius
    a.openT = Math.min(1, a.openT + dt / sh.openTime);
    const e = a.openT * a.openT * (3 - 2 * a.openT);
    a.shrineR = a.shrineTarget * e;

    // ---- DISMANTLE: the arena ------------------------------------------------
    // Constant, on its own faster cadence, and it does not care what it hits.
    // Twenty seconds of this shreds the level, which is the point.
    a.cutT = (a.cutT ?? 0) - dt;
    if (a.cutT <= 0) {
      a.cutT = sh.cutInterval;
      for (let i = 0; i < (sh.cutsPerTick ?? 3); i++) {
        const ang = rand(0, Math.PI * 2), r = Math.sqrt(Math.random()) * a.shrineR;
        const p = v3(a.shrineOrigin.x + Math.cos(ang) * r, rand(0.4, 3.2), a.shrineOrigin.z + Math.sin(ang) * r);
        m.arena?.destruct?.damageAt(p, sh.cutRadius, sh.cutPower);
        if (sh.blackFlash) m.fx.shrineBlackFlash(p, 0.55);
        else m.fx.shrineSlash(p, rand(0.8, 1.6), false);
      }
      if (!sh.blackFlash) m.sfx.shrineSlash();
    }

    // ---- CLEAVE: the people --------------------------------------------------
    // A sure-hit tick. It bypasses hitbox resolution entirely: unblockable,
    // ignores i-frames, and scales off the victim's own MAX_CE exactly like the
    // technique does. SIMPLE DOMAIN is the one thing that holds it out, which
    // makes it the strongest defensive answer to him — see _trappedControls.
    a.slashT = (a.slashT ?? sh.interval * 0.4) - dt;
    const fire = a.slashT <= 0;
    if (fire) a.slashT = sh.interval;
    for (const t of this.trapped(a.caster)) {
      if (!t.alive) continue;
      const d = flatDist(t.pos, a.shrineOrigin);
      if (d >= a.shrineR) continue;                 // OUT. Running works.
      if (sdHolds(t)) {
        if (!a._sdToast) { a._sdToast = true; m.hud.toast(t, 'SIMPLE DOMAIN HOLDS'); }
        continue;
      }
      if (blossomHolds(t)) { if (fire) blossomCounter(m, t, a.caster); continue; }
      if (!fire) continue;
      const chest = t.pos.clone().add(v3(0, 1.3, 0));

      // ---- THE PAYLOAD, AND THE ONE THING THAT DIFFERS BETWEEN THE TWO ----
      // Sukuna's shrine cuts: a fast, relentless tick of CLEAVE that scales
      // off the victim's own MAX_CE and shreds the arena alongside them.
      //
      // Shinjuku Yuji's shrine PUNCHES. Same architecture, same barrierless
      // sure-hit, same escape — but the automatic strike is a BLACK FLASH, so
      // it lands half as often for roughly the same damage per second, in far
      // bigger single blows, and every one of them carries the black-red
      // distortion, the hitstop and the screen flash. Standing in Sukuna's is
      // being shredded; standing in this one is being beaten to death. It also
      // builds his own Black Flash chain, because it IS his Black Flash.
      if (sh.blackFlash) {
        const bf = sh.blackFlash;
        a.caster.bfChain = Math.min((a.caster.bfChain ?? 0) + 1, bf.chainCap ?? 6);
        m.fx.shrineBlackFlash(chest);
        m.sfx.blackFlash();
        t.applyHit({
          dmg: bf.dmg, kb: bf.kb ?? 2.2, kbY: bf.kbY ?? 0.6, hitstun: 20, type: 'heavy',
          attacker: a.caster, sureHit: true, unblockable: true, otgOk: true, isCT: false,
          // it is his FIST arriving, exactly like every other Black Flash in
          // the game — so Mahoraga adapts to it as `punch`, not as `domain`.
          src: 'punch', dir: v3(rand(-1, 1), 0, rand(-1, 1)).normalize()
        }, m.ctxFor(a.caster));
        m.hitstop(bf.hitstop ?? 9);
        m.stage.flash(0.30);
        m.cam.shake(0.55);
        m.cam.fovKick(5);
        continue;
      }

      const scaled = cleaveDamage(a.caster, t, {
        base: sh.base, ceScale: sh.ceScale, flatVsNoCE: sh.flatVsNoCE
      });
      m.fx.shrineSlash(chest, 1.1 + scaled.depth, true);
      t.applyHit({
        dmg: scaled.dmg * fingerDmg(a.caster), kb: 0.6, kbY: 0, hitstun: 12, type: 'light',
        attacker: a.caster, sureHit: true, unblockable: true, otgOk: true, isCT: true,
        src: 'domain', dir: v3(rand(-1, 1), 0, rand(-1, 1)).normalize()
      }, m.ctxFor(a.caster));
      m.cam.shake(0.14);
    }

    // ---- the periphery -------------------------------------------------------
    // Slashes criss-cross constantly whether or not anything is being hit, so
    // the space itself reads as lethal rather than as a circle on the floor.
    a.ambT = (a.ambT ?? 0) - dt;
    if (a.ambT <= 0) {
      a.ambT = 0.07;
      const ang = rand(0, Math.PI * 2), r = a.shrineR * rand(0.25, 1.0);
      const at = v3(a.shrineOrigin.x + Math.cos(ang) * r, rand(0.6, 4.5),
        a.shrineOrigin.z + Math.sin(ang) * r);
      if (sh.blackFlash) { if (Math.random() < 0.35) m.fx.shrineBlackFlash(at, 0.45); }
      else m.fx.shrineSlash(at, rand(0.6, 1.5), false);
    }
  }

  _updateGarden(a, dt) {
    const m = this.match;
    // the sea spreads out from where he cast it
    a.spreadT = Math.min(1, a.spreadT + dt / a.def.shadow.spreadTime);
    a.shadowR = a.shadowTarget * (a.spreadT * a.spreadT * (3 - 2 * a.spreadT));
    // dents heal shut
    for (let i = a.dents.length - 1; i >= 0; i--) {
      const d = a.dents[i];
      d.t -= dt;
      d.r = a.def.shadow.dent.radius * Math.min(1, d.t / (d.max * 0.5));
      if (d.t <= 0) a.dents.splice(i, 1);
    }
    // He sees the whole field through it: the caster keeps a faint sense of
    // where everyone is, and the opponent gets an exposure read on the HUD.
    a.exposure = new Map();
    for (const t of this.trapped(a.caster)) a.exposure.set(t, this.shadowExposure(t));
  }

  // ---- casting ------------------------------------------------------------
  // NO DOMAIN IS ONCE PER MATCH. Every Domain Expansion in the game can be
  // cast as many times as its owner can afford it, and the price is the only
  // limit there is: MAX_CE at 100 with CURRENT_CE full, the entire bar
  // consumed, and the standard backlash (zero regen and halved growth for ~10
  // seconds) afterwards. Rebuilding a bar you just spent is the cost.
  //
  // There used to be an `oncePerMatch` flag here backed by a `domainSpent`
  // field on the fighter. Both are gone rather than merely set to false, so
  // the restriction cannot come back by accident. Anything that needs to reset
  // between casts does so in `_activate` / `_collapse`, which run every time.
  castDomain(f, ctx) {
    // ---- AND WHEN IT REFUSES, IT SAYS WHY -----------------------------------
    // This gate used to be one line of four ANDed conditions returning false,
    // so the single most expensive button in the game did nothing and gave no
    // account of itself. Four different situations, four different things the
    // player should do about them, and no way to tell which one you were in.
    if (!f.cfg.domain) { f.emit('noCE', { why: 'NO DOMAIN' }); return false; }
    // Wordless: the backlash is the player's own bar sitting flat and refusing
    // to refill, which they are already staring at. The fizzle is the cue.
    if (f.backlash > 0) { f.emit('noCE', { why: '' }); return false; }
    if (!f.ultReady) {
      // Name the actual shortfall. The gate is MAX_CE at 100 with the bar full
      // (or a domain's own lower `castThreshold`), and "not enough cursed
      // energy" with a bar that LOOKS full is not an explanation — that player
      // is short on the ceiling, not on the charge, and has to keep fighting
      // rather than keep waiting.
      const th = f.castThresholdOverride ?? f.cfg.domain.castThreshold ?? 1;
      const want = 100 * th;
      f.emit('noCE', {
        why: f.res.maxCE < want - 0.01 ? 'NEED HIGHER ENERGY CEILING' : 'NEED CURSED ENERGY'
      });
      return false;
    }
    if (this.contest) return false; // barriers are already locked
    if (this.active) {
      if (this.active.caster !== f) return this._clash(f);
      return false;
    }
    const m = this.match;
    f.consumeFullBar(); // enormous cost, paid up front — the startup is punishable
    f.setState('castDomain', { clip: 'domainCast' });
    this.active = {
      caster: f, target: this.other(f), def: f.cfg.domain,
      phase: 'cast', castF: 0, timer: 0, integrity: 100, sureT: 0
    };
    m.hud.cutin(f, 'DOMAIN EXPANSION', f.cfg.domain.name + '  ' + f.cfg.domain.jpName);
    m.sfx.domainCast(f.cfg.id);
    m.cam.cinematic(f.pos, 1.6, 3.4, 1.7);
    m.domainfx.castBuildup(f);
    return true;
  }

  // The trapped player fires their own domain into the standing one. Rather
  // than resolving instantly, the two barriers lock and neither domain holds:
  // a 5-second CONTEST opens in which both sorcerers are free to fight. The
  // one who takes the LEAST damage across the window wins, and their domain
  // is the one that rises. Exact ties (commonly 0-0) fall back to refinement,
  // then remaining CE, then HP.
  _clash(challenger) {
    if (!challenger.cfg.domain || !challenger.ultReady || challenger.backlash > 0) return false;
    if (this.contest) return false;
    const m = this.match;
    const a = this.active;
    const defender = a.caster;
    challenger.consumeFullBar();

    // both barriers suspend — the standing domain's effects stop here, and
    // every bystander it had trapped is released too. A clash counts as the
    // gamble being cancelled: the machine only runs while the parlor stands.
    m.gamble?.endDomain(true);
    this._clearSwordPayload();
    // ENDING 3 by clash: a suspended barrier is not a barrier, so the sword
    // goes now rather than at the end of the contest. If Higuruma wins the
    // clash his domain rises again through _beginDomain and he is handed a
    // fresh one — with a fresh single attempt, because that is a new domain.
    this._clearSentencing();
    m.domainfx.hide();
    m.stage.setGrade(m.mapGrade || 'neutral');
    // ...unless Jackpot is still running, in which case the gold grade is not
    // the domain's, it is his, and it goes with him out of the wreckage.
    if (m.gamble?.jackpotFighter) m.stage.setGrade('jackpot');
    // A CLASH SUSPENDS BOTH BARRIERS for the five-second contest, so neither
    // domain is standing and the domain track should not be either. The winner
    // re-enters through `_beginDomain` -> `_activate` and starts it again.
    m.music?.play('fight');
    this.active = null;
    for (const f of m.fighters) {
      if (['voided', 'simpleDomain', 'barrierBreak', 'castDomain', 'sentenced', 'executing'].includes(f.state)) {
        f.setState('idle', { clip: 'idle' });
      }
      f.domainLock = null;
      f.burn.noDecay = false;
      f.buffs.domainHaste = 0;
      f.model.resetSprings();
    }

    this.contest = {
      a: challenger, b: defender,
      hpA: clashHP(challenger), hpB: clashHP(defender),
      t: 0, dur: CONTEST_SECONDS
    };

    const COL = { void: 0x5f8fff, swordfield: 0x8fe8b0, volcano: 0xff6a2f, flesh: 0x9fb0bd, shadow: 0x8fb6d8, pachinko: 0xffc93c };
    m.hud.cutin(challenger, 'DOMAIN CLASH', challenger.cfg.domain.name + ' vs ' + a.def.name);
    m.hud.message('CLASH — TAKE THE LEAST DAMAGE', 2.0);
    m.sfx.clash();
    m.domainfx.clashBegin(
      challenger.pos, defender.pos,
      COL[challenger.cfg.domain.env] || 0xb47fff,
      COL[a.def.env] || 0xb47fff);
    m.cam.shake(1.0);
    m.cam.fovKick(10);
    m.stage.flash(0.45);
    m.hitstop(18);
    return true;
  }

  // live damage tally for the HUD
  get clashState() {
    const c = this.contest;
    if (!c) return null;
    return {
      t: c.t, dur: c.dur,
      a: c.a, b: c.b,
      dmgA: Math.max(0, c.hpA - clashHP(c.a)),
      dmgB: Math.max(0, c.hpB - clashHP(c.b))
    };
  }

  _updateContest(dt) {
    const c = this.contest;
    const m = this.match;
    c.t += dt;
    m.domainfx.trackClash(c.a.pos, c.b.pos);
    if (!c.a.alive || !c.b.alive) { this.abortContest(); return; }
    if (c.t >= c.dur) this._resolveContest();
  }

  abortContest() {
    if (!this.contest) return;
    this.contest = null;
    this.match.domainfx.clearClash();
  }

  _resolveContest() {
    const m = this.match;
    const c = this.contest;
    const dmgA = Math.max(0, c.hpA - clashHP(c.a));
    const dmgB = Math.max(0, c.hpB - clashHP(c.b));
    let winner, loser, why;
    if (dmgA !== dmgB) {
      [winner, loser] = dmgA < dmgB ? [c.a, c.b] : [c.b, c.a];
      why = 'LESS DAMAGE TAKEN';
    } else {
      const rA = c.a.cfg.domain.refinement, rB = c.b.cfg.domain.refinement;
      if (rA !== rB) { [winner, loser] = rA > rB ? [c.a, c.b] : [c.b, c.a]; why = 'MORE REFINED'; }
      else if (c.a.res.curCE !== c.b.res.curCE) {
        [winner, loser] = c.a.res.curCE > c.b.res.curCE ? [c.a, c.b] : [c.b, c.a]; why = 'MORE CURSED ENERGY';
      } else {
        // FRACTION, NOT POINTS. Comparing raw health across two fighters with
        // different maximums was always a little unfair (Todo's 294 against
        // Nobara's 216) and Panda made it indefensible: his ACTIVE CORE tops
        // out at 160, so a full-health Panda would lose "MORE LIFE" to a
        // half-health Gojo. `clashHP` already returns his total; dividing by
        // the matching maximum is what makes the comparison mean the same
        // thing for both sides.
        const fA = clashHP(c.a) / clashMax(c.a), fB = clashHP(c.b) / clashMax(c.b);
        [winner, loser] = fA >= fB ? [c.a, c.b] : [c.b, c.a];
        why = 'MORE LIFE';
      }
    }
    this.contest = null;

    m.domainfx.clashResolve(winner === c.a);
    m.sfx.clash();
    m.cam.cinematic(c.a.pos.clone().add(c.b.pos).multiplyScalar(0.5), 2.2, 5.0, 2.1);
    m.cam.shake(1.2);
    m.cam.fovKick(12);
    m.stage.flash(0.5);
    m.hitstop(24);

    this._applyBacklash(loser);
    loser.setState('guardBreak', { clip: 'guardBreak' });
    m.hud.toast(loser, 'DOMAIN SHATTERED');
    m.hud.toast(winner, 'CLASH WON — ' + why);

    // the winner's domain is the one that rises, on a barrier worn by the clash
    this._beginDomain(winner, 75);
    return true;
  }

  // bring a domain straight to its active phase (post-clash victory)
  _beginDomain(caster, integrity = 100) {
    this.active = {
      caster, target: this.other(caster), def: caster.cfg.domain,
      phase: 'cast', castF: caster.cfg.domain.castFrames,
      timer: 0, integrity, sureT: 0
    };
    this._activate();
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt, inputs) {
    // The carried Executioner's Sword outlives every barrier, so it ticks
    // before any of the early returns below.
    this._tickSwordCarry(dt, inputs);
    if (this.contest) { this._updateContest(dt); return; }
    const a = this.active;
    if (!a) return;
    const m = this.match;

    if (a.phase === 'cast') {
      a.castF++;
      if (a.caster.state !== 'castDomain') { this._interrupted(); return; }
      if (a.castF >= a.def.castFrames) this._activate();
      return;
    }

    a.timer -= dt;
    // the barrier catches EVERY other fighter, not just the primary target
    const trapped = this.trapped(a.caster);
    a.target = this.other(a.caster) || a.target;

    // sure-hit (必中): applied directly to whoever is inside — never through
    // hitbox resolution, cannot be dodged, blocked, or missed.
    if (a.def.sureHit.effect === 'void_lock') {
      // Unlimited Void: information overload — total lockdown, no direct damage
      //
      // MAHORAGA IN SOMEONE ELSE'S DOMAIN. He adapts to domain effects, per
      // canon, and the DOMAIN category is the one that has to work without a
      // damage number attached — Unlimited Void deals none at all. So the
      // barrier itself counts as a source that has landed on him, and the
      // lockdown is what erodes. Sure-hit still HITS: a barrier is not
      // something you dodge, and it always takes hold. What adaptation buys
      // is time inside it — the lock runs on a duty cycle, and he is free for
      // a fraction of every second equal to his DOMAIN adaptation. At the
      // 88% cap Gojo holds him for roughly one second in eight.
      a.voidPhase = ((a.voidPhase ?? 0) + dt) % 1;
      for (const t of trapped) {
        // Falling Blossom answers the LOCKDOWN as well as damage: Unlimited
        // Void's sure-hit deals none at all, so "nullify the sure-hit" has to
        // mean "the lock does not take" or the counter would do nothing here.
        const blossom = blossomHolds(t);
        if (blossom) blossomCounter(m, t, a.caster);
        const prot = sdHolds(t) || t.state === 'barrierBreak' || blossom;
        const adapt = t.adapt ? (t.adapt.mark('domain'), t.adapt.reductionFor('domain')) : 0;
        // ---- HEAVENLY RESTRICTION vs UNLIMITED VOID -------------------------
        // Found by testing rather than by reasoning: with the lockdown applied
        // flatly, Toji could NEVER throw the Inverted Spear inside Unlimited
        // Void, because the void froze him on the frame it caught him. That
        // makes the roster's designated anti-domain tool useless against the
        // best domain in the game, which is exactly backwards.
        //
        // The ruling: the barrier still CATCHES him — a sure-hit is not
        // something you dodge, and he is not immune to being trapped. But the
        // void's payload is an infinite quantity of INFORMATION poured into a
        // brain through cursed energy, and he has none for it to ride. So the
        // overload only partially takes, and he is free for a fraction of every
        // second — the same duty-cycle mechanism Mahoraga's domain adaptation
        // already uses, at a fixed fraction instead of an earned one.
        //
        // At 0.34 he gets roughly one second in three: enough to walk up and
        // commit to a 24-frame technique if he reads the rhythm, nowhere near
        // enough to fight normally in there. Gojo is still overwhelmingly
        // favoured inside his own domain; Toji just is not helpless in it.
        const freeFrac = Math.max(adapt, t.noCE ? (a.def.noCEWindow ?? 0.34) : 0);
        if (freeFrac > 0 && a.voidPhase < freeFrac) {
          if (t.state === 'voided') { t.setState('idle', { clip: 'idle' }); t.domainLock = null; }
          continue;
        }
        // `offField` is in this list for the same reason the reaction states
        // are: the void cannot lock a body that is not in the room. It is the
        // ONLY change this file needed for Takaba's trapdoor and curtain — see
        // the audit on `Fighter.setOffField`.
        let interruptible = !['knockdown', 'launched', 'getup', 'ko', 'hitLight', 'hitHeavy', 'guardBreak', 'offField'].includes(t.state);
        // ...and a NO-CURSED-ENERGY fighter mid-technique is not interruptible
        // either. Second half of the fix above, and it was also found by
        // testing: the free window let Toji START the Inverted Spear inside
        // Unlimited Void, and then the very next lock tick yanked him back into
        // `voided` on frame 12 of a 24-frame startup, so the technique never
        // reached its activation frame and the counter still did not exist.
        // Once he has committed, the overload has nothing to grab.
        // Scoped to `noCE` on purpose: for everyone else the void interrupting
        // a technique is correct and unchanged.
        if (t.noCE && t.state === 'ct') interruptible = false;
        if (!prot && t.alive && interruptible && t.state !== 'voided') {
          t.setState('voided', { clip: 'stunned' });
          t.domainLock = 'voided';
        }
      }
    } else if (a.def.sureHit.effect === 'sword_rain') {
      // AML: the sure-hit lives in the blades — pickup loop, no passive tick.
      // Connection is resolved in swordHit() when a lunging slash lands.
      this.swords?.update(dt);
    } else if (a.def.sureHit.effect === 'iron_mountain') {
      // COFFIN OF THE IRON MOUNTAIN — pure attrition, the anti-Void: no stun,
      // no lockdown, just continuous unavoidable heat. The ambient tick
      // bypasses blocking entirely; burn stacks build on their own and never
      // decay while the domain holds. Magma eruptions are guaranteed hits
      // under the sure-hit rule, not dodgeable hitboxes. Only Simple Domain
      // holds the heat out. Jogo is immune and faster inside his own furnace.
      const heat = a.def.heat;
      a.caster.buffs.domainHaste = 0.2; // refreshed every tick while it holds
      a.caster.domainHasteMult = heat.casterSpeedMult;
      a.heatStackT = (a.heatStackT ?? 0) + dt;
      a.eruptT = (a.eruptT ?? heat.eruptEvery * 0.7) - dt;
      const stackNow = a.heatStackT >= heat.stackEvery;
      if (stackNow) a.heatStackT = 0;
      for (const t of trapped) {
        const blossom = blossomHolds(t);
        if (blossom && stackNow) blossomCounter(m, t, a.caster);
        const prot = sdHolds(t) || blossom;
        t.burn.noDecay = !prot;
        if (!t.alive || prot) continue;
        // ambient heat is a DOMAIN effect, not a burn stack — adaptation
        // treats the two separately and so does the fiction. It is still
        // FIRE, so Hanami's vulnerability applies to it: the Iron Mountain is
        // the worst place on the roster for a thing made of wood to be.
        t.takeChip(heat.dps * dt, 'domain', 'fire');
        // ...and the ambient heat melts Uraume's floor out from under them.
        // The Coffin is a volcano; there is no ice in it. Scaled by dt so a
        // per-frame call adds up to the same melt rate the discrete fire
        // sources produce, rather than deleting the whole arena in a frame.
        this.match.ice?.meltAt(t.pos.clone(), 2.4, dt * 1.6);
        if (stackNow) applyBurn(t, 1);
      }
      if (a.eruptT <= 0) {
        a.eruptT = heat.eruptEvery;
        for (const t of trapped) {
          // an eruption would interrupt the Barrier Break channel forever —
          // the break stays viable, so the channeler only eats ambient heat
          if (!t.alive || sdHolds(t) || t.state === 'barrierBreak' || blossomHolds(t)) continue;
          m.fx.eruptionBlast(t.pos.clone(), 1.5);
          m.sfx.erupt();
          t.applyHit({
            dmg: heat.eruptDmg, kb: 1.5, kbY: 7, hitstun: 26, type: 'launcher',
            attacker: a.caster, sureHit: true, unblockable: true, src: 'domain',
            elem: 'fire',
            dir: v3(rand(-1, 1), 0, rand(-1, 1)).normalize()
          }, m.ctxFor(a.caster));
          m.cam.shake(0.4);
        }
      }
    } else if (a.def.sureHit.effect === 'idle_death_gamble') {
      // IDLE DEATH GAMBLE — the sure-hit is the GAMBLE, not an attack. Nothing
      // is applied to the trapped fighter here and nothing needs to be: the
      // rules are written into their head, they cannot opt out and they cannot
      // leave, and the machine runs whether they like it or not. The counter
      // is not dodging, it is breaking the barrier before the fourth scenario.
      //
      // The one thing the barrier itself provides is fuel: steady CURRENT_CE
      // so Hakari can keep spending techniques into the counter. The scenarios
      // are ticked by match.gamble, because Jackpot has to outlive this block.
      const gb = a.def.gamble;
      const c = a.caster;
      if (c.backlash <= 0) {
        c.res.curCE = Math.min(c.res.maxCE, c.res.curCE + gb.casterCERegen * dt);
      }
    } else if (a.def.sureHit.effect === 'malevolent_shrine') {
      // MALEVOLENT SHRINE — the only domain in the game with no barrier AND a
      // full sure-hit. Everything it does is in _updateShrine.
      this._updateShrine(a, dt);
    } else if (a.def.sureHit.effect === 'captivating_skandha') {
      // HORIZON OF THE CAPTIVATING SKANDHA — and this branch is DELIBERATELY
      // almost empty, which is the whole point of the character.
      //
      // No damage tick. No stun. No lockdown. No gauge. The sea and the sky do
      // nothing at all, and there is no line here that could be mistaken for
      // an attrition effect. What the domain does is spawn creatures (see
      // combat/ocean.js, driven from `beginSwarm` in `_activate`), and those
      // creatures carry the sure-hit on their own strikes — through the same
      // `sureHit` flag on the same `applyHit` path every other domain payload
      // in this game uses, which is why Simple Domain, Falling Blossom, the
      // Inverted Spear and Miwa's circle all answer it without a line here
      // knowing they exist.
      //
      // The two things it DOES do are both about the caster, not the target:
      a.caster.buffs.domainHaste = 0.2;                       // refreshed each tick
      a.caster.domainHasteMult = a.def.casterSpeedMult ?? 1;  // he moves faster in it
      // ...and the one courtesy the trapped fighter gets, which is that
      // BLOSSOM AND SIMPLE DOMAIN ARE VISIBLY DOING SOMETHING. Without a tick
      // of its own the counter-tools would silently work (each shikigami's hit
      // is refused at the applyHit guard) and the player would never see why,
      // so the shroud is answered here once per second exactly as the other
      // domains answer it.
      a.blossomT = (a.blossomT ?? 0) + dt;
      if (a.blossomT >= 1) {
        a.blossomT = 0;
        for (const t of trapped) if (blossomHolds(t)) blossomCounter(m, t, a.caster);
      }
    } else if (a.def.sureHit.effect === 'warped_firmament') {
      // THE WARPED FIRMAMENT 天蓋歪曲界 — Uro. Three mechanics, and they are
      // deliberately kept apart from each other so each can be tuned or cut
      // without touching the others.
      //
      // 1. TOTAL ENVIRONMENTAL CONTROL. Caster-side only. The free/instant
      //    techniques are read in combat/fighter.js `startCT` off the same
      //    `isMyDomain` test Megumi's garden uses; the free flight is read in
      //    combat/flight.js. Nothing about them is applied to the target, so
      //    none of it belongs in this loop — all that lives here is the haste
      //    dial every other domain sets.
      a.caster.buffs.domainHaste = 0.2;
      a.caster.domainHasteMult = a.def.casterSpeedMult ?? 1;
      // ...and the bar her quarter-price techniques are spent out of. Same
      // shape as Hakari's `casterCERegen`, and gated on `backlash` for the
      // same reason his is: a caster already paying for a spent domain does
      // not also get fed by one.
      if (a.def.control?.casterCERegen && a.caster.backlash <= 0) {
        a.caster.res.curCE = Math.min(a.caster.res.maxCE,
          a.caster.res.curCE + a.def.control.casterCERegen * dt);
      }

      const sh = a.def.shatter, ds = a.def.distort;
      a.shatterT = (a.shatterT ?? sh.every * 0.55) - dt;
      const breakNow = a.shatterT <= 0;
      if (breakNow) a.shatterT = sh.every;

      // 3. SPATIAL DISTORTION — the angle is a property of the DOMAIN, not of
      //    each victim, so everyone trapped in it is turned the same way. Two
      //    people disoriented differently reads as two bugs; one turned world
      //    reads as a turned world.
      a.distortT = (a.distortT ?? 0) + dt;
      const cycle = ds.holdTime + ds.easeTime;
      const phase = a.distortT % cycle;
      const step = Math.floor(a.distortT / cycle);
      // A deterministic per-step target, so a replay and both halves of a
      // split screen agree without threading an RNG through.
      //
      // `n + 1`, NOT `n`. FOUND BY PLAYING IT: at `n` the very first step is
      // `sin(0) = 0`, so the domain opened and then did nothing at all for its
      // first 2.9 seconds — a quarter of its whole duration spent not using
      // its own signature mechanic. The offset costs nothing and guarantees
      // step 0 has a real angle.
      const targetOf = n => Math.sin((n + 1) * 12.9898) * ds.maxAngle;
      const from = step === 0 ? 0 : targetOf(step - 1);
      const to = targetOf(step);
      const k = phase < ds.easeTime ? phase / ds.easeTime : 1;
      const e = k * k * (3 - 2 * k);                 // smoothstep, never a snap
      a.distortAngle = from + (to - from) * e;
      // the interior turns WITH it — this is the tell that makes the mechanic
      // fair rather than a random handicap
      m.domainfx?.setFirmamentTwist?.(a.distortAngle);

      for (const t of trapped) {
        const blossom = blossomHolds(t);
        if (blossom && breakNow) blossomCounter(m, t, a.caster);
        const prot = sdHolds(t) || blossom;
        // The coordinate rotation is written onto the fighter and read by
        // `_moveVec`. Clearing it under protection is what makes Simple Domain
        // visibly answer this half too, rather than only the damage.
        t.coordTwist = (!t.alive || prot) ? 0 : a.distortAngle;
        if (!t.alive || prot) continue;
        // the coordinates pulling at them — small, continuous, unblockable
        t.takeChip(ds.tearDps * dt, 'domain');
        if (!breakNow) continue;
        // 2. GUARANTEED-HIT THIN ICE BREAKER. A TRUE sure-hit: `sureHit` and
        //    `unblockable` together, the same pair Jogo's eruptions use, so
        //    blocking does not soften it the way it softens Dagon's swarm.
        //    The barrier-break channel is exempt for the same reason it is
        //    exempt from the eruptions — an interrupt every 1.55 s would make
        //    the counter unusable rather than costly.
        if (t.state === 'barrierBreak') continue;
        // THE SAME REFRACTION HER RB USES — fx/warpfx.js `thinIce`, not a
        // bespoke domain visual. That is the point of the sure-hit: it is
        // literally Thin Ice Breaker, so it has to LOOK literally like Thin
        // Ice Breaker. The only difference is where it forms — the plane is
        // built on the victim and faces the caster, rather than being aimed.
        //
        // Inside the domain this reads better than it does outside, because
        // what the shards refract is the firmament interior: broken sky seen
        // through broken sky.
        const away = v3(t.pos.x - a.caster.pos.x, 0, t.pos.z - a.caster.pos.z);
        if (away.lengthSq() < 1e-4) away.set(0, 0, 1);
        m.warpfx?.thinIce(t.pos.clone().setY(1.1), away.normalize(), {
          width: 3.6, height: 3.0, shards: sh.shards, crackTime: sh.windup, life: 0.8
        });
        m.sfx.thinIce?.();
        t.applyHit({
          dmg: sh.dmg, kb: sh.kb, kbY: sh.kbY, hitstun: sh.hitstun,
          type: 'launcher', attacker: a.caster,
          sureHit: true, unblockable: true, src: 'domain',
          dir: v3(rand(-1, 1), 0, rand(-1, 1)).normalize()
        }, m.ctxFor(a.caster));
        m.cam.shake(0.3);
      }
    } else if (a.def.sureHit.effect === 'shadow_garden') {
      // CHIMERA SHADOW GARDEN — no sure-hit tick at all, and that absence IS
      // the mechanic. Nothing is applied to the trapped fighter here; what the
      // domain does is change what MEGUMI can do (free, instant, unlimited
      // summons that can erupt anywhere in the shadow, restored losses, and
      // submerged movement). The opponent's only relationship with it is
      // whether they are standing on it.
      this._updateGarden(a, dt);
    } else if (a.def.sureHit.effect === 'deadly_sentencing') {
      // DEADLY SENTENCING — the sure-hit is the SWORD, and it is applied to
      // HIGURUMA, not to the people trapped with him. Nothing at all is
      // applied to them here: no damage, no debuff, no gauge, no trial. The
      // domain's whole payload is that he is holding the Executioner's Sword
      // and has one execution to land with it. See domains/sentencing.js.
      this.sentencing?.update(dt, inputs);
    } else if (a.def.sureHit.effect === 'transfigure') {
      // SELF-EMBODIMENT OF PERFECTION — the transfiguration gauge. Full on
      // cast, drains by proximity to Mahito (nothing at range, slow at mid,
      // fast up close) and by his connected attacks (transfigChunk). Empty =
      // instant KO. If the domain expires first, nothing happens — he spent
      // his entire bar for zero. The gauge never carries between casts.
      const tf = a.def.transfig;
      if (a.tfKO) {
        this._tickTransfigKO(dt);
      } else {
        for (const t of trapped) {
          if (!t.alive) continue;
          // Simple Domain halts the drain; so does the shroud. The gauge IS
          // the sure-hit here, so nullifying the sure-hit means the gauge
          // stops moving.
          if (sdHolds(t)) continue;
          if (blossomHolds(t)) { blossomCounter(m, t, a.caster); continue; }
          // MAHITO vs MAHORAGA. Same ruling the project already applies to
          // Megumi's shikigami: a shadow construct has no soul to reshape, so
          // the gauge has nothing to bite on. Mahoraga IS one — the largest
          // one — so Idle Transfiguration simply does not apply to him. Mahito
          // still has his whole normal kit; what he does not have is the
          // instant win. Toasted once so the ruling is visible, not silent.
          if (t.cfg.soulless) {
            if (!a._soullessToast) {
              a._soullessToast = true;
              m.hud.toast(a.caster, 'NO SOUL TO RESHAPE');
            }
            continue;
          }
          const dist = flatDist(t.pos, a.caster.pos);
          const rate = dist < tf.nearR ? tf.drainNear : dist < tf.midR ? tf.drainMid : 0;
          if (rate <= 0) continue;
          const g = (a.gauges.get(t) ?? tf.gauge) - rate * dt;
          a.gauges.set(t, g);
          if (g <= 0) { this._transfigure(t); break; }
        }
      }
    }

    // While an execution duel (or the cinematic that follows it) is running,
    // NOBODY acts — not the two locked into it, and not a third party in a
    // free-for-all. Barrier Break and Simple Domain are inputs, and inputs are
    // frozen; the contest is the only thing on.
    if (!this.sentencing?.freezing) {
      for (const t of trapped) this._trappedControls(t, inputs, dt);
    }

    // once a transfiguration KO is playing out, the domain holds until it
    // lands — the gauge already emptied, nothing un-rings that bell
    if (!a.caster.alive) this._collapse(false);
    else if (a.tfKO) { /* hold */ }
    // same rule for a sentence already being carried out: the blade is
    // falling and a timer running out does not stop it
    else if (this.sentencing?.holding) { /* hold */ }
    // ENDING 2: he landed Execution and lost the duel. The barrier comes down
    // on the spot with the standard backlash — no second attempt.
    else if (this.sentencing?.requestCollapse) this._collapse(false);
    // `this.active`, not the captured `a`: a KO cinematic further up this tick
    // may already have taken the barrier down, and a domain that is gone does
    // not get to expire.
    else if (!this.active) { /* already collapsed above */ }
    else if (a.integrity <= 0) this._collapse(true);
    else if (a.timer <= 0) this._collapse(false);
  }

  _trappedControls(target, inputs, dt) {
    const m = this.match;
    const inp = inputs.get(target);
    if (!inp || !target.alive) return;
    const inVoid = this.active.def.sureHit.effect === 'void_lock';
    const special = ['voided', 'simpleDomain', 'barrierBreak'].includes(target.state);
    if (!special && !inVoid) {
      // AML: the trapped fighter acts freely — counters engage below only from neutral
      if (!['idle', 'walk', 'run', 'block'].includes(target.state)) return;
    }

    // ---- OPEN DOMAINS -------------------------------------------------------
    // Two of them now, and they need different answers, because they gave up
    // different things.
    //
    //   CHIMERA SHADOW GARDEN has no barrier AND no sure-hit. Barrier Break
    //   has nothing to chip and Simple Domain has nothing to neutralize, so
    //   forcing either would only take the opponent's normal guard away from
    //   them. Firing your own domain into it is the only counter that means
    //   anything, and the heavy pushing the shadow back is its local answer.
    //
    //   MALEVOLENT SHRINE has no barrier and KEEPS the sure-hit. So the
    //   payload counters are live — Simple Domain holds the slashes out and is
    //   the strongest defensive answer to him — while Barrier Break stays dead,
    //   because there is still no barrier to break. `openSureHit` is what
    //   tells the two apart, and `noBarrierHint` is what each one says when
    //   somebody tries the break anyway. Neither fails silently and neither
    //   throws: the input is refused with a line and the fighter keeps their
    //   guard, which is the sensible thing for LT to do.
    if (this.active.def.noBarrier) {
      const open = this.active.def;
      if (inp.block && inp.ult) {
        if (!target._noBarrierToast) {
          target._noBarrierToast = true;
          m.hud.toast(target, open.noBarrierHint || 'NO BARRIER TO BREAK');
          m.sfx.noCE();
        }
      } else target._noBarrierToast = false;
      // domain clash still applies to both
      if (inp.ultP && !inp.block && target.cfg.domain && target.ultReady && target.backlash <= 0) {
        this._clash(target);
        return;
      }
      // SIMPLE DOMAIN, but only where there is a sure-hit for it to answer
      if (open.openSureHit && inp.block && target.res.stamina > 0.5) {
        if (target.state !== 'simpleDomain') {
          target.setState('simpleDomain', { clip: 'simpleDomain' });
          m.hud.toast(target, 'SIMPLE DOMAIN');
          m.sfx.simpleDomain();
        }
        target.res.stamina = Math.max(0, target.res.stamina - target.cfg.simpleDomainDrain * dt);
        m.domainfx.simpleDome(target, dt);
        if (target.res.stamina <= 0.5) {
          target.setState('guardBreak', { clip: 'guardBreak' });
          target.emit('guardBreak');
        }
        return;
      }
      if (target.state === 'simpleDomain') target.setState('idle', { clip: 'idle' });
      return;
    }

    // BARRIER BREAK: hold LT + D-pad Right — pour CE into one point
    if (inp.block && inp.ult && target.res.curCE > 0.5) {
      if (target.state !== 'barrierBreak') {
        target.setState('barrierBreak', { clip: 'barrierBreak' });
        m.hud.toast(target, 'BARRIER BREAK');
      }
      const bb = target.cfg.barrierBreak;
      target.res.curCE = Math.max(0, target.res.curCE - bb.ceDrain * dt);
      this.active.integrity -= bb.chip * dt;
      m.domainfx.breakImpact(target);
      m.sfx.barrierChip();
      return;
    }
    // domain counter: fire your own domain into the standing one
    if (inp.ultP && !inp.block && target.cfg.domain && target.ultReady && target.backlash <= 0) {
      this._clash(target);
      return;
    }
    // SIMPLE DOMAIN: hold LT — neutralizes sure-hit at heavy stamina cost
    if (inp.block && target.res.stamina > 0.5) {
      if (target.state !== 'simpleDomain') {
        target.setState('simpleDomain', { clip: 'simpleDomain' });
        m.hud.toast(target, 'SIMPLE DOMAIN');
        m.sfx.simpleDomain();
      }
      target.res.stamina = Math.max(0, target.res.stamina - target.cfg.simpleDomainDrain * dt);
      m.domainfx.simpleDome(target, dt);
      if (target.res.stamina <= 0.5) {
        target.setState('guardBreak', { clip: 'guardBreak' });
        target.emit('guardBreak');
      }
      return;
    }
    // released the counters: back to the domain's baseline state
    if (target.state === 'simpleDomain' || target.state === 'barrierBreak') {
      target.setState(inVoid ? 'voided' : 'idle', { clip: inVoid ? 'stunned' : 'idle' });
    }
  }

  _activate() {
    const a = this.active;
    const m = this.match;
    a.phase = 'active';
    a.timer = a.def.duration;
    a.sureT = 0;
    a.caster.setState('idle', { clip: 'idle' });
    // ---- THE ESCALATION TRACK ----------------------------------------------
    // Swapped in HERE rather than at the cast, so it lands with the barrier
    // rather than under the cut-in — the 0.9 s crossfade needs somewhere to
    // breathe, and the cast already has the cinematic and the callout on it.
    // This sits at the top of `_activate`, ABOVE every per-domain branch below,
    // so the two barrierless domains (Malevolent Shrine, Chimera Shadow Garden)
    // get it too: they are still domains, and the ones you have to run from
    // deserve the music more than the ones you are merely locked inside.
    m.music?.play('domain');
    // MEGUMI: the sea of shadow starts under his feet and spreads. Its radius
    // is scaled PER MAP (arena.shadowScale) and clamped, because a number that
    // works on Shibuya's platform would swallow a school gymnasium whole and
    // vanish on the Shinjuku street. Leaving the spread is the counterplay, so
    // it must never cover the whole playspace.
    if (a.def.sureHit.effect === 'shadow_garden') {
      const sh = a.def.shadow;
      const scale = m.arena.shadowScale ?? 1;
      a.shadowOrigin = a.caster.pos.clone().setY(0);
      a.shadowTarget = Math.max(sh.minRadius, Math.min(sh.maxRadius, sh.radius * scale));
      a.shadowR = 0;
      a.spreadT = 0;
      a.dents = [];
      a.exposure = new Map();
      // anything he lost earlier is available again — but only while it holds
      a.restored = [...(m.shikigami?.lostSet(a.caster) ?? [])];
      if (a.restored.length) {
        m.hud.toast(a.caster, '影 ' + a.restored.length + ' RESTORED');
      }
    }
    // SUKUNA: the shrine comes up where he cast it and its influence spreads
    // to a PER-MAP radius. Leaving is the primary escape, so the number is
    // clamped three ways and can never cover a playfield: the map's own
    // `shrineScale`, then the move's [minRadius, maxRadius], then a hard cap
    // at `mapFraction` of that map's radius — which is the belt that means a
    // map added later cannot accidentally be swallowed by a number nobody
    // re-checked for it.
    if (a.def.sureHit.effect === 'malevolent_shrine') {
      const sh = a.def.shrine;
      const scale = m.arena.shrineScale ?? 1;
      const wanted = Math.max(sh.minRadius, Math.min(sh.maxRadius, sh.radius * scale));
      const cap = (m.arena.radius ?? 30) * (sh.mapFraction ?? 0.55);
      a.shrineTarget = Math.min(wanted, cap);
      a.shrineOrigin = a.caster.pos.clone().setY(0);
      a.shrineR = 0;
      a.openT = 0;
      a.slashT = sh.interval * 0.4;
      a.cutT = 0;
      // the environment is built to the SAME radius the gameplay uses, so the
      // architecture and the kill zone are the same circle
      m.domainfx.shrineRadius = a.shrineTarget;
      m.hud.toast(a.caster, '伏魔御廚子 · RADIUS ' + a.shrineTarget.toFixed(0) + 'm');
      m.hud.message('NO BARRIER — RUN', 2.2);
    }
    // Mahito: every trapped fighter gets a full transfiguration gauge
    if (a.def.sureHit.effect === 'transfigure') {
      a.gauges = new Map();
      for (const t of this.trapped(a.caster)) a.gauges.set(t, a.def.transfig.gauge);
      a.tfKO = null;
    }
    // AML: the formation volley — katanas rain down, Yuta starts unarmed with
    // weakened punches; every roll comes from one seeded stream
    if (a.def.sureHit.effect === 'sword_rain') {
      // The caster's own seeded stream picks the seed when there is no forced
      // one, so the volley rolls identically on every client in an online
      // match. F6's `nextSwordSeed` override still wins.
      const seed = this.nextSwordSeed
        ?? (((a.caster.rng ? a.caster.rng() : Math.random()) * 0x7fffffff) | 0);
      this.nextSwordSeed = null;
      this.swordRoll = { seed, rng: mulberry32(seed), last: null };
      this.swords = new SwordRain(m, a.caster, a.def.swords, this.swordRoll.rng);
      a.caster.heldSword = false;
      a.caster.punchDmgMult = a.def.swords.unarmedPunchMult ?? 0.5;
      m.hud.toast(a.caster, '刀雨 SWORD VOLLEY');
    }
    // ---- DAGON: DEATH SWARM 死累累湧軍 ------------------------------------
    // The domain's whole payload, handed to the ocean system on the frame the
    // barrier resolves. Nothing is applied to the trapped fighter HERE and
    // nothing ever will be: this is the only domain in the game with no
    // ambient effect of its own, and every point of damage in it comes out of
    // a creature that can be killed. See the `captivating_skandha` branch in
    // `update` for the (deliberately near-empty) per-tick.
    if (a.def.sureHit.effect === 'captivating_skandha') {
      m.ocean?.beginSwarm(a.caster, a.def);
      a.caster.model.setSeal?.(true);
      // He is faster inside his own domain — the SAME `domainHaste` dial
      // Jogo's furnace already uses, so this needed nothing new.
      a.caster.buffs.domainHaste = 0.2;
      a.caster.domainHasteMult = a.def.casterSpeedMult ?? 1;
      m.hud.toast(a.caster, '死累累湧軍 — DEATH SWARM');
    }
    // ---- URO: THE WARPED FIRMAMENT 天蓋歪曲界 ------------------------------
    // Everything the domain does to the trapped fighter is per-tick, so this
    // only opens the caster's half of it and announces the thing the player
    // most needs to know, which is that the ground they are standing on has
    // stopped agreeing with their stick.
    if (a.def.sureHit.effect === 'warped_firmament') {
      a.caster.buffs.domainHaste = 0.2;
      a.caster.domainHasteMult = a.def.casterSpeedMult ?? 1;
      a.distortT = 0;
      a.distortAngle = 0;
      m.hud.toast(a.caster, '天蓋歪曲界 — THE WARPED FIRMAMENT');
    }
    // IDG: hand the machine over to the gamble system, which owns everything
    // from here — including the part that outlives this barrier.
    if (a.def.sureHit.effect === 'idle_death_gamble') m.gamble?.beginDomain(a.caster);
    // DEADLY SENTENCING: the sword is granted here and NOTHING is applied to
    // anyone else. The manager owns the sword, the duel and all three endings.
    //
    // A NEW COURTROOM SUPERSEDES A CARRIED BLADE. He can now open a second
    // courtroom while still holding the sword he won out of the first, and
    // `swordMgrFor` checks the carry slot before the live one — so without
    // this the new trial would hand its sword to a manager that is not the one
    // running, and the fresh execution attempt would be spent already.
    if (a.def.sureHit.effect === 'deadly_sentencing') {
      this.clearSwordCarry();
      this.sentencing = new Sentencing(m, a.caster, a.def.sentencing);
    }
    this._applyPlayspace(a);
    m.domainfx.show(a.def.env, a.caster);
    m.stage.setGrade(a.def.env); // grade names mirror env names
    m.sfx.domainActivate(a.def.env);
    m.hud.toast(a.caster, a.def.name);
  }

  // ---- the inner world's playable floor -----------------------------------
  // Most domains replace the arena with an empty plane, so the arena's own
  // radius still describes the space. Hakari's does not: his parlor has banks
  // of machines standing where the outdoor floor was walkable, and anyone who
  // happened to be near the arena edge when the barrier closed was left
  // standing inside a cabinet. `playRadius` declares the clear floor; everyone
  // outside it is pulled in, and the clamp holds them there until it collapses.
  _applyPlayspace(a) {
    const r = a.def.playRadius;
    if (!r) return;
    for (const f of this.match.fighters) {
      if (!f.alive) continue;
      f.domainRadius = r;
      const d = Math.hypot(f.pos.x, f.pos.z);
      if (d > r * 0.92) {
        // pull them to a comfortable ring rather than exactly onto the edge
        const s = (r * 0.72) / (d || 1);
        f.pos.x *= s; f.pos.z *= s;
        f.prevPos.copy(f.pos);   // no interpolation streak across the move
        f.vel.set(0, 0, 0);
      }
    }
  }

  _clearPlayspace() {
    for (const f of this.match.fighters) f.domainRadius = null;
  }

  // ---- Mahito: the transfiguration gauge ----------------------------------
  // Every attack Mahito connects inside his own domain chips the gauge
  // directly. Called from the melee pipeline and his technique effects.
  // kind: 'punch' | 'heavy' | 'soulTouch' | 'bodyWeapon' | 'minion'
  transfigChunk(caster, target, kind, blocked) {
    const a = this.active;
    if (!a || a.phase !== 'active' || a.caster !== caster || !a.gauges || a.tfKO) return;
    if (a.def.sureHit.effect !== 'transfigure' || !target || target === caster) return;
    if (sdHolds(target) || blossomHolds(target)) return;
    const tf = a.def.transfig;
    let v = kind === 'minion'
      ? tf.chunkPunch * tf.minionMult
      : { punch: tf.chunkPunch, heavy: tf.chunkHeavy, soulTouch: tf.chunkSoulTouch, bodyWeapon: tf.chunkBodyWeapon }[kind] ?? tf.chunkPunch;
    // blocking can't stop a sure-hit, but a blocked hit chips less — defense
    // is rewarded partially without defeating the mechanic
    if (blocked) v *= tf.blockedMult;
    const g = (a.gauges.get(target) ?? tf.gauge) - v;
    a.gauges.set(target, g);
    this.match.fx._ring(target.pos.clone().add(v3(0, 1.5, 0)), 0x8b9bab,
      { size: 0.3, growRate: 5, life: 0.25, flat: false });
    if (g <= 0) this._transfigure(target);
  }

  // the gauge emptied: IDLE TRANSFIGURATION — instant KO, presented as the
  // win condition it is (camera takeover, music cut, the transformation plays)
  _transfigure(victim) {
    const a = this.active;
    if (a.tfKO) return;
    const m = this.match;
    // SHARED INSTANT-KO CATEGORY. Transfiguration and Higuruma's Execution are
    // the same kind of thing — a kill that ignores the health bar — so both
    // ask the same gate here, at COMMIT time rather than at the end of the
    // cinematic (a transformation that plays out and then does not take would
    // read as a bug).
    //
    // Nothing about Mahito's behaviour changes. The only fighter on the roster
    // carrying an `adapt` is Mahoraga, and he is `soulless`, so the branch
    // above has already refused the gauge on him before this line is ever
    // reached — the resist roll is unreachable for transfiguration by
    // construction. What the routing buys is the Jackpot ruling (an instant KO
    // is not damage, so RCT cannot heal out of it) applying to both, from one
    // place, and any future instant KO getting all of it for free.
    const verdict = commitInstantKO(victim, { kind: 'transfigure', needsSoul: true });
    if (!verdict.ok) {
      if (!a._koRefusedToast) {
        a._koRefusedToast = true;
        m.hud.toast(a.caster, verdict.label);
      }
      // the gauge is spent either way — it does not refill and it does not
      // get to empty a second time
      a.gauges.set(victim, a.def.transfig.gauge);
      return;
    }
    a.tfKO = { victim, t: a.def.transfig.koCinematic, fxT: 0 };
    victim.setState('transfigured', { clip: 'transfigured' });
    victim.vel.set(0, 0, 0);
    victim.activeHit = null;
    victim.move = null;
    victim.domainLock = 'transfigured';
    m.hud.cutin(a.caster, 'IDLE TRANSFIGURATION', '遍殺即霊体 — SOUL RESHAPED');
    m.hud.message('TRANSFIGURED', 2.0);
    m.music?.duck(0.05, a.def.transfig.koCinematic + 1.5);
    m.sfx.transfigure();
    m.cam.cinematic(victim.pos, a.def.transfig.koCinematic, 2.6, 1.5);
    m.slowmo(a.def.transfig.koCinematic * 0.6, 0.35);
    m.stage.flash(0.4);
    m.hitstop(10);
  }

  _tickTransfigKO(dt) {
    const a = this.active;
    const m = this.match;
    const ko = a.tfKO;
    ko.t -= dt;
    ko.fxT -= dt;
    // the transformation is inviolable: stray hits can't knock the victim out
    // of the cinematic (or worse, let them act again mid-transfiguration)
    ko.victim.iFrames = Math.max(ko.victim.iFrames, 4);
    ko.victim.vel.set(0, 0, 0);
    if (ko.victim.state !== 'transfigured') {
      ko.victim.setState('transfigured', { clip: 'transfigured' });
    }
    if (ko.fxT <= 0) {
      // the body warping: grey-blue soul matter boiling off the victim
      ko.fxT = 0.06;
      const p = ko.victim.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.3, 1.7), rand(-0.4, 0.4)));
      m.fx._spawn(p, {
        color: Math.random() < 0.4 ? 0xdfe6ee : 0x8b9bab, size: rand(0.12, 0.34),
        life: rand(0.3, 0.6), vel: v3(rand(-1.5, 1.5), rand(0.5, 3), rand(-1.5, 1.5))
      });
      if (Math.random() < 0.3) m.fx._ring(ko.victim.pos.clone().add(v3(0, 1.1, 0)), 0x8b9bab,
        { size: rand(0.3, 0.6), growRate: 3, life: 0.4, flat: false });
    }
    if (ko.t <= 0) {
      // the transformation completes: the round is over. Routed through the
      // shared category rather than writing hp directly, so the kill is
      // recorded and healing cannot argue with it.
      finishInstantKO(ko.victim, { kind: 'transfigure', by: a.caster });
      ko.victim.domainLock = null;
      m.stage.flash(0.7);
      m.cam.shake(0.8);
      a.tfKO = null;
      this._collapse(false);
    }
  }

  _applyBacklash(f) {
    const bl = (f.cfg.domain && f.cfg.domain.backlash) || { duration: 8, growthMult: 0.5 };
    f.backlash = bl.duration;
    f.backlashGrowthMult = bl.growthMult ?? 0.5;
  }

  _interrupted() {
    const m = this.match;
    const a = this.active;
    m.hud.toast(a.caster, 'DOMAIN INTERRUPTED');
    m.sfx.domainFail();
    // An interrupted CAST never reached `_activate`, so it never started the
    // domain track — but a clash can route a live domain through here, so this
    // is a cheap no-op in the common case and the correct restore in the rare
    // one. `play` ignores a request for the track already playing.
    if (m.phase === 'fight') m.music?.play('fight');
    a.caster.backlash = 4;
    m.gamble?.endDomain(true);
    this._clearSwordPayload();
    this._clearSentencing();
    m.domainfx.hide();
    this.active = null;
  }

  _collapse(broken) {
    const m = this.match;
    const a = this.active;
    // A cinematic that owns the barrier can bring it down ITSELF and then fall
    // through to the end-of-tick checks below with a stale local reference —
    // Mahito's transfiguration does exactly this whenever the KO sequence
    // outlives the domain's own timer (gauge empties late, the 2 s
    // transformation holds the barrier past 7 s, and the frame it finishes on
    // sees `timer <= 0` and collapses a second time). Second call is a no-op.
    if (!a) return;
    this._applyBacklash(a.caster);
    // The gamble dies with the barrier — counter, failure count, the scenario
    // mid-spin, all of it. JACKPOT does not: if it is already live it keeps
    // its own 99-second clock running straight through this.
    m.gamble?.endDomain(broken);
    this._clearSwordPayload();
    // ENDING 3 (and the teardown for 1 and 2). Whatever brought the barrier
    // down — the timer running out, a Barrier Break, a clash, a dismissal, or
    // one of the two duel resolutions — the Executioner's Sword goes with it.
    this._clearSentencing();
    // heat and haste do not outlive the barrier. The one-shot "there is no
    // barrier to break" hint is cleared for EVERY fighter here rather than in
    // the two open-domain branches below: domains are re-castable, so a player
    // who tries the break against a second shrine should be told again.
    for (const f of m.fighters) { f.burn.noDecay = false; f._noBarrierToast = false; f._blossomToast = false; }
    a.caster.buffs.domainHaste = 0;
    // ---- DAGON: EVERYTHING THE BARRIER WAS MAKING STOPS EXISTING ----------
    // The shikigami are the domain's SURE-HIT PAYLOAD, not summons he paid for
    // separately — so when the barrier stops existing, so does what it was
    // producing. Every creature on the field dies on the spot, whichever of
    // the five exits brought the barrier down: the timer, a Barrier Break, a
    // domain clash lost, Toji's Inverted Spear, or the caster being killed.
    //
    // That ruling is what makes the anti-domain tools MEAN anything against
    // him. If breaking the barrier left twenty sharks standing, breaking the
    // barrier would not be a counter to this character — it would be a
    // formality he had already been paid for. See the audit in the delivery
    // report; all four counters route through this line.
    //
    // Note what SURVIVES: anything he put out with his SPECIAL before casting.
    // That body is his, he paid cursed energy for it, and the barrier had
    // nothing to do with it — `endSwarm` only kills creatures flagged `domain`.
    if (a.def.sureHit.effect === 'captivating_skandha') {
      const stats = m.ocean?.endSwarm({ kill: true });
      a.caster.model.setSeal?.(false);
      if (stats && import.meta.env?.DEV) {
        console.info('[skandha] spawned', stats.spawned, 'culled', stats.culled, 'peak slots', stats.peakSlots);
      }
    }
    // MEGUMI: the restored shikigami were on loan. Anything on the field whose
    // key is still in the loss ledger goes back down with the shadow — it was
    // only ever standing because the domain was.
    if (a.def.sureHit.effect === 'shadow_garden' && m.shikigami) {
      const lost = m.shikigami.lostSet(a.caster);
      for (const s of m.shikigami.list) {
        if (s.owner === a.caster && s.alive && lost.has(s.key)) s.die(false);
      }
      a.caster.shadowDash = false;
      for (const f of m.fighters) f._noBarrierToast = false;
      if (a.restored?.length) m.hud.toast(a.caster, 'THE SHADOW RECEDES');
    }
    // SUKUNA: the shrine goes and takes its radius with it. Nothing lingers —
    // there is no equivalent of Unlimited Void's after-debuff here, because
    // twenty seconds of unavoidable cutting was the effect.
    if (a.def.sureHit.effect === 'malevolent_shrine') {
      for (const f of m.fighters) { f._noBarrierToast = false; }
      m.hud.toast(a.caster, 'THE SHRINE FALLS');
    }
    // URO: give everyone their coordinates back. This MUST be unconditional
    // over all fighters rather than over `trapped`, and must not depend on the
    // domain ending cleanly: a fighter who walked out of the barrier, or who
    // was protected on the last tick, or who died in there, still has a stale
    // `coordTwist` written on them, and a rotated stick that outlives the
    // domain is the worst bug this mechanic could possibly have.
    if (a.def.sureHit.effect === 'warped_firmament') {
      for (const f of m.fighters) f.coordTwist = 0;
      m.domainfx?.setFirmamentTwist?.(0);
    }
    // release every trapped fighter: void lock + lingering neurological debuff
    for (const t of this.trapped(a.caster)) {
      if (['voided', 'simpleDomain', 'barrierBreak', 'transfigured'].includes(t.state)) {
        t.setState(t.alive ? 'idle' : 'ko', { clip: t.alive ? 'idle' : 'ko' });
      }
      if (a.def.sureHit.effect === 'void_lock' && t.alive) {
        t.domainLock = null;
        if (a.def.afterDebuff) t.buffs.voidDebuff = a.def.afterDebuff.duration;
      }
    }
    this._clearPlayspace();
    m.domainfx.hide(broken);
    m.stage.setGrade(m.mapGrade || 'neutral');
    // ...unless Jackpot is still running, in which case the gold grade is not
    // the domain's, it is his, and it goes with him out of the wreckage.
    if (m.gamble?.jackpotFighter) m.stage.setGrade('jackpot');
    m.sfx.domainEnd(broken);
    // Back to the neutral fight track — INCLUDING when the barrier came down
    // because its caster just died. That case looks like it wants the opposite
    // (why start a fight loop under a KO?) and it does not: `_nextRound` never
    // touches the music, so a domain track left running here would still be
    // playing when the next round starts, over a fight with no domain in it.
    // The KO is already ducked to 0.3 for ~3 s by match.js, so the swap happens
    // underneath that and is inaudible; what it buys is a correct round two.
    //
    // The phase guard is only for teardown paths (quit to menu, match over),
    // where the menu track has its own opinion and should keep it.
    if (m.phase === 'fight' || m.phase === 'ko') m.music?.play('fight');
    m.hud.toast(a.caster, broken ? 'BARRIER BROKEN' : 'DOMAIN COLLAPSED');
    if (broken) { m.cam.shake(0.7); m.stage.flash(0.6); }
    this.active = null;
  }

  // =========================================================================
  // THE INVERTED SPEAR OF HEAVEN 天逆鉾 — FORCED CANCELLATION 強制解除
  // =========================================================================
  // "Upon contact with the Inverted Spear of Heaven's blade, any active cursed
  // technique is immediately nullified. Even powerful cursed techniques like
  // the Limitless can be completely invalidated by this weapon."
  //
  // WHY IT LIVES HERE rather than in the effect dispatcher: cancelling a
  // domain is not "collapse it early". A collapsed domain still ran, still
  // pays its backlash and, for two of them, still leaves something behind. A
  // NULLIFIED one was invalidated — so this walks the same teardown the
  // lifecycle already owns and then makes three deliberate rulings on top.
  //
  // THE THREE RULINGS
  //   1. THE BARRIER GOES, WHATEVER IT IS. Every domain in the game routes
  //      through `_collapse`, including the two barrierless ones, so this
  //      works against Malevolent Shrine and Chimera Shadow Garden without a
  //      special case. Being open does not make a domain immune to having its
  //      technique cancelled — the shrine has no barrier, but it is still a
  //      cursed technique, and that is what the spear cancels.
  //   2. THE CASTER STILL PAYS. Backlash is charged (via `_collapse`) and the
  //      bar is already gone. Getting your domain cancelled is a disaster, not
  //      a refund — otherwise the counterplay would be to bait the spear.
  //   3. A DOMAIN BEING CAST IS ALSO CANCELLED. The cast phase is the most
  //      punishable window in the game and the spear is precisely the tool for
  //      it, so a spear into `castDomain` eats the whole thing. That routes
  //      through `_interrupted`, which charges the shorter 4-second backlash —
  //      the same price any other interruption pays.
  //
  // Returns a report the caller turns into the on-screen callout, so the
  // player is always told which of the three things just happened.
  nullify(target, by) {
    const m = this.match;
    const a = this.active;
    const out = { cancelled: false, stripped: 0, label: '強制解除 — NOTHING TO CANCEL' };

    // ---- 1/3: a domain this target owns -----------------------------------
    if (a && a.caster === target) {
      const name = a.def.name;
      if (a.phase === 'cast') {
        this._interrupted();
        out.cancelled = true;
        out.label = '強制解除 — ' + name + ' CANCELLED MID-CAST';
      } else {
        // NOT `_collapse(true)`: a broken barrier is a barrier that lost a
        // fight with a Barrier Break, and the two should not read the same on
        // screen or in telemetry. This was invalidated.
        this._collapse(false);
        out.cancelled = true;
        out.label = '強制解除 — ' + name + ' NULLIFIED';
      }
      m.hud.toast(target, 'DOMAIN NULLIFIED');
    }

    // ---- 2/3: strip active technique buffs ---------------------------------
    // Everything here is a CURSED TECHNIQUE being sustained on the body. What
    // is deliberately NOT stripped: burn stacks and Soul Wound (those are
    // wounds already inflicted, not techniques still running), the Black Flash
    // chain (a combo counter, not a buff), and stamina.
    const b = target.buffs;
    for (const k of ['overtime', 'resolve', 'domainHaste', 'voidDebuff']) {
      if (b[k] > 0) { b[k] = 0; out.stripped++; }
    }
    if (b.overheat > 0) { b.overheat = 0; target.model.setOverheat?.(false); out.stripped++; }
    // SUKUNA'S MANIFESTATION is a technique sustaining a transformation, so it
    // goes — and it goes WITHOUT the recoil damage the natural expiry charges,
    // because the spear ended it rather than the clock running out.
    if (b.sukuna > 0) { b.sukuna = 0; target.model.setSukuna?.(false); target.emit('sukunaEnd'); out.stripped++; }
    // ---- THE TWO WITH NO DOMAIN, PART TWO ---------------------------------
    // Neither Choso nor Nobara has a Domain Expansion either, so branch 1
    // above can never fire against them and the spear has to find something
    // else to cancel or it does nothing to two more of the roster.
    //
    // CHOSO: FLOWING RED SCALE is a cursed technique being SUSTAINED on the
    // body — a man actively boiling his own circulation — which is precisely
    // the thing the spear takes. It goes, and it goes with no recoil for the
    // same reason Sukuna's does. What is deliberately NOT taken is the BLOOD
    // GAUGE: that is a property of a Death Painting Womb's body, already made
    // and already his, and a spear that emptied it would be draining a man
    // rather than cancelling a technique. Same ruling Gluttony already gets.
    //
    // NOBARA: her ESSENCE is likewise untouched — it is not a technique she is
    // running, it is a piece of the OPPONENT that she is holding, and there is
    // nothing active about it to force-release. What the spear does do to her
    // is the ct1/ct2 seal, which is far from nothing: with RT sealed she
    // cannot spend the meter for the duration, and a Nobara who cannot cash
    // Resonance is a Nobara with short arms and 92 health. The Black Flash
    // damage window survives for the same reason the Flash CHAIN does — it is
    // a record of a blow that already landed, not a technique still running.
    if (b.redScale > 0) {
      b.redScale = 0;
      target.model.setRedScale?.(false);
      target.emit('redScaleEnd');
      out.stripped++;
      m.hud.toast(target, '赤鱗躍動 CANCELLED');
    }
    // FALLING BLOSSOM EMOTION is itself a cursed-energy shroud, so the spear
    // takes it off — which is the one clean answer to the roster's universal
    // domain counter, and a nice symmetry.
    if (target.blossomT > 0) { target.blossomT = 0; out.stripped++; }
    // Higuruma's carried Executioner's Sword is a domain construct that has
    // outlived its barrier. It is still the technique, so it still goes.
    if (this.swordCarry && this.swordCarry.caster === target) {
      this.clearSwordCarry();
      out.stripped++;
    }
    // ---- THE TWO SPIRITS WITH NO DOMAIN TO CANCEL --------------------------
    // Neither Hanami nor Kurourushi has a Domain Expansion, so branch 1 above
    // can never fire against either of them — which would have left the spear
    // doing literally nothing to two of the roster, and "nothing" is not a
    // sensible answer for a technique whose whole job is forced cancellation.
    //
    // HANAMI: it kills the Cursed Bud he is feeding and tears down every Root
    // Field he is holding up. Both are cursed energy being SUSTAINED — a
    // parasite living on a body and a forest standing in concrete — so both
    // are exactly what the spear takes. The ground his WOODEN BALL made is
    // deliberately out of reach; that technique already went off and was paid
    // for, and what is left is a consequence rather than a technique still
    // running. Same ruling as Jackpot, for the same reason.
    //
    // KUROURUSHI: it ends a running INFESTATION and disperses the swarm on the
    // field. It does NOT touch Gluttony or take a growth stage back: those are
    // properties of his BODY, bought and already digested, and a spear that
    // could shrink him would be un-eating a meal rather than cancelling a
    // technique.
    const fl = m.flora?.nullify(target) ?? 0;
    if (fl) {
      out.stripped += fl;
      m.hud.toast(target, '花畑 TORN DOWN');
    }
    if (m.swarms?.infest && m.swarms.infest.owner === target) {
      m.swarms.infest = null;
      m.swarms.roaches.length = 0;
      out.stripped++;
      m.hud.toast(target, 'THE SWARM SCATTERS');
    }
    if (out.stripped && !out.cancelled) {
      out.label = '強制解除 — ' + out.stripped + ' TECHNIQUE' + (out.stripped > 1 ? 'S' : '') + ' STRIPPED';
      m.hud.toast(target, 'TECHNIQUE NULLIFIED');
    }
    // ---- JACKPOT IS EXPLICITLY OUT OF REACH --------------------------------
    // The biggest call in this feature, so it is written down rather than left
    // to fall out of the fact that nothing above happens to touch `f.jackpot`.
    //
    // THE RULING: the Inverted Spear CANNOT nullify a Jackpot in progress.
    //
    // WHY. The spear performs a "forced cancellation" of an ACTIVE cursed
    // technique — it stops something currently being sustained. Jackpot is not
    // that. It is a RESULT that has already been paid out: the machine already
    // spun, the gamble already resolved, and the parlor that produced it has
    // already come down on its own (`collapseForJackpot`). There is no
    // technique still running for the blade to make contact with. Cancelling it
    // would not be stopping a technique, it would be un-winning a coin flip
    // that has already landed.
    //
    // The mechanical argument agrees with the fictional one, which is usually
    // how you know a ruling is right. Jackpot is the entire payoff for the
    // longest, highest-variance setup in the game. Letting a 24-frame poke
    // delete 99 seconds of payout would not make the matchup skilful, it would
    // make it unplayable — Hakari would simply never be allowed to have his
    // character.
    //
    // WHAT TOJI GETS INSTEAD, and it is not nothing: he can nullify IDLE DEATH
    // GAMBLE ITSELF, before the payout. That is the domain branch at the top of
    // this method, and it is the real counterplay — break the parlor while the
    // machine is still spinning and there is no Jackpot to argue about. Miss
    // that window and he survives the 99 seconds like everyone else, on the
    // fastest legs and deepest stamina in the game, which is fair to ask.
    if (target.jackpot && target.jackpot.t > 0) {
      out.jackpotRefused = true;
      out.label = '強制解除 — 大当り CANNOT BE CANCELLED';
      if (by) m.hud.toast(by, 'JACKPOT ALREADY PAID');
    }
    // ---- 3/3: the seal is applied by the caller (fighter.ctSealT), because
    // it is a property of the WEAPON's tuning rather than of the domain system.
    return out;
  }

  // HAKARI HITS JACKPOT. The parlor has done the only job it had, so the
  // barrier comes down on the spot and he walks out of the wreckage still in
  // Jackpot — that state was never barrier-scoped (see domains/jackpot.js).
  collapseForJackpot(f) {
    const a = this.active;
    if (!a || a.caster !== f || a.phase !== 'active') return false;
    this._collapse(false);
    // The domain backlash is NOT also charged. Jackpot's own comedown (MAX_CE
    // wiped, zero regen and zero growth for twelve seconds) is the price, and
    // stacking the barrier's on top would starve him of cursed energy through
    // the entire window he just won.
    f.backlash = 0;
    f.backlashGrowthMult = 1;
    return true;
  }

  // ---- HIGURUMA: the trial, and the sword that outlives it ----------------
  // The sword's two moves are gated on this. Since the blade is now WON out of
  // the trial and kept after the barrier falls, the manager may live in either
  // of two slots — inside the standing courtroom, or in the carry slot after
  // it. `swordMgrFor` is the single answer to "does this fighter have it".
  swordMgrFor(f) {
    if (this.swordCarry && !this.swordCarry.expired && this.swordCarry.caster === f) return this.swordCarry;
    const s = this.sentencing;
    if (s && s.caster === f && s.swordEarned) return s;
    return null;
  }
  isSentencingField(f) { return !!this.swordMgrFor(f); }
  // ONE ATTEMPT: once the thrust has connected this is false for the rest of
  // the sword's life, whichever way the duel went.
  canExecute(f) {
    const s = this.swordMgrFor(f);
    return !!s && !s.spent;
  }
  // The connect window in the effect dispatcher hands off here.
  executionHit(caster, victim) {
    const s = this.swordMgrFor(caster);
    if (!s || s.spent) return false;
    return s.executionConnect(victim);
  }
  // The active manager for HUD/AI purposes: the courtroom's, else the carried
  // one. Only one of the two can exist at a time.
  get sentencingMgr() {
    if (this.sentencing) return this.sentencing;
    return this.swordCarry && !this.swordCarry.expired ? this.swordCarry : null;
  }
  // Read by the HUD (the full-screen prompt display) and by the CPU.
  get duelState() { return this.sentencingMgr?.hudState() ?? null; }
  // The plea round, for the HUD and the bot.
  get trialState() { return this.sentencing?.trialState?.() ?? null; }
  // Read by anything that must not fire while a duel or a plea is resolving —
  // Todo's Boogie Woogie above all.
  get duelFreeze() { return !!this.sentencingMgr?.freezing; }

  // Called on collapse. If the sword was EARNED it is not barrier-scoped: hand
  // the manager to the carry slot, which is ticked outside the domain, instead
  // of disposing it and taking the blade back off him at the moment he won it.
  _clearSentencing() {
    if (!this.sentencing) return;
    const s = this.sentencing;
    this.sentencing = null;
    if (s.swordEarned && s.caster.alive) {
      this.swordCarry?.dispose();
      this.swordCarry = s;
      s.beginCarry();
      return;
    }
    s.dispose();
  }

  _tickSwordCarry(dt, inputs) {
    const s = this.swordCarry;
    if (!s) return;
    s.update(dt, inputs);
    // OUT HERE, `requestCollapse` MEANS "THIS MANAGER IS FINISHED".
    // There is no barrier left to bring down, and the first pass read that as
    // "so there is nothing to do" and simply ate the flag. But the manager
    // raises it for exactly two reasons, and both of them are the END of the
    // one execution attempt: the duel was lost (`_escape`) or the sentence was
    // carried out (`_tickKill`). Swallowing it meant `dispose()` never ran, so
    // the victim stayed parked in the logic-less `sentenced` state and
    // Higuruma in `executing` — both frozen for the rest of the round, with
    // the execution cinematic still orbiting. Expire it instead, and the
    // teardown below does the release.
    if (s.requestCollapse) { s.requestCollapse = false; s.expired = true; }
    if (s.expired) { s.dispose(); this.swordCarry = null; }
  }

  clearSwordCarry() {
    if (!this.swordCarry) return;
    this.swordCarry.dispose();
    this.swordCarry = null;
  }

  // ---- Yuta inside Authentic Mutual Love ---------------------------------
  isSwordField(f) {
    return !!this.active && this.active.phase === 'active'
      && this.active.def.env === 'swordfield' && this.active.caster === f;
  }

  // A lunging slash CONNECTED: this is the sure-hit moment. The blade is
  // consumed, one technique rolls off the weighted table, and after the
  // hit → reveal → payoff beat it applies in full — unblockable. The only
  // out that works here is Simple Domain (barrier break and the clash are
  // handled by the standing framework above).
  swordHit(caster) {
    const a = this.active;
    if (!a || a.caster !== caster || a.phase !== 'active' || !this.swords) return;
    const m = this.match;
    const target = a.target;
    const sw = a.def.swords;

    // the sword shatters and is consumed — hit or negated, it's spent
    caster.heldSword = false;
    const hand = caster.pos.clone().add(caster.forward().multiplyScalar(0.8)).setY(1.2);
    for (let i = 0; i < 10; i++) {
      m.fx._spawn(hand, {
        color: i % 2 ? 0x9ff5c9 : 0xd8e4ff, size: rand(0.1, 0.26), life: 0.35,
        vel: caster.forward().multiplyScalar(2).add(v3(rand(-3, 3), rand(0, 4), rand(-3, 3)))
      });
    }
    m.sfx.swordShatter();

    if (!target.alive) return;
    if (sdHolds(target)) {
      m.hud.toast(target, 'SIMPLE DOMAIN HOLDS');
      return;
    }
    // the roll never happens: the shroud nullifies the connection itself
    if (blossomHolds(target)) { blossomCounter(m, target, caster); return; }

    // stagger the target through the reveal — the rolled technique is the payoff
    target.applyHit({
      dmg: sw.staggerDmg ?? 3, kb: 1.4, kbY: 0, hitstun: 32, type: 'heavy',
      attacker: caster, sureHit: true, unblockable: true, otgOk: true,
      src: 'domain', dir: caster.forward()
    }, m.ctxFor(caster));
    m.fx.hitSpark(target.pos.clone().add(v3(0, 1.25, 0)), 'heavy');
    m.sfx.hit(true);

    const entry = this._rollSwordTech();
    m.hud.techFlash(entry.name, entry.color);
    m.hud.toast(caster, '必中 SURE-HIT');
    m.sfx.techReveal(entry.tone);
    m.hitstop(10);
    m.slowmo(0.55, 0.35);
    m.effects.queueSwordPayoff(caster, entry, 0.32);
  }

  // weighted roll off the seeded stream; never the same result twice in a row
  _rollSwordTech() {
    const table = this.active.def.swords.table;
    const roll = this.swordRoll;
    if (this.forcedRoll) {
      const forced = table.find(e => e.key === this.forcedRoll);
      if (forced) { roll.last = forced.key; return forced; }
    }
    const pool = table.length > 1 ? table.filter(e => e.key !== roll.last) : table;
    const entry = weightedPick(pool, roll.rng);
    roll.last = entry.key;
    return entry;
  }

  // debug (F6): cycle the forced roll through OFF -> each table entry
  cycleForcedRoll() {
    const f = this.match.fighters.find(f => f.cfg.domain?.swords);
    if (!f) return;
    const keys = [null, ...f.cfg.domain.swords.table.map(e => e.key)];
    this.forcedRoll = keys[(keys.indexOf(this.forcedRoll) + 1) % keys.length];
    this.match.hud.message(this.forcedRoll ? 'FORCE ROLL: ' + this.forcedRoll.toUpperCase() : 'FORCE ROLL: OFF', 0.8);
  }

  swordDebug() {
    const f = this.match.fighters.find(f => f.cfg.domain?.swords);
    if (!f) return null;
    return {
      live: !!this.swords,
      remaining: this.swords ? this.swords.remaining : 0,
      falling: !!this.swords?.falling,
      carried: f.heldSword,
      last: this.swordRoll?.last,
      seed: this.swordRoll?.seed,
      forced: this.forcedRoll,
      weights: f.cfg.domain.swords.table.map(e => `${e.key}:${e.weight}`).join(' ')
    };
  }

  // tear down everything sword-domain-scoped (collapse, interrupt, clash lock)
  _clearSwordPayload() {
    if (this.swords) { this.swords.dispose(true); this.swords = null; }
    for (const f of this.match.fighters) {
      f.heldSword = false;
      f.punchDmgMult = 1;
      if (f.state === 'rooted') { f.rootT = 0; f.setState('idle', { clip: 'idle' }); }
    }
  }
}
