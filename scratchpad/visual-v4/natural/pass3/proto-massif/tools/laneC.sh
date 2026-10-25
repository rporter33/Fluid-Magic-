#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs natural 1 > $O/run-checks-natural-1b.txt 2>&1
node readers2.cjs > $O/run-readers-proto.txt 2>&1
node readers2.cjs base > $O/run-readers-base.txt 2>&1
TAGP=f- node dump.cjs natural 1 start,far,mid,ref,nearA,nearG,nearM,maxA > $O/run-dump-final.txt 2>&1
echo DONE > $O/laneC.done
