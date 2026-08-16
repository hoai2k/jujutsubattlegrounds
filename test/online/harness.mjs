// Two independent browsers, bridged by this file. Each gets a visible page (so
// requestAnimationFrame actually runs) and its own storage; the relay below is
// the mock server they share.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const MOCK = readFileSync(new URL('./mock.js', import.meta.url), 'utf8');
const URL_ = process.env.CA_URL || 'http://127.0.0.1:5178/';

const docs = {};
const clients = [];   // {tag, page}

function relay(fromTag, raw) {
  const m = JSON.parse(raw);
  if (m.t === 'tx') {
    for (const c of m.chunks) {
      docs[c.ns] = docs[c.ns] || {};
      if (c.op === 'delete') delete docs[c.ns][c.id];
      else docs[c.ns][c.id] = { ...(docs[c.ns][c.id] || {}), ...c.obj, id: c.id };
    }
    return broadcast({ t: 'docs', docs });
  }
  if (m.t === 'sync') return broadcast({ t: 'docs', docs });
  // presence / bye / topic go to everyone, sender included (Instant echoes
  // broadcasts back to the publisher, and the app has to cope with that).
  broadcast(m);
}

function broadcast(m) {
  for (const c of clients) {
    if (c.dead) continue;
    c.page.evaluate(x => window.__mockRecv?.(x), m).catch(() => { });
  }
}

// A client left sitting on the TITLE screen — `makeClient` presses START for
// you, which is what every other run wants.
export async function makeTitleClient(tag, opts) { return makeClient(tag, { ...opts, title: true }); }

export async function makeClient(tag, { log = false, title = false } = {}) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  await page.exposeBinding('__mockSend', (_src, raw) => relay(tag, raw));
  const entry = { tag, page, browser, dead: false };
  page.on('pageerror', e => console.log(`[${tag} ERR]`, e.message));
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' || log || /\[net\]/.test(t)) {
      if (!/WebGL|GL Driver|Failed to load resource/.test(t)) console.log(`[${tag}]`, t.slice(0, 260));
    }
  });
  clients.push(entry);
  await page.goto(URL_ + '?player=' + tag);
  await page.waitForFunction(() => !!window.__game, null, { timeout: 20000 });
  // Past the title screen. Every run below starts on the character select, so
  // pressing START here keeps each script about the thing it is testing.
  await page.waitForSelector('.ts-start', { timeout: 20000 });
  if (title) { await page.waitForTimeout(1500); return entry; }
  await page.click('.ts-start');
  await page.waitForFunction(() => !!window.__select, null, { timeout: 20000 });
  await page.waitForTimeout(900);
  return entry;
}

// Click START MATCH once the lobby will actually accept it. `canStart` depends
// on presence arriving from every peer, so a fixed sleep either races it or
// wastes time — and these pages render a 3D scene on a software rasteriser,
// which makes wall-clock timing meaningless.
export async function startMatch(host, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await host.page.evaluate(() => {
      const b = document.querySelector('.lb-start');
      if (!b || b.disabled) return false;
      b.click();
      return true;
    });
    if (ok) return;
    await wait(400);
  }
  throw new Error('START MATCH never became available');
}

export async function killClient(c) { c.dead = true; await c.browser.close(); }
export async function shutdown() { for (const c of clients) if (!c.dead) await c.browser.close().catch(() => { }); }
export const wait = ms => new Promise(r => setTimeout(r, ms));
