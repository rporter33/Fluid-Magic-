#!/bin/bash
# usage: run.sh TXT_FILE...  (generates the .png beside each .txt, 3 at a time)
SP=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
printf '%s\n' "$@" | xargs -P 3 -I{} sh -c 't="{}"; o="${t%.txt}.png"; python3 '"$SP"'/art-tools/gemini_gen.py gemini-nano-banana-2.1 "$o" "$t" '"$SP"'/art-refs/p0-gpt-rim.png --aspect 1:1 2>&1 | tail -2'
