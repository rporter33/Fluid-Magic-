## UI chrome

The chrome stays dark and neutral so the map and the mana colors carry identity. Mana colors
never decorate chrome. They appear only on things that carry that color.

| Token | Value | Use |
|---|---|---|
| `--chrome-0` | #1C1A17 | panel base, top bar |
| `--chrome-1` | #26231F | raised rows, cards |
| `--chrome-2` | #322E28 | hover, selected tab |
| `--text` | #F4EEDF | parchment text and keylines |
| `--text-dim` | #F4EEDF at 60% | footers, hints, disabled labels |
| `--keyline` | 1 px `--text` at 25% | panel edges, action buttons |
| `--warm` / `--cool` | #E8A15A / #8DB6C8 | ▲ and ▼ deltas, always beside the arrow; `tests/content/palette.test.ts` checks both at 4.5:1 or more against `--chrome-0` |
| `--focus` | 2 px #F4EEDF outline, 2 px offset | `:focus-visible` on every control |

- **Type:** one display face for headers and one face with tabular figures for numbers. Body text
  is at least 14 px at 100% UI scale. All sizes are in `rem`.
- **Buttons:** action buttons (they issue a command) are filled `--chrome-2` with a keyline and
  print their cost. Navigation buttons (they open something) are ghost buttons with no keyline.
- **Terms and links:** concept terms are `--text` with a 1 px dotted underline, never a mana
  hue. Entity links carry a leading glyph (pin, portrait dot, banner, mana symbol) and underline
  on hover.
- **Cards** (unit, spell, chassis, battle report) share one frame: a rounded rectangle, a header
  band in the nation's secondary color, and a symbol row at the bottom.
- **Patterns** for states shown by color: 45° hatch (invalid or unreachable), dense cross-hatch
  (starving), hatch density per unrest step, dotted borders (fog). The same patterns appear
  in map modes and panels.
- **Motion:** panels appear without sliding. An Urgent alert pulses twice when it appears.
  Reduced motion removes the pulse, the idle bob and every UI tween.
