// SUGURU GETO — 夏油傑. Built to a researched reference pass over the MAPPA
// design (JJK 0 movie / Shibuya-arc cult-leader look, not the student look).
//
// ============================ REFERENCE SHEET ============================
// Sources consulted (web, 2026-08-13): Jujutsu Kaisen Wiki character sheet
// (build, hair, "purple robes with a green and gold design on the front
// panel", white socks and sandals, thin purple eyes, large earlobes with big
// circular earrings), Wikipedia character article, ORICON character profile,
// and the official JJK0 character-design sheet posted by the anime account.
// Geometry here is ORIGINAL and procedural — nothing imported, nothing traced.
//
// BUILD    186 cm (H 1.86). Third-tallest on the roster: below Gojo (1.90),
//          above Nanami (1.84), well above the students (Megumi 1.75, Yuji
//          1.73). Adult and VISIBLY older than the students — the difference
//          is carried in the shoulders (0.112·H, broader than Megumi's 0.100)
//          and in a longer neck and a lower, settled centre of mass, not in
//          bulk. Slim and lightly muscled: muscle 0.98, bulk 0.97. He is a
//          tall man in heavy cloth, not an athlete.
// HEAD     Long oval with a soft jaw and a rounded chin — the ONE face in the
//          roster that is not built out of angles. Megumi is all points;
//          Geto's contour is continuous. That softness is what makes the
//          contempt land: nothing about the face is trying.
// HAIR     THE SILHOUETTE, and it has to work from four angles:
//            FRONT — a centre-parted curtain of bangs falling to just below
//              the brow, the LEFT side (screen +X) heavier and longer so it
//              grazes the eye. Two thin loose strands hang in front of the
//              ears down past the jaw.
//            SIDE  — the profile is the tell. The scalp mass sweeps back and
//              UP off the temples into a single tied knot ABOVE and BEHIND
//              the crown, and the profile behind that knot drops almost
//              vertically. The knot sits high (1.32 headR up, 0.30 back) and
//              is a squashed sphere, not a ball: wider than it is tall.
//            3/4   — the gather is visible as swept bands converging on the
//              tie band; the band itself is a thin dark ring, slightly
//              lighter than the hair.
//            BACK  — the loose length. The bun does NOT contain everything:
//              the lower half of the hair drapes down the back to roughly
//              shoulder-blade height. This is a spring chain, not geometry,
//              so it lags on turns.
//          Volume is TIGHT to the skull everywhere except the knot. Geto has
//          no spikes and no outward flare — he is the smooth-silhouette
//          counterpoint to Megumi in exactly the same way his fighting style
//          is the passive counterpoint to Megumi's.
// EYES     THIN and PURPLE (#7d5fa8). Half-lidded, with the upper lash line
//          dropped low across the iris and the lower lid drawn in — this is
//          the whole expression. Brows are set HIGH and almost level with a
//          faint outward lift, which is the difference between "tired" and
//          "unimpressed by you specifically". Mouth is a small closed line
//          with the corners a fraction UP: a serene half-smile, not a smirk.
//          Read together: calm in a way that reads as contemptuous.
// EARS     Large lobes, and a big flat circular earring on each — canon calls
//          them out and they are the only jewellery on him, so they get real
//          geometry (torus + disc), not a painted dot.
// GARMENTS Outside in, and there are four layers:
//            1 KESA OVERROBE — the outer purple robe #3d2c56, hanging from
//              the shoulders in a wide straight column to mid-calf. Falls
//              CLEAR of the body: radius at the hem is wider than the hips.
//            2 FRONT PANEL — the identifier. A vertical band down the centre
//              front in GREEN #4e7a55 with a GOLD #c9a23c border and three
//              gold rank bars across it. Canon: "a striking green and gold
//              design on the front panel".
//            3 WIDE SLEEVES — deep bell sleeves hanging well below the wrist.
//              Modelled as tapered drapes bound to the forearm chain so they
//              swing with the arm, plus spring flaps at the openings.
//            4 UNDER-ROBE — a lighter grey-lilac #6a5f78 collar and inner
//              lapel crossing left-over-right at the throat, visible in the
//              V of the overrobe.
//          FEET: white tabi #e8e4dc with the split toe as a real seam, and
//          flat dark sandal soles #3a3038 with a thong strap.
// PALETTE  robe #3d2c56 · robe shadow #2a1d3c · panel green #4e7a55 ·
//          gold #c9a23c · under-robe #6a5f78 · hair #131019 / hi #2c2338 ·
//          skin #efdcd0 · eyes #7d5fa8 · tabi #e8e4dc · sandal #3a3038
//          CURSED ENERGY: deep violet #6b2fa0 — deliberately a DARKER, more
//          saturated purple than Gojo's Hollow Purple accent (#7fd0ff cyan
//          base / bright magenta core). Nothing about Geto's VFX should read
//          as Limitless.
// IDENTITY 1) the high tied knot over a smooth back-swept skull, with loose
//             length down the back
//          2) the green-and-gold panel down the centre of a purple robe
//          3) the half-lidded purple eyes over a faint closed smile
// POSTURE  Still. The stance keeps the hands CLASPED in front at waist
//          height, the weight even on both feet, and the chin level. He is
//          the only fighter on the roster whose idle does not hold a guard.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, coneSpike } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const HAIR = 0x131019;
const HAIR_HI = 0x2c2338;
const SKIN = 0xefdcd0;
// The robe is a deep desaturated purple. Pushed a little lighter than the
// reference value for the same reason Megumi's navy is: a true #2a1d3c crushes
// to pure silhouette under the toon ramp and the panel stops separating.
const ROBE = 0x3d2c56;
const ROBE_DK = 0x2a1d3c;
const PANEL_GREEN = 0x4e7a55;
const GOLD = 0xc9a23c;
const UNDER = 0x6a5f78;
const TABI = 0xe8e4dc;
const SANDAL = 0x3a3038;
const EYE = 0x7d5fa8;

export function buildGeto() {
  const spec = {
    id: 'geto', name: 'Geto', H: 1.86, headScale: 0.97,
    shoulder: 0.112, hip: 0.052, muscle: 0.98, bulk: 0.97,
    legBulk: 1.30,                       // the robe skirt swallows the legs
    skinTone: SKIN, clothColor: ROBE, pantColor: ROBE_DK, shoeColor: SANDAL,
    sleeveColor: ROBE,
    torsoShape: { chest: 1.02, waist: 0.98, hip: 1.0 },
    // the ONE soft face in the roster — wide-ish jaw, rounded chin
    face: { jaw: 0.99, chin: 0.92, width: 1.0 },
    shoe: { len: 0.118, hgt: 0.034 },    // flat: a sandal, not a shoe
    palette: {
      rim: 0xb9a8d4, hairRim: 0x7a5f9e, outline: 0x06050b,
      accent: 0x6b2fa0, energy: 0x6b2fa0
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE: half-lidded purple eyes, high level brows, faint smile --------
  // The shared helper draws a wide open almond and a straight mouth; both are
  // wrong. Only the nose is inherited.
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.50, eyeH = headR * 0.235;   // THIN — 0.235 vs the 0.30 default
  for (const s of [1, -1]) {
    const ex = s * headR * 0.395;
    // sclera first, so the lid can be laid over the top of it
    bag.add('flat', tGeo(hoodedEye(eyeW, eyeH, s),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf3f4f8 });
    // iris: tall and mostly covered by the lid above
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.52, 12),
      { scale: [0.80, 1.10, 1], pos: [ex - s * eyeW * 0.04, eyeY - eyeH * 0.04, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.21, 10),
      { scale: [0.82, 1.06, 1], pos: [ex - s * eyeW * 0.04, eyeY - eyeH * 0.04, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x180f26 });
    // THE HALF LID. A thick bar dropped LOW across the top of the iris — this
    // one element is the entire expression, and it sits lower than any other
    // lash line in the roster (0.30·eyeH above centre against Megumi's 0.44).
    bag.add('flat', tGeo(roundBox(eyeW * 1.12, eyeH * 0.36, 0.004, 0.002),
      { rot: [0, 0, s * 4], pos: [ex, eyeY + eyeH * 0.30, faceZ + headR * 0.030] }),
      { bone: 'Head', color: 0x0e0b14 });
    // lower lid, drawn in — narrows the aperture from underneath
    bag.add('flat', tGeo(roundBox(eyeW * 0.86, eyeH * 0.13, 0.004, 0.002),
      { rot: [0, 0, s * -3], pos: [ex, eyeY - eyeH * 0.44, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x3a2c42 });
    // BROW: HIGH and nearly level with a small outward lift. Set far from the
    // eye — the opposite of Megumi's low crowded brow, and the reason the same
    // half-lidded shape reads as serene rather than exhausted.
    bag.add('flat', tGeo(roundBox(eyeW * 0.92, eyeH * 0.16, 0.004, 0.002),
      { rot: [0, 0, s * 5], pos: [ex + s * eyeW * 0.04, eyeY + eyeH * 1.52, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x151020 });
  }
  // MOUTH: small, closed, corners a fraction up. Three pieces — a centre line
  // and two short lifted corner ticks — because a single rotated bar can only
  // smile on one side.
  bag.add('flat', tGeo(roundBox(headR * 0.15, headR * 0.034, 0.004, 0.002),
    { pos: [0, headC.y - headR * 0.585, faceZ - headR * 0.045] }),
    { bone: 'Head', color: 0x6b4046 });
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.055, headR * 0.030, 0.004, 0.002),
      { rot: [0, 0, s * -22], pos: [s * headR * 0.093, headC.y - headR * 0.572, faceZ - headR * 0.050] }),
      { bone: 'Head', color: 0x6b4046 });
  }

  // ---- EARRINGS -----------------------------------------------------------
  // Large flat rings, canon-called-out, hung off the lobe. Real geometry: a
  // torus plus an inner disc so the ring reads as a solid hoop from the side
  // and still catches the rim light from the front.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.96, ey = headC.y - headR * 0.30, ez = headC.z - headR * 0.10;
    bag.add('metal', tGeo(new THREE.TorusGeometry(headR * 0.20, headR * 0.034, 6, 14),
      { rot: [0, 90, 0], pos: [ex, ey, ez] }), { bone: 'Head', color: 0x2a2430 });
    bag.add('metal', tGeo(new THREE.CircleGeometry(headR * 0.175, 12),
      { rot: [0, s * 90, 0], pos: [ex + s * 0.002, ey, ez] }), { bone: 'Head', color: 0x1a1520 });
  }

  // ---- HAIR ---------------------------------------------------------------
  // Tight scalp shell with a face window, exactly the trick Megumi's file
  // uses — but where his spikes leave the shell, Geto's SWEEPS stay glued to
  // it. The whole read is "one smooth mass gathered upward", so nothing here
  // is allowed to stand off the skull except the knot.
  const FACE_GAP = 1.24;
  bag.add('hair', tGeo(sphereShell(headR * 1.005, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.68, scale: [1.02, 1.04, 1.06]
  }), { pos: [headC.x, headC.y + headR * 0.01, headC.z - headR * 0.03] }), { bone: 'Head', color: HAIR });
  // nape shell: closes the back of the skull and carries the mass DOWN toward
  // where the loose length starts
  bag.add('hair', tGeo(sphereShell(headR * 0.99, {
    phiStart: Math.PI / 2 + 0.9, phiLength: Math.PI * 2 - 1.8,
    thetaLength: Math.PI * 0.50, scale: [1.0, 1.10, 1.0]
  }), { rot: [-58, 0, 0], pos: [headC.x, headC.y - headR * 0.20, headC.z - headR * 0.22] }),
    { bone: 'Head', color: HAIR });

  // SWEEP BANDS. Flat tapered slabs laid ON the shell, running from the
  // temples back and up to converge under the knot. These are what make the
  // 3/4 view read as "gathered" instead of "helmet".
  const sweep = (sx, y0, z0, len, wid, tilt, roll, color = HAIR) => {
    bag.add('hair', tGeo(roundBox(wid, len, headR * 0.10, headR * 0.03, 2),
      { rot: [tilt, 0, roll], pos: [sx, y0, z0] }), { bone: 'Head', color });
  };
  for (const s of [1, -1]) {
    sweep(s * headR * 0.74, headC.y + headR * 0.30, headC.z - headR * 0.16,
      headR * 0.92, headR * 0.30, -34, s * 18);
    sweep(s * headR * 0.60, headC.y + headR * 0.52, headC.z - headR * 0.32,
      headR * 0.82, headR * 0.26, -46, s * 12, HAIR_HI);
    sweep(s * headR * 0.36, headC.y + headR * 0.62, headC.z - headR * 0.44,
      headR * 0.76, headR * 0.28, -52, s * 6);
  }

  // THE KNOT. Behind and above the crown, and squashed — wider than it is
  // tall. A round ball here reads as a topknot on a samurai; the flattened
  // ovoid is what makes it Geto's bun.
  //
  // Pulled DOWN from the first pass's 1.32 headR to 1.06 and forward from
  // -0.30 to -0.24. At 1.32 it floated clear of the skull with daylight under
  // it — a bun is gathered hair sitting ON the head, and the gap read as a hat.
  const knotY = headC.y + headR * 1.06, knotZ = headC.z - headR * 0.24;
  bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.46, 12, 10),
    { scale: [1.16, 0.80, 1.06], pos: [0, knotY, knotZ] }), { bone: 'Head', color: HAIR });
  // a second smaller lobe in front of it, so the knot is two wraps not one ball
  bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.30, 10, 8),
    { scale: [1.10, 0.86, 1.0], pos: [0, knotY - headR * 0.10, knotZ + headR * 0.28] }),
    { bone: 'Head', color: HAIR_HI });
  // the TIE BAND: a thick ring at the base of the gather, lighter than the
  // hair. It has to physically BRIDGE the scalp shell and the knot — that is
  // its job, not decoration — so it is deliberately long enough to overlap
  // both ends.
  bag.add('hair', tGeo(new THREE.CylinderGeometry(headR * 0.26, headR * 0.34, headR * 0.32, 12),
    { rot: [22, 0, 0], pos: [0, knotY - headR * 0.40, knotZ + headR * 0.14] }),
    { bone: 'Head', color: HAIR_HI });

  // BANGS — a centre-parted curtain reaching to just below the BROW, HEAVIER
  // ON THE LEFT (screen +X) so it grazes that eye. Flat slabs angled forward
  // and down; the part is the gap at x ≈ 0.
  //
  // HALVED from the first pass. At ~1.0 headR long, dropped from y+0.34, the
  // six slabs met in the middle and formed a solid mask over the entire face —
  // no eyes, no mouth, nothing. The rule that fixes it: the LOWEST point of
  // any bang must sit ABOVE the eye line (eyeY + 0.42·eyeH), and the two
  // innermost slabs are pulled apart so the forehead shows between them.
  // Anything longer belongs on the SIDES, past the eye, where it can hang
  // without covering anything.
  // PASS 3 — the second pass fixed the mask but produced a VISOR: six slabs of
  // near-identical length, all starting at the same y, reading as one straight
  // horizontal bar across the forehead. Two changes fix it and both are about
  // breaking the horizontal:
  //   · `coneSpike` instead of `roundBox`. The tips TAPER, so the bottom edge
  //     of the curtain is a row of points rather than a ruled line.
  //   · lengths now RAMP outward (0.30 at the part to 0.66 at the temples) and
  //     the whole curtain is raised so the BROWS SHOW BENEATH IT. A fringe
  //     that covers the brows costs the expression, and on this character the
  //     brow-to-lid distance is the expression.
  const bang = (x, r, len, roll, z = 0.80, y0 = 0.70) => {
    const dir = v3(x * 0.5, -1, 0.34).normalize();
    const geo = coneSpike(r, len, v3(x * headR * 0.30, -headR * 0.10, -headR * 0.10),
      { radial: 5, hSeg: 3, zScale: 0.55 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.rotateZ(roll * Math.PI / 180);
    geo.translate(x, headC.y + headR * y0, headC.z + headR * z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color: HAIR });
  };
  // the PART: the two innermost strands are the shortest and lean apart, so
  // there is a visible gap of forehead between them
  // PASS 3b — the radii below are roughly 1.6x the first attempt at this. Thin
  // cones gave the taper the visor lacked but overcorrected into SCRAGGLE: six
  // separate needles with daylight between them, which reads as damage rather
  // than as hair. A fringe has to be a MASS with a toothed edge, so the cones
  // are fat enough to overlap their neighbours at the root and only separate
  // near the tips.
  bang(headR * 0.16, headR * 0.20, headR * 0.32, -12);
  bang(-headR * 0.18, headR * 0.19, headR * 0.30, 13);
  bang(headR * 0.42, headR * 0.23, headR * 0.48, -18);       // left: heavier
  bang(-headR * 0.44, headR * 0.22, headR * 0.42, 19);
  bang(headR * 0.68, headR * 0.23, headR * 0.64, -26, 0.66, 0.60);
  bang(-headR * 0.70, headR * 0.22, headR * 0.58, 27, 0.66, 0.60);
  // and two long ones at the very outside, past the eye, where length can hang
  // without covering anything
  bang(headR * 0.86, headR * 0.20, headR * 0.80, -34, 0.42, 0.44);
  bang(-headR * 0.88, headR * 0.19, headR * 0.74, 35, 0.42, 0.44);

  // ---- GARMENTS -----------------------------------------------------------
  // 4 UNDER-ROBE first (innermost), so the outer layers sit on top of it.
  // Crossed lapels, left over right, showing in the V of the overrobe.
  bag.add('cloth', tGeo(latheY([
    [0.036 * H, y.neck - 0.036 * H], [0.041 * H, y.neck + 0.006 * H], [0.040 * H, y.neck + 0.044 * H]
  ], 16, 0.94), {}), { bone: 'Neck', color: UNDER });
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.030 * H, 0.150 * H, 0.010 * H, 0.004),
      { rot: [0, s * -12, s * 20], pos: [s * 0.026 * H, 0.700 * H, 0.062 * H] }),
      { bone: 'Chest', color: UNDER });
  }

  // 1 KESA OVERROBE. A wide straight column from the shoulders to mid-calf,
  // hanging CLEAR of the body — the hem radius (0.108·H) is wider than the
  // hips (0.070·H), which is what makes it a robe rather than a coat.
  //
  // NOTE: the profile runs BOTTOM TO TOP (ascending y), and it has to. A lathe
  // built from a descending profile comes out with inverted winding, so the
  // whole garment renders as its own backfaces — which reads on screen as a
  // solid black hole where the robe should be. Cost one iteration pass to find
  // and it is worth stating: every latheY profile in this file ascends.
  bag.add('cloth', tGeo(latheY([
    [0.108 * H, 0.215 * H], [0.105 * H, 0.360 * H], [0.100 * H, 0.500 * H],
    [0.096 * H, 0.600 * H], [0.093 * H, 0.700 * H], [0.088 * H, 0.780 * H]
  ], 22, 0.86), {}), { bone: 'Hips', color: ROBE });
  // shoulder yoke: a heavier band across the top where the robe takes its
  // weight, in the darker value so the shoulder line reads at silhouette size
  bag.add('cloth', tGeo(latheY([
    [0.090 * H, 0.775 * H], [0.086 * H, 0.822 * H]
  ], 20, 0.88), {}), { bone: 'Chest', color: ROBE_DK });
  // hem band
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.109 * H, 0.109 * H, 0.020 * H, 22, 1, true),
    { scale: [1, 1, 0.86], pos: [0, 0.222 * H, 0] }), { bone: 'Hips', color: ROBE_DK });

  // 2 THE FRONT PANEL — the identifier. Green field, gold border, three gold
  // bars. Built as flat slabs standing proud of the robe surface so the toon
  // ramp keeps them separate at distance.
  const panelZ = 0.092 * H;
  bag.add('cloth', tGeo(roundBox(0.062 * H, 0.330 * H, 0.008 * H, 0.004),
    { pos: [0, 0.560 * H, panelZ] }), { bone: 'Hips', color: GOLD });
  bag.add('cloth', tGeo(roundBox(0.050 * H, 0.312 * H, 0.008 * H, 0.004),
    { pos: [0, 0.560 * H, panelZ + 0.004 * H] }), { bone: 'Hips', color: PANEL_GREEN });
  for (let i = 0; i < 3; i++) {
    bag.add('cloth', tGeo(roundBox(0.048 * H, 0.011 * H, 0.007 * H, 0.003),
      { pos: [0, 0.462 * H + i * 0.086 * H, panelZ + 0.008 * H] }), { bone: 'Hips', color: GOLD });
  }
  // the panel continues UP over the chest as a narrower gold-edged strip
  bag.add('cloth', tGeo(roundBox(0.040 * H, 0.100 * H, 0.008 * H, 0.004),
    { pos: [0, 0.735 * H, 0.078 * H] }), { bone: 'Chest', color: GOLD });
  bag.add('cloth', tGeo(roundBox(0.029 * H, 0.086 * H, 0.008 * H, 0.004),
    { pos: [0, 0.735 * H, 0.082 * H] }), { bone: 'Chest', color: PANEL_GREEN });

  // 3 WIDE SLEEVES. Deep bells bound to the arm chain so they swing with it.
  // Each is a truncated cone widening toward the wrist and hanging past it.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    // SLEEVE TILT. Rotating a +Y cylinder about +Z carries its top toward -X,
    // and the arm hangs out-and-down along (m·sin13, -cos13) — so the correct
    // tilt for the LEFT arm (m = +1) is POSITIVE. Getting this sign backwards
    // splays both sleeves outward off the shoulders like epaulettes, which is
    // exactly what the first pass did.
    const tilt = (s === 'L' ? 1 : -1);
    // upper sleeve: loose over the bicep. Closed cylinders, not open shells —
    // an open-ended tube is a one-sided surface and shows its inside from
    // below, which on a hanging sleeve is most of the time you see it.
    // PASS 3 — ONE CONTINUOUS TAPER, not two stacked cones. The second pass
    // had an upper tube ending at 0.044·H and a bell starting at 0.044·H, and
    // the hard step between them read as two lampshades on a stick. Now the
    // upper piece ends exactly where the bell begins AND they share a radius
    // and a tilt, so the silhouette from shoulder to cuff is a single line.
    // Every radius is also down another ~12%: at the previous width the sleeve
    // was as thick as the torso.
    const upMid = sh.clone().lerp(el, 0.5);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.033 * H, 0.040 * H, 0.152 * H, 12),
      { rot: [4, 0, tilt * 13], pos: [upMid.x, upMid.y, upMid.z] }),
      { chain: armChain, color: ROBE, blend: 0.09 });
    // the BELL: from the elbow toward the wrist, opening out. Shorter than the
    // second pass so it stops ABOVE the clasped hands instead of hanging past
    // them and colliding with the hem.
    const bellMid = el.clone().lerp(wr, 0.50);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.040 * H, 0.055 * H, 0.150 * H, 14),
      { rot: [4, 0, tilt * 11], pos: [bellMid.x, bellMid.y, bellMid.z] }),
      { chain: armChain, color: ROBE, blend: 0.09 });
    // gold cuff line at the sleeve opening, sat ON the bell's mouth
    const cuffP = el.clone().lerp(wr, 0.86);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.056 * H, 0.056 * H, 0.013 * H, 14),
      { rot: [4, 0, tilt * 11], pos: [cuffP.x, cuffP.y, cuffP.z] }),
      { chain: armChain, color: GOLD, blend: 0.09 });
  }

  // BELT / obi: a wide flat sash, tied. Sits above the panel's lower half.
  bag.add('cloth', tGeo(latheY([
    [0.098 * H, 0.492 * H], [0.101 * H, 0.520 * H], [0.098 * H, 0.548 * H]
  ], 20, 0.86), {}), { bone: 'Hips', color: ROBE_DK });
  bag.add('cloth', tGeo(roundBox(0.052 * H, 0.030 * H, 0.024 * H, 0.008),
    { pos: [0, 0.520 * H, -0.096 * H] }), { bone: 'Hips', color: ROBE_DK });

  // ---- FEET: white tabi + flat sandals -------------------------------------
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    // tabi sock over the ankle
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.030 * H, 0.034 * H, 0.048 * H, 10),
      { pos: [an.x, an.y + 0.040 * H, an.z] }), { bone: 'Foot' + s, color: TABI });
    // the sock body over the foot, and the SPLIT TOE as a real seam
    bag.add('cloth', tGeo(roundBox(0.044 * H, 0.036 * H, 0.100 * H, 0.012 * H, 2),
      { pos: [an.x, an.y + 0.014 * H, an.z + 0.024 * H] }), { bone: 'Foot' + s, color: TABI });
    bag.add('cloth', tGeo(roundBox(0.004 * H, 0.030 * H, 0.044 * H, 0.001),
      { pos: [an.x, an.y + 0.016 * H, an.z + 0.056 * H] }), { bone: 'Foot' + s, color: 0xb8b2ae });
    // sandal sole: flat slab under everything, plus a thong strap
    bag.add('cloth', tGeo(roundBox(0.050 * H, 0.013 * H, 0.126 * H, 0.005 * H, 2),
      { pos: [an.x, an.y - 0.012 * H, an.z + 0.020 * H] }), { bone: 'Foot' + s, color: SANDAL });
    for (const t of [1, -1]) {
      bag.add('cloth', tGeo(roundBox(0.008 * H, 0.006 * H, 0.052 * H, 0.002),
        { rot: [0, t * 22, 0], pos: [t * 0.014 * H + an.x, an.y + 0.028 * H, an.z + 0.034 * H] }),
        { bone: 'Foot' + s, color: 0x1c181f });
    }
  }

  // ---- SPRINGS: the whole point of him -------------------------------------
  // "Long, flowing, with real secondary motion." Three chains, and they are
  // deliberately the loosest set on the roster (low stiffness, high damping)
  // because Geto himself barely moves — ALL the motion in his silhouette has
  // to come from cloth and hair lagging behind a body that is standing still.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];

  // robe hem: four panels, front pair shorter so the legs are not caged
  const hemAt = (x, z, len0, len1, w) => ({
    bone: 'Hips', localOffset: v3(x, -0.078 * H, z),
    // restDir is what the SEGMENT MESH follows — makeFlapMesh points -Y, so
    // any restDir far off vertical twists the panel. Kept near-vertical with
    // just enough outward lean to clear the leg.
    restDir: v3(x * 0.5, -1, z * 0.5).normalize(),
    stiffness: 46, damping: 0.90, gravity: 9,
    segments: [
      { len: len0, mesh: makeFlapMesh(w, w * 0.96, len0, 0.010, clothMat, ROBE, oOpts) },
      { len: len1, mesh: makeFlapMesh(w * 0.96, w * 0.88, len1, 0.009, clothMat, ROBE_DK, oOpts) }
    ]
  });
  springs.push(hemAt(0.070 * H, -0.062 * H, 0.085 * H, 0.070 * H, 0.086 * H));
  springs.push(hemAt(-0.070 * H, -0.062 * H, 0.085 * H, 0.070 * H, 0.086 * H));
  springs.push(hemAt(0.062 * H, 0.066 * H, 0.062 * H, 0.052 * H, 0.076 * H));
  springs.push(hemAt(-0.062 * H, 0.066 * H, 0.062 * H, 0.052 * H, 0.076 * H));

  // sleeve openings: a short drape off each wrist that swings independently.
  // PASS 3 — narrowed hard (0.086 → 0.050·H) and shortened. At the previous
  // width these read as two rectangular planks jutting sideways at hip height
  // rather than as cloth hanging out of a cuff, and in the clasped stance —
  // where the wrists sit in front of the waist — they collided with the robe.
  for (const s of ['L', 'R']) {
    springs.push({
      bone: 'Hand' + s, localOffset: v3(0, -0.006 * H, 0),
      restDir: v3(0, -1, 0.08).normalize(), stiffness: 58, damping: 0.87, gravity: 10,
      segments: [
        { len: 0.044 * H, mesh: makeFlapMesh(0.050 * H, 0.044 * H, 0.044 * H, 0.009, clothMat, ROBE, oOpts) },
        { len: 0.030 * H, mesh: makeFlapMesh(0.044 * H, 0.034 * H, 0.030 * H, 0.008, clothMat, ROBE_DK, oOpts) }
      ]
    });
  }

  // THE LOOSE LENGTH. Three strands off the nape falling to shoulder-blade
  // height — this is the half of the hair the knot does not contain, and it is
  // most of the back silhouette.
  const headJ = joints.get('Head');
  const strand = (x, w) => ({
    bone: 'Head',
    localOffset: v3(x, headC.y - headR * 0.42 - headJ.y, -headR * 0.86 + (headC.z - headJ.z)),
    restDir: v3(x * 0.6, -1, -0.30).normalize(), stiffness: 62, damping: 0.86, gravity: 7,
    // PASS 3b — lengthened from 0.132·H total to 0.190·H (roughly shoulder
    // blade rather than shoulder). Canon is explicit that the bun does not
    // contain everything and the rest "drapes down his back", and at the
    // shorter length the back view was a bun on a bare collar: the whole
    // reason for this chain was invisible from behind.
    segments: [
      { len: 0.072 * H, mesh: makeFlapMesh(w, w * 0.94, 0.072 * H, 0.014, hairMat, HAIR, oOpts) },
      { len: 0.064 * H, mesh: makeFlapMesh(w * 0.94, w * 0.78, 0.064 * H, 0.012, hairMat, HAIR, oOpts) },
      { len: 0.054 * H, mesh: makeFlapMesh(w * 0.78, w * 0.34, 0.054 * H, 0.010, hairMat, HAIR_HI, oOpts) }
    ]
  });
  springs.push(strand(0, 0.052 * H));
  springs.push(strand(headR * 0.46, 0.038 * H));
  springs.push(strand(-headR * 0.46, 0.038 * H));

  // and the two thin face-framing strands in FRONT of the ears, past the jaw
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Head',
      localOffset: v3(s * headR * 0.82, headC.y + headR * 0.10 - headJ.y, headR * 0.30 + (headC.z - headJ.z)),
      restDir: v3(s * 0.14, -1, 0.06).normalize(), stiffness: 74, damping: 0.84, gravity: 6,
      segments: [
        { len: 0.038 * H, mesh: makeFlapMesh(0.017 * H, 0.014 * H, 0.038 * H, 0.011, hairMat, HAIR, oOpts) },
        { len: 0.028 * H, mesh: makeFlapMesh(0.014 * H, 0.005 * H, 0.028 * H, 0.009, hairMat, HAIR, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.011, outlineHairScale: 0.9
  });

  // ---- THE STABLE AURA -----------------------------------------------------
  // Driven by the curse system: as summons come out, a ring of violet motes
  // orbits him and thins as the stable empties. Purely presentational — the
  // fighter never reads it — and it is a no-op until something calls it, so a
  // Geto standing in the viewer is completely inert.
  const aura = new THREE.Group();
  aura.visible = false;
  {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6b2fa0, transparent: true, opacity: 0.75, depthWrite: false
    });
    for (let i = 0; i < 10; i++) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.030, 6, 5), mat);
      const a = (i / 10) * Math.PI * 2;
      mote.position.set(Math.cos(a) * 0.42, 0.95 + (i % 3) * 0.16, Math.sin(a) * 0.42);
      mote.userData.a = a;
      aura.add(mote);
    }
  }
  model.group.add(aura);
  let auraK = 0, auraT = 0;
  // k = fraction of the stable still held, 0..1
  model.setStable = k => { auraK = Math.max(0, Math.min(1, k)); };
  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    aura.visible = auraK > 0.001;
    if (!aura.visible) return;
    auraT += dt;
    const n = aura.children.length;
    for (let i = 0; i < n; i++) {
      const mote = aura.children[i];
      // motes past the held fraction simply switch off — the ring THINS as the
      // stable empties, which is the read
      mote.visible = (i / n) < auraK;
      const a = mote.userData.a + auraT * 0.6;
      mote.position.x = Math.cos(a) * 0.42;
      mote.position.z = Math.sin(a) * 0.42;
      mote.position.y = 0.95 + (i % 3) * 0.16 + Math.sin(auraT * 1.8 + i) * 0.05;
    }
  };
  return model;
}

// A thinner, flatter eye than the shared almond, with the outer corner LIFTED
// and the whole shape shallow — the aperture a half-lidded eye actually leaves.
// `s` = 1 for his left (screen +X).
function hoodedEye(w, h, s) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 * s, -h * 0.04);
  sh.quadraticCurveTo(-w * 0.14 * s, h * 0.52, w / 2 * s, h * 0.26);
  sh.lineTo(w * 0.44 * s, h * 0.06);
  sh.quadraticCurveTo(w * 0.00 * s, -h * 0.46, -w / 2 * s, -h * 0.04);
  return new THREE.ShapeGeometry(sh, 8);
}
