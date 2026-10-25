#!/bin/sh
# lane B: Clear and the Terrain mode against the build before this pass, Painted (v3) sameness, determinism
cd "$(dirname "$0")"
BEFORE=../game-screen-v4.before-fix.html; BEFORE=$(cd .. && pwd)/game-screen-v4.before-fix.html
BEFORE=$BEFORE timeout 2400 node samecheck.cjs clear > ../out/run-same-clear.txt 2>&1
BEFORE=$BEFORE timeout 2400 node samecheck.cjs terrain > ../out/run-same-terrain.txt 2>&1
timeout 2400 node v3same.cjs 2 > ../out/run-v3same.txt 2>&1
timeout 2400 node v3checks.cjs > ../out/run-v3checks.txt 2>&1
timeout 2400 node det.cjs natural 3 > ../out/run-det-natural.txt 2>&1
timeout 2400 node det.cjs clear 2 > ../out/run-det-clear.txt 2>&1
timeout 2400 node det.cjs terrain 2 > ../out/run-det-terrain.txt 2>&1
timeout 2400 node det.cjs v3 2 > ../out/run-det-v3.txt 2>&1
touch ../out/laneB.done
