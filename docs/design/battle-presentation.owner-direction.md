# Owner direction, 2026-10-29 (binding; quote verbatim in docs)

On resuming after the pause, the owner wrote:

> I also want to bake I to the home that the battles will be real time. Not in a weird round
> system. Maybe for the core systems but when viewing. It needs to okay out real time with pause
> and okay buttons of course

(Typos read as: "bake into the game", "it needs to play out in real time with pause and play
buttons".)

Read as:
1. **Watching a battle is continuous time.** The replay plays out as one flowing fight with
   pause and play, speed controls and a time scrubber. The player never sees, steps or counts
   rounds. No round cards, no "ROUND 4" in the header, no round drum, no back-a-round and
   forward-a-round buttons, no round ticks on the scrubber.
2. **The resolver may keep rounds inside.** The simulation's round loop (`docs/04`) stays as the
   deterministic core; it is an implementation unit the viewer hides, the way the day tick is
   hidden behind the strategic clock. "Maybe for the core systems" allows this and no more.
3. **Pause and play are the controls**, with the speeds and the scrubber the presentation already
   has. Stepping, where it exists, steps by beat (a cast, a charge, a death, a rout), never by
   round.
4. Where the docs or a mockup show rounds to the player, they change to continuous time. Battle
   events keep their `round` field for the log, tests and the Report, which may still say
   "early", "mid" and "late" or quote a time, never a round number, in what the player reads.
