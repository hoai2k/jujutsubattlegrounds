// The title screen, the panel's two states, and the "a game just opened"
// toast arriving while somebody is already on the roster.
import { makeClient, makeTitleClient, shutdown, wait } from './harness.mjs';

const txt = (p, s) => p.evaluate(x => document.querySelector(x)?.innerText.replace(/\s*\n+\s*/g, ' | ') || null, s);
const shot = (p, n) => p.screenshot({ path: 'test/online/shots/' + n });

// B stays on the title screen; C sits on the roster. A will host, and both
// should notice.
const B = await makeTitleClient('B');
console.log('title, no games:', await txt(B.page, '.title-screen'));
await shot(B.page, 'title-1-plain.png');

const C = await makeClient('C');
console.log('C panel, no games:', await txt(C.page, '.online-panel'));
await shot(C.page, 'panel-1-no-games.png');

const A = await makeClient('A');
await A.page.click('.online-panel [data-a="host"]');
// Poll for the toast rather than guessing: it auto-clears after a few seconds
// and a fixed sleep either misses it or races it.
const toast = p => p.evaluate(() => document.querySelector('.online-toast.on')?.textContent || null);
let bToast = null, cToast = null;
for (let i = 0; i < 24; i++) {
  await wait(400);
  bToast ||= await toast(B.page);
  cToast ||= await toast(C.page);
  if (bToast && cToast) break;
}
console.log('\n--- after A hosts ---');
console.log('title toast seen:', bToast);
console.log('C toast seen:', cToast);
console.log('title, game open:', await txt(B.page, '.title-screen'));
await shot(B.page, 'title-2-join.png');

console.log('C panel:', await txt(C.page, '.online-panel'));
console.log('C join btn:', await C.page.evaluate(() => {
  const b = document.querySelector('.op-join');
  return { on: b.classList.contains('on'), display: getComputedStyle(b).display, disabled: b.disabled };
}));
await shot(C.page, 'panel-2-game-open.png');

// And joining straight from the title screen.
await B.page.click('.ts-join');
await wait(4000);
console.log('\nB after title-join, lobby:', await txt(B.page, '.lobby-overlay'));
await shot(B.page, 'title-3-joined.png');

await shutdown();
console.log('done');
