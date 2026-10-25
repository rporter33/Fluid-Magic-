import numpy as np, json
from PIL import Image
R='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/'
def Lstar(a):
    a=a.astype(np.float64)/255; lin=np.where(a<=0.04045,a/12.92,((a+0.055)/1.055)**2.4)
    Y=lin@np.array([0.2126729,0.7151522,0.0721750]); return np.where(Y>216/24389,116*np.cbrt(Y)-16,24389/27*Y)
def boxmean(x,r):
    p=np.pad(x,r,mode='edge'); c=p.cumsum(0).cumsum(1); c=np.pad(c,((1,0),(1,0)))
    n=2*r+1; return (c[n:,n:]-c[:-n,n:]-c[n:,:-n]+c[:-n,:-n])/(n*n)
def flat(img,r=3,th=2.0):
    L=Lstar(np.asarray(img.convert('RGB'))); m=boxmean(L,r); v=boxmean(L*L,r)-m*m; sd=np.sqrt(np.maximum(v,0))
    return dict(flat_share=round(float((sd<th).mean()),3), median_local_sd=round(float(np.median(sd)),2))
ref=Image.open(R+'handdrawn-design/reference-map.png').convert('RGB')
W=671; out={}
out['reference@671']=flat(ref.resize((W,round(ref.size[1]*W/ref.size[0])),Image.LANCZOS))
out['reference@full1536']=flat(ref)
for pal in ['painted','bright']:
    im=Image.open(R+f'palette-ab/review/shots/{pal}-start.png').convert('RGB').crop((233,268,904,688)); out[pal+' start']=flat(im)
    im=Image.open(R+f'palette-ab/review/shots/{pal}-near-140-stagmoor.png').convert('RGB').crop((17,181,1060,737)); out[pal+' near 1.4']=flat(im)
for k,v in out.items(): print(k,v)
json.dump(out,open(R+'palette-ab/review/data/flat.json','w'),indent=1)
