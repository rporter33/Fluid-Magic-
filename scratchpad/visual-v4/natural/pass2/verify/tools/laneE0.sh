#!/bin/sh
cd "$(dirname "$0")"; O=../out
until [ -f $O/checks-natural-dpr2-1440x900.json ]; do sleep 5; done
sh laneE.sh
