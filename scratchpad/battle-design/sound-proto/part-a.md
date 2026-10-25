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

