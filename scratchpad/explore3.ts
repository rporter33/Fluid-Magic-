import { createGame } from '/home/user/fm-p6/src/sim/createGame';
import { playDay } from '/home/user/fm-p6/src/ai/driver';
import { nation } from '/home/user/fm-p6/tests/sim/fixtures';
const s = createGame({ seed: 3, mapSize: 'medium', nations: [nation('cinderHorde'), nation('thornwood', { ai: { difficulty: 'normal' } }), nation('thornwood', { ai: { difficulty: 'easy' } })] });
console.log(Object.values(s.nations).map(n => [n.id, n.name, n.ai, n.capital, n.banner]));
const calls: string[] = [];
for (let i = 0; i < 20; i++) playDay(s, (st, n) => { calls.push(`${st.day}:${n}`); return []; });
console.log(calls.join(' '), s.day);
