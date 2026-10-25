"""Layout model for the overhead battle design (battle-design.md section 3), run on the
measured AI vs AI battles (b40.json). Ground units (wu). Prints the numbers the design cites."""
import json, math, sys, collections, os
d = json.load(open(sys.argv[1]))

KIND = {
 'lightInfantry':'line','ashMilitia':'line','thornMilitia':'line','swampFighter':'line',
 'heavyInfantry':'heavy','cinderWarrior':'heavy','warden':'heavy','briarGuard':'heavy','flamebrand':'heavy','oakheart':'heavy',
 'berserker':'shock','archer':'archers','flameArcher':'archers','longbowHunter':'archers','emberSkirmisher':'skirm',
 'ashRider':'wedge','wolfRider':'wedge','wolf':'pack','fireSprite':'flyers','hornetSwarm':'flyers','giant':'monster',
}
SIZE = {'oakheart':2,'giant':4}
# aspect, file, rank, minR, maxR
# dense masses (battle critique fix 3): ranks round(sqrt(n/aspect)), files x ranks spacing in wu
F = {'line':(1.5,13,12,3,10),'heavy':(1.2,13,12,4,10),'shock':(1.5,15,14,3,8),'archers':(3.0,16,15,2,5),
     'skirm':(8.0,30,26,1,2),'pack':(2.0,22,22,2,6),'flyers':(2.0,24,24,2,6),'monster':(99,1,1,1,1)}
FOOT = [1.0,1.3,1.8,2.5,3.3,4.3]
def block(unit, n):
    k = KIND[unit]; s = SIZE.get(unit,1); f = FOOT[s-1]
    if k == 'wedge':
        fs, rs = 20*1.3, 22*1.3  # riders are size 2 after U1 (units-and-items A.3)
        rows=[]; w=3; left=n
        while left>0: rows.append(min(w,left)); left-=w; w+=2
        if n<=4: rows=[n]
        return max(rows)*fs, len(rows)*rs, len(rows), max(rows)
    if k == 'monster':
        sp = 18*f+8; return n*sp, sp, 1, n
    a,fs,rs,mn,mx = F[k]; fs*=f; rs*=f
    ranks = max(mn, min(mx, round(math.sqrt(n/a)))); ranks = max(1, min(ranks, n))
    files = math.ceil(n/ranks)
    if files > 48: files = 48; ranks = math.ceil(n/files)
    return files*fs, ranks*rs, ranks, files
GAP, GAPC, MAXF = 24, 8, 1600
TOUCH = float(os.environ.get('TOUCH', '36'))
def side(units):
    rows = collections.defaultdict(list)
    for u in units:
        unit,n,row = u.split(':'); rows[row].append((unit,int(n)))
    out = {}
    for row in ('front','middle','rear'):
        bl = [block(u,n)+(u,n) for u,n in rows.get(row,[])]
        if not bl: out[row]=None; continue
        width = sum(b[0] for b in bl)+GAP*(len(bl)-1)
        lines = max(1, math.ceil(width/MAXF))
        depth = max(b[1] for b in bl)*lines + 40*(lines-1)
        out[row] = dict(width=min(width,MAXF), depth=depth, blocks=bl, lines=lines)
    return out
YAW, PITCH = math.radians(30), math.radians(40)
import os
_Y=math.radians(float(os.environ.get('YAW','30'))); _C,_S,_SP=math.cos(_Y),math.sin(_Y),math.sin(PITCH)
def proj(W, D, hmax):
    return _C*W+_S*D, _S*_SP*W+_C*_SP*D+hmax
def depth_of(s):
    dd = 140
    for row in ('front','middle','rear'):
        if s[row]: dd += s[row]['depth'] + 48
    return dd + 40   # commanders behind the rear band (one figure deep)
H1 = 28
res = []
for b in d:
    sa, sd = side(b['a']['units']), side(b['d']['units'])
    W = max([s[r]['width'] for s in (sa,sd) for r in ('front','middle','rear') if s[r]] + [200])
    D = depth_of(sa) + depth_of(sd)
    hmax = H1*max([1]+[3.4 for s in (b['a'],b['d']) for x in s['big']])
    pw, ph = proj(W+80, D+80, hmax)
    z = min(1920/pw, 900/ph); zc = max(0.55, min(1.7, z))
    # touching share at first contact, front rows, center-out by size, gaps closed to GAPC
    def lay(s):
        if not s['front']: return []
        bl = sorted(s['front']['blocks'], key=lambda x: -x[5])
        order = []
        for i,x in enumerate(bl): order = order+[x] if i%2==1 else [x]+order if i>0 else [x]
        width = sum(x[0] for x in order)+GAPC*(len(order)-1); x0 = -width/2; iv=[]
        for x in order: iv.append((x0, x0+x[0], x[5], x[4])); x0 += x[0]+GAPC
        return iv
    A, Z = lay(sa), lay(sd)
    tw = tot = 0
    for P,Q in ((A,Z),(Z,A)):
        NQ = sum(q[2] for q in Q)
        for p in P:
            for q in Q:
                w = p[2]*q[2]/NQ if NQ else 0
                gap = max(q[0]-p[1], p[0]-q[1], 0)
                tot += w; tw += w if gap <= TOUCH else 0
    res.append(dict(W=W, D=D, pw=pw, ph=ph, z=z, zc=zc, fig=H1*zc, touch=(tw/tot if tot else 1), nA=len(A), nZ=len(Z), lines=max([s[r]['lines'] for s in (sa,sd) for r in ('front','middle','rear') if s[r]]+[1])))
def pct(xs,p): xs=sorted(xs); return round(xs[min(len(xs)-1,int(p/100*len(xs)))],2)
for k in ('W','D','pw','ph','z','fig'):
    xs=[r[k] for r in res]; print(k, 'p10/p50/p90/p99/max', [pct(xs,p) for p in (10,50,90,99)], round(max(xs),2), 'min', round(min(xs),2))
print('zoom clamped at max 1.7:', sum(r['z']>=1.7 for r in res)/len(res), 'at min 0.55:', sum(r['z']<=0.55 for r in res)/len(res))
t=[r['touch'] for r in res]
print('touching share of melee attack mass: mean', round(sum(t)/len(t),3), 'share of battles at 100%', round(sum(x>0.999 for x in t)/len(t),3), 'p10', pct(t,10), 'min', round(min(t),3))
fr=collections.Counter((min(r['nA'],r['nZ'])>=3) for r in res); print('battles with >=3 front blocks on both sides', fr[True]/len(res))
print('rows needing a second line', sum(r['lines']>1 for r in res))
