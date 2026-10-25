#!/bin/sh
# experimental variant: exp.sh <name> <sed-expr> [part]  -> build/exp/<name>/game-screen-v4.html
B=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build; L=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map
D=$B/exp/$1; P=${3:-p58x-massif-gen.js}; rm -rf $D; mkdir -p $D; cp -a $L/parts $D/parts; cp $L/build.sh $D/build.sh
sed -i "$2" $D/parts/$P; diff -q $L/parts/$P $D/parts/$P >/dev/null && echo "PATCH FAILED $1"; sh $D/build.sh >/dev/null; md5sum $D/game-screen-v4.html
