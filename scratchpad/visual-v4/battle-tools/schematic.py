"""Schematic of the overhead layout rules (battle-design.md sections 2 to 4): projected figure
positions for one army pair at the start and the HUD safe areas, at 1920x1080. Not art."""
import math, sys
from PIL import Image, ImageDraw
sys.path.insert(0, '.')
W, H = 1920, 1080
C, S = math.cos(math.radians(30)), math.sin(math.radians(30))
SP = math.sin(math.radians(40)); CP = math.cos(math.radians(40))
def proj(gx, gy, h=0.0):
    return gx*C + gy*S, (gx*S - gy*C)*SP - h*CP
FORM = {'line':(3.0,18,18,2,6),'heavy':(2.0,18,17,3,8),'archers':(6.0,24,22,1,3),'skirm':(8.0,30,26,1,2),'pack':(2.0,22,22,2,6),'flyers':(2.0,24,24,2,6)}
def seats(kind, n):
    if kind == 'wedge':
        out=[]; w=3; r=0; left=n
        while left>0:
            k=min(w,left)
            for i in range(k): out.append(((i-(k-1)/2)*34, -r*42))
            left-=k; w+=2; r+=1
        return out, 7*34, r*42
    a,fs,rs,mn,mx = FORM[kind]
    ranks=max(mn,min(mx,round(math.sqrt(n/a)))); ranks=max(1,min(ranks,n)); files=math.ceil(n/ranks)
    out=[]
    for r in range(ranks):
        k=min(files, n-r*files)
        off = (fs/2 if kind=='archers' and r%2 else 0)
        for i in range(k): out.append(((i-(k-1)/2)*fs+off, -r*rs))
    return out, files*fs, ranks*rs
def army(spec):
    """spec: list of (row, kind, n, color). Returns figures in side-local ground coords (y toward own edge positive)."""
    rows = {'front':[], 'middle':[], 'rear':[]}
    for row,kind,n,col in spec: rows[row].append((kind,n,col))
    figs=[]; d=140
    for row in ('front','middle','rear'):
        bl=[(seats(k,n),k,n,col) for k,n,col in rows[row]]
        if not bl: continue
        bl.sort(key=lambda b:-b[2]); order=[]
        for i,b in enumerate(bl): order = [b] if i==0 else (order+[b] if i%2==1 else [b]+order)
        width=sum(b[0][1] for b in order)+24*(len(order)-1); x=-width/2; depth=max(b[0][2] for b in order)
        for (pts,bw,bd),k,n,col in order:
            for px,py in pts: figs.append((x+bw/2+px, d - py, col, k))
            x+=bw+24
        d += depth + 48
    return figs, d
near = [('front','heavy',20,(150,60,40)),('front','line',30,(170,75,50)),('middle','archers',10,(190,95,60)),('front','wedge',7,(120,50,35))]
far  = [('front','heavy',20,(30,95,75)),('front','line',24,(45,110,85)),('middle','archers',13,(60,120,90)),('front','pack',18,(80,105,80))]
fn, dn = army(near); ff, df = army(far)
pts=[]
for gx,gy,col,k in fn: pts.append((gx, -gy, col, 'n'))
for gx,gy,col,k in ff: pts.append((-gx, gy, col, 'f'))
# commanders
pts.append((0, -(dn+20), (230,200,90), 'cn')); pts.append((0, df+20, (230,200,90), 'cf'))
P=[(proj(gx,gy),col,t) for gx,gy,col,t in pts]
xs=[p[0][0] for p in P]; ys=[p[0][1] for p in P]
bw, bh = max(xs)-min(xs)+80, max(ys)-min(ys)+80+28
availW, availH, top = W, H-104-56, 56
z=min(availW/bw, availH/bh, 1.7)
cx=(max(xs)+min(xs))/2; cy=(max(ys)+min(ys))/2-14
im=Image.new('RGB',(W,H),(168,167,132)); dr=ImageDraw.Draw(im)
def scr(x,y): return W/2+(x-cx)*z, top+availH/2+(y-cy)*z
# seam line and band guides
for gyl,colr in ((0,(120,40,40)),):
    a=scr(*proj(-500,gyl)); b=scr(*proj(500,gyl)); dr.line([a,b],fill=colr,width=1)
for gx,gy,col,t in sorted(pts,key=lambda p:proj(p[0],p[1])[1]):
    x,y=scr(*proj(gx,gy)); h=28*z*(1.15 if t.startswith('c') else 1); w=11*z
    dr.ellipse([x-w*0.7,y-w*0.25,x+w*0.7,y+w*0.25],fill=(120,118,95))
    dr.rectangle([x-w/2,y-h,x+w/2,y],fill=col,outline=(28,26,23))
    if t.startswith('c'): dr.ellipse([x-w,y-w*0.35,x+w,y+w*0.35],outline=col,width=2)
# HUD safe areas
dr.rectangle([16,H-96,16+11*68,H-12],outline=(20,18,15),width=2); dr.text((24,H-90),'player card bar (11 cards)',fill=(20,18,15))
dr.rectangle([16,8,16+9*40+150,60],outline=(20,18,15),width=2); dr.text((24,14),'enemy strip',fill=(20,18,15))
dr.rectangle([W-16-300,8,W-16,52],outline=(20,18,15),width=2); dr.text((W-306,14),'round . play . speed . beats . skip . menu',fill=(20,18,15))
dr.text((W/2-200,H-130),'zoom %.2f: a size-1 figure is %.0f px tall'%(z,28*z),fill=(20,18,15))
im.save(sys.argv[1]); print('zoom', z, 'fig px', 28*z, 'bbox', bw, bh)
