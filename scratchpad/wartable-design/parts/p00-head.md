# The war table: the immersion-first proposal

**Angle.** The player is a warlord leaning over an oak war table in a warm tavern. The map is a
living painted cloth. Its land visibly changes as dominions spread and settlements grow. Armies
are painted miniatures, and leaders are characters with faces. This proposal pushes the owner's
direction as far as it can go while the game stays playable and readable. Each section says where
it stops and why.

**The owner's direction, 2026-10-21 (binding, verbatim; typos corrected only).**

> this is great - the UI is fluid - the hover is intuitive and responsive, the alerts row is
> good, each thing to try is good, i would like more detail on the map, while this is mostly an
> art pass, i want to make sure the maps have some impassible terrain that is noticeable, the
> detail view on the lands are great, some art assets to show the growth over time would be
> ideal, based on alignment too!
>
> leaders certainly need portraits
>
> the overall map should be on an rustic wartable in a cozy but natural tavern, nice oak wood

**What this proposal keeps unchanged.** The owner approved the layered UI: hover, nested
tooltips, the alerts row, and the province detail panel. Their behavior, the staged
`docs/07-ui.md`, the five layers, the density budget, and the "nothing is zoom-gated" rule all
stay as they are. This is an art pass with one rule change: impassable terrain. The art may change
how the map looks, never what it says.

**Repository state.** Phase 6 is committed (`3addf97`). The Phase 7 AI is in the worktree
`/home/user/fm-p7f`. Docs 07 and 09 are read from the staged copies in `/home/user/fm-docs/docs/`.
Sibling tracks are harmonized where they touch the map: battle presentation (`battle-design/final.md`),
the pretender (`pretender-design/final.md`, with the owner's answers), and units and items
(`units-items-design/`).

**Evidence.** Every number marked "measured" comes from a script in this folder. The scripts read
the repo (read only) and save their output next to them.

| File | What it measures |
|---|---|
| `tools/impassable-proto.ts` | A full re-implementation of `generate.ts`'s attempt with impassable regions and ridges. It runs on the repo's own mapgen modules and is compared with the current generator on the same seeds (200 seeds for 2 nations, 100 for 3 and 4). Outputs: `tools/impassable-proto-final.out` (Small and Medium, 2 nations) and `tools/impassable-proto-final-b.out` (Large, 3 and 4 nations). |
| `tools/immersion-colors.ts`, `tools/impassable-pattern.ts`, `tools/two-tone.ts`, `tools/haze.ts`, `tools/impassable-search.ts` | CIEDE2000 under the four visions (the repo's `tests/content/colorMath.ts`) and WCAG contrast for every new color: impassable fills and marks, dominion washes, fog haze, material chrome, oak. Outputs are in `*.out` next to each script. |
| `sketch/table-sketch.html` (renders `sketch/sketch-mid.png`, `sketch-near.png`, `sketch-far.png`, `sketch-dominion.png`) | A calibration sketch on a prototype map (seed 2, Medium, 2 nations). It shows the oak table, the cloth, terrain stamps, peaks, meres and ridges, settlements, alignment motifs, miniatures and procedural portraits, at three zooms and in Dominion mode. |
| `proto-out/proto-medium-s{1..4}.png` | Prototype maps with peaks, meres and ridges. Passable adjacency is drawn as white lines. |

---

## 0. The design in twenty points

1. **Impassable terrain is both regions and borders.** *Peaks* (named mountain massifs) and
   *meres* (dark lakes) are map cells that are not provinces. *Ridges* are impassable borders
   between two provinces, drawn as mountain chains. A Medium map gets 3 peaks, 2 meres and about
   7 ridges.
2. **One sentence of rules.** "No army, sight, dominion or ritual crosses impassable terrain."
   `MapProvince.neighbors` keeps its meaning (passable neighbors), so the sim and AI code that
   reads it stays unchanged: seven sim files and five AI files.
3. **Every map invariant still holds, measured on 100 to 200 seeds per map size.** The exact province count, exact
   terrain shares, capitals 6 or more apart, the 1.5x capital-ring ratio, Wellspring fairness and
   spacing, adjacency only through shared segments, and a connected graph. The graph also stays
   2-connected, and every barrier has a way around within 4 hops (ridges) or 6 hops (regions).
   Medium 2-nation maps cost 0.8 more hops and 4.8 more days between capitals.
4. **It is noticeable at every zoom and in every mode.** Barriers are drawn by shape, not by hue.
   Peaks are snow-capped massifs, meres carry ripples, and ridges are sawtooth chains. Two tones
   (ink and snow) reach at least 4.3:1 contrast on every fill (measured). Map modes never tint
   impassable terrain.
5. **The map is a painted linen campaign cloth.** It is pinned with brass tacks to an oiled
   quarter-sawn white oak table, in a tavern seen from above: floorboards, a rug, the hearth's glow
   on one side and a window's daylight on the other.
6. **The sheet stays flat, orthographic and neutrally lit.** Warm light falls only on the room
   and the table. The camera "leans back" by zooming out past the sheet to show the table and
   room. There is no tilt and no blur on the map.
7. **Props mirror the chrome; they never inform alone.** The month candle burns down as the month
   passes. The hourglass lies on its side while paused. The coin purse fills with the treasury. No
   prop is clickable in M1.
8. **The chrome turns to dark oak, brass and parchment.** Panels become dark oak (`--chrome-*`
   retuned to warm browns, with text at 9.7:1 to 13.4:1). Brass keylines and corner brackets mark
   action buttons and docks. Cards carry parchment faces with ink text (12.8:1). Tooltips stay
   dark, because the owner approved them.
9. **Ambience is slow and has an off switch.** Candles flicker ±4% below 1.3 Hz, and the hearth
   breathes on a 6 s cycle. Reduced motion freezes both. Settings → Interface gains "Table: Full /
   Simple / Off". Ambient sound waits for M2.
10. **The painted map gets terrain stamps.** Forest crowns, hill hachures, low passable peaks,
    reeds and pools, field patchworks, cracks and stones, grass tufts. They are seeded per province
    and kept out of the label-and-badge core. Under fog and in map modes, stamps carry terrain
    identity that the hazed fills lose (a 20% haze already drops Hills/Wasteland to 18.7, measured).
11. **Armies are painted miniatures.** A figure stands on a round base, and a shield plaque in the
    allegiance shape carries the count. At Far zoom only the plaque remains. Unscouted enemies
    show a cloaked figure with the strength word, the way a Columbia block shows its back.
12. **Settlements grow from state already in the sim.** Population sets the tier (5 tiers, 1 to
    22 houses, placed center-out so growth never reshuffles). PD raises a watchtower, then a
    palisade, a stone wall, a gatehouse. Temples, labs and forts are landmarks in the owner's
    architectural kit.
13. **Alignment repaints the land.** The dominating nation's *land look* (a wash capped by the
    palette test, plus motifs) grows with dominion strength. Cinder Horde brings ash, ember cairns
    and charred stumps; Thornwood brings blossom, brambles and elder trees. Each scale pole adds its
    own motifs per effective step. A future nation needs only a land-look record.
14. **Scars and blessings show events.** Siege camps and wall cracks, pillage smoke, battle scars
    that fade over 180 days, and ritual marks from the pretender design's map model (Burn the
    Fields, Ash Rain, Fertile Season, Rootwall). Every visual uses only what the viewer may see.
15. **Slow looks repaint calmly.** Growth and alignment repaint at most once a month, with a
    600 ms brush wipe, at most 8 animated per month end. Events show at once, because they are
    information.
16. **Only two optional fields of new state.** `ProvinceState.heldSince` (roads and a "held for"
    line) and personal names for commanders are M1-should. Everything else derives from existing
    state.
17. **Every commander gets a seeded portrait.** It is a layered SVG bust, keyed by
    `${seed}:${commanderId}:${slot}` with rendezvous picks over append-only part tables. The seed
    picks the face; state picks only the overlays and frame (wounds, halo, crown, pip ring, holy
    mark). Pretenders and summons use their rig's portrait pose.
18. **Owner-made raster portraits are a premium layer.** They go through `art-inbox/`, are used
    only when a type's set is complete (8 images, 12 for independents), and carry a provenance
    sidecar. State shows on the frame only.
19. **Placement keeps the game playable first.** Phase 1b lands impassable terrain. Phase 8 ships
    flat fills plus impassable art plus the Simple table. Phase 11 brings stamps, settlements,
    alignment and portrait parts. A scope guard, a cut order and a "Map detail: Full / Reduced"
    setting protect the playable game.
20. **The mockup brief has 16 ordered steps,** ending with a time-lapse slider so the owner can
    watch a province grow and change hands over four years.

## Where I draw the line, and why

| Pushed this far | Stopped here | Why |
|---|---|---|
| The map is a physical cloth on a physical table in a physical room | The sheet never tilts, curls, folds or blurs | Label layout (`layoutMapLabels`), hit areas and the province shapes must stay exact. CK3 keeps its paper map flat, and some of its players turn the table texture off (`research-tabletop.md` 2.9). |
| Warm candle and hearth light | No warm grade on the sheet beyond 8% at 2700 K, and no vignette on the sheet | 15% at 1900 K or a 30% vignette breaks the terrain palette rule (measured in `research-tabletop.md` 4.3). |
| Props that mirror state (month candle, hourglass, purse) | Props never carry information alone and are not clickable in M1 | One home per command (`docs/07` principle 4). Information must not depend on zoom. Clicks in the margin while panning would misfire. |
| Wood, brass, leather and parchment in the chrome | No texture behind text. Tooltips stay dark. Mana colors never decorate chrome | Texture costs legibility (Talisman de-hazed, Total War dropped wooden panels). The owner approved the tooltips as they are. |
| Painted miniatures on bases | Numbers sit on flat plates. Figures are at most 46 px tall at Mid. Stacks fan as before | Miniatures read through contrast, not detail. The badge box stays within the label budget. |
| Land repainted by alignment | Shapes carry the meaning. Washes are capped per nation by the palette test (Cinder 12%, Thornwood 8%). Motifs ghost to 25% in modes | A stronger wash merges terrains for color-blind players (measured: Thornwood moss at 12% gives 10.8 under protanopia). Total War players modded corruption paint down. |
| Growth over time | Slow looks change at most monthly. No reshuffles: growth adds pieces and decline removes the newest | Civ VII's sudden house swaps were disliked. A calm map does not distract. |
| Impassable terrain everywhere it adds strategy | About 8% of the map area and 5% of borders. No barrier within 2 to 3 hops of a capital. No cut province. Detours capped. No flying exception and no passes that open or close in M1 | Fronts stay short, starts stay fair, and the AI needs no new code. A flying exception would give the sim a second adjacency. |
| Portraits for every leader | State never changes the face, only overlays and the frame. Raster art only in complete sets | "My Ash Chieftain, now wounded" must stay the same person. Mixed art styles in one type look like two games. |
| A living tavern | No ambient sound, no time of day, no animated people | M1 scope allows only battle SFX. The sim has no time of day, and a day/night cycle would recolor the map. People would compete with the map. |
| New sim state for "over time" | Only `heldSince` and personal names, both M1-should | The renderer derives everything else, so saves, hashes and the AI stay untouched. |

