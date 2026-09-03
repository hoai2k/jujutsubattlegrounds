# `fable5.1` — what changed, what it costs, what is not there yet

The redesign lives in `fable5.1/` and is served at `/fable5.1/`. The game at
`/` is untouched. This is the honest ledger against the brief and against the
old game; the direction it was built to is in
[fable5.1-direction.md](fable5.1-direction.md).

## What the new version does differently

**Rendering (Phase 1).** Linear working space, sRGB output, ACES filmic at
1.18 exposure. A key / rim / fill / hemisphere rig whose shadow frustum
follows the fighters, so a 2048 map is spent on the bodies and a hand across
a chest actually casts on the jacket. One post stack per eye:
Render → Bloom → Look → FXAA → Output. The Look pass carries the grade
(vignette, tint, lift, saturation, contrast), the hit flash, chromatic
aberration and radial blur from a screen-space origin, a zoom pulse, and the
**impact frame** — a two-to-four-frame two-tone ink treatment on heavies,
knockdowns, counters, transforms, domain openings and the KO. Contact-shadow
decals under every fighter on every tier. Tiers are real: LOW is a direct
render with no composer and no shadow map; MEDIUM adds the shadow map and the
Look pass; HIGH adds bloom, aberration and FXAA; ULTRA raises resolution and
the particle budget.

**Models (Phase 2).** A character is a *description*: build preset, height,
skin, face, hair style, outfit pieces in layering order, features, palette
(`roster/specs/`). The assembler (`art/character/`) makes a rigged, skinned,
outlined, spring-driven model from it through generator libraries — 13 hair
styles, 28 garment pieces, 16 features including five non-human heads. All 32
characters and 7 variant looks are described this way; the whole roster is
about 600 lines of data where the old `src/art/models` was 49k lines of
assembly. The painted-cel shader has authored ramps (soft skin terminator,
hard cloth), a tinted dark band, a back-lit fresnel rim, gloss for hair and
metal, and a fur response for Panda; materials are cached per archetype so
the roster shares a few dozen programs. Hair, coat tails, ties, sashes,
blindfold tails, barbels and antennae are spring chains. The old game's
animation clips are ported verbatim (same skeleton, same retargeting), so
every stance and signature clip is the one the old game had.

**UI (Phase 3).** A new front end: title (kanji watermark, live turntable),
mode select, character select (per-seat cursors, a live preview beside the
hero panel, variants on the tile, random, last pick remembered), stage select
with live map previews and best-of / difficulty on the same screen, a HUD
whose hierarchy is health → timer → MAX/CURRENT meter → stamina → cooldown
slots, with a ghost-drain on health, a combo counter that punches, state
words (LAUNCH / DOWN / COUNTER / GUARD BREAK / TECH), damage numbers by
weight, technique cut-ins, taunt bubbles, buff timers; pause (pauses the
audio too), results with a fast rematch, an online lobby shell, and settings
(quality, four persisted volumes, announcer, key and pad remapping, deadzone,
rumble, camera invert, reduced motion). Every screen is fully gamepad
navigable; the wipe transition respects `prefers-reduced-motion`.

**Code (Phase 4).** `combat/` is ~1.9k lines where the old `fighter.js` +
`effects.js` alone were 14.5k. Hit judgement is a pure function
(`hits.js`) with 16 node tests; the fighter state machine is tested on a stub
model; roster integrity and effect-table coverage are tested across every
pick. Techniques resolve on a 14-word vocabulary (projectile, melee, burst,
zone, beam, grab, rush, pull, buff, transform, summon, volley, counter,
speech) through one table that maps every effect key the configs use.

**Feel (Phase 5).** Hit-stop by weight (light 4f → crit 10f), screen shake
with trauma decay, FOV punches, camera push-ins on ultimates and domain casts,
KO slow-motion with an orbiting sweep, round-intro sweep, a layered
synthesized SFX set (noise crack + sub thump + tonal ring, panned by screen
position, through a small room), an announcer (speech synthesis where the
browser has it, stingers everywhere), music ducking under the announcer,
rumble on both sides of every hit, and a training mode with live frame data
and on-hit / on-block advantage.

**Small improvements landed** (all logged in commit messages): 6-frame input
buffer; dash-cancel window on recovery at 60%; the deliberate-dash burst;
remappable controls with deadzone and rumble; pause that pauses audio; fast
rematch; select hover previews, random pick, last pick remembered; wipes so
no transition shows a blank frame; persisted volumes and mute-on-blur; damage
numbers; hit sparks that distinguish light / heavy / knockdown / counter;
combo counter that punches; KO slow-mo; F3 perf overlay (`?perf`) and F2
screenshot; benches that build from the same pipeline as the game.

## What it costs

Measured with `fable5.1/tools/mapperf.mjs` in headless Chromium on
SwiftShader (a software rasteriser, so the numbers are relative, not what a
GPU will see). Per-map median frame time, 1100×620, a CPU match in progress:

| map | LOW median ms | HIGH median ms | draw calls (HIGH) | triangles |
|---|---|---|---|---|
| shibuya_underground | 82 | 335.6 | 73 | 86k |
| shibuya_crossing | 97.7 | 337.2 | 69 | 87k |
| sendai_school | 87.7 | 250.2 | 68 | 89k |
| jujutsu_high | 164.6 | 258.7 | 59 | 92k |
| detention | 313.2 | 333.2 | 59 | 88k |
| shinjuku | 181.4 | 252.3 | 60 | 86k |
| kyoto_grounds | 231.3 | 307.2 | 66 | 93k |
| star_tomb | 149.2 | 349.1 | 53 | 87k |
| yasohachi_bridge | 126.9 | 298.8 | 56 | 88k |
| sewer_lair | 112.5 | 300.6 | 57 | 86k |

The tiers do what they say: LOW drops the composer and the shadow map, and on
a software rasteriser that is worth roughly the difference above. On a
mid-range iGPU the HIGH tier's cost is dominated by the 2048 PCF-soft shadow
map and the bloom's mip chain; MEDIUM is the recommended tier for a 1080p
iGPU and LOW for anything integrated and older.

Draw calls per map are in the low dozens (statics are merged per material;
characters are five to seven meshes plus their outline hulls); triangle
counts are 60–140k on the heaviest maps.

## The second pass: the old runtime under the new game

The first pass shipped a small combat core with the systems reduced to
archetypes, and a list of what that left out (online, the bespoke domain
minigames, the per-character systems, finishers, destructibles, the x-ray
dissolve, telemetry, `?render3d`, the per-character CPU profiles). The second
pass closes that list by porting the old runtime wholesale rather than
re-implementing it against the small core, and running it under the new
renderer, models, camera stack and front end:

- `combat/legacy/` — the old fighter, effects, hit resolution, every
  per-character system (shikigami, curses, corpses, Judgeman, minions,
  Reggie's objects and drone, the radial wheels, Panda's cores, Ino's masks,
  Toji's arsenal, Maki's weapons and awakening, Naoya's stance and freeze,
  Yuki's mass, Inumaki's speech, Uro's flight and reflect, Kurourushi's
  growth, Ryu's output, Kashimo's charge, Choso's blood, Nobara's nails and
  essence, Hakari's kit, Sukuna's fire arrow, Nanami's ratio sweep), the
  five domain minigames (the execution duel, the sword rain, the jackpot
  reels, Takaba's set, Megumi's summon ritual), the per-character CPU
  profiles, and the match itself. `app/game.js` builds this match by
  default; the small core stays for benches and the node tests (`opts.lite`).
- `stage/legacy/` — the old arena kit with its destructible geometry, and
  `art/legacy/shaders/xray.js` for the occlusion dissolve, both driven by the
  old match's render pass.
- The old HUD runs inside a shadow root (`ui/legacy/host.js`) so its
  stylesheet never touches the new screens; the old camera runs as
  `render/camera-legacy.js` and the old fx / sfx libraries are the base
  classes of the new ones.
- `finishers/` — the old director, clips, registry, overlay and audio.
- `net/` — the old InstantDB transport, lobby, session, lockstep sync and
  seat takeover, with `net/flow.js` (the old online controller) driving the
  new lobby screen, an online character select, a host-authoritative result
  screen and a clean leave from pause. Telemetry (`net/telemetry.js`) starts
  a visit for the `fable5.1` page and tracks matches and results.
- `?render3d` is hooked into `makeCharacter` / `makeSummon` through the old
  `rig3d` stack (`docs/render3d.md`); the default path stays procedural.

The new `CharacterModel` answers the hooks the old systems call
(`setSubmerged`, `setSukuna`, `setCharge`, `setJackpot`, …) with the closest
thing it has — most map onto the energy glow — so a character-specific body
transform that the old models did with bespoke geometry is a glow and a
palette shift here. That is the honest remaining gap: the systems run, the
bespoke bodies for them are the next art pass.

Headless verification of this pass: every roster character fights every
other in a round-robin smoke (`playtest.mjs --fast 3`) with no page errors,
training and the KO → result flow run on the ported match, and the old game
at `/` is unchanged (`tools/oldcheck.mjs`). Online was not exercised against
a live backend from the build environment (no outbound network); the code
paths are the old game's, unchanged below the controller.

## How to check it

```
npm run dev            # http://localhost:5173/fable5.1/
node fable5.1/test/run.mjs
node fable5.1/tools/playtest.mjs gojo nanami shibuya_crossing --mode local --shot out.png
node fable5.1/tools/mapperf.mjs --quality high
```

Benches: `/fable5.1/#viewer?pick=sukuna&clip=heavy` and
`/fable5.1/?bench=lineup` (`&picks=…`, `&clip=walk`, `&all`).
