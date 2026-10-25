# before (pass 3 as reviewed, shots/prev-pass3) | after (fix pass, shots/) for the wild views: python3 -I sbsfix.py
import os
from PIL import Image, ImageDraw
S = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/pass3/shots/'
O = S + 'sbs-fix/'; os.makedirs(O, exist_ok=True)
names = ['01-start', '02-far', '03-mid', '05-near-ashspine', '06-near-greyteeth', '07-near-mere', '08-max-ashspine', '09-max-greyteeth', '10-max-mere', '40-dpr2-max-ashspine']
PW, PH, G, T = 1344, 840, 40, 28
for n in names:
    a, b = Image.open(S + 'prev-pass3/' + n + '.png').convert('RGB'), Image.open(S + n + '.png').convert('RGB')
    out = Image.new('RGB', (2 * PW + G, PH + T), (24, 22, 20)); d = ImageDraw.Draw(out)
    for k, (im, cap) in enumerate([(a, 'before: pass 3 as reviewed'), (b, 'after: fix pass')]):
        im = im.copy(); im.thumbnail((PW, PH)); out.paste(im, (k * (PW + G), T)); d.text((k * (PW + G) + 6, 6), n + '  ' + cap, fill=(235, 230, 220))
    out.save(O + n + '.png')
print('ok', len(names))
