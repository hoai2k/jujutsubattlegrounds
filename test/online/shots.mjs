// Screenshots of the online UI states on the select screen.
import { makeClient, shutdown, wait } from './harness.mjs';
const lockIn = (c, i) => c.page.evaluate(n => {
  const s = window.__select; s.cursors[0] = n; s.locked[0] = true; s.inVariant[0] = false;
}, i);

const A = await makeClient('A');
await A.page.screenshot({ path: 'test/online/shots/ui-1-panel-empty.png' });

await A.page.click('.online-panel [data-a="host"]');
await wait(2000);
await A.page.screenshot({ path: 'test/online/shots/ui-2-lobby-host.png' });

const B = await makeClient('B');
await wait(2500);
await B.page.screenshot({ path: 'test/online/shots/ui-3-panel-open-game.png' });

await B.page.click('.online-panel [data-a="join"]');
await wait(2500);
await B.page.screenshot({ path: 'test/online/shots/ui-4-lobby-guest.png' });

await lockIn(A, 0); await lockIn(B, 5);
await wait(2200);
await A.page.screenshot({ path: 'test/online/shots/ui-5-lobby-ready-host.png' });
await B.page.screenshot({ path: 'test/online/shots/ui-6-lobby-ready-guest.png' });

await shutdown();
console.log('shots done');
