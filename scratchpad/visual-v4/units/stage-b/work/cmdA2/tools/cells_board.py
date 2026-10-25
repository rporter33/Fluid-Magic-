# cmdA2: a board of chosen cells: the guide cell, then each sheet's frame of that cell on a mid-grey ground,
# labelled with (IoU, facing margin) from its checks.json. Usage:
#   python3 cells_board.py OUT.png FIG VIEW CELL[,CELL...] DIR[:LABEL] ...   (DIR holds frames/ and checks.json)
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw
TOOLS = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdA/sbx/tools'
sys.path.insert(0, TOOLS)
from checks import guide_cells  # noqa
out, fig, view, cells = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].split(',')
dirs = sys.argv[5:]
GUIDE = os.path.join(TOOLS, '..', 'refs', 'guides', f'{fig}.{view}.png')
gc = guide_cells(GUIDE, fig, view)
S = 150
W = Image.new('RGB', ((len(dirs) + 1) * S + 90, len(cells) * (S + 14) + 20), (60, 60, 60))
d = ImageDraw.Draw(W)
for ci, c in enumerate(cells):
    y = 20 + ci * (S + 14)
    d.text((4, y + 60), c, fill=(255, 255, 255))
    if c in gc:
        m = gc[c]['mask']; im = Image.fromarray((m * 200).astype(np.uint8)).convert('RGB')
        im.thumbnail((S, S)); W.paste(im, (90, y))
    for di, dd in enumerate(dirs):
        p, lab = (dd.split(':') + [None])[:2]
        lab = lab or os.path.basename(p.rstrip('/'))
        if ci == 0:
            d.text((90 + (di + 1) * S + 4, 4), lab[:22], fill=(255, 255, 0))
        fd = os.path.join(p, 'frames')
        meta = json.load(open(os.path.join(fd, f'{fig}.{view}.json'))) if os.path.exists(os.path.join(fd, f'{fig}.{view}.json')) else None
        if meta is None:
            mj = [f for f in os.listdir(fd) if f.endswith('.json')][0]; meta = json.load(open(os.path.join(fd, mj)))
        fr = {f['name']: f for f in meta['frames'] if not f.get('missing')}
        if c not in fr:
            continue
        im = Image.open(os.path.join(fd, fr[c]['file'])).convert('RGBA')
        bg = Image.new('RGBA', im.size, (120, 120, 112, 255)); bg.alpha_composite(im)
        bg = bg.convert('RGB'); bg.thumbnail((S, S)); W.paste(bg, (90 + (di + 1) * S, y))
        ck = os.path.join(p, 'checks.json')
        if os.path.exists(ck):
            r = json.load(open(ck)); cc = (r.get('cameraRel') or r.get('cameraAll') or {}).get('cells', {}).get(c)
            if cc:
                ok = cc[0] >= 0.55 and cc[1] >= 0
                d.text((92 + (di + 1) * S, y + S - 2), '%.2f %+.3f' % (cc[0], cc[1]), fill=(120, 255, 120) if ok else (255, 90, 90))
W.save(out)
print(out)
