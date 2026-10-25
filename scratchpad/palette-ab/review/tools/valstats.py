# Value structure of the map at the start view against the reference (numpy + PIL only).
import sys, json, numpy as np
from PIL import Image, ImageFilter
R='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/'
def lab(a):
    a=a.astype(np.float64)/255
    lin=np.where(a<=0.04045,a/12.92,((a+0.055)/1.055)**2.4)
    M=np.array([[0.4124564,0.3575761,0.1804375],[0.2126729,0.7151522,0.0721750],[0.0193339,0.1191920,0.9503041]])
    xyz=lin@M.T; xyz/=np.array([0.95047,1.0,1.08883])
    f=np.where(xyz>216/24389,np.cbrt(xyz),(24389/27*xyz+16)/116)
    L=116*f[...,1]-16; A=500*(f[...,0]-f[...,1]); B=200*(f[...,1]-f[...,2])
    return L,A,B
def bands(img):
    w=img.size[0]
    Lc=lab(np.asarray(img.convert('RGB')))[0]
    Li=Image.fromarray(np.clip(Lc*2.55,0,255).astype(np.uint8))
    def blur(s): return np.asarray(Li.filter(ImageFilter.GaussianBlur(s))).astype(np.float64)/2.55
    b1=blur(w/400); b2=blur(w/60); 
    fine=Lc-b1; mid=b1-b2; coarse=b2
    return dict(fine=round(float(fine.std()),2), object=round(float(mid.std()),2), patch=round(float(coarse.std()),2), ratio_object_to_patch=round(float(mid.std()/coarse.std()),3))
def stats(img,name):
    a=np.asarray(img.convert('RGB'))
    L,A,B=lab(a); C=np.hypot(A,B); h=(np.degrees(np.arctan2(B,A))+360)%360
    q=lambda x,p: round(float(np.percentile(x,p)),1)
    out=dict(name=name,size=img.size,L_p5=q(L,5),L_p25=q(L,25),L_p50=q(L,50),L_p75=q(L,75),L_p95=q(L,95),L_std=round(float(L.std()),1),
             L_iqr=round(q(L,75)-q(L,25),1), dark_lt30=round(float((L<30).mean()*100),1), light_gt80=round(float((L>80).mean()*100),1),
             C_mean=round(float(C.mean()),1), warm_share=round(float(((h>20)&(h<100)&(C>8)).mean()*100),1), cool_share=round(float(((h>150)&(h<300)&(C>8)).mean()*100),1))
    out.update(bands(img)); return out
res=[]
ref=Image.open(R+'handdrawn-design/reference-map.png').convert('RGB')
W=671  # inner map width at the start view (px)
refs=ref.resize((W,round(ref.size[1]*W/ref.size[0])),Image.LANCZOS)
res.append(stats(refs,'reference (whole, scaled to 671 px)'))
# reference land only: crop the top two thirds (little sea)
rl=ref.crop((0,0,1536,700)); rl=rl.resize((W,round(700*W/1536)),Image.LANCZOS)
res.append(stats(rl,'reference (top 700 px: land, scaled)'))
for pal in ['painted','bright']:
    im=Image.open(R+f'palette-ab/review/shots/{pal}-start.png').convert('RGB')
    inner=im.crop((233,268,904,688))
    res.append(stats(inner,f'{pal} start (map inside the neatline)'))
v3=Image.open(R+'ui-mockup/v3-desktop.png').convert('RGB').crop((233,268,904,688))
res.append(stats(v3,'v3-desktop (map inside the neatline)'))
for r in res: print(json.dumps(r))
json.dump(res,open(R+'palette-ab/review/data/valstats.json','w'),indent=1)
