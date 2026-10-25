# Stage B, key "cmdB": the facing check by eye for back sheets (the camera gate cannot see a figure turned to face us):
# per face, its 16 picked back frames' upper halves at 2x on a mid ground, in grid order, one row per face.
# Usage: python3 cmdb_facing.py UNIT [VIEW]   -> review/facing-<unit>-<view>.png
import glob, json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402
ORDER = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'recoil', 'actA', 'actB', 'fall', 'deadA',
         'deadB', 'fleeA', 'fleeB', 'cheer']
unit = sys.argv[1]; view = sys.argv[2] if len(sys.argv) > 2 else 'back'
P = json.load(open(os.path.join(cmdb.W, 'picks.json')))
rows = []
for f in GROUPS[unit]:
    p = P.get(f'{f}.{view}')
    if not p:
        continue
    fd = os.path.join(p['dir'], 'frames')
    m = json.load(open(glob.glob(os.path.join(fd, '*.json'))[0]))
    byn = {x['name']: x for x in m['frames'] if not x.get('missing')}
    tiles = []
    for n in ORDER:
        x = byn.get(n)
        if not x:
            tiles.append(Image.new('RGB', (100, 150), (60, 0, 0))); continue
        im = Image.open(os.path.join(fd, x['file'])).convert('RGBA')
        crop = im if n in ('fall', 'deadA', 'deadB') else im.crop((0, 0, im.width, max(1, int(im.height * 0.5))))
        bg = Image.new('RGBA', crop.size, (150, 148, 128, 255)); bg.alpha_composite(crop)
        bg = bg.convert('RGB').resize((crop.width * 2, crop.height * 2), Image.LANCZOS)
        bg.thumbnail((150, 150)); tiles.append(bg)
    r = Image.new('RGB', (16 * 154 + 60, 170), (28, 26, 23)); d = ImageDraw.Draw(r)
    d.text((4, 4), f, fill=(235, 230, 215))
    for i, t in enumerate(tiles):
        r.paste(t, (60 + i * 154, 16))
        d.text((60 + i * 154, 2), ORDER[i], fill=(200, 196, 180))
    rows.append(r)
S = Image.new('RGB', (rows[0].width, 170 * len(rows)), (15, 15, 15))
for i, r in enumerate(rows):
    S.paste(r, (0, 170 * i))
out = os.path.join(cmdb.W, 'review', f'facing-{unit}-{view}.png'); S.save(out); print(out, S.size)
