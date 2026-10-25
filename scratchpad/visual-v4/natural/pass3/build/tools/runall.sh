#!/bin/sh
# every suite on the live page, three or four at a time: out/final/*.txt
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/tools; O=../out/final; B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/before/game-screen-v4.html
md5sum ../../../../map/game-screen-v4.html > $O/build-md5.txt
timeout 1500 node checks.cjs natural 1 > $O/checks-natural-1.txt 2>&1 & timeout 1500 node checks.cjs natural 2 > $O/checks-natural-2.txt 2>&1 & timeout 1500 node checks.cjs clear 1 > $O/checks-clear-1.txt 2>&1 & wait
timeout 1500 node checks.cjs clear 2 > $O/checks-clear-2.txt 2>&1 & timeout 1500 node checks.cjs terrain 1 > $O/checks-terrain-1.txt 2>&1 & timeout 1500 node checks.cjs terrain 2 > $O/checks-terrain-2.txt 2>&1 & wait
timeout 1200 node modes.cjs natural 1 > $O/modes-natural-1.txt 2>&1 & timeout 1200 node modes.cjs natural 2 > $O/modes-natural-2.txt 2>&1 & timeout 1200 node modes.cjs clear 1 > $O/modes-clear-1.txt 2>&1 & timeout 1200 node modes.cjs clear 2 > $O/modes-clear-2.txt 2>&1 & wait
timeout 1500 node det.cjs natural 3 > $O/det-natural.txt 2>&1 & timeout 1200 node det.cjs clear 2 > $O/det-clear.txt 2>&1 & timeout 1200 node det.cjs terrain 2 > $O/det-terrain.txt 2>&1 & wait
timeout 1200 node det.cjs v3 2 > $O/det-v3.txt 2>&1 & timeout 1200 node v3same.cjs 2 > $O/v3same.txt 2>&1 & BEFORE=$B timeout 1200 node samecheck-p2.cjs clear > $O/same-clear.txt 2>&1 & BEFORE=$B timeout 1200 node samecheck-p2.cjs terrain > $O/same-terrain.txt 2>&1 & wait
timeout 1500 node sweep.cjs 1 > $O/sweep-1.txt 2>&1 & timeout 1500 node sweep.cjs 2 > $O/sweep-2.txt 2>&1 & sh mkvariants.sh > $O/variants-md5.txt 2>&1; wait
timeout 1500 node seedprobe3.cjs s7 > $O/seed-s7.txt 2>&1 & timeout 1500 node seedprobe3.cjs s31 > $O/seed-s31.txt 2>&1 & timeout 1500 node seedprobe3.cjs alt > $O/seed-alt.txt 2>&1 & wait
echo done > $O/ALLDONE
