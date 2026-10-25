#!/bin/sh
cd "$(dirname "$0")"; rm -f ../out/logs/F.progress
xargs -P 3 -I{} sh -c '{}; echo "$(date +%H:%M:%S) DONE {}" >> ../out/logs/F.progress' < fullq.txt
echo ALLDONE >> ../out/logs/F.progress
