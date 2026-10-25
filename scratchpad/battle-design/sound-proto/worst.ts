import { BANK, bytesOf, secondsOf, select } from './catalog';
const m1 = BANK.filter((r) => !r.tags.split('|').includes('m2'));
const tags = new Set(m1.flatMap((r) => r.tags.split('|')));
for (const t of ['t:plains', 't:farmland', 't:forest', 't:hills', 't:swamp', 't:wasteland', 'n:indep']) tags.delete(t);
const rows = select(tags);
console.log(`| Worst M1 battle (both nations, mountains, every unit, spell, field effect, fort storm) | ${rows.length} | ${rows.reduce((s, r) => s + r.v, 0)} | ${Math.round(secondsOf(rows))} | ${(bytesOf(rows) / 1048576).toFixed(1)} | ${(secondsOf(rows) / 100).toFixed(1)} | ${(secondsOf(rows) / 300).toFixed(1)} |`);
