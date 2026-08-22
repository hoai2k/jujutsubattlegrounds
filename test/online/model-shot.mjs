// MODEL SHOT — front-on body and head renders of one character, straight out
// of the viewer. Written while rebuilding Kashimo against his reference sheet,
// and kept because model work is unreviewable without it: the turntable never
// stops on the angle you need, and "does the fringe cover his eyes" is not a
// question a code diff can answer.
//
//   npm run dev -- --port 5178
//   node test/online/model-shot.mjs kashimo
//
// Writes shots/<id>-body.png and shots/<id>-head.png. CA_URL overrides the
// dev-server address, matching the rest of the harness.
import { chromium } from 'playwright';

const id = process.argv[2] || 'kashimo';
const base = (process.env.CA_URL || 'http://127.0.0.1:5178/').replace(/\/$/, '');

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--mute-audio']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
page.on('pageerror', e => { errors.push(String(e)); console.log('PAGEERR', String(e).slice(0, 250)); });

await page.goto(base + '/#viewer', { waitUntil: 'load' });
await page.waitForTimeout(4500);
await page.evaluate(async c => { await window.__viewer.loadChar(c); }, id);
await page.waitForTimeout(2000);

// FULL BODY, FRONT ON. `setSpin(0)` also switches the turntable off, which is
// the whole reason this script exists rather than a well-timed screenshot.
await page.evaluate(() => { window.__viewer.setSpin(0); window.__viewer.setCam(0, 0.02, 3.1, 0.95); });
await page.waitForTimeout(900);
// cropped past the viewer's control column so the model fills the frame
await page.screenshot({ path: `shots/${id}-body.png`, clip: { x: 340, y: 0, width: 760, height: 900 } });

// HEAD. Hair, face and any head prop are where model bugs actually live.
await page.evaluate(() => { window.__viewer.setCam(0, 0.0, 0.85, 1.62); });
await page.waitForTimeout(700);
await page.screenshot({ path: `shots/${id}-head.png`, clip: { x: 340, y: 0, width: 760, height: 900 } });

console.log(`${id}: shots/${id}-body.png shots/${id}-head.png`);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no page errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
