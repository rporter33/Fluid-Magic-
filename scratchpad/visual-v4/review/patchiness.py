"""Province-scale patchiness: mean CIEDE2000 between adjacent blocks a quarter of a province wide, and the share of
adjacent block pairs over 10 and over 15. The coarse busyness of map-design 4.9 (6 px cells, dL > 10) misses large flat
patches; this measures them. Usage: python3 -I patchiness.py"""
import sys, numpy as np
from PIL import Image
def s2l(c): c = c / 255.0; return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lab(rgb):
    l = s2l(rgb); M = np.array([[0.4124564,0.3575761,0.1804375],[0.2126729,0.7151522,0.0721750],[0.0193339,0.1191920,0.9503041]])
    t = (l @ M.T) / np.array([0.95047,1.0,1.08883]); f = np.where(t > (6/29)**3, np.cbrt(t), t/(3*(6/29)**2)+4/29)
    return np.stack([116*f[...,1]-16, 500*(f[...,0]-f[...,1]), 200*(f[...,1]-f[...,2])], -1)
def de2000(a, b):
    L1,a1,b1 = a[...,0],a[...,1],a[...,2]; L2,a2,b2 = b[...,0],b[...,1],b[...,2]
    C1=np.hypot(a1,b1); C2=np.hypot(a2,b2); Cb=(C1+C2)/2; G=0.5*(1-np.sqrt(Cb**7/(Cb**7+25**7)))
    a1p=(1+G)*a1; a2p=(1+G)*a2; C1p=np.hypot(a1p,b1); C2p=np.hypot(a2p,b2)
    h1=np.degrees(np.arctan2(b1,a1p))%360; h2=np.degrees(np.arctan2(b2,a2p))%360
    dL=L2-L1; dC=C2p-C1p; dh=h2-h1; dh=np.where(dh>180,dh-360,np.where(dh<-180,dh+360,dh)); dh=np.where(C1p*C2p==0,0,dh)
    dH=2*np.sqrt(C1p*C2p)*np.sin(np.radians(dh/2)); Lb=(L1+L2)/2; Cbp=(C1p+C2p)/2
    hs=h1+h2; hb=np.where(C1p*C2p==0,hs,np.where(np.abs(h1-h2)<=180,hs/2,np.where(hs<360,(hs+360)/2,(hs-360)/2)))
    T=1-0.17*np.cos(np.radians(hb-30))+0.24*np.cos(np.radians(2*hb))+0.32*np.cos(np.radians(3*hb+6))-0.2*np.cos(np.radians(4*hb-63))
    dT=30*np.exp(-((hb-275)/25)**2); Rc=2*np.sqrt(Cbp**7/(Cbp**7+25**7))
    Sl=1+0.015*(Lb-50)**2/np.sqrt(20+(Lb-50)**2); Sc=1+0.045*Cbp; Sh=1+0.015*Cbp*T; Rt=-np.sin(np.radians(2*dT))*Rc
    return np.sqrt((dL/Sl)**2+(dC/Sc)**2+(dH/Sh)**2+Rt*(dC/Sc)*(dH/Sh))
def patch(path, box, block):
    im = Image.open(path).convert('RGB').crop(box)
    w, h = im.width // block, im.height // block
    sm = np.asarray(im.resize((w, h), Image.BOX), float); L = lab(sm)
    d = np.concatenate([de2000(L[:, 1:], L[:, :-1]).ravel(), de2000(L[1:, :], L[:-1, :]).ravel()])
    return f'{path.split("/")[-1]:14s} blocks {w}x{h} of {block}px: mean {d.mean():5.1f}  >10 {100*(d>10).mean():5.1f}%  >15 {100*(d>15).mean():5.1f}%  L sd {L[...,0].std():4.1f}'
R = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/'
V = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/mapwork/out-final/'
# reference land crops (original 2868 x 1320 px), clear of panels; a province is about 400 px across in ref-2,
# 450 in ref-3, 300 in ref-4; blocks a quarter of that
print(patch(R + 'ref-2.png', (800, 129, 2230, 1144), 100))
print(patch(R + 'ref-3.png', (800, 129, 2230, 1144), 110))
print(patch(R + 'ref-4.png', (800, 129, 2230, 1144), 75))
# v4 preview, Mid (province about 95 to 105 px across in mid.png), land only crop; Near (about 400 px)
print(patch(V + 'mid.png', (110, 60, 1330, 820), 25))
print(patch(V + 'near.png', (0, 0, 1440, 900), 100))
for extra in sys.argv[1:]:
    p, x0, y0, x1, y1, b = extra.split(','); print(patch(p, (int(x0), int(y0), int(x1), int(y1)), int(b)))
