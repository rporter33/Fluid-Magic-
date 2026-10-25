# Pickup guide (paused 2026-10-25, resuming Thursday 2026-10-29)

The session paused at a clean point to save usage. Nothing is half-applied: the game branch builds and passes its
gate, and both mockups build from their sources. This page says where everything is, what each track was doing, how
to resume it, and which decisions are the owner's. `docs/PROGRESS.md` stays the record of finished work.

## Where everything is

| What | Where |
|---|---|
| Game code and the docs (the spec) | this branch, `claude/gifted-meitner-v8l3qv` |
| Art and mockup workspace: 833 generated images (originals), packed atlases, the battle and map mockups' sources, tools, plans, critiques, reports and handoff notes | branch `claude/art-workspace` (storage only, never merged). Its `README.md` explains the layout and `restore.sh` puts it back in a session's scratchpad |
| **Art gallery** (everything approved, for sharing) | https://claude.ai/artifact/2naivdtCGfwiZnnAa1Gqtd |
| Battle mockup (v6, with the approved magic pilot) | https://claude.ai/artifact/9N3xAjDepZNfKB4KnrPs4D |
| Game-screen map (v8, pass 3b with soft wild edges; pass 4 not yet published) | https://claude.ai/artifact/J9d2JrQYGEhYyfbZyq3uAV |
| Magic pilot (approved 2026-10-25) | https://claude.ai/artifact/47Psan2xdhkNw8CUZAbY4r |
| Stage B review, stage C review, lineup by size | https://claude.ai/artifact/5prV7k1rd8GbmDvcBmgnjb, https://claude.ai/artifact/UsNsy2gbBS7uiA6VA1YaXi, https://claude.ai/artifact/L5rNYaE838n8aTfNd9TjTU |

The published pages are private until the owner shares them from each page's Share menu.

To restore the workspace in a new session:

```sh
git fetch origin claude/art-workspace
git worktree add /home/user/art-ws origin/claude/art-workspace
/home/user/art-ws/restore.sh
```

Paths below that start with `visual-v4/` are inside the restored scratchpad.

## The tracks

### 1. Game code

- **Done:**
  - Phases 0 to 7;
  - Phase 1b (impassable terrain);
  - Phase 6b.1 to 6b.3 (pretender design, battle rules, chassis);
  - Phase 10 S1 (battle detail sink);
  - Phase 5's spell-effect data (`content/fx.ts`);
  - Phase 9's save load check;
  - Phase 1's hardening.
- **Last full gate:** 2338 tests in 139 files, CI green at d649f12. The commits since are docs only.
- **Next in `docs/10-milestone-1.md` order:** Phase 8, the UI. The map and battle mockups feed it, and the owner sets
  the order (decision 8 below).
- **Carried into Phase 8:** the autosave alternation between `autosave` and `autosave-prev` (`docs/06`), and
  `aiPower` joining `armyPower`.

### 2. Painted art, stage D: animation and magic (owner review 3)

**Done:**
- The magic pilot, approved 2026-10-25 with every recommended answer. Its rules are in `docs/12` S2.10 ("As approved
  in the magic pilot") and its numbers in `docs/09-balance.md`.
- The art for the rest of stage D:
  - action poses for 32 painted figures, both views (the 26 big creatures and gods, plus the Thornwood colour
    versions);
  - 8 effect sheets: flame tongues, fire breath, bark, the loam breath, holy light, the sun glyph, darkness ripples
    and rage veins;
  - the Ash Rider front view re-packed at the right size.
- Stage D has used 164 of its 210 generations. The image credits ran out at call 135 (HTTP 402).

**Held back** (code stands in until a redraw):
- seven front views painted facing away: four wind-ups, two casts and one Giant follow-through;
- two Giant back-view falls that don't buckle;
- the Elder Wyrm's front death.

The Elder Wyrm is the weakest figure: its back bite and trample are close to its standing pose.

**In flight (stopped before any motion code; the mockup is unchanged):**
- `visual-v4/units/stage-d/anim-work/split-src/`: the mockup's modules split under 400 lines, with the light code in
  its own module. The timeline is identical; the pixel comparison is not yet run.
- `visual-v4/units/stage-d/anim-work/rebundle-ashrider/`: the Ash Rider re-bundle.
- `visual-v4/units/stage-d/anim-tools/`: the tools.

**Resume:** read `visual-v4/units/stage-d/anim-handoff.md`, then `art-report.md` ("What the code part needs").
1. Copy `split-src/*` into `src/`, run `python3 build.py`, and run the pixel-hash guard. It must report 0 differing
   frames.
2. Move the mockup's assets to separate files, loaded per battle.
3. Load the action cutouts with their mesh weights.
4. Build the big-body mesh rig.
5. Write the motion per body type, with the held-back frames covered.
6. Upgrade the small figures.
7. Add the `?gallery=figures` mode.
8. Write the animation checks, look at everything, and fix what looks wrong.

After the animation: the other nine spells and the creature abilities (art plan 7.3 and 7.4), an art-director
critique and fixes, then the "Animation and magic" review page.

**Re-rolls once credits are topped up:** `art-report.md` section 4 has the steps. Start with the 12 suggested
frames; the reserve is 16 generations.

### 3. Map pass 4: the mid-game record's overworld

**Part 1 is done:** `design-final.md` steps 0 to 4.
- the pass-4 switch;
- the world data (regions, rivers, fords, roads, bridges, the supply path);
- seasons in the natural look;
- fog as memory ("as of Y1 M3");
- rivers, bridges, roads, fords and the supply path drawn by rule.

The full check run found seven line and edge defects, all fixed. `?p4=off` still reproduces pass 3b pixel for
pixel.

**Resume:** read `visual-v4/natural/pass4/part1-handoff.md`.
1. Finish the check runs that were stopped (`part1/tools/lanes10.sh` A to D, and the LP probe).
2. Time `perf4.cjs` before and after on a quiet machine.
3. Write part 1's findings at the foot of `design-final.md`.
4. Build steps 5 to 8: named regions, the Lean-back band, the late-game tools and the Great Working, the Vast map.
5. Build steps 9 and 10, plus:
   - the skills-audit map items (cache by zoom band, amortized bake, keyboard path, Codex modal focus, focus vs
     hover, touch targets, viewport meta, aria-pressed);
   - the camera rules in `natural/pass4/spec-additions.md`;
   - deeper bays so the Greyteeth stops reading as a block.
6. Verify, publish to the map page, and put the eight questions below to the owner with screenshots.

## Decisions for the owner

Answer any of these before Thursday, in this chat or in a note; each has a default the work follows until then.

1. **Image credits.**
   - Top up the image generation credits for the 12 suggested redraws: the Elder Wyrm's front death, front trample
     and back bite; the seven front views painted facing away; the two Giant back falls; the Titan's cut-off sword
     tips.
   - Default: the code stand-ins stay.
2. **Four subjects not yet picked:** Salamander 02, Treant 04, the Living Monolith and the Cinder Idol.
   - They stay as painted, and they now have action poses too.
   - Default: keep them.
3. **Winter frost on the map.** No frost colour passes the snow-distance rule. The closest one shows as saturated
   blue patches. Default: no frost (map question 2), and drop the frost control.
4. **Roads that cross rivers.** The design says to prefer roads that do not cross a river. Applying it leaves 3
   bridges on the mock map instead of 4. Default: apply it.
5. **The pinned clock at 1440 px wide** covers the last two top-bar buttons, which scroll under it, as designed.
   Default: accept.
6. **The map's eight pass-4 questions** (`natural/pass4/design-final.md` section 12). The build follows each
   default:
   1. Realms as a light banner wash at the zoomed-out view only, keeping the rails and faint lines. Default: yes.
   2. Winter frost on passable land. Default: no frost.
   3. Fog as memory, with looks and card values from the last sight, dated "as of" (needs a last-seen record per
      nation in the sim). Default: yes.
   4. One army token per region per nation at the zoomed-out view, with a count plate from 4. Default: yes.
   5. Rivers and bridges drawn now, roads only in Supply mode, on hover or selection, and at Near. In the game they
      arrive with their rules (M2). Default: yes.
   6. Region names: at the zoomed-out view and at Far, at most 6 in view, quieter than capital names, none on the
      phone. Default: yes.
   7. Departures from the mid-game record (rails kept, light lettering, haze for unexplored land, a season glyph on
      the clock, the Working's chip in the alerts ribbon, no eye glyph on scouts). Default: as listed.
   8. Vast maps: one 2048 × 1280 bake on every device, about half as sharp at Near; the alternative costs 21 to 32 MB
      more. Default: one bake.
7. **Still marked "later" by the owner:** own weapons for every other commander face, and mounts painted apart from
   their riders. Default: later.
8. **Order on Thursday.**
   - Default: stage D animation first (the owner's art order: animation, then magic, then review 3).
   - Then map pass 4.
   - Phase 8 code after both reviews.
