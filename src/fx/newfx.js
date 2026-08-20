// TECHNIQUE GEOMETRY — the three new characters' effects, as real objects.
//
// ===========================================================================
// THE RULE THIS FILE FOLLOWS
// ===========================================================================
// Every effect in here is a MESH with a shape that means something, oriented in
// world space, and animated by a function of its own progress. Nothing is a
// camera-facing card. The existing fx layer is very good at sparks and rings
// and this file does not try to replace it — it sits on top for the handful of
// moments where the technique has a physical claim about what it did to the
// air, and where a billboard cannot make that claim.
//
// The test each construct has to pass: FREEZE THE FRAME. If you cannot tell
// from a still what direction the attack travelled and roughly how hard it
// was, the effect has failed and a particle burst would have done the same job
// for a tenth of the cost.
//
// ===========================================================================
// WHAT IS IN HERE, BY CHARACTER
// ===========================================================================
//   MAKI   cloudArc      the staff's swing, as a swept ribbon of real geometry
//          soulCleave    a soul cut: TWO offset planes, because the whole
//                        fiction is that it hits something the body is not
//          awakenBurst   the stage-up — a shell that cracks outward
//   YUKI   massField     the gravitational shimmer, as a real lattice
//          massSlamCone  a downward cone of compressed ground
//          singularity   the black hole: a dark core, an accretion disc, and
//                        the only lensing ring in the project
//   MIWA   iaiLine       the draw: ONE plane, one frame, held. The most
//                        restrained thing in the file and deliberately so.
//          cutRibbon     the auto-counter's single clean stroke
import * as THREE from 'three';
import { v3, rand } from '../core/mathutil.js';

function glow(color, opacity, side = THREE.DoubleSide) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, side
  });
}
function solid(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
  });
}

// ---------------------------------------------------------------------------
// A SWEPT ARC — the shared primitive for every blade and staff swing here
// ---------------------------------------------------------------------------
// Built as a real ribbon: a fan of quads following an arc at a given radius,
// tapering in width along its length so the leading edge is thin and the tail
// is thick. That taper is what makes it read as a swing rather than as a
// rainbow — the thin end is where the weapon IS and the thick end is where it
// HAS BEEN.
function sweptArc(radius, arcAngle, width, segs = 18) {
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const a = (t - 0.5) * arcAngle;
    // width swells in the middle of the swing and tapers at both ends
    const w = width * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.35 + t * 0.85);
    const cx = Math.sin(a), cz = Math.cos(a);
    pos.push(cx * (radius - w), 0, cz * (radius - w));
    pos.push(cx * (radius + w), 0, cz * (radius + w));
  }
  for (let i = 0; i < segs; i++) {
    const a0 = i * 2, a1 = i * 2 + 1, b0 = a0 + 2, b1 = a1 + 2;
    idx.push(a0, b0, a1, a1, b0, b1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ===========================================================================
// MAKI
// ===========================================================================

// THE STAFF SWEEP. A wide, heavy, near-horizontal arc that lies in the plane
// she actually swung in — so a sweep thrown at hip height sits at hip height,
// and you can duck it in a still frame.
export function cloudArc(fx, caster, { reach = 3.1, side = 1, color = 0x5fae7a } = {}) {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(sweptArc(reach * 0.82, 2.3, reach * 0.13), glow(color, 0.55));
  const core = new THREE.Mesh(sweptArc(reach * 0.82, 2.1, reach * 0.05), glow(0xffffff, 0.9));
  g.add(blade, core);
  g.position.copy(caster.pos).setY(caster.pos.y + 1.05);
  g.rotation.y = caster.facing;
  // tilted off horizontal so it reads as a real swing plane rather than as a
  // flat decal on the ground
  g.rotation.z = side * 0.20;
  g.scale.z = side;
  fx.prop(g, 0.24, (n, t) => {
    // it SWEEPS: the arc rotates through as it fades, so the geometry is
    // travelling rather than appearing whole
    n.rotation.y = caster.facing + side * (-0.55 + t * 1.1);
    const s = 0.72 + t * 0.42;
    n.scale.set(s, s, side * s);
    blade.material.opacity = 0.55 * (1 - t);
    core.material.opacity = 0.9 * (1 - t) * (1 - t);
  });
  return g;
}

// THE SOUL CUT. Two planes, offset from each other and slightly out of
// alignment — one where the blade went and one a beat behind it, in a colder
// colour. The fiction is that it cuts something the body is not, so the
// SECOND plane is the one that matters and it is deliberately not quite where
// the first one is.
export function soulCleave(fx, caster, { reach = 2.8, color = 0x5fae7a } = {}) {
  const mk = (w, op, col) => {
    const m = new THREE.Mesh(sweptArc(reach * 0.9, 1.6, w), glow(col, op));
    m.position.copy(caster.pos).setY(caster.pos.y + 1.15);
    m.rotation.y = caster.facing;
    m.rotation.z = -0.55;                 // a steep diagonal — a cut, not a sweep
    return m;
  };
  const body = mk(reach * 0.07, 0.95, 0xffffff);
  fx.prop(body, 0.18, (n, t) => {
    n.scale.setScalar(0.8 + t * 0.5);
    n.material.opacity = 0.95 * (1 - t) * (1 - t);
  });
  // THE SOUL HALF — bigger, slower, offset, and it arrives late
  const soul = mk(reach * 0.16, 0.0, color);
  soul.rotation.z = -0.42;
  soul.position.y += 0.10;
  fx.prop(soul, 0.42, (n, t) => {
    const u = Math.max(0, (t - 0.22) / 0.78);
    n.scale.setScalar(0.9 + u * 0.7);
    n.material.opacity = 0.55 * Math.sin(Math.PI * u);
  });
}

// THE STAGE-UP. Not a glow — she has no cursed energy and a glow would say the
// opposite of what the character is. A hard SHELL that cracks outward: an
// icosahedron that expands, splits at its own facets and is gone. Pressure
// leaving a body, not power entering one.
export function awakenBurst(fx, caster, stage, color = 0x5fae7a) {
  const at = caster.pos.clone().setY(caster.pos.y + 1.05);
  const k = 0.7 + stage * 0.3;
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55 * k, 1),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.5, depthWrite: false,
      blending: THREE.AdditiveBlending, wireframe: true
    }));
  shell.position.copy(at);
  fx.prop(shell, 0.55, (n, t) => {
    n.scale.setScalar(0.4 + t * 2.4);
    n.rotation.y += 0.05;
    n.material.opacity = 0.5 * (1 - t) * (1 - t);
  });
  // and the facets that leave it
  for (let i = 0; i < 6 + stage * 3; i++) {
    const a = rand(0, Math.PI * 2), el = rand(-0.7, 1.0);
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.12 * k, 0), glow(0xffffff, 0.9));
    shard.position.copy(at);
    const vel = v3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el))
      .multiplyScalar(rand(2.2, 5.0));
    fx.prop(shard, rand(0.3, 0.55), (n, t) => {
      n.position.addScaledVector(vel, 1 / 60);
      n.rotation.x += 0.2; n.rotation.z += 0.15;
      n.material.opacity = 0.9 * (1 - t);
    });
  }
}

// ===========================================================================
// YUKI
// ===========================================================================

// THE MASS FIELD. A lattice cage around her that CONTRACTS — every other
// persistent aura in this game breathes outward, and this one pulls in, which
// is the only honest way to draw gravity. Rebuilt only when the tier changes,
// not per frame.
export function massField(fx, caster, frac, color = 0x6f7fd0) {
  if (frac < 0.12) return null;
  const g = new THREE.Group();
  const rings = 3;
  for (let i = 0; i < rings; i++) {
    const r = 0.9 + i * 0.35;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.012 + frac * 0.02, 4, 24),
      glow(color, 0.25 + frac * 0.35));
    ring.rotation.x = Math.PI / 2 + (i - 1) * 0.5;
    ring.rotation.z = i * 0.7;
    g.add(ring);
  }
  g.position.copy(caster.pos).setY(caster.pos.y + 1.0);
  fx.prop(g, 0.30, (n, t) => {
    // CONTRACTING, always. The rings walk inward across their whole life.
    const s = (1.15 - t * 0.5) * (0.7 + frac * 0.5);
    n.scale.setScalar(s);
    n.rotation.y += 0.04 + frac * 0.05;
    n.traverse(o => { if (o.material) o.material.opacity = (0.25 + frac * 0.35) * (1 - t); });
  });
  return g;
}

// THE MASS SLAM. A downward cone of compressed ground plus a hard ring at the
// floor. The cone points DOWN, which nothing else in the project does, and it
// is what makes the move read as weight arriving rather than as an explosion.
export function massSlamCone(fx, at, k = 1, color = 0x6f7fd0) {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.5 * (0.6 + k), 1.8 * (0.6 + k), 12, 1, true),
    glow(color, 0.6));
  cone.position.copy(at).setY(at.y + 1.5 * (0.6 + k));
  fx.prop(cone, 0.26, (n, t) => {
    // it DROPS as it fades, so the compression visibly arrives at the floor
    n.position.y = at.y + 1.5 * (0.6 + k) * (1 - t);
    n.scale.set(1 + t * 0.8, 1 - t * 0.5, 1 + t * 0.8);
    n.material.opacity = 0.6 * (1 - t);
  });
  // the floor plate: concentric rings, the outer one arriving late
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6 + i * 0.5, 0.05, 5, 26), glow(color, 0.8));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(at).setY(at.y + 0.06);
    fx.prop(ring, 0.34 + i * 0.1, (n, t) => {
      const u = Math.max(0, (t - i * 0.22) / (1 - i * 0.22));
      n.scale.setScalar((0.4 + u * (2.6 + k * 2.2)));
      n.material.opacity = 0.8 * (1 - u);
    });
  }
  // slabs of deck kicked up around the point
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rand(-0.2, 0.2);
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(rand(0.16, 0.34), 0.06, rand(0.16, 0.34)), solid(0x6b6f78, 0.95));
    slab.position.copy(at).setY(at.y + 0.1);
    const vel = v3(Math.cos(a) * rand(1.4, 3.6), rand(2.5, 6) * (0.6 + k), Math.sin(a) * rand(1.4, 3.6));
    const spin = v3(rand(-8, 8), rand(-8, 8), rand(-8, 8));
    fx.prop(slab, rand(0.5, 0.9), (n, t) => {
      n.position.addScaledVector(vel, 1 / 60);
      vel.y -= 22 / 60;
      n.rotation.x += spin.x / 60; n.rotation.z += spin.z / 60;
      n.material.opacity = 0.95 * (1 - t * t);
    });
  }
}

// THE BLACK HOLE. Three layers, and the middle one is the reason this looks
// unlike anything else in the game: a DARK core drawn with normal blending
// over an additive accretion disc, so the centre is genuinely darker than the
// world behind it while the edge blazes.
export function singularity(fx, at, life, color = 0x6f7fd0) {
  const g = new THREE.Group();
  g.position.copy(at);
  // 1 — the core. NOT additive: this one subtracts from the scene.
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0x05050c, transparent: true, opacity: 0.95, depthWrite: false }));
  g.add(core);
  // 2 — the accretion disc: a flat annulus, edge-bright
  const disc = new THREE.Mesh(new THREE.RingGeometry(0.55, 1.5, 40, 2), glow(color, 0.75));
  disc.rotation.x = -Math.PI / 2.3;
  g.add(disc);
  // 3 — THE LENSING RING. A thin torus standing perpendicular to the disc,
  // which is the single detail that makes a sphere read as a black hole
  // rather than as a dark ball.
  const lens = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 4, 40), glow(0xdfe6ff, 0.9));
  g.add(lens);
  fx.prop(g, life, (n, t) => {
    const grow = 0.5 + t * 0.9;
    core.scale.setScalar(grow);
    disc.scale.setScalar(grow * (1 + t * 0.5));
    lens.scale.setScalar(grow * 1.05);
    disc.rotation.z += 0.09 + t * 0.14;
    lens.rotation.y += 0.05;
    lens.rotation.z = Math.PI / 2.3;
    // it does NOT fade out — it holds and then the detonation takes it, which
    // is what makes the collapse land
    const a = t > 0.88 ? 1 - (t - 0.88) / 0.12 : 1;
    core.material.opacity = 0.95 * a;
    disc.material.opacity = 0.75 * a;
    lens.material.opacity = 0.9 * a;
  });
  return g;
}

// ===========================================================================
// MIWA
// ===========================================================================

// THE DRAW. ONE plane. It appears at full length on the contact frame, holds
// dead still, and fades. There is no travel, no sweep, no particles and no
// second layer — an iai cut has already happened by the time you can see it,
// and every extra element would be the effect explaining itself.
//
// The ONLY concession is that the plane is very slightly wider in the middle
// than at the ends, so it reads as a cut rather than as a laser.
export function iaiLine(fx, from, dir, len, { color = 0xffffff, tier = 0 } = {}) {
  const w = 0.10 + tier * 0.05;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(len * 0.45, w);
  shape.lineTo(len, 0);
  shape.lineTo(len * 0.45, -w);
  const geo = new THREE.ShapeGeometry(shape, 1);
  const node = new THREE.Mesh(geo, glow(color, 1));
  node.position.copy(from);
  node.quaternion.setFromUnitVectors(v3(1, 0, 0), dir.clone().normalize());
  // stand it up: the cut is a vertical plane, not a flat one
  node.rotateX(Math.PI / 2);
  node.rotateY(0.14);
  fx.prop(node, 0.30 + tier * 0.06, (n, t) => {
    // HELD, then gone. The opacity curve is flat for the first 40% and then
    // falls off a cliff — the hold is the whole effect.
    n.material.opacity = t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6;
    n.scale.y = 1 - t * 0.3;
  });
  return node;
}

// THE AUTO-COUNTER. One short arc traced along the tangent of the circle at
// the crossing point. Restraint reads as skill, so it is a SINGLE stroke that
// does not move and does not spark.
export function cutRibbon(fx, at, tangent, { color = 0xffffff, len = 1.9 } = {}) {
  const node = new THREE.Mesh(sweptArc(len * 0.6, 1.15, len * 0.045, 10), glow(color, 1));
  node.position.copy(at);
  node.rotation.y = Math.atan2(tangent.x, tangent.z);
  node.rotation.z = 1.25;                      // near-vertical: a clean downward cut
  fx.prop(node, 0.18, (n, t) => {
    n.material.opacity = t < 0.35 ? 1 : 1 - (t - 0.35) / 0.65;
    n.scale.setScalar(1 + t * 0.12);
  });
  return node;
}
