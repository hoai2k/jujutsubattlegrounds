(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const results = [];
  // Every combination the brief asks about: each new finisher against a
  // standard body, a giant, a four-armed body, a non-humanoid and — the new
  // case — a FLYING loser.
  const PAIRS = [
    ['uro','yuji'], ['uro','jogo'], ['uro','panda'], ['uro','sukuna:yuji'],
    ['uro','kurourushi'], ['uro','hanami'], ['uro','dagon'], ['uro','uro'],
    ['dagon','yuji'], ['dagon','jogo'], ['dagon','panda'], ['dagon','sukuna'],
    ['dagon','kurourushi'], ['dagon','hanami'], ['dagon','uro'], ['dagon','maki'],
    ['dagon','dagon'], ['dagon','miwa'], ['uro','toji']
  ];
  for (const [a, b] of PAIRS) {
    window.__skipSelect({ mode:'cpu', chars:[a,b], p1:a, p2:b, map:'shibuya_crossing' });
    await wait(2500);
    const g = window.__game, m = g.match;
    for (let i=0;i<60 && m.fighters[0].state==='intro';i++) await wait(120);
    g.loop.stop?.();
    const DT = 1/60;
    const step = n => { for (let i=0;i<n;i++){ m.update(DT); m.render(1, DT); } };
    const win = m.fighters[0], lose = m.fighters[1];
    // put the loser in the air first when they can fly — the case the brief
    // says the finisher system has to handle
    let flew = false;
    if (lose.cfg.flight) { lose.pos.y += 4.2; lose.grounded = false; lose.hoverT = 1.5; flew = true; }
    lose.res.hp = 0;
    let err = null, ran = false, frames = 0, actions = 0;
    try {
      // the two gates the harness has to satisfy by hand: the match has to be
      // over, and the loser has to be down
      m.winner = win;
      m.matchOver = true;
      lose.res.hp = 0;
      lose.setState('ko', { clip: 'ko' });
      ran = m.finishers.tryBegin(win, null, 0);
      if (ran) {
        const seen = new Set();
        for (let i=0;i<60*22 && m.finishers.active; i++) {
          m.finishers.update(DT); frames++;
          const idx = m.finishers.active?.idx;
          if (idx != null) seen.add(idx);
        }
        actions = seen.size;
      }
    } catch (e) { err = (e.message || String(e)).slice(0, 110); }
    results.push({ pair:a+' vs '+b, flyingLoser:flew, ran, id:m.finishers.active?.def?.id ?? null,
      frames, actions, loserY:+lose.pos.y.toFixed(2), loserHover:+(lose.hoverT||0).toFixed(2),
      ocean:m.ocean.list.length, warp:m.warpfx.items.length, err });
    m.finishers.abort?.();
    g.quitToSelect();
    await wait(900);
  }
  return results;
})()
