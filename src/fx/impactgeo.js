// IMPACT GEOMETRY — real 3D constructs for hits that have no technique behind
// them.
//
// ===========================================================================
// WHY THIS EXISTS
// ===========================================================================
// Every technique in this game brings its own art: Gojo's Red is an orb, Toji's
// spear is a spear, Nobara's nails are nails. But a PUNCH had nothing except a
// camera-facing spark card and a screen shake — which is fine at one hit and
// invisible at twenty, because a billboard has no orientation, no volume and
// no relationship to the direction the blow travelled. The basic string is the
// most-thrown thing in the game and it was the least interesting.
//
// So: actual meshes, built procedurally, oriented along the strike, and
// animated in world space. Nothing here is a sprite and nothing here is
// camera-facing. The whole point is that these things have a SHAPE that tells
// you where the hit came from and how hard it was.
//
// ===========================================================================
// THE SIX CONSTRUCTS, and what each one is for
// ===========================================================================
//   CONE      compressed air driven out ALONG the strike. The one that carries
//             direction — it is a hollow cone opening away from the fist, so
//             its axis IS the punch's axis and you can read where a blow came
//             from off a freeze-frame.
//   RING      a torus standing PERPENDICULAR to the strike (not lying flat and
//             not billboarded), expanding and thinning. The one that carries
//             force.
//   SHARDS    angular wedges thrown outward and tumbling. The one that carries
//             violence — they are the only part with randomness in them, and
//             they are what makes two identical punches not look identical.
//   BURST     a faceted low-poly sphere that expands hard and collapses. The
//             one that carries the INSTANT — it lives for a tenth of a second
//             and is mostly gone before the eye finds it, which is exactly
//             what a contact frame should do.
//   PLATE     a cracked ground disc with radial ridges, for knockdowns only.
//             The one that carries consequence, and the only one that touches
//             the floor.
//   STAR      six spikes on the three world axes, for ratio crits only. The
//             one that carries the EXCEPTION — it is the only construct that
//             ignores the strike axis, because a crit is not about the
//             direction the blow came from.
//
// ===========================================================================
// THE WEIGHT LADDER
// ===========================================================================
// Four tiers, and each one ADDS to the last rather than replacing it, so the
// escalation is legible: a crit is visibly a knockdown plus more, a knockdown
// is visibly a heavy plus more. Getting hit harder should look like getting
// hit in the same way, more.
//
//   light      BURST + a small CONE
//   heavy      + RING + 5 SHARDS
//   knockdown  + PLATE on the floor + 9 SHARDS + a bigger RING
//   crit       + a second counter-rotating RING and a spike STAR
//
// ===========================================================================
// COLOUR
// ===========================================================================
// Tinted by the ATTACKER'S accent where the model carries one, so Maki's
// punches throw jade geometry and Yuki's throw indigo, and a player learns
// whose hit landed from the colour of the debris. Falls back to a neutral bone
// white, which is what the roster's older models get.
//
// Everything is additive and depth-write-off, which is what keeps a stack of
// these from turning into a grey wall when four land in a second.
import * as THREE from 'three';
import { v3, rand } from '../core/mathutil.js';

const WHITE = 0xf4f6ff;

// A deterministic-ish spread that still differs per call. Impact debris is the
// one place in this file where variation matters more than reproducibility —
// these meshes never touch gameplay, so `rand` is safe here in a way it is not
// in a hit resolver.
const spread = () => rand(-1, 1);

// ---------------------------------------------------------------------------
// TWO MATERIALS, AND THE REASON THERE ARE TWO
// ---------------------------------------------------------------------------
// The first version made everything ADDITIVE, and on a dark map it looked
// right. On Jujutsu High — pale concrete under a bright sky — the entire
// system was INVISIBLE: additive blending adds light, and there is no light
// left to add over a surface that is already near-white. Verified by spawning
// the constructs and confirming they were in the scene graph, visible, at the
// right world position, and still could not be seen.
//
// So the set is split by what each construct IS:
//
//   `glow`  ENERGY — the burst, the cone, the rings, the star. These are
//           genuinely light, so additive is correct, and they are drawn at
//           much higher opacity than before so they survive a bright ground.
//   `chunk` MATTER — the shards and the ground plate. These are physical
//           debris and were never light in the first place; they use normal
//           blending, which means they read as objects against ANY background
//           because they occlude it rather than adding to it.
function glow(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
}
function chunk(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
  });
}

// ---------------------------------------------------------------------------
// THE CONE — compressed air, driven out along the strike axis
// ---------------------------------------------------------------------------
// Open at both ends, so it reads as a shell of moving air rather than as a
// solid dunce cap. It starts SHORT AND FAT at the contact point and stretches
// away from the attacker as it fades, which is the shape a shockwave leaving a
// surface actually makes.
function makeCone(color, r, len) {
  const g = new THREE.ConeGeometry(r, len, 14, 1, true);
  // stand it so the TIP is at the origin and the mouth opens along +Z
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, len / 2);
  return new THREE.Mesh(g, glow(color, 0.85));
}

// ---------------------------------------------------------------------------
// THE RING — a torus standing across the strike
// ---------------------------------------------------------------------------
function makeRing(color, r, thick) {
  return new THREE.Mesh(new THREE.TorusGeometry(r, thick, 5, 20), glow(color, 0.9));
}

// ---------------------------------------------------------------------------
// THE SHARDS — angular wedges, thrown and tumbling
// ---------------------------------------------------------------------------
// Three-sided pyramids rather than boxes: a wedge has a point, and a point
// tumbling through the air reads as debris where a cube reads as a crate.
function makeShard(color, size) {
  const g = new THREE.ConeGeometry(size * 0.34, size, 3);
  g.rotateX(Math.PI / 2);
  // MATTER, not light — see the note on `chunk`
  return new THREE.Mesh(g, chunk(color, 1));
}

// ---------------------------------------------------------------------------
// THE BURST — a faceted sphere for the contact instant
// ---------------------------------------------------------------------------
// An icosahedron at detail 0 is twenty flat triangles, which is exactly the
// right amount of structure: enough that the silhouette has corners, few
// enough that it never reads as a ball.
function makeBurst(color, r) {
  return new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), glow(color, 0.9));
}

// ---------------------------------------------------------------------------
// THE PLATE — the floor giving up, for knockdowns
// ---------------------------------------------------------------------------
// A flat disc with a ring of radial ridges standing off it. The ridges are
// what sell it: a plain disc is a decal, and a decal on the floor under a
// body that has just hit the floor is invisible.
function makePlate(color, r) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.RingGeometry(r * 0.25, r, 22, 1), chunk(color, 0.75));
  disc.rotation.x = -Math.PI / 2;
  g.add(disc);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand(-0.12, 0.12);
    const len = r * rand(0.7, 1.5);
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(r * 0.08, r * 0.14, len), chunk(color, 1));
    ridge.position.set(Math.cos(a) * len * 0.5, r * 0.05, Math.sin(a) * len * 0.5);
    ridge.rotation.y = -a;
    g.add(ridge);
  }
  return g;
}

// ---------------------------------------------------------------------------
// THE STAR — crits only
// ---------------------------------------------------------------------------
// Six spikes on three axes. It is the only construct with no volume at all,
// and it exists to be the thing that is different about a crit at a glance.
function makeStar(color, r) {
  const g = new THREE.Group();
  for (const axis of [v3(1, 0, 0), v3(0, 1, 0), v3(0, 0, 1)]) {
    for (const s of [1, -1]) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(r * 0.13, r, 4), glow(color, 0.95));
      const dir = axis.clone().multiplyScalar(s);
      spike.position.copy(dir).multiplyScalar(r * 0.5);
      spike.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
      g.add(spike);
    }
  }
  return g;
}

// ===========================================================================
// THE ONE ENTRY POINT
// ===========================================================================
// `at`     world contact point
// `dir`    the strike direction (unit, horizontal) — the cone's axis
// `weight` 'light' | 'heavy' | 'knockdown' | 'crit'
// `color`  the attacker's accent, or undefined for the neutral default
// `floorY` where the plate should sit, for knockdowns
//
// Every construct goes through `fx.prop(node, life, onUpdate)`, which owns the
// scene add, the per-frame call and the disposal — so nothing here has to be
// cleaned up by hand and nothing leaks across a round boundary.
export function impactGeo(fx, at, dir, weight = 'light', color = WHITE, floorY = null) {
  const heavy = weight !== 'light';
  const knock = weight === 'knockdown' || weight === 'crit';
  const crit = weight === 'crit';
  // PASS 3. Pass 1 was invisible and pass 2 over-corrected to 1.55x, which put
  // a three-metre ring on a jab and filled the screen. The invisibility was
  // never the SIZE — it was the additive blending disappearing against a pale
  // floor, fixed by the `chunk` material above — so the scale only needed the
  // small nudge that makes a construct read at gameplay camera distance
  // without competing with the technique effects.
  const k = (crit ? 1.5 : knock ? 1.25 : heavy ? 1.0 : 0.72) * 1.05;

  // the strike basis: `fwd` is the punch's own axis, and every construct is
  // oriented off it rather than off the camera
  const fwd = (dir && dir.lengthSq() > 1e-5) ? dir.clone().normalize() : v3(0, 0, 1);
  const quat = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), fwd);

  // ---- 1. THE BURST — always, and it is over almost immediately ----------
  {
    const r = 0.20 * k;
    const node = makeBurst(color, r);
    node.position.copy(at);
    fx.prop(node, 0.16, (n, t) => {
      // out hard, then collapse — not a fade. The collapse is what makes it
      // read as a compression rather than as a puff.
      const e = t < 0.45 ? t / 0.45 : 1 - (t - 0.45) / 0.55;
      n.scale.setScalar(0.35 + e * 1.9);
      n.rotation.x += 0.22; n.rotation.y += 0.17;
      n.material.opacity = 1 * (1 - t * t);
    });
  }

  // ---- 2. THE CONE — direction ------------------------------------------
  {
    const r = 0.20 * k, len = 0.62 * k;
    const node = makeCone(color, r, len);
    node.position.copy(at);
    node.quaternion.copy(quat);
    fx.prop(node, 0.20, (n, t) => {
      // it STRETCHES away and widens as it goes, so the mouth is always the
      // far end and the thing visibly left the fist
      n.scale.set(0.6 + t * 1.7, 0.6 + t * 1.7, 0.5 + t * 1.6);
      n.material.opacity = 1 * (1 - t) * (1 - t);
    });
  }

  if (!heavy) return;

  // ---- 3. THE RING — force ----------------------------------------------
  {
    const node = makeRing(color, 0.26 * k, 0.035 * k);
    node.position.copy(at);
    node.quaternion.copy(quat);
    fx.prop(node, 0.28, (n, t) => {
      n.scale.setScalar(0.5 + t * 2.2);
      // it thins as it grows, which is what stops a big ring reading as a hoop
      n.scale.z = 1;
      n.material.opacity = 1 * (1 - t);
    });
  }

  // ---- 4. THE SHARDS — violence -----------------------------------------
  {
    const n = knock ? 9 : 5;
    for (let i = 0; i < n; i++) {
      const node = makeShard(color, 0.20 * k);
      node.position.copy(at);
      // thrown mostly BACKWARD along the strike (the way debris actually
      // leaves a struck body) with a wide cone of scatter around it
      const vel = fwd.clone().multiplyScalar(rand(1.6, 4.6))
        .add(v3(spread() * 2.6, rand(0.6, 3.4), spread() * 2.6));
      const spin = v3(spread() * 14, spread() * 14, spread() * 14);
      const life = rand(0.28, 0.52);
      fx.prop(node, life, (nd, t) => {
        nd.position.addScaledVector(vel, 1 / 60);
        vel.y -= 15 / 60;
        nd.rotation.x += spin.x / 60;
        nd.rotation.y += spin.y / 60;
        nd.rotation.z += spin.z / 60;
        nd.scale.setScalar(1 - t * 0.6);
        nd.material.opacity = 0.95 * (1 - t);
      });
    }
  }

  if (!knock) return;

  // ---- 5. THE PLATE — consequence ---------------------------------------
  {
    const node = makePlate(color, 0.75 * k);
    node.position.set(at.x, (floorY ?? 0) + 0.03, at.z);
    fx.prop(node, 0.42, (nd, t) => {
      nd.scale.setScalar(0.35 + t * 1.5);
      nd.traverse(o => { if (o.material) o.material.opacity = (o.isMesh ? 0.7 : 0.7) * (1 - t); });
    });
  }

  if (!crit) return;

  // ---- 6. THE CRIT PAIR — a counter-ring and a star ----------------------
  {
    const node = makeRing(color, 0.30 * k, 0.028 * k);
    node.position.copy(at);
    node.quaternion.copy(quat);
    node.rotation.z += Math.PI / 4;
    fx.prop(node, 0.36, (n, t) => {
      n.scale.setScalar(0.4 + t * 3.0);
      n.material.opacity = 0.8 * (1 - t) * (1 - t);
    });
    const star = makeStar(color, 0.55);
    star.position.copy(at);
    fx.prop(star, 0.26, (n, t) => {
      n.scale.setScalar(0.3 + t * 1.6);
      n.rotation.y += 0.10; n.rotation.x += 0.07;
      n.traverse(o => { if (o.material) o.material.opacity = 0.95 * (1 - t); });
    });
  }
}

// ---------------------------------------------------------------------------
// GUARD IMPACTS
// ---------------------------------------------------------------------------
// A blocked hit gets its own construct rather than a smaller version of the
// above, because a block is a different EVENT: nothing is thrown outward, the
// force goes sideways along the guard. So it is a flattened ring lying against
// the guard plane plus two sliding wedges, and no debris at all.
export function guardGeo(fx, at, dir, color = 0x9fc4e8) {
  const fwd = (dir && dir.lengthSq() > 1e-5) ? dir.clone().normalize() : v3(0, 0, 1);
  const quat = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), fwd);
  const node = makeRing(color, 0.24, 0.03);
  node.position.copy(at);
  node.quaternion.copy(quat);
  node.scale.set(1, 0.55, 1);          // flattened — it spreads along the guard
  fx.prop(node, 0.20, (n, t) => {
    n.scale.set(0.6 + t * 2.4, (0.6 + t * 2.4) * 0.55, 1);
    n.material.opacity = 0.85 * (1 - t);
  });
  for (const s of [1, -1]) {
    const w = makeShard(color, 0.16);
    w.position.copy(at);
    const vel = v3(fwd.z * s * 3.2, rand(0.4, 1.4), -fwd.x * s * 3.2);
    fx.prop(w, 0.22, (n, t) => {
      n.position.addScaledVector(vel, 1 / 60);
      n.rotation.z += 0.24;
      n.material.opacity = 0.9 * (1 - t);
    });
  }
}

// ---------------------------------------------------------------------------
// ARMOUR IMPACTS
// ---------------------------------------------------------------------------
// A hit that is absorbed rather than blocked or landed. The construct is a
// SHELL that briefly hardens: a faceted dome facing the incoming blow that
// flashes and shrinks rather than expanding. It moves inward, which is the
// opposite of everything else in this file and is the point — nothing left
// the body, the body refused.
export function armorGeo(fx, at, dir, color = 0xffd8a0) {
  const fwd = (dir && dir.lengthSq() > 1e-5) ? dir.clone().normalize() : v3(0, 0, 1);
  const g = new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  g.rotateX(Math.PI / 2);
  const node = new THREE.Mesh(g, glow(color, 0.7));
  node.position.copy(at);
  node.quaternion.setFromUnitVectors(v3(0, 0, 1), fwd);
  fx.prop(node, 0.22, (n, t) => {
    n.scale.setScalar(1.25 - t * 0.55);
    n.material.opacity = 0.7 * (1 - t);
  });
}
