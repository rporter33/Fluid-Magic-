#!/bin/bash
# Records the pilot's review clips from the sandbox page, one after another (the machine is shared).
#   bash run_clips.sh PAGE OUTDIR [names...]   names: fb1 fb4 fb6 en enw (each at play zoom and 2x)
# The storyboard clips (fb1, en) run at 120 frames a second of story (0.25x stays smooth); the others at 60.
set -u
PAGE=$1; OUT=$2; shift 2
NAMES=${*:-"fb1 en fb4 fb6 enw"}
T=$(dirname "$0")
mkdir -p "$OUT"
rec() { # name battle spell n from to fps [extra args]
  for z in ${ZS:-1 2}; do
    # extra args go first: clips.cjs reads the first --crf it finds
    timeout 3600 node "$T/clips.cjs" "$PAGE" "$OUT/$1-$z.webm" "$2" "$3" "$4" "$z" "$7" "$5" "$6" ${8:-} --crf "${CRF:-38}" || echo "FAILED $1-$z"
  done
}
for n in $NAMES; do
  case $n in
    fb1) rec fb1 a fireball 0 -0.2 2.4 120 ;;
    en) rec en c entangle 0 -0.15 2.15 120 "--pan 1" ;;   # the cast is too long for the frame: pan to the held figure
    fb4) rec fb4 a fireball 3 -0.1 1.7 60 "--pan 1 --crf 40" ;;   # the brief form (critique fix 6); the pilot page's 12 MB: CRF 40
    fb6) rec fb6 a fireball 5 -0.15 2.6 60 "--pan 1 --crf 40" ;;
    enw) rec enw c entangle 0 6.3 7.8 60 ;;
  esac
done
echo DONE
