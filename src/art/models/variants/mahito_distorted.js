// ===========================================================================
// MAHITO 【DISTORTED】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// INSTANT SPIRIT BODY OF DISTORTED KILLING (無為転変・別枠) — the canonical
// name, not a fan term. Researched 2026-08-04 (web search, no images).
// AUDITED 2026-08-05 under the Part 2 rule and PASSED without changes.
//
// WHY IT PASSES. The carapace itself is a recolour, and on its own that would
// fail — but it is not on its own. Every feature the wiki's appearance section
// lists is built as real geometry, parented to bones after the base model
// finalizes:
//   · THE CROWN PLATE over the eyes, "crudely attached" to the lower jaw —
//     a pale slab sitting deliberately crooked at 13 degrees off level, with
//     two visible pins running down to the jaw. Crude is the whole character
//     of it, so the crookedness is authored rather than incidental.
//   · FIVE TENDRILS off the back of the head, fanned.
//   · SIX ELBOW TENDRILS, three per arm, parented to the LoArm bones so they
//     swing with the forearm.
//   · A THICK TAIL off the hips.
//   · and the silhouette thickens throughout: shoulder 0.110 (base 0.098),
//     muscle 1.16 (0.95), bulk 1.14 (0.96). "Yuji can't get a punch in as he
//     notes how hard Mahito's body has become."
//
// That is thirteen new meshes and a changed body plan, which is a re-model with
// a recoloured base underneath it — the acceptable case the brief describes,
// not the forbidden one.
//
// APPROXIMATED: tendril count and exact placement, the tail's length, and the
// plate's proportions. The stitched-seam look of the base is kept underneath,
// which is a deliberate choice rather than a canon claim — it keeps the two
// variants recognisably the same character.
// ===========================================================================
import { buildMahito } from '../mahito.js';

export function buildDistortedMahito() { return buildMahito({ distorted: true }); }
