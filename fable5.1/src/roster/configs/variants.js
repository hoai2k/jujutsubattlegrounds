// ===========================================================================
// CHARACTER VARIANTS
// ===========================================================================
// Some characters exist in more than one version — a different point in the
// story, a different power state, a different body. A variant is NOT a
// copy-pasted character: it is a base config plus an override patch, deep-
// merged at load time, so a fix to a base character propagates to every
// variant of it automatically.
//
// ---------------------------------------------------------------------------
// THE SCHEMA
// ---------------------------------------------------------------------------
// Each roster entry in characters/index.js carries a `variants` array. Every
// entry in it looks like this:
//
//   {
//     id:         'shinjuku',        // unique within this character
//     name:       'GOJO 【SHINJUKU】',// what the plates and the HUD show
//     descriptor: 'Blindfold off...', // one line, shown on the variant card
//     type:       'gameplay',         // 'cosmetic' | 'gameplay'
//     accent:     0x9fe0ff,           // optional: overrides the base accent
//     role:       'HOLLOW PURPLE ...',// optional: overrides the base role line
//     buildModel: buildShinjukuGojo,  // optional: a different model builder
//     clipId:     'gojo_shinjuku',    // optional: a different clip set
//     cpu:        'gojo_shinjuku',    // optional: a CPU profile key
//     overrides:  { ... }             // deep-merged over the base config
//   }
//
// THE BASE VERSION IS ITSELF AN ENTRY — always the first one, with no
// `overrides`. There is no special-casing anywhere between "base" and
// "variant": resolving `gojo:base` runs exactly the same code path as
// resolving `gojo:shinjuku`, it just merges an empty patch.
//
// ---------------------------------------------------------------------------
// WHAT A VARIANT MAY OVERRIDE
// ---------------------------------------------------------------------------
// `overrides` is deep-merged over the base config, so it may touch ANYTHING in
// it: display name, stats, individual punches, the heavy, ct1/ct2, the
// special, the ultimate, the whole domain block (including `refinement`),
// `copyEffect`, `soulless`, frame data, VFX colours — anything. Arrays are
// REPLACED rather than merged (a punch string is a unit; half-overriding one
// is never what you mean).
//
// Model, clips, accent, role and the CPU profile are entry-level rather than
// config-level, because they are not part of the balance surface.
//
// ---------------------------------------------------------------------------
// COSMETIC IS ENFORCED, NOT PROMISED
// ---------------------------------------------------------------------------
// A variant marked `cosmetic` may only override `name`, `title` and `jpName`.
// Anything else in `overrides` is a load-time throw with the offending key
// named. That is deliberately blunt: "cosmetic" has to mean the numbers are
// bit-identical to the base, and the only way to guarantee that is to refuse
// the patch rather than trust the author.
//
// ---------------------------------------------------------------------------
// `cfg.id` DOES NOT CHANGE
// ---------------------------------------------------------------------------
// This is the load-bearing decision in the whole feature. A resolved variant
// config keeps the BASE character's `id` — Shinjuku Gojo is still `id: 'gojo'`
// — and carries the variant on two new fields, `variant` and `variantType`.
//
// Everything in the codebase that switches on `cfg.id` (the domain cast sound,
// the ritual gate, the model viewer, the debug overlay) therefore keeps
// working untouched, while everything that reads BEHAVIOUR off the config
// resolves per-variant for free, because it was already reading the config
// rather than the character name:
//
//   · Yuta's Copy            reads src.cfg.copyEffect
//   · Mahoraga's adaptation  reads hit.src, which comes from the effect KEY the
//                            variant's own move declares (effects.srcFor)
//   · Higuruma's Confiscation reads the fighter's own slotUse ledger
//   · Domain clash           reads cfg.domain.refinement
//   · Instant KO             reads cfg.soulless
//
// So a variant that changes its ct1 effect key is automatically adapted-to
// separately by Mahoraga, and a variant that changes its domain refinement
// automatically clashes differently. No call site needed to learn about
// variants.
// ---------------------------------------------------------------------------

// Keys a cosmetic variant is allowed to touch. Everything else is a throw.
const COSMETIC_OK = new Set(['name', 'title', 'jpName']);

// Deep merge, arrays replaced. Returns a NEW object — the base config is never
// mutated, which matters because the base is a module singleton shared by
// every variant of that character and by the base entry itself.
function merge(base, patch) {
  if (patch === undefined) return base;
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = Array.isArray(base) ? {} : { ...(base || {}) };
  for (const k of Object.keys(patch)) {
    const b = base ? base[k] : undefined;
    const p = patch[k];
    out[k] = (p && typeof p === 'object' && !Array.isArray(p) && b && typeof b === 'object' && !Array.isArray(b))
      ? merge(b, p) : (Array.isArray(p) ? p.map(x => (x && typeof x === 'object' && !Array.isArray(x)) ? { ...x } : x) : p);
  }
  return out;
}

// Loud, early, and it names the key. A cosmetic variant that quietly carried a
// stat change would be the worst possible failure mode for this feature.
function assertCosmetic(charId, v) {
  const bad = Object.keys(v.overrides || {}).filter(k => !COSMETIC_OK.has(k));
  if (bad.length) {
    throw new Error(
      `[variants] ${charId}:${v.id} is marked COSMETIC but overrides ` +
      bad.join(', ') + '. A cosmetic variant may only change ' +
      [...COSMETIC_OK].join('/') + ' — mark it type:"gameplay" or remove the override.');
  }
}

// ---------------------------------------------------------------------------
// Normalise a roster entry into a variant list. A character with no `variants`
// declared gets a single implicit base entry, so every character in the game
// has at least one variant and the select flow has exactly one shape.
export function variantsOf(entry, charId) {
  if (entry.__variants) return entry.__variants;
  const list = (entry.variants && entry.variants.length)
    ? entry.variants
    : [{ id: 'base', name: entry.config.name, descriptor: entry.role, type: 'cosmetic' }];
  for (const v of list) {
    if (v.type === 'cosmetic') assertCosmetic(charId, v);
    else if (v.type !== 'gameplay') {
      throw new Error(`[variants] ${charId}:${v.id} has no valid type (want 'cosmetic' or 'gameplay')`);
    }
  }
  const ids = list.map(v => v.id);
  if (new Set(ids).size !== ids.length) throw new Error('[variants] duplicate id in ' + charId);
  entry.__variants = list;
  return list;
}

export function hasVariants(entry) { return (entry.variants?.length ?? 0) > 1; }

export function variantEntry(entry, charId, variantId) {
  const list = variantsOf(entry, charId);
  return list.find(v => v.id === variantId) || list[0];
}

// ---------------------------------------------------------------------------
// Resolve a (character, variant) pair into the shape the rest of the game
// wants: a config, a model builder, a clip id, and the presentation fields.
// Configs are cached per pair — they are immutable data and building one costs
// a deep merge, so there is no reason to redo it every match.
const _cache = new Map();
export function resolveVariant(entry, charId, variantId) {
  const v = variantEntry(entry, charId, variantId);
  const key = charId + ':' + v.id;
  let config = _cache.get(key);
  if (!config) {
    config = merge(entry.config, v.overrides);
    // The two fields that carry the variant. `id` is deliberately NOT touched.
    config.variant = v.id;
    config.variantType = v.type;
    config.variantName = v.name;
    if (v.id !== 'base') config.name = v.name;
    Object.freeze(config);
    _cache.set(key, config);
  }
  return {
    config, variant: v,
    look: v.look || entry.look || charId,
    clipId: v.clipId || charId,
    cpuProfile: v.cpu || null,
    jp: v.jp || entry.jp,
    accent: v.accent ?? entry.accent,
    role: v.role || entry.role
  };
}

// ---------------------------------------------------------------------------
// PICK IDS. A pick is a string: 'gojo' (the base) or 'gojo:shinjuku'. Every
// existing call site that passes a bare character id keeps working, which is
// what let the select screen, the CPU picker and the map preview stay
// untouched until they actually needed to care.
export function splitPick(pick) {
  const i = String(pick).indexOf(':');
  return i < 0 ? { charId: pick, variantId: 'base' } : { charId: pick.slice(0, i), variantId: pick.slice(i + 1) };
}
export function joinPick(charId, variantId) {
  return (!variantId || variantId === 'base') ? charId : charId + ':' + variantId;
}

// ---------------------------------------------------------------------------
// LAST-USED MEMORY, per character, persisted alongside the other settings.
const LS_KEY = 'jujutsu-battlegrounds.variants';
const OLD_LS_KEY = 'cursed-arena.variants';   // pre-rename key; read-only fallback
let _last = null;
function loadLast() {
  if (_last) return _last;
  try { _last = JSON.parse(localStorage.getItem(LS_KEY) ?? localStorage.getItem(OLD_LS_KEY) ?? '{}'); } catch (e) { _last = {}; }
  return _last;
}
export function lastVariant(charId) { return loadLast()[charId] || 'base'; }
export function rememberVariant(charId, variantId) {
  const m = loadLast();
  m[charId] = variantId;
  try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch (e) { /* private mode */ }
}
