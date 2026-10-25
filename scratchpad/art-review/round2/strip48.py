import glob, os, sys
from PIL import Image, ImageDraw
R = "/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/art-gen/round2"
A = "/home/user/Fluid-Magic-/src/assets/raster/portraits"
rows = []
for nat, u in [("cinderHorde","ashChieftain"),("cinderHorde","pyrePriest"),("thornwood","wardenCaptain"),("thornwood","grovePriest")]:
    rows.append((u, sorted(glob.glob(f"{A}/{nat}/{u}/0?.webp"))))
for u in ["cinderScout","emberAdept","cinderMagus","thornScout","saplingDruid","elderDruid","salamander","treant"]:
    rows.append((u, sorted(glob.glob(f"{R}/{u}/*__??.png"))))
for o in ["levy","hunter","mountaineer","reedman"]:
    rows.append((o, sorted(glob.glob(f"{R}/independentCaptain/independent__independentCaptain-{o}__??.png"))))
S = int(sys.argv[1]) if len(sys.argv)>1 else 48
gap=4; lab=90
W = lab + 12*(S+gap); H = len(rows)*(S+gap)
im = Image.new("RGB",(W,H),(24,22,20)); d = ImageDraw.Draw(im)
for i,(name,files) in enumerate(rows):
    y = i*(S+gap)
    d.text((2,y+S//3),name[:14],fill=(200,200,200))
    for j,f in enumerate(files):
        t = Image.open(f).convert("RGB").resize((S,S),Image.LANCZOS)
        im.paste(t,(lab+j*(S+gap),y))
out = sys.argv[2]
im.save(out); print(out, im.size)
