#!/bin/bash
# The art director's critique shots (units/stage-d/critique-shots/NN) shot again on the fixed page, with the same battle,
# cast, camera and story times, into work/fix-shots/NN-*.jpg: the "after" half of each before/after pair.
#   bash fix_shots.sh [names...]   names: 01 02 03 07 09 10 11 12 13 14 18 21 22 (08 comes from the 2x clip: fix_shots_08.py)
set -u
S=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
FX=$S/fixd; OUT=$S/visual-v4/units/stage-d/work/fix-shots; T=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT" "$FX/f"
NAMES=${*:-"01 02 03 07 09 10 11 12 13 14 18 21 22"}
shot() { (cd "$FX" && timeout 1200 node shoot.cjs "$@") || echo "FAILED shoot $*"; }
grid() { python3 -I "$FX/grid.py" "$1" "$2" "$3" "$OUT/$4" >/dev/null && echo "$OUT/$4"; }
mag() { python3 -I "$T/fix_shots_mag.py" "$FX/f/$1.json" "$2" "$3" "$OUT/$4" && echo "$OUT/$4"; }
for n in $NAMES; do
  case $n in
    01) shot a 0 auto a01 0,.2,.45,.6,.7,.73,.8,.95,1.1,1.25,1.31,1.33,1.36,1.4,1.45,1.52,1.6,1.75,1.9,2.2,2.6,3.2,3.7,5.0 --crop 760x480 && grid a01 4 0.5 01-fireball-cast1-playzoom.jpg ;;
    02) shot a 0 z28 a02 .3,.6,.7,.76,.9,1.05,1.2,1.3,1.31,1.36,1.42,1.48,1.54,1.6,1.7,1.85,2.1,2.6 --crop 640x384 && grid a02 3 0.72 02-fireball-cast1-28px.jpg ;;
    03) shot a 0 close a03 1.0,1.1,1.2,1.25,1.29,1.31,1.317,1.333,1.35,1.367,1.383,1.4,1.42,1.45,1.48,1.52,1.56,1.6,1.65,1.7,1.8,1.9,2.1,2.4,2.8,3.3,3.8,4.5 --crop 720x480 && grid a03 4 0.5 03-fireball-cast1-close-67px.jpg ;;
    07) shot a 4 z1.6 a07 .2,.3,.36,.38,.42,.46,.52,.6,.7,.9,1.3,2.0 --crop 800x520 --centre impact && grid a07 4 0.5 07-cast5-burst-on-the-wyrm.jpg ;;
    09) shot a 0 z28 a09 1.2,1.3,1.48,1.54 --crop 400x238 --centre impact && mag a09 2 2 09-light-pool-and-smoke-28px-x2.jpg ;;
    10) shot a 5 close a10 0,.2,.34,.38,.5,.7,.9,.95,.97,1.0,1.04,1.08,1.12,1.18,1.25,1.35,1.5,1.7,1.9,2.2,2.6,3.0,3.5,4.2 --crop 720x480 && grid a10 4 0.5 10-fireball-cast6-close.jpg ;;
    11) (cd "$FX" && timeout 1200 node "$T/fix_shots_kill.cjs" "$S/visual-v4/battle-mockup.html" "$OUT/11-burning-kill-flames.jpg") || echo "FAILED 11" ;;
    12) shot c 0 auto a12 .1,.3,.44,.46,.6,.75,.82,.9,1.0,1.2,1.5,2.5 --crop 1440x900 && grid a12 3 0.42 12-entangle-playzoom-full-frames.jpg ;;
    13) shot c 0 auto a13 .75,.82,.9,1.0,1.2,1.5 --crop 150x100 --centre impact && mag a13 3 4 13-entangle-target-playzoom-x4.jpg ;;
    14) shot c 0 z3 a14 .86,.88,.93,1.2,6.65,6.75,6.85,7.5 --crop 420x360 && grid a14 4 1 14-entangle-close-84px.jpg ;;
    18) shot a 0 z1.4 a18f .4,.69,.9,1.1,1.31,1.36,1.45,1.55,1.7,2.2 --crop 600x360 --rm reduce && shot c 0 z1.6 a18e .3,.46,.5,.7,.85,.95,1.2,6.7,6.9,7.2 --crop 600x360 --rm reduce \
        && grid a18f 5 0.5 18a-reduced-motion-fireball.jpg && grid a18e 5 0.5 18b-reduced-motion-entangle.jpg ;;
    21) shot a 5 close a21 1.25,1.35,1.5,1.7 --crop 600x420 && grid a21 2 1 21-cast6-ember-dart-sparks.jpg ;;
    22) shot a 2 auto a22 0,.05,.1,.14,.2,.3,.4,.48,.52,.56,.62,.7,.8,.9,1.0,1.2,1.5,2.0 --crop 900x560 && grid a22 3 0.5 22-fireball-cast3-brief-form.jpg ;;
  esac
done
