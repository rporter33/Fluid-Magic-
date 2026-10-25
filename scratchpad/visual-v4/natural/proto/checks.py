"""The natural view's other measured checks (natlib's colour math equals the repo's colorMath.ts to 4 decimals, calc/parity.ts):
snow against passable mountains (Natural, and Clear with the design's clamp), fog states on the natural ground, data modes over the natural
ground (rejected) or as their own raster (chosen), natural water, and the own-cover share on the mockup's map. Usage: python3 -I checks.py"""
import sys, os, json, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from natlib import *
m = load_meta(); BW, BH = m['BW'], m['BH']; T = ['plains', 'farmland', 'forest', 'hills', 'mountains', 'swamp', 'wasteland']
ID = load_arr('id', np.uint8, (BH, BW)); LT = load_arr('LT', np.uint8, (BH, BW)); DIST = np.load(os.path.join(DATA, 'dist.npy'))
terr = m['terr']; wild = m['wild']
tid = np.array([255 if wild[i] else T.index(terr[i]) for i in range(len(terr))] + [255] * (256 - len(terr)), np.uint8); TP = tid[ID]
nat = np.fromfile(os.path.join(DATA, 'natural.rgba'), np.uint8).reshape(BH, BW, 4)
VIS = ['normal', 'protan', 'deutan', 'tritan']
def dE(a, b):  # a, b: (..., 3) sRGB; returns normal and the worst deficiency
    out = [de2000(lab_as(a, v), lab_as(b, v)) for v in VIS]; return out[0], np.minimum(np.minimum(out[1], out[2]), out[3])
R = {}
# ---- snow against passable mountains
SNOW = hex2rgb('#F2EEE6')
mpx = nat[(TP == 4) & (LT < 7)][:, :3].astype(np.float64); n, c = dE(mpx, SNOW)
R['snow_natural_mountains'] = {'pixels': int(len(mpx)), 'within2012': int(((n < 20) | (c < 12)).sum()), 'minNormal': round(float(n.min()), 1), 'minCvd': round(float(c.min()), 1), 'Lmax': round(float(rgb2lab(mpx)[:, 0].max()), 1)}
allpx = nat[(LT < 7)][:, :3].astype(np.float64); n2, c2 = dE(allpx, SNOW)
R['snow_natural_all_passable'] = {'within2012': int(((n2 < 20) | (c2 < 12)).sum()), 'minNormal': round(float(n2.min()), 1), 'minCvd': round(float(c2.min()), 1)}
# Clear: the exported lightness change DL (relief + detail + micro-relief, after the mean removal) on the mountains albedo, as built and clamped
DL = load_arr('DL', np.float32, (BH, BW)); ALB = {'plains': '#78894A', 'farmland': '#D5B16B', 'forest': '#1A3819', 'hills': '#6D5303', 'mountains': '#859BB8', 'swamp': '#38616D', 'wasteland': '#877773'}
CAPc = {'plains': 4, 'farmland': 4, 'forest': 6, 'hills': 9, 'mountains': 16, 'swamp': 3, 'wasteland': 6}
for state, f in [('raw', lambda x: x), ('haze4', lambda x: x + (hex2rgb('#E8DCC2') - x) * 0.04)]:
    for t in ['mountains', 'plains', 'farmland', 'wasteland']:
        L0 = rgb2lab(hex2rgb(ALB[t])); msk = (LT == T.index(t)); d = DL[msk].astype(np.float64)
        for tag, dd in [('asBuilt', d), ('clamped', np.clip(d, -CAPc[t], 0.6 * CAPc[t]) - (np.clip(d, -CAPc[t], 0.6 * CAPc[t]).mean() - d.mean()))]:
            lab = np.stack([L0[0] + dd, np.full_like(dd, L0[1]), np.full_like(dd, L0[2])], -1); rgb = f(np.clip(lab2rgb(lab), 0, 255))
            nn, cc = dE(rgb, SNOW); R[f'snow_clear_{t}_{tag}_{state}'] = {'share2012': round(float(((nn < 20) | (cc < 12)).mean()), 4), 'minNormal': round(float(nn.min()), 1), 'minCvd': round(float(cc.min()), 1), 'Lmax': round(float(lab[:, 0].max()), 1), 'meanShiftAfterReneutral': round(float(dd.mean() - d.mean()), 3)}
# ---- fog on the natural ground: how far each state moves the ground (the frontier), approved values against the natural view's proposal
G = json.load(open(os.path.join(os.path.dirname(__file__), '..', 'calc', 'natural-grounds.json')))
def desat(x, t):
    L = rgb2lab(x); g = lab2rgb(np.stack([L[..., 0], L[..., 0] * 0, L[..., 0] * 0], -1)); return x + (g - x) * t
STATES = {'haze4 (approved)': lambda x: x + (hex2rgb('#E8DCC2') - x) * 0.04, 'outOfSight10 (approved)': lambda x: desat(x, 0.1),
          'natural unexplored: haze 10% + desaturate 25%': lambda x: desat(x + (hex2rgb('#E8DCC2') - x) * 0.10, 0.25), 'natural out of sight: desaturate 25%': lambda x: desat(x, 0.25)}
fog = {}
for sn, f in STATES.items():
    row = {}
    for t in T:
        g = np.array([hex2rgb(h) for h in G[t][2:5]]); nn, cc = dE(g, f(g)); row[t] = round(float(nn.mean()), 1)
    fog[sn] = row
g = np.array([hex2rgb(G[t][3]) for t in T]); u = STATES['natural unexplored: haze 10% + desaturate 25%'](g); o = STATES['natural out of sight: desaturate 25%'](g)
fog['unexplored vs out of sight (natural), per terrain'] = dict(zip(T, [round(float(v), 1) for v in dE(u, o)[0]]))
R['fog_frontier_dE_mean_p10_p50_p90'] = fog
# ---- data modes: the HEAT ramp drawn translucent over the natural ground (rejected) against its own opaque raster with +-3 L* relief (chosen)
HEAT = [hex2rgb(h) for h in ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6']]
grounds = np.array([hex2rgb(G[t][k]) for t in T for k in (1, 3, 5)])
modes = {}
for alpha in (0.6, 0.75, 0.9):
    worstN, worstC = 99, 99
    for k in range(4):
        a = HEAT[k] * alpha + grounds * (1 - alpha); b = HEAT[k + 1] * alpha + grounds * (1 - alpha)
        A = np.repeat(a, len(grounds), 0); B = np.tile(b, (len(grounds), 1)); nn, cc = dE(A, B); worstN = min(worstN, float(nn.min())); worstC = min(worstC, float(cc.min()))
    modes[f'translucent {alpha}'] = {'adjacentStopsWorstNormal': round(worstN, 1), 'worstCvd': round(worstC, 1)}
worstN, worstC = 99, 99
for k in range(4):
    la = rgb2lab(HEAT[k]); lb = rgb2lab(HEAT[k + 1])
    for da, db in [(3, -3), (-3, 3)]:
        a = lab2rgb(la + [da, 0, 0]); b = lab2rgb(lb + [db, 0, 0]); nn, cc = dE(a, b); worstN = min(worstN, float(nn)); worstC = min(worstC, float(cc))
modes['opaque raster with +-3 L* relief (chosen; identical in Natural and Clear)'] = {'adjacentStopsWorstNormal': round(worstN, 1), 'worstCvd': round(worstC, 1)}
R['data_modes'] = modes
# ---- natural water #14615B against the natural grounds (median and extremes), the mere and granite
W = hex2rgb('#14615B'); wat = {}
for t in T:
    g = np.array([hex2rgb(h) for h in G[t][2:5]]); nn, cc = dE(np.repeat(W[None], 3, 0), g); wat[t] = f'{nn.min():.1f}/{cc.min():.1f}'
for nm, h in [('mere', '#24222A'), ('granite', '#2A292C')]:
    nn, cc = dE(W, hex2rgb(h)); wat[nm] = f'{float(nn):.1f}/{float(cc):.1f}'
R['water_natural_vs_grounds_p10_p90_minNormal_minCvd'] = wat
# ---- the own-cover share on the mockup's map (natural.py's cover raster)
cov = np.fromfile(os.path.join(DATA, 'cover.bin'), np.uint8).reshape(BH, BW); sh = []
for i in m['provList']:
    msk = ID == i; own = cov[msk] == T.index(terr[i]); core = msk & (DIST >= 0.15)
    sh.append((terr[i], float(own.mean()), float((cov[core] == T.index(terr[i])).mean()) if core.sum() > 50 else None))
a = np.array([s[1] for s in sh]); cc = np.array([s[2] for s in sh if s[2] is not None])
R['own_cover_mockup_map'] = {'provinces': len(sh), 'wholeMin': round(float(a.min()), 3), 'wholeMedian': round(float(np.median(a)), 3), 'coreMin': round(float(cc.min()), 3), 'worst': sorted(sh, key=lambda s: s[1])[:3]}
print(json.dumps(R, indent=1)); json.dump(R, open(os.path.join(os.path.dirname(__file__), 'renders', 'checks.json'), 'w'), indent=1)
