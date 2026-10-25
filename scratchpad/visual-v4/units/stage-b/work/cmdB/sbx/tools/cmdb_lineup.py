# Stage B, key "cmdB": lineups read back from the packed atlases (stage-b/atlas/cmdB), so what is checked is what ships:
#   review/lineup-tierS.png: every face's front and back stand frame at tier S (64 px commander), 2x, one row per group;
#   review/lineup-battle.png: the battle faces' stand, actA and strike at tier S and stand at tier H beside the portrait.
# Usage: python3 cmdb_lineup.py
import glob, json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402
A = os.path.join(cmdb.STAGEB, 'atlas', 'cmdB')
GROUND = (150, 148, 128)


def atlas(unit, tier):
    out = {}
    for j in sorted(glob.glob(os.path.join(A, f'{unit}.{tier}.*.json'))):
        d = json.load(open(j)); img = Image.open(os.path.join(A, d['meta']['image'])).convert('RGBA')
        for n, f in d['frames'].items():
            r = f['frame']; out[n] = img.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    return out


def on(im, k=2, h=None):
    bg = Image.new('RGBA', im.size, GROUND + (255,)); bg.alpha_composite(im)
    bg = bg.convert('RGB')
    return bg.resize((bg.width * k, bg.height * k), Image.NEAREST)


rows = []
for unit, faces in GROUPS.items():
    S = atlas(unit, 'S')
    tiles = []
    for f in faces:
        num = FACES[f][3]
        for v in ('front', 'back'):
            n = f'{unit}-{num}.{v}.stand'
            if n in S:
                tiles.append(on(S[n]))
    H = max(t.height for t in tiles) + 20
    r = Image.new('RGB', (sum(t.width + 4 for t in tiles) + 150, H), (28, 26, 23)); d = ImageDraw.Draw(r)
    d.text((4, 4), unit, fill=(235, 230, 215)); x = 150
    for t in tiles:
        r.paste(t, (x, H - t.height)); x += t.width + 4
    rows.append(r)
L = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows)), (15, 15, 15)); y = 0
for r in rows:
    L.paste(r, (0, y)); y += r.height
L.save(os.path.join(cmdb.W, 'review', 'lineup-tierS.png')); print('lineup-tierS', L.size)

BATTLE = [('wc04', 'front'), ('wc05', 'back'), ('wc07', 'back'), ('wc07', 'front'), ('gp01', 'back'), ('sd03', 'back'),
          ('sd08', 'front'), ('ed08', 'back')]
rows = []
for f, v in BATTLE:
    kind, nat, unit, num, sex, marks = FACES[f]
    S, Hh = atlas(unit, 'S'), atlas(unit, 'H')
    por = Image.open(cmdb.PORTRAIT.format(nat, unit, num)).convert('RGB').resize((200, 200))
    tiles = [por] + [on(S[f'{unit}-{num}.{v}.{p}'], 3) for p in ('stand', 'actA', 'strike', 'recoil') if f'{unit}-{num}.{v}.{p}' in S]
    tiles.append(on(Hh[f'{unit}-{num}.{v}.stand'], 1))
    H = max(t.height for t in tiles) + 22
    r = Image.new('RGB', (sum(t.width + 8 for t in tiles), H), (28, 26, 23)); d = ImageDraw.Draw(r)
    d.text((4, 4), f'{f} {v} (battle view): portrait | tier S stand, actA, strike, recoil at 3x | tier H stand', fill=(235, 230, 215)); x = 0
    for t in tiles:
        r.paste(t, (x, 20)); x += t.width + 8
    rows.append(r)
L = Image.new('RGB', (max(r.width for r in rows), sum(r.height for r in rows)), (15, 15, 15)); y = 0
for r in rows:
    L.paste(r, (0, y)); y += r.height
L.save(os.path.join(cmdb.W, 'review', 'lineup-battle.png')); print('lineup-battle', L.size)
