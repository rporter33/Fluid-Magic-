# Stage B troops: the pick of every troop sheet (both views), and its status against the gates:
#   pass        - the sheet passed every automatic check (round 1, its one re-roll, or a kept pilot sheet);
#   reported    - it failed in round 1 and again on its one re-roll: not re-rolled again (plan 9: "a second failure is
#                 reported"); the better attempt is kept as a provisional pick, flagged, for the art director.
# Usage: python3 tr_picks.py   (writes ../../picks.json)
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..', '..'))
S = os.path.join(W, 'sheets')
PICKS = {
    'ashMilitia': {'back': ('r1.ashMilitia.back', 'pass'), 'front': ('r2.ashMilitia.front.dress', 'pass')},
    'cinderWarrior': {'back': ('kept.cinderWarrior.back', 'pass'), 'front': ('kept.cinderWarrior.front', 'pass')},
    'emberSkirmisher': {'back': ('r1.emberSkirmisher.back', 'reported'), 'front': ('r2.emberSkirmisher.front.pro', 'pass')},
    'flameArcher': {'back': ('r1.flameArcher.back', 'pass'), 'front': ('r1.flameArcher.front', 'pass')},
    'berserker': {'back': ('r2.berserker.back.dress', 'reported'), 'front': ('r1.berserker.front', 'reported')},
    'flamebrand': {'back': ('r1.flamebrand.back', 'reported'), 'front': ('r1.flamebrand.front', 'pass')},
    'thornMilitia': {'back': ('r2.thornMilitia.back.dress', 'pass'), 'front': ('r1.thornMilitia.front', 'reported')},
    'warden': {'back': ('r2.warden.back.edit', 'pass'), 'front': ('e1.warden.front.surcoat', 'pass')},
    'briarGuard': {'back': ('r1.briarGuard.back', 'reported'), 'front': ('r1.briarGuard.front', 'pass')},
    'longbowHunter': {'back': ('r2.longbowHunter.back.dress', 'reported'), 'front': ('r1.longbowHunter.front', 'reported')},
    'lightInfantry': {'back': ('r1.lightInfantry.back', 'pass'), 'front': ('r1.lightInfantry.front', 'pass')},
    'heavyInfantry': {'back': ('r2.heavyInfantry.back.dress', 'reported'), 'front': ('r2.heavyInfantry.front.dress', 'pass')},
    'archer': {'back': ('r1.archer.back', 'pass'), 'front': ('r1.archer.front', 'pass')},
    'swampFighter': {'back': ('r1.swampFighter.back', 'pass'), 'front': ('r2.swampFighter.front.dress', 'pass')},
}


NOTES = {
    ('thornMilitia', 'front'): 'its one re-roll (an nb21 edit) was refused twice by the API: HTTP 402, prepayment credits depleted',
    ('emberSkirmisher', 'back'): 'r2 (Pro, failure named) 3/15 at eye level; r1 kept: 10/15, value 12.3 L* below swamp, javelin shafts keep key green (keyIn 0.96%)',
    ('berserker', 'back'): 'r1 (Pro) 3/15 at eye level; r2 (nb21 re-dress of the kept Cinder back) kept: 8/15 (strike, follow, flee cells drift)',
    ('berserker', 'front'): 'camera 13/15 both times; side 26.9% (r1) and 26.6% (r2, nb21 edit asking for broad war paint) with the side keyline, under 30%',
    ('flamebrand', 'back'): 'r2 (Pro, failure named) 1/15 at eye level; r1 kept: 11/15 (follow, fall, deadA, deadB)',
    ('briarGuard', 'back'): 'r2 (Pro) 13/15 but its stand cell faces the camera (caught by consistency, windup dE 17.5); r1 kept: 11/15 (follow and brace at 0.524, both dead cells), facing right',
    ('briarGuard', 'front'): 'r1 had a white background; passed after the keyer gained a flat-background path (no generation); r2 (Pro) was 1/15',
    ('longbowHunter', 'back'): 'r1 (Pro) grey-teal background, 9/15 after the flat-background keyer; r2 (nb21 re-dress of the Archer back) kept: 13/15, consistency windup dE 12.7 against 12',
    ('longbowHunter', 'front'): 'six attempts across calibration and stage B never reached 13/15: cal r1 11/15, cal r2 3/15, r1 9/15 (kept), r2 re-dress of the Archer front 8/15',
    ('heavyInfantry', 'back'): 'r1 (Pro) 4/15; r2 (nb21 re-dress of the Warden back) kept: 12/15 (recoil 0.503, both dead cells)',
}


def main(over=None):
    p = dict(PICKS)
    if over:
        for f, v in over.items():
            p[f] = {**p[f], **v}
    out = {}
    for f, views in p.items():
        out[f] = {}
        for v, (d, st) in views.items():
            r = json.load(open(os.path.join(S, d, 'checks.json')))
            out[f][v] = dict(dir=os.path.join(S, d), sheet=r['sheet'], status=st, autoPass=r['pass'],
                             failed=[k for k, x in r['gates'].items() if not x], note=NOTES.get((f, v)))
    json.dump(out, open(os.path.join(W, 'picks.json'), 'w'), indent=1)
    return out


if __name__ == '__main__':
    o = main()
    for f, v in o.items():
        print(f, {k: (x['status'], x['autoPass'], x['failed']) for k, x in v.items()})
