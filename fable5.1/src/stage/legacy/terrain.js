// TERRAIN CLASSIFICATION — every walkable surface in the game is either
// NATURAL or ARTIFICIAL.
//
// This exists for exactly one character. Hanami regenerates health at a rate
// decided by what he is standing on: soil, grass, forest floor, stone and
// stream bed feed him; concrete, tile, tarmac, floorboards and steel plate
// give him almost nothing. That asymmetry is the character — he is dominant on
// the Kyoto exchange grounds and at Jujutsu High and badly weakened in Shibuya
// Station and the detention centre — so the classification has to be REAL and
// complete rather than a per-map guess.
//
// HOW IT IS AUTHORED
//   · Every surface a map lays down through `kit.floor()` / `kit.stairs()` gets
//     a terrain rect for free, classified from the MATERIAL it was drawn with
//     (see MAT_TERRAIN below). Grass is natural because it is grass; concrete
//     is artificial because it is concrete. Nothing had to be typed twice and
//     nothing can drift out of sync with the art.
//   · A map may override any surface with `{ terrain: 'natural' }` for the
//     cases the material cannot know about — a concrete-textured slab that is
//     meant to read as bedrock, say.
//   · A raw `bounds.platform()` (stepping stones, a vent top, a rock shelf)
//     deliberately does NOT lay a rect down. It falls through to whatever is
//     under it, which is almost always what you want: the Kyoto stepping stones
//     sit over the rock stream bed and read natural, the Shinjuku podium vents
//     sit over concrete and read artificial. Pass `terrain` explicitly on the
//     rare occasion that is wrong.
//
// WATER. The brief lists water as natural, and a stream bed is: the Kyoto
// stream is drawn on `rock`, so it classifies natural through its floor and
// nothing special is needed. What is deliberately NOT natural is the film of
// standing water over the detention centre's concrete — a flooded concrete
// floor is still a concrete floor, and letting an inch of water turn the most
// artificial map in the set into a garden would delete the matchup the
// asymmetry exists to create. Terrain is decided by the SURFACE, not by what
// happens to be lying on it.
export const NATURAL = 'natural';
export const ARTIFICIAL = 'artificial';

// ---------------------------------------------------------------------------
// ICE — the third class, and the only one that is not authored by a map.
// ---------------------------------------------------------------------------
// Added for Uraume. Everything above is a description of what a map WAS BUILT
// OUT OF and is fixed for the round; ice is a description of what somebody has
// DONE to a surface, it is laid down mid-match through the runtime authoring
// door `Bounds.terrain()` already had, and it is torn down again through
// `Bounds.drop()`. See the header of combat/frost.js for why this is a third
// value of the existing classification rather than a second surface layer:
// the whole point is that there is exactly one query in the game that answers
// "what is the floor here", and it keeps being exactly one.
//
// *** NO MATERIAL MAPS TO IT. *** `MAT_TERRAIN` below is untouched, because no
// map is built out of ice and none should be: a map that wanted a frozen lake
// would want a `MAT_TERRAIN` entry pointing at it, and the day that map exists
// is the day to add one. Until then the only producer is the IceSystem, which
// means every ice rect in the game has an owner, a lifetime and a melt path.
//
// WHAT IT MEANS TO A CONSUMER. Nothing in the project reads a terrain class
// except Hanami's regeneration (combat/flora.js), the HUD readout and the
// debug overlay, and all three now have an explicit answer. Hanami's is the
// one that is a ruling rather than a label, and it is written down where it
// applies rather than here.
export const ICE = 'ice';

// Material name (as keyed in kit.js `surfaces()`) -> terrain class. Anything
// absent falls back to ARTIFICIAL, which is the safe default: a new material
// nobody classified should not silently hand Hanami a free map.
export const MAT_TERRAIN = {
  // --- natural -------------------------------------------------------------
  grass: NATURAL,        // lawns, sports field, the Kyoto clearing
  rock: NATURAL,         // outcrops, the plateau, the stream bed
  trunk: NATURAL,        // fallen logs you can stand on
  foliage: NATURAL,
  // --- artificial ----------------------------------------------------------
  tile: ARTIFICIAL, tileWall: ARTIFICIAL,
  concrete: ARTIFICIAL, concreteWall: ARTIFICIAL,
  asphalt: ARTIFICIAL,
  wood: ARTIFICIAL,      // FLOORBOARDS — a gym floor and a hall floor, not a
                         // tree. `trunk` above is the living wood.
  poolTile: ARTIFICIAL,
  rust: ARTIFICIAL,
  metal: ARTIFICIAL, darkMetal: ARTIFICIAL,
  paint: ARTIFICIAL, glass: ARTIFICIAL
};

// Built once from the shared material table so a lookup is by object identity
// rather than by the caller remembering to pass a name.
let _byMat = null;
export function classifyMaterial(mats, mat) {
  // A TINTED VARIANT STILL KNOWS WHAT IT IS. `kit.tintedSurface` stamps the
  // recipe's name onto the material, so a map that recolours its grass for its
  // own palette keeps classifying as grass. Without this the lookup below —
  // which is by object identity — would miss it and fall through to ARTIFICIAL,
  // and a repaint would quietly delete Hanami's best ground.
  if (mat && mat.userData && mat.userData.surface) {
    return MAT_TERRAIN[mat.userData.surface] ?? ARTIFICIAL;
  }
  if (!_byMat) {
    _byMat = new Map();
    for (const [name, m] of Object.entries(mats)) {
      if (m && m.uuid) _byMat.set(m.uuid, MAT_TERRAIN[name] ?? ARTIFICIAL);
    }
  }
  return (mat && _byMat.get(mat.uuid)) ?? ARTIFICIAL;
}

// Presentation, so the HUD and the debug overlay never disagree about wording.
export const TERRAIN_LABEL = {
  [NATURAL]: 'NATURAL GROUND',
  [ARTIFICIAL]: 'DEAD GROUND',
  [ICE]: 'FROZEN GROUND'
};
export const TERRAIN_JP = {
  [NATURAL]: '土',
  [ARTIFICIAL]: '人工',
  [ICE]: '氷'
};
export const TERRAIN_COLOR = {
  [NATURAL]: 0x7fc46a,
  [ARTIFICIAL]: 0x8a8f9c,
  // deliberately the PALE ice blue rather than Gojo's saturated #7fd0ff or
  // Miwa's #a8d8e8 — see the palette audit in art/models/uraume.js
  [ICE]: 0xcfeaf6
};
