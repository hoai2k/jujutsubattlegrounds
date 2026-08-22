// Headless model-review harness. Drives the viewer's own `castSheet`/`sheet`
// helpers in a real browser so the shots are the ones the viewer produces —
// same lights, same materials, same outlines — rather than a second renderer
// that could disagree with it.
import { chromium } from 'playwright';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const jobs = JSON.parse(args[0]);

const server = await createServer({ server: { port: 5199, strictPort: true } });
await server.listen();

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('console', m => { if (m.type() === 'error') console.log('  [page error]', m.text()); });
page.on('pageerror', e => console.log('  [pageerror]', e.message));
await page.goto('http://localhost:5199/#viewer', { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__viewer, null, { timeout: 30000 });
await page.waitForTimeout(600);

for (const job of jobs) {
  const r = await page.evaluate(async j => {
    const v = window.__viewer;
    try {
      if (j.kind === 'cast') return await v.castSheet(j.name, j.ids, j.opts || {});
      if (j.kind === "sheet") { v.loadChar(j.id); await new Promise(r => setTimeout(r, 200)); return await v.sheet(j.name, j.opts || {}); }
      if (j.kind === "strip") { v.loadChar(j.id); await new Promise(r => setTimeout(r, 200)); return await v.strip(j.name, j.clip, j.opts || {}); }
    } catch (e) { return 'ERROR: ' + e.message + '\n' + e.stack; }
  }, job);
  console.log(job.name, '->', r);
}
await browser.close();
await server.close();
process.exit(0);
