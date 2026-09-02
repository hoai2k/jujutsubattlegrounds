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

| map | LOW median ms | HIGH median ms | draw calls | triangles |
|---|---|---|---|---|
| shibuya_underground | 82 | (pending) | 42 | 86k |
| shibuya_crossing | 97.7 | (pending) | 34 | 87k |
| sendai_school | 87.7 | (pending) | 34 | 89k |
| jujutsu_high | 164.6 | (pending) | 29 | 92k |
| detention | 313.2 | (pending) | 30 | 88k |
| shinjuku | 181.4 | (pending) | 32 | 86k |
| kyoto_grounds | 231.3 | (pending) | 33 | 93k |
| star_tomb | 149.2 | (pending) | 27 | 87k |
| yasohachi_bridge | 126.9 | (pending) | 30 | 88k |
| sewer_lair | 112.5 | (pending) | 30 | 86k |

The tiers do what they say: LOW drops the composer and the shadow map, and on
a software rasteriser that is worth roughly the difference above. On a
mid-range iGPU the HIGH tier's cost is dominated by the 2048 PCF-soft shadow
map and the bloom's mip chain; MEDIUM is the recommended tier for a 1080p
iGPU and LOW for anything integrated and older.

Draw calls per map are in the low dozens (statics are merged per material;
characters are five to seven meshes plus their outline hulls); triangle
counts are 60–140k on the heaviest maps.

## What was deliberately left undone

- **Online play.** The lobby screen exists; the InstantDB transport,
  rollback sync and seat takeover of the old game were not ported. The old
  netcode is 1.8k lines tied to the old fighter's state names.
- **Bespoke domain minigames.** Every domain casts, clashes on refinement,
  ticks its sure-hit, can be simple-domained and barrier-broken, and pays
  backlash on the same numbers as before. The execution duel, the sword rain
  roll table, the jackpot reels, Takaba's set, and Megumi's summon ritual are
  not reproduced; those domains run the generic barrier + sure-hit.
- **Character systems reduced to archetypes.** Megumi's shikigami, Geto's
  curses, Yaga's corpses, Higuruma's Judgeman, Mahito's minions and Reggie's
  drone are all "summons": an energy construct that pursues and strikes.
  The three radial wheels, Panda's cores, Ino's masks, Toji's arsenal, Maki's
  weapons, Naoya's stance and Yuki's commands are a stance cycle on B.
  Inumaki's speech is a cone with the command's effect kind. Uro's flight,
  Kurourushi's growth, Ryu's output tiers, Kashimo's charge, Choso's blood
  gauge, Nobara's essence and Hakari's jackpot kit are approximated by buffs
  or absent.
- **Finishers.** The old game's 3.3k-line finisher registry and its cinematic
  moves are not ported; a KO is the slow-motion sweep.
- **Destructible level geometry** and the x-ray occlusion dissolve are not
  ported; the new camera pulls in along its ray instead.
- **Visitor telemetry** is not wired into the new page.
- **Faces** are the sculpted head with planar decals; they read at gameplay
  distance but are the weakest part of the models close up, and are the first
  thing to iterate on the viewer bench.

## What is still missing compared to the old game at `/`

Everything in the section above, plus: the `?render3d` runtime-`.glb` swap
(the old path still works at `/`), the workbench benches (finishers, faces,
verification), and the per-character CPU profiles (the new CPU has four
personalities keyed by character id).

## How to check it

```
npm run dev            # http://localhost:5173/fable5.1/
node fable5.1/test/run.mjs
node fable5.1/tools/playtest.mjs gojo nanami shibuya_crossing --mode local --shot out.png
node fable5.1/tools/mapperf.mjs --quality high
```

Benches: `/fable5.1/#viewer?pick=sukuna&clip=heavy` and
`/fable5.1/?bench=lineup` (`&picks=…`, `&clip=walk`, `&all`).
