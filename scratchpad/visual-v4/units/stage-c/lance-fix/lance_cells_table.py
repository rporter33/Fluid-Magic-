# Stage C lance fix: per view and pose cell, what the slicer saw before and after (parts, specks dropped, frame size) and
# how many figure pixels (alpha > 0.35) the fix restored; written into record.json as 'cells'.
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
PRE = os.path.join(SC, 'pre-lance', 'units', 'stage-c', 'work', 'creatures', 'sheets')
NEW = os.path.join(SC, 'work', 'creatures', 'sheets')
JOBS = [('ashRider.front.cfix.r2', 'ashRider', 'front'), ('ashRider.back.fill', 'ashRider', 'back'),
        ('wolfRider.front.harness', 'wolfRider', 'front'), ('wolfRider.front.kept', 'wolfRider', 'front')]


def frames(root, job, fig, view):
    d = os.path.join(root, job, 'frames0')
    m = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    return d, {f['name']: f for f in m['frames']}


out = {}
for job, fig, view in JOBS:
    od, of = frames(PRE, job, fig, view)
    nd, nf = frames(NEW, job, fig, view)
    shafts = json.load(open(os.path.join(NEW, job, 'key.json'))).get('shafts') or []
    rows = {}
    for name, f in nf.items():
        o = of.get(name)
        if f.get('missing') or not o or o.get('missing'):
            continue
        A = np.zeros((896, 1200), bool); B = np.zeros((896, 1200), bool)
        oa = np.asarray(Image.open(os.path.join(od, o['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
        na = np.asarray(Image.open(os.path.join(nd, f['file'])).convert('RGBA'))[..., 3] > 0.35 * 255
        x0, y0, x1, y1 = o['box']; A[y0:y1, x0:x1] = oa
        x0, y0, x1, y1 = f['box']; B[y0:y1, x0:x1] = na
        restored = int((B & ~A).sum())
        cell = (int(f['box'][0] + f['anchor'][0]) // 300, int(f['box'][1] + f['anchor'][1]) // 224)
        lines = [dict(angle=s['angle'], found=s['found'], traced=s['traced'], raised=s['raised']) for s in shafts
                 if f['box'][0] <= s['at'][0] < f['box'][2] and f['box'][1] <= s['at'][1] < f['box'][3]]
        rows[name] = dict(partsBefore=o.get('parts'), specksDroppedBefore=o.get('specksDropped', 0), partsAfter=f.get('parts'),
                          specksDroppedAfter=f.get('specksDropped', 0), sizeBefore=o['size'], sizeAfter=f['size'],
                          restoredPx=restored, shafts=lines)
    out[f'{fig}.{view}' + ('Kept' if job.endswith('kept') else '')] = dict(job=job, cells=rows)
rp = os.path.join(HERE, 'record.json')
rec = json.load(open(rp))
rec['cells'] = out
json.dump(rec, open(rp, 'w'), indent=1)
for v, x in out.items():
    print(v, x['job'])
    for n, r in x['cells'].items():
        if r['restoredPx'] or r['shafts']:
            print(f"   {n:8s} parts {r['partsBefore']}->{r['partsAfter']} specks {r['specksDroppedBefore']}->{r['specksDroppedAfter']} size {r['sizeBefore']}->{r['sizeAfter']} restored {r['restoredPx']} px; lines {[(s['angle'], s['found'], s['traced']) for s in r['shafts']]}")
