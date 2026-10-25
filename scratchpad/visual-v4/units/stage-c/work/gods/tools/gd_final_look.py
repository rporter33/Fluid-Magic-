# Stage C gods: the selected cuts, portrait | back | front at one height, for ticking the identity marks.
# Usage: python3 -I gd_final_look.py OUT.png H god[-nation] ...
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from picks import resolve  # noqa: E402
W = os.path.abspath(os.path.join(HERE, '..'))
SEL = json.load(open(os.path.join(W, 'selection.json')))['figures']
out, H = sys.argv[1], int(sys.argv[2])
R = resolve()
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
rows = []
for arg in sys.argv[3:]:
    god, nation = (arg.split('-') + [None])[:2]
    nation = nation or ('cinderHorde' if f'{god}-cinderHorde' in SEL else 'thornwood')
    fig = f'{god}-{nation}'
    ims = [Image.open(R[god][nation]['p512']).convert('RGB')]
    for v in ('back', 'front'):
        d = os.path.join(W, 'cut', SEL[fig][v]['tag'])
        im = Image.open(os.path.join(d, f'{fig}.{v}.idle.png')).convert('RGBA')
        bg = Image.new('RGBA', im.size, (168, 167, 132, 255)); bg.alpha_composite(im); ims.append(bg.convert('RGB'))
    ims = [i.resize((max(1, int(i.width * H / i.height)), H), Image.LANCZOS) for i in ims]
    row = Image.new('RGB', (sum(i.width for i in ims) + 10 * len(ims), H + 20), (25, 25, 25)); x = 0
    ImageDraw.Draw(row).text((4, 2), f"{fig}  back: {SEL[fig]['back']['tag']}  front: {SEL[fig]['front']['tag']}", fill=(255, 255, 255), font=font)
    for i in ims:
        row.paste(i, (x, 20)); x += i.width + 10
    rows.append(row)
s = Image.new('RGB', (max(r.width for r in rows), sum(r.height + 6 for r in rows)), (15, 15, 15)); y = 0
for r in rows:
    s.paste(r, (0, y)); y += r.height + 6
s.save(out); print(out, s.size)
