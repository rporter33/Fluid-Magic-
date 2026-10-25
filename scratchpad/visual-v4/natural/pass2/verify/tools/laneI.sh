#!/bin/sh
cd "$(dirname "$0")"; O=../out
until [ -f $O/laneH.done ]; do sleep 5; done
node cliff.cjs natural > $O/run-cliff-natural.txt 2>&1
SWEEP=1 node ui.cjs 1440 900 > $O/run-ui-sweep-1440.txt 2>&1
SWEEP=1 node ui.cjs 1280 720 > $O/run-ui-sweep-1280.txt 2>&1
node readmin.cjs > $O/run-readmin.txt 2>&1
echo DONE > $O/laneI.done
