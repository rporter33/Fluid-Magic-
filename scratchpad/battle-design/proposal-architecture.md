# Battle presentation: architecture, determinism, performance, testability

Proposal for the battle replay track (visceral, detailed replays with sound effects). Written
against `/home/user/fm-godless` (Phases 0 to 6) with the Phase 5 fix branch's event changes
(`buff.untilRound`, `summon.hp`) assumed. This document is meant to serve as the build spec. It
covers how per-blow detail travels from the sim to the screen and the speakers, and how each
step is kept deterministic, fast, and tested.

Project owner's direction (binding): *"the battles should be visceral with detail and sfx since
its not real time that should be fine, take what you need to get this done"*. Sound for battles
is therefore in M1 scope.

---

## 0. Decisions at a glance

| # | Question | Decision |
|---|----------|----------|
| 1 | Where per-blow detail comes from | **Re-run.** `BattleRecord` stores the battle's setup (spells by id) and the rng state it began with. The viewer re-runs the same pure `resolveBattle` with an optional **detail sink**, then checks that the re-run's aggregated replay equals the stored one. Detail is never saved. |
| 2 | What happens when a re-run cannot be trusted | **Synthesized fallback.** If the record has no setup (older save), the re-run throws, or the re-run differs from the stored log (content or code changed since), the viewer builds the same intermediate script from the stored aggregated log. It invents who hit whom with a seeded presentation rng and shows no roll numbers. Every record stays watchable. |
| 3 | Save growth | +0.7 to 6.5 KB of JSON per record, measured. At most about 130 KB for 20 worst-case records, typically about 30 KB. Logging every blow instead would cost up to 653 KB per record and 13 MB for 20. `STATE_VERSION` 1 becomes 2. |
| 4 | Where presentation logic lives | A new **pure** top-level directory, `src/present/**`, added to the purity guard. It holds the intermediate script, layout, pacing, timeline, frame evaluation, particles in closed form, and the sound plan and DSP. It may import `sim` and `content`. Nothing pure may import it except itself. |
| 5 | Timeline model | One canonical timeline per battle, in milliseconds at 1x, independent of speed. Playback speed, gore, reduced motion, the flash limit, and LOD are pure *filters* applied at playback. |
| 6 | Renderer model | **The scene is a pure function of time**: `evaluateInto(frame, timeline, t)`. Particles are closed-form functions of age, so there is no simulation state. The Pixi layer syncs the frame model in immediate mode each frame. Seek, skip, scrubbing, screenshot tests, and recovery from context loss all follow from this. Only decals are baked, and they can be rebuilt up to any `t`. |
| 7 | Audio boundary | Timeline `SoundCue[]` → pure `planSounds(timeline, speed)` (LOD, per-window caps, polyphony) → `AudioEngine` (Web Audio). Sounds are **synthesized in pure TypeScript DSP** from recipes stored as data, baked in a Worker into `AudioBuffer`s. There are no audio files and no randomness at play time. |
| 8 | Watchability | Phase budgets, compression of quiet rounds, montage for runs of quiet rounds, a hard cap of 150 s per battle at 1x, and strike sampling. Attacker animations are sampled, but every kill, rout, and departure is shown. Speed 0.5x to 4x, pause, seek, step, skip to end. |
| 9 | Dev harness | `lab/battle.html` (served by Vite in dev only): named fixtures, random battles from seeds, pasted records, transport, inspectors, verification, perf, and a `window.__lab` API for Playwright. |
| 10 | Tests | Vitest: equivalence of the detail sink, record re-run, script, layout, timeline invariants (property tests over random battles), frame evaluation, sound plan determinism, DSP, content validation, purity. Playwright: screenshots of the lab at fixed `t`, recovery from context loss, an audio smoke test, a perf smoke test. |

---

## 1. Baseline: what exists and what was measured

**What exists.**
- `resolveBattle(setup, rng)` in `src/sim/battle/resolve.ts` is pure. `conflict.ts fight()` is its
  only caller (arrival battles in `conflict.ts`, storms in `siege.ts`). It passes `state.rng`
  directly, so the battle consumes the game's stream.
- Per blow, `attacks.ts` already builds a `Hit { by, from, weapon, target, amount }` for every
  attack in a phase, then `land()` applies them and folds them into `volley`/`melee` tallies.
  So the detail exists for one moment and is then thrown away. The DRN rolls are not kept,
  and `rollDamage` returns only the final number.
- `BattleRecord` holds `roster` plus `replay: BattleEvent[]`, and is kept only for player battles
  (`BATTLE.keep = 20`). `serialize.ts` does not exist yet (Phase 9), so no save is in the wild.
- The setup holds content objects by reference (`stats.weapons` from `unitDef`, `spells` from
  `BATTLE_SPELLS`). The resolver reads content constants too: `BATTLE`, `CASTING`,
  `FIELD_EFFECTS`, `UNARMED`, and `unitDef(unit)` for a summon's formation.

**Measured.** I copied `src/` to the scratchpad and instrumented the copy, leaving the repo
untouched. The instrumented copy captured every strike, with its rolls pulled into local
constants, which is exactly the refactor proposed in section 2.3. Its aggregated replays were
byte-identical to the uninstrumented runs in every scenario. Environment: Node 22, tsx, this
container. Full numbers are in Appendix A.

| Scenario | Rounds | Aggregated replay JSON | Strikes | Every strike as JSON | Packed, 10 B per strike | Setup JSON, spells by id | Resolve, ms |
|---|---|---|---|---|---|---|---|
| 20 v 20 | 5 | 1.3 KB | 112 | 2.2 KB | 1.1 KB | 1.2 KB | 0.7 |
| 60 v 60 + mage | 7 | 2.6 KB | 407 | 8.1 KB | 4.0 KB | 2.3 KB | 1.2 |
| 300 v 300 | 5 | 1.4 KB | 1,750 | 37 KB | 17 KB | 1.2 KB | 1.4 |
| 300 v 300 + 8 mages | 6 | 6.7 KB | 1,595 | 33 KB | 16 KB | 6.4 KB (15.9 with full spell defs) | 3.6 |
| 300 v 300 fearless grind | 44 | 8.1 KB | 9,175 | 200 KB | 90 KB | 0.8 KB | 32 |
| 300 v 300 immortal (prot 99, mor 50) | 50 | 7.8 KB | 28,800 | 653 KB | 281 KB | 0.7 KB | 32 (35 with detail) |

Capturing detail costs at most a few milliseconds. The worst case (600 troops for 50 rounds)
re-runs in about 35 ms, which is under the 50 ms budget in `docs/06`.

---

## 2. Strike-level detail

### 2.1 Options

**(a) Log every strike in the stored replay.** Simple, and the viewer would need no sim code.
For 20 records it costs about 0.7 MB in the typical case, and 13 MB of JSON (5.6 MB packed) in
the worst case. Saves are budgeted at "a few hundred KB" (`docs/06`) and are written every 30
game days. It also freezes the detail schema into the save format: every change to the detail
would need a migration. **Rejected.**

**(b) Store the setup plus the rng state and re-run with a detail sink.** It adds 0.7 to 6.5 KB
per record. The detail schema can change freely because it is never saved. The cost moves to
the viewer: a re-run of at most 35 ms on open. The risk is that content or code changes after
the battle make the re-run diverge. This is fully detectable: compare the re-run's aggregated
replay with the stored one.

**(c) Alternatives considered.**
- *(c1) A fully self-contained setup.* Snapshot `BATTLE`, `CASTING`, `FIELD_EFFECTS`, and
  `UNARMED`, plus full spell defs and summon formations, into the record, and thread them
  through the resolver instead of importing the constants. Re-runs would then survive balance
  patches and break only on code changes. Cost: about 2 KB plus up to 10 KB per record, and a
  refactor of how every resolver module reads its rules. **Deferred to M2.** M1 accepts that a
  balance patch sends older replays to the fallback.
- *(c2) A digest of the detail stream in the record.* Not needed. The aggregated replay stored
  next to it is already a strong check, and it is the log the side panels and counts follow.
- *(c3) Keep only the latest battle's detail in memory.* Not needed, since the re-run is cheap.
- *(c4) **Chosen: (b) plus verification plus a synthesized fallback from the aggregated log.***
  Storage is minimal. Detail is exact whenever it can be trusted, and nothing breaks when it
  cannot.

### 2.2 Decision

```
live game:   buildBattle → rng0 = cloneRng(state.rng) → resolveBattle(setup, state.rng)
             → applyBattle(..., { setup, rng: rng0 }) → BattleRecord.rerun (player battles only)

viewer:      record.rerun ? rerunBattle(rerun, detailSink) : null
             → matchesRecord(rerunResult, record) ? 'detailed' : 'aggregated'
```

The live game never passes a sink, so its cost and stream are unchanged. The sink only
**observes**: every rng draw happens on the same code path whether or not a sink is present.
There is no `if (sink)` branch that draws.

### 2.3 Sim changes (exact)

All changes are in pure code. Each is a refactor that keeps the rng stream: draws stay in the
same order, and they are only bound to local constants.

1. **`field.ts`**: `Fighter` gains `index: number`, its fixed slot in `group.members`, set in
   `group()`. Add `raging(f: Fighter): boolean` (the berserk condition `statOf` already uses).
   `statOf` calls it. `Field` gains `detail: DetailEvent[] | null`; `buildField` sets it to `null`.
2. **`attacks.ts`**:
   - `rollDamageParts(rng, base, prot, piercing, negating): DamageRoll` draws `attackDrn` and
     then `armorDrn`. That is the order of `base + drn(rng) - armor - drn(rng)` today.
     `rollDamage(...)` becomes `rollDamageParts(...).rolled`, and `weaponDamage` returns a
     `DamageRoll`.
   - `Hit` becomes `{ by, from, weapon, weaponIndex, target, attack, attackDrn, defense,
     defenseDrn, roll: DamageRoll | null, berserk, firstRound }`.
   - Ranged: `const attackDrn = drn(rng); const defenseDrn = drn(rng); const hit = prec +
     attackDrn >= BATTLE.ranged.toHit + defenseDrn;`. The target pick before it is unchanged.
   - Melee: the same with `statOf(m,'att')` and `statOf(target,'def')` and strict `>`. The
     weapon index is the position in `g.base.weapons`, or `-1` for `UNARMED`.
   - `land(hits, kind, log, detail, round)` emits one `strike` per hit, in landing order and
     before any commander `damage` event that hit causes. `burnStrikers` emits `burn`, and
     `drainLife` emits `drain`.
   - `rangedPhase`/`meleePhase` emit `engage` right after `engaged()` is computed.
3. **`effects.ts`**: `damage()` uses `rollDamageParts` and emits `spellHit` per troop, including
   troops already dead and zero-damage rolls (`landing.dealt = 0`). It needs `field.detail`,
   which `applyEffect` already has through `field`.
4. **`morale.ts`**: `breaks()` returns a `MoraleRoll`, with `moraleDrn` drawn before `targetDrn`
   as today. `commanderDeaths` and `moralePhase` emit `morale` with a cause.
5. **`resolve.ts`**: `resolveBattle(setup, rng, opts?: { detail?: DetailEvent[] })`.
   `field.detail = opts?.detail ?? null`. A phase marker is pushed before each round step:
   `scripts`, `ranged`, `melee`, `morale`, `end`. It is pushed in `resolve.ts`, not inside the
   phase functions, so a storm's early return from `rangedPhase` still gets its marker.

A code sketch of the `attacks.ts` change is in Appendix B.

### 2.4 Detail event schema

New file `src/sim/battle/detail.ts`, pure:

```ts
import type { Element } from '../../content/types';
import type { Formation } from '../types';
import type { BattleSide, BattleUnitRef } from './events';

/** Round steps in resolver order (docs/04-battle.md, "Round structure"). */
export type BattlePhase = 'scripts' | 'ranged' | 'melee' | 'morale' | 'end';

/** One damage roll: rolled = max(0, base + attackDrn - armor - armorDrn). */
export interface DamageRoll {
  /** Melee: str + weapon dmg + first-round bonus (+ berserk str). Ranged: weapon dmg. Spell: amount. */
  base: number;
  /** The target's protection before piercing or negating. */
  prot: number;
  /** Protection that counted: prot, floor(prot * armorPiercingFactor), or 0 when negating. */
  armor: number;
  attackDrn: number;
  armorDrn: number;
  rolled: number;
}

/**
 * How a rolled blow landed. Within a phase every blow is rolled against the field as the phase
 * began, so a later blow can fall on a troop an earlier blow already killed.
 */
export interface Landing {
  /** The target's HP just before this blow; 0 if it had already fallen this phase. */
  hpBefore: number;
  /** HP removed: min(rolled, hpBefore). */
  dealt: number;
  /** This blow took it to 0 HP. */
  killed: boolean;
}

export interface MoraleRoll {
  morale: number;
  moraleDrn: number;
  /** BATTLE.morale.base */
  target: number;
  targetDrn: number;
  /** Side pressure + commander-death pressure + shock. */
  pressure: number;
  broke: boolean;
}

interface DetailBase {
  /**
   * Aggregated events logged before this one: it sits between replay[at - 1] and replay[at].
   * Merging both streams by (at, emission order) gives the exact interleaving.
   */
  at: number;
  round: number;
}

export type DetailEvent =
  | (DetailBase & { kind: 'phase'; phase: BattlePhase })
  /** Who stood in contact when a ranged or melee phase began (fixed for the phase). */
  | (DetailBase & {
      kind: 'engage';
      phase: 'ranged' | 'melee';
      fronts: Record<BattleSide, Formation | null>;
      contact: BattleUnitRef[];
    })
  /** One attack roll by one troop with one weapon at one troop. Misses included. */
  | (DetailBase & {
      kind: 'strike';
      phase: 'ranged' | 'melee';
      attacker: BattleUnitRef;
      attackerMember: number;
      /** Index into the attacker's stats.weapons; -1 for an unarmed blow. */
      weapon: number;
      target: BattleUnitRef;
      targetMember: number;
      /** Melee: att vs def, hit when attack+attackDrn > defense+defenseDrn.
       *  Ranged: prec vs BATTLE.ranged.toHit, hit when >=. Modifiers included. */
      attack: number;
      attackDrn: number;
      defense: number;
      defenseDrn: number;
      hit: boolean;
      /** The berserk bonus was in this blow's att and str. */
      berserk: boolean;
      /** A first-round weapon bonus (lance) was in the damage base. */
      firstRound: boolean;
      damage: DamageRoll | null;
      landing: Landing | null;
    })
  /** One troop hit by a damage spell. */
  | (DetailBase & {
      kind: 'spellHit';
      caster: BattleUnitRef;
      spell: string;
      /** Index into the spell's effects. */
      effect: number;
      element: Element;
      target: BattleUnitRef;
      targetMember: number;
      damage: DamageRoll;
      landing: Landing;
    })
  /** Fire shield damage paid back to one melee striker once the phase's hits landed. */
  | (DetailBase & {
      kind: 'burn';
      unit: BattleUnitRef;
      member: number;
      owed: number;
      landing: Landing;
    })
  /** Life drain healed one striker. */
  | (DetailBase & { kind: 'drain'; unit: BattleUnitRef; member: number; gained: number })
  /** A morale check: held or broke. */
  | (DetailBase & {
      kind: 'morale';
      group: BattleUnitRef;
      cause: 'losses' | 'shock' | 'commanderDeath';
      roll: MoraleRoll;
    });
```

Principle: a detail event carries only what the setup, the aggregated log, and earlier detail
cannot supply. Caster fatigue, script choice, mana spent, and the groups a buff landed on can
all be folded from the setup plus the existing events, so they are not duplicated.

Order guarantees, all tested:
- `phase` markers come in the order `scripts, ranged, melee, morale, end` within a round.
- `strike`s in a phase come in roll order: attacker side first, setup order, member order,
  weapon order.
- A `strike` whose `landing.killed` is true belongs to the phase whose commander `death` (if
  any) follows the next `phase` marker.

### 2.5 The record, capture, save format

Types go in `src/sim/battle/record.ts` (types only, so `sim/types.ts` can import them without
a cycle). Functions go in `src/sim/battle/rerun.ts`. Both are pure:

```ts
// record.ts
import type { BattleCommanderSetup, BattleSetup, BattleSideSetup } from './types';
import type { RngState } from '../rng';

/** A commander's setup with its known spells by id, in the same order (order breaks ties). */
export interface CommanderSetupRecord extends Omit<BattleCommanderSetup, 'spells'> {
  spells: string[];
}
export interface SideSetupRecord extends Omit<BattleSideSetup, 'commanders'> {
  commanders: CommanderSetupRecord[];
}
export interface BattleSetupRecord {
  province: BattleSetup['province'];
  attacker: SideSetupRecord;
  defender: SideSetupRecord;
}
/** What the viewer needs to fight the battle again, blow by blow. */
export interface BattleRerun {
  setup: BattleSetupRecord;
  /** The rng state the battle began with. */
  rng: RngState;
}

// rerun.ts
import type { BattleResult, BattleSetup } from './types';
import type { BattleRecord } from '../types';
import type { DetailEvent } from './detail';
import type { BattleRerun, BattleSetupRecord } from './record';

/** Plain JSON copy (JSON round trip), spells replaced by ids: in-session equals post-load. */
export function toSetupRecord(setup: BattleSetup): BattleSetupRecord;
/** Resolves spell ids through the content registry (isSpellId/spellDef); throws on unknown ids. */
export function fromSetupRecord(record: BattleSetupRecord): BattleSetup;
/** Re-fights from a copy of the stored rng; never mutates the record. */
export function rerunBattle(rerun: BattleRerun, detail?: DetailEvent[]): BattleResult;
/** The re-run reproduced the stored battle: winner, rounds, and replay deep-equal. */
export function matchesRecord(result: BattleResult, record: BattleRecord): boolean;
```

`toSetupRecord` uses a JSON round trip on purpose. The record then holds exactly what a load
would produce, so a replay opened in the same session and one opened after save and load
re-run from identical input. That is its own test.

`BattleRecord` in `src/sim/types.ts` gains one field:

```ts
export interface BattleRecord {
  // ...existing fields (id, day, province, attacker, defender, winner, rounds, roster, replay)
  /** Setup and starting rng for a blow-by-blow re-run; null for records saved before version 2. */
  rerun: BattleRerun | null;
}
```

Capture, in `conflict.ts fight()`:

```ts
const setup = buildBattle(state, provinceId, attacker, defender, storm);
const rng0 = cloneRng(state.rng);          // 4 numbers; draws nothing
const result = resolveBattle(setup, state.rng);
applyBattle(state, provinceId, attacker, defender, result, { setup, rng: rng0 });
```

`applyBattle` stores `rerun: { setup: toSetupRecord(setup), rng }` only for battles it records
(player battles). AI-only battles pay for the 4-number clone and nothing else.

**`STATE_VERSION` 1 → 2.** Migration `1 → 2`: `for (const b of state.battles) b.rerun = null`.
`serialize.ts` (Phase 9) starts its migration map with it. If Phase 9 lands first, it includes
this migration. On load, validation of a record's `rerun` is **lenient**: if `rng` fails
`isRngState`, or `setup` is not an object with both sides' arrays, set it to `null`. Never
reject a save because of a replay. The viewer will fall back.

**Size budget.** About 1 to 6.5 KB per record (measured above). A test pins the worst fixture
(300 v 300 with 8 mages, 3 squads a side) under 16 KB of record JSON, so careless additions
are caught.

### 2.6 Why verification is enough

`matchesRecord` deep-compares the re-run's replay with the stored replay (at most a few hundred
events), plus winner and rounds. Any change that shifts the rng stream or a rule changes at
least one tally with near certainty. The aggregated log is also what the side panels' counts
follow, so a verified re-run can never contradict them. When nothing changed, the detail is
exactly the live battle's. The viewer's `prepare` (section 3.2) wraps the re-run in
`try/catch`: a content id that no longer exists becomes `'error'`.

### 2.7 Tests for this part

`tests/sim/battle/detail.test.ts`:
- **Equivalence.** For about 30 fixtures × 20 seeds (spells, summons, fire shield, life drain,
  berserk, lances, storm, wall, fog, Retreat slots, commander deaths, the round-50 retreat, PD
  refs), fight once without a sink and once with one, from equal `createRng(seed)`. The result
  is deep-equal (replay, winner, rounds, casualties, both outcome maps, roster), and the rng
  state afterwards is equal. These existing suites pass unchanged: `resolve.test.ts`,
  `spells.test.ts`, and the 300 v 300 timing test. Record assertions in `conflict.test.ts`,
  `siege.test.ts`, and the others use `toMatchObject`, so the new `rerun` field does not
  break them.
- **Consistency.** For each phase and each `(attacker, target)` pair, the `strike`s with
  `hit === true` add up to the tally's `hits`, and those with `landing.killed` add up to its
  `kills`. The `kills` in `spellHit` add up to the matching `damage` events' kills. Each
  member is killed at most once. No member strikes after a phase in which it died. For every
  group, `startHp − outcome.hp = Σ landing.dealt (strike, spellHit, burn) − Σ heal amounts`,
  where heals are its regeneration, healing spells, and drain. `engage.contact` contains every
  group that struck in melee.
- **Order.** The phase markers' order. `at` never decreases. Merging by `at` places each
  `strike` before its commander `damage` event.

`tests/sim/battle/rerun.test.ts`:
- `rerunBattle(record.rerun)` matches the record for records produced by `fight()` in game
  fixtures, both in the same session and after `JSON.parse(JSON.stringify(state))`.
- The record holds `rng` equal to `state.rng` just before the battle. AI-only battles store no
  record.
- `fromSetupRecord` throws on an unknown spell id. `matchesRecord` is false after tampering
  with one stat.
- Integration: a scripted 2-nation game with a human nation, 365 days, every stored record
  re-runs and matches.
- Size: the worst fixture's record JSON is under 16 KB.

---

## 3. The presentation pipeline (pure): `src/present/**`

### 3.1 Directory and purity guard

```
src/present/                    PURE: no DOM, Pixi, Web Audio, React, Math.random, Date
  battle/
    prepare.ts       record -> PreparedBattle (rerun + verify, or fallback)
    script.ts        PreparedBattle -> BattleScript (rounds, phases, normalized blows)
    synth.ts         aggregated-only records -> synthetic blows (fallback)
    layout.ts        world geometry, actors (files of troops), positions per phase
    pacing.ts        durations, montage, cinematics, budget -> PacedScript
    emit/            per-phase cue emitters
      scripts.ts ranged.ts melee.ts morale.ts end.ts common.ts
    sounds.ts        visual cues -> SoundCue[] and the ambience bed
    timeline.ts      buildTimeline(): orchestration, sort, keyframes, stats
    keyframes.ts     per-round persistent actor snapshots
    evaluate.ts      evaluateInto(frame, timeline, t, view): the scene at time t
    warp.ts          the cinematic slow-motion clock: localTime(t)
    clock.ts         playhead arithmetic (play, pause, seek, speed) over an injected time source
    camera.ts        cameraAt(t): shake, zoom, flash (deterministic)
    particles.ts     particleAt(burst, i, age, out): closed-form particles
    view.ts          ViewFilter: gore, reduced motion, flash limit, LOD by speed
    report.ts        text battle report (accessibility, lab, tests)
    check.ts         timeline invariants (used by tests and the lab's Verify)
    rand.ts          presentation rng streams: streamFor(battleId, purpose)
    fixtures/
      named.ts       named BattleSetups for the lab and tests
      random.ts      randomBattle(seed, opts): BattleSetup
  sound/
    plan.ts          planSounds(timeline, speed): SoundPlan (voice limits, caps)
    bed.ts           ambience intensity curve
    dsp/             oscillators, noise, biquads, envelopes, pluck, formants, render.ts
```

Why a new directory instead of `src/render/battle/timeline.ts`: `render` is impure by rule
(Pixi), and the purity guard (ESLint, the source-scan test, `tsconfig.sim.json`) works per
directory. Putting the presentation logic under a guarded directory makes "no `Math.random`,
no DOM" machine-checked. It also lets the Vitest suite cover most of the viewer in Node.

Guard changes:
- `eslint.config.js`: add `'src/present/**'` to `PURE_DIRS`. Extend the restricted patterns
  with `'**/audio'`, `'**/audio/**'`, `'**/lab'`, `'**/lab/**'`. The pure sound code is named
  `sound/`, so it does not collide with the `audio` pattern.
- Add a **second block** for `src/sim/**`, `src/mapgen/**`, `src/content/**`, and `src/ai/**`
  that also forbids `'**/present'` and `'**/present/**'`. ESLint flat config does not merge
  `no-restricted-imports` across blocks, so this block repeats the full paths and patterns list.
- `tests/sim/purity.test.ts`: add `src/present` to `PURE_DIRS`. Add `src/audio` and `src/lab`
  to `FORBIDDEN_DIRS`. Add a second check that the core pure dirs never resolve an import
  into `src/present`.
- `tsconfig.sim.json` `include`: add `"src/present"`.

Presentation numbers and look tables are data in `src/content/presentation/**` (section 9),
which keeps game logic and tunables apart, per `CLAUDE.md`.

### 3.2 `prepare.ts`

```ts
export type PreparedBattle =
  | { mode: 'detailed'; record: BattleRecord; setup: BattleSetup; detail: DetailEvent[] }
  | { mode: 'aggregated'; record: BattleRecord; reason: 'noRerun' | 'mismatch' | 'error' };

export function prepareBattle(record: BattleRecord): PreparedBattle;
```

The fallback shows a small "summary replay" label in the viewer. The lab shows the reason.

### 3.3 The battle script (intermediate representation)

The same structure is built from both modes, so everything downstream has one code path.

```ts
export interface ScriptGroup {
  ref: BattleUnitRef;
  side: BattleSide;
  unit: UnitTypeId;
  isCommander: boolean;
  leader: BattleUnitRef | null;
  startCount: number;
  startRow: Formation;
  /** Max HP per member and starting HP per member (setup HP pool split evenly). */
  maxHp: number;
  startHp: number;
  /** Round and phase it joined (summons); null for the starting roster. */
  joined: { round: number; phase: BattlePhase } | null;
  /** Weapon count and kinds from the setup (detailed) or unitDef (fallback). */
  weapons: readonly WeaponDef[];
}

export type BlowSource = 'ranged' | 'melee' | 'spell' | 'burn';

export interface Blow {
  seq: number;                     // emission order across the battle
  source: BlowSource;
  attacker: BattleUnitRef | null;  // null for burns (the shield bearer is not tracked)
  attackerMember: number;          // -1 when unknown
  weapon: number;                  // -1 unarmed or not a weapon
  target: BattleUnitRef;
  targetMember: number;
  hit: boolean;
  rolls: { attack: number; attackDrn: number; defense: number; defenseDrn: number } | null;
  damage: DamageRoll | null;       // null in fallback mode
  /** Null for misses. Fallback mode knows only whether the blow killed: dealt/hpBefore null. */
  landing: { killed: boolean; dealt: number | null; hpBefore: number | null } | null;
  element: Element;
  spell: string | null;
  berserk: boolean;
  firstRound: boolean;
  /** Made up from tallies (fallback mode). */
  synthetic: boolean;
}

export interface SpellBeat {
  caster: BattleUnitRef;
  spell: string;
  targets: BattleUnitRef[];
  blows: Blow[];
  /** Aggregated events the cast caused, in order (buff, summon, field, heal, fatigue, expire). */
  effects: BattleEvent[];
}

export interface MoraleBeat {
  group: BattleUnitRef;
  cause: 'losses' | 'shock' | 'commanderDeath';
  roll: MoraleRoll | null;          // null in fallback mode
  broke: boolean;
}

export interface ScriptPhase {
  kind: BattlePhase;
  events: BattleEvent[];            // every aggregated event in this phase, in log order
  fronts: Record<BattleSide, Formation | null> | null;
  contact: BattleUnitRef[] | null;
  /** Groups closing on the enemy for the first time this phase (charge). */
  firstContact: BattleUnitRef[];
  blows: Blow[];                    // ranged, melee, burn (not spells)
  spells: SpellBeat[];              // scripts phase only
  morale: MoraleBeat[];
  /** Commander deaths logged right after this phase, with the killing blow if known. */
  deaths: { commander: BattleUnitRef; by: Blow | null }[];
}

export interface ScriptRound {
  round: number;
  phases: ScriptPhase[];            // only phases with something to show
  /** No death, cast, rout, summon, advance, or leave, and kills <= max(1, 1% of troops present). */
  quiet: boolean;
  kills: number;
}

export interface BattleScript {
  mode: 'detailed' | 'aggregated';
  battle: string;                   // record id, seeds presentation rng streams
  groups: ScriptGroup[];
  rounds: ScriptRound[];
  winner: BattleSide;
  /** Living members per group at each round start (for keyframes and panel checks). */
  living: Record<BattleUnitRef, number>[];
}
```

**Detailed mode.** Merge the aggregated replay and the detail stream by `at`. Bucket by phase
markers. Normalize `strike`, `spellHit`, and `burn` into `Blow`s. Attach `morale` rolls. Find
each commander's killing blow (the blow with `landing.killed` on that ref). Track per-member
alive state so later stages can map kills to sprites.

**Fallback mode (`synth.ts`).** Phases are classified by event kind:
- `cast`, `buff`, `summon`, `field`, `fatigue`, `advance`, and a `rout` before any `volley` or
  `melee` → `scripts`.
- `volley` → `ranged`.
- `melee`, then `damage(element: 'fire')` → `melee` burn.
- `rout` after melee → `morale`.
- `leave`, `expire`, `heal`, `fieldEnd` at the end → `end`.

Blows: for `volley(s, t, hits, kills)`, one shot per living shooter member, of which `hits` hit.
For `melee`, one blow per living member and melee weapon (from `unitDef`). `kills` go to target
members picked by `streamFor(battle, 'synth')` among the living. Rolls and damage are `null`.
Spell `damage(target, amount, kills)` spreads `kills` over living troops of the target's row.
The output is a valid script whose tallies equal the log.

### 3.4 Layout

World space is **1600 × 900** units, letterboxed into the canvas. The **player's side is always
on the left**: `buildTimeline` takes `leftSide: BattleSide`, which the UI derives from which
nation is the player's.

```
y 0..170   sky / backdrop / banners        x: left rear 230 | left mid 440 | left front 650
y 190..840 ground band (rows of squads)         contact line 800 (block fronts at 800 ∓ 40)
y 860..900 ground edge / shadows               right front 950 | right mid 1160 | right rear 1370
```

- **Rank, not nominal row.** A group's x anchor is its rank:
  `ROWS.indexOf(row) - ROWS.indexOf(frontRow(side))`, clamped to 0..2. When a side's front
  empties, the middle steps up visibly ("melee squads advance when their target row is
  empty", `docs/04`). An `advance` event moves a commander to rank 0. Groups in contact stand
  at the contact line, with their block's front edge at `800 ∓ 40`.
- **Actors are files of troops.** A squad shows `actorCount = min(startCount, cap)` sprites.
  Member `m` belongs to actor `floor(m * actorCount / startCount)`, so each actor is a fixed
  file of 1 or more real troops. Caps by size: `{1: 64, 2: 40, 3: 16, 4: 10, 5: 6, 6: 4}`, and
  commanders 1. They are reduced so that a rank band (170 × 650) fits its groups:
  `cap = clamp(floor(bandSlots * share), 4, sizeCap)`. A 300 v 300 battle shows about 256
  sprites a side. This changes `docs/07`'s "up to 20 sprites"; the count badge stays.
- **Placement.** Within a rank band, groups stack along y in setup order, commanders after
  their row's squads. Each block is a grid at size spacing (size 1: 22 × 20; 2: 28 × 26;
  3: 44 × 40; 4: 56 × 52; 5: 72 × 64; 6: 96 × 84), with ±4 units of deterministic jitter
  from `streamFor(battle, 'layout')`. Flying actors sit 34 units higher, with a ground shadow.
  Sprite scale by size: `{1: 1, 2: 1.3, 3: 1.7, 4: 2.1, 5: 2.5, 6: 3.0}`.
- **Reflow.** Summons join their row. When a rank's population changes (summon, row
  advance), affected groups ease to their new blocks over 600 ms (`move`, gait `shift`).
- **Routing and leaving.** Routing actors turn and run toward their own edge at 140 u/s. At
  `leave` they accelerate off screen over 800 ms. The round-50 retreat uses gait `withdraw`
  (an orderly march) instead.
- Positions are quantized to 0.5 units and times to whole ms, which keeps pinned hashes stable.

### 3.5 Pacing

All numbers live in `src/content/presentation/pacing.ts` and are recorded in
`docs/09-art-direction.md`. Durations are at 1x.

| Beat | Duration (ms) | Notes |
|---|---|---|
| Opening (round 1) | 1,400 | camera settles, war horns, banners |
| Round banner (round ≥ 2) | 300 | |
| Cast | 400 windup + travel (bolt 300 / lob 550 / sky 450 / spray 250 / none 0) + 350 impact + 200 settle | casts are sequential, as in the sim |
| Advance / Retreat slot | 400 / 600 | run in parallel with the first cast |
| Ranged phase | 350 release spread + 450 to 750 flight + 250 linger ≈ 1,300 | skipped if no volley |
| First contact | +700 charge, before the melee window | gallop for `mounted`, thunder for size ≥ 4 |
| Melee window | 1,500 | 2 lunges per actor |
| Commander death | +1,100 | slow motion ×0.35 for 800 ms, 1.12× zoom on the victim, killer named |
| Big spell (≥ 5 kills or `cinematic` in its look) | +500 | slow motion ×0.6, shake 8, one flash |
| Big kill (victim size ≥ 4) | +600 | slow motion ×0.5, shake 10 |
| Crit kill (attackDrn ≥ 18, about 5% of rolls) | hit-stop 70 ms | at most 2 per phase |
| Morale | 250 + 450 if any rout (horn) + 150 per extra rout group (max 900) | |
| End of round | 200 + 600 if anyone leaves | |
| Battle end | 1,800 hold | victory or defeat banner, survivors cheer |

**Compression.**
1. After 2 consecutive quiet rounds, further quiet rounds run at ×0.6, with a floor of 900 ms.
2. **Montage:** a run of 4 or more quiet rounds becomes one segment of
   `min(4000, 1500 + 150 × rounds)` ms with a "Rounds 12–30: the lines grind on" banner. One
   compressed melee window samples blows from the whole run. Every death that happened in it
   is shown, and counts tick through. Seeking into the montage maps the round to its share.
3. **Budget:** if the total exceeds **150,000 ms**, scale all non-cinematic durations by
   `k = max(0.45, 150000 / total)`, with a floor of 700 ms per round. Typical battles come out
   at 15 to 45 s at 1x (4 to 11 s at 4x). The worst grind is held near 120 s at 1x.

Output: a `PacedScript` with `[t0, t1)` for every round, phase, and beat slot, plus a list of
warp segments `{ t0, t1, scale }` (section 3.8).

### 3.6 Cue emission and sampling

Each phase emitter turns the phase's beats and window into cues. Sampling rules:

**Melee.**
- **Representative lunges:** for each attacker actor, gather the blows of its file. Rank them
  by importance: kill 4, `dealt ≥ 50% maxHp` 3, hit 2, armor-stopped (hit, rolled 0) 1, miss 0.
  Ties go to `seq`. The top `lungesPerActor` (2) become lunges toward the target's actor.
- **Lunge times:** actors that die this phase lunge early: in `[t0, t0 + 0.45 W)`. The others
  lunge at `t0 + stagger(actor) + k × (W − 400) / 2`, with `stagger ∈ [0, 250)` from the rng
  stream. Contact frame is lunge `t + 150`.
- **Every damaging hit** produces a reaction on its target's actor: at the representative
  lunge's contact if it has one, otherwise at a hashed time in `[t0 + 100, t0 + 0.9 W]`.
  Reactions on one actor within 100 ms merge, keeping the strongest severity.
- **Every kill is shown.** If the victim's file still has living members, a `bodyFall` plays
  (a transient falling body at a jittered offset, then a corpse decal). If the file is empty,
  the actor itself plays `death`. The kill time is
  `max(killerContact, victim's last lunge + 150)`, clamped before `t0 + 0.92 W`.
  `killerContact` is the killing blow's lunge contact if that blow was a representative,
  otherwise its hashed reaction time.
  **Invariant:** an actor never lunges, shoots, or casts after its own death time.
- **Floaters:** per victim actor, damage within 200 ms buckets is summed into one number. A
  kill adds a skull glyph, a crit gets the crit style, and armor that stopped the blow shows a
  "blocked" glyph (LOD 2). Commander floaters are never merged.
- **Rage:** the first `berserk` blow of an actor turns on its persistent rage tint.
- **Lances:** a `firstRound` blow turns the lunge into a charge strike: longer reach, a dust
  burst, and a heavier impact sound.

**Ranged.**
- Each shooter actor recoils once per volley.
- One projectile per strike, at most 500 in flight. Beyond that, all hits and kills are kept
  and misses are sampled evenly (`stats.sampledProjectiles` records how many were dropped).
- `release = t0 + hash(actor) mod 350`. `flight = 450 + 140 × rankGap + jitter(0..80)`. The
  arc height is 0.22 × distance.
- Outcomes:
  - **miss:** the projectile lands on the ground near the target, leaving a stuck-arrow decal
    (LOD 2).
  - **deflect** (hit, 0 damage): sparks and a bounce.
  - **hit:** the projectile sticks, and the target reacts.
  - **kill:** a body falls or the actor dies.

**Spells.**
- `cast`: staff raise plus a ring in the color.
- Then a `spellBolt` from the caster to the centroid of the target troops. The shape comes
  from `SPELL_LOOKS`: Pyre Storm falls from the sky, Thorn Spray is a spray.
- One impact burst per `spellHit` troop, spread over 0 to 500 ms, then deaths.
- Buffs and debuffs: `aura` on the groups until `expire`. Heals: green motes and `+N` floaters.
- Summon: `spawn` actors with an element-specific materialize. Field: a persistent overlay
  (storm rain with rate-limited lightning, fog banks, a wall of thorns or fire by caster color)
  until `fieldEnd`.
- Fatigue drain: dark wisps from the caster.

**Morale.**
- A check that held: the banner wavers and a small "holds!" appears (LOD 1).
- A rout: horn and banner drop. Actors flip, staggered 0 to 300 ms, and start running.

**Deaths.** A commander's death gets the cinematic in section 3.5. The banner reads "Ash
Chieftain falls to a Warden" when the killing blow is known.

### 3.7 Timeline types

`src/present/battle/cues.ts`. `Element`, `Color`, `StatKey`, `FieldEffectKind`, `UnitTypeId`,
`BattleSide`, and `BattleUnitRef` come from content and sim. `Material`, `ParticlePresetId`,
`SoundId`, and `SoundCategory` come from `src/content/presentation` (section 9).

```ts
export type Ms = number;
export type ActorId = number;
export interface Vec { x: number; y: number }
export type Lod = 0 | 1 | 2;           // 0 essential, 1 standard, 2 fine detail
export type Ease = 'linear' | 'inQuad' | 'outQuad' | 'inOutQuad' | 'outBack' | 'outExpo';
export type Gait = 'shift' | 'march' | 'charge' | 'run' | 'withdraw';
export type ProjectileKind = 'arrow' | 'fireArrow' | 'javelin' | 'firebolt' | 'thorn' | 'breath';
export type DeathStyle = 'fall' | 'collapse' | 'burnOut' | 'crumble' | 'dissipate' | 'topple';
export type DecalKind =
  | 'corpse' | 'bloodSplat' | 'bloodPool' | 'sapSplat' | 'scorch' | 'ash'
  | 'arrowStuck' | 'javelinStuck' | 'leafLitter' | 'crater' | 'scuff';
export type FloaterStyle =
  'damage' | 'crit' | 'heal' | 'blocked' | 'buff' | 'debuff' | 'morale';
export type Glyph = 'skull' | 'shield' | Element | 'up' | 'down' | 'flag';
export type BannerTone = 'neutral' | 'good' | 'bad' | 'epic';

export interface ActorDef {
  id: ActorId;
  side: BattleSide;
  screen: 'left' | 'right';
  group: BattleUnitRef;
  unit: UnitTypeId;
  isCommander: boolean;
  /** Members this actor stands for: [first, last], inclusive. */
  members: readonly [number, number];
  scale: number;
  /** Nation banner color as 0xRRGGBB (independents: their palette). */
  tint: number;
  flying: boolean;
  home: Vec;
  spawn: Ms;                     // 0 for the starting roster
}

interface Cue { t: Ms; dur: Ms; lod: Lod; seq: number }

/** Persistent cues change actor or field state from t on; keyframes fold them. */
export type PersistentCue =
  | (Cue & { kind: 'move'; actor: ActorId; to: Vec; ease: Ease; gait: Gait })
  | (Cue & { kind: 'face'; actor: ActorId; facing: 1 | -1 })
  | (Cue & { kind: 'death'; actor: ActorId; dir: 1 | -1; style: DeathStyle })
  | (Cue & { kind: 'rout'; actor: ActorId; to: Vec })
  | (Cue & { kind: 'leave'; actor: ActorId; to: Vec })
  | (Cue & { kind: 'spawn'; actor: ActorId; style: 'ember' | 'swarm' | 'rise' | 'step' })
  | (Cue & { kind: 'rage'; actor: ActorId })
  | (Cue & { kind: 'aura'; group: BattleUnitRef; source: string; tone: 'buff' | 'debuff'; stat: StatKey })
  | (Cue & { kind: 'auraEnd'; group: BattleUnitRef; source: string })
  | (Cue & { kind: 'field'; effect: FieldEffectKind; color: Color | null })
  | (Cue & { kind: 'fieldEnd'; effect: FieldEffectKind })
  | (Cue & { kind: 'count'; group: BattleUnitRef; living: number; routing: boolean; gone: boolean });

/** Transient cues are active on [t, t + dur) only; dur <= MAX_TRANSIENT (3000). */
export type TransientCue =
  | (Cue & { kind: 'lunge'; actor: ActorId; toward: Vec; power: number; charge: boolean })
  | (Cue & { kind: 'shoot'; actor: ActorId; projectile: ProjectileKind; from: Vec; to: Vec;
      release: Ms; flight: Ms; arc: number; outcome: 'miss' | 'deflect' | 'hit' | 'kill' })
  | (Cue & { kind: 'react'; actor: ActorId; from: Vec; severity: number; blocked: boolean;
      material: Material; element: Element })
  | (Cue & { kind: 'bodyFall'; actor: ActorId; at: Vec; dir: 1 | -1; style: DeathStyle })
  | (Cue & { kind: 'cast'; actor: ActorId; color: Color | 'holy'; spell: string })
  | (Cue & { kind: 'spellBolt'; spell: string; from: Vec; to: Vec;
      shape: 'bolt' | 'lob' | 'sky' | 'spray' })
  | (Cue & { kind: 'burst'; at: Vec; preset: ParticlePresetId; count: number; seed: number;
      dir: number; radius: number; gore: boolean })
  | (Cue & { kind: 'floater'; at: Vec; text: string; style: FloaterStyle; glyph: Glyph | null })
  | (Cue & { kind: 'camera'; effect: 'shake' | 'zoom' | 'flash'; amount: number;
      focus: Vec | null; color: number | null })
  | (Cue & { kind: 'banner'; text: string; tone: BannerTone });

export interface Decal {
  t: Ms; at: Vec; kind: DecalKind; rot: number; scale: number; seed: number;
  /** Shown only at this gore level or above. */
  gore: 'none' | 'mild' | 'full';
  unit: UnitTypeId | null;       // corpses: whose body
  tint: number;
}

export interface SoundCue {
  t: Ms; seq: number; sound: SoundId; category: SoundCategory;
  /** 0 never culled (stings, commander death, first contact, battle end) ... 4 most cullable. */
  priority: 0 | 1 | 2 | 3 | 4;
  lod: Lod; gain: number; pan: number; variant: number; rate: number;
}

export interface PhaseMark { kind: BattlePhase; t: Ms; end: Ms }
export interface RoundMark { round: number; t: Ms; end: Ms; phases: PhaseMark[];
  montage: { first: number; last: number } | null }
export interface Highlight { t: Ms; kind: 'commanderDeath' | 'bigSpell' | 'rout' | 'firstContact'
  | 'bigKill' | 'summon' | 'end'; label: string }

export interface Timeline {
  version: 1;
  battle: string;
  mode: 'detailed' | 'aggregated';
  duration: Ms;
  world: { width: 1600; height: 900; contactX: 800 };
  actors: ActorDef[];
  rounds: RoundMark[];
  highlights: Highlight[];
  persistent: PersistentCue[];   // sorted by (t, seq)
  transient: TransientCue[];     // sorted by (t, seq)
  decals: Decal[];               // sorted by t
  sounds: SoundCue[];            // sorted by (t, seq)
  warps: { t0: Ms; t1: Ms; scale: number }[];
  bed: { t: Ms; clash: number; march: number }[];   // every 250 ms
  keyframes: Keyframe[];         // one per round start (and per montage start)
  stats: TimelineStats;          // strikes, shown lunges, sampled projectiles, cue counts
}

export function buildTimeline(
  prepared: PreparedBattle,
  opts: { leftSide: BattleSide; tints: Record<BattleSide, number> },
): Timeline;
```

Determinism: `buildTimeline` reads only its inputs and `src/content/presentation`. All variation
comes from `streamFor(battleId, purpose)`, which is `createRng(hashString(battleId + ':' +
purpose))` using the sim's xoshiro, with one stream per purpose (`layout`, `stagger`, `synth`,
`variant`, `particles`). Changing one stage never reshuffles another.

### 3.8 Keyframes, `evaluateInto`, warp, camera, particles

```ts
export interface ActorState {
  x: number; y: number; facing: 1 | -1;
  move: { from: Vec; to: Vec; t0: Ms; dur: Ms; ease: Ease } | null;
  status: 'alive' | 'dying' | 'dead' | 'routing' | 'gone' | 'unspawned';
  rage: boolean; living: number;
}
export interface Keyframe { t: Ms; actors: ActorState[]; auras: AuraState[]; fields: FieldEffectKind[] }

export interface ActorFrame {
  visible: boolean; x: number; y: number; facing: 1 | -1; scale: number; alpha: number;
  pose: 'idle' | 'walk' | 'run' | 'lunge' | 'shoot' | 'cast' | 'react' | 'fall' | 'cheer';
  poseT: number; weaponAngle: number; flash: number; rage: boolean; bob: number;
}
export interface FrameModel {
  t: Ms; local: Ms;
  actors: ActorFrame[];                       // preallocated, indexed by ActorId
  projectiles: ProjectileFrame[]; projectileCount: number;
  bursts: BurstRef[]; burstCount: number;     // the renderer evaluates particles
  floaters: FloaterFrame[]; floaterCount: number;
  bodies: BodyFrame[]; bodyCount: number;     // transient falling bodies
  auras: AuraFrame[]; auraCount: number;
  fields: FieldFrame[];
  camera: { x: number; y: number; zoom: number; flash: number; flashColor: number };
  banner: { text: string; tone: BannerTone; alpha: number } | null;
  decalsUpTo: number;                         // timeline.decals[0 .. n) are on the ground
  panel: PanelState;                          // living counts, routing, auras per group
}
export function createFrame(timeline: Timeline): FrameModel;
export function evaluateInto(frame: FrameModel, timeline: Timeline, t: Ms, view: ViewFilter): void;
```

- **Persistent state:** take the keyframe for `t`'s round, then fold persistent cues in
  `(keyframe.t, t]`. That is at most a few hundred per round, and incremental while playing
  forward.
- **Transients:** cues in `[t − 3000, t]` with `t < cue.t + cue.dur`, found with a moving cursor
  (binary search on seek).
- **Warp:** cinematic segments already occupy more timeline time, and their transients are
  laid out stretched. `localTime(t)` integrates the warp scales and drives *continuous*
  motion: particle age, idle bob, and the bed. Particles slow down during slow motion, and the
  result stays a pure function of `t`.
- **Camera:** `cameraAt(t)` is the sum of active shakes (amplitude × decay ×
  `sin(2π·17·local) + sin(2π·23·local + seed)`), a zoom envelope toward the focus, and flash
  alpha. It is deterministic for any `t`.
- **Particles in closed form:** `particleAt(burst, i, age, out)` hashes `(seed, i)` into angle,
  speed, life, size, and color index. Position is
  `p0 + v/k · (1 − e^(−k·age)) + ½·g·age²`, clamped at the ground line for ballistic presets.
  Motion presets: `ballistic` (blood, chips), `rise` (Ember, flickering alpha), `spread`
  (Loam, along the ground), `ripple` (Tide rings), `radiate` (Radiance, straight streaks),
  `sink` (Umbra). There is no particle state, so a seek or a screenshot at `t` is exact.

### 3.9 View filters (`view.ts`)

```ts
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
export interface ViewOptions {
  gore: 'none' | 'mild' | 'full';
  reducedMotion: boolean;
  showNumbers: boolean;
  quality: 'high' | 'medium' | 'low';
}
export interface ViewFilter { options: ViewOptions; speed: PlaybackSpeed;
  maxLod: Lod; particleScale: number; allowedFlashes: ReadonlySet<number> }
export function makeViewFilter(timeline: Timeline, options: ViewOptions, speed: PlaybackSpeed): ViewFilter;
```

- **LOD by speed:** 0.5x and 1x show LOD ≤ 2. 2x and 4x show LOD ≤ 1. Deaths, routs, casts, and
  impacts are never above LOD 1.
- **Gore:**
  - `none`: no blood bursts or decals, and the dead fall and fade to 0 over 1.5 s instead of
    leaving corpses.
  - `mild`: corpses (`docs/09`'s fade to 30% becomes a corpse decal at 60% darkness), small puffs.
  - `full`: sprays, splats, pools, and arrows left standing in bodies.
- **Reduced motion:** no shake, no zoom, flashes at 12% alpha at most, particle count ×0.5, no
  hit-stop. The default follows `prefers-reduced-motion`.
- **Photosensitivity, always on:** at most **3 flashes per second of real time** at the current
  speed (WCAG 2.3.1), and flash alpha ≤ 0.35. `allowedFlashes` is computed per speed by a
  greedy pass over flash cues in time order.

### 3.10 Report (`report.ts`)

`buildReport(script): ReportRound[]` gives text lines per round, for example: "Flame Archers
loosed 60 arrows at the Wardens: 21 struck, 5 turned by armor, 6 killed." It is screen-reader
friendly, shown as the modal's Report tab, and used as the no-WebGL fallback. Its text is
snapshot-tested.

### 3.11 Performance targets (pure side, enforced by tests in Node)

| Step | Typical (300 v 300, 5 rounds) | Worst (immortal, 50 rounds) |
|---|---|---|
| `prepareBattle` (re-run with sink + verify) | ≤ 5 ms | ≤ 45 ms |
| `buildTimeline` | ≤ 15 ms | ≤ 100 ms |
| `evaluateInto` per frame | ≤ 1 ms | ≤ 2 ms |
| `planSounds` per speed | ≤ 2 ms | ≤ 10 ms |

Opening the modal shows its frame first (one `requestAnimationFrame`), then prepares on the
main thread. Everything is plain structured-cloneable data, so moving `prepare` and `build` to
a Worker is a contained change if the lab's p95 on target hardware exceeds 150 ms.

---

## 4. Renderer (PixiJS 8.22): `src/render/BattleRenderer.ts` and `src/render/battle/**`

### 4.1 API and lifecycle

```ts
export interface BattleRendererInit {
  parent: HTMLElement;
  timeline: Timeline;
  view: ViewFilter;
  /** Called when the GL context is lost or restored, so the controller can pause and resume. */
  onContext?(state: 'lost' | 'restored' | 'failed'): void;
}
export class BattleRenderer {
  static create(init: BattleRendererInit): Promise<BattleRenderer>;  // Application.init + textures
  /** Evaluate at t and draw. The only per-frame entry point; holds no animation state. */
  render(t: Ms): void;
  setView(view: ViewFilter): void;
  highlight(group: BattleUnitRef | null): void;   // side panel hover
  resize(width: number, height: number): void;
  stats(): RenderStats;   // frame CPU ms (p50/p95), sprites, particles, decals, draw calls
  destroy(): void;        // app.destroy(true, { children: true, texture: true })
}
```

- `Application.init({ preference: 'webgl', antialias: true, resolution: min(devicePixelRatio,
  2), autoDensity: true, backgroundAlpha: 1 })`, with the ticker stopped. The controller
  (section 6) drives `render(t)` from its own rAF loop.
- The replay uses its own Application. While the modal is open, the map renderer's ticker
  is stopped.

### 4.2 Scene graph

```
stage
  world (Container: fit-to-canvas transform × camera zoom/pan/shake)
    backdrop      Sprite: sky gradient + province terrain ground (generated, per terrain fill)
    decals        Sprite of a RenderTexture (world-size, baked stamps: corpses, blood, scorch, arrows)
    fieldUnder    fog banks, wall base
    shadows       ParticleContainer (ellipse per actor/body/projectile)
    units         Container, sortableChildren (zIndex = y): per actor { body, weapon, flash }
    bodies        pooled transient falling bodies
    projectiles   ParticleContainer (arrows, javelins, firebolts, thorns)
    fxAdd         ParticleContainer, blend 'add' (embers, sparks, holy motes, spell bursts)
    fxNormal      ParticleContainer, blend 'normal' (blood, sap, dust, leaves, smoke)
    auras         pooled ring sprites under groups
    fieldOver     rain streaks, fog top layer, lightning
    floaters      pooled BitmapText (procedural glyph font)
  overlay (screen space)
    flash         full-screen Sprite (white texture, tint, alpha)
    vignette      Sprite (generated radial texture)
    banner        Container: round, highlight, and victory banners
```

An actor is 3 sprites on one atlas: body (pose texture), weapon (rotates on lunge), and flash
(white silhouette, alpha = `frame.flash`). The shadow lives in `shadows`. About 600 actors come
to about 2,400 sprites at most.

### 4.3 Immediate-mode sync and pools

Each frame, `render(t)`:
1. `evaluateInto(frame, timeline, t, view)`.
2. Actors: for `i < actors.length`, set each sprite's `visible/x/y/scale/alpha/texture/rotation`
   from `frame.actors[i]`. The sprites persist; this is one assignment pass.
3. Transients (projectiles, bodies, floaters, auras): `pool.beginFrame()`, then `acquire()` per
   active item, then `pool.endFrame()` hides the rest. There is no per-cue display state, so
   seeking backwards is never wrong.
4. Particles: for each `BurstRef`, compute `particleAt` for `count × particleScale` particles
   into pooled `Particle`s (`dynamicProperties: { position, rotation, color, vertex }`).
   Particles outside the view are skipped. Caps by quality: 6,000 / 3,000 / 1,200.
5. Decals: if `frame.decalsUpTo > baked`, stamp the new ones into the decal RenderTexture
   (`renderer.render({ container: stampLayer, target: decalRT, clear: false })`). If it is
   below `baked` (a seek backwards), clear and re-stamp from 0. That costs about 5 to 10 ms
   for 4,000 stamps, only on backward seeks.
6. Camera, overlay, banner; then `app.renderer.render(stage)`.

Pool sizes, preallocated and growing ×1.5 when exhausted (growth logged in stats): projectiles
512, bodies 128, floaters 160, auras 48, particles 6,000, decal stamps 64.

### 4.4 Textures (`src/render/sprites.ts`, the `docs/06` slot)

```ts
export interface ActorTextures { body: Record<Pose, Texture>; weapon: Texture; flash: Texture; corpse: Texture }
export interface TextureFactory {
  actor(unit: UnitTypeId, tint: number): ActorTextures;
  projectile(kind: ProjectileKind): Texture;
  particle(shape: ParticleShape): Texture;
  decal(kind: DecalKind, variant: number): Texture;
  glyphs(): GlyphFont;
  /** Rebuild every generated texture (after context restore). */
  rebuild(): Promise<void>;
  destroy(): void;
}
```

- Everything is generated at open time into **one or two 2048² atlas RenderTextures**, with a
  shelf packer. That gives about 6 to 10 draw calls for the whole scene.
- Before Phase 11, placeholders are generated as Graphics silhouettes per archetype
  (`UNIT_LOOKS[unit].archetype`) with a nation tint band.
- Phase 11 replaces the generator's input with the SVG part sprites of `docs/09` (body, armor,
  weapon, and a tint zone filled with `currentColor` and rasterized per banner). The
  `TextureFactory` API stays the same. Missing art falls back to the archetype, per `docs/09`.
- **Procedural glyph font:** digits, `+`, `−`, and the glyph set (skull, shield, flame, leaf,
  snowflake, sun, drop, up and down chevrons, flag) are drawn as stroked paths into a
  `BitmapFont`. It uses no font files and gives identical pixels on every machine, which
  matters for screenshot tests.

### 4.5 Frame budget at 1080p and adaptive quality

Target 60 fps (16.7 ms) at 1920 × 1080, resolution 1, on a mid laptop with an integrated GPU.

| Part | Budget |
|---|---|
| `evaluateInto` | ≤ 2 ms |
| actor and transient sync | ≤ 2 ms |
| particle evaluation (≤ 6,000) | ≤ 2.5 ms |
| Pixi CPU (batch build, ≤ 10 draw calls) | ≤ 3 ms |
| GPU (fill: backdrop, decal RT, ≤ 6,000 small quads, additive fx) | ≤ 6 ms |
| slack | ≈ 1 ms |

`quality.ts`: `auto` starts at `high`. If the p90 frame time stays above 18 ms for 2 s, step down:
- `medium`: particles ×0.5, floaters LOD 1.
- `low`: particles ×0.2, no fxAdd, decals limited to corpses.

Quality never changes the timeline (actors and cues), so timing, tests, and screenshots are
unaffected. Culling: actors and particles get a bounds check against the camera rect. At zoom
1.12, some leave the view. `cullable = true` on large containers.

### 4.6 WebGL context loss and no-WebGL fallback

Pixi 8.22's `GlContextSystem` calls `preventDefault` on `webglcontextlost` and emits
`runners.contextChange` on restore. Textures with image sources re-upload. **RenderTexture
contents do not survive.** Handling:
1. On `webglcontextlost` (canvas listener): pause the clock (remembering whether it was
   playing), and call `onContext('lost')`, which makes the modal show "Graphics reset…".
2. On restore: `textures.rebuild()`, reset the decal layer (`baked = 0`), then `render(t)`.
   Because the scene is a function of `t`, the restored frame equals the frame before the loss.
   Resume if it was playing.
3. If the context is not restored within 3 s: `onContext('failed')`, and the modal offers
   "Reopen" (destroys and recreates the renderer at the same `t`) or the Report tab.
4. If WebGL is unavailable at init, open the Report tab directly with a note. Pixi 8.22 can
   prefer `['webgl', 'canvas']`, but `ParticleContainer` support under the canvas renderer is
   unverified. The lab checks this first; until then, canvas is not offered.

---

## 5. Audio

### 5.1 Boundary

```
Timeline.sounds (pure, speed-independent)
   └─ planSounds(timeline, speed)  (pure, src/present/sound/plan.ts)  → SoundPlan
        └─ AudioEngine.play(plan, from, speed)  (impure, src/audio/AudioEngine.ts) → Web Audio
recipes (data, src/content/presentation/sounds.ts)
   └─ renderRecipe(recipe, variant, sampleRate)  (pure DSP, src/present/sound/dsp) → Float32Array
        └─ bake.worker.ts → AudioBuffer (impure)
```

Every sound comes from a visual cue (derived in `present/battle/sounds.ts`), so nothing exists
only as sound. Deaf and muted players miss nothing.

### 5.2 Vocabulary and mapping

| Visual cue | SoundId(s) | Category | Priority | LOD |
|---|---|---|---|---|
| opening | `warHorn`, `drumRoll` | horn, drum | 0 | 0 |
| round banner | `drumHit` | drum | 2 | 1 |
| first contact | `lineClash` (crash + roar) | impact | 0 | 0 |
| cast (by color) | `chantEmber`, `chantLoam`, `chantHoly` | magic | 1 | 0 |
| spellBolt / impact | `fireWhoosh`, `fireBlast`, `thornBurst`, `swarmBuzz`, `healChime`, `buffRise`, `debuffSink` | magic | 0 to 1 | 0 |
| shoot (one per shooter actor, capped) | `bowTwang` (Karplus–Strong), `javelinThrow`, `breathRoar` | missile | 3 | 1 |
| projectile landing | `arrowFlesh`, `arrowArmor`, `arrowGround` | missile | 3 to 4 | 1 to 2 |
| lunge | `swingLight`, `swingHeavy` by motion | swing | 4 | 2 |
| react | `hitFlesh`, `hitMetal` (blocked), `hitWood`, `hitStone`, `hitChitin` by material | impact | 3 | 1 |
| crit kill | `boneCrunch` | impact | 1 | 0 |
| death / bodyFall | `cryMan`, `cryBeast`, `cryGiant`, `crumble`, `fizzle` by voice; `bodyThud` | voice, body | 2 (commanders 0) | 1 |
| rout | `routHorn` + `panicMurmur` | horn | 1 | 0 |
| commander death | `fallSting` | sting | 0 | 0 |
| summon / field | `materializeEmber`, `swarmBuzz`, `rainLoop`, `thunder`, `fogWind`, `wallRise` | magic | 1 | 0 |
| battle end | `victorySting` / `defeatSting` (player's view) | sting | 0 | 0 |
| bed | `bedClash`, `bedMarch` loops; gain from `timeline.bed` | ambience | n/a | n/a |

The mapping from weapon motion to sound and from target material to impact sound is data
(`UNIT_LOOKS`, section 9). `variant = hash(seq, sound) mod variants`.
`rate = 1 + ((hash >>> 8) mod 7 − 3) × 0.01` gives ±3% detune.
`pan = clamp((x − 800) / 800, −1, 1) × 0.8`.

### 5.3 `planSounds` (pure, deterministic)

```ts
export interface PlannedSound {
  /** Real seconds from timeline 0 at this speed: t / 1000 / speed. */
  at: number; t: Ms; sound: SoundId; variant: number; gain: number; pan: number; rate: number;
  /** Real seconds the voice sounds (recipe length / rate). */
  seconds: number; priority: SoundCue['priority'];
  /** Index of an earlier play whose voice this one steals (stopped at `at`), or null. */
  steals: number | null;
}
export interface SoundPlan { speed: PlaybackSpeed; plays: PlannedSound[]; dropped: number;
  bed: { at: number; clash: number; march: number }[] }
export function planSounds(timeline: Timeline, speed: PlaybackSpeed): SoundPlan;
/** Index of the first play at or after timeline time t (seek). */
export function playsFrom(plan: SoundPlan, t: Ms): number;
```

Rules, applied in order:
1. Drop cues with LOD > `maxLod(speed)`, with the same table as the visuals.
2. Split real time into **100 ms windows aligned to real time 0** (not to the playhead, so the
   result does not depend on when scheduling starts). Per window, caps per category: impact
   6, swing 4, missile 5, voice 3, body 3, magic 4, drum 1, horn 1, and 12 in total. Choose by
   priority, then gain (descending), then seq. Priority-0 cues bypass the caps.
3. Survivors in a window of the same category get gain × `1/√n`, so density does not add up to
   loudness.
4. Polyphony: simulate voices over `[at, at + seconds)`. When more than 32 are active, drop the
   newest lowest-priority play. A priority-0 play instead steals the oldest lowest-priority
   voice; the plan records the steal and the engine stops that voice.
5. Bed: resample `timeline.bed` to real time and smooth it (EMA 500 ms real time).

Plans are cached per speed. A seek only changes the starting index.

### 5.4 Procedural synthesis

Recipes are data (`src/content/presentation/sounds.ts`):

```ts
export type Wave = 'sine' | 'triangle' | 'square' | 'saw';
export interface Env { attack: number; hold?: number; decay: number; sustain?: number;
  release?: number; curve?: 'lin' | 'exp' }
export type Sweep = number | { from: number; to: number; curve: 'lin' | 'exp' };
export interface Filter { type: 'lowpass' | 'highpass' | 'bandpass' | 'peaking';
  freq: Sweep; q: number; gainDb?: number }
export type Layer =
  | { kind: 'noise'; color: 'white' | 'pink' | 'brown'; env: Env; filters?: Filter[]; gain: number }
  | { kind: 'osc'; wave: Wave; freq: Sweep; env: Env; filters?: Filter[]; gain: number; detuneCents?: number }
  | { kind: 'partials'; base: Sweep; ratios: readonly number[]; decays: readonly number[]; env: Env; gain: number }
  | { kind: 'pluck'; freq: number; damping: number; brightness: number; gain: number }
  | { kind: 'formant'; source: 'saw' | 'noise'; f0: Sweep; formants: readonly [number, number, number];
      q: number; env: Env; gain: number }
  | { kind: 'clicks'; rate: number; jitter: number; env: Env; filters?: Filter[]; gain: number };
export interface SoundRecipe {
  category: SoundCategory; seconds: number; variants: number;
  /** Variation per variant: pitch spread in cents, filter spread as a ratio. */
  spread: { cents: number; filter: number };
  loop?: boolean; peak: number; layers: readonly Layer[];
}
export const SOUNDS: Record<SoundId, SoundRecipe>;
```

Examples:
- `hitMetal`: inharmonic `partials` (base 620 Hz, ratios 1, 2.76, 5.4, 8.93, decays 0.18 to
  0.04 s) plus a 4 ms highpassed noise click.
- `hitFlesh`: a 90 to 60 Hz sine thump (40 ms) plus pink noise lowpassed at 900 Hz with an exp
  decay of 80 ms.
- `cryMan`: a `formant` saw, f0 from 210 to 140 Hz, formants (700, 1200, 2600), 260 ms.
- `bowTwang`: a `pluck` at 180 Hz with damping 0.996, plus a 20 ms noise thwip.
- `routHorn`: a saw at 220 → 196 Hz, lowpass sweeping 400 → 2,200 → 800 Hz, 900 ms.
- `bedClash`: a 4 s loop of `clicks` (rate 40/s, bandpassed 1.5 to 4 kHz) over brown noise.

DSP (`src/present/sound/dsp/*.ts`) is pure TypeScript writing `Float32Array`:
- phase-accumulator oscillators;
- white noise from `createRng(hashString(id + variant))`, pink by the Voss–McCartney method,
  brown by leaky integration;
- RBJ biquads with per-sample coefficients for sweeps, updated every 32 samples;
- envelopes, Karplus–Strong, a formant bank of 3 parallel bandpasses, and a soft clip.

Afterwards it removes DC, normalizes to `peak` (≤ 0.89, −1 dBFS), and applies a 5 ms fade-out.
The output is bit-identical for the same recipe, variant, and sample rate.

Baking: `src/audio/bake.worker.ts` receives `{ ids, sampleRate }` (the context's rate) and
returns transferable buffers. The engine bakes **the sound ids the plan uses first**, then the
rest when idle. Budget: about 40 recipes × 4 to 8 variants × ~0.35 s at 48 kHz ≈ 12 MB decoded,
total ≤ 16 MB, typical battle ≈ 4 MB, bake ≤ 300 ms in the worker. Sounds not ready when due
are skipped silently. The bundle carries no audio files.

### 5.5 `AudioEngine` (Web Audio, impure)

```ts
export interface AudioVolumes { master: number; sfx: number; ambience: number }
export interface AudioEngine {
  /** Create or resume the AudioContext. Call inside the click that opens the replay. */
  unlock(): Promise<void>;
  prepare(ids: readonly SoundId[]): Promise<void>;     // bake in the worker, idempotent
  setVolumes(v: AudioVolumes): void;
  setMuted(muted: boolean): void;
  /** Anchor timeline time `from` to now and schedule from the plan; cancels what was scheduled. */
  start(plan: SoundPlan, from: Ms): void;
  stop(): void;                                        // fade 40 ms, stop voices
  /** Current timeline time by the audio clock, or null if audio is not running. */
  timelineNow(): Ms | null;
  stats(): { state: AudioContextState; voices: number; scheduled: number; skipped: number };
  dispose(): Promise<void>;
}
```

- Graph: voice `AudioBufferSourceNode` (playbackRate = `rate`) → `GainNode` → `StereoPannerNode`
  → category bus → `sfx` bus. Two looped bed sources go to the `ambience` bus. Stings go to the
  `sting` bus. All buses → `master` → `DynamicsCompressorNode` (threshold −10 dB, ratio 12, as a
  limiter) → destination.
- Scheduler: `setInterval(25 ms)`. Each tick schedules plays with `ctxTime(at) <
  ctx.currentTime + 0.12`, where `ctxTime(at) = anchorCtx + (at − anchorAt)`. Bed gains use
  `setTargetAtTime`.
- **Clock master:** while audio runs, the controller reads the playhead from
  `timelineNow()`, so sound and picture never drift. Otherwise (muted, locked, or failed) it
  uses `performance.now()`. `ReplayClock` takes a `TimeSource` interface, so its arithmetic is
  unit-tested with a fake source (`src/present/battle/clock.ts` holds the pure core).
- Pause: `stop()` (40 ms fade, voices stopped, bed fades over 200 ms). Resume, seek, and
  speed changes call `start(planFor(speed), t)`. When the tab is hidden, the replay pauses.
- Autoplay policy: `unlock()` is called synchronously in the click that opens the modal. If
  the context stays `suspended`, a small "click for sound" chip appears.

---

## 6. UI integration: `src/ui/panels/BattleReplay.tsx`

```
src/ui/panels/BattleReplay.tsx     modal shell (docs/06 path)
src/ui/replay/ReplayController.ts  owns clock, renderer, audio; play/pause/seek/speed/step/skip
src/ui/replay/Transport.tsx        play/pause, speed 0.5/1/2/4, scrubber with round ticks and
                                   highlight markers, prev/next round, next highlight, skip to end
src/ui/replay/SidePanel.tsx        per side: banner, commanders (HP, fatigue, status), squads
                                   (icon, living/start, routing badge, aura glyphs); hover → highlight
src/ui/replay/ReportView.tsx       text report tab
src/ui/replay/useReplay.ts         useSyncExternalStore over the controller (10 Hz for panels)
```

- Open: show the frame → `prepareBattle` → `buildTimeline` → `BattleRenderer.create` and
  `audio.prepare(planned ids)` in parallel → play from 0 at the saved default speed. The game
  stays paused.
- Close (Esc or ×): `renderer.destroy()`, `audio.stop()` (the AudioContext stays for next time).
- Keys: Space play or pause; ← and → previous or next round; Shift+→ next highlight; Home
  restart; End skip to end; 1, 2, 3, 4 select 0.5x, 1x, 2x, 4x (the game's speed keys are
  inactive while the modal is open); M mute; Esc close.
- Side panels read `frame.panel`, and their counts equal `foldReplay` at round boundaries (a
  test checks this).
- Settings (Phase 9 settings screen, stored with the app's settings, not in `GameState`):
  `audio { master 0.8, sfx 1, ambience 0.6, muted false }` and `replay { gore 'full', motion
  'auto' (follows the media query), defaultSpeed 1, quality 'auto', numbers true }`. The modal
  has quick toggles for sound, gore, and numbers. `gore: 'full'` follows the owner's direction.
- Stretch (not acceptance): while paused, hovering an actor shows its file's troops and the
  last blows they took with rolls (detailed mode only), from a per-actor index into the
  script's blows.

---

## 7. Battle lab: `lab/battle.html` (dev only)

```
lab/battle.html          <script type="module" src="/src/lab/main.tsx">
src/lab/main.tsx
src/lab/BattleLab.tsx    layout: sources | canvas + transport | inspectors
src/lab/labApi.ts        window.__lab for Playwright
src/lab/panels/          Sources, Options, DetailInspector, CueInspector, TimelineStats,
                         AudioPanel, PerfPanel, VerifyPanel
src/present/battle/fixtures/named.ts, random.ts   (pure, shared with tests)
```

- Served by `npm run dev` at `/lab/battle.html`, with `npm run lab` = `vite --open
  /lab/battle.html`. It is not in the production build: Vite builds only `index.html` unless
  `rollupOptions.input` adds pages.
- **Sources:** a named fixture with a seed; `randomBattle(seed, { size: 'small' | 'medium' |
  'large' | 'huge', magic: boolean })`, which builds both sides from content (nations or
  independents, 1 to 4 commanders, mages with random known spells for their pips, 1 to 6
  squads of 5 to 200, terrain modifiers); or a **pasted `BattleRecord` JSON** from a save, for
  player bug reports. Fixtures are turned into a real `BattleRecord` through `resolveBattle`
  plus `toSetupRecord`, so the lab runs the same pipeline as the game.
- Named fixtures (each exercises something):
  - `skirmish`; `archerScreen` (free volleys, closing); `cavalryCharge` (lances);
    `berserkers` (rage, no rout); `rout` (morale break, commander routs with its line);
    `retreatScript`; `pdDefense` (pd refs, fort storm modifiers);
  - `pyreStorm` (big-spell cinematic); `mageDuel` (all 11 battle spells); `swarm` (summon,
    flying); `fireShield` (Ash Colossus burns); `lifeDrain` (Black bless stats);
    `stormField`, `fogField`, `wallField` (test spells like `spells.test.ts`'s);
  - `giants` (size 4 kills, crits); `commanderDuel` (Titan vs Ash Chieftain);
    `wyrm` (size 6, flying breath); `monolith` (immobile, unarmed);
  - `grind50` (montage, round-50 withdrawal); `huge300` (300 v 300, 8 mages);
    `immortal` (28,800 strikes, worst case).
- **URL state** for reproduction: `?fixture=…&seed=…&random=…&speed=…&t=…&paused=1&gore=…&motion=…&quality=…&left=…`.
- **Inspectors:**
  - Detail: a table of the current phase's blows with rolls, for example "Cinder Warrior #37 →
    Warden #12: 11+9 vs 10+7 hit; 11+5+8 − 3 − 6 = 15 → 11 hp, killed (overkill 4)". Filters;
    clicking highlights both actors.
  - Cues: near the playhead.
  - Timeline stats: sampled vs shown.
  - Audio: per-category mute or solo, play any recipe and variant, waveform via `AnalyserNode`.
  - Perf: fps, p50 and p95 frame CPU, sprites, particles, decals, pool growth.
  - Verify: `matchesRecord`, `checkTimeline` (the same invariants as the unit tests), and
    report diff.
- `window.__lab`:

```ts
interface LabApi {
  load(spec: { fixture?: string; random?: { seed: number; size: string; magic: boolean };
    seed?: number; record?: BattleRecord; left?: BattleSide }): Promise<void>;
  ready(): Promise<void>;                 // timeline built, textures baked, first frame drawn
  seek(t: Ms): void; play(speed?: PlaybackSpeed): void; pause(): void;
  renderOnce(): void;                     // synchronous render at the current t
  timeline(): { duration: Ms; rounds: RoundMark[]; highlights: Highlight[]; mode: string };
  setView(o: Partial<ViewOptions>): void;
  stats(): RenderStats & { audio: ReturnType<AudioEngine['stats']> };
  loseContext(): void; restoreContext(): void;   // WEBGL_lose_context
  canvasHash(): Promise<string>;          // hash of renderer.extract pixels (debug)
}
```

---

## 8. Tests

### 8.1 Vitest (Node), mirroring `src/`

| File | What it pins |
|---|---|
| `tests/sim/battle/detail.test.ts` | §2.7: the sink changes nothing; detail adds up to the tallies; order and `at` |
| `tests/sim/battle/rerun.test.ts` | §2.7: capture, re-run after a JSON round trip, mismatch and errors, game integration, record size |
| `tests/present/battle/prepare.test.ts` | detailed for fresh records; `noRerun`, `mismatch` (tampered stat), `error` (unknown spell) |
| `tests/present/battle/script.test.ts` | both modes: each phase's blows add up to the tallies; every aggregated event lands in exactly one phase; fallback classification on every fixture's log; commander killing blow found |
| `tests/present/battle/layout.test.ts` | actors inside the world; the left side is the player's; member→actor covers every member exactly once; caps; no overlap within a block beyond jitter; rank moves when a front empties |
| `tests/present/battle/pacing.test.ts` | durations per table; quiet compression; montage on 4+ quiet rounds; budget ≤ 150 s for `immortal` and `grind50`; typical fixtures 10 to 60 s |
| `tests/present/battle/timeline.test.ts` | below |
| `tests/present/battle/evaluate.test.ts` | `evaluateInto` at each round start equals its keyframe; the same frame whether reached by playing forward in 16 ms steps or by direct seek; the final frame's living counts, routing, and gone equal `foldReplay`; reduced motion → camera identity; gore `none` → `decalsUpTo` never counts `gore ≥ mild` |
| `tests/present/battle/particles.test.ts` | closed-form determinism; bounds (no NaN, ballistic never below ground); counts per preset |
| `tests/present/battle/view.test.ts` | flash limiter: ≤ 3 per real second at every speed for every fixture; LOD by speed |
| `tests/present/battle/report.test.ts` | text snapshots for 3 fixtures |
| `tests/present/battle/clock.test.ts` | with a fake time source: play, pause, and resume keep `t`; a speed change mid-play re-anchors with no jump; seek clamps to `[0, duration]`; the end pauses at `duration` |
| `tests/present/battle/perf.test.ts` | §3.11 budgets (generous ×2 in CI) |
| `tests/present/sound/plan.test.ts` | below |
| `tests/present/sound/dsp.test.ts` | each recipe × variant renders finite samples of the right length; peak ≤ 0.9; RMS above −40 dBFS; DC under 1e-3; the same hash twice; a pinned hash for 3 recipes |
| `tests/content/presentation.test.ts` | §9 validation |
| `tests/sim/purity.test.ts` | `src/present` pure; nothing pure imports `src/audio`, `src/render`, `src/ui`, `src/lab`; core pure dirs never import `src/present` |

**Timeline invariants** (`check.ts`, run by the test over all named fixtures × 5 seeds and
**200 random battles** from `randomBattle(seed)`, and by the lab):
1. Determinism: `buildTimeline` twice → deep-equal. Pinned `stateHash(timeline)` for
   `skirmish` and `mageDuel`, updated only together with a presentation-content change.
2. Cue lists are sorted, with `t ≥ 0` and `t + dur ≤ duration`; transient `dur ≤ 3000`.
3. Rounds are strictly increasing and cover `[0, duration)`. Phases nest inside their round.
4. **Every kill is shown exactly once.** Body falls plus actor deaths equal the sum, over every
   group including summons, of start count minus living at the end. Each actor dies once,
   after every one of its lunges, shots, and casts.
5. No cue other than corpse decals targets an actor after its death or after it leaves.
   Routing actors leave only through `leave`.
6. Counts: `frame.panel` at each round start equals `script.living` and the `foldReplay` counts.
7. A commander death has a highlight, a slow-motion warp, and a priority-0 sound.
8. Detailed mode: lunges ≤ 2 per actor per melee window; projectiles in flight ≤ 500; every
   kill blow's actor reacts.
9. Fallback mode passes 2 to 7 for every fixture.

**Sound plan determinism** (`plan.test.ts`):
1. `planSounds(timeline, s)` twice → deep-equal for s ∈ {0.5, 1, 2, 4}. Pinned hash per speed
   for `skirmish`.
2. Plays are sorted by `at`; per-window category caps and total ≤ 12 (priority 0 excepted);
   polyphony ≤ 32 at every instant.
3. Every priority-0 cue is planned at every speed. Every play maps to an existing `SoundCue`.
4. Seek invariance: the plays from `playsFrom(plan, t)` on equal the tail of the full plan.
5. The plan is independent of when it is computed (no hidden state): computing plans for
   speeds in a different order gives identical plans.

### 8.2 Playwright (`e2e/`, `npm run test:e2e`)

- `@playwright/test` pinned to **1.56.1**, matching the installed Chromium build 1194 under
  `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` (downloads are disabled in this environment).
- `playwright.config.ts`:
  - `webServer: npx vite --port 5179 --strictPort` (reuse an existing server).
  - Viewport 1920 × 1080, `deviceScaleFactor: 1`.
  - Chromium arguments: `--use-angle=swiftshader --enable-unsafe-swiftshader
    --autoplay-policy=no-user-gesture-required`.
  - `toHaveScreenshot({ maxDiffPixelRatio: 0.01, threshold: 0.2 })`. Baselines in
    `e2e/__screenshots__/`.
- Screenshots are deterministic because the scene is a function of `t`: particles in closed
  form, the procedural glyph font, a fixed viewport, software GL, and the canvas element only
  (`locator('canvas')`), with the DOM panels not captured.

| Spec | Checks |
|---|---|
| `battle-lab.spec.ts` | `skirmish` seed 1 at t = 0, the first volley's impact, the melee peak, after the first death, the end: 5 screenshots. `pyreStorm` at its impact. `mageDuel` with auras. `gore=none` vs `full` at the same `t` (screenshots, plus `stats().decals` by kind). |
| `battle-context.spec.ts` | screenshot at t; `loseContext()`; `restoreContext()`; `ready()`; the same screenshot within tolerance. |
| `battle-audio.spec.ts` | play `skirmish` 3 s at 1x: `stats().audio.scheduled > 0`, `skipped` = 0 after bake, no console errors. In the page, render 3 recipes with the same DSP module and check that RMS matches Node's to 1e-6. |
| `battle-perf.spec.ts` | `huge300` at 4x for 5 s: frames > 150, p95 frame CPU < 12 ms (software GL makes GPU time meaningless; CPU is the gate); no pool growth after the first second. |
| `replay-modal.spec.ts` (after Phase 9) | the game screen, a battle message click, the modal opens, Space pauses, End skips, Esc closes. |

`CLAUDE.md`'s commit gate (`typecheck && lint && test`) gains `&& npm run test:e2e` for commits
that touch `src/render`, `src/audio`, `src/ui/replay`, or `src/lab`.

---

## 9. Content additions (`src/content/presentation/**`) and validation

| File | Contents |
|---|---|
| `pacing.ts` | `PACING` (section 3.5 table), `LAYOUT` (world, anchors, caps, spacing, scales), `SAMPLING` (lunges per actor, projectile cap, merge windows), `CINEMATIC` thresholds |
| `units.ts` | `UNIT_LOOKS: Record<UnitTypeId, UnitLook>`: `{ archetype, material: 'flesh' \| 'hide' \| 'bark' \| 'chitin' \| 'stone' \| 'flame' \| 'spirit', voice: 'man' \| 'beast' \| 'giant' \| 'insect' \| 'spirit' \| 'none', death: DeathStyle, weapons: { motion, projectile?, swing, impact? }[] }`, plus `UNARMED_LOOK` |
| `spells.ts` | `SPELL_LOOKS: Record<string, { shape, burst, cast, travel?, impact?, cinematic? }>` for every battle spell |
| `particles.ts` | `PARTICLES: Record<ParticlePresetId, { count, shape, colors, speed, spread, gravity, drag, life, size, blend, motion, gore? }>`. Per color, motion as in `docs/09` (Ember rises and flickers, Loam spreads along the ground, Tide ripples, Radiance radiates, Umbra sinks), at 40 to 160 per spell burst (`docs/09`'s 12 to 40 raised by the owner's direction). Per material: blood, sap, embers, ichor, sparks, stone chips, dust. |
| `sounds.ts` | `SoundId`, `SoundCategory`, `SOUNDS` recipes (section 5.4) |
| `floaters.ts` | floater colors and glyphs per style and element |

`tests/content/presentation.test.ts`:
- Every `UnitTypeId` has a `UNIT_LOOKS` entry whose `weapons.length` equals the unit's weapon
  count, ranged weapons have a projectile, and melee weapons have none.
- Every `BATTLE_SPELLS` id has a `SPELL_LOOKS` entry. Every element and material has a
  particle preset. Every referenced `SoundId` has a recipe.
- Floater colors per element differ by CIEDE2000 ≥ 20 normally and ≥ 12 under simulated
  deficiencies, with the existing palette test's helper. Damage, heal, and crit styles also
  differ by glyph.
- Sizes 1 to 6 all have a scale and spacing.

Per `CLAUDE.md`, a new unit, spell, or chassis gets its look added to these fixtures.

---

## 10. Accessibility

- **Color-blind safety:**
  - Sides are told apart by position (player left), by the side glyph on each squad's badge
    (chevron for left, shield for right), and by the banner color (already tested).
  - Floaters carry element glyphs, and kills a skull.
  - Heal and damage differ by sign and motion (heals rise slowly, damage pops).
  - New colors join the palette test.
- **Reduced motion and photosensitivity:** section 3.9. The flash limiter is always on and
  tested for every fixture at every speed.
- **Gore:** `none`, `mild`, or `full`, in the modal and in settings.
- **Sound:** volume, mute, and an ambience slider. Nothing is sound-only.
- **Report tab:** a full text account for screen readers and for no-WebGL machines.
- **Keyboard:** everything works from the keys in section 6. Focus stays in the modal.

---

## 11. Docs to update (in the commit that makes each change)

- `docs/04-battle.md`:
  - The resolver signature gains the optional detail sink.
  - New Implementation decision **"Replay detail"**: detail events and their order; the
    record's `rerun`; verification and fallback; why blows are not saved; `STATE_VERSION` 2.
  - The "Replay log" paragraph's "1 round per 1.5 seconds" is replaced by a pointer to the
    pacing rules.
- `docs/06-architecture.md`:
  - Layout gains `src/present/**`, `src/audio/**`, `src/ui/replay/**`, `src/lab/**`,
    `lab/battle.html`, `e2e/`, `playwright.config.ts`, and `src/content/presentation/**`.
  - The purity guard paragraph gains `src/present` and the import-direction rule.
  - Performance targets add the table in section 3.11 and the frame budget.
  - Save/load notes the 2 → migration.
- `docs/07-ui.md` "Battle replay": files of troops (up to 64 by size) instead of 20 sprites;
  highlights on the scrubber; keys; Report tab; gore, motion, and sound toggles.
- `docs/09-art-direction.md`:
  - Animation table extended: charge, body fall, corpse, rage, montage.
  - Particle numbers raised.
  - New sections "Battle replay pacing" (numbers) and "Sound" (vocabulary, recipes, synthesis
    in code, no audio files, CC0 only if a sample is ever added).
- `docs/10-milestone-1.md`:
  - Out of scope: "sound" becomes "sound outside battle replays (music, map and UI sounds)".
  - Acceptance criterion 7 adds: "battle replays play with sound effects, per-blow detail
    when available, and the options in `docs/07`".
  - The Phase 10 and 11 bullets point to this track's steps.
- `docs/PROGRESS.md`: one entry per step below.

---

## 12. Build order

Each step ends green (`typecheck`, `lint`, `test`, plus `test:e2e` from step 4) with a commit.

1. **Sim: detail sink and record capture** (lands now, before Phase 9 saves exist). Files:
   `field.ts`, `attacks.ts`, `effects.ts`, `morale.ts`, `resolve.ts`, `detail.ts`, `record.ts`,
   `rerun.ts`, `apply.ts`, `conflict.ts`, `types.ts` (`STATE_VERSION` 2). Tests: `detail.test.ts`,
   `rerun.test.ts`. Commit: `Phase 10 prep: battle detail sink and re-runnable battle records`.
2. **Present: script, layout, pacing, timeline** (pure, Node only; can run beside Phase 7 and
   8), with `content/presentation/{pacing,units,spells,particles,floaters}.ts`, fixtures,
   `check.ts`, `report.ts`, and their tests. Guard updates.
3. **Present: evaluate, warp, camera, particles, view filters, sound plan, DSP**, plus
   `content/presentation/sounds.ts` and tests.
4. **Lab and renderer and audio engine:** `lab/battle.html`, `src/lab/**`,
   `src/render/BattleRenderer.ts`, `src/render/battle/**`, `src/render/sprites.ts` (procedural
   placeholders), `src/audio/**`, Playwright config and specs. Playtest in the lab and tune
   `content/presentation`.
5. **Phase 10: modal** — `BattleReplay.tsx`, `src/ui/replay/**`, message → replay, settings
   fields, `replay-modal.spec.ts`.
6. **Phase 11: art** — the SVG part sprites feed `TextureFactory`, and spell particles get
   their palettes. Screenshot baselines are refreshed deliberately, in this commit only.

File sizes stay under 400 lines. The likely large ones, `emit/melee.ts` and `evaluate.ts`, are
split by concern if they grow (for example `evaluate/actors.ts`, `evaluate/transients.ts`).

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Re-runs diverge after content or code changes | Verified against the stored log; a fallback that always works; a game integration test |
| A setup holds content references and JSON drops `undefined`/`Infinity` | `toSetupRecord` round-trips through JSON at capture, so the session equals the load. A test asserts every number in fixture setups is finite. |
| Worst-case open time (35 ms re-run + ≤ 100 ms build) | Show the frame first; pure data so a Worker is a drop-in; perf tests |
| Cacophony or audio fatigue in big melees | Per-window category caps, gain ×1/√n, polyphony 32, a density bed instead of hundreds of clangs; all knobs in content; lab solo and mute |
| Headless WebGL screenshot flakiness | Software GL, the procedural font, the scene as a function of `t`, canvas-only captures, 1% tolerance, baselines refreshed only in art commits |
| Pinned hashes churn on harmless changes | Positions and times quantized; pins only on 2 fixtures; update rule written in the test |
| Purity guard gaps (ESLint flat-config override) | The purity source-scan test checks import direction independently of ESLint |
| Save bloat from future setup fields | The 16 KB worst-record test |
| Detail memory on worst battles | Detail is transient (≈ 6 MB for 28,800 strikes as objects). The timeline keeps sampled cues only, and detail is dropped after the build. |
| Photosensitive players | The flash limiter is always on and tested; reduced motion; flash alpha cap |

---

## Appendix A: measurement details

Method: copied `fm-godless/src` and `tests/sim/battle/fixtures.ts` into the scratchpad.
`attacks.ts` and `effects.ts` were patched to bind both DRNs to local constants and push
`[phase, member, weapon, targetMember, drnA, drnB, amount, round]` per strike into a module
array when enabled. Every scenario's aggregated replay was compared with an unpatched-path
run (`same=true` for all). Setup sizes: plain `JSON.stringify(setup)`, and a compact variant
with `spells` replaced by ids. Timing: mean of 10 to 20 runs after warm-up.

```
small_20v20:   rounds=5  events=26  agg=1.3KB setup=1.2KB  strikes=112   detailJSON=2.2KB  gz=0.6KB
mid_60v60:     rounds=7  events=46  agg=2.6KB setup=2.3KB  strikes=407   detailJSON=8.1KB  gz=2.2KB
big_300v300:   rounds=5  events=27  agg=1.4KB setup=1.2KB  strikes=1750  detailJSON=37.3KB gz=10.5KB maxPerRound=575
big_mages:     rounds=6  events=106 agg=6.7KB setup=15.0KB strikes=1595  detailJSON=33.3KB gz=9.1KB
               (compact setup, 3 squads a side + 8 mages: 15.9KB full -> 6.4KB with spells by id)
grind (prot16, mor50):  rounds=44 events=151 agg=8.1KB strikes=9175  detailJSON=199.8KB gz=52.5KB
immortal (prot99, mor50): rounds=50 events=148 agg=7.8KB strikes=28800 detailJSON=653.4KB gz=162.5KB
resolve ms (off / with detail): 0.67/0.64, 1.20/1.34, 1.35/3.18, 3.59/5.30, grind 31.9/22.8*, immortal 32.0/35.1
  (* run-to-run variance; detail capture adds at most a few ms)
DRN tails: P(>=14) 12.9%, P(>=16) 7.6%, P(>=18) 5.1%, P(>=20) 3.0%  (crit threshold 18)
```

## Appendix B: sketch of the `attacks.ts` change

```ts
export function rollDamageParts(
  rng: RngState, base: number, prot: number, piercing: boolean, negating: boolean,
): DamageRoll {
  const armor = negating ? 0 : piercing ? Math.floor(prot * BATTLE.armorPiercingFactor) : prot;
  const attackDrn = drn(rng);   // first draw, as in `base + drn(rng) - armor - drn(rng)`
  const armorDrn = drn(rng);
  return { base, prot, armor, attackDrn, armorDrn,
    rolled: Math.max(0, base + attackDrn - armor - armorDrn) };
}

// meleePhase, per member and weapon (target pick unchanged, before the rolls):
const attack = statOf(m, 'att');
const defense = statOf(target, 'def');
const attackDrn = drn(rng);
const defenseDrn = drn(rng);
const bonus = g.firstMelee === round ? (w.firstRoundBonus ?? 0) : 0;
const roll = attack + attackDrn > defense + defenseDrn
  ? weaponDamage(rng, statOf(m, 'str'), w, statOf(target, 'prot'), bonus)
  : null;
hits.push({ by: g, from: m, weapon: w, weaponIndex, target, attack, attackDrn, defense,
  defenseDrn, roll, berserk: raging(m), firstRound: bonus > 0 });

// land(): one strike per hit, in landing order
for (const h of hits) {
  const t = tallyFor(h);
  if (h.roll === null) { if (detail) detail.push(strike(h, kind, log.length, round, null)); continue; }
  t.hits += 1;
  const hpBefore = h.target.alive ? h.target.hp : 0;
  if (!h.target.alive) {
    if (detail) detail.push(strike(h, kind, log.length, round, { hpBefore: 0, dealt: 0, killed: false }));
    continue;
  }
  h.target.hp -= h.roll.rolled;
  const killed = h.target.hp <= 0;
  if (killed) { h.target.alive = false; h.target.hp = 0; h.target.group.deathsThisRound += 1; t.kills += 1; }
  if (detail) detail.push(strike(h, kind, log.length, round,
    { hpBefore, dealt: Math.min(h.roll.rolled, hpBefore), killed }));
  if (h.target.group.isCommander && h.roll.rolled > 0) log.push({ kind: 'damage', /* as today */ });
}
```
