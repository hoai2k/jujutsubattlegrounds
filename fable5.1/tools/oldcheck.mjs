// REGRESSION GUARD FOR THE OLD GAME — boots / (not /fable5.1/) headless and
// starts a CPU match through its own __skipSelect hook. The redesign must
// never break the game it sits beside.
//   node fable5.1/tools/oldcheck.mjs [out.png]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';
const { chromium } = createRequire(import.meta.url)(execSync('npm root -g').toString().trim() + '/playwright');
const server = await createServer({ root: '/home/user/jujutsubattlegrounds', server: { port: 5261, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 620 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('http://localhost:5261/', { waitUntil: 'networkidle' });
// the old bundle is large and SwiftShader is slow: keep pressing until the
// title has handed over to the select screen
const t0 = Date.now();
while (Date.now() - t0 < 120000 && !(await page.evaluate(() => !!window.__skipSelect))) { await page.keyboard.press('Enter'); await page.waitForTimeout(1000); }
const r = await page.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); window.__skipSelect({ mode: 'cpu', chars: ['yuji', 'megumi'], p1: 'yuji', p2: 'megumi', map: 'shibuya_crossing' }); const t0 = Date.now(); while (!window.__game?.match && Date.now() - t0 < 40000) await sleep(200); for (let i = 0; i < 20; i++) await sleep(100); const m = window.__game?.match; return m ? { phase: m.phase, fighters: m.fighters.map(f => f.cfg.id), tick: m.tick } : 'no match'; });
await page.screenshot({ path: process.argv[2] || 'old.png' });
console.log(JSON.stringify({ r, errs: errs.slice(0, 5) }));
await browser.close(); await server.close(); process.exit(0);
