#!/bin/sh
cd "$(dirname "$0")"
for p in massifs7 opens7; do node seedprobe.cjs $p > ../out/run-seed2-$p.txt 2>&1; done
for p in reliefalt massifalt openalt; do node seedprobe.cjs $p > ../out/run-seed2-$p.txt 2>&1; done
echo J1 done
