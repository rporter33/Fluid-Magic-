// Named battles, each staged to exercise one part of the resolver (docs/12-battle-presentation.md,
// S1.9). The golden test, the detail-sink equivalence tests, and the size pins run on them; S2
// moves them unchanged to src/present/battle/fixtures/ for the lab and the viewer's tests.
// Every fixture builds a fresh setup, so a test can fight one as often as it likes.
import { STORM } from '../../../../src/content/rules';
import { SPELLS } from '../../../../src/content/spells';
import type { BattleSetup } from '../../../../src/sim/battle/types';
import { commander, IMMORTAL, setup, side, squad } from '../fixtures';
import {
  attacking,
  caster,
  clash300,
  fieldBattle,
  lone,
  mageDuel,
  starting,
  stormed,
  wall300,
} from './armies';

export interface NamedFixture {
  name: string;
  /** What it exercises. */
  note: string;
  build: () => BattleSetup;
}

export const NAMED: readonly NamedFixture[] = [
  { name: 'starting', note: 'the starting armies, casters and priests', build: starting },
  { name: 'clash300', note: '300 v 300 in 13 squads, 12 commanders', build: clash300 },
  {
    name: 'skirmish',
    note: 'a small mixed fight',
    build: () =>
      setup(
        side(
          [
            squad('a0', 'cinderWarrior', 10, { leader: 'ac' }),
            squad('a1', 'flameArcher', 5, { leader: 'ac' }),
          ],
          [commander('ac', 'ashChieftain')],
        ),
        side(
          [
            squad('d0', 'warden', 10, { leader: 'dc' }),
            squad('d1', 'longbowHunter', 5, { leader: 'dc' }),
          ],
          [commander('dc', 'wardenCaptain')],
        ),
      ),
  },
  {
    name: 'archerScreen',
    note: 'free volleys against slow infantry, then closing',
    build: () =>
      setup(
        side([squad('a0', 'warden', 30), squad('a1', 'briarGuard', 10)]),
        side([squad('d0', 'thornMilitia', 10), squad('d1', 'longbowHunter', 30)]),
      ),
  },
  {
    name: 'cavalryCharge',
    note: 'lances with their first-round bonus',
    build: () =>
      setup(
        side([squad('a0', 'ashRider', 30)]),
        side([squad('d0', 'thornMilitia', 30), squad('d1', 'longbowHunter', 10)]),
      ),
  },
  {
    name: 'berserkers',
    note: 'rage below half HP, no rout',
    build: () => setup(side([squad('a0', 'berserker', 30)]), side([squad('d0', 'warden', 30)])),
  },
  {
    name: 'rout',
    note: 'a morale break; the commander routs with its line',
    build: () =>
      setup(
        side(
          [squad('a0', 'ashMilitia', 30, { leader: 'ac', stats: { mor: 6 } })],
          [commander('ac', 'ashChieftain')],
        ),
        side([squad('d0', 'cinderWarrior', 30), squad('d1', 'flameArcher', 10)]),
      ),
  },
  {
    name: 'retreatScript',
    note: 'a Retreat slot takes a commander and its squads away',
    build: () =>
      setup(
        side(
          [
            squad('a0', 'cinderWarrior', 15, { leader: 'ac' }),
            squad('a1', 'berserker', 10, { leader: 'ac' }),
          ],
          [
            commander('ac', 'ashChieftain', {
              script: [{ kind: 'hold' }, { kind: 'hold' }, { kind: 'retreat' }],
            }),
          ],
        ),
        side([squad('d0', 'warden', 30), squad('d1', 'longbowHunter', 15)]),
      ),
  },
  {
    name: 'pdDefense',
    note: 'provincial defense refs with no commander',
    build: () =>
      setup(
        side([squad('a0', 'cinderWarrior', 20), squad('a1', 'flameArcher', 10)]),
        side([
          squad('pd0', 'thornMilitia', 20, { row: 'front' }),
          squad('pd1', 'longbowHunter', 4),
        ]),
      ),
  },
  {
    name: 'stormFort',
    note: 'defenders of a stormed fort with walls standing',
    build: () =>
      setup(
        side(
          [
            squad('a0', 'cinderWarrior', 40, { leader: 'ac' }),
            squad('a1', 'flameArcher', 20, { leader: 'ac' }),
          ],
          [commander('ac', 'ashChieftain', { script: attacking })],
        ),
        stormed(
          side(
            [
              squad('d0', 'warden', 20, { leader: 'dc' }),
              squad('d1', 'longbowHunter', 10, { leader: 'dc' }),
            ],
            [commander('dc', 'wardenCaptain')],
          ),
          STORM.morale,
          STORM.wallsProt,
        ),
      ),
  },
  {
    name: 'pyreStorm',
    note: 'the big area spell on a packed front row',
    build: () =>
      setup(
        side(
          [squad('a0', 'cinderWarrior', 20)],
          [caster('am', 'cinderMagus', [SPELLS.pyreStorm], { carriedMana: { R: 2 } })],
        ),
        side([squad('d0', 'thornMilitia', 60)]),
      ),
  },
  { name: 'mageDuel', note: 'all eleven M1 battle spells', build: mageDuel },
  {
    name: 'swarm',
    note: 'a summoned flying squad joins mid-battle',
    build: () =>
      setup(
        side(
          [squad('a0', 'warden', 20)],
          [caster('am', 'elderDruid', [SPELLS.swarm], { carriedMana: { G: 2 } })],
        ),
        side([squad('d0', 'ashMilitia', 30), squad('d1', 'flameArcher', 10)]),
      ),
  },
  {
    name: 'fireShield',
    note: 'an Ash Colossus burns those who strike it',
    build: () =>
      lone(commander('c', 'ashColossus', { row: 'front', script: attacking }), [
        squad('d0', 'warden', 20),
        squad('d1', 'thornMilitia', 15),
      ]),
  },
  {
    name: 'lifeDrain',
    note: 'troops with the Black bless heal by their blows',
    build: () =>
      setup(
        side([squad('a0', 'cinderWarrior', 25, { stats: { lifeDrain: 2 }, hp: 200 })]),
        side([squad('d0', 'warden', 25)]),
      ),
  },
  { name: 'stormField', note: 'a storm grounds every shot', build: () => fieldBattle('storm') },
  { name: 'fogField', note: 'fog blinds the archers', build: () => fieldBattle('fog') },
  { name: 'wallField', note: 'a wall keeps the fronts apart', build: () => fieldBattle('wall') },
  {
    name: 'giants',
    note: 'size 4 troops with huge blows',
    build: () => setup(side([squad('a0', 'giant', 6)]), side([squad('d0', 'thornMilitia', 30)])),
  },
  {
    name: 'commanderDuel',
    note: 'a Titan against an Ash Chieftain',
    build: () =>
      setup(
        side([], [commander('t', 'titan', { row: 'front', script: attacking })]),
        side([], [commander('c', 'ashChieftain', { row: 'front', script: attacking })]),
      ),
  },
  {
    name: 'wyrm',
    note: 'size 6, flying, breath then bite',
    build: () =>
      lone(commander('w', 'greatWyrm', { row: 'front', script: attacking }), [
        squad('d0', 'warden', 25),
        squad('d1', 'longbowHunter', 15),
      ]),
  },
  {
    name: 'monolith',
    note: 'immobile and unarmed: str damage only',
    build: () =>
      lone(commander('m', 'livingMonolith', { row: 'front' }), [squad('d0', 'cinderWarrior', 12)]),
  },
  {
    name: 'oracle',
    note: 'a casting pretender in the rear',
    build: () =>
      setup(
        side(
          [squad('a0', 'warden', 20, { leader: 'o' })],
          [
            caster('o', 'oracle', [SPELLS.thornSpray, SPELLS.barkSkin, SPELLS.bless], {
              pips: { G: 3 },
              holy: 1,
            }),
          ],
        ),
        side([squad('d0', 'cinderWarrior', 20)]),
      ),
  },
  {
    name: 'wildSpirit',
    note: 'a regenerating pretender with claws',
    build: () =>
      lone(commander('s', 'wildSpirit', { row: 'front', script: attacking }), [
        squad('d0', 'ashMilitia', 15),
      ]),
  },
  {
    name: 'salamander',
    note: 'breath until its ammunition runs out, then unarmed',
    build: () =>
      lone(
        commander('s', 'salamander', {
          row: 'front',
          hp: 90,
          stats: { hp: 90, prot: 16, mor: 50 },
        }),
        [squad('d0', 'thornMilitia', 25)],
      ),
  },
  {
    name: 'treant',
    note: 'a huge regenerating commander',
    build: () =>
      lone(commander('t', 'treant', { row: 'front', script: attacking }), [
        squad('d0', 'cinderWarrior', 15),
        squad('d1', 'flameArcher', 10),
      ]),
  },
  {
    name: 'grind16',
    note: '300 v 300 at prot 16, mor 50: a long grind',
    build: () => wall300({ prot: 16, mor: 50 }),
  },
  {
    name: 'grind50',
    note: 'a grind to the round-50 withdrawal',
    build: () => wall300({ prot: 19, mor: 50 }),
  },
  { name: 'huge300', note: '300 v 300 with 8 mages', build: () => wall300({}, true) },
  {
    name: 'immortal',
    note: '300 v 300 nobody can wound: 50 rounds of strikes, the worst case',
    build: () => wall300(IMMORTAL),
  },
];

export function namedFixture(name: string): NamedFixture {
  const f = NAMED.find((x) => x.name === name);
  if (!f) throw new Error(`no named fixture ${name}`);
  return f;
}
