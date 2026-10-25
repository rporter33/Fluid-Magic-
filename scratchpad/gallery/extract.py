# Pulls the approved art out of the review pages and renders clean stage D action strips; writes items.json.
import re, html, json, os, glob, base64, io
from PIL import Image, ImageDraw, ImageFont
G = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/gallery'
U = '/tmp/claude-0/-home-user-Fluid-Magic-/1ae2f9cd-f592-5f18-abd3-80de7f069d69/scratchpad/visual-v4/units'
items = []

def walk(path):
    h = open(path, encoding='utf-8').read()
    toks = [(m.start(), 'h2', m.group(1)) for m in re.finditer(r'<h2[^>]*>(.*?)</h2>', h, re.S)]
    toks += [(m.start(), 'h3', m.group(1)) for m in re.finditer(r'<h3[^>]*>(.*?)</h3>', h, re.S)]
    toks += [(m.start(), 'img', m.group(0)) for m in re.finditer(r'<img\b[^>]*>', h)]
    toks.sort()
    h2 = h3 = ''
    for _, k, v in toks:
        txt = html.unescape(re.sub(r'<[^>]+>', ' ', v)).strip() if k != 'img' else ''
        txt = re.sub(r'\s+', ' ', txt)
        if k == 'h2': h2, h3 = txt, ''
        elif k == 'h3': h3 = txt
        else:
            src = re.search(r'src="([^"]+)"', v); alt = re.search(r'alt="([^"]*)"', v)
            w = re.search(r'width="(\d+)"', v); hh = re.search(r'height="(\d+)"', v)
            if not src or not src.group(1).startswith('data:image'): continue
            yield dict(h2=h2, h3=h3, alt=html.unescape(alt.group(1)) if alt else '', src=src.group(1),
                       w=int(w.group(1)) if w else 0, h=int(hh.group(1)) if hh else 0)

def subject(alt):
    s = re.split(r'[:,]', alt, 1)[0].strip()
    return re.sub(r'\s+(now|before)$', '', s)

def caption(alt, subj):
    c = alt[len(subj):].lstrip(' :,') if alt.startswith(subj) else alt
    c = re.sub(r'^now,?\s*', '', c)
    return c.replace('your approved', 'approved').replace('Your approved', 'Approved').strip() or alt

def add(sec, group, subj, cap, src, w, h, kind='inline'):
    items.append(dict(sec=sec, group=group, subj=subj, cap=cap, src=src, w=w, h=h, kind=kind))

# stage C review: creatures, mounts and gods with their approved portraits
for it in walk(f'{U}/stage-c/review.html'):
    if it['h2'] not in ('Creatures and mounts', 'Gods'): continue
    sec = 'gods' if it['h2'] == 'Gods' else 'creatures'
    s = subject(it['alt']); add(sec, it['h3'], s, caption(it['alt'], s), it['src'], it['w'], it['h'])
# stage B review: troops and commanders (current figures only)
for it in walk(f'{U}/stage-b/review.html'):
    if it['h2'] == 'Troops' and it['h3'] == 'The gallery':
        s = subject(it['alt']); add('troops', '', s, caption(it['alt'], s), it['src'], it['w'], it['h'])
    elif it['h2'] == 'Commanders' and it['h3'] and ' before' not in it['alt'] and 'Own weapons' not in it['h3']:
        s = subject(it['alt']); add('commanders', it['h3'], s, caption(it['alt'], s), it['src'], it['w'], it['h'])
# the magic pilot's stills
for it in walk(f'{U}/stage-d/pilot/pilot.html'):
    a = it['alt']
    if not a or a.lower().startswith('before') or 'without the firelight' in a or it['w'] < 200: continue
    add('magic', it['h2'] or 'Fireball and Entangle', it['h3'] or it['h2'], a, it['src'], it['w'], it['h'])

# stage D action strips, from the tier H pages (one wu scale), labelled under each frame
A = f'{U}/stage-d/atlas/actions'
idx = json.load(open(f'{A}/index.json'))
frames = {}
for j in glob.glob(f'{A}/*-H.*.json'):
    d = json.load(open(j))
    for n, f in d['frames'].items(): frames[n] = (os.path.join(A, d['meta']['image']), f)
pages = {}
def page(p):
    if p not in pages: pages[p] = Image.open(p).convert('RGBA')
    return pages[p]
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
ORDER = ['idle', 'glide', 'stepA', 'stepB', 'windup', 'castA', 'castB', 'cast', 'strike', 'follow', 'sweep', 'call', 'breath', 'bite',
         'tailLash', 'rake', 'leap', 'slam', 'trample', 'flight', 'wingsUp', 'wingsDown', 'pulse', 'hit', 'fall', 'dead', 'burnOut',
         'dissolving', 'shattered']
LABEL = {'stepA': 'step', 'stepB': 'step', 'windup': 'wind-up', 'castA': 'cast', 'castB': 'cast', 'tailLash': 'tail lash',
         'wingsUp': 'wings up', 'wingsDown': 'wings down', 'burnOut': 'burn-out', 'follow': 'follow-through'}
NAMES = json.load(open(f'{G}/names.json'))
def strip(fig, view, acts):
    got = []
    for a in acts:
        k = f'{fig}.{view}.{a}'
        if k in frames:
            p, f = frames[k]; r = f['frame']
            im = page(p).crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
            got.append((a, im, f['anchor']['y'] * r['h']))
    if not got: return None
    up = max(ay for _, _, ay in got); down = max(im.height - ay for _, im, ay in got)
    gap, lab = 40, 46
    W = sum(im.width for _, im, _ in got) + gap * (len(got) + 1); H = int(up + down) + lab + 30
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(out); x = gap
    for a, im, ay in got:
        out.alpha_composite(im, (x, int(up - ay) + 10))
        t = LABEL.get(a, a); tw = d.textlength(t, font=font)
        d.text((x + (im.width - tw) / 2, H - lab + 6), t, font=font, fill=(236, 228, 210, 255), stroke_width=3, stroke_fill=(28, 26, 23, 255))
        x += im.width + gap
    k = min(1.0, 900 / out.height, 4000 / out.width)
    if k < 1: out = out.resize((round(out.width * k), round(out.height * k)), Image.LANCZOS)
    name = f'act-{fig}-{view}.webp'
    out.save(f'{G}/img/{name}', 'WEBP', quality=86, alpha_quality=90, method=6)
    return name, out.width, out.height, [a for a, _, _ in got]
for fig, m in idx['figures'].items():
    meta = json.load(open(f'{A}/figures/{fig}.json')) if os.path.exists(f'{A}/figures/{fig}.json') else {}
    held = meta.get('heldBack') or {}
    nm = NAMES.get(fig, fig)
    for view in ('front', 'back'):
        acts = sorted(m['views'].get(view, []), key=lambda a: ORDER.index(a) if a in ORDER else 99)
        r = strip(fig, view, acts)
        if not r: continue
        name, w, h, got = r
        heldv = [k for k in held if f'.{view}.' in k or k.startswith(view)]
        cap = ('from the front' if view == 'front' else 'from behind')
        add('actions', m['family'], nm, cap, 'img/' + name, w, h, kind='file')
        items[-1]['held'] = held if view == 'front' else {}
json.dump(items, open(f'{G}/items.json', 'w'))
from collections import Counter
print(Counter(i['sec'] for i in items)); print('inline MB', round(sum(len(i['src']) for i in items if i['kind'] == 'inline') / 1e6, 2))
print('files', len(glob.glob(f'{G}/img/*')), 'MB', round(sum(os.path.getsize(p) for p in glob.glob(f'{G}/img/*')) / 1e6, 1))
