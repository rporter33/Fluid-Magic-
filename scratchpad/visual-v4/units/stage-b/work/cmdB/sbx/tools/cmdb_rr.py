# Stage B, key "cmdB", resumed run: one re-roll per failing sheet, the failure named in words the generator can act on
# (the cell by its place in the 4 by 4 grid and its pose, not the pipeline's cell name), built with cmdb.redress_job
# (tag .r2). Usage: python3 cmdb_rr.py OUT_JOBS.json FACE.VIEW [FACE.VIEW ...]
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES  # noqa: E402

ORDER = ['stand', 'idle2', 'marchA', 'marchB', 'windup', 'strike', 'follow', 'recoil', 'actA', 'actB', 'fall', 'deadA',
         'deadB', 'fleeA', 'fleeB', 'cheer']
POSE = {'stand': 'standing at rest', 'idle2': 'resting', 'marchA': 'marching', 'marchB': 'marching',
        'windup': 'drawing back to strike', 'strike': 'striking', 'follow': 'following through after the blow',
        'recoil': 'flung back by a hit', 'actA': 'raising the weapon high', 'actB': 'pointing the weapon forward',
        'fall': 'falling', 'deadA': 'lying dead', 'deadB': 'lying dead', 'fleeA': 'fleeing', 'fleeB': 'fleeing',
        'cheer': 'cheering'}
ROW = ['top row', 'second row', 'third row', 'bottom row']
COL = ['first', 'second', 'third', 'fourth']
KIT_HINT = {
    'saplingDruid': 'Keep the garments as long as the robe of Image 1, the cloak and tunic falling to the ankles, so every '
                    'figure keeps the outline of Image 1.',
    'grovePriest': 'Keep the robe to the ground as in Image 1, so every figure keeps the outline of Image 1.',
    'wardenCaptain': 'Keep the deep bottle-green wool tunic of Image 1 under the bark plates, and keep the antlers small '
                     'and close to the helm in the falling and lying cells.',
}


def where(c):
    i = ORDER.index(c)
    return f'the {COL[i % 4]} cell of the {ROW[i // 4]} ({POSE[c]})'


def reason(r, unit):
    g, why = r['gate'], []
    ca = r.get('cameraRel') or r.get('cameraAll') or {}
    fail = [c for c in ORDER if c in (ca.get('failing') or [])]
    if g.get('cells') is False and ca.get('followN', 99) <= 4:
        why.append('the figures were drawn from another camera, turned side-on and larger, instead of seen from high '
                   'above and behind exactly as in Image 1')
    elif g.get('cells') is False:
        why.append('in ' + ', '.join(where(c) for c in fail) + ' the figure did not keep the pose, facing, size or '
                   'outline of the same cell of Image 1')
    if g.get('variety') is False:
        why.append('the two marching figures came out too alike: keep their legs apart as in Image 1')
    if g.get('fringe') is False:
        why.append('the background colour showed inside the figures (between the leaves, the staff and the body): '
                   'keep every gap inside a figure filled with the figure\'s own colours and no magenta, pink or purple '
                   'anywhere on a figure')
    if g.get('side') is False:
        why.append('too little of the kit\'s deep bottle-green cloth showed: keep the deep bottle-green cloth of Image 1 '
                   'clearly coloured wherever the portrait does not show another colour' if
                   FACES_UNIT_NATION(unit) == 'thornwood' else 'the figure came out too pale: keep its values as dark as Image 1')
    if g.get('identity') is False:
        why.append('the colours of the head and shoulders did not match the portrait: paint the headgear, hair and '
                   'mantle in the portrait\'s own colours and values, no brighter and no more saturated')
    if g.get('rim') is False:
        why.append('the background colour tinted the figures\' outlines: keep every edge in the figure\'s own colours')
    if g.get('facingByEye') is False:
        why.append('some figures turned to face us although Image 1 shows their backs')
    return '; '.join(why) + '.'


def FACES_UNIT_NATION(unit):
    return next(v[1] for v in FACES.values() if v[2] == unit)


def main():
    out, specs = sys.argv[1], sys.argv[2:]
    jobs = []
    for s in specs:
        f, v = s.split('.')[:2]
        unit = FACES[f][2]
        r = json.load(open(os.path.join(cmdb.W, 'faces', f'{f}.{v}', 'checks.json')))
        extra = ('The last attempt failed: ' + reason(r, unit) + ' Keep every figure exactly where, how large and '
                 'facing which way Image 1 has it.' + (' ' + KIT_HINT[unit] if unit in KIT_HINT else ''))
        j = cmdb.redress_job(f, v, '.r2', extra)
        j['purpose'] = 're-roll (failure named) ' + j['purpose'].replace(' r2', '')
        jobs.append(j)
        print(s, '->', extra)
    json.dump(jobs, open(out, 'w'), indent=1)


if __name__ == '__main__':
    main()
