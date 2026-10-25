# Builds ../pilot/ad/formation-test-ad.html: the art director's version of the pilot's formation test
# (pilot-review.md). A copy of visual-v4/battle-mockup.html with, injected inline:
#   - the pilot's own atlases (tag 'old:'), as the owner saw them;
#   - ad_pack.py's atlases of the rim-fixed frames: 'paint:', 'sidekl:' (side-tinted keyline), 'normkl:' (cloth
#     normalisation plus the side keyline); the front view is the surcoat sheet (raw/ad/cw.front.rs.nb21), the Wolf
#     Rider the blue-key sheet (raw/ad/wr.front.blue.g3pro);
#   - the Salamander twice per view: with the slicer's anchor (the lowest pixel: the tail tip in the back view) and
#     with the maquette's ground anchor mapped into the cutout (bbox fit of guides.json box and anchor);
#   - Ash Chieftain 06 re-dressed onto the troop front sheet (atlas-cmd, tags 'cmdpaint:', 'cmdsidekl:');
#   - the Thornwood Warden front sheet (raw/ad/wd.front.g3pro), as painted (atlas-wd) and hue-locked (atlas-wdlock,
#     ad_huelock.py);
#   - ad_scene.js.
# Usage: python3 -I ad_page.py
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
V4 = os.path.abspath(os.path.join(ROOT, '..'))
sys.path.insert(0, HERE)
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402
from pilot_page import durl, atlas_pages, true_height_wu  # noqa: E402
from pack import premul_resize  # noqa: E402
from checks import keyline  # noqa: E402

REPO = '/home/user/Fluid-Magic-'
G = json.load(open(os.path.join(ROOT, 'refs', 'guides', 'guides.json')))


def maquette_anchor(png, view):
    """The maquette's ground anchor mapped into a cutout: the guide's box onto the cutout's alpha box."""
    g = G[f'salamander-01.idle.{view}']
    gx0, gy0, gx1, gy1 = g['box']
    ax, ay = g['anchor']
    a = np.asarray(Image.open(png).convert('RGBA'))[..., 3] > 90
    ys, xs = np.nonzero(a)
    fx0, fx1, fy0, fy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    return [float(fx0 + (ax - gx0) / (gx1 - gx0) * (fx1 - fx0)), float(fy0 + (ay - gy0) / (gy1 - gy0) * (fy1 - fy0))]


def creature(png, anchor, height_wu, tier):
    meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
    rgba = np.asarray(Image.open(png).convert('RGBA')).astype(np.float64)
    height_px = height_wu / (0.5 if tier == 'S' else 0.25)
    k = height_px / meta['height']
    s = premul_resize(rgba, k)
    for _ in range(1 if tier == 'S' else 2):
        s = keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
    pad = 1 if tier == 'S' else 2
    im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
    return dict(png=durl(im), anchor=[anchor[0] * k + pad, anchor[1] * k + pad])


def main():
    A = os.path.join(ROOT, 'pilot', 'atlas')
    AD = os.path.join(ROOT, 'pilot', 'ad', 'atlas')
    W = os.path.join(ROOT, 'pilot', 'work')
    F = os.path.join(ROOT, 'pilot', 'ad', 'frames')
    wu = {v: true_height_wu('salamander-01', v, 'idle') for v in ('back', 'front')}
    sal_src = {
        'backOld': (f'{W}/r2/sal.back.nb21/frames/salamander-01.back.idle.png', 'back', 'slice'),
        'backFix': (f'{F}/salamander-01.back/salamander-01.back.idle.png', 'back', 'maquette'),
        'frontOld': (f'{W}/r1/sal.front.nb21/frames/salamander-01.front.idle.png', 'front', 'slice'),
        'frontFix': (f'{F}/salamander-01.front/salamander-01.front.idle.png', 'front', 'maquette'),
    }
    anchors = {}
    sal = {'S': {}, 'H': {}}
    for key, (png, view, how) in sal_src.items():
        meta = json.load(open(png.rsplit('.', 1)[0] + '.json'))
        anc = meta['anchor'] if how == 'slice' else maquette_anchor(png, view)
        anchors[key] = dict(anchor=[round(anc[0], 1), round(anc[1], 1)], size=[meta['width'], meta['height']], how=how)
        for t in ('S', 'H'):
            sal[t][key] = creature(png, anc, wu[view], t)
    print('Salamander anchors (frame px):', json.dumps(anchors))
    atlas = {}
    for t in ('S', 'H'):
        atlas[t] = atlas_pages(f'{A}/pilot{t}', 'old:')
        for mode in ('paint', 'sidekl', 'normkl'):
            atlas[t] += atlas_pages(f'{AD}/ad{mode}{t}', mode + ':')
            # Ash Chieftain 06, re-dressed by Nano Banana 2.1 onto the camera-correct troop sheet (frames named as
            # cinderWarrior.front.* because it keeps the troop sheet's layout)
            atlas[t] += atlas_pages(f'{AD}-cmd/ad{mode}{t}', 'cmd' + mode + ':')
            # the Thornwood Warden, front view (battle c's far side): the Pro sheet as painted, and hue-locked
            atlas[t] += atlas_pages(f'{AD}-wd/ad{mode}{t}', 'wd' + mode + ':')
            atlas[t] += atlas_pages(f'{AD}-wdlock/ad{mode}{t}', 'wdl' + mode + ':')
    data = dict(atlas=atlas, salamander=sal, salamanderWu=wu, anchors=anchors,
                portrait=durl(f'{REPO}/src/assets/raster/portraits/cinderHorde/salamander/01.webp'),
                portraitChief=durl(f'{REPO}/src/assets/raster/portraits/cinderHorde/ashChieftain/06.webp'))
    page = open(os.path.join(V4, 'battle-mockup.html')).read()
    blob = json.dumps(data).replace('</', '<\\/')
    inject = (f'<script id="ad-data" type="application/json">{blob}</script>\n'
              f'<script>{open(os.path.join(HERE, "ad_scene.js")).read()}</script>\n')
    i = page.rindex('</body>')
    page = page[:i] + inject + page[i:]
    page = page.replace('<title>', '<title>Art director test · ', 1)
    out = os.path.join(ROOT, 'pilot', 'ad', 'formation-test-ad.html')
    open(out, 'w').write(page)
    json.dump(anchors, open(os.path.join(ROOT, 'pilot', 'ad', 'salamander-anchors.json'), 'w'), indent=1)
    print(out, len(page), 'bytes')


if __name__ == '__main__':
    main()
