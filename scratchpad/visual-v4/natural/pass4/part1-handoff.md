# Map pass 4, part 1: hand-off (paused 2026-10-25)

`../map/build.sh` builds a working `../map/game-screen-v4.html`, md5 `b3c755b3…` (copy: `part1/out/page-s10.html`).
Full notes: `part1-notes.md`. `?p4=off` restores the pass-3b page pixel for pixel.

## Build steps (design-final.md §14)

| Step | State |
|---|---|
| 0. Rebase on pass 3b, switch, controls, baselines | Done. |
| 1. World data and the Vast map | Done. Mockup map equals `final/p4world-r2.js`; Vast 34 regions, 4 rivers, 36 roads, 7 bridges. |
| 2. Seasons and the clock | Done. Frost stays a failing review control (no colour passes 20 / 12 against the snow). |
| 3. Fog as memory | Done. |
| 4. Rivers, bridges, roads, supply path | Done, after seven defects found by the inherited checks were fixed (notes). |
| 5 onward | Not started. |

## Parts

- New: `p00e-pass4.css` (9 lines), `p13-p4-world.js` (134), `p58s-seasons.js` (107), `p65-waters.js` (177), `p66-memory.js` (33),
  `p90a-pass4-checks.js` (100), `p90b-pass4-checks.js` (132), `p90c-pass4-floor.js` (52); `build.sh` lists them.
- Hooks in: p00c, p10a, p10b, p20, p30b, p58a, p59, p59a, p59b, p59c, p59x, p60b, p61, p62, p63, p80c, p80d, p80e, p87, p88.
  Over 3 lines: p59 (+10/−6), p59b (+9/−8), p10b (+7/−6). Largest part touched: p59b, 306 lines.
- Backup of the pass-3b state (parts, `build.sh`, page md5 `0ca3a196…`): `part1/before/`.
- Tools: `part1/tools/` (`lanes6.sh`, `lane8.sh`, `lanes10.sh` run the suites; `floorq.cjs`, `hoverq.cjs`, `failprobe.cjs` are
  the quick floor probes). Logs: `part1/out/final6/`, `final8/`, `final10/`. Shots: `shots/part1/` (all looked at).

## Check results

| Check | Result |
|---|---|
| `?p4=off` against pass 3b (Natural, Clear, phone, 1280, @2, Painted 10 views × 2 loads) | Pixel-identical |
| det4 determinism (3 loads Natural, 2 Clear, 2 Terrain mode) | Identical, 0 page errors |
| `p4Checks()` (regions, waters/supply data, determinism, seasons, memory, waters, supply); Vast data | Pass |
| `checksx` Natural 1×/2×/phone/1280/1920, Clear 1×/2×, Terrain 1×/phone, Dominion, Springs | Only pass-3b's own failures (readers; Dominion's harness ERR) |
| `modes.cjs` Natural, Clear; `focus.cjs` Natural (7 modes × 7 views) | Pass; 49 rows, 0 fails |
| `sweep.cjs` (wild edge, 16,904 samples) | 0 fails, min 1.135 (as pass 3b) |
| `session.cjs` Natural, real input | 0 page errors, 0 failed steps |
| LP probe `linesall.cjs` on the final page | Not finished at the pause (page s8: 1 hover sample, fixed since) |
| `checksx` on the final page | Phone done: only pass-3b's reader failures. 1×/2× stopped part-way at the pause (no new failure so far); 1280/1920 not re-run |

Frames: start view on/off differ only in the river's and bridges' boxes (9,225 pixels, 0 outside); 0 line pixels on water;
banks min 3.02 to 3.28; rails 0 fails at start, Near 250, Near 400 and M40; day chip "7d · ford +2"; supply path min 3.18:1.

## Findings that change the design

1. Bank lines need more than one key and alpha per bank: ground runs dark to light along a bank, and where the course leaves its
   border a sliver of the far side's ground lies under the line. Built: inner and outer slots per course segment, solved per
   position. The hover must keep the static bank's keys.
2. Bridges lie over the bank lines (clipped under the span); roads stop 5 px short of the line they cross; a rail meeting a river
   runs on to the bank (the inset vertex otherwise stops it up to 0.4 of an edge short); the hover/selection inner line clears
   the bank lines.
3. A river rising on a wild's corner starts 11 px clear of the wild's outline (the wild edge test reads the land 6 to 9.5 px out).
4. The inherited floor checks (p88, p89, p90 and the external LP probe) sample a river edge along its banks at 2.3:1, skip water
   and 8.5 px around it, and skip 4 px round a bridge span; the supply path is out of the check frames like the march thread.
5. Roads' "prefer a parent that does not cross a river" is not applied: it would leave 3 bridges, not the reference's 4.
6. Frost cannot pass the snow-distance rule; the best calm colour (#95CDF7) reaches 18.6 / 17.7. Off by default, review only.
7. At 1440 px the pinned clock covers the last two top-bar buttons (R, L), which scroll under it as designed.

## Owner decision recorded after the pause

2026-10-26: the owner chose **Q8 Option B**, the shared bake plus full-density Near terrain tiles.
Read [q8-review/decision.md](q8-review/decision.md) before scale step 8. This resolves the A/B choice;
the pool policy and new acceptance thresholds are engineering proposals, and no renderer or art was changed.
The steps and unfinished checks below remain in order.

## Next step for whoever resumes

1. On `part1/out/page-s10.html` (equal to the built page), run `part1/tools/lanes10.sh A`, `B`, `C`, `D` (the natural suites,
   `p4Checks`, Vast, `focus.cjs`, shots, session, `linesall.cjs`; they were stopped at the pause) and confirm only pass-3b's
   reader failures remain.
2. Run `node part1/tools/perf4.cjs after part1/out/page-s10.html` and `node part1/tools/perf4.cjs before part1/before/game-screen-v4.html`
   twice each, interleaved, on a quiet machine, and add the before/after table to `part1-notes.md`.
3. Record the findings above at the foot of `design-final.md` (its step 15 asks for that), then start step 5 (named regions).
