// Where is this browser? Two independent answers, best-effort, never blocking.
//
// 1. LOCAL — the IANA timezone and the language list. Costs nothing, cannot
//    fail, cannot be blocked, and is already enough to tell "someone in Brazil
//    played this" from "that was me again".
// 2. NETWORK — a geo-IP lookup against ipwho.is, which is free, CORS-open and
//    needs no key. It gives country/region/city/ISP. The visitor's IP goes to
//    that service (it is the one doing the lookup); we never store the IP
//    ourselves, only the place it resolved to.
//
// The lookup is cached in localStorage for half a day: a returning player on
// the same connection does not re-ask, so the free tier is never a concern.
// Every failure path — blocked by an extension, offline, rate limited, slow —
// resolves to the local answer rather than rejecting.

const CACHE_KEY = 'ca.stats.geo';
const CACHE_MS = 12 * 60 * 60 * 1000;
const ENDPOINT = 'https://ipwho.is/';
const TIMEOUT_MS = 4000;

// Timezone + locale. Always available, always instant.
export function localGeo() {
  const out = { geoSrc: 'tz' };
  try { out.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { }
  try { out.tzOffset = -new Date().getTimezoneOffset(); } catch { }
  try {
    out.lang = navigator.language || '';
    // The second subtag of a locale is a region ('pt-BR' -> BR), which is a
    // usable country guess on its own when the IP lookup is unavailable.
    const region = new Intl.Locale(out.lang).region;
    if (region) out.countryCode = region;
  } catch { }
  return out;
}

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (raw && Date.now() - raw.at < CACHE_MS) return raw.geo;
  } catch { }
  return null;
}

function writeCache(geo) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), geo })); } catch { }
}

// Resolves to the geo fields, or null if the lookup did not work out. Never
// rejects — the caller has already recorded the local answer.
export async function lookupGeo() {
  const hit = readCache();
  if (hit) return hit;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, { signal: ctl.signal, referrerPolicy: 'no-referrer' });
    const j = await res.json();
    if (!j || j.success === false) return null;
    const geo = {
      geoSrc: 'ip',
      country: j.country || '',
      countryCode: j.country_code || '',
      region: j.region || '',
      city: j.city || '',
      // The network operator is the single most useful "is this a stranger?"
      // signal after the city: your own ISP appears over and over.
      isp: j.connection?.isp || j.connection?.org || ''
    };
    writeCache(geo);
    return geo;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
