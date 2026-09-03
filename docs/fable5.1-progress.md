# fable5.1 — progress ledger

Kept current on every commit so a fresh session can resume from git alone.
Branch: `fable5.1` (mirrored to `claude/fable5-1-redesign-py3b9r`). Rules:
only `fable5.1/`, `vite.config.js`, `README.md`, `docs/` may change.

## Done
- Phases 0–5 first pass (see fable5.1-summary.md): render stack, authoring
  layer + 39 looks, front end, combat core + tests, ten maps, training mode.

## Done (continued)
- (1) Finishers ported: `fable5.1/src/finishers/*` (director, retarget, fight/moves clips, shots, registry, overlay, audio, config) + the old fx library as `fx/legacy/*` (FX extends FXSystem) + the old sfx library as `audio/legacy-sfx.js` (Sfx extends LegacySfx). Hook: Match._startKO sets `_matchPoint`; `_logicTick` calls `finishers.tryBegin(winner)` at phaseT>1.4; Match.update defers to the director while active. Verified headless: `playtest.mjs ... --finisher` reaches `gojo_purple`.

- (2)(3)(4) Delivered by porting the old runtime wholesale under the new
  renderer/models/front end: `combat/legacy/*` (fighter, effects, hits, all
  per-character systems, the five domain minigames, ritual, ai, match),
  `stage/legacy/*` (old arena kit, ten maps, destructibles, terrain),
  `art/legacy/*` (old builders/rig/rig3d/shaders incl. x-ray), old HUD in a
  shadow DOM (`ui/legacy/host.js`), old camera (`render/camera-legacy.js`).
  `app/game.js` builds `LegacyMatch` by default; `opts.lite` keeps the small
  tested core (benches/tests). CharacterModel hooks the old systems call are
  shims in `art/character/build.js`. Training overlay adapted to both
  (`m.cpu` / `m.dummyInput` on the legacy match). Verified headless: fight,
  training, KO/result flow; `playtest.mjs --fast N` steps the sim faster.
- (5) Online: `net/*` copied (client/config/lobby/protocol/session/sync),
  `net/flow.js` = old onlineflow with `onStart/onClosed` hooks for the screen
  router, old online panels in their own shadow root (`legacyShadow`). New
  lobby screen (host / join open game), select screen in online mode
  (attachSelect, setPicks, A to start when canStart), result screen
  host-authoritative (`setLocked`/`decided`), pause → LEAVE THE MATCH.
  Not tested against a live backend from here (no network); code paths are
  the old game's.
- (6) Telemetry (`net/telemetry.js`, `startVisit('fable5.1')`, trackMatch /
  trackResult), CPU profiles (old ai.js in legacy), `?render3d` hooked in
  `roster/index.js` makeCharacter/makeSummon via `art/legacy/rig3d`.

## In progress
- (6) faces pass on the viewer bench; (7) docs/summary refresh.

## Old note on (1): copying `src/finishers` → `fable5.1/src/finishers`, adapting
  imports (`core/math.js`, `art/geo.js`, `art/shaders/toon.js`), match
  touchpoints (`hud.setHidden`, `cams`, `fx.hitSpark/guardSpark`,
  `arena.bounds`), and a `fx/comedy.js` port for confetti / piano /
  commandPulse. Hook: `Match._startKO` → `finishers.tryBegin(winner)`;
  `Match.update` runs the director while active.

## Next (in order)
- Per-system smoke passes on the legacy runtime (each character's B/special
  system, each domain) with `playtest.mjs <p1> <p2> <map> --fast 2`; fix any
  CharacterModel hook the old code expects that the shim lacks.
- Faces pass; summary doc refresh (PERF table, "what is missing" section is
  now stale); push `fable5.1` + mirror branch.

## How to verify at any point
`npm run build && node fable5.1/test/run.mjs && node fable5.1/tools/playtest.mjs gojo nanami shibuya_crossing --mode local`
