#!/bin/bash
# gen_one.sh PROMPT.txt -> PROMPT.png (+ .json) via the anchor-referenced generator
S=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
txt="$1"; out="${txt%.txt}.png"
python3 "$S/art-tools/gemini_gen.py" gemini-nano-banana-2.1 "$out" "$txt" "$S/art-refs/p0-gpt-rim.png" --aspect 1:1 2>&1 | tail -n 2
