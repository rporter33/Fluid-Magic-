#!/bin/sh
cd "$(dirname "$0")"; O=../out
TAGP=f- node dump.cjs natural 1 start,far,mid,ref,nearA,nearG,nearM,maxA > $O/run-dump-final.txt 2>&1
DPR=2 node edge.cjs start,mid,nearA,maxA > $O/run-edge-dpr2.txt 2>&1
echo DONE > $O/laneE.done
