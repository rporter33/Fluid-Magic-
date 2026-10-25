import sys, json
from PIL import Image, ImageDraw, ImageFont
rows = json.loads(open(sys.argv[1]).read())  # [[label, {terrain: hex}]]
T = ['plains','farmland','forest','hills','mountains','swamp','wasteland']
cw, ch, lw = 110, 60, 230
im = Image.new('RGB', (lw + cw*7, 24 + ch*len(rows)), '#E8DCC2')
d = ImageDraw.Draw(im)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except: font = ImageFont.load_default()
for j,t in enumerate(T): d.text((lw + j*cw + 4, 5), t, fill='#2A1F14', font=font)
for i,(lab, pal) in enumerate(rows):
    y = 24 + i*ch; d.text((6, y+20), lab, fill='#2A1F14', font=font)
    for j,t in enumerate(T):
        d.rectangle([lw + j*cw + 2, y + 2, lw + (j+1)*cw - 2, y + ch - 2], fill=pal[t])
        d.text((lw + j*cw + 6, y + ch - 18), pal[t], fill='#F4EEDF' if sum(int(pal[t][k:k+2],16) for k in (1,3,5)) < 330 else '#2A1F14', font=font)
im.save(sys.argv[2])
