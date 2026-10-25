// Does lifting the mode base of dark fills let the wild grounds pass every M1 mode fill directly?
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hx = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0').toUpperCase();
const toHex = (c: number[]) => `#${hx(c[0]!)}${hx(c[1]!)}${hx(c[2]!)}`;
const mix = (b: string, o: string, a: number) => toHex(rgb(b).map((v, i) => v * (1 - a) + rgb(o)[i]! * a));
const desat = (h: string, d: number) => { const c = rgb(h); const y = 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!; return toHex(c.map((v) => v * (1 - d) + y * d)); };
const dAll = (a: string, b: string) => VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
const L = (h: string) => labAs(h, 'normal')[0];
const FILLS: Record<string, string> = { Plains: '#C1D29F', Farmland: '#EEBA3A', Forest: '#374C2B', Hills: '#856824', Mountains: '#8DA4AD', Swamp: '#1A727A', Wasteland: '#AE897F' };
const M1 = ['#FD6533', '#51DDFC', '#3186F2', '#C98BAD', '#00674B', '#5C488E', '#B5D69C', '#8F0F04'];
const ALPHA = [0.34, 0.48, 0.6, 0.7];
for (const floor of [0, 40, 45, 50]) for (const g of ['#302F32', '#24222A']) {
  let n = 0, cvd12 = 0, both = 0, worstCvd = Infinity, worstN = Infinity;
  for (const f of Object.values(FILLS)) {
    let base = desat(f, 0.8);
    let k = 0; while (L(base) < floor && k < 1) { k += 0.02; base = mix(desat(f, 0.8), '#E8DCC2', k); }
    const cs = [base, ...M1.flatMap((b) => ALPHA.map((a) => mix(base, b, a)))];
    for (const c of cs) { const d = dAll(g, c); n++; const cv = Math.min(...d.slice(1)); worstCvd = Math.min(worstCvd, cv); worstN = Math.min(worstN, d[0]!); if (cv >= 12) cvd12++; if (cv >= 12 && d[0]! >= 20) both++; }
  }
  console.log(`base L* floor ${floor}, ground ${g}: ${n} M1 mode fills; CVD >= 12: ${cvd12}; 20/12: ${both}; worst normal ${worstN.toFixed(1)}, worst CVD ${worstCvd.toFixed(1)}`);
}
