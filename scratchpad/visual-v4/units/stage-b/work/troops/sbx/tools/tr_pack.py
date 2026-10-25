# Stage B troops: the troop atlases, one set per side (Cinder, Thornwood, independents), from the picked sheets' rim-fixed
# and hue-locked frames (picks.json):
#   tier S (a man 56 px): the keyline in the side's dark cloth shade at 75% (review change 14: Cinder #7E3118, Thornwood
#          #113F2F; independents #4A4A44, docs/09's independent dark);
#   tier H (a man 112 px): the design's neutral keyline #1C1A17 at 60%;
#   white stand and recoil silhouettes for the hit flash; mirrored views are not stored.
# Beside each page: <prefix>.var.json, the per-frame data the variation shader's shared stencils need (calibration part 5:
# the shield face as an ellipse on front views, the top of the body under a raised weapon, the foot anchor), and per
# figure figures/<id>.json (frames by pose, scale, cloth, key, the generation file and its sha256, the checks and the
# gate status; approval empty until the owner's review).
# Usage: python3 tr_pack.py OUT_DIR
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pack  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline  # noqa: E402
from cal_var_build import shield  # noqa: E402

W = os.path.abspath(os.path.join(HERE, '..', '..'))
SHADE = {'cinderHorde': '#7E3118', 'thornwood': '#113F2F', 'independent': '#4A4A44'}
GROUPS = {'cinderHorde': ['ashMilitia', 'cinderWarrior', 'emberSkirmisher', 'flameArcher', 'berserker', 'flamebrand'],
          'thornwood': ['thornMilitia', 'warden', 'longbowHunter', 'briarGuard'],
          'independent': ['lightInfantry', 'heavyInfantry', 'archer', 'swampFighter']}
NEUTRAL = checks.keyline


def body_top(img):
    a = img[..., 3] > 128
    ys, _ = np.nonzero(a)
    if not ys.size:
        return 0
    h = ys.max() - ys.min() + 1
    r = max(3, (int(0.05 * h) // 2) * 2 + 1)
    o = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))) > 127
    return int(np.nonzero(o)[0].min()) if o.any() else int(ys.min())


def main(out):
    picks = json.load(open(os.path.join(W, 'picks.json')))
    os.makedirs(os.path.join(out, 'figures'), exist_ok=True)
    summary = {}
    figinfo = {}
    for nat, figs in GROUPS.items():
        cloth = pack.UNITS['nations'][nat]['cloth']['hex']
        for tier in ('S', 'H'):
            pack.keyline = tinted_keyline(SHADE[nat]) if tier == 'S' else NEUTRAL
            items, infos = [], []
            for fig in figs:
                for view in ('back', 'front'):
                    p = picks[fig][view]
                    fr, info = pack.frames_of(os.path.join(p['dir'], 'frames'), fig, view, tier)
                    items += fr; infos.append(info)
                    figinfo.setdefault(fig, {}).setdefault(view, {})[tier] = dict(scale=info['scale'], standPx=info['standPx'],
                                                                                   frames=[n for n, _, _ in fr])
            pack.keyline = NEUTRAL
            pages, placed = pack.pack(items)
            imgs = {n: im for n, im, _ in items}
            prefix = os.path.join(out, f'troops-{nat}-{tier}')
            for i, pg in enumerate(pages):
                rows = np.nonzero(pg[..., 3].max(1) > 0)[0]
                h = 1 << (int(rows.max() + 1) - 1).bit_length()
                Image.fromarray(np.clip(pg[:h], 0, 255).astype(np.uint8), 'RGBA').save(f'{prefix}.{i}.png')
                sheet = dict(frames={n: {k: v for k, v in d.items() if k != 'page'} for n, d in placed.items() if d['page'] == i},
                             meta=dict(image=os.path.basename(f'{prefix}.{i}.png'), size=dict(w=pack.PAGE, h=h), scale=1, tier=tier,
                                       keyline=('side ' + SHADE[nat] + ' 75%') if tier == 'S' else 'neutral #1C1A17 60%',
                                       app='stage-b/work/troops/sbx/tools/tr_pack.py'))
                json.dump(sheet, open(f'{prefix}.{i}.json', 'w'), indent=1)
            var = {}
            for n, d in placed.items():
                if n.endswith('.white'):
                    continue
                img = imgs[n]
                top = body_top(img)
                Hh, Wd = img.shape[:2]
                fu = next(x for x in pack.UNITS['units'] if x['id'] == n.split('.')[0])
                has_shield = bool((fu.get('gear') or {}).get('shield'))  # only a unit that carries a shield gets a shield stencil
                sh = shield(img, cloth, top) if '.front.' in n and nat != 'independent' and has_shield else None
                var[n] = dict(page=d['page'], body=[round(top / Hh, 4), d['anchor']['y']],
                              shield=[round(sh[0] / Wd, 4), round(sh[1] / Hh, 4), round(sh[2] / Wd, 4), round(sh[3] / Hh, 4)] if sh else None)
            json.dump(dict(cloth=cloth, nation=nat, tier=tier, frames=var), open(f'{prefix}.var.json', 'w'), indent=1)
            summary[f'{nat}.{tier}'] = dict(frames=len(placed), pages=len(pages),
                                            shields=sum(1 for v in var.values() if v['shield']),
                                            frontFrames=sum(1 for k in var if '.front.' in k))
    for fig, views in figinfo.items():
        u = next(x for x in pack.UNITS['units'] if x['id'] == fig)
        meta = dict(figure=fig, unit=u['unit'], nation=u['nation'], key=u['key'], cloth=pack.UNITS['nations'][u['nation']]['cloth']['hex'],
                    hueLocked=u['nation'] == 'thornwood', kit=u['kit'], views={})
        for view, tiers in views.items():
            p = picks[fig][view]
            r = json.load(open(os.path.join(p['dir'], 'checks.json')))
            sc = p['sheet'].rsplit('.', 1)[0] + '.json'
            side = json.load(open(sc)) if os.path.exists(sc) else {}
            meta['views'][view] = dict(
                atlas={t: dict(prefix=f'troops-{u["nation"]}-{t}', **v) for t, v in tiers.items()},
                sheet=os.path.relpath(p['sheet'], os.path.join(W, '..', '..', '..')),
                sha256=hashlib.sha256(open(p['sheet'], 'rb').read()).hexdigest(), model=side.get('model'),
                job=side.get('job'), references=side.get('referencePaths') or side.get('references'),
                status=p['status'], failedGates=p['failed'],
                checks=dict(cameraAll=r['cameraAll']['follow'], cells={k: v for k, v in r['cameraAll']['cells'].items()},
                            variety=r['variety'], scale=r['scaleBody'], consistency={k: v for k, v in r['consistency'].items() if k != 'lying'},
                            rim=r['rim'], side=r['side'], fringe=r['fringe']))
        meta['approved'] = None
        json.dump(meta, open(os.path.join(out, 'figures', f'{fig}.json'), 'w'), indent=1)
    print(json.dumps(summary, indent=1))


if __name__ == '__main__':
    main(sys.argv[1])
