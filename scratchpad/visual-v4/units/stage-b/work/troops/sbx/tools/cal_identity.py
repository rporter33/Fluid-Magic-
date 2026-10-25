# Stage B calibration, part 1: the 4x identity crops. For each face, its approved portrait beside the upper half of the
# re-dressed stand frame at 4x (sheet pixels, nearest), for ticking the face's marks (pilot-review change 10).
# Usage: python3 cal_identity.py   (writes ../../review/identity-4x-all.png)
import sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
import cal_cmd_prompts as P
C = P.CAL
rows = []
for face, (kind, nat, unit, num, sex, marks) in P.FACES.items():
    d = f'{C}/work/{face}.front.redress/frames'
    m = json.load(open(f'{d}/{kind}.front.json')); f = [x for x in m['frames'] if x['name'] == 'stand'][0]
    im = Image.open(f"{d}/{f['file']}").convert('RGBA')
    up = im.crop((0, 0, im.width, int(im.height * 0.55)))
    bg = Image.new('RGBA', up.size, (150, 148, 128, 255)); bg.alpha_composite(up)
    big = bg.resize((up.width * 4, up.height * 4), Image.NEAREST).convert('RGB')
    por = Image.open(P.PORTRAIT.format(nat, unit, num)).convert('RGB').resize((big.height, big.height), Image.LANCZOS)
    row = Image.new('RGB', (por.width + big.width + 10, big.height + 22), (28, 26, 23))
    row.paste(por, (0, 22)); row.paste(big, (por.width + 10, 22))
    ImageDraw.Draw(row).text((4, 4), f'{unit} {num}: portrait | stand frame upper half at 4x (sheet px)', fill=(235, 230, 215))
    rows.append(row)
W = max(r.width for r in rows)
sheet = Image.new('RGB', (W * 2 + 10, max(sum(r.height for r in rows[:3]), sum(r.height for r in rows[3:]))), (20, 18, 15))
for col, part in ((0, rows[:3]), (W + 10, rows[3:])):
    y = 0
    for r in part:
        sheet.paste(r, (col, y)); y += r.height
sheet.save(f'{C}/review/identity-4x-all.png')
print(sheet.size)
