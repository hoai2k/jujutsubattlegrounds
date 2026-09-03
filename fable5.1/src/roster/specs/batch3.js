// batch 3: kashimo, uro, ryu, yuta, miwa
const KYOTO = 0x232838, KYOTO_DK = 0x1a1e2c;
export const KASHIMO = {
  id: 'kashimo', height: 1.84, build: 'lean', skin: 'light',
  face: { jaw: 1.08, chin: 1.04, width: 0.94, brow: 0.9, cheek: 0.8 },
  eyes: { eyeColor: 0x8fd0ff, browTilt: 10, eyeH: 0.24 },
  hair: { style: 'long', color: 0xb8b0e0, length: 2.4, part: 'centre', wind: 0.8 },
  outfit: [{ piece: 'hakama', color: 0x3a3050, obi: 0x201830 }, { piece: 'kimono', color: 0x4a3a6a, collarColor: 0xd0c8e8, sleeves: 0.7, hem: 0.48, obi: 0x201830 }],
  shoe: { hgt: 0.04 }, shoeColor: 0x1a1820,
  palette: { rim: 0xc0e8ff, hairRim: 0xe8e0ff, outline: 0x0a0a14, accent: 0xa8e0ff, energy: 0xa8e8ff }
};
export const URO = {
  id: 'uro', height: 1.68, build: 'feminine', skin: 'pale', bust: 0.6,
  face: { jaw: 0.96, chin: 0.92, width: 0.98, brow: 0.7, cheek: 0.6 },
  eyes: { eyeColor: 0x9090a8, browTilt: 8, eyeW: 0.54 },
  hair: { style: 'long', color: 0xb8b8c8, length: 2.6, part: 'fringe', wind: 1.2 },
  outfit: [{ piece: 'shorts', color: 0x292938 }, { piece: 'tank', color: 0x292938 }, { piece: 'wraps', color: 0xe0e0e8 }],
  shoe: false,
  palette: { rim: 0xe0d8ff, hairRim: 0xf0f0ff, outline: 0x0a0a12, accent: 0xd8d0f0, energy: 0xe8e0ff }
};
export const RYU = {
  id: 'ryu', height: 1.96, build: 'massive', skin: 'tan',
  face: { jaw: 1.2, chin: 1.12, width: 1.06, brow: 1.2, cheek: 1.1, nose: 1.1 },
  eyes: { eyeColor: 0x3a2a1a, browTilt: 14, eyeH: 0.22 },
  hair: { style: 'pompadour', color: 0x141418 },
  outfit: [{ piece: 'pants', color: 0x2a2c38, grow: 1.12 }, { piece: 'gakuran', color: 0x282b38, buttons: 5, buttonColor: 0xd8c070, hem: 0.44 }],
  shoeColor: 0x0d0e12,
  palette: { rim: 0xffc890, hairRim: 0x8090a0, outline: 0x0a0806, accent: 0xffb070, energy: 0xffb070 }
};
export const YUTA = {
  id: 'yuta', height: 1.78, build: 'lean', skin: 'light',
  face: { jaw: 1.02, chin: 1.0, width: 0.96, brow: 0.9, cheek: 0.7 },
  eyes: { eyeColor: 0x2a2a36, browTilt: 6, eyeH: 0.3, browUp: 0.15 },
  hair: { style: 'messy', color: 0x161820, length: 0.9, count: 14 },
  outfit: [{ piece: 'pants', color: 0x1c2034 }, { piece: 'gakuran', color: 0x23283e, buttons: 0, trim: 0x3a4060, hem: 0.44, sleeves: 0.75 }, { piece: 'wraps', color: 0xe8e2d2 }],
  palette: { rim: 0xb0ffd8, hairRim: 0x8fb8b0, outline: 0x080e0c, accent: 0x9ff5c9, energy: 0x9ff5c9 }
};
export const MIWA = {
  id: 'miwa', height: 1.62, build: 'feminine', skin: 'light', bust: 0.5,
  face: { jaw: 0.94, chin: 0.9, width: 1.0, brow: 0.7, cheek: 0.6, nose: 0.7 },
  eyes: { eyeColor: 0x3a5aa0, eyeW: 0.58, eyeH: 0.34, browTilt: 4 },
  hair: { style: 'long', color: 0x4a6ab8, length: 2.0, part: 'fringe', wind: 0.6 },
  outfit: [{ piece: 'skirt', color: KYOTO_DK, hem: 0.33 }, { piece: 'jacket', color: KYOTO, collar: 'high', trim: 0x3a4060, hem: 0.46 }],
  shoe: { boot: 0.16 }, shoeColor: 0x1a1a22,
  palette: { rim: 0xb0d0ff, hairRim: 0xa0c0ff, outline: 0x080a14, accent: 0x8fb8ff, energy: 0x8fb8ff }
};
