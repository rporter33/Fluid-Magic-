# Contact board of raw action images for the named figures (back row, front row), with their guides small beside them.
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); PROD = os.path.abspath(os.path.join(HERE, '..'))
jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
out = sys.argv[1]; figs = sys.argv[2:]
T = 520
rows = []
for fig in figs:
    ims = []
    for v in ('back', 'front'):
        js = [j for j in jobs if j['figure'] == fig and j['view'] == v and os.path.exists(j['out'])]
        for j in js:
            im = Image.open(j['out']).convert('RGB'); im.thumbnail((T, T))
            g = Image.open(j['refs'][0]).convert('RGB'); g.thumbnail((T // 4, T // 4))
            c = Image.new('RGB', (im.width + g.width + 4, max(im.height, g.height)), (30, 30, 30))
            c.paste(im, (0, 0)); c.paste(g, (im.width + 4, 0))
            ImageDraw.Draw(c).text((4, 4), j['job'], fill=(255, 255, 255))
            ims.append(c)
    if ims:
        rows.append(ims)
W = max(sum(i.width + 6 for i in r) for r in rows); H = sum(max(i.height for i in r) + 6 for r in rows)
B = Image.new('RGB', (W, H), (60, 60, 60)); y = 0
for r in rows:
    x = 0
    for i in r:
        B.paste(i, (x, y)); x += i.width + 6
    y += max(i.height for i in r) + 6
B.save(out); print(out, B.size)
