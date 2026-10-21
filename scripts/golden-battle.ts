// Rewrites tests/sim/battle/golden.json, the pin of the named battles' logs and outcomes
// (docs/12-battle-presentation.md, S1.9): `npm run golden:battle`. Run it only for a
// deliberate rule or content change, and name the change in the commit that carries the file.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { goldenEntries } from '../tests/sim/battle/fixtures/golden';

const out = fileURLToPath(new URL('../tests/sim/battle/golden.json', import.meta.url));
const entries = goldenEntries();
writeFileSync(out, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`wrote ${String(entries.length)} entries to ${out}`);
