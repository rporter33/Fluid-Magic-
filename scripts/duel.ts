// Staged duels of every pretender body against the Independent fixtures (the 2026-10-21
// pretender build spec, A.10), on the real resolver, bodies and rules:
// `npm run sim:duel -- [--seeds 400]` prints the table, a cell being the god's side's win rate
// with the god's HP left when it lives. `npm run sim:duel -- --calibrate` measures each chassis's
// AI power (A.11: the Light Infantry its body, battle-start summons and Fear beat in at least half
// of 200 seeds, times their armyPower term) and rewrites `aiPower` in
// src/content/pretenders/chassis.ts; tests/sim/battle/duel.test.ts checks content against it.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { CHASSIS, type ChassisId } from '../src/content/pretenders/chassis';
import {
  aiPowerOf,
  CALIBRATION_SEEDS,
  DUEL_FOES,
  DUEL_ROWS,
  duelCell,
  LIGHT_INFANTRY_TERM,
  lightInfantryEquivalent,
} from '../tests/sim/battle/fixtures/duel';

const { values } = parseArgs({
  options: {
    seeds: { type: 'string', default: '400' },
    calibrate: { type: 'boolean', default: false },
  },
});

const seeds = Number(values.seeds);
if (!Number.isInteger(seeds) || seeds < 1) {
  console.error('usage: npm run sim:duel -- [--seeds <n >= 1>] [--calibrate]');
  process.exit(1);
}

const percent = (x: number) => `${String(Math.round(100 * x))}%`;

function table(): void {
  console.log(
    `Seeds 0 to ${String(seeds - 1)}; a cell is the god's side's win rate, with the god's`,
  );
  console.log('HP left when it lives. Immobile bodies defend; every other god attacks.');
  console.log(`| Body | ${DUEL_FOES.map((f) => f.label).join(' | ')} |`);
  console.log(`|${'---|'.repeat(DUEL_FOES.length + 1)}`);
  for (const row of DUEL_ROWS) {
    const cells = DUEL_FOES.map((f) => {
      const c = duelCell(row, f, seeds);
      return c.hpLeft === null || c.win === 0
        ? percent(c.win)
        : `${percent(c.win)} (${percent(c.hpLeft)})`;
    });
    console.log(`| ${row.label} | ${cells.join(' | ')} |`);
  }
}

/** Rewrites one chassis record's aiPower in the chassis source; throws if it cannot find it. */
function withAiPower(source: string, id: ChassisId, power: number): string {
  const record = new RegExp(`(\\n  ${id}: \\{[\\s\\S]*?\\n    aiPower: )(\\d+)(,)`);
  if (!record.test(source)) throw new Error(`no aiPower line for chassis ${id}`);
  return source.replace(record, `$1${String(power)}$3`);
}

function calibrate(): void {
  const file = fileURLToPath(new URL('../src/content/pretenders/chassis.ts', import.meta.url));
  let source = readFileSync(file, 'utf8');
  console.log(
    `Light Infantry troop term: ${String(LIGHT_INFANTRY_TERM)}; ${String(CALIBRATION_SEEDS)} seeds a probe`,
  );
  console.log('| Chassis | n (Light Infantry beaten in at least half the seeds) | aiPower | was |');
  console.log('|---|---|---|---|');
  for (const id of Object.keys(CHASSIS) as ChassisId[]) {
    const n = lightInfantryEquivalent(id);
    const power = aiPowerOf(n);
    console.log(`| ${id} | ${String(n)} | ${String(power)} | ${String(CHASSIS[id].aiPower)} |`);
    source = withAiPower(source, id, power);
  }
  writeFileSync(file, source);
  console.log(`wrote ${file}`);
}

if (values.calibrate) calibrate();
else table();
