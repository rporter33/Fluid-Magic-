import glob, sys
from PIL import Image, ImageDraw
R = "/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2"
units = sys.argv[1].split(",")
out = sys.argv[2]
box = tuple(float(x) for x in sys.argv[3].split(",")) if len(sys.argv)>3 else (0.30,0.22,0.85,0.55)
tiles=[]
for u in units:
    for f in sorted(glob.glob(f"{R}/{u}/*__??.png")) if "/" not in u else sorted(glob.glob(u)):
        im = Image.open(f).convert("RGB"); w,h = im.size
        c = im.crop((int(box[0]*w),int(box[1]*h),int(box[2]*w),int(box[3]*h)))
        c = c.resize((int(c.width*0.5),int(c.height*0.5)))
        tiles.append((f.split("__")[-2][-12:]+f.split("__")[-1][:2],c))
tw,th = tiles[0][1].size
cols=4; rows=(len(tiles)+cols-1)//cols
sheet = Image.new("RGB",(cols*(tw+4),rows*(th+16)),(20,20,20)); d=ImageDraw.Draw(sheet)
for i,(n,c) in enumerate(tiles):
    x=(i%cols)*(tw+4); y=(i//cols)*(th+16)
    sheet.paste(c,(x,y)); d.text((x+2,y+th+2),n,fill=(220,220,220))
sheet.save(out); print(sheet.size)
