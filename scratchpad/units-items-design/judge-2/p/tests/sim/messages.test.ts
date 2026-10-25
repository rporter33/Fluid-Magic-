// The message log keeps each nation's most recent messages.
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../src/content/rules';
import { postMessage } from '../../src/sim/messages';
import type { NationId } from '../../src/sim/ids';
import { nationIds, twoNationGame } from './fixtures';

describe('postMessage', () => {
  it('stamps the day and keeps each nation within its own limit', () => {
    const state = twoNationGame();
    const [red, green] = nationIds(state) as [NationId, NationId];
    postMessage(state, red, 'info', 'first for red');
    for (let k = 0; k < MESSAGES.keep + 10; k++) postMessage(state, green, 'info', `green ${k}`);
    const reds = state.messages.filter((m) => m.nation === red);
    const greens = state.messages.filter((m) => m.nation === green);
    expect(reds.map((m) => m.text)).toEqual(['first for red']);
    expect(greens).toHaveLength(MESSAGES.keep);
    expect(greens[0]!.text).toBe('green 10');
    expect(greens.every((m) => m.day === 0 && m.province === null && m.battle === null)).toBe(true);
  });
});
