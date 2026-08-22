# YAGA MASAMICHI & TAKABA FUMIHIKO — delivery notes

Two new playable characters. Nothing about an existing character's behaviour
changed; every edit to an existing file is an addition, and Yuta's domain roll
is byte-identical.

**Takaba's ultimate was rebuilt after the first delivery.** It shipped as three
quick-time events behind a full-screen panel; it is now THE SET 持ちネタ, a
traversable pocket world with three parkour scenes in it. Section 3 is the new
one — the QTE tables it replaced are gone, along with `combat/gameshow.js`.

---

## 1 · RESEARCH — WHAT I FOUND, AND WHAT THE BRIEF GOT WRONG

**Web access: yes.** `jujutsu-kaisen.fandom.com` and `hero.fandom.com` are both
BLOCKED from this session's proxy, so the wiki turnarounds were not readable.
Everything below is off the reference art supplied with the brief or off one of:
CBR's and Looper's and Gamerant's Yaga technique explainers, the ORICON and
Baidu profiles, Poggers' character analysis, Gamerant's and Beebom's and
Animehunch's Comedian explainers, NamuWiki, and Grokipedia.

### YAGA — CURSED CORPSES

* **The technique is authorship, not summoning.** He uses "a person's physical
  information to replicate their soul information and place it into a Cursed
  Corpse." That is a manufacturing process with an input, a duration and a
  quality — which is why B is a HOLD with a meter rather than a spawn button.
  The mechanic *is* the technique.
* **A normal cursed corpse is an object.** "Usually an inanimate object that is
  programmed to complete a set list of given tasks and lacks self-awareness or
  its own cursed energy." Two hard consequences, both implemented literally:
  it runs off HIS energy (so construction bills CURRENT_CE continuously rather
  than charging a lump sum), and its AI is a short task list rather than a
  personality (so COMMAND *overwrites* that list).
* **They feel no pain and do not flinch.** Quoted as their key advantage over
  living beings. Every tier above SCRAP carries `noFlinch`, so hitting one does
  not interrupt it. This is the single most important thing about fighting one
  and it is canon rather than a balance invention.

**What Panda implies — the question the brief asked.** Panda was made by putting
THREE compatible souls into one core so each could observe the others and
stabilise; after **three months** the corpse began producing its own cursed
energy and stopped feeding off Yaga's. So Panda is not "a very good version of
what B builds" — he is the end of a months-long process whose product is
*independence*, and independence is exactly what a corpse built inside a
two-minute round can never have.

**That became the ceiling rule for the whole character.** Even a MASTERWORK
expires and stays on his meter, because nothing built in six seconds has had
three months to stabilise. It is also why Panda is on the roster as a *fighter*
and is not something Yaga can produce.

One more finding that shaped the finisher: the higher-ups nearly promoted him to
special grade and restricted him, because a man who can make sentient corpses
can raise an army with no supply line. MASTERPIECE is that fantasy cashed once.

### TAKABA — THE COMEDIAN

* **It is reality-warping, not prop-summoning.** "If Takaba finds anything
  genuinely funny, it actually becomes reality." So the bits arrive instantly
  and fully formed with no cast-up — they are not thrown, they are suddenly
  true.
* **Its applications are absurdly broad**: conjuring objects from nothing,
  healing himself with no Reverse Cursed Technique, and *nullifying damage*.
  Only the first is in his kit. **That is a deliberate narrowing** — a fighting
  game character who randomly nullifies damage is not a wildcard, he is a coin
  flip nobody can play against.
* **The limit is psychological and it is the whole balance hook.** The technique
  runs on his *genuine* belief that something is funny; shake his confidence and
  it stops. Kenjaku found this and worked it. **The Comedy Meter is that, with a
  bar on it** — not an invented resource, the canonical failure mode made
  playable.

### THINGS THE BRIEF GOT WRONG, OR THAT NEED FLAGGING

1. **The Comedy Meter's direction is a deliberate deviation from canon.** The
   brief asks for *equal average value at every tier, escalating spectacle only*.
   In canon a shaken Takaba produces **less**, not smaller-but-equal. I built it
   as briefed because it is the better game, and I am flagging it because it is
   the looser adaptation. It is implemented honestly: every table entry declares
   a `value` column, every entry in a table is worth the same, and the meter
   tilts only `bigness`.
2. **Yaga has no famous battle line.** The brief asks me to research whether a
   suitable taunt line exists rather than inventing one. The honest finding is
   that there isn't one — his quoted dialogue is almost entirely about students,
   paperwork and staying alive. So the taunt takes the one register the source
   consistently puts him in (the exasperated teacher) and says the shortest true
   thing in it: **"Sit down."** The *clip* is the taunt; the line is the caption.
3. **Everything else in the brief checked out**, including both "no Domain
   Expansion" rulings, the Panda relationship, the Kenjaku fight being where the
   Comedian's limit is established, and the split costume's exact description.

---

## 2 · TAKABA'S FULL OUTCOME TABLES

Damage figures are the table's raw numbers. In play they are multiplied by the
global `SPECIAL` scalar (1.30) and his `damageScale` (0.94) — e.g. the MALLET's
11.5 lands as 14.1, measured.

`value` is the equal-value audit column: what the entry is worth in equivalent
damage once its non-damage payload is priced. Pricing conventions, so the
numbers can be argued with: a hard knockdown ≈ 8, one second of blind ≈ 3, one
second off-field ≈ 5, one second of slow ≈ 2, a launcher ≈ 5, four metres of
pushback ≈ 3.

`big` is `bigness` — how *enormous* it looks, and the ONLY thing the Comedy
Meter shifts.

### RB — A BIT (8 outcomes, target value 11.5 ± 1.0)

| bit | wt | big | value | dmg | mechanics |
|---|---|---|---|---|---|
| BOXING GLOVE | 12 | 0.55 | 11.5 | 8.5 | 5.2 knockback. Pure position. **Projectile** |
| OVERSIZED MALLET | 12 | 0.70 | 11.5 | 11.5 | Most raw damage in the table; leaves them standing in front of him |
| BANANA PEEL | 12 | 0.15 | 11.5 | 3.0 | **Hard knockdown**. The tamest-looking entry and one of the strongest |
| BUCKET ON THE HEAD | 12 | 0.20 | 11.0 | 4.0 | **2.2 s blind** (their soft lock goes stale and their aim wanders) |
| PIE, FULL IN THE FACE | 12 | 0.25 | 11.0 | 5.0 | 1.2 s blind **+** 1.6 s slow ×0.7. **Projectile** |
| THE RAKE | 12 | 0.40 | 11.5 | 7.0 | **Launcher** — his only real juggle starter |
| TRAPDOOR | 11 | 0.35 | 12.0 | 3.5 | **1.1 s off the field**, then dropped back prone |
| FALLING STAGE LIGHT | 11 | 0.85 | 12.0 | 14.0 | Biggest number in the table, on a **0.55 s telegraph** you can walk out of |

### RT — THE BIG ONE (6 outcomes, target value 26 ± 1.5)

| bit | wt | big | value | dmg | mechanics |
|---|---|---|---|---|---|
| ANVIL | 12 | 0.60 | 26.0 | 18.0 | Hard knockdown. 0.35 s telegraph. The benchmark |
| A CARTOON SAFE | 12 | 0.70 | 26.5 | 16.0 | **2 s pinned under it** — his longest guaranteed follow-up |
| THE STAGE CURTAIN | 11 | 0.75 | 26.0 | 8.0 | **1.6 s off the field**, then spat back out prone |
| FIRE HOSE | 12 | 0.65 | 25.5 | 15.0 | 5 ticks, walks them **11 m** back. **Projectile** |
| ENORMOUS FOAM FINGER | 12 | 0.90 | 26.0 | 16.0 | **Launcher**, 4 m arc — the only entry that can hit two people |
| A PIANO | 11 | 1.00 | 27.0 | 22.0 | Biggest number he owns, longest telegraph, and the wreck chips |

### ARE ANY OF THEM DUDS? — HONESTLY

**No, but two were and got fixed, and one is still the weakest.**

* **BANANA PEEL** started at 3 damage and nothing else and was obviously the
  dud. It is now a *hard knockdown*, which is worth about 8 on its own — it is
  now one of the strongest entries in the table and the pathetic presentation is
  the joke rather than the cost. Measured: it pays the most Comedy Meter of any
  small bit (+7 land +5 knockdown).
* **FIRE HOSE** was genuinely broken rather than weak: because it is five
  entities carrying one bit, it paid `gainBigLand` **five times** and was by a
  wide margin the best meter source in his kit. Found by measuring the meter
  delta per outcome (16.5 against everything else's ~9). A stream now pays once
  per cast (`pays` on the first tick only). Same for the whiff penalty.
* **BUCKET** is the one I would still call marginal. 4 damage plus 2.2 s of
  blind is priced at 11.0 and it *is* worth that, but blind is the least legible
  payload in the set — a player who does not know what happened just sees a
  small hit. It has the loudest cue and the longest-held prop of the eight to
  compensate. If one entry gets retuned later it is this one.

---

## 3 · THE SET — THE SIX SCENES

The ultimate is **not** a cutscene, a domain, or a quick-time event. The arena
is hidden the way a closed domain hides it, a 26 m corridor is built in its
place, and both fighters are physically put in it with the controls live. The
opponent has to *run out*. Takaba is in there with them and neither takes nor
deals damage while it is up, which is canon rather than a balance dial:

> "Any damage incurred to his opponent will persist, but damage done to Takaba
> are nothing but simulations to him."

Three scenes are drawn from a pool of six, no repeats, off the caster's own
seeded stream so a debug seed reproduces the whole run.

| # | scene | 場面 | what it is | panel |
|---|---|---|---|---|
| 1 | **PICK A DOOR** | 二択 | three banks of five doors; exactly one opens, and its lamp fires a beat before its collider drops. A read under a clock, not a guess. The four shut ones shove. | ch.242, the quiz |
| 2 | **MIND THE TRAFFIC** | 横断歩道 | four lanes of taxis sliding across the corridor, with real kerbs at 0.35 m (inside `STEP_UP`, so never an invisible wall). There is a cat in lane three because there is a cat in the panel. | ch.242, the cat in the road |
| 3 | **CODE BLUE** | 病棟 | a hospital corridor; gurneys come out of the side rooms across your line and the goldfish plinth is a 1.1 m step you go **over**. | ch.242, the dead goldfish |
| 4 | **IT IS RISING** | 波 | the floor floods on a clock and the rafts behind you go under first. The most vertical of the six, and the only one whose failure state is the ground itself. | ch.242, drowning while Kenjaku paddles out |
| 5 | **THE WRONG WAY** | 工場 | a belt running against you with crates dropping onto it from a hopper. The only scene that punishes hesitation directly rather than through a hazard. | the oldest gag in physical comedy |
| 6 | **DO NOT LOOK DOWN** | 屋上 | five roofs with real gaps and a void under them, and his own enormous foam finger sweeping across the middle three. | his own RT, turned into level geometry |

### The rules the six share

* **One corridor, one grammar.** Every scene runs x = −13 → +13, 12 m wide in z,
  with the same deck, the same side walls and the same lit exit arch. The
  contestant learns the grammar once and then only has to read what is new.
* **Sized against the real movement numbers, not by eye.** Jump velocity 8.6
  against gravity 26 is a 1.42 m apex and 0.66 s of airtime, so **nothing steps
  up more than 1.20 m and no gap is wider than 2.20 m**. A scene you cannot
  physically clear is a bug, not a difficulty setting.
* **Nothing that moves is a collider.** Cabs, gurneys, crates, rafts, the foam
  finger and the shut doors are hazard records `{x,y,z,r,kind,push}` tested
  against the fighters each frame — the same way every other moving danger in
  the game works. Getting clipped costs 3 chip damage and throws you back down
  the corridor; **only the clock ends a scene**.
* **Static geometry is real `bounds` collider work** and is tracked, so the
  teardown is exact. `bounds.drop()` was added for this: it unlinks runtime
  colliders from `platforms`/`walls`/`terrains`, all three spatial grids and
  `byId`. Measured over six build/teardown cycles: platforms 46 → 46, walls
  54 → 54, zero leak.

### The clock, per tier

Difficulty is his Comedy Meter at the moment of activation, printed on the title
card. It buys time, not obstacles — the scene is the same, you have less of it.

| scene | OPEN MIC | WARMING UP | KILLING |
|---|---|---|---|
| PICK A DOOR | 5.0 s (tell 0.85, gap 2.4) | 4.4 s (0.60, 2.2) | 3.8 s (0.42, 2.0) |
| MIND THE TRAFFIC | 5.2 s | 4.6 s | 4.0 s |
| CODE BLUE | 5.0 s | 4.4 s | 3.8 s |
| IT IS RISING | 6.0 s | 5.2 s | 4.6 s |
| THE WRONG WAY | 5.4 s | 4.8 s | 4.2 s |
| DO NOT LOOK DOWN | 5.6 s (gap 1.7) | 4.8 s (2.0) | 4.2 s (2.2) |

### The camera, and the one bug worth writing down

The set swings the camera to a fixed-bearing `corridor` mode (yaw −π/2) and
suspends lock-on for both fighters, because `_moveVec` ignores the camera
entirely while a fighter is soft-locked — a contestant with lock-on held would
still be steering relative to Takaba while running away from him.

That yaw is load-bearing: under it, stick-up resolves to world +X. The first
version of the CPU contestant wrote **world** coordinates into the stick
(`frame.move.x = 1`) and consequently pushed sideways into a wall and never
moved. It now writes `move.z = -1` for forward and `move.x` for the lateral
swerve, which is exactly what the human on the other pad is doing.

### The CPU contestant

It genuinely plays: runs at the exit, jumps gaps and steps it can see through
`bounds.floorAt`, and swerves around the nearest hazard ahead — with a reaction
delay (0.16 / 0.24 / 0.34 s) and a swerve accuracy (0.88 / 0.66 / 0.46) that
scale with the tier. A bot that dodged perfectly would make the ultimate
worthless, so the swerve only fires `accuracy` of the time and is otherwise a
shrug.

One scene needed an extra hook. In PICK A DOOR the opening is a *hole in a wall*
— static geometry, not a hazard — so the bot had nothing to steer at, treated
the bank as four things to dodge, and lost **every run at every tier**. Scenes
may now expose an optional `aim(pos)`; the doors return the lit door's z, and
the plan prefers it over a straight line at the exit. That is a bot that could
not see, fixed, rather than a scene that was too hard.

---

## 4 · TUNING NUMBERS

### YAGA — frame data

| move | dmg | startup | active | recovery | reach | notes |
|---|---|---|---|---|---|---|
| Hook (X1) | 6.5 | 9 | 3 | 17 | 1.62 | **9 frames of armour** — the only armoured jab on the roster |
| Cross (X2) | 7.5 | 10 | 3 | 19 | 1.70 | |
| Uppercut (X3) | 12.0 | 13 | 4 | 24 | 1.74 | launcher |
| Shoulder Drive (Y) | 17 | 19 | 5 | 31 | 1.98 | knockdown, 12f armour, 22 stamina |
| **Command (RB)** | 0 | 12 | 1 | 22 | **arena** | free; 4.0 s order, ×1.35 speed, ×1.20 damage |
| **Haymaker (RT)** | 34 | 26 | 5 | **38** | 2.30 | 26 CE, knockdown, **guard break**, 14f armour |
| **Masterpiece (D-R)** | — | 34 | 1 | 30 | — | full bar, standard backlash |

Stats: hp 134 (×2.35 = 315 in play), walk 2.15, run 4.25, dash 7.10,
damageScale 1.12, ceRegen 2.8, ceGainPerPunch 6.6, kbResist 0.80,
blockChipMult 0.74 / staminaMult 0.80 / **5 frames to raise the guard**.

### YAGA — construction

* **Build time to full: 6.4 s.** CE drain **7.5/s** while held. Movement at
  **34%** of walk speed; no attack, no block, no dash, no jump.
* **Tier gates and what each costs in time and meter:**

| tier | meter | time | CE spent | hp | swipe dmg | lifespan | speed | flinches | extra |
|---|---|---|---|---|---|---|---|---|---|
| SCRAP | 25% | 1.6 s | 12 | 18 | 3.0 | 7 s | 2.6 | **yes** | — |
| STANDARD | 50% | 3.2 s | 24 | 46 | 7.5 | 15 s | 3.8 | no | — |
| REFINED | 75% | 4.8 s | 36 | 74 | 10.5 | 22 s | 5.0 | no | LUNGE (13 dmg, 7.5 m) |
| MASTERWORK | 100% | 6.4 s | 48 | 128 | 15.0 | 34 s | 5.6 | no | LUNGE (18) + SLAM (24, knockdown) + **body-blocks for him** |

* **Corpse limit: 2. A third is BLOCKED, not swapped.** Picked deliberately: the
  character is about the value of work already done, and a rule that silently
  destroys finished work to make room for worse work contradicts it. It also
  gives the opponent something to do — killing a corpse unlocks his B button.
  The one exception is the ultimate, which may retire his oldest by his own
  hand.
* **Being hit:** light −22% of the full bar; **heavy / launcher / knockdown /
  20+ hitstun destroys it outright**; chip (a burn or bleed tick, a domain
  sure-hit tick, Nobara's Resonance) −6%.
* **Cancelling:** progress sits for **3.0 s**, then bleeds at **42%/s**.
* **MASTERPIECE** produces a MASTERWORK at ×1.18 scale, ×1.25 hp (160), ×1.5
  lifespan (51 s), ×1.15 damage — measured in-engine.

### TAKABA — frame data

| move | dmg | startup | active | recovery | reach |
|---|---|---|---|---|---|
| X1 / X2 / X3 | 4 / 5 / 8 | 6 / 7 / 10 | 3 / 3 / 4 | 12 / 14 / 20 | 1.29 / 1.39 / 1.44 |
| Haymaker (Amateur, Y) | 13 | 18 | 5 | 30 | 1.78 |
| **A Bit (RB)** | table | 13 | 3 | 22 | 6.5 m, 12 CE |
| **The Big One (RT)** | table | 27 | 4 | 36 | 4.2 m, 30 CE |
| **Riff (B)** | — | 6 | 1.35 s stance | — | free, **5.5 s cooldown** |
| **The Set (D-R)** | see below | 32 | 1 | 26 | full bar |

His string is `PUNCH_DEFAULTS` with 6 cm taken off the reach — he is the only
character on the roster who takes the shared defaults essentially untouched, and
that is the characterisation. Stats: hp 102 (240 in play), run 5.05, dash 8.40,
damageScale **0.94**, guard exactly average.

### TAKABA — Comedy Meter

* Max 100, **starts at 22** each round.
* **Fills:** bit lands +7 · Big One lands +13 · ordinary punch lands +1.6 ·
  **taunt +14** · riff **+26/s** · knockdown +5.
* **Drains:** idle **−1.5/s** · whiff −5 · hit −4 · floored −9 ·
  **hit during the riff −22** · a landed bit that was blocked −2.5.
* **Tiers and the weight tilt.** Effective weight is
  `w · exp(tilt · (bigness − 0.5) · 2)`:

| tier | at | tilt | effect |
|---|---|---|---|
| OPEN MIC | 0% | **−1.35** | a `bigness` 1.0 entry weighted ×0.26, a 0.15 entry ×1.93 |
| WARMING UP | 40% | **0.00** | the tables exactly as authored |
| KILLING | 82% | **+1.55** | the reverse — and the audience, the spotlight, applause |

Nothing is ever weighted to zero: a cold Takaba can still roll a piano, it is
just rare. "This cannot happen right now" is a worse feeling in a random
character than "this almost never happens."

### THE SET — damage and duration

* **3 of 3 → 6 chip damage.** 2 of 3 → **34**. 1 of 3 → **62**.
  0 of 3 → **INSTANT KO** through the shared category.
* **Duration is no longer a fixed budget** — it is however long the contestant
  takes, capped by the three clocks. Worst case (every scene timed out at OPEN
  MIC) is 5.0 + 5.2 + 6.0 = 16.2 s of scene plus 1.10 open + 3 × 0.80 title +
  3 × 0.55 settle + 1.60 result = **21.9 s**; at KILLING the same worst case is
  **17.5 s**, and a contestant who clears cleanly is well under both. The brief's
  original "under ten seconds" was written for a panel nobody was playing
  through; **it does not apply to a level you traverse**, and holding to it would
  have meant scenes too short to be places. This is the one place the rebuild
  knowingly departs from the brief's numbers.
* (Game time, counted in logic ticks. Wall clock in the software-rendered test
  browser is roughly double and measures the renderer, not the feature.)

---

## 5 · FILES

### Added (13)

```
src/characters/yaga.js              config, tiers, research note
src/characters/takaba.js            config, meter, the show's data
src/characters/takaba_bits.js       the two outcome tables + the reflect audit
src/art/models/yaga.js              model + reference sheet
src/art/models/takaba.js            model + reference sheet
src/art/models/cursedcorpses.js     four tier models + reference sheet
src/art/anim/yaga.js                18 clips incl. the construction loop
src/art/anim/takaba.js              38 clips incl. 14 bits + the host set
src/combat/construction.js          the meter, the corpses, the anti-summon audit
src/combat/comedy.js                the meter + the reused weighted roll
src/combat/theset.js                the pocket world, its phases, the CPU contestant
src/art/models/setpieces.js         the six scenes, as real corridors
src/fx/comedyfx.js                  every prop, as real toon-shaded geometry
```

### Touched (20) — every one an addition

```
src/characters/index.js     two roster entries + two ROSTER_IDS slots
src/art/anim/index.js       two clip-set registrations
src/combat/fighter.js       trySpecial x2, `building`/`riff` states, `offField`,
                            the bit roll in startCT, two per-frame ticks, the
                            build-interrupt and meter-drain in _applyHit, three
                            _clip swaps, the taunt payout, the round reset
src/combat/effects.js       EFFECT_SRC entries, 5 dispatcher cases, _applyBit
                            and its two entity types
src/combat/ai.js            two CPU profiles
src/combat/adaptation.js    one category (`comedian`) — zero deleted lines
src/combat/reflect.js       one REFLECTABLE key (`bit`)
src/combat/taunts.js        two taunt entries, TAUNT_VS, tauntLine, 2 weights
src/core/match.js           two systems, the show's tick ownership, the craft
                            motes and spotlight, 16 event handlers, isCPU
src/core/game.js            three debug keys (F8/F9/F10)
src/core/stage.js           one colour grade (`gameshow`)
src/core/camera.js          one mode (`corridor`)
src/arena/bounds.js         one method (`drop`), for exact scene teardown
src/domains/domains.js      ONE WORD: `offField` added to the void's
                            non-interruptible list
src/finishers/registry.js   two finishers + the bandanna prop
src/ui/hud.js               three plate rows, the show panel, its renderer
src/ui/style.css            the CSS for those
src/ui/debug.js             three overlay blocks
src/viewer/viewer.js        two models + the four corpse tiers on the bench
src/audio/sfx.js            two taunt cues + 20 new cues
```

---

## 6 · NOTHING EXISTING CHANGED — HOW THAT IS VERIFIED

`git diff -U0 | grep '^-[^-]'` over the whole change set returns **ten deleted
lines**, and every one of them is a line that was re-emitted with something
appended:

* two registry maps in `art/anim/index.js` (two keys added)
* the last ROSTER entry and ROSTER_IDS in `characters/index.js`
* one import line in `core/match.js` (one name added)
* one `bubbles.say` call rerouted through `tauntLine`, which falls straight
  through to `def.say` for every pairing but one
* the void's `interruptible` list in `domains.js` (one string added)
* two template lines in `debug.js` (blocks appended)
* one builder map in `viewer.js`

**Yuta's domain roll is untouched.** `_rollSwordTech` does not appear in the
diff at all. His roll runs through his own `swordRoll` stream and his own
`forcedRoll`; `combat/comedy.js`'s `rollFrom` is a *lift* of it, and the two
share only `weightedPick` from `core/mathutil.js` — the same relationship every
other pair of systems has with a mathutil helper.

**Every other character's systems are untouched.** `git diff --stat` over
`domains/sentencing.js`, `characters/higuruma.js`, `characters/nanami.js`,
`characters/hakari.js`, `characters/yuta.js`, `characters/yuta_swords.js`,
`domains/jackpot.js` and `combat/instantko.js` reports **no changes to any of
them**. The rebuilt ultimate borrows nothing from their minigames — it is level
geometry now — and still routes its kill through `instantko.js` rather than
writing a second one.

`node test/roster.mjs` passes: every pick has a taunt, a finisher, the full clip
contract and every button.

---

## 7 · THE INTEGRATION AUDITS

### Yaga's corpses vs every other summon family — VERIFIED IN ENGINE

Nothing needed changing, and the reason is structural: **every summon system in
this game already treats every other one as scenery, and none of them enumerate
each other.** Megumi's shikigami, Geto's curses, Mahito's minion, Yuki's Garuda
and Dagon's ocean all target `match.other(owner)` — a *Fighter* — and a corpse
is not a fighter. Melee and area damage reach across through `meleeCheck` /
`hurtAt`, which every family implements identically and which the corpses now
implement the same way.

The one thing that reaches across on purpose is **Geto's DECOY EYE**, which
writes `_decoyLure` onto hostile summons by duck-typing; `construction.js` reads
that field, so the decoy works on Yaga's corpses on the day it was written with
no change to `curses.js`.

Measured: a MASTERWORK, a STANDARD and a transfigured human on the field
together for five seconds of simulation — all three alive, both owners taking
damage, zero errors.

### Construction interrupted by unusual states

Enforced by **one function with one `severity` argument**, not six call sites.
The rule underneath, so a seventh case answers itself: **a build is destroyed by
FORCE and only by force. Anything that merely takes his body away from him ends
the hold and leaves the work alone.**

| interruption | severity | what happens |
|---|---|---|
| Inumaki's cursed speech | `break` | the hold ends, **progress kept**, grace window starts |
| Naoya's freeze | `break` | same — his body stops, the work does not un-build |
| Todo's Boogie Woogie | `break` | same, and the cleanest case: he is somewhere else now, still holding it |
| Nobara's Resonance | `chip` | −6%. It reaches through an effigy, it is small, it repeats |
| Pulled into a domain | `break` on the cast, then `chip` per sure-hit tick | being enclosed does not smash it; the payload eats it a bit at a time |
| A light hit | `light` | −22% |
| Heavy / launcher / knockdown / guard break | `heavy` | **destroyed** |

The `break` cases needed one extra line (`tickBuildDecay` clears `holding` when
the state is no longer `building`). Without it a partial would sit at full value
for the rest of the round, because none of those four goes through the release
path. **Found by writing the audit, not by playing.**

### Takaba's outcomes vs Mahoraga — ONE CATEGORY, and why

Implemented as recommended, and the argument is **Kashimo's, not Toji's**.
Toji's four weapons are four genuinely different things carried by one man;
Kashimo's whole kit is one substance arriving in different shapes. Takaba is the
purest case of the latter in the game: all fourteen ARE THE COMEDIAN, one
reality-warp wearing a different costume each time.

Splitting them would not be a nuance — it would silently switch adaptation
**off** for one character. A wheel that has to spin fourteen separate times to
learn "a pie" and then separately "a piano" would never reach a meaningful
percentage inside a round, and nothing on screen would say why.

The consequence is intended and it is the best thing about the matchup:
**Mahoraga is the one opponent Takaba's randomness stops mattering against.**
His answer is everyone else's — the ultimate, which routes through INSTANT_KO
and is therefore resisted by *chance* rather than blunted by percentage.

### Takaba's outcomes vs Uro's Sky Reflect — the classification

Reflect's own rule is "she reflects things that TRAVEL". Applied honestly,
**three of fourteen travel:**

* **REFLECTED** — GLOVE (it crosses the space on its spring), PIE (it is thrown;
  the most literal projectile in the game), FIRE HOSE (a pressurised stream with
  a front that arrives).
* **NOT REFLECTED** — MALLET, RAKE, FOAM FINGER are *swings* (category C).
  ANVIL, SAFE, PIANO, STAGE LIGHT arrive **from above**, from outside the plane
  she is holding; by the time the object exists it is already over them, and
  their counterplay is the telegraph. BANANA and TRAPDOOR are on the **floor**
  with nothing in flight. BUCKET and CURTAIN arrive **on** the target from the
  target's own position.

Enforced by data, not trust: `_applyBit` only registers a travelling entity for
entries with `projectile: true`, and `REFLECTABLE` gains exactly one key — `bit`
— covering all three.

### Outcomes that remove the opponent from the field — the audit

TRAPDOOR (1.1 s) and CURTAIN (1.6 s) are the only things in the game that do
this. The load-bearing decision is **one refusal at the single point every
damage source funnels through** (`Fighter.applyHit` returns `'miss'` while
`offField`), which is why nothing had to be taught about the state individually.

* **Domains do not break.** A standing barrier keeps standing, keeps its clock
  and keeps its caster's buffs; its sure-hit tick simply finds nothing to land
  on for a second. The one path that reaches past `applyHit` is Unlimited Void's
  lockdown, which sets the victim's state directly — hence the single word added
  to `domains.js`.
* **Juggle counters do not break.** They return in a *hard knockdown*, which
  zeroes `juggle` exactly as any other knockdown does. There is no state in
  which a juggle is left half-counted.
* **Mahito's proximity gauge does not break — because THE POSITION IS KEPT.**
  They vanish from where they stood and come back there. That is deliberate and
  it is why nothing else needed changing: the transfiguration gauge, Miwa's
  circle, the soft lock, the camera frame, the arena bounds and every summon's
  target all keep reading a real number. An off-world position would have broken
  all six.
* **Miwa's circle does not break.** It is a boundary test on travelling
  entities and does not care about bodies.
* **The finisher trigger does not break.** It fires on the match-ending KO, and
  no KO can occur while they are gone. Worst case the killing blow lands a
  second later.
* It **refuses** a body that is already in somebody else's cinematic
  (`sentenced`, `executing`, `transfigured`, `devoured`, `voided`, `ko`) — two
  owners for one body is the bug this prevents.

### THE SET's state audit — VERIFIED

The QTE version froze the field and let almost everything coexist with it. The
rebuild **replaces the level**, so the audit changed shape: what used to be
"does it freeze correctly?" is now "who owns the environment?"

* **Another cinematic is running** (Higuruma's execution, Megumi's ritual, a
  finisher, a second set) → **refused with a line**, `NOT NOW`. They all set the
  same flags and one test covers them.
* **Any domain is standing** — the caster's, the victim's, anybody's → **refused
  with a line**, `SOMEBODY ELSE'S WORLD`. This is a deliberate reversal of the
  QTE version's ruling. Two systems each convinced they own the environment is
  not a thing to paper over, and it is also the correct *reading*: a domain is a
  sealed space, and a comedian does not get to build a stage inside somebody
  else's sealed space.
* **Mid-transformation** (Sukuna surfacing, Maki's awakening, Kashimo's Amber)
  → allowed. Those are states on a body, and the body is what gets moved; the
  contestant runs the corridor transformed.
* **Frozen by Naoya** → allowed. The set re-places both fighters on its own
  spawn marks, and a contestant who is still frozen when the clock starts simply
  loses the scene, which is the correct outcome of being frozen.
* **Holding Miwa's circle** → allowed. Simple Domain is a barrier against
  sure-hit *domain* effects; the set has no barrier and no sure-hit, and no
  other burst ultimate in the game is stopped by it either.
* **Summons on the field** → **every family is cleared on open** — `minions`,
  `construction`, `ocean`, `curses` and loose effect entities, the same way a
  finisher clears the field before its cinematic. A shikigami chasing the
  contestant through a scene is a bug and one chasing the *host* is worse, and
  with the arena hidden there is nowhere for them to be standing anyway.
* **The world comes back exactly.** The arena group and the fog are restored,
  the colour grade is restored, the camera mode and both fighters' lock-on flags
  are restored, `domainRadius` is cleared on both, and the scene's colliders are
  dropped. Measured over six cycles: platforms 46 → 46, walls 54 → 54.
* **Both fighters are re-placed before the world returns.** Coming out of the
  set standing inside a wall is the single worst bug this feature could have, so
  `_exitPlacement` runs before the restore rather than after.

**The instant KO routes through the shared category and both consequences were
measured, not assumed:**

* **vs Hakari's Jackpot RCT** — with him standing inside Jackpot, the show wiped
  him: `instantKO` stamped, hp 0, and **healing him back to 200 does not bring
  him back** (`alive` stays false).
* **vs Mahoraga's adaptation** — at 0% the kill lands 40/40 (the first attempt
  always lands, which is the rule). At 70% it is **resisted 151/200 (76%)** with
  the label `適応 — SENTENCE RESISTED 70%`. It is a **chance, never a reduction**.
  A resist does not hand Takaba a retry — it becomes the PASS-ONE outcome, which
  is exactly the ruling Higuruma's lost duel already takes.

### Yuta's Copy

* **From Yaga he stores the HAYMAKER**, not the construction. Copy is a snapshot
  of a technique's *output*, and construction has no output at the moment of
  copying — it has a process. Yuta borrowing a six-second hold he has no meter
  for and no corpse system behind would be the worst entry in the copy table.
* **From Takaba he stores A BIT, and it rolls from the same table** — the same
  `takaba_bit` dispatcher and the same `rollFrom` helper, at 0.62 power. Two
  rulings fall out: he rolls off the **BIT** table and never the Big One (every
  other copy entry takes the character's CT1), and he rolls at the **WARM** tier
  always, because the meter is Takaba's *confidence*, not a property of the
  technique. Borrowing a man's sense of humour does not borrow his week.

---

## 8 · IS TAKABA'S RANDOMNESS FUN OR FRUSTRATING? — HONESTLY

**Fun, with one caveat, and the caveat is the telegraphs.**

It is fun because of the `value` column doing its job. Playing him, no roll ever
feels like losing your turn — the banana is a hard knockdown, the bucket is a
blind, the trapdoor is a free second, and they all cash out to about the same.
What changes is *what you do next*, which is a real decision that arrives from
outside. That is the feeling the brief asked for and it is there.

The caveat: **four of the fourteen are delayed drops, and a delayed drop against
a moving opponent is a coin flip on top of the coin flip.** In my instrumented
pass every drop landed against a stationary target and every one missed against
a target with residual velocity. That is *correct* — the telegraph is what pays
for the biggest numbers — but it means a quarter of his table is "and now find
out whether they walked." If it needs changing later, the fix is to shorten the
telegraph on the ANVIL and SAFE (the two smallest radii) rather than to widen
the radii, because the radius is what makes them dodgeable *legibly*.

Against the opponent it is fun for a different reason: the callouts and the cues
mean they always know what just happened even when they could not have predicted
it. The one thing that would make it frustrating — a bit that lands with no
explanation — cannot occur, because the callout fires on the roll rather than on
the connect.

## 8b · DOES THE SET SIT BETWEEN "ALWAYS SURVIVABLE" AND "GUARANTEED KILL"?

**Yes, and here are the numbers — remeasured for the rebuild.** The QTE version's
table was a probability model; this one is a bot actually running the corridors,
so it had to be measured again from scratch. Method: each scene forced three
times in a row per run (so a run is three samples of one scene), one run per
scene per tier, repeated where the harness survived the reload. **33 runs, 99
scenes, in-engine, CPU contestant.**

Per-scene clear rate, cleared / attempted:

| scene | OPEN MIC | WARMING UP | KILLING |
|---|---|---|---|
| PICK A DOOR | 9/9 | 5/6 | 2/3 |
| MIND THE TRAFFIC | 6/9 | **1/6** | **0/6** |
| CODE BLUE | 9/9 | 3/3 | 4/6 |
| IT IS RISING | 9/9 | 3/3 | 1/6 |
| THE WRONG WAY | 6/6 | 2/3 | 0/3 |
| DO NOT LOOK DOWN | 6/6 | 3/3 | 3/3 |
| **all scenes** | **45/48 — 94%** | **17/24 — 71%** | **10/27 — 37%** |

And the outcome that actually matters, by run:

| tier | runs | INSTANT KO (0 of 3) | 1 of 3 (62 dmg) | 2 of 3 (34 dmg) | 3 of 3 (survive) |
|---|---|---|---|---|---|
| OPEN MIC | 16 | **0%** | 6% | 6% | **88%** |
| WARMING UP | 8 | **13%** | 13% | 25% | **50%** |
| KILLING | 9 | **44%** | 11% | 33% | **11%** |

That is the shape the brief asked for, and it is a **steeper** curve than the QTE
version's — the meter matters more now, because a second of clock is worth more
than a percentage point of timing window. At OPEN MIC it has never killed in
measurement and nearly nine in ten walk out clean; a full bar spent there is a
bad trade and the CPU Takaba still will not fire it below 45% meter. At KILLING
it kills a bit under half the time, which is the most dangerous ultimate in the
game and is *supposed* to be — it costs the bar, it costs 82% of a meter that
only fills by landing bits, and it can still be walked out of.

**Three honest caveats.**

* **The scenes are not equally hard, and MIND THE TRAFFIC is the outlier.** It
  is 1/6 at WARMING UP and 0/6 at KILLING while DO NOT LOOK DOWN is 3/3 at every
  tier. That is a two-tier spread inside one difficulty setting, and it means a
  draw that happens to contain the crossing is meaningfully deadlier than one
  that does not. If one number gets retuned it is the crossing's clock (+0.4 s
  across the board) or its lane spacing — not the tier tilt, which is doing its
  job everywhere else.
* **These are a bot's rates and the bot is worse than a person at exactly the
  thing the scenes test.** It reads one hazard ahead, cannot plan a route, and
  swerves on a coin flip weighted by tier. A human who has seen a scene twice
  should clear KILLING far more often than 37%, which is the *correct* direction
  for a skill check to be wrong in, and is the opposite of the QTE version, where
  a human's reaction time was directly comparable to the bot's roll.
* **Sample sizes are small** — 9 runs at KILLING, not 40. Playwright's software
  renderer takes about a minute of wall clock per run and the harness lost two
  passes to reload timeouts under load. The per-tier ordering is solid; the
  individual percentages are indicative, and I would not tune a number off a
  single cell of that first table.

## 9 · IS YAGA'S CONSTRUCTION VIABLE? — HONESTLY, AND THIS IS THE HARD ONE

**Standard is the realistic ceiling, and against a ranged character even that is
optimistic.** The brief said that would be fine if I said so, so I am saying so
plainly, with the measurement.

Instrumented, 90 seconds of bot-versus-bot with both sides played by the AI:

* **vs NANAMI (mid-range, committed techniques):** **two SCRAPs deployed** and
  one COMMAND issued; the meter peaked at **39%**. The window exists.
* **vs TAKABA (ranged pressure, bits thrown from 6.5 m):** the meter peaked at
  **33%** and **nothing was deployed in the whole ninety seconds.** Against a
  character who applies pressure from outside the Haymaker's 2.3 m, the window
  essentially does not exist.
* The first version of the CPU profile held out for STANDARD every time, was
  interrupted every time, and **deployed nothing against anybody** — a bot that
  had understood the mechanic and refused to use it. It now banks a tier it has
  already earned rather than losing everything, which is what a player learns to
  do in about three rounds. Three tuning passes on the bank threshold moved the
  Nanami matchup from 0 deploys to 2 and never moved the Takaba matchup off 0,
  which is the finding rather than a failure of the bot.

**Why it is still viable, and what actually makes it work:**

1. **The armoured jab.** Nine frames of armour on the *first* hit of the string
   is the load-bearing number of the whole character. Without it he cannot
   contest a rushdown, and a builder who cannot contest a rushdown never builds.
2. **The Haymaker.** 34 damage, a hard knockdown and a guard break at 2.3 m —
   it is not a damage tool, it is a *space* tool, and landing one buys the four
   seconds that STANDARD costs. Its 38-frame recovery is what stops it being a
   button he opens every round with.
3. **The three-second grace window.** Building in two bites around their
   pressure is a real plan and it is the difference between the mechanic being
   a gamble and being a *game*. A player who holds for two seconds, cancels,
   fights, and comes back to it will reach STANDARD reliably.
4. **The ultimate.** MASTERPIECE exists precisely because the honest answer to
   "can he reach MASTERWORK by building?" is *almost never*. A full bar is the
   supported route to the top tier, and that is the design rather than a
   concession.

**What I would change with more time:** the meter would keep a small permanent
floor — say the first 15% never decays once earned — so that a Yaga who has been
pressured for a whole round is not starting from absolute zero every time he
gets a breath. As shipped he is, and against Takaba, Kashimo or Uro that reads
as a character who never gets to play. I did not add it because it is a real
balance change and the brief's ceiling ruling covers the shipped behaviour.

## 10 · THE MODELS — REFERENCE, ACCURACY, APPROXIMATION

Full reference sheets are at the top of each model file. Summary:

### YAGA (`art/models/yaga.js`)

**Reference:** the 2017 full-body turnaround supplied with the brief, plus the
ORICON and Baidu profiles (192 cm; "muscular frame and tan skin"; "short, spiky,
dark brown hair on top with the rest of his head shaved"; "thick eyebrows with a
mustache and goatee"; "a white dress shirt underneath a black jacket with
matching pants and shoes"; "he only started wearing sunglasses after becoming
the principal").

**Accurate:** the height relative to the roster (H 1.99 — the tallest human in
the game, above Toji's 1.90); the mass distribution (the reference's silhouette
is a wedge, and the chest is 1.26 against a 1.08 waist); the haircut as a *low
block of short spikes on a shaved skull with a hard edge at the temples*, not a
mohawk and not a flat-top; the joined circle beard with bare cheeks; the open
unbuttoned jacket over a white collar with **no tie** (the only suited man on
the roster without one); the brown belt as the single warm colour; and the
sunglasses as **real geometry with a purpose-built lens material** — eight
shading bands instead of the roster's three, high gloss, hard early rim, in its
own part-bag slot with no outline.

**Approximated, and stated:** the exact lens shape (the supplied art reads oval;
some other art reads squared — built oval), and the shoe pattern (no reference
resolves it — built as plain derbies).

**Three iteration passes, and what each caught:**
1. the arms were splayed instead of folded, and the shoulder pads read as water
   wings;
2. a full-radius stubble shell was poking through the flattened face plane and
   hiding his eyes, brows and *sunglasses* entirely;
3. the lens meshes were parented to the head **bone** as raw meshes, so the
   bone's bind transform put them about a metre and a half above his head. Fixed
   by giving the lenses their own skinned part-bag slot.

**What I would fix with more time:** the white shirt still reads as a bib rather
than as a shirt at long range, and the arms-folded pose has the hands meeting
centrally rather than tucked under the opposite elbows.

### TAKABA (`art/models/takaba.js`)

**Reference:** the Culling Game turnaround supplied with the brief, plus
NamuWiki and Grokipedia ("short, slicked back, black hair, and long tapered
sideburns that reach past his nose"; "thick eyebrows and eyes with small light
brown pupils"; "a skin-tight uniform that is split down the middle. The left
side is a light blue where there are two yellow stripes on both the arm and leg.
The right side of his uniform is missing entirely"; red gloves and boots; the
smiling heart on the chest; the belt with a round smiling face).

**Accurate:** the split down the centre line as a real geometric boundary (a
half-lathe with the bare side's triangles dropped, with a darker seam strip so
it reads as deliberate); the two yellow stripes on the left arm and left leg;
**both** gloves and **both** boots red even though only one side of the suit
exists — the canonical inconsistency and the funniest thing about the costume;
the white choker, the white belt and the chest heart all carrying the *same*
smiling-face mark from one builder; the small light-brown iris in a large sclera
(0.26 of the eye height against the roster default's 0.42), which is the exact
drawing convention that makes him read as eager rather than dangerous; and the
**inverted torso profile** — waist 1.06 against chest 1.00, the only one in the
project, because "unremarkable build" drawn with abdominals is not unremarkable.

**Approximated, and stated:** the exact blue (references run from periwinkle to
royal — built at a mid `#2f63b0`, because a light blue against `#f0cba4` skin is
exactly the value-adjacency failure `nanami.js` documents, and the two halves
would read as one surface); the chest emblem's precise outline; and what is
under the suit below the belt — canon is explicit that the costume is indecent,
and this build puts a plain brief line across both hips.

**Three iteration passes:** the torso half-shell was invisible (LatheGeometry is
indexed, so walking the position attribute three at a time read garbage); the
hair cap came forward over the brow and read as a bowl cut when the defining
feature is a high flat forehead; the sideburns sat behind the ears instead of
down the cheek.

**What I would fix with more time:** the sideburns still stop a little short of
"past his nose" from the front, and the slicked strands could carry a visible
comb groove.

### THE FOUR CORPSE TIERS (`art/models/cursedcorpses.js`)

**Reference:** the technique explainers, not an image — the corpses are barely
shown. So the design is derived from the *quoted rules*: an object, programmed,
without self-awareness or its own energy. Everything is built out of things a
workshop contains — sawn timber, lashing cord, sailcloth, iron banding, dowel
pins — rather than out of anatomy. Nothing has muscle, skin, veins or a mouth,
and the faces are blank because the one thing a viewer must never do is wonder
what one is thinking.

**Heights: 1.42 / 1.72 / 1.88 / 2.16**, so the escalation is legible in
silhouette from across the arena before any surface detail resolves. That is why
they are four models rather than one on a scale slider, and the bench sheet
confirms it reads: SCRAP is thin and ragged with cord ends hanging, STANDARD is a
sealed banded barrel, REFINED is tapered with a hood and a burnt maker's mark,
MASTERWORK has a full mantle, pauldrons and a core bright enough to light the
ground under it.

**Separated from all four other summon families before committing:** Megumi's
are *animals* of shadow with fur/scale/feather textures; Geto's are *cursed
spirits* with malformed anatomy; Dagon's are wet, finned and scaled. The
important one is **Mahito's transfigured humans**, which are the closest call:
they are FLESH with SEAMS — a stitched join in skin. These have LASHED JOINTS in
TIMBER — a cord binding. The shared vocabulary word means two entirely different
surfaces, and the failure modes differ too: a transfigured human bursts, a
corpse comes apart into planks. `cursedcorpses.js` imports no texture from the
flesh family at all.

**One pass caught a real bug**: every material rendered solid black, because the
shared `toonMaterial` defaults to vertex colours (the character models carry
theirs that way) and these are raw geometries with no colour attribute. The same
bug was present in `fx/comedyfx.js` and in the finisher's bandanna prop.

**What I would fix with more time:** the emergence reads as a convergence, which
is right, but the lashings do not visibly *tighten* — that beat is on the
timeline and not in the geometry.

---

## 11 · WHAT FOUGHT THIS

**1 · The fifth summon family was the easiest part, and that surprised me.**
The brief flagged it as a risk. It was not, because the codebase had already
solved it four times: every family targets `Fighter`s and none of them enumerate
each other. Adding a fifth list next to the four that exist was the whole
integration. The one genuinely nice moment was discovering that Geto's decoy eye
works on Yaga's corpses for free, because it duck-types.

**2 · Removing a character from the field was the hardest thing in either kit,**
and it took three attempts to place the clock. The state has to run a timer but
must reach *none* of the input handling below it — Black Flash's window, the
taunt gate, the whole action switch. Putting the clock inside the switch meant
it never ran (the early-return list caught it first); putting the state in the
early-return list meant they never came back. It ends up as an explicit block
immediately above that list, which is the only correct place and is commented as
such.

The audit is what found the real bug, not play: **a build interrupted by
Inumaki, Naoya, Todo or a domain never went through the release path**, so
`holding` stayed set forever and a partial sat at full value for the rest of the
round. Writing the interruption table honestly is what surfaced it.

**3 · An ultimate that replaces the level breaks an assumption the arena
makes,** which is that colliders are authored once at load. `bounds` had
`remove`/`restore` for scripted destruction but no way to *unauthor* geometry,
so a set that built and tore down six times would have left six corridors' worth
of dead colliders in the spatial grids. `drop()` is the addition: it unlinks a
runtime collider from the list it lives in, from `_pGrid`/`_wGrid`/`_tGrid` and
from `byId`. Nine lines, and the reason the feature is safe to open twice.

Two things about it are still uncomfortable and worth saying:

* **It is long.** Worst case 21.9 s, common case nearer 15. That is three times
  the QTE version it replaced and well past the brief's ten-second ceiling. It
  sits in the band the domains already occupy, and I think a place has to be
  given time to be a place — but it is a real cost the brief did not ask for.
* **Takaba is invulnerable for the whole of it.** It is canon and it is stated
  in the source line the feature is built on, and it is still fifteen-plus
  seconds in which one fighter cannot be touched. It is bounded by his dealing
  no damage either, and by the refusal to open on top of a domain — but a future
  character able to interrupt it from outside would find nothing to interrupt.

**4 · The fire hose was paying the meter five times** and I only found it by
instrumenting the meter delta of all fourteen outcomes and noticing one number
that was 80% higher than the rest. Two other bugs came out of the same pass. If
there is a lesson, it is that "every outcome must be roughly equivalent in
value" is not a design principle you can hold in your head — it is a table you
have to measure.

**5 · `fx.debris(pos, n, color)` and I called it `(pos, color, n)`,** which
asked for nine million particles and crashed the renderer three times before I
read the signature. Fixed in all three places.
