import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath.ts';
const P: Record<string, string> = {
  forest: '#203309', grassLight: '#66742B', grassOpen: '#5D5E23', water: '#015D56',
  mountain: '#645C5A', snow: '#A9A098', sand: '#B09561',
};
const names = Object.keys(P);
const rows: string[] = [];
let fails = 0;
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const a = P[names[i]!]!, b = P[names[j]!]!;
  const d = VISIONS.map((v) => deltaE2000(labAs(a, v), labAs(b, v)));
  const worst = Math.min(d[1]!, d[2]!, d[3]!);
  const pass = d[0]! >= 20 && worst >= 12;
  if (!pass) fails++;
  rows.push(`| ${names[i]} / ${names[j]} | ${d[0]!.toFixed(1)} | ${worst.toFixed(1)} | ${pass ? 'pass' : 'FAIL'} |`);
}
console.log(rows.join('\n'));
console.log(`fails: ${fails} of ${rows.length}`);
