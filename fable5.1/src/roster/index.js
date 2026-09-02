// ROSTER REGISTRY — presentation + gameplay config + visual spec per pick.
// `makeCharacter(pick)` returns { config, model, clips, variant } exactly as
// the old game's registry did, so the combat layer never learned a new shape.
import { buildCharacter } from '../art/character/build.js';
import { makeClips } from '../art/anim/index.js';
import { applyHealthScale } from '../combat/balance.js';
import { variantsOf, hasVariants, variantEntry, resolveVariant, splitPick, joinPick, lastVariant, rememberVariant } from './configs/variants.js';
import { GOJO_VARIANTS } from './configs/variants/gojo.js';
import { SUKUNA_VARIANTS } from './configs/variants/sukuna.js';
import { MAHITO_VARIANTS } from './configs/variants/mahito.js';
import { YUJI_VARIANTS } from './configs/variants/yuji.js';
import { CONFIGS } from './configs/all.js';
import { LOOKS } from './specs/index.js';

export { variantsOf, hasVariants, variantEntry, resolveVariant, splitPick, joinPick, lastVariant, rememberVariant };

const P = (id, jp, accent, role, extra = {}) => ({ config: CONFIGS[id], jp, accent, role, ...extra });
export const ROSTER = {
  gojo: P('gojo', '五条悟', 0x7fd0ff, 'ZONE CONTROL · BEST DOMAIN', { variants: GOJO_VARIANTS }),
  sukuna: P('sukuna', '両面宿儺', 0xff2f45, 'DISMANTLE · THE KING OF CURSES', { variants: SUKUNA_VARIANTS }),
  toji: P('toji', '伏黒甚爾', 0x6ea88a, 'HEAVENLY RESTRICTION · CURSED TOOLS'),
  maki: P('maki', '禪院真希', 0x8fd08f, 'HEAVENLY RESTRICTION · WEAPONS'),
  naoya: P('naoya', '禪院直哉', 0xe8c85a, 'PROJECTION SORCERY · 24 FRAMES'),
  kashimo: P('kashimo', '鹿紫雲一', 0xa8e0ff, 'MYTHICAL BEAST AMBER · LIGHTNING'),
  uro: P('uro', '烏鷺享子', 0xd8d0f0, 'SKY MANIPULATION · FLIGHT'),
  ryu: P('ryu', '石流龍', 0xffb070, 'GRANITE BLAST · OUTPUT'),
  yuta: P('yuta', '乙骨憂太', 0x9ff5c9, 'COPY · HIGHEST OUTPUT'),
  miwa: P('miwa', '三輪霞', 0x8fb8ff, 'NEW SHADOW STYLE · SIMPLE DOMAIN'),
  inumaki: P('inumaki', '狗巻棘', 0xc8b8ff, 'CURSED SPEECH · COMMANDS'),
  megumi: P('megumi', '伏黒恵', 0x8fb6d8, 'TEN SHADOWS · SUMMONER'),
  geto: P('geto', '夏油傑', 0x6b2fa0, 'CURSED SPIRIT MANIPULATION · THE GENERAL'),
  nanami: P('nanami', '七海建人', 0xf2b23c, 'RATIO · NO DOMAIN, NO MERCY'),
  higuruma: P('higuruma', '日車寛見', 0xd8c78a, 'DEADLY SENTENCING · ONE GAMBLE'),
  reggie: P('reggie', 'レジィ・スター', 0xc0d0c0, 'CONTRACT · RECEIPTS'),
  hakari: P('hakari', '秤金次', 0xffc93c, 'IDLE DEATH GAMBLE · JACKPOT'),
  yuji: P('yuji', '虎杖悠仁', 0xff5f74, 'BLACK FLASH · PURE PHYSICAL', { variants: YUJI_VARIANTS }),
  nobara: P('nobara', '釘崎野薔薇', 0xe07a34, 'STRAW DOLL · SETUP ZONER'),
  choso: P('choso', '脹相', 0xc4142c, 'BLOOD MANIPULATION · MID-RANGE CONTROL'),
  ino: P('ino', '猪野琢真', 0xb0c8d8, 'AUSPICIOUS BEASTS · FOUR MASKS'),
  panda: P('panda', 'パンダ', 0xf0f0f0, 'CURSED CORPSE · THREE CORES'),
  yaga: P('yaga', '夜蛾正道', 0x8a7a68, 'CURSED CORPSES · CONSTRUCTION'),
  todo: P('todo', '東堂葵', 0xff5fc8, 'BOOGIE WOOGIE · HEAVYWEIGHT'),
  yuki: P('yuki', '九十九由基', 0xffd0a0, 'STAR RAGE · MASS'),
  takaba: P('takaba', '高羽史彦', 0xffe070, 'COMEDIAN · ANYTHING GOES'),
  uraume: P('uraume', '裏梅', 0xbfe8ff, 'FROST CALM · ICE'),
  jogo: P('jogo', '漏瑚', 0xff5a1f, 'DISASTER FLAMES · ZONER', { spirit: true }),
  mahito: P('mahito', '真人', 0x9fb0c4, 'IDLE TRANSFIGURATION · SUMMONER', { spirit: true, variants: MAHITO_VARIANTS }),
  hanami: P('hanami', '花御', 0x9ec46a, 'DISASTER PLANTS · AREA DENIAL', { spirit: true }),
  kurourushi: P('kurourushi', '黒沐死', 0xd8a02a, 'GLUTTONY · ATTRITION', { spirit: true }),
  dagon: P('dagon', '陀艮', 0x5fc0c0, 'DEATH SWARM · SHIKIGAMI', { spirit: true })
};
export const ROSTER_IDS = ['gojo', 'sukuna', 'toji', 'maki', 'naoya', 'kashimo', 'uro', 'ryu', 'yuta', 'miwa', 'inumaki', 'megumi', 'geto', 'nanami', 'higuruma', 'reggie', 'hakari', 'yuji', 'nobara', 'choso', 'ino', 'panda', 'yaga', 'todo', 'yuki', 'takaba', 'uraume', 'jogo', 'mahito', 'hanami', 'kurourushi', 'dagon'];

export const SUMMONS = { mahoraga: { config: CONFIGS.mahoraga, jp: '魔虚羅', accent: 0xc6ac72, role: 'ADAPTATION · SUMMON ONLY' } };

export function lookFor(lookId) { return LOOKS[lookId] || LOOKS[lookId.split(':')[0]] || null; }

export function makeCharacter(pick) {
  const { charId, variantId } = splitPick(pick);
  const entry = ROSTER[charId];
  const r = resolveVariant(entry, charId, variantId);
  const spec = lookFor(r.look);
  const model = buildCharacter(spec);
  model.palette.accent = r.accent ?? model.palette.accent;
  return { config: applyHealthScale ? r.config : r.config, model, clips: makeClips(r.clipId), variant: r.variant, spec };
}

export function pickInfo(pick) {
  const { charId, variantId } = splitPick(pick);
  const entry = ROSTER[charId] || SUMMONS[charId];
  if (!entry) return null;
  if (!ROSTER[charId]) return { ...entry, charId, variantId: 'base', name: entry.config.name };
  const r = resolveVariant(entry, charId, variantId);
  return { charId, variantId: r.variant.id, config: r.config, jp: r.jp, accent: r.accent, role: r.role, spirit: entry.spirit, name: r.config.name, variantName: r.variant.name, type: r.variant.type, descriptor: r.variant.descriptor, look: r.look };
}

export function allPicks() {
  const out = [];
  for (const id of ROSTER_IDS) for (const v of variantsOf(ROSTER[id], id)) out.push(joinPick(id, v.id));
  return out;
}
export function randomPick() { const p = allPicks(); return p[(Math.random() * p.length) | 0]; }
