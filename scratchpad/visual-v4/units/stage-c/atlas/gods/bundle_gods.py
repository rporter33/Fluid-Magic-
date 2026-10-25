# Stage C gods: the battle mockup's bundling step for the painted god bodies. Reads gods.json beside this file and returns,
# per figure, exactly the structure stage-b/integrate/bundle.py builds for the Salamander (`sal`), so integration is:
#     sys.path.insert(0, '<units>/stage-c/atlas/gods'); from bundle_gods import gods_bundle
#     data['gods'] = gods_bundle(durl_webp, ['greatWyrm-thornwood'])          # inside bundle.py main()
# and the page's loader reads data.gods[fig][view][tier] as it reads data.salamander['01'][view][tier]:
#     {heightWu, S|H: {url, w, h, ax, ay, shadow: {url, w, h, ax, ay}, mouth?}}, plus portraitHash (hash32 of the god's
#     approved 64 px card data URL, as bundle.py hashes the Salamander's) and the figure's identity for the hover card.
# The tiers are already made (premultiplied downscale, keyline, silhouette shadow) by stage-c/work/gods/tools/gd_pack.py
# with the bundler's own functions, so this only encodes them.
# Usage (stand-alone check): python3 -I bundle_gods.py [figure ...]   -> writes paint-gods.json and prints the sizes
import base64, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
WEBP = dict(quality=90, alpha_quality=100, method=6)


def hash32(s):
    """The mockup's hash32 (00-util.js), as bundle.py has it."""
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xffffffff
    h ^= h >> 16; h = (h * 0x85ebca6b) & 0xffffffff
    h ^= h >> 13; h = (h * 0xc2b2ae35) & 0xffffffff
    h ^= h >> 16
    return h


def _durl_webp(im, **kw):
    b = io.BytesIO(); im.save(b, 'WEBP', **{**WEBP, **kw})
    return 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode(), len(b.getvalue())


def gods_bundle(durl_webp=None, figures=None, report=None):
    durl_webp = durl_webp or _durl_webp
    man = json.load(open(os.path.join(HERE, 'gods.json')))
    out = {}
    for fig, f in man['figures'].items():
        if figures and fig not in figures:
            continue
        rec = {}
        for v, x in f['views'].items():
            rec[v] = dict(heightWu=x['heightWu'])
            for t, tr in x['tiers'].items():
                im = Image.open(os.path.join(HERE, tr['file'])).convert('RGBA')
                sh = Image.open(os.path.join(HERE, tr['shadow']['file'])).convert('RGBA')
                url, n1 = durl_webp(im)
                surl, n2 = durl_webp(sh, quality=60)
                if report is not None:
                    report.append(dict(kind=f'god-{fig}-{v}', tier=t, size=im.size, webpBytes=n1 + n2))
                d = dict(url=url, w=tr['w'], h=tr['h'], ax=tr['ax'], ay=tr['ay'],
                         shadow=dict(url=surl, w=tr['shadow']['w'], h=tr['shadow']['h'], ax=tr['shadow']['ax'], ay=tr['shadow']['ay']))
                if 'mouth' in tr:
                    d['mouth'] = tr['mouth']
                rec[v][t] = d
        card = os.path.join(UNITS, f['portrait']['file'].replace('.webp', '-64.webp'))
        rec['portraitHash'] = hash32('data:image/webp;base64,' + base64.b64encode(open(card, 'rb').read()).decode()) if os.path.exists(card) else None
        rec['god'] = f['god']; rec['nation'] = f['nation']; rec['sizeClass'] = f['sizeClass']
        out[fig] = rec
    return out


if __name__ == '__main__':
    figs = sys.argv[1:] or None
    rep = []
    data = gods_bundle(None, figs, rep)
    s = json.dumps(data, separators=(',', ':'))
    open(os.path.join(HERE, 'paint-gods.json'), 'w').write(s)
    tot = sum(r['webpBytes'] for r in rep)
    print('paint-gods.json', len(s), 'bytes json;', tot, 'bytes webp;', len(data), 'figures')
    for r in rep:
        print(' ', r['kind'], r['tier'], r['size'], r['webpBytes'])
