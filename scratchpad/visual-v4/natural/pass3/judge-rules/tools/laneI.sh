#!/bin/sh
cd "$(dirname "$0")"
for p in relief massif open; do node seedprobe.cjs $p"alt" > ../out/run-seed-$p-alt.txt 2>&1; done
