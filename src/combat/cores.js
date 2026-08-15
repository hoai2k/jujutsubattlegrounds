// THE THREE CORES 呪骸核 — Panda's health system, and the only multi-pool
// health in the game.
//
// He is an Abrupt-Mutation Cursed Corpse with THREE cursed cores where a corpse
// has one, and canon names all three: an older sister (TRICERATOPS), a middle
// brother (GORILLA) and the baby brother he normally is (PANDA). Each is a
// different fighter, each has its OWN health pool, and damage taken in a core
// damages THAT core.
//
// ---------------------------------------------------------------------------
// HOW THIS AVOIDED REWRITING THE DAMAGE PIPELINE
// ---------------------------------------------------------------------------
// `res.hp` is redefined on HIS fighter, and only his, as an ACCESSOR onto the
// active core's pool. That single line is why nothing in the game had to learn
// that a fighter can have three health bars:
//
//   this.res.hp -= dmg           in nine places in fighter.js
//   f.res.hp = Math.min(...)     in flora.js, jackpot.js, effects.js
//   caster.res.hp -= dmg         in domains.js, sentencing.js
//   f.res.hp / f.maxHP           in hud.js
//
// every one of those keeps working, unmodified, and every one of them now
// operates on whichever core is currently exposed. A `cores` array with an
// `applyDamageToCore` helper called from each damage site would have been the
// obvious design and it would have meant auditing and editing all fourteen of
// those, with the certainty of missing one — and the one missed would be a
// silent immortality bug rather than a crash.
//
// WHAT DID HAVE TO CHANGE, and it is a short list (the delivery notes carry it
// in full):
//   · `Fighter.alive`   — "any core alive", not "hp > 0", because a fighter
//                         whose active core just hit zero is not dead.
//   · `Fighter.maxHP`   — the ACTIVE core's maximum, so every heal clamp in
//                         the game (Hanami's regen, Hakari's RCT, Kurourushi's
//                         devour) tops up the exposed core and no further.
//                         Three of those were reading `cfg.stats.hp` directly
//                         and now read `maxHP`; for everyone else the two
//                         values are identical, so nothing else moved.
//   · `resetForRound`   — has to restore three pools, not one.
//   · `finishInstantKO` — has to zero all three. See the ruling below.
//
// ---------------------------------------------------------------------------
// INSTANT KO vs THREE CORES — THE RULING
// ---------------------------------------------------------------------------
// Mahito's transfiguration and Higuruma's execution KILL HIM OUTRIGHT. They do
// not destroy one core.
//
// The reasoning is the same for both and it is about what the effects ARE.
// Idle Transfiguration reshapes a SOUL; Deadly Sentencing carries out a
// sentence on a PERSON. Panda has three cores but he is one person with one
// soul in one body — the cores are organs, not lives, and the fandom's own
// framing (three siblings living in one corpse) is a description of his
// psychology, not of him having three bodies to lose. An execution that only
// destroyed a kidney would not be an execution.
//
// It also falls out of the code rather than being bolted on, which is the
// strongest argument that it is the right line: `Fighter.alive` already reads
// the `instantKO` stamp BEFORE it reads any health, so both effects already
// killed him outright the moment they were written. All `killAllCores` adds is
// that the HUD strip agrees with the result.
//
// The counterpart ruling — that ORDINARY damage never leaks between cores, so
// nothing else in the game can take two pools at once — is enforced by the
// accessor above, structurally.
//
// ---------------------------------------------------------------------------
// WHY HE IS NOT SIMPLY A BIG HEALTH BAR
// ---------------------------------------------------------------------------
// Because the pools are not fungible. Killing him takes the SUM, but taking a
// STANCE off him takes only that stance's pool — so an opponent who focuses him
// while he is in Gorilla does not merely damage him, they permanently delete
// the punish half of his kit for the rest of the match. The skill of the
// character is deciding which of his three fighters is allowed to bleed, and
// the counter-skill is refusing to let him choose.

// Build the runtime array from a config. Returns null for everyone else, which
// is what every `if (this.cores)` in the codebase is testing.
export function buildCores(cfg) {
  const c = cfg.cores;
  if (!c) return null;
  return c.order.map(key => {
    const d = c.defs[key];
    return {
      key, name: d.name, jp: d.jp, short: d.short,
      hp: d.hp, max: d.hp, alive: true
    };
  });
}

// Reset all three pools to full. Called from resetForRound, which cannot use
// the plain `res.hp = stats.hp` line every other fighter uses because that
// would refill exactly one of them.
export function resetCores(f) {
  if (!f.cores) return;
  const defs = f.cfg.cores.defs;
  for (const c of f.cores) {
    c.max = defs[c.key].hp;
    c.hp = c.max;
    c.alive = true;
  }
  f.coreIndex = 0;
  f.stance = f.cores[0].key;
}

export function coresAlive(f) {
  return f.cores ? f.cores.filter(c => c.alive && c.hp > 0).length : 0;
}

// The next surviving core in ring order, starting after `from`. Returns null if
// he is down to the one he is standing in (or to none).
export function nextCore(f, from = f.coreIndex) {
  if (!f.cores) return null;
  const n = f.cores.length;
  for (let i = 1; i < n; i++) {
    const k = (from + i) % n;
    if (f.cores[k].alive && f.cores[k].hp > 0) return k;
  }
  return null;
}

export function coreIndexOf(f, key) {
  return f.cores ? f.cores.findIndex(c => c.key === key) : -1;
}

// Total health remaining across every pool. Used by the ultimate's scaling and
// by the debug overlay; deliberately NOT by the HUD, which shows the pools
// separately because the whole point is that they are separate.
export function totalHP(f) {
  return f.cores ? f.cores.reduce((a, c) => a + Math.max(0, c.hp), 0) : f.res.hp;
}
