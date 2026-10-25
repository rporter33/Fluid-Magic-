# Contact board read back from the bundled paint-data.json: every look the battles use, each view, every pose,
# drawn at the tier's own scale on a common baseline (anchor at the foot), so size pops between poses show.
# Usage: python3 -I board.py <tier S|H> <out.png> [look substring,...]
import base64, io, json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(HERE, '..', '..', 'integrate', 'paint-data.json')))
tier, out = sys.argv[1], sys.argv[2]
only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
pages = [Image.open(io.BytesIO(base64.b64decode(p['url'].split(',', 1)[1]))).convert('RGBA') for p in D['tiers'][tier]['pages']]
F = D['tiers'][tier]['frames']
POSES = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'brace', 'recoil', 'fall', 'deadA', 'deadB', 'fleeA', 'fleeB', 'cheer', 'dropped', 'nock', 'draw', 'loose', 'aim', 'throw', 'actA', 'actB']
rows = []
for key, L in sorted(D['looks'].items()):
    if only and not any(o in key for o in only):
        continue
    for v, vv in L['views'].items():
        cells = []
        for p in POSES:
            n = f"{L['prefix']}.{v}.{p}"
            if n not in F:
                continue
            pi, x, y, w, h, ax, ay = F[n][:7]
            cells.append((p, pages[pi].crop((x, y, x + w, y + h)), ax, ay))
        if cells:
            rows.append((f"{key} {v} [{vv['status']}]", cells))
k = 2 if tier == 'S' else 1
above = max(int(c[1].height * c[3]) for _, cs in rows for c in cs) * k
below = max(int(c[1].height * (1 - c[3])) for _, cs in rows for c in cs) * k
rowh = above + below + 26
W = max(sum(max(c[1].width * k, 60) + 6 for c in cs) for _, cs in rows) + 10
im = Image.new('RGB', (W, rowh * len(rows)), (150, 146, 128))
d = ImageDraw.Draw(im)
for r, (label, cells) in enumerate(rows):
    y0 = r * rowh
    d.text((4, y0 + 2), label, fill=(20, 20, 20))
    d.line((0, y0 + 14 + above, W, y0 + 14 + above), fill=(120, 116, 100))
    x = 6
    for p, c, ax, ay in cells:
        c2 = c.resize((c.width * k, c.height * k), Image.NEAREST)
        cw = max(c2.width, 60)
        im.paste(c2, (x + (cw - c2.width) // 2, y0 + 14 + above - int(round(c2.height * ay))), c2)
        d.text((x, y0 + rowh - 12), p, fill=(30, 30, 30))
        x += cw + 6
im.save(out)
print(out, im.size, len(rows), 'rows')
