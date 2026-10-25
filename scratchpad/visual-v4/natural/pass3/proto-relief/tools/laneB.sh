#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs clear 1 > $O/run-checks-clear-1.txt 2>&1
node checks.cjs natural 2 > $O/run-checks-natural-2.txt 2>&1
echo DONE > $O/laneB.done
