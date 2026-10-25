#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs natural 1 > $O/run-checks-natural-1.txt 2>&1
node checks.cjs terrain 1 > $O/run-checks-terrain-1.txt 2>&1
echo DONE > $O/laneA.done
