#!/bin/bash
# gen.sh PROMPT.txt -> regenerates PROMPT.png (+ .json), removing the old outputs first
S=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
txt="$1"; out="${txt%.txt}.png"; rm -f "$out" "${txt%.txt}.json"
r=$(python3 "$S/art-tools/gemini_gen.py" gemini-nano-banana-2.1 "$out" "$txt" "$S/art-refs/p0-gpt-rim.png" --aspect 1:1 2>&1 | tail -n 2 | tr '\n' ' ')
if [ -f "$out" ]; then echo "OK $(basename "$out")"; else echo "FAIL $(basename "$out") :: $r"; fi
