# Joins the motion-strip frames (resume/qa/strips/<name>.<i>.png) side by side into stage-b/shots/<name>.png.
import glob, os, re
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'qa', 'strips')
OUT = os.path.join(HERE, '..', '..', 'shots')
names = sorted({re.sub(r'\.\d+\.png$', '', os.path.basename(p)) for p in glob.glob(os.path.join(SRC, '*.png'))})
for n in names:
    fr = [Image.open(p).convert('RGB') for p in sorted(glob.glob(os.path.join(SRC, n + '.*.png')), key=lambda p: int(p.rsplit('.', 2)[1]))]
    W = sum(f.width for f in fr) + 4 * (len(fr) - 1)
    im = Image.new('RGB', (W, max(f.height for f in fr)), (20, 18, 16))
    x = 0
    for f in fr:
        im.paste(f, (x, 0)); x += f.width + 4
    im.save(os.path.join(OUT, n + '.png'))
    print(n, im.size, len(fr))
