#!/bin/sh
cd "$(dirname "$0")"; O=../out
until [ -f $O/laneD.done ]; do sleep 5; done
node session.cjs natural 1440 900 full > $O/run-session-natural.txt 2>&1
node session.cjs clear 1440 900 full > $O/run-session-clear.txt 2>&1
node session.cjs terrain 1440 900 full > $O/run-session-terrain.txt 2>&1
node session.cjs natural 390 844 full > $O/run-session-natural-phone.txt 2>&1
echo DONE > $O/laneF.done
