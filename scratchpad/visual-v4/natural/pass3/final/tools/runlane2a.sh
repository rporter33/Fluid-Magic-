#!/bin/sh
# queue2a: waits for queue 2's running dense probe (seed 44 at 2x) to finish
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools
while pgrep -f "node vprobe.cjs natural 2 /tmp" > /dev/null; do sleep 15; done
exec ./runlane.sh queue2a.txt
