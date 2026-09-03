// NOBARA KUGISAKI — built to a researched reference pass over the MAPPA
// design (character-sheet descriptions + anime key art, front / 3-4 / side /
// back).
//
// ============================ REFERENCE SHEET ============================
// Sources consulted (web, August 2026): jjk.guide's character database (160 cm,
// "ginger hair and orange eyes", born 2002, Straw Doll Technique and Resonance
// descriptions); Heroes Wiki / Jujutsu Kaisen Wiki summaries via search
// ("chin-length light brown hair styled into an asymmetrical bob-cut", "bangs
// sweeping across the right side of her forehead", "brown tights, light brown
// shoes, a dark-blue button-down jacket, and a dark-blue pleated skirt", "a
// brown belt that carries her jujutsu tools"); QuoteTheAnime's entry ("lean and
// thin build", "black stockings and brown shoes", the brown tool belt, "a
// hammer providing versatility for short and long-range attacks", cursed-energy
// nails, "a straw doll is essential for her innate technique"); Carbon Costume
// listing for the uniform breakdown. Geometry here is original and procedural
// — nothing imported.
//
// NOTE ON THE BRIEF. The brief's checklist says "average height". Canon and
// every source agree on 160 cm, which is the SHORTEST human on this roster, and
// the brief also mandates research and canon accuracy — so she is built at
// H 1.62 (a hair over canon so she does not read as a child next to a 1.81
// Choso) and the "similar frame to Yuta" note is honoured in BUILD rather than
// in height: same slight, narrow-shouldered teenage frame, ten centimetres
// shorter. Standing in the lineup she is a head under Choso, which is correct.
//
// BUILD    160 cm (H 1.62). Slight and athletic: shoulder half-width 0.098·H,
//          muscle 0.86, bulk 0.90. Narrow ribcage, long legs for the height.
//          Nothing about her is heavy — her damage is not in her body.
// HEAD     Slightly wide, soft jaw, small pointed chin. Young. The face is the
//          one place she is allowed to be round, because everything else about
//          the design is sharp.
// HAIR     THE IDENTIFIER AT DISTANCE. Warm ginger-orange (#c8763a), an
//          ASYMMETRICAL BOB ending at the jaw in front and rising to the nape
//          behind, with a DEEP SIDE PARTING well off centre. The heavy side
//          sweeps across the forehead and hangs past the eyebrow; the light
//          side is short and tucked behind the ear. Two longer jaw-framing
//          locks, one on each side, angled inward. Back view: a clean rounded
//          mass that is SHORTER at the nape than at the jaw — an A-line — with
//          the bottom edge visibly cut rather than tapered.
// EYES     Warm orange-brown (#c4762e), large but SHARP: hard upper lash line,
//          strongly tilted outer corner, and high arched brows set well above
//          the eye. The expression is the character — brows up and inward-
//          angled, one corner of the mouth pulled up. She is never uncertain
//          and she is faintly enjoying this.
// GARMENTS Layer by layer, outside in:
//            · Jujutsu Tech JACKET, dark navy #1e2331: button-down front with
//              a visible placket and buttons, short stand collar (much lower
//              than Megumi's), hem at the natural waist rather than the hip.
//            · Cuffed sleeves to the wrist.
//            · PLEATED SKIRT in the same navy, flaring from the waist to just
//              above the knee, with real pleat ribs — this is the silhouette
//              piece and a smooth cone reads as the wrong character.
//            · BLACK TIGHTS to the ankle.
//            · BROWN TOOL BELT, worn low and slightly canted, with a plain
//              buckle and two pouches — the nails live here.
//            · BROWN SHOES, low block heel, ankle strap. Distinctive: they are
//              not the roster's flat trainers, and the small heel changes how
//              the leg reads all the way up.
// PROPS    HAMMER: a real modelled tool. Squared steel head, a HEART cut into
//          the cheek of it, long wrapped wooden haft, carried resting on the
//          right shoulder in the idle. NAIL: a single long black iron nail
//          held between the fingers of the left hand. STRAW DOLL: a small
//          bound-straw figure that appears in the left hand for Resonance.
// PALETTE  hair #c8763a / hi #e0965a · skin #f6e0cb · jacket #1e2331 /
//          lining #333b52 · skirt #1a1f2c · tights #15171f · belt #7a5535 /
//          buckle #b9a06a · shoes #6b4a30 · eyes #c4762e · steel #b0b8c4 ·
//          haft #7d5836 · straw #e8d49a · iron #33363f
// VFX      STRAW AND BLACK IRON — pale straw-white (#f0e2b8) with matte black
//          nails (#2a2c34). Chosen because nothing else on the roster is even
//          near it: Gojo is cyan, Yuta mint, Sukuna scarlet, Jogo orange fire,
//          Hakari and Nanami gold, Higuruma khaki, Choso arterial red.
// POSTURE  Hip cocked, weight entirely on one leg, the other foot turned out
//          and light. Hammer resting on the shoulder, free hand on the hip.
//          She looks like she has already won and is waiting for you to notice.
// IDENTITY 1) the asymmetric ginger bob with the deep side sweep
//          2) the hammer on the shoulder and the cocked-hip stance
//          3) navy jacket + pleated skirt + black tights + brown heeled shoes
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, coneSpike, sphereShell, shapeExtrude, ribbonShell } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const HAIR = 0xc8763a;
const HAIR_HI = 0xe0965a;
const SKIN = 0xf6e0cb;
const JACKET = 0x1e2331;
const LINING = 0x333b52;
const SKIRT = 0x1a1f2c;
const TIGHTS = 0x15171f;
const BELT = 0x7a5535;
const BUCKLE = 0xb9a06a;
const SHOE = 0x6b4a30;
const EYE = 0xc4762e;
const STEEL = 0xb0b8c4;
const HAFT = 0x7d5836;
const HEART = 0xd8465e;
const STRAW = 0xe8d49a;
const IRON = 0x33363f;

export function buildNobara() {
  const spec = {
    id: 'nobara', name: 'Nobara', H: 1.62, headScale: 1.06,
    shoulder: 0.098, hip: 0.055, muscle: 0.86, bulk: 0.90, legBulk: 0.92,
    skinTone: SKIN, clothColor: JACKET, sleeveColor: JACKET,
    // the legs are TIGHTS, not trousers — the leg tubes take the stocking
    // value and the skirt goes on over them as its own geometry
    pantColor: TIGHTS, shoeColor: SHOE,
    torsoShape: { chest: 0.94, waist: 0.86, hip: 1.02 },
    face: { jaw: 0.90, chin: 1.04, width: 1.02 },
    shoe: { len: 0.100, wid: 0.040, hgt: 0.044 },
    palette: {
      rim: 0xffd0a8, hairRim: 0xffc07a, outline: 0x0b0810,
      accent: 0xe07a34, energy: 0xf0e2b8
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE ---------------------------------------------------------------
  // Large sharp eyes under HIGH ARCHED BROWS, and a mouth with one corner up.
  // The brows do most of the work: set high and angled down toward the nose,
  // they read as "unimpressed and amused" rather than "angry".
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.54, eyeH = headR * 0.32;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.395;
    // heavy upper lash with a flick at the outer corner
    bag.add('flat', tGeo(roundBox(eyeW * 1.10, eyeH * 0.26, 0.004, 0.002),
      { rot: [0, 0, s * 12], pos: [ex, eyeY + eyeH * 0.44, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x1a1016 });
    bag.add('flat', tGeo(new THREE.ConeGeometry(eyeH * 0.10, eyeW * 0.30, 3),
      { rot: [0, 0, s * -74], pos: [ex + s * eyeW * 0.60, eyeY + eyeH * 0.56, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x1a1016 });
    bag.add('flat', tGeo(sharpEye(eyeW, eyeH, s),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf8f6f4 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.46, 12),
      { scale: [0.84, 1.08, 1], pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.03, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.20, 10),
      { scale: [0.86, 1.06, 1], pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.03, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x2a1408 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.13, 8),
      { pos: [ex - s * eyeW * 0.17, eyeY + eyeH * 0.20, faceZ + headR * 0.031] }),
      { bone: 'Head', color: 0xffffff });
    // BROW: HIGH and arched, angled down toward the nose. Set further above
    // the eye than anyone else's on the roster — that gap is the confidence.
    bag.add('flat', tGeo(roundBox(eyeW * 0.94, eyeH * 0.15, 0.004, 0.002),
      { rot: [0, 0, s * -13], pos: [ex - s * eyeW * 0.03, eyeY + eyeH * 1.28, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x7a4526 });
  }
  // MOUTH: a short line with one corner lifted — rotated, and offset off
  // centre, so the smirk is asymmetric like the haircut.
  bag.add('flat', tGeo(roundBox(headR * 0.22, headR * 0.040, 0.004, 0.002),
    { rot: [0, 0, 9], pos: [headR * 0.02, headC.y - headR * 0.575, faceZ - headR * 0.045] }),
    { bone: 'Head', color: 0x9a4a4e });

  // ---- HAIR ---------------------------------------------------------------
  // Scalp shell with the face cut away, then the bob built as CARDS rather
  // than spikes — a bob is a hanging mass with a cut edge, and cones give you
  // a hedgehog. Every card is a ribbon shell with a flat bottom.
  // PASS 3: the shell reaches further down the skull (0.68π rather than 0.58π).
  // At the shorter length there was a bare band of scalp between its bottom
  // edge and the top of the nape cards, which showed up from behind as a pale
  // stripe across the back of her head.
  const FACE_GAP = 1.16;
  bag.add('hair', tGeo(sphereShell(headR * 1.02, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.68, scale: [1.04, 1.0, 1.06]
  }), { pos: [headC.x, headC.y + headR * 0.03, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });

  // ---- hair card helper ----------------------------------------------------
  // PASS 2 REBUILD. The first version handed every card the SAME normal hint,
  // (0,0,1). `ribbonShell` derives its width axis as tangent x normalHint, so
  // a card hanging down got a width axis of X no matter where on the skull it
  // sat — which meant the cards over her EARS were splayed front-to-back like
  // fins and the whole head came out as a pumpkin with the face inside it.
  //
  // The hint has to be the RADIAL direction at that card's position; then the
  // width axis comes out tangential and each card lies flat against the skull.
  // Everything else about the bob (length, belly, the flat cut edge) only
  // started reading once that was right.
  const card = (from, mid, to, w0, w1, hint, color = HAIR) => {
    const geo = ribbonShell([from, mid, to], t => w0 + (w1 - w0) * t, headR * 0.09,
      { seg: 8, normalHint: hint.clone().normalize(), taperThick: false });
    bag.add('hair', geo, { bone: 'Head', color });
  };
  const FWD = new THREE.Vector3(0, 0, 1);

  // THE DEEP SIDE PARTING. Well off centre, and the reason the two sides are
  // built with different card counts and lengths.
  const PART = 0.30;

  // HEAVY SIDE (screen -x): a wide sweep from the parting across the forehead,
  // hanging past the eyebrow and turning out at the cheekbone. These are the
  // only cards allowed in front of the face plane at all, and they stop at the
  // brow — the eyes must stay clear.
  for (const [ox, drop, w0, w1, out, hi] of [
    [0.02, -0.02, 0.30, 0.26, 0.30, false],
    [-0.26, -0.14, 0.34, 0.28, 0.46, true],
    [-0.58, -0.30, 0.30, 0.24, 0.58, false],
    [-0.86, -0.40, 0.26, 0.20, 0.60, false]
  ]) {
    const top = headC.clone().add(v3((PART + ox) * headR, headR * 0.72, headR * 0.46));
    const mid = headC.clone().add(v3((PART + ox - out * 0.5) * headR, headR * (0.72 + drop) * 0.5, headR * 0.74));
    const end = headC.clone().add(v3((PART + ox - out) * headR, headR * drop, headR * 0.58));
    card(top, mid, end, headR * w0, headR * w1, FWD, hi ? HAIR_HI : HAIR);
  }
  // LIGHT SIDE: short, swept back behind the ear, clearing the brow entirely.
  // The asymmetry has to be obvious head-on and this is where it lives.
  for (const [ox, drop, w0, w1] of [
    [0.26, 0.24, 0.28, 0.22],
    [0.58, 0.16, 0.26, 0.20]
  ]) {
    const top = headC.clone().add(v3((PART + ox) * headR, headR * 0.72, headR * 0.44));
    const mid = headC.clone().add(v3((PART + ox + 0.30) * headR, headR * 0.48, headR * 0.56));
    const end = headC.clone().add(v3((PART + ox + 0.46) * headR, headR * drop, headR * 0.14));
    card(top, mid, end, headR * w0, headR * w1, FWD);
  }

  // THE SIDE MASS — the bob proper. Six cards a side hanging from the temple
  // line to the jaw, bellied a little at the cheekbone and cut FLAT at the
  // bottom. The frontmost starts at 0.85 rad, which is behind the cheek: cards
  // any further forward than that sit on the face, which is what pass 1 did.
  // The A-LINE is in the lengths — longest at the jaw, shortest at the nape.
  for (const s of [1, -1]) {
    const cards = [
      { a: 0.85, len: 1.24, w0: 0.30, w1: 0.30, belly: 0.14 },   // jaw framer
      { a: 1.20, len: 1.16, w0: 0.32, w1: 0.32, belly: 0.16 },
      { a: 1.55, len: 1.06, w0: 0.32, w1: 0.32, belly: 0.16 },
      { a: 1.92, len: 0.96, w0: 0.32, w1: 0.30, belly: 0.14 },
      { a: 2.32, len: 0.86, w0: 0.30, w1: 0.28, belly: 0.10 },
      { a: 2.76, len: 0.78, w0: 0.28, w1: 0.26, belly: 0.06 }    // nape, shortest
    ];
    for (const c of cards) {
      const dx = Math.sin(c.a) * s, dz = Math.cos(c.a);
      const radial = v3(dx, 0, dz);
      // PASS 3: rooted at 1.04 head radii, not 0.90. At 0.90 the cards were
      // INSIDE the skull sphere and the nape ones were buried entirely, which
      // is the other half of why the back of her head showed bare scalp.
      const top = headC.clone().add(v3(dx * headR * 1.04, headR * 0.50, dz * headR * 1.04));
      const mid = headC.clone().add(v3(dx * headR * (1.04 + c.belly), headR * (0.50 - c.len * 0.55), dz * headR * (1.04 + c.belly * 0.7)));
      const end = headC.clone().add(v3(dx * headR * (1.04 + c.belly * 0.3), headR * (0.50 - c.len * 1.15), dz * headR * (1.04 + c.belly * 0.2)));
      card(top, mid, end, headR * c.w0, headR * c.w1, radial,
        c.a > 1.4 && c.a < 1.75 ? HAIR_HI : HAIR);
    }
  }
  // a couple of short flyaway strands off the crown so the mass is not a helmet
  for (const [ax, len] of [[0.34, 0.36], [-0.52, 0.30], [0.86, 0.26]]) {
    const d = v3(ax, 0.94, 0.18).normalize();
    const geo = coneSpike(headR * 0.10, headR * len, v3(ax * headR * 0.3, headR * 0.10, -headR * 0.22),
      { radial: 5, hSeg: 3, zScale: 0.8 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    const base = headC.clone().addScaledVector(d, headR * 0.94);
    geo.translate(base.x, base.y, base.z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color: HAIR_HI });
  }

  // ---- GARMENTS -----------------------------------------------------------
  // 1. COLLAR. Short stand collar, open at the throat — deliberately much
  //    lower than Megumi's closed uniform collar so the two uniforms read as
  //    different garments rather than the same asset in two sizes.
  bag.add('cloth', tGeo(latheY([
    [0.038 * H, y.neck - 0.020 * H], [0.041 * H, y.neck + 0.004 * H], [0.040 * H, y.neck + 0.020 * H]
  ], 16, 0.94), {}), { bone: 'Neck', color: JACKET });
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.0402 * H, 0.0030 * H, 6, 16),
    { rot: [90, 0, 0], pos: [0, y.neck + 0.021 * H, 0] }), { bone: 'Neck', color: LINING });
  // the open notch at the front, in the lining value
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.020 * H, 0.030 * H, 0.006 * H, 0.003),
      { rot: [0, s * -22, s * 14], pos: [s * 0.020 * H, 0.796 * H, 0.044 * H] }),
      { bone: 'Chest', color: LINING });
  }

  // 2. JACKET. Button placket down the centre with four visible buttons, and a
  //    hem at the NATURAL WAIST — high, which is what makes the skirt read.
  bag.add('cloth', tGeo(roundBox(0.013 * H, 0.175 * H, 0.007 * H, 0.003),
    { pos: [0, 0.678 * H, 0.058 * H] }), { chain: torsoChain, color: LINING, blend: 0.05 });
  for (let i = 0; i < 4; i++) {
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0055 * H, 0.0055 * H, 0.004 * H, 8),
      { rot: [90, 0, 0], pos: [0, 0.748 * H - i * 0.046 * H, 0.064 * H] }),
      { chain: torsoChain, color: BUCKLE, blend: 0.05 });
  }
  // jacket hem band at the waist
  bag.add('cloth', latheY([
    [0.070 * H, 0.578 * H], [0.073 * H, 0.598 * H], [0.070 * H, 0.616 * H]
  ], 20, 0.80), { chain: torsoChain, color: JACKET, blend: 0.05 });
  // sleeve cuffs
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const cuff = wr.clone().lerp(el, 0.12);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0185 * H, 0.0175 * H, 0.020 * H, 10),
      { pos: [cuff.x, cuff.y, cuff.z] }), { bone: 'Hand' + s, color: LINING });
  }

  // 3. THE PLEATED SKIRT. A flaring shell from the waist to just above the
  //    knee, with FOURTEEN pleat ribs standing proud of it. The ribs are the
  //    whole point — a smooth cone here reads as a lampshade and loses the
  //    uniform completely.
  // PASS 2: the first version ran 0.548 → 0.400·H with a 0.106 flare and
  // fourteen fat ribs, which came out as a slatted barrel from ribs to knee.
  // Shorter (it ends above the knee, as the reference has it), less flare, and
  // TEN thinner ribs that alternate value instead of standing off the surface.
  const skirtTop = 0.548 * H, skirtHem = 0.428 * H;
  bag.add('cloth', latheY([
    [0.070 * H, skirtTop], [0.079 * H, skirtTop - 0.032 * H],
    [0.089 * H, skirtTop - 0.072 * H], [0.094 * H, skirtHem]
  ], 24, 0.92), { bone: 'Hips', color: SKIRT });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const rMid = 0.083 * H;
    bag.add('cloth', tGeo(roundBox(0.009 * H, 0.104 * H, 0.007 * H, 0.002), {
      rot: [-6, a * 57.2958, 0],
      pos: [Math.sin(a) * rMid, (skirtTop + skirtHem) * 0.5, Math.cos(a) * rMid * 0.92]
    }), { bone: 'Hips', color: i % 2 ? LINING : SKIRT });
  }
  // PASS 3: the lighter hem torus is gone. With the sprung panels hanging just
  // below it, it read as a hula hoop around her knees rather than as a cut
  // edge — the panels are the hem now and they carry their own outline.

  // 4. THE TOOL BELT. Worn LOW and canted — it sits on the hips, not the
  //    waist, and the tilt is deliberate: a level belt looks like part of the
  //    skirt, a canted one looks like something she put on herself.
  // PASS 3: the belt now sits ON the top of the skirt rather than above it,
  // and the pouches ride the belt instead of hanging out from under the hem
  // like saddlebags.
  bag.add('cloth', tGeo(latheY([
    [0.0725 * H, 0.532 * H], [0.0765 * H, 0.548 * H], [0.0725 * H, 0.562 * H]
  ], 20, 0.90), { rot: [0, 0, -5] }), { bone: 'Hips', color: BELT });
  bag.add('cloth', tGeo(roundBox(0.026 * H, 0.022 * H, 0.010 * H, 0.004),
    { rot: [0, 0, -5], pos: [0.004 * H, 0.546 * H, 0.068 * H] }), { bone: 'Hips', color: BUCKLE });
  // two pouches — the nails live in these
  for (const [ox, oz, w] of [[0.058, 0.032, 0.026], [-0.052, 0.036, 0.020]]) {
    bag.add('cloth', tGeo(roundBox(w * H, 0.034 * H, 0.019 * H, 0.005),
      { rot: [0, ox > 0 ? -26 : 24, -5], pos: [ox * H, 0.540 * H, oz * H] }), { bone: 'Hips', color: BELT });
    bag.add('cloth', tGeo(roundBox(w * H * 0.9, 0.008 * H, 0.021 * H, 0.003),
      { rot: [0, ox > 0 ? -26 : 24, -5], pos: [ox * H, 0.555 * H, oz * H] }), { bone: 'Hips', color: 0x4e341f });
  }
  // a couple of spare nail heads showing above the right pouch
  for (const [dx, dz] of [[0.052, 0.040], [0.062, 0.032], [0.057, 0.026]]) {
    bag.add('metal', tGeo(new THREE.CylinderGeometry(0.0035 * H, 0.0035 * H, 0.028 * H, 6),
      { rot: [10, 0, -14], pos: [dx * H, 0.568 * H, dz * H] }), { bone: 'Hips', color: IRON });
  }

  // 5. SHOES — a low BLOCK HEEL and an ankle strap. The shoe helper gives the
  //    foot shape; the heel and the strap are the distinctive part and they go
  //    on here.
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('cloth', tGeo(roundBox(0.030 * H, 0.026 * H, 0.030 * H, 0.004),
      { pos: [an.x, an.y - 0.016 * H, an.z - 0.026 * H] }), { bone: 'Foot' + s, color: 0x4e341f });
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.030 * H, 0.0042 * H, 6, 14),
      { rot: [86, 0, 0], scale: [1, 0.8, 1], pos: [an.x, an.y + 0.030 * H, an.z + 0.004 * H] }),
      { bone: 'Foot' + s, color: SHOE });
  }

  // ---- springs ------------------------------------------------------------
  // The skirt is the moving piece: four panels on their own chains so it
  // swings, plus a light flick on the heavy side of the fringe. The bob itself
  // is NOT sprung — a bob that flops is a wig.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.007 };
  const springs = [];
  for (const [ax, az] of [[0.72, 0.62], [-0.72, 0.62], [0.78, -0.58], [-0.78, -0.58]]) {
    springs.push({
      bone: 'Hips',
      localOffset: v3(ax * 0.090 * H, -0.086 * H, az * 0.078 * H),
      restDir: v3(ax * 0.16, -1, az * 0.14).normalize(),
      stiffness: 86, damping: 0.80, gravity: 9,
      segments: [
        { len: 0.048 * H, mesh: makeFlapMesh(0.072 * H, 0.070 * H, 0.048 * H, 0.008, clothMat, SKIRT, oOpts) },
        { len: 0.032 * H, mesh: makeFlapMesh(0.070 * H, 0.062 * H, 0.032 * H, 0.007, clothMat, LINING, oOpts) }
      ]
    });
  }
  const headJ = joints.get('Head');
  springs.push({
    bone: 'Head',
    localOffset: v3((headC.x - 0.62 * headR) - headJ.x, (headC.y - headR * 0.72) - headJ.y, (headC.z + headR * 0.60) - headJ.z),
    restDir: v3(-0.35, -1, 0.20).normalize(), stiffness: 110, damping: 0.78, gravity: 5,
    segments: [{ len: 0.030 * H, mesh: makeFlapMesh(0.030 * H, 0.020 * H, 0.030 * H, 0.010, hairMat, HAIR, oOpts) }]
  });

  // ---- PROPS: the hammer, a nail, the straw doll --------------------------
  const metalMat = MAT.metal({ rimColor: 0xdfe8ff });
  const woodMat = MAT.cloth({ rimColor: 0xffd0a8 });
  const flatMat = MAT.flat();
  const colored = (geo, color, mat) => {
    const n = geo.getAttribute('position').count;
    const c = new THREE.Color(color);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return new THREE.Mesh(geo, mat);
  };

  // THE HAMMER. Squared steel head with a claw at the back, a HEART cut into
  // the cheek, and a long wrapped haft — long enough to rest on a shoulder,
  // which is the pose the whole character is built around.
  // PASS 2: scaled up a quarter. At the first size it read as a tack hammer
  // tucked behind her ear rather than as the weapon the stance is built
  // around — a prop that has to be legible at fighting distance has to be
  // bigger than "realistic for a 160 cm frame".
  const hammer = new THREE.Group();
  {
    const head = colored(roundBox(0.062, 0.076, 0.142, 0.010, 2), STEEL, metalMat);
    head.position.y = 0.265;
    // the striking face, a shade brighter
    const face = colored(new THREE.CylinderGeometry(0.034, 0.037, 0.015, 12), 0xd6dce6, metalMat);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 0.265, 0.077);
    // the claw
    const claw = colored(shapeExtrude([
      [-0.015, 0], [0.015, 0], [0.025, -0.054], [0.007, -0.064], [0, -0.037],
      [-0.007, -0.064], [-0.025, -0.054]
    ], 0.037), 0x9aa2ae, metalMat);
    claw.rotation.set(Math.PI / 2, 0, 0);
    claw.position.set(0, 0.265, -0.072);
    // THE HEART, on the cheek of the head. Small, and it is the one piece of
    // whimsy on a character otherwise made of iron.
    for (const s of [1, -1]) {
      const h = colored(heartShape(0.038), HEART, flatMat);
      h.rotation.y = s * Math.PI / 2;
      h.position.set(s * 0.032, 0.265, 0.005);
      hammer.add(h);
    }
    const haft = colored(new THREE.CylinderGeometry(0.0155, 0.0192, 0.52, 10), HAFT, woodMat);
    haft.position.y = 0.006;
    // grip wrap: three dark bands down the lower haft
    const wrap = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const b = colored(new THREE.CylinderGeometry(0.0200, 0.0200, 0.037, 10), 0x3d2a18, woodMat);
      b.position.y = -0.124 - i * 0.052;
      wrap.add(b);
    }
    const cap = colored(new THREE.SphereGeometry(0.021, 8, 6), 0x3d2a18, woodMat);
    cap.position.y = -0.245;
    hammer.add(head, face, claw, haft, wrap, cap);
  }

  // A NAIL. Long black iron, square-sectioned, flat head — held between the
  // fingers of the left hand for Hairpin and driven into the doll for
  // Resonance.
  const nail = new THREE.Group();
  {
    const shaft = colored(new THREE.CylinderGeometry(0.0045, 0.0012, 0.130, 4), IRON, metalMat);
    const head = colored(new THREE.CylinderGeometry(0.0105, 0.0105, 0.007, 6), 0x4a4e58, metalMat);
    head.position.y = 0.066;
    nail.add(shaft, head);
  }

  // THE STRAW DOLL. Bound straw: a body bundle, a head knot, two arm stubs and
  // two leg stubs, tied with dark cord. Small — it has to read as a thing held
  // in one hand, not a prop she is carrying.
  const doll = new THREE.Group();
  {
    const strawMat = MAT.cloth({ rimColor: 0xfff0c0 });
    const body = colored(new THREE.CylinderGeometry(0.021, 0.017, 0.070, 8), STRAW, strawMat);
    const head = colored(new THREE.SphereGeometry(0.020, 8, 6), STRAW, strawMat);
    head.scale.set(1, 0.92, 0.92);
    head.position.y = 0.050;
    const tieN = colored(new THREE.TorusGeometry(0.0175, 0.0035, 5, 10), 0x3a2c1c, strawMat);
    tieN.rotation.x = Math.PI / 2;
    tieN.position.y = 0.030;
    const tieW = colored(new THREE.TorusGeometry(0.0195, 0.0035, 5, 10), 0x3a2c1c, strawMat);
    tieW.rotation.x = Math.PI / 2;
    tieW.position.y = -0.004;
    doll.add(body, head, tieN, tieW);
    for (const s of [1, -1]) {
      const arm = colored(new THREE.CylinderGeometry(0.0075, 0.0055, 0.046, 6), STRAW, strawMat);
      arm.rotation.z = s * Math.PI / 2.3;
      arm.position.set(s * 0.026, 0.014, 0);
      const leg = colored(new THREE.CylinderGeometry(0.0080, 0.0060, 0.040, 6), STRAW, strawMat);
      leg.rotation.z = s * 0.24;
      leg.position.set(s * 0.008, -0.052, 0);
      doll.add(arm, leg);
    }
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.010, outlineHairScale: 0.9,
    props: {
      // NOTE: attachment offsets are BONE-LOCAL. The shoulder rest keeps the
      // haft along the collarbone with the head clearing the ear.
      hammer: {
        node: hammer, default: 'shoulder',
        attachments: {
          // PASS 2: the rest pose was pinned to the CHEST bone, which parked
          // the whole hammer beside her ear like a lollipop while her hand sat
          // empty six inches away. She is HOLDING it — both attachments live
          // on the right hand and the STANCE does the work of putting that
          // hand up by her shoulder, which is the honest construction and also
          // the only one that survives every clip.
          // head UP and behind the shoulder, haft running down across the
          // chest — a hammer resting on a shoulder, not a rifle at port arms
          shoulder: { bone: 'HandR', pos: [0, -0.048 * H, 0.016 * H], rot: [148, 0, -10] },
          hand: { bone: 'HandR', pos: [0, -0.055 * H, 0.010 * H], rot: [-4, 0, 0] },
          away: { bone: 'Hips', pos: [0, -9, 0], rot: [0, 0, 0] }
        }
      },
      nail: {
        node: nail, default: 'away',
        attachments: {
          // pinched between the fingers of the LEFT hand for a Hairpin throw
          hand: { bone: 'HandL', pos: [0, -0.052 * H, 0.014 * H], rot: [8, 0, 0] },
          // ...and gripped point-down in the RIGHT for Resonance, because the
          // left one is holding the doll. Both hands are full during the
          // channel, which is the readable part of the tell.
          drive: { bone: 'HandR', pos: [0, -0.058 * H, 0.010 * H], rot: [172, 0, 0] },
          away: { bone: 'Hips', pos: [0, -9, 0], rot: [0, 0, 0] }
        }
      },
      doll: {
        node: doll, default: 'away',
        attachments: {
          hand: { bone: 'HandL', pos: [0, -0.048 * H, 0.020 * H], rot: [-14, 0, 12] },
          away: { bone: 'Hips', pos: [0, -9, 0], rot: [0, 0, 0] }
        }
      }
    }
  });
  return model;
}

// A sharper eye than the shared almond: hard flicked outer corner, big round
// inner half. `s` = 1 for her left (screen +x).
function sharpEye(w, h, s) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 * s, -h * 0.06);
  sh.quadraticCurveTo(-w * 0.20 * s, h * 0.70, w * 0.40 * s, h * 0.30);
  sh.lineTo(w / 2 * s, h * 0.24);
  sh.quadraticCurveTo(w * 0.04 * s, -h * 0.54, -w / 2 * s, -h * 0.06);
  return new THREE.ShapeGeometry(sh, 10);
}

// The heart cut into the hammer's cheek. Flat shape, extruded a hair so it
// stands off the steel rather than z-fighting with it.
function heartShape(size) {
  const s = new THREE.Shape();
  const r = size;
  s.moveTo(0, -r * 0.95);
  s.bezierCurveTo(r * 1.05, -r * 0.10, r * 0.62, r * 0.78, 0, r * 0.30);
  s.bezierCurveTo(-r * 0.62, r * 0.78, -r * 1.05, -r * 0.10, 0, -r * 0.95);
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: false, steps: 1 });
  geo.translate(0, 0, -0.002);
  geo.computeVertexNormals();
  return geo;
}
