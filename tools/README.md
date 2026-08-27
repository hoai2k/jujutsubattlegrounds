# tools/ — headless verification harnesses

Dev-only. Nothing here ships: `vite.config.js` builds `index.html`,
`workbench/index.html` and `stats/index.html`, and none of them reach this
directory.

These exist because two claims about a new character are easy to make and hard
to check, and both had to be checked for Uraume and Ryu:

- **"the model reads from every angle"** — `shoot.mjs` and `lineup.mjs` drive
  the VIEWER'S OWN `sheet` / `castSheet` / `lineup` helpers in a real browser,
  so the images are the ones the viewer produces (same lights, same materials,
  same outline pass) rather than a second renderer that could disagree with it.
  Six passes of Uraume and four of Ryu were shot this way, and between them
  they found an inverted lathe winding, a 1.3-kilometre hakama and a
  four-times-oversized set of cloth flaps, none of which is visible in code.

- **"the character plays"** — `playtest.mjs` boots the real game, skips the
  menus through the existing `__skipSelect` dev hook, and then overrides
  `InputManager.pollAll` for seat 0. That last part is the important one: the
  scripted frames go through the SAME path a keyboard's do, so every press is
  resolved by `startCT`, `_stateLogic` and the effect dispatcher exactly as a
  player's would be. It found the two bugs that mattered — Brace reading an
  input field that does not exist, and ice terrain losing a height tie to the
  map's own rect.

- **"the imported model won't cost the frame rate"** — `decimate.mjs` shrinks a
  `.glb` for `?render3d` and then PROVES the shrink was safe. Everything in
  `public/models/manifest.json` (`boneMap`, `joints`, `pose`, `rotOffset`) is
  keyed to bone names and bone-local frames, and every automatic pass (bone
  mapping, hierarchy rerig, twist alignment, height fit) is re-derived at load
  from the skeleton — so a decimation that leaves the skeleton alone leaves
  every workbench fix applying. The tool diffs the before/after skeletons bone
  by bone and refuses to report success if a bone was dropped, renamed,
  reparented or moved. Yuji went 2.0M -> 120k triangles (12.2 -> 4.2 MB) with a
  bit-identical skeleton.

      npm i --no-save @gltf-transform/core @gltf-transform/extensions \
                      @gltf-transform/functions meshoptimizer
      node tools/decimate.mjs in.glb out.glb --tris 120000
      node tools/decimate.mjs --check old.glb new.glb    # compare only

- **"the imported model actually plays"** — `modelcheck.mjs` runs the REAL
  `?render3d` load path on every file in `public/models/manifest.json`,
  headless: the same `guessBoneMap` -> `rerigHierarchy` -> `applyJointEdits` ->
  `applyRestPose` -> `fitInto` -> `Retargeter`, driven by the character's own
  procedural model playing its own compiled clips. This exists because the
  swap FAILS QUIETLY by design — an unusable rig leaves the procedural body
  standing and writes one console line nobody is watching — so "it maps" was
  a claim only a person paging through clips in a browser could check. It
  catches a rig the mapper cannot name, a hierarchy that leaves limbs behind
  when the hips move, a limb that stops tracking part-way through some clip
  nobody thought to open, NaN, a model that floats or sinks instead of
  standing on `y = 0`, and a triangle count that will cost the frame rate. It
  cannot judge how a model LOOKS — shoot that on the viewer bench.

      node tools/modelcheck.mjs              # every manifest entry
      node tools/modelcheck.mjs jogo         # one

- **"the rig is a mirror of itself"** — `symmetry.mjs` is the one bone-placement
  correction that needs no human. It measures each left/right pair about the
  model's own mid-plane and writes the offsets that make them meet, as
  `joints` entries — so nothing is re-exported and the numbers survive a
  re-export later. A bind pose that is a fighting STANCE is refused rather
  than averaged, and the split is clean enough to detect: every pair on the
  shipped models is either under 1.7 cm or over 20 cm. `modelcheck` runs the
  same measurement as an intake gate.

      node tools/symmetry.mjs                 # dry run
      node tools/symmetry.mjs --write         # merge into the manifest

Usage:

    node tools/shoot.mjs '[{"kind":"sheet","id":"uraume","name":"out",
                            "opts":{"clips":["idle"],"yaws":[0,1.57]}}]'
    node tools/lineup.mjs '["yuki","ryu","toji","todo"]' lineup-name
    node tools/playtest.mjs "$(cat script.js)"

PNGs land in `shots/`, which is gitignored. Requires `playwright` (a dev
dependency that is deliberately NOT in package.json — install it ad hoc with
`npm i -D playwright --no-save`).

## Map harnesses

Three more, added with the map set-dressing pass. The first two exist because
`src/arena/mapcheck.js` — the validator that knows every way a map has shipped
broken here — was written to be driven from the browser console, which means it
only ever ran when somebody remembered to run it.

    node tools/mapaudit.mjs                 # colliders only, all ten maps (~20s)
    node tools/mapaudit.mjs --rims          # + the drawn-ledge raycast pass (slow)
    node tools/mapaudit.mjs shinjuku        # one map

`mapaudit` prints a JSON blob on stdout and a per-map summary on stderr, and
**exits non-zero if anything is found**, so "no clipping, no backward stairs, no
soft locks" is a claim that can be re-checked in seconds instead of re-argued.
It covers UNREACHABLE, RAMP-END, BURIED, SUNK, WALL-LIP, PHANTOM, UNCAPPED and
SPAWN; `--rims` adds the one check that starts from what a map DRAWS rather than
from what it registered, and catches a ledge you can see, walk onto and drop
through.

    node tools/mapshots.mjs                 # beauty shot of every map -> shots/
    node tools/mapshots.mjs sewer_lair

`mapshots` drives the existing `arena/mapshot.js` contact sheet. `mapaudit`
proves a map is walkable; this is how anyone checks it is worth walking through.

    node tools/mapperf.mjs                  # boot every map in the real game
    node tools/mapperf.mjs kyoto_grounds

`mapperf` starts an actual CPU match on each map through the `__skipSelect` dev
hook, one page per map, and samples real frames after it settles. Absolute frame
times from a headless software renderer are meaningless; what it is for is
**pageErrors** (a map that throws on build fails here and nowhere else) and
relative before/after comparison across a change.

    node tools/openness.mjs                 # all ten maps
    node tools/openness.mjs --detail shinjuku

`openness` answers the question `mapaudit` cannot: not "can you get there" but
"is it worth standing there". It walks the same flood fill, buckets the visited
cells by height, and for each floor reports the largest connected area, the
largest open rectangle in it, and — the number that actually matters — **the
largest circle that fits**.

Use the circle. The largest *rectangle* rewards corridors: a 15 m lane 108 m
long scores higher than a 30 m open green, and a corridor is usually the thing
being diagnosed. Every map in the set once measured under 30 m across on that
circle and three of them under 10; the cause was the same on all of them, a
large round building parked in the middle of the one flat space.

`--detail` prints the per-floor breakdown, which is how you tell an arena from
the ring of balconies around it.

## Camera harness

    node tools/camaudit.mjs                 # all ten maps (~3 min)
    node tools/camaudit.mjs sewer_lair      # one map
    node tools/camaudit.mjs --step 4        # coarser grid, faster

`mapaudit` answers "can the fighter stand here". `camaudit` answers the next
question — "and if he does, can he SEE himself". It builds each map, walks a
grid of standable positions, puts an opponent at eight bearings around each one,
runs the real `src/core/camera.js` rig to a settled frame and projects the
fighter's chest through it. Roughly 45,000 shots across the set.

What it reports, worst first:

  · `POINT-BLANK`      the lens ended up closer to the fighter's chest than the
                       standoff floor (`camera.js MIN_LENS`) allows. A leak.
  · `OFF-FRAME`        the fighter does not project inside the picture.
  · `FREE-OFF-FRAME`   the same, with the opponent lock toggled off (R3).
  · `BURIED-CAM`       the rig is under a surface the fighter is not under, and
                       far enough out that the sweep should have caught it.
  · `DECK-HEAVE`       jumping under an overhang moves the rig's idea of the
                       floor onto the thing overhead.
  · `STANDOFF-CLIP`    advisory: the rig is clipping geometry *at* the standoff
                       floor. That is the designed trade — a clipped wall corner
                       beats a lens inside the fighter — not a fault.
  · `TIGHT`            advisory: a settled shot between the floor and 2 m. Worth
                       knowing where they are; they are legitimate.

It found the four faults the camera pass fixed, all of them invisible in a
screenshot of a normal fight: the collision pull-in compounding frame over frame
until the lens sat 0.71 m inside the fighter's head, the unlocked camera framing
from the world origin so that toggling it anywhere but the ground plane lost the
character (13,488 shots), the deck query reading a mezzanine as the floor on a
jump, and the standoff radius deadlocking the rig in front of the fighter.

All four need `playwright` — install ad hoc with
`npm i -D playwright --no-save`, same as the character harnesses above.
