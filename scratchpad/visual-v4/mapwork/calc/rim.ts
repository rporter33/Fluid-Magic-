import * as L from './lib.ts';
for (const b of [...L.BANNERS, '#91A092']) console.log(b, L.f1(L.dN(b, '#1E1B18')), L.f1(L.dC(b, '#1E1B18')), L.ok(b, '#1E1B18') ? 'direct' : 'keyline');
