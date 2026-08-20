(async()=>{
  // ---- URO'S FLIGHT vs EVERY MAP ------------------------------------------
  // For each map: sample the reachable ceiling on a grid, and check that at no
  // sample can she (a) rise above the map's own tallest walkable surface by
  // more than her own maxHeight, or (b) get outside the bounds rect.
  const { MAPS, MAP_IDS, buildMap } = await import('/src/arena/index.js');
  const { URO } = await import('/src/characters/uro.js');
  const F = URO.flight;
  const rows = [];
  for (const id of MAP_IDS) {
    const entry = MAPS[id];
    // build the map's bounds without a scene: `build` needs a root, so use a
    // throwaway group
    let built = null;
    try { built = buildMap(id, {}); } catch (e) { rows.push({ id, err: String(e.message).slice(0,70) }); continue; }
    const b = built?.bounds ?? null;
    if (!b || !b.floorAt) { rows.push({ id, err: 'no bounds' }); continue; }
    let maxCeil = -Infinity, maxAbove = -Infinity, worst = null, capped = 0, samples = 0;
    let topFloor = -Infinity;
    const N = 26;
    for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) {
      const x = b.minX + (b.maxX - b.minX) * (i + 0.5) / N;
      const z = b.minZ + (b.maxZ - b.minZ) * (k + 0.5) / N;
      const top = b.floorAt(x, z, Infinity);
      topFloor = Math.max(topFloor, top);
      // *** THE INTERIOR CASE. *** Stand on the LOWEST floor at this cell (the
      // one a fighter walking in at ground level is on) and ask what is over
      // her head. Sampling from the highest floor instead — which the first
      // version of this harness did — asks what is above a rooftop, and the
      // answer is trivially nothing.
      const floor = b.floorAt(x, z, b.groundY + 1.2);
      let cap = floor + F.maxHeight;
      const over = b.ceilingAt ? b.ceilingAt(x, z, floor + 0.1) : Infinity;
      if (Number.isFinite(over)) { cap = Math.min(cap, over - F.headroom); capped++; }
      const lid = MAPS[id].def.flightCeiling;
      if (typeof lid === 'number') cap = Math.min(cap, lid);
      cap = Math.max(floor + 0.35, cap);
      samples++;
      if (cap > maxCeil) { maxCeil = cap; worst = { x:+x.toFixed(1), z:+z.toFixed(1), floor:+floor.toFixed(1) }; }
      if (Number.isFinite(over)) { maxAbove = Math.max(maxAbove, over); }
    }
    rows.push({
      id, size: `${(b.maxX-b.minX).toFixed(0)}x${(b.maxZ-b.minZ).toFixed(0)}`,
      topWalkable: +topFloor.toFixed(2),
      maxFlightCeiling: +maxCeil.toFixed(2),
      aboveTopWalkable: +(maxCeil - topFloor).toFixed(2),
      cellsWithRoofOverhead: capped, cells: samples, lowestRoofSeen: Number.isFinite(maxAbove) ? +maxAbove.toFixed(2) : null, worst
    });
  }
  return rows;
})()
