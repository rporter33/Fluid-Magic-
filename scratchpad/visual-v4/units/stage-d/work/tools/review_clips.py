# Every beat of a recorded clip at play zoom and at 2x, side by side, for looking at: python3 -I review_clips.py CLIP OUT.png
# (CLIP is the clip id, e.g. fb1; the frames come from work/clips/CLIP-1.webm and CLIP-2.webm, or the folder in $CLIPS)
import io, json, os, subprocess, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.abspath(os.path.join(HERE, '..'))
cid, out = sys.argv[1], sys.argv[2]
CL = os.environ.get('CLIPS') or os.path.join(WORK, 'clips')


def frame(path, t):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', f'{max(0, t):.4f}', '-i', path, '-frames:v', '1', '-f', 'image2pipe', '-c:v', 'png', '-'], capture_output=True, check=True)
    return Image.open(io.BytesIO(r.stdout)).convert('RGB')


m = json.load(open(os.path.join(CL, f'{cid}-1.json')))
b, ts = m['plan']['beats'], m['tStart']
if m['from'] > 3:
    t1 = m['plan']['held'][0]['t1']
    times = [('hold', t1 - 0.3), ('wither 0.1', t1 + 0.1), ('wither 0.3', t1 + 0.3), ('wither 0.5', t1 + 0.5), ('wither end', t1 + 0.65), ('scar', t1 + 1.2)]
else:
    L = lambda k, q: b[k][0] + (b[k][1] - b[k][0]) * q
    times = [('charge start', L('charge', 0.05)), ('charge mid', L('charge', 0.5)), ('charge end', L('charge', 0.95)), ('release', L('release', 0.5)),
             ('travel early', L('travel', 0.25)), ('travel mid', L('travel', 0.5)), ('travel late', L('travel', 0.85)), ('impact core', b['impact'][0] + 0.012),
             ('impact mid', L('impact', 0.5)), ('impact end', L('impact', 0.93)), ('linger early', b['linger'][0] + 0.1), ('linger end', b['linger'][1]),
             ('after 0.5 s', b['linger'][1] + 0.5)]
rows = []
tEnd = ts + (m['to'] - m['from']) - 0.03
for name, t in times:
    t = min(t, tEnd)
    zs = [z for z in (1, 2) if os.path.getsize(os.path.join(CL, f'{cid}-{z}.webm')) > 0] if os.environ.get('ANYZ') else (1, 2)
    ims = [frame(os.path.join(CL, f'{cid}-{z}.webm'), t - ts) for z in zs]
    W = int(os.environ.get('RW') or 560)
    ims = [im.resize((W, round(im.height * W / im.width)), Image.LANCZOS) for im in ims]
    row = Image.new('RGB', ((W + 6) * len(ims) - 6, ims[0].height), (0, 0, 0))
    for i, im in enumerate(ims): row.paste(im, ((W + 6) * i, 0))
    d = ImageDraw.Draw(row)
    lab = f"{name}  {round((t - m['plan']['t0']) * 1000)} ms"
    d.rectangle([0, 0, 8 + 7 * len(lab), 16], fill=(20, 20, 20)); d.text((4, 2), lab, fill=(255, 255, 255))
    rows.append(row)
H = sum(r.height + 4 for r in rows)
sheet = Image.new('RGB', (rows[0].width, H), (0, 0, 0))
y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height + 4
sheet.save(out)
print(out, sheet.size)
