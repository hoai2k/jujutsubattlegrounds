import { chromium } from 'playwright';
import { createServer } from 'vite';
const ids = JSON.parse(process.argv[2]);
const name = process.argv[3];
const server = await createServer({ server: { port: 5198, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 760 } });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto('http://localhost:5198/#viewer', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__viewer, null, { timeout: 30000 });
await page.waitForTimeout(500);
const r = await page.evaluate(async ({ ids, name }) => {
  const v = window.__viewer;
  v.lineup(ids);
  // the viewer's own auto-frame pushes the camera out by 1.25x the row width,
  // which for a long row lands it well inside the scene fog. Frame it by hand.
  v.setCam(0, 0.02, ids.length * 0.86 + 2.0, 0.98);
  v.step(1 / 60, 40);
  await new Promise(r => setTimeout(r, 350));
  return await v.shot(name, 1600, 760);
}, { ids, name });
console.log(r);
await browser.close(); await server.close(); process.exit(0);
