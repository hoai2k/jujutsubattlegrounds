// CHOSO — built to a researched reference pass over the MAPPA design
// (character-sheet descriptions + anime key art, front / 3-4 / side / back).
//
// ============================ REFERENCE SHEET ============================
// Sources consulted (web, August 2026): QuoteTheAnime's Jujutsu Kaisen wiki
// entry (height 181 cm, "black hair styled in two spiky ponytails", thin
// brows, the nose mark, "dark purple sashes arranged in an X-pattern", neck
// sash, waist sash, brown military boots); daddyjim.ai's character page ("two
// tall ponytails that point upward and out, framing narrow eyes and thin
// brows", "the crimson streak that crosses the bridge of his nose and runs out
// toward both cheeks", "a tan robe underneath a purple V-neck vest that hangs
// to the waist, accompanied by a matching round neck scarf and brown boots",
// anime adds violet eye shadow); Dexerto on the fashion-model inspiration for
// the design. Geometry here is original and procedural — nothing imported.
//
// NOTE ON THE BRIEF. The brief's model checklist asked for a "dark,
// high-collared outfit" in "black and deep crimson". Research says otherwise
// and the brief also says to check the reference and get it right rather than
// approximate, so this is built to the reference: a LIGHT TAN long-sleeved
// robe under a PLUM V-neck vest, plum X-sashes, a plum neck cowl and brown
// boots. Black and crimson survive where they belong — the hair, the nose
// mark, and every drop of blood he throws.
//
// BUILD    181 cm (H 1.81). Slots between the students (1.73-1.75) and the
//          tall adults (Nanami 1.845, Higuruma 1.86, Toji 1.88). Lean but
//          SOLID and visibly older: broader shoulders than Yuji at
//          0.113·H, muscle 1.06, a longer neck and a flatter, wider chest.
//          Standing next to Yuji and Nobara he must read as a man, not a
//          sixth-former — the height alone does not do it, the shoulder
//          width and the low, settled hips do.
// HEAD     Long oval, narrow jaw, small chin. Everything on the face is
//          narrow and level: he is composed, not fierce.
// HAIR     THE SILHOUETTE, half of it. Black, parted in the centre, and
//          gathered into TWO TALL TAILS that leave the crown pointing UP and
//          OUT at roughly 35 degrees from vertical, each bound at the base by
//          a dark tie and splaying into 4-5 stiff strands at the tip. Height
//          of a tail is about 1.5x head radius — from the front the head plus
//          tails is a wide V. A short centre-parted fringe falls to the brow
//          with a clear gap over the nose, and the nape is short and flat.
//          Back view: the two tails read as separate masses with daylight
//          between them, never one bundle.
// FACE     THE MARK. A crimson streak across the BRIDGE of the nose that runs
//          out onto both cheeks, wider in the middle, tapering at the ends,
//          sitting slightly above the level of the eyes' lower lids. It is
//          the single most identifying thing on him and it is modelled as
//          three pieces (bridge + two cheek tapers) so it reads in profile
//          as well as head-on. Violet eye shadow above the lash line, narrow
//          almond eyes tilted down at the outer corner, THIN low brows.
// GARMENTS Outside in:
//            · Round PLUM NECK COWL — a fat closed collar sitting on the
//              collarbones, not a scarf with ends.
//            · TAN ROBE: long-sleeved, loose, covering torso, arms and legs.
//              This is the base layer and it is LIGHT — the contrast with the
//              plum is most of the read.
//            · PLUM V-NECK VEST over the torso, open in a deep V to the
//              sternum and hanging to the waist.
//            · TWO PLUM SASHES crossing the chest in an X, over the vest.
//            · PLUM WAIST SASH, tied, with two short tails at the left hip.
//            · BROWN BOOTS, mid-calf, with a turned cuff.
// PALETTE  hair #101018 / hi #2a2436 · skin #f0dccb (pale) · robe #c9b895 /
//          shade #a99873 · vest #4a2a52 / dark #331a3a · sash #5e3266 ·
//          boots #5a4331 · nose mark #a81428 · eyes #4a3a3e · shadow #6a4a7a
// BLOOD    Deep ARTERIAL red #8e1020 with a #c4142c highlight — deliberately
//          darker and bluer than Sukuna's scarlet (#ff2f45) and nowhere near
//          Jogo's orange fire (#ff5a1f). The game has a lot of red; his is the
//          one that looks like it came out of a body.
// IDENTITY 1) the twin upright tails
//          2) the crimson streak across the nose
//          3) tan robe under a plum V-vest with crossed sashes
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, coneSpike, sphereShell, tubeBetween, ribbonShell } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const HAIR = 0x101018;
const HAIR_HI = 0x2a2436;
const SKIN = 0xf0dccb;
const ROBE = 0xc9b895;
const ROBE_SH = 0xa99873;
const VEST = 0x4a2a52;
const VEST_DK = 0x331a3a;
const SASH = 0x5e3266;
const BOOT = 0x5a4331;
const BOOT_DK = 0x3f2e21;
const MARK = 0xa81428;        // the streak across the nose
const EYE = 0x4a3a3e;
const SHADOW = 0x6a4a7a;      // the violet eye shadow the anime adds
const BLOOD = 0x8e1020;
const BLOOD_HI = 0xc4142c;

export function buildChoso() {
  const spec = {
    id: 'choso', name: 'Choso', H: 1.81, headScale: 0.97,
    // Broader and heavier than the students, without Todo's mass. The hips
    // sit wide because his whole read is a stable base he throws from.
    shoulder: 0.113, hip: 0.054, muscle: 1.06, bulk: 1.02, legBulk: 1.10,
    skinTone: SKIN,
    // The ROBE is the base layer everywhere: torso, sleeves and legs are all
    // the same tan, and the plum goes on top as separate geometry. Building it
    // the other way round (dark base, tan patches) is how you end up with a
    // generic dark top wearing a reference sheet's colours.
    clothColor: ROBE, sleeveColor: ROBE, pantColor: ROBE, shoeColor: BOOT,
    torsoShape: { chest: 1.06, waist: 1.0, hip: 1.0 },
    face: { jaw: 0.94, chin: 0.92, width: 0.95 },     // long narrow oval
    shoe: { len: 0.118, wid: 0.048, hgt: 0.056 },
    palette: {
      rim: 0xd8b8c4, hairRim: 0x8a6f9a, outline: 0x0a060c,
      accent: BLOOD_HI, energy: BLOOD
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- FACE ---------------------------------------------------------------
  // Narrow, level, unhurried. The shared helper's brow is too heavy and its
  // eyes too round for him, so both are drawn here; only the nose wedge and
  // the mouth line are inherited.
  addFace(ctx, { noEyes: true, mouthW: 0.17, mouthColor: 0x7a4a4e });
  const eyeW = headR * 0.48, eyeH = headR * 0.235;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.395;
    // VIOLET EYE SHADOW — a soft band above the lash, wider at the outer
    // corner. The anime's one piece of colour on an otherwise pale face.
    bag.add('flat', tGeo(roundBox(eyeW * 1.20, eyeH * 0.42, 0.004, 0.002),
      { rot: [0, 0, s * 7], pos: [ex + s * eyeW * 0.06, eyeY + eyeH * 0.62, faceZ + headR * 0.018] }),
      { bone: 'Head', color: SHADOW });
    // lash line: thin. He is not a heavy-lidded character, he is a narrow one.
    bag.add('flat', tGeo(roundBox(eyeW * 1.04, eyeH * 0.22, 0.004, 0.002),
      { rot: [0, 0, s * 6], pos: [ex, eyeY + eyeH * 0.40, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x14101a });
    bag.add('flat', tGeo(narrowEye(eyeW, eyeH, s),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf2f2f6 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.44, 12),
      { scale: [0.80, 1.10, 1], pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.02, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.18, 10),
      { pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.02, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x120c10 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.09, 8),
      { pos: [ex - s * eyeW * 0.14, eyeY + eyeH * 0.18, faceZ + headR * 0.03] }),
      { bone: 'Head', color: 0xffffff });
    // THIN BROW, low and nearly level — the smallest brow in the roster.
    bag.add('flat', tGeo(roundBox(eyeW * 0.90, eyeH * 0.11, 0.004, 0.002),
      { rot: [0, 0, s * -4], pos: [ex, eyeY + eyeH * 1.02, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x18121e });
  }

  // ---- THE MARK -----------------------------------------------------------
  // PASS 2. The first attempt sat it too low — level with the upper lip rather
  // than the bridge — and made it far too thick, so it read as a strip of tape
  // across his mouth instead of a birthmark across his nose. It also stopped
  // dead at each end with a squared edge and a stray cone that floated free of
  // the head at 3/4.
  //
  // Corrected: it sits at the LOWER LID LINE (canon crosses the bridge, so its
  // vertical centre is between the eyes, not below them), it is half as thick,
  // and the run onto each cheek is a single narrow slab that follows the
  // cheekbone and is set slightly back in Z so it wraps rather than floats.
  // Three pieces still — a bar plus two cheek runs — because a single bar
  // disappears in profile and this has to survive every angle.
  const markY = eyeY - headR * 0.045;
  bag.add('flat', tGeo(roundBox(headR * 0.235, headR * 0.058, 0.005, 0.002),
    { pos: [0, markY, faceZ + headR * 0.050] }), { bone: 'Head', color: MARK });
  for (const s of [1, -1]) {
    // the cheek run, narrowing as it goes out and canted slightly up
    bag.add('flat', tGeo(roundBox(headR * 0.34, headR * 0.050, 0.005, 0.002),
      { rot: [0, s * -30, s * 6], pos: [s * headR * 0.28, markY + headR * 0.010, faceZ + headR * 0.012] }),
      { bone: 'Head', color: MARK });
    bag.add('flat', tGeo(roundBox(headR * 0.20, headR * 0.036, 0.005, 0.002),
      { rot: [0, s * -52, s * 8], pos: [s * headR * 0.50, markY + headR * 0.022, faceZ - headR * 0.055] }),
      { bone: 'Head', color: MARK });
  }

  // ---- HAIR ---------------------------------------------------------------
  // PASS 2. The first attempt produced a smooth dark bowl with two ANTENNAE on
  // it: the scalp shell came down over the brow and swallowed the fringe, and
  // the tails were built out of thin cones that read as wire. Both are the
  // silhouette, so both are rebuilt here.
  //
  //   · the shell is SHORTER (theta 0.52) and its face window is much WIDER
  //     (1.62 rad), so the forehead is genuinely exposed and the fringe is a
  //     separate mass falling onto it rather than part of the cap.
  //   · the tails are TUBES, not cones — a fat gathered base tapering to a
  //     point over 1.6 head radii, with the splay strands hung around them
  //     rather than standing in for them.
  const FACE_GAP = 1.62;
  bag.add('hair', tGeo(sphereShell(headR * 1.00, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.52, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.06, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 0.99, {
    phiStart: Math.PI / 2 + 1.0, phiLength: Math.PI * 2 - 2.0,
    thetaLength: Math.PI * 0.46, scale: [1, 1.0, 1]
  }), { rot: [-64, 0, 0], pos: [headC.x, headC.y - headR * 0.14, headC.z - headR * 0.22] }),
    { bone: 'Head', color: HAIR });

  const strand = (dir, len, rBase, bend, color = HAIR, root = 0.80) => {
    const d = dir.clone().normalize();
    const base = headC.clone().addScaledVector(d, headR * root);
    const geo = coneSpike(rBase, len, bend, { radial: 6, hSeg: 5, zScale: 0.85 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(base.x, base.y, base.z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color });
  };

  // FRINGE — PASS 3. Cones were the wrong tool twice running: a cone that is
  // long enough to reach the brow is a needle by the time it gets there, and
  // pointed forward at the camera it foreshortens to a pencil line. A fringe
  // is a set of flat LOCKS lying against the forehead, so it is built from
  // ribbon cards — the same construction Nobara's bob uses — which hold their
  // width all the way to the cut end.
  //
  // Centre-parted with a real gap on the centre line, so the forehead shows
  // between the two inner locks and the nose mark is never covered.
  const lock = (topX, dropTo, w0, w1, out, color = HAIR) => {
    const top = headC.clone().add(v3(topX * headR, headR * 0.78, headR * 0.44));
    const mid = headC.clone().add(v3((topX + out * 0.5) * headR, headR * 0.30, headR * 0.80));
    const end = headC.clone().add(v3((topX + out) * headR, headR * dropTo, headR * 0.66));
    bag.add('hair', ribbonShell([top, mid, end], t => headR * (w0 + (w1 - w0) * t),
      headR * 0.16, { seg: 7, normalHint: new THREE.Vector3(0, 0, 1), taperThick: false }),
      { bone: 'Head', color });
  };
  // PASS 3b: the first card version reached to -0.20 head radii and buried
  // both eyes. A fringe that hides the face is not a fringe, it is a curtain —
  // these stop at the BROW (dropTo ~0.04, a touch above the eye line at -0.10)
  // and only the outermost pair hangs past it, beside the eye rather than over
  // it. The mark and both eyes stay clear from every angle.
  lock(0.16, 0.06, 0.34, 0.30, 0.30);
  lock(-0.18, 0.03, 0.36, 0.32, -0.32, HAIR_HI);
  lock(0.48, 0.02, 0.34, 0.30, 0.36);
  lock(-0.50, -0.01, 0.34, 0.30, -0.38);
  lock(0.80, -0.10, 0.30, 0.26, 0.34);
  lock(-0.82, -0.13, 0.30, 0.26, -0.36);
  // temple locks running down past the ear — they frame the jaw and are what
  // stop the head reading as a ball with two twigs on it. Cards again, hung
  // from the side of the skull rather than from the hairline.
  for (const s of [1, -1]) {
    const top = headC.clone().add(v3(s * headR * 0.88, headR * 0.36, headR * 0.30));
    const mid = headC.clone().add(v3(s * headR * 1.00, -headR * 0.24, headR * 0.42));
    const end = headC.clone().add(v3(s * headR * 0.92, -headR * 0.78, headR * 0.30));
    bag.add('hair', ribbonShell([top, mid, end], t => headR * (0.30 - 0.06 * t),
      headR * 0.16, { seg: 7, normalHint: new THREE.Vector3(s, 0, 0), taperThick: false }),
      { bone: 'Head', color: HAIR });
  }

  // THE TWO TAILS. Each is a bound base (a fat dark tie) plus a TAPERED TUBE
  // core and three splay strands hung around it. Both leave the crown at about
  // 33 degrees off vertical, so the front silhouette is a wide V — that shape
  // is half of what identifies him at fighting distance.
  //
  // The core is a tube rather than a cone because a cone's base sits flush on
  // the skull and its tip is a needle; a tube lets the base be genuinely THICK
  // (0.30 head radii, nearly a third of the skull) and the taper end blunt,
  // which is the difference between hair and an antenna.
  const tailDir = s => v3(s * 0.56, 1.00, -0.12);
  for (const s of [1, -1]) {
    const d = tailDir(s).normalize();
    const root = headC.clone().addScaledVector(d, headR * 0.80);
    // PASS 3: shorter and MUCH fatter. Pass 2's tails reached 2.3 head radii
    // on a 0.30 base and still read as two black forks, because a 1.5-radius
    // taper spends most of its length being thin. 1.9 radii on a 0.42 base
    // keeps real mass for the first two thirds and only points at the very
    // end, which is what the reference actually shows.
    const tip = headC.clone().addScaledVector(d, headR * 1.98)
      .add(v3(s * headR * 0.26, 0, -headR * 0.08));
    // the gathered bundle at the base — pushed OUT along the tail rather than
    // sunk into the crown, so it is visible as its own mass
    bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.44, 10, 8),
      { scale: [1, 1.20, 0.94], pos: [root.x, root.y + headR * 0.10, root.z] }),
      { bone: 'Head', color: HAIR });
    // the tie: a squat dark band, fat enough to read from across the arena
    bag.add('hair', tGeo(new THREE.CylinderGeometry(headR * 0.36, headR * 0.40, headR * 0.22, 10),
      { rot: [0, 0, s * -29], pos: [root.x, root.y + headR * 0.02, root.z] }),
      { bone: 'Head', color: 0x07070c });
    // the core: fat at the tie, tapering to a blunt point rather than a needle
    bag.add('hair', tubeBetween(
      root.clone().addScaledVector(d, headR * 0.10), tip,
      [headR * 0.42, headR * 0.085], { radial: 9, hSeg: 5, zScale: 0.95, bulge: 0.08 }),
      { bone: 'Head', color: HAIR });
    // splay: three stiff strands breaking out of the bundle, one lifted so the
    // rim light finds the mass instead of a flat black shape
    const fan = [
      { ox: 0.36, oz: 0.28, len: 1.34, r: 0.19, hi: false },
      { ox: -0.30, oz: 0.16, len: 1.46, r: 0.20, hi: true },
      { ox: 0.12, oz: -0.36, len: 1.22, r: 0.18, hi: false }
    ];
    for (const f of fan) {
      strand(v3(s * 0.56 + f.ox * 0.5, 1.00, -0.12 + f.oz * 0.5),
        headR * f.len, headR * f.r,
        v3(s * headR * 0.44 + f.ox * headR * 0.6, headR * 0.04, f.oz * headR * 0.6),
        f.hi ? HAIR_HI : HAIR, 0.90);
    }
  }
  // nape: short and flat. His length is all in the tails.
  for (const [x, len] of [[0, 0.44], [0.44, 0.42], [-0.44, 0.42], [0.76, 0.34], [-0.76, 0.34]]) {
    strand(v3(x * 0.9, -0.06, -0.94), headR * len, headR * 0.28,
      v3(x * headR * 0.2, -headR * 0.38, -headR * 0.22), HAIR, 0.90);
  }

  // ---- GARMENTS -----------------------------------------------------------
  // 1. THE NECK COWL. A fat closed ring on the collarbones — a round scarf,
  //    not a high collar and not something with ends. It sits LOW: the jaw
  //    line stays clear, which is what keeps him from reading like Megumi.
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.046 * H, 0.021 * H, 8, 18),
    { rot: [90, 0, 0], pos: [0, y.neck - 0.012 * H, 0.004 * H] }), { bone: 'Neck', color: SASH });
  bag.add('cloth', tGeo(latheY([
    [0.041 * H, y.neck - 0.024 * H], [0.045 * H, y.neck + 0.006 * H], [0.040 * H, y.neck + 0.024 * H]
  ], 16, 0.94), {}), { bone: 'Neck', color: VEST_DK });

  // 2. THE ROBE. The torso lathe is already tan; what makes it read as a loose
  //    robe rather than a fitted shirt is the extra skirt below the vest and
  //    the wide gathered cuffs.
  //
  //    PASS 2: the skirt was 0.089·H wide and merged with the thighs into one
  //    tan blob from the ribs to the knee. Narrower and shorter, so the hips
  //    and the legs separate.
  bag.add('cloth', latheY([
    [0.078 * H, 0.430 * H], [0.081 * H, 0.462 * H], [0.077 * H, 0.505 * H], [0.073 * H, 0.548 * H]
  ], 20, 0.80), { bone: 'Hips', color: ROBE });
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const cuff = wr.clone().lerp(el, 0.10);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.023 * H, 0.030 * H, 0.048 * H, 12),
      { pos: [cuff.x, cuff.y + 0.006 * H, cuff.z] }), { bone: 'LoArm' + s, color: ROBE_SH });
  }

  // 3. THE VEST. PASS 2 REBUILD. The first attempt hung two flat slabs off the
  //    front and a narrow lathe round the back, which read as a sandwich board
  //    over a tan rectangle. Three problems, three fixes:
  //
  //      · the BACK is now an open-fronted cylinder shell, so from behind he
  //        is solid plum with no tan window through the middle;
  //      · the FRONT panels are narrower, canted much harder (the top edges
  //        lean in toward the collarbones and the bottoms flare out), so the
  //        opening between them is a genuine V rather than a slot;
  //      · both sit CLOSER to the body, which lets the sashes sit on top of
  //        them instead of disappearing inside them.
  //
  //  The back shell. Open across the front (thetaStart/Length leave a window
  //  facing +Z), so it wraps the ribs and shoulder blades and stops at the
  //  armpits.
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.086 * H, 0.080 * H, 0.190 * H, 20, 1, true,
    Math.PI * 0.38, Math.PI * 1.24), { scale: [1, 1, 0.86], pos: [0, 0.712 * H, 0] }),
    { chain: torsoChain, color: VEST, blend: 0.06 });
  // shoulder yoke joining the back to the two front panels over the trapezius
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.030 * H, 0.020 * H, 0.086 * H, 0.006 * H),
      { rot: [0, 0, s * 12], pos: [s * 0.052 * H, 0.792 * H, 0.006 * H] }),
      { bone: 'Chest', color: VEST });
  }
  //  The front panels, canted into a V.
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.042 * H, 0.200 * H, 0.014 * H, 0.005 * H),
      { rot: [0, s * -20, s * 15], pos: [s * 0.052 * H, 0.678 * H, 0.049 * H] }),
      { chain: torsoChain, color: VEST, blend: 0.06 });
    // the turned edge of the V, a value darker so the opening reads as an edge
    bag.add('cloth', tGeo(roundBox(0.012 * H, 0.186 * H, 0.011 * H, 0.004 * H),
      { rot: [0, s * -20, s * 19], pos: [s * 0.034 * H, 0.680 * H, 0.058 * H] }),
      { chain: torsoChain, color: VEST_DK, blend: 0.06 });
  }
  // the vest hem, squared off at the waist and pulled down clear of the sash
  bag.add('cloth', latheY([
    [0.080 * H, 0.600 * H], [0.082 * H, 0.622 * H]
  ], 18, 0.82), { chain: torsoChain, color: VEST_DK, blend: 0.05 });

  // 4. THE X-SASHES. Two straps crossing the chest OVER the vest. Pass 1 put
  //    them at z 0.020-0.040 and the vest panels swallowed them completely;
  //    they now run at 0.070 and are half again as thick, so they sit proud
  //    and the X is legible head-on, which is the whole point of it.
  for (const s of [1, -1]) {
    const from = v3(s * 0.076 * H, 0.794 * H, 0.034 * H);
    const to = v3(-s * 0.058 * H, 0.586 * H, 0.062 * H);
    bag.add('cloth', tubeBetween(from, to, [0.018 * H, 0.016 * H], { radial: 8, hSeg: 4, zScale: 0.60 }),
      { chain: torsoChain, color: SASH, blend: 0.05 });
  }
  // the knot where they cross
  bag.add('cloth', tGeo(roundBox(0.034 * H, 0.028 * H, 0.018 * H, 0.006 * H),
    { pos: [0, 0.688 * H, 0.072 * H] }), { chain: torsoChain, color: VEST_DK, blend: 0.05 });

  // 5. THE WAIST SASH. Wide, wrapped twice, tied at the left hip. Moved DOWN
  //    off the vest hem so the two bands do not stack into one thick belt.
  bag.add('cloth', latheY([
    [0.076 * H, 0.526 * H], [0.081 * H, 0.544 * H], [0.081 * H, 0.582 * H], [0.076 * H, 0.598 * H]
  ], 18, 0.82), { bone: 'Hips', color: SASH });
  bag.add('cloth', latheY([
    [0.0815 * H, 0.552 * H], [0.0815 * H, 0.564 * H]
  ], 18, 0.82), { bone: 'Hips', color: VEST_DK });
  bag.add('cloth', tGeo(roundBox(0.028 * H, 0.026 * H, 0.020 * H, 0.005 * H),
    { rot: [0, 0, 12], pos: [0.066 * H, 0.562 * H, 0.036 * H] }), { bone: 'Hips', color: VEST_DK });

  // 6. THE BOOTS. Mid-calf with a turned cuff — the shoe helper only gives the
  //    foot, so the shaft is built here and it changes the leg's silhouette.
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s), kn = joints.get('Shin' + s);
    const legChain = [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }];
    bag.add('cloth', tubeBetween(
      an.clone().add(v3(0, 0.010 * H, 0)),
      an.clone().lerp(kn, 0.60),
      [0.036 * H, 0.041 * H], { radial: 10, hSeg: 4 }),
      { chain: legChain, color: BOOT, blend: 0.06 });
    // the turned cuff at the top
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.046 * H, 0.042 * H, 0.024 * H, 12),
      { pos: [an.x * 0.4 + kn.x * 0.6, an.y + (kn.y - an.y) * 0.60, an.z * 0.4 + kn.z * 0.6] }),
      { chain: legChain, color: BOOT_DK, blend: 0.06 });
  }

  // ---- springs ------------------------------------------------------------
  // Two robe panels at the hips and a short flick at the tip of each tail. The
  // tails are STIFF — they stand up, and a tail that wobbles like a ponytail
  // is the single fastest way to lose the character.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.062 * H, -0.055 * H, 0.010 * H),
      restDir: v3(s * 0.08, -1, 0.05).normalize(), stiffness: 58, damping: 0.84, gravity: 9,
      segments: [
        { len: 0.062 * H, mesh: makeFlapMesh(0.070 * H, 0.064 * H, 0.062 * H, 0.009, clothMat, ROBE, oOpts) },
        { len: 0.050 * H, mesh: makeFlapMesh(0.064 * H, 0.050 * H, 0.050 * H, 0.008, clothMat, ROBE_SH, oOpts) }
      ]
    });
  }
  // the two short sash tails at the left hip
  for (const [ox, len] of [[0.058, 0.086], [0.044, 0.070]]) {
    springs.push({
      bone: 'Hips', localOffset: v3(ox * H, -0.006 * H, 0.036 * H),
      restDir: v3(0.14, -1, 0.10).normalize(), stiffness: 66, damping: 0.82, gravity: 10,
      segments: [{ len: len * H, mesh: makeFlapMesh(0.022 * H, 0.016 * H, len * H, 0.007, clothMat, SASH, oOpts) }]
    });
  }
  // tail tips
  const headJ = joints.get('Head');
  for (const s of [1, -1]) {
    const d = tailDir(s).normalize();
    const tip = headC.clone().addScaledVector(d, headR * 2.30);
    springs.push({
      bone: 'Head',
      localOffset: v3(tip.x - headJ.x, tip.y - headJ.y, tip.z - headJ.z),
      restDir: d.clone().multiplyScalar(-1).setY(-Math.abs(d.y) * 0.35).normalize(),
      stiffness: 150, damping: 0.72, gravity: 3,
      segments: [
        { len: 0.024 * H, mesh: makeFlapMesh(0.021 * H, 0.010 * H, 0.024 * H, 0.013, hairMat, HAIR, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.012, outlineHairScale: 0 });

  // ---- FLOWING RED SCALE overlay ------------------------------------------
  // 赤鱗躍動. He boils his own blood, so the tell is his own circulation
  // coming to the surface: raised veins down both arms and across the chest,
  // and the nose mark going hot. Toggled by the fighter through
  // model.setRedScale(on) exactly as Yuji's markings are — the same overlay
  // pattern, so nothing new had to be taught to the render path.
  //
  // It deliberately adds NOTHING that could be mistaken for a wound. The brief
  // is explicit that he takes no self-damage and the model must not imply one.
  const veinMat = new THREE.MeshBasicMaterial({ color: BLOOD_HI });
  // PASS 2 FIX. The first version pushed each holder into a `veins` Group and
  // THEN parented it to a bone — and `Object3D.add` REPARENTS, so the group it
  // was toggling ended up empty and every vein shipped permanently visible.
  // (It showed up in the very first turnaround as a red bar floating beside
  // him.) The holders are tracked in a plain array now; the array is what the
  // toggle walks, and the bone is the only parent any of them ever has.
  const veinHolders = [];
  const chestJ = joints.get('Chest');
  const addVein = (bone, p, size, rot = [0, 0, 0]) => {
    const g = model.getBone(bone);
    if (!g) return;
    const mesh = new THREE.Mesh(roundBox(size[0], size[1], size[2], 0.002), veinMat);
    mesh.position.set(p[0], p[1], p[2]);
    mesh.rotation.set(rot[0] * Math.PI / 180, rot[1] * Math.PI / 180, rot[2] * Math.PI / 180);
    const holder = new THREE.Group();
    holder.add(mesh);
    holder.visible = false;
    g.add(holder);
    veinHolders.push(holder);
  };
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const up = joints.get('UpArm' + s), lo = joints.get('LoArm' + s);
    for (let i = 0; i < 3; i++) {
      addVein('UpArm' + s,
        [up.x + m * 0.020 * H, up.y - 0.030 * H - i * 0.030 * H, up.z + 0.020 * H],
        [0.006 * H, 0.036 * H, 0.005 * H], [0, 0, m * (12 + i * 6)]);
      addVein('LoArm' + s,
        [lo.x + m * 0.014 * H, lo.y - 0.026 * H - i * 0.026 * H, lo.z + 0.018 * H],
        [0.005 * H, 0.030 * H, 0.004 * H], [0, 0, m * (8 + i * 5)]);
    }
  }
  for (const [ox, oy, rz] of [[0.030, 0.048, 22], [-0.028, 0.040, -20], [0.008, 0.076, 6]]) {
    addVein('Chest', [ox * H, chestJ.y - chestJ.y + oy * H, 0.062 * H],
      [0.006 * H, 0.052 * H, 0.005 * H], [0, 0, rz]);
  }
  // the nose mark, hot. Matched to the corrected mark geometry above, so it
  // sits ON it rather than drifting down toward the mouth.
  addVein('Head',
    [0, markY - headJ.y, faceZ + headR * 0.058 - headJ.z],
    [headR * 0.255, headR * 0.072, 0.005]);

  let scaleOn = false, scaleT = 0;
  model.setRedScale = on => {
    scaleOn = !!on;
    for (const h of veinHolders) h.visible = scaleOn;
  };
  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (!scaleOn) return;
    // a slow pulse, roughly a heartbeat — it has to look like circulation
    scaleT += dt;
    const k = 0.62 + 0.38 * Math.pow(Math.max(0, Math.sin(scaleT * 7.4)), 3);
    veinMat.color.setHex(BLOOD_HI).multiplyScalar(k * 0.6 + 0.55);
  };
  return model;
}

// A narrower, flatter eye than the shared almond: level upper lid, outer
// corner pulled DOWN. `s` = 1 for his left (screen +x).
function narrowEye(w, h, s) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 * s, h * 0.06);
  sh.quadraticCurveTo(-w * 0.14 * s, h * 0.58, w / 2 * s, -h * 0.02);
  sh.quadraticCurveTo(w * 0.04 * s, -h * 0.46, -w / 2 * s, h * 0.06);
  return new THREE.ShapeGeometry(sh, 8);
}
