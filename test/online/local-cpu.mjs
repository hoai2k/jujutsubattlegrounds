// Regression: local play must be untouched by any of this.
import { makeClient, shutdown, wait } from './harness.mjs';
const W=(p,f,ms=120000)=>p.waitForFunction(f,null,{timeout:ms,polling:300});
const A = await makeClient('L');
console.log('panel', await A.page.evaluate(()=>document.querySelector('.online-panel')?.innerText.split('\n')[1]));
// VS CPU: pick both fighters through the normal sequential flow.
await A.page.evaluate(()=>{ const s=window.__select; s.cursors[0]=0; s._confirmChar(0,0); s.chars[0]=s._pickFor(0,0); s.phase=1; });
await wait(300);
await A.page.evaluate(()=>{ const s=window.__select; s.cursors[0]=2; s.chars[1]=s._pickFor(1,2); s._finish(); });
await W(A.page, "!!document.querySelector('.map-screen')");
console.log('map select reached');
await A.page.evaluate(()=>window.__game.current.update && document.querySelector('.map-screen') && null);
// choose the first map
await A.page.evaluate(()=>{ const m=window.__game; });
await A.page.keyboard.press('Enter');
await W(A.page, "!!window.__game.match");
await W(A.page, "window.__game.match.phase==='fight'");
const st = await A.page.evaluate(()=>{ const m=window.__game.match; return {
  mode:m.mode, net:!!m.net, views:m.viewSeats, cams:m.cams.length, fighters:m.fighters.length, cpu:!!m.cpu }; });
console.log('local match', st);
// let it run and confirm the CPU is fighting
await wait(6000);
console.log('after 6s', await A.page.evaluate(()=>window.__game.match.fighters.map(f=>`${f.cfg.name} ${f.state} hp${Math.round(f.res.hp)}`)));
console.log('fps', await A.page.evaluate(()=>Math.round(window.__game.loop.timing.fps)));
await A.page.screenshot({path:'test/online/shots/local-match.png'});
await shutdown(); console.log('done');
