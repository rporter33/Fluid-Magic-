import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const dAll = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
const L = (h: string) => labAs(h, 'normal')[0];
for (const steps of [
  ['#56659C', '#8A74AE', '#C88A94', '#E8B27A', '#FAEAB0'],
  ['#4C5E96', '#8170AC', '#C4808E', '#E6AC6E', '#F8E6A6'],
  ['#506098', '#7E6DA8', '#B9768A', '#E19C5E', '#F7E3A0'],
]) {
  let adj = [] as string[]; for (let i = 0; i < 4; i++) { const d = dAll(steps[i]!, steps[i + 1]!); adj.push(`${d[0]!.toFixed(1)}/${Math.min(...d.slice(1)).toFixed(1)}`); }
  let gn = Infinity, gc = Infinity; for (const s of steps) for (const g of ['#302F32', '#24222A']) { const d = dAll(g, s); gn = Math.min(gn, d[0]!); gc = Math.min(gc, ...d.slice(1)); }
  console.log(`${steps.join(' ')} L* ${steps.map((s) => L(s).toFixed(0)).join('/')} adjacent (normal/minCVD) ${adj.join(', ')}; vs grounds ${gn.toFixed(1)}/${gc.toFixed(1)}`);
}
