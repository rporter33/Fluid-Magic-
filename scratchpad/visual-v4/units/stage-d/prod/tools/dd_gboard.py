# Contact boards of the guides per body (back row over front row), for the art director's look at the poses.
import json, os, sys
from PIL import Image, ImageDraw
D = sys.argv[1]; OUT = sys.argv[2]; bodies = sys.argv[3:]
jobs = json.load(open(os.path.join(os.path.dirname(D.rstrip('/')), 'jobs', 'guides.json')))
for b in bodies:
    rows = []
    for v in ('back', 'front'):
        ids = [j['id'] for j in jobs if j['body'] == b and j['view'] == v]
        ids.sort(key=lambda i: (0 if '.idle.' in i else 1, i))
        rows.append(ids)
    H = 300
    ims = [[Image.open(os.path.join(D, i + '.png')).convert('RGB') for i in r] for r in rows]
    W = max(sum(int(im.width * H / im.height) + 6 for im in r) for r in ims)
    board = Image.new('RGB', (W, 2 * (H + 6)), (40, 40, 40))
    for y, r in enumerate(ims):
        x = 0
        for im in r:
            t = im.resize((int(im.width * H / im.height), H))
            board.paste(t, (x, y * (H + 6))); x += t.width + 6
    board.save(os.path.join(OUT, f'guides-{b}.png'))
    print(b, board.size)
