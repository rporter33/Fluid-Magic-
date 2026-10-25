# per view, the four variants side by side with captions: python3 ownersheet.py <dir>
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; CAP = {'a-band': 'A  stone band (default)', 'b-talus': 'B  talus to the line (?wildfoot=talus)', 'c-ink2': 'C  2 px near-black ink (?wildink=2)', 'd-pass3': 'D  pass 3 as reviewed'}
views = sorted({f.split('-a-band')[0] for f in os.listdir(d) if '-a-band' in f})
for v in views:
    ims = [(k, Image.open(os.path.join(d, f'{v}-{k}.png')).convert('RGB')) for k in CAP if os.path.exists(os.path.join(d, f'{v}-{k}.png'))]
    w = max(i.width for _, i in ims); h = max(i.height for _, i in ims); cols = 2 if w > 500 else 4; rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (cols * w + (cols - 1) * 8, rows * (h + 22) + (rows - 1) * 8), (24, 24, 24)); dr = ImageDraw.Draw(sh)
    for n, (k, im) in enumerate(ims):
        x = (n % cols) * (w + 8); y = (n // cols) * (h + 30); dr.text((x + 4, y + 4), CAP[k], fill=(240, 240, 240)); sh.paste(im, (x, y + 22))
    sh.save(os.path.join(d, f'_compare-{v}.png')); print(v, sh.size)
