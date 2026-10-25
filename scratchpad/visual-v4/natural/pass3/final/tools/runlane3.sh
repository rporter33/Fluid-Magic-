#!/bin/sh
# queue3 (art dumps and measures, readers, start-camera comparison): waits for the shots chain, then runs each line from the tools folder
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools
while pgrep -f "node fshots.cjs" > /dev/null; do sleep 15; done
P=../out/logs/queue3.progress
while IFS= read -r c; do [ -z "$c" ] && continue; echo "$(date +%H:%M:%S) START $c" >> $P; (cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools && sh -c "$c"); echo "$(date +%H:%M:%S) DONE rc=$? $c" >> $P; done < queue3.txt
echo "$(date +%H:%M:%S) ALLDONE" >> $P
