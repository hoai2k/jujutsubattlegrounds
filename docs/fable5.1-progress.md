# fable5.1 — progress ledger

Kept current on every commit so a fresh session can resume from git alone.
Branch: `fable5.1` (mirrored to `claude/fable5-1-redesign-py3b9r`). Rules:
only `fable5.1/`, `vite.config.js`, `README.md`, `docs/` may change.

## Done
- Phases 0–5 first pass (see fable5.1-summary.md): render stack, authoring
  layer + 39 looks, front end, combat core + tests, ten maps, training mode.

## In progress
- (1) Finishers: copying `src/finishers` → `fable5.1/src/finishers`, adapting
  imports (`core/math.js`, `art/geo.js`, `art/shaders/toon.js`), match
  touchpoints (`hud.setHidden`, `cams`, `fx.hitSpark/guardSpark`,
  `arena.bounds`), and a `fx/comedy.js` port for confetti / piano /
  commandPulse. Hook: `Match._startKO` → `finishers.tryBegin(winner)`;
  `Match.update` runs the director while active.

## Next (in order)
- (2) Domain minigames: execution duel, sword rain, jackpot reels, the set,
  summon ritual. Old sources: `src/domains/sentencing.js`, `swordrain.js`,
  `jackpot.js`, `src/combat/theset.js`, `src/core/ritual.js`.
- (3) Per-character systems (old `src/combat/*.js`: shikigami, curses,
  construction, judgeman, minions, receipts, wheels, cores, beasts, arsenal,
  weapons, awakening, mass, speech, flight, reflect, gluttony/growth, output,
  charge, blood, nails/essence, hakari kit, fire arrow, ratio sweep).
- (4) Destructibles + x-ray (`src/arena/destruct.js`, `src/art/shaders/xray.js`).
- (5) Online (`src/net/*`, `src/core/onlineflow.js`, `src/ui/online.js`).
- (6) Telemetry, CPU profiles, render3d, faces.
- (7) Docs + checks + push.

## How to verify at any point
`npm run build && node fable5.1/test/run.mjs && node fable5.1/tools/playtest.mjs gojo nanami shibuya_crossing --mode local`
