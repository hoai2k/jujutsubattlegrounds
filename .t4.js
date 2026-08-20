(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['dagon','yuji'], p1:'dagon', p2:'yuji', map:'jujutsu_high' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
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
  // ---- MEASURE THE LOGIC TICK, not the frame ------------------------------
  // Under SwiftShader the GPU is the bottleneck by an order of magnitude, so a
  // frame rate here would only measure the software rasteriser. What actually
  // matters for "does the spawn tank the framerate" is the SIMULATION cost, and
  // that is measurable and meaningful in any environment.
  const times = [];
  const origTick = m._logicTick ? m._logicTick.bind(m) : null;
  if (origTick) m._logicTick = (...a) => { const t0=performance.now(); const r=origTick(...a); times.push(performance.now()-t0); return r; };

  // ---- CAST THE DOMAIN ----------------------------------------------------
  d.res.maxCE = 100; d.res.curCE = 100;
  window.__drive = { ult:true, ultP:true };
  await wait(400);
  window.__drive = {};
  const samples = [];
  let peak = 0, peakT = 0;
  for (let i=0;i<48;i++){
    await wait(500);
    const st = m.ocean.stats();
    const ds = m.domains.state;
    if (st.slots > peak) { peak = st.slots; peakT = i*0.5; }
    samples.push({ t:+(i*0.5).toFixed(1), phase: ds?.phase ?? '-', timer:+(ds?.timer ?? 0).toFixed(1),
      alive:st.alive, slots:st.slots, spawned:st.spawned, culled:st.culled, foeHp:+m.fighters[1].res.hp.toFixed(0) });
    if (!ds && st.spawned > 0) break;
  }
  const sorted = times.slice().sort((a,b)=>a-b);
  return {
    peakSlots: peak, peakAtSeconds: peakT,
    tickMs: { n:times.length, median:+(sorted[sorted.length>>1]||0).toFixed(3), p95:+(sorted[Math.floor(sorted.length*0.95)]||0).toFixed(3), max:+(Math.max(...times)||0).toFixed(3) },
    renderInfo: { calls:g.stage.renderer.info.render.calls, tris:g.stage.renderer.info.render.triangles, geos:g.stage.renderer.info.memory.geometries },
    samples
  };
})()
