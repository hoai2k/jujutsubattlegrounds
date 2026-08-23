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

All three need `playwright` — install ad hoc with
`npm i -D playwright --no-save`, same as the character harnesses above.
