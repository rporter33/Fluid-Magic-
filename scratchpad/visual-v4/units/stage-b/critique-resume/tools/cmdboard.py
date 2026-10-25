# cmdboard.py <battle> : one row per commander: its card portrait, then its shots in time order, from cmd.out
import json, sys, glob, os
from PIL import Image, ImageDraw, ImageFont
k = sys.argv[1]
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/critique-resume/'
R = '/home/user/Fluid-Magic-/src/assets/raster/portraits/'
rows = {}
info = {}
try:
    out = json.load(open(D + 'cmd.out'))['out']
    for o in out: info[o['name']] = o
except Exception:
    pass
for f in sorted(glob.glob(D + f'shots/cmd-{k}-*.png'), key=os.path.getmtime):
    n = os.path.basename(f)[:-4]
    parts = n.split('-')
    look = '-'.join(parts[2:-1]); tag = parts[-1]
    rows.setdefault(look, []).append((tag, f, n))
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
cw, ch = 210, 224
ncol = max(len(v) for v in rows.values()) + 1
M = Image.new('RGB', (ncol * (cw + 4), len(rows) * (ch + 22)), (20, 18, 16))
d = ImageDraw.Draw(M)
for r, (look, shots) in enumerate(rows.items()):
    y = r * (ch + 22)
    unit, face = (look.rsplit('-', 1) + [''])[:2]
    pf = glob.glob(R + f'*/{unit}/{face}.webp')
    if pf:
        p = Image.open(pf[0]).convert('RGB').resize((ch, ch), Image.LANCZOS); M.paste(p, (0, y))
    d.text((2, y + ch + 3), look, fill=(255, 230, 120), font=font)
    for c, (tag, f, n) in enumerate(shots):
        im = Image.open(f).convert('RGB').resize((cw, ch), Image.LANCZOS)
        x = (c + 1) * (cw + 4)
        M.paste(im, (x, y))
        o = info.get(n, {})
        lab = f"{tag} {o.get('pose','')} {o.get('view','')}{' SI' if o.get('standIn') else ''}{' m' if o.get('mirror') else ''}"
        d.text((x + 2, y + ch + 3), lab, fill=(230, 222, 210), font=font)
M.save(D + f'boards/cmd-{k}.png'); print(M.size)
