// ===========================================================================
// TOJI FUSHIGURO — THE ANOMALY
// ===========================================================================
// A human being with ZERO cursed energy who is simply better at killing than
// everyone else in the game. He does not participate in the resource economy
// the rest of the roster is built on: no MAX_CE, no CURRENT_CE, no domain, no
// ultimate gate, no meter of any kind.
//
// ---------------------------------------------------------------------------
// HEAVENLY RESTRICTION 天与呪縛 — declared, not implied
// ---------------------------------------------------------------------------
// `noCursedEnergy: true` is the single flag every system keys off. It is a
// POSITIVE declaration rather than "startMaxCE happens to be 0", because the
// game already has a character whose bar sits at zero for a different reason
// (Mahoraga, who has no cursed-energy SYSTEM but is a shikigami), and the two
// need to be told apart. What the flag turns on, per site:
//
//   fighter.spendCE     always succeeds — his kit costs nothing, ever
//   fighter.charged     always false — he can never reach the ultimate gate
//   fighter.ultReady    always false — see `assassination` below for his D-pad
//                       Right instead
//   fighter.update      CE regen is skipped entirely rather than clamped
//   hud                 the CE bar and the MAX CE badge are REMOVED from his
//                       plate, not shown empty, and the arsenal row takes the
//                       space
//   domains.castDomain  refused (he has no `domain` anyway)
//   ai                  never evaluates a domain or a charge plan for him
//
// The stat line below is the exchange. He is the fastest, the hardest-hitting
// physically, and has by far the deepest stamina pool — and his power curve is
// FLAT. He is at full strength on frame one of the round and never gets
// stronger, while everybody else scales up into him.
//
// ---------------------------------------------------------------------------
// THE BALANCE FRAME
// ---------------------------------------------------------------------------
// Strongest character in the first thirty seconds; weakest in the last thirty
// against anyone holding a full bar. If he is overtuned the dials are weapon
// damage, `arsenal.swapFrames` and `assassination.cooldown` — NOT a resource,
// because giving him one would delete the character.
import { withDefaults } from './schema.js';

export const TOJI = withDefaults({
  id: 'toji', name: 'TOJI', title: 'THE SORCERER KILLER',

  // THE FLAG. Everything above keys off this one boolean.
  noCursedEnergy: true,

  stats: {
    // ABOVE-AVERAGE HEALTH: over the sorcerers, under the heavyweights.
    // (Yuta 92 · Gojo 95 · Yuji 105 · Nanami 108 · TOJI 112 · Sukuna 118 ·
    //  Todo 125 · Hakari 128)
    hp: 112,
    // FASTEST IN THE ROSTER, on all three. Next best dash is Mahito's 9.4.
    walkSpeed: 3.1, runSpeed: 6.3, dashSpeed: 10.4, jumpVel: 9.4,
    // He has no cursed energy, so these three are ZERO and stay zero. They are
    // stated explicitly rather than left to the schema defaults so that reading
    // this config tells you the truth about him.
    startMaxCE: 0, ceRegen: 0, ceGainPerPunch: 0,
    // LARGEST POOL, FASTEST REGEN, CHEAPEST DASH — he can dash and block far
    // more than anyone else, and that is his defence.
    stamina: 160, staminaRegen: 34, dashDrain: 19,
    // HIGHEST RAW PHYSICAL DAMAGE on the roster.
    damageScale: 1.18
  },

  // ---- THE UNARMED STRING --------------------------------------------------
  // The best pure normals in the game, and the only string on the roster that
  // is a genuine win condition on its own. Fast, long, and the third hit
  // launches. He does not need a weapon and the numbers say so.
  punches: [
    { name: 'Jab', dmg: 7, startup: 5, active: 3, recovery: 10, reach: 1.55, kb: 1.8, kbY: 0, hitstun: 15, type: 'light', step: 1.9 },
    { name: 'Cross', dmg: 9, startup: 6, active: 3, recovery: 12, reach: 1.60, kb: 2.4, kbY: 0, hitstun: 17, type: 'light', step: 1.9 },
    { name: 'Rising Elbow', dmg: 14, startup: 9, active: 4, recovery: 19, reach: 1.65, kb: 3.8, kbY: 8.0, hitstun: 27, type: 'launcher', step: 2.1 }
  ],

  // HEAVY — an overhand right. Cheap in stamina because stamina is his.
  heavy: {
    name: 'Overhand', dmg: 17, startup: 15, active: 5, recovery: 27,
    reach: 1.90, kb: 5.8, hitstun: 31, step: 2.6, staminaCost: 16, clip: 'heavy'
  },

  // ---- GUARD AND DASH ------------------------------------------------------
  // An excellent guard with low drain, and the longest dash in the game with a
  // real i-frame window at the FRONT of it. He does not tank hits; he isn't
  // there. `dashIFrames` is read by the shared locomotion path.
  blockStaminaMult: 0.55,
  blockChipMult: 0.70,
  dashIFrames: 7,

  // =========================================================================
  // THE INVENTORY CURSE 格納型呪霊 — the arsenal, in place of a resource bar
  // =========================================================================
  // Each weapon COMPLETELY replaces ct1 and ct2. The punch string is constant
  // across all four; the weapons are the moveset. There is no ammo and no cost
  // — the limitation is that he holds exactly one at a time and swapping costs
  // real, punishable time.
  //
  // `slot` is the wheel position, `short`/`jp` are what the radial shows, and
  // `clipSuffix` selects the animation set (idle<Suffix> / ct1<Suffix> /
  // ct2<Suffix> / draw<Suffix>) — see art/anim/toji.js for that contract.
  arsenal: {
    default: 'playful_cloud',
    // THE SWAP. 26 frames of animation he cannot act out of, of which the
    // first 4 are still cancellable into a block — that grace is what keeps a
    // mistimed wheel from being a guaranteed full combo, without making the
    // swap safe. Time slows to 0.55 while the wheel is HELD (gameplay does not
    // pause), and releasing confirms.
    swapFrames: 26,
    swapGuardCancel: 4,
    timeScale: 0.55,
    maxHold: 3.0,
    cooldown: 0.9,
    order: ['playful_cloud', 'inverted_spear', 'split_soul', 'chain'],
    weapons: {
      // ---------------------------------------------------------------------
      // PLAYFUL CLOUD 游雲 — the default and the most well-rounded option.
      // Heavy blunt damage, wide arcs, excellent at controlling space and at
      // breaking guard.
      // ---------------------------------------------------------------------
      playful_cloud: {
        name: 'PLAYFUL CLOUD', short: 'CLOUD', jp: '游雲', clipSuffix: 'Cloud',
        desc: 'BLUNT · SPACE CONTROL · GUARD BREAK',
        ct1: {
          name: 'Spinning Sweep', cost: 0, startup: 11, active: 22, recovery: 22,
          effect: 'toji_cloud_sweep', dmg: 6, hits: 4, radius: 2.9,
          kb: 2.6, kbY: 0.4, hitstun: 15, clip: 'ct1Cloud'
        },
        ct2: {
          name: 'Overhead Slam', cost: 0, startup: 19, active: 6, recovery: 30,
          effect: 'toji_cloud_slam', dmg: 21, reach: 2.5, arc: 1.5,
          kb: 6.2, kbY: 0, hitstun: 34, guardBreak: true, step: 2.2, clip: 'ct2Cloud'
        }
      },
      // ---------------------------------------------------------------------
      // INVERTED SPEAR OF HEAVEN 天逆鉾 — the anti-sorcerer weapon, and the
      // reason this character exists in this roster.
      // ---------------------------------------------------------------------
      inverted_spear: {
        name: 'INVERTED SPEAR', short: 'SPEAR', jp: '天逆鉾', clipSuffix: 'Spear',
        desc: 'PIERCE · NULLIFIES CURSED TECHNIQUES',
        ct1: {
          name: 'Piercing Thrust', cost: 0, startup: 8, active: 4, recovery: 18,
          effect: 'toji_spear_thrust', dmg: 12, reach: 3.4, arc: 0.7,
          kb: 3.0, kbY: 0, hitstun: 20, step: 2.4, clip: 'ct1Spear'
        },
        // ---- NULLIFY 強制解除 ------------------------------------------
        // Priced as a HARD READ, not a spammable domain-off button:
        //   · 24 frames of startup — the slowest technique he owns
        //   · reach 1.7, the SHORTEST hitbox in his entire kit (his own jab
        //     reaches 1.55, so he has to be genuinely on top of them)
        //   · 38 frames of recovery on whiff — a full punish
        //   · 9 seconds of cooldown after a SUCCESSFUL cancel, tracked
        //     separately from the whiff, so failing costs frames and
        //     succeeding costs the tool
        // See combat/effects.js `toji_nullify` for what it actually does, and
        // domains.js `nullify()` for the domain half.
        ct2: {
          name: 'NULLIFY', cost: 0, startup: 24, active: 4, recovery: 38,
          effect: 'toji_nullify', dmg: 10, reach: 1.7, arc: 0.9,
          kb: 2.2, kbY: 0, hitstun: 26, step: 1.5, clip: 'ct2Spear',
          lockDuration: 5,        // seconds ct1/ct2 are sealed on the target
          cooldownOnCancel: 9,    // seconds before NULLIFY can be thrown again
          cooldownOnHit: 4        // it landed but there was nothing to cancel
        }
      },
      // ---------------------------------------------------------------------
      // SPLIT SOUL KATANA 釈魂刀 — cuts the soul rather than the body.
      // ---------------------------------------------------------------------
      split_soul: {
        name: 'SPLIT SOUL KATANA', short: 'KATANA', jp: '釈魂刀', clipSuffix: 'Soul',
        desc: 'SOUL CUT · IGNORES GUARD · DAMAGE DEBUFF',
        ct1: {
          name: 'Slashing String', cost: 0, startup: 7, active: 14, recovery: 20,
          effect: 'toji_soul_slash', dmg: 7, hits: 2, reach: 2.6, arc: 1.9,
          kb: 2.0, kbY: 0, hitstun: 16, clip: 'ct1Soul'
        },
        // Ignores blocking ENTIRELY (unblockable) and leaves a lingering
        // damage-output debuff. Chip-through pressure: the damage number is
        // deliberately modest because going through a guard is the reward.
        ct2: {
          name: 'Soul Cut', cost: 0, startup: 16, active: 5, recovery: 28,
          effect: 'toji_soul_cut', dmg: 13, reach: 2.7, arc: 1.6,
          kb: 2.4, kbY: 0, hitstun: 24, unblockable: true, clip: 'ct2Soul',
          debuff: { duration: 7, dmgMult: 0.74 }
        }
      },
      // ---------------------------------------------------------------------
      // CHAIN OF A THOUSAND MILES 万里ノ鎖 — reach and control. His approach
      // tool against zoners.
      // ---------------------------------------------------------------------
      chain: {
        name: 'CHAIN OF A THOUSAND MILES', short: 'CHAIN', jp: '万里ノ鎖', clipSuffix: 'Chain',
        desc: 'RANGE · GRAPPLE · CLOSES ON ZONERS',
        ct1: {
          name: 'Whip Strike', cost: 0, startup: 11, active: 6, recovery: 24,
          effect: 'toji_chain_whip', dmg: 11, reach: 7.0, arc: 0.55,
          kb: 3.4, kbY: 0, hitstun: 20, clip: 'ct1Chain'
        },
        // On hit it decides which way to close by DISTANCE: past `pullFrom` it
        // hauls him to them (the approach), inside it, it hauls them to him
        // (the reset). One button, two answers, and which one you get is a
        // consequence of where you were standing.
        ct2: {
          name: 'Snare', cost: 0, startup: 14, active: 6, recovery: 30,
          effect: 'toji_chain_snare', dmg: 8, reach: 8.5, arc: 0.5,
          kb: 0, kbY: 0, hitstun: 30, clip: 'ct2Chain',
          pullFrom: 5.5, endGap: 1.5
        }
      }
    }
  },

  // =========================================================================
  // D-PAD LEFT — OPEN THE INVENTORY CURSE
  // =========================================================================
  // The radial weapon selector. Not a technique: it has no cost because he has
  // nothing to spend, and its cooldown exists only to stop wheel-mashing.
  special: {
    key: 'toji_arsenal', name: 'INVENTORY CURSE', jp: '格納型呪霊',
    cost: 0, cooldown: 0.9, clip: 'arsenal'
  },

  // =========================================================================
  // D-PAD RIGHT — ASSASSINATION
  // =========================================================================
  // He has no cursed energy, so he has no ultimate GATE. Instead: a committed
  // forward blitz on a long cooldown, available from the first frame of the
  // round. If it connects it chains into a rapid sequence drawing every weapon
  // in the arsenal in turn.
  //
  // This makes him the only character in the game who is dangerous at 0
  // seconds, which is the exact counterweight to having no scaling. It is also
  // why the cooldown is long: it is not a combo starter, it is the thing you
  // have to respect for the whole round.
  //
  // `kind: 'cooldown'` is a NEW ultimate kind. Nothing else on the roster
  // declares it, so the two existing kinds ('domain', 'burst', 'transform')
  // are untouched.
  ultimate: {
    kind: 'cooldown', name: 'ASSASSINATION', jpName: '術師殺し',
    cooldown: 26,          // seconds; starts the round READY
    startup: 8,            // the blitz leaves almost instantly — no tell
    blitzFrames: 14,       // how long the charge window stays live
    blitzSpeed: 21,
    reach: 2.0, arc: 1.2,
    // the sequence, on connect: one strike per weapon, in this order
    effect: 'toji_assassinate',
    sequence: [
      { weapon: 'playful_cloud', dmg: 13, at: 0.16 },
      { weapon: 'split_soul', dmg: 15, at: 0.34, unblockable: true },
      { weapon: 'chain', dmg: 12, at: 0.52 },
      { weapon: 'inverted_spear', dmg: 22, at: 0.72, nullify: true }
    ],
    hitFrames: 78,         // length of the sequence state on a connect
    whiffRecovery: 30,     // what a missed blitz costs
    clip: 'assassinate'
  },

  // NO DOMAIN, and no ultimate gate to reach one with. Both stated explicitly.
  domain: null,
  noUltimate: false,   // he HAS a D-pad Right — it just is not a meter ultimate

  // ---- interactions with the rest of the roster ---------------------------
  // Simple Domain still works: it is a physical technique circle, and the
  // manual says nothing about needing cursed energy to hold one... except that
  // it plainly does. He CANNOT use it — see fighter/domains — and the drain
  // value below is inert, kept only so the schema shape is uniform.
  simpleDomainDrain: 0,
  // ...and he cannot channel a Barrier Break either, for the same reason: the
  // channel drains cursed energy he does not have. `null` is the refusal.
  barrierBreak: null,

  // WHAT YUTA'S COPY GETS FROM HIM. See the integration notes: a cursed
  // technique is not what he has, so Copy stores the WEAPON rather than a
  // technique — the closest honest answer, and the one that keeps the slot
  // from being dead.
  copyEffect: { effect: 'toji_spear_thrust', dmg: 9, name: 'Copied: Cursed Tool' }
});
