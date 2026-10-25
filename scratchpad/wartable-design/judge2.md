# Judge 2: readability, rules and engineering

Lens: readability, rules soundness, engineering risk. I scored both proposals against the real
mapgen and sim code, the Phase 7 AI worktree, and the staged docs/07 and docs/09. I also re-ran
the color checks myself.

- Scripts and outputs: `wartable-design/judge2-calc/checks.ts`, `modes.ts`, `washcap.ts`, each
  with a `.out` file.
- They use the repo's `tests/content/colorMath.ts`, read only.

## Scores

| | Owner fidelity | Readability | Rules | Feasibility | Cohesion | Total |
|---|---|---|---|---|---|---|
| Instrument | 7 | 9 | 8.5 | 7.5 | 8.5 | **8.1** |
| Immersion | 9 | 6 | 7.5 | 5.5 | 6.5 | **6.9** |

**Base: Instrument.**
- It is the safer frame: the sheet stays neutral, impassable terrain has one look family, and
  decoration sits below information and leaves in data modes.
- Its stamps never enter a label or badge box.
- Its colors pass the docs/09 rules. The two-commit landing comes with a bit-identity guard.
- Immersion is closer to the owner's mood: the tavern floor, the massifs, the land changing with
  alignment. Its mapgen measurements are also better.
- But Immersion fails the distinct-colors rule in several places, and its bake budget is wrong
  for Large maps. Its M1 scope is the largest.
- So the final should start from Instrument and graft the parts of Immersion listed below.

## 1. Impassable terrain against the code

### Who reads adjacency

Every sim reader of adjacency goes through `MapProvince.neighbors`:
- `movement.ts:73` (findPath, and searchFrom/pathsFrom in fm-p7f);
- `commands/army.ts:58`;
- `conflict.ts:98` (retreat);
- `visibility.ts:26-37`;
- `dominion.ts:102` (spread);
- `rituals.ts:37` (withinHops);
- `selectors.ts:200` (fort materials).

The fm-p7f AI does the same:
- `army.ts` hopsFrom and adjacencyRoute;
- `assess.ts:257`;
- `defense.ts:50`;
- `magic.ts:136,191`.

No AI file reads geometry. The only hit, `economy.ts:158` `site`, is unrelated. So both models
are sound for movement, hostility, retreat, fog, dominion spread, ritual reach and AI pathing, with
no sim branch. The one exception is Immersion's optional ridge refusal message.

### Behavior changes to re-measure

These are not bugs:
- Retreat goes to cameFrom, or else to a random friendly neighbor, and the commander dies when
  there is none. Fewer neighbors mean somewhat more deaths after a lost battle.
- Independents behind a barrier get stronger guards, because `capitalDistance` grows.
- Dominion spread concentrates on the remaining neighbors.
- The `sim:aivai` matchup row (Thornwood about half) must be re-measured.

### Invariants

**Exact province count, exact shares, capitals 6 or more apart.** Both proposals keep these by
construction:
- the extra cells are extra sites;
- terrain is ranked over the provinces, or over all cells with the regions fixed;
- capitals are placed on the full cell graph, and removing cells only lengthens paths.

**The 1.5x capital ring (soft; the generator falls back to the most balanced map).**
- Immersion keeps regions at least 3 cell hops from every capital and ridges at least 2. That
  provably keeps each capital's 2-hop ring members identical. It measured end to end:
  - 2 nations: 100%;
  - 3 nations: 79% to 93%;
  - 4 nations: 54% to 50%, after raising balanceCandidates from 6 to 10.
- Instrument only forbids adjacency, so a wild at 2 hops drops a ring member. It measured first
  attempts only, with capitals placed after wilds, which is not its spec's order. It quoted
  Medium (30 vs 32 of 60) and passed over Small (29 vs 38) and Large (23 vs 32).
- **Fix:** take the 3-hop guard and re-measure end to end.

**Wellspring fairness and spacing.** Both run `placeWellsprings` on the province graph, and
validateMap re-checks spacing. Immersion measured the maximum unfairness unchanged (0 and 1).
Instrument did not measure it.

**Connected, at least 2 neighbors, no cut vertex.** Both enforce these. Today's maps already
have no cut vertex: 160 of 160 seeds (Instrument) and 200 of 200 (Immersion).

**Detours.**
- Only Immersion caps them: 6 hops around a region, 4 across a ridge.
- Instrument has no cap. **Graft it.**

**Landlocked.**
- Immersion requires every region cell to be interior.
- Instrument requires only the seed cell to be interior, so its growth cells may reach the
  outline and read as a bay. **Require interior cells.**

**Determinism and purity.** Both draw only from the mapgen rng and need no `src/sim` imports of
render code.

**Instrument's bit-identity test cannot pass as written.** Adding `MapData.wilds` changes
`JSON.stringify`, so it can never equal a hash pinned before the change. To fix it:
- strip the key, or compare against a hash taken on the new shape with the old generator;
- make `MapGenParams.wilds` optional.

**Saves.**
- No serializer exists before Phase 9. `STATE_VERSION = 1` is in `types.ts:28`, and the
  determinism test round-trips JSON in memory.
- So the v1-to-v2 migrations both propose have no saves to migrate. Fold the shape into the
  format Phase 9 first writes.

### Ruling: regions only in M1

- Use Instrument's wild model with Immersion's guards.
- Ridges wait for M2, with passes.
- **Why not ridges now:**
  - a ridge is a line competing with borders, bands, the hover outline, path previews and the
    ritual contour;
  - at Far zoom a 20-unit border is 12 to 30 px, so the ridge reads as a thick border;
  - its rock is 1.40:1 on Mountains and its ink 1.84:1 on Forest, so it relies on one tone per
    fill;
  - two provinces that visibly touch would not be neighbors;
  - it adds `ridges`, `beside`, more validateMap checks and a renderer;
  - regions alone already put about 37% of provinces next to a barrier.
- Immersion's measurements show ridges are rule-sound. This is a readability and scope call.

## 2. Colors (distinct colors 20 normal / 12 CVD; WCAG AA)

**Instrument's slate #24222A against the fills:** 25.4 / 22.5 / 20.3 / 15.5 (normal, protan,
deutan, tritan). It passes.
- In data modes it sits about 11.5 to 12.2 from a 25% banner tint over desaturated Forest (worst
  tritan 11.5). That is borderline.
- **Fix:** add mode-tinted colors to the palette test, and lift the lowest step.
- The mockup's heat ramp starts at #181E3C, 9.5 from the slate. Instrument already lifts it.

**Immersion's region grounds fail:**
- Granite #5E5953 against Forest: 18.3 normal and 10.7 deutan (its own `immersion-colors.out`).
- Granite against a Thornwood-dominated province in Dominion mode: **0.8 protan, 1.5 deutan.**
  The peak and the enemy land look the same color.
- Mere #182A36 against Forest: 10.8 tritan.

**Immersion's light and washes fail:**
- The 8% 2700 K multiply on the cloth plus its own wash caps: Cinder 19.0 normal / 10.5 protan,
  Thornwood 19.2 / 9.2.
- Even with no light, Cinder-washed against Thornwood-washed land fails: 19.8 normal / 11.8
  protan.
- Caps that pass every pair type with a neutral sheet: Cinder 10% and Thornwood 6% (worst
  21.0 / 12.5).

**Brass:**
- Immersion's `--brass` #DBBD76 is **3.8 normal and 2.1 tritan from W Radiance's secondary
  #D9B85C**. It would be on every action button, tooltip and rank-2 frame. Immersion's own text
  names this collision and then uses the color.
- Instrument's #B8914A is 11.6, but its `--brass-hi` and pretender gilt #D4B26A are 3.8 (1.5
  tritan). They are allowed only with the 2 px dark separator.
- Immersion's bronze frame #B58735 is 3.0 from Ember's primary under protanopia, and its pip ring
  sits on the frame's arc.

**WCAG AA, Instrument:** text is 13.34 or more; the dim text worst case is 5.16 (on grain); brass
on grain is 4.51 (non-text needs 3). All pass.

**WCAG AA, Immersion:**
- text is 8.76 or more; dim text is 4.64 on `--chrome-2` (marginal) and 4.29 on leather (barred
  by its own rule);
- on parchment: ink 12.77, dim ink 5.53, warm-ink 5.03, cool-ink 5.26;
- the brass keyline is 6.19.
- All pass, but parchment cards add a second token family and the W-on-parchment ink-ring rule.
  The W primary on parchment is 1.09:1.

**Staged keyline.** The staged keyline (text at 25%) is about 2.1:1 on every chrome. #B8914A as
the action-button keyline (4.62 on the staged `--chrome-2`) would also fix that. This is an
optional graft.

## 3. Density budget, depth audit, modes, fog

**Depth audit.** Neither proposal adds a click to any path.

**Density.**
- Instrument excludes stamps from the real label box (96 x 30 at Mid) and badge box, plus 4 px.
- Immersion's disc of radius 26 px around the label anchor does not cover a 96 px label.
  Immersion's own sketch shows plaques over "Kharnath" and "Marholt".

**Modes.**
- Immersion ghosts stamps to 40%. That competes with Unrest's hatch density and Supply's wheat
  glyphs, the modes' second channels.
- Instrument fades decoration out, which is better for reading the mode.

**Fog.**
- The spec reads "terrain silhouettes under a parchment haze".
- A 20% haze already fails the palette rule (18.7 normal, 10.8 tritan), and the mockup brief's
  45% fails badly. So silhouettes must identify every terrain at Far.
- Instrument has Far relief only for Forest, Hills and Mountains. **Fix:** add Far silhouettes
  for Plains, Farmland, Swamp and Wasteland under fog.

**Calm monthly cache and reloads.** Population changes daily: `population.ts` grows it by
growth/30 each day, and pillage, battles and recruitment change it too. So both proposals' monthly
look cache would show a different settlement after a mid-month reload.
- **Fix:** persist the slow look keys and the month index in the save's UI block, not in
  GameState.

## 4. Pixi budget (mid laptop, DPR 2)

**Instrument.**
- The Mid full bake is about 22 MB on Large with 4 nations (computed). Near uses a 512² LRU of
  32 tiles (32 MB), and the table takes 4 draw calls. That is plausible.
- But `DetailBake` bundles fills, textures, stamps and wilds. A mode switch would then need a
  re-bake.
- **Fix:** split the bake into a fill layer, a decoration layer and an always-on layer (wilds,
  borders, bands), so Shift+1 to 6 only changes alpha and tint.

**Immersion.**
- Its "at most 48 MB" is right only for Medium.
- On Large with 4 nations, the Near bake alone is about 78 MB (5727 x 3580 at 4.8 px per unit)
  plus about 20 MB for Mid. That is about 98 MB, and baking 20 Mpx with about 7,000 stamps at a
  band change would hitch.
- **Fix:** bake Near lazily, tile by tile.

## 5. Scope

**Instrument** loads Phase 8 with:
- the table and the camera;
- wild rendering;
- terrain detail and settlements;
- tokens;
- portrait v0.

A time box of a quarter of Phase 8's diff and a fixed cut order guard it.

**Immersion** keeps Phase 8 lighter (impassable art, the Simple table, plaques, code-path
portraits). That is better for the first playable build. But its whole M1 is larger:
- ridges;
- miniatures with escorts;
- parchment chrome;
- seasons;
- directional brush wipes;
- mirror props;
- personal names and `heldSince`.

**Recommendation.** Take Immersion's phase split, with ground textures, stamps and settlements in
Phase 11 and Phase 8 playable with flat fills, wilds and the Simple table. Take Instrument's
smaller M1 list and its cut order.

## 6. Other rules notes

- **Personal names.** Immersion's pick by hash inside `src/sim/commanders.ts` breaks CLAUDE.md's
  "all randomness goes through state.rng". Draw names from `state.rng`, with fixtures re-pinned,
  or keep them out of the sim.
- **heldSince.** Immersion's `heldSince` is new sim state for decoration only. Leave it for later.
- **Ash Rain.** The pretender design's 30-day Ash Rain tint stacks with any wash. Turn it into a
  stipple, as Instrument asks, or include it in the wash test.
- **Battle replays.** Both replace the battle design's "rig at 2x" portraits with busts for
  humanoid commanders. That is consistent; take one line in the battle doc, as Immersion 8.7 has
  it.
