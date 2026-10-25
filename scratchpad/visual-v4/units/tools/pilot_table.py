# Prints the pilot's measures for every sheet of every round (from ../pilot/work/<round>/summary.json) and writes
# ../pilot/measures.json. Usage: python3 pilot_table.py
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))
allm = {}
for r in ('r1', 'r2', 'r3', 'r3b'):
    p = os.path.join(ROOT, 'pilot', 'work', r, 'summary.json')
    if not os.path.exists(p):
        continue
    for k, v in sorted(json.load(open(p)).items()):
        allm[f'{r}/{k}'] = v
        if 'error' in v:
            print(r, k, 'ERROR', v['error'][-160:]); continue
        if 'identity' in v:
            print(f"{r:4} {k:22} cam {v['camera']['iou']:.3f} m{v['camera']['iou'] - v['camera']['iouMirrored']:+.3f} {'ok' if v['camera']['pass'] else 'FAIL'} | identity dE {v['identity']['dE2000']} whole {v['identity']['wholeDE2000']} | edge {v['fringe']['edgeDevPct']} inUnit {v['fringe']['keyInUnitPct']}")
            continue
        c, ca, f, sd = v['consistency'], v['cameraAll'], v['fringe'], v['side']
        print(f"{r:4} {k:22} stand {v['camera']['iou']:.3f} m{v['camera']['iou'] - v['camera']['iouMirrored']:+.3f} head {v['camera']['headDx']:+.3f}/{v['camera']['guideHeadDx']:+.3f} {'ok' if v['camera']['pass'] else 'FAIL'}"
              f" | cells {ca['medianIoU']} {ca['follow']} | var {'ok' if v['variety']['pass'] else 'FAIL'} march {v['variety'].get('marchIoU')}/{v['variety'].get('marchLegsIoU')} alike {v['variety']['mostAlike'][1]}"
              f" | side {sd['share']:.3f} val {min(sd[g]['below'] for g in ('plains', 'farmland', 'swamp', 'forest'))}"
              f" | cons hist {c['histMin'][1]} ({c['histMin'][0]}) dE {c['maxDE'][1]} ({c['maxDE'][0]}) cloth {c['clothRatio']}"
              f" | edge {f['edgeDevPct']} inUnit {f['keyInUnitPct']}")
json.dump(allm, open(os.path.join(ROOT, 'pilot', 'measures.json'), 'w'), indent=1)
