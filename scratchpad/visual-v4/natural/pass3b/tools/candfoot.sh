#!/bin/sh
# whole-outline foot statistics for a candidate parameter set on the main map and the six variants: sh candfoot.sh <cand> '<peaks sed>' '<mere sed>'
B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3b; C=$1; mkdir -p $B/out/var/$C; cd $B/tools
PO='cornerK: 0.15, base: 0.028, amps: \[0.034, 0.045, 0.014, 0.007\], units: \[32, 11, 4, 1.6\], gullyA: 0.03, gullyU: 7, gullyMid: 0.44, spurK: 0.05, spurMid: 0.72, target: 0.021, shiftD: 0.08, insetMin: 0.008, softK: 0.01, insetMax: 0.12'
MO='mere: { cornerK: 0.2, base: 0.034, target: 0.022, shiftD: 0.08, amps: \[0.038, 0.013, 0.005, 0.002\], units: \[30, 10, 3.5, 1.4\], insetMin: 0.008, softK: 0.008'
for m in main s7 s31 alt s44 s5 s58; do S=$B/variants/$m/game-screen-v4.html; [ $m = main ] && S=$B/../../map/game-screen-v4.html; sed -e "s/$PO/$2/" -e "s/$MO/$3/" $S > $B/out/var/$C/$m.html; done
grep -c "$2" $B/out/var/$C/main.html > /dev/null || echo "PEAKS SED FAILED"
for g in "main s7 s31" "alt s44 s5" "s58"; do for m in $g; do timeout 900 node footstats.cjs $m $B/out/var/$C/$m.html > $B/out/logs/cf-$C-$m.txt 2>&1 & done; wait; done
cat $B/out/logs/cf-$C-*.txt
