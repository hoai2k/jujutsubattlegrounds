// ===========================================================================
// TOJI'S ARSENAL — REFERENCE SHEET (the four cursed tools + the curse)
// ===========================================================================
// Researched 2026-08-05. Unlike every previous art pass in this project, IMAGE
// REFERENCE WAS ACTUALLY VIEWED this time: the wiki host still answers 402 to
// WebFetch, but the in-app browser loads it fine, and the anime stills were
// downloaded and read directly. Each weapon below was authored from its own
// screenshot, and what is approximated is flagged per weapon rather than in one
// lump at the bottom.
//
// These are PROPS, not skinned geometry: each builder returns a THREE.Group
// authored along +Y with its grip at the origin, the same contract Nanami's
// blunt blade and Higuruma's briefcase already use, so `attachProp` places them
// with a bone-local offset and nothing here has to know about the rig.
//
// ---------------------------------------------------------------------------
// 1. PLAYFUL CLOUD 游雲 — special grade, no imbued technique
// ---------------------------------------------------------------------------
// Wiki: "a three-section staff connected by three rings between the joints...
// Each staff is decorated with a flame-like pattern near the ends by the metal
// which connects to the chains." Its strength is purely the user's muscle,
// which is exactly why it is Toji's default.
// From the still: the three sections are VERMILLION (a warm orange-red, not the
// brick red the text implies), each capped at both ends with a pale gunmetal
// ferrule, and each carries two DARK NAVY bands inboard of the ferrules — that
// banding is what the "flame-like pattern" reads as in the anime. The joints
// are short runs of dark chain links, and there is a free ring hanging off one
// butt cap.
// APPROXIMATED: the flame etching itself is banding here, because at this poly
// budget an etched flame becomes noise; and the section lengths are shortened
// ~15% from a true three-section staff so the prop does not clip the floor in
// the low guard stance.
//
// ---------------------------------------------------------------------------
// 2. INVERTED SPEAR OF HEAVEN 天逆鉾 — special grade, nullifies techniques
// ---------------------------------------------------------------------------
// Wiki: "a spearhead with a shortened handle (thus resembling a large dagger)
// and a two-pronged, jitte-like blade. It has a q-shaped, rounded hand guard
// that points out on the side of the longer blade... a black handle with a
// circular link at the end that allows it to be connected to metal chains. It
// appears a third blade may have been located on the front of the weapon, but
// it has evidently been broken off."
// From the still: the blade is ONE flat plate with a long slot cut down it,
// splitting into a long prong and a shorter, blunter one — it is not two
// separate blades. Pale silver with a warm gold bevel running the whole
// silhouette, a small square engraved glyph on the flat above the guard, and a
// chunky pale-olive rectangular ferrule where the plate meets the wrap. The
// wrap is a dark red-brown with visible binding segments.
// APPROXIMATED: the guard in the anime still reads as a blocky ferrule rather
// than the wiki's "q-shape", and the still is what got built. The broken third
// blade is modelled as a deliberate STUB on the front edge, because "evidently
// broken off" is a design note worth showing rather than omitting.
//
// ---------------------------------------------------------------------------
// 3. SPLIT SOUL KATANA 釈魂刀 — cuts the soul, worth 500 million yen
// ---------------------------------------------------------------------------
// Wiki: "a large, curved Japanese broadsword with a distinctive feature: a
// fur-wrapped tsuba (hand guard), giving it a somewhat shaggy appearance."
// From the still: a long, SHALLOW curve — much straighter than a standard
// katana — with a two-tone blade (bright edge band, dull grey spine). The fur
// tsuba is a genuine shaggy ball of cream-white, not a disc, and it is large:
// roughly two fists across. The hilt below it is olive-tan with dark diagonal
// wrap crossings and a small dark-red pommel fitting.
// APPROXIMATED: the fur is nine tapered tufts around a core rather than
// strands; the blade's hamon line is a colour band, not modelled geometry.
//
// ---------------------------------------------------------------------------
// 4. CHAIN OF A THOUSAND MILES 万里ノ鎖 — extends while its end stays hidden
// ---------------------------------------------------------------------------
// Wiki: "the appearance of a perfectly normal kusari (metal chain)... a clip on
// the front end that can be used to connect to other cursed tools in order to
// extend their range." Toji hides the back end in the curse's mouth, which is
// the whole trick, and clips the Inverted Spear to the front to make a
// kusarigama.
// Deliberately the plainest object in the set: plain steel oval links and a
// plain steel hook. Nothing decorative, because the text is emphatic that it
// looks like nothing at all.
// APPROXIMATED: link count. The real one is unbounded by definition; the prop
// carries a hand coil of sixteen and the whip effect extends it in FX.
//
// ---------------------------------------------------------------------------
// 5. THE INVENTORY CURSE 格納型呪霊
// ---------------------------------------------------------------------------
// Wiki: "a cursed spirit that could store many different objects within its
// body. He could freely interchange his weapons by putting them in and taking
// them out of the curse's MOUTH." Trivia: "Toji was able to establish a
// friendly relationship with his inventory curse by earnestly training it like
// a pet."
// From the Split Soul Katana still, where it is riding his back: a lumpy
// bruise-purple sack of a body, wider than tall, with a huge lipless mouth
// across most of its front, small close-set eyes above it, and short useless
// limbs. It has no neck and no expression.
// APPROXIMATED: everything below the mouth. It is only ever on screen for the
// ~0.4 s of a swap, held at chest height, so it is built to read at that one
// size and angle.
// ===========================================================================
import * as THREE from 'three';
import { roundBox, tGeo, shapeExtrude, coneSpike, mergeGeos } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';

// Palettes, sampled off the reference stills.
const PC = {
  shaft: 0xc9522c,      // vermillion body
  band: 0x24304e,       // navy decorative banding
  ferrule: 0x8d949c,    // pale gunmetal caps
  link: 0x3a3f47        // joint chain
};
const IS = {
  blade: 0xdfe4ea,      // pale silver plate
  bevel: 0xb59a52,      // warm gold edge lining
  glyph: 0x555b63,      // the engraved square
  ferrule: 0xa9a887,    // pale olive guard block
  wrap: 0x5c2a26        // dark red-brown handle wrap
};
const SS = {
  edge: 0xe8ebef,       // bright cutting band
  spine: 0x9aa1a9,      // duller back half
  fur: 0xf0ead8,        // cream fur tsuba
  furDk: 0xd8cfb6,
  hilt: 0xa39a6a,       // olive-tan wrap
  wrap: 0x2b2620,
  pommel: 0x6d2a2a
};
const CH = { steel: 0x8e959d, dark: 0x53585f };
const IC = { flesh: 0x6b4a72, fleshDk: 0x4a3050, mouth: 0x1c0e22, tooth: 0xe6dccc, eye: 0xf2e8d0 };

const OUT = { color: 0x0a0910, thickness: 0.008 };

// Every builder takes the OWNER'S height so the whole arsenal scales with the
// character rather than being authored at one absolute size.
// ---------------------------------------------------------------------------
// PLAYFUL CLOUD
// ---------------------------------------------------------------------------
export function buildPlayfulCloud(H = 1.88) {
  const g = new THREE.Group();
  g.name = 'playfulCloud';
  const shaftMat = MAT.cloth({ vertexColors: false, color: PC.shaft, rimColor: 0xffb08a });
  const bandMat = MAT.cloth({ vertexColors: false, color: PC.band, rimColor: 0x9fb4e0 });
  const ferMat = MAT.metal({ vertexColors: false, color: PC.ferrule });
  const linkMat = MAT.metal({ vertexColors: false, color: PC.link });

  // 0.24·H per section: a true three-section staff at 0.285 was 1.6 m and both
  // clipped the floor in the low guard and cleared his head in the high one.
  const secLen = 0.24 * H;           // three of these, plus joints
  const secR = 0.0115 * H;
  // Sections are laid end to end up +Y with a small kink at each joint, so the
  // silhouette reads ARTICULATED at a glance instead of as one straight pole.
  const kinks = [0, 0.10, -0.07];
  let y = 0;
  for (let i = 0; i < 3; i++) {
    const sec = new THREE.Group();
    sec.position.y = y;
    sec.rotation.z = kinks[i];
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(secR * 0.93, secR, secLen, 10), shaftMat);
    body.position.y = secLen / 2;
    sec.add(body);
    // OUTLINE GOES ON THE SECTION, not on the root. makeOutline builds an
    // inverted hull in the mesh's OWN space; parenting it to `g` dropped the
    // section's rotation and offset, so sections 2 and 3 rendered a solid black
    // bar floating alongside the staff.
    body.add(makeOutline(body, OUT));
    // gunmetal ferrule at both ends of every section
    for (const fy of [0.012 * H, secLen - 0.012 * H]) {
      const f = new THREE.Mesh(
        new THREE.CylinderGeometry(secR * 1.14, secR * 1.14, 0.024 * H, 10), ferMat);
      f.position.y = fy;
      sec.add(f);
    }
    // the two navy bands inboard of each ferrule — the "flame-like pattern"
    for (const by of [0.040 * H, 0.058 * H, secLen - 0.040 * H, secLen - 0.058 * H]) {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(secR * 1.06, secR * 1.06, 0.011 * H, 10), bandMat);
      b.position.y = by;
      sec.add(b);
    }
    g.add(sec);
    y += secLen;
    // the joint: two short chain links bridging into the next section
    if (i < 2) {
      for (let k = 0; k < 2; k++) {
        const link = new THREE.Mesh(
          new THREE.TorusGeometry(0.010 * H, 0.0034 * H, 5, 9), linkMat);
        link.position.set(0, y - 0.004 * H + k * 0.013 * H, 0);
        link.rotation.set(Math.PI / 2, k * Math.PI / 2, 0);
        g.add(link);
      }
      y += 0.022 * H;
    }
  }
  // the free ring hanging off the butt cap
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.016 * H, 0.0038 * H, 6, 12), linkMat);
  ring.position.y = -0.016 * H;
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

// ---------------------------------------------------------------------------
// INVERTED SPEAR OF HEAVEN
// ---------------------------------------------------------------------------
export function buildInvertedSpear(H = 1.88) {
  const g = new THREE.Group();
  g.name = 'invertedSpear';
  const bladeMat = MAT.metal({ vertexColors: false, color: IS.blade, rimColor: 0xffffff });
  const bevelMat = MAT.metal({ vertexColors: false, color: IS.bevel, rimColor: 0xffe8b0 });
  const ferMat = MAT.metal({ vertexColors: false, color: IS.ferrule });
  const wrapMat = MAT.cloth({ vertexColors: false, color: IS.wrap, rimColor: 0xc08878 });
  const glyphMat = new THREE.MeshBasicMaterial({ color: IS.glyph });

  // "a spearhead with a SHORTENED handle (thus resembling a large dagger)" —
  // pass 1 built the plate at 0.40·H (0.75 m) and it read as a shortsword.
  const L = 0.275 * H;               // plate length from ferrule to long tip

  // THE PLATE. Traced off the still as a single closed outline, read as the
  // silhouette of the LONG prong plus the shoulder that the short prong hangs
  // off; the slot between them is cut separately below by simply not filling it
  // (two extruded halves rather than one shape with a hole, which keeps the
  // outline hull clean).
  const longProng = shapeExtrude([
    [0.012 * H, 0], [0.052 * H, 0], [0.052 * H, L * 0.78],
    [0.030 * H, L], [0.010 * H, L * 0.80], [0.012 * H, 0]
  ], 0.011 * H, { bevel: false });
  const shortProng = shapeExtrude([
    [-0.050 * H, 0], [-0.008 * H, 0], [-0.008 * H, L * 0.52],
    [-0.028 * H, L * 0.62], [-0.050 * H, L * 0.46], [-0.050 * H, 0]
  ], 0.011 * H, { bevel: false });
  // the shoulder that ties the two prongs together at the base
  const yoke = shapeExtrude([
    [-0.050 * H, 0], [0.052 * H, 0], [0.052 * H, 0.075 * H],
    [-0.050 * H, 0.075 * H], [-0.050 * H, 0]
  ], 0.011 * H, { bevel: false });

  const plateGeo = mergeGeos([longProng, shortProng, yoke]);
  // THE GOLD BEVEL. Pass 1 lined the edges with four separate slabs positioned
  // by hand, and every one of them ended up floating a few millimetres off the
  // plate as a detached gold stick. It is a slightly LARGER COPY OF THE PLATE
  // sitting behind the silver one instead — the same trick the outline pass
  // uses, so the gold rim follows the silhouette exactly and cannot drift.
  const bevel = new THREE.Mesh(plateGeo.clone().scale(1.055, 1.03, 0.92), bevelMat);
  bevel.position.set(-0.001 * H, 0.086 * H, 0);
  g.add(bevel);
  const plate = new THREE.Mesh(plateGeo, bladeMat);
  plate.position.y = 0.088 * H;
  g.add(plate);
  bevel.add(makeOutline(bevel, { color: 0x1a1c24, thickness: 0.006 }));
  // THE BROKEN THIRD BLADE. A deliberate stub on the front edge, per the wiki's
  // "it appears a third blade may have been located on the front of the weapon,
  // but it has evidently been broken off".
  const stub = new THREE.Mesh(roundBox(0.020 * H, 0.026 * H, 0.012 * H, 0.003 * H), bladeMat);
  stub.position.set(0.058 * H, 0.088 * H + L * 0.20, 0);
  stub.rotation.z = -0.5;
  g.add(stub);

  // the small square engraving on the flat, just above the ferrule
  for (const z of [0.0065 * H, -0.0065 * H]) {
    const gl = new THREE.Mesh(roundBox(0.026 * H, 0.026 * H, 0.002 * H, 0.001 * H), glyphMat);
    gl.position.set(0.002 * H, 0.135 * H, z);
    g.add(gl);
    const inner = new THREE.Mesh(roundBox(0.013 * H, 0.013 * H, 0.0025 * H, 0.0008 * H), bladeMat);
    inner.position.set(0.002 * H, 0.135 * H, z * 1.15);
    g.add(inner);
  }

  // THE FERRULE: a chunky rectangular block where the plate meets the wrap.
  // No outline hull on the ferrule or the grip: at this scale the inverted-hull
  // pass on two chunky solids that overlap the blade plate rendered as one
  // black slab sitting behind the guard. The gold bevel rim already carries the
  // whole weapon's edge definition.
  const fer = new THREE.Mesh(roundBox(0.072 * H, 0.062 * H, 0.030 * H, 0.005 * H), ferMat);
  fer.position.y = 0.062 * H;
  g.add(fer);
  // the small lip under it
  const lip = new THREE.Mesh(roundBox(0.048 * H, 0.014 * H, 0.024 * H, 0.003 * H), ferMat);
  lip.position.y = 0.030 * H;
  g.add(lip);

  // THE HANDLE: short — this is a dagger, not a spear. Wrapped, with visible
  // binding segments, and the circular chain link at the butt.
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0135 * H, 0.0125 * H, 0.085 * H, 8), wrapMat);
  grip.position.y = -0.020 * H;
  g.add(grip);
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(
      roundBox(0.030 * H, 0.006 * H, 0.030 * H, 0.002 * H),
      new THREE.MeshBasicMaterial({ color: 0x3a1a18 }));
    seg.position.y = 0.010 * H - i * 0.016 * H;
    seg.rotation.y = i * 0.3;
    g.add(seg);
  }
  // the circular link — this is what the Chain of a Thousand Miles clips to
  const link = new THREE.Mesh(
    new THREE.TorusGeometry(0.014 * H, 0.0035 * H, 6, 12),
    MAT.metal({ vertexColors: false, color: 0x6e747c }));
  link.position.y = -0.072 * H;
  link.rotation.x = Math.PI / 2;
  g.add(link);
  return g;
}

// ---------------------------------------------------------------------------
// SPLIT SOUL KATANA
// ---------------------------------------------------------------------------
export function buildSplitSoulKatana(H = 1.88) {
  const g = new THREE.Group();
  g.name = 'splitSoul';
  const edgeMat = MAT.metal({ vertexColors: false, color: SS.edge, rimColor: 0xffffff });
  const spineMat = MAT.metal({ vertexColors: false, color: SS.spine });
  const furMat = MAT.hair({ vertexColors: false, color: SS.fur, rimColor: 0xfff8e8 });
  const furDkMat = MAT.hair({ vertexColors: false, color: SS.furDk, rimColor: 0xffeed0 });
  const hiltMat = MAT.cloth({ vertexColors: false, color: SS.hilt, rimColor: 0xe8dfa8 });
  const wrapMat = new THREE.MeshBasicMaterial({ color: SS.wrap });

  // THE BLADE. Broad and long with a very shallow curve — the reference is much
  // straighter than a standard katana. Pass 1 stacked nine short slabs along
  // the curve and the silhouette came out as a visible STAIRCASE; a blade is
  // exactly the case an extruded outline is for, so the curve is traced as one
  // closed 2D profile (up the cutting edge, back down the spine) and extruded.
  const bladeLen = 0.60 * H;
  const halfW = 0.040 * H;   // "large, curved BROADSWORD" — 0.030 read as a sabre
  const N = 12;
  const curveAt = t => -Math.pow(t, 1.7) * 0.075 * H;        // sweep toward the back
  const widthAt = t => halfW * (1 - Math.pow(t, 2.8) * 0.62); // narrows to the tip
  const yAt = t => 0.075 * H + t * bladeLen;
  const front = [], back = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    front.push([curveAt(t) + widthAt(t), yAt(t)]);
    back.push([curveAt(t) - widthAt(t), yAt(t)]);
  }
  const outline = [...front, ...back.reverse()];
  const blade = new THREE.Mesh(shapeExtrude(outline, 0.0115 * H), edgeMat);
  g.add(blade);
  blade.add(makeOutline(blade, { color: 0x171a1e, thickness: 0.008 }));
  // the dull spine band: the same profile, but the back third of it
  const spFront = [], spBack = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    spFront.push([curveAt(t) - widthAt(t) * 0.34, yAt(t)]);
    spBack.push([curveAt(t) - widthAt(t), yAt(t)]);
  }
  const spine = new THREE.Mesh(
    shapeExtrude([...spFront, ...spBack.reverse()], 0.0125 * H), spineMat);
  g.add(spine);

  // THE FUR TSUBA: a shaggy ball, not a disc. Core sphere plus nine tapered
  // tufts fanned around it, alternating two tones so it reads as fur rather
  // than as a lump at fighting distance.
  // "roughly two fists across" in the still — pass 1 built it at 0.036·H and it
  // read as a bead on a stick rather than as the weapon's defining feature.
  // The core is deliberately SMALLER than the tuft spread. Pass 2 grew the core
  // to 0.050 and swallowed its own tufts, producing a smooth white egg — the
  // shagginess has to come from geometry that stands proud of the ball.
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.038 * H, 12, 9), furMat);
  core.position.y = 0.060 * H;
  core.scale.set(1.05, 0.80, 0.95);
  g.add(core);
  core.add(makeOutline(core, { color: 0x6a6250, thickness: 0.010 }));
  const tufts = [];
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 + 0.25;
    const len = 0.052 * H + (i % 3) * 0.013 * H;
    const spike = coneSpike(0.017 * H, len,
      new THREE.Vector3(0, -len * 0.45, 0), { radial: 5, hSeg: 3 });
    const dir = new THREE.Vector3(Math.cos(a), 0.06, Math.sin(a) * 0.75).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    spike.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    spike.translate(Math.cos(a) * 0.030 * H, 0.058 * H, Math.sin(a) * 0.024 * H);
    tufts.push({ geo: spike, dark: i % 2 === 1 });
  }
  g.add(new THREE.Mesh(mergeGeos(tufts.filter(t => !t.dark).map(t => t.geo)), furMat));
  g.add(new THREE.Mesh(mergeGeos(tufts.filter(t => t.dark).map(t => t.geo)), furDkMat));

  // THE HILT: olive-tan under dark diagonal crossings, small red pommel.
  const hilt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0145 * H, 0.0155 * H, 0.115 * H, 8), hiltMat);
  hilt.position.y = -0.032 * H;
  g.add(hilt);
  hilt.add(makeOutline(hilt, OUT));
  for (let i = 0; i < 6; i++) {
    for (const s of [1, -1]) {
      const wrap = new THREE.Mesh(roundBox(0.034 * H, 0.005 * H, 0.034 * H, 0.0015 * H), wrapMat);
      wrap.position.y = 0.016 * H - i * 0.018 * H;
      wrap.rotation.set(0, i * 0.4, s * 0.42);
      g.add(wrap);
    }
  }
  const pommel = new THREE.Mesh(roundBox(0.026 * H, 0.014 * H, 0.026 * H, 0.004 * H),
    MAT.metal({ vertexColors: false, color: SS.pommel }));
  pommel.position.y = -0.092 * H;
  g.add(pommel);
  return g;
}

// ---------------------------------------------------------------------------
// CHAIN OF A THOUSAND MILES
// ---------------------------------------------------------------------------
export function buildChain(H = 1.88) {
  const g = new THREE.Group();
  g.name = 'chain';
  const steel = MAT.metal({ vertexColors: false, color: CH.steel, rimColor: 0xe8f0ff });
  const dark = MAT.metal({ vertexColors: false, color: CH.dark });

  // A HANGING LENGTH. The chain is unbounded by definition, so the prop is only
  // what he is actually holding — the whip effect extends the rest in FX rather
  // than in geometry. Pass 1 authored it as a tight 0.07 m loop and it read as
  // a spring, so this is a proper ~0.85 m fall with a lazy S-curve in it, big
  // links, and the clip on the bottom end where it can be seen.
  const linkGeos = [];
  // denser and finer than pass 2: eight fat rings down a wide S read as a
  // spiral staircase, not as a chain. Real kusari links are small and many.
  const N = 34;
  const drop = 0.46 * H;
  const linkR = 0.0105 * H;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = 0.02 * H - t * drop;
    // a lazy S: swings out a little, back through, hangs plumb at the bottom
    const x = Math.sin(t * Math.PI * 1.15) * 0.030 * H;
    const z = Math.sin(t * Math.PI * 1.9) * 0.010 * H;
    const link = new THREE.TorusGeometry(linkR, 0.0030 * H, 5, 10);
    linkGeos.push(tGeo(link, {
      scale: [1, 1.45, 1],
      // A torus is authored in the XY plane, so an UPRIGHT link needs no X
      // rotation at all. Pass 2 used rot.x = 90, which laid every link flat
      // like a stack of washers; the alternation is a 90-degree YAW between
      // neighbours, and that alternation is the whole read of a chain.
      rot: [0, (i % 2) * 90, 0],
      pos: [x, y, z]
    }));
  }
  const chain = new THREE.Mesh(mergeGeos(linkGeos), steel);
  g.add(chain);
  chain.add(makeOutline(chain, { color: 0x232830, thickness: 0.006 }));

  // the clip on the bottom end — the whole point of the tool
  const tipY = 0.02 * H - drop - 0.02 * H;
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.020 * H, 0.0052 * H, 6, 14, Math.PI * 1.5), dark);
  hook.position.set(0, tipY, 0);
  hook.rotation.set(Math.PI / 2, 0, -1.9);
  g.add(hook);
  const gate = new THREE.Mesh(roundBox(0.006 * H, 0.030 * H, 0.006 * H, 0.002 * H), dark);
  gate.position.set(0.014 * H, tipY + 0.008 * H, 0);
  gate.rotation.z = 0.30;
  g.add(gate);
  return g;
}

// ---------------------------------------------------------------------------
// THE INVENTORY CURSE
// ---------------------------------------------------------------------------
// Small, and only ever on screen during a swap. The MOUTH is the functional
// part — every draw animation reaches into it — so it is the biggest feature on
// the model by a wide margin, and `openMouth(t)` drives it from the swap clip.
export function buildInventoryCurse(H = 1.88) {
  const g = new THREE.Group();
  g.name = 'inventoryCurse';
  const flesh = MAT.skin({ vertexColors: false, color: IC.flesh, rimColor: 0xc8a0d8 });
  const fleshDk = MAT.skin({ vertexColors: false, color: IC.fleshDk });
  const dark = new THREE.MeshBasicMaterial({ color: IC.mouth });
  const toothMat = new THREE.MeshBasicMaterial({ color: IC.tooth });
  const eyeMat = new THREE.MeshBasicMaterial({ color: IC.eye });

  const R = 0.072 * H;
  // the sack: wider than tall, deliberately asymmetric so it reads as a growth
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 12, 10), flesh);
  body.scale.set(1.22, 0.86, 0.94);
  g.add(body);
  body.add(makeOutline(body, { color: 0x1c0f22, thickness: 0.011 }));
  // warty lobes over the top and shoulders
  const warts = [];
  for (const [wx, wy, wz, wr] of [
    [0.52, 0.55, -0.10, 0.40], [-0.60, 0.42, 0.05, 0.34], [0.10, 0.70, -0.30, 0.30],
    [-0.28, 0.62, -0.34, 0.26], [0.78, 0.05, -0.20, 0.28], [-0.82, -0.08, -0.16, 0.24]
  ]) {
    warts.push(tGeo(new THREE.SphereGeometry(R * wr, 8, 6),
      { pos: [wx * R, wy * R, wz * R] }));
  }
  g.add(new THREE.Mesh(mergeGeos(warts), fleshDk));

  // THE MOUTH: a wide lipless slit across most of the front. Built as a hinged
  // group so the swap animation can crank it open.
  // Built INSIDE the body silhouette and opened by scaling in place. Pass 1
  // hinged a box forward on rotation.x and at full gape it swung clear of the
  // head entirely and read as a separate slab floating in front of a blob.
  const jaw = new THREE.Group();
  jaw.position.set(0, -R * 0.08, R * 0.36);
  g.add(jaw);
  const gape = new THREE.Mesh(roundBox(R * 1.45, R * 0.34, R * 0.44, R * 0.05), dark);
  jaw.add(gape);
  // teeth on both rims, so they separate as the gape scales
  for (let i = 0; i < 8; i++) {
    const x = (i / 7 - 0.5) * R * 1.24;
    for (const s of [1, -1]) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(R * 0.070, R * 0.24, 4), toothMat);
      tooth.position.set(x, s * R * 0.15, R * 0.20);
      tooth.rotation.x = Math.PI / 2;
      tooth.rotation.z = s > 0 ? Math.PI : 0;
      jaw.add(tooth);
    }
  }
  // small close-set eyes, well above the mouth and sunk into the flesh
  for (const s of [1, -1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(R * 0.13, 8, 6), eyeMat);
    eye.position.set(s * R * 0.26, R * 0.40, R * 0.60);
    eye.scale.set(1, 0.7, 0.5);
    g.add(eye);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.048, 8), dark);
    pupil.position.set(s * R * 0.26, R * 0.40, R * 0.665);
    g.add(pupil);
  }
  // the short useless limbs
  for (const s of [1, -1]) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.11, R * 0.06, R * 0.62, 6), flesh);
    arm.position.set(s * R * 1.12, -R * 0.34, R * 0.10);
    arm.rotation.set(0.3, 0, s * -0.9);
    g.add(arm);
  }

  // driven by the swap clip: 0 = shut, 1 = fully gaping
  g.userData.openMouth = t => {
    jaw.scale.y = 1 + t * 2.4;
    jaw.scale.z = 1 + t * 0.35;
    jaw.position.y = -R * 0.08 - t * R * 0.10;
    jaw.rotation.x = -t * 0.14;   // a hint of a hinge, not a swing-out
  };
  return g;
}

// Registry so the arsenal code can build a weapon by key rather than by import.
export const WEAPON_BUILDERS = {
  playful_cloud: buildPlayfulCloud,
  inverted_spear: buildInvertedSpear,
  split_soul: buildSplitSoulKatana,
  chain: buildChain
};
