// THE SEWER — Mahito's hideout. Where he kept Junpei, and where the transfigured
// humans were stacked in the dark waiting to be used.
//
// REFERENCE NOTE (researched): a brick storm-sewer junction: barrel tunnels
// meeting in one vaulted chamber, a channel of black water running through the
// middle of it, raised maintenance ledges either side of the channel, iron rungs
// and grille walkways overhead, a sump pit at the low end, and one shaft of
// daylight coming down through a manhole. Damp brick, green light, standing
// water.
//
// WHY THIS MAP EXISTS IN THE SET: it is the lowest-ceilinged map here by a
// distance. Everything else gives you height; this gives you a junction, four
// tunnels and a gallery, and the vault is close enough overhead that vertical
// play is about the LEDGES, not about altitude. It is the map that punishes
// zoners and rewards anyone who wants the fight at arm's length — and it stays
// that map at 76 x 70 m, because what makes it claustrophobic is the ceiling
// and the tunnel bores, not the floor plan.
//
// LAYOUT (76 x 70 m):
//   y = -4.20  THE SUMP    a pit at the west end of the channel, two and a half
//                          metres below the water course. The lowest ground in
//                          the game and the only one with walls on four sides.
//   y = -1.40  CHANNEL     the water course through the middle. Walkable, and
//                          the low ground of the junction.
//   y =  0.00  LEDGES      the maintenance walks either side of the channel, and
//                          the floors of the four tunnels.
//   y =  4.60  GALLERY     a grille walkway ringing the junction chamber, off
//                          two stairs. Under it is the only cover from above.
//   VERTICAL               two stairs to the gallery, the channel steps, and the
//                          sump ramp.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'sewer_lair',
  name: 'THE SEWER',
  jp: '下水道',
  desc: "Mahito's junction. Brick, black water and a ceiling too close overhead.",
  // groundY is the CHANNEL floor: the ledges, tunnels and gallery are all
  // authored on top of it, so anywhere unpaved is the water course rather than
  // a shelf of nothing at ledge height.
  extent: { minX: -38, maxX: 38, minZ: -35, maxZ: 35, groundY: -1.4 },
  background: 0x060c0a,
  fog: { color: 0x0a1412, near: 18, far: 78 },
  grade: { vignette: 0.70, tint: [0.88, 1.06, 0.96], lift: 0.006, sat: 0.74 },
  lights: {
    key: { color: 0xbfe8cc, intensity: 1.15, pos: [2, 16, 4] },
    rim: { color: 0x4f8f7a, intensity: 0.72, pos: [-9, 6, -9] },
    hemi: { sky: 0x2c4a40, ground: 0x14170f, intensity: 0.52 }
  },
  previewCam: { pos: [21, 3.4, 18], look: [-5, 0.4, -4] },
  shadowScale: 0.72,
  shrineScale: 0.78,      // the most enclosed map in the set — the shrine has to be too
  size: '76 × 70 m · junction chamber, four tunnels, gallery, sump'
};

const CY = -1.4, LY = 0.0, GY = 4.6;
const SUMPY = -4.2;
const CX = 24;            // chamber half-extent
const CHW = 4;            // channel half-width
const BORE = 6;           // tunnel bore half-width
const VAULT = 7.2;        // chamber vault

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const CH = 'chamber';
  b.zone(CH, { x0: -38, x1: 38, z0: -35, z1: 35, y0: -6, y1: 10 }, false);

  b.sky(0x03060a, 0x061010, 0x0c1a16, 240);
  b.groundPlane(0x05100c, 160, -10);

  // ---- THE JUNCTION CHAMBER ----------------------------------------------
  // Ledges at 0, a channel down the middle at -1.4, and a barrel vault over it.
  b.floor(-CX, -CX, CX, -CHW, LY, { mat: M.tile, id: 'ledgeN' });
  b.floor(-CX, CHW, CX, CX, LY, { mat: M.tile, id: 'ledgeS' });
  // the channel, laid AROUND the sump: a slab over the sump would pave it, the
  // same way every "room below groundY" on this project has been paved at least
  // once. The pit needs the fallback floor lowered under it as well.
  b.floor(-10, -CHW, CX, CHW, CY, { mat: M.concrete });
  b.water(-9.6, -CHW + 0.2, CX - 0.4, CHW - 0.2, CY + 0.34, {
    shallow: 0x4f8f78, deep: 0x0a1c18, opacity: 0.72, caustic: 0.22
  });
  // the channel's sides, and the steps down into it at four points
  for (const s of [-1, 1]) {
    b.wall(-CX, s * CHW, CX, s * CHW, CY, LY, { mat: M.tileWall, thick: 0.3, collide: false });
    for (const x of [-4, 14]) {
      b.stairs(x - 1.6, s * (CHW - 0.2), x + 1.6, s * (CHW - 2.0), LY, CY, 'z',
        { mat: M.concrete, zone: CH });
    }
  }

  // ---- THE SUMP -----------------------------------------------------------
  // The west end of the channel drops into a pit. It is the only place in the
  // game with walls on four sides and one way out, which on the map built
  // around close-quarters fighting is worth having.
  b.pit(-CX + 2, -CHW, -10, CHW, SUMPY);
  b.floor(-CX + 2, -CHW, -10, CHW, SUMPY, { mat: M.concrete, id: 'sump' });
  b.water(-CX + 2.4, -CHW + 0.2, -10.4, CHW - 0.2, SUMPY + 0.5, {
    shallow: 0x3f7a66, deep: 0x061412, opacity: 0.78, caustic: 0.3
  });
  // The ramp back up to the channel, down the north side of the pit. Authored
  // LOW END FIRST and reaching all the way to the channel's own edge at x=-10:
  // a ramp that tops out two metres short of the floor it climbs to is a ramp
  // to a wall, and the pit would be a hole you cannot get out of.
  b.slope(-17, -CHW + 0.4, -10, -CHW + 3.2, SUMPY, CY, 'x',
    { mat: M.concrete, depth: 0.6, zone: CH });
  for (const [x0, z0, x1, z1] of [
    [-CX + 2, -CHW, -CX + 2, CHW], [-CX + 2, -CHW, -10, -CHW], [-CX + 2, CHW, -10, CHW]
  ]) {
    b.wall(x0, z0, x1, z1, SUMPY, CY - 0.12, { mat: M.tileWall, thick: 0.4, zone: CH });
  }
  // the pump that gives the pit a reason to exist
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 2.2, 10), M.metal);
    body.position.set(-20, SUMPY + 1.1, 0);
    b.add(body);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 6.0, 8), M.metal);
    pipe.position.set(-20, SUMPY + 3.6, 0);
    b.add(pipe);
    b.bounds.wall(-21.2, -1.2, -18.8, 1.2, SUMPY, SUMPY + 2.2, { id: 'pump' });
    b.bounds.platform(-21.2, -1.2, -18.8, 1.2, SUMPY + 2.2);
  }
  b.stripLight(-16, CY + 0.6, 0, 2.4, 'x', 0x6fe0a8, 0.8);

  // CHAMBER SHELL — brick, with a MOUTH cut in it for each of the four
  // tunnels. Built as four unbroken walls it would seal the junction off from
  // everything that joins it: four corridors visible through a solid wall.
  for (const s of [-1, 1]) {
    for (const [z0, z1] of [[-CX, -BORE], [BORE, CX]]) {
      b.wall(s * (CX + 0.4), z0, s * (CX + 0.4), z1, CY, VAULT, { mat: M.rust, zone: CH });
    }
    for (const [x0, x1] of [[-CX, -BORE], [BORE, CX]]) {
      b.wall(x0, s * (CX + 0.4), x1, s * (CX + 0.4), CY, VAULT, { mat: M.rust, zone: CH });
    }
    // The arch over each mouth runs from the tunnel's ceiling right up to the
    // chamber's — leave even 40 cm of daylight above it and you can see straight
    // out of the sewer through the gap.
    const ax = new THREE.BoxGeometry(0.5, VAULT - 4.8, BORE * 2 + 0.4);
    ax.translate(s * (CX + 0.4), (VAULT + 4.8) / 2, 0);
    b.static_(ax, M.rust, CH);
    b.bounds.wall(s * (CX + 0.15), -BORE, s * (CX + 0.65), BORE, 5.2, VAULT, { id: 'archX' + s });
    const az = new THREE.BoxGeometry(BORE * 2 + 0.4, VAULT - 4.8, 0.5);
    az.translate(0, (VAULT + 4.8) / 2, s * (CX + 0.4));
    b.static_(az, M.rust, CH);
    b.bounds.wall(-BORE, s * (CX + 0.15), BORE, s * (CX + 0.65), 5.2, VAULT, { id: 'archZ' + s });
  }
  {
    // THE VAULT. One unbroken slab first, oversized past the shell on every
    // side — the stepped bands underneath are the curve, and a stack of bands
    // alone leaks: each is smaller than the one below it, so at a grazing angle
    // you see the night sky in the gaps between them from inside a sewer.
    const cap = new THREE.BoxGeometry(58, 0.6, 58);
    cap.translate(0, VAULT, 0);
    b.static_(cap, M.rust, CH);
    for (let i = 0; i < 4; i++) {
      const inset = i * 1.6;
      const g = new THREE.BoxGeometry(49 - inset * 0.6, 0.44, 49 - inset * 2.2);
      g.translate(0, VAULT - 0.48 - i * 0.3, 0);
      b.static_(g, M.rust, CH);
    }
  }

  // ---- THE FOUR TUNNELS ---------------------------------------------------
  // Each is a real corridor with its own floor, a channel continuing down it,
  // and a vault overhead.
  const tunnel = (axis, sign, len) => {
    const zn = 'tun' + axis + sign;
    const along = axis === 'x';
    const a0 = CX, a1 = CX + len;
    const box = along
      ? { x0: sign > 0 ? a0 : -a1, x1: sign > 0 ? a1 : -a0, z0: -BORE, z1: BORE }
      : { x0: -BORE, x1: BORE, z0: sign > 0 ? a0 : -a1, z1: sign > 0 ? a1 : -a0 };
    // NOT an interior zone. Interior zones switch off unless a camera is inside
    // or within 8 m of them, and these are visible through open mouths from
    // anywhere in the junction — culled, the mouth becomes a hole in the wall
    // with the night sky behind it.
    b.zone(zn, { ...box, y0: -3, y1: 6 }, false);
    // ledges either side of a continuing channel
    if (along) {
      b.floor(box.x0, -BORE + 0.5, box.x1, -CHW, LY, { mat: M.tile, zone: zn });
      b.floor(box.x0, CHW, box.x1, BORE - 0.5, LY, { mat: M.tile, zone: zn });
      b.floor(box.x0, -CHW, box.x1, CHW, CY, { mat: M.concrete, zone: zn });
      b.wall(box.x0, -BORE, box.x1, -BORE, CY, 5.4, { mat: M.rust, zone: zn });
      b.wall(box.x0, BORE, box.x1, BORE, CY, 5.4, { mat: M.rust, zone: zn });
      b.ceiling(box.x0, -BORE, box.x1, BORE, 5.2, { mat: M.rust, zone: zn });
      b.wall(sign > 0 ? a1 : -a1, -BORE - 0.2, sign > 0 ? a1 : -a1, BORE + 0.2, CY, 6.0,
        { mat: M.rust, zone: zn });
    } else {
      b.floor(-BORE + 0.5, box.z0, -CHW, box.z1, LY, { mat: M.tile, zone: zn });
      b.floor(CHW, box.z0, BORE - 0.5, box.z1, LY, { mat: M.tile, zone: zn });
      b.floor(-CHW, box.z0, CHW, box.z1, CY, { mat: M.concrete, zone: zn });
      b.wall(-BORE, box.z0, -BORE, box.z1, CY, 5.4, { mat: M.rust, zone: zn });
      b.wall(BORE, box.z0, BORE, box.z1, CY, 5.4, { mat: M.rust, zone: zn });
      b.ceiling(-BORE, box.z0, BORE, box.z1, 5.2, { mat: M.rust, zone: zn });
      b.wall(-BORE - 0.2, sign > 0 ? a1 : -a1, BORE + 0.2, sign > 0 ? a1 : -a1, CY, 6.0,
        { mat: M.rust, zone: zn });
    }
    // ribs down the tunnel, and a lamp on every other one
    for (let i = 0; i < Math.floor(len / 3); i++) {
      const d = a0 + 1.5 + i * 3;
      const px = along ? sign * d : 0, pz = along ? 0 : sign * d;
      const rib = along
        ? new THREE.BoxGeometry(0.4, 6.6, BORE * 2)
        : new THREE.BoxGeometry(BORE * 2, 6.6, 0.4);
      rib.translate(px, (CY + 5.2) / 2 + 0.4, pz);
      b.static_(rib, M.rust, zn);
      if (i % 2 === 0) {
        b.stripLight(along ? px : px + 4.6, 4.6, along ? pz + 4.6 : pz, 1.6,
          along ? 'z' : 'x', 0x6fe0a8, i === 2 ? 0.6 : 0);
      }
    }
  };
  tunnel('x', -1, 13);
  tunnel('x', 1, 13);
  tunnel('z', -1, 10);
  tunnel('z', 1, 10);

  // ---- THE GALLERY --------------------------------------------------------
  // A grille walkway round the chamber at 4.6, laid with the two stairwells
  // already cut out of it so neither flight is buried under its own landing.
  const GI = 18;      // inner edge of the gallery ring
  const WELL_W = { x0: -CX, z0: -18, x1: -GI, z1: -6 };
  const WELL_E = { x0: GI, z0: 6, x1: CX, z1: 18 };
  b.floorHole(-CX, -CX, -GI, CX, GY, WELL_W, { mat: M.darkMetal, id: 'galW' });
  b.floorHole(GI, -CX, CX, CX, GY, WELL_E, { mat: M.darkMetal, id: 'galE' });
  b.floor(-GI, -CX, GI, -GI, GY, { mat: M.darkMetal, id: 'galN' });
  b.floor(-GI, GI, GI, CX, GY, { mat: M.darkMetal, id: 'galS' });
  // inner rail all the way round the void over the channel, gapped at the wells
  b.railing(-GI, -GI, GI, -GI, GY, { zone: CH });
  b.railing(-GI, GI, GI, GI, GY, { zone: CH });
  b.railing(-GI, -GI, -GI, -18, GY, { zone: CH, collide: false });
  b.railing(-GI, -6, -GI, GI, GY, { zone: CH });
  b.railing(GI, -GI, GI, 6, GY, { zone: CH });
  // the stairs: authored bottom-first, landing exactly on the well's far edge
  b.stairs(-CX + 0.6, -6.6, -GI - 0.3, -18, LY, GY, 'z', { mat: M.darkMetal, zone: CH });
  b.stairs(GI + 0.3, 6.6, CX - 0.6, 18, LY, GY, 'z', { mat: M.darkMetal, zone: CH });
  // brackets carrying the gallery off the chamber walls
  for (let i = 0; i < 12; i++) {
    for (const s of [-1, 1]) {
      const g = new THREE.BoxGeometry(4.6, 0.22, 0.22);
      g.translate(s * (CX - 2), GY - 0.35, -22 + i * 4);
      b.static_(g, M.darkMetal, CH);
    }
  }

  // ---- THE MANHOLE SHAFT --------------------------------------------------
  // The one clean light in the map, and the only thing above the vault.
  {
    // Through `b.godRay` rather than hand-rolled, so it leans (a vertical shaft
    // is midday and this map has no midday), breathes, and switches off at
    // range like every other prop. It is the ONE clean colour in a map lit
    // entirely in sick green, so it has to earn the frame it is in.
    b.godRay(-9, 8.9, 12, 3.0, 8.9, 0xd8f0c0,
      { opacity: 0.11, taper: 0.36, lean: [1.8, -2.4], poolGain: 1.2, range: 60 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 6, 18), M.darkMetal);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-9, 8.9, 12);
    b.add(ring);
  }

  // ---- DRESSING -----------------------------------------------------------
  // pipework along the chamber walls
  for (const s of [-1, 1]) {
    for (const y of [1.4, 2.3]) {
      const g = new THREE.CylinderGeometry(0.22, 0.22, 44, 8);
      g.rotateX(Math.PI / 2);
      g.translate(s * (CX - 0.6), y, 0);
      b.static_(g, M.metal, CH);
    }
  }
  // outfall grilles at the tunnel mouths
  for (const [x, z, ry] of [[-CX, 0, 1], [CX, 0, 1], [0, -CX, 0], [0, CX, 0]]) {
    const bars = [];
    for (let i = 0; i < 7; i++) {
      bars.push({ x: x + (ry ? 0 : -2.4 + i * 0.8), y: 1.4, z: z + (ry ? -2.4 + i * 0.8 : 0), ry: ry ? Math.PI / 2 : 0 });
    }
    b.repeat(new THREE.BoxGeometry(0.1, 3.6, 0.1), M.rust, bars);
  }
  // the crates and lockers Mahito's stock was stacked behind
  b.lockerBank(-20, LY, 11, Math.PI / 2, 5);
  b.lockerBank(20, LY, -11, -Math.PI / 2, 5);
  for (const [x, z] of [[-12, -16], [11, 16], [-6, 19], [15, -19], [-17, -9], [18, 9]]) {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const s = rand(0.7, 1.1);
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), M.wood);
      m.position.set(rand(-0.5, 0.5), s / 2 + i * 0.15, rand(-0.5, 0.5));
      m.rotation.y = rand(0, 3);
      g.add(m);
    }
    g.position.set(x, LY, z);
    b.add(g);
    // The stack is low enough to jump onto, so it gets a top: as one bare wall
    // a fighter who landed on the crates sank into the collider and was shoved
    // off sideways. Deck at the pile height, wall stopping just under it.
    b.bounds.wall(x - 0.8, z - 0.8, x + 0.8, z + 0.8, LY, LY + 0.98, { id: 'crate' + x + z });
    b.bounds.platform(x - 0.8, z - 0.8, x + 0.8, z + 0.8, LY + 1.1, { id: 'crate' + x + z, prop: true });
    b.breakable(g, {
      hp: 30, kind: 'wood', center: v3(x, LY + 0.6, z), radius: 0.9, height: 1.2, baseY: LY,
      colliderIds: ['crate' + x + z]
    });
  }
  // the flickering strips over the junction itself
  for (const [x, z] of [[-11, -11], [11, -11], [-11, 11], [11, 11], [0, 0]]) {
    b.stripLight(x, 6.6, z, 3.0, 'x', 0x8fe8b8, (x === 0 ? 0.7 : 0));
  }

  // =========================================================================
  // SOMEBODY LIVES DOWN HERE
  // =========================================================================
  // The lowest, tightest, greenest map in the set, and the one where the fact
  // that it is a HIDEOUT was doing the least work: it read as a well-built
  // storm sewer that happened to have crates in it. What follows is the
  // difference between a sewer and Mahito's sewer.

  // ---- HIS MARK -----------------------------------------------------------
  // Idle Transfiguration leaves a signature and this is where he did the work.
  // The big one is on the north ledge under the gallery — the most covered
  // floor on the map, which is where you would do it — and the small ones are
  // in the sump and at each tunnel mouth.
  b.sigil(-6, LY + 0.04, -14, 8.0, 0x9f5ad8, { rings: 3, spokes: 12, sides: 3, opacity: 0.26, spin: -0.06 });
  b.sigil(14, LY + 0.04, 15, 5.0, 0x9f5ad8, { rings: 2, spokes: 8, sides: 3, opacity: 0.24, spin: 0.11 });
  b.sigil(-17, SUMPY + 0.04, 0, 3.2, 0xd85a9f, { rings: 2, spokes: 6, sides: 3, opacity: 0.32, spin: 0.16 });

  // ---- THE OUTFALLS -------------------------------------------------------
  // A storm sewer with four tunnels feeding one channel and no water visibly
  // coming out of any of them was the map's biggest missing sound. Two outfall
  // pipes high on the chamber walls, pouring into the channel, plus the spill
  // over the lip into the sump.
  for (const s of [-1, 1]) {
    b.pipeRun(s * (CX - 1.4), 3.4, -CX + 2, s * (CX - 1.4), 3.4, CX - 2, { zone: CH });
    b.waterfall(s * (CX - 0.5), 3.0, s * 2.4, 1.6, 4.2,
      { ry: Math.PI / 2, color: 0x8fd8b8, opacity: 0.42, speed: 2.4 });
  }
  b.waterfall(-10.3, CY + 0.3, 0, 7.4, 2.5, { ry: Math.PI / 2, color: 0x7fc8a8, opacity: 0.46, speed: 2.8 });
  b.mist(-10, -CHW, CX, CHW, CY + 0.4, 0x6fa890, { opacity: 0.30, scale: 9 });
  b.mist(-CX + 2, -CHW, -10, CHW, SUMPY + 0.55, 0x5f9880, { opacity: 0.40, scale: 6 });
  b.steamVent(6, CY + 0.4, 0, { height: 3.2, period: 3.6, opacity: 0.22, color: 0xbfe8cc });
  b.steamVent(-16, CY + 0.4, 0, { height: 2.8, period: 4.4, opacity: 0.22, color: 0xbfe8cc });
  b.steamVent(-14, SUMPY + 0.6, 2, { height: 3.4, period: 5.2, opacity: 0.26, color: 0xbfe8cc });

  // ---- DEAD SERVICES ------------------------------------------------------
  // Cables slung under the vault, lamps hanging off the gallery, and the arcing
  // where the feed has come apart. The gallery's underside is the only cover
  // from above on this map and nothing was ever drawn on it.
  b.cable(v3(-CX, VAULT - 0.9, -14), v3(CX, VAULT - 1.6, 10), { sag: 2.2, r: 0.05 });
  b.cable(v3(-CX, VAULT - 1.4, 16), v3(CX, VAULT - 0.8, -8), { sag: 2.4, r: 0.04 });
  b.cable(v3(-8, GY - 0.5, -CX), v3(6, GY - 0.9, CX), { sag: 1.6, r: 0.04 });
  for (const [hx, hz] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) {
    b.hangingLamp(hx, GY - 0.4, hz, 1.1, 0x8fe8b8, { amp: 0.10, range: 40 });
  }
  b.sparker(-19, 2.6, -6, { color: 0xbfe4ff });
  b.sparker(19, 2.6, 6, { color: 0xbfe4ff });
  b.sparker(-9, GY - 0.6, 12, { color: 0xbfe4ff });
  b.beacon(-20, SUMPY + 3.0, 0, 0xd8402c, { reach: 3.8, rate: 0.8 });
  // tarpaulins strung between the gallery brackets, which is what makes it a
  // camp rather than a walkway
  b.banner(-CX + 2.6, GY - 0.5, -8, 3.0, 2.4, 0x3a4a3f, { ry: Math.PI / 2, amp: 0.14 });
  b.banner(CX - 2.6, GY - 0.5, 8, 3.0, 2.4, 0x3a4a3f, { ry: Math.PI / 2, amp: 0.14 });
  b.banner(-4, GY - 0.5, -CX + 2.6, 3.4, 2.2, 0x4a3f3a, { ry: 0, amp: 0.12 });

  // ---- THE STOCK ----------------------------------------------------------
  // Drums on both ledges, kept off the two stair runs and off the channel
  // steps. They are the gimmick here and they are the meanest version of it in
  // the set: this is the lowest ceiling in the game, so a chain going up
  // between the ledge and the gallery has nowhere to vent.
  for (let i = 0; i < 4; i++) b.drum(-9 - i * 1.05, LY, -21, { color: 0x4a6a4c, markColor: 0xd85a9f });
  for (let i = 0; i < 4; i++) b.drum(9 + i * 1.05, LY, 21, { color: 0x4a6a4c, markColor: 0xd85a9f });
  for (let i = 0; i < 3; i++) b.drum(-21 + i * 1.05, LY, 20, { color: 0x6a5a3c });
  for (let i = 0; i < 3; i++) b.drum(21 - i * 1.05, LY, -20, { color: 0x6a5a3c });
  b.crates(0, LY, -21, { count: 3 });
  b.crates(1.8, LY, -19.6, { count: 2 });
  b.crates(0, LY, 21, { count: 3 });
  b.crates(-1.8, LY, 19.6, { count: 2 });
  b.crates(-CX + 4, GY, -22, { count: 2 });
  b.crates(CX - 4, GY, 22, { count: 2 });

  // ---- AMBIENT ------------------------------------------------------------
  // drip from the vault, and the haze the green light hangs in
  b.particles(280, { x0: -22, x1: 22, y0: -1.2, y1: 6.8, z0: -22, z1: 22 },
    { color: 0x9fe0c0, size: 0.05, opacity: 0.42, vy: [-5.0, -2.2] });
  b.particles(150, { x0: -22, x1: 22, y0: -1.0, y1: 3.2, z0: -22, z1: 22 },
    { color: 0x6fb090, size: 0.11, opacity: 0.16, vy: [0.05, 0.3] });

  b.bounds.spawns = [v3(-11, LY, -11), v3(11, LY, 11), v3(-11, LY, 11), v3(11, LY, -11)];
  return b;
}
