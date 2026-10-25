# Dom6 pretender cost rules (manual ch.3): path level added by you #n costs 8n, except the first
# level of a path the chassis lacks, which costs the chassis's new-path cost; candle #n above base
# costs 7n; scale click 40; awakening +150 / +350; budget 450. Bless points = sum(level-1).
def dom6(name, chassis_cost, pc, base_paths, target_paths, base_dom, dom, clicks, awak):
    cost = chassis_cost; detail=[]
    for p, lvl in target_paths.items():
        b = base_paths.get(p, 0); c = 0
        for i, L in enumerate(range(b+1, lvl+1), start=1):
            c += pc if (b == 0 and i == 1) else 8*i
        cost += c; detail.append(f"{p}{b}->{lvl}:{c}")
    dc = sum(7*n for n in range(1, dom-base_dom+1)); cost += dc
    sc = 40*clicks; cost += sc
    budget = 450 + {'awake':0,'dormant':150,'imprisoned':350}[awak]
    bp = sum(max(0, l-1) for l in {**base_paths, **target_paths}.values())
    print(f"{name}: chassis {chassis_cost} + paths {' '.join(detail)} + dominion {base_dom}->{dom}:{dc} + scales {clicks}x40:{sc} = {cost} of {budget} ({awak}); bless points {bp}")
dom6('Bless rush: Neter of the Sun', 250, 60, {'F':2,'S':1}, {'F':7,'S':2}, 3, 5, 1, 'awake')
dom6('Super combatant: Earth Serpent', 240, 80, {'E':2}, {'E':5}, 2, 4, 3, 'awake')
dom6('Rainbow mage: Arch Mage F1', 90, 10, {'F':1}, {p:2 for p in 'F A W E S D N G B'.split()}, 1, 5, 5, 'dormant')
dom6('Scales sleeper: God Block E3', 120, 40, {'E':3}, {'E':4}, 4, 10, 12, 'imprisoned')
dom6('Dominion push: Statue of Fertility', 170, 40, {'E':1,'N':2}, {'E':1,'N':4}, 4, 9, 4, 'awake')
dom6('Example from manual: Carrion Dragon', 160, 80, {'D':1,'N':1}, {'D':4,'N':4,'F':2}, 2, 5, 1, 'awake')
