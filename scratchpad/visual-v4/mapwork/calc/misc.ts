import * as L from './lib.ts';
console.log('water vs snow', L.f1(L.dN('#50AF9B', '#F2EEE6')), L.f1(L.dC('#50AF9B', '#F2EEE6')));
console.log('water vs lit rock', L.f1(L.dN('#50AF9B', '#8A857E')), L.f1(L.dC('#50AF9B', '#8A857E')));
console.log('granite L', L.f1(L.Ls('#2A292C')), 'mere L', L.f1(L.Ls('#24222A')));
