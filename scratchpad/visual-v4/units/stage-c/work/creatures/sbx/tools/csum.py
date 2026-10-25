# Stage C creatures: one line per checked sheet (../../sheets/*/checks.json). Usage: python3 csum.py [NAME_SUBSTRING ...]
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
W = os.path.abspath(os.path.join(HERE, '..', '..'))


def gline(n, r):
    s = r['side']
    sd = (f"value below {s['neutral']['worstBelow']} contrast {s['neutral']['minContrast']}" if s.get('kind') == 'noSide'
          else f"side {s['neutral']['share']}/{s['sideKeyline']['share']}kl below {s['sideKeyline']['worstBelow']}")
    return (f"{n}: {'PASS' if r['pass'] else 'FAIL ' + ','.join(k for k, x in r['gates'].items() if not x)} | cells {r['cameraGate']['follow']} "
            f"fail {r['cameraGate']['failing']} miss {r['cameraGate']['missing']} | var {r['variety2']['pairs']} {r['variety2']['mostAlike']} | "
            f"rim {r['rim']['afterMax']} | {sd} | cons {r['consistency'].get('histMin')} {r['consistency'].get('maxDE')} | keyIn {r['fringe']['keyInUnitPct']} edge {r['fringe'].get('edgeDevPct')}")


def bline(n, r):
    c, v = r['camera'], r['value']
    return (f"{n}: {'PASS' if r['pass'] else 'FAIL ' + ','.join(k for k, x in r['gates'].items() if not x)} | iou {c['iou']} facing "
            f"{round(c['iou'] - c['iouMirrored'], 3)} aspect {c['aspectRatio']} | idDE {r['identity']['dE2000']} | below {v['worstBelow']} | "
            f"rim {r['rim']['afterMax']} | keyIn {r['fringe']['keyInUnitPct']} edge {r['fringe'].get('edgeDevPct')}")


for n in sorted(os.listdir(os.path.join(W, 'sheets'))):
    if sys.argv[1:] and not any(a in n for a in sys.argv[1:]):
        continue
    p = os.path.join(W, 'sheets', n, 'checks.json')
    if os.path.exists(p):
        r = json.load(open(p))
        print(gline(n, r) if 'cameraGate' in r else bline(n, r))
