// The god's name (docs/05-pretender.md decisions; the 2026-10-21 pretender build spec, D7 and
// B.2): createGame stores it, every arrival names the pretender commander with it, so messages
// and battle rosters carry it, and it changes nothing else in a played game.
import { describe, expect, it } from 'vitest';
import { runAi } from '../../src/ai/ai';
import { runMatch } from '../../src/ai/match';
import { defaultPreset } from '../../src/content/pretenders/presets';
import { attackersAt, fight, ownerForces } from '../../src/sim/conflict';
import type { NationId } from '../../src/sim/ids';
import { settlePretender } from '../../src/sim/pretender';
import type { GameSetup, GameState, PretenderDesign } from '../../src/sim/types';
import { neighbors, nationIds, pretender, twoNationGame } from './fixtures';

const TITAN_R4: PretenderDesign = pretender({
  chassis: 'titan',
  pips: { R: 4 },
  dominion: 2,
  awakening: 'awake',
});

function named(name: string | undefined, design: PretenderDesign = TITAN_R4) {
  const state = twoNationGame(
    1,
    name === undefined ? { pretender: design } : { pretender: design, pretenderName: name },
  );
  const [red, green] = nationIds(state) as [NationId, NationId];
  return { state, red, green };
}

function god(state: GameState, nation: NationId) {
  const id = state.nations[nation]!.pretenderId;
  return id === null ? undefined : state.commanders[id];
}

function texts(state: GameState, nation: NationId): string[] {
  return state.messages.filter((m) => m.nation === nation).map((m) => m.text);
}

describe('createGame and the name', () => {
  it('stores a valid name, and null when the setup gives none', () => {
    const vulkra = named('Vulkra');
    expect(vulkra.state.nations[vulkra.red]!.pretenderName).toBe('Vulkra');
    expect(vulkra.state.nations[vulkra.green]!.pretenderName).toBeNull();
    const plain = named(undefined);
    expect(plain.state.nations[plain.red]!.pretenderName).toBeNull();
    expect(plain.state.nations[plain.red]).toMatchObject({ pretenderReturnDay: null });
  });

  it('refuses an invalid name with its reason, after the design', () => {
    expect(() => named('')).toThrow(RangeError);
    expect(() => named('Vulkra the 2nd')).toThrow(
      "A god's name may use only Latin letters, spaces, apostrophes, hyphens and periods",
    );
    const tooLong =
      "A god's name has 1 to 24 symbols (letters, spaces, apostrophes, hyphens, periods)";
    expect(() => named('x'.repeat(25))).toThrow(tooLong);
    const over = { ...TITAN_R4, dominion: 99 };
    expect(() => named('Vulkra', over)).toThrow('Dominion must be 2 to 10');
    // The design is checked first: a bad name with a bad design gives the design's reason.
    expect(() => named('Vulkra 2', over)).toThrow('Dominion must be 2 to 10');
  });
});

describe('the named pretender on the map', () => {
  it('stands in its capital as its name, and its arrival says so', () => {
    const { state, red } = named("Vulkra d'Ash");
    const capital = state.map.provinces[state.nations[red]!.capital]!.name;
    expect(god(state, red)).toMatchObject({ unit: 'titan', name: "Vulkra d'Ash" });
    expect(texts(state, red)).toContain(`Vulkra d'Ash stands in ${capital}.`);
    // Without a name it takes its body's, as before.
    const plain = named(undefined);
    expect(god(plain.state, plain.red)?.name).toBe('Titan');
  });

  it('keeps the name when a sleeping god arrives and after a Godless recall', () => {
    const { state, red } = named('Ysolde', { ...TITAN_R4, awakening: 'dormant' });
    expect(god(state, red)).toBeUndefined();
    state.day = 330;
    settlePretender(state, red);
    expect(god(state, red)?.name).toBe('Ysolde');
    state.nations[red]!.godless = true;
    settlePretender(state, red);
    expect(texts(state, red)).toContain('Ysolde is recalled: the nation is godless.');
    state.nations[red]!.godless = false;
    settlePretender(state, red);
    expect(god(state, red)?.name).toBe('Ysolde');
  });

  it('is the name in the battle roster', () => {
    const { state, red } = named('Vulkra');
    const pretenderGod = god(state, red)!;
    const target = neighbors(state, state.nations[red]!.capital)[0]!;
    pretenderGod.location = target;
    fight(state, target, attackersAt(state, target, red), ownerForces(state, target));
    const record = state.battles.at(-1)!;
    expect(record.roster.attacker.commanders.map((c) => c.name)).toContain('Vulkra');
  });
});

describe('the name changes nothing but its own appearances (B.2)', () => {
  function play(name: string): string {
    const setup: GameSetup = {
      seed: 4,
      mapSize: 'medium',
      nations: [
        {
          nation: 'cinderHorde',
          pretender: defaultPreset('cinderHorde').design,
          pretenderName: name,
          ai: { difficulty: 'normal' },
        },
        {
          nation: 'thornwood',
          pretender: defaultPreset('thornwood').design,
          ai: { difficulty: 'normal' },
        },
      ],
    };
    return JSON.stringify(runMatch(setup, runAi, 365).state);
  }

  it('gives the same game, name aside, after 365 days of the AI', () => {
    const a = play('Qzxv');
    const b = play('Wryq');
    expect(a.split('Qzxv').length - 1).toBeGreaterThan(2);
    expect(b.includes('Qzxv')).toBe(false);
    expect(a.replaceAll('Qzxv', 'Wryq')).toBe(b);
  }, 120_000);
});
