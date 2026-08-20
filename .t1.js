(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['uro','dagon'], p1:'uro', p2:'dagon', map:'jujutsu_high' });
  await wait(4000);
  const m = window.__game.match;
  if (!m) return 'NO MATCH';
  // let the intro run out
  for (let i=0;i<60 && m.fighters[0].state==='intro';i++) await wait(250);
  const rec = { states:new Set(), hoverMax:0, yMax:0, reflects:0, errors:[], frames:0, samples:[] };
  const t0 = performance.now();
  let lastRaf = performance.now(), frames = 0;
  const raf = () => { frames++; requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  for (let i=0;i<80;i++){
    await wait(250);
    for (const f of m.fighters){ rec.states.add(f.cfg.id+':'+f.state); }
    const u = m.fighters[0];
    rec.hoverMax = Math.max(rec.hoverMax, u.hoverT||0);
    rec.yMax = Math.max(rec.yMax, u.pos.y);
    rec.reflects = Math.max(rec.reflects, u.reflectCount||0);
  }
  const secs = (performance.now()-t0)/1000;
  return {
    fps: +(frames/secs).toFixed(1),
    seconds: +secs.toFixed(1),
    uro: { hp:+m.fighters[0].res.hp.toFixed(1), maxCE:+m.fighters[0].res.maxCE.toFixed(1), stam:+m.fighters[0].res.stamina.toFixed(1), hoverMax:+rec.hoverMax.toFixed(2), yMax:+rec.yMax.toFixed(2), reflects:rec.reflects },
    dagon: { hp:+m.fighters[1].res.hp.toFixed(1), maxCE:+m.fighters[1].res.maxCE.toFixed(1) },
    ocean: m.ocean.stats(),
    warpItems: m.warpfx.items.length,
    warpActive: m.warpfx.active,
    statesSeen: [...rec.states].sort()
  };
})()
