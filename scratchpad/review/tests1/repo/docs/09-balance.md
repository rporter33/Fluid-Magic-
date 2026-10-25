# Balance Log

Record every number changed from the docs during implementation, with the reason and
the test or playtest that motivated it. The docs stay the design intent; this file is
the truth for current values.

| Date | Doc | Field | From | To | Reason |
|------|-----|-------|------|----|--------|
| | | | | | |

## Playtest checklist (run before calling M1 done)

- [ ] A new player can start Cinder Horde with the Warlord preset and take 4 provinces by month 6 without reading docs.
- [ ] Thornwood beats Cinder Horde in roughly half of AI vs AI games on Medium maps (run 20 headless games with `npm run sim:aivai`).
- [ ] Armies larger than 60 troops in a Hills province starve within a month unless Thornwood with Growth 3.
- [ ] Research reaches level 4 in the nation color by month 24 with 4 mages.
- [ ] A match against one Normal AI ends by month 70 in most games (victory or defeat).
- [ ] No battle takes more than 100 ms to resolve.
- [ ] Save, reload, and continue produce the same state as not reloading (hash check).
