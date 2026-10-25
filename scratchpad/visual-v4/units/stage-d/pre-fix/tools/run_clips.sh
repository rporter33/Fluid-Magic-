#!/bin/bash
# Records the pilot's review clips from the sandbox page, one after another (the machine is shared).
#   bash run_clips.sh PAGE OUTDIR [names...]   names: fb1 fb6 en enw (each at play zoom and 2x)
# The storyboard clips (fb1, en) run at 120 frames a second of story (0.25x stays smooth); the others at 60.
set -u
PAGE=$1; OUT=$2; shift 2
NAMES=${*:-"fb1 en fb6 enw"}
T=$(dirname "$0")
mkdir -p "$OUT"
rec() { # name battle spell n from to fps
  for z in 1 2; do
    timeout 3600 node "$T/clips.cjs" "$PAGE" "$OUT/$1-$z.webm" "$2" "$3" "$4" "$z" "$7" "$5" "$6" --crf "${CRF:-38}" || echo "FAILED $1-$z"
  done
}
for n in $NAMES; do
  case $n in
    fb1) rec fb1 a fireball 0 -0.2 2.4 120 ;;
    en) rec en c entangle 0 -0.15 2.15 120 ;;
    fb6) rec fb6 a fireball 5 -0.15 2.6 60 ;;
    enw) rec enw c entangle 0 6.3 7.8 60 ;;
  esac
done
echo DONE
