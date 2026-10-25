import sys, glob, os
from PIL import Image, ImageDraw
# usage: eyes.py UNIT_DIR OUT -> crops of the face band (x 30-80%, y 25-55%) at 2x200px wide
d, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in glob.glob(os.path.join(d, '*__*.png')))
crops = []
for f in files:
    im = Image.open(f).convert('RGB'); w, h = im.size
    c = im.crop((int(w*.30), int(h*.25), int(w*.80), int(h*.55))).resize((400, 240), Image.LANCZOS)
    crops.append((os.path.basename(f).split('__')[-1], c))
cols = 4; rows = (len(crops)+cols-1)//cols
sheet = Image.new('RGB', (cols*408+8, rows*262+8), (24,22,20)); dr = ImageDraw.Draw(sheet)
for i,(n,c) in enumerate(crops):
    r, k = divmod(i, cols); x = 8+k*408; y = 8+r*262
    sheet.paste(c, (x,y)); dr.text((x+2, y+243), n, fill=(220,210,190))
sheet.save(out); print(out)
