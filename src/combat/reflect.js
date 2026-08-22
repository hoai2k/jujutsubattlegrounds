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
  // TAKABA — ONE KEY FOR THREE OF FOURTEEN. The entity is only ever registered
  // for outcomes whose table entry declares `projectile: true`, so this key
  // covers exactly the GLOVE (it crosses the space on its spring), the PIE (it
  // is thrown — the most literal projectile in the game) and the FIRE HOSE (a
  // pressurised stream with a front that arrives).
  //
  // The other eleven never become an entity at all, so they are not "excluded"
  // here so much as unable to reach this table: a MALLET, a RAKE and a FOAM
  // FINGER are SWINGS (category C, an implement); an ANVIL, a SAFE, a PIANO
  // and a STAGE LIGHT arrive from ABOVE, from outside the plane she is holding
  // (category B in effect — by the time the object exists it is already over
  // them, and their counterplay is the telegraph); a BANANA PEEL and a
  // TRAPDOOR are on the FLOOR with nothing in flight; and a BUCKET and the
  // CURTAIN arrive ON the target from the target's own position.
  // The full classification lives in characters/takaba_bits.js.
  bit: true,
  ember: true,          // JOGO — ember insects (and the Overheat maximum swarm)
  bloodEdge: true,      // CHOSO — Blood Edge
  // YUJI — the 卍 crescent thrown off the Manji Kick's heel. BOTH KEYS are
  // listed because the effect system produces `manji` from the kick itself and
  // `crescent` from the copied version, and an audit that only covered one of
  // them would have been wrong in exactly the way that never shows up until
  // somebody plays the matchup. (Found by running the audit: the table said
  // `crescent` and the technique emits `manji`.)
  manji: true,
  crescent: true,
  ghostFist: true,      // YUJI — the whiffed Divergent Fist's discharged ghost
  clapWave: true,       // TODO — Resonant Clap's wall of shock
  ratioWave: true,      // NANAMI — the Ratio wave
  dismantleWave: true,  // SUKUNA — Dismantle
  bolt: true,           // KASHIMO — the lightning bolt, and the Amber fan
  nail: true,           // NOBARA — a hairpin nail in flight
  woodenBall: true,     // HANAMI — the thrown wooden ball
  // GOJO — RED 赫. Since the technique overhaul it does not fire a cone, it
  // flies a core of stored repulsion down the lane and lets go on contact —
  // which makes it a travelling object by the only test this file applies.
  // Added after the audit run showed it producing a `redOrb` entity that the
  // table did not cover. BLUE is deliberately NOT here: it is an ATTRACTOR
  // placed in the world that pulls things toward itself, not something thrown
  // at her, and "reflecting" a point of convergence has no meaning.
  redOrb: true,
  // DAGON — both of his. The volley is a school of fish in flight and the
  // eel-serpent's spit is a pressurised jet, and it would be incoherent for
  // her to bend Jogo's insects back and not his. The TIDAL SURGE is not here:
  // it is a wall of water crossing the ground, the same shape as Hanami's
  // roots, and it is closer to terrain than to a projectile.
  seaFish: true,
  seaSpit: true,
  // URAUME — ICEFALL's shards. They cross the arena as objects and they are
  // worth 3.5 damage each, so bending five of them back is a small, correct
  // reward for a read. FROST CALM is deliberately absent: its columns come UP
  // OUT OF THE GROUND along a line and never cross the space in front of her,
  // which puts it with Hanami's roots rather than with Jogo's insects. The
  // GLACIER (the ultimate) is absent for the same reason at a larger scale —
  // it is a wall of ice moving across the FLOOR, the same shape as Dagon's
  // tidal surge, which this table already rules is closer to terrain than to a
  // projectile. Bending it back would also have to mean bending the ice it has
  // already laid, which has no meaning.
  iceShard: true,
  // ---- RYU — GRANITE BLAST, AND THE ONE ENTRY CANON DECIDED FOR US -------
  // *** THIS ONE IS NOT A JUDGEMENT CALL. *** The source is unambiguous that
  // Uro redirects Ryu's blasts, that she has the advantage on him for exactly
  // that reason, and that a redirected Granite Blast is how he loses his
  // fight. So the beam is BUILT as a travelling front (rather than as an
  // instant line, which is what a beam would ordinarily be in this table) in
  // order to be reflectable, and it is here.
  //
  // A reflected tier-4 beam would be a round-ender at face value — 88 damage
  // arriving on the man who fired it. It is not, and the reason is also canon
  // rather than a patch: Ryu's endurance entry records that he withstood being
  // hit with his own Granite Blast, and that he reinforced his body hard
  // enough to reduce Sukuna's Dismantle to a single cut. His config declares
  // `selfEnergyResist`, and the beam's damage site reads it when the target is
  // the beam's ORIGINAL owner (`e.origin`, stamped at spawn and never
  // rewritten by `applyReflect`, which rewrites `caster`). See the delivery
  // report for the measured numbers.
  //
  // MAXIMUM OUTPUT (`ryuMax`) is deliberately NOT here. It is a sustained
  // instant line with no front crossing the space — category B, with Hollow
  // Purple, Uzumaki, Fire Arrow and Piercing Blood — and its counterplay is
  // the 42 frames of telegraph it was priced around.
  ryuBeam: true,
  // ---- REGGIE — THREE OF SIX, AND THE CAR IS THE INTERESTING ONE ---------
  // *** THE BRIEF ASKS THIS QUESTION EXPLICITLY: "confirm they reflect and
  // that a reflected car doesn't do something absurd." *** Here is the whole
  // audit.
  //
  // THE THROWN JUNK (`reggieThrow`) — a knife, a cone, a wrench, a bottle
  //   crossing the space at 26 m/s. It is the most literal category-A object
  //   in the game and it is here. It is also what his ULTIMATE'S BARRAGE is
  //   made of, so a Uro holding the surface through Clearing the Register
  //   sends the whole barrage back, which is a genuinely spectacular and
  //   completely correct outcome: the ultimate is thirty thrown objects and
  //   she is turning thrown objects around.
  //
  // THE VEHICLES (`reggieVehicle`) — the moped and the CAR. Both travel, both
  //   are objects, both are category A, and both reflect.
  //
  //   *** DOES A REFLECTED CAR DO SOMETHING ABSURD? *** It does 52 damage and
  //   13 knockback to the man who threw it, and the answer is that this is
  //   correct rather than absurd, for three separate reasons:
  //     · IT IS EXACTLY WHAT THE TABLE ALREADY DOES TO RYU. A reflected tier-4
  //       Granite Blast is 88 damage returned, which is more, and the entry
  //       above argues at length that this is the point of her character.
  //     · IT COST HIM 48 OF 100 STOCK. He is not merely hit; he is hit AND
  //       broke, and cannot answer with anything but junk for the next ten
  //       seconds. The punish for guessing wrong is proportional to what the
  //       guess cost, which is the whole design of the receipt stock.
  //     · THE TELEGRAPH IS 46 FRAMES, the second longest non-ultimate wind-up
  //       in the game. She has three quarters of a second to decide, standing
  //       still, in front of a man visibly loading a car. If that read should
  //       not be rewarded, no read should.
  //   The one thing that WOULD be absurd is a reflected car that keeps its
  //   `hit` Set — it would pass through her and then hit him, which is two
  //   hits for one read. `applyReflect` rewrites `caster` and mirrors `dir`;
  //   the vehicle's own case clears `hit` when the caster changes, so the
  //   returned car hits its new target exactly once. See the guard there.
  //
  // THE GAS CANISTER (`reggieGas`) — reflectable ONLY IN FLIGHT, which falls
  //   out of the entity's own two phases rather than needing a rule: once it
  //   lands it is a cloud sitting on the floor, and a cloud is terrain. A
  //   canister bent back vents on HIM, which blinds him, which is a real and
  //   funny outcome.
  //
  // NOT HERE, and each for a reason this table has already established:
  //   THE LADDER   — a SWING. Category C, an implement. It never leaves his
  //                  hands and there is nothing crossing the space to bend.
  //   THE HOOK     — a GRAB. Category C, with Todo's Vice Grab.
  //   THE VENDING  — it arrives FROM ABOVE, outside the plane she is holding.
  //     MACHINE      Category B in effect, with Takaba's anvil and safe and
  //                  Uraume's icicle: by the time the object exists it is
  //                  already over them, and its counterplay is the 0.62 s
  //                  marker on the floor.
  //   THE DRONE    — a BODY with health and pathing. Summons are not
  //                  projectiles; the ruling at the top of this file applies
  //                  unchanged and she can shoot it down like anybody else.
  reggieThrow: true,
  reggieVehicle: true,
  reggieGas: true,
  // ---- INO — ONE OF FIVE, AND THE UNMISSABLE ONE IS STILL REFLECTABLE ----
  // THE HORN (`inoHorn`) covers both 獬豸 techniques. The ordinary one is an
  // obvious category A. The JUDGEMENT HORN is the interesting entry, because
  // its whole identity is that it cannot be dodged — and it is here anyway.
  //
  // That is deliberate and it is the correct reading of both characters.
  // "Undodgeable" is a statement about MOVEMENT: you cannot walk out of its
  // way, it turns and follows. It is not a statement about invulnerability,
  // and Sky Reflect is not a dodge — it is a surface that turns a travelling
  // thing around. A homing horn bent back HOMES ON INO, which is both the
  // funniest and the most logically airtight outcome in this table: the thing
  // that will not stop until it hits its target now has a different target.
  //
  // NOT HERE:
  //   THE GLIDE    — his own body moving. Category C.
  //   THE SHELL    — a buff on himself with no travelling part at all.
  //   THE HORN RUSH— his body and the beast's, moving together. Category C.
  //   THE DRAGON   — the ultimate's pass is a body-sized construct moving with
  //                  him rather than a thrown object, and it is an ULTIMATE:
  //                  this table has never contained one and the reason is
  //                  stated at the top of the file.
  //   THE BEASTS   — they never leave him. They are not even bodies that walk
  //                  over; they are bonded to his position, so there is
  //                  nothing to reflect and nothing to hit. See the audit in
  //                  combat/beasts.js.
  inoHorn: true
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
  // ---- THE PASS-THROUGH SET, AND WHY IT HAS TO BE CLEARED ---------------
  // Entities that hit MORE THAN ONE BODY track who they have already touched
  // in a Set rather than with a `dealt` flag — Reggie's vehicles, his
  // ultimate's finale, Ino's horn rush. A reflected one that kept its Set
  // would have already "hit" the person it is now flying at, so the returned
  // car would sail straight through him.
  //
  // It is cleared, not rebuilt with her in it: the entity's own case tests
  // `f === e.caster` before anything else, so she is excluded by ownership and
  // does not need to be in the Set. The result is that a bent-back car hits
  // its new target exactly once, which is the guard the REFLECTABLE table's
  // car note above promises.
  if (e.hit instanceof Set) e.hit.clear();
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
  // the bend (real refraction — see fx/warpfx.js) and the flash that makes it
  // legible are two separate systems, called side by side rather than one
  // routing through the other
  match.warpfx?.bounce(e.pos.clone(), back.clone());
  match.fx.skyReflectBounce?.(e.pos.clone(), back);
  match.sfx.skyReflect?.();
  match.hud?.toast?.(r, '天逆鉾 — RETURNED');
  match.cam?.shake?.(0.28);
  return true;
}
