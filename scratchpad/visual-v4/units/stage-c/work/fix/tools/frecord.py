# Stage C fix pass: the machine-readable record of the pass (work/fix/fix-record.json): the generations logged under
# "C fix:", each re-rolled view's job and gates, the critique's measurements before and after, the page sizes and the
# check summaries. Usage: python3 -I frecord.py
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, '..'))
UNITS = os.path.abspath(os.path.join(FIX, '..', '..', '..'))
V4 = os.path.abspath(os.path.join(UNITS, '..'))
COLS = 'file\tmodel\tseconds\ttokens\tstage\tpurpose\tdate\tresult'.split('\t')


def main():
    rows = [dict(zip(COLS, ln.split('\t'))) for ln in open(os.path.join(UNITS, 'gen-log.tsv')).read().splitlines()[1:] if ln.strip()]
    gens = [dict(file=r['file'], purpose=r['purpose'], result=r['result']) for r in rows if r.get('purpose', '').startswith('C fix:')]
    jobs = json.load(open(os.path.join(FIX, 'jobs.json')))
    sheets = {}
    for j in jobs:
        p = os.path.join(UNITS, 'stage-c', 'work', 'creatures', 'sheets', j['job'], 'checks.json')
        if j['kind'] == 'god':
            tag = os.path.basename(j['out']).rsplit('.png', 1)[0]
            p = os.path.join(UNITS, 'stage-c', 'work', 'gods', 'cut', tag, 'checks.json')
        if os.path.exists(p):
            c = json.load(open(p))
            g = c.get('gates') or {k: c[k].get('pass', c[k].get('pass_')) for k in ('camera', 'rim', 'fringe', 'value', 'side', 'size') if k in c}
            sheets[j['job']] = dict(item=j['item'], gates=g, cameraCells=(c.get('cameraGate') or {}).get('follow'))
    rec = dict(key='C fix', cap=18, used=len(gens), stageCUsed=sum(1 for r in rows if r.get('stage') == 'C'), stageCBudget=130,
               generations=gens, sheets=sheets,
               measureBefore=json.load(open(os.path.join(FIX, 'measure-before.json'))),
               measureAfter=json.load(open(os.path.join(FIX, 'measure-after.json'))),
               pages={'battle-mockup.html': os.path.getsize(os.path.join(V4, 'battle-mockup.html')),
                      'lineup.html': os.path.getsize(os.path.join(UNITS, 'stage-c', 'lineup.html'))},
               backup='stage-c/pre-fix/ (every file changed, as it was before the pass)')
    for f in ('checks-after.json',):
        p = os.path.join(UNITS, 'stage-c', 'qa-fix', f)
        if os.path.exists(p):
            c = json.load(open(p))
            rec['checks'] = {m: dict(ok=x['ok'], paintOk=x.get('paintOk'), pageErrors=len(x['pageErrors']), consoleErrors=len(x['consoleErrors']),
                                     battles=x['battles'], timing=x['timing']) for m, x in c['modes'].items()}
    json.dump(rec, open(os.path.join(FIX, 'fix-record.json'), 'w'), indent=1)
    print('fix-record.json', rec['used'], 'generations', rec['pages'])


if __name__ == '__main__':
    main()
