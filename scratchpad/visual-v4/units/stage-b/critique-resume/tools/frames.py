# frames.py out.png face.view ... : each look's 16 frames in a row on a mid-grey ground, failing cells outlined red
import sys, json, os, glob
from PIL import Image, ImageDraw, ImageFont
D = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdB/'
S = json.load(open(D + 'summary.json'))
order = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'recoil', 'actA', 'actB', 'fall', 'deadA', 'deadB', 'fleeA', 'fleeB', 'cheer']
out, looks = sys.argv[1], sys.argv[2:]
C = 120
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 11)
M = Image.new('RGB', (len(order) * (C + 2) + 70, len(looks) * (C + 16)), (150, 150, 140))
d = ImageDraw.Draw(M)
for r, lk in enumerate(looks):
    fail = (S.get(lk) or {}).get('failing', [])
    y = r * (C + 16)
    d.text((2, y + 50), lk, fill=(0, 0, 0), font=font)
    for c, p in enumerate(order):
        fs = glob.glob(D + f'faces/{lk}/frames/*.{p}.png')
        x = 70 + c * (C + 2)
        if fs:
            im = Image.open(fs[0]).convert('RGBA'); im.thumbnail((C, C))
            M.paste(im, (x + (C - im.width) // 2, y + (C - im.height)), im)
        if p in fail: d.rectangle((x, y, x + C - 1, y + C - 1), outline=(220, 0, 0), width=2)
        d.text((x + 2, y + C + 1), p, fill=(0, 0, 0), font=font)
M.save(out); print(M.size)
