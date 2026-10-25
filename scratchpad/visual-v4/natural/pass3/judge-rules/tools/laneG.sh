#!/bin/sh
cd "$(dirname "$0")"
for s in 7 31; do for p in p2 relief massif open; do node seedprobe.cjs $p"s"$s > ../out/run-seed-$p-s$s.txt 2>&1; done; done
