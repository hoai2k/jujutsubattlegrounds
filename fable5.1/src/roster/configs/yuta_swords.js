// Yuta's sword-domain technique table — every entry a katana can hold inside
// Authentic Mutual Love. Weighted, data-driven: retune weights/damage here.
// key      = dispatcher key in effects.applySwordTech
// reaction = what the hit does to the opponent (stagger/launch/knockdown/root/pin/swap)
// color    = VFX tint + on-screen name flash color; tone = reveal cue pitch (Hz)
export const SWORD_TABLE = [
  {
    key: 'divergent_fist', name: 'DIVERGENT FIST', weight: 14,
    dmg: 6, dmg2: 13, reaction: 'launch', color: 0xffa04a, tone: 520, dur: 0.42,
    desc: 'Impact, then the delayed cursed-energy hit lands harder and launches.'
  },
  {
    key: 'rika_slam', name: 'RIKA SLAM', weight: 5,
    dmg: 22, reaction: 'knockdown', color: 0x66ffb0, tone: 220, dur: 0,
    desc: 'Rika manifests and smashes down. The jackpot — high damage, hard knockdown.'
  },
  {
    key: 'cleave', name: 'CLEAVE / DISMANTLE', weight: 22,
    dmg: 13, reaction: 'stagger', color: 0xcfe8ff, tone: 660, dur: 0,
    desc: 'Clean slicing damage, no knockdown — leaves them standing for follow-up.'
  },
  {
    key: 'black_flash', name: 'BLACK FLASH', weight: 4,
    dmg: 26, reaction: 'knockdown', color: 0xff2038, tone: 140, dur: 0,
    desc: 'Space distorts. Biggest single hit in the table, heavy hitstop.'
  },
  {
    key: 'dont_move', name: 'CURSED SPEECH: DON\'T MOVE', weight: 12,
    dmg: 0, reaction: 'root', color: 0xd08fff, tone: 880, dur: 2.0,
    desc: 'No damage — roots the opponent, setting up a free follow-up sword hit.'
  },
  {
    key: 'straw_doll', name: 'STRAW DOLL: RESONANCE', weight: 12,
    dmg: 4, dps: 2.6, reaction: 'stagger', color: 0xff6a5a, tone: 440, dur: 4.0,
    desc: 'The nail bites: bleed damage over several seconds.'
  },
  {
    key: 'boogie_woogie', name: 'BOOGIE WOOGIE', weight: 10,
    dmg: 4, reaction: 'swap', color: 0xffe066, tone: 740, dur: 0,
    desc: 'Clap — instant position swap plus light damage. Chaos.'
  },
  {
    key: 'shikigami', name: 'SHIKIGAMI: DIVINE DOG', weight: 9,
    dmg: 12, reaction: 'knockdown', color: 0x8a6aff, tone: 330, dur: 0.35,
    desc: 'A shadow beast lunges out of the blade and knocks them down.'
  },
  {
    key: 'gravity_crush', name: 'GRAVITY CRUSH', weight: 6,
    dmg: 14, reaction: 'pin', color: 0x6a8aff, tone: 180, dur: 0.5,
    desc: 'Slams them into the ground and pins them briefly.'
  },
  {
    key: 'copy_ct', name: 'COPY: OPPONENT\'S TECHNIQUE', weight: 6,
    dmg: 8, powerMult: 0.6, reaction: 'varies', color: 0x7fe8f0, tone: 990, dur: 0,
    desc: 'Mirrors the opponent\'s last used technique at reduced power.'
  }
];
