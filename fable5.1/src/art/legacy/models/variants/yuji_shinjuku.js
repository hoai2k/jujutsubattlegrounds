// ===========================================================================
// YUJI 【SHINJUKU】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 (web search, no images). UPGRADED 2026-08-05 under the
// Part 2 rule.
//
// WHAT IT WAS, AND WHY IT ONLY HALF-PASSED
// The first build recoloured the uniform toward soot, turned Sukuna's markings
// on permanently, thickened the build, and hung four cloth shreds off the chest
// and hips on spring chains. The shreds are real geometry and they were the
// right instinct — but the sheet claimed the uniform was "half destroyed" while
// the jacket itself was built completely intact underneath them. Damage that
// only exists as four dangling strips is decoration, not destruction.
//
// WHAT WAS ADDED — the damage now exists in the SILHOUETTE
//   · THREE TORN OPENINGS across the chest and stomach, each built as TWO
//     pieces: a dark ragged frame standing proud of the jacket and the skin
//     showing through inside it. The first attempt used a bare skin-coloured
//     box and it read as a sticking plaster stuck ON the uniform rather than a
//     hole through it — a tear is defined by its border and a patch is not, so
//     the dark edge is what flips the read.
//   · THE RIGHT SLEEVE IS GONE below the shoulder: a ragged stub of seven cones
//     around the bicep, and a bare skin forearm from there down. This is the
//     largest silhouette change and the only one that reads from behind as well
//     as in front.
//   · THE HEM IS TORN INTO NINE POINTS instead of finishing on a clean lathe
//     skirt, so the bottom edge of him is jagged from every angle.
//   · plus the original four shred chains, kept — they still do the job of
//     making the wear MOVE.
//
// SHARED WITH THE BASE, and correctly so: the rig, the shaders, the clip set,
// and Sukuna's marking group (which this build simply starts visible, because
// by this point in the story he has spent the entire arc sharing the body).
//
// APPROXIMATED: the exact pattern of the damage. Blood is deliberately not
// modelled anywhere in this roster and one character is the wrong place to
// start.
// ===========================================================================
import { buildYuji } from '../yuji.js';

export function buildShinjukuYuji() { return buildYuji({ shinjuku: true }); }
