import sys
from PIL import Image, ImageDraw
# usage: grid.py OUT SIZE COLS file1 file2 ...
out=sys.argv[1]; S=int(sys.argv[2]); cols=int(sys.argv[3]); files=sys.argv[4:]
rows=(len(files)+cols-1)//cols
sheet=Image.new("RGB",(cols*(S+4),rows*(S+16)),(20,20,20)); d=ImageDraw.Draw(sheet)
for i,f in enumerate(files):
    im=Image.open(f).convert("RGB").resize((S,S),Image.LANCZOS)
    x=(i%cols)*(S+4); y=(i//cols)*(S+16)
    sheet.paste(im,(x,y)); n=f.rsplit("/",2); d.text((x+2,y+S+2),n[-2][:12]+"/"+n[-1][-14:],fill=(220,220,220))
sheet.save(out); print(sheet.size)
