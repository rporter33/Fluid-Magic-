# Fluid Magic rules as in src/content/pretenders/costs.ts and src/sim/pretender.ts (Red nation).
PIP=[40,20,25,30,35,40]; NEW=60; DOMPT=30; OWN,OTHER=20,40
CH={'oracle':(20,{},1,10),'titan':(120,{'R':1},2,0),'greatWyrm':(220,{'R':2},2,0),'livingMonolith':(60,{},4,0),'wildSpirit':(80,{'G':1},2,0),'ashColossus':(100,{'R':1},1,0)}
NATION=['R']; OWNPOLES={'orderTurmoil':'neg','loreFury':'neg'}  # Red's cheap poles
def cost(ch,pips,dom,scales,awak):
    c,base,bd,disc=CH[ch]; t=c; parts=[f"chassis {c}"]
    for col,lvl in pips.items():
        b=base.get(col,0); pc=0
        for L in range(b+1,lvl+1):
            pc+=(NEW if L==1 and col not in NATION else PIP[L-1])-disc
        t+=pc; parts.append(f"{col}{b}->{lvl}:{pc}")
    dc=max(0,dom-bd)*DOMPT; t+=dc; parts.append(f"dom {bd}->{dom}:{dc}")
    sc=0
    for ax,v in scales.items():
        pole='neg' if v<0 else 'pos'
        sc+=abs(v)*(OWN if OWNPOLES.get(ax)==pole else OTHER)
    t+=sc; parts.append(f"scales:{sc}")
    bud=400+{'awake':0,'dormant':150,'imprisoned':350}[awak]
    return t,bud,' + '.join(parts)
for name,args in [
 ('Bless rush (Warlord preset)',('titan',{'R':4},5,{'orderTurmoil':-2,'loreFury':-3},'awake')),
 ('Double bless R6 Titan',('titan',{'R':6},3,{'loreFury':-3},'awake')),
 ('Super combatant Great Wyrm',('greatWyrm',{'R':3},4,{'loreFury':-3},'awake')),
 ('Mage god Oracle R6 G2',('oracle',{'R':6,'G':2},4,{'loreFury':-2},'dormant')),
 ('Dominion push Monolith',('livingMonolith',{'R':1},10,{'orderTurmoil':-3,'loreFury':-3},'awake')),
 ('Scales sleeper Monolith',('livingMonolith',{},10,{'orderTurmoil':-3,'loreFury':-3,'growthRot':3,'wildArtifice':3,'sanctityDread':3},'imprisoned')),
]:
    t,b,p=cost(*args); print(f"{name}: {p} = {t} of {b}")
