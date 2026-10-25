# Stage C lance fix: before/after crops of every Ash Rider and Wolf Rider pose cell, both views (and the Wolf Rider's
# alternate front), from the shipped frames (pre-lance/) and the fixed ones, each pair on the battle's plains ground and
# aligned on the frame's ground anchor; source frames at 2x and the tier H atlas frames (as drawn at the top zoom) at 2x.
# Usage: python3 lance_cells.py OUTDIR
import json, os, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SC = os.path.abspath(os.path.join(HERE, '..'))
NEW = os.path.join(SC, 'atlas', 'creatures')
OLD = os.path.join(SC, 'pre-lance', 'units', 'stage-c', 'atlas', 'creatures')
GROUND = (168, 167, 132, 255)  # plains (checks.py GROUNDS)
VIEWS = [('ashRider', 'front'), ('ashRider', 'back'), ('wolfRider', 'front'), ('wolfRider', 'back'), ('wolfRider', 'frontKept')]


def src_frames(root, fig, view):
    vname = 'front' if view == 'frontKept' else view
    d = os.path.join(root, 'frames', f'{fig}.{view}')
    meta = json.load(open(os.path.join(d, f'{fig}.{vname}.json')))
    return {f['name']: (Image.open(os.path.join(d, f['file'])).convert('RGBA'), f['anchor']) for f in meta['frames']
            if not f.get('missing') and f.get('file') and os.path.exists(os.path.join(d, f['file']))}


def atlas_frames(root, fig, view, tier):
    j = json.load(open(os.path.join(root, f'{fig}-{tier}.0.json')))['frames']
    img = Image.open(os.path.join(root, f'{fig}-{tier}.0.png')).convert('RGBA')
    out = {}
    for n, f in j.items():
        p = n.split('.')
        if p[1] != view or n.endswith('.white'):
            continue
        r = f['frame']
        im = img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
        out[p[2]] = (im, (f['anchor']['x'] * r['w'], f['anchor']['y'] * r['h']))
    return out


def pair(a, b, sc, label):
    (ia, aa), (ib, ab) = a, b
    left = max(aa[0], ab[0]); right = max(ia.width - aa[0], ib.width - ab[0])
    up = max(aa[1], ab[1]); down = max(ia.height - aa[1], ib.height - ab[1])
    W, H = int(left + right + 0.5) + 4, int(up + down + 0.5) + 4
    tiles = []
    for im, an in ((ia, aa), (ib, ab)):
        c = Image.new('RGBA', (W, H), GROUND)
        c.alpha_composite(im, (int(round(left - an[0])) + 2, int(round(up - an[1])) + 2))
        tiles.append(c.resize((W * sc, H * sc), Image.NEAREST))
    out = Image.new('RGBA', (tiles[0].width * 2 + 6, tiles[0].height + 16), (40, 40, 40, 255))
    out.paste(tiles[0], (0, 16)); out.paste(tiles[1], (tiles[0].width + 6, 16))
    d = ImageDraw.Draw(out)
    d.text((3, 2), f'{label}  before', fill=(255, 255, 255, 255)); d.text((tiles[0].width + 9, 2), 'after', fill=(255, 255, 120, 255))
    return out


def sheet(pairs, cols, maxw=2400):
    """Pairs flowed into rows at most maxw px wide (cols is the most per row)."""
    rows, cur, w = [], [], 0
    for p in pairs:
        if cur and (w + p.width + 8 > maxw or len(cur) >= cols):
            rows.append(cur); cur, w = [], 0
        cur.append(p); w += p.width + 8
    if cur:
        rows.append(cur)
    W = max(sum(p.width + 8 for p in r) for r in rows); H = sum(max(p.height for p in r) + 8 for r in rows)
    out = Image.new('RGBA', (W, H), (24, 24, 24, 255))
    y = 0
    for r in rows:
        x = 0
        for p in r:
            out.paste(p, (x, y)); x += p.width + 8
        y += max(p.height for p in r) + 8
    return out


def main(outdir):
    os.makedirs(outdir, exist_ok=True)
    made = []
    for fig, view in VIEWS:
        o, n = src_frames(OLD, fig, view), src_frames(NEW, fig, view)
        names = [k for k in n if k in o]
        pairs = [pair(o[k], n[k], 2, k) for k in names]
        p = os.path.join(outdir, f'cells-{fig}-{view}-src2x.png')
        sheet(pairs, 6).convert('RGB').save(p); made.append(p)
        for k in names:  # every pose cell on its own too
            pp = os.path.join(outdir, 'cells', f'{fig}-{view}-{k}.png')
            os.makedirs(os.path.dirname(pp), exist_ok=True)
            pair(o[k], n[k], 3, f'{fig} {view} {k}').convert('RGB').save(pp)
        oh, nh = atlas_frames(OLD, fig, view, 'H'), atlas_frames(NEW, fig, view, 'H')
        pairs = [pair(oh[k], nh[k], 2, k + ' (tier H)') for k in nh if k in oh]
        p = os.path.join(outdir, f'cells-{fig}-{view}-tierH2x.png')
        sheet(pairs, 6).convert('RGB').save(p); made.append(p)
    print('\n'.join(made))


if __name__ == '__main__':
    main(sys.argv[1])
