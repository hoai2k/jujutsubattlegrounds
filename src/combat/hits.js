// Melee hit resolution: active windows vs hurt capsules, damage pipeline
// (ratio crits, block/chip, juggle), hitstop + feedback dispatch.
import { v3 } from '../core/mathutil.js';
import { gainCharge, chargeAoE } from './charge.js';

export function computeDamage(attacker, baseDmg, opts = {}) {
  let dmg = baseDmg * attacker.dmgMult;
  // a PERFECT 7:3 timing (special) is a guaranteed Ratio crit
  let crit = !!opts.forceCrit || attacker.ratioPrimed === 2;
  const ratio = attacker.cfg.ratio;
  if (ratio && !crit && opts.canCrit !== false) {
    // The attacker's own seeded stream, not Math.random: a crit is a gameplay
    // outcome, and online every client has to roll the same one. See the
    // stream note in combat/fighter.js.
    if (attacker.ratioMark || (attacker.rng ? attacker.rng() : Math.random()) < ratio.critChance) {
      crit = true;
      attacker.ratioMark = false;
    }
  }
  if (crit) dmg *= ratio ? ratio.critMult : 1.5;
  // near-miss timing: a smaller flat bonus, no forced crit
  if (attacker.ratioPrimed === 1) dmg *= 1.35;
  return { dmg, crit };
}

// Black Flash: a connecting TECHNIQUE (Divergent Fist, its delayed shockwave,
// Manji Kick) opens the timing window — delay frames of lockout, then `window`
// frames to press punch. The basic punch string deliberately does NOT open it:
// the Flash is the payoff for landing a committed move, not for jabbing.
// The base damage is remembered — the Flash multiplies it.
export function openBlackFlash(fighter, baseDmg) {
  const bf = fighter.cfg.blackFlash;
  if (!bf) return;
  fighter.bfT = (bf.delay ?? 6) + (bf.window ?? 5);
  fighter.bfBase = baseDmg;
}

export function inArc(attacker, target, reach, arc = 1.6) {
  const dx = target.pos.x - attacker.pos.x, dz = target.pos.z - attacker.pos.z;
  const dist = Math.hypot(dx, dz);
  // A much larger body is a much easier thing to reach: `hurtPad` credits the
  // extra radius so techniques do not whiff on a target that visibly fills the
  // screen. Defaults to 0 — the roster is unchanged.
  // `hurtBox` is the config's capsule scaled by the target's growth stage
  // (Kurourushi). Everyone else's `growthScale` is 1, so this is the same
  // number the config carries.
  if (dist > reach + 0.5 + (target.hurtBox?.pad ?? target.cfg.size?.hurtPad ?? 0)) return false;
  const ang = Math.atan2(dx, dz);
  let d = ang - attacker.facing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d) < arc / 2 + 0.25;
}

// Direct feedback for any confirmed contact.
export function hitFeedback(match, attacker, defender, result, opts = {}) {
  const { fx, sfx, cam } = match;
  const p = defender.pos.clone();
  p.y += 1.25;
  // Heavy contact damages the level around it, and anything landing in water
  // throws a ripple. Both are cheap here and cover every damage source that
  // routes through the normal hit pipeline.
  if (result === 'hit' || result === 'otg' || result === 'guardbreak') {
    if (opts.knockdown || opts.crit) match.arena?.destruct?.damageAt(p, 2.2, 34);
    else if (opts.heavy) match.arena?.destruct?.damageAt(p, 1.6, 16);
    match.arena?.splash?.(defender.pos.x, defender.pos.z, opts.heavy ? 1.2 : 0.6);
  }
  if (result === 'block') {
    fx.guardSpark(p);
    sfx.guard();
    match.hitstop(2);
  } else if (result === 'guardbreak') {
    fx.guardBreak(p);
    sfx.guardBreak();
    cam.shake(0.5);
    match.hitstop(8);
  } else if (result === 'hit' || result === 'otg' || result === 'tech') {
    fx.hitSpark(p, opts.crit ? 'crit' : opts.heavy ? 'heavy' : 'light');
    if (opts.crit) { sfx.crit(); fx.ratioMark(p); cam.shake(0.42); match.hitstop(8); cam.fovKick(5); }
    // the knockdown swing gets the biggest read in the game short of a crit
    else if (opts.knockdown) { sfx.hit(true); sfx.slam(); cam.shake(0.52); match.hitstop(11); cam.fovKick(6); }
    else if (opts.heavy) { sfx.hit(true); cam.shake(0.35); match.hitstop(7); cam.fovKick(4); }
    else { sfx.hit(false); cam.shake(0.16); match.hitstop(4); }
  } else if (result === 'armor') {
    fx.armorFlash(defender.pos.clone().setY(1.2));
    sfx.armor();
    match.hitstop(3);
  }
}

export function resolveMelee(match, a, b) {
  const win = a.activeHit;
  if (!win || win.confirmed || win.frames <= 0) return;
  const def = win.def;

  // strike point: in front of the attacker at chest height. `strikeY` lets an
  // oversized fighter swing from where his shoulders actually are.
  const fwd = a.forward();
  const origin = a.pos.clone().addScaledVector(fwd, def.reach * 0.7);
  origin.y = a.pos.y + a.hurtBox.strikeY;

  // The DEFENDER's hurt capsule, scaled by their growth stage. Roster defaults
  // are radius 0.62, half-height 1.45, centre 1.05 — exactly what was
  // hard-coded here before, and exactly what `hurtBox` returns for anyone who
  // does not grow.
  // ---- MIWA'S SIMPLE DOMAIN: THE GUARANTEE -------------------------------
  // "Every sword slash she makes inside her Simple Domain hits. It cannot be
  // blocked, dodged, i-framed or SPACED OUT."
  //
  // The spacing half is why this sits ABOVE the capsule test rather than only
  // tagging the hit below: her circle is 3.1 m across and her sword reaches
  // 1.7, so a target who has backed to the far side of the ring is outside her
  // range and inside her domain at the same time. "Spaced out" has to mean
  // something, and it means the range check is skipped for exactly this case.
  //
  // The rest of the guarantee — beating blocks, i-frames, armour, Hakari's two
  // intercepts and the downed-target refusal — is bought by ONE FLAG on the
  // hit below, because combat/fighter.js `_applyHit` already carries a
  // `!hit.sureHit` guard on every one of those. There is one bypass path in
  // this codebase and this uses it. See combat/newshadow.js for the audit.
  const guaranteed = match.newshadow?.shouldGuarantee(a, b,
    win.isPunch === true ? 'punch' : (def.kind === 'heavy' ? 'heavy' : 'punch')) ?? false;

  const hb = b.hurtBox;
  const dx = b.pos.x - origin.x, dz = b.pos.z - origin.z;
  const horiz = Math.hypot(dx, dz);
  const centerY = b.pos.y + hb.center;
  if (!guaranteed && (horiz > hb.radius + 0.5 || Math.abs(origin.y - centerY) > hb.height)) return;

  win.confirmed = true;
  // punchDmgMult: bare hands are weakened inside the caster's own sword domain
  const { dmg, crit } = computeDamage(a, def.dmg * (a.punchDmgMult ?? 1), {});
  const result = b.applyHit({
    dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: def.type,
    attacker: a, dir: fwd, otgOk: true, isCT: false,
    // THE FLAG. `unblockable` rides alongside it because the guard branch in
    // `_applyHit` tests both and the intent here is "this connects", not
    // "this connects unless they happen to be guarding".
    sureHit: guaranteed || undefined,
    unblockable: guaranteed || undefined,
    // ADAPTATION SOURCE. The whole punch string and the heavy are one
    // category: they are all "he hit me with his body".
    src: def.src ?? 'punch',
    // GLOBAL BALANCE TAG. `isPunch` is set true by the `attack` state, which
    // runs the punch string and the heavy and nothing else — command moves
    // that also resolve through this path (Todo's shoulder charge) set it
    // false. That is exactly the line the balance change needs: those are
    // techniques by intent and should scale up with the rest of them, not
    // down with the jab. Read in fighter.applyHit; see combat/balance.js.
    basic: win.isPunch === true
  }, match.ctxFor(a));

  if (result === 'hit' || result === 'otg') {
    // landing a punch RAISES MAX_CE and refills CURRENT_CE — the core loop.
    // The heavy pays out more for the commitment (def.ceGain).
    a.gainMaxCE(a.cfg.stats.ceGainPerPunch * (def.ceGain ?? 1));
    // KASHIMO: landing hits is the other half of "never stops threatening" —
    // it pays Charge as a flat grant. A no-op for everyone else. Placed on the
    // same confirmed-hit branch the meter gain already uses, so there is no
    // second hook to keep in step with this one.
    gainCharge(a, def.kind === 'heavy' ? 'heavy' : 'punch');
    // TIER 3 ONLY: "at maximum Charge his attacks gain new properties — add a
    // small AoE discharge to his normals". It hangs off the CONFIRMED-HIT
    // branch rather than off the swing, because a discharge with nothing to
    // earth itself into is not a discharge; and it lives here rather than in
    // the effect dispatcher because the punch string never goes near that.
    if (chargeAoE(a)) match.effects.chargeDischarge(a, b);
    a.comboHits++;
    a.comboTimer = 0;
    // YUTA: landing a bare-handed punch steals that opponent's technique into
    // the copy slot, ready to fire back on his SPECIAL. This is the reliable
    // way to load a copy — being hit by their technique still works too, but
    // it costs him health to learn it.
    if (a.cfg.copy?.stealOnPunch) a.storeCopy(b);
  }
  // Mahito inside his own domain: every connected attack chips the
  // transfiguration gauge directly (blocked hits chip less — see domains.js)
  if (result === 'hit' || result === 'otg' || result === 'block') {
    match.domains.transfigChunk(a, b, def.kind === 'heavy' ? 'heavy' : 'punch', result === 'block');
  }
  hitFeedback(match, a, b, result, {
    crit, heavy: def.type !== 'light', knockdown: def.type === 'knockdown'
  });
}
