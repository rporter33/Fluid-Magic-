#!/bin/sh
# Reproduces the texture-angle palette measurements. Color math: the repo's tests/content/colorMath.ts and
# src/content/colors.ts, copied here unchanged; scripts run with npx tsx from the repo so node_modules resolves.
set -e
W=$(cd "$(dirname "$0")" && pwd); SP=$(cd "$W/../../.." && pwd); REPO=/home/user/Fluid-Magic-
export D3_LOCAL=$SP/vendor-d3/package/dist/d3.min.js
P3='{"plains":"#CFD1B3","farmland":"#C8A86D","forest":"#344A28","hills":"#7C6748","mountains":"#ACB2C0","swamp":"#5B686A","wasteland":"#958081"}'
cd $REPO
npx tsx $W/eval.ts '' '' 'approved, v3 paint' > $W/eval-approved.out          # baseline (reproduces final.md 20.5/12.2 and 2530/0)
npx tsx $W/eval.ts '' v3m 'approved, v3 paint as measured' > $W/eval-approved-measured.out
npx tsx $W/eval.ts "$P3" painted 'Painted (P3), painted recipe as measured' > $W/eval-P3.out
npx tsx $W/modes.ts "$P3" > $W/modes-P3.out
npx tsx $W/tokens.ts "$P3" 6 > $W/tokens-P3.out
npx tsx $W/region.ts > $W/region-P3.out
# search and refine (how P3 was found): search4.ts / refine.ts with DN=14 DC=9 DATA_MIN=7, cap 0.56, seed 9
cd $W
python3 -I gen-hook.py $SP/wartable-design/mock-work/parts $W/mock-pal.html   # the mockup page + a palette hook; parts untouched
node drive.cjs $W/mock-pal.html paintcheck x $W/cfg-painted.json > $W/pc-final.json
node drive.cjs $W/mock-pal.html bake x $W/cfg-painted.json > $W/bake-final.json
node drive.cjs $W/mock-pal.html shots $W/shots $W/cfg-painted.json > $W/shots.log
python3 -I texclass.py shots > texclass.out
python3 -I swatches.py shots cfg-painted.json ../swatches.png
