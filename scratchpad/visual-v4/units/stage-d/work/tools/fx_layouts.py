# The nine pilot effect sheets (art plan 7.2, 7.5): output size, background and blend, and every element's box.
# Shared by fx_guides.py (the layout guides sent as Image 1), fx_prompts.py (the words) and fx_slice.py (cutting).
# Boxes are [x0, y0, x1, y1] in the generator's output pixels at the sheet's aspect (1:1 1024x1024, 4:3 1200x896,
# 3:2 1264x848, 16:9 1376x768). Every round thing on the ground is an ellipse squashed to 0.643 (the camera, design 8).
SQ = 0.643
SIZES = {'1:1': (1024, 1024), '4:3': (1200, 896), '3:2': (1264, 848), '16:9': (1376, 768)}


def grid(x0, y0, x1, y1, cols, rows, names, pad=8):
    w, h = (x1 - x0) / cols, (y1 - y0) / rows
    out = []
    for i, n in enumerate(names):
        c, r = i % cols, i // cols
        out.append({'name': n, 'box': [round(x0 + c * w + pad), round(y0 + r * h + pad), round(x0 + (c + 1) * w - pad), round(y0 + (r + 1) * h - pad)]})
    return out


SHEETS = {
    'E2': {'title': 'orb and meteor', 'aspect': '4:3', 'bg': 'black', 'blend': 'add', 'color': 'ember', 'els': [
        {'name': 'orbS', 'box': [40, 40, 250, 290], 'shape': 'sphere', 'r': 46},
        {'name': 'orbM', 'box': [280, 30, 560, 300], 'shape': 'sphere', 'r': 82},
        {'name': 'orbL', 'box': [580, 10, 920, 320], 'shape': 'sphere', 'r': 128},
        {'name': 'glow', 'box': [935, 20, 1190, 300], 'shape': 'glow', 'r': 118},
        {'name': 'trail', 'box': [30, 335, 1170, 495], 'shape': 'taper', 'thick': 110},
        {'name': 'meteor', 'box': [120, 515, 1170, 885], 'shape': 'meteor'},
    ]},
    'E3': {'title': 'fire burst', 'aspect': '3:2', 'bg': 'black', 'blend': 'add', 'color': 'ember',
           'els': [dict(e, shape='dome', k=k) for k, e in enumerate(grid(0, 0, 1264, 848, 3, 2, ['burst1', 'burst2', 'burst3', 'burst4', 'burst5', 'burst6']))]},
    'E4': {'title': 'embers and sparks', 'aspect': '1:1', 'bg': 'black', 'blend': 'add', 'color': 'ember',
           'els': [dict(e, shape=s, k=i % 4) for i, (e, s) in enumerate(zip(grid(0, 0, 1024, 1024, 4, 4, ['ember1', 'ember2', 'ember3', 'ember4', 'spark1', 'spark2', 'spark3', 'spark4',
                                                                                    'lick1', 'lick2', 'lick3', 'lick4', 'dot1', 'dot2', 'star1', 'star2'], pad=14),
                                                     ['fleck'] * 4 + ['streak'] * 4 + ['lick'] * 4 + ['softdot'] * 2 + ['star'] * 2))]},
    'E5': {'title': 'smoke', 'aspect': '16:9', 'bg': 'black', 'blend': 'luma', 'color': 'grey',
           'els': [dict(e, shape='puff', k=k) for k, e in enumerate(grid(0, 0, 1040, 768, 4, 2, ['puff%d' % i for i in range(1, 9)], pad=10))]
           + [{'name': 'column1', 'box': [1052, 16, 1206, 752], 'shape': 'column'}, {'name': 'column2', 'box': [1214, 16, 1368, 752], 'shape': 'column'}]},
    'E6': {'title': 'scorch decals', 'aspect': '3:2', 'bg': 'white', 'blend': 'multiply', 'color': 'char', 'els': [
        {'name': 'scorchRing', 'box': [20, 30, 640, 430], 'shape': 'ring'},
        {'name': 'crater', 'box': [680, 40, 1000, 260], 'shape': 'crater'},
        {'name': 'scorchDot', 'box': [1040, 70, 1240, 230], 'shape': 'blot'},
        {'name': 'burnPatch', 'box': [720, 280, 1244, 560], 'shape': 'patch'},
        {'name': 'burntTrack', 'box': [30, 590, 1234, 820], 'shape': 'track'},
    ]},
    'L1': {'title': 'thorns', 'aspect': '4:3', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam',
           'els': [dict(e, shape='thorns', k=i % 4, v=i // 4) for i, e in enumerate(grid(0, 0, 1200, 896, 4, 3, ['thornA%d' % s for s in range(1, 5)] + ['thornB%d' % s for s in range(1, 5)] + ['thornC%d' % s for s in range(1, 5)], pad=10))]},
    'L2': {'title': 'roots and vines', 'aspect': '4:3', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam',
           'els': [dict(e, shape='coil', k=i % 3, wither=i // 3) for i, e in enumerate(grid(0, 0, 1200, 740, 3, 2, ['coil1', 'coil2', 'coil3', 'wither1', 'wither2', 'wither3'], pad=12))]
           + [{'name': 'vineStrip', 'box': [30, 762, 1170, 880], 'shape': 'vine'}]},
    'L3': {'title': 'ground crack', 'aspect': '3:2', 'bg': 'white', 'blend': 'multiply', 'color': 'earth', 'els': [
        {'name': 'crackThin', 'box': [24, 24, 1240, 130], 'shape': 'crack', 'w': 10},
        {'name': 'crackWide', 'box': [24, 160, 1240, 300], 'shape': 'crack', 'w': 22},
        {'name': 'splitGround', 'box': [24, 330, 640, 830], 'shape': 'split'},
        {'name': 'rootScar1', 'box': [680, 340, 950, 560], 'shape': 'scar'},
        {'name': 'rootScar2', 'box': [970, 340, 1240, 560], 'shape': 'scar'},
        {'name': 'rootScar3', 'box': [820, 600, 1100, 830], 'shape': 'scar'},
    ]},
    'L4': {'title': 'leaves, petals, flowers', 'aspect': '1:1', 'bg': 'magenta', 'blend': 'normal', 'color': 'loam',
           'els': [dict(e, shape='leaf', k=i) for i, e in enumerate(grid(0, 0, 1024, 512, 6, 2, ['leaf%d' % i for i in range(1, 13)], pad=10))]
           + [dict(e, shape='petal', k=i) for i, e in enumerate(grid(0, 512, 1024, 736, 8, 1, ['petal%d' % i for i in range(1, 9)], pad=10))]
           + [dict(e, shape='flowers', k=i) for i, e in enumerate(grid(0, 736, 620, 1024, 3, 1, ['flowers1', 'flowers2', 'flowers3'], pad=10))]
           + [{'name': 'litter', 'box': [630, 746, 1014, 1014], 'shape': 'litter'}]},
}
BG = {'black': (0, 0, 0), 'white': (255, 255, 255), 'magenta': (255, 0, 255)}
