# Stage B troops2, round c: the one re-roll of R17 (Thorn Militia front: 14/15 and consistency fixed, but its follow
# frame's rim 4.3% against 2%) as a whole re-dress of the Ash Militia front (r2 re-dress, 15/15 on the Thorn Militia
# maquette, the same levy kit: surcoat, hooded cape, spear, no shield), its cloth moved to green and laid on magenta,
# the route the passing Thorn Militia back took; and R30, the Wolf Rider back's one re-roll (Pro), its failure named
# and the owner-kept front sheet given as the camera and figure reference.
# Usage: python3 t2_jobs_c.py   (writes ../bases/c.*.png, ../prompts/c.*.txt, ../jobs/c.json, ../jobs/r30.json)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import t2_base  # noqa: E402
from tr_prompts import BY, BANNED  # noqa: E402
from tr_r2 import dress_prompt  # noqa: E402
from t2_jobs import job, sh, BASES, JOBS, GREEN, ORANGE  # noqa: E402
from t2_jobs_b import KEEP, failed  # noqa: E402
import t2_wolf  # noqa: E402

rep, jobs = {}, []
u = BY['thornMilitia']
base = t2_base.build(os.path.join(BASES, 'c.tm.front.from-ashMilitia.png'), 'magenta', sh('r2.ashMilitia.front.dress'), 'ashMilitia',
                     'front', 'melee', [], recolor_primary=('hue', ORANGE, GREEN), report=rep)
swap = ('His iron skullcap and cloth band become a deep bottle-green hood, worn up; his short hooded shoulder cape becomes a '
        'short deep bottle-green hooded cloak over his shoulders and upper back; his padded jack becomes a bark-brown leather '
        'jerkin with padded sleeves and leather bracers; the long surcoat stays, deep bottle green, to just below the knees, '
        'held by a knotted rope belt; his face is bark-brown and weathered; the spear becomes a long dark hawthorn spear with '
        'a barbed head of bone and iron shaped like a great thorn, held exactly where the spear is held. ' + KEEP)
note = 'Image 1 shows a levy spearman of another army whose cloth was already dyed green for this sheet.'
p = dress_prompt(u, 'front', swap, note)
p = p.replace('Repaint every figure of Image 1', failed('a pink cast was left on the spear head and the edge of the face in the '
              'follow-through cell', 'Keep every edge in the figure\'s own colours: bone, iron, wood and skin, never pink.')
              + '\n\nRepaint every figure of Image 1', 1)
jobs.append(job('thornMilitia', 'front', 'dress', p, [base, u['styleRefs'][0]],
                'R17 re-roll thornMilitia front sheet (nb21 re-dress of the Ash Militia front r2 15/15, moved to green)', rnd='c'))
json.dump(jobs, open(os.path.join(JOBS, 'c.json'), 'w'), indent=1)
json.dump(rep, open(os.path.join(BASES, 'bases-c.json'), 'w'), indent=1)
print(jobs[0]['out'])
