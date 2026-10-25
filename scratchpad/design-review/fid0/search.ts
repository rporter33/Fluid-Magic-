import { labAs, deltaE2000, VISIONS, type Lab } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const fixed = ['#F3E6B8','#3A7BD5','#3D2B4F','#FD6533','#00674B','#8C8A80'];
const nExtra = Number(process.argv[2] ?? 6);
const extraFixed = (process.argv[3] ?? '').split(',').filter(Boolean);
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const hex = (r: number, g: number, b: number) => '#' + [r,g,b].map(x => Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('').toUpperCase();
const randHex = () => hex(rnd()*255, rnd()*255, rnd()*255);
const labs = (h: string) => VISIONS.map(v => labAs(h, v));
function score(set: string[]): number {
  const L = set.map(labs);
  let m = Infinity;
  for (let i = 0; i < set.length; i++) for (let j = i+1; j < set.length; j++) {
    VISIONS.forEach((v, k) => {
      const s = deltaE2000(L[i]![k] as Lab, L[j]![k] as Lab) / (v === 'normal' ? 20 : 12);
      if (s < m) m = s;
    });
  }
  return m;
}
let best: string[] = []; let bestS = -1;
for (let restart = 0; restart < 30; restart++) {
  let cur = Array.from({ length: nExtra }, randHex);
  let s = score([...fixed, ...extraFixed, ...cur]);
  for (let it = 0; it < 3000; it++) {
    const i = Math.floor(rnd() * nExtra);
    const old = cur[i]!;
    const r = parseInt(old.slice(1,3),16), g = parseInt(old.slice(3,5),16), b = parseInt(old.slice(5,7),16);
    const step = 60 * (1 - it/3000) + 4;
    cur[i] = hex(r + (rnd()-0.5)*step, g + (rnd()-0.5)*step, b + (rnd()-0.5)*step);
    const ns = score([...fixed, ...extraFixed, ...cur]);
    if (ns >= s) s = ns; else cur[i] = old;
  }
  if (s > bestS) { bestS = s; best = [...cur]; }
}
console.log(nExtra, 'extra; best min score (>=1 passes):', bestS.toFixed(3), best.join(' '));
