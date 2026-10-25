#!/bin/bash
# Usage: run.sh TXT [TXT ...]  -- generates the .png beside each .txt, 3 at a time.
S=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad
printf '%s\n' "$@" | xargs -P 3 -I{} sh -c 'python3 '"$S"'/art-tools/gemini_gen.py gemini-nano-banana-2.1 "$(echo {} | sed s/\.txt$/.png/)" {} '"$S"'/art-refs/p0-gpt-rim.png --aspect 1:1'
