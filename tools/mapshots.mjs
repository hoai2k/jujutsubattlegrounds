// Drives src/arena/mapshot.js headlessly and drops the beauty shots in shots/.
// The contact sheet is how a set-dressing change gets LOOKED at rather than
// just validated — mapcheck proves a map is walkable, not that it is worth
// walking through.
//
//     node tools/mapshots.mjs                 # all ten
//     node tools/mapshots.mjs sewer_lair
import { chromium } from 'playwright';
import { createServer } from 'vite';
const only = process.argv.slice(2);
const server = await createServer({ server: { port: 5198, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto('http://localhost:5198/', { waitUntil: 'domcontentloaded' });
const names = await page.evaluate(async only => {
  const ms = await import('/src/arena/mapshot.js');
  return await ms.shootAll(only.length ? { ids: only } : {});
}, only);
console.log(JSON.stringify(names));
await browser.close();
await server.close();
