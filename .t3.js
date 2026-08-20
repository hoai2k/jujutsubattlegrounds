(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['uro','dagon'], p1:'uro', p2:'dagon', map:'jujutsu_high' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
  const u = m.fighters[0];
  const out = { introDone:u.state, seatCount:m.fighters.length };
  const emptyish = () => ({ move:{x:0,z:0}, cam:{x:0,y:0}, jump:false, jumpP:false, punch:false, punchP:false,
    heavy:false, heavyP:false, ct1:false, ct1P:false, ct2:false, ct2P:false, block:false, dash:false,
    ult:false, ultP:false, copy:false, copyP:false, taunt:false, tauntP:false, lock:false, lockP:false,
    start:false, startP:false, select:false, selectP:false, back:false, backP:false,
    leftP:false, rightP:false, upP:false, downP:false, confirmP:false, pauseP:false });
  const orig = g.input.pollAll.bind(g.input);
  window.__drive = null;
  g.input.pollAll = (mode, seats) => {
    const r = orig(mode, seats);
    if (window.__drive) { const f = emptyish(); Object.assign(f, window.__drive); r.all[0] = f; }
    return r;
  };
  window.__drive = { jump:true, jumpP:true };
  await wait(800);
  out.afterJump = { state:u.state, y:+u.pos.y.toFixed(2), vy:+u.vel.y.toFixed(2), grounded:u.grounded, hoverT:+(u.hoverT||0).toFixed(2) };
  out.inputSeen = m.inputs.get(u) ? { jump:m.inputs.get(u).jump, jumpP:m.inputs.get(u).jumpP } : 'none';
  window.__drive = { jump:true };
  await wait(2500);
  out.afterHold = { state:u.state, y:+u.pos.y.toFixed(2), vy:+u.vel.y.toFixed(2), hoverT:+(u.hoverT||0).toFixed(2), ceil:+(u.hoverCeil||0).toFixed(2), stam:+u.res.stamina.toFixed(0) };
  window.__drive = {};
  await wait(2000);
  out.afterRelease = { state:u.state, y:+u.pos.y.toFixed(2), hoverT:+(u.hoverT||0).toFixed(2), stam:+u.res.stamina.toFixed(0) };
  return out;
})()
