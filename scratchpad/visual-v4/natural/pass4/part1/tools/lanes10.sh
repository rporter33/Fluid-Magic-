#!/bin/sh
# page-s10 (md5 b3c755b3..., the final page): the suites the natural hover change touches, with hashes against page-s6; Clear, Terrain, data modes, Painted and ?p4=off stand from page-s6/s8
P=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass4/part1
cd $P/tools; O=$P/out/final10; PG=$P/out/page-s10.html; export PAGEFILE=$PG TAGP=f10-; L=$1
case $L in
A) timeout 3600 node checksx.cjs natural 1 > $O/checksx-natural-dpr1.txt 2>&1; timeout 3600 node checksx.cjs natural 1 1920 1080 > $O/checksx-natural-1920.txt 2>&1; node det4.cjs s10-nat $PG '' 2 > $O/det4-nat.txt 2>&1; node base.cjs $PG f10-on-nat '' > $O/base-on-nat.txt 2>&1; node base.cjs $PG f10-off-nat '?p4=off' > $O/base-off-nat.txt 2>&1; node base.cjs $PG f10-on-phone '' 390 844 3 > $O/base-on-phone.txt 2>&1 ;;
B) timeout 3600 node checksx.cjs natural 2 > $O/checksx-natural-dpr2.txt 2>&1; timeout 3600 node checksx.cjs natural 1 1280 720 > $O/checksx-natural-1280.txt 2>&1; MAXC=3000 node p4run.cjs f10-checks 'm.p4Checks()' > $O/p4checks.txt 2>&1; MAXC=3000 node p4run.cjs f10-vast 'Promise.all([m.p4Regions(), m.p4WatersData(), m.p4SupplyData(), m.p4Determinism()])' '?map=vast' > $O/p4vast.txt 2>&1 ;;
C) timeout 3600 node checksx.cjs natural 3 390 844 > $O/checksx-natural-phone.txt 2>&1; timeout 5400 node focus.cjs natural 1 > $O/focus-natural-1.txt 2>&1 ;;
D) timeout 2400 node finalshots.cjs > $O/finalshots.txt 2>&1; timeout 3600 node session.cjs natural > $O/session-natural.txt 2>&1; timeout 5400 node linesall.cjs natural 1 > $O/linesall-natural-1.txt 2>&1 ;;
esac
echo done $L $(date +%T) >> $O/lanes-done.txt
