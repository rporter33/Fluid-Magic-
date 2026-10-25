# Contact sheets for the stage C shots: each close zoom beside its card (the card at 2x, as a 64 x 60 css px card shows
# on a DPR 2 screen), captioned; and the Wolf Rider front both ways side by side. Usage: python3 -I compose.py <dir>
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1]
M = json.load(open(os.path.join(D, 'close.json')))
F = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
font, fontb = ImageFont.truetype(F, 26), ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
CARD_KIND = M['cardKinds']
for s in M['shots']:
    im = Image.open(os.path.join(D, s['base'] + '.raw.png')).convert('RGB')
    W, H = im.size
    cw, ch = 1800, 1240
    x0, y0 = (W - cw) // 2, (H - ch) // 2
    shot = im.crop((x0, y0, x0 + cw, y0 + ch))
    card = Image.open(os.path.join(D, s['card'])).convert('RGB').resize((384, 360), Image.LANCZOS)
    sheet = Image.new('RGB', (cw + 440, ch), (28, 26, 23))
    sheet.paste(shot, (0, 0))
    sheet.paste(card, (cw + 28, 120))
    d = ImageDraw.Draw(sheet)
    key = s['fig'] or s['look']
    kind = CARD_KIND.get(key) or ('approved leader portrait (the battle record\'s card)' if s['fig'] and not CARD_KIND.get(s['fig']) else '')
    d.text((cw + 28, 30), s['name'], font=fontb, fill=(244, 238, 223))
    d.text((cw + 28, 74), 'its card, shown at 3x', font=ImageFont.truetype(F, 18), fill=(183, 173, 154))
    lines = [f"figure: {key}", f"view: {s['view']}{' (front: ' + s['front'] + ')' if s.get('front') else ''}", f"status: {s['status']}", f"tier {s['tier']}, battle {s['key']}, t = {s['t']:.1f} s", '', 'card:']
    words, cur = kind.split(' '), ''
    wrapped = []
    for w in words:
        if len(cur) + len(w) > 26: wrapped.append(cur); cur = w
        else: cur = (cur + ' ' + w).strip()
    wrapped.append(cur)
    y = 510
    for ln in lines + wrapped:
        d.text((cw + 28, y), ln, font=ImageFont.truetype(F, 21), fill=(220, 212, 196)); y += 30
    sheet.save(os.path.join(D, s['base'] + '.png'))
    os.remove(os.path.join(D, s['base'] + '.raw.png'))
# the Wolf Rider front both ways, side by side
a, b = os.path.join(D, 'c-close-wolfRider-front-harness.png'), os.path.join(D, 'c-close-wolfRider-front-kept.png')
if os.path.exists(a) and os.path.exists(b):
    A, B = Image.open(a), Image.open(b)
    cw = 1800
    A, B = A.crop((300, 200, cw - 300, 1040)), B.crop((300, 200, cw - 300, 1040))
    out = Image.new('RGB', (A.width * 2 + 20, A.height + 60), (28, 26, 23))
    out.paste(A, (0, 60)); out.paste(B, (A.width + 20, 60))
    d = ImageDraw.Draw(out)
    d.text((20, 14), 'Wolf Rider front: War Wolf harness (default)', font=fontb, fill=(244, 238, 223))
    d.text((A.width + 40, 14), 'Wolf Rider front: kept test', font=fontb, fill=(244, 238, 223))
    out.save(os.path.join(D, 'c-wolfrider-front-compare.png'))
print('composed', len(M['shots']))
