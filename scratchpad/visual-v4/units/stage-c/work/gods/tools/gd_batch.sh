#!/bin/bash
# Stage C gods: run gd_run.py for several gods, both views, N at a time; one log per job in ../logs/.
# Usage: bash gd_batch.sh GOD ...
cd "$(dirname "$0")"
for g in "$@"; do
  for v in back front; do
    python3 -I gd_run.py $g $v > ../logs/$g.$v.log 2>&1 &
  done
  wait
  [ -f ../STOP ] && { echo STOP; exit 4; }
done
