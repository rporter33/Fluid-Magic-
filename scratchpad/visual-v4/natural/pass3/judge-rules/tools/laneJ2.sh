#!/bin/sh
cd "$(dirname "$0")"
for p in relief massif; do VIEWS=start,far,mid,ref,near-forest,near-swamp,nearMax,extra node checks.cjs $p terrain 1 > ../out/run-checks-$p-terrain-1.txt 2>&1; done
for p in p2 relief massif open; do node hoverwild.cjs $p > ../out/run-hoverwild-$p.txt 2>&1; done
for p in p2 relief massif open; do node panstab.cjs $p > ../out/run-panstab-$p.txt 2>&1; done
echo J2 done
