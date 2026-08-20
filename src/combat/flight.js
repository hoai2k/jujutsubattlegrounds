// FLIGHT — Uro's passive, and the first fighter in this project who is not
// obliged to come back down.
// ===========================================================================
// WHAT IT IS. She hovers. Airborne, gravity does not apply to her while she has
// the stamina to hold herself up, and her aerial normals, techniques and dash
// are as good as her grounded ones. She is the only true aerial character in
// the roster and this file is the whole of it.
//
// WHAT IT IS NOT. It is not a double jump, not a glide, and not a flight MODE
// with its own button. There is no new input: the existing jump button gets
// her off the ground and the existing `jump`/`fall` states get her into the
// air, and from there she simply does not fall. That matters — a permanently
// airborne character who also needed a new control would be two things to
// learn at once, and everything else in the kit is already new.
//
// ---------------------------------------------------------------------------
// EVERY FUNCTION HERE IS A NO-OP FOR A FIGHTER WITHOUT `cfg.flight`
// ---------------------------------------------------------------------------
// Same discipline combat/charge.js, combat/mass.js and combat/awakening.js
// already follow: the call sites in combat/fighter.js are UNCONDITIONAL and
// every helper returns the identity value for the rest of the roster, so there
// is no `if (isUro)` anywhere in the state machine and nobody else's physics
// moved by a single float.
//
//   gravityScale(f)   1 for everyone; ~0 for a hovering Uro
//   tickFlight(...)   the whole per-frame rule
//   hovering(f)       the flag the HUD, the CPU and the finisher director read
//
// ---------------------------------------------------------------------------
// THE LEASH, AND WHY IT IS STAMINA RATHER THAN A TIMER
// ---------------------------------------------------------------------------
// Stamina is the one resource in this game that is already spent by MOVING
// (the dash drains it, the dash burst charges for it) and already regenerates
// only when you are not moving. Hanging her flight off it means the trade is
// legible without a single new bar: every second she spends in the air is a
// dash she cannot throw, and a Uro who has been flying all round has no dodge
// when someone finally reaches her. A separate flight meter would have been a
// second thing to watch and would have let her be airborne AND evasive at the
// same time, which is precisely the degenerate version.
//
// Two rates, because holding station and climbing are not the same effort:
//   HOLD   `drain`     — hovering in place or drifting
//   CLIMB  `climbDrain`— while the jump button is held and she is rising
// She falls out of the sky when the bar empties, and the fall is a real
// `fall` state with real gravity: getting her stamina to zero is a win.
//
// ---------------------------------------------------------------------------
// THE CEILING — THE PART THAT ACTUALLY TOOK THE WORK
// ---------------------------------------------------------------------------
// Ten of the maps are multi-level and several have real interiors. An
// unbounded hover breaks all of them, so the altitude cap is the MINIMUM of
// three separate limits, recomputed every frame at her own x/z:
//
//   1. HER OWN CEILING     `cfg.flight.maxHeight` above the floor DIRECTLY
//      BELOW HER. Measured against the local floor, not against y=0, so
//      standing over a 12 m rooftop does not buy her 12 extra metres — she
//      gets the same headroom everywhere, which is what keeps the number
//      meaningful on Shibuya Underground and on Shibuya Crossing alike.
//   2. THE ARCHITECTURE    `bounds.ceilingAt` — the lowest walkable surface
//      over her head, less `headroom`. This is what stops her rising through
//      the hall roof at Jujutsu High, the mezzanine in the underground and
//      every awning in the game. See the note on that method in arena/bounds.js.
//   3. THE MAP'S OWN LID   an optional `flightCeiling` on the map definition,
//      absolute metres, for anywhere the geometry does not describe the
//      intent — an open-topped room whose walls she should not clear.
//
// The cap is a SOFT one: she is clamped to it and her upward velocity is
// killed, rather than being collided with. A hard collider overhead would let
// a low awning trap her under it, and "the ceiling holds her down" is much
// easier to read than "the ceiling grabs her".

// ---------------------------------------------------------------------------
export const FLIGHT_DEFAULTS = {
  maxHeight: 7.0,       // metres above the floor under her
  headroom: 0.55,       // clearance she keeps below any surface overhead
  climbSpeed: 6.2,      // m/s while the jump button is held
  sinkSpeed: 1.15,      // m/s of gentle settle when it is not
  drain: 13,            // stamina/s holding station
  climbDrain: 21,       // stamina/s climbing
  enterCost: 6,         // one-off, on the frame she takes to the air
  minStamina: 5,        // below this she cannot start a hover at all
  airSpeed: 4.9,        // horizontal top speed while hovering
  airAccel: 17,
  airDashSpeed: 9.2,
  airDashDrain: 30
};

export function hasFlight(f) { return !!f?.cfg?.flight; }

// The per-frame flag. True only while she is genuinely holding herself up —
// not during the rise off the ground, not while falling out of the sky with an
// empty bar. Everything outside this file reads THIS rather than inspecting
// states, so "is she flying" has exactly one answer.
export function hovering(f) { return !!f && f.hoverT > 0 && !f.grounded; }

// Gravity multiplier for combat/fighter.js `_physics`. 1 for the entire
// existing roster, and for Uro whenever she is not actually hovering.
export function gravityScale(f) {
  return hovering(f) ? 0 : 1;
}

// Speed multiplier applied to her aerial locomotion. Separate from the shared
// `speedMult` so a slow (Cursed Speech SLEEP, Star Rage mass) still lands on
// her in the air.
export function airSpeedOf(f) {
  const fl = f?.cfg?.flight;
  return fl ? (fl.airSpeed ?? FLIGHT_DEFAULTS.airSpeed) : 0;
}

export function resetFlight(f) {
  f.hoverT = 0;
  f.hoverCeil = Infinity;
  f._hoverEnter = false;
}

// The altitude ceiling at her current position, in world metres. Exported so
// the CPU and the map verification harness can ask the same question the
// physics does rather than approximating it.
export function ceilingFor(f, ctx) {
  const fl = { ...FLIGHT_DEFAULTS, ...(f.cfg.flight || {}) };
  const b = ctx?.match?.arena?.bounds ?? f.bounds;
  // 1. her own ceiling, measured off the floor UNDER her
  const floor = b ? b.floorAt(f.pos.x, f.pos.z, f.pos.y + 0.5) : 0;
  let cap = floor + fl.maxHeight;
  // 2. the architecture over her head
  if (b?.ceilingAt) {
    const over = b.ceilingAt(f.pos.x, f.pos.z, f.pos.y);
    if (Number.isFinite(over)) cap = Math.min(cap, over - fl.headroom);
  }
  // 3. the map's own declared lid, if it has one
  const lid = ctx?.match?.arena?.def?.flightCeiling;
  if (typeof lid === 'number') cap = Math.min(cap, lid);
  // never below the floor she is standing over: a ceiling lower than her own
  // head would push her through the deck
  return Math.max(floor + 0.35, cap);
}

// ---------------------------------------------------------------------------
// THE PER-FRAME RULE
// ---------------------------------------------------------------------------
// Called from the `jump` / `fall` branch of the state machine and from nowhere
// else. Returns true if she is holding herself up this frame, which is what
// tells the caller to stay in the aerial states instead of landing.
export function tickFlight(f, input, ctx, dt) {
  if (!hasFlight(f)) return false;
  const fl = { ...FLIGHT_DEFAULTS, ...(f.cfg.flight || {}) };

  if (f.grounded) { f.hoverT = 0; f._hoverEnter = false; return false; }

  // ---- can she hold herself up at all? ----------------------------------
  // Four things take it away, and every one of them is a real counterplay:
  //   · an empty stamina bar
  //   · being hit into a reaction state (the caller never reaches here)
  //   · a hostile domain that has frozen her (same)
  //   · Cursed Speech, whose forced-movement states own her legs and her sky
  const starting = f.hoverT <= 0;
  const floor = f.res.stamina;
  if (starting && floor < fl.minStamina) return false;
  if (floor <= 0) {
    if (f.hoverT > 0) { f.hoverT = 0; f.emit('hoverDrop'); }
    return false;
  }
  if (f.forced || f.rootT > 0 || f.frozenT > 0) { f.hoverT = 0; return false; }

  if (starting) {
    f.res.stamina = Math.max(0, f.res.stamina - fl.enterCost);
    f.emit('hoverStart');
  }
  f.hoverT += dt;

  // ---- vertical ----------------------------------------------------------
  const cap = f.hoverCeil = ceilingFor(f, ctx);
  const climbing = !!input?.jump && f.pos.y < cap - 0.02;
  if (climbing) {
    f.vel.y = fl.climbSpeed;
    f.res.stamina = Math.max(0, f.res.stamina - fl.climbDrain * dt);
  } else {
    // NOT zero. A dead-still hover reads as a bug — a character standing on
    // nothing. A slow settle plus the idle clip's own bob is what makes it
    // read as holding position rather than as being pinned there.
    f.vel.y = -fl.sinkSpeed;
    f.res.stamina = Math.max(0, f.res.stamina - fl.drain * dt);
  }
  if (f.pos.y > cap) { f.pos.y = cap; if (f.vel.y > 0) f.vel.y = 0; }

  return true;
}

// ---------------------------------------------------------------------------
// AERIAL LOCOMOTION
// ---------------------------------------------------------------------------
// Her horizontal control while hovering. Deliberately SLOWER than her run
// (4.9 against 5.6): the air is where she wants to be, so it should not also
// be where she is fastest. The air dash is the exception and it is the same
// deliberate-input burst everyone else's ground dash is.
export function airLocomote(f, input, ctx, dt) {
  const fl = { ...FLIGHT_DEFAULTS, ...(f.cfg.flight || {}) };
  const m = f._moveVec(input?.move ?? { x: 0, z: 0 }, ctx.camYaw);
  const mag = Math.hypot(m.x, m.z);
  const dashing = !!input?.dash && f.res.stamina > 1 && mag > 0.1;
  const speed = (dashing ? fl.airDashSpeed : fl.airSpeed) * f.speedMult;
  if (dashing) f.res.stamina = Math.max(0, f.res.stamina - fl.airDashDrain * dt);
  const k = Math.min(1, fl.airAccel * dt);
  f.vel.x += (m.x * speed - f.vel.x) * k;
  f.vel.z += (m.z * speed - f.vel.z) * k;
  return dashing;
}

// ---------------------------------------------------------------------------
// FORCING HER DOWN
// ---------------------------------------------------------------------------
// One call, used by everything that has to put her on the floor and must not
// have to know how flight works to do it: the finisher director before a
// cinematic, the round reset, a KO, and the domain systems that stage bodies.
export function groundFlight(f) {
  if (!hasFlight(f)) return;
  f.hoverT = 0;
  f._hoverEnter = false;
  const b = f.bounds;
  if (b) f.pos.y = b.floorAt(f.pos.x, f.pos.z, f.pos.y + 0.5);
  else f.pos.y = 0;
  f.vel.y = 0;
  f.grounded = true;
}
