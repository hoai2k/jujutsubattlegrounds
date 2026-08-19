// Discovery: the small persisted layer that answers "is there a game to join
// right now?" for a client that has not joined anything yet.
//
// Presence cannot answer that question — you have to be in a room to see its
// presence — so this is the one part of online play that uses documents.
// Everything about a live match travels over topics instead.
import { getDb, api } from './client.js';
import { GAMES, PROTO, STALE_MS, LOBBY_POLL_MS, MAX_SEATS } from './config.js';

export function isListable(g, now = Date.now()) {
  return !!g && g.proto === PROTO && g.status === 'open'
    && (g.seats | 0) < (g.maxSeats || MAX_SEATS)
    && now - (g.beatAt || 0) < STALE_MS;
}

// Watch the open-game list. `cb(games, err)` fires on every change AND on a
// timer, because staleness is a function of the clock and no database event
// fires when a host simply stops writing.
export function watchGames(cb) {
  let stopped = false;
  let unsub = null;
  let timer = null;
  let rows = [];
  let reaped = new Set();

  const emit = () => {
    if (stopped) return;
    const now = Date.now();
    cb(rows.filter(g => isListable(g, now)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), null);
  };

  (async () => {
    const db = await getDb();
    if (stopped) return;
    if (!db) { cb([], 'offline'); return; }
    try {
      unsub = db.subscribeQuery({ [GAMES]: {} }, res => {
        if (stopped) return;
        if (res.error) { cb([], res.error.message || 'query failed'); return; }
        rows = res.data?.[GAMES] || [];
        emit();
        reap(db, rows, reaped);
      });
    } catch (e) {
      cb([], e?.message || 'query failed');
      return;
    }
    timer = setInterval(emit, LOBBY_POLL_MS);
  })();

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    try { unsub?.(); } catch { }
  };
}

// Best-effort cleanup of rows whose host died without closing. Nobody owns
// this job, so whoever notices does it — and `reaped` stops one client from
// retrying the same row on every query tick.
function reap(db, rows, reaped) {
  const now = Date.now();
  const dead = rows.filter(g =>
    !reaped.has(g.id) && now - (g.beatAt || 0) > STALE_MS * 3);
  if (!dead.length) return;
  for (const g of dead) reaped.add(g.id);
  try {
    db.transact(dead.map(g => db.tx[GAMES][g.id].delete()));
  } catch { /* somebody else got there first, or we lack the write — fine */ }
}

export async function createGame({ code, hostName, seats = 1 }) {
  const db = await getDb();
  if (!db) throw new Error('online unavailable');
  const gid = api().id();
  const now = Date.now();
  await db.transact(db.tx[GAMES][gid].update({
    code, proto: PROTO, status: 'open',
    hostName: hostName || 'HOST',
    seats, maxSeats: MAX_SEATS,
    createdAt: now, beatAt: now
  }));
  return gid;
}

// Fire-and-forget: a failed heartbeat is not worth interrupting anyone over,
// it just means the row goes stale and the game stops being listed.
export function patchGame(gid, patch) {
  getDb().then(db => {
    if (!db) return;
    try { db.transact(db.tx[GAMES][gid].update(patch)); } catch { }
  }).catch(() => { });
}

export function heartbeat(gid, extra = {}) {
  patchGame(gid, { beatAt: Date.now(), ...extra });
}

export async function deleteGame(gid) {
  const db = await getDb();
  if (!db) return;
  try { await db.transact(db.tx[GAMES][gid].delete()); } catch { }
}

// Read one row directly, for the join path — the watcher's snapshot can be a
// couple of seconds old and we want the freshest possible answer to "is this
// game still open?" before committing the player to it.
export async function fetchGame(gid) {
  const db = await getDb();
  if (!db) return null;
  try {
    const res = await db.queryOnce({ [GAMES]: { $: { where: { id: gid } } } });
    return res.data?.[GAMES]?.[0] || null;
  } catch {
    return null;
  }
}
