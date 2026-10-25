import sys
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image
from v4color import to_lab
R=sys.argv[2]; U=sys.argv[3]; S=2868/2000
def d(x0,y0,x1,y1): return tuple(int(v*S) for v in (x0,y0,x1,y1))
REG=[('ref-2 map (zoomed in)',R+'ref-2.png',d(210,90,1580,800)),('ref-3 map (mid)',R+'ref-3.png',d(210,90,1580,880)),('ref-4 map (out)',R+'ref-4.png',d(210,90,1580,800)),
('ref-1 battle',R+'ref-1.png',d(190,60,1810,800)),('ref-5 battle',R+'ref-5.png',d(190,60,1810,800)),('ref-6 battle',R+'ref-6.png',d(190,60,1810,800)),('ref-7 battle',R+'ref-7.png',d(190,60,1810,800)),('ref-8 battle',R+'ref-8.png',d(190,60,1810,800)),
('v3 start view, cloth only (Mid)',U+'v3-m70.png',(232,345,905,762)),('v3 desktop, cloth only (Mid)',U+'v3-desktop.png',(232,268,905,688)),('v3 near',U+'v3-near.png',(120,200,1080,730)),('v3 far, cloth only',U+'v3-far.png',(378,345,862,652))]
for name,p,box in REG:
    im=Image.open(p).convert('RGB'); W=im.width
    # references: the game area is about 1630 of the 2000 display px (black bars outside it)
    if 'visual-refs' in p: W=int(1630*S)
    im=im.crop(box)
    # coarse grid: one sample per 6 px of a 1440-wide screen
    k=1440/W/6
    im=im.resize((max(8,int(im.width*k)),max(8,int(im.height*k))),Image.BOX)
    L=to_lab(np.asarray(im).astype(float))[...,0]
    gx=np.abs(L[:,1:]-L[:,:-1]); gy=np.abs(L[1:,:]-L[:-1,:])
    g=np.maximum(gx[:-1,:],gy[:,:-1])
    print('| %s | %.1f%% | %.1f%% |'%(name,(g>10).mean()*100,(g>20).mean()*100))
