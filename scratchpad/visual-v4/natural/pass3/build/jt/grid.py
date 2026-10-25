# python3 -I grid.py <view> <wildid|full> <scale> [pad_world] [suffix] : 2x2 grid of the same crop from p2, relief, massif, open
import sys, json
from PIL import Image, ImageDraw, ImageFont
J = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/judge/'
view, wid, sc = sys.argv[1], sys.argv[2], float(sys.argv[3]); pad = float(sys.argv[4]) if len(sys.argv) > 4 else 30; suf = sys.argv[5] if len(sys.argv) > 5 else ''
WI = json.load(open(J + 'out/wildinfo.json')); W = {w['id']: w for w in WI['wilds']}
keys = ['p2', 'relief', 'massif', 'open']; tiles = []
for k in keys:
    d = J + 'shots/' + k + suf + '/'; cam = json.load(open(d + 'cams.json'))[view]; im = Image.open(d + view + '.png').convert('RGB'); r = im.width / 1440
    if wid == 'full': box = (232 * r, 113 * r, 1335 * r, 735 * r)
    elif wid.startswith('box'): box = tuple(r * float(v) for v in wid[3:].split('_'))
    else:
        x0, y0, x1, y1 = W[wid]['bbox']; f = lambda x, y: (r * (17 + cam['x'] + x * cam['s']), r * (69 + cam['y'] + y * cam['s']))
        a, b = f(x0 - pad, y0 - pad); c, e = f(x1 + pad, y1 + pad); box = (max(0, a), max(113 * r, b), min(1374 * r, c), min(735 * r, e))
    t = im.crop(tuple(int(v) for v in box)); t = t.resize((int(t.width * sc), int(t.height * sc)), Image.NEAREST if sc >= 1 else Image.LANCZOS)
    dr = ImageDraw.Draw(t); dr.rectangle((0, 0, 120, 22), fill=(0, 0, 0)); dr.text((5, 4), k + suf, fill=(255, 255, 255)); tiles.append(t)
w, h = max(t.width for t in tiles), max(t.height for t in tiles); g = Image.new('RGB', (2 * w + 6, 2 * h + 6), (255, 255, 255))
for i, t in enumerate(tiles): g.paste(t, ((i % 2) * (w + 6), (i // 2) * (h + 6)))
out = J + 'shots/grid/' + view + '-' + wid + suf + '.png'; import os; os.makedirs(J + 'shots/grid', exist_ok=True); g.save(out); print(out, g.size)
