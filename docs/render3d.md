# `?render3d` — rigged 3D models over the procedural roster

An opt-in URL parameter that swaps a character's procedural body for an
imported rigged humanoid (`.glb`/`.gltf`), while every pose and clip the game
has — and every one it grows later — plays on it unchanged. Off by default;
the shipped game stays fully procedural.

## Using it

| URL | Effect |
| --- | --- |
| `/?render3d` | per-character models from `public/models/manifest.json` |
| `/?render3d=<url>` | one model for **every** fighter (quick testing; the URL must be encoded if it carries `&`) |
| `/?render3d#viewer` | the same swap on the model-viewer bench |

The bench (`#viewer`) is the intended iteration loop: load a character, page
through `idle → run → punch3 → knockdown → finishers` and watch the imported
body take the whole library.

Models load at runtime — nothing is bundled, a missing file or an unusable
rig warns once in the console and leaves the procedural model standing.

## How the mapping works (`src/art/rig3d/`)

The game's animation system stays the single source of truth. Clips are
authored once against the shared canonical skeleton (`art/rig/rig.js`
`BONE_NAMES`), and the procedural model keeps running invisibly as a **drive
rig**: combat, spring physics, prop attachment and `AnimPlayer` all keep
reading and writing the same bones they always did. Per frame, after the
model updates, `Retargeter.apply()` transfers the pose onto the imported
skeleton. Three ideas make the transfer natural rather than mechanical:

1. **World-rotation transfer.** The drive rig's bones have identity rest
   rotations, so each bone's quaternion chain *is* its world rotation away
   from bind. That rotation is applied to the mapped target bone in world
   space, recovered into the target's own local space top-down through its
   real hierarchy — so unmapped in-between bones (twist bones, extra spine
   links, fingers) keep their authored rest pose and everything below them
   still lands where the clip put it.
2. **Bind-pose alignment.** Imported models arrive in T-pose, A-pose, or
   anything else; the game's bind is its own relaxed A-pose. Once, at load, a
   shortest-arc rotation per bone takes the target's rest limb direction
   (toward its canonical child) onto the source's. Bones with nothing to aim
   at — hands, feet, head — inherit their parent's alignment and keep their
   natural rest attitude relative to it, which is what keeps wrists and
   ankles looking owned instead of reset.
3. **Twist resolution.** Matching a bone's direction alone leaves its
   rotation *about* that direction undetermined, and the leftover twist makes
   elbows and knees bend out of plane the moment a clip flexes them. Each
   bone therefore names a second reference — a limb uses its own bend plane
   (the elbow for the upper arm, the knee for the thigh), the torso uses the
   shoulder axis — and the alignment becomes a full frame match.
4. **Height-scaled root motion.** The `Hips_pos` positional track (crouch,
   knockdown, jump squash) transfers as a world offset scaled by the ratio of
   the two rigs' hip heights, so a short model crouches proportionally and a
   knockdown still puts the body on the floor.

Bone names are auto-detected (`bonemap.js`): token-based matching that
understands Mixamo (`mixamorig:LeftForeArm`), VRM (`J_Bip_L_LowerArm`),
Rigify/Blender (`forearm.L`) and most hand-named rigs, including collapsing a
2–4-bone spine chain onto the game's `Spine`/`Chest` pair. Anything it cannot
find is skipped, same contract as `AnimPlayer`'s missing-bone rule — and the
manifest can override any guess.

The model itself is normalized on load: height fitted to the character's `H`,
feet grounded on `y = 0`, centred, facing `+Z`.

## Manifest reference (`public/models/manifest.json`)

Keys are a character id (`"yuji"`), a variant pick (`"gojo:shinjuku"`), or
`"*"` as a catch-all; the value is a URL string or an entry object:

| Field | Default | Meaning |
| --- | --- | --- |
| `url` | — | model file, relative to the manifest's folder |
| `scale` | `1` | extra multiplier on the height-normalized fit |
| `yOffset` | `0` | metres up/down after grounding |
| `faceYaw` | `0` | degrees, for models that don't face `+Z` |
| `boneMap` | `{}` | `{canonical: nodeName}` overrides; `null` drops a bone |
| `pose` | `{}` | `{nodeName: [x°,y°,z°]}` rest-pose calibration — absolute local rotations applied before anything is measured, which is how a model that ships in some arbitrary pose is stood into a bind |
| `joints` | `{}` | `{nodeName: [dx,dy,dz]}` pivot corrections — moves where a bone *rotates* without moving the mesh (inverse-binds are rebuilt). The fix for a shoulder that sits too low. Values are an offset in the model's own axes **as a fraction of its height**, so they survive the model being re-exported or decimated |
| `lift` | `{ambient: 0.22, saturation: 1.18}` | a small lighting lift (see below). `false` leaves the file's materials completely untouched |
| `rotOffset` | `{}` | `{canonical: [x°,y°,z°]}` world-space trim per bone |
| `weights` | `[]` | skin repairs (see below) — `{bleed: […]}` as a rule over the surface, or `{at, rigid}` / `{at, drop}` per mesh island |
| `propSlot` | `{}` | `{propName: slot}` — carry a prop in a different attachment slot on this model |
| `grips` | `{}` | `{propName: {bone, at, to}}` — where the OFF hand grips a two-handed weapon (see below) |
| `props` | `{}` | `{propName: {url}}` — an imported weapon model standing in for the procedural one |
| `keepProps` | `true` | procedural weapons stay visible. Set `false` when the model already has them modelled in — Nobara's hammer is in her mesh, so the procedural one would be a second hammer |
| `hideSprings` | `true` | procedural hair/coat spring meshes hidden |
| `skinning` | `"dual"` | `"dual"` blends the bones' rotations (see below), `"linear"` falls back to three.js' stock matrix blend |

`boneMap`/`rotOffset` canonical names are the shared skeleton's:
`Hips Spine Chest Neck Head ClavL UpArmL LoArmL HandL … ThighR ShinR FootR`.

## What ships today

Seven models are committed and mapped, all of them the same shape of export —
a Rigify `DEF-` rig, 33 bones, 19 of them canonical:

| Character | File | Rest pose | Triangles | Entry |
| --- | --- | --- | --- | --- |
| Yuji | `yuji.glb` | as authored (neither T nor A) | 120k | `weights` bleed |
| Nobara | `nobara.glb` | A-pose | 120k | `weights`, `keepProps: false` |
| Jogo | `jogo.glb` | T-pose | 120k | `weights` bleed |
| Mahito | `mahito.glb` | as authored | 300k | `weights` bleed |
| Naoya | `naoya.glb` | as authored | 120k | `weights` bleed |
| Maki | `maki.glb` | A-pose | 120k | `weights` bleed |
| Megumi | `megumi.glb` | A-pose | 120k | `weights` bleed |

None of them needed a `pose` calibration, a `boneMap` override or a pivot
fix: bind alignment absorbs the rest-pose difference (that is what it is for,
and it is why Yuji's un-posed export maps as cleanly as Jogo's T-pose), and
`rerigHierarchy` reparents the eight limbs Rigify exports flat under the
armature root.

Models arrive already decimated and are taken as supplied — the sizes above
are simply what they cost, and there is no budget they are held to.

Verify a model before it lands:

    node tools/modelcheck.mjs              # every manifest entry
    node tools/modelcheck.mjs jogo         # one

## Intake: the symmetry gate

A humanoid rig should be a mirror of itself, and where a left/right pair is
not, one of the two is misplaced. This is the **only** bone-placement fault
that can be judged without anatomy, without trusting the skin weights, and
without anybody looking at it — so it runs in intake rather than in someone's
eye.

Why it is worth having as a rule of its own: the weight-band estimator
(`analyzeJoints`) can only report where the MESH thinks a joint is, which is
useless when the mesh is the thing that is wrong. On a model with a smeared
elbow it will confidently point 18 cm up the forearm. Asymmetry has no such
failure mode — it is a fact about two numbers.

    node tools/symmetry.mjs                 # dry run, every manifest entry
    node tools/symmetry.mjs --write         # merge the fixes in as `joints`

`modelcheck` runs the same measurement as a gate, at BIND — it has to be read
before the retargeter poses anything, or every model reports as asymmetric
because it is mid-clip.

**A posed bind is refused, not averaged.** A model whose bind pose is a
fighting stance has legitimately unmirrored bones, and mirroring them would
average the pose away rather than repair the rig. The split turns out to be
unusually clean: across the shipped models every pair is either under 1.7 cm
or over 20 cm, with nothing in between. A rigger's slip is a centimetre; a
stance with one foot forward is half a metre. Yuji is the one refused —
71 cm at the foot.

Result on the current set: six of seven are already mirrors to within 0.34 cm,
which is a fact about the exporter rather than about this pass. Only Nobara
and Mahito needed anything, and both were sub-centimetre at the hands. The
value here is the gate, not the repair.

One trap, recorded because it measured as a clean success: the offset for the
right side is **not** the mirror of the left's. Meeting in the middle means
`dL = (m(R) - L)/2` and `dR = -m(dL)`, i.e. `(dL.x, -dL.y, -dL.z)`. Mirroring
the offset instead moves both bones the same distance toward the mid-plane,
which preserves the difference in their `|x|` exactly — the bones move, the
report says it worked, and the asymmetry does not budge. Measuring *after*
applying is what caught it, and is why the pass is idempotent by design.

## Landmarks into a rig fix (`tools/landmarks.mjs`)

The verification bench hands back where a person says each joint is. This turns
that into a manifest entry — and, more often than not, refuses to.

    node tools/landmarks.mjs tools/landmarks/nobara.json           # score it
    node tools/landmarks.mjs tools/landmarks/nobara.json --write   # merge it

Nobara's first export is why the rules exist. Read literally it asked to move
her hips pivot **22% of body height**, and applying it whole would have been a
disaster. Read against the model it was mostly right and specifically wrong:

- **A mark's height is a measurement; its depth is a guess.** All seventeen of
  her marks were 2.7% of height to one side and 3–6 cm behind the bones — on a
  model whose mesh *and* bones both centre on x = 0.000. That is the
  single-angle depth error above, not a fact about the rig, so only the
  vertical component is taken unless the landmark was triangulated.
- **Small disagreements are noise.** Under 2% of height (3 cm on a 1.6 m
  fighter) a mark and a bone agree as well as a person can point; applying
  those made every already-correct joint slightly worse.
- **A symmetric rig deserves a symmetric fix.** Her two thigh marks differed by
  0.5 cm — fine as aim, and rejected by modelcheck's symmetry gate as a rig.
  L/R pairs are averaged.
- **Two names, one answer.** Pelvis and waist landed 2 mm apart, which is one
  point answered twice. A contradictory pair is named and neither is applied.
- **"Better" means closer to the drive rig.** The score is the joint's height
  against the procedural character the model stands in for, plus the bone
  directions the bind alignment reads. A rule that improves one and wrecks the
  other is visible, and `--write` refuses when the result is not an improvement.

What it found on Nobara, and what shipped: her spine and thigh pivots sat 5–13
points of body height **below** the drive rig's, while her arms were already
within a point. Seven pivots moved; mean joint-height error against the drive
rig **4.40 → 2.65 points**, mean bone direction 9.4° → 8.3°. On the bench's
squat stress pose she went from standing nearly straight to actually crouching.
The entry records what produced it, so it can be regenerated rather than
guessed at.

## Props and effects follow the body

Everything a character hangs off a bone — Toji's spear, the particle emitter
venting fire from Jogo's head — is parented to the *procedural* skeleton.
That skeleton keeps running as the drive rig, so those nodes keep updating;
but it is invisible now, and its bones sit wherever the procedural body's
proportions put them. Left alone, Jogo's fire burns in mid-air beside his
head.

So each one is re-parented onto the imported bone with the transform that
lands it in the same place on the new body. The retargeter drives
`importedWorld = srcWorld ∘ align`, so a node wanting to sit at `srcWorld · v`
from the imported bone gets the local offset `align⁻¹ · v`, and a local scale
that undoes the wrapper's model-units-to-metres factor. Uniform scale
commutes with rotation, so the two cancel exactly. `attachProp` is wrapped as
well, because it re-parents onto the drive rig every time a clip changes
hands.

This is why Jogo needs no `scale` trim to make his plume meet his head.

One trap worth naming, because it cost a weapon: position and rotation can be
transformed in place on each adoption, since `attachProp` rewrites both from
the attachment every time — and the fighter calls it EVERY FRAME for anything
whose slot depends on state (Maki's weapon toggle, Toji's arsenal, Nobara's
hammer, Miwa's saya). It does not touch scale. Dividing the *current* scale by
the wrapper's factor therefore compounded once per frame: the weapon shrank by
~1.7x per frame and was gone inside a second. The adoption now remembers each
node's own scale and assigns rather than divides. It went unnoticed because
the benches attach a prop once, and at match camera distance a weapon
vanishing looks like a character who never drew one.

## Two-handed weapons (`grips`)

One hand on a weapon is solved by the attachment: the prop hangs off a bone,
that bone gets adopted onto the imported skeleton, done. The SECOND hand is a
different problem, and it is the one the retargeter cannot answer on its own.

Rotation transfer is the right contract for a body. A clip says "the elbow is
bent this much", and a differently proportioned arm ends up with its wrist
somewhere else — as it should. But a hand closed around a haft is a
**position**, not an angle, and "somewhere else" is a hand floating off the
weapon. The eye finds it immediately, because it is the one place in the pose
where two things are supposed to be touching. Measured on a real pair — Maki's
clips driving an imported body fitted to her height — the miss is about 4 cm.

So the weapon says where the off hand belongs, as a point in **its own local
space**, and that arm is re-solved onto it with two-bone IK (`ik.js`,
`grip.js`) after the pose is final:

```json
"grips": { "playful_cloud": { "bone": "HandL",
                              "at": [0, 0.42, 0], "to": [0, 0.66, 0] } }
```

| Field | Meaning |
| --- | --- |
| `bone` | which hand grips (`HandL` by default) |
| `at` | the point on the weapon, in the weapon's own space |
| `to` | optional: makes it a **segment**, and the hand slides along it to whatever spot it can reach — which is what a hand on a long haft actually does, and far more forgiving across models than a fixed point |
| `weight` | 0..1 authored strength |
| `only` / `except` | clip names, matched against `model.gripClip` |

Because the point is prop-local it does not care whether the weapon is the
procedural one or an imported `.glb` standing in the same place, and it
survives the weapon being re-authored as long as the shape does not move.

Three things it deliberately does not do:

- **It never runs on the procedural body.** Those clips were authored against
  those proportions, so its hands are already where the animator put them.
- **It does not choose the weapon's pose.** Where the weapon sits is the
  attachment's business. The grip only answers "and the other hand goes HERE
  on it" — so a weapon a character carries one-handed needs a two-handed
  attachment *first*; a grip point alone will not pull a hand across the body
  onto a staff hanging at the far hip. `propSlot` picks that slot per model.
- **It does not invent a hand orientation.** The palm attitude the retargeter
  chose is captured before the solve and restored after, so only the position
  changes.

An arm straining at something out of range reads far worse than a hand
slightly off it, so how far the target sits past the arm's reach is measured
*before* solving and the correction is faded out over the last 12 cm. That is
also the automatic answer for clips where the hand genuinely leaves the
weapon.

Author one by clicking: **WEAPONS** on `/workbench/?edit=models` shows the
character's props on the imported body during preview, and arming a prop then
clicking the haft stores that point in the weapon's own space. It exports
with the rest of the entry.

### Grips run on the procedural body too

The original rule was that grip.js only ever touched an IMPORTED body, on the
argument that the procedural one needs no help: its clips were authored
against its own proportions.

That argument does not survive a weapon whose attachment is **solved** rather
than drawn. Maki's staff and naginata are laid through her hands by a
transform computed from one settled pose; every other frame moves the leading
hand and swings the far end, and her rear hand is then as approximate on the
drive rig as it is on an import. So `finalizeModel` wires the same solver over
the character's own bones whenever any attachment declares a grip. It costs
nothing for the characters that declare none — the solver reports itself
inactive and the update hook is never installed.

The authored angles become the pose the solve starts from rather than the only
thing holding the hand on, which is why the clip files still read as poses
rather than as a table of solved numbers.

### Imported weapons (`props`)

A weapon can come from a file too:

```json
"props": { "playful_cloud": { "url": "./maki_polearm.glb" } }
```

It does not replace the prop — it goes **inside** it. The procedural prop's
node is what carries the attachment transform, the adoption onto the imported
hand, and the space the grip point is measured in; parent the loaded weapon
under that node and it inherits all three, and the grip maths never learns
that the shape came from a file. Size comes from the weapon it stands in for
(longest dimension matched), with `scale`/`pos`/`rot` to trim.

This is worth preferring over modelling the weapon into the character's mesh.
Weapons move between slots — Maki visibly carries both of hers, Toji's
inventory curse swallows what he is not holding — and weapons are shared
code, with Maki importing Toji's builders unchanged. A weapon skinned into
the body can never be sheathed, swapped, dropped or shared. Where a model
really does have its weapon modelled in, `keepProps: false` is the answer
instead — that is how Nobara ships.

### The first one: Maki's Playful Cloud

Maki carries the staff two-handed, and the grip above is what holds an
imported body's off hand on the shaft. Getting there needed the attachment
first, which is the general lesson: **a grip point does not create a
two-handed carry, it only keeps one honest.**

Her `*Cloud` clip set was already authored for a two-handed staff — idleCloud
says so, both arms are driven, and her hands sit 0.75–0.96 m apart through
every clip in the set. But the weapon was hanging off one hand, so her left
hand was reaching for something 0.62–0.92 m away from it. The animation and
the attachment disagreed, and the animation was right. Three things closed it:

- a `twoHand` attachment solved from the settled idleCloud pose — the staff
  aimed from her left hand to her right, butt 0.12 m beyond the left;
- the staff lengthened **for her** from 0.24·H to 0.32·H (1.25 m to 1.67 m).
  Her grip needs 1.14 m before the weapon even spans both hands, and a real
  three-section staff is about six feet anyway. Toji keeps 0.24 — the length
  is a parameter now, and his one-handed hang is what it was tuned for;
- every Cloud clip re-based on the two-handed guard. `K(t, {})` falls through
  to `MAKI_STANCE`, which is her EMPTY-HANDED guard, so every staff attack
  used to begin and end with her left hand 16 cm off the weapon.

The mid-swing keys were then re-solved with the same two-bone IK that runs at
runtime, used as an authoring tool: her left hand was put back on the shaft at
each key and the arm angles read out. Worst-case divergence across the set
fell from 0.72 m to 0.20 m, and what is left is the genuinely one-handed
extreme of each swing — in character for a three-section staff, whose whole
point is that it can be flung from one hand.

## Bend limits (`limits`)

The retargeter transfers rotations, which is what lets one clip play on every
rig. It is also why a pose can be impossible: the same rotation on a body with
different FLESH is not the same picture. Nobara's punch3 ends with her elbow
folded 145°; on the procedural body — slim tapered limbs, hard edges, an ink
outline — that is a bent arm with a pointed elbow, and on hers it is two thick
sleeves pressed together.

    "limits": { "LoArmL": 120, "LoArmR": 120 }

caps the bend in degrees (0 straight, 180 folded flat), applied after the
retargeter and before the grip solver, about the joint's own current bend axis
so the limb's swing and twist are untouched. It is exact — asked for 120 it
delivers 120.0 — which took one correction worth knowing about: the retargeter
writes local rotations and does not refresh world matrices, so reading them raw
measures the pose a frame late and the correction chases a moving target
(asked for 120 it settled at 129).

**Nothing ships with limits set, and Nobara's elbow is why.** A limit is real
and it works, and on the case it was written for it did not help: at 120° her
sleeve still reads as a hairpin, because the shape is set by the sleeve's own
thickness rather than by the angle. It is here for the fault it does fix — a
limb that folds through its own body, or a pose whose extreme is past what a
particular model can hold — and enabling it costs the pose a few centimetres,
so use the smallest limit that opens the silhouette.

## Skin repairs (`weights`)

Two defects turn up in nearly every imported character, and neither is really
a rigging mistake — they are what automatic weighting does when two pieces of
geometry are near each other in the bind pose:

- **Bled weights.** Nobara's arms hang beside her hips, so the bind gave her
  skirt a share of the forearm. It looks fine at rest and wrong the moment
  she moves: the dress swings when the arm does.
- **Soft props.** A hammer held in a fist is one mesh with the body, so it
  gets blended across the hand and forearm like flesh, and *bends*.

Neither can be fixed by distance — the skirt really is closer to the forearm
than to anything else while the arm hangs beside it. What separates them is
the **surface**: to walk from the sleeve to the skirt you have to cross the
torso, where the forearm has no weight at all.

| Op | Meaning |
| --- | --- |
| `{"bleed": ["hand", "forearm"]}` | a rule: each named bone keeps the one connected patch of surface it actually sits on and loses every other patch it had picked up |
| `{"at": […], "rigid": "DEF-handR"}` | bind one mesh island 100% to a bone — the fix for a held prop that bends |
| `{"at": […], "drop": ["…"]}` | remove named bones from one mesh island |

`bleed` is the one that generalises. **A bone drives one piece of surface, not
two.** The forearm's real territory is a band of sleeve running down the arm;
when an automatic bind also hands it a piece of skirt, that piece arrives as a
second, disconnected blob. Drop the blob that does not contain the bone, keep
the one that does, renormalize. No thresholds, no anchors, no list of parts,
and nothing to re-derive when the model is re-exported — it takes 8.7k stray
vertices off Nobara's skirt, 20 off Mahito, and touches *nothing* on Yuji,
Jogo or Naoya, whose arms were already clean.

The unit is the surface, so vertices are welded by position first. Every UV
seam duplicates the vertices along it, which chops the index buffer into
charts — 46 of them on Nobara — and a blob that is visibly one piece would
otherwise count as several. (Welding is for the *rule* only; `at` ops still
target an index-buffer island, which is what makes them clickable — on a model
whose prop is modelled into the body, the chart is the only handle there is.)

Two earlier versions got this wrong, and the test suite now pins both:

- **Per island, by domination.** Dropping the bone from every island it did
  not *dominate* tore the forearm off the arm — an arm is one island dominated
  by the upper arm — so the elbow stopped bending, Nobara's sleeves opened up
  and Yuji's hand came apart.
- **Per vertex, by share.** Keeping the vertices the bone owned outright
  stopped that tearing, but only for geometry that was mostly right already.
  On the skirt it cleaned the weak vertices and kept the strong ones, so one
  continuous panel ended up half on the hip and half on the wrist and shards
  of it flew off with her hand. Connectivity has no halfway state: a blob goes
  or it stays, whole.

`at` is a point measured from the mesh's own rest bounding box and divided by
that box's height, so it is scale- and space-invariant — the bench measures a
fitted model in metres, the game applies ops before the fit in the file's own
units, and both land on the same island.

Author them by clicking: **5 · SKIN** on `/workbench/?edit=rig` selects the
island under the cursor, lists what drives it, and offers rigid/drop.

### Joint sharpness (`tighten`) — the defect that only shows in motion

A limb bends where two bones swap influence. Spread that swap over half the
limb and nothing bends *at* the joint: the whole limb curves, and the eye reads
an arm that is too long and made of rubber. At rest it is invisible, which is
how it survived every pass of looking at these models — and one wrong diagnosis
of mine, which blamed the missing ink outline.

It is not a rigging mistake either. Rigify splits every limb into a bone and a
**twist** bone that is a rigid child of it (`DEF-upper_armR` + `DEF-upper_armR001`),
automatic weighting spreads influence smoothly across all four, and the
constraints that drive the twists in Blender cannot travel in a `.glb`. The
mapper names only the first of each pair, so what matters is the hand-over
between **groups**: everything riding with the parent against everything riding
with the child.

    node tools/bands.mjs             # every model, every limb joint
    node tools/bands.mjs nobara      # one

Measured as they shipped, the hand-over ran from 13% of the limb (Maki, Mahito
— what this pipeline produces when it goes right) to **49-52%** on Nobara's
elbows and Yuji's right, which is 14-15 cm of an arm that is 30 cm long. Both
were reported as "long and loopy" / "stretched and bendy", months apart.

    "weights": [{ "tighten": "limbs" }]

re-ramps the parent group's total against the child group's over a band centred
on the joint — 28% wide, which measures out at the 17% the clean exports
already have. What it deliberately does **not** touch is the split *within* a
group: how the upper arm shares a vertex with its own twist bone is what keeps
a shoulder from collapsing, and it stays exactly as authored.

Two things it has to get right, both learned the hard way:

- **Along the bones, not along the straight line between their ends.** On a
  model whose bind pose is a fighting stance the arm is already bent, and a
  chord from shoulder to wrist passes outside it. Projecting onto that chord
  put the band in the wrong place on Yuji and tore his hand into shards.
  Arclength along shoulder → elbow → wrist is right whatever the bind is doing.
- **Stay on the limb.** A sleeve hanging away from a bent arm is nearer this
  chain than to anything else and is not part of the joint, so a radius bound
  goes with the arclength one.

`modelcheck` measures it on every entry and names any joint past 30% of the
limb or 9 cm, so a future model arrives with this already asked about.

## Where the swap applies

Every place a character's body is built: the match, summons, the select
screen (grid and variant preview), the title screen, and the model viewer.
All of them route through `maybeAttachRender3D`, so a player never picks one
body and gets another.

## What deliberately does not change

- Hitboxes, movement, combat timing — all read the drive rig; the swap is
  presentation only, so netplay and balance are untouched.
- The asset policy: the game's own art remains procedural and nothing in
  `public/models/` is imported into the bundle — model `.glb`s live in that
  folder as committed, runtime-fetched files, opt-in behind the URL param.
- Characters whose body plan exceeds the humanoid contract degrade
  gracefully: Sukuna's second arm pair has no counterpart on a stock
  humanoid, so those clips' extra-arm tracks simply don't transfer.

## The workbenches

Three pages at `/workbench/` do the model-preparation work, all built on the
shipped pipeline rather than a parallel implementation — the same
`guessBoneMap`, `rerigHierarchy`, `Retargeter` and `fitInto` the game runs.
Models load from the manifest, from a URL, or by dropping a file on the page,
so nothing has to be committed to be inspected.

A manifest chip loads the model **as the game loads it**: the entry's own
`scale`, `pose`, `boneMap`, `joints`, `rotOffset` and `lift` are replayed onto
it, and the character the entry is keyed to becomes the reference body. A
bench that showed the raw file instead would disagree with the game about
every model that needed a fix to ship — and would measure the fit against
whatever fighter happened to be selected, since the height fit is normalized
to the reference's `H`.

**`?edit=models` — integration.** Stand a model into a bind (auto T-pose or
auto game-bind, then per-bone adjustment), check skinning with the per-bone
weight heatmap, and preview any character's real clips beside the procedural
body it replaces.

### Lighting: a lift, not a restyle

A `.glb` authored for an offline render arrives lit for a room that has an
environment in it. Dropped into this scene — three lights, no envmap — the
dark half of every surface falls to near-black and a navy uniform reads as a
black one. The colour is in the texture; nothing is reaching it.

So imported models keep their own PBR materials and get two small dials
(`src/art/rig3d/lift.js`), live in both benches and exported with the model:

- **`ambient`** adds back a fraction of the model's **own base texture** as
  emissive. That detail is the whole point: an ambient *light* adds grey and
  washes the hue out, while adding the surface's own colour lifts the shadows
  and makes the blue *more* blue. It is also per material rather than per
  scene, so two fighters don't double each other's lighting the way two
  ambient lights in one scene would.
- **`saturation`** is a gentle push on top, for a texture baked a little grey
  for a fighting game. At `1` no shader is compiled at all.

Deliberately not a style pass. An earlier version re-shaded imports through
the game's cel material with an ink outline, and it was far too much — a
model should look like itself, only lit.

### Skinning: why bent arms used to go thin

three.js skins with **linear blend skinning**: a vertex near the elbow is
transformed by the weighted average of the upper-arm and forearm *matrices*.
The average of two rotation matrices is not a rotation — it is a shrunk one —
so the harder a joint bends the more cross-section it loses. Bend an elbow to
a right angle and the sleeve pinches to a waist; the classic "candy wrapper".

`src/art/rig3d/dqs.js` patches the two skinning chunks to blend **dual
quaternions** instead, which interpolate the rotation rather than the matrix,
so the joint sweeps its arc and keeps its thickness. It is on for every
imported model, and the rig bench has a *Volume-preserving skinning* toggle to
see the difference (try it on the `elbows` stress pose).

It is valid because these skin matrices are rigid up to one uniform factor.
`bone.matrixWorld · boneInverse` cancels the model's own scale, the animation
only ever writes rotations and the hips' position — and the height-fit factor,
which is captured after bind and so does *not* cancel, is the same number on
every bone, blended linearly alongside the rotation and applied to the point.
Non-uniform or animated scale is the one thing a dual quaternion cannot carry;
a model that needs it sets `"skinning": "linear"`.

### Landmarks: pointing at the joints

Everything the alignment does is derived from **where the bones sit inside the
mesh**: a bone's rest direction is (this joint → the next joint down), and
that direction is what gets matched onto the game's. So a bone in the wrong
place aims its limb somewhere the clip never asked for — arms that come out
bent, a torso that hunches — and no amount of tuning the clip will fix it.

Skin weights can measure this (`MEASURE`, above) but only up to the shape of
the costume: the hand-over band between two bones is a hoodie as much as it
is a shoulder. A person looking at the model does not have that problem.

So the rig bench asks for the one thing a person is unambiguously better at.
Pick a row from the landmark list — pelvis, waist, chest, neck base, head,
and both shoulders, elbows, wrists, hips, knees and ankles — then **click that
joint on the model**. The click lands *inside* the body (the ray is averaged
through it), and clicking the same joint again from the opposite side
averages the samples, which is worth doing for the shoulders and hips. A pink
dot marks it; a line runs to where the bone currently is, so a long line is
the error.

Two buttons turn marks into fixes:

- **Check mapping** — for each mark, the nearest joint in the model is the
  model's own answer. Where it disagrees with what was mapped, that is a
  *mapping* bug rather than a placement one.
- **Move bones to marks** — every marked joint becomes its bone's pivot.
  Because the alignment is derived from bone positions, correcting the
  positions corrects every clip at once.

The export carries the marks (in model space and normalized by body height),
the per-bone error in centimetres, and any mapping the marks disagree with —
enough to reproduce and improve the fix offline.

### `?edit=verification` — the same question, as a queue

The landmark checklist above is the right shape for **inspecting** a rig and
the wrong shape for **answering** about one. It asks you to decide what to do
next seventeen times, it assumes you already know what a pelvis pivot is, and
it does not fit on a phone — which matters more than it sounds, because
pointing at a shoulder is a thing a touch screen is *better* at than a mouse.

So the verification bench asks instead. One question at a time, with the view
already orbited to the right side of the body and zoomed to the joint, a
progress bar, and an **EXPORT DECISIONS** button at the end. The first queue
is `landmarks`: the same seventeen joints, bracketed by two questions the
tools cannot answer for themselves —

- **is this bind pose a rest, or a fighting stance?** `symmetry.mjs` decides
  that from a threshold (see *Intake: the symmetry gate*), and a threshold is
  a guess about a fact somebody knows.
- **anything else wrong with it?** free text, carried verbatim.

The export is a decisions file rather than a manifest entry: the answers as
given, the marks in model space *and* normalized by height, the per-bone error
in centimetres, any bone the marks say was mis-*mapped* rather than misplaced,
and a `joints` patch ready to paste into `manifest.json`.

**On a phone the viewer is the page.** Not a pane in it: a fixed layer sized
in `dvh`, owing nothing to the page's scroll or to a browser toolbar that grows
and shrinks — which is what put the viewer below the fold on a real phone while
an emulator showed it fine. Everything else is a panel that opens over it, one
at a time, from a dock along the bottom: **QUEUE** (every question and its
answer, jump to any), **VIEW** (the camera controls as buttons, for a hand that
cannot pinch), **SETUP** (the model, the fighter it stands in for, the way out),
and the question itself, which opens by tapping the dock's own title. Nothing is
ever half-visible — a panel is either over the viewer or gone.

The rule that makes it work: **a question you answer IN a panel opens it; a
question you answer by POINTING leaves the screen clear.** Fifteen of the
nineteen are pointing questions, so most of the queue is a full-screen model
with one bar under it saying which joint this is, how far through you are, and
back/next. On a wide screen the same panels are a rail down the right and the
viewer is left alone — one set of panels and one runner, not two benches that
drift apart.

Three more things are deliberate:

- **The skeleton is hidden by default.** The rig bench draws every joint as a
  green ball, which is right when the question is *is this the right bone*.
  Here it is worse than useless: shown a ball near the shoulder, a person
  points at the ball, and the answer is the rig's own opinion handed back to
  it. VIEW → *see the bones* brings them in when they are actually wanted.
- **The framing answers to the screen it will be seen on.** The camera's field
  of view is vertical, so the distance that frames a shoulder on a 16:9
  desktop crops to an anonymous patch of dark cloth on a portrait phone; and
  whatever chrome is over the viewer is measured, not assumed, so the shot
  pulls back and aims above it. The desktop rail covers nothing and changes
  nothing.
- **Leaving a question is what records it.** There are five ways out of one —
  the panel's Next, the dock's, an arrow key, Back, a jump from the queue list
  — and putting the commit on any one button loses answers through the other
  four. It did: the phone dock once advanced the queue without recording, and
  the export came out a mark short of what was plainly on the screen.

#### A quarter turn, not the other side

A tap is a *ray*. The bench turns it into a point inside the body by averaging
where the ray enters and leaves — which is most of what is wanted, and leaves a
depth error **along the line of sight**, the one direction the person tapping
cannot see. Measured on Nobara it is 2–11 cm depending on the joint, and it does
not average away: two taps from the same viewpoint share it exactly.

So a sample stores its ray, and rays from different angles are not several
guesses but an intersection — least squares over the lines, no depth heuristic
involved. The question is then which second angle, and the intuitive answer is
wrong. **"Tap it again from the other side" is the one rotation that adds
nothing**: two opposite rays are the same line, and they constrain nothing along
it. For a pair of rays `det(A) = 2sin²θ` — zero at 0° *and* at 180°, largest at
a quarter turn.

Driving the real bench, clicking where a known bone projects with four pixels of
aim error (a careful finger), median over four joints × four viewpoints:

| angle between the two taps | median error | worst |
| --- | --- | --- |
| one tap only | 4.7 cm | 17 cm |
| 15° | 3.7 cm | 9 cm |
| 45° | 1.3 cm | 16 cm |
| **90°** | **0.7 cm** | 17 cm |
| **135°** | **0.6 cm** | 0.6 cm |
| 165° | 1.2 cm | 1.2 cm |
| 180° | 3.1 cm | 3.1 cm |

(Without the aim error every angle past 30° reads 0.0 cm, because a perfect tap
puts every ray exactly through the answer and even a degenerate pair recovers
it. That is why the first version of this table said 180° was fine, and it is
why `benchcheck` now jitters.)

So the bench asks for **a quarter turn**, its turn button is 90° rather than
180°, and what it reports is not the angle but `landmarkQuality` — the
conditioning of the intersection, normalized so it means the same for two
samples and for five. 84% at a quarter turn, 1% at the opposite side. The
export carries it per landmark, and `tools/landmarks.mjs` will only use a
landmark's sideways and front-back components when it is above 50%.

Two of the questions were also *wrong*, which the first real answers proved:
"pelvis centre, level with the top of the hip bones" reads at the navel, about
10% of body height above the bone it fixes — the first person to answer it
marked the pelvis 2 mm from where they then marked the waist — and "head centre,
the middle of the skull" sits above the joint the head actually turns on. Both
now ask for the pivot.

`node tools/benchcheck.mjs` drives the whole loop in a real browser at both
sizes. Adding a queue is one entry in `QUEUES` (`src/workbench/verification.js`)
returning question objects; the four kinds — `point`, `choice`, `note`, `done`
— already have their framing, persistence and export written.

**`?edit=rig` — the questions only eyes can answer.** Walk the mapping bone
by bone with the guessed joint lit in the view (click the right joint in 3D
to reassign); stand the rig in a **reference pose** (below) to judge whether
it is worth shipping at all; run the **stress poses** — arms overhead, deep
squat, spine twist — which is where a misplaced pivot stops being subtle;
**measure** the skin weights to see where each joint actually is versus where
the bone sits; and correct pivots and retarget trims with live dials.

#### The second queue: `poses` — does it read in motion?

`?edit=verification&queue=poses` asks the other half of the question. The
landmarks queue is about a body standing still, and everything it can fix is a
fact about the bind pose. It cannot see the fault that has taken longest to
find here twice, because that fault only exists in motion: an elbow the bones
place correctly to the degree, which still reads as a hose rather than an arm.

Each question holds one frame of one clip — the extremes, which is where a rig
fails and where nobody looks — frames the joint, and offers a short list of
FAULTS rather than a rating:

| what you see | what it points at |
| --- | --- |
| curves where it should be straight | skin weights — `tighten` |
| bends in the wrong place | the pivot — the landmarks queue |
| two parts merge into one shape | the pose is past what this body can hold — `limits` |
| pinches, collapses or spikes | skinning mode, or a weight repair |
| passes through the body | a limit, or the attachment |

The list is the whole value: "it looks wrong" cannot be acted on, while those
five point at five different repairs and rule each other out. **COMPARE** swaps
to the procedural body the clip was authored on, at the same camera, so the
answer can be the one that matters — *that* one reads and this one does not,
which means the clip is fine and the model is not.

### Reference poses: is this rig viable?

Both benches offer **T-pose** and **A-pose** next to the stress set. They put
every limb along a straight line with the two sides mirrored, so anything
bent, short, sagging or lopsided is the rig rather than the pose — the flat
first question, before any stress pose asks whether a particular joint
survives an extreme.

They are *driven*, not authored: the drive rig is set to its own bind (its
bones rest at identity) and each arm segment is then **aimed** along a world
direction computed from that rig's own rest limb. The game's bind has the arms
13° off vertical, so a hardcoded angle would be a different pose on a different
body; aiming makes it the same pose on every one, and genuinely mirrored.
Nothing is stored — this poses the rig, where `autoPose` (the *T-pose* /
*Auto game bind* buttons) edits the model's own rest pose and does get exported.

Because the pose is symmetric by construction, the rig bench also reports the
**mirror mismatch**: the posed mesh reflected in x, measured against itself, as
a percentage of body height. Under ~1% is an even bind. It is the one defect
the eye is worst at — a shoulder pivot a few centimetres lower on one side
reads only as "he looks a bit off". Today: Naoya 0.16%, Nobara 1.8%, Yuji 2.1%
— though a prop in one hand or a costume that is not itself symmetric raises
the number on its own, so read it next to the model rather than alone.

Both export one manifest-entry JSON carrying every correction — mapping
picks, landmarks, pivot fixes, rest-pose calibration, trims, fit numbers,
lighting dials and free-text notes.

### Where a joint actually is

Between two adjacent bones the skin weights hand over across a band, and the
centroid of that band **is** the joint — so the difference against the bone's
position is a measurement rather than an opinion. MEASURE reports it per
bone; the fix moves the pivot and rebuilds the inverse-bind so the rest mesh
is bit-identical and only the rotation centre changes. `Mirror fixes L↔R`
averages the left and right *corrections* (not the absolute pivots, which
would tear apart a model whose bind pose is legitimately asymmetric).

## Budget

A model authored for rendering is routinely far heavier than one authored for
a game. `tools/decimate.mjs` shrinks one safely — see tools/README.md — and
**a decimation that preserves the skeleton preserves every manifest fix**,
because `boneMap`, `pose` and `rotOffset` are keyed to bone names, `joints`
is stored as a fraction of body height in the model's own axes (so it
survives a re-export at a different scale or origin), and every automatic
pass is re-derived at load from the skeleton. The tool diffs the two skeletons and says so explicitly.

The supplied characters arrive already decimated, in the 120k–300k range,
and that is simply what they cost — there is no budget to hold them to. The
threshold that warns at load and in the bench status sits at 500k, well clear
of that, so it only fires on a model that was never optimised at all (the
first Yuji arrived at 2.0M):

`test/render3d.mjs` covers the mapping math headlessly: it drives a synthetic
Mixamo-named T-pose skeleton from a real roster model and asserts limb
directions track the source through real clips.
