#!/bin/sh
# queue1b: starts when the 2x Natural checks (lane 1's first job) have finished
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools
while pgrep -f "node checksx.cjs natural 2$" > /dev/null; do sleep 15; done
exec ./runlane.sh queue1b.txt
