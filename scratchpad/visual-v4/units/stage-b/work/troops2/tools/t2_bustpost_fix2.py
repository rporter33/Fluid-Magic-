# Stage B fix2 (critique-resume fix 8): post a card bust through the troop bust post step (work/troops/sbx/tools/
# tr_busts.py: background, top 3-16%, side cloth on the lower half, kit colour against the figure's stand frame) into
# stage-b/portraits/<nation>/<unit>/bust.*. The Wolf Rider is not in the troop picks (it is the kept pilot test), so its
# kit gate reads the hue-locked stand frame of the kept front sheet (fix/work/wolfRider.front.locked) through a small
# picks file of its own; every other troop uses the troop picks as before.
# Usage: python3 t2_bustpost_fix2.py RAW.png FIGURE
import json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
W2 = os.path.abspath(os.path.join(HERE, '..'))
SB = os.path.abspath(os.path.join(W2, '..', '..'))
TR = os.path.join(SB, 'work', 'troops', 'sbx', 'tools')
sys.path.insert(0, TR)
sys.path.insert(0, os.path.join(TR, '..', '..', 'tools'))
os.chdir(TR)
import tr_busts  # noqa: E402

if __name__ == '__main__':
    raw, fig = sys.argv[1], sys.argv[2]
    if fig == 'wolfRider':
        d = os.path.join(W2, 'fix2-wolfRider-kit')
        os.makedirs(os.path.join(d, 'frames'), exist_ok=True)
        os.makedirs(os.path.join(d, 'kitcards'), exist_ok=True)
        shutil.copy(os.path.join(SB, 'fix', 'work', 'wolfRider.front.locked', 'wolfRider.front.stand.png'),
                    os.path.join(d, 'frames', 'wolfRider.front.stand.png'))
        shutil.copy(os.path.join(W2, 'kitcards', 'wolfRider.kit.png'), os.path.join(d, 'kitcards', 'wolfRider.kit.png'))
        json.dump({'wolfRider': {'front': {'dir': d}}}, open(os.path.join(d, 'picks.json'), 'w'))
        tr_busts.W = d
    tr_busts.main(raw, fig)
