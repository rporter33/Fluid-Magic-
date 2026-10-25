#!/bin/sh
# page-s8 (md5 e129ee21..., the supply path off in the line checks' frames, fixed): the suites the change touches, the river-aware LP probe, and hashes against page-s6
P=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass4/part1
cd $P/tools; O=$P/out/final8; PG=$P/out/page-s8.html; export PAGEFILE=$PG TAGP=f8-; L=$1
case $L in
A) timeout 3600 node modes.cjs clear 1 > $O/modes-clear-1.txt 2>&1; timeout 3600 node modes.cjs natural 1 > $O/modes-natural-1.txt 2>&1; node det4.cjs s8-nat $PG '' 2 > $O/det4-nat.txt 2>&1; node base.cjs $PG f8-on-nat '' > $O/base-on-nat.txt 2>&1; node base.cjs $PG f8-off-nat '?p4=off' > $O/base-off-nat.txt 2>&1; MAXC=3000 node p4run.cjs f8-checks 'm.p4Checks()' > $O/p4checks.txt 2>&1 ;;
B) timeout 5400 node focus.cjs natural 1 > $O/focus-natural-1.txt 2>&1 ;;
C) timeout 3600 node session.cjs natural > $O/session-natural.txt 2>&1; timeout 5400 node linesall.cjs natural 1 > $O/linesall-natural-1.txt 2>&1 ;;
esac
echo done $L $(date +%T) >> $O/lanes-done.txt
