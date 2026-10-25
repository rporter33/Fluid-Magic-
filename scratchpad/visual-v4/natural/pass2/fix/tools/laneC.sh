#!/bin/sh
# lane C: the shots (pass2/shots), the done-when probes, the label sweep, the dumps and the look metrics
cd "$(dirname "$0")"
timeout 2400 node shots.cjs natural clear terrain small phone v3 dpr2 > ../out/run-shots.txt 2>&1
timeout 900 node final.cjs final > ../out/run-final.txt 2>&1
timeout 900 node labels.cjs > ../out/run-labels.txt 2>&1
timeout 900 node rimtune.cjs '[[1.1,4]]' > ../out/run-rim.txt 2>&1
timeout 900 node dump.cjs natural 1 start,mid,ref,far > ../out/run-dump.txt 2>&1
python3 -I look.py natural-dpr1-1440x900-start natural-dpr1-1440x900-mid natural-dpr1-1440x900-ref natural-dpr1-1440x900-far > ../out/run-look.txt 2>&1
touch ../out/laneC.done
