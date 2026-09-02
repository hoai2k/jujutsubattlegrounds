// batch 7: the spirits and the summon — hanami, kurourushi, dagon, mahoraga
export const HANAMI = {
  id: 'hanami', height: 1.98, build: 'heavy', skin: 'wood',
  head: { kind: 'wood' },
  face: { jaw: 1.06, chin: 1.0, width: 1.02, brow: 0.6, cheek: 0.8, nose: 0.4 },
  eyes: { noEyes: true, mouthColor: 0x2a1c14 },
  features: [{ kind: 'woodHead', branch: 0x4a3a2a, flower: 0xf0a0c8 }],
  outfit: [{ piece: 'pants', color: 0x1c2030 }, { piece: 'coat', color: 0x1e2434, collar: 'none', hem: 0.30, sleeves: 0.7 }],
  shoe: false,
  palette: { rim: 0xc8f0a0, hairRim: 0xc8f0a0, outline: 0x080c06, accent: 0x9ec46a, energy: 0xa0d070 }
};
export const KUROURUSHI = {
  id: 'kurourushi', height: 1.88, build: 'heavy', skin: 'ash',
  head: { kind: 'roach' },
  face: { jaw: 1.1, chin: 1.0, width: 1.0, brow: 0.8, cheek: 0.8, nose: 0.5 },
  eyes: { eyeColor: 0xe0a020, eyeW: 0.4, eyeH: 0.2, browTilt: 20 },
  features: [{ kind: 'roachHead', color: 0x3a2a14 }, { kind: 'glowEyes', color: 0xffb020 }],
  armSlot: 'metal', armColor: 0x3a2a14, legSlot: 'metal', legColor: 0x2a1c0c,
  outfit: [{ piece: 'cape', color: 0x38250c, length: 0.5 }, { piece: 'belt', color: 0x382211, wide: 1.6 }],
  shoe: false,
  palette: { rim: 0xffd080, hairRim: 0xffd080, outline: 0x0c0804, accent: 0xd8a02a, energy: 0xd8a02a }
};
export const DAGON = {
  id: 'dagon', height: 2.10, build: 'massive', skin: 0x6f8f96,
  head: { kind: 'fish' },
  face: { jaw: 1.2, chin: 0.8, width: 1.2, brow: 0.4, cheek: 0.6, nose: 0.2 },
  eyes: { noEyes: true, mouthColor: 0x1a2a30 },
  features: [{ kind: 'fishHead', color: 0x6f8f96, fin: 0x3e5e6a }, { kind: 'tail', color: 0x6f8f96, length: 0.6 }],
  outfit: [{ piece: 'hakama', color: 0x1e2a30, obi: 0x3e5e6a }],
  shoe: false,
  palette: { rim: 0x90e0e0, hairRim: 0x90e0e0, outline: 0x061012, accent: 0x5fc0c0, energy: 0x60d0d0 }
};
export const MAHORAGA = {
  id: 'mahoraga', height: 3.4, build: 'massive', skin: 0xe8e4dc, pecs: true, outline: 0.02,
  face: { jaw: 1.16, chin: 1.1, width: 1.0, brow: 1.2, cheek: 1.0, nose: 0.8 },
  eyes: { eyeColor: 0xc0a060, browTilt: 14, eyeH: 0.22 },
  hair: { style: 'bald' },
  features: [{ kind: 'horns', color: 0x2a2a30, length: 1.2, spread: 0.55, r: 0.18 }, { kind: 'glowEyes', color: 0xffe0a0 }, { kind: 'bodyLines', color: 0x2a2a30 }],
  outfit: [{ piece: 'hakama', color: 0x2a2a30, obi: 0x4a4a50 }],
  shoe: false,
  palette: { rim: 0xffe8c0, hairRim: 0xffe8c0, outline: 0x0a0a0c, accent: 0xc6ac72, energy: 0xc6ac72 }
};
