# python3 compose.py <palette-ab dir> <reference png>: ab-start.png (Bright | Painted), painted-vs-reference.png, ab-cvd-built.png
import sys
from PIL import Image, ImageDraw, ImageFont
d, ref = sys.argv[1], sys.argv[2]
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf']:
        try: return ImageFont.truetype(f, sz)
        except Exception: pass
    return ImageFont.load_default()
F = font(17)
BOX = (215, 252, 918, 704)  # the cloth at the start view, 1440 x 900 (canvas cloth box + the canvas's page offset)
BG, INK = (14, 9, 5), (244, 238, 223)
def panel(path, k=1.0):
    im = Image.open(path).convert('RGB').crop(BOX)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k != 1.0 else im
def row(ims, labels, out, gap=12, top=30):
    w = sum(i.width for i in ims) + gap * (len(ims) - 1); h = max(i.height for i in ims) + top
    canvas = Image.new('RGB', (w, h), BG); dr = ImageDraw.Draw(canvas); x = 0
    for im, lb in zip(ims, labels):
        canvas.paste(im, (x, top)); dr.text((x + 6, 6), lb, fill=INK, font=F); x += im.width + gap
    canvas.save(out)
k = 1.25
row([panel(f'{d}/shots/bright-start.png', k), panel(f'{d}/shots/painted-start.png', k)],
    ['Palette: Bright (the approved fills; default)', 'Palette: Painted (?palette=painted)'], f'{d}/ab-start.png')
# Painted start view beside the target-feel reference, at the same height
A = Image.open(f'{d}/shots/painted-start.png').convert('RGB').crop(BOX); R = Image.open(ref).convert('RGB')
H = 560; A = A.resize((round(A.width * H / A.height), H), Image.LANCZOS); R = R.resize((round(R.width * H / R.height), H), Image.LANCZOS)
row([A, R], ['Painted start view (the built mockup)', 'reference-map.png (target feel; a generated image, not an asset)'], f'{d}/painted-vs-reference.png')
# vision: Bright and Painted under deutan and tritan (the page's approximate preview filter)
ims = {n: panel(f'{d}/shots/{n}.png') for n in ['bright-deutan', 'painted-deutan', 'bright-tritan', 'painted-tritan']}
w, h = ims['bright-deutan'].size; top = 30
out = Image.new('RGB', (2 * w + 12, 2 * (h + top) + 12), BG); dr = ImageDraw.Draw(out)
for j, (n, lb) in enumerate([('bright-deutan', 'Bright, deutan preview'), ('painted-deutan', 'Painted, deutan preview'), ('bright-tritan', 'Bright, tritan preview'), ('painted-tritan', 'Painted, tritan preview')]):
    x, y = (j % 2) * (w + 12), (j // 2) * (h + top + 12); out.paste(ims[n], (x, y + top)); dr.text((x + 6, y + 6), lb, fill=INK, font=F)
out.save(f'{d}/ab-cvd-built.png')
print('ok')
