import json, sys
from PIL import Image
pts = json.load(open('colpts.json'))
res = {}
for k, arr in pts.items():
    im = Image.open(f'shots/col-{k}.png').convert('RGB'); W, H = im.size
    px = im.load()
    acc = {'near': [], 'far': []}
    for side, x, y, z in arr:
        r = max(1, int(3 * z))
        for dx in range(-r, r + 1):
            for dy in range(-2 * r, r + 1):
                X, Y = x + dx, y + dy
                if 0 <= X < W and 0 <= Y < H: acc[side].append(px[X, Y])
    med = {}
    for s, v in acc.items():
        v = sorted(v, key=lambda c: 0.2126*c[0]+0.7152*c[1]+0.0722*c[2])
        m = v[len(v)//2]
        # per channel median
        med[s] = '#%02x%02x%02x' % tuple(sorted(c[i] for c in v)[len(v)//2] for i in range(3))
    res[k] = med
print(json.dumps(res))
