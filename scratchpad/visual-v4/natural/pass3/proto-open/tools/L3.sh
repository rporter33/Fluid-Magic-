#!/bin/sh
cd "$(dirname "$0")"; O=../out
TAGP=now- node dump.cjs natural 1 start,far,mid,ref,ash,grey,mere,ashmax > $O/run-dump-now.txt 2>&1
TAGP=p2- PAGEFILE=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html node dump.cjs natural 1 start,far,mid,ref,ash,grey,mere,ashmax > $O/run-dump-p2.txt 2>&1
node readers2.cjs now > $O/run-readers-now.txt 2>&1
node readers2.cjs before > $O/run-readers-before.txt 2>&1
echo DONE > $O/L3.done
