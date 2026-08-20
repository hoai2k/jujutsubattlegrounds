(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['uro','dagon'], p1:'uro', p2:'dagon', map:'jujutsu_high' });
  await wait(4000);
  const g = window.__game, m = g.match;
  if (!m) return 'NO MATCH';
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);

  // ---- SCRIPTED SEAT 0 -----------------------------------------------------
  // pollAll is wrapped rather than replaced, so seat 1's CPU and every menu
  // read are untouched; only seat 0's frame is overwritten.
  const emptyish = () => ({ move:{x:0,z:0}, cam:{x:0,y:0}, jump:false, jumpP:false, punch:false, punchP:false,
    heavy:false, heavyP:false, ct1:false, ct1P:false, ct2:false, ct2P:false, block:false, dash:false,
    ult:false, ultP:false, copy:false, copyP:false, taunt:false, tauntP:false, lock:false, lockP:false,
    start:false, startP:false, select:false, selectP:false, back:false, backP:false,
    leftP:false, rightP:false, upP:false, downP:false, confirmP:false, pauseP:false });
  window.__drive = null;
  const orig = g.input.pollAll.bind(g.input);
  g.input.pollAll = (mode, seats) => {
    const r = orig(mode, seats);
    if (window.__drive) {
      const f = emptyish();
      window.__drive(f, r.all[0]);
      r.all[0] = f;
    }
    return r;
  };
  const prev = {};
  // a tiny press helper: `edge` fields are true only on the frame the driver
  // asks for them, which is what the state machine's *P inputs expect
  const drive = (spec) => { window.__drive = (f) => { Object.assign(f, spec); }; };

  const log = [];
  const snap = (tag) => {
    const u = m.fighters[0], d = m.fighters[1];
    log.push({ tag, uState:u.state, uY:+u.pos.y.toFixed(2), hover:+(u.hoverT||0).toFixed(2),
      stam:+u.res.stamina.toFixed(0), ce:+u.res.curCE.toFixed(0), refl:u.reflectCount||0,
      dHp:+d.res.hp.toFixed(1), warp:m.warpfx.items.length, ocean:m.ocean.list.length });
  };

  // 1. JUMP AND HOVER
  m.fighters[0].res.curCE = 100; m.fighters[0].res.maxCE = 100;
  drive({ jump:true, jumpP:true });
  await wait(400);
  drive({ jump:true });                       // hold to climb
  await wait(2500);
  snap('climbing');
  drive({});                                  // let go — should hold station
  await wait(2000);
  snap('hovering');

  // 2. AERIAL TECHNIQUES
  m.fighters[0].res.curCE = 100;
  drive({ ct1:true, ct1P:true });
  await wait(300); drive({}); await wait(1200);
  snap('afterCT1');
  m.fighters[0].res.curCE = 100;
  drive({ ct2:true, ct2P:true });
  await wait(300); drive({}); await wait(1500);
  snap('afterCT2');

  // 3. REFLECT
  m.fighters[0].res.curCE = 100;
  drive({ copy:true, copyP:true });
  await wait(200); drive({}); await wait(1200);
  snap('afterReflect');

  // 4. STAMINA EXHAUSTION -> falls out of the sky
  m.fighters[0].res.stamina = 8;
  drive({});
  await wait(2500);
  snap('outOfStamina');

  return { log, err:null };
})()
