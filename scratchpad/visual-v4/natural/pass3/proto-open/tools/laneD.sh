#!/bin/sh
cd "$(dirname "$0")"; O=../out
node det.cjs natural 3 > $O/run-det-natural.txt 2>&1
node det.cjs clear 2 > $O/run-det-clear.txt 2>&1
node det.cjs terrain 2 > $O/run-det-terrain.txt 2>&1
node same.cjs > $O/run-same.txt 2>&1
node v3same.cjs 2 > $O/run-v3same.txt 2>&1
echo DONE > $O/laneD.done
