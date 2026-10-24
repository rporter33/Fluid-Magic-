// The checks a loaded save is walked with (validateSave.ts): a record holds its required keys, a
// list is a list, an id names what it should, a color is one of W U B R G. Each check reads only,
// records what it finds, and skips an absent value, which the record holding it has already
// reported as a missing key, so one fault is reported once.
import { COLORS, isColor } from '../content/colors';
import { isId, type IdKind } from './ids';
import type { LoadFailure } from './loadError';

/**
 * shape: a required key missing, or no record or list where one belongs; reference: an id
 * naming nothing in the save or this build; color: a color key or value outside W U B R G.
 */
export type SaveProblemKind = Extract<LoadFailure, 'shape' | 'reference' | 'color'>;

export interface SaveProblem {
  kind: SaveProblemKind;
  text: string;
}

export type Obj = Record<string, unknown>;

export function isObj(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const shown = (value: unknown): string => JSON.stringify(value);

export class SaveCheck {
  readonly problems: SaveProblem[] = [];

  report(kind: SaveProblemKind, text: string): void {
    this.problems.push({ kind, text });
  }

  /** `value` as a record holding every key in `keys`; null (reported) when it is none. */
  record(at: string, value: unknown, keys: readonly string[]): Obj | null {
    if (value === undefined) return null;
    if (!isObj(value)) {
      this.report('shape', `${at} is not a record`);
      return null;
    }
    for (const key of keys) {
      if (!Object.hasOwn(value, key)) this.report('shape', `${at} has no ${key}`);
    }
    return value;
  }

  /** As `record`, with null allowed. */
  maybe(at: string, value: unknown, keys: readonly string[]): Obj | null {
    return value === null ? null : this.record(at, value, keys);
  }

  /** `value` as a list; empty (reported) when it is none. */
  list(at: string, value: unknown): readonly unknown[] {
    if (Array.isArray(value)) return value;
    if (value !== undefined) this.report('shape', `${at} is not a list`);
    return [];
  }

  /** A table of records keyed by id: each entry holds `keys` and has its own key as its id. */
  table(at: string, value: unknown, keys: readonly string[]): [string, Obj][] {
    const out: [string, Obj][] = [];
    for (const [key, entry] of Object.entries(this.record(at, value, []) ?? {})) {
      const rec = this.record(`${at}.${key}`, entry, keys);
      if (rec === null) continue;
      if (rec.id !== undefined && rec.id !== key) {
        this.report('reference', `${at}.${key} holds the id ${shown(rec.id)}`);
      }
      out.push([key, rec]);
    }
    return out;
  }

  /** A record of one of the kinds in `byKind`, holding `base` and that kind's keys. */
  kinded(
    at: string,
    value: unknown,
    byKind: Readonly<Record<string, readonly string[]>>,
    base: readonly string[] = [],
  ): Obj | null {
    const rec = this.record(at, value, []);
    if (rec === null) return null;
    const { kind } = rec;
    const keys = typeof kind === 'string' && Object.hasOwn(byKind, kind) ? byKind[kind] : undefined;
    if (keys === undefined) {
      this.report('shape', `${at} has no known kind (${shown(kind)})`);
      return null;
    }
    return this.record(at, rec, [...base, ...keys]);
  }

  /** An id naming one of `ids`, or null when `nullable`. */
  ref(at: string, value: unknown, ids: ReadonlySet<string>, nullable = false): void {
    if (value === undefined || (nullable && value === null)) return;
    if (typeof value !== 'string' || !ids.has(value)) {
      this.report('reference', `${at} ${shown(value)} names nothing in the save`);
    }
  }

  refs(at: string, value: unknown, ids: ReadonlySet<string>): void {
    this.list(at, value).forEach((v, i) => {
      this.ref(`${at}[${String(i)}]`, v, ids);
    });
  }

  /** A link that may outlive what it names: a well-formed id of `kind`, or null when `nullable`. */
  weak(at: string, value: unknown, kind: IdKind, nullable = false): void {
    if (value === undefined || (nullable && value === null)) return;
    if (!isId(value, kind)) this.report('reference', `${at} ${shown(value)} is no ${kind} id`);
  }

  /** A content id this build knows (`known`), or null when `nullable`. */
  content(
    at: string,
    value: unknown,
    known: (v: unknown) => boolean,
    what: string,
    nullable = false,
  ): void {
    if (value === undefined || (nullable && value === null)) return;
    if (!known(value)) {
      this.report('reference', `${at} ${shown(value)} is no ${what} of this build`);
    }
  }

  contents(at: string, value: unknown, known: (v: unknown) => boolean, what: string): void {
    this.list(at, value).forEach((v, i) => {
      this.content(`${at}[${String(i)}]`, v, known, what);
    });
  }

  color(at: string, value: unknown): void {
    if (value !== undefined && !isColor(value)) {
      this.report('color', `${at} ${shown(value)} is not one of W U B R G`);
    }
  }

  colors(at: string, value: unknown): void {
    this.list(at, value).forEach((v, i) => {
      this.color(`${at}[${String(i)}]`, v);
    });
  }

  /** A record keyed by color: only W U B R G, and every one of them when `all`. */
  byColor(at: string, value: unknown, all: boolean): void {
    for (const key of Object.keys(this.record(at, value, all ? COLORS : []) ?? {})) {
      if (!isColor(key)) {
        this.report('color', `${at} has the key ${shown(key)}, not one of W U B R G`);
      }
    }
  }
}
