import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { COLOR_DEFS } from '/home/user/Fluid-Magic-/src/content/colors';
import { NEUTRAL_SCALES } from '/home/user/Fluid-Magic-/src/content/pretenders/scales';
import { deltaE2000, labAs, VISIONS } from '/home/user/Fluid-Magic-/tests/content/colorMath';
const p = { chassis: 'titan', pips: {}, dominion: 5, scales: { ...NEUTRAL_SCALES }, awakening: 'awake' as const };
const s = createGame({ seed: 3, mapSize: 'medium', nations: [
  { nation: 'cinderHorde', pretender: p, ai: null },
  { nation: 'cinderHorde', pretender: p, ai: { difficulty: 'normal' } },
  { nation: 'thornwood', pretender: p, ai: { difficulty: 'normal' } },
  { nation: 'thornwood', pretender: p, ai: { difficulty: 'normal' } },
]});
for (const n of Object.values(s.nations)) console.log(n.id, n.name, n.color, COLOR_DEFS[n.color].palette.primary);
// what distinguishes two same-color nations in state?
const [a, b] = Object.values(s.nations);
const diff = Object.keys(a!).filter((k) => JSON.stringify((a as any)[k]) !== JSON.stringify((b as any)[k]));
console.log('fields that differ between the two Cinder Hordes:', diff.join(', '));
for (const c of ['R','G'] as const) {
  const pal = COLOR_DEFS[c].palette;
  for (const k of ['secondary','accent'] as const) {
    console.log(c, 'primary vs', k, VISIONS.map(v => v + ' ' + deltaE2000(labAs(pal.primary, v), labAs(pal[k], v)).toFixed(1)).join(', '));
  }
}
