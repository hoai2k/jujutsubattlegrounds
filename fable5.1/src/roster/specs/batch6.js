// batch 6: yuki, takaba, uraume, jogo, mahito(+distorted)
export const YUKI = {
  id: 'yuki', height: 1.76, build: 'feminine', skin: 'light', bust: 0.8,
  face: { jaw: 0.98, chin: 0.96, width: 0.98, brow: 0.8, cheek: 0.7 },
  eyes: { eyeColor: 0x3a3a40, browTilt: 8, eyeW: 0.56 },
  hair: { style: 'long', color: 0xf0dca0, length: 2.6, part: 'fringe', wind: 0.8 },
  outfit: [{ piece: 'pants', color: 0x3a4a6a }, { piece: 'shirt', color: 0xe8e8ec }, { piece: 'jacket', color: 0x2a2a34, collar: 'open', placket: false, hem: 0.46 }],
  shoeColor: 0x1a1a20,
  palette: { rim: 0xffe0c0, hairRim: 0xfff8e0, outline: 0x100c08, accent: 0xffd0a0, energy: 0xffd0a0 }
};
export const TAKABA = {
  id: 'takaba', height: 1.78, build: 'athletic', skin: 'light',
  face: { jaw: 1.06, chin: 1.0, width: 1.0, brow: 0.9, cheek: 0.8 },
  eyes: { eyeColor: 0x5a3a2a, browTilt: -2, mouthCorner: 14 },
  hair: { style: 'curly', color: 0x5a3a28, count: 30 },
  outfit: [{ piece: 'pants', color: 0x2a2a30 }, { piece: 'shirt', color: 0xe0d8c8 }, { piece: 'jacket', color: 0x6a4a3a, collar: 'open', placket: false, hem: 0.44 }],
  shoeColor: 0x3a2a20,
  palette: { rim: 0xfff0a0, hairRim: 0xc0a080, outline: 0x0c0a06, accent: 0xffe070, energy: 0xffe070 }
};
export const URAUME = {
  id: 'uraume', height: 1.66, build: 'slight', skin: 'pale',
  face: { jaw: 0.96, chin: 0.94, width: 0.98, brow: 0.7, cheek: 0.6 },
  eyes: { eyeColor: 0x9ad8f0, browTilt: 2, eyeW: 0.54 },
  hair: { style: 'bob', color: 0xf0f0f4, length: 0.35, fringe: 0.05 },
  outfit: [{ piece: 'hakama', color: 0xe8e8ee, obi: 0x2a3040 }, { piece: 'kimono', color: 0xf4f4f8, collarColor: 0xd8e0f0, sleeves: 1, sleeveDrop: 0.12, hem: 0.5, obi: 0x2a3040 }],
  shoe: { hgt: 0.04 }, shoeColor: 0x2a3040,
  palette: { rim: 0xd0f0ff, hairRim: 0xffffff, outline: 0x0a0e14, accent: 0xbfe8ff, energy: 0xbfe8ff }
};
export const JOGO = {
  id: 'jogo', height: 1.82, build: 'heavy', skin: 0x8a7468,
  head: { kind: 'volcano' },
  face: { jaw: 1.1, chin: 1.0, width: 1.0, brow: 0.2, cheek: 0.6, nose: 0.3 },
  eyes: { noEyes: true, mouthColor: 0x2a1a16 },
  features: [{ kind: 'volcanoHead', color: 0x6e5d58 }],
  outfit: [{ piece: 'hakama', color: 0x382d33, obi: 0x4a3a30 }, { piece: 'kimono', color: 0x3a2e30, collarColor: 0x8a5a40, sleeves: 1, hem: 0.48, obi: 0x4a3a30 }],
  shoe: { hgt: 0.04 }, shoeColor: 0x2a2020,
  palette: { rim: 0xff9050, hairRim: 0xff9050, outline: 0x140804, accent: 0xff5a1f, energy: 0xff6a2a }
};
export const MAHITO = {
  id: 'mahito', height: 1.80, build: 'lean', skin: 0xd9c4c4,
  face: { jaw: 1.02, chin: 0.98, width: 0.98, brow: 0.8, cheek: 0.7 },
  eyes: { eyeColor: 0x8a9ab8, browTilt: 4, eyeW: 0.56, eyeH: 0.32, mouthCorner: 10 },
  hair: { style: 'long', color: 0x8a9ab0, length: 1.1, part: 'centre', wind: 0.6 },
  features: [{ kind: 'patchwork', patch: 0x8c96a8, stitch: 0x2a2a30 }],
  outfit: [{ piece: 'pants', color: 0x2a2a34 }, { piece: 'shirt', color: 0x2e2e38, sleeves: 1 }],
  shoeColor: 0x1a1a20,
  palette: { rim: 0xc0d0e8, hairRim: 0xd0e0f0, outline: 0x0a0c10, accent: 0x9fb0c4, energy: 0xa0b8d0 }
};
export const MAHITO_DISTORTED = {
  ...MAHITO, build: 'heavy', height: 2.0, skin: 0x6a6a78,
  hair: { style: 'long', color: 0x6a7a90, length: 1.2, part: 'none', wind: 1 },
  features: [{ kind: 'patchwork', patch: 0x4a5060, stitch: 0x101014 }, { kind: 'horns', color: 0x3a3038, length: 1.0, spread: 0.6 }, { kind: 'glowEyes', color: 0xa0e0ff }],
  outfit: [{ piece: 'pants', color: 0x2b2b38 }],
  pecs: true,
  palette: { rim: 0xa0c0ff, hairRim: 0xd0e0f0, outline: 0x06080c, accent: 0x9fb0c4, energy: 0xa0c8ff }
};
