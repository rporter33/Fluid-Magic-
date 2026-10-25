#!/bin/sh
# syntax-check the built page's inline scripts
node -e "
const fs=require('fs'); const h=fs.readFileSync('/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/map/game-screen-v4.html','utf8'); const re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g; let m,k=0,bad=0; while((m=re.exec(h))){ try{ new Function(m[1]); }catch(e){ console.log('script',k,e.message); bad++;} k++; } console.log('scripts',k,'bad',bad);"
