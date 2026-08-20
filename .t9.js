(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['uro','yuji'], p1:'uro', p2:'yuji', map:'shibuya_crossing' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
  g.loop.stop?.();
  const u = m.fighters[0], y = m.fighters[1];
  const DT = 1/60;
  const step = n => { for (let i=0;i<n;i++) m.update(DT); };
  // render one frame: the sim step, the visual step, then the composite
  // the chase camera would re-aim every frame; the shot harness pins it
  const draw = (n=1) => { for (let i=0;i<n;i++){
    const p = m.cams[0].cam.position.clone(), q = m.cams[0].cam.quaternion.clone();
    m.update(DT); m.render(1, DT);
    m.cams[0].cam.position.copy(p); m.cams[0].cam.quaternion.copy(q);
    g.stage.render(DT);
  } };
  const shot = async (name) => { await window.__stageShot(name); };

  // stage the two of them so the camera has something to look at
  // Staged the way the game's own chase camera actually frames a fight —
  // behind and above one fighter, looking down the line at the other — rather
  // than side-on, which is the one angle at which a plane standing across the
  // attack path is invisible.
  u.pos.set(0, 0, -3); u.facing = 0;
  y.pos.set(0, 0, 5.5); y.facing = Math.PI;
  m.cams[0].cam.position.set(2.2, 3.2, -8.5);
  m.cams[0].cam.lookAt(0, 1.5, 2.0);
  draw(2);
  await shot('fx_00_neutral');

  const grades = ['neutral','shoreline','volcano','flesh','void','shrine','pachinko','shadow','courtroom','swordfield'];

  // ---- THIN ICE BREAKER ---------------------------------------------------
  u.res.curCE = 100;
  m.effects.applyTechnique(u, 'uro_thin_ice', { ...u.cfg.ct1 });
  draw(6);  await shot('fx_01_thinice_crack');
  draw(8);  await shot('fx_02_thinice_shatter');
  draw(16); await shot('fx_03_thinice_dissolve');

  // ---- SPACE WARP STRIKE --------------------------------------------------
  m.warpfx.clear(); draw(2);
  u.res.curCE = 100;
  m.effects.applyTechnique(u, 'uro_warp_strike', { ...u.cfg.ct2 });
  draw(5);  await shot('fx_04_warp_fold');
  draw(8);  await shot('fx_05_warp_snap');

  // ---- SKY REFLECT --------------------------------------------------------
  m.warpfx.clear(); draw(2);
  m.warpfx.reflectSurface(u, 1.2);
  draw(6);  await shot('fx_06_reflect');
  // and it turning something around
  m.effects.applyTechnique(y, 'jogo_embers', { count:4, speed:9, range:12, dmg:2.5 });
  draw(10); await shot('fx_07_reflect_bounce');

  // ---- THE ULTIMATE -------------------------------------------------------
  m.warpfx.clear(); draw(2);
  m.effects.applyTechnique(u, 'uro_sky_collapse', {});
  draw(10); await shot('fx_08_collapse_early');
  draw(20); await shot('fx_09_collapse_peak');

  // ---- THE GRADE SWEEP ----------------------------------------------------
  // Thin Ice Breaker held mid-shatter, once per domain colour grade, so the
  // "is it readable inside every domain" question is a picture rather than an
  // opinion.
  const out = [];
  for (const gr of grades) {
    m.warpfx.clear(); draw(2);
    g.stage.setGrade(gr);
    for (let i=0;i<40;i++) g.stage.render(0.05);   // let the grade ease all the way in
    u.res.curCE = 100;
    m.effects.applyTechnique(u, 'uro_thin_ice', { ...u.cfg.ct1 });
    draw(10);
    await shot('grade_' + gr);
    out.push(gr);
  }
  g.stage.setGrade('neutral');
  return { shots: out };
})()
