#!/bin/sh
cd "$(dirname "$0")"; O=../out
node dump.cjs natural 1 start,mid,midE,midSW,midNE,midNW,midSE,mid75,ref,refW,nearW,nearC,nearE,nearS,far,m40,m40mid > $O/run-dump-natural-1.txt 2>&1
node dump.cjs clear 1 start,mid,midE,midSW,midNE,midNW,midSE,mid75,ref,nearW,nearC,nearE,far,m40,m40mid > $O/run-dump-clear-1.txt 2>&1
node dump.cjs terrain 1 start,mid,ref,nearC,far,m40mid > $O/run-dump-terrain-1.txt 2>&1
PAGEFILE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/game-screen-v4.before-fix.html TAGP=bf- node dump.cjs clear 1 start,mid,ref,nearC,far,m40mid > $O/run-dump-bf-clear-1.txt 2>&1
PAGEFILE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/game-screen-v4.before-fix.html TAGP=bf- node dump.cjs terrain 1 start,mid,ref,nearC,far,m40mid > $O/run-dump-bf-terrain-1.txt 2>&1
PAGEFILE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass2/fix/game-screen-v4.before-fix.html TAGP=bf- node dump.cjs natural 1 start,mid,ref,nearC,far > $O/run-dump-bf-natural-1.txt 2>&1
node dump.cjs natural 2 start,ref,nearC > $O/run-dump-natural-2.txt 2>&1
node dump.cjs clear 2 start,nearC > $O/run-dump-clear-2.txt 2>&1
echo DONE > $O/laneE.done
