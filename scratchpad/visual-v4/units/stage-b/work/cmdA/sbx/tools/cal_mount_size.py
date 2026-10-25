# Stage B calibration, part 4a: how big the painted War Wolf and its rider come out in the game, against foot troops,
# the maquette and the design's size ladder (battle-overhead.md 3.2: a man 28 wu tall; size 2, a rider, 42 wu tall and
# 60 wu long; tier S draws 2 px per wu). The packer (pack.py) scales a figure so its stand frame's body height becomes
# heightPx: infantry 56, wolfrider 74, cavalry 84 (tier S).
#   hood: the hood's width (the widest row in the top 12% of the body, after an opening that removes spear and pennon)
#   wolf: the riderless frame (boltA): its height and length
# Usage: python3 cal_mount_size.py
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pack import body_height  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..'))
CAL = os.path.abspath(os.path.join(ROOT, '..'))
UNITS_DIR = os.path.abspath(os.path.join(CAL, '..', '..'))
G = json.load(open(os.path.join(ROOT, 'refs', 'guides', 'guides.json')))
SPLIT = json.load(open(os.path.join(ROOT, 'refs', 'guides', 'mount-split.json')))
HPX = json.load(open(os.path.join(ROOT, 'units.json')))['heightPx']
WU_PER_RIG = 28.0  # a man's guide body (1.0 rig units) is 28 wu


def opened(mask, h):
    r = max(3, (int(0.05 * h) // 2) * 2 + 1)
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(r)).filter(ImageFilter.MaxFilter(r))
    return np.asarray(m) > 127


def hood_width(mask):
    ys, xs = np.nonzero(mask)
    m = opened(mask, ys.max() - ys.min() + 1)
    ys, xs = np.nonzero(m)
    top = ys.min()
    h = ys.max() - top + 1
    w = [np.ptp(np.nonzero(m[y])[0]) + 1 for y in range(top, top + int(0.12 * h)) if m[y].any()]
    return float(max(w))


def frame(d, fig, view, name):
    meta = json.load(open(os.path.join(d, f'{fig}.{view}.json')))
    f = next(x for x in meta['frames'] if x['name'] == name)
    return np.asarray(Image.open(os.path.join(d, f['file'])).convert('RGBA'))[..., 3] > 0.35 * 255


def guide_mask(key, cell):
    g = G[key]
    png = os.path.join(ROOT, 'refs', 'guides', f'{key}.png')
    rgb = np.asarray(Image.open(png).convert('RGB')).astype(np.float64) / 255
    cols, rows = g['grid']; cw, ch = g['size'][0] / cols, g['size'][1] / rows
    c = next(x for x in g['cells'] if x['cell'] == cell)
    sub = rgb[int(c['row'] * ch):int((c['row'] + 1) * ch), int(c['col'] * cw):int((c['col'] + 1) * cw)]
    return np.abs(sub - rgb[2, 2]).sum(-1) > 0.2, g['k']


def box_wu(mask, k):
    ys, xs = np.nonzero(mask)
    return (np.ptp(ys) + 1) * k * WU_PER_RIG, (np.ptp(xs) + 1) * k * WU_PER_RIG


def main():
    WR = os.path.join(UNITS_DIR, 'pilot', 'ad', 'frames', 'wolfRider.front')
    HU = os.path.join(CAL, 'work', 'longbowHunter.front.green', 'frames')
    out = {}
    # in the game, as packed today (tier S, 2 px per wu)
    wr_st = frame(WR, 'wolfRider', 'front', 'stand'); bh_wr = body_height(wr_st)
    hu_st = frame(HU, 'longbowHunter', 'front', 'stand'); bh_hu = body_height(hu_st)
    k_wr, k_hu = HPX['wolfrider'][0] / bh_wr, HPX['infantry'][0] / bh_hu
    hood_wr, hood_hu = hood_width(wr_st) * k_wr, hood_width(hu_st) * k_hu
    wolf = frame(WR, 'wolfRider', 'front', 'boltA')
    ys, xs = np.nonzero(wolf)
    wolf_h, wolf_l = (np.ptp(ys) + 1) * k_wr / 2, (np.ptp(xs) + 1) * k_wr / 2
    out['packedToday'] = dict(wolfRiderScale=round(k_wr, 4), hunterScale=round(k_hu, 4),
                              riderHoodPx=round(hood_wr, 1), footHoodPx=round(hood_hu, 1), riderToFootHood=round(hood_wr / hood_hu, 2),
                              wolfRiderWu=[round(bh_wr * k_wr / 2, 1), round((np.ptp(np.nonzero(wr_st)[1]) + 1) * k_wr / 2, 1)],
                              wolfAloneWu=[round(wolf_h, 1), round(wolf_l, 1)])
    # the maquette (the same rig scale for rider and man)
    jm, k = guide_mask('wolfRiderJoint.front', 'stand')
    wm, _ = guide_mask('wolfOnly.front', 'boltA')
    rm, _ = guide_mask('wolfRiderSeat.front', 'stand')
    mm, km = guide_mask('longbowHunter.front', 'stand')
    out['maquette'] = dict(jointWu=[round(v, 1) for v in box_wu(jm, k)], wolfAloneWu=[round(v, 1) for v in box_wu(wm, k)],
                           riderSeatedWu=[round(v, 1) for v in box_wu(rm, k)], manWu=[round(v, 1) for v in box_wu(mm, km)],
                           riderToManHood=round((hood_width(rm) * k) / (hood_width(mm) * km), 2))
    # the painted proportions against the maquette's: the hood against the whole figure's body height
    out['painted'] = dict(hoodOverBody=round(hood_width(wr_st) / bh_wr, 3),
                          maquetteHoodOverBody=round(hood_width(jm) / body_height(jm), 3),
                          wolfLenOverBody=round((np.ptp(xs) + 1) / bh_wr, 3),
                          maquetteWolfLenOverBody=round((np.ptp(np.nonzero(wm)[1]) + 1) / body_height(jm), 3))
    hw = hood_width(wr_st)
    hm = hood_width(rm)
    wy, wx = np.nonzero(wm)
    out['wolfInHoods'] = dict(painted=[round((np.ptp(ys) + 1) / hw, 2), round((np.ptp(xs) + 1) / hw, 2)],
                              maquette=[round((np.ptp(wy) + 1) / hm, 2), round((np.ptp(wx) + 1) / hm, 2)])
    out['packerOpening'] = dict(standBboxPx=int(np.ptp(np.nonzero(wr_st)[0]) + 1), bodyHeightPx=int(bh_wr),
                                note='the 7 px opening cuts the wolf legs and the pennon pole: the scale is set by hood-to-chest')
    out['design'] = dict(manWu=28, size2Wu=[42, 60], tierSpxPerWu=2, heightPx=HPX)
    # the scale that makes the rider a man's size (hood to hood), and what that makes the whole figure
    fix = k_wr * hood_hu / hood_wr
    out['riderMatchedScale'] = dict(scale=round(fix, 4), wolfRiderWu=[round(bh_wr * fix / 2, 1), round((np.ptp(np.nonzero(wr_st)[1]) + 1) * fix / 2, 1)],
                                    heightPxTierS=round(bh_wr * fix, 1), wolfAloneWu=[round(wolf_h * fix / k_wr, 1), round(wolf_l * fix / k_wr, 1)])
    print(json.dumps(out, indent=1))
    json.dump(out, open(os.path.join(CAL, 'work', 'mount-size.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
