#!/bin/sh
# the live parts on other map plans, for the verifier's wild checks: verify-rules/variants/<v>/game-screen-v4.html (s7, s31, alt as the builder; s3, s44 new)
B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/fix; L=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map
for v in s7 s31 alt s3 s44; do D=$B/variants/$v; rm -rf $D; mkdir -p $D; cp -a $L/parts $D/parts; cp $L/build.sh $D/build.sh
  case $v in
    s7|s31|s3|s44) n=${v#s}; sed -i "s/^const MAP_SEED = 12, RANGE_GAP = 2;/const MAP_SEED = $n, RANGE_GAP = 2;/" $D/parts/p10b-core.js ;;
    alt) sed -i "s/^const WILD_PLAN = \[\['ashspine', 'peaks', 'The Ashspine', 3\], \['stillmere', 'mere', 'The Still Mere', 1\], \['greyteeth', 'peaks', 'The Greyteeth', 2\]\];/const WILD_PLAN = [['ashspine', 'peaks', 'The Ashspine', 1], ['stillmere', 'mere', 'The Still Mere', 2], ['greyteeth', 'peaks', 'The Greyteeth', 3], ['coldmere', 'mere', 'The Cold Mere', 2]];/" $D/parts/p10b-core.js ;;
  esac
  diff -q $L/parts/p10b-core.js $D/parts/p10b-core.js >/dev/null && echo "PATCH FAILED $v"; sh $D/build.sh >/dev/null; md5sum $D/game-screen-v4.html
done
