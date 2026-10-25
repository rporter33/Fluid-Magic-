#!/bin/bash
cd /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/integrate/tools
Q=/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/fix2/qa
echo "wound $(date +%T)"; node drv.cjs $Q/wound.js > $Q/wound.out 2>&1
echo "checks painted $(date +%T)"; FIG=painted node drv.cjs $Q/checks.js > $Q/checks-painted.out 2>&1
echo "checks procedural $(date +%T)"; FIG=procedural TIMING=1 node drv.cjs $Q/checks.js > $Q/checks-procedural.out 2>&1
echo "cmdvis $(date +%T)"; node drv.cjs /tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique/tools/cmdvis.js > $Q/cmdvis.out 2>&1
echo "QADONE $(date +%T)"
