#!/bin/sh
cd "$(dirname "$0")"
for p in massif relief open; do VIEWS=start,far,mid,ref,near-forest,near-swamp,nearMax,extra node checks.cjs $p clear 1 > ../out/run-checks-$p-clear-1.txt 2>&1; done
for p in open massif relief; do VIEWS=start,far,mid,ref,near-forest,near-swamp,nearMax,extra node checks.cjs $p terrain 1 > ../out/run-checks-$p-terrain-1.txt 2>&1; done
