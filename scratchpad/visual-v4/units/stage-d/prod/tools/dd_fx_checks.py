# Checks on the packed new effect sheets (art plan 7.1 and 8.6 where they apply): per frame, the key-hue share left in its
# visible pixels (OKLCH hue within 25 degrees of the key's: magenta 328, blue 264; chroma above 0.05; alpha above 0.3),
# the alpha left on the frame's border (a cut-off), and the play-zoom size of its primary shape at f = 18, 28 and 48 px
# (a man is 28 wu; the readability floor 0.25 f) from the frame's nominal world size.
import json, os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
STAGE = os.path.abspath(os.path.join(HERE, '..', '..'))
UNITS = os.path.abspath(os.path.join(STAGE, '..'))
sys.path.insert(0, os.path.join(UNITS, 'tools')); sys.path.insert(0, os.path.join(UNITS, '..', 'tools'))
from v4color import oklch  # noqa: E402
A = json.load(open(os.path.join(STAGE, 'atlas', 'fx2', 'fx2-atlas.json')))
page = np.asarray(Image.open(os.path.join(STAGE, 'atlas', 'fx2', 'fx2-atlas.png')).convert('RGBA')).astype(np.float64)
KEYH = {'L6g': 328.0, 'E7b': 264.0}
out = {}
for n, f in A['frames'].items():
    fr = f['frame']
    c = page[fr['y']:fr['y'] + fr['h'], fr['x']:fr['x'] + fr['w']]
    a = c[..., 3] / 255
    rec = {}
    if f['sheet'] in KEYH:
        L, C, h = oklch(c[..., :3])
        vis = a > 0.3
        near = np.abs((h - KEYH[f['sheet']] + 180) % 360 - 180) < 25
        rec['keyHuePct'] = round(100 * float((vis & near & (C > 0.05)).sum() / max(1, vis.sum())), 2)
    rec['borderAlpha'] = round(float(max(a[0].max(), a[-1].max(), a[:, 0].max(), a[:, -1].max())), 3)
    ws = f.get('worldSize')
    if ws:
        wu = list(ws.values())[0]
        rec['playPx'] = {str(fz): round(wu * fz / 28, 1) for fz in (18, 28, 48)}
        rec['readableAt28'] = bool(wu * 28 / 28 >= 0.25 * 28)
    out[n] = rec
bad_key = {n: r['keyHuePct'] for n, r in out.items() if r.get('keyHuePct', 0) > 1.2}
cut = {n: r['borderAlpha'] for n, r in out.items() if r['borderAlpha'] > 0.1}
small = sorted(n for n, r in out.items() if r.get('readableAt28') is False)
summary = dict(frames=len(out), keyHueOver1_2pct=bad_key, borderAlphaOver0_1=cut, under025fAt28=small,
               note='frames under 0.25 f are particles drawn in numbers (seeds, leaves, spore clumps, drips, thin rope strips), secondary by design (art plan 7.1 applies to primary shapes)')
json.dump(dict(summary=summary, frames=out), open(os.path.join(STAGE, 'atlas', 'fx2', 'fx2-checks.json'), 'w'), indent=1)
print(json.dumps(summary, indent=1))
