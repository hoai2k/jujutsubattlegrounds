// ===========================================================================
// SUKUNA 【YUJI'S BODY】 — VARIANT MODEL REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 (web search, no images). AUDITED 2026-08-05 under the
// Part 2 rule and PASSED without changes.
//
// A VESSEL IS NOT THE TRUE FORM. When Sukuna is in someone else's body it IS
// that body — Yuji's build, height, face, hair and clothes — so reusing the
// host's mesh is not laziness here, it is the entire point of the look. What
// makes it a different MODEL is what is laid over the top, all of it authored
// geometry parented to the host's bones (see models/sukuna_vessel.js):
//   · THE MARKINGS: two forehead bars, a slash outboard of each eye running to
//     the temple, a chin stripe, a throat pair, and bands on both upper arms
//     and both wrists. Eleven meshes.
//   · THE SECOND PAIR OF EYES, positioned BELOW the natural pair per canon
//     ("a second pair of eyes underneath his normal eyes, usually closed, which
//     opened when Sukuna took control") — sclera, iris, glint and lash line per
//     eye, eight meshes. No flesh plate: that is a true-form feature and does
//     not belong on a host.
//   · THE STANCE, which is animation rather than geometry: the vessel uses
//     Sukuna's clip set and stance, so it stands like him.
//
// EXPLICITLY ABSENT, because a vessel does not have them: the extra arms, the
// abdominal mouth, the flesh plate, the pink-red hair.
//
// `setFingers` is stubbed to a no-op — the Finger stacks are a true-form
// mechanic and a vessel has none to eat.
// ===========================================================================
export { buildSukunaYuji } from '../sukuna_vessel.js';
