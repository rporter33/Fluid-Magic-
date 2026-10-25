#!/bin/sh
cd "$(dirname "$0")"
for p in open p2; do node checks.cjs $p natural 1 > ../out/run-checks-$p-natural-1.txt 2>&1; done
