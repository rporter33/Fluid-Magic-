# Romance of the Three Kingdoms as a template for Fluid Magic

> Status: proposed, 2026-10-23, pending the owner's answers to section 11. Lands after Phases 8 and 9; nothing here is built.

Analysis against branch `claude/gifted-meitner-v8l3qv` (53 commits, Phases 0 to 7 plus 1b, 6b and
10 S1 done, 2207 tests). Nothing in the repository was changed. Goal: more complexity and more
replayability, taken from what Koei's Romance of the Three Kingdoms (RTK) series on PC does well.

## 1. What RTK does that a Dominions-like does not

Dominions and Fluid Magic are about *armies and magic*. RTK is about *people and places*. Its
replayability comes from five things, and each has a clean landing spot in this codebase:

| RTK pillar | What it is in RTK | Why it replays | Where it lands in Fluid Magic |
|---|---|---|---|
| Officers | Hundreds of named people with five stats, skills, loyalty, relationships; captured, recruited, executed, defecting | Every game assembles a different cast; stories emerge without scripting | Commanders already have portraits (8 faces per type), a personal-name design, items, abilities. They lack stats of their own, loyalty, and a fate other than death |
| Cities | Each city is a development project (farms, markets, barracks, walls) run by assigned officers whose stats set the output | Provinces become projects with a hand on the wheel, not just a tax slider | Provinces have pop, unrest, tax, PD, three buildings, settlement tiers drawn on the map. The tier is art today; it can become the rule |
| Court | Ranks, official posts, a ruler's prestige that caps how many officers and armies can be commanded | Promotion is a decision; growth is gated by legitimacy, not only gold | Nothing yet. The post system is the cheapest anti-snowball lever the game can add |
| Diplomacy | Alliances, ceasefires, tribute, marriage, coalitions against the leader | Three-faction games are never the same twice; the leader gets ganged up on | Nothing yet. All nations are at war from day 1. The known issue "every runner game ends by Wellsprings at ~22 months, no eliminations" is a diplomacy problem as much as a balance one |
| Scenarios and ploys | Same map, different start dates and situations; stratagems (sow discord, incite revolt), duels, debates | Choosing a scenario is choosing a different game | The runner already has a preset matrix and `GameSetup`; a scenario is a setup template applied to a generated map. Ploys are ritual primitives in Blue and Black clothing |

The rest of this document takes each pillar in turn, says what exists on the branch, what to add,
and how it stays inside the project's non-negotiables (pure sim, `state.rng` only, content as data,
every command through `validate` then `apply`, AI uses the player's commands, tests mirror `src`).

## 2. What the branch already gives you

These are facts from the code and design records, and they matter because the officer layer is
mostly *already half built* by the art and item tracks:

- `CommanderState` carries `name`, `hp`, `pips`, `holy`, `carriedMana`, `squads`, `order`, `script`.
  The name is the unit definition's name (`commanders.ts:136`), so two Ash Chieftains are identical
  except for id. Personal names are designed as an M1-should (`war-table.md` 5.8) and portraits are
  picked by rendezvous on `seed:commanderId` (5.10), so the identity hooks already exist.
- `units-and-items.md` Part B is a shared abilities catalog with validation, and Part C gives every
  commander a paper doll with item slots, spoils on death (C.8), and a forge. That is the "skills
  and treasures" half of an RTK officer.
- `pretender-and-magic.md` B.6 gives the god a name, epithet, title and myth. The same identity
  block can be reused for officers.
- Independent Captains come in four outfits keyed by terrain (levy, hunter, mountaineer, reedman),
  12 faces each. These are the RTK "free officers found in the countryside" waiting to be hired.
- The war table sits in a tavern. RTK's "search for officers" happens in cities; here the tavern is
  literally on screen. A free-officer board in the tavern needs no new metaphor.
- Provinces: `pop`, `unrest`, `taxRate`, `pd`, `buildings`, `construction`, `materials`,
  `recruitQueue`, `garrison`, `dominion`, `siege`. Settlement tiers T1 to T5 come from population
  and are drawn on the map (`war-table.md` 4.2) with landmarks for fort, temple and lab.
- `NationState` has `stats`, `research`, `unpaidDays`, `godless`, `aiMemory`. There is no relation
  to any other nation, and no roster beyond "commanders whose owner is me".
- The AI (`src/ai`) is step-based and role-based (`roles.ts`), so new behaviors are new steps that
  read content numbers from `src/content/ai.ts`.
- Known issues the design should answer: Wellspring victory with no hold period ends every AI game;
  Hills supply; free High tax; strong imprisoned builds; hidden commanders push dominion.

## 3. Officers: named commanders with stats, loyalty and a fate

### 3.1 Stats of their own

RTK's five stats are Leadership, War, Intelligence, Politics, Charisma. Fluid Magic needs its own
five, each already wired to a system:

| Officer stat | Range | Drives | Existing hook |
|---|---|---|---|
| Command | 10 to 100 | Troops led (replaces the flat unit `leadership`), morale of led squads | `leadership`, morale checks |
| Valor | 1 to 20 | The commander's own `att`, `def`, `str` offsets, duel odds | battle resolver |
| Lore | 1 to 20 | Research points per month, spell power, ploy contests | `research.ts`, N3 spell power |
| Stewardship | 1 to 20 | Governor output (section 4), build time, materials | `economy.ts`, `buildings.ts` |
| Presence | 1 to 20 | Preach checks, unrest decay, recruiting prisoners and free officers, loyalty of subordinates | `dominion.ts`, `unrest.ts` |

Each unit definition gets a *range* per stat in content (`src/content/units/*.ts`), and
recruitment rolls inside the range from `state.rng`, the way the adept tier already rolls a third
pip. The unit tables keep their meaning (an Ash Chieftain is still a leader, a Sapling Druid a
researcher), but no two are the same. A content test asserts every range is inside the global
bounds and every recruitable commander has all five.

Experience: the docs forbid pips from experience in M1. Keep that. Instead, a commander gains
*rank* from events (battles survived, provinces held, research levels contributed) and a rank
step raises Command by a fixed amount and unlocks one trait pick from a short list. That is RTK's
"level up" without touching the magic system.

### 3.2 Traits and relationships

Traits are abilities from the existing catalog (Part B) with an `officer` placement: Fearless,
Steady, Greedy, Zealot, Scholar, Wanderer, Cruel, Beloved. A trait is data, validated like any
ability, shown as a chip on the card. Six to ten traits are enough; RTK's dozens are noise.

Relationships are the cheapest story generator RTK has: sworn siblings, rivals, grudges. Keep
one typed edge list on `NationState` (or a global `bonds: Bond[]` on `GameState`), created by
events: two commanders who win a battle together gain a *comrade* bond (+1 morale when in the same
province); a commander whose comrade was executed by a nation gains a *grudge* against it (never
defects to it, +2 attack against it); a commander passed over for a post the player gave another
gains a *rival* (loyalty −5 while the rival holds the post). The message feed already exists to
tell these stories.

### 3.3 Loyalty

`loyalty: 0..100` on `CommanderState`, settled monthly in step 5 of `advance`, from content weights:

- pay: `unpaidDays` already exists; unpaid months drain loyalty;
- alignment: each officer has a color affinity (rolled at recruitment, biased to the nation's
  color); the nation's scales and the dominion in the officer's province move loyalty toward or
  away. A Red zealot serving a nation drifting to Order is unhappy. This ties officers to the
  pretender design, which is the game's signature decision;
- treatment: a title (section 5) adds a flat bonus; executed prisoners cost loyalty with everyone
  who is not Cruel; released prisoners earn it with the Beloved;
- success: victories under the officer's command raise it; a lost battle where the officer routed
  lowers it.

Below 30 an officer is *disloyal*: they refuse Pillage orders unless Cruel, and a hostile ploy
(section 6) can turn them. Below 10 they *desert* at the month's end: the commander leaves with
no troops (squads fall to the garrison holder or the nearest friendly commander, reusing the
heir logic from `apply.ts`) and joins the free-officer pool. Desertion never takes an army with
it; that keeps it a story, not a disaster.

### 3.4 Capture, prisoners, and what you do with them

Today a commander at 0 HP dies and its troops go to an heir. RTK's best moments are what happens
to the loser's officers afterward. Proposal:

- A commander brought to 0 HP in a battle its side *loses* is captured instead of killed, with a
  probability from content (base 60%, +Valor on the captor's side, −Wanderer). In a battle its
  side wins, 0 HP still means death. Sieges that fall capture everyone inside.
- Prisoners live on `NationState.prisoners: PrisonerState[]` with `{ commander, since, offers }`.
  Their `CommanderState` stays in `state.commanders` with `owner` unchanged and a new
  `held: NationId | null`, so items, portrait and name survive.
- Four commands, all through `validate` and `apply`: `recruitPrisoner` (contest: captor's
  Presence plus DRN against the prisoner's loyalty plus DRN; a failed try adds to `offers` and the
  next try is harder), `ransomPrisoner` (the owner pays gold set by rank; the AI accepts by its
  treasury), `releasePrisoner` (unrest −, loyalty of own Beloved +, the released officer returns
  home with a grudge or gratitude), `executePrisoner` (the only way to be rid of a hero; enemy
  loyalty against you drops, your own non-Cruel officers lose loyalty, Dread scale softens it).
- The AI step `prisoners` runs on planning days with personality weights: Cinder Horde ransoms and
  executes, Thornwood releases and recruits.

This single system produces named villains and reunions, and it reuses the heir logic, the
message feed, and the portraits.

### 3.5 Where new officers come from

RTK's officer supply is the countryside and other factions' losses. Fluid Magic has three sources
already in the code or art:

1. **Independent Captains.** When an independent province falls, its captain becomes a free
   officer for the taker (recruit contest as above, cheaper). Four outfits mean four looks.
2. **The tavern board.** A free-officer pool per game, seeded at creation from the syllable name
   generator and the same stat ranges, with a few *legends* (section 7). Officers appear at owned
   provinces with a lab or temple at a monthly rate scaled by Presence of the governor and the
   province's population. A `seekOfficers` order for a commander in a province spends days and
   draws from the pool against the commander's Presence. The UI is a tavern panel on the war
   table; the AI treats it as a cheaper recruit when its leader quota is short.
3. **Defection**, by ploy only (section 6). Never spontaneous, so the player is never robbed
   without an enemy mage having done something visible in the message feed.

### 3.6 State and tests

`CommanderState` gains `stats`, `traits`, `loyalty`, `rank`, `affinity`, `held`.
`NationState` gains `prisoners`, `bonds`, `prestige`, `posts`. `GameState` gains `freeOfficers`.
One `STATE_VERSION` step with a migration that gives existing commanders the midpoint of their
unit's ranges. Tests: every stat change in `tests/sim/officers/*.test.ts`, capture odds against a
closed formula over 500 seeds, desertion never moves troops, prisoners survive save and load,
the AI never leaves a prisoner unhandled for more than 60 days, determinism hash with officers on.

## 4. Cities: development and governors

### 4.1 Make the settlement tier a rule

The map already draws hamlets, villages, towns and cities from population. RTK cities have a
fixed number of facility slots. Combine them: a province has `slots = tier` development slots
(T1 hamlet 1, T5 city 5; capitals +1), and *developments* are buildings in content with
`terrain` gates and `slot: true`:

| Development | Gold / materials / days | Terrain | Effect per month |
|---|---|---|---|
| Farms | 150 / 0 / 30 | Plains, Farmland | supply +20%, pop growth +0.1% |
| Market | 200 / 0 / 30 | any, pop ≥ 2000 | gold +15% |
| Mine or Lumber camp | 100 / 50 / 45 | Hills, Mountains / Forest | materials +15 (fort-local rule unchanged) |
| Shrine | 100 / 0 / 20 | any | +1 dominion check for the owner's dominating temple nearby, unrest −1 |
| Barracks | 250 / 50 / 40 | fort province | recruit time −15%, PD cost −20% |
| Granary | 150 / 25 / 30 | any | supply cap for besieged forts, starvation delayed 15 days |

Numbers are placeholders for `docs/09-balance.md`. Temple, Lab and Fort stay as they are (not
slot-bound). Developments are built with the existing `build` command and `Build` order, so
nothing new in the command grammar; `BUILDINGS` grows and `buildings: BuildingId[]` on the
province holds them. The settlement art gains one landmark per development, which the art track
already has a slot system for (4.2 "Landmarks at fixed seeded slots").

Why this is RTK and not just "more buildings": the slot count comes from population, and
population is the game's root number. Growing a town unlocks projects; Rot shrinks the slots;
pillage can destroy a development (RTK fire attacks on facilities). Where to invest becomes a
map-wide decision.

### 4.2 Governors

A commander with the order `govern` in an owned province applies its Stewardship and Presence:
materials and gold +1% per Stewardship point, unrest decay +0.25 per Presence point, build time
−1% per Stewardship point. A governor's reach is the province plus the fort's material
catchment (the neighbors that already feed it materials), which makes the M2 fort rule into a
*prefecture* for free. A governor in a province with a Wellspring also shortens claim time.

This gives Stewardship officers a job the way RTK gives Politics officers one, and it gives the
AI's `economy.ts` step an obvious action: park the best Stewardship officer in the capital, the
next in the richest fort. Commanders governing are absent from battle like researchers are.

### 4.3 Public order as a threat

RTK cities with low order spawn bandits. Here unrest above 60 for 3 months in a province with
no governor spawns a rebel force from the terrain's independent pool, sized by population,
with an Independent Captain who can later be recruited. Thornwood's Growth provinces almost never
see it; Cinder Horde on High tax everywhere will. This turns the "free High tax" known issue
into a decision rather than a nerf.

## 5. Court: posts, prestige and the army cap

RTK XIV's officials and titles are the lever that stops a snowball: more land needs more
legitimacy before it can be used. For Fluid Magic:

- `prestige` on `NationState`: provinces + 3 per Wellspring claimed + 1 per battle won − 2 per
  capital lost, settled monthly. Its thresholds open *posts*.
- Posts are content: Marshal (every army in the Marshal's province +10 Command), Chancellor
  (gold +10%), Archmage (research +15%), High Priest (+1 temple check), Spymaster (ploys cost
  −25%, enemy ploys harder), Warden of the Marches (PD cost −25%). One officer per post, assigned
  by `assignPost`, with the loyalty bonus and a salary.
- Army cap: the number of commanders that may hold troops outside a fort province is
  `2 + floor(prestige / 5)`. Over the cap, the newest field commander cannot take a `move` into
  an unowned province (validation refuses it with a message that names the cap). This is the
  realtime translation of RTK's "commands per turn", and it is a natural brake on the Wellspring
  rush: you cannot march on three Wellsprings with five armies at month 8.

The AI step `court` fills posts by stats and keeps the field count at the cap. Tests: posts
exclusive, cap enforced in `validate` only (never in `apply` silently), prestige deterministic.

## 6. Diplomacy, coalitions and ploys

### 6.1 Relations

`relations: Record<NationId, Relation>` on each nation, where `Relation = { attitude: -100..100,
state: 'war' | 'truce' | 'alliance', until: day | null }`. Attitude is settled monthly from
content weights:

- the color wheel: allied colors +10 base, enemy colors −10 (two-color nations average);
- scales: each shared pole +2, each opposed pole −2;
- borders: −1 per shared border province, −5 per battle in the last 6 months;
- the leader: −10 for every Wellspring held beyond `wellspringsToWin / 2` (this is the coalition
  rule; it makes every AI turn on the front-runner);
- Dread: −3 to every nation whose land your dominion touches; Sanctity +2 with allies.

Commands: `proposeTruce(months)`, `proposeAlliance`, `demandTribute(gold)`, `giftMana(color,
amount)`, `breakTreaty`. The AI accepts by attitude and by threat (`assess.ts` already sizes up
power). A truce makes `validate` refuse a `move` into the other's provinces; an alliance shares
vision (`visibility.ts`) and lets allied armies share a province without fighting
(`conflict.ts` already orders "fight a third nation first", so this is one branch). Breaking a
treaty costs attitude with everyone and loyalty with Steady officers.

Three- and four-nation games become different games: who allies against whom depends on the
pretender designs, which is where the game wants the player's identity to matter.

### 6.2 Ploys

RTK ploys are rituals with a target commander or a target nation. They fit the ritual pipeline
exactly (`rituals.ts`, `ritualEffects.ts`, payment, days, a caster in a lab) and give Blue and
Black their M2 identity:

| Ploy (ritual) | Color | Primitive | Contest |
|---|---|---|---|
| Whispers of Doubt | U | `officerLoyalty { delta: -20 }` on a visible enemy commander | caster Lore + DRN vs target loyalty / 5 + Spymaster bonus |
| Turn the Cloak | U/B | `defect` on a disloyal (< 30) enemy commander: joins the caster's nation at the nearest friendly province | as above, harder |
| Incite the Mob | B | `inciteRevolt` on an enemy province: unrest +30, rebels if above 60 | caster Lore vs governor Presence |
| False Banners | U | `falseSighting`: a phantom army appears in the enemy's fog for 1 month | none; detection by scouts |
| Blood Price | B | `bribe`: pays gold to raise a prisoner's recruit odds | none |

Each is a few lines of primitive code plus data. Red and Green get none, which is correct for the
color pie, and gives the M2 nations something RTK-shaped instead of only more spells.

### 6.3 Duels

A `challenge` script slot: before round 1, if both sides have a commander with the Duelist trait
and either side scripted Challenge, the two fight a one-on-one with the resolver's own melee
rules until one is at half HP. The loser's side takes a morale shock (`moraleShock` primitive,
already implemented); the winner gains rank. The per-blow detail sink (Phase 10 S1) already
records every blow, so the replay shows the duel for free, and the overhead battle stage can
hold it at centre.

## 7. Scenarios, legends and the event deck

### 7.1 Scenario templates

RTK's replay engine is the scenario list. The map is procedural here, so a scenario is a
*template over the generated map*, applied in `createGame` after placement:

| Scenario | Setup | What it asks of the player |
|---|---|---|
| Open Field | today's default | symmetric expansion |
| The Fallen Throne | one nation starts with 10 provinces, loyalty 40 everywhere, unrest 30, a Dormant god | hold a crumbling realm, or carve one from it |
| Crusade | all AIs start allied against the player, who holds a Wellspring | survive a coalition |
| Godless Spring | every pretender Imprisoned; Wellsprings guarded at 50 | a long, mortal-led early game |
| The Marches | capitals 4 apart, wilds doubled, forts allowed in M2 | a siege game |
| Rival Houses | two nations of the same color, legends split between them | mirror match with different officers |

A scenario is data (`src/content/scenarios.ts`): ownership spread rules, starting relations,
loyalty and unrest offsets, god awakening overrides, guard strength, free-officer pool size, and
a one-paragraph situation for the New Game screen. The runner's `--presets` and `--matrix` flags
grow a `--scenario` flag, and the balance checklist gains "each scenario ends by a different
reason in at least 1 of 20 games".

### 7.2 Legends

Each game seeds 6 to 10 *legend* officers into the free pool and the independents: fixed names
from a content list, outsized single stats, one unique trait, a line of lore. They are RTK's
Lü Bu and Zhuge Liang without history: the generator picks which legends exist and where they
start, so "who did I find in the hills this game" differs every seed. Legends have their own
portrait sets (the four captain outfits already give a style to copy) and the message feed
announces where they were last seen, so hunting them is a goal. The content test checks every
legend's stats sit at or above the top of a normal range, and that no two legends share a trait.

### 7.3 Events

`docs/05` stores a Turmoil event chance and defers random events to M2. RTK's historical events
become a deterministic *deck*: each event has a condition (month range, a scale, a province
state, a relation state) and a weight; on the last day of each month, each nation draws from the
deck with `state.rng` against the Turmoil chance. Events are rituals without a caster: they use
the ritual primitives (`provincePop`, `provinceUnrest`, `summonToProvince`, `officerLoyalty`,
`dominionPush`) plus `offerOfficer` and `relationShift`. Examples: Plague in the Lowlands,
A Stranger at the Tavern, The Marshal's Quarrel (two officers gain a rival bond, choose one to
favor), Omen at the Wellspring. Twenty events are enough for M2; the deck is content, validated.

## 8. How it stays inside the architecture

- **Purity.** Every roll uses `state.rng`; every monthly settle runs in `advance` step 5 in a
  fixed order (loyalty, prestige, relations, events), so the determinism test and the 365-day
  replay hash keep working. The purity guard needs no change.
- **Content.** Stat ranges, traits, posts, developments, relation weights, ploys, scenarios,
  legends and events are all under `src/content/**`, each with a row in `tests/content`. The sim
  reads no number of its own, as today.
- **Commands.** New commands: `assignPost`, `recruitPrisoner`, `ransomPrisoner`,
  `releasePrisoner`, `executePrisoner`, `proposeTruce`, `proposeAlliance`, `demandTribute`,
  `giftMana` (exists, reuse with a nation target), `breakTreaty`, `seekOfficers` (an order), `govern`
  (an order), `challenge` (a script kind). Each is validated and the AI uses it. The one new
  validation that touches an old command is the army cap on `move`.
- **AI.** New steps in `src/ai`: `court`, `prisoners`, `diplomacy`, `governors`, `ploys`, with
  every number in `src/content/ai.ts` and personality weights in the nation def (`mercy`, `guile`,
  `pride` join `aggression`, `expansion`, `research`, `pillage`).
- **Save.** One `STATE_VERSION` step per phase with a migration, as 1b and 6b did.
- **UI.** The layered UI spec already has an outliner and a Codex. The additions are a Court
  modal (officer list with stats, posts, prisoners; RTK's officer screen), a tavern board on the
  war table, a relations strip in the top bar, and loyalty and stats on the commander card. None
  of this needs to exist before Phase 9, which is also when it can first be playtested.

## 9. What not to take from RTK

- Hundreds of officers. A 45 to 75 minute match wants 10 to 30 named people per nation. Keep
  troops faceless and only commanders named.
- Aging and death by old age. The match is 2 to 6 years. Drop it.
- Per-turn command points. Realtime already rations attention; the army cap does the rest.
- The city facility grid (RTK XI). The layered UI rule is "complexity under smart menus";
  slot counts from population give the decision without a grid to tend.
- History. Legends are procedural so the game never depends on a reader knowing the novel.

## 10. Order of work and what each buys

Ranked by replayability per unit of effort. None should start before Phase 8 and 9 make the game
playable by a person, because every one of them needs a screen and a playtest.

1. **Officers with stats, loyalty, capture and prisoners** (section 3). The portraits, names,
   items and abilities on the branch are already most of the cost. This is the story engine.
2. **Relations with the coalition rule** (6.1). Answers the Wellspring snowball directly and makes
   every 3 or 4 nation game a different alliance map. Small in code: one record, five commands,
   two validation branches.
3. **Developments and governors** (section 4). Turns the settlement art into play and gives
   non-fighters a job. Mostly content plus one order.
4. **Court posts, prestige and the army cap** (section 5). The brake. Cheap, but it changes the AI's
   expansion step, so it needs the runner to re-measure months to victory.
5. **Scenarios and legends** (7.1, 7.2). Pure replay value; data plus a New Game screen page and a
   runner flag.
6. **Ploys, duels and the event deck** (6.2, 6.3, 7.3). Ride on M2's Blue and Black.

How to know it worked, in the runner (`npm run sim:aivai`), per scenario over 20 seeds: at least
three distinct victory reasons across the matrix; at least one elimination in 20; months to
victory with a spread of 15 or more between fastest and slowest; at least one capture, one
ransom or recruit, and one treaty per game on average; no AI refusal. Those six lines belong in
`docs/09-balance.md`'s checklist beside the existing items.

## 11. Open questions for the owner

Defaults in bold; the build would follow them.

1. Do officers keep their stats when they change nation by capture or defection? **Yes, stats and
   items stay; loyalty resets to 40.**
2. Does the player's pretender hold a post? **No; the god is above the court. The prophet may hold
   High Priest.**
3. Are truces breakable at once, or do they run their term? **Breakable, at the attitude cost in
   6.1, so the player can always act.**
4. Should the army cap also bind the AI on Easy? **Yes; one rule for everyone, as the docs demand
   for commands.**
5. Which comes first for the M2 nations: ploys for Blue and Black, or their spells as written?
   **Spells first, ploys as the second content pass; the primitives land with the officer phase.**
