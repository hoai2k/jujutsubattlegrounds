// VISUAL SPECS — batch 1: the Tokyo first years and their teachers.
// A spec is a description, not a model: build, height, skin, face, hair,
// outfit pieces (in layering order), features, palette.
export const GOJO = {
  id: 'gojo', height: 1.92, build: 'lean', skin: 'fair',
  face: { jaw: 1.08, chin: 1.05, width: 0.94, brow: 0.8, cheek: 0.7, nose: 0.9, socket: 0.8 },
  eyes: { eyeColor: 0x6fd3ff, browTilt: 6 },
  hair: { style: 'spikesUp', color: 0xf2f6ff, length: 1.05, count: 18 },
  outfit: [
    { piece: 'pants', color: 0x1b1f38 },
    { piece: 'jacket', color: 0x202638, collar: 'high', trim: 0x93a6c8, hem: 0.43 },
    { piece: 'blindfold', color: 0x0b0c12 }
  ],
  shoeColor: 0x0d0e14,
  palette: { rim: 0x9fd0ff, hairRim: 0xd8ecff, outline: 0x0a0e1c, accent: 0x7fd0ff, energy: 0x8fd4ff }
};
export const GOJO_UNBLINDFOLDED = { ...GOJO, id: 'gojo', outfit: GOJO.outfit.filter(g => g.piece !== 'blindfold'), eyes: { eyeColor: 0x7fe0ff, eyeW: 0.56, eyeH: 0.3 }, features: [{ kind: 'glowEyes', color: 0x9ff0ff }] };
export const GOJO_SHINJUKU = {
  ...GOJO, id: 'gojo', build: 'athletic',
  hair: { style: 'messy', color: 0xf2f6ff, length: 1.0 },
  outfit: [{ piece: 'pants', color: 0xd8d4c8, grow: 1.16, wide: 1.1 }, { piece: 'shirt', color: 0x292c38, sleeves: 1 }, { piece: 'belt', color: 0x2b2b38 }],
  eyes: { eyeColor: 0x7fe0ff, eyeW: 0.56 },
  palette: { rim: 0xc6a8ff, hairRim: 0xe8dcff, outline: 0x0a0810, accent: 0xb47fff, energy: 0xb47fff }
};

export const YUJI = {
  id: 'yuji', height: 1.74, build: 'athletic', skin: 'light',
  face: { jaw: 1.0, chin: 0.95, width: 1.0, brow: 1.0, cheek: 0.8, nose: 0.9 },
  eyes: { eyeColor: 0x8a5a3a, browTilt: 4, browH: 0.7 },
  hair: { style: 'spikesUp', color: 0xf0a0b8, length: 0.7, count: 14 },
  outfit: [
    { piece: 'pants', color: 0x1c1f38 },
    { piece: 'hoodie', color: 0x181b30, trim: 0x2a2f4c, hem: 0.44 }
  ],
  shoeColor: 0xf0eee8,
  palette: { rim: 0xffa0b0, hairRim: 0xffd0da, outline: 0x120a10, accent: 0xff5f74, energy: 0xff6f7f }
};
export const YUJI_SHINJUKU = { ...YUJI, outfit: [{ piece: 'pants', color: 0x1c1f38 }, { piece: 'shirt', color: 0x1a1d30, sleeves: 0.6 }, { piece: 'wraps', color: 0xe8e2d2 }], features: [{ kind: 'scar', at: [[-0.3, 0.1, 0.9], 0.03, 0.3, [0, -10, 15]], color: 0xb87070 }] };
export const YUJI_MODULO = { ...YUJI, hair: { style: 'spikesUp', color: 0xf0a0b8, length: 0.7, count: 14 }, features: [{ kind: 'sukunaMarks', color: 0x381b20, eye: 0xd03040 }, { kind: 'bodyLines' }], outfit: [{ piece: 'pants', color: 0x1c1f38 }, { piece: 'tank', color: 0x1a1d30 }], palette: { rim: 0xff7070, hairRim: 0xffd0da, outline: 0x381f32, accent: 0xff2f45, energy: 0xff3f4f } };

export const MEGUMI = {
  id: 'megumi', height: 1.75, build: 'lean', skin: 'light',
  face: { jaw: 1.04, chin: 1.0, width: 0.96, brow: 0.9, cheek: 0.7 },
  eyes: { eyeColor: 0x2f5a8a, browTilt: 14 },
  hair: { style: 'messy', color: 0x161a24, length: 0.95, count: 16 },
  outfit: [
    { piece: 'pants', color: 0x1b1f38 },
    { piece: 'gakuran', color: 0x1c2138, buttons: 0, trim: 0x2a2f4c, hem: 0.44 }
  ],
  palette: { rim: 0x8fb6d8, hairRim: 0x7f98c0, outline: 0x080a14, accent: 0x8fb6d8, energy: 0x5f8fff }
};

export const NOBARA = {
  id: 'nobara', height: 1.60, build: 'feminine', skin: 'light', bust: 0.6,
  face: { jaw: 0.94, chin: 0.9, width: 0.98, brow: 0.7, cheek: 0.6, nose: 0.7 },
  eyes: { eyeColor: 0xc08040, eyeW: 0.56, eyeH: 0.32, browTilt: 10 },
  hair: { style: 'bob', color: 0xd9853d, length: 0.5 },
  outfit: [
    { piece: 'skirt', color: 0x1c1f38, hem: 0.34 },
    { piece: 'jacket', color: 0x1c2138, collar: 'high', trim: 0x2a2f4c, hem: 0.46 }
  ],
  shoe: { hgt: 0.06, boot: 0.1 }, shoeColor: 0x1a1a22,
  palette: { rim: 0xffc090, hairRim: 0xffd8a8, outline: 0x140c08, accent: 0xe07a34, energy: 0xff9f4a }
};

export const NANAMI = {
  id: 'nanami', height: 1.84, build: 'athletic', skin: 'light',
  face: { jaw: 1.1, chin: 1.05, width: 0.98, brow: 1.1, cheek: 0.9, nose: 1.0 },
  eyes: { eyeColor: 0x5a4a3a, browTilt: 2, browH: 0.8 },
  hair: { style: 'sideSwept', color: 0xe6d49a, side: 1, nape: true },
  features: [],
  outfit: [
    { piece: 'pants', color: 0x2a2c36 },
    { piece: 'shirt', color: 0x6d8fc4, collar: true, collarColor: 0xe8ecf4 },
    { piece: 'tie', color: 0xf2b23c },
    { piece: 'jacket', color: 0x292c38, collar: 'open', placket: false, hem: 0.42, sleeves: 1 },
    { piece: 'goggles', color: 0x3a3a3f }
  ],
  shoeColor: 0x1a1512,
  palette: { rim: 0xffd890, hairRim: 0xfff0c0, outline: 0x100e0a, accent: 0xf2b23c, energy: 0xf2b23c }
};
