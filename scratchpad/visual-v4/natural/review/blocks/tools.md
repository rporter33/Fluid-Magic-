| Tool (under `natural/`) | What it does |
|---|---|
| `tools/export.cjs` → `proto/data/` | exports the mockup's map and the relief bake's shared rasters (warped lookup, ids, hillshade, cast shadow, valleys, the Clear bake) |
| `proto/natural.py` | the natural bake, prototyped in numpy (the palette, both blends, every cover, the relief), with Lab mips |
| `tools/natpage.cjs`, `tools/patches.js` | inject the natural bake into the mockup in memory, plus the line, seat and label fixes; the page file is never changed |
| `tools/shoot.cjs` → `proto/renders/before-*`, `after-*`, `clearfixed-*` | the same views before (v4 as built, i.e. Clear) and after (Natural with the fixes), and Clear with the fixes |
| `proto/sheets.py` → `proto/renders/sheet-*.png` | the before/after sheets, beside ref-2 for look only |
| `proto/metrics.py` → `renders/metrics.json` | value, chroma, coarse busyness and province-scale patchwork, against ref-2 and ref-4 |
| `proto/cover_share.py` → `renders/cover-share-60.out` | each province's own-terrain cover on 60 mapgen maps (5,100 provinces) |
| `proto/classify.py`, `proto/lighttable.py` → `renders/classify.json`, `lighttable.out` | lightness-only and texture-only terrain classifiers at five zooms and four visions |
| `calc/rails.ts` → `calc/rails.out` | the band rule for the lit-bead rail on natural grounds, 26,950 cases per coverage |
| `tools/measure-lines.cjs` + `calc/lines.ts` → `proto/lines/*-report.json` | rendered-pixel hairlines, internal keylines, rails, seat muting and snow, before and after the fixes |
| `proto/checks.py` → `renders/checks.json` | snow, fog, data modes, water and own cover on the mockup's map |
| `tools/hovercheck.cjs`, `tools/startzoom.cjs`, `proto/cliff.py`, `tools/bench.cjs` | hover names against day chips; the start zoom per window; the cliff face; the CPU cost of the natural pass |
