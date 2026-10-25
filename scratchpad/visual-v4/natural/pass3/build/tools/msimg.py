import json, sys
from PIL import Image
d='/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/build/look/'
t=sys.argv[1]; r=json.load(open(d+'ms-'+t+'.json')); w,h=r['nw'],r['nh']
ims=[]
for k in ['hM','pk','s01','wd']:
    im=Image.new('L',(w,h)); im.putdata(r[k]); ims.append(im.convert('RGB'))
c=Image.frombytes('RGBA',(w,h),bytes(r['img'])).convert('RGB'); ims.append(c)
W=sum(i.width for i in ims)+40; o=Image.new('RGB',(W,h),(255,0,0)); x=0
for i in ims: o.paste(i,(x,0)); x+=i.width+10
s=min(1.0, 1800/W); o=o.resize((int(W*s),int(h*s))); o.save(d+'ms-'+t+'.png'); print(o.size)
