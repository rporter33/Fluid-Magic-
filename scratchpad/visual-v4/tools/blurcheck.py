import sys
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image, ImageFilter
from v4color import to_lab
U=sys.argv[2]; R=sys.argv[3]
def edge(im):
    a=np.asarray(im.convert('RGB')).astype(float); L=to_lab(a)[...,0]
    Lb=(L[:-1,:-1]+L[1:,:-1]+L[:-1,1:]+L[1:,1:])/4
    gx=np.abs(Lb[:,2:]-Lb[:,:-2]); gy=np.abs(Lb[2:,:]-Lb[:-2,:]); g=np.hypot(gx[1:-1,:],gy[:,1:-1])
    return (g>20).mean()*100,(g>40).mean()*100
S=2868/2000
for name,path,box in [('v3 near',U+'v3-near.png',(120,200,1080,730)),('v3 m70 cloth',U+'v3-m70.png',(232,345,905,762))]:
    im=Image.open(path).crop(box)
    out=[name]
    for r in (0,1.0,1.5):
        b=im.filter(ImageFilter.GaussianBlur(r)) if r else im
        out.append('blur %.1f: %.1f%% / %.1f%%'%((r,)+edge(b)))
    print(' | '.join(out))
# reference sharpness proxy: how much a further blur changes edge share
for n in (2,6):
    im=Image.open(R+'ref-%d.png'%n); k=1440/im.width
    box=tuple(int(v*S) for v in ((210,90,1580,800) if n==2 else (190,60,1810,800)))
    im=im.crop(box); im=im.resize((int(im.width*k),int(im.height*k)),Image.LANCZOS)
    print('ref-%d'%n, ' | '.join('blur %.1f: %.1f%% / %.1f%%'%((r,)+edge(im.filter(ImageFilter.GaussianBlur(r)) if r else im)) for r in (0,1.0,1.5)))
