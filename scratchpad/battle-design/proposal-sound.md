# Battle replays: sound

Proposal for the sound of the battle replay viewer, written from one angle: what the player
hears, how each sound is made, and how hundreds of them are mixed so that a 300-vs-300 battle
sounds brutal and stays clear. It is meant to be buildable as written. Every number is a
starting value to tune in playtests and record in `docs/09-balance.md`.

**Owner direction (binding).** "The battles should be visceral with detail and sfx since its
not real time that should be fine, take what you need to get this done." Battle sound moves
into M1. Because a battle is resolved instantly and watched afterwards, the whole battle's
sound can be planned before the first frame, every blow can have its own layered sound, and
CPU and memory are spent freely within what a desktop browser handles well.

**Constraints kept.** `src/sim` stays pure and deterministic and imports nothing from audio.
Content stays data. Saves do not grow: nothing about sound is stored in `GameState` or in a
`BattleRecord`. The viewer stays watchable at any battle size and speed. Accessibility:
captions, mono, a calm mode, volume per group, the gore setting shared with the visuals. No
copyrighted assets: every sound is generated in code. Cheap tests for every pure part.

Companion documents: `proposal-spectacle.md` (same folder) designs the visuals, the pacing,
and the timeline this proposal hangs its sounds on. Section 11 lists where the two agree and
where this one refines the spectacle proposal's sound section. The prototype behind the
measurements here is in `sound-proto/` next to this file (pure TypeScript synthesis core,
representative recipes, benchmarks, the bank as data, a voice-demand simulation).

---

## 0. The proposal in twelve decisions

1. **Procedural, baked in pure TypeScript.** Every sound is a recipe (data) rendered by a small
   synthesis library written in plain TypeScript (noise, filters, modal partials,
   Karplus-Strong strings, formant voices, grains, bubbles, stick-slip creaks). Recipes are
   baked into a bank of variants in Web Workers and played through Web Audio. No samples, no
   ZzFX. Measured: the core renders 130 to 150 times faster than real time on one thread
   (voices 60 to 80x), bit-identical on every run, and testable in Node. `OfflineAudioContext` was
   no faster in headless Chromium and rendered a plain oscillator graph differently on 5 of 6
   identical runs (section 2.3).
2. **A bank of 220 recipes and 900 variants for M1** (251 and 982 with the M2 color
   templates): swings, flesh, bone, ten armor materials, shields, parries, bows, arrows by
   ground, cavalry, formant-synthesized voices for humans, wolves, horses, giants, treants,
   salamanders, sprites, swarms, stone and wyrm, crowds, bodies, horns and drums per nation,
   spell beats per color, elements, field effects, and seven terrain beds. Tables in section 4
   carry every recipe's parameters, variant count, and when it is baked.
3. **Bake only what a battle needs**, read from the record (units, weapons, armor, spells
   cast, terrain, events), highest priority first, behind the 3 s intro. Measured budgets: the
   starting-army battle needs 97 recipes, 38 MB, 3.7 s of CPU (1.2 s on three workers); the
   300-vs-300 battle 148 recipes, 58 MB, 5.6 s (1.9 s on three). A session cache keeps them
   for the next replay.
4. **Same replay, same sound.** Every random choice (variant, pitch, level, pan jitter,
   thinning) is drawn from a hash of the battle id and the cue's stable key, never from
   `state.rng`. Variants rotate through a seeded no-repeat bag, so neighbors never repeat.
   Seeking, pausing, and changing speed never change which sound a moment gets.
5. **Sound tells the truth of the log.** A sword that bounces off a Briar Guard rings and
   scrapes; one that cuts squelches; a kill crunches. That needs the log to say how many hits
   did no damage (`blocked`, addition A2 of the spectacle proposal) and how much damage was
   done (`dmg`). Loudness follows damage, weapon weight, and unit size; pitch drops with size.
6. **Every unit sounds like itself.** Each M1 unit and weapon maps to a sound profile:
   weapon family (15 melee, 6 missile), armor material (10), voice (13, and bones for M2),
   footsteps, body fall, and nation flavor. The two nations differ by ear: Cinder Horde scale armor clacks, bark-clad
   Thornwood thocks; harsh barking war cries against a long rising call; a rasping war horn
   against a round hunting horn; deep drums against frame drums.
7. **A mixer built for crowds.** Eleven voice classes with caps (impacts 20, voices 10, ...), a
   priority score, stealing of fading tails, merging of same-sound hits within 25 ms, and
   energy accounting: what the caps drop feeds a crowd layer whose level follows the log's
   attacks per second, so a 300-man melee sounds like 300 men while only about 60 sources
   play. Simulated first contact at 1x: 140 instances per second, uncapped peaks of 33 impacts
   and 28 voices; the caps drop 10% (low priority) and cut 29% of tails short.
8. **Space.** Stereo pan follows each sprite's x (player left), rows farther back are
   quieter and duller, a reverb whose impulse response is generated per terrain (dry plains,
   echoing mountains, dense forest, stone walls for a stormed fort), and a terrain bed of
   wind, birds, frogs, or sand that falls silent at first blood.
9. **Big moments breathe.** Ducking (combined by the deepest, never summed), a dropout under
   featured blows, slow motion that pitches new sounds down and closes a filter, pre-roll
   sounds that start before their picture (a god's death knell swells 0.8 s early) because the
   timeline is known in advance.
10. **Speed changes density, not pitch.** At 0.5x to 4x one-shots keep their pitch; the plan
    thins non-essential layers deterministically (the 4x set is a subset of the 2x set, which
    is a subset of the 1x set), long horns switch to short variants, and the crowd layer
    carries the rest. Pause keeps the terrain bed alive at -10 dB; seek restarts every
    sustained layer at the right level; skip to end plays the outcome stinger and the
    aftermath.
11. **Settings outside the game state**: master, effects, voices, ambience (sliders with a
    squared curve), mute (M), death cries, captions, mono, calm mode, soft highs; persisted
    with the UI preferences. The `AudioContext` is created and resumed on the first user
    gesture (browser autoplay policy); a chip offers "Click to enable sound" if it is still
    suspended.
12. **Tests**: the synthesis core, every recipe (length, peak, level, determinism, distinct
    variants, seamless loops), coverage of every unit, weapon, spell, terrain, and event
    kind, the planner, the voice allocator on a fake clock, and the mix math run in Vitest
    with no browser. One Playwright test renders the real engine in an `OfflineAudioContext`
    and checks levels, panning, ducking, mono, and mute by ranges, never by hashes.

---

## 1. Scope

In: every sound of the battle replay modal (`src/ui/panels/BattleReplay.tsx` and its
renderer), its settings, and the engine that later screens can reuse.

Out (unchanged from `docs/10-milestone-1.md`): music, map and menu sound. Horns, drums,
bells, and stingers are effects, not music. The engine is built so UI clicks or a map bed can
be added later without changes to it.

What the sim must provide. Nothing beyond the log additions the spectacle proposal already
asks for. Sound depends most on:

| Addition (spectacle 2.3) | Why sound needs it | Without it |
|---|---|---|
| A2 `attacks`, `blocked`, `dmg` on `volley` and `melee` | the split between misses (whoosh, parry, shield), deflections (ring and scrape), wounds (flesh), kills (crunch); loudness by damage | every hit sounds like a wound; no armor-holds sound; loudness by weapon only |
| A5 `scene.terrain`, `scene.storm` | the terrain bed, the reverb, arrows into soil, leaves, rock, or mud, falls into mud or leaves, the fort's stone walls | plains for everything |
| A3 `by` on commander damage | the killing blow on a commander gets the striker's weapon sound | a generic heavy blow |
| A1 phase markers | the timeline's phase windows, which the sounds follow | heuristic segmentation |

None of these is sound data; they are facts about the battle that the viewer needs anyway.

---

## 2. How to make the sounds

### 2.1 The options

| | A. Live Web Audio graphs | B. Baked with `OfflineAudioContext` | C. Baked in pure TypeScript (recommended) | D. ZzFX (MIT, about 1 KB) | E. CC0 sample packs |
|---|---|---|---|---|---|
| What it is | build a node graph (oscillators, noise buffers, biquads, gains) for every sound as it plays | build the same graphs offline, render variants to buffers once, play buffers | our own DSP primitives render recipes to `Float32Array`s in a Worker; Web Audio only plays and mixes | a tiny parametric generator: one oscillator shape, ADSR, slide, pitch jump, noise as frequency jitter, bit crush, tremolo, a filter | recorded files (Kenney's packs are CC0; Freesound and OpenGameArt host CC0 among other licenses) |
| Realism of flesh, bone, metal | good | good | good: modal partials, grains, filtered noise | poor: built for arcade blips, lasers, coins; no partials, no layers | best for impacts and foley |
| Voices (screams, war cries) | possible but costly per voice | possible | yes: source-filter formant model with jitter, shimmer, roughness, drive (weakest family, see risks) | no | best if a fitting CC0 set exists; few CC0 battle screams are good and consistent |
| Variety | endless | as many variants as baked | as many as baked, plus layering | endless but samey | fixed recordings; pitch-shifting smears them |
| Determinism | output depends on the browser's nodes | not reproducible run to run in our test (2.3) | bit-identical, any machine running the same JS engine; seeded | `randomness` calls `Math.random`; needs patching | fixed |
| Tests in Node (Vitest) | no Web Audio in Node | no | yes, every recipe | yes after patching | files only |
| CPU at play time | high: many nodes per sound, biquads with automated frequency recompute per sample | low: one buffer source per layer | low: same as B | low | low |
| Memory | low | buffers (section 4.19) | buffers (section 4.19) | low | compressed files decoded to buffers |
| Bundle | code | code | code (about 60 to 90 KB minified for synth, recipes, plan, engine) | 1 KB | megabytes: 150 sounds at 25 KB is about 3.75 MB, most of the 5 MB gzipped budget (acceptance criterion 1) |
| Licensing risk | none | none | none | none (MIT) | per-file provenance needed; a mislabeled Freesound upload is a real risk |
| Fits the project | partly | partly | yes: the same "procedural, replaceable later" stance as the SVG part art | no | as a fallback only |

### 2.2 Recommendation

**C, with Web Audio as the mixer.** Recipes are data; a pure synthesis library renders them
into variants in Workers; the engine plays buffers through buses, panners, a reverb, ducking,
and a limiter. A few continuous layers use live parameters on top of baked loops (the crowd's
level, the filter in fog, the slow-motion filter, playback-rate ramps for Doppler).

Why:
- **It is the only option that is both rich and testable where the project tests everything
  else.** Recipes run in Vitest; a recipe change shows up as a failing feature snapshot.
- **It is deterministic.** Same battle, same sound, on every machine running the same engine.
- **It costs no bundle space and carries no licensing risk.**
- **It is fast enough.** One worker bakes a typical battle's sounds in under 4 s; three
  workers in about 1.2 s, hidden behind the intro.
- **Samples remain possible.** The recipe schema has a `sample` layer, so if playtests judge a
  family (most likely the voices) not good enough after two iterations, a CC0 recording can be
  layered or substituted per recipe, with its provenance recorded in
  `src/audio/samples/LICENSES.md`. None ships in M1 unless that gate is hit.

ZzFX is rejected for battle sounds: its single-voice model cannot make a layered blow, a
ringing parry, or a scream, and it would need patching to be seeded. Its good idea, a sound as
a short parameter record, is what the recipe schema does at a larger scale.

### 2.3 Measurements

All in this container (Node 22, Chromium 141 from Playwright 1.56 in headless mode), on the
prototype in `sound-proto/`.

Pure TypeScript bake (`bench.ts`), one thread, after JIT warm-up, all variants:

| Recipe | Variants | Audio (s) | Bake (ms) | x real time | Deterministic | Variants distinct |
|---|---|---|---|---|---|---|
| `swing.heavy` (pink noise, swept band-pass, swell) | 6 | 2.2 | 21 | 101 | yes | yes |
| `parry.blade` (8 modal partials, click, scrape) | 10 | 7.0 | 35 | 199 | yes | yes |
| `hit.flesh.chop` (thump, smack, squelch, bone grains) | 10 | 2.6 | 40 | 64 | yes | yes |
| `voice.death.scream` (formant voice, 5 formants) | 12 | 11.5 | 151 | 76 | yes | yes |
| `bow.long` (Karplus-Strong, slap, whoosh) | 6 | 2.7 | 4 | 694 | yes | yes |
| `arrow.flyby` (narrow band-pass, Doppler glide) | 8 | 5.7 | 14 | 402 | yes | yes |
| `explosion.fire` (falling low-pass, sub, crackle) | 4 | 16.0 | 99 | 162 | yes | yes |
| `horn.retreat` (brass model) | 2 | 4.4 | 30 | 148 | yes | yes |
| `fire.crackle` loop | 2 | 16.0 | 20 | 792 | yes | yes |
| `chant.warcry` (12 formant voices) | 2 | 9.6 | 110 | 87 | yes | yes |
| **All** | 62 | 77.7 | 525 | **148** | | |

One run; repeated runs vary by about 30% per recipe and gave 134x to 152x overall. The voice model went from 28x to 60 to 80x by computing its controls at block rate (every 32
samples) and using a sine table and a rational tanh; the production code should do the same.
Budgets below assume 100x, and a laptop browser worker may be up to twice as slow.

`OfflineAudioContext` in headless Chromium (`oac-bench.mjs`), one context per variant, as a
bank would render: swing 73x, clang 144x, flesh hit 64x; one 10 s context mixing 120 voices
with automation 24x. **Determinism** (`oac-det.mjs`): four `OscillatorNode`s with or without
gain automation, rendered six times in fresh contexts, gave 5 distinct outputs of 6. Noise
buffers through biquads were identical twice. So browser rendering is not a sound basis for
exact tests, and it is not faster.

Voice demand (`demand.ts`): the busiest phase of the 300-vs-300 fixture, first contact, with
the spectacle proposal's strike budget (90 strikes and about 60 visible deaths in a 4.0 s
window at 1x; 30 strikes in 1.0 s of real time at 4x) and this proposal's cue rules:

| Speed | Instances | Per second | Uncapped peak: impacts / voices / gore / bodies | With caps: dropped / stolen |
|---|---|---|---|---|
| 1x | 560 | 140 | 33 / 28 / 18 / 14 | 59 (1 of priority 50+) / 160 |
| 4x | 165 | 165 | 47 / 9 / 5 / 10 | 26 (none of priority 50+) / 65 |

---

## 3. Architecture

### 3.1 Modules

```
src/audio/
  synth/            PURE: no Web Audio, no DOM, no Math.random, no Date
    rng.ts          mulberry32 streams, hash32 (FNV-1a) for seeds
    noise.ts        white, pink (Kellet), brown, velvet
    filter.ts       RBJ biquads (LP, HP, BP, peak, shelves), one-pole, comb, allpass
    osc.ts          sine table, polyBLEP saw and square, FM pair
    env.ts          a/d, bell, breakpoint curves, block-rate control helpers
    modal.ts        decaying partial banks (recursive oscillators), detuned pairs
    pluck.ts        Karplus-Strong
    grains.ts       Poisson grains: crackle, debris, rattles, rain, droplets
    voice.ts        source-filter voice: glottal pulses, jitter, shimmer, roughness,
                    breath, five formants gliding between vowels, drive; chorus
    bubble.ts       rising-chirp bubbles (van den Doel)
    creak.ts        stick-slip friction (creaks, groans, treants)
    render.ts       render(recipe, variant, sampleRate) -> Float32Array; loop crossfade;
                    normalization
  recipes/          PURE DATA: one file per family (section 4), index.ts registry
    ir.ts           reverb impulse response specs per terrain
  profiles.ts       PURE DATA: unit and weapon sound profiles, fallbacks from content
  mix.ts            PURE DATA: levels, caps, priorities, merges, ducks, thinning, sends
  plan/             PURE
    cues.ts         the SoundCue contract (3.3)
    fromTimeline.ts timeline cues -> SoundCues (adapter to the spectacle timeline)
    fromLog.ts      a log-only cue generator, for building sound before the visuals
    needs.ts        which recipes a record needs, in priority order
    variants.ts     seeded no-repeat bags, nation flavor partitions
    crowd.ts        din and crowd level curves
    plan.ts         planBattleSound(record, cues, settings) -> SoundPlan
    allocate.ts     the voice allocator, a pure step function
  engine/           Web Audio (not pure)
    context.ts      create, unlock on gesture, suspend, resume, visibility
    graph.ts        buses, groups, reverb, ducking nodes, limiter, mono, calm, soft highs
    bank.ts         worker pool, bake queue, session cache (LRU), AudioBuffer creation
    scheduler.ts    lookahead loop over the time map; pause, seek, skip, close
    play.ts         one instance: buffer source, gain, optional filter, panner
    stats.ts        counters for tests and the dev overlay
  worker/bake.worker.ts   receives jobs, calls synth/render, transfers Float32Arrays
  dev/Audition.tsx        dev-only page (section 9)
src/ui/settings/audio.ts           persisted audio settings
src/ui/panels/battle/SoundMenu.tsx volume popover, mute, captions toggle
```

Placement. The spectacle proposal puts the engine under `src/render/audio/`. This proposal
prefers `src/audio/` because sound is not rendering and will later serve the map and menus;
either works. The spectacle timeline should then live in a pure folder both can import
(`src/replay/timeline/`), not under `src/render/`.

Purity guard. `synth/`, `recipes/`, `profiles.ts`, `mix.ts`, and `plan/` get the same ESLint
rules as `src/sim` (no `Math.random`, `Date`, `performance`, `crypto`; no React, Pixi,
Zustand), plus a ban on the Web Audio globals (`AudioContext`, `OfflineAudioContext`,
`AudioBuffer`, `AudioNode`). The source-scan purity test covers them, and they compile in the
no-DOM `tsconfig.sim.json` pass. They may import `src/content` (read-only) and the pure
timeline. Nothing in `src/sim` imports `src/audio`.

### 3.2 Data flow

```
record (roster + log + scene) --needs.ts--> bake queue --workers--> AudioBuffers (cache)
record --spectacle buildTimeline--> timeline cues --fromTimeline--> SoundCues
SoundCues + profiles + mix + settings --planBattleSound--> SoundPlan (instances in story time,
                                                           sustained layers, level curves)
SoundPlan + time map (speed, slow motion, hit-stop) --scheduler--> allocate() --> play()
```

- The plan is computed once when the replay opens, a few milliseconds for the big fixture,
  and again only if a setting that changes cues changes (gore, death cries, detail). Speed is
  not an input: thinning and caps are applied by the scheduler at play time, from the plan's
  deterministic per-instance draws.
- Times in the plan are story seconds, the spectacle timeline's clock. The time map turns
  them into real time.

### 3.3 The cue contract

The planner reads only this union, which the spectacle timeline satisfies through an adapter,
and which `fromLog.ts` can produce directly from a record with simple fixed windows (casts 1 s
each, volleys 1.5 s, melee 3 s with 40 sampled strikes, morale 1 s) so that sound can be built
and heard before the visual timeline exists.

```ts
type Outcome = 'dodge' | 'parry' | 'shield' | 'deflect' | 'wound' | 'kill' | 'proxyKill';
type SoundCue =
  | { kind: 'intro'; t: number; sides: Record<BattleSide, { nation: NationId | null; troops: number; units: UnitTypeId[]; x: number }> }
  | { kind: 'round'; t: number; round: number; moving: { squad: string; unit: UnitTypeId; sprites: number; x: number; mounted: boolean }[] }
  | { kind: 'strike'; key: string; t: number; side: BattleSide; attacker: UnitTypeId; weapon: number;
      target: UnitTypeId; outcome: Outcome; dmg: number; x: number; row: Formation;
      featured: boolean; charge: boolean; onCommander: boolean }
  | { kind: 'volley'; key: string; t: number; side: BattleSide; shooter: UnitTypeId; weapon: number;
      shooters: number; shots: number; x0: number; x1: number; flight: number }
  | { kind: 'projectile'; key: string; tRelease: number; tImpact: number; shooter: UnitTypeId; weapon: number;
      target: UnitTypeId | null; outcome: 'ground' | 'shield' | 'deflect' | 'wound' | 'kill';
      x0: number; x1: number; featured: boolean }
  | { kind: 'death'; key: string; t: number; tGround: number; unit: UnitTypeId; side: BattleSide; x: number;
      row: Formation; proxy: boolean; commander: boolean; pretender: boolean; element: Element;
      style: string; byWeapon: { unit: UnitTypeId; weapon: number } | null }
  | { kind: 'cast'; key: string; caster: UnitTypeId; spellId: string; short: boolean;
      charge: [number, number]; release: number; travel: [number, number, number, number] | null;
      impacts: { t: number; x: number; element: Element; target: UnitTypeId; kills: number }[];
      linger: [number, number, number] | null; x: number }
  | { kind: 'aura'; key: string; t: number; spellId: string; debuff: boolean; ends: boolean; x: number }
  | { kind: 'heal'; key: string; t: number; cause: 'spell' | 'drain' | 'regen'; x: number; amount: number }
  | { kind: 'summon'; key: string; t: number; unit: UnitTypeId; count: number; spellId: string; x: number }
  | { kind: 'morale'; key: string; t: number; side: BattleSide; what: 'shaken' | 'holds' | 'rout' | 'leave'
      | 'lineBreaks' | 'withdraw'; x: number; troops: number; nation: NationId | null }
  | { kind: 'charge'; key: string; t0: number; tImpact: number; side: BattleSide; mount: 'horse' | 'wolf';
      riders: number; x0: number; x1: number }
  | { kind: 'firstContact'; t: number; x: number }
  | { kind: 'meleeLoad'; t0: number; t1: number; side: BattleSide; attacks: number; engaged: number; x: number }
  | { kind: 'commanderDeath'; key: string; t: number; unit: UnitTypeId; side: BattleSide; x: number; pretender: boolean }
  | { kind: 'field'; t: number; effect: FieldEffectKind; on: boolean; color: Color | null }
  | { kind: 'lightning'; t: number; x: number; near: boolean }
  | { kind: 'fatigue'; key: string; t: number; unit: UnitTypeId; exhausted: boolean; drained: boolean; x: number }
  | { kind: 'slowmo'; t0: number; t1: number; strength: number }
  | { kind: 'hitstop'; t: number; dur: number; global: boolean }
  | { kind: 'outro'; t: number; winner: BattleSide; player: BattleSide; withdrawal: boolean; dead: number };
```

`key` is the timeline's stable cue id (for example `r3/melee/a1>d2/17`). It seeds every random
choice for that cue (section 4.18).

---

## 4. The sound bank

### 4.1 Notation

Each recipe is data rendered by `synth/render.ts`. The tables use this shorthand:

| Notation | Meaning |
|---|---|
| `W`, `P`, `B` | white, pink, brown noise |
| `S f`, `SAW f`, `TRI f` | sine, band-limited sawtooth, triangle at f Hz; `a>b` a glide, `a>b/tau` an exponential glide |
| `BP f Qq`, `LP f`, `HP f` | band-pass (constant 0 dB peak), low-pass, high-pass biquads; `a>b>c` a sweep over the layer |
| `M(f0; r/d/a, ...)` | modal bank: partials at ratio r, decay d seconds to -60 dB, amplitude a |
| `KS(f0, t60, bright)` | Karplus-Strong string |
| `G(rate, dur, freq, Q, law)` | Poisson grains of band-passed noise: rate per second (or a ramp), grain length, center frequency range, Q, amplitude power law (higher means many small, few loud: crackle) |
| `V(...)` | formant voice: f0 path (relative multipliers over the length), vowel path (a, o, u, uh, ae, e, i, m), tract length factor (formants divided by it), breath share, jitter, shimmer, vibrato, roughness (amplitude modulation rate and depth; 30 to 150 Hz roughness is what makes a scream a scream), drive (tanh) |
| `BUB(f0, rise, t60)` | a bubble: a sine whose pitch rises over its short life |
| `SS(rate)` | stick-slip friction: impulses at a jittered slip rate through wood resonances |
| `a/d x/y` | attack x s, decay to -60 dB in y s; `bell(p)` a smooth rise to p of the length and fall |
| `AM r Hz depth d` | amplitude modulation |
| `@-n` | this layer n dB below the first layer |
| `[x,y]` | a range drawn once per variant |

Every variant is normalized to a -1 dBFS peak, then placed in the mix by `mix.ts`. All
recipes render mono. Width comes from the mixer: panning, the reverb, and dual-play (two
variants of a loop or crowd sound played at once, panned apart, with different start offsets
and rates 1.00 and 0.97), which also hides loop repetition. Loops are rendered 0.25 s longer
and crossfaded into themselves so they are seamless.

Weapon families used in the "Baked when" column: `light` (knife, dagger), `blade` (sword,
burning blade), `bladeHeavy` (great sword), `axe`, `axeHeavy` (great axe, halberd), `thrust`
(spear), `lance`, `staff`, `bluntHeavy` (oak maul), `bluntHuge` (club, crushing limbs,
burning fists), `claw`, `bite`, `sting`, `unarmed`, and the missiles `bowShort`, `bowLong`,
`bowFire`, `javelin`, `breathFire`, `breathGust`. A future mace or hammer is `blunt` (the
`staff` swing and `hit.blunt`, heavier variants by weight). Section 4.17 maps every M1 weapon.

### 4.2 Swings and attack motions

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `swing.light` | swing | 32 | 0.16 | 8 | weapon light | W > BP 900>[2800,3400]>1400 Q2, bell(0.4) + edge whistle W > BP [3800,5200] Q14 @-14; len [0.13,0.19] |
| `swing.blade` | swing | 32 | 0.22 | 8 | weapon blade | P > BP [500,650]>[2000,2600]>800 Q1.6, bell(0.45) + whistle W > BP [2600,3600] Q12 @-12; len [0.19,0.25] |
| `swing.blade.heavy` | swing | 32 | 0.34 | 6 | weapon bladeHeavy | P > BP 350>1600>500 Q1.3, bell(0.5) + S 90 swell @-14 + whistle BP 2200 Q10 @-16; len [0.30,0.38] |
| `swing.axe` | swing | 32 | 0.28 | 8 | weapon axe | P > BP [300,380]>[1200,1500]>450 Q1.2, bell(0.5) + head whirr W > BP [700,900] Q6, AM [14,20] Hz depth 0.6 @-10; len [0.25,0.31] |
| `swing.axe.heavy` | swing | 32 | 0.4 | 6 | weapon axeHeavy | (B+P) > BP 220>1000>300 Q1, bell(0.55) + head whirr BP 550 Q5, AM [9,12] Hz @-9 + S 70 swell @-12; len [0.36,0.44] |
| `swing.blunt` | swing | 32 | 0.3 | 6 | weapon staff | P > BP 250>900>350 Q1.1, bell(0.5) + wood rattle G(60/s, 2-5 ms, 600-1400 Hz, Q4) @-20; len [0.26,0.33] |
| `swing.blunt.heavy` | swing | 32 | 0.45 | 6 | weapon bluntHeavy | B > LP 300>1100>350, bell(0.55) + S 60 swell @-8; len [0.40,0.50] |
| `swing.huge` | swing | 32 | 0.6 | 4 | weapon bluntHuge | B > LP 160>650>200, bell(0.6) + S [38,48] swell @-4 (air pushed) + debris G(30/s, 3-8 ms, 300-900 Hz) @-24; len [0.5,0.7] |
| `thrust` | swing | 32 | 0.13 | 8 | weapon thrust | W > BP 1000>[2600,3000] Q2.4, a/d 0.02/0.10 + cloth flap P > BP 400 Q1 a/d 0.005/0.05 @-12; len [0.11,0.15] |
| `thrust.heavy` | swing | 32 | 0.2 | 6 | weapon lance | P > BP 600>1800 Q1.6, a/d 0.04/0.16 + shaft rattle G(80/s, 2-4 ms, 800-1600 Hz, Q5) @-18; len [0.18,0.22] |
| `swipe.claw` | swing | 32 | 0.22 | 6 | weapon claw | three strokes at 0, [0.05,0.07], [0.10,0.14] s: W > BP [1500,2200]>[3500,4500] Q2.5, bell(0.3) over 0.06 s, + fur P > LP 1200 @-12 |
| `snap.jaws` | swing | 32 | 0.2 | 8 | weapon bite | growl onset V(f0 [70,100], u>a, rough 30 Hz 0.6, 80 ms) @-6, then at [0.07,0.10] s two teeth clicks (W > HP 2500, 3 ms, 8 ms apart) + M([1800,2400]; 1/0.02/1, 1.7/0.015/0.5) |
| `dart.sting` | swing | 32 | 0.12 | 6 | weapon sting | SAW [220,260]>[420,520] > LP 1800, AM 120 Hz (wings) depth 0.4, a/d 0.01/0.08 + end click W > HP 4000, 2 ms |
| `whoosh.flame` | swing | 32 | 0.3 | 6 | element fire | P > LP 600>2400>900, bell(0.4) + crackle G(150/s, 0.3-1.5 ms, 1.5-6 kHz, law 2.5) @-10 + hiss W > HP 3000 @-22; len [0.26,0.34]; layered @-8 on burning weapons |
| `swing.punch` | swing | 32 | 0.12 | 4 | weapon unarmed | P > BP 400>1200 Q1, a/d 0.01/0.08 + cloth P > BP 1500 @-14 |

### 4.3 Flesh impacts and kill layers

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `hit.cut` | impact | 32 | 0.18 | 10 | always | slice W > HP [3500,4500]>[1800,2400], a/d 0.001/0.05 @-4 + thump S [130,160]>[70,85]/0.03, d 0.07 @-6 + squelch W > BP [1300,1700]>[500,700] over [0.06,0.09] s Q3.5, AM [35,55] Hz 0.4 @-3; len [0.15,0.20] |
| `hit.chop` | impact | 32 | 0.24 | 10 | always | thump S [100,140]>[55,70]/0.03, d 0.09 + smack B > LP [900,1400], d 0.07 @-2 + bite M([600,850]; 1/0.03/1, 2.1/0.02/0.4) @-8 + squelch BP [1300,1700]>[350,550] Q3.5 over [0.07,0.12] s, AM 45 Hz @-3 + crunch G(160/s over 5-80 ms, 1-4 ms, 1.5-3.8 kHz, Q2, law 1.5) @-6; len [0.22,0.26] |
| `hit.blunt` | impact | 32 | 0.24 | 10 | always | thump S [80,110]>[45,55]/0.04, d 0.12 + smack B > LP [600,900], d 0.09 @-1 + crunch G(220/s over 60 ms) @-4 + body W > BP 250 Q2, d 0.08 @-8 + soft squelch BP 900>400 @-9; len [0.22,0.27] |
| `hit.pierce` | impact | 32 | 0.15 | 10 | always | thuk B > LP [1100,1500], a/d 0.0005/0.03 + S [150,190]>[90,110]/0.02, d 0.04 @-4 + puncture W > BP [1800,2200]>[700,900] Q4 over 0.05 s @-6; len [0.13,0.17] |
| `hit.tear` | impact | 32 | 0.22 | 8 | weapon bite, weapon claw | rip W > BP [1600,2400] Q2 gated by a pulse train [90,180] Hz duty 0.4 over [0.08,0.12] s, decaying + squelch @-4 + thump S 120>70 @-8; len [0.20,0.24] |
| `hit.burn` | impact | 32 | 0.35 | 6 | element fire | sizzle W > HP [2500,3500], random AM 50-120 Hz, a/d 0.005/0.3 @-4 + thump S 120>70 @-6 + fwump P > LP 1500>400, d 0.12 @-3 + crackle G(200>20/s, law 2.5) @-6; len [0.30,0.40] |
| `hit.sting` | impact | 32 | 0.1 | 4 | weapon sting | W > BP 2500 Q3, d 0.02 + S 300>200, d 0.03 @-6 + venom hiss W > HP 4000, d 0.06 @-14 |
| `kill.crunch` | impact | 32 | 0.2 | 8 | always | one crack (1 ms impulse > BP [1800,2600] Q3, d 0.03) + 18-30 bone grains over [0.05,0.10] s (1-4 ms, 1.2-4.5 kHz, law 1.3), decaying + thump S [70,90], d 0.12 @-4; len [0.18,0.22] |
| `kill.thud.heavy` | impact | 24 | 0.3 | 6 | always | S [55,70]>[35,40]/0.06, d 0.25 + B > LP 500, d 0.18 @-2 + crunch grains @-8; len [0.28,0.32]; heavy and huge killing blows |
| `gore.squelch` | gore | 32 | 0.2 | 8 | gore Standard+ | W > BP [700,1100] Q2.5, a/d 0.002/0.08 + 3-5 bubbles BUB([250,600], rise x1.6, t60 [0.02,0.06]) + smear P > LP 900 @-8; len [0.18,0.22] |
| `gore.spatter` | gore | 32 | 0.4 | 8 | gore Standard+ | gush W > BP 900>500 Q1.5, d 0.12 + 6-14 droplets (W > BP [1200,3200] Q2, 4-12 ms) over [0.05,0.35] s, falling + 2-4 bubbles @-6; len [0.36,0.44] |
| `gore.tear` | gore | 32 | 0.45 | 6 | gore Brutal | W gated by a pulse train 60>180 Hz > BP 600>2400 Q2 over 0.2 s + tendon snap KS([180,260], t60 0.04, bright 0.9) at [0.15,0.25] s + bone crack @-4 + gush @-6; len [0.40,0.50] |
| `gore.gurgle` | gore | 24 | 0.8 | 6 | gore Standard+ | V(f0 [70,95], uh>o, breath 0.7, rough 12 Hz 0.7) + 6-10 bubbles BUB([180,400]) spread over the length > LP 1500; len [0.7,0.9]; tail after a death cry |

### 4.4 Armor, shields, parries

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `arm.plate` | impact | 32 | 0.45 | 8 | armor plate | M([320,560]; 1/0.30/1, 1.59/0.22/0.8, 2.14/0.16/0.6, 2.92/0.11/0.45, 3.5/0.08/0.3, 4.2/0.06/0.2) with pairs detuned 0.4% (beating) + click W > HP 4000, 3 ms @-4 + body thud S 140>90, d 0.05 @-10; 2 of 8 variants are helmet bongs: f0 [600,800], decays x1.4 |
| `arm.mail` | impact | 32 | 0.25 | 8 | armor mail | 14-26 link pings over [0.06,0.12] s, each M([3000,8500]; 1/[0.01,0.03]/1, 2.4/0.008/0.4), decaying + thud B > LP 700, d 0.05 @-6 + click W > HP 3000, 2 ms @-8; len [0.22,0.28] |
| `arm.scale` | impact | 32 | 0.28 | 8 | armor scale | 8-14 plate clacks over 0.08 s, M([1500,4000]; 1/[0.015,0.04]/1, 2.2/0.01/0.4) + one plate partial set M([700,950]; arm.plate ratios, decays x0.4) @-8 + thud @-6; len [0.25,0.30]; Cinder Horde armor |
| `arm.soft` | impact | 32 | 0.12 | 6 | always | thwap B > LP [800,1200], a/d 0.001/0.04 + S [120,150]>80, d 0.06 @-3 + leather creak SS([180,260] Hz, 40 ms) @-18; len 0.12 |
| `arm.bark` | impact | 32 | 0.28 | 8 | armor bark | tok M([260,420]; 1/0.06/1, 2.6/0.035/0.5, 4.1/0.02/0.3) + W > BP [900,1300] Q5, d 0.03 @-4 + splinters G(90/s over 80 ms, 1-3 ms, 1.5-4 kHz, Q2) @-10 + creak SS @-18; len [0.25,0.31]; Thornwood armor |
| `arm.wood` | impact | 32 | 0.45 | 6 | armor wood | bole M([140,220]; 1/0.12/1, 2.3/0.07/0.6, 3.9/0.04/0.35) + thump S 90>60, d 0.12 @-3 + splinters @-8 + creak SS([70,120] Hz, 0.25 s) @-10; len [0.40,0.50]; Oakheart, Treant |
| `arm.hide` | impact | 32 | 0.14 | 6 | armor hide | B > LP 600, d 0.05 + S 110>70, d 0.07 @-2 + fur rustle P > HP 2000, d 0.06 @-14 |
| `arm.stone` | impact | 32 | 0.5 | 6 | armor stone | clack M([900,1500]; 1/0.05/1, 1.9/0.04/0.6, 3.1/0.025/0.4) + grit G(300/s over 0.15 s, 0.5-2 ms, 2-7 kHz) @-6 + debris trickle G(40/s over 0.4 s, 2-6 ms, 0.8-3 kHz) @-14 + S 180, d 0.15 @-8; len [0.45,0.55] |
| `arm.ember` | impact | 32 | 0.4 | 6 | armor ember | molten slap B > LP 400, d 0.06 + sizzle W > HP 3000, random AM 80 Hz, d 0.3 @-2 + thump S 110>70 @-4 + ember pops G(40/s, 0.5-2 ms, 1-4 kHz, law 2) @-8; len [0.35,0.45] |
| `arm.tick` | impact | 32 | 0.06 | 4 | armor none | W > BP [2500,4000] Q3, d 0.015 + S 400, d 0.02 @-8; insects, sprites |
| `glance.scrape` | impact | 32 | 0.3 | 6 | always | W through three BP Q25 at a plate f0 [400,700] x (2.92, 4.2, 5.4), AM by 40 Hz smoothed noise, over [0.15,0.30] s, falling; layered on metal deflections |
| `glance.ping` | impact | 32 | 0.35 | 6 | always | ricochet: one partial [1800,3200] Hz, t60 [0.20,0.35], gliding -1.5% + a second at x2.76 @-8 |
| `shield.wood` | impact | 32 | 0.3 | 8 | shielded units | hollow thunk M([150,230]; 1/0.08/1, 1.8/0.06/0.6, 3.1/0.04/0.4) + plank slap W > BP [650,850] Q6, d 0.03, through a comb (delay [3,5] ms, feedback 0.5) @-3 + rim rattle G(60/s over 50 ms, 2-5 ms, 1-2.5 kHz) @-12 + thud S 90, d 0.08 @-6; len [0.27,0.33] |
| `shield.boss` | impact | 32 | 0.35 | 4 | shielded units | metal boss M([700,1100]; 1/0.12/1, 2.3/0.08/0.6, 3.9/0.05/0.4) + click; layered @-4 on 30% of shield blocks |
| `parry.blade` | impact | 32 | 0.7 | 10 | always | M([700,1300]; 1/0.6/1, 2.756/0.4/0.7, 5.404/0.22/0.45, 8.933/0.12/0.25) twice, the second detuned +0.6% @-3 (shimmer) + click W > HP 4000, 4 ms + scrape W > BP [3000,4500] Q4, jittered AM, over [0.06,0.15] s @-8; len [0.6,0.75] |
| `parry.haft` | impact | 32 | 0.25 | 6 | always | clack M([500,800]; 1/0.04/1, 2.7/0.025/0.5) + W > BP 1500 Q4, d 0.02 + rattle @-12; spear, halberd, staff parries |

### 4.5 Missiles

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `bow.short` | missile | 32 | 0.35 | 6 | weapon bowShort | KS([110,170], t60 [0.08,0.12], bright 0.55) + bracer slap W > BP 2500 Q3, 5 ms @-4 + limb whoosh W > BP 600 Q1.5, bell over 0.06 s @-8 + nock scrape W > HP 5000, 10 ms @-16; len [0.32,0.38] |
| `bow.long` | missile | 32 | 0.45 | 6 | weapon bowLong | KS([70,110], t60 [0.10,0.14], bright 0.6) + slap @-3 + whoosh BP 450 @-6 + stave creak SS(120 Hz, 30 ms) @-16; len [0.42,0.48] |
| `bow.ignite` | missile | 32 | 0.6 | 4 | weapon bowFire | fwoosh P > LP 400>2000, a/d 0.03/0.3 + crackle G(120>30/s) @-6 + pitch sizzle W > HP 3000 @-14; layered on fire-arrow releases |
| `throw.javelin` | missile | 32 | 0.35 | 6 | weapon javelin | P > BP 400>1100 Q1.4, bell(0.4) over 0.3 s + shaft wobble AM [8,12] Hz @-6; a vox.effort layer is added at play time |
| `arrow.flyby` | missile | 32 | 0.7 | 8 | any volley | W > BP [2600,4200] Q11, center x1.06>x0.94 (logistic around the pass at [0.4,0.6] of the length: Doppler), bell(pass) + fletching flutter AM [70,110] Hz depth 0.2; len [0.55,0.80] |
| `arrow.flyby.fire` | missile | 32 | 0.75 | 4 | weapon bowFire | arrow.flyby + crackle G(80/s) @-6 + roar P > LP 900, bell @-8; len [0.60,0.85] |
| `javelin.flyby` | missile | 32 | 0.6 | 4 | weapon javelin | P > BP 500>900>600 Q2, spin AM [6,10] Hz depth 0.5, bell; len [0.5,0.7] |
| `volley.cloud` | missile | 32 | 1.4 | 4 | any volley | 20-30 whistles (W > BP [2200,4800] Q9, pass times spread over the first 0.9 s, Doppler 6-14%, gains +-6 dB) + mass hiss P > BP 2500 Q0.8, bell(0.5) @-10; played as two variants panned apart |
| `arrow.flesh` | impact | 32 | 0.12 | 8 | any volley | thwack B > LP 1600, a/d 0.0005/0.025 + S [150,180]>100, d 0.04 @-4 + shaft quiver S [180,260], AM [22,30] Hz, d 0.12 @-16 + wet W > BP 1800>800, d 0.04 @-8 |
| `arrow.shield` | impact | 32 | 0.35 | 6 | any volley | thock M([180,240]; 1/0.07/1, 2/0.05/0.5) + W > BP 900 Q5, d 0.02 @-2 + shaft boing S [200,320], AM [18,26] Hz, a/d 0.005/0.25 @-8; len [0.32,0.38] |
| `arrow.armor` | impact | 32 | 0.2 | 8 | any volley | tink M([3000,4500]; 1/0.04/1, 1.9/0.02/0.5) + W > HP 5000, 2 ms; 3 of 8 variants add a ricochet whistle BP 3500 Q8 gliding down 20% over 0.12 s @-10; len [0.15,0.25] |
| `arrow.wood` | impact | 32 | 0.18 | 6 | any volley | M([400,650]; 1/0.03/1) + snap W > BP 2200 Q2, d 0.01 + splinters G @-10; arrows into bark or wood |
| `arrow.ground.soil` | impact | 24 | 0.12 | 6 | plains, farmland, hills | thup B > LP [500,800], d 0.03 + S [90,110], d 0.04 @-3 + soil G(150/s over 50 ms, 1-3 ms, 0.3-1.2 kHz) @-10 |
| `arrow.ground.leaf` | impact | 32 | 0.14 | 4 | forest | thup @-3 + leaf crunch G(250/s over 80 ms, 1-4 ms, 1.5-6 kHz, law 1.2) |
| `arrow.ground.rock` | impact | 32 | 0.22 | 6 | mountains, wasteland, fort stormed | clack M([1200,2200]; 1/0.03/1, 2.3/0.02/0.5) + skitter: 2-4 smaller pings over 0.15 s, intervals x0.65, levels x0.6 + grit @-10; len [0.18,0.26] |
| `arrow.ground.mud` | impact | 32 | 0.25 | 6 | swamp | plop B > LP 400, d 0.05 + 3-6 bubbles BUB([300,900], t60 0.03-0.08) over 0.15 s + splash W > BP 1100 Q2, d 0.06 @-4; len [0.22,0.28] |
| `breath.fire` | missile | 32 | 1.2 | 4 | weapon breathFire | inhale W > BP 800>2000 Q1 over 0.15 s @-10; jet (P+B) > LP [1000,1500], flutter AM [6,9] Hz depth 0.4, a 0.08, release 0.4 + rumble S [45,60] + B > LP 150 @-4 + crackle G(180/s, law 2.5) @-6; len [1.1,1.3] |
| `breath.gust` | missile | 32 | 1.2 | 3 | weapon breathGust | roaring blast P > BP 300>900>400 Q0.8, bell(0.3) + debris G(80/s, 3-10 ms, 0.5-3 kHz) @-8 + S 40 @-6; the Great Wyrm |
| `draw.blade` | swing | 32 | 0.35 | 4 | always | shing W > BP 3000>5500 Q6 over [0.15,0.25] s + ring M([1200,1800]; parry.blade ratios) at the end @-6; intro, and archers drawing knives when out of ammunition |

### 4.6 Movement and cavalry

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `step.march.soft` | loop | 24 | 2 | 2 | always | loop: 10 marchers at [1.7,2.0] steps/s, +-40 ms jitter; each step S [80,100], d 0.03 + B > LP 600, d 0.02 @-4 + soil G @-14; gear rustle P > HP 1500, random swells @-16 |
| `step.march.armored` | loop | 24 | 2 | 2 | always | loop: step.march.soft + 3-6 mail pings per step (4-8 kHz) @-8 + scale clacks @-12 |
| `step.giant` | body | 24 | 0.7 | 6 | size 4+ unit | S [38,48]>[26,30]/0.12, d 0.35 + B > LP 200, d 0.4 @-3 + debris G(60/s over 0.4 s, 2-8 ms, 0.4-2.5 kHz) @-12 + heel thud B > LP 900, d 0.05 @-6; len [0.6,0.8] |
| `hoof.gallop` | loop | 24 | 1.6 | 3 | horse mounts | loop, one horse, four-beat gallop: stride [0.36,0.42] s, beats at 0, 0.06, 0.15, 0.21 (accents 1, 0.7, 0.9, 0.6); each hoof S [70,85], d 0.03 + click W > BP [1800,2600] Q3, 2 ms @-6 + dirt @-12; tack jingle per stride @-14 |
| `charge.rumble` | loop | 24 | 4 | 2 | horse mounts, wolf mounts | loop: B > LP [140,180] with three AM layers at stride rates [2.4,2.8] Hz, random phases, depth 0.5 + thump cloud G(40/s, S-based) @-4 + dust P > BP 300 @-12 |
| `paws.run` | loop | 24 | 1.2 | 3 | wolf mounts, voice wolf | loop: stride [0.28,0.32] s, four soft paws (B > LP 900, d 0.015 + S 120, d 0.015 @-6) + claw clicks W > HP 3000, 1 ms @-12 + panting (breath-only V, a>uh, 3 Hz) @-10 |
| `charge.crash` | impact | 32 | 1.4 | 4 | a charge | 6 body thumps (S 60-100) within 0.25 s + 4 plate hits M(random f0) + 2 lance cracks + B > LP 400, a/d 0.002/0.5 + dust tail G(100>0/s over 1 s); the horse cries are separate layers |
| `lance.break` | impact | 32 | 0.4 | 6 | weapon lance | crack 1 ms impulse > BP [900,1400] Q3, d 0.03 + M([300,500]; 1/0.05/1, 2.4/0.03/0.5) @-6 + splinters G(400/s over 0.12 s, 0.5-3 ms, 2-6 kHz, law 1.5) @-3 + shaft clatter G(30/s over 0.3 s, wood pings 0.6-1.2 kHz) @-12 |
| `wings.flap` | loop | 24 | 0.5 | 4 | flyers | whoomp P > LP 250>600>200, bell(0.3) over 0.25 s, twice + feather rustle P > HP 2000 @-14 |
| `wings.huge` | loop | 24 | 1 | 3 | voice wyrm | B > LP 120>400>100, bell(0.35) over 0.9 s + S 30 @-6 + membrane P > BP 500 Q2, AM 12 Hz @-8 |
| `buzz.swarm` | loop | 32 | 3 | 2 | voice swarm | loop: 8 SAW at [150,200] Hz +-8%, each with its own 0.5-2 Hz wobble of +-5% > LP 1600, AM at [110,140] Hz (wingbeat) depth 0.3 |
| `crackle.sprite` | loop | 32 | 2 | 2 | voice sprite | loop: crackle G(60/s, law 2.5) + hiss W > HP 4000 @-18 + flutter P > LP 600, AM 4 Hz @-10 |
| `horse.whinny` | voice | 32 | 1.2 | 6 | horse mounts | V(f0 [600,800]>[900,1100]>[350,450], warble [18,26] Hz depth 6%, F1 700 F2 1500 F3 2600, tract 0.8, breath 0.25, drive 2.5) + closing snort W > BP 600 Q1, d 0.15; len [1.0,1.4] |
| `horse.snort` | voice | 32 | 0.5 | 4 | horse mounts | W > BP [500,700] Q1.2, flutter AM 30 Hz, d 0.3 + lip flap |

### 4.7 Human voices

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `vox.effort` | voice | 24 | 0.18 | 12 | voice human | V(f0 [110,160]>x0.85 over 0.15 s, ae>uh (harsh) or o>uh (breathy), 25% closed m, glottal onset a 0.008, breath 0.25, drive [2,4], rough [30,60] Hz 0.2); len [0.14,0.22] |
| `vox.pain` | voice | 24 | 0.28 | 12 | voice human | V(f0 [140,220]: x1.15 at 0.2, x0.7 at end; a>uh or ae>o; breath 0.2>0.5; rough [40,70] Hz 0.35; drive 3); len [0.22,0.34] |
| `vox.death.scream` | voice | 24 | 0.95 | 12 | voice human | V(f0 [150,260]: x1.35 at 0.15, x0.9 at 0.6, x0.55 at end; vowels ae>a>o, a>a>uh or e>a>o; breath 0.1>0.15>0.6; rough [40,80] Hz [0.2,0.5]; jitter 2%, shimmer 8%; vibrato [5,7] Hz 2.5%; drive [2,4]); len [0.7,1.1] |
| `vox.death.groan` | voice | 24 | 1.2 | 8 | voice human | V(f0 [90,130]: x1.1 then x0.6; o>u>m; breath 0.3>0.8; rough 25 Hz 0.3; drive 1.5); len [1.0,1.4] |
| `vox.death.short` | voice | 24 | 0.45 | 10 | voice human | V(f0 [160,240] x1.2, cut by a glottal catch (15 ms) at [0.25,0.40] s) + exhale W > BP 1200 Q0.7 tail 0.1 s; used at 2x and above and for crowded moments |
| `vox.death.commander` | voice | 24 | 1.8 | 6 | always | V(f0 [85,120]: x1.25 then x0.5 over [1.5,2.0] s; a>o>u; breath to 0.8 at the end (last breath); rough 30 Hz 0.3; drive 2.5; tract [1.05,1.15]) |
| `vox.panic` | voice | 24 | 0.6 | 10 | voice human | 2-3 bursts V(f0 [280,420], 0.15-0.25 s, gaps 0.06-0.10 s, a or ae, rough [60,100] Hz 0.4, breath 0.3, drive 3.5); len [0.5,0.7] |
| `vox.shout` | voice | 24 | 0.8 | 8 | always | V(f0 [110,150]: x1.3 then x1.1; a held > uh; drive 3.5; rough 50 Hz 0.25); a commander advancing, a squad holding |
| `vox.roar.berserk` | voice | 24 | 1 | 6 | voice berserk | V(f0 [90,120] with a 30% subharmonic at f0/2 (period doubling); a>o; drive 6; rough [35,45] Hz 0.6; breath 0.25); len [0.8,1.2] |
| `vox.breath.exhausted` | loop | 24 | 2 | 2 | a caster exhausted | loop: breath-only V (a>uh) in inhale and exhale pairs at 1.4 Hz; a caster at fatigue 100 |

### 4.8 Beasts and monsters

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `wolf.growl` | voice | 24 | 0.6 | 6 | voice wolf | V(f0 [60,90], u>o, rough [25,35] Hz 0.7, breath 0.4, drive 3, tract 0.7); len [0.5,0.7] |
| `wolf.yelp` | voice | 24 | 0.3 | 6 | voice wolf | V(f0 [700,1100]>[400,600] over 0.15 s, i>a, tract 0.6, breath 0.2); len [0.25,0.35] |
| `wolf.death` | voice | 24 | 0.9 | 6 | voice wolf | a yelp, then 2-3 falling whines V(f0 [500,800]>x0.6, breath rising); len [0.8,1.0] |
| `wolf.howl` | voice | 24 | 1.8 | 4 | voice wolf | V(f0 [380,450]>[560,650] over 0.4 s, hold with vibrato 5 Hz 2%, fall to [300,380]; u>o>u; tract 0.65; breath 0.15); len [1.6,2.0] |
| `giant.bellow` | voice | 24 | 1.6 | 4 | voice giant | V(f0 [55,75] x1.2 then x0.8, a>o, tract [1.5,1.7], drive 4, rough 30 Hz 0.4) + chest S f0/2 @-8; len [1.4,1.8]; the Titan plays it at rate 0.9 |
| `giant.death` | voice | 24 | 2.2 | 3 | voice giant | V(f0 [60,70] rising x1.3, then a long fall to x0.4; breath to 0.9) + gore.gurgle-like tail @-8; len [2.0,2.4] |
| `salamander.hiss` | voice | 32 | 0.8 | 4 | voice salamander | W > BP [2500,4000] Q1.5, swell a/d 0.1/0.5 + sizzle + throat rattle W > BP 600, AM 40 Hz @-8; len [0.7,0.9] |
| `salamander.shriek` | voice | 32 | 1.4 | 3 | voice salamander | FM carrier [800,1100]>[300,400], ratio 1.5, index 2>6 + hiss @-4 > drive 3; len [1.2,1.6] |
| `treant.groan` | voice | 24 | 1.2 | 4 | voice treant | SS(slip rate [30,50]>[70,110]>[40,60] Hz, jitter 15%) > BP [400,900] Q5 + BP 1600 Q8 @-8 + wood M([70,110]) excited by each slip @-6; len [1.0,1.4] |
| `treant.death` | voice | 32 | 2.6 | 2 | voice treant | creak with rising tension SS(30>140 Hz) for 1.2 s, then the split (impulse burst > BP 600-2000 + splinters G(600/s over 0.3 s)) at [1.2,1.5] s, then the crash S 35, d 0.8 + B > LP 300, d 1.0 + debris; len [2.4,2.8] |
| `sprite.pop` | voice | 32 | 0.5 | 6 | voice sprite | pop W > BP 1500 Q1, a/d 0.001/0.02 + fwump P > LP 1200>300, d 0.15 @-3 + fizzle W > HP 3000, random AM, d 0.35 @-6 + sparks G(150>0/s) @-8 |
| `swarm.die` | voice | 32 | 0.6 | 4 | voice swarm | 6 SAW buzz falling x1>x0.4 over 0.5 s, AM rate slowing, LP 1600>400 |
| `stone.grind` | voice | 32 | 1.2 | 3 | voice stone | B > BP 250 Q1.5, random AM 18 Hz + grit G(400/s, 0.5-2 ms, 1-5 kHz) @-6 + S 50 @-10; the Living Monolith acting or struck hard |
| `stone.shatter` | voice | 32 | 2 | 2 | voice stone | crack M([700,1100]; arm.stone ratios) + burst G(1000/s over 0.2 s, then 80/s falling over 1.8 s) + rumble B > LP 200, d 1.2 @-4 + S 40, d 1.0 @-6 |
| `wyrm.roar` | voice | 24 | 2 | 3 | voice wyrm | V(f0 [40,55] with subharmonics, a>o>u, tract 2.0, drive 6, rough 25 Hz 0.6) + breath gust P > BP 300>700 @-6; len [1.8,2.2] |
| `wyrm.death` | voice | 24 | 3 | 2 | voice wyrm | wyrm.roar rising to a choke (breath 0.9, rough 15 Hz 0.8), fading; fall.huge is layered at play time; len [2.8,3.2] |
| `spirit.howl` | voice | 32 | 1.2 | 3 | voice spirit | P > BP Q12 riding [300,500]>[700,900]>[350,450], vibrato 4 Hz + a second BP at x1.5 @-6; breath-only, ghostly |
| `colossus.roar` | voice | 24 | 1.8 | 2 | voice colossus | giant.bellow at tract 1.9 + fire roar P > LP 800, AM 6 Hz @-4 + crackle @-8 |
| `colossus.death` | voice | 32 | 2.5 | 2 | voice colossus | roar > crumble: debris G + sizzle + chunks M(stone, low) + thump S 40; len [2.3,2.7] |

### 4.9 Crowds and din

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `chant.cinder` | crowd | 32 | 2.4 | 2 | nation cinder | 12 voices bark three times (0, 0.7, 1.4 s, +-60 ms per voice): V(f0 [90,150] x1.25>x0.8, ae>a>uh, drive 3, rough 60 Hz 0.25) + weapons beaten on shields after each bark M([160,220]; 1/0.12/1, 2.3/0.08/0.5, 3.6/0.05/0.3) |
| `chant.thorn` | crowd | 32 | 2.4 | 2 | nation thorn | 12 voices, one long rising "ohh-HAA": V(f0 [100,140] x0.9>x1.3 at 0.75 s, o>o>a, breath 0.2, drive 1.5) + spear shafts clacked twice (wood pings 500-900 Hz) |
| `chant.indep` | crowd | 32 | 2 | 2 | nation indep | 10 voices, hurrah: V(f0 [100,150], u>a, drive 2) |
| `crowd.cheer` | crowd | 32 | 3 | 2 | always | 16 voices, random onsets over 2.5 s, short exclamations V(f0 [140,260], a, e or o) + weapon clatter G(metal pings) @-10 |
| `crowd.gasp` | crowd | 32 | 1.4 | 2 | always | 12 voices "ohh" V(f0 [120,180] x1.1>x0.7 over 1.0 s, o>u, breath 0.4), staggered 0-0.15 s; a side watching its commander fall |
| `crowd.panic` | crowd | 32 | 3 | 2 | always | 10 voices of vox.panic bursts over 2.5 s + 6 runners (6 steps/s, jittered) + dropped gear pings, all through LP 8000>3000 (running away) |
| `crowd.murmur` | crowd | 24 | 1 | 4 | always | 8 voices muttering V(f0 [100,140], m and uh syllables 0.10-0.25 s, breath 0.3), low; a shaken squad |
| `crowd.wounded` | loop | 24 | 8 | 1 | gore Standard+ | loop: 6 sparse slow groaning voices + coughs (W > BP 800 bursts) + distant cries > LP 1200; the aftermath |
| `din.clash.small` | loop | 16 | 8 | 1 | always | loop: 40-80 mini impacts in 8 s (metal pings M 0.6-3 kHz, wood clacks, thumps), random levels; a skirmish |
| `din.clash.mass.a` | loop | 16 | 8 | 1 | 120+ troops engaged | loop: 400-600 mini impacts in 8 s, compressed + body rumble B > LP 200, random AM @-8 |
| `din.clash.mass.b` | loop | 16 | 11 | 1 | 120+ troops engaged | as .a with another seed and 11 s, so the two loops realign only every 88 s |
| `din.voices` | loop | 16 | 9 | 1 | always | loop: 24 voices shouting and grunting short syllables V(f0 [100,220]) > LP 3500 (distance) |
| `army.idle` | loop | 16 | 10 | 1 | always | loop: 8 murmuring voices, very low + sparse armor jingle + coughs; before contact |

### 4.10 Bodies and dropped gear

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `fall.light` | body | 24 | 0.35 | 8 | always | B > LP [300,450], a/d 0.002/0.12 + S [70,90], d 0.1 @-4 + cloth P > BP 1500, d 0.15 @-12 + limbs (second hit at [0.08,0.15] s) @-6; len [0.30,0.40] |
| `fall.mail` | body | 32 | 0.45 | 6 | armor mail, armor scale | fall.light + 20-30 mail pings (3-8 kHz) over 0.15 s @-4 |
| `fall.plate` | body | 32 | 0.55 | 6 | armor plate | fall.light + clank M([350,600]; arm.plate ratios) @-3 + a second limb clank @-8 |
| `fall.large` | body | 24 | 0.9 | 4 | size 3+ unit | S [45,60], d 0.3 + B > LP 250, d 0.35 + debris @-10 + a second impact |
| `fall.huge` | body | 24 | 1.8 | 3 | size 4+ unit | S [30,40]>25, d 0.9 + B > LP 180, d 1.2 (the ground shakes) + debris G(100>0/s over 1.5 s, 2-10 ms, 0.3-2.5 kHz) @-8 + snap W > BP 1200 @-12; len [1.6,2.0] |
| `fall.rider` | body | 32 | 1.2 | 3 | horse mounts, wolf mounts | fall.large + tack rattle + the mount groaning V(f0 [180,260] falling, tract 1.3) @-6 + rider fall.light at [0.20,0.35] s @-3 |
| `drop.metal` | body | 32 | 0.5 | 8 | always | 3-4 bounces at 0, 0.12, 0.20, 0.25 s (intervals x0.65, levels x0.6), each M([900,1600]; parry.blade ratios, decays 0.15>0.05) + scrape on the last @-10 |
| `drop.wood` | body | 32 | 0.4 | 6 | always | 3 bounces M([400,700]; wood, d 0.04) + roll rattle |
| `drop.shield` | body | 32 | 0.5 | 4 | shielded units | 2-3 thunks (shield.wood, lower) + settling wobble: thunk rate 6>20 Hz over 0.3 s |
| `fall.splash` | body | 32 | 0.6 | 4 | swamp | B > LP 500, d 0.08 + splash W > BP 800>1600 Q1.5, d 0.2 + 8-14 bubbles BUB([200,800]) over 0.4 s + droplets W > HP 2000 @-8; layered on falls in swamp |
| `fall.leaves` | body | 32 | 0.4 | 3 | forest | leaf crunch G(500/s over 0.15 s, 1-4 ms, 1.5-7 kHz) + 2-3 twig snaps (impulse > BP 2500 Q3); layered on falls in forest |

### 4.11 Command, morale, stingers

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `horn.call.cinder` | stinger | 32 | 1.6 | 2 | nation cinder | war horn, A2 0.5 s > D3 1.0 s, LP 250+1400*env Q1.3 (nasal), drive 2.5 (rasp), lip buzz AM 55 Hz 0.15; brass model: SAW f0 + SAW 2.003 f0 @-8, brightness follows loudness, onset scoop -3% over 60 ms, vibrato 5 Hz 0.6%, breath W > HP 1500 @-24 |
| `horn.retreat.cinder` | stinger | 32 | 2.1 | 2 | nation cinder | A2 1.0 s > E2 1.15 s (a falling fifth), wobble 15 cents at 0.5 Hz; same brass model |
| `horn.retreat.cinder.short` | stinger | 32 | 1 | 2 | nation cinder | the same call in 1.0 s, for 2x and 4x |
| `drum.cinder` | stinger | 24 | 0.8 | 4 | nation cinder | taiko-like: two hits 0.18 s apart (the second x0.6), each S [85,95]>[52,60]/0.04, d 0.35 + skin slap W > BP 300 Q1.2, d 0.04 @-6 + B > LP 200, d 0.4 @-10 |
| `stinger.victory.cinder` | stinger | 32 | 4 | 1 | nation cinder | A2, D3, A3 rising with rasp + 5 accelerating drum hits; the cheer is a separate crowd layer |
| `horn.call.thorn` | stinger | 32 | 1.6 | 2 | nation thorn | hunting horn, D3 0.3, D3 0.3, A3 0.9 s, mostly sine-like: SAW > LP 200+900*env Q0.8 + S f0 @-4, no drive; brass model: SAW f0 + SAW 2.003 f0 @-8, brightness follows loudness, onset scoop -3% over 60 ms, vibrato 5 Hz 0.6%, breath W > HP 1500 @-24 |
| `horn.retreat.thorn` | stinger | 32 | 2.1 | 2 | nation thorn | A3 0.8 s > D3 1.1 s (a falling fourth); same brass model |
| `horn.retreat.thorn.short` | stinger | 32 | 1 | 2 | nation thorn | the same call in 1.0 s, for 2x and 4x |
| `drum.thorn` | stinger | 32 | 0.8 | 4 | nation thorn | frame drum S [130,150]>90, d 0.2 + W > BP 600 Q2, d 0.05 @-4 + rim clack M(wood 900 Hz) at 0.18 s @-6 |
| `stinger.victory.thorn` | stinger | 32 | 4 | 1 | nation thorn | D3, F#3, A3 round + frame drum roll; the cheer is a separate crowd layer |
| `horn.call.indep` | stinger | 32 | 1.6 | 2 | nation indep | bugle, G3 0.25, C4 0.25, E4 0.8 s, SAW > LP 400+3000*env (bright); brass model: SAW f0 + SAW 2.003 f0 @-8, brightness follows loudness, onset scoop -3% over 60 ms, vibrato 5 Hz 0.6%, breath W > HP 1500 @-24 |
| `horn.retreat.indep` | stinger | 32 | 2.1 | 2 | nation indep | E4 > C4 > G3 descending; same brass model |
| `horn.retreat.indep.short` | stinger | 32 | 1 | 2 | nation indep | the same call in 1.0 s, for 2x and 4x |
| `drum.indep` | stinger | 24 | 0.8 | 4 | nation indep | field drum S 180, d 0.1 + snare W > BP 3000 Q0.7, d 0.15 @-3, two hits |
| `stinger.victory.indep` | stinger | 32 | 4 | 1 | nation indep | G3, B3, D4 bright + field drum roll; the cheer is a separate crowd layer |
| `banner.fall` | stinger | 32 | 1.2 | 3 | always | cloth P > BP 700 Q1, flapping AM [9,14] Hz rising while it falls (0.6 s) + pole lands M([250,400]; wood) + B > LP 400 thud at [0.6,0.9] s + bounce @-8 |
| `boom.sub` | stinger | 24 | 2 | 2 | always | S 60>30/0.3, d 1.6 + B > LP 120, d 1.2 @-4; the commander-death and god-death hit |
| `heartbeat` | stinger | 24 | 0.9 | 1 | always | lub S 55, d 0.07 + B > LP 200 @-8; dub at 0.18 s S 48, d 0.08 x0.7; repeated at 60-70 bpm during slow motion |
| `bell.toll` | stinger | 32 | 4 | 2 | always | bell M(f [98,110]; partials 0.5/4.0/0.6, 1/3.0/1, 1.2/2.5/0.7, 1.5/2.0/0.5, 2/1.6/0.8, 2.5/1.2/0.4, 3/1.0/0.3, 4/0.7/0.2) + strike W > BP 1500, 5 ms; a commander fallen |
| `bell.toll.god` | stinger | 32 | 6 | 1 | a pretender | pre-roll: the bell tail reversed for 0.8 s, then the bell at f [52,58] with decays x1.5; scheduled 0.8 s before the god dies |
| `choir.god` | stinger | 32 | 5 | 1 | a pretender | 16 voices on a cluster (D3, Eb3, A3, Bb3), a and o, swell 1.5 s then decay, breath 0.3, vibrato 5 Hz 1.5% |
| `whoosh.card` | stinger | 32 | 0.5 | 2 | always | W > BP 800>3000 Q1, bell(0.6) over 0.4 s; the name card |
| `stinger.defeat` | stinger | 32 | 4.5 | 1 | always | low horn E2 for 3.0 s bending down a semitone at the end, LP 200+500*env, over wind P > BP 400, AM 0.3 Hz @-10 + one distant drum @-12 |
| `stinger.withdraw` | stinger | 32 | 3 | 1 | always | calm horn D3 > A2, no wobble, moderate; the round-50 withdrawal |

### 4.12 Spell beats by color

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `spell.R.charge` | spell | 32 | 1.4 | 3 | any R spell | riser: crackle G(20>300/s, law 2.5) @-4 + roar P > LP 300>3000 (exponential), level rising as t^2 + S 50>80 @-10; played from an offset so its climax lands on the release |
| `spell.R.release` | spell | 32 | 0.6 | 3 | any R spell | fwoomp: P burst > LP 4000>600, d 0.25 + S 80>240, a/d 0.002/0.15 @-6 + air W > BP 600>2000 @-6 |
| `spell.R.travel` | spell | 32 | 1 | 2 | R travel spell | loop: flutter roar P > LP 1200, AM [12,18] Hz depth 0.5 + crackle G(120/s) @-6 + hiss W > HP 3000 @-18; Doppler by a playback-rate ramp |
| `spell.R.impact` | spell | 32 | 0.7 | 4 | R damage spell | blast: noise > LP 3000>300, d 0.4 + S 70>40, d 0.3 @-3 + crackle tail G(200>0/s over 0.6 s) @-6 |
| `spell.R.burst` | spell | 32 | 2 | 3 | R area spell | explosion: W > LP 3800>180 (tau 0.25), a/d 0.002/1.2 + S [45,55] gliding x0.6 (tau 0.3), d 0.6 @-4 + crackle tail G(220 e^(-t/0.7)/s, law 2) @-6 + debris G(60/s over 1 s, 2-6 ms, 0.4-2 kHz) @-12 |
| `spell.R.linger` | loop | 24 | 4 | 1 | R area spell | loop: burning ground: hiss W > HP 2500 @-20 + lapping B > LP 400, random AM @0 + crackle G(70/s, law 2.5) @-2 |
| `spell.R.buff` | spell | 32 | 1.2 | 3 | R buff spell | heat swell P > LP 200>1500>400, bell(0.5) + crackle burst @-8 + roar S 60, AM 30 Hz @-10 |
| `spell.G.charge` | spell | 32 | 1.4 | 3 | any G spell | rustle swell: leaf G(50>600/s, 1-4 ms, 1.5-7 kHz) @-4 + earth rumble B > LP 120, rising + creak SS(40>90 Hz) @-10 + hum S 65 and 66.5 (beating) @-12; played from an offset so its climax lands on the release |
| `spell.G.release` | spell | 32 | 0.6 | 3 | any G spell | crack and thud: impulse > BP 1200 Q2 + S 70, d 0.25 + leaf burst G(800/s over 0.15 s) @-4 + soil crumble G(LP) @-8 |
| `spell.G.travel` | spell | 32 | 1 | 2 | G travel spell | loop: a crack running along the ground: G(300/s, 0.5-2 ms, 1-4 kHz) + B > LP 150 + leaf rustle @-8; Doppler by a playback-rate ramp |
| `spell.G.impact` | spell | 32 | 0.7 | 4 | G damage spell | thorns: 3-5 spikes (W > BP 1500>3000 Q2, 40 ms each, staggered 20-40 ms) + wood cracks M([500,900]; wood) |
| `spell.G.burst` | spell | 32 | 2 | 3 | G area spell | eruption: rumble B > LP 150, swell + debris G + root cracks SS + leaf burst |
| `spell.G.linger` | loop | 24 | 4 | 1 | G area spell | loop: leaves settling, sparse creaks |
| `spell.G.buff` | spell | 32 | 1.2 | 2 | G buff spell | growth: SS(60>140 Hz) + bark crackle G(200/s, 1.5-4 kHz) + rustle |
| `spell.G.curse` | spell | 32 | 1.2 | 3 | G curse spell | roots: B rumble + 2-3 SS creaks + 3-4 whip snaps (impulse > BP 2000-3000, pitch-down tails) + soil crumble |
| `spell.G.heal` | spell | 32 | 1.6 | 2 | G heal spell | bloom: S chord G3 B3 D4 G4, a/d 0.4/1.2, slow tremolo, FM index 0>1.5 + rustle swell @-8 + 3-5 FM chirps 2-5 kHz @-12 |
| `spell.G.summon` | spell | 32 | 2 | 2 | G summon spell | the earth splits: rumble riser 0.8 s + crack + rustle burst; the summoned unit adds its own sound |
| `spell.W.charge` | spell | 32 | 1.4 | 3 | M2 (lazy) | shimmer: 6-10 high S (1.5-4 kHz), tremolo 8-12 Hz, crescendo + choir 6 V(f0 220-330, a, tract 0.85) @-8; played from an offset so its climax lands on the release |
| `spell.W.release` | spell | 32 | 0.6 | 3 | M2 (lazy) | bell strike M(nominal [880,1320]; bell.toll ratios, short) + shing W > HP 5000, d 0.3 @-6 |
| `spell.W.travel` | spell | 32 | 1 | 2 | M2 (lazy) | loop: humming ray S 520, 780, 1040 with FM shimmer (ratio 1.003) + sparkle W > HP 6000 @-18; Doppler by a playback-rate ramp |
| `spell.W.impact` | spell | 32 | 0.7 | 4 | M2 (lazy) | holy flare: W > BP 3000 Q0.7, a/d 0.002/0.4 + bell M([700,900]), d 0.8 @-4 + S 80, d 0.15 @-6 + inner burn W > HP 4000, d 0.6 @-10 |
| `spell.W.burst` | spell | 32 | 2 | 3 | M2 (lazy) | radiant blast: noise > LP 8000>1000 + bell cluster + choir swell |
| `spell.W.linger` | loop | 24 | 4 | 1 | M2 (lazy) | loop: a pad on fifths, slow beating |
| `spell.W.buff` | spell | 32 | 1.2 | 2 | M2 (lazy) | rising chime arpeggio (bell partials on C5, E5, G5) + short choir a |
| `spell.W.heal` | spell | 32 | 1.6 | 2 | M2 (lazy) | warm major pad + chimes |
| `spell.W.summon` | spell | 32 | 2 | 2 | M2 (lazy) | choir swell + armored steps + bell |
| `spell.W.shock` | spell | 32 | 1.5 | 2 | M2 (lazy) | dissonant bell cluster + S 70>35 |
| `spell.U.charge` | spell | 32 | 1.4 | 3 | M2 (lazy) | water swirl: P > BP 500>2000 through a moving four-notch sweep + bubbles BUB(rising density) + wind W > HP @-12; played from an offset so its climax lands on the release |
| `spell.U.release` | spell | 32 | 0.6 | 3 | M2 (lazy) | splash: W > BP 800>2500 Q1, d 0.3 + 20 bubbles + droplets W > HP 3000 |
| `spell.U.travel` | spell | 32 | 1 | 2 | M2 (lazy) | loop: icy whistle W > BP [2500,3500] Q15 + tinkle G(pings 4-8 kHz, 30/s) @-10; Doppler by a playback-rate ramp |
| `spell.U.impact` | spell | 32 | 0.7 | 4 | M2 (lazy) | cold shatter: crack (impulse > HP 2000) + 40-80 ice shards M([2000,9000]; 1, 2.1, 3.3; d 0.01-0.08) falling over 0.4 s + crunch G(LP 3000) + S 120 @-8 |
| `spell.U.burst` | spell | 32 | 2 | 3 | M2 (lazy) | tidal crash: P > LP 300>3000>600, bell(0.3) over 1.8 s + B rumble + spray G |
| `spell.U.linger` | loop | 24 | 4 | 1 | M2 (lazy) | loop: creaking ice SS(200-400 Hz, sparse) + drips |
| `spell.U.curse` | spell | 32 | 1.2 | 2 | M2 (lazy) | mist swell W > BP 1000 Q0.5 + reversed whisper |
| `spell.U.drain` | spell | 32 | 1 | 2 | M2 (lazy) | reversed whoosh + tinkle + low gurgle (the fatigue drain) |
| `spell.U.summon` | spell | 32 | 2 | 2 | M2 (lazy) | phasing chorus of detuned SAW through moving notches + glassy S |
| `spell.B.charge` | spell | 32 | 1.4 | 3 | M2 (lazy) | sub drone S 41 and 43.5 (beating), rising + reversed whisper chorus (6 breath-only V, reversed) + hiss @-14; played from an offset so its climax lands on the release |
| `spell.B.release` | spell | 32 | 0.6 | 3 | M2 (lazy) | dark whoosh B > LP 1200>200, d 0.5 + sigh (breath-only V, a>u, falling) @-4 |
| `spell.B.travel` | spell | 32 | 1 | 2 | M2 (lazy) | loop: wailing whisper, breath-only V morphing a-o-u through resonant BP sweeps; Doppler by a playback-rate ramp |
| `spell.B.impact` | spell | 32 | 0.7 | 4 | M2 (lazy) | decay hiss: W > HP 2000-6000, slow AM, a/d 0.01/0.7 + acid bubbles BUB([150,500], 40/s) @-6 + sizzle @-10 + flies (2 SAW 250-300 Hz, AM) @-18 |
| `spell.B.burst` | spell | 32 | 2 | 3 | M2 (lazy) | plague wind: P > BP 300>600 Q2, bell + hiss + flies @-12 |
| `spell.B.linger` | loop | 24 | 4 | 1 | M2 (lazy) | loop: bubbling rot + flies |
| `spell.B.curse` | spell | 32 | 1.2 | 2 | M2 (lazy) | withering: falling hiss + low moan |
| `spell.B.shock` | spell | 32 | 1.5 | 2 | M2 (lazy) | S 70>35 + whisper chorus + an uneven heartbeat |
| `spell.B.summon` | spell | 32 | 2 | 2 | M2 (lazy) | earth crumble + bone rattles (wood-like pings 1-2.5 kHz, 60/s) + low choir moan |

### 4.13 M1 spell specifics and elements

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `dart.flame.fly` | spell | 32 | 0.5 | 3 | emberDart cast | W > BP 2500>1800 Q6 + crackle G(100/s) @-8 + hiss; Ember Dart in flight |
| `meteor.whistle` | spell | 32 | 0.8 | 4 | pyreStorm cast | falling whistle W > BP 1800>900 Q8 over 0.6 s, rising level + roar P > LP 600 @-6; starts 0.25 s before each Pyre Storm meteor lands |
| `explosion.small` | spell | 32 | 1 | 6 | pyreStorm cast | spell.R.burst at 0.4x the length and -6 dB of sub; one per meteor |
| `fury.swell` | spell | 32 | 1.4 | 2 | bloodFury cast | 6 roars (vox.roar.berserk-like) > drive 5 > LP 600>3000 + S 55, AM 2 Hz (pulse) |
| `thorns.erupt` | spell | 32 | 0.5 | 4 | thornSpray cast | 5-8 cracks within 80 ms (impulse > BP 1500-3000) + spike thrusts W > BP 1500>3000 Q2 + rustle tail @-6 |
| `roots.burst` | spell | 32 | 1.2 | 3 | entangle cast | spell.G.curse with louder whip snaps and a ground split at the start (impulse > BP 300 + debris) |
| `bark.grow` | spell | 32 | 1.2 | 3 | barkSkin cast | SS(60>140 Hz) rising, three layers detuned + bark crackle G(200/s, 1.5-4 kHz) + leaf rustle @-10 |
| `swarm.erupt` | spell | 32 | 1.6 | 2 | swarm cast | earth crack (impulse > BP 400 + debris) + buzz.swarm swelling from 1 to 8 voices over 1.2 s, pitch rising 10% |
| `bless.chime` | spell | 32 | 1.2 | 3 | bless cast | bell M(nominal [860,920]; bell.toll ratios, decays x0.4) + 3 high voices V(f0 [440,520], a, tract 0.8, breath 0.3) @-10; short form: the bell alone @-3 |
| `elem.fire.sizzle` | impact | 32 | 0.4 | 6 | element fire | W > HP [2500,3500], sputter AM (random 50-120 Hz), a/d 0.005/0.35 + crackle @-8; fire weapons on a wound |
| `elem.fire.ignite` | impact | 32 | 1.5 | 4 | element fire | whoosh P > LP 300>2000, a 0.05 + crackle G(250>40/s) + roar P > LP 500, AM 5 Hz @-4; a troop catching fire, burning out |
| `elem.cold.shatter` | impact | 32 | 0.8 | 6 | M2 (lazy) | as spell.U.impact, smaller; cold weapons |
| `elem.holy.flare` | impact | 32 | 0.9 | 4 | M2 (lazy) | as spell.W.impact, smaller; holy weapons |
| `elem.decay.hiss` | impact | 32 | 0.9 | 4 | M2 (lazy) | as spell.B.impact, smaller; decay weapons |
| `drain.life` | spell | 32 | 0.8 | 3 | life drain | sucking whoosh W > BP 500>2500 with a swell-then-cut envelope + gulp S 90>60 + heartbeat @-8; Umbra-blessed strikers healing |
| `regen.tick` | spell | 32 | 0.8 | 3 | regeneration | soft creak SS(80>120 Hz) + 3-5 sparkles S 2-4 kHz, d 0.2 @-12; regeneration at the end of a round, -20 dB |
| `expire.soft` | spell | 32 | 0.6 | 3 | always | a short bell partial set with a reversed envelope; an aura ends |
| `fire.shield` | impact | 32 | 0.6 | 3 | fire shield | whoosh.flame + sizzle + a lick of roar; the Ash Colossus burning those who strike it |

### 4.14 Field effects

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `field.storm.rain` | loop | 32 | 8 | 1 | field storm | loop: 2000 drops/s (S chirps 2-6 kHz, d 0.005-0.02, random levels) + wash P > BP 3000 Q0.5 @-6 + ground roar B > LP 400 @-12 |
| `field.storm.wind` | loop | 16 | 9 | 1 | field storm | loop: P > BP 200-900 Q2 swept at random 0.1-0.3 Hz + whistle BP Q15 swept @-12 |
| `thunder.far` | stinger | 24 | 3.5 | 4 | field storm | 3-6 rumbles B > LP 300>120 at random onsets over 0.5-2 s, each a/d 0.02/[1.5,2.5] + S 35 @-8 |
| `thunder.near` | stinger | 32 | 2.5 | 3 | field storm | crack: 20 ms burst > HP 1000 + tearing crackle G(3000/s over 0.15 s), then a far rumble @-3 |
| `field.fog.onset` | spell | 24 | 2 | 1 | field fog | P > LP 2000>400, slow swell 1.5 s + the drone fading in |
| `field.fog.drone` | loop | 16 | 8 | 1 | field fog | loop: S 110, 111.3, 164.8, 166 (beating) > LP, slow tremolo + wind P > BP 300 @-12 |
| `fog.drip` | ambience | 32 | 0.3 | 6 | field fog | BUB([900,1600], rise x1.8, t60 0.03) + tiny splash W > HP 3000, 3 ms @-10 |
| `field.wall.rise` | spell | 24 | 2 | 2 | field wall | grinding B > BP 200 Q1, random AM 18 Hz + debris G(150/s, 2-10 ms, 0.4-3 kHz) + S 35 @-4 + 4 cracks @-8; the caster color's impact is layered on top |
| `field.wall.crumble` | spell | 32 | 2 | 2 | field wall | crack + debris falling G(500>0/s over 1.5 s) + three thuds S 50 |

### 4.15 Ambience

| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |
|---|---|---|---|---|---|---|
| `amb.plains.a` | loop | 16 | 12 | 1 | plains | loop: wind through grass: P > BP [350,700] Q1.5, random AM 0.05-0.2 Hz + grass rustle P > HP 2000 gated by gusts @-12 + low wind B > LP 200 @-10 |
| `amb.plains.b` | loop | 16 | 17 | 1 | plains | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.farmland.a` | loop | 16 | 12 | 1 | farmland | loop: wind over crops: P > BP [500,1000] steadier + denser crop rustle @-9 |
| `amb.farmland.b` | loop | 16 | 17 | 1 | farmland | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.forest.a` | loop | 16 | 12 | 1 | forest | loop: canopy rustle P > HP 1500, gusty AM 0.1-0.4 Hz + low wind B > LP 300 @-10 |
| `amb.forest.b` | loop | 16 | 17 | 1 | forest | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.hills.a` | loop | 16 | 12 | 1 | hills | loop: gusty wind P > BP 300-1200 swept slowly, gusts (attack 2 s, decay 3 s) + whistle BP Q10 @-18 |
| `amb.hills.b` | loop | 16 | 17 | 1 | hills | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.mountains.a` | loop | 16 | 12 | 1 | mountains | loop: howling wind: P through two BP Q8-14 sweeping 400-1200 Hz at 0.05-0.15 Hz + low roar B > LP 150 @-6 |
| `amb.mountains.b` | loop | 16 | 17 | 1 | mountains | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.swamp.a` | loop | 16 | 12 | 1 | swamp | loop: water lapping B > LP 400, AM 0.3-0.8 Hz + sparse bubbles (2/s) @-8 + low wind @-14 |
| `amb.swamp.b` | loop | 16 | 17 | 1 | swamp | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.wasteland.a` | loop | 16 | 12 | 1 | wasteland | loop: dry wind P > BP 800 Q1 + sand hiss G(1000/s, 0.2-1 ms, 3-7 kHz, law 1.5) @-10 + far rumble B > LP 80, AM 0.05 Hz @-12 |
| `amb.wasteland.b` | loop | 16 | 17 | 1 | wasteland | loop: the same recipe, another seed, 17 s (12 and 17 realign every 204 s) |
| `amb.bird.lark` | ambience | 32 | 0.8 | 4 | plains, farmland | FM chirps: carrier 3-6 kHz, FM 20-40 Hz index 2-4, 6-14 notes and trills |
| `amb.bird.forest` | ambience | 32 | 1 | 6 | forest | phrases of 3-8 notes, each a sine glide 2-5 kHz, 40-120 ms, warbles |
| `amb.crow` | ambience | 24 | 0.8 | 4 | farmland, wasteland, aftermath | V(f0 [450,650], a, tract 0.55, drive 5, rough 70 Hz 0.5), 1-3 caws |
| `amb.hawk` | ambience | 32 | 1.5 | 3 | hills, mountains | S 2800>2200 descending cry, vibrato 30 Hz small, 0.6 s, once or twice |
| `amb.frog` | ambience | 24 | 0.6 | 6 | swamp | croak: [18,30] pulses at [40,80] Hz > BP [500,900] Q3 + BP 1500 |
| `amb.insects` | loop | 32 | 6 | 1 | swamp | loop: chirp trains W > HP 4000-6000 at 15-30 Hz rhythm, slow swells |
| `amb.creak.tree` | ambience | 24 | 1.2 | 4 | forest | SS(40-90 Hz, slow) > BP 300 and 900 + wood M, low |
| `amb.gust` | ambience | 16 | 3 | 3 | always | P > BP 300>900>400 Q1, bell(0.4) over 3 s + rustle following |
| `amb.rockfall` | ambience | 32 | 1.5 | 3 | mountains | 10-30 stone pings (M stone 1-3 kHz, d 0.02) accelerating, then slowing + dust hiss @-14 |
| `amb.flag` | loop | 24 | 4 | 1 | always | loop: banners: P > BP 400-900, AM 6-12 Hz (flutter) in gusts + pole creak @-18 |
| `amb.siege.fire` | loop | 24 | 6 | 1 | fort stormed | loop: distant burning (crackle + roar) + an occasional collapse thud; a fort being stormed |

### 4.16 Reverb impulse responses

Generated in pure code at the context sample rate, stereo, once per battle: exponentially decaying noise per band (low below 300 Hz, high above 4 kHz) with the RT60s below, decorrelated left and right, plus discrete echoes alternating left and right.

| Scene | Pre-delay (ms) | RT60 low / mid / high (s) | Discrete echoes (ms, dB) | Wet (dB) | Character |
|---|---|---|---|---|---|
| plains | 8 | 0.6 / 0.5 / 0.25 | 6 ms -6 | -22 | open and dry: the ground reflection and little else |
| farmland | 8 | 0.7 / 0.6 / 0.3 | 6 ms -6, 120 ms -24 | -22 | a soft far reflection from farm buildings |
| forest | 5 | 1.2 / 0.9 / 0.5 | 10 ms -12, 18 ms -14, 27 ms -15, 41 ms -18, 60 ms -22 | -16 | dense early scatter from trunks; leaves eat the highs (LP 4 kHz) |
| hills | 10 | 1.4 / 1.2 / 0.7 | 8 ms -6, 220 ms -14, 410 ms -20 | -18 | slope echoes: horns come back across the valley |
| mountains | 12 | 2.6 / 2.2 / 1.6 | 180 ms -10, 360 ms -14, 610 ms -18 | -14 | valley walls, alternating left and right; bright |
| swamp | 6 | 0.9 / 0.7 / 0.35 | 6 ms -8 | -20 | damp and dark (LP 3 kHz) |
| wasteland | 8 | 0.8 / 0.7 / 0.4 | 180 ms -14 | -20 | a slapback from a rock face |
| walls | 4 | 1.6 / 1.4 / 0.9 | 40 ms -8, 95 ms -12, 150 ms -16 | -14 | a fort being stormed: stone slaps |

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
