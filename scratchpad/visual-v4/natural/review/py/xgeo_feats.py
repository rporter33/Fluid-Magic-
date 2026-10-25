"""Review, across map geometries: dump lightness features of the natural bake of the map in $NATDATA, per zoom, vision and fog state."""
import sys, os, numpy as np
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/natural/review/proto2')
import classify as C
from natlib import *
img = np.fromfile(os.path.join(DATA, 'natural.rgba'), np.uint8).reshape(C.BH, C.BW, 4)
def grey_eq(rgb):
    lab = rgb2lab(rgb); lab[..., 1:] = 0; return lab2rgb(lab)
mixc = lambda x, c, t: x * (1 - t) + hex2rgb(c) * t; desat = lambda x, t: x * (1 - t) + grey_eq(x) * t
ST = {'raw': lambda x: x, 'fog10_25': lambda x: desat(mixc(x, '#E8DCC2', 0.10), 0.25), 'fog6_40': lambda x: desat(mixc(x, '#E8DCC2', 0.06), 0.40)}
out = {}
for zn, dpx in [('Far', 50), ('Start', 85), ('Mid', 120), ('ref', 200), ('Near', 420)]:
    rgb0, idn, dn = C.screen(img, dpx)
    for vis in ['normal', 'deutan', 'protan', 'tritan']:
        for sn, fn in ST.items():
            if sn != 'raw' and (vis != 'normal' or zn in ('Near',)): continue
            X, y, prov, P = C.patches(np.clip(fn(rgb0.astype(np.float64)), 0, 255), idn, dn, dpx, vis)
            out[f'{zn}|{vis}|{sn}|X'] = X; out[f'{zn}|{vis}|{sn}|y'] = y; out[f'{zn}|{vis}|{sn}|p'] = prov
            print(zn, vis, sn, len(y), flush=True)
np.savez(sys.argv[1], **out)
