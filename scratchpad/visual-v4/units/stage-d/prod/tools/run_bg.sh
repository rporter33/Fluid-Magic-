#!/bin/bash
# run_bg.sh NAME CMD... : runs CMD niced in the background, log ../logs/NAME.log, pid ../logs/NAME.pid
cd "$(dirname "$0")"
name=$1; shift
nohup nice -n 12 "$@" > ../logs/$name.log 2>&1 &
echo $! > ../logs/$name.pid
echo "$name pid $!"
