#!/bin/sh
# the pass-3b parts on other map plans (as the pass-3 final verifier's mkvariants.sh): ../variants/<v>/game-screen-v4.html
B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3b; L=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map
for v in s7 s31 alt s44 s5 s58; do D=$B/variants/$v; mkdir -p $D; rm -rf $D/parts; cp -a $L/parts $D/parts; cp $L/build.sh $D/build.sh
  case $v in
    alt) sed -i "s/^const WILD_PLAN = \[\['ashspine', 'peaks', 'The Ashspine', 3\], \['stillmere', 'mere', 'The Still Mere', 1\], \['greyteeth', 'peaks', 'The Greyteeth', 2\]\];/const WILD_PLAN = [['ashspine', 'peaks', 'The Ashspine', 1], ['stillmere', 'mere', 'The Still Mere', 2], ['greyteeth', 'peaks', 'The Greyteeth', 3], ['coldmere', 'mere', 'The Cold Mere', 2]];/" $D/parts/p10b-core.js ;;
    s*) n=${v#s}; sed -i "s/^const MAP_SEED = 12, RANGE_GAP = 2;/const MAP_SEED = $n, RANGE_GAP = 2;/" $D/parts/p10b-core.js ;;
  esac
  cmp -s $L/parts/p10b-core.js $D/parts/p10b-core.js && echo "PATCH FAILED $v"; sh $D/build.sh >/dev/null; rm -rf $D/parts $D/build.sh; echo "$v $(md5sum < $D/game-screen-v4.html)"
done
