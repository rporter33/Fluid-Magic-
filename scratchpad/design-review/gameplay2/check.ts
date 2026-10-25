import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { labAs, deltaE2000, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';

const pretender = { chassis: 'x', dominion: 5, scales: { order: 0, lore: 0, growth: 0, wild: 0, sanctity: 0 }, pips: {} } as any;
try {
  const s = createGame({ seed: 7, mapSize: 'medium', nations: [
    { nation: 'cinderHorde', pretender, ai: null },
    { nation: 'cinderHorde', pretender, ai: { difficulty: 'normal' } },
    { nation: 'thornwood', pretender, ai: { difficulty: 'normal' } },
  ] } as any);
  for (const n of Object.values(s.nations)) console.log(n.id, n.name, n.color);
} catch (e) { console.log('createGame err', (e as Error).message); }

const R = COLOR_DEFS.R.palette, G = COLOR_DEFS.G.palette;
const cands: Record<string,string> = { Rp: R.primary, Rs: R.secondary, Ra: R.accent, Gp: G.primary, Gs: G.secondary, Ga: G.accent, ind: '#8C8A80' };
const keys = Object.keys(cands);
for (let i=0;i<keys.length;i++) for (let j=i+1;j<keys.length;j++) {
  const a=keys[i]!, b=keys[j]!;
  const d = VISIONS.map(v => deltaE2000(labAs(cands[a]!, v), labAs(cands[b]!, v)).toFixed(1));
  console.log(a, b, d.join(' '));
}
