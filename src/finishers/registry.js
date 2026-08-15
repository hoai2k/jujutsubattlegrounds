// FINISHERS — THE MOMENTS
// ===========================================================================
// One entry per pick id, each a canonical battle moment from the source,
// choreographed as a FIGHT: a sequence of actions in which both bodies throw,
// evade, connect and get moved by what lands.
//
// AN ACTION is one exchange. The director (index.js) reads:
//
//   win / op     the clip each fighter plays — a move from fight.js, one of the
//                character's OWN technique clips, or a signature from moves.js
//   strike       'win' | 'op' — whose move carries the contact this action
//   hit          true: it lands. false: it is stopped or evaded
//   miss         with hit:false — nothing was touched at all (a slip, a duck),
//                so it gets a whoosh past the ear instead of a block spark
//   react        the clip the victim plays ON THE FRAME OF CONTACT
//   knock        how far the hit drives them, in body-scale units
//   power        overrides the move's own — drives hitstop, shake, sound
//   span         action length; defaults to the striking clip's duration
//   shot         the lens (shots.js S.*) — one cut per action
//   fx           one-shot VFX/sound at the top of the action
//   onContact    VFX at the moment of impact, given the contact point
//
// The striker's body is SOLVED into position so the named bone arrives on the
// named target — see index.js. Nothing here has to state a distance; the
// choreography states the intent and the geometry follows.
//
// `moment` is documentation and is never drawn: a finisher shows the scene and
// nothing else.
// ===========================================================================
import { S, closeOn, two, groundUp, wide } from './shots.js';

// The three closing actions every finisher shares: the body goes down, the
// winner is left standing over it, and the camera orbits out. Authored once
// because the exit is the same piece of grammar every time — only the pose the
// winner holds it in differs.
const OUTRO = (winClip, opts = {}) => ([
  {
    win: winClip, op: 'rFall', span: opts.fallSpan ?? 1.15,
    shot: opts.fallShot || S.wideL(), dofBase: 0.15
  },
  {
    win: opts.heroClip || winClip, op: null, span: opts.heroSpan ?? 1.35,
    shot: opts.heroShot || S.hero(), dofBase: 0.45
  }
]);

export const FINISHERS_BY_PICK = {

  // =========================================================================
  // NAOYA ZENIN — 「投射呪法」 THE HAIR BRUSH
  // Shibuya, against Choso. He is being genuinely hunted, and he takes a hand
  // off the fight to put his hair back. The joke only works if the fight does
  // NOT stop for it: a kick goes past his ear while he does it, and he is not
  // looking at it.
  // =========================================================================
  naoya: {
    id: 'naoya_brush',
    moment: 'The hair-brush mid-fight, from the Choso exchange in Shibuya.',
    color: '#e8c85a', grade: 'swordfield', chord: 'cold', root: 196,
    actions: [
      // he is simply not where the punch is
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'fSlip', shot: S.lowR(), dofBase: 0.2 },
      { op: 'fHook', strike: 'op', hit: false, miss: true, win: 'fStepThrough', shot: S.dollyL(), speed: 1.1 },
      // one jab, on the 24-frame grid, and it lands
      { op: 'fBodyRip', strike: 'op', hit: true, react: 'rFoldGut', win: null, shot: S.otsWin(), power: 1.0, knock: 0.5 },
      { win: 'fJab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitR(), speed: 1.15 },
      // THE MOMENT. A roundhouse goes past his head and he is fixing his hair.
      {
        win: 'naoyaBrush', op: 'fRound', strike: 'op', hit: false, miss: true, span: 1.45,
        shot: S.faceWin({ d: 1.3, side: 0.6 }), dofBase: 0.9,
        fx: d => d.audio.accent(1040)
      },
      // he catches the next one without looking at it
      { op: 'fCross', strike: 'op', hit: false, win: 'fCatch', shot: S.otsLose(), power: 0.8 },
      // 投射呪法 · FRAME KICK — one frame of wind-up, one frame of contact
      {
        win: 'framekick', strike: 'win', contact: { bone: 'FootL', at: 0.27, aim: 'chest', reach: 0.20, power: 1.7, kind: 'kick', blade: 85 }, hit: true, react: 'rFinish', op: 'fGuardUp',
        span: 0.95, power: 1.7, knock: 1.5, shot: S.bigHit(), sting: true, impact: 0.2, flash: 0.5,
        onContact: (d, at) => {
          d.fx._ring(at, 0xe8c85a, { size: 0.4, growRate: 16, life: 0.4, flat: false });
          d.sfx.frameKick?.();
        }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // GOJO — 「虚式・茈」 HOLLOW PURPLE
  // The Jogo fight. Everything thrown at him stops in the air a hand's width
  // short, he never takes his hands out of his pockets, and then he puts red
  // and blue together.
  // =========================================================================
  gojo: {
    id: 'gojo_purple',
    moment: 'Infinity, hands in pockets, then Hollow Purple — the Jogo fight.',
    color: '#a06bff', grade: 'void', chord: 'regal', root: 146.83,
    actions: [
      // it stops. Six inches out. He does not look at it.
      {
        op: 'fCross', strike: 'op', hit: false, win: 'gojoPockets', shot: S.faceWin({ d: 1.5, side: 0.7 }),
        dofBase: 0.85, power: 0.9, blockSnd: 'techReveal',
        onContact: (d, at) => d.fx._ring(at, 0x7fd0ff, { size: 0.26, growRate: 5, life: 0.5, flat: false })
      },
      // and so does the kick
      {
        op: 'fRound', strike: 'op', hit: false, win: 'gojoPockets', shot: S.lowL(1.6), power: 1.0,
        blockSnd: 'techReveal',
        onContact: (d, at) => d.fx._ring(at, 0x7fd0ff, { size: 0.3, growRate: 6, life: 0.5, flat: false })
      },
      // 赤 — one hand out, and it is not a punch
      {
        win: 'ct1', strike: 'win', blast: { at: 0.28, aim: 'chest', power: 1.4, kind: 'blast' }, hit: true, react: 'rLaunch', op: 'fGuardUp', span: 0.95,
        power: 1.4, knock: 1.4, shot: S.hitR(), snd: 'red', impact: 0.14,
        fx: d => d.fx.redBlast(d.win, 4)
      },
      { op: 'fHook', strike: 'op', hit: false, miss: true, win: 'fSlip', shot: S.otsLose() },
      // both hands finally come out of the pockets
      {
        win: 'purple', op: 'fGuardUp', span: 1.15, shot: S.handWin({ d: 1.15 }), dofBase: 0.9,
        fx: d => {
          d.sfx.blue();
          d.fx._ring(d.bone(d.win, 'HandL'), 0x66b8ff, { size: 0.35, growRate: 4, life: 0.5, flat: false });
          d.audio.accent(1320);
        }
      },
      {
        win: 'purple', strike: 'win', blast: { at: 0.55, aim: 'chest', power: 1.8, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.1,
        power: 1.8, knock: 2.2, shot: S.crane({ d: 5.6, top: 3.2 }), sting: true, impact: 0.24, flash: 0.85,
        fx: d => { d.fx.purpleBeam(d.bone(d.win, 'HandR'), d.dir()); d.sfx.purple(); },
        onContact: (d, at) => d.fx._ring(at, 0xb47fff, { size: 0.6, growRate: 20, life: 0.5, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // GOJO 【SHINJUKU】 — 「赤」 POINT BLANK
  // The Shinjuku Showdown: the fight where the strongest sorcerer alive stops
  // being untouchable and starts being a martial artist. Bare hands, range
  // zero, trading with something that can hit him back.
  // =========================================================================
  'gojo:shinjuku': {
    id: 'gojo_shinjuku_cqc',
    moment: 'The bare-handed exchange at range zero, Shinjuku — ending on a point-blank Red.',
    color: '#9fe0ff', grade: 'void', chord: 'regal', root: 164.81,
    actions: [
      { op: 'fCross', strike: 'op', hit: false, win: 'fParry', shot: S.lowR(), power: 1.0 },
      // it gets through. Even him.
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.otsWin(), power: 0.9, knock: 0.5 },
      { win: 'fJab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitL(), speed: 1.2 },
      { win: 'fElbow', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.midR(), power: 1.2 },
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'gojoCQC', span: 1.3, shot: S.faceWin(), dofBase: 0.85 },
      {
        win: 'ct1', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.8, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.8, knock: 2.0, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.8, snd: 'red',
        fx: d => d.fx.redBlast(d.win, 3.4)
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // SUKUNA — 「解」 DISMANTLE
  // The Jogo fight. He stands with his arms folded and lets it happen, because
  // it does not matter, and then he takes them apart without moving his feet.
  // =========================================================================
  sukuna: {
    id: 'sukuna_dismantle',
    moment: 'Arms folded through the attack, then Dismantle — Sukuna vs Jogo.',
    color: '#ff2f45', grade: 'shrine', chord: 'brutal', root: 130.81,
    actions: [
      // it lands clean, on him, and he does not move a centimetre
      {
        win: 'sukunaFold', op: 'fCross', strike: 'op', hit: true, react: null, noReact: true, knock: 0, power: 0.8,
        shot: S.faceWin({ d: 1.4, side: 0.8 }), dofBase: 0.8, span: 1.0
      },
      // neither does the second one
      {
        win: 'sukunaFold', op: 'fRound', strike: 'op', hit: true, react: null, noReact: true, knock: 0, power: 1.1,
        shot: S.lowL(1.5), span: 0.95,
        onContact: d => d.audio.accent(220, { gain: 0.1 })
      },
      // one hand, and they leave the ground
      {
        win: 'fPalm', strike: 'win', hit: true, react: 'rLaunch', op: 'fGuardUp',
        power: 1.5, knock: 1.6, shot: S.hitR(), impact: 0.14
      },
      // the head tilt. Four eyes, and no interest at all.
      {
        win: 'sukunaFold', op: 'fCross', strike: 'op', hit: false, span: 1.2,
        miss: true, shot: S.faceWin({ d: 1.25, side: 0.5 }), dofBase: 0.95,
        fx: d => d.audio.accent(174, { gain: 0.12, dur: 0.9 })
      },
      {
        win: 'ct1', strike: 'win', blast: { at: 0.26, aim: 'chest', power: 1.9, kind: 'blade' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.9, knock: 2.4, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.7,
        fx: d => { d.fx.dismantleSlash(d.win, d.dir(), 6, 1.4); d.sfx.dismantle(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // SUKUNA 【ITADORI】 — 「伏魔御廚子」 SHIBUYA
  // The vessel has two arms, so the four-armed fan is not available — and this
  // is not that moment. This is the roof of Shibuya station: arms crossed,
  // thrown open, and nothing within reach surviving it.
  // =========================================================================
  'sukuna:yuji': {
    id: 'sukuna_yuji_shrine',
    moment: 'Shibuya — the arms cross, throw open, and the cuts land everywhere at once.',
    color: '#ff2f45', grade: 'shrine', chord: 'brutal', root: 116.54,
    actions: [
      { op: 'fCross', strike: 'op', hit: false, win: 'fGuardUp', shot: S.lowR(), power: 1.0 },
      { op: 'fKnee', strike: 'op', hit: true, react: 'rFoldGut', win: 'fGuardUp', shot: S.otsWin(), power: 0.8, knock: 0.4 },
      { win: 'fUpper', strike: 'win', hit: true, react: 'rLaunch', op: 'fGuardUp', shot: S.hitL(), power: 1.4, knock: 1.2 },
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'fStepThrough', shot: S.dollyR() },
      {
        win: 'sukunaShrine', op: 'fGuardUp', span: 1.3, shot: S.lowR(1.7), dofBase: 0.3,
        fx: d => { d.sfx.domainCast?.(); d.audio.accent(146, { gain: 0.12, dur: 1.1 }); }
      },
      {
        win: 'sukunaShrine', strike: 'win', blast: { at: 0.60, aim: 'chest', power: 1.9, kind: 'blade' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.9, knock: 2.2, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.75,
        onContact: (d, at) => {
          d.fx.shrineSlash(at, 1.2, true);
          d.fx.shrineSlash(at.clone().setY(at.y - 0.6), 0.9, false);
          d.sfx.shrineSlash();
        }
      },
      ...OUTRO('idle', { heroClip: 'taunt' })
    ]
  },

  // =========================================================================
  // SUKUNA 【FUSHIGURO】 — 「開」 FIRE ARROW
  // The Shinjuku Showdown. One palm up, and the air on the other side of the
  // city stops existing.
  // =========================================================================
  'sukuna:megumi': {
    id: 'sukuna_megumi_fire',
    moment: '開 — the Fire Arrow from the Shinjuku Showdown.',
    color: '#ff7a2f', grade: 'volcano', chord: 'brutal', root: 155.56,
    actions: [
      { op: 'fHook', strike: 'op', hit: false, win: 'fParry', shot: S.lowL(), power: 1.0 },
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.otsWin(), power: 0.9, knock: 0.5 },
      { win: 'fCross', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.hitR(), power: 1.3 },
      { op: 'fRound', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.midL() },
      // the palm comes up and the light in the scene changes
      {
        win: 'sukunaFire', op: 'fGuardUp', span: 1.25, shot: S.handWin({ d: 1.1 }), dofBase: 0.9,
        fx: d => { d.sfx.fireCharge(); d.fx.fireArrowCharge?.(d.win, 1); d.audio.accent(330, { dur: 0.9 }); }
      },
      {
        win: 'sukunaFire', strike: 'win', blast: { at: 0.92, aim: 'chest', power: 1.9, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.9, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.26, flash: 0.9,
        fx: d => { d.fx.fireArrowBeam(d.win, d.dir(), 18, 1.5); d.sfx.fireArrow(); }
      },
      ...OUTRO('idle', { heroClip: 'taunt' })
    ]
  },

  // =========================================================================
  // TOJI — 「天逆鉾」 THE INVERTED SPEAR
  // Hidden Inventory: the strongest sorcerer of his generation is killed by a
  // man with no cursed energy who does not stop walking. Bored throughout, and
  // he never looks back at the body.
  // =========================================================================
  toji: {
    id: 'toji_spear',
    moment: 'The Inverted Spear kill from Hidden Inventory — and he does not look back.',
    color: '#6ea88a', grade: 'ko', chord: 'cold', root: 110,
    actions: [
      // he slips it without taking his hand out of his pocket
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'tojiBored', shot: S.faceWin({ d: 1.3 }), dofBase: 0.85, span: 1.2 },
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsWin(), power: 0.9, knock: 0.4 },
      { op: 'fCross', strike: 'op', hit: false, win: 'fCatch', shot: S.otsLose(), power: 0.9 },
      // and he hits them ONCE, in the body, and it is not a technique
      { win: 'fBodyRip', strike: 'win', hit: true, react: 'rFoldGut', op: 'fGuardUp', shot: S.hitL(), power: 1.2 },
      { op: 'fKnee', strike: 'op', hit: false, miss: true, win: 'fStepThrough', shot: S.dollyL() },
      // the tool comes out of the inventory curse. He is still not interested.
      {
        win: 'arsenal', op: 'fGuardUp', span: 1.0, shot: S.handWin({ d: 1.15 }),
        fx: d => { d.sfx.swordGrab(); d.audio.accent(196, { gain: 0.09 }); }
      },
      {
        win: 'fThrust', strike: 'win', hit: true, react: 'rFinish', op: 'fGuardUp',
        power: 1.8, knock: 1.6, shot: S.bigHit(), sting: true, impact: 0.2, flash: 0.4,
        onContact: d => { d.fx.executionThrust(d.win); d.sfx.swordSwing?.(); }
      },
      // he is already walking. The body is behind him.
      { win: 'walk', op: 'rFall', span: 1.2, speed: 0.9, winAt: [-1.2, 0.3], shot: S.wideL() },
      { win: 'taunt', op: null, span: 1.4, shot: S.hero({ d: 4.4, from: 0.75, sweep: 0.4 }) }
    ]
  },

  // =========================================================================
  // NANAMI — 「7:3」 RATIO, AND OVERTIME
  // The Mahito fight. A tired man doing a job properly: he takes it on the
  // guard, checks the time, decides this counts as overtime, and cuts them in
  // half at the seven-three.
  // =========================================================================
  nanami: {
    id: 'nanami_ratio',
    moment: 'Overtime and the 7:3 Ratio cleave — the Mahito fight.',
    color: '#f2b23c', grade: 'overtime', chord: 'cold', root: 174.61,
    actions: [
      { op: 'fCross', strike: 'op', hit: false, win: 'fGuardUp', shot: S.lowR(), power: 1.1 },
      { op: 'fRound', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.otsWin(), power: 1.2, knock: 0.7 },
      // the blunt sword, once, across the body
      { win: 'fCleave', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.hitL(), power: 1.4, fx: d => { d.fx.cleaveArc(d.win, false); d.sfx.cleave(false); } },
      { op: 'fHook', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.midR() },
      // THE WATCH. He looks at it while they are still coming.
      {
        win: 'nanamiWatch', op: 'fGuardUp', span: 1.3, shot: closeOn('win', 'HandL', { d: 1.0, side: 0.5, fov: 34 }),
        dofBase: 0.95, fx: d => d.audio.accent(660, { gain: 0.07, dur: 0.7 })
      },
      {
        win: 'fOverhead', strike: 'win', hit: true, react: 'rSlam', op: 'fGuardUp',
        power: 1.9, knock: 0.8, shot: S.bigHit(), sting: true, impact: 0.2, flash: 0.6,
        fx: d => { d.fx.cleaveArc(d.win, true); d.sfx.cleave(true); },
        onContact: (d, at) => { d.fx.ratioStrike(at, 2); d.sfx.ratioChime(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // YUJI — 「黒閃」 BLACK FLASH
  // The Hanami fight: four in a row, the most-referenced punch in the series.
  // He eats one on the way in, because he always does.
  // =========================================================================
  yuji: {
    id: 'yuji_blackflash',
    moment: 'Black Flash — the Hanami fight, and he takes one on the way in.',
    color: '#ff5f74', grade: 'ko', chord: 'bright', root: 196,
    actions: [
      // it lands on him and he keeps coming
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(), power: 1.2, knock: 0.6 },
      { op: 'fHook', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin(), power: 1.0 },
      { win: 'fJab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitR(), speed: 1.15, fx: d => d.fx.divergentJab(d.win) },
      { win: 'fBodyRip', strike: 'win', hit: true, react: 'rFoldGut', op: 'fGuardUp', shot: S.midL(), power: 1.1 },
      { op: 'fKnee', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.dollyR() },
      // the coil. Everything goes quiet.
      {
        win: 'yujiWind', op: 'fGuardUp', span: 0.65, shot: S.handWin({ d: 1.0 }), dofBase: 0.9,
        fx: d => { d.sfx.bfTell(); d.audio.accent(1480, { gain: 0.06 }); }
      },
      {
        win: 'fCross', strike: 'win', hit: true, react: 'rFinish', op: 'fGuardUp', speed: 0.9,
        power: 2.0, knock: 2.4, shot: S.bigHit(), sting: true, impact: 0.26, flash: 0.9,
        onContact: (d, at) => {
          d.fx._ring(at, 0x1a0a12, { size: 0.5, growRate: 14, life: 0.35, flat: false });
          d.fx._ring(at, 0xff2d3c, { size: 0.3, growRate: 22, life: 0.45, flat: false });
          d.sfx.blackFlash();
        }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // YUJI 【SHINJUKU】 — 黒閃 ×3
  // By Shinjuku he does not wait for the window to open by luck. Three in a
  // row, on the same body, inside a second.
  // =========================================================================
  'yuji:shinjuku': {
    id: 'yuji_shinjuku_chain',
    moment: 'Three consecutive Black Flashes — the Shinjuku Showdown.',
    color: '#ff2d3c', grade: 'ko', chord: 'bright', root: 220,
    actions: [
      { op: 'fRound', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowL(), power: 1.1, knock: 0.5 },
      { op: 'fCross', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin() },
      // ONE
      {
        win: 'fCross', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', speed: 1.1,
        power: 1.4, knock: 0.9, shot: S.hitR(), impact: 0.16, flash: 0.5,
        onContact: (d, at) => { d.fx._ring(at, 0xff2d3c, { size: 0.3, growRate: 18, life: 0.3, flat: false }); d.sfx.blackFlash(); }
      },
      // TWO
      {
        win: 'fHook', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', speed: 1.1,
        power: 1.5, knock: 1.0, shot: S.hitL(), impact: 0.16, flash: 0.55,
        onContact: (d, at) => { d.fx._ring(at, 0xff2d3c, { size: 0.3, growRate: 18, life: 0.3, flat: false }); d.sfx.blackFlash(); }
      },
      {
        win: 'yujiWind', op: 'fGuardUp', span: 0.95, shot: S.handWin({ d: 1.0 }), dofBase: 0.9,
        fx: d => { d.sfx.bfTell(); d.audio.accent(1760, { gain: 0.07 }); }
      },
      // THREE
      {
        win: 'fUpper', strike: 'win', hit: true, react: 'rFinish', op: 'fGuardUp',
        power: 2.0, knock: 2.4, shot: S.bigHit(), sting: true, impact: 0.28, flash: 1.0,
        onContact: (d, at) => {
          d.fx._ring(at, 0x1a0a12, { size: 0.6, growRate: 16, life: 0.4, flat: false });
          d.fx._ring(at, 0xff2d3c, { size: 0.3, growRate: 26, life: 0.5, flat: false });
          d.sfx.blackFlash();
        }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // TODO — 「不義遊戯」 BOOGIE WOOGIE
  // The Goodwill Event and the Hanami fight: an enormous man having the best
  // afternoon of his life, clapping, and hitting them from a direction they
  // had stopped watching.
  // =========================================================================
  todo: {
    id: 'todo_boogie',
    moment: 'The clap, the swap, and the delighted grin — Todo vs Hanami.',
    color: '#ff5fc8', grade: 'overtime', chord: 'joy', root: 130.81,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.lowR(), power: 1.1, knock: 0.4 },
      // THE CLAP. He is somewhere else before the swing finishes.
      {
        op: 'fRound', strike: 'op', hit: false, miss: true, win: 'boogie', span: 1.0,
        shot: S.dollyL(), winAt: [1.1, -1.3],
        fx: d => { d.sfx.clap(); d.fx.boogieSwap(d.win.pos.clone(), d.lose.pos.clone(), 0xff5fc8); }
      },
      { win: 'fElbow', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.hitL(), power: 1.3 },
      // arms wide, head back, laughing, while they come at him again
      {
        win: 'todoGrin', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.3,
        shot: S.lowR(1.7), fx: d => d.audio.accent(523, { gain: 0.1, dur: 0.8 })
      },
      { win: 'fGrab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.otsWin(), power: 0.5, knock: -0.35 },
      {
        win: 'fPalm', strike: 'win', hit: true, react: 'rFinish', op: 'fGuardUp',
        power: 2.0, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.7,
        fx: d => { d.fx.ceShockwave(d.win, 4.5); d.sfx.ceSmash?.(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // JOGO — 「極ノ番・隕」 MAXIMUM: METEOR
  // His last stand against Sukuna, and the moment the fandom actually
  // remembers him for: he cannot win, he knows it, and he pulls a mountain out
  // of the sky anyway.
  // =========================================================================
  jogo: {
    id: 'jogo_meteor',
    moment: 'Maximum: Meteor — the last stand against Sukuna.',
    color: '#ff5a1f', grade: 'volcano', chord: 'brutal', root: 138.59,
    actions: [
      // he is not a good fighter. He is a disaster, and he takes it badly.
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(), power: 1.3, knock: 0.9 },
      { op: 'fKnee', strike: 'op', hit: true, react: 'rFoldGut', win: 'fGuardUp', shot: S.otsWin(), power: 1.1, knock: 0.6 },
      // and the ground opens under them
      {
        win: 'ct1', strike: 'win', blast: { at: 0.30, aim: 'gut', power: 1.4, kind: 'blast' }, hit: true, react: 'rLaunch', op: 'fGuardUp', span: 1.0,
        power: 1.4, knock: 1.4, shot: S.hitL(), impact: 0.12,
        fx: d => { d.fx.eruptionBlast(d.lose.pos.clone(), 2.2); d.sfx.erupt(); }
      },
      { win: 'overheat', op: 'fGuardUp', span: 0.9, shot: S.midL(), fx: d => d.sfx.overheat() },
      // both arms up. He is calling it, not aiming it.
      {
        win: 'jogoMeteor', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.5,
        shot: S.crane({ d: 5.4, top: 4.6 }), fx: d => { d.sfx.eruptPrime(); d.audio.accent(110, { gain: 0.14, dur: 1.3 }); }
      },
      {
        win: 'jogoMeteor', strike: 'win', blast: { at: 1.20, aim: 'head', power: 2.0, kind: 'blast' }, hit: true, react: 'rSlam', op: 'fGuardUp', span: 1.1, speed: 0.9,
        power: 2.0, knock: 0.6, shot: S.bigHit(), sting: true, impact: 0.28, flash: 1.0,
        onContact: (d, at) => {
          d.fx.eruptionBlast(d.lose.pos.clone(), 5.5);
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0xff7a2f, { size: 1.2, growRate: 26, life: 0.7 });
          d.sfx.erupt();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 4.5, 120, { kind: 'body' });
        }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // MAHITO — 「遍殺即霊体」 IDLE TRANSFIGURATION
  // The Yuji fight. He does not need to hit them; he needs to touch them, and
  // the whole horror of the character is how casual the gesture is.
  // =========================================================================
  mahito: {
    id: 'mahito_touch',
    moment: 'Idle Transfiguration — the open hand, from the Yuji fight.',
    color: '#9fb0c4', grade: 'flesh', chord: 'wrong', root: 123.47,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(), power: 1.0, knock: 0.7 },
      // his head comes back round and the shape of it is wrong now
      { win: 'bwBlade', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.2, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.9, shot: S.hitL(), power: 1.2, fx: d => d.sfx.bodyMorph(1) },
      { op: 'fHook', strike: 'op', hit: false, win: 'fCatch', shot: S.otsLose(), power: 0.9 },
      // the hand. Slow, open, unhurried, and they are still swinging at him.
      {
        win: 'mahitoTouch', op: 'fKnee', strike: 'op', hit: false, miss: true, span: 1.45,
        shot: S.handWin({ d: 1.05 }), dofBase: 0.95,
        fx: d => { d.sfx.soulTouch(); d.audio.accent(246, { gain: 0.09, dur: 1.0 }); }
      },
      {
        win: 'ct1', strike: 'win', blast: { at: 0.22, aim: 'chest', power: 1.7, kind: 'grab' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.7, knock: 1.2, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.6,
        fx: d => { d.fx.soulGrasp(d.win); d.sfx.transfigure(); },
        onContact: (d, at) => d.fx._ring(at, 0xdfe6ee, { size: 0.4, growRate: 12, life: 0.5, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // MAHITO 【DISTORTED】 — 「無為転変」
  // The transformed form's own moment: the body stops pretending to be a
  // person and comes apart into everything at once.
  // =========================================================================
  'mahito:distorted': {
    id: 'mahito_distorted',
    moment: 'The Instant Spirit Body of Distorted Killing coming apart — the Shibuya form.',
    color: '#c8d4e0', grade: 'flesh', chord: 'wrong', root: 110,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowL(), power: 1.1, knock: 0.6 },
      { win: 'bwSpikes', strike: 'win', blast: { at: 0.30, aim: 'gut', power: 1.2, kind: 'blade' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 0.9, shot: S.hitR(), power: 1.2, fx: d => d.sfx.bodyMorph(2) },
      { op: 'fRound', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.dollyL() },
      {
        win: 'mahitoDistort', op: 'fGuardUp', span: 1.3, shot: S.lowR(1.6),
        fx: d => { d.sfx.bodyMorph(0); d.audio.accent(174, { gain: 0.12, dur: 1.0 }); }
      },
      {
        win: 'mahitoDistort', strike: 'win', blast: { at: 0.88, aim: 'chest', power: 1.9, kind: 'grab' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0, speed: 0.9,
        power: 1.9, knock: 2.0, shot: S.bigHit(), sting: true, impact: 0.26, flash: 0.7,
        fx: d => { d.fx.soulGrasp(d.win); d.sfx.transfigure(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // MEGUMI — 「嵌合暗翳庭」 CHIMERA SHADOW GARDEN
  // The Culling Game, against Reggie: the floor turns to shadow and everything
  // he owns comes out of it at once. He barely throws a punch in it.
  // =========================================================================
  megumi: {
    id: 'megumi_garden',
    moment: 'Chimera Shadow Garden — the floor opens and the Ten Shadows come out.',
    color: '#8fb6d8', grade: 'shadow', chord: 'grim', root: 146.83,
    actions: [
      { op: 'fCross', strike: 'op', hit: false, win: 'fGuardUp', shot: S.lowR(), power: 1.1 },
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.otsWin(), power: 1.0, knock: 0.6 },
      // he goes into the floor rather than backwards
      {
        win: 'shadowDive', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.0,
        shot: S.dollyL(), winAt: [-0.5, 0.7],
        fx: d => { d.sfx.shadowDive?.(); d.fx._ring(d.win.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.7, growRate: -1.6, life: 0.4 }); }
      },
      {
        win: 'shadowRise', op: 'fGuardUp', span: 0.8, shot: S.lowL(1.5), winAt: [0, -0.6],
        fx: d => { d.sfx.shadowRise?.(); d.fx._ring(d.win.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.3, growRate: 7, life: 0.4 }); }
      },
      // hands together, then one flat palm at the floor between them
      {
        win: 'megumiPoint', op: 'fGuardUp', span: 1.2, shot: S.handWin({ d: 1.1 }), dofBase: 0.85,
        fx: d => { d.sfx.shikigami(); d.audio.accent(293, { gain: 0.1, dur: 0.9 }); }
      },
      {
        win: 'summonBoth', strike: 'win', blast: { at: 0.45, aim: 'chest', power: 1.8, kind: 'blade' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 1.8, knock: 1.8, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.5,
        onContact: (d, at) => {
          d.fx.shadowPuff?.(d.lose.pos.clone());
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0x05060c, { size: 1.0, growRate: 16, life: 0.6 });
          d.sfx.shikigamiBite();
        }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // MAHORAGA — 「世界を断つ」 ADAPT, THEN CUT
  // The Shibuya fight with Sukuna. It gets hit by something, the wheel turns,
  // and the same thing never works twice. Then it cuts the world.
  // =========================================================================
  mahoraga: {
    id: 'mahoraga_adapt',
    moment: 'The wheel turns, the attack stops working, and then the World-Cutting Slash.',
    color: '#c6ac72', grade: 'void', chord: 'brutal', root: 98,
    actions: [
      // it takes the hit. Fully. It does not even guard.
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(2.0), power: 1.3, knock: 0.5 },
      // THE WHEEL TURNS.
      {
        win: 'adapt', op: 'fGuardUp', span: 1.2, shot: S.faceWin({ d: 2.0, side: 0.6, fov: 38 }),
        fx: d => {
          d.win.model.spinWheel?.(1);
          d.sfx.adaptSpin(); d.fx.adaptFlare(d.win, d.win.cfg.size?.wheelY ?? 3.9);
          d.audio.accent(147, { gain: 0.12, dur: 1.0 });
        }
      },
      // the same attack, and this time nothing happens at all
      {
        op: 'fCross', strike: 'op', hit: false, win: 'mahoragaTurn', span: 1.2, shot: S.midL(),
        blockSnd: 'adaptLock', power: 0.6,
        fx: d => { d.win.model.lockWheel?.(); d.sfx.adaptLock(); }
      },
      { win: 'wheelSlash', strike: 'win', blast: { at: 0.35, aim: 'chest', power: 1.5, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.95, shot: S.hitR(), power: 1.5, fx: d => { d.sfx.wheelSlash(); d.fx.wheelArc(d.win, 3.4); } },
      {
        win: 'worldCut', strike: 'win', blast: { at: 0.50, aim: 'chest', power: 2.0, kind: 'blade' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.2,
        power: 2.0, knock: 2.8, shot: S.bigHit(), sting: true, impact: 0.28, flash: 0.95,
        fx: d => {
          d.fx.worldCut(d.win, d.dir(), 16, 2.0); d.sfx.worldCut();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 5, 140, { kind: 'body' });
        }
      },
      ...OUTRO('idle', { heroClip: 'victory', heroShot: S.hero({ d: 6.0, y: 0.5 }), fallShot: S.wideL() })
    ]
  },

  // =========================================================================
  // HIGURUMA — 「死刑執行」 THE SENTENCE
  // The Sukuna fight. A public defender who has finally decided that somebody
  // deserves the maximum penalty, and carries it out himself.
  // =========================================================================
  higuruma: {
    id: 'higuruma_sentence',
    moment: 'The gavel, the Executioner\'s Sword, and the sentence carried out.',
    color: '#d8c78a', grade: 'sentence', chord: 'grim', root: 130.81,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowL(), power: 1.1, knock: 0.8 },
      { op: 'fHook', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin() },
      { win: 'fJab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitR() },
      // THE GAVEL. Held a beat too long, then down.
      {
        win: 'higurumaGavel', op: 'fGuardUp', span: 1.3, shot: S.handWin({ d: 1.15 }),
        fx: d => { d.sfx.gavel(); d.fx.gavelSlam(d.win.pos.clone(), 2.4); d.audio.accent(196, { gain: 0.11 }); },
        impact: 0.12, shake: 0.4
      },
      // and the sword arrives
      {
        win: 'swordDraw', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.15, shot: S.lowR(1.6),
        fx: d => {
          d.win.model.attachProp?.('sword', 'hand');
          d.win.model.attachProp?.('case', 'away');
          d.sfx.swordMaterialize(); d.audio.accent(330, { gain: 0.09, dur: 1.0 });
        }
      },
      {
        win: 'fOverhead', strike: 'win', hit: true, react: 'rSlam', op: 'fGuardUp',
        power: 1.9, knock: 0.7, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.5,
        onContact: d => { d.fx.executionThrust(d.win); d.sfx.executionSwing(); d.sfx.gavelFinal(); }
      },
      ...OUTRO('swordIdle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // HAKARI — 「大当り」 JACKPOT
  // The Kashimo fight. He takes something that should have killed him, it puts
  // itself back, and he is laughing before the blood has finished moving.
  // =========================================================================
  hakari: {
    id: 'hakari_jackpot',
    moment: 'Taking a killing blow, healing through it, and Jackpot — the Kashimo fight.',
    color: '#ffc93c', grade: 'jackpot', chord: 'joy', root: 164.81,
    actions: [
      // it lands clean, and it is a bad one
      {
        op: 'fRound', strike: 'op', hit: true, react: 'hakariHeal', win: null, span: 1.0,
        power: 1.6, knock: 0.9, shot: S.faceWin({ d: 1.25, side: 0.6 }), impact: 0.16, flash: 0.4, dofBase: 0.8
      },
      // and it puts itself back
      {
        win: 'hakariHeal', op: 'fGuardUp', span: 1.0, speed: 0.9, shot: S.faceWin({ d: 1.35, side: -0.5 }),
        fx: d => { d.sfx.rctHeal(); d.fx.buffAura(d.win, 3, 0xffc93c); d.audio.accent(659, { gain: 0.1, dur: 0.9 }); }
      },
      { win: 'fJab', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitR(), speed: 1.2 },
      { win: 'fHook', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.midL(), power: 1.2 },
      // the reels land
      {
        win: 'jackpotPose', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.2, shot: S.lowR(1.6),
        fx: d => { d.sfx.jackpotFanfare(); d.audio.accent(880, { gain: 0.1, dur: 1.1 }); d.flash(0.35); }
      },
      {
        win: 'jBlast', strike: 'win', blast: { at: 0.35, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.9,
        fx: d => { d.fx.jackpotBeam(d.win, d.dir(), 12, 1.4); d.sfx.jackpotBlast(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // KASHIMO — 「幻獣琥珀」 MYTHICAL BEAST AMBER
  // Four hundred years of being bored, spent in one exchange. He takes the
  // limiter off, and the discharge is the only thing left of the fight.
  // =========================================================================
  kashimo: {
    id: 'kashimo_amber',
    moment: 'The limiter comes off — Mythical Beast Amber, from the Hakari fight.',
    color: '#a46bff', grade: 'void', chord: 'bright', root: 185,
    actions: [
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'arcdash', span: 0.9, shot: S.dollyL(), fx: d => { d.sfx.arcDash(); d.fx.dashTrail(d.win); } },
      { win: 'fThrust', strike: 'win', hit: true, react: 'rFoldGut', op: 'fGuardUp', shot: S.hitR(), power: 1.2, fx: d => d.sfx.lightningBolt(2) },
      { op: 'fRound', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.otsWin(), power: 1.1, knock: 0.6 },
      { win: 'fCleave', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.midR(), power: 1.3, fx: d => d.sfx.lightningBolt(3) },
      // the staff comes round and plants
      {
        win: 'kashimoSpin', op: 'fGuardUp', span: 1.15, shot: S.handWin({ d: 1.1 }),
        fx: d => { d.sfx.amber(); d.audio.accent(1108, { gain: 0.09, dur: 0.9 }); d.flash(0.3); }
      },
      {
        win: 'discharge', strike: 'win', blast: { at: 0.40, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.26, flash: 0.95,
        fx: d => { d.fx.ceShockwave(d.win, 5); d.sfx.discharge(3); },
        onContact: (d, at) => d.fx._ring(at, 0xa46bff, { size: 0.5, growRate: 22, life: 0.5, flat: false })
      },
      ...OUTRO('idleCharged', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // CHOSO — 「穿血」 PIERCING BLOOD
  // The Naoya fight and Shibuya both turn on it: he takes the hit he has to
  // take, the blood starts moving, and a lance of it goes through whatever is
  // in front of him.
  // =========================================================================
  choso: {
    id: 'choso_piercing',
    moment: 'Flowing Red Scale into Piercing Blood, point blank.',
    color: '#c4142c', grade: 'ko', chord: 'grim', root: 116.54,
    actions: [
      // he blocks it on his forearms and it costs him
      { op: 'fRound', strike: 'op', hit: true, react: 'chosoGuard', win: null, span: 1.0, power: 1.4, knock: 0.9, shot: S.lowR(), impact: 0.12 },
      {
        win: 'redScale', op: 'fGuardUp', span: 1.0, shot: S.faceWin({ d: 1.4, side: 0.6 }),
        fx: d => { d.fx.redScaleBurst(d.win); d.sfx.redScale(); d.audio.accent(174, { gain: 0.11 }); }
      },
      { win: 'fCross', strike: 'win', hit: true, react: 'rSnapHead', op: 'fGuardUp', shot: S.hitL(), power: 1.2 },
      { op: 'fHook', strike: 'op', hit: false, miss: true, win: 'fSlip', shot: S.otsLose() },
      // two fingers up, and the blood loads behind them
      {
        win: 'chosoGuard', op: 'fGuardUp', span: 1.1, speed: 0.7, shot: S.handWin({ d: 1.05 }), dofBase: 0.9,
        fx: d => { d.sfx.bloodCharge(); d.fx.bloodEdgeCast(d.win); d.audio.accent(392, { gain: 0.09, dur: 0.9 }); }
      },
      {
        win: 'ct2', strike: 'win', blast: { at: 0.35, aim: 'chest', power: 1.9, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 1.9, knock: 2.4, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.7,
        fx: d => { d.fx.piercingBlood(d.bone(d.win, 'HandR'), d.dir(), 14, 0.9); d.sfx.piercingBlood(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // NOBARA — 「共鳴り」 RESONANCE
  // The Eso and Kechizu fight: she takes a piece of them, puts it in the doll,
  // and hits it with a hammer while telling them exactly how this works.
  // =========================================================================
  nobara: {
    id: 'nobara_resonance',
    moment: 'Resonance — the doll, the nail and the hammer, from the Eso/Kechizu fight.',
    color: '#e07a34', grade: 'overtime', chord: 'bright', root: 174.61,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowL(), power: 1.0, knock: 0.7 },
      // she takes a piece of them on the way past
      { win: 'ct1', strike: 'win', blast: { at: 0.30, aim: 'head', power: 0.9, kind: 'blade' }, hit: true, react: 'rSnapHead', op: 'fGuardUp', span: 0.85, shot: S.hitR(), power: 0.9, fx: d => d.sfx.nailThrow() },
      { op: 'fKnee', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin() },
      { win: 'fHook', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', shot: S.midL(), power: 1.1, fx: d => d.sfx.hammer(false) },
      // the grin, and the nail held up between two fingers
      {
        win: 'nobaraGrin', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.25,
        shot: S.faceWin({ d: 1.15, side: 0.55 }), dofBase: 0.95,
        fx: d => {
          d.win.model.attachProp?.('doll', 'hand');
          d.win.model.attachProp?.('nail', 'drive');
          d.sfx.resonanceCharge(1); d.audio.accent(880, { gain: 0.08, dur: 0.8 });
        }
      },
      {
        win: 'ct2', strike: 'win', blast: { at: 0.45, aim: 'chest', power: 1.8, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.0,
        power: 1.8, knock: 1.6, shot: S.bigHit(), sting: true, impact: 0.22, flash: 0.65,
        fx: d => { d.sfx.hammer(true); d.sfx.resonanceHit(1); },
        onContact: (d, at) => d.fx._ring(at, 0xf0e2b8, { size: 0.4, growRate: 18, life: 0.5, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // PANDA — 「呪骸核」 THE GORILLA CORE
  // The Mechamaru fight. He is losing, so he changes what he is: the second
  // core comes out, he drums on his own chest, and the fight is different.
  // =========================================================================
  panda: {
    id: 'panda_gorilla',
    moment: 'The Gorilla core revealed and the chest drumming — the Mechamaru fight.',
    color: '#d9a94e', grade: 'overtime', chord: 'bright', root: 110,
    actions: [
      // he eats it standing up. That is the whole character.
      { op: 'fCross', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.lowR(), power: 1.3, knock: 0.5 },
      { op: 'fRound', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.otsWin(), power: 1.2, knock: 0.7 },
      {
        win: 'swap', op: 'fGuardUp', span: 1.0, shot: S.faceWin({ d: 1.5, side: 0.6 }),
        fx: d => { d.sfx.coreSwap?.(); d.fx._ring(d.win.pos.clone().setY(1.1), 0xd9a94e, { size: 0.5, growRate: 9, life: 0.4, flat: false }); }
      },
      // THE DRUMMING, and they are still coming at him
      {
        win: 'pandaDrum', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.4, shot: S.lowL(1.5),
        fx: d => { d.sfx.drummingBeat(); d.audio.accent(147, { gain: 0.13, dur: 1.0 }); }, shake: 0.35
      },
      { win: 'fBodyRip', strike: 'win', hit: true, react: 'rFoldGut', op: 'fGuardUp', shot: S.hitR(), power: 1.4 },
      {
        win: 'fPalm', strike: 'win', hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.7,
        fx: d => { d.fx.ceShockwave(d.win, 4); d.sfx.pandaPalm(); },
        onContact: d => d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 3.2, 90, { kind: 'body' })
      },
      ...OUTRO('idleGor', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // HANAMI — 「杜」 THE SEED
  // The Goodwill Event. It does not chase anybody: it puts something in the
  // ground, waits, and lets the ground do it.
  // =========================================================================
  hanami: {
    id: 'hanami_seed',
    moment: 'The seed into the ground and the roots coming up — the Goodwill Event fight.',
    color: '#9ec46a', grade: 'shadow', chord: 'grim', root: 98,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.lowR(), power: 1.2, knock: 0.5 },
      // the club arm, once, and it is enormous
      { win: 'fCleave', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0, shot: S.hitL(), power: 1.5, fx: d => d.sfx.woodImpact() },
      { op: 'fRound', strike: 'op', hit: false, win: 'fGuardUp', shot: S.otsWin(), power: 1.1 },
      // down onto one knee, palm flat, and it waits
      {
        win: 'hanamiSeed', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.5,
        shot: S.handWin({ d: 1.1 }), fx: d => { d.sfx.rootPrime(); d.audio.accent(196, { gain: 0.1, dur: 1.0 }); }
      },
      {
        win: 'ult', op: 'fGuardUp', span: 0.9, shot: S.lowL(1.3),
        fx: d => { d.fx.rootBurst(d.lose.pos.clone(), 2.2, true); d.sfx.rootField(); d.shake(0.4); }
      },
      {
        win: 'ult', strike: 'win', blast: { at: 0.55, aim: 'gut', power: 2.0, kind: 'blast' }, hit: true, react: 'rLaunch', op: 'fGuardUp', span: 1.1, speed: 0.9,
        power: 2.0, knock: 1.8, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.6,
        onContact: d => { d.fx.rootBurst(d.lose.pos.clone(), 4.5, true); d.sfx.rootErupt(); }
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // KUROURUSHI — 「暴食」 GLUTTONY
  // The Culling Game. It gets bigger every time it eats, and the fight ends
  // when it decides you are the next meal rather than the next opponent.
  // =========================================================================
  kurourushi: {
    id: 'kurourushi_devour',
    moment: 'Gluttony — it grows, the swarm comes out, and it eats.',
    color: '#d8a02a', grade: 'flesh', chord: 'wrong', root: 92.5,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.lowR(1.6), power: 1.2, knock: 0.4 },
      // it grows. Mid-fight, on camera.
      {
        win: 'growth', op: 'fGuardUp', span: 1.2, shot: S.lowL(1.9),
        fx: d => { d.sfx.growl(2); d.audio.accent(110, { gain: 0.14, dur: 1.2 }); d.shake(0.6); d.flash(0.3); }
      },
      { win: 'fCleave', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0, shot: S.hitR(), power: 1.4 },
      {
        win: 'ct2', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.1, shot: S.dollyL(),
        fx: d => { d.sfx.swarmRelease(); d.fx.corrosiveSpray(d.win, 3, 0.8); }
      },
      {
        win: 'kuroRear', op: 'fGuardUp', span: 1.2, shot: S.lowR(1.9),
        fx: d => { d.sfx.swarmHiss(2); d.audio.accent(87, { gain: 0.13, dur: 1.1 }); }
      },
      {
        win: 'devour', strike: 'win', blast: { at: 0.40, aim: 'chest', power: 1.9, kind: 'grab' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 1.9, knock: 1.4, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.6,
        fx: d => d.sfx.devourBite(),
        onContact: (d, at) => d.fx._ring(at, 0xd8a02a, { size: 0.6, growRate: 14, life: 0.5, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // YUTA — 「リカ」 THE CALL
  // Jujutsu Kaisen 0, against Geto. He does not win it with a technique; he
  // wins it by asking the thing that loves him for everything it has.
  // =========================================================================
  yuta: {
    id: 'yuta_rika',
    moment: 'Calling Rika, and what answers — the JJK 0 finale.',
    color: '#9ff5c9', grade: 'void', chord: 'regal', root: 174.61,
    actions: [
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(), power: 1.3, knock: 0.9 },
      { win: 'swordSlash', strike: 'win', blast: { at: 0.28, aim: 'chest', power: 1.3, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.95, shot: S.hitL(), power: 1.3, fx: d => d.sfx.swordSwing() },
      { op: 'fRound', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin(), power: 1.1 },
      // THE CALL. The hand goes back and something answers.
      {
        win: 'yutaCall', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.45,
        shot: S.faceWin({ d: 1.35, side: -0.6 }), dofBase: 0.85,
        fx: d => { d.fx.rikaFlash(d.win, 'manifest'); d.sfx.rikaSwing(); d.audio.accent(261, { gain: 0.11, dur: 1.1 }); }
      },
      {
        win: 'ct1', strike: 'win', blast: { at: 0.32, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 2.6, shot: S.bigHit(), sting: true, impact: 0.24, flash: 0.8,
        fx: d => d.fx.rikaFlash(d.win, 'blast'),
        onContact: (d, at) => d.fx._ring(at, 0x9ff5c9, { size: 0.5, growRate: 18, life: 0.5, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  },

  // =========================================================================
  // GETO — 「極ノ番・うずまき」 UZUMAKI
  // Jujutsu Kaisen 0 from the other side. Every curse he owns, compressed into
  // a ball and thrown. Serene the entire time.
  // =========================================================================
  geto: {
    id: 'geto_uzumaki',
    moment: 'Maximum: Uzumaki — every curse he owns, compressed and thrown.',
    color: '#6b2fa0', grade: 'void', chord: 'regal', root: 110,
    actions: [
      // something else takes the hit for him
      {
        win: 'summonLow', op: 'fCross', strike: 'op', hit: false, span: 1.0, shot: S.lowR(),
        blockSnd: 'curseSummon', power: 1.0, fx: d => d.sfx.curseSummon('low')
      },
      { win: 'summonGrand', strike: 'win', blast: { at: 0.50, aim: 'chest', power: 1.4, kind: 'grab' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.1, shot: S.hitL(), power: 1.4, fx: d => d.sfx.curseAttack() },
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsWin(), power: 0.9, knock: 0.4 },
      { win: 'reabsorb', op: 'fGuardUp', span: 0.9, shot: S.midR(), fx: d => d.sfx.curseRecall() },
      // the palm. He is choosing which of them to spend.
      {
        win: 'getoPalm', op: 'fGuardUp', span: 1.25, shot: S.handWin({ d: 1.05 }), dofBase: 0.9,
        fx: d => d.audio.accent(220, { gain: 0.1, dur: 1.0 })
      },
      {
        win: 'ult', strike: 'win', blast: { at: 0.80, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rFinish', op: 'fGuardUp', span: 1.15,
        power: 2.0, knock: 2.8, shot: S.crane({ d: 5.2, top: 3.0 }), sting: true, impact: 0.26, flash: 0.85,
        fx: d => { d.sfx.uzumaki(); d.fx.ceShockwave(d.win, 5); },
        onContact: (d, at) => d.fx._ring(at, 0x6b2fa0, { size: 0.8, growRate: 20, life: 0.6, flat: false })
      },
      ...OUTRO('idle', { heroClip: 'victory' })
    ]
  }
};

// ---------------------------------------------------------------------------
// LOOKUP. A pick with no entry of its own inherits the base character's, which
// is how a cosmetic variant gets the right finisher for free; a pick with no
// entry at all returns null and the match goes straight to the win screen
// exactly as it does today.
//
// `cfg.finishers` — THE OPTIONAL CONFIG FIELD. A character config may declare
// its own list, which wins over this table and over the base character's. It is
// a LIST so a character can own several: selection is random, and a
// `when(match, winner, loser)` predicate on an entry gates it. Nothing in the
// roster declares one today — this table is the content — but adding a second
// finisher to a character is a data change with no code behind it.
// ---------------------------------------------------------------------------
export function finishersFor(pick, cfg = null) {
  const list = [];
  if (Array.isArray(cfg?.finishers)) list.push(...cfg.finishers);
  const own = FINISHERS_BY_PICK[pick];
  if (own) list.push(own);
  else {
    const base = String(pick).split(':')[0];
    if (FINISHERS_BY_PICK[base]) list.push(FINISHERS_BY_PICK[base]);
  }
  return list;
}

export function pickFinisher(pick, cfg, match, winner, loser) {
  const list = finishersFor(pick, cfg)
    .filter(f => f && (!f.when || f.when(match, winner, loser)));
  if (!list.length) return null;
  return list[(Math.random() * list.length) | 0];
}
