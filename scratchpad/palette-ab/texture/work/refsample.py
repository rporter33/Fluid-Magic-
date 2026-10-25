import sys
from PIL import Image
import numpy as np
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)/255
def lin(c): return np.where(c<=0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def oklab(rgb):
    r,g,b = lin(rgb[...,0]),lin(rgb[...,1]),lin(rgb[...,2])
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=np.cbrt(l),np.cbrt(m),np.cbrt(s)
    L=0.2104542553*l+0.7936177850*m-0.0040720468*s
    a=1.9779984951*l-2.4285922050*m+0.4505937099*s
    bb=0.0259040371*l+0.7827717662*m-0.8086757660*s
    return L,a,bb
def lab(rgb):
    r,g,b = lin(rgb[...,0]),lin(rgb[...,1]),lin(rgb[...,2])
    x=(0.4124564*r+0.3575761*g+0.1804375*b)/0.95047; y=0.2126729*r+0.7151522*g+0.072175*b; z=(0.0193339*r+0.119192*g+0.9503041*b)/1.08883
    f=lambda t: np.where(t>216/24389, np.cbrt(t), (24389/27*t+16)/116)
    return 116*f(y)-16, 500*(f(x)-f(y)), 200*(f(y)-f(z))
# patches: name, x0,y0,x1,y1 (ref image 1536x1024)
P = [('grass (center)',560,620,640,700),('grass (north)',780,150,880,220),('farmland gold',600,290,680,330),('farmland gold2',620,500,700,560),
     ('forest canopy',1080,180,1200,280),('forest west',100,300,240,400),('hills/barrens',1180,380,1320,470),('barrens paper',1220,430,1300,470),
     ('mountains E',1330,600,1480,760),('mountains NW',40,40,200,160),('marsh',60,560,200,680),('sea',450,820,650,960),('paper margin',1490,300,1530,700)]
for n,x0,y0,x1,y1 in P:
    p=im[y0:y1,x0:x1]
    L,a,b=lab(p); OL,Oa,Ob=oklab(p)
    mean=p.reshape(-1,3).mean(0)
    hexm='#%02X%02X%02X'%tuple(int(round(v*255)) for v in mean)
    C=np.hypot(Oa,Ob)
    print(f"{n:18s} mean {hexm} L* {L.mean():5.1f} sdL {L.std():4.1f} C*ab(mean of px) {np.hypot(a,b).mean():5.1f} | OK L {OL.mean():.3f} C {C.mean():.3f} C(of mean) {np.hypot(Oa.mean(),Ob.mean()):.3f} h {np.degrees(np.arctan2(Ob.mean(),Oa.mean()))%360:5.1f}")
