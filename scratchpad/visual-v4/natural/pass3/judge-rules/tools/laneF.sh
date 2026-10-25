#!/bin/sh
cd "$(dirname "$0")"
for p in p2 relief massif open; do node dump.cjs $p natural 1 start,min,mid,ref,ash,grey,mere,ashMax > ../out/run-dump-$p.txt 2>&1; done
