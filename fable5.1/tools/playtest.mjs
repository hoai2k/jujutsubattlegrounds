// PLAYTEST HARNESS — boots the real game headless, skips the menus through
// __skipSelect, scripts inputs through the same InputManager path a keyboard
// uses, and reports what happened off the live Match.
//   node fable5.1/tools/playtest.mjs [p1] [p2] [map] [--frames 900] [--shot out.png]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'vite';
const globalRoot = process.env.PW_ROOT || execSync('npm root -g').toString().trim();
const { chromium } = createRequire(import.meta.url)(globalRoot + '/playwright');
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const p1 = args[0] || 'yuji', p2 = args[1] || 'megumi', map = args[2] || 'shibuya_crossing', mode = opt('--mode', 'cpu'), p3 = opt('--p3', null);
const shot = opt('--shot', null), frames = +opt('--frames', 900), script = opt('--script', 'brawl'), evalSrc = opt('--eval', null), training = process.argv.includes('--training'), finisher = process.argv.includes('--finisher');

const server = await createServer({ server: { port: 5241, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message + '\n' + String(e.stack || '').split('\n').slice(1, 5).join('\n')));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await page.goto('http://localhost:5241/fable5.1/?quality=' + opt('--quality', 'medium'), { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
const out = await page.evaluate(async ({ p1, p2, p3, map, frames, script, mode, evalSrc, training, finisher }) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  window.__skipSelect({ mode, picks: p3 ? [p1, p2, p3] : [p1, p2], map, rounds: 1, training });
  const t0 = Date.now();
  while (!window.__match && Date.now() - t0 < 20000) await sleep(100);
  const m = window.__match; if (!m) return { error: 'no match' };
  if (evalSrc) { try { (new Function('m', 'G', evalSrc))(m, window.__game); } catch (e) { return { error: 'eval: ' + e.message }; } }
  // scripted P1: the same path a keyboard uses
  const im = window.__game.input;
  const origPoll = im.poll.bind(im);
  let tick = 0;
  const SCRIPTS = {
    brawl: (t, f) => { f.move.z = -1; const w = (m, a) => t % m >= a && t % m < a + 3; if (t % 30 < 3) f.punch = true; if (w(90, 40)) f.heavy = true; if (w(150, 100)) f.ct1 = true; if (w(200, 150)) f.ct2 = true; if (w(240, 200)) f.special = true; if (w(400, 300)) f.jump = true; if (w(500, 450)) f.ult = true; },
    idle: () => {},
    block: (t, f) => { f.block = true; }
  };
  im.poll = (i) => { const f = origPoll(i); if (i === 0) im.frames[0] = f; if (i === 0 && m.phase === 'fight') { const g = { move: { x: 0, z: 0 } }; SCRIPTS[script](tick, g); f.move = g.move; for (const k of ['punch', 'heavy', 'ct1', 'ct2', 'special', 'jump', 'ult', 'block', 'dash']) { f[k] = !!g[k]; f[k + 'P'] = !!g[k] && !im._sp?.[k]; } im._sp = { ...g }; } return f; };
  const log = []; let lastTick = m.tick; const frameTimes = [];
  let last = performance.now();
  m.on('hit', d => { if (log.length < 60) log.push(`${m.tick} ${d.attacker.cfg.id}->${d.defender.cfg.id} ${d.result} ${d.hit.dmg?.toFixed(1)} ${d.hit.type || ''}`); });
  m.on('ko', () => log.push(`${m.tick} KO`));
  while (m.tick < frames && m.phase !== 'result') { await sleep(30); tick = m.tick; if (finisher && m.phase === 'ko') { m.slowmo = 1; m.slowT = 0; } if (finisher && m.finishers?.active && m.finishers.active.t > 1.2) { log.push('finisher ' + m.finishers.active.def.id + ' t=' + m.finishers.active.t.toFixed(2)); break; } const now = performance.now(); frameTimes.push(now - last); last = now; if (Date.now() - t0 > 90000) break; }
  const f = m.fighters.map(x => ({ id: x.cfg.id, hp: +x.res.hp.toFixed(1), maxCE: +x.res.maxCE.toFixed(1), ce: +x.res.curCE.toFixed(1), st: +x.res.stamina.toFixed(0), state: x.state, pos: [+x.pos.x.toFixed(2), +x.pos.y.toFixed(2), +x.pos.z.toFixed(2)], hits: x.hitsDealt, taken: x.hitsTaken }));
  const info = window.__game.stage.renderer.info;
  const u = window.__game.stage._eyes[0].post.look.uniforms; const look = Object.fromEntries(Object.entries(u).filter(([k,v])=>typeof v.value==='number').map(([k,v])=>[k,+v.value.toFixed(3)]));
  const L = window.__game.stage.lights; const lights = { key: L.key.intensity, rim: L.rim.intensity, hemi: L.hemi.intensity, fill: L.fill.intensity, exposure: window.__game.stage.renderer.toneMappingExposure, bg: window.__game.stage.scene.background?.getHexString?.() };
  return { look, lights, tick: m.tick, phase: m.phase, fighters: f, ents: m.effects.ents.length, particles: m.fx.particles.n, calls: info.render.calls, tris: info.render.triangles, log };
}, { p1, p2, p3, map, frames, script, mode, evalSrc, training, finisher });
if (shot) await page.screenshot({ path: shot });
console.log(JSON.stringify({ result: out, errors: errs.slice(0, 12) }, null, 1));
await browser.close(); await server.close();
process.exit(0);
