// batch 2: Sukuna and the Zenin — sukuna(+yuji, +megumi), toji, maki, naoya
const UNIFORM = 0x23283e, UNIFORM_DK = 0x1c2034;
export const SUKUNA = {
  id: 'sukuna', height: 1.92, build: 'heavy', skin: 'warm', pecs: true,
  arms2: { shoulder: 0.092, shoulderY: 0.706, scale: 0.9 },
  face: { jaw: 1.14, chin: 1.1, width: 1.0, brow: 1.2, cheek: 1.1, nose: 1.0 },
  eyes: { eyeColor: 0xd02a34, browTilt: 18, browH: 0.8, eyeH: 0.24 },
  hair: { style: 'slick', color: 0xe8a8b4 },
  features: [{ kind: 'sukunaMarks', color: 0x1a1214, eye: 0xd02a34 }, { kind: 'bodyLines', color: 0x1a1214 }],
  outfit: [{ piece: 'hakama', color: 0xf0ece0, obi: 0x2b2738 }, { piece: 'sash', color: 0x2b2738, side: 0.07 }],
  shoe: false,
  palette: { rim: 0xff8090, hairRim: 0xffc8d0, outline: 0x120608, accent: 0xff2f45, energy: 0xff3040 }
};
export const SUKUNA_YUJI = {
  id: 'sukuna', height: 1.74, build: 'athletic', skin: 'light', pecs: true,
  face: { jaw: 1.0, chin: 0.95, width: 1.0, brow: 1.1, cheek: 0.9 },
  eyes: { eyeColor: 0xd02a34, browTilt: 16 },
  hair: { style: 'spikesUp', color: 0xf0a0b8, length: 0.7, count: 14 },
  features: [{ kind: 'sukunaMarks', color: 0x2a1418, eye: 0xd02a34 }, { kind: 'bodyLines', color: 0x2a1418 }],
  outfit: [{ piece: 'pants', color: UNIFORM_DK }],
  shoeColor: 0xf0eee8,
  palette: { rim: 0xff8090, hairRim: 0xffd0da, outline: 0x120608, accent: 0xff2f45, energy: 0xff3040 }
};
export const SUKUNA_MEGUMI = {
  id: 'sukuna', height: 1.76, build: 'lean', skin: 'light',
  face: { jaw: 1.06, chin: 1.0, width: 0.96, brow: 1.1, cheek: 0.8 },
  eyes: { eyeColor: 0xd02a34, browTilt: 18 },
  hair: { style: 'long', color: 0x161a24, length: 1.2, part: 'centre', wind: 0.3 },
  features: [{ kind: 'sukunaMarks', color: 0x1a1214, eye: 0xd02a34 }],
  outfit: [{ piece: 'hakama', color: 0xf0ece0, obi: 0x2b2738 }, { piece: 'kimono', color: 0xf0ece0, collarColor: 0x2a2030, sleeves: 1, hem: 0.5, obi: 0x2b2738 }],
  shoe: false,
  palette: { rim: 0xff8090, hairRim: 0x9090b0, outline: 0x120608, accent: 0xff2f45, energy: 0xff3040 }
};
export const TOJI = {
  id: 'toji', height: 1.90, build: 'heavy', skin: 'warm',
  face: { jaw: 1.14, chin: 1.08, width: 1.0, brow: 1.15, cheek: 1.0, nose: 1.0 },
  eyes: { eyeColor: 0x3f7a5a, browTilt: 12, eyeH: 0.24 },
  hair: { style: 'messy', color: 0x141418, length: 0.85, count: 16 },
  features: [{ kind: 'scar', at: [[0.28, -0.6, 0.85], 0.24, 0.035, [0, 10, 25]], color: 0xc98d84 }],
  outfit: [{ piece: 'pants', color: 0x2b2d38 }, { piece: 'shirt', color: 0x2c2e38, sleeves: 0.5 }],
  shoeColor: 0x0d0e12,
  palette: { rim: 0xa0d8b8, hairRim: 0x8090a0, outline: 0x080a0a, accent: 0x6ea88a, energy: 0x6ea88a }
};
export const MAKI = {
  id: 'maki', height: 1.72, build: 'wiry', skin: 'light', bust: 0.4,
  face: { jaw: 1.02, chin: 1.0, width: 0.96, brow: 0.9, cheek: 0.8 },
  eyes: { eyeColor: 0x5a4a3a, browTilt: 12, eyeH: 0.28 },
  hair: { style: 'ponytail', color: 0x1a2020, length: 1.6, high: false, tie: 0x8fd08f },
  features: [{ kind: 'scar', at: [[0.2, 0.05, 0.92], 0.035, 0.34, [0, 5, 20]], color: 0xc98d84 }],
  outfit: [{ piece: 'pants', color: UNIFORM_DK }, { piece: 'jacket', color: UNIFORM, collar: 'high', trim: 0x2a3050, hem: 0.44 }, { piece: 'glasses', round: false, color: 0x323238 }],
  palette: { rim: 0xb8f0b8, hairRim: 0x80a090, outline: 0x080c0a, accent: 0x8fd08f, energy: 0x8fd08f }
};
export const NAOYA = {
  id: 'naoya', height: 1.78, build: 'lean', skin: 'light',
  face: { jaw: 1.06, chin: 1.04, width: 0.94, brow: 0.8, cheek: 0.7, nose: 0.9 },
  eyes: { eyeColor: 0x6a5a3a, browTilt: -6, eyeH: 0.24, mouthCorner: 12 },
  hair: { style: 'sideSwept', color: 0xf0e0a0, side: -1, nape: true },
  outfit: [{ piece: 'hakama', color: 0x2a2a36, obi: 0x3a3a48 }, { piece: 'kimono', color: 0x30303c, collarColor: 0xe8d8a0, sleeves: 1, hem: 0.45, obi: 0x3a3a48 }],
  shoe: { hgt: 0.04 }, shoeColor: 0x1a1812,
  palette: { rim: 0xfff0b0, hairRim: 0xfff8d0, outline: 0x100e08, accent: 0xe8c85a, energy: 0xe8c85a }
};
