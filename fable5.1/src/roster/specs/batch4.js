// batch 4: inumaki, geto, higuruma, reggie, hakari
const TOKYO = 0x23283e, TOKYO_DK = 0x1c2034;
export const INUMAKI = {
  id: 'inumaki', height: 1.70, build: 'slight', skin: 'light',
  face: { jaw: 0.98, chin: 0.96, width: 0.98, brow: 0.7, cheek: 0.6 },
  eyes: { eyeColor: 0x8a6a4a, browTilt: 2 },
  hair: { style: 'bowl', color: 0xe8e4f4, fringe: 0.8 },
  outfit: [{ piece: 'pants', color: TOKYO_DK }, { piece: 'jacket', color: TOKYO, collar: 'high', trim: 0x3a4060, hem: 0.44 }, { piece: 'scarf', color: TOKYO, high: true }],
  palette: { rim: 0xd8c8ff, hairRim: 0xffffff, outline: 0x0c0a14, accent: 0xc8b8ff, energy: 0xc8b8ff }
};
export const GETO = {
  id: 'geto', height: 1.86, build: 'athletic', skin: 'light',
  face: { jaw: 1.1, chin: 1.06, width: 0.96, brow: 0.9, cheek: 0.9, nose: 1.0 },
  eyes: { eyeColor: 0x2a2030, browTilt: 8, eyeH: 0.24 },
  hair: { style: 'long', color: 0x141418, length: 1.5, part: 'centre', halfUp: true, wind: 0.3 },
  features: [{ kind: 'earrings', color: 0xd8c070 }],
  outfit: [{ piece: 'pants', color: 0x2b2b38 }, { piece: 'coat', color: 0x2c2c38, collar: 'none', hem: 0.18, sleeves: 1 }, { piece: 'kasaya', color: 0xd8b060 }],
  shoeColor: 0x0d0e12,
  palette: { rim: 0xc090ff, hairRim: 0x8070a0, outline: 0x0c0614, accent: 0x9b5fe0, energy: 0x8b3fd0 }
};
export const HIGURUMA = {
  id: 'higuruma', height: 1.82, build: 'lean', skin: 'light',
  face: { jaw: 1.1, chin: 1.06, width: 0.96, brow: 1.0, cheek: 0.9, nose: 1.0 },
  eyes: { eyeColor: 0x3a3a40, browTilt: 4, browUp: -0.05, eyeH: 0.24 },
  hair: { style: 'curly', color: 0x1a1a1e, streak: 0xa0a0a8, count: 30 },
  outfit: [{ piece: 'pants', color: 0x2a2a30 }, { piece: 'shirt', color: 0xe8e8ec, collar: true }, { piece: 'tie', color: 0x3a3a46 }, { piece: 'jacket', color: 0x2a2a30, collar: 'open', placket: false, hem: 0.42 }],
  shoeColor: 0x1a1512,
  palette: { rim: 0xf0e0b0, hairRim: 0xb0b0b8, outline: 0x0c0a08, accent: 0xd8c78a, energy: 0xd8c78a }
};
export const REGGIE = {
  id: 'reggie', height: 1.80, build: 'lean', skin: 'light',
  face: { jaw: 1.04, chin: 1.0, width: 0.96, brow: 0.8, cheek: 0.7 },
  eyes: { eyeColor: 0x8a8a90, browTilt: -4, mouthCorner: 10 },
  hair: { style: 'long', color: 0xd8d8d0, length: 1.0, part: 'fringe', wind: 0.4 },
  outfit: [{ piece: 'pants', color: 0xd8d8d0 }, { piece: 'coat', color: 0xe8e8e0, collar: 'open', hem: 0.24, sleeves: 1 }, { piece: 'shirt', color: 0x2a2a30 }],
  shoeColor: 0xe0e0d8,
  palette: { rim: 0xe0f0e0, hairRim: 0xffffff, outline: 0x0a0c0a, accent: 0xc0d0c0, energy: 0xc0d0c0 }
};
export const HAKARI = {
  id: 'hakari', height: 1.82, build: 'athletic', skin: 'light',
  face: { jaw: 1.08, chin: 1.02, width: 0.98, brow: 1.0, cheek: 0.9 },
  eyes: { eyeColor: 0x2a2a30, browTilt: 12, eyeH: 0.24 },
  hair: { style: 'undercut', color: 0x141418, shaved: 0x2a2320 },
  outfit: [{ piece: 'pants', color: 0x2b2b38 }, { piece: 'shirt', color: 0xe8e8e8, sleeves: 0 }, { piece: 'cape', color: 0x2a4a5a, length: 0.44 }],
  shoeColor: 0x1a1a20,
  palette: { rim: 0xffe090, hairRim: 0x9090a0, outline: 0x0c0a04, accent: 0xffc93c, energy: 0xffd040 }
};
