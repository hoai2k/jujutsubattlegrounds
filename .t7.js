(async()=>{
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  window.__skipSelect({ mode:'cpu', chars:['uro','jogo'], p1:'uro', p2:'jogo', map:'shibuya_crossing' });
  await wait(4000);
  const g = window.__game, m = g.match;
  for (let i=0;i<80 && m.fighters[0].state==='intro';i++) await wait(200);
  g.loop.stop?.();
  const u = m.fighters[0], j = m.fighters[1];
  const { REFLECTABLE, tryReflect } = await import('/src/combat/reflect.js');
  const { ROSTER } = await import('/src/characters/index.js');

  const CASES = [
    ['jogo',   'ct1',  'jogo_embers',           'ember insects'],
    ['jogo',   'ct2',  'jogo_eruption',         'volcanic eruption'],
    ['choso',  'ct1',  'choso_blood_edge',      'blood edge'],
    ['choso',  'ct2',  'choso_piercing_blood',  'piercing blood'],
    ['sukuna', 'ct1',  'sukuna_dismantle',      'dismantle'],
    ['sukuna', 'ct2',  'sukuna_firearrow',      'fire arrow'],
    ['kashimo','ct1',  'kashimo_bolt',          'lightning bolt'],
    ['nobara', 'ct1',  'nobara_hairpin',        'hairpin nails'],
    ['nobara', null,   'nobara_resonance',      'resonance'],
    ['nanami', 'ct1',  'nanami_cleave',         'ratio wave'],
    ['todo',   'ct1',  'todo_clapcombo',        'resonant clap'],
    ['hanami', 'ct2',  'hanami_woodenball',     'wooden ball'],
    ['hanami', 'ct1',  'hanami_roots',          'roots'],
    ['yuji',   'ct2',  'yuji_manji',            'manji crescent'],
    ['yuji',   'ct1',  'yuji_divergent',        'divergent fist'],
    ['geto',   null,   'geto_uzumaki',          'uzumaki'],
    ['gojo',   null,   'purple',                'hollow purple'],
    ['gojo',   'ct1',  'gojo_red',              'red'],
    ['gojo',   'ct2',  'gojo_blue',             'blue'],
    ['dagon',  'ct1',  'dagon_volley',          'shikigami volley'],
    ['dagon',  'ct2',  'dagon_tidal_slam',      'tidal slam'],
    ['megumi', 'ct1',  'megumi_shikigami',      'shikigami summon'],
    ['geto',   'ct2',  'geto_summon_special',   'curse summon'],
    ['inumaki','ct1',  'inumaki_command',       'cursed speech'],
    ['naoya',  'ct2',  'naoya_framekick',       'frame 24'],
    ['naoya',  'ct1',  'naoya_rush',            'projection rush'],
    ['yuki',   'ct1',  'yuki_mass_slam',        'star rage slam'],
    ['toji',   null,   'toji_chain_whip',       'chain'],
    ['uro',    'ct1',  'uro_thin_ice',          'thin ice breaker (mirror)'],
    ['uro',    'ct2',  'uro_warp_strike',       'space warp strike (mirror)']
  ];

  const out = [];
  for (const [who, slot, key, label] of CASES) {
    m.effects.entities.length = 0;
    j.pos.set(0, 0, 9); u.pos.set(0, 0, 0); u.facing = 0; j.facing = Math.PI;
    const cfg = ROSTER[who]?.config;
    const opts = slot ? (cfg?.[slot] ?? {}) : (cfg?.ultimate ?? cfg?.special ?? {});
    let err = null;
    try { m.effects.applyTechnique(j, key, { ...opts }); }
    catch (e) { err = String(e.message || e).slice(0, 70); }
    const ents = m.effects.entities.slice();
    const types = [...new Set(ents.map(e => e.type))];
    const travelling = types.filter(t => !!REFLECTABLE[t]);
    // put the surface up and offer each entity to the hook directly
    u.setState('skyReflect', { clip: 'reflect' });
    u.f = u.cfg.special.reflect.startup + 1;
    u.reflectLive = 1;
    u._reflectR = u.cfg.special.reflect.radius;
    u._reflectArc = u.cfg.special.reflect.arc;
    u.reflectCount = 0;
    let bounced = 0, capped = 0;
    for (const e of ents) {
      if (!e.pos) continue;
      e.pos.copy(u.pos).setY(1.2).add({ x: 0, y: 0, z: 1.0 });
      if (tryReflect(m, e)) bounced++;
      // and offer it a SECOND time — the mirror-match cap
      if (tryReflect(m, e)) capped++;
    }
    out.push({ label, key, entities: ents.length, types, reflectableTypes: travelling,
      reflected: bounced, secondBounce: capped, err });
  }
  return out;
})()
