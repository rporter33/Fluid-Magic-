#!/bin/sh
cd "$(dirname "$0")"; O=../out
until [ -f $O/laneG.done ]; do sleep 5; done
node finalshots.cjs > $O/run-finalshots.txt 2>&1
echo DONE > $O/laneH.done
