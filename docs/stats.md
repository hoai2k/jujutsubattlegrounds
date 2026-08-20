# Visitor stats

A dashboard at **`/stats/`** answering one question: *is anybody out there
playing this, and where are they?*

- live site: `https://<user>.github.io/jujutsubattlegrounds/stats/`
- locally: `http://localhost:5173/stats/`

It is not linked from the game and is marked `noindex`.

## How it works

There is no server. GitHub Pages serves static files, so the site cannot see
its own request logs — nothing on the hosting side knows a visitor arrived.
The count therefore has to be made by the page itself, and the only database
this project has is the one online play already uses.

So: **one InstantDB document per page load**, in the `siteVisits` namespace of
the same app id as multiplayer (`src/net/config.js`), patched in place as the
visit goes on. The dashboard subscribes to that namespace and aggregates it in
the browser.

| File | Job |
| --- | --- |
| `src/stats/telemetry.js` | Writes the visit row. Started from `src/main.js`; `src/core/game.js` patches it with each match played. |
| `src/stats/geo.js` | Answers "where is this browser?" — timezone/locale, plus a geo-IP lookup. |
| `src/stats/main.js` + `stats/index.html` | The dashboard page. Read-only. |
| `test/stats.mjs` | One browser, a stub database, title screen → match; asserts the row. |

### The visit row

`page`, `visitor`, `startedAt`, `beatAt`, `seconds`, `ref`, browser/device
fields, the geo fields, and a rolling gameplay summary (`matches`, `lastChars`,
`lastMap`, `mode`, `online`).

`visitor` is the random per-browser id online play already generates
(`ca.net.playerId`). It makes a returning player recognisable as *the same
browser* and as nothing else. Clearing site data makes someone new.

`beatAt` is refreshed every 30 s while the page is open, which is what "on the
site now" means on the dashboard and what `seconds` is rounded from. A row is
patched, never appended to — a long session costs a heartbeat, not an event
log, which matters in a database whose write permissions are public.

### Location

Two independent answers, both best-effort:

1. **Timezone and locale** — `Intl` only. Instant, unblockable, no network.
   `Europe/Warsaw` is already enough to separate a stranger from yourself.
2. **Geo-IP** — the visitor's browser calls `ipwho.is`, which is free, CORS-open
   and needs no key, and the country/region/city/ISP it returns is written to
   the row. The result is cached in `localStorage` for 12 hours.

The lookup is the visitor's own request, so **their IP goes to ipwho.is** —
that is what performs the lookup. Nothing stores the IP itself: only the place
it resolved to. If the lookup is blocked, slow, offline or rate-limited, the
row keeps the timezone answer and the dashboard shows that instead.

### What is deliberately not collected

No IP address, no account, no name the player did not choose, no full user
agent string, no cross-site anything, no cookies. The dashboard's fanciest
claim is "someone in São Paulo on Vivo played four matches as Gojo".

## Switches

- **Off in dev.** A local `npm run dev` would otherwise pollute the live
  numbers. `?stats=1` forces it on, on any build — that is also how to
  smoke-test the pipeline against the live site.
- **Opt out** for a browser: `localStorage.setItem('ca.stats.optout', '1')`,
  or call `setOptOut(true)` from `src/stats/telemetry.js`.
- **Turn it off entirely:** delete the `import('./stats/telemetry.js')` block at
  the bottom of `src/main.js`. Everything else is inert without it.

## Failure is silent, by design

Telemetry is loaded lazily, is never awaited, and every database call is
fire-and-forget inside a `try`. A blocked InstantDB, an ad blocker, a dead
network or a database error is a visit nobody records — never a broken game.
The dashboard is the only place a failure is visible, and it says so in words.

## Accuracy, honestly

- Ad blockers and privacy browsers block the geo-IP host and sometimes the
  database socket. Those visits are undercounted or land as timezone-only.
- A VPN resolves to the VPN's exit, not the player.
- One person on a phone and a laptop is two "browsers".
- `seconds` is rounded to the last heartbeat, so it undercounts by up to 30 s
  and does not stop when a tab is left open in the background.

It is a signal, not a ledger. That is the right precision for "did a stranger
find my game".

## Housekeeping

Rows accumulate forever. The dashboard reads the whole namespace, which is
fine for the volume this site will ever see; if it ever is not, delete old
rows from the InstantDB dashboard for the app id in `src/net/config.js`.

Anyone who reads the shipped bundle has the same app id and the same
permissive permissions online play needs, so these rows are readable — and
writable — by anyone who bothers. Nothing in them is worth more than that.
