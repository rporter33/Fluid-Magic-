## Rulings

**N1. Two looks of one model, one rule set.** The relief model (map-relief §2), its light (§2.3), heightfield and hillshade (§3.2,
§3.3), wilds (§3.8), water placement (§3.6), miniatures (§6), labels (§7), fog rules (§9.1) and pipeline (§10) are shared. Only the
land's colour pass differs: Natural (§2 to §4 here) or Clear (map-relief §3.4 and §4 unchanged). Both looks come from the same
seeded CPU rasters. The game picks one by the setting and the mode.

**N2. The distinct-colours rule binds Clear and the Terrain mode, not Natural** (owner answer, item 3). In Natural, terrain is
known from three things: the drawing, measured by the classifiers of §5 with a floor in the tests; the hover card's terrain line
(§7); and the Terrain mode, one key away. The rule's text in docs/09 moves accordingly (§15).

**N3. Every other colour-blind minimum keeps its limit in every view.** That covers nation banners (unchanged), the rail band
rule (§8.1), the internal keyline and neutral hairline floors (§8.2), the wild contour (§8.3), mode colours against the wild
grounds (R16, unchanged, §9), the base rims, and snow kept off passable land (§10, defect 2).

**N4. A province's own terrain dominates its interior.** At least 70% of its area is drawn in its own cover, counting a plains or
hills province's copses as forest. At least 95% of its core (0.15 D and more from every edge) is its own, counting those copses as
its own. Copses cover at most 25% of any core. Measured on 60 maps (§3.4).

**N5. Natural carries no albedo law.** It has no province-mean budget, no mean-neutral pass and no gamut-correction pass: the
province-mean rule (map-relief V3, V5) is Clear's. Natural is held by the readability tests (§5), the chroma cap (OKLCH C 0.10),
the value range (§2.3) and N4.

**N6. Hue may vary inside a terrain in Natural** (fields of several crops, marsh pools, heath and turf). The v3 rule H1, "hue
never varies inside a terrain", exists for the 20 / 12 rule and stays with Clear.

**N7. Ownership is still the rails and the glow** (owner answer, item 1). The hover and selection tints and the inner line are
unchanged. The 8% Realm tint stays an option, off by default (§8.4).

**N8. The same seeded streams, a new purpose key.** The natural noise tables are `relief:${seed}:natural:${purpose}`
(map-relief V13): value noise on 256² tables and integer-hashed cells, with no `Math.random`, no `Date` and no transcendental in
any rule-bearing raster. The cover raster used by the N4 test is CPU and engine-independent. Colours are presentation.

**N9. Terrain is public, so the drawing reveals nothing.** Every natural material comes from the map, the seed and terrain,
never from state that fog hides (map-relief V17 holds: the bake is a pure function of the map).

