import sys
sys.path.insert(0, sys.argv[1])
import numpy as np
from PIL import Image
from v4color import to_lab, oklch, hexof
R=sys.argv[2]; S=2868/2000
P={
 'ref-1 blue block': (1,560,480,700,560),
 'ref-1 dark purple block': (1,640,580,900,650),
 'ref-1 red pikes': (1,200,690,360,760),
 'ref-1 dragon body': (1,640,270,780,330),
 'ref-6 orange-red block (bridge)': (6,760,260,900,340),
 'ref-6 teal-grey block': (6,1300,450,1480,540),
 'ref-6 giant skin': (6,1170,380,1220,440),
 'ref-7 pale block': (7,740,640,900,740),
 'ref-7 blue block': (7,930,420,1130,480),
 'ref-8 crimson mass': (8,1050,200,1300,300),
 'ref-8 blue mass': (8,650,420,950,500),
}
ims={}
print('| Patch | median | L* | OKLCH C | hue | 10th pct L* (dark details) |')
print('|---|---|---|---|---|---|')
for name,(n,x0,y0,x1,y1) in P.items():
    if n not in ims: ims[n]=np.asarray(Image.open(R+'ref-%d.png'%n).convert('RGB')).astype(float)
    a=ims[n][int(y0*S):int(y1*S),int(x0*S):int(x1*S)].reshape(-1,3)
    lab=to_lab(a); L=lab[:,0]
    # keep the figure pixels: drop pixels close to ground by taking the darker 60%
    med=np.median(a,0); Lm=to_lab(med[None,:])[0][0]; _,C,h=oklch(med[None,:])
    print('| %s | %s | %.0f | %.3f | %.0f | %.0f |'%(name,hexof(med),Lm,C[0],h[0],np.percentile(L,10)))
