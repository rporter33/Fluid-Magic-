# Battle view v4: the overhead stage

2026-10-22. This is replacement spec text for `docs/12-battle-presentation.md`, written for the owner's direction of
2026-10-22 (`docs/design/visual-references.owner-direction.md`, binding):

> Battles: the overhead three-quarter view with massed formations, one figure per soldier where the count allows, big
> monsters at their true size, visible volleys, terrain features in the scene, the unit card bar, and hover cards with
> hitpoints and morale. This replaces the side view in `docs/12` S2.4 and S4 before those stages are built; the
> per-blow truth of S1 and the timeline, pacing, sound and HUD rules stay unless the new view needs them changed.

It replaces these parts of docs/12:

- S2.4, the stage layout;
- S2.5, the proxies;
- the parts of S2.8 that depend on the side view;
- S4.3, the scene graph, and S4.4, the placeholder art;
- S4.6, the HUD.

Everything else in docs/12 stays: S1's per-blow truth, the fallback, the timeline and time map, the pacing targets and
the 150 s cap, sound, the view filters, the panel and the Report. Section 15 lists every place where the new view needs
a change outside those parts, and says why.

The screenshots are references for direction only. Nothing here copies their art, models, layouts, names, symbols or UI.
The other game is not named in this file and must never be named in an image prompt.

Inputs: `visual-v4/refs-analysis.md` (what the references show, measured), `visual-v4/research-tech.md` (the Pixi 8
bench), docs/04, docs/07, docs/09, docs/12, `docs/design/units-and-items.md` A.3 (the size ladder), and the measurements
in section 1. Nothing in the repository was edited.

---

## 0. The design in twenty points

1. **The camera.** A fixed orthographic three-quarter view: pitch 40° above the ground, yaw 30°. The camera never
   rotates and has no perspective. On screen the battle axis rises to the upper right at 48°, and the line where the
   fronts meet (the seam) falls to the lower right at 20°.
2. **The player is always the near side,** at the bottom left of the screen, facing up and to the right. The enemy is
   the far side, at the top right. This replaces "the player is always on the left".
3. **Rows are depth bands.** Each side's front, middle and rear rows sit one behind the other, measured from the seam.
   A side's bands are 48 wu apart, and the two fronts start 280 wu apart.
4. **Lanes are lateral slots.** The blocks of a row stand side by side along the seam, the largest in the centre and
   then alternating right and left. Both sides use the same order, so the two largest blocks face each other. Lateral
   placement is cosmetic and carries no rule.
5. **One figure per troop.** Up to 750 standing figures per side, a device-independent content number taken from the
   bench. In 3,066 measured AI battles the largest side was 293 troops, so every one of them drew literally. Above the
   cap the D1 proxies (`visible()` with dynamic files and ghost bodies) take over, with each squad's cap set by its share
   of the 750.
6. **Formation shapes are content, by kind:**
   - line and heavy infantry in blocks 2 to 8 ranks deep;
   - archers in loose, staggered lines 1 to 3 deep;
   - skirmishers in a screen;
   - cavalry in wedges;
   - beasts in packs;
   - flyers in a cloud 40 to 140 wu up, with shadows on the ground;
   - monsters as single bodies.
   A block shrinks from the back: when a figure falls, the figures behind it in its file step up.
7. **Monsters stand at their true size on the size ladder:** a size-6 body is 6× a man's height, a size-4 one 3.4×.
   Each has a large soft shadow. Big bodies are the only figures allowed full chroma. Figures they hide are drawn as
   see-through silhouettes, so a block's count never hides behind a monster.
8. **Every death leaves a body** (or the death mark of a bodiless unit) where the figure fell. Bodies stay until the end
   of the battle.
9. **Who strikes whom.** In detailed mode the struck figure is still the real target. The mechanism is new: the
   presentation can swap which troop a figure stands for, but only between two unmarked figures of the same squad, so
   the swap cannot be seen.
10. **Duels and press blows.** Squads whose fronts touch on the seam fight as duels between the real figures. Every
    troop in an engaged row attacks random troops of the enemy's engaged row, so some pairs do not touch. Their blows
    are **press blows**: the target reacts and falls, and no figure of the wrong squad is drawn striking it.
    - Measured: 94.8% of melee attack mass falls between touching pairs.
    - Commanders and bodies of size 3 or more move along the seam to their foes, so their blows are always duels.
11. **The seam.**
    - At contact both fronts close their lateral gaps.
    - A wider front's overhanging files wheel in around the narrower front's ends, because every troop in the engaged
      row fights.
    - The seam is pushed up to 30 wu toward the side that is losing.
    - When a side's front row empties, the enemy's engaged blocks march into the next band.
    - Routers fan out toward their own edge.
12. **Volleys are literal.** Every real shot is one arrow (D8), released within one ripple, so a squad's arrows fly as a
    band of dark dashes with shadows on the ground. Misses stick in the ground and kills stick in the body.
13. **Blood marks the seam.** Pools and splats are ground decals, and a churn stain darkens and reddens the band where
    the lines meet. Gore Off keeps the bodies as dark silhouettes.
14. **Terrain scenes follow A5.** The seven terrain grounds are muted and light (L\* 58 to 77) so the blocks read as
    silhouettes. Winter turns every ground to snow. A storm puts the fort wall at the seam.
    - Rivers, bridges, trees, cliffs and buildings stand only outside the field. Nothing suggests a chokepoint or cover
      that the sim does not model.
    - The storm wall is the one exception, because the sim models it.
15. **Spells are restaged for overhead:** rings on the ground, beams and lobs with ground shadows, and sky-falls that
    come from the light's direction. No text appears on the field.
16. **The camera frames the action.** It starts on the whole field and eases to each segment's focus box, at most 1.6×
    closer than the whole-field view. A size-1 figure stands 18 to 48 px tall. The player can pan and zoom (WASD, drag,
    wheel), and `Z` returns to the automatic camera.
17. **The HUD hugs the edges:**
    - a bar of unit cards for the player's side along the bottom;
    - a slim strip of the enemy's cards at the top left;
    - a transport cluster at the top right (round, play or pause, speed, Beats, skip, menu);
    - a hover card with name, a hitpoints bar, a morale bar and a status word.
    It covers 2.8% of a 1920 × 1080 screen in the median battle and 4.6% at the 90th percentile. The S4.6 docks, opened,
    covered 38%.
18. **The docks, the Log and the Report are one key away** (`[`, `]`, `L`). Floating numbers are off by default, and the
    ticker shows beats only.
19. **Placeholder art.**
    - Rank-and-file: procedural parts baked into one atlas of pose frames per battle, drawn as depth-banded
      `ParticleContainer`s.
    - Big bodies: one texture each on a deformed mesh.
    - Cards: commanders use the approved leader portraits; troops use their figure in a card pose.
20. **Determinism is unchanged.** All presentation randomness comes from `streamFor(battle, purpose)`, with one new
    purpose, `scene`. The automatic camera is a pure function of story time. The player's own pan and zoom is UI state,
    applied after it.

---

## 1. Measured inputs

### 1.1 Battle sizes in real games

These come from a copy of `src/` in the scratchpad, patched only to log each battle's setup inside `fight()`. The run
was 40 AI vs AI games (`runnerSetups(1, 40)`, 100 months, wilds on), with 3,066 battles. Scripts and data are in
`visual-v4/battle-tools/` (Appendix).

| Quantity | p50 | p90 | p99 | max |
|---|---|---|---|---|
| Troops on one side | 28 | 66 | 145 | 293 |
| Troops in both armies | 60 | 108 | 208 | 315 |
| Cards per side (squads + commanders) | 3 | 8 | 14 | 25 |
| Squads per side | 2 | 6 | — | 20 |
| Commanders per side | 1 | 3 | 4 | 7 |
| Largest squad | 16 | 34 | 52 | 62 |
| Squads in one row of one side | 1 | 4 | 7 | 13 |
| Unit types in one battle (both sides) | 5 | 8 | 10 | 13 |
| Rounds | 4 | 6 | — | 15 |

- **Terrain of the battles:** plains 28%, farmland 21%, forest 20%, hills 11%, wasteland 9%, swamp 7%, mountains 5%.
- **Defenders:** independents in 61% of battles.
- **Storms:** 0 in these games. The storm scene is for player storms and the `stormFort` fixture.
- **Big bodies:** Titan pretenders (947 appearances) and Giants (49).
- **What it means:** M1 battles are small. A literal figure per troop costs nothing at these sizes. The design problem
  is to make 30 against 30 look good, not to thin out thousands.

### 1.2 The layout model

`battle-tools/layout_model.py` applies the rules of sections 3 and 4 to all 3,066 battles. It lays out the formations,
bands and gaps, projects them, and frames the start view into the area of a 1920 × 1080 canvas that the HUD leaves free.

| Quantity | p10 | p50 | p90 | p99 | max |
|---|---|---|---|---|---|
| Widest row, ground wu | 240 | 354 | 684 | 1,226 | 1,600 |
| Field depth, both sides, ground wu | 632 | 691 | 775 | 834 | 948 |
| Size-1 figure height in the start view, css px | 33 | 40 | 46 | 48 | 48 (min 21) |

- **The 48 px clamp:** 5.5% of battles reach it. These are the small skirmishes.
- **Touching share:** at first contact, the share of melee attack mass that falls between squads whose fronts touch is
  94.8% on average. It is 100% in 68.5% of battles, 81% at the 10th percentile, and 27% at worst (a front of 7 blocks).
  Mass here is the expected number of attacks from each squad on each enemy squad, which is proportional to the two
  squads' sizes.
- **Two lines:** 6 of 3,066 battles needed a row wrapped into a second line (section 3.4).

**Yaw against figure size.** The start view's median figure height is 46 px at yaw 0°, 41 at 15°, 40 at 30°, 42 at 45°
and 46 at 60°. Yaw 30° costs 12% of figure size against a square-on view. It buys the diagonal composition, in which
fronts and depth show at once, and three-quarter figure views, which read better than straight front and back views.

### 1.3 The bench (from `research-tech.md`)

These are CPU times, update plus render, p50, with a `ParticleContainer`, one atlas and an insertion sort, in the full
stress scene: arrows, blood, one death a frame, and a monster.

| Figures | Desktop | Phone class (4× CPU throttle), p50 / p95 summed |
|---|---|---|
| 600 | 0.6 + 0.4 ms | 3.3 / 10.8 ms |
| 1,500 | 0.7 + 0.4 ms | 2.2 / 13.6 ms |
| 3,000 | 1.0 + 0.7 ms | 5.5 / 15.4 ms |

- **Draw calls:** 4 or 5 a frame.
- **Re-baking 8,000 decals:** about 8 ms of CPU.
- **Figure art:** procedural figures show their side's color 1.6× better at massed zoom (38% of a block's visible pixels
  against 24% for the generated painted sprites).

### 1.4 Value against the ground

Measured on the bench's own render (`bench/out/battle-1500-hd.png`), on sand at L\* 71.6:

| Block | Mean L\* |
|---|---|
| Cinder block | 40.5 |
| Thornwood block | 35.9 |
| Archer lines | 30 to 31 |

The references put armies at L\* 15 to 44 on grounds of 60 to 73. Section 3.8 turns this into a rule.

---

## 2. What stays and what goes

| docs/12 part | Status |
|---|---|
| S1 (detail sink, A1 to A5, `rerun`, `scene`) | kept, untouched; no sim change |
| S2.3 `prepare`, script, fallback synth | kept; `leftSide` is renamed `nearSide` |
| S2.4 stage layout | **replaced** by section 3 |
| S2.5 proxies | **replaced** by section 4; D1's hybrid applies only above the cap |
| S2.6 sampling | kept, with the mandatory set amended (section 5) |
| S2.7 pacing, the 150 s cap, Beats | kept; the intro's wording changes |
| S2.8 choreography | the side-view parts are **replaced** by section 6; reactions, death styles, the charge timeline, morale beats and commander deaths are kept |
| S2.9 impact grammar | kept; the seam churn is added and floating numbers are off by default (section 7) |
| S2.10 spells | storyboards **restaged** (section 8); beats, durations and trauma kept |
| S2.11 to S2.13 types, time map, `evaluateInto` | the time map is kept; coordinate and camera types change (section 9) |
| S2.14 view filters, S2.15 panel, ticker, Report, S2.16 break chance | kept; the ticker's on-field display changes (section 13) |
| S3 sound | kept; pan reads the projected X (section 15) |
| S4.2 renderer API | kept, plus `pick` and the user camera; `antialias: false` |
| S4.3 scene graph, S4.4 placeholder art | **replaced** by sections 11 and 12 |
| S4.5 effects as drawn | kept; auras become ground rings |
| S4.6 HUD | **replaced** by section 13 |
| S4.7 keys, S4.8 settings | amended (sections 13.8 and 14) |
| S4.9 budgets | amended (section 11.3) |
| S5 lab and Playwright, S6 integration | amended (section 16) |

---

## 3. S2.4 (replacement). The stage

### 3.1 Coordinates and projection

**Ground coordinates** are in world units (wu):

- `x` is lateral, positive to the near side's right;
- `y` is depth, 0 on the centre line, negative toward the near (player) side and positive toward the far side;
- `h` is height above the ground.

Every cue, keyframe and decal position in the timeline is a ground position; projectiles and flyers add `h`.

**Projection** (`src/present/battle/project.ts`, pure). It is orthographic, with pitch P = 40° and yaw ψ = 30°:

```ts
// screen-plane (world container) coordinates, before the camera
X = x·cosψ + y·sinψ                        =  0.866·x + 0.500·y
Y = (x·sinψ − y·cosψ)·sinP − h·cosP        =  0.321·x − 0.557·y − 0.766·h
// inverse on the ground (h = 0), for picking: Y' = Y / sinP
x = X·cosψ + Y'·sinψ;   y = X·sinψ − Y'·cosψ
export function toScreen(g: Ground, h?: number): { X: number; Y: number };
export function toGround(X: number, Y: number): Ground;
export function depthKey(g: Ground): number;   // Y at h = 0; larger is nearer the camera
```

- **On screen,** the near side's facing (+y) runs up and to the right at 48°. The lateral axis (+x) runs down and to the
  right at 20°. The near side fills the bottom left and the far side the top right.
- **Depth order** is `depthKey` of each figure's feet. Sprites are billboards: a figure's height does not change with
  depth.
- **Facings.** Four diagonal facings come from two baked views. `ne` is the back three-quarter view: the near side
  advancing and the far side routing. `se` is the front three-quarter view. Flipping gives `nw` and `sw`.

  | Movement | Facing |
  |---|---|
  | toward the far side (+y) | `ne` |
  | toward the near side (−y) | `sw` |
  | along the line, +x | `se` |
  | along the line, −x | `nw` |

- **Why these numbers.** The references measure 35° to 45° of pitch. At 40° the depth axis keeps 0.56 of its length and
  the lateral axis 0.87, so both ranks and files read. Yaw is discussed in section 1.2. There is no perspective, so
  picking and labels stay linear and Pixi stays 2D.

### 3.2 The figure and the size ladder

A size-1 figure is drawn **28 wu tall and 12 wu wide** in the screen plane, with its feet at the anchor. The art is
already foreshortened for 40°.

| Size (A.3) | Name | Height × size 1 | Height, wu | Footprint radius, wu | Small figures that crowd it |
|---|---|---|---|---|---|
| 1 | Man-sized | 1.0 | 28 | 6 | — |
| 2 | Large | 1.5 | 42 | 10 | — |
| 3 | Great | 2.3 | 64 | 16 | up to 4 |
| 4 | Huge | 3.4 | 95 | 24 | up to 6 |
| 5 | Colossal | 4.6 | 129 | 32 | up to 8 |
| 6 | Gargantuan | 6.0 | 168 | 44 | up to 10 |

- **Long bodies.** Quadrupeds, riders and serpents fit a box no wider than 2× their height; wyrms 2.6×. The Great Wyrm is
  168 wu tall and up to 437 wu long, about 15 men. A rider (size 2 once U1 lands) is 42 wu tall and 60 wu long.
- **Commanders** draw at 1.15× their size's height.
- **"True size"** follows the A.3 ladder. It is display only, and size already exists in content (`UnitDef.size`).

### 3.3 Bands: rows as depth

Each side's bands are measured from the centre line. All distances are ground wu.

| Item | Value |
|---|---|
| A side's front band begins at | 140 from the centre line (the fronts start 280 apart) |
| Band depth | the deepest block in that row: ranks × rank spacing |
| Gap between bands | 48 |
| Middle band begins | front band end + 48 |
| Rear band begins | middle band end + 48 (an empty row takes no depth) |
| Edge zone | 160 behind the rear band; routers leave through it |
| Field rect | lateral: the widest row's half-width + 120 on each side; depth: from edge to edge |

- **Rows keep their meaning.** A squad stands in its `row` band from the setup. `advance` moves a commander to the
  current front band.
- **Nothing moves a side into its own emptied band,** because no rule does.

### 3.4 Lateral slots: lanes along the line

- **Order.** The blocks of one row are sorted by starting troop count, descending, with ties in setup order. The first
  is centred on x = 0. Then they alternate: second to +x, third to −x, and so on. Both sides use the same rule in the
  same x frame, so the two largest blocks face each other. This is what puts 94.8% of melee attack mass between
  touching squads (section 1.2).
- **Spacing.** Blocks stand 24 wu apart before contact and 8 wu apart once engaged (section 3.6).
- **Long rows.** A row wider than 1,600 wu wraps into a second line, 40 wu behind the first, within the same band. This
  happened in 6 of 3,066 measured battles.
- **Commanders of size 1 or 2** stand alone in their row's band, 24 wu behind that band's blocks.
  - Laterally they stand at the mean x of their own squads.
  - Two commanders stay at least 40 wu apart.
  - Each stands on a base ring in its banner color, an ellipse of radius 18 wu with a 2 px line and a dark keyline. It
    is the only figure with a ring, so a leader reads as the lone figure on its ring.
- **Big bodies (size 3 and up)** take a lateral end of their row band, outside the blocks' frontage. This covers
  pretenders, summoned commanders and monster squads.
  - On the near side the end is the one where the body covers fewer of its own figures, because the near side's rear is
    nearest the camera.
  - On the far side it is the end with more open ground.
- **Summons** take the next free outer slot of `summon.row`. Their card slides into the bar.
- **Provincial defense** is a block under a plain banner in the owner's color. Its hover card says "Provincial defense".
- **The garrison** never fights and draws nothing (S2.2).

### 3.5 Formation shapes by kind

`UnitLook` gains `formation: FormationKind`. The fallback derives it from tags, weapons and size.

| Kind | Units (M1) | Ranks: target, min to max | Files × ranks spacing, wu | Jitter, wu | Look |
|---|---|---|---|---|---|
| `line` | militia, Light Infantry, Swamp Fighter | round(√(n/3)), 2 to 6 | 18 × 18 | ±1 | a wide rectangle, spears slanting together |
| `heavy` | Heavy Infantry, Cinder Warrior, Warden, Briar Guard, Flamebrand, Oakheart | round(√(n/2)), 3 to 8 | 18 × 17 (× size scale) | ±1 | a deep rectangle |
| `shock` | Berserker | round(√(n/2.5)), 2 to 5 | 22 × 22 | ±4 | a loose, ragged rectangle |
| `archers` | Archer, Flame Archer, Longbow Hunter | round(√(n/6)), 1 to 3 | 24 × 22, alternate ranks offset half a file | ±2 | loose lines |
| `screen` | Ember Skirmisher | round(√(n/8)), 1 to 2 | 30 × 26 | ±6 | a thin, open screen |
| `wedge` | Ash Rider, Wolf Rider | ranks of 3, 5, 7, … (a line when n ≤ 4) | 26 × 32 (× 1.3 at size 2) | ±2 | a point toward the enemy |
| `pack` | Wolf | round(√(n/2)), 2 to 6 | 22 × 22 | ±7 | a clump |
| `cloud` | Fire Sprite, Hornet Swarm, flyers | round(√(n/2)), 2 to 6 | 24 × 24 | ±6, plus altitude | a hovering cloud with shadows below |
| `body` | anything of size 3 or more, as a squad | one rank | 2 × footprint + 8 | 0 | single bodies in a loose line |

- **Files** = ⌈n / ranks⌉, capped at 48. The last rank is centred.
- **Spacing** scales with the size ladder's footprint ratio for size 2 and up.
- **Examples:**

  | Squad | Files × ranks | Size, wu |
  |---|---|---|
  | 20 Cinder Warriors | 7 × 3 | 126 × 51 |
  | 60 Wardens | 12 × 5 | 216 × 85 |
  | 60 militia | 15 × 4 | 270 × 72 |
  | 13 Longbow Hunters | 13 × 1 | 312 × 22 |
  | 40 Wolves | 10 × 4 | 220 × 88 |

- **Facing.** Every figure of a block faces the enemy along the axis (`ne` near, `sw` far), except routers, figures
  moving along the line, and big bodies facing their current foe.

### 3.6 The seam

**Contact.**

- Engaged front ranks stand 14 wu apart and interlock, as in S2.4.
- **Where they meet:**
  - a side still stepping when the other side closes halts and braces;
  - the closer covers the rest of the gap;
  - if both close in the same round, they meet halfway across what is left.
- During the contact charge each side's engaged blocks close their lateral gaps to 8 wu ("dress the line"), keeping
  their order. The two fronts stay centred on x = 0.

**Touching pairs.** Two engaged squads touch when their front ranks' x intervals overlap, or the gap between them is at
most 36 wu (two files). This is measured at the start of each melee window.

**Wrap.** When one engaged front is wider than the other by more than 2 files at an end, the overhanging files wheel
forward around the narrower front's end.

- At most 3 files deep, at 45°, never past the narrower front's last rank.
- They move during the contact charge (0.5 to 0.9 s).
- It is honest because every troop of an engaged row fights (docs/04 step 3). It implies no flank rule: there is no
  extra hit-stop, chip or morale cue, and the narrower block does not turn.

**Push.** The S2.4 rule moves to the depth axis.

- The seam's y moves by 30 wu × (kills dealt − kills taken) / (kills dealt + kills taken) over the last two melee
  phases, eased over 1 s, toward the side that is losing.
- Both fronts move with it.
- In a storm with the walls standing there is no push: the seam is the wall face.

**Advance into an emptied band** (docs/04: melee advances when its target row is empty). When a side's front row has no
active unit left:

- the enemy's engaged melee blocks march over the bodies, at their walk or run by speed, to 14 wu from the new front's
  first rank;
- the seam moves there.

**Cross-block blows.** Every troop of an engaged row attacks random troops of the enemy's engaged row, so squads that do
not touch also trade blows (section 1.2 gives the share).

- A shown blow between touching squads is a **duel**: the real attacker's figure strikes the real target's figure
  (section 4.3).
- A shown blow between squads that do not touch is a **press blow**:
  - the target figure reacts and falls at the front-rank seat nearest the attacker's block;
  - no figure of any other squad is drawn striking it;
  - the ticker, the Log and the lab's Detail tab name the real attacker.
- **Free movers.** Commanders and bodies of size 3 or more walk along their side of the seam toward the squad they
  strike or are struck by. Their positions are planned from the script, since the timeline is built after the battle.
  - They arrive at least 0.3 s before the blow's contact.
  - They move at most 2× their walk speed.
  - So their blows are always duels, and a commander's killer is always drawn.
- **The 6 featured strikes** of a phase come only from duels. A press blow keeps its score for ranking but is never
  featured.

### 3.7 Terrain scenes (A5)

**Grounds.** The ground is one muted, light surface, so blocks read as silhouettes against it. Within a patch its L\*
spread stays under 5.

| Terrain | Ground | L\* | OKLCH C | Inside the field | Outside the field (scenery) | Ambience |
|---|---|---|---|---|---|---|
| plains | #A8A784 dry grass | 67.7 | 0.049 | tufts, a few pebbles | shrubs, low hedges far off, a road and bridge 30% | grass ripple |
| farmland | #B4A27E stubble | 67.3 | 0.054 | stubble rows at 30° to the axis, ±3 L\* | fences, haystacks, a farmstead, a river and bridge 35% | churn under feet |
| forest | #938E70 leaf litter, a clearing | 58.7 | 0.043 | litter, twigs | canopy masses ringing the clearing; a brook 20% | falling leaves |
| hills | #A39276 short turf | 61.4 | 0.044 | turf, small stones | shaded hills, outcrops; a stream 25% | wind |
| mountains | #A2A6AA scree | 67.9 | 0.007 | scree, snow flecks | cliffs, peaks, a torrent 30% | snow flurries |
| swamp | #8E8E78 mud, puddles #66706F | 58.5 / 46.4 | 0.032 | puddles up to 24 wu across, 6% cover or less, balanced ±10% between the two halves | reeds, dead trees, channels 50% | corpses sink 30% |
| wasteland | #B0A6A2 ash and cracked earth | 68.8 | 0.013 | cracks, ash drifts | dead stumps, a dry bed 10% | dust devils |
| winter, months 11 to 2, any terrain | #B9BDCB snow (swamp: #A9AEB4 ice crust) | 76.7 / 70.9 | 0.020 | footprint tracks, drifts | the terrain's scenery, snow-capped | breath puffs, snow |
| autumn, months 9 and 10 (plains, farmland, forest) | leaf patches #A8906A over the ground | 61.1 | 0.060 | leaf patches | turned trees | falling leaves |
| storm (fort) | #958B7F trampled approach and courtyard | 58.4 | 0.021 | the fort wall at the seam (below) | towers beyond the wall's ends; the keep and roofs behind | smoke |

**Grounds are not terrain fills.** The terrain is named in the header chip and the hover card, so docs/09's
distinct-colors rule does not apply to grounds. Grounds must meet section 3.8 instead.

**Placement of features**, so that nothing suggests a chokepoint or cover the sim does not model:

1. **Inside the field rect** there is ground detail only. No object is taller than 6 wu (under a quarter of a figure),
   and details are scattered by Poisson disk at 30 wu or more, so they never form lines.
2. **Rivers, roads, bridges, trees, cliffs, rocks taller than 6 wu and buildings** stand only outside the field rect plus
   an 80 wu margin.
   - Rivers and roads run either parallel to the seam beyond a side's edge zone, or across a corner.
   - A river or road never passes between the two sides.
   - A bridge stands only on such a river.
3. **Swamp puddles** are the only water inside the field. They are small, spread evenly and balanced between the halves,
   so no corridor and no favoured side appears.
4. **Forest is a clearing.** The terrain's defense bonus is a stat (`Forest +1 def` in the defender's hover cards), not
   cover, so no tree stands among the troops.
5. **The fort in a storm** (`scene.storm`) is the one feature at the seam, because the sim models it (+3 prot and +2 mor
   to defenders, +6 prot while walls stand).
   - **Walls standing.** The wall runs across the whole field width plus 200 wu at each end, with its outer face on the
     seam.
     - The defender's front row stands on the wall walk, 40 wu deep.
     - The defender's middle row stands on a firing step behind it, 40 wu deep.
     - The rear row stands in the courtyard.
     - Attackers press at the wall's foot with ladders.
     - If the defender's front row empties, the attackers climb onto the walk (section 3.6, advance).
   - **Walls down.** The wall is a line of rubble along its whole length, with a breach that spans the engaged frontage
     plus 2 files at each end. The fight runs across the rubble.
   - No gate stands inside the field rect. A gatehouse may stand beyond a lateral end.
6. **Scenery** comes from `streamFor(battle, 'scene')` and is drawn once into the ground texture.

**Time of day.** Dawn, day or dusk comes from the battle id's hash, as before. It is applied as a grade in the world's
`ColorMatrixFilter`: dawn +6% red and −4% blue, dusk −10% value and +4% blue. One light falls from the upper left in
every scene, as on the map. Figure shadows are baked toward the lower right.

### 3.8 The value and chroma rules (new; `tests/content/presentation.test.ts` and the lab)

1. **Grounds:** L\* 58 to 78 and OKLCH C at most 0.06, in every terrain and season. A content check.
2. **Figures against ground:** every block's mean L\*, figures and the gaps between them at formation spacing, is at
   least 15 below its ground's L\*, for every terrain × season × nation and the independents.
   - Measured on the baked atlas in the lab.
   - The bench gives 31 to 42 below on sand.
   - Every figure frame has a dark keyline (#1C1A17, 60%, 1 px at 1×), which carries the silhouette even where cloth is
     light.
3. **Troop cloth** uses the side's banner hue at L\* 35 to 55 with OKLCH C at most 0.16. For example, Cinder #C4532C (L\*
   49.6, C 0.154) and Thornwood #1F6A50 (L\* 39.9, C 0.084).
   - Chroma above 0.16 is reserved for big bodies, spell and fire light, and selection.
   - This keeps one deliberate saturated element per scene, as the references do.
4. **Banners** keep docs/09's distances: all eight differ by 28 or more for normal vision and 16.7 under the
   deficiencies.

---

## 4. S2.5 (replacement). Figures that are troops

### 4.1 The cap

```ts
// content/presentation/layout.ts
export const PRESENT_LAYOUT = { literalCap: 750, /* per side, standing figures */ ... };
// proxies.ts
/** Figures for a group: literal below the side's cap; D1's visible() above it. */
export function groupCap(start: number, sideStart: number, literalCap: number): number {
  if (sideStart <= literalCap) return start;                       // literal
  return Math.max(Math.min(start, 5), Math.floor((literalCap * start) / sideStart));
}
```

- **The number.** At 1,500 figures in a battle, the phone-class CPU bench measured 2.2 ms p50 and 13.6 ms p95, summed,
  and the desktop 1.1 ms p50.
  - One device-independent number keeps the timeline the same on every machine: screenshots, tests and the sound plan
    included.
  - It covers every measured battle with 2.6× headroom over the largest side (293).
- **The side's start** counts its squads. A summon joining later gets `groupCap(start, sideStart + start, 750)`.
- **Below the cap** every troop has its own figure. There are no files and no ghost bodies, and `visible()` is not used.
- **Above the cap,** S2.5 as written applies per group with `cap = groupCap(...)`:
  - `visible()`, dynamic files, rebinding, ghost bodies;
  - every invariant, including "the last five are literal".
  - The standing figures of a side are then at most 750 + 5 per group.

### 4.2 Seats and closing ranks

Each figure holds a **seat**: its file and rank in its block, as a ground position from section 3.5 plus jitter from
`streamFor(battle, 'layout')`. Positions are quantized to 0.5 wu and times to whole ms (S2.4).

**When a figure dies,** its body falls where it stands. Then, 0.15 s after the fall ends:

1. Every living figure behind it in the same file steps up one rank: a `seat` cue, 0.4 s, 18 wu.
2. If no figure stands behind it in that file, the nearest rear-rank figure within 2 files fills the seat diagonally.
3. When the living count drops below the block's files, the end files fold inward at the next phase end (0.6 s), so the
   block stays centred.

So a block shrinks from the back. Its front stays full while it can, and its area reads its strength. The exact count is
on the card.

### 4.3 Binding: which troop a figure is

- Each living member is bound to one figure. A member's body falls at its figure's seat.
- **Swaps.** At the start of a ranged or melee window, the builder may swap the members bound to two figures of the same
  group (a `bind` cue). No figure moves.
  - Both figures must be **unmarked:** no wound tint, no stuck arrow, the group's common stance, and not a free mover.
  - Figures of one group look identical apart from those marks, so a swap cannot be seen.
- **For each shown melee blow,** in rank order with mandatory blows first:
  - the attacker member is bound to an unmarked contact seat (front rank, or the second rank for reach weapons: spear,
    halberd, lance) nearest the pair's contact point;
  - the target member is bound to an unmarked front-rank seat facing it.
  - A marked member keeps its figure. If it is out of reach, the blow is a press blow on that figure.
- **Ranged and spell hits** need no swap. They land on the real member's figure wherever it stands.
- **Fallback mode** binds the synthesized members the same way.

**What this keeps.** In detailed mode, the struck figure is the real target and the striking figure the real attacker,
as S2.5 promised. Wound tint and pincushions stay on the troop that took them.

### 4.4 What a figure shows

- **Wound tint** (detailed mode). The particle tint multiplies by (1, 1 − 0.35w, 1 − 0.35w), where w = 1 − hp/maxHp
  from the landings. The fallback gives a fixed w = 0.3 after a sampled wound.
- **Stuck arrows:** at most 3.
- **Commanders:** one figure, with an exact HP bar on their card and hover card.
- **Bodiless units** (`corpse: false`) leave their death mark: a scorch dot for a Fire Sprite, fallen specks for a
  Hornet Swarm, rubble for stone.
- **Invariants:**
  - below the cap, standing figures equal living troops at every `count` cue;
  - bodies and death marks equal deaths;
  - each member dies at most once;
  - a swap never involves a marked figure.

---

## 5. S2.6 amendments (sampling)

With literal figures every death would be "literal". S2.6 made the killing blow of every literal death mandatory; that
would make the 141 kills of `clash300`'s first contact mandatory at 4x. Instead, below the cap:

- **Mandatory** (every speed, no budget):
  - every blow that hit a commander or a body of size 3 or more;
  - the killing blows of commanders and of size-3+ bodies;
  - charge first impacts (one per charging block);
  - up to 6 featured strikes, from duels only;
  - every killing shot (unchanged; projectiles are cheap);
  - **every death,** as a fall: a `death` cue and its body.
- **Ranked:** every other melee blow, including the killing blows of size-1 and size-2 troops, in S2.6's stratified
  order. The outcome class `ghost-kill` is renamed `kill`.
- **A death whose blow is not shown** falls "in the press", at a time spread over the window, as ghost bodies did in
  S2.6.
- **Unchanged:** coverage, budgets (90/55/30 melee, 400/240/120 projectiles), the nesting 4x ⊂ 2x ⊂ 1x, and invariant 7's
  honesty of outcome shares.
- **Budgets** stay as they are. Literal figures put more figures on the seam, but the strike-rate limit (one strike per
  figure per 0.45 s) and ambient fighting fill the line at any budget.
- **Open for the lab:** whether 1x's 90 should rise (`research-tech.md` B14).

---

## 6. S2.8 (replacement of the side-view parts). Choreography from above

Kept from S2.8 as written:

- defense reactions and their table;
- `blocked` sparks and the ARMOR cue;
- the `onFallen` follow-through;
- wounds;
- the cavalry charge timeline;
- mutual kills;
- berserkers;
- the pretender bodies' deaths;
- morale's shaken, holds and rout steps;
- the line breaking;
- the round-50 withdrawal;
- commander and god deaths;
- commander wounds.

What changes:

- **Idle life.**
  - Each figure alternates two idle frames every 1.2 to 2.0 s, with a seeded phase, and bobs 1 wu.
  - A block's pennant rides on its front-left figure. When that figure dies, the pennant drops, and the next front-left
    figure raises it 0.6 s later.
  - Front ranks brace (the `brace` frame) while waiting for contact.
- **Closing.** At each `roundStart` before a block's closing round, front-row melee blocks step toward the seam, with
  dust:

  | Speed | Step per round | Rounds |
  |---|---|---|
  | 1 | 40 wu | 1 to 3 |
  | 2 | 55 wu | 1 to 2 |
  | 3, and flyers | 80 wu | round 1 |

  These are S2.8's steps scaled to the 280 wu gap. Archers, and front-row shooters that still have ammunition, hold
  their ground.
- **Contact.** The rest of the gap is covered in the first 25% of the melee window: speed 1 in step (0.9 s), speed 2 at
  a run (0.7 s), speed 3 and flyers at a charge (0.5 s). The dressing of the line and the wrap (section 3.6) happen in
  the same motion.
- **Who fights whom.** This is section 3.6 (duels, press blows, free movers) and 4.3 (binding).
  - A figure steps over a body in 0.2 s.
  - A body of size 3 or more is crowded by up to the number of small figures in section 3.2's table.
  - S2.8's "flanks them, 2 or 3 sprites on one foe" becomes the wrap.
- **Reactions at figure scale.** Below 24 px of figure height on screen, the pose part of a reaction is skipped (dodge
  sidestep, parry, shield-up). Its sparks, chips and flash still play. At 24 px and above, the poses play as in S2.8,
  with offsets in wu along the line.
- **Cavalry.** The wedge gallops along its path, leaving churn stamps. At impact:
  - the target's first two ranks are shoved back 12 to 20 wu (they compress, not fly);
  - a lance kill throws its victim 16 wu back;
  - the riders plow 10 wu in.
  Otherwise as S2.8.
- **Archers and volleys.**
  - The squad draws together and looses in a ripple over 0.25 s.
  - Each real shot is one projectile, from its real shooter's figure at h = 18 to its real target's figure.
  - Arc apex in h: shortbow 110, longbow 180, fire arrows 150, javelins 60.
  - Flight at 1x: S2.2's times up to 400 wu of ground distance, plus 0.1 s per 100 wu beyond.
  - **The arrow** is a dark dash, 2 × 12 wu (#2A2420, L\* 14.7), turned along its projected velocity. Its ground shadow is
    a 1 × 6 wu dash at alpha 0.15. Fire arrows have an ember tip and trail.
  - **Where they end:**
    - a miss sticks in the ground 10 to 40 wu off the target, inside the target block's footprint plus 30 wu, as a 1 ×
      8 wu stub;
    - a kill sticks in the body and is stamped with it;
    - a wound sticks in the figure (a mark);
    - a block glances off with a spark;
    - a shield block sticks in the shield.
  - A squad's arrows read as one band of parallel dashes, because they leave within one ripple.
- **Flyers.**
  - Size 1 and 2 hover 40 to 80 wu up, bobbing ±6 wu at 0.8 Hz. Size 3 and up hover 100 to 140 wu up.
  - Before their closing round they hover over their own front band. From it, they hover over the seam above the enemy's
    first rank, and never over the enemy's middle or rear: melee reaches only the front.
  - **The swoop:** dive 0.25 s to h = 10, strike, climb 0.3 s.
  - **A flyer's shadow** sits at the ground point below it, offset toward the lower right by 0.5 h, with scale
    1 − h/400 and alpha 0.30 − h/800.
  - A flyer that dies falls for 0.35 s and leaves its body or mark on the ground below.
  - The Great Wyrm's landing (S2.8: falls from the sky over 1.4 s) lands on its seat.
- **Monsters (size 4 and up).**
  - Footsteps raise dust and trauma 0.04.
  - The windup is 0.35 to 0.4 s.
  - A huge impact staggers 2 or 3 neighbours, cosmetically.
  - A Titan sweep kills up to 3 figures in one swing when 3 of its real blows land there.
  - Their soft shadow is an ellipse of 1.4 × footprint, alpha 0.35, offset toward the lower right by 0.25 × height.
  - **See-through:** any figure whose screen bounds a nearer big body covers is drawn again above it as a dark
    silhouette at 35%. The hovered or selected group's figures draw at 50% above everything. So no block's strength
    hides.
- **Morale.**
  - **Shaken:** the block steps back 4 wu and shows the `brace` frame for 0.4 s, and its pennant wobbles.
  - **Holds:** the block steps 4 wu forward.
  - **On the field,** ARMOR and HELD become wordless glyph pips, 12 px over the block's front centre, for 1 s: a shield
    with sparks, a shield with a tick. The roll ("12+7 vs 10+9") moves to the hover card and the lab's Detail tab.
  - **Rout:** the steps of S2.8 run toward the side's own edge along −y for the near side and +y for the far side, at 120
    wu/s. Each runner takes a heading within ±15° of straight back, so a routed block fans out instead of moving as a
    rectangle. Runners fade over the last 40 wu of the edge zone.
  - **Pursuit:** enemy blocks engaged with the router this phase chase 30 wu along the axis and return, over 0.8 s.
  - **The round-50 withdrawal:** the attackers turn as blocks and march off in formation.
- **Commander death.** S2.8's sequence, with the push-in (1.25×) centred on the body. Name cards slide in from the
  commander's own side of the HUD (section 13.6).

---

## 7. S2.9 additions (blood and bodies)

- **Bodies** are the figure's `dead` frame (two variants per view, rotated ±20° and flipped by seed), stamped into the
  ground texture at 55% brightness on its pool when the fall settles. As before, gore Off draws them as dark silhouettes
  (30% brightness, no pool).
- **Pools and splats** are ground decals, drawn as ellipses squashed to 0.643, the projection's depth scale.
- **The seam churn** (new). At the end of each melee window, one churn stamp is laid along the engaged seam: a band 40
  wu deep and as long as the engaged frontage.
  - It darkens the ground 4% per window, up to 24%.
  - At gore Standard and Brutal it also reddens 1% per kill along it, up to 18%.
  - On snow the red reads pink-red (#B0505E at 40%).
  - The result is that blood marks the ground where the lines met. Gore Off keeps the darkening without the red.
- **The decal cap** of 8,000 stamps per battle stays, oldest droplet splats merging first.
- **Floating numbers.** The setting is renamed and three-valued: **Off (default)**, Kills (skull counts), All (S2.9's
  rolling numbers). The card's count already shows every loss.

---

## 8. S2.10 (restaged). Spells from above

The five beats, durations, forms, trauma, the flash limiter and the color grammar are unchanged. Every ring is a ground
ellipse squashed to 0.643. Sky-falls come from the upper left, the light's direction, at 60° to the ground.

| Spell | Overhead staging |
|---|---|
| Ember Dart | a flame bead at the staff (h 22); a flat streak at h 16 to the real target, with a faint glow line on the ground; a spark exits behind it |
| Fireball | an orb, then a lob arc (apex h 120) with its shadow crossing the ground; a 140 wu ground ring and 40 embers; kills thrown outward 16 to 40 wu along the ground; a scorch ring decal |
| Warcry | a red ripple ring expands from the caster over its side's blocks (0.6 s); pennants flare; buff rings under the blocks |
| Blood Fury | red tendrils run along the ground to the block; a red ring pulsing at 1.2 Hz under it |
| Pyre Storm | light dims 30%; a vortex at h 200 over the target row; 12 meteors fall from the upper left, each a streak and a ground burst ring; burning patches (decals) |
| Thorn Spray | a ground crack runs from the caster toward the target block; spikes erupt under the 3 struck troops |
| Bark Skin | a leaf spiral; the block's figures switch to their bark-tinted frames (`material` cue); a ground ring |
| Entangle | the ground cracks under the block; a root-and-vine overlay grows across its footprint and withers at `expire` |
| Swarm | the ground splits at the summon slot; hornet cloudlets boil up and settle into the new block's seats |
| Regrowth | a green ring wave crosses the caster's side; flower decals sprout around the blocks |
| Bless | a column of gold light, from h 0 to h 240, on the block, and a ground disc |

- **Buffs and debuffs** show as a ground ring under the block's footprint:
  - a solid ring for a buff, a dashed one for a debuff;
  - the stat's glyph at the ring's front;
  - ▲ or ▼ on the card (docs/09's corner badges);
  - the chip row of the hover card.
  S2.10's per-figure overlays (glints, veins, swell) are drawn only at 24 px of figure height and above.
- **Field effects:**
  - **Storm:** rain falls at a slant from the upper left.
  - **Fog:** three layers at h 0, 30 and 60 drift across the field. Both sides' rear bands are veiled to 60%.
  - **Wall:** rises across the whole width of no-man's land, never part of it, so it suggests no gap.
- **Captions move off the field.** For the 1.2 s caption, the caster's card shows the spell's mana symbol, and the
  ticker shows "Cinder Magus: Fireball" (section 13.7). During the charge beat, the mana symbol glows over the caster
  without words.
- **Abilities** (`ability` events) stage as casts of their color, as docs/12's 6b.2 decision says.

---

## 9. S2.11 and S2.13 type changes

```ts
// cues.ts
export interface Ground { x: number; y: number }                 // replaces Vec for every position
export type Facing = 'ne' | 'nw' | 'se' | 'sw';                   // replaces 1 | -1
// PersistentCue changes:
//   move.to, rout.to, leave.to: Ground;  face.facing: Facing;  clash: { y: number } (was x)
// PersistentCue additions:
  | (Cue & { kind: 'seat'; actor: ActorId; to: Ground })                         // closing ranks, dressing, wrap
  | (Cue & { kind: 'bind'; group: BattleUnitRef; a: number; b: number })          // swap members a and b (4.3)
  | (Cue & { kind: 'altitude'; actor: ActorId; h: number; ease: Ease })           // flyers
// TransientCue changes: projectile.from/to: Ground & { h: number }; burst.at, floater.at, ghostFall.at: Ground & { h?: number }
//   strike gains `press: boolean` (no attacker drawn); spellBeat.from/to: Ground & { h: number }

export interface CameraKey { t: Ms; box: { x0: number; y0: number; x1: number; y1: number }; ease: Ms }  // screen-plane box
export interface Timeline {
  version: 2;
  nearSide: BattleSide;                       // was leftSide
  field: { x0: number; x1: number; y0: number; y1: number; seamY: number; pitch: 40; yaw: 30 };  // replaces world
  camera: CameraKey[];                         // section 10
  // ...every other field unchanged
}
// ActorFrame: x, y (ground), h; facing: Facing; frame: number (atlas frame index, troops); pose and poseT stay
// for big bodies (mesh); tint: number; marked: boolean. FrameModel.camera unchanged in shape.
```

- **`rig.ts` becomes `poses.ts`.** It maps (formation kind, weapon motion, pose, poseT) to an atlas frame and a lunge
  offset, in closed form.
- **`mesh.ts` (new)** maps (body, pose, t) to the deformation weights of a big body's 24 × 16 mesh, in closed form.
- **`buildTimeline`** takes `{ nearSide, tints }`.

---

## 10. The camera

**Zoom is stated as figure height.** `f = 28 × z × (canvas css width / 1920)` px for a size-1 figure.

| Mode | f range |
|---|---|
| Automatic | 18 to 48 px |
| The player's own camera | 14 to 72 px |

**The automatic camera** (`camera.ts`, pure; on when "Follow action" is on, the default):

1. **The whole-field view.** At t = 0 the box holds every block, commander and body of both sides plus 10%. It is fitted
   into the canvas minus the HUD's safe areas (top 64 px and bottom 112 px at 1080). Its zoom is `z_all`.
2. **The intro (3.0 s).** It holds the whole-field view while each block steps the last 30 wu into place to horns.
   S2.7's "armies march in" becomes this. It then eases to the first focus.
3. **One `CameraKey` per segment:** each cast, ranged window, melee window, death sequence and rout sequence.
   - The box is the union of the figures involved at the segment's start: shooters and targets; engaged blocks; caster
     and targets; the dead commander and its killer.
   - It is padded by 15%, with zoom clamped to [`z_all`, 1.6 × `z_all`] and to f ≤ 48 px. The view never loses the
     field's context.
   - The camera eases between keys over 0.8 s (smoothstep), starting at each key's `t`. Montage segments hold the
     whole-field view.
4. **On top:** S2.13's push-ins (1.08× to 1.35×) and trauma-squared shake. S2.13's 40 wu "drift toward the clash" is
   dropped; the keys replace it.
5. **Reduced motion:** cuts between keys instead of easing, with no push-ins and no shake.

The camera is a closed-form function of story time, so seek, screenshots and context restore stay exact. The measured
start-view figure heights are in section 1.2: p50 40 px, minimum 21.

**The player's camera** (UI state, composed after `cameraAt(t)`; never in the timeline):

| Input | Action |
|---|---|
| WASD, or drag with the left button on empty ground | pan |
| Wheel | zoom to the cursor |
| `+` / `−` | step the speed (docs/07; not the zoom) |

- Panning is clamped so the field's centre stays on screen.
- Any pan or zoom turns Follow off. Shake still applies; push-ins do not.
- `Z`, the Follow button, or a double-click on empty ground turns Follow back on, easing over 0.5 s.
- A double-click on a block or card centres on it without turning Follow on.

---

## 11. S4.3 (replacement). The scene graph and the frame

### 11.1 Layers

```
stage
  world                       camera: zoom, pan, shake (rotation 0.5° × trauma²); ColorMatrixFilter: desaturate, dim, time of day
    ground                    Sprite of the generated ground RenderTexture (terrain, season, scenery; once per battle)
    decals                    Sprite of the field RenderTexture: bodies, pools, splats, churn, stuck arrows, scorch, flowers, dropped gear
    groundFx                  pooled: aura and buff rings, spell rings and cracks, selection and hover hulls, fog bottoms, base rings
    shadows                   pooled soft shadows of big bodies and flyers (figure shadows are baked into their frames)
    troops[0..M]              ParticleContainer per depth slice, one battle atlas as the single texture source
    big[0..M-1]               big bodies (MeshPlane, 24 × 16) and storm-wall segments, each between two troop slices
    seeThrough                ParticleContainer: silhouettes of figures covered by big bodies; the selected group at 50%
    projectiles               ParticleContainer: arrows, javelins, darts; then their ground shadows
    fxNormal, fxAdd           ParticleContainers (blood, dust, chips, smoke, leaves | sparks, embers, motes, rays, hit flashes)
    fieldOver                 rain, fog top, lightning
    glyphs                    pooled glyph pips (ARMOR, HELD), the mana symbol over a caster, floaters when on
  overlay                     flash, vignette, interlude caption
```

**Depth slices** (`research-tech.md` A2):

- Each frame, after the insertion sort by `depthKey`, the troop array is cut at the depth key of each big body's feet.
  Wall segments (64 wu long) count as big bodies.
- M big bodies give M + 1 troop slices.
- Draw calls: about 12 for the fixed layers, plus 2 per big body (its mesh and the troop slice it opens). That is
  about 14 in the typical battle with one pretender, and 24 with six big bodies. Pixi's CPU cost per draw is small; the
  bench drew 4 or 5 a frame.

**Picking.** `pick(px, py)` (renderer API) tests, in order:

1. big bodies' sprite bounds;
2. commander figures (a 14 × 30 wu box);
3. block hulls: each block's seat rectangle in ground space, through `toGround`;
4. cards (DOM).

No per-particle hit testing.

### 11.2 Each frame

1. `evaluateInto(frame, timeline, t, view)`.
2. Write each figure's particle: x, y, frame, tint, alpha, scale, flipped.
3. Sort by depth key, which is nearly sorted between frames (0.1 to 0.4 ms at 3,000 figures). Cut into slices.
4. Big bodies: mesh deformation from `mesh.ts`.
5. Transients, particles and decal stamping, as in S4.3's steps 3 to 5.
6. Camera: `cameraAt(t)` composed with the player's camera. Then the overlay and `renderer.render(stage)`.

### 11.3 S4.9 budgets (amended)

| Part | Budget |
|---|---|
| `evaluateInto` | ≤ 2 ms (unchanged) |
| Figure writes, sort and slicing (≤ 1,500 figures) | ≤ 1.5 ms |
| Particles (≤ 6,000) | ≤ 2.5 ms (unchanged) |
| Pixi CPU (≤ 24 draw calls) | ≤ 3 ms |
| GPU | ≤ 6 ms (unchanged) |

- **The load in `clash300`** is now 600 figures, one per troop. S4.3's 2,400 part sprites and 300 shadows are gone. The
  bench measured 0.6 + 0.4 ms CPU at 600 figures with the whole effect load.
- **Generation at open** takes ≤ 400 ms (was 300): the atlas for the battle's unit looks, the ground and the card poses.
  - The bench tessellated 300 frames in 52 to 78 ms; a battle needs up to 1,000.
  - The modal shows the ground and "Mustering…" until the first frame.
- **Application options:**
  - `antialias: false`, as the bench used: sprites gain nothing from it.
  - `resolution: min(devicePixelRatio, 2)`, and at most 1.5 on a touch device.

---

## 12. S4.4 (replacement). Placeholder art

### 12.1 Rank-and-file: baked pose frames

- **The seam keeps its name.** `PartSet` now produces atlas frames.

  ```ts
  export interface FigureFrames { views: Record<'ne' | 'se', Texture[]>; white: Record<'ne' | 'se', Texture[]>; card: Texture }
  export interface PartSet {
    load(): Promise<void>;
    bakeFigures(units: readonly { unit: UnitTypeId; look: UnitLook; palette: SidePalette }[]): Promise<Map<string, FigureFrames>>;
    bakeBody(unit: UnitTypeId, look: UnitLook, palette: SidePalette): Texture;   // big bodies, for the mesh
    rebuild(): Promise<void>;                                                      // after a context restore
  }
  ```

- **Frames per view (20).** Most poses are 1 or 2 frames. Run is walk at 1.6× rate, and a rout is the walk frames in the
  away view. Card art is one more frame (12.3).

  | Poses | Frames |
  |---|---|
  | idle | 2 |
  | walk | 4 |
  | attack (windup, strike, recover, a second strike variant) | 4 |
  | shoot or cast (draw, loose, recover) | 3 |
  | brace or shield-up | 1 |
  | flinch | 1 |
  | fall | 2 |
  | dead | 1 |
  | white silhouettes (idle, flinch) for the hit flash | 2 |

- **The atlas.** Frames are drawn with Pixi `Graphics` from S4.4's parts, flat fills and a dark keyline, at 2× into 64
  px cells (the art is about 52 px tall). One 2048² atlas holds 1,024 cells: 25 unit looks of 40 frames.
  - The measured maximum is 13 squad types in one battle, plus commanders.
  - An overflow look goes into a second atlas and its own `ParticleContainer`: one more draw per slice.
  - At devicePixelRatio 1.5 or more, cells are 96 px, with one atlas per side.
- **Sharpness.** The automatic camera's 48 px top is 1:1 with the art. The player's zoom to 72 px is a 1.4× upscale,
  slightly soft, which is acceptable for a close look.
- **Silhouettes by archetype** (S4.4) and **nation layers** (docs/09) are unchanged. Cloth follows section 3.8's rule.
  - At massed zoom the side's color must show on surfaces visible from above: helmet crest, shoulders, the shield face,
    the cloak.
  - Target: 30% or more of a block's visible pixels in the side's hue at f = 28 px. The bench reached 38% for Cinder and
    22% for Thornwood, so Thornwood's figure parts need more top-visible cloth.
- **Hit flash:** for one frame, the figure's frame swaps to its white silhouette. Under reduced motion it becomes the
  red tint.
- **Dismemberment** (Brutal): a head with its helmet, or an arm with its weapon, is one more small frame per view in the
  atlas. It tumbles as a particle, then stamps.
- **Phase 11 SVG parts** go through the same `PartSet` and bake into the same frames.

### 12.2 Big bodies

- **What counts:** size 3 and up, every pretender body, and summoned commanders.
- **How they are drawn:** one texture per body, from the procedural rig drawn once (`bakeBody`), on a `MeshPlane` of 24 ×
  16 vertices, deformed by `mesh.ts` (`research-tech.md` A6).
- **Motion:**
  - breath, bite and claw are mesh lunges plus hit flashes;
  - wings flap, tails sway, necks bob;
  - flight is a lift with the shadow left on the ground;
  - death is a tilt and fade, then a darkened copy stamped into the decals.
- **Painted cutouts** made with `tools/art/gemini_gen.py` replace a body's texture when the owner approves a set. They need
  a camera reference image and a 1 px alpha erosion after keying, per the bench. The procedural body is always the
  fallback.

### 12.3 Card art

- **Commanders** use their approved leader portrait (`src/assets/raster/portraits/<nation>/<unit>/NN.webp`).
  - `NN-64.webp` at devicePixelRatio below 1.5, and `NN.webp` (256 px) scaled down above it.
  - The face is chosen by docs/09's seed rule, so it is the same face as on the map.
  - The docs/09 frame shape and rank material apply, with state overlays: a bandage below half HP, blood below a quarter,
    greyscale when dead.
  - Summoned commanders with raster sets (Salamander, Treant) use theirs. Pretenders use their rig's portrait pose
    (docs/05 summary card).
- **Troops** use their own figure in a **card pose:** the `se` view, idle, baked once at 128 px on the side's banner
  ground with a dark vignette. It is the unit's icon, it matches the field exactly, and it costs one atlas-sized bake.
  - A size-2 or larger unit adds A.3's size glyph in the art's lower corner.
  - Phase 11 can swap in painted full-body cards through the same slot.

---

## 13. S4.6 (replacement). The HUD

### 13.1 Layout at 1920 × 1080

The UI scale is clamp(min(w/1920, h/1080), 0.75, 1.25) times the player's UI scale.

```
+----------------------------------------------------------------------------------------------+
| [enemy plate][e][e][e][e][e][e]                    [R4 ••○○] [❚❚] [» 2x] [◆] [⏭] [≡]          |
|                                                                                              |
|                                   battle canvas, full window                                 |
|                                                                                              |
|  ticker line (beats)                                                     [◎ Follow] [−] [+]  |
| ════════ scrubber line (4 px; expands on hover) ════════════════════════════════════════════ |
| [player plate][card][card][card][card][card][card][card]                                    |
+----------------------------------------------------------------------------------------------+
```

- **The canvas never resizes for the HUD** (docs/07 principle 8). The automatic camera fits into the safe area between
  the two bars.
- **Coverage** at 1920 × 1080 (canvas pixels under any HUD element):

  | Battle | Cards per side | Coverage |
  |---|---|---|
  | median | 3 | 2.8% |
  | p90 | 8 | 4.6% |
  | measured maximum | 25 cards in compact mode | about 9% |

  The references show about 6%. S4.6 with the docks open covered 38%, and 19% collapsed.

### 13.2 The card bar (player's side)

- **Order:** one card per squad and commander. Each commander's card comes first and its squads follow in roster order.
  Groups are separated by 6 px. Provincial defense is a group with a plain-banner plate. Summons append to their
  commander's group when they join.
- **Placement:** the bar sits along the bottom edge from x = 16, 12 px above the bottom. It starts with a **side plate**
  (96 × 84):
  - banner chip and mana symbol;
  - the side glyph: a pointed shield for the attacker, a round one for the defender (S4.6);
  - ATTACKER or DEFENDER;
  - the side's active troops as a large number, with losses below.
- **The card:** 64 × 84 px at a 68 px pitch. That fits 24 cards beside the plate at 1920.
  - **Compact mode:** with more cards, they become 52 × 72 (the art cropped) and 29 fit.
  - **Collapsed groups:** past that, groups collapse into their commander's card with a "+n" badge. Hovering expands the
    group as a popover above the bar.
  - Measured: p99 is 14 cards and the maximum 25, so compact mode is the rare tail.
- **Card face**, top to bottom:

  | Part | Size | Content |
  |---|---|---|
  | Art | 64 × 60 | the portrait (commanders) or the card pose (troops), section 12.3 |
  | Status column | 14 px icons down the art's left edge | at most 3, by priority (13.4) |
  | Corner marks | top right | commander pennant in the banner; the pretender's crown (docs/09 role icon); ▲ or ▼ for a net buff or debuff |
  | Count line | 24 px | troops: the exact living count in 15 px tabular figures, flashing a red "−n" for 0.6 s when it drops; commanders: their HP as a number |
  | Strength bar | 3 px | living / start (troops) or hp / maxHp (commanders); casters add a 2 px fatigue bar above it |

- **States:**

  | State | Look |
  |---|---|
  | hovered | 1 px light border; the block's hull ring on the ground |
  | selected (click) | 2 px #E8C46A border; hull ring in the banner color with a dark keyline; the hover card pinned |
  | routing | art desaturated 50%, broken-flag icon |
  | fled | grey wash at 70%, fled icon |
  | wiped out or dead | grey wash at 70%, skull icon; a commander's portrait in greyscale |

  A card never leaves the bar mid-battle, so the bar stays stable.
- **Counts change at the `count` cue** that shows the death, never when the event is read. At every phase end the bar
  equals `script.folds` (`foldReplay`), as S2.15 requires of the panel. The bar reads `PanelState`.

### 13.3 The enemy strip

- **Placement:** at the top left, from x = 16, 8 px down.
- **Content:** a plate (96 × 46) followed by mini-cards of 36 × 46 at a 40 px pitch. Each mini-card has art (36 × 30)
  and a count line (16 px).
- **States and icons** are the same as the card bar's: at most 2 status icons, and the same washes.
- **Capacity:** 36 mini-cards fit before the transport cluster. Past that, groups collapse as in the card bar.
- **Collapsing:** `]` collapses the strip to its plate. Hover and click work as on the player's cards.

### 13.4 Status icons and words

Every state has a shape, a color and a word (docs/07 principle 6). The card shows the shape. The hover card shows the
word.

| Priority | State | Icon shape | Color | Word on the hover card | Source |
|---|---|---|---|---|---|
| 1 | Wiped out | skull | grey | Wiped out | count 0 |
| 1 | Fled | flag with an outward arrow | grey | Fled | `leave` |
| 1 | Routing | broken flag | red #D9543A | Routing | `rout` |
| 2 | Shaken | cracked shield | amber #E3A33B | Shaken | detail `morale`; fallback `mustCheck()` (D15) |
| 2 | Held | shield with a tick | pale green #9BD3A2 | Held (detailed: the roll, e.g. 12+7 vs 10+9) | a check that held, for 1 s |
| 2 | Raging | clenched fist | red | Raging | berserk blow (detailed), first wound (fallback) |
| 3 | Casting | ring with a spark in the spell's color | spell color | Casting Fireball | `cast` beat |
| 3 | Exhausted | ring with ✕ badge | grey | Exhausted | fatigue ≥ 100 (A4) |
| 3 | Engaged | crossed blades | light #E6E1D6 | Engaged | contact |
| 3 | Shooting | bow | light | Shooting · n left (exact: ammo minus volleys) | ranged weapon with ammo |
| 3 | Out of ammunition | bow with ✕ badge | grey | Out of arrows | ammo 0 |
| 4 | Summoned or bound | chain link | element color | Summoned / Bound | `summon`; `bound` |
| — | Waiting | none | — | Waiting | before contact |

Icon shapes reuse docs/09's monoline set and its corner badge rule (▲ ▼ ✕). New nouns (cracked shield, shield with a
tick, broken flag, chain link, fist) join docs/09's icon inventory.

### 13.5 The hover card

**When it shows.** Hovering a block, figure, commander, big body or card shows it 16 px right of the pointer, flipped
near the screen edges. Clicking pins it (selection). Esc or a click on empty ground unpins it.

**Look.** About 200 × 78 px, a #14120F plate at 72% with 6 px radius. The plate keeps the text legible on snow and on
sand. There are four lines, plus one chip line when buffs are active.

| Line | Squad | Commander or big body |
|---|---|---|
| 1. Name | "Cinder Warriors", side glyph, row glyph; "Provincial defense" or "Summoned" when they apply | "Varo, Ash Chieftain", side glyph; the pretender's own name |
| 2. Hitpoints | **Troops** bar: living / start, labelled "37 / 60", exact at the count cue. Detailed mode adds a darker segment for wounded living troops ("9 wounded"), from the landings. | **Hitpoints** bar: "9 / 14", exact in both modes (`foldReplay`) |
| 3. Morale | Detailed mode: a **Morale** bar filled to 1 − P(break) from S2.16, colored green (under 10% to break), amber (to 35%) or red (above), with "breaks 18% if tested"; fearless and berserk squads show a full bar and "never breaks". **Fallback: no bar** (D4), only the state word. | casters: **Fatigue** bar (A4), "EXHAUSTED" at 100; others: "Fights on" or "Routs with its squads" (docs/04's rule), no bar |
| 4. Status | the top word of 13.4, in its color and with its glyph, plus terrain or storm modifiers when they apply ("Forest +1 def", "On the walls +6 prot") | the same |
| chips | stat glyph, signed number, rounds left (S4.6's chips) | the same |

**Bar colors.** Hitpoints and Troops are red #C8463A on a dark track. Morale is teal #3FA7A0 with a hatched track, so the
two bars differ by hue and by pattern.

**The rule.** Nothing on the hover card is an estimate the log cannot support. A squad has no hitpoint pool, so its bar
is troops. Morale is a roll, not a pool, so its bar is the break chance where detailed mode has the inputs, and absent
otherwise.

### 13.6 Transport, scrubber, cards on the field

**The transport cluster** sits at the top right, 16 px from the edge and 8 px down. Its buttons are 36 px with 6 px
gaps.

| Control | Action |
|---|---|
| round chip "R4" | four phase pips (spells, missiles, melee, morale); it pulses for 0.5 s at each round start, which replaces the round card's text |
| play / pause | Space |
| speed | shows the current speed (0.5x, 1x, 2x, 4x) and steps up on click, down on Shift+click; keys 1 to 4, `+` and `−` |
| Beats ◆ | B |
| Skip ⏭ | to the result card; S or End |
| Menu ≡ | Restart (Home), Log (L), Report, Docks (`[` `]`), Settings (gear popover, S4.8), Sound (S3.10 popover), Close (Esc) |

- **The scrubber** is a 4 px line across the width just above the card bar, showing progress and round ticks.
  - It expands to a 28 px scrubber (S4.6's beat icons sized by weight, drag to seek, "0:32 / 1:14") while the pointer is
    within 40 px of it, while paused, or while the K key is held.
- **The camera cluster** (bottom right, 32 px buttons): Follow ◎ (`Z`), zoom − and +.
- **Name cards** (S2.8): a 128 px portrait card.
  - A player commander's slides in at the left above the card bar; an enemy's at the left below the enemy strip.
  - They stack as S2.8 says.
- **Interlude captions** ("Rounds 5 to 9: the lines grind on") show as one line centred above the card bar.
- **The result card** is S4.6's, centred.
- **The "Summary replay" chip** (fallback mode) sits next to the round chip, with its tooltip.

### 13.7 Ticker, docks, Log

- **The ticker** is a setting: **Beats (default)**, All, or Off.
  - Beats shows only beat lines (S2.7's beat list, spell casts with their caption text), one at a time, above the card
    bar at the left, each fading after 4 s.
  - All is S4.6's four-line ticker in the same place.
  - Every line is still in the Log.
- **The docks** are S4.6's left (player) and right (enemy) docks, 280 px, with every row, chip, the break-chance meter and
  the tooltips. They are toggled with `[` and `]`, as on the map (docs/07). Tab only moves focus, as docs/07 says.
- **The Log (L)** is S4.6's, with the Events and Report tabs, plus the `aria-live` region for beats.

### 13.8 Keys (S4.7 amended)

Kept: Space, ← →, Shift+← →, N, 1 to 4, B, S or End, Home, M, L, Esc.

| Key | Action |
|---|---|
| `[` / `]` | the player's dock / the enemy's dock; was Tab |
| `+` / `−` | speed step (docs/07) |
| WASD, drag | pan |
| wheel | zoom |
| Z | Follow (the automatic camera) |
| H | hide the HUD (docs/07's cinematic key) |
| hold C | highlight every commander's ring and card (docs/07) |
| K (hold) | show the scrubber |
| Tab | focus only |

---

## 14. S4.8 settings (amended)

| Setting | Values (default first) | Change |
|---|---|---|
| Floating numbers | Off, Kills, All | was "Damage numbers: On, Off" |
| Combat ticker | Beats, All, Off | was On, Off |
| Follow action | On, Off | now drives the automatic camera (section 10) |
| Block outlines | Off, On hover, Always | the S4.8 optional outline, as a ground hull ring in the banner color with a dark keyline, never over figures |

**Color vision:** sides are told apart by position (the player is always near, at the bottom left), by banner hue family,
by the side glyph on the plates and cards, and optionally by outlines. Elements keep their glyphs, and hit flashes stay
white.

---

## 15. Other changes the new view needs (stated, outside the replaced parts)

1. **S2.3 and S2.11, `leftSide` becomes `nearSide`**, in `BattleScript`, `Timeline`, `buildTimeline`,
   `ReplayControllerInit`, S6.1's modal, and the lab's URL (`left=` becomes `near=`). The player's side is the near
   side.
2. **S2.1, files.**
   - `layout.ts` grows into `layout.ts` (bands, slots, seam), `seats.ts` (formations, closing ranks, binding, wrap) and
     `project.ts` (pure projection).
   - `rig.ts` becomes `poses.ts`, and `mesh.ts` is added.
   - `camera.ts` gains the keys.
   - The presentation purposes gain `scene`.
3. **S2.2, content.**
   - `PRESENT_LAYOUT` is replaced by: projection, figure size, the size ladder table, formation kinds, bands, seam
     numbers, `literalCap`, grounds and feature rules.
   - The old "scale, cap, grid, spacing" columns go.
   - `UnitLook` gains `formation`.
   - `looks/terrain.ts` holds the grounds and scenery rules (section 3.7) in place of the four parallax layers.
4. **S2.6.** The mandatory set changes (section 5).
5. **S2.7.** No duration changes. The intro's "armies march in" becomes "blocks step into place" (section 10). The round
   card's time stays in the pacing, and its text moves to the round chip.
6. **S2.9.** The seam churn is added. Floating numbers are off by default.
7. **S2.10.** The storyboards are restaged. Captions leave the field.
8. **S2.13.** Camera keys replace the melee drift. `ActorFrame` changes (section 9).
9. **S2.14.** Reaction poses depend on the figure's height on screen (section 6). The fog field veils rear bands, not
   lanes.
10. **S2.17.** "Sprite caps by size 20/12/6/4/2/1" becomes "literal cap 750 per side; above it, group caps by share".
    Add: `seats` and camera keys within `buildTimeline`'s 20 ms / 100 ms budget.
11. **S3.7.** The pan formula is unchanged, with `x` read as the projected screen X of the cue's position. The row term
    (front 0, middle −2.5 dB, rear −5 dB) is kept.
12. **S4.1, files.**
    - `layers/` follows section 11.1.
    - `Transport.tsx` becomes `TransportCluster.tsx`.
    - `TopBar.tsx` is replaced by `CardBar.tsx`, `EnemyStrip.tsx` and `HoverCard.tsx`.
    - `SideDock.tsx`, `Ticker.tsx`, `Scrubber.tsx`, `NameCard.tsx`, `ResultCard.tsx`, `LogPanel.tsx` and
      `ReportView.tsx` stay.
13. **S4.2.** `antialias: false`. New methods `pick(px, py): PickResult | null` and `setUserCamera(c: UserCamera | null)`.
14. **S4.5.** Auras and buffs become ground rings (section 8). Decals add the churn.
15. **S5.**
    - The lab's Perf tab adds figures, slices and big bodies.
    - The Playwright baselines are re-taken for the new view, still six.
    - New `battle-figures.spec.ts`: at every phase end of `starting`, `clash300` and `stormFort`, the figures drawn per
      group (`__lab.stats().figures`) equal the panel's living count, and body decals equal deaths.
    - `battle-perf.spec.ts` keeps its gate.
16. **S6.2.** Phase 11's SVG parts bake into atlas frames through `PartSet`. Its renderer and `TextureFactory` do not
    change.
17. **The risk register, row 6** ("sprites lie about strength"), is handled by literal figures below the cap, D1 above
    it, closing ranks and exact cards. Its proof is `proxies.test.ts` plus `battle-figures.spec.ts`.
18. **Outside docs/12:**
    - **docs/07 "Battle reports and the replay":**
      - rosters become the card bar and enemy strip, with the docks on `[` `]`;
      - the stage line becomes "an overhead three-quarter view, the player at the near side";
      - "the player always on the left" becomes "near";
      - `leftSide` becomes `nearSide`;
      - item 9 of its changes list.
    - **docs/09:**
      - the animation table notes that battle troops draw baked pose frames from the same parts;
      - a "Battle grounds" paragraph holds section 3.7's grounds and section 3.8's value rules;
      - the icon inventory gains section 13.4's nouns.
    - **docs/10 Phase 10:** "rosters (player on the left)" becomes "card bar and docks (player near)".
    - **docs/04 is untouched:** no rule changes.

---

## 16. Tests added or changed

| File | What it pins |
|---|---|
| `tests/present/battle/project.test.ts` | `toGround(toScreen(g)) = g` within 1e-9; depth key order; the facing table |
| `tests/present/battle/layout.test.ts` | bands in order with 48 wu gaps; fronts start 280 apart; lateral order by size, centre-out, the same on both sides; formation shapes match section 3.5 for n = 1 to 200 per kind; no two seats closer than 0.8 × spacing; the commander base rule; big bodies at a row end; the field rect contains every seat; rows wider than 1,600 wrap |
| `tests/present/battle/seats.test.ts` | closing ranks keep the front rank full while living ≥ files; standing figures = living at every `count` cue below the cap; bodies + death marks = deaths; a `bind` never involves a marked figure; detailed mode: every duel's struck figure is the real target member and the striker the real attacker; press blows only between non-touching pairs; the wrap never passes the narrower front's last rank |
| `tests/present/battle/proxies.test.ts` | `groupCap` is literal at or below 750 per side; above it the side's standing figures ≤ 750 + 5 per group; S2.5's invariants above the cap (unchanged) |
| `tests/present/battle/sample.test.ts` | section 5's mandatory set; featured strikes only from duels; the nesting and honesty tests unchanged |
| `tests/present/battle/camera.test.ts` | `cameraAt` is pure and continuous except reduced-motion cuts; the automatic f within 18 to 48 px at 1920; every key's box contains its segment's figures; zoom never exceeds 1.6 × `z_all`; reduced motion has no push-ins or shake |
| `tests/present/battle/scene.test.ts` | features never inside the field rect plus 80 wu; no river, road or bridge crossing between the sides (no segment with y between the two front bands); swamp puddles ≤ 24 wu, ≤ 6% cover, halves within ±10%; the storm wall spans the field plus 200 at each end and its breach spans the engaged frontage plus 2 files |
| `tests/present/battle/panel.test.ts` | adds: the card bar's counts equal the panel at every `count` cue and `foldReplay` at phase ends; hover card fields per mode (no morale bar, no break chance, no rolls in the fallback) |
| `tests/content/presentation.test.ts` | adds: every unit has a `formation`; every terrain and season has a ground within L\* 58 to 78 and C ≤ 0.06; troop cloth within L\* 35 to 55 and C ≤ 0.16; the size ladder table covers sizes 1 to 6 |
| `tests/ui/replay/controller.test.ts` | adds the new keys (`[` `]`, Z, H, K, WASD), Follow off on a user pan, and that the user camera never changes the timeline or the frame model |
| Lab measure (S5) | block mean L\* at least 15 below the ground for every terrain × season × nation; side-hue share ≥ 30% of a block's visible pixels at f = 28 px |

---

## 17. Decisions made here, and what the owner may want to see first

**Decisions** (recorded per CLAUDE.md; the numbers go to `docs/09-balance.md` under "Battle presentation" when built):

1. Yaw 30°, pitch 40°, orthographic. The player is near, at the bottom left.
2. A literal cap of 750 figures per side, device-independent.
3. Lateral order by size, centre-out, mirrored, chosen because it maximises touching pairs (94.8% of attack mass).
4. Press blows for non-touching pairs, rather than drawing a false killer or inventing lateral maneuvers.
5. The wrap, honest because every troop of an engaged row fights, and drawn with no flank cue.
6. Rivers, roads and bridges only outside the field. A forest battle is a clearing. The storm wall at the seam.
7. Floating numbers off and the ticker on beats by default. The docks on `[` `]`.

**For the owner** (the v4 mockup can show these before the build):

- The diagonal (yaw 30°) against a square-on view (yaw 0°). Yaw 0° gives figures 12% larger in the median battle but
  straight front and back figure views.
- Whether the enemy strip should be on by default. The references show only the player's side.
- The look of a small battle. At M1's sizes (median 28 troops a side) the view is a skirmish of a few blocks, framed close
  (f ≈ 40 px). That is the honest picture: figures are never multiplied (D1).

---

## Appendix: files

All files are under `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/`.

- `battle-design.md`: this file.
- `battle-tools/measure.ts`: the AI vs AI battle-size logger. It runs on `battle-tools/src/`, a copy of the repo's `src/`
  whose only change is one line in `sim/conflict.ts` `fight()` that logs each setup to a global. The repo was not
  edited. Run it with `./node_modules/.bin/tsx measure.ts 40 1 b40.json`; `node_modules` is a symlink to the repo's.
- `battle-tools/b40.json`: the 3,066 battles. `battle-tools/stats.py` prints section 1.1.
- `battle-tools/layout_model.py`: the layout and framing model of section 1.2 (`YAW=<deg>` env var for the yaw
  comparison). `battle-tools/units.ts` prints the unit table.
- `battle-tools/schematic.py` and `battle-layout-schematic.png`: a placeholder schematic of the projection, bands, slots,
  commanders and HUD safe areas for a starting-sized battle. It shows geometry only, not art.
