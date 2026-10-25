#!/bin/sh
cd "$(dirname "$0")"; O=../out
node modes.cjs natural 1 > $O/run-modes-natural-1.txt 2>&1
node modes.cjs clear 1 > $O/run-modes-clear-1.txt 2>&1
node modes.cjs natural 2 > $O/run-modes-natural-2.txt 2>&1
node modes.cjs clear 2 > $O/run-modes-clear-2.txt 2>&1
echo DONE > $O/laneC.done
