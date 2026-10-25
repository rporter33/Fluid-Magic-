"""Escarpment check: the hillshade term (before ground detail) along terrain borders against the same terrain's cores,
on the Near preview of map-s3 (4.4 px per unit). An escarpment draws the warped province outline as a lit or shaded
rim. Usage: python3 -I escarp.py <dump.npz> ..."""
import sys, numpy as np
from PIL import Image, ImageFilter
TERR = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
for path in sys.argv[1:]:
    z = np.load(path); hs, wts, ID = z['hs'], z['wts'], z['ID']
    prov = (ID > 0) & (ID < 200)
    mx = wts.max(-1); dom = wts.argmax(-1)
    # the ecotone: where the albedo weights blend; widen it to 3 units (13 px) either side to catch the rim
    eco = (mx < 0.97) & prov
    band = np.asarray(Image.fromarray((eco * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(27))) > 0
    band &= prov; core = prov & ~band & (mx > 0.99)
    out = []
    for k, t in enumerate(TERR):
        b = band & (dom == k); c = core & (dom == k)
        if b.sum() < 500 or c.sum() < 500: continue
        out.append(f'{t} band |hs| p50 {np.median(np.abs(hs[b])):.1f} p90 {np.percentile(np.abs(hs[b]), 90):.1f} / core p50 {np.median(np.abs(hs[c])):.1f} p90 {np.percentile(np.abs(hs[c]), 90):.1f}')
    print(path); print('  ' + '\n  '.join(out))
