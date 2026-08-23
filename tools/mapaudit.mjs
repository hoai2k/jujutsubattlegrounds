// MAP AUDIT — runs the dev-only validator in src/arena/mapcheck.js headlessly.
//
// mapcheck.js is written to be driven from the browser console, which means it
// was only ever run when somebody remembered to. This drives the same two
// entry points in a real page (canvas textures and a WebGL context are both
// needed) and prints one machine-readable JSON blob, so "no clipping, no
// backward stairs, no soft locks" is a claim that can be re-checked in seconds
// rather than re-argued.
//
//     node tools/mapaudit.mjs            # colliders only (fast)
//     node tools/mapaudit.mjs --rims     # + the drawn-ledge raycast pass
//     node tools/mapaudit.mjs --rims shibuya_crossing kyoto_grounds
import { chromium } from 'playwright';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const wantRims = args.includes('--rims');
const only = args.filter(a => !a.startsWith('--'));

const server = await createServer({ server: { port: 5197, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
const warns = [];
page.on('console', m => { if (m.type() === 'warning') warns.push(m.text()); });
await page.goto('http://localhost:5197/', { waitUntil: 'domcontentloaded' });

const res = await page.evaluate(async ({ wantRims, only }) => {
  const mc = await import('/src/arena/mapcheck.js');
  const idx = await import('/src/arena/index.js');
  const ids = only.length ? only : idx.MAP_IDS;
  const out = { maps: [] };
  for (const id of ids) {
    const r = mc.check(id);
    out.maps.push({ id, findings: r.findings, platforms: r.platforms, walls: r.walls, cells: r.cells });
  }
  if (wantRims) {
    const rr = await mc.rims(ids);
    for (const r of rr) (out.maps.find(m => m.id === r.id) || {}).rims = r.rims;
  }
  return out;
}, { wantRims, only });

res.buildWarnings = [...new Set(warns)];
console.log(JSON.stringify(res, null, 1));

let total = 0;
for (const m of res.maps) total += m.findings.length + (m.rims?.length || 0);
console.error('\n=== ' + total + ' finding(s) across ' + res.maps.length + ' map(s) ===');
for (const m of res.maps) {
  const n = m.findings.length + (m.rims?.length || 0);
  console.error((n ? '  x ' : '  . ') + m.id.padEnd(24) + n);
}
await browser.close();
await server.close();
process.exit(total ? 1 : 0);
