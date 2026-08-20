// SKY REFLECT 天逆鉾 — Uro's SPECIAL, and the roster's only true reflect.
// ===========================================================================
// A short stance. While it holds, any PROJECTILE or travelling ranged
// technique that reaches her is turned around and sent back at whoever threw
// it, at full damage, with them as the new attacker. Melee is completely
// unaffected: the counterplay is to walk in and hit her.
//
// ---------------------------------------------------------------------------
// THE RULE, STATED ONCE, SO THE AUDIT IS A LOOKUP AND NOT AN OPINION
// ---------------------------------------------------------------------------
//   *** SHE REFLECTS THINGS THAT TRAVEL. ***
//
// Every damaging thing in this game is one of three shapes:
//
//   A. A TRAVELLING ENTITY — an object with a position that crosses the space
//      between two fighters over time, resolving its hit when it arrives.
//      Jogo's embers, Choso's blood edge, Kashimo's bolts, Nobara's nails,
//      Sukuna's Dismantle, Todo's clap wave, Nanami's ratio wave, Yuji's
//      crescent and ghost fist, Hanami's wooden ball.
//      *** THESE REFLECT. *** They are literally turned around: the same
//      entity keeps flying, with its direction mirrored and its `caster`
//      swapped, so what comes back is the real technique with the real damage
//      rather than a copy of it.
//
//   B. AN INSTANT LINE — resolved on the activation frame along a ray, with no
//      object in flight at all. Sukuna's Fire Arrow, Choso's Piercing Blood,
//      Gojo's Hollow Purple, Geto's Uzumaki, Naoya's Frame 24.
//      *** THESE DO NOT REFLECT, and that is a decision rather than an
//      oversight.*** There is nothing crossing the space in front of her to
//      bend: by the time the technique exists it is already through her. Their
//      counterplay is the enormous startup every one of them carries, which is
//      what they were balanced around, and letting a 20-frame stance answer a
//      full-bar Fire Arrow for free would make her the answer to four
//      characters at once.
//
//   C. A BODY — a fist, a shikigami, a curse, a summon, a charge, a grab.
//      *** THESE DO NOT REFLECT. *** The brief is explicit, and it is what
//      makes her beatable: get on top of her.
//
// The full per-tool audit lives in the delivery report; the machine-readable
// half of it is the REFLECTABLE table below, which is the single source of
// truth. An entity type not in that table is not reflected, so a technique
// added later is safe-by-default rather than silently reflectable.
//
// ---------------------------------------------------------------------------
// SUMMONS ARE NOT PROJECTILES — the ruling the brief asks for, explicitly
// ---------------------------------------------------------------------------
// Megumi's shikigami, Geto's curses, Mahito's transfigured human, Yuki's
// Garuda and Dagon's ocean shikigami are all BODIES. They have their own
// health, their own AI, their own pathing and their own deaths; they are not
// launched at anybody, they walk over. Reflecting one would have to mean
// either mind-controlling it (a completely different mechanic, and Geto's) or
// deleting it (a hard counter to two whole characters from one 20-frame
// button). Neither is what "the sky bends the attack back" means.
//   THEY ARE UNAFFECTED. She can hit them and they can hit her, and the
//   correct answer to a summoner is the same as everyone else's.
// The one place this is nearly a judgement call is Nue's dive and Garuda's
// dive, which do arrive from range at speed. They are still bodies — the thing
// that arrives is the creature itself, and it survives the exchange — so they
// stay out.
//
// ---------------------------------------------------------------------------
// CURSED SPEECH IS NOT REFLECTED EITHER, and this one is worth the paragraph
// ---------------------------------------------------------------------------
// Inumaki's commands travel — combat/speech.js flies glyphs across the arena
// and applies the effect when they arrive — so on the "does it travel" test
// alone they would qualify. They are excluded anyway, because of WHAT they
// are: a command is not a thing thrown at a body, it is an instruction that
// takes hold IN one. There is nothing with momentum for a bent sheet of space
// to redirect, and "reflected DON'T MOVE" would have to mean Inumaki roots
// himself with his own word — which is a cursed-speech BACKFIRE, a mechanic
// that already exists in the source under completely different rules (it costs
// the speaker their throat, it is not something an opponent can inflict).
//   SHE TAKES THE WORD. Her resistance is her MAX_CE like everybody else's.
// That is also the right balance answer: Inumaki is one of very few characters
// whose entire kit is ranged, and a free full answer to all of it would be a
// 10-0 matchup in her favour.
//
// ---------------------------------------------------------------------------
// THE MIRROR MATCH — two reflect stances facing each other
// ---------------------------------------------------------------------------
// Handled by construction rather than by a special case: every entity carries
// `reflected`, a COUNT. `REFLECT_CAP` is 1. A projectile that has already been
// turned around once is invisible to every subsequent reflect stance in the
// match and simply connects with whoever it is now flying at.
//   So Uro A throws an ember, Uro B reflects it, and it hits Uro A. It cannot
//   come back a third time no matter how the two of them stand, the loop
//   provably terminates in one bounce, and it terminates in the funniest
//   possible place: the person who threw it.
// Note this also caps a NON-mirror loop that would otherwise be possible —
// Uro reflecting her own reflected projectile back off a second stance.

import { v3, flatDist } from '../core/mathutil.js';

// ---------------------------------------------------------------------------
// THE TABLE. Entity `type` -> true. This is the whole audit, in one place.
// ---------------------------------------------------------------------------
// Everything here is category A above: an object with a position that crosses
// the arena. Anything absent is not reflected, which is the safe default.
export const REFLECTABLE = {
  ember: true,          // JOGO — ember insects (and the Overheat maximum swarm)
  bloodEdge: true,      // CHOSO — Blood Edge
  crescent: true,       // YUJI — the 卍 crescent off the Manji Kick
  ghostFist: true,      // YUJI — the whiffed Divergent Fist's discharged ghost
  clapWave: true,       // TODO — Resonant Clap's wall of shock
  ratioWave: true,      // NANAMI — the Ratio wave
  dismantleWave: true,  // SUKUNA — Dismantle
  bolt: true,           // KASHIMO — the lightning bolt, and the Amber fan
  nail: true,           // NOBARA — a hairpin nail in flight
  woodenBall: true      // HANAMI — the thrown wooden ball
};

// A projectile may be turned around exactly once. See the mirror-match note.
export const REFLECT_CAP = 1;

export const REFLECT_DEFAULTS = {
  startup: 8,           // frames before the surface is live — it can be baited
  active: 20,           // frames the surface holds
  recovery: 22,         // frames of vulnerability after it drops
  radius: 2.6,          // how far in front of her the surface catches
  arc: 2.5,             // radians of coverage, centred on her facing
  damageMult: 1.0,      // full damage, as briefed
  speedMult: 1.12       // it comes back very slightly faster, so it can land
};

export function reflectDef(f) {
  return { ...REFLECT_DEFAULTS, ...(f?.cfg?.special?.reflect || {}) };
}

// Is this fighter's reflect surface live RIGHT NOW? The single predicate every
// other system asks — the FX, the audio, the CPU and the effects loop.
export function reflectHolds(f) {
  return !!f && f.state === 'skyReflect' && f.reflectLive > 0;
}

// Everyone in the match currently holding a live surface. Usually zero or one;
// in a free-for-all it can be more, and in a mirror match it can be two facing
// each other — see the note above for why that terminates.
export function reflectorsIn(match) {
  const out = [];
  for (const f of match.activeFighters ?? []) if (reflectHolds(f)) out.push(f);
  return out;
}

// ---------------------------------------------------------------------------
// THE HOOK
// ---------------------------------------------------------------------------
// Called once per entity per frame from Effects.update, BEFORE the per-type
// branch runs — so the reflection happens while the projectile is still in
// flight and its own code then carries it onward in the new direction with no
// knowledge that anything happened. That is the entire reason this is one
// function rather than ten edits: `caster` and `dir`/`vel` are the only two
// things every travelling entity in effects.js has in common, and they are
// exactly the two things a reflection changes.
//
// Returns true if the entity was turned around this frame.
export function tryReflect(match, e) {
  if (!REFLECTABLE[e.type]) return false;
  if ((e.reflected ?? 0) >= REFLECT_CAP) return false;
  if (!e.pos) return false;

  for (const r of reflectorsIn(match)) {
    // never her own — a reflector cannot bounce a projectile she is throwing
    if (e.caster === r) continue;
    if (flatDist(e.pos, r.pos) > (r._reflectR ?? REFLECT_DEFAULTS.radius)) continue;
    // ...and it has to be IN FRONT of her. The surface is a plane she puts up,
    // not a bubble: something arriving from behind is a read she lost.
    const dx = e.pos.x - r.pos.x, dz = e.pos.z - r.pos.z;
    const ang = Math.atan2(dx, dz);
    let d = ang - r.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    const arc = r._reflectArc ?? REFLECT_DEFAULTS.arc;
    if (Math.abs(d) > arc / 2) continue;

    return applyReflect(match, e, r);
  }
  return false;
}

// The turn itself. Kept separate so the finisher and the verification harness
// can drive it directly.
export function applyReflect(match, e, r) {
  const thrower = e.caster;
  const def = reflectDef(r);
  e.reflected = (e.reflected ?? 0) + 1;
  // OWNERSHIP CHANGES. This is what makes it a reflect rather than a parry:
  // the damage that lands is credited to HER, the technique's own scaling now
  // reads off her, and it can no longer hit her because `Effects.other()`
  // resolves the target from the caster.
  e.caster = r;
  e.dealt = false;                 // it gets to connect again
  e.sure = false;                  // a reflected sure-hit is no longer sure
  if (e.hitOpts) e.hitOpts = { ...e.hitOpts, attacker: r, sureHit: false };

  // MIRROR THE HEADING. Aimed back at the thrower rather than simply negated:
  // a straight negation sends it back down the line it came in on, which
  // misses a thrower who has moved since. Bending it onto the person who threw
  // it is what the technique IS.
  const back = thrower && thrower.alive
    ? v3(thrower.pos.x - e.pos.x, 0, thrower.pos.z - e.pos.z)
    : v3(-(e.dir?.x ?? e.vel?.x ?? 1), 0, -(e.dir?.z ?? e.vel?.z ?? 0));
  if (back.lengthSq() < 1e-5) back.set(0, 0, 1);
  back.normalize();
  if (e.dir) e.dir.copy(back);
  if (e.vel) {
    const spd = e.vel.length() * def.speedMult;
    e.vel.copy(back).multiplyScalar(spd);
  }
  if (e.spd) e.spd *= def.speedMult;
  // it gets its whole range back — a projectile that had almost expired should
  // not fizzle out one metre into the return trip
  if (e.travelled != null) e.travelled = 0;
  if (e.life != null) e.life = Math.max(e.life, 0.6);
  if (e.dmg != null) e.dmg *= def.damageMult;
  // ...and it is no longer the thrower's adaptation category coming back at
  // her: Mahoraga reflecting nothing is a non-issue, but Mahoraga being HIT by
  // his own reflected wheel slash should feed the same bucket, so `src` is
  // deliberately left exactly as it was.

  r.reflectCount = (r.reflectCount ?? 0) + 1;
  r.emit('skyReflected', { type: e.type });
  match.fx.skyReflectBounce?.(e.pos.clone(), back, r);
  match.sfx.skyReflect?.();
  match.hud?.toast?.(r, '天逆鉾 — RETURNED');
  match.cam?.shake?.(0.28);
  return true;
}
