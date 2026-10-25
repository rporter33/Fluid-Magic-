#!/bin/sh
cd "$(dirname "$0")"; O=../out
node det.cjs natural 3 > $O/run-det-natural.txt 2>&1
node det.cjs clear 3 > $O/run-det-clear.txt 2>&1
node det.cjs terrain 3 > $O/run-det-terrain.txt 2>&1
node det.cjs v3 3 > $O/run-det-v3.txt 2>&1
echo DONE > $O/laneD.done
