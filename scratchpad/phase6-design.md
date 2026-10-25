# Phase 6 design: pretender, dominion, Wellsprings, victory, headless runner

Spec: docs/10 Phase 6 ("Chassis, pip costs, scales costs and effects, awakening arrival,
prophet, dominion spread, Godless, Wellspring claim, victory and defeat, headless runner with
a random-order dummy AI. Tests: presets within budget; dominion spreads from the capital;
claim completes in 10 days; victory triggers."). Acceptance 9 (6 chassis, pips, dominion, 5
scales with effects, awakening, prophet), 10 (dominion spread, scales per province, Godless),
11 (Wellspring claims and victory; elimination defeat; stats), 15 (headless runner reporting
winner, months, final stats per game). Rules: docs/05-pretender.md (all), docs/01 sections
12, 13 and the Phase 2-5 decisions, docs/02 section 8 (bless), docs/04 (pretender in battle),
docs/06 (commands makeProphet, claimWellspring; tick steps 5 and 7; game loop), docs/08 (AI
plans every 5 days; Phase 7 replaces the dummy).

## Content

- src/content/pretenders/chassis.ts: CHASSIS: six records { id, name, cost, basePips
  ('nation' count | fixed color pips), baseDominion, unit (a UnitTypeId of a pretender body in
  units/pretenders.ts), pipDiscount (Oracle 10), dominionChecks factor (Monolith 2),
  researches (Oracle true), notes }.
- src/content/units/pretenders.ts: one commander unit per chassis, from the docs/05 body
  column; stats the table leaves out take the baseline (docs/03 decision). Leadership: Titan
  100 (listed); the others are unlisted: 20 (a bodyguard), Monolith 0 (immobile). Map speed:
  baseline 2; Monolith 0 with the immobile tag; Wyrm flying. Great Wyrm breath: 12 damage of
  the nation's element (content map from color to element: W holy, U cold, B decay, R fire,
  G nature), range 3, ammo 5; battle setup sets the element from the nation's primary color
  (elements are display only in M1). Wild Spirit regeneration 0.1 (unstated). Ash Colossus
  fire shield 5: a new CombatStats field fireShield; each melee hit on it deals 5 fire damage
  to the striker, after the phase like life drain, no armor. Pretenders cost no upkeep (cost
  null), eat 1 supply as commanders, and are not recruitable.
- src/content/pretenders/costs.ts (or rules): BUDGET 400; PIP_COSTS [40, 20, 25, 30, 35, 40]
  by level; newColorFirstPip 60; DOMINION_POINT 30; SCALE_STEP {own: 20, other: 40};
  AWAKENING { awake: {refund 0, arrivalDay 0}, dormant: {150, month 12 -> day 330},
  imprisoned: {350, month 36 -> day 1050} }.
- src/content/pretenders/presets.ts: the six docs/05 presets as PretenderDesign data; each
  validated within budget (adjusted and recorded if not).

## Design cost and validation (src/sim/pretender.ts)

- PretenderDesign.pips is the full pip set, chassis base included (Phase 5 decision).
- designCost(nation, design): chassis cost + pips + dominion + scales.
  - Pips per color: levels above the chassis's base pips in that color cost PIP_COSTS[level],
    the first pip of a color other than the nation's primary costs 60 instead of 40; the
    Oracle pays 10 less per pip. Base pips are free. A design below its chassis base pips is
    invalid.
  - Dominion: (design.dominion - chassis base) * 30; below base invalid.
  - Scales: each step from 0 toward a pole costs 20 if the pole's color is in the nation's
    identity, else 40. Steps never refund.
  - Budget: 400 + awakening refund.
- validatePretender(nation, design): string | null (chassis known, pips 0..6, dominion
  base..10, scales -3..3, cost <= budget). createGame refuses an invalid design (throws, as
  today for bad setups); the New Game screen (Phase 9) shows the same message.

## Pretender in play

- NationState gains `pretenderState: 'waiting' | 'present' | 'recalled' | 'dead'` and
  `pretenderArrivalDay` (from awakening). pretenderId stays the only commander link.
- Arrival (tick step 3): on or after the arrival day, a waiting pretender appears in the
  nation's capital (its unit, design pips, holy 0, default script: casters cast, others hold)
  if the nation is not Godless; message 'info' "X has awakened". Awake: created in createGame
  on day 0.
- Death: commanderDies sets pretenderState 'dead' (never returns in M1).
- Research: canResearch admits the pretender only if its chassis researches (Oracle).
- Rituals: any pretender with pips may cast rituals by the usual rules (the Monolith stands in
  its capital, which has a lab).
- Bless: docs/02 says sacred units; the pretender is not sacred, so no bless.
- Battle: fireShield, flying, regeneration as data.

## Prophet (docs/05)

- Command makeProphet { nation, commander }: the nation's commander, not a garrison holder,
  not the pretender, not already the prophet, no prophet now, day >= prophetAvailableDay.
  Sets prophetId; the commander's holy becomes max(holy, 3). It gets +1 morale in battle and
  the nation's bless (setup reads isProphet). Its script is not changed (the player sets it).
- One dominion check per month from the prophet's province (as a temple).
- Prophet death: cooldown already (Phase 4).

## Dominion spread (docs/01 section 12), tick step 5 on the last day of each month

- Sources per nation, in nation order, each source in a fixed order: capital (3 checks; if
  the nation owns its capital), temples it owns (province order; 1 + its nation's Sanctity
  steps each, from nationScales: templeChecks per step), pretender present (2 checks, x2 for
  the Monolith; from its location, not while in transit? location counts), prophet (1),
  priests with order Preach standing in a province (1 per holy pip; the prophet's own preach
  counts too).
- A check: from the source's province, pick the same province with chance 0.4, else a random
  adjacent province (state.rng); roll d10 (randInt 1..10); if <= dominionScore(nation),
  pushDominion(province, nation, 1).
- Messages 'dominion' to a nation when a province it owns changes dominating nation.
- Unrest from enemy dominion (Phase 2) already reads dominion each day.

## Godless (docs/01 section 12)

- Checked after spread each month and after every capture: a nation is Godless when the
  dominion of its capital is not its own (nation !== it or strength 0) and it owns no temple.
  Becoming Godless: message; a present pretender is recalled: its squads go to the first
  other own commander in its province, else the garrison holder there, else are lost; the
  commander record is removed; pretenderState 'recalled'. Rituals are refused (Phase 5).
- No longer Godless (checked monthly): a recalled pretender returns to the capital
  (pretenderState 'present', a new commander record).

## Wellsprings (docs/01 section 13)

- Command claimWellspring { nation, commander }: a priest (holy >= 1), standing in a
  Wellspring province its nation owns, not already claimed by it. Order claimWellspring
  daysLeft 10. Tick step 3: counts down; at 0 sets wellspringClaimedBy and posts
  'wellspring'. Any other order, a move, a battle the priest fights (battle ends move and
  claim orders), losing the province, or death ends it.
- Claimed Wellsprings: +1 dominion score each (Phase 2 selector); losing the province
  unclaims it (Phase 4 capture).

## Victory and defeat (docs/01 section 13), tick step 7

- A nation is eliminated when it owns no province, or owns no fort (M1 forts are capitals:
  losing its capital while holding no other fort). Elimination: its commanders die, its
  provinces become independent (owner null, PD 0, garrison holders removed, queues dropped),
  its dominion stays; message to everyone; eliminated = true.
- A nation whose capital falls but which holds another fort moves its capital to that fort
  (lowest province index) so arrival, capital dominion checks, and capital-only recruitment
  keep working.
- Victory: a nation that has claimed wellspringsToWin(count) Wellsprings wins
  ('wellsprings'); else the last nation not eliminated wins ('lastCapital'). A human nation
  eliminated while others remain ends the game ('playerDefeated', winner null) when every
  human is eliminated. Checked at the end of each day; state.result set; advance stops.
- Stats for the victory screen: the existing NationStats plus provinces owned (derived).

## Headless runner and dummy AI

- src/ai/dummy.ts: dummyCommands(state, nation): Command[]. Random-order dummy: a private rng
  seeded from (state.seed, state.day, nation index), never state.rng (so a command log replays
  without the AI). Every 5 days: set research to the primary color; queue a batch of the
  cheapest affordable troop at the capital if the queue is empty; move each idle field army
  with 10+ troops to a random adjacent province (hostile or not; validated, skipped if refused);
  mages research; priests preach. All through validateCommand/applyCommand.
- src/ai/match.ts: runMatch({ seed, mapSize, nations, maxDays }): plays until state.result or
  maxDays (default 100 months), calling the AI every 5 days; returns { winner, days, stats }.
- scripts/aivai.ts: runs --games N from --seed S (Cinder Horde vs Thornwood, Medium, normal
  AI), prints one line per game (seed, winner or draw, months, provinces, battles) and a
  summary (wins per nation).
- docs/06 layout: src/ai/ (dummy.ts now; Phase 7 adds the real AI).

## Tests

- Presets within budget (docs/10). Cost table cases: mono-color 4 pips = 115, a second color
  at 2 pips = 80; Oracle discount; dominion and scale step costs; awakening refunds; invalid
  designs refused.
- Arrival: dormant pretender appears on day 330 in the capital; awake on day 0.
- Dominion spreads from the capital over months (strength in neighbors > 0 after 6 months);
  pushes respect the score cap; flips post messages; Monolith doubles its checks.
- Godless: losing capital dominion with no temple makes a nation Godless, recalls the
  pretender, blocks rituals; regaining returns the pretender.
- Prophet: command rules, holy 3, +1 mor and bless in battle, a temple's check.
- Claim completes in 10 days (docs/10); interrupted by orders and battles; victory at 2 of 3.
- Victory triggers: wellsprings; last nation standing; player defeated; elimination effects.
- Runner: 2 short matches finish and are deterministic for a seed; the AI never throws and
  only issues valid commands.

## State changes

- NationState: pretenderState, pretenderArrivalDay. Commands: makeProphet, claimWellspring.
  CombatStats: fireShield. STATE_VERSION stays 1 (no saves exist yet).
