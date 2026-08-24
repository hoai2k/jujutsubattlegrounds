// Automatic humanoid bone mapping: given an arbitrary rigged model (Mixamo,
// VRM, Blender/Rigify exports, hand-named rigs), find the node that plays each
// of the game's canonical bones (art/rig/rig.js BONE_NAMES). Matching is
// token-based rather than a name table, so `mixamorig:LeftForeArm`,
// `J_Bip_L_LowerArm`, `forearm.L` and `Elbow_l` all land on LoArmL.
//
// The output is a plain { canonicalName: Object3D } map plus a report of what
// was and wasn't found — the report is printed once at load so a model with a
// surprising rig fails loudly instead of standing in a half-T-pose.

// Which canonical bone a clip's rotation lands on is decided here; anything a
// model does not have is simply skipped by the retargeter, same contract as
// AnimPlayer's `if (!bone) continue`.

// tokens that carry no anatomy — rig namespaces and exporter prefixes
const NOISE = new Set([
  'mixamorig', 'armature', 'skeleton', 'bip', 'bip01', 'bip001', 'j', 'def',
  'org', 'mch', 'ctrl', 'rig', 'bone', 'jnt', 'joint', 'char', 'body', 'end'
]);

function tokenize(name) {
  // split camelCase and every common separator, lowercase, drop noise
  const raw = name
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_\-.:|/]+/)
    .map(t => t.toLowerCase())
    .filter(Boolean);
  return raw.filter(t => !NOISE.has(t));
}

// classify one node name -> { side: ''|'L'|'R', part: string, index: number }
function classify(name) {
  let tokens = tokenize(name);
  let side = '';
  const sided = [];
  for (const t of tokens) {
    if (t === 'left' || t === 'l') { side = 'L'; continue; }
    if (t === 'right' || t === 'r') { side = 'R'; continue; }
    sided.push(t);
  }
  tokens = sided;
  // pull a trailing index off the joined rest: spine2, neck01…
  const rest = tokens.join('');
  const m = rest.match(/^([a-z]+?)0*(\d+)?$/);
  const stem = m ? m[1] : rest;
  const index = m && m[2] !== undefined ? Number(m[2]) : 0;
  return { side, stem, index, rest };
}

// stem -> canonical part (side applied later). Order matters: first hit wins.
const PART_RULES = [
  [/^(hips|pelvis|hip|waist)$/, 'Hips'],
  [/^(upperchest|chestupper)$/, 'Chest2'],   // folded into Chest below
  [/^(chest|ribcage|torso)$/, 'Chest'],
  [/^(spine|abdomen|stomach|belly)$/, 'Spine'],
  [/^(neck)$/, 'Neck'],
  [/^(head)$/, 'Head'],
  [/^(shoulder|clavicle|collar|collarbone|clav)$/, 'Clav'],
  [/^(upperarm|uparm|bicep|biceps|arm)$/, 'UpArm'],
  [/^(forearm|lowerarm|loarm|elbow|forarm)$/, 'LoArm'],
  [/^(hand|wrist|palm)$/, 'Hand'],
  [/^(upperleg|upleg|thigh|hipjoint)$/, 'Thigh'],
  [/^(lowerleg|leg|shin|calf|knee)$/, 'Shin'],
  [/^(foot|ankle)$/, 'Foot'],
  [/^(toe|toebase|toes|ball)$/, 'Toe']
];

const FINGER = /(thumb|index|middle|ring|pinky|little|finger|digit)/;

// Collect the candidate node set: skeleton bones of every SkinnedMesh under
// root, or — for models exported without an explicit skin — every named node.
export function collectBoneNodes(root) {
  const set = new Set();
  root.traverse(o => {
    if (o.isSkinnedMesh && o.skeleton) for (const b of o.skeleton.bones) set.add(b);
  });
  if (!set.size) root.traverse(o => { if (o.name) set.add(o); });
  return [...set];
}

// -> { map: {canonical: node}, toes: {L,R}, missing: [names], report: string }
export function guessBoneMap(root, overrides = {}) {
  const nodes = collectBoneNodes(root);
  const byName = new Map(nodes.map(n => [n.name, n]));

  const found = {};     // canonical -> node
  const spines = [];    // {node, index} for the spine chain decision
  const toes = {};

  for (const node of nodes) {
    if (!node.name || FINGER.test(node.name.toLowerCase())) continue;
    const { side, stem, index } = classify(node.name);
    let part = null;
    for (const [re, p] of PART_RULES) if (re.test(stem)) { part = p; break; }
    if (!part) continue;
    if (part === 'Spine' || part === 'Chest' || part === 'Chest2') {
      // rank the whole spine chain by depth from Hips and split it afterwards
      spines.push({ node, order: part === 'Spine' ? index : 100 + index });
      continue;
    }
    if (part === 'Toe') { if (!toes[side]) toes[side] = node; continue; }
    const sided = ['Hips', 'Neck', 'Head'].includes(part) ? part : part + side;
    // sided limb parts without a detected side are ambiguous — skip them
    if (!['Hips', 'Neck', 'Head'].includes(part) && !side) continue;
    // keep the shallowest match (Neck over Neck2, Head over HeadTop)
    if (!found[sided]) found[sided] = node;
  }

  // spine chain: shallowest -> Spine, deepest -> Chest. A single spine bone
  // maps to Chest (the source Chest world rotation already contains Spine's,
  // so one target bone carries the sum of both).
  spines.sort((a, b) => a.order - b.order);
  if (spines.length === 1) found.Chest = spines[0].node;
  else if (spines.length >= 2) {
    found.Spine = spines[0].node;
    found.Chest = spines[spines.length - 1].node;
  }

  // explicit overrides from the manifest win over every heuristic
  for (const [canonical, name] of Object.entries(overrides)) {
    if (name === null) { delete found[canonical]; continue; }
    const node = byName.get(name);
    if (node) found[canonical] = node;
    else console.warn(`[render3d] boneMap override "${canonical}: ${name}" names no node in the model`);
  }

  const CORE = [
    'Hips', 'Spine', 'Chest', 'Neck', 'Head',
    'UpArmL', 'LoArmL', 'HandL', 'UpArmR', 'LoArmR', 'HandR',
    'ThighL', 'ShinL', 'FootL', 'ThighR', 'ShinR', 'FootR'
  ];
  const missing = CORE.filter(k => !found[k]);
  const report = `mapped ${Object.keys(found).length} bones` +
    (missing.length ? `, missing: ${missing.join(' ')}` : '');
  return { map: found, toes, missing, report };
}
