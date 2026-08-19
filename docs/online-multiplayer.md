# Online multiplayer — design

Jujutsu Battlegrounds is a 60 Hz fixed-step arena fighter with a very large,
very stateful combat layer (domains, shikigami, minions, curses, swarms,
finishers, cinematics). This document describes how online play was added to
it without touching the feel of local play, and what the rules are for anyone
extending it.

Read the **Invariants** section before changing anything in `src/net/`.

---

## 1. Goals and non-goals

**Goals**

1. **Zero added input lag, for everyone.** A player's own fighter reacts on the
   very tick the button went down — host and guest alike. There is no
   "authoritative server round trip" on your own character.
2. **One shared fight.** Same map, same roster, same rounds, same winner, same
   dramatic beats (KO, finisher, jackpot, sword roll) on every screen.
3. **Local and online mix seamlessly.** Two people on one couch can join a
   game hosted by two other people on another couch. A client can own more
   than one seat; each locally-owned seat gets its own split-screen view.
4. **Online never blocks local play.** Every network path is asynchronous,
   lazily loaded and failure-tolerant. If InstantDB is unreachable, the game
   is exactly what it is today, minus one greyed-out panel.
5. **Every state is handled.** Connecting, no games, stale games, room full,
   host left, guest left, own connection dropped, reconnect, version mismatch,
   start race, mid-match quit.

**Non-goals**

- Deterministic lockstep. Ruled out — see §3.
- Anti-cheat. Peers are trusted. This is a friendly party game with a public
  app id; treat every client as able to lie.
- Matchmaking beyond "is there an open game right now".

---

## 2. Transport: InstantDB

Two distinct mechanisms, used for two distinct jobs.

| Job | Mechanism | Why |
| --- | --- | --- |
| Discovery — "is there a game to join?" | Persisted `arenaGames` documents + `db.subscribeQuery` | Needs to be visible to a client that has not joined anything yet |
| Lobby roster, readiness, picks | Room **presence** (`room.publishPresence`) | Automatically garbage-collected when a peer disconnects — this is what makes drop detection reliable |
| In-match input / state / events | Room **topics** (`room.publishTopic`) | Fire-and-forget ephemeral broadcast, no persistence cost |

App id lives in `src/net/config.js`. The schema-less default of a new Instant
app is relied on: no schema push is required, and permissions are the
permissive defaults.

`@instantdb/core` is **dynamically imported** on first use (`src/net/client.js`).
It is not in the initial bundle, and an import failure is a recoverable state,
not a crash.

### 2.1 Discovery documents

`arenaGames` entity:

```
id          uuid
code        6-char human code (e.g. "K7QM2A")
proto       protocol version int — mismatches are hidden, never joined
status      'open' | 'live' | 'closed'
hostName    display name
seats       how many seats are claimed
maxSeats    4
createdAt   ms
beatAt      ms — host heartbeats every HEARTBEAT_MS
```

A game is **listable** when `status === 'open'`, `proto` matches, and
`now - beatAt < STALE_MS`. Stale rows are filtered client-side (never trusted
to be cleaned up) and best-effort deleted by whoever notices them, so a host
that was killed with `SIGKILL` cannot poison the lobby list forever.

### 2.2 Room topics

One room per game: `db.joinRoom('arena', gameId)`.

| Topic | Sender | Rate | Payload |
| --- | --- | --- | --- |
| `in` | every client, for its own seats | 20 Hz | batch of packed input frames |
| `st` | every client, for its own seats | 10 Hz + on change | authoritative fighter snapshot |
| `ev` | any client | on event | discrete game events (see §5) |
| `fl` | host only | on event | match flow (start, KO, rematch, end) |

Every payload carries `from` (the sender's stable player id) and is ignored if
`from === myId` — Instant echoes broadcasts back to the sender.

---

## 3. Why not lockstep

The obvious netcode for a fighting game is deterministic lockstep with
rollback. It is not available here:

- ~70 kLOC of gameplay with `Math.random()` in FX, AI, damage, domains and
  finishers.
- Physics runs in `float64` but through `three.js` vector maths whose call
  order is not stable under refactor.
- Rollback needs cheap state snapshot/restore. `Fighter` owns a `THREE.Group`
  scene graph, an `AnimPlayer`, particle handles and half a dozen subsystem
  registrations. Snapshotting that 8 times a second is not a small change; it
  is a rewrite.

So the model is **distributed authority with input replication and soft state
reconciliation**, described next.

---

## 4. The netcode model

### 4.1 Everybody simulates everything

Every client runs the complete `Match` — all four fighters, all subsystems, all
FX. Nothing is "remote-rendered".

### 4.2 Each seat has exactly one owner

Seat *i* is owned by exactly one client. The owner is the only source of truth
for that fighter.

- **Owned seats** are driven by real local input, polled this tick. **Zero
  added latency.** This is goal 1, and it falls out of the model for free —
  there is no server to ask.
- **Remote seats** are driven by the owner's *replicated input frames*, fed
  into the same `Fighter.update(input, ctx)` the local seats use.

Because remote fighters run the real state machine off real inputs, every
technique, projectile, domain, cut-in and sound effect happens locally on every
client with no per-feature replication code. Adding a new character or
technique requires **no** netcode work.

### 4.3 Input replication

`protocol.js` packs an input frame into 6 integers: a 16-bit button mask plus
quantised move/camera axes. Frames are batched per tick and published at 20 Hz.

Each batch **re-sends the last `RESEND_TICKS` frames** already sent. Redundancy
is far cheaper than retransmission for 60-byte payloads, and it makes single
packet loss invisible.

Receivers keep a per-seat ring keyed by tick and consume it `JITTER_TICKS`
behind the newest frame received (~100 ms), so remote fighters are displayed
slightly in the past — the standard trade. The delay adapts: it grows when the
buffer starves and shrinks when it is consistently over-full.

On starvation the last frame is repeated with **all edges cleared**, so a
dropout freezes a fighter mid-stride rather than machine-gunning their last
attack.

Press edges (`jumpP`, …) are **recomputed locally** from consecutive frames
rather than transmitted, so a lost packet can never duplicate or lose a press
edge relative to the held state that surrounds it.

### 4.4 State reconciliation

Input replay alone drifts: RNG differs, and float paths diverge. Owners
therefore publish a snapshot of each owned fighter at 10 Hz, and immediately
whenever HP or state changes:

```
seat, tick, pos, vel, yaw, state, hp, ce, lives, flags
```

Non-owners apply it as a **correction, not a teleport**:

- Position error `< SNAP_EPS` (0.05 m) — ignored.
- Position error `< SNAP_HARD` (2.5 m) — the error is absorbed into a decaying
  offset applied over ~200 ms, so a correction never looks like a jump.
- Position error `>= SNAP_HARD` — hard snap. Something went badly wrong; being
  correct beats being smooth.
- `hp` / `ce` / `lives` — **always taken verbatim**. This is the load-bearing
  bit: it means RNG divergence in the damage pipeline self-heals within 100 ms
  and can never accumulate into two clients disagreeing about who won.
- `state` — forced (via the game's own `setState`) only if it has disagreed
  continuously for `STATE_FORCE_MS` (400 ms). Short disagreements are just the
  jitter buffer and must not be papered over.

### 4.5 Damage authority

All clients resolve melee locally, so the attacker sees their hit land with no
delay and the victim gets an immediate reaction. The **victim's owner's HP is
authoritative** and arrives in the next snapshot. Practically:

- Attacker: instant feedback, correct.
- Victim: takes the hit on their own machine at their own timing.
- Divergence window: one snapshot interval.

This is "favour the shooter", and it is why HP is verbatim-synced rather than
merged.

### 4.6 Shared randomness

Divergence that is *visible as a different outcome* is not acceptable ("same
game as if in the same room"). Three sources mattered and were given a shared,
seeded stream instead of `Math.random()`:

- `hits.computeDamage` — ratio crit roll → `attacker.rng()`
- `domains` sword-domain roll → seeded from the match seed (it was already a
  seeded stream; only the seed source changed)
- `jackpot` reach tier and win roll → `owner.rng()`
- `finishers.pickFinisher` — the roll travels on the host's KO event

Each fighter carries `f.rng`, a `mulberry32` stream seeded from
`matchSeed ^ seat`. Because a fighter's own logic is the only caller and that
logic is driven by replicated input, the call *order* per stream is identical
on every client, so the streams stay in lockstep without any global ordering
requirement.

Everything else (particles, debris, sparks) stays on `Math.random()`. Two
clients seeing different smoke is not a different game.

### 4.7 Match flow authority

Timing-sensitive, one-shot transitions are **host-authoritative** and
broadcast on `fl`:

- `start` — map, seed, seat assignment
- `ko` — which fighters fell, resulting lives, the finisher roll
- `round` — next round number
- `end` — winner, and what the host chose on the result screen

Guests never call `_startKO()` themselves; they apply the host's. Everything
downstream of the KO is a pure clock (`phaseT`), so it stays in step on its own
once the KO instant is shared.

---

## 5. Discrete events (`ev`)

A small escape hatch for things that are neither continuous state nor input:

| Event | From | Meaning |
| --- | --- | --- |
| `bye` | anyone | clean leave (distinguishes quit from crash) |
| `chat` | anyone | reserved |
| `pause` | anyone | a player opened the pause menu — online pauses are advisory only; the match does **not** stop (see §7.4) |

---

## 6. Session lifecycle and UI

### 6.1 States

```
idle ──host──▶ creating ─▶ lobby ─▶ picking ─▶ ready ─▶ starting ─▶ live ─▶ ended
  └──join───▶ joining ──▶ lobby ─▶ …                                    │
                                                                        ▼
                                        (any state) ──error/left──▶ closed
```

Every one of these has a rendered UI state. There is no state in which the
player is looking at a spinner with no explanation and no way out.

### 6.2 The title screen

The game opens on a title screen (`src/ui/title.js`), and it is load-bearing
rather than decorative:

- **PRESS START is the browser's user gesture.** Audio cannot begin and
  `requestFullscreen` cannot be granted until the player has interacted with
  the page, so the menu music and the fullscreen request both hang off that one
  press. A gamepad poll is not a gesture, so on a pad the fullscreen request
  simply does nothing — the correct failure.
- **An open game is a first-class choice here.** With a game open, a second
  option slides in under PRESS START with a pulsing dot: `JOIN ONLINE GAME`,
  and the host's name and seat count. Choosing it goes to the roster with the
  join already in flight. With no game open there is only PRESS START — the
  option is absent, not greyed out.
- The list is re-derived every frame, so a game appearing while somebody is
  looking at the title adds the option there and then.

### 6.3 Character select

The online panel lives on the character-select screen, top-right under the
device readout.

- **No game open** → `HOST ONLINE GAME`, and nothing else. There is no
  "NO GAMES OPEN" line and no disabled JOIN button: an absence does not need
  announcing, and a dead button is worse than no button.
- **A game is open** → the header dot lights, the panel names the host and
  seat count, and `JOIN ONLINE GAME` animates in above HOST.
- **Online unavailable** (import failed / offline / no app id) → the panel
  greys out with a one-line reason and is not focusable.

### 6.4 One message channel

Everything online that happens *once* goes through a single toast
(`OnlineToast`, driven by `OnlineController.say`), on every screen — the title,
the roster and mid-fight alike:

| Event | Message |
| --- | --- |
| A game opens while you are elsewhere | `ONLINE GAME NOW AVAILABLE` (gold) |
| A player drops | `TOJI DISCONNECTED — CPU TOOK OVER` |
| ...and comes back | `TOJI RECONNECTED` (gold) |
| Host ends the session, join fails, version mismatch | the reason, in red |

The player learns one place to look. The fighter-attached HUD chip (`CPU`,
`RECONNECTED`) still rides its own plate, because that one is about *which*
fighter and belongs next to them.

The availability toast deliberately does **not** fire on the first query
result: a game that was already open when the page loaded is not news, and the
panel is already showing it.

Activating either opens the **lobby overlay** on top of the still-live select
screen. This is deliberate: you keep picking your fighter on the same roster
you always use, with the same controls, and locking in marks you READY in the
lobby instead of starting a local match. There is no separate online character
select to keep in sync.

Local seat detection is unchanged: two pads on your machine means you bring two
seats to the online game.

### 6.5 Waiting screens

| Situation | Shown |
| --- | --- |
| Connecting | `CONNECTING…` with a cancel |
| In lobby, not everyone picked | roster with per-player `PICKING` / `READY` + their fighter |
| All ready, guest | `WAITING FOR HOST TO START` |
| All ready, host | `START MATCH` (enabled) |
| Host in map select | guests: `HOST IS CHOOSING THE STAGE` |
| Start confirmed | `STARTING…` countdown |
| Peer connection lost mid-match | banner `P2 RECONNECTING…` with countdown |
| Own connection lost | banner `RECONNECTING…` |

### 6.6 Failure handling

| Failure | Behaviour |
| --- | --- |
| InstantDB import fails | Panel disabled with reason. Local play untouched. |
| Join a game that filled up | `THAT GAME IS FULL` toast, back to the panel, list refreshes |
| Join a game that vanished | `THAT GAME IS NO LONGER OPEN`, list refreshes |
| Protocol mismatch | Game is not listed; direct join refuses with `VERSION MISMATCH` |
| Guest drops in lobby | Removed from roster on presence loss; host's `seats` count updates |
| Host drops in lobby | Guests see `HOST LEFT`, session closes, back to select |
| Guest drops mid-match | `RECONNECTING…` for `DROP_GRACE_MS`, then the seat is handed to the CPU with a toast. Match continues. |
| Host drops mid-match | Host migration: lowest remaining player id becomes host and takes flow authority. If nobody is left, the match downgrades to a local match against the CPU and says so. |
| Own connection drops | Instant reconnects on its own; a banner shows for the duration. Owned fighters keep responding to input the whole time — a network drop never freezes your own character. |
| Everyone else left | Banner `ONLINE SESSION ENDED`, match continues offline to a normal result screen |

**Nothing in this table returns the player to a dead end.** Every terminal
state lands on the character-select screen with a readable reason.

---

## 7. Invariants

These are the rules that keep the feature honest. Breaking one is a bug even
if nothing visibly fails.

1. **No network call on the fixed-step path.** `NetMatch.beginTick`/`endTick`
   only touch pre-allocated arrays. Publishing is fire-and-forget and wrapped
   in `try/catch`; a throw inside the net layer must never take down a tick.
2. **Inbound messages are queued, never applied from a callback.** Topic
   handlers push into arrays. Application happens at a defined point in the
   tick.
3. **A locally-owned fighter is never driven by the network.** Not by inputs,
   not by snapshots. It is the one thing this design guarantees absolutely,
   and it is what makes the game feel local.
4. **Every net entry point is null-safe against `net == null`.** `Match` must
   run identically with no net object at all — that is the local path, and it
   is the path that must never regress.
5. **The seat→view mapping is the only thing that knows about locality.**
   Combat code sees four fighters and does not know or care which are remote.
6. **Ownership is per-seat, never per-client-role.** "Host" is a flow-authority
   role, not an ownership role. A host owns its seats and nothing else.

### 7.4 Pausing

Pause is **local-only** in an online match. One player cannot freeze three
others. The pause menu still opens (settings, controls, quit), the match keeps
running behind it, and the pausing player's fighter is fed neutral input while
the menu is up. `QUIT TO SELECT` sends `bye` and leaves cleanly.

---

## 8. Task list

Implementation order, each item independently verifiable.

- [x] **T1** `net/config.js` — app id, protocol version, all tunables in one place
- [x] **T2** `net/client.js` — lazy `@instantdb/core` import, connection status, availability probe
- [x] **T3** `net/protocol.js` — input packing, snapshot packing, message envelopes
- [x] **T4** `net/lobby.js` — discovery query, create/heartbeat/close, stale reaping
- [x] **T5** `net/session.js` — room join, presence roster, lobby state machine, host migration
- [x] **T6** `net/sync.js` — `NetMatch`: input rings, jitter buffer, snapshot send/apply, flow events
- [x] **T7** `combat/fighter.js` — per-fighter seeded `rng`
- [x] **T8** RNG conversions — `hits`, `jackpot`, `domains` seed, `finishers` roll
- [x] **T9** `core/match.js` — seat/view separation, per-seat input routing, net hooks, KO gating
- [x] **T10** `ui/online.js` — panel, lobby overlay, banners, toasts
- [x] **T11** `ui/select.js` — panel mount, online lock-in path
- [x] **T12** `core/game.js` — online flow: lobby → pick → map → match → result
- [x] **T13** `ui/style.css` — styles for panel, lobby, banners
- [x] **T14** Disconnect handling — grace, CPU takeover, host migration, downgrade
- [x] **T15** Audit pass and fixes (§9)

---

## 9. Audit findings

Everything below was found *after* the first working build, either by review or
by the two-browser harness in `test/online/` (§10). Each one is fixed.

### 9.1 Found by the harness

| # | Finding | Fix |
| --- | --- | --- |
| A1 | `.sel-hero` is a wide, mostly-transparent slab pinned to the screen edge. It silently ate every click aimed at the online panel behind it | `pointer-events: none` — it was always display-only |
| A2 | `#ui-root > *` sets `pointer-events: auto` with **ID specificity**, so `.lobby-overlay { pointer-events: none }` never applied. A hidden lobby kept swallowing clicks meant for the panel underneath it | Hidden overlays use `visibility: hidden`, which no specificity war can undo. Applies to the panel, the lobby, the banner and the toast |
| A3 | The seat plan kept its original indices after dropping players with no pick, so a two-player game could produce seats `0` and `2` — and `match.fighters[2]` does not exist. Both clients ended up owning nothing | Seats are renumbered densely in `NetSession.start`, after the filter |
| A4 | A guest whose first presence slice arrived before the host's saw a hostless roster of one — itself — and promoted itself. Two hosts, two seat plans | Host is **inherited, never invented**: `_sawHost` must have been true, and migration is refused while `phase === 'connecting'` |
| A5 | `map: 'random'` travelled on the wire and each client rolled its own. Two players, two different stages, same match | The host resolves RANDOM to a concrete map id before publishing `start` |
| A6 | The select screen re-derives its seat count every frame (pads hot-plug, and going online drops the CPU seat), but never told the session. The host advertised two seats while sending one pick | `_syncDevices` pushes the count through `OnlineController.setSeats` |
| A7 | **A finisher stops the logic tick for eight seconds.** So does Megumi's ritual, and so does a long hitstop. With the input stream riding the tick, both players went silent mid-cinematic and each handed the other to the CPU | `NetMatch.keepAlive()`, published from `Match.update` **above** every early return |
| A8 | The disconnect grace period started when the match was constructed — before a peer on a slower machine had finished building a 90-metre map. It was CPU'd before it spawned | A seat that has never been heard from is `joining`, not dropping: separate 30 s grace and its own wording (`LOADING…`) |
| A9 | `stalling` stayed true forever for a seat the CPU had already inherited, so `RECONNECTING…` never cleared | The banner excludes seats in `cpuSeats`, and reports `EVERYONE ELSE LEFT — PLAYING OFFLINE` when nobody is left |

### 9.2 Found by review

| # | Finding | Fix |
| --- | --- | --- |
| B1 | The settings panel replaces `current.update()` in the game loop, which would freeze an online client's simulation *and* its outbound stream behind a modal | `match.uiModal`; the online match keeps ticking with the local seat fed neutral input |
| B2 | Quitting an online match from the pause menu re-showed the ONLINE panel — pasted over the HUD of the match still on screen | The panel only returns when a select screen is actually attached |
| B3 | When the jitter buffer jumped the cursor forward to shed latency, every button press in the skipped span was discarded | The skipped span's masks are OR-folded into the frame that is played |
| B4 | `liveness()` mutated peer state, and the HUD called it every frame | Split into `tickLiveness()` (mutating, one caller) and `liveness()` (pure read) |
| B5 | The select-screen subtitle was only rebuilt on local input, so `EVERYONE IS READY` never reached the host's headline | Signature-compared refresh against the lobby state |
| B6 | `_localSeats` was read once at host/join time, before the online seat re-detection had run | Superseded by A6's continuous push |

### 9.3 Designed in from the start

These were not bugs; they are the decisions that stop the obvious bugs from
existing, and they are listed so nobody "simplifies" one away.

| Decision | What it prevents |
| --- | --- |
| Guests never call `_startKO()` | Two clients decrementing lives for the same knockdown |
| The finisher roll rides on the host's `ko` event | One screen playing an eight-second cinematic while another does not — an unrecoverable clock split |
| The result screen is host-authoritative online | Three players each choosing what happens next |
| Press edges are recomputed on the receiver | A lost packet permanently swallowing (or duplicating) an attack |
| HP/CE/lives are taken **verbatim** from the owner | RNG divergence in the damage pipeline accumulating into two clients disagreeing about who won |
| Per-fighter seeded RNG streams | Crits, jackpot tiers and sword rolls differing between screens |
| Only non-attacking states may be force-synced | Re-entering an attack state and landing its hit twice |
| Pause does not stop an online match | One player freezing three others — and desyncing themselves permanently |
| Stale-row filtering is client-side | A host killed with `SIGKILL` leaving `1 GAME OPEN` lit forever |

---

## 10. Testing

`test/online/` runs two real browsers against an in-memory stand-in for
InstantDB and drives the whole flow: host, discover, join, pick, start,
replicate inputs, exchange damage, KO, round transition, match end, rematch,
guest disconnect, host disconnect and host migration. It also carries two
regression runs that assert VS CPU and local split-screen are untouched.

See `test/online/README.md` for why it is shaped the way it is and how to run
it. `playwright` is deliberately **not** a project dependency — the deploy
workflow runs `npm ci` and does not need a browser download.

Two development-only affordances make manual testing possible as well, both
compiled out of a production build:

- `window.__mockInstant` — the transport seam described above.
- `?player=<name>` — gives a tab its own player identity, so two normal windows
  on one machine are two distinct players.

---

## 11. Controls and entry points

| Input | Where | What |
| --- | --- | --- |
| Confirm (A / Space / Enter) | title | PRESS START — also the gesture that starts the music and enters fullscreen |
| Up / Down | title, when a game is open | Choose between PRESS START and JOIN ONLINE GAME |
| `O` | character select | Join the open game, or host one if there is none |
| Mouse | the ONLINE panel | Same two actions, plus LEAVE and the stage picker in the lobby |
| Confirm (A / Enter / Punch) | character select, all local seats locked | Host only: START MATCH. The roster cursors are idle at that moment, which is what makes the binding free |
| Back (B / Backspace) | character select, locked | Unlock, which also clears READY |

Entry is mouse-or-key rather than gamepad because every pad button on the
select screen already drives the roster, and a shortcut that also moved your
cursor would be worse than no shortcut.
