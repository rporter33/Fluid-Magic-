# Battle replays: spectacle and feel

Proposal for the battle replay viewer (Phase 10) and its art and sound (Phase 11), written
from one angle: what the player sees and hears, moment by moment, so that a battle feels
brutal and stays readable. It is meant to be buildable as written. Every number here is a
starting value for `docs/09-balance.md`-style tuning, not a law.

Owner direction (binding): battles must be visceral and detailed, with sound effects.
Because battles resolve instantly and are watched afterwards, heavy per-blow detail is fine.
Battle sound moves into M1 scope.

Constraints kept: the sim stays pure and deterministic; content stays data; saves do not
balloon; the viewer stays watchable at any battle size; color-blind safe, reduced motion,
gore toggle; procedural or CC0 assets only (this proposal generates every sound in code
and uses no sample files); cheap tests for everything that is pure.

---

## 0. The proposal in twelve decisions

1. **The log is the truth; the viewer invents only where the log is silent.** Counts, kills,
   who fights whom at squad level, commander HP, the order of phases, and every rout, death,
   and spell are exact. The viewer invents which sprite strikes which, the pose, and when
   inside a phase. A test enforces that the invented detail adds up to the log.
2. **Five small additions to the log** (section 2): phase markers; `attacks`, `blocked`,
   and `dmg` on volleys and melee; `by` on damage; `fatigue` on casts; terrain and storm on
   the record. They are what turn "6 hits, 3 kills" into misses, sparks off armor, wounds,
   and deaths. Measured cost: +32% raw per record, and records gzip 7 to 10 to 1.
3. **Side view, player on the left**, three row bands per side, six depth lanes, squads as
   blocks of up to 20 sprites scaled by unit size, a moving clash line that shows who is
   pushing.
4. **Every dead troop leaves a body.** Living sprites are proxies (a squad of 60 shows 20),
   but each kill drops a corpse on the ground, so the field after a battle shows the true
   cost. Bodies, arrows, scorch marks, and blood stay until the battle ends.
5. **Per-blow choreography with a budget.** Each melee phase plays up to 90 sampled strikes
   at 1x (fewer at higher speeds). Every on-screen death is mandatory and always shown;
   non-lethal strikes are sampled so that the share of misses, deflections, and wounds is
   true to the log.
6. **Impact grammar**: hit-stop by weapon weight, a trauma-based screen shake, white hit
   flashes, sparks on armor, blood sprays and pools by blood type, deaths that fall and stay,
   dust, and optional dismemberment on the Brutal gore setting.
7. **Spells in five beats**: charge, release, travel, impact, linger, with each color's
   particle motion from `docs/09` (Ember rises, Loam spreads along the ground, Tide ripples,
   Radiance radiates, Umbra sinks). Each of the 11 M1 battle spells has its own storyboard,
   and every primitive has a generic template for M2.
8. **Cinematic beats**: first contact, cavalry charges, commander deaths (slow motion, a
   falling banner, a name card), pretender deaths, a side breaking, and the end of the
   battle. These are the moments that fast-forward keeps.
9. **Pacing**: a typical round lasts 5 to 8 s at 1x. Measured battles last 7 to 10 rounds,
   so a battle with the starting armies runs about 40 s and a 300-vs-300 battle about 80 s
   at 1x. Speeds 0.5x to 4x, a Beats mode that hurries everything but the big moments,
   auto-tempo for quiet rounds, collapsed stalemates, step by round, a scrubber with beat
   markers, and skip to end.
10. **Procedural sound**: a Web Audio engine with buses, a limiter, a reverb whose impulse
    response is generated per terrain, and about 60 recipes (metal, flesh, bone, bows,
    hooves, formant-synthesized voices, horns, drums, fire, roots, storm), pre-rendered into
    a few variants each with `OfflineAudioContext`. No audio files.
11. **HUD**: side panels with exact live counts, commander HP and fatigue, buff chips, and a
    "break chance" meter computed from the real morale rule; a combat ticker; a round and
    phase indicator; a tug-of-war strength bar; floating numbers with element glyphs; a
    result card.
12. **Settings**: gore (Off, Standard, Brutal), shake, hit-stop and slow motion, flashes,
    reduced motion (follows the OS by default), particle detail, numbers, ticker, sound
    captions, death cries, and four volume sliders. Everything that drives timing is pure
    and unit-tested; rendering and audio get Playwright smoke tests.

---

## 1. Principles

- **Truth first.** A player who counts sprites, bodies, and badges must never find the
  viewer contradicting the result. Invented detail is plausible fiction inside the log's
  tallies, never against them.
- **Read first, gore second.** Silhouettes, lanes, banners, and counts carry the
  information; blood and shake carry the feeling. With gore Off and reduced motion on, a
  battle must still be fully understandable.
- **Every second earns its place.** Rounds where little happens are short. Big moments get
  room to breathe. The player can always pause, speed up, step, scrub, or skip.
- **Weight by size.** A militiaman's death is a beat; a Giant's death shakes the screen; a
  god's death stops time.
- **Same replay, same show.** The choreography draws from a presentation random stream
  seeded by the battle id, so a replay looks and sounds the same every time, seeking is
  exact, and tests can pin it. It never touches `state.rng`.

---

## 2. What the log gives, and the five additions it needs

### 2.1 Measured

The current resolver was run on two fixture armies (script in the scratchpad, not in the
repository):

| Battle | Rounds (avg / max) | Events | Record JSON | Gzipped | Hits | Kills | Busiest round |
|--------|--------------------|--------|-------------|---------|------|-------|---------------------|
| Starting armies (20 Cinder Warriors, 10 Flame Archers, Adept, Priest vs 20 Wardens, 10 Longbows, Druid, Priest), 50 seeds | 6.7 / 10 | 75 | 5.6 to 6.2 KB | 0.9 KB | 85 | 28 | 39 hits |
| About 300 vs 300 (7 vs 6 squads, 6 commanders each, Pyre Storm, Swarm, Treant), 20 seeds | 8.7 / 10 | 366 | 25 KB | 2.6 KB | 1,124 | 342 | first contact: 51 melee pairs, 230 hits, 104 to 141 kills |

With the proxy rule of section 3.4, the heaviest melee phase (first contact in the big
battle) shows 43 to 64 sprite deaths on screen. Every later phase shows fewer than 35.
Resolution took about 14 ms. Battles end by rout long before round 50; the round-50
stalemate is the rare worst case, handled by section 9.5.

### 2.2 What is missing

The aggregated log is the right shape for saves, but it hides the information that makes
a blow feel like a blow:

- **Misses vs deflections vs wounds.** `melee { hits, kills }` cannot tell a sword that
  bounced off a Briar Guard's bark plate from one that cut but did not kill. Sparks vs blood
  is the single most important distinction in combat feel, and it is also tactical
  information ("my axes cannot get through their armor").
- **Phase boundaries.** Damage to commanders from the ranged phase is logged before the
  volley tallies, so a `damage` event right after a cast is ambiguous. The choreographer
  must know where each phase begins.
- **Who killed the commander.** `damage` on a commander does not say which group struck.
  The name card should say "slain by the Wardens".
- **Caster fatigue.** The roster has no pips, so the viewer cannot show fatigue.
- **Where.** The record has the province but not the terrain (static, but the viewer should
  not need live state, per `docs/04` decisions) and not whether the defenders were stormed
  behind walls.

### 2.3 The additions (sim side, pure, deterministic, about 20 lines)

| # | Change | Where | Bytes |
|---|--------|-------|-------|
| A1 | `{ kind: 'phase'; phase: 'spells' \| 'ranged' \| 'melee' \| 'morale' \| 'end' }`, pushed at the start of each round step that logs anything (an empty phase logs no marker) | `resolve.ts` | A1 to A5 together: +7.8 KB raw (+32%) on the big battle, +2 KB on the small one; gzipped +0.5 KB and +0.2 KB |
| A2 | `attacks`, `blocked` (hits that dealt 0 damage), `dmg` (damage dealt, capped at each target's HP) on `volley` and `melee` | `attacks.ts` `land` | (the bulk of it) |
| A3 | `by?: BattleUnitRef` on `damage`: the striking group for weapon hits on commanders; the shielded unit for fire-shield burns. Spell damage leaves it out (the preceding `cast` names the caster) | `attacks.ts` | small |
| A4 | `fatigue: number` on `cast`: the caster's fatigue after paying | `spells.ts` | small |
| A5 | `BattleRecord.scene: { terrain: TerrainId; storm: { wallsStanding: boolean } \| null }` | `apply.ts`, `types.ts` | 50 bytes |
| A6 (optional) | `RosterSquad.mor` and `RosterCommander.mor`: morale with setup modifiers folded in, for an exact break-chance meter | `resolve.ts` `roster()` | small |

None of them changes a roll or the rng stream, so every determinism and balance test keeps
passing; `foldReplay` ignores the new fields. Add one test: per squad, the sum of `kills`
over volleys, melee, and damage equals the fold's losses, and `blocked ≤ hits ≤ attacks`.

**Saves.** Twenty big records grow from about 500 KB to about 650 KB of raw JSON, but
replay JSON gzips 7 to 10 to 1 (measured: 32.6 KB to 3.0 KB for the big battle with the
additions). Recommendation for the save phase (owned by `serialize.ts`'s
caller, outside the sim): store saves gzipped with `CompressionStream('gzip')` in
IndexedDB. A save with twenty big records then stays well under 100 KB for the battles.

**If an addition is refused**, the viewer still works: without A2 it estimates attacks from
living attackers times weapons, apportioned by target size, and shows hits that did not kill
as wounds (no sparks). Without A1 it segments phases heuristically (a `volley` opens the
ranged phase, a `melee` opens melee). Without A3 the card says "has fallen". Without A4
there is no fatigue bar. A1 and A2 are strongly recommended; the rest are cheap
improvements.

---

## 3. The stage

### 3.1 Canvas and camera

- The viewer is a modal over the game, as `docs/07` says. The Pixi canvas fills the modal
  between a top bar (48 px) and the transport bar (88 px). The side panels overlay the
  canvas edges as translucent docks (280 px expanded, 72 px collapsed; Tab toggles), so the
  canvas is never squeezed.
- **World**: 1600 x 900 world units (wu), letterboxed to the canvas. At 1920 x 1080 the
  scale is about 1.05; at the 1280 x 720 minimum about 0.64, where a size-1 troop is about 30
  px tall. That is still readable because silhouettes are distinct per archetype.
- **Default framing** shows the whole field. The camera only moves for beats: a push-in of
  1.08x to 1.35x toward the action, eased in 0.5 s, held, eased out in 0.7 s, clamped to the
  world. There are no cuts. During melee a gentle drift of at most 40 wu follows the
  kill-weighted center of the clash. "Follow action" (on by default) and reduced motion
  (locks the camera) control this.
- **Player on the left.** The player's side is always the left side, whether attacking or
  defending (records are kept only for battles a player fought). The panel headers say
  ATTACKER or DEFENDER. When two AI-free sides fight (not possible in M1), the attacker goes
  left.

```
 x=0                              x=800 (center)                          x=1600
 |  edge  |   rear   |  middle  |   front   | gap |   front   |  middle  |   rear   |  edge  |
 |660-800 | 490-660  | 300-470  |  80-280   |0-80 |  80-280   | 300-470  | 490-660  |660-800 |
 |                         PLAYER  <------  clash line  ------>  ENEMY                       |
 y=300  horizon ------------------------------------------------------------------------
        backdrop layers (sky, far, mid)                     banners of commanders
 y=470  lane 4 (far)    [blk][blk]      [blk]   |   [blk]      [blk]
 y=535  lane 2          [blk]           [blk]   |   [blk]      [blk]  [mage]
 y=600  lane 1 (center) [cmdr][banner]  [blk]   |   [blk]      [blk]  [cmdr]
 y=665  lane 3          [blk]           [blk]   |   [blk]
 y=730  lane 5                          [blk]   |   [blk]
 y=795  lane 6 (near)                           |
 y=900  foreground props (grass, rocks, reeds) at the bottom edge
```

Band distances are measured from the center line (x = 800); the player's bands mirror the
enemy's.

### 3.2 Rows and lanes

- **Bands** (distance from the center line): front 80 to 280, middle 300 to 470, rear 490
  to 660. The edge (660 to 800) is where armies enter and routers leave. The gap (0 to 80)
  is no-man's land at the start.
- **Lanes**: six depth lanes at y = 470, 535, 600, 665, 730, 795. Squads of a row fill lanes
  from the center outward in the order 600, 535, 665, 470, 730, 795, sorted by commander
  (setup order), then roster order, so a commander's squads sit together. A seventh squad
  in a row takes a second slot in the outer half of the band.
- **Commanders** stand in their row at the lane nearest the average lane of their squads,
  at the band's outer third, with their banner pole planted 30 wu behind them. A commander
  with an Attack slot strides into the front band (`advance`, section 13).
- **Summons** appear in the row the sim gives them (`summon.row`), in the next free lane.
- **Provincial defense** squads (refs `pd0`, `pd1`) stand under a plain banner in the owner's
  banner color, labeled "Provincial defense".

### 3.3 Scale by unit size

Art is 64 x 64 SVG rasterized at 2x. A size-1 troop stands 46 wu tall in the nearest lane.

| Size | Sprite scale | Visible cap | Block grid (files x ranks) | Spacing x, y (wu) | Examples |
|------|--------------|-------------|----------------------------|-------------------|----------|
| 1 | 1.00 | 20 | 4 x 5 | 24, 14 | militia, archers, riders |
| 2 | 1.30 | 12 | 3 x 4 | 32, 17 | Oakheart, Oracle, Wild Spirit |
| 3 | 1.70 | 6 | 2 x 3 | 44, 22 | Salamander |
| 4 | 2.20 | 4 | 2 x 2 | 58, 30 | Giant, Treant, Titan |
| 5 | 2.70 | 2 | 1 x 2 | 70, 34 | Ash Colossus |
| 6 | 3.40 | 1 | 1 x 1 | - | Great Wyrm |

- Commanders draw at 1.15x their size's scale (heroic emphasis), with a nameplate on hover;
  pretenders always show theirs.
- The presentation profile (section 4.12) may override the visual size. The Living Monolith
  is size 1 in content (baseline) but is drawn as size 6.
- **Perspective**: scale x (0.88 + 0.12 x (y - 470) / 325), so the far lane is 12% smaller.
  Everything is z-sorted by y; large units overlap the lane behind them, which is fine.
- **Shadows**: an elliptical shadow under every sprite (alpha 0.25); flyers' shadows stay on
  the ground and shrink with altitude.

### 3.4 Proxies: how many sprites a squad shows

```
visible(count, start, cap) =
  0                                        if count = 0
  count                                    if start <= cap      (one sprite per troop)
  min(cap, max(ceil(cap * count / start),  min(count, 5)))      otherwise
```

A squad of 60 Cinder Warriors shows 20 sprites; after 30 deaths it shows 10; its last five
troops are five sprites ("last five" rule), so the end of a squad is always literal. The
function is monotonic, so sprites only ever disappear by dying or fleeing. The count badge
(a shield-shaped plaque in the banner color, bottom corner of the block) always shows the
exact count.

When a kill does not remove a sprite (the squad still has more troops than sprites), the
struck sprite plays a **proxy kill**: a ghost copy of it falls and becomes a corpse at its
feet while the original staggers back 8 wu and recovers. It reads as "the man beside him
went down". So **every dead troop leaves a body**: after the 300-vs-300 battle about 340
bodies lie on the field, at the places where they fell.

### 3.5 Terrain backdrops

The record's terrain (A5) picks a backdrop. Each is four parallax layers (sky gradient,
far silhouette, mid layer, ground) plus foreground props along the bottom edge, all SVG or
procedural, with the ground filled from the terrain fill in `docs/09` and darkened 25% so
sprites read on it. Each has an ambience loop and a reverb (section 11).

| Terrain | Sky and far layer | Ground and props | Ambient motion | Special |
|---------|-------------------|------------------|----------------|---------|
| Plains | pale sky, low rolling hills | short grass, wildflowers, a lone tree | grass sway, drifting seed fluff | dust plumes are larger (dry ground) |
| Farmland | warm sky, a windmill silhouette | crop rows, a fence, haystacks | wheat waves, crows lifting off at first blood | trampled crops: churned decals appear under blocks |
| Forest | canopy band across the top dims the light 15% | moss, ferns, roots, fallen logs | falling leaves, light shafts | sound is damped (short dark reverb) |
| Hills | layered ridges | heather, scattered rocks | wind gusts in the grass | stones skitter at heavy footsteps |
| Mountains | jagged peaks with a snow line | scree, boulders | snow flurries, breath puffs on troops | long bright reverb, echoes on horns |
| Swamp | low mist band, dead trees | reeds, black water pools | mist drift, ripples, fireflies | mud splashes on footsteps; corpses sink 30% into pools |
| Wasteland | rust-red haze, cracked mesas | cracked earth, bones, dead shrubs | ash flurries, heat shimmer | slapback echo; distant thunder in the bed |
| Storm (A5 `storm` set) | the fort wall behind the defender's rows; walls standing: crenellated wall with defender archers on the rampart (raised 40 wu, half hidden); breached: a rubble gap with smoke | rubble, spent arrows | banners on towers, smoke | stone slap in the reverb; a wall-crack sound at start |

**Time of day and season** (cosmetic, deterministic): the battle id's hash picks dawn,
day, or dusk (a color-matrix lighting tint on the whole scene: dawn warm and low,
dusk orange-violet); the record's day picks the season (months 11 to 2 add frost on the
ground and breath puffs; months 9 and 10 add autumn leaves on Forest and Farmland).

### 3.6 The field remembers

Persistent decals, drawn once into a ground render texture so they cost nothing per frame:
corpses (darkened to 55% brightness, rotated, on top of their pool), blood pools, spent
arrows stuck in the ground, dropped weapons and shields from routs, scorch marks, burning
patches that burn out into scorch, flowers from Regrowth, churned mud along the clash line
that darkens as kills accumulate there. On a backward seek the ground texture is rebuilt
from the timeline (all decals with time before the seek point); this is under 2,000 draws.

---

## 4. Troops in motion

### 4.1 Idle life

- Breathing bob: 2 wu over 1.2 s, per-sprite phase offset, so a block never moves in
  lockstep. Weapon sway of 3 degrees. Every 4 to 9 s a random sprite shifts its feet,
  adjusts its helmet, or glances at a neighbor.
- Banners ripple continuously (a sine-displaced mesh). A squad's pennant (a small flag on
  its front-left sprite) ripples with them.
- While waiting for contact, front-rank troops brace: spears lowered, shields raised.

### 4.2 Closing, advancing, the clash line

- **Closing** (rounds before a block's closing round, `BATTLE.closingRound`): at each
  `roundStart`, front-row melee blocks step forward a share of the gap: speed 1 trudges 25
  wu, speed 2 walks 35 wu, speed 3 trots 50 wu. Marching dust at the feet; a footstep
  ensemble sound whose density follows the number of moving sprites. Archers do not move.
- **Contact**: when a block's first `melee` event arrives, it covers the rest of the
  distance in the first 25% of the melee window: speed 1 "advances in step" (0.9 s), speed 2
  "runs" (0.7 s), speed 3 and flyers "charge" (0.5 s, section 4.6).
- **Clash line**: the engaged blocks of both sides meet at a clash line, their front files
  14 wu apart and interlocking. Where it sits:
  - both sides' current fronts are their front rows: at the center, plus a push offset;
  - when one side's front has fallen back to its middle or rear row (its front row is dead
    or fled), the other side's blocks advance into that band and the clash line moves to its
    inner edge, so a collapse visibly opens the enemy formation;
  - only one side closing (the other's front holds back, archers for example): at the
    holding side's inner edge.
  - **Push offset**: 30 wu x (kills dealt - kills taken) / (kills dealt + kills taken) over
    the last two melee phases, eased over 1 s. The line leans into the losing side.
- Blocks that did not fight this phase stay where they are. Blocks never cross the clash
  line except the winners' pursuit (section 7.4).

### 4.3 Picking a foe

The choreographer (section 14) turns each melee phase into individual strikes:

1. **Duels**: each visible attacker sprite of a block in a `melee` pair picks a foe in the
   target block: nearest by lane, then by file, never one already marked to die earlier in
   the phase. Duels persist across rounds while both live, so the eye can follow one fight.
2. **Gang-ups**: when a block outnumbers its foes, extra sprites flank (2 or 3 on one foe, at
   y +-12 wu). Large units (size 3+) are mobbed by up to 5 small sprites around them.
3. **Stepping over the dead**: when a foe dies, the sprite steps forward over the body (0.2
   s) and takes the next nearest foe.
4. **Cross-lane strikes** happen only when the target block is in another lane; the lunge
   then goes diagonal.
5. **Simultaneous resolution is visible**: a sprite marked to die this phase may still land
   its own strike first (the sim rolls every attack against the field as the phase began),
   so mutual kills appear as two bodies falling together.

### 4.4 Weapon motions

A render-side table keyed by weapon name, with fallbacks by damage and unit size. Times are
windup / strike / recover at 1x; the lunge is toward the foe and back. **Weight class**
drives hit-stop, shake, and sound weight; a unit of size 3 bumps its weapon one class up,
size 4 and up makes it huge.

| Weapon (units) | Motion | Weight | Timing (s) | Lunge | Visual detail | Swing sound |
|----------------|--------|--------|------------|-------|---------------|-------------|
| Spear (Ash and Thorn Militia, Light Infantry, Swamp Fighter, Wolf Rider) | thrust | medium | 0.10 / 0.06 / 0.14 | 14 wu | spear level, extends 10 wu, front rank jabs over the shoulder of the rank ahead | `thrust` |
| Lance (Ash Rider) | couched thrust; first melee round: charge (4.6) | heavy | 0.08 / 0.05 / 0.15 | 18 wu | lance tip quivers at rest; impaled foe lifted 6 wu on the charge | `thrust` |
| Halberd (Briar Guard) | alternating chop and thrust | heavy | 0.18 / 0.07 / 0.20 | 12 wu | blade arc -70 to +30 degrees | `swing.heavy` |
| Axe (Cinder Warrior, Ash Chieftain) | overhead chop | medium | 0.13 / 0.06 / 0.15 | 10 wu | arc -80 to +35 degrees, ash flakes off the head | `swing.light` |
| Great Axe (Berserker) | two-handed diagonal chop | heavy | 0.18 / 0.07 / 0.20, x0.85 in frenzy | 14 wu | arc -110 to +45, a second backhand chop 30% of the time | `swing.heavy` |
| Sword (Warden, captains, Heavy Infantry, Ash Rider) | horizontal slash | medium | 0.12 / 0.06 / 0.14 | 10 wu | arc -40 to +60, a white smear on the arc (2 frames) | `swing.light` |
| Burning Blade (Flamebrand) | slash with a fire trail | medium | 0.12 / 0.06 / 0.14 | 10 wu | trail of 8 ember particles along the arc | `swing.light` + crackle |
| Great Sword (Titan) | wide sweep, strikes up to 3 adjacent foes | huge | 0.35 / 0.10 / 0.35 | 20 wu | arc -100 to +80, a smear the width of a block | `swing.huge` |
| Oak Maul (Oakheart) | overhead smash | heavy | 0.20 / 0.08 / 0.22 | 12 wu | ground puff on impact | `swing.heavy` |
| Club (Giant) | overhead smash with ground shock | huge | 0.35 / 0.10 / 0.35 | 18 wu | dust ring, neighbors stagger | `swing.huge` |
| Crushing Limbs (Treant) | double-limb slam | huge | 0.40 / 0.10 / 0.40 | 16 wu | leaves shed on each swing | `swing.huge` + `creak` |
| Burning Fists (Ash Colossus) | alternating punches, fire burst on contact | huge | 0.30 / 0.08 / 0.30 | 18 wu | embers stream from the fists | `swing.huge` + roar |
| Dagger, Knife (scouts, Ember Skirmisher) | double stab | light | (0.06 / 0.04 / 0.08) x2 | 8 wu | quick in-out twice | `thrust` (short) |
| Staff (priests, mages, Oracle) | swinging bonk | light | 0.10 / 0.06 / 0.12 | 8 wu | staff head glows faintly in the caster's color | `swing.light` |
| Wolf Bite, Bite (Wolf) | crouch and pounce bite | medium | 0.12 / 0.06 / 0.16 | 18 wu hop | head snaps, the wolf worries the foe for 0.2 s on a wound | growl |
| Bite (Great Wyrm) | neck lunge | huge | 0.30 / 0.08 / 0.35 | 40 wu | jaws open on windup, foe lifted and dropped on a kill | roar |
| Claws (Wild Spirit) | leaping rake | medium | 0.12 / 0.05 / 0.18 | 24 wu leap | three claw streaks (white smear) | `swing.light` |
| Sting (Hornet Swarm) | three darts | light | (0.05 / 0.03 / 0.05) x3 | 10 wu | the cloud contracts toward the foe | buzz pitch-up |
| Flame Touch (Fire Sprite) | dive and touch | light | 0.10 / 0.05 / 0.15 | 20 wu dive | flare on contact | crackle |
| Unarmed (Living Monolith, any unit with no melee weapon) | shove or glyph pulse | light | 0.10 / 0.05 / 0.15 | 6 wu | the Monolith's glyphs pulse a shockwave instead | low hum |

Ranged weapons:

| Weapon (units) | Motion | Projectile | Arc apex | Flight (1x) | Detail |
|----------------|--------|------------|----------|-------------|--------|
| Shortbow (Archer) | draw 0.30, loose, recoil 0.12 | arrow | 110 wu | 0.65 s | |
| Longbow (Longbow Hunter) | draw 0.40, loose, recoil 0.15 | arrow | 180 wu | 0.85 s | the volley rises like a dark cloud |
| Fire Arrows (Flame Archer) | draw 0.35, tips lit (a flame flicks on at draw) | fire arrow | 150 wu | 0.80 s | ember trail; hits ignite the target 1 s; ground misses burn 1.5 s |
| Javelins (Ember Skirmisher) | run-up 2 steps, throw | javelin, spinning | 60 wu | 0.50 s | thrower sprints 12 wu forward and back |
| Fire Breath (Salamander) | inhale 0.3 s (throat glows), stream 0.6 s | cone, 260 wu long | - | - | cone of fire particles; ground burns 2 s |
| Breath (Great Wyrm) | rear up, sweep the cone across the row 0.9 s | cone, 320 wu | - | - | element by the nation's color (display only, per `docs/05`); Ember fire, Loam a green spore-and-thorn gale |

### 4.5 Defense reactions

Each sampled strike has an outcome class from the log (section 9.3): miss, deflect (hit,
0 damage), wound, kill, or proxy kill. A miss gets a reaction chosen by the target's profile:

| Target | Miss reaction | Deflect visual | Deflect sound |
|--------|---------------|----------------|---------------|
| Has a shield (Warden, Warden Captain, Heavy Infantry) | shield raised 70% (thunk), parry 30% | shield takes it: wood chips or a spark by shield material | `block.shield` |
| def 12 or more, beasts, flyers | dodge: sidestep 6 wu or duck | - | whoosh only |
| Others | parry 50% (weapons meet, 4 white spark streaks), dodge 50% | - | `clang.parry` |
| Constructs, the Monolith | whiff (the attacker just misses) | - | whoosh |

A **deflection** (A2 `blocked`) always shows on the armor, by armor class:

| Armor class | Rule | Visual | Sound |
|-------------|------|--------|-------|
| soft | prot 0 to 2 (cloth, leather) | dull puff of dust | `deflect.soft` |
| mail | prot 3 to 6, metal (Cinder scale, independents) | 6 yellow-white spark streaks | `deflect.mail` |
| plate | prot 7 or more, metal | 10 bright sparks, a ring flash | `deflect.plate` |
| bark | Thornwood troops with prot 3 or more | brown wood chips | `deflect.bark` |
| wood | Treant, Oakheart | large splinters | `hit.wood` |
| stone | Living Monolith, Ash Colossus | grey chips, a puff of grit | `hit.stone` |
| hide | beasts with prot 3 or more | tufts of fur | `deflect.soft` |

The armor class rises with buffs: Bark Skin turns any squad's deflections into bark. When
more than 60% of a pair's hits are deflected in a phase, an "ARMOR" chip pops over the
target block for 1 s: the player learns that those weapons cannot get through.

### 4.6 Cavalry charge

Triggered by the first `melee` event of a squad whose unit is mounted, or has a weapon with
`firstRoundBonus` (the Ash Rider's lance, where the bonus really applies), or is speed 3
(Wolf Riders, wolves: a "rush" variant).

1. **0.0 s**: the block lowers lances (weapon layer rotates to level over 0.2 s); a hoof
   ensemble starts and swells; for wolves, a howl.
2. **0.2 to 0.7 s**: gallop across the remaining gap, dust trail (40 particles), sprites bob
   at 4 Hz; the ground under the target trembles (1 wu shake on the target block).
3. **0.7 s, impact**: global hit-stop 120 ms; screen shake trauma 0.25 + 0.01 per visible
   rider (cap 0.45); the target block's front file is thrown back 12 to 24 wu, two or three
   sprites knocked flat (those that die stay down); impaled kills are lifted 6 wu on the
   lance; a crash of layered clangs, flesh hits, and horses screaming.
4. **0.7 to 1.0 s**: the riders' block plows 10 wu into the line and settles into duels.
   After the charge they fight with sword and lance (both weapons strike each round, as in
   the sim).

When both sides charge each other (riders into wolf riders), the impact happens at the
center with both blocks thrown back 8 wu.

Mounted deaths split: the rider falls backward, the mount either collapses with him (60%)
or bolts riderless toward its own edge (40%, it leaves the field).

### 4.7 Archers and missiles

- **Draw**: the whole squad draws together (0.3 to 0.4 s, bows bend via a part rotation),
  then looses in a ragged ripple over 0.25 s (per-sprite delay), each sprite recoiling 4 wu.
- **Flight**: each projectile flies its own ballistic arc toward its chosen target sprite,
  with apex and flight time from the table above. A long volley's arrows cast tiny
  shadows racing across the ground. Projectile count per volley, section 9.3.
- **Landing**, by outcome:
  - kill: the arrow sticks in the body and stays with the corpse; death as section 5.6, or a
    proxy kill;
  - wound: the arrow sticks in the sprite (up to 3 visible per sprite, "pincushion") and
    stays until it dies; flash and blood;
  - deflect: the arrow glances off with a spark (metal) or snaps (bark) and falls;
  - shield: the arrow sticks in the raised shield (thunk);
  - miss: the arrow sticks in the ground within 10 to 40 wu of its target and stays (a
    ground decal); in swamp it splashes and is gone.
- **Ammunition**: the viewer counts each squad's volleys against its weapons' `ammo` in
  content. When a squad has used its last, it slings its bows and draws knives (a weapon
  layer swap) and the ticker says "Flame Archers are out of arrows". If they later fight in
  melee they use the unit's melee weapon, or unarmed.
- **Storm grounds every shot**: under a storm field effect archers lower their bows and
  shield their faces; no projectiles fly (the sim fires none).

### 4.8 Berserkers

- Before contact: they shift from foot to foot, beat weapons on chests, a 1 wu jitter at 15
  Hz. In the closing walk they move 10 wu ahead of the line.
- On their first contact: a roar (chorus of distorted formant voices) and a 0.85x swing
  duration (frenzy).
- They never rout: when their squad shrinks to the last five, each remaining sprite gets a
  red rim pulse at 1.5 Hz, and the last one's death is a featured kill with a final roar.
- The sim's berserk bonus is per troop below half HP, which the log does not show; the
  viewer shows the rage from the moment the squad has taken any hit, which is close enough
  and never claims a number.

### 4.9 Flyers

Fire Sprites, Hornet Swarms, the Great Wyrm.
- Hover 40 to 80 wu above their lane, sine bob 6 wu at 0.8 s, shadows on the ground.
- They close in round 2 (as speed 3): they fly over the gap rather than run, arriving above
  their foes.
- Attacks are swoops: dive arc onto the foe (0.25 s), strike, climb back (0.3 s).
- Deaths: Fire Sprites burst into a puff of embers (no corpse, a scorch dot); a Hornet
  Swarm sprite (drawn as a cloud of 12 dots) loses its dots, which drop like dust; the Wyrm
  falls from the sky (1.4 s, huge dust burst, trauma 0.5).

### 4.10 Giants and monsters

Giant, Treant, Salamander, Titan, Ash Colossus, Great Wyrm, Oakheart (lighter):
- Footsteps: every step of a size-4+ unit raises a dust puff, a 2 wu local tremor, trauma
  0.04, and `footstep.giant`.
- Swings are slow and read from across the field (windup 0.35 to 0.4 s with a wind-back of
  the whole body).
- A huge impact knocks back two or three adjacent sprites in the target block (cosmetic
  stagger; only the logged kills die).
- Wounds on a monster: a chunk of bark, stone, or flesh flies off, and the sprite takes a
  dark "damaged" tint that deepens with lost HP for commanders (exact, from `damage`).
- Deaths topple slowly (0.9 to 1.4 s), with dust, trauma 0.3 (size 4 to 5) or 0.5 (size 6),
  and a body that stays.
- The Treant regenerates: at end of round (`heal`) leaves and green motes swirl and its
  bark knits (cracks close).
- The Salamander's only weapon is its breath (ammo 6). Out of breath, it lashes with its
  tail (unarmed, 0 damage).

### 4.11 Pretender bodies

A pretender is a roster commander whose unit is a pretender body (content knows which).
At the intro it gets a 1.2 s spotlight: the camera dips toward it, its nameplate shows,
and its aura flares in the dominant pip color.

| Body | Look and idle | Fighting | When it dies |
|------|---------------|----------|--------------|
| Oracle of the Flux (size 2) | robed figure floating 10 wu up, an aura ring in its dominant color, orbiting motes | casts mostly; staff bonk | the robe collapses empty, its motes scatter |
| Titan (size 4) | armored giant, great sword resting on the shoulder | wide sweeps hitting up to three foes; each step shakes | kneels, then falls forward; the sword stands upright in the ground |
| Great Wyrm (size 6, flying) | wings beat at 1.2 Hz, the shadow sweeps the ground, smoke from the nostrils | breath sweeps a whole row; bites lift foes | falls from the sky; the ground shakes twice |
| Living Monolith (drawn size 6, immobile) | a towering stone with glyphs that pulse in its color | does not move; its "attack" is a glyph pulse (0 damage); stone chips fly when struck | cracks spread over 1.2 s, then it shatters into rubble that stays |
| Wild Spirit (size 2, stealthy) | a translucent, shifting beast form; it flickers out and back every few seconds | leaps and rakes; regenerates with green motes | dissolves into wind and leaves |
| Ash Colossus (size 5) | a burning giant of ash; embers rise from it constantly | burning fists; its fire shield licks back at every striker that hits it (section 5) | breaks apart into glowing chunks that cool to black |

### 4.12 Presentation profiles (render data, every M1 unit)

`src/render/battle/profiles.ts` maps each unit id to: archetype silhouette, visual size
override, motions per weapon, shield, armor class, blood type, voice, death style set,
mount, flying, and extras. Fallbacks derive from content (tags, size, prot, weapons), so a
new unit never breaks the viewer; a test checks that every unit and battle spell in content
has a profile or a valid fallback (the CLAUDE.md rule "add it to the content validation
fixtures" extends to profiles).

| Unit | Archetype | Armor | Blood | Voice | Notes |
|------|-----------|-------|-------|-------|-------|
| Ash Militia | light infantry, ash-grey skin, ragged cloth | soft | red | human | |
| Cinder Warrior | heavy infantry, scale armor, jagged axe | mail | red | human | |
| Ember Skirmisher | skirmisher, bare arms, javelin quiver | soft | red | human | sprints; knife when out |
| Flame Archer | archer, smoldering quiver | soft | red | human | fire arrows |
| Berserker | berserker, warpaint, great axe | soft | red | human (roar) | 4.8 |
| Ash Rider | cavalry: ash-grey horse, scale armor, lance | mail | red | human + horse | charge |
| Flamebrand | sacred warrior, burning blade, faint aura | mail | red | human | sacred units get a soft aura in the nation color |
| Fire Sprite | sprite: small flying flame imp | none | ember | crackle | no corpse |
| Scout (both) | scout, hooded | soft | red | human | 50% translucent until it acts (stealthy) |
| Ash Chieftain | leader with banner, axe | mail | red | human (deep) | |
| Pyre Priest | priest, flame-topped staff | soft | red | human | |
| Ember Adept, Cinder Magus | mage, ember circlet (the Magus larger) | soft | red | human | |
| Salamander | fire lizard, size 3 | plate (scales) | ember | monster hiss-roar | breath |
| Thorn Militia | light infantry, leaf cloak | soft | red | human | |
| Warden | heavy infantry, bark armor, round shield | bark | red | human | shield |
| Longbow Hunter | archer, leaf cloak | soft | red | human | high arcs |
| Briar Guard | heavy infantry, thick bark plate, halberd | bark | red | human | |
| Wolf Rider | cavalry on a great wolf | bark (rider) | red | human + wolf | rush, howl |
| Oakheart | size 2 bark-skinned sacred, oak maul | wood | sap (amber) | deep human | splinters |
| Hornet Swarm | swarm: cloud of 12 dots per sprite | none | ichor | buzz | no corpse |
| Warden Captain | leader with banner, sword, shield | bark | red | human | |
| Grove Priest, Sapling Druid, Elder Druid | priest or mage, antler and leaf | soft | red | human | |
| Treant | treant, size 4 | wood | sap | wood creak and groan | regeneration |
| Light Infantry, Heavy Infantry, Archer, Swamp Fighter, Independent Captain | independents in grey and tan | soft / mail / soft / soft / mail | red | human | Swamp Fighters do not splash in swamp |
| Wolf | wolf | hide | red | wolf | |
| Giant | giant, size 4, club | soft | red | monster | footsteps |
| Pretender bodies | section 4.11 | plate / stone / soft | by body | by body | |

The garrison holder never fights and has no profile.

---

## 5. Impact

### 5.1 Outcome classes

| Outcome | Source in the log | What the player sees | Sound |
|---------|-------------------|----------------------|-------|
| Miss | `attacks - hits` | dodge, parry spark, or shield thunk (4.5) | whoosh, clang, or thunk |
| Deflect | `blocked` | sparks or chips by armor class, target flinches 2 wu | deflect by class |
| Wound | `hits - blocked - kills` | white flash (one frame), red tint 0.15 s, blood spray, knockback 4 wu, a blood drop on the ground | `hit.flesh`, a grunt 40% of the time |
| Kill (visible) | sprite deaths from section 3.4 | hit-stop, flash, big spray, death animation, the body stays, a pool grows | heavy flesh or bone crunch, death cry, body fall |
| Proxy kill | `kills` beyond visible deaths | spray, the struck sprite staggers 8 wu, a ghost copy falls and stays as a corpse | flesh hit, a cry from the crowd layer |
| Spell damage | `damage` after a `cast` | per spell (section 6) with element visuals | per element |

### 5.2 Hit-stop

Hit-stop freezes the two involved sprites (local) or the whole scene (global) for a few
frames at the moment of contact. It is what makes a blow land.

| Weight | Local, every kill | Local, every wound | Global (featured kills only) |
|--------|-------------------|--------------------|------------------------------|
| light | 50 ms | 30 ms | 60 ms |
| medium | 70 ms | 40 ms | 80 ms |
| heavy | 100 ms | 50 ms | 100 ms |
| huge | 140 ms | 60 ms | 120 ms |
| commander killing blow | - | - | 180 ms, then slow motion |

At most one global hit-stop per 450 ms of real time. Global hit-stops are off at 2x and
above, and with the hit-stop setting off or reduced motion on.

### 5.3 Screen shake

A trauma model: each cue adds trauma (0 to 1); trauma decays at 1.5 per second; the shake
offset is 12 wu x trauma squared x a 25 Hz smooth noise, rotation 0.5 degrees x trauma
squared. Squaring keeps small hits subtle and big ones violent.

| Cue | Trauma |
|-----|--------|
| kill, light or medium weapon | 0.03 |
| kill, heavy weapon | 0.06 |
| kill, huge weapon | 0.15 |
| size 4+ footstep | 0.04 |
| size 4 to 5 death | 0.30 |
| size 6 death | 0.50 |
| first contact | 0.35 |
| cavalry charge impact | 0.25 + 0.01 per rider (cap 0.45) |
| Fireball | 0.30 |
| Pyre Storm, each meteor | 0.12 (total cap 0.70) |
| commander death | 0.20 |
| pretender death | 0.60 |
| wall rises or falls | 0.25 |
| thunder (close strike) | 0.15 |

The setting scales it: Full 1.0, Low 0.5, Off 0. Reduced motion forces Off.

### 5.4 Flashes, sparks, blood, bodies, dust

- **Hit flash**: an additive white silhouette (pre-generated per sprite texture) at 90% for
  one frame, then a red multiply tint fading over 0.15 s. White first means the flash reads
  for every kind of color vision.
- **Sparks**: thin streak particles, 40 to 90 wu/s, life 0.12 to 0.25 s, yellow-white to
  orange.
- **Blood spray** (gore Standard): 8 particles on a wound, 18 on a kill, cone of 50 degrees
  along the strike direction, gravity, life 0.4 to 0.7 s; on landing each leaves a 2 to 4 wu
  droplet decal. Brutal: 14 and 32 particles plus 1 or 2 larger "chunk" particles on heavy
  and huge kills.
- **Blood pools**: under each corpse, radius grows from 0 to 8 wu x size over 1.2 s, then
  darkens over 10 s. Pools that overlap merge visually (same color, alpha 0.8).
- **Bodies**: lie where they fell, rotated as they fell, darkened to 55%, baked into the
  ground. Weapons dropped by the dead lie beside them.
- **Dust**: at footfalls, falls (a puff of 6 particles), charges (a trail), big impacts (a
  ring). Dust takes the ground color.
- **Dismemberment** (Brutal only): a heavy or huge kill has a 25% chance to detach a part
  (helmet with head, arm with weapon) that tumbles 30 to 80 wu and stays; a huge kill on a
  size-1 unit has a 15% chance to split the sprite in three. Parts come from the SVG part
  system, so this costs no extra art.
- **Gore on survivors** (Brutal): a sprite that killed in melee gets a blood splatter decal
  on its weapon part.

### 5.5 Elements and blood types

| Element or blood | Wound | Kill | Corpse |
|------------------|-------|------|--------|
| physical, red blood | red spray | red spray, pool | normal |
| fire (weapons, spells, fire shield) | ember sparks, orange flash, a smoke wisp | burns: the sprite blackens over 0.3 s and collapses; flames 1.5 s | charred, smoking 3 s, no pool, a scorch ring |
| nature (Thorn Spray) | splinters and leaves with the blood | thorns impale | normal, thorn spikes stay 2 s |
| cold (M2) | ice shards | the sprite freezes blue-white, then shatters or topples stiff | frosted |
| holy (M2) | white flare, straight rays | burns white from within | ash outline |
| decay (M2) | green-black ooze | withers, sinks | rotted, a dark stain |
| sap (Treant, Oakheart) | amber droplets, wood chips | splinters, a creaking topple | a fallen log shape |
| ember (Salamander, Fire Sprite, Ash Colossus) | molten droplets that glow and cool | burst of embers | glowing chunks cooling to black over 4 s |
| ichor (Hornets) | yellow-green specks | dots fall | none |
| none (Monolith) | stone chips | shatters | rubble |

With gore Off, blood becomes a grey-white dust puff, no pools, no dismemberment; corpses
still fall and stay (they are information) but are drawn as dark silhouettes.

### 5.6 Death animations

Picked by the presentation stream from the unit's allowed set and the killing blow:

| Style | When | Animation | Duration |
|-------|------|-----------|----------|
| fall back | default | rotate 90 degrees toward its own side, slide 6 wu | 0.5 s |
| crumple | 40% of light and medium kills | squash to 60% height, then tip over | 0.55 s |
| thrown | heavy or huge weapon, 35% | flies 40 to 80 wu in an arc, tumbling, bounces once | 0.7 s |
| face down | shot or cut while routing | falls forward | 0.45 s |
| impaled | lance charge, thorns | lifted 6 to 10 wu, held 0.2 s, slumps | 0.6 s |
| rider split | mounted | rider falls back, mount collapses or bolts | 0.9 s |
| topple | size 3+ | slow lean, then a heavy fall with dust | 0.9 to 1.4 s |
| burn out | fire kill | blackens, collapses into a smoking heap | 0.8 s |
| dissipate | Fire Sprite, Hornets, Wild Spirit | particles | 0.5 s |
| shatter | Monolith, frozen | pieces | 1.2 s |

### 5.7 Damage numbers

- One rolling number per target block per phase, tallying A2 `dmg` as hits land ("-4, -9,
  -17..."), in white with a dark outline, rising 40 wu over 0.9 s and fading in the last 0.3
  s. Font size grows with the amount (18 to 34 px).
- Kills as a small skull glyph and count ("x5") beside it.
- Commander blows: exact per-blow numbers from `damage`, larger, and the HP bar above the
  commander ticks down.
- Spell damage: the element's color with its glyph (flame, leaf, snowflake, sun disc,
  skull-drop), so element never relies on hue. A spell that did nothing shows a grey "0"
  and a fizzle.
- Heals: green with a plus sign. Buffs and debuffs: chips (section 10), not numbers.
- With numbers off, only the skull counts stay.

---

## 6. Spells

### 6.1 The five beats of a cast

1. **Charge**: the caster raises its staff; its color's symbol appears above it (the mana
   symbol, so color never relies on hue); particles gather in that color's motion; a charge
   sound rises. Longer for higher levels.
2. **Release**: a ring in the spell's color expands from the caster (the `docs/09` cast
   animation); a short full-scene flash at 15% in the color for level 3+ spells (setting
   dependent).
3. **Travel**: a projectile, a ground crack, a wave, or nothing, by template.
4. **Impact**: on the target sprites the sim chose (the `cast` event lists target groups;
   an area spell's sprites are drawn by the presentation stream within those groups, with
   every kill falling on a visible sprite where one remains, else a proxy kill).
5. **Linger**: burning ground, persistent auras, vines, bark, flowers. Lingering effects
   run in the background while the next cue plays.

A caption above the caster for 1.2 s: "Cinder Magus: Fireball". The ticker logs it.

**Order**: casts are sequential in the sim and earlier casts can kill later casters, so they
play in log order. To keep the phase short, cast k+1's charge starts when cast k releases;
its impact never lands before cast k's impact. **Short form**: from the second time the
same spell is cast in a battle, the charge is halved and the caption is skipped (priests
bless every round). A spells phase is capped at 6 s at 1x; casts beyond the cap play in
0.4 s each.

### 6.2 Color particle grammar (from `docs/09`)

| Color | Palette | Motion | Charge sound | Release sound |
|-------|---------|--------|--------------|---------------|
| R Ember | #FD6533, #7A1E12, #FFB347 | rises and flickers; sparks jitter upward, heat shimmer | crackle plus a roar rising (noise, low-pass 300 to 3000 Hz) | whoosh-boom |
| G Loam | #00674B, #244F22, #A6D96A | spreads outward along the ground; motes hug the soil, cracks run | rustle, creak, low earth rumble | crack and thud |
| W Radiance | #F3E6B8, #D9B85C, #FFFFFF | radiates straight lines from a center | shimmer of high sines with tremolo | chime and swell |
| U Tide | #3A7BD5, #1E3F7A, #9ED8FF | ripples in rings | water swirl (band-passed noise through a phaser) | splash |
| B Umbra | #3D2B4F, #1A1024, #9B4DCA | sinks downward, drips, smoke falls | sub drone plus a reversed whisper | hiss and sigh |
| Holy (Bless) | the W palette | straight rays from above | bell shimmer | bell |

Particle counts: 12 to 40 per burst as `docs/09` says for small casts; large spells use up
to 300 (detail setting, section 12).

### 6.3 The eleven M1 battle spells

Durations are the full form at 1x; the short form is in parentheses.

| Spell | Charge | Release and travel | Impact | Linger | Total | Sound | Shake |
|-------|--------|--------------------|--------|--------|-------|-------|-------|
| Ember Dart (R1, 12 fire, one troop, armor piercing) | 0.35 s: a flame bead grows at the staff tip | a flat streak 0.2 s with an 8-particle trail | pierces the sprite: a spark exits behind it (armor piercing), a fire puff; kill burns out | a scorch dot | 0.9 s (0.6) | crackle, hiss-whoosh, `hit.fire`, burning cry | 0.03 |
| Fireball (R2, 10 fire, area 5) | 0.7 s: an orb grows to 14 wu with orbiting embers, the caster leans back | lobbed arc 0.55 s, apex 120 wu, a 30-particle trail, spinning | explosion at the center of the 5 target sprites: local flash, a fire ring to 140 wu in 0.35 s, 40 embers rise; kills are thrown and burn; wounded knocked down and up | a scorch decal (120 wu), smoke column 2 s, embers rain 1.5 s | 1.9 s (1.3) | charge roar, whoosh, `explosion.fire`, scattered cries | 0.30 |
| Warcry (R2, +2 morale all friendly) | 0.3 s: the caster draws breath and swells | the caster roars; a red ring ripples across its own side over 0.6 s | each friendly sprite raises its weapon as the ripple passes (0.35 s), banners snap and flare; "+2 MOR" chips | banners glow faintly for the battle | 1.3 s | chorus war cry, a horn blat, two drum hits | - |
| Blood Fury (R3, one squad +2 att +3 str -2 def) | 0.4 s: red smoke tendrils rise from the caster | the tendrils flow along the ground to the squad, 0.4 s | the squad's sprites glow with red veins (a rim tint pulsing at 1.2 Hz) and jitter; "+2 ATT +3 STR -2 DEF" | the red pulse stays all battle | 1.4 s | heartbeat twice, roar chorus | - |
| Pyre Storm (R5, 14 fire, area 12; cinematic) | 1.3 s: the light dims 30%, a red vortex of 200 particles forms above the target row, rumble rising; camera eases to 1.12x | the staff flares, a large R symbol | 12 meteors fall one by one over 1.1 s (90 ms apart), each a diagonal streak (0.25 s) and a burst (60 wu ring, 15 particles); slow motion 0.6x over the first three; kills are thrown up and burn | burning ground patches 4 s that become scorch | 3.2 s (2.2) | rising roar, a whistle per meteor, small explosions (6 concurrent, the rest merged), rumble | 0.12 each, cap 0.70 |
| Thorn Spray (G1, 8 nature, area 3) | 0.35 s: green motes swirl at the caster's feet | a crack runs along the ground from the caster to the target row, 0.3 s, kicking up leaves | thorn spikes erupt under the 3 target sprites (0.1 s), hold 0.4 s, wither 0.3 s; kills impaled | splinters, leaves | 1.2 s (0.8) | rustle, skittering crack, `thorns.erupt`, flesh | 0.03 |
| Bark Skin (G2, +3 prot one squad) | 0.3 s: green motes | a spiral of leaves flies to the squad, 0.3 s | bark creeps up the sprites from feet to head (a mask wipe, 0.6 s); "+3 PROT" | bark overlay all battle; its deflections now sound like bark | 1.2 s | creak, crackle | - |
| Entangle (G3, enemy squad -3 def -1 att, 5 rounds) | 0.45 s: the earth rumbles, cracks open around the target | roots burst out around the block | vines coil up the sprites' legs (0.5 s); the sprites struggle; their lunges are half as long while entangled; "-3 DEF -1 ATT" chip with a round countdown | vines stay until `expire`, then wither brown and crumble (0.5 s) | 1.4 s | rumble, `roots.grow`, rustle, struggling grunts | - |
| Swarm (G4, summons 20 Hornet Swarms) | 0.6 s: buzzing swells, the ground beside the caster's front splits | a cloud of 200 hornets boils out of the crack (0.6 s) | the cloud coalesces into the block in its row (0.5 s); badge "20" | the swarm's buzz loop starts | 1.8 s | `swarm.erupt`, buzz | 0.10 |
| Regrowth (G5, heal 10 all friendly, removes one curse each) | 0.8 s: the G symbol, soft light rises from the soil under the caster | a green wave spreads along the ground across its side, 0.8 s | as it passes, grass and flowers sprout at every friendly sprite's feet, sprites flash green, a green "+n" per squad; curse visuals dissolve into petals; wounded tints clear | flowers stay as decals | 2.0 s | `heal.pad`, chimes, birdsong | - |
| Bless (holy, +1 morale one squad) | 0.3 s: the priest raises its staff, a sun-disc symbol | a column of gold light descends on the squad, 0.5 s | a halo flickers over the sprites; "+1 MOR" | a faint gold rim for the battle | 1.0 s (0.6) | `bless.chime` | - |

Many `buff` events from one cast (Warcry lands on every group) play as one cue.

### 6.4 Buff and debuff visuals by stat

So that chips are not the only signal:

| Stat | Buff | Debuff |
|------|------|--------|
| mor | banner glows, sprites stand taller (1.03 scale) | banner droops, sprites hunch |
| att | weapon edges glint red | weapons droop |
| str | red rim, sprites swell 1.04 | sprites look thin, grey rim |
| def | a pale shimmer on shields and bodies | a crack-like overlay |
| prot | an armor plating overlay (bark for Loam) | armor looks rusted, flaking |
| prec | a glint at archers' eyes, a faint reticle on their targets | blurred outline |

### 6.5 Generic templates for M2 colors and new spells

Any spell without its own storyboard composes from its primitives:

| Primitive | Template |
|-----------|----------|
| damage single | bolt: a streak to one sprite in the color's motion |
| damage squad | engulf: the whole block is wrapped in the color's particles |
| damage area(n) | burst: a projectile or ground travel to the row, a burst on n sprites |
| buff | aura on the targets, per the stat table |
| debuff | curse in the color, per the stat table |
| summon | erupt: Loam from the ground, Ember from a fire portal, Umbra rising from the corpses on the field, Radiance descending in light, Tide out of a water ring |
| heal | wave along the ground (Loam) or rays (Radiance) |
| fatigueDrain | siphon: wisps pulled from the target caster toward the spell's caster; the target slumps |
| moraleShock | terror: a dark ripple, targets cower and glance back |
| fieldEffect | section 6.6 |

### 6.6 Field effects (the sim supports them; M1 spells do not cast them yet)

| Effect | Onset (`field`) | While it lasts | End (`fieldEnd`) | Sound |
|--------|-----------------|----------------|------------------|-------|
| storm (no missiles, -2 att) | 1.5 s: clouds roll over the sky, the light drops 35%, wind rises | slanting rain (1,200 drops), puddles on the ground, lightning every 2 to 5 s with thunder 0.3 to 1.2 s later, archers shield their faces; an "-2 ATT, no missiles" field chip in the top bar | clouds part, light returns over 1 s | rain and wind loops, thunder |
| fog (-4 prec) | 1.5 s: fog banks roll in from the edges | three fog layers drift; far lanes and rear rows fade to 60% opacity | fog thins and drifts off | a low-pass on the effects bus (1.5 kHz) and an eerie drone |
| wall (no melee) | 1.2 s: a wall of the caster's color (stone, thorns, fire, ice, bone) rises in no-man's land, dust, trauma 0.25 | troops press against it, shoving | it crumbles, 1 s, trauma 0.15 | grinding rumble; crumble |

Field stat changes are not logged per group (by design); the HUD shows them as field chips.

---

## 7. Morale

### 7.1 Shaken

The viewer knows the morale rule (`BATTLE.morale` in content) and the losses, so it knows
when a squad must check this round: losses since the start over 20% of its starting count,
or this round's over 10%, or a shock spell, or its commander's death. Such a squad is
**shaken** at the start of the morale window (0.4 s): sprites glance back over their
shoulders, the block steps back 4 wu, shields come up, the pennant wobbles, nervous murmurs.
Fearless (morale 50) and berserk squads never waver.

- **Holds** (no `rout` follows): the block braces and steps forward again with a short shout
  (0.4 s). The HUD meter flashes "HELD".
- **Breaks** (`rout`): section 7.3.

### 7.2 Break-chance meter (honest morale)

The HUD shows, for every squad that can break, the chance it breaks if it has to check now:

```
P(break) = P(mor + X < 10 + Y + pressure),  X, Y ~ DRN (open-ended 2d6)
pressure = 2 if its side has lost over half its starting troops, + 4 in the round its
           commander died, + shock
```

`mor` is the A6 roster morale plus logged morale buffs (without A6, the content morale plus
buffs, labeled approximate). The DRN difference distribution is precomputed once (exact
convolution, truncated where it is below 1e-6), so the meter is a table lookup. It is a
thin bar under the squad's count: green below 10%, amber to 35%, red above. It pulses when
the squad is shaken. Fearless and berserk squads show a "never breaks" glyph instead.

### 7.3 The rout

1. The pennant drops (0.3 s).
2. Sprites turn (a horizontal flip, staggered over 0.3 s).
3. 30% of them drop weapons and shields (they stay on the ground).
4. They run toward their own edge at 120 wu/s, arms up, some stumbling.
5. Panic screams (2 or 3 voices), and once per side per round a falling two-note retreat horn
   in that side's position.
6. The HUD row turns grey with a "BROKEN" tag; the ticker: "The Wardens break and flee".

Routing troops can still be struck in their exit round (the sim says so). Kills on them use
the face-down death: cut down from behind. At `leave` the runners still on screen
accelerate and fade over their last 40 wu past the edge. A commander that routs with its
troops runs with its banner, which leaves the field with it.

### 7.4 Pursuit and the side breaking

- Fast enemy blocks (speed 3, flyers) adjacent to a routing block chase 30 wu and return
  (cosmetic, 0.8 s).
- **The line breaks**: when a side's last active group routs, the ticker says so in bold, the
  whole side flees, a long retreat horn plays for it, and the winning side roars. This is a
  beat.
- **Round-50 withdrawal**: the attacker's `leave` events at round 50 without a rout: the
  attackers turn and march off in order, banners up, to a calm horn. A card: "The attackers
  withdraw".

---

## 8. Commander and pretender deaths

### 8.1 A commander falls

The killing blow is the `damage` with `kills: 1` on the commander (or a spell impact); the
`death` event follows.

| Time (story, 1x) | Visual | Sound |
|------------------|--------|-------|
| -0.25 s | slow motion ramps in to 0.3x; camera pushes in to 1.25x on the commander; the rest of the field desaturates 60% | a heartbeat starts; new sounds play at 0.75 rate through a 900 Hz low-pass |
| 0.0 s | the blow lands: global hit-stop 180 ms, the big impact cue, trauma 0.2 | the impact, the commander's death cry (a louder, longer variant) |
| 0.0 to 0.8 s | the body falls (in slow motion), the weapon spins away | body fall |
| 0.3 to 1.3 s | the banner pole behind it topples, cloth fluttering, and hits the ground | a thud and cloth flap |
| 1.0 s | slow motion ramps out (0.3 s); camera eases back | a bell toll |
| 1.0 to 3.0 s | a **name card** slides in on the commander's side (0.3 s in, 1.4 s hold, 0.3 s out) while play resumes under it | card whoosh |
| after | its squads all turn toward the fallen banner (0.3 s), then their morale checks (the routs follow in the log) | murmurs |

The card: portrait (the sprite at 2x on a backdrop in the banner color), the name in a large
serif, the unit type, "fell in round 7", the nation banner strip with its mana symbol, and
the killer: "slain by the Wardens" (A3) or "burned by Fireball" (the cast). If several
commanders die in the same phase, the first gets the full sequence, the rest stack as
smaller cards (0.8 s each) without more slow motion. Total added time: 2.4 s for the first,
0.8 s for each more.

### 8.2 A god falls

As above, but slow motion 0.2x for 2.0 s, the whole field desaturated, all other sound
ducked 12 dB, and the body dissolves into its dominant color instead of falling: Ember
erupts into a pillar of flame, Loam crumbles into earth and leaves, Radiance burns away to
light, Tide collapses into water, Umbra sinks into shadow. A deep toll and a dissonant choir.
The card: "THE GOD FALLS", the god's name, its chassis. Added time 3.6 s. Trauma 0.6.

### 8.3 Wounds

Every blow on a commander is logged, so the commander's HP bar (over its sprite and in the
panel) is exact. Below 50% HP the sprite limps (a bob with a hitch); below 25% it kneels
between actions.

---

## 9. Pacing

### 9.1 Phase windows at 1x

| Segment | Window | Notes |
|---------|--------|-------|
| Intro | 3.0 s | 1.2 s in Beats mode; a click skips it |
| Round card | 0.5 s | overlaps the previous round's tail by 0.2 s |
| Spells | per cast (section 6.3), chained; cap 6 s | |
| Missiles | 1.7 s when any volley | draw 0.35, ripple 0.25, flight 0.5 to 0.85, landing 0.3 |
| Melee | 2.4 s; first contact 4.0 s; +0.25 s per 10 visible deaths over 20; cap 4.8 s | the strike schedule fills the window |
| Commander death | +2.4 s the first in a phase, +0.8 s each more; pretender +3.6 s | inserted right after the phase that killed it, as the log orders it |
| Morale | 0.3 s with nothing; 1.0 s for the first rout, +0.3 s each more, cap 2.2 s | runners keep running in the background |
| End of round | 0.4 s | regeneration, expiries, field ends |
| Outro | 2.5 s, then the result card holds until closed | |

A busy round is 5 to 8 s; a quiet one 2 to 3 s. Estimated totals at 1x from the measured
battles: starting armies about 40 s; 300 vs 300 about 80 s. At 2x: 20 s and 40 s. In Beats
mode at 1x: about 25 s and 45 s.

### 9.2 A round, second by second

Round 2 of the 300-vs-300 battle, the first contact (Cinder Horde, the player, attacks on
the left; Thornwood defends on the right; Hills):

| t | What happens | Heard |
|---|--------------|-------|
| 0.0 | "ROUND 2" slides down; the Wardens and Briar Guard, slow, have crept 25 wu since round 1 | two drum hits |
| 0.3 | the Cinder Magus charges Fireball; an orb grows | crackle, rising roar |
| 0.9 | Fireball released; the Elder Druid begins Entangle | whoosh |
| 1.5 | Fireball bursts among the Wardens: 5 sprites hit, 2 thrown and burning | explosion, two cries, embers |
| 1.6 | roots burst around the Berserkers; vines coil | rumble, creak |
| 2.2 | the Pyre Priest blesses the Cinder Warriors (short form) | bell |
| 2.8 | missiles: Flame Archers and Longbow Hunters draw; 3.1 loose; arcs cross; javelins fly flat | bowstrings, a hiss of arrows |
| 3.9 | arrows land: sticks in bodies, sparks off the Briar Guard's bark plate, a ring of spent arrows in the ground | thwacks, tinks, cries |
| 4.5 | melee: the Ash Riders lower lances and gallop; the Wolf Riders howl and rush; both front lines run for the clash line | hooves swell, war cries |
| 5.2 | **first contact**: global hit-stop 120 ms, slow motion 0.6x for 0.5 s, camera 1.08x, the cavalry impact throws the Wardens' front file back; dust along the line | a crash of metal and bodies, the din bed jumps to full |
| 5.6 to 8.5 | about 90 strikes over 30 duels and gang-ups; about 60 sprites die (proxy kills drop about 80 more bodies); the clash line leans toward Thornwood | swings, clangs, flesh, cries (6 at a time), the din |
| 8.5 | morale: five squads are shaken; the Ember Skirmishers and two PD squads break | murmurs, retreat horns from both sides, panic screams |
| 9.6 | end of round: the Treant's bark knits | creak |
| 10.0 | round 3 | |

This round is the longest of the battle (about 10 s at 1x, 5 s at 2x); later rounds run 3
to 6 s.

### 9.3 Sampling strikes and projectiles

The choreographer works per phase, from the log and the visible-sprite state:

**Melee**
1. For each target block, the visible deaths of the phase (section 3.4) are split among the
   pairs that killed into it, proportional to `kills` (largest remainder). Every visible
   death is a **mandatory** killing strike from a sprite of that pair's attacking block.
2. The budget B (90 at 1x on High detail; table below) minus the mandatory strikes is
   split among pairs proportional to `attacks`, at least one per pair, so every pair is seen
   to fight.
3. Within a pair, the sampled strikes take outcome classes in proportion to the pair's
   misses, deflections, wounds, and proxy kills (largest remainder). Proxy kills are
   mandatory too while bodies must fall (each one drops a corpse), but they can be grouped:
   one strike may drop two ghost bodies when a pair has more proxy kills than its budget.
4. Strikes are scheduled over the window with a crescendo (density rising through the first
   third, steady, then easing), each attacking sprite at most one strike per 0.45 s, deaths
   no faster than 12 per 100 ms, and a dying sprite's own strikes before its death.
5. Up to 6 strikes per phase are **featured** (global hit-stop, louder, larger particles):
   kills by or on size-3+ units and commanders, a charge's first impact, the last kill of a
   squad, and the phase's highest-weight kill.
6. Every engaged sprite that has no strike scheduled plays **ambient fighting** (feints,
   shoves, swings that hit nothing) so the line looks busy at any budget.

**Missiles**: each visible shooter looses one projectile per ranged weapon that fired;
projectiles are split among the target pairs by `attacks`; outcomes in proportion to the
pair's tallies; every visible death gets a hitting projectile (an extra one 0.15 s later from
the same archer if needed). A projectile can stand for several shots.

**Budget by speed and detail** (strikes per melee phase / projectiles per missile phase):

| | 0.5x and 1x | 2x | 4x |
|---|---|---|---|
| High | 90 / 160 | 55 / 100 | 30 / 60 |
| Medium | 60 / 110 | 40 / 70 | 25 / 45 |
| Low | 35 / 70 | 25 / 50 | 15 / 30 |

Deaths are never dropped. At 4x, death animations shorten to 0.25 s and only featured
strikes get swing sounds.

### 9.4 Speeds, Beats mode, skipping

- **Speeds** 0.5x, 1x, 2x, 4x scale real time. One-shot sounds are never pitch-shifted by
  speed; density is thinned instead. At 2x slow motion is 0.6 strength; at 4x it becomes a
  0.5 s freeze frame (pretender deaths keep theirs).
- **Beats mode** (B): segments without a beat play at 4x (or the chosen speed, if higher);
  beats play at the chosen speed. Beats, with weights for the scrubber icon size:

| Beat | Weight |
|------|--------|
| battle end, pretender death | 20 |
| side breaks, round-50 withdrawal | 12 |
| first contact, commander death | 10 |
| cavalry charge, pretender's first action | 8 |
| summon, field effect | 7 |
| spell of level 3+, or any spell that kills 3+ | 6 |
| a squad routs with 10%+ of its side's starting troops | 6 |
| a squad wiped out | 4 |
| any other rout | 3 |

- **Auto-tempo** (on by default, also in normal mode): a round's intensity is
  `visibleDeaths + 0.05 x strikes + 8 x beats`. Below 3, the round plays at 2x tempo (window
  floors 1.0 s). A round with nothing but housekeeping plays in 0.8 s. Three or more such
  rounds in a row collapse into one interlude card, "Rounds 14 to 30: the lines hold", 1.6 s,
  over ambient idle. After three consecutive low-intensity rounds, the following ones play at
  4x tempo with "The lines grind on" in the ticker.
- **Step**: left and right arrows jump to the previous or next round start; Shift with an
  arrow jumps between beats; N skips to the next beat.
- **Skip to end** (End or S): jumps to the battle's last frame (all bodies in place) and the
  result card.
- **Scrubber**: a timeline with round ticks and beat icons (skull for a commander's death,
  a broken flag for a rout, the spell's symbol, crossed swords for first contact). Dragging
  seeks. Clicking a ticker line seeks to it.

### 9.5 The worst case

A 300-vs-300 stalemate to round 50 (heavily armored sides that rarely kill): every round
has strikes but few deaths, so auto-tempo plays them at 2x and then 4x tempo. About 10
rounds at about 5 s plus 40 rounds at about 1.3 s: about 100 s at 1x, 25 s at 4x, and the
Beats mode shows it in about 20 s. Timeline cues stay under 15,000 (built in well under 50
ms, measured in the test of section 15).

---

## 10. HUD

### 10.1 Layout

```
+--------------------------------------------------------------------------------------+
| Battle of Kharsk Ford - Hills - Y2 M5 D12   | ROUND 4  [Spells][Missiles][Melee][Morale] | [storm chip] [X] |
| [========= Cinder Horde 214 ======|======= Thornwood 187 ==========]  tug-of-war bar   |
+-----------+--------------------------------------------------------------+-----------+
| LEFT DOCK |                                                              | RIGHT DOCK|
| (player)  |                      battle canvas                           | (enemy)   |
|           |                                                              |           |
|           |  ticker (4 lines, bottom-left over the canvas)               |           |
+-----------+--------------------------------------------------------------+-----------+
| |<  <  [ > ]  >  >|   0.5x 1x 2x 4x   [Beats]   ===o=====skull==flag======   0:32 / 1:14   vol  gear |
+--------------------------------------------------------------------------------------+
```

### 10.2 Side panels (the docks)

- **Header**: nation name, banner, mana symbol, ATTACKER or DEFENDER, a side glyph (a pointed
  shield for the attacker, a round shield for the defender), the side's active troops in a
  large number and losses below it ("-87").
- **Commanders**, each with portrait (40 px), name, unit type, exact HP bar ("9 / 14"),
  fatigue bar for casters (from A4, recovering 5 per round per content; an "EXHAUSTED" chip
  at 100), and status chips.
- **Squads**, indented under their commander: unit icon, name, live count "37 / 60" with a
  red "-3" flash when it drops, the break-chance meter, buff and debuff chips (stat glyph,
  signed number, arrow up or down, rounds left when timed), and state tags: ROUTING (row
  greyed, broken flag), FLED (struck through), WIPED OUT (skull), SUMMONED (sparkle).
  Provincial defense squads sit under "Provincial defense".
- **Counts change when the viewer shows the death**, not when the event is read: each kill is
  assigned a time in the timeline (its death cue or its proxy body). At the end of every
  phase the panel equals `foldReplay` at that point (a test checks this).
- **Hover sync**: hovering a squad in the panel outlines its block and its banner on the
  field; hovering a block highlights its panel row. A tooltip gives the unit's stats, its
  weapons, and its current buffs.
- Collapsed (72 px), each dock shows only the side total and one small bar per commander.

### 10.3 Ticker

Four lines bottom-left over the canvas, newest on top, each fading after 6 s; side glyph and
banner color at the start of each line, the mana symbol for spells, bold for beats. Lines
are aggregated per phase and squad pair:

- "Flame Archers loose on the Wardens: 7 hits, 4 turned by armor, 1 slain"
- "Cinder Magus casts Fireball: 3 Wardens slain"
- "Ash Riders charge the Wardens!"
- "The Wardens break and flee"
- "Ash Chieftain has fallen, slain by the Briar Guard"
- "[retreat horn: Thornwood]" (sound captions, when on)

A **Log** button opens the full log as a scrolling list (filter by side and kind). It is the
text alternative to the whole visual show and is screen-reader friendly; beats are also
announced through an `aria-live="polite"` region.

### 10.4 Result card

After the outro: "VICTORY" or "DEFEAT" (or "The attackers withdraw", "No one holds the
field, the defenders keep it"), the battle name and round count, two columns with each
side's troops at the start, killed, fled, survived, and commanders lost; spells cast; the
**deadliest squad** (most kills, from the tallies) with its icon. Buttons: Watch again, Close,
Go to province.

---

## 11. Sound

### 11.1 Engine

- Web Audio, in `src/render/audio/` (not in the sim). One `AudioContext` created on the user
  gesture that opens the replay (autoplay policy), kept for the session.
- **Buses**: effects (impacts, swings, missiles, spells), voices (grunts, cries, war cries,
  crowd), ambience (terrain loops, din bed, weather), stingers (drums, horns, bells). Each
  has a gain; all feed a master gain, a compressor (threshold -14 dB, ratio 4, attack 3 ms,
  release 120 ms) and a limiter (threshold -1 dB, ratio 20) before the output.
- **Reverb**: one `ConvolverNode` send whose impulse response is generated per terrain
  (stereo decaying noise with a low-pass): plains 0.6 s, farmland 0.7 s, forest 1.2 s dark
  (low-pass 4 kHz), hills 1.4 s, mountains 2.6 s bright with an early echo at 180 ms, swamp 1.0
  s dark, wasteland 0.9 s with a slapback at 180 ms, storm battles 1.8 s with a stone slap at
  120 ms.
- **Variant bank**: on opening a replay (behind the intro, with a progress ring if not
  done), every recipe is rendered in 4 to 10 variants by `OfflineAudioContext` at 32 kHz mono
  (stereo for loops) into `AudioBuffer`s, keyed by recipe and variant. About 60 recipes x 6
  variants x 0.6 s is about 7 MB of floats, rendered in a few hundred ms. Rendering can start
  at game load in idle time. Playback picks a variant by the presentation stream and adds
  +-6% playback rate and +-2 dB gain.
- **Spatial**: stereo pan from the sprite's x (-0.8 to 0.8, the player's side left), gain
  -3 dB for the middle row and -6 dB for the rear, a slight low-pass for the far lanes.
- **Voice limits** (concurrent): effects 24, voices 6 (death cries beyond 6 feed the crowd
  layer's intensity instead), spells 8, stingers 3, loops 6. Priority: featured, then
  commanders, then size, then recency. Each strike plays its impact; swings play for
  featured strikes and 35% of the rest.
- **Ducking**: explosions, commander deaths, and horns duck the ambience and voices 6 dB for
  0.8 s; a pretender's death ducks everything else 12 dB for 2 s.
- **Slow motion**: new sounds at 0.75 playback rate through a 900 Hz low-pass, plus a
  heartbeat at 70 bpm.
- **Pause**: everything stops but the ambience loop, which drops 10 dB. **Seek**: all voices
  stop with a 30 ms fade; ambience continues.
- **Din bed**: a pre-rendered 6 s seamless loop of a crowd (16 formant voices with random
  swells) and clatter (random metallic grains). Its gain follows combat intensity (strikes
  per second over the last 0.5 s, smoothed), from silence before contact to -8 dB at the
  first contact peak.
- No music in M1. The drums, horns, and bells are effects.

### 11.2 Recipe catalog

Notation: noise colors white, pink, brown; BP(f, Q), LP(f), HP(f) filters; envelopes as
attack / decay; times in seconds. Each recipe is a pure function from parameters (and a seed)
to a description of the node graph and envelopes; `bank.ts` renders it.

| Id | Recipe | Length | Variants | Bus |
|----|--------|--------|----------|-----|
| `swing.light` | white noise, BP sweeping 600 to 2400 to 900 Hz, Q 1.2, bell envelope 0.06 / 0.12 | 0.18 | 6 | effects |
| `swing.heavy` | pink noise, BP 250 to 1100 to 350 Hz, Q 0.9, plus a 70 Hz sine swell | 0.32 | 6 | effects |
| `swing.huge` | brown noise, LP sweep 200 to 600 Hz, sub sine 40 Hz | 0.50 | 4 | effects |
| `thrust` | white noise BP 1200 to 2600 Hz, Q 2 | 0.12 | 6 | effects |
| `clang.parry` | inharmonic partials of f0 700 to 1300 Hz at ratios 1, 2.32, 4.25, 6.63, attack 1 ms, decays 0.6 to 0.25 (higher faster), plus a 4 ms click HP 4 kHz | 0.6 | 8 | effects |
| `deflect.plate` | partials of f0 350 to 600 Hz at 1, 1.71, 2.8, 4.1, decay 0.18, plus BP noise 2.2 kHz 30 ms | 0.3 | 6 | effects |
| `deflect.mail` | a cluster of partials 2 to 5 kHz (0.08) plus a rattle of 8 noise grains of 3 ms over 60 ms | 0.15 | 6 | effects |
| `deflect.soft` | sine 140 to 90 Hz in 50 ms plus LP noise 800 Hz 40 ms | 0.1 | 6 | effects |
| `deflect.bark` | BP noise 900 Hz Q 6 (30 ms) plus a 260 Hz wood resonance (comb, 4 ms, feedback 0.5) plus a short creak | 0.2 | 6 | effects |
| `block.shield` | BP noise 700 Hz Q 6 30 ms, sine 220 Hz 80 ms, hollow comb resonance | 0.2 | 6 | effects |
| `hit.flesh` | sine thump 110 to 60 Hz 60 ms, LP brown noise 1 kHz 70 ms, a squelch: BP noise 1400 to 500 Hz over 90 ms, Q 3 | 0.15 | 8 | effects |
| `hit.flesh.heavy` | as above x1.5 longer, plus 10 crunch clicks HP 2 kHz over 70 ms | 0.22 | 8 | effects |
| `hit.bone` | 14 noise impulses of 2 to 4 ms, BP 1.8 to 3.5 kHz, random spacing over 90 ms, decaying, plus a 80 Hz thump | 0.15 | 6 | effects |
| `hit.wood` | "tok": BP noise 300 Hz Q 8, a creak tail | 0.3 | 6 | effects |
| `hit.stone` | BP noise 1.2 kHz Q 8, sine 180 Hz 0.2, a grit crackle | 0.3 | 6 | effects |
| `hit.fire` | HP noise 3 kHz with 60 Hz tremolo (sizzle), crackle grains | 0.3 | 6 | effects |
| `pop.ember` | LP noise sweep 2000 to 200 Hz plus crackle | 0.25 | 4 | effects |
| `bow.thrum` | Karplus-Strong string at 98 to 147 Hz, damping 0.996, plus a click; a volley layers 3 to 8 copies over 0.25 s | 0.3 | 6 | effects |
| `arrow.whistle` | white noise BP 3.2 kHz Q 10 with the center gliding down 10% (doppler); a volley plays one layered hiss whose gain follows the square root of the arrows | 0.8 | 4 | effects |
| `arrow.body` | LP noise 1.6 kHz 25 ms plus sine 160 Hz 40 ms | 0.06 | 6 | effects |
| `arrow.armor` | partial at 3.5 kHz 40 ms and 6 kHz 20 ms | 0.05 | 6 | effects |
| `arrow.ground` | sine 90 Hz 50 ms plus a crumble of brown-noise grains LP 500 Hz; swamp: a splash (BP noise 1 kHz and 4 bubble sines) | 0.1 | 6 | effects |
| `breath.fire` | brown noise LP 1.2 kHz with a 7 Hz flutter, a sizzle layer, a low rumble | 1.0 | 3 | effects |
| `explosion.fire` | noise burst through LP sweeping 4000 to 180 Hz over 0.9 s (attack 2 ms, decay 1.2), sub sine 50 to 30 Hz 0.6 s, a 2 s crackle tail, heavy reverb send | 2.0 | 4 | effects |
| `footstep.march` | thump 90 Hz 30 ms plus gear jingle grains HP 5 kHz; the ensemble loop's density follows the moving sprites | 0.1 | 6 | effects |
| `footstep.giant` | sine 45 to 28 Hz 0.35 s, brown rumble 0.6 s, debris grains | 0.6 | 4 | effects |
| `hooves` | per hoof: thump 75 Hz plus a 2 kHz click; gallop pattern of 3 in 120 ms every 0.4 s; up to 6 layered voices for a charge, rising | loop | 3 | effects |
| `wings` | LP noise whoomp 200 Hz 0.25 s at 1.2 Hz | loop | 2 | effects |
| `buzz` | 8 detuned sawtooths 190 to 260 Hz, 25 Hz amplitude modulation, LP 1.5 kHz | loop | 2 | effects |
| `body.fall` | LP noise 300 Hz 0.12 s plus a gear rattle; a clank for prot 6+; size 3+: sine 50 Hz 0.3 s plus debris | 0.3 | 6 | effects |
| `weapon.drop` | metal clatter grains | 0.3 | 4 | effects |
| `blood.splash` | wet: BP noise 800 Hz fast envelope plus bubbling sines, -16 dB, featured kills only, gore Standard and up | 0.15 | 4 | effects |
| `dismember` | wet tear: noise through random BP sweeps plus a crunch (Brutal only) | 0.25 | 3 | effects |
| `creak` | stick-slip friction: sawtooth 40 to 90 Hz with random pitch steps through BP 400 to 900 Hz Q 5 | 0.4 to 0.9 | 6 | effects |
| `thorns.erupt` | 5 to 8 crack impulses within 80 ms plus a rustle tail | 0.5 | 4 | effects |
| `roots.grow` | creak plus a soil crumble (brown noise grains) | 0.8 | 3 | effects |
| `swarm.erupt` | the buzz swelling in three voices plus an earth crack | 1.2 | 2 | effects |
| `voice.grunt` | formant synthesis: band-limited glottal pulses at f0 100 to 170 Hz, vowel "uh" (F1 500, F2 1500, F3 2500 Hz, Q 8), 15% breath noise | 0.15 to 0.2 | 10 | voices |
| `voice.death` | f0 starts 140 to 260 Hz, rises 30% over 120 ms, falls 50% over 0.4 to 0.8 s; vibrato 6 Hz +-3%, jitter 2%; vowel glides "a" (F1 750, F2 1200) to "o" (F1 500, F2 900); tanh drive 3; breath noise rising to 25% at the end | 0.5 to 1.0 | 12 | voices |
| `voice.death.commander` | as above, lower and longer, more reverb | 1.2 | 4 | voices |
| `voice.panic` | f0 220 to 400 Hz, repeated short "aah" bursts, more noise | 0.8 | 6 | voices |
| `voice.warcry` | chorus of 6 formant voices at f0 90 to 150 Hz, "aa", 0.4 s swell, detuned | 1.0 | 4 | voices |
| `voice.roar` | berserker: the war cry plus distortion and a 35 Hz growl modulation | 0.8 | 4 | voices |
| `voice.wolf` | growl: sawtooth 70 to 110 Hz, 30 Hz modulation, vowel "oo"; yelp: f0 600 to 300 Hz short; howl: sine 400 to 600 to 450 Hz with vibrato | 0.3 to 1.5 | 6 | voices |
| `voice.monster` | f0 45 to 80 Hz, heavy distortion, formants lowered x0.6, noise; the Salamander adds a hiss | 1.2 | 6 | voices |
| `crowd.din` | 16 formant voices at random f0 and vowels with random swells, plus clatter grains at -18 dB; seamless | 6.0 loop | 2 | ambience |
| `drum.round` | taiko: sine 90 to 58 Hz over 80 ms, a noise slap BP 300 Hz 40 ms; two hits 0.18 s apart, the second softer | 0.6 | 3 | stingers |
| `horn.call` | sawtooth stack (f0, 2f0, 3f0 at 1, 0.5, 0.3), LP 1.4 kHz, vibrato 5 Hz, attack 0.12; attacker A2 to D3, defender D2 to A2 | 1.4 | 2 | stingers |
| `horn.retreat` | two falling notes A2 to E2 with a 0.5 Hz wobble of 15 cents, LP 900 Hz | 1.6 | 2 | stingers |
| `horn.victory` | rising D3, F#3, A3, LP 2.5 kHz | 2.4 | 1 | stingers |
| `stinger.defeat` | a long low horn on E2 over wind | 3.0 | 1 | stingers |
| `heartbeat` | lub-dub: sine 55 Hz 60 ms, then 48 Hz 70 ms after 180 ms | 0.5 | 1 | stingers |
| `bell.toll` | inharmonic bell on 98 Hz (partials 1, 2.0, 2.4, 3.0, 4.2, 5.4), decay 3 s; the god's toll on 55 Hz with a reversed swell before it | 3.5 | 2 | stingers |
| `spell.charge.<color>` | per section 6.2, a riser whose length matches the charge | 0.3 to 1.3 | 3 per color | effects |
| `spell.release.<color>` | per section 6.2 | 0.4 | 3 per color | effects |
| `heal.pad` | sines on a G major chord (G3, B3, D4, G4), attack 0.25, plus chime partials at random 2 to 4 kHz with 0.4 s decays | 1.6 | 2 | effects |
| `bless.chime` | bell partials on 880 Hz, 1.2 s, plus three high formant voices "ah" | 1.2 | 3 | effects |
| `debuff.dark` | a descending noise "whum" | 0.6 | 3 | effects |
| `fatigue.drain` | a reversed whoosh and a tinkle | 0.6 | 2 | effects |
| `field.storm` | rain (HP noise 1 kHz, LP 6 kHz, droplet clicks), wind; thunder: brown noise in 3 bursts (attack 0.02, decay 2.5) with a crack at the start for close strikes | loops plus 3 s | 4 | ambience |
| `field.fog` | a 1.5 kHz low-pass on the effects bus (1 s ramp) and a drone of sines at 110 and 165 Hz beating | loop | 1 | ambience |
| `field.wall` | grinding brown noise with 18 Hz modulation and a 35 Hz rumble; crumble: debris and a thud | 1.2 | 2 | effects |
| `amb.<terrain>` | plains: wind (pink noise BP 300 to 800 Hz, slowly modulated), grass rustle, distant birds (FM chirps) that fall silent at first blood; forest: rustle, creaks, birds; hills: gusts; mountains: howling wind (resonant BP sweeps); swamp: frogs (FM croaks), insects, lapping water; farmland: wind over crops, crow caws (formant); wasteland: dry gritty wind, distant thunder; storm battles: flapping flags, a distant bell | 10 loop | 1 | ambience |

### 11.3 Sound per cue (summary)

Every visual cue in section 13 names its sound id. Two rules hold across all of them: a
strike plays its impact sound always and its swing sound only when featured (or 35% of the
time otherwise); and a death plays its cry only within the voice limit, otherwise it raises
the crowd layer.

---

## 12. Settings and accessibility

Settings live in the UI settings store (persisted with the other UI preferences), never in
`GameState`.

| Setting | Values (default first) | Effect |
|---------|------------------------|--------|
| Gore | Standard, Off, Brutal | Off: no blood (grey dust instead), no pools, dark silhouette corpses, no dismemberment, death cries replaced by grunts unless "Death cries" is on. Brutal: more blood, chunks, dismemberment, gore on survivors |
| Screen shake | Full, Low, Off | trauma x1, x0.5, 0 |
| Hit-stop and slow motion | On, Off | Off removes global hit-stops and slow motion (deaths get a 0.5 s freeze-frame card instead) |
| Flashes | Full, Soft, Off | full-scene spell and lightning flashes at 15%, 7%, none; never more than 3 flashes a second over a quarter of the screen (WCAG 2.3.1), lightning at most every 2 s |
| Reduced motion | System, On, Off | On: no shake, no camera moves, no hit-stop or slow motion, no full-scene flashes, particles x0.3, lunges 3 wu, deaths fade and lie down (no thrown bodies), routs slide off the edge as `docs/07` describes. Projectiles still fly without trails: they are information |
| Detail | High, Medium, Low (Auto drops a level when frames take over 18 ms for 1 s) | strike and projectile budgets (9.3), particle caps 4,000 / 2,000 / 800 |
| Damage numbers | On, Off | skull counts stay |
| Combat ticker | On, Off | |
| Sound captions | Off, On | "[retreat horn: Thornwood]", "[thunder]", "[screams]" in the ticker |
| Death cries | On, Off | |
| Follow action | On, Off | camera push-ins and drift |
| Volume | Master 80, Effects 80, Voices 70, Ambience 50; Mute (M) | |
| Default speed, Beats mode | remembered from last use | |

**Color vision.** Sides are told apart by banner (already distinct under the simulated
deficiencies), by side glyph, and by position (player always left). Elements carry glyphs.
Buffs and debuffs carry signs and arrows. Hit flashes are white. An optional outline (1.5
px in the side's banner color with a dark keyline) helps on busy ground.

**Keyboard.** Space pause, left/right step round, Shift+left/right step beat, N next beat,
1 to 4 speed (the modal captures these keys), B Beats mode, S or End skip to end, Home
restart, M mute, L log, Tab collapse docks, Esc close.

---

## 13. The cue table

Durations are at 1x, in story time (speed, slow motion, and hit-stop are applied by the time
map). "Shake" is trauma added; "stop" is hit-stop.

### 13.1 One cue per event kind

| Event | Cue | Visual | Duration | Sound | Shake / stop |
|-------|-----|--------|----------|-------|--------------|
| (record opened) | intro | title card "Battle of X", terrain and date; both armies march in from the edges to their posts; banners raised; pretender spotlight | 3.0 s | ambience fades in; attacker `horn.call` at 0.6 s, defender's answer at 1.6 s; `drum.round` | - |
| `roundStart` | round | "ROUND n" plaque slides down; phase pips reset; closing blocks step forward (4.2) | 0.5 s | `drum.round`; `footstep.march` ensemble while blocks move | - |
| `phase` (A1) | phase pip | the matching pip lights in the top bar | 0 | - | - |
| `cast` | spell | storyboard of section 6.3, or a template of 6.5; caption; caster's fatigue bar jumps (A4) | 0.6 to 3.2 s | `spell.charge.<c>`, `spell.release.<c>` | per spell |
| `damage` after a `cast` | spell impact | on the chosen sprites, by element (5.5); one number per target block; kills die by element | inside the cast | element hit sound; cries | per spell |
| `damage` with `by` on a commander, missiles or melee | commander struck | a featured strike from a sprite of `by` on the commander; exact number; HP bar ticks | 0.4 s | swing, impact by armor class, grunt | stop 70 ms local; kill: 8.1 |
| `damage`, fire, `by` = a fire-shielded unit, in melee | fire shield | flames lick from the shielded body to the strikers of the target group; strikers flinch with smoke; kills burn out | 0.5 s | fire whoosh, sizzle, cries | - |
| `damage` with `kills` on a commander | killing blow | section 8.1 (followed by `death`) | see `death` | | |
| `heal` in the spells phase | spell heal | Regrowth wave or the template; green numbers | inside the cast | `heal.pad` | - |
| `heal` in missiles or melee | life drain | dark red wisps flow from struck foes into the strikers | 0.5 s | hiss and sigh | - |
| `heal` at the end of a round | regeneration | green motes rise; wounded tint fades; the Treant's bark knits | 0.6 s | soft `creak` or sparkle, -20 dB | - |
| `volley` | missiles | 4.7: draw, ripple, arcs, landing and sticking by outcome (13.2) | the 1.7 s window | `bow.thrum` layers, `arrow.whistle`, impacts by outcome | kills: stop 40 ms local; 8+ kills in one volley: 0.10 |
| `melee` | melee | 4.2 to 4.6 and 9.3 | the 2.4 to 4.8 s window | swings, impacts, grunts, cries, `crowd.din` | per strike (13.2) |
| `rout` | break | 7.3 | 1.0 s, +0.3 s each more | `horn.retreat` once per side per round, `voice.panic` x2 to 3, `weapon.drop` | - |
| `leave` | exit | runners accelerate off the edge and fade; a commander's banner leaves with it | 0.6 s, background | fading footsteps | - |
| `advance` | commander advances | the commander strides to the front band with its banner, 0.8 s | 0.8 s | `voice.warcry` (single), footsteps | - |
| `death` | commander death | 8.1; for a pretender, 8.2 | 2.4 s (pretender 3.6 s); +0.8 s each more in the phase | `heartbeat`, `voice.death.commander`, `body.fall`, `bell.toll` | 0.20 (0.60); stop 180 ms global |
| `summon` | summon | erupts per color (Swarm: 6.3); the block forms in its row with its badge | 1.2 to 1.8 s | per spell | 0.10 |
| `buff` (not debuff) | aura | per-stat visual (6.4) and a chip; buffs of one cast play as one cue | 0.6 s | buff sound in the color | - |
| `buff` with `debuff` | curse | per-stat visual (Entangle: vines) and a red chip with rounds left | 0.6 s | `debuff.dark` | - |
| `expire` | aura ends | that source's visuals fade or wither; chip removed | 0.5 s | a soft reversed chime | - |
| `field` | field onset | 6.6 | 1.2 to 1.5 s | per effect | wall 0.25 |
| `fieldEnd` | field ends | 6.6 | 1.0 s | per effect | wall 0.15 |
| `fatigue` | drained | grey-blue wisps drawn out of the caster; it slumps; fatigue bar jumps | 0.6 s | `fatigue.drain` | - |
| `battleEnd` | outro | winners raise weapons and cheer (staggered hops); losers flee; camera eases wide; then the result card | 2.5 s + card | `horn.victory` and cheering, or `stinger.defeat` and wind | - |

### 13.2 Strike-level and derived cues

| Cue | Trigger | Visual | Duration | Sound | Shake / stop |
|-----|---------|--------|----------|-------|--------------|
| closing step | a front melee block before its closing round, at `roundStart` | steps 25 / 35 / 50 wu by speed, dust | 0.5 s | `footstep.march`; `hooves` trot for mounted | - |
| first contact | the battle's first melee phase | both lines surge to the clash line; front files crash, a knockback ripple runs through the ranks; dust along the line; slow motion 0.6x 0.5 s; camera 1.08x | +1.6 s on the window | layered `clang.parry` and `hit.flesh` cluster, `voice.warcry` both sides, the din jumps | 0.35; stop 120 ms global |
| charge | first melee of a mounted, lance-bonus, or speed-3 squad | 4.6 | 1.0 s | `hooves` crescendo, `voice.wolf` howl for wolves, a crash on impact | 0.25 to 0.45; stop 120 ms global |
| swing | every sampled strike | motion of 4.4 | 0.17 to 0.8 s | `swing.*` or `thrust` (featured, or 35%) | - |
| miss: dodge | miss, target without a shield and agile | sidestep 6 wu or duck | 0.2 s | whoosh only | - |
| miss: parry | miss | weapons meet, 4 white sparks | 0.15 s | `clang.parry` (-6 dB unless featured) | - |
| miss: shield | miss, shielded target | shield raised, thunk | 0.2 s | `block.shield` | - |
| deflect | A2 `blocked` | sparks or chips by armor class (4.5); flinch 2 wu; "ARMOR" chip when deflections pass 60% | 0.15 s | `deflect.<class>` | stop 30 ms local |
| wound | hit, no kill | white flash, red tint, spray, knockback 4 wu, blood drop | 0.3 s | `hit.flesh`, `voice.grunt` 40% | stop by weight (5.2) |
| kill | visible death | flash, spray, death style (5.6), body stays, pool grows over 1.2 s | 0.45 to 1.4 s | `hit.flesh.heavy` or `hit.bone`, `voice.death` (within limits), `body.fall` | stop by weight; shake by weight (5.3) |
| proxy kill | kill beyond visible deaths | spray, stagger 8 wu, a ghost copy falls and stays | 0.5 s | `hit.flesh`, crowd layer | stop 40 ms local |
| featured kill | up to 6 per phase (9.3) | as kill, plus a global stop, larger spray | as kill | louder, `blood.splash` | global stop by weight |
| dismember | Brutal, heavy or huge kill, 25% | a part tumbles away and stays | 0.6 s | `dismember` | - |
| arrow: body | missile wound or kill | sticks in the sprite (up to 3 shown) | 0.05 s | `arrow.body` | - |
| arrow: shield | missile miss on a shielded target | sticks in the shield | 0.05 s | `block.shield` | - |
| arrow: armor | missile deflect | glances off with a spark, or snaps on bark | 0.1 s | `arrow.armor` or `deflect.bark` | - |
| arrow: ground | missile miss | sticks in the ground 10 to 40 wu off and stays; splash in swamp | 0.05 s | `arrow.ground` | - |
| fire arrow | Flame Archer hits and misses | target ignites 1 s; ground burns 1.5 s | 1.0 s | `hit.fire` | - |
| javelin | Ember Skirmisher volley | run-up throw, spinning flat arc, sticks | 0.5 s flight | `thrust`, `arrow.body` | - |
| breath | Salamander or Wyrm volley | cone of fire (or the nation's element) over the targets | 0.9 s | `breath.fire`, `voice.monster` | 0.10 |
| out of ammo | a squad's volleys reach its ammo | bows slung, knives drawn | 0.5 s | - | - |
| flyer swoop | strike by a flyer | dive arc and climb | 0.6 s | `wings` whoosh or `buzz` pitch-up | - |
| berserk rage | berserk squad wounded or engaged | red rim pulse, jitter, roars | loop | `voice.roar` on contact | - |
| heavy footstep | size 4+ unit moving | dust puff, local tremor | per step | `footstep.giant` | 0.04 |
| monster death | size 3+ death | slow topple, dust ring | 0.9 to 1.4 s | `voice.monster`, `body.fall` (large) | 0.30 to 0.50 |
| shaken | a squad must check this round (7.1) | glance back, step back 4 wu, pennant wobble | 0.4 s | murmurs | - |
| holds | shaken and no rout | brace, step forward, shout | 0.4 s | short `voice.warcry` | - |
| last stand | the death of a squad's last visible sprite | featured kill, slight camera lean | 0.6 s | - | 0.10 |
| wiped out | a squad's count reaches 0 | its pennant falls among the bodies; HUD skull | 0.5 s | - | - |
| the line breaks | a side's last active group routs | bold ticker line; the whole side flees | 1.5 s | long `horn.retreat`, mass `voice.panic`, winners' `voice.warcry` | - |
| withdrawal | round-50 `leave` of the attackers | orderly march off, banners up; card | 2.0 s | calm `horn.retreat` | - |
| exhausted | caster's fatigue reaches 100 (A4) | caster kneels, panting; grey chip | loop | breathing | - |
| quiet rounds | 3+ rounds of housekeeping only | interlude card over ambient idle | 1.6 s | ambience swells | - |
| pretender reveal | a pretender in either roster | spotlight in the intro | 1.2 s, inside the intro | low drone and a bell | - |

---

## 14. Code layout and data flow

```
src/render/battle/
  timeline/               PURE: no Pixi, no DOM, no Web Audio, no Math.random (lint rule)
    prng.ts               presentation stream (mulberry32 seeded by hash of battle id + round + phase)
    segment.ts            log -> rounds -> phases (A1 markers; heuristic fallback)
    layout.ts             bands, lanes, blocks, sprite slots, clash line
    visible.ts            visible(), proxy accounting
    strikes.ts            melee strike synthesis (9.3)
    missiles.ts           projectile synthesis
    spells.ts             spell storyboards as cue scripts
    morale.ts             shaken, break chance (DRN difference table)
    beats.ts              beat detection, intensity, auto-tempo
    timemap.ts            story time -> real time: speed, Beats mode, slow motion, hit-stop plateaus
    cues.ts               the Cue union
    build.ts              buildTimeline(record, profiles, options) -> Timeline
  profiles.ts             unit presentation profiles (4.12)
  motions.ts              weapon motion table (4.4)
  BattleRenderer.ts       Pixi scene; renders the timeline at a time t
  layers/                 Backdrop, Ground (decal render texture), Troops, Projectiles, Particles, Fx, Overlay
  camera.ts shake.ts
src/render/audio/
  engine.ts               context, buses, compressor and limiter, reverb per terrain, voice limits, ducking
  recipes/                one module per family; pure graph descriptions
  bank.ts                 OfflineAudioContext pre-render of variants
  battleSound.ts          sound cues -> voices
src/ui/panels/BattleReplay.tsx
src/ui/panels/battle/     SideDock, Ticker, Transport, Scrubber, NameCard, ResultCard, SettingsPopover, LogPanel
```

- `buildTimeline` is pure and deterministic: the same record and options give the same
  cues. It runs once when the replay opens (a few thousand cues, a few ms). Speed is not an
  option; it lives in the time map, so changing speed never rebuilds the timeline. Detail
  level and reduced motion are options (they change budgets and cues), and changing them
  rebuilds at the current story time.
- The renderer is a function of story time: seeking computes the scene at t (living sprites,
  positions, bodies, decals) from the cues before t, so scrubbing backwards is exact.
- Pixi 8: troops are plain sprites from a runtime atlas (SVG parts rasterized at 2x per unit
  and banner tint at load, plus a white silhouette texture per frame for hit flashes);
  particles in `ParticleContainer`s; decals and bodies baked into the ground
  `RenderTexture`; one `ColorMatrixFilter` on the scene for lighting, desaturation, and
  slow motion; no per-sprite filters. Target 60 fps at 1080p with 600 troop sprites and
  4,000 particles on integrated graphics; the Auto detail setting backs off when frames
  run long.
- `src/render` is outside the purity guard, but the `timeline/` folder gets the same
  restrictions as the sim (no `Math.random`, `Date`, DOM, Pixi), enforced by ESLint and the
  source-scan test, so its tests stay deterministic.

---

## 15. Tests

Pure and cheap (Vitest, Node):
1. **Conservation**: for every squad, death cues plus proxy bodies equal its logged kills;
   bodies on the ground at the end equal total deaths; the panel's counts at each phase end
   equal `foldReplay` at that point.
2. **Sanity of invented detail**: no sprite dies twice; no sprite strikes after its death;
   no strike targets a sprite already dead; sampled outcome shares per pair are within one
   strike of the logged shares; every visible death has a killing strike or projectile.
3. **Determinism**: building twice gives identical cues (hash snapshot of a fixture).
4. **Budgets**: strikes and projectiles per phase within the table at each detail level and
   speed; mandatory deaths always present.
5. **Duration**: starting-army fixture 25 to 60 s at 1x; 300-vs-300 fixture under 120 s;
   round-50 stalemate fixture under 150 s at 1x and under 40 s in Beats mode.
6. **Coverage**: every `BattleEvent` kind maps to a cue (an exhaustive switch with a `never`
   check); every unit and battle spell in content has a profile or a valid fallback and a
   storyboard or template.
7. **Settings**: reduced motion yields no shake, camera, slow-motion, or global hit-stop
   cues; gore Off yields no blood cues; flashes never exceed 3 per second.
8. **Morale meter**: the break-chance table matches a Monte Carlo of the sim's own `drn`
   over 200,000 draws within 0.5 percentage points.
9. **Sim additions** (A1 to A5): `blocked <= hits <= attacks`; kills sum to the fold;
   phase markers in order; all existing determinism and balance tests unchanged.

Browser (Playwright, Chromium, cheap):
10. **Screenshot smoke**: open a fixture replay per terrain, seek to fixed story times
    (intro, first contact, a commander death card, the result card), pause, screenshot;
    assert the canvas is not blank (pixel variance) and keep the images as review
    artifacts. Gore Off: no clusters of blood-red pixels in the first-contact frame.
11. **Audio smoke**: render one variant of every recipe in an `OfflineAudioContext`; assert
    the expected length, no NaN, peak at or under 1.0, RMS above a floor (not silent).
12. **Controls**: pause, speed buttons, skip to end, keyboard shortcuts drive the time map.

---

## 16. Build order and doc changes

Inside Phase 10 and 11, each step ending green:
1. **10a** the sim additions A1 to A6 with tests; the save layer gzips (or a note for Phase 9).
2. **10b** the pure timeline: segment, layout, visible, strikes, missiles, morale, beats,
   time map, with tests 1 to 9.
3. **10c** the stage: backdrops, blocks, idle life, closing, clash line, strikes, impacts,
   deaths, bodies, decals, with placeholder rectangles until Phase 11 art lands.
4. **10d** spells and field effects; cinematic beats; camera and shake.
5. **10e** audio engine, recipes, bank, sound cues; audio smoke test.
6. **10f** HUD, ticker, transport, scrubber, settings, result card; Playwright smoke tests.
7. **11** art: archetype silhouettes and nation layers, profiles complete, portraits, death
   parts for Brutal gore. Then playtest and tune numbers into `docs/09-balance.md`.

Doc changes:
- `docs/10-milestone-1.md`: move "sound" out of the out-of-scope list for battles ("map
  sound and music" stay out); add to criterion 14: "Battle replays play per
  `docs/07` with procedural sound effects and the gore, shake, reduced-motion, and volume
  settings."
- `docs/07-ui.md` "Battle replay": replace with a summary of sections 3, 9, 10, and 12.
- `docs/09-art-direction.md`: extend the animation table with the impact grammar (section 5)
  and the spell beats (6.1).
- `docs/04-battle.md` "Replay log": record A1 to A6.

## 17. Open questions

- Should the player's side always be on the left, or the attacker? (Proposed: the player.)
- Is Standard the right default gore level? (Proposed: yes, with Off one click away in the
  replay's gear menu.)
- Should Beats mode be the default for battles the player did not fight in person (a far
  garrison), and full speed for battles with its pretender? Proposed: remember the last
  choice for now; revisit after playtesting.
- A6 (roster morale) costs a few bytes per squad and makes the break-chance meter exact;
  without it the meter is labeled approximate.
