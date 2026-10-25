
**Evidence.** Colour figures use the repo's own `tests/content/colorMath.ts` and `src/content/colors.ts`, copied verbatim into
`calc/` and `review/calc/` (diff-checked: identical). The numpy colour library `proto/natlib.py` matches them to 4 decimals on
CIEDE2000 under all four visions (`calc/parity.ts`). Rendered-pixel figures come from the mockup itself, with the natural bake
and the fixes injected in memory. The tooling is the independent verifier's own dump (`map/verify-final/dump-colors.cjs`) and
its own `colors.ts` (copied as `calc/lines.ts`). The review re-ran the rails check (identical output on the draft's states),
the rendered-pixel line checks and the classifier, and added the rows at the foot of the table.

