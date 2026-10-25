// Mana banked and research levels over time in headless games with the dummy AI (it researches
// with its mages and casts no rituals, so banked mana ~ cumulative income).
import { runnerSetups } from '/home/user/Fluid-Magic-/src/ai/match';
import { dummyPlayer } from '/home/user/Fluid-Magic-/src/ai/dummy';
import { playDay } from '/home/user/Fluid-Magic-/src/ai/driver';
import { createGame } from '/home/user/Fluid-Magic-/src/sim/createGame';
import { researchLevels } from '/home/user/Fluid-Magic-/src/sim/research';
import type { NationId } from '/home/user/Fluid-Magic-/src/sim/ids';

const games = Number(process.argv[2] ?? 8);
const researchers: Record<string, number[]> = {};
const checkpoints = [3, 6, 12, 18, 24, 36];
type Row = { mana: number[]; level: number[]; n: number };
const agg = new Map<string, Row>();
for (const setup of runnerSetups(1, games)) {
  const state = createGame(setup);
  for (const m of checkpoints) {
    while (!state.result && state.day < m * 30) playDay(state, dummyPlayer);
    if (state.result) break;
    for (const id of Object.keys(state.nations) as NationId[]) {
      const n = state.nations[id];
      if (!n) continue;
      const nationDefId = n.def;
      const color = n.colors[0];
      const key = `${nationDefId} m${String(m)}`;
      const r = agg.get(key) ?? { mana: [], level: [], n: 0 };
      r.mana.push(n.mana[color]);
      r.level.push(researchLevels(state, id)[color]);
      r.n++;
      agg.set(key, r);
    }
  }
}
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
console.log('| nation, month | games | own-color mana banked (median, min-max) | research level in own color (median, min-max) |');
console.log('|---|---|---|---|');
for (const [k, r] of agg) console.log(`| ${k} | ${String(r.n)} | ${med(r.mana).toFixed(0)} (${Math.min(...r.mana).toFixed(0)}-${Math.max(...r.mana).toFixed(0)}) | ${String(med(r.level))} (${String(Math.min(...r.level))}-${String(Math.max(...r.level))}) |`);
