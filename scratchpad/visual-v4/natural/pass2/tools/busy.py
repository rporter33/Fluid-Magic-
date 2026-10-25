"""pass 2 busyness: the verifier's look.py metric (6 CSS px cells, share of adjacent cells with dL* > 10 / > 20) on the full frame and the land alone, inside the model;
plus the lines' own footprint: the share of model cells whose L* the line layer moves by > 3 (the grid of pale lines), and ref-2 / ref-4 by the same metric. Usage: python3 -I busy.py tag..."""
import sys, json, numpy as np
from PIL import Image
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from vlib import *
def one(tag):
    info, L = load(tag); I = info['info']; dpr = I['dpr']; v = I['view']; cr = I['canvasRect']; meta = L['meta']; inm = (meta[..., 1] & 2) > 0
    x0, x1, y0, y1 = int((v['l'] + 4) * dpr), int((v['r'] - 4) * dpr), int((v['t'] + 4) * dpr), int((v['b'] - 4) * dpr)
    sa = np.asarray(Image.open(DUMP + tag + '-shot.png').convert('RGB')); ox, oy = int(round(cr[0] * dpr)), int(round(cr[1] * dpr)); full = sa[oy + y0: oy + y1, ox + x0: ox + x1]
    land = L['land'][y0:y1, x0:x1, :3]; lines = L['lines'][y0:y1, x0:x1, :3]; m_in = inm[y0:y1, x0:x1]; cell = 6 * dpr; k = 1 / cell
    gA = busy_img(Image.fromarray(np.ascontiguousarray(full)), k); gL = busy_img(Image.fromarray(np.ascontiguousarray(land)), k); gN = busy_img(Image.fromarray(np.ascontiguousarray(lines)), k)
    cm = cellmask(m_in, cell); cm = cm[:gA.shape[0], :gA.shape[1]]
    def cellsL(a): h, w = a.shape[0] // cell * cell, a.shape[1] // cell * cell; return Lstar(a[:h, :w].astype(np.float64).reshape(h // cell, cell, w // cell, cell, 3).mean((1, 3)))
    dL = np.abs(cellsL(lines) - cellsL(land)); dL = dL[:cm.shape[0], :cm.shape[1]]
    return {'tag': tag, 'band': I['band'], 'Dpx': round(I['Dpx'], 1), 'busyAll': busy_pct(gA[:cm.shape[0], :cm.shape[1]], cm), 'busyLines': busy_pct(gN[:cm.shape[0], :cm.shape[1]], cm), 'busyLand': busy_pct(gL[:cm.shape[0], :cm.shape[1]], cm), 'lineCellsOver3': round(float((dL[cm] > 3).mean() * 100), 1), 'lineCellsOver6': round(float((dL[cm] > 6).mean() * 100), 1)}
def ref(name, box):
    im = Image.open(REFS + name).convert('RGB').crop(box); out = {}
    for cell in (6, 12):
        g = busy_img(im, 1 / cell); out[f'cell{cell}px'] = busy_pct(g)
    return out
if __name__ == '__main__':
    rows = [one(t) for t in sys.argv[1:]]
    for r in rows: print(json.dumps(r))
    print('ref-2 land (200..1800 x 30..810 of 2868 px; ~2 px per CSS px)', json.dumps(ref('ref-2.png', (420, 60, 2560, 1150))))
    print('ref-4', json.dumps(ref('ref-4.png', (420, 60, 2560, 1150))))
    json.dump(rows, open(OUT + 'busy-' + '_'.join(t.split('-')[0] for t in sys.argv[1:2]) + '.json', 'w'), indent=1)
