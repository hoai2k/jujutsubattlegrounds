// Every variant model in one place. Each entry has its own file and its own
// reference sheet next to it — the Part 2 rule is that a variant is a MODEL,
// so it gets a model file, not a branch hidden inside somebody else's.
//
// The builders themselves still live with (or delegate to) the base character,
// because a variant shares the base's rig, shaders and clip set by design.
// What lives HERE is the authored intent: what differs, what is reused, what is
// approximated, and — for the two that were rebuilt — what was wrong before.
export { buildGojoUnblindfolded } from './gojo_unblindfolded.js';
export { buildShinjukuGojo } from './gojo_shinjuku.js';
export { buildModuloYuji } from './yuji_modulo.js';
export { buildShinjukuYuji } from './yuji_shinjuku.js';
export { buildDistortedMahito } from './mahito_distorted.js';
export { buildSukunaYuji } from './sukuna_yuji.js';
export { buildSukunaMegumi } from './sukuna_megumi.js';
