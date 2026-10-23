# Romance of the Three Kingdoms as a template for Fluid Magic

> Status: proposed, 2026-10-23, revised the same day to the thinner shape after a research pass
> and the owner's direction (`three-kingdoms.owner-answers.md`). Lands after Phases 8 and 9 as a
> prototype phase; nothing here is built. The owner has said the ideal full session will become
> 15 to 20 hours, while matches stay short for now; section 6 says what that unlocks later.

Analysis against branch `claude/gifted-meitner-v8l3qv` (Phases 0 to 7 plus 1b, 6b and 10 S1
done). Goal: more complexity and more replayability, taken from what the Romance of the Three
Kingdoms (RTK) series does well with officers, rulers and cities, in a game that does not
revolve around them.

## 0. The design in twelve lines

1. Fluid Magic is about armies and magic; RTK is about people and places. The pretender is
   already the ruler, and the god stays the game's one character. Officers orbit it.
2. Commanders become named people with five rolled stats and one or two traits. Troops stay
   faceless.
3. A commander brought down in a battle its side loses is captured, not killed. Prisoners can be
   recruited, ransomed or released. Each is one alert with buttons.
4. Duels between commanders fire automatically inside the battle resolver, as in RTK XIV, and
   show in the replay.
5. The god gains a rank, Ascendancy, from land, Wellsprings and victories. It caps the number of
   field armies and opens three posts whose effects scale with the holder's stats.
6. A commander may govern a fort province. Developments exist only at forts and reach the fort's
   material catchment, which is already a prefecture in the rules.
7. Officers propose actions to the player in the alerts ribbon, one click to accept. This is the
   realtime answer to RTK's council turn.
8. Bonds are two kinds only: comrade and grudge. They come from events and change battle numbers.
9. An officer's Presence adds dominion checks, so faith spread is about people.
10. Nothing is a meter the player tends. Everything changes on an event and is announced.
11. Loyalty states, the coalition rule, free officers in the tavern, legends and scenarios wait
    for a playtest of items 2 to 9.
12. Officer play, hundreds of officers, slots on every province, marriages and tribute, and aging
    stay out until the long session exists, and some stay out for good.

## 1. What the research found

| Game | Best officer, ruler and city features | Lesson for this game |
|---|---|---|
| RTK XIV | Search sends an officer to find free officers; Royal Rank grows with the force and gates civil service posts, which raise troop capacity and stipend; duels fire automatically in battle, and the loser may be wounded, captured or killed, with a sharp morale drop; land control spreads from cities by officer stats | Rank on the ruler, automatic duels, and spread by people all fit an auto-resolved, realtime game. Reviewers panned its pause-and-play campaign and AI |
| RTK XIII | Bonds between officers improve domestic work and fighting together; deep characterisation | Bonds work. The officer list became "a Chinese phonebook" and the tutorial a five-hour wall of text: breadth is the enemy |
| RTK XI | Facilities built on the shared map, which an enemy can burn; stats grow by doing tasks | Developments should be visible on the map and attackable. A facility grid per city is a turn-based luxury |
| RTK 8 Remake | Play as any officer; symbiotic and antagonistic relationships; 55 scenarios | Officer play is the series' most loved mode and would change this game's genre. Scenarios are the cheapest replay lever once there is a long session |
| Nobunaga's Ambition: Awakening | Grant land to retainers who develop it; traits stacking around a lord; officers propose actions to the ruler | Governors at forts, trait stacking around the god, and proposals are realtime-native. Reviewers called its staff management "satisfying and well-rounded" |
| Total War: Three Kingdoms | A satisfaction score per character that drops unless they are promoted; court posts; a spy system with defection | The precedent for bolting officers onto an army game. Players report too few posts for too many generals, promotions that raise salaries, and nine minister slots that "always do the same thing". A tended meter becomes a grind |

Sources are listed at the end.

## 2. Why the fit is hard, and where it is good

Three things make the fit harder than it looks:

- **Time scale.** RTK is turn-based, and a campaign runs 20 to 40 hours. Every turn is a council
  where officers are assigned to tasks. Fluid Magic runs in continuous time, and today's match is
  45 to 75 minutes. A meter that drifts monthly and needs feeding is Total War's satisfaction
  grind, and in realtime it is a nag the player pauses for. Everything officer-shaped must be
  event-driven and arrive in the alerts ribbon.
- **Who the character is.** The pretender is the ruler, and a stronger one than RTK's: its pips
  and scales shape the whole nation, the way a XIV ruler's ideals shape its government chart.
  Officers must not compete with the god. Officer play is out.
- **Scale of the map.** An RTK faction owns a handful of cities. Fluid Magic has 60 provinces,
  and most are not cities. The RTK city is the Fluid Magic fort province, and there are few of
  those (the capital in M1, a few more in M2). Anything per-province multiplies across the map.

Four things fit better than expected:

- **Battles are auto-resolved from scripts.** XIV's duels also run on their own. Capture after a
  lost battle, duels and bond bonuses live inside the resolver and the replay, where the game
  already spends its drama. The per-blow record (Phase 10 S1) shows them for free.
- **Dominion spread is XIV's land painting.** XIV spreads control from cities by officer stats;
  here faith spreads from temples and priests by checks. An officer's Presence adding checks
  makes spread about people at no cost to the design.
- **Fort-local materials already define a prefecture.** Nobunaga's "grant land to a retainer who
  develops it" is one order at a fort province, over the catchment the economy already computes.
- **Proposals solve attention instead of spending it.** An idle Greedy chieftain proposes a
  pillage; a Scholar proposes a research switch. One alert, one click.

What the branch already provides: portrait sets with eight faces per commander type picked by a
per-commander seed (`war-table.md` 5.10), personal names as an M1-should (5.8), item slots with
spoils on death (`units-and-items.md` C), a validated abilities catalog (B), the god's name,
epithet and myth (`pretender-and-magic.md` B.6), four Independent Captain outfits, settlement
tiers drawn from population (`war-table.md` 4.2), and a role-based AI (`src/ai/roles.ts`).
Commanders have `name`, `hp`, `pips`, `holy`, `carriedMana`, `squads`, `order`, `script` and
nothing of their own: the name is the unit's (`commanders.ts`).

## 3. Tier 1: the prototype phase

Built as one phase after Phases 8 and 9, then played before anything in Tier 2 starts.

### 3.1 Named commanders: stats and traits

Five stats, each wired to a system that exists:

| Stat | Range | Drives | Hook |
|---|---|---|---|
| Command | 10 to 100 | Troops led (replaces the unit's flat `leadership`), morale of led squads | `leadership`, morale checks |
| Valor | 1 to 20 | The commander's own att, def and str offsets; duel odds | battle resolver |
| Lore | 1 to 20 | Research points per month; spell power | `research.ts`, N3 spell power |
| Stewardship | 1 to 20 | Governor output; build time | `economy.ts`, `buildings.ts` |
| Presence | 1 to 20 | Dominion checks; unrest decay; recruiting prisoners | `dominion.ts`, `unrest.ts` |

Each unit definition carries a range per stat in content; recruitment rolls inside it from
`state.rng`, as the adept tier rolls its third pip. The unit tables keep their meaning; no two
Ash Chieftains are the same. Pretenders keep their chassis numbers and take no stats.

Traits are abilities from the existing catalog with an `officer` placement: Fearless, Steady,
Greedy, Scholar, Duelist, Beloved, Cruel, Wanderer. One trait at recruitment, a second at the
first rank step. Eight is the whole list; RTK's hundred is the phonebook.

Rank: the docs forbid pips from experience, and that stands. A commander gains a rank step at
fixed events (three battles survived, a province taken, a research level contributed), which adds
a fixed amount of Command and unlocks the second trait pick. Three ranks.

### 3.2 Capture and prisoners

A commander brought to 0 HP in a battle its side *loses* is captured by the winner with a content
probability (base 60%, up with the captor's Valor, down for Wanderer). In a battle its side wins,
0 HP still means death. A fort that falls captures everyone inside. Its troops go to the heir, as
today (`apply.ts`).

Prisoners stay in `state.commanders` with `owner` unchanged and a new `held: NationId | null`, so
portrait, name, stats and items survive; `NationState.prisoners` lists them with the day taken
and failed offers. Three commands, each validated and used by the AI:

- `recruitPrisoner`: captor's Presence plus DRN against the prisoner's rank times 5 plus DRN; a
  failure counts and the next try is harder. On success the officer changes `owner`, keeps stats
  and items (owner decision 1), and starts in the wavering state once Tier 2 exists.
- `ransomPrisoner`: the owner pays gold by rank; the AI accepts by treasury.
- `releasePrisoner`: unrest −5 in the captor's capital region, and the released officer goes
  home with a grudge or a comrade bond toward the captor by the captor's trait (Cruel or Beloved).

Each capture is one alert with the three buttons. Execution waits for Tier 2 because its
consequences are loyalty effects.

### 3.3 Automatic duels

Before round 1, if either side has a commander with Duelist and the other side has a commander
not scripted Retreat, the resolver runs a duel with its own melee rules until one is at half HP.
The loser's side takes a `moraleShock` (a primitive that exists); the loser may be wounded or,
if the battle is then lost, captured by 3.2. No script slot; it happens, as in XIV, and the
replay shows it at centre.

### 3.4 Ascendancy: the god's rank

`ascendancy` on `NationState`, settled monthly: provinces, plus 3 per Wellspring claimed, plus 1
per battle won, minus 2 per fort lost. Its thresholds do two things:

- **The field cap.** Commanders that may hold troops outside a fort province: `2 + floor(ascendancy
  / 5)`. Over the cap, `validate` refuses a `move` into an unowned province for the newest field
  commander and names the cap. The AI obeys on every difficulty (owner decision 4). This is the
  realtime form of RTK's commands per turn and a brake on the Wellspring rush, which today ends
  every runner game in a mean of 22 months with no eliminations.
- **Three posts.** Marshal, Chancellor, Hierophant, opened at ascendancy 5, 10 and 15. A post's
  effect scales with its holder's stat, never a flat bonus (the Total War lesson): the Marshal
  adds Command / 10 to every commander in its province; the Chancellor adds Stewardship percent
  to gold; the Hierophant adds Presence / 4 dominion checks at the capital. A post pays a stipend
  of rank × 5 gold a month. The pretender holds none; the prophet may hold Hierophant (owner
  decision 2). `assignPost` is the one command.

### 3.5 Fort governors and developments

A commander with the order `govern` in an owned fort province applies Stewardship and Presence to
the fort's material catchment (the neighbors that already feed it): materials and gold +1% per
Stewardship point, unrest decay +0.25 per Presence point, build time −1% per Stewardship point.
Governing commanders are absent from battle like researchers. Developments are buildings in
content with `fort: true`, built with the existing `build` command, one each per fort:

| Development | Gold / materials / days | Effect on the catchment per month |
|---|---|---|
| Granary | 150 / 25 / 30 | supply +15%; a besieged fort starves 15 days later |
| Market | 200 / 0 / 30 | gold +10% |
| Barracks | 250 / 50 / 40 | recruit time −15%, PD cost −20% |
| Shrine | 100 / 0 / 20 | +1 dominion check for the owner's temple here |

Pillage in the fort province destroys one development. Each is a landmark in the settlement art,
which already has seeded landmark slots. Nothing is added to non-fort provinces.

### 3.6 Officer proposals

On planning days a content rule table turns officer state into proposals: an idle leader with
Greedy proposes Pillage on the richest adjacent enemy province; a Scholar researcher proposes
switching research to the color with the most unlocked spells; a Duelist proposes marching on an
enemy army with a weaker commander; a governor with Stewardship above 15 proposes the next
development. A proposal is an alert with Accept, which issues the command through `validate`, and
Dismiss. At most one proposal per officer per month and three open at a time, so the ribbon never
fills. The AI accepts proposals by its personality weights, which gives the AI officer-driven
behavior for free.

### 3.7 Bonds

`bonds: Bond[]` on `GameState`, two kinds:

- **Comrade**: two commanders who win a battle together, twice. +1 morale to both when in the same
  province; a comrade refuses to be recruited from captivity by the nation that holds the other's
  killer.
- **Grudge**: against a nation that killed or held a comrade, or against a commander who beat the
  officer in a duel. +2 attack against that nation's troops; never recruitable by it.

Both are announced in the message feed and shown as chips on the card. No stat visits, no gifts.

### 3.8 Presence in dominion spread

A commander with order `preach` adds `floor(Presence / 5)` checks beyond its holy pips, and a
governor adds `floor(Presence / 10)` checks to its fort's temple. Priests stay the main source;
this is the XIV idea at a tenth of the weight.

### 3.9 State, commands, AI, tests

- `CommanderState` gains `stats`, `traits`, `rank`, `held`. `NationState` gains `prisoners`,
  `ascendancy`, `posts`. `GameState` gains `bonds`, `proposals`. One `STATE_VERSION` step; the
  migration gives existing commanders the midpoint of their unit's ranges.
- Commands: `recruitPrisoner`, `ransomPrisoner`, `releasePrisoner`, `assignPost`,
  `acceptProposal`, `dismissProposal`; the order `govern`. The field cap is the one new branch on
  an old command (`move`).
- AI: steps `prisoners`, `court`, `governors`, `proposals`, with every number in
  `src/content/ai.ts` and two personality weights, `mercy` and `pride`.
- Content: stat ranges, traits, posts, developments, proposal rules, capture odds, in
  `src/content/officers.ts`, validated in `tests/content`.
- Tests: capture odds against a closed formula over 500 seeds; prisoners survive save and load;
  the cap refused in `validate` only; post effects scale; duels deterministic and in the replay;
  the 365-day replay hash with officers on; no AI refusal in 20 runner games.

## 4. Tier 2: after the playtest

Each waits for the prototype's two questions (section 7) to come out right.

- **Loyalty states.** Three states, loyal, wavering, disloyal, changed only by events: a post
  given or taken, an execution witnessed, routing in a lost battle, 3 months unpaid, an enemy
  ploy. Disloyal officers refuse Pillage unless Cruel and can be turned by a ploy. Desertion
  takes no troops. Loyalty resets to wavering on a change of nation (owner decision 1). No
  monthly drift.
- **Execution.** The fourth prisoner action: the only way to be rid of a hero; grudges for every
  comrade; your Beloved officers go wavering; Dread softens it.
- **The coalition rule and treaties.** `relations` per nation pair with attitude from the color
  wheel, scales, borders and battles, and −10 per Wellspring held beyond half the win count.
  `proposeTruce` and `proposeAlliance` only; a truce makes `validate` refuse a move into the
  other's land, an alliance shares vision and lets armies share a province. Truces are breakable
  at once at the attitude cost (owner decision 3). No tribute, no marriage.
- **Search and the tavern board.** A `seekOfficers` order draws from a per-game free pool against
  Presence; fallen Independent Captains join the pool. The tavern on the war table is the screen.
- **Legends.** Six to ten seeded heroes per game with outsized stats, one unique trait, a lore
  line and their own portraits.
- **Ploys**, with the M2 Blue and Black nations after their spells land (owner decision 5):
  Whispers of Doubt, Turn the Cloak, Incite the Mob, as ritual primitives with a Lore contest.

## 5. Tier 3: out, or only for the long session

- Officer play (RTK 8, XIII). Changes the genre; the god is the player.
- Hundreds of officers. Ten to thirty named people per nation is the ceiling for a short match.
- Development slots on every province, and any facility grid. Forts only.
- Tribute, marriage and gift menus. Two to four nations do not need them.
- A monthly loyalty meter. Never, at any session length.
- Aging and death by age. Only if a session spans decades (section 6).

## 6. The long session

The owner's direction of 2026-10-23: "the ideal game length will also become more 15-20 hours
per full session but for now the games are short". `docs/00-vision.md` keeps its 45 to 75 minute
match until that format is scheduled; this record says what the longer session unlocks, so the
Tier 1 data shapes are built to hold it:

- **Scenarios** become the main replay lever, as in RTK 8's 55 starts: templates applied to the
  generated map (ownership spreads, starting relations, awakening overrides, guard strength, a
  situation paragraph), with a `--scenario` flag on the runner. In a short match they are a New
  Game page; in a long one they are the game's shape.
- **Rosters** of 30 to 60 named people, and a Search cadence that matters, because there are
  years to find them.
- **An event deck**: deterministic monthly draws against the Turmoil chance `docs/05` already
  stores, using the ritual primitives plus `offerOfficer` and `relationShift`.
- **Generations**, if a session spans decades: heirs, old age, a successor god's prophet. This is
  the one Tier 3 item with a real place in a 20-hour session.
- **Diplomacy with more parties**, once maps hold more nations.

Tier 1 keeps `rank`, `bonds`, `prisoners` and `ascendancy` as open-ended records so none of this
needs a second migration of the same fields.

## 7. The gate and the measurements

Build Tier 1 after Phases 8 and 9, play three matches, and ask two questions:

1. Did a named person generate a story the player retold? If not, the stats and bonds are too
   quiet; raise trait effects before adding systems.
2. Did the player pause more often for officer reasons than for army reasons? If yes, the layer
   is too thick; cut proposals to one open at a time before adding Tier 2.

In the runner (`npm run sim:aivai`), over 20 seeds per matchup, for `docs/09-balance.md`'s
checklist: at least one capture and one prisoner action per game on average; at least one
elimination in 20; months to victory spread by 15 or more between fastest and slowest; the AI
never leaves a prisoner unhandled for 60 days; no refusal.

## 8. Architecture fit

Every roll uses `state.rng`; every monthly settle runs in `advance` step 5 in a fixed order
(ascendancy, posts, proposals). Every number is content. Every action is a command through
`validate` and `apply`, used by the AI. One save version step per phase with a migration. The UI
additions are a Court modal (officers, posts, prisoners), loyalty-free in Tier 1, and the
proposal alerts in the ribbon the UI spec already has.

## 9. Open questions

The five questions of the first draft were settled on their defaults by the owner on 2026-10-23
(`three-kingdoms.owner-answers.md`) and are applied above as owner decisions 1 to 5. The
revision adds none.

## Sources

- Gematsu, RTK XIV systems: Search, Royal Rank, Civil Service, Campaign, Duels
  (https://gematsu.com/2019/12/romance-of-the-three-kingdoms-xiv-details-search-royal-rank-and-civil-service-campaign-duels-and-other-systems)
- PC Invasion, RTK XIV review (https://www.pcinvasion.com/?p=210925)
- RPG Site, RTK XIII review (https://rpgsite.net/review/4916-romance-of-the-three-kingdoms-xiii-review)
- Tech-Gaming, RTK XIII review (https://tech-gaming.com/romance-three-kingdoms-xiii)
- Wikipedia, RTK XI (https://en.wikipedia.org/wiki/Romance_of_the_Three_Kingdoms_XI)
- Gematsu, RTK 8 Remake officer relationships
  (https://www.gematsu.com/2024/08/romance-of-the-three-kingdoms-8-remake-details-officer-relationships-conscript-ambushes-traps-and-more)
- GamingBolt, RTK 8 Remake review (https://gamingbolt.com/romance-of-the-three-kingdoms-8-remake-review-return-of-the-kingdoms)
- PC Gamer, Total War: Three Kingdoms review (https://pcgamer.com/total-war-three-kingdoms-review)
- Total War Wiki, Satisfaction (https://totalwar.fandom.com/wiki/Satisfaction)
- Steam, Total War: Three Kingdoms court positions thread
  (https://steamcommunity.com/app/779340/discussions/0/3842178984949469995)
- TechRadar, Nobunaga's Ambition: Awakening review
  (https://www.techradar.com/gaming/nobunagas-amibition-awakening-complete-edition-review)
