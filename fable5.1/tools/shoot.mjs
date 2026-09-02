// SCREENSHOT HARNESS for fable5.1 — boots the dev server, opens a URL under
// /fable5.1/, optionally runs a script in the page, and saves a PNG.
//   node fable5.1/tools/shoot.mjs "?bench=lineup" out.png [--wait 2500] [--eval "js"] [--keys Enter,Enter]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';
// playwright is installed globally in this environment, not in package.json
// (no dependencies are added for the redesign) — resolve it from the global root.
const globalRoot = process.env.PW_ROOT || execSync('npm root -g').toString().trim();
const { chromium } = createRequire(import.meta.url)(globalRoot + '/playwright');

const args = process.argv.slice(2);
const url = args[0] || '';
const out = args[1] || 'shot.png';
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const wait = +opt('--wait', 2500);
const evalSrc = opt('--eval', null);
const keys = opt('--keys', '').split(',').filter(Boolean);
const w = +opt('--w', 1280), h = +opt('--h', 720);

const server = await createServer({ server: { port: 5231, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('pageerror', e => errs.push(e.message + '\n' + String(e.stack || '').split('\n').slice(1, 4).join('\n')));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
await page.goto('http://localhost:5231/fable5.1/' + url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
for (const k of keys) { await page.keyboard.press(k); await page.waitForTimeout(400); }
await page.waitForTimeout(wait);
let result = null;
if (evalSrc) result = await page.evaluate(evalSrc);
await page.screenshot({ path: out });
console.log(JSON.stringify({ out, result, errors: errs.slice(0, 10) }, null, 1));
await browser.close(); await server.close();
process.exit(0);
