#!/bin/sh
cd "$(dirname "$0")"
until grep -q "J1 done" ../out/laneJ1.log; do sleep 5; done
for p in massif open; do node sweep.cjs $p natural 1 30 > ../out/run-sweep-$p-natural-1.txt 2>&1; done
echo J4 done
