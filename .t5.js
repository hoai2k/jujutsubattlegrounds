(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['dagon','yuji'], p1:'dagon', p2:'yuji', map:'shibuya_crossing' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
  g.loop.stop?.();                      // take the sim off the render loop
  const d = m.fighters[0];
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
  const DT = 1/60;
  const step = n => { for (let i=0;i<n;i++) m.update(DT); };

  // ---- cast ---------------------------------------------------------------
  d.res.maxCE = 100; d.res.curCE = 100;
  window.__drive = { ult:true, ultP:true };
  step(6);
  window.__drive = {};
  step(180);                                    // ride out the cast

  // ---- the full 20 seconds, sampled every half second --------------------
  const times = [], samples = [];
  let peak = 0, peakAt = 0, firstShark = null;
  for (let s=0; s<52; s++) {
    const t0 = performance.now();
    step(30);
    times.push((performance.now()-t0)/30);
    const st = m.ocean.stats();
    const ds = m.domains.state;
    if (st.slots > peak) { peak = st.slots; peakAt = s*0.5; }
    const kinds = {};
    for (const c of m.ocean.list) if (c.alive) kinds[c.type]=(kinds[c.type]||0)+1;
    if (!firstShark && kinds.shark) firstShark = +(s*0.5).toFixed(1);
    samples.push({ t:+(s*0.5).toFixed(1), timer:+(ds?.timer ?? 0).toFixed(1), alive:st.alive,
      slots:st.slots, spawned:st.spawned, culled:st.culled, kinds,
      foeHp:+m.fighters[1].res.hp.toFixed(0) });
    if (!ds && st.spawned>0) break;
  }
  const after = { oceanAlive: m.ocean.list.filter(c=>c.alive).length, domain: !!m.domains.state };
  const sorted = times.slice().sort((a,b)=>a-b);
  return {
    peakSlots: peak, peakAtSeconds: peakAt, firstSharkAt: firstShark,
    tickMs: { median:+(sorted[sorted.length>>1]).toFixed(3), p95:+(sorted[Math.floor(sorted.length*0.95)]).toFixed(3), max:+Math.max(...times).toFixed(3) },
    afterCollapse: after,
    samples: samples.filter((_,i)=>i%4===0 || i===samples.length-1)
  };
})()
