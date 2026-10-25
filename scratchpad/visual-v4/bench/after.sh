#!/bin/bash
cd "$(dirname "$0")"
while pgrep -f matrix.sh > /dev/null; do sleep 5; done
# decals
node run.cjs decals.html "size=2048" --w 480 --h 270 --timeout 900000 > out/decals-2048.json 2>&1
node run.cjs decals.html "size=4096" --w 480 --h 270 --timeout 900000 > out/decals-4096.json 2>&1
# phone-class CPU: 4x throttle, small viewport
for cfg in "n=600&mode=particle&sort=manual" "n=1500&mode=particle&sort=manual" "n=1500&mode=sprite&sort=manual" "n=3000&mode=particle&sort=manual"; do
  node run.cjs battle.html "$cfg&frames=150" --w 480 --h 270 --throttle 4 --timeout 900000 >> out/battle-phone.jsonl 2>&1
done
# full-HD references (SwiftShader fill), few frames
node run.cjs battle.html "n=1500&mode=particle&sort=manual&frames=30&skip=320" --w 1920 --h 1080 --timeout 900000 --shot out/battle-1500-hd.png > out/battle-hd-1500.json 2>&1
node run.cjs battle.html "n=3000&mode=particle&sort=manual&frames=20&skip=320" --w 1920 --h 1080 --timeout 900000 --shot out/battle-3000-hd.png > out/battle-hd-3000.json 2>&1
# real rAF loop at a small viewport
node run.cjs battle.html "n=1500&mode=particle&sort=manual&frames=60&raf=1" --w 480 --h 270 --timeout 900000 > out/battle-raf.json 2>&1
# procedural vs painted
node run.cjs compare.html "" --timeout 300000 > out/compare.json 2>&1
echo ALLDONE > out/after.done
