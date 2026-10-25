#!/bin/sh
cd "$(dirname "$0")"; O=../out; S=../shots
for s in natural clear terrain phone dpr2 modes; do node shots.cjs $s $S > $O/run-shots-$s.txt 2>&1; done
node prof2.cjs 3 > $O/run-prof-proto.txt 2>&1
node prof2.cjs 3 base > $O/run-prof-base.txt 2>&1
echo DONE > $O/laneF.done
