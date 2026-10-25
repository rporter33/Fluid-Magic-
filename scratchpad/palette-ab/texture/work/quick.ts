import { evaluate, REC_V3 } from './eval';
import { TERRAINS, oklch, BRIGHT, f1, type Pal } from './lib';
const list = JSON.parse(process.argv[2]!) as [string, Pal][];
const cb = TERRAINS.reduce((s, t) => s + oklch(BRIGHT[t]).C, 0) / 7;
for (const [nm, P] of list) {
  const r = evaluate(P, REC_V3, nm, { quiet: true });
  const tw = r.rows.filter((x) => x.twin), di = r.rows.filter((x) => !x.twin);
  const cp = TERRAINS.reduce((s, t) => s + oklch(P[t]).C, 0) / 7;
  const worst = [...di].sort((a, b) => Math.min(a.nS / 15, a.cS / 10) - Math.min(b.nS / 15, b.cS / 10))[0]!;
  const band = r.out.find((l) => l.startsWith('all 11 banners'))!.match(/(\d+) FAIL/)![1];
  const wild = r.out.filter((l) => l.includes('ground #')).map((l) => l.replace(/.*closest normal (\S+) ([\d.]+), closest CVD (\S+) ([\d.]+)/, '$2/$4')).join(' ');
  console.log(`${nm.padEnd(14)} C ${f1((100 * cp) / cb)}% | raw ${f1(r.minRaw.n)}/${f1(r.minRaw.c)} | states: distinct ${f1(Math.min(...di.map((x) => x.nS)))}/${f1(Math.min(...di.map((x) => x.cS)))} (worst ${worst.k}) twins ${f1(Math.min(...tw.map((x) => x.nS)))}/${f1(Math.min(...tw.map((x) => x.cS)))} | band fails ${band} | wild ${wild}`);
}
