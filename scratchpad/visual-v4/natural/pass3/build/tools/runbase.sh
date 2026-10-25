#!/bin/sh
# baselines on the pass-2 page (pass3/before): the data modes and the natural checks, to tell pass 3's failures from inherited ones: out/final/base-*.txt
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/tools; O=../out/final; B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/before/game-screen-v4.html
TAGP=base- PAGEFILE=$B timeout 1200 node modes.cjs natural 1 > $O/base-modes-natural-1.txt 2>&1 & TAGP=base- PAGEFILE=$B timeout 1200 node modes.cjs natural 2 > $O/base-modes-natural-2.txt 2>&1 & TAGP=base- PAGEFILE=$B timeout 1200 node modes.cjs clear 1 > $O/base-modes-clear-1.txt 2>&1 & TAGP=base- PAGEFILE=$B timeout 1200 node modes.cjs clear 2 > $O/base-modes-clear-2.txt 2>&1 & wait
PAGEFILE=$B timeout 1500 node checks.cjs natural 1 > $O/base-checks-natural-1.txt 2>&1
echo done > $O/BASEDONE
