# JUJUTSU BATTLEGROUNDS

A 3D anime arena brawler in the browser — a Jujutsu Kaisen: Cursed Clash-style
1v1 fighter. **Every visual and sound effect is procedural**: models, rigs,
animations, VFX, textures (canvas-generated), and all SFX (Web Audio
synthesis). No external media except the background music tracks — see
[Music](#music).

## Run it

**Easiest — the launcher.** Double-click **`play.cmd`** (Windows) or run
**`./play.sh`** (macOS/Linux). It checks for Node, installs dependencies on
first run, starts the dev server and opens your browser. If a server is
already listening on 5173 it just opens a tab instead of erroring on the
busy port.

```bash
play.cmd
```

**Or with npm** — one command, same result:

```bash
npm start
```

First run only, if you skipped the launcher:

```bash
npm install
```

Either way the game is at **http://localhost:5173** — mode select → character
select → **stage select** → fight → KO → rematch. **Local 2-player VS is the
default mode**; VS CPU is the second option. (`npm run dev` is the same server
without the browser auto-open.)

Model viewer (turntable + clip switching): **http://localhost:5173/#viewer**

Workbench (look at one system without playing to it):
**http://localhost:5173/workbench/?edit=finishers** — pick a winner, a loser, a
location and, if you want a specific one, the finisher itself; press **SHOW
FINISHER** and the cutscene plays full screen and hands the page back when it
is done. **Esc** returns early. It runs the shipped director against a real
match on a real map, so what you see there is what the game plays. `?edit=`
selects the bench; `finishers` is the default and currently the only one.

Visitor stats (who is playing, and from where):
**http://localhost:5173/stats/** — a live dashboard over the anonymous visit
rows the game writes. Off in a dev build unless you add `?stats=1`. See
[docs/stats.md](docs/stats.md) for what is collected and what is not.

Production build / preview:

```bash
npm run build
npm run preview
```

Runs fully offline after `npm install`.

## Controls (Xbox layout · P1 keys · P2 keys)

Device assignment is automatic and hot-pluggable: two pads → pad 1 = P1,
pad 2 = P2; one pad → pad = P1, keyboard = P2 (either key set works);
no pads → the keyboard splits as below.

The left stick is **character-relative**: up/down advances and retreats along
the line to your opponent, left/right strafes around them. It never rotates
you — the soft lock keeps you facing the opponent at all times.

| Input | Action | P1 keys | P2 keys |
| --- | --- | --- | --- |
| Left stick ↑↓ | Advance / retreat | W, S | ↑, ↓ |
| Left stick ←→ | Strafe around the opponent | A, D | ←, → |
| Right stick | Camera orbit | Arrows (vs CPU) | — |
| A | Jump | Space | Right Shift |
| X | Punch — 3-hit string, 3rd launches | J | ; |
| RB | Cursed Technique 1 | U | [ |
| RT | Cursed Technique 2 | I | ] |
| LT hold | Block / **Simple Domain** in a domain | K | ' |
| LB hold | Dash — drains stamina | Shift | Right Ctrl |
| D-pad Right | Domain / Ultimate — needs MAX_CE 100 **and** full CURRENT_CE | O | \\ |
| D-pad Right (again) | **Release your own domain early** | O | \\ |
| **B** | **SPECIAL** — one signature ability per character (see below). Megumi's, Toji's and Geto's are a **hold**. | H | M |
| **B** **during Megumi's domain cast** | **THE SUMMON RITUAL** — abandons the domain and calls **MAHORAGA**. Once a match. | H | M |
| **D-pad Left** | **TAUNT** — personality only. No damage, no meter, no armour, fully interruptible. Move / dash / block cancels. | P | / |
| Y | Heavy — the committed knockdown swing | L | . |
| B | *also* cancel in menus, and the fourth face button in Higuruma's **execution duel**. The two never overlap — see `src/input/input.js`. | H | M |
| Left stick **press** (L3) | **Toggle opponent lock** — off = free camera, and you turn to face the way you move (lets you attack shikigami and transfigured humans) | Q | , |
| LT + D-pad Right hold | **Barrier Break** — inside an enemy domain | K+O | '+\\ |
| START / Esc | Pause menu (resume / controls / quit) | Esc | Esc |
| F | Fullscreen (or the ⛶ button, top right) | | |
| M | Music on/off (or the ♪ button) | | |
| Select | Control legend | Tab | Tab |
| F3 | Debug overlay (states, frame data, hitboxes, bones) | | |
| F4 | Quality cycle (full post / no bloom / raw) | | |

## Modes

| Mode | Seats | Screen |
| --- | --- | --- |
| **LOCAL VS** | 2 humans | left/right split |
| **VS CPU** | 1 human + bot | full screen |
| **FREE-FOR-ALL** | 3 humans | 2×2 grid (fourth cell dark) |
| **FREE-FOR-ALL** | 4 humans | 2×2 grid |

**Every seat gets its own over-the-shoulder camera**, and each cell renders the
complete shading stack (toon, outlines, bloom, grade) through its own composer.
VS CPU is a single full-screen camera behind P1.

Free-for-all is **last man standing**: everyone fights everyone, techniques and
the soft lock always target whoever you are currently closest to, a Domain
Expansion traps *every* other fighter at once, and each K.O. costs that fighter
a stock. Run out of stocks and you are out of the match for good — the round
keeps going without you. **P3 and P4 need gamepads**; the two keyboard clusters
only cover P1 and P2.

## Specials (B)

Every character has one signature special: modest CURRENT_CE cost, short
cooldown (the HUD slot under each plate shows the sweep), no ultimate gating —
these are part of the normal rhythm of a fight.

### Tap B, or hold B

Three characters — **Megumi** (shikigami), **Toji** (cursed tools) and **Geto**
(cursed spirits) — do not have *a* special, they have a *set* to pick from. Both
are on the same button:

* **TAP B** commits the **default** immediately. No radial, no slow-motion, no
  stick reading. The default is whatever you already have equipped or bound, so
  a mis-tap is a free no-op.
* **HOLD B** (past ~0.17 s) opens the **radial**, already sitting on that same
  default. The **left stick** picks another sector, **RB / RT** chooses which
  slot the pick lands in (Megumi only), and **releasing B** confirms. Time slows
  to ~0.6x while it is open — the game does **not** pause, so opening one in
  somebody's face is a real risk.

**Destroyed options are not selectable.** A dead shikigami or a destroyed curse
is excluded from the ring at open time: the stick snaps *past* it to the nearest
living sector rather than landing on it, and the default falls through to the
first option that is still alive. The sectors keep their fixed positions, so a
hole in the ring is a hole — muscle memory survives.

| Character | Special | What it does |
| --- | --- | --- |
| GOJO | **TELEPORT** | Instant warp — stick direction picks the exit, neutral goes behind the opponent. I-frames through the blink. **Sealed inside an enemy domain.** |
| NANAMI | **7:3 TIMING** | A sub-second sweep over a tick track; stop the marker on the red 7:3 line and his next move is a guaranteed Ratio strike — ~double damage that **shatters a held guard**. Adjacent tick = partial bonus. Miss = long cooldown. The sweep accelerates with each success; he is exposed while timing it. |
| YUTA | **USE COPIED TECHNIQUE** | Fires the stored technique (the last CT that hit him) back at ~62% power in his own green-white energy. One slot; new hits overwrite; using clears. Yuji/Todo yield Divergent Fist / Boogie Woogie. |
| YUJI | **BLACK FLASH** | Press **B** the instant a technique connects (the slot flares red while the window is open) — 黒閃 at ~2.5× the hit, CE refund + MAX spike. Chains stack a damage bonus. |
| TODO | **BOOGIE WOOGIE** | The clap: instantly swaps ground positions with the nearest opponent, keeping facing, momentum, height and juggle state. Cheap, short cooldown, cancels his own recovery, and the victim's aim goes stale for a beat — a mid-swing opponent whiffs. Works inside domains (it's an exchange within the barrier, nothing crosses it). |
| HIGURUMA | **SUMMON JUDGEMAN** | A blind shikigami that never attacks. It holds a post behind him and files **EVIDENCE** on the opponent — 3.2/s passively and much faster while Higuruma is the one being hit. Evidence lowers his domain's cast gate and shortens the execution sequence inside it. 22 hp: destroying it turns the tap off until he spends 18 CE and ten seconds putting it back. |
| SUKUNA | **CONSUME A FINGER** | He eats one of his own fingers and is permanently stronger for the rest of the **match** — technique damage ×1.09, range ×1.08 and startup ×0.94, cumulative, per stack. Four of them, ever. Costs no cursed energy: the price is **58 frames in which he cannot act**, and being clipped out of the channel loses the second but *not* the finger. Two stacks unlock **FIRE ARROW**. |
| MEGUMI | **SHIKIGAMI WHEEL** (hold) | Hold **B** to open a radial selector — the game keeps running and time slows to ~0.62×, so opening it in someone's face is a real risk. The **left stick picks the shikigami**, **RB / RT picks which technique slot it lands in**, and **releasing confirms**. Re-binding mid-fight is part of his rhythm, not a once-a-round commitment. |
| YAGA | **CONSTRUCT** (hold) | **HOLD B and he builds a cursed corpse in his hands.** A meter fills over 6.4 s, billed at 7.5 CURRENT_CE per second, and what walks off his hands when you release is whatever tier the meter reached — SCRAP at 25%, STANDARD at 50%, REFINED at 75%, MASTERWORK at 100%, each a visibly different body. He is **completely vulnerable** while it fills: no attacking, no blocking, no dashing, no jumping, and a third of his walk speed. A light hit takes 22% of the bar; **a heavy hit, a launcher or a knockdown destroys the work outright.** Let go early and the progress sits for three seconds before it starts bleeding, so building in two bites around their pressure is a real plan. Two corpses at once; a third is refused rather than swapping one out. |
| TAKABA | **RIFF** | A short stance where he works the crowd. It builds **COMEDY METER** faster than anything else in his kit (26/s) and he is **completely vulnerable** for all of it — no guard, no armour, and after the first few frames no way out. Getting hit during it drains 22 meter, which is more than the whole stance was going to earn. Pure risk, and the only button in his kit that is a decision rather than a dice roll. |

Gojo special combo: while **charged** (MAX 100 + full bar), cast **Blue then
Red** within the window → **Hollow Purple** (consumes the whole bar).

Yuji special: he has **no cursed technique and no domain** (canon). His bar
grows fastest through punches, and **Black Flash** is a timing input on his
**techniques only** — Divergent Fist, its delayed shockwave, and Manji Kick.
Landing one opens a tight window (a white tick flashes on the impact spark);
pressing punch inside it lands 黒閃 at ~2.5× the hit, refunds CURRENT_CE and
spikes MAX_CE. The basic punch string cannot Flash — it builds the bar and the
pressure that sets a technique up. Consecutive Flashes stack a damage bonus
until he whiffs a technique or is hit.
His ultimate, **Sukuna's Manifestation**, is a transform, not a domain:
markings surface, the punch string becomes Dismantle slashes, and when it
ends he takes recoil damage plus the standard regen blackout.

## Taunts (D-pad Left)

Pure fan service. A taunt is a character-specific animation, usually with a
speech bubble, and it has **no gameplay effect whatsoever** — no damage, no
meter, no armour, no advantage.

**It is entirely unsafe.** Full startup, no armour, no cancel into anything.
Any hit that lands cuts the animation and the bubble instantly, mid-word. You
can bail out yourself by **moving, dashing or blocking**; you cannot bail out
into an attack, because being able to bait with a taunt and convert off it
would make it a tool rather than a joke.

**Where you cannot taunt.** The taunt is read from one place — the neutral
`idle/walk/run/dash` branch of the fighter's state machine — which sits behind
every early return in it. That single placement is what makes the whole gate
list structural rather than a list somebody has to remember to extend:

> mid-attack · mid-technique · mid-combo · in hitstun · in blockstun · guard
> broken · launched · knocked down · getting up · while blocking · in the air ·
> during a domain cast · inside Unlimited Void's lock · while rooted, frozen,
> devoured or transfigured · during the plea trial or the execution duel ·
> during the Mahoraga summon ritual · during Jackpot's activation · during any
> K.O. or victory cinematic · during the round intro

Taunting **inside somebody else's domain is allowed**, and is the intended use.
The bubble is drawn as near-black ink on off-white paper for exactly that
reason: every domain grade in `stage.js` is a tint/lift/saturation multiply,
and those preserve the contrast between two achromatic values, so the bubble
survives the shrine's red, the shadow garden's desaturation and the courtroom's
vignette identically.

**Rate-limited** to one per 2.4 s (measured from when the last one *ends*, so
cancel-spam is limited by the same number).

**Where they play:** in a match; automatically as the winner's win pose (and
replayable on the result screen with D-pad Left); and on character select and
variant select, previewed with **Y** — Y rather than D-pad Left, because on
that screen D-pad Left is the cursor.

**CPU opponents taunt**, weighted by personality (`TAUNT_WEIGHT` in
`src/combat/taunts.js` — Todo and Naoya constantly, Nanami and Higuruma almost
never). A bot only taunts out of a genuinely safe opening: the opponent on the
floor, or a real gap in neutral. Never in or near a combo, never under
pressure, never while losing, never inside a domain.

**THE ONE EXCEPTION, and it is deliberate: TAKABA'S TAUNT DOES SOMETHING.** It
is an actual joke — he turns to *camera*, takes his time, delivers, and a
rimshot plays — and completing it uninterrupted pays **+14 COMEDY METER**, which
makes taunting part of his gameplan rather than a flourish. Everything else
about it obeys every rule above: fully vulnerable, interruptible, rate-limited
by the same 2.4 s, blocked everywhere taunts are blocked, and it pays nothing if
it is cut. It is keyed on `cfg.comedy`, which only he declares, so it cannot
leak to anybody else — the global flag below is untouched and still off.

**`TAUNT_GRANTS_METER`** (`src/combat/taunts.js`) is a config flag, **off by
default**. Turned on, an *uninterrupted* taunt pays a small CURRENT_CE bonus —
the classic fighting-game risk/reward. An interrupted one never pays.

**Adding more taunts per character is one line**: push another entry onto that
character's array in `TAUNTS`. The input cycles through the list.

## Megumi and the Ten Shadows

Megumi is the roster's summoner and its most technical member: average stats
everywhere, no standout normal, and a kit that wins by controlling what is on
the field. His two technique slots do not hold techniques — they hold whichever
**shikigami** the wheel last bound to them, and each brings its own cost, frame
data, cooldown and summoning gesture. Dogs + Nue is a rushdown build; Toad +
Serpent is a control build; they genuinely play differently.

### Permanent loss

**A shikigami killed in combat is gone for the rest of the MATCH — it does not
come back between rounds.** It cannot be re-summoned, it is struck through on
the wheel and on his name plate, and Megumi is measurably weaker for every
round that follows. Nothing else in the game spends a resource that never comes
back. Dismissed shikigami (domain collapse, timer expiry, the Toad spending
itself on a block) are *not* lost — only ones that actually die.

The single exception is **Chimera Shadow Garden**, which restores everything he
has lost for as long as it holds. The moment it collapses, anything still in
the ledger goes back down with it.

| Shikigami | Cost | CD | HP | Damage | What it does |
| --- | --- | --- | --- | --- | --- |
| **DIVINE DOGS** 玉犬 | 22 | 7s | 26 ea | 3.5 | A **pair**. Two wolves chase independently on offset approach angles, bite and back off. Fast, low damage, constant interruption. If one dies the other stays. |
| **NUE** 鵺 | 26 | 9s | 22 | 8 | Orbits overhead out of reach, then commits to a diving electric strike that **stuns for 0.75s**. |
| **TOAD** 蝦蟇 | 18 | 8s | 20 | 4 | Holds station between Megumi and the fight. Tongue-grabs at 7.5 m and **drags them toward him**, and **body-blocks exactly one incoming hit** (then despawns — spent, not lost). |
| **GREAT SERPENT** 大蛇 | 30 | 12s | 34 | 14 | Erupts, telegraphs a line, then rushes along the ground. Turns badly — that is the out. On connect it **pins for 1.35s**. |
| **MAX ELEPHANT** 満象 | 48 | 20s | 55 | 26 | Costs **two** summon slots. Rears and floods a 4.6 m radius with a torrent: his hardest hit, his hardest to land, and a destruction source in its own right. |
| **RABBIT ESCAPE** 兎 | 14 | 10s | — | 0.8 | The panic button. A swarm that obscures vision, shoves anyone close out to 3.2 m, and buys him two seconds. |

Only **two summon slots** may be active at once (the Dogs are one slot for two
bodies). Shikigami feed *reduced* MAX_CE growth — they pressure, they do not
build his bar for him.

### Domain Expansion — CHIMERA SHADOW GARDEN 嵌合暗翳庭

His domain is **incomplete**, and it is built as incomplete rather than as a
normal domain with a different colour:

- **No enclosing barrier.** The arena is not swapped out and the opponent is not
  trapped — a sea of shadow floods the ground and spreads, and running off it is
  the counterplay. Barrier Break has nothing to break; the input is refused with
  a reason.
- **No sure-hit.** Every other domain applies something unavoidable. This one
  applies nothing at all to the opponent.
- **In exchange:** it costs **78% of a full bar** instead of the full ultimate
  gate, and it runs **30 seconds** instead of 20.
- **What he actually gets:** summons become **free, instant and unlimited** (the
  active-slot cap is off), **everything he has lost comes back** for the
  duration, shikigami can **erupt anywhere in the shadow including under the
  opponent**, and his dash becomes **SHADOW TRAVEL** — he submerges, moves fast
  and untargetable, and surfaces where he likes.
- **Counterplay:** leave the shadow. It never covers a whole map (its radius is
  scaled per map). A **heavy swing shoves it back locally**, carving a safe hole
  that heals shut over ~3 seconds. The opponent gets a live **exposure** read on
  the HUD. And **kill the shikigami** — the CPU does, and so should you: unlock
  the camera with L3 to face them.
- **Domain clash:** refinement **3**, by far the lowest — Gojo 10 > Mahito 9 >
  Jogo 8 > Yuta 7 > **Megumi 3**. A clash is decided on damage taken first, so
  he can still win an exchange outright; refinement only breaks an exact tie, and
  on a tie his half-finished barrier loses to every complete domain in the game.

### Cross-character rules

| Situation | Result |
| --- | --- |
| Megumi caught in **Unlimited Void** | The link severs: every shikigami is **dismissed instantly** — brutal, but not a permanent loss. |
| Megumi caught in **Coffin of the Iron Mountain** | The heat cooks them like it cooks Mahito's minion. They can genuinely die in there, and that death **is** a permanent loss. |
| Megumi caught in **Self-Embodiment of Perfection** | Shadow constructs have no soul to reshape — they keep fighting while his own gauge drains. His best matchup into Mahito. |
| **Mahito's minion** vs shikigami | They fight each other for real, both ways. |
| **Yuta's Copy** off Megumi | One **borrowed Divine Dog** on a short leash at reduced health. Loss is tracked per owner, so Yuta losing it costs Megumi nothing. |

## HIGURUMA 日車寛見

The setup character, and the only one on the roster whose entire design is a
wager. He is the **weakest fighter in the game until his domain lands** and one
of the most lethal after it.

- **Lowest health on the roster (88)** and the lowest damage scale (0.86).
  Average speed on every axis: he is not slow, he simply cannot hurt you.
- **Fastest MAX_CE growth on the roster** — 11 per landed punch against the
  standard 6. Reaching the courtroom is the only thing he is good at.
- **X — briefcase string.** Three clumsy swings with a hard-sided case. The
  third **knocks down** rather than launching: he does not get a juggle, he
  gets a beat of breathing room.
- **RB — GAVEL STRIKE.** 26 frames of startup, a small shockwave on landing.
  His only real damage tool, and a genuine commitment every time.
- **RT — CONFISCATION.** Short range, **no damage at all**. On hit it seizes
  one of the opponent's technique buttons for 6 seconds — and not at random: it
  takes whichever slot they have been leaning on since the last seizure. The
  locked button shows on **their** plate with a live countdown.
- **B — SUMMON JUDGEMAN.** A blind shikigami built in the same
  shadow-construct language as Megumi's Ten Shadows: a dark hanging mass with a
  scale slung on each side and a bone-white mask with its eyes sewn shut. It
  never attacks. It files **EVIDENCE**, faster the more Higuruma is losing, and
  it has 22 hp — **breaking it is the counterplay to the whole character**.

### EVIDENCE 証拠

Judgeman gathers 3.2/s passively, +2.5 per clean hit Higuruma eats and +1.0 per
hit he blocks. It buys exactly two things, and it is visible to both players on
his plate:

1. **A cheaper domain.** The cast gate slides from the standard full bar
   (100 MAX_CE) down to **70%** of it at a maxed-out case.
2. **A shorter execution sequence.** 6 prompts at no evidence, 3 at full.

### Domain Expansion — DEADLY SENTENCING 死刑判決

**The domain is a contest he can win or lose.** It is not a buff window and not
a damage source. Standard gate, full-bar cost, standard backlash, standard
barrier — clash and Barrier Break both apply — and **once per match**.

**Nothing happens to the opponent when the barrier closes.** What the domain
does is put the **Executioner's Sword** in Higuruma's hand, and while he holds
it his entire moveset is **two buttons**: the briefcase, the gavel, the seizure
and the summon are all gone. X and Y are dead.

- **RB — JUDGMENT SLASH.** A wide sweeping cut. Long reach, high damage,
  launches, fast enough for neutral. Low horizontal knockback on purpose: it is
  a **setup**, and it has to drop them back inside the thrust's range.
- **RT — EXECUTION.** A committed overhead with 30 frames of startup and 40 of
  recovery. Reactable, punishable on whiff. **Landing it starts the duel.**

**One attempt per domain.** Whiffing Execution costs him nothing but time — he
can keep trying until the clock runs out. It is the *connection* that commits
him, and once it connects the domain is over either way.

#### The execution duel

Both players play. Gameplay freezes for everyone; only the duel inputs are
live. The screen cuts to the blade raised over the condemned, the colour drains
out of the room, and a clock ticks under a heartbeat.

- **His side:** a randomised sequence of **X / Y / B / A**, in order, without a
  wrong press, before the clock empties. A wrong button is not a loss — it
  costs 0.5 s. Length is 6 prompts at no evidence, 3 at full.
- **Their side:** they **mash X**, and every press takes 0.085 s off his clock
  (budgeted at 12/s, so a turbo pad gains nothing over a determined human).
- Both sides are on screen at once under one shared clock, so either player can
  read who is winning at a glance.

#### The three endings

| | What happens |
| --- | --- |
| **He lands it and wins the duel** | **Instant KO** regardless of remaining health. The blade falls, hard cut to black, gavel, round over. |
| **He lands it and loses the duel** | No kill. They break free and kick him away — 8 damage, heavy knockback — and **the domain ends immediately**: barrier down, sword gone, full backlash, no second attempt. He has spent his entire ultimate on a shove. |
| **He never lands it** | Timer expires, barrier breaks, or someone clashes it out. Same result: barrier down, sword gone, full backlash, nothing gained. **Surviving the domain is a legitimate way to win it.** |

The escape kick throws the opponent by default;
`domain.sentencing.escape.kickPushesCaster` flips it to throw Higuruma instead.

**Refinement 5.** A complete barrier with a real sure-hit, so far above
Megumi's incomplete Garden (3) — but below Hakari (6), Yuta (7), Jogo (8),
Mahito (9) and Gojo (10). It was built in months by a man with no training, and
on an exact clash tie a domain whose entire payload is a coin flip should not
out-rank the ones that simply work.

### INSTANT KO — the shared category

The roster now owns more than one effect that kills regardless of health
(Mahito's transfiguration, Higuruma's execution), so both route through one
place: `src/combat/instantko.js`. Any future one slots in with no extra work.

- **Hakari's Jackpot** makes him unkillable **by damage**. It does not make him
  unkillable. Reverse Cursed Technique pays damage back; it does not
  un-carry-out a sentence. The kill is stamped on the fighter permanently and
  `Fighter.alive` reads it, so no amount of healing afterwards argues with it.
- **Mahoraga adapts to the category as a chance to RESIST**, not as a damage
  reduction — a fraction off a kill is still a kill. His accumulated percentage
  becomes the probability that the sentence simply does not take: 100% lethal
  at no adaptation, ~40% at 60%, ~12% at the 88% cap. He is never immune, and
  never merely a bigger health bar to a move that ignores health. A resist is
  not a second attempt — it becomes the escape ending.
- **Transfiguration still needs a soul** and Mahoraga still has none, so
  Mahito's behaviour is completely unchanged by the unification.
- **Execution does not need a soul.** A blade is a blade.

## MAHORAGA 魔虚羅

**Not a character-select option.** He is absent from the roster entirely; the
only door in is Megumi.

### The summon ritual

While Megumi is **casting** Chimera Shadow Garden — during the 84-frame cast,
before the domain resolves — pressing **B** abandons the barrier and
begins the ritual for **Eight-Handled Sword Divergent Sila Divine General,
Mahoraga**. The bar was already spent on the cast, so **the domain is consumed
either way**: he never gets both. Once per match, and a prompt appears during
the cast window the first time it is available.

The cutscene runs **12 seconds** on its own clock, its own camera and its own
overlay — the gameplay camera is not used at any point, and no logic tick runs
while it plays, so the opponent is frozen solid. Nine hard-cut shots: a low
dolly-in, eight tight close-ups (hands, eyes, from underneath, over the
shoulder) timed to **eight hand signs** whose rhythm accelerates all the way
in, a hard white flash and a held impact frame on the eighth, the shadow gate,
a **silence beat** where the drone cuts dead, the **Dharma wheel rising alone**
out of the floor, a silhouette, and a crane that tilts up past where you expect
it to stop. The incantation is subtitled in kanji and English:

> 布瑠部 由良由良 — *Furube yura yura* · 「この宝をもって」 — "With this
> treasure, I summon…" · 八握剣異戒神将魔虚羅

Skippable on a **hold** — but only once you have watched it through once.

### The transformation

The player controls Mahoraga for the rest of the round; Megumi comes back at
the start of the next one. **Megumi's health carries over exactly** — summoning
at 22% means starting at 22%. That is the cost, along with the spent domain.

He is **3.60 m** — 1.8× Todo, the previous largest — and has **no resource
system at all**: no cursed energy, no bar, no meter, no ultimate, no domain,
and **no self-damage of any kind**. D-pad Right is refused with a line.

| Input | Move |
| --- | --- |
| **X** | 3-hit claw string, enormous reach (3.3–3.8 m), **armour on the first hit**, 3rd launches |
| **Y** | Hammerfall — the committed knockdown |
| **RB** | **WHEEL SLASH** 輪転斬 — a wide sweeping blade arc that hits everything in front of him |
| **RT** | **WORLD-CUTTING SLASH** — 46 frames of startup with a dead-still hold in the middle, a cut line drawn on the ground before the blade moves, and a line that goes through the **level** as well as through you |
| **LT** | Heavy guard: excellent reduction, and **25 frames to raise** |
| **LB** | **Heavy charge**, not a dash — commits forward, armours through one hit, cannot turn |

### Adaptation 適応

Every **10 seconds** he adapts to **one randomly chosen** damage source that has
actually landed on him since the last adaptation, for a **random 25–60%**
reduction. Adaptations **stack** on the same source and cap at **88%** — never
100%, so every tool the opponent owns keeps working. Nothing has landed? The
interval passes and he gains nothing.

Nine categories are tracked **separately**, so adapting to punches does nothing
about Jogo's fire:

| Category | What lands in it |
| --- | --- |
| **PHYSICAL STRIKES** | every punch string and heavy, plus Yuji's Divergent Fist, Manji Kick and **Black Flash** — reinforced fists with no technique behind them |
| **CURSED TECHNIQUE I / II** | the RB / RT slot of whoever is fighting him |
| **ULTIMATES** | Hollow Purple, Collapse, Brotherhood, Rika's blast |
| **DOMAIN EFFECTS** | every sure-hit, every AML sword roll, Jogo's ambient heat — and the Unlimited Void lockdown itself |
| **PROJECTILES** | Jogo's ember insects |
| **THROWS & GRABS** | Todo's grab and both Boogie Woogie swaps |
| **SUMMONS** | every shikigami and Mahito's transfigured human |
| **BURN & BLEED** | burn stacks, Straw Doll bleed |

The **Dharma wheel spins up and locks** with a sound cue, a styled callout
announces exactly what was adapted and by how much, and a **persistent list on
his side of the HUD** shows every adapted category and its running total —
visible to both players, because the opponent needs it more than he does.

### Cross-character rulings

| Situation | Result |
| --- | --- |
| Mahoraga inside **Unlimited Void** | He adapts to it. Sure-hit still *hits* — a barrier is not something you dodge — but the DOMAIN category erodes the **lockdown**, which runs on a duty cycle: he is free for a fraction of every second equal to his adaptation. At the 88% cap Gojo holds him roughly one second in eight. |
| Mahoraga inside **Self-Embodiment of Perfection** | **Immune.** Same ruling this project already applies to Megumi's shikigami: a shadow construct has no soul to reshape, and Mahoraga is the largest shikigami there is. Mahito keeps his whole normal kit; what he loses is the instant win. |
| **Yuta's Copy** off Mahoraga | The **Wheel Slash**. Adaptation is a property of the body, not a technique — there is nothing else on him to steal. |
| **Todo's Boogie Woogie** with Mahoraga | Works. Both bodies are pushed out of anything they land inside and re-seated on the floor under their new feet, so the swap is safe at any size. |
| **Megumi's own shikigami** in a mirror match | `summon` — separate from his hands and from Mahoraga's. |

### Scale, and what it broke

He navigates on a **human-sized collision capsule** on purpose. His size lives
in the hurt capsule, the reach numbers, the push radius and the camera — none
of which have navigation consequences — which makes "stuck in a doorway on map
6" impossible *by construction*. A sweep of 2,016 walk tests across all seven
maps confirms he is blocked in exactly the places a human is and nowhere else.

The camera pulls back **2.05×**, raises its look target **1.55 m**, tilts down,
and eases rather than snapping. It also carries a **hard standoff** that shoves
it back out along its own axis if the wall sweep ever pulls it inside him —
which, before that guard, it did.

## SUKUNA 両面宿儺

The apex, and the only character on the roster balanced purely by **commitment
and cost**. He has no stat penalty anywhere: 108 hp against a roster mean of
~103, `damageScale` 1.0, standard cursed-energy regen and stamina, above-average
speed, and by a wide margin the longest melee reach in the game. Nothing about
his body is taxed.

What he pays instead is meter and frames. Dismantle costs 26 CE, Cleave 34, Fire
Arrow 55 — against a 40-point opening bar and 2.2/s regen, that is *one*
technique per exchange and then he has to go and earn the next one with his
hands. A whiffed Cleave is 32 frames of standing still from a move he had to
walk into 2.6 m to use. **His punches are deliberately average** (4/5/8, exactly
the schema default): the claw string is a spacing and meter-building tool, and
every point of killing power lives in the three techniques.

### The moveset

| Input | Move | What it does |
| --- | --- | --- |
| **X** | Claw string | 3 hits, 4/5/8 damage, **1.75–1.95 m reach** (roster: 1.35–1.7). Fast to come out and slow to finish — 24/27/39 total frames against the roster's 21/24/34. The third hit launches. |
| **Y** | Rending Sweep | All four arms come down at once. Standard heavy: 14 damage, knockdown. |
| **RB** | **DISMANTLE 解** | A crossing slash fired down a line. 16 damage, 13 m, 26 CE, 20 f startup / 26 f recovery. Cuts *anything* — the environment on the line takes the same cut the opponent does. |
| **RT** *(tap)* | **CLEAVE 捌** | The same technique aimed at a person. 34 CE, 16 f startup, **32 f recovery**. |
| **RT** *(hold)* | **FIRE ARROW 開** | Charged screen-crossing flame. Requires **2 Finger stacks**. |
| **LT** | Guard | Average. Every guard dial is the roster default. |
| **LB** | Dash | Fastest in the roster, **no invulnerability** — pure movement. |
| **B** | Consume a Finger | See the specials table. |
| **D-Right** | Domain Expansion | Malevolent Shrine. |

### Cleave scales off *your* bar

Dismantle does not care what it is cutting. **Cleave adjusts to the target's
cursed energy**, so the more MAX_CE they have banked, the deeper it goes:

```
damage = 12 + 0.32 × target MAX_CE
```

| Target MAX_CE | Cleave |
| --- | --- |
| 40 (round start) | 24.8 |
| 70 | 34.4 |
| 100 (charged) | **44.0** — the hardest single technique hit in the game |

The number and the multiplier are printed on screen when it lands, because a
scaling move nobody can see scaling is just a random damage roll to whoever is
on the receiving end. Against a target with **no cursed-energy system at all**
(Mahoraga) there is nothing to adjust to, so it neither scales up nor collapses
to its floor — it falls back to a flat 30 and the callout says
`NO CURSED ENERGY TO READ`.

### Fire Arrow, and what the unlock costs

From two stacks, **RT stops being a single-purpose button**: the press opens an
8-frame stance, releasing inside it gives Cleave, holding past it commits to a
78-frame charge. So unlocking Fire Arrow makes his Cleave 8 frames slower. That
is deliberate — the unlock has a price.

The charge is **free and cancellable**. Cursed energy is spent at *release*, and
LT aborts into 22 frames of recovery having paid nothing. That is what makes the
telegraph a mind game instead of a free win for whoever is standing in front of
it. Released, it deals 62 damage (73.7 at two stacks), is unblockable, and
**erases** terrain along its path like Hollow Purple.

### Reverse Cursed Technique

A passive **0.65 hp/s** — 39 hp a minute. It cannot out-heal anybody's pressure
(one Cleave is worth more than a minute of it), it is capped at his starting
health, and it stops during domain backlash. It also cannot argue with an
**INSTANT KO**: Higuruma's execution and Mahito's transfiguration both kill him
normally, because `Fighter.alive` reads the `instantKO` stamp and RCT only runs
on a fighter who is alive. He gets no exemption.

### Domain Expansion — MALEVOLENT SHRINE 伏魔御廚子

**The only domain in the game with no barrier *and* a full sure-hit**, and that
asymmetry is the character rather than an oversight.

Every other complete domain buys a barrier and traps you inside it. Megumi's
Chimera Shadow Garden goes open and pays for it by giving up sure-hit entirely.
Sukuna keeps the guarantee *without* the barrier — and what he gives up instead
is the one thing a barrier actually buys: **you can leave**.

- **No enclosing barrier.** A skeletal shrine rises where he cast it and its
  influence radiates out to a per-map radius. The opponent is not trapped.
- **Full sure-hit.** Everything inside the radius is cut on a 0.55 s tick that
  bypasses hitbox resolution entirely — unblockable, unmitigated, undodgeable.
  Cleave lands on people (scaling off their MAX_CE as always: 5.5/tick at 40,
  8.5/tick at 100); Dismantle lands on the arena, four times a second, for the
  full twenty seconds. The level is genuinely shredded by the end.
- **Sukuna is immune inside it and acts freely.**
- **Refinement 11** — the highest in the game, above Gojo's 10. A clash is
  decided on *damage taken* first and only falls back to refinement on an exact
  tie, so this is a tie-break win rather than an auto-win.

**Counterplay, all of which works:**

| Counter | Result |
| --- | --- |
| **RUN** | The primary escape and the reason the radius is tuned per map. Outside it, damage is exactly zero. The HUD prints the metres still to go. |
| **Barrier Break** | Does nothing, because there is no barrier. The input is refused with `NO BARRIER TO BREAK — RUN` rather than failing silently or throwing, and the fighter keeps their guard. |
| **Simple Domain** | Works, and is the strongest defensive answer to him — it holds the slashes out completely, at 20 stamina/s. |
| **Domain clash** | Applies normally. Another domain cast inside contests it. |

**Radius per map** — clamped three ways: the map's own `shrineScale`, then the
move's `[9, 22]`, then a hard cap at **55% of that map's radius**, so a map added
later cannot be swallowed by a number nobody re-checked.

| Map | Map radius | Shrine | % of map |
| --- | --- | --- | --- |
| Shibuya Station | 26 m | **12.0 m** | 46% |
| Detention Center | 32 m | **13.1 m** | 41% |
| Sendai School | 34 m | **14.0 m** | 41% |
| Jujutsu High | 38 m | **15.0 m** | 39% |
| Scramble Crossing | 40 m | **16.9 m** | 42% |
| Kyoto Grounds | 42 m | **16.1 m** | 38% |
| Shinjuku | 48 m | **20.0 m** | 42% |

### The four-arm rig

His defining silhouette feature is real geometry on real bones, not decoration.
`createRig` takes an optional list of **extra bones** appended after the shared
hierarchy — so every existing bone keeps its index, every existing clip keeps
working, and only the character that asked for them ever names them. Sukuna adds
`ClavL2 / UpArmL2 / LoArmL2 / HandL2` and the R2 mirror; `AnimPlayer` skips a
bone a model does not have, so a Sukuna clip played on anyone else is harmless.

**All 37 clips in his set drive all four arms**, including the four shared
victim clips (`transfigured`, `sentenced`, `executed`, `execEscape`) which are
re-authored for him — the shared skeleton retargets those for free, and free
retargeting is exactly what does *not* cover a second pair of arms. The rule
throughout: the upper pair leads, the lower pair counterweights through the walk
and run and layers its slashes a beat behind, and nothing moves all four in
unison except the heavy and the domain cast, so those two land as moments.

## KASHIMO 甚壱

**The speedster, and the only fighter in the game who is punished for standing
still.** He converts cursed energy into electricity and the conversion is
driven by MOTION: everything he owns — his damage, his attack speed, the size
and reach of his electric attacks — is read off one meter that only his own
feet can fill.

Canon-correct: **no Domain Expansion.** D-pad Right is a burst ultimate on the
standard gate.

### CHARGE 帯電

A meter of its own on his plate, separate from cursed energy, with the tier
thresholds marked on it. Four tiers:

| Tier | Opens at | Damage | Attack speed | AoE size | On the model |
| --- | --- | --- | --- | --- | --- |
| 0 · 接地 EARTHED | 0% | x0.76 | x1.00 | x1.00 | nothing at all |
| 1 · 帯電 CHARGED | 25% | x1.00 | x1.06 | x1.12 | conductor tip lights, eye lines glow |
| 2 · 放電 ARCING | 55% | x1.20 | x1.14 | x1.26 | six arcs, eyes bright, **coiled posture** |
| 3 · 雷神 MYTHICAL | 85% | x1.42 | x1.24 | x1.46 | fourteen arcs, ground ring, 30 Hz flicker |

**Build and decay are decided by STATE, not by a list of moves** — which is
what makes the rule structural rather than a set of hooks. Three buckets:

* **BUILD** — dash **+30/s**, run **+16/s**, walk **+5/s**. Landing a hit pays
  a flat grant on top: punch +4, heavy +6, technique +7, an Arc Dash pass that
  connects **+14**.
* **DECAY** — standing still **-12/s**, holding guard **-26/s**. Turtling
  against him is not a non-answer, it is an active disarm.
* **HOLD** — everything else. Attacking, recovering, being hit, in the air,
  mid-cinematic. Neither built nor bled.

That HOLD bucket is the load-bearing one. If attacking bled him his own punch
string would disarm him; if being hit bled him a zoner would strip him without
him ever having a decision to make. The meter answers exactly one question —
*are you moving, or are you turtling* — and nothing else can touch it.

Measured: **empty to full by dashing is 3.34 s; full to empty by blocking is
3.85 s.** Tier 1 opening at only 25% is the mercy in the design — 0.8 s of
dashing out of neutral clears the bad tier, so he does not open every round
helpless.

### The kit

| Input | Move | Notes |
| --- | --- | --- |
| X | Staff string | **The longest normals in the game** — 1.85 / 1.95 / 2.05 m against a roster norm of 1.35 / 1.45 / 1.50. Startup is the roster norm exactly (6/7/10), *not* Naoya's 4/5/7. |
| Y | Iron Circle | The one committed swing, and his only knockdown |
| RB | **LIGHTNING BOLT** | Flat, fast, **no homing**. Range is read off the tier separately: **5 m at tier 0, 18 m at tier 3**. Near-useless uncharged by design. |
| RT | **DISCHARGE STRIKE** | 51 frames, a burst rather than a point hit, and it **costs him 35 Charge**. A short stagger at tier 2+ (34 / 44 frames). |
| LT | Block | Poor guard (x1.45 chip and stamina) **and it bleeds 26 Charge a second** |
| LB | Dash | The best *sustained* dash in the game: 15/s drain against 34/s regen on a 145 pool. Naoya's is still faster. |
| **B** | **ARC DASH 雷閃** | An instant blink along the stick that damages everything it passes through, **chainable three times** before the cooldown applies. 10 i-frames per pass. |
| D-pad Right | **MYTHICAL BEAST AMBER 灼爛趙誅** | 8 s. Charge **pinned at maximum**, cursed energy free, the bolt becomes a three-way fan, the Discharge burst doubles, the Arc Dash chain goes 3 to 6. |

**ARC DASH'S ECONOMY IS THE WHOLE MOVE.** Each pass costs 12 Charge; each pass
that CONNECTS pays back 14. So an aggressive chain through a body is net +6 and
a free reposition, and three whiffed passes is -36 and he has disarmed himself.
It also has i-frames on the travel, which is his answer to the zoners the
decay-on-block rule would otherwise hand the matchup to: **blink through the
chip instead of blocking it.**

At **tier 3 every confirmed normal earths through the body it lands on** and
arcs to anything else within 2.3 m. It deliberately does not hit the primary
target twice — the tier table already multiplies his damage — so it is a
property change rather than a damage cliff, and it is genuinely dangerous in a
free-for-all or against a summoner.

## PANDA 呪骸

**The stance character, and the only fighter in the game with more than one
health bar.** Three cursed cores, three complete fighters, one body. Nothing
else in the roster does this: Toji swaps *weapons* (his punches, heavy, guard
and special are constant across all four), Hakari swaps a *moveset* once for 99
seconds, Megumi and Geto swap *summons*. Panda swaps **who he is**.

Canon-correct: a cursed corpse has **no Domain Expansion**.

### The three cores

Canon names all three — in his own framing an older sister (Triceratops), a
middle brother (Gorilla), and the baby brother he normally is (Panda).

|  | PANDA 熊猫核 | GORILLA 猩々核 | TRICERATOPS 三角竜核 |
| --- | --- | --- | --- |
| **Core health** | 68 -> **160** | 60 -> **141** | 54 -> **127** |
| Run / dash | 5.00 / 8.40 | 4.00 / 6.40 | 6.30 / 10.20 |
| Damage scale | x1.00 | **x1.30** | x0.80 |
| Jab startup / recovery | 7f / 13f | 10f / 20f | **5f / 10f** |
| Launcher startup | 11f | 15f | 8f |
| Armour on normals | none | **8 / 8 / 12f** | none |
| Block chip | x0.85 | **x0.70** | x1.30 |
| Dash i-frames | 0 | 0 | **8** |
| Cursed energy | — | **-14/s** | — |
| RB | Cursed Palm | **UNBLOCKABLE DRUMMING BEAT** | Gore Charge |
| RT | Rolling Press | Gorilla Slam (knockdown) | Crest Roll (**14 i-frames**) |

**Total 182 -> 428 health, the highest in the game by a distance** (Todo is
294). Each individual pool is 68% / 60% / 54% of one ordinary bar, so any
single one of them dies faster than any other character in the game. He is
durable in aggregate and fragile in the moment, and the skill of the character
is deciding which of his three fighters is allowed to bleed.

**The pools are not equal, and the ordering is the balance lever**: the
strongest stance has the second-smallest pool and the fastest has the smallest.
Only the balanced core is durable, and it is the one whose numbers are ordinary.

**UNBLOCKABLE DRUMMING BEAT 不可視の連打** is canon by name — he beats his
chest and the shock resonates *through* the guard, so a blocked Drumming Beat
deals its damage in full. It is short (2.2 m) and slow (20f) precisely because
of that: the counterplay is the one Gorilla always has against him, which is
distance.

**GORILLA'S CURSED-ENERGY BILL** is canon too ("much stronger and faster… at
the cost of rapidly draining his cursed energy"). At 14/s against 2.8/s regen
he is net -11.2/s, so a full bar buys about eight seconds of Gorilla and then
he has no techniques at all. Sitting in Gorilla is not a strategy, it is a
countdown. **The swap out is never refused for lack of cursed energy** — it
drains what he has rather than gating — because a Panda who could not afford to
leave the stance that was starving him would be soft-locked in it.

### Core loss

A core whose pool reaches zero is **DESTROYED, permanently, for the rest of the
round**, and that stance is gone with it — greyed and struck through on the
HUD strip, excluded from the swap radial. He is then **forced** into the next
surviving core with a `coreBreak` reaction he does not choose and cannot
cancel. When all three are gone he is KO'd.

Cores **do** reset between stocks, unlike Megumi's shikigami ledger. A
destroyed shikigami is a creature he sent out and lost; a destroyed core is an
organ of his own body, and a stock is a fresh body.

### Core swap — B

Tap **B** to cycle to the next surviving core; hold **B** to open a radial and
pick one directly, on the same wheel Megumi's shikigami, Toji's arsenal and
Geto's curses use — including the rule that destroyed options are excluded and
the stick snaps *past* the hole by angle, so the sectors keep fixed positions
and muscle memory survives.

The swap is **26 frames with no armour, no invulnerability and no cancel**, and
**the core does not actually change until the halfway point** — so a Panda
punished at frame 5 eats it in the core he was trying to leave, and one
punished at frame 20 eats it in the one he was trying to reach.

### Ultimate — THREE CORES, ONE BODY 三核共鳴

Non-domain, standard gate, full bar, standard backlash. He draws on every
**surviving** core at once: Gorilla's damage, the Triceratops's speed, both
signature techniques on RB and RT, no swap animation and no stance
restrictions. **Its power scales with how many cores are still alive** —

| Cores alive | Damage | Duration |
| --- | --- | --- |
| 3 | x1.55 | 12.0 s |
| 2 | x1.24 | 9.6 s |
| 1 | x0.96 | 7.4 s |

The floor sits at his ordinary balanced-core damage on purpose: a one-core
ultimate buys utility (free cursed energy, no swap animation, both techniques,
6.0 run) and no damage payoff at all. A three-core one takes the round. That
spread is the reward for having protected all three.

## YAGA 夜蛾正道

The builder, and the only summoner in the game whose creature is **manufactured
mid-fight** rather than called. Every other summoner spends a resource and
receives a fixed thing. Yaga spends **time under pressure** and receives
**whatever he managed to finish** — the corpse that walks off his hands is a
direct readout of how long you left him alone.

Canon-correct: **no Domain Expansion.** D-pad Right is a burst ultimate on the
standard gate.

### CONSTRUCTION — the four tiers

Hold **B**. The meter fills over 6.4 uninterrupted seconds at 7.5 CURRENT_CE per
second. Release at any point and you get the tier the meter reached. Each tier
is a **different model with its own rig and its own animation set**, not one
body rescaled, because the whole negotiation depends on the opponent being able
to *see* what they are letting him build.

| tier | meter | time | CE | hp | dmg | lifespan | speed | flinches | extra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **SCRAP** 屑骸 | 25% | 1.6 s | 12 | 18 | 3.0 | 7 s | 2.6 | **yes** | — |
| **STANDARD** 呪骸 | 50% | 3.2 s | 24 | 46 | 7.5 | 15 s | 3.8 | no | — |
| **REFINED** 精骸 | 75% | 4.8 s | 36 | 74 | 10.5 | 22 s | 5.0 | no | LUNGE |
| **MASTERWORK** 傑作 | 100% | 6.4 s | 48 | 128 | 15.0 | 34 s | 5.6 | no | LUNGE + SLAM + it **body-blocks for him** |

**They do not flinch.** Canon: a cursed corpse feels no pain or fear and does
not flinch when struck. Every tier above SCRAP carries it, and it is the single
most important thing about fighting one — hitting it does not interrupt it.

**Two at once. A third is refused, not swapped.** The character is about the
value of work already done, and a rule that quietly destroys finished work to
make room for worse work contradicts it. It also gives the opponent something to
do: killing a corpse unlocks his B button.

### Interrupting him

| what happens to him | what happens to the work |
| --- | --- |
| a **light** hit | −22% of the bar |
| a **heavy** hit, a launcher, a knockdown, a guard break | **destroyed** |
| a burn/bleed tick, a domain sure-hit tick, Nobara's Resonance | −6% |
| Inumaki's speech · Naoya's freeze · Boogie Woogie · being pulled into a domain | the hold ends, **the work survives** |

The rule underneath, so a new case answers itself: **a build is destroyed by
FORCE and only by force.** Anything that merely takes his body away from him
ends the hold and leaves the work alone. Cancelled progress sits for 3 s, then
bleeds at 42%/s.

### The rest of the kit

* **X** — a heavy three-hit string with **armour on the first hit**, which is
  the load-bearing number of the whole character: without it he cannot contest
  a rushdown, and a builder who cannot contest a rushdown never builds.
* **RB · COMMAND** — free, and it reaches **every corpse on the field wherever
  they are**. It overwrites their task list with a point (the stick aims;
  neutral sends them at the opponent) for four seconds at ×1.35 speed and ×1.20
  damage. Canon: a cursed corpse "is programmed to complete a set list of given
  tasks", so COMMAND overwrites the list rather than issuing an order.
* **RT · HAYMAKER** — 34 damage, a hard knockdown and a **guard break** at
  2.3 m, with 38 frames of recovery. It is not a damage tool, it is a **space**
  tool: landing one buys the four seconds STANDARD costs.
* **D-pad Right · MASTERPIECE** — a MASTERWORK with no build time, bigger and
  longer-lived than one he could make by hand. It is the shortcut past the
  entire construction risk, which is exactly why it costs a full bar. It is
  also the only path allowed to retire one of his own corpses to make room.

### Is it viable?

**STANDARD is the realistic ceiling**, and against a character who applies
pressure from outside 2.3 m even that is optimistic. That is the honest answer
and the design accepts it: MASTERPIECE exists because "can he reach MASTERWORK
by building?" is *almost never*. The three things that make the mechanic work at
all are the armoured jab, the Haymaker, and the three-second grace window that
lets him build in two bites.

## TAKABA 高羽史彦

The wildcard, and the deliberate tonal break. Every technique he owns resolves
into a **random absurd outcome** off a weighted table — nobody can plan around
him, including the player holding him.

Canon-correct: **no Domain Expansion.**

### The two tables

**RB · A BIT** rolls one of eight: a giant boxing glove on a spring, an
oversized mallet, a banana peel, a bucket over the head, a pie, a rake that
swings up, a trapdoor, a falling stage light.
**RT · THE BIG ONE** rolls one of six: an anvil, a cartoon safe, a stage
curtain that wraps them, a fire hose, an enormous foam finger, a piano.

**Every outcome in a table is worth roughly the same and is worth it
differently.** The banana peel is three damage and a *hard knockdown*; the
mallet is twelve damage and leaves them standing in front of you; the trapdoor
removes them from the field for 1.1 s. No dud that feels like losing your turn,
no jackpot that wins the round alone — the fun is in not knowing what *shape*
the next hit takes. Every roll announces itself with a stylized callout, its own
VFX and its own sound cue, and it announces on the **roll** rather than on the
connect, so a whiff is never silent.

The four biggest numbers arrive **from above on a telegraph** — a real light
cone or dust ring on the floor you can walk out of on sight. That is what pays
for them.

### COMEDY METER 笑

Not an invented resource: canon says the Comedian runs on his *genuine* belief
that something is funny, and that shaking his confidence stops it. This is that,
with a bar on it.

It fills when the material lands (a bit +7, a Big One +13, a punch +1.6, a
knockdown +5, **the taunt +14**, the riff +26/s) and drains when he bombs
(idle −1.5/s, a whiff −5, a hit −4, being floored −9, **being hit during the
riff −22**).

| tier | at | what changes |
| --- | --- | --- |
| **OPEN MIC** 滑り | 0% | rolls small, tame, faintly pathetic. His idle is apologetic. |
| **WARMING UP** 温まる | 40% | the tables as authored. His idle is level. |
| **KILLING** 爆笑 | 82% | rolls colossal — plus **an audience**: crowd laughter under his hits, a spotlight that follows him, applause on knockdowns. His idle is a showman's. |

**It does not make him stronger.** Every table entry declares an equal-value
column and the meter tilts only how *enormous* the outcome looks. A Takaba who
is rolling gets more absurd, not more dangerous. Nothing is ever weighted to
zero — a cold Takaba can still roll a piano, it is just rare.

### D-pad Right — THE SET 持ちネタ

Not a cutscene and not a quick-time event. **The arena goes away and the
opponent is somewhere else**, on foot, with the controller still in their hands.

> *"Takaba's cursed technique brings him and his opponent into imaginary
> scenarios manifested from his imagination... reviving a dead goldfish at a
> hospital, participating in a game show in a valley, or playing with water on
> the beach. Any damage incurred to his opponent will persist, but damage done
> to Takaba are nothing but simulations to him."*

That last line is the whole design. Inside the set Takaba **takes no damage and
deals none** — he is in there with you, in a bow tie, jogging alongside and
getting in the way, and none of it is real to him. It is not a Domain Expansion:
there is no barrier, no sure-hit, no domain UI, and it refuses to open on top of
somebody else's domain with the line **SOMEBODY ELSE'S WORLD**.

**Three scenes drawn from a pool of six**, back to back, each a real 26 m
corridor you have to physically run, jump and dodge your way down to a lit exit
arch before its clock runs out. The camera swings to a fixed side-on platformer
bearing, lock-on is suspended, and the stick means *toward the exit* instead of
*toward the opponent*.

| scene | 場面 | what it is | panel |
| --- | --- | --- | --- |
| **PICK A DOOR** | 二択 | three banks of five doors; exactly one opens, and it lights a beat before it unlocks. A read under a clock. | ch.242, the quiz |
| **MIND THE TRAFFIC** | 横断歩道 | four lanes of taxis sliding across the corridor. There is a cat sitting in lane three, because there is a cat in the panel. | ch.242, the cat in the road |
| **CODE BLUE** | 病棟 | a hospital corridor; gurneys come out of the side rooms across your line, and the goldfish plinth is a 1.1 m step you go **over**. | ch.242, the dead goldfish |
| **IT IS RISING** | 波 | the floor floods on a clock and the rafts behind you go under first. The most vertical of the six. | ch.242, drowning while Kenjaku paddles out |
| **THE WRONG WAY** | 工場 | a conveyor running against you with crates dropping onto it. The only scene that punishes standing still directly. | the oldest gag in physical comedy |
| **DO NOT LOOK DOWN** | 屋上 | five rooftops with real gaps, and his own enormous foam finger sweeping across the middle three. | his RT, turned into level geometry |

Every scene is built to the game's actual movement numbers rather than by eye:
jump velocity 8.6 against gravity 26 gives a 1.42 m apex and 0.66 s of airtime,
so **nothing steps up more than 1.20 m and no gap is wider than 2.20 m**. A
scene you cannot physically clear is a bug, not a challenge. Everything that
moves is a hazard entity, never a collider — getting clipped by a cab costs chip
damage and throws you back down the corridor, it does not end the run. Only the
clock does.

**Difficulty is his COMEDY METER at the moment he casts it.** The tier sets the
clock on every scene (5.0–6.0 s cold, 3.8–4.6 s at KILLING) and is printed on
the title card.

| score | outcome |
| --- | --- |
| **3 of 3** | they got out. 6 chip damage, applause, and Takaba visibly sulks. |
| **2 of 3** | 34 damage |
| **1 of 3** | 62 damage — likely near death |
| **0 of 3** | **INSTANT KO** — routed through the shared category, so it bypasses Hakari's Jackpot healing and is resisted *by chance* by Mahoraga's adaptation, exactly as Mahito's transfiguration and Higuruma's execution already are. Confetti, a fanfare, and Takaba genuinely delighted. |

**It is a movement check the opponent can win outright**, and unlike a domain
there is nothing to break — you just have to run. The whole run is scored on the
HUD live: a progress bar down the corridor, the scene clock, and three lamps.

Measured against the CPU contestant over 99 scenes: at OPEN MIC it has never
killed and nearly nine in ten walk out clean; at WARMING UP it kills one time in
eight and half get out; at KILLING it kills a bit under half the time and one in
nine still gets out. A human who has seen the scenes should do better than the
bot at all three, which is the direction a skill check ought to be wrong in.

## Stages

Ten locations, chosen on a screen between character select and the fight, each
with a **live 3D preview** built from the same code the match runs.

| Stage | Size | Levels | Identity |
| --- | --- | --- | --- |
| **SHIBUYA STATION** 渋谷駅 | 68 × 52 m | Track pits / platform / concourse / street stub | The signature location. Tile, concrete, square pillars in rows, ticket gates, escalators, cold fluorescent. |
| **SCRAMBLE CROSSING** | 90 × 80 m | Sunken plaza / street / pedestrian deck | Night, neon, rain. The widest open floor and four enterable storefronts. |
| **SENDAI COLONY SCHOOL** | 80 × 68 m | Pool hall / ground / upper / roof | Gymnasium **over** the pool hall — break the gym floor and the fight goes swimming. Water reacts to combat. |
| **TOKYO JUJUTSU HIGH** | 84 × 76 m | Courtyard / hall / roof / terrace | Warm daylight, timber halls with a real interior, stone steps, cedar forest. |
| **EISHU DETENTION CENTER** | 72 × 64 m | Ground / walkway / gallery | Derelict, flooded, moonlight through a broken skylight. Half the walkway has already fallen in. |
| **SHINJUKU** | 110 × 96 m | Street / arcade / overpass / podium roof | The biggest map by area, for the heaviest fights. The overpass can be brought down. |
| **KYOTO EXCHANGE GROUNDS** | 90 × 84 m | Stream / clearing / bench / plateau / crag | The only natural map. All the vertical is terrain — no architecture at all. |
| **TOMBS OF THE STAR** 星漿体の廟 | 78 × 70 m | Tomb / approach / terrace / hall roof | A torii-lined climb by moonlight with a buried stone corridor under the shrine. Wide-open and claustrophobic stacked on the same footprint. |
| **YASOHACHI BRIDGE** 八十八橋 | 98 × 66 m | Riverbed / deck / truss walk | The only **linear** map: a 60 m span with a drop off both sides. The low ground is the wide ground and the high ground is the choke. |
| **THE SEWER** 下水道 | 56 × 52 m | Channel / ledges / gallery | Mahito's junction. The smallest and lowest-ceilinged map here — three tunnels, a water course and no room to run. |

The old single arena was a 21 m circle (~346 m²). The smallest of these is
**8× its floor area**; Shinjuku is **30×**.

**Every walkable surface on every map is reachable on foot from the spawns.**
That is not a claim, it is a check: `src/arena/mapshot.js` renders the whole set
from each map's own beauty-shot camera, and a flood fill over `Bounds.floorAt`
from the spawn points has to touch every named platform on all ten. It was added
because it found real faults — stairs whose collider sloped the opposite way to
their own steps, flights buried inside the slab they climbed to, railings run
straight across the head of their own staircase, and two rooms that could be
seen and never entered because the map's single ground plane paved over them.

### Destruction

Every environment object that plausibly could break, breaks, and nothing simply
vanishes: each runs **INTACT → CRACKED → DAMAGED → DESTROYED** with its own
geometry at each stage — fissures appear, chunks fall off and shift out of
alignment, and the final stage swaps the prop for rubble.

**Structure changes the level.** A destructible can own collision ids; killing it
kills them, so a blown wall really is a new route and a dropped pillar really
does take the floor section it was carrying down with it (on a short delay, so
the collapse reads as a collapse).

Damage sources: heavy attacks, **launched bodies hitting geometry**, every
cursed technique, and the domains — Jogo's magma scorches, Gojo's Red shatters,
and **Hollow Purple erases a channel through anything in its path** regardless
of how much health it had.

Debris is pooled, settles, then **freezes** (stops simulating entirely while
staying on screen) and finally recycles oldest-first against a hard budget.

### Seeing past the level

On ten multi-level maps the fight regularly happens with a pillar, a standing
train, a colonnade or the underside of a walkway between the camera and the
fighter. The chase camera already pulls itself in when it would end up *inside*
geometry, but that is the wrong tool here — pulling in just puts the lens on the
near side of the same pillar.

Instead, **level geometry between a camera and the fighter that camera is
following dissolves** (`src/art/shaders/xray.js`). Every map material carries a
cone test in its fragment shader: the subject's position is uploaded in view
space, so the camera is the origin, and any fragment inside the cone from the
camera to the subject — and nearer than the subject — is dropped on a 4×4
ordered dither. That gives a screen-door fade with no transparency sorting, no
second pass and no change to how anything is batched, which matters because the
maps merge their static geometry into one mesh per material: there is no
per-pillar object left to fade, so the cut has to be per-fragment.

The cut is a *cone* rather than a cylinder so the hole holds a constant size on
screen, and it stops short of the subject so the floor they are standing on is
never punched through. The roster's materials deliberately do not carry it —
cutting a fighter would mean the subject's own body dissolving. It is aimed
per-eye, immediately before each view draws, so split screen works.

### Graphics quality

**F4** cycles LOW / MEDIUM / HIGH / ULTRA. The art is identical at every level —
what changes is destruction detail, debris budget, particle density, detail
draw distance, the post stack and render resolution.

## Settings

The **⚙ button** in the corner bar, or **SETTINGS** in the pause menu. Choices
are saved to `localStorage` and restored on the next launch.

| Setting | Default | What it does |
| --- | --- | --- |
| **VIDEO FILTERS** | **OFF** | The old-TV pass: scanlines, film grain and the heavy vignette over the whole frame. Off by default — the cel shading, bloom and per-map colour grade are the art direction and are *not* affected by this. |
| **GRAPHICS QUALITY** | HIGH | Same profile F4 cycles. |
| **MUSIC** | ON | Same toggle as M. |

## Local multiplayer

**Every connected controller picks its own fighter at the same time.** In any
local mode each seat gets an independent cursor on the roster strip, coloured
per player (P1 blue, P2 red, P3 green, P4 yellow), its own hero panel on the
left/right edges for the first two seats, and its own lock-in — one player
committing does not stop the others browsing, and a locked player can back out
with B until everyone is in. The screen starts the match the moment the last
seat locks.

VS CPU stays sequential, because one human is making both choices.

Seats without a device of their own (a third seat with only two pads) fall back
to being driven by everything connected, so a short-handed couch can still get
into a match.

## Lives

Each player has **3 lives**. A K.O. costs every downed fighter one life and
starts the next round — health, cursed energy, stamina, buffs, backlash, copies and
juggle state all reset, positions return to the start, and the fight music
plays straight through. Lose all three and the match ends on the result
screen. The life pips sit next to each name plate; spent stocks go hollow.

## Music

Streamed tracks live in `public/music/`. Along with the site icons in
`public/brand/`, they are the only non-procedural assets in the project —
everything the game itself draws is built in code:

| File | Plays during |
| --- | --- |
| `menu.mp3` | Mode select, character select, and the result screen |
| `fight.mp3` | The match — first half of the fight rotation |
| `fight2.mp3` | The match — second half of the fight rotation |
| `fight_domain.mp3` | Swapped in while a domain stands, and back out when it falls |

**The fight music is a rotation, not a track.** `fight.mp3` plays to the end,
`fight2.mp3` follows it, then back to the first, for as long as the match lasts.
Nothing outside `src/audio/music.js` knows about it: the match still asks for
`'fight'` and the `PLAYLISTS` table resolves that to whichever song the rotation
is on. Playlist members are the only tracks that do **not** loop — they have to
be allowed to end so the handover can happen — and a domain going up mid-song
parks the rotation where it is and resumes it when the barrier falls.

Everything crossfades, ducks under the pause menu, and toggles with **M** or the
♪ button in the top-right bar. Swap in any other MP3s under the same names and
nothing else needs to change — `src/audio/music.js` reads only those paths.

`music.js` guarantees **at most one track is ever audible**. Three things
enforce that, and each fixes a way the soundtrack could otherwise double up:
a single-instance guard retires any previous `Music` (a hot reload or double
boot would otherwise stack a second soundtrack), a post-fade sweep parks every
non-current track, and a `visibilitychange` handler silences the music
whenever the tab is in the background — **so having the game open in two tabs
no longer plays two songs at once**; only the tab you are looking at has
audio.

> The supplied `menu.mp3` is a Jujutsu Kaisen soundtrack rip. That is fine for
> local personal use, but it is copyrighted and is **not** clearable for
> distribution — replace both tracks with original or licensed audio before
> publishing this anywhere. Everything else in the project is original.

## The resource system

- **MAX_CE** — the bar's ceiling. Landing punches raises it (cap 100) and
  refills CURRENT_CE to the new max.
- **CURRENT_CE** — spent by techniques; MAX_CE never drops from spending, so
  the bar stays long but partly empty, exactly like Cursed Clash. Slowly
  regenerates up to MAX_CE.
- **Stamina** — dashing and blocked hits drain it; empty = no dash and guard
  break. Regenerates when not dashing/blocking.

Domain rules implemented: innate barrier + environment swap, **sure-hit that
bypasses hitbox resolution**, full-bar cost + post-domain **backlash** (CE
regen halted, MAX growth halved), a capped duration with **barrier integrity**
(Unlimited Void 7s — total lockdown is the strongest effect in the game, so it
is paid for in uptime; Authentic Mutual Love 20s), early release on a second
press of the domain button (the backlash is still owed),
**Barrier Break** (LT+D-Right channel), **Simple Domain** (LT hold, Nanami's is
the strongest), and **Nanami has no domain** — his ultimate is the non-domain
burst **Collapse** with faster startup.

### Domain Clash

Firing your domain into a standing one does not resolve instantly. Both
barriers lock and **neither domain holds** — a **5-second contest** opens in
which both sorcerers are free to fight, framed side-on so both barriers read.
**Whoever takes the least damage across those 5 seconds wins**, and the
winner's domain is the one that rises (on a barrier worn to 75% by the
clash). The loser's barrier shatters: backlash plus a guard-break stagger.

The clash is framed on the normal over-the-shoulder camera, same as the rest
of the fight. The HUD shows a countdown and a live damage tally, highlighting
whoever is currently ahead. An exact tie — commonly 0–0 if neither hits — falls
back to domain refinement (Gojo's Unlimited Void is the most refined), then
remaining CE, then HP. Because damage is the primary criterion, a less refined
domain can absolutely win: Yuta beats Gojo outright if Gojo eats the exchange.

## File layout

```
index.html
workbench/index.html      second page: the developer workbench (/workbench/)
vite.config.js            dev server + /__shot screenshot sink (dev only),
                          and the two-page build input list
public/                   copied to the build root verbatim
  music/                  the four streamed tracks (see Music)
  brand/                  favicon set + web manifest, linked from both pages.
                          Referenced as /brand/... so Vite rewrites them
                          relative to each page for the sub-path deploy
src/
  main.js                 entry: #viewer -> model viewer, else game
  workbench/
    main.js               bench router: ?edit=<bench>, defaults to finishers
    finishers.js          the finisher bench: winner / loser / map / entry
    run.js                builds a real match, wins it on frame zero, plays the
                          finisher full screen, tears it all down again
  core/
    loop.js               fixed 60Hz logic, interpolated render
    stage.js              renderer, bloom/vignette/grade post stack, lights
    camera.js             soft-lock fight camera, FOV punch, shake, cinematics
    match.js              round orchestration, hitstop, KO flow
    ritual.js             the Mahoraga summon cutscene: beats, shot list,
                          hand signs, the shadow gate, the swap
    game.js               select -> match -> result flow
    mathutil.js
  input/input.js          gamepad + keyboard, deadzones, hot-plug, edges
  combat/
    fighter.js            fighter FSM, physics, resources, juggle/OTG
    hits.js               melee windows vs capsules, damage pipeline, crits
    effects.js            technique dispatcher + timed entities (Blue, beams)
    ai.js                 CPU: spacing, strings, blocks, domain counters
    shikigami.js          the Ten Shadows: 6 creatures, per-species AI, loss ledger
    adaptation.js         Mahoraga: categories, interval, roll, cap, HUD data
    instantko.js          the shared INSTANT_KO category (transfiguration + execution)
    judgeman.js           Higuruma's shikigami + the evidence system
    taunts.js             the taunt list, the rules dials, CPU weighting
    charge.js             Kashimo's CHARGE: the tiers, the build/decay table,
                          and the three scalars every electric move reads
    cores.js              Panda's THREE CORES: the multi-pool health system,
                          and the note on why `res.hp` is an accessor
  domains/domains.js      barrier lifecycle, sure-hit, clash, break, backlash
                          + Chimera Shadow Garden (open domain: spread, dents, travel)
  domains/swordrain.js    AML katana field: volley, pickup, highlight, refill
  domains/sentencing.js   Deadly Sentencing: the sword, the execution duel,
                          and all three endings
  arena/
    index.js              map registry, per-map light rig + grade, quality profiles
    bounds.js             platforms / ramps / wall colliders, floorAt, camera sweep
    kit.js                the shared map vocabulary + canvas textures + batching
    destruct.js           staged destruction, structural collapse, pooled debris
    arena.js              legacy single arena (kept for makeGlowMat + reference)
    maps/                 shibuya_underground · shibuya_crossing · sendai_school
                          jujutsu_high · detention · shinjuku · kyoto_grounds
                          star_tomb · yasohachi_bridge · sewer_lair
    mapshot.js            DEV ONLY: contact sheet of every map, to the /__shot sink
  art/
    rig/rig.js            shared bone hierarchy, chain-weighted skinning
                          (+ optional extra bones: Sukuna's second arm pair)
    rig/springs.js        verlet spring chains (hair/coat/tie)
    builders/geo.js       lathe/tube/ribbon/spike/extrude toolkit
    builders/humanoid.js  proportion system + shared body assembly
    shaders/toon.js       banded cel shading + rim + warm/cool split
    shaders/outline.js    skinned inverted-hull outlines
    models/gojo.js yuta.js megumi.js nanami.js yuji.js todo.js rika.js
    models/sukuna.js      the King of Curses: four arms, four eyes, tiered
                          markings that spread with the Finger stacks
    models/shikigami.js   the six shadow constructs (own rigs + animators)
    models/mahoraga.js    the Divine General: skull, Dharma wheel, plating, blade
    anim/base.js          shared clips (movement, reactions, punch string)
    anim/gojo.js yuta.js nanami.js yuji.js todo.js   per-character technique clips
    anim/sukuna.js        the full base set re-authored for four arms
    anim/mahoraga.js      his clip set, re-authored at 3.6 m (mass, not speed)
    anim/ritual.js        Megumi'"'"'s eight hand signs + the incantation clips
    anim/player.js index.js          clip compiler + crossfade player
  characters/
    schema.js             config schema + defaults (documented)
    gojo.js yuta.js nanami.js yuji.js todo.js sukuna.js index.js
    yuta_swords.js        AML weighted technique table (data-only, retune here)
    mahoraga.js           summon-only config: moveset, mass, adaptation tuning
  fx/fx.js domainfx.js    particles, sparks, domain environments
  fx/bubble.js            anime speech bubbles: drawn shape, camera-facing,
                          distance-clamped, readable through every domain grade
  ui/hud.js select.js mapselect.js screens.js debug.js style.css
  audio/sfx.js            all-synthesized sound
  viewer/viewer.js        turntable model viewer (#viewer)
```

## Adding a character

Four files, using `newguy` as the placeholder id:

1. **Model** — `src/art/models/newguy.js`: call `buildHumanoid(spec)` with your
   proportions (height, shoulder/hip width, bulk, palette), add outfit/hair
   geometry to the `PartBag` (slots: skin/cloth/hair/metal/flat), define
   spring chains + props, return `finalizeModel(ctx, …)`.
2. **Anim** — `src/art/anim/newguy.js`: export technique clips (`ct1`, `ct2`,
   `domainCast`/`ult`, `victory`); the base set (movement, punches, reactions)
   is inherited and retargets automatically over the shared skeleton. Register
   in `anim/index.js` `CHAR_CLIPS`.
3. **Config** — `src/characters/newguy.js`: `withDefaults({ id, stats, punches,
   heavy, ct1, ct2, special, ultimate, domain|null, … })` — the schema is
   documented in `schema.js`. Frame data lives here, not in code. **Mind the
   slot convention**: RB (`ct1`) takes the pair's furthest-reaching technique,
   RT (`ct2`) the strongest, B the signature special and any summon. It is a
   convention, not an assertion — the roster's four kinds of exception, and
   what to do if your character is one, are written up under THE SLOT
   CONVENTION in `schema.js`.
4. **Register** — add to `ROSTER` in `src/characters/index.js`. Done: select
   screen, viewer, CPU and domains pick it up.

## Canon notes / approximations

- **Yuta's Authentic Mutual Love** runs a sword-pickup random-technique
  payload (modeled on Jujutsu Shenanigans, superseding the earlier
  manga-accurate imbue version): a volley of 6–8 katanas rains down and
  embeds across the field; Yuta starts unarmed (weakened punches), auto-picks
  a blade up by running into it (speed bonus + carry run while armed), and
  lands a committed lunging slash — **the sure-hit fires on connection**: the
  slash can be whiffed, but once it lands one technique rolls off a seeded
  weighted table (`src/characters/yuta_swords.js`) and applies in full,
  unblockable. The sword shatters on hit; when the field runs dry a small
  refill volley drops. Counters are the standing domain framework only:
  barrier break, his opponent's own domain, or Simple Domain (checked at the
  moment of connection). Debug: F6 forces the next roll, seed shown in F3.
- Unlimited Void deals no direct damage: total input lockdown + a lingering
  speed debuff after collapse; Gojo's damage comes from hitting a helpless
  opponent.
- **Yuji has no innate technique and no domain** (canon): Divergent Fist and
  Manji Kick are reinforced physical strikes, Black Flash is a player-timing
  input rather than a random proc, and Sukuna's Manifestation is a costed
  transform (recoil + regen blackout at the end), not a domain.
- **Kashimo has no domain** (canon), and neither does **Panda** (he is a
  cursed corpse). Both sit with Nanami, Yuji, Todo, Toji, Hanami, Kurourushi,
  Choso, Nobara, Geto and Naoya on a burst ultimate.
- **Kashimo's CHARGE meter is not canon.** Canon Kashimo has no movement
  resource; the meter is the mechanic invented to turn "converts cursed energy
  into electricity" into something a player operates. What IS canon is the Nyoi
  Staff working as a lightning rod, Mythical Beast Amber transforming the body,
  and the technique being once in a lifetime — that last one is deliberately
  *not* implemented as once per match, because no ultimate in this project is,
  and making his the sole exception would be a balance outlier dressed as
  fidelity. What survives of the cost is the standard backlash.
- **Kashimo's lightning is VIOLET, not blue-white**, and that is the one
  deliberate departure from his design. His canon blue-white lands directly on
  Gojo's #7fd0ff; #a46bff is clear of Gojo's blue, of Geto's dark plum and of
  Todo's magenta. His cyan stays on the model, so the arcs are violet and the
  man is cyan.
- **Panda's third core is a TRICERATOPS**, and it is the sister. Canon
  specifies the identity precisely and the BODY ("more slender", a wide
  Triceratops head) but says almost nothing about how she fights — the form has
  never been shown doing anything. So she is built as the mobility stance,
  which is the one answer that agrees with both the fiction and the roster's
  needs: a slender body is a fast body.
- **Megumi's Chimera Shadow Garden is deliberately incomplete** (canon): no
  enclosing barrier and no sure-hit, priced below a finished domain and running
  longer in exchange. The refinement stat is set to 3 so a tie-break loses to
  every complete domain in the roster. See [Megumi and the Ten Shadows](#megumi-and-the-ten-shadows).
- **Shikigami loss is permanent within a round** (canon), and is tracked per
  *owner* — so a shikigami Yuta borrows through Copy is never Megumi's to lose.
- **Todo has no domain** (canon): Boogie Woogie is spatial control, not a
  barrier. His swap works inside other people's domains because it is an
  exchange within the barrier — nothing crosses it — while Gojo's teleport is
  a true warp and stays sealed. His ultimate, **BROTHERHOOD**, is a non-domain
  swap-barrage: five clap-blinks around the target ending in one enormous
  finisher with the full camera treatment.
- **Higuruma's Deadly Sentencing is modelled on the Jujutsu Shenanigans
  version, not the manga** (deliberate, exactly like Yuta's AML above). There
  is no trial, no verdict and no cursed-technique confiscation *inside* the
  domain: the barrier grants the Executioner's Sword, the sword sets up one
  execution attempt, and a two-sided button duel decides it. Confiscation
  exists in his base kit instead, as a technique-button lock. Duration is the
  project's standard 20 s — research surfaced the ~1 minute Executioner's Sword
  state that game reaches *through* the domain, but nothing reliable on the
  barrier's own uptime, so the house number stands rather than a guess dressed
  up as a source.
- **Malevolent Shrine has no barrier** (canon) and keeps its sure-hit anyway.
  It is the only domain in the game that does not pay for the guarantee, and
  that asymmetry is deliberate: what it gives up instead is that the opponent
  can simply leave the radius. Barrier Break is a no-op inside it (there is no
  barrier), Simple Domain is not, and the radius is tuned per map so there is
  always somewhere to run to. See [SUKUNA](#sukuna-両面宿儺).
- **Sukuna's Reverse Cursed Technique is a slow regen, not a floor.** It cannot
  bring him back from zero and it is not a Jackpot-style damage refund — 0.65
  hp/s, capped at his starting health, halted during backlash, and irrelevant to
  an INSTANT KO.
- **Cleave against Mahoraga**, who has no cursed-energy system, uses a flat
  value rather than its MAX_CE scaling: the technique adjusts to what it is
  cutting, and against a body with nothing to read it simply cuts.
- **Judgeman does not fight** (canon): it is impartial, its eyes are sewn shut,
  and in this game it only ever gathers evidence. It can be destroyed for it.
- **Mahoraga cannot be summoned with a hand sign** (canon): every other
  shikigami answers a gesture, and he needs a ritual and a spoken incantation —
  which is why the input is a domain cast interrupted rather than a slot on the
  wheel. The incantation is the canonical one (布瑠部 由良由良, the *furu no
  koto* Ten Sacred Treasures chant). The **eight** hand signs are an invention
  on a canon frame: the source shows a ritual gesture, not an enumerated mudra
  chain, so the count is tied to the eight handles of the sword and the eight
  spokes of the wheel, and each pose is a real Buddhist mudra.
- **Mahoraga has no soul to reshape**, so Idle Transfiguration does not apply to
  him — the same ruling this project already makes for Megumi's shikigami
  inside Mahito's domain. See [Mahoraga](#mahoraga-魔虚羅).
- **Mahoraga has no domain and no ultimate** (canon). He also has no self-damage
  of any kind: no drain, no decay timer, no chip, no recoil, no expiry. What he
  costs is Megumi's remaining health and Megumi's Domain Expansion.
