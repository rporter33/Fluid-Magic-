# Art director's atlases for the review test page (pilot-review.md): pack.py run on the rim-fixed frames
# (ad_rimfix.py) three ways, each into its own atlas prefix:
#   paint  - as painted, the design's neutral keyline (#1C1A17, 60%)
#   sidekl - as painted, the keyline drawn in the side's dark cloth shade at 75% (Cinder #7E3118, Thornwood #113F2F)
#   normkl - pack.cloth_boost (the pilot's cloth normalisation) plus the side keyline
# Usage: python3 -I ad_pack.py OUT_DIR SPEC ...   (SPEC as pack.py: SLICED_DIR:FIGURE:VIEW)
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pack  # noqa: E402
import checks  # noqa: E402
from ad_measures import tinted_keyline, SHADE  # noqa: E402

NEUTRAL = checks.keyline


def main():
    out, specs = sys.argv[1], sys.argv[2:]
    os.makedirs(out, exist_ok=True)
    report = {}
    for mode in ('paint', 'sidekl', 'normkl'):
        for tier in ('S', 'H'):
            items, figs = [], []
            for sp in specs:
                sdir, fig, view = sp.split(':')[:3]
                u = next(x for x in pack.UNITS['units'] if x['id'] == fig)
                pack.keyline = NEUTRAL if mode == 'paint' else tinted_keyline(SHADE[u['nation']])
                fr, info = pack.frames_of(sdir, fig, view, tier, None, boost=(mode == 'normkl'))
                items += fr; figs.append(info)
            pages, placed = pack.pack(items)
            import numpy as np
            from PIL import Image
            for i, p in enumerate(pages):
                rows = np.nonzero(p[..., 3].max(1) > 0)[0]
                h = 1 << (int(rows.max() + 1) - 1).bit_length()
                Image.fromarray(np.clip(p[:h], 0, 255).astype(np.uint8), 'RGBA').save(f'{out}/ad{mode}{tier}.{i}.png')
                sheet = dict(frames={n: {k: v for k, v in d.items() if k != 'page'} for n, d in placed.items() if d['page'] == i},
                             meta=dict(image=f'ad{mode}{tier}.{i}.png', size=dict(w=pack.PAGE, h=h), scale=1, tier=tier,
                                       app='units/tools/ad_pack.py'))
                json.dump(sheet, open(f'{out}/ad{mode}{tier}.{i}.json', 'w'), indent=1)
            report[f'{mode}{tier}'] = dict(frames=len(placed), pages=len(pages), figures=figs)
    pack.keyline = NEUTRAL
    print(json.dumps(report)[:1500])


if __name__ == '__main__':
    main()
