# YAGA MASAMICHI & TAKABA FUMIHIKO — delivery notes

Two new playable characters. Nothing about an existing character's behaviour
changed; every edit to an existing file is an addition, and the four reused
minigame implementations plus Yuta's domain roll are byte-identical.

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

## 3 · THE SIX MINIGAMES AND THEIR TIMING WINDOWS

Difficulty tier = Takaba's Comedy Meter *at the moment of activation*, shown on
the title card.

| # | game | staging | reused from | OPEN MIC | WARMING UP | KILLING |
|---|---|---|---|---|---|---|
| 1 | **TIMING BAR** — stop the marker in the green | prize wheel | **Nanami's 7:3 sweep** | 2.00 s limit, 1.05 s sweep, window **±11.5%** | 1.85 s, 0.82 s sweep, **±8.0%** | 1.70 s, 0.62 s sweep, **±5.5%** |
| 2 | **BUTTON SEQUENCE** — in order, no mistakes | quiz podium | **Higuruma's execution duel** | 2.00 s, **3** inputs, wrong = −0.45 s | 1.95 s, **4**, −0.55 s | 1.90 s, **5**, −0.70 s |
| 3 | **MASH** — fill the bar | dunk tank | **the barrier-break / duel mash** | 2.00 s, **14** presses, cap 12/s | 1.90 s, **19**, cap 12/s | 1.80 s, **23**, cap 12/s |
| 4 | **SIMON SAYS** — repeat it back | conveyor belt | *new* | 2.00 s, **3** shown for 0.85 s | 2.00 s, **4**, 0.80 s | 1.95 s, **5**, 0.72 s |
| 5 | **QUICK DRAW** — don't jump the gun | buzzer round | **Hakari's reach**, in shape | cue at 0.55–1.10 s, **0.62 s** to react | 0.55–1.30 s, **0.46 s** | 0.60–1.45 s, **0.34 s** |
| 6 | **DIRECTION DODGE** — match the arrows | arrow belt | *new* | 1.95 s, **3** arrows, deadzone 0.55 | 1.95 s, **4**, 0.60 | 1.85 s, **5**, 0.66 |

Notes on the four lifts — the logic is genuinely the original's, reimplemented
against this feature's own state object rather than by calling into it:

* the **timing bar** is `|pos − mark| ≤ window`, exactly Nanami's
  `_ratioResolve`, with `mark` randomised per round instead of pinned at 0.7;
* the **button sequence** keeps Higuruma's no-two-in-a-row generation, his
  "one press per tick so a two-button mash cannot skip ahead" break, and his
  rule that a wrong press costs *time* rather than the round;
* the **mash** keeps the per-second budget (`capPerSec`) that is the whole
  reason the original exists in the shape it does — a turbo controller cannot
  delete the challenge;
* **QUICK DRAW** is Hakari's reach *in shape*: one committed input at a moment
  you do not choose, where going early loses.

Two are new because the brief asks for six and the game contains four. Both are
built out of the same pieces (a prompt list, an input edge, a per-round clock).

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
| **The Game Show (D-R)** | see below | 32 | 1 | 26 | full bar |

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

### THE GAME SHOW — damage and duration

* **Pass 3 → 6 chip damage.** Pass 2 → **34**. Pass 1 → **62**.
  Pass 0 → **INSTANT KO** through the shared category.
* **Duration, measured in-engine over 120 shows: average 7.6–7.9 s, worst case
  8.65 s**, including the opening card, three title cards, three rounds, the
  settles and the result. Under ten, as briefed. (Wall-clock in the software-
  rendered test browser is roughly double; the figures above are game time,
  counted in logic ticks, because a stopwatch there measures the renderer.)
* Budget: opening card 0.60 · per round (title 0.50 + play ≤2.00 + settle 0.22)
  · result 1.45.

---

## 5 · FILES

### Added (12)

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
src/combat/gameshow.js              the six minigames and the sequence
src/fx/comedyfx.js                  every prop, as real toon-shaded geometry
```

### Touched (18) — every one an addition

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

**The four reused minigames are untouched.** `git diff --stat` over
`domains/sentencing.js`, `characters/higuruma.js`, `characters/nanami.js`,
`characters/hakari.js`, `characters/yuta.js`, `characters/yuta_swords.js`,
`domains/jackpot.js` and `combat/instantko.js` reports **no changes to any of
them**. `gameshow.js` reimplements their logic against its own state; it does
not call into them.

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

### The Game Show's state audit — VERIFIED

* **Another cinematic is running** → refused with a line. One test covers
  Higuruma's execution, Megumi's ritual, a finisher and a second Game Show,
  because they all set the same flags.
* **Mid-domain** → allowed, and **the domain stays up**. The show suspends the
  systems that tick it rather than collapsing it; it resumes on the frame the
  show ends. A domain the opponent paid for is not deleted by a minigame.
* **Mid-transformation** (Sukuna surfacing, Maki's awakening, Kashimo's Amber)
  → allowed; those are states with timers and the timers freeze with everything
  else.
* **Frozen by Naoya** → allowed, and the freeze is subsumed. They were not going
  to act either way.
* **Holding Miwa's circle** → allowed. Simple Domain is a barrier against
  sure-hit *domain* effects; the Game Show is a burst ultimate, and no other
  burst ultimate in the game is stopped by it either.
* **Summons on the field** → allowed, and they freeze too. A contestant whose
  shikigami keeps hitting the host during the quiz is a bug; one whose shikigami
  keeps hitting *them* is worse.

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

## 8b · DOES THE GAME SHOW SIT BETWEEN "ALWAYS SURVIVABLE" AND "GUARANTEED KILL"?

**Yes, and here are the numbers.** 40 sampled shows per tier, CPU contestant,
in-engine, as [fail all three / pass 1 / pass 2 / pass 3]:

| tier | INSTANT KO | pass 1 (62 dmg) | pass 2 (34 dmg) | pass 3 (survive) |
|---|---|---|---|---|
| OPEN MIC | **5%** | 5% | 40% | **50%** |
| WARMING UP | **7.5%** | 32.5% | 35% | **25%** |
| KILLING | **22.5%** | 40% | 20% | **17.5%** |

That is the shape asked for at both ends. At OPEN MIC it kills one time in
twenty and half the contestants walk away clean — a full bar spent on the
easiest version of the challenge is a bad trade, which is why the CPU Takaba
will not fire it below 45% meter. At KILLING it kills better than one time in
five and only one contestant in six is clean — genuinely dangerous, and still
not a guarantee.

**The one thing I could not measure is a human.** These are the CPU contestant's
rates, driven by `cpuBase 0.72` with per-tier modifiers, and the *human* windows
are the table in section 3. My honest expectation from the window sizes is that
a focused human clears OPEN MIC nearly every time and clears KILLING maybe one
show in four — i.e. the human curve is shifted one tier easier than the CPU's.
If that turns out to be too easy in play, the dial to turn is the **KILLING**
column only: the timing bar's ±5.5% window and the quick draw's 0.34 s reaction
are the two that would bite first.

## 9 · IS YAGA'S CONSTRUCTION VIABLE? — HONESTLY, AND THIS IS THE HARD ONE

**Standard is the realistic ceiling, and against a ranged character even that is
optimistic.** The brief said that would be fine if I said so, so I am saying so
plainly, with the measurement.

Instrumented, 90 seconds of bot-versus-bot with both sides played by the AI:

* **vs TAKABA (ranged pressure, bits from 6.5 m):** the highest the meter ever
  reached was **29%** and exactly **one SCRAP** was deployed in the whole match.
  Against a character who applies pressure from outside the Haymaker's 2.3 m,
  the window essentially does not exist.
* The first version of the CPU profile held out for STANDARD every time, was
  interrupted every time, and **deployed nothing at all** — a bot that had
  understood the mechanic and refused to use it. It now banks a SCRAP rather
  than losing everything, which is what a player learns to do in about three
  rounds.

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

**3 · An ultimate that hands control to the opponent breaks an assumption the
whole engine makes,** which is that a fighter's input drives that fighter. The
Game Show has to read the *victim's* real frame while handing both fighters a
neutral one. Doing that inside the fighters would have meant teaching the state
machine about a contest; it is done in `match._logicTick` instead, which is
where Higuruma's duel already established the pattern.

Two things about it are still uncomfortable and worth saying:

* **It is the only move in the game a player can lose to by being bad at
  something that is not the fighting game.** That is the brief's intent and I
  think it lands, but it is a genuinely different skill and a player who is good
  at neutral and bad at reaction tests will feel robbed the first time.
* **Freezing "everything" is a claim, not a fact**, and the honest version is
  that it freezes everything *the systems inside the fight block tick*. I
  audited the six states the brief names and each one holds, but a future system
  ticked outside that block would not be covered by anything structural. The
  audit is in `gameshow.js` so the next person has a list.

**4 · The fire hose was paying the meter five times** and I only found it by
instrumenting the meter delta of all fourteen outcomes and noticing one number
that was 80% higher than the rest. Two other bugs came out of the same pass. If
there is a lesson, it is that "every outcome must be roughly equivalent in
value" is not a design principle you can hold in your head — it is a table you
have to measure.

**5 · `fx.debris(pos, n, color)` and I called it `(pos, color, n)`,** which
asked for nine million particles and crashed the renderer three times before I
read the signature. Fixed in all three places.
