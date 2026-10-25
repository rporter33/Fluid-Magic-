#!/bin/sh
cd "$(dirname "$0")"
for p in p2 relief massif open; do node margin.cjs $p 1 > ../out/run-margin-$p.txt 2>&1; done
for p in p2s7 reliefs7 massifs7 opens7 p2s31 reliefs31 massifs31 opens31; do node margin.cjs $p 1 > ../out/run-margin-$p.txt 2>&1; done
echo J3 done
