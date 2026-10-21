// What a BattleRecord keeps beyond the log (docs/04-battle.md, "Replay detail"): where the
// battle was fought, and for player battles the setup and starting rng that let the viewer
// fight it again blow by blow. Types only, so sim/types.ts imports them without a cycle.
import type { TerrainId } from '../../content/terrain';
import type { ProvinceId } from '../ids';
import type { RngState } from '../rng';
import type { StormState } from './setup';
import type { BattleCommanderSetup, BattleSideSetup } from './types';

/** A5: where it was fought. */
export interface BattleScene {
  terrain: TerrainId;
  /** Set when the battle was the storm of a fort. */
  storm: StormState | null;
}

/** A commander's setup with its spells by id, as saves hold it. */
export interface CommanderSetupRecord extends Omit<BattleCommanderSetup, 'spells'> {
  spells: string[];
}

export interface SideSetupRecord extends Omit<BattleSideSetup, 'commanders'> {
  commanders: CommanderSetupRecord[];
}

export interface BattleSetupRecord {
  province: ProvinceId;
  attacker: SideSetupRecord;
  defender: SideSetupRecord;
}

/** Everything a re-run needs: the setup and the rng state just before the battle. */
export interface BattleRerun {
  setup: BattleSetupRecord;
  rng: RngState;
  /**
   * `battleRulesHash()` when the battle was fought. A save from a build whose battle rules,
   * spells or units differ loads with a null re-run, since a re-run could then match the log
   * and still show rolls the battle never had.
   */
  rules: string;
}
