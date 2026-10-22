// Named battles of Phase 6b.2 (pretender build spec C.2, amendment 6): each exercises one of the
// new battle rules, N1 to N5. They join the detail-sink equivalence and re-run tests beside
// NAMED, but not the golden pin, which stays the 30 battles fought before the rules existed.
// The new chassis bodies arrive in Phase 6b.3, so the abilities ride on existing bodies here.
import { ABILITIES } from '../../../../src/content/abilities';
import { SPELLS } from '../../../../src/content/spells';
import type { WeaponDef } from '../../../../src/content/types';
import { commander, setup, side, squad } from '../fixtures';
import { attacking, caster, lone } from './armies';
import type { NamedFixture } from './named';

const TRAMPLE: WeaponDef = { name: 'Trample', dmg: 2, strikes: 2, maxTargetSize: 2 };

export const NAMED_6B2: readonly NamedFixture[] = [
  {
    name: 'primordialFear',
    note: 'Fear at battle start: every enemy at −2 morale, hornets brought under 50',
    build: () =>
      setup(
        side(
          [squad('a0', 'cinderWarrior', 20, { leader: 'p' })],
          [commander('p', 'greatWyrm', { abilities: [ABILITIES.primordialFear] })],
        ),
        side(
          [
            squad('d0', 'warden', 20, { leader: 'dc' }),
            squad('d1', 'hornetSwarm', 10, { leader: 'dc' }),
          ],
          [commander('dc', 'wardenCaptain')],
        ),
      ),
  },
  {
    name: 'pyreLordKindle',
    note: 'Kindle the Host: six Fire Sprites join at battle start',
    build: () =>
      setup(
        side(
          [squad('a0', 'cinderWarrior', 15, { leader: 'p' })],
          [commander('p', 'titan', { abilities: [ABILITIES.kindleTheHost] })],
        ),
        side([squad('d0', 'warden', 20), squad('d1', 'longbowHunter', 10)]),
      ),
  },
  {
    name: 'hunterCall',
    note: 'Call the Hunt: eight bound Wolves, and a commander that stays when they break',
    build: () =>
      setup(
        side(
          [squad('a0', 'warden', 10, { leader: 'h' })],
          [commander('h', 'titan', { abilities: [ABILITIES.callTheHunt] })],
        ),
        side([squad('d0', 'cinderWarrior', 20), squad('d1', 'flameArcher', 10)]),
      ),
  },
  {
    name: 'trample',
    note: 'a size-6 body tramples size-1 troops twice a round, never the giants',
    build: () =>
      lone(
        commander('w', 'greatWyrm', {
          row: 'front',
          script: attacking,
          stats: { weapons: [{ name: 'Bite', dmg: 10 }, TRAMPLE] },
        }),
        [squad('d0', 'thornMilitia', 25), squad('d1', 'giant', 3)],
      ),
  },
  {
    name: 'twoShields',
    note: 'fire and nature shields burn strikers in two events, fire first',
    build: () =>
      setup(
        side([squad('a0', 'cinderWarrior', 25), squad('a1', 'ashMilitia', 15)]),
        side([
          squad('d0', 'warden', 20, {
            stats: {
              shields: [
                { element: 'fire', amount: 3 },
                { element: 'nature', amount: 4 },
              ],
            },
          }),
          squad('d1', 'warden', 10, { stats: { shields: [{ element: 'nature', amount: 4 }] } }),
        ]),
      ),
  },
  {
    name: 'spellPower',
    note: 'a caster of spell power 3: every damage and heal 3 more',
    build: () =>
      setup(
        side(
          [squad('a0', 'cinderWarrior', 20, { leader: 'am' })],
          [
            caster('am', 'cinderMagus', [SPELLS.emberDart, SPELLS.fireball], {
              stats: { spellPower: 3 },
              pips: { R: 3 },
            }),
          ],
        ),
        side([squad('d0', 'thornMilitia', 30), squad('d1', 'longbowHunter', 10)]),
      ),
  },
  {
    name: 'boundWolves',
    note: 'a pretender’s bound wolves break without dragging it; its Wardens hold it',
    build: () =>
      setup(
        side(
          [
            squad('a0', 'wolf', 12, { leader: 'mo', bound: true }),
            squad('a1', 'warden', 10, { leader: 'mo' }),
          ],
          [commander('mo', 'titan', { row: 'front', script: attacking })],
        ),
        side([squad('d0', 'cinderWarrior', 25), squad('d1', 'flameArcher', 10)]),
      ),
  },
];
