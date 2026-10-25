#!/bin/sh
cd "$(dirname "$0")"
for p in relief massif open; do node checks.cjs $p natural 2 > ../out/run-checks-$p-natural-2.txt 2>&1; done
for p in p2 relief massif open; do node sweep.cjs $p natural 1 30 > ../out/run-sweep-$p-natural-1.txt 2>&1; done
for p in p2 relief massif open; do node hoverprobe.cjs $p natural 1 > ../out/run-hover-$p-natural-1.txt 2>&1; done
