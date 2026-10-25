# Stage B troops, round 3: the one re-roll of the Thorn Militia front, which passed the camera (13/15) in round 1 but
# failed the consistency gate (its stand frame shows a brown jerkin over the chest, its recoil and cheer frames the green
# surcoat: cheer dE 13.5 against 12). Route: a Nano Banana 2.1 edit of its own sheet (review change 7).
# Usage: python3 tr_r3.py   (writes ../../jobs/r3.json)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from tr_r2 import job, edit_prompt, R1, BY, NB, JOBS  # noqa: E402

change = ('Change only the soldier\'s body clothing, the same way in every cell, to match the hit and the cheering cells (row '
          '3, column 1 and row 4, column 3): the long deep bottle-green surcoat covers his whole chest and belly from the '
          'collar down to just below the knees, over the brown leather jerkin, belted at the waist with a knotted rope; only '
          'his sleeves are brown leather. The short green hooded cloak stays over his shoulders, the hood up. In the first '
          'four cells too, the chest is green cloth, not brown leather.')
j = job('thornMilitia', 'front', 'edit', edit_prompt(BY['thornMilitia'], 'front', change),
        [R1('thornMilitia.front'), BY['thornMilitia']['styleRefs'][0]],
        'thornMilitia front sheet (re-roll, nb21 edit of its own r1 sheet: surcoat over the chest in every cell)', NB)
j.update(round='r3', out=j['out'].replace('/r2.', '/r3.'), promptFile=j['promptFile'])
os.replace(j['promptFile'], j['promptFile'].replace('/r2.', '/r3.')); j['promptFile'] = j['promptFile'].replace('/r2.', '/r3.')
json.dump([j], open(os.path.join(JOBS, 'r3.json'), 'w'), indent=1)
print(j['out'])
