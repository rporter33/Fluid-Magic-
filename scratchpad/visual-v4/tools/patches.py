import sys, json
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image
from v4color import to_lab, oklch, hexof
R = sys.argv[2]
S = 2868/2000
# name: (ref, x0,y0,x1,y1) in 2000-wide display coords
P = {
 'map: dense forest (ref-2)': (2, 585,470,625,495),
 'map: forest (ref-2, NE)': (2, 1290,470,1330,500),
 'map: open grass (ref-2)': (2, 1150,590,1200,615),
 'map: grass light (ref-2, S)': (2, 760,560,800,590),
 'map: river/lake water (ref-2)': (2, 480,190,530,230),
 'map: lake (ref-2, SE)': (2, 1150,740,1220,770),
 'map: red-owner tinted land (ref-2)': (2, 860,180,920,230),
 'map: mountain lit face (ref-2)': (2, 1560,300,1580,315),
 'map: mountain shade (ref-2)': (2, 1610,330,1640,350),
 'map: snow land, teal owner tint (ref-3)': (3, 1080,330,1160,380),
 'map: snow land, neutral (ref-3)': (3, 1440,610,1500,660),
 'map: snow land, violet owner tint (ref-3)': (3, 560,330,620,380),
 'map: cliff rock face (ref-3)': (3, 960,560,1020,620),
 'map: void (ref-3)': (3, 1600,120,1640,160),
 'map: red-owner land (ref-4)': (4, 880,440,960,480),
 'map: red-owner land (ref-4, 2)': (4, 700,600,780,640),
 'map: cliff rock (ref-4)': (4, 1040,620,1080,660),
 'map: void (ref-4)': (4, 260,520,320,580),
 'battle: sand (ref-1)': (1, 1300,680,1400,740),
 'battle: sand light (ref-1)': (1, 400,100,500,160),
 'battle: grassy sand (ref-5)': (5, 1600,500,1700,560),
 'battle: snow (ref-6)': (6, 1000,700,1100,760),
 'battle: river (ref-6)': (6, 1500,250,1600,300),
 'battle: bridge stone top (ref-6)': (6, 560,380,620,420),
 'battle: mud ground (ref-7)': (7, 1300,650,1450,720),
 'battle: fort wall (ref-7)': (7, 1100,150,1200,190),
 'battle: sand (ref-8)': (8, 400,700,480,760),
 'battle: river (ref-8)': (8, 1400,600,1460,640),
}
out = []
ims = {}
for name,(n,x0,y0,x1,y1) in P.items():
    if n not in ims: ims[n] = np.asarray(Image.open(R+'ref-%d.png'%n).convert('RGB')).astype(np.float64)
    a = ims[n][int(y0*S):int(y1*S), int(x0*S):int(x1*S)].reshape(-1,3)
    med = np.median(a,0)
    lab = to_lab(med[None,:])[0]; L,C,h = oklch(med[None,:])
    labs = to_lab(a); 
    out.append((name, hexof(med), round(lab[0],1), round(float(C[0]),3), round(float(h[0])), round(float(labs[:,0].std()),1)))
for o in out: print('| %s | %s | %s | %s | %s | %s |'%o)

from PIL import ImageDraw
tiles=[]
for name,(n,x0,y0,x1,y1) in P.items():
    im=Image.open(R+'ref-%d.png'%n).convert('RGB')
    cx,cy=(x0+x1)/2*S,(y0+y1)/2*S
    t=im.crop((int(cx-90),int(cy-60),int(cx+90),int(cy+60))).copy()
    d=ImageDraw.Draw(t); d.rectangle((int(x0*S-cx+90),int(y0*S-cy+60),int(x1*S-cx+90),int(y1*S-cy+60)),outline=(255,0,255),width=2)
    d.text((3,3),name[:34],fill=(255,255,0))
    tiles.append(t)
cols=6; rows=(len(tiles)+cols-1)//cols
sheet=Image.new('RGB',(180*cols,120*rows))
for i,t in enumerate(tiles): sheet.paste(t,((i%cols)*180,(i//cols)*120))
sheet.save(sys.argv[3])
