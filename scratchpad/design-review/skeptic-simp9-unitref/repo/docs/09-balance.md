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

## Playtest checklist (run before calling M1 done)

- [ ] A new player can start Cinder Horde with the Warlord preset and take 4 provinces by month 6 without reading docs.
- [ ] Thornwood beats Cinder Horde in roughly half of AI vs AI games on Medium maps (run 20 headless games with `npm run sim:aivai`).
- [ ] Armies larger than 60 troops in a Hills province starve within a month unless Thornwood with Growth 3.
- [ ] Research reaches level 4 in the nation color by month 24 with 4 mages.
- [ ] A match against one Normal AI ends by month 70 in most games (victory or defeat).
- [ ] No battle takes more than 100 ms to resolve.
- [ ] Save, reload, and continue produce the same state as not reloading (hash check).
