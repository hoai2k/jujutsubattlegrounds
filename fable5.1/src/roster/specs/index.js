// Every look, keyed by look id (a character id, or a variant look id).
import * as B1 from './batch1.js'; import * as B2 from './batch2.js'; import * as B3 from './batch3.js';
import * as B4 from './batch4.js'; import * as B5 from './batch5.js'; import * as B6 from './batch6.js'; import * as B7 from './batch7.js';
export const LOOKS = {
  gojo: B1.GOJO, gojo_unblindfolded: B1.GOJO_UNBLINDFOLDED, gojo_shinjuku: B1.GOJO_SHINJUKU,
  yuji: B1.YUJI, yuji_shinjuku: B1.YUJI_SHINJUKU, yuji_modulo: B1.YUJI_MODULO,
  megumi: B1.MEGUMI, nobara: B1.NOBARA, nanami: B1.NANAMI,
  sukuna: B2.SUKUNA, sukuna_yuji: B2.SUKUNA_YUJI, sukuna_megumi: B2.SUKUNA_MEGUMI, toji: B2.TOJI, maki: B2.MAKI, naoya: B2.NAOYA,
  kashimo: B3.KASHIMO, uro: B3.URO, ryu: B3.RYU, yuta: B3.YUTA, miwa: B3.MIWA,
  inumaki: B4.INUMAKI, geto: B4.GETO, higuruma: B4.HIGURUMA, reggie: B4.REGGIE, hakari: B4.HAKARI,
  choso: B5.CHOSO, ino: B5.INO, panda: B5.PANDA, yaga: B5.YAGA, todo: B5.TODO,
  yuki: B6.YUKI, takaba: B6.TAKABA, uraume: B6.URAUME, jogo: B6.JOGO, mahito: B6.MAHITO, mahito_distorted: B6.MAHITO_DISTORTED,
  hanami: B7.HANAMI, kurourushi: B7.KUROURUSHI, dagon: B7.DAGON, mahoraga: B7.MAHORAGA
};
