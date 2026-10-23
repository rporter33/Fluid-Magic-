// Owner-made raster art (docs/09-art-direction.md, "Leader portraits" and "Delivery rule";
// docs/09-balance.md, "Raster art"): every portrait set in the bundle is complete, 8 or more
// faces for a recruited type and 4 for a summoned commander, each face in both sizes with its
// provenance sidecar and within its byte limit, and the rasters stay within their 2 MB. QA sweep
// DOC-4: the docs asked 8 faces of every set while the shipped summon sets have 4.
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isUnitTypeId, unitDef, type UnitTypeId } from '../../src/content';
import { SPELLS } from '../../src/content/spells';

const RASTER = resolve(import.meta.dirname, '../../src/assets/raster');
const PORTRAITS = join(RASTER, 'portraits');
/** docs/09-balance: 256 px faces at most 24 KB, 64 px ones at most 4 KB, 2 MB in all. */
const LIMITS = { face: 24 * 1024, small: 4 * 1024, total: 2_000_000 };

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

/** Unit types a ritual summons as a commander (docs/02 summonToProvince): the Salamander, the Treant. */
const SUMMONED = new Set<UnitTypeId>(
  Object.values(SPELLS).flatMap((spell) =>
    spell.effects.flatMap((e) => (e.kind === 'summonToProvince' && e.commander ? [e.unit] : [])),
  ),
);

/** Every set folder as nation/type, with the unit type it portrays (variants after a dash). */
const SETS = readdirSync(PORTRAITS)
  .filter((nation) => statSync(join(PORTRAITS, nation)).isDirectory())
  .flatMap((nation) =>
    readdirSync(join(PORTRAITS, nation)).map((folder) => ({
      dir: join(PORTRAITS, nation, folder),
      name: `${nation}/${folder}`,
      unit: folder.split('-')[0] ?? folder,
    })),
  );

describe('raster portraits', () => {
  it('portray commander types, every set complete: 4 faces when summoned, else 8 or more', () => {
    expect(SETS.length).toBeGreaterThan(0);
    expect(SUMMONED.size).toBeGreaterThan(0);
    for (const set of SETS) {
      expect(isUnitTypeId(set.unit), set.name).toBe(true);
      if (!isUnitTypeId(set.unit)) continue;
      const def = unitDef(set.unit);
      expect(def.commander, set.name).toBeDefined();
      const names = readdirSync(set.dir);
      const faces = names.filter((n) => /^\d+\.webp$/.test(n)).sort();
      if (SUMMONED.has(set.unit)) expect(faces, set.name).toHaveLength(4);
      else expect(faces.length, set.name).toBeGreaterThanOrEqual(8);
      faces.forEach((face, k) => {
        const nn = String(k + 1).padStart(2, '0');
        expect(face, set.name).toBe(`${nn}.webp`);
        expect(names, set.name).toContain(`${nn}-64.webp`);
        expect(names, set.name).toContain(`${nn}.json`);
      });
    }
  });

  it('keep each face within its size and the bundle’s rasters within 2 MB', () => {
    const webps = files(RASTER).filter((f) => f.endsWith('.webp'));
    let total = 0;
    for (const path of webps) {
      const bytes = statSync(path).size;
      total += bytes;
      if (!path.startsWith(PORTRAITS)) continue;
      const limit = path.endsWith('-64.webp') ? LIMITS.small : LIMITS.face;
      expect(bytes, path).toBeLessThanOrEqual(limit);
    }
    expect(total).toBeLessThanOrEqual(LIMITS.total);
  });
});
