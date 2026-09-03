// TEST RUNNER — plain node, no framework: `node fable5.1/test/run.mjs`.
// Each suite exports `suite(t)` and calls t(name, fn); a throw fails it.
const suites = ['./hits.mjs', './fighter.mjs', './roster.mjs', './effects.mjs'];
let pass = 0, fail = 0;
for (const s of suites) {
  const mod = await import(s);
  await mod.suite(async (name, fn) => {
    try { await fn(); pass++; console.log('  ok   ' + name); }
    catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n       ')); }
  });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
