// Headless match driver: boots the game in Chromium, skips the title and the
// select screen, and runs a real match with scripted inputs so the new
// characters can actually be played rather than only compiled.
// Dev scratch — not part of the build.
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const PORT = process.env.PORT || 5199;
const script = process.argv[2];
const outName = process.argv[3] || null;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const logs = [];
page.on('console', m => {
  const t = m.text();
  if (t.includes('THREE.WebGL') || t.includes('[vite]')) return;
  logs.push(t);
  console.log('  [page]', t);
});
page.on('pageerror', e => { logs.push('ERR ' + e.message); console.log('  [ERR]', e.message, e.stack?.split('\n')[1] ?? ''); });

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

// press start on the title (confirmP = jump | punch | start)
await page.waitForTimeout(1200);
await page.click('#game-canvas', { position: { x: 640, y: 400 } }).catch(() => {});
// A tap is not enough: the input layer detects a PRESS EDGE by diffing a key
// set between polls, so a down+up inside one frame can be missed entirely.
// Hold it across a few frames.
for (let i = 0; i < 12 && !(await page.evaluate('!!window.__skipSelect')); i++) {
  await page.keyboard.down('Space');
  await page.waitForTimeout(180);
  await page.keyboard.up('Space');
  await page.waitForTimeout(320);
}
if (!(await page.evaluate('!!window.__skipSelect'))) {
  const dbg = await page.evaluate(`({
    game: !!window.__game,
    title: !!document.querySelector('.title-screen, #title, .title'),
    uiHtml: (document.getElementById('ui-root')?.className || '') + ' :: ' +
      [...(document.getElementById('ui-root')?.children || [])].map(c => c.className).join('|')
  })`);
  console.log('DEBUG', JSON.stringify(dbg));
}
await page.waitForFunction('!!window.__skipSelect', null, { timeout: 20000 });

const out = await page.evaluate(script);
console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
if (outName) writeFileSync(outName, JSON.stringify({ out, logs }, null, 2));
await browser.close();
