# crop.py in.png out.png x0 y0 x1 y1 [scale]
import sys
from PIL import Image
a=sys.argv; im=Image.open(a[1]).convert('RGB'); x0,y0,x1,y1=map(int,a[3:7]); k=float(a[7]) if len(a)>7 else 2
c=im.crop((x0,y0,x1,y1)); c=c.resize((int(c.width*k),int(c.height*k)), Image.NEAREST if k>=2 else Image.LANCZOS); c.save(a[2])
