#!/bin/sh
# lane A: every window.__mock check in Natural (ratio 1 and 2), Clear and the Terrain mode
cd "$(dirname "$0")"
timeout 2400 node checks.cjs natural 1 > ../out/run-checks-natural-1.txt 2>&1
timeout 2400 node checks.cjs natural 2 > ../out/run-checks-natural-2.txt 2>&1
timeout 2400 node checks.cjs clear 1 > ../out/run-checks-clear-1.txt 2>&1
timeout 2400 node checks.cjs terrain 1 > ../out/run-checks-terrain-1.txt 2>&1
touch ../out/laneA.done
