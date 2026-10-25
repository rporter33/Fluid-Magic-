
---

## 9. Mockup brief: changes to `ui-mockup/game-screen-v1.html`, in order

**Goal.** The owner should see and react to everything above in the clickable mockup:
- impassable terrain at three zooms and in every mode;
- the table and the tavern;
- map detail;
- growth over time by alignment;
- portraits everywhere;
- the oak chrome.

**Constraints:**
- procedural art only (canvas 2D, inline SVG, CSS);
- no external images;
- Google Fonts allowed;
- scripts only from cdnjs with pinned versions (d3 7.8.5 is already loaded);
- everything seeded with the existing `mulberry32` or a string-hash variant, with no `Math.random`;
- every existing interaction (hover tooltips, nested terms, locks, alerts, outliner, feed, strip, right-click moves, keys, the phone layout) keeps working.

`sketch/table-sketch.html` in this folder has working canvas code for the oak, the cloth, every stamp, peaks, meres, ridges, settlements, motifs, miniatures and portraits. It can be lifted.

1. **Make room for impassable terrain without losing provinces.**
   - Generate **65 sites** instead of 60 (the 10 × 6 jittered grid plus 5 farthest-point extras, then the two Lloyd rounds).
   - Add a second noise function for wetness.
   - Choose **3 peaks** (highest `noise`) and **2 meres** (highest wetness minus `noise`). Each must be interior (no cell vertex on the map rectangle) and at least 3 Delaunay hops from both capitals. Meres touch no other region, and at most 3 peaks touch.
   - Remove the 5 regions from the province list, so the map keeps **60 provinces**. Name the range "the Ashspine" and the meres "Blackmere" and "Stillwater".
   - Add **7 ridges** on borders between Hills or Mountains provinces, or borders touching a peak. Each must be at least 2 hops from both capitals, keep both sides within 4 passable hops, and leave every province at least 2 neighbors.
   - `nbrs()`, `bfs()` and `pathTo()` use the passable adjacency only. Keep the existing story (Ashfen, Sunmere, Varo, Ilsa) by re-choosing those provinces after the regions are placed.
2. **Put the map on the table.** Draw, under the map:
   - the tavern floor: dark planks, a warm hearth gradient from the left, a pale window patch on the right, and silhouettes of a rug, a bench, a barrel and a sleeping hound;
   - the oak table: grain lines, ray fleck, a worn rim, brass corner guards, a candle pool and a rim vignette;
   - props in the margin: the month candle, the hourglass, a tankard, an inkpot and quill, dice, the coin purse;
   - the linen cloth: weave, leather hem, four brass tacks, a compass rose and a title cartouche reading "The Ember Marches".
   - Change `fit()` so the cloth fits the unobscured area with a **32 px oak band**.
   - Allow zooming out to **0.92 of the table's fit**, and clamp panning to the table.
   - The cloth stays neutral. Warm light falls only on the room and the table.
3. **Bake the static map.** Draw fills, grain, stamps, settlements, motifs, scars, regions, borders, bands and ridges into an offscreen canvas per zoom band (Far, Mid, Near by median province diameter: under 70, 70 to 180, over 180 px).
   - Pan and hover blit the bake. A band, mode, season or look change re-bakes.
   - Labels, miniatures, paths, the hover outline and selection draw live on top.
4. **Draw impassable terrain** as in section 1.8:
   - granite massifs with snow-capped peaks (2 to 3 centerpieces), a 3 px ink contour and a snow keyline;
   - meres in night water with shore bands, ripples and reeds;
   - ridges as an ink spine with a chain of light peaks, drawn above the bands;
   - italic names.
   - Hovering a region opens its card. Right-click on a region shows the ✕ cursor and the toast "Impassable: the Ashspine". A right-click to a province behind a barrier shows a path bending around it, with "around the Ashspine" in the toast. When the way around is blocked by hostile land, the toast names both, as in section 1.8.
   - Add a seventh mode button, **"Passability"**, for the review only. It hatches every province you cannot reach from Varo and outlines the barriers.
5. **Add terrain stamps** with the 3.2 table's shapes, colors and Far / Mid / Near counts:
   - seeded per province;
   - kept out of the label core (a radius of max(26 px, 0.42 × inradius)) and the badge box;
   - drawn by bottom edge;
   - nested by rank across bands.
6. **Add settlements** with the 4.2 rules:
   - tier from population, houses on the golden-angle spiral, the kit by owner (Cinder soot and ember windows, Thornwood living roofs, independent thatch);
   - walls by PD;
   - landmarks: the capitals' fort, temple and lab, and **Sunmere's** temple under construction with scaffolding;
   - the Wellspring basins: Sunmere claimed by the Cinder Horde, with lit stones and the sigil.
7. **Add land looks** with the 4.3 rules:
   - the Cinder ash wash (12% × strength / 10) and Thornwood moss wash (8% × strength / 10);
   - the nation motifs by strength (Cinder ember cairns and charred stumps; Thornwood blossom and brambles);
   - the landmarks at strength 7 and up (the burning cairn, the elder tree);
   - pole motifs: Cinder Turmoil 2 and Fury 3 (overturned carts, war cairns); Thornwood Growth 3 and Wild 2 (blossom clumps, briars, extra trees).
8. **Add scars and events** with 4.4:
   - a battle scar at the province of the report's victory (churned earth, broken spears, a cairn), fading by time-lapse month;
   - a **siege camp** at one Thornwood border fort (tents, stake ring, ram, cracked walls);
   - **Burn the Fields** active on one Thornwood province (charred hatch and badge);
   - **Fertile Season** on Deepmoss (sheen and leaf badge);
   - pillage smoke where the example Cinder army pillages (make one of the existing armies pillage);
   - unrest looks on Ashfen (31: shutters).
9. **Replace the DOM badges with miniatures** (3.6):
   - the figure on its base, behind the allegiance plaque with the count, and the status corner glyph;
   - escorts at Near; plaques only at Far;
   - the cloaked figure and strength word for unscouted independents;
   - the brass selection ring.
   - Keep them DOM (or canvas) so hover, click, double-click and the fan still work.
   - The miniature's box is the badge box. Fix the label collision seen in the sketch by anchoring above the label (the current `sy − 62` offset).
10. **Portraits** (5.2 to 5.6). Write `portraitSVG(commander, size, state)` with seeded slots:
    - 4 head shapes, 6 hair, 5 beards;
    - headgear per type: chieftain horned helm, captain bark helm, priest hoods, adept circlet, magus peaked hood, druid twig circlet, scout hoods;
    - marks (soot stripes, moss);
    - skin and hair ramps per nation;
    - the backdrop on the banner tint;
    - frames by rank (oak, bronze, brass, gilded, pewter);
    - overlays: bandage below 50% HP, halo for the prophet, crown for the pretender, glowing eyes and a pip ring for mages, holy mark, dotted frame when out of sight, greyscale with a ribbon when dead.

    Use it in:
    - the strip at 72 px, replacing the letter tile;
    - the outliner rows at 28 px;
    - the commander hover tooltip header at 48 px;
    - the battle report's commanders' fates at 48 px;
    - a new **Portraits** button (page header) opening a gallery: every M1 commander type × 4 seeds, plus state variants (wounded, prophet, R2 mage, dead, out of sight), at 128, 72 and 32 px.

    The Titan pretender gets a crowned rig-style bust as a stand-in for the B.8 rig portrait. Give the commanders personal names (they already have them).
11. **Retune the chrome to oak, brass and parchment** (2.7):
    - `--chrome-0/1/2` to #2E2219, #3A2B1F and #4A3727; the old `--chrome-3` hover to `--chrome-2`;
    - an oak-bevel top bar with brass rivets and a brass bottom keyline;
    - docks with a 6 px oak frame, 14 px brass corner brackets and a leather spine;
    - action buttons with a 1 px brass keyline, navigation buttons ghost;
    - the battle report and Codex article on parchment with ink text, and mana symbols there with an ink ring;
    - tooltips unchanged except the brass keyline;
    - dim text never on leather.
12. **Make modes read with the detail** (3.9):
    - stamps ghost to 40% and motifs to 25%;
    - settlements and information marks stay full;
    - impassable regions are never tinted;
    - Dominion mode shows undominated provinces as desaturated terrain, not the current flat #3B3832, which would sit next to granite.
13. **Fog** (3.10). Make the provinces 4 or more hops from both capitals "unexplored":
    - linen haze, sepia line-art stamps, a dotted border, no settlement detail, population "unknown" in the tooltip;
    - make two explored provinces "out of sight" (desaturated 45%).
14. **A "Look" popover in the page header** (review controls, not game UI):
    - Table (Full / Simple / Off);
    - Map detail (Full / Reduced);
    - Season (summer / winter: rime on the stamps, a lower snowline on the peaks, a cool window and a brighter hearth);
    - Reduced motion (also honors the OS setting).
    - Under Full, run the ambience: candle flicker ±4% at about 1 Hz, the hearth on a 6 s cycle, at most 12 motes in the window light, the hourglass sand. Lay the hourglass on its side while the game is paused. The month candle follows the clock's day.
15. **A time-lapse slider in the page header**, "Y1 M3 ▸ Y4 M3" (0 to 36 months), that re-derives the example state by month:
    - Cinder dominion spreads one ring every 8 months, with strength rising by 1 every 4 months up to 7;
    - Thornwood's provinces grow at Growth +3 (pop × 1.011 per month), so their villages visibly become towns;
    - the province the Cinder army pillages in months 12 and 13 loses population (pillage takes 2% a day) and drops a tier, with smoke, then shutters and burnt roofs from its unrest;
    - Sunmere's temple finishes at month 2;
    - Kharnath's PD reaches 15 at month 20 (the stone wall);
    - Thornwood takes Ashfen at month 10 (the kit switches, the band changes);
    - the siege starts at month 24;
    - the battle scar fades out by month 6.

    Moving the slider repaints changed provinces with the **600 ms brush wipe** (at most 8 at a time, the rest instant; instant under reduced motion), and the room's season follows the month. This is the owner's "growth over time, based on alignment" made watchable.
16. **Check before handing back:**
    - no console errors;
    - screenshots at 1440 × 900, 1280 × 720 and a phone width, in Ownership and Dominion modes, at Far, Mid and Near, and in winter;
    - labels never overlapped by miniatures or tall stamps at the fit zoom;
    - panning stays smooth (the bake is blitted, not redrawn);
    - reduced motion stops every ambient motion;
    - the old interactions still work (hover, nested tooltips, T lock, alerts, outliner, feed, strip orders, right-click moves, Space, 1 to 4, Shift+1 to 6, M, F, R, H, [ and ]).

