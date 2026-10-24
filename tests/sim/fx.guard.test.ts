// The sim ignores fx (docs/02-magic.md section 5): a battle spell's effect family, scale and length
// are presentation, for the replay viewer only. A source scan, like adjacency.guard.test.ts, keeps
// src/sim, src/ai and src/mapgen from naming fx or importing content/fx; the battle rules
// fingerprint, which voids saved re-runs when the rules change, leaves fx out (spellRules), so a
// new look never voids one; and the named battles fight exactly as pinned whatever the fx.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SpellFx } from '../../src/content/fx';
import { BATTLE_SPELLS } from '../../src/content/spells';
import { battleRulesInput } from '../../src/sim/battle/rerun';
import { goldenEntries } from './battle/fixtures/golden';
import golden from './battle/golden.json';

const ROOT = resolve(import.meta.dirname, '../..');
const DIRS = ['src/sim', 'src/ai', 'src/mapgen'];

/** [pattern, name, whether it runs with string literals blanked]. */
const FORBIDDEN: readonly [RegExp, string, boolean][] = [
  [/\bfx\b/, 'fx', true],
  [/(['"`])fx\1/, "the key 'fx'", false],
  [/content\/fx\b/, 'content/fx', false],
];

/** The one 'fx' allowed: the prefix of province effect ids (fx0, fx1, ...), not a spell's look. */
const ALLOWED: Readonly<Record<string, string>> = { 'src/sim/ids.ts': "the key 'fx'" };

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Quoted strings blanked; template literals stay, so code inside `${...}` is still read. */
function blankStrings(code: string): string {
  return code.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.ts$/.test(name) ? [path] : [];
  });
}

function reads(file: string, source: string): string[] {
  const code = stripComments(source);
  const blanked = blankStrings(code);
  return FORBIDDEN.filter(
    ([pattern, name, blank]) => pattern.test(blank ? blanked : code) && ALLOWED[file] !== name,
  ).map(([, name]) => name);
}

/** Runs `run` with every battle spell's fx set to `fx`, then puts the real ones back. */
function withEveryFx(fx: SpellFx, run: () => void): void {
  const saved = BATTLE_SPELLS.map((s) => s.fx);
  try {
    for (const s of BATTLE_SPELLS) s.fx = fx;
    run();
  } finally {
    BATTLE_SPELLS.forEach((s, i) => (s.fx = saved[i]!));
  }
}

describe('the sim never reads a spell’s fx', () => {
  const files = DIRS.flatMap((d) => sourceFiles(join(ROOT, d))).map((f) => relative(ROOT, f));

  it('finds the sim, AI and mapgen sources', () => {
    expect(files.length).toBeGreaterThan(70);
  });

  it('names no fx and imports no content/fx in any of them', () => {
    const found = files.flatMap((file) =>
      reads(file, readFileSync(join(ROOT, file), 'utf8')).map((name) => `${file}: ${name}`),
    );
    expect(found).toEqual([]);
  });

  it('flags reads, keys and the import, but not comments, other words, or effect ids', () => {
    const f = 'src/sim/example.ts';
    expect(reads(f, 'const family = spell.fx.family;')).toEqual(['fx']);
    expect(reads(f, 'const { fx, ...rules } = spell;')).toEqual(['fx']);
    expect(reads(f, 'const look = `${spell.fx.family}`;')).toEqual(['fx']);
    expect(reads(f, "if (Object.hasOwn(spell, 'fx')) {}")).toEqual(["the key 'fx'"]);
    expect(reads(f, 'const v = spell["fx"];')).toEqual(["the key 'fx'"]);
    expect(reads(f, "import { FX_GRAMMAR } from '../content/fx';")).toEqual(['content/fx']);
    expect(reads(f, '// the sim ignores spell.fx; the viewer reads it')).toEqual([]);
    expect(reads(f, "const effects = spell.effects; const fxaa = 'fxs';")).toEqual([]);
    expect(reads('src/sim/ids.ts', "effect: 'fx',")).toEqual([]);
  });

  it('leaves fx out of the battle rules fingerprint, so a new look voids no re-run', () => {
    const before = battleRulesInput();
    expect(before).not.toContain('"fx"');
    expect(before).not.toContain('projectile');
    withEveryFx({ family: 'strike', scale: 3, duration: 1 }, () => {
      expect(battleRulesInput()).toBe(before);
    });
    expect(BATTLE_SPELLS.find((s) => s.id === 'emberDart')?.fx.family).toBe('projectile');
  });

  it('fights the named battles exactly as pinned with every spell’s fx changed', () => {
    withEveryFx({ family: 'field', scale: 2 }, () => {
      expect(goldenEntries()).toEqual(golden);
    });
  });
});
