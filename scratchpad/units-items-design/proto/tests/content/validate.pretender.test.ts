// Content validation of what the pretender screen relies on (docs/05-pretender.md; docs/03
// decisions on NationDef.chassis): each nation's two different chassis, and the pip cap of
// docs/02-magic.md section 2 that the design costs, validatePretender, and the units share.
import { describe, expect, it } from 'vitest';
import { nationDef, unitDef, validateContent } from '../../src/content';
import { PRETENDER_COSTS } from '../../src/content/pretenders/costs';
import { MAX_PIPS } from '../../src/content/rules';
import { patched } from './patched';

describe('content validation of each nation’s chassis', () => {
  it('reports a nation whose two chassis are the same, or one that does not exist', () => {
    const thornwood = nationDef('thornwood');
    const problem = ['nation thornwood needs two different chassis'];
    patched(thornwood, 'chassis', ['titan', 'titan'], () => {
      expect(validateContent()).toEqual(problem);
    });
    patched(thornwood, 'chassis', ['titan', 'dragon'], () => {
      expect(validateContent()).toEqual(problem);
    });
    patched(thornwood, 'chassis', ['titan', 'wildSpirit'], () => {
      expect(validateContent()).toEqual([]);
    });
  });
});

describe('the pip cap', () => {
  it('is 6 in M1, and the design costs price every level up to it', () => {
    expect(MAX_PIPS).toBe(6);
    expect(PRETENDER_COSTS.pipLevel).toHaveLength(MAX_PIPS);
  });

  it('reports design costs that price fewer or more levels than the cap', () => {
    const problem = [`pip level costs must price levels 1 to ${String(MAX_PIPS)}`];
    const levels = PRETENDER_COSTS.pipLevel;
    patched(PRETENDER_COSTS, 'pipLevel', levels.slice(0, -1), () => {
      expect(validateContent()).toEqual(problem);
    });
    patched(PRETENDER_COSTS, 'pipLevel', [...levels, 45], () => {
      expect(validateContent()).toEqual(problem);
    });
  });

  it('allows a unit up to the cap in a color, and reports one above it', () => {
    const magus = unitDef('cinderMagus').commander!;
    patched(magus, 'pips', { R: MAX_PIPS }, () => {
      expect(validateContent()).toEqual([]);
    });
    patched(magus, 'pips', { R: MAX_PIPS + 1 }, () => {
      expect(validateContent()).toEqual([`unit cinderMagus bad pips R${String(MAX_PIPS + 1)}`]);
    });
  });
});
