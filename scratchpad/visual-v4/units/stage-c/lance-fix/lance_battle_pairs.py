# Stage C lance fix: before | after crops of the battle shots (lance_shoot.cjs), around the camera's target (the group).
# Usage: python3 lance_battle_pairs.py BEFORE_DIR AFTER_DIR OUTDIR
import json, os, sys
from PIL import Image, ImageDraw

bdir, adir, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
meta = [m for m in json.load(open(os.path.join(adir, 'after-battle.json'))) if m.get('base')]
made = []
for m in meta:
    a = os.path.join(adir, m['base'] + '.png')
    b = os.path.join(bdir, m['base'].replace('after-', 'before-', 1) + '.png')
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    cw, ch = (1240, 820) if m['dpr'] == 2 else (620, 410)
    cx, cy = A.width // 2, A.height // 2
    box = (cx - cw // 2, cy - ch // 2, cx + cw // 2, cy + ch // 2)
    tiles = [im.crop(box) for im in (B, A)]
    if m['dpr'] == 1:
        tiles = [t.resize((t.width * 2, t.height * 2), Image.NEAREST) for t in tiles]
    o = Image.new('RGB', (tiles[0].width * 2 + 8, tiles[0].height + 22), (20, 20, 20))
    o.paste(tiles[0], (0, 22)); o.paste(tiles[1], (tiles[0].width + 8, 22))
    d = ImageDraw.Draw(o)
    lab = f"battle {m['key']} {m['unit']} ({m['view']} view) {m['moment']}, tier {m['tier']} (DPR {m['dpr']}, zoom {m['zoom']}"
    d.text((4, 5), lab + ') - before', fill=(255, 255, 255)); d.text((tiles[0].width + 12, 5), 'after', fill=(255, 255, 120))
    p = os.path.join(out, m['base'].replace('after-', '', 1) + '.png')
    o.save(p); made.append(p)
print('\n'.join(made))
