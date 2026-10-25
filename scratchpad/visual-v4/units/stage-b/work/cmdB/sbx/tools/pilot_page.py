# Builds ../pilot/formation-test.html: a copy of visual-v4/battle-mockup.html with the pilot's painted atlases, the
# Salamander cutouts, its card portrait and pilot_scene.js injected (everything inline, so it opens from file://).
# Usage: python3 pilot_page.py
import base64, io, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
V4 = os.path.abspath(os.path.join(ROOT, '..'))
sys.path.insert(0, HERE)
from pack import premul_resize  # noqa: E402
from checks import keyline  # noqa: E402

PICKS = json.load(open(os.path.join(ROOT, 'pilot', 'picks.json')))
REPO = '/home/user/Fluid-Magic-'


def durl(path_or_img, fmt='PNG'):
    if isinstance(path_or_img, str):
        ext = path_or_img.rsplit('.', 1)[1]
        return f'data:image/{ext};base64,' + base64.b64encode(open(path_or_img, 'rb').read()).decode()
    b = io.BytesIO(); path_or_img.save(b, fmt)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()


def atlas_pages(prefix, tag=''):
    pages, i = [], 0
    while os.path.exists(f'{prefix}.{i}.json'):
        j = json.load(open(f'{prefix}.{i}.json'))
        frames = {tag + k: v for k, v in j['frames'].items()}
        pages.append(dict(png=durl(f'{prefix}.{i}.png'), frames=frames))
        i += 1
    return pages


def creature(path, height_px, tier):
    """A big-body cutout at its tier height (size 3: 129 px at tier S, 258 at tier H), with the design's keyline."""
    meta = json.load(open(path.rsplit('.', 1)[0] + '.json'))
    rgba = np.asarray(Image.open(path).convert('RGBA')).astype(np.float64)
    k = height_px / meta['height']
    s = premul_resize(rgba, k)
    for _ in range(1 if tier == 'S' else 2):
        s = keyline(np.pad(s, ((1, 1), (1, 1), (0, 0))))
    pad = 1 if tier == 'S' else 2
    im = Image.fromarray(np.clip(s, 0, 255).astype(np.uint8), 'RGBA')
    return dict(png=durl(im), anchor=[meta['anchor'][0] * k + pad, meta['anchor'][1] * k + pad])


def true_height_wu(fig, view, action=None):
    """A body's on-screen box height in world units at its true size: the maquette guides are rendered at known
    rig scales (guides.json k, rig units per px), and a man's guide body height is 28 wu (design 3.1)."""
    from pack import body_height
    from checks import guide_cells
    G = json.load(open(os.path.join(ROOT, 'refs', 'guides', 'guides.json')))
    man = guide_cells(os.path.join(ROOT, 'refs', 'guides', 'cinderWarrior.back.png'), 'cinderWarrior', 'back')['stand']
    wu_per_rig = 28 / (body_height(man['mask']) * G['cinderWarrior.back']['k'])
    g = G[f'{fig}.{action}.{view}' if action else f'{fig}.{view}']
    return (g['box'][3] - g['box'][1]) * g['k'] * wu_per_rig


def main():
    A = os.path.join(ROOT, 'pilot', 'atlas')
    SAL_WU = {v: true_height_wu('salamander-01', v, 'idle') for v in ('back', 'front')}
    print('Salamander true box heights (wu):', {k: round(v, 1) for k, v in SAL_WU.items()})
    data = dict(atlas={t: atlas_pages(f'{A}/pilot{t}') + atlas_pages(f'{A}/pilotBoost{t}', 'boost:') for t in ('S', 'H')},
                salamander={t: {v: creature(PICKS['salamander'][v], SAL_WU[v] / (0.5 if t == 'S' else 0.25), t)
                                    for v in ('back', 'front')} for t in ('S', 'H')},
                salamanderWu=SAL_WU,
                portrait=durl(f'{REPO}/src/assets/raster/portraits/cinderHorde/salamander/01.webp'))
    page = open(os.path.join(V4, 'battle-mockup.html')).read()
    blob = json.dumps(data).replace('</', '<\\/')
    inject = (f'<script id="pilot-data" type="application/json">{blob}</script>\n'
              f'<script>{open(os.path.join(HERE, "pilot_scene.js")).read()}</script>\n')
    i = page.rindex('</body>')
    page = page[:i] + inject + page[i:]
    page = page.replace('<title>', '<title>Pilot formation test · ', 1)
    out = os.path.join(ROOT, 'pilot', 'formation-test.html')
    open(out, 'w').write(page)
    print(out, len(page), 'bytes')


if __name__ == '__main__':
    main()
