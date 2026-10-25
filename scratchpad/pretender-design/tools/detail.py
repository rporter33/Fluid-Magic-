import csv, sys
d=sys.argv[1]
units={r['id']:r for r in csv.DictReader(open(f"{d}/d6BaseU.csv",encoding='utf-8',errors='replace'),delimiter='\t')}
P='F A W E S D N G B H'.split()
skip=set('id name wpn1 wpn2 wpn3 wpn4 wpn5 wpn6 wpn7 armor1 armor2 armor3 armor4 rt reclimit rcost ressize enc ap startage maxage hand bow head body foot misc crownonly end mastersmith speciallook drawsize graphicsize nametype fixedname unique special'.split())
def show(i, depth=0):
    u=units[i]
    paths=' '.join(f"{k}{u[k]}" for k in P if u[k] not in ('','0'))
    rnd=[f"rand({u['rand'+str(k)]}% x{u['nbr'+str(k)]} mask{u['mask'+str(k)]} lvl{u['link'+str(k)]})" for k in range(1,7) if u.get('rand'+str(k)) not in ('','0',None)]
    base=f"hp{u['hp']} prot{u['prot']} mr{u['mr']} mor{u['mor']} str{u['str']} att{u['att']} def{u['def']} prec{u['prec']} size{u['size']} move{u['mapmove']} ldr{u['leader']} pc{u['pathcost'] or '-'} dom{u['startdom'] or '-'} basecost{u['basecost']}"
    stats=set('hp prot mr mor str att def prec size mapmove leader pathcost startdom basecost'.split())|set(P)|{f'{a}{k}' for a in ('rand','nbr','link','mask') for k in range(1,7)}
    ex=[f"{k}={v}" for k,v in u.items() if k not in skip and k not in stats and v not in ('','0',None)]
    print('  '*depth+f"[{i}] {u['name']}: {base} | {paths} {' '.join(rnd)} | {' '.join(ex)}")
    if depth==0:
        for k in ('shapechange','secondshape','firstshape'):
            v=u.get(k)
            if v not in ('','0',None) and v in units: show(v, depth+1)
for i in sys.argv[2:]: show(i)
