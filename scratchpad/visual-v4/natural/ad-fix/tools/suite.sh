#!/bin/sh
# the full check suite on the built mockup; logs in ad-fix/out/suite-*.txt
cd "$(dirname "$0")"; O=../out
MAXC=200 node checks.cjs '' ad-natural '' all > $O/suite-natural.txt 2>&1
MAXC=200 node checks.cjs '?terrain=clear' ad-clear '' all > $O/suite-clear.txt 2>&1
MAXC=200 WAITCLEAR=1 node checks.cjs '' ad-terrain "m.ev(\"setMode('terrain')\")" all > $O/suite-terrain.txt 2>&1
MAXC=200 DPR=2 node checks.cjs '' ad-natural-dpr2 '' all > $O/suite-natural-dpr2.txt 2>&1
MAXC=200 DPR=2 node checks.cjs '?terrain=clear' ad-clear-dpr2 '' all > $O/suite-clear-dpr2.txt 2>&1
for l in natural clear terrain; do for d in 1 2; do node views.cjs $l $d > $O/suite-views-$l-$d.txt 2>&1; done; done
node modelines.cjs 1 > $O/suite-modelines-1.txt 2>&1
node modelines.cjs 2 > $O/suite-modelines-2.txt 2>&1
node modelines.cjs 1 '?terrain=clear' > $O/suite-modelines-clear.txt 2>&1
node startzoom.cjs > $O/suite-startzoom.txt 2>&1
node stab.cjs > $O/suite-stab.txt 2>&1
node v3same.cjs > $O/suite-v3same.txt 2>&1
echo SUITE-DONE > $O/suite-done.txt
node chipcheck.cjs > $O/suite-chipcheck.txt 2>&1
node n4same.cjs > $O/suite-n4same.txt 2>&1
node ../../ad/tools/cliff.cjs > $O/suite-cliff.txt 2>&1
node base.cjs > $O/suite-perf.txt 2>&1
DPR=2 node base.cjs > $O/suite-perf-dpr2.txt 2>&1
echo SUITE2-DONE >> $O/suite-done.txt
