#!/bin/sh
cd "$(dirname "$0")"; O=../out
node dump.cjs natural 1 start,mid,midE,midSW,midNE,midNW,midSE,mid75,ref,refW,nearW,nearC,nearE,nearS,far,m40,m40mid > $O/run-dump-natural-1.txt 2>&1
node dump.cjs clear 1 start,mid,midE,midSW,midNE,midNW,midSE,mid75,ref,nearW,nearC,nearE,far,m40,m40mid > $O/run-dump-clear-1.txt 2>&1
node dump.cjs terrain 1 start,mid,ref,nearC,m40mid > $O/run-dump-terrain-1.txt 2>&1
node dump.cjs natural 2 start,ref,nearC > $O/run-dump-natural-2.txt 2>&1
node dump.cjs clear 2 start,nearC > $O/run-dump-clear-2.txt 2>&1
echo DONE > $O/laneE.done
