// THE EFFECT TABLE — every technique key the configs use, mapped onto the
// small effect vocabulary in ./index.js. The move's own numbers (dmg, range,
// speed, radius, kb, kbY, hitstun) always win; entries here add the archetype
// and what the move cannot say for itself (shape, colour, timing shape).
//   projectile  a travelling body: speed, range, size, homing, count, pierce, boomerang
//   melee       a close strike from the caster: reach, arc
//   burst       an area around the caster: radius
//   zone        an area at the aim point (or under the target): reach, radius, delay, ticks
//   beam        a line from the caster: range, width
//   grab        a close hold: reach; throws on connect
//   rush        a lunge that carries a hit: lungeSpeed, reach
//   pull        drags the target toward the caster: range, pullTime
//   buff        a timed self-modifier: duration, dmgMult, speedMult
//   transform   a buff that also swaps the punch string / clips
//   summon      a minion that stays and attacks (simplified ally)
//   volley      several projectiles in a spread / sequence
// A key absent from this table falls back to `melee` with the move's numbers,
// so an unlisted technique still connects — and test/effects.mjs fails on it.
export const EFFECTS = {
  // ---- GOJO ----
  gojo_red: { arch: 'projectile', shape: 'orb', color: 0xff3a3a, size: 0.55, explode: 2.0, kd: true },
  gojo_blue: { arch: 'pull', shape: 'orb', color: 0x4f8fff, size: 0.5 },
  purple: { arch: 'beam', shape: 'sphere', color: 0xb060ff, width: 1.6, range: 22, travel: 24, unblockable: true, kd: true },
  void_lock: { arch: 'domainTick', color: 0xd0e0ff },
  // ---- YUJI ----
  yuji_manji: { arch: 'projectile', shape: 'disc', color: 0xff5f74, boomerang: true, returnDmg: 0.6 },
  yuji_divergent: { arch: 'zone', shape: 'crystal', color: 0xff4050, second: true, opens: 'blackflash' },
  yuji_sukuna: { arch: 'transform', color: 0xff2f45 },
  // ---- NANAMI ----
  nanami_cleave: { arch: 'projectile', shape: 'crescent', color: 0xf2b23c, size: 0.9 },
  nanami_overtime: { arch: 'buff', name: 'overtime', grade: 'overtime', color: 0xf2b23c },
  nanami_collapse: { arch: 'burst', radius: 3.4, color: 0xf2b23c, kd: true, quake: true },
  // ---- TODO ----
  todo_clapcombo: { arch: 'projectile', shape: 'wave', color: 0xff5fc8 },
  todo_grab: { arch: 'grab', color: 0xff5fc8 },
  todo_brotherhood: { arch: 'rush', color: 0xff5fc8, lungeSpeed: 16, reach: 2.4, arc: 2.0, multi: true },
  todo_boogie_cast: { arch: 'burst', radius: 2.2, color: 0xff5fc8 },
  // ---- JOGO ----
  jogo_embers: { arch: 'volley', shape: 'ember', color: 0xff5a1f, homing: 2.4 },
  jogo_eruption: { arch: 'zone', shape: 'pillar', color: 0xff6a2a, kd: true, burn: true },
  iron_mountain: { arch: 'domainTick', color: 0xff5a1f },
  // ---- MAHITO ----
  mahito_bodyweapon: { arch: 'beam', shape: 'lance', color: 0x9fb0c4, width: 0.8 },
  mahito_soultouch: { arch: 'melee', color: 0x9fb0c4, debuff: 'soulWound' },
  transfigure: { arch: 'domainTick', color: 0x9fb0c4 },
  // ---- MEGUMI (shikigami as summons) ----
  megumi_shikigami: { arch: 'summon', color: 0x8fb6d8 },
  megumi_copy_dog: { arch: 'summon', color: 0x9ff5c9 },
  shadow_garden: { arch: 'domainTick', color: 0x8fb6d8 },
  // ---- HIGURUMA ----
  higuruma_gavel: { arch: 'melee', color: 0xd8c78a, shock: 1.4, kd: true },
  higuruma_confiscate: { arch: 'melee', color: 0xd8c78a, debuff: 'confiscate', noDmg: true },
  higuruma_judgment_slash: { arch: 'melee', color: 0xd8c78a, reach: 3.0, arc: 2.4 },
  higuruma_execution: { arch: 'melee', color: 0xd8c78a, reach: 2.2, execute: true },
  deadly_sentencing: { arch: 'domainTick', color: 0xd8c78a },
  // ---- HAKARI ----
  hakari_smash: { arch: 'volley', shape: 'ball', color: 0xffc93c, count: 6 },
  hakari_rush: { arch: 'projectile', shape: 'ball', color: 0xffc93c, size: 0.85, chainPunch: true },
  hakari_blast: { arch: 'beam', shape: 'blast', color: 0xffe070, width: 2.0 },
  hakari_counter: { arch: 'counter', color: 0xffc93c },
  idle_death_gamble: { arch: 'domainTick', color: 0xffc93c },
  // ---- SUKUNA ----
  sukuna_dismantle: { arch: 'volley', shape: 'slash', color: 0xff2f45, count: 3, spread: 0.5 },
  sukuna_cleave: { arch: 'melee', shape: 'slash', color: 0xff2f45, reach: 2.6, arc: 2.6, multi: 2 },
  sukuna_firearrow: { arch: 'beam', shape: 'arrow', color: 0xff7030, width: 1.4, range: 40, kd: true, burn: true },
  malevolent_shrine: { arch: 'domainTick', color: 0xff2f45 },
  // ---- TOJI ----
  toji_spear_thrust: { arch: 'melee', shape: 'thrust', color: 0x6ea88a, reach: 4.2, arc: 0.8 },
  toji_nullify: { arch: 'melee', color: 0x6ea88a, debuff: 'seal' },
  toji_cloud_sweep: { arch: 'burst', color: 0x6ea88a, multi: 4 },
  toji_cloud_slam: { arch: 'melee', color: 0x6ea88a, kd: true, shock: 1.5 },
  toji_chain_whip: { arch: 'melee', shape: 'chain', color: 0x6ea88a, reach: 5.5, arc: 1.4 },
  toji_chain_snare: { arch: 'pull', color: 0x6ea88a },
  toji_soul_slash: { arch: 'projectile', shape: 'crescent', color: 0x9fd8b8 },
  toji_soul_cut: { arch: 'melee', color: 0x9fd8b8, reach: 2.6 },
  toji_assassinate: { arch: 'rush', color: 0x6ea88a, lungeSpeed: 22, reach: 2.2, kd: true, unblockable: true },
  // ---- HANAMI ----
  hanami_roots: { arch: 'zone', shape: 'roots', color: 0x9ec46a, root: 1.2 },
  hanami_woodenball: { arch: 'projectile', shape: 'orb', color: 0x7a5a3a, size: 0.7, kd: true },
  hanami_rootswarm: { arch: 'burst', radius: 5, color: 0x9ec46a, root: 1.5, kd: true },
  // ---- KUROURUSHI ----
  kurourushi_swarm: { arch: 'volley', shape: 'bug', color: 0xd8a02a, count: 5, homing: 3 },
  kurourushi_spray: { arch: 'beam', shape: 'spray', color: 0x8a6a1a, width: 1.4, range: 6, debuff: 'melt' },
  kurourushi_infestation: { arch: 'burst', radius: 6, color: 0xd8a02a, multi: 6 },
  // ---- CHOSO ----
  choso_blood_edge: { arch: 'melee', shape: 'slash', color: 0xc4142c, reach: 2.4 },
  choso_piercing_blood: { arch: 'beam', shape: 'jet', color: 0xd0202c, width: 0.5, range: 14 },
  choso_supernova: { arch: 'burst', radius: 4.5, color: 0xd0202c, kd: true, multi: 3 },
  // ---- NOBARA ----
  nobara_hairpin: { arch: 'volley', shape: 'nail', color: 0xe07a34, count: 3, spread: 0.35 },
  nobara_resonance: { arch: 'zone', shape: 'doll', color: 0xe07a34, onTarget: true, unblockable: true },
  nobara_bf_strike: { arch: 'melee', color: 0xe07a34, opens: 'blackflash' },
  nobara_full_release: { arch: 'burst', radius: 4, color: 0xe07a34, kd: true, unblockable: true },
  nobara_detonate: { arch: 'burst', radius: 5, color: 0xe07a34 },
  // ---- GETO ----
  geto_summon_low: { arch: 'summon', color: 0x9b5fe0, weak: true },
  geto_summon_special: { arch: 'summon', color: 0x9b5fe0 },
  geto_copy_low: { arch: 'summon', color: 0x9ff5c9, weak: true },
  geto_uzumaki: { arch: 'beam', shape: 'vortex', color: 0x8b3fd0, width: 2.2, range: 16, kd: true },
  // ---- NAOYA ----
  naoya_rush: { arch: 'rush', color: 0xe8c85a, lungeSpeed: 24, reach: 2.0 },
  naoya_framekick: { arch: 'melee', color: 0xe8c85a, freeze: 1.0 },
  naoya_maxprojection: { arch: 'rush', color: 0xe8c85a, lungeSpeed: 30, reach: 2.4, multi: true, kd: true },
  // ---- KASHIMO ----
  kashimo_bolt: { arch: 'projectile', shape: 'bolt', color: 0xa8e0ff, speed: 30 },
  kashimo_discharge: { arch: 'burst', radius: 3.2, color: 0xa8e0ff },
  kashimo_amber: { arch: 'transform', color: 0xa8e0ff, beam: true },
  // ---- PANDA ----
  panda_palm: { arch: 'melee', color: 0xf0f0f0, shock: 1.3 },
  panda_roll: { arch: 'rush', color: 0xf0f0f0, lungeSpeed: 12, reach: 2.0, kd: true },
  panda_drum: { arch: 'burst', radius: 3.6, color: 0xf0f0f0 },
  panda_gore: { arch: 'rush', color: 0xf0f0f0, lungeSpeed: 15, reach: 2.2, kd: true },
  panda_slam: { arch: 'melee', color: 0xf0f0f0, kd: true, shock: 1.6 },
  panda_crestroll: { arch: 'rush', color: 0xf0f0f0, lungeSpeed: 14, reach: 2.2 },
  panda_allcores: { arch: 'transform', color: 0xf0f0f0 },
  // ---- INUMAKI ----
  inumaki_command: { arch: 'speech', color: 0xc8b8ff },
  speech_root: { arch: 'speech', color: 0xc8b8ff, kind: 'root' }, speech_pull: { arch: 'speech', kind: 'pull' }, speech_flee: { arch: 'speech', kind: 'flee' },
  speech_sleep: { arch: 'speech', kind: 'sleep' }, speech_twist: { arch: 'speech', kind: 'twist' }, speech_crush: { arch: 'speech', kind: 'crush' }, speech_blast: { arch: 'speech', kind: 'blast' },
  inumaki_explode: { arch: 'burst', radius: 5, color: 0xc8b8ff, kd: true, unblockable: true },
  dont_move: { arch: 'domainTick' },
  // ---- MAKI ----
  maki_cloud_sweep: { arch: 'melee', color: 0x8fd08f, reach: 3.1, arc: 2.4, multi: 2 },
  maki_cloud_crush: { arch: 'melee', color: 0x8fd08f, kd: true },
  maki_soul_string: { arch: 'projectile', shape: 'crescent', color: 0x8fd08f },
  maki_split_soul: { arch: 'melee', color: 0x8fd08f, reach: 2.8, unblockable: true },
  maki_beyond: { arch: 'rush', color: 0x8fd08f, lungeSpeed: 26, reach: 2.6, multi: true, kd: true },
  // ---- YUKI ----
  yuki_mass_slam: { arch: 'melee', color: 0xffd0a0, kd: true, shock: 1.8 },
  yuki_command_grab: { arch: 'grab', color: 0xffd0a0 },
  yuki_black_hole: { arch: 'zone', shape: 'hole', color: 0x402030, pull: 3, kd: true, ticks: 4 },
  // ---- MIWA ----
  miwa_draw: { arch: 'melee', shape: 'slash', color: 0x8fb8ff, reach: 2.4, arc: 2.2 },
  miwa_stance: { arch: 'buff', name: 'stance', color: 0x8fb8ff },
  miwa_max_draw: { arch: 'rush', shape: 'slash', color: 0x8fb8ff, lungeSpeed: 24, reach: 3.0, kd: true, unblockable: true },
  // ---- URO ----
  uro_thin_ice: { arch: 'projectile', shape: 'shard', color: 0xd8d0f0, size: 0.6 },
  uro_warp_strike: { arch: 'melee', color: 0xd8d0f0, reach: 3.0, unblockable: true },
  warped_firmament: { arch: 'domainTick' },
  // ---- DAGON ----
  dagon_volley: { arch: 'volley', shape: 'shark', color: 0x5fc0c0, count: 4, homing: 2 },
  dagon_tidal_slam: { arch: 'burst', radius: 4.6, color: 0x5fc0c0, kd: true },
  captivating_skandha: { arch: 'domainTick' },
  // ---- YAGA ----
  yaga_haymaker: { arch: 'melee', color: 0xa08a60, kd: true },
  yaga_command: { arch: 'summon', color: 0xa08a60 },
  yaga_masterpiece: { arch: 'summon', color: 0xa08a60, strong: true },
  // ---- TAKABA ----
  takaba_bit: { arch: 'random', color: 0xffe070 },
  takaba_big: { arch: 'burst', radius: 5, color: 0xffe070, kd: true },
  takaba_theset: { arch: 'burst', radius: 6, color: 0xffe070, kd: true, multi: 3 },
  // ---- URAUME ----
  uraume_icefall: { arch: 'zone', shape: 'ice', color: 0xbfe8ff, freeze: 0.8 },
  uraume_frostcalm: { arch: 'beam', shape: 'frost', color: 0xbfe8ff, width: 1.8, range: 9, freeze: 0.6 },
  uraume_maxfrost: { arch: 'burst', radius: 6, color: 0xbfe8ff, freeze: 1.6, kd: true },
  // ---- RYU ----
  ryu_rapid: { arch: 'volley', shape: 'shot', color: 0xffb070, count: 4, spread: 0.2 },
  ryu_beam: { arch: 'beam', shape: 'blast', color: 0xffb070, width: 1.2, range: 18, kd: true },
  ryu_maxblast: { arch: 'beam', shape: 'blast', color: 0xffd090, width: 2.6, range: 24, kd: true, unblockable: true },
  // ---- REGGIE ----
  reggie_object: { arch: 'projectile', shape: 'junk', color: 0xc0d0c0, size: 0.6 },
  reggie_car: { arch: 'projectile', shape: 'car', color: 0xc0d0c0, size: 1.2, kd: true, speed: 14 },
  reggie_vending: { arch: 'projectile', shape: 'box', color: 0xc0d0c0, size: 1.0, kd: true },
  reggie_rod: { arch: 'pull', color: 0xc0d0c0 }, reggie_register: { arch: 'projectile', shape: 'box', color: 0xc0d0c0 },
  reggie_moped: { arch: 'rush', color: 0xc0d0c0, lungeSpeed: 18, reach: 2.2, kd: true }, reggie_ladder: { arch: 'melee', color: 0xc0d0c0, reach: 4.0 },
  reggie_junk: { arch: 'volley', shape: 'junk', color: 0xc0d0c0, count: 4 }, reggie_gas: { arch: 'zone', shape: 'gas', color: 0x9ab090, ticks: 4 }, reggie_drone: { arch: 'summon', color: 0xc0d0c0 },
  // ---- INO ----
  ino_horn: { arch: 'projectile', shape: 'crescent', color: 0xb0c8d8 }, ino_judgehorn: { arch: 'melee', color: 0xb0c8d8, kd: true },
  ino_doping: { arch: 'buff', name: 'doping', color: 0xb0c8d8 }, ino_shell: { arch: 'buff', name: 'shell', color: 0xb0c8d8, armor: true },
  ino_hornrush: { arch: 'rush', color: 0xb0c8d8, lungeSpeed: 18, reach: 2.2 }, ino_glide: { arch: 'rush', color: 0xb0c8d8, lungeSpeed: 14, reach: 2.0 },
  ino_dragon: { arch: 'transform', color: 0xb0c8d8 },
  // ---- YUTA ----
  yuta_rika_swing: { arch: 'projectile', shape: 'fist', color: 0x9ff5c9, size: 0.9, kd: true },
  yuta_lunge: { arch: 'rush', color: 0x9ff5c9, lungeSpeed: 15, reach: 2.0 },
  sword_rain: { arch: 'domainTick', color: 0x9ff5c9 }, sword_slash: { arch: 'melee', shape: 'slash', color: 0x9ff5c9, reach: 2.5, arc: 2.0 },
  // ---- MAHORAGA ----
  mahoraga_wheel_slash: { arch: 'melee', shape: 'slash', color: 0xc6ac72, reach: 4, arc: 2.4, kd: true },
  mahoraga_world_cut: { arch: 'beam', shape: 'slash', color: 0xc6ac72, width: 2.4, range: 30, kd: true, unblockable: true }
};
export const ARCHETYPES = ['projectile', 'melee', 'burst', 'zone', 'beam', 'grab', 'rush', 'pull', 'buff', 'transform', 'summon', 'volley', 'counter', 'speech', 'random', 'domainTick'];
export function effectDef(key) { return EFFECTS[key] || { arch: 'melee', color: 0xffffff, missing: true }; }
