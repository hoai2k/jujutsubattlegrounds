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
// THE TWO NEW SETS, and each is at an extreme the project did not have either.
// YAGA — the only set with a SUSTAINED CRAFT LOOP in it: `build` is 2.6 s of
// two hands doing different work at the same time, which is the one animation
// problem the roster had never posed. His neutral is also the only one in the
// project that is not a fighting stance — his arms are FOLDED, so every attack
// has to unfold first and that unfolding is visible in the first three frames
// of every clip.
// TAKABA — the loosest set in the project and the only one authored on
// STAND-UP TIMING rather than on fighting-game timing: set-up, a pause that is
// deliberately a frame or two longer than is comfortable, then the punchline.
// He is also the only character with FOURTEEN technique clips (one per rolled
// outcome), selected at press time by the same `def.clips` mechanism Mahito's
// Body Weapon already used, and with THREE idles selected by meter tier the
// way Inumaki's throat idles and Maki's stage neutrals already are.
import { YAGA_CLIPS, YAGA_STANCE } from './yaga.js';
import { TAKABA_CLIPS, TAKABA_STANCE } from './takaba.js';
// THE TWO NEW SETS, and they are the two ENDS of the project's timing scale —
// authored as a matched pair on purpose, because the fastest way to make one
// character feel a way is to build the opposite one beside it.
// URAUME — the STILLEST set in the project. No anticipation key is longer than
// three frames, no clip has an overshoot on its return, and the head never
// leads a movement. The idle is 5.6 s, the longest by 1.4 s, and it contains
// real motion — it is just very small and very slow, because a clip with two
// identical keys reads as a frozen game rather than as stillness.
// RYU — the HEAVIEST set in the project. Every wind-up is at least 0.22 s and
// the heavy's is 0.34, the longest single anticipation key anywhere; every
// impact is followed by a settle that drops the hips 14-18 cm and fires the
// floor thump; and the feet never come together in any clip. He also carries
// FIVE CHARGE POSES selected by tier through the same suffix swap Kashimo's
// coiled cycles use — read `Hips_pos` down them and he sinks thirty
// centimetres into the floor across a full charge.
import { URAUME_CLIPS, URAUME_STANCE } from './uraume.js';
import { RYU_CLIPS, RYU_STANCE } from './ryu.js';
// THE TWO NEW SETS, and they are at opposite ends of a dial the project has
// never had one at: HOW MUCH OF A FIGHTER THE BODY IS.
// REGGIE — the loosest set in the project and the only NEUTRAL THAT IS NOT A
// FIGHTING STANCE at all: hands doing nothing, weight on one hip, chin up. He
// throws things the way somebody who has never trained throws things, and the
// whole weight system for his seven objects is one column of `Hips_pos` values
// running 0.00 to -0.19. See its header for the table.
// INO — FOUR COMPLETE SETS in one file (base / Kai / Rei / Kir suffixes),
// using Panda's suffix contract, and they are authored to barely look like the
// same person: Reiki's idle is 2.4 s with nothing ever settling and Kirin's is
// 3.8 s in which his feet never move. The BASE set is the one that matters
// most and is the one nobody designs — it is what he looks like with the mask
// knocked off, which is a real state a player will find themselves in.
import { REGGIE_CLIPS, REGGIE_STANCE } from './reggie.js';
import { INO_CLIPS, INO_STANCE } from './ino.js';
// The Mahoraga summon ritual is Megumi's, but it belongs to that feature
// rather than to his kit, so it is merged in here instead of living in
// megumi.js. Nothing else changes about his clip set.
import { RITUAL_CLIPS } from './ritual.js';

const CHAR_CLIPS = { gojo: GOJO_CLIPS, yuta: YUTA_CLIPS, nanami: NANAMI_CLIPS, yuji: YUJI_CLIPS, todo: TODO_CLIPS, jogo: JOGO_CLIPS, mahito: MAHITO_CLIPS, megumi: { ...MEGUMI_CLIPS, ...RITUAL_CLIPS }, mahoraga: MAHORAGA_CLIPS, higuruma: HIGURUMA_CLIPS, hakari: HAKARI_CLIPS, sukuna: SUKUNA_CLIPS, sukuna_vessel: SUKUNA_VESSEL_CLIPS, toji: TOJI_CLIPS, hanami: HANAMI_CLIPS, kurourushi: KUROURUSHI_CLIPS, choso: CHOSO_CLIPS, nobara: NOBARA_CLIPS, geto: GETO_CLIPS, naoya: NAOYA_CLIPS, kashimo: KASHIMO_CLIPS, panda: PANDA_CLIPS, inumaki: INUMAKI_CLIPS, maki: MAKI_CLIPS, yuki: YUKI_CLIPS, miwa: MIWA_CLIPS, uro: URO_CLIPS, dagon: DAGON_CLIPS, yaga: YAGA_CLIPS, takaba: TAKABA_CLIPS, uraume: URAUME_CLIPS, ryu: RYU_CLIPS, reggie: REGGIE_CLIPS, ino: INO_CLIPS };
const CHAR_STANCE = { gojo: GOJO_STANCE, yuta: YUTA_STANCE, nanami: NANAMI_STANCE, yuji: YUJI_STANCE, todo: TODO_STANCE, jogo: JOGO_STANCE, mahito: MAHITO_STANCE, megumi: MEGUMI_STANCE, mahoraga: MAHORAGA_STANCE, higuruma: HIGURUMA_STANCE, hakari: HAKARI_STANCE, sukuna: SUKUNA_STANCE, sukuna_vessel: SUKUNA_VESSEL_STANCE, toji: TOJI_STANCE, hanami: HANAMI_STANCE, kurourushi: KUROURUSHI_STANCE, choso: CHOSO_STANCE, nobara: NOBARA_STANCE, geto: GETO_STANCE, naoya: NAOYA_STANCE, kashimo: KASHIMO_STANCE, panda: PANDA_STANCE, inumaki: INUMAKI_STANCE, maki: MAKI_STANCE, yuki: YUKI_STANCE, miwa: MIWA_STANCE, uro: URO_STANCE, dagon: DAGON_STANCE, yaga: YAGA_STANCE, takaba: TAKABA_STANCE, uraume: URAUME_STANCE, ryu: RYU_STANCE, reggie: REGGIE_STANCE, ino: INO_STANCE };

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
