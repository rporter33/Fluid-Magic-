#!/bin/sh
cd "$(dirname "$0")"
until grep -q "J3 done" ../out/laneJ3.log; do sleep 5; done
for p in p2 relief massif open; do node readfar.cjs $p > ../out/run-readfar-$p.txt 2>&1; done
echo J5 done
