# Stage B portraits: a contact board per group (work/portraits/review/contact-<group>.png), the 64 px atlas and the
# index (stage-b/atlas/portraits/). A board row is one subject; its cells are the candidates at 256 px, with the 64 px
# card (gods: the card crop) at 1x and 2x, the check numbers and the verdict; a job without an image is drawn as a
# placeholder that says why.
# Usage: python3 pt_board.py [--out-root DIR] [--review DIR] [--atlas DIR]
import json, os, re, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W, '..', '..'))
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BG = (28, 26, 23)
INK = (236, 228, 214)
DIM = (150, 142, 130)
OKC = (120, 200, 120)
BAD = (230, 110, 90)

GROUPS = [
    ('creatures', 'Creatures (plan 3.1): busts in the leader template', lambda j: j['group'] == 'creatures'),
    ('mounts', 'Mounts (plan 3.1): head-and-neck busts in battle tack', lambda j: j['group'] == 'mounts'),
    ('gods-generic', 'Gods, generic chassis: Cinder palette (new) and Thornwood palette (edit of the same candidate)',
     lambda j: j['group'] == 'gods' and j['unit'] in ('oracle', 'titan', 'greatWyrm', 'livingMonolith', 'ascendedHero', 'primordial')),
    ('gods-cinder', 'Gods, Cinder realm chassis', lambda j: j['group'] == 'gods' and j['nation'] == 'cinderHorde'
     and j['unit'] in ('ashColossus', 'ashPhoenix', 'pyreLord', 'cinderIdol', 'emberHierophant')),
    ('gods-thornwood', 'Gods, Thornwood realm chassis', lambda j: j['group'] == 'gods' and j['nation'] == 'thornwood'
     and j['unit'] in ('wildSpirit', 'worldTree', 'hornedHunter', 'elderWyrm', 'motherOfBeasts')),
]


def font(n):
    try:
        return ImageFont.truetype(FONT, n)
    except OSError:
        return ImageFont.load_default()


def side_text(ms):
    s = ms.get('side')
    if not s:
        return ''
    return f"side {s['window']:.3f}" + (f" lock {s['lock']:.3f}" if 'lock' in s else '')


CW, CH = 276, 500


def cell(job, out_root, fails_note):
    name = f"{job['face']}{job['cand']}"
    d = os.path.join(out_root, job['nation'], job['unit'])
    meta_p = os.path.join(d, f'{name}.json')
    c = Image.new('RGB', (CW, CH), BG)
    dr = ImageDraw.Draw(c)
    dr.text((10, 4), f"{job['nation'][:5]} {job['unit']} {name}", fill=INK, font=font(13))
    if not os.path.exists(meta_p):
        dr.rectangle((10, 24, 266, 280), outline=DIM)
        dr.text((22, 130), 'not generated', fill=BAD, font=font(16))
        note = fails_note.get(job['job'], '')
        for k in range(0, min(len(note), 120), 40):
            dr.text((22, 154 + k // 40 * 14), note[k:k + 40], fill=DIM, font=font(11))
        return c, None
    meta = json.load(open(meta_p))
    im = Image.open(os.path.join(d, meta['files']['game'])).convert('RGB')
    c.paste(im, (10, 24))
    if meta.get('cardCrop'):
        x0, y0, x1, y1 = meta['cardCrop']['box512']
        dr.rectangle((10 + x0 // 2, 24 + y0 // 2, 10 + x1 // 2, 24 + y1 // 2), outline=(200, 170, 90))
    sm = Image.open(os.path.join(d, meta['files']['small'])).convert('RGB')
    c.paste(sm, (10, 288))
    c.paste(sm.resize((128, 128), Image.NEAREST), (80, 288))
    ms = meta['checks']['measures']
    ok = meta['checks']['passed']
    dr.text((216, 290), 'PASS' if ok else 'FAIL', fill=OKC if ok else BAD, font=font(15))
    dr.text((216, 312), '64 px', fill=DIM, font=font(10))
    dr.text((216, 326), '(1x, 2x)', fill=DIM, font=font(10))
    yy = 424
    for t in (f"bg {ms['background']}  plain {ms['bgSpread']}  top {ms['top']}  low {ms['low']}",
              f"rim {ms['rim']}  read48 {ms['read48']}  muted {ms['muted']:.4f}",
              side_text(ms)):
        if t:
            dr.text((10, yy), t, fill=INK, font=font(10)); yy += 13
    for f in meta['checks']['failed'][:2]:
        dr.text((10, yy), f[:46], fill=BAD, font=font(10)); yy += 13
    return c, meta


def boards(out_root, review, fails_note):
    jobs = json.load(open(os.path.join(W, 'jobs.json')))
    made = []
    for key, title, pred in GROUPS:
        js = [j for j in jobs if pred(j)]
        rows = {}
        for j in js:
            rows.setdefault(j['unit'] + ('' if j['group'] != 'gods' or key == 'gods-generic' else j['nation']) +
                            ('' if j['unit'] != 'giant' else j['face']), []).append(j)
        cols = max(len(v) for v in rows.values())
        bw, bh = 20 + cols * (CW + 8), 50 + len(rows) * (CH + 8)
        board = Image.new('RGB', (bw, bh), (18, 17, 15))
        ImageDraw.Draw(board).text((14, 12), title, fill=INK, font=font(20))
        for r, (k, v) in enumerate(rows.items()):
            v.sort(key=lambda j: (j['nation'] != 'cinderHorde', j['face'], j['cand']))
            for i, j in enumerate(v):
                c, _ = cell(j, out_root, fails_note)
                board.paste(c, (14 + i * (CW + 8), 46 + r * (CH + 8)))
        os.makedirs(review, exist_ok=True)
        p = os.path.join(review, f'contact-{key}.png')
        board.save(p)
        made.append(p)
    return made


def atlas(out_root, adir):
    """All 64 px portraits (gods: card crops) in one sheet with a Pixi spritesheet JSON, plus the index of every
    candidate (files, checks, marks, crop, provenance) for the owner's review page."""
    jobs = json.load(open(os.path.join(W, 'jobs.json')))
    metas = []
    for j in jobs:
        p = os.path.join(out_root, j['nation'], j['unit'], f"{j['face']}{j['cand']}.json")
        if os.path.exists(p):
            metas.append((j, json.load(open(p))))
    os.makedirs(adir, exist_ok=True)
    n = len(metas)
    if n == 0:
        _index(jobs, out_root, adir)
        return 0
    cols = 16
    rows = max(1, (n + cols - 1) // cols)
    sheet = Image.new('RGBA', (cols * 66, rows * 66), (0, 0, 0, 0))
    frames = {}
    for i, (j, m) in enumerate(metas):
        x, y = (i % cols) * 66 + 1, (i // cols) * 66 + 1
        im = Image.open(os.path.join(out_root, j['nation'], j['unit'], m['files']['small'])).convert('RGBA')
        sheet.paste(im, (x, y))
        frames[m['id'] + '.' + j['nation']] = dict(frame=dict(x=x, y=y, w=64, h=64), sourceSize=dict(w=64, h=64),
                                                   rotated=False, trimmed=False)
    sheet.save(os.path.join(adir, 'portraits-64.png'))
    json.dump(dict(frames=frames, meta=dict(image='portraits-64.png', size=dict(w=sheet.width, h=sheet.height),
                                            format='RGBA8888', scale='1', note='stage B portrait candidates at 64 px; '
                                            'gods are their card crops')),
              open(os.path.join(adir, 'portraits-64.json'), 'w'), indent=1)
    _index(jobs, out_root, adir)
    return n


def _index(jobs, out_root, adir):
    idx = []
    for j in jobs:
        p = os.path.join(out_root, j['nation'], j['unit'], f"{j['face']}{j['cand']}.json")
        e = dict(job=j['job'], group=j['group'], unit=j['unit'], nation=j['nation'], face=j['face'], cand=j['cand'],
                 kind=j['kind'], route=j.get('route', 'new'), prompt=os.path.relpath(j['promptFile'], SB),
                 raw=os.path.relpath(j['out'], SB))
        if os.path.exists(p):
            m = json.load(open(p))
            e.update(dir=os.path.relpath(os.path.dirname(p), SB), files=m['files'], passed=m['checks']['passed'],
                     failed=m['checks']['failed'], measures=m['checks']['measures'], marks=m['identityMarks'],
                     cardCrop=m.get('cardCrop'), sha256=m['sourceSha256'], status='made')
        else:
            e.update(status='not generated')
        idx.append(e)
    json.dump(dict(stage='B', key='portraits', candidates=idx), open(os.path.join(adir, 'index.json'), 'w'), indent=1)


if __name__ == '__main__':
    a = sys.argv[1:]
    out_root = os.path.join(SB, 'portraits')
    review = os.path.join(W, 'review')
    adir = os.path.join(SB, 'atlas', 'portraits')
    for k in ('--out-root', '--review', '--atlas'):
        if k in a:
            i = a.index(k); v = a[i + 1]; del a[i:i + 2]
            if k == '--out-root':
                out_root = v
            elif k == '--review':
                review = v
            else:
                adir = v
    fl = os.path.join(W, 'api-failures.json')
    note = {}
    if os.path.exists(fl):
        for f in json.load(open(fl)):
            for jid in f['job'].split(', '):
                note[jid.split(' ')[0]] = 'API: ' + re.sub(r'\s+', ' ', f['err'])[:110]
    for jid in [j['job'] for j in json.load(open(os.path.join(W, 'jobs.json')))]:
        note.setdefault(jid, 'API credits depleted (HTTP 402)')
    print(boards(out_root, review, note))
    print('atlas frames', atlas(out_root, adir))
