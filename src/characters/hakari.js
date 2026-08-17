// HAKARI — the gambler. Deliberately the most ORDINARY neutral game in the
// roster attached to the single most explosive payoff in it. A durable
// heavyweight brawler: high health, high stamina, average legs, a clean 3-hit
// string, one slow overhead, one fast approach tool, and a shutter door for
// the matchups where he cannot get in. Nothing about the base kit is supposed
// to be exciting — it is the thing he does while he saves up.
//
// Everything points at DOMAIN EXPANSION: IDLE DEATH GAMBLE. Standard cost,
// standard backlash, RE-CASTABLE like every domain in the game — and inside it
// he is not attacking the opponent at all, he is feeding a pachinko machine.
// Every two techniques rolls a reach scenario; three misses arm the fourth as
// a guaranteed hit. Win the roll and JACKPOT makes him unkillable for 99
// seconds. Lose the barrier before the fourth scenario and that parlor is
// gone with nothing to show for it — but he can save up and open another.
import { withDefaults } from './schema.js';

export const HAKARI = withDefaults({
  id: 'hakari', name: 'HAKARI', title: 'GRADE 1 — THE GAMBLER',
  stats: {
    // The durable brawler: second-highest health and stamina in the roster
    // (Todo keeps both crowns), and dead-average movement on every axis. He
    // does not out-run anyone and he does not out-range anyone; he outlasts.
    hp: 118, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 8.6, jumpVel: 8.6,
    startMaxCE: 40, ceRegen: 2.2, ceGainPerPunch: 6, damageScale: 1.04,
    stamina: 128, staminaRegen: 25, dashDrain: 26
  },
  // 3-hit string: solid reach, good damage, the third launches. Clean and
  // reliable — a slightly heavier, slightly slower Yuji string with no gimmick
  // attached, because the gimmick is forty seconds away.
  punches: [
    { dmg: 5, startup: 6, active: 3, recovery: 12, reach: 1.5, kb: 1.8, kbY: 0, hitstun: 14, type: 'light', step: 1.9 },
    { dmg: 6, startup: 7, active: 3, recovery: 14, reach: 1.55, kb: 2.4, kbY: 0, hitstun: 16, type: 'light', step: 1.9 },
    { dmg: 9, startup: 10, active: 4, recovery: 20, reach: 1.6, kb: 3.8, kbY: 7.8, hitstun: 26, type: 'launcher', step: 2.1 }
  ],
  // HEAVY — BOOKIE'S HOOK: a wide looping hook thrown with the whole hip.
  heavy: {
    name: "Bookie's Hook", dmg: 16, startup: 17, active: 5, recovery: 29,
    reach: 1.9, kb: 5.8, hitstun: 30, step: 2.4, staminaCost: 20, armorFrames: 8
  },
  // ABOVE-AVERAGE GUARD: less chip through the block and a cheaper stamina
  // bill per blocked hit than anyone but Mahoraga. Sitting behind LT is a
  // legitimate way for him to run the clock up to a full bar.
  blockChipMult: 0.7,
  blockStaminaMult: 0.72,
  ct1: {
    // PACHINKO VOLLEY — he pulls an invisible lever and the machine PAYS: a
    // stick-steered fan of neon balls bouncing down the lane with loose
    // homing. The LAST ball is gold and knocks down (OTG-capable, so the
    // volley keeps the old overhead's wake-up job). Total damage of a full
    // rack ≈ the old single hit, arriving in coins instead of a bar.
    name: 'Pachinko Volley', jpName: '大当りの玉', cost: 20,
    startup: 24, active: 5, recovery: 30,
    effect: 'hakari_smash', dmg: 17, count: 6, dmg2: 3.2, goldDmg: 6,
    speed: 14, homing: 1.6, lifetime: 1.3,
    kb: 5.0, kbY: 1.4, hitstun: 32, armorFrames: 10, clip: 'ct1'
  },
  ct2: {
    // BALL DROP 大玉 — he pulls the lever and the machine delivers: a
    // person-sized pachinko ball (real geometry) dropped on the deck that
    // then ROLLS twelve metres down a stick-steered lane, ploughing through
    // whoever is in it. Still his approach — he walks in behind it — but the
    // thing doing the hitting is the machine, not his knuckles. `chainPunch`
    // is kept: catching up to his own ball and cancelling into the string is
    // the loop the slot exists for.
    name: 'Ball Drop', jpName: '大玉', cost: 12,
    startup: 11, active: 8, recovery: 18,
    effect: 'hakari_rush', dmg: 9, ballRadius: 0.85, speed: 11, range: 12,
    kb: 4.5, kbY: 1.2, hitstun: 24, chainPunch: true, clip: 'ct2'
  },
  // SPECIAL — SHUTTER (B): a rolling shutter door hauled up in front
  // of him. Projectiles do not get through it at all; the first melee hit
  // that lands on it breaks it. It travels with his facing rather than being
  // pinned to the floor — mechanically it is a directional guard object, and
  // a guard you can walk away from would be a different (worse) move.
  // Sure-hits go straight through: a shutter is not a Simple Domain.
  special: {
    key: 'hakari_shutter', name: 'SHUTTER', cost: 16, cooldown: 9,
    castFrames: 18, stateFrames: 18, duration: 4.0, hits: 1,
    dist: 1.35, width: 2.3, height: 2.4, arc: 1.9, clip: 'shutter'
  },
  ultimate: { kind: 'domain' },
  domain: {
    // IDLE DEATH GAMBLE (私恋 — Private Pure Love Train).
    //
    // DURATION 40s. Four reach scenarios have to fit, because the fourth is a
    // guaranteed Jackpot and a domain that cannot reach it is a broken
    // promise. Worst case: 2 techniques (~3s) before the first scenario, then
    // four scenarios that cannot overlap. All-SUPER is 4 x 6s = 24s of
    // scenario, and the two techniques between each one run underneath rather
    // than after, so the floor is ~27s. 40 leaves a third of the window as
    // slack for hitstun, knockdowns and an opponent who runs.
    name: 'IDLE DEATH GAMBLE', jpName: '私恋', refinement: 6,
    castFrames: 96, duration: 40, env: 'pachinko',
    // RE-CASTABLE, like every domain in the game: he may open the parlor
    // again every time he charges a full bar. The reach-scenario counter, the
    // failure count and the scenario queue are all rebuilt from scratch by
    // GambleSystem.beginDomain on each cast, so a second parlor starts clean.
    // A second JACKPOT refreshes the 99-second clock rather than stacking, and
    // carries the outstanding RCT debt across (domains/jackpot.js _jackpot).
    // The parlor floor is cluttered where the arena was empty: banks of
    // machines stand from about 7.6m out. Anyone caught outside this radius
    // when the barrier closes is pulled in, and movement is clamped to it for
    // as long as the domain stands, so nobody ends up inside a cabinet.
    playRadius: 7.2,
    // SURE-HIT: the rules of the machine are written into the opponent's head
    // and they are locked in the parlor with him. It deals no damage and
    // applies no debuff — what it guarantees is that the gamble RUNS.
    sureHit: { effect: 'idle_death_gamble', interval: 0 },
    gamble: {
      perTechniques: 2,      // every 2 CT uses inside the barrier = one scenario
      casterCERegen: 6.0,    // steady CURRENT_CE on top of base regen, so he can
      //                        actually keep feeding the machine
      guaranteeAfter: 3,     // the 4th scenario after 3 misses is a certainty
      // Tier is rolled and REVEALED at the start of the scenario — the reveal
      // is its own beat. Higher tiers roll less often and pay more. Expected
      // hit rate per scenario is ~24%, so ~43% of domains ride to the
      // guarantee, which is the number the tension meter is tuned around.
      tiers: [
        { key: 'weak', weight: 62, odds: 0.12, dur: 3.0, label: 'REACH', jp: 'リーチ', color: 0x5fd0ff, tone: 523 },
        { key: 'strong', weight: 28, odds: 0.35, dur: 4.5, label: 'STRONG REACH', jp: 'スーパーリーチ', color: 0xff5fc8, tone: 698 },
        { key: 'super', weight: 10, odds: 0.70, dur: 6.0, label: 'SUPER REACH', jp: '超激熱', color: 0xffc93c, tone: 880 }
      ]
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  // ---- JACKPOT --------------------------------------------------------------
  // Runs on its OWN clock and outlives the barrier. Nothing in the domain
  // framework knows about it — see domains/jackpot.js, which the match ticks
  // directly for exactly that reason.
  jackpot: {
    duration: 99,
    poseFrames: 112,        // the hero-shot hold before gameplay resumes
    // REVERSE CURSED TECHNIQUE. Damage LANDS and is visible on the bar, then
    // it is paid back after a beat. Never set invulnerable — the player has
    // to watch the health come back or it reads as a bug.
    rct: { delay: 0.28, rate: 75 },
    hpFloor: 1,             // cannot be KO'd BY DAMAGE. Transfiguration is not damage.
    aura: 0xffc93c,
    // THE COMEDOWN: MAX_CE reset to opening value and no regeneration at all
    // for twelve seconds. growthMult 0 means landing punches cannot rebuild
    // the bar either — he is genuinely empty.
    backlash: { duration: 12, regenMult: 0, growthMult: 0 }
  },
  // A genuinely different kit, not bigger numbers. Slots not listed here fall
  // through to the base kit (the heavy and the block are unchanged).
  jackpotKit: {
    // X — an unrelenting five-hit flurry. Each link is a third of a base
    // punch's commitment; the ender still launches.
    punches: [
      { dmg: 4, startup: 3, active: 2, recovery: 5, reach: 1.5, kb: 0.7, kbY: 0, hitstun: 9, type: 'light', step: 1.5, clip: 'jFlurryL' },
      { dmg: 4, startup: 3, active: 2, recovery: 5, reach: 1.5, kb: 0.7, kbY: 0, hitstun: 9, type: 'light', step: 1.5, clip: 'jFlurryR' },
      { dmg: 4, startup: 3, active: 2, recovery: 5, reach: 1.55, kb: 0.8, kbY: 0, hitstun: 9, type: 'light', step: 1.5, clip: 'jFlurryL' },
      { dmg: 5, startup: 3, active: 2, recovery: 6, reach: 1.55, kb: 1.0, kbY: 0, hitstun: 10, type: 'light', step: 1.6, clip: 'jFlurryR' },
      { dmg: 9, startup: 5, active: 3, recovery: 14, reach: 1.65, kb: 4.0, kbY: 7.4, hitstun: 26, type: 'launcher', step: 1.9, clip: 'jFlurryEnd' }
    ],
    ct1: {
      // A projectile he does not otherwise own: a screen-crossing bar of
      // cursed energy. Adaptation files it under `projectile`, not `ct1`.
      name: 'Jackpot Blast', cost: 0, startup: 16, active: 6, recovery: 26,
      effect: 'hakari_blast', dmg: 30, range: 17, width: 2.0,
      kb: 8, kbY: 3, hitstun: 36, clip: 'jBlast'
    },
    ct2: {
      // RCT COUNTER STANCE: he stands there and invites it. Absorbing a hit
      // heals him and fires the punish; whiffing the read is just recovery.
      name: 'RCT Counter', cost: 0, startup: 6, active: 26, recovery: 20,
      effect: 'hakari_counter', window: 26, heal: 18,
      punishDmg: 34, reach: 2.3, arc: 2.2, kb: 7, kbY: 2, hitstun: 40, clip: 'jCounter'
    },
    special: {
      key: 'hakari_goldrush', name: 'GOLD RUSH', cost: 0, cooldown: 0,
      stateFrames: 26, clip: 'jRush',
      dmg: 24, lungeSpeed: 26, frames: 26, radius: 1.9,
      kb: 9, kbY: 2, hitstun: 40, slamPower: 160
    }
  },
  simpleDomainDrain: 18,
  barrierBreak: { ceDrain: 30, chip: 24 },
  // Yuta stores the technique, never the gamble: Rush Blow is the only thing
  // about Hakari that is a technique in the ordinary sense.
  copyEffect: { effect: 'hakari_rush', dmg: 7, name: 'Copied: Ball Drop' }
});
