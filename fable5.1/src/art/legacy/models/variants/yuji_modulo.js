// ===========================================================================
// YUJI 【MODULO】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 (web search, no images). REBUILT 2026-08-05 under the
// Part 2 rule that a cosmetic variant is gameplay-identical, not
// model-identical.
//
// WHAT IT WAS, AND WHY IT FAILED THE RULE
// The first build changed hair colour, skin colour, four proportion dials and
// the palette, then rendered the school gakuran — collar, hood bundle, red zip
// trim, drawstrings, hem skirt, cuffs — completely intact and recoloured dark.
// Its own reference sheet claimed "the school navy is gone for a near-black
// civilian layer", and no such layer existed in the mesh. That is a palette
// swap wearing a reference sheet's clothes, and it is exactly what the brief
// says is not acceptable: the same silhouette with different colours.
//
// WHAT IT IS NOW — authored geometry, listed so the claim is checkable
//   · THE GAKURAN IS SKIPPED ENTIRELY. Every piece of the school uniform is
//     branched out of the build. He is eighty; he does not own it any more.
//   · A HEAVY RIBBED ROLL-NECK: a tall lathe collar swallowing the jaw line,
//     with three raised rib bands around it.
//   · A LONG OPEN COAT: two lapel panels standing proud of the chest with
//     turned edges in a dried-blood trim, a shoulder yoke lathe so the coat
//     sits ON him, and a wide cinched belt with a buckle block.
//   · COAT PANELS AS SPRING CHAINS: two front panels of three segments each
//     plus a two-segment back vent. The first-year's hem flaps are two
//     segments; these are longer and looser, so the read at distance is a long
//     dark shape that trails, where the base is a short boxy one that does not.
//   · HEAVY TURNED-BACK CUFFS at both wrists.
//   · DIFFERENT HAIR GEOMETRY, not recoloured spikes. The crown volume is
//     removed, the hairline is receded to two short strokes set well back off
//     the brow, the remaining strands are long and bent BACKWARD rather than
//     up, and the temples are left bare — which is the actual difference
//     between an old man's head and a teenager's.
//
// WHAT IS DELIBERATELY REUSED, and why that is still modelling
//   · the shared rig, the toon shaders and the whole clip set — the brief says
//     these are correct and expected to be shared.
//   · Sukuna's markings, which the base model already carries as a hidden
//     group. Modulo never turns them off (`setSukuna` becomes a no-op) because
//     eating the Death Paintings left him half cursed spirit. They are the same
//     markings, so building a second copy would be dishonest, not diligent.
//
// APPROXIMATED (no image reference): the coat's cut, the roll-neck, and the
// exact greying. Flagged rather than presented as canon — the search results
// described his STATUS in Modulo, not his wardrobe.
// ===========================================================================
import { buildYuji } from '../yuji.js';

export function buildModuloYuji() { return buildYuji({ aged: true }); }
