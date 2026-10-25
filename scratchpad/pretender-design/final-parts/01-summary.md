
---

## 0. The design in sixteen lines

1. **Sixteen chassis in M1, eleven per nation**: the six of today plus ten new ones. Six are
   generic, five Red, five Green. A nation chooses from the generic realm and from the realms
   of its own colors.
2. **Prices follow a parity table.** Each chassis's cost is its base pips, its base dominion
   above 1, its built-in options and its body; the table is a snapshot test, and staged duels
   in the real resolver set the bodies (A.10).
3. **Seven small new rules carry the signatures**, each testable alone: battle-start
   abilities that fire existing primitives (N1); multi-strike weapons for trample (N2); spell
   power (N3); retaliation shields by element (N4); bound squads that never drag their
   commander into a rout (N5); a monthly summon (N7); reform after death for the Ash Phoenix
   (N8).
4. **Seven data-only design rules**: realms, a per-chassis price for a new color, scale
   attunement, a minimum awakening, starting springs, the god's name, and a role tag.
5. **Blessings become a Dominions 6-style menu.** Bless points per color are
   `max(0, pips − 1)`; an effect costs `max(1, requirement − 1)`; requirements run 2 to 6;
   one effect per group. Today's fixed bless is the default, so every existing design keeps
   its exact bless. Some effects are incarnate: they work only while the god is on the map.
6. **Two boons**: Sacred Spring 40 and Avatar 40. Iron Will, Undying, Chosen Host and Deep
   Lore are M2.
7. **Twelve presets**: today's six exactly unchanged and six new, each with a curated look.
   All fit their budgets (computed). The first preset of each nation stays the AI default.
8. **Customization follows AoW4's split**: any look on any build. The look lives outside
   `GameState`, in saved gods, the share code and the save file's UI block, and the sim cannot
   import it.
9. **Per chassis: 4 overlay slots × 3 variants**, from shared part families, plus markings,
   3 chosen color channels, up to 5 sliders, 3 poses, 2 aura shapes and 2 cast flourishes.
10. **Identity**: name, epithet, title, pronoun (it included), and a templated myth with an
    override; a sigil (6 frames × 16 charges) and a banner division (6). Banner colors stay
    fixed by the palette tests; the sigil carries identity by shape.
11. **Random god and random look** are seeded and reproducible, respect locks, and keep a
    10-roll history. **A share code** (`FM1-`, bit-packed, CRC-16, base64url) carries the
    whole god: 35 characters with a one-letter name, 67 for "Vulkra the Unburnt, Lord of
    Cinders", 527 at every maximum.
12. **Art**: 171 small SVG files in Phase 11 (49 body parts for the new chassis, 83 cosmetic
    parts, 16 portrait detail layers, 22 sigil shapes, 1 overlay), on existing rigs only.
    Markings, glyphs, auras, flourishes, divisions, poses and sliders are procedural.
13. **Flashy magic is a grammar**: look = template(primitive) × verb(color) ×
    material(element) × tier(level and breadth), plus the god's flourish. Every spell,
    ability and ritual gets a correct look on day one; the eleven M1 battle spells keep the
    battle design's storyboards and durations and gain layer, sound and reduced-motion detail.
14. **The map gets its own cue model** (`planMapFx`), fed by messages, with one optional sim
    addition: an effect tag on messages and a message to the victim of a hostile ritual.
15. **The designer has six steps in two groups**, BUILD (Body, Magic, Realm, Blessings) and
    LOOK (Appearance, Identity), beside a live preview and the `PretenderCard`. Every control
    validates the design its click would produce, as the UI spec rules.
16. **Plan**: Phase 6b in three commits (design rules; battle rules after the battle track's
    S1; map rules and content), then additions to Phases 8 to 12. **M2**: White, Blue and
    Black chassis and menus, the deferred bodies and boons, element resistances, map and menu
    sound, the free color picker, 6 × 5 slots.

---

## 1. Decisions

The draft's decision table, corrected. P2, P3, P5, P7, P8, P9, P10 and P11 stand as the draft
argued them; the others changed.

| # | Topic | Decision | Why |
|---|---|---|---|
| P1 | Who may take which chassis | **Realms**: generic chassis for everyone, color chassis for nations with that color in their identity | Dominions gives each nation its own pool of pretenders ([dom6inspector data](https://github.com/larzm42/dom6inspector/tree/master/gamedata)); a realm keeps 11 cards per nation instead of 16 and keeps balance testable. M3 two-color nations get both realms. It replaces the `docs/05` line "The nation offers all chassis" |
| P2 | Trample on the existing size-5 and size-6 bodies | **No**; new bodies only | Measured in the draft: trample 3 × 2 lifted the Great Wyrm from 76% to 100% against 20 Heavy Infantry. Today's presets and Phase 7's tuning stay untouched |
| P3 | Fear | **A battle-start morale debuff**, −2 for the battle on every enemy group | A forced check every round would break a morale-10 squad 46% of the time per round (draft) |
| P4 | Incarnate blessings | **An explicit flag per effect**; the standard and greater forms (today's bless) are never incarnate | The flag does not depend on any threshold rule. The manual confirms incarnate effects work only while the god is awake and alive; the "5 or more in a path" rule is illwiki's, and the manual's own marking (bold) did not survive transcription ([manual ch. 3](https://dmacguigan.github.io/dom6-manual/chapters/03-the-pretender.html); [illwiki](https://illwiki.com/dom5/dom6/bless)) |
| P5 | Where the look lives | **Outside `GameState`** | The sim cannot read what it does not hold |
| P6 | The god's name | **A sim string**, `NationState.pretenderName` | Messages are prebuilt strings in the sim and battle rosters carry commander names; a label never changes an outcome, and B.2 tests that |
| P7, P8 | Particle counts, full-scene flash | **The battle design wins** (S2.10, S2.14) | It is the final battle spec |
| P9 | Chromatic aberration at the god's death | **No in M1**; open question | Players report eye strain from it ([example](https://thegameswiki.com/crimson-desert/wiki/chromatic-aberration)) |
| P10 | Map and designer sound | **None in M1** | The battle design keeps music and map or menu sound out of M1; the UI spec's ruling 19 has no UI cues |
| P11 | Six designer steps | **Two labeled groups on a rail** | The designer is a full screen, which the UI spec exempts from its 4-tab limit for dock panels (UI spec 1.1); grouping still keeps BUILD before LOOK, as AoW4 does ([GamePressure](https://www.gamepressure.com/age-of-wonders-4/creating-factions/za10c3c)) |
| P12 | A stealthy army leader (Horned Hunter) | **Not stealthy** | `isStealthy` (`src/sim/commanders.ts`) hides a stealthy commander only while every squad it leads is stealthy, so a stealthy Hunter would hide only when it walks alone. That adds a lone-scout role the Wild Spirit already owns |
| P13 | Summoned and monthly troops routing their god | **Bound squads never drag their commander** (N5) | Measured: the Horned Hunter with 8 battle-summoned wolves wins 79% against the weak plains fixture under N5; the Mother of Beasts with 12 bound wolves wins 92% (with ordinary wolves, 32%) |
| P14 | Iron Will | **Not in M1** | Rulings R3 |
| P15 | Bless points | **Per color** | Rulings R7 |
