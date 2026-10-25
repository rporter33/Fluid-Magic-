#!/bin/sh
# run one queue file, one command at a time; progress in ../out/logs/<queue>.progress
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3b/tools
Q=$1; P=../out/logs/$(basename $Q .txt).progress
while IFS= read -r c; do [ -z "$c" ] && continue; echo "$(date +%H:%M:%S) START $c" >> $P; sh -c "$c"; echo "$(date +%H:%M:%S) DONE rc=$? $c" >> $P; done < $Q
echo "$(date +%H:%M:%S) ALLDONE" >> $P
