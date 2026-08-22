// PLAYTEST HARNESS — drives a real match in a real browser and measures it.
//
// This exists because "it builds" and "the model renders" are not the same
// claim as "the character plays". Everything it reports is read off the live
// Match object mid-fight: real fighters, real state machine, real effect
// dispatcher, real terrain.
import { chromium } from 'playwright';
import { createServer } from 'vite';

const script = process.argv[2];
const server = await createServer({ server: { port: 5197, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1024, height: 620 } });
const errs = [];
// STACKS, not just messages. A per-frame error reported as one line of
// text is impossible to trace back to a call site, which cost an hour the
// first time this harness caught one.
page.on('pageerror', e => { errs.push(e.message + '\n' + String(e.stack || '').split('\n').slice(1, 5).join('\n')); });
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto('http://localhost:5197/', { waitUntil: 'networkidle' });
// title screen: any key
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });

// *** DO NOT AWAIT ONE LONG `sleep` IN A SCRIPT. ***
// Chromium throttles `requestAnimationFrame` in a page that is doing nothing,
// and the whole game loop is rAF-driven — so a script that does
// `await sleep(7000)` and then measures is measuring a match that ticked a
// handful of times. It does not error and it does not look wrong; it silently
// reports a technique doing a third of its damage.
//
// This cost a full retuning pass on Reggie's ultimate: measured across one
// 7-second sleep it landed 7 hits for 59.7 damage, and measured across
// twenty-eight 250 ms sleeps it landed 19 hits for 210.6 — the same code, the
// same frame, a 3.5x difference. Poll in short slices instead.
const out = await page.evaluate(async src => {
  // eslint-disable-next-line no-new-func
  const fn = new Function('return (' + src + ')')();
  return await fn(window);
}, script);

await browser.close(); await server.close();
console.log(JSON.stringify({ result: out, errors: errs.slice(0, 12) }, null, 2));
process.exit(0);
