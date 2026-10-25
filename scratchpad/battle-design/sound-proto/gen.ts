// Writes the bank tables of the proposal from the catalog, so numbers and budgets agree.
import { writeFileSync } from 'node:fs';
import { BANK, IR, type Row } from './catalog';

const label = (tag: string): string => {
  const [k, v, w] = tag.split(':');
  switch (k) {
    case 'core': return 'always';
    case 'gore': return 'gore Standard+';
    case 'brutal': return 'gore Brutal';
    case 'missile': return 'any volley';
    case 'shield': return 'shielded units';
    case 'caster': return 'a caster exhausted';
    case 'big': return '120+ troops engaged';
    case 'charge': return 'a charge';
    case 'size3': return 'size 3+ unit';
    case 'size4': return 'size 4+ unit';
    case 'flying': return 'flyers';
    case 'pretender': return 'a pretender';
    case 'storm': return 'fort stormed';
    case 'aftermath': return 'aftermath';
    case 'lifeDrain': return 'life drain';
    case 'regen': return 'regeneration';
    case 'fireShield': return 'fire shield';
    case 'm2': return 'M2 (lazy)';
    case 'w': return `weapon ${v}`;
    case 'a': return `armor ${v}`;
    case 'e': return `element ${v}`;
    case 'v': return `voice ${v}`;
    case 'n': return `nation ${v}`;
    case 't': return v ?? '';
    case 's': return `${v} cast`;
    case 'f': return `field ${v}`;
    case 'mount': return `${v} mounts`;
    case 'c': return w ? `${v} ${w} spell` : `any ${v} spell`;
    default: return tag;
  }
};

const fams = new Map<string, Row[]>();
for (const r of BANK) fams.set(r.family, [...(fams.get(r.family) ?? []), r]);
const lines: string[] = [];
let n = 0;
for (const [f, rows] of fams) {
  n += 1;
  lines.push(`### 4.${n + 1} ${f}`, '');
  lines.push('| Id | Bus | kHz | Length (s) | Variants | Baked when | Recipe |', '|---|---|---|---|---|---|---|');
  for (const r of rows) {
    const needs = [...new Set(r.tags.split('|').map(label))].join(', ');
    lines.push(`| \`${r.id}\` | ${r.bus} | ${r.khz} | ${r.len} | ${r.v} | ${needs} | ${r.recipe.replace(/\|/g, '/')} |`);
  }
  lines.push('');
}
lines.push('### 4.16 Reverb impulse responses', '', 'Generated in pure code at the context sample rate, stereo, once per battle: exponentially decaying noise per band (low below 300 Hz, high above 4 kHz) with the RT60s below, decorrelated left and right, plus discrete echoes alternating left and right.', '');
lines.push('| Scene | Pre-delay (ms) | RT60 low / mid / high (s) | Discrete echoes (ms, dB) | Wet (dB) | Character |', '|---|---|---|---|---|---|');
for (const [k, v] of Object.entries(IR)) {
  lines.push(`| ${k} | ${v.pre} | ${v.rt60.join(' / ')} | ${v.echoes.map(([t, g]) => `${t} ms ${g}`).join(', ')} | ${v.wetDb} | ${v.note} |`);
}
writeFileSync(new URL('./bank-tables.md', import.meta.url), lines.join('\n') + '\n');
console.log('rows', BANK.length, 'families', fams.size);
