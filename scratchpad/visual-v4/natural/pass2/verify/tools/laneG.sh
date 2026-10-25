#!/bin/sh
cd "$(dirname "$0")"; O=../out
until [ -f $O/laneU.done ]; do sleep 5; done
node v3checks.cjs > $O/run-v3checks.txt 2>&1
node v3same.cjs 2 > $O/run-v3same.txt 2>&1
node lines.cjs clear 1 > $O/run-lines-clear-1.txt 2>&1
node lines.cjs terrain 1 > $O/run-lines-terrain-1.txt 2>&1
node lines.cjs natural 2 > $O/run-lines-natural-2.txt 2>&1
node detconv.cjs 3 natural > $O/run-detconv-natural.txt 2>&1
echo DONE > $O/laneG.done
