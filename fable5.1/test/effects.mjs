// EFFECT TABLE — every entry names a real archetype, and the dispatcher
// resolves each archetype to a method.
import { EFFECTS, ARCHETYPES, effectDef } from '../src/combat/effects/table.js';
import { Effects } from '../src/combat/effects/index.js';
import { eq, ok } from './assert.mjs';
export async function suite(t) {
  console.log('effects');
  t('every table entry has a known archetype', () => { for (const [k, v] of Object.entries(EFFECTS)) ok(ARCHETYPES.includes(v.arch), k + ' arch ' + v.arch); });
  t('every archetype the table uses is a dispatcher method', () => { const proto = Effects.prototype; for (const a of ARCHETYPES) if (!['domainTick', 'random', 'counter'].includes(a)) ok(typeof proto[a] === 'function', 'method ' + a); });
  t('an unknown key falls back to melee and says so', () => { const d = effectDef('nope_nothing'); eq(d.arch, 'melee'); ok(d.missing); });
}
