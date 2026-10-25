# python3 sbs.py: ours | reference side-by-sides (look only, direction only; never copied or traced)
from PIL import Image, ImageDraw, ImageFont
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
N = S + '/visual-v4/natural'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
def pair(ours, ref, out, label, H=720):
    a = ours.resize((round(ours.width * H / ours.height), H), Image.LANCZOS)
    b = ref.resize((round(ref.width * H / ref.height), H), Image.LANCZOS)
    gap, top = 16, 40
    im = Image.new('RGB', (a.width + gap + b.width, H + top), (24, 22, 20))
    im.paste(a, (0, top)); im.paste(b, (a.width + gap, top))
    d = ImageDraw.Draw(im); d.text((10, 8), label, fill=(233, 228, 216), font=font); d.text((a.width + gap + 10, 8), 'reference (direction only)', fill=(233, 228, 216), font=font)
    im.save(out); print(out, im.size)
crop = (18, 113, 1374, 735)  # the map under the top bar, left of the rail, above the bottom panel
r2 = Image.open(S + '/visual-refs/ref-2.png').convert('RGB'); r4 = Image.open(S + '/visual-refs/ref-4.png').convert('RGB')
k = r2.width / 1434
gc = tuple(round(v * k) for v in (145, 15, 1290, 655))
for look, name in (('natural', 'ours, Natural (default)'), ('clear', 'ours, Clear terrain colours')):
    a = Image.open(f'{N}/ad-fix/out/sbs-{look}-a.png').convert('RGB').crop(crop)
    b = Image.open(f'{N}/ad-fix/out/sbs-{look}-b.png').convert('RGB').crop(crop)
    pair(a, r2.crop(gc), f'{N}/shots/50-{look}-vs-ref-2.png', name + ', Mid')
    pair(b, r4.crop(gc), f'{N}/shots/51-{look}-vs-ref-4.png', name + ', Near')
