# The war table: final design

Impassable terrain, the oak war table in a tavern, map detail, growth by alignment, and leader
portraits. This is the build spec for the owner's direction of 2026-10-21. It replaces
`proposal-immersion.md` and `proposal-instrument.md`.

**The owner's direction (2026-10-21, binding; typos corrected only, as `owner-direction.md` records):**

> this is great - the UI is fluid - the hover is intuitive and responsive, the alerts row is
> good, each thing to try is good, i would like more detail on the map, while this is mostly an
> art pass, i want to make sure the maps have some impassible terrain that is noticeable, the
> detail view on the lands are great, some art assets to show the growth over time would be
> ideal, based on alignment too!
>
> leaders certainly need portraits
>
> the overall map should be on an rustic wartable in a cozy but natural tavern, nice oak wood

**What stays as it is.** The owner approved the layered UI: hover, nested tooltips, the alerts
row, and the province detail panel. The staged `docs/07-ui.md`, its five layers, its density
budget, "nothing is zoom-gated", and every approved chrome token value stay. This design changes
how the map looks, never what it says. Its one rule change is impassable terrain.

**Repository state.** Phase 7 merged while this final was written (`cfe2d11`, `1ca32ec`); its AI
reads adjacency only through `MapProvince.neighbors` (`army.ts`, `assess.ts`, `defense.ts`,
`magic.ts`) and no AI file reads geometry, as the judges found in the `fm-p7f` worktree. The
staged docs (`/home/user/fm-docs/docs/`, commit `ce9bfb2`) are the current `docs/07-ui.md` and
`docs/09-art-direction.md`. The blocks for docs/01, 06, 09-balance and 10 are written against
the repository at `7a524b8` (Phase 10 S1, which also brought `STATE_VERSION` 2, the migration
map `src/sim/migrate.ts`, and the battle design as `docs/12-battle-presentation.md`).

**New evidence for this final** (scripts and outputs in `wartable-design/final-calc/`; every
script reads the repo read-only and uses its own modules):

| File | What it measures |
|---|---|
| `regions-final.ts` → `regions-final.out`, `regions-final-b.out` | The final wild model and generation order as a copy of `generate.ts`'s `attempt()`, run through the repo's own `validateMap` and the balance search with 6 and with 10 candidates, against today's `generateMap` on the same seeds: Medium with 2 nations (200 seeds), 3 and 4 nations (100 each), Small and Large with 2 (100 each), Large with 4 (60) |
| `colors-final.ts` → `colors-final.out` | CIEDE2000 under the four visions (the repo's `tests/content/colorMath.ts`) and WCAG contrast: wild grounds against fills, all banners, every map-mode color; rims and marks; wash caps; fog caps; brass against mana colors; the staged chrome against the warm retune; oak and parchment |
| `joint-caps2.ts`, `grounds-states.ts`, `modes-lift.ts`, `ramp-lift.ts`, `ramp2.ts`, `colors-extra.ts` (each with `.out`) | Land-look washes and fog states combined; the granite tone against every fog state; the lifted mode base and data ramp; footpath, fog line art, frame metals, table tones |

The judges' measurements (`judge1-calc/`, `judge2-calc/`) and the proposals' (`calc/`, `tools/`)
are cited where used.

---

## The design in twenty-two lines

1. **Base.** The immersion proposal's experience (a tavern felt at the default zoom, massifs and
   meres, land that changes with alignment at the default zoom, leaders with names), rebuilt on
   the instrument proposal's engineering (a neutral sheet, palette-tested colors, decoration
   below information, a two-commit landing, a time box).
2. **Impassable terrain is wilds:** named mountain massifs (peaks) and dark lakes (meres) that are
   map cells but not provinces. Medium gets 3 ranges, about 5.4 extra cells. Ridges and chasms
   wait for M2.
3. **No sim or AI code changes.** A wild is never in `MapProvince.neighbors`, and every reader of
   adjacency (movement, retreat, sight, dominion spread, ritual reach, fort materials, the Phase
   7 AI) already walks `neighbors`.
4. **Every mapgen invariant holds, measured** on 660 maps: exact province count and terrain
   shares, capitals 6 or more apart, each capital's 2-hop ring unchanged (0 of 660 changed), no
   cut province, detours of at most 6 steps. The balance search grows from 6 to 10 maps, which
   restores the 1.5× ratio on 3- and 4-nation maps (Medium 4 nations: 54% today, 38% with wilds
   at 6, 56% at 10).
5. **It lands in two commits:** A behind `MapGenParams.wilds` with a bit-identity test; B, the
   owner-decision commit, which turns it on. Phase 7 has merged, so B can follow A directly.
6. **It is noticeable at every zoom and in every mode:** the darkest grounds on the map (granite
   #2A292C under snow-capped massifs, still water #24222A under pale ripples), a light rim, an
   ink contour and a name. Never tinted, faded, hatched or fogged. Passable Mountains stay
   snowless and carry a dashed footpath.
7. **The map is a painted linen cloth** on an oiled, quarter-sawn white oak war table in a tavern,
   seen straight down in one projection. The start zoom shows a 32 px oak band with iron corner
   straps and props peeking in; leaning back shows the whole table and the tavern floor around
   it (hearth, window light, rug, bench, a sleeping hound).
8. **No light ever falls on the cloth.** Warmth lives on the oak and the room, so every palette
   test checks exactly what is drawn.
9. **The chrome keeps every approved token** and gains the table's hardware: oak frames, aged
   brass #B8914A keylines and square tacks, leather spines on book modals. Parchment report cards
   and Codex pages are an owner A/B (M1-should). The warm token retune was measured and rejected.
10. **Map detail in three layers:** a live fill layer (tinted by modes), a baked decoration layer
    (ground textures, stamps, settlements, motifs, scars; faded out in data modes), and an
    always-on layer (wilds, borders, bands, ritual and siege marks).
11. **Settlements grow from state the sim already keeps:** tiers from population (the Population
    mode's steps), thriving and declining against the starting population, walls by PD,
    temples, labs, forts, scaffolds, Wellspring claims, kits by owner.
12. **Alignment repaints the land:** the dominating nation's land look (a palette-capped wash plus
    motifs and a landmark at strength 7) and scale-pole motifs at the default zoom. A future
    nation needs one record, or inherits its color's family.
13. **Calm and reload-stable:** slow looks change at most monthly and their keys are saved in the
    save file's UI block, so a mid-month reload shows the same map. Events show the day they
    happen.
14. **Fog is "not yet painted":** line-art terrain silhouettes for all seven terrains, a dotted
    border, no settlement. Fills move at most 4% (haze) or 10% (desaturation), the measured
    caps that keep every terrain pair distinct.
15. **Every commander gets a seeded portrait:** a layered SVG bust on one anchor grid, faces by
    rendezvous over append-only parts, a no-repeat deck for independent captains, state as
    overlays and frame marks only, frames by allegiance shape and rank material.
16. **Personal names** ("Varo, Ash Chieftain") are presentation state in the UI block, drawn from
    a no-repeat deck per nation (M1-should). The sim is untouched.
17. **Owner raster art is a premium layer:** the intake script lands in Phase 9, the first
    prompts go to the owner now, and every raster has a procedural fallback.
18. **One seeded-hash module:** the battle track's `src/present/rand.ts`.
19. **No new sim state.** Presentation state lives in the UI block (look keys, names), like the
    battle summaries and the god's look.
20. **Phase 8 stays playable with flat fills:** the Simple table, wilds, tokens and portrait v0.
    Terrain detail, settlements and land looks arrive in Phase 11. A time box and a fixed cut
    order guard the schedule.
21. **Exact docs text** for docs/01, 06, 07 (staged), 09 (staged), 09-balance and 10, and two
    portrait lines in docs/12.
22. **A 19-step mockup brief,** table and tavern first, ending with a time-lapse slider that shows
    a province grow and change faith.

---
