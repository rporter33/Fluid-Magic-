#!/bin/sh
cd "$(dirname "$0")"; O=../out
node checks.cjs clear 1 > $O/run-checks-clear-1.txt 2>&1
node wq.cjs natural > $O/run-wq-natural.txt 2>&1
node wq.cjs clear > $O/run-wq-clear.txt 2>&1
node wq.cjs terrain > $O/run-wq-terrain.txt 2>&1
echo DONE > $O/L2.done
