// Dev scratch: confirm every character still boots, fights and can open their
// ultimate after the Uro domain work touched fighter.js / effects.js / ai.js.
import { chromium } from 'playwright';
const PORT = process.env.PORT || 5199;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
const errs = [];
page.on('pageerror', e => { errs.push(e.message); console.log('  [ERR]', e.message); });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
for (let i = 0; i < 12 && !(await page.evaluate('!!window.__skipSelect')); i++) {
  await page.keyboard.down('Space'); await page.waitForTimeout(180);
  await page.keyboard.up('Space'); await page.waitForTimeout(320);
}
await page.waitForFunction('!!window.__skipSelect', null, { timeout: 20000 });
const out = await page.evaluate(`(async () => {
  const g = window.__game, L = [], dt = 1/60;
  const { ROSTER_IDS } = await import('/src/characters/index.js');
  for (const id of ROSTER_IDS) {
    if (g.match) { g.loop.start(); g.quitToSelect(); }
    let w = Date.now();
    while (typeof window.__skipSelect !== 'function' && Date.now()-w < 20000) await new Promise(r=>setTimeout(r,100));
    window.__skipSelect({ chars: [id, 'uro'], map: 'shibuya_crossing', mode: 'cpu' });
    let t = Date.now(); while (!g.match && Date.now()-t < 20000) await new Promise(r=>setTimeout(r,100));
    const m = g.match;
    t = Date.now(); while (m.phase !== 'fight' && Date.now()-t < 25000) await new Promise(r=>setTimeout(r,100));
    g.loop.stop();
    const f = m.fighters[0];
    let note = 'ok';
    try {
      for (let i = 0; i < 120; i++) m.update(dt);
      f.res.maxCE = 130; f.res.curCE = 130; f.backlash = 0;
      if (f.cfg.domain) m.domains.castDomain(f, m.ctxFor(f));
      for (let i = 0; i < 60 * 6; i++) m.update(dt);
      if (f.cfg.domain) note = 'domain=' + (m.domains.active ? m.domains.active.phase : 'ended');
      if (m.domains.active) m.domains.dismiss(m.domains.active.caster);
      for (let i = 0; i < 60; i++) m.update(dt);
      if (f.state === 'ct' && f.f > 400) note += ' STUCK-IN-CT';
    } catch (e) { note = 'THREW: ' + e.message; }
    L.push(id.padEnd(12) + note);
  }
  return L.join('\\n');
})()`);
console.log(out);
console.log('page errors:', errs.length);
await browser.close();
