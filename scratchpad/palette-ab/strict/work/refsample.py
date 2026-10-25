# Sample the reference image's land families (median sRGB per box) and report CIELAB and OKLCH.
import sys, json
import numpy as np
from PIL import Image
im = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
def lin(c): c=c/255; return np.where(c<=0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def oklch(rgb):
    r,g,b = lin(np.array(rgb,float))
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b; m=0.2119034982*r+0.6806995451*g+0.1073969566*b; s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=np.cbrt(l),np.cbrt(m),np.cbrt(s)
    L=0.2104542553*l+0.7936177850*m-0.0040720468*s; a=1.9779984951*l-2.4285922050*m+0.4505937099*s; bb=0.0259040371*l+0.7827717662*m-0.8086757660*s
    return L, float(np.hypot(a,bb)), float(np.degrees(np.arctan2(bb,a))%360)
def lab(rgb):
    r,g,b = lin(np.array(rgb,float))
    x=(0.4124564*r+0.3575761*g+0.1804375*b)/0.95047; y=0.2126729*r+0.7151522*g+0.072175*b; z=(0.0193339*r+0.119192*g+0.9503041*b)/1.08883
    f=lambda t: np.cbrt(t) if t>216/24389 else ((24389/27)*t+16)/116
    L=116*f(y)-16; A=500*(f(x)-f(y)); B=200*(f(y)-f(z)); return float(L),float(A),float(B),float(np.hypot(A,B)),float(np.degrees(np.arctan2(B,A))%360)
BOX = {
 'paper (left margin)': [(0,300,14,600),(1520,300,1536,600)],
 'plains/grass': [(430,560,560,640),(880,270,980,330),(700,170,820,230),(1000,500,1100,560)],
 'farmland fields': [(565,290,700,335),(610,495,720,555),(560,455,640,500)],
 'forest canopy': [(1000,190,1200,300),(60,250,250,380),(830,560,950,660)],
 'hills (brown humps)': [(1040,330,1220,410),(1250,320,1330,380)],
 'mountains (Stormhold)': [(1260,760,1460,900),(1350,560,1500,700)],
 'swamp (Mistmarsh)': [(40,520,250,720)],
 'barrens (wasteland)': [(1100,430,1250,500),(1250,470,1400,520),(1350,230,1500,300)],
 'water (Suncoast)': [(450,830,750,950)],
}
out = {}
for k, boxes in BOX.items():
    px = np.concatenate([im[y0:y1, x0:x1].reshape(-1,3) for (x0,y0,x1,y1) in boxes])
    med = np.median(px, axis=0)
    hexs = '#%02X%02X%02X' % tuple(int(round(v)) for v in med)
    L,C,h = oklch(med); l = lab(med)
    out[k] = dict(hex=hexs, oklch=[round(L,3), round(C,3), round(h,1)], lab=[round(v,1) for v in l])
    print(f"{k:24s} {hexs}  OKLCH L {L:.3f} C {C:.3f} h {h:5.1f}   CIELAB L* {l[0]:.1f} a* {l[1]:.1f} b* {l[2]:.1f} C* {l[3]:.1f} h {l[4]:.0f}")
json.dump(out, open(sys.argv[2],'w'), indent=1)
