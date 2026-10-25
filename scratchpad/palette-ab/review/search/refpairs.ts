// The reference image's own terrain means (sampled in linear light from its forest, plains, farmland, barrens, peaks, marsh and hills
// areas) against docs/09's rule, with the repo's closestPair; and the L* spread of each palette.
import { closestPair, VISIONS, deltaE2000, labAs } from './colorMath.ts';
const P: Record<string, Record<string, string>> = {
  reference: { plains: '#997A43', farmland: '#AE823D', forest: '#716239', hills: '#A8854F', mountains: '#957F66', swamp: '#776C51', wasteland: '#BA8E5A' },
  bright: { plains: '#C1D29F', farmland: '#EEBA3A', forest: '#374C2B', hills: '#856824', mountains: '#8DA4AD', swamp: '#1A727A', wasteland: '#AE897F' },
  painted: { plains: '#D4DCC0', farmland: '#CEA265', forest: '#243F1B', hills: '#7D6542', mountains: '#9FB8D0', swamp: '#58696E', wasteland: '#9E8A91' },
  'warmmid-1': { plains: '#D2D295', farmland: '#E3A018', forest: '#2D4613', hills: '#7F650B', mountains: '#ACB9BF', swamp: '#567472', wasteland: '#A88C79' },
  'fixB-1': { plains: '#D4D6A6', farmland: '#E09D48', forest: '#1D3F0C', hills: '#7E653E', mountains: '#AABDC7', swamp: '#576B69', wasteland: '#AE928F' },
};
for (const [n, p] of Object.entries(P)) {
  const Ls = Object.values(p).map((h) => labAs(h, 'normal')[0]);
  const pairs = VISIONS.map((v) => { const c = closestPair(p, v); return `${v} ${c.deltaE.toFixed(1)} (${c.a}/${c.b})`; });
  let sum = 0, k = 0; const ks = Object.keys(p); for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) { sum += deltaE2000(labAs(p[ks[a]!]!, 'normal'), labAs(p[ks[b]!]!, 'normal')); k++; }
  console.log(`${n.padEnd(10)} L* ${Math.min(...Ls).toFixed(1)}-${Math.max(...Ls).toFixed(1)} | closest: ${pairs.join('; ')} | mean pair dE ${(sum / k).toFixed(1)}`);
}
