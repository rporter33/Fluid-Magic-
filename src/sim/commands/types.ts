// Commands (docs/06-architecture.md, "Commands"): the only way the player and the AI change a
// game. Each names the nation issuing it; validation rejects anything that nation does not
// own. Later phases add Wellspring claims and prophets.
import type { UnitTypeId } from '../../content';
import type { Color } from '../../content/colors';
import type { ManaAmounts } from '../../content/spells/types';
import type { TaxRate } from '../../content/rules';
import type { BuildingId } from '../../content/types';
import type { CommanderId, NationId, ProvinceId, RecruitId, SquadId } from '../ids';
import type { CommanderOrder, Formation, ScriptSlot } from '../types';

/**
 * Orders set by kind alone. Orders that carry progress or targets (move, build, castRitual, and
 * later claimWellspring) come only from their own commands, which compute that state.
 */
export type SimpleOrder = Extract<
  CommanderOrder['kind'],
  'idle' | 'pillage' | 'patrol' | 'research' | 'preach'
>;

export type Command = { nation: NationId } & (
  | { type: 'move'; commanders: CommanderId[]; path: ProvinceId[] }
  | { type: 'reverse'; commander: CommanderId }
  | { type: 'setOrder'; commander: CommanderId; order: SimpleOrder }
  | { type: 'setScript'; commander: CommanderId; slots: ScriptSlot[] }
  | { type: 'setFormation'; commander: CommanderId; squad: SquadId; formation: Formation }
  | {
      type: 'transferSquad';
      from: CommanderId;
      to: CommanderId;
      squad: SquadId;
      /** Troops to move; all of them when left out. */
      count?: number;
    }
  | { type: 'build'; province: ProvinceId; commander: CommanderId; building: BuildingId }
  | { type: 'recruit'; province: ProvinceId; unit: UnitTypeId; count: number }
  /** By id, so an item finishing between a render and a click cannot shift the target. */
  | { type: 'cancelRecruit'; province: ProvinceId; recruit: RecruitId }
  | { type: 'buyPd'; province: ProvinceId; levels: number }
  | { type: 'setTax'; province: ProvinceId; rate: TaxRate }
  /** Storm a fort this nation besieges; fought in the next tick. */
  | { type: 'storm'; province: ProvinceId }
  /** The color research points go to; progress in every color is kept. */
  | { type: 'setResearchColor'; color: Color }
  /**
   * Begin a ritual. Target null for rituals cast where the caster stands. `generic` splits the
   * generic cost between pools in whole amounts; by default it comes from the spell's color,
   * then the largest pools.
   */
  | {
      type: 'castRitual';
      commander: CommanderId;
      spell: string;
      target: ProvinceId | null;
      generic?: ManaAmounts;
    }
  /** Hand mana from the national pool to a commander standing in an own lab province. */
  | { type: 'giveMana'; commander: CommanderId; color: Color; amount: number }
);

export type CommandType = Command['type'];
export type CommandOf<T extends CommandType> = Extract<Command, { type: T }>;

export type CommandResult = { ok: true } | { ok: false; error: string };
