# integrate-1b notes

Worktree /home/user/fm-integrate, branch integrate-1b, base c6d0e4c (Phase 6b.3).

## Step A: cherry-pick f196a61 (wilds behind a switch)

Conflicts:
- src/ai/match.ts: 6b.3 split runnerSetup into playedSetup(seed, order, presets) + runnerOrder +
  runnerSetup(seed, game, presets); 1b gave runnerSetup(seed, game, wilds) and runnerSetups(seed,
  games, wilds). Merged: playedSetup(seed, order, presets = [], wilds = RUNNER_DEFAULTS.wilds),
  runnerSetup(seed, game, presets = [], wilds), runnerSetups(seed, games, presets = [], wilds);
  setups carry both. Kept 1b's RUNNER_DEFAULTS type with wilds.
- src/ai/matrix.ts (no textual conflict): matrixSetups(pairing, seed, seeds, wilds =
  RUNNER_DEFAULTS.wilds) passes wilds to playedSetup.
- scripts/aivai.ts: took 6b.3's structure (play/runner/matrix/timing, --presets, --matrix) and
  added 1b's --wilds on|off (validated, in usage), passed to runnerSetups and matrixSetups; the
  runner summary says "with wilds" as 1b's did; the matrix header says ", with wilds".
- docs/08-ai.md: kept 1b's --wilds sentence at the end of the runner bullet (noting it also sets
  the matrix's maps), then 6b.3's presets/matrix bullet.
- docs/09-balance.md: 1b's "Measured ..." sub-bullet stays under the Thornwood item, 6b.3's new
  preset-matrix checklist item after it.
- docs/PROGRESS.md: 6b.3's section, then 1b's (last phase entry before Deviations, where A put
  it); in known issues 1b's timing-tests line (adds generate.perf), then 6b.3's matrix and
  leaves-for-later bullets, then 1b's matchup, balance and merging bullets.

Test adaptations (6b.3 tests):
- tests/ai/matrix.test.ts "leave the default runner exactly as it was without them": the
  written-out Phase 7 setup gains `wilds: false` (runner setups now carry the key; false plays
  the same map as absent: createGame `setup.wilds === true` in A).
- tests/sim/pretender.reform.test.ts "keeps its return day through a save and load, with no new
  save version": STATE_VERSION 3 -> 4; MIGRATIONS[3] undefined -> the migration keys are exactly
  1, 2, 3 (3 is 1b's); added: a version-3 copy without map.wilds lifts with the return day 90.
- tests/ai/match.wilds.test.ts (1b's): runnerSetup(1, 0, true) -> runnerSetup(1, 0, [], true)
  etc.; new test "carries the chosen presets and the switch together, in the runner and the
  matrix".

Hash re-pins in step A: none needed. No 6b.3 test pins an absolute whole-state hash:
- grep of all tests for 10+ hex literals: only wilds.pins, generate.identity, presets.test PINS.
- presets.test PINS go through presetPins.stripped(), which commit A already makes delete
  map.wilds (and throw if a pinned game has wilds). Pins pass unchanged.
- pretender.summon "365-day hash" and pretender.reform save test compare two hashes of the same
  build (not pins).

Step A gate: typecheck, lint ok; 2193 tests in 126 files passed. Runner (wilds off default in A):
Cinder Horde 10, Thornwood 9, no winner 1, 26.8 months, 0 refused (same as 6b.3).
Commit A = d438370.

## Step B: cherry-pick 38df7b3 (impassable terrain on)

Conflicts:
- tests/ai/match.wilds.test.ts: header comment (A's presets line vs B's default line): merged
  both; first test took B's (default on) with calls moved to the new signature
  (runnerSetups(1, 2, [], false), runnerSetup(1, 0, [], false)); kept A-rebuild's presets test;
  the wilds-off comparison runnerSetup(1, 0, [], false).
- docs/08-ai.md: runner bullet takes B's "default is on" text (keeping the matrix mention), then
  6b.3's presets/matrix bullet.
- docs/09-balance.md: table: 6b.3 rows then 1b rows; checklist: both Measured sub-bullets under
  the Thornwood item, then 6b.3's preset item.
- docs/PROGRESS.md: heading "Phase 1b: Impassable terrain (done)" after the 6b.3 section; known
  issues: 6b.3's matrix and leaves-for-later bullets, then B's rewritten Phase 1b matchup bullet
  (dropping A's "for commit B" version).

First full test run after the merge: 2 failures, both tests/ai/matrix.test.ts:
- "leave the default runner exactly as it was without them": runnerSetups(1, 20) now carries
  wilds: true. Kept the pin of the Phase 7 setup but compared it with runnerSetups(1, 20, [],
  false) (a runner replay pinned before wilds -> wilds false), and added that the default
  differs only by wilds: true.
- "plays each Phase 6b.3 preset's first matrix games for a year with no refused command":
  with wilds, Undying Flame vs Elder Oak (Cinder Horde first) ends by Wellsprings on day 340.
  Probe (probe/matrixFirst.ts), seed 1, wilds on: 4 of 12 games end on days 340, 335, 300,
  350; seeds 2 and 3 also have 5 and 2 early wins (corrected after review; "6" was wrong); wilds off seeds 1-3: all 36 last 360 days,
  0 refused. A year-long game cannot be found on the wild default's first seed, so the test
  keeps seed 1 with wilds: false (comment says why), and a new test plays the same games on the
  default wild maps: no refused command, and 360 days unless a winner.
- tests/content/presets.test.ts "play 365 days of the AI deterministically, each against the
  opposing default": goes through presetPins.gamePin, whose setup B sets wilds: false; comment
  added saying why (as computed when 6b.3 wrote it; wild maps covered by match.wilds/matrix).

Measurements on the B state (wilds on by default):
- npm run sim:aivai -- --games 20 --seed 1: Cinder Horde 17, Thornwood 3, no winner 0, 23.6
  months, 0 refused, 18.6 s, AI 1.55 ms mean / 20.97 max. Per-game lines identical to commit B's
  runner-after.out (phase1b-B) -> as expected, no difference to explain.
- --wilds off: 10/9/1, 26.8 months, 0 refused; per-game lines identical to 6b.3's ai20.out.txt.
- npm run sim:aivai -- --matrix (wilds on, run once): 440 games, 0 refused, 400.1 s (mutation
  sweep running alongside; load ~2-9), AI 1.38 ms mean, 126 ms max.
  | Pairing | with wilds C/T/none share | 6b.3 without wilds |
  | Warlord vs Elder Oak (baseline) | 34/6/0, 25.6 mo | 24/13/3, 30.2 mo |
  | Ember Oracle | 24/16/0 60% yes | 57% yes |
  | Wildfire | 28/11/1 70% NO | 83% NO |
  | Deep Root | 35/4/1 10% NO | 10% NO |
  | Wyrm of the Loam | 28/9/3 23% NO | 43% yes |
  | Undying Flame | 32/7/1 80% NO | 80% NO |
  | Pyre Host | 32/8/0 80% NO | 80% NO |
  | Dread Idol | 29/11/0 73% NO | 75% NO |
  | Heartwood | 30/8/2 20% NO | 18% NO |
  | Hunt Lord | 32/8/0 20% NO | 30% NO |
  | Mother of the Pack | 30/9/1 23% NO | 23% NO |
  (A --wilds off matrix run was started for a cross-check and stopped at once, to keep to "run it
  once"; docs do not claim the off matrix was re-run.)
- npm run sim:duel: output identical to 6b.3's duel.out.txt (diff empty, timing lines aside);
  9.3 s.
- Gate on B (first run, load avg ~9 with two mutation sweeps): 1 failure, tests/sim/siege.test.ts
  "won with no one left standing ..." timed out at 5000 ms (60 createGame calls). Re-run alone:
  passes, 2066 ms for that test (still under load 9).

## Mutants (run on c6d0e4c sandbox mut/base and on the step-B sandbox mut/B)

Lists: p6b3/fix/mutations.mjs (17, the review list) and p6b3/harness/mutations.mjs +
mutations2.mjs (77, the first run). Tests as listed, with tests/ai/recruit.test.ts expanded
to recruit.test.ts + recruit.transfers.test.ts (the 6b.3 split). Runner: mut/run.mjs.

| mutant | c6d0e4c | step B | killing test on B |
|---|---|---|---|
| fix:N7-tick-order | KILLED | KILLED | the monthly summon (N7) > runs in tick step 3 after the pretenders settle: a dormant Mothe |
| fix:N7-stock-skip-garrison | KILLED | KILLED | the monthly summon (N7) > counts wolves held by the capital’s garrison holder against the  |
| fix:AI-bound-idol-only | KILLED | KILLED | transfers > let the Mother of Beasts keep her wolves and hand on the rest |
| fix:AI-keep-all-bound | KILLED | KILLED | transfers > hand on what the pretender holds of its summoned unit above the summon’s cap |
| fix:AI-keep-none | KILLED | KILLED | transfers > let the pretender keep its monthly summons, bound to it, and hand on the rest |
| fix:AI-split-whole | KILLED | KILLED | transfers > hand on what the pretender holds of its summoned unit above the summon’s cap |
| fix:N8-elim-no-cancel | KILLED | KILLED | reform after death (N8) > falling in the storm of its last fort, is promised a return and  |
| fix:N8-elim-cancel-always | KILLED | KILLED | reform after death (N8) > standing when its nation falls, dies with it for good: no promis |
| fix:N8-elim-cancel-after-fall | KILLED | KILLED | reform after death (N8) > falling in the storm of its last fort, is promised a return and  |
| fix:N8-rise-message-no-province | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| fix:MX-band-min-strict | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| fix:MX-band-max-strict | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| fix:MX-refused-zero | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| fix:MX-table-no-NO | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| fix:PB-findPreset-first | KILLED | KILLED | --presets > refuses a malformed pair, an unknown nation or preset, a foreign preset, or a  |
| fix:DU-avatar-no-bonus | KILLED | KILLED | the Avatar rows > give the Hero exactly the stats the sim gives an Ascended Hero R4 in its |
| fix:CV-plural-check-removed | KILLED | KILLED | content registry > refuses an empty or blank plural (messages name more than one troop wit |
| h1:N7-day0 | KILLED | KILLED | the monthly summon (N7) > summons only on the first day of a month, never on day 0 |
| h1:N7-transit | KILLED | KILLED | the monthly summon (N7) > summons nothing while she is in transit |
| h1:N7-foreign-dominion | KILLED | KILLED | the monthly summon (N7) > summons nothing in foreign, neutral, or zero-strength dominion |
| h1:N7-strength-ge0 | KILLED | KILLED | the monthly summon (N7) > summons nothing in foreign, neutral, or zero-strength dominion |
| h1:N7-strength-ge2 | KILLED | KILLED | the monthly summon (N7) > adds 2 Wolves to the Mother on day 30 at strength 1, with a mess |
| h1:N7-cap-own-only | KILLED | KILLED | the monthly summon (N7) > counts the nation’s whole stock against the cap: handed-off wolv |
| h1:N7-no-leadership | KILLED | KILLED | the monthly summon (N7) > never summons past her free leadership |
| h1:N7-count-is-cap | KILLED | KILLED | the monthly summon (N7) > adds 2 Wolves to the Mother on day 30 at strength 1, with a mess |
| h1:N7-stock-any-owner | KILLED | KILLED | the monthly summon (N7) > adds 2 Wolves to the Mother on day 30 at strength 1, with a mess |
| h1:N7-stock-skip-garrison | KILLED | KILLED | the monthly summon (N7) > counts wolves held by the capital’s garrison holder against the  |
| h1:N7-push-not-merge | KILLED | KILLED | the monthly summon (N7) > joins the wolves to her one squad month after month |
| h1:N7-plural-fallback | KILLED | KILLED | the monthly summon (N7) > adds 2 Wolves to the Mother on day 30 at strength 1, with a mess |
| h1:N7-eliminated-skip | SURVIVED (base re-run alone; first base run "killed" it only by the tick 2 ms timing test under load) | SURVIVED |  |
| h1:N7-tick-order | KILLED | KILLED | the monthly summon (N7) > runs in tick step 3 after the pretenders settle: a dormant Mothe |
| h1:N7-tick-removed | KILLED | KILLED | the monthly summon (N7) > runs in tick step 3 after the pretenders settle: a dormant Mothe |
| h1:N8-any-dominion-nation | KILLED | KILLED | reform after death (N8) > counts dominion at strength 1 where it dies; in foreign or neutr |
| h1:N8-strength-ge0 | KILLED | KILLED | reform after death (N8) > counts dominion at strength 1 where it dies; in foreign or neutr |
| h1:N8-capital-not-death-province | KILLED | KILLED | reform after death (N8) > counts dominion at strength 1 where it dies; in foreign or neutr |
| h1:N8-every-chassis-reforms | KILLED | KILLED | reform after death (N8) > reforms only the chassis that has it: a Titan dying at home is g |
| h1:N8-returnday-absolute | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-no-message | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-rise-a-day-late | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-no-wait | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-returnday-not-cleared | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-rise-message-is-arrival | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h1:N8-eliminate-keeps-returnday | KILLED | KILLED | reform after death (N8) > falling in the storm of its last fort, is promised a return and  |
| h1:N8-eliminate-no-null-id | KILLED | KILLED | reform after death (N8) > standing when its nation falls, dies with it for good: no promis |
| h1:N8-eliminate-no-dead | KILLED | KILLED | reform after death (N8) > standing when its nation falls, dies with it for good: no promis |
| h1:CV-summon-leadership-ge | KILLED | KILLED | content validation of chassis > reports bad reform days, a monthly summon past leadership, |
| h1:CV-summon-leadership-removed | KILLED | KILLED | content validation of chassis > reports bad reform days, a monthly summon past leadership, |
| h1:CV-reform-days-ge0 | KILLED | KILLED | content validation of chassis > reports bad reform days, a monthly summon past leadership, |
| h1:CV-reform-integer | KILLED | KILLED | content validation of chassis > reports bad reform days, a monthly summon past leadership, |
| h1:CV-idol-one-way | KILLED | KILLED | content validation of chassis > reports bad reform days, a monthly summon past leadership, |
| h1:CV-plural-check-removed | KILLED | KILLED | content registry > refuses an empty or blank plural (messages name more than one troop wit |
| h1:CV-presets-per-nation-lt | KILLED | KILLED | content validation of presets > reports a nation without exactly six presets |
| h1:CT-phoenix-reform-60 | KILLED | KILLED | pretender chassis > carry the optional fields only where A.4 gives them |
| h1:CT-idol-summon-cap-18 | KILLED | KILLED | pretender chassis > carry the optional fields only where A.4 gives them |
| h1:CT-phoenix-no-ap | KILLED | KILLED | pretender bodies > bring no pips or holy of their own and carry the docs/09 weapons |
| h1:CT-wolf-plural-removed | KILLED | KILLED | content registry > refuses an empty or blank plural (messages name more than one troop wit |
| h1:CT-hierophant-role-leader | BAD-PATTERN(2) | BAD-PATTERN(2) |  |
| h1:PB-presets-per-nation-7 | KILLED | KILLED | the abilities catalog > passes content validation, each ability on the one body A.4 gives  |
| h1:PB-huntlord-dominion-5 | KILLED | KILLED | the Phase 6b.3 presets (build spec A.8) > carry the A.8 designs: pips, dominion, scales, a |
| h1:PB-dreadidol-blessing | KILLED | KILLED | the Phase 6b.3 presets (build spec A.8) > carry the A.8 designs: pips, dominion, scales, a |
| h1:PB-findPreset-first | KILLED | KILLED | --presets > refuses a malformed pair, an unknown nation or preset, a foreign preset, or a  |
| h1:AI-mage-always-researcher | KILLED | KILLED | groups > take a fighter pretender along from AI.pretenderJoinDay |
| h1:AI-raider-always-hidden | KILLED | KILLED | groups > take a fighter pretender along from AI.pretenderJoinDay |
| h1:AI-idol-by-body | KILLED | KILLED | roleOf > reads the chassis’s role tag, not the body: a patched role changes the work |
| h1:AI-no-chassis-default-ritualist | SURVIVED | SURVIVED |  |
| h1:AI-keep-bound-any-role | BAD-PATTERN(0) | BAD-PATTERN(0) |  |
| h1:AI-keep-nothing | BAD-PATTERN(0) | BAD-PATTERN(0) |  |
| h1:AI-join-day-gt | KILLED | KILLED | planPretender > brings a hidden body, and a fighter before AI.pretenderJoinDay, home to th |
| h1:AI-groups-not-hidden | KILLED | KILLED | groups > take a fighter pretender along from AI.pretenderJoinDay |
| h1:AI-casters-not-researcher | KILLED | KILLED | planRituals casters > casts with any idol pretender, by its role: the Cinder Idol too |
| h1:MX-band-min-strict | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| h1:MX-band-max-strict | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| h1:MX-refused-zero | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| h1:MX-table-no-NO | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| h1:MX-share-of-decided | KILLED | KILLED | --matrix > tallies a pairing: wins by nation, the preset’s share, and the 35% to 65% band |
| h1:MX-one-order | KILLED | KILLED | --matrix > plays every seed in both nation orders |
| h1:MX-no-repeat-check | KILLED | KILLED | --presets > refuses a malformed pair, an unknown nation or preset, a foreign preset, or a  |
| h1:MX-baseline-dropped | KILLED | KILLED | --matrix > pairs the defaults first, then every other preset against the opposing default |
| h1:MATCH-preset-any-nation | KILLED | KILLED | --presets > replace only their own nation’s default, the order still alternating by game |
| h1:DU-immobile-attacks | KILLED | KILLED | the A.10 duels > livingMonolith stays within 15 points of its measured cells |
| h1:DU-avatar-no-bonus | KILLED | KILLED | the Avatar rows > give the Hero exactly the stats the sim gives an Ascended Hero R4 in its |
| h1:DU-hills-16-HI | KILLED | KILLED | the A.10 duels > greatWyrm stays within 15 points of its measured cells |
| h1:DU-plains-14-LI | KILLED | KILLED | the A.10 duels > ashColossus stays within 15 points of its measured cells |
| h1:DU-calib-seeds-100 | KILLED | KILLED | the A.11 AI power calibration > titan has the aiPower `sim:duel --calibrate` writes |
| h1:DU-search-cap-64 | SURVIVED | SURVIVED |  |
| h1:DU-hpLeft-unscaled | SURVIVED | SURVIVED |  |
| h1:DU-mother-led-bound | KILLED | KILLED | the A.10 duels > mother12Led stays within 15 points of its measured cells |
| h1:SC-aivai-matrix-presets-allowed | SURVIVED | BAD-PATTERN(0) |  |
| h1:SC-aivai-presets-ignored | SURVIVED | BAD-PATTERN(0) |  |
| h1:SC-duel-calibrate-no-write | SURVIVED | SURVIVED |  |
| h2:CT-hierophant-role-leader | KILLED | KILLED | pretender chassis > carry the realm, role, new-color price and AI power of the build spec  |
| h2:N8-rise-message-no-province | KILLED | KILLED | reform after death (N8) > waits 90 days after dying in its own dominion, then rises at the |
| h2:N7-zero-n | KILLED | KILLED | the monthly summon (N7) > counts the nation’s whole stock against the cap: handed-off wolv |
| h2:AI-bound-idol-only | BAD-PATTERN(0) | BAD-PATTERN(0) |  |
| sc:SC-aivai-matrix-presets-allowed (re-targeted to the merged aivai.ts) | SURVIVED (original pattern) | SURVIVED | |
| sc:SC-aivai-presets-ignored (re-targeted to the merged aivai.ts) | SURVIVED (original pattern) | SURVIVED | |

Mutants whose tests were changed in step B: the two changed matrix tests ("leave the default
runner exactly as it was without them", "plays each Phase 6b.3 preset's first matrix games for a
year ...") kill h1:MATCH-preset-any-nation on c6d0e4c and still kill it on B (the new wild-map
matrix test kills it too). No fix-list mutant names those tests (MX-* run `-t tallies`,
PB-findPreset-first `-t refuses`, both unchanged); all 17 fix-list mutants KILLED on both.
Summary: base 83 killed (84 in the first base run, one by a tick timing flake), B 83 killed;
identical status for every mutant once the flake is re-run; 7 survive on both (N7-eliminated-skip,
AI-no-chassis-default-ritualist, DU-search-cap-64, DU-hpLeft-unscaled, SC-duel-calibrate-no-write,
SC-aivai x2: the same survivors as the original 6b.3 run), 4 no longer match code on both (pre-F3
patterns and a pattern with 2 matches).

Gate B (second run, load ~3.5): 2195 tests in 126 files pass. Commit B = 443ccf0.

## Step C
- 5b3c505: conflicts docs/06 (ai/ layout: kept 6b.3's matrix.ts line, then the present/ block;
  scripts/: merged to aivai.ts (--presets, --matrix, --wilds), art-intake.ts, duel.ts,
  golden-battle.ts) and docs/09-balance (UI rows dated 2026-10-21 placed before 6b.3's
  2026-10-22 rows). Gate: first run 3 timeouts (generate.test.ts medium-3, wilds.large 4-nation
  seeds 1 and 2; load ~6.5 from other jobs); both files pass alone; second full run 2195 pass.
  Commit 1e7798f (message unchanged).
- 189a587: conflicts docs/09-balance (kept HEAD's runner/matrix rows, applied 189a587's
  balance-search wording) and docs/PROGRESS (HEAD's Joined/Tests bullets with 189a587's "landed
  early" wording). No literal "Merging with Phase 6b.3 ... will need merging" sentence exists in
  189a587; updated the "For merging later tracks over Phase 1b" note to say how 6b.3 was joined,
  and the reconcile section. Gate: first run 6 timing failures under load ~8
  (generate.perf, generate.test, rerun, determinism, siege, tick); each passes alone; second
  full run 2195 pass. Commit 58229bb.

## Final
- Gate on 58229bb: 2195 tests in 126 files pass (179 s).
- Runner: 17/3/0, 23.6 months, 0 refused; per-game identical to step B's run.
- golden.json byte-identical to c6d0e4c.
- 400 lines: only tests/ai/match.test.ts is over (435; 434 at ec9a907 and c6d0e4c; +1 from
  commit A's wilds assertion). Not split (pre-existing).
- Files changed only by 1b equal 189a587 except tests/ai/match.wilds.test.ts (new signature +
  presets test); files changed only by 6b.3 equal c6d0e4c except src/ai/matrix.ts,
  tests/ai/matrix.test.ts, tests/content/presets.test.ts, tests/sim/pretender.reform.test.ts.
- git status clean.

## Review fixes (F1-F4, T1-T3, DOC-1 to DOC-5)
- A (07ccf4c): reform save test renamed "with no save step of its own"; A's PROGRESS join bullet says so.
- B (e7a35e5): presets.test.ts new wild-map determinism test for the six new presets (comment fixed);
  pretender.reform.test.ts builds its v2/v3 saves from phoenixGame('Ysolde', false) (v2 also drops
  map.wilds; v3 lifts to the same return day and hash); docs/08 runner-without-presets sentence;
  PROGRESS: 6b.3 review-fix parenthesis labeled without wilds, "Four changed", "five and two",
  reform moved out of "checked and unchanged", Docs sub-bullet, 2196 tests, timing known issue.
- D (1cd587b): 09-balance rows AI expansion reach and AI gold reserve labeled and re-measured
  (fix/doc23.ts: off 13/12/13 and 8/5/6 days; on 12/12/10 and 10/7/10 days); PROGRESS D bullet.
- Gate on 1cd587b: 2196 tests in 126 files pass (load ~8). Runner 17/3/0, 23.6 months, 0 refused,
  per game identical to runnerFinal.out; --wilds off 10/9/1, 26.8 months, identical to runnerB-off.out.
