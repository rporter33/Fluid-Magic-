import json
from PIL import Image
pts = json.load(open('colvpts.json'))
res = {}
for variant, bk in pts.items():
    for k, arr in bk.items():
        im = Image.open(f'shots/colv-{variant}-{k}.png').convert('RGB'); W, H = im.size; px = im.load()
        acc = {'near': [], 'far': []}
        for side, x, y, z in arr:
            r = max(1, int(3 * z))
            for dx in range(-r, r + 1):
                for dy in range(-2 * r, r + 1):
                    X, Y = x + dx, y + dy
                    if 0 <= X < W and 0 <= Y < H: acc[side].append(px[X, Y])
        res[variant + '-' + k] = {s: '#%02x%02x%02x' % tuple(sorted(c[i] for c in v)[len(v)//2] for i in range(3)) for s, v in acc.items()}
json.dump(res, open('colv.json', 'w')); print(res)
