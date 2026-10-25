# Swatch sheet: each terrain as the mockup paints it at the start zoom (1:1 crops of a real province, labels and tokens
# hidden), the bright approved fill beside it, plus a 3x view and the mockup's deuteranopia / tritanopia filter (Machado 2009).
# Usage: python3 -I swatches.py <shots dir> <cfg json> <out png>
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
shots, cfgp, out = sys.argv[1:4]
cfg = json.load(open(cfgp))
BRIGHT = {'plains': '#C1D29F', 'farmland': '#EEBA3A', 'forest': '#374C2B', 'hills': '#856824', 'mountains': '#8DA4AD', 'swamp': '#1A727A', 'wasteland': '#AE897F'}
T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
TEX = {'plains': 'speckle, tuft clusters, small copses, dotted wavy hedges', 'farmland': 'field patchwork, parallel furrows, sheaf rows, windmill',
       'forest': 'canopy of lobed crowns, lit upper left', 'hills': 'hill ranges with hachures', 'mountains': 'peak ranges, scree, cool relief wash',
       'swamp': 'pale water streaks, pools, reed beds', 'wasteland': 'crack network, rock outcrops, dry scrub'}
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
SERIF = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', s)
def area(poly):
    a = 0
    for k in range(len(poly)):
        x1, y1 = poly[k]; x2, y2 = poly[(k + 1) % len(poly)]; a += x1 * y2 - x2 * y1
    return abs(a) / 2
provs = json.load(open(f'{shots}/painted-start-provs.json'))
pick = {}
for t in T:
    c = [p for p in provs if p['terrain'] == t and p['fog'] is None and p['owner'] is None and not p['cap']]
    if not c: c = [p for p in provs if p['terrain'] == t and p['fog'] is None]
    pick[t] = max(c, key=lambda p: area(p['poly']))
IM = {k: Image.open(f'{shots}/{k}.png').convert('RGB') for k in ['v3-start-clean', 'painted-start-clean', 'painted-start-clean-deutan', 'painted-start-clean-tritan', 'painted-start-clean-protan']}
def patch(key, p, scale=1, pad=5, bg=(232, 220, 194)):
    xs = [q[0] for q in p['poly']]; ys = [q[1] for q in p['poly']]
    box = (int(min(xs)) - pad, int(min(ys)) - pad, int(max(xs)) + pad + 1, int(max(ys)) + pad + 1)
    im = IM[key].crop(box)
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon([(x - box[0], y - box[1]) for x, y in p['poly']], fill=255)
    out = Image.new('RGB', im.size, bg); out.paste(im, (0, 0), m)
    if scale != 1: out = out.resize((out.width * scale, out.height * scale), Image.NEAREST)
    return out
def lstar(h):
    c = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255; lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    Y = 0.2126729 * lin[0] + 0.7151522 * lin[1] + 0.072175 * lin[2]; return 116 * Y ** (1 / 3) - 16 if Y > 216 / 24389 else 24389 / 27 * Y
def oklchC(h):
    c = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255; r, g, b = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = np.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b); m = np.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b); s = np.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s; bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s; return float(np.hypot(a, bb))
# layout
cols = [('', 250), ('Clear colors\nfill', 92), ('Clear colors\npainted (v3)', 120), ('Painted\n(proposal)', 120), ('Painted\nfill', 92), ('Painted, 3x', 380), ('Deutan\n(filter)', 120), ('Tritan\n(filter)', 120)]
rowh = 150; W = sum(w for _, w in cols) + 40; top = 150; H = top + rowh * len(T) + 150
sheet = Image.new('RGB', (W, H), (232, 220, 194)); d = ImageDraw.Draw(sheet)
d.text((20, 16), 'Painted terrain palette (texture angle): each fill at the start zoom, Clear colors beside it', font=SERIF(22), fill=(42, 31, 20))
d.text((20, 50), 'Patches are 1:1 crops of a real province from the mockup at its start zoom (0.418 px per world unit, median province about 73 px), labels and tokens hidden.', font=F(13), fill=(42, 31, 20))
d.text((20, 70), 'Clear colors = the approved docs/09 fills and the v3 paint. Painted = muted fills (mean OKLCH chroma 57% of the approved) with the stronger wash.', font=F(13), fill=(42, 31, 20))
d.text((20, 90), 'Deutan and Tritan columns use the mockup\'s own Machado 2009 filters (the same matrices as tests/content/colorMath.ts).', font=F(13), fill=(42, 31, 20))
x = 20
for name, w in cols:
    d.multiline_text((x + 4, top - 42), name, font=F(12, True), fill=(42, 31, 20), spacing=2); x += w
for r, t in enumerate(T):
    y = top + r * rowh; p = pick[t]; pf = cfg['fills'][t]; bf = BRIGHT[t]
    d.line([(20, y - 4), (W - 20, y - 4)], fill=(190, 176, 150), width=1)
    d.text((24, y + 4), t.capitalize(), font=SERIF(18), fill=(42, 31, 20))
    d.text((24, y + 30), f'{bf}  ->  {pf}', font=F(13), fill=(42, 31, 20))
    d.text((24, y + 50), f'L* {lstar(bf):.0f} -> {lstar(pf):.0f}   chroma {100 * oklchC(pf) / oklchC(bf):.0f}%', font=F(12), fill=(42, 31, 20))
    d.multiline_text((24, y + 72), '\n'.join([TEX[t][i:i + 34] for i in range(0, len(TEX[t]), 34)]), font=F(11), fill=(80, 64, 44), spacing=2)
    d.text((24, y + 118), f'province: {p["name"]}', font=F(11), fill=(110, 94, 70))
    x = 20 + cols[0][1]
    d.rectangle([x + 6, y + 6, x + 80, y + 80], fill=bf, outline=(43, 38, 32)); x += cols[1][1]
    for key, w in (('v3-start-clean', cols[2][1]), ('painted-start-clean', cols[3][1])):
        im = patch(key, p); sheet.paste(im, (x + 4, y + 2)); x += w
    d.rectangle([x + 6, y + 6, x + 80, y + 80], fill=pf, outline=(43, 38, 32)); x += cols[4][1]
    big = patch('painted-start-clean', p, 3)
    cx, cy = big.width // 2, big.height // 2; bw, bh = min(big.width, 360), min(big.height, 140)
    sheet.paste(big.crop((cx - bw // 2, cy - bh // 2, cx + bw // 2, cy + bh // 2)), (x + 4, y + 2)); x += cols[5][1]
    for key, w in (('painted-start-clean-deutan', cols[6][1]), ('painted-start-clean-tritan', cols[7][1])):
        im = patch(key, p); sheet.paste(im, (x + 4, y + 2)); x += w
y = top + rowh * len(T) + 6
notes = ['Pairs under CIEDE2000 20 normal / 12 under a deficiency are carried by texture; texture-twin pairs (hills/mountains, plains/swamp, plains/forest, farmland/wasteland) keep 20/12 in every state.',
         'Relaxed floor for texture-distinct pairs: 14 normal / 9 under each deficiency in every approved Ownership state (measured 14.6 / 9.3; raw fills 16.2 / 11.4).',
         'Band rule (20/12, unrelaxed): 0 fails in 2915 banner x painted-variant x state pairs, all 11 banners. Wild grounds 20.5 / 13.0. Data-mode colors >= 7.3 from every fill.',
         'Painted means within CIEDE2000 2.0 of each fill (paint check, terrain means 0.53 to 1.19; one small Hills province 2.58).']
for k, s in enumerate(notes): d.text((24, y + k * 20), s, font=F(12), fill=(42, 31, 20))
sheet.save(out)
print('wrote', out, sheet.size, {t: pick[t]['name'] for t in T})
