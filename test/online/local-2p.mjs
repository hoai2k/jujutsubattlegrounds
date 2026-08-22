import { makeClient, shutdown, wait } from './harness.mjs';
const W=(p,f,ms=120000)=>p.waitForFunction(f,null,{timeout:ms,polling:300});
const A = await makeClient('L2');
await A.page.evaluate(()=>{ const s=window.__select; s.kbVersus=true; s._syncDevices(); s._refresh();
  s.cursors[0]=0; s.cursors[1]=3; s.locked[0]=true; s.locked[1]=true; });
await W(A.page, "!!document.querySelector('.map-screen')");
await A.page.keyboard.press('Enter');
await W(A.page, "!!window.__game.match && window.__game.match.phase==='fight'");
console.log('local 2P', await A.page.evaluate(()=>{const m=window.__game.match;return{
 mode:m.mode,net:!!m.net,views:m.viewSeats,cams:m.cams.length,split:document.querySelectorAll('.split-tag.on').length};}));
await A.page.screenshot({path:'test/online/shots/local-2p.png'});
await shutdown(); console.log('done');
