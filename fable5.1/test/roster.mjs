// ROSTER INTEGRITY — every pick resolves to a config, a look, a clip set and
// a full effect-table entry; nothing shipped is half-authored.
import { ROSTER, ROSTER_IDS, allPicks, pickInfo, resolveVariant, splitPick, SUMMONS } from '../src/roster/index.js';
import { LOOKS } from '../src/roster/specs/index.js';
import { makeClips } from '../src/art/anim/index.js';
import { HAIR } from '../src/art/character/hair.js';
import { GARMENTS } from '../src/art/character/garments.js';
import { FEATURES } from '../src/art/character/features.js';
import { EFFECTS } from '../src/combat/effects/table.js';
import { CONFIGS } from '../src/roster/configs/all.js';
import { eq, ok } from './assert.mjs';
export async function suite(t) {
  console.log('roster');
  t('32 base characters, 39 picks', () => { eq(ROSTER_IDS.length, 32); eq(allPicks().length, 39); });
  for (const pick of allPicks()) t(`pick ${pick} resolves`, () => {
    const { charId, variantId } = splitPick(pick); const r = resolveVariant(ROSTER[charId], charId, variantId);
    ok(r.config, 'config'); ok(r.config.stats?.hp > 0, 'hp'); ok(Array.isArray(r.config.punches) && r.config.punches.length >= 3, 'punch string'); ok(r.config.heavy, 'heavy');
    const look = LOOKS[r.look]; ok(look, 'look ' + r.look);
    if (look.hair) ok(HAIR[look.hair.style], 'hair style ' + look.hair.style);
    for (const g of look.outfit || []) ok(GARMENTS[g.piece], 'garment ' + g.piece);
    for (const f of look.features || []) ok(FEATURES[f.kind], 'feature ' + f.kind);
    const clips = makeClips(r.clipId); for (const c of ['idle', 'walk', 'run', 'punch1', 'punch2', 'punch3', 'hitLight', 'hitHeavy', 'knockdown', 'getup', 'launched', 'block', 'ko']) ok(clips.has(c), 'clip ' + c);
    const info = pickInfo(pick); ok(info.jp && info.accent && info.role, 'presentation');
  });
  t('every technique effect key in every config is in the effect table', () => {
    const missing = new Set();
    const walk = (o, path) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach((v, i) => walk(v, path + '[' + i + ']')); return; } for (const [k, v] of Object.entries(o)) { if (k === 'effect' && typeof v === 'string' && !EFFECTS[v]) missing.add(v); else walk(v, path + '.' + k); } };
    for (const [id, c] of Object.entries(CONFIGS)) walk(c, id);
    // keys that are handled by the fighter / domain systems rather than the table
    const handled = ['nobara_detonate'];
    const bad = [...missing].filter(k => !handled.includes(k));
    ok(bad.length === 0, 'missing: ' + bad.join(', '));
  });
  t('summons are not selectable', () => { ok(SUMMONS.mahoraga); ok(!ROSTER.mahoraga); ok(LOOKS.mahoraga); });
}
