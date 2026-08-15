// ===========================================================================
// GOJO 【UNSEALED】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 (web search; the wiki host answered 402 to a direct
// fetch, so this one is authored from written description). AUDITED 2026-08-05
// under the Part 2 rule and PASSED without changes.
//
// WHY IT PASSES. The difference between this and base Gojo is entirely
// geometric, in both directions:
//   · REMOVED: the blindfold band lathe, its knot block and its two tail
//     strips. Three meshes that exist on the base build and do not exist here.
//   · ADDED: the SIX EYES, built through the shared face builder as real
//     geometry — sclera, iris, pupil glint, lash line and brow, per eye — plus
//     an additive lens over each iris so they read as lit from inside at
//     fighting distance. That lens is a mesh, not a shader trick on the base.
//   · NOTHING ELSE. Same uniform, same hair, same proportions, same numbers.
//     Purely cosmetic, and gameplay-identical by design.
//
// A variant whose whole point is "you can see his eyes now" is the one case
// where removing geometry and adding different geometry in the same place IS
// the entire design, and that is what this does.
// ===========================================================================
import { buildGojo } from '../gojo.js';

export function buildGojoUnblindfolded() { return buildGojo({ blindfold: false }); }
