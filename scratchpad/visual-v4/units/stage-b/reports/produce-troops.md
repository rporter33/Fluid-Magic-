Stage B troops are only partly done. 19 of the 28 troop sheets pass every automatic check, 8 failed twice and are reported, and the Thorn Militia front could not get its re-roll. The three banners are done. 13 of the 14 card busts could not be made because the image API stopped working partway through: two calls in a row came back HTTP 402 RESOURCE_EXHAUSTED, "prepayment credits are depleted". The commander agents were getting the same failures at 08:56, so I stopped generating as the task says.

**Generations: 46 of 80.** 44 worked and 2 were the 402 failures, all logged as "B troops:". By round: 25 first-round sheets, 15 re-rolls, 1 Warden front edit, 3 banners, 2 refused calls.

**How the sheets were made.** First rolls used Pro (`gemini-3-pro-image`) with three references: the maquette, a camera-correct sheet of the same view, and a style portrait. Re-rolls named the failure. Most re-rolls were Nano Banana 2.1 re-dresses or edits of a camera-correct sheet, as review change 7 recommends.

**Process notes:**
- Pro got the camera on only 13 of 25 first rolls. Its failure is either eye-level figures that are too big or the wrong background colour (white, grey or teal).
- The Wolf Rider and every other mount, creature and god figure were not touched.
- No prompt names another game, franchise, artist or studio, and the repo and the shared tools are unchanged.

### Sheets that pass
Columns: camera cells that follow the maquette / side colour with the normal outline / with the side-colour outline / how far below the ground in brightness (L*, the rule is 15).

| Troop | Back | Front |
|---|---|---|
| Ash Militia | 15/15, 21% / 53%, −16.8 | 15/15, 34% / 63%, −19.4 (re-dress) |
| Cinder Warrior (pilot sheets kept, re-keyed) | 14/15, 38% / 63%, −23.6 | 13/15, 37% / 61%, −24.2 |
| Ember Skirmisher | (reported, below) | 15/15, 21% / 39%, −17.6 |
| Flame Archer | 14/15, 24% / 48%, −22.5 | 15/15, 27% / 50%, −24.1 |
| Flamebrand | (reported) | 15/15, 10% / 36%, −20.8 |
| Thorn Militia | 14/15, 43% / 63%, −24.2 (re-dress) | (reported) |
| Warden | 13/15, 43% / 62%, −30.0 (edit: shoulder mantle and surcoat now the same in every cell) | 15/15, 28% / 47%, −26.1 (edit: surcoat over the chest, change 9) |
| Briar Guard | (reported) | 13/15, 20% / 38%, −26.0 |
| Light Infantry | 13/15, 0% foreign colour, −19.0 | 15/15, 0%, −19.5 |
| Heavy Infantry | (reported) | 13/15, 0%, −20.6 (re-dress) |
| Archer | 15/15, 0%, −18.9 | 15/15, 0%, −19.3 |
| Swamp Fighter | 13/15, 0%, −16.5 | 13/15, 0%, −17.7 (re-dress) |

Every passing sheet also has its rim at 1.7% or less after the rim fix, varied poses, a key-colour leak under 0.32% (the limit is 0.5%) and a soft-edge colour error under 7% (the limit is 8%).

### Failed twice: reported, best attempt kept as a flagged stand-in
1. **Ember Skirmisher back:** 10/15 cells, only 12.3 L* below the ground, and key green left in the javelin shafts (0.96%). The re-roll came out at eye level, 3/15.
2. **Berserker back:** 8/15 (re-dress). The first roll was 3/15.
3. **Berserker front:** the camera is fine at 13/15, but the side colour is 27% with the side outline on both tries, under 30%. The edit asking for broad war paint changed almost nothing.
4. **Flamebrand back:** 11/15 (the follow-through, the fall and both dead cells). The re-roll was 1/15.
5. **Briar Guard back:** 11/15, and the fall frame's colour is off (ΔE 19.7). The re-roll reached 13/15 but its standing figure faces the camera.
6. **Longbow Hunter front:** 9/15. No attempt has reached 13/15 in six tries across calibration and this stage.
7. **Longbow Hunter back:** 13/15, but the windup frame's colour is just over the limit (ΔE 12.7 against 12).
8. **Heavy Infantry back:** 12/15.

**Thorn Militia front:** 13/15, but the colour of the cheer frame differs from the stand frame (ΔE 13.5). Its one re-roll is the call the API refused twice.

### Done without generating
- **Banners:** all three are done (Cinder, Thornwood, independent). Each is keyed, rim-fixed and exported at 1024, 256 and 128 px with an 8×2 mesh-strip sidecar. Side colour is 82.5% (Cinder) and 83.9% (Thornwood), with no foreign colour on the independent one. They came out about 2.4:1, against the 3.5:1 I asked for; the strip works at any ratio above 2, so I flagged this rather than re-rolling.
- **Card busts:** only the kept Warden bust is exported (512, 256 and 64 px with a sidecar). On my bust measures the Warden reads only 4% side colour, under my 6% bar, and its crest sits 2.9% from the top edge. These measures are mine, so I left the owner-approved bust as it is. The other 13 have prompts and kit cards ready in `jobs/b1.json`; they only need running.
- **Atlases:** one per side at tier S (side-colour outline at 75%) and tier H (neutral outline), each a single page with hit-flash frames. Each has per-frame variation data (shield outline found on 11 Cinder and 12 Thornwood front frames), plus a metadata file per figure that records whether it passed or is a flagged stand-in.
- **Variation:** the shared stencils as an image, the variation limits (each side's cloth moves only away from the other side's), and a before/after proof for each side. Independents have undyed grey cloth, so their grey wool varies through the metal class instead.

### Things I changed in my copy of the tools (the shared tools are unchanged)
- I applied the calibration's thin-feature keyer fix, the rim fix and the Thornwood colour lock (90° to 230°, chroma 0.02, plus the band for cloth painted too grey). For banners only, the lock also skips pale areas, because it turned the leaf's shading cyan.
- **New keyer path:** when the model paints one flat non-key background, the keyer now keys against that colour. This rescued the white-background Briar Guard front.
- **Gate changes:**
  - **Scale check:** it now uses body height (a spear pointing down was failing it).
  - **Dropped bows:** a bow dropped on the ground is a thin shape, so it counts as present from 100 px.
  - **Colour consistency:** lying-dead frames are no longer compared with the stand frame, since a body face-down shows its other side.
- **Kits:**
  - Every troop now has the surcoat. The Berserker keeps his bare chest, with the side's colour as war paint.
  - The four independent kits are new.
  - Independents are keyed on magenta. Their side check is "no Cinder or Thornwood colour" (8% or less) plus the brightness rule.

Everything is in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/`:
- raw/troops/ (raw sheets with their JSON sidecars)
- work/troops/sheets/ (keyed and sliced work, one checks.json per sheet)
- work/troops/picks.json
- work/troops/results.json (the full numbers)
- work/troops/sbx/tools/
- work/troops/review/contact-cinderHorde.png
- work/troops/review/contact-thornwood.png
- work/troops/review/contact-independent.png
- work/troops/review/contact-banners-overlays.png
- atlas/troops/ (atlases, figures/, banners/, variation/)
- portraits/thornwood/warden/