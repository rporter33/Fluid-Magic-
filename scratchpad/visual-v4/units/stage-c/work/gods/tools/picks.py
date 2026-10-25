# Stage C gods: the owner's picked portrait per god body and nation (stage-c/picks.json), resolved to the painting the
# owner saw on the stage B page (stage-b/review-build/assets.py candidate(): the newest version not marked replaced or
# reject in ad-review.json).
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
UNITS = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
SB = os.path.join(UNITS, 'stage-b')
PW = os.path.join(SB, 'work', 'portraits')
GODS = ['greatWyrm', 'titan', 'oracle', 'livingMonolith', 'ascendedHero', 'primordial',
        'ashColossus', 'ashPhoenix', 'pyreLord', 'cinderIdol', 'emberHierophant',
        'wildSpirit', 'worldTree', 'hornedHunter', 'elderWyrm', 'motherOfBeasts']
GENERIC = ('greatWyrm', 'titan', 'oracle', 'livingMonolith', 'ascendedHero', 'primordial')


def resolve():
    jobs = json.load(open(os.path.join(PW, 'jobs.json')))
    rev = json.load(open(os.path.join(PW, 'ad-review.json')))
    picks = json.load(open(os.path.join(UNITS, 'stage-c', 'picks.json')))['portraits']
    out = {}
    for g in GODS:
        cand = picks[g].lower()
        for j in jobs:
            if j['unit'] != g or j['cand'] != cand:
                continue
            d = os.path.join(SB, 'portraits', j['nation'], g)
            for v in ('r4', 'r3', 'r2', ''):
                name = f"{j['face']}{cand}" + (f'-{v}' if v else '')
                if not os.path.exists(os.path.join(d, name + '-512.webp')):
                    continue
                rv = rev.get(j['job'] + (f'.{v}' if v else '')) or {}
                if rv.get('verdict') in ('replaced', 'reject'):
                    continue
                side = json.load(open(os.path.join(d, name + '.json')))
                out.setdefault(g, {})[j['nation']] = dict(
                    job=j['job'] + (f'.{v}' if v else ''), name=name, dir=d,
                    p512=os.path.join(d, name + '-512.webp'), game=os.path.join(d, name + '.webp'),
                    source=os.path.join(UNITS, side['sourceFile']), sidecar=os.path.join(d, name + '.json'),
                    pick=picks[g], review=rv, marks=j.get('marks'), tint=j.get('tint'))
                break
    return out


if __name__ == '__main__':
    for g, v in resolve().items():
        for n, r in v.items():
            print(g, n, r['name'], os.path.exists(r['source']), r['tint'])
