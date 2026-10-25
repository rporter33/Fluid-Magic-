# Commanders beside their cards: for every commander of the three battles, its approved card portrait (256 px), and
# its painted field figure's front and back stand frames at tier H (as packed in the page), or the reason it has none.
import json, os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
P = '/home/user/Fluid-Magic-/src/assets/raster/portraits'
D = json.load(open(os.path.join(HERE, 'paint-data.json')))
pages = {}
def page(i):
    if i not in pages:
        k = D['tiers']['H']['pages'][i]['kind'].replace(':', '-')
        n = sum(1 for j in range(i) if D['tiers']['H']['pages'][j]['kind'] == D['tiers']['H']['pages'][i]['kind'])
        pages[i] = Image.open(os.path.join(HERE, 'pages', f'{k}-H.{n}.png')).convert('RGBA')
    return pages[i]
def frame(name):
    v = D['tiers']['H']['frames'].get(name)
    if not v: return None
    return page(v[0]).crop((v[1], v[2], v[1] + v[3], v[2] + v[4]))
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15); F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except Exception:
    F = F2 = ImageFont.load_default()
rows = [g for g in D['groups'] if g['cmd'] and g.get('face') and g['unit'] not in ('salamander', 'treant')]
W, H = 256 + 2 * 200 + 40, 300
sheet = Image.new('RGB', (W * 2, H * ((len(rows) + 1) // 2)), (40, 37, 33))
for k, g in enumerate(rows):
    x0, y0 = (k % 2) * W, (k // 2) * H
    d = ImageDraw.Draw(sheet)
    por = Image.open(f"{P}/{g['nation']}/{g['unit']}/{g['face']}.webp").convert('RGB')
    sheet.paste(por, (x0 + 10, y0 + 10))
    look = f"{g['unit']}-{g['face']}"
    L = D['looks'].get(look)
    ground = (168, 167, 132)
    for j, view in enumerate(('front', 'back')):
        bx = x0 + 276 + j * 200
        d.rectangle([bx, y0 + 10, bx + 190, y0 + 266], fill=ground)
        fr = frame(f'{look}.{view}.stand') if L and view in L['views'] else None
        if fr:
            k2 = min(1.6, 240 / fr.height)
            fr2 = fr.resize((round(fr.width * k2), round(fr.height * k2)), Image.LANCZOS)
            tile = Image.new('RGBA', (190, 256), ground + (255,)); tile.alpha_composite(fr2, ((190 - fr2.width) // 2, 256 - fr2.height - 4))
            sheet.paste(tile.convert('RGB'), (bx, y0 + 10))
            st = L['views'][view]['status']
            d.text((bx + 4, y0 + 12), f'{view} · {st}', fill=(20, 20, 20) if st == 'pass' else (150, 30, 20), font=F2)
        else:
            d.text((bx + 8, y0 + 120), f'{view}: not painted', fill=(90, 30, 20), font=F2)
            d.text((bx + 8, y0 + 138), '(view not made)', fill=(90, 30, 20), font=F2)
    d.text((x0 + 10, y0 + 272), f"battle {g['battle']} · {g['unit']} face {g['face']} · {'near (back view)' if g['mainView']=='back' else 'far (front view)'}", fill=(235, 228, 214), font=F)
out = os.path.join(HERE, '..', 'shots', 'commanders-vs-cards.png')
sheet.save(out); print(out, sheet.size, len(rows))
