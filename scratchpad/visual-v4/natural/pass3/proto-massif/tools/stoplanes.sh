#!/bin/sh
for p in $(ps -eo pid,args | awk '$2=="sh" && $3 ~ /^lane[A-Z]\.sh$/ {print $1}'); do kill $p; done
for p in $(ps -eo pid,args | awk '$2=="node" && $3 ~ /\.cjs$/ {print $1}'); do cwd=$(readlink /proc/$p/cwd); case "$cwd" in *proto-massif*) kill $p;; esac; done
