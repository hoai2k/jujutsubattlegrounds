// Visit telemetry: one document per page load, patched in place as the visit
// goes on. Read back by the dashboard at /stats/.
//
// RULES THIS MODULE OBEYS
//
// - It is loaded lazily and never on the critical path. `startVisit()` returns
//   immediately; everything after that happens in the background.
// - It cannot break the game. Every database call is fire-and-forget inside a
//   try, and a missing/blocked/broken InstantDB is simply a visit nobody
//   records. The game never learns that anything failed.
// - It is off in dev. A local `npm run dev` would otherwise write into the
//   same public app as the live site and drown the real visitors. `?stats=1`
//   forces it on for testing the pipeline.
// - It stores no IP address and no name a player did not choose. Identity is
//   the same random per-browser id online play already uses, so a returning
//   player is recognisable as "the same browser" and as nothing else.
//
// The shape is deliberately ONE ROW PER VISIT rather than a stream of events:
// the dashboard is then a plain aggregation over a few hundred rows, and the
// write volume of a long session is a heartbeat every 30 s instead of an
// unbounded event log in a database with public write access.
import { getDb, api, playerId } from './client.js';
import { localGeo, lookupGeo } from './geo.js';

export const VISITS = 'siteVisits';

const BEAT_MS = 30000;      // heartbeat: also what "playing right now" means
export const LIVE_MS = 90000;      // ...a row beaten within this is live

const OPTOUT_KEY = 'ca.stats.optout';

let db = null;
let docId = null;
let queued = null;          // patch waiting for the document to exist
let startedAt = 0;
let matches = 0;
let timer = null;

function forced() {
  try { return new URLSearchParams(location.search).has('stats'); } catch { return false; }
}

function optedOut() {
  try { return localStorage.getItem(OPTOUT_KEY) === '1'; } catch { return false; }
}

export function setOptOut(on) {
  try { on ? localStorage.setItem(OPTOUT_KEY, '1') : localStorage.removeItem(OPTOUT_KEY); } catch { }
}

export function enabled() {
  if (optedOut()) return false;
  return !!import.meta.env?.PROD || forced();
}

// Merge into the pending patch and write as soon as there is somewhere to
// write it. Coalescing matters: geo, the first match and a heartbeat can all
// land in the same tick before the document even exists.
function push(patch) {
  queued = Object.assign(queued || {}, patch);
  drain();
}

function drain() {
  if (!db || !docId || !queued) return;
  const patch = queued;
  queued = null;
  try { db.transact(db.tx[VISITS][docId].update(patch)); } catch { }
}

function device() {
  const out = {};
  try {
    out.mobile = !!navigator.userAgentData?.mobile
      || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');
    out.platform = navigator.userAgentData?.platform || navigator.platform || '';
    out.screen = `${screen.width}x${screen.height}`;
    out.dpr = Math.round((devicePixelRatio || 1) * 100) / 100;
    out.cores = navigator.hardwareConcurrency || 0;
    out.touch = (navigator.maxTouchPoints || 0) > 0;
    // The browser family only — the full UA string is a fingerprint and is
    // not worth keeping to answer "who is playing my game".
    const ua = navigator.userAgent || '';
    out.browser = /Edg\//.test(ua) ? 'Edge'
      : /OPR\//.test(ua) ? 'Opera'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Chrome\//.test(ua) ? 'Chrome'
            : /Safari\//.test(ua) ? 'Safari' : 'other';
  } catch { }
  return out;
}

function referrer() {
  try {
    if (!document.referrer) return '';
    const u = new URL(document.referrer);
    return u.host === location.host ? '' : u.host;
  } catch { return ''; }
}

// Start recording this page load. Safe to call more than once; only the first
// call does anything.
export function startVisit(page = 'game') {
  if (!enabled() || startedAt) return;
  startedAt = Date.now();

  push({
    page,
    visitor: playerId(),
    startedAt,
    beatAt: startedAt,
    seconds: 0,
    matches: 0,
    ref: referrer(),
    ...device(),
    ...localGeo()
  });

  (async () => {
    const handle = await getDb();
    if (!handle) return;         // offline or blocked — nothing to record into
    db = handle;
    docId = api().id();
    drain();
  })();

  // The IP lookup runs alongside, and patches the row whenever it lands.
  lookupGeo().then(geo => { if (geo) push(geo); });

  timer = setInterval(beat, BEAT_MS);
  addEventListener('pagehide', beat);
  // A tab left open on the title screen for an hour is not an hour of play,
  // so the clock stops while the page is hidden and the row simply stops
  // being "live".
  addEventListener('visibilitychange', () => { if (!document.hidden) beat(); });
}

function beat() {
  if (!startedAt) return;
  const now = Date.now();
  push({ beatAt: now, seconds: Math.round((now - startedAt) / 1000) });
}

// One line of gameplay context per visit: how many matches were played, with
// whom, and whether anyone was online. Deliberately a rolling summary on the
// visit row rather than a per-match document.
export function trackMatch({ chars = [], map = '', mode = 'local' } = {}) {
  if (!startedAt) return;
  matches++;
  push({
    matches,
    lastChars: chars.filter(Boolean).join(' vs '),
    lastMap: map || '',
    mode,
    // Sticky: the interesting question is "did this visitor ever get an online
    // match going", and one local rematch afterwards should not erase that.
    ...(mode === 'online' ? { online: true } : {})
  });
}

export function trackResult(winner) {
  if (!startedAt) return;
  push({ lastWinner: winner || '' });
}

// Stop the timers. Only used by tests and the dev console; a real visit ends
// when the page does.
export function stopVisit() {
  if (timer) clearInterval(timer);
  timer = null;
  startedAt = 0;
}
