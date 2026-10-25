#!/usr/bin/env python3
"""sheet.py [OUT]: one row per rejected id: rejected | A | B at 220 px, plus each at 48 px, labelled."""
import os, sys
from PIL import Image, ImageDraw, ImageFont

S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
R = S + '/art-gen/round2'
D = S + '/art-gen/round2-redo'
SRC = [
    ('C1-06', 'cinderScout/cinderHorde__cinderScout__06', 'Cinder Scout 06'),
    ('C2-04', 'emberAdept/cinderHorde__emberAdept__04', 'Ember Adept 04'),
    ('C3-06', 'cinderMagus/cinderHorde__cinderMagus__06', 'Cinder Magus 06'),
    ('I1-02', 'independentCaptain/independent__independentCaptain-levy__02', 'Levy captain 02'),
    ('I1-03', 'independentCaptain/independent__independentCaptain-levy__03', 'Levy captain 03'),
    ('T4-02', 'treant/thornwood__treant__02', 'Treant 02'),
    ('T4-04', 'treant/thornwood__treant__04', 'Treant 04'),
]
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, 'sheet.png')
SZ, SM, pad, lab = 220, 48, 10, 20
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except OSError:
    font = ImageFont.load_default()
W = pad + 3 * (SZ + pad) + 3 * (SM + pad) + pad
H = pad + len(SRC) * (SZ + lab + pad)
sheet = Image.new('RGB', (W, H), (24, 22, 20))
dr = ImageDraw.Draw(sheet)
for r, (rid, path, name) in enumerate(SRC):
    y = pad + r * (SZ + lab + pad)
    cells = [(R + '/' + path + '.png', f'{rid} rejected ({name})'),
             (f'{D}/{rid}-A.png', f'{rid}-A'), (f'{D}/{rid}-B.png', f'{rid}-B')]
    for c, (f, label) in enumerate(cells):
        x = pad + c * (SZ + pad)
        if os.path.exists(f):
            im = Image.open(f).convert('RGB')
            sheet.paste(im.resize((SZ, SZ), Image.LANCZOS), (x, y))
            sx = pad + 3 * (SZ + pad) + c * (SM + pad)
            sheet.paste(im.resize((SM, SM), Image.LANCZOS), (sx, y + SZ - SM))
        dr.text((x + 2, y + SZ + 3), label, fill=(210, 198, 175), font=font)
    dr.text((pad + 3 * (SZ + pad), y + SZ + 3), '48 px: rej / A / B', fill=(150, 140, 125), font=font)
sheet.save(out)
print(out, sheet.size)
