// SUKUNA — variants.
//
// NAME CHECK: "Meguna" is a FAN NAME. Research turned up no official term for
// Sukuna in Megumi's body — the manga just calls it what it is, and the event
// itself (chapter 212) is the "Enchain" binding vow that severs him from Yuji
// and makes Megumi his main vessel. The variant is therefore named for what it
// is rather than for the fan coinage, with the coinage in the descriptor so
// anyone looking for it finds it.
//
// BOTH ARE COSMETIC, which the loader enforces: the only keys either one
// overrides are `name` and `title`. Every number — the claw string, Dismantle,
// Cleave, Fire Arrow, the Fingers, Reverse Cursed Technique, Malevolent
// Shrine, the refinement stat — is bit-identical to the true form, because it
// is literally the same frozen config object with a different display name.
//
// THE FOUR-ARM PROBLEM. A vessel has two arms, and Sukuna's clip set drives
// four. Both variants point at the `sukuna_vessel` clip set, which strips the
// second pair's tracks and re-authors the four clips that were leaning on
// them. See art/anim/sukuna_vessel.js for exactly which and why.

export const SUKUNA_VARIANTS = [
  {
    id: 'base', type: 'cosmetic',
    name: 'SUKUNA', descriptor: 'The four-armed true form. Two mouths, four eyes.',
    jp: '両面宿儺'
  },
  {
    id: 'yuji', type: 'cosmetic',
    name: 'SUKUNA 【ITADORI】',
    descriptor: "His first vessel. Yuji's body, Sukuna's markings and a second pair of eyes.",
    jp: '虎杖の器', accent: 0xff4a5e,
    role: 'DISMANTLE · IN A BORROWED BODY',
    look: 'sukuna_yuji',
    clipId: 'sukuna_vessel',
    overrides: { title: "ITADORI'S BODY" }
  },
  {
    id: 'megumi', type: 'cosmetic',
    name: 'SUKUNA 【FUSHIGURO】',
    descriptor: 'His main vessel from the Enchain vow onward. Fans call it "Meguna".',
    jp: '伏黒の器', accent: 0xc0304a,
    role: 'DISMANTLE · THE STOLEN VESSEL',
    look: 'sukuna_megumi',
    clipId: 'sukuna_vessel',
    overrides: { title: "FUSHIGURO'S BODY" }
  }
];
