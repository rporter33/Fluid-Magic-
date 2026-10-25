# Stage B, key "cmdB": a quick look board: per sheet, the face's portrait beside the raw sheet (and the keyed, locked
# stand frame at 2x on a mid ground). Usage: python3 cmdb_peek.py OUT.png FACE.VIEW[.TAG] ...
import json, os, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES  # noqa: E402
out, specs = sys.argv[1], sys.argv[2:]
tiles = []
for s in specs:
    p = s.split('.'); f, v, tag = p[0], p[1], ('.' + p[2]) if len(p) > 2 else ''
    kind, nat, unit, num, sex, marks = FACES[f]
    raw = cmdb.REUSED_REDRESS.get((f, v)) if not tag else None
    raw = raw or os.path.join(cmdb.RAW, f'{f}.{v}.redress{tag}.nb21.png')
    sheet = Image.open(raw).convert('RGB').resize((640, 640), Image.LANCZOS)
    por = Image.open(cmdb.PORTRAIT.format(nat, unit, num)).convert('RGB').resize((300, 300), Image.LANCZOS)
    t = Image.new('RGB', (960, 664), (28, 26, 23)); t.paste(sheet, (0, 24)); t.paste(por, (650, 24))
    d = ImageDraw.Draw(t)
    ck = os.path.join(cmdb.W, 'faces', f'{f}.{v}{tag}', 'checks.json')
    lab = f'{f}.{v}{tag}'
    if os.path.exists(ck):
        r = json.load(open(ck)); ca = r.get('cameraRel') or r['cameraAll']
        lab += f"  {'PASS' if r['pass'] else 'FAIL'} {ca['follow']} side {r['sideCmd']['share']} id {(r.get('identity') or {}).get('dE2000')}"
        fr = os.path.join(cmdb.W, 'faces', f'{f}.{v}{tag}', 'frames', f'{kind}.{v}.stand.png')
        if os.path.exists(fr):
            im = Image.open(fr).convert('RGBA'); bg = Image.new('RGBA', im.size, (150, 148, 128, 255)); bg.alpha_composite(im)
            bg = bg.convert('RGB').resize((im.width * 2, im.height * 2), Image.NEAREST)
            bg.thumbnail((300, 330)); t.paste(bg, (650, 330))
    d.text((4, 4), lab, fill=(235, 230, 215))
    tiles.append(t)
cols = 2
W_ = Image.new('RGB', (cols * 960, ((len(tiles) + cols - 1) // cols) * 664), (15, 15, 15))
for i, t in enumerate(tiles):
    W_.paste(t, ((i % cols) * 960, (i // cols) * 664))
W_.save(out); print(out, W_.size)
