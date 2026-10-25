#!/bin/bash
# gen.sh ID [ID...] : generate round2-redo/<ID>.png from round2-redo/<ID>.txt, 3 at a time
S=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
D=$S/art-gen/round2-redo
printf '%s\n' "$@" | xargs -P 3 -I{} sh -c "python3 $S/art-tools/gemini_gen.py gemini-nano-banana-2.1 $D/{}.png $D/{}.txt $S/art-refs/p0-gpt-rim.png --aspect 1:1 2>&1 | tail -n 1; echo '{}' >> $D/gen.log"
