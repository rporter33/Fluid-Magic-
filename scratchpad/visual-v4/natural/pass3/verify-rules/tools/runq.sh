#!/bin/sh
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/verify-rules/tools
while [ ! -f ../out/logs/A.done ]; do sleep 20; done
xargs -P 3 -I{} sh -c '{}; echo "$(date +%H:%M:%S) DONE {}" >> ../out/logs/queue1.progress' < $1
echo all > ../out/logs/Q1.done
