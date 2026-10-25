# python3 sbs.py: ours | reference side-by-sides (look only) from the shot frames and the reference images
import sys
from PIL import Image, ImageDraw, ImageFont
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad'
M = S + '/visual-v4/map'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
def pair(ours, ref, out, H=720):
    a = ours.resize((round(ours.width * H / ours.height), H), Image.LANCZOS)
    b = ref.resize((round(ref.width * H / ref.height), H), Image.LANCZOS)
    gap, top = 16, 40
    im = Image.new('RGB', (a.width + gap + b.width, H + top), (24, 22, 20))
    im.paste(a, (0, top)); im.paste(b, (a.width + gap, top))
    d = ImageDraw.Draw(im); d.text((10, 8), 'ours (relief, mockup)', fill=(233, 228, 216), font=font); d.text((a.width + gap + 10, 8), 'reference (direction only)', fill=(233, 228, 216), font=font)
    im.save(out); print(out, im.size)
crop = (18, 113, 1374, 889)  # the map under the top bar and left of the rail (the controls start folded under Relief since fix 6; nothing selected, so no strip)
ours_a = Image.open(M + '/tmp/sbs-src-a.png').convert('RGB').crop(crop)
ours_b = Image.open(M + '/tmp/sbs-src-b.png').convert('RGB').crop(crop)
r2 = Image.open(S + '/visual-refs/ref-2.png').convert('RGB'); r4 = Image.open(S + '/visual-refs/ref-4.png').convert('RGB')
k = r2.width / 1434  # the small copies were 1434 wide; the game area sits at (145, 15)-(1290, 655) there
gc = tuple(round(v * k) for v in (145, 15, 1290, 655))
pair(ours_a, r2.crop(gc), M + '/shots/23-vs-ref-2.png')
pair(ours_b, r4.crop(gc), M + '/shots/24-vs-ref-4.png')
