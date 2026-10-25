#!/bin/sh
# page-s7 (md5 155f32ac..., the supply path off in the line checks' frames): the Supply-mode line suites, p4Checks, and hashes against page-s6
P=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass4/part1
cd $P/tools; O=$P/out/final7; PG=$P/out/page-s7.html; export PAGEFILE=$PG TAGP=f7-
timeout 3600 node modes.cjs clear 1 > $O/modes-clear-1.txt 2>&1; timeout 3600 node modes.cjs natural 1 > $O/modes-natural-1.txt 2>&1
node det4.cjs s7-nat $PG '' 1 > $O/det4-nat.txt 2>&1; node base.cjs $PG f7-on-nat '' > $O/base-on-nat.txt 2>&1; node base.cjs $PG f7-off-nat '?p4=off' > $O/base-off-nat.txt 2>&1
MAXC=3000 node p4run.cjs f7-checks 'm.p4Checks()' > $O/p4checks.txt 2>&1
timeout 5400 node focus.cjs natural 1 > $O/focus-natural-1.txt 2>&1; timeout 5400 node focus.cjs clear 1 '' supply > $O/focus-clear-1-supply.txt 2>&1
echo done E $(date +%T) >> $O/lanes-done.txt
