// SUKUNA — 両面宿儺, THE KING OF CURSES.
//
// THE SHAPE HE IS MEANT TO HAVE
//   The apex. He is not balanced by being fragile, weak-handed or slow; he is
//   balanced by COMMITMENT AND COST. Read the slash, punish the recovery.
//
// EXPLICITLY, THERE ARE NO STAT PENALTIES:
//   · hp 108 against a roster mean of ~103 — normal to slightly above. Todo
//     (125), Hakari (118) and Nanami (110) are all tougher; he is not fragile.
//   · damageScale 1.0, ceRegen 2.2, ceGainPerPunch 6, stamina 100/22/26 — every
//     one of those is the schema default. Nothing about him is taxed.
//   · walk/run/dash 2.8 / 5.7 / 9.4 — above average, the fastest dash in the
//     roster. He is quick as well as strong.
//   · Punch reach 1.75-1.95 against a roster 1.35-1.7 — by far the best reach
//     in the game, and the claws are FAST.
//
// WHERE THE BALANCE ACTUALLY IS
//   1. COST. Dismantle 26 CE, Cleave 34 CE, Fire Arrow 55 CE. Against a
//      starting bar of 40 and a regen of 2.2/s he can afford ONE technique on
//      the opening exchange and then has to go and earn the next one with his
//      hands. Running dry leaves him with average punches and nothing else.
//   2. RECOVERY. Cleave whiffs into 32 frames of recovery — over half a second
//      of standing there, from a move with 2.6 m of reach that he has to walk
//      into range to use. Fire Arrow's charge is 78 frames of telegraph.
//   3. THE FINGERS ARE FINITE. Four, ever. Each costs a second he cannot act.
//
// PUNCHES ARE NOT A WIN CONDITION. 4/5/8 is exactly the schema default: they
// exist to control space, hold pressure and grow MAX_CE so the techniques can
// be paid for. Everything that kills is in the techniques.
import { withDefaults } from './schema.js';

export const SUKUNA = withDefaults({
  id: 'sukuna', name: 'SUKUNA', title: 'THE KING OF CURSES',

  stats: {
    hp: 108,
    walkSpeed: 2.8, runSpeed: 5.7, dashSpeed: 9.4, jumpVel: 8.9,
    startMaxCE: 40, ceRegen: 2.2, ceGainPerPunch: 6, damageScale: 1.0,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },

  // ---- X · THE CLAW STRING -------------------------------------------------
  // Fast to come out, long, and deliberately AVERAGE damage. The third hit
  // launches, which is what makes the string a spacing tool with a payoff
  // rather than a damage race.
  //
  // RECOVERY IS THE FIX, AND IT WAS FOUND BY PLAYING HIM. The first pass ran
  // 5/6/9 startup with 11/13/19 recovery — faster to start AND faster to
  // finish than the roster default, on top of the longest reach in the game.
  // Measured CPU-vs-CPU: Sukuna spent 975 of 1200 frames in `attack` and Gojo
  // got exactly ONE swing off in twenty seconds. The string was not a spacing
  // tool, it was an inescapable loop, and his punches were the win condition —
  // the precise thing this character is not supposed to do.
  //
  // Startup stays fast (that, and the reach, are his identity). Recovery goes
  // the other way, PAST the roster default, so every string has a real gap in
  // it and the opponent gets their turn back:
  //     total frames   Sukuna 24 / 27 / 39     roster default 21 / 24 / 34
  // He touches you sooner and from further away, and he pays for it at the end
  // of every string.
  punches: [
    { name: 'Rend', dmg: 4, startup: 5, active: 3, recovery: 16, reach: 1.75, kb: 1.7, kbY: 0, hitstun: 14, type: 'light', step: 1.5 },
    { name: 'Cross Rend', dmg: 5, startup: 6, active: 3, recovery: 18, reach: 1.85, kb: 2.3, kbY: 0, hitstun: 16, type: 'light', step: 1.6 },
    { name: 'Rising Rend', dmg: 8, startup: 9, active: 4, recovery: 26, reach: 1.95, kb: 3.6, kbY: 7.8, hitstun: 26, type: 'launcher', step: 1.7 }
  ],

  // Y · four arms coming down at once. Standard heavy damage, long reach.
  heavy: {
    name: 'Rending Sweep', dmg: 14, startup: 16, active: 5, recovery: 30,
    reach: 2.20, kb: 6.0, kbY: 0, hitstun: 30, step: 2.4, staminaCost: 20,
    ceGain: 1.6, clip: 'heavy'
  },

  // ---- RB · CT1 — DISMANTLE 解 --------------------------------------------
  // A crossing slash fired at the opponent. His neutral tool and the thing he
  // controls space with: usable at any range, good damage, moderate startup,
  // real recovery. It cuts anything without regard for what it is — the
  // environment on the line takes the same cut the opponent does.
  ct1: {
    name: 'DISMANTLE', jpName: '解', cost: 26,
    startup: 20, active: 5, recovery: 26,       // 51f
    effect: 'sukuna_dismantle', clip: 'ct1',
    dmg: 16, range: 13.0, width: 1.4, kb: 5.0, kbY: 1.2, hitstun: 26,
    // the environment cut, stepped along the line
    destroySteps: 13, destroyStep: 1.0, destroyRadius: 1.9, destroyPower: 95
  },

  // ---- RT (tap) · CT2 — CLEAVE 捌 -----------------------------------------
  // The same technique aimed differently. Dismantle does not care what it is
  // cutting; CLEAVE ADJUSTS TO THE TARGET'S CURSED ENERGY, so the more meter
  // they have banked the deeper it goes:
  //
  //     damage = base + ceScale x targetMAX_CE
  //            = 12 + 0.32 x MAX_CE
  //
  //   MAX_CE  40 (round start) ->  24.8
  //   MAX_CE  70               ->  34.4
  //   MAX_CE 100 (charged)     ->  44.0   <- the hardest single technique hit
  //                                          in the game, and it costs 34 CE
  //                                          and 32 frames of recovery to try
  //
  // Against a target with NO cursed-energy system at all (Mahoraga: startMaxCE
  // 0, no growth) there is nothing to adjust to, so it neither scales up nor
  // collapses to its floor — it falls back to `flatVsNoCE` and simply cuts.
  // See the note in effects.js.
  ct2: {
    name: 'CLEAVE', jpName: '捌', cost: 34,
    startup: 16, active: 5, recovery: 32,       // 53f — the whiff punish
    effect: 'sukuna_cleave', clip: 'ct2',
    base: 12, ceScale: 0.32, flatVsNoCE: 30,
    reach: 2.60, arc: 1.70, kb: 4.5, kbY: 1.0, hitstun: 30,
    destroyRadius: 2.6, destroyPower: 80
  },

  // ---- RT (hold) · FIRE ARROW 開 ------------------------------------------
  // "You have already lost." A charged, screen-crossing beam of flame that
  // erases terrain as well as people. Gated behind TWO Finger stacks.
  //
  // THE HOLD, AND WHAT IT COSTS: at 0-1 stacks RT is Cleave and nothing else,
  // with no delay. From 2 stacks RT becomes a tap/hold button — the press
  // enters an 8-frame stance, releasing inside it cancels into Cleave, holding
  // past it commits to the charge. So unlocking Fire Arrow makes his Cleave 8
  // frames slower to come out. That is deliberate: the unlock has a price.
  //
  // THE CHARGE IS FREE AND CANCELLABLE. Cursed energy is spent at RELEASE, not
  // at the start, and LT aborts the charge into 22 frames of recovery. That is
  // what makes the telegraph a mind game — he can start charging to move you
  // and eat nothing but the frames when you call it.
  fireArrow: {
    name: 'FIRE ARROW', jpName: '開', cost: 55,
    requiresFingers: 2,
    tapFrames: 8,          // release inside this = Cleave instead
    chargeFrames: 78,      // 1.3 s of telegraph, and it looks like it
    minCharge: 24,         // release earlier than this and it simply fizzles
    startup: 10, active: 6, recovery: 42,
    effect: 'sukuna_firearrow', clip: 'fireArrow', chargeClip: 'fireCharge',
    dmg: 62, width: 2.0, range: 40, kb: 10, kbY: 4.5, hitstun: 46,
    cancelRecovery: 22,
    destroySteps: 34, destroyStep: 1.2, destroyRadius: 2.6
  },

  // ---- LT · BLOCK ----------------------------------------------------------
  // Average guard. Every dial here is the roster default, stated so it is
  // visible that nothing was quietly taken off him or given to him.
  blockChipMult: 1.0,
  blockStaminaMult: 1.0,
  blockStartupFrames: 0,

  // ---- REVERSE CURSED TECHNIQUE (passive) ---------------------------------
  // A slow, constant trickle. 0.65 HP/s is 39 HP a minute: it cannot out-heal
  // anybody's pressure (one Cleave is worth more than a minute of it) but it
  // does mean a passive opponent cannot chip him down over a long round and
  // call that a gameplan. Halted during domain backlash, exactly like his CE
  // regen, and it can never argue with an INSTANT KO — see instantko.js.
  rct: { perSecond: 0.65 },

  // ---- B · SPECIAL — CONSUME A FINGER ----------------------------
  // He eats one of his own fingers and is permanently stronger for the rest of
  // the MATCH. Four of them, ever — spent is spent, and they do not come back
  // between rounds.
  //
  // The cost is the window: 58 frames (~0.97 s) in which he cannot act at all.
  // Getting clipped during it cancels the animation and the finger is NOT
  // consumed — the punish is the lost second, not the lost stack. It has to be
  // taken in a gap, and denying him those gaps is the entire counter-strategy.
  special: {
    key: 'sukuna_finger', name: 'CONSUME FINGER', jp: '宿儺の指',
    cost: 0,               // the finite count and the vulnerable second ARE the cost
    cooldown: 6,           // he cannot chain two in one opening
    channelFrames: 58,
    clip: 'finger'
  },
  fingers: {
    count: 4,
    // Per stack, cumulative and multiplicative. At 4 stacks:
    //   damage x1.41   range x1.36   startup x0.78
    dmgPerStack: 0.09,
    rangePerStack: 0.08,
    startupPerStack: 0.06,
    fireArrowAt: 2
  },

  ultimate: { kind: 'domain' },

  // =========================================================================
  // DOMAIN EXPANSION — MALEVOLENT SHRINE 伏魔御廚子
  // =========================================================================
  // THE ONLY DOMAIN IN THE GAME WITH NO BARRIER AND A FULL SURE-HIT.
  //
  // Every other domain pays for the guarantee. Gojo, Jogo, Mahito, Yuta,
  // Higuruma and Hakari all buy a barrier and trap you inside it. Megumi's
  // Chimera Shadow Garden goes open and pays by giving up sure-hit entirely.
  // Sukuna gets the guarantee WITHOUT the barrier, and that asymmetry is the
  // point of the character — do not "fix" it. What he gives up instead is the
  // one thing a barrier actually buys: you can leave.
  domain: {
    name: 'MALEVOLENT SHRINE', jpName: '伏魔御廚子',
    // REFINEMENT 11 — the highest in the game, above Gojo's 10. Ordering:
    // SUKUNA 11 > Gojo 10 > Mahito 9 > Jogo 8 > Yuta 7 > Hakari 6 >
    // Higuruma 5 > Megumi 3. A clash is decided on DAMAGE TAKEN first and only
    // falls back to refinement on an exact tie, so this is a tie-break win, not
    // an auto-win: Gojo out-fighting him for five seconds still takes it.
    refinement: 11,
    castFrames: 100, duration: 20, env: 'shrine',
    // RE-CASTABLE, like every domain in the game. (This one shipped as
    // once-per-match on request and that restriction was lifted globally
    // afterwards; the whole `oncePerMatch` mechanism is gone from domains.js.)
    // Everything shrine-scoped — radius, origin, the spread ramp, the slash
    // and cut timers — is rebuilt in `_activate`, so a second shrine comes up
    // wherever he casts it with a fresh clock.
    noBarrier: true,
    // ...but UNLIKE the other open domain, this one has a payload, so the
    // counters that answer a payload still apply. Simple Domain works. Barrier
    // Break does not, because there is no barrier — see noBarrierHint.
    openSureHit: true,
    noBarrierHint: 'NO BARRIER TO BREAK — RUN',
    sureHit: { effect: 'malevolent_shrine', interval: 0 },

    shrine: {
      // THE RADIUS. Leaving it is the primary escape, so it must never cover a
      // map. `radius` is the base and each map scales it (`shrineScale` on the
      // map definition), then it is clamped to [minRadius, maxRadius] AND to
      // `mapFraction` of that map's own radius so no future map can ever be
      // swallowed whole by a number nobody re-checked.
      radius: 15.0, minRadius: 9, maxRadius: 22, mapFraction: 0.55,
      openTime: 1.1,          // the shrine rises and the influence spreads

      // THE SURE-HIT. A continuous tick that bypasses hitbox resolution: it
      // cannot be dodged, blocked or mitigated. CLEAVE is what lands on people,
      // so it scales off their MAX_CE exactly like the technique does.
      interval: 0.55,
      base: 3.5, ceScale: 0.05, flatVsNoCE: 6.0,
      //   MAX_CE  40 -> 5.5/tick -> 10.0 dps
      //   MAX_CE 100 -> 8.5/tick -> 15.5 dps
      // Standing in it is death. Clearing a 15 m radius from the middle at run
      // speed is about three seconds, so a player who moves the moment it
      // opens eats five or six ticks — a heavy punish, not a round loss.

      // DISMANTLE is what lands on the arena. The shrine shreds the level for
      // its whole duration, on its own slower cadence.
      cutInterval: 0.22, cutPower: 120, cutRadius: 2.6, cutsPerTick: 3
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // Yuta's Copy off Sukuna takes DISMANTLE — the technique he actually throws
  // in neutral, and the only one of the three that means anything without the
  // Fingers or the shrine behind it. Cleave's whole identity is the MAX_CE
  // read, and handing that to a copy would hand over the character.
  copyEffect: { effect: 'sukuna_dismantle', dmg: 9, name: 'Copied: Dismantle' }
});
