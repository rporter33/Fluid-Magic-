#!/bin/sh
# queue4 (Clear and Terrain sameness against the pass-3 page): waits for queue3 to finish
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/final/tools
until grep -q ALLDONE ../out/logs/queue3.progress 2>/dev/null; do sleep 20; done
P=../out/logs/queue4.progress
while IFS= read -r c; do [ -z "$c" ] && continue; echo "$(date +%H:%M:%S) START $c" >> $P; sh -c "$c"; echo "$(date +%H:%M:%S) DONE rc=$? $c" >> $P; done < queue4.txt
echo "$(date +%H:%M:%S) ALLDONE" >> $P
