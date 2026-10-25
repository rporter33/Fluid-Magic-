#!/bin/sh
# post-process jobs and print a one-line summary each
P=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/portraits
cd /tmp && python3 -I $P/tools/pt_post.py "$@" 2>&1 | python3 -c "
import sys,json
for l in sys.stdin:
  p=l.split(' ',2)
  if len(p)<3: print(l); continue
  rest=p[2]; d=json.JSONDecoder(); m,i=d.raw_decode(rest); f=rest[i:].strip()
  print(p[0],p[1],'top',m['top'],'low',m['low'],'cx',m['cx'],'rim',m['rim'],'r48',m['read48'],'muted',m['muted'],'bg',m['background'],m['bgSpread'],'floor',m.get('floor'),'side',m['side'],f)
"
