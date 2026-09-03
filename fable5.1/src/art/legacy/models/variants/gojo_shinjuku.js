// ===========================================================================
// GOJO 【SHINJUKU】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 (web search, no images). AUDITED 2026-08-05 under the
// Part 2 rule and PASSED without changes.
//
// The wiki's appearance section for the arc is specific: no blindfold, hair
// down, eyes shown; a TIGHT-FITTING BLACK SHIRT, WHITE BAGGY TRAINING PANTS
// with a black belt woven through the waist, and BLACK MARTIAL-ARTS SLIPPERS —
// an outfit deliberately styled after Toji Fushiguro. (Which is why, now that
// Toji is actually in the roster, the two of them share a silhouette on
// purpose. Toji's build is the reference this one was already imitating.)
//
// WHY IT PASSES — the geometry genuinely differs, not the palette
//   · THE ENTIRE UNIFORM KIT IS SKIPPED: collar lathe, trim lip, three zipper
//     segments, hem skirt and both cuffs are branched out of the build.
//   · ADDED: a black belt lathe woven at the waist; four torn openings across
//     the chest and stomach showing skin through the shirt; ten ragged sleeve
//     stub cones where the sleeves end above each elbow; and five hanging cloth
//     shreds off the ribs and waist, each on its own spring chain so the damage
//     MOVES with him.
//   · build: slightly more muscle (1.04 vs 0.98) — the loose uniform is gone
//     and there is a body under it now.
//   · the same six-eye geometry as UNSEALED, brighter and violet-shifted.
//
// APPROXIMATED: the exact placement and count of every tear, the precise cut of
// the shirt, and the shape of the slippers. Blood is deliberately NOT modelled
// — the roster has no gore anywhere.
// ===========================================================================
import { buildGojo } from '../gojo.js';

export function buildShinjukuGojo() { return buildGojo({ blindfold: false, shinjuku: true }); }
