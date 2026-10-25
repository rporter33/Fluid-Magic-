# Composes the swatch sheet and the map A/B from render.cjs output.
# Usage: python3 -I compose.py <renderDir> <out swatches.png> <out map-ab.png> <palette json> <sim json> [<companion renderDir>]
import json, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

rdir, out_sw, out_ab, pal_json, sim_json = sys.argv[1:6]
cdir = sys.argv[6] if len(sys.argv) > 6 else None
PAL = json.loads(pal_json); SIM = json.loads(sim_json)
CUR = {'plains': '#C1D29F', 'farmland': '#EEBA3A', 'forest': '#374C2B', 'hills': '#856824', 'mountains': '#8DA4AD', 'swamp': '#1A727A', 'wasteland': '#AE897F'}
ORDER = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
info = json.load(open(f'{rdir}/provs.json'))
A = Image.open(f'{rdir}/start-approved.png').convert('RGB'); B = Image.open(f'{rdir}/start-proposed.png').convert('RGB')
Cimg = Image.open(f'{cdir}/start-companions.png').convert('RGB') if cdir else None
dpr = A.width / 1440
v = info['view']

def font(sz, bold=False):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf']:
        try: return ImageFont.truetype(p, sz)
        except OSError: pass
    return ImageFont.load_default()

def pick(t):
    c = [p for p in info['provs'] if p['terrain'] == t and p['fog'] is None and p['owner'] is None]
    def inside(p): return all(v['l'] + 4 < x < v['r'] - 4 and v['t'] + 4 < y < v['b'] - 4 for x, y in p['poly'])
    c = [p for p in c if inside(p)] or c
    return max(c, key=lambda p: p['area'])

BG = (241, 233, 216); INK = (42, 31, 20)
def patch(img, p, pad=5):
    xs = [x for x, _ in p['poly']]; ys = [y for _, y in p['poly']]
    box = [int((min(xs) - pad) * dpr), int((min(ys) - pad) * dpr), int((max(xs) + pad) * dpr), int((max(ys) + pad) * dpr)]
    crop = img.crop(box)
    m = Image.new('L', crop.size, 0); d = ImageDraw.Draw(m)
    d.polygon([((x * dpr - box[0]), (y * dpr - box[1])) for x, y in p['poly']], fill=255)
    out = Image.new('RGB', crop.size, BG); out.paste(crop, (0, 0), m)
    return out

picks = {t: pick(t) for t in ORDER}
cols = ['the approved fill, flat', 'v3 painted, approved fill', 'v3 painted, proposed fill'] + (['proposed fill + companions'] if Cimg else []) + ['the proposed fill, flat']
patches = {t: [patch(A, picks[t]), patch(B, picks[t])] + ([patch(Cimg, picks[t])] if Cimg else []) for t in ORDER}
pw = max(max(im.width for im in patches[t]) for t in ORDER); ph = max(max(im.height for im in patches[t]) for t in ORDER)
k_ = dpr
fT, fH, fS = font(int(15 * k_), True), font(int(11 * k_), True), font(int(10 * k_))
labw = int(150 * k_); gap = int(10 * k_); top = int(78 * k_)
ncol = len(cols) + 1
sw = int(30 * k_); sh = int(16 * k_)
W = max(labw + ncol * (pw + gap) + gap, gap + 4 * (7 * sw + 2 * gap), int(860 * k_)); rowh = ph + gap
H = top + len(ORDER) * rowh + int(110 * k_)
S = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(S)
d.text((gap, int(8 * k_)), 'Strict painted palette: docs/09 kept exactly, plus every approved state and the H13 floor', fill=INK, font=fT)
d.text((gap, int(30 * k_)), f"Patches cut from the v3 mockup at the start zoom (scale {info['scale']:.3f}, band {info['band']}), rendered at DPR {dpr:g};", fill=INK, font=fS)
d.text((gap, int(44 * k_)), 'one unowned, explored province per terrain. Fills overridden at runtime in a headless session; no part file edited.', fill=INK, font=fS)
hdr = ['approved, flat'] + cols[1:-1] + ['proposed, flat']
hdr = ['approved fill, flat', 'v3 paint, approved', 'v3 paint, proposed'] + (['+ tooth, grain'] if Cimg else []) + ['proposed fill, flat']
for k, c in enumerate(hdr):
    d.text((labw + k * (pw + gap), top - int(16 * k_)), c, fill=INK, font=fS)
def chip(hexs):
    return Image.new('RGB', (pw, ph), tuple(int(hexs[i:i + 2], 16) for i in (1, 3, 5)))
for r, t in enumerate(ORDER):
    y = top + r * rowh
    d.text((gap, y + 4), t.capitalize(), fill=INK, font=fH)
    d.text((gap, y + 4 + int(16 * k_)), f"approved {CUR[t]}", fill=INK, font=fS)
    d.text((gap, y + 4 + int(30 * k_)), f"proposed {PAL[t]}", fill=INK, font=fS)
    d.text((gap, y + 4 + int(44 * k_)), picks[t]['name'], fill=(110, 96, 80), font=fS)
    tiles = [chip(CUR[t])] + patches[t] + [chip(PAL[t])]
    for k, im in enumerate(tiles):
        x = labw + k * (pw + gap)
        S.paste(im, (x + (pw - im.width) // 2, y + (ph - im.height) // 2))
# simulated-vision strips of the proposed fills (sRGB from the repo's colorMath, see sim.ts)
y = top + len(ORDER) * rowh + int(6 * k_)
d.text((gap, y), 'Seen with each vision (repo colorMath, Machado 2009 full severity): proposed above, approved below', fill=INK, font=fH)
for k, vis in enumerate(['normal', 'protan', 'deutan', 'tritan']):
    x0 = gap + k * (7 * sw + 2 * gap)
    d.text((x0, y + int(20 * k_)), vis, fill=INK, font=fS)
    for j, t in enumerate(ORDER):
        for row, key in enumerate(['proposed', 'approved']):
            hx = SIM[key][vis][t]; yy = y + int(36 * k_) + row * (sh + int(3 * k_))
            d.rectangle([x0 + j * sw, yy, x0 + (j + 1) * sw - int(2 * k_), yy + sh], fill=hx)
d.text((gap, y + int(36 * k_) + 2 * (sh + int(3 * k_)) + int(4 * k_)), 'order: ' + ', '.join(ORDER), fill=(110, 96, 80), font=fS)
S.save(out_sw)

# map A/B at the start view: approved fills, proposed fills with the companion paint changes, and the reference
box = [int(205 * dpr), int(245 * dpr), int(925 * dpr), int(700 * dpr)]
ref = Image.open(sys.argv[7]).convert('RGB') if len(sys.argv) > 7 else None
ims = [A.crop(box), (Cimg or B).crop(box)]
ims = [im.resize((im.width // int(dpr), im.height // int(dpr)), Image.LANCZOS) for im in ims]
names = ['v3 at the start zoom, approved fills', 'proposed strict fills' + (' + tooth, granulation' if Cimg else '')]
if ref:
    r = ref.resize((int(ref.width * ims[0].height / ref.height), ims[0].height), Image.LANCZOS); ims.append(r); names.append('reference-map.png (target feel; generated, not an asset)')
fH2 = font(13, True)
M = Image.new('RGB', (sum(im.width for im in ims) + (len(ims) + 1) * 12, ims[0].height + 44), (28, 26, 23)); dm = ImageDraw.Draw(M)
x = 12
for im, nm in zip(ims, names):
    M.paste(im, (x, 34)); dm.text((x, 10), nm, fill=(240, 232, 214), font=fH2); x += im.width + 12
M.save(out_ab)
print('ok', S.size, M.size)
