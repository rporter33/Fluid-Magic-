# Balance Log

Record every number changed from the docs during implementation, with the reason and
the test or playtest that motivated it. The docs stay the design intent; this file is
the truth for current values.

| Date | Doc | Field | From | To | Reason |
|------|-----|-------|------|----|--------|
| 2026-10-21 | 01 §2, 07 | Province count | 60 for 2 nations, +25 per nation | Small 40 / Medium 60 / Large 80 for 2 nations, +25 per extra nation | Combines the core rule with the New Game sizes |
| 2026-10-21 | (new) | Terrain shares | unspecified | mountains 0.08, hills 0.14, swamp 0.08, forest 0.22, wasteland 0.10, farmland 0.14, plains 0.24 | A varied mix; plains and forest most common |
| 2026-10-21 | 01 §4 | Springs per independent province | 0 to 2 | weights 50 / 35 / 15 for 0 / 1 / 2 | About 0.65 springs per province, 7 per color on Medium |
| 2026-10-21 | 01 §4 | Spring colors | each color appears | equal count per color per map (±1), placed by `TERRAIN_SPRING_COLORS` | Rolling colors by terrain gave Green 2.5x Red's springs, tilting the M1 matchup |
| 2026-10-21 | (new) | Map geometry | unspecified | province area 6400 units², aspect 1.6, corner radius 0.15 of the short side, Poisson radius 0.75 √area, 30 tries, 2 Lloyd rounds | Even cells, no slivers, fast generation |
| 2026-10-21 | (new) | Terrain noise | unspecified | 1.5 features across the long side, 3 octaves | 27% same-terrain neighbors against 17% by chance (2.5 features gave 19%) |
| 2026-10-21 | (new) | Adjacency minimum border | unspecified | 0.001 √area (0.08 units) | Only point contacts are dropped, so the graph matches the drawing |
| 2026-10-21 | (new) | Capital neighborhood balance | unspecified | 2-hop starting pop ratio ≤ 1.5, else the most even of 6 valid maps | 15% of Medium maps had one capital with twice the nearby population |
| 2026-10-21 | 01 §13 | Wellspring placement | ≥ 3 from capitals | also ≥ 2 apart; fairness weight 3 per hop; 8 search starts of up to 20 passes | Adjacent Wellsprings appeared on 85% of 3-nation maps; single-start search left 4-nation maps unfair |
| 2026-10-21 | (new) | Starting population rounding | unspecified | 100 | Readable numbers |
| 2026-10-21 | (new) | Starting gold | unspecified | 300 | A little over a month of capital income |
| 2026-10-21 | 03 | Commander weapons | none listed | Scout Dagger 2; priests and mages Staff 2; Ash Chieftain Axe 5; Warden Captain and Independent Captain Sword 4 | Every commander needs a melee weapon in battle |
| 2026-10-21 | 01 §4 | Unpaid upkeep morale | 1 per month unpaid, recovers when paid | 1 per 30 unpaid days, at most 3; one day of recovery per fully paid day | Caps match starvation; a one-day surplus cannot wipe a long deficit |
| 2026-10-21 | 01 §4 | Starvation counter | -1 morale per 5 days, cap -3, recovers at the same rate | counter capped at 19 days | Recovery of the first point takes 5 fed days, as its loss did |
| 2026-10-21 | (new) | Message log | unspecified | 300 most recent per nation | Bounded save size; AI messages never push out the player's |
| 2026-10-21 | (new) | Starting tax rate | unspecified | Normal, also for a newly taken province | The neutral rate; the player opts into Low or High |
| 2026-10-21 | (new) | Minimum construction time | unspecified | 1 day | Artifice 3 times a short build cannot reach 0 days |
| 2026-10-21 | 01 §4 | Healing when fed | "recover at the same rate" | 2% of max HP a day, battle wounds included | One rate for starvation and healing; no separate wound rule in M1 |
| 2026-10-21 | 03 | Commander map speed | baseline 2 | 3 for national commanders | With 2, speed-3 troops could never move faster than infantry |
| 2026-10-21 | 01 §6 | Leg days | moveDays * factor | round(moveDays * factor), at least 1. Speed 1 / 2 / 3: plains and farmland 6 / 4 / 3, forest and hills 9 / 6 / 4, mountains 14 / 9 / 6, swamp 12 / 8 / 6, wasteland 8 / 5 / 4 | Whole days for progress, reversal, and ETAs |
| 2026-10-21 | 01 §8 | PD cost | (level + 1) * 15 | raising from level L costs (L + 1) * 15; 0 to 30 costs 6975 | The doc's level read as the current one |
| 2026-10-21 | 01 §9 | Independent pools | troop kinds per terrain | 2 : 1 for two-kind pools; farmland and wasteland use plains; the mountain giant counts toward the strength | The doc gives kinds, not shares |
| 2026-10-21 | 01 §14 | Strength words | four words | weak < 16 <= moderate < 24 <= strong < 30 <= fortress | 8 + 4d gives weak at d 1, moderate at 2 to 3, strong at 4 to 5, fortress beyond and on Wellsprings |
| 2026-10-21 | 01 §8 | Recruit time scales | Order, Turmoil | also Wild +15% and Artifice -15% per step (build time), summed into one factor max(0, 1 + sum); Turmoil 3 with Artifice 3 gives x0.25 (tune in Phase 12) | Section 8 calls recruit time build time |
| 2026-10-21 | 01 §8 | Recruit cancel refund | unspecified | gold in full; materials up to the fort pool cap; no cancelling during a siege; items dropped when the fort changes hands are not refunded | A full refund would bank materials past the cap |
| 2026-10-21 | 01 §4 vs 09 checklist | Supply pop divisor | pop / 50 | unchanged (pop / 50) | Conflict: Hills supply is 100-160, so the checklist item "armies larger than 60 troops in a Hills province starve within a month" cannot pass. Phase 12 should retune (about pop / 250 fits) or change the checklist |
| 2026-10-21 | 04 | Ranged damage | "damage as melee" | weaponDmg + DRN − prot − DRN, without the shooter's str | Strength is a melee stat; a shot's force is the weapon's. Archers with 3 free volleys kill 2.7 of 20 militia (required: at least 2) |
| 2026-10-21 | 04 | Closing round at map speed 0 | unspecified | 4, as speed 1 | Immobile units (Living Monolith) need one |
| 2026-10-21 | 04 | Winner of a mutual rout | unspecified | the side with more living units still on the field, routing ones included; a tie goes to the defender | Giving every mutual rout to the defender let 20 attacking Cinder Warriors beat 10 Ash Militia in only 89% of seeds (required 95%); now 98.5%, equal armies 49% |
| 2026-10-21 | 05 | Dread battle morale | −1 to enemies per 3 dominion strength | −1 per step of the province's effective Dread scale (−3 at Dread 3 and full strength) | The effective scale already grows with dominion strength |
| 2026-10-21 | 05 | Prophet wait | 24 months | 720 days | 30-day months |
| 2026-10-21 | 01 §11 | Walls down | wall HP reaches 0 | below 1 HP (shown as 0) | Fractional damage and repair would otherwise leave walls at 0.4 that count as standing |
| 2026-10-21 | 01 §8 | PD after a battle | unspecified | min(pd, ceil(militia left / 2)); archers ignored | 2 militia per level |
| 2026-10-21 | 06 | Battle records kept | last 20 | last 20 battles in which a player's nation fought | AI battles would push the player's replays out |
| 2026-10-21 | 04 | Bless fatigue | unspecified | 10 | As cheap as the level-1 spells |
| 2026-10-21 | 02 §5 | Fog and wall field effects | unspecified | fog −4 precision for everyone; wall stops melee between the fronts | No spell defines them; storm takes Tempest's "no ranged, −2 att" |
| 2026-10-21 | 02 §5 | Scry duration | unspecified | 30 days, the one province only | One month of sight for one cast |
| 2026-10-21 | 02 §5 | remoteDamage | "dice per unit" | plain dice per troop, no protection, commanders and PD untouched | "Every troop"; with protection Ash Rain would kill almost no Wardens. 2d6 kills about 17% of 10-HP troops |
| 2026-10-21 | 02 §5 | manaConvert | unspecified amount | the whole `from` pool, `ratio` to one | No M1 spell uses it |
| 2026-10-21 | 02 §3 | Fatigue thresholds | cannot act at 100, unconscious at 200 | no action at 100 or more; 200 the same in M1 | Only drains can reach 200 and no M1 spell drains |
| 2026-10-21 | 02 §4 vs 09 checklist | Research to level 4 | "level 4 by month 24 with 4 mages" | unchanged formula | Conflict: four apprentices from level 1 reach level 4 on day 660 at neutral scales but on day 825 at capital Fury −2 (the Warlord and Wildfire presets); adepts make it. Phase 12 decides between retuning and changing the checklist |
| 2026-10-21 | 04 | Armor piercing | halves protection | floor(prot * 0.5), in content | The doc gives no rounding |
| 2026-10-21 | 05 Presets | Deep Root dominion | 8 | 7 | Dominion 8 costs 425 of the 400 budget (awake, no refund); 7 costs 395 |
| 2026-10-21 | 05 | Pretender leadership | Titan 100, others unlisted | 20 for Oracle, Great Wyrm, Living Monolith, Wild Spirit, Ash Colossus | An escort, and room for the summon rituals the Monolith is built to cast |
| 2026-10-21 | 05 | Pretender weapons | unlisted | Titan Great Sword 8; Great Wyrm Bite 10 plus breath 12 (range 3, ammo 5); Ash Colossus Burning Fists 6; Wild Spirit Claws 5; Oracle Staff 2; Monolith none | Every fighting body needs a melee weapon; the Monolith only casts |
| 2026-10-21 | 05 | Wild Spirit regeneration | "regeneration" | 10% of max HP per round | The docs give no amount |
| 2026-10-21 | 05 | Fire shield | 5 fire damage to melee attackers | 5 per melee hit that deals damage, no protection, after the phase | Per hit, like life drain |
| 2026-10-21 | 05 | Awakening arrival | Month 12 / Month 36 | day 330 / day 1050 (the first day of those months) | 30-day months |
| 2026-10-21 | 01 §12 | Spread rolls | unspecified | 40% own province, else a uniform neighbor; d10 ≤ score at the start of the month's spread | Fixed per spread so the shuffle order does not change the odds |
| 2026-10-21 | 01 §12 | Temple preach bonus | +1 preach (section 7) | one extra check for a priest preaching in a province with a temple its nation owns | Section 7's bonus in section 12's terms |
| 2026-10-21 | 01 §13 | Wellspring claim | 10 days | 10 days, in tick step 3; any order, move, battle, or loss of the province ends it | Uninterrupted, as the docs say |
| 2026-10-21 | 08 | AI leader | "field commanders" | a recruitable commander with no pips, holy 0, not stealthy, and leadership ≥ 60 (`AI.leaderLeadership`) | The Ash Chieftain and the Warden Captain (80) lead; priests, mages, scouts, summons, and the pretender do not |
| 2026-10-21 | 08 | AI recruit batch | 10 to 20 | 20 when gold and fort materials allow, else 10, never fewer (`AI.batch`) | The docs' range, the larger batch first |
| 2026-10-21 | 08 | AI queue depth | 1 to 2 items | unchanged (`AI.queue` min 1, max 2); the cheapest troop takes a place only below the minimum | The fort always has work, and the second place waits for what is wanted |
| 2026-10-21 | 08 | AI leader quota | 2 + provinces / 6 | 2 + floor(provinces / 6) (`AI.baseLeaders`, `AI.provincesPerLeader`) | The docs give no rounding |
| 2026-10-21 | 08 | AI mage quota | 1 per 4 provinces, at least 2 | max(2, floor(provinces / 4)) (`AI.minMages`, `AI.provincesPerMage`); the adept tier while the gold left after it covers the reserve | The docs give no rounding |
| 2026-10-21 | 08 | AI priest quota | 1 per 5 provinces | floor(provinces / 5) (`AI.provincesPerPriest`) | The docs give no rounding; each nation starts with a priest |
| 2026-10-21 | 08 | AI scouts | 1, replaced if lost | unchanged (`AI.scouts`) | The scout is also the AI's only builder |
| 2026-10-21 | 08 | AI melee to ranged | 2 : 1 by troop count | unchanged (`AI.meleeRangedRatio`); ranged wanted while melee > 2 × ranged, garrisons and the queue counted | |
| 2026-10-21 | 08 | AI unit choice | "weighted by nation personality" | weight 1 + aggression × gold cost / the dearest troop's + pillage if faster than the slowest troop | Aggressive nations favor dear troops, pillagers fast ones; no new number |
| 2026-10-21 | 08 | AI field army | ≥ 15 troops | unchanged (`AI.fieldArmyTroops`); relief and the march home take any size | |
| 2026-10-21 | 08 | AI expansion odds | armyPower > 1.5 × defenders | unchanged (`AI.expansionRatio`), defenders' power taken as at least 1 | An empty province would divide by 0 |
| 2026-10-21 | 08 | AI war odds | aggression × own power > 1.2 × enemy power nearby | unchanged (`AI.warRatio`), checked only for a new target and per candidate target (AI war range); every attack on an enemy province but joining a siege also needs 1.2 × its defenders | "If a single one is short" read at the same ratio |
| 2026-10-21 | (new) | AI relief | unspecified | 1.2 × the besiegers' power, armies of any size (`AI.reliefRatio`) | War's margin; with no sally a siege is broken only from outside |
| 2026-10-21 | 08 | AI storm | "storm when the walls are down" | walls down and 1.3 × the defenders' power, or no defenders at all (`AI.stormRatio`) | Walls fall once besiegers have a little over half the defenders' strength; storming then, into the walls' bonuses, loses the army |
| 2026-10-21 | 08 | AI capital garrison | ≥ 20 troops after month 6 | 20 kept from day 0 (`AI.capitalGarrison`) | Recruits take 8 to 40 days, so a reserve begun on day 180 left the garrison empty for days after it |
| 2026-10-21 | 08 | AI threat range | adjacent | the province and its neighbors (`AI.threatHops` 1) | |
| 2026-10-21 | (new) | AI war range | "enemy power nearby" | per candidate target: its garrison troops and PD, plus other nations' commanders within 2 hops of it (`AI.warHops`) | Review finding cor-3. First read as one sum over the whole border (other nations' commanders within 2 hops of any own province, plus the garrisons and PD of every enemy border province): with PD 10 on every border province that sum outgrew a large nation's field power, so its gate never opened and full armies stood idle at home for up to 665 days in 24 Large 3-nation games to day 1500 (0 after the change) |
| 2026-10-21 | 08 | AI strong independent | strength > 20 | more than 20 independent troops (`AI.independentStrength`) | docs/01 strength is a troop count (8 + 4d); read as power, nearly every province exceeds 20 |
| 2026-10-21 | 08 | AI ranged bonus | 0.1 | unchanged (`AI.rangedBonus`) | |
| 2026-10-21 | 08 | AI expansion score | pop / 1000 + springs × 3 + Wellspring × 10 | unchanged (`AI.score`: popPer 1000, spring 3, wellspring 10), over max(defenders, 1) | |
| 2026-10-21 | 08 | AI expansion reach | adjacent provinces | every province a path reaches; score / (1 + 0.05 × (1 − expansion) × path days) (`AI.distancePenalty`) | Armies refill at home, so a reach limit left full armies there with every target out of reach. Starting value kept: the behavior tests pass with 12 or more provinces at day 360 in every game from base seeds 1, 101, and 1001 |
| 2026-10-21 | 08 | AI PD | 5 next to an enemy or a strong independent, 10 next to an enemy nation | unchanged (`AI.pd`: border 5, enemy 10); one level per province per call, from gold above the reserve | |
| 2026-10-21 | (new) | AI Wellspring PD | unspecified | 10 in owned Wellsprings, after the enemy border (`AI.wellspringPd`) | A Wellspring win is immediate, so the province must hold |
| 2026-10-21 | (new) | AI gold reserve | unspecified | 150 gold that PD and buildings leave for recruitment (`AI.goldReserve`) | Starting value kept: no capital queue stood empty more than 7 days with gold above 200 |
| 2026-10-21 | 08 | AI Lab | gold > 500, in the second-best province | unchanged (`AI.labGold`); the most populous owned province but the capital, built by the scout | |
| 2026-10-21 | 08 | AI Temple | pop > 8000 and gold > 300 | unchanged (`AI.templePop`, `AI.templeGold`) | |
| 2026-10-21 | 08 | AI High tax | gold < 50 and unrest < 20 | unchanged (`AI.taxHighBelowGold`, `AI.taxHighMaxUnrest`), the capital only | |
| 2026-10-21 | 08 | AI ritual mana | mana ≥ 2x its cost | every pool the ritual draws on holds twice its share (`AI.ritualCostFactor`); a carried-mana gift takes at most half a pool | |
| 2026-10-21 | 08 | AI pretender joins an army | after month 3 | day 90 (`AI.pretenderJoinDay`) | 30-day months |
| 2026-10-21 | (new) | AI battle mages | unspecified | at most 1 per army (`AI.battleMagesPerArmy`) | One caster spreads the mages over the armies |
| 2026-10-21 | (new) | AI carried mana | unspecified | up to 2 in all per battle mage (`AI.carriedMana`) | Warcry, Pyre Storm, Swarm, and Regrowth take 1 each: two casts |
| 2026-10-21 | (new) | AI Godless alarm | unspecified | danger while no owned capital or temple province holds own dominion ≥ 2 (`AI.godlessAlarm`) | At 1, a single enemy push leaves a province without dominion |
| 2026-10-21 | 08 | Easy War delay | no War step until month 12 | War from month 12, day 330 (`warFromMonth`); Wellspring denial waits too | 30-day months |
| 2026-10-21 | 08 | Easy income | gold × 0.8 | unchanged | Conflict: fort materials, not gold, limit AI recruitment, so AI gold piles up and the factor barely bites. Phase 12 decides |
| 2026-10-21 | 05 Step 1 | Chassis realms (6b.1) | every nation offers all chassis | generic: Oracle of the Flux, Titan, Great Wyrm, Living Monolith; R: Ash Colossus; G: Wild Spirit (five per M1 nation until Phase 6b.3) | Owner decision 2 (docs/05): color chassis only for nations of that color |
| 2026-10-21 | 05 Step 2 | First pip of a new color (6b.1) | 60 for every chassis (the Oracle 50 after its discount) | per chassis: Oracle 40 (30 after its discount), Living Monolith 50, Titan 60, Ash Colossus 60, Great Wyrm 80, Wild Spirit 80 | The pretender build spec's tiers (A.1): seers branch cheaply, monsters pay most. No preset buys a new color, so no preset's cost moved |
| 2026-10-21 | 05 Step 4 | Scale step toward an attuned pole (6b.1) | none | 20, the own-color price; no refund, limits ±3 | Build spec D3; none of the six chassis is attuned yet |
| 2026-10-21 | 08 | Chassis AI power (6b.1) | none | Oracle 0, Titan 94, Great Wyrm 247, Living Monolith 595, Wild Spirit 65, Ash Colossus 160 | Each body's Independent Light Infantry equivalent (the most it beats in half of 200 seeds) times 7.25, from the build spec's `aipower.ts` (A.11); unread until `armyPower` moves into the sim (Phase 8), recalibrated in Phase 12 |
| 2026-10-21 | 02 §8, 05 Step 6 | Bless points and blessing costs (6b.1) | each color at 4 pips gives its fixed bless, doubled at 6 | bless points per color max(0, pips − 1), spent only on that color; a blessing costs max(1, requires − 1); requirements 2 to 6; at most one per group; the fixed bless is the default pick (standard at 4 or 5 pips, cost 3; greater at 6, cost 5) | The Dominions 6 menu at FM's size; per-color points cap an all-colors god's sacreds at +6 attack (pooled points allowed +11). Every existing design keeps its exact bless |
| 2026-10-21 | 05 Step 6 | Red blessings (6b.1) | fixed bless only | Fervor R2 mor +1; Keen Edge R2 att +1; Ember Might R3 str +2; Ember Wrath R4 att +2 str +2; Cinder Skin R4 fire shield 3; Blazing Charge R4 first melee round +5 damage, mor +1; Fury Unbound R5 (incarnate, Fury 1) berserk, att +1; Flaming Weapons R5 (incarnate) melee +3 fire armor piercing; Greater Ember Wrath R6 att +4 str +4; Living Pyre R6 (incarnate) fire shield 5, att +2 | Build spec A.6; bounds per pip set pinned in `tests/sim/bless.test.ts` |
| 2026-10-21 | 05 Step 6 | Green blessings (6b.1) | fixed bless only | Thick Skin G2 prot +1; Vigor G2 regeneration 5%; Strength of the Earth G3 str +2; Evergreen G4 regeneration 10%, prot +1; Oakhide G4 prot +3; Deep Roots G4 mor +3, prot +1; Wild Vigor G5 (incarnate, Growth 1) regeneration 20%, str +1; Greater Evergreen G6 regeneration 20%, prot +2; Ironbark G6 (incarnate) prot +5, str +2 | Build spec A.6; one regeneration blessing at most, so Green's regeneration tops out at 20%. Thornhide (G5, nature shield 4, prot +1) lands with shields by element in Phase 6b.2 |
| 2026-10-21 | 05 Step 6 | White, Blue, Black blessings (6b.1) | fixed bless only | W: Resolve mor +1, Warding prot +1 (W2); U: Keen Eye prec +1, Wariness def +1 (U2); B: Cruelty att +1, Grim Resolve mor +1 (B2); with each color's fixed bless as its standard (4) and greater (6) blessing | Build spec A.6: two minors so a splash pays off; full menus are M2 |
| 2026-10-21 | 05 Step 7 | Boons (6b.1) | none | Sacred Spring 40 (one spring of a color the design has a pip in, at the capital); Avatar 40 (the god fights blessed where its nation's dominion has strength 1 or more) | Build spec A.7; each at most once |
| 2026-10-21 | 05 decisions | The god's name (6b.1) | none | 1 to 24 symbols: Latin letters, space, apostrophe, hyphen, period | Owner decision 6; the share code's 6-bit alphabet (build spec B.9) |
| 2026-10-21 | 05 Step 6 | Thornhide (6b.2) | waited for shields by element | G5, cost 4, group G.shield, incarnate: nature shield 4, prot +1 | Build spec A.6, with N4. The bounds table gains its nature-shield column: 4 from G6 (G5 buys it with 0 left; G6 with 1 point for a minor), pinned in `tests/sim/bless.test.ts`; no other bound moved |
| 2026-10-21 | 04 decisions | Battle-start abilities (6b.2) | none | Fear: −2 morale for the battle on every present enemy group; Kindle the Host: 6 Fire Sprites; Call the Hunt: 8 Wolves | Build spec A.4 and N1. Content only until their bodies arrive in Phase 6b.3 (Primordial, Pyre Lord, Horned Hunter); no shipped unit lists one |
| 2026-10-21 | 04 decisions | Multi-strike weapon limits (6b.2) | none | `strikes` 1 to 4; `maxTargetSize` 1 to 6; melee weapons only | Build spec N2. The Trample of Phase 6b.3 is dmg 2, strikes 2, size 2 or less |
| 2026-10-21 | 02 decisions | Spell power (6b.2) | none | adds to every damage and heal amount a caster's spells land; abilities add none; content a whole number ≥ 0 on commanders | Build spec N3. The Ember Hierophant's 3 arrives in Phase 6b.3 |
| 2026-10-21 | 04 decisions | Ability one line (6b.2) | none | at most 120 characters (`UI.unitCard.oneLineMax`) | Units-and-items build spec B.1, so the card and the hover read one catalog |

## Playtest checklist (run before calling M1 done)

- [ ] A new player can start Cinder Horde with the Warlord preset and take 4 provinces by month 6 without reading docs.
- [ ] Thornwood beats Cinder Horde in roughly half of AI vs AI games on Medium maps (run 20 headless games with `npm run sim:aivai`).
- [ ] Armies larger than 60 troops in a Hills province starve within a month unless Thornwood with Growth 3.
- [ ] Research reaches level 4 in the nation color by month 24 with 4 mages.
- [ ] A match against one Normal AI ends by month 70 in most games (victory or defeat).
- [ ] No battle takes more than 100 ms to resolve.
- [ ] Save, reload, and continue produce the same state as not reloading (hash check).
