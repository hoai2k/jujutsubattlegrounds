// /stats/ — who is playing, and from where.
//
// A read-only view over the `siteVisits` rows written by src/stats/telemetry.js.
// It subscribes rather than polls, so a visitor who opens the game while this
// page is up appears within a second or so, marked LIVE.
//
// The page is not linked from the game and is marked noindex. That is privacy
// by obscurity and nothing stronger: the InstantDB app id is public and its
// permissions are the permissive defaults, exactly as online play needs them,
// so anyone who reads the bundle can read these rows too. Nothing here is
// worth more than that — no IPs, no names, no accounts.
import './stats.css';
import { getDb, netError, playerId } from '../net/client.js';
import { VISITS, LIVE_MS } from './telemetry.js';

const root = document.getElementById('stats-root');
const ME = playerId();

let rows = [];
let error = null;
let loaded = false;
let range = 7;              // days; 0 = everything
let hideMe = false;

// ---- helpers ---------------------------------------------------------------

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 'GB' -> 🇬🇧. Regional indicators are just A-Z offset into a separate block.
function flag(cc) {
  const c = String(cc || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return '';
  return String.fromCodePoint(...[...c].map(ch => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function ago(t) {
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toISOString().slice(0, 10);
}

function dur(sec) {
  const s = Math.max(0, sec | 0);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

const isLive = r => Date.now() - (r.beatAt || 0) < LIVE_MS;

// Country first, then the timezone as the fallback for a row whose IP lookup
// never came back — 'Europe/Warsaw' is still an answer to "from where".
function place(r) {
  const bits = [r.city, r.region, r.country].filter(Boolean);
  if (bits.length) return [...new Set(bits)].join(', ');
  if (r.countryCode) return r.countryCode;
  return r.tz || 'unknown';
}

function countryOf(r) {
  return r.country || r.countryCode || (r.tz ? r.tz.split('/')[0] : '') || 'unknown';
}

function tally(list, keyFn) {
  const m = new Map();
  for (const r of list) {
    const k = keyFn(r);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]);
}

// ---- rendering -------------------------------------------------------------

function barList(pairs, total, limit = 8) {
  if (!pairs.length) return '<div class="empty">nothing yet</div>';
  const top = pairs.slice(0, limit);
  const max = top[0][1] || 1;
  return `<div class="rows">${top.map(([k, n]) => `
    <div class="row">
      <span class="fill" style="width:${Math.max(2, (n / max) * 100)}%"></span>
      <span class="label">${esc(k)}</span>
      <span class="val">${n}${total ? ` · ${Math.round((n / total) * 100)}%` : ''}</span>
    </div>`).join('')}</div>`;
}

function dayChart(list) {
  const days = range && range <= 30 ? range : 14;
  const day = 86400000;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const start = today.getTime() - (days - 1 - i) * day;
    return { start, label: new Date(start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), n: 0 };
  });
  for (const r of list) {
    const i = Math.floor((r.startedAt - buckets[0].start) / day);
    if (i >= 0 && i < days) buckets[i].n++;
  }
  const max = Math.max(1, ...buckets.map(b => b.n));
  return `<div class="days">${buckets.map(b => `
    <div class="day" title="${esc(b.label)}: ${b.n}">
      <i style="height:${(b.n / max) * 100}%"></i>
      <em>${b.n || '&nbsp;'}</em>
    </div>`).join('')}</div>`;
}

function table(list) {
  if (!list.length) return '<div class="empty">no visits in this range</div>';
  return `<div class="scroll"><table>
    <thead><tr>
      <th>when</th><th>where</th><th>network</th><th>device</th>
      <th>stayed</th><th>matches</th><th>last match</th><th>from</th>
    </tr></thead>
    <tbody>${list.slice(0, 120).map(r => `
      <tr>
        <td>${isLive(r) ? '<span class="pulse">● live</span>' : esc(ago(r.startedAt))}
            ${r.visitor === ME ? '<span class="badge you">you</span>' : ''}
            ${r.page && r.page !== 'game' ? `<span class="badge">${esc(r.page)}</span>` : ''}</td>
        <td>${flag(r.countryCode)} ${esc(place(r))}</td>
        <td class="dim">${esc(r.isp || r.tz || '')}</td>
        <td class="dim">${esc([r.browser, r.platform, r.mobile ? 'mobile' : ''].filter(Boolean).join(' · '))}</td>
        <td class="dim">${esc(dur(r.seconds))}</td>
        <td>${r.matches || 0}${r.online ? ' <span class="badge on">online</span>' : ''}</td>
        <td class="dim">${esc(r.lastChars || '')}${r.lastWinner ? ` <span class="sub2">→ ${esc(r.lastWinner)}</span>` : ''}${r.lastMap ? ` <span class="sub2">@ ${esc(r.lastMap)}</span>` : ''}</td>
        <td class="dim">${esc(r.ref || 'direct')}</td>
      </tr>`).join('')}</tbody>
  </table></div>`;
}

function render() {
  if (!loaded && !error) {
    root.innerHTML = '<h1>Jujutsu Battlegrounds — stats</h1><p class="sub">connecting…</p>';
    return;
  }
  if (error) {
    root.innerHTML = `<h1>Jujutsu Battlegrounds — stats</h1>
      <p class="sub">could not reach the database: ${esc(error)}</p>
      <p class="note">Online play uses the same connection, so if this is failing the
      lobby is failing too — an ad blocker, an offline machine or a blocked
      websocket are the usual causes.</p>`;
    return;
  }

  const cutoff = range ? Date.now() - range * 86400000 : 0;
  const list = rows
    .filter(r => r.startedAt >= cutoff)
    .filter(r => !hideMe || r.visitor !== ME);

  const visitors = new Set(list.map(r => r.visitor));
  const strangers = new Set(list.filter(r => r.visitor !== ME).map(r => r.visitor));
  const live = list.filter(isLive);
  const matches = list.reduce((n, r) => n + (r.matches || 0), 0);
  const countries = tally(list, r => `${flag(r.countryCode)} ${countryOf(r)}`.trim());

  root.innerHTML = `
    <h1>Jujutsu Battlegrounds — stats</h1>
    <p class="sub"><span class="dot">●</span> live view · ${rows.length} visits recorded all-time ·
       updated ${esc(new Date().toLocaleTimeString())}</p>

    <div class="bar">
      ${[[1, '24h'], [7, '7 days'], [30, '30 days'], [0, 'all time']].map(([d, l]) =>
        `<button data-range="${d}" aria-pressed="${range === d}">${l}</button>`).join('')}
      <button data-hideme aria-pressed="${hideMe}">hide my own visits</button>
    </div>

    <div class="tiles">
      <div class="tile"><div class="n">${list.length}</div><div class="k">visits</div></div>
      <div class="tile"><div class="n">${visitors.size}</div><div class="k">browsers</div></div>
      <div class="tile"><div class="n">${strangers.size}</div><div class="k">not you</div></div>
      <div class="tile"><div class="n">${countries.length}</div><div class="k">countries</div></div>
      <div class="tile"><div class="n">${matches}</div><div class="k">matches played</div></div>
      <div class="tile live"><div class="n">${live.length}</div><div class="k">on the site now</div></div>
    </div>

    <h2>visits per day</h2>
    ${dayChart(list)}

    <div class="cols">
      <div>
        <h2>country</h2>
        ${barList(countries, list.length)}
        <h2>city</h2>
        ${barList(tally(list, r => (r.city ? `${flag(r.countryCode)} ${r.city}` : '')), list.length)}
        <h2>network</h2>
        ${barList(tally(list, r => r.isp), list.length)}
      </div>
      <div>
        <h2>timezone</h2>
        ${barList(tally(list, r => r.tz), list.length)}
        <h2>browser / device</h2>
        ${barList(tally(list, r => [r.browser, r.mobile ? 'mobile' : 'desktop'].filter(Boolean).join(' · ')), list.length)}
        <h2>arrived from</h2>
        ${barList(tally(list, r => r.ref || 'direct link'), list.length)}
      </div>
    </div>

    <h2>sessions</h2>
    ${table(list.slice().sort((a, b) => b.startedAt - a.startedAt))}

    <p class="note">One row per page load. Location comes from a geo-IP lookup the
    visitor's own browser makes, falling back to their timezone; no IP address is
    stored. "Browsers" counts the random per-browser id online play already uses —
    clearing site data makes someone a new browser. <a href="../">back to the game</a></p>`;

  for (const b of root.querySelectorAll('[data-range]'))
    b.onclick = () => { range = Number(b.dataset.range); render(); };
  root.querySelector('[data-hideme]').onclick = () => { hideMe = !hideMe; render(); };
}

render();

(async () => {
  const db = await getDb();
  if (!db) { error = netError() || 'online unavailable'; render(); return; }
  db.subscribeQuery({ [VISITS]: {} }, res => {
    if (res.error) { error = res.error.message || 'query failed'; loaded = true; render(); return; }
    // Rows without a start time are junk from an interrupted first write.
    rows = (res.data?.[VISITS] || []).filter(r => r && r.startedAt);
    loaded = true;
    error = null;
    render();
  });
})();

// The clock is part of the display — "live", "3m ago", the day buckets — so a
// page left open keeps drifting into the truth without a database event.
setInterval(() => { if (loaded) render(); }, 20000);
