# Online integration harness

Two real browsers, driven from Node, talking to each other through an
in-memory stand-in for InstantDB. This is how the netcode in `src/net/` is
tested without a live server — and it is how every bug listed in
`docs/online-multiplayer.md` §9 was found.

## Why a mock rather than the real service

The wire protocol is not what needs testing; the *game* is. What has to be
exercised is seat assignment, jitter buffering, snapshot reconciliation, KO
authority, host migration and disconnect handling — all of which live on this
side of the socket. `mock.js` provides exactly the slice of the InstantDB API
the game uses (`joinRoom` / presence / topics / `subscribeQuery` / `transact` /
`queryOnce`) and `harness.mjs` relays between the two browsers.

`src/net/client.js` picks the mock up from `window.__mockInstant` **only in a
development build** — `import.meta.env.DEV` is a compile-time constant, so the
branch is not present in `dist/`.

## Two browsers, not two tabs

Chromium does not run `requestAnimationFrame` in a background tab, so two tabs
in one browser would leave one client's game loop frozen. Each client
therefore gets its own browser instance, and `?player=<tag>` (also DEV-only)
gives each one its own player identity — the same trick works for manual
testing in two normal windows.

## The title screen

`makeClient` presses PRESS START for you, because every run except `title.mjs`
is about what happens after it. `makeTitleClient` leaves a client sitting on
the title instead.

## Running

```sh
npm i -D playwright          # not a project dependency; the deploy does not need it
npm run dev -- --port 5178
node test/online/replication.mjs   # host, join, pick, start, replicate, drop
node test/online/flow.mjs          # KO -> result -> rematch -> host migration
node test/online/local-cpu.mjs     # regression: VS CPU is untouched
node test/online/local-2p.mjs      # regression: local split-screen is untouched
node test/online/title.mjs          # title screen, panel states, availability toast
node test/online/shots.mjs         # screenshots of every online UI state
```

Three of these are not about the netcode at all — they live here because this
is where the browser harness already is:

```sh
node test/online/overhaul-smoke.mjs      # fires every rebuilt technique in a
                                         # live match, asserts no page errors
node test/online/panda-cores.mjs         # Panda's three stances share ONE
                                         # health pool — see combat/cores.js
node test/online/model-shot.mjs kashimo  # front + head renders of one model,
                                         # for reviewing character art
```

Set `CA_URL` if the dev server is somewhere else. Screenshots land in
`test/online/shots/`.

**Do not edit `src/` while a run is in flight** — Vite's HMR reloads the page
mid-test and the run fails in a way that looks like a product bug.
