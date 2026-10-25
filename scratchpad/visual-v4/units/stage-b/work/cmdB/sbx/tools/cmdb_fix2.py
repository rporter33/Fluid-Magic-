# Stage B fix2 (critique-resume fix 10, B5): Warden Captains 05 and 07 are twins from behind (one back body, one leaf
# cloak). Warden Captain 07's back is re-dressed with his own portrait's marks seen from behind: no cloak; the bark-scale
# cuirass and its overlapping back plates show; a short collar of dark fern fronds over the shoulders; the antlered
# scale helm. Same route as every cmdB re-dress (cmdb.redress_job: the twChief back body as Image 1, portrait 07 as
# Image 2), tag ".f2". Usage: python3 cmdb_fix2.py   (writes ../../jobs/fix2-wc07-back.json)
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402

kind, nat, unit, num, sex, marks = cmdb.FACES['wc07']
new = [('the helm of overlapping pine-bark scales with short swept-back antlers', True),
       ('his narrow clean-shaven face with a leaf-shaped green tattoo on the cheek', False),
       ('no cloak: the cuirass of overlapping bark scales and its overlapping back plates show across the whole back, '
        'with a short collar of dark fern fronds over the shoulders', True),
       ('the clasp shaped like a pine cone', False),
       ('the armour of layered bark scales', True), marks[-1]]
cmdb.FACES['wc07'] = (kind, nat, unit, num, sex, new)
EXTRA = ('Image 1\'s leaf cloak is removed entirely for this leader: he wears no cloak and no cape, so the bark-scale '
         'cuirass and its overlapping back plates show from the collar to the belt, and only a short collar of dark fern '
         'fronds lies over his shoulders; the outline narrows where the cloak was, and every figure keeps its place, '
         'size, pose and facing.')
j = cmdb.redress_job('wc07', 'back', '.f2', EXTRA)
j['purpose'] = 'B5 wc07 back re-dress (no cloak: bark-scale back plates, fern collar; critique-resume fix 10) ' + j['purpose']
json.dump([j], open(os.path.join(cmdb.W, 'jobs', 'fix2-wc07-back.json'), 'w'), indent=1)
print(j['out']); print(open(j['promptFile']).read())
