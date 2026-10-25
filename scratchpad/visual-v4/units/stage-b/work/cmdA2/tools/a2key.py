# Stage B, key "cmdA2": cmdA's keyer (work/cmdA/sbx/tools/key.py, imported unchanged) plus one pass for green-keyed
# sheets: the key seen in SHADOW through a small opening inside the figure (a staff's iron cage, the curl of a ram horn).
#   Cause (cmdA2 report): the painter shades the background inside small openings, so it is a dark green
#   (max channel ~0.35). key.py's alpha ramp uses the ABSOLUTE key excess k = G - max(R, B) (opaque below 0.3 of the
#   border's), so dark key stays opaque, is despilled into a grey blob, and keyInUnitPct counts it. Measured on the
#   failing sheets: those pixels have a RELATIVE excess k / max(R, G, B) of 0.27 to 0.86 (median 0.49 to 0.53), while the
#   figures' own paint stays at or below 0.14 at its 99th percentile (Cinder figures hold no green: tools/keycast.py).
#   The pass: deep inside the figure (keyInUnitPct's own 3 px eroded mask, so thin staffs, shafts and blades, which
#   never reach it, are untouched) a pixel with relative excess >= 0.30 is background: alpha ramps from 1 at 0.30 to 0 at
#   0.45; its colour is then despilled and bled as key.py does. The report is recomputed with key.py's formulas on the
#   new alpha, and also gives the old numbers (keyInUnitPctBefore) so nothing is hidden.
# Usage: python3 -I a2key.py IN.png OUT.png green|magenta|blue [--erode N] [--json REPORT.json]
import json, os, sys, time
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units/stage-b/work/cmdA/sbx/tools')
import key as K  # noqa: E402

REL0, REL1 = 0.30, 0.45


def inner_of(vis):
    m8 = Image.fromarray((vis * 255).astype(np.uint8))
    for _ in range(3):
        m8 = m8.filter(ImageFilter.MinFilter(3))
    return np.asarray(m8) > 127


def key_image(src, kc, erode=1):
    rgba, rep = K.key_image(src, kc, erode)
    if kc != 'green':
        rep['openingPass'] = 'not applied (green key only)'
        return rgba, rep
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
    k = K.strength(im, kc)
    rel = k / np.maximum(im.max(-1), 1e-3)
    alpha = rgba[..., 3].copy()
    vis = alpha > 0.3
    inner = inner_of(vis)
    hole = inner & (rel >= REL0) & (k > 0.02)
    # the hole's own rim (1 px around it, still key-hued) goes with it
    ring = np.asarray(Image.fromarray((hole * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 127
    sel = (hole | (ring & (rel >= 0.5 * REL0))) & vis
    a_new = np.clip((REL1 - rel) / (REL1 - REL0), 0, 1)
    alpha2 = np.where(sel, np.minimum(alpha, a_new), alpha)
    rgb = rgba[..., :3]
    rgb = np.where((sel & (alpha2 > 0.01))[..., None], K.hue_despill(K.despill(rgb, kc), kc), rgb)
    rgb = K.bleed(rgb, alpha2)
    # key.py's report on the new alpha (same formulas)
    vis2 = alpha2 > 0.3
    tinted = (k > 0.08) & vis2
    inner2 = inner_of(vis2)
    nvis = max(1, int(vis2.sum()))
    rep['keyInUnitPctBefore'] = rep['keyInUnitPct']
    rep['spillEdgePctBefore'] = rep['spillEdgePct']
    rep['keyInUnitPct'] = round(100 * int((tinted & inner2).sum()) / nvis, 3)
    rep['spillEdgePct'] = round(100 * int((tinted & ~inner2).sum()) / nvis, 3)
    rep['fringePct'] = round(100 * int(((K.strength(rgb, kc) > 0.08) & vis2).sum()) / nvis, 3)
    rep['edgeDevPct'] = K.edge_deviation(rgb, alpha2)
    rep['opaquePx'] = int((alpha2 > 0.99).sum()); rep['partialPx'] = int(((alpha2 > 0.01) & (alpha2 <= 0.99)).sum())
    rep['openingPass'] = dict(rel=[REL0, REL1], pixels=int(sel.sum()), madeClear=int((sel & (alpha2 < 0.3)).sum()),
                              alphaChangedOutsideSel=int(((alpha2 != alpha) & ~sel).sum()))
    return np.dstack([np.clip(rgb, 0, 1), alpha2]), rep


if __name__ == '__main__':
    args = sys.argv[1:]
    erode, rj = 1, None
    if '--erode' in args:
        i = args.index('--erode'); erode = int(args[i + 1]); del args[i:i + 2]
    if '--json' in args:
        i = args.index('--json'); rj = args[i + 1]; del args[i:i + 2]
    src, dst, kc = args
    t0 = time.time()
    rgba, rep = key_image(src, kc, erode)
    Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), 'RGBA').save(dst)
    rep['ms'] = round((time.time() - t0) * 1000)
    rep['keyer'] = 'cmdA2 a2key.py (key.py + green opening pass)'
    if rj:
        json.dump(rep, open(rj, 'w'), indent=1)
    print(json.dumps(rep))
