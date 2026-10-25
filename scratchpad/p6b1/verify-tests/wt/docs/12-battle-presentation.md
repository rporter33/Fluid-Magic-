# Battle Presentation

The build spec for the battle replay: per-blow detail, the pure timeline, procedural sound, the
renderer, the lab, and their integration, built in stages S1 to S6. Per `CLAUDE.md` this file is
the specification for the track. The text it adds to the other docs (`docs/04-battle.md`,
`docs/06-architecture.md`, `docs/07-ui.md`, `docs/09-art-direction.md`,
`docs/10-milestone-1.md`, and the new `docs/11-sound.md`) lands with the stage that implements
it.

It merges three design proposals (architecture, spectacle, and sound) after review by two
judges. References such as "architecture 3.8", "spectacle 4.12", or "sound proposal section 5"
point into those proposals. They are catalogs, not spec, and are not in the repository; if the
owner wants them kept, they go in `docs/battle-catalog/` and are referenced from here. Where
this file and a proposal differ, this file wins.

**Owner direction (binding).** "The battles should be visceral with detail and sfx since its
not real time that should be fine, take what you need to get this done." This gives three
requirements:

- per-blow detail;
- heavy effects, which are acceptable because a battle is resolved first and watched
  afterwards;
- procedural battle sound effects, now in M1.

**Constraints that still hold:**

- The sim stays pure and deterministic. It never imports audio, render, or presentation
  code.
- Content stays data.
- Saves stay small: records are bounded and saves are gzipped.
- Every battle stays watchable. The hard cap is 150 s at 1x, and the player can pause, step,
  scrub, and skip.
- Accessibility:
  - colors are safe for color-blind players, and glyphs back them up;
  - reduced motion follows the OS;
  - there is a gore setting;
  - sound has captions;
  - a text Report gives the whole battle in words.
- No copyrighted assets. Everything is procedural; one CC0 sample slot exists, but only the
  owner's listening decision can fill it.
- Everything pure is unit-tested. Rendering and audio get cheap Playwright smoke tests.

---

## 0. The design in sixteen points

1. **Per-blow truth by re-running the battle.**
   - `BattleRecord.rerun` stores the setup and the rng state from before the battle. The
     setup goes through a JSON round trip, with spells stored by id.
   - The viewer re-runs the same pure `resolveBattle` with an observation-only detail sink.
   - It checks that the re-run's whole stored log, winner, and rounds equal the record.
   - Detail is never saved.
2. **A fallback that is honest.** A record with no setup, a mismatch, or an error still
   plays. In that case:
   - Blows are synthesized from the stored tallies.
   - The stored tallies now say how many blows missed, were blocked by armor, landed on an
     already fallen troop, wounded, or killed.
   - Nothing the log does not contain is shown: no rolls, no break chance, no invented
     killers.
3. **Five small stored-log additions (A1 to A5), none of which draws a number:**
   - A1: phase markers;
   - A2: `attacks`, `blocked`, `onFallen`, and `dmg` on volleys and melee;
   - A3: `by` on damage to commanders and on fire-shield burns;
   - A4: `fatigue` on casts;
   - A5: `scene` (terrain, storm) on the record.
4. **A new pure directory, `src/present/**`.** It holds the script, layout, proxies,
   sampling, pacing, timeline, time map, frame evaluation, particles, report, sound plan,
   and DSP. It is guarded like the sim. Presentation data lives in
   `src/content/presentation/**`. The Web Audio engine is in impure `src/audio/**`; the Pixi
   renderer is in `src/render/**`.
5. **One canonical timeline in story milliseconds at 1x.**
   - Every sampled strike, projectile, and sound carries a stable key and a rank. What 4x
     shows is a subset of 2x, which is a subset of 1x.
   - Speed, Beats mode, slow motion, and hit-stop live in a pure piecewise time map from
     story time to real time.
   - Gore, motion, flashes, and quality are view filters.
6. **The scene is a pure function of story time.** It is built from keyframes per round,
   closed-form particles, and decals that can be re-baked. So seek, screenshots, and
   recovery from a lost WebGL context are all exact.
7. **The stage:**
   - side view, with the player always on the left;
   - three row bands per side and six depth lanes;
   - a clash line that leans toward the side that is losing;
   - backdrops per terrain, including a stormed fort;
   - a field that keeps every body, arrow, blood pool, and scorch mark until the battle
     ends.
8. **Sprites read true strength.**
   - Up to 20/12/6/4/2/1 sprites per squad by size, set by the proportional `visible()`
     rule. The last five troops are always literal.
   - The badge shows the exact count, and every dead troop leaves a body: either the sprite
     itself, or a "ghost" body when a sprite stands for several troops.
   - Sprites are bound to real troops, so in detailed mode the struck sprite is the real
     target.
9. **Choreography:**
   - a motion for every M1 weapon, by weight class;
   - defense reactions: dodge, parry, or shield;
   - deflections drawn by armor class, with an ARMOR chip when armor holds;
   - "follow-through" for blows on troops that already fell;
   - cavalry charges, archers whose arrows stick, ammunition, berserkers, flyers, monsters,
     and pretender bodies.
10. **Impact grammar:**
    - hit-stop by weight, with at most one global stop per 450 ms;
    - screen shake from squared trauma;
    - a white flash first on every hit;
    - blood by blood type and element, pools, and death styles;
    - dismemberment on Brutal gore only.

    With gore Off, the information stays: corpses lie as dark silhouettes.
11. **Spells:** five beats each (charge, release, travel, impact, linger). All eleven M1
    battle spells have storyboards, built on the color particle grammar from `docs/09`.
    Generic templates cover the M2 primitives.
12. **Morale and the big moments:**
    - squads are shaken, hold, or break;
    - routs and the moment a side's line breaks;
    - commander and god deaths with slow motion and a name card that names the killer.
13. **Pacing is measured on real logs:**
    - starting armies about 42 s, 300 vs 300 about 83 s at 1x, about 45 s in Beats mode;
    - quiet rounds play brisk, and runs of four or more become a montage;
    - hard cap 150 s at 1x;
    - pause, step, scrub with beat icons, and skip are always available.
14. **Sound is pure TypeScript synthesis, baked in workers; Web Audio only mixes.**
    - The 220 recipes are data. The bank grows in stages: 40 core recipes first, then the
      full M1 families after the owner listens.
    - Variation is deterministic, with no-repeat variant bags.
    - The mixer has caps per class, must-play sounds, stealing of fading tails, and energy
      accounting that feeds a crowd din.
    - Reverb is generated per terrain. Ducks combine by the deepest. Speed changes density,
      not pitch.
15. **HUD:**
    - docks whose counts change at the moment a death is shown and equal `foldReplay` at
      every phase end;
    - commander HP and fatigue, and buff chips;
    - a ticker, a Log with a Report view, and a result card.

    Settings live in the UI store, never in `GameState`.
16. **Build in six stages (S1 to S6), each green and committed on its own:**
    - S1 lands now, during Phase 7.
    - S2 to S5 run in parallel with Phases 7 to 9.
    - S6 is Phase 10, the modal. Phase 11 swaps the placeholder parts for SVG parts.

---

## 1. Decisions where the judges or the proposals disagree

| # | Topic | Judge 1 | Judge 2 | Decision | Why |
|---|---|---|---|---|---|
| D1 | Sprites per squad and how kills map to sprites | Spectacle's proportional `visible()`, caps 20/12/6/4/2/1, last five literal, ghost bodies; files of troops rejected | Architecture's fixed files of troops; caps 32/16/8/4/2/1 | **A hybrid.** The number of standing sprites follows `visible()`, so it is proportional. Each sprite also holds a dynamic **file** of real troops, used to attribute blows (who swings, who is struck). A file is rebound when its representative dies, and a file merges into its neighbors when its sprite dies. Caps are 20/12/6/4/2/1 (docs/07). | Fixed files keep about 17 of 20 sprites standing at half strength (Judge 1's arithmetic: 3 troops per file, 0.5³ of files empty). The block lies about strength, and that is a truth bug. Dynamic files keep detailed mode's exact attribution, which is what Judge 2 wanted from files, without that lie. The cap of 20 stays because bodies, not crowd density, carry the mass of a battle. The cap is a content number (`PRESENT_LAYOUT.caps`), so the lab can try 32. |
| D2 | Speed-dependent strike budgets vs one timeline | One timeline; LOD ranks; nested subsets | Keep 90/55/30 per speed and detail | **Both, through ranks.** The timeline holds every sampled strike once, each with a rank. Speed `s` shows the mandatory strikes plus the ranks below `B(s) − mandatory`. Budgets are 90/55/30 by speed (0.5x uses 1x). **The Detail setting does not change strike budgets.** | Ranks make 4x ⊂ 2x ⊂ 1x by construction, and nothing is rebuilt when the speed changes. Detail only scales particles and decals. That is where the cost is, and it keeps sound and picture on one shared strike set. |
| D3 | A4 (`fatigue` on `cast`) | Take | Drop; fold from the setup | **Take** | Folding fatigue would put the casting rules (`fatigueCost`, recovery) into presentation code, a second copy of a sim rule. A4 costs under 0.5 KB per big record and serves both modes. |
| D4 | Break-chance meter, A6 | Optional, no A6 | Exact in detailed mode; fallback labels it approximate | **Detailed mode only. No A6.** The meter is computed from the setup's `mor`, the logged buffs, and pressure, using `breakThreshold()` exported by `morale.ts`. In detailed mode the actual roll is shown when a check happens. In fallback mode the meter is hidden. | The rule stays in one place (the sim). An "approximate" meter would be a guess the log cannot support, and Judge 2's own risk 3 forbids that. |
| D5 | Name for hits on already fallen troops | `spent` | `overkill` | **`onFallen`** | "Spent" reads as ammunition, and "overkill" reads as excess damage on the killing blow. `onFallen` says what it counts. |
| D6 | Where auto-tempo lives | Pacing net in the builder (compression, montage, cap) | Time map holds auto-tempo | **The builder.** The time map holds only speed, Beats mode, slow motion, and hit-stop. | Brisk rounds, montage, and the cap together give one 1x duration per battle, and that duration can be tested against 150 s. Two compression mechanisms would fight. |
| D7 | Phase markers in the detail stream | A1 in the stored log | A1 in the stored log | **Stored A1 only.** Detail events carry `round` and `phase` fields instead of markers. | One source of truth for phases. Morale checks that held log nothing in the stored log, so a detail event needs its own phase label. |
| D8 | Projectiles | (Spectacle: one per visible shooter; architecture: one per real shot, up to 500) | — | **One per real shot.** The cap is 400/240/120 per ranged phase by speed. Kills are mandatory; the rest are ranked and stratified by outcome. | The busiest measured ranged phase is 170 shots (300 vs 300), well inside the cap. A true arrow count is more visceral than proxies, and it costs particles, which are cheap. |
| D9 | How to choose which real blows to show in detailed mode | Outcome shares stay proportional | Architecture's importance ranking | **Both.** A quota per outcome class keeps each pair's shares true, by largest remainder over a stratified order. Within each class, blows are ordered by importance: bigger `dealt` first, then continuing duels, then a stable hash. | Shares stay honest, and the wounds shown are the most dramatic real wounds. |
| D10 | Sound bank staging | 25 core recipes first, full bank by the renderer stage | About 40 core recipes; full families after the owner listens | **S3a: 40 core recipes. S3b: the full M1 families, after the owner's first listening pass.** S6 needs zero pending sound mappings. | Judge 2's list covers every outcome class at least once. The owner's ear gates the families a model cannot tune blind. |
| D11 | Playwright in the commit gate | Smoke tests; perf and audio smoke | Out of the default gate except for render and audio commits | **`npm run test:e2e` is required only for commits that touch `src/render`, `src/audio`, `src/ui/replay`, or `src/lab`.** Mostly non-blank and stats assertions, plus 6 pinned baselines. | Follows CLAUDE.md's "smoke tests only where cheap". Baselines stay few so that Phase 11's deliberate refresh is one commit. |
| D12 | Record size pin | Pin on the realistic 300v300 | Raise the pin to 20 KB | **The rerun setup of the `clash300` fixture is at most 14 KB raw. The full record is at most 56 KB raw and 7 KB gzipped.** | Measured: 9.3 KB setup and 45.2 KB full. A careless capture of full spell definitions pushes the setup past 14 KB (the architecture measured 15.9 KB against 6.4 KB with 8 mages); a 20 KB pin would miss it on this fixture. |
| D13 | Gore levels and default | Standard default; Off keeps silhouettes | Same | **Off / Standard / Brutal, default Standard.** Off draws corpses as dark silhouettes. | Both judges agree. The dead are information. |
| D14 | Unarmed blows | — | Spectacle wrongly showed them as 0 damage | **Unarmed blows deal `str` damage** (`UNARMED.dmg` 0 + str), as the sim does. The Monolith's glyph pulse and a Salamander's tail lash (out of breath) can wound and kill. | This is how the sim works. |
| D15 | "Shaken" in the fallback | Spectacle's rule omitted `deathsThisRound > 0` | — | **In detailed mode, `shaken` comes from detail `morale` events. In the fallback, from `mustCheck()`, exported by `morale.ts`**, applied to the logged kills. | The rule stays in one place. |
| D16 | Audio code placement | `src/present/sound` pure; engine in `src/audio` | Same; avoid the `**/audio` guard collision | **Pure DSP, plan, allocation, and variants go in `src/present/sound/**`. Recipes, profiles, mix tables, and impulse responses go in `src/content/presentation/sound/**`. The Web Audio engine and the bake worker go in `src/audio/**`.** The log-only cue generator is a lab tool. | One pure presentation directory, and no pattern collision. |
| D17 | Synthesis | Pure TypeScript DSP | Same | **Pure TS DSP in workers.** `OfflineAudioContext` is never used to bake. | Both judges reproduced non-deterministic `OfflineAudioContext` oscillators (4 to 6 distinct outputs in 6 renders). The pure DSP is bit-identical and runs at 148x to 186x real time. |

---

## 2. Measured ground truth

### 2.1 Sources and fixtures

- Measured in this container on the main worktree's code, using a scratch copy patched with
  A1 to A5: `final-measure/measure.ts` and `final-measure/pace.ts` in the design scratchpad.
  They are not in the repository. S1's tests reproduce the size figures, and S2's tests
  reproduce the pacing figures.
- Judge figures were re-run and reproduced: `judge2-verify/stats.ts` and
  `judge2-verify/rerun.ts`.

Fixtures:

- `starting`: 20 Cinder Warriors, 10 Flame Archers, an Adept, and a Priest, against 20
  Wardens, 10 Longbows, a Druid, and a Priest. 50 seeds.
- `clash300`: 300 troops in 7 squads plus 6 commanders, with Pyre Storm and Fireball,
  against 300 troops in 6 squads plus 6 commanders (two Elder Druids, a Treant). 20 seeds.

### 2.2 Record size and the observation-only check

| Quantity | `starting` | `clash300` |
|---|---|---|
| A1 to A5 change no draw: stored log with A1 to A5 stripped equals today's log | 50 / 50 | 20 / 20 |
| Record today (roster plus replay), raw / gzipped | 5.6 KB / 0.9 KB | 24.9 KB / 2.6 KB |
| Record with A1 to A5 | 7.4 KB (+32%) / 1.1 KB | 35.9 KB (+44%) / 3.8 KB |
| `rerun` (setup with spells by id, plus the rng) | 4.0 KB / 0.7 KB | 9.3 KB / 1.3 KB |
| Full record (A1 to A5 plus `rerun` plus `scene`) | 11.5 KB / 1.6 KB | 45.2 KB / 5.0 KB |
| 20 full records | 229 KB / 32 KB | 904 KB / 101 KB |

### 2.3 Battle shape

| Quantity | `starting` | `clash300` |
|---|---|---|
| Events per battle (with A1) | 95 | 400 |
| Phase markers per battle | 20 | 34 |
| Rounds | 6.7 average | 8.7 average |
| Casts, commander deaths per battle | — | 33, 4.3 |

### 2.4 Blow outcomes

| Quantity | `starting` | `clash300` |
|---|---|---|
| Attacks, hits | 165, 85 | 2,111, 1,124 |
| Hit outcomes: blocked, on fallen, kill, wound | 21, 9, 28, 28 | 279, 172, 343, 330 |
| On-fallen share of hits | 10.5% | 15.3% (melee 18.7%, volley 12.0%) |
| Zero-damage share of hits, all hits (J2's measure) | — | volley 45.7%, melee 8.4% |
| Busiest single phase | 37 melee attacks, 16 kills | first contact: 491 attacks, 277 hits, 141 kills; busiest volley phase 170 shots |

The formula `wound = hits − blocked − kills` (spectacle A2) would give 502 wounds in
`clash300`. The true number is 330. A2 therefore needs `onFallen`.

### 2.5 Re-run, sound, and modeled pacing

| Quantity | `starting` | `clash300` |
|---|---|---|
| Re-run from JSON setup plus cloned rng | — | 40 / 40 identical (J1 also on `starting`) |
| Sound bake per battle, one worker (sound proposal) | 97 recipes, 38 MB, 3.7 s | 148 recipes, 58 MB, 5.6 s |
| Modeled pacing at 1x (rules of S2 §S2.7, rough pacer on real logs) | 42 s average, 61 s worst | 83 s average, 96 s worst |
| Modeled Beats mode | 21 s | 45 s |
| Grind (300 v 300, prot 16, mor 50, 27 rounds) | 62 s at 1x, 21 s Beats | |
| Immortal (round-50 stalemate) | 15 s (montage) | |

Further worst cases from the architecture proposal: the worst battle re-runs in about 35
ms; 28,800 strikes is about 6 MB of detail objects in memory, held only while the
timeline is built.

---

## 3. Stage map

| Stage | Delivers | Depends on | When | Gate | Commit prefix |
|---|---|---|---|---|---|
| S1 | Sim: A1 to A5, the detail sink, `rerun` and `scene` on the record, `STATE_VERSION` 2, equivalence tests | nothing | now, beside Phase 7 (touches only `src/sim/battle`, `conflict.ts`, `types.ts`) | `typecheck && lint && test` | `Phase 10 S1:` |
| S2 | Pure presentation: script, fallback synth, layout, proxies, sampling, pacing, cues, timeline, time map, keyframes, `evaluateInto`, view filters, panel, ticker, report, checks, look content, fixtures | S1 | beside Phases 7 and 8 (Node only) | same | `Phase 10 S2:` |
| S3 | Audio, in two parts. S3a: DSP, recipe schema, 40 core recipes, sound plan and allocator, engine, bake workers, settings store, audition page. S3b: the full M1 families and the listening pass | S2 (timeline cues) | S3a after S2; S3b after the owner's first listening pass, beside S4 | same, plus `test:e2e` | `Phase 10 S3:` |
| S4 | Pixi renderer with procedural placeholder rigs, particles, decals, camera, HUD, controller, settings UI, minimal lab page | S2 (S3 optional; sound attaches when ready) | beside Phases 8 and 9 | same, plus `test:e2e` | `Phase 10 S4:` |
| S5 | Full battle lab (sources, inspectors, Verify, audition tab, `window.__lab`) and the Playwright suite | S4 | after S4 | same, plus `test:e2e` | `Phase 10 S5:` |
| S6 | Integration. Phase 10: the `BattleReplay` modal from messages, settings in the Phase 9 settings screen, gzipped saves. Phase 11: SVG parts replace placeholders through the same `PartSet` seam | S1 to S5, Phase 8 (messages), Phase 9 (settings, saves) | Phase 10, then Phase 11 | same, plus `test:e2e` | `Phase 10:` / `Phase 11:` |

At the end of every stage, `docs/PROGRESS.md` gets an entry saying what is done, what
deviates, and the known issues. Stage commits land the `docs/` text of section "Spec text"
that they implement, in the same commit.

---

## S1. Sim: strike-level detail, the record, and size

### S1.1 Files

| File | Change |
|---|---|
| `src/sim/battle/events.ts` | `BattlePhase`; the `phase` event (A1); `AttackTally` fields on `volley` and `melee` (A2); `by?` on `damage` (A3); `fatigue` on `cast` (A4) |
| `src/sim/battle/detail.ts` (new, types only) | `DetailEvent`, `DamageRoll`, `Landing`, `MoraleRoll` |
| `src/sim/battle/record.ts` (new, types only) | `BattleSetupRecord`, `BattleRerun`, `BattleScene`, so that `sim/types.ts` imports them without a cycle |
| `src/sim/battle/rerun.ts` (new) | `toSetupRecord`, `fromSetupRecord`, `rerunBattle`, `matchesRecord`, `validRerun` |
| `src/sim/battle/field.ts` | `Fighter.index` (fixed slot in `group.members`); `raging(f)`, which `statOf` now uses; `Field.detail: DetailEvent[] \| null`; `Field.phase: BattlePhase`; `Field.round` |
| `src/sim/battle/attacks.ts` | `rollDamageParts`; richer `Hit`; `land()` writes A2 and A3 and emits `strike`; `burnStrikers` writes `by` and emits `burn`; `drainLife` emits `drain`; both phases emit `engage` |
| `src/sim/battle/effects.ts` | `damage()` uses `rollDamageParts` and emits `spellHit` for each troop rolled |
| `src/sim/battle/morale.ts` | `breaks()` returns a `MoraleRoll` and emits `morale`; exports `mustCheck()`, `breakThreshold()`, and `fearless()`, which `shaken()`, `breaks()`, and `neverChecks()` themselves use |
| `src/sim/battle/spells.ts` | `cast` logs `fatigue` (after paying) |
| `src/sim/battle/resolve.ts` | `resolveBattle(setup, rng, opts?)`; `span()` inserts A1 markers and fixes up detail `at` |
| `src/sim/battle/replay.ts` | `case 'phase': break;` with the exhaustive `never` check |
| `src/sim/battle/apply.ts` | `applyBattle(..., capture)` stores `scene` and `rerun` on recorded battles |
| `src/sim/conflict.ts` | `fight()` clones the rng before resolving and passes the capture |
| `src/sim/types.ts` | `BattleRecord.scene`, `BattleRecord.rerun`; `STATE_VERSION = 2` |
| `scripts/golden-battle.ts` (new) and `package.json` `"golden:battle"` | Writes `tests/sim/battle/golden.json` (see S1.9) |

### S1.2 Stored-log additions (A1 to A5), exact types

```ts
// events.ts
/** Round steps in resolver order (docs/04-battle.md, "Round structure"). */
export type BattlePhase = 'scripts' | 'ranged' | 'melee' | 'morale' | 'end';

/**
 * One attacking group against one target group in one ranged or melee phase. Every attack is
 * rolled against the field as the phase began, so a later blow can land on a troop an
 * earlier blow already felled. wounds = hits - blocked - onFallen - kills, never negative.
 */
export interface AttackTally {
  squad: BattleUnitRef;
  target: BattleUnitRef;
  /** Attack rolls, misses included. */
  attacks: number;
  /** Rolls that hit. */
  hits: number;
  /** Hits on a living troop that rolled 0 damage: the armor held. */
  blocked: number;
  /** Hits on a troop already felled earlier in this phase. */
  onFallen: number;
  kills: number;
  /** HP removed: each blow capped at its target's HP before the blow. */
  dmg: number;
}

export type BattleEvent =
  | { kind: 'roundStart'; round: number }
  /**
   * A1. Opens the round step that logged the events after it. Logged only when the step
   * logged something. A step's span includes the commander deaths checked right after it,
   * and 'end' includes the round-50 departures.
   */
  | { kind: 'phase'; phase: BattlePhase }
  /** A4: fatigue is the caster's fatigue after paying for this cast. */
  | { kind: 'cast'; caster: BattleUnitRef; spellId: string; targets: BattleUnitRef[]; fatigue: number }
  | ({ kind: 'volley' } & AttackTally) // A2
  | ({ kind: 'melee' } & AttackTally) // A2
  /**
   * A3: by is the striking group, set for weapon hits on commanders. For fire-shield burns,
   * by is the shield's group (the largest contributor if several burned the target). Spell
   * damage leaves it out: the preceding cast names the caster.
   */
  | { kind: 'damage'; target: BattleUnitRef; amount: number; element: Element; kills: number; by?: BattleUnitRef }
  // ...every other kind unchanged (heal, rout, leave, advance, death, summon, buff, expire,
  // field, fieldEnd, fatigue, battleEnd)
  ;
```

**A5** lives on the record, not in the log:

```ts
// record.ts
import type { TerrainId } from '../../content/terrain';
import type { StormState } from './setup';
export interface BattleScene {
  terrain: TerrainId;
  /** Set when the battle was the storm of a fort. */
  storm: StormState | null;
}
```

**How the A2 fields are counted.** This is the exact change to `land()`. No draw moves.

```ts
t.attacks += 1;
if (h.roll === null) { /* miss: emit strike, continue */ }
t.hits += 1;
if (!h.target.alive) { t.onFallen += 1; /* emit strike with landing {0,0,false} */ continue; }
const hpBefore = h.target.hp;
if (h.roll.rolled === 0) t.blocked += 1;
t.dmg += Math.min(h.roll.rolled, hpBefore);
h.target.hp -= h.roll.rolled;   // then kills, the commander damage event (now with by), as today
```

### S1.3 Detail events

These are never saved. They are the architecture schema, with phase labels in place of
markers.

```ts
// detail.ts
import type { Element } from '../../content/types';
import type { Formation } from '../types';
import type { BattlePhase, BattleSide, BattleUnitRef } from './events';

/** rolled = max(0, base + attackDrn - armor - armorDrn); attackDrn is drawn first. */
export interface DamageRoll { base: number; prot: number; armor: number; attackDrn: number; armorDrn: number; rolled: number }
/** hpBefore 0 means the troop had already fallen this phase. dealt = min(rolled, hpBefore). */
export interface Landing { hpBefore: number; dealt: number; killed: boolean }
/** broke = morale + moraleDrn < target + targetDrn + pressure; moraleDrn is drawn first. */
export interface MoraleRoll { morale: number; moraleDrn: number; target: number; targetDrn: number; pressure: number; broke: boolean }

interface DetailBase {
  /** Stored events logged before this one: it sits between replay[at - 1] and replay[at]. */
  at: number;
  round: number;
  phase: BattlePhase;
}
export type DetailEvent =
  | (DetailBase & { kind: 'engage'; fronts: Record<BattleSide, Formation | null>; contact: BattleUnitRef[] })
  | (DetailBase & {
      kind: 'strike';
      attacker: BattleUnitRef; attackerMember: number;
      /** Index into the attacker's stats.weapons; -1 for an unarmed blow. */
      weapon: number;
      target: BattleUnitRef; targetMember: number;
      /** Melee: hit when attack + attackDrn > defense + defenseDrn. Ranged: prec vs toHit, hit when >=. */
      attack: number; attackDrn: number; defense: number; defenseDrn: number;
      hit: boolean; berserk: boolean; firstRound: boolean;
      damage: DamageRoll | null; landing: Landing | null;
    })
  | (DetailBase & {
      kind: 'spellHit'; caster: BattleUnitRef; spell: string; effect: number; element: Element;
      target: BattleUnitRef; targetMember: number; damage: DamageRoll; landing: Landing;
    })
  | (DetailBase & { kind: 'burn'; unit: BattleUnitRef; member: number; shield: BattleUnitRef; owed: number; landing: Landing })
  | (DetailBase & { kind: 'drain'; unit: BattleUnitRef; member: number; gained: number })
  | (DetailBase & { kind: 'morale'; group: BattleUnitRef; cause: 'losses' | 'shock' | 'commanderDeath'; roll: MoraleRoll });
```

**Order guarantees** (all tested):

- `strike`s in a phase come in roll order: attacker side first, setup order, member order,
  weapon order.
- `at` never decreases.
- Merging the two streams by `(at, emission order)` puts each `strike` before the
  commander `damage` it caused.
- Every detail event's `phase` matches the span of the stored event at `at`, or is the span
  that logged nothing (morale checks that held).

### S1.4 The sink: observation only

```ts
// resolve.ts
export interface ResolveOptions { detail?: DetailEvent[] }
export function resolveBattle(setup: BattleSetup, rng: RngState, opts: ResolveOptions = {}): BattleResult;

/** Runs one round step; inserts its A1 marker if it logged anything. */
function span(field: Field, phase: BattlePhase, log: BattleEvent[], step: () => void): void {
  const at = log.length;
  const from = field.detail?.length ?? 0;
  field.phase = phase;
  step();
  if (log.length === at) return;
  log.splice(at, 0, { kind: 'phase', phase });
  // Every detail event of this span sits at or after `at`, so after the marker.
  const d = field.detail;
  if (d) for (let i = from; i < d.length; i++) { const e = d[i]; if (e) e.at += 1; }
}
// round loop:
span(field, 'scripts', replay, () => { scriptsPhase(...); commanderDeaths(...); });
span(field, 'ranged', replay, () => { rangedPhase(...); commanderDeaths(...); });
span(field, 'melee', replay, () => { meleePhase(...); commanderDeaths(...); });
span(field, 'morale', replay, () => moralePhase(...));
span(field, 'end', replay, () => { endOfRound(...); /* round-50 departures */ });
```

Rules, each checked by review and by the tests in S1.9:

1. Every rng draw happens on the same code path with or without a sink. Rolls are bound to
   local constants in today's order:
   - ranged: the target pick, then the attack DRN, then the defense DRN;
   - melee: the same;
   - damage: the attack DRN, then the armor DRN;
   - morale: the morale DRN, then the target DRN.
2. No `if (field.detail)` branch contains a draw or changes state. Detail objects are only
   built inside such branches.
3. The live game never passes a sink. AI-only battles pay only for a 4-number `cloneRng`.

Sketch of the attack refactor (architecture Appendix B, kept):

```ts
export function rollDamageParts(rng: RngState, base: number, prot: number, piercing: boolean, negating: boolean): DamageRoll {
  const armor = negating ? 0 : piercing ? Math.floor(prot * BATTLE.armorPiercingFactor) : prot;
  const attackDrn = drn(rng);
  const armorDrn = drn(rng);
  return { base, prot, armor, attackDrn, armorDrn, rolled: Math.max(0, base + attackDrn - armor - armorDrn) };
}
export function rollDamage(...args: Parameters<typeof rollDamageParts>): number { return rollDamageParts(...args).rolled; }
```

`morale.ts` exports two pure helpers that the presentation uses, so the rules are not
copied:

```ts
/** A squad must roll this round (docs/04, round step 4); shaken() calls it. */
export function mustCheck(startCount: number, lostTotal: number, lostThisRound: number, shock: number): boolean;
/** It breaks when moraleDrn - targetDrn < breakThreshold(mor, pressure); breaks() uses it. */
export function breakThreshold(mor: number, pressure: number): number; // BATTLE.morale.base + pressure - mor
/** Never rolls morale: mor at or above BATTLE.morale.fearless, or berserk; neverChecks() uses it. */
export function fearless(mor: number, tags: readonly string[]): boolean;
```

### S1.5 The record and capture

```ts
// record.ts (continued)
export interface CommanderSetupRecord extends Omit<BattleCommanderSetup, 'spells'> { spells: string[] }
export interface SideSetupRecord extends Omit<BattleSideSetup, 'commanders'> { commanders: CommanderSetupRecord[] }
export interface BattleSetupRecord { province: ProvinceId; attacker: SideSetupRecord; defender: SideSetupRecord }
export interface BattleRerun { setup: BattleSetupRecord; rng: RngState }

// rerun.ts
/** JSON round trip, spells replaced by ids, so the same session equals a loaded save. */
export function toSetupRecord(setup: BattleSetup): BattleSetupRecord;
/** Resolves spell ids through the content registry; throws on an unknown id. */
export function fromSetupRecord(record: BattleSetupRecord): BattleSetup;
/** Fights again from a copy of the stored rng; never mutates the record. */
export function rerunBattle(rerun: BattleRerun, detail?: DetailEvent[]): BattleResult;
/** The re-run reproduced the record: winner, rounds, and the whole stored log deep-equal. */
export function matchesRecord(result: BattleResult, record: BattleRecord): boolean;
/** Shape check for loads: an object with both sides' arrays and an RngState. */
export function validRerun(value: unknown): value is BattleRerun;

// types.ts
export const STATE_VERSION = 2;
export interface BattleRecord {
  id: BattleId; day: number; province: ProvinceId;
  attacker: NationId | null; defender: NationId | null;
  winner: BattleSide; rounds: number;
  roster: Record<BattleSide, BattleRoster>;
  replay: BattleEvent[];
  /** A5: where it was fought. */
  scene: BattleScene;
  /** Setup and starting rng for a blow-by-blow re-run; null for older records. */
  rerun: BattleRerun | null;
}
```

Capture, in `conflict.ts fight()`:

```ts
const setup = buildBattle(state, provinceId, attacker, defender, storm);
const rng0 = cloneRng(state.rng);   // 4 numbers; draws nothing
const result = resolveBattle(setup, state.rng);
applyBattle(state, provinceId, attacker, defender, result, { setup, rng: rng0, storm });
```

`applyBattle` builds `scene` from the province's map terrain and `storm`. Only for recorded
(player) battles does it also build `rerun: { setup: toSetupRecord(setup), rng: rng0 }`.

**Migration from version 1 to 2**, which `serialize.ts` (Phase 9) starts its migration map
with:

```ts
for (const b of state.battles) {
  b.scene = { terrain: provinceTerrain(state, b.province), storm: null };
  b.rerun = null;
}
```

**On load, validation is lenient.** If `validRerun(b.rerun)` fails, set it to `null`. A
save is never rejected because of a replay. No save exists before Phase 9, so this
migration only ever runs on test fixtures.

### S1.6 Size numbers and pins

| Item | Measured | Pin (test) |
|---|---|---|
| `clash300` `rerun` JSON | 9.3 KB | ≤ 14 KB raw |
| `clash300` full record | 45.2 KB raw, 5.0 KB gzipped | ≤ 56 KB raw and ≤ 7 KB gzipped (`zlib.gzipSync` in the test) |
| `starting` full record | 11.5 KB raw, 1.6 KB gzipped | ≤ 16 KB raw |
| 20 big records in a save | 904 KB raw, 101 KB gzipped | Phase 9 writes saves gzipped (S6.3). The docs/06 budget becomes "a few hundred KB gzipped". |
| Re-run time, worst (immortal 300 v 300, 50 rounds, with sink) | about 35 ms (architecture) | ≤ 45 ms, ×2 slack in CI |
| Detail stream memory, worst | about 6 MB (28,800 strikes) | Dropped after the timeline is built |

### S1.7 Existing tests that change in the same commit

These tests pin exact event shapes or scan events after a cast:

- `tests/sim/battle/attacks.test.ts`:
  - every exact `damage` shape in the fire-shield tests gains `by`;
  - the `toContainEqual` on `melee` events (around lines 289 and 358) gains `attacks`,
    `blocked`, `onFallen`, and `dmg`;
  - `replay[burn]` gains `by`.
- `tests/sim/battle/spellFixtures.ts` `afterCast`: add `'phase'` to the list of kinds that
  end the scan. Otherwise the scan would run on past the cast's effects into the next phase.
- `tests/sim/battle/replay.test.ts`: one case shows that a `phase` event changes no unit.
- Any `byRound`-style helper skips `phase` where it counts events.

Nothing else should change. If any statistical balance test or determinism test changes,
that is a draw-order bug.

### S1.8 Content and docs in the same commit

- `docs/04-battle.md`: "Replay log" and the new Implementation decision "Replay detail"
  (see Spec text).
- `docs/06-architecture.md`: the `STATE_VERSION` 2 note and the save-size note.

### S1.9 Tests

**`tests/sim/battle/golden.test.ts` plus `golden.json`.** S1 lands as two commits:

- `Phase 10 S1: pin battle logs before the detail refactor`.
  - It adds `scripts/golden-battle.ts`, which writes one hash per fixture and seed.
  - It runs on 30 named fixtures × 5 seeds: `starting`, `clash300`, `grind16`, `immortal`,
    and the architecture's list below.
  - Each hash is the 53-bit hash of the JSON of `{ winner, rounds, replay, rngAfter }`,
    the same hash `src/sim/hash.ts` uses.
  - The test asserts the current code matches.
- `Phase 10 S1: battle detail sink and re-runnable records`.
  - The golden test now strips A1 to A5 before hashing.
  - It must still match. This is the proof that A1 to A5 and the refactor moved no draw.

The pin stays until a deliberate rule or content change regenerates it with
`npm run golden:battle` in the same commit, which the commit message names.

Fixtures (shared later with S2 and the lab, in `src/present/battle/fixtures/named.ts`):

- `starting`, `clash300`, `skirmish`, `archerScreen`, `cavalryCharge`, `berserkers`,
  `rout`, `retreatScript`, `pdDefense`, `stormFort`
- `pyreStorm`, `mageDuel` (all 11 spells), `swarm`, `fireShield`, `lifeDrain`
- `stormField`, `fogField`, `wallField` (test spells, as in `spells.test.ts`)
- `giants`, `commanderDuel`, `wyrm`, `monolith`, `oracle`, `wildSpirit`, `salamander`,
  `treant`
- `grind16`, `grind50`, `huge300` (8 mages), `immortal`

In S1 the fixture builders live in `tests/sim/battle/fixtures/named.ts`, built on the
existing helpers in `tests/sim/battle/fixtures.ts`. S2 moves them, unchanged, to the pure
`src/present/battle/fixtures/named.ts`, so the lab and the presentation tests share them.

**`tests/sim/battle/detail.test.ts`:**

- *Equivalence*: every fixture × 20 seeds, fought once without a sink and once with one,
  from equal `createRng(seed)`.
  - `result` is deep-equal: replay, winner, rounds, casualties, both outcome maps, roster.
  - The rng state after the battle is equal.
- *Consistency per phase and pair*:
  - strikes with `hit` add up to `hits`;
  - strikes whose `landing.hpBefore` is 0 add up to `onFallen`;
  - strikes with `damage.rolled === 0 && hpBefore > 0` add up to `blocked`;
  - strikes with `killed` add up to `kills`;
  - the sum of `dealt` equals `dmg`;
  - the number of strikes equals `attacks`.
- *Other consistency*:
  - `spellHit` kills add up to the `damage` events' kills.
  - Each member dies at most once.
  - No member strikes in a phase after the one it died in.
  - For every group: start HP − outcome HP = Σ `dealt` (strike, spellHit, burn) − Σ heals.
  - `engage.contact` contains every group that struck in melee.
- *Order*: the guarantees of S1.3.
- *Invariants on every stored log*:
  - `blocked + onFallen + kills ≤ hits ≤ attacks`;
  - `0 ≤ dmg`;
  - phase markers come in step order within a round and never two alike in a row;
  - `foldReplay` ends where the result ends.

**`tests/sim/battle/rerun.test.ts`:**

- Records produced by `fight()` re-run and match, both in the same session and after
  `JSON.parse(JSON.stringify(state))`.
- `record.rerun.rng` equals `state.rng` just before the battle.
- AI-only battles store no record.
- `fromSetupRecord` throws on an unknown spell id.
- `matchesRecord` is false after one stat in the setup is tampered with.
- Every number in a fixture setup is finite.
- Integration: a scripted 2-nation game with a human nation runs 365 days, and every stored
  record re-runs and matches.
- Size pins (S1.6).
- Migration from version 1 to 2 on a hand-made v1 state. A bad `rerun` loads as `null`.

**`tests/sim/battle/morale.test.ts`:** `mustCheck`, `breakThreshold`, and `fearless` agree
with `shaken()`, `breaks()`, and `neverChecks()` on a grid of inputs.

**Purity:** unchanged (S1 adds no directory).

Gate: `npm run typecheck && npm run lint && npm test`.

---

## S2. The pure timeline and cue builder

### S2.1 Files and guard

```
src/present/                         PURE: no DOM, Pixi, Web Audio, React, Zustand,
                                     Math.random, Date, performance, crypto
  rand.ts                            hash32(...parts), streamFor(battleId, purpose): RngState
  battle/
    prepare.ts                       record -> PreparedBattle (re-run and verify, or fallback)
    script.ts                        PreparedBattle -> BattleScript (both modes, one IR)
    synth.ts                         fallback: blows from A2 tallies
    looks.ts                         lookFor(unit), spellLookFor(spell): content lookups with fallbacks
    layout.ts                        stage geometry, blocks, lanes, clash line
    proxies.ts                       visible(), sprite files, literal deaths and ghost bodies
    sample.ts                        mandatory sets, stratified ranking, featured strikes
    pacing.ts                        windows, brisk rounds, montage, the 150 s cap -> PacedScript
    emit/                            per-phase cue emitters
      common.ts scripts.ts ranged.ts melee.ts morale.ts deaths.ts end.ts intro.ts
    timeline.ts                      buildTimeline(): orchestration, sorting, beats, stats
    timemap.ts                       story <-> real: speed, Beats mode, slow motion, hit-stop holds
    keyframes.ts                     actor and field state per round start
    evaluate.ts                      evaluateInto(frame, timeline, t, view)
    rig.ts                           pose -> part transforms (closed form)
    camera.ts                        cameraAt(t): shake (trauma squared), zoom, desaturation
    particles.ts                     particleAt(burst, i, age, out): closed form
    view.ts                          ViewFilter: gore, motion, flashes, budgets, flash limiter
    panel.ts                         PanelState at t (docks), break chance
    ticker.ts                        ticker and Log lines with their times
    report.ts                        text Report per round
    clock.ts                         playhead arithmetic over an injected TimeSource
    check.ts                         timeline invariants (tests and the lab's Verify)
    fixtures/named.ts random.ts      fixtures moved from tests in S1; randomBattle(seed, opts)
  sound/                             S3
src/content/presentation/            DATA, pure (already under src/content)
  types.ts                           every presentation data type (present imports these; never the reverse)
  layout.ts pacing.ts impact.ts particles.ts floaters.ts
  looks/units.ts looks/weapons.ts looks/materials.ts looks/spells.ts looks/terrain.ts
  sound/                             S3
```

Guard changes, in S2's first commit:

- `eslint.config.js`:
  - Add `'src/present/**'` to `PURE_DIRS`.
  - Add the patterns `'**/audio'`, `'**/audio/**'`, `'**/lab'`, and `'**/lab/**'` to
    `no-restricted-imports`.
  - Add `AudioContext`, `OfflineAudioContext`, `AudioBuffer`, `AudioNode`, `window`,
    `document`, `requestAnimationFrame`, `setTimeout`, and `setInterval` to
    `no-restricted-globals`.
  - Add a second block for `src/sim/**`, `src/mapgen/**`, `src/content/**`, and `src/ai/**`.
    It repeats the full paths and patterns list (flat config does not merge
    `no-restricted-imports`) and adds `'**/present'` and `'**/present/**'`.
  - Add `src/audio/**` and `src/lab/**` to the browser-globals block. `src/audio/*.worker.ts`
    gets `globals.worker`.
- `tests/sim/purity.test.ts`:
  - Add `'src/present'` to `PURE_DIRS`.
  - Add `src/audio` and `src/lab` to `FORBIDDEN_DIRS`.
  - Add a second check: files under the core pure directories never resolve an import into
    `src/present`.
- `tsconfig.sim.json` `include`: add `"src/present"`.

Presentation randomness:

- Every variation comes from `streamFor(battleId, purpose)`, which is
  `createRng(hash32(battleId, purpose))`. It uses the sim's xoshiro algorithm on its own
  state, never `state.rng`.
- Per-cue choices hash `(battleId, cue.key, role)`.
- The purposes are `layout`, `synth`, `sample`, `stagger`, `pose`, `particles`, `decals`,
  `variant`, and `thin`. Changing one stage never reshuffles another.

### S2.2 Content: looks, layout, pacing, impact

All presentation numbers are data in `src/content/presentation/**`. Tuning changes are
recorded in `docs/09-balance.md` under "Battle presentation". `lookFor(unit)` derives a
fallback from content (tags, size, prot, weapon names, nation), so a new unit never breaks
the viewer. `tests/content/presentation.test.ts` lists every unit that uses a fallback. Per
CLAUDE.md, a new unit, spell, or chassis gets its look in these fixtures.

```ts
// content/presentation/types.ts (excerpt)
export type Archetype = 'lightInfantry' | 'heavyInfantry' | 'archer' | 'skirmisher' | 'cavalry' | 'berserker'
  | 'sacredWarrior' | 'mage' | 'priest' | 'scout' | 'leader' | 'wolf' | 'giant' | 'treant' | 'salamander'
  | 'swarm' | 'sprite' | 'oracle' | 'titan' | 'wyrm' | 'monolith' | 'spirit' | 'colossus';
export type Rig = 'biped' | 'quadruped' | 'rider' | 'serpent' | 'treant' | 'swarm' | 'sprite' | 'wyrm' | 'slab' | 'spirit';
export type Material = 'soft' | 'mail' | 'scale' | 'plate' | 'bark' | 'wood' | 'hide' | 'stone' | 'ember' | 'none';
export type Blood = 'red' | 'sap' | 'ember' | 'ichor' | 'wisp' | 'none';
export type Voice = 'human' | 'berserk' | 'wolf' | 'horse' | 'giant' | 'treant' | 'salamander' | 'sprite'
  | 'swarm' | 'stone' | 'wyrm' | 'spirit' | 'colossus';
export type Motion = 'thrust' | 'couched' | 'chopThrust' | 'chop' | 'greatChop' | 'slash' | 'sweep' | 'smash'
  | 'slam' | 'punch' | 'stab2' | 'bonk' | 'pounce' | 'neckLunge' | 'rake' | 'darts' | 'dive' | 'shove'
  | 'bow' | 'longbow' | 'fireBow' | 'javelin' | 'breathCone' | 'breathSweep';
export type Weight = 'light' | 'medium' | 'heavy' | 'huge';
export type DeathStyle = 'fallBack' | 'crumple' | 'thrown' | 'faceDown' | 'impaled' | 'riderSplit' | 'topple'
  | 'burnOut' | 'dissipate' | 'shatter';
export interface WeaponLook { motion: Motion; weight: Weight; projectile?: ProjectileKind; sound: SwingFamily }
export interface UnitLook {
  archetype: Archetype; rig: Rig; visualSize?: number; material: Material; blood: Blood; voice: Voice;
  voiceFlavor?: 'harsh' | 'breathy' | 'deep'; shield?: 'round' | 'kite'; mount?: 'horse' | 'wolf';
  flying?: boolean; corpse: boolean; deaths: readonly DeathStyle[]; weapons: readonly WeaponLook[];
  extras: readonly ('aura' | 'stealth' | 'regen' | 'fireShield' | 'charge' | 'rage' | 'immobile')[];
}
```

**Unit looks.** These merge spectacle 4.12 with sound 4.17. Size comes from content. Scale
armor is the Cinder Horde's (`docs/09`).

| Unit | Archetype / rig | Material | Blood | Voice | Notes |
|---|---|---|---|---|---|
| Ash Militia, Thorn Militia, Light Infantry, Swamp Fighter | lightInfantry / biped | soft | red | human (harsh / breathy / plain) | Swamp Fighters do not splash in swamp |
| Cinder Warrior | heavyInfantry / biped | scale | red | human harsh | jagged axe |
| Heavy Infantry | heavyInfantry / biped | plate | red | human | |
| Warden | heavyInfantry / biped, round shield | bark | red | human breathy | shield reactions |
| Briar Guard | heavyInfantry / biped | bark | red | human breathy | halberd (parries as a haft) |
| Ember Skirmisher | skirmisher / biped | soft | red | human harsh | javelin run-up; knife when out of javelins |
| Flame Archer, Longbow Hunter, Archer | archer / biped | soft | red | human | fire arrows, high arcs, plain |
| Berserker | berserker / biped | soft | red | berserk | rage (S2.10) |
| Ash Rider | cavalry / rider (horse) | scale | red | human harsh + horse | charge with lance |
| Wolf Rider | cavalry / rider (wolf) | bark | red | human breathy + wolf | rush, howl; bite and spear both strike |
| Flamebrand | sacredWarrior / biped | scale | red | human harsh | burning blade, sacred aura |
| Oakheart (size 2) | sacredWarrior / biped | wood | sap | human breathy deep | oak maul, splinters |
| Fire Sprite | sprite | none | ember | sprite | flying; no corpse (scorch dot) |
| Hornet Swarm | swarm (12 dots per sprite) | none | ichor | swarm | flying; no corpse |
| Cinder Scout, Thorn Scout | scout / biped | soft | red | human | 50% translucent until it acts |
| Ash Chieftain, Warden Captain, Independent Captain | leader / biped, banner (Captain: shield) | scale / bark / mail | red | human deep | |
| Pyre Priest, Grove Priest | priest / biped | soft | red | human | |
| Ember Adept, Cinder Magus, Sapling Druid, Elder Druid | mage / biped | soft | red | human | the Magus and Elder are larger |
| Salamander (size 3) | salamander / serpent | ember | ember | salamander | breath (ammo 6); then a tail lash (unarmed, str damage) |
| Treant (size 4) | treant | wood | sap | treant | regeneration, creaks |
| Wolf | wolf / quadruped | hide | red | wolf | |
| Giant (size 4) | giant / biped | soft | red | giant | footsteps |
| Oracle (size 2) | oracle / biped, floating 10 wu | soft | red | human deep | aura ring in the dominant color |
| Titan (size 4) | titan / biped | plate | red | giant (rate 0.9) | great sword sweeps up to 3 foes |
| Great Wyrm (size 6) | wyrm | scale | red | wyrm | flying; breath shown in the nation's color |
| Living Monolith | monolith / slab, visual size 6 | stone | none | stone | immobile; glyph pulse (unarmed, **str damage**) |
| Wild Spirit (size 2) | spirit | hide | wisp | spirit | stealthy flicker, regenerates, dissolves |
| Ash Colossus (size 5) | colossus / biped | ember | ember | colossus | fire shield licks back at strikers |
| Garrison | none | — | — | — | never fights; no look |

**Weapon motions.** Times are windup / strike / recover in seconds at 1x. The lunge is toward
the foe and back. Size 3 bumps a weapon one weight class up; size 4 and up makes it huge.
Fallbacks come from the weapon name and its damage (3 or less light, 4 to 6 medium, 7 to 9
heavy, 10 or more huge).

| Weapon (units) | Motion | Weight | Timing | Lunge | Detail |
|---|---|---|---|---|---|
| Spear (militia, Light Inf., Swamp Fighter, Wolf Rider) | thrust | medium | 0.10/0.06/0.14 | 14 wu | rear ranks jab over shoulders |
| Lance (Ash Rider) | couched | heavy | 0.08/0.05/0.15 | 18 wu | first melee round: charge (S2.9) |
| Halberd (Briar Guard) | chopThrust | heavy | 0.18/0.07/0.20 | 12 wu | arc -70 to +30 degrees |
| Axe (Cinder Warrior, Chieftain) | chop | medium | 0.13/0.06/0.15 | 10 wu | ash flakes |
| Great Axe (Berserker) | greatChop | heavy | 0.18/0.07/0.20, ×0.85 in rage | 14 wu | backhand second chop 30% |
| Sword (Warden, captains, Heavy Inf., Ash Rider) | slash | medium | 0.12/0.06/0.14 | 10 wu | 2-frame white smear |
| Burning Blade (Flamebrand) | slash | medium | 0.12/0.06/0.14 | 10 wu | 8-ember trail |
| Great Sword (Titan) | sweep | huge | 0.35/0.10/0.35 | 20 wu | hits up to 3 adjacent foes |
| Oak Maul (Oakheart) | smash | heavy | 0.20/0.08/0.22 | 12 wu | ground puff |
| Club (Giant) | smash | huge | 0.35/0.10/0.35 | 18 wu | dust ring; neighbors stagger |
| Crushing Limbs (Treant) | slam | huge | 0.40/0.10/0.40 | 16 wu | leaves shed |
| Burning Fists (Ash Colossus) | punch | huge | 0.30/0.08/0.30 | 18 wu | fire burst on contact |
| Dagger, Knife | stab2 | light | (0.06/0.04/0.08)×2 | 8 wu | |
| Staff (priests, mages, Oracle) | bonk | light | 0.10/0.06/0.12 | 8 wu | staff head glows in the caster's color |
| Bite, Wolf Bite (wolves) | pounce | medium | 0.12/0.06/0.16 | 18 wu hop | worries the foe 0.2 s on a wound |
| Bite (Great Wyrm) | neckLunge | huge | 0.30/0.08/0.35 | 40 wu | lifts and drops a killed foe |
| Claws (Wild Spirit) | rake | medium | 0.12/0.05/0.18 | 24 wu leap | three claw streaks |
| Sting (Hornet Swarm) | darts | light | (0.05/0.03/0.05)×3 | 10 wu | the cloud contracts |
| Flame Touch (Fire Sprite) | dive | light | 0.10/0.05/0.15 | 20 wu dive | flare on contact |
| Unarmed (Monolith, out-of-breath Salamander, any unit without a melee weapon) | shove (Monolith: glyph shockwave; Salamander: tail lash) | light | 0.10/0.05/0.15 | 6 wu | **deals str damage; can wound and kill** |

| Ranged weapon | Motion | Projectile | Arc apex | Flight at 1x | Detail |
|---|---|---|---|---|---|
| Shortbow | draw 0.30, loose, recoil 0.12 | arrow | 110 wu | 0.65 s | |
| Longbow | draw 0.40, recoil 0.15 | arrow | 180 wu | 0.85 s | the volley rises like a dark cloud |
| Fire Arrows | draw 0.35, tips lit | fireArrow | 150 wu | 0.80 s | ember trail; a hit ignites 1 s; a miss burns the ground 1.5 s |
| Javelins | 2-step run-up, throw | javelin (spinning) | 60 wu | 0.50 s | the thrower sprints 12 wu and back |
| Fire Breath (Salamander) | inhale 0.3 s (throat glows), stream 0.6 s | breath cone 260 wu | — | — | ground burns 2 s |
| Breath (Great Wyrm) | rear up, sweep the row 0.9 s | breath cone 320 wu | — | — | element shown by the nation's color (display only, `docs/05`) |

**Armor materials.** These are one table for the visuals and the sound. Bark Skin turns a
squad's material to bark while it lasts. The fallback from prot is:

- 0 to 2: soft.
- 3 to 6: mail (scale for the Cinder Horde, bark for Thornwood).
- 7 or more: plate (bark for Thornwood, wood for Thornwood size 2 and up).
- Constructs and immobile units: stone. Fire bodies: ember. Beasts: hide. Mindless flyers:
  none.

| Material | Deflect visual | Hit-through visual |
|---|---|---|
| soft | dull dust puff | blood as normal |
| mail | 6 yellow-white spark streaks | sparks + blood |
| scale | 8 sparks and a scale flake | sparks + blood |
| plate | 10 bright sparks and a ring flash | sparks + blood |
| bark | brown wood chips | chips + blood |
| wood | large splinters | splinters + sap |
| hide | tufts of fur | fur + blood |
| stone | grey chips and a grit puff | chips |
| ember | molten droplets that cool | droplets |
| none | whiff | burst by blood type |

### S2.3 `prepare` and the script

```ts
// prepare.ts
export type PreparedBattle =
  | { mode: 'detailed'; record: BattleRecord; setup: BattleSetup; detail: DetailEvent[] }
  | { mode: 'aggregated'; record: BattleRecord; reason: 'noRerun' | 'mismatch' | 'error' };
/** Re-runs with a sink inside try/catch and verifies with matchesRecord; falls back otherwise. */
export function prepareBattle(record: BattleRecord): PreparedBattle;

// script.ts
export type Outcome = 'miss' | 'blocked' | 'onFallen' | 'wound' | 'kill';
export interface Blow {
  seq: number;
  /** Stable cue key, e.g. "r3/melee/a1>d2/417". Seeds every presentation choice for this blow. */
  key: string;
  source: 'ranged' | 'melee' | 'spell' | 'burn';
  attacker: BattleUnitRef | null; attackerMember: number; weapon: number;
  target: BattleUnitRef; targetMember: number;
  outcome: Outcome;
  /** Detailed mode only. */
  rolls: { attack: number; attackDrn: number; defense: number; defenseDrn: number } | null;
  damage: DamageRoll | null;
  /** Exact per blow in detailed mode; null in the fallback (pairs know only their dmg total). */
  dealt: number | null; hpBefore: number | null;
  element: Element; spell: string | null; berserk: boolean; firstRound: boolean;
  synthetic: boolean;
}
export interface ScriptGroup {
  ref: BattleUnitRef; side: BattleSide; unit: UnitTypeId; isCommander: boolean; isPretender: boolean;
  leader: BattleUnitRef | null; startCount: number; startRow: Formation; maxHp: number; startHp: number;
  joined: { round: number; phase: BattlePhase } | null; weapons: readonly WeaponDef[]; ammo: readonly number[];
  /** Detailed mode: the setup's morale (with modifiers), for the break-chance meter. */
  mor: number | null;
}
export interface SpellBeat {
  caster: BattleUnitRef; spell: string; targets: BattleUnitRef[]; fatigue: number;
  blows: Blow[]; effects: BattleEvent[]; nth: number; firstInBattle: boolean;
}
export interface MoraleBeat {
  group: BattleUnitRef; cause: 'losses' | 'shock' | 'commanderDeath';
  roll: MoraleRoll | null; broke: boolean;
}
export interface ScriptPhase {
  kind: BattlePhase; events: BattleEvent[]; pairs: AttackTally[];
  fronts: Record<BattleSide, Formation | null> | null; contact: BattleUnitRef[] | null;
  firstContact: BattleUnitRef[];
  blows: Blow[]; spells: SpellBeat[]; morale: MoraleBeat[];
  /** Commander deaths logged in this span, with the killer when known. */
  deaths: { commander: BattleUnitRef; blow: Blow | null; byGroup: BattleUnitRef | null; spell: string | null }[];
}
export interface ScriptRound {
  round: number; phases: ScriptPhase[]; kills: number;
  /** No death, cast, rout, summon, advance, or leave, and kills <= max(1, 1% of living troops). */
  quiet: boolean;
}
export interface BattleScript {
  mode: 'detailed' | 'aggregated'; battle: string; scene: BattleScene; leftSide: BattleSide;
  groups: ScriptGroup[]; rounds: ScriptRound[]; winner: BattleSide;
  /** foldReplay at every phase end, for the panel checks. */
  folds: { round: number; phase: BattlePhase; state: ReplayState }[];
}
export function buildScript(prepared: PreparedBattle, leftSide: BattleSide): BattleScript;
```

**Detailed mode:**

1. Merge the stored log and the detail stream by `(at, emission order)`.
2. Bucket by A1 markers and by each detail event's `phase`.
3. Normalize `strike`, `spellHit`, and `burn` into `Blow`s:
   - `outcome` comes from `hit`, `landing.hpBefore`, `damage.rolled`, and `killed`.
4. Attach `morale` rolls.
5. Find each commander's killing blow.

**Fallback mode (`synth.ts`):**

- Phases come from A1 markers. Only records without A1 (none exist after S1) use the
  architecture's event-kind heuristic.
- For each pair tally, create `attacks` blows:
  - attackers round-robin over the attacker's living members and the weapons that fired
    (melee weapons, or `UNARMED` if none);
  - exactly `attacks − hits` misses, `blocked` blocked, `onFallen` on-fallen, `kills` kills,
    and `hits − blocked − onFallen − kills` wounds.
- Killed members are drawn from the living ones with `streamFor(battle, 'synth')`. On-fallen
  blows target members killed earlier in the same phase, ordered after their kill.
- Commander blows are exact from `damage` events, and their attacker group is `by` (A3).
  Spell kills are spread over the target group's living troops.
- `dealt` is null. Wound sizes for floaters come from the pair's `dmg` split evenly over its
  wounds and kills.
- The script satisfies the same tally identities as detailed mode.
- The viewer shows a "summary replay" chip, and the lab shows the reason.

### S2.4 Stage layout (spectacle 3.1 to 3.6)

- **World.** 1600 × 900 world units (wu), letterboxed to the canvas.
  - Center line at x = 800; horizon at y = 300.
  - The player's side is always on the left: `leftSide` comes from the UI.
  - Panel headers say ATTACKER or DEFENDER.
- **Bands,** measured from the center line and mirrored per side: front 80 to 280, middle 300
  to 470, rear 490 to 660, edge 660 to 800. The gap 0 to 80 is no-man's land.
- **Lanes.** Six lanes at y = 470, 535, 600, 665, 730, 795, filled in the order 600, 535,
  665, 470, 730, 795.
  - Squads are ordered by commander (setup order), then by roster order. A seventh squad in a
    row takes a second slot in the outer half of the band.
  - A commander stands at its squads' mean lane, in the band's outer third, with its banner
    pole 30 wu behind it. `advance` strides it to the front band.
  - Summons take the next free lane of `summon.row`. Provincial defense stands under a plain
    banner in the owner's color, labelled "Provincial defense".
- **Scale by size.**

  | Size | Scale | Cap | Grid | Spacing |
  |---|---|---|---|---|
  | 1 | 1.00 | 20 | 4×5 | 24, 14 |
  | 2 | 1.30 | 12 | 3×4 | 32, 17 |
  | 3 | 1.70 | 6 | 2×3 | 44, 22 |
  | 4 | 2.20 | 4 | 2×2 | 58, 30 |
  | 5 | 2.70 | 2 | 1×2 | 70, 34 |
  | 6 | 3.40 | 1 | 1×1 | — |

  - A size-1 troop stands 46 wu tall in the nearest lane.
  - Commanders draw at 1.15× their size's scale.
  - Perspective scale is `0.88 + 0.12 × (y − 470) / 325`. Everything is z-sorted by y.
  - Every sprite casts an elliptical shadow at alpha 0.25. A flyer's shadow stays on the
    ground and shrinks with altitude.
  - Block positions get ±4 wu of jitter from `streamFor(battle, 'layout')`. Positions are
    quantized to 0.5 wu and times to whole ms.
- **The clash line.**
  - When both fronts are in their front rows, the clash line is at the center plus a push
    offset of 30 wu × (kills dealt − kills taken) / (kills dealt + kills taken) over the
    last two melee phases, eased over 1 s.
  - When a side's front has fallen back to its middle or rear row, the other side's engaged
    blocks advance into that band. The clash line moves to the band's inner edge, so a
    collapse visibly opens the formation (`docs/04`: melee advances when its target row is
    empty).
  - Engaged front files stand 14 wu apart and interlock. Blocks never cross the clash line,
    except for pursuit.
- **Backdrops by terrain** (from A5):
  - four parallax layers (sky, far, mid, ground) plus foreground props;
  - the ground is the `docs/09` terrain fill darkened 25%;
  - per-terrain ambient motion and special effects as in spectacle 3.5. Examples: farmland
    churns, swamp corpses sink 30%, mountains have snow flurries.
  - The storm variant shows the fort wall behind the defender's rows. With walls standing,
    defender archers stand on the rampart; with walls breached, a rubble gap and smoke.
  - Time of day (dawn, day, or dusk) comes from the hash of the battle id. The season comes
    from the record's day: months 11 to 2 add frost and breath puffs; months 9 and 10 add
    autumn leaves.
- **The field remembers.** Decals are baked into a ground render texture until the battle
  ends: corpses (darkened to 55%, rotated as they fell, on their pool), blood pools,
  stuck arrows, dropped weapons and shields, scorch, burning patches, Regrowth flowers,
  severed parts (Brutal), and churned mud along the clash line, which darkens with the kills
  there.

### S2.5 Proxies: sprites that read true strength

```ts
// proxies.ts
/** Standing sprites for a group of `count` living troops that started with `start`. */
export function visible(count: number, start: number, cap: number): number {
  if (count <= 0) return 0;
  if (start <= cap) return count;
  return Math.min(cap, Math.max(Math.ceil((cap * count) / start), Math.min(count, 5)));
}
export interface SpriteFile {
  actor: ActorId; group: BattleUnitRef; slot: number;
  /** The troop this sprite is drawn as (wound tint follows it). */
  rep: number;
  /** Living troops this sprite stands for; their blows are drawn by this sprite. */
  members: number[];
}
export type KillShown =
  | { kind: 'literal'; actor: ActorId; member: number }
  | { kind: 'ghost'; actor: ActorId; member: number; offset: Vec };
export interface ProxyState { /* files per group, member -> actor, living counts */ }
export function startProxies(groups: readonly ScriptGroup[], caps: Readonly<Record<number, number>>): ProxyState;
/** Applies one kill in timeline order and says how it is shown. */
export function applyKill(state: ProxyState, group: BattleUnitRef, member: number): KillShown;
export function actorOf(state: ProxyState, group: BattleUnitRef, member: number): ActorId;
```

**Rules.**

At the start, a group shows `V = visible(start)` sprites. Sprite `i` holds members
`[floor(i·start/V), floor((i+1)·start/V))`, and its representative is the first of them.

A kill of member `m` works as follows. Let `s` be the sprite whose file holds `m`.

- **If `visible(n − 1) < visible(n)`, `s` dies literally.** First `s` is rebound to `m`. Then
  its other living members move round-robin to the nearest standing sprites (by grid
  distance, ties by slot).
- **Otherwise a ghost body of `m` falls** at `s`'s position plus an offset: ±10 wu across,
  0 to 12 wu toward its own rear. `s` staggers 8 wu and recovers. If `m` was `s`'s
  representative, the lowest living member of `s`'s file becomes the new representative. An
  empty file takes one member from the largest neighboring file.

**Invariants:**

- Standing sprites always equal `visible(n)`.
- Every kill produces exactly one literal death or one ghost body.
- Every standing sprite has a file that is not empty.
- When `n ≤ 5`, every file holds exactly one troop.

**What a sprite shows.**

- In detailed mode, wound tint is the representative's HP fraction, tracked from the
  landings. The red rim strength is 0.6 × (1 − hp/maxHp). The fallback shows a fixed light
  tint after a sampled wound.
- Commanders are one sprite with a file of one. Their HP bar is exact in both modes.

### S2.6 Sampling and ranks

Per ranged or melee phase:

**Mandatory items** are always shown at every speed and count against no budget:

- melee: the killing blow of every literal death; every blow that hit a commander; up to
  **6 featured strikes**;
- ranged: every killing shot, whether its kill is literal or a ghost; every shot that hit a
  commander;
- every ghost body (`ghostFall`). Its killing blow is drawn if that blow is sampled.
  Otherwise the body falls inside the block, "cut down in the press", at a time spread over
  the window.

**Featured strikes** are chosen by score; ties go to the key hash, with at most one per
attacking sprite. The score adds:

- +5 for a kill by or on a unit of size 3 or more;
- +5 if a commander or pretender is involved;
- +4 for a charge's first impact;
- +3 for the last kill of a squad;
- +2 for the phase's highest-`dealt` kill;
- +2 for a kill with `attackDrn ≥ 18`, which is detailed mode only (an exploding roll,
  about 5% of rolls).

**Ranked items: every other blow, in one fixed order.**

1. **Coverage:** one blow per engaged pair that has no mandatory blow, pairs by `attacks`
   descending.
2. **Then a two-level stratified order:**
   - Pairs are picked by Sainte-Laguë on `attacks` (the next item goes to the pair with the
     smallest `(taken + 0.5) / attacks`).
   - Within a pair, outcome classes are picked by Sainte-Laguë on that pair's class counts
     (miss, blocked, onFallen, wound, ghost-kill).
   - Within a class, items go by importance: `dealt` descending; then a blow between a sprite
     pair that dueled in the previous melee phase; then `hash32(battle, key)`.

```ts
export interface Ranked<T> { item: T; rank: number }
/** Every prefix keeps class counts within 1 of share × length. */
export function stratifiedOrder<T>(items: readonly T[], classOf: (t: T) => string, weightOf: (cls: string) => number,
  within: (a: T, b: T) => number): T[];
export interface PhaseSample { mandatory: Blow[]; featured: Blow[]; ghosts: KillShown[]; ranked: Ranked<Blow>[] }
export function samplePhase(phase: ScriptPhase, proxies: ProxyState, battle: string, limit: number): PhaseSample;
```

The timeline keeps ranked items up to the 1x budget. A view at speed `s` shows rank `r` when:

```
r < max(B(s) − |mandatory|, s ≤ 1 ? coverageCount : 0)
```

Every threshold is non-increasing in speed, so the set at 4x ⊂ 2x ⊂ 1x = 0.5x.

| Budget `B(s)` per phase | 0.5x and 1x | 2x | 4x |
|---|---|---|---|
| Melee strikes | 90 | 55 | 30 |
| Projectiles | 400 | 240 | 120 |

Every engaged sprite that has no shown strike plays **ambient fighting**: feints, shoves,
and swings that hit nothing. So the line looks busy at any budget.

### S2.7 Pacing

All durations below are **real seconds at 1x with slow motion and hit-stop on**. The builder
subtracts the time map's slow-motion stretch and holds from each story span, so the real
duration matches the table.

| Segment | Duration | Rules |
|---|---|---|
| Intro | 3.0 s (Beats 1.2 s; a click skips) | armies march in; horns; pretender spotlight 1.2 s inside it |
| Round card | 0.5 s, overlapping the previous tail by 0.2 s | |
| Scripts (casts) | per cast, chained | full form the first time a spell is cast in the battle; short form (charge halved, no caption) on the second; **brief form 0.5 s** from a caster's third cast of the same spell when the spell is below level 3 and kills fewer than 3 |
| Scripts (chaining) | | cast k+1's charge starts at cast k's release, and its impact never lands before cast k's; once the phase passes 5.0 s, each further cast takes 0.3 s; advance 0.8 s and retreat 0.6 s play in parallel with the casts |
| Ranged | 1.7 s when any volley | draw 0.35, ripple 0.25, flight 0.5 to 0.85, landing 0.3 |
| Melee | 2.4 s; first contact 4.0 s | +0.25 s per 10 visible deaths over 20; cap 4.8 s; a charge plays inside the window |
| Commander death | +2.4 s for the first in a phase, +0.8 s for each more; pretender +3.6 s | inserted after the span that killed it |
| Morale | 0.3 s if any squad checked (detail) or any kill (fallback); 1.0 s for the first rout, +0.3 s each more, cap 2.2 s | runners keep running in the background |
| End of round | 0.4 s if the span logged anything | regeneration, expiries, field ends |
| Outro | 2.5 s, then the result card holds | |

**Compression** runs in this order, in the builder:

1. **Brisk rounds.** A round with `intensity = visibleDeaths + 8 × beats < 3` plays at half
   its durations, with a floor of 1.0 s.
2. **Montage.** A run of 4 or more quiet rounds becomes one segment.
   - Its length is `min(4.0, 1.5 + 0.15 × n)` s, with an interlude card "Rounds a to b: the
     lines grind on".
   - One compressed melee window samples blows from the whole run.
   - Every death is shown, and the counts tick through.
   - A seek into the montage maps each round to its share.
3. **Cap.** Let T be the real duration at 1x with default settings, `toReal(duration)`.
   - If T > 150 s, every non-cinematic segment is scaled by `k = max(0.45, 150 / T)`, with a
     floor of 0.7 s per round.
   - If T is still over 150 s, the builder turns the lowest-intensity rounds without a beat
     into montages: runs of 2 first, then single rounds, lowest first, until it fits.
   - The loop always ends, because each step removes a round.

**Modeled on real logs** with these rules (`final-measure/pace.ts`, a rough pacer):

| Fixture | 1x average | 1x worst | Beats mode |
|---|---|---|---|
| `starting` | 42 s | 61 s | 21 s |
| `clash300` | 83 s | 96 s | 45 s |
| `grind16` (27 rounds) | 62 s | — | 21 s |
| `immortal` (50 rounds) | 15 s | — | — |

The test targets are in S2.17.

**Beats** have weights, which set the scrubber icon size and Beats mode:

| Beat | Weight |
|---|---|
| battle end, pretender death | 20 |
| side breaks, round-50 withdrawal | 12 |
| first contact, commander death | 10 |
| cavalry charge, pretender's first action | 8 |
| summon, field effect | 7 |
| a spell of level 3 or more, or any spell that kills 3 or more | 6 |
| a rout of 10% or more of its side's starting troops | 6 |
| a squad wiped out | 4 |
| any other rout | 3 |

A beat's span is its own cue span: the cast, the window, or the sequence. It is not the
whole phase.

### S2.8 Choreography (spectacle sections 4 and 7, as cue emitters)

- **Idle life.**
  - A 2 wu breathing bob over 1.2 s, with a phase offset per sprite, and a 3 degree weapon
    sway.
  - A random fidget every 4 to 9 s.
  - Banners ripple; a squad's pennant sits on its front-left sprite.
  - Front ranks brace while they wait for contact.
- **Closing.** At each `roundStart` before a block's closing round, front-row melee blocks
  step a share of the gap: speed 1 steps 25 wu, speed 2 steps 35 wu, speed 3 steps 50 wu,
  with dust. Archers hold.
- **Contact.** The rest of the gap is covered in the first 25% of the melee window:
  - speed 1 advances in step (0.9 s);
  - speed 2 runs (0.7 s);
  - speed 3 and flyers charge (0.5 s).
- **Who fights whom.** Duels come from the sampled blows. A sprite steps over a body (0.2 s)
  to its next foe. A block that outnumbers its foes flanks them, 2 or 3 sprites on one foe at
  y ±12. A unit of size 3 or more is mobbed by up to 5 small sprites. Cross-lane strikes go
  diagonal.
- **Mutual kills.** A sprite that dies in a phase may still land its own blow first: every
  blow was rolled against the field as the phase began. So two bodies fall together.
- **Defense reactions on a miss**, by target:

  | Target | Reaction | Visual and sound |
  |---|---|---|
  | has a shield | shield 70%, parry 30% | thunk |
  | def 12 or more, beasts, flyers | dodge (sidestep 6 wu, or duck) | whoosh |
  | others | parry 50%, dodge 50% | parry: weapons meet, 4 white sparks |
  | constructs, the Monolith | whiff | |

- **`blocked`** shows sparks or chips by material (S2.2) and a 2 wu flinch. When more than
  60% of a pair's hits in a phase are blocked, an **ARMOR** chip pops over the target block
  for 1 s.
- **`onFallen`: follow-through.** The blow lands on a falling or fallen body:
  - a hack into the corpse;
  - a small spray at gore Standard, dust at gore Off;
  - no cry, and no flinch on any living sprite.
- **`wound`.** A white one-frame flash, then a red tint for 0.15 s, a blood spray, a 4 wu
  knockback, and a blood drop decal.
- **Cavalry charge.** The first melee of a squad that is mounted, has a `firstRoundBonus`
  weapon, or has speed 3:
  - 0.0 s: lances lower;
  - 0.2 to 0.7 s: gallop, with a dust trail and the ground trembling under the target;
  - 0.7 s: impact, with a global stop of 120 ms and trauma 0.25 + 0.01 per visible rider
    (cap 0.45);
  - the target's front file is thrown back 12 to 24 wu;
  - a lance kill (`firstRound` in detail) lifts its victim 6 wu;
  - 0.7 to 1.0 s: the riders plow 10 wu in.

  When riders meet riders, both blocks are thrown back 8 wu. On a mounted death the rider
  falls back; the mount collapses (60%) or bolts riderless (40%).
- **Archers.**
  - The squad draws together, then looses in a ragged ripple over 0.25 s with a 4 wu
    recoil.
  - Projectiles spawn across the block at bow height, one per real shot, each on its own
    ballistic arc.
  - A kill sticks in the body and stays with the corpse. A wound sticks in the sprite (at
    most 3 shown, a pincushion). Blocked arrows glance off with a spark, or snap on bark. A
    shield block sticks in the shield. A miss sticks in the ground 10 to 40 wu off the
    target, or splashes in swamp.
  - Ammunition is counted against the content's `ammo` (from the setup, or `unitDef` in the
    fallback). At empty the bows are slung and knives drawn, and the ticker says "out of
    arrows".
  - In a storm field, archers shield their faces and close to melee, as the sim now does.
- **Berserkers.**
  - Before contact they stamp, beat their chests, and jitter at 15 Hz, 10 wu ahead of the
    line.
  - On contact they roar and swing at ×0.85.
  - In detailed mode, rage shows from the first blow with `berserk: true`. In the fallback it
    shows from the first wound the squad takes.
  - They never rout. At the last five sprites, each gets a red rim pulse. The last death is
    featured.
- **Flyers.**
  - They hover 40 to 80 wu up and close in round 2 by flying over the gap.
  - They attack in swoops: dive 0.25 s, strike, climb 0.3 s.
  - Fire Sprites burst into embers and leave a scorch dot. A swarm sprite loses its 12 dots.
  - The Wyrm falls from the sky over 1.4 s, with trauma 0.5.
- **Monsters** (size 4 and up):
  - every step raises dust, a 2 wu tremor, and trauma 0.04;
  - the windup is 0.35 to 0.4 s with the whole body;
  - a huge impact staggers 2 or 3 neighbors (cosmetic; only logged kills die);
  - a wound knocks off a chunk of bark, stone, or flesh;
  - they topple over 0.9 to 1.4 s.

  The Treant's bark knits at `heal`. The Titan's sweep can kill up to 3 sprites in one
  swing, when 3 of its real blows land on that file region.
- **Pretender bodies** (spectacle 4.11):
  - The Oracle floats and its robe collapses empty.
  - The Titan kneels, then falls; its sword stands upright.
  - The Wyrm falls from the sky, and the ground shakes twice.
  - The Monolith pulses glyphs; cracks spread over 1.2 s and it shatters into rubble.
  - The Wild Spirit flickers and dissolves into wind and leaves.
  - The Ash Colossus burns and breaks into glowing chunks.
- **Morale.**
  - **Shaken:** a squad that checks this round, from detail `morale` events or from
    `mustCheck()` in the fallback. For 0.4 s it glances back, steps back 4 wu, raises
    shields, and its pennant wobbles.
  - **Holds:** the squad braces and steps forward with a shout, and a HELD chip shows. In
    detailed mode the chip shows the roll, for example "12+7 vs 10+9".
  - **Rout:**
    1. the pennant drops (0.3 s);
    2. sprites turn, staggered over 0.3 s;
    3. 30% drop weapons and shields, which stay on the ground;
    4. they run to their own edge at 120 wu/s, some stumbling.

    Routers can still be cut down in their exit round; they die face down. At `leave`, the
    runners accelerate and fade over the last 40 wu.
  - **The line breaks:** when a side's last active group routs, the whole side flees, the
    ticker line is bold, and it is a beat.
  - **Round-50 withdrawal:** the attackers march off in order, banners up, and a card says
    "The attackers withdraw".
  - **Pursuit:** fast enemy blocks next to a routing block chase it 30 wu and return, over
    0.8 s.
- **Commander death** (spectacle 8.1, times relative to the killing blow):
  - −0.25 s: slow motion ramps to 0.3x, the camera pushes to 1.25×, and the field
    desaturates 60%.
  - 0 s: a global stop of 180 ms, trauma 0.2, the body falls, and the weapon spins away.
  - 0.3 to 1.3 s: the banner topples.
  - 1.0 s: slow motion ends.
  - 1.0 to 3.0 s: a **name card** slides in on the commander's side. It shows:
    - the portrait, name, and unit type;
    - "fell in round n";
    - the nation strip;
    - the killer: "slain by a Warden of the Wardens" (detail: the killing blow's group and
      unit), "slain by the Wardens" (fallback: `by`), or "burned by Fireball" (cast).

  Its squads then turn toward the banner. Further deaths in the same phase stack as 0.8 s
  cards without slow motion.
- **A god's death** (spectacle 8.2) is the same, but with:
  - slow motion at 0.2x for 2.0 s;
  - the whole field desaturated;
  - the body dissolving into its dominant color;
  - "THE GOD FALLS";
  - trauma 0.6.
- **Commander wounds:** the HP bar is exact. Below 50% HP the commander limps; below 25% it
  kneels between actions.

### S2.9 Impact grammar

**Hit-stop.** Local hit-stop is a pose hold on the two sprites, inside story time. Global
hit-stop is a time-map hold, applied only at 1x and below.

| Weight | Local, kill | Local, wound | Global (featured kills only) |
|---|---|---|---|
| light | 50 ms | 30 ms | 60 ms |
| medium | 70 ms | 40 ms | 80 ms |
| heavy | 100 ms | 50 ms | 100 ms |
| huge | 140 ms | 60 ms | 120 ms |
| commander killing blow | — | — | 180 ms, then slow motion |

Other global stops: a charge impact or first contact, 120 ms. At most one global stop per
450 ms of real time.

**Shake** follows a trauma model:

- Trauma is between 0 and 1 and decays at 1.5 per second.
- The offset is 12 wu × trauma² × 25 Hz smooth noise. The rotation is 0.5 degrees × trauma².

| Trauma source | Amount |
|---|---|
| kill, light or medium weapon | 0.03 |
| kill, heavy weapon | 0.06 |
| kill, huge weapon | 0.15 |
| footstep, size 4 and up | 0.04 |
| death, size 4 or 5 | 0.30 |
| death, size 6 | 0.50 |
| first contact | 0.35 |
| charge | 0.25 + 0.01 per rider, cap 0.45 |
| Fireball | 0.30 |
| each Pyre Storm meteor | 0.12, total cap 0.70 |
| commander death | 0.20 |
| pretender death | 0.60 |
| wall rises or falls | 0.25 |
| near thunder | 0.15 |

**Flashes, particles, bodies:**

- **Hit flash.** White-first: a white silhouette at 90% for one frame, then a red multiply
  fading over 0.15 s. White reads for every kind of color vision.
- **Sparks:** streaks at 40 to 90 wu/s, life 0.12 to 0.25 s.
- **Blood spray.**
  - Standard gore: 8 particles on a wound, 18 on a kill.
  - Brutal gore: 14 and 32, plus 1 or 2 chunks on heavy and huge kills.
  - The spray is a 50 degree cone along the strike, with gravity. Each droplet that lands
    leaves a 2 to 4 wu decal.
- **Pools:** radius grows from 0 to 8 wu × size over 1.2 s, then darkens over 10 s.
- **Bodies** stay where they fell, darkened to 55%. Weapons lie beside them.
- **Dust:** at footfalls, falls, charges, and big impacts, in the ground's color.
- **Dismemberment** (Brutal only):
  - 25% of heavy or huge kills detach a part (a head with its helmet, or an arm with its
    weapon), which tumbles 30 to 80 wu and stays.
  - 15% of huge kills on size 1 split the sprite in three.
  - Parts come from the rig, so the placeholder art supports it.
- **Gore on survivors** (Brutal): a sprite that killed in melee gets a blood decal on its
  weapon part.

**Blood by element and blood type:**

| Element or blood | Wound | Kill | Corpse |
|---|---|---|---|
| physical, red | red spray | spray, pool | normal |
| fire (weapons, spells, burns) | ember sparks, orange flash, smoke wisp | blackens over 0.3 s and collapses; flames 1.5 s | charred, smokes 3 s, scorch ring, no pool |
| nature (Thorn Spray) | splinters and leaves | impaled on thorns | thorns stay 2 s |
| cold, holy, decay (M2) | ice shards; white flare; green-black ooze | shatters or stiff fall; burns white from within; withers and sinks | frosted; ash outline; dark stain |
| sap | amber droplets, wood chips | splinters, creaking topple | log shape |
| ember | molten droplets | ember burst | glowing chunks cool to black over 4 s |
| ichor | yellow-green specks | the dots fall | none |
| wisp | — | dissolves into wind and leaves | none |
| none | stone chips | shatters | rubble |

**Gore Off:**

- grey-white dust puffs instead of blood;
- no pools, no dismemberment;
- corpses still fall and stay, as dark silhouettes: they are information.

**Death styles** are chosen from the unit's allowed set with `streamFor(battle, 'pose')` and
the killing blow:

| Style | Duration | When |
|---|---|---|
| fallBack | 0.5 s | |
| crumple | 0.55 s | 40% of light and medium kills |
| thrown | 0.7 s | 35% of heavy and huge kills, 40 to 80 wu, one bounce |
| faceDown | 0.45 s | while routing |
| impaled | 0.6 s | lance charge, thorns |
| riderSplit | 0.9 s | |
| topple | 0.9 to 1.4 s | size 3 and up |
| burnOut | 0.8 s | fire kill |
| dissipate | 0.5 s | |
| shatter | 1.2 s | |

**Damage numbers:**

- One rolling number per target block per phase, adding up `dealt`, or in the fallback the
  pair's `dmg` as its hits land. It rises 40 wu over 0.9 s, and the font grows with the
  amount from 18 to 34 px.
- A skull and a count for kills.
- Commander blows show exact numbers.
- Spell damage carries the element's color and glyph: flame, leaf, snowflake, sun disc, or
  skull-drop. A spell that did nothing shows a grey "0" and fizzles.
- Heals are green with a plus sign.
- With numbers off, only the skull counts stay.

### S2.10 Spells

**The five beats:**

1. **Charge:** the staff rises, the color's mana symbol shows, and particles gather in the
   color's motion.
2. **Release:** a ring in the color expands from the caster. A spell of level 3 or more adds
   a full-scene flash (S2.14).
3. **Travel:** a bolt, lob, sky fall, ground crack, wave, or nothing.
4. **Impact:** on the troops the sim chose (detail `spellHit`; fallback: the `cast` target
   groups and the `damage` kills).
5. **Linger:** lingering effects run under the next cues.

A caption shows above the caster for 1.2 s, for example "Cinder Magus: Fireball". All the
`buff` events from one cast play as one cue.

**Color grammar** (`docs/09` palettes):

| Color | Motion | Particles |
|---|---|---|
| Ember | rises and flickers; heat shimmer | ember sparks |
| Loam | spreads along the ground; cracks run | motes |
| Radiance | radiates straight lines | rays |
| Tide | ripples in rings | ripples |
| Umbra | sinks and drips; smoke falls | smoke |
| Holy (Bless) | rays from above | the Radiance palette |

Particle counts are 40 to 160 per burst for small casts (`docs/09`'s 12 to 40, raised at the
owner's direction) and up to 300 for large spells at High quality.

**The eleven M1 battle spells** (spectacle 6.3, kept). Durations are the full form; the short
form is in parentheses.

| Spell | Beats | Duration | Trauma |
|---|---|---|---|
| Ember Dart | flame bead 0.35 s; flat streak 0.2 s; pierces (a spark exits behind the target); a kill burns out; scorch dot | 0.9 s (0.6) | 0.03 |
| Fireball | orb 0.7 s; lob 0.55 s with apex 120 wu; explosion, 140 wu ring, 40 embers; kills thrown and burning; scorch decal 120 wu, smoke 2 s | 1.9 s (1.3) | 0.30 |
| Warcry | caster swells 0.3 s; a red ripple crosses its own side over 0.6 s; weapons rise, banners flare; "+2 MOR" chips | 1.3 s | — |
| Blood Fury | red tendrils 0.4 s flow to the squad; pulsing red veins at 1.2 Hz; "+2 ATT +3 STR −2 DEF" | 1.4 s | — |
| Pyre Storm (cinematic) | light dims 30%; a 200-particle vortex 1.3 s; camera 1.12×; 12 meteors 90 ms apart, each a streak and a burst; slow motion 0.6x over the first three; burning ground 4 s | 3.2 s (2.2) | 0.12 each, cap 0.70 |
| Thorn Spray | motes 0.35 s; a ground crack 0.3 s; spikes erupt under the 3 struck troops; kills impaled | 1.2 s (0.8) | 0.03 |
| Bark Skin | leaf spiral 0.3 s; bark creeps up the sprites over 0.6 s; "+3 PROT"; material becomes bark | 1.2 s | — |
| Entangle | earth cracks 0.45 s; roots burst; vines coil; lunges halved while entangled; "−3 DEF −1 ATT" with a countdown; vines wither at `expire` | 1.4 s | — |
| Swarm | buzzing swells 0.6 s; ground splits; 200 hornets boil out and coalesce into the block; badge "20" | 1.8 s | 0.10 |
| Regrowth | soil light 0.8 s; a green wave crosses its side over 0.8 s; flowers sprout; "+n" per squad; curses dissolve into petals | 2.0 s | — |
| Bless | sun-disc 0.3 s; a column of gold light 0.5 s; halo; "+1 MOR" | 1.0 s (0.6) | — |

**Buffs and debuffs by stat**, so that chips are not the only signal:

| Stat | Buff | Debuff |
|---|---|---|
| mor | banner glow | banner droops |
| att | red edge glint | weapons droop |
| str | swell ×1.04 | thin, grey rim |
| def | pale shimmer | cracked overlay |
| prot | plating overlay (bark for Loam) | rust |
| prec | eye glint and a reticle | blurred outline |

**Generic templates** for M2 primitives (spectacle 6.5):

| Primitive | Template |
|---|---|
| single damage | bolt |
| squad damage | engulf |
| area | burst |
| buff, debuff | aura or curse |
| summon | erupt by color |
| heal | wave or rays |
| fatigue drain | siphon |
| morale shock | dark ripple |
| field effect | storm, fog, or wall |

**Field effects:**

- **Storm:** clouds, light −35%, 1,200 rain drops, lightning every 2 to 5 s at most once per
  2 s, and a "−2 ATT, no missiles" field chip.
- **Fog:** three drifting layers; far lanes and rear rows at 60% opacity.
- **Wall:** rises in the caster's color with trauma 0.25; troops press against it; it
  crumbles with trauma 0.15.

### S2.11 Cue and timeline types

```ts
// cues.ts (story time in ms at 1x; ActorId indexes Timeline.actors)
export type Ms = number;
export type ActorId = number;
export interface Vec { x: number; y: number }
export type Lod = 0 | 1 | 2;   // 0 essential, 1 standard, 2 fine detail
export type Reaction = 'dodge' | 'parry' | 'shield' | 'deflect' | 'followThrough' | 'wound' | 'kill' | 'ghostKill' | 'whiff';
interface Cue { t: Ms; dur: Ms; lod: Lod; key: string; seq: number }

export type PersistentCue =
  | (Cue & { kind: 'move'; actor: ActorId; to: Vec; ease: Ease; gait: 'shift' | 'march' | 'run' | 'charge' | 'withdraw' })
  | (Cue & { kind: 'face'; actor: ActorId; facing: 1 | -1 })
  | (Cue & { kind: 'death'; actor: ActorId; style: DeathStyle; dir: 1 | -1; element: Element; weight: Weight })
  | (Cue & { kind: 'rebind'; actor: ActorId; rep: number })
  | (Cue & { kind: 'wound'; actor: ActorId; level: number })          // tint 0..1
  | (Cue & { kind: 'rout'; actor: ActorId; to: Vec })
  | (Cue & { kind: 'leave'; actor: ActorId; to: Vec })
  | (Cue & { kind: 'spawn'; actor: ActorId; style: 'ember' | 'swarm' | 'rise' | 'step' })
  | (Cue & { kind: 'stance'; actor: ActorId; stance: 'idle' | 'brace' | 'shaken' | 'rage' | 'entangled' | 'exhausted' | 'slung' })
  | (Cue & { kind: 'stuck'; actor: ActorId; arrows: number })        // pincushion, at most 3
  | (Cue & { kind: 'aura'; group: BattleUnitRef; source: string; tone: 'buff' | 'debuff'; stat: StatKey; delta: number })
  | (Cue & { kind: 'auraEnd'; group: BattleUnitRef; source: string })
  | (Cue & { kind: 'material'; group: BattleUnitRef; material: Material })
  | (Cue & { kind: 'field'; effect: FieldEffectKind; color: Color | null })
  | (Cue & { kind: 'fieldEnd'; effect: FieldEffectKind })
  | (Cue & { kind: 'count'; group: BattleUnitRef; living: number; routing: boolean; gone: boolean })
  | (Cue & { kind: 'hp'; group: BattleUnitRef; hp: number })
  | (Cue & { kind: 'fatigue'; group: BattleUnitRef; fatigue: number })
  | (Cue & { kind: 'clash'; x: number });

export type TransientCue =
  | (Cue & { kind: 'strike'; actor: ActorId; target: ActorId; motion: Motion; weight: Weight; contact: Ms;
      reaction: Reaction; featured: boolean; rank: number | null /* null = mandatory */; dealt: number | null;
      charge: boolean; blow: number /* Blow.seq */ })
  | (Cue & { kind: 'react'; actor: ActorId; reaction: Reaction; material: Material; element: Element; severity: number })
  | (Cue & { kind: 'ghostFall'; at: Vec; unit: UnitTypeId; side: BattleSide; style: DeathStyle; element: Element })
  | (Cue & { kind: 'shoot'; actor: ActorId; motion: Motion })
  | (Cue & { kind: 'projectile'; projectile: ProjectileKind; from: Vec; to: Vec; release: Ms; flight: Ms; arc: number;
      outcome: Outcome | 'shield'; sticks: 'body' | 'shield' | 'ground' | 'none'; rank: number | null })
  | (Cue & { kind: 'spellBeat'; beat: 'charge' | 'release' | 'travel' | 'impact' | 'linger'; spell: string;
      caster: ActorId; color: Color | 'holy'; from: Vec; to: Vec; form: 'full' | 'short' | 'brief' })
  | (Cue & { kind: 'burst'; at: Vec; preset: ParticlePresetId; count: number; seed: number; dir: number; radius: number; gore: boolean })
  | (Cue & { kind: 'floater'; at: Vec; text: string; style: FloaterStyle; glyph: Glyph | null })
  | (Cue & { kind: 'chip'; group: BattleUnitRef; text: string; tone: 'info' | 'good' | 'bad' })
  | (Cue & { kind: 'camera'; effect: 'trauma' | 'zoom' | 'desaturate' | 'dim'; amount: number; focus: Vec | null })
  | (Cue & { kind: 'flash'; color: number; alpha: number; area: 'scene' | 'local' })
  | (Cue & { kind: 'card'; card: 'round' | 'name' | 'interlude' | 'withdraw' | 'result'; text: string; group: BattleUnitRef | null });

export interface Decal {
  t: Ms; at: Vec; kind: DecalKind; rot: number; scale: number; seed: number;
  /** Drawn only at this gore level or above; 'off' decals are drawn at every level. */
  gore: 'off' | 'standard' | 'brutal';
  unit: UnitTypeId | null; tint: number;
}
export interface Beat { t0: Ms; t1: Ms; kind: BeatKind; weight: number; label: string; icon: Glyph }
export interface Hold { t: Ms; realMs: number; global: true }          // global hit-stops (time map)
export interface Slow { t0: Ms; t1: Ms; rate: number; kind: 'commander' | 'god' | 'spell' | 'contact' }

export interface Timeline {
  version: 1;
  battle: string; mode: 'detailed' | 'aggregated'; scene: BattleScene; leftSide: BattleSide;
  duration: Ms;
  world: { width: 1600; height: 900; centerX: 800 };
  actors: ActorDef[];
  rounds: RoundMark[];            // [t, end) per round with phase marks; montage ranges
  beats: Beat[];
  persistent: PersistentCue[];    // sorted by (t, seq)
  transient: TransientCue[];      // sorted by (t, seq); dur <= 3000
  decals: Decal[];                // sorted by t
  holds: Hold[]; slows: Slow[];
  ticker: { t: Ms; text: string; bold: boolean; side: BattleSide | null }[];
  keyframes: Keyframe[];
  stats: TimelineStats;           // strikes shown/mandatory/ranked per phase, ghosts, cue counts
}
export function buildTimeline(prepared: PreparedBattle, opts: { leftSide: BattleSide; tints: Record<BattleSide, number> }): Timeline;
```

The timeline carries no sounds. S3 derives them from these cues (`present/sound/cues.ts`).

### S2.12 The time map

```ts
// timemap.ts
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
export interface TimeMapOptions { speed: PlaybackSpeed; beatsMode: boolean; slowMotion: boolean; hitStop: boolean }
/** Story [s0, s1) plays over real [r0, r1); rate = story ms per real ms; 0 is a hold. */
export interface TimeSegment { s0: Ms; s1: Ms; r0: number; r1: number; rate: number; slow: number }
export interface TimeMap { options: TimeMapOptions; segments: TimeSegment[]; realDuration: number }
export function buildTimeMap(timeline: Timeline, o: TimeMapOptions): TimeMap;
export function toReal(map: TimeMap, s: Ms): number;
export function toStory(map: TimeMap, r: number): Ms;   // a hold maps to its story instant
export function slowAt(map: TimeMap, s: Ms): number;    // 1 outside slow motion (audio pitch, filters)
```

The rate is `speed`, modified as follows:

- **Beats mode:** outside beat spans, the rate is `max(4, speed)`.
- **Slow motion:**
  - At 1x and 0.5x, the rate is `speed × slow.rate`.
  - At 2x, strength is 0.6: the rate is `2 × (1 − 0.6 × (1 − slow.rate))`.
  - At 4x, slow motion becomes a 0.5 s hold, except for pretender deaths.
  - With `slowMotion` off, every slow span becomes a 0.5 s hold at its start (a freeze
    frame).
- **Global holds:** real milliseconds from the table, only at 1x and below, only with
  `hitStop` on, and at most one per 450 ms of real time (greedy, in story order).

Reduced motion sets both `slowMotion` and `hitStop` to off. Maps are cached per options key.

### S2.13 Keyframes and `evaluateInto` (architecture 3.8, kept)

```ts
export interface ActorFrame {
  visible: boolean; x: number; y: number; facing: 1 | -1; scale: number; alpha: number;
  pose: Pose; poseT: number; flash: number; wound: number; stance: Stance; bob: number; arrows: number;
}
export interface FrameModel {
  t: Ms;
  actors: ActorFrame[];                                   // preallocated, by ActorId
  strikes: StrikeFrame[]; strikeCount: number;
  projectiles: ProjectileFrame[]; projectileCount: number;
  ghosts: GhostFrame[]; ghostCount: number;
  bursts: BurstRef[]; burstCount: number;                 // the renderer evaluates particles
  floaters: FloaterFrame[]; floaterCount: number;
  chips: ChipFrame[]; chipCount: number;
  auras: AuraFrame[]; auraCount: number;
  spells: SpellFrame[]; spellCount: number;
  fields: FieldFrame[];
  camera: { x: number; y: number; zoom: number; rot: number; desaturate: number; dim: number };
  flash: { color: number; alpha: number };
  cards: CardFrame[];
  decalsUpTo: number;
  panel: PanelState;
}
export function createFrame(timeline: Timeline): FrameModel;
export function evaluateInto(frame: FrameModel, timeline: Timeline, t: Ms, view: ViewFilter): void;
```

- **Persistent state:** take the keyframe at the start of `t`'s round, then fold the
  persistent cues in `(keyframe.t, t]`. This runs incrementally during forward play.
- **Transients:** the cues in `[t − 3000, t]` that are active at `t`, found with a moving
  cursor (binary search on a seek).
- **Particles:** `particleAt(burst, i, age, out)` hashes `(seed, i)`. Position is
  `p0 + v/k·(1 − e^(−k·age)) + ½·g·age²`, clamped at the ground line. The motion presets are
  ballistic, rise, spread, ripple, radiate, and sink. There is no particle state.
- **Camera:**
  - `cameraAt(t)` sums trauma-squared shake from the trauma cues active at `t` (deterministic
    smooth noise of `t`).
  - It adds push-ins: 1.08× to 1.35×, eased in over 0.5 s, held, eased out over 0.7 s, and
    clamped to the world.
  - In melee it drifts at most 40 wu toward the clash, weighted by kills, when follow action
    is on.
- **Pure poses:** `rig.ts` turns `(rig, pose, poseT, weaponMotion)` into part transforms in
  closed form. S4 draws them.

### S2.14 View filters

```ts
export interface ViewOptions {
  gore: 'off' | 'standard' | 'brutal'; reducedMotion: boolean; shake: 'full' | 'low' | 'off';
  flashes: 'full' | 'soft' | 'off'; numbers: boolean; quality: 'high' | 'medium' | 'low'; followAction: boolean;
}
export interface ViewFilter {
  options: ViewOptions; speed: PlaybackSpeed; maxLod: Lod;
  strikeLimit(phase: number): number; projectileLimit(phase: number): number;
  particleScale: number; shakeScale: number;
  /** Flash cue indices allowed at this speed and map: at most 3 per real second, alpha <= 0.35. */
  allowedFlashes: ReadonlySet<number>;
}
export function makeViewFilter(timeline: Timeline, map: TimeMap, options: ViewOptions): ViewFilter;
```

- **LOD:** 0.5x and 1x show LOD 2 and below; 2x and 4x show LOD 1 and below. Deaths, ghost
  bodies, routs, casts, impacts, counts, and HP are never above LOD 0.
- **Quality** scales particles: high 1.0 (cap 6,000), medium 0.5 (cap 3,000), low 0.2 (cap
  1,200, no additive fx, decals limited to corpses). Quality never changes the timeline, the
  sampled strike set, or the sound.
- **Reduced motion:**
  - no shake, no camera moves, no hit-stop or slow motion (through the map);
  - no full-scene flashes;
  - particles ×0.3, lunges 3 wu;
  - deaths fade and lie down (nothing is thrown);
  - routs slide off the edge as `docs/07` describes;
  - projectiles still fly, without trails, because they are information.
- **Flashes:**
  - Full-scene flash alpha is 0.15 at Full, 0.07 at Soft, and 0 at Off; reduced motion caps
    it at 0.12.
  - The **flash limiter is always on.** Flash cues that are full-scene, or larger than 1/16
    of the canvas (explosions, lightning), are admitted greedily in real time at the current
    map: at most 3 in any real second, and alpha at most 0.35.
  - Per-sprite hit flashes are a single frame on a sprite of at most 64 px. They are exempt,
    and become a red tint under reduced motion.
- **Gore:** decals below the gore level are filtered out. Blood particle presets map to dust
  at Off. Brutal adds chunks and dismemberment cues.

### S2.15 Panel, ticker, report

- **`PanelState` at t,** per group:
  - `living / start`;
  - `routing`, `gone`, wiped out, summoned;
  - the commander's `hp / maxHp` and `fatigue` (A4);
  - chips: stat, signed delta, and rounds left from `untilRound`;
  - `breakChance` (detailed mode only, S2.16);
  - shaken.

  Per side: active troops and losses, plus a tug-of-war strength bar.

  **Counts change at the `count` cue that shows the death** (literal or ghost), never when
  the event is read. At each phase end, the panel equals `script.folds` (`foldReplay`).
- **Ticker lines** are aggregated per phase and pair, with their story times. Clicking a line
  seeks to it. For example:
  - "Flame Archers loose on the Wardens: 7 hits, 4 turned by armor, 1 slain";
  - "Cinder Magus casts Fireball: 3 Wardens slain";
  - "Ash Riders charge the Wardens!";
  - "Ash Chieftain has fallen, slain by the Briar Guard".

  Bold lines are beats. Captions (S3) join the ticker.
- **Report:** `buildReport(script): ReportRound[]` gives text per round, for example
  "Flame Archers loosed 60 arrows at the Wardens: 21 struck, 5 turned by armor, 6 killed."
  It is the screen-reader view and the no-WebGL fallback.
- **Result data:**
  - per side: troops at the start, killed, fled, survived, and commanders lost;
  - spells cast;
  - the deadliest squad (the most kills from the tallies).

### S2.16 Break chance (detailed mode only)

```
P(break) = P(D < breakThreshold(mor, pressure))
D        = X − Y, the difference of two open-ended DRNs
```

- The exact distribution of D is computed once by convolution, truncated below 1e-6.
- `mor` is the setup's morale plus the logged buffs and debuffs in force.
- `pressure` is the side's half-lost pressure, plus the commander-death pressure in the
  round its commander died, plus shock.
- Fearless and berserk squads show "never breaks".
- The meter is a thin bar under the squad count: green below 10%, amber to 35%, red above.
  It pulses while the squad is shaken.
- The fallback hides it.

### S2.17 Numbers (S2)

| Item | Value |
|---|---|
| Strike budget per melee phase (1x, 2x, 4x) | 90, 55, 30 ranked, plus every mandatory strike |
| Projectile budget per ranged phase | 400, 240, 120, plus every killing shot |
| Featured strikes | ≤ 6 per phase |
| Strike rate | ≤ 1 strike per sprite per 0.45 s |
| Death rate | ≤ 12 deaths per 100 ms of story time |
| Sprite caps by size | 20 / 12 / 6 / 4 / 2 / 1 |
| Projectiles in flight | ≤ 600 |
| Cues per timeline | ≤ 20,000 (immortal and every random battle) |
| Duration at 1x, `starting` | average 25 to 60 s; each seed ≤ 90 s |
| Duration at 1x, `clash300` | average 60 to 100 s; each seed ≤ 150 s |
| Duration at 1x, `grind16`, `grind50`, `immortal`, 200 random battles | each ≤ 150 s |
| Beats mode, `clash300` | ≤ 50 s |
| Beats mode, `grind50` | ≤ 45 s |
| `prepareBattle` time, `clash300` / immortal | ≤ 5 ms / ≤ 45 ms |
| `buildTimeline` time, `clash300` / immortal | ≤ 20 ms / ≤ 100 ms |
| `evaluateInto` time per frame | ≤ 1 ms / ≤ 2 ms |
| `buildTimeMap` time | ≤ 1 ms |

Perf tests have ×2 slack in CI.

### S2.18 Tests (Vitest, Node)

| File | What it pins |
|---|---|
| `tests/present/battle/prepare.test.ts` | detailed mode for fresh records; `noRerun`, `mismatch` (a tampered stat), and `error` (an unknown spell) |
| `tests/present/battle/script.test.ts` | Both modes: the blows of every phase add up to its pair tallies by outcome; every stored event lands in exactly one phase; commander killing blows are found. The fallback reproduces the tally identities on every fixture. |
| `tests/present/battle/proxies.test.ts` | `visible()` is monotone and the last five are literal; random kill sequences keep every invariant of S2.5; standing sprites equal `visible(n)` |
| `tests/present/battle/sample.test.ts` | Every prefix of `stratifiedOrder` is within 1 of its shares. Mandatory items are never filtered. Shown sets nest: 4x ⊂ 2x ⊂ 1x. The rank of a blow does not depend on speed. |
| `tests/present/battle/pacing.test.ts` | the table durations; brisk rounds; montage of 4 or more quiet rounds; the cap loop; the duration targets of S2.17 on the real fixtures |
| `tests/present/battle/timeline.test.ts` | the invariants below, run on every named fixture × 5 seeds **and 200 random battles** |
| `tests/present/battle/timemap.test.ts` | `toStory(toReal(s)) = s` outside holds; monotone; Beats rates; slow motion by speed; holds ≤ 1 per 450 ms; options off remove holds and slow motion |
| `tests/present/battle/evaluate.test.ts` | Each round start equals its keyframe. A frame reached by playing forward in 16 ms steps equals the same frame reached by a seek. The final frame's counts equal `foldReplay`. Reduced motion gives an identity camera. Gore Off never counts blood decals. |
| `tests/present/battle/particles.test.ts` | closed-form determinism; no NaN; ballistic particles never go below the ground; counts per preset |
| `tests/present/battle/view.test.ts` | flash limiter: at most 3 per real second at every speed and in Beats mode, for every fixture; LOD by speed |
| `tests/present/battle/panel.test.ts` | the panel equals `foldReplay` at every phase end; counts change only at `count` cues; break chance matches a Monte Carlo of the sim's `drn` (200,000 draws, ±0.5 points) |
| `tests/present/battle/report.test.ts` | text snapshots for `starting`, `mageDuel`, and `clash300` |
| `tests/present/battle/clock.test.ts` | with a fake time source: play, pause, and resume keep `t`; a speed change mid-play re-anchors without a jump; seek clamps; the end pauses |
| `tests/present/battle/perf.test.ts` | the times in S2.17 |
| `tests/content/presentation.test.ts` | every unit has a look or a listed fallback, with weapon counts matching; ranged weapons have projectiles; every battle spell has a spell look or a template; every element and blood type has a preset; every terrain has a backdrop; floater colors per element differ by CIEDE2000 ≥ 20 (≥ 12 under the simulated deficiencies, with the palette test's helper); sizes 1 to 6 have scale, cap, grid, and spacing |
| `tests/sim/purity.test.ts` | `src/present` is pure; nothing pure imports `src/audio`, `src/render`, `src/ui`, or `src/lab`; the core pure directories never import `src/present` |

**Timeline invariants** (`check.ts`):

1. Building twice gives deep-equal timelines. A pinned `stateHash` for `skirmish` and
   `mageDuel` is updated only together with a presentation content change.
2. Cue lists are sorted; `0 ≤ t` and `t + dur ≤ duration`; transients last ≤ 3,000 ms.
3. Rounds strictly increase and cover `[0, duration)`; phases nest inside their round.
4. **Conservation:** literal deaths + ghost bodies = logged kills for every group, summons
   included. Bodies on the ground at the end = all deaths. Each actor dies at most once.
5. **No action after death:** no strike, shot, cast, or reaction by an actor after its
   death time. No cue targets an actor after its death or departure, except corpse decals.
   Routers leave only through `leave`.
6. **Shown sets nest by speed,** for strikes and projectiles.
7. **Honesty of outcomes:**
   - shown outcome shares per pair are within 1 of the logged shares at every budget;
   - every `blocked` reaction maps to a real blocked blow (detailed) or a blocked count
     (fallback);
   - nothing shows rolls or a break chance in fallback mode;
   - `blocked + onFallen + kills ≤ hits ≤ attacks` everywhere.
8. Every commander death has a beat, a slow span, and a name card. Every pretender death
   has a god beat.
9. The panel equals `foldReplay` at every phase end.

Gate: `npm run typecheck && npm run lint && npm test`.

---

## S3. Audio: the engine, the procedural bank, the mixer, and settings

### S3.1 Files

```
src/present/sound/                    PURE (guarded with src/present)
  dsp/noise.ts filter.ts osc.ts env.ts modal.ts pluck.ts grains.ts voice.ts bubble.ts creak.ts
  dsp/render.ts                       renderRecipe(recipe, variant, bankVersion): Float32Array
  dsp/ir.ts                           renderImpulse(spec, sampleRate): [Float32Array, Float32Array]
  cues.ts                             soundCuesFrom(timeline): SoundCue[]
  variants.ts                         variant bags, nation flavor halves, instance seeds
  needs.ts                            needs(record, timeline, settings): RecipeId[] in bake priority order
  plan.ts                             planSounds(timeline, map, settings): SoundPlan; playsFrom; sustainedAt
  allocate.ts                         the voice allocator, a pure step function over real time
  din.ts                              crowd din and bed level curves
  mixmath.ts                          gain, pan, row, size, damage terms; the slider curve
src/content/presentation/sound/       DATA
  types.ts                            the recipe schema (below); SoundClass, NeedTag, RecipeId
  recipes/<family>.ts index.ts        recipes as data; BANK_VERSION
  profiles.ts                         unit and weapon sound profiles, fallbacks
  mix.ts                              levels, caps, priorities, merges, ducks, thinning, sends
  ir.ts                               reverb impulse response specs per terrain
src/audio/                            IMPURE (Web Audio)
  context.ts                          create or unlock on a gesture, suspend, resume, visibility
  graph.ts                            buses, duck nodes, groups, reverb, master chain, mono, calm, soft highs
  bank.ts                             worker pool, bake queue, session LRU, AudioBuffer creation
  bake.worker.ts                      receives jobs, calls renderRecipe, transfers Float32Arrays
  engine.ts                           AudioEngine: executes a SoundPlan against the graph
  scheduler.ts                        25 ms lookahead loop; pause, seek, skip, close
  stats.ts                            counters for tests and the dev overlay
src/ui/settings/presentation.ts       persisted replay and audio settings (zustand persist)
lab/audition.html, src/lab/audition/  S3a dev page; becomes a lab tab in S5
```

### S3.2 Recipe schema and synthesis

```ts
// content/presentation/sound/types.ts
/** A number, or [lo, hi] drawn once per variant. */
export type Range = number | readonly [number, number];
/** A value over the sound's normalized time 0..1. */
export type Path = Range | { points: readonly (readonly [number, Range])[]; curve: 'lin' | 'exp' };
export interface Env { attack: Range; hold?: Range; decay: Range; shape?: 'ad' | 'bell'; peakAt?: number }
export interface Filter { type: 'lp' | 'hp' | 'bp' | 'peak' | 'lowshelf' | 'highshelf'; freq: Path; q?: Range; gainDb?: Range }
export interface Mod { rate: Range; depth: Range }
export type Vowel = 'a' | 'o' | 'u' | 'uh' | 'ae' | 'e' | 'i' | 'm';
interface LayerBase { gainDb: Range; at?: Range; env?: Env; filters?: readonly Filter[]; am?: Mod }
export type Layer =
  | (LayerBase & { kind: 'noise'; color: 'white' | 'pink' | 'brown' | 'velvet' })
  | (LayerBase & { kind: 'osc'; wave: 'sine' | 'tri' | 'saw' | 'square'; freq: Path; fm?: { ratio: Range; index: Path } })
  | (LayerBase & { kind: 'modal'; f0: Range; partials: readonly { ratio: number; t60: Range; amp: number }[];
      detune?: number; exciter: 'click' | 'noise'; strikes?: { count: Range; span: Range } })
  | (LayerBase & { kind: 'pluck'; f0: Range; t60: Range; brightness: Range })
  | (LayerBase & { kind: 'grains'; rate: Path; dur: Range; freq: Range; q: Range; law: number; span: Range })
  | (LayerBase & { kind: 'voice'; f0: Path; vowels: readonly Vowel[]; tract: Range; breath: Path;
      jitter: Range; shimmer: Range; vibrato?: Mod; rough?: Mod; drive: Range; chorus?: number; subharmonic?: Range })
  | (LayerBase & { kind: 'bubbles'; count: Range; f0: Range; rise: Range; t60: Range; span: Range })
  | (LayerBase & { kind: 'creak'; slipRate: Path; jitter: Range; resonances: readonly number[] })
  /** CC0 only, provenance in src/audio/samples/LICENSES.md. Unused in M1 unless the voice gate (S3.14) is hit. */
  | (LayerBase & { kind: 'sample'; asset: string });
export interface SoundRecipe {
  id: RecipeId; bus: SoundClass; sampleRate: 16000 | 24000 | 32000; length: Range; variants: number;
  loop?: { crossfade: number }; bake: readonly NeedTag[]; layers: readonly Layer[];
}
// present/sound/dsp/render.ts
export function renderRecipe(recipe: SoundRecipe, variant: number, bankVersion: number): Float32Array;
```

**DSP primitives** are pure TypeScript writing `Float32Array`s (from the sound proposal's
prototype, measured at 134x to 186x real time on one thread and bit-identical across runs):

- noise: white, pink (Kellet), brown, and velvet;
- RBJ biquads with per-sample sweeps (coefficients updated every 32 samples), one-pole
  filters, combs, and allpasses;
- a sine table and polyBLEP saw and square;
- envelopes and breakpoint curves;
- modal banks of recursive oscillators;
- Karplus-Strong strings;
- Poisson grains;
- a source-filter voice: glottal pulses, jitter, shimmer, roughness, breath, five gliding
  formants, and drive. Its controls run at block rate, with a sine table and a rational tanh.
- van den Doel bubbles;
- stick-slip creaks.

After the layers are mixed, `render.ts` removes DC, normalizes to a −1 dBFS peak, applies a
5 ms fade-out, and crossfades loops into themselves (rendered 0.25 s longer).

Variant `k` is seeded by `hash32('fm-sfx', BANK_VERSION, recipeId, k)` through `createRng`.
Inner loops avoid engine-dependent `Math` functions, so V8 (Node and Chromium) is
bit-identical. Other engines may differ by a few ulps, which is inaudible.

**Reverb.** Impulse responses are generated per scene: stereo, decorrelated, with an RT60 per
band and discrete echoes (sound proposal 4.16). Values are RT60 low / mid / high in seconds,
then the wet level:

| Scene | RT60 | Wet | Extra |
|---|---|---|---|
| plains | 0.6 / 0.5 / 0.25 | −22 dB | |
| farmland | 0.7 / 0.6 / 0.3 | −22 dB | |
| forest | 1.2 / 0.9 / 0.5 | −16 dB | LP 4 kHz, dense early scatter |
| hills | 1.4 / 1.2 / 0.7 | −18 dB | slope echoes at 220 and 410 ms |
| mountains | 2.6 / 2.2 / 1.6 | −14 dB | echoes at 180, 360, 610 ms, alternating left and right |
| swamp | 0.9 / 0.7 / 0.35 | −20 dB | LP 3 kHz |
| wasteland | 0.8 / 0.7 / 0.4 | −20 dB | slapback at 180 ms |
| walls (stormed fort) | 1.6 / 1.4 / 0.9 | −14 dB | stone slaps at 40, 95, 150 ms |

### S3.3 The bank, in stages

**S3a: 40 core recipes.** These cover every outcome class at least once. Notation as in the
sound proposal 4.1:

- `W`, `P`, `B`: white, pink, brown noise. `S` is a sine, `M` a modal bank, `KS` a
  Karplus-Strong string, `V` the formant voice.
- `@-n`: this layer is n dB below the first.
- `[x,y]`: a range drawn once per variant.

| # | Id | Class | Rate (kHz) | Length (s) | Variants | Recipe |
|---|---|---|---|---|---|---|
| 1 | `swing.light` | swing | 32 | 0.16 | 8 | W > BP 900>[2800,3400]>1400 Q2, bell(0.4) + edge whistle BP [3800,5200] Q14 @-14 |
| 2 | `swing.blade` | swing | 32 | 0.22 | 8 | P > BP [500,650]>[2000,2600]>800 Q1.6, bell(0.45) + whistle BP [2600,3600] Q12 @-12 |
| 3 | `swing.axe` | swing | 32 | 0.28 | 8 | P > BP [300,380]>[1200,1500]>450 Q1.2 + head whirr BP [700,900] Q6, AM [14,20] Hz 0.6 @-10 |
| 4 | `swing.axe.heavy` | swing | 32 | 0.40 | 6 | (B+P) > BP 220>1000>300 Q1 + whirr BP 550 Q5, AM [9,12] Hz @-9 + S 70 swell @-12 |
| 5 | `swing.huge` | swing | 32 | 0.60 | 4 | B > LP 160>650>200, bell(0.6) + S [38,48] swell @-4 + debris grains @-24 |
| 6 | `thrust` | swing | 32 | 0.13 | 8 | W > BP 1000>[2600,3000] Q2.4, a/d 0.02/0.10 + cloth flap P > BP 400 @-12 |
| 7 | `hit.cut` | impact | 32 | 0.18 | 10 | slice W > HP [3500,4500]>[1800,2400] @-4 + thump S [130,160]>[70,85] @-6 + squelch BP [1300,1700]>[500,700] Q3.5, AM [35,55] Hz @-3 |
| 8 | `hit.chop` | impact | 32 | 0.24 | 10 | thump S [100,140]>[55,70] + smack B > LP [900,1400] @-2 + bite M([600,850]) @-8 + squelch @-3 + crunch grains @-6 |
| 9 | `hit.blunt` | impact | 32 | 0.24 | 10 | thump S [80,110]>[45,55] + smack B > LP [600,900] @-1 + crunch grains @-4 + body BP 250 @-8 |
| 10 | `hit.pierce` | impact | 32 | 0.15 | 10 | thuk B > LP [1100,1500] + S [150,190]>[90,110] @-4 + puncture BP [1800,2200]>[700,900] Q4 @-6 |
| 11 | `kill.crunch` | impact | 32 | 0.20 | 8 | crack (impulse > BP [1800,2600] Q3) + 18 to 30 bone grains over [0.05,0.10] s + thump S [70,90] @-4 |
| 12 | `gore.spatter` | gore | 32 | 0.40 | 8 | gush BP 900>500 + 6 to 14 droplets over [0.05,0.35] s + 2 to 4 bubbles @-6 |
| 13 | `arm.soft` | impact | 32 | 0.12 | 6 | thwap B > LP [800,1200] + S [120,150]>80 @-3 + leather creak @-18 |
| 14 | `arm.scale` | impact | 32 | 0.28 | 8 | 8 to 14 plate clacks M([1500,4000]) over 0.08 s + plate partials M([700,950]) @-8 + thud @-6 |
| 15 | `arm.mail` | impact | 32 | 0.25 | 8 | 14 to 26 link pings M([3000,8500]) over [0.06,0.12] s + thud @-6 + click @-8 |
| 16 | `arm.plate` | impact | 32 | 0.45 | 8 | M([320,560]; 1, 1.59, 2.14, 2.92, 3.5, 4.2; pairs detuned 0.4%) + click @-4 + thud @-10; 2 of 8 variants are helmet bongs |
| 17 | `arm.bark` | impact | 32 | 0.28 | 8 | tok M([260,420]; 1, 2.6, 4.1) + BP [900,1300] Q5 @-4 + splinter grains @-10 + creak @-18 |
| 18 | `arm.wood` | impact | 32 | 0.45 | 6 | bole M([140,220]; 1, 2.3, 3.9) + thump S 90>60 @-3 + splinters @-8 + creak @-10 |
| 19 | `arm.stone` | impact | 32 | 0.50 | 6 | clack M([900,1500]; 1, 1.9, 3.1) + grit grains @-6 + debris trickle @-14 + S 180 @-8 |
| 20 | `parry.blade` | impact | 32 | 0.70 | 10 | M([700,1300]; 1, 2.756, 5.404, 8.933) twice, the second +0.6% @-3 + click + scrape @-8 |
| 21 | `parry.haft` | impact | 32 | 0.25 | 6 | clack M([500,800]; 1, 2.7) + BP 1500 Q4 + rattle @-12 |
| 22 | `shield.wood` | impact | 32 | 0.30 | 8 | hollow thunk M([150,230]; 1, 1.8, 3.1) + plank slap through a comb @-3 + rim rattle @-12 + thud @-6 |
| 23 | `bow.short` | missile | 32 | 0.35 | 6 | KS([110,170], t60 [0.08,0.12], bright 0.55) + bracer slap @-4 + limb whoosh @-8 |
| 24 | `bow.long` | missile | 32 | 0.45 | 6 | KS([70,110], t60 [0.10,0.14], bright 0.6) + slap @-3 + whoosh @-6 + stave creak @-16 |
| 25 | `volley.cloud` | missile | 32 | 1.40 | 4 | 20 to 30 whistles BP [2200,4800] Q9 with Doppler 6 to 14% + mass hiss P > BP 2500 @-10 |
| 26 | `arrow.flesh` | impact | 32 | 0.12 | 8 | thwack B > LP 1600 + S [150,180]>100 @-4 + shaft quiver @-16 + wet @-8 |
| 27 | `arrow.armor` | impact | 32 | 0.20 | 8 | tink M([3000,4500]; 1, 1.9) + click; 3 of 8 variants add a ricochet whistle @-10 |
| 28 | `arrow.ground.soil` | impact | 24 | 0.12 | 6 | thup B > LP [500,800] + S [90,110] @-3 + soil grains @-10 |
| 29 | `vox.death.scream` | voice | 24 | 0.95 | 12 | V(f0 [150,260]: ×1.35 at 0.15, ×0.9 at 0.6, ×0.55 at the end; ae>a>o; breath 0.1>0.6; rough [40,80] Hz; jitter 2%, shimmer 8%; vibrato 5 to 7 Hz; drive [2,4]) |
| 30 | `vox.pain` | voice | 24 | 0.28 | 12 | V(f0 [140,220]: ×1.15 then ×0.7; a>uh; breath 0.2>0.5; rough [40,70] Hz 0.35; drive 3) |
| 31 | `fall.light` | body | 24 | 0.35 | 8 | B > LP [300,450] + S [70,90] @-4 + cloth @-12 + limbs (a second hit) @-6 |
| 32 | `fall.huge` | body | 24 | 1.80 | 3 | S [30,40]>25 + B > LP 180 + debris grains @-8 + snap @-12 |
| 33 | `horn.call.cinder` | stinger | 32 | 1.60 | 2 | brass model, A2 0.5 s > D3 1.0 s, nasal LP, drive 2.5 (rasp) |
| 34 | `horn.call.thorn` | stinger | 32 | 1.60 | 2 | brass model, D3 D3 A3, round, no drive |
| 35 | `horn.retreat.cinder` | stinger | 32 | 2.10 | 2 | A2 > E2, a falling fifth, 15 cent wobble |
| 36 | `horn.retreat.thorn` | stinger | 32 | 2.10 | 2 | A3 > D3, a falling fourth |
| 37 | `drum.cinder` | stinger | 24 | 0.80 | 4 | taiko: two hits 0.18 s apart, S [85,95]>[52,60] + skin slap @-6 |
| 38 | `drum.thorn` | stinger | 32 | 0.80 | 4 | frame drum S [130,150]>90 + BP 600 @-4 + rim clack @-6 |
| 39 | `amb.plains.a` | ambience | 16 | 12 (loop) | 1 | wind through grass P > BP [350,700], slow AM + rustle @-12 + low wind @-10 |
| 40 | `din.clash.mass.a` | loop | 16 | 8 (loop) | 1 | 400 to 600 mini impacts in 8 s + body rumble @-8 |

In S3a, each cue without its own recipe maps to a core recipe or to silence. The mapping is
listed in `profiles.ts` as `pending`, and the coverage test prints the pending list.

**S3b: the full M1 families.** The sound proposal's section 4 tables are copied into
`recipes/<family>.ts` after the owner's first listening pass on the audition page.

| Family | Recipes | Variants | Memory |
|---|---|---|---|
| swings | 15 | 96 | 3.0 MB |
| flesh and kill layers | 13 | 100 | 3.2 MB |
| armor, shields, parries | 16 | 106 | 4.4 MB |
| missiles | 19 | 103 | 5.5 MB |
| movement and cavalry | 14 | 49 | 6.4 MB |
| human voices | 10 | 86 | 5.9 MB |
| beasts and monsters | 19 | 69 | 8.9 MB |
| crowds and din | 13 | 22 | 7.4 MB |
| bodies and gear | 11 | 55 | 3.7 MB |
| command, morale, stingers | 24 | 47 | 10.1 MB |
| spell beats (Ember, Loam, Radiance for Bless) | 17 | 44 | 6.9 MB |
| M1 spell specifics and elements | 15 | 52 | 5.7 MB |
| field effects | 9 | 21 | 5.5 MB |
| ambience (seven terrains) | 25 | 50 | 17.9 MB |
| **Total** | **220** | **900** | **94.5 MB** (a battle bakes only what it needs) |

The M2 color templates (Tide, Umbra, the rest of Radiance) are written lazily and never baked
in M1. **S6 requires zero `pending` mappings.**

### S3.4 Profiles and nation identity

`profiles.ts` maps every unit (sound proposal 4.17, the same rows as S2.2's look table) to:

- its voice and voice flavor;
- its material (shared with the look);
- a shield flag;
- the family of each weapon: light, blade, bladeHeavy, axe, axeHeavy, thrust, lance, staff,
  bluntHeavy, bluntHuge, claw, bite, sting, unarmed, bowShort, bowLong, bowFire, javelin,
  breathFire, breathGust;
- footsteps and a body fall.

Fallbacks:

- voice from tags and size;
- material from S2.2's rule;
- weapon family from the name (`/axe|halberd/`, `/sword|blade/`, `/spear|pike|lance/`,
  `/club|maul|mace|hammer|fist|limb/`, `/bow/`, `/javelin/`, `/bite|jaw/`, `/claw|talon/`,
  `/sting/`, `/breath/`, `/staff/`, `/knife|dagger/`);
- weight from damage.

**Nation identity:**

- The human voice variants split into two halves. The Cinder Horde draws from the harsh half
  (more drive, ae and a vowels, lower f0); Thornwood from the breathy half (more breath, o and
  u). Independents draw from both.
- Scale armor clacks; bark thocks.
- Each nation has its own war horn, drum, chant, and victory stinger. "Deep" voices play at
  rate 0.9.

### S3.5 From the timeline to sound cues

```ts
// present/sound/cues.ts: the sound proposal's cue contract, fed by S2 cues; t is story ms
export type SoundCue =
  | { kind: 'intro'; t: Ms; sides: Record<BattleSide, { nation: NationId | null; troops: number; units: UnitTypeId[]; x: number }> }
  | { kind: 'round'; t: Ms; round: number; moving: { unit: UnitTypeId; sprites: number; x: number; mounted: boolean }[] }
  | { kind: 'strike'; key: string; t: Ms; side: BattleSide; attacker: UnitTypeId; weapon: number; target: UnitTypeId;
      reaction: Reaction; dealt: number; x: number; row: Formation; featured: boolean; charge: boolean;
      onCommander: boolean; rank: number | null; material: Material }
  | { kind: 'volley'; key: string; t: Ms; side: BattleSide; shooter: UnitTypeId; weapon: number; shooters: number; shots: number; x0: number; x1: number; flight: Ms }
  | { kind: 'projectile'; key: string; tRelease: Ms; tImpact: Ms; shooter: UnitTypeId; weapon: number; target: UnitTypeId | null;
      outcome: 'ground' | 'shield' | 'deflect' | 'wound' | 'kill' | 'followThrough'; x0: number; x1: number; featured: boolean; rank: number | null }
  | { kind: 'death'; key: string; t: Ms; tGround: Ms; unit: UnitTypeId; side: BattleSide; x: number; row: Formation; ghost: boolean;
      commander: boolean; pretender: boolean; element: Element; style: DeathStyle; byWeapon: { unit: UnitTypeId; weapon: number } | null }
  | { kind: 'cast'; key: string; caster: UnitTypeId; spellId: string; form: 'full' | 'short' | 'brief'; charge: [Ms, Ms]; release: Ms;
      travel: [Ms, Ms, number, number] | null; impacts: { t: Ms; x: number; element: Element; target: UnitTypeId; kills: number }[];
      linger: [Ms, Ms, number] | null; x: number }
  | { kind: 'aura'; key: string; t: Ms; spellId: string; debuff: boolean; ends: boolean; x: number }
  | { kind: 'heal'; key: string; t: Ms; cause: 'spell' | 'drain' | 'regen'; x: number; amount: number }
  | { kind: 'summon'; key: string; t: Ms; unit: UnitTypeId; count: number; spellId: string; x: number }
  | { kind: 'morale'; key: string; t: Ms; side: BattleSide; what: 'shaken' | 'holds' | 'rout' | 'leave' | 'lineBreaks' | 'withdraw';
      x: number; troops: number; nation: NationId | null }
  | { kind: 'charge'; key: string; t0: Ms; tImpact: Ms; side: BattleSide; mount: 'horse' | 'wolf'; riders: number; x0: number; x1: number }
  | { kind: 'firstContact'; t: Ms; x: number }
  | { kind: 'meleeLoad'; t0: Ms; t1: Ms; side: BattleSide; attacks: number; engaged: number; x: number }
  | { kind: 'commanderDeath'; key: string; t: Ms; unit: UnitTypeId; side: BattleSide; x: number; pretender: boolean }
  | { kind: 'field'; t: Ms; effect: FieldEffectKind; on: boolean; color: Color | null }
  | { kind: 'lightning'; t: Ms; x: number; near: boolean }
  | { kind: 'fatigue'; key: string; t: Ms; unit: UnitTypeId; exhausted: boolean; drained: boolean; x: number }
  | { kind: 'outro'; t: Ms; winner: BattleSide; player: BattleSide; withdrawal: boolean; dead: number };
export function soundCuesFrom(timeline: Timeline): SoundCue[];
```

- **Per-blow loudness.** It uses the strike's `dealt` in detailed mode. In the fallback it
  uses the pair's `dmg / (wounds + kills)`.
- **Din load.** It comes from the A2 `attacks` of each melee phase, so the din follows real
  blow counts at every budget.
- **Ranked items.** A cue with a `rank` makes sound only when its strike or projectile is
  shown at that speed. So sound and picture use one set.

### S3.6 Cue to sound (sound proposal section 5, condensed)

"Swing lead" means a swing starts at contact minus 0.55 of its length.

**Melee strikes:**

| Reaction | Layers |
|---|---|
| any | a swing by the attacker's weapon family at swing lead; `whoosh.flame` @-8 on fire weapons; an effort (human, 15%); a growl on a beast's first strike in a round |
| dodge, whiff | the swing alone |
| parry | `parry.blade` when both weapons are metal-edged; `parry.haft` when either is a haft; beasts are treated as dodge |
| shield | `shield.wood`, plus `shield.boss` @-4 30% of the time |
| deflect (`blocked`) | `arm.<material>` at full level, plus `glance.scrape` and `glance.ping` on metal (plate 60% and 30%; mail and scale 40%). The player hears that axes do not get through bark plate. |
| followThrough (`onFallen`) | the flesh layer @-6 and `gore.squelch` at gore Standard and up; no cry |
| wound | flesh by family (cut, chop, blunt, pierce, tear, sting, burn), plus `arm.<material>` @-6 when armored, plus the element layer, plus `gore.squelch`, plus a pain voice 40% at 1x (+40 ms) |
| kill | the wound layers +2 dB, `kill.crunch` (blunt, chop, huge, and bite always; cut and pierce 50%), `kill.thud.heavy` (heavy and huge), `gore.spatter`, `gore.tear` (Brutal dismemberment), the death cry (+60 ms), the fall at ground contact, a dropped weapon 30%, and the ground layer (swamp splash, forest leaves). A fire kill replaces the wet layers with `elem.fire.ignite`. |
| ghostKill | the flesh layer, `kill.crunch` 50%, the ghost body's fall @-6; no cry (its energy feeds the din) |
| featured | +3 dB, the swing always, and a dropout duck under the impact |
| on a commander | the exact `damage`; pain at rate 0.9; the striker's weapon sound (detail, or A3 `by`) |

**Deaths:** by voice, as in the sound proposal 5.2. For humans:

- scream 60%, groan 25%, short 15%;
- always short at 2x and up, or when 4 cries are already sounding;
- a gurgle tail at gore Standard 25% and Brutal 50%;
- with death cries off, a pain sound instead.

Commanders use `vox.death.commander`. Monsters have their own deaths (giant, treant,
salamander, wyrm, stone, spirit, colossus, swarm, sprite, wolf, mounts).

**Missiles:**

- **Release:** per block, `n = min(6, ceil(√visible shooters))` instances over the ripple,
  with total level `+6·log10(shooters)` dB.
- **Flight:** `volley.cloud`, two variants panned at the shooters and the targets, −20 dB at
  20 arrows, +3 dB per doubling, capped at −8. A flyby plays only for featured projectiles
  near the camera, at most 2 per volley.
- **Impacts** per landed projectile, by outcome. Ground hits are by terrain (soil, leaf,
  rock, mud) and merge within 30 ms.
- **Breath:** the beast's roar 0.2 s before.

**Charges, contact, movement:**

- **Gallop:** `min(6, ceil(riders/4))` loops plus a rumble rising to impact, with the
  low-pass opening from 800 to 8,000 Hz.
- **Impact:** `charge.crash`, 1 to 3 `lance.break` on the Ash Riders' first round, and
  whinnies.
- **First contact:** two crashes and 8 extra impacts within 0.3 s, shouts on both sides, and
  the din jumping to its level.
- **Footsteps:** each marching block plays a loop for its step. Size 4 and up plays one sound
  per footfall.

**Spells:** five beats per color.

- The charge riser is started at an offset, so its climax lands on the release.
- Travel loops ramp their pan, with Doppler by playback rate.
- An impact under 5 targets plays a per-sprite impact (at most 6). An area burst plays once,
  plus element layers per sprite.
- The linger loop plays at −20 dB.
- The eleven M1 spells map as in the sound proposal 5.5. For example, Pyre Storm plays a
  meteor whistle 0.25 s before each impact, with at most 6 explosions at once.

**Morale and commanders:**

- **Shaken:** a murmur. **Holds:** a shout.
- **Rout:** one retreat horn per side per round (the short variant at 2x and up). Per block:
  panic, dropped gear, and runners whose pan ramps to the edge.
- **The line breaks:** the long horn, mass panic, and the winners' chant.
- **Commander death:**
  - −0.25 s: a heartbeat (66 bpm through the slow motion);
  - 0 s: the featured blow, `boom.sub`, `vox.death.commander`, and the fall;
  - +0.3 s: `banner.fall`;
  - +1.0 s: the bell toll and the card whoosh;
  - +1.4 s: a crowd gasp from its side.
- **God death:** `bell.toll.god` is scheduled 0.8 s early (pre-roll). `choir.god` plays, with
  the body's own death and the dominant color's burst.

**Fields:**

- Storm: wind and rain loops, and thunder at most once per 2 s.
- Fog: a drone, and the effects and voice groups' filter closes to 1.5 kHz.
- Wall: rises and crumbles.

**Opening, rounds, ending:**

- **Intro:**
  - 0 s: terrain beds, dual-play;
  - 0.6 s: the attacker's horn;
  - 1.0 s: the attacker's chant (level by troops);
  - 1.6 s: the defender's horn;
  - 2.0 s: the defender's chant;
  - 2.6 s: both drums.
- **Rounds:** one drum per round, alternating sides.
- **Terrain sprinkles:** from a seeded Poisson stream in story time. Birds stop at first
  contact.
- **Outro:** victory or defeat by the player's view. The aftermath under the result card
  has wounded groans (gore Standard and up) and crows.

### S3.7 The sound plan (pure)

```ts
export interface SoundPlanSettings { gore: 'off' | 'standard' | 'brutal'; deathCries: boolean; quality: 'high' | 'low' }
export interface PlannedSound {
  id: number; key: string; recipe: RecipeId; variant: number; bus: SoundClass;
  /** Real seconds from the map's 0 at this map's speed and options. */
  at: number; story: Ms; seconds: number;
  gainDb: number; pan: number; rate: number; lowpassHz: number | null; sendDb: number;
  priority: number; mustPlay: boolean;
  /** An earlier play this one stops at `at` (12 ms fade), or null. */
  steals: number | null;
}
export interface LevelCurve { at: Float32Array; db: Float32Array }   // sampled every 50 ms of real time
export interface SustainedLayer { id: number; recipe: RecipeId; variant: number; bus: SoundClass; from: number; to: number;
  level: LevelCurve; pan: number; loopOffset: number }
export interface Duck { buses: readonly SoundClass[]; depthDb: number; at: number; attack: number; hold: number; release: number }
export interface SoundPlan {
  key: string;                       // the time map's options key plus the settings
  plays: PlannedSound[];             // sorted by at
  sustained: SustainedLayer[];
  ducks: Duck[];                     // the engine combines overlapping ducks by the deepest per bus
  slow: { r0: number; r1: number; rate: number }[];
  captions: { at: number; text: string }[];
  stats: { instances: number; dropped: number; thinned: number; stolen: number; merged: number; mustPlayOverCap: number };
}
export function planSounds(timeline: Timeline, map: TimeMap, settings: SoundPlanSettings): SoundPlan;
/** Index of the first play at or after real time r (seek). */
export function playsFrom(plan: SoundPlan, r: number): number;
/** The sustained layers sounding at r, with their offsets and levels (seek, resume). */
export function sustainedAt(plan: SoundPlan, r: number): { layer: SustainedLayer; offset: number; db: number }[];
```

The rules are applied in order. All are pure, and plans are cached per `key`:

1. **Expand.** Each `SoundCue` expands into layered instances by S3.6, in story time.
2. **Visibility.** An instance whose strike or projectile is not shown at this speed is
   removed (rank rule, S2.6). Must-plays are always kept.
3. **Variants.** Each instance takes position `ordinal mod n` of a no-repeat bag. The bag
   shuffle is seeded by `hash32(battle, recipe, cycle)`, and the ordinal is the instance's
   rank among that recipe's instances in the full 1x expansion. A cycle that would begin with
   the variant that ended the previous one swaps its first two. Nation flavor runs the bag
   inside its half. **A moment always gets the same variant, at any speed and after any
   seek.**
4. **Thinning by speed.** The draw is `u = unit(hash32(battle, key, role) ^ 0x9e3779b9)`,
   fixed per instance. The instance is kept if `u < keep(layer, speed)`, so thinning is
   monotone: 4x ⊂ 2x ⊂ 1x.

   | Layer | 0.5x | 1x | 2x | 4x |
   |---|---|---|---|---|
   | swing, not featured | 0.5 | 0.35 | 0.2 | 0 |
   | pain and effort (multiplies the S3.6 shares) | 1.25 | 1 | 0.6 | 0 |
   | wound, deflection, parry, shield impact | 1 | 1 | 0.7 | 0.4 |
   | kill impact | 1 | 1 | 1 | 1 |
   | death cry, visible death | 1 | 1 | 0.7 (short variants) | 0.4 (short variants) |
   | wet layers | 1 | 1 | 0.6 | 0.3 |
   | visible fall | 1 | 1 | 0.7 | 0.4 (size 2 and up always) |
   | drops | 0.3 | 0.3 | 0.15 | 0 |
   | arrow impact | 1 | 1 | 0.6 | 0.3 |
   | flyby | featured | featured | featured | none |
   | round drum | every round | every round | every round | odd rounds |

5. **Time.** Instances are mapped to real time with `toReal`. During slow motion the rate is
   ×0.8 and the low-pass closes to 1.2 kHz (from `slowAt`). Speed never changes pitch.
6. **Allocation** (`allocate.ts`): a pure step function in real-time order.
   - Each class has a cap.
   - `priority = role base + 30 if featured + 25 if a commander or pretender + 3·(size − 1)`.
   - When a class is full, the weakest active instance by
     `score = priority − 20·elapsed/duration` is stolen (12 ms fade) if the newcomer's
     priority beats that score by 5. Otherwise the newcomer is dropped.
   - A newcomer within the merge window of an active instance of the same recipe, with pan
     within 0.2, is merged: the active one gains `+10·log10(k)` dB, at most +6 dB.
   - **Must-plays** are never dropped or stolen, and they may exceed a cap. They are:
     commander and pretender deaths; every spell's release and impact; horns, round drums,
     and stingers; first contact and charges; deaths of size 3 and up; featured strikes; war
     chants; field onsets.
7. **Energy into the din.** A dropped or thinned impact, wet layer, or cry adds
   `10^(gainDb/10)` to its side's accumulator (a leaky integrator with time constant 0.4 s).
   The din target per side is:

   ```
   attackRate = attacks / windowStorySeconds                       // from meleeLoad (A2)
   clashDb    = clamp(−40 + 16·log10(1 + attackRate), −60, −10)
   massShare  = smoothstep(40, 150, engaged troops on both sides)  // small loop below, mass loops above
   din        = min(−8, 10·log10(10^(clashDb/10) + overflowPower)); voices = din − 4
   ambience  −= 0.3·max(0, din + 30) dB
   ```

   The din rises with a 50 ms attack at contact and releases with a 0.6 s time constant
   between windows. Its smoothing time constant scales from 0.25 s at 1x to 0.12 s at 4x.
8. **Ducks** (combined by the deepest per bus, never summed):

   | Trigger | Ducks | Depth | Attack / hold / release |
   |---|---|---|---|
   | featured blow | all other effects | −6 dB | 5 ms / the hit-stop / 150 ms |
   | first contact | ambience; voices | −8 dB; −3 dB | 20 ms / 0.3 s / 1.0 s |
   | spell burst | ambience, crowd, din; impacts; voices | −6; −4; −3 dB | 10 ms / 0.4 s / 0.9 s |
   | horn | din, ambience | −4 dB | 50 ms / 0.6 s / 0.8 s |
   | near thunder | ambience; effects | −4; −2 dB | 10 ms / 0.2 s / 0.6 s |
   | commander death | everything but its own layers; ambience and din | −8; −10 dB | 30 ms / the slow motion / 1.2 s |
   | pretender death | everything but its own layers | −14 dB | 50 ms / 2.5 s / 2.0 s |
   | outcome stinger | battle effects and the din | to silence | 0.3 s / to the end |

9. **Hit-stop freezes the picture, not the sound.** The impact plays at the hold, and its
   tail rings through. Nothing new starts during a hold, because story time does not
   advance.

**Caps per class** (0.5x to 2x / 4x):

| Class | Cap | Merge window |
|---|---|---|
| impact | 20 / 16 | 25 ms |
| gore | 6 / 4 | 40 ms |
| swing | 8 / 4 | 30 ms |
| missile | 10 / 8 | 30 ms; volley clouds have their own 3 |
| voice | 10 (cries 6, pains 4) / 8 (cries 4, no pains) | 60 ms |
| body | 8 / 6 | 40 ms |
| crowd | 4 / 4 | none |
| spell | 10 / 8 | 20 ms |
| stinger | 4 / 4 | none; never stolen |
| loop | 16 / 16 | none; not stolen |
| sprinkles | 2 / 2 | none; dropped when full |

The worst moment has about 100 sources, typically 50 to 70.

**Loudness and pitch per instance** (`mixmath.ts`):

```
gainDb = base(class, layer) + weight + damage + size + row + featured + offscreen + jitter + merge
  weight     light −3, medium 0, heavy +2, huge +4 (swings and impacts)
  damage     clamp(6·log2((d + 2) / 12), −6, +5); a kill +2      (d = dealt, or the fallback average)
  size       +1.5 per size step above 1 (target size for impacts, falls, cries; attacker for swings), at most +7.5
  row        front 0, middle −2.5 (LP 9 kHz), rear −5 (LP 6 kHz)
  featured   +3; commander or pretender +2
  offscreen  −3 with LP 4 kHz
  jitter     ±1.5 dB from the instance seed
rate = (1 + jitter ±4%, voices ±2%) × (1 − 0.035·(size − 1)) × slow
pan  = clamp(0.85·(x − cameraCenter) / cameraHalfWidth, −0.85, 0.85)
```

Base levels are in `mix.ts`, in dB at the bus input before the sliders (sound proposal 6.2).
For example: swing −20, flesh −12, armor deflect −12, parry −14, arrow hits −16, death cry
−14, commander cry −8, falls −16, horns −8, spell burst −6, each terrain bed −28. The target
is about −18 LUFS integrated over a typical battle, with peaks at or below −1 dBFS.

### S3.8 The engine (Web Audio, impure)

```ts
// src/audio/engine.ts
export interface AudioVolumes { master: number; effects: number; voices: number; ambience: number }   // 0..100
export interface AudioEngine {
  /** Create or resume the AudioContext; call inside the click that opens the replay. */
  unlock(): Promise<void>;
  state(): 'running' | 'suspended' | 'unavailable';
  /** Bake in workers, idempotent, in the given priority order; resolves when P0 and P1 are ready. */
  prepare(needs: readonly RecipeId[], quality: 'high' | 'low'): Promise<void>;
  setScene(scene: BattleScene): void;                     // builds the reverb from the scene's IR spec
  setVolumes(v: AudioVolumes): void;
  setOptions(o: { muted: boolean; mono: boolean; calm: boolean; softHighs: boolean }): void;
  /** Anchor real time r of the plan to now and schedule from it; cancels what was scheduled. */
  start(plan: SoundPlan, r: number): void;
  pause(): void; resume(): void; stop(): void;
  skipToEnd(plan: SoundPlan): void;
  /** Real time of the plan by the audio clock, or null when audio is not running. */
  now(): number | null;
  stats(): EngineStats;
  dispose(): Promise<void>;
}
export function createAudioEngine(ctx?: BaseAudioContext): AudioEngine;   // an OfflineAudioContext in tests
```

**The graph:**

```
instance: AudioBufferSource → Gain → [Biquad LP for middle and rear rows or off-screen] → StereoPanner → class bus
class buses (swing, impact, gore, missile, voice, body, crowd, loop, spell, stinger, ambience):
          bus Gain → duck Gain → group; plus a send → reverb
groups:   effects, voices, ambience: fog LP → slow-motion LP → user slider Gain → master
reverb:   Convolver (generated IR) → return → master
master:   master Gain → soft-highs shelf (option) → glue compressor (−18 dB, knee 6, ratio 3, 10/150 ms)
          → limiter (−2 dB, ratio 20, 1/60 ms) → safety WaveShaper (tanh, 2× oversampled)
          → mono downmix (option) → destination
```

Calm mode lowers the glue threshold to −24 dB at ratio 4, takes stingers, booms, bursts, and
crashes down 6 dB, and gives every impact a 4 ms fade-in.

**Scheduling and the clock:**

- `setInterval(25 ms)` schedules every play whose real time falls in the next 120 ms. The
  start time is `ctx.currentTime + (at − now) − outputLatency` (else `baseLatency`, else 0).
- A play more than 40 ms late is dropped if it is shorter than 0.5 s. Otherwise it starts at
  the matching offset.
- **The audio clock is the playhead master.** While audio runs, the controller reads real
  time from `engine.now()` and converts it with `toStory`. Otherwise it uses
  `performance.now()` through the same pure `clock.ts`.
- A speed change or seek takes the cached plan for the new key and calls
  `start(plan, toReal(newMap, currentStory))`.

**Pause, resume, seek, skip, close, hidden tab:**

- **Pause:** effects and voices ramp to silence over 80 ms, and the one-shots stop. Ambience
  drops 10 dB and keeps playing.
- **Resume:** restores the groups, and does not restart one-shots that began before the
  pause.
- **Seek:** one-shots stop with a 30 ms fade. During a drag only ambience plays. On release,
  `sustainedAt` restarts the sustained layers at their offsets and levels. Long one-shots
  (over 1 s) that began within the last 0.5 s start at their offset.
- **Skip to end:** battle layers fade out over 0.2 s, and the outro set plays.
- **Close:** groups fade over 0.2 s and their nodes are released. The bank cache stays. The
  context is suspended after 10 s with no replay open.
- **Hidden tab:** the replay pauses and the context is suspended.

**Autoplay:**

- Capture-phase activation listeners create or resume the context on the first gesture.
- If a replay opens while the context is not running, the transport bar shows "Sound is off.
  Click to enable." The replay plays silently with captions until then.
- If no device is available, the sound menu says "Sound unavailable".

### S3.9 Baking

- **Workers:** `min(3, navigator.hardwareConcurrency − 1)` module workers, created on first
  need. A job is `{ recipeId, variant, bankVersion }`. The result is a transferred
  `Float32Array`. The main thread creates an `AudioBuffer` at the recipe's rate (16, 24, or
  32 kHz mono) and lets Web Audio resample.
- **Priorities** (`needs.ts`), read from the record and the timeline:
  - P0, the intro: both nations' horns, drums, and chants; the terrain beds; idle and march;
    flags; the impulse response.
  - P1, everything round 1 uses.
  - P2, the melee core for the units present.
  - P3, the rest, in story order of first use.

  The 3 s intro hides P0 and P1. Gore layers are baked only at Standard and up;
  commander-death sounds only if a commander dies; only the player's own outcome stinger.
- **A buffer that is not ready when due is skipped, never waited for,** and counted.
- **Session LRU:** keyed by `recipeId#variant`, capped at 128 MB, so a second replay of the
  same armies starts at once.
- **Idle pre-bake** at game load (`requestIdleCallback`, one worker): first the `always` set
  (36 recipes, 14 MB, 1.5 s of CPU), then the player's nation set (72 recipes, 28 MB).
- **Audio quality Low:** half the variants (the bags still avoid repeats) and rates capped
  at 24 kHz. About 45% of the memory.

### S3.10 Settings (UI store, never in `GameState`)

`src/ui/settings/presentation.ts` uses `zustand/middleware` `persist` with the key
`fm.settings.v1` and a version and migration. Every read and write is in try/catch, with
defaults if storage is unavailable or corrupt. It holds both the replay settings of S4.8 and
these audio settings:

| Setting | Default | Effect |
|---|---|---|
| Master, Effects, Voices, Ambience | 80, 80, 70, 50 | gain = (v/100)²; 80 is −3.9 dB, 50 is −12 dB, 0 is silent; 30 ms ramps |
| Mute (M) | off | remembered |
| Death cries | on | off: pains instead; din voices −6 dB |
| Captions | off | ticker captions: "[war horns]", "[Thornwood retreat horn]", "[screams]", "[a bell tolls]", "[thunder]", "[the god's death knell]"; at most one a second |
| Mono | off | downmix |
| Calm mode | off | S3.8 |
| Soft highs | off | −6 dB shelf above 4 kHz |
| Audio quality | High | Low: S3.9 |
| Gore | shared with the visuals | Off: no wet layers or gurgles, kill crunches 50%; Brutal: louder wet layers, tears, gurgles 50% |

Nothing is only audible. Every sound that carries information has a visual twin: deflection
sparks and the ARMOR chip, rout pennants and the ticker, name cards, spell symbols. Captions
cover the big moments.

### S3.11 Numbers (S3)

| Item | Value |
|---|---|
| Bake speed | ≥ 100× real time per worker (measured 134× to 186×) |
| Bake time, `starting` | 3.7 s on 1 worker, 1.2 s on 3 |
| Bake time, `clash300` | 5.6 s, 1.9 s |
| P0 bake time | < 1 s on 1 worker once the `always` set is pre-baked |
| Memory per battle | 38 to 78 MB (High); about 45% of that at Low |
| Session cache | 128 MB |
| Bundle | about 60 to 90 KB minified for synth, recipes, plan, and engine; no audio files |
| Scheduler | 25 ms tick, 120 ms lookahead, 40 ms late rule |
| Sources | ≤ 100 at the worst moment; 50 to 70 typical |
| Plan build time, `clash300` | ≤ 20 ms per map key |

### S3.12 Tests

**Vitest (Node), under `tests/present/sound/` and `tests/content/`:**

1. **DSP primitives** (`dsp.test.ts`):
   - a band-pass passes its center at 0 dB ±0.5;
   - a low-pass is −3 dB at its corner;
   - modal partials land at their ratios (Goertzel);
   - Karplus-Strong pitch is within 2%;
   - a voice's spectrum peaks near its formants (±10%);
   - grain counts match the Poisson rate (±3σ);
   - pink noise falls about 3 dB per octave (±1);
   - recursive oscillators stay stable over 10 s.
2. **Every recipe** (`recipes.test.ts`), variants 0 and 1:
   - the length is within its range;
   - every sample is finite;
   - the peak is −1 dBFS ±0.1;
   - RMS is above a floor and within ±3 dB of its family's target;
   - DC is under 0.01;
   - two renders are bit-identical;
   - variants 0 and 1 differ;
   - loops are seamless.

   `npm run test:audio` renders all variants (about 11 s) and stays out of `npm test`.
3. **Feature snapshots:** per recipe, variant 0's length, RMS and peak to 0.1 dB, and
   spectral centroid to 5%.
4. **Coverage** (`tests/content/presentation.sound.test.ts`):
   - every unit has a profile or a listed fallback;
   - every weapon resolves to a family;
   - every battle spell, terrain, and color template is mapped;
   - every `BattleEvent` kind and `SoundCue` kind is handled (exhaustive `never`);
   - every recipe id the planner can emit exists;
   - S6: no `pending` mappings.
5. **Planner** (`plan.test.ts`), on `starting`, `clash300`, `grind50`, a field fixture, and a
   pretender death:
   - the plan is deterministic, with a pinned hash per speed for `skirmish`;
   - gore Off yields no wet recipe; death cries off yields no cry;
   - every must-play is present at every speed;
   - **kept(4x) ⊂ kept(2x) ⊂ kept(1x)**;
   - the same story moment gets the same variant at every speed and from `playsFrom` after a
     seek;
   - every visible death has a fall at 1x;
   - there is at most one retreat horn per side per round;
   - the din is silent before the first melee and rises with attacks;
   - `needs()` contains every recipe the plan uses;
   - plans computed for the speeds in a different order are identical;
   - the build time for `clash300` is ≤ 20 ms.
6. **Allocator** (`allocate.test.ts`), on `demand.ts`-style bursts (first contact at 1x, 140
   instances a second):
   - caps are exceeded only by must-plays;
   - must-plays are never dropped or stolen;
   - the weakest tail is stolen first;
   - merges happen only within their windows;
   - dropped energy reaches the din;
   - ducks combine by the deepest.
7. **Scheduler on a fake clock** (`tests/audio/scheduler.test.ts`, with an injected clock and
   a fake engine):
   - pause stops one-shots and keeps the bed at −10 dB;
   - resume does not restart;
   - seek starts exactly the sustained layers that are active;
   - skip plays only the outro set;
   - the late rule and latency compensation hold.
8. **Mix math:** the slider curve; pan clamping and monotony; the row, off-screen, damage,
   weight, and size terms at their table points.
9. **Settings** (`tests/ui/settings.test.ts`): a round trip; corrupt JSON and a throwing
   storage give the defaults.

**Playwright** (in S5, listed here):

10. `battle-audio-render.spec.ts`: the real engine on `OfflineAudioContext(2, 8 s, 48000)`
    plays the `clash300` first-contact plan from a pre-baked bank. **Checks by range, never
    by hash:**
    - every sample is finite;
    - the peak is ≤ 0.99;
    - RMS over 400 ms windows is between −30 and −10 dBFS;
    - a left-only plan puts over 1.5× the energy in the left channel;
    - mono gives left equal to right;
    - ambience is ≥ 4 dB lower inside a burst duck;
    - mute gives silence;
    - `renderRecipe` in the page matches Node's RMS to 1e-6.
11. `battle-autoplay.spec.ts`: the context is `suspended` before a gesture and `running`
    after one.
12. `battle-audio-smoke.spec.ts`: play 3 s, switch to 4x, pause, seek, skip. There are no
    console errors, and after the intro no instance is skipped for lack of a buffer.
13. Bake timing (logged, soft limit): the `starting` set bakes in under 6 s on one worker.

### S3.13 The audition page and the listening gate

- **`lab/audition.html`** (dev only; absent from the build):
  - every recipe by family, with its variants as buttons;
  - waveform and spectrogram (`AnalyserNode`);
  - hot reload of recipe data;
  - export to WAV;
  - a **strike tester**: choose a weapon, material, reaction, damage, sizes, and gore, and
    hear the layered result as the planner builds it.
- **Dev overlay in the replay** (backtick, dev builds): active instances per class, drops,
  steals, merges, the din per side, ducks in force, and missing buffers.
- **Listening checklist**, owner, at S3a and S3b:
  - an axe on Briar Guard and a sword on Ash Militia sound different with eyes closed;
  - every unit type's death is recognizable;
  - the nations are told apart by ear;
  - 4x stays readable;
  - five battles in a row cause no fatigue;
  - the 300-vs-300 first contact is loud and clear, not mush;
  - a commander's death stops the room.
- **Voice gate.** If the death cries still fail the checklist after two tuning passes, the
  owner chooses between two remedies, for that family only:
  1. CC0 recordings through the `sample` layer, with provenance in
     `src/audio/samples/LICENSES.md`;
  2. cries lowered by 4 dB, so that impacts and the din carry the brutality.

Gate:

- S3a: `typecheck && lint && test && test:e2e` (tests 10 to 12).
- S3b: the same, plus `npm run test:audio` and the owner's listening sign-off recorded in
  PROGRESS.

---

## S4. The Pixi battle renderer, placeholder art, HUD, controls, settings

### S4.1 Files

```
src/render/BattleRenderer.ts           the docs/06 entry point
src/render/battle/scene.ts             scene graph and per-frame sync
src/render/battle/layers/              backdrop, decals, shadows, troops, bodies, projectiles,
                                       fxAdd, fxNormal, auras, fields, floaters, overlay
src/render/battle/pools.ts             preallocated pools that grow ×1.5 (growth logged)
src/render/battle/quality.ts           auto quality from frame times
src/render/battle/context.ts           WebGL context loss and restore
src/render/sprites.ts                  TextureFactory (the docs/06 slot): atlases, glyph font, decals
src/render/battle/parts/PartSet.ts     the seam Phase 11 swaps
src/render/battle/parts/procedural/    archetype rigs drawn with Graphics (S4.4), backdrops, glyph font
src/present/battle/rig.ts              (pure, S2) pose -> part transforms
src/ui/panels/BattleReplay.tsx         modal shell (S6 wires it to the game)
src/ui/replay/ReplayController.ts      owns the clock, renderer, and audio; play, pause, seek, speed, beats, step, skip
src/ui/replay/useReplay.ts             useSyncExternalStore over the controller (10 Hz for panels)
src/ui/replay/TopBar.tsx SideDock.tsx Ticker.tsx Transport.tsx Scrubber.tsx NameCard.tsx
            ResultCard.tsx LogPanel.tsx ReportView.tsx SettingsPopover.tsx SoundPopover.tsx DevOverlay.tsx
lab/battle.html, src/lab/main.tsx      minimal page in S4 (one fixture, transport); completed in S5
```

### S4.2 Renderer API (architecture 4.1, kept)

```ts
export interface BattleRendererInit {
  parent: HTMLElement; timeline: Timeline; view: ViewFilter; parts: PartSet;
  onContext?(state: 'lost' | 'restored' | 'failed'): void;
}
export class BattleRenderer {
  static create(init: BattleRendererInit): Promise<BattleRenderer>;   // Application.init, atlases, backdrop
  /** Evaluate at story time t and draw. The only per-frame entry point; holds no animation state. */
  render(t: Ms): void;
  setView(view: ViewFilter): void;
  highlight(group: BattleUnitRef | null): void;
  resize(width: number, height: number): void;
  stats(): RenderStats;   // frame CPU p50/p95, sprites, particles, decals, draw calls, pool growth
  destroy(): void;
}
```

The `Application` is created with:

```ts
{ preference: 'webgl', antialias: true, resolution: Math.min(devicePixelRatio, 2), autoDensity: true }
```

Its ticker is stopped; the controller drives `render(t)` from its own rAF loop. The replay
has its own `Application`, and the map's ticker is stopped while the modal is open.

### S4.3 Scene graph and per-frame sync (architecture 4.2 and 4.3)

```
stage
  world (fit × camera zoom, pan, shake, rotation; ColorMatrixFilter for desaturation, dim, time of day)
    backdrop    sky, far, mid, ground (generated RenderTexture per terrain and seed)
    decals      Sprite of a world-size RenderTexture (corpses, pools, splats, arrows, weapons, scorch, flowers, parts)
    fieldUnder  fog banks, wall base
    shadows     ParticleContainer
    troops      Container, sortableChildren (zIndex = y): per actor a rig Container of part Sprites
    bodies      pooled ghost bodies and falling parts
    projectiles ParticleContainer
    fxNormal    ParticleContainer (blood, sap, dust, chips, smoke, leaves)
    fxAdd       ParticleContainer, blend 'add' (sparks, embers, holy motes, spell bursts)
    auras       pooled rings and overlays (bark, vines, halos, red veins)
    fieldOver   rain streaks, fog top, lightning
    floaters    pooled BitmapText (procedural glyph font)
  overlay
    flash, vignette, cards (round, interlude), chips
```

Each frame:

1. `evaluateInto(frame, timeline, t, view)`.
2. Assign each actor's rig transforms from `rig.ts`: one pass of `visible`, `x`, `y`,
   `scale`, `alpha`, `texture` (white parts during a flash), and `rotation`.
3. Transients: `pool.beginFrame()`, then `acquire()` per active item, then `endFrame()`.
4. Particles: `particleAt()` per burst into pooled particles, culled against the camera.
5. Decals: stamp new ones. On a backward seek or a context restore, clear and re-stamp from
   0.
6. Camera, overlay, and `renderer.render(stage)`.

Nothing keeps display state per cue, so a backward seek is never wrong.

### S4.4 Placeholder art: procedural rigs, visceral before Phase 11

**The seam:**

```ts
// parts/PartSet.ts
export type PartId = 'legBack' | 'legFront' | 'torso' | 'armBack' | 'head' | 'helm' | 'cloak' | 'armFront'
  | 'weapon' | 'weapon2' | 'shield' | 'quiver' | 'banner' | 'mountBody' | 'mountHead' | 'mountLegs' | 'tail'
  | 'wingL' | 'wingR' | 'neck' | 'jaw' | 'crown' | 'core' | 'glyphs' | 'cracks';
export interface PartTexture { tex: Texture; white: Texture; pivot: Vec; anchor: Vec; zOrder: number }
export interface RigTextures { rig: Rig; parts: Partial<Record<PartId, PartTexture>>; portrait: Texture }
export interface SidePalette { banner: number; skin: number; gear: number; trim: number }
export interface PartSet {
  build(unit: UnitTypeId, look: UnitLook, palette: SidePalette): RigTextures;   // synchronous after load()
  load(): Promise<void>;
  rebuild(): Promise<void>;                                                       // after a context restore
}
export function proceduralPartSet(renderer: Renderer): PartSet;   // S4
// Phase 11: svgPartSet(renderer, manifest), falling back per part to proceduralPartSet
```

**Rigs** (`docs/09` archetypes):

| Rig | Parts | Used by |
|---|---|---|
| biped | legs, torso, arms, head, helm or hood, a cloak or tabard tint zone, weapon, optional shield, quiver, banner | infantry, archers, skirmishers, berserkers, sacred, mages, priests, scouts, leaders, giant, titan, colossus, oracle |
| rider | a seated biped on a horse or wolf mount (body, head, legs, tail) | Ash Rider, Wolf Rider |
| quadruped | body, head, four legs, tail | wolf |
| serpent | body, head, jaw, four legs, three tail segments | salamander |
| treant | trunk, crown, two limbs, roots | treant |
| wyrm | body, three neck segments, head, jaw, two wings, tail | Great Wyrm |
| slab | slab, glyphs (tinted by color), cracks | Living Monolith |
| swarm, sprite, spirit | closed-form dot clouds, a flame core with a flicker ring, a translucent beast | Hornet Swarm, Fire Sprite, Wild Spirit |

**Drawing.**

- Parts are Pixi `Graphics` paths with flat fills and a 2 px dark outline (#1C1A17 at 60%).
  They are drawn at 2× into 128 px atlas frames, in one or two 2048² atlases built when the
  replay opens. There are about 6 to 10 draw calls per frame.
- **Silhouettes differ by archetype at a glance:**
  - heavy infantry: broad shoulders and a helm;
  - archers: bow and quiver;
  - skirmishers: bare arms and a javelin bundle;
  - berserkers: bare torso, warpaint, and a great axe;
  - mages: robe and staff; priests: robe and a symbol staff;
  - scouts: hoods;
  - leaders: a banner on the back;
  - cavalry: a mount.
- Nation layers follow `docs/09`:
  - Cinder Horde: ash-grey skin (#8F8C88), scale plates (#6E6A64 with rust edges), jagged
    axes;
  - Thornwood: tan skin (#A0785A), bark ridges (#6B4A2B), leaf cloaks;
  - Independents: the plain palette.
- Materials have colors: plate #A8ADB3, mail #8C9096, steel #C9CDD2, wood #7A5A3A, fire glow
  #FFB347.
- The cloth tint zone is the banner color. So nations differ by part shapes and by color.
- **White silhouettes:** each part is also drawn filled white into the atlas. A hit flash
  swaps the textures for one frame, with no filter.
- **Poses** come from `rig.ts`, closed form: idle, walk, run, brace, every weapon motion,
  draw and loose, cast, flinch, stagger, dodge, parry, shield-up, the falls per death style,
  lie, kneel, limp, cheer, and rout (flipped, arms up).
- **Corpses:** when a death settles, the actor's final pose is stamped into the decal texture
  at 55% brightness on its pool, and the actor is hidden. Ghost bodies are pooled rig copies
  that fall, then stamp.
- **Dismemberment** (Brutal): `head` with `helm`, or `armFront` with `weapon`, detaches as a
  tumbling body sprite and then stamps. Survivors with a melee kill get a blood stamp on
  their `weapon` part.
- **Backdrops:** a sky gradient by time of day, a far ridge from seeded value noise, a mid
  layer, and the ground fill. Props are scattered by seed: grass tufts, rocks, reeds, dead
  trees, crop rows, a windmill. The storm variant has a fort wall polygon with crenellations,
  or a rubble gap.
- **Portraits** for name cards and docks are the rig in its idle pose at 2×, on the banner
  color.
- **Procedural glyph font:** digits, `+`, `−`, skull, shield, flame, leaf, snowflake, sun,
  drop, chevrons, and flag, as stroked paths in a `BitmapFont`. No font files, and the same
  pixels on every machine.

### S4.5 Effects as drawn

- **Hit-stop:**
  - Local: the struck and striking rigs hold their pose for the table's milliseconds (in
    story time, from cue data).
  - Global: the time map's holds freeze the whole scene, while the sound rings on.
- **Shake, push-ins, desaturation, dim, slow motion:**
  - `cameraAt(t)` drives the world container.
  - The world's `ColorMatrixFilter` handles desaturation (commander deaths 60%, god deaths
    100%), dim (Pyre Storm 30%, storm 35%), and time of day.
  - There are no per-sprite filters.
- **Particles:**
  - additive for sparks, embers, motes, and rays;
  - normal for blood, sap, dust, chips, smoke, and leaves;
  - color motions per `docs/09`;
  - counts scaled by quality.
- **Decals:**
  - splats merge each wound's or kill's droplets into one stamp;
  - pools grow over 1.2 s through a transient sprite, then stamp;
  - arrows that miss stick in the ground;
  - per-battle cap of 8,000 stamps, the oldest droplet splats merging first.
- **Fields:** rain (1,200 streaks), lightning (through the flash limiter), three fog layers,
  and a wall in the caster's color.
- **Auras:** bark creeping up (mask wipe), vines that coil and wither, halos, red veins at
  1.2 Hz, and a glow on banners.

### S4.6 HUD (React DOM over the canvas; spectacle 10)

```
+--------------------------------------------------------------------------------------------+
| Battle of Kharsk Ford · Hills · Y2 M5 D12 | ROUND 4 [Spells][Missiles][Melee][Morale] | [field chip] [Log] [gear] [X] |
| [========== Cinder Horde 214 =====|====== Thornwood 187 ==========]  tug-of-war strength bar |
+-----------+----------------------------------------------------------------+-----------+
| LEFT DOCK |                       battle canvas                            | RIGHT DOCK|
| (player)  |   cards, chips, floaters drawn in the canvas                    | (enemy)   |
|           |   ticker: 4 lines, bottom-left over the canvas                  |           |
+-----------+----------------------------------------------------------------+-----------+
| |<  <  [ > ]  >  >|   0.5x 1x 2x 4x  [Beats]   ===o====skull==flag====   0:32 / 1:14   [speaker] |
+--------------------------------------------------------------------------------------------+
```

- **Bars and docks.** The top bar is 48 px and the transport is 88 px. The docks overlay the
  canvas: 280 px expanded, 72 px collapsed, toggled with Tab.
- **Dock header:**
  - nation name, banner, and mana symbol;
  - ATTACKER or DEFENDER, with a side glyph (a pointed shield for the attacker, a round
    shield for the defender);
  - active troops in a large number, with losses below.
- **Commanders** in the dock:
  - portrait, name, and unit;
  - an exact HP bar ("9 / 14");
  - a fatigue bar for casters (A4), with an EXHAUSTED chip at 100;
  - status chips.
- **Squads** in the dock, indented under their commander:
  - icon, name, and "37 / 60", with a red "−3" flash when it drops;
  - the break-chance meter (detailed mode);
  - buff and debuff chips: stat glyph, signed number, an arrow, and rounds left;
  - tags: ROUTING, FLED, WIPED OUT, SUMMONED, and "Provincial defense".
- **Dock rules:**
  - Counts change at the `count` cue, when the death is shown.
  - Hovering a dock row outlines the block and its banner on the field, and the reverse.
  - The tooltip gives stats, weapons, and buffs.
- **Ticker:** 4 lines, the newest on top, each fading after 6 s. Each line starts with the
  side glyph and banner color, with mana symbols for spells, and bold for beats. Clicking a
  line seeks to it.
- **Scrubber:** round ticks and beat icons sized by weight: a skull for a commander death, a
  broken flag for a rout, the spell's symbol, crossed swords for first contact. Dragging
  seeks.
- **Name card** (S2.8) and **interlude cards.**
- **Result card:**
  - "VICTORY" or "DEFEAT", or "The attackers withdraw", or "No one holds the field; the
    defenders keep it";
  - per side: start, killed, fled, survived, commanders lost; spells cast; the deadliest
    squad;
  - buttons: Watch again, Close, Go to province.
- **Log panel (L).** Two tabs, both screen-reader friendly:
  - **Events:** every ticker line, filterable by side and kind, click to seek;
  - **Report:** S2.15's prose per round.

  Beats are also announced through an `aria-live="polite"` region.
- **"Summary replay" chip** in the top bar in fallback mode, with a tooltip saying why.
- **Popovers:** the gear popover holds the replay settings (S4.8); the speaker popover holds
  the four sliders, mute, captions, and the "Click to enable" state.

### S4.7 Controller and keys

```ts
export interface ReplayControllerInit {
  parent: HTMLElement; record: BattleRecord; leftSide: BattleSide; tints: Record<BattleSide, number>;
  settings: PresentationSettings; audio: AudioEngine | null; parts?: PartSet; clock?: TimeSource;
}
export interface ReplaySnapshot {
  story: Ms; real: number; playing: boolean; speed: PlaybackSpeed; beats: boolean; round: number;
  phase: BattlePhase | null; panel: PanelState; ticker: TickerLine[]; mode: 'detailed' | 'aggregated';
  ended: boolean; audio: 'running' | 'suspended' | 'unavailable' | 'off';
}
export class ReplayController {
  static open(init: ReplayControllerInit): Promise<ReplayController>;
  readonly timeline: Timeline; readonly prepared: PreparedBattle;
  play(): void; pause(): void; toggle(): void;
  setSpeed(s: PlaybackSpeed): void; setBeats(on: boolean): void;
  seek(story: Ms): void; stepRound(dir: 1 | -1): void; stepBeat(dir: 1 | -1): void; nextBeat(): void;
  skipToEnd(): void; restart(): void;
  setSettings(p: Partial<PresentationSettings>): void;   // rebuilds the view, time map, and plan as needed; never the timeline
  snapshot(): ReplaySnapshot; subscribe(fn: () => void): () => void;
  destroy(): void;
}
```

**Opening:**

1. Show the modal frame (one rAF).
2. `prepareBattle`, then `buildTimeline`, then `buildTimeMap`.
3. In parallel: `BattleRenderer.create`, and `audio.prepare(needs)` behind the 3 s intro.
4. Play from 0 at the remembered speed and Beats setting.

A missing buffer is skipped and never delays the picture.

**Keys** (the modal captures them; the game's own keys are inactive):

| Key | Action |
|---|---|
| Space | pause |
| ← / → | previous or next round start |
| Shift+← / Shift+→ | previous or next beat |
| N | next beat |
| 1 to 4 | 0.5x, 1x, 2x, 4x |
| B | Beats mode |
| S or End | skip to end |
| Home | restart |
| M | mute |
| L | Log |
| Tab | docks |
| Esc | close |

A click anywhere during the intro skips it. Focus stays in the modal.

### S4.8 Replay settings

These live in the UI store with the audio settings (S3.10), never in `GameState`.

| Setting | Values (default first) | Effect |
|---|---|---|
| Gore | Standard, Off, Brutal | Off: no blood (dust instead), no pools, dark silhouette corpses, no dismemberment, death cries become grunts unless "Death cries" is on. Brutal: more blood, chunks, dismemberment, gore on survivors. |
| Screen shake | Full, Low, Off | trauma ×1, ×0.5, 0 |
| Hit-stop and slow motion | On, Off | Off removes global holds and slow motion; deaths get a 0.5 s freeze frame |
| Flashes | Full, Soft, Off | full-scene flash alpha 0.15, 0.07, 0; the 3-per-second limiter is always on |
| Reduced motion | System, On, Off | S2.14; System follows `prefers-reduced-motion` |
| Detail | Auto, High, Medium, Low | particle and decal quality only; Auto steps down when the p90 frame time is over 18 ms for 2 s |
| Damage numbers | On, Off | skull counts stay |
| Combat ticker | On, Off | |
| Follow action | On, Off | push-ins and drift |
| Speed and Beats mode | remembered | |

**Color vision:**

- Sides are told apart by banner, side glyph, and position (the player is always on the
  left).
- Elements carry glyphs; buffs carry signs and arrows; hit flashes are white.
- An optional outline (1.5 px in the banner color, with a dark keyline) helps on busy
  ground.
- New colors join `tests/content/palette.test.ts`.

### S4.9 Frame budget, quality, context loss

The target is 60 fps at 1920 × 1080 on a mid laptop with an integrated GPU.

| Part | Budget |
|---|---|
| `evaluateInto` | ≤ 2 ms |
| rig and transient sync | ≤ 2.5 ms |
| particles (≤ 6,000) | ≤ 2.5 ms |
| Pixi CPU (≤ 10 draw calls) | ≤ 3 ms |
| GPU | ≤ 6 ms |

**Load in `clash300`:**

- about 300 actors with about 8 parts each (about 2,400 sprites), plus 300 shadows;
- at most 600 projectiles in flight;
- at most 6,000 particles;
- at most 8,000 decals, baked.

**Generation and re-baking:**

- Atlas and backdrop generation at open takes ≤ 300 ms.
- A decal re-bake takes ≤ 15 ms, and happens only on a backward seek or a restore.

**Pool sizes** are preallocated: projectiles 640, bodies 160, floaters 160, auras 64, and
particles 6,000.

**Culling:** a bounds check against the camera rect, and `cullable` on large containers.

**WebGL context loss** (architecture 4.6):

1. On `webglcontextlost`, pause and show "Graphics reset…".
2. On restore, `parts.rebuild()`, decals reset to 0, then `render(t)`. The restored frame
   equals the frame before the loss. Play resumes if it was playing.
3. If there is no restore within 3 s, offer "Reopen" (recreate at the same t) or the Report.

With no WebGL at init, the modal opens on the Report tab with a note.

### S4.10 Tests

- **Node:**
  - `tests/present/battle/rig.test.ts`: every rig and pose gives finite transforms; poses
    are continuous at their boundaries (≤ 2 wu jumps); parts stay within the rig's bounding
    box.
  - `tests/ui/replay/controller.test.ts`, with a fake clock, fake renderer, and fake audio
    engine:
    - play, pause, speed, Beats, step, next beat, skip, restart, and every key of S4.7 drive
      the clock correctly;
    - settings changes never rebuild the timeline;
    - the audio clock, when present, is the playhead.
- **Playwright** (S4 adds a minimal `battle-smoke.spec.ts`):
  - the minimal lab page renders `starting` at t = 0, at first contact, and at the end with
    a non-blank canvas (pixel variance above a floor);
  - no console errors.

Gate: `typecheck && lint && test && test:e2e`.

---

## S5. The battle lab and the Playwright suite

### S5.1 The lab (`lab/battle.html`, dev only; architecture section 7)

- **Serving.** It is served by `npm run dev` at `/lab/battle.html`, and
  `npm run lab = vite --open /lab/battle.html`. It is absent from the production build: Vite
  builds `index.html` only, and a test asserts `dist/` has no `lab`.
- **Sources:**
  - a named fixture with a seed;
  - `randomBattle(seed, { size: 'small' | 'medium' | 'large' | 'huge', magic })`, built from
    content (nations or independents, 1 to 4 commanders, mages with random known spells for
    their pips, 1 to 6 squads of 5 to 200, terrain);
  - a **pasted `BattleRecord`** JSON from a save, for bug reports.

  Fixtures become real records through `resolveBattle` and `toSetupRecord`, so the lab runs
  the game's pipeline.
- **Fixtures:** the 30 of S1.9.
- **URL state:**
  `?fixture=&seed=&random=&speed=&beats=&t=&paused=1&gore=&motion=&quality=&left=&mode=fallback`.
  `mode=fallback` forces the synthesized path, to check honesty.
- **Tabs:**
  - **Watch:** the replay with HUD and sound.
  - **Detail:** the current phase's blows with rolls, for example "Cinder Warrior #37 →
    Warden #12: 11+9 vs 10+7 hit; 11+5+8−3−6 = 15 → 11 hp, killed (overkill 4)". Clicking a
    blow highlights both sprites.
  - **Cues:** the cues near the playhead.
  - **Timeline stats:** sampled vs shown per speed, ghosts, montage.
  - **Audio:** the audition (S3.13), per-class mute and solo, the plan near the playhead,
    caps and drops.
  - **Perf:** fps, p50 and p95 frame CPU, sprites, particles, decals, pool growth.
  - **Verify:** `matchesRecord`, `checkTimeline`, and a diff of panel against fold.
- **`window.__lab`:**

```ts
interface LabApi {
  load(spec: { fixture?: string; random?: { seed: number; size: string; magic: boolean }; seed?: number;
    record?: BattleRecord; left?: BattleSide; mode?: 'auto' | 'fallback' }): Promise<void>;
  ready(): Promise<void>;                          // timeline built, atlases and P0/P1 sounds baked, first frame drawn
  seek(story: Ms): void; play(speed?: PlaybackSpeed): void; pause(): void; renderOnce(): void;
  timeline(): { duration: Ms; realDuration: number; rounds: RoundMark[]; beats: Beat[]; mode: string };
  setView(o: Partial<ViewOptions>): void; setSettings(o: Partial<PresentationSettings>): void;
  stats(): RenderStats & { audio: EngineStats; timeline: TimelineStats };
  loseContext(): void; restoreContext(): void;
  canvasPixels(): Promise<{ width: number; height: number; data: Uint8Array }>;
  renderAudioOffline(spec: { fromStory: Ms; seconds: number; options?: Partial<AudioOptions> }): Promise<Float32Array[]>;
}
```

### S5.2 Playwright

- **Dependency:** `@playwright/test` pinned to **1.56.1**, which matches the installed
  Chromium build 1194 under `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`. Downloads are off in
  this environment.
- **`playwright.config.ts`:**
  - `webServer: npx vite --port 5179 --strictPort` (an existing server is reused);
  - viewport 1920 × 1080, `deviceScaleFactor: 1`;
  - Chromium arguments `--use-angle=swiftshader --enable-unsafe-swiftshader
    --autoplay-policy=no-user-gesture-required`; the autoplay spec uses the default policy;
  - screenshots are canvas-only (`locator('canvas')`) at fixed story times, with quality
    High.
- **Scripts:** `test:e2e` runs `playwright test`; `test:audio` is the full recipe render.

| Spec | Checks |
|---|---|
| `battle-screens.spec.ts` | Non-blank at intro, first volley impact, first-contact peak, after the first death, and the end, for `starting`, `clash300`, `pyreStorm`, `mageDuel`, `stormFort`, and each of the seven terrains. **6 baselines** (`toHaveScreenshot`, maxDiffPixelRatio 0.01, threshold 0.2): `starting` at first contact; `clash300` at the first-contact peak; `pyreStorm` at impact; `commanderDuel` at the name card; `starting` at first contact with gore Off; `clash300` at the end (the field of bodies). |
| `battle-visceral.spec.ts` | At `clash300` first contact with gore Standard: blood-red pixel clusters above a floor; `stats()` shows sparks, blood bursts, and ≥ 1 body decal per kill shown so far. With gore Off: no blood-red clusters, and the same body count as dark silhouettes. |
| `battle-context.spec.ts` | Screenshot at t; `loseContext()`; `restoreContext()`; `ready()`; the same screenshot within tolerance. |
| `battle-perf.spec.ts` | `clash300` at 4x for 5 s: frames > 150, p95 frame CPU < 12 ms (software GL makes GPU time meaningless, so CPU is the gate), no pool growth after the first second. |
| `battle-controls.spec.ts` | Space pauses, the speed buttons and keys change the rate, End skips to the result card, Shift+→ jumps to the next beat, Esc closes. |
| `battle-audio-render.spec.ts`, `battle-autoplay.spec.ts`, `battle-audio-smoke.spec.ts` | S3.12 tests 10 to 12 |
| `replay-modal.spec.ts` (S6) | From the game screen: a battle message, then the modal, then Space, End, Esc. |

**Policy:**

- `npm run test:e2e` is required for commits that touch `src/render`, `src/audio`,
  `src/ui/replay`, or `src/lab`. It stays out of `npm test`.
- Baselines change only in a commit that says so. Phase 11's art commit refreshes them all.

---

## S6. Integration: Phase 10 (the modal) and Phase 11 (SVG parts)

### S6.1 Phase 10: `BattleReplay` (after Phases 8 and 9)

1. **Entry points.** A 'battle' message's "Watch" button (`docs/07` messages), and the
   auto-pause on a player battle, open `src/ui/panels/BattleReplay.tsx` for its
   `BattleRecord`. A message whose record is gone says "replay no longer kept" (an existing
   decision).
2. **The click that opens the modal** calls `audio.unlock()` synchronously. The modal:
   - creates the `ReplayController` with `leftSide` set to the player's side and the
     nations' banners as tints;
   - keeps the game paused;
   - stops the map renderer's ticker.

   Esc or × destroys the controller and resumes the map ticker. The game stays paused until
   the player resumes it.
3. **The Phase 9 settings screen** gains a "Battle replays" section (S4.8) and a "Sound"
   section (S3.10), bound to the same store. The modal's popovers are shortcuts.
4. **Saves** (Phase 9's caller of `serialize`):
   - write JSON through `CompressionStream('gzip')` to an IndexedDB `Blob`;
   - read it back through `DecompressionStream`;
   - `serialize.ts` starts its migration map with version 1 to 2 (S1.5);
   - lenient `rerun` validation;
   - a test pins a 20-record save under 200 KB gzipped (measured 101 KB).
5. **`replay-modal.spec.ts`.**
6. **Acceptance:** `docs/10` criteria 7 and 14 as rewritten (Spec text), all S2 and S3 tests,
   zero `pending` sound mappings, and the owner's listening sign-off (S3.13).

### S6.2 Phase 11: SVG parts replace the placeholders

- `svgPartSet(renderer, manifest)` implements `PartSet` from the `docs/09` part SVGs:
  - body, armor, weapon, and a tint zone filled with `currentColor`, rasterized per banner
    at 2×;
  - for a missing part, the same `PartId` from `proceduralPartSet`.

  The `TextureFactory` and renderer do not change.
- `src/assets/sprites/manifest.ts` maps unit ids to part names per rig.
  `tests/content/presentation.test.ts` checks that every unit's parts exist in the manifest,
  or are listed as procedural fallbacks.
- Portraits for name cards and docks come from the same SVG at 2×, and chassis portraits
  from the 128×128 SVGs.
- The spell particle palettes are final.
- The six screenshot baselines are refreshed in this commit only.

---

## Risk register

| # | Risk (from the judges) | Where it is handled | Proof |
|---|---|---|---|
| 1 | The sink or A1 to A5 shift a draw | S1.4 rules; rolls bound to locals; no draw inside `if (detail)` | the golden test (A1 to A5 stripped), sink equivalence over 30 fixtures × 20 seeds including the rng state after, unchanged balance tests |
| 2 | Re-run diverges after a content or code change, or a bad `rerun` breaks a load | `matchesRecord` on the whole stored log, winner, and rounds; the fallback; lenient load | `rerun.test.ts`, `prepare.test.ts`, the migration test |
| 3 | Fallback shows what the log does not say | A2 counts drive outcomes; no rolls, no meter, killers only from `by` or casts | invariant 7, the lab's `mode=fallback` |
| 4 | Overkill shown as wounds | `onFallen` (A2) and the follow-through reaction; `hpBefore = 0` in detail | consistency tests, invariant 7 |
| 5 | Speed or seek changes what a moment shows or plays | one timeline; ranks; fixed per-instance draws; variant ordinals from the 1x expansion | `sample.test.ts`, `plan.test.ts` subset and variant tests |
| 6 | Sprites lie about strength | `visible()` with dynamic files; exact badge; a body for every kill | `proxies.test.ts`, invariant 4 |
| 7 | Battles too long to watch | windows, brisk rounds, montage, the 150 s cap loop, Beats mode, step, scrub, skip | `pacing.test.ts` on `starting`, `clash300`, `grind16`, `grind50`, `immortal`, and 200 random battles |
| 8 | Audio not deterministic, late, or heavy | pure DSP; bake priorities behind the intro; skip, never wait; LRU; Low quality | `dsp.test.ts`, `recipes.test.ts`, browser range tests, bake timing log |
| 9 | First contact turns to mush | class caps, priorities, must-plays, merges, energy into the din, ducks, limiter and tanh | `allocate.test.ts`, `battle-audio-render.spec.ts`, listening checklist |
| 10 | Robotic voices | staged bank, audition page, voice gate with a CC0 slot or −4 dB | owner sign-off in PROGRESS |
| 11 | Photosensitivity, motion, gore | the flash limiter always on; reduced motion follows the OS; gore Off keeps silhouettes; captions; Report | `view.test.ts`, `battle-visceral.spec.ts` gore Off case |
| 12 | Save growth | the size pins; gzipped saves; a 20-record save pin | `rerun.test.ts` pins, the Phase 9 save test |
| 13 | Purity guard gaps or pattern collisions | `src/present` in all three guards; the import-direction scan; `src/audio` not pure | `purity.test.ts`, ESLint, `tsconfig.sim.json` |
| 14 | Exact-shape tests break | S1.7 lists them; updated in the same commit | `npm test` green |
| 15 | Screenshot flakiness | swiftshader, the scene as a function of t, a procedural font, canvas-only captures, 6 baselines | `battle-context.spec.ts` (equal after restore), CI reruns |
| 16 | Coverage gaps for new units or spells | `lookFor` and profile fallbacks; exhaustive switches; content fixtures | `presentation.test.ts`, `presentation.sound.test.ts` |

---

## Implementation decisions

Choices made where this doc was silent, recorded per `CLAUDE.md`:

**S1 (the resolver's detail sink and re-runnable records)**
- **Files**: landing the hits moved out of `attacks.ts` into `src/sim/battle/landing.ts`
  (`land()`, life drain, fire-shield burns, and the strike detail), so neither file passes 400
  lines. The migration map is `src/sim/migrate.ts` (`MIGRATIONS`, `migrateState`), which
  Phase 9's `serialize.ts` runs on load.
- **No cost without a sink**: an attack's strike detail is built at roll time only when a sink
  is set, and `land()` adds `at` and the landing; without a sink an attack carries one null
  field more than before. Measured on the named fixtures, the resolver's time without a sink
  is unchanged within noise.
- **`applyBattle`** takes the capture as an optional last argument: without it (tests that
  hand it a made-up result), the record still gets its scene and a null `rerun`.
- **`span()`** returns what its step returns, so the end step can hand back the winner.
- **`matchesRecord`** compares the logs as JSON values (key order free, a key holding
  `undefined` counts as absent), so a record in the same session and one read from a save
  compare alike.
- **`validRerun`** checks an object with a setup naming a province, both sides with squad and
  commander arrays and a summons object, every commander's spells as strings, a valid
  `RngState`, and a `rules` string.
- **`BattleRerun.rules`** (added after the adversarial check): `battleRulesHash()`, the cyrb53
  hash of `BATTLE`, `FIELD_EFFECTS`, `UNARMED`, the battle spells and the unit types (summons
  are built from content), computed once per run. `migrateState` loads a re-run whose hash
  differs from the current build's as null, so the battle replays from its log alone. Without
  it, a rule change that left the log intact went unnoticed and the viewer showed rolls the
  battle never had.
- **The golden pin** (`tests/sim/battle/golden.json`) holds two hashes per fixture and seed:
  `log` as above, and `outcome`, the hash of `{ casualties, squads, commanders, roster }`, so
  the outcomes are pinned across the refactor too.
- **Fixtures**: the named list is `tests/sim/battle/fixtures/named.ts` and the armies it
  shares are in `armies.ts` beside it (one file would pass 400 lines); S2 moves both.
  `stormFort` folds the storm modifiers (walls standing) into the defenders'
  stats; `pdDefense` uses the `pd0`/`pd1` refs with no commander; `mageDuel` has a third Red
  caster with only Ember Dart and a Sapling Druid with only Bark Skin, so all eleven spells are
  cast on every seed; `salamander` is made sturdy enough to run out of breath.
