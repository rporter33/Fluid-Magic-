# cmdA2: a board from the PACKED atlases (atlas/cmdA): per face, its portrait, then chosen poses of both views at tier S
# (play zoom, side keyline) and tier H, standing on a mid ground at their packed scale, anchors aligned on one baseline;
# a red frame marks a view that is reported (its checks failed). Usage:
#   python3 atlas_board.py OUT.png TIER POSES FACE ...    (POSES like stand,actA,strike,fall; FACE like ac03)
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import a2cfg as C  # noqa: E402
import cmda  # noqa: E402
ATLAS = os.path.join(C.STAGEB, 'atlas', 'cmdA')
out, tier, poses, faces = sys.argv[1], sys.argv[2], sys.argv[3].split(','), sys.argv[4:]
_pages = {}


def page(img):
    if img not in _pages:
        _pages[img] = Image.open(os.path.join(ATLAS, img)).convert('RGBA')
    return _pages[img]


def frame(unit, name):
    for fn in sorted(os.listdir(ATLAS)):
        if fn.startswith(unit + '.' + tier + '.') and fn.endswith('.json'):
            j = json.load(open(os.path.join(ATLAS, fn)))
            if name in j['frames']:
                f = j['frames'][name]; r = f['frame']
                return page(j['meta']['image']).crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h'])), f['anchor']
    return None, None


k = 2 if tier == 'S' else 1
cellw, cellh = (80 * k, 110 * k) if tier == 'S' else (150, 175)
rows = []
for face in faces:
    _k, nat, unit, num, sex, marks = cmda.FACES[face]
    doc = json.load(open(os.path.join(ATLAS, 'figures', f'{unit}-{num}.json')))
    por = Image.open(cmda.PORTRAIT.format(nat, unit, num)).convert('RGB').resize((cellh, cellh))
    row = Image.new('RGB', (cellh + 12 + 2 * len(poses) * cellw + 12, cellh + 34), (150, 148, 128))
    d = ImageDraw.Draw(row)
    row.paste(por, (0, 18))
    x = cellh + 12
    for v in ('front', 'back'):
        vv = doc['views'].get(v)
        lab = f'{v}: ' + ('own kit' if vv and vv.get('ownKit') else 'old kit') + ('' if vv and vv.get('pass') else ' REPORTED')
        d.text((x + 2, 2), lab, fill=(20, 18, 15) if vv and vv.get('pass') else (160, 0, 0))
        for p in poses:
            if not vv or p not in vv['frames'] or 'frame' not in vv['frames'][p]:
                x += cellw; continue
            im, anc = frame(unit, vv['frames'][p]['frame'])
            if im is None:
                x += cellw; continue
            im = im.resize((im.width * k, im.height * k), Image.NEAREST)
            ax, ay = anc['x'] * im.width, anc['y'] * im.height
            row.paste(im, (int(x + cellw / 2 - ax), int(18 + cellh - 8 - ay)), im)
            if not vv.get('pass'):
                d.rectangle((x + 1, 17, x + cellw - 2, 18 + cellh), outline=(170, 0, 0))
            x += cellw
        x += 6
    d.text((2, cellh + 19), f'{face} {unit} {num}  ({tier}, {"2x" if k == 2 else "1x"})', fill=(20, 18, 15))
    rows.append(row)
W = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows)), (20, 18, 15))
y = 0
for r in rows:
    W.paste(r, (0, y)); y += r.height
W.save(out); print(out, W.size)
