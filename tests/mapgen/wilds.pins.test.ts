// Wild maps pinned (Phase 1b): sha256 of JSON.stringify(generateMap(...)) with wilds on. The
// sweeps cannot see a change that only picks another valid map (generateMap retries what
// validateMap rejects and keeps the best balanced candidate), such as the interior mask's
// tolerance or which graph the balance is measured on; a pin does. Recorded in commit A, then
// re-pinned in commit B for MAPGEN.balanceCandidates 6 to 10: the 7 four-nation maps that had no
// map within the 1.5 ratio among their first 6 valid candidates now keep a more balanced one of
// 10 (small-4-2 to 4-5, medium-4-1, 4-2 and 4-4); the other 13 are unchanged. Re-record these only
// for a change meant to move wild maps, and say so in docs/PROGRESS.md.
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateMap } from '../../src/mapgen/generate';
import { FOUR_CAPITALS, TWO_CAPITALS } from './fixtures';

const RECORDED: Readonly<Record<string, string>> = {
  'small-4-1': 'df7752b9f152a9f12210e42f04e301abf8255ea480d50ae85ee9c55f4b9d682f',
  'small-4-2': '84f1480b3e0aa3fb33393cec43a510cdeba928f65a2ceeb2edb7aaf45a8f613a',
  'small-4-3': '324ceb374e96425657ed9835b75f870c75d775dacbaa9d5ebe5e72c805942967',
  'small-4-4': 'c1af799eec4369ea497f872259eccc739a80e1bf0eea4f0175e474affe10b645',
  'small-4-5': 'ff46edb20541f2ca617d9f47b8cfcae1ea942bde751854396224f61e77952d4d',
  'medium-2-1': 'ed988bd6326d73fe44b28fc9b0ca3ef102d7562d3ee3da764b40e95854836b51',
  'medium-2-2': '5d43371424ba7a532a3b5998e657677c30c66f0d3deea39ab8058f7e1194d234',
  'medium-2-3': '623db7232fb27001af4f6f16d1f9b4780fa7e7299acd68c9f70e80e5caf9868c',
  'medium-2-4': 'de48b9d4a55db7330e380f92634e6db925cb1aa391ef05837b1773664839f7db',
  'medium-2-5': '6c3954c4063d5e2722f53612a3389a9046ab660c09f28b42747ae9441d1b2b87',
  'medium-4-1': '44871143fc83c90dd5f4ad6b46147e80d1c846de2c0b3b32f99eadf06a7ff829',
  'medium-4-2': '9da83f63ae79f6e401f0ab1476cd0765a5b7d06e09aafafd60811107208edd75',
  'medium-4-3': 'f79fff1dad2c8055a4d2687da3ae3077de127d1f9aba21fa09b2a157fcb47763',
  'medium-4-4': '0dad843fb045b79793e1ea46735760e30a9727ac469155998d286503cabd6520',
  'medium-4-5': 'b9d3cacf26d576ae28678d16edcfe2b880a08d0c50de418076813588d4e0ae5a',
  'large-2-1': 'db706ef845a13f9ee7ed7b484adadc6007a8fdf08f20c299c2bd079a16e19bec',
  'large-2-2': 'b7f55343e1c5ca9d3bd839736f9af83497c8f1159d9b27d5266b701bfb69ef50',
  'large-2-3': 'a37e1a83c2e607a72f7711b050fd412b9f719b1401b87c3b33aa5020dfc662aa',
  'large-2-4': '24e92b546e586c0d4a1af248e884905730041d28d6d11c8e3224021d76c0d709',
  'large-2-5': 'd6d05de17f27d956704e62828d52ef08f42c06defd5fadaf9bb0d392cc6a741c',
};

const CASES = (
  [
    ['small', FOUR_CAPITALS],
    ['medium', TWO_CAPITALS],
    ['medium', FOUR_CAPITALS],
    ['large', TWO_CAPITALS],
  ] as const
).flatMap(([size, capitals]) =>
  [1, 2, 3, 4, 5].map((seed) => ({ size, nations: capitals.length, capitals, seed })),
);

describe('wild maps pinned', () => {
  it.each(CASES)('$size, $nations nations, seed $seed', ({ size, nations, capitals, seed }) => {
    const map = generateMap({ seed, size, capitals, wilds: true });
    const hash = createHash('sha256').update(JSON.stringify(map)).digest('hex');
    expect(hash).toBe(RECORDED[`${size}-${nations}-${seed}`]);
  });
});
