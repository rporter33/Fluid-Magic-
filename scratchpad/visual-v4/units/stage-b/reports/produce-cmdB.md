Production of the cmdB figures stopped before any image was made. Every call to the image API returns HTTP 402: "Your prepayment credits are depleted" (RESOURCE_EXHAUSTED). It started during cmdA's last run, around 08:38–08:48: cmdA's last 12 calls and both of the troops task's last 2 calls failed the same way. I tried at 08:55, then again after 10 minutes (09:06) and after another 20 minutes (09:27); all three failed in under a second. Credits only come back when the owner tops up the Gemini prepaid balance in AI Studio. Everything else is ready, so one command restarts the run once they do. The repo is unchanged.

**Generations:** 3 of 150 used, all failed with 402 and logged as "B cmdB: …" in `gen-log.tsv`. 147 remain. `stage-b/raw/cmdB/` is empty.

**Done:**
- **Elder Druid 05 and 08, front view.** These are the calibration's existing re-dresses, run through the cmdB pipeline and packed. Both pass every gate:

  | Face | Cells (body scale) | Inherit | Variety (march IoU) | Rim after | edgeDev | keyIn | Side share (keyline) | Value below ground | Identity ΔE | Marks |
  |---|---|---|---|---|---|---|---|---|---|---|
  | ED05 | 16/16 | 0.865 | 0.686 | 0.6% | 6.32 | 0.16 | 11.6% | 26.8 | 1.5 | 4 read, 2 partly |
  | ED08 | 16/16 | 0.962 | 0.752 | 0.6% | 3.57 | 0.27 | 12.9% | 27.5 | 2.8 | 6 read, 1 partly |

  Their atlases (tiers S and H, 36 frames each) are in `stage-b/atlas/cmdB/` as `elderDruid.S.0` and `elderDruid.H.0`, with per-figure files under `figures/`. Their contact sheet and identity board are in `work/cmdB/review/`, and I looked at both.
- **Thornwood marks:** the magenta key was leaving a pinkish cast on staffs, antlers and edges, the leftover the calibration noted. A new pass in the pipeline turns about 600–880 pixels per frame back to brown; all gates still pass, and ED08's rim measure fell from 1.4% to 0.6%.
- **Identity marks** written for all 64 faces from their portraits and sidecars, each flagged for whether it shows from behind.
- **Bodies checked:**
  - Druid front 16/16.
  - Scout front 14/16 (cmdA's body laid on magenta).
  - Scout back 13/16: this is cmdA's levy back laid on magenta. As cmdA keyed it on blue it scored 14/16, so re-keying alone lost a cell.
  - Levy front 16/16 and back 14/16, used for the mountaineers and reedmen.
- **Prompts written:** 3 body edits (Warden Captain front and back, druid back) and 86 re-dresses. The other 40 re-dresses (Warden Captains in both views, and the Grove Priest, Sapling Druid and Elder Druid backs) are built automatically once their bodies exist.

**Route chosen (calibration plus review change 7):** Thornwood stays on the magenta key, so the green- or blue-keyed bodies the faces are painted onto are first laid on magenta. New bodies are Nano Banana 2.1 edits of sheets that already pass the camera check, not new Pro sheets from the maquette, because cmdA's Pro bodies failed 6 times out of 10. Scouts, mountaineers and reedmen are re-dressed straight onto existing bodies with the kit changed in the same edit, as cmdA did for its hunters. Commanders get the side keyline and are gated at 10% side colour like cmdA's; they are not hue-locked, so they keep their portraits' greens.

**Plan once the API works:** 3 bodies plus 126 re-dresses is 129 generations, leaving 18 for one re-roll per failing sheet. To resume, run `python3 cmdb_go.py` from the tools folder below. It skips sheets already on disk and stops the whole run at the first 402, writing `work/cmdB/STOPPED-402`, so it can't burn the cap in a failure loop.

**Not done:** all 126 other figure-views (62 faces in both views, plus the backs of ED05 and ED08), all body sheets, and the contact sheets and atlases for the other six groups. No portraits were made: commanders use their approved portraits.

Everything is in `/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/`:
- `work/cmdB/sbx/tools/` – the tools; `cmdb_go.py` restarts the run
- `work/cmdB/` – jobs, prompts, review images, results
- `atlas/cmdB/` – atlases and figure files
- `raw/cmdB/` – empty until generation resumes