// FROST 氷凝呪法 — Uraume's whole character, in one module.
//
// ---------------------------------------------------------------------------
// THE CANON, AS RESEARCHED
// ---------------------------------------------------------------------------
// Sources (web, 2026-08-21): the Jujutsu Kaisen Wiki entries for Uraume, ICE
// FORMATION, FROST CALM and ICEFALL, pulled as raw wikitext through the fandom
// MediaWiki API. (Worth recording, because every earlier model file in this
// project notes that the fandom host answers 402 to a plain page fetch from
// this environment — `api.php?action=parse&prop=wikitext` answers 200, and
// that is how these entries and Ryu's were actually read rather than
// remembered. See art/models/uraume.js for the same note.)
//
//   INNATE TECHNIQUE — ICE FORMATION 氷凝呪法 (Hikori Juhō). Lowers the
//   temperature around the user to extreme levels. They generate solid ice by
//   TOUCHING A SURFACE, manifest frozen mist, and move ice through the air
//   cryokinetically. Uraume is also alias'd THE FROZEN STAR 凍星 (Iteboshi).
//
//   EXTENSION — FROST CALM 霜凪 (Shimonagi). "The pinnacle of Ice Formation."
//   Supercooled cursed energy blown from the mouth as a cloud of mist, guided
//   by the hand; it materialises on contact into thick sheets and COLUMNS of
//   ice that hold the target in place. The line that matters most for this
//   file: *while covered in several layers of ice, ONE WRONG MOVE AND THE
//   TARGET COULD END UP RIPPING THEMSELVES APART* (ch.135, restated ch.245).
//
//   EXTENSION — ICEFALL 直瀑 (Chokubaku). Frost the hand, touch the ground,
//   and grow interconnected BLOCK-SHAPED sheets of ice; break them apart and
//   levitate the pieces at the target. They freeze on contact, and giant
//   icicles then come down from above to finish the frozen bodies.
//
//   MAXIMUM OUTPUT: FROST CALM 出力最大「霜凪」. The strongest thing Uraume is
//   shown doing (ch.215) — it ended Sukuna's fight with Yuji and Maki in one
//   attack. This is the ultimate; see characters/uraume.js.
//
//   *** NO DOMAIN EXPANSION. *** Uraume is never shown casting one and the
//   wiki lists none. So D-pad Right is a burst, with the faster non-domain
//   startup, exactly as Hanami / Nanami / Naoya / Toji already are.
//
// ---------------------------------------------------------------------------
// WHERE THE PIECES LIVE
//   · this file             frost stacks, FROSTBOUND, and the ice terrain
//   · combat/fighter.js     `frost`, the per-tick call, the reset, the three
//                           multiplier hooks (speed / incoming / startup)
//   · characters/uraume.js  every number that is a per-character decision
//   · combat/effects.js     the four techniques that apply it
//   · arena/terrain.js      the ICE class, alongside NATURAL and ARTIFICIAL
//   · ui/hud.js             the stack badge on the VICTIM's plate
//
// ===========================================================================
// PART 1 — FROST STACKS
// ===========================================================================
// Every ice attack lands stacks. Stacks take away the ability to MOVE and the
// ability to START a move, and they decay. This is deliberately the same shape
// as Jogo's BURN (combat/burn.js) so a player who has learned one debuff has
// learned the other — and deliberately the opposite CONTENT, because the two
// zoners must not be the same character:
//
//   BURN  is damage over time. It kills you slowly and you can ignore it while
//         you win the fight.
//   FROST does almost no damage at all. It does not kill you; it takes the
//         fight away from you and hands Uraume the room they want.
//
// Neither ever feeds MAX_CE — same ruling burn already has, for the same
// reason: a zoner must not grow their bar from full screen.
// ===========================================================================
import { v3, rand, flatDist, clamp } from '../core/mathutil.js';
import { ICE } from '../arena/terrain.js';

export const FROST = {
  maxStacks: 6,

  // ---- WHAT A STACK COSTS THE VICTIM --------------------------------------
  // All three curves are LINEAR IN THE COUNT and all three are read through
  // one of the fighter's existing multiplier getters, so there is no damage
  // site, no movement site and no frame-data site that can forget about them.
  //
  //   MOVEMENT   0.055 per stack -> 0.67x at six. `speedMult` covers the walk,
  //              the run, the DASH and the clip playback in one number, which
  //              is why "slow movement AND dash distance" is one dial here
  //              rather than two that could drift apart.
  //   STARTUP    0.055 per stack -> 1.33x printed startup at six. Applied in
  //              `_applyGrowth`, the one place every built move passes through.
  //              Recovery is deliberately NOT touched: lengthening recovery as
  //              well would double the punish window on every whiff and turn a
  //              soft debuff into a hard one.
  slowPerStack: 0.055,
  startupPerStack: 0.055,

  // decay. Slower than burn's 1.3 s because frost is the whole win condition
  // rather than a rider on one, and a debuff that evaporates before Uraume can
  // land the next thing is not a debuff.
  decayEvery: 1.6,
  refreshHold: 0.7,       // seconds after a stack lands before decay may start

  // ---- FROSTBOUND — WHAT HAPPENS AT MAXIMUM -------------------------------
  duration: 0.55,         // SHORT. See the Naoya note below.
  // THE ULTIMATE'S SHELL, and the only one that roots. 1.8 s is long by the
  // standards of this file and still SHORTER IN PRACTICE than Naoya's 1.0 s
  // freeze, because any single hit ends it — and the ultimate has already put
  // the whole arena under ice, so the follow-up is guaranteed to be available.
  // If nobody touches them it runs the full 1.8 s and they are stuck standing
  // in it; that is the payoff for a 103-frame D-pad Right.
  ultDuration: 1.8,
  vulnMult: 1.40,         // incoming damage while the shell holds
  moveMult: 0.18,         // they can still move. Barely.
  residualStacks: 3,      // where the meter drops back to, so it cannot loop
  cooldown: 2.2,          // minimum gap between two shells on one victim

  // a frostbound body takes a LITTLE damage from the ice itself, so the state
  // reads as an attack rather than as a status light. Tiny on purpose — the
  // 1.40x window is the payload, not this.
  bindDamage: 3.0
};

// ---------------------------------------------------------------------------
// *** FROSTBOUND IS NOT NAOYA'S FREEZE, AND THIS IS THE PARAGRAPH THAT SAYS
// *** WHY — because two ice-coloured lockdowns on one roster would be one
// *** mechanic wearing two hats.
// ---------------------------------------------------------------------------
// PROJECTION SORCERY (combat/freeze.js) puts the victim into the `frozen`
// STATE. That state is on the list in `Fighter._stateLogic` that returns
// BEFORE READING INPUT AT ALL. For one full second the victim has no
// movement, no attack, no block, no dash and no special; gravity is suspended;
// a 24-tick gold countdown ring turns over their head; and they take exactly
// normal damage the whole time. It is a body being taken away.
//
// FROSTBOUND IS A TIMER, NOT A STATE, and that single structural difference is
// the whole distinction:
//
//   1. THEY KEEP THEIR INPUTS. Every button still works. Movement is crushed
//      to 0.18x and the dash and the jump are refused (see `frostGrounded`),
//      but they can guard, they can throw a technique, they can hit back. The
//      canon line this comes from is the one quoted at the top of the file —
//      being encased in Frost Calm is dangerous because MOVING inside it
//      tears you up, not because you cannot move.
//   2. IT IS A DAMAGE WINDOW, NOT A LOCKDOWN. 1.40x incoming for 0.55 s. Naoya
//      grants no damage bonus whatsoever; his second is worth whatever he can
//      physically fit into it (measured, in his config: 7.5% of a bar). Frost-
//      bound is worth 40% MORE of whatever the attacker was going to do
//      anyway, which is a completely different kind of reward and rewards a
//      completely different character — the ally, the big single hit, the
//      committed ultimate.
//   3. IT BREAKS EARLY. The FIRST hit that lands SHATTERS the shell and ends
//      the state. Naoya's cannot be broken and a punish landing mid-freeze
//      explicitly does not end it. So Uraume's is a window you SPEND and his
//      is a window you FILL, and the optimal play against each is opposite:
//      against frostbound you throw your single biggest thing, against the
//      freeze you throw your fastest string.
//   4. IT IS 0.55 s, NOT 1.00 s. Just over half.
//   5. IT LOOKS NOTHING LIKE IT. His is a GOLD desaturation with a 24-tick
//      clock and a body stuttering at 24 fps. This is a pale blue faceted ICE
//      SHELL — real hard-edged geometry closed around the body — with no ring,
//      no clock, no desaturation and no stutter, that visibly cracks and then
//      bursts into shards when it goes.
//
// THEY STACK SANELY, and they stack sanely BECAUSE of the structural split.
// A timer and a state cannot fight over a body: if both land, the `frozen`
// state owns control (it already removes everything frostbound would have
// merely slowed) and the frost timer keeps doing the only thing it does that
// the freeze does not — the 1.40x. So the combined result of a Naoya freeze
// into an Uraume shell is "no inputs for one second, and softer while it
// lasts", which is exactly the sum of the two parts and required no special
// case anywhere. The one guard rail is `FROST.cooldown`, which stops a victim
// being chain-shelled, and it applies whoever else is also on them.
// ---------------------------------------------------------------------------

// The blank slate. Called from the fighter constructor and from the round
// reset, so a body shelled at the buzzer does not start the next round in ice.
export function newFrost() {
  return { stacks: 0, t: 0, boundT: 0, cd: 0, shattered: false, by: null, root: false };
}

// ---- THE THREE READS ------------------------------------------------------
// All three return the neutral value for a fighter with no frost on them, so
// they are safe to call unconditionally from the shared getters and there is
// no branch to forget.
export function frostSpeed(f) {
  const fr = f?.frost;
  if (!fr) return 1;
  // `root` is the ULTIMATE-SCALE shell only (see FROST.ultRoot below). An
  // ordinary shell still lets you shuffle at 18%; the one the glaciation wall
  // lays does not let you walk out of it at all. It still does not touch a
  // single input — you can punch, block and be hit out of it exactly as
  // before — which is the whole of the Naoya distinction and is why this is a
  // speed multiplier and not a state.
  if (fr.boundT > 0) return fr.root ? 0 : FROST.moveMult;
  return Math.max(0.2, 1 - fr.stacks * FROST.slowPerStack);
}
export function frostStartup(f) {
  const fr = f?.frost;
  if (!fr || fr.stacks <= 0) return 1;
  return 1 + fr.stacks * FROST.startupPerStack;
}
export function frostIncoming(f) {
  return f?.frost?.boundT > 0 ? FROST.vulnMult : 1;
}
// Refuses the dash and the jump while the shell holds. Read by the state
// machine; everything else about the victim's input is untouched.
export function frostGrounded(f) { return f?.frost?.boundT > 0; }
export function isFrostbound(f) { return (f?.frost?.boundT ?? 0) > 0; }

// ---------------------------------------------------------------------------
// APPLY. Every ice technique in the kit ends here and nowhere else.
//
// *** IT IS PHYSICAL, AND IT APPLIES TO TOJI AND MAKI. *** The brief asks for
// this to be confirmed and it is confirmed BY CONSTRUCTION rather than by a
// check: nothing in this function reads the victim's cursed energy, their
// MAX_CE, their bar or their config. Ice is a substance that has been put on a
// body. A Heavenly Restriction has no cursed energy to resist with and is
// therefore, if anything, the one thing frost works on most straightforwardly.
// The same is true of Mahoraga (MAX_CE 0 forever) and of every summon.
// ---------------------------------------------------------------------------
export function applyFrost(match, victim, n = 1, by = null, opts = null) {
  if (!victim || !victim.alive || victim.eliminated) return 0;
  const fr = victim.frost;
  if (!fr) return 0;
  const before = fr.stacks;
  fr.stacks = Math.min(FROST.maxStacks, fr.stacks + n);
  fr.t = -FROST.refreshHold;
  if (by) fr.by = by;
  if (fr.stacks !== before) victim.emit('frost', { stacks: fr.stacks, by });
  // MAXIMUM -> the shell. Never while one is already up, never inside the
  // cooldown, and never on a body that a cinematic already owns.
  // THE ULTIMATE IGNORES BOTH GATES. `cd` exists to stop a zoner chain-shelling
  // somebody with cheap tools, and `boundT` to stop one shell refreshing
  // another — neither is a rule the once-per-round D-pad Right should be able
  // to fail silently against. Throw the glaciation wall at someone who happens
  // to be inside the 2.2 s cooldown from a Frost Calm and it must still encase
  // them, and it must UPGRADE an ordinary 0.55 s shell into the rooting one.
  const ult = !!opts?.ultRoot;
  if (fr.stacks >= FROST.maxStacks && (ult || (fr.boundT <= 0 && fr.cd <= 0))) {
    bindFrost(match, victim, by, opts);
  }
  return fr.stacks - before;
}

// States a shell must not be laid over. The same list the rest of the game
// uses for "already committed to a cinematic or already down" — putting ice
// round a body mid-execution would leave two systems writing one fighter.
// NOTE `frozen` is deliberately ABSENT: a Naoya-frozen body CAN be shelled,
// which is the stacking case written up above.
const UNBINDABLE = ['ko', 'intro', 'victory', 'transfigured', 'sentenced', 'executing', 'devoured', 'voided'];

export function bindFrost(match, victim, by = null, opts = null) {
  if (UNBINDABLE.includes(victim.state)) return false;
  if (match?.domains?.duelFreeze || match?.ritual?.running) return false;
  const fr = victim.frost;
  // THE TWO SCALES OF SHELL. Everything in the ordinary kit — the blades, the
  // shards, Frost Calm, the field — binds for FROST.duration and lets you
  // shuffle. The ULTIMATE passes `ultRoot` and gets FROST.ultDuration with the
  // movement taken away outright: the glaciation wall is supposed to encase
  // what it touches, and 0.55 s of a body still walking at 18% did not read as
  // being frozen by it at all. Both are still broken by a single hit, both
  // still leave every input alive, and both still cost the victim nothing but
  // the 1.40x. Reported from a real match: "Uraume's ult should actually
  // freeze opponents".
  const root = !!opts?.ultRoot;
  fr.boundT = root ? FROST.ultDuration : (opts?.dur ?? FROST.duration);
  fr.root = root;
  fr.cd = FROST.cooldown;
  fr.stacks = FROST.residualStacks;
  fr.shattered = false;
  fr.by = by;
  // a small bite from the ice itself, so the shell reads as an attack landing
  victim.takeChip(FROST.bindDamage, 'ct2', 'ice');
  match?.fx?.frostShell?.(victim);
  match?.sfx?.frostBind?.();
  match?.cam?.shake?.(root ? 0.36 : 0.24);
  match?.hitstop?.(root ? 8 : 5);
  match?.hud?.toast?.(victim, root
    ? '霜凪 ENCASED — ×1.40'
    : '霜凪 FROSTBOUND — ×1.40');
  victim.emit('frostbound', { by, dur: fr.boundT, root });
  by?.emit?.('frostboundLanded', { victim, root });
  return true;
}

// THE EARLY BREAK. Called from the damage pipeline on any hit that connects
// with a shelled body. This is point 3 of the Naoya distinction and it is the
// single most important line in the file: the window is spent by USING it.
export function shatterFrost(match, victim) {
  const fr = victim?.frost;
  if (!fr || fr.boundT <= 0) return false;
  fr.boundT = 0;
  fr.root = false;
  fr.shattered = true;
  match?.fx?.frostShatter?.(victim);
  match?.sfx?.frostShatter?.();
  match?.cam?.shake?.(0.3);
  victim.emit('frostShatter', {});
  return true;
}

// ---- PER-TICK -------------------------------------------------------------
// Called from Fighter.update for every fighter. A fighter with no stacks and
// no shell costs two comparisons.
export function tickFrost(f, dt) {
  const fr = f.frost;
  if (!fr) return;
  if (fr.cd > 0) fr.cd = Math.max(0, fr.cd - dt);
  if (fr.boundT > 0) {
    fr.boundT -= dt;
    if (fr.boundT <= 0) {
      fr.boundT = 0;
      fr.root = false;
      f.model?.setFrostShell?.(0);
      f.emit('frostboundEnd', {});
    }
  }
  if (fr.stacks <= 0) return;
  // NO DAMAGE OVER TIME. Frost is not burn; it does not kill anybody. The
  // whole cost of carrying stacks is on the two multipliers.
  fr.t += dt;
  if (fr.t >= FROST.decayEvery) { fr.t = 0; fr.stacks--; }
}

// ===========================================================================
// PART 2 — ICE TERRAIN
// ===========================================================================
// Uraume's real weapon. Several techniques leave frozen ground, and anyone
// standing on frozen ground SLIDES: reduced traction, longer stopping
// distance, harder to change direction. Uraume is unaffected.
//
// *** IT REUSES HANAMI'S TERRAIN CLASSIFICATION RATHER THAN BEING A SECOND
// *** SURFACE LAYER. *** arena/terrain.js already answers "what IS the surface
// at this point" through `Bounds.terrainAt`, backed by rects in a spatial
// hash that a map authors at load and that `Bounds.terrain()` can also author
// AT RUNTIME (the same door Takaba's THE SET already builds through). So a
// frozen patch is one more rect with `kind: ICE`, laid down through the
// existing authoring call and torn down again through the existing `drop`.
// There is no second query, no second grid, and no system that has to be
// asked twice what the floor is.
//
// WHAT THAT COSTS HANAMI: exactly one line, in combat/flora.js, mapping ICE to
// the ARTIFICIAL regeneration rate — because a sheet of ice over soil is not
// soil you can put roots into. His behaviour on every map, every material and
// every existing interaction is bit-identical; the only thing that changed is
// that a class which did not exist before now has an answer. See the ruling
// block in that file.
// ===========================================================================

export const ICE_TERRAIN = {
  // ---- THE TRACTION NUMBER, AND WHY IT IS THE ONLY ONE --------------------
  // `Fighter._locomote` steers with `damp(vel, target, 14, dt)`. That 14 is
  // the response rate of a fighter's legs — how fast the velocity they HAVE
  // becomes the velocity they ASKED for. Lowering it is, physically and
  // literally, less grip: the body keeps going where it was going, takes
  // longer to stop, and turns in an arc instead of on a pivot. So ice is one
  // number and it produces every symptom the brief asks for at once, rather
  // than three separate hacks that would each need their own edge cases.
  traction: 3.4,           // against the roster's 14
  dashTraction: 2.2,       // a dash on ice barely steers at all
  duration: 9.0,           // seconds a patch lasts before it thaws
  fadeAt: 1.6,             // it visibly goes clear over the last stretch

  // FIRE MELTS IT. `meltAt` is called from the same places that already tell
  // Hanami's fields they have been burnt, so the two counter-systems are
  // wired at the same call sites and neither can drift.
  meltRadiusBonus: 1.2
};

// A patch. Deliberately a flat DISC in the combat layer and a square RECT in
// the Bounds — the rect is what the terrain grid indexes, the disc is what
// decides whether your feet are on it, and the disc being inscribed in the
// rect means the visual and the query agree at the centre and disagree only at
// four corners nobody stands on.
export class IceSystem {
  constructor(match) {
    this.match = match;
    this.patches = [];      // {x,y,z,r,t,dur,owner,rect,vis}
  }

  // ---- IS THIS FIGHTER ON ICE? -------------------------------------------
  // Two independent answers, and both are needed:
  //   the PATCH LIST is authoritative for traction (it knows the owner, so
  //   Uraume can be excluded and a patch can be melted out from under someone
  //   mid-stride), and
  //   `Bounds.terrainAt` is authoritative for what the SURFACE IS (so the HUD,
  //   the debug overlay and Hanami all get one answer from one place).
  patchAt(pos) {
    for (const p of this.patches) {
      if (p.t <= 0) continue;
      if (Math.abs(pos.y - p.y) > 1.2) continue;
      const dx = pos.x - p.x, dz = pos.z - p.z;
      if (dx * dx + dz * dz < p.r * p.r) return p;
    }
    return null;
  }

  // THE ONE QUESTION THE FIGHTER ASKS. Returns null for everybody who is not
  // standing on ice, and null for the OWNER of the ice they are standing on —
  // "Uraume is unaffected" is expressed here, once, rather than as a config
  // flag that every consumer would have to remember to check.
  tractionFor(fighter) {
    const p = this.patchAt(fighter.pos);
    if (!p) return null;
    if (p.owner === fighter) return null;
    // ...and anybody else who declares `frost` walks on their own element too,
    // which today is only Uraume but is stated as a rule rather than as a name.
    if (fighter.cfg?.frost) return null;
    return p;
  }

  // ---- FREEZE GROUND ------------------------------------------------------
  freeze(owner, opts = {}) {
    const m = this.match;
    const x = opts.x ?? owner.pos.x, z = opts.z ?? owner.pos.z;
    const y = opts.y ?? owner.pos.y;
    const r = opts.radius ?? 4.0;
    const dur = opts.duration ?? ICE_TERRAIN.duration;
    // MERGE rather than stack. Re-freezing ground that is already frozen
    // refreshes it instead of laying a second rect down, so a player mashing
    // the special cannot grow an unbounded rect list.
    const live = this.patches.find(p => p.t > 0 && p.owner === owner
      && Math.abs(p.y - y) < 1.2 && flatDist(v3(x, y, z), v3(p.x, p.y, p.z)) < r * 0.45);
    if (live) {
      live.t = Math.max(live.t, dur);
      live.r = Math.max(live.r, r);
      live.vis?.resize(live.r);
      return live;
    }
    const bounds = m.arena?.bounds;
    // the rect the terrain grid indexes — an inscribed square is wrong (it
    // would leave the disc's edge unclassified), so the rect CIRCUMSCRIBES it.
    //
    // *** THE 2 cm LIFT, AND IT IS LOAD-BEARING. ***
    // `Bounds.terrainAt` resolves overlapping rects by taking the HIGHEST one
    // at or below the asking height, and it does so with a STRICT `>`. Laid at
    // exactly the floor's own y, a fresh ice rect TIES with the map's rect and
    // loses — which is precisely what the first playtest measured: the patch
    // existed, `patchAt` found it, traction changed, and `terrainAt` still
    // reported ARTIFICIAL because the map's concrete had been inserted first.
    //
    // Lifting the rect 2 cm makes it win, and the fix is right rather than
    // merely effective: a sheet of ice IS on top of the floor, by about that
    // much. It is also strictly local — nothing in arena/bounds.js changed, so
    // the tie-break every map and Hanami's regeneration already depend on is
    // untouched. 2 cm is far inside `STEP_UP` (0.55 m), so a fighter standing
    // on the floor still finds it.
    const rect = bounds?.terrain
      ? bounds.terrain(x - r, z - r, x + r, z + r, y + 0.02, ICE)
      : null;
    const p = {
      x, y, z, r, t: dur, dur, owner, rect,
      vis: m.fx?.iceSheet ? m.fx.iceSheet(x, y, z, r) : null
    };
    this.patches.push(p);
    m.sfx?.iceGround?.();
    // ---- FREEZING HANAMI'S GARDEN ------------------------------------------
    // The ruling, stated where it happens: ICE DOES NOT DELETE A ROOT FIELD,
    // IT HURTS ONE. `FloraSystem.fieldAt` is consulted BEFORE the map's
    // terrain in `terrainForPos`, so a live field keeps feeding Hanami through
    // the ice — he is standing on his own soil, there is a sheet over it, and
    // the sheet is not what his roots are in. What the freeze does do is the
    // same thing fire and a heavy swing already do: it takes a bite out of the
    // field's health, on the counter-system that already exists for exactly
    // this. So Uraume can take Hanami's FOOTING away immediately and his SOIL
    // away slowly, which is the interesting version of the matchup: the two
    // area-denial characters are fighting over the same square metres and each
    // has a real answer to the other.
    m.flora?.damageFieldsAt?.(v3(x, y, z), r, 'ice');
    return p;
  }

  // ---- FIRE MELTS ICE -----------------------------------------------------
  // Called beside every existing `flora.damageFieldsAt(..., 'fire')` site, so
  // fire's two counter-plays are wired at the same lines and one cannot be
  // added without the other being obvious.
  //
  // A melt is not a deletion: the patch is cut back from the edge inward (its
  // radius shrinks) and dies when there is nothing left. That is both the
  // correct physics and the correct game — Jogo walking a line of fire across
  // Uraume's floor should carve a path through it rather than switch it off,
  // and the player should be able to SEE the path they made.
  meltAt(pos, radius, power = 1) {
    let hit = 0;
    for (const p of this.patches) {
      if (p.t <= 0) continue;
      if (Math.abs(pos.y - p.y) > 2.0) continue;
      const d = flatDist(pos, v3(p.x, p.y, p.z));
      if (d > radius + p.r) continue;
      hit++;
      const bite = (radius + ICE_TERRAIN.meltRadiusBonus) * 0.55 * power;
      p.r = Math.max(0, p.r - bite);
      p.t -= 2.2 * power;
      // steam, at the boundary, so the melt is visible from across the arena
      const m = this.match;
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        m.fx?._spawn?.(v3(p.x + Math.cos(a) * p.r, p.y + 0.1, p.z + Math.sin(a) * p.r), {
          color: 0xe8f4ff, size: rand(0.14, 0.34), life: rand(0.5, 1.0), opacity: 0.5,
          vel: v3(rand(-0.4, 0.4), rand(1.2, 2.6), rand(-0.4, 0.4)), gravity: -1.2
        });
      }
      m.sfx?.iceMelt?.();
      if (p.r < 0.6 || p.t <= 0) this._kill(p);
      else p.vis?.resize(p.r);
    }
    return hit;
  }

  _kill(p) {
    p.t = 0;
    p.r = 0;
    if (p.rect) { p.rect.live = false; this.match.arena?.bounds?.drop?.([p.rect]); }
    p.vis?.dispose?.();
    p.vis = null;
  }

  update(dt) {
    for (let i = this.patches.length - 1; i >= 0; i--) {
      const p = this.patches[i];
      if (p.t > 0) {
        p.t -= dt;
        if (p.vis) p.vis.setFade(clamp(p.t / ICE_TERRAIN.fadeAt, 0, 1));
        if (p.t <= 0) this._kill(p);
      }
      if (p.t <= 0 && !p.vis) this.patches.splice(i, 1);
    }
  }

  // round reset / teardown. Every rect comes back out of the Bounds, so a
  // round that ended on a frozen arena does not start the next one on one.
  clear() {
    for (const p of this.patches) this._kill(p);
    this.patches.length = 0;
  }

  count() { return this.patches.filter(p => p.t > 0).length; }
}
