# Rest of stage D: the Thornwood palettes of the six generic gods' action cutouts, as stage C made their idle cutouts
# (owner, stage C verdict: "Thornwood god palettes Accept" -- the Thornwood figure is the green edit of the same painting).
# Zero generations: each Cinder action frame's tint zone (stage-c/work/gods/tools/gd_tint.zone_mask: the pixels at the
# zone's own ember hue and chroma, a soft mask cleaned of specks) is moved in OKLCH by the transform the owner-approved
# portrait edit made (gd_tint.pair_transform: lightness fitted linearly, chroma by the median ratio, hue by the median
# shift, raised into the Thornwood cloth window where the portrait's green sat below it); every other pixel is the Cinder
# painting. The zone hue is measured on the god's Cinder idle cutout (the stage C reference) so every frame of a god turns
# by the same amount; the Living Monolith's front takes its own zone hue as stage C's fix R7 did.
# Writes cut/<tag>.thornwood/<god>-thornwood.<view>.<action>.png, a mask proof per frame and tint.json.
# Usage: python3 -I dd_tint.py [GOD ...]     (default: titan oracle ascendedHero greatWyrm primordial livingMonolith)
import json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
PROD = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(PROD, '..', '..'))
sys.path.insert(0, os.path.join(UNITS, 'stage-c', 'work', 'gods', 'tools'))
import gd_tint  # noqa: E402
import dd_jobs  # noqa: E402

GODS = ['titan', 'oracle', 'ascendedHero', 'greatWyrm', 'primordial', 'livingMonolith']


def tint_frame(rgba, T, god):
    m, hz = gd_tint.zone_mask(rgba, T['hueC'], god)
    out = gd_tint.recolor(rgba, T, m)
    return out, m, hz


def main(gods):
    jobs = json.load(open(os.path.join(PROD, 'jobs', 'actions.json')))
    rec = {}
    for god in gods:
        T0 = gd_tint.pair_transform(god)
        for view in ('back', 'front'):
            T = dict(T0)
            fig = f'{god}-cinderHorde'
            # the zone hue of the approved Cinder idle cutout fixes the turn for every frame of this god and view
            idle = np.asarray(Image.open(dd_jobs.idle_path(fig, view)).convert('RGBA')).astype(np.float64)
            _, hz_idle = gd_tint.zone_mask(idle, T['hueC'], god)
            if (god, view) in gd_tint.ALIGN_ZONE_HUE:
                T['dHueFromPair'] = T['dHue']; T['dHue'] = T['hueTarget'] - hz_idle
            sel = json.load(open(os.path.join(PROD, 'selection.json')))
            todo = []
            for j in [j for j in jobs if j['figure'] == fig and j['view'] == view]:
                tags = {os.path.basename(j['out']).rsplit('.png', 1)[0]}
                sj = sel.get(j['job'])
                tags |= {sj} if isinstance(sj, str) else set(sj.values()) if isinstance(sj, dict) else set()
                todo += [t for t in sorted(tags) if t != 'skip']
            for tag in todo:
                src = os.path.join(PROD, 'cut', tag)
                pj = os.path.join(src, 'post.json')
                if not os.path.exists(pj):
                    continue
                rep = json.load(open(pj))
                dst = src + '.thornwood'
                os.makedirs(dst, exist_ok=True)
                shares = {}
                for fr in rep['frames']:
                    if fr.get('missing'):
                        continue
                    rgba = np.asarray(Image.open(os.path.join(src, fr['file'])).convert('RGBA')).astype(np.float64)
                    out, m, hz = tint_frame(rgba, T, god)
                    fn = fr['file'].replace('-cinderHorde.', '-thornwood.')
                    Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), 'RGBA').save(os.path.join(dst, fn))
                    a = rgba[..., 3:4] / 255
                    bg = np.array([90, 90, 90.])
                    p1 = rgba[..., :3] * a + bg * (1 - a); p3 = out[..., :3] * a + bg * (1 - a)
                    p2 = p1 * (1 - m[..., None]) + np.array([255, 0, 255.]) * m[..., None]
                    pr = Image.fromarray(np.clip(np.concatenate([p1, p2, p3], 1), 0, 255).astype(np.uint8)); pr.thumbnail((1500, 600))
                    pr.save(os.path.join(dst, fn.replace('.png', '.mask-proof.png')))
                    shares[fr['action']] = dict(maskShare=round(float((m > 0.5).sum() / max(1, (rgba[..., 3] > 230).sum())), 4), frameZoneHue=round(hz, 1))
                T_out = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in T.items()}
                json.dump(dict(god=god, view=view, cinderTag=tag, transform=T_out, idleZoneHue=round(hz_idle, 1), frames=shares),
                          open(os.path.join(dst, 'tint.json'), 'w'), indent=1)
                rec[f'{god}.{view}.{tag}'] = shares
                print(god, view, tag, {k: v['maskShare'] for k, v in shares.items()}, 'dHue', round(T['dHue'], 1), flush=True)
    return rec


if __name__ == '__main__':
    main(sys.argv[1:] or GODS)
