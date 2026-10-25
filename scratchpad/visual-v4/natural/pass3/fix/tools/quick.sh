#!/bin/sh
# quick art loop: build, shoot start / near grey / max ash / max grey, make a strip: sh quick.sh <tag> [query]
T=$1; Q=${2:--}; cd "$(dirname "$0")"; sh ../../../../map/build.sh >/dev/null && VIEWS=01-start,04-mid-grey-mere,08-max-ash,09-max-grey timeout 600 node art.cjs $T - "$Q" 2>&1 | grep -v ' look ' | grep -v times
python3 - "$T" <<'PY'
import sys
from PIL import Image
t=sys.argv[1]; d='../wip/'+t+'/'
ims=[Image.open(d+f) for f in ['01-start.png','04-mid-grey-mere.png','08-max-ash.png','09-max-grey.png']]
s=Image.new('RGB',(sum(i.width for i in ims), max(i.height for i in ims)),(30,30,30)); x=0
for i in ims: s.paste(i,(x,0)); x+=i.width
s.save(d+'_strip.png'); print(d+'_strip.png', s.size)
PY
