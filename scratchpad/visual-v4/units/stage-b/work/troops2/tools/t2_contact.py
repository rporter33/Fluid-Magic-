# Stage B troops2: the stage's contact sheets (work/troops/sbx/tools/tr_contact.py, unchanged) over the troops2 picks and
# the repacked atlas; a pick whose frames went through the key-cast post-pass keeps its block proof in the sheet's own
# directory, so the proof is looked up there. Usage: python3 t2_contact.py
import os, shutil, sys
W2 = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SB = os.path.abspath(os.path.join(W2, '..', '..'))
T = os.path.join(SB, 'work', 'troops', 'sbx', 'tools')
sys.path.insert(0, T)
os.chdir(T)
import json  # noqa: E402
import tr_contact  # noqa: E402

picks = json.load(open(os.path.join(W2, 'picks.json')))
tmp = os.path.join(W2, 'contactw')
os.makedirs(tmp, exist_ok=True)
for fig, views in picks.items():
    for v, p in views.items():
        if not os.path.exists(os.path.join(p['dir'], 'proof.sideKeyline.png')):
            name = os.path.basename(p['dir'].rstrip('/'))
            for src in (os.path.join(W2, 'sheets', name), os.path.join(SB, 'work', 'troops', 'sheets', name)):
                if os.path.exists(os.path.join(src, 'proof.sideKeyline.png')):
                    d = os.path.join(tmp, name)
                    os.makedirs(d, exist_ok=True)
                    shutil.copy(os.path.join(src, 'proof.sideKeyline.png'), d)
                    shutil.copy(os.path.join(p['dir'], 'checks.json'), d)
                    p['dir'] = d
                    break
json.dump(picks, open(os.path.join(tmp, 'picks.json'), 'w'), indent=1)
tr_contact.W = tmp
tr_contact.main(os.path.join(SB, 'atlas', 'troops'), os.path.join(W2, 'review'))
