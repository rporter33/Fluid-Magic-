
### 4.17 Unit sound profiles

`src/audio/profiles.ts` maps every unit to a voice, an armor material, a shield flag, the
weapon family of each weapon, footsteps, and a body fall; nations add a flavor. The armor
column refines the spectacle proposal's visual armor class for sound (its "mail" for the
Cinder Horde is "scale" here, following `docs/09`: "Cinder Horde: scale armor").

| Unit | Weapons: family | Armor | Shield | Voice | Steps | Fall | Extras |
|---|---|---|---|---|---|---|---|
| Ash Militia | Spear: thrust | soft | | human, harsh | soft | light | |
| Cinder Warrior | Axe: axe | scale | | human, harsh | armored | mail | |
| Ember Skirmisher | Javelins: javelin; Knife: light | soft | | human, harsh | soft | light | draws a knife when out of javelins |
| Flame Archer | Fire Arrows: bowShort + bowFire | soft | | human, harsh | soft | light | |
| Berserker | Great Axe: axeHeavy | soft | | berserk | soft | light | roars on contact |
| Ash Rider | Lance: lance; Sword: blade | scale | | human, harsh + horse | hooves | rider | charge, lance breaks |
| Flamebrand | Burning Blade: blade + fire | scale | | human, harsh | armored | mail | |
| Fire Sprite | Flame Touch: fire touch | none | | sprite | wings | none (pops) | crackle aura loop |
| Scout (both) | Dagger: light | soft | | human | soft | light | |
| Ash Chieftain | Axe: axe | scale | | human, harsh, deep | armored | mail | |
| Pyre Priest, Ember Adept, Cinder Magus | Staff: staff | soft | | human, harsh | soft | light | |
| Salamander | Fire Breath: breathFire | ember | | salamander | heavy (size 3) | large | |
| Thorn Militia | Spear: thrust | soft | | human, breathy | soft | light | |
| Warden | Sword: blade | bark | yes | human, breathy | armored | light + bark | |
| Longbow Hunter | Longbow: bowLong | soft | | human, breathy | soft | light | |
| Briar Guard | Halberd: axeHeavy (parries as haft) | bark | | human, breathy | armored | light + bark | |
| Wolf Rider | Spear: thrust; Wolf Bite: bite | bark | | human, breathy + wolf | paws | rider | howl on the charge |
| Oakheart | Oak Maul: bluntHeavy | wood | | human, breathy, deep | heavy (size 2) | large | splinters |
| Hornet Swarm | Sting: sting | none | | swarm | wings | none | buzz loop |
| Warden Captain | Sword: blade | bark | yes | human, breathy, deep | armored | light + bark | |
| Grove Priest, Sapling Druid, Elder Druid | Staff: staff | soft | | human, breathy | soft | light | |
| Treant | Crushing Limbs: bluntHuge | wood | | treant | giant | huge | creaks when it moves |
| Light Infantry, Swamp Fighter | Spear: thrust | soft | | human | soft | light | Swamp Fighters do not splash in swamp |
| Heavy Infantry | Sword: blade | mail | | human | armored | mail | |
| Archer | Shortbow: bowShort | soft | | human | soft | light | |
| Independent Captain | Sword: blade | mail | | human, deep | armored | mail | |
| Wolf | Bite: bite | hide | | wolf | paws | light | |
| Giant | Club: bluntHuge | soft | | giant | giant | huge | |
| Oracle | Staff: staff | soft | | human, breathy, deep | soft | light | |
| Titan | Great Sword: bladeHeavy | plate | | giant at rate 0.9 | giant | huge | |
| Great Wyrm | Breath: breathGust; Bite: bite at rate 0.6 | scale at rate 0.6 | | wyrm | wings.huge | huge | |
| Living Monolith | none: stone slam (swing.huge, arm.stone) | stone | | stone | none | huge (shatter) | |
| Wild Spirit | Claws: claw | hide | | spirit | paws | none (dissolves) | regeneration sparkles |
| Ash Colossus | Burning Fists: bluntHuge + fire | ember | | colossus | giant | huge | fire shield licks strikers |
| Garrison | never fights | | | | | | no profile |

Flavor. Human voice recipes split their variants in two halves: harsh (more drive, ae and a
vowels, lower f0) and breathy (more breath, o and u vowels, less drive). Cinder Horde draws
from the harsh half, Thornwood from the breathy half, Independents from both. "Deep" plays the
same recipes at rate 0.9 and uses `vox.death.commander` for commanders.

Fallbacks, so a new unit never goes silent (a coverage test lists every unit that uses one):
voice from tags (construct with a fire weapon: sprite; other construct: stone; mindless
flying beast: swarm; beast of size 1 or 2: wolf; beast of size 3+: giant; undead, M2: bones;
otherwise human, deep from size 2), armor from protection (0 to 2 soft; 3 to 5 mail, scale
for the Cinder Horde; 6 to 9 plate, bark for Thornwood; 10+ plate, wood for Thornwood size 2+;
construct and immobile: stone; fire-element bodies: ember; beasts: hide; mindless flyers:
none), weapon family from the name (`/axe|halberd/`, `/sword|blade/`, `/spear|pike|lance/`,
`/club|maul|mace|hammer|fist|limb/`, `/bow/`, `/javelin/`, `/bite|jaw/`, `/claw|talon/`,
`/sting/`, `/breath/`, `/staff/`, `/knife|dagger/`) and weight from damage (3 or less light,
4 to 6 medium, 7 to 9 heavy, 10+ huge).

### 4.18 Variation, deterministically

Three levels of variation, all seeded, none from `state.rng`:

1. **Baked variants.** Variant k of a recipe is rendered from
   `seed = hash32('fm-sfx', BANK_VERSION, recipeId, k)`. Every `[x,y]` range in the recipe and
   every grain, jitter, and noise sample is drawn from that seed's stream. The same build bakes
   the same bank on every machine. Counts follow how often a sound repeats: death cries,
   pains, and efforts 12; flesh impacts 10; swings, armor, and arrow impacts 6 to 8; bodies 6
   to 8; spells 2 to 4; stingers 1 or 2. The M1 bank has 900 variants (section 4.19).
2. **Choice per instance.** Each sound instance in the plan has
   `instanceSeed = hash32(record.id, cue.key, role)` (role names the layer: `swing`, `impact`,
   `armor`, `wet`, `cry`, `fall`...). The variant comes from a **no-repeat bag**: per battle
   and recipe, the order of variants is a shuffle seeded by `hash32(record.id, recipeId,
   cycle)`; the instance takes position `ordinal mod n` of the current cycle, where `ordinal`
   is its rank among that recipe's instances in story order. A cycle that would start with the
   variant that ended the previous one swaps its first two entries. Nation flavor runs the bag
   inside its half. Because ordinals come from the plan, which does not depend on speed or
   seeking, a moment always gets the same variant.
3. **Micro-variation at play time**, from the instance seed: playback rate +-4% (voices +-2%,
   stingers and loops 0), level +-1.5 dB, pan +-0.04, start offset 0 to 12 ms for ensemble
   layers only (impacts land on their frame). The thinning draw `u = unit(instanceSeed ^
   0x9e3779b9)` is fixed per instance, so the set kept at 4x is a subset of the set kept at 2x
   and 1x.

Layering multiplies the variety: a melee kill combines a swing (6 to 8), an impact (10), an
armor layer (6 to 8), a crunch (8), a wet layer (8), a cry (12), a fall (6 to 8), and a drop
(6 to 8), each with its own rate and level jitter: millions of combinations, the same ones on
every replay.

### 4.19 Budgets and baking

Measured from the bank as data (`sound-proto/catalog.ts`, `budget.ts`, `worst.ts`), at 100x
real time per worker:

| Set | Recipes | Variants | Audio (s) | Memory (MB) | Bake, 1 worker (s) | Bake, 3 workers (s) |
|---|---|---|---|---|---|---|
| Full bank, M2 colors included | 251 | 982 | 1076 | 106.9 | 10.8 | 3.6 |
| M1 bank | 220 | 900 | 972 | 94.5 | 9.7 | 3.2 |
| Starting armies, Hills (Ember Dart, Thorn Spray, Bless) | 97 | 472 | 368 | 37.8 | 3.7 | 1.2 |
| 300 vs 300, Hills, Brutal gore | 148 | 683 | 558 | 57.9 | 5.6 | 1.9 |
| Worst M1 battle (both nations, mountains, every unit, spell, field effect, fort storm) | 192 | 831 | 747 | 78.0 | 7.5 | 2.5 |

| Family (M1 bank) | Recipes | Variants | Memory (MB) |
|---|---|---|---|
| Swings and attack motions | 15 | 96 | 3.0 |
| Flesh impacts and kill layers | 13 | 100 | 3.2 |
| Armor, shields, parries | 16 | 106 | 4.4 |
| Missiles | 19 | 103 | 5.5 |
| Movement and cavalry | 14 | 49 | 6.4 |
| Human voices | 10 | 86 | 5.9 |
| Beasts and monsters | 19 | 69 | 8.9 |
| Crowds and din | 13 | 22 | 7.4 |
| Bodies and dropped gear | 11 | 55 | 3.7 |
| Command, morale, stingers | 24 | 47 | 10.1 |
| Spell beats by color | 17 | 44 | 6.9 |
| M1 spell specifics and elements | 15 | 52 | 5.7 |
| Field effects | 9 | 21 | 5.5 |
| Ambience (seven terrains; one per battle) | 25 | 50 | 17.9 |

The battle rows select by need tags and are upper bounds: `needs.ts` reads the events
themselves (no `stinger.withdraw` unless the attacker withdrew at round 50, only the player's
own outcome stinger, commander-death sounds only if a commander dies, gore layers only at gore
Standard or Brutal), which trims 10 to 25% more. Memory is `AudioBuffer` float32, which
browsers keep uncompressed.

How baking runs (`engine/bank.ts`):
- **Workers**: `min(3, hardwareConcurrency - 1)` module workers created on first need. A job is
  `{ recipeId, variant, sampleRate }`; the result is a transferred `Float32Array`; the main
  thread creates the `AudioBuffer` (`new AudioBuffer({ length, numberOfChannels: 1,
  sampleRate })` and `copyToChannel`). Workers have no Web Audio, which the synth does not
  need.
- **Priorities when a replay opens**: P0, the intro (both nations' horns, drums, chants, the
  terrain beds and sprinkles, `army.idle`, `step.march.*`, `amb.flag`, the impulse response),
  about 0.3 s of work; P1, everything round 1 uses (from the log: volleys, casts, closing
  moves); P2, the melee core for the units present; P3, the rest in story order of first use.
  P0 is under 1 s of work on one worker (about 0.3 s on three) once the `always` set is
  pre-baked; the 3 s intro hides P0 and P1. A sound whose buffer is not ready when its time comes is
  skipped, never waited for, and counted in the stats.
- **Session cache**: baked buffers stay in an LRU keyed by `recipeId#variant@rate`, capped at
  128 MB, so a second replay of the same armies starts instantly. At game load, idle time
  (`requestIdleCallback`, one worker) pre-bakes the `always` set (36 recipes, 14 MB, 1.5 s of
  CPU) and then the player's nation set (together 72 recipes, 28 MB, 2.8 s).
- **Audio quality setting** (Settings, default High): Low halves the variant counts (bags still
  avoid repeats) and caps rates at 24 kHz, about 45% of the memory, for weak machines.
- **Persistent cache**: not in M1. Baking is fast enough; an IndexedDB cache keyed by
  `BANK_VERSION` can come later.

---

## 5. Cue to sound

Times are story time from the cue's own time. "Swing lead" means the swing starts at contact
minus 0.55 of its length, so its loudest point lands just before contact. Priorities and
classes are in section 6.5; thinning in 6.9; ducks in 6.7. Captions show only with the
captions setting on.

### 5.1 Melee strikes

| Outcome | Layers | Notes |
|---|---|---|
| any | swing by the attacker's weapon family (`swing.*`, `thrust`, `thrust.heavy`, `swipe.claw`, `snap.jaws`, `dart.sting`, `swing.punch`) at swing lead; `whoosh.flame` @-8 on fire weapons; attacker effort `vox.effort` (human) 15%, `wolf.growl` on a beast's first strike in a round | swings only for featured strikes and a share of the rest (6.9) |
| dodge | the swing alone, and the target's cloth or fur rustle (part of the swing recipe) | |
| parry | `parry.blade` when both weapons are metal-edged (light, blade, bladeHeavy, axe); `parry.haft` when either is a haft (thrust, lance, staff; axeHeavy, the great axe and the halberd, 50%); beasts, claws, bites, stings: treated as dodge | -6 dB unless featured |
| shield | `shield.wood`, plus `shield.boss` @-4 in 30% of blocks | Wardens, Warden Captains |
| deflect (A2 `blocked`) | `arm.<material>` at full level; plate: `glance.scrape` 60%, `glance.ping` 30%; mail and scale: `glance.scrape` 40%; bark and wood: the splinters in the recipe; stone, ember, hide, soft, none: their `arm.*` alone | the sound of armor holding: the player hears that axes do not get through Briar Guard |
| wound | flesh by family: light, blade, bladeHeavy `hit.cut`; axe, axeHeavy `hit.chop`; staff, blunt, unarmed `hit.blunt`; thrust, lance `hit.pierce`; claw, bite `hit.tear`; sting `hit.sting`; fire touch `hit.burn`; plus `arm.<material>` @-6 when armored (the blow goes through the armor), `elem.fire.sizzle` @-6 for fire weapons, `gore.squelch` (gore Standard +0, Brutal +4 dB), pain by the target's voice (`vox.pain`, `wolf.yelp`, `giant.bellow` short, `salamander.hiss`, `treant.groan`, `stone.grind`, `wyrm.roar` short, `spirit.howl`, `colossus.roar`) 40% at 1x, +40 ms | loudness by damage, weight, and the target's size (6.3) |
| kill | the wound's flesh layer +2 dB; `kill.crunch` (blunt, chop, huge, bite always; cut, pierce, tear 50%; sting and fire touch never); `kill.thud.heavy` for heavy and huge weapons; `gore.spatter` (gore Standard+); `gore.tear` when the visuals dismember (Brutal); the death cry (5.2) at +60 ms; the fall (5.2) at the death's ground contact; `drop.metal` or `drop.wood` 30% at ground contact +0.1 to 0.3 s; `fall.splash` in swamp, `fall.leaves` in forest | a fire kill replaces the wet layers with `elem.fire.ignite` and the cry keeps burning (+0.3 s longer variant) |
| proxy kill | the wound's flesh layer and `kill.crunch` 50%; no cry (the crowd layer takes it, 6.6); the ghost body's fall @-6 | |
| featured | +3 dB, the swing always, a dropout duck (6.7) under the impact | up to 6 per phase (spectacle 9.3) |
| on a commander | as above with the exact `damage` amount; pain at rate 0.9; A3 `by` picks the striker's weapon sound | |
| berserker in contact | `vox.roar.berserk` once per squad per round, cap 2 at a time | |
| fire shield (Ash Colossus) | `fire.shield` on the strikers, `vox.pain` from one of them | |

### 5.2 Deaths and bodies

| Voice | Death cry | Fall |
|---|---|---|
| human | `vox.death.scream` 60%, `vox.death.groan` 25%, `vox.death.short` 15%; `vox.death.short` always at 2x and above and when 4 cries are already sounding; `gore.gurgle` tail +0.5 s at gore Standard 25%, Brutal 50%; death cries off: `vox.pain` instead | `fall.light`, `fall.mail`, or `fall.plate` by armor; bark adds `arm.bark` @-10 |
| human, commander | `vox.death.commander` (5.6) | by armor, +3 dB |
| berserk | `vox.roar.berserk` at rate 0.85, fading | `fall.light` |
| wolf | `wolf.death` | `fall.light` at rate 0.9 |
| rider (Ash Rider, Wolf Rider) | the rider's cry; for the mount: `horse.whinny` at rate 0.9 (a scream) or `wolf.death` | `fall.rider` |
| giant, Titan | `giant.death` (Titan at rate 0.85) | `fall.huge` + `step.giant` as the knee hits |
| salamander | `salamander.shriek` | `fall.large` + `elem.fire.sizzle` |
| treant | `treant.death` (its own crash) | none extra |
| sprite | `sprite.pop` | none |
| swarm | `swarm.die` | none |
| stone (Monolith) | `stone.shatter` | none extra |
| wyrm | `wyrm.death` | `fall.huge` at rate 0.8 + `wings.huge` @-6 |
| spirit | `spirit.howl` at rate 1.1 through a closing low-pass | none (dissolves) |
| colossus | `colossus.death` | `fall.huge` |

### 5.3 Missiles

| Cue | Layers | Notes |
|---|---|---|
| volley release | per shooting block: `bow.short`, `bow.long`, or `throw.javelin` (+ `vox.effort` 30%), fire arrows add `bow.ignite`; `n = min(6, ceil(sqrt(visible shooters)))` instances spread over the 0.25 s ripple, total level +6 log10(shooters) dB over one | |
| flight | `volley.cloud` two variants, one panned at the shooters, one at the targets, starting at release, level -20 dB at 20 arrows +3 dB per doubling, cap -8; `arrow.flyby` (or `.fire`, `javelin.flyby`) only for featured projectiles near the camera, at most 2 per volley | Doppler is in the recipe; pan ramps from x0 to x1 |
| impact | per landing projectile: wound or kill `arrow.flesh` (+ `hit.pierce` and the kill layers on a kill), shield `arrow.shield`, deflect on metal `arrow.armor`, on bark or wood `arrow.wood`, ground by terrain `arrow.ground.soil` (plains, farmland, hills), `.leaf` (forest), `.rock` (mountains, wasteland, a stormed fort), `.mud` (swamp); fire arrows add `elem.fire.sizzle` on hits | ground hits merge within 30 ms |
| breath | `breath.fire` (Salamander) or `breath.gust` (Wyrm) with the beast's roar (`salamander.hiss`, `wyrm.roar`) 0.2 s before; per struck sprite `hit.burn`, kills `elem.fire.ignite` | |
| out of ammunition | `draw.blade` @-8 from the block | |

### 5.4 Movement, charges, contact

| Cue | Layers |
|---|---|
| closing step (round start) | a `step.march.soft` or `.armored` loop per moving block for the step's duration, level 10 log10(sprites/10), panned at the block; mounted blocks `hoof.gallop` or `paws.run` at walking rate 0.6; size 4+ units `step.giant` per footfall (the spectacle's tremor cue) |
| charge | from t0: `hoof.gallop` loops, `min(6, ceil(riders/4))` instances with random phases and rates +-4%, plus `charge.rumble` (dual-play) from -18 dB at 10 riders to -8 at 60+, rising to impact with a low-pass opening 800 to 8000 Hz; wolves: `paws.run` and `wolf.howl` at t0; at tImpact: `charge.crash`, 1 to 3 `lance.break` (Ash Riders' first melee round), 1 or 2 `horse.whinny` |
| first contact | within 0.3 s: two `charge.crash` instances at the clash line, 8 extra impacts drawn from the strike plan's families, `vox.shout` x4 per side; the din jumps to its level with a 50 ms attack (6.6) |
| flyer swoop | `wings.flap` (sprites, hornets use the buzz pitch-up: `buzz.swarm` instance rate 1.15 for 0.3 s) or `wings.huge` |

### 5.5 Spells

A cast has five beats (spectacle 6.1). The generic mapping, with `c` the spell's color (holy
spells use W) and every layer at the caster's x unless noted:

| Beat | Layers |
|---|---|
| charge | `spell.c.charge` started at offset `1.4 - chargeLength` so its climax meets the release; short form: offset for half the charge |
| release | `spell.c.release` |
| travel | `spell.c.travel` loop for the flight, pan ramped from caster to target, playback rate 1.05 to 0.95 as it crosses the camera center (Doppler), stopped with a 30 ms fade at impact |
| impact | single or small area (fewer than 5 targets): `spell.c.impact` per struck sprite (at most 6 per cast; more merge, +3 dB); area of 5 or more: `spell.c.burst` once at the center plus per-sprite element layers (fire `hit.burn`, nature `thorns.erupt`, cold `elem.cold.shatter`, holy `elem.holy.flare`, decay `elem.decay.hiss`); kills take the normal death layers |
| linger | `spell.c.linger` loop at -20 dB for the linger, faded out over its last second |
| buff, debuff | `spell.c.buff` or `spell.c.curse` on the target block; every `buff` event of one cast plays once |
| heal | `spell.c.heal` at the caster, then a soft `regen.tick` on each healed block (cap 4) |
| summon | `spell.c.summon`, then the summoned unit's own sound (its loop or voice) |
| moraleShock (M2) | `spell.c.shock` if the color has one, else `shock.morale`, on the targets; their `crowd.murmur` follows |
| fatigueDrain (M2) | `spell.U.drain` from target to caster, the target's breath |

The eleven M1 battle spells:

| Spell | Sound |
|---|---|
| Ember Dart | `spell.R.charge` (0.35 s), `spell.R.release` @-3, `dart.flame.fly` for the streak, `hit.burn` on the troop; a kill: `elem.fire.ignite` and a burning cry |
| Fireball | `spell.R.charge` (0.7 s), `spell.R.release`, `spell.R.travel` for the lob, `spell.R.burst` at the center (ducks, 6.7), per sprite `hit.burn`, cries, `spell.R.linger` for 2 s |
| Warcry | the caster's `vox.shout`, then `chant.<nation>` (dual-play, level by friendly troops), `drum.<nation>`, `spell.R.buff` @-8 |
| Blood Fury | `heartbeat` twice as pre-roll (0.6 s before the release), `fury.swell` on the squad, `spell.R.buff` @-6 |
| Pyre Storm | `spell.R.charge` (1.3 s) with `charge.rumble` @-6 under it, `spell.R.release`, then per meteor `meteor.whistle` 0.25 s before impact and `explosion.small` at impact (at most 6 at once; later ones merge), `spell.R.linger` at two points; slow motion per 6.8 |
| Thorn Spray | `spell.G.charge` (0.35 s), `spell.G.travel` for the ground crack, `thorns.erupt` under each of the 3 sprites, flesh layers |
| Bark Skin | `spell.G.charge` short, `bark.grow` on the squad; from then on, deflections on that squad play `arm.bark` (the profile's armor becomes bark while the buff lasts) |
| Entangle | `spell.G.charge`, `roots.burst` on the target block, 2 or 3 `vox.effort` from its sprites (struggling); at `expire`, `expire.soft` and a short `spell.G.curse` tail @-10 |
| Swarm | `spell.G.charge`, `swarm.erupt`, then a `buzz.swarm` loop (dual-play) bound to the swarm squad: level 10 log10(count/20), stopped when it is destroyed or leaves |
| Regrowth | `spell.G.charge` (0.8 s), `spell.G.heal` as the wave passes, `regen.tick` per healed squad |
| Bless | `bless.chime` (full form the first time a priest blesses in a battle, then the short form) |

### 5.6 Morale and commanders

| Cue | Layers |
|---|---|
| shaken | `crowd.murmur` at the block, -10 dB |
| holds | `vox.shout` from the block, -6 dB |
| rout | once per side per round: `horn.retreat.<nation>` (`.short` at 2x and above) panned at that side's edge; per routing block: 2 or 3 `vox.panic`, 1 or 2 `drop.metal`, a `step.march.soft` loop at rate 1.4 whose pan ramps to the edge and low-pass closes 8 to 2 kHz over 1.5 s; a block holding 10%+ of its side's starting troops adds `crowd.panic` |
| leave | the runners' loop fades over 0.6 s |
| the line breaks | the long `horn.retreat.<nation>` (not short, even at 2x), `crowd.panic` dual-play, the winners' `chant.<nation>` @-4 |
| round-50 withdrawal | `stinger.withdraw`, an orderly `step.march.armored` loop fading off |
| commander death | -0.25 s: `heartbeat` starts (repeats at 66 bpm through the slow motion); 0: the killing blow (featured), `boom.sub`, `vox.death.commander` (+ `gore.gurgle` by the gore rule), the fall; +0.3 to +1.3 s: `banner.fall`; +1.0 s: `bell.toll` @-6 and `whoosh.card`; +1.4 s: `crowd.gasp` from its side; the commander-death duck (6.7) |
| pretender death | as a commander, plus `bell.toll.god` scheduled 0.8 s before the blow (its reversed swell is pre-roll), `choir.god` from the blow, the body's own death (`wyrm.death`, `stone.shatter`, `colossus.death`, `giant.death`, `spirit.howl`, or `vox.death.commander` for the Oracle), `spell.<dominant color>.burst` @-3 as it dissolves; the god duck (6.7) |

### 5.7 Field effects, heals, auras, fatigue

| Cue | Layers |
|---|---|
| storm on | `field.storm.wind` (dual-play) fading in over 2 s, `field.storm.rain` (dual-play) over 3 s, a `thunder.far`; birds stop |
| lightning | `thunder.near` 0.05 s after a near flash; `thunder.far` 0.3 to 1.2 s after a far one; at most one thunder per 2 s |
| storm off | rain fades over 3 s, wind over 4 s |
| fog on | `field.fog.onset`, the `field.fog.drone` loop; the effects and voices groups' fog filter closes from 18 kHz to 1.5 kHz over 1 s (you hear the fight as if through cloth); `fog.drip` sprinkles every 1.5 to 4 s |
| fog off | the filter opens over 1.5 s; the drone fades over 2 s |
| wall on | `field.wall.rise` with the caster color's `spell.c.impact` @-6 on top; while it stands, `vox.effort` from troops pressing on it, about one a second |
| wall off | `field.wall.crumble` |
| heal by life drain | `drain.life` at the striker, at most 2 per phase |
| heal by regeneration (end of round) | `regen.tick` per regenerating block, -20 dB, at most 3 per round; the Treant also `treant.groan` @-12 |
| buff from a source the viewer shows as an aura | per 5.5 |
| expire | `expire.soft` at the block |
| caster exhausted (fatigue 100) | `vox.breath.exhausted` loop at the caster while it lasts, -18 dB |

### 5.8 Opening, rounds, ending, and the bed

| Cue | Layers |
|---|---|
| intro | 0: both terrain beds (`amb.<terrain>.a` and `.b`, each dual-play) fade in over 1.5 s; `amb.flag`; `army.idle` per side at -30 dB + 10 log10(troops/100). 0.3 s: `draw.blade` x2 per side @-12. 0.6 s: the attacker's `horn.call.<nation>`. 1.0 s: the attacker's `chant.<nation>` (level 10 log10(troops/40) dB, clamped -6 to +4); wolves add a `wolf.howl`, giants a `giant.bellow`, a treant a `treant.groan`, a pretender its voice and a `bell.toll` @-12. 1.6 s: the defender's horn. 2.0 s: the defender's chant. 2.6 s: `drum.<attacker>` and `drum.<defender>` 0.1 s apart. Captions "[war horns]", "[battle cries]" |
| round start | one `drum.<nation>`, alternating sides by round (attacker on odd rounds), -6 dB; at 4x only on odd rounds |
| terrain sprinkles | a seeded Poisson scheduler in story time: larks or forest birds every 4 to 8 s until first contact (then never again), crows every 6 to 12 s in farmland and wasteland, a hawk every 20 s in hills and mountains, frogs every 2 to 3 s in swamp (-6 dB after contact), tree creaks every 6 s in forest, gusts every 10 to 15 s, rockfall every 25 s in mountains; a stormed fort adds `amb.siege.fire` |
| outro, the player won | the din releases over 2 s; `crowd.cheer` dual-play; `stinger.victory.<player nation>`; when the player defended and the attacker withdrew at round 50, the enemy's `stinger.withdraw` first, then the victory stinger at -3 dB |
| outro, the player lost | the enemy's `crowd.cheer` through a 2 kHz low-pass at -6 dB (far away), then `stinger.defeat` |
| outro, mutual rout | `stinger.withdraw` for both; no cheer |
| aftermath (under the result card) | the beds come back up by 6 dB, `amb.gust`; at gore Standard+, `crowd.wounded` at -24 dB at 20 dead rising to -14 at 200+, and `amb.crow` sprinkles |

---

## 6. The mixer

### 6.1 Graph

```
instance:  AudioBufferSource -> Gain (level, merge, steal fade) -> [Biquad LP for middle and
           rear rows, off-screen] -> StereoPanner -> class bus

class buses: swing, impact, gore, missile, voice, body, crowd, loop, spell, stinger, ambience
  each:    bus Gain -> duck Gain -> group, plus a send Gain -> reverb

groups:    effects  (swing, impact, gore, missile, body, spell, stinger, battle loops)
           voices   (voice, crowd, din voices)
           ambience (beds, sprinkles, field loops)
  each:    fog Biquad LP -> slow-motion Biquad LP -> user Gain (slider) -> master

reverb:    Convolver (the terrain's generated IR) -> return Gain -> master
master:    user master Gain -> soft-highs high-shelf (option) -> glue DynamicsCompressor
           -> limiter DynamicsCompressor -> safety WaveShaper (tanh, 2x oversample)
           -> mono downmix Gain (option: channelCount 1, explicit, speakers) -> destination
```

The engine takes any `BaseAudioContext`, so the same code renders into an
`OfflineAudioContext` in tests (section 8).

### 6.2 Levels (`mix.ts`)

Base levels at 1x, dB at the bus input before the user sliders; sends to the reverb in the
last column. The target is about -18 LUFS integrated over a typical battle with peaks at or
under -1 dBFS; the tests check RMS windows and peaks (8.2).

| Class | Layer | Base (dB) | Send (dB) |
|---|---|---|---|
| swing | all swings | -20 | -14 |
| impact | flesh | -12 | -10 |
| impact | kill crunch, heavy thud | -13 | -10 |
| impact | armor as the main layer (deflect) | -12 | -10 |
| impact | armor under a wound | -18 | -10 |
| impact | parry, shield | -14 | -8 |
| impact | glance layers | -18 | -8 |
| impact | arrow hits | -16 | -12 |
| impact | charge crash | -6 | -6 |
| gore | wet layers | Standard -18, Brutal -13 | -14 |
| missile | releases | -18 | -12 |
| missile | volley cloud | -20 to -8 by arrows | -10 |
| missile | flyby | -22 | -12 |
| missile | breath | -10 | -8 |
| voice | death cry | -14 | -6 |
| voice | commander death cry | -8 | -4 |
| voice | pain, effort | -20, -22 | -10 |
| voice | panic, shout | -16, -12 | -8 |
| voice | monsters (giant, wyrm, colossus, treant) | -10 | -6 |
| body | falls | -16 | -12 |
| body | drops | -20 | -12 |
| body | giant footsteps | -10 | -8 |
| crowd | chants | -10 to -4 by troops | -6 |
| crowd | cheer, gasp, panic | -10, -12, -12 | -8 |
| crowd | murmur | -20 | -12 |
| loop | din, army idle, marching, hooves, buzz | dynamic (6.6) | -12 |
| spell | charge, release, travel | -14, -10, -16 | -6 |
| spell | impact, burst | -10, -6 | -4 |
| spell | linger, buff and curse, heal, summon | -20, -12, -10, -8 | -6 |
| spell | regeneration tick, expire | -22, -20 | -10 |
| stinger | horns | -8 | -2 (horns echo off hills and mountains) |
| stinger | drums, bells, stingers | -10, -10, -6 | -8 |
| stinger | boom, heartbeat, banner, card | -8, -14, -14, -18 | -10 |
| stinger | thunder far, near | -12, -6 | -6 |
| ambience | each bed (dual-play) | -28 | -20 |
| ambience | sprinkles | -26 | -14 |

### 6.3 Loudness and pitch per instance

```
gainDb = base + weight + damage + size + row + featured + offscreen + jitter + merge
  weight     striking weapon: light -3, medium 0, heavy +2, huge +4 (swings and impacts)
  damage     impacts with a per-strike damage d: clamp(6 log2((d + 2) / 12), -6, +5), so the
             typical blow (d about 10: strength 10 plus the weapon less armor) is 0; a kill +2
  size       target size for impacts, falls, and cries, attacker size for swings:
             +1.5 per step above 1, at most +7.5
  row        front 0, middle -2.5, rear -5
  featured   +3; commander or pretender +2
  offscreen  -3 (with the 4 kHz low-pass)
  jitter     +-1.5 from the instance seed
  merge      +10 log10(k) for k merged hits, at most +6
rate = (1 + jitter) x (1 - 0.035 (size - 1)) x slowMotion
```

So an Ash Militia's spear wounding a Thorn Militia (light, d about 11) is about -14 dB, an
Oakheart's maul killing a Cinder Warrior (heavy, d about 20) about -3 dB, and a Giant's club
killing a man (huge, d about 28) about -1 dB before the limiter. A size-4 body's fall and cry play about two
semitones lower than a man's, a size-6 Wyrm's about three. Per-strike damage comes from the
timeline, which divides each pair's A2 `dmg` among its sampled hits; commander blows use the
exact `damage` events.

### 6.4 Space

- **Pan** = clamp(0.85 (x - cx) / hw, -0.85, 0.85), with cx and hw the camera's center and half
  width in world units, so a camera push-in widens the field. The player's side is on the left
  (spectacle 3.1). Travel layers and fleeing runners ramp their pan. Dual-play beds sit at
  -0.6 and +0.6; each side's din at its engaged blocks.
- **Rows**: middle rows through a 9 kHz low-pass, rear rows 6 kHz, as well as the -2.5 and -5 dB.
  Sounds off-screen get -3 dB and 4 kHz.
- **Reverb** per terrain, from the generated impulse responses of 4.16. Horns send the most,
  so they echo across hills and mountains; forest swallows highs; plains are dry.

### 6.5 Voice classes, priority, stealing, merging

| Class | Cap (0.5x to 2x) | Cap (4x) | Merge window | Notes |
|---|---|---|---|---|
| impact | 20 | 16 | 25 ms, same recipe, pan within 0.2 | |
| gore | 6 | 4 | 40 ms | |
| swing | 8 | 4 | 30 ms | |
| missile | 10 | 8 | 30 ms | volley clouds have their own 3 |
| voice | 10, of which death cries 6 and pains and efforts 4 | 8 (cries 4, no grunts) | 60 ms, same recipe | |
| body | 8 | 6 | 40 ms | |
| crowd | 4 | 4 | none | |
| spell | 10 | 8 | 20 ms | meteors merge |
| stinger | 4 | 4 | none | never stolen |
| loop | 16 | 16 | none | not stolen; the plan bounds them |
| ambience sprinkles | 2 | 2 | none | dropped when full |

At most about 100 sources at once in the worst moment, typically 50 to 70: cheap for any
desktop browser (a buffer source, a gain, a panner, sometimes a filter each).

**Priority** = role base + 30 if featured + 25 if a commander or pretender is involved +
3 (size - 1). Role bases: commander death cry 95, stinger 90, spell burst 80, other spell
beats 70, kill impact 60, crowd 60, death cry 50, visible fall 45, wet layer on a kill 45,
wound impact 40, deflection, parry, shield 35, missile release 35, arrow impact 35, wet layer
on a wound 30, proxy fall 25, pain and effort 25, swing 20, drop 20, flyby 15. **Must-play**
instances (commander and pretender deaths, every spell's release and impact, horns, round
drums, stingers, first contact, charges, deaths of size 3+, featured strikes, war chants, field
onsets) are never dropped or stolen; if a class is full of must-plays, its cap is exceeded
for them.

**Admission** (pure, `plan/allocate.ts`): when a class is full, the weakest active instance by
`score = priority - 20 x (elapsed / duration)` (a tail nearly done is cheap to cut) is stolen
with a 12 ms fade if the newcomer's priority beats its score by 5; otherwise the newcomer is
dropped. A newcomer within the merge window of an active instance of the same recipe and
nearby pan is merged instead: the active one's gain rises by the merge amount over 10 ms.

**Energy accounting.** A dropped or thinned impact, wet layer, or cry adds its power
`10^(gainDb/10)` to its side's din accumulator (a leaky integrator, time constant 0.4 s). The
din level (6.6) includes it, so the mass of a fight is heard even when its single blows are
not.

### 6.6 The crowd layer

The din is two families of loops per side: clatter (`din.clash.small`, `din.clash.mass.a`
and `.b`, whose 8 s and 11 s lengths realign only every 88 s) and voices (`din.voices`), all
dual-play. From each `meleeLoad` cue (attacks and engaged troops per side in a melee window,
from the log's A2 `attacks`):

```
attackRate = attacks / windowStorySeconds
clashDb    = clamp(-40 + 16 log10(1 + attackRate), -60, -10)
massShare  = smoothstep(40, 150, engagedBothSides)      // small loop below 40, mass above 150
voicesDb   = clashDb - 4
target     = 10 log10(10^(clashDb/10) + overflowPower), at most -8 dB
ambience   ducks by 0.3 x max(0, dinDb + 30) dB as the din rises
```

A small first contact (about 12 attacks a second) sits near -22 dB; the 300-vs-300 one (about
110 a second) hits the -10 dB ceiling. Before contact the din is silent and `army.idle` holds;
at contact it rises with a 50 ms attack; between melee windows it releases with a 0.6 s time
constant, so each round breathes. Each side's loops pan at its engaged blocks, 0.2 apart.

### 6.7 Ducking

Ducks are gain automations on the per-bus duck nodes. Several ducks on one bus combine by the
deepest, never by sum.

| Trigger | Ducks | Depth (dB) | Attack | Hold | Release |
|---|---|---|---|---|---|
| featured blow (with a hit-stop) | every effects bus but the blow's own instance | -6 | 5 ms | the hit-stop | 150 ms |
| first contact crash | ambience; voices | -8; -3 | 20 ms | 0.3 s | 1.0 s |
| spell burst (Fireball, Pyre Storm, any burst) | ambience, crowd, din; impacts; voices | -6; -4; -3 | 10 ms | 0.4 s | 0.9 s |
| horn (call or retreat) | din, ambience | -4 | 50 ms | 0.6 s | 0.8 s |
| near thunder | ambience; effects | -4; -2 | 10 ms | 0.2 s | 0.6 s |
| commander death | everything but its own layers and stingers; ambience and din | -8; -10 | 30 ms | the slow motion (about 1.6 s) | 1.2 s |
| pretender death | everything but its own layers | -14 | 50 ms | 2.5 s | 2.0 s |
| outcome stinger | all battle effects and the din | fade to silence | 0.3 s | to the end | |

### 6.8 Hit-stop and slow motion (story-time effects)

- **Hit-stop** freezes the picture, not the sound: the impact plays at the freeze, its tail
  rings through it, and the dropout duck makes it land. Nothing new is scheduled during the
  freeze, because story time does not advance.
- **Slow motion** (commander deaths, Pyre Storm, a god's death): new one-shots start at
  playback rate x0.8 (about four semitones down); active one-shots ramp to x0.8 over 120 ms
  (playback rate is an `AudioParam`); the slow-motion filter on the effects and voices groups
  closes from 18 kHz to 1.2 kHz in 150 ms; reverb sends +6 dB; `heartbeat` at 66 bpm. On exit
  everything returns over 250 ms. With the hit-stop and slow-motion setting off, or reduced
  motion on, the timeline has no slow motion, so neither does the sound.

### 6.9 Playback speed

One-shots never change pitch with speed: at 4x a sword sounds like a sword. Speed changes
density:

| Layer | 0.5x | 1x | 2x | 4x |
|---|---|---|---|---|
| swing, not featured | 0.5 | 0.35 | 0.2 | 0 |
| pain and effort (multiplies the shares of 5.1: pain 40%, effort 15%) | 1.25 | 1 | 0.6 | 0 |
| wound, deflection, parry, shield impact | 1 | 1 | 0.7 | 0.4 |
| kill impact | 1 | 1 | 1 | 1 |
| death cry (visible death) | 1 | 1 | 0.7 (short variants) | 0.4 (short variants) |
| wet layers | 1 | 1 | 0.6 | 0.3 |
| visible fall | 1 | 1 | 0.7 | 0.4 (size 2+ always) |
| drops | 0.3 | 0.3 | 0.15 | 0 |
| arrow impact | 1 | 1 | 0.6 | 0.3 |
| flyby | featured | featured | featured | none (clouds only) |
| round drum | every round | every round | every round | odd rounds |

Keep probabilities apply to what the timeline's own speed budget already sampled (spectacle
9.3: 90, 55, 30 strikes per melee phase at 1x, 2x, 4x). Must-plays are always kept. The
draw is fixed per instance (4.18), so thinning is monotone across speeds. At 2x and above
the retreat horns use their `.short` variants (except when the line breaks) and chants start
at their second bark. Caps drop at 4x as in 6.5. The din's smoothing time constant scales from
0.25 s at 1x to 0.12 s at 4x so it follows the faster story. Loops (beds, rain, buzz) are
unaffected by speed.

### 6.10 Pause, resume, seek, skip, close

- **Pause**: the effects and voices groups ramp to silence over 80 ms and every active
  one-shot stops; the scheduler stops; the ambience group drops 10 dB and keeps playing, so
  the field still breathes. **Resume** restores the groups over 80 ms and the scheduler picks
  up from the paused story time; one-shots that started before the pause are not restarted.
- **Seek** (scrubber, step, beat jump): every one-shot stops with a 30 ms fade; while dragging,
  only the ambience plays. On release the scheduler asks the plan which sustained layers are
  active at the new time (beds, din and its level, field loops, lingers, buzz, a charge's
  rumble, exhausted breathing) and starts them at a seeded loop offset with their levels at
  that time; long one-shots (horns, bells, stingers, chants: over 1 s) that began within the
  last 0.5 s start at the matching offset; everything else waits for its next cue.
- **Skip to end**: all battle layers fade out over 0.2 s; the outro set (5.8) plays at once
  with the result card; the aftermath follows.
- **Close**: the battle groups fade over 0.2 s and their nodes are released; the bank cache
  stays; the context is suspended after 10 s with no replay open and resumed on the next one
  (the page already has user activation by then).
- **Hidden tab** (`visibilitychange`): the replay pauses (as the visuals do), and the context
  is suspended; it resumes when the tab is visible and the replay plays again.

### 6.11 Scheduling and sync

The scheduler runs every 25 ms (`setInterval`, not `requestAnimationFrame`, so frame drops do
not starve it) and schedules every instance whose real time falls within the next 120 ms, at
`audioTime = ctx.currentTime + (realTime - nowReal) - outputLatency` (`ctx.outputLatency`,
else `baseLatency`, else 0), so a sound leaves the speakers when its frame is shown. The time
map (story to real, with speed, slow motion, hit-stop plateaus) belongs to the timeline and
is shared with the renderer. An instance more than 40 ms late is dropped if it is shorter
than 0.5 s, else started at the matching offset. Speed changes re-map only what is not yet
scheduled.

### 6.12 Master chain

Glue compressor: threshold -18 dB, knee 6, ratio 3, attack 10 ms, release 150 ms. Limiter:
threshold -2 dB, knee 0, ratio 20, attack 1 ms, release 60 ms. The safety `WaveShaper`
(tanh) guarantees no sample above full scale even when the limiter's look-ahead is too short
for a sub drop. Calm mode (7) lowers the glue threshold to -24 dB at ratio 4.

### 6.13 Autoplay policy

Browsers start an `AudioContext` created without a user gesture in the suspended state.
`engine/context.ts` therefore creates the context lazily and installs capture-phase listeners
for the activation-triggering events (`pointerdown`, `keydown` other than Escape,
`pointerup` for touch, `touchend`) at app start; the first one creates or resumes the
context and the listeners remove themselves once its state is `running`. Opening a replay is
itself a click, so in practice sound is ready. If a replay opens while the context is not
running (keyboard paths, Safari's `interrupted` state), the transport bar shows "Sound is
off. Click to enable", whose click resumes it; the replay plays silently until then and the
captions still work. If no context can be created (no audio device), the sound menu says
"Sound unavailable" and the replay plays silently. The bank does not need the context: workers
bake before any gesture.

---

## 7. Settings and accessibility

Settings live in the UI settings store, persisted with the other UI preferences
(`zustand/middleware` `persist` to `localStorage` key `fm.settings.v1`, a version and a
migration; reads and writes in try/catch, defaults if storage is unavailable or corrupt).
They are never in `GameState`, saves, or records.

| Setting | Default | Effect |
|---|---|---|
| Master, Effects, Voices, Ambience | 80, 80, 70, 50 | sliders 0 to 100, gain = (v/100)^2: 80 is -3.9 dB, 50 is -12 dB, 10 is -40 dB, 0 is silent; ramps over 30 ms |
| Mute (M) | off | the master ramps to silence; remembered |
| Death cries | on | off: cries become pains or nothing, the din voices drop 6 dB |
| Gore (shared with the visuals: Off, Standard, Brutal) | Standard | Off: no wet layers, no gurgles, fewer crunches (kills 50%); Brutal: louder wet layers, tears, gurgles 50% |
| Sound captions | off | the ticker shows "[war horns]", "[battle cries]", "[Thornwood retreat horn]", "[screams]", "[a bell tolls]", "[fire roars]", "[wolves howl]", "[thunder]", "[the god's death knell]", at most one a second |
| Mono | off | downmix at the end of the chain, for players hearing with one ear |
| Calm mode | off | for players startled by sudden loud sounds: stingers, booms, bursts, and charge crashes -6 dB, a 4 ms fade-in on every impact, heavier glue compression |
| Soft highs | off | a high shelf of -6 dB above 4 kHz on the master (ringing metal, screams), for players sensitive to harsh sounds |
| Audio quality | High | Low: half the variants, 24 kHz at most (4.19) |

Accessibility notes.
- **Nothing is only audible.** Every sound that carries information has a visual twin from the
  spectacle proposal: deflection sparks and the "ARMOR" chip, rout pennants and the ticker,
  commander cards, spell symbols. Captions cover the big moments for deaf players.
- **Sound adds a channel for color identity**: each mana color has its own sonic signature
  (Ember crackles and roars, Loam rustles and creaks, Radiance rings, Tide splashes and
  shatters, Umbra hisses and whispers), which helps players who cannot tell the palettes apart.
- **Reduced motion** (OS or setting) removes slow motion from the timeline and so from the
  sound; it does not mute anything.
- The volume popover in the transport bar has the four sliders, mute, and captions; the full
  set is in the Settings screen (Phase 9).

---

## 8. Tests

### 8.1 Pure, in Vitest (Node), the default `npm test`

Under `tests/audio/`, mirroring `src/audio/`:
1. **Synthesis primitives** (`synth/*.test.ts`): a band-pass passes its center at 0 dB +-0.5
   and a low-pass is -3 dB at its corner (measured with sine sweeps); modal partials land at
   their ratios (Goertzel energy at each expected frequency over 10x the energy between);
   Karplus-Strong pitch within 2% (autocorrelation); a voice's spectrum peaks near its vowel's
   formants (+-10%); grain counts match the Poisson rate (+-3 sigma); pink noise falls about 3
   dB per octave (+-1 dB over five octave bands); recursive oscillators stay stable over 10 s.
2. **Every recipe** (`recipes.test.ts`), for variants 0 and 1 of every M1 recipe (about 2 s
   of rendering): length within its declared range; every sample finite; peak at -1 dBFS
   +-0.1; RMS above a floor (not silent) and within +-3 dB of its family's target; no DC (mean
   under 0.01); bit-identical when rendered twice; variants 0 and 1 differ; loops seamless (RMS
   of the 10 ms across the seam within 2 dB of its neighborhood and no step larger than the
   largest step elsewhere). `npm run test:audio` renders all 982 variants (about 11 s).
3. **Feature snapshots**: per recipe, variant 0's length, RMS and peak to 0.1 dB, and spectral
   centroid to 5%. A recipe change shows up in review as a snapshot diff.
4. **Coverage** (`profiles.test.ts`): every unit in content has a profile or a listed fallback;
   every weapon resolves to a family by the table, not the regex fallback, or is listed;
   every battle spell has a sound mapping; every terrain has its beds, sprinkles, and IR;
   every color has its templates; every `BattleEvent` kind and every `SoundCue` kind is
   handled (exhaustive switches with a `never` check, plus a runtime list); every recipe id the
   planner can emit exists in the bank. Extends the CLAUDE.md rule: a new unit, spell, or
   chassis is added to these fixtures.
5. **Planner** (`plan.test.ts`), on fixture records (starting armies, 300 vs 300, the round-50
   stalemate, a field-effect battle with test spells, a pretender death): the same plan twice;
   gore Off yields no wet recipe and no gurgle; death cries off yields no cry recipe; every
   must-play is present at every speed; kept(4x) is a subset of kept(2x), a subset of
   kept(1x); every visible death has a fall at 1x; at most one retreat horn per side per round;
   every instance lies inside its cue's window; the din is silent before the first melee and
   rises with attacks on a synthetic log; `needs(record)` contains every recipe the plan uses;
   building the plan for the 300-vs-300 fixture takes under 20 ms.
6. **Allocator** (`allocate.test.ts`): bursts like `demand.ts` never exceed a cap except by
   must-plays; must-plays are never dropped or stolen; the weakest tail is stolen first; merges
   happen within their windows only; dropped energy reaches the din accumulator; ducks combine
   by the deepest.
7. **Scheduler on a fake clock** (`scheduler.test.ts`, with an injected clock and a fake
   engine that records calls): pause stops one-shots and keeps the bed at -10 dB; resume does
   not restart what had started; seek starts exactly the sustained layers active at the new
   time, at their levels; skip plays only the outro set; a speed change re-maps only unscheduled
   instances; late instances follow the 40 ms rule; latency compensation shifts start times.
8. **Mix math** (`mix.test.ts`): the slider curve (0 silent, 50 is -12 dB, 100 is 0 dB), the
   pan clamp and its monotony, row and off-screen attenuation, the damage, weight, and size
   terms at their table points.
9. **Settings** (`tests/ui/settings.test.ts`): a round trip through storage; corrupt JSON and a
   throwing storage give defaults.

### 8.2 Browser, Playwright with Chromium (cheap, `npm run test:e2e`)

10. **Engine render**: a test page builds the real engine on an `OfflineAudioContext(2, 8 s,
    48000)` and plays the first-contact plan of the 300-vs-300 fixture from a pre-baked bank.
    Assertions by ranges, never hashes (Chromium's offline oscillators are not reproducible run
    to run, 2.3): every sample finite; peak at or under 0.99; RMS over 400 ms windows between
    -30 and -10 dBFS; a left-only plan has left energy over 1.5x the right; with the mono option
    left equals right; the ambience stem is at least 4 dB lower inside a burst duck than before
    it; mute renders silence. Skipped when `OfflineAudioContext` is undefined.
11. **Autoplay**: with Chromium's default autoplay policy the context is `suspended` before
    any gesture and `running` after a click.
12. **Replay smoke with sound**: open a fixture replay, play 3 s, switch to 4x, pause, seek,
    skip: no console errors; `window.__fmAudio.stats()` (exposed in test builds) shows instances
    started, peaks within caps, no instance skipped for lack of a buffer after the intro.
13. **Bake timing** (logged, soft limit): the starting-army set bakes in under 6 s on one
    worker in CI's Chromium.

---

## 9. Tooling

- **Audition page** (`src/audio/dev/Audition.tsx`, a dev-only route behind
  `import.meta.env.DEV`, absent from the build): every recipe by family with its variants as
  buttons, waveform and spectrogram (`AnalyserNode`), hot reload of recipe data, export to WAV,
  and a **strike tester**: pick weapon, target material, outcome, damage, sizes, and gore, and
  hear the layered result as the planner would build it.
- **Dev overlay** in the replay (backtick key in dev builds): active instances per class, drops,
  steals, merges, din level per side, ducks in force, buffers missing.
- **Listening checklist** for the playtests (Phase 12): an axe on Briar Guard and a sword on Ash
  Militia sound different with eyes closed; every unit type's death is recognizable; the two
  nations are told apart by ear; 4x stays readable; five battles in a row do not fatigue (no
  sound repeats noticeably, nothing harsh dominates); the 300-vs-300 first contact is loud and
  clear rather than mush; a commander's death stops the room.

---

## 10. Build order and doc changes

Inside Phases 10 and 11 (the spectacle proposal's step 10e expands into these); each step
ends green with `npm run typecheck && npm run lint && npm test`:

1. **S1 Synthesis core** (`synth/`), the recipe schema, 25 core recipes (swings, flesh, armor,
   parry, bows, arrows, a death cry, a fall, a horn, a drum, one bed), the audition page, tests 1
   to 3.
2. **S2 Engine** (context, graph, bank and workers, scheduler, settings, autoplay) with the
   log-only cue generator, so a battle can be heard before the visual timeline exists; tests
   7 to 9 and 10 to 11.
3. **S3 Planner and mixer** on the spectacle timeline's cues: profiles, variants, crowd, ducks,
   speed, pause, seek, skip; tests 4 to 6 and 12.
4. **S4 The full bank**: every family in section 4, the eleven spells, field effects, all seven
   terrains, budgets and bake priorities; test 13.
5. **S5 Listening pass**: the checklist, tuning of `mix.ts` into `docs/09-balance.md`,
   accessibility options; the voice quality gate (risk 1).

Commits per CLAUDE.md, for example `Phase 10: battle sound engine and scheduler`.

Doc changes:
- `docs/10-milestone-1.md`: out of scope becomes "music, map and menu sound"; criterion 14 adds
  "battle replays have procedural sound effects per `docs/11-sound.md`, with volume, mute,
  captions, and calm settings".
- New `docs/11-sound.md`: sections 2.2, 3, 4.1, 4.17, 4.18, 5, 6, and 7 of this proposal, condensed
  (the recipe tables live in code, `src/audio/recipes/`, as content does).
- `docs/06-architecture.md`: `src/audio/` in the layout; the purity guard extended to
  `src/audio/synth`, `recipes`, `plan`, `profiles.ts`, `mix.ts`; the bake worker.
- `docs/07-ui.md`: the replay's sound menu and the captions.
- `docs/09-balance.md`: the mix table and the speed thinning table as tunable numbers.
- `docs/04-battle.md`: A1 to A5 (shared with the spectacle proposal).

---

## 11. Relation to the spectacle proposal

Agreed: procedural sound with no files; Web Audio buses with a compressor and limiter; a
reverb generated per terrain; voice limits with death cries spilling into a crowd layer; no
pitch change with speed; ducking for big moments; slow motion pitched down and filtered; the
ambience living through pause; formant-synthesized voices; horns, drums, bells as effects; no
music.

Refined here:
- **Baking in pure TypeScript workers, not `OfflineAudioContext`**: measured no slower, bit
  reproducible, and testable in Node (2.3).
- **Memory, computed rather than estimated**: the spectacle proposal estimates about 60 recipes
  of 6 variants of 0.6 s at 32 kHz as about 7 MB of floats; that is about 6.9 million floats,
  27.6 MB as `Float32`. This
  proposal's bank is larger (220 recipes, 900 variants) and is baked per battle, 38 to 78 MB
  (4.19), with mono recipes and dual-play widening to keep it there.
- **Caps per class with priority, stealing of tails, merging, and energy accounting**, checked
  by simulation (2.3), instead of a single pool order.
- **Nation and material identity**: per-nation horns, drums, and chants, scale versus bark armor,
  voice flavor halves.
- **Pre-roll**: sounds may start before their picture because the timeline is known.
- **Location**: `src/audio/` (not `src/render/audio/`), with the timeline in a pure shared
  folder; either works.

---

## 12. Risks and open questions

1. **Synthesized voices are the weakest family.** Formant screams can sound robotic. The
   prototype's model has the ingredients that matter (jitter, shimmer, 30 to 150 Hz roughness,
   breath, drive, vowel glides), and voices are short, layered under impacts, and reverberated.
   Gate: if after two tuning passes in S5 the death cries still fail the checklist, add CC0
   recordings through the recipe's `sample` layer for that family only, with provenance in
   `src/audio/samples/LICENSES.md`, or lower the cries 4 dB and let impacts and the din carry
   the brutality. The decision belongs to the owner after listening on the audition page.
2. **Memory** of 38 to 78 MB per battle is fine on desktops; Audio quality Low halves it.
3. **Slow machines**: baking may be twice as slow as measured; with three workers the largest
   battle still bakes in about 5 s, P0 and P1 are ready within the intro, and missing buffers
   are skipped, never waited for.
4. **Browser quirks**: Safari lacks `outputLatency` (fallback to `baseLatency`) and has an
   `interrupted` state (treated as paused); Firefox and Chromium are straightforward. Mobile is
   out of scope (no touch layout in M1).
5. **Honesty without A2**: if A2 is refused, deflections cannot be heard as such; every hit is
   a wound. The planner must not invent armor-holds sounds the log does not support.
6. **Open**: should the map get a quiet bed and UI clicks in M1? Proposed: no (the scope stays
   on battles), but the engine is ready for it.
7. **Open**: should Standard gore include the wet layers at -18 dB as proposed, or should wet
   sounds start only at Brutal? Proposed: as here; the visuals' Standard shows blood.
