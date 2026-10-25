#!/usr/bin/env python3
"""compare.py TAG OUT: for each director job, old (rejected/NAME.TAG.png) beside new, at 200 px and 48 px."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2'
jobs = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'jobs.json')))
tag, out = sys.argv[1], sys.argv[2]
sel = sys.argv[3].split(',') if len(sys.argv) > 3 else None
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
except OSError: FONT = ImageFont.load_default()
jobs = [j for j in jobs if not sel or any(s in j['file'] for s in sel)]
T, pad, lab = 200, 6, 16; cw = 2 * T + 2 * 48 + 5 * pad
cols = 2; rows = (len(jobs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw + pad, rows * (T + lab + pad) + pad), (24, 22, 20)); dr = ImageDraw.Draw(sheet)
for i, j in enumerate(jobs):
    new = os.path.join(R, j['file']); dd, name = os.path.split(new[:-4])
    old = os.path.join(dd, 'rejected', f'{name}.{tag}.png')
    x0 = pad + (i % cols) * cw; y = pad + (i // cols) * (T + lab + pad)
    x = x0
    for p in (old, new):
        if os.path.exists(p):
            im = Image.open(p).convert('RGB')
            sheet.paste(im.resize((T, T), Image.LANCZOS), (x, y)); sheet.paste(im.resize((48, 48), Image.LANCZOS), (x + T + pad, y))
        x += T + 48 + 2 * pad
    lbl = name.split('__', 1)[1].replace('independentCaptain-', '')
    dr.text((x0 + 2, y + T + 2), f'{lbl}: old | new', fill=(220, 210, 190), font=FONT)
sheet.save(out); print(out, sheet.size)
