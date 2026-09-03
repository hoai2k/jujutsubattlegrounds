// batch 5: choso, ino, panda, yaga, todo
export const CHOSO = {
  id: 'choso', height: 1.80, build: 'athletic', skin: 'pale',
  face: { jaw: 1.06, chin: 1.02, width: 0.96, brow: 0.9, cheek: 0.8 },
  eyes: { eyeColor: 0x8a2a30, browTilt: 8, eyeH: 0.26 },
  hair: { style: 'ponytail', color: 0x161618, twin: true, length: 1.4, tie: 0xe8e0d0 },
  features: [{ kind: 'scar', at: [[0, 0.3, 0.92], 0.14, 0.03, [0, 0, 0]], color: 0x5a2a30 }],
  outfit: [{ piece: 'pants', color: 0x2e2638 }, { piece: 'coat', color: 0x2a2036, collar: 'none', hem: 0.30, sleeves: 1 }, { piece: 'sash', color: 0xe8e0d0, side: 0 }],
  shoe: { boot: 0.1 }, shoeColor: 0x141218,
  palette: { rim: 0xff8090, hairRim: 0x8090a0, outline: 0x100608, accent: 0xc4142c, energy: 0xd0202c }
};
export const INO = {
  id: 'ino', height: 1.76, build: 'athletic', skin: 'light',
  face: { jaw: 1.04, chin: 1.0, width: 0.98, brow: 0.9, cheek: 0.8 },
  eyes: { eyeColor: 0x2a4a5a, browTilt: 8 },
  hair: { style: 'messy', color: 0x161a20, length: 0.8, count: 14 },
  outfit: [{ piece: 'pants', color: 0x1c2028 }, { piece: 'hoodie', color: 0x2a3a3a, trim: 0x3a4a4a, hem: 0.44 }, { piece: 'mask', color: 0x1a1e24 }],
  shoeColor: 0x14151c,
  palette: { rim: 0xc0e0f0, hairRim: 0x8090a0, outline: 0x080c10, accent: 0xb0c8d8, energy: 0xb0c8d8 }
};
export const PANDA = {
  id: 'panda', height: 1.92, build: 'massive', skin: 0xf0ece4, outline: 0.014,
  head: { kind: 'panda' },
  face: { jaw: 0.9, chin: 0.8, width: 1.15, brow: 0.5, cheek: 0.5, nose: 0.2 },
  eyes: { eyeColor: 0x2a2a2a, noEyes: false, eyeW: 0.4, eyeH: 0.22 },
  features: [{ kind: 'pandaHead' }],
  bodySlot: 'fur', armSlot: 'fur', armColor: 0x121216, legSlot: 'fur', legColor: 0x121216, handSlot: 'fur', handColor: 0x121216,
  torsoColor: 0xf0ece4,
  outfit: [{ piece: 'jacket', color: 0x23283e, collar: 'high', trim: 0x3a4060, hem: 0.44, sleeves: 0.6 }],
  shoe: false,
  palette: { rim: 0xffffff, furRim: 0xfff4e2, outline: 0x0a0a0c, accent: 0xf0f0f0, energy: 0xf0f0f0 }
};
export const YAGA = {
  id: 'yaga', height: 1.86, build: 'heavy', skin: 'tan',
  face: { jaw: 1.16, chin: 1.1, width: 1.02, brow: 1.2, cheek: 1.0, nose: 1.1 },
  eyes: { eyeColor: 0x2a2a2a, browTilt: 12, eyeH: 0.22 },
  hair: { style: 'buzz', color: 0x1a1816 },
  features: [{ kind: 'beard', color: 0x1a1816 }, { kind: 'mustache', color: 0x1a1816 }],
  outfit: [{ piece: 'pants', color: 0x2c2c38 }, { piece: 'shirt', color: 0x2a2a34 }, { piece: 'coat', color: 0x2c2c38, collar: 'open', hem: 0.30, sleeves: 1 }, { piece: 'glasses', dark: true }],
  shoeColor: 0x14120e,
  palette: { rim: 0xd0c0a8, hairRim: 0x8080a0, outline: 0x0a0806, accent: 0x8a7a68, energy: 0xa08a60 }
};
export const TODO = {
  id: 'todo', height: 1.90, build: 'massive', skin: 'tan',
  face: { jaw: 1.2, chin: 1.12, width: 1.06, brow: 1.25, cheek: 1.15, nose: 1.1 },
  eyes: { eyeColor: 0x2a2a2a, browTilt: 14, eyeH: 0.22 },
  hair: { style: 'undercut', color: 0x141418, shaved: 0x2a2624 },
  features: [{ kind: 'scar', at: [[-0.2, 0.32, 0.9], 0.03, 0.22, [0, -8, -20]], color: 0xa07868 }],
  outfit: [{ piece: 'pants', color: 0x212638, grow: 1.12 }, { piece: 'jacket', color: 0x232838, collar: 'high', trim: 0x3a4060, hem: 0.44, buttons: 0 }],
  shoeColor: 0x14151c,
  palette: { rim: 0xffb0e0, hairRim: 0x8090a0, outline: 0x0c060a, accent: 0xff5fc8, energy: 0xff5fc8 }
};
