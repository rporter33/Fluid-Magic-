"""Busyness of the wilds (the verifier's metric: 6 CSS px cells, share of neighbouring cells differing by > 10 / > 20 L*), on the dump's land layer (rails, pieces, labels off;
the wild outline is in it): the wild cores (>= 4 px from any other province, as look.py), the wild edges (cells within 12 px of a wild/passable outline, both sides), and the
passable land's cores for scale; plus look.py's peaks-over-land and wild.py's light-rim and ink shares. Usage: python3 -I wbusy.py tag [tag ...]"""
import sys, os, json, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
def dil(m, n):
    o = m.copy()
    for _ in range(n):
        o = o | np.roll(o, 1, 0) | np.roll(o, -1, 0) | np.roll(o, 1, 1) | np.roll(o, -1, 1)
    return o
def run(tag):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']
    meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = ((fl & 4) > 0) & inm
    vm = np.zeros(pid.shape, bool); vm[int((v['t'] + 4) * dpr):int((v['b'] - 4) * dpr), int((v['l'] + 4) * dpr):int((v['r'] - 4) * dpr)] = True
    land = L['land'][..., :3]; cell = 6 * dpr; g = busy_img(Image.fromarray(np.ascontiguousarray(land)), 1 / cell)
    d = distmap(pid, maxd=int(4 * dpr) + 2); core = (d >= 4 * dpr) & wild & ~water & vm
    pas = inm & ~wild & (pid != 255); band = dil(wild, int(12 * dpr)) & dil(pas, int(12 * dpr)) & inm & vm
    lcore = (distmap(pid, maxd=int(0.15 * I['Dpx'] * dpr) + 2) >= 0.15 * I['Dpx'] * dpr) & pas & ~water & vm
    r = {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1)}
    for k, m in (('wildCore', core), ('wildEdge', band), ('landCore', lcore)):
        cm = cellmask(m, cell); cm = cm[:g.shape[0], :g.shape[1]]
        r[k] = busy_pct(g[:cm.shape[0], :cm.shape[1]], cm) + (int(cm.sum()),) if cm.sum() >= 10 else None
    Lm = Lstar(land.astype(np.float64)); pk = core & ~(pid == 39)
    if pk.any() and (pas & vm).any(): r['peaksOverLandP95pct'] = round(float((Lm[pk] > np.percentile(Lm[pas & vm], 95)).mean() * 100), 2)
    return r
def ref2():
    im = Image.open(REFS + 'ref-2.png').convert('RGB').crop((1880, 60, 2540, 800)); g = busy_img(im, 1 / 12); return busy_pct(g)
if __name__ == '__main__':
    rows = [run(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    print('ref-2 mountains (12 ref px cells, about 6 CSS px):', ref2())
    json.dump(rows, open(OUT + 'wbusy-' + sys.argv[1].split('-')[0] + '.json', 'w'), indent=1)
