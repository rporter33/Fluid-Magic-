import { commander, side, squad, fightOnce } from '/home/user/fm-godless/tests/sim/battle/fixtures';
import { gzipSync } from 'node:zlib';
import type { BattleEvent } from '/home/user/fm-godless/src/sim/battle/events';

// Stalemate: monolith pretender vs militia
const a = side([squad('a1', 'ashMilitia', 30, { leader: 'ac' })], [commander('ac', 'ashChieftain')]);
const d = side([], [commander('dp', 'livingMonolith', { row: 'front' })]);
const r = fightOnce(a, d, 2);
console.log('stalemate rounds', r.rounds, 'events', r.replay.length, 'bytes', JSON.stringify(r.replay).length, 'winner', r.winner);

// Per-phase kills in big battle using measure.ts's builder: reimplement quickly
import('./measure.ts').catch(() => {});
