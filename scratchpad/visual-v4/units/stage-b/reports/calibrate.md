Stage B's calibrations are done and written up, using 24 of the 30 generations. The front-view commander route works for all six faces tried. The back view does not work yet. The rest is decided:

| Part | Generations | Decision |
|---|---|---|
| Commanders | 12 of 12 | Two steps: a Pro body sheet per kind from the commander maquette with its kit zones painted, then a Nano Banana 2.1 re-dress per face with its portrait. |
| Thornwood green | 2 | The packer's hue lock sets the colour. The prompt wording alone did not work. |
| Output size | 4 of 4 | Keep 1K for troop and commander sheets. Use 2K only for big-body cutouts. |
| Mount size | 0 | Fixed in the packer. |
| Separate mount and rider | 6 of 8 | Later, at stage C, by editing the joint sheet. |
| Troop variation | 0 | Adopt the shader approach. |

The only figures made were the War Wolf and its rider, as part of the Wolf Rider test. All fixes are in a sandbox copy of the tools; the shared tools and the repo are unchanged.

**1. Commanders (review change 5)**
- **Body sheets, front view:** the review's guess was right. Painting the kit zones on the maquette held the camera: the armoured chieftain went from 1 of 16 cells (bare maquette, in the review) to 14 of 16. Given the nation's troop sheet as a second reference, the robed caster and the hooded druid both reached 16 of 16.
- **Re-dresses:** two faces per kind (Ash Chieftain 06 and 03, Cinder Magus 03, Ember Adept 07, Elder Druid 08 and 05) all passed the gate of 14 of 16 or better.
- **Gate change:** a re-dress has to be measured against its body sheet's figure height. Otherwise a tall cowl or antlers fail cells whose camera is right (the Magus scores 9 of 16 one way, 15 of 16 the other).
- **Identity:** on the 4× crops, 25 of 36 marks read clearly, 9 partly and 2 not at all (Chieftain 06's cheek scar, Adept 07's circlet). Headgear, mantle and weapon carry every face; face-sized marks don't read at figure scale.
- **Back view:** the zones-only back body sheet failed (3 of 16). Re-dressing onto the existing troop back sheet held 13 of 15. The back body sheet still needs a test with the troop back sheet as a reference.
- **Cost:** about 325 generations for all 128 faces in both views, against the plan's 290.

**2. Thornwood green (change 9)**
- **Hue range:** set from the approved Warden sheet, which has its valley between browns and cloth at 90°. The lock uses hue 90° to 230° at chroma 0.02 or more, plus a band within 25° of the cloth hue for cloth painted too grey.
- **Results:** with the side keyline, the Warden reaches 38.0%, the teal edit 30.7%, and the two Longbow Hunter rolls 29.8% and 39.3%. The mask proof catches cloth only, never bark, leather, skin or wood.
- **Wording:** the review's words got the hue right but painted the cloth almost grey. "Bottle green" gave stronger colour but leaf-green hue. Production relies on the lock, with a gate of 30% side colour after it.
- **Problem:** the Longbow Hunter front failed the camera on both rolls (11 of 15, then 3 of 15). The tall bow is the likely cause, and its first stage B sheet needs a fix.

**3. Output size (change 8)**
- **2K:** the API accepts it, at the same token cost and about 30% more time. The camera drifted on all three rolls (13, 12 and 13 of 15, against 15 and 14 at 1K for the same jobs).
- **Detail:** 2K gains nothing at the game's 112 px close-zoom sprite size and only sometimes at 224 px.
- **4K:** untested. The one call failed with an HTTP 502 and the size cap was used up.

**4. Mounts**
- **Size:**
  - **Cause:** the packer's measurement cut off the wolf's legs, so the rider was drawn 1.56 times a man and the Wolf Rider stood 50.7 world units tall.
  - **Fix:** mounted figures are now measured head to paws and scaled so the rider is man-sized. The Wolf Rider is 32.7 units, which matches its maquette, and the Ash Rider is 39.7 units.
  - **Design conflict:** this departs from the design's 42 units for every size-2 rider. That rule in `battle-overhead.md` 3.2 needs updating if you approve.
- **Separate mount and rider:**
  - **Pro from split maquettes fails:** the lone wolf comes out in profile (1 and 0 of 16), the lone rider 6 and 0 of 16.
  - **The edit route works:** Nano Banana 2.1 edits of the camera-correct joint sheet give a lone wolf at 15 of 16, and a lone rider who comes out dismounted in the riderless cells.
  - **Match:** both halves line up with the joint figure and recombine into it closely, so camera, light and scale match.
  - **Cost:** about 9.6 generations per mounted unit instead of 5, or about 12 with a full on-foot sheet.
  - **Recommendation:** later, at stage C. Mount figures come after their portraits anyway, and the current rules have no unhorsing.

**5. Troop variation (owner note 1)**
- **Approach:** a small Pixi page draws one mesh per block (one draw call) with a shader that tints cloth, skin, metal and leather per figure. It adds shared stencils on the cloth (shield designs, crest tips, belts, sashes, hems), plus scale, lean, jitter and individual timing.
- **Variety:** neighbouring figures differ about twice as much as with the review's current variation. The cost is under 0.6 points of side colour, value margins stay at 24.6 L* or more below the ground, and no two neighbours are identical.
- **Colour-blind rule:** tint limits that allow both directions would cut the protanopia contrast between the two sides from 11.9 to 4.7. So each side's cloth only moves away from the other side's colour, which keeps the contrast at 11.9 and 23.6.
- **Exclusions:** commanders, creatures and gods get no tints, because they must match their portraits.

**Also found:** the keyer turned thin features black (antlers, staffs, spear shafts), 300 to 3,500 pixels per sheet including the pilot picks. That is partly why the spears looked black. The sandbox fix brings this to 0 to 127 pixels and stays under the edge gate. It and the mounted-height packer fix are ready to apply to the shared tools.

Prompts, jobs, raw sheets and per-sheet checks are under `stage-b/cal/` in the scratchpad; review images are in `stage-b/cal/review/`.

Files are in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/`:
- calibration.md
- cal/page/variation.html
- cal/sbx/tools/key.py
- cal/sbx/tools/pack.py