# Q8 decision: bounded Near terrain tiles for Vast maps

Date: 2026-10-26. Status: **Option B selected by the owner; implementation and device qualification pending.**

Owner instruction in this task: **“Go for option B”.** This resolves Q8's A/B choice.
The recommendation is B: retain the shared 2048 × 1280 landscape bake and add full-density
terrain tiles around the visible area at Near zoom. The previous Option A default is superseded
for this choice. The limits and test gates below are engineering proposals, not additional
owner decisions or claims of shipped behavior.

This review changes documentation and adds isolated review tools only. It does not alter
approved art, the map's `parts/`, battle sources, simulation, production rendering or phase order.
It belongs on the art workspace branch through a PR, never merged into the game branch.

## Evidence and its limits

Reviewed art snapshot: `8079614933de20a6116d59665ad2e530422e0fa9`.
The October 25 handoff and part-1 handoff establish that steps 0–4 are implemented; steps 5–10,
including the scale work, remain. The design's opening “nothing is built” describes its October 24
state, not the later part-1 state. No matching Vast/pass4 PR was returned by the connected search
during this review; this is not evidence about unpushed work.

| Evidence | Established meaning | Does not establish |
|---|---|---|
| 236 provinces, 242 cells, 661 edges; 4096 × 2346 prototype bake | Existing probe geometry and density | 270 provinces, eight nations, a tiled renderer |
| 26.6 s ready; 21.8 s full bake CPU; about 391 MB JS heap | Reported software Chromium prototype measurements | User-facing production load time or GPU texture memory |
| Quarter-size 1024 × 586: 2.5 s bake, 6.3 s ready | Reported overview-first opportunity | Option A's 2048 bake performance; Option B tile latency |
| 95.4 ms old least-zoom static; 10.2 ms cached Lean-back static | Reported real-path chrome-caching result; stored `out-leancached-vast.json` agrees | B's Near performance or end-to-end 60 fps |
| 56.2 ms first chrome draw; cached frames 0.4–0.6 ms, 1.5–2.2 ms with flush | Prototype scheduling/cache evidence | GPU upload stalls or mobile responsiveness |
| 270-province bake ~24 s; laptop CPU ~2.8 s; phone ~8–14 s | Design extrapolations | Measurements on those maps/devices |
| Exact texture accounting in `budget-results.json` | Byte arithmetic for stated formats/dimensions | Driver allocation, render-target duplication or device headroom |

Historical static medians varied about ±25% on four-core software raster. Heap, CPU rasters,
canvas backing stores, GPU textures and download bytes are different quantities; do not add
reported heap and canvas totals as if they were disjoint allocations.

The snapshot's README explicitly excludes screenshots/clips and some measurement dumps.
The Q8 Near-250 pair is a requested deliverable in design steps 8 and 10, not proof that a final
tiled A/B comparison already exists. See the visual-check record below for this review's status.

## Comparison

| Dimension | A: shared bake | B: shared bake plus Near terrain tiles |
|---|---|---|
| Terrain fidelity | About half the linear texel density on Vast; softer fine ground detail at Near | Restores density where a full-resolution tile is ready; approximately four times the texels per equal world area |
| Readability | Rails, vector water, labels and pieces remain separate | Terrain becomes sharper; this does not by itself fix labels, picking or contrast. All existing readability gates remain |
| Loading | Simpler single bake and overview path | Same overview/base first; generate/upload visible tiles lazily. Never wait for the whole tile set before showing or using the map |
| Cache | Shared bake/mips plus existing detail systems | Bounded pool, spatial selection, generation cancellation, apron continuity, state invalidation and disposal |
| Expected browser cost | Lowest upload/allocation churn | More draws/samples and uploads; warm reuse may be cheap, but boundary crossings, zoom changes and season changes can hitch. Needs hardware testing |
| Mobile | Lowest memory pressure | Smaller pool and Reduced fallback; a phone's high DPR is not permission to multiply texture dimensions or memory |
| 270-province scaling | Still needs wider IDs and palettes | Same ID work, plus tile generation must preserve deterministic map coordinates and current visual state |

Prefer B because the owner prioritizes the Near view's fidelity and it bounds high-resolution
work to the view. Do not replace it with a permanently resident full-resolution whole-map bake.
The shared bake is also the safe display while tiles are missing or memory is constrained.

## Memory accounting and coverage

RGBA8 is four bytes per texel. A 1024² interior with a 64-texel apron on **each** side is 1152².
The following uses decimal MB; the script sums the exact mip chain to 1 × 1.

| Allocation | MB | MiB where useful |
|---|---:|---:|
| Shared 2048 × 1280 bake, complete mip chain | 13.981004 | 13.3333 |
| One 1152² tile, no mips | 5.308416 | 5.0625 |
| Four additional tiles | 21.233664 | 20.25 |
| Six additional tiles | 31.850496 | 30.375 |
| Shared bake plus four / six tiles | 35.214668 / 45.831500 | — |

The existing approximately 59 MB map/table estimate includes other textures. Adding B gives
roughly 80–91 MB **if those other allocations stay unchanged**. The existing 16 MB transient
bake estimate would bring a simultaneous peak to roughly 96–107 MB before uncounted overhead.
Neither is a measured Vast total. Eight nations, viewport targets, fonts, seasons, CPU staging
and driver copies need their own accounting. The four 512² detail tiles already in map-relief
§10.3 are a separate detail system; do not accidentally replace or double-count them.

The 96 MB specification is explicitly for **Large, four nations, DPR 2**. B does not repeal it
or establish an approved higher Vast budget. Proposed Vast qualification ceilings: 96 MB
steady tracked map/table textures and at most 16 MB additional transient texture targets;
report actual process/GPU diagnostics separately and include every allocation in the ledger.

Four to six is a pool budget, not a universal coverage theorem. `check-budget.cjs` uses the
probe's 1.28 texels/world-unit and 176.4-unit median diameter, sweeping grid alignment:

- At Near 250, a full 1440 × 900 viewport can intersect 3 × 2 tiles; at Near 400, 2 × 2.
- Just inside Near (181 px), it can intersect 3 × 3; 1920 × 1080 can intersect 4 × 3.
- At 390 × 844 and Near 250/400, the conservative bound is 2 × 2; at 181 it is 2 × 3.

These are conservative geometric bounds before UI/map-edge clipping, not measured visible
tile counts. Cached-render overscan may increase demand. DPR changes sampling requirements,
not these world-space spans. Prioritize selected/central visible terrain; render the base
elsewhere. Measure coverage and seams rather than silently growing the pool to fill overscan.

## Proposed implementation contract

1. Keep the overview and shared bake available before and during tile work. Near-only tile
   requests, debounced at zoom transitions; no tile allocation just for Lean-back/Far/Mid.
2. Start Full detail with a maximum six-slot pool; use at most four on constrained devices.
   Count resident and in-flight output textures against that cap. Reuse or evict before a new
   allocation. Use one bounded generation job, cancel obsolete requests, and reject stale completions.
3. Keep the established coarse-pointer Reduced default. Recommend no additional B tiles in
   Reduced; support an explicit Full opt-in after qualification. Preserve every informational
   layer. Reduced/failure fallback must remain readable; this is a performance policy, not a
   reversal of the B decision.
4. Key tile data by map/seed hash, terrain-generator version, density and tile coordinates.
   Add season or remembered-land revision only if baked into that tile. Ownership, visibility
   and data modes preferably remain live composites. Never expose current land state through
   remembered fog; never reuse a stale variant after a map, season or viewer change.
5. Generate directly at the target world coordinates with matching noise/height/warp inputs.
   Do not build a hidden full-resolution whole-map texture to crop tiles from. Validate that
   the 64-texel apron covers the actual filter/relief support; enlarge only with revised accounting.
6. Blend tile/base edges without altering approved terrain colors, silhouettes or fine-detail
   rules. Tiles have no mip chain in this budget: leave Near before they require broad
   minification. Respect reduced motion and the existing band-transition behavior.
7. Dispose textures and staging on eviction/map exit; rebuild deterministically after context
   loss. Keep the existing CPU-map cache policy separate from the GPU tile pool.
8. Upgrade province-ID storage end to end before claiming 270 support: CPU Uint16-compatible
   values, RG8 low/high bytes or equivalent, nearest sampling and exact decode; a distinct
   off-map sentinel (proposed 65535) checked before indexing 512 × 1 owner/visibility palettes.
   Include wild cell IDs in the maximum-ID calculation. Array size alone is insufficient.

## Acceptance criteria before enabling B in the game

The inherited gates below remain binding. New numeric gates are proposed review targets;
failure requires optimization or the documented Reduced fallback, not weakening old tests.

| Gate | Measurable pass condition |
|---|---|
| Visual fidelity | Fixed seed/state/camera at Near 250 and 400: base-only, B and full-density reference. Inspect at native size on desktop DPR 1/2 and phone DPR 2/3. B recovers reference ground detail in ready interiors; no extra sharpening/noise or altered art |
| Tile seams | At every tested interior tile join, max per-channel RGBA8 difference ≤1 against the same-density reference in a 2-texel strip; inspect tile/base transitions during diagonal pans for visible discontinuities. Any larger tolerance needs explained evidence |
| Readability | Existing rail/line/wild-edge/water/fog/terrain-reader checks produce no new failures; names stay unobscured; selection and province hit IDs are identical with tiles on/off. Test Clear, Terrain and data modes |
| Isolation | Existing `p4Off()`/Painted baselines stay pixel-identical; no differences outside terrain composition for this change; simulation state hashes unchanged |
| Resident texture pool | Additional tile output ≤31,850,496 bytes Full, ≤21,233,664 for four-slot mode, including in-flight output; zero leaked tiles after exit. Show steady and peak whole-map ledger against proposed ceilings above |
| Cold/warm loading | Interleaved A/B runs (10 cold, 10 warm per device): p95 first usable overview no worse than A by max(100 ms, 10%). Tile refinement never blocks interaction; p95 visible-priority tile ready ≤500 ms desktop / ≤1000 ms phone after camera settles |
| Frame behavior | 1080p Full: p95 end-to-end frame interval ≤16.7 ms over a 60 s pan/zoom route on the agreed desktop test machine; no tile-induced main-thread task >50 ms. Report p50/p95/p99, dropped frames and GPU/upload time where supported |
| Lean-back | Preserve `p4Scale()` static ≤12 ms, settle ≤65 ms, cached frame ≤2 ms on its specified probes; no Near tile work while overview is active |
| Cache stress | 10 minutes repeated diagonal pans, band crossings, map changes and season/fog changes: pool never exceeds limit, no stale tiles, no upward retained-allocation trend; exercise context loss/recovery and explicit Reduced toggle |
| 270 IDs | Actual 270-province map plus wild cells: all pick/render IDs agree; exercise 254/255/256/269 and off-map sentinel, both palette endpoints, save/load and viewer change. Repeat 2-nation and 8-nation presentation cases; no byte wrap or palette alias |
| Coverage | Report ready full-density visible-area percentage and uncovered regions at 181/250/400 px, 1440 × 900, 1920 × 1080 and 390 × 844, all grid alignments in the route; base is always complete. Any claim of full coverage must be supported, not assumed from six tiles |

Use real Chrome/Edge and Firefox on a desktop with an integrated GPU, plus Safari on a real
iPhone/iPad and Chrome on a representative Android phone for the mobile path. Record exact
hardware, OS/browser, renderer backend, resolution/DPR, build commit and thermal/power state.
Viewport emulation is only layout evidence. Agree the named reference machines before treating
the proposed latency/frame thresholds as release qualification. Repeated runs should be
interleaved and quiet; retain distributions and failures instead of reporting only a best run.

## Review tools, results and remaining work

`node check-budget.cjs` passes: exact mip/tile byte arithmetic, 270 synthetic province IDs
plus distinct sentinel, and a coverage counterexample to an unconditional six-tile claim.
Its RG8 arithmetic test is not a test of the actual CPU raster, GPU shader or picking path.
`budget-results.json` is the reproducible output. No game test suite was run for this isolated
documentation/probe change; no game or in-flight mockup source is edited.

`compare-density.cjs` is an isolated visual runner using the archive's existing debug mip hook.
It compares mip 1 (2048 × 1173 for this probe's aspect ratio) with mip 0 (4096 × 2346), on the
same full bake and camera, at 250/400 px on desktop and emulated phone. This isolates the
density potential; it is **not** an independently baked exact 2048 × 1280 A implementation,
a B cache, a tile-seam test, or a loading/memory benchmark. Both retain the existing live
detail and overlays. Offline fallback fonts are held constant.

**Visual run blocked; no new screenshots were produced or visually inspected.** The archived
Vast page built successfully (965,096 bytes). The runner passed `node --check`, but Chromium
141 / Playwright 1.56.1 could not launch in this execution environment: `socket() failed:
Operation not permitted` in `process_singleton_posix.cc`, followed by SIGABRT. No browser
metrics or visual success are claimed. The runner still requires execution on a browser-capable
machine; syntax checking is not end-to-end validation.

Actual A/B visual acceptance, production GPU memory, tile loading, real phones and
270-province integration remain unverified. The archived screenshot pair is unavailable in
this snapshot. The current fidelity conclusion is therefore density-based, not an observed
art verdict. Do not use this record to mark the visual acceptance gate passed.

Build SHA-256: `7575e658d83ff4508be7ac92de02cfc710913b33685bd7af4d84a9d473eb3cfb`.
D3 7.8.5 input SHA-256: `d6b03aefc9f6c44c7bc78713679c78c295028fa914319119e5cc4b4954855b1c`.
The generated HTML and downloaded dependencies are not included in the change.

Reproduction (from repository root, with Playwright/Chromium and D3 7.8.5 available):

```sh
node scratchpad/visual-v4/natural/pass4/q8-review/check-budget.cjs
sh scratchpad/visual-v4/natural/pass4/vast/build.sh
node scratchpad/visual-v4/natural/pass4/q8-review/compare-density.cjs \
  scratchpad/visual-v4/natural/pass4/vast/game-screen-v4.html \
  /path/to/d3-7.8.5.min.js /path/to/evidence
```

Next implementation step: after the existing part-1 verification and ordered pass-4 work,
build a separate bounded tile experiment, run the gates, and update authoritative game
specifications via their own PR before integrating the renderer. Do not merge the art storage
branch into the game. This record resolves Q8 without approving unrelated owner questions.

## Sources

- [Pass-4 design §§7, 12, 14–15](../design-final.md), including the 236-province measurements.
- [Feasibility review §16](../review-feasibility.md), corrected tile accounting.
- [Stored cached Lean-back result](../review-feas/out-leancached-vast.json).
- [Part-1 handoff](../part1-handoff.md), completed work and remaining tests.
- [October 25 game handoff](https://github.com/rporter33/Fluid-Magic-/blob/claude/gifted-meitner-v8l3qv/docs/HANDOFF.md).
- [Map relief §§10.3–10.4](https://github.com/rporter33/Fluid-Magic-/blob/claude/gifted-meitner-v8l3qv/docs/design/map-relief.md).
- [Architecture performance targets](https://github.com/rporter33/Fluid-Magic-/blob/claude/gifted-meitner-v8l3qv/docs/06-architecture.md).
