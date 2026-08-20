// ROSTER COMPLETENESS — the check that would have caught three dead buttons.
//
// ===========================================================================
// WHY THIS FILE EXISTS
// ===========================================================================
// Maki, Yuki and Miwa shipped with taunt CLIPS and no taunt ENTRIES, and with
// finisher-less registries. Both failures are silent by design — `tauntsFor`
// returns an empty list for an unlisted character and `tryTaunt` bails without
// costing the cooldown, and `pickFinisher` returns null and the match goes
// straight to the win screen — which is the right behaviour for a
// half-authored character and the wrong behaviour for a shipped one.
//
// Nothing in the build catches it, because nothing is broken: the game runs
// perfectly with a character who cannot taunt. Only a player pressing the
// button finds out, which is exactly what happened.
//
// So this walks EVERY selectable pick and asserts the whole per-character
// surface is present. It is a plain node script with no test framework,
// matching test/online — run it with:
//
//     node test/roster.mjs
//
// It exits non-zero on the first missing thing, and prints a table either way.
import { ROSTER_IDS, ROSTER, allPicks, makeCharacter, pickInfo } from '../src/characters/index.js';
import { tauntsFor } from '../src/combat/taunts.js';
import { finishersFor } from '../src/finishers/registry.js';
import { makeClips } from '../src/art/anim/index.js';

const problems = [];
const rows = [];

// ---------------------------------------------------------------------------
// EVERY BASE CHARACTER
// ---------------------------------------------------------------------------
for (const id of ROSTER_IDS) {
  const entry = ROSTER[id];
  const cfg = entry.config;
  const clips = makeClips(id);
  const row = { id, taunt: '', finisher: '', clips: clips.size, issues: [] };

  // ---- TAUNTS -------------------------------------------------------------
  const taunts = tauntsFor(id);
  if (!taunts.length) {
    row.issues.push('NO TAUNT ENTRY');
  } else {
    row.taunt = taunts.length + '×';
    // an entry pointing at a clip the character does not have is the same
    // dead button by another route, and is what `tryTaunt` silently refuses
    for (const t of taunts) {
      if (!clips.has(t.clip)) row.issues.push(`taunt clip missing: ${t.clip}`);
      if (!t.cue) row.issues.push('taunt has no audio cue');
      if (!t.dur) row.issues.push('taunt has no duration');
    }
  }

  // ---- FINISHERS ----------------------------------------------------------
  const fins = finishersFor(id, cfg);
  if (!fins.length) row.issues.push('NO FINISHER');
  else {
    row.finisher = fins.map(f => f.id).join(',');
    for (const f of fins) {
      if (!f.actions?.length) row.issues.push(`finisher ${f.id} has no actions`);
      if (!f.color) row.issues.push(`finisher ${f.id} has no colour`);
    }
  }

  // ---- THE SHARED STATE MACHINE'S CLIP CONTRACT ---------------------------
  // Every clip combat/fighter.js can ask for from any state. A character
  // missing one of these does not crash — `_clip` falls through — but the
  // pose snaps, which is the other silent failure this file is for.
  const REQUIRED = [
    'idle', 'walk', 'run', 'dash', 'jump', 'fall', 'land', 'block', 'blockHit',
    'guardBreak', 'hitLight', 'hitHeavy', 'launched', 'knockdown', 'getup',
    'ko', 'defeat', 'stunned', 'techRise', 'punch1', 'punch2', 'punch3', 'heavy'
  ];
  for (const c of REQUIRED) if (!clips.has(c)) row.issues.push(`missing clip: ${c}`);

  // ---- THE BUTTONS --------------------------------------------------------
  // Each of these is a slot a player will press. A character with no entry is
  // legitimate (Mahoraga has no ultimate and says so with `noUltimate`), but
  // it has to be DECLARED rather than absent.
  if (!cfg.special) row.issues.push('no B (special)');
  if (!cfg.ultimate && !cfg.noUltimate && !cfg.domain) row.issues.push('no D-pad Right and no `noUltimate`');
  // ct1/ct2 come from the arsenal or the stance for the characters that have
  // one, so the check follows the same resolution `_def` does
  const hasCT = k => !!(cfg[k]
    || (cfg.arsenal && Object.values(cfg.arsenal.weapons ?? {}).every(w => w[k]))
    || (cfg.cores && Object.values(cfg.cores.defs ?? {}).every(c => c[k]))
    || cfg.shikigami || cfg.curses || cfg.commands);
  if (!hasCT('ct1')) row.issues.push('no RB (ct1)');
  if (!hasCT('ct2')) row.issues.push('no RT (ct2)');

  // ---- IT HAS TO BUILD ----------------------------------------------------
  try {
    const made = makeCharacter(id);
    if (!made.model) row.issues.push('model did not build');
    // fx/impactgeo.js tints every punch by this
    if (!made.model?.palette?.accent) row.issues.push('no accent on the model palette');
  } catch (e) {
    row.issues.push('makeCharacter threw: ' + e.message);
  }

  if (!pickInfo(id)) row.issues.push('pickInfo returned nothing');

  rows.push(row);
  if (row.issues.length) problems.push(`${id}: ${row.issues.join(' · ')}`);
}

// ---------------------------------------------------------------------------
// EVERY VARIANT, for the taunt and finisher fallbacks
// ---------------------------------------------------------------------------
// A variant with no entry of its own SHARES its base character's, which is the
// right answer for a cosmetic one — so the assertion is that resolution finds
// something, not that the variant declares it.
for (const pick of allPicks()) {
  if (!pick.includes(':')) continue;
  if (!tauntsFor(pick).length) problems.push(`${pick}: variant resolves to NO TAUNT`);
  const info = pickInfo(pick);
  if (!info) problems.push(`${pick}: pickInfo returned nothing`);
  if (info && !finishersFor(pick, info.config).length) {
    problems.push(`${pick}: variant resolves to NO FINISHER`);
  }
}

// ---------------------------------------------------------------------------
// THE SLOT CONVENTION — advisory, not an assertion
// ---------------------------------------------------------------------------
// RB holds the furthest-reaching technique of the pair and RT the strongest
// (schema.js, THE SLOT CONVENTION). This prints both slots' reach and damage
// so a NEW character's pair can be checked against it at author time.
//
// It does NOT fail the run, and that is deliberate rather than a missing
// assertion. Four shapes on the roster break the rule on purpose — the
// strongest move that is also the furthest, an RT that is a stance or a buff
// rather than an attack, slots filled from a wheel, a hold that changes the
// move — and the numbers here cannot tell those apart from a mistake: a
// Soul Wound and a Cursed Bud are worth more than the `dmg` they carry, and
// Sukuna's 40 m Fire Arrow is not in the config at all. A check that cried
// wolf on a third of the roster would be read past, which is worse than a
// table somebody looks at. Read the exception list in schema.js before
// concluding a row is wrong.
const reachOf = d => Math.max(d?.range ?? 0, d?.reach ?? 0, d?.aimRange ?? 0,
  d?.travel ?? 0, d?.radius ?? 0, ...(d?.rangeByTier ?? [0]));
const dmgOf = d => (d?.dmg ?? 0) + (d?.dmg2 ?? 0);
const slotRows = [];
for (const id of ROSTER_IDS) {
  const cfg = ROSTER[id].config;
  const sets = [];
  // Panda keeps the stance bodies in `stances`; Toji and Maki theirs in the
  // arsenal. Where a character has those, the top-level ct1/ct2 are a copy of
  // one of them (see the note in panda.js) and would just print twice.
  const owned = { ...(cfg.arsenal?.weapons ?? {}), ...(cfg.stances ?? {}) };
  for (const [k, w] of Object.entries(owned)) if (w.ct1 && w.ct2) sets.push([k, w.ct1, w.ct2]);
  if (!sets.length && cfg.ct1 && cfg.ct2) sets.push(['', cfg.ct1, cfg.ct2]);
  for (const [tag, a, b] of sets) {
    const r1 = reachOf(a), r2 = reachOf(b), d1 = dmgOf(a), d2 = dmgOf(b);
    // a wheel slot carries no move of its own, so there is nothing to compare
    const wheel = !r1 && !r2 && !d1 && !d2;
    const mark = wheel ? 'wheel'
      : (r1 >= r2 ? '' : 'reach') + (d2 >= d1 ? '' : (r1 >= r2 ? 'dmg' : '+dmg'));
    slotRows.push({ id: id + (tag ? ':' + tag : ''), a, b, r1, r2, d1, d2, mark: mark || 'ok' });
  }
}

// ---------------------------------------------------------------------------
const pad = (v, n) => String(v).padEnd(n);
console.log(pad('CHARACTER', 12), pad('TAUNT', 7), pad('CLIPS', 6), 'FINISHER');
for (const r of rows) {
  console.log(pad(r.id, 12), pad(r.taunt || '—', 7), pad(r.clips, 6), r.finisher || '—',
    r.issues.length ? '   <-- ' + r.issues.join(' · ') : '');
}
console.log(`\n${rows.length} characters · ${allPicks().length} selectable picks`);

console.log('\nSLOT CONVENTION — RB should reach furthest, RT should hit hardest');
console.log(' ', pad('CHARACTER', 20), pad('RB · ct1', 34), pad('RT · ct2', 34));
for (const r of slotRows) {
  const L = `${r.a.name} (${r.r1} m, ${r.d1})`, R = `${r.b.name} (${r.r2} m, ${r.d2})`;
  console.log(' ', pad(r.id, 20), pad(L, 34), pad(R, 34), r.mark === 'ok' ? '' : '<-- ' + r.mark);
}
console.log('  (advisory only — see THE SLOT CONVENTION in src/characters/schema.js)');

if (problems.length) {
  console.error('\nFAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log('\nOK — every pick has a taunt, a finisher, the full clip contract and every button.');
