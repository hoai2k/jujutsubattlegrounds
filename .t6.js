(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['dagon','yuji'], p1:'dagon', p2:'yuji', map:'shibuya_crossing' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
  g.loop.stop?.();
  const d = m.fighters[0];
  const spawned = [];
  const died = [];
  const origSummon = m.ocean.summonFor.bind(m.ocean);
  // instrument the list rather than the constructor
  const seen = new WeakSet();
  const watch = () => {
    for (const c of m.ocean.list) {
      if (!seen.has(c)) { seen.add(c); spawned.push({ type:c.type, t:+m.ocean.clock.toFixed(1), hp:c.hp }); }
      if (c.dead && !c._noted) { c._noted = true; died.push({ type:c.type, t:+m.ocean.clock.toFixed(1), lifeLeft:+c.life.toFixed(1) }); }
    }
  };
  const emptyish = () => ({ move:{x:0,z:0}, cam:{x:0,y:0}, jump:false, jumpP:false, punch:false, punchP:false,
    heavy:false, heavyP:false, ct1:false, ct1P:false, ct2:false, ct2P:false, block:false, dash:false,
    ult:false, ultP:false, copy:false, copyP:false, taunt:false, tauntP:false, lock:false, lockP:false,
    start:false, startP:false, select:false, selectP:false, back:false, backP:false,
    leftP:false, rightP:false, upP:false, downP:false, confirmP:false, pauseP:false });
  const orig = g.input.pollAll.bind(g.input);
  window.__drive = null;
  g.input.pollAll = (mode, seats) => { const r = orig(mode, seats); if (window.__drive){const f=emptyish();Object.assign(f,window.__drive);r.all[0]=f;} return r; };
  const DT=1/60, step = n => { for (let i=0;i<n;i++){ m.update(DT); watch(); } };
  d.res.maxCE=100; d.res.curCE=100;
  window.__drive = { ult:true, ultP:true }; step(6); window.__drive={}; step(180);
  step(60*22);
  // ---- and the pure roll distribution, 4000 rolls per phase --------------
  const { rollType, spawnGap } = await import('/src/combat/ocean.js');
  const sw = d.cfg.domain.swarm;
  const dist = {};
  for (const t of [0.0, 0.35, 0.6, 0.85]) {
    const c = {};
    const st = { sinceShark: 99 };
    for (let i=0;i<4000;i++){ const k = rollType(sw, t, st); c[k]=(c[k]||0)+1; }
    dist['t='+t] = c;
  }
  const gaps = [0,0.25,0.5,0.75,1].map(t=>+spawnGap(sw,t).toFixed(2));
  return { spawned, died, dist, gaps, total: spawned.length };
})()
