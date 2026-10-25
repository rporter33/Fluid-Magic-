#!/bin/bash
# Battle bench matrix. CPU numbers are what matter; the small viewport keeps SwiftShader's fill time down.
cd "$(dirname "$0")"
OUT=out/battle-matrix.jsonl
run() { node run.cjs battle.html "$1" --w ${W:-480} --h ${H:-270} --timeout 900000 ${EXTRA} >> $OUT 2>&1; }
for n in 600 1500 3000; do
  for cfg in "mode=sprite&sort=none" "mode=sprite&sort=zindex" "mode=sprite&sort=manual" "mode=particle&sort=none" "mode=particle&sort=manual"; do
    run "n=$n&$cfg&frames=200"
  done
done
run "n=1500&mode=sprite&sort=manual&atlas=0&frames=200"
run "n=6000&mode=particle&sort=manual&frames=200"
run "n=6000&mode=sprite&sort=manual&frames=200"
