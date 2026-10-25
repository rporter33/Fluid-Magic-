# Stage C gods: a quick look at maquettes (preview or final), each god's two views beside its picked portrait.
# Usage: python3 -I gd_montage.py GUIDE_DIR OUT.png [god ...]
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve, GODS  # noqa: E402

d, out = sys.argv[1], sys.argv[2]
ids = sys.argv[3:] or GODS
R = resolve()
H = 300
rows = []
for g in ids:
    ims = []
    n = 'cinderHorde' if 'cinderHorde' in R[g] else 'thornwood'
    ims.append(Image.open(R[g][n]['p512']).convert('RGB').resize((H, H)))
    for v in ('back', 'front'):
        p = os.path.join(d, f'{g}.idle.{v}.png')
        if os.path.exists(p):
            im = Image.open(p).convert('RGB'); ims.append(im.resize((int(im.width * H / im.height), H)))
    W = sum(i.width for i in ims) + 8 * len(ims) + 140
    row = Image.new('RGB', (W, H), (30, 30, 30)); x = 140
    ImageDraw.Draw(row).text((6, 6), g, fill=(255, 255, 255))
    for i in ims:
        row.paste(i, (x, 0)); x += i.width + 8
    rows.append(row)
W = max(r.width for r in rows)
s = Image.new('RGB', (W, sum(r.height + 6 for r in rows)), (20, 20, 20)); y = 0
for r in rows:
    s.paste(r, (0, y)); y += r.height + 6
s.save(out); print(out, s.size)
