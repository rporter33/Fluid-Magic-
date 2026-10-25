# The art director's look: each action beside its approved idle cutout, at play size (a man 28 wu = 28 px: 1 wu per px)
# and at 4x (0.25 wu per px, the tier H scale), on the plains ground of battle a, every frame standing on one ground line
# by its ground anchor (so a size jump or a sliding foot shows), with the anchors marked at 4x: ground (white cross), weapon
# tip (red), mouth (orange), feet (cyan).
# Usage: python3 -I dd_board.py FIGURE VIEW [TAG ...] [--out OUT.png]   (TAG: cut folders to show; default: the job outputs)
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import dd_final  # noqa: E402
PROD = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(PROD, '..', '..'))
CUT = os.path.join(PROD, 'cut')
PLAINS = (168, 167, 132)


def frames_for(fig, view, tags=None):
    out = []
    idle = json.load(open(os.path.join(CUT, f'{fig}.{view}.idle', 'idle.json')))
    out.append(dict(name='idle', png=os.path.join(UNITS, idle['file']), wpp=idle['wuPerPx'], anchor=idle['anchor'], points=idle['points']))
    jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
    if not tags:
        tags = [os.path.basename(j['out']).rsplit('.png', 1)[0] for j in jobs if j['figure'] == fig and j['view'] == view]
    sel = json.load(open(os.path.join(PROD, 'selection.json'))) if os.path.exists(os.path.join(PROD, 'selection.json')) else {}
    for t in tags:
        p = os.path.join(CUT, t, 'post.json')
        if not os.path.exists(p):
            continue
        rep = json.load(open(p))
        job = rep['job']
        for r in rep['frames']:
            if r.get('missing'):
                continue
            s_ = sel.get(job)
            if s_ == 'skip':
                continue
            if isinstance(s_, str) and s_ != t:
                p2 = os.path.join(CUT, s_, 'post.json')
                if os.path.exists(p2):
                    r = next((x for x in json.load(open(p2))['frames'] if x['action'] == r['action']), r); t2 = s_
                else:
                    t2 = t
            elif isinstance(s_, dict) and r['action'] in s_:
                t2 = s_[r['action']]
                if t2 == 'skip':
                    continue
                r = next((x for x in json.load(open(os.path.join(CUT, t2, 'post.json')))['frames'] if x['action'] == r['action']), r)
            else:
                t2 = t
            png = os.path.join(CUT, t2, r['file'])
            rr = dd_final.resolve(fig, view, r, png, job, sel)
            gf = rr.get('groundFix') or {}
            out.append(dict(name=r['action'] + ('*' if t2 != t else '') + (f" g{gf['shiftWu']:+.0f}" if gf.get('applied') else ''), png=png, wpp=rr['wuPerPx'],
                            anchor=rr['anchor'], anchor0=rr.get('anchorBeforeGroundFix'), points=rr['points'], flags=r.get('flags'), tag=t2,
                            rule=rr['scaleRule'], fix={k: rr[k] for k in ('fadeTop', 'fadeEdge', 'eraseClay', 'warmClay') if rr.get(k)}))
    return out


def board(fig, view, tags=None, out=None):
    fr = frames_for(fig, view, tags)
    rows = []
    for target in (1.0, 0.25):
        ims = []
        for f in fr:
            im = Image.open(f['png']).convert('RGBA')
            if f.get('fix'):
                im = Image.fromarray(np.clip(dd_final.finish(np.asarray(im).astype(np.float64), f['fix']), 0, 255).astype(np.uint8), 'RGBA')
            k = f['wpp'] / target
            s = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
            ims.append((s, [f['anchor'][0] * k, f['anchor'][1] * k], {n: [p[0] * k, p[1] * k] for n, p in f['points'].items()}, f))
        above = max(a[1] for _, a, _, _ in ims) + 10
        below = max(s.height - a[1] for s, a, _, _ in ims) + 10
        gap = 12 if target == 1.0 else 30
        W = sum(s.width for s, _, _, _ in ims) + gap * (len(ims) + 1)
        H = int(above + below + 18)
        row = Image.new('RGB', (int(W), H), PLAINS)
        d = ImageDraw.Draw(row)
        x = gap
        for s, a, pts, f in ims:
            px, py = int(x), int(above - a[1])
            row.paste(s, (px, py), s)
            if target != 1.0:
                ax, ay = px + a[0], py + a[1]
                d.line([(ax - 8, ay), (ax + 8, ay)], fill=(255, 255, 255), width=2); d.line([(ax, ay - 8), (ax, ay + 8)], fill=(255, 255, 255), width=2)
                if f.get('anchor0'):
                    oy_ = py + f['anchor0'][1] * k
                    d.line([(ax - 6, oy_), (ax + 6, oy_)], fill=(90, 90, 90), width=1); d.line([(ax, oy_), (ax, ay)], fill=(90, 90, 90), width=1)
                for n, q in pts.items():
                    if not n.endswith('Snapped'):
                        continue
                    c = (230, 30, 30) if n.startswith('tip') else (255, 150, 0) if n.startswith('mouth') else (0, 220, 255) if n.startswith(('foot', 'talon')) else None
                    if c:
                        qx, qy = px + q[0], py + q[1]
                        d.ellipse([qx - 5, qy - 5, qx + 5, qy + 5], outline=c, width=2)
            d.text((px, H - 16), f['name'] + (' !' + ','.join(f['flags']) if f.get('flags') else ''), fill=(20, 20, 20))
            x += s.width + gap
        d.line([(0, int(above)), (W, int(above))], fill=(140, 140, 110), width=1)
        rows.append(row)
    W = max(r.width for r in rows)
    B = Image.new('RGB', (W, sum(r.height for r in rows) + 8), (60, 60, 60))
    y = 0
    for r in rows:
        B.paste(r, (0, y)); y += r.height + 8
    out = out or os.path.join(PROD, 'look', f'board-{fig}.{view}.png')
    B.save(out)
    return out, B.size


if __name__ == '__main__':
    a = sys.argv[1:]
    out = None
    if '--out' in a:
        i = a.index('--out'); out = a[i + 1]; del a[i:i + 2]
    print(board(a[0], a[1], a[2:] or None, out))
