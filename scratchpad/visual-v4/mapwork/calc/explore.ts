// How strong can an owner tint be before terrain pairs drop under 20 / 12? Palettes A (approved) and B (painted).
import * as L from './lib.ts';
const { T } = L;
const A: L.Pal = { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' };
const B: L.Pal = { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' };
for (const [name, P] of [['A', A], ['B', B]] as const) {
  console.log(`== ${name}`);
  for (const mode of ['over', 'keepL'] as const) for (const t of [0.08, 0.12, 0.16, 0.2, 0.25]) {
    // same owner: both provinces tinted by the same banner, raw state
    let sN = 1e9, sC = 1e9, sS = '';
    for (const b of L.BANNERS) { const r = L.pairs(P, (_t, f) => [L.tint(f, b, t, mode)]); if (r.wN.v < sN) sN = r.wN.v; if (r.wC.v < sC) { sC = r.wC.v; sS = `${b} ${r.wC.s}`; } }
    // cross: any tint (or none) against any other
    const opts = [null, ...L.BANNERS];
    const r2 = L.pairs(P, (_t, f) => opts.map((b) => L.tint(f, b, t, mode)));
    console.log(`${mode} t=${t}: same-owner ${L.f1(sN)}/${L.f1(sC)} (${sS}); any-owner ${L.f1(r2.wN.v)}/${L.f1(r2.wC.v)} under ${r2.under}/${r2.tot}  [${r2.wC.s}]`);
  }
}
