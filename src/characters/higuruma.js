// HIGURUMA HIROMI — the setup character. The weakest fighter in the game until
// his domain lands and one of the most lethal after it.
//
// Nothing in the base kit below is meant to threaten anyone. Below-average
// health, below-average damage, a clumsy briefcase string thrown by a man who
// has never been in a fight, one real damage tool and one tool that exists
// purely to take the opponent's best button away from them for a few seconds.
// What he has instead is the fastest MAX_CE growth on the roster (11 per landed
// punch against the standard 6) and a shikigami that files evidence while he
// survives — the whole character is the walk toward DOMAIN EXPANSION: DEADLY
// SENTENCING, and everything he does before it is stalling with intent.
//
// The domain grants the Executioner's Sword and nothing else. It does not
// damage, debuff, trap or judge the opponent — see domains/sentencing.js. It
// is one gamble, and the opponent gets to fight back inside it.
import { withDefaults } from './schema.js';

export const HIGURUMA = withDefaults({
  id: 'higuruma', name: 'HIGURUMA', title: 'THE ATTORNEY — DEADLY SENTENCING',
  stats: {
    // LOWEST HEALTH IN THE ROSTER (88 against the 100 baseline, Todo's 130 and
    // Hakari's 118) and the lowest damage scale. Movement is dead average on
    // every axis: he is not slow, he just cannot hurt you.
    hp: 88, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 8.6, jumpVel: 8.8,
    startMaxCE: 40, ceRegen: 2.4, damageScale: 0.86,
    // THE ENGINE. 11 per landed punch against the roster's 6 — his bar fills
    // nearly twice as fast as anyone else's, because reaching the domain is
    // the only thing he is actually good at and the game has to let a patient
    // player get there.
    //
    // TUNED UP FROM 9 AFTER PLAYTESTING. At 9, bot-vs-bot against Yuji he lost
    // 3-0 having never once reached 100 MAX_CE — he cannot land punches while
    // he is being run down, and a character whose domain never opens is not a
    // gamble, he is just bad. This and the evidence gate below are the two
    // dials the design hands this character; neither touches his health, his
    // damage or his guard, all of which stay where the brief put them.
    ceGainPerPunch: 11,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },
  // BRIEFCASE STRING. Short, slow, weak, and it reads as flailing: two
  // graceless swipes with the case and a two-handed downward swing that puts
  // them on the floor rather than in the air. The knockdown ender is
  // deliberate — a launcher would hand him a juggle, and he does not get one.
  // He gets a beat of breathing room, which is what he actually wants.
  punches: [
    { dmg: 3, startup: 8, active: 3, recovery: 15, reach: 1.25, kb: 1.4, kbY: 0, hitstun: 13, type: 'light', step: 1.3 },
    { dmg: 4, startup: 9, active: 3, recovery: 17, reach: 1.30, kb: 1.8, kbY: 0, hitstun: 15, type: 'light', step: 1.3 },
    { dmg: 7, startup: 13, active: 4, recovery: 24, reach: 1.35, kb: 4.2, kbY: 0, hitstun: 28, type: 'knockdown', step: 1.5 }
  ],
  // HEAVY — CASE SWING: the briefcase thrown with both hands and the whole
  // body behind it, because he has no technique for this. Slower and weaker
  // than anyone else's heavy and it costs the same stamina.
  heavy: {
    name: 'Case Swing', dmg: 12, startup: 20, active: 5, recovery: 32,
    reach: 1.75, kb: 5.0, hitstun: 30, step: 2.0, staminaCost: 20, clip: 'heavy'
  },
  ct1: {
    // GAVEL STRIKE — a cursed-energy gavel raised overhead and brought down.
    // Slow enough to see coming, decent damage, a small shockwave on impact.
    // His only real damage tool, and the only reason to respect him at all.
    name: 'Gavel Strike', cost: 20, startup: 26, active: 5, recovery: 32,
    effect: 'higuruma_gavel', dmg: 15, reach: 2.0, arc: 1.5, radius: 2.4,
    kb: 4.2, kbY: 1.2, hitstun: 30, clip: 'ct1'
  },
  ct2: {
    // CONFISCATION — short range, NO DAMAGE. On hit it seizes one of the
    // opponent's technique buttons and they cannot use it for `lock.duration`
    // seconds. Which button is not random: it takes whichever slot they have
    // been leaning on hardest since the last confiscation (see
    // fighter.slotUse), so it genuinely disarms the thing that is killing him.
    // This is his survival tool and his only real decision in neutral.
    name: 'Confiscation', cost: 14, startup: 14, active: 4, recovery: 26,
    effect: 'higuruma_confiscate', dmg: 0, reach: 1.7, arc: 1.2,
    kb: 1.2, kbY: 0, hitstun: 20,
    lock: { duration: 6, evidence: 6 }, clip: 'ct2'
  },
  // SPECIAL — SUMMON JUDGEMAN (B). A small blind shikigami that
  // follows him and files EVIDENCE on the opponent. It is fragile, it can be
  // destroyed, and while it is gone the evidence stops. See combat/judgeman.js.
  special: {
    key: 'higuruma_judgeman', name: 'JUDGEMAN', cost: 18, cooldown: 10,
    castFrames: 30, clip: 'summon',
    judgeman: {
      hp: 22,                // two clean hits from anybody
      follow: 2.6,           // metres behind Higuruma it tries to hold
      speed: 4.4,
      // EVIDENCE. Passive while it lives, and much faster while Higuruma is
      // the one being hit — the technique reads the case, and the case is
      // being made against the person beating him up.
      gatherRate: 3.2,       // per second, Judgeman alive
      onHitTaken: 2.5,       // per clean hit Higuruma eats
      onBlockedTaken: 1.0,   // per hit he blocks
      max: 100
    }
  },
  // EVIDENCE — what the whole pre-domain game is for. Two payoffs:
  //  1) it lowers the domain's cast gate (fighter.castThresholdOverride), so
  //     a patient player opens the courtroom noticeably earlier;
  //  2) it shortens the execution sequence inside the duel, which is the
  //     difference between a coin flip and a favourite.
  evidence: {
    // 100 evidence pulls the gate from the standard full bar down to 70% of
    // it. At zero evidence he pays the standard gate EXACTLY — 100 MAX_CE and
    // a full bar, the same price everyone else pays — which is what the domain
    // spec asks for; the discount is entirely earned.
    //
    // TUNED FROM 0.84 for the same reason as the CE gain above: at 0.84 a
    // maxed-out case still asked for 84 MAX_CE, which he was not surviving to
    // reach. At 0.70 a player who keeps Judgeman alive and eats a beating for
    // thirty seconds opens the courtroom, and one who does neither does not.
    gateAtFull: 0.70,
    decay: 0,                // it does not rot: a case does not un-make itself
    // LOSING THE EXECUTION DUEL costs him half the case. Domains are
    // re-castable now, so without this a lost duel would be almost free: the
    // courtroom closes, his evidence is untouched, and the discounted gate has
    // him back inside within one bar. Halving it means a failed execution
    // genuinely sets him back — but only halfway, so the second trial still
    // arrives sooner than the first did. Nothing else clears evidence except
    // the end of a round.
    lostDuelKeep: 0.5
  },
  ultimate: { kind: 'domain' },
  domain: {
    // DOMAIN EXPANSION — DEADLY SENTENCING 死刑判決.
    //
    // DURATION 20s: the project's standard. Research on the Jujutsu
    // Shenanigans version turned up its Executioner's Sword state (a ~1 minute
    // awakened form reached THROUGH the domain) but nothing reliable on the
    // barrier's own uptime, so the house number stands rather than a guess
    // dressed up as a source.
    //
    // REFINEMENT 5. A complete barrier with a real sure-hit, so it sits far
    // above Megumi's incomplete Garden (3) — but below Hakari (6), Yuta (7),
    // Jogo (8), Mahito (9) and Gojo (10), because it was built in months by a
    // man with no training and because it does not win on its own quality: it
    // hands him one attempt and then asks him to earn it. On an exact clash
    // tie, a domain whose entire payload is a contest should not out-rank the
    // ones that simply work.
    name: 'DEADLY SENTENCING', jpName: '死刑判決', refinement: 5,
    castFrames: 96, duration: 20, env: 'courtroom',
    // RE-CASTABLE: he may open the courtroom again every time he charges a
    // full bar, and all three endings apply per cast. Losing the execution
    // duel ends THAT courtroom and costs him half his accumulated evidence
    // (`evidence.lostDuelKeep`) — the case he had built is not free to rebuild
    // — but the rest carries, so a second trial comes sooner than the first.
    // The sure-hit is the SWORD, not an effect on the opponent. Nothing at all
    // is applied to them on cast — see domains/sentencing.js.
    sureHit: { effect: 'deadly_sentencing', interval: 0 },
    sentencing: {
      // ---- THE TRIAL ------------------------------------------------------
      // The courtroom does NOT hand him the sword for casting. Both parties
      // enter a plea on X (CONFESS) / Y (SILENCE) / B (DENIAL) and Higuruma
      // must call which one the defendant will choose. A correct read resets
      // the domain's timer and barrier integrity to full — read them forever
      // and the court never closes. THREE reads win the Executioner's Sword;
      // reading a CONFESS wins it outright on the spot.
      trial: {
        needed: 3,             // correct reads for the blade
        chooseTime: 2.4,       // seconds to lock a plea before one is entered for you
        revealTime: 1.4,       // the hold on the reveal
        gap: 0.45,             // beat between rounds
        // a bot locks its plea somewhere in this window rather than always
        // sitting on the timeout, so the reveal has some rhythm to it
        cpuThinkMin: 0.7, cpuThinkMax: 1.9
      },
      // ---- THE SWORD OUTSIDE THE COURTROOM --------------------------------
      // Winning the blade BREAKS the barrier and he keeps it in the open arena
      // on this clock. NOT stated by the spec, which only says he keeps it —
      // a duration is assumed so it cannot last the whole match.
      carry: { duration: 30 },
      // ---- THE EXECUTIONER'S SWORD ---------------------------------------
      // Two moves. Nothing else. X and Y are dead while he holds it.
      swordCarrySpeedMult: 1.06,   // barely — the blade is enormous
      materializeFrames: 26,       // the draw, played once on activation
      slash: {
        // RB — JUDGMENT SLASH. A wide sweeping cut: long reach, high damage,
        // launches, and fast enough to throw in neutral. This is the opener —
        // it is how he gets them off the floor and into a position where the
        // thrust can land. It does not resolve the domain.
        // KNOCKBACK IS LOW ON PURPOSE (1.8, against the 5.5 a hit this size
        // would normally carry). Playtesting round one: at 5.5 the slash sent
        // them across the room, he could not close before they recovered, and
        // the CPU went a whole 20-second domain without ever getting the
        // thrust off. The move is a SETUP — it has to pop them straight up in
        // front of him and drop them back inside Execution's reach, or the two
        // moves do not combine and the domain is decorative.
        name: 'Judgment Slash', startup: 12, active: 5, recovery: 22,
        effect: 'higuruma_judgment_slash', dmg: 26, reach: 3.2, arc: 2.2,
        kb: 1.8, kbY: 7.4, hitstun: 30, type: 'launcher', step: 2.6, clip: 'swordSlash'
      },
      execution: {
        // RT — EXECUTION. A committed overhead thrust with real startup: half
        // a second of visible wind-up, and 40 frames of recovery if it misses.
        // Reactable on purpose. LANDING it starts the duel; whiffing it costs
        // him nothing but time, and time is the domain.
        name: 'Execution', startup: 30, active: 6, recovery: 40,
        effect: 'higuruma_execution', reach: 2.6, arc: 1.1, step: 3.4,
        clip: 'swordExec'
      },
      // ---- THE DUEL -------------------------------------------------------
      // Both players play. Higuruma inputs a randomised face-button sequence;
      // the opponent mashes to drain his clock. See domains/sentencing.js for
      // the arithmetic these numbers produce.
      duel: {
        seqMax: 6,             // prompts at ZERO evidence
        seqMin: 3,             // prompts at FULL evidence
        timer: 4.0,            // seconds on the clock
        wrongPenalty: 0.5,     // seconds burned by a wrong press (not a loss)
        mashDrain: 0.085,      // seconds removed per opponent press
        mashCapPerSec: 12,     // turbo controllers do not get to win it outright
        freezeIn: 0.55,        // the hold before the prompts appear
        // CPU: correct input every `cpuInterval` seconds with a `cpuMiss`
        // chance of fumbling, and it mashes at `cpuMash` presses/second when
        // it is the one on the block.
        cpuInterval: 0.34, cpuMiss: 0.12, cpuMash: 6.5
      },
      // ---- ENDING 1: the sentence is carried out ---------------------------
      cinematic: { raise: 0.9, fall: 0.28, black: 0.5, gavel: 1.1 },
      // ---- ENDING 2: he loses the duel -------------------------------------
      // Modest damage, heavy knockback, and the domain is over. He gets no
      // second attempt: he has spent his entire ultimate on a shove.
      escape: {
        dmg: 8, kb: 13, kbY: 5.5, hitstun: 34,
        // FLIP THIS to send HIGURUMA flying instead of the opponent. Written
        // as specified (the opponent is kicked away); the flag is here so the
        // other reading is one word away.
        kickPushesCaster: false
      },
      backlashOnEscape: true   // ending 2 pays the full standard backlash
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  // YUTA'S COPY. Not the gavel — Confiscation is the only thing about Higuruma
  // that is worth stealing, and a Yuta who can take your best button away for
  // six seconds is a genuinely different Yuta.
  copyEffect: { effect: 'higuruma_confiscate', dmg: 0, name: 'Copied: Confiscation' }
});
