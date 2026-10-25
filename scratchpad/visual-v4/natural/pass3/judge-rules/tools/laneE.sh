#!/bin/sh
cd "$(dirname "$0")"
for p in p2 relief massif open; do node shots.cjs $p natural 1 > ../out/run-shots-$p.txt 2>&1; done
for p in p2 relief massif open; do node bake.cjs $p > ../out/run-bake-$p.txt 2>&1; done
for p in relief massif open; do VIEWS=ashMax,greyMax,mereMax,start node shots.cjs $p natural 2 >> ../out/run-shots-$p.txt 2>&1; done
VIEWS=ashMax,greyMax,mereMax,start node shots.cjs p2 natural 2 >> ../out/run-shots-p2.txt 2>&1
for p in p2 relief massif open; do VIEWS=start node shots.cjs $p natural 1 390 844 >> ../out/run-shots-$p.txt 2>&1; done
