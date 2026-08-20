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

// THE EXIT. Two actions: the body finishes going down, and the winner is left
// holding something. The GRAMMAR is shared — every one of these ends on a body
// on the floor and a person standing over it — but nothing else is: the fall
// clip depends on how they were killed (a body put on its knees does not fall
// the way a body blown across the street does), and the pose the winner holds
// is the last thing the player sees of that character, so every finisher names
// its own.
//
//   fall     the collapse clip — 'rFall' from standing, 'rKneelFall' from a
//            kneel, or `null` when the death reaction already put them down
//   heroClip what the winner is DOING over the body, and the whole reason this
//            is a parameter: Toji walks, Nanami checks his watch, Mahito looks
//            at his own hand, Todo laughs.
const OUTRO = (winClip, opts = {}) => {
  const out = [];
  if (opts.fall !== null) {
    out.push({
      win: opts.fallClip || winClip, op: opts.fall || 'rFall', span: opts.fallSpan ?? 1.15,
      shot: opts.fallShot || S.wideL(), dofBase: opts.fallDof ?? 0.15,
      fx: opts.fallFx
    });
  }
  out.push({
    win: opts.heroClip || winClip, op: null, span: opts.heroSpan ?? 1.35,
    shot: opts.heroShot || S.hero(), dofBase: opts.heroDof ?? 0.45,
    speed: opts.heroSpeed, fx: opts.heroFx
  });
  return out;
};

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
      // 投射呪法. He stops being where he was: six positions inside a quarter
      // of a second, an afterimage standing in every one of them, and one of
      // them arrives on their jaw. This is the technique, not a punch.
      {
        win: 'rush', strike: 'win', blast: { at: 0.26, aim: 'head', power: 1.3, kind: 'punch' }, hit: true, react: 'rSnapHead', op: 'fGuardUp',
        span: 0.95, speed: 1.15, power: 1.3, knock: 0.9, shot: S.dollyR(), impact: 0.12,
        fx: d => { d.fx.dashTrail(d.win); d.fx.dashTrail(d.win); },
        onContact: (d, at) => {
          d.fx.warpBlink(d.win.pos.clone(), at.clone(), 0xe8c85a);
          d.fx.impactBloom(at, 0xe8c85a, 0.7);
        }
      },
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
        win: 'framekick', strike: 'win', contact: { bone: 'FootL', at: 0.27, aim: 'head', reach: 0.16, power: 1.9, kind: 'kick', blade: 85 }, hit: true, react: 'rBlownBack', op: 'fGuardUp',
        span: 0.95, power: 1.9, knock: 3.0, shot: S.bigHit(), sting: true, impact: 0.2, flash: 0.5,
        onContact: (d, at) => {
          d.fx.impactBloom(at, 0xe8c85a, 1.4);
          d.fx.warpBlink?.(d.win.pos.clone(), at.clone(), 0xe8c85a);
          d.fx.debris(d.lose.pos.clone(), 10);
          d.sfx.frameKick?.();
        }
      },
      // and he is fixing his hair again before the body has stopped moving
      ...OUTRO('idle', {
        fallShot: S.wideR(), heroClip: 'naoyaBrush', heroSpan: 1.5, heroSpeed: 0.85,
        heroShot: S.faceWin({ d: 1.45, side: 0.7 }), heroDof: 0.8
      })
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
      // 蒼. The other one does not push — it PULLS, and they come off their
      // feet toward the hand rather than away from it. Negative knock is the
      // whole point of the technique and nothing else in the game does it.
      {
        win: 'ct2', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.3, kind: 'blast' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 1.0,
        power: 1.3, knock: -1.4, shot: S.midL(), impact: 0.14,
        fx: d => { d.sfx.blue?.(); d.fx.blueOrb(d.bone(d.win, 'HandL')); },
        onContact: (d, at) => {
          d.fx.techCharge(d.bone(d.win, 'HandL'), 0x66b8ff, 1.4);
          d.fx.impactBloom(at, 0x66b8ff, 0.9);
        }
      },
      // BOTH HANDS OUT. Red in one, blue in the other, held apart long enough
      // to read as two different things — the shot is the two hands, not him.
      {
        win: 'gojoPurpleCharge', op: 'fGuardUp', span: 0.85, shot: S.handWin({ d: 1.0, side: -0.55 }), dofBase: 0.9,
        fx: d => {
          d.sfx.blue();
          d.fx.blueOrb?.(d.bone(d.win, 'HandL'));
          d.fx._ring(d.bone(d.win, 'HandR'), 0xff4a3c, { size: 0.28, growRate: 4, life: 0.6, flat: false });
          d.audio.accent(1320);
        }
      },
      // 虚式・茈. They come together, nothing in the world moves for a beat,
      // and then it does not hit them so much as delete the line it is on.
      // ONE SHOT that starts tight on the two hands and is pulled backwards by
      // what comes out of them (a negative push on the two-shot).
      {
        win: 'gojoPurpleFire', strike: 'win', blast: { at: 0.66, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rBlownBack', op: 'fGuardUp', span: 1.35,
        power: 2.0, knock: 2.8, shot: S.crane({ d: 6.0, side: -0.85, top: 2.2 }),
        sting: true, impact: 0.28, flash: 1.0, dofBase: 0.35,
        // THE BEAM IS AN onContact. A one-shot VFX raised at the top of the
        // action is already gone by the time a blast timed near the END of a
        // clip actually lands — the first pass of this fired Hollow Purple
        // two thirds of a second before it hit anything, and the frame of
        // impact had nothing in it at all.
        fx: d => d.sfx.purple(),
        onContact: (d, at) => {
          d.fx.purpleBeam(d.bone(d.win, 'HandR'), d.dir());
          d.fx.impactBloom(at, 0xb47fff, 2.0);
          d.fx.debris(d.lose.pos.clone(), 24, 0xb47fff);
          d.fx.scorch(d.lose.pos.clone(), 4.0, 0xb47fff);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 5.5, 150, { kind: 'body' });
        }
      },
      // hands back in the pockets before the body lands
      ...OUTRO('idle', {
        fallShot: S.wide({ d: 6.4, side: -1, y: 0.5 }), fallSpan: 1.3,
        heroClip: 'gojoPockets', heroSpan: 1.45, heroSpeed: 0.9,
        heroShot: S.hero({ d: 4.6, from: 0.45, sweep: 0.55, y: 0.5 })
      })
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
      // 赤 AT RANGE ZERO. The palm is ON them — he is close enough to be
      // punched, and he fires anyway. It is a contact, not a beam.
      {
        win: 'gojoPointBlank', strike: 'win',
        contact: { bone: 'HandR', at: 0.24, aim: 'chest', reach: 0.06, power: 2.0, kind: 'blast' },
        hit: true, react: 'rBlownBack', op: 'fGuardUp', span: 1.10,
        power: 2.0, knock: 3.6, shot: closeOn('lose', 'Chest', { d: 1.3, side: -0.7, fov: 44 }),
        sting: true, impact: 0.24, flash: 0.9, snd: 'red',
        fx: d => d.fx.redBlast(d.win, 3.4),
        onContact: (d, at) => { d.fx.impactBloom(at, 0xff5a4a, 1.5); d.fx.debris(d.lose.pos.clone(), 14); }
      },
      ...OUTRO('idle', {
        fallShot: S.wideR(), heroClip: 'gojoPockets', heroSpan: 1.4,
        heroShot: S.hero({ d: 4.0, from: 0.7, sweep: 0.45 })
      })
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
      // and then one cut, thrown without looking, that opens them up
      {
        win: 'ct1', strike: 'win', blast: { at: 0.26, aim: 'chest', power: 1.5, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.95,
        power: 1.5, knock: 1.2, shot: S.hitR(), impact: 0.14,
        fx: d => { d.fx.dismantleSlash(d.win, d.dir(), 5, 1.1); d.sfx.dismantle(); },
        onContact: (d, at) => { d.fx.cleaveCut?.(d.win, d.lose, 0.5); d.fx.impactBloom(at, 0xff2f45, 0.8); }
      },
      // the head tilt. Four eyes, and no interest at all.
      {
        win: 'sukunaFold', op: 'fCross', strike: 'op', hit: false, span: 1.2,
        miss: true, shot: S.faceWin({ d: 1.25, side: 0.5 }), dofBase: 0.95,
        fx: d => d.audio.accent(174, { gain: 0.12, dur: 0.9 })
      },
      // 解 — one hand out of the fold, two fingers across, and back. He does
      // not step, he does not turn, and the cut arrives anyway.
      {
        win: 'sukunaDismantle', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 2.0, kind: 'blade' }, hit: true, react: 'rSplit', op: 'fGuardUp', span: 1.15,
        power: 2.0, knock: 0.35, shot: closeOn('win', 'HandR', { d: 1.1, side: -0.6, fov: 38, lead: 0.12 }),
        sting: true, impact: 0.24, flash: 0.55, reactSpeed: 0.85,
        fx: d => { d.fx.dismantleSlash(d.win, d.dir(), 6, 1.4); d.sfx.dismantle(); },
        onContact: (d, at) => {
          // the cut lands as a LATTICE — Dismantle is not one line
          d.fx.cleaveCut?.(d.win, d.lose, 0.7);
          d.fx.dismantleSlash(d.win, d.dir(), 6, 2.2);
          d.fx.impactBloom(at, 0xff2f45, 1.5);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 5, 140, { kind: 'body' });
        }
      },
      // he never came out of the fold, so that is what he is left standing in
      ...OUTRO('sukunaFold', {
        fallSpan: 1.25, fallShot: S.lowR(1.5),
        heroClip: 'sukunaFold', heroSpan: 1.4, heroSpeed: 0.8,
        heroShot: S.hero({ d: 3.8, from: 0.5, sweep: 0.35, y: 0.4 }), heroDof: 0.55
      })
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
      // the vessel's hands still cut. Two of them, crossed, off one wrist.
      {
        win: 'ct1', strike: 'win', blast: { at: 0.26, aim: 'chest', power: 1.4, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.95,
        power: 1.4, knock: 1.1, shot: S.hitL(), impact: 0.12,
        fx: d => { d.fx.dismantleSlash(d.win, d.dir(), 5, 1.2); d.sfx.dismantle(); },
        onContact: (d, at) => d.fx.impactBloom(at, 0xff2f45, 0.8)
      },
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'fStepThrough', shot: S.dollyR() },
      // 伏魔御廚子. The arms cross, and everything inside the radius is
      // already inside the technique — there is no barrier to put up.
      {
        win: 'sukunaShrine', op: 'fGuardUp', span: 1.3, shot: S.lowR(1.7), dofBase: 0.3,
        fx: d => {
          d.sfx.domainCast?.(); d.audio.accent(146, { gain: 0.12, dur: 1.1 });
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 1.3), 0xff2f45, 1.8);
          d.fx.buffAura(d.win, 3, 0xff2f45);
        }
      },
      {
        win: 'sukunaShrine', strike: 'win', blast: { at: 0.60, aim: 'chest', power: 2.0, kind: 'blade' }, hit: true, react: 'rSplit', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 0.5, shot: S.lowL(1.8), sting: true, impact: 0.26, flash: 0.8, reactSpeed: 0.9,
        onContact: (d, at) => {
          // the cuts arrive everywhere at once, not on one line — four of them,
          // stacked up the body, which is what the roof of Shibuya looked like
          d.fx.shrineSlash(at.clone().setY(at.y + 0.5), 1.2, true);
          d.fx.shrineSlash(at, 1.0, false);
          d.fx.shrineSlash(at.clone().setY(at.y - 0.6), 0.9, true);
          d.fx.shrineSlash(at.clone().setY(at.y - 1.1), 0.7, false);
          d.fx.impactBloom(at, 0xff2f45, 1.6);
          d.fx.debris(d.lose.pos.clone(), 18);
          d.sfx.shrineSlash();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 4.0, 110, { kind: 'body' });
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.wide({ d: 5.6, side: 1, y: 0.55 }),
        heroClip: 'taunt', heroShot: S.lowR(1.9), heroSpan: 1.4, heroDof: 0.3
      })
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
      // he counts the fingers he has eaten, and the count is the threat
      {
        win: 'finger', op: 'fGuardUp', span: 1.0, shot: S.handWin({ d: 1.05 }), dofBase: 0.85,
        fx: d => {
          d.fx.fingerFlare?.(d.win, 4); d.sfx.fingerEat?.();
          d.fx.techCharge(d.bone(d.win, 'HandR'), 0xff2f45, 1.1);
          d.audio.accent(233, { gain: 0.1, dur: 0.9 });
        }
      },
      { op: 'fRound', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.midL() },
      // the palm comes up and the light in the scene changes
      {
        win: 'sukunaFire', op: 'fGuardUp', span: 1.25, shot: S.handWin({ d: 1.1 }), dofBase: 0.9,
        fx: d => { d.sfx.fireCharge(); d.fx.fireArrowCharge?.(d.win, 1); d.audio.accent(330, { dur: 0.9 }); }
      },
      {
        win: 'sukunaFire', strike: 'win', blast: { at: 0.92, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rBurn', op: 'fGuardUp', span: 1.15,
        power: 2.0, knock: 2.0, shot: S.wide({ d: 7.0, side: -1, y: 0.55, push: 2.2 }), sting: true, impact: 0.26, flash: 1.0,
        fx: d => d.sfx.fireArrow(),
        onContact: (d, at) => {
          d.fx.fireArrowBeam(d.win, d.dir(), 18, 1.5);
          d.fx.eruptionBlast(d.lose.pos.clone(), 3.0);
          d.fx.impactBloom(at, 0xff7a2f, 1.8);
          d.fx.bodyBurn(d.lose, 1.8);
          d.fx.scorch(d.lose.pos.clone(), 4.2);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 6.0, 160, { kind: 'body' });
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.lowR(1.7),
        heroClip: 'taunt', heroShot: S.hero({ d: 4.6, from: 0.6, sweep: 0.5 }), heroSpan: 1.4
      })
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
    moment: 'Playful Cloud, a weapon swap out of the Inventory Curse, then the Inverted Spear through the throat — and he does not look back.',
    color: '#6ea88a', grade: 'ko', chord: 'cold', root: 110,
    actions: [
      // he slips it without taking his hand out of his pocket
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'tojiBored', shot: S.faceWin({ d: 1.3 }), dofBase: 0.85, span: 1.2 },
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsWin(), power: 0.9, knock: 0.4 },
      { op: 'fCross', strike: 'op', hit: false, win: 'fCatch', shot: S.otsLose(), power: 0.9 },
      // HE HAS NO CURSED ENERGY, so his technique is the arsenal — and the
      // Inventory Curse is a wardrobe he changes weapons out of mid-fight.
      // First tool out is the Playful Cloud.
      {
        win: 'drawCloud', op: 'fGuardUp', span: 0.80, shot: two({ d: 2.6, side: 1, y: 1.42, fov: 38, push: 0.4 }), dofBase: 0.5,
        fx: d => {
          d.win.model.attachProp?.('playful_cloud', 'hand');
          d.win.model.attachProp?.('curse', 'hand');
          d.sfx.swordGrab?.(); d.audio.accent(147, { gain: 0.08 });
        }
      },
      {
        win: 'ct1Cloud', strike: 'win', blast: { at: 0.32, aim: 'chest', power: 1.5, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0,
        power: 1.5, knock: 1.3, shot: S.hitL(), impact: 0.14,
        fx: d => d.sfx.swordSwing?.(),
        onContact: (d, at) => d.fx.impactBloom(at, 0x6ea88a, 0.8)
      },
      { op: 'fKnee', strike: 'op', hit: false, miss: true, win: 'fStepThrough', shot: S.dollyL() },
      // 天逆鉾 comes out of the inventory curse — the SPEAR, named, in shot, and
      // held point-up in a reverse grip because that is how he carries it
      {
        win: 'arsenal', op: 'fGuardUp', span: 1.05, shot: two({ d: 2.3, side: -1, y: 1.45, fov: 36, push: 0.35 }),
        dofBase: 0.55,
        fx: d => {
          // and he changes weapon MID-FIGHT, which is the whole point of the
          // curse: the cloud goes back in and the spear comes out
          d.win.model.attachProp?.('inverted_spear', 'hand');
          d.win.model.attachProp?.('playful_cloud', 'away');
          d.win.model.attachProp?.('split_soul', 'away');
          d.win.model.attachProp?.('curse', 'away');
          d.sfx.swordGrab(); d.audio.accent(196, { gain: 0.09 });
        }
      },
      // THE KILL. Underhand, up under the jaw, into the neck — and his head is
      // turned away from it before the point goes in.
      {
        win: 'tojiSpear', strike: 'win',
        contact: { bone: 'HandR', at: 0.30, aim: 'chest', reach: 0.22, power: 2.0, kind: 'blade', blade: 40 },
        hit: true, react: 'rThroat', op: 'fGuardUp', span: 1.15,
        // SIDE ON, both bodies in profile. A close-up on the victim's throat
        // is placed between the two of them and the man doing the stabbing
        // stands in it — the only lens that can hold "point going in" and
        // "he is looking the other way" in one frame is the profile.
        power: 2.0, knock: 0.15, shot: two({ d: 3.05, side: -1, y: 1.5, fov: 40, push: 0.55 }),
        sting: true, impact: 0.26, flash: 0.3, snd2: 'blade', reactSpeed: 0.9,
        onContact: (d, at) => {
          // no bloom on this one. A weapon going into a throat is quiet, and
          // the restraint is the character — everything else in the roster
          // gets a light show and Toji gets a ring and a sound.
          d.fx.executionThrust(d.win);
          d.fx._ring(at, 0x9fd8bd, { size: 0.16, growRate: 5, life: 0.55, flat: false });
          d.sfx.swordSwing?.();
        }
      },
      // he takes it back out and the body is still standing. Cut wide for it —
      // and name NO clip on either of them, so the spear clip that is already
      // running plays on into its own withdrawal instead of restarting.
      { win: null, op: null, span: 0.55, shot: S.wideR(), dofBase: 0.2 },
      // and he is already walking. The body goes down behind him, out of focus,
      // and the camera stays with the man who is not watching it.
      {
        win: 'walk', op: 'rFall', span: 1.25, speed: 0.9, winAt: [-1.4, 0.35],
        shot: S.dollyL(), dofBase: 0.35
      },
      {
        win: 'walk', op: null, span: 1.5, speed: 0.85, winAt: [-1.2, 0.1],
        shot: S.hero({ d: 5.0, from: 1.05, sweep: 0.3, y: 0.5 }), dofBase: 0.4
      }
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
      // the blunt sword, once, across the body — his own technique clip, on
      // the ratio, not a library swing
      {
        win: 'ct1', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.4, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.95,
        power: 1.4, knock: 0.9, shot: S.hitL(), impact: 0.12,
        fx: d => { d.fx.cleaveArc(d.win, false); d.sfx.cleave(false); },
        onContact: (d, at) => { d.fx.ratioStrike(at, 1); d.fx.impactBloom(at, 0xf2b23c, 0.7); }
      },
      { op: 'fHook', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.midR() },
      // THE WATCH. He looks at it while they are still coming.
      {
        win: 'nanamiWatch', op: 'fGuardUp', span: 1.3, shot: closeOn('win', 'HandL', { d: 1.0, side: 0.5, fov: 34 }),
        dofBase: 0.95, fx: d => d.audio.accent(660, { gain: 0.07, dur: 0.7 })
      },
      // OVERTIME. He decides this counts as after hours, and a tired man
      // stops being tired — the aura is the technique, and it is the only
      // moment in the character where he spends anything on himself.
      {
        win: 'ult', op: 'fGuardUp', span: 1.05, shot: S.lowR(1.5), dofBase: 0.35, flash: 0.3,
        fx: d => {
          d.fx.overtimeAura(d.win, 4); d.fx.buffAura(d.win, 3, 0xf2b23c);
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 1.1), 0xf2b23c, 1.5);
          d.sfx.overtime?.(); d.audio.accent(392, { gain: 0.12, dur: 1.0 });
        }
      },
      // 7:3 — down, and it STOPS on the line. A cut to a mark, not a swing.
      {
        win: 'nanamiRatio', strike: 'win',
        contact: { bone: 'HandR', at: 0.37, aim: 'gut', reach: 0.60, power: 2.0, kind: 'blade' },
        hit: true, react: 'rSplit', op: 'fGuardUp', span: 1.20,
        power: 2.0, knock: 0.3, shot: S.hitL(), sting: true, impact: 0.24, flash: 0.7, reactSpeed: 0.85,
        fx: d => { d.fx.cleaveArc(d.win, true); d.sfx.cleave(true); },
        onContact: (d, at) => {
          d.fx.ratioStrike(at, 3); d.fx.ratioMark?.(at); d.sfx.ratioChime();
          d.fx.cleaveCut?.(d.win, d.lose, 0.8);
          d.fx.impactBloom(at, 0xf2b23c, 1.5);
        }
      },
      // and he checks the time again, because the overtime is still running
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.wideR(),
        heroClip: 'nanamiWatch', heroSpan: 1.5, heroSpeed: 0.85,
        heroShot: closeOn('win', 'HandL', { d: 1.05, side: 0.55, fov: 34 }), heroDof: 0.9
      })
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
      // 逕庭拳 — the divergent fist. The blow lands, and then it lands AGAIN
      // a beat later, which is the technique he has before he has Black Flash.
      {
        win: 'ct1', strike: 'win', blast: { at: 0.24, aim: 'chest', power: 1.2, kind: 'punch' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 1.0,
        power: 1.2, knock: 0.8, shot: S.hitR(), speed: 1.1, impact: 0.12,
        fx: d => d.fx.divergentJab(d.win),
        onContact: (d, at) => {
          d.fx.impactBloom(at, 0xff5f74, 0.6);
          d.fx.divergentJab(d.win);          // the second impact, on a delay
        }
      },
      { op: 'fKnee', strike: 'op', hit: false, miss: true, win: 'fDuck', shot: S.dollyR() },
      // the coil. Everything goes quiet.
      {
        win: 'yujiWind', op: 'fGuardUp', span: 0.65, shot: S.handWin({ d: 1.0 }), dofBase: 0.9,
        fx: d => { d.sfx.bfTell(); d.audio.accent(1480, { gain: 0.06 }); }
      },
      // 黒閃. The distortion is not on the fist, it is on the space around it —
      // and the frame after impact is held for longer than anything else in
      // this feature, because that is the panel everybody remembers.
      {
        win: 'yujiBlackFlash', strike: 'win',
        contact: { bone: 'HandR', at: 0.26, aim: 'head', reach: 0.02, power: 2.0, kind: 'punch' },
        hit: true, react: 'rTorque', op: 'fGuardUp', span: 1.05, speed: 0.95,
        power: 2.0, knock: 3.2, shot: closeOn('lose', 'Head', { d: 1.15, side: 0.7, fov: 46 }),
        sting: true, impact: 0.30, flash: 1.0, impactFrame: 0.26, reactSpeed: 0.85,
        onContact: (d, at) => {
          // the black core first, then the red, then the lattice — in that
          // order, because that is the order the frame reads in
          d.fx._ring(at, 0x1a0a12, { size: 0.5, growRate: 14, life: 0.4, flat: false });
          d.fx.impactBloom(at, 0xff2d3c, 1.7);
          d.fx._ring(at, 0xffd7dd, { size: 0.14, growRate: 34, life: 0.3, flat: false });
          d.fx.debris(d.lose.pos.clone(), 16);
          d.sfx.blackFlash();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 3.5, 100, { kind: 'body' });
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.wideL(),
        heroClip: 'victory', heroShot: S.hero({ d: 3.8, from: 0.6, sweep: 0.55, y: 0.5 })
      })
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
      // THREE — and the third is the authored one, thrown at full weight
      {
        win: 'yujiBlackFlash', strike: 'win',
        contact: { bone: 'HandR', at: 0.26, aim: 'chest', reach: 0.02, power: 2.0, kind: 'punch' },
        hit: true, react: 'rTorque', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 3.4, shot: S.lowR(1.3), sting: true, impact: 0.30, flash: 1.0, impactFrame: 0.24,
        onContact: (d, at) => {
          d.fx._ring(at, 0x1a0a12, { size: 0.6, growRate: 16, life: 0.4, flat: false });
          d.fx.impactBloom(at, 0xff2d3c, 1.7);
          d.fx.ceShockwave(d.win, 4);
          d.fx.debris(d.lose.pos.clone(), 16);
          d.sfx.blackFlash();
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.15, fallShot: S.wideR(),
        heroClip: 'victory', heroShot: S.hero({ d: 4.4, from: 0.9, sweep: 0.6 })
      })
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
      // BROTHERHOOD. Not one swap — five, around a body that has stopped
      // being able to guess which side the next one is coming from.
      {
        win: 'ult', strike: 'win', blast: { at: 0.42, aim: 'chest', power: 1.4, kind: 'punch' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.15,
        power: 1.4, knock: 0.6, shot: S.dollyL(), impact: 0.14,
        fx: d => {
          d.sfx.clap();
          const c = d.lose.pos.clone();
          for (let i = 0; i < 5; i++) {
            const a = i * 1.257;
            d.fx.boogieSwap(
              c.clone().add({ x: Math.cos(a) * 2.2, y: 0, z: Math.sin(a) * 2.2 }),
              c.clone().add({ x: Math.cos(a + 2.4) * 2.2, y: 0, z: Math.sin(a + 2.4) * 2.2 }),
              0xff5fc8);
          }
        },
        onContact: (d, at) => { d.fx.impactBloom(at, 0xff5fc8, 1.0); d.fx.ceShockwave(d.win, 3.5); }
      },
      // A SECOND CLAP, and the palm arrives from the side they stopped
      // watching. The swap is the attack; the hand is just where it lands.
      {
        win: 'todoBlindside', strike: 'win',
        contact: { bone: 'HandR', at: 0.48, aim: 'chest', reach: 0.06, power: 2.0, kind: 'punch' },
        hit: true, react: 'rBlownBack', op: 'fGuardUp', span: 1.05,
        power: 2.0, knock: 3.8, shot: S.dollyR(), sting: true, impact: 0.24, flash: 0.7,
        fx: d => { d.sfx.clap(); d.fx.boogieSwap(d.win.pos.clone(), d.lose.pos.clone(), 0xff5fc8); },
        onContact: (d, at) => {
          d.fx.ceShockwave(d.win, 5); d.sfx.ceSmash?.();
          d.fx.impactBloom(at, 0xff5fc8, 1.5);
          d.fx.debris(d.lose.pos.clone(), 18, 0xff5fc8);
        }
      },
      // arms wide, head back, absolutely delighted with himself
      ...OUTRO('idle', {
        fallSpan: 1.15, fallShot: S.wideL(),
        heroClip: 'todoGrin', heroSpan: 1.5, heroShot: S.lowR(1.8), heroDof: 0.25
      })
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
    moment: 'He sets them alight, cooks the ground, and pulls a mountain out of the sky — the last stand against Sukuna.',
    color: '#ff5a1f', grade: 'volcano', chord: 'brutal', root: 138.59,
    // HE IS A VOLCANO FOR THE WHOLE SCENE, not only on the beats he attacks
    // on — and what he sets alight stays alight. The gate is the time of his
    // first fire beat: before it they are simply fighting, after it there is a
    // man on fire in every subsequent shot, including the ones he is losing.
    ambient: (d, t) => {
      d.fx.bodyBurn(d.win, 0.30, { ground: false });
      if (t > 1.4) d.fx.bodyBurn(d.lose, 0.45, { ground: t > 5 });
    },
    actions: [
      // he is not a good fighter. He is a disaster, and he takes it badly.
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: 'fGuardUp', shot: S.lowR(), power: 1.3, knock: 0.9 },
      // SO HE STOPS TRYING TO FIGHT AND SETS THEM ON FIRE. He does not throw a
      // punch in this finisher after the first exchange — he is a volcano, and
      // the answer to everything is heat.
      {
        win: 'ct1', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.3, kind: 'blast' }, hit: true, react: 'rBurn', op: 'fGuardUp', span: 1.0,
        power: 1.3, knock: 1.0, shot: S.hitL(), impact: 0.12, reactSpeed: 1.4,
        fx: d => d.sfx.erupt(),
        onContact: (d, at) => {
          d.fx.eruptionBlast(d.lose.pos.clone(), 2.2);
          d.fx.bodyBurn(d.lose, 1.1);            // and now they are alight
          d.fx.impactBloom(at, 0xff5a1f, 0.8);
        }
      },
      // they are still burning while they close the distance and hit him
      {
        op: 'fKnee', strike: 'op', hit: true, react: 'rFoldGut', win: 'fGuardUp', shot: S.otsWin(), power: 1.1, knock: 0.6,
        fx: d => d.fx.bodyBurn(d.lose, 0.7)
      },
      // and the ground opens under them
      {
        win: 'ct2', strike: 'win', blast: { at: 0.34, aim: 'gut', power: 1.5, kind: 'blast' }, hit: true, react: 'rLaunch', op: 'fGuardUp', span: 1.05,
        power: 1.5, knock: 1.4, shot: S.lowL(1.6), impact: 0.14, flash: 0.4,
        fx: d => { d.sfx.erupt(); d.fx.bodyBurn(d.lose, 0.8); },
        onContact: d => {
          d.fx.eruptionBlast(d.lose.pos.clone(), 3.4);
          d.fx.scorch(d.lose.pos.clone(), 2.6);
          d.fx.debris(d.lose.pos.clone(), 14, 0x5a3a26);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 3.5, 90, { kind: 'body' });
        }
      },
      // HIS OWN BODY GOES MOLTEN. Overheat is not a buff here, it is the
      // character: the top of his head opens and the heat comes off him.
      {
        win: 'overheat', op: 'fGuardUp', span: 1.0, shot: S.faceWin({ d: 1.5, side: 0.6 }), dofBase: 0.8,
        fx: d => {
          d.sfx.overheat(); d.fx.bodyBurn(d.win, 1.4, { ground: false });
          d.fx.buffAura(d.win, 3, 0xff5a1f); d.fx.bodyBurn(d.lose, 0.6);
          d.audio.accent(87, { gain: 0.13, dur: 1.0 });
        }
      },
      // both arms up. He is calling it, not aiming it.
      {
        win: 'jogoMeteor', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.5,
        shot: S.crane({ d: 5.4, top: 4.6 }),
        fx: d => {
          d.sfx.eruptPrime(); d.audio.accent(110, { gain: 0.14, dur: 1.3 });
          // everything in the arena is pulled toward the point above his hands
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 3.2), 0xff7a2f, 1.6);
          d.fx.bodyBurn(d.win, 1.0, { ground: false });
          d.fx.bodyBurn(d.lose, 0.6);
        }
      },
      {
        win: 'jogoMeteor', strike: 'win', blast: { at: 1.20, aim: 'head', power: 2.0, kind: 'blast' }, hit: true, react: 'rSlam', op: 'fGuardUp', span: 1.2, speed: 0.9,
        power: 2.0, knock: 0.6, shot: S.crane({ d: 6.4, top: 5.2 }), sting: true, impact: 0.30, flash: 1.0,
        onContact: (d, at) => {
          // A MOUNTAIN LANDS ON THEM. Four effects on four clocks: the fireball,
          // the shockwave off the deck, the floor coming up, and the crater it
          // is all standing in afterwards.
          d.fx.eruptionBlast(d.lose.pos.clone(), 5.5);
          d.fx.impactBloom(at, 0xff7a2f, 1.8);
          d.fx.debris(d.lose.pos.clone(), 26, 0x5a3a26);
          d.fx.scorch(d.lose.pos.clone(), 4.5);
          d.fx.bodyBurn(d.lose, 2.0);
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0xff7a2f, { size: 1.2, growRate: 26, life: 0.7 });
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0x2a1206, { size: 2.0, growRate: 18, life: 0.9 });
          d.sfx.erupt();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 6.5, 200, { kind: 'body' });
        }
      },
      // it took everything he had, and the body is still burning in the crater
      ...OUTRO('idle', {
        fall: null,
        heroClip: 'overheat', heroSpan: 1.5, heroSpeed: 0.8,
        heroShot: S.hero({ d: 5.2, from: 0.5, sweep: 0.5, y: 0.35 }), heroDof: 0.3,
        heroFx: d => {
          d.fx.bodyBurn(d.lose, 1.6); d.fx.bodyBurn(d.win, 0.8, { ground: false });
          d.fx.eruptionBlast(d.lose.pos.clone(), 1.4); d.sfx.overheat?.();
        }
      })
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
      // and he sends something that used to be a person to do the fighting
      {
        win: 'summon', op: 'fGuardUp', span: 1.15, shot: S.lowR(1.6),
        fx: d => {
          d.sfx.bodyMorph?.(2); d.fx.soulGrasp(d.win);
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 1.0), 0x9fb0c4, 1.2);
          d.audio.accent(155, { gain: 0.11, dur: 1.0 });
        }
      },
      { op: 'fHook', strike: 'op', hit: false, win: 'fCatch', shot: S.otsLose(), power: 0.9 },
      // the hand. Slow, open, unhurried, and they are still swinging at him.
      {
        win: 'mahitoTouch', op: 'fKnee', strike: 'op', hit: false, miss: true, span: 1.45,
        shot: S.handWin({ d: 1.05 }), dofBase: 0.95,
        fx: d => { d.sfx.soulTouch(); d.audio.accent(246, { gain: 0.09, dur: 1.0 }); }
      },
      // 無為転変. The palm is LAID on them, held, and then the fingers press —
      // there is no impact to speak of, which is the horror of it. Almost no
      // knockback: nothing pushed them, they simply stopped being a person.
      {
        win: 'mahitoTransfigure', strike: 'win',
        contact: { bone: 'HandR', at: 0.42, aim: 'chest', reach: 0.04, power: 1.2, kind: 'grab' },
        hit: true, react: 'rCrumple', op: 'fGuardUp', span: 1.30, speed: 0.9,
        power: 1.4, knock: 0.15, shot: closeOn('lose', 'Chest', { d: 1.1, side: 0.6, fov: 38 }),
        sting: true, impact: 0.14, flash: 0.35, impactFrame: 0.08, reactSpeed: 0.8,
        fx: d => { d.fx.soulGrasp(d.win); d.sfx.transfigure(); },
        onContact: (d, at) => {
          // the body comes apart QUIETLY. Slow rings, no shards, no shockwave:
          // Idle Transfiguration does not hit anybody hard enough to explode.
          d.fx._ring(at, 0xdfe6ee, { size: 0.24, growRate: 6, life: 0.7, flat: false });
          d.fx._ring(at, 0x9fb0c4, { size: 0.5, growRate: 3, life: 0.9, flat: false });
          d.fx.corrosiveSpray?.(d.win, 1.6, 0.6);
          d.sfx.bodyMorph?.(1);
        }
      },
      // and he looks at his own hand rather than at what he did with it
      ...OUTRO('idle', {
        fallSpan: 1.25, fallShot: S.faceLose({ d: 1.6 }), fallDof: 0.6,
        heroClip: 'mahitoTouch', heroSpan: 1.45, heroSpeed: 0.8,
        heroShot: S.handWin({ d: 1.0 }), heroDof: 0.9
      })
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
        win: 'mahitoDistort', strike: 'win', blast: { at: 0.88, aim: 'chest', power: 2.0, kind: 'grab' }, hit: true, react: 'rCrumple', op: 'fGuardUp', span: 1.05, speed: 0.9,
        power: 1.9, knock: 0.9, shot: S.otsWin(), sting: true, impact: 0.26, flash: 0.7, reactSpeed: 0.85,
        fx: d => { d.fx.soulGrasp(d.win); d.sfx.transfigure(); },
        onContact: (d, at) => { d.fx.corrosiveSpray?.(d.win, 2.4, 1.1); d.fx._ring(at, 0xc8d4e0, { size: 0.5, growRate: 16, life: 0.6, flat: false }); }
      },
      // the body it is wearing comes back together, badly
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.lowR(1.5),
        heroClip: 'mahitoDistort', heroSpan: 1.5, heroSpeed: 0.7,
        heroShot: S.hero({ d: 4.0, from: 0.4, sweep: 0.6, y: 0.45 }),
        heroFx: d => d.sfx.bodyMorph?.(0)
      })
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
      // 玉犬. He does not throw a punch — he sends the dogs, and they go in
      // low and from two sides at once.
      {
        win: 'summonLow', strike: 'win', blast: { at: 0.40, aim: 'gut', power: 1.3, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.05,
        power: 1.3, knock: 0.9, shot: S.midR(), impact: 0.12,
        fx: d => { d.sfx.shikigami?.(); d.fx.shadowPuff?.(d.win.pos.clone()); },
        onContact: (d, at) => {
          d.fx.shadowPuff?.(d.lose.pos.clone());
          d.fx.impactBloom(at, 0x8fb6d8, 0.7);
          d.sfx.shikigamiBite?.();
        }
      },
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
      // and it comes out of the FLOOR, not out of him. He is not even facing
      // it — the camera is on the shadow under the body, and the body goes
      // straight down into it.
      {
        win: 'summonBoth', strike: 'win', blast: { at: 0.45, aim: 'gut', power: 2.0, kind: 'blade' }, hit: true, react: 'rSlam', op: 'fGuardUp', span: 1.10,
        power: 2.0, knock: 0.5, shot: S.crane({ d: 5.0, side: -0.9, top: 1.2 }), sting: true, impact: 0.24, flash: 0.45,
        onContact: (d, at) => {
          // EVERYTHING HE OWNS, out of the floor at once
          for (let i = 0; i < 5; i++) {
            const a = i * 1.257, r = 1.4;
            d.fx.shadowPuff?.(d.lose.pos.clone().add({ x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r }));
          }
          d.fx.shadowPuff?.(d.lose.pos.clone().setY(d.lose.pos.y + 0.9));
          d.fx.impactBloom(at, 0x8fb6d8, 1.3);
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0x05060c, { size: 1.0, growRate: 16, life: 0.7 });
          d.fx._ring(d.lose.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.5, growRate: 22, life: 0.5 });
          d.sfx.shikigamiBite();
        }
      },
      // the garden closes. He stands in it with his hands down — he never
      // threw a punch and that is the whole point of the technique.
      ...OUTRO('idle', {
        fall: null,
        heroClip: 'megumiPoint', heroSpan: 1.5, heroSpeed: 0.7,
        heroShot: S.hero({ d: 4.8, from: 0.35, sweep: 0.5, y: 0.3 }), heroDof: 0.5,
        heroFx: d => { d.fx._ring(d.win.pos.clone().setY(0.06), 0x05060c, { size: 2.4, growRate: -2.2, life: 1.2 }); d.sfx.shadowDive?.(); }
      })
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
        win: 'worldCut', strike: 'win', blast: { at: 0.50, aim: 'chest', power: 2.0, kind: 'blade' }, hit: true, react: 'rSplit', op: 'fGuardUp', span: 1.25,
        power: 2.0, knock: 0.4, shot: S.lowL(2.2), sting: true, impact: 0.30, flash: 0.95, reactSpeed: 0.8,
        fx: d => {
          d.fx.worldCut(d.win, d.dir(), 16, 2.0); d.sfx.worldCut();
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 7, 200, { kind: 'body' });
        },
        onContact: (d, at) => {
          d.fx.cleaveCut?.(d.win, d.lose, 1.0);
          d.fx.impactBloom(at, 0xc6ac72, 1.7);
          d.fx.debris(d.lose.pos.clone(), 24);
          d.fx.scorch(d.lose.pos.clone(), 3.6, 0xc6ac72);
        }
      },
      // the wheel is still turning. It does not celebrate; it waits.
      ...OUTRO('idle', {
        fallSpan: 1.25, fallShot: S.wide({ d: 7.0, side: -1, y: 0.45 }),
        heroClip: 'mahoragaTurn', heroSpan: 1.5, heroSpeed: 0.75,
        heroShot: S.hero({ d: 6.4, from: 0.4, sweep: 0.4, y: 0.4 }),
        heroFx: d => { d.win.model.spinWheel?.(0.5); d.sfx.adaptSpin?.(); }
      })
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
      // 没収 — CONFISCATION. He takes the technique off them first, which is
      // the part of the character everybody forgets: the sentence is passed on
      // somebody who has already been disarmed.
      {
        win: 'ct1', strike: 'win', blast: { at: 0.34, aim: 'chest', power: 1.1, kind: 'grab' }, hit: true, react: 'rBlockPush', op: 'fGuardUp', span: 1.05,
        power: 1.1, knock: 0.5, shot: S.midR(), impact: 0.12,
        fx: d => { d.fx.confiscate?.(d.win); d.sfx.confiscate?.(); },
        onContact: (d, at) => {
          d.fx.judgmentArc?.(d.win, 2.8);
          d.fx.techCharge(d.bone(d.win, 'HandR'), 0xd8c78a, 1.2);
          d.fx.impactBloom(at, 0xd8c78a, 0.7);
        }
      },
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
      // THE SENTENCE IS PASSED FIRST. They are put on their knees — a verdict
      // is not carried out on somebody who is still fighting.
      {
        win: 'fPalm', strike: 'win', hit: true, react: 'rKneel', op: 'fGuardUp', span: 1.0,
        power: 1.4, knock: 0.4, shot: S.otsWin(), impact: 0.14, reactSpeed: 0.9,
        onContact: (d, at) => { d.fx.judgmentArc?.(d.win, 2.4); d.sfx.gavel?.(); }
      },
      // and then it is carried out. Both hands, straight down, from above a
      // kneeling body — and it is administrative, not angry.
      {
        win: 'higurumaExecute', strike: 'win',
        contact: { bone: 'HandR', at: 0.74, aim: 'head', reach: 0.42, power: 2.0, kind: 'blade' },
        // NO reaction clip: they are already on their knees from the beat
        // before, and re-playing a reaction would stand them up to kneel
        // again. The body holds the pose it was sentenced in.
        hit: true, react: null, noReact: true, op: null, span: 1.35,
        // side on, and level with the kneeling body: the frame holds a man
        // standing and a man not, which is the whole content of the beat
        power: 2.0, knock: 0.1, shot: two({ d: 3.2, side: 1, y: 1.15, fov: 40, push: 0.45 }),
        sting: true, impact: 0.26, flash: 0.55,
        onContact: (d, at) => {
          d.fx.executionThrust(d.win);
          d.fx.impactBloom(at, 0xd8c78a, 1.4);
          d.fx.debris(d.lose.pos.clone(), 12, 0xd8c78a);
          d.sfx.executionSwing(); d.sfx.gavelFinal();
        }
      },
      ...OUTRO('swordIdle', {
        fall: 'rKneelFall', fallSpan: 1.35, fallShot: S.wideL(),
        heroClip: 'swordIdle', heroSpan: 1.45, heroSpeed: 0.8,
        heroShot: S.hero({ d: 4.2, from: 0.55, sweep: 0.45, y: 0.5 }), heroDof: 0.5
      })
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
      // THE SHUTTER GOES UP. He does not win this with punches, he wins it
      // with a slot machine — so the machine is on screen before the flurry.
      {
        win: 'shutter', op: 'fGuardUp', span: 1.05, shot: S.lowL(1.6), flash: 0.3,
        fx: d => {
          d.fx.shutterUp?.(d.win, 2.2); d.sfx.shutterUp?.();
          d.fx.buffAura(d.win, 4, 0xffc93c);
          d.audio.accent(523, { gain: 0.11, dur: 0.9 });
        }
      },
      // and then the flurry, which is what unlimited cursed energy buys
      {
        win: 'jFlurryL', strike: 'win', blast: { at: 0.22, aim: 'head', power: 1.1, kind: 'punch' }, hit: true, react: 'rSnapHead', op: 'fGuardUp', span: 0.62,
        power: 1.1, knock: 0.4, shot: S.hitR(), speed: 1.25, impact: 0.08,
        onContact: (d, at) => d.fx.impactBloom(at, 0xffc93c, 0.5)
      },
      {
        win: 'jFlurryR', strike: 'win', blast: { at: 0.22, aim: 'gut', power: 1.1, kind: 'punch' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 0.62,
        power: 1.1, knock: 0.4, shot: S.hitL(), speed: 1.25, impact: 0.08,
        onContact: (d, at) => d.fx.impactBloom(at, 0xffc93c, 0.5)
      },
      {
        win: 'jFlurryEnd', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.4, kind: 'punch' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 0.85,
        power: 1.4, knock: 1.0, shot: S.midL(), impact: 0.12,
        onContact: (d, at) => { d.fx.impactBloom(at, 0xffc93c, 0.9); d.fx.ceShockwave(d.win, 3); }
      },
      // the reels land
      {
        win: 'jackpotPose', op: 'fCross', strike: 'op', hit: false, miss: true, span: 1.2, shot: S.lowR(1.6),
        fx: d => { d.sfx.jackpotFanfare(); d.audio.accent(880, { gain: 0.1, dur: 1.1 }); d.flash(0.35); }
      },
      // and he DANCES into it. Both feet off the floor, an overhand right on
      // the beat, and unlimited cursed energy behind a punch he throws badly
      // on purpose — Jackpot is not a technique, it is a man enjoying himself.
      {
        win: 'hakariJackpot', strike: 'win',
        contact: { bone: 'HandR', at: 0.48, aim: 'head', reach: 0.04, power: 2.0, kind: 'punch' },
        hit: true, react: 'rBlownBack', op: 'fGuardUp', span: 1.25,
        power: 2.0, knock: 3.4, shot: S.dollyL(), sting: true, impact: 0.26, flash: 0.95,
        fx: d => d.sfx.jackpotBlast(),
        onContact: (d, at) => {
          d.fx.jackpotBeam(d.win, d.dir(), 12, 1.4);
          d.fx.ceShockwave(d.win, 5);
          d.fx.impactBloom(at, 0xffc93c, 1.6);
          d.fx.debris(d.lose.pos.clone(), 18, 0xffc93c);
          d.sfx.jackpotFanfare?.();
        }
      },
      // the reels are still running and he is still dancing
      ...OUTRO('idle', {
        fallSpan: 1.15, fallShot: S.wideR(),
        heroClip: 'jackpotPose', heroSpan: 1.5, heroShot: S.lowL(1.7), heroDof: 0.3,
        heroFx: d => { d.fx.buffAura(d.win, 2.5, 0xffc93c); d.flash(0.25); }
      })
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
    // four hundred years of stored charge does not switch off between strikes
    ambient: d => {
      const p = d.bone(d.win, 'HandR');
      d.fx._spawn(p, {
        color: 0xa46bff, size: 0.10 + Math.random() * 0.12, aspect: 0.3, life: 0.22,
        vel: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5, z: (Math.random() - 0.5) * 5 }
      });
    },
    actions: [
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'arcdash', span: 0.9, shot: S.dollyL(), fx: d => { d.sfx.arcDash(); d.fx.dashTrail(d.win); } },
      // 雷 — the staff is a lightning rod and he is the storm. Neither of
      // these is a swing: one is a bolt, one is a discharge.
      {
        win: 'bolt', strike: 'win', blast: { at: 0.30, aim: 'chest', power: 1.3, kind: 'blast' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 1.0,
        power: 1.3, knock: 0.9, shot: S.hitR(), impact: 0.12, flash: 0.35,
        fx: d => d.sfx.lightningBolt(2),
        onContact: (d, at) => { d.fx.impactBloom(at, 0xa46bff, 0.8); d.fx.techCharge(at, 0xa46bff, 0.9); }
      },
      { op: 'fRound', strike: 'op', hit: true, react: 'rBlockPush', win: 'fGuardUp', shot: S.otsWin(), power: 1.1, knock: 0.6 },
      // 幻獣琥珀 — the limiter comes off, and the body itself changes
      {
        win: 'ult', op: 'fGuardUp', span: 1.1, shot: S.lowL(1.6), flash: 0.4,
        fx: d => {
          d.fx.chargedAura?.(d.win); d.fx.buffAura(d.win, 4, 0xa46bff);
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 1.1), 0xa46bff, 1.8);
          d.sfx.amber?.(); d.audio.accent(880, { gain: 0.12, dur: 1.0 });
        }
      },
      // the staff comes round and plants
      {
        win: 'kashimoSpin', op: 'fGuardUp', span: 1.15, shot: S.handWin({ d: 1.1 }),
        fx: d => { d.sfx.amber(); d.audio.accent(1108, { gain: 0.09, dur: 0.9 }); d.flash(0.3); }
      },
      // he closes the distance HIMSELF — four hundred years of waiting for
      // somebody worth walking towards — and the staff goes straight through.
      {
        win: 'kashimoLance', strike: 'win',
        contact: { bone: 'HandR', at: 0.30, aim: 'chest', reach: 0.48, power: 2.0, kind: 'blade' },
        hit: true, react: 'rBurn', op: 'fGuardUp', span: 1.15,
        power: 2.0, knock: 1.2, shot: S.hitR(), sting: true, impact: 0.26, flash: 0.95,
        fx: d => { d.sfx.discharge(3); d.fx.dashTrail(d.win); },
        onContact: (d, at) => {
          d.fx.ceShockwave(d.win, 5);
          d.fx.impactBloom(at, 0xa46bff, 1.5);
          d.fx.debris(d.lose.pos.clone(), 16, 0xa46bff);
          d.sfx.lightningBolt?.(3);
        }
      },
      ...OUTRO('idleCharged', {
        fallSpan: 1.15, fallShot: S.wideL(),
        heroClip: 'kashimoSpin', heroSpan: 1.45, heroSpeed: 0.85,
        heroShot: S.hero({ d: 4.4, from: 0.65, sweep: 0.5 }),
        heroFx: d => { d.fx.chargedAura?.(d.win); d.sfx.amber?.(); }
      })
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
    // the technique costs him blood and the cost is visible: it comes off him
    // for the entire scene, not only when he fires
    ambient: (d, t) => {
      if (t < 1.0) return;
      const p = d.bone(d.win, 'Chest');
      d.fx._spawn(p, {
        color: 0xc4142c, size: 0.08 + Math.random() * 0.10, life: 0.5,
        vel: { x: (Math.random() - 0.5) * 1.4, y: 0.6 + Math.random(), z: (Math.random() - 0.5) * 1.4 },
        gravity: 4
      });
    },
    actions: [
      // he blocks it on his forearms and it costs him
      { op: 'fRound', strike: 'op', hit: true, react: 'chosoGuard', win: null, span: 1.0, power: 1.4, knock: 0.9, shot: S.lowR(), impact: 0.12 },
      {
        win: 'redScale', op: 'fGuardUp', span: 1.0, shot: S.faceWin({ d: 1.4, side: 0.6 }),
        fx: d => { d.fx.redScaleBurst(d.win); d.sfx.redScale(); d.audio.accent(174, { gain: 0.11 }); }
      },
      // 血塗 — the blood leaves him and goes in ahead of the fist
      {
        win: 'ct1', strike: 'win', blast: { at: 0.28, aim: 'chest', power: 1.3, kind: 'blade' }, hit: true, react: 'rSnapHead', op: 'fGuardUp', span: 0.95,
        power: 1.3, knock: 0.8, shot: S.hitL(), impact: 0.12,
        fx: d => { d.fx.bloodEdgeCast(d.win); d.sfx.bloodCharge?.(); },
        onContact: (d, at) => { d.fx.bloodEdgeTrail?.(at, d.dir()); d.fx.impactBloom(at, 0xc4142c, 0.7); }
      },
      // 超新星 — SUPERNOVA. Compressed to a point and let go of, which is the
      // one thing in his kit that is not a straight line.
      {
        win: 'ult', strike: 'win', blast: { at: 0.55, aim: 'gut', power: 1.6, kind: 'blast' }, hit: true, react: 'rLaunch', op: 'fGuardUp', span: 1.15,
        power: 1.6, knock: 1.5, shot: S.lowR(1.5), impact: 0.16, flash: 0.5,
        fx: d => {
          d.fx.supernovaCore?.(d.bone(d.win, 'HandR'), 1);
          d.fx.techCharge(d.bone(d.win, 'HandR'), 0xc4142c, 1.4);
          d.sfx.bloodCharge?.();
        },
        onContact: (d, at) => {
          d.fx.supernovaBurst?.(at, 3.2, 26);
          d.fx.impactBloom(at, 0xc4142c, 1.2);
        }
      },
      // two fingers up, and the blood loads behind them
      {
        win: 'chosoGuard', op: 'fGuardUp', span: 1.1, speed: 0.7, shot: S.handWin({ d: 1.05 }), dofBase: 0.9,
        fx: d => { d.sfx.bloodCharge(); d.fx.bloodEdgeCast(d.win); d.audio.accent(392, { gain: 0.09, dur: 0.9 }); }
      },
      // 穿血. He plants, sights down his own arm, and the recoil is the only
      // thing that moves on him — a rifle shot, not a punch.
      {
        win: 'chosoPierce', strike: 'win', blast: { at: 0.58, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rThroat', op: 'fGuardUp', span: 1.20,
        power: 2.0, knock: 1.0, shot: closeOn('win', 'HandR', { d: 1.15, side: -0.65, fov: 36, lead: 0.08 }),
        sting: true, impact: 0.24, flash: 0.7, reactSpeed: 0.9,
        fx: d => d.sfx.piercingBlood(),
        onContact: (d, at) => {
          d.fx.piercingBlood(d.bone(d.win, 'HandR'), d.dir(), 14, 0.9);
          d.fx.bloodEdgeTrail?.(at, d.dir());
          d.fx.impactBloom(at, 0xc4142c, 1.1);
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.lowR(1.4),
        heroClip: 'redScale', heroSpan: 1.4, heroSpeed: 0.8,
        heroShot: S.faceWin({ d: 1.5, side: -0.6 }), heroDof: 0.75,
        heroFx: d => d.fx.redScaleTick?.(d.win)
      })
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
      // and the ones already in them go off
      {
        win: 'detonate', strike: 'win', blast: { at: 0.32, aim: 'chest', power: 1.4, kind: 'blast' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0,
        power: 1.4, knock: 1.0, shot: S.midL(), impact: 0.14,
        fx: d => d.sfx.hammer(false),
        onContact: (d, at) => {
          d.fx.nailBlast?.(at, 1.4);
          d.fx.impactBloom(at, 0xe07a34, 0.9);
          d.sfx.nailBlast?.();
        }
      },
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
      // ONE HAMMER SWING, into a doll held at arm's length — and it happens to
      // somebody standing three metres away. She is looking at the doll.
      {
        win: 'nobaraResonance', strike: 'win', blast: { at: 0.48, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rCrumple', op: 'fGuardUp', span: 1.20,
        power: 2.0, knock: 0.5, shot: two({ d: 3.4, side: -1, push: 0.9, drift: 0.4 }),
        sting: true, impact: 0.22, flash: 0.6, reactSpeed: 0.9,
        fx: d => { d.sfx.hammer(true); d.sfx.resonanceHit(1); },
        onContact: (d, at) => {
          // RESONANCE lands everywhere at once, because the doll is the target
          // and they are only connected to it
          d.fx.fullReleaseHit?.(at, 1);
          d.fx.resonanceHit?.(at.clone().setY(at.y + 0.5), 0.8);
          d.fx.resonanceHit?.(at.clone().setY(at.y - 0.5), 0.8);
          d.fx.nailBlast?.(at, 1.2);
          d.fx.impactBloom(at, 0xf0e2b8, 1.2);
        }
      },
      // and she flicks the nail away, which is the last thing you see of her
      ...OUTRO('idle', {
        fallSpan: 1.15, fallShot: S.wideR(),
        heroClip: 'nobaraGrin', heroSpan: 1.4,
        heroShot: S.faceWin({ d: 1.3, side: 0.55 }), heroDof: 0.85
      })
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
      // and the Gorilla core's own strikes, which are not a person's
      {
        win: 'ct1Gor', strike: 'win', blast: { at: 0.28, aim: 'gut', power: 1.4, kind: 'punch' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 0.95,
        power: 1.4, knock: 1.0, shot: S.hitR(), impact: 0.14,
        onContact: (d, at) => { d.fx.impactBloom(at, 0xd9a94e, 0.8); d.fx.ceShockwave(d.win, 2.6); }
      },
      {
        win: 'ct2Gor', strike: 'win', blast: { at: 0.34, aim: 'chest', power: 1.5, kind: 'punch' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0,
        power: 1.5, knock: 1.2, shot: S.midR(), impact: 0.14,
        onContact: (d, at) => { d.fx.impactBloom(at, 0xd9a94e, 0.9); d.fx.debris(d.lose.pos.clone(), 10); }
      },
      // and the Gorilla core charges. Down onto the knuckles, then forward as
      // one mass — the shoulder is the weapon, the fist is where it touches.
      {
        win: 'pandaCharge', strike: 'win',
        contact: { bone: 'HandR', at: 0.32, aim: 'chest', reach: 0.06, power: 2.0, kind: 'punch' },
        hit: true, react: 'rBlownBack', op: 'fGuardUp', span: 1.10,
        power: 2.0, knock: 3.6, shot: S.lowR(1.4), sting: true, impact: 0.26, flash: 0.7,
        fx: d => { d.sfx.pandaPalm(); },
        onContact: (d, at) => {
          d.fx.ceShockwave(d.win, 4.5);
          d.fx.impactBloom(at, 0xd9a94e, 1.5);
          d.fx.debris(d.lose.pos.clone(), 22);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 4.0, 120, { kind: 'body' });
        }
      },
      ...OUTRO('idleGor', {
        fallSpan: 1.15, fallShot: S.wideL(),
        heroClip: 'pandaDrum', heroSpan: 1.5, heroSpeed: 0.9,
        heroShot: S.lowR(1.6), heroDof: 0.25,
        heroFx: d => { d.sfx.drummingBeat?.(); d.shake(0.3); }
      })
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
      // 杜 — it does not swing at them, it grows something and drops it
      {
        win: 'ct1', strike: 'win', blast: { at: 0.34, aim: 'chest', power: 1.5, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.05,
        power: 1.5, knock: 1.1, shot: S.hitL(), impact: 0.14,
        fx: d => { d.sfx.woodImpact(); d.fx.woodenBall?.(d.lose.pos.clone().setY(d.lose.pos.y + 2.4), 1.1); },
        onContact: (d, at) => { d.fx.rootBurst(d.lose.pos.clone(), 1.8, true); d.fx.impactBloom(at, 0x9ec46a, 0.8); }
      },
      // and the floor between them turns into a field of it
      {
        win: 'rootField', op: 'fGuardUp', span: 1.05, shot: S.crane({ d: 4.4, side: 0.9, top: 1.0 }),
        fx: d => {
          d.sfx.rootField(); d.shake(0.35);
          for (let i = 0; i < 4; i++) {
            const a = i * 1.57;
            d.fx.rootBurst(d.lose.pos.clone().add({ x: Math.cos(a) * 1.6, y: 0, z: Math.sin(a) * 1.6 }), 1.4, true);
          }
        }
      },
      { op: 'fRound', strike: 'op', hit: false, win: 'fGuardUp', shot: S.otsWin(), power: 1.1 },
      // down onto one knee, palm flat, and it waits
      {
        win: 'hanamiSeed', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.5,
        shot: S.handWin({ d: 1.1 }), fx: d => { d.sfx.rootPrime(); d.audio.accent(196, { gain: 0.1, dur: 1.0 }); }
      },
      // the ground under them moves first, and they have nowhere to go
      {
        win: 'ult', op: 'fGuardUp', span: 0.9, shot: S.crane({ d: 4.6, side: -0.9, top: 1.0 }),
        fx: d => { d.fx.rootBurst(d.lose.pos.clone(), 2.2, true); d.sfx.rootField(); d.shake(0.4); }
      },
      // and it closes its fist. That is the entire attack.
      {
        win: 'hanamiClench', strike: 'win', blast: { at: 0.64, aim: 'gut', power: 2.0, kind: 'grab' }, hit: true, react: 'rSlam', op: 'fGuardUp', span: 1.10,
        power: 2.0, knock: 0.3, shot: closeOn('win', 'HandR', { d: 1.1, side: 0.6, fov: 36 }),
        sting: true, impact: 0.26, flash: 0.5, reactSpeed: 0.85,
        onContact: (d, at) => {
          d.fx.rootBurst(d.lose.pos.clone(), 4.5, true);
          d.fx.rootBurst(d.lose.pos.clone().setY(d.lose.pos.y + 1.0), 2.6, true);
          d.fx.impactBloom(at, 0x9ec46a, 1.4);
          d.fx.debris(d.lose.pos.clone(), 16, 0x4a6a2a);
          d.sfx.rootErupt();
        }
      },
      // it does not stand over the body. It goes back to the ground.
      ...OUTRO('idle', {
        fall: null,
        heroClip: 'hanamiSeed', heroSpan: 1.55, heroSpeed: 0.7,
        heroShot: S.hero({ d: 5.0, from: 0.4, sweep: 0.4, y: 0.35 }), heroDof: 0.4,
        heroFx: d => { d.fx.rootBurst(d.win.pos.clone(), 1.6, true); d.sfx.rootPrime?.(); }
      })
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
      // 暴食 — the swarm goes first, and it takes pieces
      {
        win: 'ct1', strike: 'win', blast: { at: 0.32, aim: 'chest', power: 1.4, kind: 'blade' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.0,
        power: 1.4, knock: 1.0, shot: S.hitR(), impact: 0.14,
        fx: d => { d.sfx.swarmHiss?.(1); d.fx.corrosiveSpray?.(d.win, 2.6, 0.9); },
        onContact: (d, at) => d.fx.impactBloom(at, 0xd8a02a, 0.8)
      },
      {
        win: 'ct2', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.1, shot: S.dollyL(),
        fx: d => { d.sfx.swarmRelease(); d.fx.corrosiveSpray(d.win, 3, 0.8); }
      },
      {
        win: 'kuroRear', op: 'fGuardUp', span: 1.2, shot: S.lowR(1.9),
        fx: d => { d.sfx.swarmHiss(2); d.audio.accent(87, { gain: 0.13, dur: 1.1 }); }
      },
      {
        win: 'devour', strike: 'win', blast: { at: 0.40, aim: 'head', power: 2.0, kind: 'grab' }, hit: true, react: 'rSlam', op: 'fGuardUp', span: 1.10,
        power: 2.0, knock: -0.9, shot: closeOn('lose', 'Head', { d: 1.5, side: -0.7, fov: 46 }),
        sting: true, impact: 0.26, flash: 0.5, reactSpeed: 1.15,
        fx: d => d.sfx.devourBite(),
        onContact: (d, at) => {
          d.fx.corrosiveSpray?.(d.win, 2.6, 1.2);
          d.fx.impactBloom(at, 0xd8a02a, 1.3);
          d.fx.corrosiveSpray?.(d.win, 3.4, 1.4);
        }
      },
      // it is bigger than it was when the round started, and it is still eating
      ...OUTRO('idle', {
        fall: null,
        heroClip: 'kuroRear', heroSpan: 1.5, heroSpeed: 0.8,
        heroShot: S.lowR(2.1), heroDof: 0.3,
        heroFx: d => { d.sfx.growl?.(2); d.shake(0.35); }
      })
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
      // 模倣 — he does not fight with one technique, he fights with everybody
      // else's, and the one standing behind him throws it with him.
      {
        win: 'ct2', strike: 'win', blast: { at: 0.34, aim: 'chest', power: 1.4, kind: 'blast' }, hit: true, react: 'rFoldGut', op: 'fGuardUp', span: 1.05,
        power: 1.4, knock: 1.1, shot: S.midR(), impact: 0.14,
        fx: d => { d.fx.rikaFlash(d.win, 'manifest'); d.sfx.rikaSwing?.(); },
        onContact: (d, at) => { d.fx.impactBloom(at, 0x9ff5c9, 0.9); d.fx.techCharge(at, 0x9ff5c9, 1.0); }
      },
      { op: 'fRound', strike: 'op', hit: false, win: 'fParry', shot: S.otsWin(), power: 1.1 },
      // THE CALL. The hand goes back and something answers.
      {
        win: 'yutaCall', op: 'fHook', strike: 'op', hit: false, miss: true, span: 1.45,
        shot: S.faceWin({ d: 1.35, side: -0.6 }), dofBase: 0.85,
        fx: d => { d.fx.rikaFlash(d.win, 'manifest'); d.sfx.rikaSwing(); d.audio.accent(261, { gain: 0.11, dur: 1.1 }); }
      },
      // and they cut together. His stroke is a two-handed rising diagonal; the
      // one behind him is not in this clip, and does not need to be.
      {
        win: 'yutaRikaCut', strike: 'win',
        contact: { bone: 'HandR', at: 0.34, aim: 'chest', reach: 0.44, power: 2.0, kind: 'blade' },
        hit: true, react: 'rSplit', op: 'fGuardUp', span: 1.25,
        power: 2.0, knock: 0.8, shot: S.hitL(), sting: true, impact: 0.26, flash: 0.85, reactSpeed: 0.9,
        fx: d => { d.fx.rikaFlash(d.win, 'blast'); d.sfx.swordSwing?.(); },
        onContact: (d, at) => {
          d.fx.cleaveCut?.(d.win, d.lose, 0.9);
          d.fx.rikaFlash(d.win, 'blast');
          d.fx.impactBloom(at, 0x9ff5c9, 1.5);
        }
      },
      // and he turns to the empty air beside him, because she is standing there
      ...OUTRO('idle', {
        fallSpan: 1.2, fallShot: S.wideR(),
        heroClip: 'yutaCall', heroSpan: 1.5, heroSpeed: 0.8,
        heroShot: S.faceWin({ d: 1.45, side: -0.65 }), heroDof: 0.8,
        heroFx: d => d.fx.rikaFlash(d.win, 'manifest')
      })
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
    // a thousand curses in a bag, and a few of them always drifting loose
    ambient: (d, t) => {
      const a = t * 1.7, r = 1.5;
      d.fx._spawn(
        d.win.pos.clone().add({ x: Math.cos(a) * r, y: 1.2 + Math.sin(t * 2.3) * 0.4, z: Math.sin(a) * r }),
        { color: 0x6b2fa0, size: 0.14, life: 0.45, vel: { x: 0, y: 0.3, z: 0 } });
    },
    actions: [
      // something else takes the hit for him
      {
        win: 'summonLow', op: 'fCross', strike: 'op', hit: false, span: 1.0, shot: S.lowR(),
        blockSnd: 'curseSummon', power: 1.0, fx: d => d.sfx.curseSummon('low')
      },
      { win: 'summonGrand', strike: 'win', blast: { at: 0.50, aim: 'chest', power: 1.4, kind: 'grab' }, hit: true, react: 'rSpin', op: 'fGuardUp', span: 1.1, shot: S.hitL(), power: 1.4, fx: d => d.sfx.curseAttack() },
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsWin(), power: 0.9, knock: 0.4 },
      { win: 'reabsorb', op: 'fGuardUp', span: 0.9, shot: S.midR(), fx: d => d.sfx.curseRecall() },
      // and he spins the whole collection up. Every curse he owns is in the
      // air before the one that matters comes down.
      {
        win: 'wheel', op: 'fGuardUp', span: 1.05, shot: S.lowL(1.6),
        fx: d => {
          d.sfx.curseSummon?.('grand');
          d.fx.techCharge(d.win.pos.clone().setY(d.win.pos.y + 1.6), 0x6b2fa0, 1.9);
          d.fx.buffAura(d.win, 3, 0x6b2fa0);
          d.audio.accent(174, { gain: 0.11, dur: 1.0 });
        }
      },
      // the palm. He is choosing which of them to spend.
      {
        win: 'getoPalm', op: 'fGuardUp', span: 1.25, shot: S.handWin({ d: 1.05 }), dofBase: 0.9,
        fx: d => d.audio.accent(220, { gain: 0.1, dur: 1.0 })
      },
      // 極ノ番・うずまき — every curse he owns, compressed to the size of a
      // fist, and he lets go of it the way you would put down a cup.
      {
        win: 'getoUzumaki', strike: 'win', blast: { at: 0.74, aim: 'chest', power: 2.0, kind: 'blast' }, hit: true, react: 'rBurn', op: 'fGuardUp', span: 1.35,
        power: 2.0, knock: 3.4, shot: S.crane({ d: 5.8, top: 2.6 }), sting: true, impact: 0.28, flash: 0.9,
        fx: d => d.sfx.uzumaki(),
        onContact: (d, at) => {
          d.fx.ceShockwave(d.win, 5);
          d.fx.impactBloom(at, 0x6b2fa0, 1.8);
          d.fx.debris(d.lose.pos.clone(), 20, 0x6b2fa0);
          d.fx.scorch(d.lose.pos.clone(), 3.4, 0x6b2fa0);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 5.5, 150, { kind: 'body' });
        }
      },
      // serene throughout, and serene afterwards, which is the horror of him
      ...OUTRO('idle', {
        fallSpan: 1.25, fallShot: S.wide({ d: 6.0, side: 1, y: 0.5 }),
        heroClip: 'getoPalm', heroSpan: 1.5, heroSpeed: 0.75,
        heroShot: S.faceWin({ d: 1.5, side: 0.6 }), heroDof: 0.8
      })
    ]
  },

  // =========================================================================
  // INUMAKI TOGE — 「呪言」 ONE WORD TOO MANY
  // The Kyoto Goodwill Event, against a special grade. Sourced: his throat was
  // bleeding after a handful of commands aimed at Hanami — and he stepped back
  // up and said another one anyway, so Megumi would not have to fight a
  // special grade alone.
  //
  // So this is the only finisher in the file whose subject is NOT the kill.
  // Every other winner here is having their best moment; he is having his
  // worst one on purpose. The choreography says it in three beats:
  //
  //   HE IS LOSING IT.   The first exchanges go against him. He has the worst
  //                      normals in the game and the fight opens by proving it
  //                      — he slips one, gets caught by the next, and gets put
  //                      on the back foot. Nothing he throws lands, because he
  //                      does not throw anything.
  //   HE OPENS HIS COLLAR. Not a strike. The garment exists so that a
  //                      technique cannot go off by accident, and taking it
  //                      off is the decision the whole finisher turns on.
  //   IT COSTS HIM.      Two words in and his throat opens. He folds over it,
  //                      coughs, holds there long enough that it reads as
  //                      finished — and then straightens and says the third.
  //
  // He never touches them. Every hit in this finisher is a WORD, delivered as
  // a `blast` so he never walks into range for it: nobody steps forward to say
  // something.
  // =========================================================================
  inumaki: {
    id: 'inumaki_one_word',
    moment: 'The Goodwill Event — his throat gives out, and he speaks again anyway.',
    color: '#9fd8c8', grade: 'void', chord: 'cold', root: 146.83,
    // fragments of half-said words drifting around him. The ambient hook runs
    // for the whole cinematic, so it stays small: a few characters' worth of
    // debris at head height, never a storm.
    ambient: (d, t) => {
      if ((t * 60 | 0) % 7) return;
      const a = t * 1.1, r = 1.25;
      d.fx._spawn(
        d.win.pos.clone().add({ x: Math.cos(a) * r, y: 1.35 + Math.sin(t * 1.9) * 0.3, z: Math.sin(a) * r }),
        { color: 0x9fd8c8, size: 0.09, life: 0.6, vel: { x: 0, y: 0.22, z: 0 } });
    },
    actions: [
      // ---- HE IS LOSING IT ------------------------------------------------
      // he is not where the first one is, and that is the only thing he is
      // good at
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'fSlip', shot: S.lowR(), dofBase: 0.2 },
      // the second one finds him
      {
        op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null,
        shot: S.otsWin(), power: 1.0, knock: 0.6
      },
      // ---- HE OPENS HIS COLLAR --------------------------------------------
      // The hinge of the finisher, and there is no strike in it at all. Held
      // close on his face: the zip rides down, the mouth appears, and the
      // clan seals on both cheeks light for the first time.
      {
        win: 'inumakiCollar', op: 'fGuardUp', span: 1.35,
        shot: S.faceWin({ d: 1.15, side: 0.55 }), dofBase: 0.95,
        fx: d => {
          d.win.model.setCollar?.(1);
          d.win.model.setMarks?.(true);
          d.sfx.utterStart?.('heavy', 0);
          d.audio.accent(196, { gain: 0.1, dur: 1.1 });
          d.fx.techCharge?.(d.bone(d.win, 'Neck'), 0x9fd8c8, 1.1);
        }
      },

      // ---- 動くな — the cheap word, and it is not the point -----------------
      // He opens with the word he always opens with. It stops them where they
      // stand; it does not hurt them. The knock is deliberately tiny — being
      // rooted is not being hit.
      {
        win: 'utterLight', strike: 'win',
        blast: { at: 0.30, aim: 'chest', power: 0.9, kind: 'blast' },
        hit: true, react: 'rSnapHead', op: 'fCross', span: 0.95,
        power: 0.9, knock: 0.15, shot: S.hitL(), dofBase: 0.3,
        fx: d => {
          d.m.speechfx?.speak(d.win, d.lose, d.win.cfg.commands.defs.dont_move,
            { scale: 0.9, onArrive: null });
          d.sfx.command?.('light', 0);
        },
        onContact: (d, at) => {
          d.m.speechfx?.cage(d.lose, d.win.cfg.commands.defs.dont_move, 3.2);
          d.fx.impactBloom(at, 0x5fb0ff, 0.6);
        }
      },

      // ---- 潰れろ — and this one does ---------------------------------------
      // A field of gravity, so the glyph comes DOWN on them and they go to
      // their knees. `rKneel` rather than a knockback: nothing about GET
      // CRUSHED moves you sideways.
      {
        win: 'utterHeavy', strike: 'win',
        blast: { at: 0.52, aim: 'head', power: 1.6, kind: 'blast' },
        hit: true, react: 'rKneel', op: 'fGuardUp', span: 1.25,
        // A LOW SIDE SHOT, NOT A CRANE. The crane sat behind him and his own
        // back filled the frame — which hid the two things this beat is: a
        // glyph coming down from above, and a body going to its knees under
        // it. From the floor, looking up and across, both read.
        power: 1.6, knock: 0.2, shot: S.lowL(2.1), impact: 0.16, flash: 0.35,
        fx: d => {
          d.m.speechfx?.speak(d.win, d.lose, d.win.cfg.commands.defs.crush,
            { scale: 1.05, onArrive: null });
          d.sfx.command?.('heavy', 1);
        },
        onContact: (d, at) => {
          d.m.speechfx?.slam(d.lose, d.win.cfg.commands.defs.crush);
          d.sfx.commandCrush?.();
          d.fx.impactBloom(at, 0x9b5fd0, 1.1);
          d.fx.debris(d.lose.pos.clone(), 12, 0x9b5fd0);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.4), 2.4, 70, { kind: 'body' });
        }
      },

      // ---- IT COSTS HIM ---------------------------------------------------
      // Two words, and his throat is gone. The longest beat in the finisher
      // and the only one with no camera movement in it at all — he coughs,
      // folds over it, and holds there long enough that it reads as over.
      //
      // The blood on the collar is not a decal that fades: `setStrain(3, 1)`
      // latches it, and his model keeps it for the rest of the round.
      {
        win: 'inumakiThroat', op: 'rKneel', span: 1.55,
        // FROM BELOW. A face lens on a body folding forward frames the crown of
        // the head and nothing else — which is exactly what it did. Looking UP
        // at someone doubling over is both the readable angle and the right
        // one: it is the only shot in the finisher where he is above the
        // camera, and he spends it losing.
        shot: S.lowL(1.55), dofBase: 0.85, speed: 0.95,
        fx: d => {
          d.win.model.setStrain?.(3, 1);
          d.sfx.silenced?.();
          d.audio.accent(110, { gain: 0.12, dur: 1.6 });
          d.fx._spawn(d.bone(d.win, 'Neck'), { color: 0x8c1420, size: 0.11, life: 0.9, vel: { x: 0, y: -0.4, z: 0.2 }, gravity: 5 });
          d.fx._spawn(d.bone(d.win, 'Neck'), { color: 0x6e0a12, size: 0.08, life: 1.1, vel: { x: 0.1, y: -0.3, z: 0.3 }, gravity: 5 });
        }
      },

      // ---- 爆ぜろ — the word he should not be able to say -------------------
      // His own ultimate clip: the refusal, the forced shout, the collapse.
      // It is the only thing in this finisher he has to be TALKED INTO by his
      // own body, and the clip is authored to look like it hurts.
      {
        win: 'ult', strike: 'win',
        blast: { at: 0.56, aim: 'chest', power: 2.1, kind: 'blast' },
        hit: true, react: 'rBurn', op: 'rKneel', span: 1.95,
        // A WIDE CRANE, like Uzumaki's, because `bigHit` is a tight lens and
        // a knock this size throws the loser straight out of it — the first
        // pass lost BOTH bodies off frame on the money shot. The knock comes
        // down a little too: 3.0 still crosses the street.
        power: 2.1, knock: 3.0, shot: S.crane({ d: 6.4, top: 3.0 }), sting: true, impact: 0.30, flash: 0.95,
        fx: d => {
          d.m.speechfx?.speak(d.win, d.lose, {
            key: 'explode', short: 'EXPLODE', name: 'EXPLODE', jp: '爆ぜろ',
            romaji: 'HAZERO', kanji: '爆ぜろ', color: 0xff7a2a, weight: 'heavy'
          }, { scale: 1.25, onArrive: null });
          // NO TITLE CARD HERE, deliberately. In a live match the command
          // slams the word across the screen (ui/commandcard.js), but that
          // card lives on the HUD root and a finisher hides the HUD outright —
          // "the scene and nothing else" is the rule this whole system is
          // built on, and a DOM overlay would be the exception that breaks it.
          // The extruded glyphs are the statement here.
          d.sfx.explodeCommand?.();
          d.audio.accent(73.4, { gain: 0.16, dur: 2.0 });
        },
        onContact: (d, at) => {
          d.m.speechfx?.detonate(d.lose, {
            kanji: '爆ぜろ', color: 0xff7a2a, weight: 'heavy'
          }, 4.6);
          d.fx.ceShockwave(d.win, 5);
          d.fx.impactBloom(at, 0xff7a2a, 1.9);
          d.fx.debris(d.lose.pos.clone(), 22, 0xff7a2a);
          d.fx.scorch(d.lose.pos.clone(), 3.6, 0xff7a2a);
          d.m.arena?.destruct?.damageAt(d.lose.pos.clone().setY(0.5), 5.4, 150, { kind: 'body' });
        }
      },

      // He does not celebrate. He puts his collar back over his mouth, puts
      // his hand in his pocket, and looks at the floor — with the blood still
      // on the collar, which is the last thing the shot holds on.
      ...OUTRO('idle', {
        fallSpan: 1.20, fallShot: S.wide({ d: 6.2, side: 1, y: 0.5 }),
        fallFx: d => { d.win.model.setCollar?.(0); d.win.model.setMarks?.(false); },
        heroClip: 'inumakiCollarUp', heroSpan: 1.5, heroSpeed: 0.85,
        // `y` drops the lens to just under his eye line: at the default the
        // camera looked down at him and his own fringe covered the only part
        // of his face the design has to work with.
        heroShot: S.faceWin({ d: 1.35, side: 0.5, y: -0.10 }), heroDof: 0.85
      })
    ]
  },

  // =========================================================================
  // MAKI — 釈魂刀 THE SOUL CUT
  // The Zenin compound, the night she stops being the family's failure. She
  // takes the whole exchange standing — the awakening is not something that
  // happens TO her mid-fight, it is something she has already finished doing
  // by the time this starts — and the kill is one committed cut she watches
  // land.
  //
  // Authored to be read against Toji's, which is the same weapon family and
  // the opposite performance: he kills side-on, bored, without looking, and
  // walks away. She kills square, tracks it, and RESETS TO GUARD.
  // =========================================================================
  maki: {
    id: 'maki_soul_cut',
    moment: 'She takes two, does not go down, swaps to the katana and cuts once — and comes back to guard.',
    color: '#5fae7a', grade: 'ko', chord: 'cold', root: 116.5,
    actions: [
      // ---- SHE EATS THE FIRST TWO -----------------------------------------
      // and that is the character: her meter fills from being hit, so the
      // opening of her own finisher is her LOSING, on purpose.
      { op: 'fCross', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsLose(), power: 0.85, knock: 0.5 },
      { op: 'fKnee', strike: 'op', hit: true, react: 'rFoldGut', win: null, shot: S.hitR(), power: 1.0, knock: 0.6 },
      // ---- AND STANDS UP ---------------------------------------------------
      // The hinge, and there is no strike in it. Held close: she straightens,
      // the glasses come off, and the model steps to full awakening in shot.
      {
        win: 'taunt', op: 'fGuardUp', span: 1.30,
        shot: S.faceWin({ d: 1.25, side: 0.5 }), dofBase: 0.9,
        fx: d => {
          d.win.model.setStage?.(3);
          d.sfx.charged?.();
          d.audio.accent(233, { gain: 0.09 });
          d.fx._ring(d.win.pos.clone().setY(1.15), 0x5fae7a, { size: 0.5, growRate: 7, life: 0.5, flat: false });
        }
      },
      // the staff comes off her back, and it is the wrong weapon on purpose —
      // she throws one sweep with it to make room
      {
        win: 'ct1Cloud', strike: 'win', hit: true, react: 'rSpin', op: 'fGuardUp',
        span: 0.95, power: 1.3, knock: 1.2, shot: S.hitL(), impact: 0.12,
        fx: d => { d.win.model.setWeapon?.('playful_cloud'); d.sfx.swordSwing?.(); },
        onContact: (d, at) => d.fx.impactBloom(at, 0x5fae7a, 0.75)
      },
      { op: 'fCross', strike: 'op', hit: false, miss: true, win: 'fSlip', shot: S.dollyR() },
      // ---- THE SWAP --------------------------------------------------------
      // Two weapons, not four. The staff goes to her back and the katana comes
      // off it in one motion, which is the whole distinction from his wheel.
      {
        win: 'swap', op: 'fGuardUp', span: 0.70,
        shot: two({ d: 2.4, side: -1, y: 1.42, fov: 37, push: 0.35 }), dofBase: 0.55,
        fx: d => { d.win.model.setWeapon?.('split_soul'); d.sfx.swordGrab?.(); d.audio.accent(175, { gain: 0.08 }); }
      },
      // ---- THE CUT ---------------------------------------------------------
      {
        win: 'makiSoulCut', strike: 'win',
        blast: { at: 0.44, aim: 'chest', power: 1.7, kind: 'blade' },
        hit: true, react: 'rSplit', op: null, span: 1.25,
        power: 1.7, knock: 1.5, shot: S.bigHit(), impact: 0.18,
        fx: d => d.sfx.cleave?.(),
        onContact: (d, at) => {
          d.fx.impactBloom(at, 0x8fe0b4, 1.1);
          d.fx.soulRip?.(at);
        }
      },
      ...OUTRO('idle', {
        fallSpan: 1.15, fallShot: S.lowL(1.7),
        // she is back on guard over the body. Nobody else's outro does that.
        heroClip: 'victory', heroShot: S.hero({ d: 4.4, from: 0.55, sweep: 0.45 }), heroSpan: 1.5
      })
    ]
  },

  // =========================================================================
  // YUKI — 星の怒り THE COMMAND GRAB
  // She walks through everything they have, catches them by the throat, holds
  // it long enough to be rude, and puts them through the floor. The whole
  // finisher is ONE IDEA — that nothing they do moves her — and the armour is
  // shown rather than stated: she takes two clean hits without a flinch clip
  // anywhere in the sequence.
  // =========================================================================
  yuki: {
    id: 'yuki_star_rage',
    moment: 'They land two. She does not react to either. Then she picks them up.',
    color: '#6f7fd0', grade: 'ko', chord: 'low', root: 87.3,
    // dust drawn INWARD for the whole cinematic — the only ambient in the file
    // that travels the wrong way, which is the only honest way to draw gravity
    ambient: (d, t) => {
      if ((t * 60 | 0) % 4) return;
      const a = t * 2.3, r = 2.6;
      d.fx._spawn(
        d.win.pos.clone().add({ x: Math.cos(a) * r, y: 0.5 + (a % 1.7), z: Math.sin(a) * r }),
        { color: 0xb8c4f0, size: 0.10, life: 0.42,
          vel: { x: -Math.cos(a) * 5.5, y: 0.4, z: -Math.sin(a) * 5.5 } });
    },
    actions: [
      // ---- THEY HIT HER TWICE AND NOTHING HAPPENS -------------------------
      // `react: null` on a connected hit is the whole point: there is no
      // flinch clip, so the armour is a fact about the footage rather than a
      // number on a HUD.
      { op: 'fCross', strike: 'op', hit: true, react: null, win: 'fGuardUp', shot: S.otsLose(), power: 0.8, knock: 0 },
      { op: 'fUpper', strike: 'op', hit: true, react: null, win: 'fGuardUp', shot: S.faceWin({ d: 1.4 }), dofBase: 0.8, power: 1.0, knock: 0 },
      // ---- SHE TAKES A STEP ------------------------------------------------
      {
        win: 'massCharge', op: 'fGuardUp', span: 1.05,
        shot: two({ d: 3.0, side: 1, y: 1.5, fov: 40, push: 0.4 }), dofBase: 0.5,
        fx: d => {
          d.win.model.setMass?.(1);
          d.sfx.techCharge?.();
          d.audio.accent(87, { gain: 0.11 });
        }
      },
      // one long jab, purely so the reach reads before the grab
      {
        win: 'punch1', strike: 'win', hit: true, react: 'rSnapHead', op: null,
        span: 0.85, power: 1.2, knock: 0.9, shot: S.hitR(),
        onContact: (d, at) => d.fx.impactBloom(at, 0x6f7fd0, 0.8)
      },
      // ---- THE GRAB --------------------------------------------------------
      {
        win: 'yukiGrabSlam', strike: 'win',
        blast: { at: 0.34, aim: 'head', power: 1.2, kind: 'grab' },
        hit: true, react: 'rThroat', op: null, span: 1.55,
        power: 2.0, knock: 0.2, shot: S.crane(), impact: 0.22,
        fx: d => d.sfx.grab?.() ?? d.sfx.impact?.(),
        onContact: (d, at) => {
          d.fx.impactBloom(at, 0x6f7fd0, 1.3);
          d.fx.quakeTick?.(at, 3.0);
          d.cam.shake(1.2);
        }
      },
      ...OUTRO('idle', {
        // the react already put them on the floor
        fall: null,
        heroClip: 'taunt', heroShot: S.hero({ d: 5.0, from: 0.6, sweep: 0.55 }), heroSpan: 1.6,
        heroFx: d => d.win.model.setMass?.(0)
      })
    ]
  },

  // =========================================================================
  // MIWA — 簡易領域・抜刀 THE CIRCLE AND ONE CUT
  // The quietest finisher in the game, and deliberately the opposite of Todo's
  // and Yuki's. She loses the exchange, retreats, puts the circle down, and
  // then does not move for a second and a half while they walk into it.
  //
  // The kill is ONE FRAME OF CONTACT. There is no follow-up, no second hit and
  // no flourish — and the last thing she does is apologise, which is the only
  // outro on the roster where the winner is embarrassed.
  // =========================================================================
  miwa: {
    id: 'miwa_simple_domain',
    moment: 'She backs off, draws the circle, and waits. They step in. One cut.',
    color: '#a8d8e8', grade: 'ko', chord: 'cold', root: 130.8,
    actions: [
      // ---- SHE IS LOSING ---------------------------------------------------
      { op: 'fHook', strike: 'op', hit: true, react: 'rSnapHead', win: null, shot: S.otsLose(), power: 1.0, knock: 0.7 },
      { op: 'fRound', strike: 'op', hit: false, win: 'fParry', shot: S.hitL(), power: 0.9,
        fx: d => d.sfx.guard?.() },
      // ---- THE CIRCLE ------------------------------------------------------
      // Inscribed, in shot, in one sweep of the blade — the ring is DRAWN
      // rather than spawned, which is the whole visual thesis of the ability.
      {
        win: 'special', op: 'fStepThrough', span: 1.15,
        shot: S.crane(), dofBase: 0.35,
        fx: d => {
          d.sfx.simpleDomain?.();
          d.audio.accent(261, { gain: 0.08 });
          d.fx._ring(d.win.pos.clone().setY(0.06), 0xa8d8e8, { size: 0.4, growRate: 9, life: 0.9, flat: true });
        }
      },
      // ---- AND SHE WAITS ---------------------------------------------------
      // No strike, no movement, no camera move. A second and a half of a
      // teenage girl standing perfectly still while somebody walks at her.
      {
        win: 'stance', op: 'fStepThrough', span: 1.50,
        shot: two({ d: 3.4, side: -1, y: 1.35, fov: 34, push: 0.15 }), dofBase: 0.7,
        fx: d => d.audio.accent(196, { gain: 0.05 })
      },
      // ---- ONE CUT ---------------------------------------------------------
      {
        win: 'miwaIai', strike: 'win',
        blast: { at: 0.60, aim: 'chest', power: 1.8, kind: 'blade' },
        hit: true, react: 'rSplit', op: null, span: 1.85,
        power: 1.8, knock: 1.1, shot: S.faceWin({ d: 2.0, side: 0.35 }), dofBase: 0.6, impact: 0.24,
        fx: d => d.sfx.cleave?.(),
        // ONE LINE and nothing else. No bloom, no debris, no shake beyond the
        // impact the director already applies.
        onContact: (d, at) => d.fx._ring(at, 0xffffff, { size: 0.2, growRate: 22, life: 0.2, flat: false })
      },
      ...OUTRO('idle', {
        fallSpan: 1.25, fallShot: S.wideR(),
        // she sheathes it properly — the one thing she is unambiguously good
        // at — and then immediately looks like she wants to say sorry.
        heroClip: 'victory', heroShot: S.hero({ d: 4.0, from: 0.5, sweep: 0.35 }), heroSpan: 1.7
      })
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

// `roll` is a 0..1 number. Online the HOST generates it and ships it on the
// KO event, so every client plays the same cinematic — one screen running a
// finisher while another does not would desync the whole match clock.
export function pickFinisher(pick, cfg, match, winner, loser, roll = null) {
  const list = finishersFor(pick, cfg)
    .filter(f => f && (!f.when || f.when(match, winner, loser)));
  if (!list.length) return null;
  const r = typeof roll === 'number' ? Math.min(0.999999, Math.max(0, roll)) : Math.random();
  return list[(r * list.length) | 0];
}
