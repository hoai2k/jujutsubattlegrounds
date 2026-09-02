// YUJI — variants.
//
// ===========================================================================
// NAME CHECK — BOTH OF THE NAMES IN THE BRIEF NEEDED CORRECTING
// ===========================================================================
//
// "MODULO YUJI" — REAL, and better than expected. *Jujutsu Kaisen: Modulo* is
// a spin-off SEQUEL manga (written by Gege Akutami, drawn by Yuji Iwasaki) set
// 68 years after the original. Yuji is pushing eighty and is confirmed in
// volume 3 as a Special Grade and the strongest sorcerer of the era after
// Gojo's death. He barely ages, because eating Cursed Wombs 4-9 (the Death
// Paintings) left him half human and half cursed spirit. So this is not a
// costume — it is a different, older, part-curse Yuji, and it earns a gameplay
// variant.
//
// "SHRINE YUJI" — WRONG on both halves, and worth saying plainly.
//   · Yuji's Domain Expansion is real (chapter 264) but it is UNNAMED. The
//     manga never gives it a name and never explains it.
//   · It is NOT a shrine and shares no DNA with Malevolent Shrine. It manifests
//     as a TRAIN STATION and walks Sukuna through Yuji's own memories — the
//     places he went as a child, with small details attached. Sukuna calls it
//     superficial; casting it drained almost all of Yuji's cursed energy, and
//     it was an underdeveloped trump card built specifically for that fight.
// So the variant below is built from what is actually on the page: an unnamed
// memory domain that costs him everything and wins by holding somebody still
// rather than by cutting them. It differentiates itself from Sukuna's shrine
// automatically, because it is not remotely the same idea.
// SHINJUKU SHOWDOWN YUJI carries a DELIBERATE CANON DEPARTURE, requested and
// confirmed. His actual Domain Expansion (chapter 264) is unnamed and manifests
// as a train station full of his own memories. The one below is MALEVOLENT
// SHRINE instead, with the automatic slashes replaced by BLACK FLASHES. Said
// once here so nobody reads it later as a research failure — it is a design
// choice, and it pairs him with the Shinjuku Gojo variant across the same fight.

export const YUJI_VARIANTS = [
  {
    id: 'base', type: 'cosmetic',
    name: 'YUJI', descriptor: 'First-year. No technique, no domain, all fists.', jp: '虎杖悠仁'
  },
  {
    // ---- GAMEPLAY — SHINJUKU SHOWDOWN -----------------------------------
    // The version who fights Sukuna at the end, and the counterpart to the
    // Shinjuku Gojo variant. Everything about him is BLACK FLASH: he opens the
    // window more easily, chains harder, and his ultimate stops being Sukuna's
    // Manifestation and becomes a DOMAIN whose sure-hit is the Flash itself.
    //
    // What he gives up against base Yuji:
    //   · Sukuna's Manifestation is GONE. Base Yuji's ultimate is a costed
    //     transform that buffs everything for eight seconds and is available
    //     off the same bar; this one spends the whole bar on a domain that
    //     lasts fourteen and then leaves him in backlash with nothing.
    //   · He is worn down: 96 hp against the base's 105.
    //   · Divergent Fist costs more, so the opener he needs to start a Flash
    //     chain is genuinely rationed.
    id: 'shinjuku', type: 'gameplay',
    name: 'YUJI 【SHINJUKU】',
    descriptor: 'The Shinjuku Showdown. Black Flash after Black Flash — and a shrine of his own.',
    jp: '新宿決戦', accent: 0xff2038,
    role: 'BLACK FLASH · MALEVOLENT SHRINE',
    look: 'yuji_shinjuku',
    clipId: 'yuji',
    cpu: 'yuji_shinjuku',
    overrides: {
      title: 'SEVEN IN A ROW',
      stats: {
        hp: 96, walkSpeed: 2.7, runSpeed: 5.6, dashSpeed: 9.1, jumpVel: 8.9,
        startMaxCE: 44, ceRegen: 2.4, ceGainPerPunch: 7, damageScale: 1.04
      },
      // the window is wider and the chain bonus steeper — this is the version
      // that lands seven of them in a row
      blackFlash: { delay: 5, window: 8, dmgMult: 2.7, ceRefund: 30, maxSpike: 10, chainDmg: 0.09, reach: 2.5 },
      special: { key: 'yuji_blackflash', name: 'BLACK FLASH', cost: 0, cooldown: 2.6 },
      ct2: { cost: 20 },       // the Flash opener is rationed
      ultimate: { kind: 'domain' },

      // =====================================================================
      // DOMAIN EXPANSION — MALEVOLENT SHRINE 伏魔御廚子 (Black Flash payload)
      // =====================================================================
      // Same architecture as Sukuna's: NO BARRIER, full sure-hit, escapable by
      // running, Simple Domain and Falling Blossom both answer it, Barrier
      // Break does not. Everything that made his shrine work works here,
      // because it is literally the same code path.
      //
      // WHAT MAKES IT HIS RATHER THAN A RESKIN:
      //   · the strike is a BLACK FLASH, not a Cleave — flat damage, no MAX_CE
      //     scaling, because Yuji has no cursed technique to adjust with
      //   · it lands HALF AS OFTEN for similar damage per second, so it is a
      //     rhythm of hammer blows instead of a shredding
      //   · every tick builds his own Black Flash chain, so the domain feeds
      //     the rest of his kit
      //   · it does not CUT the arena, it CRACKS it: a quarter of Sukuna's
      //     destruction power, because a fist is not a blade
      //   · smaller (11 m base vs 15), shorter (14 s vs 20) and far less
      //     refined (6 vs 11) — Sukuna calls Yuji's domain superficial, and
      //     this one loses the clash to his every time on a tie
      domain: {
        name: 'MALEVOLENT SHRINE', jpName: '伏魔御廚子 · 黒閃',
        refinement: 6,
        castFrames: 100, duration: 14, env: 'shrine',
        noBarrier: true,
        openSureHit: true,
        noBarrierHint: 'NO BARRIER TO BREAK — RUN',
        sureHit: { effect: 'malevolent_shrine', interval: 0 },
        shrine: {
          radius: 11.0, minRadius: 7, maxRadius: 17, mapFraction: 0.45,
          openTime: 1.1,
          // half Sukuna's cadence; the per-tick number is what he hits FOR
          interval: 1.10,
          blackFlash: { dmg: 14, kb: 2.2, kbY: 0.6, hitstop: 9, chainCap: 6 },
          //   14 per tick / 1.1 s = 12.7 dps, against Sukuna's 10.0-15.5 —
          //   comparable pressure, completely different delivery.
          // it cracks the level rather than cutting it
          cutInterval: 0.42, cutPower: 30, cutRadius: 2.0, cutsPerTick: 2
        },
        backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
      },
      copyEffect: { effect: 'yuji_divergent', dmg: 8, name: 'Copied: Divergent Fist' }
    }
  },
  {
    // ---- GAMEPLAY -------------------------------------------------------
    // Sixty-eight years on. Slower and far tougher, hits like something that
    // is no longer entirely human, and has finally learned the domain.
    //
    // What he gives up against base Yuji: SPEED and the Black Flash tempo.
    // Base Yuji is the roster's fastest brawler and his whole game is the
    // timing input; this one is heavy, deliberate, and cannot Flash nearly as
    // often. He trades the highest skill ceiling in the game for reliability.
    id: 'modulo', type: 'gameplay',
    name: 'YUJI 【MODULO】',
    descriptor: 'Sixty-eight years on. Special Grade. Half human, half curse.',
    jp: '虎杖悠仁 · 後年', accent: 0xb04a5a,
    role: 'CURSED FLESH · THE LAST STANDING',
    look: 'yuji_modulo',
    clipId: 'yuji',
    cpu: 'yuji_modulo',
    overrides: {
      title: 'THE STRONGEST OF THE ERA',
      stats: {
        // Half cursed spirit: the toughest human body in the game, and he does
        // not move like a teenager any more.
        hp: 132, walkSpeed: 2.4, runSpeed: 4.7, dashSpeed: 7.8, jumpVel: 8.2,
        startMaxCE: 48, ceRegen: 2.6, ceGainPerPunch: 7, damageScale: 1.12,
        stamina: 120, staminaRegen: 26, dashDrain: 24
      },
      // The string is slower and much heavier — an old man who has stopped
      // needing to be quick about it.
      punches: [
        { name: 'Straight', dmg: 7, startup: 8, active: 3, recovery: 15, reach: 1.55, kb: 2.0, kbY: 0, hitstun: 16, type: 'light', step: 1.5 },
        { name: 'Hook', dmg: 8, startup: 9, active: 3, recovery: 17, reach: 1.60, kb: 2.6, kbY: 0, hitstun: 18, type: 'light', step: 1.6 },
        { name: 'Rising Palm', dmg: 13, startup: 13, active: 4, recovery: 24, reach: 1.70, kb: 4.0, kbY: 7.4, hitstun: 28, type: 'launcher', step: 1.7 }
      ],
      heavy: { name: 'Cursed Hammer', dmg: 20, startup: 20, active: 5, recovery: 32, reach: 2.0, kb: 7.0, hitstun: 34, staminaCost: 18 },
      // CURSED REGENERATION — the half-curse body knits itself. Slower than
      // Sukuna's Reverse Cursed Technique because it is not a technique at
      // all, it is just what he is made of now.
      rct: { perSecond: 0.42 },
      // Black Flash still exists — he is the character who defined it — but
      // the window is tighter and the cooldown far longer. It is a punctuation
      // mark now rather than the engine.
      blackFlash: { delay: 6, window: 4, dmgMult: 2.8, ceRefund: 22, maxSpike: 7, chainDmg: 0.05, reach: 2.4 },
      special: { key: 'yuji_blackflash', name: 'BLACK FLASH', cost: 0, cooldown: 6.5 }
    }
  }
];
