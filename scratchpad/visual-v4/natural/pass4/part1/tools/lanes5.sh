#!/bin/sh
# the final part-1 suites on page-s5 (md5 c991cc96..., after the floor-line fixes): four lanes in the background, logs in out/final5/
P=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass4/part1
cd $P/tools; L=$1; O=$P/out/final5; PG=$P/out/page-s5.html; export PAGEFILE=$PG TAGP=f5-
case $L in
A) node det4.cjs s5-nat $PG '' 3 > $O/det4-nat.txt 2>&1; node det4.cjs s5-clear $PG '?terrain=clear' 2 > $O/det4-clear.txt 2>&1; node det4.cjs s5-terrain $PG '?mode=terrain' 2 > $O/det4-terrain.txt 2>&1; node det4.cjs s5-off-nat $PG '?p4=off' 1 > $O/det4-off.txt 2>&1;
   timeout 3600 node checksx.cjs natural 2 > $O/checksx-natural-dpr2.txt 2>&1; timeout 3600 node modes.cjs natural 1 > $O/modes-natural-1.txt 2>&1; timeout 3600 node session.cjs natural > $O/session-natural.txt 2>&1 ;;
B) timeout 3600 node checksx.cjs natural 1 > $O/checksx-natural-dpr1.txt 2>&1; timeout 3600 node checksx.cjs natural 1 1280 720 > $O/checksx-natural-1280.txt 2>&1; timeout 3600 node checksx.cjs natural 1 1920 1080 > $O/checksx-natural-1920.txt 2>&1; timeout 5400 node focus.cjs natural 1 > $O/focus-natural-1.txt 2>&1 ;;
C) timeout 3600 node checksx.cjs clear 1 > $O/checksx-clear-dpr1.txt 2>&1; timeout 3600 node checksx.cjs terrain 1 > $O/checksx-terrain-dpr1.txt 2>&1; timeout 3600 node checksx.cjs natural 3 390 844 > $O/checksx-natural-phone.txt 2>&1;
   timeout 3600 node checksx.cjs clear 2 > $O/checksx-clear-dpr2.txt 2>&1; timeout 3600 node checksx.cjs terrain 3 390 844 > $O/checksx-terrain-phone.txt 2>&1; MODE=dominion VIEWS=start,far,mid,ref,near-forest timeout 3600 node checksx.cjs natural 1 > $O/checksx-dominion.txt 2>&1; MODE=springs VIEWS=start,mid,nearMax timeout 3600 node checksx.cjs clear 2 > $O/checksx-springs-clear-dpr2.txt 2>&1;
   timeout 3600 node modes.cjs clear 1 > $O/modes-clear-1.txt 2>&1 ;;
D) timeout 2400 node finalshots.cjs > $O/finalshots.txt 2>&1;
   for t in "off-nat-1440||1440 900 1" "off-clear-1440|terrain=clear|1440 900 1" "off-phone||390 844 3" "off-1280||1280 720 1" "off-dpr2||1440 900 2"; do tg=${t%%|*}; r=${t#*|}; q=${r%%|*}; v=${r#*|}; qq="?p4=off"; [ -n "$q" ] && qq="?p4=off&$q"; node base.cjs $PG f5-$tg "$qq" $v > $O/base-$tg.txt 2>&1; done;
   node base.cjs $PG f5-v3 '?look=v3' > $O/base-v3.txt 2>&1; node base.cjs $PG f5-on-nat '' > $O/base-on-nat.txt 2>&1; node base.cjs $PG f5-on-clear '?terrain=clear' > $O/base-on-clear.txt 2>&1; node base.cjs $PG f5-on-phone '' 390 844 3 > $O/base-on-phone.txt 2>&1;
   node v3same4.cjs 2 > $O/v3same.txt 2>&1; MAXC=3000 node p4run.cjs f5-checks 'm.p4Checks()' > $O/p4checks.txt 2>&1; MAXC=3000 node p4run.cjs f5-vast 'Promise.all([m.p4Regions(), m.p4WatersData(), m.p4SupplyData(), m.p4Determinism()])' '?map=vast' > $O/p4vast.txt 2>&1;
   Q=p4=off timeout 3600 node checksx.cjs natural 1 > $O/checksx-off-natural-dpr1.txt 2>&1; timeout 3600 node sweep.cjs 1 > $O/sweep-1.txt 2>&1; timeout 5400 node linesall.cjs natural 1 > $O/linesall-natural-1.txt 2>&1 ;;
esac
echo done $L $(date +%T) >> $O/lanes-done.txt
