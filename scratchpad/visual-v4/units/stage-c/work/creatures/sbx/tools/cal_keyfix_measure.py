# Stage B calibration: the keyer's thin-feature fix measured. The pilot keyer (key_pilot.py, a copy of tools/key.py)
# against this sandbox's key.py on a set of sheets: visible pixels left pure black (max channel < 8/255) by the 6-step
# bleed, and the fringe numbers. Usage: python3 cal_keyfix_measure.py OUT.json RAW:KEY ...
import json, sys, os
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import key as new
import key_pilot as old


def black(rgba):
    vis = rgba[..., 3] > 0.3
    return int(((rgba[..., :3].max(-1) < 8 / 255) & vis).sum()), int(vis.sum())


out = {}
for arg in sys.argv[2:]:
    raw, kc = arg.rsplit(':', 1)
    a, ra = old.key_image(raw, kc)
    b, rb = new.key_image(raw, kc)
    out[os.path.basename(raw)] = dict(key=kc, blackBefore=black(a)[0], blackAfter=black(b)[0], visible=black(b)[1],
                                      edgeDevBefore=ra['edgeDevPct'], edgeDevAfter=rb['edgeDevPct'])
    print(os.path.basename(raw), out[os.path.basename(raw)], flush=True)
json.dump(out, open(sys.argv[1], 'w'), indent=1)
