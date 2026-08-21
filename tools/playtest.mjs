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
page.on('pageerror', e => { errs.push(e.message); });
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await page.goto('http://localhost:5197/', { waitUntil: 'networkidle' });
// title screen: any key
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });

const out = await page.evaluate(async src => {
  // eslint-disable-next-line no-new-func
  const fn = new Function('return (' + src + ')')();
  return await fn(window);
}, script);

await browser.close(); await server.close();
console.log(JSON.stringify({ result: out, errors: errs.slice(0, 12) }, null, 2));
process.exit(0);
