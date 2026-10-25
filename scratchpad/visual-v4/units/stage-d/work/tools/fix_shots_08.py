# Critique shot 08 again: cast 1's burst in the 2x clip (120 frames a second), every third frame from 181 (1308 ms) to 238
# (1783 ms), cropped on the burst, so the cross-fade and the 0.95 to 1.05 scale (fix 5) can be compared with the old holds.
#   python3 -I fix_shots_08.py CLIPDIR OUT.jpg
import io, json, os, subprocess, sys
from PIL import Image, ImageDraw
cl, out = sys.argv[1], sys.argv[2]
m = json.load(open(os.path.join(cl, 'fb1-2.json')))
fps, t0, ts = m['fps'], m['plan']['t0'], m['tStart']
# every frame of the range in one decode
r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', os.path.join(cl, 'fb1-2.webm'), '-vf', 'select=between(n\\,181\\,238)*not(mod(n-181\\,3))',
                    '-vsync', '0', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True, check=True)
data, ims, i = r.stdout, [], 0
while True:
    j = data.find(b'\x89PNG', i + 1)
    ims.append(Image.open(io.BytesIO(data[i:j if j > 0 else len(data)])).convert('RGB'))
    if j < 0: break
    i = j
box = (266, 106, 906, 506)  # wide enough for the fitted dome (fix 11)
cells = []
for k, im in enumerate(ims):
    n = 181 + 3 * k
    c = im.crop(box).resize((320, 200), Image.LANCZOS)
    d = ImageDraw.Draw(c); lab = f'frame {n} = {round((ts + n / fps - t0) * 1000)} ms'
    d.rectangle([0, 0, 8 + 7 * len(lab), 16], fill=(20, 18, 15)); d.text((4, 2), lab, fill=(255, 240, 200))
    cells.append(c)
cols = 5; rows = (len(cells) + cols - 1) // cols
G = Image.new('RGB', (cols * 324 - 4, rows * 204 - 4), (40, 36, 30))
for k, c in enumerate(cells): G.paste(c, ((k % cols) * 324, (k // cols) * 204))
G.save(out, quality=88)
print(out, len(cells))
