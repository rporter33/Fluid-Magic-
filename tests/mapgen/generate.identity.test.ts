// Bit identity (Phase 1b, war-table design R14): with wilds off, the generator gives exactly the
// maps it gave before wilds existed. The hashes were recorded from the generator at ec9a907
// (Phase 6b.2), before the first line of the wilds change, by hashing JSON.stringify(map).
// The test drops the `wilds` key (always [] while off) and compares.
// Commit B raised MAPGEN.balanceCandidates from 6 to 10, so the hashes are now those of ec9a907's
// generator with that one number at 10 (recorded from a clean export of ec9a907 with it). 27
// of the 30 are the hashes recorded at 6. The other three found no map within the 1.5 ratio among
// their first 6 valid candidates and now keep a more balanced one of 10: small-4-4 (ratio 1.784
// to 1.412; at 6 it hashed 67de2035...), medium-4-5 (1.556 to 1.139; 2de8551a...) and large-4-1
// (2.157 to 1.647; 22d3b511...).
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { MapSizeId } from '../../src/content/mapgen';
import { generateMap } from '../../src/mapgen/generate';
import type { CapitalSpec, MapData } from '../../src/mapgen/types';
import { FOUR_CAPITALS, TWO_CAPITALS } from './fixtures';

const RECORDED: Readonly<Record<string, string>> = {
  'small-2-1': '1785b49bc1d5dcc98d98d738afa288ac39264838f5213900b39f9ebfb615083f',
  'small-2-2': 'f6710e101e7d6f51a11ef808e2a6926c04f262e8cd6839130733c553b0871eb9',
  'small-2-3': '9cc8b9f25216a0cad48c4497119dc3ae68c2fa7ab9316a43ef27943776a373de',
  'small-2-4': '3d23b21248c58c95c6ebd55ae6808516cde7f19acd8720f2f5933b316656b238',
  'small-2-5': '0f3f42c29c19c026644644be1ae6461eb6756ceeeacb52d77be6da80cfd62408',
  'small-4-1': '278f408990dc36a37aea39110585d6f89e3753ddb459b33367e4689ef042336c',
  'small-4-2': 'ac39a4ae8ccd4c5292515384a3104ecf65005eb8085caaac6ee0f85836f13ffd',
  'small-4-3': '52dac31fc7ff01b014d5e78bc58a9f4ed1339281509800164fd5d7309a58ff38',
  'small-4-4': '067c7ad79e94ad0cab1c3517d04688ee83eb7316e80d4e066820eac40ccbe768',
  'small-4-5': '3d0b3825d1a03c054c267e4265469bc636d1571723755c36d3b7cc8295f832f1',
  'medium-2-1': 'f9546ad8daab05216dd8970a391d08739b1e2efeaa2df2152394e32bbeb3751d',
  'medium-2-2': '40f82229ee03c7b8f7ec945a8df782f8ee8a55a939a88d6788ca936baef4aa41',
  'medium-2-3': 'eac470bdeb1f00b11f04617fdeced9225d7c0d865167bfe72471def71476f1cf',
  'medium-2-4': 'b199530e02353e466b1c19f272e769d059e01c628fe99f01eb52fd5db4b1f3a5',
  'medium-2-5': 'b6b9b6910654a86d0d4a15166dd0bb4b5c2e1df4e052e767a758104e551a5115',
  'medium-4-1': 'c762dae25845b26736e23c5d373359475debbe81c18d46707b7fc16212e0677a',
  'medium-4-2': '3e25d8e45de5830ed241f06c881e8044efcd575f9f0883bcd6530689b8f9a744',
  'medium-4-3': 'f61b93801b627b68f5ce4306eb9260a8e598a196b9f9b9c62098a8dd786a57bc',
  'medium-4-4': 'c839119ddf1b9e093a96554409a3e0acea5f4417e1395fcdcc0e091bc3417998',
  'medium-4-5': '988821626cd31aa9ab2605eeeb27fda38ce8aea7db1b37746c51cc6d44061fe8',
  'large-2-1': '97a8d939d0be8c3ebbc958599ba104b385afa6cd1a14aa164507ea47e23c0ded',
  'large-2-2': 'db57dccbd7053be0672a9dc4ae8c27cec9e9fed253a789489038bd0f239cc598',
  'large-2-3': '7654ec58f9fba9f30bfd172ec388f2268e60446c131319baf43d14577d944da2',
  'large-2-4': '871278d2c48d5100d6fbb8b023b55d72fe085571fdc58359bd9c0f7deebcf435',
  'large-2-5': '9e8dafd3823a3908129297ff9457dc198d0f80b4528029e10665733cdeccfe9c',
  'large-4-1': '3afd9eeb342deb559ec72e441a88d8b9a876736893bf69b8f327d7e93a8c463d',
  'large-4-2': '170c5e7f3da2b4ec42d8a4e601bd730ed14a2c0b086793d6e4ec71e66dff350c',
  'large-4-3': 'af1a331a68ff8a68f77840eb922bd40f2f71e490775f3e337ff6350a24aa0af4',
  'large-4-4': '80a67b2d0867fba591da8a9b6fc8842412708b684b6cef2d4c356fe598a1dbd3',
  'large-4-5': '0cce4bac4aa56e1c60752f0b3e8b657024472b5c6c8b89cb454ef186148cf7dd',
};

function hashWithoutWilds(map: MapData): string {
  const { wilds, ...rest } = map;
  expect(wilds).toEqual([]);
  return createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}

const SIZES: readonly MapSizeId[] = ['small', 'medium', 'large'];
const NATIONS: readonly (readonly CapitalSpec[])[] = [TWO_CAPITALS, FOUR_CAPITALS];
const CASES = SIZES.flatMap((size) =>
  NATIONS.flatMap((capitals) => [1, 2, 3, 4, 5].map((seed) => ({ size, capitals, seed }))),
);

describe('bit identity with wilds off', () => {
  it.each(CASES)('$size, $capitals.length nations, seed $seed', ({ size, capitals, seed }) => {
    const key = `${size}-${capitals.length}-${seed}`;
    expect(hashWithoutWilds(generateMap({ seed, size, capitals }))).toBe(RECORDED[key]);
    expect(hashWithoutWilds(generateMap({ seed, size, capitals, wilds: false }))).toBe(
      RECORDED[key],
    );
  });
});
