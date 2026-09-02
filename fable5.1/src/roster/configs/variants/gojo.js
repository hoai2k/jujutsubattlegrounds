// GOJO — variants.
//
// RESEARCH (2026-08-04, web search; no images viewed):
//   · UNBLINDFOLDED is the everyday look with the fold off — the Six Eyes are
//     the point of it, so they are built as real geometry with their own
//     material rather than a texture swap. Purely cosmetic.
//   · SHINJUKU SHOWDOWN: the wiki's appearance section is specific. No
//     blindfold, hair down, eyes shown; a tight black shirt, white baggy
//     training pants with a black belt, black martial-arts slippers — an
//     outfit deliberately styled after Toji. Across the fight Sukuna's slash
//     barrage rips and bloodies him and he runs Reverse Cursed Technique at
//     maximum output to stay standing. He reaches 200% output and fires a
//     Hollow Purple that tears from Shibuya to Shinjuku.
//   · FALLING BLOSSOM EMOTION (落花の情) — THE NAME IS CORRECT. It is a secret
//     art of the Big Three Families and a genuine anti-domain countermeasure:
//     it shrouds the user in cursed energy that counter-attacks the instant a
//     domain's sure-hit makes contact, nullifying it. Naobito Zenin used it
//     against Dagon; Gojo tells Sukuna he learned it as a child and had never
//     used it, then uses it inside Malevolent Shrine. Its documented weakness
//     is that it does nothing against ordinary physical attacks — which is
//     exactly the hole this implementation leaves open.

export const GOJO_VARIANTS = [
  {
    id: 'base', type: 'cosmetic',
    name: 'GOJO', descriptor: 'Blindfolded. Uniform. Bored.', jp: '五条悟'
  },
  {
    id: 'unblindfolded', type: 'cosmetic',
    name: 'GOJO 【UNSEALED】',
    descriptor: 'Blindfold off. The Six Eyes, uncovered — and nothing else changed.',
    jp: '六眼', accent: 0xa8e4ff,
    role: 'ZONE CONTROL · SIX EYES OPEN',
    look: 'gojo_unblindfolded',
    overrides: { title: 'THE SIX EYES' }
  },
  {
    // ---- GAMEPLAY -------------------------------------------------------
    // Full-power Gojo. The identity is PURPLE: he reaches the charged state
    // sooner, the sequence into Hollow Purple is cheaper and faster, and his
    // special stops being an escape and becomes the roster's only universal
    // answer to a domain.
    //
    // He is NOT strictly better than base Gojo, which is the rule for every
    // gameplay variant. What he gives up:
    //   · TELEPORT is gone. Base Gojo's i-frame warp is his defensive out and
    //     his corner escape; this Gojo has no movement special at all and has
    //     to hold his ground.
    //   · He is BATTLE-WORN: 88 hp against the base's 95, the lowest on the
    //     roster. He is in the fight of his life and it shows.
    //   · Falling Blossom Emotion answers DOMAIN SURE-HITS and nothing else.
    //     Against a normal attack it is a stance with no guard, so throwing it
    //     out of a read is worse than blocking.
    id: 'shinjuku', type: 'gameplay',
    name: 'GOJO 【SHINJUKU】',
    descriptor: 'Battle-worn, blindfold gone, throwing purple. Falling Blossom Emotion.',
    jp: '新宿決戦', accent: 0xb47fff,
    role: 'HOLLOW PURPLE · ANTI-DOMAIN',
    look: 'gojo_shinjuku',
    clipId: 'gojo',
    cpu: 'gojo_shinjuku',
    overrides: {
      title: 'THE STRONGEST, STILL',
      stats: {
        hp: 88,                    // battle-worn: the lowest health in the game
        walkSpeed: 2.8, runSpeed: 5.6, dashSpeed: 9.0,
        startMaxCE: 55,            // he starts closer to charged...
        ceRegen: 3.0,              // ...and refills faster
        ceGainPerPunch: 9,         // CHARGED COMES FASTER — the whole identity
        damageScale: 0.92
      },
      // Red and Blue are unchanged in shape but cheaper, so the sequence into
      // Purple is a rhythm rather than a savings plan.
      ct1: { cost: 15, startup: 18, recovery: 20 },
      ct2: { cost: 11, startup: 15, recovery: 18 },
      // HOLLOW PURPLE: the window is far more generous and the startup much
      // shorter. Base Gojo throws this once a match if he plans for it; this
      // one throws it whenever he strings Blue into Red.
      purple: {
        name: 'Hollow Purple', windowFrames: 150, startup: 32, active: 40, recovery: 26,
        effect: 'purple', dmg: 48, width: 1.8, clip: 'purple'
      },
      // ---- SPECIAL — FALLING BLOSSOM EMOTION 落花の情 --------------------
      // A held counter-stance. While it is up, any DOMAIN SURE-HIT that would
      // land on him is nullified on contact and the shroud answers back. It is
      // the one universal domain counter in the game that needs neither a
      // domain of your own nor a barrier to break — which is precisely what
      // the technique is for in the source.
      //
      // Priced as a defensive commitment: heavy stamina drain while held, a
      // hard cap on the window so it cannot simply be left on, real recovery,
      // and NO protection whatsoever against ordinary attacks. Read it and
      // walk up and hit him.
      special: {
        key: 'gojo_blossom', name: 'FALLING BLOSSOM', jp: '落花の情',
        cost: 8, cooldown: 5,
        holdFrames: 90,          // 1.5 s cap — it is a read, not a stance to live in
        staminaDrain: 42,        // per second while held
        recovery: 20,            // on release or on the cap
        counterDmg: 9,           // what the shroud hands back per nullified tick
        clip: 'special'
      },
      ultimate: { kind: 'domain' },
      domain: {
        // Unchanged in effect. Refinement 12 — the highest Gojo, and one above
        // Malevolent Shrine's 11, so on an exact-tie clash he edges Sukuna.
        // A clash resolves on DAMAGE TAKEN first, so this only decides a draw:
        // Sukuna out-fighting him for the five-second contest still wins it.
        refinement: 12,
        castFrames: 88, duration: 8
      },
      copyEffect: { effect: 'gojo_red', dmg: 8, name: 'Copied: Red' }
    }
  }
];
