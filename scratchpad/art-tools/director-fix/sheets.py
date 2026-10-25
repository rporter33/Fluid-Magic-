#!/usr/bin/env python3
"""Rebuild the round2 contact sheets in the same layouts used before.
sheets.py UNIT [UNIT...]; UNIT 'independentCaptain' rebuilds sheet.png (levy+hunter) and sheet-mountaineer/-reedman."""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2'
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except OSError: FONT = ImageFont.load_default()

def grid(items, cols, T, pad, out):
    rows = (len(items) + cols - 1) // cols; lab = 18
    sheet = Image.new('RGB', (cols * (T + pad) + pad, rows * (T + pad + lab) + pad), (24, 22, 20))
    dr = ImageDraw.Draw(sheet)
    for i, (path, label) in enumerate(items):
        x = pad + (i % cols) * (T + pad); y = pad + (i // cols) * (T + pad + lab)
        if os.path.exists(path):
            sheet.paste(Image.open(path).convert('RGB').resize((T, T), Image.LANCZOS), (x, y))
        dr.text((x + 2, y + T + 3), label, fill=(220, 210, 190), font=FONT)
    sheet.save(out); print(out, sheet.size)

for unit in sys.argv[1:]:
    d = os.path.join(R, unit)
    if unit == 'independentCaptain':
        P = lambda o, n: f'{d}/independent__independentCaptain-{o}__{n:02d}.png'
        grid([(P(o, n), f'{o} {n:02d}') for o in ('levy', 'hunter') for n in range(1, 13)], 6, 200, 6, f'{d}/sheet.png')
        for o in ('mountaineer', 'reedman'):
            grid([(P(o, n), f'{o} {n:02d}') for n in range(1, 13)], 4, 260, 6, f'{d}/sheet-{o}.png')
    else:
        files = sorted(f for f in glob.glob(os.path.join(d, '*__*.png')))
        grid([(f, os.path.basename(f).split('__', 1)[1].replace('.png', '')) for f in files], 4, 200, 8, f'{d}/sheet.png')
