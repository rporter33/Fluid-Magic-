"""Look metrics on the verifier's own dumps: busyness (all layers from the page screenshot, land only from the land layer), value and chroma,
terrain values in province cores, busyness inside mountain / hill / wild cores, forest masses. Usage: python3 -I look.py tag [tag ...]"""
import sys, json, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vlib import *
RT = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']

def analyse(tag):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; cr = I['canvasRect']
    meta = L['meta']; pid = meta[..., 0].astype(np.int32); fl = meta[..., 1]; tt = meta[..., 2]
    inm = (fl & 2) > 0; water = (fl & 1) > 0; wild = (fl & 4) > 0
    # the view rect inside the canvas (device px), 4 px in from its edges
    x0, x1, y0, y1 = int((v['l'] + 4) * dpr), int((v['r'] - 4) * dpr), int((v['t'] + 4) * dpr), int((v['b'] - 4) * dpr)
    shot = Image.open(DUMP + tag + '-shot.png').convert('RGB'); sa = np.asarray(shot)
    ox, oy = int(round(cr[0] * dpr)), int(round(cr[1] * dpr))
    full_shot = sa[oy + y0: oy + y1, ox + x0: ox + x1]
    land = L['land'][y0:y1, x0:x1, :3]; m_in = inm[y0:y1, x0:x1]
    cell = 6 * dpr; k = 1 / cell
    r = {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1), 'look': I['look'], 'mode': I['mode']}
    gA = busy_img(Image.fromarray(full_shot), k); gL = busy_img(Image.fromarray(np.ascontiguousarray(land)), k)
    cm = cellmask(m_in, cell); cm = cm[:gA.shape[0], :gA.shape[1]]
    r['busyAll_view'] = busy_pct(gA); r['busyAll_model'] = busy_pct(gA[:cm.shape[0], :cm.shape[1]], cm) if cm.any() else None
    r['busyLand_view'] = busy_pct(gL); r['busyLand_model'] = busy_pct(gL[:cm.shape[0], :cm.shape[1]], cm) if cm.any() else None
    r['statsAll_model'] = stats(full_shot[m_in]) if m_in.any() else None
    r['statsLand_model'] = stats(land[m_in]) if m_in.any() else None
    # terrain cores: >= 0.15 D from any other province, not water, in sight (fog states differ in value)
    fog = {p['i']: p['fog'] for p in info['provs']}
    d = distmap(pid, maxd=int(0.15 * I['Dpx'] * dpr) + 2); core = (d >= 0.15 * I['Dpx'] * dpr) & inm & ~water & (pid != 255)
    Lall = Lstar(L['land'][..., :3])
    terr = {}
    for t in range(7):
        sel = core & (tt == t) & ~wild & np.isin(pid, [i for i, f in fog.items() if f == ''])
        if sel.sum() < 50: continue
        Lv = Lall[sel]; terr[RT[t]] = {'px': int(sel.sum()), 'Lp10': round(float(np.percentile(Lv, 10)), 1), 'Lp50': round(float(np.median(Lv)), 1), 'Lp90': round(float(np.percentile(Lv, 90)), 1)}
    r['coresL'] = terr
    # busyness inside cores, by terrain, and inside the wild massifs (all layers off = land layer; and all layers on)
    gLfull = busy_img(Image.fromarray(np.ascontiguousarray(L['land'][..., :3])), k); ccell = lambda m: cellmask(m, cell)
    cb = {}
    for t in range(7):
        cmk = ccell(core & (tt == t) & ~wild)
        if cmk.sum() >= 20: cb[RT[t]] = busy_pct(gLfull[:cmk.shape[0], :cmk.shape[1]], cmk) + (int(cmk.sum()),)
    wcore = (d >= 4 * dpr) & wild & inm & ~water; cmk = ccell(wcore)
    if cmk.sum() >= 20: cb['wild'] = busy_pct(gLfull[:cmk.shape[0], :cmk.shape[1]], cmk) + (int(cmk.sum()),)
    r['coreBusyLand'] = cb
    # bright pixels inside the wilds (L* > 70) and over the whole land
    if wcore.any(): r['wildOver70pct'] = round(float((Lall[wcore] > 70).mean() * 100), 2)
    r['landOver75pct'] = round(float((Lall[inm & ~water] > 75).mean() * 100), 2)
    Lf = Lstar(L['full'][..., :3]); r['fullOver75pct'] = round(float((Lf[inm & ~water] > 75).mean() * 100), 2)
    # forest masses: connected regions of dark canopy (L* < 26, 3 px box) on the land layer, by equivalent diameter in CSS px
    sm = np.asarray(Image.fromarray(np.ascontiguousarray(L['land'][..., :3])).resize((L['land'].shape[1] // (3 * dpr), L['land'].shape[0] // (3 * dpr)), Image.BOX), np.float64)
    dark = (Lstar(sm) < 26)
    inm_s = np.asarray(Image.fromarray((inm * 255).astype(np.uint8)).resize((dark.shape[1], dark.shape[0]), Image.BOX)) > 250
    dark &= inm_s
    lab_ = np.zeros(dark.shape, np.int32); n = 0; sizes = []
    ys, xs = np.nonzero(dark)
    seen = np.zeros(dark.shape, bool)
    for y, x in zip(ys, xs):
        if seen[y, x]: continue
        st = [(y, x)]; seen[y, x] = True; c = 0
        while st:
            a, b = st.pop(); c += 1
            for q, w in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                if 0 <= q < dark.shape[0] and 0 <= w < dark.shape[1] and dark[q, w] and not seen[q, w]: seen[q, w] = True; st.append((q, w))
        sizes.append(c)
    sizes = np.array(sizes); big = sizes[sizes * 9 >= 400]  # >= 20 x 20 CSS px
    dia = 2 * np.sqrt(big * 9 / np.pi)
    r['forestMasses'] = {'count_ge20px': int(len(big)), 'diaP50': round(float(np.median(dia)), 0) if len(dia) else None, 'diaP90': round(float(np.percentile(dia, 90)), 0) if len(dia) else None, 'darkShareOfLand': round(float(dark.sum() / max(1, inm_s.sum())), 3)}
    return r

if __name__ == '__main__':
    rows = [analyse(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    json.dump(rows, open(OUT + 'look-' + ('_'.join(sorted(set(r['look'] for r in rows)))) + f'-{len(rows)}.json', 'w'), indent=1)
