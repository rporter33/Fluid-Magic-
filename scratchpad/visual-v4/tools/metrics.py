import sys
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image
from v4color import to_lab, oklch
R = sys.argv[2]; U = sys.argv[3]
# world regions (exclude letterbox and docked UI), in source pixel coords
S = 2868/2000
def disp(x0,y0,x1,y1): return tuple(int(v*S) for v in (x0,y0,x1,y1))
REG = {
 'ref-2 map near': (R+'ref-2.png', disp(210,90,1580,800)),
 'ref-3 map mid':  (R+'ref-3.png', disp(210,90,1580,880)),
 'ref-4 map far':  (R+'ref-4.png', disp(210,90,1580,800)),
 'ref-1 battle':   (R+'ref-1.png', disp(190,60,1810,800)),
 'ref-5 battle':   (R+'ref-5.png', disp(190,60,1810,800)),
 'ref-6 battle':   (R+'ref-6.png', disp(190,60,1810,800)),
 'ref-7 battle':   (R+'ref-7.png', disp(190,60,1810,800)),
 'ref-8 battle':   (R+'ref-8.png', disp(190,60,1810,800)),
 'v3 desktop (Mid, cloth only)': (U+'v3-desktop.png', (232,268,905,688)),
 'v3 near':        (U+'v3-near.png', (120,200,1080,730)),
 'v3 far (cloth only)': (U+'v3-far.png', (378,345,862,652)),
 'v3 m70 Mid (cloth only)': (U+'v3-m70.png', (232,345,905,762)),
}
def stats(path, box, name):
    im = Image.open(path).convert('RGB')
    if box is None:
        box = (0,0,im.width,im.height)
    # normalise pixel density: screen width -> 1440 px
    k = 1440/im.width
    im = im.crop(box)
    im = im.resize((max(1,int(im.width*k)), max(1,int(im.height*k))), Image.LANCZOS)
    a = np.asarray(im).astype(np.float64)
    lab = to_lab(a); L = lab[...,0]
    _, C, _ = oklch(a)
    # gradient on L* after 2x2 box blur
    Lb = (L[:-1,:-1]+L[1:,:-1]+L[:-1,1:]+L[1:,1:])/4
    gx = np.abs(Lb[:,2:]-Lb[:,:-2]); gy = np.abs(Lb[2:,:]-Lb[:-2,:])
    g = np.hypot(gx[1:-1,:], gy[:,1:-1])
    edge20 = (g>20).mean(); edge40 = (g>40).mean()
    hi = (C>0.12).mean()
    return dict(name=name, size='%dx%d'%(im.width,im.height), Lmean=L.mean(), Lp5=np.percentile(L,5), Lp50=np.percentile(L,50), Lp95=np.percentile(L,95),
                Lsd=L.std(), Cmean=C.mean(), Cp90=np.percentile(C,90), hiC=hi, e20=edge20, e40=edge40)
print('| View | L* p5 / p50 / p95 | L* sd | OKLCH C mean / p90 | share C > 0.12 | edge share ΔL*>20 / >40 |')
print('|---|---|---|---|---|---|')
for n,(p,b) in REG.items():
    try:
        s = stats(p,b,n)
    except FileNotFoundError:
        continue
    print('| %s | %.0f / %.0f / %.0f | %.1f | %.3f / %.3f | %.1f%% | %.1f%% / %.1f%% |'%(n,s['Lp5'],s['Lp50'],s['Lp95'],s['Lsd'],s['Cmean'],s['Cp90'],100*s['hiC'],100*s['e20'],100*s['e40']))
