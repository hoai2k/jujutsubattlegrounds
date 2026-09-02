// MAP PERF — boots a CPU match on each map headless, samples frames, reports
// median / p95 frame time and renderer counters at the given quality tier.
//   node fable5.1/tools/mapperf.mjs [--quality high] [map ...]
// Headless Chromium here runs on SwiftShader, so the absolute numbers are a
// software rasteriser's; use them RELATIVELY (map vs map, tier vs tier).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';
const globalRoot = process.env.PW_ROOT || execSync('npm root -g').toString().trim();
const { chromium } = createRequire(import.meta.url)(globalRoot + '/playwright');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const quality = opt('--quality', 'high');
const maps = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--quality');
const ids = maps.length ? maps : ['shibuya_underground', 'shibuya_crossing', 'sendai_school', 'jujutsu_high', 'detention', 'shinjuku', 'kyoto_grounds', 'star_tomb', 'yasohachi_bridge', 'sewer_lair'];
const server = await createServer({ server: { port: 5251, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = [], errs = [];
for (const map of ids) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 620 } });
  page.on('pageerror', e => errs.push(map + ': ' + e.message));
  await page.goto('http://localhost:5251/fable5.1/?quality=' + quality, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
  const r = await page.evaluate(async map => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    window.__skipSelect({ mode: 'cpu', picks: ['yuji', 'megumi'], map, rounds: 1 });
    const t0 = Date.now(); while (!window.__match && Date.now() - t0 < 20000) await sleep(100);
    if (!window.__match) return { map, error: 'no match' };
    for (let i = 0; i < 40; i++) await sleep(60);
    const frames = []; let last = performance.now();
    await new Promise(res => { let n = 0; const tick = () => { const now = performance.now(); frames.push(now - last); last = now; if (++n >= 90) return res(); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    frames.sort((a, b) => a - b);
    const info = window.__game.stage.renderer.info;
    return { map, medianMs: +frames[frames.length >> 1].toFixed(2), p95Ms: +frames[Math.floor(frames.length * 0.95)].toFixed(2), calls: info.render.calls, tris: info.render.triangles, geometries: info.memory.geometries, textures: info.memory.textures };
  }, map);
  out.push(r); console.error(JSON.stringify(r)); await page.close();
}
console.log(JSON.stringify({ quality, maps: out, pageErrors: [...new Set(errs)] }, null, 1));
await browser.close(); await server.close(); process.exit(0);
