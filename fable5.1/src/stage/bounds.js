// BOUNDS — the collision model every map registers into: a floor field
// (height per xz, from stacked rects), wall boxes, and the arena rect.
export class Bounds {
  constructor(extent) {
    this.extent = extent; this.floors = []; this.walls = []; this.groundY = extent.groundY ?? 0;
  }
  addFloor(minX, maxX, minZ, maxZ, y) { this.floors.push({ minX, maxX, minZ, maxZ, y }); }
  addWall(minX, maxX, minZ, maxZ, y0 = 0, y1 = 4) { this.walls.push({ minX, maxX, minZ, maxZ, y0, y1 }); }
  floorAt(x, z, below) {
    let best = this.groundY;
    for (const f of this.floors) if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ && f.y <= below && f.y > best) best = f.y;
    return best;
  }
  clampXZ(p, pad = 0.3) {
    const e = this.extent;
    p.x = Math.max(e.minX + pad, Math.min(e.maxX - pad, p.x));
    p.z = Math.max(e.minZ + pad, Math.min(e.maxZ - pad, p.z));
  }
  resolveWalls(p, r = 0.35) {
    for (const w of this.walls) {
      if (p.y + 0.5 < w.y0 || p.y > w.y1) continue;
      if (p.x < w.minX - r || p.x > w.maxX + r || p.z < w.minZ - r || p.z > w.maxZ + r) continue;
      const dl = p.x - (w.minX - r), dr = (w.maxX + r) - p.x, dn = p.z - (w.minZ - r), df = (w.maxZ + r) - p.z;
      const m = Math.min(dl, dr, dn, df);
      if (m === dl) p.x = w.minX - r; else if (m === dr) p.x = w.maxX + r; else if (m === dn) p.z = w.minZ - r; else p.z = w.maxZ + r;
    }
  }
  hitsWall(p) { for (const w of this.walls) if (p.x >= w.minX && p.x <= w.maxX && p.z >= w.minZ && p.z <= w.maxZ && p.y >= w.y0 && p.y <= w.y1) return true; const e = this.extent; return p.x < e.minX || p.x > e.maxX || p.z < e.minZ || p.z > e.maxZ; }
  // fraction along a->b before a wall is hit (1 = clear)
  raySweep(a, b, r = 0.3) {
    const n = 12;
    for (let i = 1; i <= n; i++) { const t = i / n; const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, z = a.z + (b.z - a.z) * t; for (const w of this.walls) if (x > w.minX - r && x < w.maxX + r && z > w.minZ - r && z < w.maxZ + r && y > w.y0 && y < w.y1) return Math.max(0, (i - 1) / n); }
    return 1;
  }
}
