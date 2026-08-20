// VISIT TELEMETRY — one real browser, a stub database, one full run from the
// title screen into a match.
//
// What this proves, in order:
//   1. A page load writes exactly one `siteVisits` row, with a place in it.
//   2. The row survives a geo-IP lookup that FAILS — which is the normal case
//      behind an ad blocker, and the case where a bug would silently lose
//      every visitor who runs one. The timezone has to be there regardless.
//   3. Playing a match patches that same row rather than writing a second one.
//   4. None of it is on the critical path: the game reaches a fight either way.
//
// Like test/online, this is a plain node script against a running dev server:
//
//     npm i -D playwright
//     npm run dev -- --port 5178
//     node test/stats.mjs
//
// Telemetry is off in a dev build, so the page is opened with `?stats=1` —
// the same switch used to smoke-test the pipeline against the live site.
import pw from 'playwright';
const { chromium } = pw;

const URL_ = (process.env.CA_URL || 'http://127.0.0.1:5178/') + '?stats=1';
const wait = ms => new Promise(r => setTimeout(r, ms));

// The slice of InstantDB telemetry uses: `id()`, `tx.ns[id].update()` and
// `transact()`. Documents are merged into window.__docs so the test can read
// back exactly what the live service would have stored.
const STUB = `window.__mockInstant = function () {
  window.__docs = {};
  const tx = new Proxy({}, { get: (_, ns) => new Proxy({}, { get: (__, id) => ({
    update: obj => ({ ns, id, op: 'update', obj }),
    delete: () => ({ ns, id, op: 'delete' })
  }) }) });
  const db = {
    tx,
    transact(chunks) {
      for (const c of [].concat(chunks)) {
        const bucket = (window.__docs[c.ns] ||= {});
        if (c.op === 'delete') delete bucket[c.id];
        else bucket[c.id] = { ...(bucket[c.id] || {}), ...c.obj, id: c.id };
      }
      return Promise.resolve();
    },
    subscribeQuery(q, cb) { cb({ data: {} }); return () => {}; },
    subscribeConnectionStatus() {},
    joinRoom() { return { publishPresence(){}, subscribePresence(){ return () => {}; },
      publishTopic(){}, subscribeTopic(){ return () => {}; }, leaveRoom(){} }; }
  };
  let n = 0;
  return { db, api: { id: () => 'stub-' + (++n), tx, lookup: () => {} } };
};`;

const fails = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  if (!ok) fails.push(name);
};

const browser = await chromium.launch({
  executablePath: process.env.CA_CHROME || undefined,
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio']
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await ctx.addInitScript(STUB);
// The geo-IP call must fail, because that is the interesting path: the row
// still has to say where this browser is.
await ctx.route('https://ipwho.is/**', r => r.abort());
const page = await ctx.newPage();
page.on('pageerror', e => console.log('[ERR]', e.message));

const visits = () => page.evaluate(() => Object.values(window.__docs?.siteVisits || {}));

await page.goto(URL_);
await page.waitForFunction(() => !!window.__game, null, { timeout: 20000 });
await page.waitForFunction(() => Object.keys(window.__docs?.siteVisits || {}).length === 1,
  null, { timeout: 20000, polling: 200 });

let rows = await visits();
const v = rows[0];
check('one visit row per page load', rows.length === 1);
check('page recorded', v.page === 'game', v.page);
check('visitor id recorded', typeof v.visitor === 'string' && v.visitor.length > 4);
check('start time recorded', v.startedAt > 0);
check('timezone survives a failed geo-IP lookup', !!v.tz, v.tz + ' / ' + v.geoSrc);
check('no ip address stored', !JSON.stringify(v).includes('"ip"'));
check('device recorded', !!v.browser && !!v.screen, `${v.browser} ${v.screen}`);
check('no match counted yet', v.matches === 0);

// ---- play a match --------------------------------------------------------
await page.waitForSelector('.ts-start', { timeout: 20000 });
await page.click('.ts-start');
await page.waitForFunction(() => !!window.__select, null, { timeout: 20000 });
await wait(900);
await page.evaluate(() => { const s = window.__select; s.cursors[0] = 0; s._confirmChar(0, 0); s.chars[0] = s._pickFor(0, 0); s.phase = 1; });
await wait(300);
await page.evaluate(() => { const s = window.__select; s.cursors[0] = 2; s.chars[1] = s._pickFor(1, 2); s._finish(); });
await page.waitForFunction(() => !!document.querySelector('.map-screen'), null, { timeout: 30000, polling: 200 });
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.match?.phase === 'fight', null, { timeout: 60000, polling: 300 });

rows = await visits();
const m = rows[0];
check('still one row after a match starts', rows.length === 1, String(rows.length));
check('match counted', m.matches === 1, String(m.matches));
check('matchup recorded', /\w+ vs \w+/.test(m.lastChars || ''), m.lastChars);
check('map recorded', !!m.lastMap, m.lastMap);
check('mode recorded', !!m.mode, m.mode);
check('the game itself is fine', await page.evaluate(() => window.__game.match.fighters.length >= 2));

console.log('\nrow:', JSON.stringify(rows[0], null, 1));
await browser.close();
if (fails.length) { console.error('\n' + fails.length + ' FAILED: ' + fails.join(', ')); process.exit(1); }
console.log('\nall checks passed');
