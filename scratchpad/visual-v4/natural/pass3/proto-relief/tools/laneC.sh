#!/bin/sh
cd "$(dirname "$0")"; O=../out
TAGP=now- node dump.cjs natural 1 start,far,mid,ref,ash,grey,mere,ashmax > $O/run-dump-now.txt 2>&1
node readers2.cjs now > $O/run-readers-now.txt 2>&1
echo DONE > $O/laneC.done
