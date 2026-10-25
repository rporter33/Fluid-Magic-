import { select } from './catalog';
const small = new Set(['core', 'gore', 'missile', 'shield', 'caster', 'e:fire', 'w:axe', 'w:bowShort', 'w:bowFire', 'w:staff', 'w:blade', 'w:bowLong', 'a:scale', 'a:bark', 'v:human', 'n:cinder', 'n:thorn', 't:hills', 'c:R', 'c:R:travel', 'c:R:damage', 'c:G', 'c:G:damage', 's:emberDart', 's:thornSpray', 's:bless', 'w:thrust']);
const rows = select(small).map((r) => ({ id: r.id, sec: +(r.len * r.v).toFixed(1), MB: +(r.khz * 1000 * r.len * r.v * 4 / 1048576).toFixed(2) })).sort((a, b) => b.MB - a.MB);
console.log(rows.slice(0, 30).map((r) => `${r.id.padEnd(26)} ${String(r.sec).padStart(5)} s ${r.MB} MB`).join('\n'));
