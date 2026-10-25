"""Before/after sheets of the natural-view prototype, beside the zoomed-in reference (look only). Before: the v4 relief map as built
(the Clear colours). After: the natural bake injected into the mockup in memory, with the design's line, seat, label and fog changes.
Usage: python3 -I sheets.py"""
import os, sys, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import s2l, l2s, MACHADO
from PIL import Image, ImageDraw, ImageFont
O = os.path.join(os.path.dirname(__file__), 'renders') + '/'; P = os.path.dirname(__file__) + '/'
REF = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-refs/ref-2.png'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except Exception: F = ImageFont.load_default()
CANVAS = (17, 113, 1374, 737)
def crop(name, box=CANVAS): return Image.open(O + name).convert('RGB').crop(box)
def ref2(h):
    im = Image.open(REF).convert('RGB').crop((286, 30, 2580, 1310)); return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)
def sheet(rows, out, gap=8, lab=30):
    W = max(sum(im.width for im, _ in r) + gap * (len(r) - 1) for r in rows); H = sum(max(im.height for im, _ in r) + lab for r in rows) + gap * (len(rows) - 1)
    S = Image.new('RGB', (W, H), (24, 22, 20)); d = ImageDraw.Draw(S); y = 0
    for r in rows:
        x = 0; h = max(im.height for im, _ in r)
        for im, t in r: d.text((x + 6, y + 5), t, fill=(244, 238, 223), font=F); S.paste(im, (x, y + lab)); x += im.width + gap
        y += h + lab + gap
    S.save(O + out); print(out, S.size)
def cvd(im, v):
    a = np.asarray(im, np.float64); lin = s2l(a) @ MACHADO[v].T; return Image.fromarray(np.clip(np.round(l2s(np.clip(lin, 0, 1))), 0, 255).astype(np.uint8))
r = ref2(624)
sheet([[(crop('before-ref200a.png'), 'before: v4 relief as built (= Clear colours), 200 px a province'), (crop('after-ref200a.png'), 'after: Natural (prototype), same view')],
       [(r, 'reference, map zoomed in (direction only; not our art)'), (crop('after-ref200b.png'), 'after: Natural, east (fields, plains, forest, scrub)')]], 'sheet-ref-zoom.png')
mb = (300, 180, 1090, 712)
sheet([[(crop('before-start.png', mb), 'before: start view (1440 x 900, 85 px a province)'), (crop('after-start.png', mb), 'after: Natural, start view')]], 'sheet-start.png')
sheet([[(crop('before-far.png'), 'before: Far'), (crop('after-far.png'), 'after: Natural, Far')], [(crop('before-near.png'), 'before: Near (420 px a province)'), (crop('after-near.png'), 'after: Natural, Near')]], 'sheet-far-near.png')
sheet([[(crop('after-fog.png'), 'Natural: fog (east: unexplored, haze 10% + desaturation 25%; hem; dotted lines)'), (crop('clearfixed-ref200a.png'), 'Clear setting / Terrain mode fills: the colour-blind-safe bake with the line fixes')]], 'sheet-fog-clear.png')
a = crop('after-ref200a.png')
sheet([[(a.resize((678, 312)), 'Natural, normal vision'), (cvd(a, 'deutan').resize((678, 312)), 'deuteranopia (Machado 2009)')], [(cvd(a, 'protan').resize((678, 312)), 'protanopia'), (cvd(a, 'tritan').resize((678, 312)), 'tritanopia')]], 'sheet-cvd.png')
