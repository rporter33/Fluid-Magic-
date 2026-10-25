"""side-by-sides of the polish shots: before above, after below (or left / right for the phone), with a crop where given. python3 -I sbs-polish.py"""
import os
from PIL import Image, ImageDraw
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../shots/polish/')
CROPS = {'01-phone-fit-move': (17, 190, 375, 640), '02-phone-fit-panned': (17, 190, 375, 640), '03-phone-ref-panned': (17, 190, 375, 640), '12-phone-start': (17, 190, 375, 640),
  '04-start-1440': (300, 120, 1000, 640), '05-fit-1440': (250, 150, 1150, 750), '06-least-1440': (380, 180, 1060, 560), '07-start-1280': (17, 69, 1263, 560), '08-cliff-least': (440, 470, 950, 530),
  '09-cliff-mid': (100, 380, 1200, 500), '10-fog-ref-east': (500, 110, 1340, 730), '11-start-1440-dpr2': (600, 240, 2000, 1280), '13-desktop-move': (300, 120, 1000, 640), '14-near-ashspine': (200, 120, 1300, 740)}
for n, box in CROPS.items():
  a, b = S + f's-{n}-before.png', S + f's-{n}-after.png'
  if not (os.path.exists(a) and os.path.exists(b)): continue
  A, B = Image.open(a).convert('RGB').crop(box), Image.open(b).convert('RGB').crop(box); w, h = A.size; side = n.find('phone') >= 0
  o = Image.new('RGB', (w * 2 + 12, h + 24) if side else (w, h * 2 + 36), (240, 238, 232)); d = ImageDraw.Draw(o)
  if side: o.paste(A, (0, 24)); o.paste(B, (w + 12, 24)); d.text((4, 4), 'before', fill=(20, 20, 20)); d.text((w + 16, 4), 'after', fill=(20, 20, 20))
  else: o.paste(A, (0, 12)); o.paste(B, (0, h + 36)); d.text((4, 0), 'before', fill=(20, 20, 20)); d.text((4, h + 24), 'after', fill=(20, 20, 20))
  k = 4 if n.startswith('08') else 1; o = o.resize((o.width * k, o.height * k), Image.NEAREST) if k > 1 else o; o.save(S + f'sbs-{n}.png'); print('sbs', n, o.size)
