#!/bin/bash
# back-off probe: one real job (ed01 front re-dress); logged by cmdgen.py
sleep $1
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdB/sbx/tools && python3 cmdgen.py --purpose "commander re-dress elderDruid 01 front onto cmdDruid front body (cal, 16/16) (nb21), API retry after back-off" gemini-nano-banana-2.1 /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/raw/cmdB/ed01.front.redress.nb21.png /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdB/prompts/ed01.front.redress.txt /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/cal/raw/cmdDruid.front.body.g3pro.png /home/user/Fluid-Magic-/art-source/portraits/thornwood/elderDruid/01.webp --aspect 1:1 2>&1 | head -5
echo "EXIT ${PIPESTATUS[0]} $(date +%H:%M:%S)"
