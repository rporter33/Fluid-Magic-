#!/bin/bash
# fix2: the portrait r3 jobs in pairs (at most 2 in flight), after the reserve pair finishes
cd "$(dirname "$0")/tools"
while ! grep -q "used after" ../run-fix2-p1415.log 2>/dev/null; do sleep 5; done
for pair in "primordial-thornwood.01a primordial-thornwood.01b" "fireSprite.01b oakheart.01a" "livingMonolith-thornwood.01a ascendedHero-cinderHorde.01b"; do
  if [ -e ../STOPPED-402 ]; then echo STOPPED; break; fi
  PT_KEY='B fix2:' PT_CAP=30 python3 pt_run.py $pair --jobs ../jobs-r3.json --tag r3 --workers 2 --once
done
echo CHAIN-DONE
