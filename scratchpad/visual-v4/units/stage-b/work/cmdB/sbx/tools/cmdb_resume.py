# Stage B, key "cmdB", resumed run (credits topped up): the re-dress jobs in the task's order, so that the battles are
# covered first if the API stops again:
#   wave 1: the battle faces' battle views (critique R5-R12): wc04 front, wc05 back, wc07 back and front, gp01 back,
#           sd03 back, sd08 front, ed08 back;
#   wave 2: the other view of those faces: wc04 back, wc05 front, gp01 front, sd03 front, sd08 back;
#   wave 3: every other face and view (Thornwood groups, then the independent captains), fronts first within a group.
# Elder Druid 05 and 08 fronts are the calibration's (they pass) and are kept. Writes jobs/resume-wave<N>.json.
# Usage: python3 cmdb_resume.py
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import cmdb  # noqa: E402
from cmdb_faces import FACES, GROUPS  # noqa: E402

R = {('wc04', 'front'): 'R5', ('wc05', 'back'): 'R6', ('wc07', 'back'): 'R7', ('wc07', 'front'): 'R8',
     ('gp01', 'back'): 'R9', ('sd03', 'back'): 'R10', ('sd08', 'front'): 'R11', ('ed08', 'back'): 'R12'}
W2 = [('wc04', 'back'), ('wc05', 'front'), ('gp01', 'front'), ('sd03', 'front'), ('sd08', 'back')]


def job(f, v, tag=''):
    j = cmdb.redress_job(f, v)
    j['purpose'] = (tag + ' ' if tag else '') + j['purpose']
    return j


def main():
    J = os.path.join(cmdb.W, 'jobs')
    w1 = [job(f, v, R[(f, v)]) for (f, v) in R]
    w2 = [job(f, v, 'battle face, other view') for (f, v) in W2]
    done = set(R) | set(W2) | set(cmdb.REUSED_REDRESS)
    order = ['thornScout', 'wardenCaptain', 'grovePriest', 'saplingDruid', 'elderDruid',
             'independentCaptain-mountaineer', 'independentCaptain-reedman']
    w3 = []
    for unit in order:
        for v in ('front', 'back'):
            for f in GROUPS[unit]:
                if (f, v) not in done:
                    w3.append(job(f, v))
    for n, w in ((1, w1), (2, w2), (3, w3)):
        json.dump(w, open(os.path.join(J, f'resume-wave{n}.json'), 'w'), indent=1)
        print('wave', n, len(w), 'jobs')
    print('total', len(w1) + len(w2) + len(w3))


if __name__ == '__main__':
    main()
