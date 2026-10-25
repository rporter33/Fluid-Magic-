# Stage C gods: a quick look at one cut: portrait, maquette, cutout on a battle ground, camera proof.
# Usage: python3 -I gd_look.py TAG GOD VIEW OUT.png [H]
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve  # noqa: E402
W = os.path.abspath(os.path.join(HERE, '..'))
tag, god, view, out = sys.argv[1:5]
H = int(sys.argv[5]) if len(sys.argv) > 5 else 520
ck = json.load(open(os.path.join(W, 'cut', tag, 'checks.json')))
R = resolve()
pick = R[god].get(ck['nation']) or R[god]['cinderHorde']
ims = [Image.open(pick['p512']).convert('RGB')]
ims.append(Image.open(os.path.join(W, 'guides', f'{god}.idle.{view}.png')).convert('RGB'))
cut = Image.open(os.path.join(W, 'cut', tag, os.path.basename(ck['cutout']))).convert('RGBA')
bg = Image.new('RGBA', cut.size, (0xA8, 0xA7, 0x84, 255)); bg.alpha_composite(cut); ims.append(bg.convert('RGB'))
ims.append(Image.open(os.path.join(W, 'cut', tag, 'camera-proof.png')).convert('RGB'))
row = [im.resize((max(1, int(im.width * H / im.height)), H), Image.LANCZOS) for im in ims]
s = Image.new('RGB', (sum(r.width for r in row) + 8 * len(row), H), (25, 25, 25)); x = 0
for r in row:
    s.paste(r, (x, 0)); x += r.width + 8
s.save(out); print(out, s.size)
