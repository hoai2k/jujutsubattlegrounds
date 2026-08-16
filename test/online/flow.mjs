import { makeClient, killClient, shutdown, startMatch, wait } from './harness.mjs';
const W = (p, fn, ms=180000) => p.waitForFunction(fn, null, { timeout: ms, polling: 400 });
const txt=(p,s)=>p.evaluate(x=>document.querySelector(x)?.innerText.replace(/\s*\n+\s*/g,' | ')||null,s);
const st = p => p.evaluate(() => { const m=window.__game.match; return {
  m: m ? {phase:m.phase, round:m.round, over:m.matchOver, lives:m.fighters.map(f=>f.lives), host:!!m.net?.isHost, cpu:[...m.cpuSeats.keys()]} : null,
  res: document.querySelector('.result-screen.on') ? (document.querySelector('.result-screen.locked')?'LOCKED':'OPEN') : null,
  banner: document.querySelector('.net-banner.on')?.textContent||null,
  lobby: document.querySelector('.lobby-overlay.on') ? document.querySelector('.lb-status')?.textContent : null,
  toast: document.querySelector('.online-toast.on')?.textContent||null }; });
const A = await makeClient('A'); const B = await makeClient('B');
const lockIn=(c,i)=>c.page.evaluate(n=>{const s=window.__select;s.cursors[0]=n;s.locked[0]=true;s.inVariant[0]=false;},i);
await A.page.click('.online-panel [data-a="host"]'); await wait(1800);
await B.page.click('.online-panel [data-a="join"]'); await wait(2200);
await lockIn(A,0); await lockIn(B,2); await wait(1800);
await startMatch(A);
await W(A.page,"window.__game.match?.phase==='fight'"); await W(B.page,"window.__game.match?.phase==='fight'");
console.log('\n== fight ==\nA',await st(A.page),'\nB',await st(B.page));
await A.page.evaluate(()=>{const m=window.__game.match;m.fighters[0].lives=1;m.net.flushSnaps(m);});
await B.page.evaluate(()=>{const m=window.__game.match;m.fighters[1].lives=1;m.net.flushSnaps(m);});
await wait(1200);
await B.page.evaluate(()=>{const m=window.__game.match;m.fighters[1].res.hp=0;m.net.flushSnaps(m);});
await W(A.page,"!!document.querySelector('.result-screen.on')");
await W(B.page,"!!document.querySelector('.result-screen.on')");
console.log('\n== result ==\nA',await st(A.page),'\nB',await st(B.page));
console.log('B wait text', await txt(B.page,'.r-wait'));
await A.page.screenshot({path:'test/online/shots/A-result.png'}); await B.page.screenshot({path:'test/online/shots/B-result.png'});
// guest press should do nothing
await B.page.evaluate(()=>document.querySelector('.result-screen [data-a="rematch"]').click());
await wait(2000);
console.log('after guest click  B', await st(B.page));
await A.page.evaluate(()=>document.querySelector('.result-screen [data-a="rematch"]').click());
await W(A.page,"window.__game.match?.round===1 && !window.__game.match.matchOver");
await W(B.page,"window.__game.match?.round===1 && !window.__game.match.matchOver");
console.log('\n== rematch ==\nA',await st(A.page),'\nB',await st(B.page));
await W(A.page,"window.__game.match?.phase==='fight'"); await W(B.page,"window.__game.match?.phase==='fight'");
await killClient(A);
await W(B.page,"window.__game.match?.cpuSeats.size>0", 60000).catch(e=>console.log('no takeover:',e.message.slice(0,60)));
console.log('\n== host gone ==\nB',await st(B.page));
await B.page.screenshot({path:'test/online/shots/B-hostgone.png'});
await shutdown(); console.log('done');
