#!/bin/bash
# the art director's final contact boards: every painted figure, both views, as shipped (look/final/<figure>.png)
cd "$(dirname "$0")"
for f in salamander-01 salamander-02 salamander-03 salamander-04 treant-01 treant-02 treant-03 treant-04 giant-01 giant-02 titan-cinderHorde ascendedHero-cinderHorde oracle-cinderHorde pyreLord-cinderHorde emberHierophant-cinderHorde ashColossus-cinderHorde hornedHunter-thornwood motherOfBeasts-thornwood wildSpirit-thornwood ashPhoenix-cinderHorde greatWyrm-cinderHorde primordial-cinderHorde elderWyrm-thornwood worldTree-thornwood livingMonolith-cinderHorde cinderIdol-cinderHorde; do
  python3 -I dd_boardpair.py ../look/final/board-$f.png $f:back $f:front
done
rm -f ../look/board-*.png
echo boards done
