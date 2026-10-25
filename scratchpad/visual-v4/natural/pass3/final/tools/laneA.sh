#!/bin/sh
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools; O=../out/logs
timeout 3600 node checksx.cjs natural 1 > $O/checksx-natural-1.txt 2>&1 & timeout 3600 node checksx.cjs clear 1 > $O/checksx-clear-1.txt 2>&1 & timeout 3600 node checksx.cjs terrain 1 > $O/checksx-terrain-1.txt 2>&1 & wait
echo done > $O/A.done
