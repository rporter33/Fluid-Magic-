"""share of each saved chip clip that the pieces layer changes (sum |dRGB| > 24): python3 -I chipshare.py <chipocc json>"""
import sys, json, numpy as np
from PIL import Image
d = json.load(open(sys.argv[1])); out = []
for r in d['rows']:
    s = r.get('coveredShare')
    if isinstance(s, str):
        a = np.asarray(Image.open(s + '-on.png').convert('RGB'), np.int32); z = np.asarray(Image.open(s + '-off.png').convert('RGB'), np.int32)
        r['coveredShare'] = round(float((np.abs(a - z).sum(-1) > 24).mean()), 3)
    out.append(r); print(r.get('tag'), r.get('t'), r.get('box'), 'covered', r.get('coveredShare'), 'offscreen' if r.get('offscreen') else '')
bad = [r for r in out if isinstance(r.get('coveredShare'), float) and r['coveredShare'] > 0.05]
print('SUMMARY chips', len(out), 'over5pct', len(bad), 'over25pct', sum(1 for r in bad if r['coveredShare'] > 0.25), [f"{r['tag']} {r['t']} {r['coveredShare']}" for r in bad])
json.dump(out, open(sys.argv[1].replace('.json', '-shares.json'), 'w'), indent=1)
