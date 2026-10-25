# Stage B troops: card busts into the portrait set's format (src/assets/raster/portraits/README.md): bust-512.webp (master),
# bust.webp (256 px, at most 24 KB), bust-64.webp (at most 4 KB) and bust.json (provenance as the leader portraits' sidecars,
# plus the checks; approval empty until the owner's review), under stage-b/portraits/<nation>/<unit>/.
# Checks (automatic part; the art director judges the face and the kit by eye):
#   background - the border's median within dE2000 10 of the portraits' #1C1A17;
#   framing    - the top of the subject 3 to 16% from the top edge (the template: 9%);
#   side       - nations: the side's cloth hue on at least 6% of the lower half (shoulders, surcoat); independents: at most
#                2% in either nation's window;
#   kit        - the median colour of the bust's side cloth within dE2000 18 of the figure's cloth (its tier H stand frame).
# Usage: python3 tr_busts.py RAW.png FIGURE [--kept]
import hashlib, io, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools'))
from v4color import to_lab, oklch  # noqa: E402
from pilot_metrics import de2000  # noqa: E402
import pack  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..', '..'))
B = os.path.abspath(os.path.join(W, '..', '..'))
OUT = os.path.join(B, 'portraits')
CLOTH = {'cinderHorde': '#C4532C', 'thornwood': '#1F6A50'}


def mask_hue(rgb, hexc):
    hx = np.array([[[int(hexc[i:i + 2], 16) for i in (1, 3, 5)]]], np.float64)
    _, cc, ch = oklch(hx)
    _, C, h = oklch(rgb)
    dh = np.abs((h - float(ch[0, 0]) + 180) % 360 - 180)
    return (dh <= 20) & (C >= max(0.04, 0.45 * float(cc[0, 0])))


def webp_under(im, size, limit):
    im = im.resize((size, size), Image.LANCZOS)
    for q in (90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40):
        b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6)
        if b.tell() <= limit:
            return b.getvalue(), q
    return b.getvalue(), q


def main(raw, fig, kept=False):
    u = next(x for x in pack.UNITS['units'] if x['id'] == fig)
    nat = u['nation']
    im = Image.open(raw).convert('RGB')
    a = np.asarray(im.resize((512, 512), Image.LANCZOS)).astype(np.float64)
    border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bl = to_lab(np.median(border, 0)[None, None])[0, 0]
    ref = to_lab(np.array([[[28, 26, 23]]], np.float64))[0, 0]
    lab = to_lab(a)
    subj = np.abs(lab[..., 0] - bl[0]) > 12
    rows = np.nonzero(subj[:, 64:448].mean(1) > 0.04)[0]
    top = float(rows.min() / 512) if rows.size else 1.0
    lower = a[256:]
    ck = dict(background=round(de2000(bl, ref), 1), top=round(top, 3))
    if nat == 'independent':
        fo = {n: round(float(mask_hue(lower, c).mean()), 3) for n, c in CLOTH.items()}
        ck['foreign'] = fo
        side_ok = max(fo.values()) <= 0.02
        ck['kit'] = None; kit_ok = True
    else:
        m = mask_hue(lower, CLOTH[nat])
        ck['side'] = round(float(m.mean()), 3)
        side_ok = ck['side'] >= 0.06
        picks = json.load(open(os.path.join(W, 'picks.json')))
        st = np.asarray(Image.open(os.path.join(picks[fig]['front']['dir'], 'frames', f'{fig}.front.stand.png')).convert('RGBA')).astype(np.float64)
        fm = mask_hue(st[..., :3], CLOTH[nat]) & (st[..., 3] > 200)
        if m.any() and fm.any():
            d = de2000(np.median(to_lab(lower)[m], 0), np.median(to_lab(st[..., :3])[fm], 0))
            ck['kit'] = round(d, 1); kit_ok = d < 18
        else:
            ck['kit'] = None; kit_ok = False
    ck['pass'] = bool(ck['background'] <= 10 and 0.03 <= top <= 0.16 and side_ok and kit_ok)
    d = os.path.join(OUT, nat, fig)
    os.makedirs(d, exist_ok=True)
    m512, q512 = webp_under(im, 512, 200_000)
    m256, q256 = webp_under(im, 256, 24_000)
    m64, q64 = webp_under(im, 64, 4_000)
    open(os.path.join(d, 'bust-512.webp'), 'wb').write(m512)
    open(os.path.join(d, 'bust.webp'), 'wb').write(m256)
    open(os.path.join(d, 'bust-64.webp'), 'wb').write(m64)
    side = json.load(open(raw.rsplit('.', 1)[0] + '.json'))
    meta = dict(id=f'bust-{fig}', unit=fig, nation=nat, kind='troop card bust (plan 5.4)',
                files=dict(game='bust.webp', small='bust-64.webp', master='bust-512.webp'),
                bytes=dict(game=len(m256), small=len(m64), master=len(m512)),
                sourceFile=os.path.relpath(raw, os.path.dirname(B)), sourceSha256=hashlib.sha256(open(raw, 'rb').read()).hexdigest(),
                tool='Gemini API (network secret)', model=side.get('model'), date=side.get('date'), prompt=side.get('prompt'),
                references=side.get('referencePaths') or side.get('references'),
                kitReference=(os.path.join(W, 'kitcards', f'{fig}.kit.png') if not kept else None),
                note=('the pilot\'s Warden bust, kept by the owner ("Card bust: Keep"); made before the Warden sheet existed' if kept else None),
                checks=ck, approved=({'by': 'project owner', 'date': '2026-10-23', 'pick': 'pilot verdict: Card bust: Keep'} if kept else None))
    json.dump(meta, open(os.path.join(d, 'bust.json'), 'w'), indent=1)
    print(fig, json.dumps(ck))


if __name__ == '__main__':
    a = sys.argv[1:]
    main(a[0], a[1], kept='--kept' in a)
