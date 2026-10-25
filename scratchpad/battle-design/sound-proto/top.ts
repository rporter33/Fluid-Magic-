import { BANK } from './catalog';
const rows = BANK.filter((r) => !r[5].includes('m2')).map(([id, k, len, ch, v]) => ({ id, MB: +(k * 1000 * len * ch * v * 4 / 1048576).toFixed(2) }));
rows.sort((a, b) => b.MB - a.MB);
console.log(rows.slice(0, 30).map((r) => `${r.id} ${r.MB}`).join('\n'));
const groups: Record<string, number> = {};
for (const r of rows) { const g = r.id.split('.')[0]!; groups[g] = (groups[g] ?? 0) + r.MB; }
console.log(Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([g, m]) => `${g}:${m.toFixed(1)}`).join('  '));
