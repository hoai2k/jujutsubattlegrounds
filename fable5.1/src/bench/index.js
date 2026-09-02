export async function startBench(name) {
  const mod = await import('./lineup.js');
  mod.startLineup(name);
}
