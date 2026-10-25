#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs natural 1 > $O/run-checks-natural-1-final.txt 2>&1
node det.cjs natural 3 > $O/run-det-natural-final.txt 2>&1
node checks.cjs natural 2 > $O/run-checks-natural-2-final.txt 2>&1
echo DONE > $O/laneD.done
