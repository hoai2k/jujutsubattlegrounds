// Smoke: every overhauled CT effect fires in a live match without a runtime
// error, and its entities drain from the effects list. Uses the CPU-match
// flow from local-cpu.mjs, then drives the dispatcher directly.
import { makeClient, shutdown, wait } from './harness.mjs';
const W = (p, f, ms = 120000) => p.waitForFunction(f, null, { timeout: ms, polling: 300 });
const A = await makeClient('L');
const errors = [];
A.page.on('pageerror', e => errors.push(String(e)));
await A.page.evaluate(() => { const s = window.__select; s.cursors[0] = 0; s._confirmChar(0, 0); s.chars[0] = s._pickFor(0, 0); s.phase = 1; });
await wait(300);
await A.page.evaluate(() => { const s = window.__select; s.cursors[0] = 2; s.chars[1] = s._pickFor(1, 2); s._finish(); });
await W(A.page, "!!document.querySelector('.map-screen')");
await A.page.keyboard.press('Enter');
await W(A.page, "!!window.__game.match");
await W(A.page, "window.__game.match.phase==='fight'");

const KEYS = [
  'todo_clapcombo', 'yuji_divergent', 'yuji_manji', 'naoya_framekick',
  'nanami_cleave', 'higuruma_gavel', 'mahito_bodyweapon', 'mahito_soultouch',
  'hakari_smash', 'yuta_rika_swing', 'panda_palm',
  'toji_cloud_sweep', 'toji_spear_thrust'
];
for (const key of KEYS) {
  const r = await A.page.evaluate((k) => {
    const m = window.__game.match;
    try {
      m.effects.applyTechnique(m.fighters[0], k, {});
      return { ok: true, ents: m.effects.entities.length };
    } catch (e) { return { ok: false, err: String(e && e.stack || e) }; }
  }, key);
  console.log(key, r.ok ? `ok (entities ${r.ents})` : 'FAIL ' + r.err);
  if (!r.ok) errors.push(key + ': ' + r.err);
  await wait(400); // let the entity live a few dozen frames
}
// let everything travel out and drain
await wait(2500);
const tail = await A.page.evaluate(() => ({
  phase: window.__game.match.phase,
  entities: window.__game.match.effects.entities.map(e => e.type),
  hp: window.__game.match.fighters.map(f => Math.round(f.res.hp))
}));
console.log('phase', tail.phase, 'remaining entities', tail.entities, 'hp', tail.hp);
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO PAGE ERRORS');
await shutdown();
process.exit(errors.length ? 1 : 0);
