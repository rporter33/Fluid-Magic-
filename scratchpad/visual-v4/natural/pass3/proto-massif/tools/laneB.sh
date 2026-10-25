#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs terrain 1 > $O/run-checks-terrain-1.txt 2>&1
BEFORE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/proto-massif/game-screen-v4.base.html node samecheck-p2.cjs clear > $O/run-same-clear.txt 2>&1
BEFORE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/proto-massif/game-screen-v4.base.html node samecheck-p2.cjs terrain > $O/run-same-terrain.txt 2>&1
node v3same.cjs 2 > $O/run-v3same.txt 2>&1
node det.cjs natural 3 > $O/run-det-natural.txt 2>&1
node det.cjs clear 2 > $O/run-det-clear.txt 2>&1
echo DONE > $O/laneB.done
