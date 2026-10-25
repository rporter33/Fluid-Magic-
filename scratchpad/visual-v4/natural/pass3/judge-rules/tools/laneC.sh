#!/bin/sh
cd "$(dirname "$0")"
for p in relief massif open; do node det.cjs $p natural 3 > ../out/run-det-$p-natural.txt 2>&1; done
for p in p2 relief massif open; do node det.cjs $p clear 2 > ../out/run-det-$p-clear.txt 2>&1; node det.cjs $p terrain 2 > ../out/run-det-$p-terrain.txt 2>&1; done
for p in p2 relief massif open; do node v3same.cjs $p 2 > ../out/run-v3-$p.txt 2>&1; done
