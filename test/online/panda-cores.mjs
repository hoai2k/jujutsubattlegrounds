// PANDA'S CORES — a regression on the SHARED HEALTH POOL.
//
// He used to carry three separate pools (68 / 60 / 54 base, 182 total against
// a roster norm of 100), which in play was three lives: you killed him, he
// swapped to a full core, you killed him again. `cores.shared` in his config
// replaced that with one ordinary bar behind all three stances.
//
// The failure mode this guards against is SILENT AND SEVERE. The pool is wired
// as accessors onto one object (see combat/cores.js) precisely so that the
// fourteen `res.hp` sites in the codebase keep working untouched; if that
// wiring regresses, nothing throws — he just quietly has extra lives again, or
// a stance swap quietly heals him. So the three things asserted here are the
// three that cannot be read off a stack trace:
//
//   1. every core reports the same pool
//   2. a stance swap does NOT restore health
//   3. emptying the pool kills him ONCE, with no fall-through to another core
//
//   npm run dev -- --port 5178
//   node test/online/panda-cores.mjs
import { makeClient, shutdown, wait } from './harness.mjs';

const W = (p, f, ms = 90000) => p.waitForFunction(f, null, { timeout: ms, polling: 300 });
const fails = [];
const check = (label, ok, got) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}${ok ? '' : '  got ' + JSON.stringify(got)}`);
  if (!ok) fails.push(label);
};

const A = await makeClient('L');
A.page.on('pageerror', e => fails.push('pageerror: ' + String(e).slice(0, 200)));

// any opponent, Panda on the other seat
await A.page.evaluate(() => { const s = window.__select; s.cursors[0] = 0; s._confirmChar(0, 0); s.chars[0] = s._pickFor(0, 0); s.phase = 1; });
await wait(300);
await A.page.evaluate(() => { const s = window.__select; s.chars[1] = 'panda'; s._finish(); });
await W(A.page, "!!document.querySelector('.map-screen')");
await A.page.keyboard.press('Enter');
await W(A.page, "!!window.__game.match");
await W(A.page, "window.__game.match.phase==='fight'");

const start = await A.page.evaluate(() => {
  const p = window.__game.match.fighters.find(f => f.cores);
  return {
    hp: Math.round(p.res.hp), maxHP: Math.round(p.maxHP), stance: p.stance,
    cores: p.cores.map(c => Math.round(c.hp)), shared: !!p.cfg.cores.shared
  };
});
console.log('start   ', JSON.stringify(start));
check('cores.shared is declared', start.shared, start);
check('all cores report one pool at full', new Set(start.cores).size === 1 && start.cores[0] === start.maxHP, start);
// one bar, not three: the total must be the bar, not the sum of three bars
check('total health is one ordinary bar', start.maxHP < 320, start);

const swapped = await A.page.evaluate(() => {
  const p = window.__game.match.fighters.find(f => f.cores);
  p.res.hp -= 60;
  const hurt = p.cores.map(c => Math.round(c.hp));
  p._setStance('gorilla');
  return { hurt, stance: p.stance, hp: Math.round(p.res.hp), maxHP: Math.round(p.maxHP), alive: p.alive };
});
console.log('after 60', JSON.stringify(swapped));
check('damage in one stance is damage to every core', new Set(swapped.hurt).size === 1, swapped);
check('stance swap does not restore health', swapped.hp === start.maxHP - 60, swapped);
check('the swap still happened', swapped.stance === 'gorilla' && swapped.alive, swapped);

const emptied = await A.page.evaluate(() => {
  const p = window.__game.match.fighters.find(f => f.cores);
  p.res.hp = 0;
  return { alive: p.alive, coresAlive: p.cores.filter(c => c.alive).length };
});
console.log('emptied ', JSON.stringify(emptied));
check('an empty pool is dead, with no core left to fall through to',
  emptied.alive === false && emptied.coresAlive === 0, emptied);

await shutdown();
console.log(fails.length ? `\n${fails.length} FAILED:\n` + fails.join('\n') : '\nall checks passed');
process.exit(fails.length ? 1 : 0);
