// Lazy InstantDB handle.
//
// The whole point of this module is that NOTHING above it may assume the
// network exists. `@instantdb/core` is dynamically imported the first time
// somebody asks for online play, so a local match never pays for the bundle,
// and an import that fails (offline, blocked CDN, ad blocker) resolves to a
// clean "unavailable" rather than throwing into the game loop.
import { APP_ID } from './config.js';

let _db = null;
let _loading = null;
let _error = null;
let _api = null;          // { id, tx, lookup } from the module namespace

// 'unknown' until we have tried, then 'ok' | 'error'
export let availability = 'unknown';

// Live connection status, mirrored out of the reactor so the UI can show a
// reconnect banner without polling anything.
export const conn = { status: 'closed', online: navigator.onLine !== false };

const connListeners = new Set();
export function onConnection(fn) {
  connListeners.add(fn);
  fn(conn);
  return () => connListeners.delete(fn);
}
function pushConn() { for (const fn of connListeners) { try { fn(conn); } catch { } } }

addEventListener('online', () => { conn.online = true; pushConn(); });
addEventListener('offline', () => { conn.online = false; pushConn(); });

export function netError() { return _error; }

// Resolves to the db handle, or null if online is unavailable. Never rejects.
export async function getDb() {
  if (_db) return _db;
  if (_loading) return _loading;
  if (_error) return null;
  _loading = (async () => {
    try {
      if (!APP_ID) throw new Error('no app id');
      // TEST SEAM. A page may install `window.__mockInstant` before boot to
      // stand in for the service; it is the only way to drive two clients
      // against each other without a live websocket. `import.meta.env.DEV` is
      // a compile-time constant, so this branch is gone from a real build.
      if (import.meta.env?.DEV && typeof window !== 'undefined' && window.__mockInstant) {
        const m = window.__mockInstant(APP_ID);
        _api = m.api; _db = m.db; availability = 'ok';
        conn.status = 'authenticated'; pushConn();
        return _db;
      }
      const mod = await import('@instantdb/core');
      const db = mod.init({ appId: APP_ID });
      _api = { id: mod.id, tx: db.tx, lookup: mod.lookup };
      try {
        db.subscribeConnectionStatus(s => {
          conn.status = typeof s === 'string' ? s : (s?.status ?? 'closed');
          pushConn();
        });
      } catch { /* older core without the helper — the banner just stays quiet */ }
      _db = db;
      availability = 'ok';
      return db;
    } catch (e) {
      _error = e?.message || 'online unavailable';
      availability = 'error';
      return null;
    } finally {
      _loading = null;
    }
  })();
  return _loading;
}

// `id()` and `tx` come off the same module instance the db was built from.
export function api() { return _api; }

// True once the socket has authenticated. Used for the reconnect banner.
export function connected() {
  return conn.online && (conn.status === 'authenticated' || conn.status === 'opened');
}

// A stable per-browser identity, so a reconnect within a session is
// recognisable and a name can persist between visits.
const ID_KEY = 'ca.net.playerId';
const NAME_KEY = 'ca.net.playerName';

function rid(n = 12) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return [...a].map(b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}

// DEV: `?player=NAME` gives this tab its own identity, so two tabs on one
// machine are two distinct players. Without it both tabs share localStorage
// and would be the same person joining their own game.
function devTag() {
  if (!import.meta.env?.DEV) return null;
  try { return new URLSearchParams(location.search).get('player'); } catch { return null; }
}

export function playerId() {
  const tag = devTag();
  if (tag) return 'dev-' + tag;
  let v = null;
  try { v = localStorage.getItem(ID_KEY); } catch { }
  if (!v) {
    v = rid(16);
    try { localStorage.setItem(ID_KEY, v); } catch { }
  }
  return v;
}

const ADJ = ['CURSED', 'JADE', 'IRON', 'SHADOW', 'CRIMSON', 'HOLLOW', 'SILENT', 'BROKEN', 'GOLDEN', 'FERAL'];
const NOUN = ['SORCERER', 'FANG', 'RONIN', 'MONK', 'BLADE', 'SPIRIT', 'GRADE 1', 'EXORCIST', 'VESSEL', 'OATH'];

export function playerName() {
  const tag = devTag();
  if (tag) return tag.toUpperCase();
  let v = null;
  try { v = localStorage.getItem(NAME_KEY); } catch { }
  if (!v) {
    const r = crypto.getRandomValues(new Uint16Array(2));
    v = ADJ[r[0] % ADJ.length] + ' ' + NOUN[r[1] % NOUN.length];
    try { localStorage.setItem(NAME_KEY, v); } catch { }
  }
  return v;
}

export function setPlayerName(v) {
  const clean = String(v || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 16).trim();
  if (!clean) return playerName();
  try { localStorage.setItem(NAME_KEY, clean); } catch { }
  return clean;
}

// Short, unambiguous, speakable-over-a-call room code.
export function makeCode() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return [...a].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
}
