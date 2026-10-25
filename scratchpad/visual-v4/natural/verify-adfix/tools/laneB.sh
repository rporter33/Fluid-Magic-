#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs clear 1 > $O/run-checks-clear-1.txt 2>&1
node checks.cjs clear 2 > $O/run-checks-clear-2.txt 2>&1
node checks.cjs terrain 2 > $O/run-checks-terrain-2.txt 2>&1
echo DONE-B > $O/laneB.done
