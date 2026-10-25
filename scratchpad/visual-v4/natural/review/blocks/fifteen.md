## The design in fifteen lines

1. **Natural is the default look of the land.** Muted, low-key materials blend across province borders. Terrain is read from
   what is drawn: canopy masses, field strips with hedgerows, open grass with copses, rolling umber heath, grey-blue rock and
   scree, olive marsh with pools and reeds, and cracked dusty scrub.
2. **Clear terrain colours** (Settings → Accessibility → Terrain colours: Natural | Clear) shows exactly today's v4
   colour-blind-safe bake in Ownership mode. **The Terrain map mode** (the seventh mode, Shift+7) shows the same bake in any
   session, with its baked relief and detail as the mode's second channel. Both keep every v4 check.
3. **Hovering a province always names its terrain.** The name's line carries a terrain chip: a 12 px swatch in the Clear
   fill, the terrain's glyph (seven new icons) and its word. The card's separate Terrain row goes, so the terrain is said once.
   The same holds in the province card, army card, link chips and the screen-reader name, in every mode, fog state, zoom and
   look, and on touch.
4. **The palette is near the references' measured numbers.** Forest is L\* 19, grass 43, fields 48, heath 36, rock 31 with lit
   faces to 51, marsh 34, scrub 53, water a dark teal. No pixel of the bake is above OKLCH C 0.089 (the most chromatic
   material, light grass, is 0.092; the cap is 0.10). The value range is ref-2's.
5. **Two blends, one landscape.** The ground colour blends over σ = 0.12 D (the height blend the bake already makes). The cover
   blends over σ = 0.04 D with noise, so canopy, fields and features interfinger across the v4 warp's ragged edges.
6. **Each province still shows its own terrain.** On 60 mapgen maps the minimum is 71% of a province's area (median 94%). Its
   core (0.15 D in) is at least 98% its own, counting a plains or hills province's copses as its own.
7. **Measured without hue, the terrain still reads, on this map and across maps.** A lightness-only reader names every
   province of this map at every zoom in every vision, and 98 to 100% when trained on one map and tested on another
   *(review)*. Patches score 93 to 99% from Far to ref-2's zoom and 87 to 88% at Near. With the mean lightness removed
   (texture only), patches score 79 to 94%.
8. **Rails keep the band rule on the natural ground.** The lit-bead rail passes every natural case, the frontier hem, the
   corrected fog and the Realm tint option included (38,500 and 77,000 cases, *review*), solid and with its keylines at 0.75
   coverage. The two pale banners need the banner line at 2 px below device pixel ratio 1.5. On rendered pixels: 0 rail
   failures in every view.
9. **Hairlines and internal keylines are continuous and follow the ground under them**, in both looks. Each edge keeps one
   keyline along its whole length; its alpha follows the ground, and where it cannot reach the floor against one side, a
   partner line of the other keyline runs beside it on that side. The draft chose the keyline per segment, which flipped it
   along 13 of 73 natural edges (30 of 73 in Clear) and read as dashes, and dashes mean fog (docs/07) *(review)*. On rendered
   pixels, hairlines are 0 under 2.3:1 in every view in both looks. Natural internal keylines are 3.16:1 at worst. Clear's
   internal keyline improves from 1.21 to 2.55:1 at worst and stays open (§8.2).
10. **Fog in Natural is visible and keeps the value code.** Unexplored land takes a 6% gesso haze plus 40% desaturation (hem
    12%), and out-of-sight land 25% desaturation: ΔE 3.8 to 6.8 from land in sight, against 1.6 to 2.2 approved. The draft's
    10% haze lifted forest from L\* 19 to about 27. A lightness reader that learned the key on explored land then misread
    22% of unexplored provinces at Far *(review)*. Clear and the Terrain mode keep the approved 4% and 10%.
11. **Data modes keep their own opaque raster,** identical in Natural and Clear. Drawing them translucent over the landscape was
    measured and rejected: adjacent ramp stops fall to 0.1 apart under a colour-vision deficiency.
12. **The verifier's eight remaining defects each get a fix.** Hairlines, snow, the hover name over a chip, the cliff, the
    start zoom and the split files are closed or measured. Clear's internal keyline and the hamlets' muting stay open for the
    build's pixel checks, with a fallback stated for each (§10).
13. **Look against ref-2, at its zoom:** the natural land alone has 3.7% of province-scale patch edges over ΔE 15. Ref-2 has 4.3%,
    and the Clear land 18%. Its median L\* is 32.5, against ref-2's 32.8 and Clear's 39.5.
14. **Cost:** in the game the covers and materials are GPU passes from the same seeded tables, so nothing new runs on a phone's
    CPU at load. In the mockup the natural colour pass is about 2.1 to 2.4 s of CPU (the cover blend at half resolution), so
    the default bake goes from 5.6 to about 4.6 to 4.9 s. The second bake is made only when first needed. GPU memory is at most
    73 MB against docs/06's 96 MB (v4: 59 MB).
15. **Docs:** the docs/09 distinct-colours rule moves to "Terrain mode and Clear". The natural palette, blends, covers, fog
    values and line rules become docs/09-balance rows. docs/09 gains seven terrain icons and a mode icon, and docs/07 gains the
    mode, the key and the Accessibility setting. The tests are listed in §14.

---

