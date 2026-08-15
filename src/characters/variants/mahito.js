// MAHITO — variants.
//
// RESEARCH (2026-08-04, web search; no images viewed):
// The evolved form has a proper canonical name and it is not a fan term:
// INSTANT SPIRIT BODY OF DISTORTED KILLING (無為転変・別枠). He reaches it
// during the Shibuya Incident by landing Black Flash — the moment of focus
// lets him feel the true shape of his own soul, and hitting it a second time
// on Todo lets him understand it.
//
// APPEARANCE, per the wiki: his human-like skin literally sheds. What is left
// is bulkier and far tougher, with a hard armour-like carapace; his eyes are
// covered by a crown-like plate crudely attached to his lower jaw; he has a
// thick tail, black tendrils from both elbows, and more loose tendrils at the
// back of his head. Yuji cannot land a punch on him and notes how hard the
// body has become.
//
// GAMEPLAY. The domain carries over unchanged — Self-Embodiment of Perfection
// is his soul, and reshaping the outside of it does not change what it does.
// What changes is everything in front of the domain: the normals become the
// tendrils and the tail, he is much harder to move and much harder to hurt,
// and he stops being the squirmy summoner and becomes something you have to
// go through.
//
// What he gives up: the transfigured human. Base Mahito never fights alone by
// choice, and the summon is half his pressure. This form has no special at all
// — the tendrils are the pressure now — so he loses the body-blocking minion,
// the extra damage source, and the thing that made his approach safe.
import { buildDistortedMahito } from '../../art/models/variants/mahito_distorted.js';

export const MAHITO_VARIANTS = [
  {
    id: 'base', type: 'cosmetic',
    name: 'MAHITO', descriptor: 'Patchwork skin, idle hands, a smile.', jp: '真人'
  },
  {
    id: 'distorted', type: 'gameplay',
    name: 'MAHITO 【DISTORTED】',
    descriptor: 'Instant Spirit Body of Distorted Killing. The skin comes off.',
    jp: '無為転変・別枠', accent: 0x6f7f92,
    role: 'DISTORTED KILLING · CARAPACE',
    buildModel: buildDistortedMahito,
    clipId: 'mahito',
    cpu: 'mahito_distorted',
    overrides: {
      title: 'THE SHAPE OF HIS SOUL',
      stats: {
        // "Yuji can't get a punch in as he notes how hard Mahito's body has
        // become." The carapace is the stat line.
        hp: 118, walkSpeed: 2.5, runSpeed: 5.4, dashSpeed: 9.4, jumpVel: 9.0,
        startMaxCE: 44, ceRegen: 2.4, ceGainPerPunch: 6, damageScale: 1.08,
        stamina: 100, staminaRegen: 22, dashDrain: 26
      },
      // the tendrils: longer reach than any of base Mahito's normals, and the
      // third hit is the tail coming round
      punches: [
        { name: 'Tendril', dmg: 5, startup: 7, active: 4, recovery: 14, reach: 2.05, kb: 1.8, kbY: 0, hitstun: 15, type: 'light', step: 1.4 },
        { name: 'Double Tendril', dmg: 6, startup: 8, active: 4, recovery: 16, reach: 2.15, kb: 2.4, kbY: 0, hitstun: 17, type: 'light', step: 1.4 },
        { name: 'Tail Sweep', dmg: 11, startup: 12, active: 5, recovery: 25, reach: 2.35, kb: 4.2, kbY: 7.2, hitstun: 28, type: 'launcher', step: 1.5 }
      ],
      heavy: { name: 'Carapace Slam', dmg: 17, startup: 18, active: 5, recovery: 30, reach: 2.2, kb: 6.5, hitstun: 32, staminaCost: 20, armorFrames: 14 },
      // harder to move and harder to launch — he is armoured now
      kbResist: 0.78, launchResist: 0.72,
      blockChipMult: 0.7,
      // NO SUMMON. The transfigured human is gone; the tendrils are the
      // pressure, and losing the body-block is the real cost of the form.
      special: null,
      noSpecialReason: 'THE SKIN THAT MADE THEM IS GONE',
      copyEffect: { effect: 'mahito_soultouch', dmg: 7, name: 'Copied: Soul Touch' }
    }
  }
];
