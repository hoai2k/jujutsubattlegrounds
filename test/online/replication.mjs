import { makeClient, killClient, shutdown, wait } from './harness.mjs';

const step = async (label, fn) => { console.log('\n=== ' + label + ' ==='); await fn(); };
const txt = (p, sel) => p.evaluate(s => document.querySelector(s)?.innerText.replace(/\s*\n+\s*/g, ' | ') || null, sel);
const lob = p => txt(p, '.lobby-overlay');
const pan = p => txt(p, '.online-panel');
const snap = p => p.evaluate(() => {
  const m = window.__game.match;
  if (!m) return null;
  return {
    map: m.mapId, seed: m.matchSeed, round: m.round, phase: m.phase,
    views: m.viewSeats, local: m.net?.localSeats, host: !!m.net?.isHost,
    f: m.fighters.map(f => `${f.cfg.name} ${f.pos.x.toFixed(1)},${f.pos.z.toFixed(1)} ${f.state} hp${Math.round(f.res.hp)} lv${f.lives}`)
  };
});

const A = await makeClient('A');
const B = await makeClient('B');

await step('boot', async () => {
  console.log('A', await pan(A.page));
  console.log('B', await pan(B.page));
});

await step('A hosts', async () => {
  await A.page.click('.online-panel [data-a="host"]');
  await wait(2000);
  console.log('A lobby', await lob(A.page));
  console.log('B panel', await pan(B.page));
});

await step('B joins', async () => {
  await B.page.click('.online-panel [data-a="join"]');
  await wait(2500);
  console.log('A lobby', await lob(A.page));
  console.log('B lobby', await lob(B.page));
});

const lockIn = (c, i) => c.page.evaluate(n => {
  const s = window.__select;
  s.cursors[0] = n; s.locked[0] = true; s.inVariant[0] = false;
}, i);

await step('both pick', async () => {
  await lockIn(A, 0);
  await lockIn(B, 2);
  await wait(2000);
  console.log('A lobby', await lob(A.page));
  console.log('B lobby', await lob(B.page));
});

await step('host starts', async () => {
  await A.page.click('.lb-start');
  await wait(3500);
  console.log('A', await snap(A.page));
  console.log('B', await snap(B.page));
  await A.page.screenshot({ path: 'test/online/shots/A-match.png' });
  await B.page.screenshot({ path: 'test/online/shots/B-match.png' });
});

await step('drive inputs', async () => {
  await A.page.evaluate(() => { const k = window.__game.input.keys; k.add('KeyD'); });
  await B.page.evaluate(() => { const k = window.__game.input.keys; k.add('KeyW'); });
  await wait(2500);
  console.log('A sees', (await snap(A.page)).f);
  console.log('B sees', (await snap(B.page)).f);
  await A.page.evaluate(() => window.__game.input.keys.clear());
  await B.page.evaluate(() => window.__game.input.keys.clear());
  await wait(1200);
  console.log('after release');
  console.log('A sees', (await snap(A.page)).f);
  console.log('B sees', (await snap(B.page)).f);
});

await step('fight: damage agreement', async () => {
  // Walk them together and mash punch on both sides.
  for (let i = 0; i < 5; i++) {
    await A.page.evaluate(() => { const k = window.__game.input.keys; k.add('KeyJ'); });
    await B.page.evaluate(() => { const k = window.__game.input.keys; k.add('KeyJ'); });
    await wait(500);
    await A.page.evaluate(() => window.__game.input.keys.delete('KeyJ'));
    await B.page.evaluate(() => window.__game.input.keys.delete('KeyJ'));
    await wait(300);
  }
  console.log('A', (await snap(A.page)).f);
  console.log('B', (await snap(B.page)).f);
});

await step('B disconnects', async () => {
  await killClient(B);
  await wait(10000);
  console.log('A banner', await txt(A.page, '.net-banner'));
  console.log('A cpuSeats', await A.page.evaluate(() => [...(window.__game.match?.cpuSeats.keys() || [])]));
  console.log('A', await snap(A.page));
  await A.page.screenshot({ path: 'test/online/shots/A-dropped.png' });
});

await shutdown();
console.log('\ndone');
