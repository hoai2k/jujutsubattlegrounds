// INUMAKI TOGE — 狗巻棘
//
// ===========================================================================
// REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-19 (web). Sources: the Jujutsu Kaisen Wiki character page
// for Toge Inumaki, the Heroes Wiki entry, the Carbon Costume cosplay
// breakdown (which is the most useful of the lot for garment construction
// because it itemises the pieces), the ORICON profile guide, and the JJK
// Official Fanbook figures quoted across all of them.
//
// I had web search and page fetch available and used both. What I did NOT
// have is direct image reference: two of the wiki pages returned 402/403 to
// the fetch tool, so the silhouette below is assembled from written
// descriptions plus the shapes this roster already establishes for the same
// uniform (Yuta and Megumi both wear it). Everything marked [DESC] comes from
// a written source; everything marked [INF] is my inference and is the part to
// check first if this ever looks wrong.
//
// BUILD    [DESC] "A slim young man." Teenage, second-year. Official Fanbook
//          height ~170 cm — so he is NOT short. He reads small next to the
//          adults because he is SLIGHT, not because he is little: narrow
//          shoulders, low muscle, and a posture that folds inward. Modelled at
//          H 1.68 with shoulder 0.086 (the narrowest on the roster — Yuta is
//          0.092) and muscle 0.80.
//
// HEAD     [DESC] Light skin, soft young face, greyish-purple eyes. [INF] Jaw
//          kept soft and narrow; the face is mostly EYES, because from the
//          nose down he is covered and the eyes are the only expression the
//          design gets to use. Eye colour 0x8a7bb0 — grey-violet, not purple.
//
// HAIR     [DESC] Mid-length, STRAIGHT, and light: the anime gives him
//          platinum blonde (some sources say silvery-white; the anime palette
//          is the one modelled). It is the second most identifying thing about
//          him after the collar, and the shape is specific:
//            FRONT   a heavy straight fringe, cut level, sitting ON the brow —
//                    not swept, not spiked, not parted in the middle.
//            SIDE    two long face-framing locks down past the jaw, longer
//                    than the fringe, which is what stops the silhouette from
//                    reading as a bowl cut.
//            BACK    [INF] falls to the nape and stops — no tail, no volume.
//            CROWN   flat. He has no lift anywhere. Compared with Yuta's
//                    layered shaggy bowl this is smoother and heavier.
//          Palette: 0xe8e2cf lit / 0xc7bfa6 shadowed. Deliberately warm-off-
//          white rather than yellow — a saturated blonde read as Nobara's
//          orange at fight-camera distance in the first pass.
//
// COLLAR   [DESC] THE SINGLE MOST IDENTIFYING FEATURE. His Jujutsu High
//          uniform was TAILORED for him: a high collar WITH A ZIPPER that
//          covers his mouth. It is a garment worn to stop a technique going
//          off by accident, not a fashion choice, and it is modelled as real
//          geometry — a tapered shell of genuine thickness with a folded top
//          edge, a zip tape up the centre front and a puller at the top.
//          It sits on its OWN GROUP on the Neck bone (`collar` below) so it
//          can pivot: see `setCollar`.
//
// MARKS    [DESC] The "SNAKE EYES AND FANGS" seal of the Inumaki clan, borne
//          from birth on his TONGUE and BOTH CHEEKS. On the cheeks it reads as
//          a dark curled snake-eye motif with two fang strokes descending from
//          it. They are normally HIDDEN under the collar and they are visible
//          exactly when he speaks — which is why they are built as their own
//          emissive layer with an opacity dial rather than painted on.
//
// UNIFORM  [DESC] Standard Jujutsu High: a high-collared long jacket over dark
//          trousers and dark shoes. [DESC] the anime tints his ROYAL BLUE
//          rather than the near-black the others wear — that tint is the
//          reason he does not disappear next to Megumi in a lineup and it is
//          modelled. Cuffs and hem are the darker value of the same cloth.
//
// POSTURE  [DESC/INF] Closed off. Hands in pockets, shoulders rolled forward,
//          chin down, weight back. He does not want to be here. The whole
//          stance override in art/anim/inumaki.js is built on that, and on the
//          one thing that breaks it: when he speaks he comes FORWARD, square,
//          chin up, one hand out. See that file's header.
//
// PALETTE
//   uniform     #2a3d78  (royal blue)          shadowed layers  #1b2750
//   collar      #32488c  · fold #223160 · zip tape #101828 · zip teeth #b9c2d8
//   trousers    #16192a       shoes  #101320
//   hair        #e8e2cf  · shadow #c7bfa6
//   skin        #f4ded0       eyes  #8a7bb0
//   marks       #2a1420  · lit #d0407a (they GLOW when he speaks)
//   accent      #9fd8c8  (his cursed-energy colour — a pale sickly mint, so it
//                         reads against every command colour without ever
//                         being mistaken for one of them)
//
// KEY IDENTIFIERS, in the order somebody would name them:
//   1) the high collar zipped up over his mouth
//   2) pale straight hair with a heavy level fringe
//   3) the snake-eye markings on both cheeks
//   4) hands in pockets and a body angled away from the fight
//
// ===========================================================================
// THE COLLAR IS THE ANIMATION, NOT JUST THE SILHOUETTE
// ===========================================================================
// Half the character is that the collar MOVES. `setCollar(k)` takes 0..1 and
// is driven every frame of an utterance from fx/speechfx.js:
//
//   k = 0   zipped, sitting over the bridge of the nose. Mouth and markings
//           completely hidden. This is his default and where he settles back.
//   k = 1   hauled down under the chin, the fold rolled over on itself, the
//           zip puller ridden all the way to the bottom of the tape, mouth
//           open, both cheek seals lit.
//
// It is NOT a linear slide. The dial is smoothed inside this file with an
// asymmetric ease — it comes DOWN fast (0.09 s to fall, because a command is
// abrupt) and goes BACK slow (0.35 s to settle, because he is done and there
// is no hurry). Driving the mesh directly off the raw dial made it snap in
// both directions and read like a visor rather than cloth, which is the note
// that cost this file two passes.
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3, DEG } from '../../../core/math.js';

const UNI = 0x2a3d78;       // royal blue jacket
const UNI_SH = 0x1b2750;    // its shadowed / folded layers
const COL = 0x32488c;       // the collar, a half-step lighter than the body
const COL_FOLD = 0x223160;  // the rolled top edge
const ZIP_TAPE = 0x101828;
const ZIP_TEETH = 0xb9c2d8;
const PANT = 0x16192a;
const SHOE = 0x101320;
const HAIR = 0xe8e2cf;
const HAIR_SH = 0xc7bfa6;
const SKIN = 0xf4ded0;
const EYE = 0x8a7bb0;
const MARK = 0x2a1420;      // the seal, unlit
const MARK_LIT = 0xd0407a;  // the seal, speaking
const ACCENT = 0x9fd8c8;

// Partial lathe — same helper Yuta's jacket uses, for the same reason: it lets
// a garment hang OPEN at the front instead of sealing into a tube. Duplicated
// rather than shared because it is six lines and hoisting it would mean
// touching yuta.js, which this addition has no business doing.
function lathePartialY(profile, { phiStart = 0, phiLength = Math.PI * 2, seg = 22, zScale = 1 } = {}) {
  const pts = profile.map(p => new THREE.Vector2(Math.max(0.0004, p[0]), p[1]));
  const geo = new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
  if (zScale !== 1) geo.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, zScale));
  geo.computeVertexNormals();
  return geo;
}

export function buildInumaki() {
  const spec = {
    id: 'inumaki', name: 'Inumaki', H: 1.68, headScale: 1.05,
    // THE NARROWEST SHOULDERS ON THE ROSTER. Yuta is 0.092 and reads slight;
    // this is under that on purpose, because "smaller and slighter than most
    // of the roster" has to be true in the silhouette before it is true in the
    // stat line.
    shoulder: 0.086, hip: 0.049, muscle: 0.80, bulk: 0.94, legBulk: 0.90,
    skinTone: SKIN,
    clothColor: UNI,
    sleeveColor: UNI,
    foreSleeveColor: UNI_SH,   // the cuff is the darker value, not bare arm
    pantColor: PANT,
    shoeColor: SHOE,
    torsoShape: { chest: 0.94, waist: 0.90, hip: 0.96 },
    face: { jaw: 0.92, chin: 0.86, width: 0.98 },
    shoe: { len: 0.108, hgt: 0.048 },
    palette: {
      rim: 0xbcd4ff, hairRim: 0xfff6dd, outline: 0x090b14,
      accent: ACCENT, energy: 0xbff0e2
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ================= JACKET =================================================
  // Closed at the front, unlike Yuta's. The reference is unambiguous that his
  // is done up — a jacket hanging open under a collar he keeps zipped would be
  // saying the opposite of what the character says about himself.
  bag.add('cloth', latheY([
    [0.077 * H, 0.385 * H],   // hem
    [0.074 * H, 0.46 * H],
    [0.069 * H, 0.535 * H],   // waist
    [0.075 * H, 0.62 * H],
    [0.080 * H, 0.70 * H],    // chest
    [0.079 * H, 0.762 * H],
    [0.060 * H, 0.808 * H]    // shoulder taper
  ], 26, 0.82), { chain: torsoChain, color: UNI, blend: 0.05 });

  // centre placket + the row of buttons down it
  bag.add('cloth', tGeo(roundBox(0.017 * H, 0.30 * H, 0.008 * H, 0.003),
    { rot: [8, 0, 0], pos: [0, 0.60 * H, 0.066 * H] }),
    { chain: torsoChain, color: UNI_SH, blend: 0.05 });
  for (let i = 0; i < 4; i++) {
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.0058 * H, 6, 5),
      { pos: [0, 0.505 * H + i * 0.062 * H, 0.072 * H] }),
      { chain: torsoChain, color: 0x0e1424, blend: 0.05 });
  }

  // POCKETS — and they are load-bearing, because his idle has his hands IN
  // them. Two slanted welts at the hip, deep enough to read as openings.
  for (const s of [1, -1]) {
    // Placed against the WRISTS the stance actually produces rather than
    // against an idea of where a pocket goes — a welt three centimetres from
    // the hand reads as a hand hovering next to a pocket, which is worse than
    // no pocket at all.
    bag.add('cloth', tGeo(roundBox(0.038 * H, 0.010 * H, 0.006 * H, 0.002),
      { rot: [4, 0, s * 20], pos: [s * 0.062 * H, 0.478 * H, 0.048 * H] }),
      { bone: 'Hips', color: UNI_SH });
    bag.add('cloth', tGeo(roundBox(0.036 * H, 0.032 * H, 0.004 * H, 0.002),
      { rot: [4, 0, s * 20], pos: [s * 0.064 * H, 0.458 * H, 0.046 * H] }),
      { bone: 'Hips', color: 0x121a34 });
  }

  // belt + hem skirt
  bag.add('cloth', latheY([
    [0.0725 * H, 0.500 * H], [0.0745 * H, 0.520 * H], [0.0725 * H, 0.540 * H]
  ], 20, 0.82), { bone: 'Hips', color: 0x0c1020 });
  bag.add('cloth', latheY([
    [0.081 * H, 0.360 * H], [0.079 * H, 0.42 * H], [0.074 * H, 0.492 * H]
  ], 22, 0.82), { bone: 'Hips', color: UNI });

  // cuffs — a darker band at each wrist
  for (const s of ['L', 'R']) {
    const el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const axis = wr.clone().sub(el).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    const cuff = new THREE.CylinderGeometry(0.026 * H, 0.028 * H, 0.040 * H, 12);
    cuff.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    const at = el.clone().lerp(wr, 0.86);
    cuff.translate(at.x, at.y, at.z);
    bag.add('cloth', cuff, { bone: 'LoArm' + s, color: 0x141d3c });
    // shoulder seam
    const sh = joints.get('UpArm' + s);
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.029 * H, 0.005 * H, 6, 14),
      { rot: [90, 0, (s === 'L' ? 1 : -1) * 12], pos: [sh.x, sh.y - 0.004 * H, sh.z] }),
      { bone: 'UpArm' + s, color: UNI_SH });
  }

  // ================= FACE ===================================================
  // Big eyes, soft brow, and a MOUTH THAT IS ACTUALLY THERE — normally hidden
  // by the collar, but it has to exist because the collar comes down.
  addFace(ctx, {
    eyeW: 0.58, eyeH: 0.37, eyeColor: EYE, browTilt: 2, browUp: 1.24,
    lashColor: 0x161320, browColor: 0xbdb49a, mouthW: 0.15, mouthColor: 0x7a4048
  });

  // ================= HAIR ===================================================
  // Heavy, straight, LEVEL fringe. The lock helper is Yuta's shape (it is the
  // right shape for hair cards) but the lengths are deliberately UNIFORM where
  // his are jagged — that evenness is the whole difference between a shaggy
  // bowl and Inumaki's blunt cut, and the first pass got it wrong by reusing
  // his jagged length table.
  // PASS 3. The cap was 1.10 headR and it read as a smooth plastic egg with a
  // hard shading seam across the crown — the same trap Yuta's file records,
  // arrived at from the other direction. Two changes: it is TIGHTER to the
  // skull (1.06), so it stops being the dominant volume, and a handful of
  // broad CROWN PLATES are laid over it to break the dome into panels. They
  // are near-flat and short, so they read as parted hair rather than as the
  // vertical antennae Yuta's note warns about.
  bag.add('hair', tGeo(sphereShell(headR * 1.06, {
    thetaLength: Math.PI * 0.50, scale: [1.01, 1.00, 1.04]
  }), { pos: [headC.x, headC.y + headR * 0.045, headC.z - headR * 0.05] }),
    { bone: 'Head', color: HAIR });

  const lock = (a0, a1, w, droop, flare = 1.0, thick = 0.012) => {
    const dir = v3(Math.sin(a0) * Math.cos(a1), Math.sin(a1), Math.cos(a0) * Math.cos(a1));
    const flat = v3(dir.x, 0, dir.z).normalize();
    const p0 = headC.clone().addScaledVector(dir, headR * 0.99);
    const p1 = headC.clone().addScaledVector(flat, headR * 1.06 * flare);
    p1.y = p0.y - droop * 0.44;
    const p2 = headC.clone().addScaledVector(flat, headR * 1.02 * flare);
    p2.y = p0.y - droop;
    return ribbonShell([p0, p1, p2], t => w * (1 - t * 0.66), thick, { seg: 6, normalHint: flat.clone() });
  };

  // NO CROWN PLATES. Pass 3 laid four broad slabs over the cap to break the
  // dome and they read as RIBS — a row of horizontal bars across the skull,
  // which is worse than the smooth egg they were there to fix. The dome is
  // broken instead by tightening the cap (above) and by letting the fringe and
  // the nape locks, which are now thick enough to have their own silhouettes,
  // do the work. This is the same conclusion Yuta's file reached from the
  // other direction and the note is kept here so nobody tries it a third time.

  // FRINGE — NINE locks, not thirteen, and each is a third wider and twice as
  // thick. THIS IS THE FIX THAT MATTERED: at 0.0105 thickness and 0.30 width
  // the hair outline (0.011 × 1.2 for the hair slot) was as wide as the lock
  // itself, so every strand rendered as a solid black spike and the fringe
  // read as a row of teeth. A hair card has to be comfortably thicker than its
  // own outline or the outline IS the card.
  //
  // Lengths stay near-constant so the bottom edge is a straight line across
  // the brow — that evenness is the whole difference between a blunt cut and
  // Yuta's shaggy bowl, and it is the shape the reference calls for. The
  // ±0.012 wobble is the only variation; a perfectly equal set is a wig.
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) * 0.235;
    const len = 0.215 + ((i % 3) - 1) * 0.012;
    bag.add('hair', lock(a, 0.55 - Math.abs(a) * 0.06, headR * 0.42, headR * len, 1.0, 0.021),
      { bone: 'Head', color: i % 4 === 0 ? HAIR_SH : HAIR });
  }
  // THE TWO LONG FACE-FRAMING LOCKS. These are what make the silhouette his:
  // they run past the jaw, well below the fringe, one on each side.
  for (const s of [1, -1]) {
    bag.add('hair', lock(s * 0.94, 0.30, headR * 0.44, headR * 1.34, 1.06, 0.024), { bone: 'Head', color: HAIR });
    bag.add('hair', lock(s * 1.26, 0.27, headR * 0.40, headR * 1.06, 1.03, 0.022), { bone: 'Head', color: HAIR_SH });
    bag.add('hair', lock(s * 1.62, 0.25, headR * 0.38, headR * 0.86, 1.0, 0.021), { bone: 'Head', color: HAIR });
    bag.add('hair', lock(s * 2.00, 0.23, headR * 0.36, headR * 0.78, 1.0, 0.020), { bone: 'Head', color: HAIR });
  }
  // nape — short and flat, no volume
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i - 2.5) * 0.30;
    bag.add('hair', lock(a, 0.23, headR * 0.40, headR * 0.70, 1.0, 0.020), { bone: 'Head', color: i % 2 ? HAIR_SH : HAIR });
  }

  // ================= BONE-LOCAL SPACE, AND THE TRAP =========================
  // Everything from here down is added DIRECTLY TO A BONE rather than through
  // `bag.add`, because it has to be animated at runtime and the PartBag bakes
  // its geometry into one merged skinned mesh.
  //
  // THE TRAP, AND IT COST THIS FILE A WHOLE PASS: `bag.add(geo, {bone})` takes
  // geometry in WORLD BIND SPACE and rebinds it, but `bone.add(mesh)` takes
  // BONE-LOCAL space — and every bone in this rig sits at its own joint
  // position, so a collar built at y = 1.42 and parented to the Neck bone
  // lands at y = 2.84, a metre and a half over his head. On the first sheet it
  // read as a small floating blob in the top corner of two cells and nothing
  // else, which is exactly how easy it is to miss.
  //
  // So: both assemblies are built around their own local origin and then
  // MOUNTED at (their world position − their bone's joint position). That also
  // puts the collar's rotation pivot where it belongs — at the base of the
  // collar — instead of at the character's feet.
  const neckJ = joints.get('Neck');
  const headJ = joints.get('Head');

  // ================= THE CHEEK SEALS ========================================
  // 蛇目と牙 — Snake Eyes and Fangs. Built as flat cards with their OWN material
  // instance (not the shared `flat` slot) so opacity and colour can be dialled
  // independently — that is the whole reason they can be hidden and then lit.
  //
  // Local origin is the HEAD JOINT, so the offsets below are read straight off
  // `headC` minus that joint.
  const markMat = new THREE.MeshBasicMaterial({
    color: MARK, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
  });
  const marks = new THREE.Group();
  const faceZ = headC.z + headR * 0.615;
  const mx = -headJ.x, my = -headJ.y, mz = -headJ.z;
  for (const s of [1, -1]) {
    // the snake EYE: a squashed ring with a vertical slit through it
    // THINNER AND BIGGER. Pass 3 had it 0.075-0.125 and it rendered as a solid
    // purple lozenge under the eye — a bruise, not a seal. A snake eye is
    // mostly OPEN: a narrow iris ring around a slit.
    const ring = new THREE.Mesh(new THREE.RingGeometry(headR * 0.112, headR * 0.150, 16), markMat);
    ring.scale.set(1, 0.72, 1);
    ring.position.set(
      mx + s * headR * 0.52,
      my + headC.y - headR * 0.30,
      mz + faceZ - headR * 0.16);
    ring.rotation.y = s * 0.55;                 // laid onto the cheek plane
    marks.add(ring);
    const slit = new THREE.Mesh(
      tGeo(roundBox(headR * 0.022, headR * 0.130, 0.003, 0.001), {}), markMat);
    slit.position.copy(ring.position).addScaledVector(
      new THREE.Vector3(Math.sin(s * 0.55), 0, Math.cos(s * 0.55)), 0.004);
    slit.rotation.y = s * 0.55;
    marks.add(slit);
    // the two FANG strokes, descending toward the jaw and tapering
    for (let k = 0; k < 2; k++) {
      const fang = new THREE.Mesh(shapeExtrude([
        [0, 0], [headR * 0.030, 0], [headR * 0.010, -headR * 0.24], [0, -headR * 0.22]
      ], 0.003), markMat);
      fang.position.set(
        mx + s * headR * (0.48 + k * 0.11),
        my + headC.y - headR * 0.40,
        mz + faceZ - headR * 0.15);
      fang.rotation.y = s * 0.55;
      fang.rotation.z = s * (0.16 + k * 0.12);
      marks.add(fang);
    }
  }
  ctx.rig.bones.get('Head').add(marks);

  // ================= THE COLLAR =============================================
  // Its own group on the NECK bone so the whole assembly pivots as one piece.
  //
  // THE HEIGHT IS THE DESIGN. `cTop` puts the rolled edge at the bridge of his
  // nose — over the mouth, under the eyes — which is where the reference has
  // it and which is the only height that reads as "he cannot speak by
  // accident" rather than as a scarf or a helmet. The first pass had it at
  // 0.95H, up at the eye line, and it swallowed his whole face.
  //
  // The radius FLARES from the neck to the top (0.046H to 0.078H) and the top
  // is deliberately WIDER THAN THE HEAD (headR is 0.073H) — a collar that is
  // narrower than the jaw intersects it, and a collar that merely matches it
  // reads as a tube rather than as a stand-up garment.
  // PASS 3. These two numbers were 0.897/0.812 and the collar came up to his
  // EYES — the whole face was a blue wall in the viewer. The mouth line sits
  // at 0.880 H and the eyes at 0.917 H, so the only correct answer is a top
  // edge in the narrow band between them: it has to cover the mouth (that is
  // the entire point of the garment) and it has to leave the eyes, because
  // they are the only expression this design gets to use.
  // ...and the SQUASH matters as much as the height. At zScale 0.90 the front
  // wall of the collar sat at z 0.107 while the face plane is at 0.095 — so
  // even a collar whose top edge was safely under the eyes still projected
  // OVER them from a front camera. 0.78 tucks the wall behind the face and the
  // eyes survive at every angle, which is the only test that counts.
  const cTop = 0.888 * H;    // just over the mouth, well under the eyes
  const cBase = 0.812 * H;   // where it leaves the shoulders
  const collarPivot = new THREE.Group();
  collarPivot.position.set(-neckJ.x, cBase - neckJ.y, -neckJ.z);
  const collarMat = MAT.cloth({ vertexColors: false, color: COL, rimColor: 0xbcd4ff });
  const foldMat = MAT.cloth({ vertexColors: false, color: COL_FOLD, rimColor: 0x8fa8d8 });
  const tapeMat = MAT.cloth({ vertexColors: false, color: ZIP_TAPE, rimColor: 0x6f7c96 });
  const teethMat = MAT.metal({ vertexColors: false, color: ZIP_TEETH, rimColor: 0xffffff });

  // profiles are in COLLAR-LOCAL y: 0 at the base, `ch` at the roll
  const ch = cTop - cBase;
  // THE SHELL. Real thickness: an outer wall and an inner lining, capped by
  // the rolled top edge, so looking into the collar from above shows a lining
  // rather than a one-sided surface. That is what "proper thickness and fold"
  // has to mean, and it is the difference between cloth and a paper cone.
  const outer = lathePartialY([
    [0.046 * H, 0], [0.055 * H, ch * 0.22],
    [0.066 * H, ch * 0.62], [0.071 * H, ch - 0.010 * H]
  ], { phiStart: 0.10, phiLength: Math.PI * 2 - 0.20, seg: 22, zScale: 0.78 });
  const inner = lathePartialY([
    [0.040 * H, 0], [0.049 * H, ch * 0.22],
    [0.060 * H, ch * 0.62], [0.065 * H, ch - 0.010 * H]
  ], { phiStart: 0.10, phiLength: Math.PI * 2 - 0.20, seg: 22, zScale: 0.78 });
  const shell = new THREE.Mesh(outer, collarMat);
  const lining = new THREE.Mesh(inner, foldMat);
  lining.material.side = THREE.DoubleSide;
  collarPivot.add(shell, lining);
  // the ROLLED TOP EDGE — the read that says "fold"
  // The tube radius was 0.0090 H with a 0.008 outline on top of it, and when
  // the collar dropped and the assembly scaled up, the roll read as a black
  // horseshoe hanging off his chest. Thinner tube, thinner hull, and it does
  // NOT scale with the shell on the way down (see `setCollar`).
  const rollGeo = new THREE.TorusGeometry(0.071 * H, 0.0062 * H, 6, 24, Math.PI * 2 - 0.20);
  rollGeo.rotateX(Math.PI / 2);
  rollGeo.rotateY(0.10);
  rollGeo.scale(1, 1, 0.78);
  rollGeo.translate(0, ch - 0.009 * H, 0);
  const roll = new THREE.Mesh(rollGeo, foldMat);
  collarPivot.add(roll);

  // THE ZIP. Tape up the centre front, teeth on it, and a puller that RIDES —
  // `zipPull.position.y` is driven by `setCollar`, so the zipper is genuinely
  // undone rather than the collar magically flopping open.
  // The tape's z has to follow the SQUASHED wall (zScale 0.78), not the raw
  // radius. At 0.062 H it stood 1 cm proud of the shell and drew a black bar
  // straight down the middle of his face.
  const tape = new THREE.Mesh(
    tGeo(roundBox(0.014 * H, ch * 0.96, 0.005 * H, 0.002),
      { rot: [-9, 0, 0], pos: [0, ch * 0.50, 0.046 * H] }), tapeMat);
  collarPivot.add(tape);
  const teethCount = 9;
  for (let i = 0; i < teethCount; i++) {
    const u = (i + 0.5) / teethCount;
    collarPivot.add(new THREE.Mesh(
      tGeo(roundBox(0.008 * H, 0.0032 * H, 0.004 * H, 0.001),
        { pos: [0, u * ch, (0.036 + u * 0.016) * H] }), teethMat));
  }
  const zipPull = new THREE.Mesh(
    tGeo(roundBox(0.011 * H, 0.015 * H, 0.007 * H, 0.002), {}), teethMat);
  zipPull.add(new THREE.Mesh(
    tGeo(roundBox(0.006 * H, 0.017 * H, 0.003 * H, 0.001), { pos: [0, -0.015 * H, 0.002 * H] }), teethMat));
  const ZIP_TOP = ch - 0.014 * H, ZIP_BOT = 0.010 * H;
  zipPull.position.set(0, ZIP_TOP, 0.054 * H);
  collarPivot.add(zipPull);

  // outlines are added as CHILDREN of their meshes so they inherit the
  // transform. makeOutline does not copy position/rotation, and a hull
  // parented to the group instead of to the mesh sits at the group origin —
  // which is a trap this project has already paid for once.
  shell.add(makeOutline(shell, { color: 0x090b14, thickness: 0.011 }));
  roll.add(makeOutline(roll, { color: 0x090b14, thickness: 0.0045 }));

  // BLOOD AT THE COLLAR — RAW tier and worse. Soaked patches on the inside
  // front of the shell, invisible until `setStrain` says otherwise.
  const bloodMat = new THREE.MeshBasicMaterial({
    color: 0x6e0a12, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide
  });
  const blood = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const patch = new THREE.Mesh(
      tGeo(new THREE.CircleGeometry(0.0072 * H * (1 - i * 0.16), 8),
        { rot: [-12, 0, 0], scale: [1, 2.0 + i * 0.4, 1],
          pos: [(i - 1) * 0.011 * H, ch * (0.10 + i * 0.05), 0.042 * H] }),
      bloodMat);
    blood.add(patch);
  }
  collarPivot.add(blood);
  ctx.rig.bones.get('Neck').add(collarPivot);

  // THE THROAT GLOW — the strain readout, and the gather point for every
  // utterance. On the Neck bone but NOT inside the pivot: the throat does not
  // move when the collar does.
  const throatMat = new THREE.MeshBasicMaterial({
    color: 0xff5a5a, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const throatGlow = new THREE.Mesh(new THREE.SphereGeometry(0.019 * H, 10, 8), throatMat);
  throatGlow.position.set(-neckJ.x, 0.010 * H, -neckJ.z + 0.030 * H);
  throatGlow.scale.set(1, 1.5, 0.6);
  ctx.rig.bones.get('Neck').add(throatGlow);

  // ================= SPRINGS ================================================
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  // jacket tails — short, because the jacket is done up and does not billow
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.046 * H, -0.100 * H, -0.046 * H),
      restDir: v3(s * 0.07, -1, -0.12).normalize(), stiffness: 62, damping: 0.82, gravity: 7,
      segments: [
        { len: 0.058 * H, mesh: makeFlapMesh(0.056 * H, 0.048 * H, 0.058 * H, 0.009, clothMat, UNI, oOpts) }
      ]
    });
    // the LONG FACE LOCKS get their own chain so they swing when he turns —
    // they are the piece of him that moves, given that nothing else does
    springs.push({
      bone: 'Head',
      localOffset: v3(s * headR * 0.60,
        headC.y - joints.get('Head').y - headR * 0.44,
        headC.z - joints.get('Head').z + headR * 0.30),
      restDir: v3(s * 0.10, -1, 0.04).normalize(), stiffness: 74, damping: 0.80, gravity: 5.5,
      segments: [
        { len: headR * 0.42, mesh: makeFlapMesh(headR * 0.22, headR * 0.15, headR * 0.42, 0.008, hairMat, HAIR, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.0110 });

  // =========================================================================
  // RUNTIME HOOKS
  // =========================================================================
  // Three, and every one of them is a no-op on anyone else's model, so nothing
  // that calls them has to know whose model it is holding.

  // ---- THE COLLAR ---------------------------------------------------------
  // `want` is what the game asked for; `k` is where the cloth actually is. The
  // asymmetric ease between them is the note in the header: fast down, slow
  // back, because a command is abrupt and a settle is not.
  let want = 0, k = 0;
  // 86 degrees rather than 74: at 74 the collar sat proud of the chest like a
  // ring somebody had hung on him. Laid nearly flat it reads as a garment
  // folded down, which is what it is.
  const COL_DOWN = 86 * DEG;      // how far the assembly pitches back and down
  const COL_DROP = 0.030 * H;     // and how far it also slides down the neck
  model.setCollar = t => { want = Math.max(0, Math.min(1, t || 0)); };
  model.collarOpen = () => k;

  // ---- THE MARKINGS -------------------------------------------------------
  // Two dials in one: `on` fades the seals in, and the same value drives their
  // emissive lift, so they do not merely appear — they LIGHT.
  let markWant = 0, markK = 0;
  model.setMarks = on => { markWant = on ? 1 : 0; };

  // ---- THE STRAIN ---------------------------------------------------------
  // tier 0..3 plus the 0..1 fill inside it. Drives the throat glow, the blood
  // and (at SILENCED) a permanent dim red at the collar line.
  let tier = 0, frac = 0;
  model.setStrain = (t, f = 0) => {
    tier = Math.max(0, Math.min(3, t | 0));
    frac = Math.max(0, Math.min(1, f));
  };
  model.strainTier = () => tier;

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    // collar: 0.09 s down, 0.35 s back
    const rate = want > k ? dt / 0.09 : -dt / 0.35;
    k = Math.max(0, Math.min(1, k + rate));
    // ease so the last few percent of the settle is slow — cloth does not stop
    // dead
    const e = k * k * (3 - 2 * k);
    collarPivot.rotation.x = e * COL_DOWN;
    collarPivot.position.y = -e * COL_DROP;
    // ...and the wall relaxes outward as it folds, so it reads as fabric
    // slackening rather than a hinge
    // the wall relaxes outward a little as it folds, so it reads as fabric
    // slackening rather than as a hinge — but only a LITTLE. The first pass
    // opened it 16% wider and the collar became the biggest thing on him.
    shell.scale.set(1 + e * 0.07, 1 - e * 0.22, 1 + e * 0.07);
    lining.scale.copy(shell.scale);
    // the roll does NOT grow with it: a rolled hem gets tighter when the
    // garment folds over, not looser
    roll.scale.set(1 - e * 0.06, 1, 1 - e * 0.06);
    // the zip puller rides all the way to the bottom of its tape
    zipPull.position.y = ZIP_TOP + (ZIP_BOT - ZIP_TOP) * e;

    // markings follow the collar with a beat of lag — they are revealed BY the
    // collar dropping, so they must never be lit before it has moved
    const mTarget = Math.min(markWant, e * 1.6);
    markK += (mTarget - markK) * Math.min(1, dt * 14);
    markMat.opacity = markK;
    markMat.color.setHex(MARK).lerp(new THREE.Color(MARK_LIT), markK);

    // strain: the throat reddens through the tiers and pulses harder near the
    // top of each one
    const base = [0, 0.20, 0.52, 0.78][tier];
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() * (0.004 + tier * 0.003));
    throatMat.opacity = (base * (0.72 + 0.28 * pulse) + frac * 0.08) * 0.72;
    throatMat.color.setHex(tier >= 2 ? 0xff2a2a : 0xff7a5a);
    // blood at the collar from RAW onward, and it does not fade back inside a
    // round once it is there — a throat that has bled has bled
    bloodMat.opacity = Math.max(bloodMat.opacity, tier >= 2 ? 0.42 + (tier - 2) * 0.30 : 0);
  };

  // Round reset clears the blood. Called from the same place every other
  // per-round model state is cleared.
  model.clearStrain = () => {
    bloodMat.opacity = 0;
    tier = 0; frac = 0;
    want = 0; k = 0; markWant = 0; markK = 0;
    throatMat.opacity = 0;
  };

  return model;
}
