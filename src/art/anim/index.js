// Clip registry: base movement/reaction set + per-character technique clips.
// Each character may also export STANCE (a partial pose merged over the shared
// stance) and override any base clip by name — that is how the roster gets
// individual battle posture while still sharing the punch/reaction library.
import { compileClip } from './player.js';
import { BASE_CLIPS, STANCE } from './base.js';
import { GOJO_CLIPS, GOJO_STANCE } from './gojo.js';
import { YUTA_CLIPS, YUTA_STANCE } from './yuta.js';
import { NANAMI_CLIPS, NANAMI_STANCE } from './nanami.js';
import { YUJI_CLIPS, YUJI_STANCE } from './yuji.js';
import { TODO_CLIPS, TODO_STANCE } from './todo.js';
import { JOGO_CLIPS, JOGO_STANCE } from './jogo.js';
import { MAHITO_CLIPS, MAHITO_STANCE } from './mahito.js';
import { MEGUMI_CLIPS, MEGUMI_STANCE } from './megumi.js';
import { MAHORAGA_CLIPS, MAHORAGA_STANCE } from './mahoraga.js';
import { HIGURUMA_CLIPS, HIGURUMA_STANCE } from './higuruma.js';
import { HAKARI_CLIPS, HAKARI_STANCE } from './hakari.js';
import { SUKUNA_CLIPS, SUKUNA_STANCE } from './sukuna.js';
import { SUKUNA_VESSEL_CLIPS, SUKUNA_VESSEL_STANCE } from './sukuna_vessel.js';
import { TOJI_CLIPS, TOJI_STANCE } from './toji.js';
import { HANAMI_CLIPS, HANAMI_STANCE } from './hanami.js';
import { KUROURUSHI_CLIPS, KUROURUSHI_STANCE } from './kurourushi.js';
import { CHOSO_CLIPS, CHOSO_STANCE } from './choso.js';
import { NOBARA_CLIPS, NOBARA_STANCE } from './nobara.js';
// THE TWO EXTREMES. Geto's set is authored almost entirely on eased keys with
// tiny amplitudes (he barely moves); Naoya's is authored almost entirely on
// `hold` keys, which is a true step function in the player — so his body
// arrives at poses instead of travelling to them. See the headers of both.
import { GETO_CLIPS, GETO_STANCE } from './geto.js';
import { NAOYA_CLIPS, NAOYA_STANCE } from './naoya.js';
// KASHIMO — 'snap out, drift back': stepped on impact like Naoya, eased on
// recovery unlike him. See the header of anim/kashimo.js.
import { KASHIMO_CLIPS, KASHIMO_STANCE } from './kashimo.js';
// PANDA — THREE COMPLETE SETS in one file (base / Gor / Tri suffixes). The
// largest clip file in the project; see its header for the naming contract.
import { PANDA_CLIPS, PANDA_STANCE } from './panda.js';
// INUMAKI — the withdrawn end of the roster, and the only set in the project
// with FOUR IDLES (one per throat-strain tier). See its header: everything is
// tiny until he speaks, and then it is the biggest pose in the file.
import { INUMAKI_CLIPS, INUMAKI_STANCE } from './inumaki.js';
// THE THREE NEW SETS, and each one is at an extreme of a different dial.
// MAKI — the only set in the project whose NEUTRAL CHANGES DURING THE ROUND:
// four postures selected by awakening stage through the `A1/A2/A3` suffixes,
// the same mechanism Kashimo's charged cycles and Inumaki's throat idles use.
// YUKI — the longest wind-ups and the longest follow-throughs in the project.
// Nothing she does starts or stops quickly, and that is the whole mass read.
// MIWA — the shortest clips and the only genuinely STATIC one: her sheathe
// stance has two identical keys and no motion at all. See its header for why
// that reads as intent rather than as a frozen game.
import { MAKI_CLIPS, MAKI_STANCE } from './maki.js';
import { YUKI_CLIPS, YUKI_STANCE } from './yuki.js';
import { MIWA_CLIPS, MIWA_STANCE } from './miwa.js';
// THE TWO NEW SETS, and each is at an extreme the project did not have.
// URO — the only character with TWO COMPLETE MOVEMENT SETS. Everything
// suffixed `Air` is the hovering version, selected by the same `_clip` swap
// Kashimo's charged cycles, Inumaki's throat idles, Maki's stage neutrals and
// Panda's per-stance set already use. Her grounded set is authored on the rule
// that her hips never sit at zero — she floats even when standing.
// DAGON — the slowest set in the project by a wide margin, and the only one
// whose signature feature is animated by NOTHING: ten spring chains carry the
// barbels, so the file never touches them.
import { URO_CLIPS, URO_STANCE } from './uro.js';
import { DAGON_CLIPS, DAGON_STANCE } from './dagon.js';
// The Mahoraga summon ritual is Megumi's, but it belongs to that feature
// rather than to his kit, so it is merged in here instead of living in
// megumi.js. Nothing else changes about his clip set.
import { RITUAL_CLIPS } from './ritual.js';

const CHAR_CLIPS = { gojo: GOJO_CLIPS, yuta: YUTA_CLIPS, nanami: NANAMI_CLIPS, yuji: YUJI_CLIPS, todo: TODO_CLIPS, jogo: JOGO_CLIPS, mahito: MAHITO_CLIPS, megumi: { ...MEGUMI_CLIPS, ...RITUAL_CLIPS }, mahoraga: MAHORAGA_CLIPS, higuruma: HIGURUMA_CLIPS, hakari: HAKARI_CLIPS, sukuna: SUKUNA_CLIPS, sukuna_vessel: SUKUNA_VESSEL_CLIPS, toji: TOJI_CLIPS, hanami: HANAMI_CLIPS, kurourushi: KUROURUSHI_CLIPS, choso: CHOSO_CLIPS, nobara: NOBARA_CLIPS, geto: GETO_CLIPS, naoya: NAOYA_CLIPS, kashimo: KASHIMO_CLIPS, panda: PANDA_CLIPS, inumaki: INUMAKI_CLIPS, maki: MAKI_CLIPS, yuki: YUKI_CLIPS, miwa: MIWA_CLIPS, uro: URO_CLIPS, dagon: DAGON_CLIPS };
const CHAR_STANCE = { gojo: GOJO_STANCE, yuta: YUTA_STANCE, nanami: NANAMI_STANCE, yuji: YUJI_STANCE, todo: TODO_STANCE, jogo: JOGO_STANCE, mahito: MAHITO_STANCE, megumi: MEGUMI_STANCE, mahoraga: MAHORAGA_STANCE, higuruma: HIGURUMA_STANCE, hakari: HAKARI_STANCE, sukuna: SUKUNA_STANCE, sukuna_vessel: SUKUNA_VESSEL_STANCE, toji: TOJI_STANCE, hanami: HANAMI_STANCE, kurourushi: KUROURUSHI_STANCE, choso: CHOSO_STANCE, nobara: NOBARA_STANCE, geto: GETO_STANCE, naoya: NAOYA_STANCE, kashimo: KASHIMO_STANCE, panda: PANDA_STANCE, inumaki: INUMAKI_STANCE, maki: MAKI_STANCE, yuki: YUKI_STANCE, miwa: MIWA_STANCE, uro: URO_STANCE, dagon: DAGON_STANCE };

export function makeClips(charId) {
  const stance = { ...STANCE, ...(CHAR_STANCE[charId] || {}) };
  const defs = { ...BASE_CLIPS, ...(CHAR_CLIPS[charId] || {}) };
  const clips = new Map();
  for (const [name, def] of Object.entries(defs)) {
    clips.set(name, compileClip(name, def, stance));
  }
  return clips;
}

export { STANCE };
