#!/bin/sh
cd "$(dirname "$0")"
OUT=../../ui-mockup/game-screen.html
{ cat parts/p00a-head.html; sed -n '2,264p' parts/orig-css.txt; cat parts/p00b-css.css parts/p00c-body.html parts/p10a-icons.js parts/p10b-core.js parts/p12-edges.js parts/p20-time.js parts/p30a-tips.js parts/p30b-provtip.js parts/p40-scene.js parts/p50-deco.js parts/p52-stamps.js parts/p54-feat.js parts/p55-paint.js parts/p57-letter.js parts/p60-draw.js parts/p70-portraits.js parts/p80a-tips.js parts/p80b-outliner.js parts/p80c-sel.js parts/p80d-rest.js parts/p85-tryart.js parts/p86-checks.js parts/p99-end.html; } > "$OUT"
wc -c "$OUT"
