// INSTANT KO — the one shared category for "this kills regardless of health".
//
// The roster now owns more than one of these (Mahito's Idle Transfiguration,
// Higuruma's Execution) and every future one should slot in here rather than
// growing its own special cases. Everything that can turn a fighter off
// without going through the damage pipeline routes through this file, which is
// what makes the cross-character rulings below single-sited instead of
// scattered:
//
//   · HAKARI'S JACKPOT is unkillable by DAMAGE. It is not unkillable. Reverse
//     Cursed Technique pays back damage; it does not un-carry-out a sentence
//     and it does not un-reshape a soul. `finishInstantKO` stamps a permanent
//     `instantKO` record on the fighter and `Fighter.alive` reads it, so no
//     amount of healing after the fact brings the body back. (This is also
//     exactly how transfiguration already behaved against him — it set hp to
//     zero outside the hit pipeline — so unifying the two changed nothing.)
//
//   · MAHORAGA ADAPTS TO THE CATEGORY, AS A CHANCE TO RESIST. A damage
//     REDUCTION is meaningless against a kill: 60% off an instant KO is still
//     an instant KO. So for this one category his accumulated adaptation
//     percentage is read as a probability that the kill simply does not take.
//     It keeps the shape of adaptation intact (the more it happens to him, the
//     better he answers it) without either extreme — he is never immune (the
//     cap is 88%, and the first attempt lands against 0%), and he is never
//     just a bigger body with a health bar to a move that ignores health.
//
// A refusal is never silent: every path here reports why, because "the instant
// kill did nothing" is the single most confusing thing that can happen in a
// fight.
import { CATEGORIES } from './adaptation.js';

export const INSTANT_KO = 'instantKO';

// Sanity: the category has to exist in the adaptation table or the resist roll
// below can never be earned. Cheap, and it fails loudly at import time.
if (!CATEGORIES[INSTANT_KO]) {
  console.warn('[instantko] adaptation is missing the ' + INSTANT_KO + ' category');
}

// ---------------------------------------------------------------------------
// COMMIT — call this the moment the effect decides it is going to kill, BEFORE
// any cinematic starts. Returns a verdict:
//   { ok: true }                              — proceed, then call finishInstantKO
//   { ok: false, reason, label }              — refused; show the label
//
// `needsSoul` marks the effects that reshape a person rather than end one —
// Idle Transfiguration is one, an executioner's blade is not.
export function commitInstantKO(victim, { kind, needsSoul = false, rng = Math.random } = {}) {
  if (!victim || !victim.alive) return { ok: false, reason: 'dead', label: 'ALREADY DOWN' };
  if (victim.instantKO) return { ok: false, reason: 'spent', label: 'ALREADY DOWN' };
  if (needsSoul && victim.cfg.soulless) {
    return { ok: false, reason: 'soulless', label: 'NO SOUL TO RESHAPE' };
  }
  // ADAPTATION: the percentage is a resist CHANCE for this category only.
  if (victim.adapt) {
    victim.adapt.mark(INSTANT_KO);
    const chance = victim.adapt.reductionFor(INSTANT_KO);
    if (chance > 0 && rng() < chance) {
      return {
        ok: false, reason: 'adapted', chance,
        label: '適応 — SENTENCE RESISTED ' + Math.round(chance * 100) + '%'
      };
    }
  }
  return { ok: true, kind };
}

// ---------------------------------------------------------------------------
// FINISH — the kill actually lands. Health goes to zero and the record stays
// on the fighter for the rest of the round, which is what closes the door on
// any healing (Jackpot's RCT, a future regen) putting them back up.
export function finishInstantKO(victim, { kind, by = null } = {}) {
  if (!victim || victim.instantKO) return false;
  victim.instantKO = { kind, by: by?.cfg?.id ?? null };
  victim.res.hp = 0;
  // PANDA: a sentence is carried out on a PERSON, and a soul is reshaped once.
  // Neither destroys one organ. `Fighter.alive` reads the stamp above before it
  // reads any health, so both effects already killed him outright the moment
  // they were written — this only makes the three-segment HUD strip agree with
  // the result instead of showing two full cores under a corpse. A no-op for
  // every fighter without cores. See the ruling in combat/cores.js.
  victim.killAllCores?.();
  return true;
}

// Anything that heals, floors health, or otherwise argues with a zero must ask
// this first. Exported rather than inlined so a new healing effect has an
// obvious thing to call.
export function isInstantKilled(f) { return !!f?.instantKO; }
