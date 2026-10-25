import { readFileSync } from 'node:fs';
import * as L from './lib.ts';
const P: L.Pal = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));
const TGT: L.Pal = { plains: '#6E7A3A', farmland: '#B39A5A', forest: '#24391A', hills: '#6A6436', mountains: '#7E8086', swamp: '#3F4A3A', wasteland: '#A89C8C' };
const A: L.Pal = { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' };
const B: L.Pal = { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' };
const rms = (Q: L.Pal) => Math.sqrt(L.T.reduce((s, t) => s + L.dN(P[t], Q[t]) ** 2, 0) / 7);
console.log(L.T.map((t) => `${t} ${L.f1(L.dN(P[t], TGT[t]))}`).join(', '));
console.log(`RMS from target ${L.f1(rms(TGT))}, from A ${L.f1(rms(A))}, from B ${L.f1(rms(B))}`);
for (const [n, Q] of [['A', A], ['B', B], ['v4', P], ['target', TGT]] as const) { const Ls = L.T.map((t) => L.Ls(Q[t])); const C = L.T.map((t) => L.oklch(Q[t])[1]); const sh: Record<string, number> = { mountains: 0.08, hills: 0.14, swamp: 0.08, forest: 0.22, wasteland: 0.1, farmland: 0.14, plains: 0.24 };
  console.log(`${n}: L* ${L.f1(Math.min(...Ls))}-${L.f1(Math.max(...Ls))}, area mean ${L.f1(L.T.reduce((s, t, i) => s + sh[t]! * Ls[i]!, 0))}; C mean ${(C.reduce((a, b) => a + b, 0) / 7).toFixed(3)}, max ${Math.max(...C).toFixed(3)}`); }
